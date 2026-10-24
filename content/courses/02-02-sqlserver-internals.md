---
slug: sqlserver-internals
title: SQL Server Internals — How the Database Engine Really Works
track: data
order: 2
group: SQL Server
icon: SQLi
color: #a61e1e
summary: The SQL Server architecture (protocol layer, relational engine, storage engine, SQLOS), the life of a query from TDS packet to result, pages, extents and allocation maps, heaps vs clustered tables and B+ tree index structure, row layout, statistics and cardinality estimation, the query optimizer and plan cache, parameter sniffing, execution plan operators and join algorithms, buffer pool and memory grants, the transaction log, write-ahead logging, checkpoints and recovery, locking, latches, isolation levels, row versioning and tempdb, deadlocks, waits and DMVs, columnstore and In-Memory OLTP.
---

# Overview

SQL Server looks simple from outside — you send T-SQL and get rows — but inside it is an operating system of its own. Understanding it explains **why** indexes help, **why** a query is slow, **why** blocking and deadlocks happen and **how** data survives a crash.

```text
Client (ADO.NET / EF / SSMS)
   │  TDS (Tabular Data Stream) over TCP 1433
┌──▼──────────────────────────────────────────────────────────┐
│ PROTOCOL LAYER (SNI) — connections, TDS packets               │
├──────────────────────────────────────────────────────────────┤
│ RELATIONAL ENGINE (query processor)                           │
│   Parser → Algebrizer (binding) → Query Optimizer → Executor   │
│   Plan cache                                                   │
├──────────────────────────────────────────────────────────────┤
│ STORAGE ENGINE                                                 │
│   Access methods (scans, seeks, B-trees, heaps)                │
│   Buffer manager (buffer pool)  ·  Transaction manager         │
│   Lock manager  ·  Log manager                                 │
├──────────────────────────────────────────────────────────────┤
│ SQLOS — schedulers, workers, memory, waits, I/O, deadlock detection │
└──────────────────────────────────────────────────────────────┘
   Data files (.mdf/.ndf, 8 KB pages)     Log file (.ldf, sequential)     tempdb
```

# Versions

| Version | Year | Internals milestones |
|---|---|---|
| SQL Server 7.0 | 1998 | Rewritten storage engine: 8 KB pages, row-level locking, cost-based optimizer |
| 2000 | 2000 | Indexed views, user-defined functions |
| 2005 | 2005 | **Row versioning** (snapshot isolation, RCSI), DMVs, partitioning, SQLOS |
| 2008 / R2 | 2008–2010 | Data compression, filtered indexes, Extended Events, Resource Governor |
| 2012 | 2012 | **Columnstore** indexes, AlwaysOn Availability Groups |
| 2014 | 2014 | **In-Memory OLTP** (Hekaton), new cardinality estimator (CE 120) |
| 2016 | 2016 | **Query Store**, temporal tables, updatable columnstore improvements |
| 2017 | 2017 | Linux support, adaptive query processing |
| 2019 | 2019 | Intelligent Query Processing (scalar UDF inlining, table variable deferred compilation), **Accelerated Database Recovery** |
| 2022 | 2022 | Parameter Sensitive Plan optimisation, DOP/CE feedback, ledger tables, Query Store on by default for new DBs |
| 2025 | 2025 | Vector data type and vector search, native JSON type, regex functions, optimized locking |

# Lifecycle

**Life of a query — `SELECT Name FROM dbo.Customers WHERE Id = 42`:**

1. **Connect** — the client opens a TCP connection (pooled by ADO.NET), authenticates, gets a session (SPID).
2. **Send** — the batch arrives as TDS packets; a **worker thread** on a **scheduler** (one per CPU core) picks it up.
3. **Parse** — syntax check → parse tree.
4. **Algebrize (bind)** — resolve names (tables, columns, types), check permissions → query tree.
5. **Plan cache lookup** — hash the query text; if a cached plan exists, reuse it (skip optimisation).
6. **Optimize** — cost-based optimizer uses **statistics** to estimate rows, explores alternatives (indexes, join orders and algorithms) and chooses the cheapest **execution plan**; plan stored in cache.
7. **Execute** — the executor runs plan operators; the storage engine reads needed **pages** through the **buffer pool** (from memory if cached, otherwise physical reads from disk).
8. **Lock** — shared locks (or row versions) protect consistency according to the isolation level.
9. **Return** — rows are streamed back in TDS packets; locks released per isolation rules.

For a **write**: the change is applied to pages **in memory**, the log record is written to the **transaction log** first (write-ahead logging), and on `COMMIT` the log is hardened to disk; dirty data pages are written later by checkpoint/lazy writer.

# Tools

- **SSMS** — actual/estimated execution plans, Live Query Statistics, Activity Monitor, Query Store reports.
- **DMVs** — `sys.dm_exec_requests`, `sys.dm_exec_sessions`, `sys.dm_exec_query_stats`, `sys.dm_os_wait_stats`, `sys.dm_tran_locks`, `sys.dm_db_index_physical_stats`, `sys.dm_db_index_usage_stats`, `sys.dm_exec_query_plan`.
- **Extended Events** (replaces SQL Profiler), `system_health` session (deadlock graphs).
- **Query Store** — plan history, regressions, forcing plans.
- **DBCC** — `DBCC PAGE`, `DBCC IND` (undocumented; learning), `DBCC SHOW_STATISTICS`, `DBCC CHECKDB`, `DBCC SQLPERF(LOGSPACE)`.
- Community: `sp_WhoIsActive`, First Responder Kit (`sp_Blitz`, `sp_BlitzIndex`, `sp_BlitzCache`), SentryOne Plan Explorer.

# Module: Architecture and Storage

## Lesson: [Intermediate|High] Engine components and SQLOS — schedulers, workers and waits

| Component | Responsibility |
|---|---|
| Protocol layer (SNI) | Network connections, TDS protocol, shared memory/TCP/named pipes |
| Command parser & algebrizer | Syntax and name/type resolution |
| Query optimizer | Builds the execution plan from statistics and costs |
| Query executor | Runs plan operators, requests data from access methods |
| Access methods | Code that scans heaps, seeks/scans B-trees, inserts/updates rows |
| Buffer manager | Manages the **buffer pool** (cached data pages in RAM) |
| Transaction manager / log manager | Transactions, write-ahead logging, recovery |
| Lock manager | Locks for concurrency control; deadlock detection (every 5 s by default, faster when deadlocks are found) |
| **SQLOS** | SQL Server's "OS layer": cooperative scheduling, memory management, I/O, waits |

**Scheduling:** SQLOS creates one **scheduler** per logical CPU. Each task (a request or part of a parallel query) runs on a **worker** (thread). Workers **yield cooperatively**; when a task must wait (for a page read, a lock, a log flush, memory, network), it goes to a waiting list with a **wait type**. When the resource is ready it moves to the runnable queue.

```text
RUNNING ──needs resource──▶ SUSPENDED (wait type, e.g. PAGEIOLATCH_SH) ──resource ready──▶ RUNNABLE (waiting for CPU = signal wait) ──▶ RUNNING
```

**Wait statistics** tell you what SQL Server spends time waiting on:

| Wait type | Means | Typical cause |
|---|---|---|
| `PAGEIOLATCH_*` | Waiting to read data pages from disk | Missing indexes (big scans), not enough memory, slow storage |
| `LCK_M_*` | Waiting for a lock | Blocking — long transactions, missing indexes |
| `WRITELOG` | Waiting for log flush on commit | Slow log disk, many tiny transactions |
| `CXPACKET` / `CXCONSUMER` | Parallelism coordination | Large parallel queries; tune MAXDOP/cost threshold |
| `SOS_SCHEDULER_YIELD` | CPU pressure | CPU-heavy queries |
| `RESOURCE_SEMAPHORE` | Waiting for a memory grant | Big sorts/hashes, bad estimates |
| `ASYNC_NETWORK_IO` | Client isn't consuming results fast enough | App reads rows slowly or fetches too much |

```sql
SELECT TOP 10 wait_type, wait_time_ms / 1000.0 AS wait_s, waiting_tasks_count
FROM sys.dm_os_wait_stats
WHERE wait_type NOT LIKE 'SLEEP%' AND wait_type NOT IN ('BROKER_TASK_STOP','XE_TIMER_EVENT','REQUEST_FOR_DEADLOCK_SEARCH','LAZYWRITER_SLEEP','CHECKPOINT_QUEUE')
ORDER BY wait_time_ms DESC;
```

## Lesson: [Intermediate|High] Pages, extents, files and allocation maps

- A database has at least one **data file** (`.mdf`, plus optional `.ndf` in **filegroups**) and one **log file** (`.ldf`).
- Data files are divided into **pages of 8 KB** (8,192 bytes: 96-byte header, row data, **row offset array** at the end). Maximum in-row data ≈ 8,060 bytes per row.
- 8 contiguous pages = an **extent** (64 KB). **Mixed extents** (shared by objects) vs **uniform extents** (one object; default for new allocations since SQL Server 2016).

| Page type | Holds |
|---|---|
| Data | Rows of heaps and clustered index leaf level |
| Index | Non-leaf index levels and nonclustered index rows |
| Text/Image (LOB), row-overflow | `NVARCHAR(MAX)`, `VARBINARY(MAX)`, rows that exceed 8,060 bytes |
| **GAM / SGAM** | Global Allocation Map — which extents are free / mixed extents with free pages (each covers ~4 GB) |
| **PFS** | Page Free Space — how full each page is (covers ~64 MB) |
| **IAM** | Index Allocation Map — which extents belong to a given table/index partition |
| DCM / BCM | Changed extents since last full backup / bulk-logged operations |
| Boot page, file header | Database and file metadata |

**Row structure (FixedVar format):** status bits, fixed-length columns, **null bitmap**, variable-length column count and offset array, variable-length data. That's why fixed-length types (`INT`, `CHAR(10)`) are laid out first and `VARCHAR` columns need offsets.

```sql
-- See how many pages a table uses and how full they are
SELECT index_id, index_type_desc, page_count, avg_page_space_used_in_percent, avg_fragmentation_in_percent, record_count
FROM sys.dm_db_index_physical_stats(DB_ID(), OBJECT_ID('dbo.Orders'), NULL, NULL, 'DETAILED');
```

## Lesson: [Intermediate|High] Heaps, clustered and nonclustered indexes — B+ tree internals

**Heap** — a table without a clustered index: rows stored in no particular order, located by a **RID** (file:page:slot). Updates that grow a row may leave **forwarding pointers**. Fine for staging tables; usually bad for OLTP.

**Clustered index** — the table itself **is** a B+ tree ordered by the clustering key: root page → intermediate pages → **leaf pages containing the full rows**. One per table.

**Nonclustered index** — a separate B+ tree on chosen key columns; leaf rows contain the key + a **row locator**: the clustering key (if the table is clustered) or the RID (heap). Up to 999 per table.

```text
Clustered index on Orders(OrderId)                  Nonclustered index on Orders(CustomerId) INCLUDE (Total)
        [Root: 1 | 50,001 | 100,001]                         [Root: ... ]
       /            |              \                          /        \
 [Intermediate ...]                                    [Leaf: CustomerId, Total, OrderId(locator)]
 [Leaf pages: full rows ordered by OrderId]              → "key lookup" into the clustered index for other columns
```

| Operation | What it does | Cost |
|---|---|---|
| **Index seek** | Navigate root → leaf to a key or range | ~3–4 page reads for millions of rows |
| **Index/table scan** | Read all leaf pages | Proportional to table size |
| **Key lookup** (bookmark lookup) | For each row found in a nonclustered index, fetch missing columns from the clustered index | 1 seek per row — expensive for many rows |
| **Covering index** | Nonclustered index containing all needed columns (keys + `INCLUDE`) | No lookups |

**Choosing a clustered key:** narrow (it's copied into every nonclustered index), unique, static (never updated) and ever-increasing (`INT IDENTITY`, `BIGINT`, sequential GUID) to avoid **page splits**. Random `NEWID()` GUID keys cause splits and fragmentation.

**Page splits and fill factor:** inserting into a full page splits it into two half-full pages (expensive, logged, causes fragmentation). `FILLFACTOR = 90` leaves 10 % free space on leaf pages at rebuild time for tables with random inserts.

**Fragmentation:** logical order of pages ≠ physical order and/or low page density. Rebuild (`ALTER INDEX ... REBUILD`) or reorganise based on measurement; on SSDs, page density (wasted space) matters more than physical order.

```sql
CREATE CLUSTERED INDEX CIX_Orders ON dbo.Orders(OrderId);
CREATE NONCLUSTERED INDEX IX_Orders_Customer_Date ON dbo.Orders(CustomerId, OrderDate DESC) INCLUDE (Total, Status)
    WITH (FILLFACTOR = 95, ONLINE = ON);
CREATE INDEX IX_Orders_Open ON dbo.Orders(OrderDate) WHERE Status = 'Open';   -- filtered index
```

# Module: Query Processing

## Lesson: [Advanced|High] Statistics, cardinality estimation and the query optimizer

The optimizer is **cost-based**: it estimates how many rows each step will produce (**cardinality**) and picks the plan with the lowest estimated cost (CPU + I/O). Estimates come from **statistics**:

- A **histogram** of up to **200 steps** on the first column of the statistics object (values and row counts per range).
- **Density** vectors for column combinations (average uniqueness).
- Created automatically for indexes and for columns used in predicates (`AUTO_CREATE_STATISTICS`), updated automatically after enough changes (`AUTO_UPDATE_STATISTICS`; dynamic threshold ≈ √(1000 × rows) since SQL Server 2016 / compat level 130).

```sql
DBCC SHOW_STATISTICS ('dbo.Orders', 'IX_Orders_Customer_Date') WITH HISTOGRAM;
UPDATE STATISTICS dbo.Orders WITH FULLSCAN;    -- after big data loads
SELECT * FROM sys.dm_db_stats_properties(OBJECT_ID('dbo.Orders'), 2);   -- last updated, rows sampled, modification counter
```

**Optimisation phases:** trivial plan (simple queries — no costing needed) → simplification (remove redundant joins, push predicates) → cost-based search in stages (transaction processing → quick plan → full optimisation), stopping when a "good enough" plan is found or a time budget ends.

**Things that break estimates:** stale statistics, functions on columns (`WHERE YEAR(OrderDate) = 2026`), implicit conversions (NVARCHAR parameter vs VARCHAR column), table variables (estimated 1 row before SQL Server 2019's deferred compilation), multi-statement table-valued functions, local variables (optimizer can't see the value), correlated columns, complex OR/LIKE predicates.

**SARGable predicates** (Search ARGument-able) let the optimizer seek:

```sql
-- ❌ Non-SARGable: function on the column → scan
WHERE YEAR(OrderDate) = 2026
WHERE LEFT(Email, 3) = 'abc'
WHERE CustomerCode = 12345            -- CustomerCode is VARCHAR → implicit conversion of the column
-- ✅ SARGable rewrites → seek
WHERE OrderDate >= '2026-01-01' AND OrderDate < '2027-01-01'
WHERE Email LIKE 'abc%'
WHERE CustomerCode = '12345'
```

## Lesson: [Advanced|High] Plan cache, parameter sniffing and Query Store

Compiled plans are stored in the **plan cache** keyed by the exact query text (and SET options). Parameterised queries (stored procedures, `sp_executesql`, ADO.NET/EF/Dapper parameters) are compiled once and reused.

**Parameter sniffing:** the first execution's parameter values are used to optimise the plan; later executions with very different values reuse it. Example: `@CustomerId = 1` (10 rows) gets a seek + key lookup plan; then a big customer with 2 million rows reuses it → millions of lookups → very slow.

| Fix | Trade-off |
|---|---|
| `OPTION (RECOMPILE)` | Fresh plan every execution — CPU cost; great for rare, varied reports |
| `OPTION (OPTIMIZE FOR (@p = value / UNKNOWN))` | Plan for typical/average values |
| Better index (covering) | Makes the plan good for all values — best fix |
| Split procedures by case | More code |
| Query Store plan forcing | Pins a known good plan |
| SQL Server 2022 **PSP optimisation** | Automatically keeps multiple plans per parameter range |

```sql
-- Top CPU queries currently in cache
SELECT TOP 10 qs.total_worker_time / qs.execution_count AS avg_cpu, qs.execution_count,
       SUBSTRING(st.text, (qs.statement_start_offset/2)+1, 200) AS query_text, qp.query_plan
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
ORDER BY qs.total_worker_time DESC;
```

**Query Store** (database-level flight recorder): stores queries, plans and runtime statistics over time; shows **regressed queries** after a deployment or stats update; lets you **force** a previous good plan. Enabled by default for new databases in SQL Server 2022 and in Azure SQL.

Plan cache pollution: ad-hoc queries with literals (`WHERE Id = 1`, `WHERE Id = 2` …) each get their own plan — use parameters; consider `optimize for ad hoc workloads`.

## Lesson: [Advanced|High] Reading execution plans — operators and join algorithms

Plans are read **right to left** (data flow) and **top to bottom**; each arrow's thickness shows the row count. Compare **estimated vs actual rows** — big differences point to statistics/estimation problems.

| Operator | Meaning |
|---|---|
| Clustered Index **Seek** / Index Seek | Navigated the B-tree to specific keys — good for selective predicates |
| Clustered Index **Scan** / Table Scan | Read the whole table/index — fine for small tables or when most rows are needed |
| **Key Lookup** / RID Lookup | Fetch extra columns per row — fix with a covering index if many rows |
| **Nested Loops** join | For each outer row, look up matching inner rows — best when outer input is small and inner side has an index |
| **Merge Join** | Both inputs sorted on the join key — stream and match; efficient for large sorted inputs |
| **Hash Match** join/aggregate | Build a hash table on the smaller input, probe with the other — good for large unsorted inputs; needs a **memory grant** |
| **Sort** | Orders rows — needs memory; spills to tempdb if under-estimated |
| Stream Aggregate / Hash Aggregate | GROUP BY on sorted / unsorted input |
| Compute Scalar, Filter | Expressions; filtering after reading (a late filter is a hint of non-SARGable predicates) |
| Spool | Stores intermediate results for reuse |
| Parallelism (Gather/Repartition Streams) | Parallel plan exchanges |

Warnings to look for: **implicit conversion** warnings, **spills** to tempdb (Sort/Hash warnings), **missing index** suggestions (evaluate, don't blindly create), huge estimated vs actual gaps, key lookups executed thousands of times.

```sql
SET STATISTICS IO, TIME ON;          -- logical reads per table + CPU/elapsed time
SELECT o.OrderId, o.Total FROM dbo.Orders o WHERE o.CustomerId = 42 ORDER BY o.OrderDate DESC;
-- Messages tab: Table 'Orders'. Scan count 1, logical reads 4 ...  → compare before/after an index
```

## Lesson: [Intermediate|High] Memory — buffer pool, plan cache and memory grants

| Memory area | Holds |
|---|---|
| **Buffer pool** | 8 KB data/index pages read from disk (clean and dirty pages) — usually the largest consumer |
| Plan cache | Compiled execution plans |
| Query workspace (memory grants) | Sorts, hash joins/aggregates during execution |
| Lock memory, connections, CLR, columnstore object pool, In-Memory OLTP | Other components |

- **Logical read** = page read from the buffer pool; **physical read** = page had to come from disk first. Tuning aims to reduce logical reads (less data touched).
- The **lazy writer** frees memory by writing dirty pages and evicting least-recently-used pages when memory is needed; **Page Life Expectancy** indicates how long pages stay cached.
- SQL Server takes as much memory as allowed — always set **max server memory** to leave RAM for the OS and other processes.
- **Memory grants** are reserved before a query runs based on estimates; under-estimates cause **spills to tempdb**, over-estimates waste memory and cause `RESOURCE_SEMAPHORE` waits (memory grant feedback in 2019+ adjusts this automatically).

# Module: Transactions, Logging and Concurrency

## Lesson: [Advanced|High] The transaction log, write-ahead logging, checkpoint and recovery

**Write-ahead logging (WAL):** every change is first recorded in the **transaction log** (sequential writes, each record with an **LSN** — log sequence number). A transaction is committed when its log records are **hardened** (flushed) to the log file. Data pages are changed in memory and written to data files later.

**Checkpoint** periodically writes dirty data pages to disk (indirect checkpoints with a target recovery time, default 60 s for new databases), limiting how much log must be replayed after a crash.

**Crash recovery** on startup (per database):

1. **Analysis** — read the log from the last checkpoint, find dirty pages and active transactions.
2. **Redo** — replay committed (and uncommitted) changes not yet in data files (roll forward).
3. **Undo** — roll back transactions that were active at the crash.

**Accelerated Database Recovery (ADR, 2019)** keeps row versions in a persistent version store so undo is near-instant and long-running transaction rollbacks don't take hours.

The log is divided into **virtual log files (VLFs)**; space is reused (truncated) only when no longer needed by active transactions, replication, availability groups or — in the FULL model — until a **log backup**.

| Recovery model | Log behaviour | Point-in-time restore |
|---|---|---|
| SIMPLE | Log truncated at checkpoint | No (only to full/differential backups) |
| FULL | Log kept until log backup | Yes |
| BULK_LOGGED | Minimal logging for bulk operations | Limited during bulk ops |

Common problem: FULL recovery without log backups → **log file grows until the disk is full**. Check `SELECT name, log_reuse_wait_desc FROM sys.databases`.

## Lesson: [Advanced|High] Locking, latches, isolation levels and row versioning

**Locks** protect logical consistency of data between transactions:

| Mode | Used for | Compatible with |
|---|---|---|
| Shared (S) | Reading | S, U, IS |
| Update (U) | Reading a row you intend to update (prevents a common deadlock) | S, IS |
| Exclusive (X) | Writing | Nothing |
| Intent (IS, IX, SIX) | Signal locks at a lower level (on table/page above a row) | Allows fast checks |
| Schema (Sch-S, Sch-M) | Compiling / altering objects | Sch-M blocks everything |

**Granularity:** row (key/RID) → page → partition → table (object). **Lock escalation** converts many row/page locks (~5,000 on one object) into a table lock to save memory — can cause sudden blocking.

**Latches** are lightweight internal locks protecting in-memory structures (pages in the buffer pool) for very short durations — e.g. `PAGELATCH_EX` contention on the last page of an ever-increasing key under heavy inserts (fix: `OPTIMIZE_FOR_SEQUENTIAL_KEY`, partitioning, hash keys).

**Isolation levels:**

| Level | Dirty read | Non-repeatable read | Phantom | How |
|---|---|---|---|---|
| READ UNCOMMITTED (`NOLOCK`) | ✅ possible | ✅ | ✅ | No shared locks — may read uncommitted, duplicated or missing rows |
| **READ COMMITTED** (default) | ❌ | ✅ | ✅ | Shared locks released after each read |
| REPEATABLE READ | ❌ | ❌ | ✅ | Shared locks held until commit |
| SERIALIZABLE | ❌ | ❌ | ❌ | Key-range locks |
| **READ COMMITTED SNAPSHOT (RCSI)** | ❌ | ✅ | ✅ | Readers read the last committed version — readers don't block writers |
| SNAPSHOT | ❌ | ❌ | ❌ | Whole transaction sees a consistent snapshot; update conflicts raise an error |

**Row versioning:** with RCSI/SNAPSHOT, updates keep the previous row version in the **version store** (tempdb, or the persistent version store with ADR); readers follow the version chain. Benefit: far less blocking between readers and writers (Azure SQL Database uses RCSI by default). Cost: tempdb usage and a 14-byte versioning tag per row.

```sql
ALTER DATABASE Shop SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;

-- Who is blocking whom right now?
SELECT r.session_id, r.blocking_session_id, r.wait_type, r.wait_time, t.text
FROM sys.dm_exec_requests r CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id <> 0;
```

## Lesson: [Intermediate|High] Deadlocks, tempdb and how they relate to app design

**Deadlock:** two sessions each hold a lock the other needs. The lock monitor detects the cycle and kills the cheaper transaction (**deadlock victim**, error **1205**); the application should retry.

```text
Session A: UPDATE Orders (row 1, X lock) → then wants Customers (row 7)
Session B: UPDATE Customers (row 7, X lock) → then wants Orders (row 1)   → cycle → one is the victim
```

Prevention: access tables in the **same order**, keep transactions **short** (no user interaction or HTTP calls inside), index foreign keys and search columns (fewer rows locked), use RCSI so reads don't take shared locks, use `UPDLOCK` for read-then-update patterns, and retry 1205 in code. Capture graphs from the `system_health` Extended Events session.

**tempdb** — shared by the whole instance: temporary tables (`#t`), table variables, sort/hash spills, version store, index rebuilds with `SORT_IN_TEMPDB`, internal worktables. Best practices: multiple equally sized data files (typically 1 per core up to 8) to reduce allocation contention, fast storage, memory-optimised tempdb metadata (2019+).

## Lesson: [Advanced|Medium] Columnstore, In-Memory OLTP and other storage options

**Columnstore indexes** store data **by column** in compressed segments (rowgroups of ~1 million rows), with **batch mode** execution processing ~900 rows at a time. Huge gains (10× compression, 10–100× faster) for analytics and aggregations over millions of rows; less suited to single-row lookups and frequent small updates (delta store + tuple mover handle inserts).

```sql
CREATE CLUSTERED COLUMNSTORE INDEX CCI_FactSales ON dbo.FactSales;            -- data warehouse fact table
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_Orders ON dbo.Orders(OrderDate, Total, Status);   -- real-time analytics on OLTP
```

**In-Memory OLTP (Hekaton):** memory-optimised tables with lock- and latch-free structures (hash and range indexes), optimistic multi-versioning and natively compiled stored procedures — for extreme insert/update rates (session state, queues, IoT ingestion). Durable (`SCHEMA_AND_DATA`) or not.

**Partitioning:** split a large table by a column (usually date) into partitions on filegroups — partition elimination, fast archiving with `SWITCH`, per-partition index maintenance. It's mainly a **manageability** feature; queries without the partition key don't get faster.

**Compression:** row and page compression reduce I/O and memory at some CPU cost.

# Interview

## [Beginner|High] What is the difference between a clustered and a nonclustered index?

A clustered index defines the physical order of the table: its B+ tree leaf level contains the actual data rows, so there can be only one. A nonclustered index is a separate B+ tree whose leaf rows contain the index key plus a pointer (the clustering key or RID) to the data row; there can be many. Queries needing columns not in a nonclustered index do key lookups into the clustered index.

## [Beginner|High] What is a page and an extent in SQL Server?

A page is the basic 8 KB unit of storage and I/O, holding rows (≈8,060 bytes max in-row data) with a header and a row offset array. An extent is 8 contiguous pages (64 KB); SQL Server allocates space in extents. Special pages (GAM, SGAM, PFS, IAM) track which extents and pages are free or belong to which object.

## [Beginner|High] What are the transaction isolation levels in SQL Server?

READ UNCOMMITTED (dirty reads possible), READ COMMITTED (default; no dirty reads), REPEATABLE READ (rows you read can't change), SERIALIZABLE (no phantoms — range locks) plus row-versioning options READ COMMITTED SNAPSHOT (statement-level consistent versions, readers don't block writers) and SNAPSHOT (transaction-level consistent snapshot with update-conflict detection).

## [Beginner|High] What is an execution plan and how do you read it?

The step-by-step strategy the optimizer chose to run a query (operators like seeks, scans, joins, sorts). Read it right to left following the data flow, check the most expensive operators, compare estimated vs actual row counts, and look for scans on large tables, key lookups repeated many times, sorts/hash spills, implicit conversion and missing-index warnings. Use `SET STATISTICS IO` to measure logical reads before and after a change.

## [Intermediate|High] How does SQL Server process a query internally?

Connection and TDS packets → parser (syntax) → algebrizer (binding names and types) → plan cache lookup → cost-based optimizer using statistics to choose a plan (cached) → executor runs the operators → storage engine reads pages via the buffer pool (from disk if not cached), taking locks or reading row versions per isolation level → rows streamed back to the client.

## [Intermediate|High] What are statistics and why do they matter?

Objects with a histogram (up to 200 steps) and density information about column value distributions, used by the optimizer to estimate how many rows each operation returns. Good estimates → good plans (right join type, memory grant, index choice). Stale or missing statistics lead to bad plans; they're auto-created/updated, and can be updated manually (`UPDATE STATISTICS ... WITH FULLSCAN`) after large data changes.

## [Intermediate|High] What is parameter sniffing? How do you fix it?

SQL Server compiles a parameterised query or procedure using the parameter values of the first execution and reuses that plan for all later values. If data is skewed, the plan can be terrible for other values. Fixes: a covering index that suits all values, `OPTION (RECOMPILE)`, `OPTIMIZE FOR`, splitting logic, forcing a good plan with Query Store, or SQL Server 2022's Parameter Sensitive Plan optimisation.

## [Intermediate|High] What is write-ahead logging and how does SQL Server recover after a crash?

Every modification is written to the transaction log (with an LSN) before the data page changes reach disk, and a commit waits until its log records are hardened. After a crash, recovery runs analysis (find dirty pages and open transactions), redo (replay logged changes since the last checkpoint) and undo (roll back uncommitted transactions), returning the database to a consistent state.

## [Intermediate|High] What causes blocking and how do you troubleshoot it?

A session holding locks (usually a long or open transaction, or one scanning many rows because of missing indexes) blocks others needing incompatible locks. Find it with `sys.dm_exec_requests` (`blocking_session_id`), `sp_WhoIsActive`, and the head blocker's query/plan; fix by shortening transactions, adding indexes, committing promptly from the app, and enabling RCSI so readers don't block writers.

## [Intermediate|Medium] What is a key lookup and how do you remove it?

When a nonclustered index finds rows but the query needs columns not in that index, SQL Server looks up each row in the clustered index (key lookup) or heap (RID lookup). For many rows it's very expensive. Remove it by adding the needed columns to the index with `INCLUDE` (covering index), or selecting fewer columns.

## [Intermediate|Medium] What is the buffer pool?

The main memory area where SQL Server caches 8 KB data and index pages. Queries read pages from the buffer pool (logical reads); if a page isn't there it's read from disk first (physical read). Modified (dirty) pages are written back by checkpoint and the lazy writer. Set max server memory so the buffer pool doesn't starve the OS.

## [Intermediate|Medium] Latch vs lock?

Locks protect logical data consistency between transactions (rows, pages, tables), are held according to isolation level (possibly until commit) and are visible in `sys.dm_tran_locks`. Latches are lightweight, short-term internal synchronisation for in-memory structures like buffer pages and aren't controlled by isolation levels. Latch contention (`PAGELATCH_*`) appears with hot pages such as the last page of an identity key under heavy inserts.

## [Advanced|High] Why can NOLOCK be dangerous?

READ UNCOMMITTED doesn't take shared locks, so a query can read uncommitted data that later rolls back, read the same row twice or miss rows when pages split during an allocation-order scan, and still be blocked by schema locks. It's "fast but wrong". Use RCSI or SNAPSHOT for non-blocking consistent reads instead.

## [Advanced|Medium] When would you use a columnstore index?

For analytical queries scanning and aggregating millions of rows — data warehouse fact tables (clustered columnstore) or real-time reporting on OLTP tables (nonclustered columnstore). Column-wise compressed storage and batch-mode execution dramatically reduce I/O and CPU. Avoid as the only index for workloads of single-row lookups and frequent small updates.

## [Advanced|Medium] Why does the transaction log keep growing?

Log space can't be reused while something still needs it: in FULL/BULK_LOGGED recovery without regular log backups, long-running open transactions, replication or availability-group replicas behind, CDC. Check `log_reuse_wait_desc` in `sys.databases`; schedule log backups, find and end long transactions, and avoid shrinking repeatedly (causes VLF fragmentation).

## [Scenario|High] A query was fast yesterday and is slow today with no code change. How do you investigate?

Check Query Store for a plan change (regressed query) — often due to a statistics update, parameter sniffing with a different first value, or an index change. Compare old and new plans (estimated vs actual rows, seek vs scan, join types). Quick fix: force the good plan in Query Store; real fix: update statistics, add/adjust a covering index, or rewrite non-SARGable predicates. Also rule out blocking (`LCK_M_*` waits) and resource pressure (waits, memory, I/O).

## [Scenario|High] Users get "Transaction was deadlocked … chosen as the deadlock victim". What do you do?

Capture the deadlock graph from the `system_health` Extended Events session, identify the statements, objects and lock types. Typical fixes: access tables in a consistent order, keep transactions short, add indexes so fewer rows are locked (especially on foreign keys and WHERE columns), use `UPDLOCK` for read-then-write, enable RCSI to remove reader/writer conflicts — and add retry logic for error 1205 in the application.

## [Scenario|Medium] An insert-heavy table with an IDENTITY clustered key shows PAGELATCH_EX waits under load. Why and how to fix?

All inserts go to the last page of the B-tree, so many threads compete for the latch on that single hot page. Options: `OPTIMIZE_FOR_SEQUENTIAL_KEY = ON` (2019+), a hash-partitioned table, a different clustering key spreading inserts (with trade-offs like page splits), In-Memory OLTP for extreme rates, or batching inserts.

# Cheatsheet

## Architecture

Protocol (TDS) → Relational engine (parse, bind, optimise, execute, plan cache) → Storage engine (access methods, buffer pool, locks, log) → SQLOS (schedulers, workers, waits).

## Storage

Page 8 KB · extent 64 KB · GAM/SGAM/PFS/IAM · heap (RID) vs clustered B+ tree (rows at leaf) · nonclustered (key + locator) · INCLUDE = covering · good clustered key: narrow, unique, static, increasing.

## Optimizer

Statistics (200-step histogram) → cardinality estimates → cheapest plan → plan cache · SARGable predicates · parameter sniffing fixes: index, RECOMPILE, OPTIMIZE FOR, Query Store forcing, PSP (2022).

## Plans

Right to left · seek vs scan · key lookup · nested loops (small outer) · merge (sorted) · hash (large unsorted, memory) · spills · implicit conversions · estimated vs actual rows.

## Transactions

WAL + LSN · commit = log hardened · checkpoint · recovery: analysis, redo, undo · ADR · recovery models SIMPLE/FULL/BULK_LOGGED · log backups in FULL.

## Concurrency

Locks S/U/X/intent/schema · escalation ~5,000 locks · latches = internal · isolation RU/RC/RR/SER + RCSI/SNAPSHOT (version store) · deadlock = error 1205 → retry + same access order + short transactions.

## Key waits

PAGEIOLATCH (disk reads) · LCK_M (blocking) · WRITELOG (log disk) · CXPACKET (parallelism) · SOS_SCHEDULER_YIELD (CPU) · RESOURCE_SEMAPHORE (memory grants) · ASYNC_NETWORK_IO (client).
