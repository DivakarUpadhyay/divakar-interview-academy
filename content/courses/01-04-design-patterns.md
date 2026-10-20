---
slug: design-patterns
title: Design Patterns (GoF + Enterprise) in C#
track: foundations
order: 4
icon: DP
color: #5f3dc4
summary: Creational, structural and behavioural Gang-of-Four patterns with C# code, plus Repository, Unit of Work, CQRS, Mediator, Options and microservice patterns.
---

# Overview

A **design pattern** is a proven, reusable solution to a common design problem: a template, not finished code. The classic catalogue is *Design Patterns: Elements of Reusable Object-Oriented Software* (1994) by the **Gang of Four** (Gamma, Helm, Johnson, Vlissides), with **23 patterns** in three groups:

| Group | Purpose | Patterns |
|---|---|---|
| **Creational** (5) | How objects are created | Singleton, Factory Method, Abstract Factory, Builder, Prototype |
| **Structural** (7) | How objects are composed | Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy |
| **Behavioural** (11) | How objects interact | Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor |

Enterprise and cloud patterns used daily in .NET: Repository, Unit of Work, Dependency Injection, CQRS, Mediator (MediatR), Options, Specification, Outbox, Circuit Breaker, Retry, Saga, API Gateway.

# Versions

| Year | Milestone |
|---|---|
| 1977 | Christopher Alexander, *A Pattern Language* (architecture) inspires software patterns |
| 1994 | GoF book: 23 patterns |
| 1996 | *Pattern-Oriented Software Architecture* (POSA) |
| 2002 | Martin Fowler, *Patterns of Enterprise Application Architecture* — Repository, Unit of Work, Data Mapper, Active Record |
| 2003 | Eric Evans, *Domain-Driven Design* — Aggregates, Value Objects, Domain Events |
| 2003 | Hohpe & Woolf, *Enterprise Integration Patterns* — messaging |
| 2010s | Cloud design patterns (Microsoft Azure Architecture Center): Circuit Breaker, Retry, CQRS, Event Sourcing, Saga, Strangler Fig |

# Lifecycle

How to use a pattern well:

1. **Notice the problem** (e.g. a growing `switch` on type, an awkward third-party API, object creation spread everywhere).
2. **Name the pattern** that fits (Strategy, Adapter, Factory).
3. **Apply it minimally** — the simplest version that solves today's problem.
4. **Test** behaviour through the abstraction.
5. **Revisit** — remove a pattern that adds indirection with no benefit.

> Patterns are a vocabulary. Saying "I wrapped the SDK in an Adapter and added a caching Decorator" communicates a whole design in one sentence.

# Tools

- **refactoring.guru** — free illustrated catalogue (with C# examples).
- **dofactory.com** — .NET-specific pattern examples.
- **MediatR** — Mediator/CQRS pipeline library (commercial licence from v13).
- **Polly / Microsoft.Extensions.Http.Resilience** — Retry, Circuit Breaker, Timeout, Bulkhead.
- **Scrutor** — Decorator registration in ASP.NET Core DI.
- **Azure Architecture Center — Cloud design patterns** catalogue.

# Module: Creational Patterns

## Lesson: [Basic|High] Singleton

Ensure a class has **one instance** with a global access point.

```csharp
// Thread-safe, lazy Singleton
public sealed class AppConfig
{
    private static readonly Lazy<AppConfig> _instance = new(() => new AppConfig());
    public static AppConfig Instance => _instance.Value;
    private AppConfig() { /* load settings once */ }
    public string ConnectionString { get; private set; } = "";
}

// Modern .NET: let the DI container own the lifetime instead
builder.Services.AddSingleton<IAppConfig, AppConfig>();
```

Other thread-safe options: a `static readonly` field (initialised by the CLR's type initialiser, thread-safe), or double-checked locking. Downsides of the hand-written pattern: global state, hidden dependencies, hard to test. Prefer `AddSingleton`.

## Lesson: [Basic|High] Factory Method and Simple Factory

Let a method decide **which concrete class** to create; callers depend only on the abstraction.

```csharp
public interface INotification { void Send(string to, string msg); }
public class EmailNotification : INotification { public void Send(string to, string msg) { } }
public class SmsNotification : INotification { public void Send(string to, string msg) { } }

// Simple factory
public static class NotificationFactory
{
    public static INotification Create(string channel) => channel switch
    {
        "email" => new EmailNotification(),
        "sms" => new SmsNotification(),
        _ => throw new ArgumentException($"Unknown channel {channel}")
    };
}

// GoF Factory Method: subclasses decide what to create
public abstract class DocumentExporter
{
    protected abstract IWriter CreateWriter();          // factory method
    public void Export(Doc d) { var w = CreateWriter(); w.Write(d); }
}
public class PdfExporter : DocumentExporter { protected override IWriter CreateWriter() => new PdfWriter(); }
```

In .NET: `IHttpClientFactory.CreateClient()`, `ILoggerFactory.CreateLogger()`, `DbProviderFactory`.

## Lesson: [Intermediate|Medium] Abstract Factory

Create **families of related objects** without naming concrete classes.

```csharp
public interface IUiFactory { IButton CreateButton(); ITextBox CreateTextBox(); }
public class LightThemeFactory : IUiFactory { public IButton CreateButton() => new LightButton(); public ITextBox CreateTextBox() => new LightTextBox(); }
public class DarkThemeFactory : IUiFactory { public IButton CreateButton() => new DarkButton(); public ITextBox CreateTextBox() => new DarkTextBox(); }

// e.g. ADO.NET: DbProviderFactory creates matching DbConnection, DbCommand, DbParameter for SQL Server / Oracle / SQLite
DbProviderFactory f = SqlClientFactory.Instance;
using DbConnection conn = f.CreateConnection()!;
using DbCommand cmd = f.CreateCommand()!;
```

Factory Method = one product via inheritance; Abstract Factory = a family of products via composition.

## Lesson: [Intermediate|High] Builder

Construct a complex object **step by step**, separating construction from representation. Fluent builders are everywhere in .NET.

```csharp
public class EmailBuilder
{
    private readonly MailMessage _m = new();
    public EmailBuilder From(string a) { _m.From = new MailAddress(a); return this; }
    public EmailBuilder To(string a) { _m.To.Add(a); return this; }
    public EmailBuilder Subject(string s) { _m.Subject = s; return this; }
    public EmailBuilder Html(string body) { _m.Body = body; _m.IsBodyHtml = true; return this; }
    public MailMessage Build() => _m.To.Count == 0 ? throw new InvalidOperationException("No recipient") : _m;
}

var mail = new EmailBuilder().From("hr@corp.test").To("divakar@corp.test").Subject("Offer").Html("<b>Welcome</b>").Build();

// .NET examples: WebApplication.CreateBuilder(), StringBuilder, UriBuilder, SqlConnectionStringBuilder, EF Core ModelBuilder
```

## Lesson: [Intermediate|Low] Prototype

Create new objects by **cloning** an existing one.

```csharp
public record ReportTemplate(string Title, string Font, IReadOnlyList<string> Columns);
var monthly = new ReportTemplate("Monthly", "Segoe UI", ["Date", "Sales"]);
var weekly = monthly with { Title = "Weekly" };     // records give shallow cloning via 'with'
```

Watch out for **shallow vs deep copy**: `MemberwiseClone()` and `with` copy references to nested objects.

# Module: Structural Patterns

## Lesson: [Intermediate|High] Adapter

Convert one interface into another that clients expect — wrap a legacy or third-party API.

```csharp
public interface ISmsSender { Task SendAsync(string phone, string text); }   // our interface

public class TwilioSmsAdapter(TwilioRestClient client, string from) : ISmsSender      // adapts the SDK
{
    public Task SendAsync(string phone, string text) =>
        MessageResource.CreateAsync(to: new PhoneNumber(phone), from: new PhoneNumber(from), body: text, client: client);
}
```

Benefits: the vendor SDK is isolated in one class, so switching providers or mocking in tests is easy.

## Lesson: [Intermediate|High] Decorator

Add behaviour to an object **dynamically by wrapping it**, without changing its class. Wrappers implement the same interface.

```csharp
public interface IProductRepository { Task<Product?> GetAsync(int id); }

public class SqlProductRepository(AppDbContext db) : IProductRepository
{
    public Task<Product?> GetAsync(int id) => db.Products.FindAsync(id).AsTask();
}

public class CachedProductRepository(IProductRepository inner, IMemoryCache cache) : IProductRepository
{
    public Task<Product?> GetAsync(int id) =>
        cache.GetOrCreateAsync($"product:{id}", e => { e.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5); return inner.GetAsync(id); });
}

// With Scrutor:
builder.Services.AddScoped<IProductRepository, SqlProductRepository>();
builder.Services.Decorate<IProductRepository, CachedProductRepository>();
```

.NET examples: `Stream` wrappers (`BufferedStream`, `GZipStream`, `CryptoStream`), `DelegatingHandler` in `HttpClient`.

## Lesson: [Intermediate|Medium] Facade, Proxy and Composite

**Facade** — one simple interface over a complex subsystem.

```csharp
public class CheckoutFacade(IInventory inv, IPayment pay, IShipping ship, IEmail email)
{
    public async Task<OrderResult> PlaceOrder(Cart cart)
    {
        await inv.ReserveAsync(cart);
        var receipt = await pay.ChargeAsync(cart.Total);
        var tracking = await ship.BookAsync(cart);
        await email.SendConfirmationAsync(cart.CustomerEmail, tracking);
        return new OrderResult(receipt, tracking);
    }
}
```

**Proxy** — a stand-in that controls access: lazy loading (EF Core lazy-loading proxies), remote proxies (gRPC/WCF clients), protection proxies (authorisation checks), caching proxies.

**Composite** — treat individual objects and groups the same way (tree structures).

```csharp
public interface IMenuItem { decimal Price(); }
public record Dish(string Name, decimal Cost) : IMenuItem { public decimal Price() => Cost; }
public class Combo(params IMenuItem[] items) : IMenuItem { public decimal Price() => items.Sum(i => i.Price()) * 0.9m; }
```

## Lesson: [Advanced|Low] Bridge and Flyweight

**Bridge** — separate an abstraction from its implementation so both can vary independently (e.g. `Notification` × `Channel`: Urgent/Normal notifications over Email/SMS without 4 subclasses).

**Flyweight** — share common immutable state across many objects to save memory (e.g. string interning, glyph objects in a text editor, `ArrayPool<T>` is a related idea).

# Module: Behavioural Patterns

## Lesson: [Basic|High] Strategy

Define a family of algorithms, encapsulate each one, and make them **interchangeable at runtime**.

```csharp
public interface IShippingCost { string Mode { get; } decimal Calculate(decimal weightKg); }
public class Standard : IShippingCost { public string Mode => "standard"; public decimal Calculate(decimal w) => 50 + w * 10; }
public class Express : IShippingCost { public string Mode => "express"; public decimal Calculate(decimal w) => 120 + w * 25; }

public class ShippingService(IEnumerable<IShippingCost> strategies)
{
    public decimal Quote(string mode, decimal kg) => strategies.Single(s => s.Mode == mode).Calculate(kg);
}
```

The most common answer to "how do you remove a big switch statement?". Also: `IComparer<T>` passed to `Sort` is a strategy.

## Lesson: [Intermediate|High] Observer and events

Subjects notify subscribed observers when state changes. In C#: **events/delegates**, `IObservable<T>`/`IObserver<T>`, Rx, and at system level message brokers (pub/sub).

```csharp
public class StockTicker
{
    public event EventHandler<PriceChanged>? PriceChanged;
    public void Update(string sym, decimal price) => PriceChanged?.Invoke(this, new PriceChanged(sym, price));
}
var ticker = new StockTicker();
ticker.PriceChanged += (_, e) => Console.WriteLine($"{e.Symbol}: {e.Price}");
```

Remember to **unsubscribe** (`-=`) — a long-lived publisher holding handlers of short-lived subscribers is a classic memory leak.

## Lesson: [Intermediate|High] Chain of Responsibility (and ASP.NET Core middleware)

Pass a request along a chain of handlers; each handles it or passes it on.

```csharp
app.Use(async (context, next) =>
{
    var sw = Stopwatch.StartNew();
    await next(context);                         // pass to the next handler
    context.Response.Headers["X-Elapsed-Ms"] = sw.ElapsedMilliseconds.ToString();
});
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

Other examples: `HttpClient` `DelegatingHandler` pipeline, MediatR pipeline behaviours, approval workflows (Team Lead → Manager → Director by amount).

## Lesson: [Intermediate|Medium] Command, Template Method, State and Mediator

**Command** — wrap a request as an object (queue it, log it, undo it). CQRS commands (`PlaceOrderCommand`) and background job payloads are commands.

**Template Method** — the base class defines the algorithm's skeleton; subclasses fill in steps.

```csharp
public abstract class DataImporter
{
    public void Run() { var raw = Extract(); var clean = Transform(raw); Load(clean); }   // fixed skeleton
    protected abstract string[] Extract();
    protected virtual string[] Transform(string[] rows) => rows.Where(r => r.Length > 0).ToArray();
    protected abstract void Load(string[] rows);
}
```

**State** — an object changes behaviour when its internal state changes (Order: Pending → Paid → Shipped → Delivered, each state class allowing only valid transitions).

**Mediator** — objects talk through a mediator instead of directly, which reduces coupling. MediatR: controllers send `IRequest`s, handlers process them.

```csharp
public record GetOrder(int Id) : IRequest<OrderDto?>;
public class GetOrderHandler(AppDbContext db) : IRequestHandler<GetOrder, OrderDto?>
{
    public Task<OrderDto?> Handle(GetOrder q, CancellationToken ct) =>
        db.Orders.Where(o => o.Id == q.Id).Select(o => new OrderDto(o.Id, o.Total)).FirstOrDefaultAsync(ct);
}
// controller: return await mediator.Send(new GetOrder(id));
```

## Lesson: [Advanced|Low] Iterator, Visitor, Memento and Interpreter

- **Iterator** — sequential access without exposing internals: `IEnumerable<T>` + `yield return`.
- **Visitor** — add operations to a class hierarchy without changing it (double dispatch); Roslyn syntax walkers and LINQ `ExpressionVisitor` use it.
- **Memento** — capture and restore state (undo). Records + `with` make snapshots easy.
- **Interpreter** — evaluate a small grammar (rule engines, expression trees).

# Module: Enterprise and Cloud Patterns

## Lesson: [Intermediate|High] Repository and Unit of Work

**Repository** — a collection-like abstraction over data access. **Unit of Work** — tracks changes and commits them in **one transaction**.

```csharp
public interface IOrderRepository
{
    Task<Order?> GetAsync(int id, CancellationToken ct = default);
    void Add(Order order);
}
public interface IUnitOfWork { Task<int> SaveChangesAsync(CancellationToken ct = default); }

public class OrderRepository(AppDbContext db) : IOrderRepository
{
    public Task<Order?> GetAsync(int id, CancellationToken ct) => db.Orders.Include(o => o.Lines).FirstOrDefaultAsync(o => o.Id == id, ct);
    public void Add(Order order) => db.Orders.Add(order);
}
```

Note: EF Core's `DbSet<T>` already is a repository and `DbContext` a unit of work. Many teams use `DbContext` directly. Others add repositories per **aggregate** to keep EF out of the domain and simplify testing. A **generic** repository over EF often adds little value — be ready to discuss this trade-off.

## Lesson: [Advanced|High] CQRS, Outbox and Saga

**CQRS** — separate the **write model** (commands that change state, with validation and business rules) from the **read model** (queries optimised for display, e.g. Dapper or views). It can share one database or use separate read stores.

**Transactional Outbox** — to reliably publish an event when data changes, save the event in an `Outbox` table **in the same DB transaction** as the business data; a background worker publishes it to the broker and marks it sent. This avoids "saved but message lost" or "message sent but save rolled back".

**Saga** — manage a business transaction spanning several services (each with its own DB) as a sequence of local transactions with **compensating actions** on failure (orchestration via a coordinator, or choreography via events).

## Lesson: [Advanced|High] Resilience patterns: Retry, Circuit Breaker, Timeout, Bulkhead

```csharp
// .NET 8+: Microsoft.Extensions.Http.Resilience (built on Polly v8)
builder.Services.AddHttpClient<IPaymentClient, PaymentClient>(c => c.BaseAddress = new Uri("https://pay.example"))
    .AddStandardResilienceHandler();   // rate limiter, total timeout, retry (exponential + jitter), circuit breaker, attempt timeout
```

- **Retry** — transient failures; use exponential backoff + jitter; only for idempotent operations.
- **Circuit Breaker** — after N failures, stop calling for a period (open), then test (half-open), then close.
- **Timeout** — never wait forever.
- **Bulkhead** — isolate resources so one slow dependency can't exhaust all threads/connections.
- **Fallback** — default/cached response when everything fails.

## Lesson: [Intermediate|Medium] Options pattern and other .NET-specific patterns

```csharp
public class SmtpSettings { public string Host { get; set; } = ""; public int Port { get; set; } }
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));
builder.Services.AddOptions<SmtpSettings>().BindConfiguration("Smtp").ValidateDataAnnotations().ValidateOnStart();

public class Mailer(IOptions<SmtpSettings> opt) { private readonly SmtpSettings _s = opt.Value; }
```

`IOptions<T>` (singleton, read once), `IOptionsSnapshot<T>` (scoped, re-read per request), `IOptionsMonitor<T>` (singleton with change notifications).

Also: **Specification** pattern (encapsulate query criteria), **Result** pattern (return success/failure objects instead of throwing for expected errors), **Null Object**, **Lazy loading**.

# Interview

## [Beginner|High] What are design patterns? Name the three GoF categories.

Reusable, named solutions to recurring design problems. GoF (1994) lists 23 in three categories: **Creational** (Singleton, Factory Method, Abstract Factory, Builder, Prototype), **Structural** (Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy), **Behavioural** (Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor).

## [Beginner|High] How do you implement a thread-safe Singleton in C#?

Use `Lazy<T>`: `private static readonly Lazy<Svc> _i = new(() => new Svc()); public static Svc Instance => _i.Value;` with a private constructor and a `sealed` class. `Lazy<T>` is thread-safe by default (`ExecutionAndPublication`). Alternatives: a `static readonly` field (thread-safe because of the type initialiser), or double-checked locking with `volatile`. In ASP.NET Core, prefer `services.AddSingleton<ISvc, Svc>()`. It's testable and the container manages the lifetime.

## [Beginner|High] What is the difference between Factory Method and Abstract Factory?

Factory Method creates **one product**, and subclasses (or a method) decide which concrete class to create. Abstract Factory creates a **family of related products** through an interface with several create methods (button + textbox for a theme; connection + command + parameter for a DB provider). Factory Method uses inheritance; Abstract Factory uses composition (you pass the factory object).

## [Beginner|High] What is the Strategy pattern? Where have you used it?

It encapsulates interchangeable algorithms behind an interface and selects one at runtime. Examples: discount rules, shipping cost calculators, payment gateways, export formats, tax rules by country. With DI, register every strategy and inject `IEnumerable<IStrategy>`, or use keyed services (.NET 8). It removes `switch` statements and satisfies OCP.

## [Intermediate|High] What is the difference between Decorator and Adapter?

A Decorator keeps the **same interface** and **adds behaviour** (caching, logging, retry) by wrapping an object. You can stack several. An Adapter **changes the interface** so an incompatible class fits what the client expects (wrapping a vendor SDK behind `ISmsSender`). In short, Decorator = same interface + extra behaviour; Adapter = different interface, same behaviour.

## [Intermediate|High] Explain the Repository and Unit of Work patterns. Do you need them with EF Core?

A Repository hides data access behind a collection-like interface; Unit of Work groups changes into one transaction. EF Core already implements both (`DbSet<T>`, `DbContext.SaveChanges`). Adding them on top is optional. **Pros:** domain code doesn't reference EF, queries are centralised, testing is easier. **Cons:** extra layers, and generic repositories often leak `IQueryable` or limit EF features. A balanced answer: aggregate-specific repositories in DDD/Clean Architecture; direct `DbContext` usage in simpler apps, with integration tests using SQLite/Testcontainers.

## [Intermediate|High] How is ASP.NET Core middleware an example of Chain of Responsibility?

Each middleware receives the `HttpContext` and a `next` delegate. It can act before and after calling `next`, or short-circuit (e.g. return 401 without calling the rest). The order of `app.Use...` calls defines the chain: exception handler → HTTPS redirection → static files → routing → CORS → authentication → authorization → endpoints.

## [Intermediate|High] What is the Observer pattern and how does C# support it?

Observers subscribe to a subject and get notified of changes. C# supports it with **events and delegates** (`event EventHandler<T>`), `IObservable<T>`/`IObserver<T>` (with Rx.NET), `INotifyPropertyChanged` in UI binding, and at architecture level pub/sub messaging (Azure Service Bus topics, Kafka). Pitfall: forgetting to unsubscribe causes memory leaks.

## [Intermediate|Medium] What is the Facade pattern? Give a real example.

A Facade provides a simple API over a complicated subsystem. Example: a `CheckoutService.PlaceOrder()` that coordinates inventory, payment, shipping and email so the controller makes one call. In .NET, `File.ReadAllText` is a facade over `FileStream` + `StreamReader` + encoding detection.

## [Intermediate|Medium] What is the Builder pattern? Show .NET examples.

Builder constructs complex objects step by step, often fluently, and validates at `Build()`. .NET examples: `WebApplication.CreateBuilder(args)` → `builder.Build()`, `StringBuilder`, `UriBuilder`, `SqlConnectionStringBuilder`, `HostBuilder`, EF Core's `ModelBuilder` fluent API, and test-data builders in unit tests.

## [Intermediate|Medium] What is the Mediator pattern and what does MediatR do?

Mediator centralises communication so components don't reference each other directly. MediatR implements an in-process mediator: controllers `Send` a request object, and exactly one handler processes it. Notifications can go to many handlers. Pipeline behaviours add cross-cutting concerns (validation, logging, transactions). Note: MediatR moved to a commercial licence from version 13 (2025). Some teams write a small mediator themselves or call handlers directly.

## [Intermediate|Medium] Template Method vs Strategy?

Both vary part of an algorithm. **Template Method** uses **inheritance**: the base class fixes the skeleton and subclasses override steps, decided at compile time. **Strategy** uses **composition**: the whole algorithm is an injected object, swappable at runtime. Prefer Strategy for flexibility; Template Method suits frameworks with a fixed workflow (e.g. ETL importers, `BackgroundService.ExecuteAsync`).

## [Advanced|High] Explain CQRS. When is it worth it?

Command Query Responsibility Segregation splits writes (commands, rich domain model, validation) from reads (queries, flat DTOs, maybe Dapper/views/a separate read DB). It's worth it when read and write workloads or shapes differ a lot, for complex domains, or for high read scale. It can be as light as separate command and query handler classes on one DB. It adds complexity, and with separate stores you get **eventual consistency**. Don't use it for simple CRUD.

## [Advanced|High] What is the Outbox pattern and why is it needed?

It's for publishing an integration event reliably when a DB change commits. Writing to the DB and then publishing to a broker is not atomic (dual-write problem). With Outbox, the event row is inserted into an `OutboxMessages` table **in the same transaction** as the business change. A background processor reads unsent rows, publishes them, and marks them sent. Delivery is **at-least-once**, so consumers must be idempotent (Inbox table or dedupe key). Libraries: MassTransit, NServiceBus, Wolverine, CAP.

## [Advanced|High] How do Retry and Circuit Breaker work together?

Retry handles brief transient faults (timeouts, 503, 429) with exponential backoff and jitter. The Circuit Breaker wraps retries: if failures exceed a threshold, it **opens** and fails fast for a break period, protecting the struggling dependency and your own threads. Then it goes **half-open** to probe, and **closes** on success. In .NET 8+, `AddStandardResilienceHandler()` configures them with timeouts and rate limiting. Retry only idempotent operations, or use idempotency keys.

## [Advanced|Medium] What is the Saga pattern?

It coordinates a distributed transaction across microservices without 2PC: a sequence of local transactions, each publishing an event or command. If a step fails, **compensating transactions** undo earlier steps (refund the payment, release the stock). **Orchestration**: a central saga orchestrator (state machine) tells services what to do. **Choreography**: services react to each other's events. Orchestration is easier to follow; choreography is more decoupled.

## [Advanced|Low] What is the Specification pattern?

It encapsulates a business rule or query criterion in an object (`IsActiveCustomerSpec`, `OrdersAboveAmountSpec(1000)`). You can combine them (And/Or/Not) and reuse them for in-memory checks and EF Core queries (as `Expression<Func<T,bool>>`). It keeps query logic out of controllers and avoids duplicated `Where` clauses. Ardalis.Specification is a popular library.

## [Scenario|High] The product details page calls the DB for every request and is slow. You can't change the repository class. Which pattern helps?

A **Decorator**: `CachedProductRepository : IProductRepository` wraps the existing repository, checks `IMemoryCache`/`IDistributedCache` (Redis) first, and falls back to the inner repository on a miss. Register it with Scrutor's `Decorate<,>` or manual factory registration. No existing code changes (OCP). Add expiration, and invalidate on product updates (remove the cache key in the update path, or publish an event).

## [Scenario|High] Your app must support three SMS vendors and switch between them by configuration or when one is down. Design it.

Define `ISmsSender`. Write an **Adapter** per vendor SDK (`TwilioSender`, `GupshupSender`, `MsgKitSender`), registered as keyed services or `IEnumerable<ISmsSender>`. Choose the active one from `IOptionsMonitor<SmsOptions>` (Strategy) so config changes apply without a restart. Add a **failover decorator** that tries the primary and, on failure or an open circuit (Polly Circuit Breaker), uses the secondary. Log the vendor used, and make sends idempotent with a message ID.

## [Scenario|Medium] An expense approval needs Team Lead below ₹10,000, Manager up to ₹1,00,000, and Director above. Which pattern?

**Chain of Responsibility**: `IApprover` with `SetNext(IApprover)` and `Handle(Expense)`. Each approver handles it if the amount is within its limit, otherwise it passes it on. Build the chain from configuration so limits and new levels don't need code changes. A **State** pattern can track the expense's lifecycle (Submitted → Approved/Rejected → Paid).

## [Scenario|Medium] When an order is placed you must save it, publish `OrderPlaced` to Service Bus, and never lose the message even if the broker is down. How?

Use the **Transactional Outbox**: in the same `SaveChanges` transaction, insert the order and an outbox row with the serialized event. A `BackgroundService` polls unsent outbox rows, publishes them to Service Bus, and marks them sent, retrying while the broker is down. Consumers dedupe by message ID (idempotent consumer / Inbox). MassTransit's EF Core outbox does this out of the box.

# Cheatsheet

## 23 GoF patterns — one line each

| Pattern | One line |
|---|---|
| Singleton | One instance (`Lazy<T>` / `AddSingleton`) |
| Factory Method | Subclass/method decides concrete type |
| Abstract Factory | Family of related objects |
| Builder | Step-by-step construction, fluent |
| Prototype | Clone existing object |
| Adapter | Convert interface (wrap SDK) |
| Bridge | Split abstraction from implementation |
| Composite | Tree; leaf and group treated alike |
| Decorator | Wrap to add behaviour, same interface |
| Facade | Simple API over subsystem |
| Flyweight | Share immutable state |
| Proxy | Stand-in controlling access (lazy, remote, auth) |
| Chain of Responsibility | Pass along handlers (middleware) |
| Command | Request as object (queue, undo) |
| Interpreter | Evaluate a grammar |
| Iterator | Sequential access (`IEnumerable`) |
| Mediator | Central communication (MediatR) |
| Memento | Snapshot/restore state |
| Observer | Subscribe/notify (events) |
| State | Behaviour depends on state object |
| Strategy | Interchangeable algorithms |
| Template Method | Base skeleton, subclass steps |
| Visitor | New operations without changing classes |

## Patterns hiding in .NET

| .NET feature | Pattern |
|---|---|
| Middleware, `DelegatingHandler` | Chain of Responsibility |
| `IHttpClientFactory`, `ILoggerFactory` | Factory |
| `WebApplication.CreateBuilder` | Builder |
| `Stream` wrappers | Decorator |
| `event` / `IObservable` | Observer |
| `IEnumerable` + `yield` | Iterator |
| `DbContext` / `DbSet` | Unit of Work / Repository |
| EF lazy-loading proxies | Proxy |
| `IComparer<T>` | Strategy |
| `ExpressionVisitor` | Visitor |

## Enterprise/cloud

- **Repository + UoW** — data access abstraction + one transaction.
- **CQRS** — separate reads and writes.
- **Outbox** — event + data in the same transaction.
- **Saga** — distributed transaction with compensation.
- **Retry / Circuit Breaker / Timeout / Bulkhead** — resilience (`AddStandardResilienceHandler`).
- **Options** — typed config: `IOptions` / `IOptionsSnapshot` / `IOptionsMonitor`.
- **Strangler Fig** — replace a legacy system piece by piece.
- **API Gateway / BFF** — single entry point per client type.

## Answer formula

Problem → pattern name → how it works (2 lines) → code shape (interface + classes) → where you used it → trade-off.
