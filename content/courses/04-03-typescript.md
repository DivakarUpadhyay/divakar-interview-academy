---
slug: typescript
title: TypeScript — Types, Generics and Real-World Patterns
track: frontend
order: 3
group: Web Basics
icon: TS
color: #3178c6
summary: Why TypeScript, basic and object types, interfaces vs type aliases, unions and narrowing, functions, classes, generics, utility types, mapped and conditional types, modules, tsconfig and strict mode, typing API calls for Angular/React, and the TypeScript interview questions.
---

# Overview

**TypeScript** is JavaScript with a static type system, created by Microsoft (lead designer Anders Hejlsberg, also the designer of C#). TypeScript code is **compiled (transpiled) to plain JavaScript**; types exist only at compile time and are erased at runtime.

Why teams use it:

- Catches errors before running (typos, wrong argument types, `undefined` access).
- IntelliSense, safe refactoring and self-documenting APIs.
- Required by Angular; the default for React (Vite, Next.js) and Vue 3 projects; familiar to C# developers.

| C# concept | TypeScript equivalent |
|---|---|
| `class`, `interface`, access modifiers | Same keywords (interfaces are structural, not nominal) |
| Generics `List<T>` | Generics `Array<T>`, `Promise<T>` |
| `enum` | `enum` or (preferred) union of string literals |
| Nullable `string?` | `string \| undefined`, optional `prop?:` |
| `async/await` + `Task<T>` | `async/await` + `Promise<T>` |
| LINQ | Array methods `map`, `filter`, `reduce` |

# Versions

| Year | Version | Highlights |
|---|---|---|
| 2012 | 0.8 | First public release |
| 2016 | 2.0 | `strictNullChecks`, `never`, control-flow analysis |
| 2018 | 3.0 | `unknown`, tuples in rest parameters, project references |
| 2020 | 4.0–4.1 | Variadic tuples, template literal types, key remapping |
| 2022 | 4.9 | `satisfies` operator |
| 2023 | 5.0 | Standard (TC39) decorators, `const` type parameters, faster builds |
| 2024 | 5.4–5.7 | `NoInfer`, inferred type predicates, `--erasableSyntaxOnly` prep |
| 2025 | 5.8–5.9 | Node 18+ module modes, `import defer`; TypeScript 7 native compiler (Go port, ~10× faster) in preview |

Node.js 22.6+/23+ can run `.ts` files directly by stripping types (no type checking) — type-check with `tsc --noEmit`.

# Lifecycle

**From `.ts` file to running code:**

1. Write `.ts`/`.tsx` with types.
2. The **type checker** (`tsc` or the editor's language service) reports errors using `tsconfig.json` settings.
3. **Transpile** to JavaScript (`tsc`, esbuild, SWC, Babel, Vite, Angular CLI) — types are erased; syntax down-levelled to the `target`.
4. **Bundle** (Vite/Rollup/webpack/esbuild) with imports resolved per `module`/`moduleResolution`.
5. Run in the browser or Node.js. At runtime there are **no types** — validate external data (API responses, forms) with code or a schema library (Zod).

# Tools

- `tsc` compiler, `tsconfig.json`, `ts-node`/`tsx` to run TS in Node.
- VS Code (built-in TS language service), TypeScript Playground (typescriptlang.org/play).
- Bundlers: Vite, esbuild, SWC, Angular CLI, Next.js.
- Lint: ESLint + `typescript-eslint`; format: Prettier.
- Runtime validation: Zod, Valibot; API types from OpenAPI: openapi-typescript, NSwag, Orval.
- Testing: Vitest, Jest (ts-jest), Playwright.

# Module: TypeScript Basics

## Lesson: [Basic|High] Basic types, inference and type annotations

```typescript
let name: string = "Divakar";
let age = 34;                    // inferred as number — annotate only when inference can't help
let active: boolean = true;
let ids: number[] = [1, 2, 3];   // or Array<number>
let pair: [string, number] = ["qty", 5];   // tuple

let anything: any = 4;           // turns type checking OFF — avoid
let input: unknown = JSON.parse("{}");     // safe "any": must narrow before use
function fail(msg: string): never { throw new Error(msg); }  // never returns
function log(msg: string): void { console.log(msg); }

let maybe: string | undefined;   // with strictNullChecks, undefined must be explicit
const status = "open" as const;  // literal type "open", not string
```

| Type | Meaning |
|---|---|
| `any` | Opt out of checking — errors spread silently |
| `unknown` | Anything, but you must check the type before using it |
| `never` | No value possible (functions that throw, exhaustive checks) |
| `void` | Function returns nothing useful |
| `null` / `undefined` | Separate types under `strict` |

> **Interview tip:** "Prefer `unknown` over `any` for data from outside (JSON, errors in `catch`) — it forces you to validate."

## Lesson: [Basic|High] Object types — interfaces vs type aliases

```typescript
interface Customer {
  readonly id: number;
  name: string;
  email?: string;                 // optional
  [key: string]: unknown;         // index signature (extra props)
}

type OrderStatus = "draft" | "submitted" | "shipped";   // only a type alias can name a union
type Order = {
  id: number;
  customer: Customer;
  status: OrderStatus;
  lines: OrderLine[];
};

interface Employee extends Customer { salary: number; }        // extend an interface
type Manager = Employee & { reports: Employee[] };              // intersect types
```

| | `interface` | `type` |
|---|---|---|
| Object shapes | ✅ | ✅ |
| Unions, tuples, primitives, mapped/conditional types | ❌ | ✅ |
| Extend | `extends` | `&` intersection |
| Declaration merging (same name declared twice merges) | ✅ | ❌ |

Common guidance: `interface` for public object contracts (and library augmentation), `type` for unions and computed types. Be consistent.

**Structural typing:** TypeScript compares **shapes**, not names — any object with the right properties is assignable, unlike C#'s nominal types.

## Lesson: [Basic|High] Functions, unions and narrowing

```typescript
function total(lines: { qty: number; price: number }[], discount = 0): number {
  return lines.reduce((s, l) => s + l.qty * l.price, 0) * (1 - discount);
}
const greet = (name: string, title?: string) => `Hello ${title ?? ""} ${name}`;

function format(value: string | number | Date): string {
  if (typeof value === "string") return value.trim();       // narrowed to string
  if (typeof value === "number") return value.toFixed(2);   // narrowed to number
  return value.toISOString();                               // must be Date
}

// Discriminated union + exhaustive check
type Shape = { kind: "circle"; r: number } | { kind: "rect"; w: number; h: number };
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "rect":   return s.w * s.h;
    default: { const never: never = s; return never; }   // compile error if a new kind is added
  }
}

// Custom type guard
function isOrder(x: unknown): x is Order {
  return typeof x === "object" && x !== null && "id" in x && "lines" in x;
}
```

Narrowing tools: `typeof`, `instanceof`, `in`, equality checks, truthiness, discriminant property, type predicates (`x is T`), assertion functions (`asserts x is T`).

# Module: Classes and Generics

## Lesson: [Intermediate|High] Classes, access modifiers and enums

```typescript
abstract class Account {
  private static nextId = 1;
  readonly id = Account.nextId++;
  constructor(public owner: string, protected balance = 0) {}   // parameter properties
  deposit(amount: number) { if (amount <= 0) throw new Error("Invalid"); this.balance += amount; }
  abstract monthlyFee(): number;
}
class Savings extends Account implements Printable {
  monthlyFee() { return this.balance > 10_000 ? 0 : 5; }
  print() { return `${this.owner}: ${this.balance}`; }
}
interface Printable { print(): string; }

// enum vs union
enum Role { Admin = "ADMIN", User = "USER" }       // generates runtime JS object
type RoleU = "ADMIN" | "USER";                       // zero runtime cost — usually preferred
```

- `private` (TS-only, compile-time) vs `#field` (JavaScript private, enforced at runtime).
- `readonly` vs `const`: `readonly` for properties, `const` for variables.
- `implements` checks a class matches an interface; it doesn't add code.

## Lesson: [Intermediate|High] Generics

```typescript
function first<T>(items: T[]): T | undefined { return items[0]; }
const n = first([1, 2, 3]);           // T inferred as number

interface ApiResult<T> { data: T; error?: string; }
interface Paged<T> { items: T[]; total: number; page: number; }

// Constraint: T must have an id
function byId<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find(i => i.id === id);
}

// keyof constraint: safe property access
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map(i => i[key]);
}
pluck(orders, "status");   // OrderStatus[] — "statuz" would be a compile error

// Generic class
class Cache<K, V> {
  private map = new Map<K, V>();
  get(key: K) { return this.map.get(key); }
  set(key: K, value: V) { this.map.set(key, value); }
}
```

Generics let one function/type work with many types **while keeping type information** — unlike `any`, which loses it.

# Module: Advanced Types

## Lesson: [Intermediate|High] Utility types

| Utility | Result | Typical use |
|---|---|---|
| `Partial<T>` | All properties optional | PATCH/update models |
| `Required<T>` | All required | Normalised config |
| `Readonly<T>` | All readonly | Immutable state |
| `Pick<T, K>` | Only keys K | DTO with a few fields |
| `Omit<T, K>` | Without keys K | Create model without `id` |
| `Record<K, V>` | Object with keys K of type V | Lookup maps |
| `Exclude<U, X>` / `Extract<U, X>` | Filter a union | Narrow status lists |
| `NonNullable<T>` | Remove null/undefined | After validation |
| `ReturnType<F>` / `Parameters<F>` | Function types | Reuse inferred types |
| `Awaited<T>` | Unwrap Promise | Result of async function |

```typescript
type CreateOrder = Omit<Order, "id" | "status">;
type OrderPatch = Partial<Pick<Order, "status" | "lines">>;
const labels: Record<OrderStatus, string> = { draft: "Draft", submitted: "Submitted", shipped: "Shipped" };
type Loaded = Awaited<ReturnType<typeof loadOrders>>;
```

## Lesson: [Advanced|Medium] Mapped, conditional and template literal types

```typescript
// Mapped type: make every property a getter function
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type CustomerGetters = Getters<{ name: string; age: number }>;   // { getName(): string; getAge(): number }

// Conditional type with infer
type ElementOf<T> = T extends (infer U)[] ? U : never;
type X = ElementOf<string[]>;   // string

// Template literal types
type HttpMethod = "GET" | "POST";
type Route = `/api/${"orders" | "customers"}`;
type Endpoint = `${HttpMethod} ${Route}`;    // "GET /api/orders" | ...

// satisfies: check against a type but keep the precise inferred type
const config = { api: "https://api.example.com", retries: 3 } satisfies Record<string, string | number>;
config.retries.toFixed();   // still known to be number
```

## Lesson: [Intermediate|High] tsconfig, strict mode and modules

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

`strict: true` turns on `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`, `useUnknownInCatchVariables` and more — always enable it in new projects.

Modules: ES modules (`import`/`export`); `import type { Order } from "./models"` imports types only (erased); declaration files (`.d.ts`) describe JavaScript libraries — types come from the package itself or `@types/*` (DefinitelyTyped).

## Lesson: [Advanced|High] Typing real API calls in Angular and React

```typescript
// models.ts — generated from the backend OpenAPI or written by hand
export interface OrderDto { id: number; orderDate: string; status: OrderStatus; total: number; }

// Angular service
@Injectable({ providedIn: "root" })
export class OrdersApi {
  private http = inject(HttpClient);
  list(page: number) { return this.http.get<Paged<OrderDto>>("/api/orders", { params: { page } }); }
}

// React with fetch + runtime validation (types alone don't check the server response)
import { z } from "zod";
const OrderSchema = z.object({ id: z.number(), orderDate: z.string(), status: z.enum(["draft", "submitted", "shipped"]), total: z.number() });
type Order = z.infer<typeof OrderSchema>;

async function getOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return z.array(OrderSchema).parse(await res.json());   // throws if the API shape changed
}

// Typed React props and state
type Props = { orders: Order[]; onSelect: (id: number) => void };
function OrderTable({ orders, onSelect }: Props) { /* … */ }
const [selected, setSelected] = useState<Order | null>(null);
```

> **Interview tip:** `http.get<T>()` and `as T` are **promises to the compiler, not checks**. Mention generating types from OpenAPI and validating at the boundary.

# Interview

## [Beginner|High] What is TypeScript and why use it over JavaScript?

A typed superset of JavaScript that compiles to plain JavaScript. Static types catch errors at compile time, give IntelliSense and safe refactoring, document APIs and scale better for large teams. Types are erased at runtime, so there is no runtime cost — and no runtime checking.

## [Beginner|High] What is the difference between interface and type?

Both describe object shapes. `type` can also name unions, intersections, tuples, primitives and mapped/conditional types; `interface` supports declaration merging and `extends`, and is often preferred for public object contracts. Interfaces can't express unions; types can't be reopened.

## [Beginner|High] any vs unknown vs never?

`any` disables type checking for that value (errors pass silently). `unknown` accepts any value but must be narrowed (typeof/guards/schema) before use — the safe choice for external data and `catch` errors. `never` represents values that never occur — functions that always throw, or the impossible branch in an exhaustive switch.

## [Beginner|High] What are union types and how do you narrow them?

A union `A | B` means the value is one of several types. Narrow with `typeof`, `instanceof`, `in`, equality on a discriminant property (`kind`), truthiness, or custom type guards (`x is T`) so TypeScript knows which member you have in each branch.

## [Beginner|Medium] What is type inference?

The compiler works out types without annotations: `let n = 5` is `number`, a function's return type comes from its `return` statements, generic arguments come from the values passed. Annotate function parameters and public APIs; let inference handle locals.

## [Intermediate|High] What are generics? Give an example.

Type parameters that make code reusable while keeping types: `function first<T>(xs: T[]): T | undefined`. With constraints (`T extends { id: number }`) and `keyof` (`K extends keyof T`) you get type-safe helpers such as `pluck(items, "name")`. Common built-ins: `Array<T>`, `Promise<T>`, `Record<K,V>`.

## [Intermediate|High] Explain Partial, Pick, Omit and Record with use cases.

`Partial<T>` makes all props optional (update/PATCH payloads). `Pick<T,K>` keeps chosen keys (summary DTO). `Omit<T,K>` removes keys (create payload without `id`). `Record<K,V>` builds an object type with keys K (lookup tables like `Record<Status, string>`).

## [Intermediate|High] What does strict mode enable and why should it be on?

`strict: true` enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `alwaysStrict`, `useUnknownInCatchVariables` and others. It catches the most common bugs — especially null/undefined access. New projects should always use it; legacy projects can turn flags on gradually.

## [Intermediate|High] What is a discriminated union?

A union of object types that share a literal "tag" property (`kind`, `type`, `status`). Switching on the tag narrows to the exact member, and a `never` check in `default` makes the switch exhaustive — adding a new member produces compile errors wherever it isn't handled. Ideal for state (`{ status: "loading" } | { status: "error"; error: string } | { status: "ok"; data: T }`) and Redux/NgRx actions.

## [Intermediate|Medium] What is the difference between `as` (type assertion) and `satisfies`?

`as T` tells the compiler "trust me, it's T" — no runtime check and it can hide mistakes. `satisfies T` checks that a value matches T but keeps the more precise inferred type, so you get validation without losing literal types. Prefer `satisfies` for config objects and avoid `as` except at well-validated boundaries.

## [Intermediate|Medium] What are declaration files (.d.ts)?

Files containing only type declarations that describe JavaScript code — they let TypeScript type-check calls into JS libraries. Libraries ship their own (`"types"` in package.json) or come from DefinitelyTyped (`npm i -D @types/lodash`). You can write `declare module "x"` or augment globals (e.g. `Window`) in your own `.d.ts`.

## [Advanced|Medium] What are mapped and conditional types?

Mapped types transform each property of another type: `{ [K in keyof T]: Readonly<T[K]> }` (with `as` to rename keys). Conditional types choose a type by condition: `T extends U ? X : Y`, with `infer` to extract parts (`T extends Promise<infer R> ? R : T`). Built-in utilities like `Partial`, `ReturnType` and `Awaited` are implemented with them.

## [Advanced|Medium] Structural vs nominal typing — what does TypeScript use?

Structural: types are compatible if their shapes match, regardless of names, so `{ id: 1, name: "x" }` is assignable to any interface with those members. C# and Java are nominal. To simulate nominal types (e.g. `UserId` vs `OrderId` both numbers), use branded types: `type UserId = number & { readonly __brand: "UserId" }`.

## [Scenario|High] The API returned a different JSON shape and the app crashed even though it compiled. Why, and how do you prevent it?

Types are erased at runtime; `http.get<Order[]>()` or `as Order[]` only told the compiler what to expect. Prevent: generate client types from the backend OpenAPI document in the build (so contract changes show up as compile errors), validate responses at the boundary with Zod/Valibot, version the API, and add contract/end-to-end tests.

## [Scenario|Medium] You are migrating a large JavaScript project to TypeScript. How do you do it?

Incrementally: add `tsconfig` with `allowJs` and `checkJs` off, rename files to `.ts` module by module starting from leaves (utilities, models), add `@types` packages, use `any`/`unknown` temporarily with TODOs, then turn on `strict` flags one by one (`noImplicitAny`, then `strictNullChecks`). Add type-checking (`tsc --noEmit`) to CI so coverage only grows.

## [Scenario|Medium] Write a type-safe function that groups an array by a key.

```typescript
function groupBy<T, K extends PropertyKey>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}
const byStatus = groupBy(orders, o => o.status);   // Record<OrderStatus, Order[]>
```

(Modern runtimes also have `Object.groupBy(items, fn)` from ES2024.)

# Cheatsheet

## Core types

`string number boolean bigint symbol` · `T[]` / `Array<T>` · tuple `[A, B]` · `unknown` (safe) vs `any` (unsafe) · `never` · `void` · literal types `"a" | "b"` · `as const`.

## Interface vs type

Interface: object contracts, `extends`, declaration merging. Type: unions, tuples, mapped/conditional types, `&` intersections.

## Narrowing

`typeof` · `instanceof` · `in` · discriminant `switch` + `never` default · `x is T` guards · `asserts x is T`.

## Utility types

`Partial Required Readonly Pick Omit Record Exclude Extract NonNullable ReturnType Parameters Awaited`.

## Safety rules

`strict: true` · avoid `any` and `as` · `unknown` for external data · validate API responses (Zod) · generate types from OpenAPI · `import type` for type-only imports · `tsc --noEmit` in CI.
