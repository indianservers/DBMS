export type GlossaryTerm = {
  term: string;
  definition: string;
  category: string;
  lessonId: string;
};

// Each line is a term and a concise, standalone definition. The category's
// lesson is a useful next step, not necessarily an exact one-to-one match.
const groups: { category: string; lessonId: string; entries: string }[] = [
  {
    category: "Foundations",
    lessonId: "fundamentals",
    entries: `Database|An organized collection of related data managed as a unit.
DBMS|Software that stores, queries, protects, and recovers databases.
RDBMS|A DBMS based on relations, keys, constraints, and relational queries.
Data model|A set of concepts for representing data and its relationships.
Schema|The declared structure and rules of a database.
Instance|The data held by a database at a particular moment.
Metadata|Data describing structures, types, constraints, or other data.
Catalog|The system-maintained collection of database metadata.
Relation|A set of tuples with the same named attributes in the relational model.
Table|The SQL structure that stores rows under named columns.
Tuple|One row of a relation in relational terminology.
Attribute|A named property or column of a relation.
Domain|The permitted set of values for an attribute.
Record|A collection of fields representing one stored item.
Field|One named value within a record or document.
Data independence|The ability to change one schema or storage level without changing higher levels.
Logical schema|The user-facing structure of entities, attributes, and relationships.
Physical schema|The storage layout, files, pages, and access paths used by an engine.
Three-schema architecture|A separation of external views, conceptual structure, and internal storage.
Database engine|The component that executes queries and manages persistent data.`,
  },
  {
    category: "Relational design",
    lessonId: "rdbms-systems",
    entries: `Primary key|A chosen candidate key used to identify each row uniquely.
Candidate key|A minimal set of attributes that uniquely identifies a row.
Superkey|Any set of attributes that uniquely identifies a row, possibly with extras.
Composite key|A key made from two or more attributes.
Foreign key|Columns whose values reference a key in another or the same table.
Surrogate key|An artificial identifier added instead of using a natural business key.
Natural key|A key derived from real-world attributes of the entity.
Unique constraint|A rule preventing duplicate values in specified columns.
NOT NULL|A constraint requiring a column to contain a non-NULL value.
CHECK constraint|A declared predicate that valid rows must satisfy.
Referential integrity|The rule that references point to existing permitted rows.
Entity integrity|The rule that a primary key uniquely identifies each row and is not NULL.
ON DELETE CASCADE|A foreign-key action that deletes dependent rows with the referenced row.
Normalization|Organizing relations to reduce redundancy and update anomalies.
Denormalization|Deliberately duplicating or combining data for a measured access pattern.
Functional dependency|A rule where one attribute set determines another attribute set.
First normal form|A relational design level requiring attributes to hold atomic values for the chosen model.
Second normal form|First normal form with no non-key attribute dependent on only part of a candidate key.
Third normal form|A normal form limiting dependencies of non-prime attributes on non-superkeys.
BCNF|Boyce–Codd normal form; every nontrivial determinant is a superkey.`,
  },
  {
    category: "Modeling",
    lessonId: "er-modeling",
    entries: `Entity|A distinguishable real-world object or concept being modeled.
Entity set|A collection of entities of the same modeled kind.
Relationship|An association among entities.
Relationship set|A collection of associations of the same kind.
ER diagram|A visual representation of entities, attributes, and relationships.
Cardinality|The number of entities that may participate in a relationship.
One-to-one|A relationship in which each side matches at most one entity on the other.
One-to-many|A relationship in which one entity can match several on the other side.
Many-to-many|A relationship allowing several matches on both sides.
Participation constraint|A rule stating whether every entity must join a relationship.
Weak entity|An entity whose identification depends on an owning entity.
Associative entity|An entity used to represent a many-to-many association and its attributes.
Specialization|Dividing a general entity type into more specific subtypes.
Generalization|Combining similar entity types into a shared supertype.
Disjoint subtype|A subtype rule allowing an entity in at most one sibling subtype.
Overlapping subtype|A subtype rule allowing an entity in multiple sibling subtypes.
Total specialization|A subtype rule requiring every supertype entity to belong to a subtype.
Partial specialization|A subtype rule allowing supertype entities without a subtype.
Inheritance|A subtype receiving attributes or relationships from its supertype.
Schema migration|A controlled change to a database's structure or data representation.`,
  },
  {
    category: "SQL language",
    lessonId: "sql-language-systems",
    entries: `SQL|A language for defining, querying, and modifying relational data.
DDL|Data-definition statements such as CREATE and ALTER.
DML|Data-manipulation statements such as SELECT, INSERT, UPDATE, and DELETE.
DCL|Data-control statements governing privileges, such as GRANT and REVOKE.
TCL|Transaction-control statements such as COMMIT and ROLLBACK.
SELECT|A statement that requests result rows from a data source.
INSERT|A statement that adds rows to a table.
UPDATE|A statement that changes values in existing rows.
DELETE|A statement that removes selected rows.
UPSERT|An insert operation that instead updates on a specified conflict.
WHERE|A clause filtering input rows before grouping.
GROUP BY|A clause forming groups for aggregate computation.
HAVING|A clause filtering groups after aggregation.
ORDER BY|A clause sorting the final result by specified expressions.
LIMIT|A dialect-supported clause restricting the number of returned rows.
DISTINCT|A modifier removing duplicate result rows.
NULL|A marker for missing or inapplicable information, not an ordinary value.
Three-valued logic|SQL predicate logic with TRUE, FALSE, and UNKNOWN.
Parameterized query|A query whose values are bound separately from its SQL syntax.
Prepared statement|A parsed or planned statement reused with bound parameters.`,
  },
  {
    category: "Queries & views",
    lessonId: "sql-basics",
    entries: `INNER JOIN|A join returning pairs that satisfy the join condition.
LEFT JOIN|A join keeping every left row and NULL-extending unmatched right rows.
RIGHT JOIN|A join keeping every right row and NULL-extending unmatched left rows.
FULL OUTER JOIN|A join keeping matches and unmatched rows from both inputs.
CROSS JOIN|A join producing every pair of rows from two inputs.
Self join|A table joined to itself under separate aliases.
Equijoin|A join whose matching condition uses equality.
Semi join|A result containing left rows that have at least one right-side match.
Anti join|A result containing left rows with no right-side match.
Subquery|A query nested inside another SQL statement.
Correlated subquery|A subquery that uses values from its enclosing query row.
CTE|A common table expression naming a temporary query result within a statement.
Recursive CTE|A CTE that repeatedly applies a step to its own prior result.
Window function|A calculation over related rows that preserves individual result rows.
Aggregate function|A calculation summarizing multiple input rows, such as COUNT or SUM.
View|A named query presented like a virtual table.
Materialized view|A stored query result refreshed according to a defined policy.
UNION|A set operation combining rows and removing duplicates.
UNION ALL|A combination of result rows that preserves duplicates.
EXCEPT|A set operation returning left-side rows absent from the right side.`,
  },
  {
    category: "Storage & performance",
    lessonId: "physical-storage",
    entries: `Page|A fixed-size unit that a DBMS reads or writes between memory and storage.
Buffer pool|Memory holding cached database pages for reuse.
Heap file|A table organization with rows stored without a key ordering.
Clustered index|An index whose key order determines or closely follows stored row order.
Secondary index|An additional access path separate from the table's primary storage order.
B+ tree|A balanced index tree with ordered leaf entries suitable for range scans.
Hash index|An index using a hash function for key lookup, usually not range order.
Covering index|An index containing all columns a particular query needs.
Composite index|An index over multiple columns in a defined order.
Selectivity|The fraction of rows a predicate is expected to retain.
Cardinality estimate|A planner's prediction of how many rows an operation will produce.
Table scan|Reading a table's rows sequentially to evaluate a query.
Index scan|Following an index to locate qualifying entries or rows.
Query plan|The physical operations chosen to execute a query.
Cost-based optimizer|A planner comparing estimated resource costs of alternative plans.
Nested-loop join|A join that probes one input for each row of another input.
Hash join|A join that builds a hash table on one input and probes with the other.
Merge join|A join that walks inputs ordered by join key.
Statistics|Collected summaries that help estimate row counts and plan costs.
Execution plan|A representation of operations actually selected for a query.`,
  },
  {
    category: "Transactions",
    lessonId: "transactions-acid",
    entries: `Transaction|A group of operations treated as one unit of work.
Atomicity|A transaction's changes all take effect or none do.
Consistency|A transaction preserves declared database invariants when valid input is used.
Isolation|Concurrent transactions behave according to a defined visibility level.
Durability|Committed changes survive the failures covered by the system's guarantee.
Commit|The operation that makes a transaction's successful changes permanent.
Rollback|The operation that abandons a transaction's uncommitted changes.
Savepoint|A marker that allows partial rollback within a transaction.
Schedule|The ordering of operations from concurrent transactions.
Serial schedule|A schedule that completes one transaction before starting another.
Serializability|The property that a concurrent schedule is equivalent to some serial order.
Conflict serializability|Serializability determined by ordering conflicting reads and writes.
Dirty read|Reading another transaction's uncommitted changes.
Non-repeatable read|Seeing a changed value on repeated reads of the same row.
Phantom read|Seeing a changed set of qualifying rows on repeated predicate reads.
Lost update|One write overwriting another transaction's update unintentionally.
MVCC|Multi-version concurrency control, retaining versions for consistent reads.
Lock|A concurrency-control claim governing access to a data item.
Deadlock|A cycle of transactions each waiting for a resource held by another.
Optimistic concurrency|A strategy that checks for conflicting changes before accepting a write.`,
  },
  {
    category: "Distributed & realtime",
    lessonId: "realtime-databases",
    entries: `Replication|Maintaining copies of data on multiple nodes.
Primary replica|A replica designated to accept or coordinate writes in a primary-based design.
Read replica|A copy used to serve reads, possibly behind the writer.
Replication lag|The delay before a replica reflects an upstream committed change.
Sharding|Dividing a dataset across nodes by a partitioning rule.
Partition key|A value used to choose the shard or partition storing an item.
Hot partition|A partition receiving disproportionate data or request load.
Quorum|A required subset of nodes whose agreement completes an operation.
Consensus|A protocol for nodes to agree on a sequence or value despite failures.
Eventual consistency|A guarantee that replicas converge when updates stop, subject to the system's assumptions.
Strong consistency|A family of guarantees making reads reflect a tightly defined order of writes.
Linearizability|An operation-order guarantee that appears instantaneous between call and response.
Change data capture|Publishing committed database changes from a log or equivalent source.
Change stream|An ordered feed of database changes within its stated ordering scope.
Subscription|A client's registration to receive relevant updates.
Live query|A query whose result is kept updated as underlying data changes.
Snapshot|A point-in-time view of data used as a consistent starting state.
Resume cursor|A position that allows a stream consumer to continue after interruption.
Backpressure|A way to handle producers delivering faster than consumers can process.
CRDT|A conflict-free replicated data type designed to merge concurrent updates predictably.`,
  },
  {
    category: "NoSQL & documents",
    lessonId: "nosql-families",
    entries: `NoSQL|An umbrella for non-relational database approaches with varied models and guarantees.
Document database|A database storing self-contained, field-based documents.
Document|A structured record, often represented with JSON-like fields and nested values.
Collection|A group of documents within a document database.
Key-value store|A database retrieving values primarily by unique key.
Wide-column store|A database organizing partitioned records with potentially sparse columns.
Graph database|A database centered on nodes, edges, and relationship traversal.
Node|An entity vertex in a graph data model.
Edge|A relationship connecting graph nodes, often with properties.
Embedded document|A nested document stored inside another document.
Reference|A stored identifier pointing to another record or document.
Flexible schema|A model permitting records in a collection to differ in field shape.
Document validation|Rules checking the allowed fields or types of stored documents.
Aggregation pipeline|A sequence of stages transforming and summarizing document streams.
Projection|Selecting or reshaping fields returned from a document or query.
Secondary index in NoSQL|An access path supporting queries beyond the primary key.
Consistency model|The documented rules describing when reads observe writes.
Tombstone|A deletion marker retained for replication or storage cleanup.
TTL|Time to live; an expiration interval after which data may be removed.
Polyglot persistence|Using multiple data-store models for different workload needs.`,
  },
  {
    category: "Operations & security",
    lessonId: "security",
    entries: `Authentication|Verifying the identity of a user, service, or client.
Authorization|Determining what an authenticated identity may do.
Role|A named bundle of permissions assigned to identities.
Privilege|Permission to perform an operation on a database resource.
Least privilege|Granting only the access needed for a task.
Row-level security|Policies limiting which rows a user may read or change.
SQL injection|An attack that turns untrusted input into SQL syntax.
Encryption at rest|Protecting stored data by encrypting it on persistent media.
Encryption in transit|Protecting data sent between components with an encrypted channel.
Audit log|A record of security-relevant or administrative actions.
Backup|A recoverable copy of database data and required metadata.
Restore|Reconstructing a database from backup or recovery material.
Point-in-time recovery|Restoring a database to a chosen moment using backups and logs.
Write-ahead log|A log recording changes before corresponding data pages are written.
Checkpoint|A recovery marker reducing the amount of log work needed after failure.
Crash recovery|Reconstructing a valid committed state after an unexpected stop.
Migration rollback|A planned reversal or compensation for a schema or data change.
Connection pool|A managed set of reusable database connections.
Observability|Metrics, logs, and traces used to understand system behavior.
Service-level objective|A measurable target for availability, latency, or another service property.`,
  },
];

const lessonOverrides: Record<string, string> = {
  RDBMS: "rdbms-systems",
  "Data independence": "dbms-architecture",
  "Three-schema architecture": "dbms-architecture",
  Normalization: "normalization",
  "First normal form": "normalization",
  "Second normal form": "normalization",
  "Third normal form": "normalization",
  BCNF: "normalization",
  "Functional dependency": "functional-dependencies",
  "Query plan": "query-plans",
  "Execution plan": "query-plans",
  "Cost-based optimizer": "query-plans",
  "Cardinality estimate": "query-costs",
  "Nested-loop join": "query-costs",
  "Hash join": "query-costs",
  "Merge join": "query-costs",
  "B+ tree": "index-internals",
  "Hash index": "index-internals",
  "Covering index": "indexes",
  "Composite index": "indexes",
  "Clustered index": "indexes",
  "Secondary index": "indexes",
  "Correlated subquery": "subqueries-ctes",
  Subquery: "subqueries-ctes",
  CTE: "subqueries-ctes",
  "Recursive CTE": "subqueries-ctes",
  "Window function": "sql-deep-dive",
  "Materialized view": "views",
  View: "views",
  UNION: "set-operations",
  "UNION ALL": "set-operations",
  EXCEPT: "set-operations",
  "SQL injection": "security",
  Backup: "backup-recovery",
  Restore: "backup-recovery",
  "Point-in-time recovery": "recovery-internals",
  "Write-ahead log": "recovery-internals",
  Checkpoint: "recovery-internals",
  "Crash recovery": "recovery-internals",
  "Schema migration": "design-case-studies",
  "Migration rollback": "design-case-studies",
  "Connection pool": "dbms-architecture",
};

export const glossaryTerms: GlossaryTerm[] = groups.flatMap((group) =>
  group.entries.split("\n").map((line) => {
    const separator = line.indexOf("|");
    return {
      term: line.slice(0, separator),
      definition: line.slice(separator + 1),
      category: group.category,
      lessonId: lessonOverrides[line.slice(0, separator)] ?? group.lessonId,
    };
  }),
);

export const glossaryCategories = groups.map((group) => group.category);
