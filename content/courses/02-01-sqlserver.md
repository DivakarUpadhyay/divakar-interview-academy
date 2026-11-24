---
slug: sqlserver
title: SQL Server & T-SQL
track: data
order: 1
group: SQL Server
icon: SQL
color: #c92a2a
summary: Database design and normalisation, data types, constraints, joins, subqueries, CTEs, window functions, stored procedures, functions, views, triggers, indexes, execution plans, transactions, isolation levels, locking, error handling and performance tuning.
---

# Overview

**Microsoft SQL Server** is a relational database management system (RDBMS). T-SQL (Transact-SQL) is Microsoft's extension of ANSI SQL with variables, control flow, error handling, stored procedures and more.

The SQL Server family:

| Component | Purpose |
|---|---|
| Database Engine | Stores and queries data (OLTP) |
| SSIS (Integration Services) | ETL: see the SSIS course |
| SSRS (Reporting Services) / Power BI Report Server | Paginated reports |
| SSAS (Analysis Services) | OLAP cubes, tabular models |
| SQL Server Agent | Job scheduling |
| Azure SQL Database / Managed Instance | PaaS versions in Azure |

Editions: Enterprise, Standard, Developer (free, full features, non-production), Express (free, limited), and Azure SQL.

SQL statement categories:

| Category | Statements |
|---|---|
| DDL (Definition) | `CREATE`, `ALTER`, `DROP`, `TRUNCATE` |
| DML (Manipulation) | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MERGE` |
| DCL (Control) | `GRANT`, `REVOKE`, `DENY` |
| TCL (Transaction) | `BEGIN TRAN`, `COMMIT`, `ROLLBACK`, `SAVE TRAN` |

# Versions

| Version | Year | Highlights |
|---|---|---|
| SQL Server 2005 | 2005 | CTEs, `ROW_NUMBER`/ranking functions, `TRY...CATCH`, SSIS replaces DTS, CLR integration |
| 2008 / 2008 R2 | 2008/2010 | `MERGE`, `DATE`/`TIME` types, table-valued parameters, filtered indexes |
| 2012 | 2012 | `OFFSET/FETCH`, `LAG`/`LEAD`, window frames, `SEQUENCE`, `THROW`, `TRY_CONVERT`, `IIF`, Always On Availability Groups, columnstore (read-only) |
| 2014 | 2014 | In-Memory OLTP (Hekaton), updatable clustered columnstore |
| 2016 | 2016 | **Query Store**, temporal tables, JSON functions, Row-Level Security, Dynamic Data Masking, Always Encrypted, `STRING_SPLIT` |
| 2017 | 2017 | **Linux support**, `STRING_AGG`, `TRIM`, `CONCAT_WS`, graph tables, adaptive query processing |
| 2019 | 2019 | Intelligent Query Processing (scalar UDF inlining, table variable deferred compilation), Accelerated Database Recovery, UTF-8 |
| 2022 | 2022 | Azure Synapse Link, ledger tables, `GREATEST`/`LEAST`, `DATE_BUCKET`, `GENERATE_SERIES`, `IS [NOT] DISTINCT FROM`, parameter-sensitive plan optimisation |
| 2025 | 2025 | AI-ready: native **vector** data type and vector search, native **JSON** type, regular expression functions (`REGEXP_LIKE` etc.), optimized locking, Fabric mirroring |

# Lifecycle

**How SQL Server executes a query:**

1. **Parse**: syntax check, build a parse tree.
2. **Bind (algebrize)**: resolve names, types, permissions.
3. **Optimise**: the cost-based query optimizer uses statistics to choose an execution plan (join types, index seeks vs scans, parallelism).
4. **Plan cache**: plan stored for reuse (parameterised queries reuse plans).
5. **Execute**: the storage engine reads pages from the buffer pool (memory) or disk, acquiring locks/latches.
6. **Return** results to the client.

**Logical query processing order** (not the written order):

`FROM` → `ON` → `JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `TOP`/`OFFSET-FETCH`

That's why you can't use a `SELECT` alias in `WHERE`, but you can in `ORDER BY`.

**Transaction lifecycle:** `BEGIN TRAN` → statements write to the transaction log first (write-ahead logging) → `COMMIT` (durable once the log is hardened) or `ROLLBACK` (undo using the log). Checkpoints write dirty pages to data files; recovery replays/undoes the log after a crash.

**Database development lifecycle:** requirements → conceptual model (ER diagram) → logical design (normalisation) → physical design (types, indexes, partitions) → implementation (DDL scripts/migrations) → testing → deployment (DACPAC/scripts) → monitoring and tuning → maintenance (backups, index/statistics maintenance).

# Tools

| Tool | Use |
|---|---|
| SQL Server Management Studio (SSMS 21) | Main admin/dev IDE: queries, execution plans, Agent, backups |
| VS Code + MSSQL extension | Cross-platform editor (Azure Data Studio retired Feb 2026) |
| SQL Server Data Tools (SSDT) / SQL database projects | Schema as code, DACPAC deployments |
| `sqlcmd`, `bcp` | Command-line scripts and bulk copy |
| SQL Server Profiler / **Extended Events** | Tracing (Profiler is deprecated; prefer XEvents) |
| **Query Store** | Plan history, regressed queries, forcing plans |
| Database Engine Tuning Advisor | Index suggestions |
| SQL Server Agent | Scheduled jobs |
| sp_WhoIsActive, sp_Blitz (First Responder Kit) | Free community diagnostic scripts |
| Redgate SQL Prompt / SQL Compare, dbForge | Productivity and schema compare |
| Flyway, DbUp, EF migrations | Database migrations |

# Module: Database Design

## Lesson: [Basic|High] Keys, constraints and data types

```sql
CREATE TABLE dbo.Departments (
    DeptId    INT IDENTITY(1,1) CONSTRAINT PK_Departments PRIMARY KEY,
    DeptName  NVARCHAR(100) NOT NULL CONSTRAINT UQ_Departments_Name UNIQUE
);

CREATE TABLE dbo.Employees (
    EmpId      INT IDENTITY(1,1) PRIMARY KEY,             -- clustered by default
    FullName   NVARCHAR(150) NOT NULL,
    Email      VARCHAR(200) NOT NULL UNIQUE,
    DeptId     INT NULL REFERENCES dbo.Departments(DeptId),  -- foreign key
    ManagerId  INT NULL REFERENCES dbo.Employees(EmpId),     -- self-reference
    Salary     DECIMAL(12,2) NOT NULL CHECK (Salary > 0),
    HireDate   DATE NOT NULL DEFAULT (CAST(GETDATE() AS DATE)),
    IsActive   BIT NOT NULL DEFAULT 1,
    RowVer     ROWVERSION
);
```

| Key/constraint | Meaning |
|---|---|
| Primary key | Unique + NOT NULL; one per table; clustered index by default |
| Candidate key | Any column set that could be the PK |
| Alternate key | Candidate key not chosen as PK (enforce with UNIQUE) |
| Composite key | PK of several columns |
| Surrogate key | System-generated (IDENTITY, SEQUENCE, GUID) |
| Natural key | Business value (PAN, email) |
| Foreign key | References a PK/unique key; enforces referential integrity |
| UNIQUE | No duplicates (allows **one** NULL in SQL Server) |
| CHECK / DEFAULT / NOT NULL | Domain rules |

Types: `INT/BIGINT`, `DECIMAL(p,s)` for money (avoid `FLOAT`), `VARCHAR` (1 byte/char, non-Unicode) vs `NVARCHAR` (Unicode), `DATE`, `DATETIME2` (prefer over `DATETIME`), `DATETIMEOFFSET`, `BIT`, `UNIQUEIDENTIFIER`, `VARBINARY(MAX)`.

### How it works

Constraints are rules the database itself enforces, no matter which app, script or person writes the data. A primary key builds a unique index, so SQL Server can find a row by its key instantly and refuse duplicates (error [2627](/errors/sql-server-violation-of-primary-key-constraint-2627)). A foreign key checks every insert and update against the parent table, so an order can't point to a customer that doesn't exist (error [547](/errors/sql-server-insert-statement-conflicted-with-foreign-key-547)). CHECK and NOT NULL stop bad values at the door, which is much cheaper than cleaning them up later.

Data types matter for more than correctness. A smaller type means more rows per 8 KB page, so fewer reads. And comparing columns and parameters of different types forces a conversion that can stop an index from being used.

### Common mistakes

- `FLOAT` for money. It stores binary fractions, so `0.1 + 0.2` isn't exactly `0.3`. Use `DECIMAL(19,4)` or similar.
- `NVARCHAR(MAX)` for every text column "to be safe". Big types can't be index keys and cost memory in query plans. Size columns for real data (and expect [truncation errors](/errors/sql-server-string-or-binary-data-would-be-truncated) when the data is longer).
- A random `UNIQUEIDENTIFIER` (`NEWID()`) as the clustered key. Inserts land on random pages, causing page splits and fragmentation. Use `INT`/`BIGINT IDENTITY` or `NEWSEQUENTIALID()`.
- Skipping foreign keys "for speed". Orphan rows appear within months, and reports quietly stop adding up.

### Real-world example

An HR system started without a unique constraint on `Email`. A double-click on "Save" created two employee rows, and payroll paid one person twice. Adding `UNIQUE (Email)` after cleaning up the duplicates made the second insert fail with a clear error that the app turned into "This email is already registered".

### Try it yourself

1. Create `Departments` and `Employees` as above, then try to insert an employee with a `DeptId` that doesn't exist and read the error.
2. Insert two rows with the same email and see the unique constraint stop the second.
3. Compare `SELECT 0.1E0 + 0.2E0` (float) with `SELECT CAST(0.1 AS DECIMAL(10,2)) + 0.2`.

## Lesson: [Basic|High] Normalisation (1NF → BCNF) and denormalisation

| Form | Rule | Fix example |
|---|---|---|
| **1NF** | Atomic values, no repeating groups | `Phones = '98..,99..'` → separate `CustomerPhones` rows |
| **2NF** | 1NF + no **partial** dependency on part of a composite key | `OrderItems(OrderId, ProductId, ProductName)` → move `ProductName` to `Products` |
| **3NF** | 2NF + no **transitive** dependency (non-key → non-key) | `Employees(DeptId, DeptName)` → move `DeptName` to `Departments` |
| **BCNF** | Every determinant is a candidate key | Stricter 3NF for overlapping candidate keys |
| 4NF / 5NF | No multi-valued / join dependencies | Rare in interviews |

**Denormalisation**: deliberately adding redundancy (e.g. storing `OrderTotal`, reporting tables, star schemas) to speed reads at the cost of update complexity. OLTP systems: normalise to 3NF. Data warehouses: denormalised star schemas (facts + dimensions).

### How it works

Normalisation means storing each fact in exactly one place. If a department's name lives only in `Departments`, renaming it is one `UPDATE` and every report sees the new name. If it is copied into every employee row, a rename has to touch thousands of rows, and one missed row gives you two spellings of the same department. The normal forms are just a checklist for finding those copies: repeating lists (1NF), facts that depend on only part of a key (2NF) and facts that depend on another non-key column (3NF).

Denormalisation is the opposite trade: you copy data on purpose so that reads need fewer joins, and accept that writes must keep the copies in sync.

### Common mistakes

- Comma-separated lists in a column (`Tags = 'sql,dotnet,azure'`). You can't index, join or validate the values. Use a child table.
- Over-normalising: splitting every attribute into its own table so simple screens need eight joins.
- Copying a value that can change (a customer's address) into orders without deciding whether you want the *current* value or the value *at the time of the order*.
- Denormalising before measuring. Most join performance problems are missing indexes, not too many tables.

### Real-world example

An invoice stores `UnitPrice` and the customer's billing address at the moment of sale, even though `Products` and `Customers` also hold them. That is deliberate denormalisation: if the price changes next month, last month's invoices must still show what the customer actually paid. Meanwhile the product name, category and stock live only in their own tables.

### Try it yourself

1. Take a spreadsheet-style table `Orders(OrderId, CustomerName, CustomerPhone, Product1, Product2, Product3)` and normalise it to 3NF.
2. Name one column in your current project that is stored in two places, and decide if that is intentional.
3. Design a reporting table for monthly sales per product and explain how you'd keep it up to date.

## Lesson: [Basic|Medium] DDL vs DML; DELETE vs TRUNCATE vs DROP

| | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| Type | DML | DDL | DDL |
| Removes | Rows (with optional WHERE) | All rows | The whole table (structure + data) |
| Logging | Each row logged | Page deallocations logged (minimal) | Metadata |
| Triggers | Fires DELETE triggers | No | No |
| Identity | Not reset | Reset to seed | Gone |
| Rollback | Yes (in a transaction) | Yes, inside a transaction in SQL Server | Yes, inside a transaction |
| FK-referenced table | Allowed | **Not allowed** | Not allowed |
| Speed | Slower | Fast | Fast |

### How it works

`DELETE` removes rows one by one and writes each row to the transaction log, which is why it can fire triggers, respect a `WHERE` clause and be rolled back row-perfectly. On a big table that means a big log and many locks; SQL Server may escalate to a table lock and block everyone else. `TRUNCATE` doesn't touch rows at all: it deallocates the data pages and logs only that, so it is near-instant on any size. `DROP` removes the table definition itself, along with its indexes, constraints and permissions.

### Common mistakes

- Running `DELETE FROM Orders` without a `WHERE`. Always write the `WHERE` first, or run it as a `SELECT` before turning it into a `DELETE`.
- Deleting 50 million rows in one statement. The log grows by gigabytes and the table is locked for the whole time. Delete in batches.
- Using `TRUNCATE` on a table where the app depends on IDs continuing. It resets `IDENTITY` to the seed.
- Thinking `TRUNCATE` can't be rolled back. In SQL Server it can, if it runs inside an explicit transaction.

### Real-world example

A logging table had grown to 400 million rows. The nightly cleanup `DELETE FROM AppLog WHERE LoggedAt < DATEADD(DAY, -90, SYSUTCDATETIME())` ran for hours and filled the log disk. Rewriting it to delete in batches of 5,000 in a loop kept the log small and avoided lock escalation. Later the table was partitioned by month, so removing an old month became an instant metadata operation.

```sql
WHILE 1 = 1
BEGIN
    DELETE TOP (5000) FROM dbo.AppLog WHERE LoggedAt < DATEADD(DAY, -90, SYSUTCDATETIME());
    IF @@ROWCOUNT = 0 BREAK;
END;
```

### Try it yourself

1. Insert 10 rows into a table with `IDENTITY`, `DELETE` them, insert one more and check its id. Repeat with `TRUNCATE`.
2. Run `BEGIN TRAN; TRUNCATE TABLE t; ROLLBACK;` and check the rows are back.
3. Try to `TRUNCATE` a table referenced by a foreign key and read the error.

# Module: Querying

## Lesson: [Basic|High] SELECT, WHERE, ORDER BY, TOP, OFFSET-FETCH

```sql
SELECT TOP (10) e.EmpId, e.FullName, e.Salary
FROM dbo.Employees AS e
WHERE e.IsActive = 1
  AND e.HireDate >= '2024-01-01'
  AND e.FullName LIKE N'A%'
  AND e.DeptId IN (1, 2, 3)
  AND e.Salary BETWEEN 50000 AND 150000
ORDER BY e.Salary DESC;

-- Paging (SQL Server 2012+)
SELECT EmpId, FullName FROM dbo.Employees
ORDER BY EmpId
OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;

-- NULL handling
SELECT FullName, ISNULL(ManagerId, 0) AS Mgr, COALESCE(Email, 'n/a') AS Email
FROM dbo.Employees WHERE ManagerId IS NULL;    -- never "= NULL"
```

`ISNULL` (2 args, T-SQL, returns type of first arg) vs `COALESCE` (ANSI, any number of args, returns highest-precedence type).

### How it works

SQL is written `SELECT ... FROM ... WHERE ... ORDER BY`, but SQL Server processes it in a different logical order: **FROM** and joins, then **WHERE**, **GROUP BY**, **HAVING**, **SELECT**, **DISTINCT**, **ORDER BY**, and finally **TOP / OFFSET**. That order explains several rules that look strange at first: you can't use a `SELECT` alias in `WHERE` (it doesn't exist yet), but you can in `ORDER BY` (it does by then).

Without `ORDER BY`, SQL Server returns rows in whatever order is cheapest. It often looks sorted by the primary key, until a parallel plan or a new index changes it.

### Common mistakes

- `TOP (10)` without `ORDER BY`. You get *some* 10 rows, not the first 10 of anything.
- `WHERE Col = NULL`. It is never true; use `IS NULL`.
- `SELECT *` in application code. It reads columns you don't need, breaks covering indexes and changes shape when someone adds a column.
- Paging with `OFFSET` on a non-unique sort column, so rows repeat or go missing between pages. Add the key as a tie-breaker.

### Real-world example

A "latest 20 orders" widget used `SELECT TOP (20) * FROM Orders` and looked fine in testing. In production, after a new index was added, it started showing random old orders. Changing it to `SELECT TOP (20) OrderId, CustomerId, Total, CreatedAt ... ORDER BY CreatedAt DESC, OrderId DESC` fixed it for good.

### Try it yourself

1. Write a query that pages through active employees 10 at a time, sorted by name, with a tie-breaker.
2. Try using a `SELECT` alias in `WHERE`, read the error, then rewrite it with a CTE.
3. Find all employees with no manager, using `IS NULL`.

## Lesson: [Basic|High] Joins

```sql
-- INNER: matching rows only
SELECT e.FullName, d.DeptName FROM Employees e INNER JOIN Departments d ON d.DeptId = e.DeptId;

-- LEFT: all employees, department if any
SELECT e.FullName, d.DeptName FROM Employees e LEFT JOIN Departments d ON d.DeptId = e.DeptId;

-- Anti-join: departments with no employees
SELECT d.DeptName FROM Departments d LEFT JOIN Employees e ON e.DeptId = d.DeptId WHERE e.EmpId IS NULL;

-- FULL OUTER: everything from both sides
SELECT * FROM A FULL OUTER JOIN B ON A.Id = B.Id;

-- SELF JOIN: employee and manager
SELECT e.FullName AS Employee, m.FullName AS Manager
FROM Employees e LEFT JOIN Employees m ON m.EmpId = e.ManagerId;

-- CROSS JOIN: every combination
SELECT s.Size, c.Color FROM Sizes s CROSS JOIN Colors c;

-- CROSS APPLY / OUTER APPLY: run a correlated table expression per row (top 3 orders per customer)
SELECT c.Name, o.OrderId, o.Total
FROM Customers c
CROSS APPLY (SELECT TOP (3) OrderId, Total FROM Orders WHERE CustomerId = c.CustomerId ORDER BY Total DESC) o;
```

Physical join algorithms the optimizer picks: **Nested Loops** (small outer input + indexed inner), Merge Join (both inputs sorted on the key), Hash Match (large unsorted inputs).

### How it works

A join combines rows from two tables where the `ON` condition is true. `INNER JOIN` keeps only matches. `LEFT JOIN` keeps every row from the left table and fills the right side with `NULL` where nothing matched. The optimizer then decides *how* to do it: nested loops for small inputs with an index on the inner side, merge join when both sides are already sorted, hash join for large unsorted inputs. You choose the meaning; SQL Server chooses the algorithm.

A join multiplies rows. If one customer has 3 orders and 4 addresses, joining all three tables gives 12 rows for that customer.

### Common mistakes

- Putting a condition on the right table of a `LEFT JOIN` in `WHERE`: `WHERE o.Status = 'Open'` removes the NULL rows and silently turns it into an inner join. Put it in the `ON` clause instead.
- Summing after joining two child tables, so totals come out multiplied (the "fan-out" bug). Aggregate each child in a subquery first.
- Joining on columns of different types (`INT` to `VARCHAR`), which forces conversions and kills index use.
- Missing an index on the foreign key column, so every join scans the child table.

### Real-world example

A sales report showed revenue three times higher than the finance system. It joined `Orders` to `OrderLines` *and* to `Payments`, then summed `OrderLines.Amount`. Orders paid in three instalments counted every line three times. Aggregating lines and payments separately per order, then joining the two results, matched finance exactly.

### Try it yourself

1. List all departments with their employee count, including departments with zero employees.
2. Reproduce the fan-out bug with three small tables, then fix it.
3. Use `CROSS APPLY` to return the two most recent orders for each customer.

## Lesson: [Basic|High] GROUP BY, HAVING and aggregates

```sql
SELECT d.DeptName,
       COUNT(*)          AS Headcount,
       AVG(e.Salary)     AS AvgSalary,
       MAX(e.Salary)     AS MaxSalary,
       SUM(e.Salary)     AS Payroll
FROM Employees e
JOIN Departments d ON d.DeptId = e.DeptId
WHERE e.IsActive = 1            -- filters rows BEFORE grouping
GROUP BY d.DeptName
HAVING COUNT(*) >= 3            -- filters groups AFTER grouping
ORDER BY Payroll DESC;

-- ROLLUP / CUBE / GROUPING SETS for subtotals
SELECT Region, Product, SUM(Amount) FROM Sales GROUP BY ROLLUP (Region, Product);

-- STRING_AGG (2017+)
SELECT DeptId, STRING_AGG(FullName, ', ') WITHIN GROUP (ORDER BY FullName) AS People FROM Employees GROUP BY DeptId;
```

`COUNT(*)` counts rows; `COUNT(col)` ignores NULLs; `COUNT(DISTINCT col)` counts unique non-null values.

### How it works

`GROUP BY` collapses rows that share the same values into one row per group, and aggregates (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) compute one value per group. `WHERE` runs before grouping and decides which rows go in; `HAVING` runs after and decides which groups come out. Every column in `SELECT` must either be in `GROUP BY` or inside an aggregate, because otherwise SQL Server wouldn't know which row's value to show.

Aggregates skip `NULL`s, except `COUNT(*)`, which counts rows. `AVG` of `(10, NULL, 20)` is 15, not 10.

### Common mistakes

- Filtering rows in `HAVING` instead of `WHERE` (`HAVING Status = 'Open'`). It works but groups everything first, which is slower and less clear.
- `COUNT(*)` after a `LEFT JOIN`, which counts 1 for parents with no children. Use `COUNT(child.Id)`.
- `AVG` on an `INT` column, which does integer math in some expressions. Cast to `DECIMAL` when you need fractions.
- Grouping by a formatted string (`FORMAT(OrderDate, 'yyyy-MM')`), which is slow on big tables. Group by `YEAR(OrderDate), MONTH(OrderDate)` or a date column.

### Real-world example

A monthly dashboard shows revenue, order count and average order value per region, with `HAVING SUM(Total) > 0` to hide empty regions. Using `GROUP BY ROLLUP (Region, Month)` adds subtotal and grand-total rows in the same query, so the report needs one round trip instead of three.

### Try it yourself

1. Show each department's headcount and average salary, only for departments with at least 3 people.
2. Count customers who have placed no orders, using `LEFT JOIN` and the right `COUNT`.
3. Use `STRING_AGG` to list each department's employee names in one row.

## Lesson: [Intermediate|High] Subqueries, EXISTS, CTEs and recursive CTEs

```sql
-- Scalar subquery
SELECT FullName, Salary FROM Employees WHERE Salary > (SELECT AVG(Salary) FROM Employees);

-- Correlated subquery: earn more than their department average
SELECT e.FullName FROM Employees e
WHERE e.Salary > (SELECT AVG(x.Salary) FROM Employees x WHERE x.DeptId = e.DeptId);

-- EXISTS / NOT EXISTS (NULL-safe, stops at first match)
SELECT c.Name FROM Customers c WHERE NOT EXISTS (SELECT 1 FROM Orders o WHERE o.CustomerId = c.CustomerId);

-- CTE
WITH DeptPay AS (
    SELECT DeptId, SUM(Salary) AS Payroll FROM Employees GROUP BY DeptId
)
SELECT d.DeptName, p.Payroll FROM DeptPay p JOIN Departments d ON d.DeptId = p.DeptId;

-- Recursive CTE: org hierarchy
WITH Org AS (
    SELECT EmpId, FullName, ManagerId, 0 AS Lvl FROM Employees WHERE ManagerId IS NULL     -- anchor
    UNION ALL
    SELECT e.EmpId, e.FullName, e.ManagerId, o.Lvl + 1                                     -- recursive member
    FROM Employees e JOIN Org o ON e.ManagerId = o.EmpId
)
SELECT * FROM Org ORDER BY Lvl
OPTION (MAXRECURSION 100);     -- default limit is 100; 0 = unlimited
```

`NOT IN` with a subquery that returns any NULL returns **no rows**: prefer `NOT EXISTS`.

### How it works

A subquery is a query inside another query. A *correlated* subquery refers to the outer row, so logically it runs once per outer row, although the optimizer often rewrites it as a join. `EXISTS` only asks "is there at least one row?", so it can stop at the first match and it treats `NULL`s safely.

A CTE (`WITH name AS (...)`) is a named subquery that makes long queries readable. It is **not** a temporary table: SQL Server inlines it, and if you reference it twice it is usually evaluated twice. A recursive CTE has an anchor query and a recursive part that joins back to the CTE until no new rows come out, which is how you walk trees like org charts and category hierarchies.

### Common mistakes

- `NOT IN (SELECT ManagerId FROM Employees)` when that column contains a `NULL`. The result is empty. Use `NOT EXISTS`.
- Expecting a CTE referenced several times to run once. If it is expensive, put the result in a `#temp` table.
- A recursive CTE over data with a cycle (A manages B, B manages A), which runs until `MAXRECURSION` stops it with an error. Track the path or the level.
- Writing a correlated subquery in `SELECT` for every column you need, instead of one join.

### Real-world example

A product catalogue stores categories as `CategoryId, ParentId`. The "breadcrumb" for a product page (Electronics > Computers > Laptops) and the "all products in Computers, including subcategories" query are both recursive CTEs. With an index on `ParentId` they run in milliseconds for a tree of a few thousand categories.

### Try it yourself

1. Find customers who have never ordered, once with `NOT IN` and once with `NOT EXISTS`. Then insert an order with a `NULL` `CustomerId` and compare again.
2. Write a recursive CTE that prints each employee with their full management chain as text.
3. Rewrite a nested subquery from your own work as a CTE and check that the plan is the same.

## Lesson: [Intermediate|High] Window functions

```sql
SELECT FullName, DeptId, Salary,
    ROW_NUMBER() OVER (PARTITION BY DeptId ORDER BY Salary DESC)  AS RowNum,     -- 1,2,3,4
    RANK()       OVER (PARTITION BY DeptId ORDER BY Salary DESC)  AS Rnk,        -- 1,2,2,4
    DENSE_RANK() OVER (PARTITION BY DeptId ORDER BY Salary DESC)  AS DenseRnk,   -- 1,2,2,3
    NTILE(4)     OVER (ORDER BY Salary)                            AS Quartile,
    SUM(Salary)  OVER (PARTITION BY DeptId)                        AS DeptPayroll,
    Salary * 100.0 / SUM(Salary) OVER (PARTITION BY DeptId)        AS PctOfDept,
    LAG(Salary)  OVER (ORDER BY HireDate)                          AS PrevSalary,
    LEAD(Salary) OVER (ORDER BY HireDate)                          AS NextSalary,
    SUM(Salary)  OVER (ORDER BY HireDate ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS RunningTotal,
    AVG(Salary)  OVER (ORDER BY HireDate ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)         AS MovingAvg3,
    FIRST_VALUE(FullName) OVER (PARTITION BY DeptId ORDER BY Salary DESC)                  AS TopEarner
FROM Employees;
```

Window functions keep every row (unlike `GROUP BY`). They are evaluated in the `SELECT` phase, so filter on them with a CTE/subquery:

```sql
WITH r AS (SELECT *, DENSE_RANK() OVER (PARTITION BY DeptId ORDER BY Salary DESC) AS dr FROM Employees)
SELECT * FROM r WHERE dr = 1;     -- top earner(s) per department
```

### How it works

A window function calculates a value across a set of rows related to the current row, without collapsing them like `GROUP BY` does. `PARTITION BY` splits rows into groups, `ORDER BY` sets the order inside each group, and the frame (`ROWS BETWEEN ...`) says which rows around the current one to include. SQL Server usually sorts the data once by the partition and order columns and then streams through it, which is why an index on `(DeptId, Salary)` can make these queries much faster.

### Common mistakes

- Leaving out the frame on running totals. With `ORDER BY` and no frame, the default is `RANGE UNBOUNDED PRECEDING`, which treats ties as one step and is slower. Write `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.
- `LAST_VALUE(...)` returning the current row instead of the last one, for the same reason. Use `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, or `FIRST_VALUE` with the order reversed.
- Trying `WHERE ROW_NUMBER() OVER (...) = 1`. Window functions aren't allowed in `WHERE`; wrap the query in a CTE.
- Using `ROW_NUMBER` for "top earner" when ties should all count. Use `RANK` or `DENSE_RANK`.

### Real-world example

Removing duplicate customer rows imported twice is a classic: number each email's rows with `ROW_NUMBER() OVER (PARTITION BY Email ORDER BY CreatedAt)` and delete everything with a number above 1. The same idea gives "latest status per order", "month-over-month growth" with `LAG`, and "7-day moving average" charts.

```sql
WITH d AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY Email ORDER BY CreatedAt) AS rn FROM dbo.Customers)
DELETE FROM d WHERE rn > 1;
```

### Try it yourself

1. Show each employee's salary and the difference from their department's average.
2. Compute a running total of daily sales and a 7-day moving average.
3. Find the second-highest salary in each department, handling ties correctly.

## Lesson: [Intermediate|Medium] Set operators, CASE, PIVOT and MERGE

```sql
SELECT Email FROM Customers UNION     SELECT Email FROM Leads;   -- distinct
SELECT Email FROM Customers UNION ALL SELECT Email FROM Leads;   -- keeps duplicates, faster
SELECT Email FROM Customers INTERSECT SELECT Email FROM Leads;
SELECT Email FROM Customers EXCEPT    SELECT Email FROM Leads;

SELECT FullName, CASE WHEN Salary >= 150000 THEN 'Senior' WHEN Salary >= 80000 THEN 'Mid' ELSE 'Junior' END AS Band FROM Employees;

-- PIVOT
SELECT * FROM (SELECT Region, Quarter, Amount FROM Sales) s
PIVOT (SUM(Amount) FOR Quarter IN ([Q1], [Q2], [Q3], [Q4])) p;

-- MERGE (upsert): target vs source
MERGE dbo.Products AS t
USING dbo.StagingProducts AS s ON t.Sku = s.Sku
WHEN MATCHED AND t.Price <> s.Price THEN UPDATE SET t.Price = s.Price
WHEN NOT MATCHED BY TARGET THEN INSERT (Sku, Name, Price) VALUES (s.Sku, s.Name, s.Price)
WHEN NOT MATCHED BY SOURCE THEN DELETE
OUTPUT $action, inserted.Sku, deleted.Sku;
```

`MERGE` has known concurrency caveats: use `WITH (HOLDLOCK)` on the target for concurrent upserts, or separate UPDATE + INSERT in a transaction.

# Module: Programmability

## Lesson: [Intermediate|High] Stored procedures

```sql
CREATE OR ALTER PROCEDURE dbo.usp_GetEmployeesByDept
    @DeptId INT,
    @MinSalary DECIMAL(12,2) = 0,          -- default
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;                        -- suppress "n rows affected" messages
    SELECT EmpId, FullName, Salary FROM dbo.Employees
    WHERE DeptId = @DeptId AND Salary >= @MinSalary
    ORDER BY Salary DESC;

    SELECT @TotalCount = @@ROWCOUNT;
    RETURN 0;                              -- return value: status code (INT only)
END;
GO

DECLARE @n INT;
EXEC dbo.usp_GetEmployeesByDept @DeptId = 1, @MinSalary = 50000, @TotalCount = @n OUTPUT;
SELECT @n;
```

Benefits: plan reuse, security (grant EXECUTE without table access), fewer round trips, encapsulated logic, protection against injection (when not building dynamic SQL inside). Dynamic SQL inside a proc must use `sp_executesql` with parameters.

### How it works

The first time a procedure runs, SQL Server compiles an execution plan for it and keeps it in the plan cache. Later calls reuse that plan, which saves compile time. The plan is built for the parameter values of that first call, which is usually good but sometimes causes [parameter sniffing](/courses/sqlserver/lessons/statistics-parameter-sniffing-and-query-store) problems. Permissions can be granted on the procedure only, so an app account can run `usp_PlaceOrder` without having `INSERT` rights on the tables.

### Common mistakes

- Naming procedures `sp_Something`. SQL Server checks the `master` database first for `sp_` names, which costs a lookup and can call the wrong procedure.
- Building dynamic SQL by concatenating parameters inside the procedure. That brings SQL injection back. Use `sp_executesql` with parameters.
- Putting all business logic in huge procedures with no tests, so nobody dares to change them.
- Forgetting `SET NOCOUNT ON`, which sends a "rows affected" message for every statement and confuses some clients.

### Real-world example

A banking app calls `usp_TransferFunds` with three parameters. The procedure checks the balance, moves the money and writes an audit row in one transaction, all inside the database, in one round trip. The app's database user can only `EXECUTE` procedures, so even if the app is compromised, an attacker can't run `DELETE FROM Accounts`.

### Try it yourself

1. Write `usp_GetOrdersByCustomer` with an optional date range and call it from C# with Dapper or ADO.NET.
2. Add an `OUTPUT` parameter that returns the total count.
3. Create a login that can only `EXECUTE` the procedure and confirm it can't `SELECT` from the table directly.

## Lesson: [Intermediate|High] Functions: scalar, inline TVF, multi-statement TVF

```sql
-- Scalar function
CREATE OR ALTER FUNCTION dbo.fn_TaxAmount (@Amount DECIMAL(12,2)) RETURNS DECIMAL(12,2)
AS BEGIN RETURN @Amount * 0.18; END;

-- Inline table-valued function (best performing: expanded like a view)
CREATE OR ALTER FUNCTION dbo.fn_OrdersByCustomer (@CustomerId INT) RETURNS TABLE
AS RETURN (SELECT OrderId, OrderDate, Total FROM dbo.Orders WHERE CustomerId = @CustomerId);

SELECT * FROM dbo.fn_OrdersByCustomer(42);
SELECT c.Name, o.* FROM Customers c CROSS APPLY dbo.fn_OrdersByCustomer(c.CustomerId) o;
```

| | Stored procedure | Function |
|---|---|---|
| Returns | 0..n result sets, OUTPUT params, INT return code | Scalar or table (exactly one) |
| Use in SELECT/WHERE/JOIN | No | Yes |
| Modify data (INSERT/UPDATE) | Yes | No (no side effects) |
| TRY...CATCH, transactions | Yes | No |
| Call | `EXEC` | Inside queries |
| Can call | Functions and procs | Only functions |

Scalar UDFs were notorious for row-by-row execution; SQL Server 2019 can **inline** many of them.

### How it works

An **inline table-valued function** is a single `SELECT` with parameters. SQL Server pastes it into the calling query like a view, so the optimizer can use indexes and good row estimates. A **multi-statement TVF** fills a table variable step by step and hands it back; the optimizer can't see inside, so it guesses a fixed, small row count (SQL Server 2017+ can sometimes correct this with interleaved execution). A **scalar function** returns one value; before SQL Server 2019 it ran once per row and blocked parallel plans, and 2019+ can inline many simple ones.

### Common mistakes

- Calling a scalar function on a column in `WHERE` (`WHERE dbo.fn_Clean(Email) = @e`). It runs for every row and can't use an index.
- Writing a multi-statement TVF when a single `SELECT` would do. Convert it to an inline TVF.
- Hiding a query against a large table inside a scalar function used in a `SELECT` list, so a 10,000-row report runs 10,000 extra queries.
- Expecting functions to change data. They can't run `INSERT`/`UPDATE` on tables; use a procedure.

### Real-world example

A report took 40 seconds because every row called `dbo.fn_GetCustomerTier(CustomerId)`, a scalar function that queried the orders table. Rewriting it as an inline TVF and using `CROSS APPLY` let SQL Server calculate all tiers in one set-based pass, and the report ran in under a second.

### Try it yourself

1. Write a scalar function and an inline TVF that return the same tax amount, use each on 100,000 rows and compare times.
2. Convert a multi-statement TVF into an inline one.
3. Use `CROSS APPLY` with an inline TVF to get each customer's latest order.

## Lesson: [Intermediate|Medium] Views, triggers and temporary objects

```sql
CREATE OR ALTER VIEW dbo.vw_ActiveEmployees WITH SCHEMABINDING AS
SELECT EmpId, FullName, DeptId FROM dbo.Employees WHERE IsActive = 1;
-- Indexed (materialised) view: SCHEMABINDING + unique clustered index
```

```sql
CREATE OR ALTER TRIGGER dbo.trg_Employees_Audit ON dbo.Employees
AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.SalaryAudit (EmpId, OldSalary, NewSalary, ChangedAt)
    SELECT d.EmpId, d.Salary, i.Salary, SYSUTCDATETIME()
    FROM inserted i JOIN deleted d ON d.EmpId = i.EmpId
    WHERE i.Salary <> d.Salary;            -- handle MULTI-ROW updates, not just one row
END;
```

Triggers: `AFTER` (DML), `INSTEAD OF` (often on views), DDL triggers, logon triggers. Magic tables `inserted` / `deleted`. Keep them small; they hide logic and run inside the caller's transaction.

| | Temp table `#t` | Table variable `@t` | CTE |
|---|---|---|---|
| Scope | Session/proc (tempdb) | Batch/proc | Single statement |
| Statistics | Yes | No column stats (2019: deferred compilation improves row estimates) | n/a |
| Indexes | Any | Inline PK/unique/index definitions | n/a |
| Transaction rollback | Data rolled back | Data **not** rolled back | n/a |
| Good for | Larger intermediate sets | Small sets | Readability/recursion |

Global temp table `##t` is visible to all sessions.

## Lesson: [Intermediate|High] Error handling and transactions in T-SQL

```sql
CREATE OR ALTER PROCEDURE dbo.usp_TransferFunds @From INT, @To INT, @Amount DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;                     -- any runtime error rolls back the whole transaction
    BEGIN TRY
        BEGIN TRANSACTION;
            UPDATE dbo.Accounts SET Balance = Balance - @Amount WHERE AccountId = @From AND Balance >= @Amount;
            IF @@ROWCOUNT = 0 THROW 50001, 'Insufficient funds or account not found', 1;
            UPDATE dbo.Accounts SET Balance = Balance + @Amount WHERE AccountId = @To;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        INSERT INTO dbo.ErrorLog (Number, Message, Proc, Line, LoggedAt)
        VALUES (ERROR_NUMBER(), ERROR_MESSAGE(), ERROR_PROCEDURE(), ERROR_LINE(), SYSUTCDATETIME());
        THROW;                             -- re-raise to the caller
    END CATCH
END;
```

`THROW` (2012+) re-raises with the original number and line; `RAISERROR` is older (supports severity and formatting). `@@ERROR` is legacy.

### How it works

A transaction groups statements so they all commit or all roll back. Without `SET XACT_ABORT ON`, many runtime errors only fail the *current statement*, and the transaction keeps going, so you can commit half a transfer. With it on, any runtime error rolls back the whole transaction. `TRY...CATCH` lets you log the error and clean up, and `THROW` sends the original error on to the caller.

`@@TRANCOUNT` counts open transactions. Nested `BEGIN TRAN` statements only increase the counter: an inner `COMMIT` commits nothing, and any `ROLLBACK` rolls back everything.

### Common mistakes

- No `XACT_ABORT`, and the client times out. The client gives up, but the transaction stays open, holding locks until the connection is reused or closed. `XACT_ABORT ON` rolls it back.
- Catching the error and not re-throwing it, so the app thinks the call succeeded.
- `ROLLBACK` in the `CATCH` block without checking `@@TRANCOUNT > 0`, which throws a second error.
- Keeping a transaction open while the app does slow work (an HTTP call, sending email). Locks are held the whole time.

### Real-world example

An order API had random [timeouts](/errors/sqlclient-execution-timeout-expired) and then long blocking chains. One procedure hit a constraint error halfway, the app timed out, and the open transaction kept its locks. Adding `SET XACT_ABORT ON` and the `TRY...CATCH` pattern above made every failure roll back cleanly, and the blocking disappeared.

### Try it yourself

1. Write a transfer procedure without `XACT_ABORT`, force an error on the second `UPDATE`, and check whether the first one committed.
2. Add `XACT_ABORT ON` and `TRY...CATCH` and repeat the test.
3. Run `BEGIN TRAN; BEGIN TRAN; SELECT @@TRANCOUNT; ROLLBACK; SELECT @@TRANCOUNT;` and explain the results.

# Module: Indexes and Performance

## Lesson: [Intermediate|High] Clustered, non-clustered, covering and filtered indexes

- **Clustered index**: defines the physical order of rows (the table *is* the B-tree leaf level). One per table. Default on the PK. Best on narrow, unique, ever-increasing keys (INT IDENTITY).
- **Non-clustered index**: separate B-tree with key columns + a row locator (clustered key, or RID for heaps). Up to 999 per table.
- **Covering index**: contains all columns a query needs (keys + `INCLUDE` columns) → no key lookups.
- **Filtered index**: index on a subset (`WHERE IsActive = 1`).
- **Unique index**, composite index (column order matters: equality columns first, then range/sort), columnstore (analytics, compression), full-text, XML/spatial.
- **Heap**: table without a clustered index.

```sql
CREATE NONCLUSTERED INDEX IX_Orders_Customer_Date
ON dbo.Orders (CustomerId, OrderDate DESC)
INCLUDE (Total, Status)
WHERE IsDeleted = 0;

CREATE CLUSTERED COLUMNSTORE INDEX CCI_FactSales ON dbo.FactSales;
```

Costs: indexes speed reads but slow INSERT/UPDATE/DELETE and use storage. Find missing/unused ones with `sys.dm_db_missing_index_details` and `sys.dm_db_index_usage_stats` (validate suggestions: don't blindly create).

### How it works

An index is a B-tree: a sorted structure where SQL Server can go from the root to the right leaf page in three or four reads, even for millions of rows. The **clustered** index's leaf pages *are* the table rows, sorted by the clustered key. A **non-clustered** index is a separate, smaller B-tree sorted by its own key, and each leaf entry points back to the row through the clustered key. If the query needs columns that aren't in the non-clustered index, SQL Server does a **key lookup** into the clustered index for every row. `INCLUDE` columns avoid that.

Column order in a composite index works like a phone book sorted by last name, then first name: great for "last name = X", useless for "first name = Y" on its own.

### Common mistakes

- Creating every index the "missing index" hints suggest. They overlap, slow down writes and fill the disk. Combine them into a few well-chosen indexes.
- Composite index in the wrong order: `(OrderDate, CustomerId)` can't serve `WHERE CustomerId = @c` efficiently.
- No index on foreign key columns, so joins and deletes on the parent scan the child table.
- A wide clustered key (several columns, or a long string). Every non-clustered index stores it, so they all get bigger.

### Real-world example

The customer "My orders" page ran `WHERE CustomerId = @c ORDER BY OrderDate DESC` and took 2 seconds on 20 million orders. The plan showed a clustered index scan. Adding `IX_Orders_Customer_Date (CustomerId, OrderDate DESC) INCLUDE (Total, Status)` turned it into a seek with no lookups, and the page loaded in about 5 ms.

### Try it yourself

1. Create a table with 1 million rows, run a filtered query with `SET STATISTICS IO ON`, add an index and compare logical reads.
2. Run a query that causes a key lookup, then add `INCLUDE` columns and check the plan again.
3. List unused indexes with `sys.dm_db_index_usage_stats` on a test database.

## Lesson: [Intermediate|High] Execution plans, seeks vs scans and SARGability

- **Index Seek**: navigates the B-tree to matching rows (good for selective predicates).
- **Index/Table Scan**: reads everything (fine for small tables or returning most rows).
- **Key Lookup**: after a non-clustered seek, fetch extra columns from the clustered index; many lookups → add `INCLUDE` columns.
- **SARGable** (Search ARGument-able) predicates can use an index seek:

```sql
-- ❌ Non-SARGable: function or calculation on the column
WHERE YEAR(OrderDate) = 2026
WHERE LEFT(Name, 3) = 'Abc'
WHERE Salary * 1.1 > 100000
WHERE CONVERT(VARCHAR, Phone) = '98765'          -- implicit/explicit conversion of the column

-- ✅ SARGable
WHERE OrderDate >= '2026-01-01' AND OrderDate < '2027-01-01'
WHERE Name LIKE 'Abc%'                           -- leading wildcard '%abc' is NOT sargable
WHERE Salary > 100000 / 1.1
```

Read plans right-to-left, top-to-bottom; look at thick arrows, estimated vs actual rows (bad estimates → stale statistics or parameter sniffing), warnings (spills, implicit conversions), and the most expensive operators. `SET STATISTICS IO, TIME ON` shows logical reads and CPU time.

### How it works

The optimizer looks at your query, the indexes and the statistics, estimates how many rows each step will produce, and picks the cheapest plan it can find. An index seek is only possible when the predicate compares the **column itself** to a value. Wrap the column in a function or a calculation and SQL Server has to compute it for every row first, so it scans. Implicit conversions do the same thing quietly: comparing a `VARCHAR` column to an `NVARCHAR` parameter can convert the column on every row.

The gap between **estimated** and **actual** rows in a plan is the best clue you have. If SQL Server expected 1 row and got 500,000, it chose the plan for the wrong situation.

### Common mistakes

- `WHERE YEAR(OrderDate) = 2026` or `WHERE CAST(CreatedAt AS DATE) = @d` on big tables. Use a date range.
- Passing strings from C# as `NVARCHAR` (the default for `AddWithValue`) to `VARCHAR` columns. Set the parameter type and size explicitly.
- "Catch-all" queries like `WHERE (@Name IS NULL OR Name = @Name) AND (@City IS NULL OR City = @City)`. One cached plan can't be good for all combinations. Use dynamic SQL with parameters, or `OPTION (RECOMPILE)`.
- Reading only the estimated plan. Use the actual plan to see real row counts.

### Real-world example

A login lookup `WHERE Email = @email` scanned a 5-million-row table although `Email` had an index. The plan showed `CONVERT_IMPLICIT`: the column was `VARCHAR(200)` and the app sent `NVARCHAR(4000)`. Declaring the parameter as `SqlDbType.VarChar, 200` in the C# code turned it into a seek and cut CPU on the server noticeably.

### Try it yourself

1. Compare the plans and logical reads of `WHERE YEAR(OrderDate) = 2026` and the date-range version.
2. Reproduce an implicit conversion with an `NVARCHAR` parameter on a `VARCHAR` column and find the warning in the plan.
3. Take a slow query from your work, capture the actual plan, and find the step where estimated and actual rows differ the most.

## Lesson: [Advanced|High] Statistics, parameter sniffing and Query Store

- **Statistics**: histograms of value distribution that the optimizer uses to estimate row counts. Auto-created/updated; refresh with `UPDATE STATISTICS` or maintenance jobs.
- **Parameter sniffing**: the first execution's parameter values shape the cached plan; a plan good for a small customer can be terrible for a huge one. Fixes: `OPTION (RECOMPILE)`, `OPTIMIZE FOR (@p UNKNOWN)` or a specific value, splitting procs, plan forcing in Query Store, SQL 2022's Parameter Sensitive Plan optimisation.
- **Query Store** (2016+): records queries, plans and runtime stats over time; find regressed queries and force a known-good plan.
- **Index maintenance**: fragmentation matters less on SSDs; prioritise statistics updates. Rebuild (offline/online) vs reorganise.

### How it works

Statistics are a histogram of up to 200 steps per column (or index) that tell the optimizer how values are spread: how many orders customer 42 has, how many rows are `Status = 'Open'`. They are updated automatically when enough rows change, and since SQL Server 2016 large tables update after a smaller share of changes than before. When statistics are stale, row estimates are wrong and the plan is wrong.

Parameter sniffing is a side effect of plan caching: the plan is built for the first value it sees and reused for all others. Query Store records every query's plans and their run times, so when a query suddenly gets slower, you can see exactly when its plan changed and force the old one back.

### Common mistakes

- Fixing a sniffing problem by restarting SQL Server or clearing the whole plan cache. It works until the next "bad" first call.
- Adding `OPTION (RECOMPILE)` to a query that runs thousands of times a second. Compiling costs CPU; use it on heavy, less frequent queries.
- Rebuilding all indexes every night "for fragmentation" while statistics on fast-growing tables stay stale. Update statistics more often instead.
- Leaving Query Store off. On SQL Server 2022 it is on by default for new databases; turn it on for older ones too.

### Real-world example

A "customer orders" procedure ran in 50 ms for months, then suddenly took 30 seconds for everyone. After a restart, the first call came from a customer with 2 orders, so SQL Server cached a nested-loops plan, which was terrible for big customers with 2 million orders. Query Store showed two plans for the same query; forcing the good one fixed it in minutes, and the team later added `OPTIMIZE FOR UNKNOWN`.

### Try it yourself

1. Create a table where one customer has 1 row and another has 500,000. Call a procedure for each first and compare plans.
2. Look at a statistics object with `DBCC SHOW_STATISTICS ('dbo.Orders', 'IX_Orders_Customer_Date')`.
3. Turn on Query Store on a test database and find the top queries by CPU in SSMS.

## Lesson: [Advanced|High] Transactions, isolation levels and locking

ACID: **Atomicity** (all or nothing), Consistency (constraints hold), Isolation (concurrent transactions don't interfere), Durability (committed = survives crashes).

| Isolation level | Dirty read | Non-repeatable read | Phantom | Notes |
|---|---|---|---|---|
| READ UNCOMMITTED (`NOLOCK`) | ✓ | ✓ | ✓ | Can read uncommitted, even skip/duplicate rows |
| **READ COMMITTED** (default) | ✗ | ✓ | ✓ | Shared locks released after each read |
| REPEATABLE READ | ✗ | ✗ | ✓ | Holds shared locks till end of transaction |
| SERIALIZABLE | ✗ | ✗ | ✗ | Range locks; most blocking |
| SNAPSHOT | ✗ | ✗ | ✗ | Row versions in tempdb; readers don't block writers; update conflicts detected |
| READ COMMITTED SNAPSHOT (RCSI) | ✗ | ✓ | ✓ | Database option; statement-level versioning: default in Azure SQL Database |

Lock modes: **Shared (S)**, Exclusive (X), Update (U), Intent (IS/IX), schema locks. Granularity: row → page → table (lock escalation at ~5,000 locks).

**Blocking** = one session waits for another's lock. Deadlock = two sessions wait on each other; SQL Server kills one (the victim, error 1205). Reduce deadlocks: access objects in the same order, keep transactions short, add proper indexes (fewer locks), use RCSI/SNAPSHOT, and retry on 1205.

### How it works

Under the default READ COMMITTED level, readers take shared locks and writers take exclusive locks, so a long update blocks the reports that read the same rows, and the other way round. Row versioning changes that. With **RCSI** turned on, a reader gets the last committed version of a row from the version store in tempdb instead of waiting, so readers and writers stop blocking each other. Writers still block other writers.

A deadlock happens when two sessions each hold a lock the other needs. SQL Server's deadlock monitor checks every few seconds, picks the cheaper session as the victim and rolls it back with [error 1205](/errors/sql-server-transaction-was-deadlocked-1205).

### Common mistakes

- `WITH (NOLOCK)` everywhere to "fix" blocking. It can return rows twice, skip rows and show data that is later rolled back. RCSI is the safe fix.
- Long transactions that wait for user input or HTTP calls while holding locks.
- Updating tables in a different order in different procedures (A then B here, B then A there), which is the classic deadlock recipe.
- Not retrying on 1205. Deadlocks can be made rare, but not impossible, so the app should retry the transaction once or twice.

### Real-world example

An order system's reports blocked checkout every morning at 9 when finance ran them. Turning on `READ_COMMITTED_SNAPSHOT` let the reports read committed versions without shared locks, and checkout stopped waiting. The cost was more tempdb usage, which the team watched for a week before calling it done.

```sql
ALTER DATABASE Shop SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
```

### Try it yourself

1. In two SSMS windows, start a transaction that updates a row in one, then `SELECT` it in the other and watch it wait.
2. Turn on RCSI on a test database and repeat: the `SELECT` now returns the old value immediately.
3. Create a deadlock with two sessions updating two tables in opposite order, and read the deadlock graph from the `system_health` session.

## Lesson: [Advanced|Medium] Partitioning, columnstore, temporal and security features

- **Table partitioning**: split a large table by a range (e.g. month) on a partition function/scheme; enables partition elimination and fast `SWITCH`/`TRUNCATE ... WITH (PARTITIONS (...))` for data retention.
- **Columnstore**: column-wise compressed storage; huge gains for analytics/aggregates (data warehouses).
- **Temporal tables**: `SYSTEM_VERSIONING = ON` keeps full row history; query `FOR SYSTEM_TIME AS OF`.
- **JSON**: `OPENJSON`, `JSON_VALUE`, `JSON_QUERY`, `FOR JSON PATH` (2016+); native `json` type in SQL Server 2025.
- **Security**: logins (server) vs users (database), roles, `GRANT/DENY/REVOKE`, schemas; Row-Level Security, Dynamic Data Masking, Always Encrypted, TDE (encryption at rest), auditing.
- **High availability / DR**: Always On Availability Groups, Failover Cluster Instances, log shipping, backups: full, differential, transaction log (with FULL recovery model enables point-in-time restore).

# Module: Connecting Applications to SQL Server

## Lesson: [Basic|High] Connection strings, authentication and connecting from every technology

**Anatomy of a SQL Server connection string:**

```text
Server=tcp:myserver.database.windows.net,1433;   ← host (or ".\SQLEXPRESS", "localhost", "(localdb)\MSSQLLocalDB"), port 1433
Database=Shop;                                    ← (= Initial Catalog)
User ID=shop_app;Password=***;                    ← SQL authentication   OR   Trusted_Connection=True / Integrated Security=SSPI (Windows auth)
Encrypt=True;TrustServerCertificate=False;        ← TLS (Encrypt=True is the default since Microsoft.Data.SqlClient 4.0)
Connection Timeout=30;                            ← seconds to wait for a connection
MultipleActiveResultSets=False;                   ← MARS
Application Name=Shop.Api;                        ← shows in sys.dm_exec_sessions: great for diagnostics
Max Pool Size=100;Min Pool Size=0                 ← connection pooling (on by default)
```

| Authentication | When | Connection string part |
|---|---|---|
| Windows (Integrated) | On-premises, domain/IIS app pool identity | `Trusted_Connection=True` |
| SQL authentication | Simple setups, non-Windows clients | `User ID=...;Password=...` |
| Microsoft Entra ID (Azure AD): managed identity | Azure SQL from Azure services, no password | `Authentication=Active Directory Managed Identity` (or `Active Directory Default`) |

**Where to keep it:** `appsettings.json` / `web.config` for non-secret parts, secrets in User Secrets (dev), environment variables, Azure Key Vault or managed identity (production). Never in source control or front-end code.

**Every technology at a glance:**

| Technology | How it connects | Minimal example |
|---|---|---|
| ADO.NET (.NET) | `Microsoft.Data.SqlClient` (`System.Data.SqlClient` in old Framework apps) | `using var cn = new SqlConnection(cs); cn.Open(); new SqlCommand("SELECT ...", cn).ExecuteReader()` |
| Entity Framework Core | `UseSqlServer(cs)` | `builder.Services.AddDbContext<ShopDb>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("Shop")))` |
| Entity Framework 6 | `DbContext("name=Shop")` + web.config connection string | `public ShopEntities() : base("name=ShopEntities") { }` |
| Dapper | Extension methods on `SqlConnection` | `conn.QueryAsync<Product>("SELECT * FROM dbo.Products")` |
| ASP.NET Web Forms / MVC 5 | web.config `<connectionStrings>` + `ConfigurationManager` | `ConfigurationManager.ConnectionStrings["Shop"].ConnectionString` |
| ASP.NET Core | `appsettings.json` "ConnectionStrings" + `GetConnectionString` | see EF Core / Dapper rows |
| VB.NET | Same ADO.NET classes | `Using cn As New SqlConnection(cs) : cn.Open() : End Using` |
| SSIS | OLE DB / ADO.NET connection managers (MSOLEDBSQL provider) | Connection manager + project parameters for environments |
| SSRS | Shared data sources (stored credentials or Windows integrated) | Data source in Report Server |
| Node.js | `mssql` (tedious), Prisma, Sequelize | `new sql.ConnectionPool({ server, database, user, password, options: { encrypt: true } })` |
| Next.js | Server Components / route handlers with `mssql` or Prisma: never client code | see the Next.js course |
| React / Angular / Vue / AngularJS | **Through an HTTP API** (ASP.NET Core / Node): browsers never connect directly | `fetch('/api/products')` / `HttpClient.get(...)` / `$http.get(...)` |
| Python | `pyodbc` / `mssql-python` with ODBC Driver 18 | `pyodbc.connect("DRIVER={ODBC Driver 18 for SQL Server};SERVER=...;DATABASE=Shop;Trusted_Connection=yes;Encrypt=yes")` |
| Java | Microsoft JDBC driver | `jdbc:sqlserver://host:1433;databaseName=Shop;encrypt=true` |
| Power BI / Excel | Built-in SQL Server connector (Import or DirectQuery) | Server + database + credentials, on-premises data gateway for cloud refresh |

```csharp
// ADO.NET done right: async, parameterised, pooled, disposed
await using var conn = new SqlConnection(cs);
await conn.OpenAsync(ct);
await using var cmd = new SqlCommand("SELECT Id, Name FROM dbo.Products WHERE CategoryId = @cat", conn);
cmd.Parameters.Add("@cat", SqlDbType.Int).Value = categoryId;
await using var reader = await cmd.ExecuteReaderAsync(ct);
while (await reader.ReadAsync(ct)) Console.WriteLine($"{reader.GetInt32(0)} {reader.GetString(1)}");
```

**Common connection errors:**

| Error | Cause / fix |
|---|---|
| "A network-related or instance-specific error… (error: 26/40)" | Wrong server/instance name, SQL Browser stopped (named instances), TCP/IP disabled in SQL Server Configuration Manager, firewall port 1433 closed |
| "Login failed for user" (18456) | Wrong credentials, SQL authentication not enabled (mixed mode), login has no access to the database, IIS app pool identity has no login |
| "The certificate chain was issued by an authority that is not trusted" | `Encrypt=True` with a self-signed server certificate: install a trusted certificate, or `TrustServerCertificate=True` for **local development only** |
| "Timeout expired… pool" | Connection leaks (not disposed) or too many concurrent requests: `using`/`await using`, check pool size, find long queries |
| Azure SQL "Cannot open server… not allowed" | Server firewall: add the client IP or use private endpoints / allow Azure services |

# Interview

## [Beginner|High] What is the difference between DELETE, TRUNCATE and DROP?

DELETE (DML) removes rows one by one, supports WHERE, fires triggers, logs each row and keeps the identity counter. TRUNCATE (DDL) removes all rows by deallocating pages, is minimally logged and much faster, resets IDENTITY, doesn't fire triggers and isn't allowed on tables referenced by a foreign key. DROP removes the whole table definition, data, indexes and permissions. In SQL Server all three can be rolled back inside an explicit transaction.

## [Beginner|High] What are the different types of joins?

INNER JOIN (matching rows in both), LEFT/RIGHT OUTER JOIN (all rows from one side + matches, NULLs otherwise), FULL OUTER JOIN (all rows from both), CROSS JOIN (Cartesian product), SELF JOIN (table joined to itself, e.g. employee–manager). T-SQL also has CROSS APPLY/OUTER APPLY for correlated table expressions. Physical algorithms: nested loops, merge, hash.

## [Beginner|High] What is the difference between WHERE and HAVING?

WHERE filters individual rows **before** grouping and can't use aggregates. HAVING filters groups after GROUP BY and can use aggregates (`HAVING COUNT(*) > 5`). Put non-aggregate conditions in WHERE for performance: fewer rows get grouped.

## [Beginner|High] What is a primary key vs a unique key vs a foreign key?

Primary key: uniquely identifies each row, NOT NULL, one per table, creates a clustered index by default. Unique key: enforces uniqueness on other columns, allows one NULL in SQL Server, many per table, creates a non-clustered index by default. Foreign key: a column referencing another table's primary/unique key to enforce referential integrity (with cascade options).

## [Beginner|High] What is normalisation? Explain 1NF, 2NF and 3NF.

Organising tables to reduce redundancy and update anomalies. 1NF: atomic columns and no repeating groups. 2NF: 1NF and every non-key column depends on the **whole** primary key (no partial dependency, relevant for composite keys). 3NF: 2NF and no transitive dependency (non-key columns depend only on the key, e.g. move DeptName out of Employees into Departments). Data warehouses deliberately denormalise for read speed.

## [Beginner|High] Clustered vs non-clustered index?

A clustered index sorts and stores the table's data rows in key order: the leaf level is the data; only one per table. A non-clustered index is a separate structure with key columns and a pointer (clustered key or RID) back to the row; up to 999 per table. Clustered is ideal for range queries on the key; non-clustered for selective lookups on other columns, ideally covering with INCLUDE columns.

## [Beginner|High] Write a query to find the second (or Nth) highest salary.

```sql
-- Handles ties correctly; change 2 to N
SELECT DISTINCT Salary FROM (
    SELECT Salary, DENSE_RANK() OVER (ORDER BY Salary DESC) AS rnk FROM dbo.Employees
) t WHERE rnk = 2;

-- Alternative
SELECT MAX(Salary) FROM dbo.Employees WHERE Salary < (SELECT MAX(Salary) FROM dbo.Employees);

-- OFFSET/FETCH
SELECT DISTINCT Salary FROM dbo.Employees ORDER BY Salary DESC OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY;
```

## [Beginner|High] How do you find and delete duplicate rows?

```sql
-- find
SELECT Email, COUNT(*) AS Cnt FROM dbo.Customers GROUP BY Email HAVING COUNT(*) > 1;

-- delete all but one (keep lowest Id)
WITH d AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY Email ORDER BY CustomerId) AS rn FROM dbo.Customers
)
DELETE FROM d WHERE rn > 1;
```

Then add a UNIQUE constraint so it can't happen again.

## [Beginner|Medium] What is the difference between UNION and UNION ALL?

UNION combines result sets and removes duplicates (requires a sort/hash → slower). UNION ALL keeps all rows including duplicates and is faster. Both need the same number of columns with compatible types. Use UNION ALL unless you specifically need deduplication.

## [Beginner|Medium] What is the difference between CHAR, VARCHAR, NCHAR and NVARCHAR?

CHAR(n)/NCHAR(n) are fixed-length (padded with spaces); VARCHAR(n)/NVARCHAR(n) are variable-length. N-types store Unicode (UTF-16, 2 bytes per character for most), needed for Hindi, Chinese etc.; non-N types use 1 byte per character in the column's code page (or UTF-8 collations in 2019+). `MAX` variants hold up to 2 GB. Prefix Unicode literals with `N'...'`.

## [Intermediate|High] Explain ROW_NUMBER, RANK and DENSE_RANK.

All are window ranking functions. For salaries 100, 90, 90, 80: ROW_NUMBER gives 1,2,3,4 (unique, arbitrary order among ties), RANK gives 1,2,2,4 (ties share a rank, gaps follow), DENSE_RANK gives 1,2,2,3 (ties share, no gaps). Use ROW_NUMBER for deduplication and paging, DENSE_RANK for "Nth highest" with ties.

## [Intermediate|High] What is a CTE? When would you use a recursive CTE?

A Common Table Expression (`WITH name AS (...)`) is a named temporary result set for a single statement: improves readability, can be referenced multiple times in that statement, and supports recursion. A recursive CTE has an anchor member UNION ALL a recursive member referencing the CTE; used for hierarchies (org charts, category trees, bill of materials) and generating sequences. Default max recursion 100 (`OPTION (MAXRECURSION n)`).

## [Intermediate|High] Stored procedure vs function?

Procedures can return multiple result sets, output parameters and an integer return code; can modify data, use transactions and TRY/CATCH; are called with EXEC and can't be used inside SELECT. Functions return a scalar or a table, must be side-effect free (no INSERT/UPDATE to tables), can't use TRY/CATCH or transactions, and can be used in SELECT/WHERE/JOIN/APPLY. Prefer inline TVFs for reusable query logic.

## [Intermediate|High] What are the transaction isolation levels in SQL Server?

READ UNCOMMITTED (dirty reads possible; `NOLOCK`), READ COMMITTED (default; no dirty reads), REPEATABLE READ (no non-repeatable reads), SERIALIZABLE (no phantoms; range locks), SNAPSHOT (row versioning, consistent view as of transaction start, readers don't block writers), and READ COMMITTED SNAPSHOT (database setting making read committed use versioning per statement; default in Azure SQL Database). Higher isolation = more consistency, more blocking.

## [Intermediate|High] What is a deadlock and how do you handle it?

Two (or more) transactions each hold locks the other needs, so neither can proceed. SQL Server's lock monitor detects it and kills the cheapest transaction (error 1205). Investigate with the `system_health` Extended Events session (deadlock graphs). Prevent: access tables in a consistent order, keep transactions short, add indexes so fewer rows are locked, avoid user interaction inside transactions, use RCSI/SNAPSHOT for readers; and retry 1205 in the application.

## [Intermediate|High] Temp table vs table variable vs CTE?

Temp tables (`#t`) live in tempdb for the session/proc, have statistics, support any indexes, and are rolled back with transactions: good for larger intermediate data. Table variables (`@t`) are scoped to the batch, have no column statistics (estimates improved by 2019 deferred compilation), aren't affected by rollback, best for small sets. CTEs aren't stored at all, they're inlined into the single statement.

## [Intermediate|High] What makes a query non-SARGable? Give examples.

Using functions, calculations or conversions on an indexed column in WHERE/JOIN prevents index seeks: `WHERE YEAR(OrderDate) = 2026`, `WHERE ISNULL(Col, 0) = 5`, `WHERE Col + 1 = 10`, `LIKE '%abc'`, implicit conversions (nvarchar parameter vs varchar column). Rewrite as ranges or move the calculation to the parameter side: `OrderDate >= '2026-01-01' AND OrderDate < '2027-01-01'`.

## [Intermediate|Medium] What is the difference between ISNULL and COALESCE?

ISNULL(expr, replacement) is T-SQL-specific, takes two arguments, and returns the data type of the first. COALESCE(a, b, c, ...) is ANSI standard, takes many arguments, returns the first non-NULL and uses data type precedence; it's internally a CASE expression (may evaluate subqueries twice). Nullability of computed results also differs.

## [Intermediate|Medium] What are the magic tables in triggers?

`inserted` and `deleted`: virtual tables available inside DML triggers (and OUTPUT clauses). INSERT: `inserted` has new rows. DELETE: `deleted` has removed rows. UPDATE: `deleted` holds old values and `inserted` new values. Triggers fire once per statement, so always write set-based logic that handles multiple rows.

## [Advanced|High] What is parameter sniffing and how do you fix it?

When a parameterised query/proc compiles, the optimizer "sniffs" the first parameter values to estimate row counts and caches that plan. If data is skewed, later calls with different values reuse a plan that's bad for them (e.g. a nested-loop plan built for a customer with 5 orders reused for one with 5 million). Fixes: `OPTION (RECOMPILE)` for infrequent queries, `OPTIMIZE FOR UNKNOWN`/specific value, local variables (generic estimate), separate procedures for different data shapes, Query Store plan forcing, and SQL Server 2022's Parameter Sensitive Plan optimisation.

## [Advanced|High] How do you approach tuning a slow query?

1) Reproduce and measure (`SET STATISTICS IO, TIME ON`, actual execution plan, Query Store history). 2) Read the plan: scans on large tables, key lookups, bad estimates, spills, implicit conversions, parallelism issues. 3) Fix the query: SARGable predicates, remove `SELECT *`, avoid scalar UDFs/cursors (set-based), rewrite correlated subqueries, correct data types. 4) Fix indexes: covering/composite indexes in the right column order, filtered indexes, remove unused. 5) Update statistics; handle parameter sniffing. 6) Check blocking/waits (`sys.dm_exec_requests`, `sp_WhoIsActive`). 7) Validate the improvement and watch write overhead.

## [Advanced|Medium] What does NOLOCK do and why is it dangerous?

`WITH (NOLOCK)` = READ UNCOMMITTED for that table: no shared locks, so it isn't blocked by writers. Dangers: dirty reads of uncommitted data that may roll back, missing or duplicate rows due to page splits during scans, and errors (601) on data movement. It isn't a performance fix for blocking: use READ COMMITTED SNAPSHOT isolation instead, which gives non-blocking reads of committed data.

## [Advanced|Medium] Explain the backup types and recovery models.

Recovery models: SIMPLE (log truncated at checkpoint, no log backups, restore only to the last full/diff), FULL (all logged, log backups required, point-in-time restore), BULK_LOGGED (minimal logging for bulk ops, point-in-time limited). Backups: Full (whole DB), Differential (changes since the last full), Transaction log (log records since the last log backup, keeps the log from growing in FULL). Restore sequence: full → latest differential → all log backups in order (`STOPAT` for point in time). Test restores regularly.

## [Advanced|Low] What is lock escalation?

When a single statement acquires roughly 5,000+ row/page locks on one object, SQL Server may escalate to a table (or partition) lock to save memory, which increases blocking. Mitigate by batching large modifications (e.g. 4,000 rows at a time), proper indexes, `ALTER TABLE ... SET (LOCK_ESCALATION = AUTO)` for partitioned tables, or row versioning isolation.

## [Scenario|High] A report query that used to take 2 seconds now takes 2 minutes. Nothing in the code changed. What do you check?

Something changed in data or plans. Check Query Store for a **plan regression** (different plan since date X) and force the old plan as a stopgap; check statistics staleness after big data loads (update them); parameter sniffing (different first-call parameters); data growth crossing a threshold; new blocking (`sp_WhoIsActive`, wait stats); index changes or dropped indexes; server pressure (memory grants, tempdb spills, CPU). Then fix permanently with indexes/query rewrite.

## [Scenario|High] Write a query to get each department's top 3 earners.

```sql
WITH ranked AS (
    SELECT e.*, DENSE_RANK() OVER (PARTITION BY DeptId ORDER BY Salary DESC) AS rnk
    FROM dbo.Employees e
)
SELECT d.DeptName, r.FullName, r.Salary, r.rnk
FROM ranked r JOIN dbo.Departments d ON d.DeptId = r.DeptId
WHERE r.rnk <= 3
ORDER BY d.DeptName, r.rnk;
```

Use ROW_NUMBER for exactly 3 rows per department regardless of ties; DENSE_RANK to include ties.

## [Scenario|High] Users report the Orders screen freezes at month-end when the finance job runs. How do you investigate and fix?

Likely blocking: the finance job holds long locks (large UPDATEs, SERIALIZABLE, or lock escalation) while the screen's SELECTs wait. Investigate with `sp_WhoIsActive`/`sys.dm_exec_requests` (blocking_session_id, wait types like LCK_M_S) during the window and the job's plans. Fixes: enable **READ COMMITTED SNAPSHOT** so readers don't block on writers, batch the job's updates into small transactions, add indexes so it locks fewer rows, schedule heavy parts off-hours, or read reports from a readable secondary/replica.

## [Scenario|Medium] How would you design tables for an e-commerce order system?

Customers(CustomerId PK, Name, Email UNIQUE), Addresses(AddressId, CustomerId FK, ...), Products(ProductId PK, Sku UNIQUE, Name, Price, CategoryId FK), Categories(self-referencing ParentId), Orders(OrderId PK, CustomerId FK, OrderDate, Status, ShippingAddressId FK, Total), OrderItems(OrderId FK, ProductId FK, Qty, UnitPrice: copy the price at order time; PK (OrderId, ProductId) or surrogate), Payments(PaymentId, OrderId FK, Amount, Method, Status, ProviderRef UNIQUE), Inventory(ProductId, WarehouseId, Qty, RowVersion). Indexes on FKs and common filters (Orders(CustomerId, OrderDate DESC)), CHECK constraints (Qty > 0), rowversion for concurrency, audit columns.

## [Scenario|Medium] You must load 50 million rows into a table that is queried 24/7. How do you avoid downtime?

Load into a **staging table** with the same structure (bulk insert, minimal logging, no indexes during load, then build indexes), validate, then partition switch it into the main partitioned table (metadata-only, near-instant) or swap via `sp_rename` inside a short transaction. Alternatively insert in small batches with throttling during low traffic. Use RCSI so readers aren't blocked, and keep statistics updated afterwards.

## [Beginner|High] What are the ACID properties of a transaction?

Atomicity: all statements in a transaction succeed or none do (rollback on failure). Consistency, a transaction moves the database from one valid state to another, respecting constraints, keys and rules. Isolation, concurrent transactions don't see each other's uncommitted work, controlled by isolation levels and locks/row versions. Durability, once committed, changes survive crashes because the log is hardened to disk (write-ahead logging). Example: a money transfer debits one account and credits another inside one transaction so it can never half-complete.

# Cheatsheet

## Logical processing order

FROM → ON → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → TOP/OFFSET.

## Joins

INNER · LEFT · RIGHT · FULL · CROSS · SELF · CROSS APPLY · OUTER APPLY · anti-join (`LEFT JOIN ... WHERE b.Id IS NULL` or `NOT EXISTS`).

## Window functions

```sql
ROW_NUMBER()/RANK()/DENSE_RANK()/NTILE(n) OVER (PARTITION BY a ORDER BY b)
SUM(x) OVER (PARTITION BY a)                                  -- group total on every row
SUM(x) OVER (ORDER BY d ROWS UNBOUNDED PRECEDING)              -- running total
LAG(x, 1) / LEAD(x, 1) OVER (ORDER BY d)
FIRST_VALUE / LAST_VALUE
```

## Must-know queries

Nth highest salary (DENSE_RANK) · duplicates (GROUP BY HAVING) · delete duplicates (CTE + ROW_NUMBER) · employee–manager (self join) · org chart (recursive CTE) · top N per group · running total · customers without orders (NOT EXISTS) · pivot (CASE/PIVOT) · upsert (MERGE).

## Index rules

One clustered (narrow, unique, increasing) · non-clustered for selective filters · equality columns first, then range · INCLUDE to cover · filtered for subsets · columnstore for analytics · SARGable predicates · every index costs writes.

## Isolation levels

READ UNCOMMITTED → READ COMMITTED (default) → REPEATABLE READ → SERIALIZABLE; SNAPSHOT and RCSI use row versions (readers don't block writers).

## Error handling template

```sql
SET NOCOUNT ON; SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRAN;
    -- work
  COMMIT;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  THROW;
END CATCH
```

## Handy functions

`GETDATE()` `SYSUTCDATETIME()` `DATEADD` `DATEDIFF` `EOMONTH` `FORMAT` `CAST/CONVERT/TRY_CONVERT` `ISNULL/COALESCE/NULLIF` `IIF` `CHOOSE` `LEN` `SUBSTRING` `CHARINDEX` `REPLACE` `TRIM` `STRING_AGG` `STRING_SPLIT` `CONCAT_WS` `JSON_VALUE` `OPENJSON` `@@ROWCOUNT` `SCOPE_IDENTITY()` `NEWID()` `GREATEST/LEAST` (2022).

## Diagnostics

`SET STATISTICS IO, TIME ON` · actual execution plan · Query Store · `sys.dm_exec_requests` · `sys.dm_exec_query_stats` · `sys.dm_db_index_usage_stats` · `sys.dm_db_missing_index_details` · `sp_WhoIsActive` · Extended Events `system_health` for deadlocks.
