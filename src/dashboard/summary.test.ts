import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { rowCountQueries } from "./summary";

describe("dashboard row counts", () => {
  it("batches large schemas below SQLite's compound-select limit", () => {
    const queries = rowCountQueries(
      Array.from({ length: 501 }, (_, index) => `table_${index}`),
    );
    expect(queries).toHaveLength(3);
    expect(queries[0].match(/SELECT/g)).toHaveLength(200);
    expect(queries[2].match(/SELECT/g)).toHaveLength(101);
    expect(queries[2]).toContain("SELECT 500 AS table_index");
  });

  it("quotes names and returns the right counts", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run(
      'CREATE TABLE "a""b" (id INTEGER); INSERT INTO "a""b" VALUES (1), (2)',
    );
    const result = db.exec(rowCountQueries(['a"b'])[0]);
    expect(result[0].values).toEqual([[0, 2]]);
    db.close();
  });
});
