import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { primaryKeyPredicate } from "./rowMutation";

describe("table row mutations", () => {
  it("uses every column of a composite primary key", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run(
      "CREATE TABLE assignments (team TEXT, person TEXT, role TEXT, PRIMARY KEY(team, person)); INSERT INTO assignments VALUES ('A', 'Ada', 'lead'), ('A', 'Bob', 'member');",
    );
    const where = primaryKeyPredicate(
      [
        { name: "team", primary: true },
        { name: "person", primary: true },
        { name: "role", primary: false },
      ],
      ["team", "person", "role"],
      ["A", "Ada", "lead"],
    );
    expect(where).toBe("\"team\" = 'A' AND \"person\" = 'Ada'");
    db.run(`DELETE FROM assignments WHERE ${where}`);
    expect(db.exec("SELECT person FROM assignments")[0].values).toEqual([
      ["Bob"],
    ]);
    db.close();
  });

  it("rejects mutations without a complete key and escapes values", () => {
    expect(primaryKeyPredicate([], ["id"], [1])).toBeNull();
    expect(
      primaryKeyPredicate([{ name: "id", primary: true }], ["other"], [1]),
    ).toBeNull();
    expect(
      primaryKeyPredicate([{ name: "id", primary: true }], ["id"], ["O'Brien"]),
    ).toBe("\"id\" = 'O''Brien'");
    expect(
      primaryKeyPredicate([{ name: "id", primary: true }], ["id"], [null]),
    ).toBeNull();
  });
});
