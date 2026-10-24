---
slug: dotnet-platform
title: Modern .NET — Hosting, Configuration, DI & Deployment
track: dotnet
order: 13
group: ASP.NET Core
icon: .N
color: #512bd4
summary: .NET Framework vs .NET Core vs modern .NET, CLR, JIT/AOT, GC, assemblies, NuGet, the generic host, configuration, DI, logging, support lifecycle and deployment models.
---

# Overview

**.NET** is Microsoft's free, open-source, cross-platform developer platform. Today "**.NET**" (5, 6, 7, 8, 9, 10…) means the unified, cross-platform successor of **.NET Core**. The older **.NET Framework** (1.0–4.8.1) is Windows-only and in maintenance mode.

| | .NET Framework | .NET Core / modern .NET |
|---|---|---|
| Platforms | Windows only | Windows, Linux, macOS |
| Open source | Reference source only | Fully open source (github.com/dotnet) |
| Latest | 4.8.1 (2022), maintenance only | .NET 10 (Nov 2025, LTS) |
| Web | ASP.NET (System.Web), Web Forms, MVC 5, Web API 2, WCF server | ASP.NET Core (MVC, Razor Pages, Web API, Minimal APIs, Blazor, SignalR, gRPC) |
| Deployment | Machine-wide install | Side-by-side, self-contained, single-file, containers, Native AOT |
| Performance | Good | Much faster (Span, tiered JIT, PGO) |

Building blocks: **runtime** (CLR, GC, JIT), **libraries** (BCL), **SDK** (compilers, `dotnet` CLI, MSBuild), **ASP.NET Core** and **Windows Desktop** runtimes.

# Versions

| Version | Released | Type | Notes / support end |
|---|---|---|---|
| .NET Framework 1.0 | 2002 | — | First release with C# 1.0 |
| .NET Framework 2.0 / 3.5 | 2005 / 2007 | — | Generics; LINQ, WCF, WPF (3.0) |
| .NET Framework 4.0 → 4.8.1 | 2010 → 2022 | — | TPL, async (4.5); 4.8.1 is the last version, supported with Windows |
| .NET Core 1.0 | Jun 2016 | — | Cross-platform rewrite |
| .NET Core 2.1 / 3.1 | 2018 / 2019 | LTS | 3.1 added WPF/WinForms on Windows; 3.1 ended Dec 2022 |
| .NET 5 | Nov 2020 | STS | "Core" dropped from the name; one .NET |
| .NET 6 | Nov 2021 | LTS | Minimal APIs, hot reload, MAUI (later); ended Nov 2024 |
| .NET 7 | Nov 2022 | STS | Rate limiting, output caching; ended May 2024 |
| .NET 8 | Nov 2023 | LTS | Native AOT for ASP.NET Core, keyed DI, Blazor full-stack; support ends **10 Nov 2026** |
| .NET 9 | Nov 2024 | STS | HybridCache, `Lock` type, OpenAPI built in; STS support was extended to 24 months, so it also ends **10 Nov 2026** |
| .NET 10 | Nov 2025 | **LTS** | C# 14, supported until Nov 2028 |

**Release cadence:** a new major version every **November**. Even numbers are **LTS** (3 years of support); odd numbers are **STS** (24 months since .NET 9; previously 18). Monthly patch releases ("Patch Tuesday").

# Lifecycle

**Application startup lifecycle (generic host / ASP.NET Core):**

1. `Main` / top-level statements run.
2. `WebApplication.CreateBuilder(args)` (or `Host.CreateApplicationBuilder`) creates the host builder: loads **configuration** (appsettings.json → appsettings.{Environment}.json → user secrets in Development → environment variables → command line), sets up **logging** and the **DI container**.
3. You register services: `builder.Services.Add...`.
4. `builder.Build()` builds the service provider and the app.
5. You configure the **middleware pipeline** (`app.Use...`) and endpoints.
6. `app.Run()` starts the host: `IHostedService.StartAsync` for each hosted service, then Kestrel listens.
7. Requests are processed through middleware → endpoint.
8. On shutdown (Ctrl+C / SIGTERM): `IHostApplicationLifetime.ApplicationStopping` fires, hosted services `StopAsync`, the container disposes singletons.

**Build/compile lifecycle:** source → Roslyn → IL assembly (.dll) + metadata + PDB → (publish) → at runtime JIT → native code. With **Native AOT**, IL is compiled to a native executable at publish time (no JIT, fast startup, smaller memory, but no runtime code generation and limited reflection).

**Support lifecycle:** Preview → RC (go-live) → GA (November) → patches → end of support (LTS 3 years, STS 2 years).

# Tools

| Tool | Purpose |
|---|---|
| `dotnet` CLI | `new`, `build`, `run`, `test`, `publish`, `add package`, `tool install`, `--info` |
| Visual Studio 2022/2026, VS Code + C# Dev Kit, Rider | IDEs |
| MSBuild / `.csproj` (SDK-style) | Build system |
| NuGet / nuget.org, Azure Artifacts | Packages and private feeds |
| `global.json` | Pin SDK version |
| `Directory.Build.props`, `Directory.Packages.props` | Shared build settings, central package management |
| dotnet-counters, dotnet-trace, dotnet-dump, dotnet-gcdump | Runtime diagnostics |
| PerfView, Visual Studio profiler | Performance analysis |
| .NET Upgrade Assistant / GitHub Copilot app modernization | Migrate .NET Framework → modern .NET |
| ILSpy, dotPeek | Decompile assemblies |

# Module: Platform Fundamentals

## Lesson: [Basic|High] .NET Framework vs .NET Core vs .NET 5+

- **.NET Framework** (2002–): Windows-only, installed machine-wide, tied to Windows updates. Last version 4.8.1. Still supported for existing apps, but receives no new features. ASP.NET Web Forms, WCF server and Windows Workflow live here.
- **.NET Core** (2016–2019): open source, cross-platform, modular, side-by-side versions, high performance.
- **.NET 5+** (2020–): the unification — one .NET for cloud, web, desktop, mobile (MAUI), games and IoT. Version 4 was skipped to avoid confusion with .NET Framework 4.x.
- **.NET Standard** (2.0, 2.1): a *specification* of APIs shared across implementations; target `netstandard2.0` only when a library must also run on .NET Framework. New libraries target `net8.0`/`net10.0`.

```xml
<!-- SDK-style project -->
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Dapper" Version="2.1.66" />
  </ItemGroup>
</Project>
```

## Lesson: [Basic|High] Assemblies, namespaces, NuGet and project structure

- **Assembly** — the unit of deployment and versioning (`.dll`/`.exe`) containing IL, metadata and a manifest. No GAC in modern .NET (the GAC exists only in .NET Framework).
- **Namespace** — logical grouping of types; one assembly can contain many namespaces and vice versa.
- **NuGet package** (`.nupkg`) — zip with assemblies for one or more target frameworks plus dependencies.
- **Solution** (`.sln` or the newer `.slnx`) contains projects; a project produces one assembly.

```bash
dotnet new sln -n Shop
dotnet new webapi -n Shop.Api
dotnet new classlib -n Shop.Core
dotnet sln add Shop.Api Shop.Core
dotnet add Shop.Api reference Shop.Core
dotnet add Shop.Api package Microsoft.EntityFrameworkCore.SqlServer
```

> **Deep dive:** how the CLR, JIT, memory and the garbage collector work inside is covered in the **.NET Internals: CLR, Memory & GC** course.

# Module: Hosting, Configuration, DI and Logging

## Lesson: [Basic|High] Generic host and Program.cs

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("Db")));
builder.Services.AddHostedService<OutboxPublisher>();      // background worker

var app = builder.Build();
if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

Non-web apps (worker services, console tools) use `Host.CreateApplicationBuilder(args)` and get the same configuration/DI/logging.

```csharp
public class OutboxPublisher(ILogger<OutboxPublisher> log, IServiceScopeFactory scopes) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(10));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            // publish pending messages...
        }
    }
}
```

## Lesson: [Basic|High] Configuration and the Options pattern

Sources, later overrides earlier: `appsettings.json` → `appsettings.{ASPNETCORE_ENVIRONMENT}.json` → User Secrets (Development) → environment variables → command-line args. Also Azure Key Vault and Azure App Configuration providers.

```json
{
  "ConnectionStrings": { "Db": "Server=.;Database=Shop;Trusted_Connection=True;TrustServerCertificate=True" },
  "Smtp": { "Host": "smtp.example.com", "Port": 587 }
}
```

```csharp
var host = builder.Configuration["Smtp:Host"];                   // ':' separates sections
// env var override: Smtp__Host=smtp.prod.example.com              ('__' in environment variables)
builder.Services.AddOptions<SmtpOptions>().BindConfiguration("Smtp").ValidateDataAnnotations().ValidateOnStart();
```

```bash
dotnet user-secrets init
dotnet user-secrets set "Smtp:Password" "local-only-secret"
```

## Lesson: [Intermediate|High] Built-in dependency injection

```csharp
builder.Services.AddTransient<IEmailBuilder, EmailBuilder>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddKeyedScoped<IPaymentGateway, RazorpayGateway>("razorpay");   // .NET 8
builder.Services.TryAddSingleton<ICache, MemoryCacheAdapter>();                   // only if not registered

public class CheckoutController([FromKeyedServices("razorpay")] IPaymentGateway gateway) : ControllerBase { }
```

- Constructor injection preferred; `[FromServices]` for action parameters; `IServiceProvider` only in factories/composition roots (avoid the Service Locator anti-pattern).
- Validation in Development catches scope problems (`ValidateScopes`, `ValidateOnBuild`).
- Third-party containers (Autofac) plug in via `UseServiceProviderFactory` for features like interception/modules.

## Lesson: [Intermediate|Medium] Logging, OpenTelemetry and health checks

```csharp
builder.Logging.ClearProviders().AddConsole();         // providers: Console, Debug, EventLog, Application Insights, Serilog...
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddOtlpExporter())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddRuntimeInstrumentation().AddOtlpExporter());
builder.Services.AddHealthChecks().AddSqlServer(connStr);   // AspNetCore.HealthChecks.SqlServer package
app.MapHealthChecks("/health");
```

Log levels: Trace < Debug < Information < Warning < Error < Critical. Configure per category in `appsettings.json` → `Logging:LogLevel`. **.NET Aspire** (now just "Aspire") gives a dev-time orchestrator and dashboard with OpenTelemetry out of the box.

# Module: Deployment and Performance

## Lesson: [Intermediate|High] Deployment models and hosting

| Model | What ships | When |
|---|---|---|
| Framework-dependent | Your DLLs; runtime installed on server | Smallest output; shared runtime patched by ops |
| Self-contained | Your app + runtime | No runtime install needed; bigger |
| Single-file | One executable | Easy distribution |
| Native AOT | Native binary, no JIT | Fast startup, low memory: serverless, containers, CLIs |
| Container | Docker image (`mcr.microsoft.com/dotnet/aspnet:10.0`) | Kubernetes, Azure Container Apps |

Hosting ASP.NET Core: **Kestrel** (built-in cross-platform web server) behind IIS (in-process via the ASP.NET Core Module, or out-of-process), Nginx/Apache, Azure App Service, containers or YARP. `dotnet publish -c Release` produces the deployable output. .NET SDK can build container images without a Dockerfile: `dotnet publish -t:PublishContainer`.

## Lesson: [Advanced|Medium] Performance features of modern .NET

- `Span<T>`/`Memory<T>`, `ArrayPool<T>`, `stackalloc` — fewer allocations.
- `System.Text.Json` (fast, source-generated) instead of Newtonsoft for new code.
- Tiered compilation + Dynamic PGO, ReadyToRun, Native AOT.
- `ValueTask`, `IAsyncEnumerable`, `System.IO.Pipelines`, `Channel<T>`.
- `FrozenDictionary`/`FrozenSet` (.NET 8) for read-heavy lookups; `SearchValues<T>` for fast searches.
- Output caching, response compression, `HybridCache` (.NET 9).
- Measure with BenchmarkDotNet; profile with dotnet-trace / PerfView before optimising.

## Lesson: [Advanced|High] Migrating from .NET Framework to modern .NET

1. Inventory: target framework, NuGet packages, use of `System.Web`, WCF, Web Forms, AppDomains, Remoting, Windows-only APIs.
2. Upgrade dependencies to versions that support .NET Standard 2.0 / modern .NET.
3. Convert projects to **SDK-style** `.csproj`; move class libraries to `netstandard2.0` or multi-target first.
4. Use **.NET Upgrade Assistant** (or GitHub Copilot app modernization) to automate conversions.
5. ASP.NET MVC/Web API → ASP.NET Core (incrementally with **YARP** reverse proxy + **System.Web adapters** — Strangler Fig).
6. Replace: `web.config` app settings → `appsettings.json` + Options; `HttpContext.Current` → injected `IHttpContextAccessor`; Global.asax → Program.cs middleware; WCF server → gRPC/REST or CoreWCF; EF6 → EF Core (or keep EF6, which runs on .NET Core 3.1+).
7. Test thoroughly, benchmark, deploy side by side, switch traffic gradually.

# Interview

## [Beginner|High] What is the difference between .NET Framework, .NET Core and .NET 5/6/8/10?

.NET Framework is the original Windows-only implementation (last version 4.8.1, maintenance only). .NET Core was a cross-platform, open-source, high-performance rewrite (2016–2019). From .NET 5 (2020) the platform is unified as just ".NET", the successor of .NET Core, with yearly November releases (even = LTS, 3 years; odd = STS, 2 years). New projects should target the current LTS, .NET 10.

## [Beginner|High] What is the CLR and what does it do?

The Common Language Runtime is .NET's execution engine. It loads assemblies, verifies and JIT-compiles IL to native code, manages memory with the garbage collector, enforces type safety, handles exceptions, manages threads and the thread pool, and provides interop with native code. Code running under the CLR is "managed code".

## [Beginner|High] What is JIT compilation? What are ReadyToRun and Native AOT?

JIT (Just-In-Time) compiles IL to machine code at runtime, the first time each method is called. Tiered compilation first produces quick code, then re-optimises hot methods, with Dynamic PGO using live profiling. **ReadyToRun** ships precompiled code inside assemblies to cut startup time, while keeping JIT as a fallback. **Native AOT** compiles the entire app to a native executable at publish time: fastest startup, smallest memory, no JIT. The cost is no dynamic code generation and limited reflection, so it needs trimming-compatible libraries.

## [Beginner|High] What are LTS and STS releases?

LTS (Long-Term Support) releases ship in even-numbered years' November (.NET 6, 8, 10) and get 3 years of free patches. STS (Standard-Term Support) releases are odd-numbered (.NET 7, 9) and get 24 months of support (18 months before .NET 9). Enterprises usually standardise on LTS. Both .NET 8 and .NET 9 reach end of support on 10 November 2026, and .NET 10 is supported until November 2028.

## [Beginner|Medium] What is an assembly? What is the GAC?

An assembly is a compiled unit (`.dll`/`.exe`) containing IL code, type metadata, a manifest (name, version, culture, references) and resources. It is the unit of deployment, versioning and security. The **Global Assembly Cache** was a machine-wide store for strongly named shared assemblies in .NET Framework. Modern .NET has no GAC: each app carries its dependencies, or uses the shared framework installed side by side.

## [Beginner|Medium] What is .NET Standard? Do I still need it?

.NET Standard is a formal specification of APIs available on all .NET implementations (2.0 is the widely used version; 2.1 is not supported by .NET Framework). Target `netstandard2.0` only if a library must also be consumed by .NET Framework apps. Otherwise target modern TFMs like `net8.0`/`net10.0`, or multi-target `<TargetFrameworks>net48;net8.0</TargetFrameworks>`.

## [Intermediate|High] Explain the order of configuration sources in ASP.NET Core.

Default for `WebApplication.CreateBuilder`: `appsettings.json` → `appsettings.{Environment}.json` → User Secrets (Development only) → environment variables → command-line arguments. Later sources override earlier ones, so env vars in production override JSON files. Hierarchical keys use `:` in code (`Smtp:Host`) and `__` in environment variables (`Smtp__Host`). Production secrets belong in Azure Key Vault or the hosting platform's secret store, not in JSON.

## [Intermediate|High] What is the difference between IOptions, IOptionsSnapshot and IOptionsMonitor?

`IOptions<T>` is a singleton that reads values once at first use and never reloads. `IOptionsSnapshot<T>` is scoped and recomputed per request, so it picks up config file changes between requests; it can't be injected into singletons. `IOptionsMonitor<T>` is a singleton that always returns the current value via `CurrentValue` and offers `OnChange` callbacks; use it in singletons and background services.

## [Intermediate|High] What is a BackgroundService / IHostedService?

`IHostedService` has `StartAsync`/`StopAsync`, called by the host at startup and shutdown. `BackgroundService` is a base class where you implement `ExecuteAsync(CancellationToken)` for long-running loops: queue consumers, schedulers, outbox publishers. It's registered as a singleton via `AddHostedService<T>()`, so create DI scopes for scoped services. Honour the stopping token for graceful shutdown. For complex schedules, use Quartz.NET or Hangfire.

## [Intermediate|Medium] What is Kestrel? Do you still need IIS?

Kestrel is ASP.NET Core's built-in, cross-platform, high-performance web server. It can face the internet directly. A reverse proxy (IIS, Nginx, Azure Front Door, YARP) is still often used for TLS termination, port sharing, load balancing and static file caching. On Windows, IIS hosts ASP.NET Core through the ASP.NET Core Module, **in-process** (default, fastest) or out-of-process (proxying to Kestrel).

## [Intermediate|Medium] Framework-dependent vs self-contained deployment?

Framework-dependent: small output, but requires the matching .NET runtime on the server. Ops can patch the runtime centrally. Self-contained: includes the runtime for a specific RID (e.g. `linux-x64`), so nothing needs installing, but the output is bigger and you must republish to get runtime patches. Containers make this mostly moot: the base image provides the runtime.

## [Advanced|High] How does the .NET garbage collector work? Workstation vs Server GC?

It's a generational, mark-and-compact (tracing) collector. It marks objects reachable from roots, then sweeps or compacts Gen 0/1/2; the LOH holds objects of 85,000 bytes or more and is collected with Gen 2. Collections are triggered by allocation budgets. **Workstation GC** uses one heap, tuned for responsiveness on client apps. **Server GC** uses a heap and GC thread per core for throughput and is the ASP.NET Core default; DATAS in .NET 9+ adapts the heap count dynamically. **Background GC** collects Gen 2 concurrently while Gen 0/1 collections continue.

## [Advanced|Medium] What are the limitations of Native AOT?

No runtime code generation (`Reflection.Emit`, some dynamic proxies), limited reflection (trimming removes unused code, so you need source generators or annotations), no dynamic assembly loading, and a platform-specific build per OS/architecture. Some libraries are incompatible: classic EF Core full model building has AOT limitations, MVC controllers are not supported (Minimal APIs are). It's best for microservices, serverless functions and CLI tools where startup time and memory matter.

## [Advanced|Medium] How would you migrate a large ASP.NET MVC 5 app on .NET Framework 4.8 to .NET 10?

Incrementally, with the **Strangler Fig** pattern. Put a new ASP.NET Core app with **YARP** in front, which proxies unknown routes to the old app. Use **System.Web adapters** to share session/auth. Move class libraries to `netstandard2.0`/multi-target first, then migrate controllers and views route by route, replacing `System.Web` dependencies, `HttpContext.Current`, `web.config` settings and Global.asax with modern equivalents. Use the Upgrade Assistant for mechanical changes. EF6 can stay initially (it runs on modern .NET) and move to EF Core later. Ship each slice to production behind the proxy.

## [Scenario|High] Your ASP.NET Core API on .NET 8 must keep getting security patches after November 2026. What do you do and when?

.NET 8 reaches end of support on 10 November 2026, after which there are no security fixes. Plan the upgrade to **.NET 10 (LTS, supported to Nov 2028)** well before then. Bump the TargetFramework, update Microsoft.* and EF Core packages to 10.x, read the breaking-changes docs, run the full test suite, fix analyzer warnings, update the Docker base images (`aspnet:10.0`) and CI SDK versions (`global.json`, the `UseDotNet` task), deploy to staging, run load tests, then roll out. Budget time for third-party packages that lag behind.

## [Scenario|High] An API's CPU is fine but requests queue up and latency spikes under load. Thread count keeps growing. What's happening?

That points to **thread-pool starvation**: synchronous blocking (`.Result`, `.Wait()`, sync I/O, `Thread.Sleep`) inside request handling. Each blocked thread waits on I/O, the pool injects new threads slowly (about one or two per second), and requests queue. Confirm with `dotnet-counters` (ThreadPool Queue Length and Thread Count rising) and `dotnet-stack`/a dump showing blocked threads. Fix by going async end to end, using async DB/HTTP APIs, and removing sync-over-async.

## [Scenario|Medium] Configuration works locally but in Azure App Service the app uses the wrong connection string. How do you debug it?

Check `ASPNETCORE_ENVIRONMENT` on the App Service (it decides which appsettings.{env}.json loads). App Service **Connection strings** and **App settings** become environment variables and override JSON. Check the key names (`ConnectionStrings__Db`, or the connection-strings section with the right type). Check slot settings after a swap and Key Vault references resolving (managed identity permissions). Log the configuration *source* (never the secret value) at startup, or use `builder.Configuration.GetDebugView()` locally.

# Cheatsheet

## Versions and support

| Version | Type | Support ends |
|---|---|---|
| .NET Framework 4.8.1 | Legacy | With Windows (no new features) |
| .NET 6 | LTS | Nov 2024 (ended) |
| .NET 7 | STS | May 2024 (ended) |
| .NET 8 | LTS | 10 Nov 2026 |
| .NET 9 | STS | 10 Nov 2026 |
| .NET 10 | LTS | Nov 2028 |

New major every November · even = LTS (3 yrs) · odd = STS (2 yrs).

## Runtime terms

CLR (runtime) · IL (intermediate code) · JIT (runtime compile) · tiered compilation + Dynamic PGO · R2R (precompiled) · Native AOT · CTS/CLS · BCL · GC Gen 0/1/2 + LOH (≥ 85 KB) + POH · Workstation vs Server GC.

## dotnet CLI

```bash
dotnet --info / --list-sdks
dotnet new webapi -n Api
dotnet add package Serilog.AspNetCore
dotnet build -c Release
dotnet test --collect:"XPlat Code Coverage"
dotnet publish -c Release -r linux-x64 --self-contained
dotnet publish -t:PublishContainer
dotnet user-secrets set "Key" "Value"
dotnet tool install -g dotnet-ef
```

## Configuration order (last wins)

appsettings.json → appsettings.{Env}.json → user secrets (Dev) → env vars (`A__B`) → command line.

## Options

`IOptions` (singleton, once) · `IOptionsSnapshot` (scoped, per request) · `IOptionsMonitor` (singleton, live + OnChange).

## DI lifetimes

Transient · Scoped (per request) · Singleton · Keyed (.NET 8) · no scoped-in-singleton.
