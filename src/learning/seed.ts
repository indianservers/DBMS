export const seedSql = `
CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT UNIQUE, country TEXT NOT NULL);
CREATE TABLE categories (category_id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE products (product_id INTEGER PRIMARY KEY, name TEXT NOT NULL, category_id INTEGER REFERENCES categories(category_id), price REAL NOT NULL, stock_quantity INTEGER NOT NULL);
CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(customer_id), order_date TEXT NOT NULL, status TEXT NOT NULL, total_amount REAL NOT NULL);
CREATE TABLE order_items (order_item_id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(order_id), product_id INTEGER NOT NULL REFERENCES products(product_id), quantity INTEGER NOT NULL, unit_price REAL NOT NULL);
CREATE TABLE payments (payment_id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(order_id), payment_method TEXT NOT NULL, amount REAL NOT NULL);
INSERT INTO customers VALUES
(1,'Emily','Carter','emily@example.com','USA'),
(2,'James','Wilson','james@example.com','Canada'),
(3,'Sophia','Lee','sophia@example.com','UK'),
(4,'Daniel','Kim','daniel@example.com','USA'),
(5,'Olivia','Brown','olivia@example.com','Australia'),
(6,'Aarav','Patel','aarav@example.com','India');
INSERT INTO categories VALUES (1,'Electronics'),(2,'Stationery'),(3,'Home');
INSERT INTO products VALUES
(1,'Wireless Mouse',1,29.99,42),
(2,'Notebook',2,8.50,120),
(3,'Desk Lamp',3,54.00,18),
(4,'Mechanical Keyboard',1,89.00,25),
(5,'Pen Set',2,12.00,80),
(6,'Monitor Stand',3,64.50,15);
INSERT INTO orders VALUES
(101,1,'2024-03-01','Delivered',124.50),
(102,2,'2024-03-02','Shipped',89.00),
(103,1,'2024-03-03','Processing',54.00),
(104,3,'2024-03-04','Delivered',42.49),
(105,4,'2024-03-05','Cancelled',29.99);
INSERT INTO order_items VALUES
(1,101,1,1,29.99),(2,101,4,1,89.00),(3,101,2,1,8.50),
(4,102,4,1,89.00),(5,103,3,1,54.00),(6,104,1,1,29.99),
(7,104,5,1,12.00),(8,105,1,1,29.99);
INSERT INTO payments VALUES
(1,101,'Credit Card',124.50),(2,102,'PayPal',89.00),(3,103,'Credit Card',54.00),(4,104,'Bank Transfer',42.49);
`;

export const databaseGuide = [
  {
    table: "customers",
    columns: "customer_id, first_name, last_name, email, country",
  },
  {
    table: "products",
    columns: "product_id, name, category_id, price, stock_quantity",
  },
  {
    table: "orders",
    columns: "order_id, customer_id, order_date, status, total_amount",
  },
  {
    table: "order_items",
    columns: "order_item_id, order_id, product_id, quantity, unit_price",
  },
  { table: "categories", columns: "category_id, name" },
  {
    table: "payments",
    columns: "payment_id, order_id, payment_method, amount",
  },
];
