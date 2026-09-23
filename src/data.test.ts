import { describe, expect, it } from "vitest";
import { databases } from "./data";

describe("demo database metadata", () => {
  it("has unique database and table names", () => {
    expect(new Set(databases.map((db) => db.name)).size).toBe(databases.length);
    for (const db of databases) {
      expect(new Set(db.tables.map((table) => table.name)).size).toBe(
        db.tables.length,
      );
      for (const table of db.tables) {
        expect(new Set(table.columns.map((column) => column.name)).size).toBe(
          table.columns.length,
        );
        expect(
          table.columns.filter((column) => column.primary).length,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("resolves every foreign key to a real table and column", () => {
    for (const db of databases)
      for (const table of db.tables)
        for (const column of table.columns) {
          if (!column.foreign) continue;
          const [targetTable, targetColumn] = column.foreign.split(".");
          expect(
            db.tables
              .find((t) => t.name === targetTable)
              ?.columns.some((c) => c.name === targetColumn),
            `${db.name}.${table.name}.${column.name} → ${column.foreign}`,
          ).toBe(true);
        }
  });
});
