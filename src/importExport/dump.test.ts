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
});
