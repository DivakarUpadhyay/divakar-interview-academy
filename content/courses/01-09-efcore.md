---
slug: efcore
title: Entity Framework (EF6 & EF Core)
track: dotnet
order: 9
group: Data Access
icon: EF
color: #7048e8
summary: DbContext, code-first and database-first, conventions and Fluent API, relationships, migrations, querying and loading strategies, change tracking, concurrency, transactions, performance tuning and EF6 vs EF Core.
---

# Overview

**Entity Framework Core (EF Core)** is Microsoft's open-source ORM (Object-Relational Mapper) for .NET. You work with C# classes (entities) and LINQ; EF Core generates SQL, tracks changes and maps results back to objects.

Supported databases (providers): SQL Server / Azure SQL, SQLite, PostgreSQL (Npgsql), MySQL/MariaDB (Pomelo), Oracle, Cosmos DB, In-Memory (testing only).

Workflows:

- **Code-first**: write entity classes, generate the schema with migrations (most common for new apps).
- **Database-first**: scaffold classes from an existing DB (`dotnet ef dbcontext scaffold`).

**EF6** (Entity Framework 6) is the older .NET Framework ORM, now in maintenance; EF Core is the modern rewrite (and EF6 also runs on .NET Core 3.1+ for migration scenarios).

# Versions

| Version | Year | Highlights |
|---|---|---|
| EF 1.0 → EF 6 | 2008 → 2013 | .NET Framework ORM; EDMX designer, Code First (4.1), migrations (4.3) |
| EF Core 1.0 | 2016 | Rewrite, lightweight, cross-platform |
| EF Core 2.0/2.1 | 2017/2018 | Global query filters, owned types, lazy loading proxies, value conversions |
| EF Core 3.0/3.1 (LTS) | 2019 | LINQ overhaul: **no more silent client evaluation** |
| EF Core 5 | 2020 | Many-to-many without join entity, split queries, filtered Include, `ToQueryString()` |
| EF Core 6 (LTS) | 2021 | Temporal tables, compiled models, migration bundles, pre-convention config |
| EF Core 7 | 2022 | **`ExecuteUpdate`/`ExecuteDelete`** (bulk), JSON columns, TPC mapping |
| EF Core 8 (LTS) | 2023 | Complex types (value objects), primitive collections, raw SQL for unmapped types, `HierarchyId` |
| EF Core 9 | 2024 | Better Cosmos DB, auto-compiled models for AOT (experimental), `UseSeeding` |
| EF Core 10 (LTS) | 2025 | Ships with .NET 10: named query filters, `LeftJoin`/`RightJoin` translation, vector search for SQL Server, complex types improvements |

EF Core majors follow .NET's yearly November releases and support policy (even = LTS).

# Lifecycle

**DbContext lifecycle** (ASP.NET Core): registered scoped → one instance per HTTP request → created via DI → used for queries and changes → `SaveChanges()` → disposed at the end of the request. A DbContext is a unit of work, not thread-safe, and meant to be short-lived.

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

**Migration lifecycle:** change model → `dotnet ef migrations add Name` (generates Up/Down C#) → review → `dotnet ef database update` in dev → in prod apply via SQL script (`migrations script --idempotent`) or migration bundle in CI/CD.

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

## Lesson: [Basic|High] What an ORM is, and EF6 vs EF Core

An **ORM** (object-relational mapper) maps classes to tables and objects to rows, generating SQL so you work with C# objects and LINQ instead of `DataReader` loops. Entity Framework is Microsoft's ORM, in two generations:

| | **Entity Framework 6 (EF6)** | **EF Core** |
|---|---|---|
| Released | EF 1 (2008, .NET 3.5 SP1) → EF 4.1 Code First (2011) → **EF6 (2013)**, 6.4/6.5 last | 2016 (1.0) → **EF Core 10 (2025)** |
| Runs on | .NET Framework (EF 6.3+ also on .NET Core 3.1+/.NET 5+) | .NET Core / .NET 5+ only |
| Status | Maintenance only (bug/security fixes) | Active: new features every year |
| Modelling | **EDMX designer** (Database First / Model First, XML model: CSDL + SSDL + MSL) or Code First | Code First only (plus **reverse engineering** with `dotnet ef dbcontext scaffold`) |
| Context API | `DbContext` (wrapper over the older `ObjectContext`) | `DbContext` only |
| Lazy loading | On by default (virtual navigation properties) | Off by default (opt-in proxies) |
| Performance | Slower | Much faster (compiled queries, batching, no-tracking, split queries) |
| Extras | Spatial, entity splitting, stored-proc mapping in EDMX | Global query filters, owned/complex types, JSON columns, bulk `ExecuteUpdate/ExecuteDelete`, temporal tables, interceptors, many providers (SQL Server, PostgreSQL, SQLite, Cosmos DB) |

**EF6 Database First with EDMX (legacy apps):** Add → ADO.NET Entity Data Model → "EF Designer from database" → pick tables/procedures → Visual Studio generates `ShopModel.edmx` (diagram) + T4 templates that generate entity classes and a `ShopEntities : DbContext`. Changing the database means "Update Model from Database" in the designer. The connection string contains metadata (`metadata=res://*/ShopModel.csdl|...;provider=System.Data.SqlClient;provider connection string="..."`).

```csharp
// EF6 (System.Data.Entity): .NET Framework MVC 5 / Web Forms
using (var db = new ShopEntities())
{
    var orders = db.Orders.Include(o => o.Customer).Where(o => o.Total > 1000).ToList();   // Include(lambda) needs System.Data.Entity
    db.Orders.Add(new Order { CustomerId = 42, Total = 4500 });
    db.SaveChanges();
}
```

```csharp
// EF Core (Microsoft.EntityFrameworkCore): same idea, modern API
await using var db = new ShopDbContext(options);
var orders = await db.Orders.Include(o => o.Customer).Where(o => o.Total > 1000).AsNoTracking().ToListAsync();
```

**Migrating EF6 → EF Core:** move EDMX models to code-first classes (scaffold from the database), replace `System.Data.Entity` namespaces, review lazy-loading assumptions (add explicit `Include`), re-test queries that EF Core translates differently (client evaluation is no longer silent), replace EF6-only features (EDMX stored-procedure mapping, entity splitting differences), and adopt EF Core migrations from a baseline.

> **Interview tip:** "Code First vs Database First": Code First, classes are the source of truth and migrations create/alter the database; Database First, the existing database is the source of truth and the model is generated from it (EDMX in EF6, scaffolding in EF Core).

### How it works

Without an ORM you open a connection, write the SQL yourself, run it, then loop over a `SqlDataReader` and copy each column into an object by hand. That works, but the copying code is boring, easy to get wrong and has to change every time a column changes. An ORM does that mapping for you. You describe your classes once, and EF builds the SQL, sends parameters safely and turns rows back into objects.

The price you pay is control. EF decides what SQL to send, so you need to know how to read the SQL it produces. A good EF developer is someone who can look at a LINQ query and roughly guess the SQL before running it.

### Common mistakes

- Thinking an ORM means you no longer need to know SQL. You still need indexes, joins and execution plans; EF only writes the statements.
- Mixing EF6 and EF Core namespaces in one project. `System.Data.Entity` is EF6, `Microsoft.EntityFrameworkCore` is EF Core, and their `Include` methods are different.
- Moving an old app from EF6 to EF Core without checking lazy loading. Pages that "just worked" in EF6 suddenly have null navigation properties.

### Try it yourself

1. Create a console app, add `Microsoft.EntityFrameworkCore.Sqlite`, and map one `Book` class with `Id`, `Title` and `Price`.
2. Insert three books and read them back with `Where(b => b.Price > 10)`.
3. Turn on logging with `optionsBuilder.LogTo(Console.WriteLine)` and read the SQL EF sent. Write down how your LINQ became SQL.

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

### How it works

`DbContext` is your session with the database. It holds the connection settings, the model (what classes map to what tables) and the change tracker (which objects you loaded and what you changed). Each `DbSet<T>` is a door into one table: you query through it and add or remove entities through it.

Building the model is expensive, so EF builds it once per context type and caches it. Creating a new `DbContext` instance is cheap. That is why the normal pattern is one short-lived context per web request, registered as scoped in dependency injection.

### Common mistakes

- Registering the context as a singleton. One context shared by every request means shared change tracking, thread-safety errors and memory that only grows.
- Using one context from several threads at once, for example with `Task.WhenAll` over several queries. You get "A second operation was started on this context instance".
- Putting the connection string in code. Keep it in `appsettings.json` for development and in user secrets, environment variables or Key Vault for real environments.

### Real-world example

In a typical ASP.NET Core API the controller or service gets `AppDbContext` from the constructor, runs one or two queries, calls `SaveChangesAsync` once and returns. The container disposes the context when the request ends. Background jobs are different: they live longer than a request, so they ask an `IDbContextFactory<AppDbContext>` for a fresh context per unit of work.

### Try it yourself

1. Register `AppDbContext` with `AddDbContext` and inject it into a minimal API endpoint.
2. Write a `BackgroundService` that cleans old rows every minute. Use `AddDbContextFactory` and create a new context inside each loop.
3. Try injecting the scoped context straight into the `BackgroundService` and read the error you get. Explain it in one sentence.

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

### How it works

A migration is a snapshot of the difference between your model now and your model at the last migration. When you run `migrations add`, EF compares your classes with the `ModelSnapshot.cs` file and writes C# that would move the database from the old shape to the new one. `database update` runs the pending migrations in order and records each one in the `__EFMigrationsHistory` table, so it never runs the same migration twice.

Database-first works the other way round. The database already exists, often owned by a DBA team, and `dbcontext scaffold` reads its schema and writes the classes. You can re-scaffold after the schema changes, but anything you edited in the generated classes is overwritten, so put your own code in partial classes.

### Common mistakes

- Renaming a property and trusting the generated migration. EF may write `DropColumn` plus `AddColumn`, which deletes the data. Change it to `RenameColumn` by hand.
- Editing a migration that has already been applied somewhere. Add a new migration instead.
- Calling `Database.Migrate()` at startup in an app that runs on several servers. Two instances can try to migrate at the same time.

### Real-world example

A common team setup: developers add migrations locally and commit them with the code change. The build pipeline runs `dotnet ef migrations script --idempotent` and a DBA or the release pipeline applies that script before the new version of the app is deployed. The script is safe to run twice because it checks the history table.

### Try it yourself

1. Create a migration for a `Customer` table, apply it, then add a `Phone` column with a second migration.
2. Rename `Phone` to `PhoneNumber`, look at the generated code, and fix it to use `RenameColumn`.
3. Generate an idempotent script and read it. Find the `IF NOT EXISTS` checks against `__EFMigrationsHistory`.

# database-first (scaffold)
dotnet ef dbcontext scaffold "Server=.;Database=Legacy;Trusted_Connection=True;TrustServerCertificate=True" \
    Microsoft.EntityFrameworkCore.SqlServer -o Models --context LegacyContext
```

- Migrations are C# classes with `Up()` and `Down()`; review them: renames may be generated as drop + add (data loss).
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

### How it works

EF builds the model in three passes. First conventions guess everything they can: a property called `Id` is the key, `CustomerId` next to a `Customer` navigation is the foreign key, `string` becomes `nvarchar(max)`. Then data annotations on your classes override the guesses. Last, Fluent API code in `OnModelCreating` overrides both. Knowing this order explains most "why did EF do that?" surprises.

### Common mistakes

- Leaving strings without a maximum length. `nvarchar(max)` columns cannot be indexed normally and waste memory grants in big queries.
- Forgetting decimal precision. Without `HasPrecision(18, 2)` EF warns you and SQL Server may round money values.
- Spreading configuration across annotations and Fluent API for the same property. Pick one style per project; most teams use Fluent API in `IEntityTypeConfiguration<T>` classes so entities stay plain.

### Try it yourself

1. Map a `Product` with only conventions and look at the generated table.
2. Add a configuration class that sets the table name, max lengths, decimal precision and a unique index on `Sku`.
3. Create a migration and compare the two table definitions.

# Module: Relationships and Modelling

## Lesson: [Intermediate|High] One-to-one, one-to-many, many-to-many

```csharp
// One-to-many: Customer 1, * Order
b.Entity<Order>().HasOne(o => o.Customer).WithMany(c => c.Orders)
 .HasForeignKey(o => o.CustomerId).OnDelete(DeleteBehavior.Restrict);

// One-to-one: User 1, 1 Profile (dependent has the FK)
b.Entity<User>().HasOne(u => u.Profile).WithOne(p => p.User).HasForeignKey<Profile>(p => p.UserId);

// Many-to-many (EF Core 5+): skip navigations, join table created automatically
public class Student { public int Id { get; set; } public List<Course> Courses { get; set; } = []; }
public class Course  { public int Id { get; set; } public List<Student> Students { get; set; } = []; }

// Many-to-many with payload → explicit join entity
public class Enrollment { public int StudentId { get; set; } public int CourseId { get; set; } public DateTime EnrolledOn { get; set; } }
```

Delete behaviours: `Cascade` (default for required relationships), `Restrict`/`NoAction`, `SetNull`, `ClientSetNull`. SQL Server rejects multiple cascade paths: use `Restrict` on one.

### How it works

A relationship has a principal (the "one" side, for example `Customer`) and a dependent (the side that holds the foreign key, for example `Order`). EF needs to know which side owns the key; for one-to-many it is obvious, for one-to-one you tell it with `HasForeignKey<T>()`. Navigation properties are only for your C# code. In the database there is just a foreign key column and a constraint.

Delete behaviour decides what happens to dependents when the principal is deleted. With `Cascade` the database deletes the orders when a customer is deleted. With `Restrict` the delete fails while orders still exist, which is usually what business data needs.

### Common mistakes

- Leaving cascade delete on for business data. Deleting one customer silently deletes years of orders and invoices.
- Adding a plain many-to-many and later needing extra columns such as `EnrolledOn`. Plan an explicit join entity when the link itself has data.
- Making both navigations required in a one-to-one and then being unable to insert either row first.

### Real-world example

In an online shop `Order` to `OrderLine` is one-to-many with cascade delete, because lines mean nothing without their order. `Customer` to `Order` is one-to-many with `Restrict`, because orders are financial records and must survive. `Product` to `Tag` is many-to-many with no extra data, so the automatic join table is enough.

### Try it yourself

1. Model `Customer`, `Order`, `OrderLine` and `Product` with the delete rules above.
2. Try to delete a customer who has orders and read the exception.
3. Add `Student` and `Course` as many-to-many, then change it to an `Enrollment` entity with a `Grade` column.

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
| **TPH**: Table per Hierarchy (default) | One table + discriminator column | Fastest queries; nullable columns |
| **TPT**: Table per Type | Base table + one per derived type | Normalised; joins make it slower |
| **TPC**: Table per Concrete type (EF 7) | One table per concrete class | No joins for concrete queries; IDs must be unique across tables |

### How it works

Owned and complex types let you keep small value objects such as `Address` or `Money` as real classes in C# while storing their fields as columns in the owner's table. Value conversions change how one property is stored, for example an enum saved as readable text instead of a number. Inheritance mapping decides how a class hierarchy such as `Payment`, `CardPayment` and `BankPayment` is laid out in tables.

### Common mistakes

- Storing enums as integers and later reordering the enum members. Every stored value now means something else. Text conversion avoids this.
- Picking TPT because it looks tidy, then finding every query joins five tables. Start with TPH unless you have a clear reason.
- Putting large, frequently filtered data in JSON columns. JSON is good for flexible extras, not for fields you search on every request.

### Try it yourself

1. Add an `Address` value object to `Customer` with `ComplexProperty` and check the column names.
2. Store `OrderStatus` as a string and confirm the column shows `Paid`, `Shipped` and so on.
3. Map `Payment` with TPH, then switch it to TPC and compare the tables and the SQL for `db.Payments.ToList()`.

# Module: Querying

## Lesson: [Basic|High] Querying, tracking vs no-tracking

```csharp
var c = await db.Customers.FindAsync(5);                         // checks the change tracker first, then DB
var active = await db.Customers.Where(x => x.IsActive).OrderBy(x => x.Name).ToListAsync(ct);

// Read-only: skip change tracking (faster, less memory)
var list = await db.Products.AsNoTracking().Where(p => p.Price > 100).ToListAsync(ct);

// Projection: best for read models; selects only needed columns, never tracked
var dtos = await db.Orders
    .Where(o => o.CreatedAt >= from)
    .Select(o => new OrderDto(o.Id, o.Customer.Name, o.Total))
    .ToListAsync(ct);
```

`AsNoTrackingWithIdentityResolution()`: no tracking but still one instance per key. Configure default: `UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)` for read-heavy contexts.

### How it works

A LINQ query on a `DbSet` does nothing until you enumerate it with `ToListAsync`, `FirstAsync`, `CountAsync` and so on. Up to that point you are only building an expression tree. EF then translates the whole tree to SQL, runs it and builds objects from the rows.

With tracking on, EF keeps a snapshot of every loaded entity so it can tell later what you changed. That costs memory and time. With `AsNoTracking`, EF skips the snapshot. With `Select` projections into DTOs, nothing is tracked at all, and EF only reads the columns you asked for.

### Common mistakes

- Calling `ToList()` too early and then filtering in memory. `db.Orders.ToList().Where(...)` loads the entire table.
- Tracking thousands of rows for a read-only report page.
- Returning entities straight from an API. You leak columns you did not mean to share and risk serialisation loops. Project to a DTO.

### Real-world example

A product list page with filters and paging should be one projected query: `Where` for the filters, `OrderBy`, `Skip` and `Take` for the page, and `Select` into a small DTO. That is one round trip that reads only the needed columns, with no tracking cost. The edit page loads one tracked entity because it will be saved.

### Try it yourself

1. Write the same list query three ways: tracked entities, `AsNoTracking`, and a `Select` DTO.
2. Log the SQL for each and compare the column lists.
3. Measure each with 10,000 rows using `Stopwatch` and note the difference.

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

### How it works

By default EF loads only the entity you ask for. Related data stays empty until you say how to load it. Eager loading joins the related tables into the same query. Explicit loading fetches them later when you call `Load`. Lazy loading uses proxy classes that fetch the data the moment you touch a navigation property, which feels convenient and is the most common cause of slow EF apps.

With two or more collection `Include`s in one query, SQL returns every combination of rows (a cartesian product). Ten lines and ten payments for one order becomes a hundred rows. `AsSplitQuery` sends one query per collection instead.

### Common mistakes

- The N+1 problem: one query for 50 orders, then one more query per order when a loop reads `order.Customer.Name`. That is 51 round trips.
- Including everything "just in case". Each `Include` adds joins and data you may not show.
- Using split queries without thinking about consistency. Each query runs separately, so data can change between them unless you use a transaction.

### Try it yourself

1. Turn on lazy loading, loop over 50 orders printing the customer name, and count the SQL statements in the log.
2. Fix it with `Include`, then fix it again with a `Select` projection. Compare both.
3. Include two collections, count the rows returned, then add `AsSplitQuery` and count again.

## Lesson: [Intermediate|High] Raw SQL, stored procedures and bulk operations

```csharp
// Raw SQL returning entities: interpolation is parameterised (safe)
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

`FromSqlRaw`/`ExecuteSqlRaw` take a string + parameters: never concatenate user input into them. `ExecuteUpdate/Delete` bypass the change tracker (tracked entities become stale) and run immediately.

### How it works

EF covers most queries, but sometimes SQL is simpler: a reporting query with window functions, an existing stored procedure, or a hint the DBA asked for. `FromSql` with an interpolated string turns each `{value}` into a real SQL parameter, so it is safe. The `Raw` versions take a plain string and are only safe if you pass parameters separately.

`ExecuteUpdate` and `ExecuteDelete` run one set-based statement in the database without loading any rows into memory. Updating a million rows this way takes seconds instead of minutes.

### Common mistakes

- Building SQL with `+` or `string.Format` and user input. That is SQL injection, even inside EF.
- Using `ExecuteUpdate` and then trusting tracked entities in the same context. They still hold the old values.
- Using `FromSql` with a stored procedure and then adding `Where` after it. EF cannot compose on top of `EXEC`, so it fails or filters in memory.

### Try it yourself

1. Write a report that groups sales by month with `SqlQuery<T>` into an unmapped record.
2. Delete all draft orders older than 30 days with `ExecuteDeleteAsync` and check the single SQL statement in the log.
3. Write the same delete with a loop and `Remove`, time both, and compare.

# Module: Saving Data

## Lesson: [Basic|High] Add, update, delete and SaveChanges

```csharp
// Add
db.Customers.Add(new Customer { Name = "Acme" });
await db.SaveChangesAsync(ct);

// Update: tracked (connected) scenario
var p = await db.Products.FindAsync(id);
p!.Price = 499;                                 // change tracker notices
await db.SaveChangesAsync(ct);                  // UPDATE Products SET Price = @p0 WHERE Id = @p1

// Update: disconnected (e.g. DTO from API)
db.Products.Update(product);                     // marks ALL properties modified
db.Entry(product).Property(x => x.Price).IsModified = true;   // or mark only specific ones

// Delete
db.Products.Remove(p);
await db.SaveChangesAsync(ct);
```

`SaveChanges` wraps all pending changes in **one transaction** and batches statements (SQL Server default batch up to 42 statements). Interceptors (`SaveChangesInterceptor`) or overriding `SaveChangesAsync` are common for audit fields (`CreatedAt`, `ModifiedBy`).

### How it works

`Add`, `Update` and `Remove` do not touch the database. They only change entity states in the change tracker. `SaveChangesAsync` is the moment EF compares snapshots, works out the needed statements, orders them so foreign keys are satisfied, and runs them in one transaction. If any statement fails, all of them roll back.

### Common mistakes

- Calling `SaveChanges` inside a loop. Every call is a round trip and its own transaction. Make the changes, then save once.
- Using `Update(entity)` with a DTO mapped from a form. It marks every column modified, so fields the form did not send get overwritten with defaults.
- Forgetting that `Remove` on a principal may cascade to dependents.

### Real-world example

An "edit customer" API usually loads the customer, copies only the allowed fields from the request DTO, and saves. EF then updates only the columns that actually changed. Audit fields like `UpdatedAt` and `UpdatedBy` are filled in one place by an interceptor, so no endpoint can forget them.

### Try it yourself

1. Insert 1,000 rows calling `SaveChanges` after each, then again with one `SaveChanges` at the end. Compare the time.
2. Update a customer through `Update(dto)` and through load-and-copy. Compare the generated `UPDATE` statements.
3. Add an interceptor that sets `CreatedAt` and `UpdatedAt` for every entity that implements `IAuditable`.

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

**Optimistic concurrency** (rowversion / `IsConcurrencyToken()`): no locks; detect conflicts on save, default choice for web apps. Pessimistic (locks: `SELECT ... WITH (UPDLOCK)`, serializable transactions): prevents conflicts but reduces throughput.

### How it works

Optimistic concurrency assumes conflicts are rare. Each row carries a version, usually a SQL Server `rowversion` that changes on every update. When EF saves, it adds `AND RowVersion = @original` to the `WHERE` clause. If someone else changed the row first, no rows match, EF sees zero rows affected and throws `DbUpdateConcurrencyException`. Nothing is overwritten silently.

### Common mistakes

- Having no concurrency token at all. The last save wins and nobody notices that an earlier change was lost.
- Catching the exception and simply retrying the same values. That is the same as having no check.
- Forgetting to send the row version to the browser and back in web apps. Without the original version, EF compares against the current one and never detects a conflict.

### Real-world example

Two support agents open the same ticket. The first changes the priority and saves. The second changes the status and saves a minute later. With a row version the second save fails, the screen reloads with the current values and shows the agent what changed, and the agent applies the status change again on top of the fresh data.

### Try it yourself

1. Add a `[Timestamp]` column to `Product`.
2. Load the same product in two contexts, change the price in both, and save both. Catch the exception from the second save.
3. Implement "store wins" and "client wins" handlers and explain when you would use each.

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

### How it works

Every `SaveChanges` call is already one transaction. You need an explicit transaction only when several separate operations must succeed or fail together, for example a `SaveChanges` plus an `ExecuteUpdate`, or two `SaveChanges` calls where the second needs an ID from the first.

With retry on failure turned on, EF may replay your work after a transient network error. A hand-written transaction cannot be replayed halfway through, so EF asks you to wrap it in an execution strategy that can retry the whole block.

### Common mistakes

- Keeping a transaction open while calling an external API or waiting for a user. Locks are held the whole time and other requests queue up.
- Opening a transaction and using a second `DbContext` inside it. The second context does not join the transaction unless you share the connection.
- Swallowing the exception in `catch` after the rollback, so the caller thinks the order was saved.

### Try it yourself

1. Place an order and reduce stock in one transaction. Force an exception before commit and confirm neither change is saved.
2. Turn on `EnableRetryOnFailure`, run the same code, and read the error. Fix it with `CreateExecutionStrategy`.
3. Look at the locks in SQL Server with `sys.dm_tran_locks` while the transaction is open.

# Module: Performance and Advanced

## Lesson: [Advanced|High] EF Core performance checklist

1. **Project** with `Select`: fetch only needed columns.
2. `AsNoTracking` for read-only queries.
3. Avoid **N+1**: no lazy loading in loops; `Include` or projection.
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

### How to use this checklist

Do not apply all twelve points blindly. Measure first. Turn on SQL logging or Application Insights, find the slowest or most frequent queries, and fix those. In most real apps two or three changes, usually projection, removing N+1 and adding one missing index, solve almost all the slowness.

### A worked example

A dashboard took four seconds. The log showed 120 queries. Lazy loading was reading the customer of each order inside a Razor loop (N+1), and every query loaded full entities with a large `Notes` column. The fix was one projected query with the customer name in the DTO, `AsNoTracking`, and an index on `(Status, CreatedAt)`. The page dropped to 150 milliseconds with three SQL statements.

### Common mistakes

- Adding compiled queries or context pooling before fixing the real problem. They save microseconds while N+1 costs seconds.
- Caching everything in memory to hide slow queries. The data goes stale and memory grows.
- Not checking the execution plan. A query that looks fine in LINQ may scan a whole table because an index is missing.

### Try it yourself

1. Seed 100,000 orders. Write the slowest reasonable version of an "orders this month" page.
2. Apply the checklist one item at a time and record the time after each step.
3. Keep only the changes that made a real difference and note why.

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

### How it works

A global query filter is a `Where` that EF adds to every query for that entity, including queries through `Include`. That makes it ideal for soft delete and multi-tenant apps, where forgetting the filter even once would be a bug or a data leak. Interceptors are hooks around EF operations: before saving, before a command runs, when a connection opens. Shadow properties are columns EF knows about that your class does not expose. Temporal tables keep the full history of every row in SQL Server, so you can query the data as it was at any time.

### Common mistakes

- Reading the tenant ID for a filter from a static value. Filters must read it from the current context instance, or tenants see each other's data.
- Using `IgnoreQueryFilters()` in normal code paths. Keep it for admin screens and clearly named methods.
- Doing slow work such as HTTP calls inside an interceptor. It runs on every save.

### Real-world example

A SaaS app stores the tenant ID on every table. The context receives the current tenant from the logged-in user, a global filter adds `TenantId = @tenant` to every query, and an interceptor stamps the tenant ID on every new row. Developers cannot forget either step, and a code review only needs to check the few places that call `IgnoreQueryFilters`.

### Try it yourself

1. Add soft delete with an `IsDeleted` flag, a query filter, and an interceptor that turns `Remove` into an update.
2. Add a tenant filter and write a test that proves tenant A cannot read tenant B's orders.
3. Make `Products` temporal, change a price twice, and query the old prices with `TemporalAll`.

## Lesson: [Intermediate|Medium] Testing code that uses EF Core

- **In-Memory provider**: fast but not relational (no SQL, no constraints, no transactions); Microsoft discourages it for testing DB behaviour.
- **SQLite in-memory** (`DataSource=:memory:`), relational, fast; some SQL Server differences.
- **Testcontainers** with real SQL Server: most accurate; slower startup (share one container per test run, reset with Respawn).
- Or hide EF behind repositories and mock those for unit tests of business logic.

### How to choose

Ask what you are testing. If it is business logic that happens to save data, hide the data access behind an interface and unit test the logic with a fake. If it is the query itself, the mapping or a constraint, you need a real relational database, because only a real database enforces keys, runs your SQL and behaves like production.

### A practical setup

Many teams use Testcontainers to start one SQL Server container for the whole test run, apply migrations once, and reset data between tests with Respawn. Tests stay realistic and the suite still finishes in a minute or two.

```csharp
public class DbFixture : IAsyncLifetime
{
    private readonly MsSqlContainer _sql = new MsSqlBuilder().Build();
    public AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(_sql.GetConnectionString()).Options);

    public async Task InitializeAsync()
    {
        await _sql.StartAsync();
        await using var db = CreateContext();
        await db.Database.MigrateAsync();
    }
    public Task DisposeAsync() => _sql.DisposeAsync().AsTask();
}
```

### Common mistakes

- Testing with the In-Memory provider and trusting the result. It ignores unique indexes, foreign keys and transactions, so tests pass while production fails.
- Sharing data between tests so they only pass in a certain order.
- Mocking `DbSet` with a mocking library. It is painful and does not prove the query works.

### Try it yourself

1. Write a test that inserts two products with the same unique `Sku`. Run it with the In-Memory provider, then with SQLite or Testcontainers, and compare.
2. Build the fixture above and write three tests for an order service.
3. Add Respawn and make the tests run in any order.

# Interview

## [Beginner|High] What is Entity Framework Core and what are its advantages?

An open-source, cross-platform ORM that maps C# classes to database tables. You query with LINQ and EF generates parameterised SQL, tracks changes and saves them in a transaction. Advantages: productivity (less data-access boilerplate), strong typing and compile-time checks, migrations for schema evolution, multiple DB providers, built-in protection from SQL injection, relationships and change tracking handled for you. Trade-offs: generated SQL must be monitored for performance; complex reports may be better in raw SQL/Dapper.

## [Beginner|High] Code-first vs database-first?

Code-first: you design entity classes and DbContext; migrations create and evolve the schema, the model is the source of truth (common for new projects). Database-first: the database exists (or DBAs own it); you scaffold entities and context from it with `dotnet ef dbcontext scaffold` and re-scaffold when the schema changes. EF Core has no EDMX designer (that was EF6).

## [Beginner|High] What is DbContext? Is it thread-safe? What lifetime should it have?

DbContext represents a session with the database: it holds DbSets, the change tracker, configuration, and implements unit of work (`SaveChanges`). It is **not thread-safe**: never share it across concurrent operations (no parallel `await`s on the same context). Register it scoped in ASP.NET Core (one per request) and keep it short-lived; use `IDbContextFactory` for background services, Blazor Server or parallel work.

## [Beginner|High] What are migrations? What commands do you use?

Migrations are versioned C# files describing schema changes (Up/Down), generated by comparing the current model with the model snapshot. Commands: `dotnet ef migrations add <Name>`, `dotnet ef database update [target]`, `dotnet ef migrations remove`, `dotnet ef migrations list`, `dotnet ef migrations script --idempotent`, `dotnet ef migrations bundle`. Applied migrations are recorded in `__EFMigrationsHistory`.

## [Beginner|High] What is the difference between eager, lazy and explicit loading?

Eager: related data loaded in the same query with `Include`/`ThenInclude`. Explicit: load later on demand with `Entry(x).Collection(...).Load()` / `.Reference(...).Load()`. Lazy: navigation properties load automatically on first access (needs proxies or `ILazyLoader`, virtual navigations), convenient but causes hidden N+1 queries. Projections (`Select`) are often better than any of them for read models.

## [Beginner|Medium] What is the difference between `Find` and `FirstOrDefault`?

`Find(key)` looks up by primary key and first checks the **change tracker**: if the entity is already tracked, no DB query is sent. `FirstOrDefault(predicate)` always queries the database (with any predicate) and supports `Include`/ordering. `Find` can't use `Include`.

## [Intermediate|High] What is change tracking? What is AsNoTracking?

When EF loads entities it keeps a snapshot of their original values. On `SaveChanges`, `DetectChanges` compares current vs original values and generates UPDATEs for changed columns; entity states drive INSERT/DELETE. `AsNoTracking()` skips this: faster and less memory for read-only queries, but changes to those objects won't be saved unless you attach them.

## [Intermediate|High] Explain entity states in EF Core.

Detached (not tracked), Added (INSERT on save), Unchanged (loaded, no changes), Modified (UPDATE on save), Deleted (DELETE on save). Inspect/set with `db.Entry(entity).State`. `Attach` → Unchanged; `Update` → Modified (all properties); `Add` → Added; `Remove` → Deleted (or detached if it was Added). After a successful save, Added/Modified become Unchanged and Deleted become Detached.

## [Intermediate|High] What is the N+1 problem and how do you avoid it in EF Core?

Loading N parent entities with one query and then triggering one query per parent for its related data (usually lazy loading in a loop or view). Avoid by eager loading (`Include`), projecting into DTOs with the needed related fields in one query, using `AsSplitQuery` when including collections, and disabling lazy loading. Detect via SQL logging or profilers showing many similar queries.

## [Intermediate|High] How does EF Core handle concurrency?

Optimistic concurrency via concurrency tokens: a `[Timestamp]`/`IsRowVersion()` `rowversion` column (SQL Server updates it automatically) or `IsConcurrencyToken()` on specific properties. EF adds the original value to the UPDATE/DELETE `WHERE` clause; if 0 rows are affected it throws `DbUpdateConcurrencyException`, which you handle by reloading, overwriting (client wins) or merging. No database locks are held between read and write.

## [Intermediate|High] How do you configure relationships? Data annotations vs Fluent API?

By convention (navigation properties + `XxxId` FK), data annotations (`[ForeignKey]`, `[InverseProperty]`, `[Required]`), or Fluent API (`HasOne/WithMany/HasForeignKey/OnDelete`). Fluent API has the highest precedence, keeps domain classes free of persistence attributes and supports everything (composite keys, indexes, delete behaviour, owned types, filters). Organise it in `IEntityTypeConfiguration<T>` classes.

## [Intermediate|Medium] What are global query filters? Give use cases.

LINQ predicates configured per entity type in `OnModelCreating` (`HasQueryFilter`) that EF automatically adds to every query for that type: e.g. soft delete (`!IsDeleted`) and multi-tenancy (`TenantId == currentTenant`). Bypass with `IgnoreQueryFilters()`. EF Core 10 adds named filters so you can disable them individually.

## [Intermediate|Medium] How do you execute raw SQL or stored procedures in EF Core?

`FromSql($"...")` (interpolated → parameterised) or `FromSqlRaw(sql, params)` on a DbSet returns entities and can be composed with LINQ (if the SQL is composable). `Database.SqlQuery<T>($"...")` returns unmapped types (EF 8). `Database.ExecuteSql($"...")`/`ExecuteSqlRaw` for non-queries/stored procedures. Never concatenate user input into the raw variants.

## [Intermediate|Medium] What are ExecuteUpdate and ExecuteDelete?

EF Core 7 set-based operations that translate directly into a single `UPDATE`/`DELETE ... WHERE` statement without loading entities into memory or using the change tracker: e.g. `db.Orders.Where(o => o.Expired).ExecuteDeleteAsync()`. Much faster for bulk changes. Caveats: they run immediately (not part of `SaveChanges` unless inside an explicit transaction) and tracked entities aren't updated.

## [Advanced|High] How do you improve EF Core query performance?

Project only needed columns; `AsNoTracking`; avoid N+1 and lazy loading; `AsSplitQuery` for multiple collection includes; paginate; add indexes for filters and sorts; set-based `ExecuteUpdate/Delete`; compiled queries and DbContext pooling for hot paths; check generated SQL and execution plans; avoid client evaluation; batch writes; keep contexts small; cache read-mostly data; and use Dapper or views/stored procedures for complex reporting queries.

## [Advanced|Medium] What is the difference between `Update()` and attaching then setting properties?

`db.Update(entity)` attaches a detached entity and marks **all** properties as Modified → UPDATE writes every column (can overwrite concurrent changes in other columns). Loading the entity and setting properties (or `Attach` + marking specific properties `IsModified = true`) updates only changed columns. In APIs, prefer loading → mapping the DTO onto the tracked entity → saving, with a concurrency token.

## [Advanced|Medium] EF Core vs EF6: key differences?

EF Core: cross-platform, lighter, faster, supports more DB providers incl. Cosmos, has features like global query filters, `ExecuteUpdate`, JSON columns, compiled models, split queries; no EDMX designer, no ObjectContext. EF6: .NET Framework-centric (also runs on .NET Core 3.1+), EDMX/database-first designer, mature but maintenance only. New development should use EF Core.

## [Scenario|High] A page listing 50 orders takes 5 seconds and the log shows 51 SQL queries. Fix it.

Classic N+1: one query for orders and one per order for its customer (lazy loading). Replace with a single projection: `db.Orders.AsNoTracking().OrderByDescending(o => o.CreatedAt).Take(50).Select(o => new OrderRow(o.Id, o.Customer.Name, o.Total)).ToListAsync()` → one SQL with a JOIN. Disable lazy loading globally, add an index on `CreatedAt`, and confirm with logging that only one query runs.

## [Scenario|High] Two users edit the same product price at the same time and the later save silently overwrites the earlier one. How do you prevent lost updates?

Add a `rowversion` concurrency token (`[Timestamp] byte[] RowVersion`). Send the RowVersion to the client with the data and back on update; set it as the original value (`db.Entry(p).Property(x => x.RowVersion).OriginalValue = dto.RowVersion`). If someone else saved first, EF throws `DbUpdateConcurrencyException`; return **409 Conflict** (or 412 with ETags) with the current values so the user can review and retry.

## [Scenario|High] You need to delete 5 million log rows older than 90 days nightly without blocking the app. What do you do?

Don't load entities. Use `ExecuteDeleteAsync` in **batches** (e.g. loop deleting `Take(10_000)` by key range or `TOP (10000)` raw SQL until 0 rows) to keep transactions small and avoid lock escalation and log growth; run off-peak via a background job; make sure the date column is indexed. Better long-term: table partitioning by month and `TRUNCATE`/switch out old partitions, or a retention policy in a time-series store.

## [Scenario|Medium] Deploying a migration renamed a column and dropped production data. How do you prevent this?

EF scaffolded the rename as drop + add. Prevention: always review generated migrations; use `migrationBuilder.RenameColumn` explicitly (or `HasColumnName` to keep the DB name); apply schema changes through reviewed **idempotent SQL scripts** in the pipeline with a DBA/peer review; take backups before deploying; use expand-contract (add new column → backfill → switch code → drop old later) for zero-downtime changes; test migrations against a production-like copy.

## [Scenario|Medium] A BackgroundService throws "A second operation was started on this context instance before a previous operation completed." Why?

The same DbContext was used concurrently: e.g. parallel tasks (`Task.WhenAll`) or a singleton service holding one context. DbContext isn't thread-safe. Fix: create a new scope/context per unit of work (`IServiceScopeFactory` or `IDbContextFactory<T>.CreateDbContext()` per task), and `await` each operation before starting the next on the same context.

## [Intermediate|Medium] What is the difference between DbContext and ObjectContext?

`ObjectContext` was the original Entity Framework (EF 1–4) API: verbose, tied to EDMX models and `ObjectSet<T>`. `DbContext` (EF 4.1+) is a simpler, lightweight wrapper over ObjectContext with `DbSet<T>`, Code First, change tracking via `ChangeTracker` and easy configuration; you could still reach the ObjectContext through `IObjectContextAdapter` in EF6. EF Core has only `DbContext`: ObjectContext doesn't exist there.

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
