---
slug: microservices
title: Microservices & System Design with .NET
track: dotnet
order: 21
group: Architecture & Quality
icon: MS
color: #0b7285
summary: Monolith vs modular monolith vs microservices, service boundaries (DDD), REST/gRPC and messaging, API gateways, data per service, sagas and the outbox pattern, resilience, observability, caching, scaling and the system-design interview round.
---

# Overview

**Microservices** is an architectural style where an application is built as a set of small, independently deployable services, each owning one business capability and its own data, communicating over the network (HTTP/gRPC or messages).

| Style | What it is | Good for |
|---|---|---|
| Monolith | One deployable unit, one database | Small teams, early products — simple to build, test and deploy |
| Modular monolith | One deployable, but strict internal modules (own schema, public interfaces) | Most business apps; easy to split later |
| Microservices | Many deployables, each with its own data and pipeline | Large organisations, parts with very different scaling/release needs |

**System design** is the interview round where you design a whole system (requirements → APIs → data → components → scaling → trade-offs). Microservice concepts (queues, caches, gateways, consistency) are the vocabulary of that round.

In .NET the common toolset is: ASP.NET Core (REST/minimal APIs), gRPC, YARP (reverse proxy / gateway), MassTransit or NServiceBus over RabbitMQ / Azure Service Bus, Polly / `Microsoft.Extensions.Http.Resilience`, OpenTelemetry, Docker, Kubernetes/AKS or Azure Container Apps, and **.NET Aspire** for local orchestration and observability.

# Versions

| Year | Milestone |
|---|---|
| 2011–2014 | "Microservices" term popularised (James Lewis, Martin Fowler — article 2014) |
| 2015–2017 | Netflix OSS, Docker and Kubernetes make the style mainstream |
| 2017 | Microsoft eShopOnContainers reference app and the ".NET Microservices: Architecture for Containerized .NET Applications" guide |
| 2019 | gRPC support in ASP.NET Core 3.0 |
| 2021 | YARP 1.0 reverse proxy |
| 2023 | .NET 8: `Microsoft.Extensions.Http.Resilience` (built on Polly v8); .NET Aspire preview |
| 2024 | .NET Aspire 8.0 GA (May 2024) — orchestration, service discovery, OpenTelemetry dashboard |
| 2025 | .NET 10 and Aspire 9.x/13 — Aspire grows into a general app-host for distributed apps |

Industry trend to mention: many teams moved **back** to modular monoliths after over-splitting (e.g. the Amazon Prime Video monitoring case study, 2023). Interviewers like candidates who choose microservices for a reason, not by default.

# Lifecycle

**Life of a request in a microservice system:**

1. Client → **API gateway** (YARP / Azure API Management): TLS, auth token validation, routing, rate limiting.
2. Gateway → **service A** over HTTP/gRPC (service discovery finds an instance).
3. Service A reads/writes **its own database**.
4. Service A publishes an **event** (OrderPlaced) via the outbox to a **message broker**.
5. Services B and C consume the event asynchronously and update their own data.
6. Every hop carries a **trace id** (W3C `traceparent`) so one distributed trace shows the whole flow.

**Life of a service:** identify boundary (bounded context) → define contract (API/events) → build + tests → container image → CI/CD → deploy (rolling/blue-green/canary) → monitor (logs, metrics, traces, alerts) → evolve contract with versioning.

# Tools

- **Communication:** ASP.NET Core Web API / minimal APIs, gRPC, SignalR, YARP, Azure API Management, Ocelot (older).
- **Messaging:** RabbitMQ, Azure Service Bus, Kafka / Azure Event Hubs, MassTransit, NServiceBus, Wolverine.
- **Resilience:** Polly, `Microsoft.Extensions.Http.Resilience` (retry, circuit breaker, timeout, hedging).
- **Observability:** OpenTelemetry, .NET Aspire dashboard, Application Insights, Prometheus + Grafana, Jaeger/Zipkin, Seq.
- **Hosting:** Docker, Kubernetes / AKS, Azure Container Apps, Dapr (sidecar building blocks).
- **Data & cache:** SQL Server / Azure SQL, Cosmos DB, PostgreSQL, Redis.
- **Design:** C4 model diagrams, Event Storming for DDD boundaries.

# Module: Architecture Styles

## Lesson: [Basic|High] Monolith, modular monolith and microservices

**Monolith** — all features in one process and one database.

- ✅ Simple development, debugging, transactions, deployment.
- ❌ Grows into a "big ball of mud"; one bug or slow module affects all; the whole app scales together.

**Modular monolith** — one deployable, but modules are isolated:

```text
Shop.Api (one process)
 ├── Modules/Orders     (orders schema, IOrdersModule public API)
 ├── Modules/Catalog    (catalog schema)
 └── Modules/Billing    (billing schema)
Rule: modules talk only through public interfaces or in-process events — never each other's tables.
```

**Microservices** — each module becomes its own service with its own database and pipeline.

| | Monolith | Microservices |
|---|---|---|
| Deployment | All or nothing | Per service |
| Scaling | Whole app | Per service |
| Data consistency | ACID transactions | Eventual consistency, sagas |
| Failure | Process crash = outage | Partial failures, need resilience |
| Team fit | One team | Many teams, one service each |
| Operations cost | Low | High (CI/CD, monitoring, networking) |

> **Interview tip:** "I would start with a modular monolith and extract a service when a module needs independent scaling, release cadence or ownership." This is the answer most senior interviewers want.

## Lesson: [Intermediate|High] Finding service boundaries with Domain-Driven Design

Split by **business capability**, not by technical layer (never "a database service" + "a UI service").

DDD vocabulary interviewers use:

| Term | Meaning | Example |
|---|---|---|
| Bounded context | A boundary in which a model and its language are consistent | "Customer" means different things in Sales and Support |
| Ubiquitous language | Shared terms between developers and business | Order, Shipment, Invoice |
| Aggregate | Cluster of objects changed together with one root enforcing rules | `Order` (root) + `OrderLines` |
| Domain event | Something that happened in the domain | `OrderPlaced`, `PaymentFailed` |
| Anti-corruption layer | Translator protecting your model from another system's model | Adapter over a legacy ERP |

```csharp
public class Order   // aggregate root: all changes go through it so rules are always enforced
{
    private readonly List<OrderLine> _lines = [];
    public IReadOnlyList<OrderLine> Lines => _lines;
    public OrderStatus Status { get; private set; } = OrderStatus.Draft;

    public void AddLine(int productId, int qty, decimal price)
    {
        if (Status != OrderStatus.Draft) throw new InvalidOperationException("Order already submitted");
        if (qty <= 0) throw new ArgumentOutOfRangeException(nameof(qty));
        _lines.Add(new OrderLine(productId, qty, price));
    }
}
```

Good boundary signals: high cohesion inside, few calls across, data owned by one place, a team can own it end to end.

# Module: Communication

## Lesson: [Intermediate|High] Synchronous communication — REST, gRPC and the API gateway

| | REST (HTTP + JSON) | gRPC (HTTP/2 + Protobuf) |
|---|---|---|
| Contract | OpenAPI (optional) | `.proto` file (required, code-generated) |
| Payload | Text JSON — readable, larger | Binary — small and fast |
| Streaming | Limited (SSE, WebSockets) | Client, server and bidirectional streaming |
| Browser support | Native | Needs gRPC-Web |
| Best for | Public APIs, browser clients | Internal service-to-service calls |

```csharp
// Typed HttpClient with built-in resilience (.NET 8+)
builder.Services.AddHttpClient<CatalogClient>(c => c.BaseAddress = new Uri("https+http://catalog"))
       .AddStandardResilienceHandler();   // retry, circuit breaker, timeouts
```

**API gateway** — single entry point for clients: routing, TLS termination, authentication, rate limiting, request aggregation, caching. In .NET: **YARP**; in Azure: **API Management** or Application Gateway. **Backend-for-Frontend (BFF)**: a gateway per client type (web, mobile) shaped for that client.

```json
// YARP appsettings.json
"ReverseProxy": {
  "Routes":   { "orders": { "ClusterId": "orders", "Match": { "Path": "/api/orders/{**rest}" } } },
  "Clusters": { "orders": { "Destinations": { "d1": { "Address": "http://orders-api:8080/" } } } }
}
```

Danger: long synchronous call chains (A → B → C → D) multiply latency and failure probability. Prefer async messaging for anything that doesn't need an immediate answer.

## Lesson: [Intermediate|High] Asynchronous communication — queues, topics and events

| Concept | Meaning |
|---|---|
| Queue (point-to-point) | One message → one consumer (work distribution). Service Bus queue, RabbitMQ queue |
| Topic / pub-sub | One message → every subscriber gets a copy. Service Bus topics, RabbitMQ fanout exchange, Kafka |
| Command vs event | Command = "do this" (one handler). Event = "this happened" (zero or many listeners) |
| At-least-once delivery | A message can arrive twice → consumers must be **idempotent** |
| Dead-letter queue | Where messages go after repeated failures, for inspection and replay |
| Event streaming | Ordered, replayable log (Kafka, Event Hubs) — for analytics, IoT, event sourcing |

```csharp
// MassTransit consumer — idempotent by checking a processed-message table
public class OrderPlacedConsumer(AppDb db) : IConsumer<OrderPlaced>
{
    public async Task Consume(ConsumeContext<OrderPlaced> ctx)
    {
        if (await db.Processed.AnyAsync(p => p.MessageId == ctx.MessageId)) return;   // already handled
        db.Invoices.Add(new Invoice(ctx.Message.OrderId, ctx.Message.Total));
        db.Processed.Add(new ProcessedMessage(ctx.MessageId!.Value));
        await db.SaveChangesAsync();
    }
}
```

Benefits: temporal decoupling (consumer can be down), load levelling (queue absorbs peaks), easy to add new subscribers.

# Module: Data and Consistency

## Lesson: [Advanced|High] Database per service, sagas and the outbox pattern

**Database per service:** each service owns its data; others access it only via the service's API or events. This keeps services independently deployable — but you lose cross-service ACID transactions and joins.

**Saga** — a long business transaction made of local transactions, each with a **compensating action** if a later step fails:

```text
PlaceOrder:  Orders: create (Pending) → Payment: charge → Inventory: reserve → Orders: confirm
Failure at Inventory:  Payment: refund (compensate) → Orders: cancel
```

- **Choreography** — services react to each other's events (simple, but the flow is implicit).
- **Orchestration** — a coordinator (MassTransit state machine, Durable Functions) tells each service what to do (explicit, easier to monitor).

**Transactional outbox** — solves "saved to DB but failed to publish the event" (dual write):

```csharp
await using var tx = await db.Database.BeginTransactionAsync();
db.Orders.Add(order);
db.Outbox.Add(new OutboxMessage("OrderPlaced", JsonSerializer.Serialize(new OrderPlaced(order.Id, order.Total))));
await db.SaveChangesAsync();
await tx.CommitAsync();
// A background worker reads unsent Outbox rows, publishes them, marks them sent (MassTransit/NServiceBus have this built in).
```

**Inbox / idempotent consumer** — store processed message ids so duplicates are ignored.

**CAP theorem (short version):** during a network partition a distributed system must choose Consistency or Availability. Most microservice systems choose availability + **eventual consistency** for cross-service data.

## Lesson: [Advanced|Medium] CQRS and event sourcing

**CQRS (Command Query Responsibility Segregation):** separate the write model (commands, validation, domain rules) from the read model (queries, denormalised views shaped for screens).

```text
Command → Handler → Domain model → Write DB ──(events)──> Projector → Read DB/view → Query handler → UI
```

- Can be one database with separate code paths (most common) or separate stores.
- Reads scale independently; read models can be rebuilt.

**Event sourcing:** store the sequence of events (`OrderCreated`, `LineAdded`, `OrderShipped`) instead of only current state; current state = replay of events. Gives a full audit trail and time travel, but adds complexity (versioning events, snapshots, projections). Tools: Marten (PostgreSQL), EventStoreDB, Cosmos DB change feed.

> **Interview tip:** CQRS does not require event sourcing or MediatR. Say "we used CQRS-lite: commands through EF Core, queries through Dapper on views".

# Module: Running Microservices in Production

## Lesson: [Intermediate|High] Resilience — retries, timeouts, circuit breakers

In a distributed system **something is always failing**. Patterns:

| Pattern | What it does |
|---|---|
| Timeout | Never wait forever for a dependency |
| Retry with exponential backoff + jitter | Recover from transient faults (network blips, 503) — only for idempotent operations |
| Circuit breaker | After repeated failures, fail fast for a while so the dependency can recover |
| Bulkhead | Limit concurrent calls so one slow dependency can't exhaust all threads/connections |
| Fallback | Return cached/default data when a dependency is down |
| Hedging | Send a second request if the first is slow, use the first answer |

```csharp
builder.Services.AddHttpClient<PaymentClient>()
    .AddResilienceHandler("payments", b =>
    {
        b.AddTimeout(TimeSpan.FromSeconds(10));
        b.AddRetry(new HttpRetryStrategyOptions { MaxRetryAttempts = 3, BackoffType = DelayBackoffType.Exponential, UseJitter = true });
        b.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions { FailureRatio = 0.5, BreakDuration = TimeSpan.FromSeconds(30) });
    });
```

Also: **health checks** (`AddHealthChecks()`, `/health/live` and `/health/ready` for Kubernetes probes) and **graceful degradation**.

## Lesson: [Intermediate|High] Observability — logs, metrics and distributed traces

| Signal | Answers | .NET tooling |
|---|---|---|
| Logs | What happened in this service? | `ILogger`, Serilog, structured logging |
| Metrics | How much/how fast/how many errors? | `System.Diagnostics.Metrics`, Prometheus, Azure Monitor |
| Traces | Where did time go across services? | `ActivitySource`, OpenTelemetry, Jaeger, App Insights |

```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddHttpClientInstrumentation().AddSqlClientInstrumentation().AddOtlpExporter())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddRuntimeInstrumentation().AddOtlpExporter());
```

The **trace id** flows automatically through HttpClient and most message libraries (W3C Trace Context), so one request can be followed across every service. **.NET Aspire** wires OpenTelemetry, health checks, resilience and service discovery by default (`AddServiceDefaults()`) and shows everything in its dashboard.

Golden signals to alert on: **latency, traffic, errors, saturation**.

## Lesson: [Advanced|High] Scaling, caching and the system design round

**Scaling:**

- **Vertical** — bigger machine (simple, limited). **Horizontal** — more instances behind a load balancer; services must be **stateless** (session in Redis/cookies, files in Blob storage).
- **Database scaling** — indexes first, then read replicas, caching, partitioning, and finally sharding.
- **Autoscaling** — Kubernetes HPA / KEDA (scale on queue length), App Service autoscale, Container Apps scale rules.

**Caching strategies:**

| Strategy | How |
|---|---|
| Cache-aside | App reads cache → on miss reads DB and fills cache (most common) |
| Write-through | Write to cache and DB together |
| Expiry + invalidation | TTL, plus delete keys on update; beware stale data and stampedes |
| Where | Browser/CDN → API output cache → distributed cache (Redis) → DB buffer pool |

```csharp
// .NET 9+ HybridCache: in-memory + distributed, with stampede protection
var product = await cache.GetOrCreateAsync($"product:{id}",
    async ct => await db.Products.FindAsync([id], ct), new HybridCacheEntryOptions { Expiration = TimeSpan.FromMinutes(10) });
```

**System design answer template:** requirements (functional + non-functional) → estimates (users, RPS, storage) → API → data model → high-level diagram → deep dive on 1–2 hard parts → bottlenecks, failures and trade-offs.

**Classic designs to practise:** URL shortener (key generation, redirects, cache, analytics), e-commerce checkout (saga, stock, payment idempotency), notification service (queues, retries, templates, preferences), rate limiter (token bucket in Redis), chat (WebSockets/SignalR, fan-out, presence), file upload service (pre-signed URLs, Blob storage, virus scan queue).

# Interview

## [Beginner|High] What are microservices? What are their advantages and disadvantages?

Small, independently deployable services, each owning one business capability and its own data, talking over HTTP/gRPC or messages. Advantages: independent deployment and scaling, team autonomy, fault isolation, technology freedom per service. Disadvantages: distributed-system complexity (network failures, latency), no cross-service transactions (eventual consistency, sagas), harder testing and debugging, much more DevOps and monitoring work, data duplication.

## [Beginner|High] Monolith vs microservices — which would you choose for a new project?

Usually start with a **modular monolith**: one deployable with strict module boundaries and separate schemas. It is faster to build and easier to operate, and the boundaries let you extract services later. Choose microservices when there is a concrete need — independent scaling, separate teams with separate release cycles, very different technology or reliability needs — and the organisation can afford the DevOps cost.

## [Beginner|High] How do microservices communicate?

Synchronously with REST over HTTP (public/browser APIs) or gRPC (fast internal calls, contracts in `.proto`), usually through an API gateway; asynchronously with messages through a broker (RabbitMQ, Azure Service Bus, Kafka) using queues for commands and topics for events. Prefer async for anything that doesn't need an immediate reply — it decouples availability and absorbs load spikes.

## [Beginner|High] What is an API gateway and why use one?

A single entry point in front of the services. It routes requests, terminates TLS, validates tokens, applies rate limiting and CORS, can aggregate several calls into one response and hides the internal topology from clients. .NET: YARP or Ocelot; Azure: API Management or Application Gateway. A Backend-for-Frontend is a gateway tailored to one client type.

## [Intermediate|High] What is "database per service" and how do you query data across services?

Each service owns its tables; nobody else reads or writes them directly. Cross-service data is obtained by calling the owner's API, by API composition (gateway/BFF calls several services and merges), or by keeping a local read-only copy updated via events (CQRS read model). Reporting usually goes to a separate data warehouse fed by events or CDC.

## [Intermediate|High] Explain the saga pattern. Choreography vs orchestration?

A saga is a sequence of local transactions across services, each with a compensating action to undo it if a later step fails (charge → refund). Choreography: each service listens for events and publishes the next one — simple, decentralised, but the overall flow is hard to see. Orchestration: a central coordinator (state machine) sends commands and tracks state — explicit and easier to monitor and change, but one more component.

## [Intermediate|High] What is the outbox pattern and what problem does it solve?

The dual-write problem: saving to the database and publishing a message are two systems, so a crash between them leaves them inconsistent. With an outbox, the business data and the message are written in **one local transaction** (message into an Outbox table); a separate relay publishes outbox rows to the broker and marks them sent. Delivery becomes at-least-once, so consumers must be idempotent (often an Inbox table of processed ids).

## [Intermediate|High] How do you make a service resilient to failures of its dependencies?

Timeouts on every call; retries with exponential backoff and jitter for transient, idempotent operations; circuit breaker to fail fast while a dependency is down; bulkheads to limit concurrency; fallbacks/cached data; async messaging so work is queued rather than lost; health checks and auto-restart. In .NET: `AddStandardResilienceHandler()` / Polly.

## [Intermediate|High] What is idempotency and why is it important in distributed systems?

An operation is idempotent if doing it twice has the same effect as once. Messages are delivered at least once and clients retry on timeouts, so duplicates are normal. Techniques: idempotency keys on POST (store key + result, return the same result on repeat), natural keys/unique constraints, processed-message tables, "set" operations instead of "increment".

## [Intermediate|Medium] REST vs gRPC — when would you choose gRPC?

gRPC for internal service-to-service calls where performance and strict contracts matter: binary Protobuf, HTTP/2 multiplexing, code-generated clients, streaming. REST for public APIs, browser clients, easy debugging and broad tooling. gRPC needs gRPC-Web or a gateway for browsers.

## [Intermediate|Medium] How do you implement distributed tracing in .NET?

Use OpenTelemetry: add ASP.NET Core, HttpClient and SqlClient instrumentation and an exporter (OTLP to Jaeger, Aspire dashboard, Application Insights). .NET's `Activity` API propagates the W3C `traceparent` header automatically, so all spans of one request share a trace id. Add the trace id to logs to jump from a log line to the full trace.

## [Advanced|High] How do you handle data consistency without distributed transactions?

Accept eventual consistency and design for it: keep each aggregate's invariants inside one service and one local transaction; use sagas with compensations for multi-service workflows; outbox + idempotent consumers for reliable events; reservation patterns (reserve stock, confirm later, expire if unpaid); show pending states in the UI. Two-phase commit (MSDTC) is avoided — it blocks and doesn't work across most cloud services and brokers.

## [Advanced|High] Explain CQRS. When is it worth it?

Separate models for writes (commands that enforce business rules) and reads (queries/views optimised for screens). Worth it when reads vastly outnumber writes, read shapes differ a lot from the write model, or reads and writes need to scale separately. Overkill for simple CRUD. It doesn't require event sourcing or separate databases; a common form is EF Core for commands and Dapper over views for queries.

## [Advanced|Medium] How do you version APIs and events without breaking consumers?

Prefer additive, backward-compatible changes (new optional fields; consumers ignore unknown fields). For breaking changes: URL or header versioning (Asp.Versioning), run old and new side by side, deprecate with a timeline. For events: include a version, never change meaning of existing fields, publish new event types for big changes, use a schema registry for Kafka/Avro. Consumer-driven contract tests (Pact) catch breaks in CI.

## [Advanced|Medium] How do you scale a .NET service horizontally?

Make it stateless (no in-memory session or local files; use Redis, cookies, Blob storage), run multiple instances behind a load balancer, use a distributed cache and a shared Data Protection key ring, keep DB connections pooled and queries efficient, and autoscale on CPU/RPS or queue length (Kubernetes HPA/KEDA, Container Apps rules). Background jobs need a lock or a queue so they don't run on every instance.

## [Scenario|High] Design a URL shortener.

Requirements: create short link, redirect fast, optional expiry and analytics; e.g. 100M links, read-heavy (100:1). API: `POST /links` → `{ code }`, `GET /{code}` → 301/302. Key generation: base62 of a unique id (DB sequence or Snowflake-style id) or a random 7-char code with uniqueness check. Store code → URL in a key-value store or SQL with a unique index; cache hot codes in Redis; CDN/edge for redirects. Analytics: publish click events to a queue/stream and aggregate asynchronously so redirects stay fast. Discuss collisions, abuse (rate limits, malware checks) and custom aliases.

## [Scenario|High] An order service calls payment, which calls a slow fraud check; under load the whole site times out. What do you change?

Cascading failure from synchronous chains. Add timeouts and a circuit breaker around the fraud call, a bulkhead so slow calls can't use every connection, and a fallback (accept low-value orders, flag for review). Better: make the flow asynchronous — accept the order as Pending, send a message for payment/fraud processing, update status by events, and notify the user. Scale the fraud service, and add tracing to prove where the time goes.

## [Scenario|High] Customers are charged twice when the client retries a payment request. Fix it.

Make the payment endpoint idempotent: the client sends an `Idempotency-Key` header (GUID per checkout attempt); the server stores the key with the result in the same transaction as the charge; a repeat request with the same key returns the stored result instead of charging again. Also pass an idempotency key to the payment provider (Stripe and others support this) and use a unique constraint on (OrderId, PaymentAttempt).

## [Scenario|Medium] You must split a large .NET monolith into services. How do you start?

Don't big-bang rewrite. Map bounded contexts and coupling first; make the monolith modular (clear modules, separate schemas, no cross-module table access). Use the **strangler fig** pattern: put a gateway (YARP) in front, extract one well-bounded, high-value module at a time (often notifications, catalog or reporting), give it its own data (sync via events during migration), route its traffic to the new service, then remove the old code. Invest early in CI/CD, containers and observability.

## [Scenario|Medium] A message consumer keeps failing on one bad message and blocks the queue. What do you do?

Configure limited retries with backoff, then move the message to the **dead-letter queue** so processing continues. Alert on DLQ depth, log the failure with the message id, fix the bug or the data, then replay from the DLQ. Make the consumer idempotent so replays are safe, and validate message schemas.

# Cheatsheet

## Decide the style

Modular monolith by default → extract a service only for independent scaling, release cadence, ownership or technology. Split by business capability (bounded context), never by technical layer.

## Communication

| Need | Use |
|---|---|
| Public/browser API | REST + OpenAPI via gateway |
| Fast internal call | gRPC |
| "Do this later" | Queue (command) |
| "This happened" | Topic/pub-sub (event) |
| High-volume stream / replay | Kafka / Event Hubs |

## Consistency toolbox

Local transaction per aggregate · saga (choreography/orchestration) with compensations · transactional outbox · idempotent consumer / inbox · idempotency keys · eventual consistency shown in UI.

## Resilience toolbox

Timeout · retry + backoff + jitter (idempotent only) · circuit breaker · bulkhead · fallback · health checks (live/ready) · DLQ. .NET: `AddStandardResilienceHandler()`.

## Observability

Logs + metrics + traces via OpenTelemetry; correlation/trace id everywhere; golden signals: latency, traffic, errors, saturation; .NET Aspire dashboard locally, App Insights/Grafana in production.

## System design template

Requirements → estimates → API → data model → diagram → deep dive → bottlenecks & failures → trade-offs. Always mention cache, queue, replicas, idempotency and monitoring.
