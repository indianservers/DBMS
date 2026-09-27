import { quoteId } from "../workspace/database";

export type Cell = string | number | null;
export type ParsedTable = {
  columns: string[];
  rows: Cell[][];
  types: ("INTEGER" | "REAL" | "TEXT")[];
};

function uniqueHeaders(raw: string[]): string[] {
  const used = new Set<string>();
  return raw.map((value, index) => {
    const base = value.trim() || `column_${index + 1}`;
    let name = base,
      suffix = 2;
    while (used.has(name.toLowerCase())) name = `${base}_${suffix++}`;
    used.add(name.toLowerCase());
    return name;
  });
}

export function parseDelimited(text: string, delimiter = ","): ParsedTable {
  const source = text.replace(/^\uFEFF/, "");
  const records: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    quotedField = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === "") {
      quoted = true;
      quotedField = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || quotedField || row.some((cell) => cell !== ""))
        records.push(row);
      row = [];
      quotedField = false;
    } else field += ch;
  }
  if (quoted) throw new Error("Unclosed quoted field in delimited file.");
  row.push(field);
  if (row.length > 1 || quotedField || row.some((cell) => cell !== ""))
    records.push(row);
  if (!records.length) throw new Error("The file has no header row.");
  const columns = uniqueHeaders(records[0]);
  const rawRows = records.slice(1).map((record, index) => {
    if (record.length > columns.length)
      throw new Error(`Row ${index + 2} has more fields than the header.`);
    return columns.map((_, column) => record[column] ?? "");
  });
  const types = inferTypes(rawRows, columns.length);
  const rows = rawRows.map((record) =>
    record.map((value, index) => {
      if (value === "") return null;
      return types[index] === "TEXT" ? value : Number(value);
    }),
  );
  return { columns, rows, types };
}

function normalizeDocumentValue(value: unknown): Cell {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (
      entries.length === 1 &&
      ["$oid", "$date", "$numberDecimal", "$numberLong"].includes(entries[0][0])
    )
      return String(entries[0][1]);
    return JSON.stringify(value);
  }
  return String(value);
}

export function parseJsonDocuments(text: string): ParsedTable {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    try {
      parsed = text
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
    } catch {
      throw new Error("Invalid JSON or newline-delimited JSON.");
    }
  }
  const documents = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { documents?: unknown }).documents)
      ? (parsed as { documents: unknown[] }).documents
      : [parsed];
  if (
    !documents.length ||
    documents.some(
      (item) => !item || typeof item !== "object" || Array.isArray(item),
    )
  )
    throw new Error("JSON import expects an object or an array of objects.");
  const sourceKeys = Array.from(
    new Set(
      documents.flatMap((item) => Object.keys(item as Record<string, unknown>)),
    ),
  );
  const columns = uniqueHeaders(sourceKeys);
  const rows = documents.map((item) =>
    sourceKeys.map((key) =>
      normalizeDocumentValue((item as Record<string, unknown>)[key]),
    ),
  );
  return { columns, rows, types: inferTypes(rows, columns.length) };
}

function inferTypes(
  rows: Cell[][],
  width: number,
): ("INTEGER" | "REAL" | "TEXT")[] {
  return Array.from({ length: width }, (_, column) => {
    const values = rows
      .map((row) => row[column])
      .filter((value) => value !== null && value !== "");
    if (!values.length) return "TEXT";
    const integer = values.every((value) =>
      typeof value === "number"
        ? Number.isInteger(value)
        : /^-?(0|[1-9]\d*)$/.test(String(value)),
    );
    if (integer) return "INTEGER";
    const numeric = values.every(
      (value) =>
        typeof value === "number" ||
        /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(String(value)),
    );
    return numeric ? "REAL" : "TEXT";
  });
}

function literal(value: Cell): string {
  if (value === null) return "NULL";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "NULL";
  return `'${value.replaceAll("'", "''")}'`;
}

export function makeTableImportSql(
  table: ParsedTable,
  name: string,
  mode: "create" | "replace" | "append",
): string {
  if (!name.trim()) throw new Error("Enter a target table name.");
  if (!table.columns.length) throw new Error("No columns were detected.");
  const statements = ["PRAGMA foreign_keys=OFF;", "BEGIN TRANSACTION;"];
  if (mode === "replace")
    statements.push(`DROP TABLE IF EXISTS ${quoteId(name)};`);
  if (mode !== "append")
    statements.push(
      `CREATE TABLE ${quoteId(name)} (${table.columns.map((column, index) => `${quoteId(column)} ${table.types[index] || "TEXT"}`).join(", ")});`,
    );
  const names = table.columns.map(quoteId).join(", ");
  for (let start = 0; start < table.rows.length; start += 250) {
    const values = table.rows
      .slice(start, start + 250)
      .map((row) => `(${row.map(literal).join(", ")})`)
      .join(",\n");
    statements.push(
      `INSERT INTO ${quoteId(name)} (${names}) VALUES ${values};`,
    );
  }
  statements.push("COMMIT;", "PRAGMA foreign_keys=ON;");
  return statements.join("\n");
}

export function toCsv(columns: string[], rows: Cell[][]): string {
  return [columns, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\r\n");
}
