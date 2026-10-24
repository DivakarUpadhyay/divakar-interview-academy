---
slug: javascript
title: JavaScript (ES5 → ES2025) & TypeScript Basics
track: frontend
order: 2
group: Web Basics
icon: JS
color: #f59f00
summary: Types, scope, hoisting, closures, this, prototypes, classes, the event loop, promises and async/await, modules, DOM and events, fetch, ES6+ features, error handling, performance, security and TypeScript essentials.
---

# Overview

**JavaScript** is the programming language of the web: it runs in every browser and, through **Node.js**, on servers, CLIs and build tools. It is dynamically typed, single-threaded with an **event loop**, prototype-based, and supports functional and object-oriented styles.

The language standard is **ECMAScript** (ECMA-262), maintained by **TC39**. Browsers implement it in engines: **V8** (Chrome, Edge, Node.js), **SpiderMonkey** (Firefox), **JavaScriptCore** (Safari).

**TypeScript** (Microsoft, 2012) is a typed superset of JavaScript that compiles to JS — the default for Angular and widely used with React, Vue and Node.

Every frontend framework interview (jQuery, Angular, React, Vue) starts with JavaScript fundamentals: closures, `this`, the event loop, promises, `var`/`let`/`const`, prototypes and array methods.

# Versions

| Version | Year | Key features |
|---|---|---|
| ES1 | 1997 | First standard (language created by Brendan Eich at Netscape in 10 days, 1995) |
| ES3 | 1999 | Regex, try/catch |
| ES5 | 2009 | `"use strict"`, JSON, `Array.prototype.forEach/map/filter/reduce`, getters/setters, `Object.create` |
| **ES6 / ES2015** | 2015 | `let`/`const`, arrow functions, classes, modules, promises, template literals, destructuring, default/rest/spread, `Map`/`Set`, symbols, iterators, generators |
| ES2016 | 2016 | `Array.prototype.includes`, `**` |
| ES2017 | 2017 | **async/await**, `Object.entries/values`, string padding |
| ES2018 | 2018 | Object rest/spread, async iteration, `Promise.finally`, regex named groups |
| ES2019 | 2019 | `Array.flat/flatMap`, `Object.fromEntries`, optional catch binding |
| ES2020 | 2020 | **Optional chaining `?.`**, **nullish coalescing `??`**, `BigInt`, `Promise.allSettled`, dynamic `import()`, `globalThis` |
| ES2021 | 2021 | `String.replaceAll`, `Promise.any`, logical assignment `??=` `||=` `&&=`, numeric separators `1_000` |
| ES2022 | 2022 | Class fields and `#private`, top-level `await`, `.at()`, `Object.hasOwn`, error `cause` |
| ES2023 | 2023 | `toSorted/toReversed/toSpliced/with` (non-mutating), `findLast` |
| ES2024 | 2024 | `Object.groupBy`/`Map.groupBy`, `Promise.withResolvers`, resizable ArrayBuffer |
| ES2025 | 2025 | Iterator helpers (`.map/.filter/.take` on iterators), **Set methods** (`union`, `intersection`, `difference`...), `Promise.try`, JSON modules / import attributes, `RegExp.escape` |

TypeScript: 1.0 (2014), 2.0 (2016, strict null checks), 3.x, 4.x (2020–2023), **5.0** (2023, decorators standard), then regular 5.x releases. **TypeScript 7** is a native port of the compiler to Go (codename "Project Corsa", previewed since 2025) that makes builds roughly 10× faster.

# Lifecycle

**How a browser runs JavaScript (page lifecycle):**

1. HTML parsed → DOM built; CSS → CSSOM; `<script>` without `defer`/`async` **blocks** parsing while it downloads and runs.
2. `defer` scripts run in order after parsing; `async` scripts run as soon as downloaded (any order); `type="module"` is deferred by default.
3. **DOMContentLoaded** — DOM ready (deferred scripts done).
4. **load** — all images, styles, iframes loaded.
5. User interaction → events → event loop runs handlers.
6. **visibilitychange / pagehide** → **beforeunload** → **unload** (avoid unload; use pagehide/visibilitychange).

**Execution lifecycle of code:** the engine parses source → creates the **global execution context** (creation phase: memory for variables/functions = *hoisting*; execution phase: runs line by line) → each function call pushes a new execution context on the **call stack** → returns pop it. Async callbacks wait in **task queues** until the stack is empty (the **event loop**).

**Event loop order:** run the current script (macrotask) → drain **all microtasks** (promise callbacks, `queueMicrotask`, `MutationObserver`) → render (requestAnimationFrame, style, layout, paint) → next macrotask (`setTimeout`, `setInterval`, I/O, UI events, `MessageChannel`).

# Tools

| Tool | Use |
|---|---|
| Browser DevTools (Chrome/Edge/Firefox) | Console, debugger, network, performance, memory |
| VS Code | Editor with built-in JS/TS IntelliSense |
| Node.js + npm / pnpm / yarn / Bun | Runtime and package managers |
| **Vite**, webpack, esbuild, Rollup, Turbopack | Bundlers/dev servers |
| **TypeScript** (`tsc`) | Type checking |
| ESLint, Prettier, Biome | Linting and formatting |
| Vitest, Jest, Mocha | Unit testing |
| Playwright, Cypress | End-to-end testing |
| Babel | Transpile modern JS for old browsers |
| Lighthouse, WebPageTest | Performance audits |
| caniuse.com, MDN | Compatibility and reference |

# Module: Language Basics

## Lesson: [Basic|High] Data types, typeof and equality

Primitive types (immutable, compared by value): `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, `null`. Everything else is an **object** (objects, arrays, functions, dates, maps), compared by reference.

```js
typeof "hi"        // "string"
typeof 42          // "number"
typeof 10n         // "bigint"
typeof undefined   // "undefined"
typeof null        // "object"  ← historical bug
typeof []          // "object"  → use Array.isArray([])
typeof function(){} // "function"

0.1 + 0.2 === 0.3            // false (floating point) → compare with Number.EPSILON or use integers (paise)
NaN === NaN                  // false → Number.isNaN(x)

// == converts types (coercion); === compares type and value
"5" == 5          // true
"5" === 5         // false
null == undefined // true
null === undefined // false
[] == false       // true (weird coercion) → always use ===
```

**Falsy values:** `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy (including `"0"`, `[]`, `{}`).

## Lesson: [Basic|High] var, let and const; scope and hoisting

| | `var` | `let` | `const` |
|---|---|---|---|
| Scope | Function | Block `{}` | Block |
| Hoisted | Yes, initialised to `undefined` | Yes, but in the **Temporal Dead Zone** until declared | Same as let |
| Re-declare | Allowed | Not allowed | Not allowed |
| Re-assign | Yes | Yes | **No** (but object contents can change) |
| Global object property | Yes (`window.x`) | No | No |

```js
console.log(a);   // undefined (hoisted var)
var a = 1;
console.log(b);   // ReferenceError: Cannot access 'b' before initialization (TDZ)
let b = 2;

const user = { name: "Asha" };
user.name = "Ravi";      // allowed — the binding is constant, not the object
// user = {};            // TypeError
Object.freeze(user);     // shallow immutability

sayHi();                  // works — function declarations are fully hoisted
function sayHi() { console.log("hi"); }
// sayBye();              // TypeError — function expressions follow variable rules
var sayBye = function () {};
```

Scopes: global, function, block, module. **Lexical scoping**: a function's scope is determined by where it is written, not where it is called.

## Lesson: [Basic|High] Functions: declarations, expressions, arrows, default/rest/spread

```js
function add(a, b = 0) { return a + b; }            // declaration + default parameter
const mul = function (a, b) { return a * b; };       // expression
const square = x => x * x;                           // arrow function
const sum = (...nums) => nums.reduce((t, n) => t + n, 0);   // rest parameters
Math.max(...[3, 9, 2]);                              // spread into arguments

const copy = [...arr, 4];                            // spread array
const merged = { ...defaults, ...options };          // spread object (later wins)

// IIFE — immediately invoked function expression (old module pattern)
(function () { const secret = 1; })();
```

**Arrow functions:** no own `this`, `arguments`, `super` or `prototype`; can't be used with `new`; implicit return for single expressions. Great for callbacks; avoid as object methods that need `this`.

**Higher-order functions** take or return functions (`map`, `filter`, `setTimeout`, debounce). **Pure functions** return the same output for the same input with no side effects.

## Lesson: [Basic|High] Arrays and objects — the essential methods

```js
const orders = [
  { id: 1, customer: "Asha", total: 1200, status: "paid" },
  { id: 2, customer: "Ravi", total: 300, status: "pending" },
  { id: 3, customer: "Asha", total: 450, status: "paid" },
];

orders.map(o => o.total);                          // [1200, 300, 450]
orders.filter(o => o.status === "paid");           // 2 items
orders.reduce((sum, o) => sum + o.total, 0);       // 1950
orders.find(o => o.id === 2);                      // object or undefined
orders.findIndex(o => o.id === 2);                 // 1
orders.some(o => o.total > 1000);                  // true
orders.every(o => o.total > 100);                  // true
orders.forEach(o => console.log(o.id));            // returns undefined
[3, 1, 2].sort((a, b) => a - b);                   // MUTATES; default sort is by string!
[3, 1, 2].toSorted((a, b) => a - b);               // non-mutating (ES2023)
[[1, 2], [3]].flat();                              // [1, 2, 3]
Object.groupBy(orders, o => o.customer);           // { Asha: [...], Ravi: [...] } (ES2024)
orders.at(-1);                                     // last item

// Mutating: push, pop, shift, unshift, splice, sort, reverse, fill
// Non-mutating: map, filter, slice, concat, toSorted, toReversed, toSpliced, with

// Objects
const { customer, total = 0, ...rest } = orders[0];   // destructuring with default + rest
Object.keys(obj); Object.values(obj); Object.entries(obj);
Object.fromEntries([["a", 1]]);
structuredClone(obj);                                // deep copy (no functions)
user?.address?.city ?? "Unknown";                    // optional chaining + nullish coalescing
```

`??` falls back only on `null`/`undefined`; `||` falls back on any falsy value (`0 || 10` → 10, `0 ?? 10` → 0).

# Module: Core Concepts

## Lesson: [Intermediate|High] Closures

A **closure** is a function bundled with references to the variables of the scope in which it was created; it keeps them alive after that scope has returned.

```js
function createCounter() {
  let count = 0;                      // private state
  return {
    increment: () => ++count,
    getCount: () => count,
  };
}
const counter = createCounter();
counter.increment(); counter.increment();
counter.getCount();                   // 2 — count is not accessible directly

// Function factory
const multiplier = factor => n => n * factor;
const double = multiplier(2);
double(5);                            // 10

// Classic loop problem
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));   // 3 3 3 — one shared 'i'
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j));   // 0 1 2 — new 'j' per iteration
```

Uses: data privacy/encapsulation, function factories, memoisation, debounce/throttle, event handlers, module pattern, partial application/currying. Risk: unintentionally retaining large objects (memory leaks).

## Lesson: [Intermediate|High] The `this` keyword, call, apply and bind

`this` is decided by **how a function is called** (except arrow functions, which take `this` from their enclosing scope).

| Call style | `this` |
|---|---|
| `obj.method()` | `obj` |
| Plain call `fn()` | `undefined` in strict mode / modules; global object in sloppy mode |
| `new Fn()` | The new object |
| `fn.call(ctx, a, b)` / `fn.apply(ctx, [a, b])` | `ctx` |
| `fn.bind(ctx)` | Returns a new function permanently bound to `ctx` |
| Arrow function | Lexical `this` (from where it's defined) |
| DOM event handler (`function`) | The element (`event.currentTarget`) |

```js
const user = {
  name: "Divakar",
  greet() { return `Hi ${this.name}`; },
  greetLater() { setTimeout(() => console.log(this.name), 100); },   // arrow keeps 'this'
};
const greet = user.greet;
greet();                        // "Hi undefined" (lost 'this') in non-strict; TypeError in strict
greet.call({ name: "Asha" });   // "Hi Asha"
const bound = user.greet.bind(user);
bound();                        // "Hi Divakar"
```

## Lesson: [Intermediate|High] Prototypes, inheritance and classes

Every object has an internal link `[[Prototype]]` (accessible via `Object.getPrototypeOf(obj)` or `__proto__`). Property lookup walks the **prototype chain** until found or `null`.

```js
function Person(name) { this.name = name; }
Person.prototype.hello = function () { return `I am ${this.name}`; };
const p = new Person("Asha");
p.hello();                                   // found on Person.prototype

// ES6 classes — syntax over prototypes
class Animal {
  #sound;                                    // private field (ES2022)
  static count = 0;
  constructor(name, sound) { this.name = name; this.#sound = sound; Animal.count++; }
  speak() { return `${this.name} says ${this.#sound}`; }
  get label() { return this.name.toUpperCase(); }
}
class Dog extends Animal {
  constructor(name) { super(name, "woof"); }
  speak() { return super.speak() + "!"; }
}
new Dog("Rex").speak();                      // "Rex says woof!"
```

What `new` does: creates an empty object, sets its prototype to `Constructor.prototype`, calls the constructor with `this` = the object, returns the object (unless the constructor returns another object).

## Lesson: [Intermediate|High] The event loop, microtasks and macrotasks

```js
console.log("1: script start");
setTimeout(() => console.log("6: timeout"), 0);
Promise.resolve()
  .then(() => console.log("3: promise 1"))
  .then(() => console.log("5: promise 2"));
queueMicrotask(() => console.log("4: microtask"));
console.log("2: script end");
// Order: 1, 2, 3, 4, 5, 6
```

- JavaScript runs on **one main thread** with a **call stack**.
- Web APIs (timers, fetch, DOM events) run outside JS and enqueue callbacks.
- After the current task finishes, the engine drains the **microtask queue** completely, then may render, then takes the next **macrotask**.
- Long synchronous work blocks rendering and input → use async chunks, `requestIdleCallback`, or **Web Workers** for CPU-heavy work.
- Node.js has a similar loop with phases (timers, poll, check) and `process.nextTick` (runs before promise microtasks).

## Lesson: [Intermediate|High] Promises and async/await

```js
// Promise states: pending → fulfilled | rejected (settled once)
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

fetch("/api/orders/1")
  .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then(order => console.log(order))
  .catch(err => console.error(err))
  .finally(() => hideSpinner());

async function loadDashboard(userId) {
  try {
    const [user, orders] = await Promise.all([            // run in parallel
      fetch(`/api/users/${userId}`).then(r => r.json()),
      fetch(`/api/orders?user=${userId}`).then(r => r.json()),
    ]);
    return { user, orders };
  } catch (err) {
    console.error("Dashboard failed", err);
    throw err;
  }
}

// Timeout / cancellation with AbortController
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
const res = await fetch("/api/report", { signal: controller.signal });   // or AbortSignal.timeout(5000)
```

| Combinator | Resolves when | Rejects when |
|---|---|---|
| `Promise.all` | All fulfil (array of values) | **First** rejection |
| `Promise.allSettled` | All settle (status objects) | Never |
| `Promise.race` | First to settle (value) | First to settle is a rejection |
| `Promise.any` | First to fulfil | All reject (`AggregateError`) |

`async` functions always return a promise; `await` pauses the function (not the thread) until the promise settles. Sequential `await`s in a loop run one by one — use `Promise.all` for independent work.

## Lesson: [Intermediate|Medium] Modules (ESM vs CommonJS)

```js
// math.js (ES module)
export const PI = 3.14159;
export function area(r) { return PI * r * r; }
export default class Calculator {}

// app.js
import Calculator, { area, PI as pi } from "./math.js";
const { heavy } = await import("./heavy.js");          // dynamic import → code splitting

// CommonJS (Node legacy)
const fs = require("fs");
module.exports = { area };
```

ES modules: static structure (enables tree-shaking), strict mode by default, deferred in browsers (`<script type="module">`), top-level `await`, live bindings. CommonJS: synchronous `require`, used by older Node packages.

# Module: Browser and DOM

## Lesson: [Basic|High] DOM manipulation and events

```js
const list = document.querySelector("#orders");
const items = document.querySelectorAll(".order");      // static NodeList

const li = document.createElement("li");
li.textContent = "Order #42";                            // safe — no HTML parsing (prevents XSS)
li.classList.add("order", "new");
li.dataset.id = "42";                                    // data-id="42"
list.append(li);

// Event handling
button.addEventListener("click", e => {
  e.preventDefault();                                    // stop default action (form submit, link navigation)
  e.stopPropagation();                                   // stop bubbling
}, { once: true });

// Event delegation — one listener for many (and future) children
list.addEventListener("click", e => {
  const item = e.target.closest(".order");
  if (item) openOrder(item.dataset.id);
});
```

**Event propagation phases:** capture (window → target) → target → **bubble** (target → window). Listeners run in the bubble phase by default (`{ capture: true }` for capture). `e.target` = element clicked; `e.currentTarget` = element the listener is on.

Performance: batch DOM writes (DocumentFragment, `append(...nodes)`), avoid layout thrashing (reading `offsetHeight` after writes in a loop), use `requestAnimationFrame` for visual updates.

## Lesson: [Intermediate|Medium] Storage, fetch, CORS and browser APIs

| Storage | Capacity | Lifetime | Sent to server |
|---|---|---|---|
| Cookies | ~4 KB | Expiry date | **Yes**, with every request |
| `localStorage` | ~5–10 MB | Until cleared | No |
| `sessionStorage` | ~5 MB | Tab session | No |
| IndexedDB | Large (quota-based) | Until cleared | No — async, structured data |
| Cache API | Large | Until cleared | No — service workers/PWA |

Never store auth tokens in localStorage if you can avoid it (readable by any XSS); prefer `HttpOnly; Secure; SameSite` cookies or a BFF.

Other APIs: `fetch`, `AbortController`, `IntersectionObserver` (lazy load, infinite scroll), `ResizeObserver`, `MutationObserver`, Web Workers, Service Workers (offline/PWA), WebSockets, `history.pushState` (SPA routing), Clipboard, Geolocation, Notifications.

**CORS** — the browser blocks reading cross-origin responses unless the server sends `Access-Control-Allow-Origin`; preflight `OPTIONS` for non-simple requests. It's fixed on the **server**, not in JS.

## Lesson: [Intermediate|High] Debounce, throttle, memoisation and other utilities

```js
function debounce(fn, ms) {                // run after the user STOPS for ms (search box)
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function throttle(fn, ms) {                // run at most once per ms (scroll, resize)
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn.apply(this, args); }
  };
}

function memoize(fn) {
  const cache = new Map();
  return arg => cache.has(arg) ? cache.get(arg) : (cache.set(arg, fn(arg)), cache.get(arg));
}

const curry = fn => function curried(...args) {
  return args.length >= fn.length ? fn(...args) : (...more) => curried(...args, ...more);
};
```

# Module: Advanced and TypeScript

## Lesson: [Advanced|Medium] Generators, iterators, Map/Set, WeakMap and Proxy

```js
function* idGenerator() { let id = 1; while (true) yield id++; }
const ids = idGenerator();
ids.next().value;   // 1

const map = new Map([["a", 1]]);      // any key type, keeps insertion order, .size
const set = new Set([1, 2, 2, 3]);     // unique values → [...set] = [1, 2, 3]
new Set([1, 2]).union(new Set([2, 3])); // ES2025 Set methods

const meta = new WeakMap();            // keys must be objects; doesn't prevent garbage collection
meta.set(domNode, { clicks: 0 });

const validator = new Proxy({}, {
  set(target, key, value) {
    if (key === "age" && typeof value !== "number") throw new TypeError("age must be a number");
    target[key] = value;
    return true;
  },
});
```

## Lesson: [Advanced|Medium] Memory leaks, performance and security

- **Memory leaks**: forgotten timers/intervals, event listeners on removed elements, global variables, closures holding large data, detached DOM nodes, growing caches. Find with DevTools Memory → heap snapshots.
- **Performance**: code splitting and lazy loading, tree shaking, minification, compression, caching (HTTP + service worker), avoid long tasks (> 50 ms), virtualise long lists, debounce input, use `defer`, optimise images, measure Core Web Vitals (**LCP**, **INP**, **CLS**).
- **Security**: **XSS** (never insert untrusted HTML — use `textContent`, sanitise with DOMPurify, Content-Security-Policy), **CSRF** (SameSite cookies, tokens), avoid `eval`/`new Function`, validate on the server, keep dependencies patched (`npm audit`), Subresource Integrity for CDN scripts.

## Lesson: [Intermediate|High] TypeScript essentials

```ts
type Status = "pending" | "paid" | "shipped";                 // union of literal types
interface Order { id: number; customer: string; total: number; status: Status; notes?: string }

function totalPaid(orders: Order[]): number {
  return orders.filter(o => o.status === "paid").reduce((s, o) => s + o.total, 0);
}

// Generics
function first<T>(items: T[]): T | undefined { return items[0]; }

// Utility types
type OrderPreview = Pick<Order, "id" | "total">;
type OrderUpdate = Partial<Omit<Order, "id">>;
type ReadonlyOrder = Readonly<Order>;
type ById = Record<number, Order>;

// Narrowing
function format(x: string | number) {
  return typeof x === "string" ? x.toUpperCase() : x.toFixed(2);
}

// unknown vs any: unknown must be narrowed before use; any disables checking
function parse(json: string): unknown { return JSON.parse(json); }
```

`interface` vs `type`: both describe object shapes; interfaces can be re-opened (declaration merging) and extended; types support unions, intersections, mapped and conditional types. Enable `"strict": true` in `tsconfig.json`. TypeScript types disappear at runtime — validate external data with libraries like Zod.

# Interview

## [Beginner|High] What is the difference between `==` and `===`?

`===` (strict equality) compares type and value without conversion. `==` (loose equality) converts operands to a common type first, which produces surprises (`"" == 0` is true, `null == undefined` is true, `[] == false` is true). Always use `===` (except, by some style guides, `x == null` to check null or undefined).

## [Beginner|High] What is the difference between `var`, `let` and `const`?

`var` is function-scoped, hoisted and initialised as `undefined`, can be re-declared, and creates a property on the global object at top level. `let` and `const` are block-scoped and hoisted but in the Temporal Dead Zone until their declaration (accessing them earlier throws). Neither can be re-declared in the same scope. `const` can't be reassigned, but the object it references can still be mutated. Default to `const`, use `let` when reassigning, avoid `var`.

## [Beginner|High] What is hoisting?

During the creation phase of an execution context, declarations are registered before code runs. `var` variables are hoisted and initialised to `undefined`. Function declarations are hoisted with their body (callable before the line they appear on). `let`, `const` and `class` are hoisted but uninitialised (TDZ → ReferenceError if used early). Function expressions and arrow functions follow the rules of the variable they're assigned to.

## [Beginner|High] What are the primitive data types in JavaScript?

`string`, `number`, `bigint`, `boolean`, `undefined`, `null` and `symbol`. They are immutable and compared by value. Everything else (objects, arrays, functions, dates) is an object compared by reference. `typeof null` returns "object" due to a historical bug.

## [Beginner|High] What is the difference between `null` and `undefined`?

`undefined` means a variable has been declared but not assigned, a missing property, or a function with no return value — set by the engine. `null` is an intentional "no value" assigned by the programmer. `typeof undefined` is "undefined", `typeof null` is "object"; `null == undefined` is true but `null === undefined` is false. `??` and `?.` treat both as nullish.

## [Beginner|High] What are arrow functions and how are they different from regular functions?

A concise function syntax (`x => x * 2`). Differences: no own `this` (lexically inherited — great for callbacks), no `arguments` object, can't be used as constructors with `new`, no `prototype`, and implicit return for single expressions. Don't use them as object methods or prototype methods that need dynamic `this`.

## [Intermediate|High] What is a closure? Give a practical example.

A closure is a function that remembers the variables from the scope where it was created, even after that scope has finished executing. Example: `function counter() { let c = 0; return () => ++c; }` — each returned function has its own private `c`. Practical uses: data privacy, function factories, memoisation caches, debounce/throttle timers, partial application, event handlers capturing loop values (with `let`).

## [Intermediate|High] Explain the event loop.

JavaScript executes on a single thread with a call stack. Asynchronous operations (timers, network, events) are handled by the browser/Node APIs, which queue callbacks when done. When the call stack is empty, the event loop first runs **all microtasks** (promise reactions, `queueMicrotask`), then (in browsers) lets rendering happen, then picks the next **macrotask** (setTimeout, I/O, UI events). That's why a resolved promise's `.then` runs before a `setTimeout(..., 0)` callback.

## [Intermediate|High] What is a Promise? Explain Promise.all, allSettled, race and any.

A Promise represents the eventual result of an asynchronous operation, in state pending, fulfilled or rejected; `.then/.catch/.finally` register reactions. `Promise.all` waits for all and rejects on the first failure. `allSettled` waits for all and returns each outcome. `race` settles with the first settled promise (success or failure). `any` fulfils with the first success and rejects with AggregateError only if all fail.

## [Intermediate|High] How does `this` work in JavaScript?

It depends on the call site: method call → the object before the dot; plain function call → `undefined` in strict mode (global object otherwise); constructor with `new` → the new instance; `call/apply/bind` → explicitly set; event listeners with regular functions → the element; arrow functions → `this` of the enclosing lexical scope. Losing `this` when passing methods as callbacks is fixed with `bind` or arrow functions.

## [Intermediate|High] What is the difference between `call`, `apply` and `bind`?

All set `this` explicitly. `call(thisArg, a, b)` invokes immediately with individual arguments. `apply(thisArg, [a, b])` invokes immediately with an array of arguments. `bind(thisArg, a)` doesn't invoke — it returns a new function with `this` (and optionally leading arguments) permanently bound, useful for callbacks and event handlers.

## [Intermediate|High] What is prototypal inheritance?

Objects inherit directly from other objects through the internal `[[Prototype]]` link. When a property isn't found on an object, the engine looks up its prototype chain. Constructor functions share methods via `Constructor.prototype`; `Object.create(proto)` creates objects with a chosen prototype; ES6 `class`/`extends` is syntax over the same mechanism (`Dog.prototype.__proto__ === Animal.prototype`).

## [Intermediate|High] What is event delegation and why use it?

Attaching a single event listener to a common ancestor instead of each child, using event bubbling and `event.target` (often with `closest()`) to identify which child was interacted with. Benefits: fewer listeners (memory/performance), works for elements added later dynamically, simpler cleanup. Note: some events don't bubble (`focus`, `blur` — use `focusin`/`focusout`).

## [Intermediate|High] Debounce vs throttle — implement one.

Debounce delays execution until calls stop for a given time (search-as-you-type, auto-save, resize end). Throttle guarantees execution at most once per interval (scroll position, mousemove, rate-limited API calls).

```js
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const throttle = (fn, ms) => { let last = 0; return (...a) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...a); } }; };
```

## [Intermediate|Medium] What is the difference between shallow copy and deep copy?

A shallow copy duplicates top-level properties, but nested objects are still shared references (`{...obj}`, `Object.assign`, `arr.slice()`, `[...arr]`). A deep copy duplicates everything recursively: `structuredClone(obj)` (modern, handles Dates/Maps/cycles, not functions/DOM nodes), or `JSON.parse(JSON.stringify(obj))` (loses Dates, undefined, functions, Infinity), or lodash `cloneDeep`.

## [Intermediate|Medium] What is the difference between `map`, `forEach`, `filter` and `reduce`?

`forEach` iterates for side effects and returns `undefined`. `map` returns a new array of the same length with transformed items. `filter` returns a new array with items that pass a test. `reduce` accumulates the array into a single value (sum, object, grouped map). None of them mutate the original array (unless your callback does). `forEach` can't be stopped early — use `for...of` with `break`, or `some`/`find`.

## [Intermediate|Medium] What are `async` and `defer` on script tags?

Both download the script without blocking HTML parsing. `async` executes as soon as it's downloaded — order not guaranteed, may run before the DOM is complete (good for independent scripts like analytics). `defer` executes after parsing finishes, in document order, before DOMContentLoaded (good for app scripts). Module scripts are deferred by default.

## [Advanced|High] What causes memory leaks in JavaScript and how do you find them?

Unremoved event listeners and timers (`setInterval` never cleared), references to detached DOM nodes, accidental globals, closures capturing large objects, ever-growing caches/maps, and subscriptions not unsubscribed in SPA components. Find them with Chrome DevTools: Performance monitor (JS heap growing), Memory tab heap snapshots compared over time, "Detached elements" panel, and allocation timelines. Fix with cleanup on unmount, `WeakMap`/`WeakRef` for metadata, and bounded caches.

## [Advanced|Medium] What is the output of this code and why? `for (var i=0;i<3;i++){ setTimeout(()=>console.log(i),0) }`

It prints `3 3 3`. `var` is function-scoped, so all three callbacks close over the same `i`, and by the time the timers run (after the loop completes), `i` is 3. Fixes: use `let` (a new binding per iteration → `0 1 2`), or an IIFE/`bind` to capture the current value.

## [Advanced|Medium] What is the difference between `interface` and `type` in TypeScript?

Both can describe object shapes and can be extended (interfaces via `extends`, types via intersections `&`). Interfaces support declaration merging (re-opening to add members, used to augment library types) and give clearer error messages for object shapes. Type aliases can represent anything: unions, tuples, primitives, mapped and conditional types. Common guidance: interfaces for public object contracts, types for unions and type-level programming.

## [Scenario|High] A search box calls the API on every keystroke and floods the server. How do you fix it?

Debounce the input (e.g. 300 ms) so the request fires only after typing pauses; ignore queries shorter than 2–3 characters; cancel the previous in-flight request with `AbortController` so stale responses don't overwrite newer results (or track the latest request id); cache recent results; show a loading state. On the server, add rate limiting and make the search endpoint efficient (indexes, paging).

## [Scenario|High] A page becomes unresponsive while processing a 50 MB JSON file in the browser. What do you do?

The main thread is blocked by long synchronous work. Move parsing/processing into a **Web Worker** (postMessage the data or a File/Blob, return results); stream the file with `ReadableStream` / process in chunks; better, process it on the server and fetch paginated or aggregated results; virtualise large lists when rendering; show progress. Measure with the DevTools Performance panel (long tasks).

## [Scenario|Medium] Users report the app gets slower the longer it's open. How do you investigate?

Suspect a memory leak. Reproduce the flow repeatedly while taking heap snapshots in DevTools and comparing them (look for growing arrays, detached DOM nodes, listeners). Check for intervals not cleared, event listeners/subscriptions not removed when views are destroyed, global caches growing unbounded, and large closures. Fix cleanup paths (component unmount/destroy hooks), use `AbortController` to remove listeners, bound caches, and verify the heap stabilises.

## [Scenario|Medium] You need to call 3 independent APIs and show the page when all are done, but still show partial data if one fails. How?

Start all requests in parallel and use `Promise.allSettled`, then render the fulfilled results and show an error placeholder for rejected ones. Add timeouts with `AbortSignal.timeout(ms)` so a slow API doesn't hang the page, and retry idempotent failures with backoff. If any single failure must fail the whole page, use `Promise.all` instead.

# Cheatsheet

## Types & equality

Primitives: string, number, bigint, boolean, undefined, null, symbol. Falsy: false, 0, -0, 0n, "", null, undefined, NaN. Use `===`. `Array.isArray`, `Number.isNaN`, `typeof null === "object"`.

## Declarations

`const` by default · `let` when reassigning · no `var` · TDZ for let/const · function declarations fully hoisted.

## this

method → object · plain → undefined (strict) · new → instance · call/apply/bind → explicit · arrow → lexical.

## Event loop

Sync code → all microtasks (promises, queueMicrotask) → render → next macrotask (setTimeout, events, I/O).

## Promises

`all` (fail fast) · `allSettled` (all outcomes) · `race` (first settled) · `any` (first success) · `async/await` + `try/catch` · `AbortController`.

## Array methods

map · filter · reduce · find · findIndex · some · every · includes · flat · flatMap · at · toSorted · Object.groupBy · `sort((a,b)=>a-b)` (default sort is lexicographic!).

## Modern syntax

`?.` · `??` · `??=` · destructuring · spread/rest · template literals · classes with `#private` · modules · top-level await · `structuredClone`.

## DOM

`querySelector(All)` · `textContent` (safe) vs `innerHTML` (XSS risk) · `addEventListener` · delegation with `closest` · bubbling vs capturing · `preventDefault` / `stopPropagation`.

## Snippets

```js
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
const unique = arr => [...new Set(arr)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sum = arr => arr.reduce((s, x) => s + x, 0);
const groupBy = (arr, key) => arr.reduce((acc, x) => ((acc[x[key]] ??= []).push(x), acc), {});
```
