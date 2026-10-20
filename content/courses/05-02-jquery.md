---
slug: jquery
title: jQuery
track: frontend
order: 2
icon: $
color: #0769ad
summary: Selectors, traversal, DOM manipulation, events and delegation, effects, AJAX, deferreds, plugins, jQuery with ASP.NET MVC validation, performance and migrating from jQuery to modern JavaScript.
---

# Overview

**jQuery** is a small JavaScript library (created by **John Resig**, 2006) that made DOM manipulation, event handling, animation and AJAX simple and **cross-browser** with a concise API: `$("selector").action()`. "Write less, do more."

It is still found in a huge number of existing websites, WordPress, Bootstrap 3/4 sites and classic **ASP.NET MVC / Web Forms** apps (jQuery Validation + Unobtrusive Validation). New projects usually use plain modern JavaScript or a framework (React/Angular/Vue), so interviews focus on maintaining existing jQuery code and knowing the modern equivalents.

Core ideas:

- `$` (alias of `jQuery`) wraps DOM elements in a **jQuery object** (array-like collection).
- **Implicit iteration** — methods apply to every matched element.
- **Chaining** — most methods return the jQuery object.
- `$(document).ready()` / `$(function(){ })` runs code when the DOM is ready.

# Versions

| Version | Year | Notes |
|---|---|---|
| 1.0 | Aug 2006 | First release |
| 1.3 / 1.4 | 2009 / 2010 | Sizzle selector engine; `.live()` (later removed) |
| 1.5 | 2011 | **Deferred objects**, rewritten AJAX |
| 1.7 | 2011 | **`.on()` / `.off()`** unified event API |
| 1.9 / 2.0 | 2013 | Removal of deprecated APIs; 2.x dropped IE 6–8 |
| **3.0** | 2016 | Promises/A+ compatible deferreds, `requestAnimationFrame`, strict mode compatible |
| 3.5 | 2020 | Security fix for `htmlPrefilter` (XSS in `.html()`) — upgrade if below 3.5 |
| 3.7.1 | 2023 | Last 3.x feature release |
| **4.0** | 2026 | Drops IE ≤ 10 and old Edge, removes deprecated APIs (e.g. `jQuery.trim`, `isArray`), ES modules, Trusted Types support |

Companion projects: **jQuery UI** (widgets, interactions; maintenance mode), **jQuery Mobile** (deprecated 2021), **jQuery Migrate** (plugin that warns about deprecated APIs during upgrades), **jQuery Validation** (third-party plugin).

# Lifecycle

**Page and jQuery lifecycle:**

1. Browser loads HTML; `<script src="jquery.min.js">` defines `window.jQuery`/`$` (load before plugins and your code).
2. Plugins (`jquery.validate.js`, `jquery.validate.unobtrusive.js`, Bootstrap JS) attach to `$.fn`.
3. `$(function () { ... })` — the **DOM ready** callback runs after the DOM is parsed (before images load).
4. Your code selects elements, binds events (`.on()`), initialises plugins.
5. User interacts → event handlers → DOM updates / AJAX calls.
6. AJAX lifecycle: `beforeSend` → request → `done/success` or `fail/error` → `always/complete`; global events `ajaxStart`, `ajaxStop`, `ajaxError`.
7. `$(window).on("load", ...)` fires when all resources including images are loaded.
8. When removing elements use `.remove()` (cleans up jQuery data and events) rather than raw DOM removal to avoid leaks.

# Tools

- **CDN** (code.jquery.com, cdnjs) or **npm** (`npm install jquery`) / LibMan in ASP.NET projects.
- **jQuery Migrate** for upgrading between majors.
- Browser DevTools (inspect handlers in Elements → Event Listeners).
- **jQuery UI**, **jQuery Validation** + **Microsoft jQuery Unobtrusive Validation**, DataTables, Select2, Bootstrap (≤ 4).
- **You Might Not Need jQuery** (website) — modern JavaScript equivalents.
- ESLint plugin `eslint-plugin-jquery` / `no-jquery` to find and remove jQuery usage.

# Module: Basics

## Lesson: [Basic|High] Including jQuery and document ready

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"
        integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
<script>
  $(function () {                      // shorthand for $(document).ready(function () { ... })
    $("#greeting").text("DOM is ready");
  });

  jQuery(function ($) {                // safe '$' even if another library uses it (with $.noConflict())
    // ...
  });
</script>
```

`$(document).ready()` fires when the DOM is ready; `window.onload` waits for images and other resources. If the script is placed at the end of `<body>` or uses `defer`, the DOM is already parsed.

## Lesson: [Basic|High] Selectors and filtering

```js
$("#orderForm")                 // id
$(".order-row")                 // class
$("table tr:even")              // jQuery extension pseudo-selector (avoid for performance; use CSS where possible)
$("input[type='email']")        // attribute
$("ul > li:first-child")        // CSS
$("#orders").find(".paid")      // descendant search — faster than one complex selector
$(".item").filter(".active")    // narrow a set
$(".item").not(".disabled")
$(".item").eq(2)                // third element
$(".item").first() / .last()
$("li").has("ul")               // contains matching descendants
$("#el").is(":visible")         // test → boolean

const $rows = $(".order-row");   // cache selections (prefix $ by convention)
const raw = $rows[0];            // or $rows.get(0) → plain DOM element
$(raw)                           // wrap a DOM element
```

## Lesson: [Basic|High] DOM traversal and manipulation

```js
// Traversal
$(this).parent(); $(this).parents(".card"); $(this).closest("tr");
$(this).children(); $(this).siblings(); $(this).next(); $(this).prev();

// Content
$("#title").text("New title");            // safe text
$("#box").html("<b>Bold</b>");            // parses HTML — never with untrusted input (XSS)
$("#name").val();                          // get form value
$("#name").val("Divakar");                 // set

// Attributes and properties
$("img").attr("alt", "Logo");
$("#agree").prop("checked", true);         // use .prop for checked/disabled/selected (live state)
$("#box").data("id");                      // reads data-id (cached by jQuery)

// Classes and CSS
$("#box").addClass("active").removeClass("hidden").toggleClass("open");
$("#box").css({ color: "red", "font-weight": "bold" });

// Insert / remove
$("#list").append("<li>Last</li>").prepend("<li>First</li>");
$("<li>", { text: "Safe item", class: "item" }).appendTo("#list");
$("#old").remove();       // removes element + its jQuery data/events
$("#list").empty();       // removes children
$("#tmp").detach();       // removes but keeps data/events to re-insert
```

**attr vs prop:** `attr` reads/writes the HTML attribute (initial value); `prop` reads/writes the DOM property (current state). For `checked`, `disabled`, `selected` use `prop`.

## Lesson: [Basic|High] Events and event delegation

```js
$("#save").on("click", function (e) {
  e.preventDefault();
  $(this).prop("disabled", true);          // 'this' = the DOM element
});

// Delegation: handler on a static parent, works for rows added later
$("#ordersTable").on("click", ".delete-btn", function () {
  const id = $(this).closest("tr").data("id");
  deleteOrder(id);
});

$("#search").on("input", debounce(function () { search($(this).val()); }, 300));
$("#name").on("keyup change", handler);    // multiple events
$("#btn").one("click", handler);           // runs once
$("#btn").off("click");                    // remove handlers
$(".item").on("click.analytics", track);   // namespaced event
$(".item").off(".analytics");              // remove only namespaced handlers
$("#form").trigger("submit");              // trigger programmatically
```

Old APIs: `.bind()`, `.delegate()`, `.live()` (removed in 1.9) → all replaced by `.on()`. `return false` in a jQuery handler = `preventDefault()` + `stopPropagation()`.

# Module: AJAX and Effects

## Lesson: [Intermediate|High] AJAX with $.ajax, $.get, $.post and deferreds

```js
$.ajax({
  url: "/api/orders",
  method: "POST",
  contentType: "application/json",
  data: JSON.stringify({ customerId: 5, items: [{ productId: 1, qty: 2 }] }),
  dataType: "json",
  headers: { RequestVerificationToken: $("input[name='__RequestVerificationToken']").val() },
  timeout: 10000,
})
  .done(order => showToast(`Order ${order.id} created`))
  .fail((xhr, status, err) => showError(xhr.responseJSON?.title ?? err))
  .always(() => $("#spinner").hide());

$.get("/api/products", { category: "laptops" }).done(render);
$.getJSON("/api/products/5").done(p => $("#name").text(p.name));
$("#result").load("/Orders/Summary #summaryPanel");     // load HTML fragment into element

// Parallel requests
$.when($.getJSON("/api/user"), $.getJSON("/api/orders")).done((userRes, ordersRes) => {
  const user = userRes[0], orders = ordersRes[0];
});

// Global AJAX events
$(document).ajaxStart(() => $("#spinner").show()).ajaxStop(() => $("#spinner").hide());
```

jqXHR objects are **thenable** (Promises/A+ compatible since 3.0), so they work with `await`. `.success/.error/.complete` callbacks were removed in 3.0 — use `.done/.fail/.always`.

## Lesson: [Basic|Medium] Effects and animations

```js
$("#panel").hide(); $("#panel").show(); $("#panel").toggle();
$("#msg").fadeIn(300).delay(2000).fadeOut(300);
$("#menu").slideToggle("fast");
$("#box").animate({ left: "+=50px", opacity: 0.5 }, 400, "swing", () => console.log("done"));
$("#box").stop(true, true);     // stop queued animations
```

Modern alternative: CSS transitions/animations toggled with classes (`classList.toggle`) — smoother (GPU) and easier to maintain.

## Lesson: [Intermediate|Medium] Writing a jQuery plugin

```js
(function ($) {
  $.fn.highlight = function (options) {
    const settings = $.extend({ color: "yellow", duration: 1000 }, options);
    return this.each(function () {                     // implicit iteration + chainable
      const $el = $(this);
      const original = $el.css("background-color");
      $el.css("background-color", settings.color);
      setTimeout(() => $el.css("background-color", original), settings.duration);
    });
  };
})(jQuery);

$(".new-row").highlight({ color: "#d3f9d8" }).addClass("seen");
```

`$.fn` is `jQuery.prototype`; `$.extend` merges objects (deep merge with `$.extend(true, ...)`).

# Module: jQuery in .NET Apps and Modernisation

## Lesson: [Intermediate|High] jQuery validation in ASP.NET MVC

ASP.NET MVC tag helpers emit `data-val-*` attributes from data annotations; **jQuery Validation** + **jQuery Unobtrusive Validation** read them and validate on the client.

```cshtml
@section Scripts {
    <partial name="_ValidationScriptsPartial" />   @* jquery.validate + jquery.validate.unobtrusive *@
}
```

```js
// Re-parse validation after injecting a form via AJAX
const $form = $("#dynamicForm");
$form.removeData("validator").removeData("unobtrusiveValidation");
$.validator.unobtrusive.parse($form);

// Custom client rule paired with a server-side ValidationAttribute
$.validator.addMethod("notweekend", value => { const d = new Date(value).getDay(); return d !== 0 && d !== 6; });
$.validator.unobtrusive.adapters.addBool("notweekend");

if ($form.valid()) { /* submit via AJAX */ }
```

Server-side validation must still run — client validation is just for UX.

## Lesson: [Intermediate|High] Performance and best practices

- **Cache selectors** (`const $list = $("#list")`) instead of re-querying in loops.
- Use **ID selectors** or scope searches with `.find()`; avoid jQuery-only pseudo-selectors (`:visible`, `:even`) on large sets.
- **Batch DOM changes** — build an HTML string/fragment and append once instead of appending in a loop.
- Use **event delegation** for lists and tables.
- Use `.text()` and `$("<tag>", { text })` for user content (XSS-safe); avoid `.html()` with untrusted data; keep jQuery ≥ 3.5.
- Prefer CSS classes over many `.css()` calls.
- Detach elements (`.detach()`) before heavy manipulation, then re-insert.
- Use `$.noConflict()` if another library uses `$`.

## Lesson: [Advanced|Medium] Migrating from jQuery to modern JavaScript

| jQuery | Modern JavaScript |
|---|---|
| `$("#id")`, `$(".cls")` | `document.getElementById("id")`, `document.querySelectorAll(".cls")` |
| `$(fn)` | `document.addEventListener("DOMContentLoaded", fn)` or `<script defer>` |
| `.addClass/.removeClass/.toggleClass` | `el.classList.add/remove/toggle` |
| `.text()` / `.html()` | `el.textContent` / `el.innerHTML` |
| `.attr()` / `.data()` | `el.getAttribute()` / `el.dataset` |
| `.on("click", ".child", fn)` | `parent.addEventListener("click", e => { const c = e.target.closest(".child"); if (c) fn(c); })` |
| `$.ajax`, `$.getJSON` | `fetch()` + `async/await` |
| `.closest()`, `.parent()` | `el.closest()`, `el.parentElement` |
| `.fadeIn()` | CSS transitions / Web Animations API |
| `$.each`, `$.map`, `$.extend` | `forEach`, `map`, `Object.assign` / spread |

Strategy: upgrade to jQuery 3.x/4.x with jQuery Migrate first; stop adding new jQuery code; replace module by module (or move UI to a framework component by component); remove plugins with framework-native or vanilla equivalents; finally drop the dependency.

# Interview

## [Beginner|High] What is jQuery and why was it popular?

A fast, small JavaScript library that simplifies HTML DOM traversal and manipulation, event handling, animation and AJAX with a concise, chainable API that worked consistently across browsers (especially old IE). It also had a large plugin ecosystem. Modern browsers now offer standard APIs (`querySelector`, `fetch`, `classList`), so new projects often don't need it, but many existing apps still do.

## [Beginner|High] What is the difference between `$(document).ready()` and `window.onload`?

`$(document).ready()` (or `$(fn)`) runs as soon as the DOM is parsed and ready to manipulate, before images and stylesheets finish loading; you can have many ready handlers. `window.onload` (or `$(window).on("load")`) waits until all resources, including images and iframes, have loaded — later. Use ready for DOM setup, load for things needing image dimensions.

## [Beginner|High] What is the `$` sign in jQuery? What does `noConflict` do?

`$` is an alias for the `jQuery` function, used to select elements, create elements and run code on DOM ready. Other libraries (old Prototype.js) also use `$`; `jQuery.noConflict()` releases `$` back to them, and you can use `jQuery(...)` or wrap your code in `(function ($) { ... })(jQuery)` to keep using `$` locally.

## [Beginner|High] What is the difference between `.text()`, `.html()` and `.val()`?

`.text()` gets/sets the text content (HTML-escaped, safe for user input). `.html()` gets/sets inner HTML (parses markup — XSS risk with untrusted data). `.val()` gets/sets the value of form elements (input, select, textarea).

## [Beginner|Medium] What is method chaining?

Most jQuery methods return the same jQuery object, so you can call multiple methods in sequence on one selection: `$("#box").addClass("active").fadeIn(200).text("Hello")`. It avoids repeated DOM queries and keeps code concise. Getter methods (like `.text()` with no args) return values and end the chain.

## [Intermediate|High] What is the difference between `.on()`, `.bind()`, `.live()` and `.delegate()`?

`.bind()` attached handlers directly to existing elements; `.live()` attached to the document for current and future elements (removed in 1.9, slow); `.delegate()` attached to a chosen ancestor for matching descendants. `.on()` (1.7+) unified all of them: `.on("click", handler)` for direct binding and `.on("click", ".child", handler)` for delegation. Use `.on()`/`.off()` only.

## [Intermediate|High] What is event delegation in jQuery and why use it?

Binding a handler to a static ancestor with a selector argument — `$("#table").on("click", ".delete", fn)` — so events bubbling from matching descendants are handled. It works for elements added dynamically after binding (e.g. rows inserted via AJAX) and uses one handler instead of hundreds.

## [Intermediate|High] What is the difference between `.attr()` and `.prop()`?

`.attr()` works with HTML attributes as written in markup (initial values, strings). `.prop()` works with DOM properties reflecting the current state (booleans like `checked`, `disabled`, `selected`). E.g. after a user ticks a checkbox, `.prop("checked")` is `true` but `.attr("checked")` may still be undefined. Use `.prop` for boolean state since jQuery 1.6.

## [Intermediate|High] How do you make AJAX calls with jQuery? What are deferreds?

`$.ajax({ url, method, data, contentType, dataType })` or shortcuts `$.get`, `$.post`, `$.getJSON`, `.load()`. They return jqXHR objects implementing the Deferred/Promise interface: chain `.done()`, `.fail()`, `.always()`, `.then()`, and combine with `$.when()` for parallel calls. Since 3.0 deferreds are Promises/A+ compatible, so they can be awaited. For ASP.NET Core POSTs, send the antiforgery token in a header.

## [Intermediate|Medium] What is the difference between `.remove()`, `.detach()` and `.empty()`?

`.remove()` removes the elements and their jQuery data and event handlers. `.detach()` removes elements but keeps data and handlers so they can be re-inserted later. `.empty()` removes only the child nodes of the selected elements, keeping the elements themselves.

## [Intermediate|Medium] How do you write a jQuery plugin?

Add a function to `$.fn` (jQuery.prototype), merge default options with `$.extend`, iterate with `this.each()` and return `this` so it's chainable, and wrap it in an IIFE receiving `jQuery` as `$` to avoid conflicts: `(function($){ $.fn.myPlugin = function(opts){ const s = $.extend({}, defaults, opts); return this.each(function(){ /* ... */ }); }; })(jQuery);`.

## [Advanced|Medium] How do you re-enable unobtrusive validation for a form loaded via AJAX?

The unobtrusive adapter parses forms only on page load. After inserting new HTML, remove the cached validator data and re-parse: `$form.removeData("validator").removeData("unobtrusiveValidation"); $.validator.unobtrusive.parse($form);`. Then call `$form.valid()` before submitting.

## [Advanced|Medium] Should a new project use jQuery? How would you migrate away from it?

Usually not: modern browsers have standard equivalents (querySelector, classList, fetch, closest, dataset, CSS transitions), and frameworks provide components and state management. jQuery is still reasonable for small enhancements on server-rendered pages or when a needed plugin depends on it. To migrate: upgrade with jQuery Migrate, freeze new jQuery usage via lint rules, replace utilities with native APIs, swap plugins, migrate UI screens to components incrementally, then remove the library.

## [Scenario|High] Click handlers don't work for table rows added after an AJAX refresh. Why and how to fix?

The handlers were bound directly (`$(".delete").on("click", ...)`) to rows existing at bind time; new rows don't have them. Use delegation on a static container: `$("#ordersTable").on("click", ".delete", handler)` — or rebind after each refresh (worse). Make sure the container itself isn't replaced by the AJAX refresh.

## [Scenario|High] An old site uses jQuery 1.11 and a security scan flags XSS vulnerabilities. What do you do?

Upgrade to the latest jQuery 3.x/4.x (3.5+ fixed the `htmlPrefilter` XSS issues), using jQuery Migrate in development to find deprecated API usage and fix it (e.g. `.size()`, `.bind()`, `.success()` callbacks); update plugins to compatible versions; review code that passes user data into `.html()`, `.append()` with strings or `$(userInput)` and switch to `.text()`/element creation; add a Content-Security-Policy; retest the UI.

## [Scenario|Medium] A page with 5,000 rows is slow when appending rows in a loop with `$("#tbody").append(...)`. How do you speed it up?

Each `.append()` triggers DOM work and possibly layout. Build all rows as one HTML string (with escaped values) or a DocumentFragment and append once; cache `$("#tbody")`; detach the table during the build; use event delegation instead of per-row handlers; better yet, paginate or virtualise the table (DataTables with server-side processing) instead of rendering 5,000 rows.

# Cheatsheet

## Core

`$(fn)` DOM ready · `$("css")` select · `$(el)` wrap · `$("<li>", {text})` create · chaining · implicit iteration · `$.noConflict()`.

## Traversal

`find` · `filter` · `not` · `eq` · `first/last` · `parent/parents/closest` · `children/siblings/next/prev` · `is` · `has`.

## Manipulation

`text` · `html` · `val` · `attr` · `prop` · `data` · `addClass/removeClass/toggleClass` · `css` · `append/prepend/after/before` · `appendTo` · `remove/detach/empty` · `clone`.

## Events

`on(event, [selector], handler)` · `off` · `one` · `trigger` · namespaces `click.ns` · `e.preventDefault()` · `return false` = prevent + stop.

## AJAX

`$.ajax({url, method, data, contentType, dataType})` · `$.get` · `$.post` · `$.getJSON` · `.load()` · `.done/.fail/.always/.then` · `$.when` · `ajaxStart/ajaxStop`.

## Effects

`show/hide/toggle` · `fadeIn/fadeOut/fadeToggle` · `slideUp/slideDown/slideToggle` · `animate` · `stop` · `delay`.

## Versions to remember

1.7 `.on()` · 1.9 removed `.live()` · 3.0 Promises/A+ · 3.5 XSS fix · 4.0 (2026) drops old IE, ES modules.

## Modern equivalents

querySelector · classList · textContent · dataset · addEventListener + closest · fetch · CSS transitions.
