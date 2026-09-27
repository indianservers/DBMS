import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";

type Scenario = {
  name: string;
  setup: string;
  stages: [string, string, string];
  result: string;
  insight: string;
};

const scenarioLabs: Record<
  string,
  { title: string; subtitle: string; scenarios: Scenario[] }
> = {
  architecture: {
    title: "Change one schema layer",
    subtitle:
      "Select a change and trace its effect through the abstraction boundaries.",
    scenarios: [
      {
        name: "Add an index",
        setup: "The app reads customer names through a view.",
        stages: [
          "Internal: add an index on customers.customer_id",
          "Conceptual: customers columns stay the same",
          "External: the view and app query still work",
        ],
        result: "Physical data independence",
        insight:
          "The access path changed, not the meaning or shape of the data.",
      },
      {
        name: "Split a table",
        setup: "The app expects a customer_names view.",
        stages: [
          "Conceptual: move names into a profile table",
          "Mapping: redefine the view with a join",
          "External: the app still reads customer_names",
        ],
        result: "Logical data independence",
        insight: "A stable external view can conceal a logical schema change.",
      },
      {
        name: "Insert a row",
        setup: "The customers table is already defined.",
        stages: [
          "Schema: no definition changes",
          "Instance: one more customer row exists",
          "External: queries may now return the new row",
        ],
        result: "Instance change, not schema change",
        insight: "Data contents change far more often than definitions.",
      },
    ],
  },
  eer: {
    title: "Test an EER rule",
    subtitle: "Change the relationship and see which model rule applies.",
    scenarios: [
      {
        name: "Optional customer orders",
        setup: "A customer may place zero or many orders.",
        stages: [
          "Customer participation: partial",
          "Order participation: total",
          "Each order references exactly one customer",
        ],
        result: "1:N with optional customer participation",
        insight: "Cardinality and participation express different constraints.",
      },
      {
        name: "Weak order line",
        setup: "Line number 1 repeats in different orders.",
        stages: [
          "An order line depends on an owner Order",
          "line_number is only a partial key",
          "Combine order_id and line_number",
        ],
        result: "Key: (order_id, line_number)",
        insight: "An owner key completes a weak entity's identifier.",
      },
      {
        name: "Employee subtypes",
        setup: "An employee may be an engineer, manager, or both.",
        stages: [
          "Create Employee supertype",
          "Create Engineer and Manager subtypes",
          "Choose overlapping rather than disjoint",
        ],
        result: "Overlapping specialization",
        insight: "Subtype overlap must be stated explicitly.",
      },
    ],
  },
  mapping: {
    title: "Map a relationship",
    subtitle:
      "Try each cardinality and inspect the resulting relational design.",
    scenarios: [
      {
        name: "Customer 1:N Order",
        setup: "One customer places many orders.",
        stages: [
          "Create Customer(customer_id)",
          "Create Order(order_id)",
          "Add Order.customer_id as a foreign key",
        ],
        result: "Foreign key on the many side",
        insight:
          "One order stores one customer reference; a customer can have many order rows.",
      },
      {
        name: "Order M:N Product",
        setup: "An order has products; a product appears in many orders.",
        stages: [
          "Create Order and Product",
          "Create OrderItem(order_id, product_id)",
          "Store quantity and purchase price on OrderItem",
        ],
        result: "Associative relation",
        insight:
          "A relationship with its own attributes deserves its own relation.",
      },
      {
        name: "Person 1:1 Passport",
        setup: "At most one passport belongs to a person.",
        stages: [
          "Create Person and Passport",
          "Add Passport.person_id foreign key",
          "Constrain Passport.person_id UNIQUE",
        ],
        result: "Foreign key plus UNIQUE",
        insight:
          "A foreign key alone would still allow many passports per person.",
      },
    ],
  },
  decomposition: {
    title: "Test a decomposition",
    subtitle:
      "Compare whether splitting a relation can introduce spurious joins.",
    scenarios: [
      {
        name: "Lossless split",
        setup: "R(A,B,C), A → B. Split into R1(A,B) and R2(A,C).",
        stages: [
          "Intersection R1 ∩ R2 = {A}",
          "A → B, so A determines all of R1",
          "Natural join reconstructs valid R rows",
        ],
        result: "Lossless under the FD",
        insight:
          "The shared attributes must determine one of the two decomposed relations.",
      },
      {
        name: "Unsafe split",
        setup:
          "R(A,B,C) has rows (1,x,p) and (2,x,q). Split into (A,B) and (B,C).",
        stages: [
          "Intersection = {B}",
          "B does not determine A or C",
          "Joining on x creates (1,x,q) and (2,x,p)",
        ],
        result: "Lossy: two spurious rows",
        insight:
          "A shared value alone is not enough to make a decomposition lossless.",
      },
      {
        name: "Independent lists",
        setup: "A course has independent sets of textbooks and instructors.",
        stages: [
          "Every textbook combines with every instructor",
          "Course ↠ Textbook and Course ↠ Instructor",
          "Split into CourseTextbook and CourseInstructor",
        ],
        result: "4NF-style multivalued decomposition",
        insight:
          "Independent many-valued facts should not multiply each other in one relation.",
      },
    ],
  },
  locking: {
    title: "Run a concurrency protocol",
    subtitle: "Select a policy and inspect which operation waits or aborts.",
    scenarios: [
      {
        name: "Strict 2PL",
        setup: "T1 writes account A; T2 wants to read A.",
        stages: [
          "T1 acquires exclusive lock on A",
          "T2 requests shared lock and waits",
          "T1 commits, releases lock; T2 reads",
        ],
        result: "No dirty read",
        insight: "Strict 2PL holds write locks until commit or abort.",
      },
      {
        name: "Deadlock",
        setup: "T1 holds A and requests B; T2 holds B and requests A.",
        stages: [
          "T1 waits for T2 on B",
          "T2 waits for T1 on A",
          "Wait-for graph: T1 → T2 → T1",
        ],
        result: "Cycle: deadlock",
        insight: "A DBMS must detect, prevent, or time out one transaction.",
      },
      {
        name: "MVCC snapshot",
        setup: "T1 reads version A=100 while T2 changes A to 120.",
        stages: [
          "T1 starts on the old snapshot",
          "T2 creates a new version and commits",
          "T1 can continue reading A=100",
        ],
        result: "Consistent snapshot read",
        insight: "The exact guarantees depend on the engine's isolation level.",
      },
    ],
  },
  "sql-semantics": {
    title: "Trace SQL truth values",
    subtitle: "Inspect how SQL's UNKNOWN differs from ordinary Boolean logic.",
    scenarios: [
      {
        name: "NULL comparison",
        setup: "Rows have email = NULL, 'a@x', and 'b@x'.",
        stages: [
          "Evaluate email = NULL for each row",
          "Every comparison is UNKNOWN",
          "WHERE keeps only TRUE",
        ],
        result: "0 rows",
        insight: "Use IS NULL to find missing values.",
      },
      {
        name: "IS NULL",
        setup: "The same three customer rows are checked.",
        stages: [
          "Evaluate email IS NULL",
          "The missing email gives TRUE",
          "WHERE retains that customer",
        ],
        result: "1 row",
        insight: "IS NULL is a predicate designed for missing values.",
      },
      {
        name: "HAVING",
        setup: "Orders are grouped by customer.",
        stages: [
          "WHERE filters input orders",
          "GROUP BY calculates one group per customer",
          "HAVING COUNT(*) > 2 removes small groups",
        ],
        result: "Only groups with at least 3 orders",
        insight: "HAVING acts after grouping, not before it.",
      },
    ],
  },
  recovery: {
    title: "Crash at a log boundary",
    subtitle: "Choose when the crash occurs and decide what recovery must do.",
    scenarios: [
      {
        name: "Before commit",
        setup: "T1 updates A, but no commit record is durable.",
        stages: [
          "Write update log record",
          "Data page may or may not reach storage",
          "Crash before commit",
        ],
        result: "Undo T1 as needed",
        insight:
          "An incomplete transaction's changes must not survive recovery.",
      },
      {
        name: "After commit",
        setup: "T1's commit record is durable; its data page was not flushed.",
        stages: [
          "Persist update log record",
          "Persist commit record",
          "Crash before the data page is written",
        ],
        result: "Redo T1 as needed",
        insight: "The durable log proves the committed change must survive.",
      },
      {
        name: "WAL violation",
        setup: "A dirty data page is flushed before its log record.",
        stages: [
          "Change page in memory",
          "Flush changed page first",
          "Crash before log record persists",
        ],
        result: "Recovery lacks required evidence",
        insight:
          "The write-ahead rule requires the log to be durable before a changed page.",
      },
    ],
  },
  programming: {
    title: "Trace database-side execution",
    subtitle: "See the order of operations and where side effects originate.",
    scenarios: [
      {
        name: "AFTER INSERT trigger",
        setup: "An order is inserted; an audit trigger is defined.",
        stages: [
          "INSERT creates the order row",
          "AFTER trigger sees the inserted row",
          "Trigger writes one audit row",
        ],
        result: "Order and audit changes share a transaction",
        insight:
          "A rollback should undo both changes in engines with transactional triggers.",
      },
      {
        name: "Procedure call",
        setup: "A transfer procedure receives from, to, and amount.",
        stages: [
          "Validate parameters",
          "Debit and credit inside a transaction",
          "Return success or error",
        ],
        result: "Explicitly invoked workflow",
        insight: "Unlike a trigger, a procedure runs when called.",
      },
      {
        name: "Cursor loop",
        setup: "A cursor walks four overdue loans.",
        stages: [
          "OPEN query result",
          "FETCH each row and perform work",
          "CLOSE cursor",
        ],
        result: "Four iterations",
        insight:
          "Compare a row-by-row loop with a set-based UPDATE before choosing it.",
      },
    ],
  },
  "case-studies": {
    title: "Design from a requirement",
    subtitle: "Switch domains and identify where each fact belongs.",
    scenarios: [
      {
        name: "Library",
        setup:
          "A member may borrow a copy many times; each loan has a due date.",
        stages: [
          "Entity: Member, BookCopy",
          "Event: Loan(member_id, copy_id, borrowed_at)",
          "Place due_date on Loan",
        ],
        result: "Loan is a transaction entity",
        insight:
          "The due date belongs to one borrowing event, not the book itself.",
      },
      {
        name: "Banking",
        setup: "A transfer moves money between two accounts.",
        stages: [
          "Entity: Account",
          "Event: Transfer(from_id, to_id, amount)",
          "Update balances atomically",
        ],
        result: "Transfer needs two foreign keys and a transaction",
        insight: "A single account row cannot represent the full movement.",
      },
      {
        name: "Healthcare",
        setup: "A patient may visit a doctor many times.",
        stages: [
          "Entity: Patient, Doctor",
          "Event: Appointment(patient_id, doctor_id, time)",
          "Constrain scheduling conflicts",
        ],
        result: "Appointment resolves repeated visits",
        insight:
          "Time and visit status belong to an appointment, not the patient or doctor.",
      },
    ],
  },
};

export const supportedEngineeringLabs = new Set([
  ...Object.keys(scenarioLabs),
  "algebra",
  "dependencies",
  "schedules",
  "pages",
  "btree",
  "query-costs",
]);

function ScenarioLab({ lab }: { lab: string }) {
  const config = scenarioLabs[lab];
  const [choice, setChoice] = useState(0);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    setChoice(0);
    setStage(0);
  }, [lab]);
  const selected = config.scenarios[choice];
  return (
    <div className="engineering-lab-body">
      <h3>{config.title}</h3>
      <p>{config.subtitle}</p>
      <div
        className="engineering-choices"
        role="group"
        aria-label="Choose a scenario"
      >
        {config.scenarios.map((item, index) => (
          <button
            key={item.name}
            className={choice === index ? "selected" : ""}
            onClick={() => {
              setChoice(index);
              setStage(0);
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="engineering-setup">
        <strong>Starting situation</strong>
        <span>{selected.setup}</span>
      </div>
      <div className="engineering-stage-list">
        {selected.stages.map((item, index) => (
          <button
            key={item}
            className={index <= stage ? "active" : ""}
            onClick={() => setStage(index)}
          >
            <span>{index + 1}</span>
            {item}
          </button>
        ))}
      </div>
      <div className="engineering-lab-actions">
        <button onClick={() => setStage(0)} aria-label="Reset scenario">
          <RotateCcw size={14} /> Reset
        </button>
        <button
          onClick={() => setStage(Math.min(2, stage + 1))}
          disabled={stage === 2}
        >
          Next step <ArrowRight size={14} />
        </button>
      </div>
      {stage === 2 && (
        <div className="engineering-outcome">
          <strong>{selected.result}</strong>
          <span>{selected.insight}</span>
        </div>
      )}
    </div>
  );
}

function AlgebraLab() {
  const [op, setOp] = useState<"select" | "project" | "join">("select");
  const customers = [
    { id: 1, name: "Asha", country: "IN" },
    { id: 2, name: "Ben", country: "UK" },
    { id: 3, name: "Chitra", country: "IN" },
  ];
  const orders = [
    { id: 11, customerId: 1 },
    { id: 12, customerId: 3 },
  ];
  const rows =
    op === "select"
      ? customers
          .filter((c) => c.country === "IN")
          .map((c) => [c.id, c.name, c.country])
      : op === "project"
        ? [...new Set(customers.map((c) => c.country))].map((country) => [
            country,
          ])
        : orders.map((o) => [
            o.id,
            customers.find((c) => c.id === o.customerId)?.name ?? "?",
          ]);
  const headers =
    op === "select"
      ? ["id", "name", "country"]
      : op === "project"
        ? ["country"]
        : ["order_id", "customer"];
  return (
    <div className="engineering-lab-body">
      <h3>Operate on sample relations</h3>
      <p>Choose a relational operator and inspect the resulting relation.</p>
      <div className="engineering-choices">
        {(
          [
            ["select", "σ country='IN'"],
            ["project", "π country"],
            ["join", "Customers ⋈ Orders"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={op === key ? "selected" : ""}
            onClick={() => setOp(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="engineering-mini-grid">
        <div>
          <strong>Customers</strong>
          <span>(1, Asha, IN)</span>
          <span>(2, Ben, UK)</span>
          <span>(3, Chitra, IN)</span>
        </div>
        <div>
          <strong>Orders</strong>
          <span>(11, customer 1)</span>
          <span>(12, customer 3)</span>
        </div>
      </div>
      <div className="engineering-result">
        <strong>Result · {rows.length} tuples</strong>
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((value, j) => (
                  <td key={j}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <small>
        Projection here follows relational set semantics and removes duplicate
        countries.
      </small>
    </div>
  );
}

const dependencies = [
  { left: "A", right: "B" },
  { left: "B", right: "C" },
  { left: "CD", right: "E" },
];
export function attributeClosure(start: string, rules = dependencies) {
  const closure = new Set(start.split(""));
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of rules)
      if ([...rule.left].every((x) => closure.has(x)))
        for (const x of rule.right)
          if (!closure.has(x)) {
            closure.add(x);
            changed = true;
          }
  }
  return [...closure].sort().join("");
}
function DependencyLab() {
  const [attrs, setAttrs] = useState("A");
  const result = useMemo(() => attributeClosure(attrs), [attrs]);
  return (
    <div className="engineering-lab-body">
      <h3>Compute attribute closure</h3>
      <p>
        Choose starting attributes. Apply A → B, B → C, and CD → E until no new
        attribute can be added.
      </p>
      <div className="engineering-choices">
        {"ABCDE".split("").map((a) => (
          <button
            key={a}
            className={attrs.includes(a) ? "selected" : ""}
            onClick={() =>
              setAttrs((old) =>
                old.includes(a)
                  ? old.replace(a, "")
                  : [...old, a].sort().join(""),
              )
            }
          >
            {a}
          </button>
        ))}
      </div>
      <div className="engineering-flow">
        <span>{`Start: {${attrs || "∅"}}`}</span>
        <ArrowRight size={18} />
        <span>Apply FDs repeatedly</span>
        <ArrowRight size={18} />
        <span>{`Closure: {${result || "∅"}}`}</span>
      </div>
      <div className="engineering-outcome">
        <strong>
          {result === "ABCDE"
            ? "Superkey for R(A,B,C,D,E)"
            : "Not a superkey for R(A,B,C,D,E)"}
        </strong>
        <span>
          {result === "ABCDE"
            ? "Check proper subsets to decide whether it is a candidate key."
            : "The closure does not contain every attribute."}
        </span>
      </div>
    </div>
  );
}

type Operation = { tx: "T1" | "T2"; mode: "R" | "W"; item: "A" | "B" };
export function precedenceEdges(operations: Operation[]) {
  const edges = new Set<string>();
  for (let i = 0; i < operations.length; i++)
    for (let j = i + 1; j < operations.length; j++) {
      const a = operations[i],
        b = operations[j];
      if (
        a.tx !== b.tx &&
        a.item === b.item &&
        (a.mode === "W" || b.mode === "W")
      )
        edges.add(`${a.tx}→${b.tx}`);
    }
  return [...edges];
}
function ScheduleLab() {
  const [pattern, setPattern] = useState<"serial" | "interleaved" | "cycle">(
    "serial",
  );
  const schedules: Record<typeof pattern, Operation[]> = {
    serial: [
      { tx: "T1", mode: "R", item: "A" },
      { tx: "T1", mode: "W", item: "A" },
      { tx: "T1", mode: "W", item: "B" },
      { tx: "T2", mode: "R", item: "A" },
      { tx: "T2", mode: "W", item: "B" },
    ],
    interleaved: [
      { tx: "T1", mode: "R", item: "A" },
      { tx: "T2", mode: "R", item: "A" },
      { tx: "T1", mode: "W", item: "A" },
      { tx: "T2", mode: "W", item: "B" },
    ],
    cycle: [
      { tx: "T1", mode: "W", item: "A" },
      { tx: "T2", mode: "R", item: "A" },
      { tx: "T2", mode: "W", item: "B" },
      { tx: "T1", mode: "R", item: "B" },
    ],
  };
  const edges = precedenceEdges(schedules[pattern]);
  const cyclic = edges.includes("T1→T2") && edges.includes("T2→T1");
  return (
    <div className="engineering-lab-body">
      <h3>Build a precedence graph</h3>
      <p>
        Only cross-transaction operations on the same item conflict when at
        least one is a write.
      </p>
      <div className="engineering-choices">
        {(["serial", "interleaved", "cycle"] as const).map((name) => (
          <button
            key={name}
            className={pattern === name ? "selected" : ""}
            onClick={() => setPattern(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="engineering-operation-list">
        {schedules[pattern].map((operation, index) => (
          <span
            key={index}
            className={operation.tx === "T1" ? "first" : "second"}
          >
            {index + 1}. {operation.tx}: {operation.mode}({operation.item})
          </span>
        ))}
      </div>
      <div className="engineering-flow">
        <span>T1</span>
        <span>{edges.join(" · ") || "No conflict edges"}</span>
        <span>T2</span>
      </div>
      <div className="engineering-outcome">
        <strong>
          {cyclic
            ? "Cycle: not conflict serializable"
            : "Acyclic: conflict serializable"}
        </strong>
        <span>
          {cyclic
            ? "Both transactions must precede each other, which no serial order can satisfy."
            : "The precedence constraints admit a serial order."}
        </span>
      </div>
    </div>
  );
}

function PageLab() {
  const [records, setRecords] = useState(100);
  const [perPage, setPerPage] = useState(10);
  const pages = Math.ceil(records / perPage);
  const visible = Math.min(pages, 18);
  return (
    <div className="engineering-lab-body">
      <h3>Count page reads</h3>
      <p>
        A full heap scan examines every page, even when only one row eventually
        matches.
      </p>
      <div className="engineering-sliders">
        <label>
          Records <strong>{records}</strong>
          <input
            type="range"
            min="20"
            max="500"
            step="20"
            value={records}
            onChange={(e) => setRecords(Number(e.target.value))}
          />
        </label>
        <label>
          Records per page <strong>{perPage}</strong>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="engineering-page-grid">
        {Array.from({ length: visible }, (_, i) => (
          <span key={i}>Page {i + 1}</span>
        ))}
        {pages > visible && <span>+{pages - visible} more</span>}
      </div>
      <div className="engineering-outcome">
        <strong>Full scan ≈ {pages} page reads</strong>
        <span>
          ceil({records} records ÷ {perPage} records/page). Cache hits and
          record overhead are omitted in this teaching model.
        </span>
      </div>
    </div>
  );
}

function IndexLab() {
  const [key, setKey] = useState(35);
  const [inserted, setInserted] = useState(false);
  const leaves = inserted
    ? [
        [10, 20],
        [30, 35],
        [40, 50, 60],
        [70, 80, 90],
      ]
    : [
        [10, 20, 30],
        [40, 50, 60],
        [70, 80, 90],
      ];
  const leafIndex = Math.max(
    0,
    leaves.findIndex(
      (_, index) => index === leaves.length - 1 || key < leaves[index + 1][0],
    ),
  );
  const leaf = leaves[leafIndex];
  return (
    <div className="engineering-lab-body">
      <h3>Trace a B+ tree lookup</h3>
      <p>
        Choose a search key, then insert 35 to see a leaf split and a new
        separator.
      </p>
      <div className="engineering-choices">
        {[20, 35, 50, 80].map((n) => (
          <button
            key={n}
            className={key === n ? "selected" : ""}
            onClick={() => setKey(n)}
          >
            Find {n}
          </button>
        ))}
        <button onClick={() => setInserted(!inserted)}>
          {inserted ? "Reset tree" : "Insert 35"}
        </button>
      </div>
      <div className="engineering-tree">
        <div className="engineering-tree-root">
          Root · {inserted ? "30 | 40 | 70" : "40 | 70"}
        </div>
        <div className="engineering-tree-leaves">
          {leaves.map((values, i) => (
            <div key={i} className={leafIndex === i ? "active" : ""}>
              Leaf {i + 1}
              <strong>{values.join(" · ")}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="engineering-outcome">
        <strong>
          {leaf.includes(key) ? `${key} found in leaf` : `${key} not present`}
        </strong>
        <span>
          Lookup follows one root branch and reads one leaf in this simplified
          tree. Linked leaves support ordered range scans.
        </span>
      </div>
    </div>
  );
}

function CostLab() {
  const [left, setLeft] = useState(20);
  const [right, setRight] = useState(80);
  const nested = left + left * right;
  const hash = left + right;
  return (
    <div className="engineering-lab-body">
      <h3>Compare join I/O</h3>
      <p>
        A teaching model: nested loop reads the inner input for each outer page;
        an in-memory hash join scans each side once.
      </p>
      <div className="engineering-sliders">
        <label>
          Outer pages <strong>{left}</strong>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={left}
            onChange={(e) => setLeft(Number(e.target.value))}
          />
        </label>
        <label>
          Inner pages <strong>{right}</strong>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={right}
            onChange={(e) => setRight(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="engineering-cost-bars">
        <div>
          <strong>Simple nested loop · {nested}</strong>
          <span style={{ width: "100%" }} />
        </div>
        <div>
          <strong>In-memory hash join · {hash}</strong>
          <span style={{ width: `${Math.max(4, (100 * hash) / nested)}%` }} />
        </div>
      </div>
      <div className="engineering-outcome">
        <strong>Hash join saves about {nested - hash} page reads here</strong>
        <span>
          Real optimizers also consider memory, index probes, selectivity,
          output size, and caching. A selective indexed nested loop may win.
        </span>
      </div>
    </div>
  );
}

export default function EngineeringLab({ lab }: { lab: string }) {
  const special: Record<string, React.ReactNode> = {
    algebra: <AlgebraLab />,
    dependencies: <DependencyLab />,
    schedules: <ScheduleLab />,
    pages: <PageLab />,
    btree: <IndexLab />,
    "query-costs": <CostLab />,
  };
  return (
    <section className="lesson-card engineering-lab">
      <div className="lesson-card-heading">
        <span className="section-icon blue">
          <Sparkles size={18} />
        </span>
        <div>
          <small>04 / INTERACTIVE ENGINEERING LAB</small>
          <h2>Test the concept</h2>
        </div>
      </div>
      {special[lab] ??
        (scenarioLabs[lab] ? (
          <ScenarioLab lab={lab} />
        ) : (
          <p>Lab unavailable.</p>
        ))}
    </section>
  );
}
