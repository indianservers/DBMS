import { useEffect, useRef, useState } from "react";
import {
  Check,
  Database,
  Download,
  FileCode2,
  FileInput,
  FileJson2,
  FileSpreadsheet,
  History,
  Info,
  Upload,
} from "lucide-react";
import type { Database as DbType } from "../data";
import { databases } from "../data";
import {
  downloadBytes,
  downloadText,
  dumpDatabaseSql,
  executeSql,
  getDatabaseBytes,
  inspectSqlite,
  listLocalDatabases,
  quoteId,
  replaceDatabaseBytes,
} from "../workspace/database";
import { parseLocalFile } from "./file";
import type { ParsedFile } from "./file";
import { makeTableImportSql, toCsv } from "./formats";
import { writeStoredText } from "../storage";
import "./studio.css";

type Prepared =
  { kind: "sqlite"; bytes: Uint8Array; tables: string[] } | ParsedFile;
type HistoryEntry = {
  name: string;
  action: string;
  database: string;
  at: string;
  status: string;
  rows?: number;
};
const HISTORY_KEY = "dbms-studio-file-history";
const readHistory = (): HistoryEntry[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const extensionOf = (name: string) =>
  name.split(".").pop()?.toLowerCase() || "";
const stem = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "imported_data";

export default function ImportExportStudio({
  database,
  mode,
  setMode,
  file,
  preview,
  chooseFile,
  notify,
  onComplete,
}: {
  database: DbType;
  mode: "Import" | "Export";
  setMode: (mode: "Import" | "Export") => void;
  file: File | null;
  preview: string;
  chooseFile: (file: File | null) => void;
  notify: (message: string) => void;
  onComplete: (databaseName: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [status, setStatus] = useState<
    "idle" | "validating" | "ready" | "importing" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [destination, setDestination] = useState<"new" | "current">("new");
  const [databaseName, setDatabaseName] = useState("");
  const [tableName, setTableName] = useState("");
  const [tableMode, setTableMode] = useState<"create" | "replace" | "append">(
    "create",
  );
  const [previewTab, setPreviewTab] = useState<
    "Data Preview" | "Schema" | "Raw Content"
  >("Data Preview");
  const [history, setHistory] = useState<HistoryEntry[]>(readHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [exportTables, setExportTables] = useState<string[]>([]);
  const [exportTable, setExportTable] = useState("");
  const [exportFormat, setExportFormat] = useState<
    "sqlite" | "sql" | "csv" | "json"
  >("sqlite");
  const [working, setWorking] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    writeStoredText(HISTORY_KEY, JSON.stringify(history.slice(0, 40)));
  }, [history]);
  useEffect(() => {
    if (!file) {
      setPrepared(null);
      setStatus("idle");
      return;
    }
    let active = true;
    const extension = extensionOf(file.name);
    setPrepared(null);
    setError("");
    setStatus("validating");
    setDatabaseName(stem(file.name));
    setTableName(stem(file.name));
    void (async () => {
      try {
        if (file.size > 50 * 1024 * 1024)
          throw new Error(
            "Files over 50 MB are not supported in this browser workspace.",
          );
        if (["sqlite", "sqlite3", "db"].includes(extension)) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const info = await inspectSqlite(bytes);
          if (active) {
            setPrepared({ kind: "sqlite", bytes, tables: info.tables });
            setStatus("ready");
          }
        } else if (
          ["sql", "csv", "tsv", "json", "jsonl", "ndjson"].includes(extension)
        ) {
          const parsed = await parseLocalFile(file, extension);
          if (active) {
            setPrepared(parsed);
            setStatus("ready");
          }
        } else
          throw new Error(
            "Choose a .sqlite, .db, .sql, .csv, .tsv, .json, .jsonl or .ndjson file.",
          );
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : String(cause));
          setStatus("error");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [file]);
  useEffect(() => {
    let active = true;
    executeSql(
      database.name,
      "SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
      .then((result) => {
        if (active) {
          const names = result.rows.map((row) => String(row[0]));
          setExportTables(names);
          setExportTable((current) =>
            names.includes(current) ? current : names[0] || "",
          );
        }
      })
      .catch(() => {
        if (active) setExportTables([]);
      });
    return () => {
      active = false;
    };
  }, [database.name, refresh]);

  function record(entry: Omit<HistoryEntry, "at">) {
    setHistory((items) =>
      [{ ...entry, at: new Date().toLocaleString() }, ...items].slice(0, 40),
    );
  }

  async function startImport() {
    if (!file || !prepared || status !== "ready") return;
    const target =
      destination === "current" ? database.name : databaseName.trim();
    if (!target) {
      setError("Enter a new workspace name.");
      return;
    }
    setWorking(true);
    setStatus("importing");
    setError("");
    try {
      if (destination === "new") {
        const existing = new Set([
          ...databases.map((item) => item.name),
          ...(await listLocalDatabases()),
        ]);
        if (existing.has(target))
          throw new Error(
            `A database named “${target}” already exists. Choose a different name.`,
          );
      }
      if (prepared.kind === "sqlite") {
        if (
          destination === "current" &&
          !window.confirm(
            `Replace the local ${database.name} database with ${file.name}? Export a backup first if you need the current data.`,
          )
        ) {
          setStatus("ready");
          return;
        }
        await replaceDatabaseBytes(target, prepared.bytes);
        record({
          name: file.name,
          action: "SQLite import",
          database: target,
          status: "Success",
        });
      } else if (prepared.kind === "sql") {
        await executeSql(target, prepared.text, 60_000);
        record({
          name: file.name,
          action: "SQL import",
          database: target,
          status: "Success",
        });
      } else {
        const effectiveMode = destination === "new" ? "create" : tableMode;
        const script = makeTableImportSql(
          prepared.table,
          tableName.trim(),
          effectiveMode,
        );
        if (
          destination === "current" &&
          tableMode === "replace" &&
          !window.confirm(
            `Replace table ${tableName} in ${database.name} with ${prepared.table.rows.length} imported rows? This affects only this browser’s local copy.`,
          )
        ) {
          setStatus("ready");
          return;
        }
        await executeSql(target, script, 60_000);
        record({
          name: file.name,
          action: `${effectiveMode} table ${tableName}`,
          database: target,
          status: "Success",
          rows: prepared.table.rows.length,
        });
      }
      setStatus("success");
      setRefresh((value) => value + 1);
      onComplete(target);
      notify(`${file.name} imported into ${target}.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message);
      setStatus("ready");
      record({
        name: file.name,
        action: "Import",
        database: target,
        status: "Failed",
      });
    } finally {
      setWorking(false);
    }
  }

  async function startExport() {
    setWorking(true);
    setError("");
    try {
      const base = database.name.replace(/[^A-Za-z0-9_-]/g, "_");
      if (exportFormat === "sqlite")
        downloadBytes(`${base}.sqlite`, await getDatabaseBytes(database.name));
      else if (exportFormat === "sql")
        downloadText(
          `${base}.sql`,
          await dumpDatabaseSql(database.name),
          "application/sql",
        );
      else {
        if (!exportTable) throw new Error("Choose a table or view to export.");
        const result = await executeSql(
          database.name,
          `SELECT * FROM ${quoteId(exportTable)}`,
        );
        if (exportFormat === "csv")
          downloadText(
            `${base}-${exportTable}.csv`,
            toCsv(result.columns, result.rows),
            "text/csv",
          );
        else
          downloadText(
            `${base}-${exportTable}.json`,
            JSON.stringify(
              result.rows.map((row) =>
                Object.fromEntries(
                  result.columns.map((column, index) => [column, row[index]]),
                ),
              ),
              null,
              2,
            ),
            "application/json",
          );
      }
      record({
        name: `${base}.${exportFormat}`,
        action: "Export",
        database: database.name,
        status: "Success",
      });
      notify(`${exportFormat.toUpperCase()} export ready.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setWorking(false);
    }
  }

  const table = prepared?.kind === "tabular" ? prepared.table : null;
  return (
    <div className="import-view content-scroll phase4-studio">
      <div className="import-heading">
        <div>
          <h1>Import / Export Studio</h1>
          <p>
            Move data in and out of your browser workspace. Files and queries
            never leave your device.
          </p>
        </div>
        <button
          className="phase4-small-button"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History size={16} /> {showHistory ? "Hide History" : "View History"}
        </button>
      </div>
      <div className="import-switch">
        <button
          className={mode === "Import" ? "active" : ""}
          onClick={() => setMode("Import")}
        >
          <Upload size={19} />
          <strong>Import</strong>
          <small>Bring local data into SQLite</small>
        </button>
        <button
          className={mode === "Export" ? "active" : ""}
          onClick={() => setMode("Export")}
        >
          <Download size={19} />
          <strong>Export</strong>
          <small>Download your local data</small>
        </button>
      </div>
      {mode === "Import" ? (
        <>
          <div className="import-cards">
            <section className="surface-card file-card">
              <h3>
                <span className="step">1</span> Select File
              </h3>
              <div
                className={`drop-zone ${drag ? "dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  chooseFile(e.dataTransfer.files[0] ?? null);
                }}
              >
                <Upload size={36} />
                <strong>{file?.name ?? "Drag and drop a file here"}</strong>
                <p>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB · stays in your browser`
                    : "or click to browse"}
                </p>
                <small>
                  .sqlite, .db, .sql, .csv, .tsv, .json, .jsonl · max 50 MB
                </small>
                <button
                  className="phase4-primary"
                  onClick={() => inputRef.current?.click()}
                >
                  <FileInput size={15} /> Browse Files
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".sqlite,.sqlite3,.db,.sql,.csv,.tsv,.json,.jsonl,.ndjson"
                  hidden
                  onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="file-types">
                {[
                  [".sql", FileCode2],
                  [".sqlite", Database],
                  [".db", Database],
                  [".csv", FileSpreadsheet],
                  [".json", FileJson2],
                ].map(([label, Icon]) => {
                  const IconView = Icon as typeof Database;
                  return (
                    <div key={label as string}>
                      <IconView size={21} />
                      <span>{label as string}</span>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="surface-card config-card">
              <h3>
                <span className="step">2</span> Import Configuration
              </h3>
              <div className="form-label">Destination</div>
              <label className="radio-line">
                <input
                  type="radio"
                  checked={destination === "new"}
                  onChange={() => setDestination("new")}
                />{" "}
                Create new local database
              </label>
              <label className="radio-line">
                <input
                  type="radio"
                  checked={destination === "current"}
                  onChange={() => setDestination("current")}
                />{" "}
                Use current database ({database.name})
              </label>
              {destination === "new" ? (
                <label>
                  New database name
                  <input
                    className="phase4-input"
                    value={databaseName}
                    onChange={(e) => setDatabaseName(e.target.value)}
                  />
                </label>
              ) : (
                <div className="config-note">
                  <Info size={15} />{" "}
                  {prepared?.kind === "sqlite"
                    ? "This replaces the current local database after confirmation."
                    : "SQL is applied to the current database. Tabular data uses the table mode below."}
                </div>
              )}
              {table && (
                <>
                  <label>
                    Target table
                    <input
                      className="phase4-input"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                    />
                  </label>
                  {destination === "current" && (
                    <>
                      <div className="form-label">Table mode</div>
                      {(["create", "append", "replace"] as const).map(
                        (value) => (
                          <label className="radio-line" key={value}>
                            <input
                              type="radio"
                              checked={tableMode === value}
                              onChange={() => setTableMode(value)}
                            />
                            {value === "create"
                              ? "Create table"
                              : value === "append"
                                ? "Append rows"
                                : "Replace table"}
                          </label>
                        ),
                      )}
                    </>
                  )}
                </>
              )}
              <div className="config-note">
                <Info size={15} /> CSV empty cells become SQL NULL. JSON arrays
                and newline-delimited MongoDB exports are supported; nested
                values are stored as JSON text.
              </div>
            </section>
            <section className="surface-card validate-card">
              <h3>
                <span className="step">
                  <Check size={15} />
                </span>{" "}
                Import & Validate
              </h3>
              <div className={`phase4-validation ${status}`}>
                {status === "idle"
                  ? "Choose a file to begin."
                  : status === "validating"
                    ? "Validating locally…"
                    : status === "ready"
                      ? "File prepared. Ready to import."
                      : status === "importing"
                        ? "Importing into browser storage…"
                        : status === "success"
                          ? "Import completed successfully."
                          : "Validation or import failed."}
              </div>
              {prepared?.kind === "sqlite" && (
                <p>
                  {prepared.tables.length} tables · SQLite integrity check
                  passed
                </p>
              )}
              {prepared?.kind === "tabular" && (
                <p>
                  {table?.rows.length.toLocaleString()} rows ·{" "}
                  {table?.columns.length} columns detected
                </p>
              )}
              {prepared?.kind === "sql" && (
                <p>
                  SQL script ready · {(file?.size ?? 0).toLocaleString()} bytes
                </p>
              )}
              <button
                className="phase4-primary phase4-wide"
                onClick={() => void startImport()}
                disabled={status !== "ready" || working}
              >
                <Upload size={16} />
                {working ? "Working…" : "Start Import"}
              </button>
              <h4>
                Import Progress{" "}
                <span>
                  {status === "success"
                    ? "100%"
                    : status === "ready"
                      ? "50%"
                      : status === "importing"
                        ? "75%"
                        : "0%"}
                </span>
              </h4>
              <div className="progress-track">
                <div
                  style={{
                    width:
                      status === "success"
                        ? "100%"
                        : status === "ready"
                          ? "50%"
                          : status === "importing"
                            ? "75%"
                            : "0%",
                  }}
                />
              </div>
              <div className="check-list">
                {[
                  "File selected",
                  "File prepared",
                  "Import in progress",
                  "Completed",
                ].map((label, index) => (
                  <div key={label}>
                    <span
                      className={
                        file &&
                        (index === 0 ||
                          (index === 1 &&
                            ["ready", "importing", "success"].includes(
                              status,
                            )) ||
                          (index === 2 &&
                            ["importing", "success"].includes(status)) ||
                          (index === 3 && status === "success"))
                          ? "done"
                          : ""
                      }
                    />
                    {label}
                  </div>
                ))}
              </div>
              {error && <div className="phase4-error">{error}</div>}
            </section>
          </div>
          <div className="import-bottom">
            <section className="surface-card recent-files">
              <div className="card-head">
                <h3>Recent Files</h3>
                <span>{history.length} local actions</span>
              </div>
              {history.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Action</th>
                      <th>Database</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 6).map((entry, index) => (
                      <tr key={index}>
                        <td>
                          <FileCode2 size={15} />
                          {entry.name}
                        </td>
                        <td>{entry.action}</td>
                        <td>{entry.database}</td>
                        <td>{entry.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="phase4-empty">No imports or exports yet.</p>
              )}
            </section>
            <section className="surface-card preview-card">
              <div className="card-head">
                <h3>File Preview</h3>
                <span>{file?.name ?? "No file selected"}</span>
              </div>
              <div className="mini-tabs">
                {(["Data Preview", "Schema", "Raw Content"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      className={previewTab === tab ? "active" : ""}
                      onClick={() => setPreviewTab(tab)}
                    >
                      {tab}
                    </button>
                  ),
                )}
              </div>
              <div className="preview-content">
                {!file ? (
                  <div className="preview-empty">
                    <FileInput size={28} />
                    <strong>Select a file to preview it here</strong>
                    <small>File contents stay on this device.</small>
                  </div>
                ) : prepared?.kind === "sqlite" ? (
                  <div className="phase4-schema-list">
                    <strong>{prepared.tables.length} tables</strong>
                    {prepared.tables.map((name) => (
                      <div key={name}>
                        <Database size={14} />
                        {name}
                      </div>
                    ))}
                  </div>
                ) : prepared?.kind === "sql" ? (
                  <pre>{prepared.preview}</pre>
                ) : table ? (
                  previewTab === "Raw Content" ? (
                    <pre>
                      {prepared?.kind === "tabular"
                        ? prepared.preview
                        : preview}
                    </pre>
                  ) : previewTab === "Schema" ? (
                    <div className="phase4-schema-list">
                      {table.columns.map((column, index) => (
                        <div key={column}>
                          <span>{column}</span>
                          <code>{table.types[index]}</code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="phase4-preview-grid">
                      <table>
                        <thead>
                          <tr>
                            {table.columns.map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.slice(0, 8).map((row, index) => (
                            <tr key={index}>
                              {row.map((value, i) => (
                                <td key={i}>
                                  {value === null ? (
                                    <em>NULL</em>
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <small>
                        Showing first {Math.min(8, table.rows.length)} of{" "}
                        {table.rows.length} rows
                      </small>
                    </div>
                  )
                ) : (
                  <pre>{preview}</pre>
                )}
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="phase4-export surface-card">
          <div className="phase4-export-head">
            <Download size={32} />
            <div>
              <h2>Export {database.name}</h2>
              <p>
                Build a local backup or extract one table. Nothing is uploaded.
              </p>
            </div>
          </div>
          <div className="phase4-export-options">
            {(["sqlite", "sql", "csv", "json"] as const).map((format) => (
              <label
                key={format}
                className={exportFormat === format ? "selected" : ""}
              >
                <input
                  type="radio"
                  checked={exportFormat === format}
                  onChange={() => setExportFormat(format)}
                />
                <strong>{format.toUpperCase()}</strong>
                <span>
                  {format === "sqlite"
                    ? "Complete database file"
                    : format === "sql"
                      ? "Schema and data script"
                      : format === "csv"
                        ? "One table as CSV"
                        : "One table as JSON"}
                </span>
              </label>
            ))}
          </div>
          {(exportFormat === "csv" || exportFormat === "json") && (
            <label className="phase4-export-table">
              Table or view
              <select
                value={exportTable}
                onChange={(e) => setExportTable(e.target.value)}
              >
                {exportTables.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          )}
          <button
            className="phase4-primary"
            disabled={working}
            onClick={() => void startExport()}
          >
            <Download size={16} />
            {working ? "Preparing…" : `Download ${exportFormat.toUpperCase()}`}
          </button>
          {error && <div className="phase4-error">{error}</div>}
        </div>
      )}
      {showHistory && (
        <section className="surface-card phase4-history">
          <h3>Import / Export History</h3>
          {history.length ? (
            history.map((entry, index) => (
              <div key={index}>
                <span>{entry.at}</span>
                <strong>{entry.name}</strong>
                <span>
                  {entry.action} → {entry.database}
                </span>
                <em>{entry.status}</em>
              </div>
            ))
          ) : (
            <p>No file operations yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
