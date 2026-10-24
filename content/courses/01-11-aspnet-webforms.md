---
slug: aspnet-webforms
title: ASP.NET Web Forms — Page Life Cycle, ViewState, Controls and State Management
track: dotnet
order: 11
group: ASP.NET (.NET Framework)
icon: WF
color: #6c757d
summary: How ASP.NET Web Forms works inside IIS (application and page life cycle), folder structure (App_Code, App_Data, App_Start, Bin, App_Themes), Web Site vs Web Application projects, .aspx/.aspx.cs code-behind, server controls and events, PostBack and ViewState, state management (ViewState, ControlState, Session, Application, Cache, cookies, query strings, hidden fields), validation controls, master pages, user controls and custom controls, data binding with GridView/Repeater and SqlDataSource vs ObjectDataSource, Global.asax and web.config, Forms authentication, custom errors, performance and migrating Web Forms to ASP.NET Core.
---

# Overview

**ASP.NET Web Forms** (2002, .NET Framework) lets developers build web pages the way they built Windows Forms: drag **server controls** onto a page, double-click a button and write a C#/VB.NET **event handler**. The framework hides HTTP's statelessness using **PostBack** (forms post to the same page) and **ViewState** (control state stored in a hidden field).

| Strength | Weakness |
|---|---|
| Very fast development for data-entry/admin screens (GridView, FormView, validators) | Heavy pages (ViewState), less control over HTML |
| Event-driven model familiar to desktop developers | Hard to unit test (logic in code-behind) |
| Huge control ecosystem (Telerik, DevExpress, Infragistics) | Tightly coupled to IIS/System.Web; not in .NET Core |
| Still powers many enterprise/government intranets | No new features; migration needed for modern .NET |

Web Forms remains supported on **.NET Framework 4.8/4.8.1** (as part of Windows), so these apps keep running — and developers who understand them are needed for maintenance and migration. Community project **WebFormsCore**/Blazor migration tools exist, but there is no official Web Forms for .NET Core.

# Versions

| Version | Year | .NET Framework | Highlights |
|---|---|---|---|
| ASP.NET 1.0 | 2002 | 1.0 | Web Forms, server controls, ViewState, code-behind, web.config, Forms auth |
| ASP.NET 1.1 | 2003 | 1.1 | Mobile controls, request validation |
| ASP.NET 2.0 | 2005 | 2.0 | **Master pages**, themes/skins, Membership/Roles/Profile providers, GridView/DetailsView/FormView, data source controls, Web Parts, `App_Code`, partial classes |
| ASP.NET 3.5 | 2007 | 3.5 | ASP.NET AJAX (UpdatePanel, ScriptManager), ListView, LINQ, `LinqDataSource`; 3.5 SP1: Dynamic Data, routing (`System.Web.Routing`) |
| ASP.NET 4.0 | 2010 | 4.0 | `ClientIDMode` (clean IDs), `ViewStateMode`, routing for Web Forms, `Response.RedirectPermanent`, cleaner HTML |
| ASP.NET 4.5 | 2012 | 4.5 | **Model binding** (`SelectMethod`/`ItemType`), strongly typed data controls, async pages, bundling & minification, unobtrusive validation |
| ASP.NET 4.6 – 4.8 | 2015 – 2019 | 4.6 – 4.8 | HTTP/2 support on Windows 10/IIS, async model binding, maintenance updates |

# Lifecycle

**1. Application / request life cycle in IIS (integrated pipeline):**

```text
Browser → HTTP.sys → IIS (w3wp.exe, app pool, .NET CLR v4.0) → ASP.NET HttpRuntime
   → HttpApplication (Global.asax) events, run by HTTP modules:
     BeginRequest → AuthenticateRequest → AuthorizeRequest → ResolveRequestCache
     → MapRequestHandler → AcquireRequestState (Session loaded)
     → PreRequestHandlerExecute
     → HTTP HANDLER executes  (for .aspx: the Page class → PAGE LIFE CYCLE below)
     → PostRequestHandlerExecute → ReleaseRequestState (Session saved)
     → UpdateRequestCache → LogRequest → EndRequest
   → response sent
```

The first request to the application raises `Application_Start` (Global.asax); `.aspx` files are compiled dynamically (or precompiled) into classes deriving from your code-behind class, which derives from `System.Web.UI.Page`.

**2. Page life cycle (the most-asked Web Forms interview topic):**

| Stage / event | What happens | Typical use |
|---|---|---|
| Page request & start | Determines `IsPostBack`, sets `Request`/`Response` | — |
| **PreInit** | Before controls initialise | Set master page or theme dynamically, create dynamic controls |
| **Init** | Each control's Init (children first), control IDs set | Initialise control properties, add dynamic controls |
| InitComplete | ViewState tracking turned on | — |
| (PostBack) Load ViewState / ControlState | Restore control values from `__VIEWSTATE` | — |
| (PostBack) Load PostBack data | Apply posted form values to controls | — |
| PreLoad | Before Load | — |
| **Load** | Page then each control's Load | Data loading — usually inside `if (!IsPostBack)` |
| **Control events** (PostBack) | `TextChanged`, `SelectedIndexChanged`, then the **Button `Click`** that caused the postback | Your business actions |
| LoadComplete | After events | — |
| **PreRender** | Last chance to change controls before rendering | Final UI adjustments |
| PreRenderComplete, SaveStateComplete | ViewState saved into `__VIEWSTATE` | — |
| **Render** | Each control writes its HTML (method, not event) | Custom controls override `Render` |
| **Unload** | Cleanup (children first, then page); response already sent | Close resources |

Mnemonic: **"SILVER"** — Start, Init, Load, Validate, Event handling, Render (plus Unload).

# Tools

- Visual Studio 2022/2026 with the "ASP.NET and web development" workload (.NET Framework 4.8 templates) — designer view, Toolbox, Properties window.
- IIS / IIS Express, IIS Manager, Event Viewer, Failed Request Tracing.
- Third-party control suites: Telerik UI for ASP.NET AJAX, DevExpress ASP.NET Web Forms, Infragistics.
- ViewState decoders (to inspect page size), browser DevTools, Glimpse (legacy), Application Insights / ELMAH for errors.
- Migration: .NET Upgrade Assistant (project files), Blazor migration guides, YARP for incremental migration.

# Module: Getting Started

## Lesson: [Basic|High] Project types and folder structure

**Web Site project** (File → New → Web Site): no project file; every `.cs` file compiled dynamically on the server; `App_Code` for classes. **Web Application project** (preferred for real apps): a `.csproj`, compiled into one DLL in `bin`, better for source control and builds.

```text
ShopWeb/                        (ASP.NET Web Application, .NET Framework 4.8)
├── App_Code/                   shared classes compiled dynamically (Web Site projects mainly)
├── App_Data/                   local data files (.mdf, XML) — not served to browsers
├── App_GlobalResources/        .resx strings for localisation (whole app)
├── App_LocalResources/         .resx per page
├── App_Start/                  startup classes: RouteConfig, BundleConfig, IdentityConfig
├── App_Themes/                 themes: .skin and .css files per theme
├── Account/                    Login.aspx, Register.aspx (Identity/Membership template)
├── bin/                        compiled assemblies (YourApp.dll) and references
├── Content/                    CSS
├── Scripts/                    JavaScript (jQuery, Bootstrap)
├── Controls/                   user controls (.ascx)
├── Admin/                      pages protected by role (web.config <authorization> per folder)
├── Default.aspx                markup (HTML + server controls)
├── Default.aspx.cs             code-behind (partial class Default : Page)
├── Default.aspx.designer.cs    auto-generated control field declarations
├── Site.Master (+ .cs)         master page layout
├── Global.asax (+ .cs)         application events
├── Web.config                  configuration (connection strings, auth, modules, custom errors)
├── Web.Debug.config / Web.Release.config   config transforms for publishing
└── packages.config             NuGet packages (older style)
```

Folders starting with `App_` are special: IIS/ASP.NET blocks direct browser access to them.

## Lesson: [Basic|High] Pages, code-behind, server controls and events

```aspx
<%@ Page Title="Products" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Products.aspx.cs" Inherits="ShopWeb.Products" %>

<asp:Content ID="Main" ContentPlaceHolderID="MainContent" runat="server">
    <asp:Label ID="lblMessage" runat="server" CssClass="text-success" />
    <asp:TextBox ID="txtName" runat="server" />
    <asp:RequiredFieldValidator runat="server" ControlToValidate="txtName" ErrorMessage="Name is required" Display="Dynamic" />
    <asp:DropDownList ID="ddlCategory" runat="server" AutoPostBack="true" OnSelectedIndexChanged="ddlCategory_SelectedIndexChanged" />
    <asp:Button ID="btnSave" runat="server" Text="Save" OnClick="btnSave_Click" />
    <asp:GridView ID="gvProducts" runat="server" AutoGenerateColumns="false" DataKeyNames="Id">
        <Columns>
            <asp:BoundField DataField="Name" HeaderText="Name" />
            <asp:BoundField DataField="Price" HeaderText="Price" DataFormatString="{0:C}" />
        </Columns>
    </asp:GridView>
</asp:Content>
```

```csharp
public partial class Products : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)       // AutoEventWireup="true" wires Page_Load by name
    {
        if (!IsPostBack)                                        // first visit only — otherwise you overwrite user input
        {
            ddlCategory.DataSource = ProductService.GetCategories();
            ddlCategory.DataBind();
            BindGrid();
        }
    }

    protected void ddlCategory_SelectedIndexChanged(object sender, EventArgs e) => BindGrid();

    protected void btnSave_Click(object sender, EventArgs e)
    {
        if (!Page.IsValid) return;                              // server-side validation result
        ProductService.Add(txtName.Text.Trim(), ddlCategory.SelectedValue);
        lblMessage.Text = "Saved";
        BindGrid();
    }

    private void BindGrid()
    {
        gvProducts.DataSource = ProductService.GetByCategory(ddlCategory.SelectedValue);
        gvProducts.DataBind();
    }
}
```

**Control categories:** HTML controls (`<input>` — plain), **HTML server controls** (`<input runat="server">` — accessible in code), **Web server controls** (`<asp:TextBox>`), **validation controls**, **data controls** (GridView, Repeater, ListView, DetailsView, FormView), **navigation** (Menu, TreeView, SiteMapPath), **login controls**, **user controls** (.ascx) and **custom controls**.

**Inline code expressions:** `<%= value %>` (write, not encoded), `<%: value %>` (HTML-encoded — use this), `<%# Eval("Name") %>` (data binding), `<%$ ConnectionStrings:Shop %>` (expression builder).

# Module: PostBack and State

## Lesson: [Intermediate|High] PostBack, AutoPostBack and ViewState — how they work

- A Web Forms page wraps everything in **one `<form runat="server">`** that posts back to the same URL.
- **PostBack** = the browser submits the form to the same page; the page object is **created again from scratch** on the server, rebuilds controls, restores state and raises the events.
- `AutoPostBack="true"` makes controls like DropDownList post immediately on change (via `__doPostBack` JavaScript); `__EVENTTARGET` and `__EVENTARGUMENT` hidden fields tell the server which control fired.
- `IsPostBack` is `false` on the first GET and `true` on postbacks.

**ViewState:**

```html
<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="/wEPDwUKLTY1NDU2MTc0MQ9kFgJmD2QWAg..." />
```

- Stores control properties that changed programmatically (e.g. a Label's text, a GridView's data) so they survive postbacks.
- Base64-encoded, **signed** (MAC) to prevent tampering, optionally encrypted (`ViewStateEncryptionMode`) — but **not secret by default**; never store sensitive data.
- Grows page size and slows requests — large GridViews can produce hundreds of KB.
- Control: `EnableViewState="false"` per control/page, `ViewStateMode="Disabled"` + enable selectively (4.0+), store state elsewhere.
- **ControlState** — a small, separate state that controls need to function (e.g. GridView page index); cannot be turned off.

```csharp
// Your own values in ViewState (per page, survives postbacks of that page)
private int CurrentStep
{
    get => (int?)ViewState["Step"] ?? 1;
    set => ViewState["Step"] = value;
}
```

## Lesson: [Intermediate|High] State management — client-side vs server-side

| Technique | Where stored | Scope / lifetime | Use for |
|---|---|---|---|
| **ViewState** | Hidden field in the page | One page, across its postbacks | Control values, small page data |
| **ControlState** | Hidden field | One control | Essential control data |
| Hidden field | Page | Postbacks | Small values for client script |
| **Query string** | URL | One request/link | Ids, filters, bookmarkable state (`?id=5`) — visible, validate it |
| **Cookies** | Browser | Until expiry | Preferences, "remember me" (4 KB limit) |
| **Session** | Server (InProc memory, StateServer, SQL Server) keyed by a cookie | One user, until timeout (20 min default) | Cart, user data during a visit |
| **Application** | Server memory | Whole app, all users, until restart | Rarely-changing global data (with locking) |
| **Cache** (`HttpRuntime.Cache`) | Server memory | All users, with expiry/dependencies | Expensive lookups, reference data |
| Profile | Database (provider) | Per user, permanent | User preferences (legacy) |

```csharp
Session["Cart"] = cart;                                   // InProc by default
var cart = Session["Cart"] as Cart ?? new Cart();
Application.Lock(); Application["Visitors"] = (int)(Application["Visitors"] ?? 0) + 1; Application.UnLock();
Cache.Insert("Categories", categories, null, DateTime.Now.AddMinutes(30), Cache.NoSlidingExpiration);
Response.Cookies.Add(new HttpCookie("theme", "dark") { Expires = DateTime.Now.AddDays(30), HttpOnly = true, Secure = true });
Response.Redirect("Orders.aspx?customerId=" + customerId, endResponse: false);
```

**Session modes** (web.config `<sessionState mode="...">`): **InProc** (fastest; lost on app-pool recycle; not shared in a web farm), **StateServer** (separate Windows service; survives recycles), **SQLServer** (durable, shared across a farm), **Custom** (Redis provider), **Off**. Objects stored out-of-process must be `[Serializable]`.

**Page navigation:** `Response.Redirect` (browser makes a new request — URL changes, 302), `Server.Transfer` (server switches page — URL doesn't change, same request), cross-page posting (`PostBackUrl`).

# Module: Building Pages

## Lesson: [Intermediate|High] Validation controls, master pages, themes and user controls

**Validation controls** (client-side JavaScript + server-side check, `Page.IsValid`):

| Control | Checks |
|---|---|
| `RequiredFieldValidator` | Value entered |
| `CompareValidator` | Compare with another control/value/type (`Operator="DataTypeCheck"`) |
| `RangeValidator` | Between min and max |
| `RegularExpressionValidator` | Pattern (email, phone) |
| `CustomValidator` | Your own function (`OnServerValidate`, `ClientValidationFunction`) |
| `ValidationSummary` | Shows all errors in one place |

`ValidationGroup` separates groups of validators on one page; `CausesValidation="false"` on Cancel buttons. **Always check `Page.IsValid` on the server** — client scripts can be bypassed.

**Master pages** (layout template):

```aspx
<%@ Master Language="C#" CodeBehind="Site.master.cs" Inherits="ShopWeb.SiteMaster" %>
<html><head runat="server"><title></title></head>
<body><form runat="server">
  <header>Divakar Shop</header>
  <asp:ContentPlaceHolder ID="MainContent" runat="server" />
  <footer>© 2026</footer>
</form></body></html>
```

Access the master from a page with `<%@ MasterType VirtualPath="~/Site.Master" %>` and `Master.SomeProperty`. Nested master pages are allowed. **Event order:** at runtime the master page becomes a child control of the page. `Init` (and `Unload`) run child-first, so the master's `Init` runs before the page's `Init`; `Load` and `PreRender` run parent-first, so the page's `Load` runs before the master's `Load`.

**Themes and skins:** `App_Themes/Dark/Controls.skin` sets default control properties (`<asp:Button runat="server" CssClass="btn btn-dark" />`); apply with `Theme="Dark"` in the page or web.config `<pages theme="Dark">`.

**User controls (.ascx)** — reusable page fragments with their own markup and code-behind:

```aspx
<%@ Control Language="C#" CodeBehind="AddressEditor.ascx.cs" Inherits="ShopWeb.Controls.AddressEditor" %>
<asp:TextBox ID="txtCity" runat="server" />
```

```csharp
public partial class AddressEditor : UserControl
{
    public string City { get => txtCity.Text; set => txtCity.Text = value; }   // expose properties
    public event EventHandler? AddressChanged;                                  // and events
}
```

```aspx
<%@ Register Src="~/Controls/AddressEditor.ascx" TagPrefix="uc" TagName="Address" %>
<uc:Address ID="shipping" runat="server" />
```

(Custom server controls compiled into DLLs are covered in the **Custom Controls & Components** course.)

## Lesson: [Intermediate|High] Data binding — GridView, Repeater, ListView and data source controls

| Control | Output | Paging/sorting/editing built in | Use |
|---|---|---|---|
| **GridView** | HTML table | ✅ | Admin grids with edit/delete |
| **Repeater** | Exactly your template HTML | ❌ (do it yourself) | Lightweight custom lists |
| **ListView** | Your templates + layout | ✅ (with DataPager) | Flexible lists with editing |
| DataList | Table/flow layout | Partial | Legacy |
| DetailsView / FormView | One record | ✅ | Detail/edit forms |

```aspx
<asp:Repeater ID="rptOrders" runat="server" ItemType="ShopWeb.Models.OrderDto">
  <ItemTemplate>
    <div class="order"><%#: Item.Id %> — <%#: Item.Total.ToString("C") %></div>
  </ItemTemplate>
</asp:Repeater>

<!-- ASP.NET 4.5 model binding: the grid calls your methods -->
<asp:GridView ID="gv" runat="server" ItemType="ShopWeb.Models.Product" DataKeyNames="Id"
     SelectMethod="GetProducts" UpdateMethod="UpdateProduct" AllowPaging="true" AllowSorting="true" AutoGenerateEditButton="true" />
```

```csharp
public IQueryable<Product> GetProducts() => _db.Products.OrderBy(p => p.Name);   // paging/sorting applied by the grid
public void UpdateProduct(int id)
{
    var p = _db.Products.Find(id);
    if (p != null && TryUpdateModel(p)) _db.SaveChanges();
}
```

**Data source controls:** `SqlDataSource` (SQL in markup — quick but mixes data access into the UI), `ObjectDataSource` (calls methods on your business class — better layering), `EntityDataSource`, `LinqDataSource`. Prefer model binding or code-behind binding to services.

GridView events: `RowDataBound` (format each row), `RowCommand` (custom buttons with `CommandName`/`CommandArgument`), `RowEditing`/`RowUpdating`/`RowDeleting`, `PageIndexChanging`, `Sorting`.

## Lesson: [Intermediate|Medium] AJAX in Web Forms — ScriptManager, UpdatePanel and page methods

```aspx
<asp:ScriptManager runat="server" />
<asp:UpdatePanel ID="upCart" runat="server" UpdateMode="Conditional">
  <ContentTemplate>
    <asp:Label ID="lblCount" runat="server" />
    <asp:Button ID="btnAdd" runat="server" Text="Add" OnClick="btnAdd_Click" />
  </ContentTemplate>
</asp:UpdatePanel>
<asp:UpdateProgress runat="server" AssociatedUpdatePanelID="upCart"><ProgressTemplate>Loading…</ProgressTemplate></asp:UpdateProgress>
```

An **UpdatePanel** performs a *partial postback*: the **whole page life cycle still runs on the server** and the full ViewState is posted, but only the panel's HTML is replaced in the browser. It feels faster but isn't lighter on the server. Alternatives: `[WebMethod]` page methods / ASMX or Web API endpoints called with jQuery `$.ajax` / `fetch` for truly light calls.

# Module: Application Configuration, Security and Errors

## Lesson: [Intermediate|High] Global.asax, web.config, HTTP modules and handlers

```csharp
public class Global : HttpApplication
{
    protected void Application_Start(object sender, EventArgs e)     // once per app domain start
    {
        RouteConfig.RegisterRoutes(RouteTable.Routes);
        BundleConfig.RegisterBundles(BundleTable.Bundles);
    }
    protected void Session_Start(object sender, EventArgs e) { }      // new user session
    protected void Application_BeginRequest(object sender, EventArgs e) { }
    protected void Application_Error(object sender, EventArgs e)      // unhandled exceptions — log here
    {
        var ex = Server.GetLastError();
        Logger.Error(ex);
    }
    protected void Session_End(object sender, EventArgs e) { }        // InProc session mode only
    protected void Application_End(object sender, EventArgs e) { }
}
```

```xml
<configuration>
  <connectionStrings>
    <add name="Shop" connectionString="Server=.;Database=Shop;Integrated Security=true" providerName="System.Data.SqlClient" />
  </connectionStrings>
  <appSettings><add key="PageSize" value="20" /></appSettings>
  <system.web>
    <compilation debug="false" targetFramework="4.8" />            <!-- debug=false in production! -->
    <httpRuntime targetFramework="4.8" maxRequestLength="10240" />
    <authentication mode="Forms"><forms loginUrl="~/Account/Login.aspx" timeout="30" requireSSL="true" /></authentication>
    <sessionState mode="InProc" timeout="20" />
    <customErrors mode="RemoteOnly" defaultRedirect="~/Error.aspx">
      <error statusCode="404" redirect="~/NotFound.aspx" />
    </customErrors>
  </system.web>
  <location path="Admin">
    <system.web><authorization><allow roles="Admin" /><deny users="*" /></authorization></system.web>
  </location>
  <system.webServer>
    <modules><add name="AuditModule" type="ShopWeb.Infrastructure.AuditModule" /></modules>
    <httpErrors errorMode="DetailedLocalOnly" />
  </system.webServer>
</configuration>
```

Config inheritance: `machine.config` → root `web.config` (Framework folder) → site `web.config` → sub-folder `web.config`s. Changing web.config **restarts the application**.

**HTTP module** (`IHttpModule`) — hooks pipeline events for every request (auth, logging, URL rewriting). **HTTP handler** (`IHttpHandler`) — produces the response for a request type (`.aspx` page handler, `.ashx` generic handler for files/images/JSON).

```csharp
public class ThumbnailHandler : IHttpHandler          // Thumbnail.ashx
{
    public bool IsReusable => true;
    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "image/png";
        context.Response.BinaryWrite(ImageService.Thumbnail(context.Request.QueryString["id"]));
    }
}
```

## Lesson: [Intermediate|High] Authentication, security and custom error handling in Web Forms

- **Windows authentication** (intranet, Active Directory) or **Forms authentication** (login page + encrypted auth cookie, `FormsAuthentication.SetAuthCookie`); later **ASP.NET Identity** (OWIN) replaced Membership providers.
- Authorization in web.config `<authorization>` per folder/page, or in code `User.IsInRole("Admin")`.
- Built-in protections: request validation (blocks `<script>` in input), ViewState MAC, event validation; still **HTML-encode output** (`<%: %>`, `Server.HtmlEncode`), use parameterised SQL, set `ViewStateUserKey` against CSRF, `requireSSL`, `HttpOnly` cookies.

**Error handling levels (most specific first):**

```csharp
// 1. try/catch around risky code in the event handler
// 2. Page level
protected void Page_Error(object sender, EventArgs e)
{
    var ex = Server.GetLastError();
    Logger.Error(ex, "Error on " + Request.Url);
    Server.ClearError();
    Response.Redirect("~/Error.aspx", false);
}
// 3. Application level — Global.asax Application_Error (logs everything unhandled)
// 4. web.config <customErrors> (ASP.NET) and <httpErrors> (IIS) — friendly pages, never show stack traces to users
```

`customErrors mode="On"` shows custom pages to everyone; `RemoteOnly` shows details only on the server; `Off` shows the "yellow screen of death" — never in production. ELMAH or log4net/NLog/Serilog capture errors (see the **Exception Handling** and **Logging** courses).

## Lesson: [Advanced|Medium] Performance tuning and migrating Web Forms to modern .NET

**Performance:**

- Disable ViewState where not needed; page GridViews server-side; avoid huge UpdatePanels.
- Output caching: `<%@ OutputCache Duration="60" VaryByParam="id" %>`; data caching with `Cache`.
- `compilation debug="false"`; bundling and minification; compress static files in IIS.
- Async pages (`Async="true"` + `RegisterAsyncTask`) for slow I/O.
- Session: avoid storing large objects; use `EnableSessionState="ReadOnly"` or `False` where possible (session locking serialises requests from one user).

**Migration options:**

| Target | Effort | Notes |
|---|---|---|
| Stay on .NET Framework 4.8 | None | Supported with Windows; no new features |
| **ASP.NET Core MVC / Razor Pages** | High (rewrite UI) | Most common target; reuse business/data layers if extracted |
| **Blazor** (Server or United/Web App) | High | Component + event model feels closer to Web Forms |
| Incremental (strangler) | Medium, spread over time | YARP/IIS ARR routes migrated paths to the new Core app; share auth cookie and database; System.Web adapters help share session |

Steps: extract business logic from code-behind into class libraries (`netstandard2.0`), add tests, set up the new app beside the old, migrate page by page, retire old pages.

# Interview

## [Beginner|High] Explain the ASP.NET Web Forms page life cycle.

Page request → start (IsPostBack set) → PreInit (set master/theme, create dynamic controls) → Init (controls initialised) → InitComplete → load ViewState and postback data (postbacks) → PreLoad → Load (page then controls; load data in `!IsPostBack`) → control events (change events, then the Click that caused the postback) → LoadComplete → PreRender (final changes) → SaveStateComplete (ViewState saved) → Render (HTML written) → Unload (cleanup). Mnemonic SILVER: Start, Init, Load, Validate, Event, Render.

## [Beginner|High] What is ViewState? Pros and cons?

A hidden form field (`__VIEWSTATE`) holding base64-encoded, MAC-signed state of controls (and your own values) so they survive postbacks of the same page without server memory. Pros: automatic, per-page, no server storage. Cons: increases page size and request time, not secure by default (only signed, not encrypted), can't be used across pages. Disable it where unnecessary and never store sensitive data.

## [Beginner|High] What is PostBack and IsPostBack?

A postback is the form submitting back to the same page so server-side events (button clicks, selection changes) can run. `IsPostBack` is false on the first request and true on postbacks — load initial data only when `!IsPostBack`, otherwise you overwrite the user's input and waste database calls.

## [Beginner|High] What state management options exist in ASP.NET?

Client-side: ViewState, ControlState, hidden fields, cookies, query strings. Server-side: Session (InProc, StateServer, SQLServer, custom), Application, Cache, Profile. Choose by scope (page, user, all users), size, security and whether it must survive restarts or work in a web farm.

## [Beginner|High] Response.Redirect vs Server.Transfer?

`Response.Redirect` sends a 302 to the browser, which makes a new request — URL changes, works for any URL, an extra round trip, previous page data lost unless passed. `Server.Transfer` switches execution to another page on the server within the same request — URL in the browser stays the same, faster, can access the previous page (`PreviousPage`), only within the same application.

## [Intermediate|High] What are the Session state modes? Which would you use in a web farm?

InProc (in the worker process memory — fastest, lost on app-pool recycle, not shared), StateServer (aspnet_state service — survives recycles, shared, serialisation needed), SQLServer (stored in SQL — durable, shared, slower), Custom (e.g. Redis provider), Off. In a web farm use SQLServer, StateServer or a Redis custom provider (or sticky sessions as a weaker alternative).

## [Intermediate|High] User control vs custom control?

A user control (.ascx) is markup + code-behind built visually and reused within one application (registered with `@Register Src=`). A custom (server) control is a class deriving from `Control`/`WebControl`/`CompositeControl` that renders its own HTML, compiled into a DLL, reusable across applications, can appear in the Toolbox and support design-time features — more work to build.

## [Intermediate|High] What are master pages and how do content pages use them?

A master page (`.master`) defines a shared layout with `ContentPlaceHolder`s; content pages specify `MasterPageFile` and fill placeholders with `<asp:Content>`. At runtime the master page is merged into the page's control tree (as a child control). Access it with `Master` (strongly typed via `@MasterType`), switch it dynamically in `PreInit`, nest masters for sections.

## [Intermediate|High] What is the role of Global.asax and web.config?

Global.asax holds application-level event handlers: Application_Start/End, Session_Start/End, BeginRequest, AuthenticateRequest, Application_Error. Web.config holds hierarchical configuration: connection strings, app settings, authentication/authorization, session, custom errors, modules/handlers, compilation; changes restart the app.

## [Intermediate|Medium] HTTP module vs HTTP handler?

Modules (`IHttpModule`) subscribe to pipeline events and run for every request — authentication, logging, URL rewriting, compression. Handlers (`IHttpHandler`) generate the response for specific requests/extensions — the Page handler for `.aspx`, `.ashx` generic handlers for images or files. A request passes through many modules but is processed by one handler.

## [Intermediate|Medium] What does an UpdatePanel actually do?

It turns a full postback into an asynchronous partial postback: the browser still posts the whole form including ViewState, the server runs the full page life cycle, but only the panel's markup (and updated ViewState) is returned and replaced. It improves perceived responsiveness, not server load. For light calls use page methods or Web API with JavaScript.

## [Intermediate|Medium] How do you handle errors globally in Web Forms?

Try/catch for expected errors in handlers; `Page_Error` for page-level handling; `Application_Error` in Global.asax to log every unhandled exception (`Server.GetLastError()`), then `customErrors`/`httpErrors` in web.config to show friendly error pages (404, 500) instead of details. Use a logging framework or ELMAH.

## [Advanced|Medium] Why does a dynamically added control lose its value or events after postback?

Because controls created in code must be recreated on every request, with the same IDs, **early enough** (PreInit/Init) for ViewState and posted data to be applied and events to fire. Creating them in Load or only on the first request (`!IsPostBack`) means the control doesn't exist when the framework restores state and raises events.

## [Advanced|Medium] What is the difference between a Web Site project and a Web Application project?

Web Site: no project file, files compiled dynamically on the server (each page/folder its own assembly), `App_Code` for shared classes, easy to edit live but harder to manage. Web Application: `.csproj`, compiled ahead into one assembly in `bin`, designer files, better for builds, refactoring, source control and deployment — the standard for professional projects.

## [Scenario|High] A Web Forms page with a big GridView is very slow to post back. How do you fix it?

Measure page size: ViewState of the GridView is likely hundreds of KB. Disable ViewState on the grid and rebind on postback, or keep only keys; use server-side paging (load only the current page from the database) instead of binding thousands of rows; replace UpdatePanels around the grid with lighter AJAX calls if needed; cache reference data; check SQL queries and session locking.

## [Scenario|High] You must add a new feature to a legacy Web Forms app while the company plans to move to ASP.NET Core. How do you build it?

Put the business logic in a separate class library (netstandard2.0 or .NET Framework library with clean interfaces) and unit-test it; keep code-behind thin, calling services. If the feature is a new area, consider building it directly in the new ASP.NET Core app behind a reverse proxy sharing authentication (strangler pattern), so it doesn't need to be migrated later.

## [Scenario|Medium] Users randomly lose their session (shopping cart) in production. What could cause it?

InProc session lost when the app pool recycles (scheduled recycling, memory limits, web.config/bin changes, crashes) or when requests hit different servers in a web farm without shared session; session timeout too short; cookieless/cookie issues. Fix: StateServer/SQLServer/Redis session, review recycling settings, store less in session, sticky sessions only as a stop-gap.

# Cheatsheet

## Page life cycle

PreInit → Init → InitComplete → (LoadViewState, LoadPostData) → PreLoad → **Load** → control events → LoadComplete → **PreRender** → SaveStateComplete → **Render** → Unload.

## Application pipeline

BeginRequest → Authenticate → Authorize → ResolveRequestCache → AcquireRequestState → PreRequestHandlerExecute → handler (Page) → PostRequestHandlerExecute → ReleaseRequestState → UpdateRequestCache → EndRequest.

## State options

Page: ViewState/ControlState/hidden field · request: query string · browser: cookies · user: Session (InProc/StateServer/SQL/Redis) · all users: Application/Cache.

## Folders & files

App_Code · App_Data · App_Start · App_Themes · App_GlobalResources · bin · .aspx + .aspx.cs + .designer.cs · .master · .ascx · .ashx · Global.asax · Web.config (+ transforms).

## Errors

try/catch → Page_Error → Application_Error (log) → customErrors/httpErrors (friendly pages) · never `debug="true"` or `customErrors="Off"` in production.
