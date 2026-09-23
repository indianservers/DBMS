import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { seedSql } from "./seed";

type Request = { id: number; sql: string };
type Response = {
  id: number;
  columns: string[];
  rows: (string | number | null)[][];
  error?: string;
};
const engine = initSqlJs({ locateFile: () => wasmUrl });

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, sql } = event.data;
  const response: Response = { id, columns: [], rows: [] };
  let db: import("sql.js").Database | undefined;
  try {
    const SQL = await engine;
    db = new SQL.Database();
    db.run(seedSql);
    db.run("PRAGMA query_only = ON;");
    const result = db.exec(sql);
    if (result.length) {
      response.columns = result[0].columns;
      response.rows = result[0].values as (string | number | null)[][];
    }
  } catch (error) {
    response.error = error instanceof Error ? error.message : String(error);
  } finally {
    db?.close();
  }
  self.postMessage(response);
};
