---
slug: logging
title: Logging & Custom Logging in .NET — ILogger, Serilog, NLog, log4net and Your Own Logger
track: dotnet
order: 17
group: Errors, Logging & UI Components
icon: Log
color: #0b7285
summary: Why and what to log, log levels, structured vs plain-text logging, Microsoft.Extensions.Logging (ILogger, providers, categories, filtering, scopes, high-performance LoggerMessage source generators), Serilog (sinks, enrichers, request logging), NLog and log4net (including .NET Framework apps), Trace and Windows Event Log, writing a custom logger provider (file and database), audit logging, correlation ids and distributed tracing with OpenTelemetry and Application Insights, log storage and querying (Seq, ELK, Azure Monitor/KQL), security (PII, secrets) and performance.
---

# Overview

**Logging** records what an application does so you can understand behaviour, diagnose problems and audit actions — especially in production where you can't attach a debugger.

| Signal | Answers | Example tools |
|---|---|---|
| **Logs** | What happened, in detail? | ILogger, Serilog, NLog, log4net |
| **Metrics** | How many / how fast / how often? | `System.Diagnostics.Metrics`, Prometheus, App Insights |
| **Traces** | Where did time go across services for one request? | `Activity`, OpenTelemetry, Jaeger, App Insights |
| **Audit trail** | Who did what to which data, when? | Dedicated audit tables/log store |

Together logs, metrics and traces are called **observability**.

# Versions

| Year | Milestone |
|---|---|
| 2001–2004 | log4net (Apache port of log4j); `System.Diagnostics.Trace`/`EventLog` in .NET Framework |
| 2006 | NLog 1.0 |
| 2009 | ELMAH (error logging for ASP.NET Web Forms/MVC) |
| 2013 | Serilog — structured logging for .NET |
| 2016 | `Microsoft.Extensions.Logging` (`ILogger<T>`) with ASP.NET Core 1.0 |
| 2019–2021 | `LoggerMessage.Define`; .NET 6 **logging source generator** (`[LoggerMessage]`) |
| 2021–2023 | OpenTelemetry .NET 1.0 (tracing 2021, metrics 2022, logs 2023) |
| 2024–2025 | .NET 8/9 log redaction/enrichment (`Microsoft.Extensions.Telemetry`), .NET Aspire dashboard with OpenTelemetry logs |

# Lifecycle

**Life of a log event:**

1. Code calls `logger.LogWarning("Payment {PaymentId} retry {Attempt}", id, attempt)`.
2. The logger checks if the level is **enabled** for this category (cheap check — nothing else happens if not).
3. A log entry is created: timestamp, level, category, message template, **named properties** (PaymentId, Attempt), exception, scope data (RequestId, TraceId, user).
4. Each registered **provider/sink** receives it: console, file, Seq, Application Insights, database…
5. Sinks often **buffer and batch** asynchronously, then write/send.
6. Logs are **stored** with a retention period, **queried** (search by property, KQL), turned into **alerts** and dashboards.

# Tools

- **Frameworks:** Microsoft.Extensions.Logging, Serilog (+ Serilog.AspNetCore, sinks), NLog (+ NLog.Web.AspNetCore), log4net, ELMAH (.NET Framework).
- **Stores/viewers:** Seq, Elasticsearch + Kibana (ELK/Elastic Stack), Grafana Loki, Azure Monitor / Application Insights (KQL), Datadog, Splunk, Windows Event Viewer.
- **Tracing:** OpenTelemetry SDK + exporters (OTLP), .NET Aspire dashboard, Jaeger, Zipkin.
- **CLI:** `dotnet-trace`, `dotnet-counters`, `dotnet-monitor`.

# Module: Logging Fundamentals

## Lesson: [Basic|High] What to log, log levels and structured logging

| Level | Use for | Example |
|---|---|---|
| **Trace** | Very detailed internals; may contain sensitive data — off in production | "Entering CalculateTax with 3 lines" |
| **Debug** | Developer diagnostics | "Cache miss for product 42" |
| **Information** | Normal significant events | "Order 1001 placed by customer 42 (₹4,500)" |
| **Warning** | Unexpected but handled; might need attention | "Payment gateway slow (3.2 s), retrying" |
| **Error** | A failure of the current operation | "Failed to save order 1001" + exception |
| **Critical** | The app or a major part is down | "Cannot connect to database — shutting down" |

**What to log:** application start/stop and configuration summary, incoming requests (method, path, status, duration), important business events, external calls (target, duration, result), handled failures (warning) and unhandled exceptions (error, with stack trace), security events (logins, permission denied).

**What NOT to log:** passwords, tokens, full card numbers, secrets, connection strings, personal data beyond what's necessary (GDPR/DPDP), huge payloads.

**Structured logging** — log a *message template* with named properties instead of a pre-built string:

```csharp
// ❌ String interpolation — one opaque string, can't query by OrderId, allocates even if the level is disabled
logger.LogInformation($"Order {order.Id} placed by {customer.Id} total {order.Total}");

// ✅ Message template — properties are stored separately and searchable
logger.LogInformation("Order {OrderId} placed by {CustomerId} total {Total}", order.Id, customer.Id, order.Total);
```

In Seq/App Insights you can then query `OrderId = 1001` or `Total > 10000` across millions of entries.

## Lesson: [Basic|High] Microsoft.Extensions.Logging — ILogger, providers and configuration

```csharp
public class OrderService(ILogger<OrderService> logger)      // category = full class name
{
    public async Task PlaceAsync(Order order)
    {
        logger.LogInformation("Placing order {OrderId} with {LineCount} lines", order.Id, order.Lines.Count);
        try
        {
            await repository.SaveAsync(order);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to save order {OrderId}", order.Id);   // exception first parameter
            throw;
        }
    }
}
```

**Providers** (where logs go): Console, Debug, EventSource, EventLog (Windows), Azure App Service, Application Insights, OpenTelemetry — plus third-party (Serilog, NLog) plugged in as providers.

```csharp
var builder = WebApplication.CreateBuilder(args);    // adds Console, Debug, EventSource (+ EventLog on Windows) by default
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddJsonConsole();                    // structured JSON to stdout — ideal for containers
```

**Filtering by category and level** (`appsettings.json`):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning",
      "Divakar.Shop.Payments": "Debug"
    },
    "Console": { "LogLevel": { "Default": "Warning" } }
  }
}
```

The most specific category prefix wins; provider-specific sections override the general one; `appsettings.Development.json` usually turns on Debug.

## Lesson: [Intermediate|High] Scopes, correlation ids and high-performance logging

**Scopes** attach properties to every log written inside a block:

```csharp
using (logger.BeginScope(new Dictionary<string, object> { ["OrderId"] = order.Id, ["CustomerId"] = order.CustomerId }))
{
    logger.LogInformation("Validating");     // includes OrderId and CustomerId
    logger.LogInformation("Charging");       // same
}
```

ASP.NET Core automatically adds `RequestId`, `RequestPath`, `TraceId`, `SpanId` scopes (when the provider includes scopes, e.g. `"IncludeScopes": true` for console).

**Correlation id** — one id that follows a request through UI → API → other services → logs:

```csharp
app.Use(async (ctx, next) =>
{
    var id = ctx.Request.Headers["X-Correlation-ID"].FirstOrDefault() ?? Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString();
    ctx.Response.Headers["X-Correlation-ID"] = id;
    using (ctx.RequestServices.GetRequiredService<ILogger<Program>>().BeginScope(new Dictionary<string, object> { ["CorrelationId"] = id }))
        await next();
});
```

With OpenTelemetry/W3C trace context, the **TraceId** already plays this role across services automatically.

**High-performance logging — the source generator (.NET 6+):**

```csharp
public static partial class Log
{
    [LoggerMessage(EventId = 1001, Level = LogLevel.Information, Message = "Order {OrderId} placed for {Total}")]
    public static partial void OrderPlaced(ILogger logger, int orderId, decimal total);

    [LoggerMessage(EventId = 5001, Level = LogLevel.Error, Message = "Payment failed for order {OrderId}")]
    public static partial void PaymentFailed(ILogger logger, Exception ex, int orderId);
}

Log.OrderPlaced(logger, order.Id, order.Total);   // no boxing, no template parsing at runtime, level checked first
```

Also: `if (logger.IsEnabled(LogLevel.Debug))` before expensive message construction; avoid logging in tight loops; let sinks batch asynchronously.

# Module: Logging Libraries

## Lesson: [Intermediate|High] Serilog — sinks, enrichers and request logging

```csharp
// dotnet add package Serilog.AspNetCore Serilog.Sinks.Seq Serilog.Sinks.File
using Serilog;

Log.Logger = new LoggerConfiguration()                 // bootstrap logger to capture startup errors
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Services.AddSerilog((services, cfg) => cfg
        .ReadFrom.Configuration(builder.Configuration)  // levels/sinks from appsettings "Serilog" section
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "Shop.Api")
        .WriteTo.Console()
        .WriteTo.File("logs/shop-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14)
        .WriteTo.Seq("http://localhost:5341"));

    var app = builder.Build();
    app.UseSerilogRequestLogging();                    // one summary event per request: method, path, status, elapsed
    app.MapControllers();
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();                               // flush buffered sinks
}
```

```json
"Serilog": {
  "MinimumLevel": { "Default": "Information", "Override": { "Microsoft.AspNetCore": "Warning" } }
}
```

Concepts: **sinks** (Console, File, Seq, Elasticsearch, Application Insights, SQL Server via `Serilog.Sinks.MSSqlServer`), **enrichers** (machine name, thread id, environment, user), **destructuring** (`{@Order}` logs the object's properties; `{$Order}` its ToString), `LogContext.PushProperty("TenantId", id)`.

## Lesson: [Intermediate|Medium] NLog and log4net (including .NET Framework apps)

**NLog** — configuration-driven (`nlog.config`), many targets, layouts:

```xml
<nlog xmlns="http://www.nlog-project.org/schemas/NLog.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <targets async="true">
    <target xsi:type="File" name="file" fileName="logs/${shortdate}.log"
            layout="${longdate}|${level:uppercase=true}|${logger}|${message} ${exception:format=tostring}" />
    <target xsi:type="Database" name="db" connectionString="${configsetting:ConnectionStrings.Logs}"
            commandText="INSERT INTO dbo.Logs (Logged, Level, Logger, Message, Exception) VALUES (@t, @l, @lg, @m, @e)">
      <parameter name="@t" layout="${date}" /><parameter name="@l" layout="${level}" />
      <parameter name="@lg" layout="${logger}" /><parameter name="@m" layout="${message}" /><parameter name="@e" layout="${exception:tostring}" />
    </target>
  </targets>
  <rules>
    <logger name="Microsoft.*" maxlevel="Info" final="true" />   <!-- drop noisy framework info -->
    <logger name="*" minlevel="Info" writeTo="file,db" />
  </rules>
</nlog>
```

```csharp
builder.Logging.ClearProviders();
builder.Host.UseNLog();                     // NLog.Web.AspNetCore — ILogger<T> calls now go to NLog
```

**log4net** — common in .NET Framework (Web Forms/MVC 5/WCF) code:

```xml
<log4net>
  <appender name="RollingFile" type="log4net.Appender.RollingFileAppender">
    <file value="App_Data\Logs\app.log" /><appendToFile value="true" />
    <rollingStyle value="Date" /><datePattern value="yyyyMMdd" />
    <layout type="log4net.Layout.PatternLayout"><conversionPattern value="%date [%thread] %-5level %logger - %message%newline%exception" /></layout>
  </appender>
  <root><level value="INFO" /><appender-ref ref="RollingFile" /></root>
</log4net>
```

```csharp
// Global.asax Application_Start: log4net.Config.XmlConfigurator.Configure();
private static readonly ILog Log = LogManager.GetLogger(typeof(ProductsController));
Log.Info("Products page loaded");
Log.Error("Save failed", ex);
```

**Built-in .NET Framework options:** `System.Diagnostics.Trace` with listeners in web.config, `EventLog.WriteEntry` (Windows Event Viewer — needs a registered source), ASP.NET **health monitoring**, **ELMAH** (automatic unhandled-error logging with a web viewer `/elmah.axd` — protect it!).

| | Serilog | NLog | log4net | MS ILogger only |
|---|---|---|---|---|
| Structured logging | Native, best | Good | Limited | Yes (depends on provider) |
| Config | Code or JSON | XML/JSON | XML | JSON |
| Typical use | Modern .NET | Modern + Framework | Legacy Framework | Simple apps, with OpenTelemetry/App Insights |

# Module: Custom and Production Logging

## Lesson: [Advanced|High] Writing a custom logger provider (file and database)

You implement `ILoggerProvider` (creates loggers per category) and `ILogger` (writes entries). Keep writes **non-blocking**: queue entries and write them on a background task.

```csharp
public sealed class DbLoggerProvider : ILoggerProvider
{
    private readonly Channel<LogRow> _queue = Channel.CreateBounded<LogRow>(new BoundedChannelOptions(10_000) { FullMode = BoundedChannelFullMode.DropOldest });
    private readonly Task _writer;
    private readonly string _connectionString;
    private readonly LogLevel _minLevel;

    public DbLoggerProvider(string connectionString, LogLevel minLevel)
    {
        _connectionString = connectionString;
        _minLevel = minLevel;
        _writer = Task.Run(WriteLoopAsync);
    }

    public ILogger CreateLogger(string categoryName) => new DbLogger(categoryName, this);

    internal bool IsEnabled(LogLevel level) => level >= _minLevel && level != LogLevel.None;
    internal void Enqueue(LogRow row) => _queue.Writer.TryWrite(row);

    private async Task WriteLoopAsync()
    {
        var batch = new List<LogRow>(100);
        await foreach (var row in _queue.Reader.ReadAllAsync())
        {
            batch.Add(row);
            if (batch.Count < 100 && _queue.Reader.Count > 0) continue;   // gather a batch
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.ExecuteAsync("INSERT INTO dbo.AppLogs (Utc, Level, Category, Message, Exception, TraceId) " +
                                        "VALUES (@Utc, @Level, @Category, @Message, @Exception, @TraceId)", batch);   // Dapper
            }
            catch { /* never let logging crash the app; optionally fall back to a file */ }
            batch.Clear();
        }
    }

    public void Dispose() { _queue.Writer.TryComplete(); _writer.Wait(TimeSpan.FromSeconds(5)); }
}

internal sealed class DbLogger(string category, DbLoggerProvider provider) : ILogger
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => provider.IsEnabled(logLevel);
    public void Log<TState>(LogLevel level, EventId id, TState state, Exception? ex, Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(level)) return;
        provider.Enqueue(new LogRow(DateTime.UtcNow, level.ToString(), category, formatter(state, ex), ex?.ToString(), Activity.Current?.TraceId.ToString()));
    }
}

public sealed record LogRow(DateTime Utc, string Level, string Category, string Message, string? Exception, string? TraceId);

// Registration
builder.Logging.AddProvider(new DbLoggerProvider(builder.Configuration.GetConnectionString("Logs")!, LogLevel.Warning));
```

```sql
CREATE TABLE dbo.AppLogs (
  Id BIGINT IDENTITY PRIMARY KEY, Utc DATETIME2 NOT NULL, Level VARCHAR(20) NOT NULL, Category NVARCHAR(256) NOT NULL,
  Message NVARCHAR(MAX) NOT NULL, Exception NVARCHAR(MAX) NULL, TraceId VARCHAR(64) NULL);
CREATE INDEX IX_AppLogs_Utc ON dbo.AppLogs(Utc) INCLUDE (Level);
```

Considerations: bounded queue (don't run out of memory if the DB is down), batching, retention job (delete/archive old rows), separate database from business data, never log inside the logger (infinite recursion). In most cases prefer an existing sink (Serilog MSSqlServer, NLog Database target) — but interviewers like to see you can build one.

## Lesson: [Intermediate|High] Audit logging vs diagnostic logging

| | Diagnostic logs | Audit logs |
|---|---|---|
| Purpose | Troubleshooting, monitoring | Compliance, security, accountability |
| Content | Technical events, errors, timings | Who, what, when, where, before/after values |
| Retention | Days–weeks | Years (regulation-driven) |
| Integrity | Best effort; may sample/drop | Must be complete, tamper-evident |
| Storage | Log platforms | Database tables / immutable storage |

```csharp
// EF Core SaveChanges interceptor writing audit rows for changed entities
public sealed class AuditInterceptor(ICurrentUser user) : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData e, InterceptionResult<int> result, CancellationToken ct = default)
    {
        var db = e.Context!;
        var audits = db.ChangeTracker.Entries()
            .Where(x => x.State is EntityState.Added or EntityState.Modified or EntityState.Deleted && x.Entity is not AuditEntry)
            .Select(x => new AuditEntry
            {
                Table = x.Metadata.GetTableName()!, Action = x.State.ToString(), User = user.Name, Utc = DateTime.UtcNow,
                Changes = JsonSerializer.Serialize(x.Properties.Where(p => p.IsModified || x.State != EntityState.Modified)
                            .ToDictionary(p => p.Metadata.Name, p => new { Old = p.OriginalValue, New = p.CurrentValue }))
            }).ToList();
        db.Set<AuditEntry>().AddRange(audits);
        return base.SavingChangesAsync(e, result, ct);
    }
}
```

SQL Server alternatives: **temporal tables** (automatic row history), **SQL Server Audit**, Change Data Capture.

## Lesson: [Intermediate|High] OpenTelemetry, Application Insights and querying logs in production

```csharp
builder.Logging.AddOpenTelemetry(o => { o.IncludeFormattedMessage = true; o.IncludeScopes = true; });
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("Shop.Api"))
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddSqlClientInstrumentation())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddRuntimeInstrumentation())
    .UseOtlpExporter();          // to the Aspire dashboard, Jaeger, Grafana, or Azure Monitor (UseAzureMonitor())
```

Logs written inside a request automatically carry its **TraceId/SpanId**, so you can jump from an error log to the full distributed trace.

**Querying (Application Insights / Azure Monitor KQL):**

```kusto
traces
| where timestamp > ago(1h) and severityLevel >= 3
| where customDimensions.OrderId == "1001"
| project timestamp, message, operation_Id

exceptions
| where timestamp > ago(24h)
| summarize count() by type, outerMessage
| order by count_ desc
```

**Production practices:**

- Log to **stdout as JSON** in containers; let the platform ship logs.
- Central log store with **retention policies** and access control.
- **Alerts** on error rates and critical events, not on every single error.
- **Sampling** for high-volume debug/trace data; never sample audit logs.
- **Redact** sensitive values (`Microsoft.Extensions.Compliance.Redaction`, Serilog destructuring policies).
- Change levels at runtime without redeploy (configuration reload, App Configuration, Serilog `LoggingLevelSwitch`).

# Interview

## [Beginner|High] What are the log levels in .NET and when do you use each?

Trace (very detailed internals, off in production), Debug (developer diagnostics), Information (normal business events: order placed, user logged in), Warning (unexpected but handled: retry, slow dependency), Error (an operation failed — with the exception), Critical (system-wide failure needing immediate attention). Configure the minimum level per category so production logs stay useful and affordable.

## [Beginner|High] What is structured logging and why is it better than string logs?

Logging a message template with named properties (`"Order {OrderId} placed", id`) so each property is stored as a separate field. You can search, filter and aggregate by `OrderId` or `Total` across millions of entries, build dashboards and alerts, and the logger avoids formatting work when the level is disabled. Interpolated strings lose that structure.

## [Beginner|High] How does logging work in ASP.NET Core?

Through `Microsoft.Extensions.Logging`: inject `ILogger<T>` (category = class name), call `LogInformation/LogError` etc. Providers (Console, Debug, EventLog, Application Insights, OpenTelemetry, Serilog/NLog) write the entries; `appsettings.json` "Logging" section filters by category and level; scopes add contextual properties like RequestId and TraceId.

## [Beginner|Medium] What should never be logged?

Passwords, tokens/API keys, connection strings, full card numbers/CVV, secrets, and personal data beyond what's needed (Aadhaar/PAN, health data, full addresses) — logs are widely accessible and kept long. Mask or redact, log identifiers instead of content, and review log output in code reviews.

## [Intermediate|High] Serilog vs NLog vs log4net vs built-in ILogger?

ILogger is the abstraction your code depends on; the others are implementations plugged in as providers. Serilog: structured logging first, rich sinks and enrichers, code or JSON configuration — the popular choice for modern .NET. NLog: mature, XML/JSON config, many targets, good performance, works in Framework and Core. log4net: older, XML-configured, common in legacy .NET Framework apps, limited structured support. Built-in providers + OpenTelemetry/App Insights are enough for many cloud apps.

## [Intermediate|High] How do you correlate logs across multiple services?

Use a correlation/trace id generated at the edge and propagated in headers (W3C `traceparent` automatically via `Activity`/OpenTelemetry, or `X-Correlation-ID`), include it in every log (scope/enricher), return it to clients in error responses, and send logs from all services to one store where you can filter by that id or open the distributed trace.

## [Intermediate|High] How would you write a custom logger in .NET?

Implement `ILoggerProvider` (creates `ILogger` instances per category and holds shared resources) and `ILogger` (`IsEnabled`, `Log`, `BeginScope`), register it with `builder.Logging.AddProvider(...)`. Make writing asynchronous and batched through a bounded queue (Channel) so logging never blocks requests, handle sink failures without throwing, and dispose/flush on shutdown.

## [Intermediate|Medium] What are logging scopes?

A way to attach contextual properties to all log entries written within a block (`using (logger.BeginScope(...))`) — e.g. OrderId, TenantId, CorrelationId. ASP.NET Core adds request scopes automatically. Providers must support scopes (Serilog's `Enrich.FromLogContext`, console `IncludeScopes`).

## [Intermediate|Medium] What is the difference between audit logging and application logging?

Application (diagnostic) logs help developers and operators troubleshoot — technical, short retention, can be sampled. Audit logs record who did what to which data and when (often with before/after values) for compliance and security — complete, tamper-evident, long retention, stored separately (audit tables, temporal tables, SQL Server Audit, immutable storage).

## [Advanced|Medium] How do you make logging fast and avoid performance problems?

Use message templates (no interpolation), check `IsEnabled` before expensive work, use the `[LoggerMessage]` source generator for hot paths, avoid logging large objects or inside tight loops, set sensible minimum levels per category, use asynchronous/batching sinks, and sample high-volume diagnostic data.

## [Advanced|Medium] How did you log errors in .NET Framework Web Forms/MVC apps?

Typically log4net or NLog configured in web.config/separate config, initialised in `Application_Start`; unhandled errors captured in `Application_Error` (and MVC exception filters) and logged with the request URL and user; ELMAH for automatic error capture with a protected viewer; Windows Event Log for critical service events; health monitoring in older apps.

## [Intermediate|Medium] How do you change log levels in production without redeploying?

Keep levels in configuration (`appsettings.json`, environment variables, Azure App Configuration) with `reloadOnChange` so `ILogger` filters update live; Serilog supports `LoggingLevelSwitch` controlled from configuration or an admin endpoint; NLog reloads `nlog.config` automatically (`autoReload="true"`). Raise the level only for the affected category and lower it again afterwards.

## [Beginner|Medium] What is the difference between Console.WriteLine/Debug.WriteLine and a logging framework?

`Console.WriteLine` writes plain text to stdout with no levels, categories, structure or filtering; `Debug.WriteLine` only works in debug builds with a debugger listener. A logging framework adds levels, categories, structured properties, scopes, multiple outputs (files, Seq, App Insights), filtering by configuration, async batching and correlation with traces — essential for production.

## [Scenario|High] Production has an intermittent bug you can't reproduce. How do you use logging to find it?

Check existing logs around the failure times (filter by error, user, trace id); if insufficient, add targeted structured logs (inputs, decisions, external call results) at Information/Debug for that category, temporarily raise its level via configuration without redeploying, correlate with traces and metrics (load, dependency latency), and look for patterns (specific tenant, data, time, server). Remove or lower the extra logging afterwards.

## [Scenario|Medium] Logging costs on the cloud are exploding. What do you change?

Measure which categories produce the most volume; raise minimum levels for noisy framework categories (EF commands, ASP.NET routing) and Debug/Trace in production; replace per-item logs in loops with summaries; sample high-volume telemetry; shorten retention for diagnostic logs (keep audit logs separately); use metrics instead of logs for counts; drop duplicate logging of the same exception at multiple layers.

## [Scenario|Medium] The app writes logs to a database, and when the database is slow, requests become slow too. Fix it.

Logging is synchronous on the request path. Make it asynchronous with a bounded in-memory queue and a background writer that batches inserts; drop or spill to a local file when the queue is full; use a separate logging database or, better, a dedicated log platform (Seq/App Insights/ELK); never let logging failures throw into business code.

# Cheatsheet

## Levels

Trace < Debug < Information < Warning < Error < Critical · production default Information, framework categories Warning.

## Do

Message templates with named properties · `LogError(ex, ...)` with the exception · scopes/enrichers for context · correlation/trace ids · JSON to stdout in containers · central store + retention + alerts.

## Don't

Interpolate log messages · log secrets/PII · log the same exception at every layer · log inside tight loops · block requests on log writes.

## Libraries

ILogger (abstraction) · Serilog (structured, sinks, enrichers, `UseSerilogRequestLogging`) · NLog (`nlog.config` targets/rules) · log4net (legacy XML appenders) · ELMAH (Framework errors) · OpenTelemetry (logs + traces + metrics).

## Custom logger

`ILoggerProvider` + `ILogger` · bounded Channel queue · background batch writer · never throw · flush on Dispose · `builder.Logging.AddProvider(...)`.
