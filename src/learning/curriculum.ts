export type Level = "Beginner" | "Intermediate" | "Advanced";
export type ChoiceExercise = {
  id: string;
  kind: "choice";
  prompt: string;
  options: [string, string, string, string];
  correct: number;
  hint: string;
  explanation: string;
};
export type SqlExercise = {
  id: string;
  kind: "sql";
  prompt: string;
  starter: string;
  reference: string;
  hint: string;
  explanation: string;
  ordered?: boolean;
};
export type Exercise = ChoiceExercise | SqlExercise;
export type VisualKind =
  | "relational"
  | "query"
  | "join"
  | "index"
  | "transaction"
  | "normalization"
  | "security"
  | "distributed"
  | "document"
  | "pipeline";
export type Lesson = {
  id: string;
  title: string;
  category: string;
  level: Level;
  minutes: number;
  summary: string;
  objectives: [string, string];
  explanation: string;
  keyIdea: string;
  visual: VisualKind;
  exampleSql: string;
  exercises: [Exercise, Exercise];
  deepDive?: {
    sections: { title: string; body: string }[];
    lab?: string;
  };
  workedExample?: {
    question: string;
    steps: [string, string, string];
    takeaway: string;
  };
  mastery?: {
    sections: [
      { title: string; body: string },
      { title: string; body: string },
    ];
    misconception: { claim: string; correction: string };
    challenge: { question: string; answer: string };
  };
};

import { engineeringLessons } from "./engineeringCurriculum";
import { coreDepth, workedExamples } from "./lessonDepth";
import { lessonMastery } from "./lessonMastery";

const quiz = (
  id: string,
  prompt: string,
  options: [string, string, string, string],
  correct: number,
  hint: string,
  explanation: string,
): ChoiceExercise => ({
  id,
  kind: "choice",
  prompt,
  options,
  correct,
  hint,
  explanation,
});
const sql = (
  id: string,
  prompt: string,
  starter: string,
  reference: string,
  hint: string,
  explanation: string,
  ordered = false,
): SqlExercise => ({
  id,
  kind: "sql",
  prompt,
  starter,
  reference,
  hint,
  explanation,
  ordered,
});

const foundationLessons: Lesson[] = [
  {
    id: "fundamentals",
    title: "Database fundamentals",
    category: "Foundations",
    level: "Beginner",
    minutes: 8,
    summary:
      "Why databases organize facts into reliable, searchable collections.",
    objectives: [
      "Explain what a database stores",
      "Distinguish a database from a table",
    ],
    explanation:
      "A database is an organized collection of related data. A database management system controls how that data is stored, retrieved, and protected. RetailDB contains several related tables, each holding one kind of fact.",
    keyIdea:
      "The database is the whole collection; a table is one structure inside it.",
    visual: "relational",
    exampleSql: "SELECT name, price FROM products LIMIT 4;",
    exercises: [
      quiz(
        "fundamentals-1",
        "Which is the database in this workspace?",
        ["orders", "RetailDB", "order_id", "SELECT"],
        1,
        "Think of the container that holds all the tables.",
        "RetailDB contains the customers, orders, products, and other tables.",
      ),
      quiz(
        "fundamentals-2",
        "Why use a DBMS instead of keeping every fact in one text file?",
        [
          "It guarantees every query is fast",
          "It structures, retrieves, and protects related data",
          "It removes the need for backups",
          "It makes relationships impossible",
        ],
        1,
        "Consider access, organization, and consistency.",
        "A DBMS provides structured storage, querying, constraints, and controlled access.",
      ),
    ],
  },
  {
    id: "relational-model",
    title: "The relational model",
    category: "Foundations",
    level: "Beginner",
    minutes: 9,
    summary:
      "Represent entities as relations and connect them through shared keys.",
    objectives: [
      "Identify rows and columns in a relation",
      "Explain how relations connect",
    ],
    explanation:
      "A relation is represented as a table whose rows are tuples and whose columns are attributes. Each row describes one occurrence of an entity. Related tables connect through key values rather than by copying every detail into every row.",
    keyIdea:
      "Rows represent individual facts; columns define the facts each row can hold.",
    visual: "relational",
    exampleSql: "SELECT customer_id, first_name, country FROM customers;",
    exercises: [
      quiz(
        "relational-model-1",
        "In customers, what does one row represent?",
        [
          "A column definition",
          "One customer",
          "The whole database",
          "A SQL statement",
        ],
        1,
        "A row is one instance of the entity.",
        "A row in customers represents one customer.",
      ),
      quiz(
        "relational-model-2",
        "How does orders connect to customers?",
        [
          "By matching order_id to price",
          "By matching customer_id values",
          "By sorting both tables",
          "By storing all customer columns in orders",
        ],
        1,
        "Look for the shared key.",
        "orders.customer_id refers to customers.customer_id.",
      ),
    ],
  },
  {
    id: "keys-constraints",
    title: "Keys and constraints",
    category: "Foundations",
    level: "Beginner",
    minutes: 11,
    summary: "Keep records identifiable and relationships valid.",
    objectives: [
      "Tell primary and foreign keys apart",
      "Choose a constraint for required data",
    ],
    explanation:
      "A primary key uniquely identifies a row. A foreign key points to a key in another table and protects a relationship. NOT NULL requires a value; UNIQUE prevents duplicates in a column or group of columns.",
    keyIdea:
      "Constraints turn data rules into checks enforced by the database.",
    visual: "relational",
    exampleSql: "SELECT order_id, customer_id FROM orders;",
    exercises: [
      quiz(
        "keys-constraints-1",
        "Which column uniquely identifies an order?",
        ["customer_id", "status", "order_id", "order_date"],
        2,
        "The answer is the primary key of orders.",
        "order_id is the primary key for orders.",
      ),
      quiz(
        "keys-constraints-2",
        "What prevents an order from referencing a customer that does not exist?",
        [
          "A foreign key on orders.customer_id",
          "ORDER BY",
          "A view",
          "A B-tree alone",
        ],
        0,
        "Choose the rule that validates a reference.",
        "A foreign key verifies that the referenced customer key exists.",
      ),
    ],
  },
  {
    id: "er-modeling",
    title: "Entity-relationship modeling",
    category: "Design",
    level: "Beginner",
    minutes: 12,
    summary:
      "Sketch entities, attributes, and cardinality before building tables.",
    objectives: [
      "Read one-to-many cardinality",
      "Locate the foreign key for a relationship",
    ],
    explanation:
      "An ER diagram makes entities and relationships visible. If one customer can place many orders, the customer-to-order relationship is one-to-many. The foreign key belongs on the many side: orders.customer_id.",
    keyIdea:
      "Put the foreign key on the many side of a one-to-many relationship.",
    visual: "relational",
    exampleSql:
      "SELECT c.first_name, o.order_id FROM customers c JOIN orders o ON o.customer_id = c.customer_id;",
    exercises: [
      quiz(
        "er-modeling-1",
        "One customer may place many orders. What is the cardinality?",
        ["One-to-one", "One-to-many", "Many-to-many only", "No relationship"],
        1,
        "Count the possible orders for one customer.",
        "One customer can correspond to multiple order rows.",
      ),
      quiz(
        "er-modeling-2",
        "Where should customer_id be stored for that relationship?",
        [
          "Only in products",
          "In orders as a foreign key",
          "In a new database",
          "In every product row",
        ],
        1,
        "The foreign key belongs on the many side.",
        "Each order records which customer placed it.",
      ),
    ],
  },
  {
    id: "sql-basics",
    title: "SQL basics",
    category: "SQL",
    level: "Beginner",
    minutes: 13,
    summary: "Retrieve exactly the columns and rows you need.",
    objectives: ["Write a SELECT statement", "Choose columns from a table"],
    explanation:
      "SELECT names the columns to return; FROM names the source table. A semicolon ends the statement. Start with specific columns so the result communicates your intent clearly.",
    keyIdea: "SELECT columns FROM table is the basic retrieval pattern.",
    visual: "query",
    exampleSql: "SELECT name, price FROM products;",
    exercises: [
      sql(
        "sql-basics-1",
        "Return the name and price of every product.",
        "SELECT name, price\nFROM products;",
        "SELECT name, price FROM products;",
        "The source table is products.",
        "SELECT name, price FROM products returns one row per product.",
      ),
      sql(
        "sql-basics-2",
        "Return each customer’s first_name and country.",
        "SELECT first_name, country\nFROM customers;",
        "SELECT first_name, country FROM customers;",
        "Choose two columns from customers.",
        "Selecting only the requested columns keeps the result focused.",
      ),
    ],
  },
  {
    id: "filter-sort",
    title: "Filtering and sorting",
    category: "SQL",
    level: "Beginner",
    minutes: 14,
    summary: "Use WHERE and ORDER BY to shape a result.",
    objectives: ["Filter rows with a predicate", "Sort results predictably"],
    explanation:
      "WHERE keeps rows that satisfy a condition. ORDER BY arranges the remaining rows; DESC puts larger values first. SQL applies filtering before it sorts the result.",
    keyIdea:
      "WHERE decides which rows survive; ORDER BY decides their displayed order.",
    visual: "query",
    exampleSql:
      "SELECT name, price FROM products WHERE price >= 50 ORDER BY price DESC;",
    exercises: [
      sql(
        "filter-sort-1",
        "Return names and prices of products costing at least 50.",
        "SELECT name, price FROM products WHERE price >= 50;",
        "SELECT name, price FROM products WHERE price >= 50;",
        "Use WHERE price >= 50.",
        "WHERE removes products below the threshold.",
      ),
      sql(
        "filter-sort-2",
        "Return product names and prices from highest price to lowest.",
        "SELECT name, price FROM products ORDER BY price DESC;",
        "SELECT name, price FROM products ORDER BY price DESC;",
        "Use ORDER BY price DESC.",
        "DESC sorts the highest price first.",
        true,
      ),
    ],
  },
  {
    id: "joins",
    title: "Joining tables",
    category: "SQL",
    level: "Intermediate",
    minutes: 17,
    summary: "Combine related rows and understand missing matches.",
    objectives: ["Write an inner join", "Explain when to use a left join"],
    explanation:
      "A join combines rows when its ON condition matches keys. INNER JOIN keeps matched pairs only. LEFT JOIN keeps every row from the left table, filling unmatched right-side values with NULL.",
    keyIdea:
      "Join on matching keys, and choose the join type based on unmatched rows.",
    visual: "join",
    exampleSql:
      "SELECT c.first_name, o.order_id FROM customers c JOIN orders o ON o.customer_id = c.customer_id;",
    exercises: [
      sql(
        "joins-1",
        "Return each order_id with the matching customer first_name.",
        "SELECT o.order_id, c.first_name\nFROM orders o JOIN customers c ON o.customer_id = c.customer_id;",
        "SELECT o.order_id, c.first_name FROM orders o JOIN customers c ON o.customer_id = c.customer_id;",
        "Join orders.customer_id to customers.customer_id.",
        "The join condition connects each order to its owner.",
      ),
      sql(
        "joins-2",
        "Return every customer first_name with any matching order_id, including customers with no orders.",
        "SELECT c.first_name, o.order_id\nFROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id;",
        "SELECT c.first_name, o.order_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id;",
        "Start with customers and use LEFT JOIN.",
        "LEFT JOIN preserves customers even when order_id is NULL.",
      ),
    ],
  },
  {
    id: "grouping",
    title: "Grouping and aggregation",
    category: "SQL",
    level: "Intermediate",
    minutes: 17,
    summary: "Summarize many rows with COUNT, SUM, and GROUP BY.",
    objectives: ["Aggregate a whole table", "Group rows by a category"],
    explanation:
      "Aggregate functions collapse many values into summaries. GROUP BY creates one group for each distinct grouping value. Every selected non-aggregated column must identify a group.",
    keyIdea:
      "COUNT, SUM, and AVG summarize rows; GROUP BY changes the unit of the result.",
    visual: "query",
    exampleSql:
      "SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status;",
    exercises: [
      sql(
        "grouping-1",
        "Return the total number of orders as order_count.",
        "SELECT COUNT(*) AS order_count FROM orders;",
        "SELECT COUNT(*) AS order_count FROM orders;",
        "COUNT(*) counts rows.",
        "COUNT(*) returns one count across the orders table.",
      ),
      sql(
        "grouping-2",
        "Return each order status with its number of orders.",
        "SELECT status, COUNT(*) AS order_count\nFROM orders GROUP BY status;",
        "SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status;",
        "Group by status before counting.",
        "GROUP BY status produces one count for each distinct status.",
      ),
    ],
  },
  {
    id: "subqueries-ctes",
    title: "Subqueries and CTEs",
    category: "SQL",
    level: "Intermediate",
    minutes: 17,
    summary: "Build a query out of smaller queries.",
    objectives: [
      "Use a scalar subquery",
      "Use a CTE to name an intermediate result",
    ],
    explanation:
      "A subquery supplies a value or result to another query. A common table expression (CTE) gives a temporary result a readable name with WITH. Both can make a multi-step question easier to express.",
    keyIdea: "Break a complex question into smaller relational steps.",
    visual: "query",
    exampleSql:
      "WITH expensive AS (SELECT name, price FROM products WHERE price > 50) SELECT name FROM expensive;",
    exercises: [
      sql(
        "subqueries-ctes-1",
        "Return names of products priced above the overall average price.",
        "SELECT name FROM products WHERE price > (SELECT AVG(price) FROM products);",
        "SELECT name FROM products WHERE price > (SELECT AVG(price) FROM products);",
        "A subquery can calculate AVG(price).",
        "The inner query finds the average; the outer query compares each price to it.",
      ),
      sql(
        "subqueries-ctes-2",
        "Return customer IDs that appear in orders, without duplicates.",
        "WITH buyers AS (SELECT DISTINCT customer_id FROM orders) SELECT customer_id FROM buyers;",
        "SELECT DISTINCT customer_id FROM orders;",
        "DISTINCT removes repeated customer IDs. A CTE is optional.",
        "The result has one row per customer with at least one order.",
      ),
    ],
  },
  {
    id: "set-operations",
    title: "Set operations",
    category: "SQL",
    level: "Intermediate",
    minutes: 14,
    summary:
      "Combine compatible query results with UNION and related operators.",
    objectives: ["Use UNION to remove duplicates", "Distinguish UNION ALL"],
    explanation:
      "Set operations combine results with the same number of compatible columns. UNION removes duplicate rows; UNION ALL retains them. INTERSECT keeps rows common to both sets; EXCEPT keeps rows from the first set that are absent from the second.",
    keyIdea: "Set operations work on result sets, not on table relationships.",
    visual: "query",
    exampleSql:
      "SELECT customer_id FROM orders UNION SELECT customer_id FROM customers;",
    exercises: [
      sql(
        "set-operations-1",
        "Return unique customer IDs appearing in either orders or customers.",
        "SELECT customer_id FROM orders UNION SELECT customer_id FROM customers;",
        "SELECT customer_id FROM orders UNION SELECT customer_id FROM customers;",
        "UNION merges two one-column results and removes duplicates.",
        "UNION returns each customer ID once.",
      ),
      quiz(
        "set-operations-2",
        "Which operator keeps duplicate rows from both inputs?",
        ["UNION", "UNION ALL", "INTERSECT", "EXCEPT"],
        1,
        "Look for the ALL modifier.",
        "UNION ALL preserves duplicates rather than deduplicating.",
      ),
    ],
  },
  {
    id: "views",
    title: "Views",
    category: "Design",
    level: "Intermediate",
    minutes: 11,
    summary: "Save a query as a reusable virtual table.",
    objectives: [
      "Explain what a standard view stores",
      "Choose when a view helps",
    ],
    explanation:
      "A standard view stores a query definition, not a separate copy of its result. Querying the view reruns its defining query against current underlying data. Views can make common queries simpler and expose a controlled set of columns.",
    keyIdea:
      "A standard view is a named query interface over underlying tables.",
    visual: "query",
    exampleSql:
      "CREATE VIEW active_orders AS SELECT order_id, customer_id FROM orders WHERE status <> 'Cancelled';",
    exercises: [
      quiz(
        "views-1",
        "What does a standard SQL view primarily store?",
        [
          "A frozen copy of every result row",
          "A named query definition",
          "A B-tree page",
          "A transaction log",
        ],
        1,
        "Think of a view as a named SELECT.",
        "A standard view stores the query definition and reads current underlying data.",
      ),
      quiz(
        "views-2",
        "Why might a team create a view for order summaries?",
        [
          "To simplify repeated queries",
          "To remove all need for indexes",
          "To make joins invalid",
          "To guarantee physical duplication",
        ],
        0,
        "Think about reuse and a stable interface.",
        "A view lets many queries reuse the same summarizing logic.",
      ),
    ],
  },
  {
    id: "indexes",
    title: "Indexes",
    category: "Performance",
    level: "Intermediate",
    minutes: 15,
    summary: "Trade extra storage and write work for faster lookups.",
    objectives: ["Describe an index lookup", "Recognize an index tradeoff"],
    explanation:
      "An index is a separate access structure that helps locate rows without scanning every row. B-tree indexes support ordered lookup and ranges. They consume space and must be maintained when indexed values change.",
    keyIdea:
      "Indexes speed selected reads while adding storage and write maintenance.",
    visual: "index",
    exampleSql: "SELECT order_id FROM orders WHERE customer_id = 3;",
    exercises: [
      quiz(
        "indexes-1",
        "Which lookup is a useful candidate for an index on orders.customer_id?",
        [
          "Find orders for one customer",
          "SELECT every column from every table",
          "Drop the database",
          "Change the application theme",
        ],
        0,
        "Look for a predicate on customer_id.",
        "An index can help the database find matching customer_id values.",
      ),
      quiz(
        "indexes-2",
        "What is a real index tradeoff?",
        [
          "Indexes make every write free",
          "Indexes require storage and maintenance",
          "Indexes eliminate SQL",
          "Indexes always reduce disk usage",
        ],
        1,
        "The index itself needs to be kept up to date.",
        "Inserts and updates may also update index entries.",
      ),
    ],
  },
  {
    id: "transactions-acid",
    title: "Transactions and ACID",
    category: "Reliability",
    level: "Intermediate",
    minutes: 16,
    summary: "Treat several operations as one reliable unit of work.",
    objectives: ["Explain atomicity", "Recognize a safe transfer workflow"],
    explanation:
      "A transaction groups operations so they commit together or roll back together. Atomicity means an all-or-nothing outcome. Consistency preserves constraints; isolation limits interference; durability keeps committed changes after failure.",
    keyIdea:
      "A transfer should never leave a debit without its matching credit.",
    visual: "transaction",
    exampleSql:
      "BEGIN TRANSACTION;\nUPDATE accounts SET balance = balance - 100 WHERE account_id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE account_id = 2;\nCOMMIT;",
    exercises: [
      quiz(
        "transactions-acid-1",
        "If the second step of a transfer fails, what should atomicity do?",
        [
          "Keep only the debit",
          "Roll back the entire transfer",
          "Repeat the debit forever",
          "Ignore the error",
        ],
        1,
        "All steps should succeed or none should remain.",
        "Atomicity rolls back both steps when the transaction fails.",
      ),
      quiz(
        "transactions-acid-2",
        "Which ACID property keeps committed data after a crash?",
        ["Atomicity", "Consistency", "Isolation", "Durability"],
        3,
        "Think about persistence after commit.",
        "Durability means a committed change survives failure.",
      ),
    ],
  },
  {
    id: "normalization",
    title: "Normalization: 1NF to BCNF",
    category: "Design",
    level: "Advanced",
    minutes: 19,
    summary: "Reduce repeated facts and update anomalies.",
    objectives: [
      "Identify a repeating group",
      "Explain a functional dependency",
    ],
    explanation:
      "Normalization organizes facts so each fact has an appropriate home. 1NF removes repeating groups and requires atomic values. 2NF removes dependencies on only part of a composite key; 3NF removes transitive dependencies; BCNF requires every determinant to be a candidate key.",
    keyIdea:
      "Separate facts that depend on different keys to avoid update anomalies.",
    visual: "normalization",
    exampleSql: "SELECT order_id, product_id, quantity FROM order_items;",
    exercises: [
      quiz(
        "normalization-1",
        "A single orders cell contains “pen, notebook, bag”. What is the 1NF problem?",
        [
          "A repeating multi-value group",
          "A missing index",
          "A foreign key",
          "A transaction",
        ],
        0,
        "One cell should hold one value for that attribute.",
        "A multi-value list in one cell violates the atomic-value goal of 1NF.",
      ),
      quiz(
        "normalization-2",
        "In a table keyed by (order_id, product_id), product_name depends only on product_id. Which issue is this?",
        ["Partial dependency", "Durability", "Cross join", "Projection"],
        0,
        "The attribute depends on only part of a composite key.",
        "This partial dependency is the kind 2NF aims to remove.",
      ),
    ],
  },
  {
    id: "procedures-triggers",
    title: "Procedures and triggers",
    category: "Design",
    level: "Advanced",
    minutes: 13,
    summary: "Understand reusable database logic and automatic reactions.",
    objectives: [
      "Distinguish a procedure from a trigger",
      "Identify trigger risks",
    ],
    explanation:
      "A stored procedure is invoked to perform a defined operation. A trigger runs automatically when a specified table event occurs. Trigger behavior can enforce rules or create audit records, but hidden side effects make systems harder to reason about.",
    keyIdea:
      "Procedures are called explicitly; triggers fire because an event happened.",
    visual: "transaction",
    exampleSql:
      "-- Concept example: after an INSERT into orders, an audit trigger may record the change.\nSELECT order_id, status FROM orders;",
    exercises: [
      quiz(
        "procedures-triggers-1",
        "Which object runs automatically after a matching INSERT event?",
        ["View", "Trigger", "Index", "CTE"],
        1,
        "It reacts to a table event.",
        "A trigger fires automatically for its configured event.",
      ),
      quiz(
        "procedures-triggers-2",
        "What is a common risk of many triggers?",
        [
          "They make every query read-only",
          "Hidden side effects become hard to trace",
          "They remove all constraints",
          "They prohibit transactions",
        ],
        1,
        "Think about work that happens without a direct application call.",
        "Triggers can obscure where changes originate and complicate debugging.",
      ),
    ],
  },
  {
    id: "query-plans",
    title: "Query execution and optimization",
    category: "Performance",
    level: "Advanced",
    minutes: 18,
    summary: "Read a plan as a sequence of scans, joins, and filters.",
    objectives: ["Interpret a table scan", "Explain why row estimates matter"],
    explanation:
      "The optimizer compares possible execution plans using table statistics and cost estimates. A plan shows physical steps such as scans, index searches, filters, and joins. Different SQL statements can produce the same result but have different costs.",
    keyIdea:
      "The plan shows how the DBMS gets a result, not merely what SQL asks for.",
    visual: "pipeline",
    exampleSql: "SELECT name, price FROM products WHERE price > 50;",
    exercises: [
      quiz(
        "query-plans-1",
        "What does a full table scan inspect?",
        [
          "Only index metadata",
          "Every row or page in the chosen table",
          "Only one matching key",
          "The browser cache",
        ],
        1,
        "A scan walks through the table.",
        "A full scan reads through the table to test rows.",
      ),
      quiz(
        "query-plans-2",
        "Why can stale statistics hurt a query plan?",
        [
          "The optimizer may misestimate row counts",
          "SELECT stops working",
          "Keys become text",
          "ACID is disabled",
        ],
        0,
        "Plans are chosen from cost estimates.",
        "Bad row estimates can lead the optimizer to choose an expensive strategy.",
      ),
    ],
  },
  {
    id: "concurrency",
    title: "Concurrency and isolation",
    category: "Reliability",
    level: "Advanced",
    minutes: 18,
    summary: "Understand what concurrent transactions may observe.",
    objectives: [
      "Identify a dirty read",
      "Describe why isolation levels differ",
    ],
    explanation:
      "Concurrent transactions can read and write overlapping data. A dirty read observes another transaction’s uncommitted change. Stronger isolation blocks more anomalies but can add waiting or reduce concurrency.",
    keyIdea:
      "Isolation controls which intermediate states another transaction can see.",
    visual: "transaction",
    exampleSql:
      "-- Two sessions may read the same row while another transaction updates it.\nSELECT status FROM orders WHERE order_id = 101;",
    exercises: [
      quiz(
        "concurrency-1",
        "Session A reads a value written by B before B commits. What happened?",
        ["Dirty read", "Normalization", "Index seek", "Sharding"],
        0,
        "The read saw an uncommitted value.",
        "Reading another transaction’s uncommitted write is a dirty read.",
      ),
      quiz(
        "concurrency-2",
        "Why not always use the strongest isolation for every workload?",
        [
          "It may increase contention and waiting",
          "It deletes indexes",
          "It disables constraints",
          "It makes reads impossible",
        ],
        0,
        "Consider the cost of coordinating transactions.",
        "Stronger isolation can reduce concurrency and increase waits.",
      ),
    ],
  },
  {
    id: "security",
    title: "Security and SQL injection",
    category: "Security",
    level: "Intermediate",
    minutes: 17,
    summary: "Limit access and separate query structure from input data.",
    objectives: ["Choose a parameterized query", "Apply least privilege"],
    explanation:
      "A parameterized query sends user values separately from SQL structure, so input cannot become executable SQL syntax. Roles grant only the privileges needed for a task. Sensitive credentials should never be embedded in browser code.",
    keyIdea:
      "Treat user input as data, and grant each role only necessary access.",
    visual: "security",
    exampleSql:
      "-- Parameter binding is an application API, not string concatenation.\nSELECT customer_id FROM customers WHERE email = ?;",
    exercises: [
      quiz(
        "security-1",
        "Which query construction best prevents SQL injection?",
        [
          "Concatenate raw user text into SQL",
          "Use bound parameters",
          "Hide the submit button",
          "Remove all indexes",
        ],
        1,
        "The value must stay separate from SQL syntax.",
        "Bound parameters are interpreted as data rather than part of the query text.",
      ),
      quiz(
        "security-2",
        "What does least privilege mean for a reporting account?",
        [
          "Grant every write permission",
          "Grant only the reads it needs",
          "Give it the admin password",
          "Store credentials in localStorage",
        ],
        1,
        "Match access to its actual work.",
        "A reporting account should receive only the required read access.",
      ),
    ],
  },
  {
    id: "backup-recovery",
    title: "Backup and recovery",
    category: "Reliability",
    level: "Intermediate",
    minutes: 14,
    summary: "Plan for mistakes, corruption, and point-in-time restoration.",
    objectives: [
      "Distinguish backup from replication",
      "Explain restore testing",
    ],
    explanation:
      "A backup is a recoverable copy of data from an earlier point. Replication copies changes to other nodes for availability, but accidental deletes can replicate too. Backups are useful only when the restore procedure has been tested.",
    keyIdea:
      "A backup is a recovery option; replication alone is not a historical copy.",
    visual: "transaction",
    exampleSql:
      "-- Practice data can be exported before an experiment.\nSELECT COUNT(*) AS total_orders FROM orders;",
    exercises: [
      quiz(
        "backup-recovery-1",
        "Why does replication not replace backups?",
        [
          "Replicas cannot read queries",
          "Accidental deletes may replicate",
          "Backups always fail",
          "Replication removes transactions",
        ],
        1,
        "A mistake can be copied along with valid changes.",
        "Replicas may faithfully copy destructive mistakes; backups preserve earlier states.",
      ),
      quiz(
        "backup-recovery-2",
        "What proves a backup can help during an incident?",
        [
          "Its file name",
          "A successful restore test",
          "A large file size",
          "An index count",
        ],
        1,
        "Can you actually recover useful data from it?",
        "Regular restore tests verify that backups are usable.",
      ),
    ],
  },
  {
    id: "distributed",
    title: "Replication and sharding",
    category: "Scale",
    level: "Advanced",
    minutes: 17,
    summary: "Spread reads or data across database nodes.",
    objectives: [
      "Distinguish replicas from shards",
      "Recognize a shard-key tradeoff",
    ],
    explanation:
      "Replication maintains copies of data on multiple nodes, often to improve availability and read capacity. Sharding partitions different subsets of data across nodes. A poor shard key can concentrate traffic on one node.",
    keyIdea: "Replicas copy data; shards divide data.",
    visual: "distributed",
    exampleSql:
      "SELECT customer_id, COUNT(*) AS orders FROM orders GROUP BY customer_id;",
    exercises: [
      quiz(
        "distributed-1",
        "Which technique stores different customer ranges on different nodes?",
        ["Replication", "Sharding", "Normalization", "A view"],
        1,
        "The data is split rather than copied.",
        "Sharding partitions subsets across nodes.",
      ),
      quiz(
        "distributed-2",
        "What makes a shard key problematic?",
        [
          "Even distribution",
          "Concentrating most writes on one shard",
          "Stable lookup routing",
          "A clear partition rule",
        ],
        1,
        "Look for a hotspot.",
        "A skewed key can overload one shard while others are underused.",
      ),
    ],
  },
  {
    id: "nosql",
    title: "NoSQL concepts",
    category: "Documents",
    level: "Beginner",
    minutes: 12,
    summary:
      "Choose data models based on access patterns and consistency needs.",
    objectives: [
      "Identify a document store",
      "Avoid assuming all NoSQL systems are alike",
    ],
    explanation:
      "NoSQL describes several non-relational families, including document, key-value, graph, and wide-column stores. They have different query and consistency models. A document store groups related fields in JSON-like documents.",
    keyIdea: "NoSQL is a family of models, not one database design rule.",
    visual: "document",
    exampleSql: "SELECT customer_id, first_name FROM customers;",
    exercises: [
      quiz(
        "nosql-1",
        "Which is a document-style record?",
        [
          "A JSON-like object with nested fields",
          "A SQL JOIN condition",
          "A B-tree pointer",
          "A transaction ID alone",
        ],
        0,
        "Think of a self-contained structured object.",
        "A document groups named fields and may contain nested values.",
      ),
      quiz(
        "nosql-2",
        "Are all NoSQL databases document stores?",
        [
          "Yes",
          "No, several data models exist",
          "Only when indexed",
          "Only in the browser",
        ],
        1,
        "NoSQL includes more than one model.",
        "Key-value, graph, wide-column, and document systems are distinct families.",
      ),
    ],
  },
  {
    id: "mongodb-documents",
    title: "MongoDB documents and collections",
    category: "Documents",
    level: "Intermediate",
    minutes: 17,
    summary: "Explore fields, nested data, and document identifiers.",
    objectives: [
      "Distinguish collection and document",
      "Reason about embedding",
    ],
    explanation:
      "MongoDB stores documents in collections. Each document has an _id and may contain nested objects or arrays. Embedding related data can make one read convenient, but excessive growth or frequent independent updates may favor references.",
    keyIdea:
      "Model document shape around the reads and updates the application performs.",
    visual: "document",
    exampleSql:
      "-- Relational comparison for a product lookup\nSELECT name, price FROM products WHERE product_id = 1;",
    exercises: [
      quiz(
        "mongodb-documents-1",
        "What is the closest MongoDB counterpart to a table?",
        ["Collection", "Index leaf", "Transaction log", "Primary key"],
        0,
        "Documents are grouped inside it.",
        "A collection groups documents, similar in broad purpose to a table.",
      ),
      quiz(
        "mongodb-documents-2",
        "When is embedding order items inside an order useful?",
        [
          "When they are commonly read with the order",
          "When items must be updated independently millions of times",
          "When the document must have no fields",
          "When SQL is required",
        ],
        0,
        "Consider the common read path.",
        "Embedding can make a common order-and-items read a single document fetch.",
      ),
    ],
  },
  {
    id: "mongodb-aggregation",
    title: "MongoDB aggregation and indexes",
    category: "Documents",
    level: "Advanced",
    minutes: 18,
    summary: "Filter, reshape, group, and order documents in stages.",
    objectives: [
      "Read a basic aggregation pipeline",
      "Choose an index for a frequent filter",
    ],
    explanation:
      "An aggregation pipeline passes documents through stages. $match filters, $project reshapes, $group summarizes, and $sort orders the results. An index on a frequently filtered field can reduce the documents examined.",
    keyIdea:
      "Each pipeline stage transforms the stream of documents for the next stage.",
    visual: "pipeline",
    exampleSql:
      "-- SQL comparison for a document aggregation\nSELECT status, COUNT(*) FROM orders GROUP BY status;",
    exercises: [
      quiz(
        "mongodb-aggregation-1",
        "Which pipeline stage filters documents?",
        ["$match", "$group", "$sort", "$project"],
        0,
        "It corresponds broadly to SQL WHERE.",
        "$match keeps only documents satisfying its predicate.",
      ),
      quiz(
        "mongodb-aggregation-2",
        "A frequent find query filters by customerId. Which index is a useful first candidate?",
        [
          "An index on customerId",
          "An unrelated field",
          "No index can help",
          "An index on a random constant",
        ],
        0,
        "Index the field used by the selective predicate.",
        "An index on customerId can help locate matching documents.",
      ),
    ],
  },
  {
    id: "case-study",
    title: "Design a retail database",
    category: "Case Studies",
    level: "Advanced",
    minutes: 22,
    summary:
      "Apply keys, relationships, constraints, and query patterns together.",
    objectives: [
      "Choose a robust order model",
      "Explain the need for an order_items table",
    ],
    explanation:
      "A retail schema separates customers, orders, products, and order_items. One order can contain many products, and one product can occur in many orders; order_items resolves that many-to-many relationship and stores quantity and the price at purchase time.",
    keyIdea:
      "Store transaction-specific facts on the relationship row where they belong.",
    visual: "relational",
    exampleSql:
      "SELECT o.order_id, p.name, oi.quantity FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id;",
    exercises: [
      quiz(
        "case-study-1",
        "Where should the quantity of a product in an order live?",
        ["products", "customers", "order_items", "categories"],
        2,
        "The quantity depends on both the order and the product.",
        "order_items stores facts about a particular product within a particular order.",
      ),
      quiz(
        "case-study-2",
        "Why store unit_price on order_items even though products has price?",
        [
          "To preserve the price at purchase time",
          "To disable indexes",
          "To remove the order key",
          "To guarantee every customer has one order",
        ],
        0,
        "Catalog prices can change later.",
        "The order item needs the historical transaction price.",
      ),
    ],
  },
];

export const lessons: Lesson[] = [
  ...foundationLessons,
  ...engineeringLessons,
].map((lesson) => ({
  ...lesson,
  minutes: lesson.minutes + 8,
  deepDive: lesson.deepDive ?? coreDepth[lesson.id],
  workedExample: workedExamples[lesson.id],
  mastery: lessonMastery[lesson.id],
}));

export const allExercises = lessons.flatMap((lesson) => lesson.exercises);
export const categories = [
  ...new Set(lessons.map((lesson) => lesson.category)),
];
