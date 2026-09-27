import type { Lesson, VisualKind } from "./curriculum";

type Question = {
  prompt: string;
  options: [string, string, string, string];
  correct: number;
  explanation: string;
};
type Chapter = {
  id: string;
  title: string;
  category: string;
  level: Lesson["level"];
  minutes: number;
  summary: string;
  objectives: [string, string];
  keyIdea: string;
  visual: VisualKind;
  lab: string;
  sections: [
    { title: string; body: string },
    { title: string; body: string },
    { title: string; body: string },
  ];
  exampleSql: string;
  questions: [Question, Question];
};

const chapter = (item: Chapter): Lesson => ({
  id: item.id,
  title: item.title,
  category: item.category,
  level: item.level,
  minutes: item.minutes,
  summary: item.summary,
  objectives: item.objectives,
  explanation: item.sections[0].body,
  keyIdea: item.keyIdea,
  visual: item.visual,
  exampleSql: item.exampleSql,
  deepDive: { sections: item.sections, lab: item.lab },
  exercises: item.questions.map((q, index) => ({
    id: `${item.id}-${index + 1}`,
    kind: "choice" as const,
    prompt: q.prompt,
    options: q.options,
    correct: q.correct,
    hint: `Focus on ${item.keyIdea.toLowerCase()}`,
    explanation: q.explanation,
  })) as Lesson["exercises"],
});

export const engineeringLessons: Lesson[] = [
  chapter({
    id: "dbms-architecture",
    title: "DBMS architecture and data independence",
    category: "Engineering Core",
    level: "Intermediate",
    minutes: 20,
    summary: "Connect user views, logical schema, and physical storage.",
    objectives: [
      "Identify the three schema levels",
      "Explain logical and physical data independence",
    ],
    keyIdea:
      "A change below an abstraction boundary need not change the level above it.",
    visual: "relational",
    lab: "architecture",
    sections: [
      {
        title: "Three schema levels",
        body: "The external level is what a user or application sees, often through a view. The conceptual level defines the complete logical database: entities, columns, relationships, and constraints. The internal level defines pages, indexes, files, and access paths. Mappings connect these levels.",
      },
      {
        title: "Two kinds of independence",
        body: "Physical data independence means reorganizing files or adding an index without changing the logical schema or application queries. Logical data independence means changing the conceptual schema while preserving an existing external view. The latter is generally harder because applications depend on data shape.",
      },
      {
        title: "Schema versus instance",
        body: "The schema is the database definition; an instance is its contents at a particular moment. An INSERT changes the instance. An ALTER TABLE changes the schema. A DBMS includes query processing, storage management, transaction management, and a catalog of metadata.",
      },
    ],
    exampleSql:
      "CREATE VIEW customer_names AS SELECT customer_id, first_name FROM customers;",
    questions: [
      {
        prompt: "Adding an index without changing a SELECT demonstrates what?",
        options: [
          "Logical data independence",
          "Physical data independence",
          "A new external schema",
          "A new relation",
        ],
        correct: 1,
        explanation:
          "The storage/access path changed but the logical query did not.",
      },
      {
        prompt: "What changes when a row is inserted into an existing table?",
        options: [
          "Schema only",
          "Database instance",
          "Three-schema architecture",
          "Data model",
        ],
        correct: 1,
        explanation:
          "The schema remains the same; the current data instance changes.",
      },
    ],
  }),
  chapter({
    id: "eer-design",
    title: "Enhanced ER design",
    category: "Engineering Core",
    level: "Intermediate",
    minutes: 24,
    summary: "Model weak entities, participation, and inheritance precisely.",
    objectives: [
      "Distinguish weak and strong entities",
      "Read participation and specialization rules",
    ],
    keyIdea:
      "Cardinality says how many; participation says whether a relationship is required.",
    visual: "relational",
    lab: "eer",
    sections: [
      {
        title: "Structural constraints",
        body: "A relationship has a cardinality such as 1:1, 1:N, or M:N. Participation can be total (every entity must participate) or partial (participation is optional). These are separate questions: an order belongs to one customer, while a customer may have zero orders.",
      },
      {
        title: "Weak entities",
        body: "A weak entity cannot be uniquely identified by its own attributes alone. An order line might be identified by (order_id, line_number); order_id comes from its owner, Order. Its identifying relationship and total participation are part of the model.",
      },
      {
        title: "Specialization",
        body: "An ISA hierarchy creates subtypes such as Employee → Engineer and Manager. Decide whether subtypes overlap and whether every supertype row must belong to a subtype. This is more expressive than simply drawing connected tables.",
      },
    ],
    exampleSql:
      "SELECT order_id, product_id, quantity FROM order_items LIMIT 5;",
    questions: [
      {
        prompt:
          "Can a customer with no orders exist under partial participation?",
        options: [
          "Yes",
          "No",
          "Only with a trigger",
          "Only with a composite key",
        ],
        correct: 0,
        explanation:
          "Partial participation allows an entity to exist without a relationship instance.",
      },
      {
        prompt:
          "What identifies an order line with line_number unique only inside an order?",
        options: [
          "line_number alone",
          "order_id alone",
          "(order_id, line_number)",
          "product name",
        ],
        correct: 2,
        explanation:
          "The owner key and partial key form the weak entity identifier.",
      },
    ],
  }),
  chapter({
    id: "er-mapping",
    title: "ER-to-relational mapping",
    category: "Engineering Core",
    level: "Intermediate",
    minutes: 22,
    summary:
      "Turn conceptual relationships into keys, tables, and constraints.",
    objectives: [
      "Map 1:N and M:N relationships",
      "Preserve optionality with constraints",
    ],
    keyIdea:
      "An M:N relationship needs an associative relation; a 1:N relationship usually needs a foreign key on N.",
    visual: "relational",
    lab: "mapping",
    sections: [
      {
        title: "Entities and attributes",
        body: "Map each strong entity to a relation, choose a primary key, and map simple attributes to columns. Multivalued attributes usually need a separate relation. A composite attribute can be expanded into its components.",
      },
      {
        title: "Relationships",
        body: "For 1:N, place the owner key as a foreign key on the N side. For M:N, create a relationship table containing both foreign keys plus relationship attributes, such as quantity. For 1:1, a foreign key plus UNIQUE can enforce the maximum-one rule.",
      },
      {
        title: "Participation and weak entities",
        body: "A NOT NULL foreign key can require participation by the referencing row, but SQL cannot always enforce total participation in the opposite direction without additional logic. A weak entity relation normally includes the owner key in its composite primary key.",
      },
    ],
    exampleSql:
      "SELECT o.order_id, oi.product_id, oi.quantity FROM orders o JOIN order_items oi ON oi.order_id = o.order_id LIMIT 5;",
    questions: [
      {
        prompt:
          "How is a many-to-many Order–Product relationship normally mapped?",
        options: [
          "A comma-separated product list",
          "An order_items relation",
          "A view only",
          "A single foreign key on products",
        ],
        correct: 1,
        explanation:
          "The associative relation stores both foreign keys and relationship-specific facts.",
      },
      {
        prompt: "Which SQL rule limits a 1:1 foreign key to at most one match?",
        options: ["ORDER BY", "UNIQUE", "GROUP BY", "LIMIT"],
        correct: 1,
        explanation:
          "UNIQUE prevents several referencing rows from using the same target key.",
      },
    ],
  }),
  chapter({
    id: "relational-algebra",
    title: "Relational algebra and calculus",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 30,
    summary: "Derive queries from formal operations and predicates.",
    objectives: [
      "Evaluate selection, projection, and join",
      "Contrast algebra with calculus",
    ],
    keyIdea:
      "Algebra describes operations that produce relations; calculus specifies which tuples satisfy a predicate.",
    visual: "query",
    lab: "algebra",
    sections: [
      {
        title: "Core algebra",
        body: "Selection σ filters tuples; projection π keeps attributes (and removes duplicates under set semantics). Union, difference, Cartesian product, rename, and joins combine relations. A query is an expression tree whose intermediate results are relations.",
      },
      {
        title: "Division and universal questions",
        body: "Relational division expresses 'for every' questions: customers who bought every product in a chosen set. It is often translated to SQL with double NOT EXISTS. Distinguish set semantics in theory from SQL's default bag semantics.",
      },
      {
        title: "Relational calculus",
        body: "Tuple relational calculus describes qualifying tuples using variables over rows. Domain relational calculus uses variables over individual attribute values. Both are declarative; safe expressions restrict results to values drawn from the database domain.",
      },
    ],
    exampleSql:
      "SELECT DISTINCT country FROM customers WHERE country <> 'USA';",
    questions: [
      {
        prompt: "Which algebra operator keeps selected columns?",
        options: [
          "Selection σ",
          "Projection π",
          "Difference −",
          "Cartesian product ×",
        ],
        correct: 1,
        explanation: "Projection chooses attributes; selection chooses rows.",
      },
      {
        prompt:
          "Which construct naturally expresses 'customers who bought every required product'?",
        options: [
          "Relational division",
          "Simple projection",
          "ORDER BY",
          "A primary key",
        ],
        correct: 0,
        explanation: "Division models universal-quantification questions.",
      },
    ],
  }),
  chapter({
    id: "functional-dependencies",
    title: "Functional dependencies and keys",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 28,
    summary: "Compute closures, candidate keys, and minimal covers.",
    objectives: ["Compute an attribute closure", "Identify a candidate key"],
    keyIdea: "X → Y means rows agreeing on X must agree on Y.",
    visual: "normalization",
    lab: "dependencies",
    sections: [
      {
        title: "Dependencies are semantic rules",
        body: "An FD X → Y is a rule about all valid instances, not merely a pattern in the current sample. The closure X⁺ contains every attribute implied by X. If X⁺ contains all attributes, X is a superkey; it is a candidate key if no proper subset is also a superkey.",
      },
      {
        title: "Reasoning rules",
        body: "Armstrong's axioms are reflexivity, augmentation, and transitivity. Repeatedly apply matching dependencies to compute closure. For example, with A → B and B → C, start with A and add B, then C, so A⁺ contains A, B, C.",
      },
      {
        title: "Minimal cover",
        body: "A minimal cover splits right-hand sides into single attributes, removes extraneous attributes from left-hand sides, then removes redundant dependencies. It provides a compact equivalent rule set for synthesis and normalization.",
      },
    ],
    exampleSql: "SELECT product_id, category_id, name FROM products LIMIT 5;",
    questions: [
      {
        prompt: "Given A → B and B → C, what must A⁺ contain?",
        options: ["A only", "A and B", "A, B, and C", "C only"],
        correct: 2,
        explanation: "Transitivity lets A determine C through B.",
      },
      {
        prompt: "When is a superkey a candidate key?",
        options: [
          "When it has every attribute",
          "When no proper subset is a superkey",
          "When it is indexed",
          "When it is a foreign key",
        ],
        correct: 1,
        explanation: "Candidate keys are minimal superkeys.",
      },
    ],
  }),
  chapter({
    id: "normalization-proofs",
    title: "Normalization and decomposition proofs",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 30,
    summary: "Test anomalies, lossless joins, and dependency preservation.",
    objectives: [
      "Test lossless binary decomposition",
      "Distinguish 3NF, BCNF, 4NF, and 5NF",
    ],
    keyIdea:
      "A useful decomposition removes anomalies without inventing rows when rejoined.",
    visual: "normalization",
    lab: "decomposition",
    sections: [
      {
        title: "From anomalies to normal forms",
        body: "Insertion, update, and deletion anomalies signal facts stored under the wrong key. 2NF removes partial dependencies on a composite key; 3NF addresses non-key attributes depending transitively on a key. BCNF requires every nontrivial FD determinant to be a superkey.",
      },
      {
        title: "Lossless and dependency preserving",
        body: "For binary decomposition of R into R1 and R2, the common attributes must functionally determine all attributes of R1 or all of R2 for a lossless join under the FDs. A dependency-preserving design can check original rules without joining decomposed relations. BCNF may require sacrificing dependency preservation.",
      },
      {
        title: "Beyond FDs",
        body: "A multivalued dependency X ↠ Y describes independent collections of values for the same X; 4NF removes certain resulting redundancy. 5NF addresses nontrivial join dependencies that cannot be explained by smaller key-based decompositions.",
      },
    ],
    exampleSql:
      "SELECT order_id, product_id, quantity FROM order_items LIMIT 5;",
    questions: [
      {
        prompt: "For R(A,B,C) with A → B, is R1(A,B), R2(A,C) lossless?",
        options: [
          "Yes, A determines R1",
          "No, there is no shared attribute",
          "Only if B → C",
          "Only if C is a key",
        ],
        correct: 0,
        explanation:
          "The intersection is A and A → B, so A determines the R1 attributes.",
      },
      {
        prompt: "What does dependency preservation avoid?",
        options: [
          "Using indexes",
          "Joining relations just to check an original FD",
          "Primary keys",
          "Projection",
        ],
        correct: 1,
        explanation:
          "Preserved dependencies can be enforced on individual decomposed relations.",
      },
    ],
  }),
  chapter({
    id: "transaction-schedules",
    title: "Schedules and serializability",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 27,
    summary: "Prove when interleaved transactions act like a serial order.",
    objectives: ["Build a precedence graph", "Identify recoverable schedules"],
    keyIdea:
      "A conflict-serializable schedule has an acyclic precedence graph.",
    visual: "transaction",
    lab: "schedules",
    sections: [
      {
        title: "Interleaving and conflicts",
        body: "A schedule orders reads, writes, commits, and aborts from multiple transactions. Two operations conflict when they belong to different transactions, touch the same item, and at least one writes. Nonconflicting operations may be swapped without changing the outcome.",
      },
      {
        title: "Precedence graph",
        body: "Create one node per transaction and an edge Ti → Tj when a conflicting Ti operation occurs before Tj's operation. A cycle means the schedule is not conflict serializable. An acyclic graph gives a serial order through topological sorting.",
      },
      {
        title: "Recoverability",
        body: "If T2 reads a value written by T1, T2 must not commit before T1 for the schedule to be recoverable. Cascadeless schedules avoid reading uncommitted values; strict schedules also prevent writing an item another uncommitted transaction wrote.",
      },
    ],
    exampleSql: "SELECT order_id, status FROM orders WHERE order_id = 101;",
    questions: [
      {
        prompt: "What proves a schedule conflict serializable?",
        options: [
          "Any two transactions",
          "An acyclic precedence graph",
          "A cycle in its graph",
          "A SELECT statement",
        ],
        correct: 1,
        explanation:
          "Acyclicity gives a valid serial ordering of transactions.",
      },
      {
        prompt:
          "T2 reads T1's write and commits before T1. Is the schedule recoverable?",
        options: ["Yes", "No", "Only with an index", "Only with a view"],
        correct: 1,
        explanation:
          "If T1 aborts after T2 commits, T2 has committed a result based on an invalid value.",
      },
    ],
  }),
  chapter({
    id: "concurrency-protocols",
    title: "Concurrency-control protocols",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 30,
    summary: "Compare locks, timestamps, validation, and MVCC.",
    objectives: [
      "Trace two-phase locking",
      "Distinguish MVCC and lock-based reads",
    ],
    keyIdea:
      "Protocols constrain interleavings so concurrent work stays correct.",
    visual: "transaction",
    lab: "locking",
    sections: [
      {
        title: "Locks and deadlocks",
        body: "Shared locks permit compatible reads; exclusive locks protect writes. Under two-phase locking (2PL), a transaction first grows its lock set, then releases locks without acquiring new ones. Strict 2PL holds write locks until commit or abort. Circular waiting can cause a deadlock; a wait-for graph exposes the cycle.",
      },
      {
        title: "Timestamp and validation",
        body: "Timestamp ordering compares transaction timestamps with per-item read/write timestamps and may abort an operation that violates the required order. Optimistic validation lets transactions work first, then checks for conflicts before commit. It suits workloads with few collisions.",
      },
      {
        title: "Multiversion concurrency control",
        body: "MVCC keeps versions so readers can see a consistent snapshot while writers create new versions. It changes which anomalies are possible but does not automatically mean full serializability. Isolation-level guarantees and implementation details vary by DBMS.",
      },
    ],
    exampleSql:
      "BEGIN TRANSACTION; SELECT status FROM orders WHERE order_id = 101; COMMIT;",
    questions: [
      {
        prompt: "Under strict 2PL, when is an exclusive lock released?",
        options: [
          "Immediately after the write",
          "At commit or abort",
          "Before it is acquired",
          "Only after a full backup",
        ],
        correct: 1,
        explanation:
          "Holding write locks until completion prevents dirty reads and cascading aborts.",
      },
      {
        prompt: "What does a cycle in a wait-for graph indicate?",
        options: [
          "A deadlock",
          "An index split",
          "A candidate key",
          "A view refresh",
        ],
        correct: 0,
        explanation:
          "Each transaction waits on another in the cycle, so none can proceed without intervention.",
      },
    ],
  }),
  chapter({
    id: "physical-storage",
    title: "Records, pages, and file organization",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 26,
    summary: "See what a database must read from storage to answer a query.",
    objectives: ["Estimate page I/O", "Compare heap and ordered files"],
    keyIdea:
      "Query cost depends heavily on pages read, not just SQL text length.",
    visual: "index",
    lab: "pages",
    sections: [
      {
        title: "Pages and records",
        body: "A DBMS usually transfers fixed-size pages between storage and its buffer pool. A page stores records, free-space information, and often a slot directory. A record identifier locates a row by page and slot. Buffer hits avoid physical reads.",
      },
      {
        title: "File organizations",
        body: "A heap file supports simple insertion but a predicate without an index may scan every page. Ordered files speed range access but can make inserts costly. Hash-organized files target equality lookups. Clustering describes whether neighboring data records follow an access key's order.",
      },
      {
        title: "I/O reasoning",
        body: "With N records and B records per page, a full scan reads roughly ceiling(N/B) pages, ignoring cache effects. A secondary, unclustered index may find keys quickly but still require many separate data-page reads. Cost comparisons depend on selectivity and clustering.",
      },
    ],
    exampleSql: "SELECT order_id FROM orders WHERE customer_id = 3;",
    questions: [
      {
        prompt:
          "100 records fit 10 per page. About how many pages does a full scan read?",
        options: ["1", "10", "100", "1000"],
        correct: 1,
        explanation: "Ceiling(100/10) = 10 data pages, before cache effects.",
      },
      {
        prompt:
          "Which organization is naturally good for fast insertion but may require scans?",
        options: [
          "Heap file",
          "Sorted file only",
          "A view",
          "A transaction log",
        ],
        correct: 0,
        explanation:
          "Heap insertion is simple; finding arbitrary predicates needs a scan or index.",
      },
    ],
  }),
  chapter({
    id: "index-internals",
    title: "B+ trees, hashing, and index access",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 28,
    summary: "Trace index lookups and understand tree splits.",
    objectives: ["Navigate a B+ tree", "Choose ordered versus hash access"],
    keyIdea:
      "B+ tree leaves preserve key order; hashing is strongest for equality lookup.",
    visual: "index",
    lab: "btree",
    sections: [
      {
        title: "B+ tree structure",
        body: "Internal nodes direct a search by separator keys; leaves contain searchable keys and row references (or records in a clustered organization). Leaves are linked for range scans. Insertion into a full node causes a split and may propagate a new separator upward.",
      },
      {
        title: "Index choices",
        body: "A primary or clustered index follows the table's physical or logical ordering; a secondary index gives an additional path. A composite index helps predicates that use its leading key prefix. Covering indexes can answer a query without reading the base row.",
      },
      {
        title: "Hashing and ISAM",
        body: "Hash indexes are efficient for equality but do not naturally support ordered ranges. ISAM has a relatively static index structure and overflow chains; B+ trees rebalance dynamically as data changes. The right structure depends on access patterns and write costs.",
      },
    ],
    exampleSql:
      "SELECT name, price FROM products WHERE price BETWEEN 20 AND 100 ORDER BY price;",
    questions: [
      {
        prompt: "Which access path naturally supports a price range in order?",
        options: [
          "Hash index on price",
          "B+ tree on price",
          "No index can",
          "Transaction log",
        ],
        correct: 1,
        explanation:
          "Ordered B+ tree leaves support finding a start key and scanning the range.",
      },
      {
        prompt: "Where do B+ tree searches end?",
        options: [
          "At a leaf",
          "Always at the root",
          "In the SQL parser",
          "At the log file",
        ],
        correct: 0,
        explanation:
          "Internal nodes route searches to leaves containing keys and references.",
      },
    ],
  }),
  chapter({
    id: "sql-deep-dive",
    title: "SQL semantics and advanced lab",
    category: "Engineering Core",
    level: "Intermediate",
    minutes: 28,
    summary:
      "Reason through NULL, correlated queries, DDL, DML, and constraints.",
    objectives: [
      "Explain UNKNOWN in SQL",
      "Recognize correlated and universal queries",
    ],
    keyIdea: "SQL uses bags and three-valued logic, not pure set logic.",
    visual: "query",
    lab: "sql-semantics",
    sections: [
      {
        title: "Three-valued logic",
        body: "A comparison with NULL usually evaluates to UNKNOWN, not TRUE or FALSE. WHERE retains only TRUE rows. Use IS NULL rather than = NULL. Be especially careful with NOT IN if the subquery may yield NULL; NOT EXISTS is often easier to reason about.",
      },
      {
        title: "Advanced query patterns",
        body: "A correlated subquery refers to a row from its outer query. EXISTS tests whether a qualifying row exists; double NOT EXISTS can express 'for all' conditions. HAVING filters groups after aggregation, unlike WHERE which filters input rows before grouping.",
      },
      {
        title: "Definition and mutation",
        body: "DDL defines and changes schemas (CREATE, ALTER, DROP); DML changes rows (INSERT, UPDATE, DELETE). Constraints reject invalid mutations. SQL dialects differ, so a browser SQLite lab should identify dialect-specific behavior and label non-SQLite examples as conceptual.",
      },
    ],
    exampleSql:
      "SELECT customer_id FROM customers WHERE email IS NULL LIMIT 5;",
    questions: [
      {
        prompt:
          "In a WHERE clause, what happens to rows for which a predicate is UNKNOWN?",
        options: [
          "They are retained",
          "They are filtered out",
          "They are converted to zero",
          "They are duplicated",
        ],
        correct: 1,
        explanation:
          "WHERE keeps TRUE; both FALSE and UNKNOWN are filtered out.",
      },
      {
        prompt: "What is the difference between WHERE and HAVING?",
        options: [
          "None",
          "WHERE filters input rows; HAVING filters groups",
          "HAVING changes storage",
          "WHERE requires an index",
        ],
        correct: 1,
        explanation: "HAVING applies to grouped results after aggregation.",
      },
    ],
  }),
  chapter({
    id: "query-costs",
    title: "Query plans and join algorithms",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 27,
    summary: "Compare logical plans, physical operators, and estimated I/O.",
    objectives: [
      "Compare common join algorithms",
      "Explain cardinality estimation errors",
    ],
    keyIdea:
      "The optimizer chooses physical operators using estimated cost and row counts.",
    visual: "pipeline",
    lab: "query-costs",
    sections: [
      {
        title: "From query to plan",
        body: "Parsing creates a logical query representation. Rewrites such as predicate pushdown can reduce intermediate rows without changing meaning. The optimizer then chooses a physical plan: scans or seeks, join order, join method, and sorting or hashing.",
      },
      {
        title: "Join algorithms",
        body: "Nested-loop joins repeatedly probe an inner input and work well with a selective outer input and an index. Hash joins build a hash table on one input and probe it with the other, favoring equality joins. Sort-merge joins can exploit ordered inputs and support ordered streams.",
      },
      {
        title: "Estimates and actuals",
        body: "Statistics estimate selectivity and cardinality. A large underestimate early in the plan can lead to the wrong join order or algorithm. EXPLAIN shows chosen operators; where available, actual execution measurements expose estimation errors.",
      },
    ],
    exampleSql:
      "SELECT c.first_name, o.order_id FROM customers c JOIN orders o ON o.customer_id = c.customer_id WHERE c.country = 'USA';",
    questions: [
      {
        prompt: "Which join method builds a hash table on one input?",
        options: ["Hash join", "Index seek", "Projection", "External sort"],
        correct: 0,
        explanation:
          "A hash join builds from one input and probes with the other.",
      },
      {
        prompt: "Why can poor cardinality estimates hurt?",
        options: [
          "They change SQL syntax",
          "They lead to costly plan choices",
          "They remove constraints",
          "They disable transactions",
        ],
        correct: 1,
        explanation:
          "An optimizer may pick a bad join order or access path when row estimates are wrong.",
      },
    ],
  }),
  chapter({
    id: "recovery-internals",
    title: "Write-ahead logging and crash recovery",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 25,
    summary: "Replay committed changes and undo incomplete work after a crash.",
    objectives: ["Apply the WAL rule", "Distinguish redo and undo"],
    keyIdea:
      "Write the log before the modified data page so recovery has enough evidence.",
    visual: "transaction",
    lab: "recovery",
    sections: [
      {
        title: "The WAL rule",
        body: "Before a dirty data page reaches persistent storage, the log records describing its changes must be durable. This write-ahead rule lets recovery reason about changes even when some data pages were flushed and others were not.",
      },
      {
        title: "Redo and undo",
        body: "After a crash, recovery redoes needed effects of committed transactions and undoes effects of incomplete transactions. Commit records identify which transactions completed. A checkpoint limits how far back recovery normally needs to inspect the log.",
      },
      {
        title: "Backups versus the log",
        body: "A backup restores a prior snapshot; a transaction log can help replay later committed work where the engine supports it. A replica may copy accidental deletes, so neither replication nor an untested backup is a complete recovery plan.",
      },
    ],
    exampleSql:
      "BEGIN TRANSACTION; UPDATE orders SET status = 'Shipped' WHERE order_id = 101; COMMIT;",
    questions: [
      {
        prompt:
          "What must happen before a dirty data page is flushed under WAL?",
        options: [
          "Delete the log",
          "Persist its relevant log records",
          "Drop all indexes",
          "Commit every transaction",
        ],
        correct: 1,
        explanation:
          "The log must reach durable storage first so recovery can reconstruct the page state.",
      },
      {
        prompt:
          "After a crash, what happens to an incomplete transaction's effects?",
        options: [
          "Always redo",
          "Undo as necessary",
          "Become a new index",
          "Ignore every log record",
        ],
        correct: 1,
        explanation:
          "Recovery undoes effects that must not remain from transactions that did not commit.",
      },
    ],
  }),
  chapter({
    id: "database-programming",
    title: "Triggers, procedures, and cursors lab",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 22,
    summary: "Trace database-side behavior and its hidden side effects.",
    objectives: [
      "Trace trigger timing",
      "Explain cursor iteration and procedure boundaries",
    ],
    keyIdea:
      "Automatic database actions should be explicit in the learner's mental model.",
    visual: "transaction",
    lab: "programming",
    sections: [
      {
        title: "Triggers",
        body: "A trigger fires for a specified event, timing, and target. BEFORE and AFTER timing affects which values and constraints are visible. Row-level triggers may run once per affected row; statement-level behavior depends on the database dialect. Cascades and audit writes are common examples.",
      },
      {
        title: "Procedures and functions",
        body: "A stored procedure groups database-side operations behind a named call and can accept parameters. A function returns a value and may have stricter side-effect rules. Syntax and transaction behavior vary widely across PostgreSQL, MySQL, SQL Server, and SQLite.",
      },
      {
        title: "Cursors",
        body: "A cursor iterates a query result row by row. It can express procedural logic but often performs worse than a set-based SQL update. A good lab compares the two and traces open, fetch, and close states. Browser SQLite can run trigger exercises; procedure and cursor labs should be labeled simulations.",
      },
    ],
    exampleSql:
      "SELECT order_id, status FROM orders ORDER BY order_id LIMIT 5;",
    questions: [
      {
        prompt: "Which object runs automatically on a configured INSERT?",
        options: ["Cursor", "Trigger", "View", "Index"],
        correct: 1,
        explanation:
          "A trigger reacts to a database event without an explicit call.",
      },
      {
        prompt:
          "What is a common reason to prefer set-based UPDATE over a cursor?",
        options: [
          "It avoids every constraint",
          "It often reduces row-by-row overhead",
          "It guarantees no locks",
          "It disables triggers",
        ],
        correct: 1,
        explanation:
          "Set-based operations let the engine optimize work across many rows.",
      },
    ],
  }),
  chapter({
    id: "design-case-studies",
    title: "Requirements-to-schema case studies",
    category: "Engineering Core",
    level: "Advanced",
    minutes: 30,
    summary: "Practice the entire design lifecycle beyond the retail example.",
    objectives: [
      "Derive entities from requirements",
      "Check a design against queries and constraints",
    ],
    keyIdea:
      "A schema is only good when it represents the rules and supports the required work.",
    visual: "relational",
    lab: "case-studies",
    sections: [
      {
        title: "Requirements",
        body: "Start with domain facts, business rules, expected queries, and change scenarios. Identify entities and relationships before choosing table names. Specify cardinality and optionality explicitly; ambiguous words such as 'may' and 'must' are important.",
      },
      {
        title: "Logical design",
        body: "Create an ER model, map it to relations, choose keys and constraints, then test functional dependencies and normalization. Validate sample rows and edge cases, including absent relationships and duplicate-looking names.",
      },
      {
        title: "Physical and operational design",
        body: "Choose indexes only after identifying frequent filters and joins. Test representative queries and transactions. A banking, library, or healthcare example exposes rules that the retail schema does not, such as loan periods, account transfers, or appointment scheduling.",
      },
    ],
    exampleSql:
      "SELECT c.first_name, COUNT(o.order_id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id LIMIT 5;",
    questions: [
      {
        prompt:
          "A book can have many loans over time. Where should due_date live?",
        options: ["Book", "Loan", "Library", "Author"],
        correct: 1,
        explanation:
          "Due date belongs to a particular loan event, not the reusable book record.",
      },
      {
        prompt: "What should precede selecting indexes in a new design?",
        options: [
          "Representative query and access patterns",
          "A random index on every column",
          "Deleting constraints",
          "Choosing a logo",
        ],
        correct: 0,
        explanation:
          "Indexes should support actual predicates, joins, and ordering patterns.",
      },
    ],
  }),
];
