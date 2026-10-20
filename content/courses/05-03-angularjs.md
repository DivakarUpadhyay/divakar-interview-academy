---
slug: angularjs
title: AngularJS (1.x) — Legacy
track: frontend
order: 3
icon: A1
color: #b52e31
summary: Modules, controllers, $scope, two-way data binding, directives, filters, services/factories/providers, dependency injection, digest cycle, routing, $http and promises, custom directives, components, performance and migration to Angular.
---

# Overview

**AngularJS** (Angular 1.x) is the original JavaScript MVC/MVVM framework from Google (2010) that popularised **two-way data binding**, **directives** and **dependency injection** in the browser.

**Important fact:** AngularJS reached **end of life on 31 December 2021** — Google no longer provides updates or security fixes. It is **different** from **Angular** (2+), a complete TypeScript rewrite. Interviews ask about AngularJS when a company maintains or is migrating a legacy app.

Core building blocks:

| Concept | Purpose |
|---|---|
| **Module** (`angular.module`) | Container for app parts and dependencies |
| **Controller** | Sets up `$scope` state and behaviour for a view |
| **$scope** | The model object that binds controller and view |
| **Directives** | Extend HTML: `ng-model`, `ng-repeat`, `ng-if`, custom directives |
| **Expressions / interpolation** | `{{ order.total | currency }}` |
| **Filters** | Format/transform data in views |
| **Services** (service, factory, provider, value, constant) | Shared logic and data (singletons) |
| **Dependency injection** | Injector supplies `$http`, `$scope`, custom services |
| **Routing** (`ngRoute` or UI-Router) | SPA views by URL |
| **Digest cycle** | Change detection by dirty checking watchers |

# Versions

| Version | Year | Notes |
|---|---|---|
| 0.9 / 1.0 | 2010 / 2012 | Created by Miško Hevery and Adam Abrons; 1.0 released June 2012 |
| 1.2 | 2013 | `ngAnimate`, controller-as syntax, `$sce` strict contextual escaping |
| 1.3 | 2014 | One-time binding `::`, dropped IE8, `ngMessages`, performance |
| 1.4 | 2015 | New router attempts, `ngCookies` rewrite |
| **1.5** | 2016 | **`.component()`** API, one-way bindings `<`, lifecycle hooks (`$onInit`, `$onChanges`, `$onDestroy`) — eases migration to Angular |
| 1.6 | 2016 | `$http` success/error removed, hash prefix `#!` default, pre-assigned bindings off |
| 1.7 | 2018 | Long Term Support period started (July 2018) |
| **1.8.x** | 2020–2022 | Final versions (1.8.3); **end of LTS: 31 December 2021** |

After EOL, commercial extended support exists from third parties (e.g. HeroDevs "Never-Ending Support").

# Lifecycle

**Application bootstrap lifecycle:**

1. Browser loads `angular.js`, then app scripts.
2. On DOMContentLoaded, AngularJS finds `ng-app` (or you call `angular.bootstrap(element, ["app"])`).
3. The **injector** is created; module **config** blocks run (providers only), then **run** blocks.
4. **Compile phase** — `$compile` walks the DOM, collects directives, runs their `compile` functions (template manipulation).
5. **Link phase** — each directive's `link` function (pre-link and post-link) connects scope to DOM and sets up `$watch`es and event listeners.
6. **Runtime** — events (`ng-click`, `$http` response, `$timeout`) trigger `$scope.$apply()` → **$digest loop**: all watchers are dirty-checked repeatedly until no values change (max 10 iterations, otherwise `infdig` error) → DOM updated.
7. **Destroy** — when a scope is removed (route change, `ng-if` false), `$destroy` event fires; clean up listeners/timers.

**Component lifecycle hooks (1.5+):** `$onInit` → `$onChanges(changesObj)` (one-way binding changes) → `$doCheck` → `$postLink` → `$onDestroy`.

# Tools

- `angular.js` / `angular.min.js` (CDN or npm `angular`), modules `angular-route`, `angular-animate`, `angular-messages`, `angular-sanitize`.
- **UI-Router** (`@uirouter/angularjs`) — state-based routing (more popular than ngRoute).
- **Batarang** (old Chrome extension) and browser DevTools (`angular.element($0).scope()` in the console).
- **Karma** (test runner) + **Jasmine** + **angular-mocks** (`ngMock`, `$httpBackend`); **Protractor** for E2E (deprecated in 2022–2023 — use Playwright/Cypress).
- Grunt/Gulp/Bower historically; webpack later.
- **ngUpgrade** / `@angular/upgrade` — run AngularJS and Angular side by side during migration.

# Module: Fundamentals

## Lesson: [Basic|High] Module, controller, $scope and two-way binding

```html
<!DOCTYPE html>
<html ng-app="shopApp">
<body ng-controller="OrderController as vm">
  <input ng-model="vm.customer" placeholder="Customer">
  <p>Hello {{ vm.customer }}</p>                         <!-- updates as you type: two-way binding -->
  <ul>
    <li ng-repeat="o in vm.orders | filter:{status:'paid'} | orderBy:'-total' track by o.id">
      #{{ o.id }} — {{ o.total | currency:'₹' }}
    </li>
  </ul>
  <button ng-click="vm.add()" ng-disabled="!vm.customer">Add</button>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.8.3/angular.min.js"></script>
  <script>
    angular.module("shopApp", [])
      .controller("OrderController", function () {
        const vm = this;                                  // "controller as" syntax (preferred over $scope)
        vm.customer = "";
        vm.orders = [{ id: 1, total: 1200, status: "paid" }, { id: 2, total: 300, status: "pending" }];
        vm.add = () => vm.orders.push({ id: vm.orders.length + 1, total: 500, status: "paid" });
      });
  </script>
</body>
</html>
```

**Two-way binding**: `ng-model` updates the model when the user types, and the view updates when the model changes (via the digest cycle). **Controller-as** avoids `$scope` prototype inheritance pitfalls ("always have a dot in ng-model").

## Lesson: [Basic|High] Built-in directives

| Directive | Purpose |
|---|---|
| `ng-app` | Bootstraps the app |
| `ng-controller` | Attaches a controller |
| `ng-model` | Two-way binding for inputs |
| `ng-bind` / `{{ }}` | One-way output (`ng-bind` avoids flicker of `{{ }}`; `ng-cloak` hides until compiled) |
| `ng-repeat` | Loop (`track by` for performance) |
| `ng-if` | Adds/removes DOM (creates a child scope) |
| `ng-show` / `ng-hide` | Toggles CSS `display` (element stays in DOM) |
| `ng-switch` | Switch-case rendering |
| `ng-class`, `ng-style` | Dynamic classes/styles |
| `ng-click`, `ng-change`, `ng-submit`, `ng-blur` | Events |
| `ng-include` | Include external HTML template |
| `ng-options` | Build `<select>` options |
| `ng-disabled`, `ng-checked`, `ng-readonly` | Boolean attributes |
| `ng-form`, `ng-messages` | Forms and validation messages |

**ng-if vs ng-show:** `ng-if` removes the element and its scope/watchers (cheaper when hidden, re-creates on show); `ng-show` only hides with CSS (watchers stay active, cheaper toggling).

## Lesson: [Basic|Medium] Expressions and filters

```html
{{ price * qty | number:2 }}
{{ name | uppercase }}   {{ today | date:'dd-MMM-yyyy' }}   {{ amount | currency:'₹':0 }}
{{ items | limitTo:5 }}   {{ items | orderBy:'name':true }}   {{ items | filter:searchText }}
{{ data | json }}
```

Custom filter:

```js
angular.module("shopApp").filter("statusLabel", () => status =>
  ({ paid: "✅ Paid", pending: "⏳ Pending" }[status] || status));
```

Filters in templates run on **every digest** — expensive filters on large `ng-repeat` lists hurt performance; pre-compute in the controller instead.

# Module: Services and Dependency Injection

## Lesson: [Intermediate|High] Service vs factory vs provider vs value vs constant

All create **singletons** registered with the injector.

```js
const app = angular.module("shopApp", []);

app.constant("API_URL", "/api");                       // available in config blocks
app.value("pageSize", 20);                              // simple value (not in config)

app.factory("orderApi", function ($http, API_URL) {     // factory: returns an object you build
  return {
    list: () => $http.get(`${API_URL}/orders`).then(r => r.data),
    save: order => $http.post(`${API_URL}/orders`, order).then(r => r.data),
  };
});

app.service("cart", function () {                       // service: constructor function, called with 'new'
  this.items = [];
  this.add = item => this.items.push(item);
});

app.provider("theme", function () {                     // provider: configurable before the app runs
  let color = "blue";
  this.setColor = c => (color = c);                     // used in config()
  this.$get = () => ({ color: () => color });           // the actual service
});
app.config(themeProvider => themeProvider.setColor("green"));
```

| | Registered with | Injectable in config? | Use |
|---|---|---|---|
| constant | value | **Yes** | Settings needed during config |
| value | value | No | Simple values |
| factory | function returning an object | No | Most common for logic/API wrappers |
| service | constructor (`new`) | No | Class-style services |
| provider | object with `$get` | **Provider yes**, service no | Configurable reusable services |

## Lesson: [Intermediate|High] Dependency injection and minification

AngularJS reads function **parameter names** to know what to inject. Minifiers rename parameters, which breaks DI — use an annotation style:

```js
// Inline array annotation (most common)
app.controller("OrderController", ["$scope", "orderApi", function ($scope, orderApi) { /* ... */ }]);

// $inject property
function OrderController(orderApi) { /* ... */ }
OrderController.$inject = ["orderApi"];

// Build-time: ng-annotate / babel-plugin-angularjs-annotate; strict mode: <html ng-app="app" ng-strict-di>
```

## Lesson: [Intermediate|High] $http, promises and $q

```js
app.factory("productApi", ["$http", "$q", function ($http, $q) {
  const cache = {};
  return {
    get(id) {
      if (cache[id]) return $q.resolve(cache[id]);          // $q promise, integrates with the digest
      return $http.get(`/api/products/${id}`, { timeout: 10000 })
        .then(res => (cache[id] = res.data))
        .catch(err => $q.reject(err.status === 404 ? "Not found" : "Server error"));
    },
    all: ids => $q.all(ids.map(id => this.get(id))),
  };
}]);

// Interceptor: add auth header and handle 401 globally
app.factory("authInterceptor", ["$q", "$window", function ($q, $window) {
  return {
    request: config => { config.headers.Authorization = `Bearer ${$window.sessionStorage.token}`; return config; },
    responseError: rejection => { if (rejection.status === 401) $window.location = "/login"; return $q.reject(rejection); },
  };
}]);
app.config(["$httpProvider", $httpProvider => $httpProvider.interceptors.push("authInterceptor")]);
```

`$http`'s `.success()`/`.error()` were removed in 1.6 — use `.then()`. Use `$q`, `$timeout`, `$interval` (not native promises/setTimeout) so changes trigger a digest — or call `$scope.$applyAsync()`.

# Module: Scope, Digest and Directives

## Lesson: [Advanced|High] The digest cycle, $watch and $apply

- Each binding (`{{ }}`, `ng-model`, `$watch`) registers a **watcher**.
- `$digest()` loops over all watchers on a scope and its children, comparing current vs last values (**dirty checking**); if anything changed, it runs listeners and loops again until stable (max 10 → `10 $digest() iterations reached` error).
- `$apply(fn)` runs `fn` then `$rootScope.$digest()` — needed when changing the model **outside** AngularJS (jQuery events, `setTimeout`, third-party callbacks).
- `$watch(expr, listener)` — reference/value check; `$watchCollection` — shallow array/object; `$watch(expr, fn, true)` — deep (expensive).
- `$scope.$on/$emit/$broadcast` — events up (`$emit`) or down (`$broadcast`) the scope tree.

```js
$scope.$watch(() => vm.filter, (newVal, oldVal) => { if (newVal !== oldVal) vm.reload(); });
someJQueryWidget.on("change", value => $scope.$apply(() => (vm.value = value)));
const off = $rootScope.$on("cart:updated", handler);
$scope.$on("$destroy", off);                         // always unregister
```

Rule of thumb: keep watchers under ~2,000 per page for smooth performance.

## Lesson: [Advanced|High] Custom directives and components

```js
// Component (1.5+) — preferred: isolated scope, controller-as, lifecycle hooks
app.component("orderCard", {
  bindings: { order: "<", onSelect: "&" },           // < one-way, @ string, & callback, = two-way (avoid)
  template: `
    <div class="card" ng-click="$ctrl.onSelect({ id: $ctrl.order.id })">
      #{{ $ctrl.order.id }} — {{ $ctrl.order.total | currency }}
    </div>`,
  controller: function () {
    this.$onInit = () => { /* init */ };
    this.$onChanges = changes => { if (changes.order) { /* react */ } };
    this.$onDestroy = () => { /* cleanup */ };
  },
});
// <order-card order="o" on-select="vm.open(id)"></order-card>

// Directive — for DOM manipulation / attribute behaviour
app.directive("autoFocus", ["$timeout", function ($timeout) {
  return {
    restrict: "A",                                    // E element, A attribute, C class, M comment
    link(scope, element) { $timeout(() => element[0].focus()); },
  };
}]);
```

Scope options for directives: `scope: false` (share parent), `scope: true` (child scope, prototypal inheritance), `scope: {}` (**isolated**). `transclude: true` lets a directive wrap content (`<ng-transclude>`). `require` accesses other directive controllers (e.g. `ngModel`).

## Lesson: [Intermediate|Medium] Routing with ngRoute and UI-Router

```js
angular.module("shopApp", ["ngRoute"])
  .config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
    $routeProvider
      .when("/orders", { template: "<order-list></order-list>" })
      .when("/orders/:id", {
        templateUrl: "views/order-detail.html",
        controller: "OrderDetailController as vm",
        resolve: { order: ["$route", "orderApi", ($route, api) => api.get($route.current.params.id)] },
      })
      .otherwise("/orders");
    $locationProvider.html5Mode(true);             // URLs without #! (needs server rewrite + <base href="/">)
  }]);
```

**UI-Router** uses **states** (`$stateProvider.state("orders.detail", {...})`), nested views and named views — better for complex apps. `resolve` loads data before the route activates.

## Lesson: [Intermediate|Medium] Forms and validation

```html
<form name="orderForm" ng-submit="orderForm.$valid && vm.save()" novalidate>
  <input name="email" type="email" ng-model="vm.email" required>
  <div ng-messages="orderForm.email.$error" ng-if="orderForm.email.$touched">
    <p ng-message="required">Email is required</p>
    <p ng-message="email">Enter a valid email</p>
  </div>
  <button ng-disabled="orderForm.$invalid">Save</button>
</form>
```

Form/field states: `$pristine/$dirty`, `$valid/$invalid`, `$touched/$untouched`, `$submitted`, `$error`. Custom validators via `ngModel.$validators` / `$asyncValidators` in a directive.

## Lesson: [Advanced|High] Performance and migration to Angular

**Performance:** reduce watchers (one-time binding `::`, avoid deep watches), `track by` in `ng-repeat`, `ng-if` over `ng-show` for heavy hidden sections, avoid filters in large repeats, paginate/virtualise lists, `$applyAsync`/`$httpProvider.useApplyAsync(true)`, disable debug info in production (`$compileProvider.debugInfoEnabled(false)`), `$scope.$digest()` locally instead of global `$apply` in hot paths.

**Migration paths:**

1. Prepare: upgrade to 1.8, use **components** + controller-as + one-way bindings, TypeScript and a bundler, remove `$scope` soup.
2. **Hybrid app with ngUpgrade** (`UpgradeModule`): bootstrap both frameworks; **downgrade** new Angular components/services to use in AngularJS, **upgrade** AngularJS services to inject in Angular; migrate feature by feature, route by route.
3. Or rewrite incrementally behind a reverse proxy / micro-frontends (different routes served by different apps).
4. Remove AngularJS when the last feature moves.

Because AngularJS is EOL, also consider migrating to React or Vue; the strategy (strangler pattern by route/feature) is the same.

# Interview

## [Beginner|High] What is AngularJS and how is it different from Angular?

AngularJS (1.x, 2010) is a JavaScript MVC/MVVM framework using controllers, `$scope`, two-way binding through dirty-checking digest cycles and directives; it reached end of life on 31 Dec 2021. Angular (2+, 2016) is a complete rewrite in TypeScript with components, a hierarchical DI system, RxJS, a CLI, AOT compilation, zone.js/signals-based change detection, mobile-friendly performance and regular releases. There's no direct upgrade path; migration is a rewrite (often incremental with ngUpgrade).

## [Beginner|High] What is two-way data binding in AngularJS?

Synchronisation between the model and the view in both directions: `ng-model` updates the scope when the user changes input, and any change to the scope model updates the view during the next digest cycle. It's implemented with watchers and dirty checking. Convenient, but many two-way bindings slow down large apps.

## [Beginner|High] What are directives? Name some built-in ones.

Directives are markers on DOM elements (attributes, elements, classes, comments) that tell the AngularJS compiler to attach behaviour or transform the DOM. Built-in: `ng-app`, `ng-controller`, `ng-model`, `ng-bind`, `ng-repeat`, `ng-if`, `ng-show/ng-hide`, `ng-click`, `ng-class`, `ng-include`, `ng-switch`, `ng-options`, `ng-submit`. You can write custom directives and components.

## [Beginner|High] What is $scope? What is $rootScope?

`$scope` is the object that glues a controller to its view — properties and functions on it are available in the template. Scopes form a hierarchy mirroring the DOM, with prototypal inheritance (child scopes from `ng-repeat`, `ng-if`, `ng-include`). `$rootScope` is the top-level scope of the app; every other scope descends from it. Avoid storing state on `$rootScope` — use services.

## [Beginner|Medium] What is the difference between ng-if and ng-show?

`ng-if` adds or removes the element (and creates/destroys its child scope and watchers) based on the condition. `ng-show`/`ng-hide` keep the element in the DOM and toggle `display: none` via a CSS class, so its watchers remain active. Use `ng-if` for heavy content that's rarely shown, `ng-show` for frequent toggling of light content.

## [Intermediate|High] What is the difference between service, factory and provider?

All produce injectable singletons. A **factory** is a function whose returned value is the service. A **service** is a constructor function instantiated with `new` (methods on `this`). A **provider** is the most configurable: an object with a `$get` method, plus configuration methods available in `config()` blocks before the app runs (factory and service are shorthands built on providers). Constants are injectable in config; values are not.

## [Intermediate|High] Explain the digest cycle. When do you need $apply?

When something inside AngularJS's context happens (ng-click, $http, $timeout), AngularJS calls `$apply` → `$digest`, which dirty-checks all watchers, runs listeners for changed values, and repeats until nothing changes (max 10 loops), then the view reflects the model. If you change the model outside AngularJS (native `setTimeout`, jQuery plugin callbacks, WebSocket events), AngularJS doesn't know, so wrap the change in `$scope.$apply()` (or use `$timeout`/`$applyAsync`).

## [Intermediate|High] How does dependency injection work in AngularJS? What breaks it during minification?

The `$injector` looks at a function's parameter names (or explicit annotations) and supplies registered services. Minification renames parameters (`$http` → `a`), so implicit DI breaks. Fix with inline array annotation `["$http", function ($http) {}]`, the `$inject` property, build tools like ng-annotate, and enable `ng-strict-di` to catch missing annotations.

## [Intermediate|Medium] What are the scope binding types in a component/directive (@, =, <, &)?

`@` — one-way string/interpolated attribute value. `=` — two-way binding (expensive, avoid in components). `<` — one-way binding of an expression (1.5+, preferred for inputs). `&` — callback expression bound to the parent's function, used for outputs (`on-select="vm.open(id)"` invoked as `$ctrl.onSelect({ id: 5 })`).

## [Intermediate|Medium] What is the difference between $emit and $broadcast?

Both dispatch scope events. `$emit` sends an event **upwards** from the current scope through its parents to `$rootScope`. `$broadcast` sends it **downwards** to all child scopes. Listen with `$on`. Overusing events makes data flow hard to follow — prefer services or component bindings; always deregister `$rootScope.$on` listeners on `$destroy`.

## [Intermediate|Medium] What are filters? How do you create a custom filter?

Filters format data in templates (`currency`, `date`, `uppercase`, `limitTo`, `orderBy`, `filter`, `json`, `number`) and can be chained with `|`. Create one with `module.filter("name", () => input => transformed)`. Filters in templates execute on every digest, so keep them cheap.

## [Advanced|High] How do you improve the performance of a slow AngularJS app?

Reduce the number of watchers (one-time bindings `::`, fewer two-way bindings, avoid deep `$watch`), use `track by` in `ng-repeat`, paginate or virtualise large lists, prefer `ng-if` for hidden heavy sections, move filters out of templates, debounce `ng-model` (`ng-model-options="{ debounce: 300 }"`), use `$applyAsync` and `$httpProvider.useApplyAsync`, disable debug info in production, and profile digest time with DevTools.

## [Advanced|High] How would you migrate a large AngularJS app to Angular?

Prepare the codebase (latest 1.8, components with one-way bindings, controller-as, services instead of `$rootScope`, TypeScript, module bundler). Then create a hybrid app with `@angular/upgrade` (UpgradeModule): Angular bootstraps and boots AngularJS; migrate leaf components and services first, downgrading Angular components for use in AngularJS templates and upgrading AngularJS services for Angular. Move routes one by one (or split by routes behind a proxy), test continuously, and finally remove AngularJS. Budget for the fact that AngularJS is EOL and has no security patches.

## [Scenario|High] You change a model value inside a jQuery datepicker callback but the view doesn't update. Why?

The callback runs outside AngularJS's digest, so no dirty check happens. Wrap the update in `$scope.$apply(() => vm.date = value)` (or `$scope.$applyAsync`), or better, wrap the datepicker in a custom directive that uses `ngModel.$setViewValue` inside `$apply`. Avoid calling `$apply` when a digest is already in progress (`$digest already in progress` error) — `$applyAsync` or `$timeout` avoids that.

## [Scenario|High] An ng-repeat over 3,000 rows makes the page freeze on every keystroke in a search box. Fix it.

Each keystroke triggers a digest over thousands of watchers plus filter re-evaluation. Fixes: debounce the input with `ng-model-options="{ debounce: 300 }"`; filter in the controller once per change instead of a template filter; add `track by row.id`; use one-time bindings (`::`) for row fields that don't change; paginate or virtualise (e.g. `ui-grid` or a virtual-repeat directive); reduce per-row bindings and directives.

## [Scenario|Medium] Your company still runs a business-critical AngularJS app. What risks do you raise and what plan do you propose?

Risks: no security patches since Dec 2021 (compliance/pen-test findings), dwindling developer pool, incompatible modern libraries, browser changes. Plan: short-term — upgrade to 1.8.3, add a strict Content-Security-Policy, review `$sce`/`ng-bind-html` usage, consider commercial extended support; medium-term — incremental migration (Angular via ngUpgrade, or React/Vue via micro-frontends/route-by-route strangler), starting with the most-changed or riskiest screens; keep feature parity tests (Playwright) as a safety net.

# Cheatsheet

## Building blocks

module · controller (controller-as `vm`) · $scope / $rootScope · directives · components (1.5+) · filters · services · DI · routing · digest cycle.

## Directives

ng-app · ng-controller · ng-model · ng-bind · ng-repeat (track by) · ng-if · ng-show/hide · ng-switch · ng-class · ng-click · ng-submit · ng-options · ng-include · ng-cloak · ng-messages.

## Services

constant (config-safe) · value · factory (returns object) · service (`new`) · provider (`$get`, configurable).

## Bindings

`@` string · `<` one-way · `=` two-way · `&` callback. Component hooks: `$onInit`, `$onChanges`, `$doCheck`, `$postLink`, `$onDestroy`.

## Digest

watchers + dirty checking · `$apply` (outside AngularJS) · `$applyAsync` · `$watch` / `$watchCollection` / deep watch · max 10 iterations · `$emit` up / `$broadcast` down / `$on`.

## Key facts

1.0 2012 · 1.5 components · 1.6 removed `.success/.error` · 1.8.3 last · **EOL 31 Dec 2021** · migrate with ngUpgrade.

## Performance

`::` one-time binding · track by · fewer watchers · debounce ng-model · no heavy template filters · `debugInfoEnabled(false)`.
