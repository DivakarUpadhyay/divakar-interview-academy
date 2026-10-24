---
slug: dotnet-fullstack-interview
title: .NET Full Stack Developer Interview — End to End
track: interview
order: 1
group: Role Preparation
icon: FS
color: #512bd4
summary: How .NET full stack interviews run, the end-to-end request flow (Angular/React → ASP.NET Core → EF Core → SQL Server), authentication, a feature built across every layer, performance, deployment, architecture and system design — with the questions interviewers ask most.
---

# Overview

A **.NET full stack developer** builds a feature through every layer: the UI (Angular or React with TypeScript), the API (ASP.NET Core Web API in C#), data access (EF Core or Dapper), the database (SQL Server), and usually the delivery path (Git, CI/CD, Docker, Azure).

Interviewers for this role do not want five separate specialists. They test whether you can **connect the layers**:

| Layer | Typical stack | What they check |
|---|---|---|
| UI | Angular / React, TypeScript, HTML, CSS | Components, state, forms, calling APIs, routing, auth guards |
| API | ASP.NET Core Web API, C# | REST design, DI, middleware, validation, error handling, auth |
| Data access | EF Core, Dapper, ADO.NET | LINQ, tracking, migrations, N+1, transactions |
| Database | SQL Server | Joins, indexes, stored procedures, execution plans, deadlocks |
| Delivery | Git, Azure DevOps / GitHub Actions, Docker, Azure | Branching, pipelines, config, secrets, monitoring |
| Design | SOLID, patterns, clean architecture | Layering, testability, trade-offs |

This course is the **glue**: each lesson follows one concern across the whole stack. The deep dives live in the individual courses (C#, Web API, EF Core, SQL Server, Angular, React …). Use the **.NET Full Stack Developer** question bank (Interview Questions menu) to drill every question from all of those courses in one place.

# Versions

The stack most job descriptions ask for in 2026:

| Part | Current version | Notes |
|---|---|---|
| .NET | .NET 10 (LTS, Nov 2025) | .NET 8 (LTS) still very common in production; .NET 9 is STS |
| C# | C# 14 (with .NET 10) | Extension members, `field` keyword, null-conditional assignment |
| ASP.NET Core | 10 | Minimal APIs and controllers; built-in OpenAPI document generation |
| EF Core | 10 | LeftJoin/RightJoin LINQ operators, named query filters, complex types |
| SQL Server | 2022 / 2025 | 2025 adds vector data type, JSON type and regex functions |
| Angular | 20 / 21 | Standalone components, signals, new control flow (`@if`, `@for`), zoneless |
| React | 19.x | Actions, `use`, Server Components (via frameworks such as Next.js) |
| TypeScript | 5.x | TypeScript 7 (native Go compiler) in preview |
| Node.js (tooling) | 22 / 24 LTS | Needed for Angular CLI, Vite, npm |

Interview tip: say which version you used in your last project and one feature from it you actually used ("we moved to .NET 8 and used `IExceptionHandler` for global errors").

# Lifecycle

**How a full stack feature moves from ticket to production:**

1. **Requirement** — user story with acceptance criteria (Jira / Azure Boards).
2. **Design** — API contract (endpoint, request/response DTOs, status codes), DB change (table, index, migration), UI screens.
3. **Database** — migration script or EF Core migration; seed data; indexes for the new queries.
4. **API** — DTOs, validation, service/business logic, repository or DbContext query, controller/endpoint, unit tests.
5. **UI** — service that calls the API, component, form with validation, routing, error and loading states.
6. **Integration** — CORS, auth token flow, end-to-end test (Playwright/Cypress).
7. **Review & CI** — pull request, code review, pipeline runs build + tests + static analysis.
8. **Deploy** — CD pipeline to dev → QA → UAT → production; config per environment; feature flags if needed.
9. **Operate** — logs (Serilog / Application Insights), metrics, alerts; fix and iterate.

# Tools

- **IDE:** Visual Studio 2022/2026, VS Code, JetBrains Rider.
- **API testing:** Swagger UI / Scalar, Postman, `.http` files in Visual Studio, curl.
- **Database:** SQL Server Management Studio (SSMS), Azure Data Studio (retired 2026 — use VS Code MSSQL extension), SQL Profiler / Extended Events.
- **Frontend:** Angular CLI, Vite, Chrome DevTools, Redux DevTools, Angular DevTools, React DevTools.
- **Testing:** xUnit / NUnit, Moq / NSubstitute, FluentAssertions, Jasmine/Karma or Jest/Vitest, Playwright.
- **Delivery:** Git, GitHub / Azure Repos, Azure DevOps Pipelines / GitHub Actions, Docker Desktop, Azure Portal, Azure CLI.
- **Monitoring:** Application Insights, Serilog + Seq, Grafana.

# Module: How .NET Full Stack Interviews Run

## Lesson: [Basic|High] The interview rounds and what each one tests

Most companies (product companies, service companies and startups) use some mix of these rounds:

| Round | Duration | What happens | How to prepare |
|---|---|---|---|
| Screening / online test | 30–90 min | MCQs on C#, SQL, JS + 1–2 coding problems | Coding Round course, C# basics, SQL joins |
| Technical round 1 | 45–60 min | C#, OOP, .NET Core, Web API, EF Core, SQL | "★ Must know" questions in the .NET role bank |
| Technical round 2 | 45–60 min | Angular/React, JavaScript, end-to-end flow, a small live task | This course + frontend courses |
| Design / architecture | 45–60 min | Design a feature or a system; layering, scaling, trade-offs | Microservices & System Design course |
| Managerial | 30–45 min | Project, ownership, conflict, estimates, Agile | Team Lead & Agile course |
| HR | 20–30 min | Notice period, salary, relocation, gaps | HR and Career Gaps courses |

**What separates a strong full stack candidate:**

- Explains **one real feature end to end**: UI → API → DB → back, including errors and security.
- Knows **why** (trade-offs), not only **what** (definitions).
- Writes working code live: a LINQ query, a SQL query, a component, an endpoint.
- Talks about production: logging, performance, deployment, incidents.

> **Interview tip:** When asked any definition question, finish with "In my last project we used it for …". It turns a textbook answer into evidence.

## Lesson: [Basic|High] "Explain your project architecture" — the end-to-end answer

This is asked in almost every round. Prepare a 2-minute answer using this skeleton:

1. **Business** — "An order-management portal for distributors; ~300 internal users, ~20k orders/day."
2. **Frontend** — "Angular 17 SPA with standalone components, reactive forms, an HTTP interceptor that adds the JWT and handles 401."
3. **API** — "ASP.NET Core 8 Web API, layered: Controllers → Services → Repositories (EF Core). FluentValidation for input, global exception middleware returning ProblemDetails, Serilog to Application Insights."
4. **Database** — "SQL Server 2019; ~60 tables; stored procedures for heavy reports; indexes tuned using execution plans."
5. **Security** — "Azure AD (Entra ID) login; API validates JWT bearer tokens; role-based policies."
6. **Delivery** — "Git with feature branches and PRs; Azure DevOps pipelines build, test and deploy to Azure App Service; separate dev/QA/prod."
7. **Your part** — "I owned the orders module end to end: API, EF queries, the Angular screens, and I cut the order search from 6 s to 300 ms by adding a covering index and paging."

Draw it as you talk:

```text
[Angular SPA] --HTTPS + JWT--> [ASP.NET Core API] --EF Core--> [SQL Server]
      |                              |                              
  Entra ID login            Serilog -> App Insights          Nightly SSIS/ETL
```

> **Interview tip:** Always end with **your** contribution and **one measurable result**. Interviewers remember numbers.

# Module: End-to-End Request Flow

## Lesson: [Intermediate|High] From a button click to SQL Server and back

Follow one request — "Load page 1 of orders for customer 42":

**1. UI (Angular)** — the component asks a service; the service calls the API:

```typescript
// order.service.ts
@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  getOrders(customerId: number, page = 1, size = 20) {
    return this.http.get<PagedResult<OrderDto>>(`/api/customers/${customerId}/orders`, { params: { page, size } });
  }
}
```

**2. Browser → server** — HTTPS request; an interceptor adds `Authorization: Bearer <token>`; for another origin the browser first sends a CORS preflight (`OPTIONS`).

**3. ASP.NET Core pipeline** — Kestrel receives it → middleware in order: exception handler → HTTPS redirection → routing → CORS → authentication → authorization → endpoint.

**4. Controller / endpoint** — model binding, validation, call the service:

```csharp
[ApiController]
[Route("api/customers/{customerId:int}/orders")]
public class OrdersController(IOrderService orders) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderDto>>> Get(int customerId, [FromQuery] int page = 1, [FromQuery] int size = 20, CancellationToken ct = default)
        => Ok(await orders.GetPageAsync(customerId, page, Math.Clamp(size, 1, 100), ct));
}
```

**5. Service + EF Core** — LINQ is translated to one SQL query; `AsNoTracking` for read-only; project to a DTO so only needed columns travel:

```csharp
public async Task<PagedResult<OrderDto>> GetPageAsync(int customerId, int page, int size, CancellationToken ct)
{
    var query = db.Orders.AsNoTracking().Where(o => o.CustomerId == customerId);
    var total = await query.CountAsync(ct);
    var items = await query.OrderByDescending(o => o.OrderDate)
        .Skip((page - 1) * size).Take(size)
        .Select(o => new OrderDto(o.Id, o.OrderDate, o.Status, o.Lines.Sum(l => l.Qty * l.Price)))
        .ToListAsync(ct);
    return new PagedResult<OrderDto>(items, total, page, size);
}
```

**6. SQL Server** — runs the generated query (`ORDER BY ... OFFSET ... FETCH`), ideally an index seek on `(CustomerId, OrderDate DESC)`.

**7. Back up the stack** — DTOs serialised to JSON by `System.Text.Json` → `200 OK` → Angular deserialises → the template renders with `@for`.

> **Interview tip:** Mention **async all the way** (frees threads while waiting for SQL), **CancellationToken** (stops work when the user navigates away), **AsNoTracking** and **projection**. These four show production experience.

## Lesson: [Intermediate|High] Authentication end to end — JWT, refresh tokens, CORS

**Typical flow (token-based, SPA + API):**

1. User logs in (own endpoint, or an identity provider such as Microsoft Entra ID / Auth0 / Duende IdentityServer using OAuth 2.0 + OpenID Connect with PKCE).
2. The SPA receives an **access token** (short-lived JWT, e.g. 15–60 min) and often a **refresh token** (long-lived, rotated).
3. An HTTP interceptor adds `Authorization: Bearer <access token>` to API calls.
4. The API validates signature, issuer, audience and expiry; builds `ClaimsPrincipal`; `[Authorize]` and policies check roles/claims.
5. On `401`, the SPA uses the refresh token to get a new access token, or redirects to login.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = builder.Configuration["Auth:Authority"];   // identity provider
        o.Audience  = builder.Configuration["Auth:Audience"];
    });
builder.Services.AddAuthorization(o => o.AddPolicy("CanApprove", p => p.RequireRole("Manager")));

app.UseCors("spa");
app.UseAuthentication();
app.UseAuthorization();
```

```typescript
// Angular functional interceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).accessToken();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
```

| Question | Short answer |
|---|---|
| Where to store tokens in the browser? | Best: keep tokens out of JS (BFF pattern + HttpOnly, Secure, SameSite cookie). If in JS, keep the access token in memory, not `localStorage` (XSS can read it). |
| Authentication vs authorization | Authentication = who you are (401 if missing/invalid). Authorization = what you may do (403 if not allowed). |
| What is CORS? | A **browser** rule: a page from origin A may call origin B only if B returns `Access-Control-Allow-Origin` for A. It is not a server security feature — Postman ignores it. |
| JWT contents | Header (alg), payload (claims: `sub`, `exp`, `aud`, `iss`, roles), signature. Base64Url-encoded, **not encrypted** — never put secrets in it. |

## Lesson: [Intermediate|High] Validation, error handling and logging across the layers

**Validate at every boundary — for different reasons:**

| Layer | Validation | Why |
|---|---|---|
| UI | Reactive form validators / schema (Zod) | Fast feedback for the user |
| API | DataAnnotations or FluentValidation; `[ApiController]` returns 400 automatically | Never trust the client |
| Domain/service | Business rules (credit limit, status transitions) | Rules that need data |
| Database | NOT NULL, FK, UNIQUE, CHECK constraints | Last line of defence for integrity |

**Consistent errors with ProblemDetails (RFC 9457):**

```csharp
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
app.UseExceptionHandler();

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> log) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            NotFoundException => (404, "Not found"),
            ValidationException => (400, "Validation failed"),
            _ => (500, "Unexpected error")
        };
        if (status == 500) log.LogError(ex, "Unhandled error for {Path}", ctx.Request.Path);
        ctx.Response.StatusCode = status;
        await ctx.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title }, ct);
        return true;
    }
}
```

**UI side:** one HTTP interceptor maps 400 → show field errors, 401 → refresh/login, 403 → "not allowed", 500 → toast + correlation id.

**Logging:** structured logs (`{OrderId}` placeholders, not string concatenation), a **correlation id** per request passed from UI to API to downstream services, log levels used properly, no passwords/tokens/PII in logs.

# Module: Building a Feature Full Stack

## Lesson: [Intermediate|High] Worked example — "Products" CRUD with search and paging

The classic live-coding / take-home task. Build it layer by layer.

**1. Database (SQL Server)**

```sql
CREATE TABLE dbo.Products (
    Id         INT IDENTITY PRIMARY KEY,
    Name       NVARCHAR(200) NOT NULL,
    Category   NVARCHAR(100) NOT NULL,
    Price      DECIMAL(18,2) NOT NULL CHECK (Price >= 0),
    IsActive   BIT NOT NULL DEFAULT 1,
    RowVersion ROWVERSION
);
CREATE INDEX IX_Products_Category_Name ON dbo.Products(Category, Name) INCLUDE (Price) WHERE IsActive = 1;
```

**2. Entity, DTOs and validation**

```csharp
public class Product { public int Id { get; set; } public string Name { get; set; } = ""; public string Category { get; set; } = "";
    public decimal Price { get; set; } public bool IsActive { get; set; } = true; public byte[] RowVersion { get; set; } = []; }

public record ProductDto(int Id, string Name, string Category, decimal Price);
public record SaveProductRequest(
    [property: Required, MaxLength(200)] string Name,
    [property: Required, MaxLength(100)] string Category,
    [property: Range(0, 1_000_000)] decimal Price);
```

**3. Endpoints (minimal API style)**

```csharp
var products = app.MapGroup("/api/products").RequireAuthorization();

products.MapGet("/", async (AppDb db, string? q, int page = 1, int size = 20) =>
{
    var query = db.Products.AsNoTracking().Where(p => p.IsActive);
    if (!string.IsNullOrWhiteSpace(q)) query = query.Where(p => p.Name.Contains(q));
    var total = await query.CountAsync();
    var items = await query.OrderBy(p => p.Name).Skip((page - 1) * size).Take(size)
        .Select(p => new ProductDto(p.Id, p.Name, p.Category, p.Price)).ToListAsync();
    return Results.Ok(new { items, total });
});

products.MapPost("/", async (AppDb db, SaveProductRequest r) =>
{
    var p = new Product { Name = r.Name, Category = r.Category, Price = r.Price };
    db.Products.Add(p);
    await db.SaveChangesAsync();
    return Results.Created($"/api/products/{p.Id}", new ProductDto(p.Id, p.Name, p.Category, p.Price));
});

products.MapDelete("/{id:int}", async (AppDb db, int id) =>
    await db.Products.Where(p => p.Id == id).ExecuteUpdateAsync(s => s.SetProperty(p => p.IsActive, false)) == 1
        ? Results.NoContent() : Results.NotFound());   // soft delete
```

**4. UI (React + TypeScript)**

```tsx
function Products() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: ProductDto[]; total: number }>({ items: [], total: 0 });

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() =>
      fetch(`/api/products?q=${encodeURIComponent(q)}&page=${page}`, { signal: ctrl.signal })
        .then(r => r.json()).then(setData).catch(() => {}), 300);   // debounce typing
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, page]);

  return (<>
    <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search" />
    <table><tbody>{data.items.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.category}</td><td>{p.price}</td></tr>)}</tbody></table>
    <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
    <button disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>Next</button>
  </>);
}
```

**Points interviewers look for:** DTOs instead of entities over the wire, server-side paging with a max page size, `201 Created` with a location, soft delete, debounced search with request cancellation, a concurrency token (`ROWVERSION`) for edits, and an index that matches the query.

## Lesson: [Advanced|High] Performance across the stack

Find the slow layer first — measure, don't guess (browser Network tab → API timings/Application Insights → SQL execution plan).

| Layer | Common problem | Fix |
|---|---|---|
| UI | Huge bundles, re-rendering lists, many API calls | Lazy-load routes, `OnPush`/signals (Angular), `memo`/virtualised lists (React), batch/combine calls |
| Network | Large JSON, no compression | Paging, projection, response compression, HTTP caching (`ETag`, `Cache-Control`) |
| API | Blocking calls (`.Result`), sync I/O, chatty services | Async all the way, `IHttpClientFactory`, output caching, parallel independent calls with `Task.WhenAll` |
| Data access | N+1 queries, tracking big read sets, `ToList()` too early | `Include`/projection, `AsNoTracking`, `AsSplitQuery` for big graphs, compiled queries |
| Database | Missing index, scans, parameter sniffing, blocking | Execution plan, covering index, update statistics, `OPTION (RECOMPILE)` where justified, RCSI |
| Caching | Same data loaded every request | `IMemoryCache` / `HybridCache` (.NET 9+) / Redis with expiry and invalidation |

```csharp
// N+1 (one query for orders + one per order for lines) …
foreach (var o in await db.Orders.ToListAsync()) total += o.Lines.Sum(l => l.Qty);   // lazy loading → N extra queries
// … fixed: one query, only the numbers needed
var totals = await db.Orders.Select(o => new { o.Id, Qty = o.Lines.Sum(l => l.Qty) }).ToListAsync();
```

> **Interview tip:** Tell a real story: "Search took 6 s; the plan showed a clustered index scan on 4M rows; I added a covering index on (CustomerId, OrderDate) INCLUDE (Status, Total) and server-side paging — 300 ms."

## Lesson: [Advanced|Medium] Deployment — config, secrets, Docker, CI/CD, Azure

**Configuration per environment:** `appsettings.json` → `appsettings.{Environment}.json` → environment variables → Azure App Configuration / Key Vault. Bind to options classes (`IOptions<T>`). Never commit secrets; use User Secrets locally and **Key Vault + Managed Identity** in Azure.

**Container image for the API:**

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish Api/Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
USER app
ENTRYPOINT ["dotnet", "Api.dll"]
```

**Pipeline (Azure DevOps or GitHub Actions):** restore → build → unit tests → publish artefact (or build/push image) → deploy to dev → automated tests → approval → staging slot → swap to production.

**Hosting options:** Azure App Service (simplest for a web API + SPA), Azure Container Apps (containers without managing Kubernetes), AKS (full Kubernetes), Azure Static Web Apps for the SPA. Database: Azure SQL Database. Migrations: run EF Core migration bundles or SQL scripts as a pipeline step, not on app start in production.

# Module: Design and Architecture Round

## Lesson: [Advanced|High] Layered and clean architecture in a .NET solution

A common, interview-friendly solution layout:

```text
src/
  Shop.Domain/          entities, value objects, domain rules        (no dependencies)
  Shop.Application/     use cases/services, DTOs, interfaces (IOrderRepository), validation
  Shop.Infrastructure/  EF Core DbContext, repositories, email, file storage, external APIs
  Shop.Api/             controllers/endpoints, DI wiring, middleware, auth
tests/
  Shop.UnitTests/  Shop.IntegrationTests/
web/
  shop-ui/              Angular or React app
```

**Dependency rule:** dependencies point **inwards** — Api → Application → Domain; Infrastructure implements interfaces defined in Application. That is the **Dependency Inversion Principle** in practice, and it is what makes services unit-testable (mock `IOrderRepository`).

| Question | Answer |
|---|---|
| Do I need a repository over EF Core? | `DbContext` already is a unit of work and `DbSet` a repository. Add your own repository when you want to hide EF from the application layer, share query logic or ease testing; avoid generic repositories that just wrap `DbSet`. |
| Where does validation go? | Input shape in the API (FluentValidation), business rules in Application/Domain, integrity in the database. |
| Monolith or microservices? | Start with a **modular monolith**; split a module into a service only when it needs independent scaling, deployment or ownership. |
| CQRS? | Separate read models (fast queries, often Dapper/SQL views) from write models (rich domain + EF). Useful when reads and writes have very different needs; MediatR is optional. |

## Lesson: [Advanced|Medium] System design for a full stack .NET developer

You are not expected to design Netflix. Expect: "Design an e-commerce order system / a URL shortener / a notification service." Use this structure:

1. **Clarify requirements** — functional (place order, track status) and non-functional (users, requests/sec, latency, availability, consistency).
2. **Estimate** — e.g. 10k orders/day ≈ 0.1/sec average, peaks ×20; data ~5 GB/year → one SQL database is fine.
3. **API design** — `POST /orders`, `GET /orders/{id}`, idempotency key on create.
4. **Data model** — Orders, OrderLines, Products, Customers; indexes for the main queries.
5. **High-level design** — SPA → CDN; API behind a load balancer (stateless, scale out); SQL primary + read replica; Redis cache; Service Bus queue for emails/invoices.
6. **Deep dive** — one hard part: payment + stock consistency (outbox pattern, idempotency), or caching strategy.
7. **Reliability & ops** — retries with backoff (Polly / `Microsoft.Extensions.Http.Resilience`), health checks, logging, monitoring, alerts.
8. **Trade-offs** — say what you would do differently at 100× scale.

```text
Browser ─ CDN (SPA files)
   │
   └─ HTTPS ─> Load balancer ─> API (N instances) ─┬─> SQL Server (primary + read replica)
                                                  ├─> Redis cache
                                                  └─> Service Bus ─> Worker (emails, invoices)
```

# Interview

## [Beginner|High] Explain the architecture of your current project end to end.

Use the skeleton: business context → frontend (framework, state, auth) → API (layers, validation, errors, logging) → data (EF/Dapper, SQL Server, stored procedures) → security (identity provider, JWT, roles) → delivery (Git, CI/CD, hosting) → **your** part and one measurable result. Draw the boxes while you speak and keep it to about two minutes; the interviewer will drill into what interests them.

## [Beginner|High] What happens when a user clicks "Save" in your Angular/React app until the data is in SQL Server?

Form validation → service calls `POST /api/...` with JSON → interceptor adds the JWT → browser sends CORS preflight if cross-origin → Kestrel → middleware (exception handling, routing, CORS, authentication, authorization) → controller/endpoint → model binding and validation (400 if invalid) → service applies business rules → EF Core tracks the new entity → `SaveChangesAsync` opens a transaction and runs `INSERT` → SQL Server checks constraints and commits → API returns `201 Created` with the new resource → UI updates the list and shows a message. Errors flow back as ProblemDetails and are shown by the interceptor.

## [Beginner|High] What is the difference between authentication and authorization? Which status codes do they return?

Authentication proves **who** the caller is (token, cookie); failure → **401 Unauthorized**. Authorization decides **what** an authenticated caller may do (roles, policies, claims); failure → **403 Forbidden**. In ASP.NET Core: `UseAuthentication()` then `UseAuthorization()`, `[Authorize(Roles = "Admin")]` or policies.

## [Beginner|High] What is CORS and why do you get a CORS error only in the browser?

CORS (Cross-Origin Resource Sharing) is a browser protection: JavaScript from origin A (e.g. `http://localhost:4200`) may read a response from origin B (`https://api.example.com`) only if B sends `Access-Control-Allow-Origin` allowing A. Non-simple requests trigger an `OPTIONS` preflight. Postman and server-to-server calls don't enforce it. Fix: `builder.Services.AddCors(...)` with the exact SPA origins and `app.UseCors(...)` before auth — never `AllowAnyOrigin` together with credentials.

## [Beginner|High] Why do you return DTOs instead of EF entities from an API?

Entities expose internal fields (passwords, audit columns), create circular references for JSON, couple the API contract to the database schema, and with lazy loading can trigger extra queries during serialisation. DTOs give a stable contract, only the needed fields, and let you project in SQL (`Select(o => new OrderDto(...))`) so less data is read.

## [Intermediate|High] How do you implement paging, sorting and searching in a full stack app?

Server-side: the API takes `page`, `size` (clamped to a maximum, e.g. 100), `sort` and `q`; EF Core builds `Where` → `OrderBy` → `Skip/Take`, returns `{ items, total }` (or a continuation token for keyset paging on very large tables). SQL needs an index that supports the filter + order. UI: debounce the search box (300 ms), cancel the previous request (`switchMap` in RxJS / `AbortController`), keep page/sort in the URL query string so links and Back work.

## [Intermediate|High] Where do you store the JWT in an SPA, and how do you refresh it?

Safest: don't expose tokens to JavaScript — use a **Backend-for-Frontend** that keeps tokens server-side and gives the browser an HttpOnly, Secure, SameSite cookie. If the SPA holds tokens, keep the short-lived access token **in memory** (not `localStorage`, which XSS can read) and use refresh-token rotation via the identity provider (MSAL / oidc-client handle this). On a 401 the interceptor refreshes once and retries; if refresh fails, redirect to login.

## [Intermediate|High] How do you handle errors globally in both the API and the UI?

API: `AddProblemDetails()` + an `IExceptionHandler` (or exception middleware) maps known exceptions to 400/404/409 and logs unknown ones as 500 with a correlation id; `[ApiController]` returns validation errors automatically. UI: one HTTP interceptor (Angular) or fetch wrapper (React) maps status codes to field errors, a login redirect, a "no permission" page, or a toast showing the correlation id; React error boundaries / Angular `ErrorHandler` catch rendering errors.

## [Intermediate|High] Explain the N+1 problem and how you detect and fix it.

One query loads N parents, then one more query runs per parent to load children (often through lazy loading or a query inside a loop) — 1 + N round trips. Detect it with EF Core logging / Application Insights dependency telemetry / SQL Profiler showing many identical queries. Fix: eager load with `Include`, or better project only what you need in one query (`Select`), use `AsSplitQuery` for large graphs, and never query inside a loop.

## [Intermediate|High] How do you make an API call from Angular and show loading and error states?

Inject `HttpClient` into a service that returns an `Observable<T>`; in the component either subscribe with `takeUntilDestroyed()` or use the `async` pipe / `toSignal`. Keep `loading`, `error` and `data` state (signals or a store), set loading before the call, clear it in `finalize`, catch errors with `catchError`. For search, use `debounceTime` + `distinctUntilChanged` + `switchMap` so older requests are cancelled.

## [Intermediate|High] How do you secure an ASP.NET Core Web API?

HTTPS only (HSTS); authentication with JWT bearer from a trusted identity provider; authorization with policies and resource checks (user may only see their own orders — prevents IDOR); input validation; parameterised queries (EF/Dapper do this — never concatenate SQL); rate limiting (`AddRateLimiter`); CORS restricted to known origins; secrets in Key Vault; security headers; no stack traces to clients; dependency scanning in CI; logging without sensitive data.

## [Intermediate|Medium] How do you handle two users editing the same record at the same time?

Optimistic concurrency: a `ROWVERSION` column mapped as a concurrency token (`[Timestamp]`). The UI sends back the version it loaded; EF Core adds `WHERE Id = @id AND RowVersion = @v` to the UPDATE. If no row is updated, EF throws `DbUpdateConcurrencyException`; the API returns **409 Conflict** and the UI shows "this record changed — reload". Pessimistic locking (holding locks) is rarely right for web apps.

## [Intermediate|Medium] How do you manage configuration and secrets across dev, QA and production?

`appsettings.json` + `appsettings.{Environment}.json` + environment variables, bound to strongly typed options (`IOptions<T>`, validated on start). Secrets: User Secrets locally, Azure Key Vault in the cloud, accessed with Managed Identity (no passwords in config). The SPA gets environment settings at build time (Angular `environment.ts` / Vite env) or from a `/config.json` loaded at startup so the same build can go to every environment.

## [Intermediate|Medium] What does your CI/CD pipeline do for a full stack app?

On PR: restore, build API and UI, run unit tests, lint, code analysis, maybe SonarQube and dependency scanning. On merge to main: build artefacts or Docker images with a version tag, deploy to dev, run DB migration scripts, smoke/integration tests, deploy to QA/UAT with approvals, then production via deployment slots or rolling update; rollback = redeploy the previous artefact. Pipelines are YAML in the repo.

## [Advanced|High] How would you structure a new .NET full stack solution from scratch?

Domain, Application, Infrastructure and Api projects (clean architecture), tests projects alongside, and the SPA in its own folder. Dependency rule inwards; DI registers Infrastructure implementations of Application interfaces. Cross-cutting: global error handling with ProblemDetails, validation (FluentValidation), structured logging with correlation ids, health checks, OpenAPI. Start as a modular monolith, one database with schemas per module. Add CI from day one.

## [Advanced|High] Your list page takes 8 seconds to load. How do you find and fix the problem?

Measure layer by layer: browser DevTools Network (is it the API call or rendering?), API timing / Application Insights (controller vs SQL time), EF Core logs or SQL Profiler for the generated SQL, actual execution plan in SSMS. Typical fixes: server-side paging and projection, a covering index for the filter/sort columns, removing N+1 queries, `AsNoTracking`, caching reference data, removing `.Result` blocking, virtualising long lists and lazy-loading the route in the UI. Re-measure after each change and report the before/after numbers.

## [Advanced|High] Monolith or microservices for a new product? Justify.

Usually a **modular monolith** first: one deployable, clear module boundaries, one database with separate schemas, in-process calls — simpler to build, test, deploy and debug. Move a module to a microservice when it needs independent scaling, release cadence, technology or team ownership. Microservices add network failures, distributed data and transactions (sagas/outbox), observability and DevOps cost — accept that only for a concrete benefit.

## [Advanced|Medium] How do you keep the API and the frontend contract in sync?

Generate the contract from the API: ASP.NET Core produces an OpenAPI document (built-in `AddOpenApi` in .NET 9+, or Swashbuckle/NSwag); generate TypeScript clients/types with NSwag, openapi-typescript or Orval in the build. Version breaking changes (`/api/v2` or header versioning with Asp.Versioning), keep changes additive, and run contract or end-to-end tests in CI.

## [Advanced|Medium] How do you run long work (reports, emails, imports) without blocking the user?

Don't do it inside the HTTP request. Return `202 Accepted` with a job id, push a message to a queue (Azure Service Bus / RabbitMQ / Hangfire / a `Channel<T>` + `BackgroundService` for simple cases), process it in a worker, store status, and let the UI poll or receive a push via SignalR. Make the job idempotent and retryable.

## [Scenario|High] The UI shows "CORS error" after you deployed the API to Azure, but it worked locally. What do you check?

The CORS policy must include the **production SPA origin** exactly (scheme + host + port, no trailing slash); `UseCors` must run before `UseAuthentication`/`UseAuthorization` and before the endpoints; Azure App Service's own CORS setting can override the app — use one or the other; the "CORS error" can also hide a 500 or 404 (a failed preflight or an error page without CORS headers) — check the API logs and the Network tab for the actual status.

## [Scenario|High] A user can see another customer's orders by changing the id in the URL. What is wrong and how do you fix it?

That is an **IDOR** (Insecure Direct Object Reference) — broken object-level authorization, the #1 item in the OWASP API Security Top 10. Authentication alone is not enough: the API must check ownership on every request, e.g. filter by the current user's customer id from the token (`Where(o => o.CustomerId == currentUser.CustomerId)`) or use resource-based authorization (`IAuthorizationService.AuthorizeAsync(User, order, "OwnsOrder")`). Return 404 (not 403) to avoid revealing that the id exists, and add tests for it.

## [Scenario|High] After a release the API is slow and SQL CPU is at 100%. What do you do?

Stabilise first: roll back or scale up if users are blocked. Then find the top queries by CPU (Query Store / `sys.dm_exec_query_stats`), compare plans before and after the release — usually a new query without an index, a changed LINQ query producing a bad plan, an N+1 loop, or parameter sniffing. Fix with an index, a rewritten query, forcing the last good plan in Query Store as a stop-gap, and add a performance test or alert so it is caught earlier next time.

## [Scenario|High] You are asked to add a "bulk upload products from Excel" feature. Walk through your design.

UI: upload control with file type/size checks, shows progress, then a result summary. API: `POST` multipart, validate size, store the file (Blob Storage), return `202` with an import id. Worker: read with a streaming library (e.g. ClosedXML/ExcelDataReader), validate every row and collect errors, insert in batches (`SqlBulkCopy` or EF Core bulk/`ExecuteUpdate`) inside a transaction or into a staging table then `MERGE`. Status endpoint/SignalR for progress; downloadable error report; idempotent so a retry doesn't duplicate rows; audit who uploaded what.

## [Scenario|Medium] Two services need the same customer data. One team proposes sharing one database table. What do you advise?

Sharing tables couples deployments and schema changes between teams. Prefer one owner of the data: other services call its API or keep a read-only copy updated through events (CustomerUpdated on a message bus). If they truly must share, use a view or a stable read schema as the contract. Inside a modular monolith, keep separate schemas and access other modules only through their public interfaces.

## [Scenario|Medium] Your Angular/React app works locally but shows a blank page after deployment. How do you debug it?

Open DevTools console and Network: typical causes are a wrong `base href` / `base` path, 404s for JS bundles, the server not rewriting deep links to `index.html` (SPA fallback), missing environment config (API URL points to localhost), mixed content (HTTPS page calling HTTP API) or a runtime error in production mode only. Fix the hosting rewrite rule, base path and environment config, and add a smoke test to the pipeline.

## [Scenario|Medium] An order must be saved, stock reduced and an email sent. How do you keep these consistent?

Order and stock in the **same database transaction** (`SaveChangesAsync` on one DbContext, or an explicit transaction). The email is a side effect outside the database, so use the **outbox pattern**: in the same transaction insert an "OrderPlaced" row into an Outbox table; a background worker reads it, publishes/sends the email and marks it done. If the app crashes after commit, the worker still sends it; consumers are idempotent so a retry doesn't send twice.

# Cheatsheet

## End-to-end request path

`UI service` → `interceptor (JWT)` → `CORS preflight` → `Kestrel` → `exception handler → routing → CORS → authN → authZ` → `endpoint` → `validation` → `service` → `EF Core / Dapper` → `SQL Server` → `DTO → JSON` → `UI state → render`.

## Status codes to quote

| Code | Use |
|---|---|
| 200 / 201 / 204 | OK / Created (+ Location) / No content (delete, update) |
| 202 | Accepted — background job started |
| 400 | Validation failed (ProblemDetails with errors) |
| 401 / 403 | Not authenticated / authenticated but not allowed |
| 404 / 409 | Not found / conflict (concurrency, duplicate) |
| 429 | Rate limited |
| 500 | Unhandled error — log with correlation id |

## Performance checklist

- Server-side paging, projection to DTOs, `AsNoTracking` for reads
- Index for every important `WHERE` + `ORDER BY`; read the execution plan
- No N+1, no query inside a loop, no `.Result`/`.Wait()`
- Cache reference data (`IMemoryCache`/`HybridCache`/Redis)
- UI: lazy routes, debounce + cancel, virtual scrolling, `OnPush`/signals or `memo`

## Security checklist

- HTTPS + HSTS; JWT from a trusted IdP; policies, not only roles
- Ownership checks on every resource (no IDOR)
- Parameterised SQL only; validate all input
- CORS limited to known origins; rate limiting
- Secrets in Key Vault with Managed Identity; nothing sensitive in logs or JWT payload

## Project answer skeleton

Business → Frontend → API layers → Data → Security → CI/CD & hosting → **My contribution + one number**.

## Words that show seniority

Idempotency key · outbox pattern · correlation id · ProblemDetails · optimistic concurrency (ROWVERSION) · covering index · keyset paging · modular monolith · Managed Identity · deployment slots · feature flags · health checks.
