import { quoteId } from "./database";

export function primaryKeyPredicate(
  schemaColumns: { name: string; primary: boolean }[],
  resultColumns: string[],
  row: (string | number | null)[],
): string | null {
  const keys = schemaColumns.filter((column) => column.primary);
  if (!keys.length) return null;
  const parts: string[] = [];
  for (const key of keys) {
    const index = resultColumns.indexOf(key.name);
    if (index < 0 || index >= row.length) return null;
    const value = row[index];
    if (value === null) return null;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return null;
      parts.push(`${quoteId(key.name)} = ${value}`);
    } else
      parts.push(`${quoteId(key.name)} = '${value.replaceAll("'", "''")}'`);
  }
  return parts.join(" AND ");
}
