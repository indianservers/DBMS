import type { Lesson } from "./curriculum";

type Depth = NonNullable<Lesson["deepDive"]>;
type Worked = NonNullable<Lesson["workedExample"]>;

// These chapters extend the introductory path without changing lesson IDs or saved progress.
export const coreDepth: Record<string, Depth> = {
  fundamentals: {
    sections: [
      {
        title: "Why a DBMS exists",
        body: "A collection of separate files makes it difficult to keep one consistent truth when several users update the same facts. A DBMS supplies a data model, query language, constraints, controlled access, and recovery. It does not guarantee that a poor schema or query will be correct or fast.",
      },
      {
        title: "Data, schema, and metadata",
        body: "Data is the current set of facts. The schema defines permitted structures and rules. The catalog stores metadata about tables, columns, keys, and indexes. An application asks questions through a query interface rather than depending on the bytes of a storage file.",
      },
      {
        title: "When a database helps",
        body: "A spreadsheet can be excellent for small personal analysis. A database becomes valuable when related records must be queried repeatedly, checked for validity, updated concurrently, or recovered after failure. Choose a DBMS based on the workload and operational needs, not just the amount of data.",
      },
    ],
  },
  "relational-model": {
    sections: [
      {
        title: "Relations and tuples",
        body: "A relation has a defined set of attributes and tuples. The attributes have domains such as integer or text. In the theoretical model, tuples are unordered and duplicates are not meaningful; SQL tables can contain duplicate-looking rows and SQL results have no guaranteed order without ORDER BY.",
      },
      {
        title: "Separating facts",
        body: "Customers and orders describe different kinds of fact. Storing each customer once avoids repeating names and addresses on every order. A foreign-key value lets an order refer to its customer without copying all customer attributes.",
      },
      {
        title: "NULL and keys",
        body: "A primary key identifies a row and cannot be NULL. Other attributes may be unknown or inapplicable; SQL represents both with NULL unless the design supplies more detail. A foreign key is a reference, not a physical pointer to a row's memory address.",
      },
    ],
  },
  "keys-constraints": {
    sections: [
      {
        title: "Several kinds of key",
        body: "A superkey uniquely identifies rows but may contain unnecessary attributes. A candidate key is a minimal superkey. One candidate key becomes the primary key; another can be declared UNIQUE. A composite key uses more than one column, as in (order_id, product_id).",
      },
      {
        title: "Integrity rules",
        body: "Entity integrity requires a non-null primary key. Referential integrity requires a foreign-key value to match a referenced key, unless NULL is permitted. CHECK, NOT NULL, and UNIQUE express additional domain and business rules. Constraints are checked when data is changed, not merely when it is queried.",
      },
      {
        title: "Deletion choices",
        body: "A foreign key can block deletion of a referenced parent, cascade the deletion to children, or set the child reference to NULL when permitted. Each action encodes a business decision. Cascades are convenient but can remove more data than intended if applied indiscriminately.",
      },
    ],
  },
  "er-modeling": {
    sections: [
      {
        title: "Start with the domain",
        body: "An entity type represents a kind of thing that matters to the application. Attributes describe it; a relationship describes an association between instances. Draw the model from requirements before thinking about SQL tables so the business rules stay visible.",
      },
      {
        title: "Cardinality and participation",
        body: "One-to-many states a maximum: one customer can be associated with many orders, but each order has one customer. Participation states a minimum: a customer may have zero orders, whereas an order must have a customer. Both conditions should be recorded.",
      },
      {
        title: "Many-to-many relationships",
        body: "A product can occur in many orders and an order can contain many products. The relationship has its own attributes, such as quantity and purchase price. It becomes an associative entity or relation, often called order_items, when mapped to a relational schema.",
      },
    ],
  },
  "sql-basics": {
    sections: [
      {
        title: "Declarative questions",
        body: "SELECT expresses which result is wanted; the DBMS chooses an execution plan. FROM identifies sources, WHERE tests rows, SELECT shapes output, and ORDER BY requests presentation order. A query may return the same data in a different row order when ORDER BY is absent.",
      },
      {
        title: "Projection and duplicates",
        body: "Selecting a subset of columns resembles relational projection, but SQL retains duplicates by default. DISTINCT removes duplicate result rows. LIMIT reduces the number returned in SQLite, but LIMIT without ORDER BY does not define which rows are chosen.",
      },
      {
        title: "Aliases and expressions",
        body: "Column aliases label computed output. Expressions can combine numeric or text values, but their result and NULL behavior depend on types and dialect. Avoid SELECT * in stable application interfaces: schema changes can unexpectedly change the returned shape.",
      },
    ],
  },
  "filter-sort": {
    sections: [
      {
        title: "Predicate logic",
        body: "WHERE is evaluated for each candidate row. AND requires both predicates to be true; OR needs either. Parentheses make precedence explicit. A comparison with NULL normally produces UNKNOWN, and WHERE retains only rows for which its condition is TRUE.",
      },
      {
        title: "Ranges and patterns",
        body: "BETWEEN includes its endpoints. IN tests membership in a supplied list or subquery. LIKE matches patterns with % and _. Index usefulness varies: a selective range can benefit from an ordered index, while a leading-wildcard pattern often cannot use a normal B-tree efficiently.",
      },
      {
        title: "Sorting and pagination",
        body: "ORDER BY is the only reliable way to request result order. ASC and DESC choose direction; ties need additional sort keys for stable pagination. LIMIT and OFFSET are useful for exploration, but large offsets can force the engine to skip many rows.",
      },
    ],
  },
  joins: {
    sections: [
      {
        title: "Matching rows",
        body: "A join combines rows according to an ON predicate, usually a relationship between a foreign key and a referenced key. If the predicate is missing or wrong, a Cartesian product or unexpected duplicates can result. The multiplicity follows the data, not the number of tables.",
      },
      {
        title: "Inner and outer joins",
        body: "INNER JOIN keeps matches only. LEFT JOIN also keeps unmatched left rows and fills right-side columns with NULL. A condition on the right table placed in WHERE can accidentally remove these NULL-extended rows and make a left join behave like an inner join.",
      },
      {
        title: "Many-to-many joins",
        body: "To connect orders to products, join through order_items. An order with three items creates three joined rows; this is not necessarily duplicate data. Aggregate deliberately when the desired result is one row per order.",
      },
    ],
  },
  grouping: {
    sections: [
      {
        title: "From rows to groups",
        body: "GROUP BY partitions input rows by the grouping expressions. Aggregates such as COUNT, SUM, AVG, MIN, and MAX produce a value for each group. COUNT(*) counts rows, whereas COUNT(column) ignores NULL values in that column.",
      },
      {
        title: "Before and after aggregation",
        body: "WHERE filters input rows before grouping. HAVING filters the groups after aggregate values exist. A non-aggregated SELECT expression generally needs to be functionally determined by the GROUP BY keys; permissive SQLite behavior should not be mistaken for portable SQL.",
      },
      {
        title: "Join fan-out",
        body: "Joining a parent to multiple child tables can multiply rows before aggregation. For example, two order items and three payments can produce six joined rows for one order. Aggregate child tables separately or use an appropriate distinct count when necessary.",
      },
    ],
  },
  "subqueries-ctes": {
    sections: [
      {
        title: "Kinds of subquery",
        body: "A scalar subquery returns one value. IN and EXISTS test membership or existence. A correlated subquery refers to a row from the surrounding query, so its predicate is logically evaluated for each outer row, though the optimizer may transform its execution.",
      },
      {
        title: "CTEs make steps explicit",
        body: "A common table expression names an intermediate result within one statement. It helps separate filtering, aggregation, and final selection into readable steps. A CTE is not automatically a permanent table or always a materialized result; optimizer behavior varies by engine.",
      },
      {
        title: "NULL trap",
        body: "NOT IN can surprise when its subquery yields NULL because comparisons become UNKNOWN. NOT EXISTS with a correlated equality is often a safer expression of absence. Test empty subqueries and missing values when designing negative conditions.",
      },
    ],
  },
  "set-operations": {
    sections: [
      {
        title: "Compatible result shapes",
        body: "Both operands of a set operator must return the same number of columns with compatible types. Column names normally come from the first query. The operator combines complete rows, so deduplication compares all selected columns.",
      },
      {
        title: "Set versus bag behavior",
        body: "UNION, INTERSECT, and EXCEPT use distinct-result semantics unless a supported ALL form is specified. UNION ALL preserves duplicates and usually avoids deduplication work. An ORDER BY for the final combined result belongs after the compound query.",
      },
      {
        title: "Do not confuse with JOIN",
        body: "JOIN adds columns by matching related rows; UNION stacks compatible rows. If one result is customer IDs and another is product IDs, UNION may be syntactically valid but semantically misleading. Meaningful set operations require a common interpretation of the rows.",
      },
    ],
  },
  views: {
    sections: [
      {
        title: "A saved query interface",
        body: "A standard view stores a query definition and presents its results like a table. It can hide a complicated join or expose only approved columns. Querying the view normally reads current underlying data rather than a frozen copy.",
      },
      {
        title: "Abstraction boundary",
        body: "Applications can depend on a view while tables change beneath it, provided the view's contract is preserved. This can aid logical data independence. A view is not a substitute for carefully designed table constraints or access-control policy.",
      },
      {
        title: "Updateability and cost",
        body: "Simple single-table views may be updateable in some engines; grouped or joined views often are not. A normal view does not automatically cache or speed a query. A materialized view is a different object that stores results and requires refresh behavior.",
      },
    ],
  },
  indexes: {
    sections: [
      {
        title: "Access path, not a data rule",
        body: "An index helps the engine locate rows without scanning every row. A B+ tree supports equality and ordered ranges. An index does not itself guarantee that a query will use it; the optimizer considers selectivity, table size, and estimated page reads.",
      },
      {
        title: "Composite keys",
        body: "An index on (customer_id, order_date) can help filter a customer and scan that customer's dates in order. An index beginning with order_date serves different predicates. Leading-key order matters, and a covering index can avoid visiting the table for some queries.",
      },
      {
        title: "The write tradeoff",
        body: "Each insert, delete, or indexed-column update may also change one or more index structures. Extra indexes use storage and can slow writes. Measure the workload and read an execution plan before adding indexes indiscriminately.",
      },
    ],
  },
  "transactions-acid": {
    sections: [
      {
        title: "Transaction boundary",
        body: "BEGIN starts a unit of work; COMMIT makes its successful effects permanent, while ROLLBACK abandons them. A transaction may contain several SQL statements. The application must handle errors so a partially completed business operation does not remain committed.",
      },
      {
        title: "The four guarantees",
        body: "Atomicity is all-or-nothing; consistency means declared rules remain valid; isolation governs interference among concurrent transactions; durability protects committed work after failure. These guarantees describe different problems. A transaction can be atomic but still need constraints and suitable isolation.",
      },
      {
        title: "Transfer invariant",
        body: "For a transfer of 100 from A to B, debit and credit must commit together. The total balance should remain constant, and insufficient funds should abort the operation. An isolated transaction also protects against two transfers simultaneously reading an outdated balance.",
      },
    ],
  },
  normalization: {
    sections: [
      {
        title: "What redundancy breaks",
        body: "If a customer's address appears on every order item, an address correction requires many updates. A missed row creates an inconsistency. Insertion and deletion can also accidentally require or remove unrelated facts. These anomalies motivate decomposing relations by dependency.",
      },
      {
        title: "Progression of normal forms",
        body: "1NF addresses repeating groups and atomic attributes. 2NF removes dependencies on only part of a composite candidate key. 3NF removes certain transitive dependencies of non-prime attributes. BCNF requires every determinant of a nontrivial functional dependency to be a superkey.",
      },
      {
        title: "Tradeoffs and proof",
        body: "Normalization is not merely splitting a wide table. A decomposition should be lossless so joining its pieces does not invent rows. Dependency preservation matters because some constraints become harder to enforce after splitting. Denormalization can be justified for measured workloads, but its consistency costs must be managed.",
      },
    ],
  },
  "procedures-triggers": {
    sections: [
      {
        title: "Explicit versus automatic execution",
        body: "An application calls a procedure by name to perform a workflow. A trigger fires automatically because a specified event occurred on a table. Both can group logic near the data, but they differ in visibility and portability across database products.",
      },
      {
        title: "Timing and scope",
        body: "A trigger may run before or after an INSERT, UPDATE, or DELETE. Some engines support row and statement triggers; SQLite triggers are row-level. Multiple triggers, cascading changes, and failures can create surprising sequences, so trace the event chain carefully.",
      },
      {
        title: "Choosing the right mechanism",
        body: "Use a declarative constraint for a simple rule such as NOT NULL or a foreign key. A trigger can record an audit event or enforce a rule that cannot be expressed simply, but hidden side effects complicate tests and debugging. Procedures and cursor syntax are not portable to browser SQLite.",
      },
    ],
  },
  "query-plans": {
    sections: [
      {
        title: "Logical and physical plans",
        body: "A logical plan describes operations such as filter, project, and join. A physical plan chooses concrete operators: table scan or index search, join algorithm, sorting, and temporary storage. SQL text alone does not reveal how many rows or pages the engine will inspect.",
      },
      {
        title: "Selectivity and order",
        body: "Filtering early can reduce the rows fed into later joins, but the optimizer must estimate how selective a predicate is. Join order matters because large intermediate results are expensive. Statistics help estimate row counts, though correlated columns can make estimates inaccurate.",
      },
      {
        title: "Read plans skeptically",
        body: "EXPLAIN shows the chosen plan, not a guarantee that it is optimal. A full scan can be appropriate for a tiny table or a query returning most rows. Compare actual timings under repeatable conditions, and remember caches can dominate small examples.",
      },
    ],
  },
  concurrency: {
    sections: [
      {
        title: "Anomalies",
        body: "A dirty read sees uncommitted data that may roll back. A non-repeatable read observes a row change between two reads. A phantom occurs when a predicate query returns a different set of rows after concurrent inserts or deletes. Lost updates arise when writes overwrite each other's work.",
      },
      {
        title: "Isolation is a contract",
        body: "Isolation levels balance anomalies, waiting, and throughput. Their exact behavior differs among engines, so do not infer another product's guarantees from SQLite's behavior. Serializable execution must appear equivalent to some serial ordering of committed transactions.",
      },
      {
        title: "Mechanisms",
        body: "Locks can delay conflicting operations; multiversion concurrency control lets readers see older committed versions. Neither is automatically free: locks can deadlock and old versions consume space. Application workflows still need correct transaction boundaries and retry handling.",
      },
    ],
  },
  security: {
    sections: [
      {
        title: "Injection is a boundary failure",
        body: "If application code concatenates untrusted input into SQL text, a value may become part of the command's syntax. Parameters keep data separate from the SQL structure. Escaping is fragile and differs by dialect; bound parameters are the standard defense for values.",
      },
      {
        title: "Privileges and roles",
        body: "A reporting user should receive only the reads needed for its reports. A migration account may need schema changes but should not be used for ordinary queries. Views and row-level policies can limit exposure in engines that support them, but browser-local practice data has no server-side identity boundary.",
      },
      {
        title: "Protect the whole lifecycle",
        body: "Avoid real credentials and sensitive production records in a browser-only learning app. Imported files remain under the user's control, but local copies, exports, and backups still need consideration. Security also includes safe error messages, validation, and regular patching of dependencies.",
      },
    ],
  },
  "backup-recovery": {
    sections: [
      {
        title: "What backups capture",
        body: "A backup is a recoverable copy from a particular point in time. A full backup captures a complete state; incremental strategies capture later changes. The required recovery point determines how much recent work the system may lose, while recovery time sets how quickly service must return.",
      },
      {
        title: "Restore is the real test",
        body: "A backup file is not proof of recoverability. Restore it in a safe environment, verify schema and row counts, and run representative queries. Keep multiple generations so accidental deletion or corruption that goes unnoticed for a while does not erase every usable copy.",
      },
      {
        title: "Replication differs",
        body: "Replication serves availability and read scaling by copying ongoing changes. It can copy destructive mistakes too. A transaction log enables some engines to replay committed work after a backup, but capabilities and procedures depend on the database product.",
      },
    ],
  },
  distributed: {
    sections: [
      {
        title: "Copies versus partitions",
        body: "Replication keeps copies of the same data on several nodes; sharding assigns different subsets of data to different nodes. Replicas can improve read availability, while shards can spread data size and write load. Both add coordination and operational complexity.",
      },
      {
        title: "Consistency decisions",
        body: "A replica may lag behind its primary, so a read from that replica can return older data. Synchronous replication can reduce that lag at a latency cost. Cross-shard transactions and joins may require network communication that a single-node database avoids.",
      },
      {
        title: "Shard-key consequences",
        body: "A good shard key distributes requests and supports common lookups. A monotonically increasing key can hotspot one shard; a random key may spread writes but make range queries harder. Rebalancing data later can be expensive, so test access patterns before partitioning.",
      },
    ],
  },
  nosql: {
    sections: [
      {
        title: "Several distinct families",
        body: "Key-value stores retrieve values by key; document stores hold nested records; wide-column systems organize large sparse datasets; graph databases center relationships and traversals. These systems do not share one query language or one consistency model, so 'NoSQL' is a broad label rather than a single design.",
      },
      {
        title: "Workload before product",
        body: "Choose a data model based on read patterns, update patterns, relationships, constraints, and operational needs. A relational model is often excellent for joins and strong integrity rules. A document model may simplify fetching a bounded aggregate such as an order and its lines.",
      },
      {
        title: "Tradeoffs remain",
        body: "Embedding can duplicate facts or produce large records; references can require multiple reads. Distributed designs still face failures, replication delay, and consistency choices. Do not assume a non-relational database is automatically faster or more scalable for every workload.",
      },
    ],
  },
  "mongodb-documents": {
    sections: [
      {
        title: "Documents and collections",
        body: "A document is a JSON-like record with an _id and fields that may contain objects or arrays. A collection groups documents. Unlike a fixed relational table schema, documents may vary in shape, but applications still benefit from deliberate validation and stable field conventions.",
      },
      {
        title: "Embed or reference",
        body: "Embed a bounded child set when it is usually read and updated with its parent. Reference data that grows without bound, is shared widely, or changes independently. For an order, line items may embed naturally; a customer with millions of orders should not contain every order in one document.",
      },
      {
        title: "Model real updates",
        body: "Document design is not just converting each SQL table to a collection. Start with the operations: which fields change together, which queries need an index, and how large records become. Simulated MongoDB lessons in this browser app illustrate concepts without connecting to a MongoDB server.",
      },
    ],
  },
  "mongodb-aggregation": {
    sections: [
      {
        title: "Pipeline as transformations",
        body: "Each aggregation stage receives documents and emits documents for the next stage. $match filters, $project selects or computes fields, $group aggregates by a key, and $sort orders the result. The shape after one stage determines what the following stage can reference.",
      },
      {
        title: "Stage order matters",
        body: "An early selective $match can reduce work, while a late filter may process many unnecessary documents. A $project that removes a field before a later $match can make the pipeline invalid. The optimizer may rearrange safe stages, but learners should reason about the logical flow first.",
      },
      {
        title: "Indexes and scale",
        body: "An index can help early filtering and suitable sorting, but it does not make every stage cheap. Grouping many documents can require memory or spilling. The browser lesson is a model of pipeline behavior; its SQL example is a relational comparison, not a MongoDB execution engine.",
      },
    ],
  },
  "case-study": {
    sections: [
      {
        title: "Requirements to entities",
        body: "A retailer needs customers, products, orders, and ordered items. Ask what can exist independently and what belongs to an event. A product's current catalog price is different from the price charged on a past order item.",
      },
      {
        title: "Rules to keys",
        body: "Each order belongs to a customer, so orders stores a customer_id foreign key. One order can contain several products, and a product can appear in several orders, so order_items resolves the many-to-many relationship. A key such as (order_id, product_id) may work when a product appears at most once per order.",
      },
      {
        title: "Test the design",
        body: "Try inserting an order for a missing customer, two identical item keys, a product price change after purchase, and an order with no items. Check which cases constraints prevent and which need transaction or application logic. Then query revenue without multiplying rows through unrelated joins.",
      },
    ],
  },
};

const worked = (
  question: string,
  steps: [string, string, string],
  takeaway: string,
): Worked => ({ question, steps, takeaway });

export const workedExamples: Record<string, Worked> = {
  fundamentals: worked(
    "A school stores students, courses, and enrollments. Why use a DBMS?",
    [
      "Identify related facts that change independently.",
      "Define tables and keys so enrollments reference valid students and courses.",
      "Use transactions and queries to keep updates reliable and answers repeatable.",
    ],
    "A DBMS coordinates related data and rules; it is more than a large file.",
  ),
  "relational-model": worked(
    "How should an order refer to its customer?",
    [
      "Give each customer a stable customer_id.",
      "Store that ID on each order, not a copied customer name.",
      "Join on the IDs when a report needs customer and order details.",
    ],
    "Separate facts and connect them with keys.",
  ),
  "keys-constraints": worked(
    "Prevent an order with a nonexistent customer.",
    [
      "Make customers.customer_id a primary key.",
      "Declare orders.customer_id as a foreign key to it.",
      "An INSERT referencing a missing ID is rejected when foreign keys are enforced.",
    ],
    "A relationship becomes enforceable only when declared as a constraint.",
  ),
  "er-modeling": worked(
    "Model customers and orders.",
    [
      "One customer can place many orders: maximum 1:N.",
      "A customer may have no orders: partial participation on that side.",
      "Every order must belong to a customer: total participation on the order side.",
    ],
    "Cardinality and participation must both be stated.",
  ),
  "sql-basics": worked(
    "List product names and prices in a predictable order.",
    [
      "FROM products chooses the source.",
      "SELECT name, price chooses output columns.",
      "ORDER BY price, name makes ties deterministic.",
    ],
    "SELECT alone never promises row order.",
  ),
  "filter-sort": worked(
    "Find shipped orders since a date.",
    [
      "WHERE status = 'Shipped' filters by state.",
      "AND order_date >= '2024-01-01' applies the date bound.",
      "ORDER BY order_date DESC, order_id DESC makes the result stable.",
    ],
    "Use parentheses and tie-breakers when filters or order matter.",
  ),
  joins: worked(
    "Show every customer, including those with no orders.",
    [
      "Start with customers as the left relation.",
      "LEFT JOIN orders ON matching customer_id.",
      "Count o.order_id, not COUNT(*), to give zero to unmatched customers.",
    ],
    "The preserved side and counted expression determine the meaning.",
  ),
  grouping: worked(
    "Count orders by status after January 1.",
    [
      "WHERE order_date >= '2024-01-01' removes earlier rows.",
      "GROUP BY status forms one group per status.",
      "COUNT(*) counts rows in each group; HAVING can then filter groups.",
    ],
    "WHERE and HAVING operate at different stages.",
  ),
  "subqueries-ctes": worked(
    "Find customers with at least one order.",
    [
      "For each customer, look for orders with the same customer_id.",
      "EXISTS is true as soon as one matching row is found.",
      "Select customers for which that existence predicate holds.",
    ],
    "EXISTS expresses presence without multiplying customer rows.",
  ),
  "set-operations": worked(
    "Combine IDs from two compatible customer lists.",
    [
      "Select the same ID column from each source.",
      "UNION removes duplicates; UNION ALL keeps them.",
      "Apply ORDER BY to the final combined result if presentation order matters.",
    ],
    "UNION stacks rows; JOIN matches rows.",
  ),
  views: worked(
    "Expose only customer IDs and names to a report.",
    [
      "Define a view selecting those two columns.",
      "The report queries the view instead of the base table.",
      "Changing underlying data updates later view results without refreshing a standard view.",
    ],
    "A standard view is a reusable query boundary, not a frozen copy.",
  ),
  indexes: worked(
    "Choose an index for orders by customer and recent date.",
    [
      "The query filters customer_id and orders by order_date.",
      "Consider an index on (customer_id, order_date).",
      "Inspect the plan and write overhead before keeping it.",
    ],
    "Index column order follows the access pattern.",
  ),
  "transactions-acid": worked(
    "Transfer 100 from account A to B.",
    [
      "Begin and verify A can afford the debit.",
      "Update both balances inside one transaction.",
      "Commit only if both succeed; otherwise roll back.",
    ],
    "Atomicity protects the pair of writes; isolation protects them from interference.",
  ),
  normalization: worked(
    "Why move product_name out of order_items?",
    [
      "The key is (order_id, product_id).",
      "product_name depends on product_id alone, not the full key.",
      "Keep product_name in products and its key on order_items.",
    ],
    "A partial dependency creates repeated facts and update anomalies.",
  ),
  "procedures-triggers": worked(
    "Record an audit row whenever an order is inserted.",
    [
      "An INSERT creates a new order row.",
      "An AFTER INSERT trigger reads the inserted values.",
      "The trigger writes the audit record in the same transaction.",
    ],
    "Trace automatic side effects, including what a rollback should undo.",
  ),
  "query-plans": worked(
    "Why might an index not help a price query?",
    [
      "Estimate how many products meet price > 0.",
      "If nearly all qualify, an index still leads to many row visits.",
      "A full scan may read fewer pages and be cheaper.",
    ],
    "A plan depends on selectivity and cost, not index existence alone.",
  ),
  concurrency: worked(
    "Two users read a balance of 100 and each subtract 30.",
    [
      "Both read the same starting value.",
      "Each computes 70 and writes it.",
      "The final balance is 70 instead of 40: one update was lost.",
    ],
    "Use appropriate atomic updates and transaction isolation.",
  ),
  security: worked(
    "Search for an email entered by a user.",
    [
      "Write SQL with a placeholder: email = ?.",
      "Bind the input value separately using the database API.",
      "The engine treats the input as data even if it contains SQL punctuation.",
    ],
    "Parameter binding protects SQL structure.",
  ),
  "backup-recovery": worked(
    "A deletion is discovered the next day.",
    [
      "A replica may already contain the same deletion.",
      "Select a backup from before the mistake.",
      "Restore and verify the needed rows, then reconcile legitimate later changes.",
    ],
    "Historical recovery needs usable backups, not just replicas.",
  ),
  distributed: worked(
    "A site has many reads but modest writes.",
    [
      "Keep a primary copy accepting writes.",
      "Replicate data to read-serving copies.",
      "Decide which reads may tolerate replica lag.",
    ],
    "Replication addresses availability and read capacity, not every scaling issue.",
  ),
  nosql: worked(
    "Choose a model for a bounded shopping cart.",
    [
      "A cart and its items are commonly read together.",
      "Embedding items in one document may simplify that read.",
      "Reconsider if items become shared or independently updated at large scale.",
    ],
    "Access and update patterns decide whether embedding helps.",
  ),
  "mongodb-documents": worked(
    "Model a customer with millions of historical orders.",
    [
      "One huge embedded orders array would grow without bound.",
      "Store orders separately with a customer reference.",
      "Index the reference for the common customer-history lookup.",
    ],
    "Bounded, jointly accessed data embeds better than unbounded histories.",
  ),
  "mongodb-aggregation": worked(
    "Count shipped orders by country.",
    [
      "$match keeps shipped orders.",
      "$group by country counts the remaining documents.",
      "$sort orders the summaries for display.",
    ],
    "Each pipeline stage changes the stream seen by the next.",
  ),
  "case-study": worked(
    "Preserve the price a customer actually paid.",
    [
      "products.price is the current catalog price.",
      "order_items.unit_price records the price at purchase time.",
      "Later catalog changes leave old order totals reproducible.",
    ],
    "Transaction facts belong to the transaction, not the current catalog.",
  ),
  "dbms-architecture": worked(
    "A DBA adds an index, then a developer splits a table behind a view.",
    [
      "The index changes the internal schema only: physical independence.",
      "The split changes the conceptual schema.",
      "Redefining the external view preserves the app interface: logical independence.",
    ],
    "Name the boundary crossed by each change.",
  ),
  "eer-design": worked(
    "An order line has a line number unique within its order.",
    [
      "OrderLine depends on an owner Order.",
      "line_number identifies a line only relative to that order.",
      "Combine order_id and line_number in the weak entity key.",
    ],
    "A partial key needs its owner's key.",
  ),
  "er-mapping": worked(
    "Map a student–course enrollment relationship.",
    [
      "Students and courses have independent primary keys.",
      "Many students take many courses, so create Enrollment(student_id, course_id).",
      "Store semester or grade on Enrollment because they describe the participation.",
    ],
    "M:N relationships with attributes become relations.",
  ),
  "relational-algebra": worked(
    "Find names of Indian customers.",
    [
      "Apply selection σ country='IN' to customers.",
      "Apply projection π name to the selected relation.",
      "Under set semantics, duplicate resulting names are removed.",
    ],
    "An algebra expression is built from relations produced by earlier operators.",
  ),
  "functional-dependencies": worked(
    "Find A⁺ given A → B, B → C, and CD → E.",
    [
      "Start with {A} and apply A → B, obtaining {A,B}.",
      "Apply B → C, obtaining {A,B,C}.",
      "CD → E cannot fire without D, so A⁺ = {A,B,C}.",
    ],
    "Closure grows until no FD adds an attribute.",
  ),
  "normalization-proofs": worked(
    "Test R(A,B,C) → R1(A,B), R2(A,C) under A → B.",
    [
      "The intersection of R1 and R2 is A.",
      "A determines all of R1 because A → B.",
      "The binary decomposition is lossless under that FD.",
    ],
    "A shared key of one component prevents spurious combinations.",
  ),
  "transaction-schedules": worked(
    "Test W1(A), R2(A), W2(B), R1(B).",
    [
      "W1(A) before R2(A) gives edge T1 → T2.",
      "W2(B) before R1(B) gives edge T2 → T1.",
      "The cycle means no conflict-equivalent serial order exists.",
    ],
    "Conflicts become graph edges; cycles fail the test.",
  ),
  "concurrency-protocols": worked(
    "T1 holds X(A) and requests X(B); T2 holds X(B) and requests X(A).",
    [
      "T1 waits for T2 to release B.",
      "T2 waits for T1 to release A.",
      "The wait-for cycle requires abort, timeout, or prevention.",
    ],
    "Strict locking prevents dirty observations but can deadlock.",
  ),
  "physical-storage": worked(
    "A table has 1,000 rows and 20 fit on a page.",
    [
      "Compute ceil(1000/20) = 50 data pages.",
      "A full uncached scan reads about 50 pages.",
      "An unclustered index may still need many separate data-page reads for many matches.",
    ],
    "Estimate page I/O, not just matching rows.",
  ),
  "index-internals": worked(
    "Insert 35 into a full leaf [10,20,30].",
    [
      "Insert and temporarily sort: [10,20,30,35].",
      "Split the leaf into [10,20] and [30,35].",
      "Promote separator 30 to the parent and update its child pointers.",
    ],
    "A B+ tree split preserves sorted leaf order and changes routing keys.",
  ),
  "sql-deep-dive": worked(
    "Why does WHERE email = NULL find nobody?",
    [
      "A comparison involving NULL yields UNKNOWN.",
      "WHERE keeps TRUE rows only.",
      "Use email IS NULL to test missing values explicitly.",
    ],
    "UNKNOWN is not the same as FALSE, but both are excluded by WHERE.",
  ),
  "query-costs": worked(
    "Compare a 20-page outer with an 80-page inner.",
    [
      "Simple page nested loop costs about 20 + 20×80 = 1620 page reads.",
      "An in-memory hash join scans roughly 20 + 80 = 100 input pages.",
      "Reconsider if an index, memory spill, or selectivity changes the assumptions.",
    ],
    "Cost formulas are models with explicit assumptions.",
  ),
  "recovery-internals": worked(
    "Commit is logged, then power fails before a data page is written.",
    [
      "WAL persisted the update record before the page could flush.",
      "The durable commit record proves the transaction finished.",
      "Recovery redoes the change if the page lacks it.",
    ],
    "A durable log bridges the gap between commit and page flush.",
  ),
  "database-programming": worked(
    "Compare an audit trigger with a transfer procedure.",
    [
      "The transfer procedure runs only when called.",
      "The audit trigger runs when its configured table event occurs.",
      "Trace both within transaction boundaries to understand rollback behavior.",
    ],
    "Explicit and automatic database logic have different visibility.",
  ),
  "design-case-studies": worked(
    "Model repeat library loans of the same book copy.",
    [
      "BookCopy identifies the physical copy; Member identifies a borrower.",
      "Loan links them and records borrowed_at, due_at, and returned_at.",
      "A new loan is a new event, not an overwrite of the copy's past.",
    ],
    "Time-dependent facts belong to event entities.",
  ),
};
