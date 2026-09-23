export type Column = {
  name: string;
  type: string;
  primary?: boolean;
  foreign?: string;
  nullable?: boolean;
  description?: string;
};
export type Table = {
  name: string;
  description: string;
  columns: Column[];
  rows: number;
  color: "blue" | "green" | "violet" | "pink" | "amber";
};
export type Database = { name: string; description: string; tables: Table[] };
export type TabKind =
  "home" | "query" | "schema" | "table" | "learn" | "import";
export type WorkspaceTab = {
  id: string;
  kind: TabKind;
  title: string;
  table?: string;
};

const c = (
  name: string,
  type: string,
  extra: Partial<Column> = {},
): Column => ({ name, type, ...extra });
export const databases: Database[] = [
  {
    name: "RetailDB",
    description:
      "An online store with customers, orders, products and payments.",
    tables: [
      {
        name: "customers",
        description: "People who shop at the storefront.",
        rows: 6,
        color: "blue",
        columns: [
          c("customer_id", "INTEGER", { primary: true }),
          c("first_name", "VARCHAR(80)"),
          c("last_name", "VARCHAR(80)"),
          c("email", "VARCHAR(255)"),
          c("country", "VARCHAR(80)"),
          c("created_at", "TIMESTAMP"),
        ],
      },
      {
        name: "orders",
        description: "Customer orders placed through the storefront.",
        rows: 5,
        color: "green",
        columns: [
          c("order_id", "INTEGER", { primary: true }),
          c("customer_id", "INTEGER", { foreign: "customers.customer_id" }),
          c("order_date", "DATE"),
          c("status", "VARCHAR(30)"),
          c("total_amount", "DECIMAL(10,2)", {
            description: "Total order amount including tax and shipping.",
          }),
          c("created_at", "TIMESTAMP"),
        ],
      },
      {
        name: "order_items",
        description: "Products and quantities belonging to each order.",
        rows: 8,
        color: "violet",
        columns: [
          c("order_item_id", "INTEGER", { primary: true }),
          c("order_id", "INTEGER", { foreign: "orders.order_id" }),
          c("product_id", "INTEGER", { foreign: "products.product_id" }),
          c("quantity", "INTEGER"),
          c("unit_price", "DECIMAL(10,2)"),
          c("discount", "DECIMAL(5,2)"),
        ],
      },
      {
        name: "products",
        description: "The product catalog.",
        rows: 6,
        color: "violet",
        columns: [
          c("product_id", "INTEGER", { primary: true }),
          c("name", "VARCHAR(120)"),
          c("category_id", "INTEGER", { foreign: "categories.category_id" }),
          c("price", "DECIMAL(10,2)"),
          c("stock_quantity", "INTEGER"),
          c("created_at", "TIMESTAMP"),
        ],
      },
      {
        name: "categories",
        description: "Groups used to organize products.",
        rows: 3,
        color: "amber",
        columns: [
          c("category_id", "INTEGER", { primary: true }),
          c("name", "VARCHAR(80)"),
          c("description", "TEXT"),
          c("parent_id", "INTEGER", {
            nullable: true,
            foreign: "categories.category_id",
          }),
        ],
      },
      {
        name: "payments",
        description: "Payments made against orders.",
        rows: 4,
        color: "pink",
        columns: [
          c("payment_id", "INTEGER", { primary: true }),
          c("order_id", "INTEGER", { foreign: "orders.order_id" }),
          c("payment_method", "VARCHAR(30)"),
          c("amount", "DECIMAL(10,2)"),
          c("paid_at", "TIMESTAMP"),
          c("status", "VARCHAR(30)"),
        ],
      },
      {
        name: "addresses",
        description: "Customer shipping and billing addresses.",
        rows: 0,
        color: "blue",
        columns: [
          c("address_id", "INTEGER", { primary: true }),
          c("customer_id", "INTEGER", { foreign: "customers.customer_id" }),
          c("line1", "VARCHAR(160)"),
          c("city", "VARCHAR(80)"),
          c("country", "VARCHAR(80)"),
          c("postal_code", "VARCHAR(20)"),
        ],
      },
      {
        name: "users",
        description: "Store administrators and staff.",
        rows: 0,
        color: "blue",
        columns: [
          c("user_id", "INTEGER", { primary: true }),
          c("first_name", "VARCHAR(80)"),
          c("last_name", "VARCHAR(80)"),
          c("email", "VARCHAR(255)"),
          c("is_active", "BOOLEAN"),
          c("created_at", "TIMESTAMP"),
        ],
      },
      {
        name: "roles",
        description: "Named access levels for staff.",
        rows: 0,
        color: "pink",
        columns: [
          c("role_id", "INTEGER", { primary: true }),
          c("name", "VARCHAR(80)"),
          c("description", "TEXT"),
        ],
      },
      {
        name: "permissions",
        description: "Actions allowed in the storefront.",
        rows: 0,
        color: "pink",
        columns: [
          c("permission_id", "INTEGER", { primary: true }),
          c("name", "VARCHAR(80)"),
          c("resource", "VARCHAR(80)"),
          c("action", "VARCHAR(40)"),
        ],
      },
    ],
  },
  {
    name: "UniversityDB",
    description: "Students, courses, enrollments and faculty.",
    tables: [
      {
        name: "students",
        description: "University student records.",
        rows: 0,
        color: "blue",
        columns: [
          c("student_id", "INTEGER", { primary: true }),
          c("full_name", "VARCHAR(160)"),
          c("email", "VARCHAR(255)"),
          c("major", "VARCHAR(80)"),
          c("enrolled_at", "DATE"),
        ],
      },
      {
        name: "courses",
        description: "Catalog of courses.",
        rows: 0,
        color: "green",
        columns: [
          c("course_id", "INTEGER", { primary: true }),
          c("code", "VARCHAR(20)"),
          c("title", "VARCHAR(160)"),
          c("credits", "INTEGER"),
        ],
      },
      {
        name: "enrollments",
        description: "Student course registrations.",
        rows: 0,
        color: "violet",
        columns: [
          c("enrollment_id", "INTEGER", { primary: true }),
          c("student_id", "INTEGER", { foreign: "students.student_id" }),
          c("course_id", "INTEGER", { foreign: "courses.course_id" }),
          c("grade", "VARCHAR(2)", { nullable: true }),
        ],
      },
      {
        name: "faculty",
        description: "Teaching staff.",
        rows: 0,
        color: "amber",
        columns: [
          c("faculty_id", "INTEGER", { primary: true }),
          c("full_name", "VARCHAR(160)"),
          c("department", "VARCHAR(80)"),
        ],
      },
    ],
  },
  {
    name: "LibraryDB",
    description: "A library lending catalog.",
    tables: [
      {
        name: "books",
        description: "Library books.",
        rows: 0,
        color: "blue",
        columns: [
          c("book_id", "INTEGER", { primary: true }),
          c("title", "VARCHAR(200)"),
          c("isbn", "VARCHAR(20)"),
          c("published_year", "INTEGER"),
        ],
      },
      {
        name: "members",
        description: "Registered borrowers.",
        rows: 0,
        color: "green",
        columns: [
          c("member_id", "INTEGER", { primary: true }),
          c("full_name", "VARCHAR(160)"),
          c("email", "VARCHAR(255)"),
        ],
      },
      {
        name: "loans",
        description: "Book lending history.",
        rows: 0,
        color: "violet",
        columns: [
          c("loan_id", "INTEGER", { primary: true }),
          c("book_id", "INTEGER", { foreign: "books.book_id" }),
          c("member_id", "INTEGER", { foreign: "members.member_id" }),
          c("borrowed_at", "DATE"),
          c("returned_at", "DATE", { nullable: true }),
        ],
      },
    ],
  },
  {
    name: "BankingDB",
    description: "Accounts, customers and transactions.",
    tables: [
      {
        name: "account_holders",
        description: "Banking customers.",
        rows: 0,
        color: "blue",
        columns: [
          c("holder_id", "INTEGER", { primary: true }),
          c("full_name", "VARCHAR(160)"),
          c("email", "VARCHAR(255)"),
        ],
      },
      {
        name: "accounts",
        description: "Customer bank accounts.",
        rows: 0,
        color: "green",
        columns: [
          c("account_id", "INTEGER", { primary: true }),
          c("holder_id", "INTEGER", { foreign: "account_holders.holder_id" }),
          c("account_type", "VARCHAR(30)"),
          c("balance", "DECIMAL(14,2)"),
        ],
      },
      {
        name: "transactions",
        description: "Account ledger entries.",
        rows: 0,
        color: "violet",
        columns: [
          c("transaction_id", "INTEGER", { primary: true }),
          c("account_id", "INTEGER", { foreign: "accounts.account_id" }),
          c("amount", "DECIMAL(14,2)"),
          c("posted_at", "TIMESTAMP"),
        ],
      },
    ],
  },
];

export const sampleRows = [
  {
    order_id: "10045",
    customer_id: "3",
    order_date: "2024-03-01",
    status: "Delivered",
    total_amount: "$1,248.50",
    payment_method: "Credit Card",
    items_count: "5",
  },
  {
    order_id: "10044",
    customer_id: "7",
    order_date: "2024-02-28",
    status: "Shipped",
    total_amount: "$982.30",
    payment_method: "PayPal",
    items_count: "3",
  },
  {
    order_id: "10043",
    customer_id: "12",
    order_date: "2024-02-27",
    status: "Processing",
    total_amount: "$456.00",
    payment_method: "Credit Card",
    items_count: "2",
  },
  {
    order_id: "10042",
    customer_id: "5",
    order_date: "2024-02-26",
    status: "Delivered",
    total_amount: "$2,134.99",
    payment_method: "Bank Transfer",
    items_count: "7",
  },
  {
    order_id: "10041",
    customer_id: "9",
    order_date: "2024-02-24",
    status: "Shipped",
    total_amount: "$743.10",
    payment_method: "Credit Card",
    items_count: "4",
  },
  {
    order_id: "10040",
    customer_id: "3",
    order_date: "2024-02-22",
    status: "Cancelled",
    total_amount: "$129.99",
    payment_method: "PayPal",
    items_count: "1",
  },
];

export const sampleSql = `SELECT o.order_id, o.customer_id, o.order_date,\n       o.status, o.total_amount,\n       COUNT(oi.order_item_id) AS items_count\nFROM orders o\nLEFT JOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.order_date >= '2024-01-01'\nGROUP BY o.order_id\nORDER BY o.order_date DESC\nLIMIT 50;`;
