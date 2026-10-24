---
slug: custom-controls
title: Custom Controls & Reusable UI Components in .NET — Web Forms to Blazor
track: dotnet
order: 18
group: Errors, Logging & UI Components
icon: UI
color: #d6336c
summary: Building reusable UI in every .NET UI technology — Web Forms user controls and custom server controls (Control, WebControl, CompositeControl, rendering, ViewState-backed properties, events, postback data, templated controls, design-time attributes), MVC 5 custom HTML helpers, display/editor templates and child actions, ASP.NET Core partial views, custom tag helpers, view components and Razor Class Libraries, Blazor components (parameters, EventCallback, RenderFragment, cascading values, generic components) and WinForms/WPF custom controls.
---

# Overview

A **custom control/component** packages markup + behaviour so it can be reused across pages or applications: a date picker, an address editor, a paged grid, a price label that formats currency, a "cart summary" widget.

| Technology | Reuse options (simple → powerful) |
|---|---|
| ASP.NET Web Forms | User control (.ascx) → custom server control (class, compiled DLL) → composite/templated control |
| ASP.NET MVC 5 | Partial view → display/editor template → **custom HTML helper** → child action |
| ASP.NET Core MVC/Razor Pages | Partial view → **tag helper** → **view component** → Razor Class Library (package for many apps) |
| Blazor | **Razor component** (`.razor`) with parameters, events, child content; component libraries |
| WinForms / WPF | UserControl → derived control → owner-drawn/custom control with templates (WPF) |

Interview focus: the **difference between user controls and custom controls**, **tag helpers vs HTML helpers**, **view components vs partial views**, and how state/events work in components.

# Versions

| Year | Milestone |
|---|---|
| 2002 | Web Forms server controls, user controls, `Control`/`WebControl` base classes; WinForms UserControl |
| 2005 | ASP.NET 2.0 `CompositeControl`, control state, adaptive rendering; WPF in 2006 (templated controls) |
| 2009–2011 | MVC HTML helpers, Razor (2011), display/editor templates |
| 2016 | ASP.NET Core tag helpers and view components |
| 2018–2019 | Razor Class Libraries (Core 2.1), Blazor (3.0) components |
| 2023–2025 | .NET 8 Blazor Web App (static SSR + interactive render modes), QuickGrid; component libraries (MudBlazor, Radzen, Telerik, Syncfusion) |

# Lifecycle

**How a reusable component is designed:**

1. **Identify repetition** — same markup/logic on 3+ pages.
2. **Define the API** — inputs (properties/parameters/attributes), outputs (events/callbacks), slots (child content/templates).
3. **Encapsulate** markup, styling and behaviour; avoid reaching into the page.
4. **Handle state** — Web Forms: ViewState/ControlState; Blazor: component fields + parameters; MVC/Core: stateless per request.
5. **Package** — same project, shared class library, Razor Class Library or NuGet package.
6. **Document and test** — examples, unit tests (bUnit for Blazor), accessibility checks.

# Tools

- Visual Studio designers and Toolbox (Web Forms/WinForms), `[ToolboxData]`, `[Designer]` attributes.
- Razor Class Library template (`dotnet new razorclasslib`), NuGet packaging.
- **bUnit** for testing Blazor components; Playwright for UI tests.
- Component libraries for reference: Telerik/DevExpress (Web Forms), MudBlazor/Radzen/FluentUI Blazor (Blazor).

# Module: Web Forms Controls

## Lesson: [Basic|High] User controls vs custom server controls

| | User control (`.ascx`) | Custom server control (class) |
|---|---|---|
| Built with | Markup + code-behind (designer support) | Code only (C#/VB), renders its own HTML |
| Reuse | Within one web application (needs the .ascx file) | Across applications (compiled DLL), Toolbox support |
| Effort | Low | Higher |
| Design-time | Basic | Rich (designers, smart tags, property grid) |
| Registration | `<%@ Register Src="~/Controls/X.ascx" TagPrefix="uc" TagName="X" %>` | `<%@ Register Assembly="Shop.Controls" Namespace="Shop.Controls" TagPrefix="shop" %>` or web.config `<controls>` |
| Example | Address editor, login box for this site | Reusable `<shop:Money>` label, rating control sold to many projects |

User controls were covered in the Web Forms course; here we build **custom controls**.

## Lesson: [Intermediate|High] Building a custom server control — rendering, properties and ViewState

```csharp
[DefaultProperty(nameof(Amount))]
[ToolboxData("<{0}:MoneyLabel runat=\"server\" />")]
public class MoneyLabel : WebControl                   // WebControl adds style properties (CssClass, Font, etc.)
{
    public MoneyLabel() : base(HtmlTextWriterTag.Span) { }

    [Category("Data"), DefaultValue(typeof(decimal), "0")]
    public decimal Amount
    {
        get => (decimal?)ViewState[nameof(Amount)] ?? 0m;   // ViewState-backed so it survives postbacks
        set => ViewState[nameof(Amount)] = value;
    }

    [Category("Appearance"), DefaultValue("en-IN")]
    public string Culture
    {
        get => (string?)ViewState[nameof(Culture)] ?? "en-IN";
        set => ViewState[nameof(Culture)] = value;
    }

    protected override void AddAttributesToRender(HtmlTextWriter writer)
    {
        base.AddAttributesToRender(writer);                  // id, class, style
        if (Amount < 0) writer.AddAttribute(HtmlTextWriterAttribute.Class, CssClass + " negative");
    }

    protected override void RenderContents(HtmlTextWriter writer)
        => writer.WriteEncodedText(Amount.ToString("C", CultureInfo.GetCultureInfo(Culture)));
}
```

```aspx
<%@ Register Assembly="Shop.Controls" Namespace="Shop.Controls" TagPrefix="shop" %>
<shop:MoneyLabel ID="lblTotal" runat="server" Amount="4500" CssClass="price" />
```

Base classes:

| Base | Use |
|---|---|
| `Control` | Minimal: no style properties; override `Render` |
| `WebControl` | Adds `CssClass`, `Style`, `Enabled`, tag rendering (`RenderBeginTag`/`RenderContents`) |
| `CompositeControl` | Builds child controls (`CreateChildControls`) — reuse existing TextBoxes/Buttons |
| `DataBoundControl` / `CompositeDataBoundControl` | Bind to data sources (`DataSource`, `DataBind`) |
| Existing control (e.g. `TextBox`) | Extend behaviour (a `NumericTextBox`) |

## Lesson: [Intermediate|Medium] Composite controls, events, postback data and templates

```csharp
// Composite control: label + textbox + validator + event
public class SearchBox : CompositeControl, INamingContainer
{
    private TextBox _text = null!;
    private Button _button = null!;
    public event EventHandler<string>? Search;              // expose an event to the page

    public string Placeholder { get => (string?)ViewState["Ph"] ?? "Search"; set => ViewState["Ph"] = value; }

    protected override void CreateChildControls()          // create children on every request (postbacks too)
    {
        Controls.Clear();
        _text = new TextBox { ID = "q" };
        _text.Attributes["placeholder"] = Placeholder;
        _button = new Button { ID = "go", Text = "Go" };
        _button.Click += (s, e) => Search?.Invoke(this, _text.Text.Trim());
        Controls.Add(_text);
        Controls.Add(_button);
    }
}
```

- **INamingContainer** gives child controls unique client ids (`SearchBox1$q`).
- **IPostBackDataHandler** — implement `LoadPostData`/`RaisePostDataChangedEvent` for controls that read posted form values themselves.
- **IPostBackEventHandler** — `RaisePostBackEvent` for controls that trigger postbacks (`Page.ClientScript.GetPostBackEventReference`).
- **Templated controls** — `[TemplateContainer]` + `ITemplate` properties (`ItemTemplate`, `EmptyTemplate`) let users supply markup, like Repeater.
- **ControlState** (`OnInit: Page.RegisterRequiresControlState(this)`, override `SaveControlState/LoadControlState`) for state that must work even with ViewState disabled.
- Embedded resources (JS/CSS/images) via `[assembly: WebResource]` and `ClientScript.GetWebResourceUrl`.

# Module: MVC and ASP.NET Core Components

## Lesson: [Intermediate|High] MVC 5: custom HTML helpers, display/editor templates and child actions

```csharp
public static class HtmlHelperExtensions
{
    // Simple helper
    public static MvcHtmlString Money(this HtmlHelper html, decimal amount, string culture = "en-IN")
    {
        var tag = new TagBuilder("span");
        tag.AddCssClass(amount < 0 ? "money negative" : "money");
        tag.SetInnerText(amount.ToString("C", CultureInfo.GetCultureInfo(culture)));   // encodes text
        return MvcHtmlString.Create(tag.ToString());
    }

    // Strongly typed helper with an expression (like TextBoxFor)
    public static MvcHtmlString RatingFor<TModel>(this HtmlHelper<TModel> html, Expression<Func<TModel, int>> expr, int max = 5)
    {
        var name = ExpressionHelper.GetExpressionText(expr);
        var value = (int)(ModelMetadata.FromLambdaExpression(expr, html.ViewData).Model ?? 0);
        var sb = new StringBuilder("<span class=\"rating\">");
        for (int i = 1; i <= max; i++)
            sb.Append($"<label><input type=\"radio\" name=\"{HttpUtility.HtmlAttributeEncode(name)}\" value=\"{i}\" {(i == value ? "checked" : "")}/>★</label>");
        return MvcHtmlString.Create(sb.Append("</span>").ToString());
    }
}
```

```cshtml
@Html.Money(Model.Total)
@Html.RatingFor(m => m.Stars)
```

Register the namespace in `Views/web.config` (`<add namespace="Shop.Web.Helpers" />`) so all views see it.

**Razor `@helper`** (MVC 5 only) — inline helpers in `App_Code/Helpers.cshtml`. **Display/editor templates** — `Views/Shared/DisplayTemplates/Money.cshtml` used by `Html.DisplayFor(m => m.Price)` when the property has `[UIHint("Money")]` or matches the type name. **Child actions** (`Html.Action`) for self-contained widgets with their own data.

## Lesson: [Intermediate|High] ASP.NET Core: custom tag helpers

Tag helpers let server code participate in rendering **HTML-looking elements and attributes** — editor-friendly and readable.

```csharp
// <money amount="Model.Total" culture="en-IN"></money>  →  <span class="money">₹4,500.00</span>
[HtmlTargetElement("money")]
public sealed class MoneyTagHelper : TagHelper
{
    public decimal Amount { get; set; }
    public string Culture { get; set; } = "en-IN";

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = "span";
        output.TagMode = TagMode.StartTagAndEndTag;
        output.Attributes.SetAttribute("class", Amount < 0 ? "money negative" : "money");
        output.Content.SetContent(Amount.ToString("C", CultureInfo.GetCultureInfo(Culture)));   // SetContent HTML-encodes
    }
}

// Attribute tag helper: <button asp-confirm="Delete this order?">Delete</button>
[HtmlTargetElement(Attributes = "asp-confirm")]
public sealed class ConfirmTagHelper : TagHelper
{
    [HtmlAttributeName("asp-confirm")] public string Message { get; set; } = "";
    public override void Process(TagHelperContext context, TagHelperOutput output)
        => output.Attributes.SetAttribute("onclick", $"return confirm('{JavaScriptEncoder.Default.Encode(Message)}');");
}
```

```cshtml
@* Views/_ViewImports.cshtml *@
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
@addTagHelper *, Shop.Web

<money amount="Model.Total"></money>
<button type="submit" asp-confirm="Delete this order?">Delete</button>
```

| HTML helper (`@Html.TextBoxFor`) | Tag helper (`<input asp-for>`) |
|---|---|
| C# method call in markup | HTML element/attribute |
| Harder for designers to read | Looks like HTML, IntelliSense for attributes |
| Available in MVC 5 and Core | ASP.NET Core only |

Async tag helpers override `ProcessAsync` (e.g. to load data or get child content with `output.GetChildContentAsync()`).

## Lesson: [Intermediate|High] ASP.NET Core: view components vs partial views

A **view component** is a mini-controller + view for a reusable widget that needs its **own data and logic** (replaces MVC 5 child actions).

```csharp
public sealed class CartSummaryViewComponent(ICartService carts) : ViewComponent
{
    public async Task<IViewComponentResult> InvokeAsync(int maxItems = 3)
    {
        var cart = await carts.GetForUserAsync(UserClaimsPrincipal);
        return View(cart.Take(maxItems));                    // Views/Shared/Components/CartSummary/Default.cshtml
    }
}
```

```cshtml
@await Component.InvokeAsync("CartSummary", new { maxItems = 5 })
<vc:cart-summary max-items="5"></vc:cart-summary>          @* tag-helper syntax *@
```

| | Partial view | View component | Tag helper |
|---|---|---|---|
| Data | Passed in by the parent | Loads its own (DI, async) | Attributes |
| Logic | Minimal | Yes (class with DI) | Rendering logic |
| Typical use | Repeated markup (product card) | Widgets: cart summary, menu, recent posts | Element/attribute enhancement |
| Can be called from a controller | `PartialView()` | `ViewComponent()` result | — |

**Razor Class Library (RCL):** put views, view components, tag helpers, Razor Pages and static assets (`wwwroot` → `_content/LibName/...`) in a class library and reference it (or ship as NuGet) to reuse UI across apps.

# Module: Blazor and Desktop Components

## Lesson: [Intermediate|High] Blazor components — parameters, events, child content and generics

```razor
@* Components/ConfirmButton.razor *@
<button class="btn @CssClass" @onclick="AskAsync" disabled="@_busy">@ChildContent</button>
@if (_asking)
{
    <div class="confirm">
        <span>@Message</span>
        <button @onclick="() => ConfirmAsync(true)">Yes</button>
        <button @onclick="() => ConfirmAsync(false)">No</button>
    </div>
}

@code {
    [Parameter] public string Message { get; set; } = "Are you sure?";
    [Parameter] public string CssClass { get; set; } = "btn-danger";
    [Parameter] public RenderFragment? ChildContent { get; set; }          // content between the tags
    [Parameter] public EventCallback OnConfirmed { get; set; }             // event to the parent
    private bool _asking, _busy;

    private void AskAsync() => _asking = true;
    private async Task ConfirmAsync(bool yes)
    {
        _asking = false;
        if (!yes) return;
        _busy = true;
        await OnConfirmed.InvokeAsync();                                   // parent's handler runs, UI re-renders
        _busy = false;
    }
}
```

```razor
<ConfirmButton Message="Delete this order?" OnConfirmed="DeleteOrderAsync">Delete</ConfirmButton>
```

```razor
@* Generic, templated component *@
@typeparam TItem
<table class="table">
    <thead><tr>@Header</tr></thead>
    <tbody>@foreach (var item in Items) { <tr>@Row(item)</tr> }</tbody>
</table>
@code {
    [Parameter, EditorRequired] public IReadOnlyList<TItem> Items { get; set; } = [];
    [Parameter] public RenderFragment? Header { get; set; }
    [Parameter, EditorRequired] public RenderFragment<TItem> Row { get; set; } = default!;
}
```

Key concepts: **lifecycle** (`OnInitialized(Async)`, `OnParametersSet(Async)`, `OnAfterRender(Async)`, `Dispose`), `StateHasChanged()`, `@bind` / `@bind-Value` two-way binding (`Value` + `ValueChanged` parameters), **CascadingValue**/`[CascadingParameter]` for shared context (theme, auth state), `@key` for list diffing, render modes in .NET 8+ (Static SSR, InteractiveServer, InteractiveWebAssembly, InteractiveAuto), JS interop (`IJSRuntime`), CSS isolation (`Component.razor.css`).

## Lesson: [Intermediate|Medium] WinForms and WPF custom controls

**WinForms:**

| Approach | How |
|---|---|
| UserControl | Combine existing controls in the designer (address panel) |
| Inherited control | `class NumericTextBox : TextBox` — override `OnKeyPress` to allow digits only |
| Owner-drawn / custom-drawn | `class Gauge : Control` — override `OnPaint(PaintEventArgs e)` and draw with GDI+, call `Invalidate()` when data changes |

```csharp
public class NumericTextBox : TextBox
{
    protected override void OnKeyPress(KeyPressEventArgs e)
    {
        if (!char.IsControl(e.KeyChar) && !char.IsDigit(e.KeyChar)) e.Handled = true;   // block non-digits
        base.OnKeyPress(e);
    }
}
```

**WPF:** **UserControl** (XAML composition) vs **custom control** (`Control` subclass with a default **ControlTemplate** in `Themes/Generic.xaml`, fully re-stylable); expose data through **dependency properties** (support binding, styling, animation) and **routed events**.

```csharp
public class RatingControl : Control
{
    public static readonly DependencyProperty ValueProperty =
        DependencyProperty.Register(nameof(Value), typeof(int), typeof(RatingControl), new FrameworkPropertyMetadata(0, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault));
    public int Value { get => (int)GetValue(ValueProperty); set => SetValue(ValueProperty, value); }
    static RatingControl() => DefaultStyleKeyProperty.OverrideMetadata(typeof(RatingControl), new FrameworkPropertyMetadata(typeof(RatingControl)));
}
```

## Lesson: [Advanced|Medium] Designing good reusable components

- **Small, focused API:** few required inputs, sensible defaults, clear names.
- **No hidden dependencies on the page:** pass data in; raise events out.
- **Encode output** (XSS): use the framework's encoding (`WriteEncodedText`, `SetContent`, Razor `@`).
- **Accessibility:** proper labels, keyboard support, ARIA where needed, focus management in dialogs.
- **Styling hooks:** CSS classes/parameters; CSS isolation in Blazor; themes/skins in Web Forms.
- **Performance:** avoid heavy ViewState (Web Forms), avoid re-rendering large lists (Blazor `@key`, `ShouldRender`, virtualization), cache data in view components when safe.
- **Versioning & packaging:** shared library/RCL/NuGet with semantic versions; document breaking changes.
- **Testing:** bUnit (Blazor), unit tests for tag helpers (`TagHelperOutput`), UI tests for critical widgets.

# Interview

## [Beginner|High] What is the difference between a user control and a custom control in ASP.NET?

User control (.ascx): created with markup + code-behind, easy to build, reusable only within the same web application (the .ascx file must be present), limited design-time support. Custom server control: a compiled class deriving from `Control`/`WebControl`/`CompositeControl` that renders its own HTML; reusable across applications via a DLL, can be added to the Toolbox with designer support, more effort to build.

## [Beginner|High] What is a custom HTML helper in MVC and how do you create one?

An extension method on `HtmlHelper` (or `HtmlHelper<TModel>`) returning `MvcHtmlString`/`IHtmlContent` that generates reusable markup, e.g. `@Html.Money(total)`. Build HTML with `TagBuilder` (which encodes text), import the namespace in `Views/web.config` (MVC 5) or `_ViewImports.cshtml` (Core).

## [Beginner|High] What are tag helpers? How do they differ from HTML helpers?

Tag helpers are classes that process HTML elements/attributes in Razor (`<input asp-for="Name">`, custom `<money amount="...">`), producing HTML on the server. They look like HTML (designer-friendly, attribute IntelliSense) versus HTML helpers which are C# method calls (`@Html.TextBoxFor(...)`). Tag helpers exist only in ASP.NET Core; both can be mixed.

## [Intermediate|High] View component vs partial view?

A partial view renders markup with data provided by the caller; a view component is a class with its own logic and dependencies (constructor injection, async `InvokeAsync`) plus a view — for widgets that fetch their own data (cart summary, navigation menu). View components replace MVC 5 child actions and are lighter than a full controller action.

## [Intermediate|High] How do you create a reusable Blazor component? How does a child notify a parent?

Create a `.razor` file with markup and an `@code` block; expose inputs as `[Parameter]` properties, content slots as `RenderFragment` (`ChildContent`, templates `RenderFragment<T>`), and notify the parent through `[Parameter] EventCallback`/`EventCallback<T>` invoked with `InvokeAsync`, which also triggers the parent's re-render. For two-way binding expose `Value` + `ValueChanged`.

## [Intermediate|Medium] How do you keep a custom Web Forms control's property value across postbacks?

Store it in `ViewState` in the property getter/setter (`ViewState["Amount"]`), which is saved and restored automatically; for essential state that must work even with ViewState disabled use ControlState (`RegisterRequiresControlState`, `SaveControlState/LoadControlState`). Child controls of composite controls must be recreated in `CreateChildControls` on every request.

## [Intermediate|Medium] What is a Razor Class Library?

A class library project that contains Razor views, Razor Pages, view components, tag helpers, Blazor components and static web assets, which other ASP.NET Core apps reference (project or NuGet). It lets teams share UI (layouts, admin areas, component kits) across applications; static files are served from `_content/{LibraryName}/`.

## [Advanced|Medium] What are dependency properties in WPF and why do custom controls use them?

Properties registered with the WPF property system (`DependencyProperty.Register`) whose values can come from bindings, styles, templates, animations and inheritance, with change notifications and default values. Custom controls expose their public properties as dependency properties so consumers can data-bind and style them.

## [Advanced|Medium] How do you test UI components?

Blazor: bUnit renders components in memory, sets parameters, triggers events and asserts markup/callbacks. Tag helpers: unit test `Process` with fake `TagHelperContext`/`TagHelperOutput`. View components: unit test `InvokeAsync` results with mocked services. Web Forms controls: test logic extracted from the control; render tests via `HtmlTextWriter`. End-to-end: Playwright/Selenium.

## [Beginner|Medium] What is the difference between Control, WebControl and CompositeControl in Web Forms?

`Control` is the base of all server controls — no styling properties; you override `Render` and write all HTML. `WebControl` adds common style properties (CssClass, Style, Font, Enabled) and a tag-rendering model (`TagKey`, `AddAttributesToRender`, `RenderContents`). `CompositeControl` builds its UI from child controls in `CreateChildControls` (reusing TextBoxes, Buttons, validators) and handles naming and child-control lifetime for you.

## [Intermediate|Medium] How do you make a Blazor component support two-way binding with @bind-Value?

Expose a `[Parameter] public T Value` and a `[Parameter] public EventCallback<T> ValueChanged` (optionally `ValueExpression` for validation). When the component's internal value changes, call `await ValueChanged.InvokeAsync(newValue)`. The parent can then write `<MyInput @bind-Value="model.Name" />`, which Blazor expands to Value + ValueChanged.

## [Intermediate|Medium] What are display and editor templates in MVC?

Razor partials placed in `Views/Shared/DisplayTemplates` or `EditorTemplates` (or per controller) named after a type (`DateTime.cshtml`, `Money.cshtml`) or selected with `[UIHint("Money")]`. `Html.DisplayFor`/`EditorFor` automatically use them, so every property of that type renders consistently across the site — a lightweight way to build reusable UI without code.

## [Intermediate|Medium] How do you share UI components across several ASP.NET Core applications?

Put them in a Razor Class Library — views, partials, view components, tag helpers, Blazor components and static assets — and reference it as a project or publish it as an internal NuGet package with semantic versioning. Consumers add `@addTagHelper` / `@using` in `_ViewImports`, and static files are available under `_content/{LibraryName}/`.

## [Scenario|High] Twenty MVC pages repeat the same "price with discount badge" markup with slight differences. What do you build?

In ASP.NET Core: a tag helper (`<price amount=".." discount="..">`) if it only needs values passed in, or a partial view/display template for richer markup; a view component if it must fetch data (e.g. live offers). In MVC 5: a custom HTML helper or a display template with `[UIHint]`. Centralising fixes formatting bugs once and keeps pages consistent.

## [Scenario|Medium] A dynamically created custom control in Web Forms loses its value and its Click event doesn't fire. Why?

Its child controls aren't recreated early enough or with the same IDs on postback, so ViewState and posted data can't be applied and the event source isn't found. Create children in `CreateChildControls` (called via `EnsureChildControls`) on every request, implement `INamingContainer`, and add dynamic instances of the control in `Page_Init`/`PreInit`, not inside `if (!IsPostBack)`.

## [Scenario|Medium] A Blazor grid component with 5,000 rows makes the page slow. How do you improve it?

Virtualize rows (`<Virtualize>` component) or page server-side, add `@key` to row elements, avoid re-rendering the whole grid on every change (`ShouldRender`, immutable parameters, split into smaller components), avoid heavy work in `OnParametersSet`, and use QuickGrid or a component library's optimised grid.

# Cheatsheet

## Pick the right reuse tool

Web Forms: user control (one app) → custom/composite control (many apps) · MVC 5: partial/display template → HTML helper → child action · Core: partial → tag helper → view component → Razor Class Library · Blazor: component (+ library) · WinForms/WPF: UserControl → custom control.

## Web Forms control essentials

`WebControl` + `RenderContents` · ViewState-backed properties · `CompositeControl.CreateChildControls` + `INamingContainer` · events · ControlState · `[ToolboxData]`.

## Core essentials

Tag helper: `[HtmlTargetElement]`, `Process(Async)`, `@addTagHelper` · View component: `InvokeAsync`, `Views/Shared/Components/Name/Default.cshtml`, `<vc:name>`.

## Blazor essentials

`[Parameter]` · `EventCallback` · `RenderFragment` / `RenderFragment<T>` · `@typeparam` · `@bind-Value` = Value + ValueChanged · CascadingValue · lifecycle methods · `@key` · Virtualize.

## Good component rules

Small API · data in, events out · encode output · accessible · styleable · tested · versioned.
