---
slug: dapper
title: Dapper — The Micro-ORM from Basics to Advanced
track: dotnet
order: 10
group: Data Access
icon: Dp
color: #2f9e44
summary: What Dapper is and how it works inside, Query/QueryFirst/QuerySingle/Execute, parameters and SQL injection safety, stored procedures and output parameters, multi-mapping joins, QueryMultiple, transactions, bulk inserts and table-valued parameters, async and buffering, custom type handlers, DynamicParameters, repository and unit-of-work patterns, Dapper vs EF Core vs ADO.NET, performance and testing.
---

# Overview

**Dapper** is a lightweight object mapper ("micro-ORM") created by Stack Overflow (Sam Saffron and Marc Gravell, 2011). It adds extension methods to `IDbConnection` that run **your SQL** and map the results to objects — nearly as fast as hand-written ADO.NET, with a fraction of the code.

| | ADO.NET | Dapper | EF Core |
|---|---|---|---|
| You write SQL | Yes | **Yes** | No (LINQ → SQL), optional raw SQL |
| Mapping rows to objects | Manual (`reader["Name"]`) | Automatic by column name | Automatic |
| Change tracking, migrations, relationships | No | No | Yes |
| Performance | Fastest (manual) | ~Same as ADO.NET | Good, more overhead |
| Code volume | High | Low | Lowest for CRUD |
| Best for | Special cases, bulk | Reports, read-heavy APIs, stored procedures, performance-critical paths | Domain models, CRUD, complex writes |

Many teams combine them: **EF Core for writes, Dapper for complex reads/reports** (CQRS-lite).

# Versions

| Year | Milestone |
|---|---|
| 2011 | Dapper open-sourced by Stack Overflow |
| 2012–2016 | Multi-mapping, QueryMultiple, async methods, .NET Core support |
| 2017 | Dapper 1.50+ for .NET Standard |
| 2019 | Dapper 2.0 — modern target frameworks |
| 2023 | Dapper 2.1 — AOT-friendlier work begins; **Dapper.AOT** (source-generated, no runtime reflection emit) |
| 2024–2025 | Dapper 2.1.x maintained; works with `Microsoft.Data.SqlClient`, Npgsql, MySqlConnector, SQLite |

Related packages: **Dapper.Contrib** / **Dapper.SimpleCRUD** (generated CRUD), **Dapper.AOT**, **DapperQueryBuilder**, **Dapper.Bulk**.

# Lifecycle

**What happens when you call `connection.Query<Order>(sql, new { CustomerId = 42 })`:**

1. Dapper builds a **cache key** from the SQL text, the parameter object's type and the result type.
2. First time only: it generates (via IL emit / compiled code) a **parameter writer** that turns the anonymous object's properties into `DbParameter`s, and a **row mapper** that reads a `DbDataReader` row into an `Order` by matching column names to properties/constructor parameters. These are cached — later calls are fast.
3. Opens the connection if it is closed (and closes it again afterwards).
4. Creates a `DbCommand`, adds parameters, executes `ExecuteReader`.
5. Maps each row with the cached mapper; with `buffered: true` (default) it reads all rows into a `List<T>` before returning.
6. Disposes the reader and command.

# Tools

- NuGet: `Dapper`, `Microsoft.Data.SqlClient` (SQL Server), `Npgsql`, `MySqlConnector`, `Microsoft.Data.Sqlite`.
- SQL Server Management Studio / Azure Data Studio for writing and tuning SQL; actual execution plans.
- MiniProfiler (also from Stack Overflow) to see SQL timings per request.
- Testcontainers (real SQL Server in Docker) for integration tests.

# Module: Dapper Basics

## Lesson: [Basic|High] Setup and the core methods

```csharp
// dotnet add package Dapper
// dotnet add package Microsoft.Data.SqlClient
using Dapper;
using Microsoft.Data.SqlClient;

public record Product(int Id, string Name, string Category, decimal Price);

await using var conn = new SqlConnection(connectionString);

// Many rows
IEnumerable<Product> all = await conn.QueryAsync<Product>("SELECT Id, Name, Category, Price FROM dbo.Products");

// Exactly one row expected
Product p = await conn.QuerySingleAsync<Product>("SELECT * FROM dbo.Products WHERE Id = @Id", new { Id = 5 });

// First or nothing
Product? maybe = await conn.QueryFirstOrDefaultAsync<Product>(
    "SELECT TOP 1 * FROM dbo.Products WHERE Category = @Cat ORDER BY Price", new { Cat = "Pens" });

// Scalar value
int count = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM dbo.Products");

// INSERT/UPDATE/DELETE — returns affected rows
int rows = await conn.ExecuteAsync("UPDATE dbo.Products SET Price = Price * 1.1 WHERE Category = @Cat", new { Cat = "Pens" });

// Insert and get the new id
int newId = await conn.QuerySingleAsync<int>(
    "INSERT INTO dbo.Products (Name, Category, Price) OUTPUT INSERTED.Id VALUES (@Name, @Category, @Price)",
    new { Name = "Gel pen", Category = "Pens", Price = 25m });
```

| Method | Rows expected | Throws when |
|---|---|---|
| `Query<T>` | 0..n | — |
| `QueryFirst<T>` | ≥ 1 (takes first) | 0 rows |
| `QueryFirstOrDefault<T>` | 0..n (takes first) | — |
| `QuerySingle<T>` | exactly 1 | 0 or > 1 rows |
| `QuerySingleOrDefault<T>` | 0 or 1 | > 1 rows |
| `Execute` | — (returns affected count) | — |
| `ExecuteScalar<T>` | first column of first row | — |

**Mapping rules:** column names match property names case-insensitively; use SQL aliases when names differ (`SELECT ProductName AS Name`); records/classes with constructors are matched by parameter names; set `DefaultTypeMap.MatchNamesWithUnderscores = true` to map `product_name` → `ProductName`.

## Lesson: [Basic|High] Parameters, SQL injection and IN lists

Dapper always sends values as **real parameters** — never concatenate user input into SQL.

```csharp
// ❌ SQL injection: name = "x'; DROP TABLE Products;--"
var bad = conn.Query<Product>($"SELECT * FROM Products WHERE Name = '{name}'");

// ✅ parameterised
var good = conn.Query<Product>("SELECT * FROM Products WHERE Name = @name", new { name });

// IN list: Dapper expands a collection into (@ids1, @ids2, ...)
var some = conn.Query<Product>("SELECT * FROM Products WHERE Id IN @ids", new { ids = new[] { 1, 2, 3 } });

// Explicit types/sizes with DynamicParameters (helps plan caching for strings)
var p = new DynamicParameters();
p.Add("@Name", name, DbType.String, size: 200);
p.Add("@Category", new DbString { Value = cat, IsAnsi = true, Length = 100 });  // VARCHAR, avoids implicit conversion
var result = conn.Query<Product>("SELECT * FROM Products WHERE Name = @Name AND Category = @Category", p);
```

Dynamic sort columns or table names **can't** be parameters — whitelist them:

```csharp
string orderBy = sort switch { "price" => "Price", "name" => "Name", _ => "Id" };   // never use raw input
var sql = $"SELECT * FROM Products ORDER BY {orderBy} OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY";
```

## Lesson: [Intermediate|High] Stored procedures, output parameters and return values

```csharp
var p = new DynamicParameters();
p.Add("@CustomerId", 42);
p.Add("@FromDate", new DateTime(2026, 1, 1));
p.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);
p.Add("@ReturnValue", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

var orders = await conn.QueryAsync<OrderDto>("dbo.usp_GetCustomerOrders", p, commandType: CommandType.StoredProcedure);

int total = p.Get<int>("@TotalCount");      // read after the reader is consumed
int ret = p.Get<int>("@ReturnValue");
```

```sql
CREATE OR ALTER PROCEDURE dbo.usp_GetCustomerOrders
    @CustomerId INT, @FromDate DATE, @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT @TotalCount = COUNT(*) FROM dbo.Orders WHERE CustomerId = @CustomerId AND OrderDate >= @FromDate;
    SELECT Id, OrderDate, Total FROM dbo.Orders WHERE CustomerId = @CustomerId AND OrderDate >= @FromDate ORDER BY OrderDate DESC;
    RETURN 0;
END
```

# Module: Advanced Queries

## Lesson: [Intermediate|High] Multi-mapping — joins into object graphs

```csharp
public class Order { public int Id { get; set; } public DateTime OrderDate { get; set; } public Customer Customer { get; set; } = null!; public List<OrderLine> Lines { get; } = []; }
public class Customer { public int Id { get; set; } public string Name { get; set; } = ""; }
public class OrderLine { public int Id { get; set; } public string Product { get; set; } = ""; public int Qty { get; set; } }

// One-to-one: Order + Customer
var sql = @"SELECT o.Id, o.OrderDate, c.Id, c.Name
            FROM dbo.Orders o JOIN dbo.Customers c ON c.Id = o.CustomerId";
var orders = await conn.QueryAsync<Order, Customer, Order>(sql,
    (order, customer) => { order.Customer = customer; return order; },
    splitOn: "Id");          // where the second object's columns start (default "Id")

// One-to-many: Orders + Lines — de-duplicate parents with a dictionary
var lookup = new Dictionary<int, Order>();
var sql2 = @"SELECT o.Id, o.OrderDate, l.Id, l.Product, l.Qty
             FROM dbo.Orders o JOIN dbo.OrderLines l ON l.OrderId = o.Id
             WHERE o.CustomerId = @cid";
await conn.QueryAsync<Order, OrderLine, Order>(sql2, (o, l) =>
{
    if (!lookup.TryGetValue(o.Id, out var existing)) lookup[o.Id] = existing = o;
    existing.Lines.Add(l);
    return existing;
}, new { cid = 42 }, splitOn: "Id");
var result = lookup.Values.ToList();
```

`splitOn` names the first column of each subsequent object; if your second table's key isn't called `Id`, pass its column name (e.g. `splitOn: "CustomerId"`).

## Lesson: [Intermediate|High] QueryMultiple, transactions and bulk operations

```csharp
// Several result sets in one round trip
using (var multi = await conn.QueryMultipleAsync(@"
    SELECT * FROM dbo.Customers WHERE Id = @id;
    SELECT * FROM dbo.Orders WHERE CustomerId = @id;
    SELECT COUNT(*) FROM dbo.Complaints WHERE CustomerId = @id;", new { id = 42 }))
{
    var customer = await multi.ReadSingleAsync<Customer>();
    var orders = (await multi.ReadAsync<Order>()).ToList();
    var complaints = await multi.ReadSingleAsync<int>();
}

// Transactions
await conn.OpenAsync();
await using var tx = await conn.BeginTransactionAsync();
try
{
    var orderId = await conn.QuerySingleAsync<int>(
        "INSERT INTO dbo.Orders (CustomerId, OrderDate) OUTPUT INSERTED.Id VALUES (@cid, SYSUTCDATETIME())",
        new { cid = 42 }, tx);
    await conn.ExecuteAsync("INSERT INTO dbo.OrderLines (OrderId, Product, Qty) VALUES (@orderId, @Product, @Qty)",
        lines.Select(l => new { orderId, l.Product, l.Qty }), tx);   // passing a list executes once per item
    await tx.CommitAsync();
}
catch
{
    await tx.RollbackAsync();
    throw;
}
```

Passing an `IEnumerable` of parameter objects to `Execute` runs the statement **once per item** — fine for tens of rows, slow for thousands. For bulk loads use:

| Technique | Use |
|---|---|
| `SqlBulkCopy` | Fastest insert of thousands–millions of rows (from a `DataTable` or `IDataReader`) |
| Table-valued parameter (TVP) | Send a set of rows to a stored procedure or `MERGE` in one call |
| `INSERT ... SELECT FROM OPENJSON(@json)` | Send JSON and insert set-based |

```csharp
// Table-valued parameter
var table = new DataTable();
table.Columns.Add("ProductId", typeof(int)); table.Columns.Add("Qty", typeof(int));
foreach (var l in lines) table.Rows.Add(l.ProductId, l.Qty);
await conn.ExecuteAsync("dbo.usp_AddLines", new { OrderId = orderId, Lines = table.AsTableValuedParameter("dbo.OrderLineType") },
    commandType: CommandType.StoredProcedure);
```

## Lesson: [Intermediate|Medium] Buffering, streaming, type handlers and dynamic results

```csharp
// Unbuffered: stream rows one by one (huge exports) — keep the connection open while iterating
await foreach (var row in conn.QueryUnbufferedAsync<Order>("SELECT * FROM dbo.Orders"))
    await writer.WriteLineAsync($"{row.Id},{row.OrderDate:O}");

// dynamic results when you don't have a class
var rows = await conn.QueryAsync("SELECT Category, COUNT(*) AS Total FROM dbo.Products GROUP BY Category");
foreach (dynamic r in rows) Console.WriteLine($"{r.Category}: {r.Total}");

// Custom type handler: store a JSON column as a typed object
public class JsonHandler<T> : SqlMapper.TypeHandler<T>
{
    public override T Parse(object value) => JsonSerializer.Deserialize<T>((string)value)!;
    public override void SetValue(IDbDataParameter p, T? value) { p.DbType = DbType.String; p.Value = JsonSerializer.Serialize(value); }
}
SqlMapper.AddTypeHandler(new JsonHandler<Address>());

// DateOnly etc. need a handler on older Dapper versions
```

**Command timeout and cancellation:** `new CommandDefinition(sql, args, commandTimeout: 60, cancellationToken: ct)` passed to `QueryAsync`.

# Module: Dapper in Real Applications

## Lesson: [Intermediate|High] Repository, unit of work and connection management in ASP.NET Core

```csharp
public interface IDbConnectionFactory { DbConnection Create(); }
public sealed class SqlConnectionFactory(IConfiguration cfg) : IDbConnectionFactory
{
    public DbConnection Create() => new SqlConnection(cfg.GetConnectionString("Shop"));
}

public interface IProductRepository
{
    Task<IReadOnlyList<ProductDto>> SearchAsync(string? q, int page, int size, CancellationToken ct);
    Task<ProductDto?> GetAsync(int id, CancellationToken ct);
    Task<int> CreateAsync(CreateProduct cmd, CancellationToken ct);
}

public sealed class ProductRepository(IDbConnectionFactory db) : IProductRepository
{
    public async Task<IReadOnlyList<ProductDto>> SearchAsync(string? q, int page, int size, CancellationToken ct)
    {
        const string sql = @"SELECT Id, Name, Category, Price FROM dbo.Products
                             WHERE (@q IS NULL OR Name LIKE @q + '%')
                             ORDER BY Name OFFSET @skip ROWS FETCH NEXT @size ROWS ONLY";
        await using var conn = db.Create();
        var rows = await conn.QueryAsync<ProductDto>(new CommandDefinition(sql, new { q, skip = (page - 1) * size, size }, cancellationToken: ct));
        return rows.AsList();
    }
    public async Task<ProductDto?> GetAsync(int id, CancellationToken ct)
    {
        await using var conn = db.Create();
        return await conn.QuerySingleOrDefaultAsync<ProductDto>(new CommandDefinition(
            "SELECT Id, Name, Category, Price FROM dbo.Products WHERE Id = @id", new { id }, cancellationToken: ct));
    }
    public async Task<int> CreateAsync(CreateProduct c, CancellationToken ct)
    {
        await using var conn = db.Create();
        return await conn.QuerySingleAsync<int>(new CommandDefinition(
            "INSERT INTO dbo.Products (Name, Category, Price) OUTPUT INSERTED.Id VALUES (@Name, @Category, @Price)", c, cancellationToken: ct));
    }
}

// Program.cs
builder.Services.AddSingleton<IDbConnectionFactory, SqlConnectionFactory>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
```

- Open connections late and dispose early — **ADO.NET connection pooling** makes this cheap.
- A **unit of work** shares one connection + transaction across several repositories for one business operation.
- Keep SQL in one place (repository or `.sql` resources), name queries clearly, and test them against a real database.

## Lesson: [Advanced|Medium] Performance, testing and choosing Dapper vs EF Core

**Performance tips:**

- Select only needed columns; page on the server (`OFFSET/FETCH` or keyset paging).
- Use correct parameter types (`DbString IsAnsi` for `VARCHAR` columns) to avoid implicit conversions that prevent index seeks.
- Use `QueryMultiple` instead of several round trips; TVPs/SqlBulkCopy for bulk.
- Dapper caches per SQL text — **don't** build SQL with embedded values (cache grows without limit and plans aren't reused).
- Use `QueryUnbufferedAsync` for very large results.
- Check the execution plan; Dapper is only as fast as your SQL.

**Testing:** unit-test services by mocking the repository interface; integration-test repositories against a real SQL Server (Testcontainers / LocalDB) — mocking `IDbConnection` extension methods is impractical.

**When to choose what:**

| Situation | Choice |
|---|---|
| Complex reporting queries, dashboards, existing stored procedures | Dapper |
| Rich domain with relationships, change tracking, migrations | EF Core |
| Read-heavy API endpoints needing maximum speed | Dapper (or EF Core with `AsNoTracking` + projection — often close enough) |
| Bulk loads / ETL | SqlBulkCopy / TVPs (with or without Dapper) |
| Mixed | EF Core for commands, Dapper for queries (they can share a connection/transaction via `db.Database.GetDbConnection()`) |

# Interview

## [Beginner|High] What is Dapper and why use it?

A micro-ORM: extension methods on `IDbConnection` that execute SQL you write and map result rows to objects automatically. It's almost as fast as raw ADO.NET with far less code, gives full control over SQL (stored procedures, CTEs, window functions), and has no change tracking or migrations. Ideal for read-heavy and performance-critical data access and for teams comfortable with SQL.

## [Beginner|High] Dapper vs Entity Framework Core?

Dapper: you write SQL; minimal overhead; no change tracking, relationships, migrations or LINQ translation — perfect for reports and tuned queries. EF Core: LINQ queries translated to SQL, change tracking and `SaveChanges`, relationships, migrations, interceptors — faster to build CRUD and domain models, some overhead. Many projects use both: EF Core for writes, Dapper for complex reads.

## [Beginner|High] How does Dapper prevent SQL injection?

When you pass values in the parameter object (`new { Id = id }`) or `DynamicParameters`, Dapper creates real `DbParameter`s, so the database treats them as data, never as SQL. Injection is only possible if you concatenate user input into the SQL string — never do that; whitelist identifiers like sort columns.

## [Beginner|High] Difference between Query, QueryFirst, QuerySingle and Execute?

`Query` returns all rows (`IEnumerable<T>`). `QueryFirst` returns the first row and throws if none (`OrDefault` returns default). `QuerySingle` expects exactly one row and throws on zero or multiple (`OrDefault` allows zero). `Execute` runs a command and returns the number of affected rows; `ExecuteScalar` returns the first column of the first row.

## [Intermediate|High] How do you call a stored procedure with output parameters in Dapper?

Create `DynamicParameters`, add inputs and add outputs with `direction: ParameterDirection.Output` (and `ReturnValue` if needed), call `Query`/`Execute` with `commandType: CommandType.StoredProcedure`, then read outputs with `p.Get<T>("@Name")` after the results have been consumed.

## [Intermediate|High] What is multi-mapping and what does splitOn do?

Mapping one row from a JOIN into several related objects: `Query<Order, Customer, Order>(sql, (o, c) => { o.Customer = c; return o; }, splitOn: "Id")`. `splitOn` tells Dapper at which column the next object's columns begin (default "Id"). For one-to-many, use a dictionary to de-duplicate parent objects and add children.

## [Intermediate|High] How do you use transactions with Dapper?

Open the connection, `BeginTransaction`, pass the transaction to every Dapper call (`transaction: tx` or positional argument), `Commit` on success and `Rollback` in a catch (or let `Dispose` roll back). For multiple repositories in one operation, share the connection and transaction through a unit-of-work object. `TransactionScope` also works (with async flow enabled).

## [Intermediate|Medium] How do you insert thousands of rows efficiently?

Not by passing a list to `Execute` (one round trip per row). Use `SqlBulkCopy` for raw speed, a table-valued parameter to a stored procedure (or `MERGE`) for set-based logic, or JSON + `OPENJSON` in one statement. Batch very large loads and use transactions appropriately.

## [Intermediate|Medium] What is buffered vs unbuffered querying in Dapper?

Buffered (default) reads all rows into a list before returning and closes the reader — simple and safe. Unbuffered (`buffered: false` or `QueryUnbufferedAsync`) yields rows while reading, keeping the reader and connection open until enumeration finishes — lower memory for huge results, but you must finish iterating before using the connection again.

## [Intermediate|Medium] How does Dapper map columns to properties and how do you handle mismatched names?

By name, case-insensitive, to public properties/fields or constructor parameters. For mismatches use SQL aliases (`SELECT product_name AS Name`), `DefaultTypeMap.MatchNamesWithUnderscores = true`, or a custom type map (`SqlMapper.SetTypeMap` with `CustomPropertyTypeMap`). Custom value conversions use `SqlMapper.TypeHandler<T>`.

## [Advanced|Medium] How does Dapper achieve its performance?

It generates and caches mapping code per (SQL, parameter type, result type) the first time a query runs — IL-emitted delegates that read the data reader directly into objects and write parameters — so later calls avoid reflection. It adds very little on top of ADO.NET: no change tracking, no expression translation. Dapper.AOT moves this generation to compile time with source generators.

## [Advanced|Medium] How do you manage connections with Dapper in ASP.NET Core?

Register a connection factory (singleton) that creates new `SqlConnection`s; create, use and dispose a connection per operation (`await using`), relying on connection pooling. For multi-step transactions use a scoped unit of work holding one connection and transaction. Avoid keeping connections open for the whole request or sharing one connection across threads.

## [Scenario|High] A Dapper search endpoint is slow even though the same SQL is fast in SSMS. What could cause it?

Different parameter types: Dapper sends `string` as `NVARCHAR`, and if the column is `VARCHAR` SQL Server converts the column, preventing an index seek — use `DbString { IsAnsi = true }`. Parameter sniffing: SSMS runs with literal values while the app reuses a plan compiled for different values — check the cached plan; consider `OPTION (RECOMPILE)` or better indexes. Also different SET options (ARITHABORT) produce different plans, and the app may be returning far more rows/columns or doing N+1 calls.

## [Scenario|Medium] Your team builds SQL with string interpolation for filters in Dapper. What problems does this cause and how do you fix it?

SQL injection risk, no plan reuse in SQL Server and an ever-growing Dapper query cache (each distinct SQL string is cached) → memory growth. Fix: parameterise all values, build optional filters with `WHERE (@x IS NULL OR Col = @x)` or a safe builder (DapperQueryBuilder / `SqlBuilder`) that appends parameterised fragments, and whitelist dynamic identifiers.

## [Scenario|Medium] How would you migrate a large ADO.NET DataReader-based data layer to Dapper?

Keep the SQL and stored procedures; replace manual reader loops with `Query<T>` mapped to DTOs, `DynamicParameters` for procedures with outputs, and `QueryMultiple` for multi-result procedures. Do it repository by repository behind existing interfaces, with integration tests comparing outputs before and after. Watch column-name mismatches and type differences (DBNull handling, decimal/money, dates).

# Cheatsheet

## Core calls

`Query<T>` · `QueryFirst(OrDefault)<T>` · `QuerySingle(OrDefault)<T>` · `Execute` · `ExecuteScalar<T>` · `QueryMultiple` · `QueryUnbufferedAsync` · all with `Async` versions and `CommandDefinition` for timeout/cancellation.

## Parameters

Anonymous object `new { Id = id }` · `DynamicParameters` for types/size/direction · `IN @ids` with a collection · `DbString { IsAnsi = true }` for VARCHAR · never interpolate values.

## Advanced

Multi-mapping `Query<A,B,A>(sql, map, splitOn:)` · stored procs `commandType: CommandType.StoredProcedure` · outputs `p.Get<T>()` · transactions pass `tx` · TVP `AsTableValuedParameter` · SqlBulkCopy for bulk · `SqlMapper.TypeHandler<T>`.

## Architecture

Connection factory (singleton) · repositories (scoped) · open late, dispose early · unit of work for multi-step transactions · EF Core for writes + Dapper for reads is common.

## Performance

Only needed columns · server paging · correct parameter types · fewer round trips · read the execution plan.
