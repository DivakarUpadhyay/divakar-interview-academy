---
slug: aspnet-core-webapi
title: ASP.NET Core Web API & REST
track: dotnet
order: 3
icon: API
color: #1971c2
summary: REST principles, controllers vs Minimal APIs, middleware, status codes, validation and ProblemDetails, JWT authentication, versioning, OpenAPI, caching, rate limiting, CORS, gRPC/SignalR and microservices basics.
---

# Overview

**ASP.NET Core Web API** builds HTTP services that return data (usually JSON) for SPAs (React/Angular/Vue), mobile apps and other services. Two programming models:

- **Controller-based APIs** — `[ApiController]` classes with actions (feature-rich: filters, model binding conventions).
- **Minimal APIs** (.NET 6+) — lambda endpoints mapped in `Program.cs` (`app.MapGet(...)`), less ceremony, AOT-friendly.

Related technologies: **gRPC** (high-performance HTTP/2 + Protobuf RPC), **SignalR** (real-time WebSockets), **GraphQL** (Hot Chocolate), **YARP** (reverse proxy/API gateway).

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

**Idempotent** methods give the same result if repeated: GET, PUT, DELETE, HEAD, OPTIONS. **Safe** methods don't change state: GET, HEAD, OPTIONS. POST is neither; PATCH is not guaranteed idempotent.

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

- Cap the page size. For large/realtime data use **keyset (cursor) pagination**: `WHERE Id > @lastId ORDER BY Id` — stable and fast, no deep `OFFSET`.
- **HATEOAS** (hypermedia links in responses) is REST's top maturity level (Richardson Maturity Model level 3); rarely fully used in practice.

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

A **JWT** has three Base64Url parts: `header.payload.signature`. The payload holds **claims** (`sub`, `iss`, `aud`, `exp`, `iat`, roles/scopes). It is **signed, not encrypted** — anyone can read it, so never put secrets in it. The server validates signature, issuer, audience and expiry without a DB lookup (stateless).

- **Access token**: short-lived (5–60 min). **Refresh token**: long-lived, stored securely, rotated on use, revocable server-side.
- OAuth 2.0 flows: **Authorization Code + PKCE** (SPAs, mobile, web), **Client Credentials** (service-to-service). Implicit and password grants are deprecated.
- OpenID Connect adds identity (ID token) on top of OAuth 2.0.

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

- **CORS** is a *browser* mechanism: the server tells browsers which other origins may call it (preflight `OPTIONS` for non-simple requests). It is not authentication — non-browser clients ignore it. Never `AllowAnyOrigin` with credentials (not allowed anyway).
- Other protections: HTTPS only, input validation, request size limits, API keys for partner identification (not as the only auth), secrets in Key Vault, security headers.

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

Versioning strategies: **URL segment** (`/v2/orders` — most visible), **query string** (`?api-version=2.0`), **header** (`api-version: 2`), **media type** (`Accept: application/vnd.shop.v2+json`). Only make breaking changes in a new major version; additive changes are non-breaking.

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

- `new HttpClient()` per request → **socket exhaustion** (sockets stay in TIME_WAIT). One static `HttpClient` forever → **stale DNS**.
- `IHttpClientFactory` pools and recycles `HttpMessageHandler`s (default lifetime 2 minutes) — solves both. (Alternatively a singleton `HttpClient` with `SocketsHttpHandler.PooledConnectionLifetime`.)

## Lesson: [Advanced|Medium] Real-time and RPC: SignalR, gRPC, webhooks

- **SignalR** — server push to clients over WebSockets (fallback: Server-Sent Events, long polling). Hubs, groups, Azure SignalR Service for scale-out. Use for chat, dashboards, notifications.
- **gRPC** — contract-first (`.proto`), HTTP/2, binary Protobuf, streaming (server, client, bidirectional), generated clients. Great for internal service-to-service calls; browsers need gRPC-Web.
- **Webhooks** — your API calls the client's URL when events happen; sign payloads (HMAC), retry with backoff, idempotency.
- **Server-Sent Events** — one-way server → browser streaming over HTTP (.NET 10 adds `TypedResults.ServerSentEvents`).

## Lesson: [Advanced|High] Microservices basics for API developers

- Each service owns its data (database per service), deploys independently, communicates via HTTP/gRPC (sync) or messaging (async: Azure Service Bus, RabbitMQ, Kafka).
- **API Gateway** (Azure API Management, YARP, Ocelot): routing, auth, rate limiting, aggregation; **BFF** per client type.
- **Service discovery** (Kubernetes DNS, Aspire service discovery), **config** centralised, **observability** via OpenTelemetry traces with correlation IDs.
- **Resilience**: timeouts, retries, circuit breakers; **idempotency keys** for POSTs; **Outbox** for reliable events; **Saga** for distributed transactions.
- Start with a **modular monolith** unless you need independent scaling/deployment — microservices add operational cost.

# Interview

## [Beginner|High] What is REST? What are its constraints?

REST is an architectural style for networked APIs (Roy Fielding, 2000). Constraints: client–server separation, **statelessness** (each request carries everything needed, e.g. a token), cacheability, a **uniform interface** (resources identified by URIs, standard methods, self-descriptive messages, optionally hypermedia), a layered system, and optional code-on-demand. In practice: resource-oriented URLs, HTTP verbs, status codes, and JSON representations.

## [Beginner|High] What is the difference between PUT, POST and PATCH?

**POST** creates a resource (server assigns the ID) or triggers a process; not idempotent; returns 201 + Location. **PUT** replaces the whole resource at a known URI; idempotent (sending it twice gives the same state). **PATCH** partially updates (JSON Patch or JSON Merge Patch); not necessarily idempotent. Missing fields in PUT usually mean "set to default/null", in PATCH they mean "leave unchanged".

## [Beginner|High] What is the difference between 401 and 403?

**401 Unauthorized** really means *unauthenticated*: no valid credentials, so the client should log in or refresh its token (the response includes `WWW-Authenticate`). **403 Forbidden** means the identity is known but lacks permission, and re-authenticating won't help. In ASP.NET Core, `Challenge()` produces 401 and `Forbid()` produces 403.

## [Beginner|High] What does the `[ApiController]` attribute do?

It enables API conventions: attribute routing is required, invalid `ModelState` automatically returns **400 with ValidationProblemDetails** (no `if (!ModelState.IsValid)` needed), binding sources are inferred (`[FromBody]` for complex types, route/query for simple ones, `IFormFile` from the form), and error status codes get ProblemDetails bodies. Apply it to the class or the whole assembly.

## [Beginner|High] What is middleware? How do you write custom middleware?

Middleware are components in the request pipeline. Each receives `HttpContext`, can do work, call `next` to pass the request on, and do more work on the way back, or short-circuit. Write a class with a constructor taking `RequestDelegate next` and an `InvokeAsync(HttpContext)` method, then register it with `app.UseMiddleware<T>()`; or use inline `app.Use(async (ctx, next) => ...)`. `Run` is terminal; `Map` branches. Order defines behaviour.

## [Beginner|High] What is the difference between `IActionResult` and `ActionResult<T>`?

`IActionResult` can return any result but carries no type information. `ActionResult<T>` (2.1+) lets you return either a `T` (implicitly wrapped in a 200 OK) or any `ActionResult` (`NotFound()`), and lets OpenAPI tools infer the response type. Minimal APIs use `TypedResults` and `Results<Ok<T>, NotFound>` for the same purpose.

## [Intermediate|High] Controllers vs Minimal APIs — which do you choose?

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

Built-in since .NET 7 (`AddRateLimiter`): **Fixed window** (N requests per window; bursty at window edges), **Sliding window** (window split into segments; smoother), **Token bucket** (tokens refill at a rate; allows bursts up to bucket size), **Concurrency** (max simultaneous requests). Partition by user, API key or IP; return 429 with `Retry-After`. For multiple instances, apply limits at the gateway (APIM, Front Door) or use a distributed store.

## [Advanced|High] How do you make a POST endpoint idempotent (e.g. payments)?

Require an `Idempotency-Key` header (a client-generated UUID). On the first request, store the key with request hash, status and response in a table (unique constraint on key + client). Concurrent duplicates hit the constraint and wait or get 409. Later repeats return the stored response instead of re-executing. Expire keys after a period. Combine this with DB unique constraints on business identifiers. Stripe's API popularised the pattern.

## [Advanced|High] How would you secure a public Web API end to end?

HTTPS only with HSTS; OAuth 2.0/OIDC with short-lived JWTs (Authorization Code + PKCE for user clients, client credentials for services); scope/role/policy authorisation plus resource ownership checks (IDOR); input validation and request size limits; parameterised data access; rate limiting and an API gateway/WAF (APIM, Front Door); strict CORS; secrets in Key Vault with managed identities; security headers; dependency scanning; logging and alerting on auth failures; no sensitive data in URLs or logs; and regular penetration tests or OWASP ZAP scans.

## [Advanced|Medium] gRPC vs REST — when do you use gRPC?

gRPC uses HTTP/2 with Protobuf binary serialisation, has contract-first `.proto` definitions with generated strongly typed clients, supports bidirectional streaming, and has lower latency and smaller payloads. Use it for internal microservice-to-microservice communication, streaming or polyglot environments. Use REST/JSON for public APIs and browser clients (gRPC needs gRPC-Web in browsers), and where human readability and HTTP caching matter.

## [Advanced|Medium] How do you test a Web API?

Unit tests for services and handlers with mocked dependencies. **Integration tests** with `WebApplicationFactory<Program>`: spin up the real pipeline in memory, replace infrastructure with Testcontainers SQL Server or a test DB, call endpoints with `HttpClient`, and assert status codes and JSON. Add auth tests (fake JWT or a test auth handler), contract tests (OpenAPI diff, Pact), and load tests (k6, Azure Load Testing) before release.

## [Scenario|High] Your API returns 200 OK with `{ "success": false, "error": "Not found" }` for everything. How would you improve it?

Use proper HTTP semantics. Return 404 for not found, 400/422 with ValidationProblemDetails for invalid input, 409 for conflicts, 401/403 for auth, 201 + Location for creates, 204 for deletes, and 500 ProblemDetails with a traceId for unexpected errors. Clients, proxies, caches and monitoring tools rely on status codes; with 200 for everything, error-rate dashboards and retries break. Roll it out in a new API version so existing clients keep working.

## [Scenario|High] An endpoint that lists orders is slow (3 s) for a customer with 50,000 orders. What do you do?

Profile first (Application Insights, EF logging). Typical fixes: add pagination (keyset for deep lists), project only needed columns with `Select` into DTOs, use `AsNoTracking`, add a covering index on `(CustomerId, CreatedAt DESC) INCLUDE (Total, Status)`, avoid N+1 by not lazy loading, return totals separately or approximately, and cache hot results with HybridCache. If the client needs everything for export, make it an async job (202 Accepted + status URL) that streams a file.

## [Scenario|High] A downstream payment API is slow and occasionally down, and your API threads pile up. How do you protect your service?

Add **timeouts** (per attempt and total), **retries** with exponential backoff and jitter only for idempotent calls (or with idempotency keys), a **circuit breaker** to fail fast while it's down, and a **bulkhead/concurrency limit** so payment calls can't consume all resources. `AddStandardResilienceHandler()` covers most of this. For non-interactive flows, put requests on a queue (Service Bus) and process them asynchronously with status callbacks or webhooks. Return a clear 503/202 to clients and alert on circuit-open events.

## [Scenario|Medium] Mobile clients on an old app version break when you rename a JSON field. How do you avoid this in future?

Treat the API as a contract. Make only **additive** changes in the current version (new optional fields; never rename or remove). Introduce a new version (`/v2`) for breaking changes, and keep v1 alive with a published deprecation timeline (`Deprecation`/`Sunset` headers). Add OpenAPI diff checks in CI to catch breaking changes, and use consumer-driven contract tests. Clients should ignore unknown fields (tolerant reader).

## [Scenario|Medium] After scaling the API to 3 instances, users randomly get logged out and in-memory cache data differs. Why?

The state was per instance: in-memory session or cache, and maybe Data Protection keys (used for cookies and antiforgery) generated per instance. Fix: keep the API stateless (JWT), store session/cache in **Redis** (`IDistributedCache`/HybridCache L2), and persist **Data Protection keys** to a shared store (Azure Blob + Key Vault, Redis or a DB) with the same application name. Avoid sticky sessions as a crutch.

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
