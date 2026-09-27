import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { databases } from "../data";
import { seedSql } from "../learning/seed";
import { dumpDatabase } from "../importExport/dump";

type Request = {
  sql?: string;
  database: string;
  bytes?: Uint8Array;
  mode?: "execute" | "inspect" | "dump";
};
const engine = initSqlJs({ locateFile: () => wasmUrl });

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return a.every((value, index) => value === b[index]);
}

function quote(name: string) {
  return `"${name.replaceAll('"', '""')}"`;
}

function seed(database: import("sql.js").Database, name: string) {
  if (name === "RetailDB") database.run(seedSql);
  const model = databases.find((item) => item.name === name);
  if (!model) return;
  for (const table of model.tables) {
    const exists = database.exec(
      `SELECT 1 FROM sqlite_master WHERE type='table' AND name=${JSON.stringify(table.name)}`,
    );
    if (exists.length) continue;
    const columns = table.columns.map((column) => {
      const type = /INT/i.test(column.type)
        ? "INTEGER"
        : /DECIMAL|REAL|FLOAT/i.test(column.type)
          ? "REAL"
          : "TEXT";
      const key = column.primary ? " PRIMARY KEY" : "";
      const foreign = column.foreign
        ? ` REFERENCES ${column.foreign.split(".").map(quote).join("(")}${column.foreign.includes(".") ? ")" : ""}`
        : "";
      return `${quote(column.name)} ${type}${key}${foreign}`;
    });
    database.run(`CREATE TABLE ${quote(table.name)} (${columns.join(", ")})`);
  }
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const { sql = "", database: name, bytes, mode = "execute" } = event.data;
  let db: import("sql.js").Database | undefined;
  try {
    const SQL = await engine;
    if (mode === "inspect" && !bytes)
      throw new Error("No SQLite file data was supplied.");
    db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    if (!bytes && mode === "execute") seed(db, name);
    db.run("PRAGMA foreign_keys = ON");
    if (mode === "inspect") {
      const integrity = db.exec("PRAGMA integrity_check")[0]?.values[0]?.[0];
      if (integrity !== "ok")
        throw new Error(
          `SQLite integrity check failed: ${integrity ?? "unknown"}`,
        );
      const tables =
        db
          .exec(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
          )[0]
          ?.values.map((row) => String(row[0])) ?? [];
      self.postMessage({ tables, integrity: "ok" });
      return;
    }
    if (mode === "dump") {
      self.postMessage({ text: dumpDatabase(db) });
      return;
    }
    const started = performance.now();
    const results = db.exec(sql);
    const elapsed = Math.round((performance.now() - started) * 10) / 10;
    const result = results.at(-1);
    const exported = db.export();
    const payload = {
      columns: result?.columns ?? [],
      rows: (result?.values ?? []) as (string | number | null)[][],
      resultSets: results.length,
      affected: db.getRowsModified(),
      elapsed,
      bytes: bytes && sameBytes(bytes, exported) ? undefined : exported,
    };
    self.postMessage(payload);
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    db?.close();
  }
};
