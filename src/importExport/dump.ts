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
    const columns =
      database
        .exec(`PRAGMA table_xinfo(${quote(tableName)})`)[0]
        ?.values.filter((column) => Number(column[6]) === 0)
        .map((column) => String(column[1])) ?? [];
    if (!columns.length) continue;
    const result = database.exec(
      `SELECT ${columns.map(quote).join(", ")} FROM ${quote(tableName)}`,
    )[0];
    if (!result) continue;
    const names = columns.map(quote).join(", ");
    for (const row of result.values)
      lines.push(
        `INSERT INTO ${quote(tableName)} (${names}) VALUES (${row.map(literal).join(", ")});`,
      );
  }
  const hasSequence = database.exec(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'",
  ).length;
  if (hasSequence) {
    lines.push("DELETE FROM sqlite_sequence;");
    const sequences = database.exec("SELECT name, seq FROM sqlite_sequence")[0];
    for (const row of sequences?.values ?? [])
      lines.push(
        `INSERT INTO sqlite_sequence (name, seq) VALUES (${row.map(literal).join(", ")});`,
      );
  }
  for (const [, type, ddl] of schema)
    if (type !== "table") lines.push(`${ddl};`);
  lines.push("COMMIT;", "PRAGMA foreign_keys=ON;");
  return lines.join("\n");
}
