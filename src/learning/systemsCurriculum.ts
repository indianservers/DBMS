import type { Lesson } from "./curriculum";

export const systemsLessons: Lesson[] = [
  {
    id: "rdbms-systems",
    title: "Relational DBMS in practice",
    category: "Systems & paradigms",
    level: "Beginner",
    minutes: 22,
    summary:
      "How a relational engine enforces structure, relationships, and reliable updates.",
    objectives: [
      "Explain the layers of an RDBMS",
      "Choose relational storage for a workload",
    ],
    explanation:
      "An RDBMS stores data as relations with typed attributes, declared keys, and constraints. A query processor turns SQL into a plan, while a storage engine manages pages and indexes. Transactions coordinate changes so related rows remain consistent even when operations fail or overlap.",
    keyIdea:
      "The relational model defines the rules; a particular engine decides how to execute and persist them.",
    visual: "relational",
    exampleSql:
      "SELECT c.first_name, COUNT(o.order_id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id, c.first_name;",
    exercises: [
      {
        id: "rdbms-systems-1",
        kind: "choice",
        prompt:
          "Which feature prevents an order from referencing a nonexistent customer when enforced?",
        options: [
          "An ORDER BY clause",
          "A foreign-key constraint",
          "A larger cache",
          "A document ID",
        ],
        correct: 1,
        hint: "Think about a rule between two tables.",
        explanation:
          "An enforced foreign key checks that the referenced customer key exists.",
      },
      {
        id: "rdbms-systems-2",
        kind: "choice",
        prompt: "When are related tables usually a good fit?",
        options: [
          "When every record must have completely unrelated fields",
          "When joins, constraints, and multi-row transactions matter",
          "Only when the database fits in memory",
          "Only when updates never happen",
        ],
        correct: 1,
        hint: "Consider relationships and invariants.",
        explanation:
          "Relational systems are especially useful when relationships and transactional consistency are central.",
      },
    ],
    deepDive: {
      sections: [
        {
          title: "From schema to storage",
          body: "A table declaration describes column domains, nullability, keys, and constraints. The engine stores rows in pages, often with indexes to locate candidate rows. SQL applications use the logical schema, so the engine may reorganize physical storage without changing queries.",
        },
        {
          title: "Planning and execution",
          body: "The parser validates SQL; the optimizer selects access paths and join strategies using estimates; the executor reads and transforms rows. An index is not automatically best: a full scan can be cheaper when a query needs most rows.",
        },
        {
          title: "Transactions and limits",
          body: "Atomicity and isolation protect multi-step updates, while recovery restores durable committed work after failure. These guarantees have costs: locks or version retention, logging, and coordination. A single relational server is not automatically globally distributed or latency-free.",
        },
      ],
    },
    workedExample: {
      question:
        "An order and its payment must be recorded together. What belongs in one transaction?",
      steps: [
        "Create the order and payment as related rows.",
        "Check foreign keys and business constraints before commit.",
        "Commit both changes, or roll back both on failure.",
      ],
      takeaway:
        "The transaction boundary follows the business invariant, not the number of SQL statements.",
    },
    mastery: {
      sections: [
        {
          title: "Logical versus physical independence",
          body: "A logical relationship is expressed with keys; a physical access path is expressed with an index. Keeping these separate lets an optimizer adapt access paths to workload and data distribution.",
        },
        {
          title: "Fit the model to the invariant",
          body: "If a purchase must reference an existing customer and preserve a historical price, normalized customer and order tables plus a price snapshot on each order item can express those rules clearly.",
        },
      ],
      misconception: {
        claim: "Relational means every value must live in one giant table.",
        correction:
          "Relations are typically separated by entity and joined using keys; deliberate denormalization is possible when justified.",
      },
      challenge: {
        question: "Why can adding an index improve reads yet slow inserts?",
        answer:
          "The index provides another access path for reads, but each inserted row also requires an index update and possibly page splits.",
      },
    },
  },
  {
    id: "sql-language-systems",
    title: "SQL as a database language",
    category: "Systems & paradigms",
    level: "Intermediate",
    minutes: 24,
    summary:
      "Understand SQL's declarative model, language families, and evaluation traps.",
    objectives: [
      "Separate SQL intent from execution",
      "Classify common SQL statements",
    ],
    explanation:
      "SQL is a declarative language: a SELECT states the result, not the exact loop that must produce it. DDL defines structures, DML reads and changes data, and transaction-control statements define commit boundaries. A DBMS parses, validates, plans, and executes statements against a particular SQL dialect.",
    keyIdea:
      "Write the requested result and its constraints; inspect the plan when performance matters.",
    visual: "query",
    exampleSql:
      "SELECT country, COUNT(*) AS customers FROM customers WHERE country IS NOT NULL GROUP BY country HAVING COUNT(*) >= 1 ORDER BY customers DESC;",
    exercises: [
      {
        id: "sql-language-systems-1",
        kind: "choice",
        prompt: "What does a SELECT query normally specify?",
        options: [
          "A required physical loop",
          "A desired result relation",
          "A storage page size",
          "A replication protocol",
        ],
        correct: 1,
        hint: "SQL describes what, not exactly how.",
        explanation:
          "The optimizer chooses a physical strategy to produce the declared result.",
      },
      {
        id: "sql-language-systems-2",
        kind: "choice",
        prompt: "Which clause filters groups after aggregation?",
        options: ["WHERE", "HAVING", "FROM", "ORDER BY"],
        correct: 1,
        hint: "WHERE filters input rows.",
        explanation:
          "HAVING filters aggregate groups; WHERE filters rows before grouping.",
      },
    ],
    deepDive: {
      sections: [
        {
          title: "Statement families",
          body: "CREATE and ALTER are data-definition statements. SELECT, INSERT, UPDATE, and DELETE manipulate data. COMMIT and ROLLBACK finish or abandon transaction work. GRANT and REVOKE govern privileges in engines that support them.",
        },
        {
          title: "Logical query evaluation",
          body: "A useful mental model is FROM/JOIN, WHERE, GROUP BY, HAVING, SELECT, then ORDER BY and LIMIT. Engines can physically reorder operations if the result stays equivalent. NULL introduces three-valued logic: compare with IS NULL, not = NULL.",
        },
        {
          title: "Portability and safe execution",
          body: "Core SQL ideas travel across products, but data types, JSON functions, UPSERT syntax, procedural languages, and transaction details vary. Parameterized queries separate user values from SQL syntax and protect against injection; escaping strings by hand is not a substitute.",
        },
      ],
    },
    workedExample: {
      question:
        "Find countries with at least two customers, ranked by customer count.",
      steps: [
        "Read customers and group by country.",
        "Apply HAVING COUNT(*) >= 2 to groups.",
        "Select country and count, then ORDER BY the count.",
      ],
      takeaway:
        "The level at which a condition applies determines WHERE versus HAVING.",
    },
    mastery: {
      sections: [
        {
          title: "Bag semantics",
          body: "SQL result rows may repeat unless DISTINCT is requested. This differs from pure set-based relational algebra and matters for joins and counts.",
        },
        {
          title: "Plans are workload-dependent",
          body: "The same SQL text may use an index for a selective predicate and a scan for a broad one. Statistics, indexes, and data distribution affect the plan.",
        },
      ],
      misconception: {
        claim: "SQL clauses execute physically in the order they appear.",
        correction:
          "The logical model helps reason about results, but the optimizer may use another equivalent physical order.",
      },
      challenge: {
        question: "Why can COUNT(column) differ from COUNT(*)?",
        answer:
          "COUNT(column) ignores NULL values in that column; COUNT(*) counts rows.",
      },
    },
  },
  {
    id: "nosql-families",
    title: "NoSQL families and trade-offs",
    category: "Systems & paradigms",
    level: "Intermediate",
    minutes: 25,
    summary:
      "Compare document, key-value, wide-column, and graph models without the hype.",
    objectives: [
      "Distinguish four NoSQL models",
      "Evaluate consistency and access-pattern trade-offs",
    ],
    explanation:
      "NoSQL is an umbrella term, not one data model or a promise of no SQL. Document stores group related fields into documents; key-value stores retrieve by key; wide-column systems organize sparse or partitioned records; graph systems make relationship traversal central. Their guarantees vary by product and configuration.",
    keyIdea:
      "Pick a model for query shapes, invariants, and scale requirements, not for the NoSQL label.",
    visual: "document",
    exampleSql:
      "SELECT p.name, c.name AS category FROM products p JOIN categories c ON c.category_id = p.category_id;",
    exercises: [
      {
        id: "nosql-families-1",
        kind: "choice",
        prompt: "Which model is centered on traversing edges between entities?",
        options: ["Graph", "Key-value", "Columnar analytics", "Flat file"],
        correct: 0,
        hint: "Think nodes and edges.",
        explanation:
          "Graph databases represent and traverse relationships as edges between nodes.",
      },
      {
        id: "nosql-families-2",
        kind: "choice",
        prompt: "Does 'NoSQL' mean transactions are impossible?",
        options: [
          "Yes, in every product",
          "No; guarantees differ by system and operation",
          "Only if documents are small",
          "Only when SQL is enabled",
        ],
        correct: 1,
        hint: "Avoid applying one guarantee to every product.",
        explanation:
          "Some NoSQL systems support transactions; scope, isolation, and costs differ.",
      },
    ],
    deepDive: {
      sections: [
        {
          title: "Aggregate boundaries",
          body: "A document can keep an order and its line items together when they are normally read and updated together. References are useful for shared entities or large independent collections. Duplicating data speeds certain reads but creates a synchronization obligation.",
        },
        {
          title: "Partition and query design",
          body: "Key-value and wide-column systems often require choosing a partition key early. A good key distributes load and supports frequent queries; a poor key creates hot partitions or expensive fan-out reads.",
        },
        {
          title: "Consistency is a spectrum",
          body: "Read-after-write, causal, eventual, and linearizable behavior are different promises. Replication, conflict handling, and network partitions shape which guarantee a product can offer at a given latency or availability target.",
        },
      ],
    },
    workedExample: {
      question:
        "Should a product catalog with flexible attributes use documents?",
      steps: [
        "List read and update patterns, including filters across products.",
        "Check whether shared categories and prices need strong cross-record rules.",
        "Prototype representative queries and measure indexing, update, and consistency costs.",
      ],
      takeaway:
        "Flexible shape can help, but it does not remove the need for modeling and constraints.",
    },
    mastery: {
      sections: [
        {
          title: "Polyglot persistence",
          body: "An application may keep transactions in a relational store, search indexes in a search engine, and ephemeral sessions in key-value storage. Moving facts between systems requires clear ownership and failure handling.",
        },
        {
          title: "Denormalization cost",
          body: "Embedding a customer name in every order may make a read simple, but a name change then touches many documents or leaves historical snapshots. Decide whether that copy is a snapshot or a synchronized value.",
        },
      ],
      misconception: {
        claim: "NoSQL databases have no schema.",
        correction:
          "They may allow flexible documents, but applications still assume fields, types, indexes, and validation rules: a schema exists even if not centrally declared.",
      },
      challenge: {
        question:
          "Why is a high-cardinality, well-distributed partition key valuable?",
        answer:
          "It spreads requests and data across partitions and reduces hot spots while allowing targeted retrieval.",
      },
    },
  },
  {
    id: "realtime-databases",
    title: "Realtime databases and live data",
    category: "Systems & paradigms",
    level: "Intermediate",
    minutes: 27,
    summary:
      "Subscriptions, change streams, sync, and the consistency behind live interfaces.",
    objectives: [
      "Explain a live query or subscription",
      "Design for reconnects, ordering, and conflicts",
    ],
    explanation:
      "A realtime database or realtime layer delivers changes to clients soon after writes, commonly through subscriptions or change streams. Realtime describes delivery behavior, not a distinct data model: relational, document, and key-value systems can all power live views. Clients still need an initial snapshot, an update stream, and recovery after missed events.",
    keyIdea:
      "A live screen needs a correct snapshot plus ordered change handling, not just a fast push channel.",
    visual: "distributed",
    exampleSql:
      "SELECT order_id, status, order_date FROM orders ORDER BY order_date DESC LIMIT 5;",
    exercises: [
      {
        id: "realtime-databases-1",
        kind: "choice",
        prompt:
          "What should a reconnecting client do if it may have missed changes?",
        options: [
          "Assume nothing changed",
          "Resume from a valid cursor or refresh a snapshot",
          "Delete local data permanently",
          "Disable transactions",
        ],
        correct: 1,
        hint: "Think about a gap in the event stream.",
        explanation:
          "Resuming from a durable cursor or refreshing the snapshot reconciles missed changes.",
      },
      {
        id: "realtime-databases-2",
        kind: "choice",
        prompt: "Does realtime delivery guarantee strong consistency?",
        options: [
          "Always",
          "Only for SQL",
          "No; latency and consistency are separate guarantees",
          "Only with WebSockets",
        ],
        correct: 2,
        hint: "Speed and visibility rules are different.",
        explanation:
          "Fast notifications do not by themselves guarantee that every client sees the same committed state at once.",
      },
    ],
    deepDive: {
      sections: [
        {
          title: "Snapshot plus stream",
          body: "A client first reads a consistent snapshot, then consumes changes after a known position. Without a handoff cursor, writes between the snapshot and subscription can be lost. Subscriptions also need authentication and row-level filtering where appropriate.",
        },
        {
          title: "Change data capture",
          body: "CDC reads committed changes from a log or equivalent source and publishes events to downstream consumers. Delivery may be at least once, so consumers should be idempotent and use stable event IDs. Ordering is often guaranteed only within a partition or entity, not globally.",
        },
        {
          title: "Offline sync and conflicts",
          body: "An offline client can queue local edits and merge when connectivity returns. Last-write-wins is simple but can discard intent; versions, field-specific merge rules, or CRDTs may be better for collaborative data. The correct choice depends on the invariant.",
        },
      ],
    },
    workedExample: {
      question:
        "Build a live order-status dashboard without missing an update during initial load.",
      steps: [
        "Read a snapshot with a matching stream position or establish the stream first.",
        "Apply later changes in order, deduplicating repeated event IDs.",
        "On a gap or expired cursor, refresh the snapshot and resume.",
      ],
      takeaway:
        "Correct reconciliation is more important than the transport protocol.",
    },
    mastery: {
      sections: [
        {
          title: "Latency budgets",
          body: "Time to visible update includes commit, log capture, broker or push delivery, network transit, client processing, and rendering. Measure each stage rather than assuming the database alone determines freshness.",
        },
        {
          title: "Backpressure",
          body: "A slow subscriber can lag behind a fast producer. Bound queues, coalesce replaceable state updates, and define a resync policy when the backlog becomes too old.",
        },
      ],
      misconception: {
        claim: "WebSockets make a database realtime and consistent.",
        correction:
          "WebSockets are a transport. Snapshot correctness, event ordering, authorization, retry, and consistency remain application and database concerns.",
      },
      challenge: {
        question:
          "Why does at-least-once event delivery require idempotent consumers?",
        answer:
          "The same committed change can be delivered more than once after retries; idempotency prevents duplicate side effects.",
      },
    },
  },
];
