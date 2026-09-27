import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import {
  makeTableImportSql,
  parseDelimited,
  parseJsonDocuments,
  toCsv,
} from "./formats";

describe("local file formats", () => {
  it("parses quoted CSV, multiline fields and inferred types", () => {
    const parsed = parseDelimited(
      'name,amount,note\r\n"Ada, Jr",12.50,"line one\nline two"\r\nBob,,"said ""hello"""',
    );
    expect(parsed.columns).toEqual(["name", "amount", "note"]);
    expect(parsed.types).toEqual(["TEXT", "REAL", "TEXT"]);
    expect(parsed.rows).toEqual([
      ["Ada, Jr", 12.5, "line one\nline two"],
      ["Bob", null, 'said "hello"'],
    ]);
  });

  it("normalizes MongoDB extended JSON and nested values", () => {
    const parsed = parseJsonDocuments(
      '{"_id":{"$oid":"abc"},"nested":{"x":1}}\n{"_id":{"$oid":"def"},"nested":{"x":2}}',
    );
    expect(parsed.columns).toEqual(["_id", "nested"]);
    expect(parsed.rows[0]).toEqual(["abc", '{"x":1}']);
  });

  it("preserves JSON values when display headers are normalized", () => {
    const parsed = parseJsonDocuments(
      '[{" Name ":"Ada","name":"Lovelace","NAME":"Mathematician"}]',
    );
    expect(parsed.columns).toEqual(["Name", "name_2", "NAME_3"]);
    expect(parsed.rows).toEqual([["Ada", "Lovelace", "Mathematician"]]);
  });

  it("keeps all-empty CSV records but skips actual blank lines", () => {
    const parsed = parseDelimited('first,second\n,\n\n"",value\n');
    expect(parsed.rows).toEqual([
      [null, null],
      [null, "value"],
    ]);
  });

  it("builds executable and escaped SQLite imports", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const data = parseDelimited("name,value\nO'Brien,42\nAlice,7");
    const script = makeTableImportSql(data, 'people"test', "create");
    db.exec(script);
    const result = db.exec(
      'SELECT name, value FROM "people""test" ORDER BY value',
    );
    expect(result[0].values).toEqual([
      ["Alice", 7],
      ["O'Brien", 42],
    ]);
    expect(
      toCsv(
        result[0].columns,
        result[0].values as (string | number | null)[][],
      ),
    ).toContain('"O\'Brien","42"');
    db.close();
  });
});
