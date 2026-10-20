---
slug: sqlserver
title: SQL Server & T-SQL
track: data
order: 1
icon: SQL
color: #c92a2a
summary: Database design and normalisation, data types, constraints, joins, subqueries, CTEs, window functions, stored procedures, functions, views, triggers, indexes, execution plans, transactions, isolation levels, locking, error handling and performance tuning.
---

# Overview

**Microsoft SQL Server** is a relational database management system (RDBMS). **T-SQL (Transact-SQL)** is Microsoft's extension of ANSI SQL with variables, control flow, error handling, stored procedures and more.

The SQL Server family:

| Component | Purpose |
|---|---|
| Database Engine | Stores and queries data (OLTP) |
| SSIS (Integration Services) | ETL — see the SSIS course |
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

1. **Parse** — syntax check, build a parse tree.
2. **Bind (algebrize)** — resolve names, types, permissions.
3. **Optimise** — the cost-based **query optimizer** uses statistics to choose an **execution plan** (join types, index seeks vs scans, parallelism).
4. **Plan cache** — plan stored for reuse (parameterised queries reuse plans).
5. **Execute** — the storage engine reads pages from the **buffer pool** (memory) or disk, acquiring locks/latches.
6. **Return** results to the client.

**Logical query processing order** (not the written order):

`FROM` → `ON` → `JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `TOP`/`OFFSET-FETCH`

That's why you can't use a `SELECT` alias in `WHERE`, but you can in `ORDER BY`.

**Transaction lifecycle:** `BEGIN TRAN` → statements write to the **transaction log** first (write-ahead logging) → `COMMIT` (durable once the log is hardened) or `ROLLBACK` (undo using the log). Checkpoints write dirty pages to data files; recovery replays/undoes the log after a crash.

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

## Lesson: [Basic|High] Normalisation (1NF → BCNF) and denormalisation

| Form | Rule | Fix example |
|---|---|---|
| **1NF** | Atomic values, no repeating groups | `Phones = '98..,99..'` → separate `CustomerPhones` rows |
| **2NF** | 1NF + no **partial** dependency on part of a composite key | `OrderItems(OrderId, ProductId, ProductName)` → move `ProductName` to `Products` |
| **3NF** | 2NF + no **transitive** dependency (non-key → non-key) | `Employees(DeptId, DeptName)` → move `DeptName` to `Departments` |
| **BCNF** | Every determinant is a candidate key | Stricter 3NF for overlapping candidate keys |
| 4NF / 5NF | No multi-valued / join dependencies | Rare in interviews |

**Denormalisation** — deliberately adding redundancy (e.g. storing `OrderTotal`, reporting tables, star schemas) to speed reads at the cost of update complexity. OLTP systems: normalise to 3NF. Data warehouses: denormalised **star schemas** (facts + dimensions).

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

Physical join algorithms the optimizer picks: **Nested Loops** (small outer input + indexed inner), **Merge Join** (both inputs sorted on the key), **Hash Match** (large unsorted inputs).

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

`NOT IN` with a subquery that returns any NULL returns **no rows** — prefer `NOT EXISTS`.

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

-- MERGE (upsert) — target vs source
MERGE dbo.Products AS t
USING dbo.StagingProducts AS s ON t.Sku = s.Sku
WHEN MATCHED AND t.Price <> s.Price THEN UPDATE SET t.Price = s.Price
WHEN NOT MATCHED BY TARGET THEN INSERT (Sku, Name, Price) VALUES (s.Sku, s.Name, s.Price)
WHEN NOT MATCHED BY SOURCE THEN DELETE
OUTPUT $action, inserted.Sku, deleted.Sku;
```

`MERGE` has known concurrency caveats — use `WITH (HOLDLOCK)` on the target for concurrent upserts, or separate UPDATE + INSERT in a transaction.

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

## Lesson: [Intermediate|High] Functions: scalar, inline TVF, multi-statement TVF

```sql
-- Scalar function
CREATE OR ALTER FUNCTION dbo.fn_TaxAmount (@Amount DECIMAL(12,2)) RETURNS DECIMAL(12,2)
AS BEGIN RETURN @Amount * 0.18; END;

-- Inline table-valued function (best performing — expanded like a view)
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

# Module: Indexes and Performance

## Lesson: [Intermediate|High] Clustered, non-clustered, covering and filtered indexes

- **Clustered index** — defines the physical order of rows (the table *is* the B-tree leaf level). **One per table**. Default on the PK. Best on narrow, unique, ever-increasing keys (INT IDENTITY).
- **Non-clustered index** — separate B-tree with key columns + a row locator (clustered key, or RID for heaps). Up to 999 per table.
- **Covering index** — contains all columns a query needs (keys + `INCLUDE` columns) → no key lookups.
- **Filtered index** — index on a subset (`WHERE IsActive = 1`).
- **Unique index**, **composite index** (column order matters: equality columns first, then range/sort), **columnstore** (analytics, compression), **full-text**, **XML/spatial**.
- **Heap** — table without a clustered index.

```sql
CREATE NONCLUSTERED INDEX IX_Orders_Customer_Date
ON dbo.Orders (CustomerId, OrderDate DESC)
INCLUDE (Total, Status)
WHERE IsDeleted = 0;

CREATE CLUSTERED COLUMNSTORE INDEX CCI_FactSales ON dbo.FactSales;
```

Costs: indexes speed reads but slow INSERT/UPDATE/DELETE and use storage. Find missing/unused ones with `sys.dm_db_missing_index_details` and `sys.dm_db_index_usage_stats` (validate suggestions — don't blindly create).

## Lesson: [Intermediate|High] Execution plans, seeks vs scans and SARGability

- **Index Seek** — navigates the B-tree to matching rows (good for selective predicates).
- **Index/Table Scan** — reads everything (fine for small tables or returning most rows).
- **Key Lookup** — after a non-clustered seek, fetch extra columns from the clustered index; many lookups → add `INCLUDE` columns.
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

## Lesson: [Advanced|High] Statistics, parameter sniffing and Query Store

- **Statistics** — histograms of value distribution that the optimizer uses to estimate row counts. Auto-created/updated; refresh with `UPDATE STATISTICS` or maintenance jobs.
- **Parameter sniffing** — the first execution's parameter values shape the cached plan; a plan good for a small customer can be terrible for a huge one. Fixes: `OPTION (RECOMPILE)`, `OPTIMIZE FOR (@p UNKNOWN)` or a specific value, splitting procs, plan forcing in Query Store, SQL 2022's Parameter Sensitive Plan optimisation.
- **Query Store** (2016+) — records queries, plans and runtime stats over time; find regressed queries and force a known-good plan.
- **Index maintenance** — fragmentation matters less on SSDs; prioritise statistics updates. Rebuild (offline/online) vs reorganise.

## Lesson: [Advanced|High] Transactions, isolation levels and locking

ACID: **Atomicity** (all or nothing), **Consistency** (constraints hold), **Isolation** (concurrent transactions don't interfere), **Durability** (committed = survives crashes).

| Isolation level | Dirty read | Non-repeatable read | Phantom | Notes |
|---|---|---|---|---|
| READ UNCOMMITTED (`NOLOCK`) | ✓ | ✓ | ✓ | Can read uncommitted, even skip/duplicate rows |
| **READ COMMITTED** (default) | ✗ | ✓ | ✓ | Shared locks released after each read |
| REPEATABLE READ | ✗ | ✗ | ✓ | Holds shared locks till end of transaction |
| SERIALIZABLE | ✗ | ✗ | ✗ | Range locks; most blocking |
| SNAPSHOT | ✗ | ✗ | ✗ | Row versions in tempdb; readers don't block writers; update conflicts detected |
| READ COMMITTED SNAPSHOT (RCSI) | ✗ | ✓ | ✓ | Database option; statement-level versioning — default in Azure SQL Database |

Lock modes: **Shared (S)**, **Exclusive (X)**, **Update (U)**, **Intent (IS/IX)**, schema locks. Granularity: row → page → table (lock escalation at ~5,000 locks).

**Blocking** = one session waits for another's lock. **Deadlock** = two sessions wait on each other; SQL Server kills one (the victim, error **1205**). Reduce deadlocks: access objects in the same order, keep transactions short, add proper indexes (fewer locks), use RCSI/SNAPSHOT, and retry on 1205.

## Lesson: [Advanced|Medium] Partitioning, columnstore, temporal and security features

- **Table partitioning** — split a large table by a range (e.g. month) on a partition function/scheme; enables partition elimination and fast `SWITCH`/`TRUNCATE ... WITH (PARTITIONS (...))` for data retention.
- **Columnstore** — column-wise compressed storage; huge gains for analytics/aggregates (data warehouses).
- **Temporal tables** — `SYSTEM_VERSIONING = ON` keeps full row history; query `FOR SYSTEM_TIME AS OF`.
- **JSON** — `OPENJSON`, `JSON_VALUE`, `JSON_QUERY`, `FOR JSON PATH` (2016+); native `json` type in SQL Server 2025.
- **Security** — logins (server) vs users (database), roles, `GRANT/DENY/REVOKE`, schemas; **Row-Level Security**, **Dynamic Data Masking**, **Always Encrypted**, **TDE** (encryption at rest), auditing.
- **High availability / DR** — Always On Availability Groups, Failover Cluster Instances, log shipping, backups: **full**, **differential**, **transaction log** (with FULL recovery model enables point-in-time restore).

# Interview

## [Beginner|High] What is the difference between DELETE, TRUNCATE and DROP?

DELETE (DML) removes rows one by one, supports WHERE, fires triggers, logs each row and keeps the identity counter. TRUNCATE (DDL) removes all rows by deallocating pages, is minimally logged and much faster, resets IDENTITY, doesn't fire triggers and isn't allowed on tables referenced by a foreign key. DROP removes the whole table definition, data, indexes and permissions. In SQL Server all three can be rolled back inside an explicit transaction.

## [Beginner|High] What are the different types of joins?

INNER JOIN (matching rows in both), LEFT/RIGHT OUTER JOIN (all rows from one side + matches, NULLs otherwise), FULL OUTER JOIN (all rows from both), CROSS JOIN (Cartesian product), SELF JOIN (table joined to itself, e.g. employee–manager). T-SQL also has CROSS APPLY/OUTER APPLY for correlated table expressions. Physical algorithms: nested loops, merge, hash.

## [Beginner|High] What is the difference between WHERE and HAVING?

WHERE filters individual rows **before** grouping and can't use aggregates. HAVING filters groups **after** GROUP BY and can use aggregates (`HAVING COUNT(*) > 5`). Put non-aggregate conditions in WHERE for performance — fewer rows get grouped.

## [Beginner|High] What is a primary key vs a unique key vs a foreign key?

Primary key: uniquely identifies each row, NOT NULL, one per table, creates a clustered index by default. Unique key: enforces uniqueness on other columns, allows one NULL in SQL Server, many per table, creates a non-clustered index by default. Foreign key: a column referencing another table's primary/unique key to enforce referential integrity (with cascade options).

## [Beginner|High] What is normalisation? Explain 1NF, 2NF and 3NF.

Organising tables to reduce redundancy and update anomalies. 1NF: atomic columns and no repeating groups. 2NF: 1NF and every non-key column depends on the **whole** primary key (no partial dependency — relevant for composite keys). 3NF: 2NF and no transitive dependency (non-key columns depend only on the key, e.g. move DeptName out of Employees into Departments). Data warehouses deliberately denormalise for read speed.

## [Beginner|High] Clustered vs non-clustered index?

A clustered index sorts and stores the table's data rows in key order — the leaf level is the data; only one per table. A non-clustered index is a separate structure with key columns and a pointer (clustered key or RID) back to the row; up to 999 per table. Clustered is ideal for range queries on the key; non-clustered for selective lookups on other columns, ideally covering with INCLUDE columns.

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

A Common Table Expression (`WITH name AS (...)`) is a named temporary result set for a single statement — improves readability, can be referenced multiple times in that statement, and supports recursion. A recursive CTE has an anchor member UNION ALL a recursive member referencing the CTE; used for hierarchies (org charts, category trees, bill of materials) and generating sequences. Default max recursion 100 (`OPTION (MAXRECURSION n)`).

## [Intermediate|High] Stored procedure vs function?

Procedures can return multiple result sets, output parameters and an integer return code; can modify data, use transactions and TRY/CATCH; are called with EXEC and can't be used inside SELECT. Functions return a scalar or a table, must be side-effect free (no INSERT/UPDATE to tables), can't use TRY/CATCH or transactions, and can be used in SELECT/WHERE/JOIN/APPLY. Prefer inline TVFs for reusable query logic.

## [Intermediate|High] What are the transaction isolation levels in SQL Server?

READ UNCOMMITTED (dirty reads possible; `NOLOCK`), READ COMMITTED (default; no dirty reads), REPEATABLE READ (no non-repeatable reads), SERIALIZABLE (no phantoms; range locks), SNAPSHOT (row versioning, consistent view as of transaction start, readers don't block writers), and READ COMMITTED SNAPSHOT (database setting making read committed use versioning per statement; default in Azure SQL Database). Higher isolation = more consistency, more blocking.

## [Intermediate|High] What is a deadlock and how do you handle it?

Two (or more) transactions each hold locks the other needs, so neither can proceed. SQL Server's lock monitor detects it and kills the cheapest transaction (error 1205). Investigate with the `system_health` Extended Events session (deadlock graphs). Prevent: access tables in a consistent order, keep transactions short, add indexes so fewer rows are locked, avoid user interaction inside transactions, use RCSI/SNAPSHOT for readers; and retry 1205 in the application.

## [Intermediate|High] Temp table vs table variable vs CTE?

Temp tables (`#t`) live in tempdb for the session/proc, have statistics, support any indexes, and are rolled back with transactions — good for larger intermediate data. Table variables (`@t`) are scoped to the batch, have no column statistics (estimates improved by 2019 deferred compilation), aren't affected by rollback, best for small sets. CTEs aren't stored at all — they're inlined into the single statement.

## [Intermediate|High] What makes a query non-SARGable? Give examples.

Using functions, calculations or conversions on an indexed column in WHERE/JOIN prevents index seeks: `WHERE YEAR(OrderDate) = 2026`, `WHERE ISNULL(Col, 0) = 5`, `WHERE Col + 1 = 10`, `LIKE '%abc'`, implicit conversions (nvarchar parameter vs varchar column). Rewrite as ranges or move the calculation to the parameter side: `OrderDate >= '2026-01-01' AND OrderDate < '2027-01-01'`.

## [Intermediate|Medium] What is the difference between ISNULL and COALESCE?

ISNULL(expr, replacement) is T-SQL-specific, takes two arguments, and returns the data type of the first. COALESCE(a, b, c, ...) is ANSI standard, takes many arguments, returns the first non-NULL and uses data type precedence; it's internally a CASE expression (may evaluate subqueries twice). Nullability of computed results also differs.

## [Intermediate|Medium] What are the magic tables in triggers?

`inserted` and `deleted` — virtual tables available inside DML triggers (and OUTPUT clauses). INSERT: `inserted` has new rows. DELETE: `deleted` has removed rows. UPDATE: `deleted` holds old values and `inserted` new values. Triggers fire once per statement, so always write set-based logic that handles multiple rows.

## [Advanced|High] What is parameter sniffing and how do you fix it?

When a parameterised query/proc compiles, the optimizer "sniffs" the first parameter values to estimate row counts and caches that plan. If data is skewed, later calls with different values reuse a plan that's bad for them (e.g. a nested-loop plan built for a customer with 5 orders reused for one with 5 million). Fixes: `OPTION (RECOMPILE)` for infrequent queries, `OPTIMIZE FOR UNKNOWN`/specific value, local variables (generic estimate), separate procedures for different data shapes, Query Store plan forcing, and SQL Server 2022's Parameter Sensitive Plan optimisation.

## [Advanced|High] How do you approach tuning a slow query?

1) Reproduce and measure (`SET STATISTICS IO, TIME ON`, actual execution plan, Query Store history). 2) Read the plan: scans on large tables, key lookups, bad estimates, spills, implicit conversions, parallelism issues. 3) Fix the query: SARGable predicates, remove `SELECT *`, avoid scalar UDFs/cursors (set-based), rewrite correlated subqueries, correct data types. 4) Fix indexes: covering/composite indexes in the right column order, filtered indexes, remove unused. 5) Update statistics; handle parameter sniffing. 6) Check blocking/waits (`sys.dm_exec_requests`, `sp_WhoIsActive`). 7) Validate the improvement and watch write overhead.

## [Advanced|Medium] What does NOLOCK do and why is it dangerous?

`WITH (NOLOCK)` = READ UNCOMMITTED for that table: no shared locks, so it isn't blocked by writers. Dangers: dirty reads of uncommitted data that may roll back, missing or duplicate rows due to page splits during scans, and errors (601) on data movement. It isn't a performance fix for blocking — use READ COMMITTED SNAPSHOT isolation instead, which gives non-blocking reads of committed data.

## [Advanced|Medium] Explain the backup types and recovery models.

Recovery models: SIMPLE (log truncated at checkpoint, no log backups, restore only to the last full/diff), FULL (all logged, log backups required, point-in-time restore), BULK_LOGGED (minimal logging for bulk ops, point-in-time limited). Backups: Full (whole DB), Differential (changes since the last full), Transaction log (log records since the last log backup — keeps the log from growing in FULL). Restore sequence: full → latest differential → all log backups in order (`STOPAT` for point in time). Test restores regularly.

## [Advanced|Low] What is lock escalation?

When a single statement acquires roughly 5,000+ row/page locks on one object, SQL Server may escalate to a table (or partition) lock to save memory, which increases blocking. Mitigate by batching large modifications (e.g. 4,000 rows at a time), proper indexes, `ALTER TABLE ... SET (LOCK_ESCALATION = AUTO)` for partitioned tables, or row versioning isolation.

## [Scenario|High] A report query that used to take 2 seconds now takes 2 minutes. Nothing in the code changed. What do you check?

Something changed in data or plans. Check Query Store for a **plan regression** (different plan since date X) and force the old plan as a stopgap; check **statistics** staleness after big data loads (update them); **parameter sniffing** (different first-call parameters); data growth crossing a threshold; new blocking (`sp_WhoIsActive`, wait stats); index changes or dropped indexes; server pressure (memory grants, tempdb spills, CPU). Then fix permanently with indexes/query rewrite.

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

Customers(CustomerId PK, Name, Email UNIQUE), Addresses(AddressId, CustomerId FK, ...), Products(ProductId PK, Sku UNIQUE, Name, Price, CategoryId FK), Categories(self-referencing ParentId), Orders(OrderId PK, CustomerId FK, OrderDate, Status, ShippingAddressId FK, Total), OrderItems(OrderId FK, ProductId FK, Qty, UnitPrice — copy the price at order time; PK (OrderId, ProductId) or surrogate), Payments(PaymentId, OrderId FK, Amount, Method, Status, ProviderRef UNIQUE), Inventory(ProductId, WarehouseId, Qty, RowVersion). Indexes on FKs and common filters (Orders(CustomerId, OrderDate DESC)), CHECK constraints (Qty > 0), rowversion for concurrency, audit columns.

## [Scenario|Medium] You must load 50 million rows into a table that is queried 24/7. How do you avoid downtime?

Load into a **staging table** with the same structure (bulk insert, minimal logging, no indexes during load, then build indexes), validate, then **partition switch** it into the main partitioned table (metadata-only, near-instant) or swap via `sp_rename` inside a short transaction. Alternatively insert in small batches with throttling during low traffic. Use RCSI so readers aren't blocked, and keep statistics updated afterwards.

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
