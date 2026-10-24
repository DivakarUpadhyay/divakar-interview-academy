---
slug: azure-databases
title: Azure Databases — Azure SQL, Managed Instance, Cosmos DB, PostgreSQL and Migration
track: devops-cloud
order: 7
group: Azure & CI/CD
icon: AzDB
color: #0078d4
summary: Choosing a database on Azure; Azure SQL Database (single database, elastic pools, DTU vs vCore, General Purpose / Business Critical / Hyperscale, serverless), Azure SQL Managed Instance and SQL Server on Azure VMs; security (firewall, private endpoints, Microsoft Entra authentication, managed identity, TDE, Always Encrypted, auditing), high availability, geo-replication, failover groups and backups/point-in-time restore; performance (Query Store, automatic tuning, Intelligent Insights); Cosmos DB (APIs, partition keys, RU/s, consistency levels), Azure Database for PostgreSQL/MySQL, Azure Cache for Redis; migrating on-premises SQL Server (DMA, Azure Database Migration Service) and cost optimisation.
---

# Overview

| Service | Type | Choose when |
|---|---|---|
| **Azure SQL Database** | PaaS, one database (or elastic pool) | New cloud apps on SQL Server — no server to manage |
| **Azure SQL Managed Instance** | PaaS, near-100 % SQL Server instance compatibility | Lift-and-shift of on-prem SQL Server using SQL Agent, cross-database queries, CLR, Service Broker, linked servers |
| **SQL Server on Azure VM** | IaaS | Need full OS/instance control, SSRS/SSIS/SSAS on the same box, unsupported features |
| **Azure Cosmos DB** | Globally distributed NoSQL (multi-API) | Massive scale, single-digit-ms reads, flexible JSON, multi-region writes |
| Azure Database for **PostgreSQL** (Flexible Server) / **MySQL** | Managed open-source databases | Apps built for Postgres/MySQL |
| **Azure Cache for Redis** / Azure Managed Redis | In-memory cache | Caching, sessions, leaderboards |
| Azure Synapse / Microsoft Fabric warehouse | Analytics | Data warehousing and BI at scale |

Azure SQL Database runs the **same SQL Server engine** (always the latest version), so T-SQL skills transfer directly — but some instance-level features differ (no SQL Agent in single databases — use Elastic Jobs/Azure Functions/Logic Apps; no cross-database queries without elastic query; no `USE` to switch databases).

# Versions

| Year | Milestone |
|---|---|
| 2010 | SQL Azure (first cloud SQL Server service) |
| 2014–2016 | Azure SQL Database service tiers (Basic/Standard/Premium, DTU), elastic pools, geo-replication, Query Store, TDE by default |
| 2017 | Cosmos DB (from DocumentDB), Azure Database for PostgreSQL/MySQL |
| 2018 | **SQL Managed Instance** GA, vCore purchasing model, **Hyperscale** preview |
| 2019 | **Serverless** compute tier, Hyperscale GA |
| 2020–2022 | Azure SQL "family" branding, ledger, Azure AD-only auth, Cosmos DB serverless and autoscale |
| 2023–2024 | Managed Instance next-gen General Purpose, free Azure SQL Database offer (per subscription), Hyperscale price reductions, vector search previews |
| 2025 | Native vector type and JSON type in Azure SQL, SQL database in Microsoft Fabric, Cosmos DB vector search GA |

# Lifecycle

**Moving a .NET app's database to Azure SQL:**

1. **Assess** the on-prem database (Azure Migrate / Data Migration Assistant / SQL Server migration extension in Azure Data Studio's successor tools) for compatibility and target size.
2. **Choose the target**: Azure SQL Database (new/modern apps), Managed Instance (instance features), VM (full control).
3. **Provision** with Bicep/Terraform/CLI: logical server, database, service tier, networking (private endpoint), Entra admin.
4. **Migrate** schema + data: Azure Database Migration Service (online/offline), BACPAC import, transactional replication or log shipping (MI link) for minimal downtime.
5. **Switch the app**: new connection string (managed identity), retry logic for transient faults, test performance.
6. **Operate**: monitoring (Azure Monitor, Query Store), automatic tuning, alerts, backups/PITR, geo-replication/failover groups, cost reviews.

# Tools

- Azure Portal, Azure CLI (`az sql`), PowerShell (`Az.Sql`), Bicep/Terraform.
- SSMS, VS Code MSSQL extension, `sqlcmd` / `sqlpackage` (BACPAC/DACPAC), SQL database projects (SDK-style) for schema CI/CD.
- Azure Database Migration Service, Azure Migrate, Data Migration Assistant.
- Monitoring: Query Performance Insight, Query Store, Azure Monitor metrics/alerts, Database Watcher, Defender for SQL.
- Cosmos DB: Data Explorer, .NET SDK v3, Cosmos DB emulator.

# Module: Azure SQL

## Lesson: [Basic|High] Azure SQL Database, Managed Instance and SQL on VM — choosing

| | Azure SQL Database | SQL Managed Instance | SQL Server on Azure VM |
|---|---|---|---|
| Model | PaaS database | PaaS instance | IaaS |
| Compatibility | Database-scoped features | Near-full instance features (SQL Agent, cross-DB queries, CLR, DB Mail, linked servers) | 100 % |
| Patching, backups, HA | Automatic | Automatic | You (with helpers like SQL IaaS Agent extension) |
| Networking | Public endpoint + firewall or private endpoint | Inside your VNet | Your VNet |
| Max size | Up to 4 TB (GP/BC), 128 TB Hyperscale | Up to 16 TB (instance storage) | Disk limits |
| Typical use | New apps, SaaS (database per tenant), microservices | Migrating many existing databases with minimal change | Legacy apps, SSRS/SSIS on the same server, special configs |

**A logical server** (`myserver.database.windows.net`) is just a management/connection endpoint holding logins, firewall rules and Entra admin — databases on it are independent.

## Lesson: [Intermediate|High] Purchasing models and service tiers — DTU, vCore, serverless, Hyperscale, elastic pools

| Model | What you buy |
|---|---|
| **DTU** (Basic, Standard, Premium) | A bundled measure of CPU + memory + I/O — simple, older |
| **vCore** | Choose CPU cores, memory and storage separately; Azure Hybrid Benefit to reuse SQL Server licences; reserved capacity discounts |

| vCore tier | Storage & HA | Use |
|---|---|---|
| **General Purpose** | Remote premium storage, standby compute takes over on failure | Most business workloads |
| **Business Critical** | Local SSD, Always On replicas (incl. a free readable secondary), lowest latency | High I/O OLTP, low latency, read scale-out |
| **Hyperscale** | Distributed storage up to 128 TB, fast backups/restores, up to 4 read replicas (named replicas too) | Large or fast-growing databases |

**Serverless** (General Purpose / Hyperscale): compute auto-scales between min and max vCores and can **auto-pause** when idle (GP) — you pay per second of compute used. Great for dev/test and intermittent workloads; first query after pause has a resume delay.

**Elastic pools:** many databases share a pool of resources — ideal for SaaS with a database per tenant where each tenant's usage peaks at different times.

## Lesson: [Intermediate|High] Security — networking, Entra authentication, managed identity, encryption, auditing

**Network:** server-level and database-level **firewall rules** (allowed IP ranges), "Allow Azure services" switch (broad — prefer narrower options), **private endpoints** (database gets a private IP in your VNet; public access disabled), VNet service endpoints.

**Authentication:** SQL logins, or **Microsoft Entra ID** users/groups and **managed identities** (recommended — no passwords). Entra-only authentication can be enforced.

```sql
-- In the user database, as the Entra admin: create a user for the App Service's managed identity
CREATE USER [shop-api-prod] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [shop-api-prod];
ALTER ROLE db_datawriter ADD MEMBER [shop-api-prod];
```

```json
// appsettings.json in the App Service — no password anywhere
"ConnectionStrings": { "Shop": "Server=tcp:shop-sql.database.windows.net,1433;Database=Shop;Authentication=Active Directory Default;Encrypt=True;" }
```

`Active Directory Default` uses the managed identity in Azure and your Visual Studio/Azure CLI login locally (via `DefaultAzureCredential`).

**Data protection:**

| Feature | Protects |
|---|---|
| TLS (Encrypt=True) | Data in transit |
| **TDE** (Transparent Data Encryption) — on by default | Data files and backups at rest (service-managed or customer-managed keys in Key Vault) |
| **Always Encrypted** (with secure enclaves) | Sensitive columns encrypted in the client driver — even DBAs can't see plaintext |
| Dynamic Data Masking | Hides values from non-privileged users in query results (not encryption) |
| Row-Level Security | Users see only their rows (multi-tenant filters) |
| Auditing, Microsoft Defender for SQL | Audit logs, vulnerability assessment, threat detection (SQL injection, unusual access) |
| Ledger | Tamper-evident tables |

## Lesson: [Intermediate|High] High availability, geo-replication, failover groups and backups

- **Built-in HA:** every database has an availability SLA (99.99 %; up to 99.995 % with zone redundancy on Business Critical/Premium). Replicas/standby compute handle hardware failures automatically — apps must **retry transient errors** during failovers.
- **Zone redundancy:** replicas spread across availability zones in the region.
- **Active geo-replication:** up to 4 readable secondaries in other regions (single database).
- **Failover groups:** group of databases replicated to another region with a **listener endpoint** (`shop-fg.database.windows.net` read-write, `shop-fg.secondary...` read-only) — connection strings don't change after failover.
- **Backups:** automatic full (weekly), differential (12–24 h) and log backups (every ~5–10 min); **point-in-time restore (PITR)** within the retention period (1–35 days); **long-term retention (LTR)** up to 10 years; geo-redundant backup storage for **geo-restore**.
- **RPO/RTO:** geo-replication gives RPO of seconds; PITR is for "oops, someone deleted data" (restores to a new database).

```bash
az sql db restore --resource-group rg-shop --server shop-sql --name Shop --dest-name Shop_restored --time "2026-10-24T09:30:00Z"
```

```csharp
// EF Core: retry transient faults (failovers, throttling)
options.UseSqlServer(cs, sql => sql.EnableRetryOnFailure(maxRetryCount: 6, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null));
```

## Lesson: [Intermediate|Medium] Performance monitoring and tuning in Azure SQL

- **Query Store** — on by default: top resource-consuming queries, regressed plans, plan forcing.
- **Automatic tuning** — `FORCE_LAST_GOOD_PLAN` (on by default), optional automatic `CREATE INDEX`/`DROP INDEX` recommendations.
- **Query Performance Insight** and **Intelligent Insights** in the portal; Azure Monitor metrics (CPU %, Data IO %, Log IO %, DTU/vCore usage, deadlocks, connection failures, storage).
- DMVs work as on-prem (`sys.dm_exec_requests`, `sys.dm_db_resource_stats` for the last hour at 15-second granularity).
- Typical fixes are the same as SQL Server (indexes, SARGable queries, parameter sniffing) — plus **right-sizing** the tier, read scale-out for reports (`ApplicationIntent=ReadOnly`), and connection pooling (many short-lived connections from serverless functions can exhaust limits).
- **Resource limits:** each tier caps CPU, I/O, log rate, workers and sessions — "throttling" shows up as `LOG_RATE_GOVERNOR`, `RESOURCE_SEMAPHORE` waits or error 10928/10936 (worker/session limits).

# Module: Other Azure Data Services

## Lesson: [Intermediate|High] Azure Cosmos DB — APIs, partitioning, RU/s and consistency

**Cosmos DB** is a globally distributed, multi-model NoSQL database with single-digit-millisecond latency and automatic indexing.

| API | Model |
|---|---|
| **NoSQL (core)** | JSON documents queried with a SQL-like language — most common, newest features |
| MongoDB (RU or vCore) | Use MongoDB drivers |
| Cassandra, Gremlin (graph), Table | Compatibility with those ecosystems |
| PostgreSQL (Citus) | Distributed PostgreSQL |

**Key concepts:**

- **Account → database → container → items** (JSON documents).
- **Partition key** — chooses how data is spread across physical partitions. Pick a property with **high cardinality** and even access (e.g. `/customerId`, `/tenantId`); queries that include the partition key are cheap, cross-partition queries cost more. A **hot partition** limits throughput.
- **Request Units (RU/s)** — the currency of throughput: a 1 KB point read ≈ 1 RU; writes and queries cost more. Provisioned (manual or **autoscale**) or **serverless** (pay per RU consumed).
- **Consistency levels** (strongest → weakest): **Strong**, **Bounded staleness**, **Session** (default — read-your-own-writes per session), **Consistent prefix**, **Eventual**. Weaker = lower latency and cost, higher availability.
- **Global distribution:** add regions with one click, optional multi-region writes, automatic failover.
- **Change feed** — ordered stream of changes for event-driven processing (Azure Functions trigger), materialised views, sync to search.

```csharp
var client = new CosmosClient(endpoint, new DefaultAzureCredential());
var container = client.GetContainer("shop", "orders");                       // partition key /customerId
await container.CreateItemAsync(new { id = Guid.NewGuid().ToString(), customerId = "c42", total = 4500 }, new PartitionKey("c42"));
var order = await container.ReadItemAsync<Order>("order-id", new PartitionKey("c42"));   // point read: cheapest
var query = container.GetItemQueryIterator<Order>(new QueryDefinition("SELECT * FROM o WHERE o.customerId = @c AND o.total > 1000")
    .WithParameter("@c", "c42"));
```

## Lesson: [Intermediate|Medium] Azure Database for PostgreSQL/MySQL, Azure Cache for Redis and choosing storage

- **Azure Database for PostgreSQL – Flexible Server / MySQL – Flexible Server:** managed open-source engines with zone-redundant HA, automated backups/PITR, read replicas, stop/start to save cost, extensions (PostGIS, pgvector).
- **Azure Cache for Redis / Azure Managed Redis:** in-memory key-value store — cache-aside for DB queries, session state, distributed locks, rate limiting, pub/sub. Use with `IDistributedCache`/`HybridCache` in ASP.NET Core.
- **Azure Storage:** Blob (files, images, backups), Table (simple key-value), Queue; **Azure Data Lake Storage Gen2** for analytics.
- **Azure Data Explorer / Fabric Real-Time Intelligence:** time-series and log analytics with KQL (IoT, telemetry).

| Data | Store |
|---|---|
| Orders, invoices, inventory (relational, transactions) | Azure SQL |
| Product catalog, user profiles at global scale | Cosmos DB |
| Images, PDFs, exports | Blob Storage |
| Cache, sessions | Redis |
| Telemetry, logs | Data Explorer / Log Analytics |
| BI warehouse | Fabric / Synapse |

# Module: Migration and Cost

## Lesson: [Advanced|High] Migrating on-premises SQL Server to Azure

| Method | Downtime | Notes |
|---|---|---|
| **Azure Database Migration Service** (offline/online) | Offline: hours; online: minutes | Assessment + migration orchestration; online uses continuous sync then cutover |
| BACPAC export/import (`sqlpackage`) | Hours (size-dependent) | Simple for small databases into Azure SQL Database |
| Backup to URL + restore (Managed Instance) | Restore time | Native `.bak` restore to MI |
| **Managed Instance link** / log replay service | Minimal | Near real-time replication to MI, then failover |
| Transactional replication | Minimal | Publisher on-prem → subscriber in Azure SQL Database |

**Pre-migration checklist:** compatibility assessment (unsupported features: cross-database queries, SQL Agent jobs, CLR, linked servers, Windows logins), size and performance baseline (choose tier from actual CPU/IO), network path (VPN/ExpressRoute), application changes (connection strings, retry logic, Entra auth), jobs moved to Elastic Jobs/Functions, SSIS to Azure Data Factory (SSIS integration runtime), reports to Power BI or SSRS on a VM, test restore and rollback plan.

## Lesson: [Intermediate|Medium] Cost optimisation for Azure databases

- Right-size from metrics (many databases are over-provisioned); scale down at night with automation for non-production.
- **Serverless** for dev/test and intermittent workloads (auto-pause).
- **Elastic pools** for many small databases with uneven usage.
- **Reserved capacity** (1 or 3 years) and **Azure Hybrid Benefit** for steady production workloads.
- Read replicas for reporting instead of scaling the primary.
- Cosmos DB: choose a good partition key (fewer RUs), autoscale or serverless, index only needed paths, use point reads.
- Delete unused databases/backups; set LTR policies deliberately; monitor with Cost Management budgets and alerts.

# Interview

## [Beginner|High] Azure SQL Database vs Managed Instance vs SQL Server on a VM?

Azure SQL Database is a fully managed single database (or elastic pool) — best for new cloud apps, with database-scoped features. Managed Instance is a fully managed SQL Server instance in your VNet with near-complete compatibility (SQL Agent, cross-database queries, CLR, linked servers) — best for lift-and-shift migrations. SQL Server on an Azure VM is IaaS with full control and 100 % compatibility but you manage patching, backups and HA.

## [Beginner|High] What is the difference between DTU and vCore models?

DTU bundles CPU, memory and I/O into one measure with fixed tiers (Basic, Standard, Premium) — simple but less flexible. vCore lets you choose cores, memory and storage independently, pick hardware generations and tiers (General Purpose, Business Critical, Hyperscale), use serverless compute, and save with Azure Hybrid Benefit and reserved capacity. Most new deployments use vCore.

## [Beginner|High] How do you connect an App Service to Azure SQL without storing a password?

Enable a managed identity on the App Service, set an Entra admin on the SQL server, create a contained database user `FROM EXTERNAL PROVIDER` for the identity and grant roles, and use a connection string with `Authentication=Active Directory Default` (or Managed Identity). Locally the same code uses your developer login through DefaultAzureCredential.

## [Intermediate|High] What are failover groups and how are they different from active geo-replication?

Active geo-replication replicates a single database to up to four readable secondaries in other regions, and failover is per database with connection strings pointing to specific servers. Failover groups manage a group of databases (or a whole managed instance) together and provide stable listener endpoints for read-write and read-only traffic that follow the primary after failover, so applications don't need connection-string changes. Failover can be automatic or manual.

## [Intermediate|High] How does backup and restore work in Azure SQL Database?

Backups are automatic: weekly full, differential every 12–24 hours and log backups every 5–10 minutes, stored in geo-redundant (or zone/locally redundant) storage. You can restore to any point in time within the retention period (1–35 days) as a new database, keep long-term retention backups up to 10 years, and geo-restore to another region if the primary region is unavailable.

## [Intermediate|High] What is a partition key in Cosmos DB and how do you choose it?

The property used to distribute items across logical and physical partitions; all items with the same value form a logical partition (max 20 GB). Choose a key with high cardinality and evenly spread reads/writes that is present in most queries (e.g. customerId, tenantId, deviceId) — so queries hit one partition and throughput isn't limited by a hot partition. It can't be changed later without migrating data.

## [Intermediate|High] What are Request Units (RU/s) and consistency levels in Cosmos DB?

RUs are the normalised cost of operations (CPU, IO, memory): a 1 KB point read ≈ 1 RU, writes and queries cost more; you provision RU/s (manual/autoscale) or pay per RU in serverless. Consistency levels trade latency/availability for freshness: Strong, Bounded staleness, Session (default, read-your-writes), Consistent prefix and Eventual.

## [Intermediate|Medium] What is serverless compute in Azure SQL Database?

A compute tier that automatically scales vCores between a minimum and maximum based on load and bills per second of compute used; in General Purpose it can auto-pause after an idle period, charging only for storage, and resumes on the next connection (with a short delay). Ideal for dev/test and intermittent workloads, not for latency-sensitive always-on production.

## [Intermediate|Medium] How do you secure Azure SQL Database?

Private endpoints and disabled public access (or tight firewall rules), Entra-only authentication with managed identities, least-privilege database roles, TDE (on by default) and TLS, Always Encrypted for highly sensitive columns, Row-Level Security for tenant isolation, Dynamic Data Masking for non-privileged users, auditing to Log Analytics, Microsoft Defender for SQL, and secrets (if any) in Key Vault.

## [Advanced|Medium] What is Hyperscale and when would you use it?

A vCore service tier with a distributed architecture separating compute, page servers and log service, supporting databases up to 128 TB with near-constant-time backups and fast restores, rapid scale up/down, and up to four HA replicas plus named read replicas. Use it for large or fast-growing OLTP databases and mixed workloads needing read scale-out.

## [Advanced|Medium] Why must applications use retry logic with Azure SQL?

Cloud databases have transient faults: failovers during maintenance or hardware failure, load balancing, throttling when resource limits are hit (errors such as 40613, 40501, 40197, 10928). A short retry with exponential backoff (EF Core `EnableRetryOnFailure`, Polly, SqlClient configurable retry logic) makes these invisible to users; make operations idempotent so retries are safe.

## [Intermediate|Medium] What is an elastic pool and when should you not use it?

A shared pool of compute (vCores or eDTUs) and storage used by many Azure SQL databases, each scaling within per-database min/max limits — cost-effective when databases have low average and uneven peak usage (SaaS database-per-tenant). Avoid it when databases peak at the same time or one database needs consistently high resources — that database belongs in its own single database or a separate pool.

## [Scenario|High] You need to migrate a 500 GB on-prem SQL Server database with SQL Agent jobs and cross-database queries to Azure with minimal downtime. What do you choose?

Azure SQL Managed Instance, because it supports SQL Agent and cross-database queries. Assess with the migration tools, provision MI in a VNet connected by VPN/ExpressRoute, use the online migration (Database Migration Service or the MI link/log replay) to keep the target in sync, test the application against MI, then cut over during a short window by stopping writes, completing the sync and switching connection strings.

## [Scenario|High] An Azure SQL database is at 100 % CPU after a release. What do you do?

Check Query Store/Query Performance Insight for the top CPU queries and regressed plans; force the last good plan (or rely on automatic tuning) as an immediate fix; fix the query/indexes (missing index, non-SARGable predicate, parameter sniffing); temporarily scale up the tier if users are impacted; add caching or read replicas for heavy reads; set alerts on CPU and log IO for early warning.

## [Scenario|Medium] A multi-tenant SaaS has 300 small customer databases with different peak times. How do you host them cost-effectively?

Put them in one or more elastic pools so they share a pool of vCores/eDTUs sized for combined peak, not each database's peak; monitor per-database usage and move noisy tenants to their own database or pool; use Elastic Jobs for schema updates across all databases and a catalog database to map tenants to databases.

# Cheatsheet

## Choose the service

New app → Azure SQL Database · lift-and-shift with Agent/cross-DB → Managed Instance · full control/SSRS on box → SQL VM · global NoSQL → Cosmos DB · Postgres/MySQL → Flexible Server · cache → Redis.

## Azure SQL tiers

DTU (Basic/Standard/Premium) or vCore (General Purpose, Business Critical, Hyperscale) · serverless (auto-scale, auto-pause) · elastic pools (many DBs) · Hybrid Benefit + reservations.

## Security

Private endpoint · Entra-only auth + managed identity (`Authentication=Active Directory Default`) · TDE · Always Encrypted · RLS · auditing · Defender for SQL.

## HA/DR

Built-in HA (99.99 %) · zone redundancy · geo-replication · failover groups (listener endpoints) · PITR 1–35 days · LTR up to 10 years · geo-restore · retry transient faults.

## Cosmos DB

Partition key (high cardinality, in queries) · RU/s (autoscale/serverless) · consistency: Strong → Bounded → Session (default) → Prefix → Eventual · change feed · point reads cheapest.
