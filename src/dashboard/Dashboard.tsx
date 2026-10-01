import { lazy, Suspense, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  BookText,
  ChevronRight,
  Code2,
  Database,
  Download,
  GraduationCap,
  Import,
  Table2,
  Workflow,
} from "lucide-react";
import type { Database as DbType, TabKind } from "../data";
import {
  downloadBytes,
  executeSql,
  getDatabaseBytes,
} from "../workspace/database";
import { rowCountQueries } from "./summary";

const TheoryHome = lazy(() => import("./TheoryHome"));

type TableSummary = { name: string; rows: number | null };
type Summary = { tables: TableSummary[]; relationships: number };

export default function Dashboard({
  database,
  revision,
  openTab,
  notify,
}: {
  database: DbType;
  revision: number;
  openTab: (
    kind: TabKind,
    title: string,
    table?: string,
    lessonId?: string,
  ) => void;
  notify: (message: string) => void;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [backingUp, setBackingUp] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState(
    import.meta.env.PROD ? "Preparing offline access…" : "Development mode",
  );

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) {
      setOfflineStatus("Offline access unavailable in this browser");
      return;
    }
    let alive = true;
    const timer = window.setTimeout(() => {
      if (alive) setOfflineStatus("Offline access unavailable");
    }, 5000);
    void navigator.serviceWorker.ready.then(() => {
      if (alive) {
        window.clearTimeout(timer);
        setOfflineStatus("Offline ready");
      }
    });
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  async function backUp() {
    setBackingUp(true);
    try {
      const bytes = await getDatabaseBytes(database.name);
      const fileName = `${database.name.replace(/[^a-z0-9_-]/gi, "_")}.sqlite`;
      downloadBytes(fileName, bytes);
      notify(`${fileName} downloaded to your device`);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBackingUp(false);
    }
  }

  useEffect(() => {
    let alive = true;
    setSummary(null);
    setError("");
    void (async () => {
      try {
        const schema = await executeSql(
          database.name,
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        );
        const names = schema.rows.map(([name]) => String(name));
        const rowCounts = new Map<number, number>();
        for (const query of rowCountQueries(names)) {
          const counts = await executeSql(database.name, query);
          for (const [index, count] of counts.rows)
            rowCounts.set(Number(index), Number(count));
        }
        const foreignKeys = await executeSql(
          database.name,
          "SELECT COUNT(*) FROM sqlite_master AS m JOIN pragma_foreign_key_list(m.name) AS f WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%'",
        );
        if (alive)
          setSummary({
            tables: names.map((name, index) => ({
              name,
              rows: rowCounts.get(index) ?? null,
            })),
            relationships: Number(foreignKeys.rows[0]?.[0] ?? 0),
          });
      } catch (cause) {
        if (alive)
          setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();
    return () => {
      alive = false;
    };
  }, [database.name, revision]);

  const totalRows = summary?.tables.reduce(
    (count, table) => count + (table.rows ?? 0),
    0,
  );
  return (
    <div className="home-view content-scroll">
      <header className="home-hero">
        <div className="home-hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> BROWSER-ONLY DBMS STUDIO
          </div>
          <h1>
            Understand databases.
            <br />
            <span>Then build with them.</span>
          </h1>
          <p className="lead">
            Explore theory through visual lessons, practice SQL on local data,
            and connect each concept to a working database.
          </p>
          <div className="home-hero-actions">
            <button
              className="home-hero-primary"
              onClick={() => openTab("learn", "Learning Center")}
            >
              Explore theory <ArrowRight size={16} />
            </button>
            <button
              className="home-hero-secondary"
              onClick={() => openTab("query", "Query 1")}
            >
              Open SQL workspace
            </button>
          </div>
        </div>
        <div className="home-hero-panel" aria-label="Learning approach">
          <span>YOUR LEARNING PATH</span>
          <strong>
            Read the idea.
            <br />
            See it move.
            <br />
            Try it yourself.
          </strong>
          <div>
            <BookOpen size={16} /> Theory <ChevronRight size={14} />{" "}
            Visualization <ChevronRight size={14} /> Practice
          </div>
        </div>
      </header>
      {error && <p role="alert">Unable to inspect this database: {error}</p>}
      <div className="home-stats" aria-label="Live database summary">
        <div>
          <Database size={18} />
          <strong>{database.name}</strong>
          <small>Active local database</small>
        </div>
        <div>
          <Table2 size={18} />
          <strong>{summary ? summary.tables.length : "…"}</strong>
          <small>Live tables</small>
        </div>
        <div>
          <Workflow size={18} />
          <strong>{summary ? summary.relationships : "…"}</strong>
          <small>Foreign keys</small>
        </div>
        <div>
          <Activity size={18} />
          <strong>{totalRows?.toLocaleString() ?? "…"}</strong>
          <small>Live rows</small>
        </div>
      </div>
      <div className="dashboard-safety">
        <span>
          Your data stays in this browser. Download a backup before clearing
          browser storage or switching devices. {offlineStatus}.
        </span>
        <button
          type="button"
          onClick={() => void backUp()}
          disabled={backingUp}
        >
          <Download size={16} />
          {backingUp ? "Preparing…" : "Download SQLite backup"}
        </button>
      </div>
      <Suspense
        fallback={
          <div className="theory-home-loading" role="status">
            Loading theory categories…
          </div>
        }
      >
        <TheoryHome
          openLesson={(id) =>
            openTab("learn", "Learning Center", undefined, id)
          }
          openCatalog={() => openTab("learn", "Learning Center")}
        />
      </Suspense>
      <div className="section-heading">
        <div>
          <h2>Jump back in</h2>
          <p>SQL and file processing run entirely in your browser.</p>
        </div>
      </div>
      <div className="feature-grid">
        <button onClick={() => openTab("terms", "DBMS Dictionary")}>
          <span className="feature-icon blue">
            <BookText />
          </span>
          <strong>DBMS dictionary</strong>
          <small>Search 200 terms across 10 topics</small>
          <ChevronRight size={17} />
        </button>
        <button onClick={() => openTab("query", "Query 1")}>
          <span className="feature-icon blue">
            <Code2 />
          </span>
          <strong>SQL workspace</strong>
          <small>Run SQL and inspect local results</small>
          <ChevronRight size={17} />
        </button>
        <button onClick={() => openTab("schema", "Schema Designer")}>
          <span className="feature-icon violet">
            <Workflow />
          </span>
          <strong>Schema designer</strong>
          <small>Explore tables and relationships</small>
          <ChevronRight size={17} />
        </button>
        <button onClick={() => openTab("learn", "Learning Center")}>
          <span className="feature-icon green">
            <GraduationCap />
          </span>
          <strong>Learning center</strong>
          <small>Practice concepts step by step</small>
          <ChevronRight size={17} />
        </button>
        <button onClick={() => openTab("import", "Import / Export")}>
          <span className="feature-icon orange">
            <Import />
          </span>
          <strong>Import / Export</strong>
          <small>Move files without a server</small>
          <ChevronRight size={17} />
        </button>
      </div>
      <div className="section-heading">
        <div>
          <h2>Tables in {database.name}</h2>
          <p>Counts reflect the current browser database.</p>
        </div>
      </div>
      <div className="home-table-list">
        {summary?.tables.map((table, index) => (
          <button
            key={table.name}
            onClick={() => openTab("table", table.name, table.name)}
          >
            <span
              className={`table-mini ${["blue", "green", "violet", "pink", "amber"][index % 5]}`}
            >
              <Table2 size={17} />
            </span>
            <span>
              <strong>{table.name}</strong>
              <small>
                {database.tables.find((item) => item.name === table.name)
                  ?.description ?? "Local table"}
              </small>
            </span>
            <span className="home-row-count">
              {table.rows?.toLocaleString() ?? "—"} rows
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
        {summary && summary.tables.length === 0 && (
          <p className="dashboard-empty">
            No tables yet. Import a file or create a table in the SQL workspace.
          </p>
        )}
      </div>
    </div>
  );
}
