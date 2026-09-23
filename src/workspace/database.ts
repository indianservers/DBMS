export type SqlResult = {
  columns: string[];
  rows: (string | number | null)[][];
  resultSets: number;
  affected: number;
  elapsed: number;
};

const DB_NAME = "dbms-studio-local-databases";
let queue = Promise.resolve();

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readBytes(name: string): Promise<Uint8Array | undefined> {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const request = tx.objectStore("files").get(name);
    request.onsuccess = () => resolve(request.result as Uint8Array | undefined);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function writeBytes(name: string, bytes: Uint8Array): Promise<void> {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(bytes, name);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function listLocalDatabases(): Promise<string[]> {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const request = tx.objectStore("files").getAllKeys();
    request.onsuccess = () => resolve(request.result.map(String));
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getDatabaseBytes(name: string): Promise<Uint8Array> {
  let bytes = await readBytes(name);
  if (!bytes) {
    await executeSql(name, "SELECT 1");
    bytes = await readBytes(name);
  }
  if (!bytes) throw new Error("Local database is unavailable.");
  return bytes;
}

export function replaceDatabaseBytes(
  name: string,
  bytes: Uint8Array,
): Promise<void> {
  const run = queue.then(() => writeBytes(name, bytes));
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

type SpecialResponse = {
  error?: string;
  tables?: string[];
  integrity?: string;
  text?: string;
};
async function specialWorker(request: {
  database: string;
  mode: "inspect" | "dump";
  bytes: Uint8Array;
}): Promise<SpecialResponse> {
  const worker = new Worker(new URL("./db.worker.ts", import.meta.url), {
    type: "module",
  });
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("File operation timed out."));
    }, 30_000);
    worker.onmessage = (event: MessageEvent<SpecialResponse>) => {
      window.clearTimeout(timer);
      worker.terminate();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      reject(new Error(event.message));
    };
    worker.postMessage(request);
  });
}

export async function inspectSqlite(
  bytes: Uint8Array,
): Promise<{ tables: string[] }> {
  const answer = await specialWorker({ database: "", mode: "inspect", bytes });
  return { tables: answer.tables ?? [] };
}

export async function dumpDatabaseSql(name: string): Promise<string> {
  const bytes = await getDatabaseBytes(name);
  const answer = await specialWorker({ database: name, mode: "dump", bytes });
  return answer.text ?? "";
}

async function executeDirect(
  database: string,
  sql: string,
  timeoutMs: number,
): Promise<SqlResult> {
  const bytes = await readBytes(database);
  const worker = new Worker(new URL("./db.worker.ts", import.meta.url), {
    type: "module",
  });
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(
        new Error(
          `Operation timed out after ${Math.round(timeoutMs / 1000)} seconds. The local database was not changed.`,
        ),
      );
    }, timeoutMs);
    worker.onmessage = async (
      event: MessageEvent<SqlResult & { bytes?: Uint8Array; error?: string }>,
    ) => {
      window.clearTimeout(timer);
      worker.terminate();
      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }
      try {
        await writeBytes(database, event.data.bytes!);
        resolve(event.data);
      } catch (error) {
        reject(error);
      }
    };
    worker.onerror = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      reject(new Error(event.message));
    };
    worker.postMessage({ database, sql, bytes });
  });
}

export function executeSql(
  database: string,
  sql: string,
  timeoutMs = 10_000,
): Promise<SqlResult> {
  const run = queue.then(() => executeDirect(database, sql, timeoutMs));
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function quoteId(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function downloadText(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBytes(
  name: string,
  bytes: Uint8Array,
  type = "application/x-sqlite3",
) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const url = URL.createObjectURL(new Blob([copy.buffer], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
