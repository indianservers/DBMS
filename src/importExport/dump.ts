import type { Database } from "sql.js";

const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;

function literal(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Uint8Array)
    return `X'${Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("")}'`;
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function dumpDatabase(database: Database): string {
  const schema =
    database.exec(
      "SELECT name, type, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'view' THEN 1 WHEN 'index' THEN 2 ELSE 3 END, name",
    )[0]?.values ?? [];
  const tables = schema.filter((row) => row[1] === "table");
  const lines = ["PRAGMA foreign_keys=OFF;", "BEGIN TRANSACTION;"];
  for (const [, , ddl] of tables) lines.push(`${ddl};`);
  for (const [name] of tables) {
    const tableName = String(name);
    const result = database.exec(`SELECT * FROM ${quote(tableName)}`)[0];
    if (!result) continue;
    const names = result.columns.map(quote).join(", ");
    for (const row of result.values)
      lines.push(
        `INSERT INTO ${quote(tableName)} (${names}) VALUES (${row.map(literal).join(", ")});`,
      );
  }
  for (const [, type, ddl] of schema)
    if (type !== "table") lines.push(`${ddl};`);
  lines.push("COMMIT;", "PRAGMA foreign_keys=ON;");
  return lines.join("\n");
}
