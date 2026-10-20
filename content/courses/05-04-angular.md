---
slug: angular
title: Angular (2 → 21)
track: frontend
order: 4
icon: Ng
color: #dd0031
summary: Angular CLI, standalone components, templates and new control flow, data binding, directives and pipes, signals, services and DI, routing and guards, forms, HttpClient and interceptors, RxJS, change detection and zoneless, lifecycle hooks, state management, testing and performance.
---

# Overview

**Angular** is Google's full-featured, TypeScript-based framework for building single-page applications. It includes everything out of the box: components, templates, dependency injection, router, forms, HTTP client, testing utilities, build tooling (Angular CLI), server-side rendering and internationalisation.

Key characteristics:

- **Component-based** — UI built from components (TypeScript class + HTML template + styles).
- **TypeScript-first** with decorators (`@Component`, `@Injectable`, `@Input`...).
- **Dependency injection** built in, hierarchical.
- **RxJS** observables for async streams; **Signals** (v16+) for fine-grained reactivity.
- **Opinionated** structure — great for large enterprise teams.
- **Standalone components** (default since v19) replace NgModules for most apps.

Angular ≠ AngularJS: Angular (2016+) is a complete rewrite of AngularJS (1.x, EOL Dec 2021).

# Versions

| Version | Date | Highlights |
|---|---|---|
| 2 | Sep 2016 | Rewrite: components, TypeScript, RxJS, DI |
| 4 | Mar 2017 | Skipped v3 (router package was already v3); `*ngIf; else`, smaller builds |
| 5–8 | 2017–2019 | HttpClient (4.3/5), CLI `ng update` & Angular Elements (6), CLI prompts (7), differential loading (8) |
| **9** | Feb 2020 | **Ivy** compiler/renderer by default — smaller bundles, faster builds |
| 12–13 | 2021 | View Engine deprecated then removed; IE11 support dropped (13) |
| 14 | Jun 2022 | **Standalone components** (preview), strictly **typed reactive forms** |
| 15 | Nov 2022 | Standalone APIs stable, directive composition, `NgOptimizedImage` |
| **16** | May 2023 | **Signals** (preview), `takeUntilDestroyed`, required inputs, non-destructive hydration |
| **17** | Nov 2023 | **Built-in control flow** (`@if`, `@for`, `@switch`), **deferrable views** (`@defer`), Vite + esbuild dev server/builder, new docs **angular.dev** |
| 18 | May 2024 | Zoneless change detection (experimental), Material 3, event replay, `@let` (18.1) |
| 19 | Nov 2024 | **Standalone by default**, `linkedSignal`, `resource()` API, incremental hydration, HMR |
| 20 | May 2025 | Signal APIs stable (`effect`, `linkedSignal`, `toSignal`), zoneless promoted, `*ngIf/*ngFor/*ngSwitch` deprecated in favour of control flow |
| **21** | Nov 2025 | **Zoneless by default** for new apps, experimental **Signal Forms**, **Vitest** as default test runner, Angular Aria (accessible headless components) |

**Release cadence:** a major version roughly every **6 months** (May and November). Each major gets **6 months active support + 12 months LTS = 18 months**. Upgrade with `ng update` (guide at angular.dev/update-guide).

# Lifecycle

**Application bootstrap:** `main.ts` → `bootstrapApplication(AppComponent, appConfig)` (standalone) or `platformBrowserDynamic().bootstrapModule(AppModule)` (NgModule) → providers registered (router, HttpClient, zoneless/zone.js change detection) → root component rendered into `<app-root>` → router activates the initial route.

**Component lifecycle hooks (in order):**

| Hook | When |
|---|---|
| `constructor` | Class instantiated; DI happens (don't do heavy work or touch inputs) |
| `ngOnChanges(changes)` | Before `ngOnInit` and whenever an `@Input` reference changes |
| `ngOnInit` | Once, after first `ngOnChanges` — fetch data, initialise |
| `ngDoCheck` | Every change detection run — custom change detection (use sparingly) |
| `ngAfterContentInit` / `ngAfterContentChecked` | After projected content (`<ng-content>`) is initialised / checked |
| `ngAfterViewInit` / `ngAfterViewChecked` | After the component's view and child views are initialised / checked — `@ViewChild` available |
| `ngOnDestroy` | Before destroy — unsubscribe, clear timers |

Newer alternatives: `afterNextRender` / `afterEveryRender` (DOM work after rendering), `DestroyRef` + `takeUntilDestroyed()` for cleanup, signal inputs instead of `ngOnChanges`.

**Change detection lifecycle:** an event (click, HTTP response, timer) → with **zone.js**, Angular detects that async work finished and runs change detection from the root down (all components with `Default` strategy; `OnPush` components only if inputs changed, an event fired in them, an async pipe emitted or a signal they read changed) → DOM updated. **Zoneless** (default for new apps in v21): change detection is scheduled by signals, `markForCheck`, events and the async pipe — no zone.js.

# Tools

| Tool | Use |
|---|---|
| **Angular CLI** (`ng`) | new, generate, serve, build, test, update, add |
| VS Code + Angular Language Service | Template IntelliSense and errors |
| Angular DevTools (browser extension) | Component tree, profiler, signals graph |
| RxJS | Observables and operators |
| Angular Material / CDK, PrimeNG, ng-zorro | UI component libraries |
| NgRx (Store, Effects, Signal Store), NGXS, Akita/Elf | State management |
| Vitest / Karma + Jasmine (older), Jest | Unit tests |
| Playwright, Cypress | E2E (Protractor deprecated) |
| Nx | Monorepos and build tooling |
| Angular SSR (`@angular/ssr`) | Server-side rendering, hydration, prerendering |
| ESLint (`angular-eslint`), Prettier | Lint/format |

# Module: Getting Started

## Lesson: [Basic|High] Angular CLI and project structure

```bash
npm install -g @angular/cli
ng new shop --style=scss --ssr=false
cd shop
ng serve -o                                  # dev server on http://localhost:4200
ng generate component orders/order-list      # ng g c
ng generate service core/order               # ng g s
ng generate pipe shared/status-label
ng generate guard core/auth
ng build                                     # production build by default → dist/
ng test
ng update @angular/core @angular/cli         # upgrade versions
ng add @angular/material
```

```
src/
  main.ts                bootstrapApplication(App, appConfig)
  app/
    app.config.ts        providers: provideRouter(routes), provideHttpClient(), ...
    app.routes.ts        route definitions
    app.ts / app.html    root component
    orders/              feature folder (components, services)
  styles.scss
angular.json             workspace/build configuration
tsconfig.json
```

## Lesson: [Basic|High] Components, templates and data binding

```ts
import { Component, input, output, signal, computed } from "@angular/core";
import { CurrencyPipe } from "@angular/common";

@Component({
  selector: "app-order-card",
  imports: [CurrencyPipe],                        // standalone: import what the template uses
  template: `
    <div class="card" [class.paid]="order().status === 'paid'">
      <h3>#{{ order().id }} — {{ order().customer }}</h3>
      <p>{{ order().total | currency:'INR' }}</p>
      <input [value]="note()" (input)="note.set($any($event.target).value)" />
      <button (click)="select.emit(order().id)" [disabled]="busy()">Open</button>
    </div>`,
  styleUrl: "./order-card.scss",
})
export class OrderCard {
  order = input.required<Order>();                // signal input (v17.1+)
  select = output<number>();                      // output (v17.3+)
  note = signal("");
  busy = signal(false);
  isBig = computed(() => this.order().total > 10000);
}
```

| Binding | Syntax | Direction |
|---|---|---|
| Interpolation | `{{ value }}` | Component → view |
| Property binding | `[disabled]="isBusy"` | Component → view |
| Attribute/class/style | `[attr.aria-label]`, `[class.active]`, `[style.width.px]` | Component → view |
| Event binding | `(click)="save()"` | View → component |
| Two-way binding | `[(ngModel)]="name"` or `[(value)]` with `model()` | Both ("banana in a box") |

Classic decorators still work: `@Input()`, `@Output() select = new EventEmitter<number>()`.

## Lesson: [Basic|High] Built-in control flow, directives and pipes

```html
@if (orders().length > 0) {
  <ul>
    @for (o of orders(); track o.id; let i = $index) {
      <li>{{ i + 1 }}. {{ o.customer }} — {{ o.total | currency:'INR' }}</li>
    } @empty {
      <li>No orders</li>
    }
  </ul>
} @else {
  <p>Loading…</p>
}

@switch (status()) {
  @case ('paid') { <span class="ok">Paid</span> }
  @default { <span>Pending</span> }
}

@defer (on viewport) { <app-sales-chart /> } @placeholder { <p>Chart loads when visible</p> }
@let total = order().qty * order().price;
```

Legacy structural directives (deprecated in v20, still common in existing code): `*ngIf="cond; else loading"`, `*ngFor="let o of orders; trackBy: trackById"`, `[ngSwitch]`. Attribute directives: `[ngClass]`, `[ngStyle]`, `[(ngModel)]`.

Pipes transform values in templates: `date`, `currency`, `number`, `percent`, `uppercase`, `lowercase`, `titlecase`, `json`, `slice`, `keyvalue`, **`async`** (subscribes to an Observable/Promise and unsubscribes automatically). Pipes are **pure** by default (re-run only when inputs change).

```ts
@Pipe({ name: "statusLabel" })
export class StatusLabelPipe implements PipeTransform {
  transform(status: string): string { return { paid: "Paid", pending: "Pending" }[status] ?? status; }
}
```

# Module: Services, DI and HTTP

## Lesson: [Intermediate|High] Services and dependency injection

```ts
@Injectable({ providedIn: "root" })                // app-wide singleton, tree-shakable
export class OrderService {
  private http = inject(HttpClient);               // inject() function (or constructor injection)
  list() { return this.http.get<Order[]>("/api/orders"); }
}

// Component-level provider: a new instance per component instance
@Component({ selector: "app-wizard", providers: [WizardState], template: "" })
export class Wizard { state = inject(WizardState); }

// Injection tokens for non-class values
export const API_URL = new InjectionToken<string>("API_URL");
// app.config.ts: providers: [{ provide: API_URL, useValue: "https://api.example.com" }]
```

Provider recipes: `useClass`, `useValue`, `useFactory`, `useExisting`. **Hierarchical injectors**: environment (root/platform/route) injectors and element (component) injectors — Angular looks up from the component to its ancestors to the root. Resolution modifiers: `{ optional: true }`, `{ self: true }`, `{ skipSelf: true }`, `{ host: true }`.

## Lesson: [Intermediate|High] HttpClient, interceptors and error handling

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({ count: 2, delay: 500 }),                          // only for idempotent GETs in practice
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) inject(Router).navigate(["/login"]);
      return throwError(() => err);
    }),
  );

// In a service
getOrder(id: number) {
  return this.http.get<Order>(`/api/orders/${id}`, { params: { include: "lines" } });
}
```

HttpClient returns **cold observables** — nothing happens until you subscribe (or use the `async` pipe / `toSignal`). Newer: `httpResource()` (signal-based HTTP resource, v19.2+).

## Lesson: [Intermediate|High] RxJS essentials

```ts
search = new FormControl("");
results$ = this.search.valueChanges.pipe(
  debounceTime(300),
  map(v => v?.trim() ?? ""),
  distinctUntilChanged(),
  filter(term => term.length >= 2),
  switchMap(term => this.api.search(term).pipe(catchError(() => of([])))),   // cancels the previous request
  shareReplay({ bufferSize: 1, refCount: true }),
);
```

| Operator | Use |
|---|---|
| `map`, `filter`, `tap` | Transform, filter, side effects |
| `switchMap` | Switch to a new inner observable, **cancel** the previous (search, route params) |
| `mergeMap` | Run inner observables **concurrently** (fire-and-forget saves) |
| `concatMap` | Run **in order**, one at a time (queue of writes) |
| `exhaustMap` | **Ignore** new values while busy (login button double-click) |
| `combineLatest`, `forkJoin`, `zip`, `withLatestFrom` | Combine streams (`forkJoin` = like Promise.all, completes once) |
| `debounceTime`, `throttleTime`, `distinctUntilChanged` | Rate control |
| `catchError`, `retry` | Error handling |
| `takeUntil`, `takeUntilDestroyed`, `take(1)`, `first` | Completion/unsubscription |
| `shareReplay` | Multicast and cache the last value |

**Subjects**: `Subject` (no initial value), `BehaviorSubject` (has current value — simple state), `ReplaySubject(n)`, `AsyncSubject`. **Cold** observables start per subscriber (HTTP); **hot** share one source (DOM events, Subjects).

**Unsubscribing**: the `async` pipe, `takeUntilDestroyed()`, `toSignal()` — avoid manual subscriptions that leak.

# Module: Signals, Change Detection and State

## Lesson: [Intermediate|High] Signals

```ts
count = signal(0);                                   // writable signal
double = computed(() => this.count() * 2);           // derived, memoised, lazy
constructor() {
  effect(() => console.log("count is", this.count()));   // side effects when dependencies change
}
increment() { this.count.update(c => c + 1); }        // or .set(5)

// Interop with RxJS
orders = toSignal(this.orderService.list(), { initialValue: [] });
count$ = toObservable(this.count);

// linkedSignal: writable state that resets when a source changes (v19)
selectedId = linkedSignal(() => this.orders()[0]?.id);

// resource: async data as signals (v19, experimental → evolving)
user = resource({ params: () => ({ id: this.userId() }), loader: ({ params }) => fetchUser(params.id) });
```

Signals tell Angular exactly which components depend on which state, enabling fine-grained, **zoneless** change detection. Read a signal by calling it: `count()`. Signal inputs (`input()`), outputs (`output()`), `model()` for two-way, and `viewChild()`/`contentChild()` queries are signal-based too.

## Lesson: [Advanced|High] Change detection: Default vs OnPush, zone.js vs zoneless

- **Default strategy**: after any async event, Angular checks the whole component tree.
- **`ChangeDetectionStrategy.OnPush`**: a component is checked only when an input **reference** changes, an event originates in it (or children), an `async` pipe emits, a signal it reads changes, or `markForCheck()` is called. Use immutable data. Big performance win.
- **zone.js** patches async APIs (setTimeout, promises, events) to know when to run change detection.
- **Zoneless** (`provideZonelessChangeDetection()`, default for new apps in v21): no zone.js; change detection is triggered by signals, `markForCheck`, template events, async pipe → smaller bundles, better performance, clearer stack traces. Third-party code that mutates state outside Angular needs signals or `markForCheck`.
- `ChangeDetectorRef`: `markForCheck()`, `detectChanges()`, `detach()`.
- **ExpressionChangedAfterItHasBeenCheckedError** (dev mode): a binding value changed during the same check cycle (e.g. changing state in `ngAfterViewInit`) — fix the data flow (compute earlier, use signals, or schedule).

## Lesson: [Intermediate|Medium] Component communication and content projection

| Pattern | How |
|---|---|
| Parent → child | `input()` / `@Input()` |
| Child → parent | `output()` / `@Output()` + EventEmitter |
| Two-way | `model()` / `[(x)]` |
| Parent accesses child | `viewChild()` / `@ViewChild()` |
| Siblings / unrelated | Shared **service** with signals or BehaviorSubject |
| Global | State management store (NgRx, Signal Store) |
| Router | Route params, query params, `withComponentInputBinding()` |

```html
<!-- card.component.html: content projection -->
<div class="card">
  <header><ng-content select="[card-title]" /></header>
  <ng-content />
</div>
<!-- usage -->
<app-card><h3 card-title>Orders</h3><p>Body</p></app-card>
```

`ng-template` (not rendered until used), `ng-container` (grouping without an extra element), `ngTemplateOutlet` (render a template dynamically).

## Lesson: [Advanced|Medium] State management: services with signals, NgRx

- Small/medium apps: **services with signals** (or BehaviorSubject) exposing read-only state and methods.
- Large apps: **NgRx Store** (Redux pattern): **Actions** (events) → **Reducers** (pure functions producing new state) → **Store** (single immutable state tree) → **Selectors** (memoised queries); **Effects** handle side effects (HTTP) and dispatch new actions. Redux DevTools for time-travel debugging.
- **NgRx Signal Store** — lighter, signal-based store (`signalStore`, `withState`, `withComputed`, `withMethods`).

```ts
@Injectable({ providedIn: "root" })
export class CartStore {
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();
  readonly total = computed(() => this._items().reduce((s, i) => s + i.price * i.qty, 0));
  add(item: CartItem) { this._items.update(items => [...items, item]); }   // immutable update
}
```

# Module: Routing and Forms

## Lesson: [Intermediate|High] Routing, lazy loading, guards and resolvers

```ts
export const routes: Routes = [
  { path: "", component: Home },
  { path: "orders", loadComponent: () => import("./orders/order-list").then(m => m.OrderList) },     // lazy component
  { path: "admin", canActivate: [authGuard], canMatch: [adminGuard],
    loadChildren: () => import("./admin/admin.routes").then(m => m.ADMIN_ROUTES) },                  // lazy route group
  { path: "orders/:id", component: OrderDetail, resolve: { order: orderResolver } },
  { path: "**", component: NotFound },
];

export const authGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn() ? true : inject(Router).createUrlTree(["/login"]);

export const orderResolver: ResolveFn<Order> = route =>
  inject(OrderService).get(Number(route.paramMap.get("id")));
```

```html
<a routerLink="/orders" routerLinkActive="active">Orders</a>
<a [routerLink]="['/orders', o.id]" [queryParams]="{ tab: 'lines' }">Open</a>
<router-outlet />
```

Guards: `canActivate`, `canActivateChild`, `canDeactivate` (unsaved changes), `canMatch` (choose route/lazy load), `resolve`. Read params: `ActivatedRoute.paramMap` (observable) or component input binding (`withComponentInputBinding()` → `id = input<string>()`). **Preloading** strategies: `withPreloading(PreloadAllModules)`.

## Lesson: [Intermediate|High] Template-driven vs reactive forms

```ts
// Reactive (typed) form
private fb = inject(NonNullableFormBuilder);
form = this.fb.group({
  customer: ["", [Validators.required, Validators.minLength(3)]],
  email: ["", [Validators.required, Validators.email]],
  lines: this.fb.array([this.newLine()]),
});
newLine() { return this.fb.group({ productId: [0, Validators.min(1)], qty: [1, [Validators.min(1), Validators.max(100)]] }); }
save() { if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.api.save(this.form.getRawValue()); }
```

```html
<form [formGroup]="form" (ngSubmit)="save()">
  <input formControlName="customer" />
  @if (form.controls.customer.touched && form.controls.customer.hasError('required')) { <small>Required</small> }
  <button [disabled]="form.invalid">Save</button>
</form>
```

| | Template-driven | Reactive |
|---|---|---|
| Model defined in | Template (`ngModel`) | Component class (`FormGroup`/`FormControl`) |
| Data flow | Async, two-way binding | Sync, explicit, immutable updates |
| Validation | Directives (`required`, custom validator directives) | Functions (`Validators`, custom/async validators) |
| Testing | Harder (needs DOM) | Easy (pure TS) |
| Dynamic forms | Awkward | `FormArray`, add/remove controls |
| Use | Simple forms | Complex/dynamic/enterprise forms |

Custom validator: `(control: AbstractControl): ValidationErrors | null`. Async validator returns `Observable<ValidationErrors | null>` (e.g. "username taken"). v21 adds experimental **Signal Forms**.

# Module: Quality and Performance

## Lesson: [Intermediate|Medium] Testing Angular apps

```ts
describe("OrderCard", () => {
  it("emits the id when clicked", async () => {
    await TestBed.configureTestingModule({ imports: [OrderCard] }).compileComponents();
    const fixture = TestBed.createComponent(OrderCard);
    fixture.componentRef.setInput("order", { id: 7, customer: "Asha", total: 500, status: "paid" });
    let emitted: number | undefined;
    fixture.componentInstance.select.subscribe(id => (emitted = id));
    fixture.detectChanges();
    fixture.nativeElement.querySelector("button").click();
    expect(emitted).toBe(7);
  });
});

// Services with HTTP
TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
const httpMock = TestBed.inject(HttpTestingController);
httpMock.expectOne("/api/orders").flush([]);
```

Runners: **Vitest** (default in new v21 projects), Jest, or Karma + Jasmine (older projects; Karma is deprecated). Component harnesses (CDK) for Material components; Playwright/Cypress for E2E.

## Lesson: [Advanced|High] Performance optimisation

1. **OnPush** everywhere + immutable data + signals; consider zoneless.
2. **Lazy load** routes (`loadComponent`/`loadChildren`) and `@defer` heavy blocks.
3. `track` in `@for` (or `trackBy`) to avoid re-rendering lists.
4. **Virtual scrolling** (`cdk-virtual-scroll-viewport`) for long lists.
5. Avoid function calls in templates (use `computed`/pure pipes).
6. Unsubscribe (async pipe, `takeUntilDestroyed`) to prevent leaks.
7. **SSR + hydration** (`@angular/ssr`, incremental hydration) for first paint and SEO; prerender static routes.
8. `NgOptimizedImage` (`ngSrc`) for images; budgets in `angular.json`; analyse bundles (`ng build --stats-json` + esbuild/webpack analyzers).
9. Web Workers for heavy computation; preloading strategies.
10. Production builds (AOT, tree-shaking, minification are default).

# Interview

## [Beginner|High] What is Angular and how is it different from AngularJS?

Angular is a TypeScript-based, component-driven framework (2016+, by Google) with a CLI, hierarchical DI, RxJS, signals, a router, forms and HTTP modules, AOT compilation and SSR. AngularJS (1.x) used JavaScript, controllers and `$scope`, two-way binding with dirty-checking digest cycles, and reached EOL in Dec 2021. Angular is faster, more modular, mobile-friendly, and has semver releases every six months.

## [Beginner|High] What are components and what is a standalone component?

A component is a TypeScript class decorated with `@Component` that controls a piece of UI through its template and styles, with a selector used in other templates. A standalone component (v14+, default since v19) declares its own dependencies via `imports` without belonging to an NgModule, making apps simpler, enabling lazy loading per component, and reducing boilerplate.

## [Beginner|High] Explain the types of data binding in Angular.

Interpolation `{{ }}` and property binding `[prop]="expr"` (component → view), event binding `(event)="handler()"` (view → component), and two-way binding `[(ngModel)]="value"` (banana-in-a-box: property + event). Also attribute `[attr.x]`, class `[class.x]` and style `[style.x]` bindings.

## [Beginner|High] What are directives? Types of directives?

Classes that add behaviour to elements. **Components** are directives with templates. **Attribute directives** change appearance/behaviour (`ngClass`, `ngStyle`, custom `appHighlight`). **Structural directives** change DOM layout by adding/removing elements (`*ngIf`, `*ngFor`, `*ngSwitch` — now largely replaced by built-in control flow `@if`, `@for`, `@switch`).

## [Beginner|High] What are pipes? Pure vs impure?

Pipes transform values in templates (`date`, `currency`, `async`, custom). Pure pipes (default) run only when the input value/reference changes — efficient. Impure pipes (`pure: false`) run on every change detection cycle — needed for detecting changes inside mutable objects/arrays, but expensive. `async` is impure because it tracks emissions.

## [Beginner|Medium] What is the Angular CLI? Name common commands.

The official command-line tool to scaffold, develop, build, test and update Angular apps: `ng new`, `ng serve`, `ng generate component|service|pipe|guard|directive`, `ng build`, `ng test`, `ng e2e`, `ng add` (add libraries with schematics), `ng update` (automated migrations between versions), `ng lint` (with angular-eslint).

## [Intermediate|High] Explain the component lifecycle hooks.

`ngOnChanges` (input changes, before init), `ngOnInit` (once, initialise/fetch data), `ngDoCheck` (each CD cycle), `ngAfterContentInit`/`ngAfterContentChecked` (projected content), `ngAfterViewInit`/`ngAfterViewChecked` (view and child views, `@ViewChild` ready), `ngOnDestroy` (cleanup). The constructor is for DI only. Modern code often uses signal inputs/`computed` instead of `ngOnChanges`, `afterNextRender` for DOM work and `DestroyRef`/`takeUntilDestroyed` for cleanup.

## [Intermediate|High] What is dependency injection in Angular? What does `providedIn: 'root'` mean?

DI supplies a class's dependencies from injectors instead of the class creating them. Services are registered with providers; consumers use `inject(Service)` or constructor parameters. `@Injectable({ providedIn: 'root' })` registers a tree-shakable application-wide singleton. Providers can also be scoped to routes or components (new instance per component). Injectors are hierarchical: lookup goes from the element injector up to the root/environment injector.

## [Intermediate|High] Observable vs Promise?

A Promise handles a single future value, is eager (starts immediately), and isn't cancellable. An Observable can emit many values over time, is lazy (runs on subscribe), cancellable (unsubscribe), and composable with operators (map, switchMap, debounceTime, retry). Angular uses Observables for HttpClient, router events, forms valueChanges; convert with `firstValueFrom`/`toSignal` when convenient.

## [Intermediate|High] switchMap vs mergeMap vs concatMap vs exhaustMap?

All map each source value to an inner observable and flatten. `switchMap` cancels the previous inner observable when a new value arrives (typeahead search, route param changes). `mergeMap` runs all concurrently (parallel independent requests). `concatMap` queues them and runs one after another in order (sequential saves). `exhaustMap` ignores new values while the current inner observable is active (prevent duplicate login submissions).

## [Intermediate|High] What are signals and why were they introduced?

Signals (v16+) are reactive primitives holding a value: `signal()` (writable), `computed()` (derived, memoised), `effect()` (side effects). Angular tracks which templates/computeds read which signals, so it knows exactly what changed and can update only affected components — enabling fine-grained, zoneless change detection, simpler state than RxJS for synchronous state, and better performance. RxJS remains useful for async event streams; `toSignal`/`toObservable` bridge them.

## [Intermediate|High] Template-driven vs reactive forms — which do you use?

Template-driven forms define the model in the template with `ngModel` and directive validators — quick for simple forms. Reactive forms define `FormGroup`/`FormControl`/`FormArray` in the component, are synchronous, strongly typed (v14+), easy to unit test, and ideal for complex, dynamic forms with custom/async validators. Most enterprise apps use reactive forms; v21 previews signal-based forms.

## [Intermediate|High] How do you implement route guards and lazy loading?

Guards are functions (`CanActivateFn`, `CanMatchFn`, `CanDeactivateFn`, `ResolveFn`) listed on routes; they return boolean, UrlTree (redirect), or an observable/promise of those — e.g. `authGuard` redirects to /login. Lazy loading uses `loadComponent: () => import(...)` or `loadChildren` so feature code is downloaded only when the route is visited, reducing the initial bundle; preloading strategies can fetch them in the background.

## [Intermediate|Medium] How do components communicate?

Parent to child with inputs; child to parent with outputs (events); two-way with `model()`; parent to child methods via `viewChild`; siblings/unrelated components through a shared injectable service holding signals or a BehaviorSubject; app-wide via a store (NgRx); and through the router (params, query params, state).

## [Intermediate|Medium] What is an HTTP interceptor?

A function (`HttpInterceptorFn`) or class registered with `provideHttpClient(withInterceptors([...]))` that sees every outgoing request and incoming response. Uses: attaching auth tokens, adding headers, global error handling (401 redirect, toast), logging, loading spinners, caching, retrying. Requests are immutable — use `req.clone()` to modify.

## [Advanced|High] Explain change detection. What does OnPush do? What is zoneless?

Change detection syncs component state to the DOM. With zone.js, Angular runs a check over the tree after any async event. `OnPush` limits checks of a component to when its input references change, an event happens inside it, an async pipe emits, a signal it reads changes, or `markForCheck()` is called — fewer checks, better performance, but requires immutable updates. Zoneless mode (default for new apps in v21) removes zone.js entirely; change detection is scheduled by signals, events and explicit notifications, which gives smaller bundles and more predictable updates.

## [Advanced|High] How do you prevent memory leaks in Angular?

Unsubscribe from long-lived observables: prefer the `async` pipe or `toSignal`, use `takeUntilDestroyed()` (or `takeUntil` with a destroy subject), remove manual DOM listeners and timers in `ngOnDestroy`/`DestroyRef.onDestroy`, avoid storing component references in singleton services, and be careful with `effect()`s that create subscriptions. HttpClient requests complete on their own but still should be cancelled if the component is destroyed mid-request (switchMap/takeUntilDestroyed).

## [Advanced|Medium] What is SSR and hydration in Angular?

Server-side rendering (`@angular/ssr`) renders pages on the server (or prerenders at build time) so users and search engines get HTML immediately. Hydration then reuses that DOM in the browser instead of re-rendering it (non-destructive hydration v16+), with event replay so early clicks aren't lost and incremental hydration (v19) to hydrate parts lazily with `@defer` triggers. Watch for browser-only APIs (`window`, `localStorage`) — guard them with `isPlatformBrowser` or `afterNextRender`.

## [Advanced|Medium] What is NgRx and when should you use it?

A Redux-style state management library: actions describe events, reducers produce new immutable state, the store holds a single state tree, selectors read memoised slices, effects handle side effects like HTTP. Use it for large apps with complex shared state, many teams, and a need for predictability, debugging (DevTools time travel) and strict patterns. For small/medium apps, signal-based services or NgRx Signal Store are simpler.

## [Scenario|High] A list of 10,000 rows renders slowly and scrolling lags. How do you optimise?

Use CDK virtual scrolling (`cdk-virtual-scroll-viewport`) so only visible rows are in the DOM; `track item.id` in `@for`; `OnPush` row components with immutable inputs; avoid function calls and impure pipes in row templates (use computed/pure pipes); paginate or load incrementally from the API; move heavy computations to a Web Worker; and measure with Angular DevTools profiler.

## [Scenario|High] Your search box sends a request on every keystroke and results sometimes appear out of order. Fix it.

Use a reactive control and RxJS: `valueChanges.pipe(debounceTime(300), distinctUntilChanged(), filter(t => t.length >= 2), switchMap(t => this.api.search(t)))`. `switchMap` cancels the previous HTTP request, so stale responses can't overwrite newer ones. Show results with the `async` pipe or `toSignal`, and handle errors with `catchError` returning an empty list.

## [Scenario|High] After login, some API calls still go out without the token, and expired tokens cause random 401s. How do you design auth handling?

Centralise it: an auth service storing the token (in memory/signal; refresh token in an HttpOnly cookie via the backend), a functional interceptor that adds the `Authorization` header to API requests, and on 401 attempts a single shared refresh (queue concurrent requests while refreshing using a shared observable), then retries; if refresh fails, log out and redirect via a guard. Protect routes with `canActivate`/`canMatch` guards; never rely on the frontend for real authorisation — the API must enforce it.

## [Scenario|Medium] You get "ExpressionChangedAfterItHasBeenCheckedError". What does it mean and how do you fix it?

In development mode Angular runs a second check after change detection; the error means a bound value changed between the first and second check — usually state modified in `ngAfterViewInit`/`ngAfterContentInit`, in a child that updates the parent during the same cycle, or a getter returning a new value each time. Fix the data flow: initialise values earlier (`ngOnInit`), derive with `computed`, move updates into an event or the next tick only as a last resort, or restructure so children don't mutate parent state during rendering.

## [Scenario|Medium] How would you upgrade an Angular 12 app to the latest version?

Upgrade one major version at a time with `ng update @angular/core@13 @angular/cli@13` (and so on), following angular.dev/update-guide for each step; update Angular Material and third-party libraries alongside; fix breaking changes and run tests after each hop; along the way migrate to standalone components (`ng generate @angular/core:standalone`), built-in control flow (`ng generate @angular/core:control-flow`), signal inputs, the esbuild application builder, and functional guards/interceptors; check Node and TypeScript version requirements.

# Cheatsheet

## CLI

`ng new` · `ng serve` · `ng g c|s|p|d|g` · `ng build` · `ng test` · `ng add` · `ng update`.

## Bindings

`{{ }}` · `[prop]` · `(event)` · `[(ngModel)]` · `[class.x]` · `[style.x]` · `[attr.x]`.

## Control flow (v17+)

`@if / @else` · `@for (x of xs; track x.id) {} @empty {}` · `@switch / @case` · `@defer (on viewport)` · `@let`.

## Signals

`signal()` · `computed()` · `effect()` · `linkedSignal()` · `resource()` · `input()` · `output()` · `model()` · `viewChild()` · `toSignal()` / `toObservable()`.

## Lifecycle

constructor → ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit/Checked → ngAfterViewInit/Checked → ngOnDestroy.

## RxJS

switchMap (cancel) · mergeMap (parallel) · concatMap (sequential) · exhaustMap (ignore while busy) · debounceTime · distinctUntilChanged · catchError · retry · forkJoin · combineLatest · shareReplay · takeUntilDestroyed · BehaviorSubject.

## Routing

`provideRouter(routes)` · `loadComponent` / `loadChildren` · guards `CanActivateFn` / `CanMatchFn` / `CanDeactivateFn` · `ResolveFn` · `routerLink` · `<router-outlet />`.

## Forms

Template-driven (`ngModel`) vs Reactive (`FormGroup`, `FormControl`, `FormArray`, `Validators`, typed) · Signal Forms (v21, experimental).

## Performance

OnPush · signals · zoneless · lazy routes · @defer · track · virtual scroll · SSR + hydration · NgOptimizedImage · no functions in templates.

## Versions

2 (2016) · 9 Ivy · 14 standalone · 16 signals · 17 control flow + @defer · 19 standalone default · 20 stable signals · **21 zoneless default + Vitest** · major every 6 months, 18-month support.
