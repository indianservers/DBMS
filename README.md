# DBMS Studio — Phases 1–5

A browser-only visual DBMS learning and exploration app. The workspace follows the four references in `MockupImages/`; the learning center adds guided lessons and hands-on exercises.

## Run locally

Requires Node.js 20 or newer.

```powershell
npm install
npm run dev
```

Open [http://127.0.0.1:13873/](http://127.0.0.1:13873/). The development server only serves frontend files. The app performs no server-side processing.

For a static production build:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 13874
```

The `dist/` directory contains a static site and can be hosted by any static file host. The app itself runs in the browser.

## What works in Phase 1

- Database explorer with four realistic demo databases
- Table previews and metadata inspector
- Schema overview with clickable table cards
- SQL draft editor and downloadable `.sql` file
- Multiple closable tabs, command search, theme switch, menus and notifications
- Resizable desktop panels and tablet drawers
- Local file selection and text preview for SQL, CSV, TSV and JSON
- Layout, tabs, theme, selection and SQL draft saved in this browser's `localStorage`

The Overview now reflects the active local SQLite database. The SQL, table and schema tabs are also backed by that database.

## What works in Phase 2

- 39 structured lessons, including a 15-chapter engineering DBMS track covering architecture, EER, algebra, dependencies, normalization proofs, concurrency, storage, indexing, query costs, and recovery
- 78 exercises spanning beginner, intermediate, and advanced levels
- Every lesson includes five theory sections, a worked reasoning example, a misconception correction, an exam-style self-check with a reasoned answer, and a topic-specific visual trace or interactive lab
- Browser-only interactive engineering labs for relational algebra, attribute closure, serializability graphs, B+ tree search and split, page I/O, query costs, and worked design scenarios
- Interactive step-through concept diagrams, hints, explanations, and solution walkthroughs
- A small, real SQLite practice database running through WebAssembly in a browser Web Worker
- SQL exercises checked by executing the learner's query and comparing its result to a reference result; row order is checked when the exercise asks for sorting
- Learning dashboard with course progress, skill breakdown, streak, recent activity, recommended lesson, weak topics, and badges
- Lesson search, category and difficulty filters, bookmarks, personal notes, and saved completion state

The learning SQL engine is read-only and limited to the seeded practice data. Queries run in a disposable browser worker with a five-second timeout. It does not send queries or data to a backend. MongoDB lessons teach document concepts; a live MongoDB explorer belongs to a later phase.

## What works in Phase 3

- Real local SQLite execution in the SQL Lab: multiple statements, selected-text execution, Ctrl/Cmd+Enter, timing, error reporting, result sorting/filtering/pagination, and CSV/JSON export
- Query history and named saved queries in local storage, plus query-plan inspection and a simple numeric chart
- Visual query builder for source/columns, inferred foreign-key joins, two AND/OR filters, grouping, aggregates, HAVING, sort and limit; generated SQL can be edited before execution
- Live table explorer with search, sort and pagination; double-click editing and confirmed deletion use generated SQL against the local practice copy
- Schema designer with draggable table cards, live columns/foreign keys, relationship lines, zoom, add-table/add-column actions, and DDL download
- Persistent practice databases in browser IndexedDB; each statement runs in a disposable Web Worker with a ten-second timeout. No query or database contents are sent to a server.

RetailDB has seeded practice rows. The other bundled databases currently have real, editable schemas but start with empty tables. SVG export was added in Phase 5; arbitrary relationship creation, undo/redo, minimap and PNG export are not yet implemented.

## What works in Phase 4

- Local `.sqlite`, `.sqlite3` and `.db` imports with an SQLite integrity check; create a new browser workspace or replace the active local database after confirmation
- `.sql` scripts applied to a new or existing local workspace
- CSV/TSV and JSON/JSONL imports with quoted-field parsing, schema/type inference, data preview, and create/append/replace table modes
- MongoDB Extended JSON values such as `$oid` and `$date` accepted in JSON exports; nested documents are retained as JSON text in SQLite columns
- Full SQLite file backups, SQL schema-and-data dumps, and per-table CSV/JSON downloads
- Real import/export history (file names and status only) stored locally; imported database contents remain in browser IndexedDB

All file handling and SQL execution happen in browser Workers. Files are limited to 50 MB. A browser-only app cannot directly connect to a MongoDB server or other native TCP database endpoints; this phase supports their exported files, not a live server connection.

## What works in Phase 5

- Live Overview: table and row counts plus foreign-key totals are read from the active SQLite workspace, including imported databases
- Recent Queries in the explorer come from actual local SQL history; selecting one opens its SQL in a new query tab
- One-click SQLite backup on the Overview, with an explicit reminder that clearing browser storage removes local data
- Schema Designer SVG export uses the current draggable card positions, live fields, and foreign-key links
- Static production build includes a web manifest and versioned service worker that precaches the app shell, workers, and SQLite WebAssembly assets. Once loaded and cached in a service-worker-capable browser, the app can reopen without a network connection. Browser storage can still be evicted by the browser, so export backups for important work.

The development server does not register the service worker; use the production build and a local static host to test offline use. Offline caching does not connect to or sync with any server.

Keyboard shortcuts: `Ctrl/Cmd+K` command palette, `Ctrl/Cmd+B` explorer, `Ctrl/Cmd+Shift+B` properties, `Ctrl/Cmd+Shift+T` new query, `Ctrl/Cmd+W` close tab, and `Ctrl/Cmd+Enter` run SQL.

## Checks

```powershell
npm run typecheck
npm test
npm run build
npm run verify:offline
npm run format:check
```

## Structure

- `src/App.tsx` — interactive shell and screens
- `src/data.ts` — typed demo database metadata and sample output
- `src/styles.css` — visual system and responsive layout
- `src/data.test.ts` — seed metadata integrity checks
- `src/learning/curriculum.ts` — lesson and exercise content
- `src/learning/LearningCenter.tsx` — dashboard, catalog, lessons, notes and progress
- `src/learning/sql.worker.ts` — in-browser SQLite execution
- `src/learning/sql.ts` — worker interface and semantic result comparison
- `src/learning/learning.test.ts` — curriculum and SQL reference checks
- `src/workspace/db.worker.ts` — disposable browser SQLite workspace worker
- `src/workspace/database.ts` — IndexedDB persistence and worker interface
- `src/workspace/Workspace.tsx` — SQL Lab, visual query builder, live table explorer and schema designer
- `src/workspace/diagram.ts` — standalone SVG schema-diagram export
- `src/dashboard/Dashboard.tsx` — live Overview and one-click SQLite backup
- `scripts/generate-sw.mjs` — production-only offline precache generation
- `src/workspace/workspace.test.ts` — SQL and schema-introspection checks
- `src/importExport/ImportExportStudio.tsx` — local import/export UI and progress
- `src/importExport/formats.ts` — CSV, TSV and JSON parsing plus SQL import generation
- `src/importExport/dump.ts` — full SQLite SQL export
- `src/importExport/*.test.ts` — parser/import and export round-trip checks

No credentials are stored. Interface preferences, local SQL drafts, query history, saved queries, import/export history, learning progress, bookmarks, and notes are persisted in `localStorage`; local practice SQLite databases, including imported contents, are stored in IndexedDB.
