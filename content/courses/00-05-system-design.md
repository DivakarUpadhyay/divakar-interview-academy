---
slug: system-design
title: System Design: High-Level Design (HLD) from Basics to Case Studies
track: foundations
order: 5
group: System Design
icon: HLD
color: #5f3dc4
summary: How to design large systems, how a web request travels, requirements and estimation, scalability and availability, latency vs throughput, API design (REST, gRPC, GraphQL), CAP and consistency models, load balancing, caching strategies, database choice, replication, partitioning and sharding, consistent hashing, queues and event streaming, distributed transactions (Saga, Outbox), unique IDs, consensus and distributed locks, rate limiting, search, storage and CDNs, observability, and full case studies (URL shortener, news feed, chat, notification service, e-commerce checkout, file storage, ride booking) with the HLD interview framework.
---

# Overview

**High-Level Design (HLD)** describes a system as boxes and arrows: clients, load balancers, services, databases, caches, queues, storage, and how data flows between them. Low-Level Design (LLD) zooms into one box: classes, interfaces, methods, database tables (next course). System design interviews are mostly HLD for experienced roles, with some LLD.

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
| 2007 | Amazon Dynamo paper: eventual consistency, consistent hashing |
| 2008–2012 | Cloud (AWS 2006, Azure 2010); NoSQL (Cassandra, MongoDB, Redis); Kafka (2011) |
| 2012–2015 | Microservices, Docker (2013), Kubernetes (2014); Google Spanner (globally consistent SQL) |
| 2016–2020 | Serverless, managed databases, service meshes, CQRS/event sourcing popular |
| 2020s | Modular monoliths come back for many teams; vector databases and AI workloads; platform engineering |

# Lifecycle

**The HLD interview framework (≈45 minutes):**

1. **Requirements (5 min)**: functional (what users do) and non-functional (scale, latency, availability, consistency, security). Agree on what's out of scope.
2. **Estimation (5 min)**: users, requests/second, read:write ratio, storage per year, bandwidth.
3. **API design (5 min)**: main endpoints with inputs/outputs.
4. **Data model (5 min)**: main entities, choose SQL vs NoSQL, keys and indexes.
5. **High-level diagram (10 min)**: client → CDN → load balancer → services → cache/DB/queue/storage.
6. **Deep dive (10 min)**: 1–2 hard parts the interviewer cares about (feed generation, hot keys, consistency, sharding).
7. **Wrap-up (5 min)**: bottlenecks, failure scenarios, monitoring, how it evolves at 10× scale.

# Tools

- **Diagramming:** draw.io / diagrams.net, Excalidraw, Lucidchart, Miro, C4 model (context → container → component → code), PlantUML / Mermaid.
- **Estimation:** latency numbers, powers of two, a calculator.
- **Reading:** *Designing Data-Intensive Applications* (Kleppmann), *System Design Interview* (Alex Xu), High Scalability blog, engineering blogs (Netflix, Uber, Stripe, Microsoft), Azure Architecture Center, AWS Well-Architected.

# Module: Fundamentals

## Lesson: [Basic|High] How a web request travels: DNS, load balancer, servers and database

Every system design diagram is a more detailed version of one path: a user's device sends a request, something finds the right server, the server does some work with data, and a response comes back. Learn this path first and every later topic (caching, sharding, queues) is just "what we add to this path, and why".

```text
Browser / app
  │ 1. DNS: "shop.example.com" → 20.50.10.7
  ▼
CDN edge (static files, images)            ← answers directly if it has a copy
  │ 2. HTTPS request
  ▼
Load balancer                              ← picks a healthy server
  │
  ▼
App servers (stateless, 2..N copies)       ← business logic
  │            │
  ▼            ▼
Cache (Redis)  Database (SQL)              ← data
```

| Step | What happens | Typical time |
|---|---|---|
| DNS lookup | The name is turned into an IP address; answers are cached for the record's TTL | 0 ms (cached) to ~50 ms |
| TCP + TLS handshake | A secure connection is set up; reused afterwards (keep-alive) | 1–3 network round trips |
| Load balancer | Chooses a server that passes health checks | < 1 ms |
| App server | Validates input, runs logic, calls cache/database | 5–50 ms |
| Database | Finds rows through indexes, returns results | 1–20 ms for indexed queries |

### How it works

A **client** never talks to "the server" directly in a real system. DNS can return different addresses per region, a CDN answers requests for images and scripts from a location close to the user, and a load balancer spreads the remaining requests over several identical app servers. Because any server can receive any request, the servers must be **stateless**: anything that must survive between requests (the logged-in user, the shopping cart) lives in a token, a cache or the database.

The database is usually the hardest part to scale, because it holds the state. That is why so many techniques in this course exist to protect it: caches in front of it, read replicas next to it, queues that smooth out writes, and sharding when one machine is no longer enough.

### Common mistakes

- Drawing one server and one database and calling it done. Ask "what happens when this box dies?" for every box.
- Keeping user sessions in server memory. Then a user is logged out whenever the load balancer sends them to another server.
- Forgetting the network. A call between two services in the same data centre takes around half a millisecond; a call across continents takes 100+ ms. Ten chained calls add up.
- Putting large files (images, videos) through the app servers and into the database instead of object storage and a CDN.

### Real-world example

When you open a product page in an online shop, the HTML may come from the app servers, but the product photos come from a CDN, the price and stock come from Redis (refreshed from SQL), and the "customers also bought" list comes from a separate recommendation service. Each piece has its own path, and the page still loads if the recommendation service is down; that box just stays empty.

### Try it yourself

1. Run `nslookup` (or `dig`) on a large website and on your own site, and compare the answers.
2. Open the browser's Network tab on a shopping site and find which requests go to a CDN and which go to the main API.
3. Draw the request path for "log in and view my orders" in a system you know, and mark which boxes keep state.

## Lesson: [Basic|High] Requirements and back-of-the-envelope estimation

**Functional requirements**: features: "users post photos", "followers see a feed", "users like and comment".
**Non-functional requirements**: qualities: availability (99.9 % = ~8.8 h downtime/year; 99.99 % = ~53 min), latency (p99 < 200 ms), throughput, durability, consistency, security, cost.

**Useful numbers:**

| Fact | Value |
|---|---|
| Seconds per day | ~86,400 ≈ 10⁵ |
| 1 million requests/day | ≈ 12 requests/second average |
| Peak factor | 2–10× average |
| 1 KB × 1 million | 1 GB |
| Memory read / SSD read / same-DC round trip / cross-continent | 100 ns / 100 µs / 0.5 ms / 150 ms |

**Example: photo sharing app:** 50M daily active users, each views 20 photos and uploads 0.1 per day.

- Reads: 50M × 20 / 86,400 ≈ **11,600 requests/s** (peak ~50k/s) → heavy read caching + CDN.
- Writes: 50M × 0.1 / 86,400 ≈ **58 uploads/s**.
- Storage: 5M photos/day × 500 KB ≈ **2.5 TB/day** → ~900 TB/year → object storage, not a database.
- Read:write ≈ 200:1 → optimise for reads.

### How it works

Requirements decide the design, so the first five minutes matter most. Functional requirements say *what* the system does; non-functional requirements say *how well* it must do it, and they drive almost every technical choice. "Users can post photos" is easy; "for 50 million users, with the feed loading in under 200 ms, 99.95% of the time" is what forces caches, CDNs and replicas.

Estimation is not about exact numbers. Being within a factor of ten tells you which world you are in: 10 requests a second fits one server and one database; 50,000 needs caching, many servers and probably several databases. Always separate **reads** from **writes** and **average** from **peak**, because they lead to different decisions.

### Common mistakes

- Jumping to Kafka and microservices before asking how many users there are.
- Ignoring peak traffic. A shop with 100 orders a minute on average may get 5,000 a minute when a sale starts.
- Forgetting growth: storage that is fine today may need 10 times more in three years.
- Spending ten minutes on arithmetic. Round aggressively (a day ≈ 100,000 seconds) and move on.

### Real-world example

A team planned a reporting system for "all events from our IoT devices". Estimating first showed 20,000 devices × 1 event per second ≈ 20,000 writes per second and about 1.7 billion rows a day. That ruled out a single SQL table straight away and led them to an event stream plus a time-series store, before any code was written.

### Try it yourself

1. Estimate requests per second, storage per year and read:write ratio for a food delivery app with 2 million daily users.
2. Write three functional and three non-functional requirements for a video streaming service.
3. Work out how much downtime per month 99.9% and 99.99% availability allow.

## Lesson: [Basic|High] Scalability, availability, latency and throughput

| Term | Meaning |
|---|---|
| **Scalability** | Handle more load by adding resources |
| Vertical scaling (scale up) | Bigger machine: simple, limited, single point of failure |
| Horizontal scaling (scale out) | More machines: needs stateless services and data partitioning |
| **Availability** | % of time the system works; achieved by redundancy (no single point of failure) |
| **Reliability** | Works correctly (no data loss, correct results) |
| **Latency** | Time for one request (measure p50, p95, p99, not the average) |
| **Throughput** | Requests handled per second |
| **Durability** | Data survives failures (replication, backups) |

Stateless services are the key to horizontal scaling: keep session/state in Redis, a database or the client token, so any instance can serve any request.

**Availability in series and parallel:** two components each 99.9 % in series → 99.8 %; two redundant copies of a 99 % component in parallel → 99.99 %.

### How it works

Scaling means finding the bottleneck and removing it, one at a time. Stateless app servers scale horizontally just by adding copies behind a load balancer. State is harder: a database can scale up (bigger machine), add read replicas for reads, and finally shard for writes. Availability comes from **redundancy**: two of everything, in different failure zones, with automatic failover, so no single failure stops the system.

Latency should be measured as percentiles. If the average is 80 ms but p99 is 2 seconds, one request in a hundred is painfully slow, and a page that makes 20 calls will hit that slow case for most users.

### Common mistakes

- Reporting average latency only. Averages hide the slow tail that users actually complain about.
- Adding servers when the database is the bottleneck. More app servers just send more queries to the same overloaded database.
- Calling something highly available when all copies are in one data centre or depend on one shared component (one Redis, one DNS provider).
- Making every request do everything synchronously. Moving slow work (emails, reports) to background jobs lowers latency and increases throughput.

### Real-world example

A ticket-selling site handled normal days on two servers. On sale days it auto-scaled to forty app servers, but the checkout still failed because every server hit one SQL database. Caching the event pages, putting buyers in a waiting-room queue and moving seat reservations to a fast conditional update fixed the real bottleneck.

### Try it yourself

1. Calculate the availability of a system with a load balancer (99.99%), two app servers in parallel (99.9% each) and one database (99.95%) in series.
2. Find p50, p95 and p99 latency for one endpoint in your project's logs or Application Insights.
3. List every single point of failure in a system you know.

## Lesson: [Intermediate|High] CAP theorem, consistency models and PACELC

**CAP:** in a distributed data store, when a network partition happens you must choose between Consistency (every read sees the latest write) and Availability (every request gets a response). Partitions are unavoidable, so the real choice is CP vs AP during failures.

| Choice | Behaviour during partition | Examples |
|---|---|---|
| CP | Refuse/timeout some requests to stay consistent | Banking ledgers, SQL with synchronous replication, ZooKeeper, etcd |
| AP | Answer with possibly stale data, reconcile later | Social feeds, shopping carts, DNS, Cassandra, DynamoDB (default) |

**PACELC:** if Partition → choose A or C; Else (normal operation) → choose Latency or Consistency. Synchronous replication = more consistency, more latency.

**Consistency models:** strong (linearizable) → read-your-writes → monotonic reads → causal → eventual (replicas converge eventually). Choose per feature: payment balance strong; like counts eventual.

**ACID vs BASE:** ACID (Atomicity, Consistency, Isolation, Durability), relational transactions. BASE (Basically Available, Soft state, Eventually consistent): many NoSQL systems.

### How it works

When the network between two replicas breaks, a replica that gets a write has two options: accept it (stay **available**, but the other replica now has old data) or refuse it until the link is back (stay **consistent**, but some users get errors). CAP just names that choice. PACELC adds the everyday case: even with no failure, waiting for every replica to confirm a write (consistency) is slower than confirming after one (latency).

Most real systems mix models per feature, not per database. The same app can use strong consistency for the account balance and eventual consistency for the "people also viewed" list.

### Common mistakes

- Saying "we pick CA". In a distributed system partitions happen, so the choice is only what to do when they do.
- Treating eventual consistency as "sometimes wrong". It means "briefly stale, then correct", and the app must be designed for it (for example, show the user their own new post even before it reaches every replica).
- Reading from a replica right after a write and showing old data to the person who made the change. Route that user's reads to the primary for a few seconds (read-your-writes).
- Using strong consistency for everything, then wondering why global latency is high.

### Real-world example

A shopping cart is often AP: if two data centres briefly disagree, the cart merges both versions and the customer may see an item they removed reappear, which they can remove again. The payment for that cart is CP: if the payment service can't confirm the charge with the ledger, it refuses and asks the customer to try again, because charging twice is far worse than a short error.

### Try it yourself

1. For a banking app, a social network and a ride-hailing app, mark each main feature as needing strong or eventual consistency.
2. Explain read-your-writes with an example from a social app.
3. Describe what a user would see in an AP and in a CP chat system during a network split.

# Module: Building Blocks

## Lesson: [Intermediate|High] Load balancing and API gateways

Clients → **DNS** (can balance across regions: Azure Traffic Manager/Front Door) → load balancer (L4 or L7) → service instances. Algorithms: round robin, least connections, consistent hashing (sticky by user/key), weighted. Health checks remove failed instances. Load balancers themselves are redundant (active-passive pairs or managed cloud services).

An **API gateway** adds authentication, rate limiting, request routing to microservices, response aggregation and API versioning (Azure API Management, YARP, Kong).

### How it works

An **L4** load balancer works with IP addresses and TCP connections and doesn't read the request; it is very fast and protocol-agnostic. An **L7** load balancer reads HTTP: it can route `/api/*` to one service and `/images/*` to another, terminate TLS, add headers and do cookie-based stickiness. Health checks call an endpoint such as `/health` every few seconds and remove instances that stop answering, which is what makes a group of servers behave like one reliable service.

An API gateway sits at the edge for many services and handles the cross-cutting work every service would otherwise repeat: checking tokens, rate limits, request logging and routing to the right backend.

### Common mistakes

- Sticky sessions as a substitute for stateless servers. When a sticky server dies, its users lose their sessions, and load gets uneven.
- Health checks that only return "OK" without checking dependencies, or that check *every* dependency, so one slow database takes all instances out at once. Keep a light liveness check and a separate readiness check.
- Putting business logic in the gateway. It becomes a hard-to-test monolith in front of your microservices.
- Forgetting that the load balancer and gateway need redundancy too.

### Real-world example

Azure Front Door routes users to the nearest region; in each region an Application Gateway (L7) sends traffic to a Kubernetes cluster, where the ingress controller routes paths to services. When one region fails its health probes, Front Door sends everyone to the other region within a minute or two, and users mostly see a slower page rather than an error.

### Try it yourself

1. Run two copies of a small API on different ports and put YARP or Nginx in front with round robin.
2. Stop one copy and see how quickly the health check removes it.
3. Add path-based routing so `/api/orders` and `/api/products` go to different backends.

## Lesson: [Intermediate|High] API design for system design: REST, gRPC, GraphQL and real-time

In a design interview the API is where requirements become concrete. Writing three or four endpoints with their inputs and outputs forces you to decide what the system actually does, and it shapes the data model that follows.

| Style | How it works | Best for | Watch out |
|---|---|---|---|
| **REST** over HTTP + JSON | Resources and HTTP methods: `GET /orders/42` | Public APIs, web and mobile apps, most CRUD | Several calls to build one screen |
| **gRPC** | Contract in `.proto`, binary Protobuf over HTTP/2, generated clients | Fast internal service-to-service calls, streaming | Not usable from browsers without gRPC-Web |
| **GraphQL** | One endpoint; the client asks for exactly the fields it needs | Many client types with different data needs | N+1 queries on the server, caching is harder, query cost limits needed |
| **WebSockets / SSE** | Long-lived connection; server pushes data | Chat, live dashboards, notifications | Connection state to manage and scale |
| **Webhooks** | Your system calls the client's URL when an event happens | Integrations (payments, shipping) | Retries, signatures, ordering |

**Example: API for a URL shortener**

```text
POST /api/v1/links          { "url": "https://...", "alias": "sale24" }   → 201 { "code": "sale24", "shortUrl": "https://sho.rt/sale24" }
GET  /{code}                                                              → 302 Location: https://...
GET  /api/v1/links/{code}/stats?from=2026-11-01                           → 200 { "clicks": 1204, "byCountry": {...} }
```

### How it works

A good API hides the internals. Clients see resources and operations, not tables, so you can split a service, add a cache or change the database without breaking them. Three properties matter at scale. **Pagination** keeps responses small: cursor-based (`?after=abc123`) stays fast deep into a list, unlike page numbers. **Idempotency** makes retries safe: a client resends a `POST` with the same `Idempotency-Key` and gets the original result instead of a duplicate. **Versioning** lets old and new clients coexist while you change the contract.

### Common mistakes

- Designing endpoints around screens ("getHomePageData") so every UI change needs an API change.
- No pagination on list endpoints. They work in testing and time out once a customer has 200,000 rows.
- Chatty APIs: a mobile screen that needs 12 calls over a slow network. Add an aggregate endpoint or a backend-for-frontend.
- Choosing GraphQL or gRPC because they are popular, without a client or performance need that REST can't meet.

### Real-world example

Many companies use all of these together. The mobile app talks REST to an API gateway, internal services call each other over gRPC, the web dashboard gets live order updates over WebSockets, and partners receive webhooks when an order ships. Each style is used at the edge where it fits.

### Try it yourself

1. Write the API (method, path, request, response, status codes) for a hotel booking system: search rooms, hold a room, pay, cancel.
2. Mark which of your endpoints need an idempotency key and which need pagination.
3. Explain in two sentences why you would or wouldn't use GraphQL for that system.

## Lesson: [Intermediate|High] Caching: where, strategies and pitfalls

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

**Eviction policies:** LRU (least recently used, most common), LFU, FIFO, TTL expiry.

**Pitfalls and fixes:**

| Problem | Fix |
|---|---|
| Stale data | Short TTL, delete key on update, versioned keys |
| **Cache stampede** (many requests miss at once and hit the DB) | Lock/single-flight per key (`HybridCache` does this), early refresh, jittered TTLs |
| **Hot key** (one key gets huge traffic) | Local in-memory copy, replicate the key, split it |
| Cache penetration (requests for keys that don't exist) | Cache "not found" briefly, Bloom filter |
| Cold start after restart | Warm up popular keys |

### How it works

A cache works because access is uneven: a small share of the data (the top products, today's news) gets most of the reads. Keeping that share in memory answers most requests in under a millisecond and keeps the database for the rest. The **hit ratio** (hits ÷ all reads) tells you if a cache is earning its place; a cache with a 20% hit ratio adds complexity and saves little.

The hard part is not reading, it is keeping the cache correct when data changes. Deleting the key on every write (then letting the next read refill it) is usually safer than updating it, because two concurrent updates can leave the cache holding the older value.

### Common mistakes

- Caching without a TTL, so a missed invalidation leaves wrong data forever.
- The same TTL on millions of keys created at once, which then all expire together and stampede the database. Add random jitter.
- Caching personalised data under a shared key.
- Treating the cache as the source of truth. Redis can be flushed or fail over; the system must work (slower) without it.

### Real-world example

A news site caches each article for 60 seconds at the CDN and 5 minutes in Redis. When a breaking story goes viral, the CDN absorbs almost all traffic, Redis handles the rest, and the database sees a handful of queries per minute for that article. When an editor fixes a typo, the CMS purges that one URL from the CDN and deletes the Redis key.

### Try it yourself

1. Add cache-aside with Redis to a slow endpoint and log the hit ratio.
2. Simulate a stampede: expire a hot key while 200 requests run, then fix it with a lock or `HybridCache`.
3. Decide TTLs for: product price, product description, user profile, home page banner.

## Lesson: [Intermediate|High] Choosing the database: SQL vs NoSQL

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

Default: **start with a relational database** unless a specific need (massive scale for simple access patterns, flexible schema, special query type) points elsewhere. Many systems are polyglot: SQL for transactions + Redis + Blob + search index.

### How it works

Start from the **access patterns**: what the main queries are, how often they run, and how much data they touch. Relational databases are flexible: you can ask new questions with joins and indexes long after the schema was designed, and transactions keep related changes correct. Many NoSQL stores are built for one access pattern at huge scale: look up by key, write time-ordered events fast, or store self-contained documents. They scale out more easily, but questions you didn't plan for can be slow or impossible.

### Common mistakes

- Choosing MongoDB "because the schema might change". SQL handles schema changes well with migrations, and the data usually has a structure anyway.
- Choosing Cassandra or DynamoDB, then needing ad-hoc reports and joins. Plan an export to a warehouse for analytics.
- Storing images and files in the database instead of object storage.
- Splitting into several databases before one well-indexed relational database has actually run out of capacity.

### Real-world example

An e-commerce company keeps orders, payments and stock in Azure SQL (transactions matter), product descriptions and attributes in Cosmos DB (flexible per category, read-heavy, global), sessions and carts in Redis, search in Azure AI Search, and images in Blob Storage. Each store handles the job it is best at, and change events keep the search index and caches in sync.

### Try it yourself

1. For a hospital system, choose a database type for patient records, appointment slots, device telemetry and scanned documents, and justify each.
2. Model "users follow users" in SQL and as a graph, and write the query for "friends of friends" in both.
3. List three questions a key-value store can't answer efficiently that SQL can.

## Lesson: [Advanced|High] Replication, partitioning, sharding and consistent hashing

**Replication**: copies of data on several nodes:

| Type | How | Trade-off |
|---|---|---|
| Leader–follower (primary–replica) | Writes to primary; replicas copy changes; reads can go to replicas | Replication lag → stale reads; failover needed |
| Multi-leader | Several nodes accept writes (multi-region) | Write conflicts to resolve |
| Leaderless (quorum) | Write to W nodes, read from R nodes, W + R > N for consistency | Tunable, complex |

Synchronous replication = no data loss on failover but slower writes; asynchronous = faster but may lose the last seconds. SQL Server: Always On availability groups; Azure SQL: geo-replication and read replicas.

**Partitioning / sharding**: split data across nodes so each holds a part:

| Method | How | Watch out |
|---|---|---|
| Range | By key range (A–M, N–Z; dates) | Hot ranges (all new orders go to the latest partition) |
| Hash | `hash(key) % N` | Resharding moves almost everything when N changes |
| **Consistent hashing** | Nodes and keys on a hash ring; key goes to the next node clockwise; virtual nodes balance load | Adding a node moves only ~1/N of keys: used by Dynamo, Cassandra, distributed caches |
| Directory/lookup | A service maps key → shard | Extra lookup, flexible |

Choose a shard key that spreads load evenly and keeps related data together (e.g. `CustomerId` for orders). Cross-shard queries and transactions become expensive: design around the main access pattern.

### How it works

Replication and sharding solve different problems. **Replication** copies the same data to several nodes: it gives availability (another copy takes over) and read capacity (reads spread across replicas), but every write still goes to every copy. **Sharding** splits the data so each node holds a different part: it is the way to scale **writes** and storage beyond one machine.

With plain `hash(key) % N`, changing N from 4 to 5 moves about 80% of keys to a new node. Consistent hashing places nodes and keys on a ring, so adding a node only moves the keys between it and its neighbour, about 1/N of the data. Virtual nodes (each server appears many times on the ring) keep the load even.

### Common mistakes

- Sharding by a key that concentrates traffic, like date (all writes go to today's shard) or country (one country has most users).
- Sharding too early. It makes every cross-shard query, join and transaction harder; read replicas and caching often go a long way first.
- Reading from replicas for data the user just changed, and showing stale results.
- No plan for **resharding**: moving data between shards while the system runs is a project, so choose a scheme that supports it.

### Real-world example

A multi-tenant SaaS product shards by `TenantId`: each tenant's data lives in one shard, so almost all queries stay inside one database and need no cross-shard joins. A small directory table maps tenants to shards. When one huge customer outgrows a shared shard, it is moved to its own database by updating its directory row after copying its data.

### Try it yourself

1. Implement a consistent hash ring with virtual nodes in C# and measure how many keys move when you add a fifth node.
2. Choose a shard key for: chat messages, e-commerce orders, IoT readings. Explain the hot-spot risk of each.
3. Draw what happens to reads and writes when the primary of a leader-follower pair fails.

## Lesson: [Intermediate|High] Queues, event streaming and asynchronous processing

| | Message queue | Event stream (log) |
|---|---|---|
| Examples | RabbitMQ, Azure Service Bus, SQS | Kafka, Azure Event Hubs, Kinesis |
| Consumption | Message removed after processing; competing consumers | Messages kept for days; each consumer group tracks its offset; replay possible |
| Ordering | Per queue/session | Per partition |
| Use | Background jobs, commands, decoupling services | Analytics, event sourcing, IoT, activity tracking, CDC |

Benefits: **decoupling** (producer doesn't wait for the consumer), load levelling (absorb spikes), reliability (retry, dead-letter queue), fan-out (many subscribers). Design consumers to be idempotent (at-least-once delivery). Use the outbox pattern to publish events reliably with database changes.

### How it works

A queue lets a producer hand off work and move on. The API puts "send receipt for order 42" on a queue and returns in milliseconds; a worker picks it up and does the slow part. If the email provider is down, messages wait in the queue and are retried, and after several failures they go to a **dead-letter queue** for someone to inspect. If traffic spikes, the queue grows and workers catch up, instead of the API falling over.

An event stream is a durable, ordered log. Consumers read at their own pace and remember their position (offset), and a new consumer can start from the beginning to rebuild its data. Ordering is guaranteed only inside one partition, so events that must stay in order (all events for one order) share a partition key.

### Common mistakes

- Assuming each message is delivered exactly once. Plan for duplicates and make handlers idempotent.
- Using a queue for something the user is waiting for, then polling for the answer. If the user needs the result now, call the service directly.
- Ignoring the dead-letter queue until it holds 2 million messages.
- Putting huge payloads in messages. Store the file in blob storage and send its reference.

### Real-world example

When a customer uploads a video, the API stores the file in blob storage, writes a database row and publishes `VideoUploaded`. Separate consumers create thumbnails, transcode to several resolutions, scan for banned content and update search. Each scales on its own, and a failure in thumbnailing doesn't block transcoding.

### Try it yourself

1. Build a producer and a worker with Azure Service Bus, RabbitMQ or a `Channel<T>`, and make the worker fail every fifth message to see retries.
2. Make the worker idempotent by storing processed message ids.
3. Explain when you'd choose a queue and when an event stream for: order emails, website click tracking, nightly invoice generation.

## Lesson: [Advanced|High] Distributed transactions: two-phase commit, Saga and the Outbox pattern

Inside one database a transaction makes several changes all-or-nothing. Once an operation spans several services, each with its own database, there is no single transaction any more. "Charge the card, reserve the stock, create the shipment" can fail halfway, and the system must still end up in a correct state.

| Approach | How | Strength | Weakness |
|---|---|---|---|
| **Two-phase commit (2PC)** | A coordinator asks every participant to *prepare*; if all say yes, it tells them to *commit* | Real atomicity across databases | Slow, holds locks while waiting, blocks if the coordinator fails; most cloud services and message brokers don't support it |
| **Saga (orchestration)** | A central workflow calls each step and, on failure, runs compensating steps in reverse | Clear flow in one place, easy to monitor | The orchestrator is one more service to build |
| **Saga (choreography)** | Each service listens for events and publishes the next one | No central coordinator, loose coupling | The flow is spread across services and hard to follow |
| **Outbox pattern** | Save the business change *and* the event in the same local transaction; a worker publishes the event afterwards | Never "saved but forgot to publish" | Consumers may see the event twice, so they must be idempotent |

```text
Order service (one SQL transaction):
  INSERT INTO Orders (...)                    ┐ commit together
  INSERT INTO Outbox (Type='OrderPlaced', ...) ┘
Outbox worker: read unpublished rows → publish to Service Bus → mark as sent
Payment service: OrderPlaced → charge card → publish PaymentSucceeded / PaymentFailed
Inventory service: PaymentFailed → release reserved stock (compensation)
```

### How it works

A Saga accepts that the system is briefly inconsistent (an order can be "pending" while payment runs) and makes every step either succeed or be undone by a **compensating action**: refund the payment, release the stock, cancel the shipment. Compensations are business operations, not database rollbacks, so a refund appears in the customer's statement. The Outbox pattern makes each step reliable: the event is stored in the same transaction as the data, so a crash can delay the event but never lose it.

### Common mistakes

- Publishing to the message broker *after* committing the database transaction, without an outbox. A crash between the two leaves an order that no other service ever hears about.
- Forgetting that messages are delivered **at least once**. A consumer that charges a card on every `OrderPlaced` message will charge twice when a message is redelivered. Store processed message ids.
- Steps that can't be compensated (an email already sent, goods already shipped). Put them last, after everything that can fail.
- Using 2PC across microservices because it feels familiar; it ties all services' availability together.

### Real-world example

A travel site books a flight, a hotel and a car. The booking orchestrator (for example Azure Durable Functions or a workflow engine such as Temporal) calls each provider in turn. When the car rental fails, it cancels the hotel and the flight, then tells the customer "the car wasn't available, nothing was charged". Every step and compensation is logged, so support can see exactly what happened.

### Try it yourself

1. Write the steps and compensating actions for "place order → charge card → reserve stock → book courier".
2. Design an `Outbox` table (columns, indexes) and the worker loop that publishes and marks rows.
3. Describe how a consumer detects and ignores a message it has already processed.

## Lesson: [Advanced|High] Unique IDs, consensus, leader election and distributed locks

Once a system runs on many machines, simple things get hard: giving every new row a unique id without a central counter, agreeing which node is in charge, and making sure only one worker runs a job at a time.

**Unique ID options**

| Option | Size | Sortable by time | Notes |
|---|---|---|---|
| Database `IDENTITY` / sequence | 4–8 bytes | Yes | Simple; one database is the bottleneck and ids reveal volume |
| UUID v4 (random) | 16 bytes | No | Generated anywhere; random inserts fragment B-tree indexes |
| UUID v7 / ULID | 16 bytes | Yes | Time prefix + random part; index-friendly and generated anywhere |
| **Snowflake-style** | 8 bytes | Yes | 41 bits milliseconds + 10 bits machine id + 12 bits sequence = up to 4,096 ids per ms per machine |

**Consensus** lets a group of nodes agree on a value (who the leader is, the order of writes) even if some nodes fail. Raft and Paxos are the common algorithms; etcd, ZooKeeper and Consul implement them so you don't have to. They need a **majority**: 3 nodes survive 1 failure, 5 nodes survive 2.

**Distributed lock with Redis (simplified)**

```text
SET lock:invoice-run <random-token> NX PX 30000   → OK = you hold the lock for 30 s
... do the work, finish before the lock expires ...
Release only if the value is still your token (Lua script compares then deletes)
```

### How it works

Leader election is consensus applied to one question: "who is in charge right now?". Nodes vote, a candidate that gets a majority becomes leader for a numbered **term**, and if it stops sending heartbeats the others elect a new one. Because a majority is required, two halves of a split network can't both elect a leader. Kubernetes, Kafka and SQL Server availability groups all rely on this idea to pick one primary.

A lock in a distributed system is really a **lease**: it expires, because the holder might crash and never release it. That means a slow holder can lose the lock while it still thinks it has it. Safe designs pass a **fencing token** (an increasing number) with every write, so the storage can reject writes from an old lock holder.

### Common mistakes

- Using timestamps as unique ids. Two requests in the same millisecond, or a clock that jumps backwards, produce duplicates.
- Running consensus with 2 or 4 nodes. 2 nodes can't survive any failure with a majority, and 4 survive no more failures than 3.
- Trusting a Redis lock for correctness-critical work (money, inventory) without fencing tokens or a database constraint behind it.
- Building your own consensus algorithm. Use etcd, ZooKeeper, Consul, or your database's built-in features.

### Real-world example

A scheduler runs on 3 instances for availability, but the "send monthly invoices" job must run once. Each instance tries to take a lease row in SQL (`UPDATE Leases SET Owner = @me, ExpiresAt = ... WHERE Name = 'invoices' AND ExpiresAt < SYSUTCDATETIME()`). The one whose update affects a row runs the job and renews the lease every 10 seconds; if it crashes, another instance takes over within 30 seconds. Invoice rows also have a unique constraint on `(CustomerId, Month)`, so even a double run can't bill anyone twice.

### Try it yourself

1. Write a Snowflake-style id generator in C# and check that 1 million ids are unique and increasing.
2. Implement the SQL lease above and run two copies of a console app to see only one take the lease.
3. Explain, with a timeline, how a slow worker can still write after its lock expired, and how a fencing token stops it.

## Lesson: [Intermediate|Medium] Rate limiting, search, storage and CDNs

**Rate limiting algorithms:**

| Algorithm | Idea |
|---|---|
| Fixed window | Count requests per minute window: simple, bursty at edges |
| Sliding window log/counter | Smoother limit over a moving window |
| **Token bucket** | Tokens refill at a rate; each request takes one; allows short bursts: most common |
| Leaky bucket | Requests leave at a constant rate: smooths traffic |

Distributed rate limiting keeps counters in Redis (atomic `INCR` with expiry or Lua scripts). ASP.NET Core has `AddRateLimiter` with fixed window, sliding window, token bucket and concurrency limiters; return **429** with `Retry-After`.

**Search:** an inverted index (word → documents) in Elasticsearch/Azure AI Search, fed asynchronously from the database (change events); supports full text, typo tolerance, facets and ranking.

**Files and media:** store in object storage (Blob/S3), keep only metadata + URL in the database, upload directly from the client with pre-signed/SAS URLs, serve through a CDN, process asynchronously (thumbnails, virus scan, transcoding) via a queue.

### How it works

A **rate limiter** protects a system from overload and abuse by counting requests per client (user, API key or IP) and rejecting extras with `429`. With many API servers the counters must be shared, usually in Redis with atomic operations, or enforced at the gateway. A **search engine** keeps an inverted index (word → list of documents), which is why it can find "red leather shoes" among millions of products in milliseconds where SQL `LIKE '%red%'` would scan everything. A **CDN** keeps copies of static content in data centres near users, so a user in Mumbai gets images from Mumbai instead of from a server in Virginia.

### Common mistakes

- Rate limiting only by IP. Many users behind one office or mobile carrier share an IP, and attackers rotate IPs. Combine IP, user and API-key limits.
- Treating the search index as the source of truth. It is a copy that can lag or be rebuilt; the database owns the data.
- Serving user uploads through your API servers instead of signed URLs to object storage.
- Long CDN cache times on files whose names don't change, so a fix takes hours to reach users. Put a version or hash in file names.

### Real-world example

A public weather API allows 1,000 calls a day on the free plan, enforced at Azure API Management with a key per customer. Map tiles (static images) come from a CDN with a one-week cache, because their URLs include a version. The location search box uses an Elasticsearch index rebuilt every night from the cities database, with typo tolerance so "Bangalor" still finds Bangalore.

### Try it yourself

1. Implement a token bucket in C# and test it with bursts of requests.
2. Upload a file to blob storage from a browser using a SAS (pre-signed) URL, without the file passing through your API.
3. Compare `LIKE '%term%'` on 1 million rows with SQL Server full-text search or a small Elasticsearch index.

# Module: Case Studies

## Lesson: [Intermediate|High] Case study: URL shortener

A URL shortener is the classic first design question because it is small enough to finish in 45 minutes but touches estimation, API design, id generation, caching, redirects and analytics.

**Requirements**

- Functional: create a short link for a long URL (optional custom alias and expiry); visiting the short link redirects; the owner sees click counts.
- Non-functional: redirects in < 50 ms, very high availability (a broken link breaks someone's campaign), links never collide.

**Estimation**

| Item | Calculation | Result |
|---|---|---|
| New links | 100M per month ÷ (30 × 86,400) | ≈ 40 writes/s |
| Redirects | 100:1 read:write | ≈ 4,000 reads/s, peak ~20k/s |
| Storage | 100M × 12 months × 5 years × ~500 bytes | ≈ 3 TB |
| Code length | 62 characters (a–z, A–Z, 0–9), 7 characters | 62⁷ ≈ 3.5 trillion codes |

**Design**

```text
Create:   Client → API → ID generator (Snowflake / range per server) → base62(id) → Links table (Code PK, LongUrl, OwnerId, ExpiresAt)
Redirect: Client → CDN/edge → Redirect service → Redis (code → URL) → on miss: Links table → 301/302
Clicks:   Redirect service → queue / event stream (code, time, country, referrer) → analytics workers → aggregated counts
```

### How it works

The short code is just a unique number written in base 62. A central counter would be a bottleneck, so each API server either generates Snowflake-style ids or takes a **range** of ids at a time (server A gets 1–10,000, server B 10,001–20,000) from a small coordination table. Converting the id to base 62 gives a short, collision-free code with no "does it exist?" check. Custom aliases are the exception: they are inserted with a unique constraint and rejected if taken.

Redirects are almost pure reads of data that never changes, so they are cached aggressively in Redis and even at the edge. The choice of status code matters: **301** (permanent) lets browsers cache the redirect, cutting load but hiding repeat clicks from your analytics; **302** (temporary) sends every click through your servers so you can count it.

### Common mistakes

- Hashing the long URL (MD5) and taking the first 7 characters. Different URLs can produce the same prefix, so you need collision checks anyway.
- Writing a click row to the main database on every redirect. At 20,000 redirects a second, analytics would take the database down. Send clicks to a queue and aggregate.
- Sequential, guessable codes for private links. Anyone can step through them; add randomness or a longer code for private links.
- Forgetting abuse: shortened links are used to hide phishing and malware, so scan URLs and support takedowns.

### Real-world example

Marketing teams create a short link for a TV advert and a QR code on posters. In the first minute after the advert airs, traffic jumps to 50 times normal. Because redirects are served from Redis and the edge, and click events go to a queue, the spike costs little more than extra queue messages, and the stats dashboard catches up a few seconds later.

### Try it yourself

1. Write `Encode(long id)` and `Decode(string code)` for base 62 in C# and test them on 10,000 random ids.
2. Build the redirect endpoint with an in-memory cache and measure how many redirects a second it serves.
3. Extend the design so a link can expire and so its owner can see clicks per day for the last 30 days.

## Lesson: [Advanced|High] Case study: news feed (social timeline)

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

### How it works

The feed is a read-heavy problem: people open their feed far more often than they post. Fan-out on write does the work once at post time, so each feed read is a single fast lookup of a precomputed list. The catch is accounts with millions of followers: one post would trigger millions of writes. The hybrid model treats those few accounts differently, merging their recent posts in at read time, so neither path explodes.

The feed list holds only **post ids**. Post content, author names and like counts are fetched ("hydrated") from caches, so edits and deletions show up everywhere without rewriting millions of feed lists.

### Common mistakes

- Building the feed with one big SQL query over all followed users' posts on every request. It works for a demo and collapses at scale.
- Storing full post content in every follower's feed list, so an edit means millions of updates.
- Offset pagination on a feed that changes every second, which gives repeated or skipped posts. Use a cursor (last seen post id or timestamp).
- Exact real-time like counts on viral posts, which turn one row into a hot spot. Count in memory and write in batches.

### Real-world example

Large social networks keep roughly the last few hundred post ids per active user in an in-memory store, and rebuild a feed from scratch for users who haven't logged in for weeks, instead of maintaining feeds for inactive accounts. That cuts fan-out work dramatically, because most followers of a popular account are not active on a given day.

### Try it yourself

1. Estimate the writes per second for fan-out on write if 10 million users post twice a day and have 200 followers on average.
2. Pick a follower threshold for "celebrity" accounts and explain how you'd tune it.
3. Design the cursor format for the feed API and show two pages of requests and responses.

## Lesson: [Advanced|High] Case study: chat / messaging system

**Requirements:** 1:1 and group chat, online presence, delivery/read receipts, message history, push notifications when offline.

- **Connections:** WebSockets (SignalR in .NET) to chat servers; a connection registry (Redis) maps user → server.
- **Send flow:** sender → chat server → persist message (store sorted by conversation + time; wide-column DB or SQL partitioned by conversation) → look up recipient's server → deliver over its WebSocket; if offline → push notification service (APNs/FCM) via a queue.
- **Ordering:** per-conversation sequence numbers; client de-duplicates by message id.
- **Groups:** fan-out to members (small groups) or members pull (large channels).
- **Presence:** heartbeats with TTL in Redis; publish presence changes only to contacts.
- **Scale:** chat servers scale horizontally; a pub/sub backplane (Redis / Azure SignalR Service) routes messages between servers.

### How it works

Chat is about long-lived connections and ordering. Each client keeps a WebSocket open to one chat server, and a registry (often Redis) records which server each online user is connected to. Sending a message means: persist it first (so it is never lost), give it a sequence number within the conversation, then deliver it to every recipient's server, or to the push-notification service if the recipient is offline. Clients acknowledge receipt, which drives the "delivered" and "read" ticks.

Messages are stored by conversation and time because the main query is "the latest 50 messages in this chat", which a wide-column store or a partitioned SQL table answers well.

### Common mistakes

- Ordering messages by the client's clock. Phones have wrong clocks; use a server-assigned sequence per conversation.
- Delivering before persisting, so a crash loses messages the sender thinks were sent.
- Sending presence updates ("online", "typing") to everyone. Send them only to people who have that chat open.
- Treating a 50,000-member channel like a 5-person group. Large channels need pull or broadcast fan-out, not one write per member.

### Real-world example

A customer support chat in a banking app uses SignalR with Azure SignalR Service, so the app servers don't hold connections themselves. Messages are written to SQL partitioned by conversation, agents get new chats through a queue, and when the customer closes the app, the next reply arrives as a push notification. When an app server restarts, clients reconnect automatically and fetch messages after their last sequence number.

### Try it yourself

1. Build a two-user chat with SignalR and store messages with a per-conversation sequence number.
2. Make the client fetch missed messages after reconnecting, using the last sequence it saw.
3. Estimate storage per year for 10 million users sending 40 messages a day of 100 bytes each.

## Lesson: [Advanced|High] Case study: e-commerce checkout and inventory

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

### How it works

Checkout combines a few places that need strict correctness (stock, payment, the order itself) with many that only need to be fast and roughly right (catalogue, recommendations, reviews). Overselling is prevented by making the database do the check and the update in one atomic statement: the conditional `UPDATE ... WHERE Qty >= @n` either succeeds or affects zero rows, even with thousands of buyers at the same moment. Everything after the order is created runs as a Saga driven by events, so a slow email service never blocks the next customer.

### Common mistakes

- Reading the stock, checking it in code, then writing it back. Two buyers read "1 left" at the same time and both buy it.
- Charging the card before reserving stock, then having to refund when the item is gone. Reserve first, charge second, confirm last.
- No idempotency on "Place order", so a double-click or a mobile retry creates two orders and two charges.
- Letting a flash sale hit the main catalogue database directly. Cache product pages and put buyers through a queue.

### Real-world example

During a limited sneaker drop, a shop puts all visitors into a virtual waiting room that lets in a few hundred people a minute. Product pages are fully cached, stock is reserved with a conditional update, and unpaid reservations are released after 10 minutes by a scheduled job. The sale sells out in minutes, with no overselling and no site outage.

### Try it yourself

1. Write the conditional stock update in SQL and test it with 50 concurrent requests for 10 items.
2. Draw the Saga for order → payment → stock confirm → shipping, including each compensation.
3. Add an idempotency key to a "place order" endpoint and test it by sending the same request twice.

## Lesson: [Advanced|Medium] Case studies: notification service, file storage and ride booking (outlines)

**Notification service:** API receives "notify user X with template T" → validates preferences (opt-outs, quiet hours) → queues per channel (email, SMS, push) → workers call providers (SendGrid, Twilio, FCM) with retries and dead-letter queues → delivery status stored; rate limits per user; templates and localisation; idempotency keys to avoid duplicate sends.

**File storage (like Dropbox/OneDrive):** files split into chunks (e.g. 4 MB) with hashes → upload only changed chunks (deduplication) directly to object storage via signed URLs → metadata service (SQL) stores file tree, versions, chunk lists → sync service notifies other devices (long polling/WebSockets) → CDN for downloads; conflict handling with versions.

**Ride booking (like Uber):** drivers send location every few seconds → location service stores latest positions in an in-memory geo index (geohash/quadtree, Redis GEO) → rider requests a ride → matching service finds nearby available drivers and offers the trip → trip service manages state machine (requested → accepted → started → completed) → pricing (surge) and payment services → events to analytics. Strong consistency on assigning one driver per trip (conditional update/lock), eventual elsewhere.

### How it works

These three designs reuse the same building blocks in different proportions. The notification service is a **queue-and-worker** system: fan out by channel, retry each provider independently and respect user preferences. File storage is mostly **metadata plus object storage**: chunking means a small edit uploads a few megabytes instead of the whole file, and hashes let identical chunks be stored once. Ride booking is a **real-time geo** problem: millions of location updates go to an in-memory index, and only the trip assignment needs a strongly consistent, atomic write.

### Common mistakes

- Sending notifications synchronously from the API that triggered them, so a slow SMS provider slows down checkout.
- Storing whole files again on every save in a file-sync system.
- Writing every driver location update to a relational database; keep the latest position in memory and archive the history in bulk.
- Assigning a driver with read-then-write logic, so two riders get the same driver.

### Real-world example

A food-delivery company uses all three patterns: rider and driver locations in Redis GEO, order and payment events in a queue that drives SMS and push notifications ("your food is on its way"), and restaurant menu photos uploaded straight to blob storage through signed URLs and served by a CDN.

### Try it yourself

1. Choose one of the three systems and write its full requirements, estimation and API, following the URL shortener lesson.
2. For ride booking, store driver positions with Redis `GEOADD` and find drivers within 2 km with `GEOSEARCH`.
3. For notifications, design the table that stores user preferences and quiet hours.

# Module: Operating Large Systems

## Lesson: [Intermediate|Medium] Reliability, observability and disaster recovery

- **Redundancy everywhere:** multiple instances, availability zones, replicated databases, no single point of failure.
- **Failure handling:** timeouts, retries with backoff + jitter, circuit breakers, bulkheads, graceful degradation (show cached data), health checks.
- **Observability:** logs, metrics (golden signals: latency, traffic, errors, saturation), distributed traces; SLOs and alerts on symptoms users feel.
- **Deployments:** blue-green, canary releases, feature flags, automatic rollback.
- **Disaster recovery:** RPO (how much data you can lose) and RTO (how long you can be down) drive the design, backups (RPO hours), async geo-replication (minutes), sync replication (zero); regular restore drills.
- **Security:** authentication at the edge, least privilege between services, encryption in transit and at rest, secrets in a vault, WAF, DDoS protection.

### How it works

Failures are normal in large systems: disks die, deploys go wrong, a dependency slows down. Reliable systems **contain** failures instead of preventing all of them. Timeouts stop a slow call from tying up threads, circuit breakers stop sending requests to a dependency that is failing, bulkheads give each dependency its own limited pool so one can't use all the resources, and graceful degradation shows something useful (cached data, a smaller page) instead of an error.

Observability is how you find out what is happening without logging into servers: metrics tell you *that* something is wrong, traces tell you *where*, and logs tell you *why*. SLOs (for example "99.9% of checkout requests succeed in under 1 second over 30 days") turn that data into a clear signal for when to act.

### Common mistakes

- Backups that have never been restored. A backup only counts once a restore has been tested.
- Alerting on every CPU spike instead of on what users feel (errors, latency), so people learn to ignore alerts.
- Retries without backoff and jitter, which turn a small outage into a self-made overload ("retry storm").
- A disaster-recovery plan that depends on the failed region (scripts, secrets or DNS hosted there).

### Real-world example

During a cloud region incident, a company's status page stayed green because its checks ran in the same region. Afterwards they moved synthetic checks to two other regions, set SLO-based alerts on checkout success rate, rehearsed failover every quarter, and measured a real RTO of 20 minutes and RPO of under 1 minute with geo-replication.

### Try it yourself

1. Define two SLOs for an API you know and the alert that fires when each is at risk.
2. Add OpenTelemetry tracing to two services that call each other and follow one request in Jaeger or Application Insights.
3. Write an RPO and RTO for a small business system and choose a backup or replication setup that meets them.

# Interview

## [Beginner|High] What is the difference between HLD and LLD?

HLD shows the architecture of the whole system: components (clients, load balancers, services, databases, caches, queues, CDN), how they interact, data flow, scaling and failure handling. LLD details the inside of components: classes, interfaces, methods, design patterns, database tables and APIs. HLD answers "what pieces and how they connect"; LLD answers "how each piece is built".

## [Beginner|High] Vertical vs horizontal scaling?

Vertical: give one machine more CPU/RAM, simple, no code change, but limited and a single point of failure. Horizontal: add more machines behind a load balancer, almost unlimited and fault tolerant, but services must be stateless and data must be replicated/partitioned. Typical path: scale up first, then out.

## [Beginner|High] What is caching? Explain cache-aside.

Storing frequently read data in faster storage (memory/Redis/CDN) to reduce latency and database load. Cache-aside: on read, check the cache; on miss, read from the database and put the result in the cache with a TTL; on write, update the database and delete (or update) the cache key. Watch for stale data, stampedes and hot keys.

## [Beginner|High] What does a load balancer do?

Distributes requests across multiple servers to increase capacity and availability, performs health checks to stop sending traffic to failed servers, and can terminate TLS and route by URL (L7). Algorithms: round robin, least connections, IP hash/consistent hashing, weighted.

## [Intermediate|High] Explain the CAP theorem with examples.

In a distributed system, during a network partition you can't have both strong consistency and full availability. CP systems reject or delay requests to avoid stale data (bank balances, configuration stores like etcd); AP systems keep answering and reconcile later (social feeds, DNS, carts in Dynamo-style stores). When there is no partition, the trade-off is latency vs consistency (PACELC).

## [Intermediate|High] SQL or NoSQL: how do you choose?

Start from the data and access patterns. SQL for structured, related data needing transactions, joins and constraints (orders, payments). NoSQL when you need massive horizontal scale for simple key-based access, flexible schemas, very high write throughput, or special models (documents, graphs, time-series). Many systems combine them: SQL as the source of truth, Redis cache, search index, blob storage.

## [Intermediate|High] What is sharding? How do you choose a shard key?

Splitting a dataset horizontally across multiple database nodes so each stores a subset, increasing capacity and throughput. A good shard key has high cardinality, spreads reads and writes evenly (no hot shard) and matches the main query pattern so most queries hit one shard (e.g. customer id for orders). Use consistent hashing or a directory to allow adding shards with minimal data movement.

## [Intermediate|High] What is consistent hashing and why is it useful?

Nodes and keys are placed on a hash ring; each key belongs to the next node clockwise. When a node is added or removed, only the keys between it and its neighbour move (~1/N of keys), unlike `hash % N` where almost all keys move. Virtual nodes (many points per server) spread load evenly. Used in distributed caches and databases (Dynamo, Cassandra) and load balancers.

## [Intermediate|High] Why use a message queue in system design?

To decouple services (the producer doesn't wait for or depend on the consumer being up), absorb traffic spikes (load levelling), process work asynchronously (emails, video encoding), retry failures with dead-letter queues, and fan out events to multiple subscribers. Consumers must be idempotent because delivery is at-least-once.

## [Intermediate|Medium] Replication: synchronous vs asynchronous?

Synchronous: the write is acknowledged only after replicas confirm, no data loss on failover but higher latency and reduced availability if a replica is slow. Asynchronous: acknowledge after the primary writes, fast, but replicas lag (stale reads) and recent writes can be lost if the primary fails. Many systems use sync within a region and async across regions.

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
