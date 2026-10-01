import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Activity,
  BookOpen,
  BookText,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Clock3,
  Code2,
  Columns3,
  Database,
  Download,
  Ellipsis,
  FileCode2,
  FileInput,
  FileJson2,
  FileSpreadsheet,
  Filter,
  Folder,
  GraduationCap,
  History,
  Import,
  Info,
  KeyRound,
  Layers3,
  LayoutDashboard,
  Maximize2,
  Moon,
  MoreHorizontal,
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Plus,
  Search,
  Settings2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Table2,
  Upload,
  Workflow,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { databases, sampleRows, sampleSql } from "./data";
import type { Column, Database as DbType, TabKind, WorkspaceTab } from "./data";
import Workspace from "./workspace/Workspace";
import { executeSql, listLocalDatabases } from "./workspace/database";
import ImportExportStudio from "./importExport/ImportExportStudio";
import Dashboard from "./dashboard/Dashboard";
import { writeStoredText } from "./storage";

const LearningCenter = lazy(() => import("./learning/LearningCenter"));
const Glossary = lazy(() => import("./learning/Glossary"));

type RecentQuery = {
  sql: string;
  at: string;
  rows: number;
  database?: string;
};
function getRecentQueries(databaseName: string): RecentQuery[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("dbms-studio-query-history") ?? "[]",
    );
    return Array.isArray(value)
      ? value.filter(
          (item): item is RecentQuery =>
            typeof item?.sql === "string" &&
            typeof item?.at === "string" &&
            typeof item?.rows === "number" &&
            (item.database === databaseName ||
              (!item.database && databaseName === "RetailDB")),
        )
      : [];
  } catch {
    return [];
  }
}

type AppState = {
  theme: "light" | "dark";
  database: string;
  tabs: WorkspaceTab[];
  activeTab: string;
  selected: string;
  leftOpen: boolean;
  rightOpen: boolean;
  bottomOpen: boolean;
  leftWidth: number;
  rightWidth: number;
  bottomHeight: number;
};
const initialTabs: WorkspaceTab[] = [
  { id: "home", kind: "home", title: "Overview" },
  { id: "query-1", kind: "query", title: "Query 1", database: "RetailDB" },
  {
    id: "schema",
    kind: "schema",
    title: "Schema Designer",
    database: "RetailDB",
  },
];
const isDatabaseTab = (kind: TabKind) =>
  kind === "query" || kind === "schema" || kind === "table";
const defaults: AppState = {
  theme: "light",
  database: "RetailDB",
  tabs: initialTabs,
  activeTab: "query-1",
  selected: "table:orders",
  leftOpen: true,
  rightOpen: true,
  bottomOpen: true,
  leftWidth: 264,
  rightWidth: 338,
  bottomHeight: 260,
};
const storageKey = "dbms-studio-phase1-state";
function loadState(): AppState {
  try {
    const raw = localStorage.getItem(storageKey);
    const state = raw
      ? ({ ...defaults, ...JSON.parse(raw) } as AppState)
      : { ...defaults };
    if (
      !Array.isArray(state.tabs) ||
      !state.tabs.length ||
      !state.tabs.some((t) => t.id === state.activeTab)
    )
      return defaults;
    state.tabs = state.tabs.map((tab) =>
      isDatabaseTab(tab.kind)
        ? { ...tab, database: tab.database || state.database }
        : tab,
    );
    if (window.matchMedia("(max-width: 1100px)").matches)
      return { ...state, leftOpen: false, rightOpen: false };
    return state;
  } catch {
    return defaults;
  }
}
function IconButton({
  icon: Icon,
  title,
  onClick,
  active = false,
  disabled = false,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      className={`icon-button ${active ? "is-active" : ""} ${className}`}
      type="button"
      aria-label={title}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={17} />
    </button>
  );
}
function Button({
  children,
  icon: Icon,
  onClick,
  variant = "subtle",
  disabled = false,
  title,
  className = "",
}: {
  children: ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "subtle" | "primary" | "ghost";
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`button button-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {Icon && <Icon size={16} />}
      <span>{children}</span>
    </button>
  );
}
function useMedia(query: string) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );
  useEffect(() => {
    const m = window.matchMedia(query);
    const cb = () => setMatches(m.matches);
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  }, [query]);
  return matches;
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [explorerSearch, setExplorerSearch] = useState("");
  const [inspectorTab, setInspectorTab] = useState("Properties");
  const [bottomTab, setBottomTab] = useState("Results");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Schemas: true,
    Tables: true,
    "schema:public": true,
  });
  const [menu, setMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [importMode, setImportMode] = useState<"Import" | "Export">("Import");
  const [queryText, setQueryText] = useState(() => {
    try {
      return localStorage.getItem("dbms-studio-sql-draft") ?? sampleSql;
    } catch {
      return sampleSql;
    }
  });
  const [runSignal, setRunSignal] = useState(0);
  const [schemaRevision, setSchemaRevision] = useState(0);
  const [liveObjects, setLiveObjects] = useState<
    { name: string; type: string }[]
  >([]);
  const [liveObjectsFor, setLiveObjectsFor] = useState("");
  const [localNames, setLocalNames] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(
    "total_amount",
  );
  const [recentOpen, setRecentOpen] = useState(true);
  const isTablet = useMedia("(max-width: 1100px)");
  useEffect(() => {
    if (isTablet)
      setState((s) => ({ ...s, leftOpen: false, rightOpen: false }));
  }, [isTablet]);
  const database = useMemo<DbType>(
    () =>
      databases.find((d) => d.name === state.database) ?? {
        name: state.database,
        description: "Imported local database stored in this browser.",
        tables:
          liveObjectsFor === state.database
            ? liveObjects
                .filter((item) => item.type === "table")
                .map((item) => ({
                  name: item.name,
                  description: "Local table",
                  rows: 0,
                  color: "blue" as const,
                  columns: [],
                }))
            : [],
      },
    [state.database, liveObjects, liveObjectsFor],
  );
  useEffect(() => {
    void listLocalDatabases()
      .then(setLocalNames)
      .catch(() => setLocalNames([]));
  }, [schemaRevision]);
  const active =
    state.tabs.find((t) => t.id === state.activeTab) ?? state.tabs[0];
  const recentQueries = getRecentQueries(database.name).slice(0, 4);
  const selectedTableName = state.selected.startsWith("table:")
    ? state.selected.slice(6)
    : (active.table ?? "orders");
  const selectedTable = database.tables.find(
    (t) => t.name === selectedTableName,
  ) ??
    database.tables[0] ?? {
      name: selectedTableName,
      description: "Local table",
      rows: 0,
      color: "blue" as const,
      columns: [],
    };
  useEffect(() => {
    let alive = true;
    executeSql(
      database.name,
      "SELECT name, type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name",
    )
      .then((answer) => {
        if (alive) {
          setLiveObjects(
            answer.rows.map(([name, type]) => ({
              name: String(name),
              type: String(type),
            })),
          );
          setLiveObjectsFor(database.name);
        }
      })
      .catch(() => {
        if (alive) {
          setLiveObjects([]);
          setLiveObjectsFor(database.name);
        }
      });
    return () => {
      alive = false;
    };
  }, [database.name, schemaRevision]);
  const selectedCol = selectedTable.columns.find(
    (c) => c.name === selectedColumn,
  ) ??
    selectedTable.columns[0] ?? { name: "", type: "TEXT" };
  const explorerObjects = liveObjectsFor === database.name ? liveObjects : [];
  const explorerTables = useMemo(
    () =>
      liveObjectsFor === database.name
        ? liveObjects.filter((item) => item.type === "table")
        : database.tables,
    [database, liveObjects, liveObjectsFor],
  );
  const nextId = useRef(2);
  useEffect(() => {
    writeStoredText(storageKey, JSON.stringify(state));
    document.documentElement.dataset.theme = state.theme;
  }, [state]);
  useEffect(() => {
    writeStoredText("dbms-studio-sql-draft", queryText);
  }, [queryText]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);
  const update = (patch: Partial<AppState>) =>
    setState((s) => ({ ...s, ...patch }));
  const notify = (message: string) => setToast(message);
  function openTab(
    kind: TabKind,
    title: string,
    table?: string,
    lessonId?: string,
  ) {
    const reusable = state.tabs.find(
      (t) =>
        t.kind === kind &&
        (!isDatabaseTab(kind) || t.database === state.database) &&
        (kind !== "table" || t.table === table) &&
        (kind !== "query" || t.title === title),
    );
    if (reusable) {
      setState((current) => ({
        ...current,
        tabs:
          kind === "learn"
            ? current.tabs.map((tab) =>
                tab.id === reusable.id ? { ...tab, lessonId } : tab,
              )
            : current.tabs,
        activeTab: reusable.id,
        selected:
          kind === "table" && table ? `table:${table}` : current.selected,
      }));
      return;
    }
    const id = `${kind}-${Date.now()}-${nextId.current++}`;
    setState((s) => ({
      ...s,
      tabs: [
        ...s.tabs,
        {
          id,
          kind,
          title,
          table,
          lessonId: kind === "learn" ? lessonId : undefined,
          database: isDatabaseTab(kind) ? s.database : undefined,
        },
      ],
      activeTab: id,
      selected: kind === "table" && table ? `table:${table}` : s.selected,
    }));
    if (kind === "table") setSelectedColumn(null);
  }
  function closeTab(id: string) {
    setState((s) => {
      if (s.tabs.length === 1) return s;
      const index = s.tabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      const nextTab =
        s.activeTab === id
          ? (tabs[Math.max(0, index - 1)] ?? tabs[0])
          : s.tabs.find((tab) => tab.id === s.activeTab);
      return {
        ...s,
        tabs,
        activeTab: nextTab?.id ?? tabs[0].id,
        database: nextTab?.database ?? s.database,
        selected: nextTab?.table ? `table:${nextTab.table}` : s.selected,
      };
    });
  }
  function selectExplorer(type: string, name: string) {
    update({ selected: `${type}:${name}` });
    if (type === "table") {
      setSelectedColumn(null);
      openTab("table", name, name);
    } else if (type === "database") {
      update({ database: name, selected: "database:" + name });
      openTab("home", "Overview");
    } else if (type === "schema") {
      openTab("schema", "Schema Designer");
    }
  }
  function newQuery() {
    openTab(
      "query",
      `Query ${state.tabs.filter((t) => t.kind === "query").length + 1}`,
    );
  }
  function openPreparedSql(statement: string) {
    const id = `query-${Date.now()}-${nextId.current++}`;
    writeStoredText(`dbms-studio-draft-${id}`, statement);
    setQueryText(statement);
    setState((current) => ({
      ...current,
      tabs: [
        ...current.tabs,
        {
          id,
          kind: "query",
          database: current.database,
          title: `Query ${current.tabs.filter((tab) => tab.kind === "query").length + 1}`,
        },
      ],
      activeTab: id,
    }));
  }
  function completeImport(name: string) {
    setSchemaRevision((revision) => revision + 1);
    if (name !== state.database)
      update({ database: name, selected: `database:${name}` });
  }
  function runQuery() {
    if (active.kind !== "query") {
      openTab(
        "query",
        `Query ${state.tabs.filter((t) => t.kind === "query").length + 1}`,
      );
    } else {
      setRunSignal((value) => value + 1);
    }
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (key === "b" && !e.shiftKey) {
        e.preventDefault();
        setState((s) => ({ ...s, leftOpen: !s.leftOpen }));
      }
      if (key === "b" && e.shiftKey) {
        e.preventDefault();
        setState((s) => ({ ...s, rightOpen: !s.rightOpen }));
      }
      if (key === "enter") {
        e.preventDefault();
        runQuery();
      }
      if (key === "w") {
        e.preventDefault();
        closeTab(state.activeTab);
      }
      if (key === "t" && e.shiftKey) {
        e.preventDefault();
        newQuery();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  function startResize(
    side: "left" | "right" | "bottom",
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    const startX = event.clientX,
      startY = event.clientY;
    const start =
      side === "left"
        ? state.leftWidth
        : side === "right"
          ? state.rightWidth
          : state.bottomHeight;
    const move = (e: PointerEvent) => {
      const next =
        side === "left"
          ? start + e.clientX - startX
          : side === "right"
            ? start + startX - e.clientX
            : start + startY - e.clientY;
      const max =
        side === "bottom"
          ? window.innerHeight * 0.55
          : window.innerWidth * 0.38;
      const min = side === "bottom" ? 150 : 220;
      setState((s) => ({
        ...s,
        [side === "left"
          ? "leftWidth"
          : side === "right"
            ? "rightWidth"
            : "bottomHeight"]: Math.round(Math.max(min, Math.min(max, next))),
      }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      document.body.classList.remove("resizing");
    };
    document.body.classList.add("resizing");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }
  const commands = useMemo(
    () =>
      [
        ...explorerTables.map((t) => ({
          label: t.name,
          detail: `Table · ${database.name}`,
          icon: Table2,
          action: () => selectExplorer("table", t.name),
        })),
        {
          label: "New SQL query",
          detail: "Workspace",
          icon: Code2,
          action: newQuery,
        },
        {
          label: "Schema Designer",
          detail: "Workspace",
          icon: Workflow,
          action: () => openTab("schema", "Schema Designer"),
        },
        {
          label: "Learning Center",
          detail: "Explore concepts",
          icon: GraduationCap,
          action: () => openTab("learn", "Learning Center"),
        },
        {
          label: "Import / Export Studio",
          detail: "Files",
          icon: Import,
          action: () => openTab("import", "Import / Export"),
        },
        {
          label: "Toggle theme",
          detail: "Appearance",
          icon: Sun,
          action: () =>
            update({ theme: state.theme === "light" ? "dark" : "light" }),
        },
      ].filter((c) =>
        (c.label + " " + c.detail).toLowerCase().includes(search.toLowerCase()),
      ),
    [database, explorerTables, search, state.theme, state.tabs],
  );
  async function chooseFile(chosen: File | null) {
    if (!chosen) return;
    setFile(chosen);
    const ext = chosen.name.split(".").pop()?.toLowerCase();
    if (["csv", "tsv", "json", "sql", "txt"].includes(ext ?? "")) {
      try {
        setFilePreview(await chosen.slice(0, 8000).text());
      } catch {
        setFilePreview("Unable to preview this file.");
      }
    } else
      setFilePreview(
        "Binary SQLite file selected. Validation runs locally in your browser.",
      );
    notify(`${chosen.name} selected for local validation`);
  }
  const style = {
    "--left-width": `${state.leftWidth}px`,
    "--right-width": `${state.rightWidth}px`,
    "--bottom-height": `${state.bottomHeight}px`,
  } as CSSProperties;
  return (
    <div className="app" style={style}>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => openTab("home", "Overview")}
          aria-label="DBMS Studio home"
        >
          <span className="brand-mark">
            <Database size={22} />
          </span>
          <span className="brand-copy">
            <strong>
              DBMS Studio <em>Browser</em>
            </strong>
            <small>
              Visualize <b>·</b> Query <b>·</b> Explore <b>·</b> Learn
            </small>
          </span>
        </button>
        <div className="top-divider" />
        <div className="dropdown-wrap">
          <button
            className="top-select"
            onClick={() => setMenu(menu === "database" ? null : "database")}
          >
            <Database size={17} />
            <strong>{database.name}</strong>
            <ChevronDown size={16} />
          </button>
          {menu === "database" && (
            <div className="dropdown database-menu">
              {[
                ...databases,
                ...localNames
                  .filter((name) => !databases.some((db) => db.name === name))
                  .map(
                    (name) =>
                      ({
                        name,
                        description: "Imported local database",
                        tables: [],
                      }) as DbType,
                  ),
              ].map((db) => (
                <button
                  key={db.name}
                  onClick={() => {
                    update({
                      database: db.name,
                      selected: "database:" + db.name,
                    });
                    setMenu(null);
                    openTab("home", "Overview");
                  }}
                >
                  <Database size={16} />
                  <span>
                    <strong>{db.name}</strong>
                    <small>{db.description}</small>
                  </span>
                  {db.name === database.name && <Check size={15} />}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="global-search" onClick={() => setSearchOpen(true)}>
          <Search size={18} />
          <span>Search tables, fields, or commands...</span>
          <kbd>⌘ K</kbd>
        </button>
        <Button
          icon={Play}
          variant="primary"
          onClick={runQuery}
          className="run-button"
        >
          Run Query
        </Button>
        <Button
          icon={Import}
          onClick={() => openTab("import", "Import / Export")}
          className="import-button"
        >
          Import / Export
        </Button>
        <div className="dropdown-wrap workspace-control">
          <button
            className="top-select workspace-select"
            onClick={() => setMenu(menu === "workspace" ? null : "workspace")}
          >
            <span className="workspace-label">
              <small>Workspace</small>
              <strong>Analyst</strong>
            </span>
            <ChevronDown size={16} />
          </button>
          {menu === "workspace" && (
            <div className="dropdown small-dropdown">
              <div className="dropdown-heading">Current workspace</div>
              <button onClick={() => setMenu(null)}>
                <Check size={15} />
                Analyst <small>Local browser</small>
              </button>
            </div>
          )}
        </div>
        <IconButton
          icon={state.theme === "light" ? Moon : Sun}
          title={`Switch to ${state.theme === "light" ? "dark" : "light"} theme`}
          onClick={() =>
            update({ theme: state.theme === "light" ? "dark" : "light" })
          }
        />
        <div className="dropdown-wrap profile-wrap">
          <button
            className="profile"
            onClick={() => setMenu(menu === "profile" ? null : "profile")}
          >
            <span className="avatar">JD</span>
            <span>
              <strong>Jane Doe</strong>
              <small>Local workspace</small>
            </span>
            <ChevronDown size={15} />
          </button>
          {menu === "profile" && (
            <div className="dropdown profile-menu">
              <div className="dropdown-heading">Stored in this browser</div>
              <button
                onClick={() => {
                  setMenu(null);
                  notify(
                    "Your workspace layout is saved automatically in this browser.",
                  );
                }}
              >
                <Settings2 size={16} />
                Workspace preferences
              </button>
              <button
                onClick={() => {
                  setMenu(null);
                  openTab("learn", "Learning Center");
                }}
              >
                <CircleHelp size={16} />
                Help & learning
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="shell">
        {state.leftOpen && (
          <aside className={`explorer ${isTablet ? "tablet-drawer" : ""}`}>
            <div className="pane-heading">
              <strong>Database Explorer</strong>
              <div>
                <IconButton icon={Plus} title="New query" onClick={newQuery} />
                <IconButton
                  icon={ChevronLeft}
                  title="Collapse explorer (Ctrl+B)"
                  onClick={() => update({ leftOpen: false })}
                />
              </div>
            </div>
            <label className="explorer-filter">
              <Search size={14} />
              <input
                value={explorerSearch}
                onChange={(e) => setExplorerSearch(e.target.value)}
                placeholder="Filter explorer..."
                aria-label="Filter database explorer"
              />
              {explorerSearch && (
                <button
                  onClick={() => setExplorerSearch("")}
                  aria-label="Clear filter"
                >
                  <X size={13} />
                </button>
              )}
            </label>
            <div className="explorer-scroll">
              <button
                className="tree-row root-row"
                onClick={() => selectExplorer("database", database.name)}
              >
                <ChevronDown size={14} />
                <Database size={17} />
                <strong>{database.name}</strong>
                <span className="local-pill">local</span>
              </button>
              <TreeGroup
                title="Schemas"
                icon={Folder}
                count={1}
                open={!!expanded.Schemas}
                toggle={() =>
                  setExpanded((x) => ({ ...x, Schemas: !x.Schemas }))
                }
              />
              {expanded.Schemas &&
                ["main"]
                  .filter((x) => x.includes(explorerSearch.toLowerCase()))
                  .map((name) => (
                    <button
                      className={`tree-row tree-child ${state.selected === `schema:${name}` ? "selected" : ""}`}
                      key={name}
                      onClick={() => selectExplorer("schema", name)}
                    >
                      <ChevronRight size={13} />
                      <Layers3 size={16} />
                      <span>{name}</span>
                    </button>
                  ))}
              <TreeGroup
                title="Tables"
                icon={Table2}
                count={explorerTables.length}
                open={!!expanded.Tables}
                toggle={() => setExpanded((x) => ({ ...x, Tables: !x.Tables }))}
              />
              {expanded.Tables &&
                explorerTables
                  .filter((table) =>
                    table.name.includes(explorerSearch.toLowerCase()),
                  )
                  .map((table) => (
                    <button
                      key={table.name}
                      className={`tree-row tree-child table-tree ${state.selected === `table:${table.name}` ? "selected" : ""}`}
                      onClick={() => selectExplorer("table", table.name)}
                    >
                      <ChevronRight size={13} />
                      <Table2 size={15} />
                      <span>{table.name}</span>
                    </button>
                  ))}
              {(["Views", "Indexes", "Triggers"] as const)
                .filter(
                  (name) =>
                    name.toLowerCase().includes(explorerSearch.toLowerCase()) ||
                    !explorerSearch,
                )
                .map((name) => {
                  const icons: { [key: string]: LucideIcon } = {
                    Views: Columns3,
                    Indexes: KeyRound,
                    Triggers: Activity,
                  };
                  const kind =
                    name === "Views"
                      ? "view"
                      : name === "Indexes"
                        ? "index"
                        : "trigger";
                  const objects = explorerObjects.filter(
                    (item) => item.type === kind,
                  );
                  return (
                    <div key={name}>
                      <TreeGroup
                        title={name}
                        icon={icons[name]}
                        count={objects.length}
                        open={!!expanded[name]}
                        toggle={() =>
                          setExpanded((x) => ({ ...x, [name]: !x[name] }))
                        }
                      />
                      {expanded[name] &&
                        objects.map((item) => (
                          <button
                            key={item.name}
                            className="tree-row tree-child"
                            onClick={() =>
                              item.type === "view"
                                ? openTab("table", item.name, item.name)
                                : openPreparedSql(
                                    `SELECT sql FROM sqlite_master WHERE name = '${item.name.replaceAll("'", "''")}';`,
                                  )
                            }
                          >
                            <ChevronRight size={13} />
                            <span>{item.name}</span>
                          </button>
                        ))}
                    </div>
                  );
                })}
              <button
                className="tree-row"
                onClick={() => openTab("query", "Query 1")}
              >
                <History size={16} />
                <span>Query history</span>
              </button>
              {explorerSearch &&
                !explorerTables.some((t) =>
                  t.name.includes(explorerSearch.toLowerCase()),
                ) && <p className="empty-filter">No matching tables</p>}
            </div>
            {recentOpen && (
              <div className="recent-box">
                <div className="recent-title">
                  <strong>Recent Queries</strong>
                  <IconButton
                    icon={X}
                    title="Hide recent queries"
                    onClick={() => setRecentOpen(false)}
                  />
                </div>
                {recentQueries.map((item, i) => (
                  <button
                    key={`${item.at}-${i}`}
                    onClick={() => openPreparedSql(item.sql)}
                  >
                    <span className={`recent-dot dot-${i}`} />
                    <span>
                      {item.sql
                        .split("\n")
                        .find((line) => line.trim())
                        ?.trim()
                        .slice(0, 35) ?? "SQL query"}
                      <small>
                        {item.at} · {item.rows} rows
                      </small>
                    </span>
                  </button>
                ))}
                {!recentQueries.length && (
                  <p className="dashboard-empty">Run a query to see it here.</p>
                )}
              </div>
            )}
            {!recentOpen && (
              <button
                className="show-recent"
                onClick={() => setRecentOpen(true)}
              >
                Show recent queries
              </button>
            )}
            <div className="explorer-footer">
              <span className="status-dot" /> Local practice workspace
            </div>
          </aside>
        )}
        {state.leftOpen && (
          <div
            className="resize-handle resize-left"
            onPointerDown={(e) => startResize("left", e)}
            role="separator"
            aria-label="Resize explorer"
          />
        )}
        <main className="work-area">
          <div className="tabbar">
            <div className="tab-scroll">
              {!state.leftOpen && (
                <IconButton
                  icon={PanelLeftOpen}
                  title="Open explorer (Ctrl+B)"
                  onClick={() => update({ leftOpen: true })}
                />
              )}{" "}
              {state.tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`workspace-tab ${active.id === tab.id ? "active" : ""}`}
                  onClick={() =>
                    update({
                      activeTab: tab.id,
                      database: tab.database ?? state.database,
                      selected: tab.table
                        ? `table:${tab.table}`
                        : state.selected,
                    })
                  }
                >
                  <TabIcon kind={tab.kind} />
                  <span>{tab.title}</span>
                  {state.tabs.length > 1 && (
                    <span
                      className="tab-close"
                      role="button"
                      aria-label={`Close ${tab.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                    >
                      <X size={14} />
                    </span>
                  )}
                </button>
              ))}
              <IconButton
                icon={Plus}
                title="New SQL query (Ctrl+Shift+T)"
                onClick={newQuery}
              />
            </div>
            <div className="tabbar-end">
              {(isTablet || !state.rightOpen) && (
                <IconButton
                  icon={state.rightOpen ? PanelRightClose : PanelRightOpen}
                  title={`${state.rightOpen ? "Close" : "Open"} properties (Ctrl+Shift+B)`}
                  onClick={() => update({ rightOpen: !state.rightOpen })}
                />
              )}
              <span className="browser-badge">
                <span className="status-dot" /> Browser only
              </span>
            </div>
          </div>
          {active.kind === "home" && (
            <Dashboard
              database={database}
              revision={schemaRevision}
              openTab={openTab}
              notify={notify}
            />
          )}
          {active.kind === "query" && (
            <Workspace
              key={active.id}
              database={database}
              mode="query"
              tabId={active.id}
              runSignal={runSignal}
              initialSql={queryText}
              onSqlChange={setQueryText}
              onOpenSql={openPreparedSql}
              onDatabaseChange={() =>
                setSchemaRevision((revision) => revision + 1)
              }
              notify={notify}
            />
          )}
          {active.kind === "schema" && (
            <Workspace
              key={active.id}
              database={database}
              mode="schema"
              tabId={active.id}
              runSignal={runSignal}
              initialSql={queryText}
              onSqlChange={setQueryText}
              onOpenSql={openPreparedSql}
              onDatabaseChange={() =>
                setSchemaRevision((revision) => revision + 1)
              }
              notify={notify}
            />
          )}
          {active.kind === "table" && (
            <Workspace
              key={active.id}
              database={database}
              mode="table"
              tabId={active.id}
              tableName={active.table ?? selectedTable.name}
              runSignal={runSignal}
              initialSql={queryText}
              onSqlChange={setQueryText}
              onOpenSql={openPreparedSql}
              onDatabaseChange={() =>
                setSchemaRevision((revision) => revision + 1)
              }
              notify={notify}
            />
          )}
          {active.kind === "learn" && (
            <Suspense fallback={<div role="status">Loading lessons…</div>}>
              <LearningCenter
                key={`${active.id}:${active.lessonId ?? "home"}`}
                initialLessonId={active.lessonId}
                openTerms={() => openTab("terms", "DBMS Dictionary")}
              />
            </Suspense>
          )}
          {active.kind === "terms" && (
            <Suspense fallback={<div role="status">Loading dictionary…</div>}>
              <Glossary
                openLesson={(id) =>
                  openTab("learn", "Learning Center", undefined, id)
                }
              />
            </Suspense>
          )}
          {active.kind === "import" && (
            <ImportExportStudio
              database={database}
              mode={importMode}
              setMode={setImportMode}
              file={file}
              preview={filePreview}
              chooseFile={chooseFile}
              notify={notify}
              onComplete={completeImport}
            />
          )}
          {state.bottomOpen &&
            active.kind !== "home" &&
            active.kind !== "import" &&
            active.kind !== "learn" &&
            active.kind !== "terms" &&
            active.kind !== "query" &&
            active.kind !== "schema" &&
            active.kind !== "table" && (
              <>
                <div
                  className="resize-handle resize-bottom"
                  onPointerDown={(e) => startResize("bottom", e)}
                  role="separator"
                  aria-label="Resize results panel"
                />
                <BottomPanel
                  tab={bottomTab}
                  setTab={setBottomTab}
                  queryText={queryText}
                  notify={notify}
                  activeKind={active.kind}
                />
              </>
            )}
          {!state.bottomOpen &&
            active.kind !== "home" &&
            active.kind !== "import" &&
            active.kind !== "learn" &&
            active.kind !== "terms" &&
            active.kind !== "query" &&
            active.kind !== "schema" &&
            active.kind !== "table" && (
              <div className="open-bottom">
                <IconButton
                  icon={PanelBottomOpen}
                  title="Open results panel"
                  onClick={() => update({ bottomOpen: true })}
                />
                <span>Results panel hidden</span>
              </div>
            )}
        </main>
        {state.rightOpen &&
          active.kind !== "home" &&
          active.kind !== "import" &&
          active.kind !== "learn" &&
          active.kind !== "terms" &&
          active.kind !== "query" &&
          active.kind !== "schema" &&
          active.kind !== "table" && (
            <>
              <div
                className="resize-handle resize-right"
                onPointerDown={(e) => startResize("right", e)}
                role="separator"
                aria-label="Resize properties"
              />
              <Inspector
                tablet={isTablet}
                tab={inspectorTab}
                setTab={setInspectorTab}
                table={selectedTable}
                column={selectedCol}
                database={database}
                activeKind={active.kind}
                close={() => update({ rightOpen: false })}
                browse={() =>
                  openTab("table", selectedTable.name, selectedTable.name)
                }
              />
            </>
          )}
      </div>
      {searchOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setSearchOpen(false)}
        >
          <div
            className="command-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="command-input">
              <Search size={19} />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tables, fields, or commands..."
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                  if (e.key === "Enter" && commands[0]) {
                    commands[0].action();
                    setSearchOpen(false);
                    setSearch("");
                  }
                }}
              />
              <kbd>ESC</kbd>
            </div>
            <div className="command-list">
              {commands.length ? (
                commands.slice(0, 9).map((command, i) => (
                  <button
                    key={`${command.label}-${i}`}
                    onClick={() => {
                      command.action();
                      setSearchOpen(false);
                      setSearch("");
                    }}
                  >
                    <command.icon size={17} />
                    <span>
                      {command.label}
                      <small>{command.detail}</small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                ))
              ) : (
                <div className="command-empty">
                  No matching commands or tables
                </div>
              )}
            </div>
            <div className="command-footer">
              <span>↑ ↓ to navigate</span>
              <span>↵ to open</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Info size={17} />
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function TabIcon({ kind }: { kind: TabKind }) {
  const Icon: { [key in TabKind]: LucideIcon } = {
    home: LayoutDashboard,
    query: Code2,
    schema: Workflow,
    table: Table2,
    learn: BookOpen,
    terms: BookText,
    import: Import,
  };
  const C = Icon[kind];
  return <C size={16} />;
}
function TreeGroup({
  title,
  icon: Icon,
  count,
  open,
  toggle,
}: {
  title: string;
  icon: LucideIcon;
  count?: number;
  open: boolean;
  toggle: () => void;
}) {
  return (
    <button className="tree-row group-row" onClick={toggle}>
      <ChevronRight size={13} className={open ? "rotated" : ""} />
      <Icon size={17} />
      <span>{title}</span>
      {count !== undefined && <span className="tree-count">{count}</span>}
    </button>
  );
}

export function HomeView({
  database,
  openTab,
  notify,
}: {
  database: DbType;
  openTab: (kind: TabKind, title: string, table?: string) => void;
  notify: (s: string) => void;
}) {
  const relationships = database.tables.reduce(
    (n, t) => n + t.columns.filter((c) => c.foreign).length,
    0,
  );
  return (
    <div className="home-view content-scroll">
      <div className="eyebrow">
        <span className="status-dot" /> Browser workspace · Local practice data
      </div>
      <h1>
        Good afternoon, Jane <span>✳</span>
      </h1>
      <p className="lead">
        Your database workspace is ready. Start with a table, a visual schema,
        or a guided lesson.
      </p>
      <div className="home-stats">
        <div>
          <Database size={18} />
          <strong>{database.name}</strong>
          <small>Active database</small>
        </div>
        <div>
          <Table2 size={18} />
          <strong>{database.tables.length}</strong>
          <small>Tables</small>
        </div>
        <div>
          <Workflow size={18} />
          <strong>{relationships}</strong>
          <small>Relationships</small>
        </div>
        <div>
          <Activity size={18} />
          <strong>
            {database.tables.reduce((n, t) => n + t.rows, 0).toLocaleString()}
          </strong>
          <small>Starter rows</small>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Jump back in</h2>
          <p>Everything here runs in your browser.</p>
        </div>
      </div>
      <div className="feature-grid">
        <button onClick={() => openTab("query", "Query 1")}>
          <span className="feature-icon blue">
            <Code2 />
          </span>
          <strong>SQL workspace</strong>
          <small>Run SQL and inspect live local results</small>
          <ChevronRight size={17} />
        </button>
        <button onClick={() => openTab("schema", "Schema Designer")}>
          <span className="feature-icon violet">
            <Workflow />
          </span>
          <strong>Schema designer</strong>
          <small>Explore table structure and relationships</small>
          <ChevronRight size={17} />
        </button>
        <button onClick={() => openTab("learn", "Learning Center")}>
          <span className="feature-icon green">
            <GraduationCap />
          </span>
          <strong>Learning center</strong>
          <small>Build your database intuition</small>
          <ChevronRight size={17} />
        </button>
        <button onClick={() => openTab("import", "Import / Export")}>
          <span className="feature-icon orange">
            <Import />
          </span>
          <strong>Import / Export</strong>
          <small>Preview local files in the browser</small>
          <ChevronRight size={17} />
        </button>
      </div>
      <div className="section-heading">
        <div>
          <h2>Explore {database.name}</h2>
          <p>{database.description}</p>
        </div>
        <Button
          icon={MoreHorizontal}
          onClick={() =>
            notify("More database features arrive in later phases.")
          }
        >
          More
        </Button>
      </div>
      <div className="home-table-list">
        {database.tables.slice(0, 6).map((t) => (
          <button key={t.name} onClick={() => openTab("table", t.name, t.name)}>
            <span className={`table-mini ${t.color}`}>
              <Table2 size={17} />
            </span>
            <span>
              <strong>{t.name}</strong>
              <small>{t.description}</small>
            </span>
            <span className="home-row-count">
              {t.rows.toLocaleString()} rows
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function QueryView({
  database,
  queryText,
  setQueryText,
  runQuery,
  notify,
}: {
  database: DbType;
  queryText: string;
  setQueryText: (v: string) => void;
  runQuery: () => void;
  notify: (s: string) => void;
}) {
  return (
    <div className="query-view center-content">
      <div className="tool-row">
        <div className="tool-group">
          <Button icon={Play} variant="primary" onClick={runQuery}>
            Run query
          </Button>
          <Button
            icon={FileCode2}
            onClick={() => {
              setQueryText(sampleSql);
              notify("Demo SQL restored");
            }}
          >
            Example SQL
          </Button>
          <span className="tool-separator" />
          <span className="source-pill">
            <Database size={15} />
            {database.name}
          </span>
        </div>
        <div className="tool-group">
          <IconButton
            icon={Download}
            title="Download SQL"
            onClick={() => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(
                new Blob([queryText], { type: "text/plain" }),
              );
              a.download = "query.sql";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          />
          <IconButton
            icon={Ellipsis}
            title="More query actions"
            onClick={() => notify("Query editing tools are coming in Phase 3")}
          />
        </div>
      </div>
      <div className="query-main">
        <div className="query-heading">
          <div>
            <span className="blue-mark" /> SQL editor
          </div>
          <span className="demo-label">DEMO QUERY · NOT EXECUTED</span>
        </div>
        <div className="editor-wrap">
          <div className="line-numbers">
            {Array.from(
              { length: Math.max(14, queryText.split("\n").length) },
              (_, i) => (
                <span key={i}>{i + 1}</span>
              ),
            )}
          </div>
          <textarea
            spellCheck={false}
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            aria-label="SQL editor"
          />
        </div>
        <div className="query-editor-footer">
          <span>
            <span className="status-dot" /> Browser workspace
          </span>
          <span>
            SQL · UTF-8{" "}
            <span className="keyboard-hint">Ctrl+Enter to preview action</span>
          </span>
        </div>
      </div>
      <div className="query-notice">
        <Sparkles size={18} />
        <div>
          <strong>Build and explore freely</strong>
          <p>
            The full client-side SQL engine arrives in Phase 3. This phase
            establishes the workspace and editor layout.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SchemaView({
  database,
  focus,
  setFocus,
  notify,
}: {
  database: DbType;
  focus: string | null;
  setFocus: (s: string) => void;
  notify: (s: string) => void;
}) {
  const shown = database.tables.slice(0, Math.min(9, database.tables.length));
  return (
    <div className="schema-view center-content">
      <div className="tool-row">
        <div className="tool-group">
          <Button
            icon={Plus}
            onClick={() => notify("Schema editing arrives in Phase 3")}
          >
            Add Table
          </Button>
          <Button
            icon={Workflow}
            onClick={() => notify("Relationship editing arrives in Phase 3")}
          >
            Add Relationship
          </Button>
          <Button
            icon={Maximize2}
            onClick={() => notify("Demo schema is arranged automatically")}
          >
            Auto Layout
          </Button>
        </div>
        <div className="tool-group">
          <span className="zoom-label">100%</span>
          <IconButton
            icon={Download}
            title="Diagram export arrives in Phase 3"
            disabled
          />
        </div>
      </div>
      <div className="schema-canvas">
        <div className="canvas-label">
          <span className="status-dot" /> {database.name} · Demo schema
        </div>
        <div className="schema-grid">
          {shown.map((table) => (
            <button
              key={table.name}
              className={`schema-card ${table.color} ${focus === table.name ? "focused" : ""}`}
              onClick={() => setFocus(table.name)}
            >
              <div className="schema-card-title">
                <Table2 size={17} />
                <strong>{table.name}</strong>
                <span>{table.rows.toLocaleString()}</span>
              </div>
              <div className="schema-columns">
                {table.columns.slice(0, 7).map((col) => (
                  <div key={col.name}>
                    <span>
                      {col.primary ? (
                        <KeyRound size={13} className="key" />
                      ) : col.foreign ? (
                        <Workflow size={13} className="foreign" />
                      ) : (
                        <span className="field-square" />
                      )}
                    </span>
                    <span>{col.name}</span>
                    <small>{col.type.replace(/\(.+\)/, "")}</small>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="schema-footer">
        <span>
          <Workflow size={15} /> {shown.length} tables ·{" "}
          {shown.reduce(
            (n, t) => n + t.columns.filter((c) => c.foreign).length,
            0,
          )}{" "}
          relationships
        </span>
        <span>Click a table to inspect its columns</span>
      </div>
    </div>
  );
}

export function TableView({
  database,
  tableName,
  search,
  setSearch,
  page,
  setPage,
  selectedColumn,
  setSelectedColumn,
  notify,
}: {
  database: DbType;
  tableName: string;
  search: string;
  setSearch: (s: string) => void;
  page: number;
  setPage: (n: number) => void;
  selectedColumn: string | null;
  setSelectedColumn: (s: string) => void;
  notify: (s: string) => void;
}) {
  const table =
    database.tables.find((t) => t.name === tableName) ?? database.tables[0];
  const rows: Record<string, string>[] =
    table.name === "orders"
      ? sampleRows
      : table.columns.length
        ? Array.from({ length: 6 }, (_, i) =>
            Object.fromEntries(
              table.columns.map((c, j) => [
                c.name,
                c.primary
                  ? String(i + 1)
                  : c.foreign
                    ? String((i % 3) + 1)
                    : c.type.includes("DATE") || c.type.includes("TIME")
                      ? "2024-03-01"
                      : c.type.includes("DECIMAL")
                        ? "$" + (29 + i * 12) + ".00"
                        : c.type.includes("INTEGER")
                          ? String(i + j + 1)
                          : [
                              "Emily",
                              "James",
                              "Sophia",
                              "Daniel",
                              "Olivia",
                              "Alex",
                            ][i],
              ]),
            ),
          )
        : [];
  const visible = rows.filter((row) =>
    Object.values(row).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const cols =
    table.name === "orders"
      ? [
          "order_id",
          "customer_id",
          "order_date",
          "status",
          "total_amount",
          "payment_method",
          "items_count",
        ]
      : table.columns.map((c) => c.name);
  return (
    <div className="table-view center-content">
      <div className="tool-row table-tools">
        <div className="tool-group">
          <span className="source-pill">
            <Table2 size={15} />
            {table.name}
            <ChevronDown size={14} />
          </span>
          <label className="table-search">
            <Search size={16} />
            <input
              placeholder={`Search in ${table.name}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <Button
            icon={Filter}
            onClick={() => notify("Advanced filters arrive in Phase 3")}
          >
            Filter
          </Button>
          <Button
            icon={SlidersHorizontal}
            onClick={() => notify("Sorting controls arrive in Phase 3")}
          >
            Sort
          </Button>
        </div>
        <div className="tool-group">
          <span className="rows-pill">{table.rows.toLocaleString()} rows</span>
          <IconButton
            icon={Maximize2}
            title="Fit table"
            onClick={() => notify("Table fits its panel width")}
          />
        </div>
      </div>
      <div className="table-content">
        <div className="section-heading compact">
          <div>
            <h2>{table.name}</h2>
            <p>{table.description}</p>
          </div>
          <span className="demo-label">DEMO DATA</span>
        </div>
        <div className="data-grid-wrap">
          <table className="data-grid">
            <thead>
              <tr>
                <th className="row-num">
                  <input
                    type="checkbox"
                    aria-label="Select all demo rows"
                    disabled
                  />
                </th>
                {cols.map((c) => (
                  <th
                    key={c}
                    className={selectedColumn === c ? "selected-column" : ""}
                    onClick={() => setSelectedColumn(c)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedColumn(c)}
                  >
                    {c} <ChevronsUpDown size={12} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={i}>
                  <td className="row-num">{(page - 1) * 50 + i + 1}</td>
                  {cols.map((c) => (
                    <td key={c}>
                      {c === "status" ? (
                        <span
                          className={`status-badge ${String(row[c]).toLowerCase()}`}
                        >
                          {row[c]}
                        </span>
                      ) : (
                        row[c]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="empty-grid">No rows match your search.</div>
          )}
        </div>
        <div className="data-footer">
          <span>
            Showing {visible.length} demo rows of {table.rows.toLocaleString()}{" "}
            records
          </span>
          <div>
            <IconButton
              icon={ChevronLeft}
              title="Previous page"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            />
            <span className="page-current">{page}</span>
            <IconButton
              icon={ChevronRight}
              title="Next page"
              onClick={() => {
                setPage(page + 1);
                notify(
                  "Additional demo rows are introduced with the data explorer in Phase 3",
                );
              }}
            />
          </div>
        </div>
        <div className="table-info-bar">
          <Info size={17} />
          <span>
            These are representative sample rows. Live browsing and editing
            arrive in Phase 3.
          </span>
        </div>
      </div>
    </div>
  );
}

export function ImportView({
  database,
  mode,
  setMode,
  file,
  preview,
  chooseFile,
  notify,
}: {
  database: DbType;
  mode: "Import" | "Export";
  setMode: (m: "Import" | "Export") => void;
  file: File | null;
  preview: string;
  chooseFile: (f: File | null) => void;
  notify: (s: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [previewTab, setPreviewTab] = useState("Data Preview");
  return (
    <div className="import-view content-scroll">
      <div className="import-heading">
        <div>
          <h1>Import / Export Studio</h1>
          <p>
            Bring data into your workspace and inspect files locally in your
            browser.
          </p>
        </div>
        <Button
          icon={History}
          onClick={() => notify("Import history arrives in Phase 4")}
        >
          View History
        </Button>
      </div>
      <div className="import-switch">
        <button
          className={mode === "Import" ? "active" : ""}
          onClick={() => setMode("Import")}
        >
          <Upload size={19} />
          <strong>Import</strong>
          <small>Preview files before adding them</small>
        </button>
        <button
          className={mode === "Export" ? "active" : ""}
          onClick={() => setMode("Export")}
        >
          <Download size={19} />
          <strong>Export</strong>
          <small>Download data from your workspace</small>
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
                <strong>
                  {file ? file.name : "Drag and drop a file here"}
                </strong>
                <p>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB · local file`
                    : "or click to browse"}
                </p>
                <small>
                  Preview: .sql, .csv, .tsv, .json · SQLite file selection
                </small>
                <Button
                  icon={FileInput}
                  variant="primary"
                  onClick={() => inputRef.current?.click()}
                >
                  Browse Files
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".sql,.sqlite,.sqlite3,.db,.csv,.tsv,.json,.txt"
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
                  const I = Icon as LucideIcon;
                  return (
                    <div key={label as string}>
                      <I size={21} />
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
              <label>
                Target database
                <select defaultValue={database.name}>
                  <option>{database.name}</option>
                </select>
              </label>
              <div className="form-label">Import mode</div>
              {[
                "Create new database",
                "Replace tables if they exist",
                "Append data",
                "Schema only",
                "Data only",
              ].map((x, i) => (
                <label key={x} className="radio-line">
                  <input
                    type="radio"
                    name="import-mode"
                    defaultChecked={i === 0}
                    disabled={i > 0}
                  />
                  {x}
                  {i > 0 && <span className="future-tag">Phase 4</span>}
                </label>
              ))}
              <div className="config-note">
                <Info size={16} /> Files are read locally for preview. Import
                processing arrives in Phase 4.
              </div>
            </section>
            <section className="surface-card validate-card">
              <h3>
                <span className="step">
                  <Check size={15} />
                </span>{" "}
                Import & Validate
              </h3>
              <label className="checkbox-line">
                <input type="checkbox" defaultChecked /> Validate file before
                import
              </label>
              <label className="checkbox-line">
                <input type="checkbox" disabled /> Show detailed import log
              </label>
              <Button icon={Upload} variant="primary" disabled>
                Start Import
              </Button>
              <h4>
                Import Progress <span>0%</span>
              </h4>
              <div className="progress-track" />
              <p>{file ? "File ready for preview" : "Waiting for file..."}</p>
              <div className="check-list">
                {[
                  "File selected",
                  "Validation completed",
                  "Import in progress",
                  "Completed",
                ].map((x, i) => (
                  <div key={x}>
                    <span className={file && i === 0 ? "done" : ""} />
                    {x}
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="import-bottom">
            <section className="surface-card recent-files">
              <div className="card-head">
                <h3>Recent Files</h3>
                <span className="demo-label">ILLUSTRATIVE</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>File name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["retail_backup.sql", ".sql", "12.4 MB"],
                    ["customers.csv", ".csv", "2.1 MB"],
                    ["products.json", ".json", "540 KB"],
                    ["analytics.db", ".db", "8.7 MB"],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td>
                        <FileCode2 size={15} />
                        {row[0]}
                      </td>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                      <td>
                        <span className="muted">Demo</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="surface-card preview-card">
              <div className="card-head">
                <h3>File Preview</h3>
                <span>{file?.name ?? "No file selected"}</span>
              </div>
              <div className="mini-tabs">
                {["Data Preview", "Schema", "Raw Content"].map((x) => (
                  <button
                    key={x}
                    className={previewTab === x ? "active" : ""}
                    onClick={() => setPreviewTab(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
              <div className="preview-content">
                {!file ? (
                  <div className="preview-empty">
                    <FileInput size={28} />
                    <strong>Select a file to preview it here</strong>
                    <small>Previewing keeps the file on your device.</small>
                  </div>
                ) : previewTab === "Raw Content" ? (
                  <pre>{preview}</pre>
                ) : previewTab === "Schema" ? (
                  <div className="preview-empty">
                    <Columns3 size={27} />
                    <strong>Schema detection arrives in Phase 4</strong>
                    <small>Raw content is available now.</small>
                  </div>
                ) : (
                  <pre>
                    {preview || "No readable text preview for this file."}
                  </pre>
                )}
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="export-placeholder surface-card">
          <Download size={42} />
          <h2>Export from your browser workspace</h2>
          <p>
            Export tools arrive with browser-based database processing in Phase
            4.
          </p>
          <div>
            <Button icon={FileCode2} disabled>
              Export SQL
            </Button>
            <Button icon={FileSpreadsheet} disabled>
              Export CSV
            </Button>
            <Button icon={FileJson2} disabled>
              Export JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function BottomPanel({
  tab,
  setTab,
  queryText,
  notify,
  activeKind,
}: {
  tab: string;
  setTab: (s: string) => void;
  queryText: string;
  notify: (s: string) => void;
  activeKind: TabKind;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section className={`bottom-panel ${collapsed ? "collapsed" : ""}`}>
      <div className="bottom-tabbar">
        <div className="mini-tabs">
          {["Results", "SQL", "Explain", "Messages", "History"].map((x) => (
            <button
              className={tab === x ? "active" : ""}
              key={x}
              onClick={() => setTab(x)}
            >
              {x}
              {x === "Results" && <span>6</span>}
            </button>
          ))}
        </div>
        <div className="tool-group">
          <span className="demo-label">DEMO OUTPUT</span>
          <IconButton
            icon={collapsed ? PanelBottomOpen : PanelBottomClose}
            title={collapsed ? "Expand results" : "Collapse results"}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
      </div>
      {!collapsed && (
        <div className="bottom-body">
          {tab === "Results" ? (
            <div className="results-layout">
              <div className="result-grid">
                <table className="data-grid">
                  <thead>
                    <tr>
                      {[
                        "order_id",
                        "customer_id",
                        "order_date",
                        "status",
                        "total_amount",
                        "payment_method",
                      ].map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row) => (
                      <tr key={row.order_id}>
                        {[
                          "order_id",
                          "customer_id",
                          "order_date",
                          "status",
                          "total_amount",
                          "payment_method",
                        ].map((c) => (
                          <td key={c}>{row[c as keyof typeof row]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sql-preview">
                <div>
                  <strong>Generated SQL</strong>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(queryText);
                      notify("SQL copied to clipboard");
                    }}
                  >
                    <FileCode2 size={14} /> Copy SQL
                  </button>
                </div>
                <pre>{queryText}</pre>
              </div>
            </div>
          ) : tab === "SQL" ? (
            <pre className="full-pre">{queryText}</pre>
          ) : tab === "Explain" ? (
            <div className="bottom-empty">
              <Workflow size={24} />
              <strong>Query plan preview</strong>
              <p>
                Visual query plans arrive with the browser SQL engine in Phase
                3.
              </p>
            </div>
          ) : tab === "Messages" ? (
            <div className="message-list">
              <div>
                <CheckCircle2 size={17} />
                <span>Workspace loaded successfully</span>
                <small>Local browser</small>
              </div>
              <div>
                <Info size={17} />
                <span>
                  Sample results are illustrative and were not produced by
                  running this SQL.
                </span>
              </div>
            </div>
          ) : (
            <div className="message-list">
              <div>
                <Clock3 size={17} />
                <span>Top customers by revenue</span>
                <small>Demo history</small>
              </div>
              <div>
                <Clock3 size={17} />
                <span>Orders last 30 days</span>
                <small>Demo history</small>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="bottom-status">
        <span>
          <span className="status-dot" />{" "}
          {activeKind === "schema" ? "Schema preview" : "Sample output"}
        </span>
        <span>Read-only demo · Phase 1</span>
      </div>
    </section>
  );
}

function Inspector({
  tablet,
  tab,
  setTab,
  table,
  column,
  database,
  activeKind,
  close,
  browse,
}: {
  tablet: boolean;
  tab: string;
  setTab: (s: string) => void;
  table: DbType["tables"][number];
  column: Column;
  database: DbType;
  activeKind: TabKind;
  close: () => void;
  browse: () => void;
}) {
  return (
    <aside className={`inspector ${tablet ? "tablet-inspector" : ""}`}>
      <div className="inspector-tabs">
        <div className="mini-tabs">
          {["Properties", "Schema", "Related", "Quick Actions"].map((x) => (
            <button
              key={x}
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
            >
              {x}
            </button>
          ))}
        </div>
        <IconButton
          icon={PanelRightClose}
          title="Collapse properties (Ctrl+Shift+B)"
          onClick={close}
        />
      </div>
      <div className="inspector-scroll">
        {tab === "Properties" ? (
          <>
            <div className="inspector-section">
              <h3>
                {activeKind === "schema" ? "Table" : "Column"} Properties{" "}
                <ChevronDown size={15} />
              </h3>
              <label>
                Table Name
                <input readOnly value={table.name} />
              </label>
              <label>
                Description
                <textarea readOnly value={table.description} />
              </label>
              <p className="inspector-hint">
                <Info size={14} /> Metadata editing arrives in Phase 3.
              </p>
            </div>
            <div className="inspector-section">
              <h3>
                Selected Field <ChevronDown size={15} />
              </h3>
              <div className="two-fields">
                <label>
                  Field Name
                  <input readOnly value={column.name} />
                </label>
                <label>
                  Data Type
                  <input readOnly value={column.type} />
                </label>
              </div>
              <div className="property-checks">
                <label>
                  <input type="checkbox" checked={!!column.primary} readOnly />{" "}
                  Primary Key
                </label>
                <label>
                  <input type="checkbox" checked={!column.nullable} readOnly />{" "}
                  Not Null
                </label>
                <label>
                  <input type="checkbox" checked={!!column.foreign} readOnly />{" "}
                  Foreign Key
                </label>
                <label>
                  <input type="checkbox" disabled /> Unique
                </label>
              </div>
              <label>
                References
                <input readOnly value={column.foreign ?? "—"} />
              </label>
              <label>
                Field Description
                <textarea
                  readOnly
                  value={
                    column.description ??
                    "No description available for this field."
                  }
                />
              </label>
            </div>
            <div className="inspector-section">
              <h3>
                At a glance <ChevronDown size={15} />
              </h3>
              <div className="stat-grid">
                <div>
                  <small>Rows</small>
                  <strong>{table.rows.toLocaleString()}</strong>
                </div>
                <div>
                  <small>Columns</small>
                  <strong>{table.columns.length}</strong>
                </div>
                <div>
                  <small>Foreign keys</small>
                  <strong>
                    {table.columns.filter((c) => c.foreign).length}
                  </strong>
                </div>
              </div>
            </div>
          </>
        ) : tab === "Schema" ? (
          <div className="inspector-section">
            <h3>Columns ({table.columns.length})</h3>
            <div className="inspector-column-list">
              {table.columns.map((c) => (
                <div key={c.name}>
                  <span>
                    {c.primary ? (
                      <KeyRound size={14} />
                    ) : c.foreign ? (
                      <Workflow size={14} />
                    ) : (
                      <Columns3 size={14} />
                    )}
                  </span>
                  <strong>{c.name}</strong>
                  <small>{c.type}</small>
                </div>
              ))}
            </div>
          </div>
        ) : tab === "Related" ? (
          <div className="inspector-section">
            <h3>Relationships</h3>
            <p className="small-description">
              Foreign keys in {table.name} and nearby tables.
            </p>
            <div className="relationship-list">
              {table.columns
                .filter((c) => c.foreign)
                .map((c) => (
                  <div key={c.name}>
                    <Workflow size={17} />
                    <span>
                      <strong>{c.name}</strong>
                      <small>→ {c.foreign}</small>
                    </span>
                  </div>
                ))}
              {database.tables.flatMap((t) =>
                t.columns
                  .filter((c) => c.foreign?.startsWith(`${table.name}.`))
                  .map((c) => (
                    <div key={`${t.name}.${c.name}`}>
                      <Workflow size={17} />
                      <span>
                        <strong>
                          {t.name}.{c.name}
                        </strong>
                        <small>→ {c.foreign}</small>
                      </span>
                    </div>
                  )),
              )}
              {!database.tables.some((t) =>
                t.columns.some((c) => c.foreign?.startsWith(`${table.name}.`)),
              ) &&
                !table.columns.some((c) => c.foreign) && (
                  <p>No relationships in this demo schema.</p>
                )}
            </div>
          </div>
        ) : (
          <div className="inspector-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <Button icon={Table2} onClick={browse}>
                Browse data
              </Button>
              <Button icon={Filter} disabled>
                Filter
              </Button>
              <Button icon={Workflow} disabled>
                Add relationship
              </Button>
              <Button icon={Download} disabled>
                Export
              </Button>
            </div>
            <p className="inspector-hint">
              <Info size={14} /> More actions are added in later phases.
            </p>
          </div>
        )}
      </div>
      <div className="inspector-footer">
        <Shield size={14} /> Read-only demo metadata
      </div>
    </aside>
  );
}
