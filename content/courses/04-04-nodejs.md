---
slug: nodejs
title: Node.js — Runtime Internals, Express, APIs and SQL Server
track: frontend
order: 4
group: Node.js
icon: Node
color: #3c873a
summary: What Node.js is and how it works inside (V8, libuv, the event loop phases, thread pool, non-blocking I/O), modules (CommonJS vs ES modules), npm and package.json, the core modules (fs, path, http, events, streams, buffer), asynchronous patterns (callbacks, promises, async/await), Express.js REST APIs with middleware and error handling, project folder structure, connecting to SQL Server (mssql, Prisma, Sequelize), authentication with JWT, worker threads and clustering, testing, security, performance, deployment and the Node.js interview questions.
---

# Overview

**Node.js** is a JavaScript **runtime** that runs JavaScript outside the browser — on servers, build tools and CLIs. It uses Google's **V8** engine to execute JavaScript and **libuv** to provide non-blocking I/O through an **event loop**, so one process can handle thousands of concurrent connections with a single main thread.

| Used for | Examples |
|---|---|
| Web APIs and backends | Express, Fastify, NestJS, Koa |
| Full stack frameworks | Next.js, Nuxt, Remix, SvelteKit |
| Real-time apps | Chat, live dashboards with Socket.IO/WebSockets |
| Tooling | npm, Vite, webpack, Angular CLI, ESLint, TypeScript compiler |
| Serverless | AWS Lambda, Azure Functions, Vercel Functions |

Node.js vs ASP.NET Core: both are fast, cross-platform backends. Node shares one language (JavaScript/TypeScript) with the frontend and has the largest package ecosystem (npm); .NET offers strong typing by default, multithreaded CPU performance and a richer built-in framework.

# Versions

| Version | Year | Highlights |
|---|---|---|
| 0.1 | 2009 | Ryan Dahl creates Node.js (V8 + event loop) |
| 0.x / io.js | 2010–2015 | npm (2010), Express (2010); io.js fork merges back → Node.js Foundation (2015) |
| 4–8 | 2015–2017 | ES2015+ support, LTS releases begin, async/await (v7.6/8) |
| 10–12 | 2018–2019 | Worker threads, HTTP/2, N-API stable |
| 14–16 | 2020–2021 | ES modules stable, optional chaining, Apple Silicon support |
| 18 | 2022 | Global `fetch`, built-in test runner (`node:test`), watch mode later |
| 20 | 2023 | Permission model (experimental), stable test runner, single executable apps |
| 22 | 2024 (LTS) | `require()` of ES modules, WebSocket client, `--experimental-strip-types` (run TypeScript) |
| 24 | 2025 (LTS from Oct 2025) | npm 11, V8 13.x, `URLPattern` global, TypeScript type stripping on by default |
| 25 | 2025 (Current) | Next "current" line; even versions become LTS each October |

Release model: a new major every April and October; **even-numbered** releases become **LTS** (30 months of support). Use an Active/Maintenance LTS version in production.

# Lifecycle

**How Node.js handles a request:**

1. `node server.js` starts the process: V8 is initialised, your module is loaded and executed top to bottom (synchronous setup), then the **event loop** starts.
2. `http.createServer(...).listen(3000)` registers a listening socket with the OS via libuv.
3. A request arrives → the OS notifies libuv (epoll/kqueue/IOCP) → the event loop runs your request callback on the **main thread**.
4. Your handler calls `await db.query(...)` → the query is sent on a socket (non-blocking) and the handler **yields**; the main thread serves other requests.
5. When the DB answers, the promise resolves; its continuation is queued as a **microtask** and runs on the main thread.
6. File-system operations, DNS lookups, crypto and zlib run on libuv's **thread pool** (4 threads by default) and report back to the loop.
7. The response is written; when there is nothing left to do (no timers, sockets or pending work), the process exits.

**Event loop phases (libuv):**

```text
   ┌───────────────────────────┐
┌─>│ timers                    │  setTimeout / setInterval callbacks whose time has come
│  ├───────────────────────────┤
│  │ pending callbacks         │  some deferred system callbacks (e.g. TCP errors)
│  ├───────────────────────────┤
│  │ idle, prepare             │  internal
│  ├───────────────────────────┤
│  │ poll                      │  retrieve new I/O events; run I/O callbacks; may block here waiting
│  ├───────────────────────────┤
│  │ check                     │  setImmediate callbacks
│  ├───────────────────────────┤
└──┤ close callbacks           │  socket.on('close') etc.
   └───────────────────────────┘
Between every callback: process.nextTick queue, then the Promise microtask queue are drained.
```

# Tools

- **Runtime & package managers:** Node.js (nvm / nvm-windows / fnm to switch versions), npm, pnpm, yarn; npx.
- **Frameworks:** Express, Fastify, NestJS (Angular-like structure, DI), Koa, Hono.
- **Data:** `mssql` (SQL Server via tedious), Prisma ORM, Sequelize, TypeORM, Knex, `pg`, `mysql2`, Mongoose.
- **Dev tools:** nodemon / `node --watch`, ts-node / tsx, ESLint, Prettier, Chrome DevTools (`node --inspect`), VS Code debugger.
- **Testing:** `node:test`, Jest, Vitest, Supertest (HTTP), Playwright.
- **Production:** PM2, Docker, `clinic.js` (performance), OpenTelemetry, pino/winston (logging).

# Module: Node.js Fundamentals

## Lesson: [Basic|High] What Node.js is — V8, libuv and the single-threaded event loop

```text
Your JavaScript
     │
┌────▼─────────────── Node.js ────────────────────────────┐
│ Core modules (fs, http, crypto, stream …) — JS + C++ bindings │
├───────────────┬──────────────────────────────────────────┤
│ V8            │ libuv                                     │
│ JS engine:    │ event loop, non-blocking network I/O,      │
│ parse, JIT,   │ thread pool (fs, dns.lookup, crypto, zlib),│
│ GC            │ timers, signals, child processes           │
└───────────────┴──────────────────────────────────────────┘
                 Operating system (epoll / kqueue / IOCP)
```

- **Single-threaded** for your JavaScript: only one callback runs at a time — no locks needed for shared variables.
- **Non-blocking I/O:** waiting for the network/disk doesn't block the thread; Node continues with other work.
- Great for **I/O-bound** work (APIs, proxies, real-time). **CPU-bound** work (image processing, big JSON parsing, heavy loops) blocks the event loop for everyone — move it to **worker threads**, a separate service, or a queue.

```js
// Blocking vs non-blocking
const fs = require('node:fs');
const data = fs.readFileSync('big.log');          // ❌ blocks the event loop until the file is read
fs.readFile('big.log', (err, d) => { /* … */ });  // ✅ callback when done; loop keeps serving requests
const text = await fs.promises.readFile('big.log', 'utf8');   // ✅ promise version
```

## Lesson: [Basic|High] Modules — CommonJS vs ES modules, npm and package.json

```js
// CommonJS (default for .js unless "type": "module")
const path = require('node:path');
module.exports = { add: (a, b) => a + b };

// ES modules (.mjs, or "type": "module" in package.json)
import path from 'node:path';
import { readFile } from 'node:fs/promises';
export function add(a, b) { return a + b; }
export default add;
```

| | CommonJS | ES modules |
|---|---|---|
| Syntax | `require` / `module.exports` | `import` / `export` |
| Loading | Synchronous, at runtime | Static analysis, async loading, top-level `await` |
| `__dirname` | Available | Use `import.meta.dirname` (Node 20.11+) |
| Interop | Can `require()` ESM since Node 22 (sync graphs) | Can `import` CommonJS |

```json
{
  "name": "shop-api",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "node --test",
    "lint": "eslint ."
  },
  "dependencies": { "express": "^5.1.0", "mssql": "^11.0.1", "zod": "^3.24.0" },
  "devDependencies": { "eslint": "^9.0.0", "supertest": "^7.0.0" }
}
```

- **dependencies** ship to production; **devDependencies** only for development/build.
- **Semantic versioning:** `^5.1.0` allows 5.x.x updates, `~5.1.0` allows 5.1.x, exact `5.1.0` pins.
- **package-lock.json** records exact installed versions — commit it; use `npm ci` in CI for reproducible installs.
- `npm audit` checks known vulnerabilities; `npm outdated` shows updates.

## Lesson: [Basic|High] Core modules — fs, path, http, events, buffer and process

```js
import http from 'node:http';
import { EventEmitter } from 'node:events';
import path from 'node:path';

// Minimal HTTP server without frameworks
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }
  res.writeHead(404).end();
});
server.listen(process.env.PORT ?? 3000, () => console.log('listening'));

// EventEmitter — the pattern behind streams, servers and sockets
class OrderEvents extends EventEmitter {}
const events = new OrderEvents();
events.on('placed', (order) => console.log('send email for', order.id));
events.emit('placed', { id: 1001 });

// path and process
const file = path.join(import.meta.dirname, 'data', 'orders.json');
console.log(process.env.NODE_ENV, process.argv, process.memoryUsage().heapUsed);
process.on('SIGTERM', () => server.close(() => process.exit(0)));   // graceful shutdown

// Buffer — raw binary data
const buf = Buffer.from('₹100', 'utf8');
console.log(buf.length, buf.toString('base64'));
```

## Lesson: [Intermediate|High] Asynchronous JavaScript in Node — callbacks, promises, async/await and the microtask queue

```js
// 1. Callbacks (error-first convention)
fs.readFile('a.txt', 'utf8', (err, text) => { if (err) return console.error(err); console.log(text); });

// 2. Promises
fs.promises.readFile('a.txt', 'utf8').then(console.log).catch(console.error);

// 3. async/await — cleanest
async function loadAll() {
  try {
    const [a, b] = await Promise.all([readFile('a.txt', 'utf8'), readFile('b.txt', 'utf8')]);   // in parallel
    return a + b;
  } catch (err) {
    console.error('load failed', err);
    throw err;
  }
}

// Execution order puzzle — a classic interview question
console.log('1 sync');
setTimeout(() => console.log('5 timeout'), 0);
setImmediate(() => console.log('6 immediate'));
Promise.resolve().then(() => console.log('4 promise microtask'));
process.nextTick(() => console.log('3 nextTick'));
console.log('2 sync');
// Output: 1, 2, 3, 4, then 5 and 6 (timeout vs immediate order can vary at top level; inside an I/O callback, immediate runs first)
```

| API | Runs |
|---|---|
| `process.nextTick` | Right after the current operation, before promises |
| Promise `.then` / `await` continuation | Microtask queue, after nextTick queue |
| `setTimeout(fn, 0)` | Timers phase of the next loop iteration (≥ ~1 ms) |
| `setImmediate` | Check phase (after poll) |

Unhandled promise rejections **crash** the process (default since Node 15) — always `await` or `.catch`, and add `process.on('unhandledRejection', …)` logging.

## Lesson: [Intermediate|High] Streams and buffers — processing large data

Streams process data piece by piece — constant memory regardless of file size.

| Type | Example |
|---|---|
| Readable | `fs.createReadStream`, HTTP request, DB cursor |
| Writable | `fs.createWriteStream`, HTTP response |
| Duplex | TCP socket |
| Transform | `zlib.createGzip()`, CSV parser |

```js
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

await pipeline(createReadStream('orders.csv'), createGzip(), createWriteStream('orders.csv.gz'));   // handles errors + backpressure

// Stream a large file to an HTTP client
app.get('/export', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  createReadStream('export.csv').pipe(res);
});
```

**Backpressure:** when the writer is slower than the reader, `write()` returns `false`; `pipe`/`pipeline` pause and resume the source automatically so memory doesn't explode.

# Module: Building APIs

## Lesson: [Basic|High] Express.js — routing, middleware and error handling

```js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
app.use(helmet());                                    // security headers
app.use(cors({ origin: ['http://localhost:4200'] }));
app.use(express.json({ limit: '1mb' }));               // parse JSON bodies

app.use((req, res, next) => {                          // custom middleware (logging)
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`));
  next();
});

app.get('/api/products', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  res.json(await productService.list(page));
});
app.get('/api/products/:id', async (req, res) => {
  const p = await productService.get(Number(req.params.id));
  if (!p) return res.status(404).json({ title: 'Not found' });
  res.json(p);
});
app.post('/api/products', async (req, res) => {
  const created = await productService.create(req.body);
  res.status(201).location(`/api/products/${created.id}`).json(created);
});

app.use((req, res) => res.status(404).json({ title: 'Route not found' }));   // 404 handler
app.use((err, req, res, next) => {                                           // error handler: 4 parameters
  console.error(err);
  res.status(err.status ?? 500).json({ title: err.status ? err.message : 'Unexpected error' });
});

app.listen(3000);
```

- Middleware runs **in registration order**; each calls `next()` or ends the response.
- **Express 5** (stable 2024) forwards rejected promises from async handlers to the error middleware automatically (Express 4 needed `try/catch` or `express-async-errors`).
- Validate input (zod/Joi/express-validator) — never trust `req.body`.

## Lesson: [Basic|High] Node.js / Express project folder structure (with sample files)

```text
shop-api/
├── src/
│   ├── server.js                 starts the HTTP server, graceful shutdown
│   ├── app.js                    creates the Express app: middleware, routes, error handler (exported for tests)
│   ├── config/
│   │   └── index.js              reads environment variables (dotenv / process.env) and validates them
│   ├── db/
│   │   ├── pool.js               SQL Server connection pool (mssql)
│   │   └── migrations/           SQL scripts or Prisma migrations
│   ├── modules/                  feature folders (vertical slices)
│   │   ├── products/
│   │   │   ├── product.routes.js       Express router: URL → controller
│   │   │   ├── product.controller.js   HTTP layer: read req, call service, send res
│   │   │   ├── product.service.js      business logic
│   │   │   ├── product.repository.js   SQL queries
│   │   │   ├── product.schema.js       zod validation schemas
│   │   │   └── product.test.js
│   │   └── orders/ …
│   ├── middleware/
│   │   ├── auth.js               JWT verification
│   │   ├── validate.js           validation middleware
│   │   └── errorHandler.js
│   └── utils/
│       └── logger.js             pino/winston logger
├── tests/                        integration tests (supertest)
├── .env.example                  documented environment variables (never commit .env)
├── .gitignore                    node_modules, .env, dist
├── Dockerfile
├── package.json / package-lock.json
└── README.md
```

```js
// src/app.js
import express from 'express';
import { productRouter } from './modules/products/product.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
export const app = express();
app.use(express.json());
app.use('/api/products', productRouter);
app.use(errorHandler);

// src/modules/products/product.routes.js
import { Router } from 'express';
import * as controller from './product.controller.js';
export const productRouter = Router();
productRouter.get('/', controller.list);
productRouter.get('/:id', controller.getById);
productRouter.post('/', controller.create);

// src/modules/products/product.controller.js
import * as service from './product.service.js';
export async function list(req, res) { res.json(await service.list(Number(req.query.page ?? 1))); }
export async function getById(req, res) {
  const product = await service.getById(Number(req.params.id));
  return product ? res.json(product) : res.status(404).json({ title: 'Not found' });
}
export async function create(req, res) { res.status(201).json(await service.create(req.body)); }

// src/server.js
import { app } from './app.js';
import { config } from './config/index.js';
const server = app.listen(config.port, () => console.log(`API on :${config.port}`));
process.on('SIGTERM', () => server.close());
```

NestJS projects use a similar feature structure with `*.module.ts`, `*.controller.ts`, `*.service.ts` and decorators (Angular-style DI).

## Lesson: [Intermediate|High] Connecting Node.js to SQL Server (mssql, Prisma, Sequelize)

**1. `mssql` package (most common, uses the tedious driver):**

```js
// src/db/pool.js
import sql from 'mssql';

const config = {
  server: process.env.DB_SERVER,                 // e.g. "localhost" or "myserver.database.windows.net"
  database: process.env.DB_NAME,
  user: process.env.DB_USER,                     // SQL authentication
  password: process.env.DB_PASSWORD,
  port: 1433,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: {
    encrypt: true,                               // required for Azure SQL
    trustServerCertificate: process.env.NODE_ENV !== 'production',   // local dev with self-signed cert
  },
};

export const poolPromise = new sql.ConnectionPool(config).connect();   // ONE pool for the whole app
export { sql };

// src/modules/products/product.repository.js
import { poolPromise, sql } from '../../db/pool.js';

export async function findById(id) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('id', sql.Int, id)                    // parameterised — prevents SQL injection
    .query('SELECT Id, Name, Price FROM dbo.Products WHERE Id = @id');
  return result.recordset[0] ?? null;
}

export async function searchByProc(customerId) {
  const pool = await poolPromise;
  const r = await pool.request()
    .input('CustomerId', sql.Int, customerId)
    .output('Total', sql.Int)
    .execute('dbo.usp_GetCustomerOrders');       // stored procedure
  return { orders: r.recordset, total: r.output.Total };
}

export async function placeOrder(order) {        // transaction
  const pool = await poolPromise;
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const r = await new sql.Request(tx).input('cid', sql.Int, order.customerId)
      .query('INSERT INTO dbo.Orders (CustomerId) OUTPUT INSERTED.Id VALUES (@cid)');
    for (const l of order.lines)
      await new sql.Request(tx).input('oid', sql.Int, r.recordset[0].Id).input('pid', sql.Int, l.productId).input('qty', sql.Int, l.qty)
        .query('INSERT INTO dbo.OrderLines (OrderId, ProductId, Qty) VALUES (@oid, @pid, @qty)');
    await tx.commit();
  } catch (e) { await tx.rollback(); throw e; }
}
```

```bash
# .env (never commit)
DB_SERVER=localhost
DB_NAME=Shop
DB_USER=shop_app
DB_PASSWORD=change-me
```

Windows authentication from Node needs the `msnodesqlv8` driver (`mssql/msnodesqlv8`, Windows only); for Azure SQL prefer **Microsoft Entra ID** auth (`authentication: { type: 'azure-active-directory-default' }`) so no password is stored.

**2. Prisma ORM:**

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Product {
  id    Int     @id @default(autoincrement())
  name  String  @db.NVarChar(200)
  price Decimal @db.Decimal(18, 2)
}
```

```bash
DATABASE_URL="sqlserver://localhost:1433;database=Shop;user=shop_app;password=change-me;encrypt=true;trustServerCertificate=true"
npx prisma migrate dev --name init    # or: npx prisma db pull (database-first)
```

```js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const cheap = await prisma.product.findMany({ where: { price: { lt: 100 } }, orderBy: { name: 'asc' } });
```

**3. Sequelize:** `new Sequelize(db, user, pass, { dialect: 'mssql', host, dialectOptions: { options: { encrypt: true } } })`, define models, `findAll({ where })`.

## Lesson: [Intermediate|High] Authentication with JWT, configuration and security

```js
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ title: 'Missing token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], audience: 'shop-api' });
    next();
  } catch {
    res.status(401).json({ title: 'Invalid token' });
  }
}
export const requireRole = (role) => (req, res, next) => (req.user?.roles?.includes(role) ? next() : res.status(403).json({ title: 'Forbidden' }));

router.delete('/:id', requireAuth, requireRole('Admin'), controller.remove);
```

**Security checklist:** helmet (headers), CORS allow-list, input validation (zod), parameterised SQL, rate limiting (`express-rate-limit`), hash passwords with bcrypt/argon2, secrets in environment variables/Key Vault, `npm audit` and Dependabot, avoid `eval`/dynamic `require` of user input, limit body size, don't leak stack traces, keep Node on a supported LTS.

# Module: Performance and Production

## Lesson: [Advanced|High] Scaling Node — cluster, worker threads, child processes and PM2

| Tool | Use |
|---|---|
| **cluster** module / PM2 cluster mode | Run one Node process per CPU core sharing the port — scale an API on one machine |
| **worker_threads** | Run CPU-heavy JavaScript in parallel threads (separate V8 isolates) without blocking the event loop |
| **child_process** (`spawn`, `exec`, `fork`) | Run other programs/scripts as separate processes |
| Horizontal scaling | Many containers behind a load balancer (Kubernetes, App Service, ECS) — keep the app stateless |

```js
// CPU-heavy work in a worker thread
import { Worker } from 'node:worker_threads';
function hashInWorker(data) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./hash-worker.js', import.meta.url), { workerData: data });
    w.once('message', resolve); w.once('error', reject);
  });
}
```

```bash
pm2 start src/server.js -i max --name shop-api    # cluster mode, one process per core, auto-restart
pm2 logs; pm2 reload shop-api                      # zero-downtime reload
```

**Performance tips:** never block the event loop (sync fs/crypto in request paths, huge JSON.stringify), use streams for big data, connection pooling, caching (Redis), compression, `UV_THREADPOOL_SIZE` for heavy fs/crypto, measure with `clinic doctor`/`--prof`, watch event-loop lag and heap usage, avoid memory leaks (global caches, listeners never removed — `MaxListenersExceededWarning`).

## Lesson: [Intermediate|Medium] Testing, logging and deploying Node.js apps

```js
// tests/products.test.js — node:test + supertest
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/products returns a list', async () => {
  const res = await request(app).get('/api/products').expect(200);
  assert.ok(Array.isArray(res.body.items));
});
```

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
USER node
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]
```

Deploy targets: Docker on any cloud, Azure App Service (Linux, Node runtime), AWS Elastic Beanstalk/ECS/Lambda, Vercel/Netlify functions, or IIS with **iisnode** / reverse proxy (IIS + URL Rewrite → Node on a port) on Windows servers. Logging: pino (fast JSON) or winston; set `NODE_ENV=production` (Express caches views and reduces error detail).

# Interview

## [Beginner|High] What is Node.js and why is it fast for I/O-heavy apps?

A JavaScript runtime built on Chrome's V8 engine and libuv. It runs your JavaScript on a single main thread with an event loop and performs I/O (network, disk) asynchronously, so while one request waits for the database the thread serves other requests. Without thread-per-request overhead it handles many concurrent connections efficiently — ideal for APIs, proxies and real-time apps.

## [Beginner|High] Explain the event loop in Node.js.

The event loop is libuv's loop that repeatedly checks for completed work and runs callbacks on the main thread in phases: timers (setTimeout/setInterval), pending callbacks, poll (I/O events), check (setImmediate), close callbacks. Between callbacks Node drains the `process.nextTick` queue and then the promise microtask queue. Blocking the loop with long synchronous code delays every other request.

## [Beginner|High] Is Node.js single-threaded?

Your JavaScript runs on one main thread, but Node itself is not: libuv uses a thread pool (default 4) for file system, DNS lookup, crypto and compression, and the OS handles network I/O asynchronously. You can also use worker threads for CPU-heavy JavaScript and the cluster module or multiple containers to use all CPU cores.

## [Beginner|High] What is the difference between CommonJS and ES modules?

CommonJS uses `require()`/`module.exports`, loads synchronously at runtime and was Node's original system. ES modules use `import`/`export`, are statically analysable (tree-shaking), support top-level await and are the JavaScript standard — enabled with `.mjs` or `"type": "module"`. Modern Node supports both and recent versions can `require()` ES modules.

## [Beginner|High] What is middleware in Express?

A function `(req, res, next)` in the request pipeline that can read/modify the request and response, end the response, or call `next()` to pass control on. Used for logging, parsing bodies, authentication, CORS, validation and error handling (error middleware has four parameters `(err, req, res, next)`). Middleware runs in the order it's registered.

## [Beginner|Medium] What are package.json, package-lock.json, dependencies and devDependencies?

`package.json` describes the project: name, scripts, engines, dependency ranges. `package-lock.json` records the exact resolved versions of the whole dependency tree so installs are reproducible (`npm ci`). `dependencies` are needed at runtime in production; `devDependencies` only for development, testing and building.

## [Intermediate|High] process.nextTick vs setImmediate vs setTimeout(fn, 0)?

`process.nextTick` callbacks run immediately after the current operation, before promise microtasks and before the event loop continues. `setTimeout(fn, 0)` runs in the timers phase of a later loop iteration (minimum ~1 ms). `setImmediate` runs in the check phase right after the poll phase. Inside an I/O callback, setImmediate always fires before a zero timeout. Overusing nextTick can starve I/O.

## [Intermediate|High] How do you handle errors in async Node.js code?

Use `try/catch` around `await`, `.catch()` on promises, and error-first callbacks for callback APIs. In Express 5 rejected async handlers reach the error middleware automatically (Express 4: wrap or use express-async-errors). Add a central error middleware, log `unhandledRejection` and `uncaughtException` (then exit and let the process manager restart), validate input to avoid predictable errors, and never swallow errors silently.

## [Intermediate|High] How do you connect Node.js to SQL Server?

Use the `mssql` package (tedious driver): create one `ConnectionPool` at startup with server, database, credentials and `encrypt: true`, then run parameterised queries with `request().input(...).query(...)`, stored procedures with `.execute()`, and transactions with `sql.Transaction`. Alternatives: Prisma (`provider = "sqlserver"`) or Sequelize/TypeORM. Keep credentials in environment variables or use Entra ID authentication for Azure SQL.

## [Intermediate|High] What are streams and why are they useful?

Objects for reading or writing data in chunks (Readable, Writable, Duplex, Transform). They keep memory constant for large files or responses, start delivering data before everything is loaded, and handle backpressure. Use `stream.pipeline` to connect streams with proper error handling — e.g. read a CSV, gzip it, write it to the HTTP response.

## [Intermediate|Medium] What is the cluster module and how is it different from worker threads?

Cluster forks multiple Node processes (one per core) that share the same server port, each with its own event loop and memory — scaling a stateless HTTP server on one machine (PM2 does this). Worker threads run JavaScript in parallel threads inside one process (separate V8 isolates, can share memory via SharedArrayBuffer) — for CPU-heavy tasks without blocking the main event loop.

## [Intermediate|Medium] How do you secure an Express API?

Helmet for security headers, strict CORS, HTTPS, input validation (zod/Joi), parameterised queries/ORM against injection, authentication (JWT/OAuth with libraries like passport or jose) and role checks, rate limiting, body size limits, password hashing (bcrypt/argon2), secrets in env/Key Vault, dependency scanning (`npm audit`, Dependabot), no stack traces in responses, and keeping Node and packages updated.

## [Advanced|High] What causes event-loop blocking and how do you detect and fix it?

Long synchronous operations: big loops, synchronous fs/crypto (`readFileSync`, `pbkdf2Sync`), huge `JSON.parse/stringify`, regex catastrophes, sorting large arrays per request. Detect with event-loop lag metrics (`perf_hooks.monitorEventLoopDelay`), clinic.js, profiling with `--inspect`/`--prof`. Fix by using async APIs, streaming, chunking work with `setImmediate`, moving CPU work to worker threads or another service, and caching results.

## [Advanced|Medium] How do memory leaks happen in Node and how do you find them?

Objects kept reachable: growing global arrays/maps used as caches without limits, event listeners added per request and never removed, closures capturing large data, timers not cleared, unclosed DB connections. Find them by watching heap usage over time, taking heap snapshots (`--inspect` + Chrome DevTools, `heapdump`) and comparing retained objects; fix by bounding caches (LRU), removing listeners and cleaning up timers.

## [Advanced|Medium] Node.js vs ASP.NET Core — when would you choose each?

Node.js: JavaScript/TypeScript across front and back end, huge npm ecosystem, great for I/O-heavy APIs, real-time apps, BFFs and serverless functions, fast prototyping. ASP.NET Core: strong typing and tooling by default, true multithreading for CPU-heavy work, rich built-in framework (DI, auth, EF Core), excellent performance and long-term support — common in enterprises with SQL Server/Azure. Choose based on team skills, workload and ecosystem.

## [Scenario|High] Your Node API becomes very slow when a user uploads a large CSV for import. What's wrong and how do you fix it?

The upload is probably read and parsed synchronously in memory (`readFileSync`, `JSON/CSV parse` of the whole file) on the main thread, blocking the event loop for all users. Stream the upload (multer/busboy to disk or Blob storage), parse it with a streaming CSV parser, insert in batches (bulk insert/TVP), and ideally move the import to a background job/queue with a worker, returning `202 Accepted` and a status endpoint.

## [Scenario|Medium] The production Node process crashes occasionally with "UnhandledPromiseRejection". What do you do?

Find the promise without `await`/`.catch` from the stack trace and logs; fix it by awaiting or handling the error; add a global `process.on('unhandledRejection')` handler that logs (then exits for safety), run under a process manager (PM2/containers) that restarts the app, and add lint rules (`@typescript-eslint/no-floating-promises`) to prevent new ones.

# Cheatsheet

## Architecture

V8 (JS engine) + libuv (event loop, thread pool of 4, async I/O) · your JS on one main thread · I/O non-blocking · CPU work → worker threads.

## Event loop order

sync code → `process.nextTick` → promise microtasks → timers → pending → poll (I/O) → check (`setImmediate`) → close callbacks.

## Express essentials

`express.json()` · routers per feature · middleware order matters · `(err, req, res, next)` error handler · Express 5 async errors · helmet, cors, rate limit, validation.

## SQL Server from Node

`mssql` ConnectionPool once · `.input(name, type, value)` parameters · `.execute(proc)` · `sql.Transaction` · `encrypt: true` (Azure) · Prisma `provider = "sqlserver"` · secrets in env vars.

## Production

LTS (even) versions · `npm ci` · `NODE_ENV=production` · PM2/cluster or containers · graceful SIGTERM shutdown · pino logging · monitor event-loop lag and heap.
