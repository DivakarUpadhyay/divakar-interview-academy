---
slug: azure
title: Microsoft Azure for .NET Developers
track: devops-cloud
order: 4
icon: Az
color: #0089d6
summary: Cloud models, Azure hierarchy and regions, App Service, Functions, Container Apps, AKS, Storage, Azure SQL, Cosmos DB, Service Bus, Event Grid, Event Hubs, Key Vault, Entra ID, managed identities, API Management, networking, monitoring, cost, security and architecture.
---

# Overview

**Microsoft Azure** is Microsoft's cloud platform (launched as Windows Azure in 2010, renamed in 2014) with 200+ services across compute, data, integration, AI, security and DevOps, in 60+ regions worldwide (including Central India, South India, West India and others).

Cloud service models:

| Model | You manage | Azure manages | Examples |
|---|---|---|---|
| **IaaS** | OS, runtime, app, data | Hardware, virtualisation | Virtual Machines, VM Scale Sets |
| **PaaS** | App and data | OS, patching, runtime, scaling | App Service, Azure SQL, Functions, Container Apps |
| **SaaS** | Just use it | Everything | Microsoft 365, Dynamics 365 |
| Serverless | Code/functions | Infrastructure, scaling to zero | Functions, Logic Apps, Container Apps |

Deployment models: public, private, hybrid (Azure Arc, Azure Stack), multi-cloud.

**AZ-204** (Developing Solutions for Microsoft Azure) is the developer certification that maps closely to this course; AZ-900 covers fundamentals; AZ-305 covers architecture.

# Versions

Azure is continuously updated rather than versioned. Key milestones:

| Year | Milestone |
|---|---|
| 2008 | "Project Red Dog" announced at PDC |
| 2010 | **Windows Azure** GA (Cloud Services, Storage, SQL Azure) |
| 2012 | IaaS VMs, Websites (later App Service) |
| 2014 | Renamed **Microsoft Azure**; Azure Resource Manager (ARM) preview |
| 2016 | Azure Functions GA; ARM becomes the standard model |
| 2017 | Cosmos DB (from DocumentDB); AKS preview (GA 2018) |
| 2019 | Azure Arc |
| 2020 | Bicep project starts (v0.3 production-ready 2021) |
| 2021 | Azure Container Apps preview (GA 2022) |
| 2023 | Azure OpenAI Service GA; Microsoft Fabric GA; Entra ID rename |
| 2024–2025 | Azure AI Foundry, Flex Consumption plan for Functions, .NET Aspire integration, Azure Developer CLI updates |

Cloud Services (classic) were retired in **August 2024**; the classic deployment model and Azure AD Graph were retired too — always use ARM-based resources.

# Lifecycle

**Azure resource hierarchy:** Microsoft Entra tenant → **Management groups** → **Subscriptions** (billing and access boundary) → **Resource groups** (lifecycle container — deploy, manage and delete together) → **Resources**.

**Resource lifecycle:** plan (region, SKU, naming, tags) → provision via **ARM** (portal, CLI, PowerShell, Bicep/Terraform) → configure (identity, networking, scaling) → deploy app → monitor (Azure Monitor, alerts) → scale/optimise → update/patch (PaaS: automatic) → decommission (delete resource group).

**Request flow for a typical web app:** user → Azure Front Door (global CDN, WAF) → App Service / Container Apps (behind private networking) → app reads secrets from Key Vault with a **managed identity** → Azure SQL / Cosmos DB through private endpoints → events to Service Bus → background processing by Functions → telemetry to Application Insights.

**Azure Well-Architected Framework** pillars: **Reliability, Security, Cost Optimization, Operational Excellence, Performance Efficiency**.

# Tools

| Tool | Use |
|---|---|
| Azure portal | Web UI |
| **Azure CLI** (`az`) / Azure PowerShell (`Az` module) | Scripting |
| **Azure Developer CLI** (`azd`) | Templates, provision + deploy (`azd up`) |
| Bicep / ARM templates / Terraform | Infrastructure as code |
| Visual Studio / VS Code Azure extensions | Publish, debug, Azure Functions Core Tools |
| Azure SDK for .NET (`Azure.*` packages), `Azure.Identity` (`DefaultAzureCredential`) | Code access to services |
| Azurite | Local Storage emulator |
| Cosmos DB emulator, Service Bus emulator | Local development |
| Azure Storage Explorer | Browse blobs, queues, tables |
| Azure Monitor, Application Insights, Log Analytics (KQL) | Observability |
| Azure Advisor, Cost Management, Azure Pricing Calculator | Optimisation and cost |
| Microsoft Defender for Cloud, Azure Policy | Security posture and governance |
| .NET Aspire (Aspire) | Local orchestration + Azure deployment for .NET apps |

# Module: Fundamentals

## Lesson: [Basic|High] Regions, availability zones and the resource hierarchy

- **Region** — a set of datacenters in a geography (e.g. Central India — Pune). Choose for latency, data residency, service availability, price.
- **Availability zones** — physically separate datacenters within a region (own power, cooling, network); zone-redundant services survive a datacenter failure.
- **Region pairs** — regions paired for disaster recovery and staggered updates.
- **Subscription** — billing + access boundary; **resource group** — logical container (same lifecycle); **management groups** — apply policies across subscriptions.
- **Tags** (env, owner, cost-centre), **naming conventions**, **resource locks** (CanNotDelete, ReadOnly), **Azure Policy** (enforce rules: allowed regions, required tags), **RBAC** (who can do what).

## Lesson: [Basic|High] Identity: Microsoft Entra ID, RBAC and managed identities

- **Microsoft Entra ID** (formerly Azure Active Directory) — cloud identity provider: users, groups, app registrations (OAuth 2.0/OIDC), conditional access, MFA. **Entra External ID** for customer-facing apps (successor of Azure AD B2C for new projects).
- **Azure RBAC** — role assignments = security principal + role definition (Owner, Contributor, Reader, or data roles like *Storage Blob Data Reader*, *Key Vault Secrets User*) + scope (management group/subscription/RG/resource).
- **Managed identities** — Azure-managed service principals for Azure resources; no secrets in code or config. **System-assigned** (tied to one resource's lifecycle) or **user-assigned** (standalone, shareable).

```csharp
// Same code works locally (Visual Studio/Azure CLI login) and in Azure (managed identity)
var credential = new DefaultAzureCredential();
var secrets = new SecretClient(new Uri("https://kv-shop.vault.azure.net/"), credential);
var blobs = new BlobServiceClient(new Uri("https://stshop.blob.core.windows.net/"), credential);

// ASP.NET Core: load Key Vault into IConfiguration
builder.Configuration.AddAzureKeyVault(new Uri("https://kv-shop.vault.azure.net/"), credential);
```

# Module: Compute

## Lesson: [Basic|High] Azure App Service

PaaS for web apps and APIs (.NET, Java, Node, Python, PHP; Windows or Linux; code or containers).

- **App Service plan** = the VMs you pay for (tier: Free/Basic/Standard/Premium v3/Isolated v2); many apps can share a plan.
- Features: **deployment slots** (staging → swap for zero downtime), autoscale (scale out instances) and scale up (bigger SKU), custom domains + managed TLS certificates, **Easy Auth** (built-in authentication), VNet integration and private endpoints, health check path, always on, backups, WebJobs.
- Configuration: **App settings** and **connection strings** become environment variables (override appsettings.json); **Key Vault references** `@Microsoft.KeyVault(SecretUri=...)`.

```bash
az appservice plan create -g rg-shop -n plan-shop --sku P1v3 --is-linux
az webapp create -g rg-shop -p plan-shop -n app-shop-api --runtime "DOTNETCORE:10.0"
az webapp identity assign -g rg-shop -n app-shop-api
az webapp config appsettings set -g rg-shop -n app-shop-api --settings ASPNETCORE_ENVIRONMENT=Production
az webapp deploy -g rg-shop -n app-shop-api --src-path publish.zip --type zip
az webapp deployment slot swap -g rg-shop -n app-shop-api --slot staging
```

## Lesson: [Intermediate|High] Azure Functions (serverless)

Event-driven code that runs on **triggers** with declarative **bindings** (input/output), scaling automatically.

| Hosting plan | Notes |
|---|---|
| **Flex Consumption** (recommended for new apps) | Serverless, scale to zero, fast scale, VNet support, per-execution + memory billing |
| Consumption (classic) | Serverless, cold starts, 5–10 min default/max timeout |
| Premium (Elastic Premium) | Pre-warmed instances (no cold start), VNet, longer runs |
| Dedicated (App Service plan) | Run on existing plan, predictable cost |
| Container Apps | Functions in containers |

.NET uses the **isolated worker model** (the in-process model ends support on **10 November 2026**).

```csharp
public class OrderFunctions(ILogger<OrderFunctions> log)
{
    [Function("ProcessOrder")]
    [BlobOutput("receipts/{rand-guid}.json", Connection = "Storage")]
    public string Run([ServiceBusTrigger("orders", Connection = "ServiceBus")] OrderPlaced msg)
    {
        log.LogInformation("Processing order {OrderId}", msg.OrderId);
        return JsonSerializer.Serialize(new Receipt(msg.OrderId, DateTime.UtcNow));
    }

    [Function("Health")]
    public IActionResult Health([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequest req) => new OkObjectResult("ok");

    [Function("NightlyCleanup")]
    public Task Cleanup([TimerTrigger("0 0 2 * * *")] TimerInfo timer) => Task.CompletedTask;   // 6-field NCRONTAB (with seconds)
}
```

Triggers: HTTP, Timer, Queue Storage, Blob, Service Bus, Event Grid, Event Hubs, Cosmos DB change feed, SQL (change tracking), Kafka, RabbitMQ. **Durable Functions** add stateful orchestrations: function chaining, fan-out/fan-in, async HTTP APIs, monitors, human interaction (approval with timeout), entities.

## Lesson: [Intermediate|High] Containers: Container Apps, AKS, ACI and choosing compute

| Need | Choose |
|---|---|
| Web app/API, minimal ops | **App Service** |
| Event-driven, short tasks | **Functions** |
| Microservices/containers, scale to zero, Dapr/KEDA, no cluster management | **Azure Container Apps** |
| Full Kubernetes control, complex platform, operators/CRDs | **AKS** |
| Single container/batch quickly | **Container Instances** |
| Legacy/full OS control, lift-and-shift | **Virtual Machines / VM Scale Sets** |
| Big parallel batch/HPC | **Azure Batch** |
| Static SPA + serverless API | **Static Web Apps** |

# Module: Data and Storage

## Lesson: [Basic|High] Azure Storage account

| Service | Stores | Use |
|---|---|---|
| **Blob Storage** | Objects (files) — block, append, page blobs | Images, documents, backups, data lake (ADLS Gen2 with hierarchical namespace) |
| **Queue Storage** | Simple messages (64 KB) | Basic background work |
| **Table Storage** | NoSQL key-attribute | Cheap structured data |
| **Azure Files** | SMB/NFS file shares | Lift-and-shift shared folders |

- Access tiers for blobs: **Hot**, **Cool** (30-day min), **Cold** (90-day min), **Archive** (180-day min, offline — rehydrate hours); lifecycle management policies move/delete automatically.
- Redundancy: **LRS** (3 copies in one datacenter), **ZRS** (across zones), **GRS/RA-GRS** (plus secondary region), **GZRS/RA-GZRS**.
- Secure access: Entra ID RBAC + managed identity (preferred), **SAS tokens** (time-limited, scoped; user delegation SAS best), account keys (avoid), private endpoints, firewall.

```csharp
var container = new BlobContainerClient(new Uri("https://stshop.blob.core.windows.net/invoices"), new DefaultAzureCredential());
await container.CreateIfNotExistsAsync();
await container.GetBlobClient($"{invoiceId}.pdf").UploadAsync(pdfStream, overwrite: true);
```

## Lesson: [Intermediate|High] Azure SQL and Cosmos DB

**Azure SQL family:** Azure SQL Database (single DB or elastic pool; vCore or DTU; serverless auto-pause; Hyperscale up to 128 TB), Azure SQL Managed Instance (near-100% SQL Server compatibility — SQL Agent, cross-DB queries; lift-and-shift), SQL Server on Azure VMs (full control). Built-in HA, automated backups with point-in-time restore, geo-replication/failover groups, Entra authentication, Defender for SQL, read replicas.

**Azure Cosmos DB:** globally distributed, multi-model NoSQL with single-digit-millisecond latency SLA.

- APIs: **NoSQL** (native), MongoDB (RU and vCore), Apache Cassandra, Gremlin (graph), Table, plus PostgreSQL (distributed, Citus).
- **Partition key** choice is critical: high cardinality, evenly distributed, used in most queries (avoid hot partitions; cross-partition queries cost more).
- **Request Units (RU/s)** — throughput currency: provisioned (manual/autoscale) or serverless.
- **Consistency levels** (strongest → weakest): **Strong, Bounded Staleness, Session (default), Consistent Prefix, Eventual**.
- Change feed for event-driven processing; TTL; multi-region writes.

```csharp
var client = new CosmosClient("https://cosmos-shop.documents.azure.com:443/", new DefaultAzureCredential());
var container = client.GetContainer("shop", "orders");             // partition key: /customerId
await container.UpsertItemAsync(order, new PartitionKey(order.CustomerId));
var item = await container.ReadItemAsync<Order>(order.id, new PartitionKey(order.CustomerId));   // point read: ~1 RU
```

## Lesson: [Intermediate|Medium] Caching: Azure Managed Redis / Azure Cache for Redis

In-memory cache for sessions, hot data, rate limiting, distributed locks, pub/sub. Use with `IDistributedCache` (`AddStackExchangeRedisCache`) or HybridCache's L2. Patterns: cache-aside, write-through, expiration, cache stampede protection. Microsoft is moving customers from Azure Cache for Redis to **Azure Managed Redis** (newer offering based on Redis Enterprise).

# Module: Integration and Messaging

## Lesson: [Intermediate|High] Service Bus vs Event Grid vs Event Hubs vs Storage Queues

| | **Service Bus** | **Event Grid** | **Event Hubs** | Storage Queue |
|---|---|---|---|---|
| Type | Enterprise **message** broker | **Event** routing (pub/sub, push) | **Event streaming** / telemetry ingestion | Simple queue |
| Pattern | Queues + topics/subscriptions | Discrete reactive events ("blob created") | High-volume streams with partitions, replay | Basic work queue |
| Features | FIFO via sessions, transactions, duplicate detection, dead-letter queue, scheduled messages, at-least-once / peek-lock | Filtering, retries, dead-lettering, CloudEvents, MQTT | Millions events/s, consumer groups, retention, Kafka endpoint, Capture to storage | 64 KB msgs, huge queues, cheap |
| Use | Orders, payments, workflows between services | React to Azure resource/app events, webhooks | IoT telemetry, logs, clickstreams | Simple background jobs |

```csharp
await using var client = new ServiceBusClient("sb-shop.servicebus.windows.net", new DefaultAzureCredential());
await using var sender = client.CreateSender("orders");
await sender.SendMessageAsync(new ServiceBusMessage(BinaryData.FromObjectAsJson(order)) { MessageId = order.Id.ToString() });

await using var processor = client.CreateProcessor("orders", new ServiceBusProcessorOptions { MaxConcurrentCalls = 10, AutoCompleteMessages = false });
processor.ProcessMessageAsync += async args =>
{
    var o = args.Message.Body.ToObjectFromJson<Order>();
    await Handle(o);
    await args.CompleteMessageAsync(args.Message);          // otherwise retried; after MaxDeliveryCount → dead-letter queue
};
processor.ProcessErrorAsync += args => Task.CompletedTask;
await processor.StartProcessingAsync();
```

**Logic Apps** — low-code workflows with hundreds of connectors (Office 365, SAP, Salesforce). **API Management (APIM)** — API gateway: publish, secure (JWT validation, subscription keys), throttle (rate-limit policies), transform, cache, version, developer portal.

# Module: Security, Networking and Operations

## Lesson: [Intermediate|High] Key Vault and app configuration

- **Azure Key Vault** — secrets, keys (HSM-backed option) and certificates; RBAC access, soft delete + purge protection, versioning, rotation, private endpoint, logging.
- **Azure App Configuration** — central feature flags and settings with labels per environment, dynamic refresh; reference Key Vault secrets.
- Access with managed identity + `DefaultAzureCredential`; App Service/Functions **Key Vault references** avoid code changes.

## Lesson: [Intermediate|Medium] Networking basics

- **Virtual Network (VNet)** with **subnets**; **NSGs** (network security groups: allow/deny rules); **peering** between VNets; **VPN Gateway**/**ExpressRoute** to on-prem.
- **Private Endpoint** (private IP for a PaaS service inside your VNet) vs **Service Endpoint** (optimised route, service still public IP); **Private DNS zones**.
- Load balancing: **Azure Load Balancer** (L4, regional), **Application Gateway** (L7 regional + WAF), **Front Door** (L7 global, CDN, WAF), **Traffic Manager** (DNS-based global).
- **Azure Firewall**, **DDoS Protection**, **Bastion** (secure RDP/SSH without public IPs), NAT Gateway.

## Lesson: [Intermediate|High] Monitoring with Azure Monitor and Application Insights

- **Azure Monitor** — metrics and logs platform; **Log Analytics workspace** stores logs queried with **KQL**; **alerts** (metric, log, activity log) → action groups (email, SMS, Teams, webhooks, Functions).
- **Application Insights** — APM for apps: requests, dependencies (SQL/HTTP), exceptions, traces, live metrics, application map, availability tests, distributed tracing. In .NET use the **Azure Monitor OpenTelemetry Distro** (`builder.Services.AddOpenTelemetry().UseAzureMonitor()`).

```kusto
requests
| where timestamp > ago(1h)
| summarize count(), avg(duration), percentile(duration, 95) by name, resultCode
| order by count_ desc

exceptions
| where timestamp > ago(24h)
| summarize count() by type, outerMessage
| top 10 by count_
```

## Lesson: [Intermediate|Medium] Cost management and governance

- Pricing levers: right-size SKUs, autoscale, **reserved instances** / **savings plans** (1 or 3 years), **spot VMs**, serverless/scale-to-zero, dev/test pricing, auto-shutdown of dev VMs, storage tiers and lifecycle rules, delete orphaned resources (disks, public IPs).
- **Azure Cost Management** budgets and alerts, tags for chargeback, **Azure Advisor** recommendations, **Pricing Calculator** and TCO calculator.
- Governance: **Azure Policy**, management groups, RBAC least privilege, resource locks, **landing zones** (Cloud Adoption Framework).

## Lesson: [Advanced|High] Reference architecture: scalable .NET web application on Azure

```
Users → Azure Front Door (WAF, CDN, TLS)
      → App Service (or Container Apps) — autoscale, deployment slots, managed identity
          → Azure SQL (zone-redundant, failover group to paired region) via private endpoint
          → Azure Managed Redis (cache, sessions)
          → Blob Storage (files) via private endpoint
          → Service Bus (orders topic) → Functions / Container Apps workers (KEDA scale)
          → Key Vault (secrets, certificates), App Configuration (feature flags)
      → Application Insights + Log Analytics (alerts → Teams/on-call)
CI/CD: Azure DevOps / GitHub Actions + Bicep (IaC), workload identity federation
```

Reliability: zones + multi-region (active-passive with Front Door failover), health probes, retries/circuit breakers, queues to absorb spikes. Security: Entra ID auth, managed identities, private endpoints, WAF, Defender for Cloud. Cost: autoscale, reserved capacity for baseline, serverless for spiky workloads.

# Interview

## [Beginner|High] What are IaaS, PaaS and SaaS? Give Azure examples.

IaaS provides virtualised infrastructure — you manage OS and above (Azure VMs, VM Scale Sets). PaaS provides a managed platform — you deploy code and data, Azure handles OS, patching and scaling (App Service, Azure SQL Database, Functions, Container Apps). SaaS is complete software you just use (Microsoft 365). Serverless (Functions, Logic Apps) is PaaS that scales to zero and bills per use.

## [Beginner|High] Explain the Azure resource hierarchy.

Entra ID tenant → management groups (policy and RBAC across subscriptions) → subscriptions (billing and access boundary, quotas) → resource groups (containers for resources sharing a lifecycle) → resources (web apps, databases). RBAC and Azure Policy inherit downward. A resource belongs to exactly one resource group; resources in a group can be in different regions.

## [Beginner|High] What is a managed identity and why use it?

An automatically managed identity in Entra ID for an Azure resource (App Service, Functions, VM, AKS pod via workload identity) that lets code authenticate to other Azure services (Key Vault, Storage, SQL, Service Bus) without storing any credentials. Azure handles the credentials and rotation. System-assigned is tied to one resource's lifecycle; user-assigned is a standalone identity shared by several resources. In code, use `DefaultAzureCredential`.

## [Beginner|High] What are deployment slots in App Service?

Live apps with their own hostnames (e.g. `app-staging.azurewebsites.net`) within the same App Service plan (Standard tier and above). You deploy to staging, warm it up and test, then **swap** with production — near-zero downtime and instant rollback by swapping back. Slot-specific (sticky) settings stay with the slot (e.g. connection strings for staging).

## [Beginner|Medium] What are availability zones and region pairs?

Availability zones are physically separate datacenters within a region with independent power, cooling and networking; deploying across zones (zone-redundant services) protects against a datacenter failure (99.99% SLA for VMs across zones). Region pairs are two regions in the same geography used for disaster recovery (geo-redundant storage replication, sequential platform updates, prioritised recovery).

## [Intermediate|High] Service Bus vs Event Grid vs Event Hubs — when do you use each?

Service Bus is for high-value business **messages** between services where every message must be processed: queues/topics, FIFO with sessions, transactions, duplicate detection, dead-lettering (orders, payments). Event Grid routes discrete **events** (something happened) to subscribers via push with filtering — reacting to blob uploads, resource changes or custom app events. Event Hubs ingests high-volume **event streams** (telemetry, logs, IoT) with partitions, retention and replay for stream processing.

## [Intermediate|High] What are Azure Functions triggers and bindings? Which hosting plan would you choose?

A trigger starts the function (HTTP, Timer, Service Bus, Blob, Queue, Event Grid, Event Hubs, Cosmos DB change feed); exactly one per function. Bindings declaratively connect to data as inputs/outputs (read a blob, write to a queue) without SDK code. Plans: Flex Consumption (serverless, scale to zero, VNet — the default choice for new apps), Premium (pre-warmed, no cold start, long runs), Dedicated/App Service plan (predictable cost), Container Apps. For .NET, use the isolated worker model.

## [Intermediate|High] What are Durable Functions?

An extension of Azure Functions for stateful workflows in code. An orchestrator function coordinates activity functions, and state is checkpointed automatically (event sourcing in storage), so workflows can run for days and survive restarts. Patterns: function chaining, fan-out/fan-in, async HTTP APIs (status endpoint), monitoring loops, human interaction (wait for an external event with timeout), durable entities. Orchestrator code must be deterministic (no `DateTime.Now`, no direct I/O).

## [Intermediate|High] How do you choose between Azure SQL Database and Cosmos DB?

Azure SQL: relational data, complex joins and transactions, strong consistency, reporting, existing SQL skills — most line-of-business apps. Cosmos DB: globally distributed apps needing low latency at any scale, flexible schema JSON documents, massive throughput with predictable performance, multi-region writes, tunable consistency — e.g. catalogues, IoT, user profiles, gaming. Cosmos requires careful partition key design and RU cost planning.

## [Intermediate|High] What are Cosmos DB consistency levels?

From strongest to weakest: Strong (linearizable reads — always latest), Bounded Staleness (reads lag by at most K versions or T time), Session (default — read-your-own-writes within a session), Consistent Prefix (never see out-of-order writes), Eventual (no ordering guarantee, lowest latency/cost). Stronger consistency means higher latency and RU cost, and Strong limits multi-region writes.

## [Intermediate|Medium] What is the difference between blob access tiers?

Hot (frequent access, highest storage cost, lowest access cost), Cool (infrequent, 30-day minimum), Cold (rare, 90-day minimum), Archive (offline, cheapest storage, 180-day minimum, rehydration takes hours). Lifecycle management rules can automatically move blobs between tiers or delete them based on age.

## [Intermediate|Medium] How do you secure secrets for an app hosted in Azure?

Store them in Azure Key Vault; give the app a managed identity with the "Key Vault Secrets User" RBAC role; read them via the Key Vault configuration provider or App Service Key Vault references; enable soft delete and purge protection; use private endpoints; rotate secrets (or eliminate them by using managed identity auth to SQL, Storage and Service Bus directly); never store secrets in appsettings.json or source control.

## [Intermediate|Medium] What is Azure API Management used for?

A managed API gateway in front of backend APIs (App Service, Functions, AKS, on-prem): central entry point, JWT/OAuth validation, subscription keys, rate limiting and quotas, request/response transformation, caching, versioning and revisions, mock responses, analytics, and a developer portal for consumers. Policies are XML snippets applied at global, product, API or operation scope.

## [Advanced|High] How would you design a highly available, globally distributed web app on Azure?

Deploy the stateless app tier to two or more regions (App Service/Container Apps/AKS), each zone-redundant; put Azure Front Door in front for global load balancing, failover, WAF and CDN; data: Azure SQL with auto-failover groups (or Cosmos DB with multi-region writes); geo-redundant storage; Service Bus geo-disaster recovery/replication; Key Vault per region; health probes and automated failover; IaC for identical environments; test failover regularly; monitor with Application Insights; define RTO/RPO targets and back up accordingly.

## [Advanced|Medium] How do you reduce Azure costs for an application?

Right-size SKUs using metrics and Advisor; autoscale with sensible minimums; use reserved instances/savings plans for steady workloads; serverless/scale-to-zero (Flex Consumption, Container Apps) for spiky ones; spot VMs for interruptible batch; storage lifecycle tiers; shut down dev/test outside hours; delete orphaned resources; use caching to reduce database tier needs; set budgets and alerts; tag resources for cost allocation; consider Azure Hybrid Benefit for Windows/SQL licences.

## [Scenario|High] Your App Service API slows down every day at 9 AM and CPU hits 100%. What do you do?

Short term: configure **autoscale** rules (scale out on CPU > 70% and schedule-based scale-out before 9 AM). Investigate root cause with Application Insights (slow requests, dependencies, profiler): expensive queries (add indexes, caching), sync-over-async, chatty calls, large payloads. Consider caching hot data in Redis, moving heavy work to queues and background workers, and scaling up the plan if a single instance is undersized. Verify with load tests.

## [Scenario|High] An order API must notify inventory, billing and email services reliably when an order is placed. Design it on Azure.

The API saves the order and writes an outbox record in the same transaction; a background publisher sends an `OrderPlaced` message to a **Service Bus topic**. Inventory, billing and email each have their own **subscription** (with filters if needed), processed by Functions/Container Apps workers with peek-lock, retries, dead-letter queue monitoring and idempotent handlers (dedupe by MessageId). Managed identities for access, Application Insights distributed tracing across services, alerts on DLQ count.

## [Scenario|High] A developer's connection string with the SQL admin password was found in appsettings.json in the repo. How do you fix the design?

Rotate the password immediately. Switch the app to **Entra ID authentication** for Azure SQL with a managed identity (`Authentication=Active Directory Default` in the connection string, create a contained user `FROM EXTERNAL PROVIDER` with minimal roles) — no password at all. Put any remaining secrets in Key Vault with Key Vault references. Enable secret scanning in the repo and remove SQL admin usage from apps.

## [Scenario|Medium] Users in Europe complain the India-hosted site is slow. What can you do?

Put Azure Front Door (CDN + global edge, TLS termination, caching static content and cacheable API responses) in front; serve static assets from the CDN; compress and optimise payloads; deploy a read-only or full secondary region in Europe with Front Door latency-based routing; replicate data (Cosmos DB multi-region or Azure SQL geo-replica for reads); check data residency requirements first.

## [Scenario|Medium] Blob uploads must trigger thumbnail generation automatically. Which services?

Blob Storage (uploads via SAS or managed identity) → **Event Grid** `BlobCreated` event (filtered by container/suffix) → **Azure Function** (Event Grid trigger, Flex Consumption) that generates the thumbnail and writes it to a `thumbnails` container with an output binding. Add retries/dead-lettering on the Event Grid subscription, and Application Insights for monitoring. For high volume, put a Service Bus/Storage queue between them.

# Cheatsheet

## Service map

| Need | Service |
|---|---|
| Web app/API | App Service |
| Serverless code | Functions (Flex Consumption, isolated worker) |
| Containers | Container Apps / AKS / ACI |
| VMs | Virtual Machines, VM Scale Sets |
| Relational DB | Azure SQL Database / Managed Instance |
| NoSQL | Cosmos DB |
| Files/objects | Blob Storage / Azure Files |
| Cache | Azure Managed Redis |
| Messages | Service Bus |
| Events | Event Grid |
| Streams | Event Hubs |
| Workflows | Logic Apps / Durable Functions |
| API gateway | API Management |
| Secrets | Key Vault |
| Config/flags | App Configuration |
| Identity | Entra ID, managed identities |
| Monitoring | Azure Monitor, Application Insights, Log Analytics (KQL) |
| Global entry | Front Door (+WAF, CDN) |
| IaC | Bicep / ARM / Terraform |

## Key numbers & terms

Storage redundancy: LRS · ZRS · GRS · RA-GRS · GZRS. Blob tiers: Hot · Cool (30d) · Cold (90d) · Archive (180d). Cosmos consistency: Strong · Bounded Staleness · **Session (default)** · Consistent Prefix · Eventual. Functions in-process model support ends 10 Nov 2026.

## CLI

```bash
az login
az account set -s <subscription>
az group create -n rg -l centralindia
az webapp up / az webapp deploy
az functionapp create
az keyvault secret set --vault-name kv -n Db --value "..."
az deployment group create -g rg -f main.bicep
azd up
```

## Well-Architected pillars

Reliability · Security · Cost Optimization · Operational Excellence · Performance Efficiency.

## Golden rules

Managed identity + `DefaultAzureCredential` · Key Vault · private endpoints · autoscale · deployment slots · IaC · Application Insights · tags + budgets · zones/multi-region for HA.
