---
slug: aspnet-core-webapi
title: ASP.NET Core Web API & REST
track: dotnet
order: 15
group: ASP.NET Core
icon: API
color: #1971c2
summary: REST principles, controllers vs Minimal APIs, middleware, status codes, validation and ProblemDetails, JWT authentication, versioning, OpenAPI, caching, rate limiting, CORS, gRPC/SignalR and microservices basics.
---

# Overview

**ASP.NET Core Web API** builds HTTP services that return data (usually JSON) for SPAs (React/Angular/Vue), mobile apps and other services. Two programming models:

- **Controller-based APIs**: `[ApiController]` classes with actions (feature-rich: filters, model binding conventions).
- **Minimal APIs** (.NET 6+): lambda endpoints mapped in `Program.cs` (`app.MapGet(...)`), less ceremony, AOT-friendly.

Related technologies: **gRPC** (high-performance HTTP/2 + Protobuf RPC), SignalR (real-time WebSockets), GraphQL (Hot Chocolate), YARP (reverse proxy/API gateway).

**REST** (Representational State Transfer, Roy Fielding, 2000) constraints: client–server, stateless, cacheable, uniform interface (resources identified by URIs, manipulated via representations, standard HTTP methods), layered system, (optional) code on demand.

# Versions

| Version | Highlights for APIs |
|---|---|
| ASP.NET Web API 1/2 (2012/2013) | On .NET Framework; attribute routing in v2; OWIN |
| ASP.NET Core 1.0 (2016) | Web API merged into MVC: one `Controller` base |
| 2.1 (2018) | `[ApiController]` (automatic 400s, binding inference), `ControllerBase`, `ActionResult<T>`, ProblemDetails |
| 3.0 (2019) | Endpoint routing, System.Text.Json default, gRPC templates |
| 6 (2021) | **Minimal APIs**, `WebApplication` minimal hosting |
| 7 (2022) | Route groups, endpoint filters, typed results, **rate limiting**, output caching |
| 8 (2023) | Native AOT for Minimal APIs, `[FromForm]` in Minimal APIs, keyed services, Identity API endpoints, `IExceptionHandler` |
| 9 (2024) | Built-in OpenAPI document generation (`Microsoft.AspNetCore.OpenApi`, Swashbuckle removed from templates), HybridCache |
| 10 (2025) | OpenAPI 3.1, built-in validation for Minimal APIs (`AddValidation()`), Server-Sent Events results, JSON Patch with System.Text.Json |

# Lifecycle

**API request lifecycle:**

1. Client sends an HTTP request (method + URL + headers + body).
2. Kestrel → middleware: exception handler → HTTPS → CORS → authentication (JWT validated) → authorization → rate limiter → response caching/output caching.
3. Endpoint routing selects the action/minimal endpoint.
4. Controller APIs: filters → model binding (`[FromBody]` JSON deserialised with System.Text.Json) → validation (`[ApiController]` returns **400 ProblemDetails** automatically if invalid) → action.
5. Action calls services/repositories (async I/O to DB/HTTP).
6. Result (`Ok(dto)`, `CreatedAtAction`, `NotFound()`) → **content negotiation** picks a formatter (JSON by default) → serialised response with status code and headers.
7. Logging/telemetry middleware records the request; response returns.

**API lifecycle (product):** design (OpenAPI contract) → implement → test (unit, integration, contract) → document → version → deploy behind a gateway → monitor → deprecate old versions (Sunset header) → retire.

# Tools

| Tool | Use |
|---|---|
| Postman, Insomnia, Bruno | Manual and collection-based API testing |
| `.http` files in Visual Studio / VS Code REST Client | Requests stored with the code |
| Swagger UI / Scalar / ReDoc | Interactive docs from the OpenAPI document |
| NSwag, Kiota, OpenAPI Generator | Generate typed clients |
| Microsoft.AspNetCore.Mvc.Testing | Integration tests (`WebApplicationFactory`) |
| k6, JMeter, NBomber, Azure Load Testing | Load testing |
| Azure API Management, YARP, Ocelot | Gateways |
| Application Insights, OpenTelemetry, Seq, Serilog | Observability |
| curl / httpie | Command-line testing |

# Module: REST Fundamentals

## Lesson: [Basic|High] REST principles and resource design

| Action | Method | URI | Success status |
|---|---|---|---|
| List | GET | `/api/orders?status=open&page=2` | 200 |
| Get one | GET | `/api/orders/42` | 200 / 404 |
| Create | POST | `/api/orders` | **201** + `Location` header |
| Replace | PUT | `/api/orders/42` | 200 / 204 |
| Partial update | PATCH | `/api/orders/42` | 200 / 204 |
| Delete | DELETE | `/api/orders/42` | 204 |
| Sub-resource | GET | `/api/customers/7/orders` | 200 |

Guidelines: nouns not verbs (`/orders`, not `/getOrders`), plural collections, hierarchy for relationships, query string for filtering/sorting/paging, consistent casing (kebab-case paths, camelCase JSON), version the API, use standard status codes.

**Idempotent** methods give the same result if repeated: GET, PUT, DELETE, HEAD, OPTIONS. Safe methods don't change state: GET, HEAD, OPTIONS. POST is neither; PATCH is not guaranteed idempotent.

### How it works

REST treats your system as a set of **resources** (orders, customers, invoices), each with its own URL. The HTTP method says what you want to do with it, so the URL never needs a verb. The client and server share nothing except the request: every call carries everything the server needs (the token, the filters, the body), which is what "stateless" means. That is why a REST API can sit behind a load balancer and any server can answer any request.

Idempotency matters for retries. If a `PUT` or `DELETE` times out, the client can safely send it again because the second call leaves the same final state. A repeated `POST` can create a second order, so payment and order APIs usually accept an **idempotency key** header and return the first result for a repeated key.

### Common mistakes

- Verbs in URLs: `/api/createOrder`, `/api/orders/delete/42`. Use the method instead.
- Returning `200` with `{ "success": false }` for errors. Clients, proxies and monitoring tools all read the status code first.
- Deep nesting such as `/customers/7/orders/42/lines/3/products`. Two levels is usually enough; after that, give the resource its own top-level URL.
- Changing the meaning of a field in place. Add a new field or a new version instead, because existing clients will break silently.

### Real-world example

An online shop's "place order" screen sends `POST /api/orders` with an `Idempotency-Key: 5f1c...` header. The API returns `201 Created` and `Location: /api/orders/1001`. The phone loses signal and the app retries; the API sees the same key and returns the same `201` with order 1001 instead of charging the customer twice.

### Try it yourself

1. Design URLs and methods for a library system: books, members, loans and "return a book".
2. Decide which of your endpoints are idempotent, and which one needs an idempotency key.
3. Write the status code each endpoint returns on success and on the most common failure.

## Lesson: [Basic|High] HTTP status codes you must know

| Code | Meaning | When |
|---|---|---|
| 200 OK | Success with body | GET, PUT returning the resource |
| 201 Created | Resource created | POST; include `Location` |
| 202 Accepted | Queued for async processing | Long-running jobs |
| 204 No Content | Success, no body | DELETE, PUT |
| 301/308 | Moved permanently | URL changes |
| 304 Not Modified | Cached copy still valid | ETag / If-None-Match |
| 400 Bad Request | Invalid input | Validation errors |
| 401 Unauthorized | Not authenticated | Missing/invalid token |
| 403 Forbidden | Authenticated but not allowed | Role/policy fails |
| 404 Not Found | Resource doesn't exist | |
| 405 Method Not Allowed | Wrong verb | |
| 409 Conflict | State conflict | Duplicate, concurrency |
| 412 Precondition Failed | If-Match ETag mismatch | Optimistic concurrency |
| 415 Unsupported Media Type | Wrong Content-Type | |
| 422 Unprocessable Content | Semantically invalid | Business rule violations (some APIs) |
| 429 Too Many Requests | Rate limited | + `Retry-After` |
| 500 Internal Server Error | Unhandled server error | |
| 502/503/504 | Gateway / unavailable / timeout | Downstream failures |

### How it works

The first digit tells the client what kind of result it got: **2xx** success, **3xx** go somewhere else, **4xx** the client must change the request, **5xx** the server failed and the same request might work later. Retry logic, browsers, CDNs and dashboards all rely on that split. A client should retry a `503` or `504` with backoff, but retrying a `400` will fail the same way every time.

### Common mistakes

- Mixing up **401** and **403**. 401 means "I don't know who you are" (no token, expired token). 403 means "I know who you are, and you can't do this".
- Returning **500** for bad input. That pages the on-call engineer for a typo in the client. Validation problems are 400 (or 422 if your API uses it for business rules).
- Returning **404** for an empty list. `GET /api/orders?status=open` with no matches is `200` with `[]`.
- Hiding every error behind 200. Monitoring then shows a healthy API while users see failures.

### Real-world example

A mobile app calls `GET /api/orders/42` and gets `401`: it silently refreshes the access token and tries once more. On `403` it shows "You don't have access to this order". On `404` it shows "Order not found". On `503` it waits 2, then 4 seconds and retries. One status code, four different behaviours, and none of them needs to parse an error message.

### Try it yourself

1. List the status codes your current project returns and find one endpoint that returns the wrong one.
2. Pick the right code for: duplicate email on sign-up, an expired token, a request body over 10 MB, and a payment provider that is down.

## Lesson: [Basic|High] Controller-based API

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController(IOrderService orders) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderDto>>> List([FromQuery] OrderQuery q, CancellationToken ct) =>
        Ok(await orders.ListAsync(q, ct));

    [HttpGet("{id:int}")]
    [ProducesResponseType<OrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDto>> Get(int id, CancellationToken ct) =>
        await orders.GetAsync(id, ct) is { } dto ? dto : NotFound();

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderRequest req, CancellationToken ct)
    {
        var dto = await orders.CreateAsync(req, ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);   // 201 + Location
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct) =>
        await orders.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
```

`[ApiController]` gives: attribute routing required, automatic **400 ValidationProblemDetails** when `ModelState` is invalid, binding-source inference (complex types from body, simple from route/query), ProblemDetails for error status codes.

### How it works

When a request arrives, **routing** matches the URL and method to an action, for example `GET api/orders/42` → `OrdersController.Get(42)`. **Model binding** fills the parameters: `id` from the route, `OrderQuery` from the query string, `CreateOrderRequest` from the JSON body. Then validation runs, filters run, the action runs, and the returned `ActionResult` is serialised to JSON with the right status code.

A controller instance is created for every request and disposed afterwards, so it is safe to inject scoped services such as a `DbContext`. Passing `CancellationToken` lets ASP.NET Core cancel your database query when the client disconnects.

### Common mistakes

- Putting business logic and EF queries straight into the action. Keep actions thin and move the work into a service you can unit test.
- Returning `Ok(dto)` after a create. Use `CreatedAtAction` so the client gets `201` and a `Location` header.
- Inheriting from `Controller` instead of `ControllerBase` in an API. `Controller` adds view support you don't need.
- Forgetting `[ApiController]`, then wondering why invalid models reach the action and bodies don't bind.

### Real-world example

In a typical company API, `OrdersController` has five or six actions of two lines each. Each one calls `IOrderService`, which owns the rules ("an order needs at least one line", "only open orders can be cancelled") and talks to the database. Tests cover the service directly. A few integration tests use `WebApplicationFactory` to call the real endpoints in memory.

### Try it yourself

1. Create `ProductsController` with list, get, create and delete actions that return 200, 201, 204 and 404 correctly.
2. Add `CancellationToken` to each action and pass it all the way to EF Core.
3. Write one integration test with `WebApplicationFactory<Program>` that checks a missing product returns 404.

## Lesson: [Basic|High] Minimal APIs

```csharp
var orders = app.MapGroup("/api/orders").WithTags("Orders").RequireAuthorization();

orders.MapGet("/", async (IOrderService svc, [AsParameters] OrderQuery q, CancellationToken ct) =>
    TypedResults.Ok(await svc.ListAsync(q, ct)));

orders.MapGet("/{id:int}", async Task<Results<Ok<OrderDto>, NotFound>> (int id, IOrderService svc, CancellationToken ct) =>
    await svc.GetAsync(id, ct) is { } dto ? TypedResults.Ok(dto) : TypedResults.NotFound());

orders.MapPost("/", async (CreateOrderRequest req, IOrderService svc, CancellationToken ct) =>
{
    var dto = await svc.CreateAsync(req, ct);
    return TypedResults.Created($"/api/orders/{dto.Id}", dto);
}).AddEndpointFilter<ValidationFilter<CreateOrderRequest>>();
```

| | Controllers | Minimal APIs |
|---|---|---|
| Style | Classes + attributes | Lambdas/handlers in code |
| Filters | MVC filters | Endpoint filters |
| Model validation | Automatic with `[ApiController]` | .NET 10 `AddValidation()` or FluentValidation/filters |
| Native AOT | Not supported | Supported |
| Best for | Large APIs, teams used to MVC | Microservices, small/fast APIs |

### How it works

Minimal APIs map a route straight to a delegate. ASP.NET Core looks at the lambda's parameters at startup and generates the binding code: route values, query string, JSON body and services from DI are all inferred. There is no controller class, no action selection and less reflection, which makes startup faster and allows Native AOT.

`MapGroup` gives a set of endpoints a shared prefix, tags, auth rules and filters, so a large API still stays organised. `TypedResults` and `Results<Ok<T>, NotFound>` tell OpenAPI exactly which responses an endpoint can return.

### Common mistakes

- Writing every endpoint in `Program.cs`. Put each feature in its own static class with a `MapOrderEndpoints(this IEndpointRouteBuilder app)` extension method.
- Using `Results.Ok` instead of `TypedResults.Ok`. Both work, but only typed results describe the response type for OpenAPI and tests.
- Assuming validation happens automatically. Before .NET 10 you need a filter or FluentValidation; in .NET 10 call `builder.Services.AddValidation()`.

### Real-world example

A small notification microservice has eight endpoints. With Minimal APIs it is one `Program.cs` plus two endpoint files. It is published with Native AOT into a small container that starts in milliseconds, which matters when Kubernetes scales it from 2 to 20 pods at peak time.

### Try it yourself

1. Rewrite the products controller from the previous lesson as a `MapGroup("/api/products")` with typed results.
2. Move the endpoints into `ProductEndpoints.cs` with an extension method and call it from `Program.cs`.
3. Open `/openapi/v1.json` and check that the 404 response is documented.

# Module: Building Robust APIs

## Lesson: [Intermediate|High] Middleware: built-in and custom

```csharp
public class CorrelationIdMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, ILogger<CorrelationIdMiddleware> log)
    {
        var id = ctx.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString();
        ctx.Response.Headers["X-Correlation-Id"] = id;
        using (log.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = id }))
            await next(ctx);
    }
}
app.UseMiddleware<CorrelationIdMiddleware>();

// inline
app.Use(async (ctx, next) => { /* before */ await next(ctx); /* after */ });
app.Run(async ctx => await ctx.Response.WriteAsync("terminal"));     // terminal: no next
app.Map("/health", b => b.Run(async c => await c.Response.WriteAsync("OK")));   // branch
```

`Use` can call `next`; `Run` is terminal; `Map`/`MapWhen` branch the pipeline. **Order matters**: e.g. `UseAuthentication` before `UseAuthorization`; CORS before auth; exception handler first.

### How it works

The pipeline is a chain of delegates. Each middleware gets the `HttpContext` and a `next` delegate. Code before `await next(ctx)` runs on the way in, and code after it runs on the way out, in reverse order. That is why the exception handler goes first: it wraps everything after it, so any exception thrown further down passes back through it.

The usual order is: exception handler, HSTS, HTTPS redirection, static files, routing, CORS, authentication, authorization, your own middleware, then the endpoints. A middleware class is created once (it behaves like a singleton), so inject scoped services into `InvokeAsync` parameters, not into the constructor.

### Common mistakes

- `UseAuthorization` before `UseAuthentication`: the user is never identified, so every protected endpoint returns 401.
- Injecting a scoped service (like `DbContext`) into a middleware constructor. It becomes a captured singleton.
- Writing to the response after `next` has already started sending it. You get "Headers are read-only, response has already started".
- Reading the request body in middleware without `ctx.Request.EnableBuffering()`, so the controller finds an empty body.

### Real-world example

Most production APIs have a correlation-id middleware like the one above. The gateway, the API and the services it calls all log the same id, so support can paste one id from an error screen into Seq or Application Insights and see every log line of that request across all services.

### Try it yourself

1. Write a middleware that logs method, path, status code and elapsed milliseconds for every request.
2. Put it before and after `UseExceptionHandler` and compare what it logs when an action throws.
3. Change it to skip `/health` requests.

## Lesson: [Intermediate|High] Global error handling with ProblemDetails

```csharp
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> log, IProblemDetailsService pd) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            NotFoundException => (404, "Not found"),
            ValidationException => (400, "Validation failed"),
            ConflictException => (409, "Conflict"),
            _ => (500, "Unexpected error")
        };
        if (status == 500) log.LogError(ex, "Unhandled exception");
        ctx.Response.StatusCode = status;
        return await pd.TryWriteAsync(new() { HttpContext = ctx, ProblemDetails = { Status = status, Title = title }, Exception = ex });
    }
}
app.UseExceptionHandler();
app.UseStatusCodePages();
```

**ProblemDetails** (RFC 9457, formerly 7807) is the standard JSON error shape: `type`, `title`, `status`, `detail`, `instance`, plus extensions such as `traceId` and `errors`.

### How it works

`UseExceptionHandler` catches any unhandled exception from the rest of the pipeline. It clears the response and calls your registered `IExceptionHandler`s in order until one returns `true`. `IProblemDetailsService` writes the standard JSON error, and `AddProblemDetails` makes the plain status codes your API returns (400, 404, 409) use the same shape. Clients then need one error parser, not one per endpoint.

### Common mistakes

- `try/catch` in every action. It duplicates code and still misses exceptions thrown in filters and middleware.
- Sending `ex.ToString()` or stack traces to clients in production. That leaks internal details; log them and return a `traceId` instead.
- Using exceptions for normal flow. A missing product is an expected case; return `NotFound()` rather than throwing in a hot path.
- Logging the same exception at every layer. Log it once, in the global handler.

### Real-world example

A customer reports "the app says something went wrong". The error JSON they see includes `"traceId": "00-4bf92f...-01"`. Support searches that id in Application Insights and finds the exact SQL timeout and the line that threw it, without ever showing the stack trace to the customer.

### Try it yourself

1. Add the handler above and make an endpoint throw `NotFoundException`. Check you get a 404 ProblemDetails.
2. Add `traceId` as an extension field: `ProblemDetails.Extensions["traceId"] = Activity.Current?.Id ?? ctx.TraceIdentifier`.
3. Return the stack trace only when `IHostEnvironment.IsDevelopment()` is true.

## Lesson: [Intermediate|High] DTOs, validation and mapping

- Never expose EF entities directly: use **request/response DTOs** (records) to avoid over-posting, circular references and leaking internal fields.
- Validate with data annotations, **FluentValidation**, or .NET 10 Minimal API validation.
- Map with hand-written mapping/extension methods, **Mapperly** (source generator) or AutoMapper (commercial licence since v15, 2025).

```csharp
public record CreateOrderRequest([Required] int CustomerId, [MinLength(1)] List<OrderLineRequest> Lines);
public record OrderDto(int Id, string Customer, decimal Total, string Status);

public static class OrderMapping
{
    public static OrderDto ToDto(this Order o) => new(o.Id, o.Customer.Name, o.Total, o.Status.ToString());
}

public class CreateOrderValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderValidator() { RuleFor(x => x.CustomerId).GreaterThan(0); RuleForEach(x => x.Lines).ChildRules(l => l.RuleFor(x => x.Qty).InclusiveBetween(1, 100)); }
}
```

### How it works

A DTO is the contract you promise clients. Your entities can change (rename a column, add an internal flag) while the DTO stays the same, so clients don't break. Request DTOs also decide which fields a client is allowed to send. If you bind straight to an `Order` entity, a client can post `"status": "Paid"` or `"total": 0` and EF will save it; this is **over-posting**.

Validation should happen at the edge, before your service runs: `[ApiController]` checks data annotations automatically, FluentValidation handles rules that need code or the database, and the service still enforces business rules that depend on state.

### Common mistakes

- One DTO for create, update and read. They need different fields (no `Id` on create, read-only fields on read).
- Mapping with AutoMapper "by convention" and then debugging a field that silently stayed null. Hand-written or source-generated mappings fail at compile time instead.
- Validating only in the browser. Anyone can call the API with curl.
- Mapping after `ToListAsync()`. Project in the query with `Select(...)` so SQL fetches only the columns the DTO needs.

### Real-world example

A HR system's `Employee` entity has `Salary`, `BankAccount` and `NationalId`. The public `/api/employees` endpoint returns `EmployeeSummaryDto(Id, Name, Department)`. Only a payroll endpoint with its own policy returns the sensitive fields. Without DTOs, one careless `return Ok(employee)` would expose everyone's salary.

### Try it yourself

1. Create separate `CreateProductRequest`, `UpdateProductRequest` and `ProductDto` records.
2. Add a FluentValidation rule that the product name is unique (check the database).
3. Rewrite one list query to project with `Select` and compare the generated SQL in the logs.

## Lesson: [Intermediate|High] Paging, filtering, sorting and HATEOAS

```csharp
public record OrderQuery(string? Status, string? Sort = "-createdAt", int Page = 1, int PageSize = 20);

public async Task<PagedResult<OrderDto>> ListAsync(OrderQuery q, CancellationToken ct)
{
    var query = db.Orders.AsNoTracking();
    if (q.Status is not null) query = query.Where(o => o.Status == q.Status);
    query = q.Sort == "-createdAt" ? query.OrderByDescending(o => o.CreatedAt) : query.OrderBy(o => o.CreatedAt);
    var total = await query.CountAsync(ct);
    var items = await query.Skip((q.Page - 1) * q.PageSize).Take(Math.Min(q.PageSize, 100))
                           .Select(o => new OrderDto(o.Id, o.Customer.Name, o.Total, o.Status)).ToListAsync(ct);
    return new(items, total, q.Page, q.PageSize);
}
```

- Cap the page size. For large/realtime data use **keyset (cursor) pagination**: `WHERE Id > @lastId ORDER BY Id`: stable and fast, no deep `OFFSET`.
- **HATEOAS** (hypermedia links in responses) is REST's top maturity level (Richardson Maturity Model level 3); rarely fully used in practice.

### How it works

The query is built step by step as an `IQueryable`, so nothing runs until `CountAsync` and `ToListAsync`. EF turns the chain into one SQL statement with `WHERE`, `ORDER BY` and `OFFSET ... FETCH`. Offset paging is simple, but the database still has to walk past every skipped row, so page 5,000 is much slower than page 1. Keyset paging remembers the last value you saw and asks for rows after it, which uses the index directly.

### Common mistakes

- Paging without a stable `ORDER BY`. SQL Server doesn't promise an order, so rows can repeat or vanish between pages. Add a tie-breaker: `.OrderByDescending(o => o.CreatedAt).ThenBy(o => o.Id)`.
- No maximum page size, so `?pageSize=1000000` loads the whole table.
- Building sort from user input with string concatenation into SQL. Map allowed sort names to expressions instead.
- Running `CountAsync` on huge tables for every request. Consider "has more" instead of an exact total.

### Real-world example

An admin grid of 3 million orders uses offset paging for the first pages people actually click, with the total shown. The "export all" job and the mobile app's infinite scroll use keyset paging (`?after=98231`), which stays equally fast at the end of the table.

### Try it yourself

1. Add `?sort=total` and `?sort=-total` using a dictionary of allowed sort expressions.
2. Implement keyset paging with an `after` cursor and return `nextCursor` in the response.
3. Look at the SQL for page 1 and page 1,000 with offset paging and compare the timings.

# Module: Security

## Lesson: [Intermediate|High] JWT authentication

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = "https://login.microsoftonline.com/<tenant-id>/v2.0";   // or your identity server
        o.Audience = "api://shop-api";
        // for self-issued tokens instead:
        // o.TokenValidationParameters = new() { ValidateIssuer = true, ValidIssuer = "...", ValidateAudience = true,
        //     ValidAudience = "...", ValidateLifetime = true, IssuerSigningKey = new SymmetricSecurityKey(keyBytes), ClockSkew = TimeSpan.FromMinutes(1) };
    });
builder.Services.AddAuthorization(o => o.AddPolicy("orders.write", p => p.RequireClaim("scp", "Orders.Write")));

app.UseAuthentication();
app.UseAuthorization();
```

A **JWT** has three Base64Url parts: `header.payload.signature`. The payload holds claims (`sub`, `iss`, `aud`, `exp`, `iat`, roles/scopes). It is signed, not encrypted: anyone can read it, so never put secrets in it. The server validates signature, issuer, audience and expiry without a DB lookup (stateless).

- **Access token**: short-lived (5–60 min). Refresh token: long-lived, stored securely, rotated on use, revocable server-side.
- OAuth 2.0 flows: **Authorization Code + PKCE** (SPAs, mobile, web), Client Credentials (service-to-service). Implicit and password grants are deprecated.
- OpenID Connect adds identity (ID token) on top of OAuth 2.0.

### How it works

The client signs in at an identity provider (Microsoft Entra ID, Auth0, Keycloak, or your own token endpoint) and receives an access token. It sends it on every call as `Authorization: Bearer <token>`. The JWT bearer handler checks the signature with the issuer's public key (downloaded once from the issuer's metadata and cached), then checks issuer, audience and expiry. If all pass, it builds a `ClaimsPrincipal` and `[Authorize]` and policies decide what the user may do. No database call is needed per request.

Because the token is valid until it expires, you can't "log out" a stolen token instantly. That is why access tokens are short-lived and refresh tokens are revocable.

### Common mistakes

- Storing tokens in `localStorage` in a browser app, where any XSS script can read them. A backend-for-frontend with an HttpOnly cookie is safer.
- Turning off `ValidateAudience` or `ValidateIssuer` "to make it work". Then a token issued for another app is accepted by yours.
- A weak or committed signing key for self-issued tokens. Use at least 256 random bits and keep it in Key Vault or user secrets.
- Forgetting that the default `ClockSkew` is 5 minutes, then wondering why "expired" tokens still work for a while.

### Real-world example

A company's React portal signs users in with Entra ID using Authorization Code + PKCE. The API trusts only tokens with audience `api://shop-api`. Managers get the `Orders.Approve` scope, and the approve endpoint has `RequireAuthorization("orders.approve")`. A nightly billing job uses Client Credentials with its own app identity, so its calls show up separately in the logs.

### Try it yourself

1. Issue a token from a test endpoint with `JsonWebTokenHandler`, then call a protected endpoint with and without it.
2. Paste the token into the [JWT decoder](/tools/jwt-decoder) and find `exp`, `aud` and your custom claim.
3. Add a policy that requires a `department` claim equal to `finance`.

## Lesson: [Intermediate|High] CORS, HTTPS, rate limiting and API keys

```csharp
builder.Services.AddCors(o => o.AddPolicy("spa", p => p.WithOrigins("https://app.example.com")
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
app.UseCors("spa");

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddFixedWindowLimiter("per-client", l => { l.PermitLimit = 100; l.Window = TimeSpan.FromMinutes(1); });
    // also: sliding window, token bucket, concurrency limiters; partition by user/IP with PartitionedRateLimiter
});
app.UseRateLimiter();
app.MapGet("/api/search", Search).RequireRateLimiting("per-client");
```

- **CORS** is a *browser* mechanism: the server tells browsers which other origins may call it (preflight `OPTIONS` for non-simple requests). It is not authentication: non-browser clients ignore it. Never `AllowAnyOrigin` with credentials (not allowed anyway).
- Other protections: HTTPS only, input validation, request size limits, API keys for partner identification (not as the only auth), secrets in Key Vault, security headers.

### How it works

Browsers block JavaScript on `app.example.com` from reading responses from `api.example.com` unless the API says it is allowed. For anything beyond simple requests, the browser first sends a **preflight** `OPTIONS` request asking which origins, methods and headers are allowed. The CORS middleware answers it and adds `Access-Control-Allow-Origin` to real responses. Call `UseCors` after `UseRouting` and before `UseAuthorization`, otherwise preflights get 401.

The rate limiter keeps counters per partition (per user, API key or IP). When a partition runs out of permits, requests get `429` until the window resets. Fixed window is simplest, sliding window smooths bursts at the window edges, token bucket allows short bursts, and concurrency limits how many requests run at the same time.

### Common mistakes

- "Fixing" CORS by allowing everything. CORS doesn't protect your API from curl or Postman, so it can't replace authentication.
- Partitioning rate limits by IP behind a load balancer without forwarded headers. Every client then shares the proxy's IP and one limit.
- Sending API keys in the query string, where they end up in server and proxy logs. Use a header.
- Testing CORS from Postman and concluding it works. Only a browser enforces CORS.

### Real-world example

A public search API allows 100 requests per minute per API key on the free plan and 2,000 on the paid plan, using `PartitionedRateLimiter` keyed by plan. Rejected calls get `429` with `Retry-After`, and the client SDK waits that long before trying again. The company's own web app is the only allowed CORS origin.

### Try it yourself

1. Call your API from a page on another port and read the CORS error in the browser console, then fix it with a named policy.
2. Add a token bucket limiter per user id and test it with a quick loop in PowerShell or bash.
3. Return a `Retry-After` header from `OnRejected`.

# Module: Performance, Versioning and Docs

## Lesson: [Intermediate|High] Caching: response, output, in-memory, distributed, HybridCache

| Cache | Where | Use |
|---|---|---|
| HTTP caching headers (`Cache-Control`, `ETag`) | Client/CDN/proxy | Public GET resources |
| Output caching (.NET 7) | Server memory (or Redis) | Whole responses; tag-based eviction |
| `IMemoryCache` | Process memory | Single instance, fast |
| `IDistributedCache` (Redis, SQL) | Shared | Multiple instances / scale-out |
| `HybridCache` (.NET 9) | L1 memory + L2 distributed | Stampede protection, tags, one API |

```csharp
builder.Services.AddHybridCache();
public class ProductService(HybridCache cache, AppDbContext db)
{
    public ValueTask<ProductDto?> GetAsync(int id, CancellationToken ct) =>
        cache.GetOrCreateAsync($"product:{id}", async token =>
            await db.Products.Where(p => p.Id == id).Select(p => new ProductDto(p.Id, p.Name, p.Price)).FirstOrDefaultAsync(token),
            cancellationToken: ct);
}
```

Cache invalidation strategies: expiration (absolute/sliding), explicit removal on write, tags, versioned keys.

### How it works

Caching trades freshness for speed. Each layer is closer to the user: an HTTP cache at a CDN never reaches your server at all, output caching skips your endpoint, and data caching (`IMemoryCache`, Redis, `HybridCache`) skips the database. With several API instances, an in-memory cache is different on every server, so a write on one server leaves stale data on the others. That is where a distributed cache or HybridCache's L2 comes in.

A **cache stampede** happens when a popular key expires and 500 requests miss at once, all hitting the database. HybridCache lets only one caller rebuild the value while the others wait for it.

### Common mistakes

- Caching per-user data under a shared key, so one customer sees another customer's basket. Put the user or tenant id in the key.
- No expiry and no invalidation, so a price change shows up hours later.
- Expecting output caching to cache authenticated requests. By default it only caches `200` responses to GET or HEAD without auth or cookies.
- Caching EF entities with tracking. Cache plain DTOs.

### Real-world example

A product catalogue API gets 2,000 requests a second for 50,000 products that change a few times a day. Product details live in HybridCache for 10 minutes, and an admin update calls `RemoveAsync($"product:{id}")`. Database load drops by over 95% and the p95 response time goes from about 80 ms to under 5 ms.

### Try it yourself

1. Add output caching to a list endpoint with a tag, and evict the tag when a product is created.
2. Wrap a slow query in `HybridCache.GetOrCreateAsync` and log how often the factory really runs under load.
3. Add `ETag` support to `GET /api/products/{id}` so an unchanged product returns `304`.

## Lesson: [Intermediate|High] API versioning and OpenAPI

```csharp
// Asp.Versioning.Http / Asp.Versioning.Mvc packages
builder.Services.AddApiVersioning(o =>
{
    o.DefaultApiVersion = new ApiVersion(1, 0);
    o.AssumeDefaultVersionWhenUnspecified = true;
    o.ReportApiVersions = true;                         // api-supported-versions header
    o.ApiVersionReader = new UrlSegmentApiVersionReader();
});

[ApiVersion("1.0")][ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/orders")]
public class OrdersController : ControllerBase { [HttpGet, MapToApiVersion("2.0")] public IActionResult GetV2() => Ok(); }

// OpenAPI (.NET 9+ built in)
builder.Services.AddOpenApi();
app.MapOpenApi();                                       // /openapi/v1.json
// UI: Scalar (app.MapScalarApiReference()) or Swashbuckle/NSwag Swagger UI
```

Versioning strategies: **URL segment** (`/v2/orders`: most visible), query string (`?api-version=2.0`), header (`api-version: 2`), media type (`Accept: application/vnd.shop.v2+json`). Only make breaking changes in a new major version; additive changes are non-breaking.

### How it works

The versioning package reads the version from the URL, query string or header, picks the matching action, and adds `api-supported-versions` (and deprecated versions) to responses so clients can see what is coming. Old and new versions run side by side in the same app until the old one is retired.

OpenAPI is a machine-readable description of every endpoint, parameter, response and schema. From .NET 9, `AddOpenApi()` builds it from your endpoints and types at runtime (or at build time). Tools then generate client SDKs, mock servers and documentation pages such as Scalar or Swagger UI from the same file.

### Common mistakes

- Versioning on every small change. Adding a field or an endpoint is not breaking; only removing or changing existing behaviour needs a new version.
- Shipping v2 without a plan to retire v1, so you maintain both forever. Announce a sunset date and mark it deprecated.
- Leaving the OpenAPI document out of date, for example with actions that return `IActionResult` and no `ProducesResponseType`. Generated clients then expect the wrong types.
- Exposing internal admin endpoints in the public OpenAPI document.

### Real-world example

A logistics company has partners on `/api/v1/shipments`. v2 changes `weight` from pounds to a `{ value, unit }` object. Both versions run together for 12 months; v1 responses carry `api-deprecated-versions: 1.0`, and partners regenerate their client from `/openapi/v2.json` when they are ready to move.

### Try it yourself

1. Add `v1` and `v2` of one endpoint where v2 renames a field, and call both.
2. Add `AddOpenApi()` and Scalar, then generate a C# client with NSwag or Kiota.
3. Mark v1 as deprecated and check the response headers.

## Lesson: [Advanced|High] HttpClient correctly: IHttpClientFactory and resilience

```csharp
builder.Services.AddHttpClient<IWeatherClient, WeatherClient>(c =>
{
    c.BaseAddress = new Uri("https://api.weather.example/");
    c.Timeout = TimeSpan.FromSeconds(10);
}).AddStandardResilienceHandler();

public class WeatherClient(HttpClient http) : IWeatherClient
{
    public Task<Forecast?> GetAsync(string city, CancellationToken ct) =>
        http.GetFromJsonAsync<Forecast>($"forecast?city={Uri.EscapeDataString(city)}", ct);
}
```

- `new HttpClient()` per request → **socket exhaustion** (sockets stay in TIME_WAIT). One static `HttpClient` forever → stale DNS.
- `IHttpClientFactory` pools and recycles `HttpMessageHandler`s (default lifetime 2 minutes): solves both. (Alternatively a singleton `HttpClient` with `SocketsHttpHandler.PooledConnectionLifetime`.)

### How it works

`HttpClient` itself is a thin wrapper. The expensive part is the handler underneath, which owns the TCP connections. The factory keeps handlers in a pool and recycles each one after its lifetime (2 minutes by default), so connections are reused but DNS changes are still picked up. Typed clients (`AddHttpClient<IWeatherClient, WeatherClient>`) get a configured `HttpClient` injected and keep all calls to one API in one class.

`AddStandardResilienceHandler()` adds a ready-made pipeline: a rate limiter, a total timeout, retries with exponential backoff and jitter, a circuit breaker and a per-attempt timeout. When the remote API is down, the circuit breaker stops you from sending thousands of doomed requests and lets it recover.

### Common mistakes

- `using var client = new HttpClient()` inside a method that runs on every request. Under load you run out of sockets.
- Retrying `POST` calls that aren't idempotent, so a slow payment call gets charged twice. Use `options.Retry.DisableForUnsafeHttpMethods()` or idempotency keys.
- Relying on the default 100-second `HttpClient.Timeout`. One slow dependency then ties up your threads and makes your own API slow.
- Not passing `CancellationToken`, so calls keep running after the user has left.

### Real-world example

A checkout API calls a tax service, a stock service and a payment provider. Each has its own typed client and timeout. When the tax service starts failing, the circuit breaker opens after a burst of errors and checkout uses a cached tax table for a few minutes instead of hanging. The incident becomes a log warning instead of an outage.

### Try it yourself

1. Create a typed client for a public API (for example a weather or currency API) with a base address and a 5-second timeout.
2. Add `AddStandardResilienceHandler()` and point it at an endpoint that fails half the time; watch the retries in the logs.
3. Disable retries for POST and explain why in a code comment.

## Lesson: [Advanced|Medium] Real-time and RPC: SignalR, gRPC, webhooks

- **SignalR**: server push to clients over WebSockets (fallback: Server-Sent Events, long polling). Hubs, groups, Azure SignalR Service for scale-out. Use for chat, dashboards, notifications.
- **gRPC**: contract-first (`.proto`), HTTP/2, binary Protobuf, streaming (server, client, bidirectional), generated clients. Great for internal service-to-service calls; browsers need gRPC-Web.
- **Webhooks**: your API calls the client's URL when events happen; sign payloads (HMAC), retry with backoff, idempotency.
- **Server-Sent Events**: one-way server → browser streaming over HTTP (.NET 10 adds `TypedResults.ServerSentEvents`).

### How it works

**SignalR** keeps a connection open per client and lets the server call methods on clients (`Clients.Group("orders").SendAsync(...)`). With more than one server, a message sent on server A must reach clients connected to server B, so you need a backplane (Redis) or Azure SignalR Service, and sticky sessions unless clients use WebSockets only.

**gRPC** generates client and server code from a `.proto` file. Messages are small binary Protobuf over HTTP/2, so calls are fast and strongly typed, and both sides break at compile time if the contract changes badly.

**Webhooks** turn polling around: instead of a client asking "anything new?" every minute, you send an HTTP POST to the client's URL when something happens.

### Common mistakes

- Using SignalR to push large data. Push a small "order 42 changed" message and let the client fetch details with a normal GET.
- Exposing gRPC directly to browsers. Browsers can't speak native gRPC; use gRPC-Web or a REST endpoint.
- Webhook receivers that do slow work before answering. Return `200` fast, put the event on a queue and process it in the background.
- Not verifying webhook signatures, so anyone can post fake "payment succeeded" events. Compare HMACs with `CryptographicOperations.FixedTimeEquals`.

### Real-world example

A food delivery app uses all three. Internal services (orders, kitchen, drivers) talk gRPC. The customer app gets live "your driver is 3 minutes away" updates through SignalR. The payment provider calls a webhook when a card payment succeeds, and the API verifies the signature before marking the order as paid.

### Try it yourself

1. Build a SignalR hub that broadcasts a message to a group and a small HTML page that listens.
2. Write a webhook receiver that verifies an `X-Signature` HMAC-SHA256 header.
3. Define a `.proto` with one unary and one server-streaming method and call it from a console client.

## Lesson: [Advanced|High] Microservices basics for API developers

- Each service owns its data (database per service), deploys independently, communicates via HTTP/gRPC (sync) or messaging (async: Azure Service Bus, RabbitMQ, Kafka).
- **API Gateway** (Azure API Management, YARP, Ocelot): routing, auth, rate limiting, aggregation; BFF per client type.
- **Service discovery** (Kubernetes DNS, Aspire service discovery), config centralised, observability via OpenTelemetry traces with correlation IDs.
- **Resilience**: timeouts, retries, circuit breakers; idempotency keys for POSTs; Outbox for reliable events; Saga for distributed transactions.
- Start with a **modular monolith** unless you need independent scaling/deployment: microservices add operational cost.

### How it works

Each service is a separate deployable app with its own database, so teams can release on their own schedule and scale only the busy parts. The price is that every call between services can now fail, be slow or arrive twice. Synchronous calls (HTTP, gRPC) are simple but chain failures together. Messaging (Service Bus, RabbitMQ, Kafka) decouples services in time: the order service publishes `OrderPlaced` and the email and stock services react when they are ready.

The **Outbox** pattern solves "I saved the order but crashed before publishing the event": save the event in the same database transaction as the order, and a background worker publishes it afterwards. A **Saga** replaces a distributed transaction with a series of local steps and compensating actions ("payment failed, so release the reserved stock").

### Common mistakes

- Splitting by technical layer (a "database service", a "validation service") instead of by business capability.
- Several services sharing one database, so a schema change breaks everyone and you have a distributed monolith.
- Long chains of synchronous calls: if each of five services is 99.9% available, the chain is only about 99.5%.
- Starting with microservices for a small team and a new product, then spending most of the time on infrastructure.

### Real-world example

An e-commerce company starts as a modular monolith with clear Orders, Catalog and Payments modules. When Black Friday traffic shows that the Catalog needs 10x the servers of everything else, they move just Catalog into its own service behind YARP, with its own database and a cache. The other modules stay in the monolith for now.

### Try it yourself

1. Draw the services for a cinema booking system and mark which calls are synchronous and which are events.
2. Implement an outbox table and a `BackgroundService` that publishes pending rows to a queue (or just logs them).
3. Write down what should happen, step by step, if payment fails after seats are reserved.

# Interview

## [Beginner|High] What is REST? What are its constraints?

REST is an architectural style for networked APIs (Roy Fielding, 2000). Constraints: client–server separation, **statelessness** (each request carries everything needed, e.g. a token), cacheability, a uniform interface (resources identified by URIs, standard methods, self-descriptive messages, optionally hypermedia), a layered system, and optional code-on-demand. In practice: resource-oriented URLs, HTTP verbs, status codes, and JSON representations.

## [Beginner|High] What is the difference between PUT, POST and PATCH?

**POST** creates a resource (server assigns the ID) or triggers a process; not idempotent; returns 201 + Location. PUT replaces the whole resource at a known URI; idempotent (sending it twice gives the same state). PATCH partially updates (JSON Patch or JSON Merge Patch); not necessarily idempotent. Missing fields in PUT usually mean "set to default/null", in PATCH they mean "leave unchanged".

## [Beginner|High] What is the difference between 401 and 403?

**401 Unauthorized** really means *unauthenticated*: no valid credentials, so the client should log in or refresh its token (the response includes `WWW-Authenticate`). 403 Forbidden means the identity is known but lacks permission, and re-authenticating won't help. In ASP.NET Core, `Challenge()` produces 401 and `Forbid()` produces 403.

## [Beginner|High] What does the `[ApiController]` attribute do?

It enables API conventions: attribute routing is required, invalid `ModelState` automatically returns **400 with ValidationProblemDetails** (no `if (!ModelState.IsValid)` needed), binding sources are inferred (`[FromBody]` for complex types, route/query for simple ones, `IFormFile` from the form), and error status codes get ProblemDetails bodies. Apply it to the class or the whole assembly.

## [Beginner|High] What is middleware? How do you write custom middleware?

Middleware are components in the request pipeline. Each receives `HttpContext`, can do work, call `next` to pass the request on, and do more work on the way back, or short-circuit. Write a class with a constructor taking `RequestDelegate next` and an `InvokeAsync(HttpContext)` method, then register it with `app.UseMiddleware<T>()`; or use inline `app.Use(async (ctx, next) => ...)`. `Run` is terminal; `Map` branches. Order defines behaviour.

## [Beginner|High] What is the difference between `IActionResult` and `ActionResult<T>`?

`IActionResult` can return any result but carries no type information. `ActionResult<T>` (2.1+) lets you return either a `T` (implicitly wrapped in a 200 OK) or any `ActionResult` (`NotFound()`), and lets OpenAPI tools infer the response type. Minimal APIs use `TypedResults` and `Results<Ok<T>, NotFound>` for the same purpose.

## [Intermediate|High] Controllers vs Minimal APIs: which do you choose?

Both are fully supported and equally fast. Controllers suit large APIs with many endpoints, teams familiar with MVC, and heavy use of MVC filters and conventions. Minimal APIs suit microservices and small services; they have less ceremony, route groups, endpoint filters, typed results and **Native AOT** support (controllers aren't AOT-compatible). They can coexist in one app. Organise Minimal APIs with extension methods per feature (`app.MapOrders()`).

## [Intermediate|High] How does JWT authentication work in ASP.NET Core?

The client authenticates with an identity provider (Microsoft Entra ID, Auth0, Duende IdentityServer, or your own login endpoint) and receives a signed JWT access token. It sends `Authorization: Bearer <token>` on each request. The JwtBearer handler validates the signature (via the authority's published keys or a configured key), issuer, audience and expiry, then builds `HttpContext.User` from the claims. `[Authorize]` with roles, scopes or policies decides access. Tokens are stateless, so revocation needs short expiry plus refresh tokens or a deny list.

## [Intermediate|High] What is CORS and why do you get CORS errors?

Browsers enforce the same-origin policy: a page from `https://app.com` can't read responses from `https://api.com` unless the API sends `Access-Control-Allow-Origin` (and related headers). For non-simple requests, the browser first sends a preflight `OPTIONS`. CORS errors mean the server didn't allow that origin, method or header, or `UseCors` is misplaced in the pipeline. Fix server-side with a named policy listing the exact origins. CORS doesn't protect the API from non-browser clients.

## [Intermediate|High] Why should you use IHttpClientFactory?

Creating and disposing `HttpClient` per request leaves sockets in TIME_WAIT and can exhaust ports. A single long-lived static instance doesn't respect DNS changes. `IHttpClientFactory` manages pooled handlers with a rotation lifetime, supports named and typed clients, central configuration, and delegating handlers for logging, auth headers and resilience (`AddStandardResilienceHandler`).

## [Intermediate|High] How do you handle exceptions globally in a Web API?

Use `UseExceptionHandler()` with `IExceptionHandler` implementations (.NET 8+) and `AddProblemDetails()` to return RFC 9457 ProblemDetails JSON. Map known exception types to statuses (NotFound → 404, Validation → 400, Conflict → 409), log unexpected ones as errors with a trace ID, and never return stack traces in production. For expected failures, consider the Result pattern instead of exceptions.

## [Intermediate|High] How do you version an API?

Use the `Asp.Versioning` packages. Strategies: URL segment (`/api/v2/orders`, most common and cache-friendly), query string (`?api-version=2.0`), header (`api-version`), or media type. Keep old versions running for a deprecation period, report supported/deprecated versions in headers, document each version in OpenAPI, and introduce a new major version only for breaking changes (removing or renaming fields, changing types or semantics).

## [Intermediate|Medium] What is content negotiation?

The client states the formats it accepts (`Accept: application/json` or `application/xml`), and the server picks an output formatter that matches. If none matches, it uses the default (JSON) or returns 406 if `ReturnHttpNotAcceptable = true`. Input format is determined by `Content-Type`; an unsupported one gives 415. XML support is added with `AddXmlSerializerFormatters()`.

## [Intermediate|Medium] How do you implement pagination? Offset vs keyset?

Offset: `Skip((page-1)*size).Take(size)` plus a total count. It's simple and allows jumping to any page, but it gets slow for deep pages (the DB still scans skipped rows) and is unstable when data changes. Keyset/cursor: `WHERE (CreatedAt, Id) < (@lastCreatedAt, @lastId) ORDER BY CreatedAt DESC, Id DESC` with `Take(size)` and a `nextCursor` in the response. It's fast and stable, suited to infinite scroll and large tables. Always cap the page size.

## [Intermediate|Medium] What are the rate-limiting algorithms in ASP.NET Core?

Built-in since .NET 7 (`AddRateLimiter`): **Fixed window** (N requests per window; bursty at window edges), Sliding window (window split into segments; smoother), Token bucket (tokens refill at a rate; allows bursts up to bucket size), Concurrency (max simultaneous requests). Partition by user, API key or IP; return 429 with `Retry-After`. For multiple instances, apply limits at the gateway (APIM, Front Door) or use a distributed store.

## [Advanced|High] How do you make a POST endpoint idempotent (e.g. payments)?

Require an `Idempotency-Key` header (a client-generated UUID). On the first request, store the key with request hash, status and response in a table (unique constraint on key + client). Concurrent duplicates hit the constraint and wait or get 409. Later repeats return the stored response instead of re-executing. Expire keys after a period. Combine this with DB unique constraints on business identifiers. Stripe's API popularised the pattern.

## [Advanced|High] How would you secure a public Web API end to end?

HTTPS only with HSTS; OAuth 2.0/OIDC with short-lived JWTs (Authorization Code + PKCE for user clients, client credentials for services); scope/role/policy authorisation plus resource ownership checks (IDOR); input validation and request size limits; parameterised data access; rate limiting and an API gateway/WAF (APIM, Front Door); strict CORS; secrets in Key Vault with managed identities; security headers; dependency scanning; logging and alerting on auth failures; no sensitive data in URLs or logs; and regular penetration tests or OWASP ZAP scans.

## [Advanced|Medium] gRPC vs REST: when do you use gRPC?

gRPC uses HTTP/2 with Protobuf binary serialisation, has contract-first `.proto` definitions with generated strongly typed clients, supports bidirectional streaming, and has lower latency and smaller payloads. Use it for internal microservice-to-microservice communication, streaming or polyglot environments. Use REST/JSON for public APIs and browser clients (gRPC needs gRPC-Web in browsers), and where human readability and HTTP caching matter.

## [Advanced|Medium] How do you test a Web API?

Unit tests for services and handlers with mocked dependencies. **Integration tests** with `WebApplicationFactory<Program>`: spin up the real pipeline in memory, replace infrastructure with Testcontainers SQL Server or a test DB, call endpoints with `HttpClient`, and assert status codes and JSON. Add auth tests (fake JWT or a test auth handler), contract tests (OpenAPI diff, Pact), and load tests (k6, Azure Load Testing) before release.

## [Scenario|High] Your API returns 200 OK with `{ "success": false, "error": "Not found" }` for everything. How would you improve it?

Use proper HTTP semantics. Return 404 for not found, 400/422 with ValidationProblemDetails for invalid input, 409 for conflicts, 401/403 for auth, 201 + Location for creates, 204 for deletes, and 500 ProblemDetails with a traceId for unexpected errors. Clients, proxies, caches and monitoring tools rely on status codes; with 200 for everything, error-rate dashboards and retries break. Roll it out in a new API version so existing clients keep working.

## [Scenario|High] An endpoint that lists orders is slow (3 s) for a customer with 50,000 orders. What do you do?

Profile first (Application Insights, EF logging). Typical fixes: add pagination (keyset for deep lists), project only needed columns with `Select` into DTOs, use `AsNoTracking`, add a covering index on `(CustomerId, CreatedAt DESC) INCLUDE (Total, Status)`, avoid N+1 by not lazy loading, return totals separately or approximately, and cache hot results with HybridCache. If the client needs everything for export, make it an async job (202 Accepted + status URL) that streams a file.

## [Scenario|High] A downstream payment API is slow and occasionally down, and your API threads pile up. How do you protect your service?

Add **timeouts** (per attempt and total), retries with exponential backoff and jitter only for idempotent calls (or with idempotency keys), a circuit breaker to fail fast while it's down, and a bulkhead/concurrency limit so payment calls can't consume all resources. `AddStandardResilienceHandler()` covers most of this. For non-interactive flows, put requests on a queue (Service Bus) and process them asynchronously with status callbacks or webhooks. Return a clear 503/202 to clients and alert on circuit-open events.

## [Scenario|Medium] Mobile clients on an old app version break when you rename a JSON field. How do you avoid this in future?

Treat the API as a contract. Make only **additive** changes in the current version (new optional fields; never rename or remove). Introduce a new version (`/v2`) for breaking changes, and keep v1 alive with a published deprecation timeline (`Deprecation`/`Sunset` headers). Add OpenAPI diff checks in CI to catch breaking changes, and use consumer-driven contract tests. Clients should ignore unknown fields (tolerant reader).

## [Scenario|Medium] After scaling the API to 3 instances, users randomly get logged out and in-memory cache data differs. Why?

The state was per instance: in-memory session or cache, and maybe Data Protection keys (used for cookies and antiforgery) generated per instance. Fix: keep the API stateless (JWT), store session/cache in **Redis** (`IDistributedCache`/HybridCache L2), and persist Data Protection keys to a shared store (Azure Blob + Key Vault, Redis or a DB) with the same application name. Avoid sticky sessions as a crutch.

## [Beginner|Medium] What is Swagger/OpenAPI and how do you add it to an ASP.NET Core API?

OpenAPI is a standard, machine-readable description of an HTTP API (endpoints, parameters, schemas, auth); Swagger is the original name and the tooling around it (Swagger UI to explore and try endpoints). In .NET 9+ use the built-in `builder.Services.AddOpenApi()` + `app.MapOpenApi()` (serves `/openapi/v1.json`) and add a UI such as Scalar or Swagger UI; earlier versions use Swashbuckle (`AddSwaggerGen`, `UseSwagger`, `UseSwaggerUI`) or NSwag. The document also lets you generate typed clients for Angular/React and test tools.

# Cheatsheet

## HTTP methods

| Method | Safe | Idempotent | Typical response |
|---|---|---|---|
| GET | ✓ | ✓ | 200 |
| POST | ✗ | ✗ | 201 + Location |
| PUT | ✗ | ✓ | 200/204 |
| PATCH | ✗ | ✗ | 200/204 |
| DELETE | ✗ | ✓ | 204 |

## Status codes to remember

200 · 201 · 202 · 204 · 304 · 400 · 401 (who are you?) · 403 (not allowed) · 404 · 409 · 412 · 415 · 422 · 429 · 500 · 502 · 503 · 504.

## Pipeline order

```csharp
app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseCors("spa");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseOutputCache();
app.MapControllers();
```

## Minimal API essentials

`MapGet/MapPost/MapPut/MapPatch/MapDelete` · `MapGroup` · `TypedResults` · `Results<Ok<T>, NotFound>` · `[AsParameters]` · `AddEndpointFilter` · `RequireAuthorization` · `RequireRateLimiting` · `WithTags`/`WithName`.

## Security

JWT = header.payload.signature (signed, **not encrypted**) · validate iss/aud/exp/signature · Auth Code + PKCE / Client Credentials · CORS ≠ auth · rate limit · HTTPS/HSTS · Key Vault.

## Caching options

HTTP headers/ETag · Output cache · IMemoryCache · IDistributedCache (Redis) · HybridCache (.NET 9).

## Remember

DTOs not entities · ProblemDetails for errors · `CancellationToken` everywhere · `IHttpClientFactory` · pagination with max size · version before breaking · idempotency keys for payments.
