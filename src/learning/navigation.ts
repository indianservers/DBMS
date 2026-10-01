export type TheoryCategory = {
  id: string;
  title: string;
  description: string;
  tone: "blue" | "violet" | "green" | "amber" | "pink" | "teal";
  subcategories: { title: string; lessonIds: string[] }[];
};

export const theoryCategories: TheoryCategory[] = [
  {
    id: "systems",
    title: "Database systems & paradigms",
    description: "Compare relational, SQL, NoSQL, and realtime approaches.",
    tone: "blue",
    subcategories: [
      {
        title: "Relational DBMS & SQL",
        lessonIds: ["rdbms-systems", "sql-language-systems"],
      },
      {
        title: "NoSQL & live data",
        lessonIds: ["nosql-families", "realtime-databases"],
      },
    ],
  },
  {
    id: "foundations",
    title: "Foundations & data models",
    description:
      "Understand what a DBMS does and how to model real-world facts.",
    tone: "blue",
    subcategories: [
      {
        title: "Database foundations",
        lessonIds: [
          "fundamentals",
          "dbms-architecture",
          "relational-model",
          "keys-constraints",
        ],
      },
      {
        title: "Conceptual modeling",
        lessonIds: ["er-modeling", "eer-design", "er-mapping"],
      },
    ],
  },
  {
    id: "design",
    title: "Relational theory & design",
    description:
      "Reason about relations, dependencies, normalization, and schema quality.",
    tone: "violet",
    subcategories: [
      { title: "Formal query theory", lessonIds: ["relational-algebra"] },
      {
        title: "Dependencies & normalization",
        lessonIds: [
          "functional-dependencies",
          "normalization",
          "normalization-proofs",
        ],
      },
      {
        title: "Applied design",
        lessonIds: ["case-study", "design-case-studies"],
      },
    ],
  },
  {
    id: "sql",
    title: "SQL & database programming",
    description:
      "Move from query basics to advanced SQL and database-side logic.",
    tone: "green",
    subcategories: [
      {
        title: "Query essentials",
        lessonIds: ["sql-basics", "filter-sort", "joins", "grouping"],
      },
      {
        title: "Advanced SQL",
        lessonIds: [
          "subqueries-ctes",
          "set-operations",
          "views",
          "sql-deep-dive",
        ],
      },
      {
        title: "Database-side logic",
        lessonIds: ["procedures-triggers", "database-programming"],
      },
    ],
  },
  {
    id: "performance",
    title: "Storage & performance",
    description:
      "See pages, indexes, query plans, and the cost of physical work.",
    tone: "amber",
    subcategories: [
      { title: "Physical storage", lessonIds: ["physical-storage"] },
      { title: "Indexes", lessonIds: ["indexes", "index-internals"] },
      {
        title: "Query optimization",
        lessonIds: ["query-plans", "query-costs"],
      },
    ],
  },
  {
    id: "reliability",
    title: "Transactions & reliability",
    description:
      "Explore ACID, schedules, concurrency, recovery, and security.",
    tone: "pink",
    subcategories: [
      {
        title: "Transactions & schedules",
        lessonIds: ["transactions-acid", "transaction-schedules"],
      },
      {
        title: "Concurrency control",
        lessonIds: ["concurrency", "concurrency-protocols"],
      },
      {
        title: "Recovery & protection",
        lessonIds: ["backup-recovery", "recovery-internals", "security"],
      },
    ],
  },
  {
    id: "scale",
    title: "Distributed & document data",
    description:
      "Compare replicas, shards, non-relational models, and MongoDB concepts.",
    tone: "teal",
    subcategories: [
      { title: "Scale strategies", lessonIds: ["distributed"] },
      { title: "NoSQL models", lessonIds: ["nosql"] },
      {
        title: "MongoDB concepts",
        lessonIds: ["mongodb-documents", "mongodb-aggregation"],
      },
    ],
  },
];
