---
slug: solid
title: SOLID Principles with Examples
track: dotnet
order: 5
group: OOP & Design
icon: SO
color: #0b7285
summary: The five SOLID principles with bad-vs-good C# code, plus DRY, KISS, YAGNI, dependency injection and how SOLID shows up in ASP.NET Core.
---

# Overview

**SOLID** is five object-oriented design principles that make code easier to change, test and extend. The acronym was coined by Michael Feathers around 2004 for principles collected by **Robert C. Martin ("Uncle Bob")** in the late 1990s and early 2000s.

| Letter | Principle | One-line meaning |
|---|---|---|
| **S** | Single Responsibility | A class should have one reason to change |
| **O** | Open/Closed | Open for extension, closed for modification |
| **L** | Liskov Substitution | Subtypes must be usable wherever the base type is expected |
| **I** | Interface Segregation | Many small, specific interfaces beat one fat interface |
| **D** | Dependency Inversion | Depend on abstractions, not concrete classes |

Interviewers almost always ask you to *explain each with an example* and then *show where you applied it*.

# Versions

| Year | Milestone |
|---|---|
| 1987 | Barbara Liskov presents the substitution idea (keynote "Data Abstraction and Hierarchy"); formalised with Jeannette Wing in 1994 |
| 1988 | Bertrand Meyer defines the Open/Closed Principle in *Object-Oriented Software Construction* |
| 1996–2000 | Robert C. Martin publishes articles on OCP, LSP, DIP, ISP; paper "Design Principles and Design Patterns" (2000) |
| ~2004 | Michael Feathers arranges them into the acronym **SOLID** |
| 2002 / 2006 | *Agile Software Development: Principles, Patterns, and Practices* (and the C# edition, 2006) |
| 2017 | *Clean Architecture* restates SRP as "a module should be responsible to one actor" |

# Lifecycle

How SOLID is applied during development:

1. **Design** — split responsibilities (SRP), define interfaces around what consumers need (ISP, DIP).
2. **Implement** — inject dependencies through constructors; keep classes small.
3. **Extend** — add behaviour by adding new classes (OCP) rather than editing switches.
4. **Test** — mock the abstractions; unit-test each class in isolation.
5. **Review** — code review checks for god classes, `new` of services inside business logic, and subclasses that throw `NotSupportedException` (LSP smell).
6. **Refactor** — when a class keeps changing for unrelated reasons, split it.

# Tools

- **ASP.NET Core DI container** (`Microsoft.Extensions.DependencyInjection`) — DIP in practice.
- **Scrutor** — assembly scanning and decorators for the built-in container.
- **Autofac** — advanced DI container.
- **xUnit + Moq / NSubstitute / FakeItEasy** — mocking abstractions.
- **SonarQube / SonarLint, NDepend, Visual Studio code metrics** — find large classes, high coupling, complexity.
- **ArchUnitNET / NetArchTest** — enforce layering rules in tests.

# Module: S and O

## Lesson: [Basic|High] S — Single Responsibility Principle

> "A class should have one, and only one, reason to change." — Robert C. Martin

"Reason to change" = one **actor** or stakeholder. A class that formats invoices *and* saves them *and* emails them changes when finance, DBAs or the email provider change.

```csharp
// ❌ Violates SRP — three reasons to change
public class InvoiceService
{
    public decimal Calculate(Invoice i) => i.Lines.Sum(l => l.Qty * l.Price) * 1.18m;
    public void Save(Invoice i) { using var c = new SqlConnection("..."); /* INSERT ... */ }
    public void Email(Invoice i) { var smtp = new SmtpClient("smtp.example.com"); /* ... */ }
}

// ✅ One responsibility each
public class InvoiceCalculator { public decimal Total(Invoice i) => i.Lines.Sum(l => l.Qty * l.Price) * 1.18m; }
public interface IInvoiceRepository { Task SaveAsync(Invoice i); }
public interface IInvoiceSender { Task SendAsync(Invoice i); }

public class InvoiceWorkflow(InvoiceCalculator calc, IInvoiceRepository repo, IInvoiceSender sender)
{
    public async Task CompleteAsync(Invoice i)
    {
        i.Total = calc.Total(i);
        await repo.SaveAsync(i);
        await sender.SendAsync(i);
    }
}
```

> **Interview tip:** SRP doesn't mean "one method per class". It means one *cohesive* job. Controllers that only orchestrate are fine.

## Lesson: [Basic|High] O — Open/Closed Principle

Software entities should be **open for extension, closed for modification**: add new behaviour by adding code, not by editing tested code.

```csharp
// ❌ Every new customer type edits this method
public decimal Discount(string type, decimal amount) => type switch
{
    "Regular" => amount * 0.05m,
    "Gold" => amount * 0.10m,
    "Platinum" => amount * 0.15m,     // edit again next quarter...
    _ => 0
};

// ✅ New type = new class; existing code untouched (Strategy pattern)
public interface IDiscountRule { string Type { get; } decimal Apply(decimal amount); }
public class GoldDiscount : IDiscountRule { public string Type => "Gold"; public decimal Apply(decimal a) => a * 0.10m; }
public class PlatinumDiscount : IDiscountRule { public string Type => "Platinum"; public decimal Apply(decimal a) => a * 0.15m; }

public class DiscountService(IEnumerable<IDiscountRule> rules)
{
    public decimal Discount(string type, decimal amount) =>
        rules.FirstOrDefault(r => r.Type == type)?.Apply(amount) ?? 0;
}
// Program.cs
builder.Services.AddSingleton<IDiscountRule, GoldDiscount>();
builder.Services.AddSingleton<IDiscountRule, PlatinumDiscount>();
```

ASP.NET Core itself is OCP: you extend the pipeline by adding middleware, filters and services, without editing the framework.

# Module: L, I and D

## Lesson: [Intermediate|High] L — Liskov Substitution Principle

If `S` is a subtype of `T`, objects of type `T` may be replaced by objects of type `S` **without breaking the program**. Subclasses must honour the base class's contract: no stronger preconditions, no weaker postconditions, no surprise exceptions.

```csharp
// ❌ Classic violation: Square changes Rectangle's behaviour
public class Rectangle { public virtual int Width { get; set; } public virtual int Height { get; set; } public int Area => Width * Height; }
public class Square : Rectangle
{
    public override int Width { set { base.Width = value; base.Height = value; } }
    public override int Height { set { base.Width = value; base.Height = value; } }
}
void Resize(Rectangle r) { r.Width = 5; r.Height = 4; Debug.Assert(r.Area == 20); }  // fails for Square (16)

// ✅ Model what they share, not a false "is-a"
public interface IShape { int Area { get; } }
public record Rect(int Width, int Height) : IShape { public int Area => Width * Height; }
public record Sq(int Side) : IShape { public int Area => Side * Side; }
```

LSP smells: `throw new NotSupportedException()` in an override, `if (x is SpecialSubclass)` checks in callers, overrides that do nothing.

## Lesson: [Intermediate|High] I — Interface Segregation Principle

Clients should not be forced to depend on methods they don't use. Split fat interfaces into role interfaces.

```csharp
// ❌ Fat interface — a basic printer must implement Fax and Scan
public interface IMachine { void Print(Doc d); void Scan(Doc d); void Fax(Doc d); }
public class BasicPrinter : IMachine
{
    public void Print(Doc d) { }
    public void Scan(Doc d) => throw new NotSupportedException();   // also an LSP smell
    public void Fax(Doc d) => throw new NotSupportedException();
}

// ✅ Role interfaces
public interface IPrinter { void Print(Doc d); }
public interface IScanner { void Scan(Doc d); }
public interface IFax { void Fax(Doc d); }
public class BasicPrinter2 : IPrinter { public void Print(Doc d) { } }
public class OfficeMachine : IPrinter, IScanner, IFax { /* all three */ }
```

Real-world .NET example: `IReadOnlyList<T>` vs `IList<T>`; `IEnumerable<T>` vs `ICollection<T>`.

## Lesson: [Intermediate|High] D — Dependency Inversion Principle

1. High-level modules should not depend on low-level modules; **both depend on abstractions**.
2. Abstractions should not depend on details; details depend on abstractions.

```csharp
// ❌ High-level policy welded to a detail
public class OrderService
{
    private readonly SqlOrderRepository _repo = new SqlOrderRepository();   // can't test, can't swap
}

// ✅ Depend on an abstraction owned by the high-level layer
public interface IOrderRepository { Task AddAsync(Order o); }
public class OrderService(IOrderRepository repo)
{
    public Task PlaceAsync(Order o) => repo.AddAsync(o);
}
public class SqlOrderRepository(AppDbContext db) : IOrderRepository
{
    public async Task AddAsync(Order o) { db.Orders.Add(o); await db.SaveChangesAsync(); }
}

// Composition root (Program.cs)
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
builder.Services.AddScoped<OrderService>();
```

**DIP vs DI vs IoC:**

- **DIP** — the *principle* (depend on abstractions).
- **IoC (Inversion of Control)** — the general idea that a framework/container controls object creation and flow, not your code.
- **DI (Dependency Injection)** — the *technique*: dependencies are passed in (constructor, method or property injection), usually by an IoC container.

## Lesson: [Intermediate|High] Dependency injection lifetimes in ASP.NET Core

| Lifetime | One instance per | Typical use |
|---|---|---|
| `AddTransient` | Every resolution | Lightweight, stateless services |
| `AddScoped` | HTTP request (scope) | `DbContext`, unit of work, per-request state |
| `AddSingleton` | Application | Configuration, caches, `HttpClient` handlers, thread-safe services |

```csharp
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
builder.Services.AddTransient<IEmailBuilder, EmailBuilder>();
builder.Services.AddKeyedSingleton<IPaymentGateway, StripeGateway>("stripe");   // .NET 8 keyed services
```

**Captive dependency** bug: a singleton that takes a scoped service (e.g. `DbContext`) keeps that one instance forever, so it is shared across requests and threads. The default container throws in Development (`ValidateScopes`). Fix: inject `IServiceScopeFactory` and create a scope, or change the lifetimes.

# Module: Related Principles

## Lesson: [Basic|Medium] DRY, KISS, YAGNI and separation of concerns

- **DRY — Don't Repeat Yourself:** every piece of *knowledge* has one authoritative place. (Duplicate-looking code that changes for different reasons is not a DRY violation.)
- **KISS — Keep It Simple:** the simplest design that works is easiest to maintain.
- **YAGNI — You Aren't Gonna Need It:** don't build for hypothetical future requirements.
- **Separation of Concerns:** UI, business logic and data access in separate layers.
- **Composition over inheritance**, **Law of Demeter**, **Tell don't ask**.

> **Interview tip:** show balance. "I apply SOLID where change is likely — payment providers, export formats. For a 20-line admin script I keep it simple (KISS/YAGNI)."

## Lesson: [Advanced|Medium] SOLID in a layered / Clean Architecture solution

```
src/
  Shop.Domain/          entities, value objects, domain interfaces  (no dependencies)
  Shop.Application/     use cases, IOrderRepository, IEmailSender    (→ Domain)
  Shop.Infrastructure/  EF Core repos, SMTP sender, Azure Blob        (→ Application)
  Shop.Api/             controllers, DI composition root              (→ Application, Infrastructure)
```

- **DIP:** `Application` defines `IOrderRepository`; `Infrastructure` implements it. Dependencies point **inwards**.
- **SRP:** one handler per use case (`PlaceOrderHandler`), e.g. with MediatR or plain classes.
- **OCP:** cross-cutting concerns as decorators/pipeline behaviours (logging, validation, caching) without editing handlers.
- **ISP:** small ports (`IClock`, `ICurrentUser`, `IFileStore`).
- **LSP:** every `IFileStore` (local, Azure Blob, S3) behaves the same for callers.

# Interview

## [Beginner|High] What are the SOLID principles? Explain each briefly.

- **S**ingle Responsibility: one reason to change per class.
- **O**pen/Closed: extend behaviour by adding code, not modifying existing code.
- **L**iskov Substitution: subclasses must work anywhere the base class works.
- **I**nterface Segregation: small client-specific interfaces instead of a fat one.
- **D**ependency Inversion: high- and low-level modules depend on abstractions; inject dependencies.

Follow with one concrete example from your own project, e.g. "payment providers behind `IPaymentGateway`, registered in DI — that's OCP and DIP."

## [Beginner|High] Give a real example of the Single Responsibility Principle.

An `InvoiceService` that calculates totals, writes to SQL and sends email has three reasons to change. Split it into `InvoiceCalculator`, `IInvoiceRepository` and `IInvoiceSender`, with a small workflow class orchestrating them. Now an SMTP-to-SendGrid change touches only the sender, and each part has focused unit tests.

## [Beginner|High] How do you implement the Open/Closed Principle in C#?

Through **abstractions and polymorphism**: define an interface (`IDiscountRule`, `IExportFormatter`), implement each variant as its own class, and let the consumer receive `IEnumerable<IDiscountRule>` from DI. Adding a variant means a new class and registration; no existing, tested code changes. Other OCP tools: Strategy, Decorator, middleware, filters, events.

## [Intermediate|High] Explain the Liskov Substitution Principle with the Rectangle–Square example.

Mathematically a square is a rectangle, but if `Square` overrides `Width`/`Height` setters to keep sides equal, code written for `Rectangle` (set width 5, height 4, expect area 20) breaks and gets 16. The subtype changed the base's behaviour, which violates LSP. Fix: don't inherit; make both implement `IShape` with an `Area`, or make them immutable. Practical LSP violations: overrides throwing `NotSupportedException`, or a read-only collection deriving from a writable one.

## [Intermediate|High] What is the difference between Dependency Inversion, Dependency Injection and Inversion of Control?

DIP is the design **principle**: depend on abstractions. IoC is the broader **concept** that control of object creation and flow is handed to a framework or container. DI is a **technique** to achieve IoC/DIP: dependencies are supplied from outside (constructor injection preferred) rather than created with `new` inside the class. ASP.NET Core's built-in container is an IoC container that performs DI.

## [Intermediate|High] What are the service lifetimes in ASP.NET Core DI and what is a captive dependency?

Transient (new each time), Scoped (one per request/scope), Singleton (one for the app). A captive dependency happens when a longer-lived service holds a shorter-lived one — e.g. a singleton injecting a scoped `DbContext`. The `DbContext` then lives forever and is shared across threads, which causes concurrency exceptions and stale data. Fix: make the consumer scoped, or inject `IServiceScopeFactory` and create a scope per operation (common in `BackgroundService`).

## [Intermediate|Medium] Give an Interface Segregation example from .NET itself.

`IEnumerable<T>` (iterate only) → `IReadOnlyCollection<T>` (+Count) → `IReadOnlyList<T>` (+indexer) vs `ICollection<T>`/`IList<T>` (mutation). A method that only reads should accept `IEnumerable<T>`/`IReadOnlyList<T>`. Similarly, ASP.NET Core splits `IConfiguration` and `IOptions<T>`, and logging into `ILogger` and `ILoggerFactory`.

## [Intermediate|Medium] Is it OK to violate SOLID sometimes?

Yes. SOLID is a set of guidelines, not laws. Over-applying them creates "interface for everything" designs, needless indirection and many tiny files. Apply them where change is **likely** or testing needs seams (external services, business rules that vary). For stable, simple code, KISS and YAGNI win. Good answer: "I refactor towards SOLID when a second variant or a test need appears."

## [Intermediate|Medium] Which design patterns support which SOLID principles?

Strategy, Decorator, Template Method, Observer → **OCP**. Adapter, Facade → **DIP/ISP** (wrap details behind your own abstraction). Factory/Abstract Factory → **DIP** (hide creation). Repository → **DIP/SRP**. Chain of Responsibility/middleware → **SRP + OCP**. Composite → **LSP** (leaf and composite are interchangeable).

## [Advanced|Medium] How does Clean Architecture apply the Dependency Inversion Principle?

The **Domain** and **Application** layers define interfaces (ports) such as `IOrderRepository` or `IEmailSender`. The **Infrastructure** layer implements them with EF Core, SMTP or Azure. The API project (composition root) wires them together. Source-code dependencies point inward, so business rules don't reference EF Core or ASP.NET. You can test them with in-memory fakes and swap infrastructure without touching them.

## [Advanced|Low] What is the Stable Dependencies / Stable Abstractions principle?

They are package-level principles from Robert C. Martin. **Stable Dependencies:** depend in the direction of stability (packages that many others rely on should change rarely). **Stable Abstractions:** stable packages should be abstract (interfaces), so they can be extended without modification. Together they explain why the domain/interfaces project sits at the centre and has no dependencies.

## [Scenario|High] Your `NotificationService` sends email via SMTP using `new SmtpClient()` inside the method. The business now wants SMS and WhatsApp too, and tests keep sending real emails. What do you change?

1. Introduce `INotificationChannel { Task SendAsync(Notification n); }` (DIP).
2. Implement `EmailChannel` (SMTP or SendGrid), `SmsChannel` and `WhatsAppChannel` (OCP: one class per channel).
3. Inject `IEnumerable<INotificationChannel>` into `NotificationService` and select by the user's preference.
4. Move settings to `IOptions<SmtpSettings>`.
5. In unit tests, use a fake channel, so no real emails are sent.
6. Optional: a decorator for retry/logging (OCP), and a queue so sending doesn't block the request.

## [Scenario|High] A code review shows `if (shape is Circle) ... else if (shape is Square) ...` in five places. What principle is violated and how do you fix it?

It violates **OCP** (every new shape edits five places) and usually **LSP/polymorphism**. Move the behaviour into the types: `abstract double Area()` (or an interface method) implemented by each shape, and callers just call `shape.Area()`. If the operation shouldn't live in the shape (e.g. rendering), use the **Visitor** pattern, or a dictionary of strategies keyed by type.

## [Scenario|Medium] A background service crashes with "Cannot consume scoped service from singleton". Explain and fix.

`AddHostedService` registers hosted services as singletons. Injecting a scoped service (like `DbContext`) into the constructor is a captive dependency, so the container refuses it. Inject `IServiceScopeFactory` instead; inside `ExecuteAsync`, for each unit of work, do `using var scope = factory.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();`. Each iteration then gets a fresh, correctly disposed context.

## [Scenario|Medium] How would you explain where you applied SOLID in your last project?

Give a concrete STAR-style example. "Our reporting module had exports to PDF and Excel inside one 2,000-line class. I introduced `IReportExporter` with one class per format and registered them in DI. The controller picks one by format key (OCP, SRP). Data access moved behind `IReportRepository` (DIP), which let us unit-test the exporters with fake data. Adding CSV later took half a day and touched no existing code."

# Cheatsheet

## SOLID in one table

| | Principle | Smell | Fix |
|---|---|---|---|
| S | Single Responsibility | God class, `Manager`/`Utils` | Split by reason to change |
| O | Open/Closed | Growing `switch`/`if-else` on type | Strategy/polymorphism + DI |
| L | Liskov Substitution | Override throws `NotSupportedException`; `is` checks | Fix the hierarchy; use interfaces/composition |
| I | Interface Segregation | Implementers leave methods empty | Split into role interfaces |
| D | Dependency Inversion | `new ConcreteService()` inside logic | Inject an abstraction |

## DI lifetimes

| | Instance per | Use for |
|---|---|---|
| Transient | resolution | stateless, light |
| Scoped | request | `DbContext`, unit of work |
| Singleton | app | config, caches, thread-safe services |

Never inject scoped into singleton → use `IServiceScopeFactory`.

## Other principles

- **DRY** — one source of truth for knowledge.
- **KISS** — simplest thing that works.
- **YAGNI** — don't build for imaginary futures.
- **SoC** — separate UI / business / data.
- **Composition over inheritance.**
- **Law of Demeter** — no `a.B.C.D` chains.

## Quick code: DIP + OCP

```csharp
public interface IExporter { string Format { get; } byte[] Export(Report r); }
public class PdfExporter : IExporter { public string Format => "pdf"; public byte[] Export(Report r) => ...; }
public class ExcelExporter : IExporter { public string Format => "xlsx"; public byte[] Export(Report r) => ...; }
public class ExportService(IEnumerable<IExporter> exporters)
{
    public byte[] Run(Report r, string fmt) => exporters.Single(e => e.Format == fmt).Export(r);
}
```

## One-liners to say in the interview

- **SRP**: "A class should have one reason to change — one actor it serves."
- **OCP**: "Add new behaviour by adding classes, not by editing tested ones."
- **LSP**: "A subclass must work anywhere its base class is expected — no surprises."
- **ISP**: "Don't force clients to depend on methods they don't use."
- **DIP**: "High-level policy depends on abstractions; details plug in through DI."
- **Balance**: "I apply SOLID where change is likely; for simple, stable code I keep it simple."
