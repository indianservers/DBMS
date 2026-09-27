export type ConceptVisual = {
  title: string;
  subtitle: string;
  steps: [string, string, string];
  nodes: [string, string, string];
};

// Lesson-specific traces replace the shared three-node diagram wherever the
// generic metaphor would hide the concept being taught.
export const coreVisuals: Record<string, ConceptVisual> = {
  fundamentals: {
    title: "From a question to reliable data",
    subtitle: "Trace what the DBMS contributes",
    nodes: ["Application", "DBMS", "Related tables"],
    steps: [
      "An application asks for a customer's orders.",
      "The DBMS checks the query, rules, and access path.",
      "Related tables supply consistent rows for the result.",
    ],
  },
  "relational-model": {
    title: "Separate and reconnect facts",
    subtitle: "Customers and orders have different keys",
    nodes: ["Customer 3", "customer_id = 3", "Orders 101, 108"],
    steps: [
      "One customers row describes customer 3.",
      "Two orders store customer_id 3 as a reference.",
      "A join matches both orders to that one customer.",
    ],
  },
  "keys-constraints": {
    title: "Watch integrity checks",
    subtitle: "Every inserted order must satisfy its rules",
    nodes: ["INSERT order", "PK + FK checks", "Accept / reject"],
    steps: [
      "An order proposes an order_id and customer_id.",
      "The DBMS checks key uniqueness and the referenced customer.",
      "Valid data is accepted; an invalid reference is rejected.",
    ],
  },
  "er-modeling": {
    title: "Turn a rule into a relationship",
    subtitle: "Minimum and maximum participation both matter",
    nodes: ["Customer", "0..many", "Order"],
    steps: [
      "One customer may have no orders or many orders.",
      "Every order belongs to exactly one customer.",
      "The model records both cardinality and participation.",
    ],
  },
  "sql-basics": {
    title: "Build a result",
    subtitle: "Read SQL as a series of logical decisions",
    nodes: ["FROM products", "SELECT name", "ORDER BY price"],
    steps: [
      "FROM identifies product rows.",
      "SELECT keeps the requested columns.",
      "ORDER BY gives the output a defined presentation order.",
    ],
  },
  "filter-sort": {
    title: "Filter, then order",
    subtitle: "Predicates narrow the input before sorting",
    nodes: ["All orders", "WHERE status", "Newest first"],
    steps: [
      "Start with the orders relation.",
      "Keep only rows satisfying the WHERE predicate.",
      "Sort surviving rows by date and a tie-breaking key.",
    ],
  },
  grouping: {
    title: "Rows become groups",
    subtitle: "COUNT is calculated after grouping",
    nodes: ["Order rows", "GROUP BY status", "Count per status"],
    steps: [
      "WHERE may remove individual input rows first.",
      "GROUP BY partitions remaining rows by status.",
      "COUNT(*) produces one count for each status group.",
    ],
  },
  "subqueries-ctes": {
    title: "Solve in smaller pieces",
    subtitle: "An inner result informs an outer query",
    nodes: ["Inner query", "Intermediate value", "Outer query"],
    steps: [
      "Calculate a value or set in the inner query.",
      "Give the result a role, such as average price or buyer IDs.",
      "Use it to filter or shape the outer result.",
    ],
  },
  "set-operations": {
    title: "Combine result sets",
    subtitle: "Rows stack vertically, not side by side",
    nodes: ["Result A", "UNION", "Result B"],
    steps: [
      "Each query returns compatible columns.",
      "UNION stacks rows from both results.",
      "Duplicate rows are removed unless UNION ALL is used.",
    ],
  },
  views: {
    title: "Follow a view query",
    subtitle: "A named interface reads underlying data",
    nodes: ["Report", "View definition", "Base tables"],
    steps: [
      "The report queries a named view.",
      "The DBMS expands or evaluates the view definition.",
      "Current base-table rows determine the returned result.",
    ],
  },
  indexes: {
    title: "Choose an access path",
    subtitle: "An index is optional to the optimizer",
    nodes: ["Predicate", "Index search", "Data rows"],
    steps: [
      "A selective predicate identifies a small key range.",
      "The index locates references to candidate rows.",
      "The DBMS reads needed rows and verifies the predicate.",
    ],
  },
  normalization: {
    title: "Move a fact to its key",
    subtitle: "Avoid repeated product names in order lines",
    nodes: ["Wide order line", "product_id → name", "Products table"],
    steps: [
      "The wide row repeats product_name on every matching order item.",
      "product_name depends on product_id alone.",
      "Store the name once in Products and retain product_id on items.",
    ],
  },
  "procedures-triggers": {
    title: "Trace an automatic side effect",
    subtitle: "An INSERT can start more database work",
    nodes: ["INSERT order", "AFTER trigger", "Audit row"],
    steps: [
      "The application inserts an order.",
      "The trigger fires because its event condition matches.",
      "An audit row is written within the transaction.",
    ],
  },
  "query-plans": {
    title: "From SQL to physical work",
    subtitle: "The plan chooses operators and their order",
    nodes: ["SQL predicate", "Scan / seek", "Rows returned"],
    steps: [
      "The optimizer estimates how selective the predicate is.",
      "It chooses a scan or index access path.",
      "The physical operator reads pages and produces matching rows.",
    ],
  },
  concurrency: {
    title: "See a lost update",
    subtitle: "Two users can overwrite one another",
    nodes: ["A reads 100", "B reads 100", "Both write 70"],
    steps: [
      "Transaction A reads the starting balance.",
      "Transaction B reads the same balance before A commits.",
      "Both write 70; one subtraction is lost.",
    ],
  },
  security: {
    title: "Bind input as data",
    subtitle: "Keep user text outside SQL syntax",
    nodes: ["SQL template", "Bound email", "Comparison"],
    steps: [
      "The application defines SQL with a placeholder.",
      "The user's email is bound as a value.",
      "The engine compares the value without parsing it as SQL code.",
    ],
  },
  "backup-recovery": {
    title: "Recover an earlier state",
    subtitle: "A replica and a backup solve different failures",
    nodes: ["Good backup", "Accidental delete", "Restore + verify"],
    steps: [
      "A tested backup captures a usable past state.",
      "An accidental delete may also replicate to live copies.",
      "Restore the earlier state and verify the needed data.",
    ],
  },
  nosql: {
    title: "Match model to workload",
    subtitle: "Different NoSQL families solve different needs",
    nodes: ["Access pattern", "Data shape", "Store choice"],
    steps: [
      "List the frequent reads and writes.",
      "Decide whether data is best linked, nested, keyed, or traversed.",
      "Choose a store with matching query and consistency capabilities.",
    ],
  },
  "mongodb-documents": {
    title: "Choose a document boundary",
    subtitle: "Embed bounded data read with its parent",
    nodes: ["Order", "Embedded items", "Customer ref"],
    steps: [
      "An order and its few items are often fetched together.",
      "Bounded items can be embedded in the order document.",
      "The customer is referenced because its history grows independently.",
    ],
  },
  "mongodb-aggregation": {
    title: "Transform a document stream",
    subtitle: "Each stage changes what the next receives",
    nodes: ["$match", "$group", "$sort"],
    steps: [
      "$match discards documents that do not qualify.",
      "$group turns surviving documents into summaries.",
      "$sort orders those summaries for presentation.",
    ],
  },
  "case-study": {
    title: "Build a retail order",
    subtitle: "Separate catalog facts from purchase facts",
    nodes: ["Products", "Order items", "Orders"],
    steps: [
      "Products holds current catalog facts.",
      "Order items records quantity and purchase-time unit price.",
      "Orders links the transaction to its customer and date.",
    ],
  },
};
