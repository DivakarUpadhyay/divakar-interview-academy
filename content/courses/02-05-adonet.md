---
slug: adonet
title: ADO.NET & Dapper
track: dotnet
order: 5
icon: ADO
color: #364fc7
summary: Connected vs disconnected architecture, SqlConnection, SqlCommand, DataReader, DataSet/DataAdapter, parameters, stored procedures, transactions, connection pooling, bulk copy, async and Dapper micro-ORM.
---

# Overview

**ADO.NET** is the low-level data access API in .NET (`System.Data`). Every ORM — Entity Framework, Dapper — is built on it. Interviews ask about it because it shows you understand what happens between your code and the database.

Two architectures:

- **Connected** — `DbConnection` + `DbCommand` + `DbDataReader`: open a connection, stream rows forward-only, close. Fast, low memory.
- **Disconnected** — `DataAdapter` fills an in-memory `DataSet`/`DataTable`; the connection is closed while you work; changes are pushed back with `Update()`.

Providers: `Microsoft.Data.SqlClient` (SQL Server — the current, recommended package; `System.Data.SqlClient` is deprecated), `Npgsql` (PostgreSQL), `MySqlConnector`, `Oracle.ManagedDataAccess.Core`, `Microsoft.Data.Sqlite`.

**Dapper** (Stack Overflow, 2011) is a micro-ORM: extension methods on `IDbConnection` that map query results to objects, keeping SQL fully in your control with near-ADO.NET speed.

# Versions

| Year | Milestone |
|---|---|
| 2002 | ADO.NET 1.0 with .NET Framework 1.0 (successor of COM-based ADO) |
| 2005 | ADO.NET 2.0: provider factories (`DbProviderFactory`), `SqlBulkCopy`, MARS, async-ish APIs |
| 2008 | .NET 3.5: LINQ to SQL, LINQ to DataSet; EF 1.0 (SP1) |
| 2012 | .NET 4.5: real `async` (`OpenAsync`, `ExecuteReaderAsync`) |
| 2011 | Dapper released by Stack Overflow |
| 2019 | **Microsoft.Data.SqlClient** 1.0 — new SQL Server driver shipped via NuGet |
| 2022–2025 | Microsoft.Data.SqlClient 5.x/6.x: TDS 8 / strict encryption, `Encrypt=true` by default (4.0+), Entra ID (Azure AD) authentication, `SqlBatch` (.NET 6 `DbBatch`) |

> **Breaking-change gotcha:** Microsoft.Data.SqlClient 4.0+ defaults to `Encrypt=True`. Local dev servers with self-signed certificates need `TrustServerCertificate=True` (dev only).

# Lifecycle

**Connected access lifecycle:**

1. Create `SqlConnection` with a connection string.
2. `Open()`/`OpenAsync()` — gets a physical connection **from the pool** (or creates one).
3. Create `SqlCommand` (SQL text or stored procedure) + **parameters**.
4. Execute: `ExecuteReader` (rows), `ExecuteScalar` (single value), `ExecuteNonQuery` (rows affected).
5. Read with `SqlDataReader.Read()` forward-only, column by column.
6. Close/Dispose reader → command → connection (with `using`) — the connection **returns to the pool**, not physically closed.

**Disconnected lifecycle:** `SqlDataAdapter.Fill(dataSet)` (opens and closes the connection automatically) → work offline (edit rows; each `DataRow` has a `RowState`: Added, Modified, Deleted, Unchanged) → `adapter.Update(dataSet)` generates INSERT/UPDATE/DELETE (via `SqlCommandBuilder` or explicit commands) → `AcceptChanges()`.

**Transaction lifecycle:** `BeginTransaction()` → assign to every command → execute → `Commit()` or `Rollback()` (automatic rollback on dispose without commit).

# Tools

- **SQL Server Management Studio (SSMS)** / **Azure Data Studio** (retiring Feb 2026 in favour of the VS Code MSSQL extension) — write and test SQL.
- **SQL Server Profiler / Extended Events** — see what your app sends.
- **Visual Studio Server Explorer / SQL Server Object Explorer**.
- **Dapper**, **Dapper.Contrib**, **DbUp** (migrations as SQL scripts), **RepoDB**.
- **Testcontainers for .NET** — real SQL Server in Docker for tests.
- **Polly** — retry transient SQL errors (or `SqlRetryLogicProvider` in SqlClient 3.0+).

# Module: Connected Architecture

## Lesson: [Basic|High] Core objects and the connected model

| Object | Role |
|---|---|
| `SqlConnection` | Connection to the DB (pooled) |
| `SqlCommand` | SQL statement or stored procedure |
| `SqlParameter` | Typed parameter value — prevents SQL injection |
| `SqlDataReader` | Fast, forward-only, read-only stream of rows |
| `SqlDataAdapter` | Bridge between DB and `DataSet` |
| `DataSet` / `DataTable` | In-memory relational data |
| `SqlTransaction` | Groups commands atomically |
| `SqlBulkCopy` | High-speed bulk insert |

```csharp
const string cs = "Server=.;Database=Shop;Integrated Security=True;TrustServerCertificate=True";

await using var conn = new SqlConnection(cs);
await conn.OpenAsync(ct);

await using var cmd = new SqlCommand("SELECT Id, Name, Price FROM Products WHERE CategoryId = @cat", conn);
cmd.Parameters.Add("@cat", SqlDbType.Int).Value = categoryId;

await using var reader = await cmd.ExecuteReaderAsync(ct);
var list = new List<Product>();
while (await reader.ReadAsync(ct))
{
    list.Add(new Product(
        reader.GetInt32(0),
        reader.GetString(1),
        reader.GetDecimal(2)));
}
```

Use ordinal getters (`GetInt32(0)`) or cache `reader.GetOrdinal("Name")` for speed; check `reader.IsDBNull(i)` before reading nullable columns.

## Lesson: [Basic|High] ExecuteReader vs ExecuteScalar vs ExecuteNonQuery

```csharp
// ExecuteScalar — first column of first row
var count = (int)(await new SqlCommand("SELECT COUNT(*) FROM Orders", conn).ExecuteScalarAsync())!;

// ExecuteNonQuery — INSERT/UPDATE/DELETE/DDL; returns rows affected
var cmd = new SqlCommand("UPDATE Products SET Price = Price * 1.1 WHERE CategoryId = @c", conn);
cmd.Parameters.AddWithValue("@c", 3);
int affected = await cmd.ExecuteNonQueryAsync();

// Insert and get the new identity in one round trip
var ins = new SqlCommand("INSERT INTO Customers(Name) OUTPUT INSERTED.Id VALUES (@n)", conn);
ins.Parameters.Add("@n", SqlDbType.NVarChar, 100).Value = "Acme";
int newId = (int)(await ins.ExecuteScalarAsync())!;
```

Multiple result sets: `reader.NextResult()` / `NextResultAsync()` moves to the next SELECT's results.

## Lesson: [Basic|High] Parameters and SQL injection

```csharp
// ❌ NEVER — SQL injection: name = "x'; DROP TABLE Users;--"
var bad = new SqlCommand("SELECT * FROM Users WHERE Name = '" + name + "'", conn);

// ✅ Parameterised
var good = new SqlCommand("SELECT * FROM Users WHERE Name = @name", conn);
good.Parameters.Add("@name", SqlDbType.NVarChar, 50).Value = name;
```

- Parameters send values separately from SQL text — they are never executed as code.
- Prefer `Parameters.Add(name, SqlDbType, size)` over `AddWithValue`: `AddWithValue` infers the type (e.g. `nvarchar(4000)` for strings), which can cause **implicit conversions** that prevent index seeks (varchar column vs nvarchar parameter) and plan-cache bloat.
- Pass `DBNull.Value` for nulls, not `null`.
- Dynamic table/column names can't be parameters — validate against an allow-list or use `QUOTENAME` in SQL.

## Lesson: [Intermediate|High] Stored procedures and output parameters

```csharp
await using var cmd = new SqlCommand("dbo.usp_PlaceOrder", conn) { CommandType = CommandType.StoredProcedure };
cmd.Parameters.Add("@CustomerId", SqlDbType.Int).Value = customerId;
cmd.Parameters.Add("@Total", SqlDbType.Decimal).Value = total;
var outId = cmd.Parameters.Add("@OrderId", SqlDbType.Int);
outId.Direction = ParameterDirection.Output;
var ret = cmd.Parameters.Add("@ReturnValue", SqlDbType.Int);
ret.Direction = ParameterDirection.ReturnValue;

await cmd.ExecuteNonQueryAsync();
int orderId = (int)outId.Value;
int status = (int)ret.Value;
```

Table-valued parameters (TVP) send many rows in one call:

```csharp
var table = new DataTable();
table.Columns.Add("ProductId", typeof(int));
table.Columns.Add("Qty", typeof(int));
foreach (var l in lines) table.Rows.Add(l.ProductId, l.Qty);

var p = cmd.Parameters.AddWithValue("@Lines", table);
p.SqlDbType = SqlDbType.Structured;
p.TypeName = "dbo.OrderLineType";      // CREATE TYPE dbo.OrderLineType AS TABLE (ProductId INT, Qty INT)
```

# Module: Disconnected Architecture

## Lesson: [Intermediate|Medium] DataSet, DataTable and DataAdapter

```csharp
var ds = new DataSet();
using var da = new SqlDataAdapter("SELECT Id, Name, Price FROM Products", cs);
da.Fill(ds, "Products");                  // opens + closes connection automatically

DataTable t = ds.Tables["Products"]!;
foreach (DataRow row in t.Rows) Console.WriteLine($"{row["Name"]}: {row["Price"]}");

t.Rows[0]["Price"] = 999m;                // RowState = Modified
var cb = new SqlCommandBuilder(da);       // auto-generates INSERT/UPDATE/DELETE (needs a primary key)
da.Update(ds, "Products");                // pushes changes back

DataView view = new(t) { RowFilter = "Price > 1000", Sort = "Price DESC" };
```

| DataReader | DataSet |
|---|---|
| Connected, forward-only, read-only | Disconnected, in-memory, random access, editable |
| Very fast, low memory | Heavier; holds all rows |
| One row at a time | Multiple tables + relations + constraints |
| Best for APIs, reports streaming | Legacy WinForms grids, offline editing, XML serialisation |

Modern apps rarely use DataSets; they map to POCOs with Dapper/EF.

# Module: Transactions, Pooling and Performance

## Lesson: [Intermediate|High] Transactions

```csharp
await using var conn = new SqlConnection(cs);
await conn.OpenAsync();
await using var tx = (SqlTransaction)await conn.BeginTransactionAsync(IsolationLevel.ReadCommitted);
try
{
    var debit = new SqlCommand("UPDATE Accounts SET Balance = Balance - @amt WHERE Id = @from AND Balance >= @amt", conn, tx);
    debit.Parameters.Add("@amt", SqlDbType.Decimal).Value = amount;
    debit.Parameters.Add("@from", SqlDbType.Int).Value = fromId;
    if (await debit.ExecuteNonQueryAsync() != 1) throw new InvalidOperationException("Insufficient funds");

    var credit = new SqlCommand("UPDATE Accounts SET Balance = Balance + @amt WHERE Id = @to", conn, tx);
    credit.Parameters.Add("@amt", SqlDbType.Decimal).Value = amount;
    credit.Parameters.Add("@to", SqlDbType.Int).Value = toId;
    await credit.ExecuteNonQueryAsync();

    await tx.CommitAsync();
}
catch
{
    await tx.RollbackAsync();
    throw;
}
```

`TransactionScope` (System.Transactions) gives ambient transactions across multiple connections/resources: create with `TransactionScopeAsyncFlowOption.Enabled` for async code; it can escalate to a distributed transaction (MSDTC) if several connections are involved — avoid that in cloud apps.

## Lesson: [Intermediate|High] Connection pooling

- Opening a physical connection is expensive (TCP, TLS, login). ADO.NET keeps a **pool per unique connection string** (and per Windows identity for integrated security).
- `Open()` takes a connection from the pool; `Close()`/`Dispose()` returns it.
- Defaults (SqlClient): `Min Pool Size=0`, `Max Pool Size=100`, `Pooling=true`, `Connection Timeout=15`.
- **Pool exhaustion** ("Timeout expired. The timeout period elapsed prior to obtaining a connection from the pool") = connections not disposed, long-running transactions, or too many concurrent requests.
- Different connection strings (even a different space/order) create separate pools — build them once from config.
- Keep connections open as **briefly** as possible: open late, close early, always with `using`.

## Lesson: [Intermediate|Medium] Bulk operations and async

```csharp
using var bulk = new SqlBulkCopy(conn, SqlBulkCopyOptions.TableLock, tx)
{
    DestinationTableName = "dbo.StagingSales",
    BatchSize = 10_000,
    BulkCopyTimeout = 600
};
bulk.ColumnMappings.Add("Date", "SaleDate");
bulk.ColumnMappings.Add("Amount", "Amount");
await bulk.WriteToServerAsync(dataTableOrDataReader);   // streams rows using the bulk insert protocol
```

- `SqlBulkCopy` loads millions of rows in seconds vs minutes with row-by-row INSERTs.
- Use **async** APIs (`OpenAsync`, `ExecuteReaderAsync`, `ReadAsync`) in web apps to free threads during I/O.
- `CommandTimeout` default is 30 seconds; set it per command for long reports.
- Batch many statements with `SqlBatch`/`DbBatch` (.NET 6+) or TVPs instead of N round trips.

## Lesson: [Intermediate|High] Dapper micro-ORM

```csharp
using Dapper;

await using var conn = new SqlConnection(cs);

// Query → objects (parameters are anonymous objects; always parameterised)
var products = await conn.QueryAsync<Product>(
    "SELECT Id, Name, Price FROM Products WHERE CategoryId = @CategoryId AND Price > @Min",
    new { CategoryId = 3, Min = 500m });

var one = await conn.QuerySingleOrDefaultAsync<Product>("SELECT * FROM Products WHERE Id = @id", new { id });
int rows = await conn.ExecuteAsync("UPDATE Products SET Price = @Price WHERE Id = @Id", new { Id = 5, Price = 99m });

// IN list expansion
var some = await conn.QueryAsync<Product>("SELECT * FROM Products WHERE Id IN @Ids", new { Ids = new[] { 1, 2, 3 } });

// Multi-mapping (JOIN → object graph)
var orders = await conn.QueryAsync<Order, Customer, Order>(
    "SELECT o.*, c.* FROM Orders o JOIN Customers c ON c.Id = o.CustomerId",
    (o, c) => { o.Customer = c; return o; }, splitOn: "Id");

// Multiple result sets
using var multi = await conn.QueryMultipleAsync("SELECT * FROM Orders WHERE Id=@id; SELECT * FROM OrderLines WHERE OrderId=@id", new { id });
var order = await multi.ReadSingleAsync<Order>();
order.Lines = (await multi.ReadAsync<OrderLine>()).ToList();

// Stored procedure
var report = await conn.QueryAsync<SalesRow>("dbo.usp_SalesReport", new { Year = 2026 }, commandType: CommandType.StoredProcedure);

// Transaction
await conn.OpenAsync();
await using var tx = await conn.BeginTransactionAsync();
await conn.ExecuteAsync("INSERT ...", param, tx);
await tx.CommitAsync();
```

**Dapper vs EF Core:** Dapper — full SQL control, fastest mapping, great for reads/reports/stored procedures; no change tracking, migrations or LINQ. EF Core — productivity, LINQ, change tracking, migrations, relationships. Many systems use **both**: EF Core for writes (commands), Dapper for complex reads (queries) — a light CQRS.

# Interview

## [Beginner|High] What is ADO.NET? Name its main objects.

ADO.NET is .NET's core data access library (`System.Data` + provider packages). Main objects: `Connection` (connects to the DB), `Command` (executes SQL/procs), `Parameter`, `DataReader` (forward-only fast read), `DataAdapter` (fills/updates DataSets), `DataSet`/`DataTable` (in-memory data), `Transaction`. For SQL Server use `Microsoft.Data.SqlClient` (`SqlConnection`, `SqlCommand`...).

## [Beginner|High] What is the difference between connected and disconnected architecture?

Connected: the connection stays open while you read with a `DataReader` — forward-only, read-only, very fast, minimal memory. Disconnected: a `DataAdapter` fills a `DataSet`/`DataTable`, then closes the connection; you can navigate, edit and later push changes back with `Update()` — more memory, more flexibility. Modern apps mostly use the connected model (directly or via Dapper/EF).

## [Beginner|High] What is the difference between ExecuteReader, ExecuteScalar and ExecuteNonQuery?

`ExecuteReader` returns a `DataReader` for one or more result sets. `ExecuteScalar` returns the first column of the first row (COUNT, SUM, new identity via `OUTPUT`/`SCOPE_IDENTITY()`). `ExecuteNonQuery` runs INSERT/UPDATE/DELETE/DDL and returns the number of rows affected (-1 for statements that don't affect rows, or when `SET NOCOUNT ON` is set).

## [Beginner|High] DataReader vs DataSet?

DataReader: connected, forward-only, read-only, one row at a time, fastest and lowest memory — use for streaming results to APIs. DataSet: disconnected, in-memory collection of DataTables with relations and constraints, random access and editable, can be serialised to XML — heavier; used in legacy WinForms/reporting. EF/Dapper map to objects instead.

## [Beginner|High] How do you prevent SQL injection in ADO.NET?

Always use parameters (`@name` placeholders + `SqlParameter` with explicit type/size) or stored procedures with parameters — never concatenate user input into SQL. Validate input, use least-privilege DB accounts, and for dynamic identifiers (table/column names) use an allow-list. ORMs (EF, Dapper) parameterise automatically.

## [Beginner|Medium] What is the `using` statement's role with SqlConnection?

`SqlConnection`, `SqlCommand` and `SqlDataReader` implement `IDisposable`. `using` guarantees `Dispose()` (which closes the connection and returns it to the pool) even if an exception occurs. Forgetting to dispose leaks pooled connections and eventually causes pool-timeout errors.

## [Intermediate|High] What is connection pooling? How do you troubleshoot pool exhaustion?

ADO.NET reuses open physical connections from a pool keyed by the exact connection string. `Open()` borrows, `Close()/Dispose()` returns. Default max is 100 per pool. Exhaustion symptoms: "Timeout expired… obtaining a connection from the pool". Causes: missing `using`/dispose, connections held across long work or `await`s of slow external calls, long transactions, or traffic beyond 100 concurrent DB operations. Fix: dispose properly, shorten connection lifetimes, async I/O, raise `Max Pool Size` only after fixing leaks, monitor with performance counters/`sys.dm_exec_sessions`.

## [Intermediate|High] How do you implement a transaction in ADO.NET?

`var tx = conn.BeginTransaction(isolationLevel)`, assign `tx` to every command (`new SqlCommand(sql, conn, tx)`), execute, then `tx.Commit()`; on exception `tx.Rollback()`. Disposing an uncommitted transaction rolls it back. For multiple connections/resources use `TransactionScope` (async flow enabled), avoiding distributed escalation in the cloud. Keep transactions short to reduce locking.

## [Intermediate|High] Why is `AddWithValue` considered bad practice?

It infers the SQL type from the .NET value: strings become `nvarchar` with a length equal to the value, decimals get inferred precision. Mismatches with column types (e.g. `varchar` column vs `nvarchar` parameter) force implicit conversions that can turn index seeks into scans, and varying lengths create many cached plans. Use `Parameters.Add("@p", SqlDbType.VarChar, 50).Value = x` with explicit type and size.

## [Intermediate|High] How do you call a stored procedure with output parameters?

Set `CommandType = CommandType.StoredProcedure`, add input parameters, add an output parameter with `Direction = ParameterDirection.Output` (and size for strings), optionally a `ReturnValue` parameter, execute (`ExecuteNonQuery`), then read `param.Value` after execution (after closing the reader if you used `ExecuteReader`).

## [Intermediate|Medium] What is SqlBulkCopy and when do you use it?

A class that streams large volumes of rows into a SQL Server table using the bulk insert protocol — from a `DataTable`, `DataReader` or `DataRow[]`. It's orders of magnitude faster than individual INSERTs. Configure `BatchSize`, `BulkCopyTimeout`, column mappings and `TableLock`. Typical use: ETL staging loads, imports from CSV/Excel. Load into a staging table, then MERGE into the final table.

## [Intermediate|Medium] What is MARS?

Multiple Active Result Sets (`MultipleActiveResultSets=True` in the connection string) lets you have more than one open `DataReader` (or execute commands while reading) on the same connection. Useful in some EF lazy-loading scenarios, but it adds overhead; usually better to restructure queries.

## [Intermediate|High] What is Dapper and how does it compare with EF Core and raw ADO.NET?

Dapper is a micro-ORM: extension methods (`Query<T>`, `Execute`, `QueryMultiple`) on `IDbConnection` that map rows to objects using cached IL. Compared with raw ADO.NET it removes mapping boilerplate with almost the same speed; compared with EF Core it has no change tracking, LINQ, migrations or relationship management — you write all SQL. Use Dapper for read-heavy, performance-critical or complex SQL/stored procedures; EF Core for domain-rich write models. They combine well.

## [Advanced|Medium] How do you handle transient errors (e.g. Azure SQL failovers) in ADO.NET?

Use retry logic for transient error numbers (e.g. 40613, 40501, 40197, 10928/10929, 4060, 49918–49920, timeouts): SqlClient's configurable retry logic (`SqlRetryLogicBaseProvider` via `RetryLogicProvider` on the connection/command), Polly with exponential backoff, or EF Core's `EnableRetryOnFailure`. Only retry idempotent operations or whole transactions, and keep `Connect Retry Count` for idle connection resiliency.

## [Advanced|Medium] How would you pass a list of 5,000 IDs to a SQL query efficiently?

Options: a **table-valued parameter** (TVP; best for SQL Server; plan-stable), `STRING_SPLIT` on a delimited string or `OPENJSON` on a JSON array parameter (EF Core 8 does this for `Contains`), or bulk-insert into a temp/staging table and join. Avoid building `IN (1,2,3,...)` strings — injection risk, plan-cache pollution and the 2,100-parameter limit for individual parameters.

## [Scenario|High] Under load the API logs "Timeout expired. The timeout period elapsed prior to obtaining a connection from the pool." How do you fix it?

Pool exhaustion. 1) Search for connections/readers not in `using` blocks and for code holding connections across slow calls (HTTP, file I/O) or long transactions. 2) Check sync-over-async blocking that keeps connections open longer. 3) Check slow queries (Query Store) — slow queries hold connections. 4) Monitor active connections (`sys.dm_exec_sessions` by program name). 5) Only then tune `Max Pool Size`, and consider caching or fewer round trips (batching). Also ensure one consistent connection string.

## [Scenario|High] You must import a 2-million-row CSV into SQL Server nightly. How would you do it in .NET?

Stream the file (don't load it all) with a CSV reader (CsvHelper) exposing an `IDataReader` or batches of `DataTable`s; `SqlBulkCopy` into a staging table with `TableLock` and a batch size (10k–50k); then a set-based stored procedure validates and `MERGE`s/`INSERT`s into target tables inside a transaction; log rejected rows; make it idempotent (truncate staging first, track file/batch IDs). Alternatives: SSIS or Azure Data Factory for ops-managed pipelines.

## [Scenario|Medium] A query is fast in SSMS but slow from the application. Why?

Common causes: (1) **different SET options** — SSMS uses `ARITHABORT ON`, apps usually OFF, so they get different cached plans; (2) **parameter sniffing** — the app's cached plan was compiled for an atypical parameter value; (3) parameter **type mismatch** (nvarchar parameter vs varchar column → implicit conversion, scan); (4) app reading huge result sets slowly or network latency. Investigate with Query Store / actual execution plans, fix types, consider `OPTION (RECOMPILE)` or `OPTIMIZE FOR`, update statistics, add proper indexes.

# Cheatsheet

## Core objects

`SqlConnection` · `SqlCommand` · `SqlParameter` · `SqlDataReader` · `SqlDataAdapter` · `DataSet`/`DataTable`/`DataView` · `SqlTransaction` · `SqlBulkCopy` · `SqlCommandBuilder`.

## Execute methods

| Method | Returns | Use |
|---|---|---|
| `ExecuteReader` | DataReader | SELECT rows |
| `ExecuteScalar` | object (1 value) | COUNT, new ID |
| `ExecuteNonQuery` | int rows affected | INSERT/UPDATE/DELETE/DDL |
| `ExecuteXmlReader` | XmlReader | FOR XML queries |

## Template

```csharp
await using var conn = new SqlConnection(cs);
await conn.OpenAsync(ct);
await using var cmd = new SqlCommand(sql, conn);
cmd.Parameters.Add("@id", SqlDbType.Int).Value = id;
await using var r = await cmd.ExecuteReaderAsync(ct);
while (await r.ReadAsync(ct)) { var name = r.GetString(r.GetOrdinal("Name")); }
```

## Connection string keys

`Server` · `Database` · `Integrated Security=True` / `User Id`+`Password` / `Authentication=Active Directory Default` · `Encrypt=True` · `TrustServerCertificate=True` (dev) · `Max Pool Size` · `Connect Timeout` · `MultipleActiveResultSets` · `Application Name`.

## Dapper

`Query<T>` · `QueryFirstOrDefault<T>` · `QuerySingle<T>` · `Execute` · `ExecuteScalar<T>` · `QueryMultiple` · multi-mapping `splitOn` · `IN @Ids` · `commandType: CommandType.StoredProcedure` · pass `transaction`.

## Remember

Always parameterise · explicit `SqlDbType` + size · `using`/`await using` · open late, close early · pool max 100 · `Encrypt=True` default in SqlClient 4+ · `SqlBulkCopy` for bulk · TVP for lists · retry transient errors.
