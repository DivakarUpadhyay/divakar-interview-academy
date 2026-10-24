---
slug: exception-handling
title: Exception Handling & Custom Error Handling in .NET — Every Way, Every App Type
track: dotnet
order: 16
group: Errors, Logging & UI Components
icon: Err
color: #c92a2a
summary: Exceptions from first principles to production — try/catch/finally, filters, rethrowing, custom exception hierarchies, exceptions vs Result pattern, async and parallel exceptions, global handlers (AppDomain, TaskScheduler, Application_Error), every way to handle errors in Web Forms, MVC 5, Web API 2, ASP.NET Core MVC and Web API (middleware, exception filters, IExceptionHandler, ProblemDetails, UseStatusCodePages), Blazor error boundaries, background services, SQL and HTTP error handling, retries with Polly, custom error pages, error codes and correlation ids.
---

# Overview

An **exception** is an object that represents an error and **interrupts normal flow** until some code catches it. Good error handling means:

1. **Prevent** what you can (validate input, check state).
2. **Handle** what you can recover from, close to where it happens (retry, fallback, user message).
3. **Let the rest bubble up** to a **global handler** that logs everything and returns a safe, consistent response.
4. **Never** hide errors (empty catch), leak details (stack traces) to users, or use exceptions for normal control flow.

| Layer | Strategy |
|---|---|
| Method | Guard clauses, `try/catch` only for errors you can handle, `using` for cleanup |
| Service / domain | Throw meaningful (custom) exceptions or return a Result for expected failures |
| Infrastructure | Translate low-level errors (SqlException, HttpRequestException), retry transient faults |
| Application boundary | Global handler: log with correlation id, map to HTTP status / friendly page |
| Process | Last-chance handlers for crashes (log and exit) |

# Versions

| Year | .NET feature |
|---|---|
| 2002 | Structured exception handling in C#/VB.NET; Web Forms `Page_Error`, `Application_Error`, `customErrors` |
| 2009–2013 | MVC `[HandleError]`, `IExceptionFilter`; Web API 2 `IExceptionHandler`, `IExceptionLogger` (2014) |
| 2012 | async/await — exceptions flow through `Task`; `AggregateException` from `Task.Wait` |
| 2015 | C# 6 exception filters (`catch (X ex) when (...)`) |
| 2016 | ASP.NET Core `UseExceptionHandler`, `UseDeveloperExceptionPage`, `UseStatusCodePages` |
| 2018 | `[ApiController]` automatic 400 ProblemDetails (Core 2.1) |
| 2019–2022 | ProblemDetails for errors; `AddProblemDetails` (.NET 7) |
| 2023 | .NET 8 `IExceptionHandler`, throw helpers (`ArgumentNullException.ThrowIfNull`, `ArgumentOutOfRangeException.ThrowIfNegative`) |
| 2024–2025 | .NET 9/10 refinements: `StatusCodeSelector` for exception handler, ProblemDetails improvements; RFC 9457 replaces RFC 7807 |

# Lifecycle

**What happens when an exception is thrown in an ASP.NET Core request:**

1. `throw` creates the exception object and captures the stack trace.
2. The CLR searches up the call stack for a matching `catch` (exception filters `when` are evaluated during this search).
3. If found: `finally` blocks of the frames being unwound run, then the catch block runs.
4. If no catch in your code: the exception propagates out of the controller → MVC exception filters (if any) → middleware pipeline → **exception handler middleware** (`UseExceptionHandler` / `IExceptionHandler`), which logs it and writes an error response (ProblemDetails or error page).
5. If nothing handles it (e.g. in a background thread), `AppDomain.UnhandledException` fires and the **process terminates**.

# Tools

- Debugger: Exception Settings window (break when thrown), Call Stack, `$exception`.
- Logging: `ILogger` + Serilog/NLog → Seq, Application Insights, ELK (see the **Logging** course).
- Error tracking: Sentry, Raygun, Application Insights Failures blade, ELMAH (.NET Framework).
- Resilience: Polly, `Microsoft.Extensions.Http.Resilience`.
- Analyzers: CA1031 (don't catch general exceptions), CA2200 (rethrow to preserve stack), CA1062 (validate arguments).

# Module: Exceptions in C#

## Lesson: [Basic|High] try, catch, finally, filters and rethrowing correctly

```csharp
public async Task<Report> LoadReportAsync(string path, CancellationToken ct)
{
    ArgumentException.ThrowIfNullOrWhiteSpace(path);                    // guard clause (.NET 8)
    FileStream? stream = null;
    try
    {
        stream = File.OpenRead(path);
        return await ReportParser.ParseAsync(stream, ct);
    }
    catch (FileNotFoundException ex)                                   // most specific first
    {
        throw new ReportNotFoundException(path, ex);                    // wrap with context, keep inner exception
    }
    catch (JsonException ex) when (ex.LineNumber is not null)           // exception filter — no unwinding if false
    {
        logger.LogWarning(ex, "Bad report format at line {Line}", ex.LineNumber);
        throw;                                                          // rethrow, keeps original stack trace
    }
    catch (OperationCanceledException) when (ct.IsCancellationRequested)
    {
        throw;                                                          // cancellation is not an error — let it flow
    }
    finally
    {
        stream?.Dispose();                                              // always runs (prefer 'using')
    }
}
```

| Rule | Why |
|---|---|
| Catch specific exceptions | You know how to handle them; others should bubble |
| `throw;` not `throw ex;` | `throw ex` resets the stack trace |
| Wrap with an inner exception | Adds context without losing the cause |
| `using` instead of finally for disposal | Shorter, can't forget |
| Never `catch { }` empty | Hidden failures, impossible debugging |
| Don't catch `Exception` in the middle of the code | Only at boundaries (global handler, background loop) |
| Exceptions are expensive | Don't use them for normal flow (`TryParse`, `TryGetValue`) |

**`ExceptionDispatchInfo.Capture(ex).Throw()`** rethrows an exception captured elsewhere (another thread) while preserving its stack trace.

## Lesson: [Basic|High] Custom exceptions and exception hierarchies

```csharp
// A small hierarchy for the application's expected failures
public abstract class AppException : Exception
{
    protected AppException(string message, Exception? inner = null) : base(message, inner) { }
    public abstract string ErrorCode { get; }
}

public sealed class NotFoundException(string entity, object key)
    : AppException($"{entity} '{key}' was not found.")
{
    public override string ErrorCode => "not_found";
}

public sealed class BusinessRuleException(string message, string code) : AppException(message)
{
    public override string ErrorCode => code;                // e.g. "credit_limit_exceeded"
}

public sealed class ConflictException(string message) : AppException(message)
{
    public override string ErrorCode => "conflict";
}

// Usage in a service
public async Task ApproveAsync(int orderId)
{
    var order = await db.Orders.FindAsync(orderId) ?? throw new NotFoundException("Order", orderId);
    if (order.Total > order.Customer.CreditLimit)
        throw new BusinessRuleException("Order exceeds the customer's credit limit.", "credit_limit_exceeded");
}
```

The global handler maps `NotFoundException` → 404, `BusinessRuleException` → 422/400, `ConflictException` → 409, anything else → 500.

## Lesson: [Intermediate|High] Exceptions vs the Result pattern

| | Exceptions | Result object |
|---|---|---|
| Signal | `throw` | `return Result.Fail("...")` |
| Visible in signature | No | Yes (`Result<Order>`) |
| Cost | Expensive (stack trace) | Cheap |
| Forgetting to handle | Bubbles to global handler | Compiler doesn't force checking unless designed so |
| Good for | Unexpected/exceptional failures, invariants broken | **Expected** outcomes: validation failed, not found, rule violated |

```csharp
public readonly record struct Result<T>(T? Value, string? Error)
{
    public bool IsSuccess => Error is null;
    public static Result<T> Ok(T value) => new(value, null);
    public static Result<T> Fail(string error) => new(default, error);
}

public Result<Order> PlaceOrder(Cart cart)
{
    if (cart.Items.Count == 0) return Result<Order>.Fail("Cart is empty");
    return Result<Order>.Ok(new Order(cart));
}

// Controller maps results to HTTP
var result = service.PlaceOrder(cart);
return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
```

Many teams combine: Result for validation/business outcomes, exceptions for truly exceptional problems (database down, bug).

## Lesson: [Intermediate|High] Exceptions in async, parallel and background code

```csharp
// await rethrows the first inner exception directly
try { await http.GetStringAsync(url); }
catch (HttpRequestException ex) { /* handled */ }

// Task.WhenAll: await throws the FIRST exception; all are in the task's AggregateException
var all = Task.WhenAll(tasks);
try { await all; }
catch { foreach (var ex in all.Exception!.InnerExceptions) logger.LogError(ex, "Task failed"); }

// .Wait() / .Result wrap in AggregateException (and can deadlock) — avoid
// Parallel.ForEach collects exceptions into AggregateException
try { Parallel.ForEach(items, Process); }
catch (AggregateException ae) { ae.Handle(ex => ex is InvalidDataException); }   // handle some, rethrow the rest

// async void: exceptions crash the process (can't be awaited/caught) — only for event handlers
```

**Background services** — an unhandled exception in `ExecuteAsync` stops the host by default (.NET 6+, `BackgroundServiceExceptionBehavior.StopHost`). Wrap each iteration:

```csharp
protected override async Task ExecuteAsync(CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        try { await ProcessBatchAsync(ct); }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
        catch (Exception ex) { logger.LogError(ex, "Batch failed; retrying in 30 s"); }
        await Task.Delay(TimeSpan.FromSeconds(30), ct);
    }
}
```

**Last-chance handlers** (log, then let the process die):

```csharp
AppDomain.CurrentDomain.UnhandledException += (s, e) => Log.Fatal((Exception)e.ExceptionObject, "Unhandled exception");
TaskScheduler.UnobservedTaskException += (s, e) => { Log.Error(e.Exception, "Unobserved task exception"); e.SetObserved(); };
```

# Module: Error Handling by Application Type

## Lesson: [Intermediate|High] ASP.NET Web Forms and MVC 5 (.NET Framework)

**Web Forms** (from local to global):

| Level | How |
|---|---|
| Code | `try/catch` in event handlers |
| Page | `Page_Error` → `Server.GetLastError()`, `Server.ClearError()` |
| Application | `Application_Error` in Global.asax — log everything unhandled |
| Configuration | `<customErrors mode="On|RemoteOnly" defaultRedirect="~/Error.aspx">` + `<httpErrors>` in IIS |
| Tools | ELMAH (logs + viewer at `/elmah.axd`), log4net/NLog |

**MVC 5:**

| Level | How |
|---|---|
| Action | `try/catch` |
| Controller | Override `OnException(ExceptionContext filterContext)` |
| Filter | `[HandleError(ExceptionType = ..., View = "Error")]`, custom `IExceptionFilter`, global via `FilterConfig` |
| Application | `Application_Error` (catches routing 404s and non-MVC errors) |
| Configuration | `customErrors` + `httpErrors` |

**Web API 2:** `ExceptionFilterAttribute` (per controller/action), global `IExceptionHandler` (one place to shape the response) and `IExceptionLogger` (many loggers), `HttpResponseException` / `Request.CreateErrorResponse` for explicit status codes.

```csharp
public class ApiExceptionHandler : ExceptionHandler           // Web API 2
{
    public override void Handle(ExceptionHandlerContext context)
    {
        context.Result = new ResponseMessageResult(context.Request.CreateResponse(HttpStatusCode.InternalServerError,
            new { error = "An unexpected error occurred.", correlationId = context.Request.GetCorrelationId() }));
    }
}
config.Services.Replace(typeof(IExceptionHandler), new ApiExceptionHandler());
```

## Lesson: [Intermediate|High] ASP.NET Core — every way to handle exceptions

**1. Developer exception page** (development only — shows stack traces):

```csharp
if (app.Environment.IsDevelopment()) app.UseDeveloperExceptionPage();   // on by default in Development with WebApplication
```

**2. Exception handler middleware + `IExceptionHandler` (.NET 8+) — the recommended global handler:**

```csharp
builder.Services.AddProblemDetails(o =>
    o.CustomizeProblemDetails = ctx => ctx.ProblemDetails.Extensions["traceId"] = Activity.Current?.Id ?? ctx.HttpContext.TraceIdentifier);
builder.Services.AddExceptionHandler<AppExceptionHandler>();   // can register several; they run in order until one returns true

var app = builder.Build();
app.UseExceptionHandler();        // MVC apps: app.UseExceptionHandler("/Home/Error") for an HTML page
app.UseStatusCodePages();         // ProblemDetails/HTML bodies for empty 4xx/5xx responses (e.g. 404)

public sealed class AppExceptionHandler(ILogger<AppExceptionHandler> logger, IProblemDetailsService problems) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
            BusinessRuleException => (StatusCodes.Status422UnprocessableEntity, "Business rule violated"),
            ConflictException or DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "Conflict"),
            ValidationException => (StatusCodes.Status400BadRequest, "Validation failed"),
            OperationCanceledException => (499, "Client closed request"),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
        };
        if (status >= 500) logger.LogError(ex, "Unhandled exception for {Method} {Path}", http.Request.Method, http.Request.Path);
        else logger.LogWarning("Handled {Exception}: {Message}", ex.GetType().Name, ex.Message);

        http.Response.StatusCode = status;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = http,
            Exception = ex,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = status < 500 ? ex.Message : null,      // never leak internals for 500s
                Extensions = { ["errorCode"] = (ex as AppException)?.ErrorCode }
            }
        });
    }
}
```

**3. Custom middleware** (works on every .NET Core version; same idea):

```csharp
public sealed class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            if (context.Response.HasStarted) throw;                   // can't change a response already being sent
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new { title = "Unexpected error", traceId = context.TraceIdentifier });
        }
    }
}
app.UseMiddleware<ErrorHandlingMiddleware>();                          // register FIRST so it wraps everything
```

**4. MVC exception filters** — only for exceptions thrown inside controllers/actions/filters (not middleware, not routing):

```csharp
public sealed class DomainExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext ctx)
    {
        if (ctx.Exception is BusinessRuleException br)
        {
            ctx.Result = new UnprocessableEntityObjectResult(new ProblemDetails { Title = br.Message, Status = 422 });
            ctx.ExceptionHandled = true;
        }
    }
}
builder.Services.AddControllers(o => o.Filters.Add<DomainExceptionFilter>());
```

**5. Validation errors** — `[ApiController]` automatically returns **400 ValidationProblemDetails** when model binding/validation fails; customise with `ConfigureApiBehaviorOptions(o => o.InvalidModelStateResponseFactory = ...)`.

**6. Status code pages for non-exception errors** — `UseStatusCodePagesWithReExecute("/Error/{0}")` renders a friendly page for 404/403 in MVC apps.

| Mechanism | Catches | Best for |
|---|---|---|
| `UseExceptionHandler` + `IExceptionHandler` | Everything after it in the pipeline | Global, recommended |
| Custom middleware | Everything after it | Older versions, special needs |
| Exception filters | Exceptions in MVC actions/filters | Mapping domain exceptions per controller |
| `try/catch` in action | That action | Expected, local recovery |
| `UseStatusCodePages` | Empty error status responses | Consistent 404/401/403 bodies |
| Developer exception page | Everything (dev) | Debugging only |

## Lesson: [Intermediate|Medium] Blazor, MAUI/WPF/WinForms and console apps

- **Blazor:** `<ErrorBoundary>` around components shows fallback UI when a child component throws; unhandled errors in Blazor Server break the circuit — show the `#blazor-error-ui` and log on the server.

```razor
<ErrorBoundary>
    <ChildContent><OrderGrid /></ChildContent>
    <ErrorContent><p class="alert alert-danger">Couldn't load orders. Please retry.</p></ErrorContent>
</ErrorBoundary>
```

- **WinForms:** `Application.ThreadException` (UI thread) + `Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException)` + `AppDomain.UnhandledException`.
- **WPF:** `Application.DispatcherUnhandledException` (set `e.Handled = true` after logging if safe).
- **Console/worker:** try/catch in `Main` around the host run, log fatal, return a non-zero exit code.

# Module: Infrastructure Errors and Resilience

## Lesson: [Intermediate|High] Handling SQL, HTTP and transient errors (retries with Polly)

**SQL Server errors** — inspect `SqlException.Number`:

| Number | Meaning | Handling |
|---|---|---|
| 2627 / 2601 | Unique constraint / unique index violation | 409 Conflict ("email already registered") |
| 547 | Foreign key / check constraint violation | 400/409 with a clear message |
| 1205 | Deadlock victim | Retry the transaction |
| -2 | Timeout | Retry carefully / optimise query |
| 4060, 18456 | Can't open database / login failed | Configuration problem — alert |
| 40613, 40501, 40197 (Azure SQL) | Transient service errors | Retry with backoff (`EnableRetryOnFailure` in EF Core) |

```csharp
try { await db.SaveChangesAsync(); }
catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2627 or 2601 })
{
    throw new ConflictException("A customer with this email already exists.");
}

// EF Core built-in retry for transient errors
options.UseSqlServer(cs, sql => sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null));
```

**HTTP calls** — `HttpRequestException` (network/DNS/connection), non-success status codes (`EnsureSuccessStatusCode()` throws), `TaskCanceledException` (timeout). Use resilience pipelines:

```csharp
builder.Services.AddHttpClient<PaymentClient>(c => c.BaseAddress = new("https://pay.example.com"))
    .AddStandardResilienceHandler();      // retry with backoff + jitter, circuit breaker, attempt and total timeouts
```

Retry only **transient** and **idempotent** operations; never retry a payment POST without an idempotency key. Combine with a **circuit breaker** so a failing dependency isn't hammered.

## Lesson: [Intermediate|High] Custom error pages, error codes and user-friendly messages

**Principles for what users see:**

- Clear, polite message + what to do next ("We couldn't save your order. Please try again in a minute.").
- A **reference/correlation id** the user can quote to support — the same id is in the logs.
- **No** stack traces, SQL, server names or file paths (information disclosure).
- Correct HTTP status codes (404 page returns 404, not 200).
- Stable **error codes** for APIs (`"errorCode": "credit_limit_exceeded"`) so clients can react without parsing text; localise messages on the client.

**ASP.NET Core MVC error pages:**

```csharp
app.UseExceptionHandler("/Error");                                 // 500s → ErrorController
app.UseStatusCodePagesWithReExecute("/Error/{0}");                 // 404/403 → same controller, original URL kept

public class ErrorController : Controller
{
    [Route("Error/{code:int?}")]
    public IActionResult Index(int? code)
    {
        var feature = HttpContext.Features.Get<IExceptionHandlerPathFeature>();   // original path + exception (log it)
        ViewBag.RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier;
        return code switch { 404 => View("NotFound"), 403 => View("Forbidden"), _ => View("ServerError") };
    }
}
```

**ProblemDetails (RFC 9457) for APIs:**

```json
{
  "type": "https://shop.example.com/errors/credit-limit",
  "title": "Business rule violated",
  "status": 422,
  "detail": "Order exceeds the customer's credit limit.",
  "instance": "/api/orders/1001/approve",
  "errorCode": "credit_limit_exceeded",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
}
```

# Interview

## [Beginner|High] What is the difference between throw and throw ex?

`throw;` rethrows the current exception and preserves the original stack trace. `throw ex;` throws the same object as if it originated at that line, resetting the stack trace and hiding where the error really happened. Use `throw;` or wrap in a new exception with the original as `InnerException`.

## [Beginner|High] What are best practices for exception handling in .NET?

Validate early with guard clauses; catch only specific exceptions you can handle; never swallow exceptions silently; use `using` for cleanup; rethrow with `throw;`; wrap with context and inner exceptions; don't use exceptions for normal flow (`TryParse`); have one global handler at each application boundary that logs with a correlation id and returns safe responses; custom exceptions only when callers handle them specifically.

## [Beginner|High] What does finally do? When doesn't it run?

`finally` runs after the try (and any catch) whether an exception occurred or not — for cleanup. It doesn't run if the process is killed, on `Environment.FailFast`, on a StackOverflowException, or if the thread hangs inside try. `using` statements compile to try/finally.

## [Beginner|High] How do you create a custom exception?

Derive from `Exception` (or your own base like `AppException`), name it `...Exception`, provide constructors for message and inner exception, and add properties with useful data (entity, key, error code). Create one when callers need to distinguish that case (e.g. map to 404 or 409); otherwise use built-in exceptions.

## [Intermediate|High] How do you implement global exception handling in ASP.NET Core?

Use `UseExceptionHandler()` with `AddProblemDetails()` and one or more `IExceptionHandler` implementations (.NET 8+) — or custom middleware registered first in older versions — to log the exception with a trace id and map exception types to status codes (404, 409, 422, 500) with ProblemDetails bodies. Add `UseStatusCodePages` for empty error responses, exception filters for MVC-specific mapping, and the developer exception page only in development.

## [Intermediate|High] Middleware vs exception filter for handling exceptions — which and why?

Exception middleware/handler wraps the whole pipeline, so it catches errors from routing, other middleware, controllers, minimal APIs and views — the right place for global logging and response shaping. Exception filters only see exceptions from MVC actions and filters but have access to MVC context (action, model state) — useful for controller-specific mapping. Typically: a global handler plus optional filters.

## [Intermediate|High] How are errors handled in ASP.NET MVC 5 and Web Forms?

Web Forms: try/catch → `Page_Error` → `Application_Error` in Global.asax → `customErrors`/`httpErrors` in web.config (ELMAH or log frameworks for logging). MVC 5: try/catch → controller `OnException` → `[HandleError]`/custom `IExceptionFilter` (global in FilterConfig) → `Application_Error` (for routing/404 and non-MVC errors) → customErrors/httpErrors. Web API 2 adds `IExceptionHandler`/`IExceptionLogger`.

## [Intermediate|High] Exceptions or Result objects — when to use which?

Use exceptions for unexpected or exceptional conditions (bugs, infrastructure down, broken invariants) — they bubble to a global handler. Use Result objects for expected outcomes that callers must handle (validation failed, not found in a lookup, business rule rejected) — explicit in the signature and cheaper. Mixing them consistently (documented in the team) is common.

## [Intermediate|Medium] How do exceptions behave with async/await and Task.WhenAll?

`await` unwraps and rethrows the task's exception directly (the first one). `Task.WhenAll` faults with all exceptions in `AggregateException`, but `await` rethrows only the first — inspect `task.Exception.InnerExceptions` for all. `.Result`/`.Wait()` wrap in `AggregateException` and risk deadlocks. `async void` exceptions can't be caught by callers and crash the process.

## [Intermediate|Medium] What is ProblemDetails?

A standard JSON format (RFC 9457, previously 7807) for HTTP API errors with `type`, `title`, `status`, `detail`, `instance` and extension fields (e.g. `traceId`, `errorCode`, validation `errors`). ASP.NET Core produces it for validation errors (`[ApiController]`) and, with `AddProblemDetails`, for exceptions and status codes — clients get one consistent error shape.

## [Intermediate|Medium] How do you handle a unique-key violation from SQL Server?

Catch `DbUpdateException` (EF) or `SqlException` with `Number` 2627/2601, translate it to a domain/conflict exception, and return 409 with a friendly message ("email already registered"). Better still, check for duplicates first for a nicer UX, but keep the unique constraint as the real guarantee against race conditions.

## [Advanced|Medium] What happens to an unhandled exception in a background thread or BackgroundService?

An unhandled exception on a thread (not a Task) terminates the process after raising `AppDomain.UnhandledException`. In a `BackgroundService`, an exception escaping `ExecuteAsync` stops the host by default since .NET 6 (configurable with `BackgroundServiceExceptionBehavior`). Unobserved faulted tasks raise `TaskScheduler.UnobservedTaskException` but no longer crash the process. Wrap each unit of work in try/catch, log, and continue or back off.

## [Advanced|Medium] Why should you not catch System.Exception everywhere?

It hides bugs and unexpected states, makes the program continue with corrupted data, catches exceptions you can't handle (OutOfMemory, cancellation) and duplicates logging. Catch `Exception` only at boundaries — global handlers, top of background loops, plug-in hosts — where you log and fail safely.

## [Scenario|High] Users see a yellow error page with SQL details in production. What do you change?

Turn on custom errors (`customErrors mode="On"`/`RemoteOnly` and IIS `httpErrors` in .NET Framework; `UseExceptionHandler` and not the developer page outside Development in Core), make sure `ASPNETCORE_ENVIRONMENT=Production` / `compilation debug="false"`, add a global handler that logs the full exception with a correlation id and shows a friendly page with that id, and review what else leaked (connection strings, versions).

## [Scenario|High] An API returns 500 for "customer not found" and "invalid quantity". How do you improve it?

Distinguish expected failures from bugs: validate input (400 via `[ApiController]`/FluentValidation), throw or return a NotFound result (404), map business rule violations to 409/422 with error codes — all through a global `IExceptionHandler` producing ProblemDetails. Keep 500 for real unexpected errors only, which then become meaningful alerts.

## [Scenario|Medium] Intermittent "deadlock victim" errors appear under load. How do you handle them in code?

They are SQL error 1205 — transient by nature. Retry the whole transaction a few times with backoff (EF Core execution strategy / Polly), keeping the operation idempotent. In parallel fix the cause: consistent access order of tables, shorter transactions, proper indexes, RCSI isolation to reduce reader/writer blocking.

# Cheatsheet

## Rules

Validate early · catch specific · `throw;` · wrap with inner · `using` for cleanup · no empty catch · no exceptions for flow · global handler at boundaries · log once with correlation id · friendly messages, no internals.

## ASP.NET Core

`AddProblemDetails` + `AddExceptionHandler<T>` + `UseExceptionHandler()` · `UseStatusCodePages(WithReExecute)` · exception filters for MVC · `[ApiController]` 400s · developer page only in Development.

## .NET Framework

Web Forms: try/catch → Page_Error → Application_Error → customErrors/httpErrors · MVC 5: OnException → [HandleError]/IExceptionFilter → Application_Error · Web API 2: IExceptionHandler/IExceptionLogger.

## Status mapping

Validation 400 · auth 401/403 · not found 404 · conflict/duplicate/concurrency 409 · business rule 422 · rate limit 429 · bug/unknown 500 · dependency down 502/503 · timeout 504.

## Async & process

`await` rethrows first exception · WhenAll → check InnerExceptions · avoid async void · BackgroundService: try/catch per iteration · AppDomain.UnhandledException / TaskScheduler.UnobservedTaskException for last-chance logging.
