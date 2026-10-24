---
slug: nextjs
title: Next.js — App Router, Folder Structure, Rendering and Full Stack with SQL Server
track: frontend
order: 9
group: Libraries & Frameworks
icon: Nx
color: #111111
summary: What Next.js adds to React, the App Router folder structure with sample files for every special file (layout, page, loading, error, not-found, route handlers, middleware/proxy), Server vs Client Components, rendering strategies (static, dynamic, streaming, ISR, partial prerendering), data fetching and caching, Server Actions and forms, metadata and SEO, connecting to SQL Server from server code (mssql, Prisma), authentication, deployment to Vercel/Azure/IIS, the Pages Router for legacy apps, and Next.js interview questions.
---

# Overview

**Next.js** (by Vercel) is a **React framework** for full stack web apps. React is a UI library; Next.js adds everything around it: file-based **routing**, **server rendering**, **data fetching**, **API endpoints**, **image/font optimisation**, **SEO metadata**, bundling and deployment.

| Feature | Plain React (Vite SPA) | Next.js |
|---|---|---|
| Routing | Add React Router | File-system routing built in |
| Rendering | Client-side only | Server Components, SSR, static generation, streaming |
| SEO | Hard (empty HTML until JS runs) | Full HTML from the server, metadata API |
| Backend code | Separate API project | Route handlers and Server Actions in the same project |
| Data access | Always through an API | Server Components can query the database directly |

DevLadder itself is built with Next.js (App Router, Server Components reading SQLite, static generation, sitemap and metadata).

# Versions

| Version | Year | Highlights |
|---|---|---|
| 1–8 | 2016–2019 | SSR for React, file routing (`pages/`), dynamic routes, API routes (9) |
| 9.3 – 12 | 2020–2021 | `getStaticProps`/`getServerSideProps`, ISR, image component, middleware, Rust compiler (SWC) |
| 13 | 2022 | **App Router** (`app/`) beta: layouts, Server Components, streaming; Turbopack alpha |
| 13.4 | 2023 | App Router stable; Server Actions (alpha) |
| 14 | 2023 | Server Actions stable, partial prerendering preview |
| 15 | 2024 | React 19, async request APIs (`await params`), caching defaults changed (fetch no longer cached by default), Turbopack dev stable |
| 16 | 2025 | **Cache Components** (`"use cache"`) and PPR, Turbopack default for builds, `middleware` renamed to **`proxy`**, React Compiler support, `next typegen` |

# Lifecycle

**What happens on a request to `/products/42` (App Router):**

1. Request reaches the Next.js server (Node.js runtime, edge, or Vercel's infrastructure); **proxy/middleware** runs first (redirects, auth checks, rewrites).
2. The router matches the URL to `app/products/[id]/page.tsx` and its parent **layouts**.
3. **Server Components** render on the server: `await params`, fetch data (database, APIs) directly; the output is the **RSC payload** (a serialised component tree) and HTML.
4. Static parts may come from the cache (prerendered at build or revalidated); dynamic parts stream in with **Suspense** boundaries (`loading.tsx`).
5. The browser receives HTML immediately (fast first paint, SEO-friendly), then downloads JavaScript only for **Client Components** (`"use client"`) and **hydrates** them to make them interactive.
6. Navigations with `<Link>` fetch only the RSC payload for the new route (no full page reload); prefetching happens for links in view.
7. Mutations go through **Server Actions** or route handlers; `revalidatePath`/`revalidateTag`/`updateTag` refresh cached data.

# Tools

- `npx create-next-app@latest` (TypeScript, ESLint, Tailwind, App Router, Turbopack options), `next dev`, `next build`, `next start`.
- Vercel (hosting), `@vercel/analytics`, Next.js DevTools / React DevTools.
- Data: Prisma, Drizzle, `mssql`, `pg`, `@vercel/postgres`/Neon, Supabase.
- Auth: Auth.js (NextAuth), Clerk, Microsoft Entra ID (MSAL), custom JWT.
- UI: Tailwind CSS, shadcn/ui, CSS Modules.
- Testing: Vitest/Jest + React Testing Library, Playwright.

# Module: Getting Started

## Lesson: [Basic|High] Next.js App Router folder structure — with sample files

```text
my-shop/
├── app/                                   ← App Router: folders = URL segments
│   ├── layout.tsx                         root layout (required): <html>, <body>, shared nav/footer
│   ├── page.tsx                           "/" home page
│   ├── globals.css                        global styles
│   ├── favicon.ico / icon.svg             app icon (file convention)
│   ├── not-found.tsx                      404 UI
│   ├── error.tsx                          error boundary for the segment (Client Component)
│   ├── loading.tsx                        instant loading UI (Suspense fallback)
│   ├── sitemap.ts · robots.ts · opengraph-image.tsx   SEO file conventions
│   ├── products/
│   │   ├── page.tsx                       "/products"
│   │   ├── loading.tsx                    loading UI just for products
│   │   └── [id]/                          dynamic segment
│   │       ├── page.tsx                   "/products/42"
│   │       └── edit/page.tsx              "/products/42/edit"
│   ├── (shop)/                            route GROUP — organises files, not part of the URL
│   │   ├── layout.tsx                     layout only for pages in this group
│   │   └── cart/page.tsx                  "/cart"
│   ├── admin/
│   │   ├── layout.tsx                     admin layout (sidebar)
│   │   └── [[...slug]]/page.tsx           optional catch-all: "/admin", "/admin/a/b"
│   ├── api/
│   │   └── products/route.ts              route handler: GET/POST "/api/products" (REST API)
│   └── _components/                       private folder (underscore) — not a route
├── components/                            shared UI components (Button.tsx, ProductCard.tsx)
├── lib/                                   server/client utilities: db.ts, auth.ts, validation.ts
├── public/                                static files served as-is: /logo.png, /robots.txt (if static)
├── proxy.ts  (middleware.ts before v16)   runs before requests: auth redirects, rewrites, headers
├── next.config.ts                         Next.js configuration (images, redirects, headers)
├── .env.local                             secrets for local dev (never commit) — DB connection string
├── tsconfig.json · eslint.config.mjs · package.json
```

**Sample files:**

```tsx
// app/layout.tsx — root layout
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "My Shop", template: "%s · My Shop" }, description: "Buy great things" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><header>My Shop</header><main>{children}</main><footer>© 2026</footer></body>
    </html>
  );
}

// app/products/[id]/page.tsx — dynamic Server Component page
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await getProduct(Number((await params).id));
  return { title: p?.name ?? "Product" };
}
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await getProduct(Number((await params).id));    // runs on the server — can query the DB
  if (!product) notFound();
  return <h1>{product.name} — ₹{product.price}</h1>;
}

// app/products/loading.tsx
export default function Loading() { return <p>Loading products…</p>; }

// app/error.tsx — must be a Client Component
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div><p>Something went wrong.</p><button onClick={() => reset()}>Try again</button></div>;
}

// app/api/products/route.ts — REST endpoint
import { NextResponse } from "next/server";
import { listProducts, createProduct } from "@/lib/products";
export async function GET() { return NextResponse.json(await listProducts()); }
export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json(await createProduct(body), { status: 201 });
}

// proxy.ts — protect /admin (named middleware.ts with export function middleware before Next 16)
import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  if (!request.cookies.get("session")) return NextResponse.redirect(new URL("/login", request.url));
}
export const config = { matcher: ["/admin/:path*"] };
```

**Special files (in order of nesting):** `layout` → `template` → `error` → `loading` → `not-found` → `page`. A folder becomes a public route only when it has `page.tsx` or `route.ts`.

## Lesson: [Basic|High] Server Components vs Client Components

| | Server Component (default) | Client Component (`"use client"`) |
|---|---|---|
| Runs | On the server (build time or request) | Server-rendered to HTML, then hydrated in the browser |
| Can use | `async/await`, database, file system, secrets | `useState`, `useEffect`, event handlers, browser APIs |
| JavaScript sent to browser | None | Yes (bundle) |
| Typical | Pages, data loading, layouts, static content | Buttons, forms with state, modals, charts |

```tsx
// app/products/page.tsx (Server Component)
import AddToCart from "./AddToCart";
import { listProducts } from "@/lib/products";
export default async function Products() {
  const products = await listProducts();                 // direct DB call, no API needed
  return <ul>{products.map((p) => <li key={p.id}>{p.name} <AddToCart id={p.id} /></li>)}</ul>;
}

// app/products/AddToCart.tsx (Client Component)
"use client";
import { useState } from "react";
export default function AddToCart({ id }: { id: number }) {
  const [added, setAdded] = useState(false);
  return <button onClick={() => setAdded(true)}>{added ? "Added ✓" : "Add to cart"}</button>;
}
```

Rules: push `"use client"` as far down the tree as possible; Server Components can render Client Components (props must be serialisable); Client Components can't import Server Components but can receive them as `children`; mark server-only modules with `import "server-only"` so secrets never reach the browser.

# Module: Rendering, Data and Caching

## Lesson: [Intermediate|High] Rendering strategies — static, dynamic, streaming, ISR and PPR

| Strategy | When HTML is produced | Use |
|---|---|---|
| **Static (SSG)** | At build time (`generateStaticParams` for dynamic routes) | Marketing pages, docs, blogs, product catalogs that change rarely |
| **ISR / revalidation** | Static, regenerated after a time (`export const revalidate = 60`) or on demand (`revalidatePath`) | Catalogs, news |
| **Dynamic (SSR)** | On every request (uses cookies/headers/searchParams or uncached data) | Personalised dashboards, carts |
| **Streaming** | Shell first, slow parts stream later via `<Suspense>`/`loading.tsx` | Pages with slow data |
| **Partial Prerendering (Cache Components)** | Static shell prerendered; dynamic holes stream in | Best of both on one page (Next 16) |
| **Client-side rendering** | In the browser (Client Components + fetch/SWR/React Query) | Highly interactive widgets |

```tsx
// Static generation of all product pages at build time
export async function generateStaticParams() {
  return (await listProducts()).map((p) => ({ id: String(p.id) }));
}
export const revalidate = 3600;     // re-generate at most once per hour
```

## Lesson: [Intermediate|High] Data fetching, caching and Server Actions

```tsx
// Fetch in a Server Component (Next 15+: not cached unless you opt in)
const res = await fetch("https://api.example.com/rates", { next: { revalidate: 300, tags: ["rates"] } });

// Next 16 Cache Components: cache a function's result
async function getCategories() {
  "use cache";
  return db.query("SELECT Id, Name FROM dbo.Categories");
}
```

**Server Actions** — functions that run on the server, callable from forms or client code (no API route needed):

```tsx
// app/products/new/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createProduct } from "@/lib/products";

const Schema = z.object({ name: z.string().min(2), price: z.coerce.number().positive() });

export async function addProduct(formData: FormData) {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input" };
  await createProduct(parsed.data);           // auth check here too — actions are public endpoints!
  revalidatePath("/products");
  redirect("/products");
}

// app/products/new/page.tsx
import { addProduct } from "./actions";
export default function NewProduct() {
  return (
    <form action={addProduct}>
      <input name="name" placeholder="Name" required />
      <input name="price" type="number" step="0.01" required />
      <button type="submit">Save</button>
    </form>
  );
}
```

Forms work even before JavaScript loads (progressive enhancement); `useActionState` and `useFormStatus` give pending/error states in Client Components.

## Lesson: [Intermediate|High] Connecting Next.js to SQL Server

Database code must run **only on the server** (Server Components, Server Actions, route handlers) — never in Client Components, or credentials would be exposed.

```ts
// lib/db.ts
import "server-only";
import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: { encrypt: true, trustServerCertificate: process.env.NODE_ENV !== "production" },
  pool: { max: 10 },
};

// Reuse one pool across hot reloads in development and across requests in production
const globalForDb = globalThis as unknown as { mssqlPool?: Promise<sql.ConnectionPool> };
export const pool = globalForDb.mssqlPool ?? new sql.ConnectionPool(config).connect();
if (process.env.NODE_ENV !== "production") globalForDb.mssqlPool = pool;

// lib/products.ts
import "server-only";
import { pool } from "./db";
import sql from "mssql";

export type Product = { id: number; name: string; price: number };

export async function listProducts(): Promise<Product[]> {
  const r = await (await pool).request().query("SELECT Id AS id, Name AS name, Price AS price FROM dbo.Products ORDER BY Name");
  return r.recordset;
}
export async function getProduct(id: number): Promise<Product | undefined> {
  const r = await (await pool).request().input("id", sql.Int, id)
    .query("SELECT Id AS id, Name AS name, Price AS price FROM dbo.Products WHERE Id = @id");
  return r.recordset[0];
}
export async function createProduct(p: { name: string; price: number }) {
  const r = await (await pool).request().input("name", sql.NVarChar(200), p.name).input("price", sql.Decimal(18, 2), p.price)
    .query("INSERT INTO dbo.Products (Name, Price) OUTPUT INSERTED.Id AS id VALUES (@name, @price)");
  return { id: r.recordset[0].id as number, ...p };
}
```

```bash
# .env.local (not committed; set the same keys in Vercel/Azure settings)
DB_SERVER=localhost
DB_NAME=Shop
DB_USER=shop_app
DB_PASSWORD=change-me
```

- Route handlers using `mssql` must run on the **Node.js runtime** (the default), not the Edge runtime.
- With **Prisma**: `provider = "sqlserver"` in `schema.prisma`, a single `PrismaClient` instance kept on `globalThis` in development.
- Serverless platforms (Vercel) open connections per function instance — keep pools small and prefer a database in the same region; Azure SQL serverless works well.
- Alternative architecture: Next.js frontend calling an **ASP.NET Core Web API** that owns SQL Server (common in .NET shops) — then Next.js only does `fetch` to the API.

# Module: Production

## Lesson: [Intermediate|Medium] Metadata, SEO, images, fonts and performance

```tsx
export const metadata = { title: "Products", description: "All products", alternates: { canonical: "/products" },
  openGraph: { images: ["/og.png"] } };
import Image from "next/image";
<Image src="/hero.jpg" alt="Shop hero" width={1200} height={600} priority />      // resized, lazy, modern formats
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });                                        // self-hosted font, no layout shift
```

File conventions `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `icon.tsx` generate SEO files. Performance: Server Components (less JS), streaming, `next/image`, `next/link` prefetching, dynamic `import()` for heavy client components, bundle analyzer.

## Lesson: [Intermediate|Medium] Authentication and deployment (Vercel, Azure, IIS, Docker)

**Authentication:** Auth.js/NextAuth (OAuth providers, credentials, Microsoft Entra ID), Clerk, or your own JWT/cookie session. Check auth in **three places**: proxy (fast redirects), Server Components/layouts (render), and every Server Action/route handler (security — they're public endpoints).

**Deployment options:**

| Target | How |
|---|---|
| **Vercel** | Connect the Git repo; every push deploys (preview per branch, production on main); env vars in project settings |
| **Azure App Service (Linux, Node)** / Azure Static Web Apps (hybrid Next.js) | `next build` with `output: "standalone"`, deploy the `.next/standalone` folder, start with `node server.js` |
| **Docker** | Multi-stage build using the standalone output; run on Container Apps, AKS, ECS, Cloud Run |
| **IIS (Windows Server)** | Run `node server.js` as a service (PM2/NSSM) on a port and put IIS in front as a reverse proxy (URL Rewrite + ARR), or use iisnode |
| Static export | `output: "export"` for fully static sites (no server features) |

```ts
// next.config.ts
const nextConfig = { output: "standalone" };   // self-contained server bundle for Docker/Azure/IIS
export default nextConfig;
```

## Lesson: [Intermediate|Medium] Pages Router (legacy) vs App Router

Many existing apps still use the **Pages Router** (`pages/` folder):

```text
pages/
├── _app.tsx            wraps every page (global CSS, providers)
├── _document.tsx       custom <html>/<body>
├── index.tsx           "/"
├── products/[id].tsx   "/products/42"
└── api/products.ts     API route: export default function handler(req, res)
```

```tsx
// Pages Router data fetching
export async function getServerSideProps({ params }) { return { props: { product: await getProduct(Number(params.id)) } }; }   // per request
export async function getStaticProps() { return { props: { products: await listProducts() }, revalidate: 60 }; }                 // build + ISR
export async function getStaticPaths() { return { paths: [], fallback: "blocking" }; }
```

| Pages Router | App Router |
|---|---|
| `getServerSideProps` / `getStaticProps` | `async` Server Components + `fetch`/DB calls, `revalidate`, `generateStaticParams` |
| `_app.tsx` / `_document.tsx` | `app/layout.tsx` |
| API routes `pages/api/*.ts` | Route handlers `app/**/route.ts` + Server Actions |
| All components are client components | Server Components by default |
| `next/head` | Metadata API |

Both routers can coexist during a gradual migration.

# Interview

## [Beginner|High] What is Next.js and how is it different from React?

React is a library for building UI components. Next.js is a React framework that adds file-based routing, server-side and static rendering, Server Components, data fetching and caching, API endpoints (route handlers, Server Actions), image/font optimisation, SEO metadata and production build/deployment tooling. It produces full HTML from the server, improving SEO and first load.

## [Beginner|High] Explain the App Router folder structure and special files.

Folders inside `app/` map to URL segments; a segment becomes routable with `page.tsx` (UI) or `route.ts` (API). `layout.tsx` wraps child pages and persists across navigation; `loading.tsx` is the Suspense fallback; `error.tsx` is the error boundary; `not-found.tsx` shows 404s. `[id]` is a dynamic segment, `[...slug]` catch-all, `(group)` organises without affecting URLs, `_folder` is private.

## [Beginner|High] What are Server Components and Client Components?

Server Components (default in the App Router) render on the server, can be async and access databases/secrets directly, and send no JavaScript to the browser. Client Components (`"use client"`) are hydrated in the browser and can use state, effects and event handlers. Use server by default and client only for interactive parts.

## [Intermediate|High] What rendering strategies does Next.js support?

Static generation at build time (with `generateStaticParams`), Incremental Static Regeneration (time-based `revalidate` or on-demand `revalidatePath/Tag`), dynamic server rendering per request, streaming with Suspense, Partial Prerendering/Cache Components (static shell + dynamic holes), and client-side rendering inside Client Components. Choose per page/component based on how fresh and personalised the data must be.

## [Intermediate|High] What are Server Actions and what must you be careful about?

Async functions marked `"use server"` that run on the server and can be called from forms (`<form action={fn}>`) or client code, used for mutations without writing API routes; they integrate with revalidation and redirects and work without JavaScript. Careful: each action is effectively a public HTTP endpoint — always authenticate, authorise and validate input inside it, and don't return sensitive data.

## [Intermediate|High] How do you connect Next.js to SQL Server safely?

Only from server code — Server Components, Server Actions and route handlers on the Node.js runtime — using `mssql` (one shared connection pool kept on `globalThis` in development) or Prisma with the `sqlserver` provider; mark modules `import "server-only"`, keep credentials in environment variables, use parameterised queries, and keep the database close to the hosting region. Alternatively call an ASP.NET Core API that owns the database.

## [Intermediate|Medium] What is middleware (proxy in Next 16) used for?

Code that runs before a request is routed — redirects, rewrites, authentication gates, A/B testing, adding headers, localisation — configured with a `matcher`. It should be fast and must not be the only security check; validate access again in pages, actions and route handlers.

## [Intermediate|Medium] How does Next.js help SEO?

Pages render to full HTML on the server (static or dynamic), so crawlers see content immediately; the Metadata API and `generateMetadata` set titles, descriptions, canonical URLs and Open Graph tags; file conventions generate `sitemap.xml`, `robots.txt` and OG images; `next/image` and `next/font` improve Core Web Vitals; clean URLs from file routing.

## [Advanced|Medium] Pages Router vs App Router?

Pages Router uses `pages/`, `getServerSideProps/getStaticProps`, `_app/_document` and API routes; every component is a client component. App Router uses `app/`, nested layouts, React Server Components, streaming, Server Actions, route handlers and the Metadata API, with fetch/caching integrated. New projects use the App Router; both can coexist for incremental migration.

## [Advanced|Medium] What is hydration and what causes hydration errors?

Hydration attaches React's event handlers and state to server-rendered HTML in the browser. Errors happen when the client's first render differs from the server HTML — using `Date.now()`/random values, `window`/`localStorage` during render, locale-dependent formatting, invalid HTML nesting, or browser extensions modifying the DOM. Fix by rendering client-only values in `useEffect`, consistent formatting, or `suppressHydrationWarning` for intentional differences.

## [Scenario|High] A product listing page is slow because it queries SQL Server on every request, but prices change only once a day. What do you do?

Make it static or cached: use `generateStaticParams` + `revalidate = 86400` (ISR) or cache the query function (`"use cache"` with a cache life / `unstable_cache` in older versions), and call `revalidatePath("/products")` or `revalidateTag` from the admin update action so changes appear immediately. Add proper indexes for the query, and keep only truly personalised parts (cart badge) dynamic.

## [Scenario|Medium] After deployment, a page shows stale data even after the database changed. Why?

The route or fetch is statically generated or cached (build-time rendering, `revalidate`, `"use cache"`, cached fetch). Trigger on-demand revalidation (`revalidatePath`/`revalidateTag`/`updateTag`) after mutations, lower the revalidate interval, or make the route dynamic if it must always be fresh (reading cookies/headers or `connection()`).

## [Scenario|Medium] Your Next.js app works locally but database calls fail on Vercel. What do you check?

Environment variables set in the Vercel project for the right environment; the database firewall allows Vercel's outbound IPs (or use Azure SQL with public access rules / private networking); `encrypt: true` and valid certificates (no `trustServerCertificate` against a misconfigured server); the route runs on the Node.js runtime (not Edge); connection limits from many serverless instances (small pools); region latency.

## [Beginner|Medium] What is the difference between `next/link` and `<a>`?

`<Link>` performs client-side navigation — it fetches only the new route's payload, keeps layouts mounted and prefetches linked routes in the viewport — so navigation is fast without full page reloads. A plain `<a>` causes a full browser navigation. Use `<Link>` for internal links and `<a>` for external ones.

## [Intermediate|Medium] How do you handle environment variables in Next.js?

Server-only variables in `.env.local`/hosting settings are read via `process.env.X` on the server. Variables prefixed `NEXT_PUBLIC_` are inlined into client bundles at build time — never put secrets there. Different files per environment (`.env.development`, `.env.production`); validate them at startup (zod).

# Cheatsheet

## Folder conventions

`app/` routes · `page.tsx` · `layout.tsx` · `loading.tsx` · `error.tsx` · `not-found.tsx` · `route.ts` (API) · `[id]` dynamic · `[...slug]` catch-all · `(group)` · `_private` · `proxy.ts` (middleware) · `public/` static.

## Components

Server by default (async, DB, secrets, zero JS) · `"use client"` for state/events · keep client components small · `import "server-only"` for DB code.

## Rendering

Static + `generateStaticParams` · ISR `revalidate` · on-demand `revalidatePath/Tag` · dynamic per request · streaming Suspense · Cache Components `"use cache"` (16).

## SQL Server

`mssql` pool on `globalThis` · Node runtime · env vars (no `NEXT_PUBLIC_`) · parameterised queries · or Prisma `sqlserver` · or call an ASP.NET Core API.

## Deploy

Vercel (git push) · `output: "standalone"` for Docker/Azure/IIS (reverse proxy) · `output: "export"` for static sites.
