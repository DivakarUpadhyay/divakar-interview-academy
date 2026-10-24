---
slug: project-architecture
title: .NET Project Architectures & Folder Structures — Layered, Clean, Onion, Vertical Slice
track: dotnet
order: 19
group: Architecture & Quality
icon: Arc
color: #364fc7
summary: How real .NET solutions are organised — solution and project structure, 3-tier and N-layer architecture, Onion, Hexagonal (ports and adapters) and Clean Architecture, Vertical Slice architecture, modular monolith, DDD building blocks, CQRS, the folder structure of each style with naming conventions, shared build settings (Directory.Build.props, central package management), test projects, where cross-cutting concerns live, and how to choose an architecture.
---

# Overview

**Architecture** = how code is split into parts, what each part is responsible for, and which parts may depend on which. A good structure makes code **easy to find, change, test and deploy**.

| Style | Core idea | Typical fit |
|---|---|---|
| **3-tier / N-layer** | UI → Business (BLL) → Data (DAL) | Classic enterprise apps, Web Forms/MVC 5 |
| **Onion / Clean / Hexagonal** | Domain at the centre; infrastructure and UI depend inward on interfaces | Medium–large apps with real business logic, long life |
| **Vertical Slice** | Organise by feature (one folder per use case), not by technical layer | APIs with many independent features, CQRS |
| **Modular monolith** | One deployable, split into independent modules | Growing products; stepping stone to microservices |
| **Microservices** | Separate deployable services per business capability | Large organisations (see the Microservices course) |

# Versions

| Year | Milestone |
|---|---|
| 1990s | Client/server, then 3-tier architecture |
| 2002 | Fowler's *Patterns of Enterprise Application Architecture* (layers, repository, unit of work) |
| 2003 | Domain-Driven Design (Eric Evans) |
| 2005 | Hexagonal architecture / ports and adapters (Alistair Cockburn) |
| 2008 | Onion architecture (Jeffrey Palermo) |
| 2010 | CQRS popularised (Greg Young) |
| 2012 | Clean Architecture (Robert C. Martin) |
| 2018 | Vertical Slice architecture (Jimmy Bogard) |
| 2020s | Modular monoliths; templates: Jason Taylor's CleanArchitecture, Ardalis CleanArchitecture; .NET Aspire solution layouts; `.slnx` solution format (VS 2022 17.13+/.NET 9 SDK) |

# Lifecycle

**How a request flows through a Clean Architecture ASP.NET Core API:**

```text
HTTP request
 → Api (controller / minimal endpoint, model binding, auth)            [Presentation]
 → Application (use case / command handler, validation, DTO mapping)  [Application]
 → Domain (entities enforce business rules, domain events)            [Domain — no dependencies]
 → Application calls interfaces (IOrderRepository, IEmailSender, IClock)
 → Infrastructure implements them (EF Core DbContext, SMTP, Azure Blob) [Infrastructure]
 → database / external services
 ← result → DTO → HTTP response
```

**Dependency rule:** source-code dependencies point **inwards** (Api → Application → Domain; Infrastructure → Application/Domain). The Domain knows nothing about EF Core, ASP.NET or SQL.

# Tools

- `dotnet new sln`, `dotnet new classlib/webapi/xunit`, `dotnet sln add`, `dotnet add reference`.
- Templates: `Clean.Architecture.Solution.Template` (Jason Taylor), `Ardalis.CleanArchitecture.Template`, .NET Aspire starter.
- Architecture tests: **NetArchTest**, **ArchUnitNET** (enforce "Domain must not reference Infrastructure").
- Visual Studio dependency diagrams / code maps, NDepend.
- Diagrams: C4 model, draw.io, Structurizr.

# Module: Solution Basics

## Lesson: [Basic|High] Solutions, projects, references and naming conventions

```bash
dotnet new sln -n Shop
dotnet new classlib -n Shop.Domain -o src/Shop.Domain
dotnet new classlib -n Shop.Application -o src/Shop.Application
dotnet new classlib -n Shop.Infrastructure -o src/Shop.Infrastructure
dotnet new webapi  -n Shop.Api -o src/Shop.Api
dotnet new xunit   -n Shop.UnitTests -o tests/Shop.UnitTests
dotnet sln add src/**/*.csproj tests/**/*.csproj
dotnet add src/Shop.Application reference src/Shop.Domain
dotnet add src/Shop.Infrastructure reference src/Shop.Application
dotnet add src/Shop.Api reference src/Shop.Application src/Shop.Infrastructure
```

**Repository layout (common convention):**

```text
Shop/
├── src/                       production projects
├── tests/                     test projects (mirror src names + .UnitTests / .IntegrationTests)
├── docs/                      architecture decision records (ADRs), diagrams
├── build/ or eng/             build scripts, pipeline templates
├── deploy/                    Dockerfiles, Bicep/Terraform, Helm charts
├── .github/ or .azuredevops/  CI/CD pipelines
├── Directory.Build.props      shared MSBuild settings for all projects
├── Directory.Packages.props   central NuGet package versions
├── global.json                pinned .NET SDK version
├── .editorconfig              code style rules
└── Shop.sln (or Shop.slnx)
```

**Naming:** `Company.Product.Layer` (`Divakar.Shop.Domain`), namespaces match folders, one public type per file, plural folder names for collections of things (`Controllers`, `Entities`), test classes named `<ClassUnderTest>Tests`.

```xml
<!-- Directory.Build.props: applies to every project below this folder -->
<Project>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
<!-- Directory.Packages.props: <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally> + <PackageVersion Include="Dapper" Version="2.1.66" /> -->
```

# Module: Architecture Styles

## Lesson: [Basic|High] 3-tier and N-layer architecture

```text
Presentation layer (UI)      Web Forms pages / MVC controllers & views / API controllers
        ↓ calls
Business Logic Layer (BLL)   services: validation, calculations, workflows
        ↓ calls
Data Access Layer (DAL)      ADO.NET / Dapper / EF repositories, stored procedures
        ↓
Database
```

**Tier vs layer:** a *layer* is a logical separation in code; a *tier* is a physical deployment unit (browser, web server, database server). A 3-layer app can run on 1, 2 or 3 tiers.

**Typical .NET Framework solution:**

```text
ShopSolution/
├── Shop.Web/                 Web Forms or MVC 5 (UI)
├── Shop.BLL/                 ProductService.cs, OrderService.cs
├── Shop.DAL/                 ProductRepository.cs (ADO.NET), ShopEntities.edmx (EF6)
├── Shop.Entities/ (Models)   Product.cs, Order.cs — shared by all layers
└── Shop.Common/              helpers, constants, logging
```

Pros: simple, familiar, clear separation. Cons: business logic tends to depend on the DAL (hard to unit test without a database), "anemic" services, changes ripple across layers, everything depends on the database schema.

## Lesson: [Intermediate|High] Onion, Hexagonal and Clean Architecture

All three share one idea: **the domain and use cases are the centre; frameworks, databases and UIs are details at the edge**, connected through interfaces (Dependency Inversion).

```text
            ┌────────────────────────────────────────┐
            │  Presentation (Api, Web, Blazor)        │
            │   ┌──────────────────────────────────┐  │
            │   │ Infrastructure (EF Core, email,  │  │
            │   │ files, external APIs)            │  │
            │   │   ┌──────────────────────────┐   │  │
            │   │   │ Application (use cases,  │   │  │
            │   │   │ interfaces, DTOs)        │   │  │
            │   │   │   ┌──────────────────┐   │   │  │
            │   │   │   │ Domain (entities,│   │   │  │
            │   │   │   │ value objects,   │   │   │  │
            │   │   │   │ domain rules)    │   │   │  │
            │   │   │   └──────────────────┘   │   │  │
            │   │   └──────────────────────────┘   │  │
            │   └──────────────────────────────────┘  │
            └────────────────────────────────────────┘
                  dependencies point INWARD only
```

- **Hexagonal (ports & adapters):** the application exposes **ports** (interfaces like `IOrderRepository`, `IPaymentGateway`); **adapters** implement them (SQL adapter, Stripe adapter) or drive the app (REST controller, message consumer).
- **Onion:** concentric rings — Domain Model → Domain Services → Application Services → outer ring (UI, infrastructure, tests).
- **Clean Architecture:** Entities → Use Cases → Interface Adapters → Frameworks & Drivers; same dependency rule.

**Clean Architecture folder structure (ASP.NET Core):**

```text
src/
├── Shop.Domain/                         no project references, no NuGet except tiny helpers
│   ├── Common/          BaseEntity.cs, ValueObject.cs, IDomainEvent.cs
│   ├── Entities/        Order.cs, OrderLine.cs, Customer.cs, Product.cs
│   ├── ValueObjects/    Money.cs, Address.cs, Email.cs
│   ├── Enums/           OrderStatus.cs
│   ├── Events/          OrderPlacedEvent.cs
│   └── Exceptions/      DomainException.cs
├── Shop.Application/                    references Domain only
│   ├── Common/
│   │   ├── Interfaces/  IApplicationDbContext.cs, IEmailSender.cs, ICurrentUser.cs, IDateTime.cs
│   │   ├── Behaviours/  ValidationBehaviour.cs, LoggingBehaviour.cs (pipeline behaviours)
│   │   ├── Exceptions/  NotFoundException.cs, ValidationException.cs
│   │   └── Models/      PagedList.cs, Result.cs
│   ├── Orders/
│   │   ├── Commands/PlaceOrder/   PlaceOrderCommand.cs, PlaceOrderHandler.cs, PlaceOrderValidator.cs
│   │   ├── Queries/GetOrders/     GetOrdersQuery.cs, GetOrdersHandler.cs, OrderDto.cs
│   │   └── EventHandlers/         OrderPlacedEmailHandler.cs
│   └── DependencyInjection.cs     AddApplication() extension
├── Shop.Infrastructure/                 references Application (and Domain)
│   ├── Persistence/     ShopDbContext.cs, Configurations/OrderConfiguration.cs, Migrations/, Interceptors/
│   ├── Repositories/    (if used) OrderRepository.cs
│   ├── Services/        SmtpEmailSender.cs, DateTimeService.cs, BlobFileStorage.cs
│   ├── Identity/        identity/auth integration
│   └── DependencyInjection.cs     AddInfrastructure(configuration)
└── Shop.Api/                            references Application + Infrastructure (composition root)
    ├── Controllers/ or Endpoints/   OrdersController.cs / OrderEndpoints.cs
    ├── Middleware/      ExceptionHandler.cs
    ├── Filters/
    ├── Program.cs       builder.Services.AddApplication().AddInfrastructure(cfg); app pipeline
    └── appsettings.json
tests/
├── Shop.Domain.UnitTests/
├── Shop.Application.UnitTests/
├── Shop.Infrastructure.IntegrationTests/     (Testcontainers SQL Server)
└── Shop.Api.FunctionalTests/                  (WebApplicationFactory)
```

```csharp
// Application defines what it needs...
public interface IEmailSender { Task SendAsync(string to, string subject, string body, CancellationToken ct); }
// ...Infrastructure provides it...
public sealed class SmtpEmailSender(IOptions<SmtpOptions> o) : IEmailSender { /* SmtpClient / MailKit */ }
// ...Api wires it (composition root)
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
```

Benefits: domain logic testable without a database, swap infrastructure (SQL → Cosmos, SMTP → SendGrid) without touching use cases, framework upgrades isolated. Costs: more projects and mapping code — overkill for small CRUD apps.

## Lesson: [Intermediate|High] Vertical Slice architecture

Instead of horizontal layers, organise by **feature/use case**: everything needed for "Place order" lives together.

```text
src/Shop.Api/
├── Features/
│   ├── Orders/
│   │   ├── PlaceOrder.cs          request + validator + handler + endpoint in one file (or a folder)
│   │   ├── GetOrderById.cs
│   │   ├── CancelOrder.cs
│   │   └── OrderMappings.cs
│   ├── Products/
│   │   ├── SearchProducts.cs      may use Dapper for a fast query
│   │   └── CreateProduct.cs       may use EF Core
│   └── Customers/ ...
├── Domain/                         shared entities (if any rich domain)
├── Infrastructure/                 DbContext, external clients
├── Common/                         behaviours, result types, exceptions
└── Program.cs                      maps all feature endpoints
```

```csharp
public static class PlaceOrder
{
    public sealed record Command(int CustomerId, List<Line> Lines);
    public sealed record Line(int ProductId, int Qty);

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator() { RuleFor(c => c.Lines).NotEmpty(); RuleForEach(c => c.Lines).ChildRules(l => l.RuleFor(x => x.Qty).GreaterThan(0)); }
    }

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapPost("/api/orders", async (Command cmd, ShopDbContext db, IValidator<Command> v, CancellationToken ct) =>
        {
            var result = await v.ValidateAsync(cmd, ct);
            if (!result.IsValid) return Results.ValidationProblem(result.ToDictionary());
            var order = Order.Create(cmd.CustomerId, cmd.Lines.Select(l => (l.ProductId, l.Qty)));
            db.Orders.Add(order);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/orders/{order.Id}", new { order.Id });
        });
}
```

**Pros:** a change touches one folder; features can use different techniques (EF here, Dapper there); easy to delete a feature; fits CQRS. **Cons:** possible duplication between slices; needs discipline to extract real shared domain logic.

## Lesson: [Intermediate|Medium] Modular monolith and DDD building blocks

**Modular monolith** — one deployable application, divided into **modules** by business capability; each module has its own folders/projects, its own database schema and a small public API; modules communicate via interfaces or in-process events.

```text
src/
├── Shop.Host/                      ASP.NET Core host — registers all modules
├── Modules/
│   ├── Catalog/   Catalog.Api (endpoints) · Catalog.Core (domain + use cases) · Catalog.Infrastructure (schema "catalog")
│   ├── Ordering/  Ordering.Api · Ordering.Core · Ordering.Infrastructure (schema "ordering")
│   └── Billing/   Billing.Api · Billing.Core · Billing.Infrastructure (schema "billing")
└── Shared/       Shared.Kernel (base types), Shared.Infrastructure (event bus, outbox)
```

Rules: no module reads another's tables; communication through a module's public contracts or integration events; architecture tests enforce boundaries. A module can later become a microservice.

**DDD building blocks:**

| Block | Meaning | Example |
|---|---|---|
| Entity | Has identity that persists | `Order` (Id 1001) |
| Value object | Defined by its values, immutable | `Money(4500, "INR")`, `Address` |
| Aggregate (root) | Consistency boundary; outside code changes it only through the root | `Order` with `OrderLines` |
| Domain service | Logic that doesn't belong to one entity | `PricingService` |
| Domain event | Something that happened | `OrderPlaced` |
| Repository | Collection-like access to aggregates | `IOrderRepository` |
| Bounded context | Boundary where a model applies | Sales vs Shipping |

## Lesson: [Advanced|High] CQRS, MediatR and cross-cutting concerns placement

**CQRS** separates **commands** (change state, return little) from **queries** (return data, no side effects). In a single app it usually means separate handler classes and models; reads can use Dapper/views while writes use EF Core and rich domain models.

```csharp
public sealed record GetOrdersQuery(int CustomerId, int Page) : IRequest<PagedList<OrderDto>>;
public sealed class GetOrdersHandler(IDbConnectionFactory db) : IRequestHandler<GetOrdersQuery, PagedList<OrderDto>>
{
    public async Task<PagedList<OrderDto>> Handle(GetOrdersQuery q, CancellationToken ct) { /* Dapper query on a view */ return default!; }
}
// Controller: return Ok(await mediator.Send(new GetOrdersQuery(id, page)));
```

MediatR (commercial licence from v13, 2025) or similar mediators add **pipeline behaviours** for validation, logging, transactions. You can also call handlers directly via DI — the pattern doesn't require a library.

**Where do cross-cutting concerns go?**

| Concern | Place |
|---|---|
| Exception handling | Api: `UseExceptionHandler` + `IExceptionHandler` |
| Validation | Application: FluentValidation + pipeline behaviour; Domain: invariants in constructors/methods |
| Logging | Everywhere via `ILogger<T>`; request logging middleware in Api |
| Authentication/authorization | Api (middleware, policies); resource checks in Application |
| Transactions | Application (unit of work around a command) |
| Caching | Application (decorator/behaviour) or Infrastructure |
| Configuration | Api/Infrastructure (Options pattern), injected as interfaces/options |
| Mapping | Application (manual mapping, Mapster, or AutoMapper) |

## Lesson: [Intermediate|High] Folder structures for each app type at a glance

**Small ASP.NET Core Web API (single project, feature-friendly):**

```text
Shop.Api/
├── Features/ or Controllers/     endpoints grouped by feature
├── Domain/                        entities, enums, value objects
├── Data/                          ShopDbContext, Configurations/, Migrations/
├── Services/                      business services + interfaces
├── Contracts/ (Dtos/)             request/response models
├── Infrastructure/                email, storage, external API clients
├── Middleware/ · Filters/ · Extensions/
├── Program.cs · appsettings*.json
```

**ASP.NET Core MVC app (layered):** `Shop.Web` (Controllers, Views, ViewComponents, wwwroot) + `Shop.Application` + `Shop.Domain` + `Shop.Infrastructure` (same layers as Clean Architecture, but the Web project has views).

**Blazor Web App (.NET 8+):** `Shop` (server project: `Components/` with `App.razor`, `Routes.razor`, `Layout/`, `Pages/`, `Program.cs`) + `Shop.Client` (WebAssembly project for interactive components) + shared libraries.

**Worker / background processing:** `Shop.Worker` (`Worker.cs` BackgroundService classes, `Program.cs` with `Host.CreateApplicationBuilder`) reusing Application/Infrastructure projects.

**.NET Framework legacy (Web Forms / MVC 5):** `Shop.Web` (pages/controllers, App_Start, Global.asax, Web.config) + `Shop.BLL` + `Shop.DAL` + `Shop.Entities` + `Shop.Common`.

**Full stack monorepo:**

```text
repo/
├── src/  Shop.Api · Shop.Application · Shop.Domain · Shop.Infrastructure · Shop.Worker · Shop.AppHost (Aspire)
├── web/  shop-ui/ (Angular: src/app/core, shared, features/orders, ... | React: src/components, pages, hooks, services, store)
├── tests/ · deploy/ · docs/ · .github/workflows/
```

Rule of thumb: **group by feature at the top level when the app grows**; keep technical sub-folders inside a feature only if they help.

## Lesson: [Advanced|Medium] Choosing an architecture

| Situation | Recommendation |
|---|---|
| Small CRUD app, short life, 1–2 developers | Single project with folders (Controllers, Services, Data) — keep it simple |
| Business-heavy app, long life, several developers | Clean/Onion architecture or Vertical Slice + rich domain where needed |
| API with many independent features | Vertical Slice (+ CQRS) |
| Growing product, several teams | Modular monolith |
| Very large org, independent scaling/deployments | Microservices (each service internally clean/vertical) |
| Legacy Web Forms/MVC 5 | Extract BLL/DAL into libraries first, then migrate UI |

Write the decision in an **ADR** (Architecture Decision Record): context, decision, consequences. Enforce it with architecture tests so it doesn't erode.

# Interview

## [Beginner|High] Explain 3-tier (N-layer) architecture.

Presentation (UI), business logic (services/BLL) and data access (DAL/repositories), each calling only the layer below. It separates concerns and lets teams work on layers independently. Layers are logical; tiers are physical machines. Weakness: business logic often depends directly on data access, making it hard to test and change.

## [Beginner|High] What is Clean Architecture? What is the dependency rule?

An architecture that places the domain (entities, business rules) and application use cases at the centre and frameworks, UI and databases at the outside. The dependency rule: source-code dependencies only point inward — the domain depends on nothing; the application defines interfaces that infrastructure implements; the web project is the composition root that wires everything with DI.

## [Beginner|High] How do you structure a typical ASP.NET Core Web API solution?

`src/` with Domain (entities, value objects), Application (use cases, DTOs, interfaces, validation), Infrastructure (EF Core DbContext, migrations, external services) and Api (controllers/endpoints, middleware, Program.cs) projects; `tests/` with unit, integration and functional test projects; shared settings in Directory.Build.props, central package versions, global.json, .editorconfig; Dockerfile and pipelines alongside.

## [Intermediate|High] Onion vs Clean vs Hexagonal architecture?

Same core idea with different vocabulary: business logic at the centre, independent of infrastructure, connected through interfaces. Hexagonal talks about ports (interfaces) and adapters (implementations/drivers); Onion about concentric rings (domain model, domain services, application services, infrastructure/UI); Clean about entities, use cases, interface adapters and frameworks with the explicit dependency rule. In .NET they produce similar project structures.

## [Intermediate|High] Vertical Slice vs layered architecture?

Layered organises by technical concern (controllers, services, repositories) so one feature spans many folders and projects. Vertical Slice organises by feature/use case — request, validation, handler, endpoint together — so changes are local and each slice can choose its data access. Slices can still share a domain model. Vertical slices suit CQRS-style APIs with many independent use cases.

## [Intermediate|High] Where do you put the repository interfaces and why?

In the Application (or Domain) layer — the inner layer defines what it needs (`IOrderRepository`), and Infrastructure implements it. This is Dependency Inversion: the business logic doesn't depend on EF Core or SQL, can be unit-tested with fakes, and the implementation can change without touching use cases.

## [Intermediate|Medium] What is a modular monolith?

A single deployable application split into well-defined modules by business capability, each with its own code, data (separate schema) and public API; modules interact only through contracts or events. You get microservice-like boundaries without distributed-system complexity, and modules can be extracted into services later if needed.

## [Intermediate|Medium] Layer vs tier?

A layer is a logical grouping of code by responsibility (UI, business, data). A tier is a physical deployment boundary (client device, web server, application server, database server). You can deploy several layers on one tier; crossing tiers adds network calls, latency and failure modes.

## [Intermediate|Medium] What is CQRS? Do you need MediatR for it?

Command Query Responsibility Segregation: separate models/handlers for writes (commands that change state) and reads (queries that return data). It allows optimised read models (Dapper, views, caches) and rich write models. MediatR is just one way to dispatch requests to handlers with pipeline behaviours; you can implement CQRS with plain interfaces and DI.

## [Advanced|Medium] How do you prevent architecture erosion over time?

Make rules explicit (ADRs, diagrams), enforce dependencies with project references (inner projects simply can't reference outer ones) and architecture tests (NetArchTest/ArchUnitNET in CI), code reviews with a checklist, templates for new features, internal visibility (`internal` + `InternalsVisibleTo`) to hide implementation details, and regular refactoring.

## [Advanced|Medium] What are aggregates and why do they matter for structure?

An aggregate is a cluster of domain objects treated as one unit for changes, with a root entity that enforces invariants (Order with OrderLines). Outside code references only the root and changes go through its methods; one transaction modifies one aggregate. This defines repository boundaries (one repository per aggregate root) and keeps business rules in one place.

## [Beginner|Medium] What is the composition root?

The single place where the application's object graph is wired together — in ASP.NET Core, `Program.cs` (often via `AddApplication()`/`AddInfrastructure()` extension methods) registers interfaces with their implementations in the DI container. Only the composition root knows about all projects; inner layers depend only on abstractions.

## [Scenario|High] You join a project where controllers contain SQL, business rules and email sending. How do you restructure it safely?

Add characterization tests around key endpoints first. Extract business logic into application services/handlers with interfaces for data access and email; move SQL into repositories or query classes in an infrastructure project; introduce DI registration; keep controllers thin (bind, call, return). Do it feature by feature (strangler within the codebase), not as a big-bang rewrite, and agree on the target structure in an ADR.

## [Scenario|Medium] A small internal tool (5 screens) is being built with 8 projects in Clean Architecture. Is that right?

Probably over-engineered: more projects, mapping and indirection than the problem needs, slowing the team. A single project with clear folders (Features or Controllers/Services/Data) and good tests is enough; keep the door open by keeping logic out of controllers. Choose architecture by complexity and expected lifetime, not by habit.

## [Scenario|Medium] How would you organise a solution with an ASP.NET Core API, an Angular front end and background workers?

Monorepo: `src/Shop.Api`, `src/Shop.Worker` (BackgroundService/queue consumers), shared `Shop.Application`/`Shop.Domain`/`Shop.Infrastructure` projects used by both, `web/shop-ui` (Angular workspace), `tests/` for each, `deploy/` with Dockerfiles per deployable, CI pipelines that build only what changed. Or with .NET Aspire, an AppHost project orchestrating API, worker, database and the front end locally.

# Cheatsheet

## Styles

3-tier/N-layer (UI → BLL → DAL) · Onion/Clean/Hexagonal (domain centre, dependencies inward) · Vertical Slice (per feature) · Modular monolith (modules + schemas) · Microservices.

## Clean Architecture projects

Domain (entities, value objects, events) ← Application (use cases, interfaces, DTOs, validation) ← Infrastructure (EF, email, files) ; Api = composition root (controllers, middleware, Program.cs).

## Repo layout

`src/` · `tests/` · `docs/` (ADRs) · `deploy/` · Directory.Build.props · Directory.Packages.props · global.json · .editorconfig · `.sln`/`.slnx`.

## Placement of concerns

Exceptions & auth → Api · validation & transactions & mapping → Application · invariants → Domain · persistence & external services → Infrastructure · logging → everywhere via ILogger.

## Choosing

Small CRUD → simple single project · rich domain → Clean · many independent features → Vertical Slice · many teams → modular monolith · independent scaling/deploys → microservices · write an ADR, enforce with architecture tests.
