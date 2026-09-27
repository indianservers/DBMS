import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Download,
  GitBranch,
  Grip,
  Plus,
  Play,
  Save,
  Search,
  Table2,
  Trash2,
  WandSparkles,
} from "lucide-react";
import type { Database } from "../data";
import { downloadText, executeSql, quoteId } from "./database";
import type { SqlResult } from "./database";
import { buildDiagramSvg } from "./diagram";
import { primaryKeyPredicate } from "./rowMutation";
import { readStoredJson, readStoredText, writeStoredText } from "../storage";
import "./workspace.css";

type Mode = "query" | "table" | "schema";
type Props = {
  database: Database;
  mode: Mode;
  tabId: string;
  tableName?: string;
  runSignal: number;
  initialSql: string;
  onSqlChange: (sql: string) => void;
  onOpenSql: (sql: string) => void;
  onDatabaseChange: () => void;
  notify: (message: string) => void;
};
type HistoryItem = {
  sql: string;
  at: string;
  duration: number;
  rows: number;
  database?: string;
};
type SchemaRow = { name: string; type: string; sql: string };
type LiveColumn = {
  name: string;
  type: string;
  primary: boolean;
  foreign?: string;
};
type NodePosition = { x: number; y: number };
const empty: SqlResult = {
  columns: [],
  rows: [],
  resultSets: 0,
  affected: 0,
  elapsed: 0,
};
const fmt = (value: string | number | null) =>
  value === null ? <em className="ws-null">NULL</em> : String(value);
const sqlLiteral = (value: string) => `'${value.replaceAll("'", "''")}'`;

export default function Workspace({
  database,
  mode,
  tabId,
  tableName,
  runSignal,
  initialSql,
  onSqlChange,
  onOpenSql,
  onDatabaseChange,
  notify,
}: Props) {
  const draftKey = `dbms-studio-draft-${tabId}`;
  const [sql, setSql] = useState(() => readStoredText(draftKey) ?? initialSql);
  const [result, setResult] = useState<SqlResult>(empty);
  const [explainResult, setExplainResult] = useState<SqlResult>(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resultTab, setResultTab] = useState<
    "Results" | "SQL" | "Explain" | "Chart" | "History"
  >("Results");
  const [history, setHistory] = useState<HistoryItem[]>(() =>
    readStoredJson("dbms-studio-query-history", []),
  );
  const visibleHistory = history.filter(
    (item) =>
      item.database === database.name ||
      (!item.database && database.name === "RetailDB"),
  );
  const [saved, setSaved] = useState<
    { name: string; sql: string; database?: string }[]
  >(() => readStoredJson("dbms-studio-saved-queries", []));
  const visibleSaved = saved
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        item.database === database.name ||
        (!item.database && database.name === "RetailDB"),
    );
  const [gridPage, setGridPage] = useState(0);
  const [sort, setSort] = useState<{ column: number; asc: boolean } | null>(
    null,
  );
  const [gridFilter, setGridFilter] = useState("");
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [schemaVersion, setSchemaVersion] = useState(0);
  const [schemaRows, setSchemaRows] = useState<SchemaRow[]>([]);
  const [liveColumns, setLiveColumns] = useState<Record<string, LiveColumn[]>>(
    {},
  );
  const [tableRows, setTableRows] = useState<SqlResult>(empty);
  const [tableSearch, setTableSearch] = useState("");
  const [tablePage, setTablePage] = useState(0);
  const [tableSort, setTableSort] = useState("");
  const [tableDirection, setTableDirection] = useState("ASC");
  const [tableCount, setTableCount] = useState(0);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [source, setSource] = useState(
    tableName || database.tables[0]?.name || "",
  );
  const [joinTable, setJoinTable] = useState("");
  const [joinType, setJoinType] = useState("LEFT JOIN");
  const [fields, setFields] = useState<string[]>(["*"]);
  const [filterColumn, setFilterColumn] = useState("");
  const [filterOperator, setFilterOperator] = useState("=");
  const [filterValue, setFilterValue] = useState("");
  const [secondLogic, setSecondLogic] = useState("AND");
  const [secondField, setSecondField] = useState("");
  const [secondOperator, setSecondOperator] = useState("=");
  const [secondValue, setSecondValue] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [aggregate, setAggregate] = useState("");
  const [aggregateField, setAggregateField] = useState("*");
  const [havingOperator, setHavingOperator] = useState(">");
  const [havingValue, setHavingValue] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [limit, setLimit] = useState("50");
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState("");
  const [designerTab, setDesignerTab] = useState<
    "Properties" | "DDL" | "Guide"
  >("Properties");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lastRun = useRef(runSignal);

  useEffect(() => {
    writeStoredText(draftKey, sql);
    onSqlChange(sql);
  }, [draftKey, sql, onSqlChange]);
  useEffect(() => {
    setSql(readStoredText(draftKey) ?? initialSql);
  }, [draftKey, initialSql]);
  useEffect(() => {
    writeStoredText(
      "dbms-studio-query-history",
      JSON.stringify(history.slice(0, 100)),
    );
  }, [history]);
  useEffect(() => {
    writeStoredText("dbms-studio-saved-queries", JSON.stringify(saved));
  }, [saved]);

  const run = useCallback(
    async (statement: string, showResult = true) => {
      if (!statement.trim()) {
        notify("Enter SQL first.");
        return;
      }
      setBusy(true);
      setError("");
      try {
        const answer = await executeSql(database.name, statement);
        if (showResult) {
          setResult(answer);
          setResultTab("Results");
          setGridPage(0);
          setHistory((items) =>
            [
              {
                sql: statement,
                database: database.name,
                at: new Date().toLocaleString(),
                duration: answer.elapsed,
                rows: answer.rows.length,
              },
              ...items,
            ].slice(0, 100),
          );
        }
        if (
          /\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|REPLACE)\b/i.test(
            statement,
          )
        ) {
          setSchemaVersion((v) => v + 1);
          onDatabaseChange();
        }
        notify(
          `${answer.rows.length} row${answer.rows.length === 1 ? "" : "s"} returned · ${answer.elapsed} ms`,
        );
        return answer;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
        setResultTab("Results");
      } finally {
        setBusy(false);
      }
    },
    [database.name, notify, onDatabaseChange],
  );

  const runEditor = useCallback(() => {
    const editor = editorRef.current;
    const selected =
      editor && editor.selectionStart !== editor.selectionEnd
        ? sql.slice(editor.selectionStart, editor.selectionEnd)
        : sql;
    void run(selected);
  }, [run, sql]);

  useEffect(() => {
    if (runSignal === lastRun.current) return;
    lastRun.current = runSignal;
    if (mode === "query") runEditor();
  }, [runSignal, mode, runEditor]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      executeSql(
        database.name,
        "SELECT name, type, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
      ),
      executeSql(
        database.name,
        "SELECT m.name, p.name, p.type, p.pk FROM sqlite_master AS m JOIN pragma_table_info(m.name) AS p WHERE m.type IN ('table','view') AND m.name NOT LIKE 'sqlite_%'",
      ),
      executeSql(
        database.name,
        "SELECT m.name, f.`from`, f.`table`, f.`to` FROM sqlite_master AS m JOIN pragma_foreign_key_list(m.name) AS f WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%'",
      ),
    ])
      .then(([schema, columns, foreignKeys]) => {
        if (alive) {
          setSchemaRows(
            schema.rows.map(([name, type, ddl]) => ({
              name: String(name),
              type: String(type),
              sql: String(ddl || ""),
            })),
          );
          const next: Record<string, LiveColumn[]> = {};
          for (const [table, name, type, pk] of columns.rows) {
            const key = String(table);
            (next[key] ||= []).push({
              name: String(name),
              type: String(type),
              primary: Boolean(pk),
            });
          }
          for (const [table, from, target, to] of foreignKeys.rows) {
            const column = next[String(table)]?.find(
              (item) => item.name === String(from),
            );
            if (column) column.foreign = `${target}.${to}`;
          }
          setLiveColumns(next);
        }
      })
      .catch((cause) => {
        if (alive) setError(String(cause));
      });
    return () => {
      alive = false;
    };
  }, [database.name, schemaVersion]);

  const liveTables = schemaRows
    .filter((row) => row.type === "table")
    .map((row) => row.name);
  const activeTable = tableName || source || liveTables[0] || "";
  useEffect(() => {
    if (mode !== "table" || !activeTable) return;
    let alive = true;
    const order = tableSort
      ? ` ORDER BY ${quoteId(tableSort)} ${tableDirection}`
      : "";
    const where = tableSearch
      ? ` WHERE ${
          liveColumns[activeTable]
            ?.map(
              (c) =>
                `CAST(${quoteId(c.name)} AS TEXT) LIKE ${sqlLiteral(`%${tableSearch}%`)}`,
            )
            .join(" OR ") || "1=0"
        }`
      : "";
    Promise.all([
      executeSql(
        database.name,
        `SELECT * FROM ${quoteId(activeTable)}${where}${order} LIMIT 50 OFFSET ${tablePage * 50}`,
      ),
      executeSql(
        database.name,
        `SELECT COUNT(*) FROM ${quoteId(activeTable)}${where}`,
      ),
    ])
      .then(([rows, count]) => {
        if (alive) {
          setTableRows(rows);
          setTableCount(Number(count.rows[0]?.[0] || 0));
        }
      })
      .catch((cause) => {
        if (alive) setError(String(cause));
      });
    return () => {
      alive = false;
    };
  }, [
    database,
    mode,
    activeTable,
    tableSearch,
    tableSort,
    tableDirection,
    tablePage,
    schemaVersion,
    liveColumns,
  ]);

  const grid = useMemo(() => {
    const mapped = result.rows
      .map((row, index) => ({ row, index }))
      .filter(
        ({ row }) =>
          !gridFilter ||
          row.some((v) =>
            String(v ?? "")
              .toLowerCase()
              .includes(gridFilter.toLowerCase()),
          ),
      );
    if (sort)
      mapped.sort((a, b) => {
        const x = a.row[sort.column],
          y = b.row[sort.column];
        const comparison =
          typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x ?? "").localeCompare(String(y ?? ""));
        return sort.asc ? comparison : -comparison;
      });
    return mapped;
  }, [result, gridFilter, sort]);
  const pageRows = grid.slice(gridPage * 50, gridPage * 50 + 50);

  const join = useMemo(() => {
    if (!joinTable) return "";
    const sourceModel = liveColumns[source];
    const joinModel = liveColumns[joinTable];
    const direct = sourceModel?.find((c) =>
      c.foreign?.startsWith(`${joinTable}.`),
    );
    const reverse = joinModel?.find((c) => c.foreign?.startsWith(`${source}.`));
    if (direct)
      return `${joinType} ${quoteId(joinTable)} ON ${quoteId(source)}.${quoteId(direct.name)} = ${quoteId(joinTable)}.${quoteId(direct.foreign!.split(".")[1])}`;
    if (reverse)
      return `${joinType} ${quoteId(joinTable)} ON ${quoteId(source)}.${quoteId(reverse.foreign!.split(".")[1])} = ${quoteId(joinTable)}.${quoteId(reverse.name)}`;
    return `${joinType} ${quoteId(joinTable)} ON /* choose join keys */ 1 = 1`;
  }, [liveColumns, source, joinTable, joinType]);
  const predicates = [
    filterColumn && filterValue
      ? `${quoteId(filterColumn)} ${filterOperator} ${sqlLiteral(filterValue)}`
      : "",
    secondField && secondValue
      ? `${quoteId(secondField)} ${secondOperator} ${sqlLiteral(secondValue)}`
      : "",
  ].filter(Boolean);
  const aggregateSql = aggregate
    ? `${aggregate}(${aggregateField === "*" ? "*" : quoteId(aggregateField)}) AS metric`
    : "";
  const selectedSql =
    fields.length && !(aggregate && fields.length === 1 && fields[0] === "*")
      ? fields.map((field) => (field === "*" ? "*" : quoteId(field))).join(", ")
      : "";
  const generatedSql = `SELECT ${[selectedSql, aggregateSql].filter(Boolean).join(", ") || "*"}\nFROM ${quoteId(source)}${join ? `\n${join}` : ""}${predicates.length ? `\nWHERE ${predicates.join(` ${secondLogic} `)}` : ""}${groupBy ? `\nGROUP BY ${quoteId(groupBy)}` : ""}${aggregate && havingValue ? `\nHAVING metric ${havingOperator} ${Number.isFinite(Number(havingValue)) ? Number(havingValue) : sqlLiteral(havingValue)}` : ""}${sortBy ? `\nORDER BY ${quoteId(sortBy)}` : ""}\nLIMIT ${Math.max(1, Math.min(10000, Number(limit) || 50))};`;

  function saveQuery() {
    const name = window
      .prompt("Name this query", `Query ${saved.length + 1}`)
      ?.trim();
    if (!name) return;
    setSaved((items) => [{ name, sql, database: database.name }, ...items]);
    notify(`Saved “${name}” locally.`);
  }
  function exportRows(format: "csv" | "json") {
    if (!result.columns.length) return;
    const text =
      format === "json"
        ? JSON.stringify(
            result.rows.map((row) =>
              Object.fromEntries(
                result.columns.map((column, index) => [column, row[index]]),
              ),
            ),
            null,
            2,
          )
        : [result.columns, ...result.rows]
            .map((row) =>
              row
                .map(
                  (value) => `"${String(value ?? "").replaceAll('"', '""')}"`,
                )
                .join(","),
            )
            .join("\r\n");
    downloadText(
      `query-results.${format}`,
      text,
      format === "json" ? "application/json" : "text/csv",
    );
  }
  async function explain() {
    const statement = sql.trim().replace(/;$/, "");
    setBusy(true);
    setError("");
    try {
      setExplainResult(
        await executeSql(database.name, `EXPLAIN QUERY PLAN ${statement}`),
      );
      setResultTab("Explain");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }
  async function deleteRow() {
    const index = selectedRow;
    const row = index === null ? undefined : tableRows.rows[index];
    const where = row
      ? primaryKeyPredicate(
          liveColumns[activeTable] ?? [],
          tableRows.columns,
          row,
        )
      : null;
    if (!where) {
      notify("Select a row with a primary key first.");
      return;
    }
    const preview = `DELETE FROM ${quoteId(activeTable)} WHERE ${where};`;
    if (
      !window.confirm(
        `Delete this row from your local practice database?\n\n${preview}`,
      )
    )
      return;
    if (await run(preview, false)) setSelectedRow(null);
  }
  async function editCell(rowIndex: number, columnIndex: number) {
    const column = tableRows.columns[columnIndex];
    const row = tableRows.rows[rowIndex];
    const keys = liveColumns[activeTable]?.filter((item) => item.primary) ?? [];
    const where = row
      ? primaryKeyPredicate(keys, tableRows.columns, row)
      : null;
    if (!column || !where || keys.some((key) => key.name === column)) {
      notify("Select a non-key cell in a table with a primary key.");
      return;
    }
    const current = row[columnIndex];
    const next = window.prompt(
      `New value for ${column} (type NULL for SQL NULL)`,
      current === null ? "NULL" : String(current),
    );
    if (next === null) return;
    const value = next.toUpperCase() === "NULL" ? "NULL" : sqlLiteral(next);
    const statement = `UPDATE ${quoteId(activeTable)} SET ${quoteId(column)} = ${value} WHERE ${where};`;
    if (
      !window.confirm(
        `Apply this change to your local practice database?\n\n${statement}`,
      )
    )
      return;
    await run(statement, false);
  }
  function addTable() {
    const name = window.prompt("New table name")?.trim();
    if (!name || !/^[A-Za-z_][\w]*$/.test(name))
      return notify(
        "Use letters, digits, and underscores; start with a letter or underscore.",
      );
    const ddl = `CREATE TABLE ${quoteId(name)} (id INTEGER PRIMARY KEY, name TEXT);`;
    if (window.confirm(`Create local table?\n\n${ddl}`)) void run(ddl, false);
  }
  function addColumn() {
    if (!selectedNode) return;
    const name = window.prompt("New column name")?.trim();
    if (!name || !/^[A-Za-z_][\w]*$/.test(name)) return;
    const type = window.prompt("SQLite type", "TEXT")?.trim().toUpperCase();
    if (
      !type ||
      !/^(TEXT|INTEGER|REAL|BLOB|NUMERIC|DATE|BOOLEAN)(\([0-9, ]+\))?$/.test(
        type,
      )
    )
      return notify("Choose a valid SQLite column type.");
    const ddl = `ALTER TABLE ${quoteId(selectedNode)} ADD COLUMN ${quoteId(name)} ${type};`;
    if (window.confirm(`Add column?\n\n${ddl}`)) void run(ddl, false);
  }
  function dragNode(event: React.PointerEvent<HTMLDivElement>, name: string) {
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY };
    const origin = positions[name] || {
      x: 32 + (liveTables.indexOf(name) % 3) * 286,
      y: 30 + Math.floor(liveTables.indexOf(name) / 3) * 292,
    };
    const element = event.currentTarget;
    const move = (e: PointerEvent) =>
      setPositions((p) => ({
        ...p,
        [name]: {
          x: origin.x + (e.clientX - start.x) / zoom,
          y: origin.y + (e.clientY - start.y) / zoom,
        },
      }));
    const end = () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    setSelectedNode(name);
  }

  const nodePosition = (name: string) => {
    const index = liveTables.indexOf(name);
    return (
      positions[name] || {
        x: 32 + (index % 3) * 286,
        y: 30 + Math.floor(index / 3) * 292,
      }
    );
  };

  return (
    <div className="ws-root">
      {mode === "query" && (
        <>
          <div className="ws-toolbar">
            <strong>SQL Lab</strong>
            <span className="ws-muted">{database.name} · local SQLite</span>
            <span className="ws-spacer" />
            <button onClick={() => setBuilderOpen(!builderOpen)}>
              <WandSparkles size={15} /> Visual Builder
            </button>
            <button onClick={saveQuery}>
              <Save size={15} /> Save
            </button>
            <button onClick={() => void explain()} disabled={busy}>
              <GitBranch size={15} /> Explain
            </button>
            <button className="ws-primary" onClick={runEditor} disabled={busy}>
              <Play size={15} /> {busy ? "Running…" : "Run SQL"}
            </button>
          </div>
          <div className="ws-query-body">
            <div className="ws-editor-pane">
              <div className="ws-editor-head">
                <span>Query editor</span>
                <span>Ctrl/⌘+Enter · select SQL to run only selection</span>
              </div>
              <textarea
                ref={editorRef}
                className="ws-editor"
                spellCheck={false}
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    runEditor();
                  }
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const el = e.currentTarget,
                      start = el.selectionStart;
                    setSql(
                      sql.slice(0, start) + "  " + sql.slice(el.selectionEnd),
                    );
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = start + 2;
                    });
                  }
                }}
                aria-label="SQL editor"
              />
              <div className="ws-editor-foot">
                <span>SQLite · Multiple statements supported</span>
                <button onClick={() => downloadText("query.sql", sql)}>
                  Download SQL
                </button>
              </div>
            </div>
            {builderOpen && (
              <div className="ws-builder">
                <div className="ws-panel-title">
                  Visual Query Builder{" "}
                  <button
                    onClick={() => setBuilderOpen(false)}
                    aria-label="Close builder"
                  >
                    ×
                  </button>
                </div>
                <label>
                  Source table
                  <select
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      setFields(["*"]);
                    }}
                  >
                    <option value="">Choose table</option>
                    {liveTables.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </label>
                <label>Columns</label>
                <div className="ws-checklist">
                  {liveColumns[source]?.map((column) => (
                    <label key={column.name}>
                      <input
                        type="checkbox"
                        checked={fields.includes(column.name)}
                        onChange={() =>
                          setFields((current) => {
                            const without = current.filter(
                              (name) => name !== "*" && name !== column.name,
                            );
                            return fields.includes(column.name)
                              ? without.length
                                ? without
                                : ["*"]
                              : [...without, column.name];
                          })
                        }
                      />
                      {column.name}
                    </label>
                  ))}
                </div>
                <div className="ws-two">
                  <label>
                    Join table
                    <select
                      value={joinTable}
                      onChange={(e) => setJoinTable(e.target.value)}
                    >
                      <option value="">None</option>
                      {liveTables
                        .filter((name) => name !== source)
                        .map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Join type
                    <select
                      value={joinType}
                      onChange={(e) => setJoinType(e.target.value)}
                    >
                      <option>LEFT JOIN</option>
                      <option>INNER JOIN</option>
                      <option>RIGHT JOIN</option>
                    </select>
                  </label>
                </div>
                {joinTable && join.includes("choose join keys") && (
                  <p className="ws-warning">
                    No relationship found. Edit the join condition in SQL before
                    running.
                  </p>
                )}
                <div className="ws-two">
                  <label>
                    Filter field
                    <select
                      value={filterColumn}
                      onChange={(e) => setFilterColumn(e.target.value)}
                    >
                      <option value="">None</option>
                      {liveColumns[source]?.map((column) => (
                        <option key={column.name}>{column.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Operator
                    <select
                      value={filterOperator}
                      onChange={(e) => setFilterOperator(e.target.value)}
                    >
                      {["=", "!=", ">", ">=", "<", "<=", "LIKE"].map((op) => (
                        <option key={op}>{op}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Filter value
                  <input
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  />
                </label>
                <div className="ws-two">
                  <label>
                    Combine
                    <select
                      value={secondLogic}
                      onChange={(e) => setSecondLogic(e.target.value)}
                    >
                      <option>AND</option>
                      <option>OR</option>
                    </select>
                  </label>
                  <label>
                    Second filter
                    <select
                      value={secondField}
                      onChange={(e) => setSecondField(e.target.value)}
                    >
                      <option value="">None</option>
                      {liveColumns[source]?.map((column) => (
                        <option key={column.name}>{column.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {secondField && (
                  <div className="ws-two">
                    <label>
                      Operator
                      <select
                        value={secondOperator}
                        onChange={(e) => setSecondOperator(e.target.value)}
                      >
                        {["=", "!=", ">", ">=", "<", "<=", "LIKE"].map((op) => (
                          <option key={op}>{op}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Value
                      <input
                        value={secondValue}
                        onChange={(e) => setSecondValue(e.target.value)}
                      />
                    </label>
                  </div>
                )}
                <div className="ws-two">
                  <label>
                    Group by
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                    >
                      <option value="">None</option>
                      {liveColumns[source]?.map((c) => (
                        <option key={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Sort by
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="">None</option>
                      {liveColumns[source]?.map((c) => (
                        <option key={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="ws-two">
                  <label>
                    Aggregate
                    <select
                      value={aggregate}
                      onChange={(e) => setAggregate(e.target.value)}
                    >
                      <option value="">None</option>
                      {["COUNT", "SUM", "AVG", "MIN", "MAX"].map((op) => (
                        <option key={op}>{op}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Aggregate field
                    <select
                      value={aggregateField}
                      onChange={(e) => setAggregateField(e.target.value)}
                    >
                      <option>*</option>
                      {liveColumns[source]?.map((column) => (
                        <option key={column.name}>{column.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {aggregate && (
                  <div className="ws-two">
                    <label>
                      Having
                      <select
                        value={havingOperator}
                        onChange={(e) => setHavingOperator(e.target.value)}
                      >
                        {["=", "!=", ">", ">=", "<", "<="].map((op) => (
                          <option key={op}>{op}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Metric value
                      <input
                        value={havingValue}
                        onChange={(e) => setHavingValue(e.target.value)}
                      />
                    </label>
                  </div>
                )}
                <label>
                  Limit
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </label>
                <pre className="ws-generated">{generatedSql}</pre>
                <button
                  className="ws-primary"
                  onClick={() => {
                    setSql(generatedSql);
                    setBuilderOpen(false);
                    notify("Generated SQL is ready to run or edit.");
                  }}
                >
                  Use in editor
                </button>
              </div>
            )}
          </div>
          <div className="ws-results">
            <div className="ws-tabs">
              {(["Results", "SQL", "Explain", "Chart", "History"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    className={resultTab === tab ? "active" : ""}
                    onClick={() => setResultTab(tab)}
                  >
                    {tab}
                  </button>
                ),
              )}
              <span className="ws-spacer" />
              {resultTab === "Results" && result.columns.length > 0 && (
                <>
                  <input
                    className="ws-search"
                    placeholder="Filter results"
                    value={gridFilter}
                    onChange={(e) => {
                      setGridFilter(e.target.value);
                      setGridPage(0);
                    }}
                  />
                  <button onClick={() => exportRows("csv")}>CSV</button>
                  <button onClick={() => exportRows("json")}>JSON</button>
                </>
              )}
            </div>
            {error && <div className="ws-error">{error}</div>}
            {resultTab === "Results" && (
              <>
                {result.columns.length ? (
                  <>
                    <DataGrid
                      columns={result.columns}
                      rows={pageRows.map(({ row }) => row)}
                      sort={sort}
                      onSort={(column) =>
                        setSort((current) => ({
                          column,
                          asc: current?.column === column ? !current.asc : true,
                        }))
                      }
                    />
                    <div className="ws-status">
                      {grid.length} rows · {result.elapsed} ms ·{" "}
                      {result.affected} rows changed{" "}
                      {result.resultSets > 1 &&
                        `· ${result.resultSets} result sets`}
                      <span className="ws-spacer" />
                      <button
                        disabled={!gridPage}
                        onClick={() => setGridPage(gridPage - 1)}
                      >
                        Previous
                      </button>
                      <span>
                        Page {gridPage + 1} /{" "}
                        {Math.max(1, Math.ceil(grid.length / 50))}
                      </span>
                      <button
                        disabled={(gridPage + 1) * 50 >= grid.length}
                        onClick={() => setGridPage(gridPage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="ws-empty">
                    Run a query to see live results from your local SQLite
                    database.
                  </div>
                )}
              </>
            )}
            {resultTab === "SQL" && <pre className="ws-output-pre">{sql}</pre>}
            {resultTab === "Explain" &&
              (explainResult.columns.length ? (
                <DataGrid
                  columns={explainResult.columns}
                  rows={explainResult.rows}
                />
              ) : (
                <div className="ws-help">
                  Run Explain to inspect the SQLite query plan.
                </div>
              ))}
            {resultTab === "Chart" && <Chart result={result} />}
            {resultTab === "History" && (
              <div className="ws-history">
                {visibleHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSql(item.sql);
                      setResultTab("SQL");
                    }}
                  >
                    <ClockLabel item={item} />
                    <code>{item.sql.slice(0, 180)}</code>
                  </button>
                ))}
                {!visibleHistory.length && (
                  <div className="ws-empty">Executed queries appear here.</div>
                )}
              </div>
            )}
          </div>
          {visibleSaved.length > 0 && (
            <div className="ws-saved">
              <strong>Saved queries</strong>
              {visibleSaved.map(({ item, index }) => (
                <div key={index}>
                  <button onClick={() => setSql(item.sql)}>{item.name}</button>
                  <button
                    aria-label={`Delete ${item.name}`}
                    onClick={() =>
                      setSaved(saved.filter((_, i) => i !== index))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {mode === "table" && (
        <>
          <div className="ws-toolbar">
            <Table2 size={18} />
            <strong>{activeTable}</strong>
            <span className="ws-muted">{tableCount} live rows</span>
            <span className="ws-spacer" />
            <label className="ws-search-label">
              <Search size={15} />
              <input
                placeholder="Search rows"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setTablePage(0);
                }}
              />
            </label>
            <button
              onClick={() => {
                const columns =
                  liveColumns[activeTable]
                    ?.filter((c) => !c.primary)
                    .map((c) => c.name) ?? [];
                const draft = `INSERT INTO ${quoteId(activeTable)} (${columns.map(quoteId).join(", ")}) VALUES (${columns.map(() => "NULL").join(", ")});`;
                onOpenSql(draft);
              }}
            >
              + Insert SQL
            </button>
            <button
              disabled={selectedRow === null}
              onClick={() => void deleteRow()}
            >
              <Trash2 size={15} /> Delete row
            </button>
          </div>
          <div className="ws-table-content">
            <DataGrid
              columns={tableRows.columns}
              rows={tableRows.rows}
              selected={selectedRow}
              onSelect={setSelectedRow}
              onCellDoubleClick={(row, column) => void editCell(row, column)}
              onSort={(column) => {
                const next = tableRows.columns[column];
                setTableSort(next);
                setTableDirection(
                  tableSort === next && tableDirection === "ASC"
                    ? "DESC"
                    : "ASC",
                );
              }}
            />
            <div className="ws-status">
              Showing {tablePage * 50 + 1}–
              {Math.min((tablePage + 1) * 50, tableCount)} of {tableCount}
              <span className="ws-spacer" />
              <button
                disabled={!tablePage}
                onClick={() => setTablePage(tablePage - 1)}
              >
                Previous
              </button>
              <button
                disabled={(tablePage + 1) * 50 >= tableCount}
                onClick={() => setTablePage(tablePage + 1)}
              >
                Next
              </button>
            </div>
            <div className="ws-table-details">
              <h3>Table structure</h3>
              {liveColumns[activeTable]?.map((column) => (
                <div key={column.name}>
                  <code>{column.name}</code>
                  <span>{column.type}</span>
                  <span>
                    {column.primary
                      ? "Primary key"
                      : column.foreign
                        ? `→ ${column.foreign}`
                        : ""}
                  </span>
                </div>
              ))}
              <p>
                Double-click a cell to edit. Changes affect only this browser’s
                local practice copy. Use Import / Export to back up or move
                data.
              </p>
            </div>
          </div>
        </>
      )}
      {mode === "schema" && (
        <>
          <div className="ws-toolbar">
            <strong>Schema Designer</strong>
            <span className="ws-muted">
              {liveTables.length} tables · {database.name}
            </span>
            <span className="ws-spacer" />
            <button onClick={addTable}>
              <Plus size={15} /> Add Table
            </button>
            <button
              onClick={() => {
                setPositions({});
                notify("Layout reset.");
              }}
            >
              <Grip size={15} /> Auto Layout
            </button>
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>
              +
            </button>
            <button
              onClick={() =>
                downloadText(
                  `${database.name}-schema.sql`,
                  schemaRows.map((r) => `${r.sql};`).join("\n\n"),
                  "text/sql",
                )
              }
            >
              <Download size={15} /> DDL
            </button>
            <button
              onClick={() =>
                downloadText(
                  `${database.name.replace(/[^a-z0-9_-]/gi, "_")}-diagram.svg`,
                  buildDiagramSvg(liveTables, liveColumns, positions),
                  "image/svg+xml",
                )
              }
              disabled={!liveTables.length}
            >
              <Download size={15} /> SVG
            </button>
          </div>
          <div className="ws-designer">
            <div className="ws-canvas">
              <div
                className="ws-canvas-inner"
                style={{ transform: `scale(${zoom})` }}
              >
                <svg
                  className="ws-links"
                  width="1000"
                  height="1100"
                  aria-label="Foreign key relationships"
                >
                  <defs>
                    <marker
                      id="ws-arrow"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path
                        d="M0 0 L8 4 L0 8"
                        fill="none"
                        stroke="#6585bd"
                        strokeWidth="1.5"
                      />
                    </marker>
                  </defs>
                  {liveTables.flatMap((name) =>
                    (liveColumns[name] || [])
                      .filter((column) => column.foreign)
                      .map((column) => {
                        const target = column.foreign!.split(".")[0];
                        if (!liveTables.includes(target)) return null;
                        const a = nodePosition(name),
                          b = nodePosition(target);
                        const x1 = a.x + 250,
                          y1 =
                            a.y +
                            28 +
                            (liveColumns[name].findIndex(
                              (c) => c.name === column.name,
                            ) +
                              1) *
                              23;
                        const x2 = b.x,
                          y2 = b.y + 36;
                        return (
                          <path
                            key={`${name}-${column.name}`}
                            d={`M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`}
                            fill="none"
                            stroke="#6585bd"
                            strokeWidth="1.5"
                            markerEnd="url(#ws-arrow)"
                          />
                        );
                      }),
                  )}
                </svg>
                {liveTables.map((name) => {
                  const model = database.tables.find((t) => t.name === name);
                  const pos = nodePosition(name);
                  return (
                    <div
                      className={`ws-node ${selectedNode === name ? "selected" : ""}`}
                      key={name}
                      style={
                        {
                          left: pos.x,
                          top: pos.y,
                          "--node-accent":
                            model?.color === "green"
                              ? "#10a67a"
                              : model?.color === "violet"
                                ? "#8858e9"
                                : model?.color === "pink"
                                  ? "#d9438e"
                                  : "#2473ed",
                        } as CSSProperties
                      }
                      onPointerDown={(event) => dragNode(event, name)}
                      onClick={() => setSelectedNode(name)}
                    >
                      <header>
                        <Table2 size={15} />
                        <strong>{name}</strong>
                        <span>↕</span>
                      </header>
                      {liveColumns[name]?.map((column) => (
                        <div className="ws-node-column" key={column.name}>
                          <span>
                            {column.primary ? "🔑" : column.foreign ? "↗" : "▫"}
                          </span>
                          <span>{column.name}</span>
                          <small>{column.type}</small>
                        </div>
                      )) || (
                        <div className="ws-node-column">
                          Select to inspect columns
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <aside className="ws-designer-side">
              <div className="ws-tabs">
                {(["Properties", "DDL", "Guide"] as const).map((tab) => (
                  <button
                    className={designerTab === tab ? "active" : ""}
                    onClick={() => setDesignerTab(tab)}
                    key={tab}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {designerTab === "Properties" && (
                <>
                  {selectedNode ? (
                    <>
                      <h3>{selectedNode}</h3>
                      <p>
                        {database.tables.find((t) => t.name === selectedNode)
                          ?.description || "Local table"}
                      </p>
                      <button onClick={addColumn}>
                        <Plus size={15} /> Add column
                      </button>
                      <h4>Relationships</h4>
                      {liveColumns[selectedNode]
                        ?.filter((c) => c.foreign)
                        .map((c) => (
                          <div className="ws-relationship" key={c.name}>
                            {c.name} → {c.foreign}
                          </div>
                        ))}
                      <p className="ws-muted">
                        Drag cards to arrange the diagram. Schema changes run
                        directly against your local SQLite copy.
                      </p>
                    </>
                  ) : (
                    <div className="ws-empty">
                      Select a table to inspect it.
                    </div>
                  )}
                </>
              )}
              {designerTab === "DDL" && (
                <pre className="ws-output-pre">
                  {schemaRows.find((r) => r.name === selectedNode)?.sql ||
                    schemaRows.map((r) => r.sql + ";").join("\n\n")}
                </pre>
              )}
              {designerTab === "Guide" && (
                <div className="ws-help">
                  <h3>Explore the model</h3>
                  <p>
                    Keys identify rows; foreign keys connect tables. Drag cards
                    to examine a relationship. Open a table to browse live rows,
                    or use SQL Lab to change the schema.
                  </p>
                  <p>
                    Normalization check: watch for repeated groups, attributes
                    that depend on only part of a compound key, and values that
                    depend on non-key columns.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function ClockLabel({ item }: { item: HistoryItem }) {
  return (
    <span>
      {item.at} · {item.duration} ms · {item.rows} rows
    </span>
  );
}
function DataGrid({
  columns,
  rows,
  onSort,
  sort,
  selected,
  onSelect,
  onCellDoubleClick,
}: {
  columns: string[];
  rows: (string | number | null)[][];
  onSort?: (column: number) => void;
  sort?: { column: number; asc: boolean } | null;
  selected?: number | null;
  onSelect?: (index: number) => void;
  onCellDoubleClick?: (row: number, column: number) => void;
}) {
  return (
    <div className="ws-grid-wrap">
      <table className="ws-grid">
        <thead>
          <tr>
            {onSelect && <th>#</th>}
            {columns.map((name, index) => (
              <th key={`${name}-${index}`} onClick={() => onSort?.(index)}>
                {name} {sort?.column === index ? (sort.asc ? "↑" : "↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={selected === index ? "selected" : ""}
              onClick={() => onSelect?.(index)}
            >
              {onSelect && <td>{index + 1}</td>}
              {row.map((value, column) => (
                <td
                  key={column}
                  onDoubleClick={() => onCellDoubleClick?.(index, column)}
                >
                  {fmt(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="ws-empty">No rows to display.</div>}
    </div>
  );
}
function Chart({ result }: { result: SqlResult }) {
  const numeric = result.columns.findIndex((_, i) =>
    result.rows.some((row) => typeof row[i] === "number"),
  );
  if (numeric < 0)
    return (
      <div className="ws-empty">
        Run a query with a numeric column to chart its results.
      </div>
    );
  const max = Math.max(
    ...result.rows.slice(0, 12).map((row) => Number(row[numeric]) || 0),
    1,
  );
  return (
    <div className="ws-chart">
      {result.rows.slice(0, 12).map((row, index) => (
        <div key={index}>
          <span>{String(row[0] ?? index + 1)}</span>
          <div
            style={{
              width: `${Math.max(2, (Number(row[numeric]) / max) * 100)}%`,
            }}
          />
          <strong>{row[numeric]}</strong>
        </div>
      ))}
    </div>
  );
}
