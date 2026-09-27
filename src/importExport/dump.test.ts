import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { seedSql } from "../learning/seed";
import { dumpDatabase } from "./dump";

describe("SQL database export", () => {
  it("round-trips schema, data and foreign keys", async () => {
    const SQL = await initSqlJs();
    const source = new SQL.Database();
    source.exec(seedSql);
    source.exec("CREATE INDEX idx_orders_date ON orders(order_date);");
    source.exec(
      "CREATE VIEW order_totals AS SELECT customer_id, SUM(total_amount) AS total FROM orders GROUP BY customer_id;",
    );
    const exported = dumpDatabase(source);
    const restored = new SQL.Database();
    restored.exec(exported);
    expect(restored.exec("SELECT COUNT(*) FROM orders")[0].values[0][0]).toBe(
      5,
    );
    expect(
      restored.exec("SELECT COUNT(*) FROM order_items")[0].values[0][0],
    ).toBe(8);
    expect(
      restored.exec("SELECT COUNT(*) FROM order_totals")[0].values[0][0],
    ).toBeGreaterThan(0);
    expect(restored.exec("PRAGMA foreign_key_check")).toEqual([]);
    expect(
      restored.exec(
        "SELECT name FROM sqlite_master WHERE name='idx_orders_date'",
      )[0].values[0][0],
    ).toBe("idx_orders_date");
    source.close();
    restored.close();
  });

  it("restores generated columns and AUTOINCREMENT positions", async () => {
    const SQL = await initSqlJs();
    const source = new SQL.Database();
    source.exec(
      "CREATE TABLE measures (id INTEGER PRIMARY KEY AUTOINCREMENT, amount INTEGER, doubled INTEGER GENERATED ALWAYS AS (amount * 2) STORED); INSERT INTO measures(amount) VALUES (4), (5); DELETE FROM measures WHERE id = 2;",
    );
    const restored = new SQL.Database();
    restored.exec(dumpDatabase(source));
    expect(
      restored.exec("SELECT id, amount, doubled FROM measures")[0].values,
    ).toEqual([[1, 4, 8]]);
    restored.exec("INSERT INTO measures(amount) VALUES (7)");
    expect(
      restored.exec("SELECT id, doubled FROM measures WHERE amount = 7")[0]
        .values,
    ).toEqual([[3, 14]]);
    source.close();
    restored.close();
  });
});
