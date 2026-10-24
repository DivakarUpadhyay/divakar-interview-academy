---
slug: aspnet-core-mvc
title: ASP.NET Core MVC (and Razor Pages)
track: dotnet
order: 14
group: ASP.NET Core
icon: MVC
color: #6741d9
summary: The MVC pattern, request lifecycle, routing, controllers, model binding and validation, Razor views, layouts, tag helpers, view components, filters, state management, Identity and security.
---

# Overview

**ASP.NET Core MVC** is a framework for building server-rendered web apps using the **Model–View–Controller** pattern on top of the ASP.NET Core pipeline.

- **Model** — data and business rules (entities, view models, validation).
- **View** — the UI, written in **Razor** (`.cshtml` — HTML + C#).
- **Controller** — handles the request, calls services, picks a view or result.

The same framework also offers **Razor Pages** (page-focused: each `.cshtml` has a `PageModel`), **Web API** controllers (JSON, no views — next course) and **Blazor** (component-based UI in C#).

Interview focus areas: request lifecycle, routing, model binding/validation, filters, `ViewData`/`ViewBag`/`TempData`, partial views vs view components, tag helpers, authentication/authorisation, antiforgery.

# Versions

| Version | Year | Highlights |
|---|---|---|
| ASP.NET MVC 1–5 | 2009–2013 | On .NET Framework / System.Web; MVC 5 + Web API 2 were separate frameworks |
| ASP.NET Core 1.0 | 2016 | Rewrite: cross-platform, Kestrel, built-in DI; MVC and Web API unified |
| ASP.NET Core 2.0 | 2017 | **Razor Pages**, `Microsoft.AspNetCore.All` metapackage |
| ASP.NET Core 2.1 / 2.2 | 2018 | `[ApiController]`, HTTPS by default, GDPR features, SignalR, Identity UI as Razor Class Library |
| ASP.NET Core 3.0 / 3.1 | 2019 | **Endpoint routing**, Blazor Server, generic host, System.Text.Json |
| ASP.NET Core 5 / 6 | 2020 / 2021 | Minimal hosting model (`WebApplication`), Minimal APIs, hot reload |
| ASP.NET Core 7 | 2022 | Rate limiting, output caching middleware |
| ASP.NET Core 8 | 2023 | Blazor Web App (static SSR + interactivity), Identity API endpoints, keyed DI, AOT for minimal APIs |
| ASP.NET Core 9 | 2024 | `MapStaticAssets` (fingerprinted, compressed static files), built-in OpenAPI, HybridCache |
| ASP.NET Core 10 | 2025 | Ships with .NET 10 (LTS): validation for Minimal APIs, OpenAPI 3.1, passkey support in Identity, Blazor improvements |

# Lifecycle

**MVC request lifecycle (in order):**

1. **Request arrives** at Kestrel (possibly via IIS/Nginx).
2. **Middleware pipeline** runs in registration order: exception handler → HSTS/HTTPS redirection → static files → **routing** → CORS → **authentication** → **authorization** → session → endpoints.
3. **Endpoint routing** matches the URL to a controller action (conventional or attribute routes).
4. **Controller creation** — the controller factory creates the controller via DI.
5. **Filter pipeline** begins: **authorization filters** → **resource filters** (before) → **model binding** → **model validation** → **action filters** (OnActionExecuting).
6. **Action method executes** and returns an `IActionResult` (`View()`, `RedirectToAction()`, `Json()`, ...).
7. **Action filters** (OnActionExecuted) → **result filters** (OnResultExecuting).
8. **Result execution** — for `ViewResult`, the **view engine** finds the `.cshtml`, runs `_ViewStart`, layout, view, partials/view components, and writes HTML.
9. **Result filters** (OnResultExecuted) → resource filters (after).
10. **Exception filters** handle unhandled exceptions from controller/action stages.
11. Response flows back out through middleware to the client.

**Razor view lifecycle:** `_ViewImports.cshtml` (usings, tag helpers) → `_ViewStart.cshtml` (sets `Layout`) → view body renders → `@RenderBody()` in the layout → `@RenderSection("Scripts", required: false)`.

# Tools

- **Visual Studio** — MVC templates, scaffolding (controllers + views from a model), Razor IntelliSense, Browser Link, Hot Reload.
- **`dotnet new mvc`**, **`dotnet new webapp`** (Razor Pages), `dotnet aspnet-codegenerator` (scaffolding CLI).
- **LibMan / npm** — client libraries (Bootstrap, jQuery validation).
- **ASP.NET Core Identity** + scaffolded Identity UI.
- **Browser DevTools**, **Fiddler**, **Postman** — inspect requests.
- **Glimpse-style diagnostics**: `app.UseDeveloperExceptionPage()` (default in Development), logging.

# Module: MVC Basics

## Lesson: [Basic|High] Project and folder structure — every folder and file explained

`dotnet new mvc -n MyShop.Web` (or Visual Studio → "ASP.NET Core Web App (Model-View-Controller)") creates:

```text
MyShop.Web/
├── Connected Services/               (VS only) service references
├── Dependencies/                     (VS only) view of NuGet packages, frameworks, analyzers
├── Properties/
│   └── launchSettings.json           local run profiles: URLs/ports, environment (ASPNETCORE_ENVIRONMENT=Development) — NOT used in production
├── wwwroot/                          the web root: the ONLY folder served as static files
│   ├── css/site.css
│   ├── js/site.js
│   ├── lib/                          client libraries (bootstrap, jquery, jquery-validation)
│   └── favicon.ico
├── Controllers/
│   └── HomeController.cs             classes ending in "Controller", deriving from Controller
├── Models/
│   └── ErrorViewModel.cs             view models / DTOs (domain entities usually live in other projects)
├── Views/
│   ├── _ViewImports.cshtml           @using namespaces + @addTagHelper for ALL views in this folder and below
│   ├── _ViewStart.cshtml             code run before every view — normally sets Layout = "_Layout"
│   ├── Home/                         one folder per controller
│   │   ├── Index.cshtml              view for HomeController.Index()
│   │   └── Privacy.cshtml
│   └── Shared/                       views searched by every controller
│       ├── _Layout.cshtml            master layout (<html>, <head>, nav, @RenderBody(), footer)
│       ├── _Layout.cshtml.css        CSS isolation for the layout (scoped CSS)
│       ├── _ValidationScriptsPartial.cshtml   jquery validation scripts partial
│       └── Error.cshtml              error page used by UseExceptionHandler("/Home/Error")
├── appsettings.json                  configuration for all environments (logging, connection strings, options)
├── appsettings.Development.json      overrides for Development (merged on top)
├── Program.cs                        app entry point: builds the host, registers services (DI), defines the middleware pipeline and routes
└── MyShop.Web.csproj                 SDK-style project: <Project Sdk="Microsoft.NET.Sdk.Web">, target framework, package references
```

Folders that real projects usually add:

```text
├── Areas/Admin/Controllers, Views, ...   feature sections with their own controllers/views ([Area("Admin")])
├── ViewComponents/                       reusable widgets with logic (CartSummaryViewComponent.cs)
│   └── (views in Views/Shared/Components/CartSummary/Default.cshtml)
├── TagHelpers/                           custom tag helpers
├── Filters/                              action/exception filters
├── Middleware/                           custom middleware classes
├── Services/                             application services (or a separate class library)
├── Data/                                 DbContext, migrations, seed data (or Infrastructure project)
├── Extensions/                           IServiceCollection extension methods (AddShopServices)
├── Resources/                            .resx files for localisation
└── Properties/PublishProfiles/           publish settings (folder, IIS, Azure)
```

**`Program.cs` — the whole app setup in one file (.NET 6+ minimal hosting):**

```csharp
var builder = WebApplication.CreateBuilder(args);       // 1. host: configuration, logging, DI container, Kestrel

// 2. Register services (DI container)
builder.Services.AddControllersWithViews();              // MVC + Razor views
builder.Services.AddDbContext<ShopDbContext>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("Shop")));
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie();

var app = builder.Build();                               // 3. build the app (service provider created)

// 4. Middleware pipeline — ORDER MATTERS
if (!app.Environment.IsDevelopment()) { app.UseExceptionHandler("/Home/Error"); app.UseHsts(); }
app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapStaticAssets();                                   // .NET 9+ (older: app.UseStaticFiles() before UseRouting)

// 5. Endpoints
app.MapControllerRoute(name: "areas", pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");
app.MapControllerRoute(name: "default", pattern: "{controller=Home}/{action=Index}/{id?}").WithStaticAssets();

app.Run();                                               // 6. start Kestrel and block until shutdown
```

**View lookup convention:** for `ProductsController.Details()` returning `View()`, the view engine searches `Views/Products/Details.cshtml`, then `Views/Shared/Details.cshtml` (and `Areas/{area}/Views/...` for areas). Partial views starting with `_` by convention.

**Comparison with MVC 5:** `Global.asax` + `App_Start/*Config.cs` + `web.config` → `Program.cs` + `appsettings.json`; `Content/` + `Scripts/` → `wwwroot/`; `Views/web.config` → `_ViewImports.cshtml`; packages.config → `<PackageReference>` in the .csproj.

> **Interview tip:** Only `wwwroot` is publicly served. Files like `appsettings.json` or `.cshtml` are never downloadable — Razor views are compiled into the app's assembly at build time.

## Lesson: [Intermediate|High] How ASP.NET Core MVC works inside — from Kestrel to HTML

**Phase 1 — Startup (once):**

1. `WebApplication.CreateBuilder` creates the **generic host**: loads configuration (appsettings.json → appsettings.{Env}.json → user secrets → environment variables → command line), sets up logging, creates the `IServiceCollection` and configures **Kestrel** as the `IServer`.
2. You register services; `builder.Build()` creates the root **`IServiceProvider`**.
3. `Use...` calls compose the **middleware pipeline** into a single `RequestDelegate` (each middleware wraps the next).
4. `MapControllerRoute`/`MapControllers` registers **endpoint data sources**: at startup MVC discovers controllers (public classes ending in `Controller` in the app's assemblies — the *application parts*), builds an `ActionDescriptor` for every action (routes, HTTP methods, filters, parameters) and turns them into **endpoints**.
5. `app.Run()` starts hosted services and Kestrel, which listens on the configured ports.

**Phase 2 — Each request:**

```text
Kestrel (socket → HTTP parser) ──► HttpContext created (Request, Response, Features, RequestServices = new DI SCOPE)
   │
   ▼ Middleware pipeline (RequestDelegate chain)
 ExceptionHandler ─► HSTS/HttpsRedirection ─► Static assets? (serve & short-circuit)
   ─► UseRouting: EndpointRoutingMiddleware matches URL + HTTP method against all endpoints
        (a compiled DFA matcher), stores the chosen Endpoint + route values in HttpContext
   ─► UseAuthentication: reads cookie/JWT → HttpContext.User
   ─► UseAuthorization: reads [Authorize] metadata from the selected endpoint → allow / 401 / 403
   ─► Endpoint middleware: invokes the endpoint's RequestDelegate
        │
        ▼ MVC: ControllerActionInvoker (ResourceInvoker) — the filter pipeline
        1. Authorization filters
        2. Resource filters (before)      ← e.g. caching can short-circuit here
        3. Controller created by the controller activator (constructor dependencies resolved from the request scope)
        4. Model binding: value providers (route, query, form, headers, body via input formatters e.g. System.Text.Json)
           + model binders → action parameters; then validation (DataAnnotations/IValidatableObject) → ModelState
        5. Action filters (OnActionExecuting)
        6. ACTION METHOD executes → returns IActionResult (ViewResult, JsonResult, RedirectResult...)
        7. Action filters (OnActionExecuted)
        8. Exception filters (if the action/filters threw)
        9. Result filters (OnResultExecuting)
       10. Result execution:
             ViewResult → IViewEngine (RazorViewEngine) finds the compiled view → creates ViewContext
             → runs _ViewStart → view's ExecuteAsync writes HTML (tag helpers run, partials/view components render)
             → layout renders with @RenderBody → HTML written to the response body
             ObjectResult/JsonResult → output formatter (System.Text.Json) serialises to the body
       11. Result filters (OnResultExecuted), Resource filters (after)
   ◄─ response flows back through middleware (they can still act after next()) ◄─
Kestrel writes the response bytes; the request's DI scope is disposed (scoped services like DbContext disposed)
```

**Key internals to remember:**

| Piece | What it really is |
|---|---|
| `HttpContext` | Per-request object: `Request`, `Response`, `User`, `Items`, `Features`, `RequestServices` |
| Middleware | `Func<RequestDelegate, RequestDelegate>` — each calls `next(context)` or short-circuits |
| Endpoint | A `RequestDelegate` + **metadata** (route pattern, `[Authorize]`, CORS policy, action descriptor) |
| Routing | Two steps: **match** in `UseRouting`, **execute** in the endpoint middleware — middleware between them (auth, CORS) can read the selected endpoint |
| Controller lifetime | A **new controller instance per request** (transient), created from the request's DI scope |
| Scoped services | One instance per request (DbContext) — disposed at the end of the request |
| Model binding | Value providers + model binder providers (`[FromRoute]`, `[FromQuery]`, `[FromForm]`, `[FromBody]`, `[FromServices]`, `[FromHeader]`) |
| Razor views | Compiled at **build time** by the Razor SDK into classes deriving from `RazorPage<TModel>` inside the app assembly (runtime compilation only if you add the package for development) |
| Tag helpers | Classes executed while the view renders, turning `<input asp-for>` into HTML |
| Output | `IActionResult.ExecuteResultAsync` writes to `HttpContext.Response.Body` (a pipe to Kestrel) |

**Writing your own middleware shows the pipeline idea:**

```csharp
app.Use(async (context, next) =>
{
    var sw = Stopwatch.StartNew();                     // runs on the way IN
    await next(context);                               // everything after this middleware runs here
    sw.Stop();                                         // runs on the way OUT
    app.Logger.LogInformation("{Path} took {Ms} ms → {Status}", context.Request.Path, sw.ElapsedMilliseconds, context.Response.StatusCode);
});
```

> **Interview tip:** Asked "explain the request life cycle", answer in this order: Kestrel → HttpContext + DI scope → middleware (exception, HTTPS, static files, routing, authentication, authorization) → endpoint → MVC filters (authorization, resource, model binding + validation, action, exception, result) → action → result execution (view engine / formatter) → back out through middleware → scope disposed.

## Lesson: [Basic|High] Controllers, actions and action results

```csharp
public class ProductsController(IProductService products) : Controller
{
    public async Task<IActionResult> Index() => View(await products.GetAllAsync());

    public async Task<IActionResult> Details(int id)
    {
        var p = await products.GetAsync(id);
        return p is null ? NotFound() : View(p);
    }

    [HttpGet] public IActionResult Create() => View();

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(ProductInput input)
    {
        if (!ModelState.IsValid) return View(input);           // redisplay with errors
        var id = await products.CreateAsync(input);
        TempData["Message"] = "Product created";
        return RedirectToAction(nameof(Details), new { id });   // Post-Redirect-Get
    }
}
```

| Result | Helper |
|---|---|
| HTML view | `View()`, `PartialView()` |
| Redirect | `Redirect()`, `RedirectToAction()`, `RedirectToRoute()`, `LocalRedirect()` |
| Data | `Json()`, `Content()`, `File()`, `Ok()` |
| Status | `NotFound()`, `BadRequest()`, `Unauthorized()`, `Forbid()`, `StatusCode(503)` |

**Post-Redirect-Get (PRG)** prevents duplicate form submissions on browser refresh.

## Lesson: [Basic|High] Routing: conventional vs attribute

```csharp
// Conventional (Program.cs)
app.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
app.MapControllerRoute("blog", "blog/{year:int}/{slug}", defaults: new { controller = "Blog", action = "Post" });

// Attribute routing
[Route("shop/products")]
public class ProductsController : Controller
{
    [HttpGet("")] public IActionResult Index() => View();
    [HttpGet("{id:int:min(1)}")] public IActionResult Details(int id) => View();
    [HttpGet("by-category/{name:alpha}")] public IActionResult ByCategory(string name) => View();
}
```

- Route constraints: `int`, `bool`, `guid`, `datetime`, `min(1)`, `range(1,100)`, `alpha`, `regex(...)`, `length(3,20)`.
- **Endpoint routing** (3.0+): `UseRouting()` selects the endpoint early so middleware like CORS/auth know which endpoint (and its metadata) will run.
- **Areas** split large apps: `[Area("Admin")]` + route `{area:exists}/{controller}/{action}`.
- Generate URLs, never hard-code: `Url.Action("Details", "Products", new { id })`, `asp-action` tag helper.

# Module: Models, Binding and Validation

## Lesson: [Basic|High] Model binding sources

Model binding maps HTTP request data to action parameters. Sources in order: **form fields → route values → query string** (and files). Explicit attributes override:

```csharp
public IActionResult Search(
    [FromQuery] string q,
    [FromRoute] int page,
    [FromForm] string sort,
    [FromHeader(Name = "X-Tenant")] string tenant,
    [FromServices] IClock clock,
    [FromBody] SearchFilter filter)   // body (JSON) — typical in Web API, only one [FromBody] per action
{ ... }
```

Complex types bind by property name (`Address.City` → `input.Address.City`). Collections bind by index (`Items[0].Qty`).

**Over-posting / mass assignment:** binding directly to entities lets attackers set fields like `IsAdmin`. Use **view models / input models** with only the allowed fields (or `[Bind("Name,Price")]`).

## Lesson: [Basic|High] Validation with data annotations

```csharp
public class ProductInput
{
    [Required, StringLength(100, MinimumLength = 3)]
    public string Name { get; set; } = "";

    [Range(1, 1_000_000)]
    [DataType(DataType.Currency)]
    public decimal Price { get; set; }

    [EmailAddress] public string? SupplierEmail { get; set; }
    [RegularExpression(@"^[A-Z]{3}-\d{4}$", ErrorMessage = "SKU must look like ABC-1234")]
    public string Sku { get; set; } = "";

    [Remote(action: "SkuAvailable", controller: "Products")]   // AJAX check via jQuery unobtrusive validation
    public string? Code { get; set; }
}
```

- Server-side: `ModelState.IsValid` (always check — client validation can be bypassed).
- Client-side: jQuery Validation + Unobtrusive (`_ValidationScriptsPartial`) reads `data-val-*` attributes generated by tag helpers.
- Custom rules: a `ValidationAttribute` subclass or `IValidatableObject.Validate()` for cross-field rules; FluentValidation library for complex rules.
- Add errors manually: `ModelState.AddModelError(nameof(input.Sku), "SKU already exists");`

## Lesson: [Intermediate|High] Passing data: ViewData, ViewBag, TempData, strongly typed models

| | Type | Lifetime | Use |
|---|---|---|---|
| Strongly typed `@model` | Any class | Current request | **Preferred** — compile-time checked |
| `ViewData` | `ViewDataDictionary` (string keys) | Current request | Small extras, e.g. page title |
| `ViewBag` | `dynamic` wrapper over ViewData | Current request | Same as ViewData, no casting |
| `TempData` | Dictionary backed by cookie (default) or session | Until **read** (survives one redirect) | Flash messages after PRG |
| Session | `ISession` (needs `AddSession` + distributed cache) | Across requests | Wizard state, cart (prefer DB for important data) |

```csharp
ViewData["Title"] = "Products";
ViewBag.Count = 5;
TempData["Message"] = "Saved";           // read once on next request; TempData.Keep() / Peek() to retain
```

```cshtml
@model IEnumerable<Product>
<h1>@ViewData["Title"]</h1>
@if (TempData["Message"] is string msg) { <div class="alert alert-success">@msg</div> }
```

# Module: Razor Views

## Lesson: [Basic|High] Razor syntax, layouts, sections and partial views

```cshtml
@model ProductListVm
@{ ViewData["Title"] = "Products"; }

<h1>@ViewData["Title"] (@Model.Items.Count)</h1>
@foreach (var p in Model.Items)
{
    <partial name="_ProductCard" model="p" />
}
@if (!Model.Items.Any()) { <p>No products.</p> }
<p>Total: @Model.Items.Sum(i => i.Price).ToString("C")</p>
@* Razor comment *@

@section Scripts {
    <partial name="_ValidationScriptsPartial" />
}
```

```cshtml
<!-- Views/Shared/_Layout.cshtml -->
<!DOCTYPE html>
<html>
<head><title>@ViewData["Title"] - MyShop</title></head>
<body>
  <partial name="_Nav" />
  <main>@RenderBody()</main>
  @await RenderSectionAsync("Scripts", required: false)
</body>
</html>
```

- `@` outputs **HTML-encoded** values (XSS protection); `@Html.Raw()` disables encoding — avoid with user input.
- `_ViewStart.cshtml` sets the default layout; `_ViewImports.cshtml` holds `@using` and `@addTagHelper`.

## Lesson: [Intermediate|High] Tag helpers vs HTML helpers

```cshtml
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers

<form asp-controller="Products" asp-action="Create" method="post">
    <div asp-validation-summary="ModelOnly"></div>
    <label asp-for="Name"></label>
    <input asp-for="Name" class="form-control" />
    <span asp-validation-for="Name"></span>
    <select asp-for="CategoryId" asp-items="Model.Categories"></select>
    <button type="submit">Save</button>
</form>
<a asp-action="Details" asp-route-id="@item.Id">View</a>
<img src="~/img/logo.png" asp-append-version="true" />
<environment include="Development"><script src="~/js/site.js"></script></environment>
```

Old style **HTML helpers**: `@Html.TextBoxFor(m => m.Name)`, `@Html.ActionLink("View", "Details", new { id })`. Tag helpers look like HTML, are designer-friendly, and the `<form>` tag helper **adds the antiforgery token automatically**.

Custom tag helper: a class deriving from `TagHelper` overriding `Process(TagHelperContext, TagHelperOutput)`.

## Lesson: [Intermediate|High] Partial views vs view components

| | Partial view | View component |
|---|---|---|
| Logic | None (just markup with a model you pass) | Has its own C# class with `InvokeAsync` — can call services |
| Data | Parent must supply the model | Fetches its own data |
| Use | Reusable markup fragments (product card) | Widgets: shopping cart summary, menu, recent posts |
| Invoke | `<partial name="_Card" model="x" />` | `@await Component.InvokeAsync("Cart")` or `<vc:cart></vc:cart>` |

```csharp
public class CartViewComponent(ICartService cart) : ViewComponent
{
    public async Task<IViewComponentResult> InvokeAsync() => View(await cart.GetSummaryAsync(UserClaimsPrincipal));
}
// View: Views/Shared/Components/Cart/Default.cshtml
```

Child actions (`@Html.Action`) from MVC 5 no longer exist — view components replace them.

# Module: Filters, State and Security

## Lesson: [Intermediate|High] Filters and their order

| Filter | Runs | Example |
|---|---|---|
| Authorization | First; can short-circuit | `[Authorize]`, custom policy checks |
| Resource | Before/after model binding | Caching, short-circuit for maintenance |
| Action | Before/after the action method | Logging, validation, modifying arguments |
| Exception | When an unhandled exception occurs in the MVC pipeline | Convert to error view/ProblemDetails |
| Result | Before/after the result executes | Add headers, modify the result |

```csharp
public class AuditFilter(ILogger<AuditFilter> log) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next)
    {
        log.LogInformation("Executing {Action}", ctx.ActionDescriptor.DisplayName);
        var executed = await next();
        if (executed.Exception is null) log.LogInformation("Done {Action}", ctx.ActionDescriptor.DisplayName);
    }
}
builder.Services.AddControllersWithViews(o => o.Filters.Add<AuditFilter>());   // global
// or [ServiceFilter(typeof(AuditFilter))] on a controller/action (filter resolved from DI)
```

Scope order: **global → controller → action** on the way in (reverse on the way out); override with `Order`.

**Filters vs middleware:** middleware sees every request (including static files) and knows nothing about MVC; filters run only for MVC actions and have access to `ModelState`, action arguments and results.

## Lesson: [Intermediate|High] Authentication, authorisation and Identity

```csharp
builder.Services.AddDefaultIdentity<IdentityUser>(o => o.SignIn.RequireConfirmedAccount = true)
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("CanApprove", p => p.RequireRole("Manager").RequireClaim("department", "Finance"));
    o.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();  // secure by default
});

[Authorize(Policy = "CanApprove")]
public class ApprovalsController : Controller
{
    [AllowAnonymous] public IActionResult About() => View();
}
```

- **Authentication** = who you are (cookie, JWT, OpenID Connect with Microsoft Entra ID/Google). **Authorisation** = what you may do (roles, claims, policies, resource-based checks via `IAuthorizationService`).
- MVC apps typically use **cookie authentication**; APIs use **JWT bearer tokens**.
- Identity stores users, hashed passwords (PBKDF2), roles, claims, 2FA, lockout, external logins.

## Lesson: [Intermediate|High] Security: antiforgery, XSS, HTTPS, CORS

- **CSRF:** cookie-authenticated forms must include an antiforgery token. The form tag helper adds it; validate with `[ValidateAntiForgeryToken]` or globally with `AutoValidateAntiforgeryTokenAttribute`.
- **XSS:** Razor HTML-encodes `@` output; never `Html.Raw` user input; add a Content-Security-Policy header.
- **HTTPS + HSTS:** `UseHttpsRedirection()`, `UseHsts()` in production.
- **Open redirect:** use `LocalRedirect()` / `Url.IsLocalUrl(returnUrl)` for return URLs.
- **Cookies:** `HttpOnly`, `Secure`, `SameSite=Lax/Strict`.
- **Error pages:** developer exception page only in Development.

## Lesson: [Intermediate|Medium] Caching, session and performance in MVC

```csharp
builder.Services.AddOutputCache(o => o.AddPolicy("Products", b => b.Expire(TimeSpan.FromMinutes(5)).Tag("products")));
app.UseOutputCache();

[OutputCache(PolicyName = "Products")]
public IActionResult Index() => View();
// invalidate after an update: await outputCacheStore.EvictByTagAsync("products", ct);
```

```cshtml
<cache expires-after="@TimeSpan.FromMinutes(10)" vary-by-user="true">
    @await Component.InvokeAsync("RecentOrders")
</cache>
```

Other levers: `IMemoryCache`/`IDistributedCache`/`HybridCache` for data, response compression, bundling/minification (or `MapStaticAssets` compression), async actions, avoiding N+1 queries in views (load everything in the controller with projections).

## Lesson: [Basic|Medium] Razor Pages vs MVC

Razor Pages (2.0+) organises UI by **page** rather than by controller: `Pages/Products/Edit.cshtml` + `Edit.cshtml.cs` (`PageModel` with `OnGet`/`OnPostAsync` handlers, `[BindProperty]`). It's simpler for form-centric CRUD pages; MVC suits apps with many actions per resource, complex routing or shared controllers with APIs. Both use the same Razor, tag helpers, model binding, validation, filters and DI, and can live in one app.

```csharp
public class EditModel(AppDbContext db) : PageModel
{
    [BindProperty] public ProductInput Input { get; set; } = new();
    public async Task<IActionResult> OnGetAsync(int id) { /* load */ return Page(); }
    public async Task<IActionResult> OnPostAsync(int id)
    {
        if (!ModelState.IsValid) return Page();
        await db.SaveChangesAsync();
        return RedirectToPage("Index");
    }
}
```

# Interview

## [Beginner|High] What is MVC? Explain the role of each component.

Model–View–Controller separates an app into three parts. The **Model** holds data, business rules and validation (entities, view models). The **View** renders UI from a model (Razor `.cshtml`). The **Controller** receives the request, works with services and models, and returns a result (view, redirect, JSON). Benefits: separation of concerns, testable controllers, parallel work on UI and logic, and clean URLs through routing.

## [Beginner|High] Explain the ASP.NET Core MVC request lifecycle.

Kestrel receives the request, which flows through the middleware pipeline (exception handling, HTTPS, static files, routing, authentication, authorisation). Endpoint routing selects the controller action. The controller is created via DI, then the filter pipeline runs: authorisation filters → resource filters → model binding and validation → action filters → the action executes → result filters → result execution (the view engine renders the view with its layout and partials). Exception filters handle errors in that stage, and the response goes back out through the middleware.

## [Beginner|High] What is the difference between ViewData, ViewBag and TempData?

`ViewData` is a string-keyed dictionary and `ViewBag` is a `dynamic` wrapper over the same data. Both live only for the current request (controller → view) and need no casting with ViewBag. `TempData` persists until it is **read**, typically across one redirect (PRG flash messages); it's stored in a cookie by default or in session. `Keep()`/`Peek()` retain values. Prefer strongly typed view models over all three for real data.

## [Beginner|High] What is the difference between conventional and attribute routing?

Conventional routing defines URL templates centrally (`{controller=Home}/{action=Index}/{id?}`) and is good for uniform MVC apps. Attribute routing puts templates on controllers/actions (`[Route("products/{id:int}")]`), giving precise control, constraints and versioning; it's required for `[ApiController]`. Both can coexist. Attribute routes are matched without the conventional patterns.

## [Beginner|High] What is model binding?

The process of mapping HTTP request data (form fields, route values, query string, headers, body, files) to action parameters and model properties by name. Attributes `[FromForm]`, `[FromQuery]`, `[FromRoute]`, `[FromHeader]`, `[FromBody]` and `[FromServices]` control the source. After binding, validation runs and fills `ModelState`.

## [Beginner|High] How does validation work in ASP.NET Core MVC?

Data annotations (`[Required]`, `[StringLength]`, `[Range]`, `[EmailAddress]`, `[RegularExpression]`, `[Compare]`) on models are checked after model binding, and the results go into `ModelState`. Check `ModelState.IsValid` in the action and redisplay the view with errors. Tag helpers emit `data-val-*` attributes, so jQuery Unobtrusive Validation validates on the client too. Custom rules use a `ValidationAttribute`, `IValidatableObject` or FluentValidation. Server-side validation is mandatory because the client side can be bypassed.

## [Beginner|Medium] What are `_Layout`, `_ViewStart` and `_ViewImports`?

`_Layout.cshtml` is the master template (header, nav, footer) with `@RenderBody()` and optional `@RenderSection`. `_ViewStart.cshtml` runs before every view in its folder and usually sets `Layout = "_Layout"`. `_ViewImports.cshtml` holds shared directives — `@using`, `@addTagHelper`, `@inject` — for all views in that folder hierarchy.

## [Intermediate|High] Partial view vs view component — when do you use which?

Use a **partial view** to reuse markup when the parent already has the data (e.g. a product card in a list). Use a **view component** when the widget needs its own logic and data from services, independent of the page's model (shopping cart badge, navigation menu, "latest posts"). View components replace MVC 5 child actions and can be invoked as tag helpers (`<vc:cart />`).

## [Intermediate|High] What are filters? List the types and their execution order.

Filters run code at specific stages of the MVC action pipeline: **Authorization** → **Resource** → (model binding) → **Action** → action → **Action** (after) → **Result** → result execution → **Result** (after). **Exception** filters catch unhandled exceptions from these stages. They can be applied globally, per controller or per action (in that order on the way in), and use DI via `ServiceFilter`/`TypeFilter`. Use cases: auth, logging, caching, validation, error handling.

## [Intermediate|High] What is the difference between middleware and filters?

Middleware is part of the ASP.NET Core pipeline. It runs for every request, including static files and non-MVC endpoints, works with `HttpContext` only, and its order is set in Program.cs. Filters are part of MVC. They run only for controller actions and Razor Pages, and can see MVC context such as `ModelState`, action arguments and `IActionResult`. Use middleware for cross-cutting HTTP concerns (logging, CORS, exception handling) and filters for action-specific concerns (validation, audit per action).

## [Intermediate|High] What are tag helpers? How are they better than HTML helpers?

Tag helpers are server-side C# classes that enhance HTML-looking elements via `asp-*` attributes (`<input asp-for="Name" />`, `<a asp-action="Details" asp-route-id="5">`). Compared with HTML helpers (`@Html.TextBoxFor`), they look like plain HTML, give better IntelliSense, are friendlier to designers, and add features automatically (antiforgery tokens in forms, cache-busting with `asp-append-version`). Custom tag helpers derive from `TagHelper`.

## [Intermediate|High] How do you prevent CSRF attacks in ASP.NET Core MVC?

Use antiforgery tokens. The form tag helper injects a hidden `__RequestVerificationToken` field paired with a cookie. Validate with `[ValidateAntiForgeryToken]` per action or globally with `AutoValidateAntiforgeryTokenAttribute`. For AJAX, send the token in a header (`RequestVerificationToken`) configured via `AddAntiforgery(o => o.HeaderName = ...)`. `SameSite` cookies add defence in depth. APIs using JWT in the Authorization header aren't vulnerable in the same way.

## [Intermediate|Medium] What is the difference between `RedirectToAction`, `Redirect` and `LocalRedirect`?

All send a 302 by default (`*Permanent` variants send 301/308). `RedirectToAction("Details", new { id })` builds the URL from routing. `Redirect(url)` goes to any URL, including external ones, which is risky with user input (open redirect). `LocalRedirect(url)` only allows local URLs and throws otherwise, so use it for `returnUrl` after login.

## [Intermediate|Medium] What is Post-Redirect-Get and why is it used?

After a successful POST, the server responds with a redirect (302/303) to a GET page instead of rendering a view directly. Refreshing the browser then repeats the harmless GET instead of resubmitting the form, which prevents duplicate orders or payments. `TempData` carries the success message across the redirect.

## [Intermediate|Medium] What is an Area in MVC?

A way to partition a large MVC app into functional sections (Admin, Billing, Customer), each with its own Controllers, Views and Models folders. Controllers are marked `[Area("Admin")]` and routes include `{area:exists}`. Tag helpers use `asp-area`.

## [Intermediate|Medium] How do you handle errors globally in MVC?

In production, `app.UseExceptionHandler("/Home/Error")` (shows a friendly error page, logs the exception) plus `app.UseStatusCodePagesWithReExecute("/Error/{0}")` for 404s. In development, the developer exception page is enabled by default. Exception filters handle MVC-specific cases. .NET 8 adds `IExceptionHandler` implementations registered with `AddExceptionHandler<T>()`. Always log with a correlation ID and never show stack traces to users.

## [Advanced|High] How does authentication differ between an MVC app and a Web API?

MVC apps usually use **cookie authentication**: after login (Identity or OpenID Connect via Entra ID), an encrypted auth cookie identifies the user on each request, and antiforgery tokens protect forms. Web APIs consumed by SPAs or mobile apps usually use **JWT bearer tokens** in the `Authorization` header, validated statelessly (issuer, audience, signature, expiry). In both, authorisation uses `[Authorize]` with roles, claims or policies. For SPAs, a BFF (Backend-for-Frontend) that keeps tokens server-side and uses cookies is now recommended for security.

## [Advanced|Medium] How would you implement resource-based authorisation (e.g. only the owner can edit a document)?

Attribute-based roles can't express "owner of this specific document". Load the resource, then call `IAuthorizationService.AuthorizeAsync(User, document, "EditPolicy")`. Write an `AuthorizationHandler<SameOwnerRequirement, Document>` that succeeds when `document.OwnerId == user id` or the user is an admin. Return `Forbid()` on failure. This also prevents IDOR attacks.

## [Advanced|Medium] How do you unit-test an MVC controller?

Inject dependencies through interfaces and mock them (Moq/NSubstitute). Instantiate the controller, call the action, and assert on the `IActionResult` type and model: `var result = Assert.IsType<ViewResult>(await controller.Details(5)); Assert.IsType<Product>(result.Model);`. Set `controller.ControllerContext` with a fake `HttpContext`/`User` when needed. For routing, filters and views end to end, use integration tests with `WebApplicationFactory`.

## [Scenario|High] Users double-click "Place Order" and two orders are created. How do you fix it?

Defence in layers: (1) disable the button on submit with JavaScript; (2) use **Post-Redirect-Get**; (3) make the server **idempotent** — generate an order token (GUID) when rendering the form, store it in a hidden field, and enforce a unique constraint on it in the DB, so a second POST with the same token is rejected or returns the existing order. The DB unique constraint is the only fully reliable guard.

## [Scenario|High] A product page shows another customer's order when the URL ID is changed. What is the bug and the fix?

It's an **IDOR** (Insecure Direct Object Reference) / broken access control. The action loads by ID without checking ownership. Fix: always scope queries by the current user (`db.Orders.Where(o => o.Id == id && o.CustomerId == userId)`), or use resource-based authorisation. Return 404 (not 403) to avoid revealing existence. Audit other endpoints, add integration tests for access control, and consider EF Core global query filters for multi-tenant data.

## [Scenario|Medium] Your MVC home page takes 4 seconds. Profiling shows 120 SQL queries per request. What do you do?

That's an **N+1 query problem**: views or lazy loading trigger a query per item. Fix: load all needed data in the controller/service with one or a few queries using `Include` or, better, projections (`Select` into a view model). Disable lazy loading. Cache rarely changing data (categories, menus) with `IMemoryCache`/`HybridCache` or the `<cache>` tag helper. Add output caching for anonymous pages. Measure again with logging of EF queries or MiniProfiler.

## [Scenario|Medium] After deploying, users see old CSS/JS from browser cache. How do you prevent this?

Use cache busting. `asp-append-version="true"` on `<script>`, `<link>` and `<img>` adds a hash query string that changes when the file changes. In .NET 9+, `MapStaticAssets()` with `.WithStaticAssets()` fingerprints and compresses assets at build time with long-lived caching headers. Bundlers (Vite/webpack) produce hashed file names.

# Cheatsheet

## Request lifecycle

Middleware → Routing → Controller (DI) → **Authorization filter** → **Resource filter** → Model binding → Validation → **Action filter** → **Action** → **Action filter** → **Result filter** → View render → **Result filter** → Response. Exception filters wrap the action/result stages.

## Middleware order (MVC)

```csharp
app.UseExceptionHandler("/Home/Error"); app.UseHsts();
app.UseHttpsRedirection();
app.UseStaticFiles();   // or MapStaticAssets()
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseSession();
app.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
```

## Passing data

| | Lifetime |
|---|---|
| Model (`@model`) | Request — preferred |
| ViewData / ViewBag | Request |
| TempData | Until read (one redirect) |
| Session | Across requests |

## Action results

`View` · `PartialView` · `ViewComponent` · `Json` · `Content` · `File` · `Redirect` · `RedirectToAction` · `LocalRedirect` · `NotFound` · `BadRequest` · `Unauthorized` · `Forbid` · `StatusCode`.

## Binding attributes

`[FromQuery]` `[FromRoute]` `[FromForm]` `[FromBody]` `[FromHeader]` `[FromServices]` `[Bind("A,B")]` `[BindProperty]` (Razor Pages).

## Validation attributes

`[Required]` `[StringLength]` `[MaxLength]` `[Range]` `[EmailAddress]` `[Phone]` `[Url]` `[Compare("Password")]` `[RegularExpression]` `[Remote]` · custom `ValidationAttribute` · `IValidatableObject`.

## Security checklist

Antiforgery on POST forms · `[Authorize]` + fallback policy · ownership checks (IDOR) · `LocalRedirect` for returnUrl · no `Html.Raw` on user input · HTTPS + HSTS · secure cookies · view models (no over-posting).
