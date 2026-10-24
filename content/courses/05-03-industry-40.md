---
slug: industry-40
title: Industry 4.0 & IIoT — Smart Manufacturing Software
track: automation
order: 3
group: Industry 4.0
icon: 4.0
color: #0b7285
summary: The four industrial revolutions and Industry 4.0 pillars, IIoT architecture (edge, gateway, cloud), MQTT and Sparkplug B, the unified namespace, ISA-95 and MES functions, OEE and downtime analytics, traceability and genealogy, time-series data, digital twins, predictive maintenance and AI, Azure/AWS IoT platforms, building it with .NET, and the Industry 4.0 interview questions.
---

# Overview

**Industry 4.0** (the fourth industrial revolution) is the digital transformation of manufacturing: machines, products, people and systems connected and exchanging data so factories can monitor, analyse and optimise themselves.

| Revolution | Around | Driver |
|---|---|---|
| 1.0 | 1780s | Mechanisation — water and steam power |
| 2.0 | 1870s | Mass production — electricity, assembly lines |
| 3.0 | 1970s | Automation — electronics, PLCs, IT |
| 4.0 | 2010s → | Cyber-physical systems — IIoT, cloud, data analytics, AI |
| 5.0 (EU concept, 2021) | Now | Human-centric, resilient, sustainable industry |

**Pillars / technologies:** Industrial IoT (IIoT), cloud and edge computing, big data and analytics, AI/ML, digital twins and simulation, horizontal and vertical system integration (ERP ↔ MES ↔ machines), additive manufacturing, augmented reality, autonomous robots/AMRs, cybersecurity.

**Why companies invest:** higher **OEE**, less unplanned downtime, better quality (fewer defects and scrap), traceability for regulations and recalls, energy savings, faster changeovers, data-driven decisions instead of paper and Excel.

# Versions

| Year | Milestone |
|---|---|
| 1999 | MQTT created (Andy Stanford-Clark, IBM and Arlen Nipper) for oil pipeline telemetry |
| 2000 | ISA-95 first published (later IEC 62264) — enterprise–control integration |
| 2011 | "Industrie 4.0" presented at Hannover Messe; German government strategy |
| 2014 | MQTT 3.1.1 becomes an OASIS standard; Industrial Internet Consortium founded |
| 2015 | RAMI 4.0 reference architecture; Asset Administration Shell concept |
| 2016–2018 | Azure IoT Hub / IoT Edge, AWS IoT Greengrass; Eclipse Sparkplug for MQTT |
| 2019 | MQTT 5.0 |
| 2021 | European Commission publishes "Industry 5.0" vision |
| 2022–2023 | Sparkplug 3.0 (Eclipse); "Unified Namespace" architecture popular; Azure Digital Twins mature |
| 2024–2025 | Azure IoT Operations (edge, Kubernetes-based, MQTT broker + OPC UA connector) GA; generative AI copilots for operators and maintenance |

# Lifecycle

**Data journey in a smart factory:**

1. **Sense** — PLCs, sensors, machines produce signals (temperature, counts, states, alarms).
2. **Connect** — protocols (OPC UA, Modbus, MQTT) via gateways and edge devices.
3. **Contextualise** — attach meaning: which site/area/line/machine, which order, product, shift (ISA-95 model).
4. **Store** — time-series database/historian for signals, relational database for orders, quality and genealogy.
5. **Analyse** — OEE, downtime Pareto, SPC, energy per unit, ML for anomalies and predictions.
6. **Act** — dashboards and alerts to operators, work orders to maintenance, adjustments via MES/SCADA — closing the loop.
7. **Improve** — continuous improvement (Kaizen, Lean, Six Sigma) using the data.

**Implementation roadmap:** pick one line and one KPI (pilot) → connect machines → OEE/downtime dashboard → prove value → standardise data model and architecture → scale to lines/plants → advanced use cases (predictive maintenance, AI, digital twin).

# Tools

- **Edge & connectivity:** Kepware, Ignition Edge, Node-RED, Azure IoT Edge / Azure IoT Operations, AWS IoT Greengrass, Siemens Industrial Edge, HiveMQ / EMQX / Mosquitto (MQTT brokers).
- **Platforms:** Azure IoT Hub, Azure Event Hubs, Azure Digital Twins, Microsoft Fabric Real-Time Intelligence / Azure Data Explorer, AWS IoT Core & SiteWise, Siemens Insights Hub (MindSphere), PTC ThingWorx.
- **MES / MOM:** Siemens Opcenter, Rockwell FactoryTalk ProductionCentre / Plex, AVEVA MES, Critical Manufacturing, Ignition MES modules, custom .NET MES.
- **Data:** InfluxDB, TimescaleDB, AVEVA PI, SQL Server, Azure Data Explorer (KQL), Grafana, Power BI.
- **.NET building blocks:** MQTTnet, OPC UA .NET Standard, Azure IoT SDK (`Microsoft.Azure.Devices.Client`), Worker Services, SignalR (live dashboards), ML.NET.

# Module: Foundations

## Lesson: [Basic|High] Industry 4.0 concepts and the smart factory

**Key terms:**

| Term | Meaning |
|---|---|
| Cyber-physical system (CPS) | Physical machine + software that monitors and controls it via data |
| IIoT | Internet of Things applied to industrial equipment |
| IT/OT convergence | Connecting business IT systems with plant operational technology |
| Vertical integration | Data flows up and down the levels: sensor → PLC → SCADA → MES → ERP |
| Horizontal integration | Data flows along the value chain: suppliers → plants → logistics → customers |
| Edge computing | Processing data near the machines (low latency, works offline, reduces bandwidth) |
| Digital thread | Connected data across the product lifecycle — design, production, service |
| Lights-out manufacturing | Highly automated production that runs with minimal human presence |

**Smart factory example:** a CNC line streams spindle load, temperature and state to an edge gateway; MES knows which order and part is running; OEE dashboards show losses in real time; a vibration model predicts bearing failure two weeks ahead and creates a maintenance work order; every part's serial number is linked to its machine parameters for traceability.

## Lesson: [Basic|High] ISA-95, MES and what MES does

**ISA-95 (IEC 62264)** defines the interface between enterprise systems (Level 4, ERP) and manufacturing operations (Level 3, MES) and a standard equipment hierarchy:

```text
Enterprise → Site → Area → Work centre / Production line → Work unit / Machine
```

**MES (Manufacturing Execution System)** — the system that runs production on the shop floor between ERP and machines. Typical functions (MESA model):

| Function | What it does |
|---|---|
| Production order management | Receive orders from ERP, dispatch to lines, track progress |
| Work instructions | Digital SOPs per step and product |
| Data collection | Counts, scrap, downtime reasons, process parameters |
| Quality management | Inspections, SPC, non-conformances, CAPA |
| Traceability & genealogy | Which materials, lots and machines made each product |
| Performance analysis | OEE, downtime, cycle times |
| Labour management | Operators, skills, shifts |
| Maintenance integration | Machine states → CMMS work orders |
| Material/inventory on the floor | WIP, consumption, kanban |

ERP plans **what and when** (days/weeks); MES executes **how** (minutes/seconds); PLCs control **the machine** (milliseconds).

# Module: IIoT Architecture and Protocols

## Lesson: [Intermediate|High] IIoT reference architecture — device, edge, cloud

```text
Machines/PLCs ──OPC UA/Modbus──► Edge gateway (filter, buffer, compute) ──MQTT/AMQP/HTTPS──►
   Cloud ingestion (IoT Hub / Event Hubs / MQTT broker) ──► Stream processing (rules, aggregates)
     ├─► Hot path: real-time dashboards & alerts (SignalR, Grafana)
     ├─► Warm path: time-series store (ADX, InfluxDB, PI) for trends & OEE
     └─► Cold path: data lake / warehouse for ML and reporting
   MES / ERP / CMMS integrations ◄──► APIs and events
```

**Edge vs cloud:**

| Edge | Cloud |
|---|---|
| Millisecond-second decisions, works offline | Fleet-wide analytics, long-term storage, ML training |
| Protocol translation, filtering, compression | Integration across plants and with business systems |
| Store-and-forward when the link fails | Elastic scale, managed services |

**Design rules:** outbound-only connections from OT to cloud, device identity with certificates, buffering at the edge, source timestamps in UTC, data quality flags, a consistent naming model, and data contracts versioned like APIs.

## Lesson: [Intermediate|High] MQTT, Sparkplug B and the Unified Namespace

**MQTT** — lightweight publish/subscribe protocol over TCP (1883, TLS 8883). Clients publish to **topics**; the **broker** delivers to subscribers.

| Feature | Meaning |
|---|---|
| Topics | Hierarchical strings: `acme/pune/assembly/line1/robot2/temperature` |
| Wildcards | `+` one level (`acme/+/assembly/#`), `#` all remaining levels |
| QoS 0 / 1 / 2 | At most once / at least once / exactly once |
| Retained message | Broker keeps the last value for new subscribers |
| Last Will & Testament | Broker publishes it if a client disconnects unexpectedly (device offline) |
| Persistent session | Broker queues messages for a client while it is offline |
| MQTT 5 | Reason codes, user properties, shared subscriptions, message expiry |

**Sparkplug B** (Eclipse) adds an industrial standard on top of MQTT: fixed topic namespace (`spBv1.0/group/NDATA/edge-node/device`), Protobuf payloads with metrics, birth/death certificates (`NBIRTH`/`NDEATH`) so subscribers know state, and report-by-exception.

**Unified Namespace (UNS)** — a single, event-driven hub (usually an MQTT broker) where every system publishes its current state under an ISA-95-structured topic tree, and every consumer subscribes to what it needs — replacing point-to-point integrations.

```csharp
// Publish a machine state with MQTTnet (v4/v5 style)
var client = new MqttClientFactory().CreateMqttClient();
await client.ConnectAsync(new MqttClientOptionsBuilder().WithTcpServer("broker.plant.local", 8883).WithTlsOptions(o => o.UseTls())
    .WithClientId("line1-edge").WithWillTopic("acme/pune/assembly/line1/edge/status").WithWillPayload("offline").WithWillRetain().Build());

var json = JsonSerializer.Serialize(new { state = "Running", speed = 42.5, ts = DateTime.UtcNow });
await client.PublishAsync(new MqttApplicationMessageBuilder()
    .WithTopic("acme/pune/assembly/line1/filler/state").WithPayload(json)
    .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce).WithRetainFlag().Build());
```

**MQTT vs OPC UA:** OPC UA = rich information model and client/server access to machines (great at Level 1–2); MQTT = lightweight pub/sub for moving data to many consumers and the cloud. They are complementary (and OPC UA PubSub can run over MQTT).

# Module: Manufacturing KPIs and Data

## Lesson: [Intermediate|High] OEE — calculation, six big losses and downtime analysis

**OEE (Overall Equipment Effectiveness) = Availability × Performance × Quality**

| Factor | Formula | Loss it captures |
|---|---|---|
| Availability | Run time ÷ Planned production time | Breakdowns, changeovers, waiting |
| Performance | (Ideal cycle time × Total count) ÷ Run time | Slow cycles, minor stops |
| Quality | Good count ÷ Total count | Scrap, rework, start-up rejects |

**Worked example (one shift):** planned time 480 min; downtime 60 min → run time 420 min → **Availability = 87.5 %**. Ideal cycle time 1.0 min/part; 380 parts produced → **Performance = 380 ÷ 420 = 90.5 %**. 361 good parts → **Quality = 95 %**. **OEE = 0.875 × 0.905 × 0.95 ≈ 75.2 %**. (World-class benchmark often quoted ≈ 85 %; many plants start at 40–60 %.)

**Six big losses (TPM):** breakdowns, setup/adjustments (→ availability); small stops, reduced speed (→ performance); start-up rejects, production rejects (→ quality).

```sql
-- OEE per line per shift from MES tables (simplified)
SELECT  s.LineId, s.ShiftDate, s.Shift,
        Availability = CAST(s.RunMinutes AS float) / NULLIF(s.PlannedMinutes, 0),
        Performance  = (s.IdealCycleMin * s.TotalCount) / NULLIF(s.RunMinutes, 0),
        Quality      = CAST(s.GoodCount AS float) / NULLIF(s.TotalCount, 0),
        OEE          = (CAST(s.RunMinutes AS float) / NULLIF(s.PlannedMinutes, 0))
                     * ((s.IdealCycleMin * s.TotalCount) / NULLIF(s.RunMinutes, 0))
                     * (CAST(s.GoodCount AS float) / NULLIF(s.TotalCount, 0))
FROM mes.ShiftSummary s;
```

Other KPIs: **MTBF** (mean time between failures), **MTTR** (mean time to repair), throughput, first pass yield (FPY), scrap rate, cycle time, takt time (available time ÷ customer demand), energy per unit, schedule adherence.

## Lesson: [Intermediate|High] Traceability, genealogy and quality (SPC)

**Traceability** answers: for this finished serial/lot, which raw-material lots, machines, operators, parameters and test results were involved (backward), and where did a suspect material lot end up (forward)? Essential in automotive (IATF 16949), pharma (GMP, 21 CFR Part 11 electronic records), food and aerospace — and for targeted recalls.

```sql
-- Genealogy: which finished serials used a suspect component lot?
WITH Tree AS (
    SELECT ChildLot, ParentSerial FROM mes.Consumption WHERE ChildLot = 'LOT-2026-0412'
    UNION ALL
    SELECT c.ChildLot, c.ParentSerial FROM mes.Consumption c JOIN Tree t ON c.ChildLot = t.ParentSerial
)
SELECT DISTINCT ParentSerial FROM Tree;
```

**SPC (Statistical Process Control):** control charts (X̄–R, I-MR) with control limits at ±3σ; rules (Western Electric/Nelson) flag out-of-control trends before parts go out of tolerance. **Cp/Cpk** measure process capability against specification limits (Cpk ≥ 1.33 a common target).

## Lesson: [Intermediate|Medium] Time-series data at scale

Machine data is **time-series**: (timestamp, tag, value, quality), arriving continuously — thousands of tags × 1 Hz = hundreds of millions of rows per month.

| Technique | Why |
|---|---|
| Time-series databases (ADX/KQL, InfluxDB, TimescaleDB, PI) | Fast ingest, compression, time-bucket queries |
| Report by exception / deadband | Store only changes beyond a threshold — reduces volume 10–100× |
| Downsampling & retention tiers | Raw for weeks, 1-min aggregates for years |
| Partitioning by time (SQL Server partitioning, columnstore) | Efficient ranges and archiving |
| UTC timestamps + source time vs ingest time | Correct ordering across time zones and late data |

```sql
-- SQL Server 2022+: one-minute average per tag with DATE_BUCKET
SELECT TagId, DATE_BUCKET(MINUTE, 1, Ts) AS Minute, AVG(Value) AS AvgValue, MAX(Value) AS MaxValue
FROM iot.Telemetry
WHERE Ts >= DATEADD(HOUR, -8, SYSUTCDATETIME())
GROUP BY TagId, DATE_BUCKET(MINUTE, 1, Ts);
```

# Module: Advanced Use Cases

## Lesson: [Advanced|High] Predictive maintenance and AI in manufacturing

| Strategy | Trigger | Downside |
|---|---|---|
| Reactive | Fix after failure | Unplanned downtime, secondary damage |
| Preventive | Fixed schedule (hours, cycles) | Replaces healthy parts, still misses random failures |
| Condition-based | Threshold on a measurement (vibration > limit) | Late warning |
| **Predictive** | Model predicts failure/remaining useful life from trends | Needs data, labels and domain knowledge |

**Data used:** vibration (accelerometers, FFT spectra), temperature, current/power, pressure, acoustic, oil analysis, cycle counts, alarm history, maintenance records (labels).

**Approach:** collect and label history → feature engineering (RMS, kurtosis, spectral peaks, trends) → anomaly detection (isolation forest, autoencoders) when few failures exist, or classification/regression for remaining useful life → deploy at edge or cloud → alert + create CMMS work order → measure avoided downtime and false alarms.

Other AI use cases: visual inspection with computer vision (defect detection), process parameter optimisation, demand-driven scheduling, energy optimisation, generative-AI assistants that answer operators from manuals and work history.

## Lesson: [Advanced|Medium] Digital twins and simulation

A **digital twin** is a live digital representation of a physical asset, process or plant, kept in sync with real data, used to monitor, simulate and optimise.

| Level | Example |
|---|---|
| Component/asset twin | A pump with its live state, health score and maintenance history |
| Process/line twin | A production line model to test a new schedule or layout virtually |
| Plant/system twin | Whole factory — energy, flow, capacity planning |
| Product twin | Each serial's as-built data for service and warranty |

Technologies: Azure Digital Twins (DTDL models + twin graph), Asset Administration Shell (Industry 4.0 standard for asset information), NVIDIA Omniverse/Siemens tools for 3D simulation, discrete-event simulation (AnyLogic, Plant Simulation), **virtual commissioning** (test PLC code against a simulated machine before it exists).

## Lesson: [Advanced|High] Building an Industry 4.0 platform with .NET

**Typical .NET solution for a smart-factory MES/IIoT platform:**

```text
Edge:   .NET Worker Service (OPC UA / Modbus / MQTT clients) → local buffer (SQLite) → MQTT / IoT Hub
Cloud/on-prem:
  Ingestion  : MQTT broker or Azure IoT Hub/Event Hubs → .NET consumer (BackgroundService) or Azure Functions
  Storage    : SQL Server (orders, quality, genealogy — RLS per plant/tenant) + time-series store (ADX/InfluxDB)
  APIs       : ASP.NET Core Web API (REST), SignalR hub for live machine states
  UI         : Angular/React/Next.js dashboards — OEE, downtime Pareto, andon boards, work instructions
  Jobs       : Shift summaries, OEE aggregation, ERP sync (SAP/Dynamics via APIs/IDocs)
  Ops        : Docker/Kubernetes or Azure Container Apps, OpenTelemetry, Grafana
```

```csharp
// Edge worker: read OPC UA/Modbus, publish to MQTT, buffer when offline (sketch)
public class TelemetryWorker(ITagReader reader, IMqttPublisher mqtt, ILocalBuffer buffer, ILogger<TelemetryWorker> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));
        while (await timer.WaitForNextTickAsync(ct))
        {
            var samples = await reader.ReadChangedAsync(ct);            // report by exception
            try { await buffer.FlushAsync(mqtt, ct); await mqtt.PublishAsync(samples, ct); }
            catch (Exception ex) { log.LogWarning(ex, "Broker unreachable, buffering {Count}", samples.Count); await buffer.StoreAsync(samples, ct); }
        }
    }
}
```

Non-functional concerns interviewers ask about: multi-plant/multi-tenant isolation (Row-Level Security), time zones and shift calendars, offline tolerance, audit trails and e-signatures (pharma 21 CFR Part 11), validation, OT security, and scaling ingestion (partitioning, batching, back-pressure).

# Interview

## [Beginner|High] What is Industry 4.0?

The fourth industrial revolution: connecting machines, products, people and IT systems through IIoT, cloud/edge computing, data analytics and AI so factories become transparent, flexible and self-optimising. It builds on the automation of Industry 3.0 (PLCs, IT) by adding connectivity and data-driven decisions — e.g. real-time OEE, predictive maintenance, full traceability and digital twins.

## [Beginner|High] What is IIoT and how is it different from consumer IoT?

Industrial IoT connects industrial equipment — sensors, PLCs, machines — to collect and use data. Compared with consumer IoT it demands higher reliability, determinism and safety, works with industrial protocols (OPC UA, Modbus, PROFINET), runs in harsh environments with long equipment lifetimes (20+ years, brownfield machines), and has stricter security and uptime requirements.

## [Beginner|High] What is OEE and how is it calculated?

Overall Equipment Effectiveness = Availability × Performance × Quality. Availability = run time ÷ planned time; Performance = (ideal cycle time × total count) ÷ run time; Quality = good count ÷ total count. Example: 87.5 % × 90.5 % × 95 % ≈ 75 %. It shows how much of planned time is truly productive and which loss to attack first.

## [Beginner|High] What is an MES and how does it differ from ERP?

MES executes and tracks production on the shop floor in real time — orders dispatched to lines, data collection, quality, traceability, OEE, work instructions. ERP manages the business — finance, purchasing, inventory, sales, planning over days/weeks. ISA-95 defines the integration: ERP sends orders and receives production confirmations and consumption from MES.

## [Beginner|Medium] What is ISA-95?

An international standard (IEC 62264) for integrating enterprise and control systems. It defines the levels (0–4), the functions of manufacturing operations management (production, quality, maintenance, inventory) and object models for data exchanged between ERP and MES, plus the equipment hierarchy enterprise → site → area → line → unit — used to structure data models and topic namespaces.

## [Intermediate|High] What is MQTT and why is it popular in IIoT?

A lightweight publish/subscribe protocol over TCP with a broker. Small overhead, works on unreliable networks, decouples producers from consumers, supports QoS levels, retained messages, last will (detect offline devices) and persistent sessions; easy to secure with TLS and certificates; all clouds support it. Sparkplug B adds a standard namespace, payload format and state management for industrial use.

## [Intermediate|High] Explain MQTT QoS levels.

QoS 0 — at most once, fire-and-forget, may be lost. QoS 1 — at least once, acknowledged, may be duplicated (consumers must be idempotent). QoS 2 — exactly once via a four-step handshake, slower. Telemetry usually uses 0 or 1; commands and important events use 1 with idempotency or 2.

## [Intermediate|High] What is the difference between OPC UA and MQTT? When do you use which?

OPC UA is a full industrial interoperability standard — rich information models, browse/read/write/subscribe/methods, built-in security — ideal for connecting to machines and controllers. MQTT is a lightweight transport for pub/sub distribution of data to many consumers and to the cloud. Common pattern: OPC UA at the machine/edge, MQTT (or OPC UA PubSub over MQTT) from the edge to the enterprise/cloud.

## [Intermediate|High] What is edge computing and why is it needed in factories?

Processing data close to the machines on gateways or industrial PCs. Needed for low-latency decisions, operation when the network or cloud is down (store-and-forward), reducing bandwidth by filtering/aggregating high-frequency data, protocol translation, and keeping sensitive OT networks closed while sending only outbound data.

## [Intermediate|Medium] What is the Unified Namespace?

An architecture where an event broker (typically MQTT) holds the current state of the whole business in one ISA-95-structured topic hierarchy. Machines, MES, ERP and analytics publish and subscribe there instead of building point-to-point integrations, making data discoverable and new consumers easy to add. It needs governance of topic structure and payload contracts.

## [Intermediate|Medium] What are MTBF and MTTR?

MTBF (mean time between failures) = operating time ÷ number of failures — reliability. MTTR (mean time to repair) = total repair time ÷ number of repairs — maintainability. Availability ≈ MTBF ÷ (MTBF + MTTR). Improving maintenance, spare-part availability and diagnostics reduces MTTR; root-cause analysis and predictive maintenance increase MTBF.

## [Advanced|High] How does predictive maintenance work? What data do you need?

Collect condition data (vibration, temperature, current, pressure, cycles) plus maintenance and failure history, engineer features (RMS, spectral peaks, trends), train anomaly-detection or remaining-useful-life models, deploy them at the edge or cloud, and turn predictions into alerts and CMMS work orders. Success needs domain experts, enough failure examples (or anomaly detection when rare), and a feedback loop measuring avoided downtime and false alarms.

## [Advanced|High] Design a real-time OEE dashboard for 20 production lines.

Edge per line reads machine state, counts and reject signals via OPC UA/Modbus, timestamps in UTC and publishes state changes to MQTT/IoT Hub. A stream processor or .NET consumer maintains current state per line, accumulates run/down time by reason and counts, stores events in a time-series/SQL store and shift summaries in SQL. An ASP.NET Core API + SignalR pushes live updates to an Angular/React dashboard (andon view, OEE gauges, downtime Pareto). Operators enter downtime reasons on a tablet. Handle shift calendars, planned stops, ideal cycle times per product, and offline buffering.

## [Advanced|Medium] What is a digital twin? Give a practical example.

A live virtual model of a physical asset or process, synchronised with real data and used to monitor, predict and simulate. Example: a twin of a packaging line combining live machine states, a throughput model and maintenance data, used to test a new product changeover sequence virtually and to predict the effect of a slower filler on output. Tools: Azure Digital Twins (DTDL), Asset Administration Shell, simulation software, virtual commissioning.

## [Advanced|Medium] How do you handle millions of telemetry rows per day in SQL Server?

Batch inserts (SqlBulkCopy, table-valued parameters), narrow tables with tag ids, clustered columnstore indexes for history, partitioning by date with sliding-window archiving, report-by-exception/deadband to cut volume, aggregates (1-min/1-h) for dashboards, `DATE_BUCKET` and window functions for queries, separate hot recent data from cold history — or use a dedicated time-series store (ADX/InfluxDB) and keep SQL for transactional MES data.

## [Scenario|High] A plant has 30-year-old machines without network connectivity. How do you bring them into an Industry 4.0 project?

Retrofit: add sensors (current clamps for run/stop, vibration sensors, photo-eyes or counters for parts), read existing PLC I/O through gateways or protocol converters (serial Modbus → TCP), or use IO-Link and small edge devices. Start with simple, high-value signals (running/stopped, count, reject) to get OEE and downtime, then add condition monitoring. Keep the machine's safety and control untouched; document and secure the new connections.

## [Scenario|High] OEE dashboards show 110 % performance on some lines. What is wrong?

Performance above 100 % means the ideal cycle time is wrong (too slow) or counts are inflated — wrong ideal cycle time for the running product, product not switched in the system at changeover, double counting from sensor bounce (needs debounce/edge detection), counting rejects twice, or run time understated (downtime recorded incorrectly). Validate the master data per product and the signal logic at the edge.

## [Scenario|Medium] Telemetry arrives late and out of order after network outages. How do you keep reports correct?

Use the device's source timestamp (UTC) rather than ingestion time, buffer and replay at the edge with sequence numbers, make ingestion idempotent (dedupe by device + sequence/timestamp), let aggregations handle late data (recompute affected windows, or watermarks in stream processing), and show data-quality flags on dashboards when data is incomplete.

## [Scenario|Medium] Management asks: "How do we start Industry 4.0 with a small budget?"

Start with a clear business problem and one KPI — usually OEE/downtime on a bottleneck line. Connect a few signals with low-cost edge hardware, build a simple dashboard and digital downtime-reason entry, run daily review meetings on the data, and quantify savings (more output, less scrap, less overtime). Use the result to fund scaling with a standard architecture (ISA-95 naming, MQTT/OPC UA, central data store), then move to predictive maintenance and quality analytics.

# Cheatsheet

## Concepts

Industry 4.0 = CPS + IIoT + cloud/edge + analytics/AI · IT/OT convergence · vertical (sensor→ERP) and horizontal (supply chain) integration · Industry 5.0 = human-centric, resilient, sustainable.

## Levels & systems

ISA-95: 0 field · 1 PLC · 2 SCADA/HMI · 3 MES/historian · 4 ERP. ERP plans (days), MES executes (minutes), PLC controls (ms).

## OEE

`OEE = Availability × Performance × Quality` · A = run/planned · P = ideal cycle × count / run · Q = good/total · six big losses · world class ≈ 85 %.

## Protocols

OPC UA (machine access, information model, security) · MQTT (pub/sub, QoS 0/1/2, retained, LWT) · Sparkplug B (namespace + birth/death) · Unified Namespace on an MQTT broker.

## Use cases

Real-time OEE & downtime · traceability/genealogy · SPC & quality · predictive maintenance · energy monitoring · digital twin & virtual commissioning · computer-vision inspection · AI assistants.

## .NET stack

Worker Service edge (OPC UA .NET, NModbus, MQTTnet) · IoT Hub/Event Hubs · ASP.NET Core API + SignalR · SQL Server (RLS, columnstore, partitions) + time-series DB · Angular/React dashboards · Docker/K8s · OpenTelemetry.
