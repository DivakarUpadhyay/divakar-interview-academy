---
slug: efcore
title: Entity Framework Core
track: dotnet
order: 6
icon: EF
color: #7048e8
summary: DbContext, code-first and database-first, conventions and Fluent API, relationships, migrations, querying and loading strategies, change tracking, concurrency, transactions, performance tuning and EF6 vs EF Core.
---

# Overview

**Entity Framework Core (EF Core)** is Microsoft's open-source **ORM** (Object-Relational Mapper) for .NET. You work with C# classes (entities) and LINQ; EF Core generates SQL, tracks changes and maps results back to objects.

Supported databases (providers): SQL Server / Azure SQL, SQLite, PostgreSQL (Npgsql), MySQL/MariaDB (Pomelo), Oracle, Cosmos DB, In-Memory (testing only).

Workflows:

- **Code-first** — write entity classes, generate the schema with **migrations** (most common for new apps).
- **Database-first** — **scaffold** classes from an existing DB (`dotnet ef dbcontext scaffold`).

**EF6** (Entity Framework 6) is the older .NET Framework ORM, now in maintenance; EF Core is the modern rewrite (and EF6 also runs on .NET Core 3.1+ for migration scenarios).

# Versions

| Version | Year | Highlights |
|---|---|---|
| EF 1.0 → EF 6 | 2008 → 2013 | .NET Framework ORM; EDMX designer, Code First (4.1), migrations (4.3) |
| EF Core 1.0 | 2016 | Rewrite, lightweight, cross-platform |
| EF Core 2.0/2.1 | 2017/2018 | Global query filters, owned types, lazy loading proxies, value conversions |
| EF Core 3.0/3.1 (LTS) | 2019 | LINQ overhaul — **no more silent client evaluation** |
| EF Core 5 | 2020 | Many-to-many without join entity, split queries, filtered Include, `ToQueryString()` |
| EF Core 6 (LTS) | 2021 | Temporal tables, compiled models, migration bundles, pre-convention config |
| EF Core 7 | 2022 | **`ExecuteUpdate`/`ExecuteDelete`** (bulk), JSON columns, TPC mapping |
| EF Core 8 (LTS) | 2023 | Complex types (value objects), primitive collections, raw SQL for unmapped types, `HierarchyId` |
| EF Core 9 | 2024 | Better Cosmos DB, auto-compiled models for AOT (experimental), `UseSeeding` |
| EF Core 10 (LTS) | 2025 | Ships with .NET 10: named query filters, `LeftJoin`/`RightJoin` translation, vector search for SQL Server, complex types improvements |

EF Core majors follow .NET's yearly November releases and support policy (even = LTS).

# Lifecycle

**DbContext lifecycle** (ASP.NET Core): registered **scoped** → one instance per HTTP request → created via DI → used for queries and changes → `SaveChanges()` → disposed at the end of the request. A DbContext is a **unit of work**, **not thread-safe**, and meant to be **short-lived**.

**Entity states (change tracking):**

| State | Meaning | On SaveChanges |
|---|---|---|
| `Detached` | Not tracked | nothing |
| `Added` | New, `Add()` called | INSERT |
| `Unchanged` | Loaded, not modified | nothing |
| `Modified` | Property changed | UPDATE (changed columns) |
| `Deleted` | `Remove()` called | DELETE |

**Query lifecycle:** LINQ → expression tree → EF query pipeline (translation, cached compiled query) → SQL → DbDataReader → materialise entities → identity resolution (one instance per key per context) → tracked as `Unchanged` (unless `AsNoTracking`).

**SaveChanges lifecycle:** `DetectChanges()` (snapshot comparison) → order commands by dependencies → begin transaction (implicit) → batch INSERT/UPDATE/DELETE → read back generated values (identity, rowversion) → commit → states become `Unchanged`.

**Migration lifecycle:** change model → `dotnet ef migrations add Name` (generates Up/Down C#) → review → `dotnet ef database update` in dev → in prod apply via **SQL script** (`migrations script --idempotent`) or **migration bundle** in CI/CD.

# Tools

| Tool | Use |
|---|---|
| `dotnet-ef` CLI (`dotnet tool install --global dotnet-ef`) | migrations, scaffold, bundles, `dbcontext optimize` |
| Package Manager Console (VS) | `Add-Migration`, `Update-Database`, `Scaffold-DbContext` |
| EF Core Power Tools (VS extension) | Reverse engineer, diagram the model |
| SQL Server Profiler / Extended Events / Query Store | See and tune generated SQL |
| `LogTo`, `EnableSensitiveDataLogging` (dev), `ToQueryString()` | Debug queries |
| MiniProfiler, Application Insights | Query timing in apps |
| EFCore.BulkExtensions, Z.EntityFramework.Extensions | Third-party bulk operations |
| Testcontainers, SQLite | Integration tests |

# Module: Getting Started

## Lesson: [Basic|High] DbContext, DbSet and configuration

```csharp
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);   // IEntityTypeConfiguration<T> classes
    }
}

public class Customer
{
    public int Id { get; set; }                               // convention: primary key
    public required string Name { get; set; }
    public string? Email { get; set; }
    public List<Order> Orders { get; set; } = [];             // navigation (one-to-many)
}

public class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }                       // foreign key by convention
    public Customer Customer { get; set; } = null!;
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Program.cs
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Db"), sql => sql.EnableRetryOnFailure()));
```

`AddDbContextPool` reuses context instances for high-throughput apps; `AddDbContextFactory` + `IDbContextFactory<T>` for Blazor Server, background services and parallel work.

## Lesson: [Basic|High] Code-first vs database-first and migrations

```bash
dotnet tool install --global dotnet-ef
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design

dotnet ef migrations add InitialCreate          # creates Migrations/xxxx_InitialCreate.cs + model snapshot
dotnet ef database update                       # applies pending migrations (__EFMigrationsHistory table)
dotnet ef migrations remove                     # removes the last, unapplied migration
dotnet ef migrations script --idempotent -o deploy.sql   # SQL for DBAs / pipelines
dotnet ef migrations bundle --self-contained    # executable that applies migrations (CI/CD)

# database-first (scaffold)
dotnet ef dbcontext scaffold "Server=.;Database=Legacy;Trusted_Connection=True;TrustServerCertificate=True" \
    Microsoft.EntityFrameworkCore.SqlServer -o Models --context LegacyContext
```

- Migrations are C# classes with `Up()` and `Down()`; review them — renames may be generated as drop + add (data loss).
- In production prefer **idempotent scripts or bundles** applied by the pipeline over `Database.Migrate()` at app start (race conditions with multiple instances, permissions).

## Lesson: [Basic|High] Conventions, data annotations and Fluent API

Configuration precedence: **Fluent API > Data Annotations > Conventions**.

```csharp
// Data annotations
public class Product
{
    public int Id { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Column(TypeName = "decimal(18,2)")] public decimal Price { get; set; }
    [Timestamp] public byte[] RowVersion { get; set; } = [];
}

// Fluent API (keeps entities clean; more powerful)
public class ProductConfig : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.ToTable("Products", "catalog");
        b.HasKey(p => p.Id);
        b.Property(p => p.Name).IsRequired().HasMaxLength(200);
        b.Property(p => p.Price).HasPrecision(18, 2);
        b.HasIndex(p => p.Name).IsUnique();
        b.Property(p => p.RowVersion).IsRowVersion();
        b.HasQueryFilter(p => !p.IsDeleted);                  // global query filter (soft delete)
    }
}
```

Fluent-only features: composite keys (`HasKey(x => new { x.A, x.B })`), indexes, sequences, table splitting, owned types, value conversions, query filters, seed data (`HasData`), inheritance mapping.

# Module: Relationships and Modelling

## Lesson: [Intermediate|High] One-to-one, one-to-many, many-to-many

```csharp
// One-to-many: Customer 1 — * Order
b.Entity<Order>().HasOne(o => o.Customer).WithMany(c => c.Orders)
 .HasForeignKey(o => o.CustomerId).OnDelete(DeleteBehavior.Restrict);

// One-to-one: User 1 — 1 Profile (dependent has the FK)
b.Entity<User>().HasOne(u => u.Profile).WithOne(p => p.User).HasForeignKey<Profile>(p => p.UserId);

// Many-to-many (EF Core 5+): skip navigations, join table created automatically
public class Student { public int Id { get; set; } public List<Course> Courses { get; set; } = []; }
public class Course  { public int Id { get; set; } public List<Student> Students { get; set; } = []; }

// Many-to-many with payload → explicit join entity
public class Enrollment { public int StudentId { get; set; } public int CourseId { get; set; } public DateTime EnrolledOn { get; set; } }
```

Delete behaviours: `Cascade` (default for required relationships), `Restrict`/`NoAction`, `SetNull`, `ClientSetNull`. SQL Server rejects multiple cascade paths — use `Restrict` on one.

## Lesson: [Intermediate|Medium] Owned types, complex types, value conversions and inheritance

```csharp
// Value object stored in the owner's table (Address_City, Address_Street columns)
b.Entity<Customer>().OwnsOne(c => c.Address);           // owned entity
b.Entity<Customer>().ComplexProperty(c => c.Address);    // EF Core 8 complex type (true value semantics)

// Enum stored as string
b.Entity<Order>().Property(o => o.Status).HasConversion<string>().HasMaxLength(20);

// JSON column (EF Core 7+)
b.Entity<Order>().OwnsOne(o => o.Metadata, m => m.ToJson());
```

Inheritance strategies:

| Strategy | Tables | Pros/cons |
|---|---|---|
| **TPH** — Table per Hierarchy (default) | One table + discriminator column | Fastest queries; nullable columns |
| **TPT** — Table per Type | Base table + one per derived type | Normalised; joins make it slower |
| **TPC** — Table per Concrete type (EF 7) | One table per concrete class | No joins for concrete queries; IDs must be unique across tables |

# Module: Querying

## Lesson: [Basic|High] Querying, tracking vs no-tracking

```csharp
var c = await db.Customers.FindAsync(5);                         // checks the change tracker first, then DB
var active = await db.Customers.Where(x => x.IsActive).OrderBy(x => x.Name).ToListAsync(ct);

// Read-only: skip change tracking (faster, less memory)
var list = await db.Products.AsNoTracking().Where(p => p.Price > 100).ToListAsync(ct);

// Projection — best for read models; selects only needed columns, never tracked
var dtos = await db.Orders
    .Where(o => o.CreatedAt >= from)
    .Select(o => new OrderDto(o.Id, o.Customer.Name, o.Total))
    .ToListAsync(ct);
```

`AsNoTrackingWithIdentityResolution()` — no tracking but still one instance per key. Configure default: `UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)` for read-heavy contexts.

## Lesson: [Intermediate|High] Loading related data: eager, explicit, lazy

```csharp
// Eager loading
var orders = await db.Orders
    .Include(o => o.Customer)
    .Include(o => o.Lines.Where(l => l.Qty > 0))      // filtered include (EF 5)
        .ThenInclude(l => l.Product)
    .AsSplitQuery()                                     // avoid cartesian explosion with multiple collections
    .ToListAsync();

// Explicit loading
var customer = await db.Customers.FirstAsync(c => c.Id == id);
await db.Entry(customer).Collection(c => c.Orders).LoadAsync();
await db.Entry(order).Reference(o => o.Customer).LoadAsync();

// Lazy loading (opt-in): Microsoft.EntityFrameworkCore.Proxies + UseLazyLoadingProxies(); virtual navigations
```

| | When loaded | Risk |
|---|---|---|
| Eager (`Include`) | Same query | Cartesian explosion with several collections → `AsSplitQuery` |
| Explicit | When you call `Load` | Extra round trips, but controlled |
| Lazy | On first access of navigation | **N+1 queries**, hidden DB calls, serialisation loops |

## Lesson: [Intermediate|High] Raw SQL, stored procedures and bulk operations

```csharp
// Raw SQL returning entities — interpolation is parameterised (safe)
var big = await db.Orders.FromSql($"SELECT * FROM Orders WHERE Total > {minTotal}").Where(o => o.Status == "Open").ToListAsync();

// Unmapped types (EF Core 8)
var rows = await db.Database.SqlQuery<SalesRow>($"EXEC dbo.usp_SalesByMonth @Year = {year}").ToListAsync();

// Non-query
await db.Database.ExecuteSqlAsync($"UPDATE Products SET Price = Price * {factor} WHERE CategoryId = {cat}");

// Set-based bulk update/delete without loading entities (EF Core 7)
await db.Orders.Where(o => o.CreatedAt < cutoff && o.Status == "Draft").ExecuteDeleteAsync(ct);
await db.Products.Where(p => p.CategoryId == 3)
    .ExecuteUpdateAsync(s => s.SetProperty(p => p.Price, p => p.Price * 1.1m), ct);
```

`FromSqlRaw`/`ExecuteSqlRaw` take a string + parameters — never concatenate user input into them. `ExecuteUpdate/Delete` bypass the change tracker (tracked entities become stale) and run immediately.

# Module: Saving Data

## Lesson: [Basic|High] Add, update, delete and SaveChanges

```csharp
// Add
db.Customers.Add(new Customer { Name = "Acme" });
await db.SaveChangesAsync(ct);

// Update — tracked (connected) scenario
var p = await db.Products.FindAsync(id);
p!.Price = 499;                                 // change tracker notices
await db.SaveChangesAsync(ct);                  // UPDATE Products SET Price = @p0 WHERE Id = @p1

// Update — disconnected (e.g. DTO from API)
db.Products.Update(product);                     // marks ALL properties modified
db.Entry(product).Property(x => x.Price).IsModified = true;   // or mark only specific ones

// Delete
db.Products.Remove(p);
await db.SaveChangesAsync(ct);
```

`SaveChanges` wraps all pending changes in **one transaction** and batches statements (SQL Server default batch up to 42 statements). Interceptors (`SaveChangesInterceptor`) or overriding `SaveChangesAsync` are common for audit fields (`CreatedAt`, `ModifiedBy`).

## Lesson: [Intermediate|High] Concurrency control

```csharp
public class Product
{
    public int Id { get; set; }
    public decimal Price { get; set; }
    [Timestamp] public byte[] RowVersion { get; set; } = [];      // SQL Server rowversion
}

try
{
    product.Price = newPrice;
    await db.SaveChangesAsync();          // UPDATE ... WHERE Id = @id AND RowVersion = @originalVersion
}
catch (DbUpdateConcurrencyException ex)
{
    var entry = ex.Entries.Single();
    var dbValues = await entry.GetDatabaseValuesAsync();
    // options: client wins (refresh original values and retry), store wins (reload), or ask the user to merge
}
```

**Optimistic concurrency** (rowversion / `IsConcurrencyToken()`): no locks; detect conflicts on save — default choice for web apps. **Pessimistic** (locks: `SELECT ... WITH (UPDLOCK)`, serializable transactions): prevents conflicts but reduces throughput.

## Lesson: [Intermediate|High] Transactions

```csharp
await using var tx = await db.Database.BeginTransactionAsync(ct);
try
{
    db.Orders.Add(order);
    await db.SaveChangesAsync(ct);                      // gets order.Id

    await db.Inventory.Where(i => i.ProductId == pid).ExecuteUpdateAsync(s => s.SetProperty(i => i.Qty, i => i.Qty - qty), ct);
    await tx.CommitAsync(ct);
}
catch
{
    await tx.RollbackAsync(ct);
    throw;
}
```

With `EnableRetryOnFailure`, user-initiated transactions must run inside an execution strategy: `await db.Database.CreateExecutionStrategy().ExecuteAsync(async () => { ... })`. Savepoints are created automatically by `SaveChanges` inside an explicit transaction.

# Module: Performance and Advanced

## Lesson: [Advanced|High] EF Core performance checklist

1. **Project** with `Select` — fetch only needed columns.
2. `AsNoTracking` for read-only queries.
3. Avoid **N+1** — no lazy loading in loops; `Include` or projection.
4. `AsSplitQuery` for multiple collection includes (cartesian explosion).
5. **Paginate**; never load whole tables.
6. Indexes for filters/joins/order-bys (`HasIndex`).
7. `ExecuteUpdate`/`ExecuteDelete` for set-based changes.
8. `AddDbContextPool` and **compiled queries** (`EF.CompileAsyncQuery`) for hot paths.
9. Keep contexts short-lived; don't track thousands of entities (DetectChanges cost).
10. Check generated SQL (`ToQueryString`, logging) and execution plans; drop to Dapper/raw SQL for complex reports.
11. Avoid client-side `ToList()` before `Where`.
12. Use `AnyAsync` for existence, `CountAsync` only when needed.

```csharp
private static readonly Func<AppDbContext, int, Task<Product?>> GetById =
    EF.CompileAsyncQuery((AppDbContext db, int id) => db.Products.FirstOrDefault(p => p.Id == id));
```

## Lesson: [Advanced|Medium] Global query filters, interceptors, shadow properties and temporal tables

```csharp
// Soft delete + multi-tenancy filter
b.Entity<Order>().HasQueryFilter(o => !o.IsDeleted && o.TenantId == _tenantId);
db.Orders.IgnoreQueryFilters();                         // bypass when needed

// Shadow property: exists in the model/table but not in the class
b.Entity<Order>().Property<DateTime>("LastUpdated");
db.Entry(order).Property("LastUpdated").CurrentValue = DateTime.UtcNow;

// Audit interceptor
public class AuditInterceptor(TimeProvider clock) : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData e, InterceptionResult<int> r, CancellationToken ct = default)
    {
        foreach (var entry in e.Context!.ChangeTracker.Entries<IAuditable>())
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = clock.GetUtcNow();
        return base.SavingChangesAsync(e, r, ct);
    }
}

// SQL Server temporal tables (EF Core 6)
b.Entity<Product>().ToTable(t => t.IsTemporal());
var asOf = await db.Products.TemporalAsOf(DateTime.UtcNow.AddDays(-7)).ToListAsync();
```

## Lesson: [Intermediate|Medium] Testing code that uses EF Core

- **In-Memory provider** — fast but not relational (no SQL, no constraints, no transactions); Microsoft discourages it for testing DB behaviour.
- **SQLite in-memory** (`DataSource=:memory:`) — relational, fast; some SQL Server differences.
- **Testcontainers** with real SQL Server — most accurate; slower startup (share one container per test run, reset with Respawn).
- Or hide EF behind repositories and mock those for unit tests of business logic.

# Interview

## [Beginner|High] What is Entity Framework Core and what are its advantages?

An open-source, cross-platform ORM that maps C# classes to database tables. You query with LINQ and EF generates parameterised SQL, tracks changes and saves them in a transaction. Advantages: productivity (less data-access boilerplate), strong typing and compile-time checks, migrations for schema evolution, multiple DB providers, built-in protection from SQL injection, relationships and change tracking handled for you. Trade-offs: generated SQL must be monitored for performance; complex reports may be better in raw SQL/Dapper.

## [Beginner|High] Code-first vs database-first?

Code-first: you design entity classes and DbContext; migrations create and evolve the schema — the model is the source of truth (common for new projects). Database-first: the database exists (or DBAs own it); you scaffold entities and context from it with `dotnet ef dbcontext scaffold` and re-scaffold when the schema changes. EF Core has no EDMX designer (that was EF6).

## [Beginner|High] What is DbContext? Is it thread-safe? What lifetime should it have?

DbContext represents a session with the database: it holds DbSets, the change tracker, configuration, and implements unit of work (`SaveChanges`). It is **not thread-safe** — never share it across concurrent operations (no parallel `await`s on the same context). Register it **scoped** in ASP.NET Core (one per request) and keep it short-lived; use `IDbContextFactory` for background services, Blazor Server or parallel work.

## [Beginner|High] What are migrations? What commands do you use?

Migrations are versioned C# files describing schema changes (Up/Down), generated by comparing the current model with the model snapshot. Commands: `dotnet ef migrations add <Name>`, `dotnet ef database update [target]`, `dotnet ef migrations remove`, `dotnet ef migrations list`, `dotnet ef migrations script --idempotent`, `dotnet ef migrations bundle`. Applied migrations are recorded in `__EFMigrationsHistory`.

## [Beginner|High] What is the difference between eager, lazy and explicit loading?

Eager: related data loaded in the same query with `Include`/`ThenInclude`. Explicit: load later on demand with `Entry(x).Collection(...).Load()` / `.Reference(...).Load()`. Lazy: navigation properties load automatically on first access (needs proxies or `ILazyLoader`, virtual navigations) — convenient but causes hidden N+1 queries. Projections (`Select`) are often better than any of them for read models.

## [Beginner|Medium] What is the difference between `Find` and `FirstOrDefault`?

`Find(key)` looks up by primary key and first checks the **change tracker** — if the entity is already tracked, no DB query is sent. `FirstOrDefault(predicate)` always queries the database (with any predicate) and supports `Include`/ordering. `Find` can't use `Include`.

## [Intermediate|High] What is change tracking? What is AsNoTracking?

When EF loads entities it keeps a snapshot of their original values. On `SaveChanges`, `DetectChanges` compares current vs original values and generates UPDATEs for changed columns; entity states drive INSERT/DELETE. `AsNoTracking()` skips this — faster and less memory for read-only queries, but changes to those objects won't be saved unless you attach them.

## [Intermediate|High] Explain entity states in EF Core.

Detached (not tracked), Added (INSERT on save), Unchanged (loaded, no changes), Modified (UPDATE on save), Deleted (DELETE on save). Inspect/set with `db.Entry(entity).State`. `Attach` → Unchanged; `Update` → Modified (all properties); `Add` → Added; `Remove` → Deleted (or detached if it was Added). After a successful save, Added/Modified become Unchanged and Deleted become Detached.

## [Intermediate|High] What is the N+1 problem and how do you avoid it in EF Core?

Loading N parent entities with one query and then triggering one query per parent for its related data (usually lazy loading in a loop or view). Avoid by eager loading (`Include`), projecting into DTOs with the needed related fields in one query, using `AsSplitQuery` when including collections, and disabling lazy loading. Detect via SQL logging or profilers showing many similar queries.

## [Intermediate|High] How does EF Core handle concurrency?

Optimistic concurrency via concurrency tokens: a `[Timestamp]`/`IsRowVersion()` `rowversion` column (SQL Server updates it automatically) or `IsConcurrencyToken()` on specific properties. EF adds the original value to the UPDATE/DELETE `WHERE` clause; if 0 rows are affected it throws `DbUpdateConcurrencyException`, which you handle by reloading, overwriting (client wins) or merging. No database locks are held between read and write.

## [Intermediate|High] How do you configure relationships? Data annotations vs Fluent API?

By convention (navigation properties + `XxxId` FK), data annotations (`[ForeignKey]`, `[InverseProperty]`, `[Required]`), or Fluent API (`HasOne/WithMany/HasForeignKey/OnDelete`). Fluent API has the highest precedence, keeps domain classes free of persistence attributes and supports everything (composite keys, indexes, delete behaviour, owned types, filters). Organise it in `IEntityTypeConfiguration<T>` classes.

## [Intermediate|Medium] What are global query filters? Give use cases.

LINQ predicates configured per entity type in `OnModelCreating` (`HasQueryFilter`) that EF automatically adds to every query for that type — e.g. soft delete (`!IsDeleted`) and multi-tenancy (`TenantId == currentTenant`). Bypass with `IgnoreQueryFilters()`. EF Core 10 adds named filters so you can disable them individually.

## [Intermediate|Medium] How do you execute raw SQL or stored procedures in EF Core?

`FromSql($"...")` (interpolated → parameterised) or `FromSqlRaw(sql, params)` on a DbSet returns entities and can be composed with LINQ (if the SQL is composable). `Database.SqlQuery<T>($"...")` returns unmapped types (EF 8). `Database.ExecuteSql($"...")`/`ExecuteSqlRaw` for non-queries/stored procedures. Never concatenate user input into the raw variants.

## [Intermediate|Medium] What are ExecuteUpdate and ExecuteDelete?

EF Core 7 set-based operations that translate directly into a single `UPDATE`/`DELETE ... WHERE` statement without loading entities into memory or using the change tracker — e.g. `db.Orders.Where(o => o.Expired).ExecuteDeleteAsync()`. Much faster for bulk changes. Caveats: they run immediately (not part of `SaveChanges` unless inside an explicit transaction) and tracked entities aren't updated.

## [Advanced|High] How do you improve EF Core query performance?

Project only needed columns; `AsNoTracking`; avoid N+1 and lazy loading; `AsSplitQuery` for multiple collection includes; paginate; add indexes for filters and sorts; set-based `ExecuteUpdate/Delete`; compiled queries and DbContext pooling for hot paths; check generated SQL and execution plans; avoid client evaluation; batch writes; keep contexts small; cache read-mostly data; and use Dapper or views/stored procedures for complex reporting queries.

## [Advanced|Medium] What is the difference between `Update()` and attaching then setting properties?

`db.Update(entity)` attaches a detached entity and marks **all** properties as Modified → UPDATE writes every column (can overwrite concurrent changes in other columns). Loading the entity and setting properties (or `Attach` + marking specific properties `IsModified = true`) updates only changed columns. In APIs, prefer loading → mapping the DTO onto the tracked entity → saving, with a concurrency token.

## [Advanced|Medium] EF Core vs EF6 — key differences?

EF Core: cross-platform, lighter, faster, supports more DB providers incl. Cosmos, has features like global query filters, `ExecuteUpdate`, JSON columns, compiled models, split queries; no EDMX designer, no ObjectContext. EF6: .NET Framework-centric (also runs on .NET Core 3.1+), EDMX/database-first designer, mature but maintenance only. New development should use EF Core.

## [Scenario|High] A page listing 50 orders takes 5 seconds and the log shows 51 SQL queries. Fix it.

Classic N+1: one query for orders and one per order for its customer (lazy loading). Replace with a single projection: `db.Orders.AsNoTracking().OrderByDescending(o => o.CreatedAt).Take(50).Select(o => new OrderRow(o.Id, o.Customer.Name, o.Total)).ToListAsync()` → one SQL with a JOIN. Disable lazy loading globally, add an index on `CreatedAt`, and confirm with logging that only one query runs.

## [Scenario|High] Two users edit the same product price at the same time and the later save silently overwrites the earlier one. How do you prevent lost updates?

Add a `rowversion` concurrency token (`[Timestamp] byte[] RowVersion`). Send the RowVersion to the client with the data and back on update; set it as the original value (`db.Entry(p).Property(x => x.RowVersion).OriginalValue = dto.RowVersion`). If someone else saved first, EF throws `DbUpdateConcurrencyException`; return **409 Conflict** (or 412 with ETags) with the current values so the user can review and retry.

## [Scenario|High] You need to delete 5 million log rows older than 90 days nightly without blocking the app. What do you do?

Don't load entities. Use `ExecuteDeleteAsync` in **batches** (e.g. loop deleting `Take(10_000)` by key range or `TOP (10000)` raw SQL until 0 rows) to keep transactions small and avoid lock escalation and log growth; run off-peak via a background job; ensure an index on the date column. Better long-term: **table partitioning** by month and `TRUNCATE`/switch out old partitions, or a retention policy in a time-series store.

## [Scenario|Medium] Deploying a migration renamed a column and dropped production data. How do you prevent this?

EF scaffolded the rename as drop + add. Prevention: always review generated migrations; use `migrationBuilder.RenameColumn` explicitly (or `HasColumnName` to keep the DB name); apply schema changes through reviewed **idempotent SQL scripts** in the pipeline with a DBA/peer review; take backups before deploying; use expand-contract (add new column → backfill → switch code → drop old later) for zero-downtime changes; test migrations against a production-like copy.

## [Scenario|Medium] A BackgroundService throws "A second operation was started on this context instance before a previous operation completed." Why?

The same DbContext was used concurrently — e.g. parallel tasks (`Task.WhenAll`) or a singleton service holding one context. DbContext isn't thread-safe. Fix: create a new scope/context per unit of work (`IServiceScopeFactory` or `IDbContextFactory<T>.CreateDbContext()` per task), and `await` each operation before starting the next on the same context.

# Cheatsheet

## Setup

```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet tool install -g dotnet-ef
dotnet ef migrations add Init
dotnet ef database update
dotnet ef migrations script --idempotent -o deploy.sql
dotnet ef dbcontext scaffold "<conn>" Microsoft.EntityFrameworkCore.SqlServer -o Models
```

## Entity states

Detached · Added → INSERT · Unchanged · Modified → UPDATE · Deleted → DELETE.

## Loading

`Include/ThenInclude` (eager) · `Entry().Collection().Load()` (explicit) · lazy proxies (avoid) · `Select` projection (best for reads) · `AsSplitQuery`.

## Query tips

`AsNoTracking` · `Select` DTOs · `AnyAsync` · paginate `Skip/Take` · `ToQueryString()` · `FromSql($"")` · `SqlQuery<T>` · `ExecuteUpdate/Delete` · `EF.CompileAsyncQuery` · `IgnoreQueryFilters`.

## Configuration precedence

Fluent API > Data Annotations > Conventions. Use `IEntityTypeConfiguration<T>`.

## Relationships

`HasOne().WithMany().HasForeignKey().OnDelete()` · `HasOne().WithOne().HasForeignKey<T>()` · many-to-many via skip navigations · owned/complex types · TPH (default) / TPT / TPC.

## Concurrency & transactions

`[Timestamp] byte[] RowVersion` → `DbUpdateConcurrencyException` → 409 · `SaveChanges` = one transaction · `BeginTransactionAsync` for multiple saves · execution strategy with retries.

## DbContext rules

Scoped · short-lived · not thread-safe · `IDbContextFactory` for background/parallel · `AddDbContextPool` for throughput.
