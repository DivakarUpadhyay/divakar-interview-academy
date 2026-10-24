---
slug: system-design
title: System Design — High-Level Design (HLD) from Basics to Case Studies
track: foundations
order: 5
group: System Design
icon: HLD
color: #5f3dc4
summary: How to design large systems — requirements and estimation, scalability and availability, latency vs throughput, CAP and consistency models, load balancing, caching strategies, database choice, replication, partitioning and sharding, consistent hashing, queues and event streaming, rate limiting, search, storage and CDNs, observability, and full case studies (URL shortener, news feed, chat, notification service, e-commerce checkout, file storage, ride booking) with the HLD interview framework.
---

# Overview

**High-Level Design (HLD)** describes a system as boxes and arrows: clients, load balancers, services, databases, caches, queues, storage, and how data flows between them. **Low-Level Design (LLD)** zooms into one box: classes, interfaces, methods, database tables (next course). **System design interviews** are mostly HLD for experienced roles, with some LLD.

| Question HLD answers | Example decision |
|---|---|
| How many users/requests/data? | 10M users, 2k requests/s peak, 5 TB/year |
| Which components? | API gateway, stateless services, Redis, SQL + read replicas, queue, CDN |
| Where is data stored and how is it split? | Orders in SQL sharded by customer, images in Blob storage |
| How does it scale and survive failures? | Horizontal scaling, replicas across zones, retries, circuit breakers |
| What are the trade-offs? | Eventual consistency for feeds, strong consistency for payments |

# Versions

| Era | Milestone in large-scale system design |
|---|---|
| 1990s | Three-tier architecture (presentation, business, data) on single servers |
| 2000s | Web farms + load balancers; memcached (2003); Google papers: GFS (2003), MapReduce (2004), Bigtable (2006) |
| 2007 | Amazon Dynamo paper — eventual consistency, consistent hashing |
| 2008–2012 | Cloud (AWS 2006, Azure 2010); NoSQL (Cassandra, MongoDB, Redis); Kafka (2011) |
| 2012–2015 | Microservices, Docker (2013), Kubernetes (2014); Google Spanner (globally consistent SQL) |
| 2016–2020 | Serverless, managed databases, service meshes, CQRS/event sourcing popular |
| 2020s | Modular monoliths come back for many teams; vector databases and AI workloads; platform engineering |

# Lifecycle

**The HLD interview framework (≈45 minutes):**

1. **Requirements (5 min)** — functional (what users do) and non-functional (scale, latency, availability, consistency, security). Agree on what's out of scope.
2. **Estimation (5 min)** — users, requests/second, read:write ratio, storage per year, bandwidth.
3. **API design (5 min)** — main endpoints with inputs/outputs.
4. **Data model (5 min)** — main entities, choose SQL vs NoSQL, keys and indexes.
5. **High-level diagram (10 min)** — client → CDN → load balancer → services → cache/DB/queue/storage.
6. **Deep dive (10 min)** — 1–2 hard parts the interviewer cares about (feed generation, hot keys, consistency, sharding).
7. **Wrap-up (5 min)** — bottlenecks, failure scenarios, monitoring, how it evolves at 10× scale.

# Tools

- **Diagramming:** draw.io / diagrams.net, Excalidraw, Lucidchart, Miro, C4 model (context → container → component → code), PlantUML / Mermaid.
- **Estimation:** latency numbers, powers of two, a calculator.
- **Reading:** *Designing Data-Intensive Applications* (Kleppmann), *System Design Interview* (Alex Xu), High Scalability blog, engineering blogs (Netflix, Uber, Stripe, Microsoft), Azure Architecture Center, AWS Well-Architected.

# Module: Fundamentals

## Lesson: [Basic|High] Requirements and back-of-the-envelope estimation

**Functional requirements** — features: "users post photos", "followers see a feed", "users like and comment".
**Non-functional requirements** — qualities: availability (99.9 % = ~8.8 h downtime/year; 99.99 % = ~53 min), latency (p99 < 200 ms), throughput, durability, consistency, security, cost.

**Useful numbers:**

| Fact | Value |
|---|---|
| Seconds per day | ~86,400 ≈ 10⁵ |
| 1 million requests/day | ≈ 12 requests/second average |
| Peak factor | 2–10× average |
| 1 KB × 1 million | 1 GB |
| Memory read / SSD read / same-DC round trip / cross-continent | 100 ns / 100 µs / 0.5 ms / 150 ms |

**Example — photo sharing app:** 50M daily active users, each views 20 photos and uploads 0.1 per day.

- Reads: 50M × 20 / 86,400 ≈ **11,600 requests/s** (peak ~50k/s) → heavy read caching + CDN.
- Writes: 50M × 0.1 / 86,400 ≈ **58 uploads/s**.
- Storage: 5M photos/day × 500 KB ≈ **2.5 TB/day** → ~900 TB/year → object storage, not a database.
- Read:write ≈ 200:1 → optimise for reads.

## Lesson: [Basic|High] Scalability, availability, latency and throughput

| Term | Meaning |
|---|---|
| **Scalability** | Handle more load by adding resources |
| Vertical scaling (scale up) | Bigger machine — simple, limited, single point of failure |
| Horizontal scaling (scale out) | More machines — needs stateless services and data partitioning |
| **Availability** | % of time the system works; achieved by redundancy (no single point of failure) |
| **Reliability** | Works correctly (no data loss, correct results) |
| **Latency** | Time for one request (measure p50, p95, p99 — not the average) |
| **Throughput** | Requests handled per second |
| **Durability** | Data survives failures (replication, backups) |

Stateless services are the key to horizontal scaling: keep session/state in Redis, a database or the client token, so any instance can serve any request.

**Availability in series and parallel:** two components each 99.9 % in series → 99.8 %; two redundant copies of a 99 % component in parallel → 99.99 %.

## Lesson: [Intermediate|High] CAP theorem, consistency models and PACELC

**CAP:** in a distributed data store, when a **network partition** happens you must choose between **Consistency** (every read sees the latest write) and **Availability** (every request gets a response). Partitions are unavoidable, so the real choice is CP vs AP during failures.

| Choice | Behaviour during partition | Examples |
|---|---|---|
| CP | Refuse/timeout some requests to stay consistent | Banking ledgers, SQL with synchronous replication, ZooKeeper, etcd |
| AP | Answer with possibly stale data, reconcile later | Social feeds, shopping carts, DNS, Cassandra, DynamoDB (default) |

**PACELC:** if Partition → choose A or C; Else (normal operation) → choose Latency or Consistency. Synchronous replication = more consistency, more latency.

**Consistency models:** strong (linearizable) → read-your-writes → monotonic reads → causal → **eventual** (replicas converge eventually). Choose per feature: payment balance strong; like counts eventual.

**ACID vs BASE:** ACID (Atomicity, Consistency, Isolation, Durability) — relational transactions. BASE (Basically Available, Soft state, Eventually consistent) — many NoSQL systems.

# Module: Building Blocks

## Lesson: [Intermediate|High] Load balancing and API gateways

Clients → **DNS** (can balance across regions: Azure Traffic Manager/Front Door) → **load balancer** (L4 or L7) → service instances. Algorithms: round robin, least connections, consistent hashing (sticky by user/key), weighted. Health checks remove failed instances. Load balancers themselves are redundant (active-passive pairs or managed cloud services).

An **API gateway** adds authentication, rate limiting, request routing to microservices, response aggregation and API versioning (Azure API Management, YARP, Kong).

## Lesson: [Intermediate|High] Caching — where, strategies and pitfalls

```text
Browser cache → CDN → API gateway/output cache → application in-memory cache → distributed cache (Redis) → database buffer pool
```

| Strategy | How | Good for |
|---|---|---|
| **Cache-aside** (lazy loading) | App checks cache; on miss loads DB and fills cache | Most read-heavy data |
| Read-through | Cache library loads from DB itself | Simpler app code |
| Write-through | Write to cache and DB together | Data read right after write |
| Write-behind | Write to cache, flush to DB asynchronously | High write throughput (risk of loss) |
| Refresh-ahead | Refresh popular keys before expiry | Predictable hot data |

**Eviction policies:** LRU (least recently used — most common), LFU, FIFO, TTL expiry.

**Pitfalls and fixes:**

| Problem | Fix |
|---|---|
| Stale data | Short TTL, delete key on update, versioned keys |
| **Cache stampede** (many requests miss at once and hit the DB) | Lock/single-flight per key (`HybridCache` does this), early refresh, jittered TTLs |
| **Hot key** (one key gets huge traffic) | Local in-memory copy, replicate the key, split it |
| Cache penetration (requests for keys that don't exist) | Cache "not found" briefly, Bloom filter |
| Cold start after restart | Warm up popular keys |

## Lesson: [Intermediate|High] Choosing the database — SQL vs NoSQL

| Type | Examples | Strengths | Use for |
|---|---|---|---|
| **Relational (SQL)** | SQL Server, PostgreSQL, MySQL, Azure SQL | ACID transactions, joins, constraints, mature tooling | Orders, payments, inventory, most business data |
| Key-value | Redis, DynamoDB | Very fast simple lookups | Cache, sessions, counters, leaderboards |
| Document | MongoDB, Cosmos DB | Flexible JSON documents, easy scaling | Catalogs, user profiles, content |
| Wide-column | Cassandra, ScyllaDB | Massive write throughput, time-ordered data | IoT telemetry, messaging history, activity logs |
| Graph | Neo4j, Cosmos DB Gremlin | Relationships and traversals | Social graphs, recommendations, fraud |
| Time-series | InfluxDB, TimescaleDB, Azure Data Explorer | Time-bucketed metrics | Monitoring, sensors |
| Search | Elasticsearch, Azure AI Search | Full-text search, ranking, facets | Product search, logs |
| Object storage | Azure Blob, S3 | Huge files cheaply | Images, videos, backups |
| Vector | pgvector, Azure AI Search vectors, Qdrant | Similarity search on embeddings | AI/RAG, recommendations |

Default: **start with a relational database** unless a specific need (massive scale for simple access patterns, flexible schema, special query type) points elsewhere. Many systems are **polyglot** — SQL for transactions + Redis + Blob + search index.

## Lesson: [Advanced|High] Replication, partitioning, sharding and consistent hashing

**Replication** — copies of data on several nodes:

| Type | How | Trade-off |
|---|---|---|
| Leader–follower (primary–replica) | Writes to primary; replicas copy changes; reads can go to replicas | Replication lag → stale reads; failover needed |
| Multi-leader | Several nodes accept writes (multi-region) | Write conflicts to resolve |
| Leaderless (quorum) | Write to W nodes, read from R nodes, W + R > N for consistency | Tunable, complex |

Synchronous replication = no data loss on failover but slower writes; asynchronous = faster but may lose the last seconds. SQL Server: Always On availability groups; Azure SQL: geo-replication and read replicas.

**Partitioning / sharding** — split data across nodes so each holds a part:

| Method | How | Watch out |
|---|---|---|
| Range | By key range (A–M, N–Z; dates) | Hot ranges (all new orders go to the latest partition) |
| Hash | `hash(key) % N` | Resharding moves almost everything when N changes |
| **Consistent hashing** | Nodes and keys on a hash ring; key goes to the next node clockwise; virtual nodes balance load | Adding a node moves only ~1/N of keys — used by Dynamo, Cassandra, distributed caches |
| Directory/lookup | A service maps key → shard | Extra lookup, flexible |

Choose a shard key that spreads load evenly and keeps related data together (e.g. `CustomerId` for orders). Cross-shard queries and transactions become expensive — design around the main access pattern.

## Lesson: [Intermediate|High] Queues, event streaming and asynchronous processing

| | Message queue | Event stream (log) |
|---|---|---|
| Examples | RabbitMQ, Azure Service Bus, SQS | Kafka, Azure Event Hubs, Kinesis |
| Consumption | Message removed after processing; competing consumers | Messages kept for days; each consumer group tracks its offset; replay possible |
| Ordering | Per queue/session | Per partition |
| Use | Background jobs, commands, decoupling services | Analytics, event sourcing, IoT, activity tracking, CDC |

Benefits: **decoupling** (producer doesn't wait for the consumer), **load levelling** (absorb spikes), **reliability** (retry, dead-letter queue), **fan-out** (many subscribers). Design consumers to be **idempotent** (at-least-once delivery). Use the outbox pattern to publish events reliably with database changes.

## Lesson: [Intermediate|Medium] Rate limiting, search, storage and CDNs

**Rate limiting algorithms:**

| Algorithm | Idea |
|---|---|
| Fixed window | Count requests per minute window — simple, bursty at edges |
| Sliding window log/counter | Smoother limit over a moving window |
| **Token bucket** | Tokens refill at a rate; each request takes one; allows short bursts — most common |
| Leaky bucket | Requests leave at a constant rate — smooths traffic |

Distributed rate limiting keeps counters in Redis (atomic `INCR` with expiry or Lua scripts). ASP.NET Core has `AddRateLimiter` with fixed window, sliding window, token bucket and concurrency limiters; return **429** with `Retry-After`.

**Search:** an inverted index (word → documents) in Elasticsearch/Azure AI Search, fed asynchronously from the database (change events); supports full text, typo tolerance, facets and ranking.

**Files and media:** store in object storage (Blob/S3), keep only metadata + URL in the database, upload directly from the client with pre-signed/SAS URLs, serve through a CDN, process asynchronously (thumbnails, virus scan, transcoding) via a queue.

# Module: Case Studies

## Lesson: [Advanced|High] Case study — news feed (social timeline)

**Requirements:** post, follow, see a feed of followed users' posts sorted by time; 100M DAU; feed load < 200 ms.

**Two ways to build the feed:**

| | Fan-out on write (push) | Fan-out on read (pull) |
|---|---|---|
| How | When a user posts, insert the post id into each follower's feed list (Redis) | When a user opens the feed, fetch recent posts from everyone they follow and merge |
| Read cost | Very fast | Slow for users following many |
| Write cost | Huge for celebrities with millions of followers | Cheap |

**Hybrid (used by large networks):** push for normal users; for celebrities, pull their posts at read time and merge.

```text
Client → LB → Post service → Posts DB (sharded by post id) → event "PostCreated" → Fan-out workers → Redis feed lists (per user, last 500 ids)
Client → LB → Feed service → Redis feed list + celebrity posts → hydrate posts from cache/DB → media via CDN
```

Extras: pagination with cursors (not offsets), ranking service, counters for likes eventually consistent, notifications via a queue.

## Lesson: [Advanced|High] Case study — chat / messaging system

**Requirements:** 1:1 and group chat, online presence, delivery/read receipts, message history, push notifications when offline.

- **Connections:** WebSockets (SignalR in .NET) to chat servers; a connection registry (Redis) maps user → server.
- **Send flow:** sender → chat server → persist message (store sorted by conversation + time; wide-column DB or SQL partitioned by conversation) → look up recipient's server → deliver over its WebSocket; if offline → push notification service (APNs/FCM) via a queue.
- **Ordering:** per-conversation sequence numbers; client de-duplicates by message id.
- **Groups:** fan-out to members (small groups) or members pull (large channels).
- **Presence:** heartbeats with TTL in Redis; publish presence changes only to contacts.
- **Scale:** chat servers scale horizontally; a pub/sub backplane (Redis / Azure SignalR Service) routes messages between servers.

## Lesson: [Advanced|High] Case study — e-commerce checkout and inventory

**Requirements:** browse catalog, cart, checkout, payment, inventory must not oversell, order history; flash sales with traffic spikes.

```text
CDN (images, SPA) → API gateway → Catalog svc (read replicas + cache + search index)
                               → Cart svc (Redis)
                               → Order svc (SQL) ─ outbox ─▶ Service Bus ─▶ Payment svc / Inventory svc / Email svc
```

Key decisions:

- **Inventory consistency:** reserve stock in a transaction with a conditional update (`UPDATE Stock SET Qty = Qty - @n WHERE ProductId = @id AND Qty >= @n`); release reservations that aren't paid within N minutes.
- **Payment idempotency:** idempotency key per checkout attempt; payment provider webhooks update order status.
- **Saga:** order created (pending) → payment → inventory confirm → order confirmed; compensate (refund/release) on failure.
- **Flash sales:** queue-based admission (virtual waiting room), pre-warmed caches, rate limiting, autoscaling.
- **Read scaling:** catalog is read-heavy → cache + read replicas + CDN.

## Lesson: [Advanced|Medium] Case studies — notification service, file storage and ride booking (outlines)

**Notification service:** API receives "notify user X with template T" → validates preferences (opt-outs, quiet hours) → queues per channel (email, SMS, push) → workers call providers (SendGrid, Twilio, FCM) with retries and dead-letter queues → delivery status stored; rate limits per user; templates and localisation; idempotency keys to avoid duplicate sends.

**File storage (like Dropbox/OneDrive):** files split into chunks (e.g. 4 MB) with hashes → upload only changed chunks (deduplication) directly to object storage via signed URLs → metadata service (SQL) stores file tree, versions, chunk lists → sync service notifies other devices (long polling/WebSockets) → CDN for downloads; conflict handling with versions.

**Ride booking (like Uber):** drivers send location every few seconds → location service stores latest positions in an in-memory geo index (geohash/quadtree, Redis GEO) → rider requests a ride → matching service finds nearby available drivers and offers the trip → trip service manages state machine (requested → accepted → started → completed) → pricing (surge) and payment services → events to analytics. Strong consistency on assigning one driver per trip (conditional update/lock), eventual elsewhere.

# Module: Operating Large Systems

## Lesson: [Intermediate|Medium] Reliability, observability and disaster recovery

- **Redundancy everywhere:** multiple instances, availability zones, replicated databases, no single point of failure.
- **Failure handling:** timeouts, retries with backoff + jitter, circuit breakers, bulkheads, graceful degradation (show cached data), health checks.
- **Observability:** logs, metrics (golden signals: latency, traffic, errors, saturation), distributed traces; SLOs and alerts on symptoms users feel.
- **Deployments:** blue-green, canary releases, feature flags, automatic rollback.
- **Disaster recovery:** **RPO** (how much data you can lose) and **RTO** (how long you can be down) drive the design — backups (RPO hours), async geo-replication (minutes), sync replication (zero); regular restore drills.
- **Security:** authentication at the edge, least privilege between services, encryption in transit and at rest, secrets in a vault, WAF, DDoS protection.

# Interview

## [Beginner|High] What is the difference between HLD and LLD?

HLD shows the architecture of the whole system: components (clients, load balancers, services, databases, caches, queues, CDN), how they interact, data flow, scaling and failure handling. LLD details the inside of components: classes, interfaces, methods, design patterns, database tables and APIs. HLD answers "what pieces and how they connect"; LLD answers "how each piece is built".

## [Beginner|High] Vertical vs horizontal scaling?

Vertical: give one machine more CPU/RAM — simple, no code change, but limited and a single point of failure. Horizontal: add more machines behind a load balancer — almost unlimited and fault tolerant, but services must be stateless and data must be replicated/partitioned. Typical path: scale up first, then out.

## [Beginner|High] What is caching? Explain cache-aside.

Storing frequently read data in faster storage (memory/Redis/CDN) to reduce latency and database load. Cache-aside: on read, check the cache; on miss, read from the database and put the result in the cache with a TTL; on write, update the database and delete (or update) the cache key. Watch for stale data, stampedes and hot keys.

## [Beginner|High] What does a load balancer do?

Distributes requests across multiple servers to increase capacity and availability, performs health checks to stop sending traffic to failed servers, and can terminate TLS and route by URL (L7). Algorithms: round robin, least connections, IP hash/consistent hashing, weighted.

## [Intermediate|High] Explain the CAP theorem with examples.

In a distributed system, during a network partition you can't have both strong consistency and full availability. CP systems reject or delay requests to avoid stale data (bank balances, configuration stores like etcd); AP systems keep answering and reconcile later (social feeds, DNS, carts in Dynamo-style stores). When there is no partition, the trade-off is latency vs consistency (PACELC).

## [Intermediate|High] SQL or NoSQL — how do you choose?

Start from the data and access patterns. SQL for structured, related data needing transactions, joins and constraints (orders, payments). NoSQL when you need massive horizontal scale for simple key-based access, flexible schemas, very high write throughput, or special models (documents, graphs, time-series). Many systems combine them: SQL as the source of truth, Redis cache, search index, blob storage.

## [Intermediate|High] What is sharding? How do you choose a shard key?

Splitting a dataset horizontally across multiple database nodes so each stores a subset, increasing capacity and throughput. A good shard key has high cardinality, spreads reads and writes evenly (no hot shard) and matches the main query pattern so most queries hit one shard (e.g. customer id for orders). Use consistent hashing or a directory to allow adding shards with minimal data movement.

## [Intermediate|High] What is consistent hashing and why is it useful?

Nodes and keys are placed on a hash ring; each key belongs to the next node clockwise. When a node is added or removed, only the keys between it and its neighbour move (~1/N of keys), unlike `hash % N` where almost all keys move. Virtual nodes (many points per server) spread load evenly. Used in distributed caches and databases (Dynamo, Cassandra) and load balancers.

## [Intermediate|High] Why use a message queue in system design?

To decouple services (the producer doesn't wait for or depend on the consumer being up), absorb traffic spikes (load levelling), process work asynchronously (emails, video encoding), retry failures with dead-letter queues, and fan out events to multiple subscribers. Consumers must be idempotent because delivery is at-least-once.

## [Intermediate|Medium] Replication: synchronous vs asynchronous?

Synchronous: the write is acknowledged only after replicas confirm — no data loss on failover but higher latency and reduced availability if a replica is slow. Asynchronous: acknowledge after the primary writes — fast, but replicas lag (stale reads) and recent writes can be lost if the primary fails. Many systems use sync within a region and async across regions.

## [Intermediate|Medium] How would you design a rate limiter?

Pick an algorithm (token bucket for bursts, sliding window for smoothness), a key (user id, API key, IP), and limits per endpoint. Store counters in Redis with atomic operations and TTLs so all API instances share them; return 429 with Retry-After; put it in the API gateway or middleware; allow configuration per plan; fail open or closed by policy if Redis is down.

## [Advanced|High] Design a URL shortener (high level).

Write API creates a short code (base62 of a unique id or random 7 chars with collision check) and stores code → long URL in a key-value store or SQL with a unique index; read path `GET /{code}` checks Redis, then the store, and returns a 301/302 redirect. Reads dominate (100:1) → cache and CDN/edge. Analytics: send click events to a queue/stream and aggregate asynchronously. Scale: shard by code; custom aliases, expiry and abuse checks as extras.

## [Advanced|High] Design a news feed. Push or pull?

Fan-out on write pushes post ids into followers' precomputed feeds (fast reads, expensive for celebrities); fan-out on read builds the feed at read time (cheap writes, slow reads). Use a hybrid: push for normal users, pull and merge for celebrity accounts. Store feeds in Redis lists, posts in a sharded store, media via CDN, use cursor pagination, and rank asynchronously.

## [Advanced|Medium] What are RPO and RTO?

Recovery Point Objective: the maximum acceptable data loss measured in time (e.g. 5 minutes → you need replication or log backups at least every 5 minutes). Recovery Time Objective: the maximum acceptable downtime to restore service (e.g. 1 hour → automated failover or a tested runbook). Lower values cost more: synchronous replication, hot standby regions.

## [Scenario|High] Your read-heavy API's database is at 90 % CPU. What steps do you take, in order?

Measure the top queries first; add/fix indexes and remove N+1 queries; add caching (in-memory/Redis) for hot data and HTTP caching/CDN where possible; route reads to read replicas; reduce payloads with projection and paging; scale the database up as a quick fix; finally partition/shard if data or write volume demands it. Monitor after each step.

## [Scenario|High] A flash sale will bring 50× normal traffic for 10 minutes. How do you prepare?

Load test beforehand; pre-scale and warm caches; serve static content from the CDN; put a virtual waiting room/queue in front of checkout; rate limit per user; make inventory reservation atomic (conditional update) to prevent overselling; move non-critical work (emails, analytics) to queues; use feature flags to switch off expensive features; monitor dashboards and have a rollback plan.

## [Scenario|Medium] Users in Europe complain the India-hosted app is slow. What do you change?

Measure where time goes (network latency ≈ 150 ms per round trip). Put static assets and cacheable responses on a CDN; reduce round trips (bundle requests, HTTP/2/3); deploy the stateless API in a European region behind global routing (Azure Front Door/Traffic Manager); add read replicas in Europe for read-heavy data, keep writes in the primary region or use multi-region databases (Cosmos DB, Azure SQL geo-replication) with clear consistency choices; consider data-residency (GDPR) requirements.

# Cheatsheet

## Interview framework

Requirements → estimation → API → data model → diagram → deep dive → bottlenecks/failures → trade-offs.

## Estimation shortcuts

1M/day ≈ 12/s · peak 2–10× · day ≈ 10⁵ s · 99.9 % ≈ 8.8 h/yr down · 99.99 % ≈ 53 min/yr.

## Building blocks

DNS/CDN · load balancer · API gateway · stateless services · cache (Redis) · SQL + replicas · NoSQL · object storage · queue/stream · search index · rate limiter · monitoring.

## Data scaling ladder

Indexes → caching → read replicas → vertical scale → partitioning → sharding (consistent hashing) → multi-region.

## Trade-offs to say out loud

Consistency vs availability · latency vs consistency · push vs pull · SQL vs NoSQL · sync vs async · cost vs redundancy · simplicity (monolith) vs independence (microservices).
