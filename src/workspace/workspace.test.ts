import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { seedSql } from "../learning/seed";

describe("browser SQL workspace queries", () => {
  it("executes the sample query and introspects live columns and keys", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run("PRAGMA foreign_keys = ON");
    db.run(seedSql);
    const result = db.exec(
      "SELECT o.order_id, COUNT(oi.order_item_id) AS items FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.order_id GROUP BY o.order_id ORDER BY o.order_id",
    );
    expect(result[0].values).toHaveLength(5);
    expect(result[0].values[0]).toEqual([101, 3]);
    const columns = db.exec(
      "SELECT m.name, p.name, p.type, p.pk FROM sqlite_master AS m JOIN pragma_table_info(m.name) AS p WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%'",
    );
    expect(
      columns[0].values.some(
        (row) => row[0] === "orders" && row[1] === "order_id" && row[3] === 1,
      ),
    ).toBe(true);
    const keys = db.exec(
      "SELECT m.name, f.`from`, f.`table`, f.`to` FROM sqlite_master AS m JOIN pragma_foreign_key_list(m.name) AS f WHERE m.type = 'table'",
    );
    expect(
      keys[0].values.some(
        (row) =>
          row[0] === "orders" &&
          row[1] === "customer_id" &&
          row[2] === "customers",
      ),
    ).toBe(true);
    db.close();
  });
});
