---
slug: computer-fundamentals
title: How Computers Work — CPU, Memory, OS, Processes and Threads
track: foundations
order: 1
group: How Computers Work
icon: CPU
color: #495057
summary: What happens inside a computer when your program runs — bits and bytes, the CPU and instruction cycle, the memory hierarchy (registers, cache, RAM, disk), stack vs heap, virtual memory and paging, the operating system, processes and threads, scheduling, concurrency problems, compilation vs interpretation, and how all of it shows up in .NET and SQL Server.
---

# Overview

Every program you write — a C# API, a SQL query, a React page — finally runs as instructions on a **CPU** reading and writing **memory**, managed by an **operating system**. Knowing this layer explains things that otherwise look like magic: why a cache makes things fast, why the heap needs a garbage collector, why threads cause race conditions, why a query that reads from disk is slow.

| Layer | What it does | Example |
|---|---|---|
| Hardware | CPU, RAM, disk/SSD, network card | Intel/AMD/ARM CPU, 16 GB RAM, NVMe SSD |
| Operating system | Manages hardware, memory, processes, files, network | Windows, Linux |
| Runtime | Runs your managed code, manages memory | .NET CLR, JVM, Node.js (V8) |
| Your program | Business logic | ASP.NET Core API, SQL Server, browser |

# Versions

| Era | Milestone |
|---|---|
| 1945 | Von Neumann architecture — program and data stored in the same memory |
| 1971 | Intel 4004, first commercial microprocessor |
| 1978–1985 | x86 (8086) and 32-bit 80386 with protected/virtual memory |
| 1990s | CPU caches on chip, pipelining, superscalar execution; Windows NT, Linux |
| 2003–2005 | 64-bit x86 (AMD64); multi-core CPUs become standard |
| 2010s | SSDs replace HDDs; many cores; ARM in phones; cloud virtual machines |
| 2020s | Apple Silicon/ARM servers (AWS Graviton, Azure Cobalt), NVMe, GPUs/NPUs for AI |

# Lifecycle

**Life of a program run:**

1. **Source code** → compiler → machine code or intermediate code (IL for .NET).
2. You start it → the **OS creates a process**: virtual address space, loads the executable and libraries, creates the main **thread**.
3. The runtime (CLR) starts, JIT-compiles methods to machine code as they are first called.
4. The **CPU executes** instructions: fetch → decode → execute → write back, millions per millisecond, using registers and caches.
5. Data lives on the **stack** (method calls, locals) and the **heap** (objects); the OS maps virtual pages to physical RAM.
6. I/O (disk, network) is requested from the OS; the thread waits or continues asynchronously.
7. On exit the OS frees all memory, handles and threads of the process.

# Tools

- **Windows:** Task Manager, Resource Monitor, Performance Monitor (PerfMon), Process Explorer, Windows Performance Analyzer.
- **Linux:** `top`/`htop`, `ps`, `free -h`, `vmstat`, `iostat`, `lsof`, `perf`.
- **.NET:** `dotnet-counters`, `dotnet-trace`, `dotnet-dump`, Visual Studio Diagnostic Tools, PerfView, BenchmarkDotNet.
- **Learning:** godbolt.org (see machine code), SharpLab.io (see IL and JIT assembly for C#).

# Module: Data and the CPU

## Lesson: [Basic|High] Bits, bytes, number systems and encoding

Computers store everything as **bits** (0/1). 8 bits = 1 **byte**.

| Unit | Size |
|---|---|
| Byte | 8 bits |
| KB / KiB | 1,000 / 1,024 bytes |
| MB, GB, TB | ×1,000 (or ×1,024 for MiB, GiB, TiB) |

**Number systems:** decimal (base 10), binary (base 2: `1011` = 11), hexadecimal (base 16: `0xFF` = 255; two hex digits = one byte).

**How data is represented:**

| Data | Representation |
|---|---|
| Integers | Binary, **two's complement** for negatives (`int` = 32 bits: −2,147,483,648 … 2,147,483,647) |
| Decimals | IEEE 754 floating point (`double` = 64 bits: sign, exponent, mantissa) — why 0.1 isn't exact |
| Text | Characters → numbers via encodings: ASCII (7-bit), **UTF-8** (1–4 bytes, the web standard), UTF-16 (.NET `string`/`char`, Windows) |
| Images, audio | Pixels/samples as numbers, usually compressed (JPEG, PNG, MP3) |

```csharp
Console.WriteLine(Convert.ToString(11, 2));           // 1011
Console.WriteLine(0xFF);                              // 255
byte[] utf8 = Encoding.UTF8.GetBytes("₹100");         // ₹ takes 3 bytes in UTF-8
Console.WriteLine(utf8.Length);                       // 6
Console.WriteLine("₹100".Length);                     // 4 UTF-16 chars
```

**Endianness:** order of bytes in multi-byte numbers — little-endian (x86, ARM usually) stores the least significant byte first; network protocols use big-endian ("network byte order").

## Lesson: [Basic|High] How the CPU executes instructions

The **CPU** (central processing unit) runs a simple loop billions of times per second (clock speed, e.g. 3.5 GHz):

```text
FETCH   next instruction from memory (address in the program counter)
DECODE  what it means (add, load, compare, jump …)
EXECUTE in the ALU (arithmetic/logic unit) or load/store unit
WRITE   result back to a register or memory → move to next instruction
```

Main parts:

| Part | Role |
|---|---|
| **Registers** | Tiny, fastest storage inside the CPU (e.g. 16 general-purpose 64-bit registers on x64) |
| **ALU** | Does arithmetic and logic |
| **Control unit** | Decodes instructions, controls the flow |
| **Program counter** | Address of the next instruction |
| **Cache (L1/L2/L3)** | Fast copies of recently used memory |
| **Cores** | Independent execution units — a 8-core CPU runs 8 instruction streams at once (16 with hyper-threading/SMT) |

What a line of C# becomes (simplified x64):

```csharp
int total = price * qty + tax;
```

```text
mov  eax, [price]      ; load from memory into register
imul eax, [qty]        ; multiply
add  eax, [tax]        ; add
mov  [total], eax      ; store back to memory
```

**Speed tricks inside modern CPUs:** pipelining (overlap stages of several instructions), out-of-order execution, **branch prediction** (guessing `if` results — sorted data makes branches predictable and loops faster), SIMD vector instructions (process 4–16 numbers at once — `System.Numerics.Vector<T>` in .NET).

# Module: Memory

## Lesson: [Basic|High] The memory hierarchy — registers, cache, RAM, disk

| Level | Typical size | Approx. access time | Notes |
|---|---|---|---|
| Registers | < 1 KB | < 1 ns | Inside the core |
| L1 cache | 32–64 KB per core | ~1 ns | |
| L2 cache | 256 KB – 2 MB per core | ~3–5 ns | |
| L3 cache | 8–64 MB shared | ~10–20 ns | |
| **RAM** (main memory) | 8–512 GB | ~80–100 ns | Volatile — lost on power off |
| NVMe SSD | TBs | ~20–100 µs | Persistent |
| HDD | TBs | ~5–10 ms | Mechanical seek |
| Network (same datacenter) | — | ~0.5 ms round trip | |
| Network (across continents) | — | ~150 ms round trip | |

**Key idea:** each level is ~10× to 1000× slower than the one above. Data moves between cache and RAM in **cache lines** of 64 bytes, so reading memory **sequentially** (arrays) is much faster than jumping around (linked lists, scattered objects) — this is **locality of reference**.

```csharp
// Same work, very different speed: row-by-row walks memory sequentially (cache-friendly)
int[,] m = new int[5000, 5000];
long sum = 0;
for (int r = 0; r < 5000; r++) for (int c = 0; c < 5000; c++) sum += m[r, c];   // fast
for (int c = 0; c < 5000; c++) for (int r = 0; r < 5000; r++) sum += m[r, c];   // several times slower
```

This is also why **SQL Server keeps data pages in RAM (buffer pool)** and why caching (Redis, in-memory cache) speeds up applications: RAM is ~1000× faster than SSD and ~1,000,000× faster than a cross-continent network call.

## Lesson: [Basic|High] Stack vs heap — how program memory is laid out

A process's virtual memory is split into regions:

```text
High addresses
┌──────────────────────┐
│ Stack (per thread)    │  ← method calls, local variables, return addresses; grows down
│        ↓              │
│                       │
│        ↑              │
│ Heap                  │  ← objects created with new; managed by GC in .NET
├──────────────────────┤
│ Static/global data    │  ← static fields, constants
├──────────────────────┤
│ Code (text)           │  ← machine code (JIT output for .NET)
└──────────────────────┘
Low addresses
```

| | Stack | Heap |
|---|---|---|
| Stores | Call frames: parameters, locals, return address | Objects (class instances, arrays, strings) |
| Allocation | Move a pointer — extremely fast | Find space — fast in .NET (bump pointer), but needs cleanup |
| Freed | Automatically when the method returns | By the garbage collector (.NET/Java) or manually (`free`/`delete` in C/C++) |
| Size | Small (1 MB per thread by default on Windows) | Large (limited by RAM/address space) |
| Per | Thread | Process (shared by all threads) |
| Errors | Stack overflow (deep/infinite recursion) | Out of memory, leaks, fragmentation |

```csharp
void PlaceOrder()
{
    int qty = 3;                         // local value on the stack (inside PlaceOrder's frame)
    var order = new Order { Qty = qty }; // the reference 'order' is on the stack; the Order object is on the heap
    Save(order);                         // a new frame for Save is pushed on the stack
}                                        // frame popped: qty and the reference disappear; the Order object stays until GC finds it unreachable
```

**Stack overflow example:** `int F(int n) => F(n + 1);` — every call adds a frame until the 1 MB stack is full and the process crashes (in .NET a `StackOverflowException` cannot be caught).

## Lesson: [Intermediate|High] Virtual memory, paging and memory management by the OS

Each process sees its own **virtual address space** (e.g. 128 TB on 64-bit Windows/Linux). The OS and CPU (MMU) translate virtual addresses to physical RAM in fixed-size **pages** (usually 4 KB).

- **Isolation:** one process can't read another's memory → security and stability.
- **Overcommit:** processes can reserve more than physical RAM; pages are loaded only when touched.
- **Page fault:** accessing a page not in RAM → the OS loads it (from the page file/swap or the executable on disk). Too many = **thrashing** (system becomes extremely slow).
- **Memory-mapped files:** a file mapped into memory; reading memory reads the file (used by databases and the .NET loader).

Terms you see in Task Manager / monitoring:

| Term | Meaning |
|---|---|
| Working set | Pages of the process currently in physical RAM |
| Private bytes / commit | Memory the process has committed for itself (heap, stacks) |
| Virtual size | All reserved address space (often huge, mostly unused) |
| Page file / swap | Disk area used when RAM is full |

> **Interview tip:** "Memory leak in a managed app" usually means objects are still **referenced** (static lists, event handlers, caches without limits), so the GC is not allowed to free them — the OS sees private bytes grow until out-of-memory or the container is killed.

## Lesson: [Intermediate|High] How memory is managed: manual, reference counting and garbage collection

| Approach | How | Used by | Risks |
|---|---|---|---|
| Manual | `malloc/free`, `new/delete` | C, C++ | Leaks, use-after-free, double free |
| Reference counting | Each object counts references; freed at 0 | Swift, Python (plus cycle collector), COM, C++ `shared_ptr` | Cycles leak without extra work |
| Tracing **garbage collection** | Periodically find reachable objects from roots; free the rest | .NET, Java, JavaScript, Go | Pauses, extra memory |
| Ownership/borrowing | Compiler enforces single owner | Rust | Learning curve |

**Tracing GC in short (what .NET does):**

1. **Roots** — stack references, static fields, CPU registers, GC handles.
2. **Mark** — follow references from roots; everything reached is alive.
3. **Sweep/compact** — free unreachable objects; move live ones together to remove gaps (fragmentation) and update references.
4. **Generations** — new objects die young, so the GC checks young objects often (cheap) and old ones rarely.

The full .NET details (generations 0/1/2, Large Object Heap, workstation vs server GC, `IDisposable`, finalizers) are in the **.NET Internals** course.

# Module: Operating System, Processes and Threads

## Lesson: [Basic|High] What the operating system does

The **OS kernel** sits between programs and hardware:

| Job | What it means |
|---|---|
| Process management | Create/stop processes, schedule threads on CPU cores |
| Memory management | Virtual memory, paging, protection |
| File system | Files, folders, permissions (NTFS, ext4) |
| Device drivers & I/O | Disk, network, USB, GPU |
| Networking | TCP/IP stack, sockets |
| Security | Users, permissions, isolation |

**User mode vs kernel mode:** your code runs in user mode; when it needs the OS (read a file, send a packet, allocate pages) it makes a **system call**, the CPU switches to kernel mode, the kernel does the work and returns. System calls are relatively expensive — that's why buffering (reading 64 KB at once instead of one byte at a time) matters.

## Lesson: [Intermediate|High] Processes vs threads, scheduling and context switches

| | Process | Thread |
|---|---|---|
| What | A running program with its own address space and resources | A path of execution inside a process |
| Memory | Isolated from other processes | Shares the process heap with other threads; own stack and registers |
| Creation cost | High | Lower (still ~1 MB stack reserved, kernel object) |
| Communication | IPC: pipes, sockets, shared memory, queues | Shared variables (needs synchronisation) |
| Crash impact | Only that process | Unhandled exception kills the whole process |

**Scheduling:** the OS gives each runnable thread a **time slice** on a core, then switches to another — a **context switch** (save registers, load another thread's state, cache gets colder). Thousands of threads → lots of switching overhead. That's why .NET uses a **thread pool** (reuse a small number of threads) and **async/await** (don't hold a thread while waiting for I/O).

**Thread states:** new → ready → running → waiting/blocked (I/O, lock, sleep) → ready … → terminated.

```csharp
// Process-level info from .NET
var p = Process.GetCurrentProcess();
Console.WriteLine($"PID {p.Id}, threads {p.Threads.Count}, working set {p.WorkingSet64 / 1_048_576} MB");
Console.WriteLine($"Cores: {Environment.ProcessorCount}");
```

## Lesson: [Intermediate|High] Concurrency problems — race conditions, deadlocks and how to avoid them

**Concurrency** = several tasks in progress at once (may interleave on one core). **Parallelism** = tasks literally running at the same time on several cores.

| Problem | What happens | Fix |
|---|---|---|
| **Race condition** | Two threads read-modify-write shared data; updates get lost | Locks, atomic operations (`Interlocked`), immutable data, don't share |
| **Deadlock** | Thread A holds lock 1 waiting for lock 2; B holds 2 waiting for 1 — both wait forever | Always lock in the same order, use timeouts, keep locks short |
| **Starvation** | A thread never gets the resource | Fair locks, priorities |
| **Livelock** | Threads keep reacting to each other without progress | Back-off with randomness |
| Thread-pool starvation | All pool threads blocked (e.g. `.Result` on async) | Async all the way |

```csharp
int counter = 0;
Parallel.For(0, 1_000_000, _ => counter++);              // ❌ race: result is less than 1,000,000
Console.WriteLine(counter);

int safe = 0;
Parallel.For(0, 1_000_000, _ => Interlocked.Increment(ref safe));   // ✅ atomic
var gate = new object();
lock (gate) { /* only one thread at a time here */ }      // ✅ mutual exclusion
```

The same ideas appear in databases: SQL Server uses **locks and isolation levels** to stop concurrent transactions corrupting data, and can **deadlock** too (it then kills one transaction as the victim).

# Module: From Code to Execution

## Lesson: [Intermediate|Medium] Compilers, interpreters, JIT and AOT

| Model | How | Examples | Trade-off |
|---|---|---|---|
| Ahead-of-time compiled | Source → machine code before running | C, C++, Rust, Go, .NET Native AOT | Fast start, platform-specific binary |
| Interpreted | Interpreter executes source/bytecode line by line | Python (bytecode VM), classic JavaScript, PowerShell | Portable, slower |
| Bytecode + **JIT** | Compile to intermediate code; at runtime compile hot methods to machine code | .NET (IL → RyuJIT), Java (bytecode → HotSpot), JavaScript V8 | Portable + fast after warm-up, startup cost |

**Compiler stages:** lexing (characters → tokens) → parsing (tokens → syntax tree) → semantic analysis (types, symbols) → optimisation → code generation. The C# compiler **Roslyn** does these to produce IL; the **JIT** then turns IL into machine code for the actual CPU (x64 or ARM64), with tiered compilation (quick code first, optimised code for hot methods).

## Lesson: [Intermediate|Medium] Putting it together — what happens when your .NET API handles a request

1. The network card receives packets → OS TCP/IP stack reassembles them → data lands in a **socket** buffer (kernel memory).
2. Kestrel (ASP.NET Core server), waiting asynchronously on that socket, is woken by an I/O completion; a **thread-pool thread** picks up the work.
3. Bytes are parsed into an `HttpContext` (objects allocated on the **heap**); middleware and your controller run — **CPU** executes JIT-compiled code, using **stack** frames for each method call.
4. Your code awaits a SQL query → the thread returns to the pool (no thread blocked); the request is sent through another socket to SQL Server.
5. SQL Server (its own process) checks its **buffer pool in RAM**; if the pages aren't cached it reads them from **disk** (slow), executes the plan, returns rows.
6. The continuation runs on a pool thread, serialises JSON, writes to the socket; the OS sends packets back.
7. Objects of the request become unreachable → collected later by the **GC** (most die in generation 0, very cheaply).

Every performance topic on DevLadder maps to one of these steps: CPU (algorithms), memory (allocations, GC), I/O (disk, database), network (latency, payload size), and threads (async, locking).

# Interview

## [Beginner|High] What is the difference between stack and heap memory?

The stack holds method call frames — parameters, local value-type variables and references — per thread; allocation and cleanup are automatic and very fast (push/pop) but it is small (≈1 MB per thread). The heap holds objects created with `new`, shared by all threads, larger, and in .NET cleaned by the garbage collector. Stack overflow comes from too-deep recursion; heap problems are leaks and fragmentation.

## [Beginner|High] What is the difference between a process and a thread?

A process is a running program with its own isolated virtual memory and resources. A thread is an execution path inside a process; threads of the same process share its heap and resources but each has its own stack and registers. Processes are isolated and heavier; threads are lighter but need synchronisation for shared data, and an unhandled exception in one thread kills the whole process.

## [Beginner|High] What is RAM and why is it faster than disk? What is a cache?

RAM is volatile main memory accessed electronically in ~100 ns; SSDs take tens of microseconds and HDDs milliseconds because of slower technology (and seek mechanics for HDDs). A cache is a small, faster copy of frequently used data closer to where it's needed — CPU L1/L2/L3 caches over RAM, SQL Server's buffer pool over disk, Redis over a database. Caches work because of locality: recently or nearby used data is likely to be used again.

## [Beginner|Medium] What is the difference between 32-bit and 64-bit?

The width of CPU registers and memory addresses. A 32-bit process can address at most 4 GB (often 2–3 GB usable); a 64-bit process can address terabytes. 64-bit also has more registers. In .NET, "Any CPU" assemblies run as 64-bit on a 64-bit OS; pointers/references are 8 bytes, so objects use a bit more memory.

## [Beginner|Medium] What are binary, hexadecimal, ASCII, UTF-8 and UTF-16?

Binary is base 2 (how hardware stores data); hexadecimal is base 16, a compact way to write bytes (`0xFF` = 255). ASCII maps 128 characters to 7-bit codes. UTF-8 encodes all Unicode characters in 1–4 bytes and is backward-compatible with ASCII — the web standard. UTF-16 uses 2 or 4 bytes per character and is what .NET `string` and Windows APIs use internally.

## [Intermediate|High] What is virtual memory?

An OS + CPU mechanism that gives each process its own large, private address space, mapped page by page (usually 4 KB) to physical RAM or to disk (page file/swap). It isolates processes, lets programs use more memory than physically available, and loads pages lazily. Accessing a page not in RAM causes a page fault; heavy paging (thrashing) makes a system extremely slow.

## [Intermediate|High] What is a race condition and how do you prevent it?

When the result depends on the timing of threads accessing shared data, e.g. two threads doing `count++` (read, add, write) and one update is lost. Prevent it with mutual exclusion (`lock`, `SemaphoreSlim`), atomic operations (`Interlocked`), thread-safe collections (`ConcurrentDictionary`), immutable data, or by not sharing state (message passing). In databases, transactions and isolation levels play the same role.

## [Intermediate|High] What is a deadlock? How do you avoid it?

Two or more threads (or transactions) each hold a resource the other needs and wait forever. Conditions: mutual exclusion, hold-and-wait, no preemption, circular wait. Avoid by acquiring locks in a consistent order, holding locks briefly, using timeouts (`Monitor.TryEnter`, `SemaphoreSlim.WaitAsync(timeout)`), and avoiding sync-over-async (`.Result`) in .NET. SQL Server detects deadlocks and kills one victim transaction.

## [Intermediate|Medium] What is a context switch and why is it costly?

The OS saving the state (registers, program counter, stack pointer) of a running thread and loading another's so it can run on that core. Costs: the switch itself, kernel transitions, and colder CPU caches/TLB afterwards. Too many threads → too much switching; hence thread pools and async I/O.

## [Intermediate|Medium] Concurrency vs parallelism?

Concurrency is dealing with many tasks at once (they make progress by interleaving, possibly on one core) — e.g. a web server handling many requests with async I/O. Parallelism is executing many tasks at the same instant on multiple cores — e.g. `Parallel.For` over CPU-heavy work. Async improves scalability for I/O-bound work; parallelism speeds up CPU-bound work.

## [Intermediate|Medium] What is the difference between a compiler, an interpreter and a JIT?

A compiler translates the whole program to machine code ahead of time (fast start, platform-specific). An interpreter executes code step by step at runtime (portable, slower). A JIT compiles intermediate code (IL/bytecode) to machine code at runtime when methods are first used, optimising hot code — .NET, Java and modern JavaScript engines combine portability with near-native speed after warm-up.

## [Advanced|Medium] Why is iterating an array faster than a linked list even though both are O(n)?

Arrays store elements contiguously, so each 64-byte cache line brings several elements and the CPU prefetcher predicts the next access; linked-list nodes are scattered across the heap, so each step may be a cache miss costing ~100 ns. Big-O counts operations, not memory latency — cache locality often dominates real performance.

## [Advanced|Medium] What is a memory leak in a garbage-collected language?

Memory that stays reachable even though the program no longer needs it, so the GC can't free it: static collections that only grow, event handlers never unsubscribed, caches without size limits/expiry, timers holding references, closures capturing big objects, or unmanaged resources not disposed. Find it with memory snapshots/dumps (dotnet-gcdump, Visual Studio, PerfView) and compare which object types grow.

## [Scenario|High] A server has 16 GB RAM but the app is very slow and disk activity is constantly 100%. What might be happening?

Probably memory pressure and paging: processes (or SQL Server with no max memory limit, or a leaking app) use more than physical RAM, so the OS keeps swapping pages to disk (thrashing). Check memory usage per process, page faults/sec and page file usage; set SQL Server max server memory, fix leaks, reduce caching, or add RAM. Also check whether the disk activity is actually database reads due to missing indexes.

## [Scenario|Medium] A recursive method to process a folder tree crashes the process on a very deep structure. Why, and how do you fix it?

Each recursive call adds a stack frame; very deep recursion exhausts the thread's stack (≈1 MB) and causes a `StackOverflowException`, which .NET can't catch — the process dies. Fix: rewrite iteratively using an explicit `Stack<T>`/`Queue<T>` on the heap, or limit depth. (`Directory.EnumerateFiles(..., SearchOption.AllDirectories)` already does it iteratively.)

## [Scenario|Medium] A multithreaded counter in your app gives a different result each run. Explain and fix.

A race condition: `counter++` is read-modify-write, so two threads can read the same value and both write back value+1, losing an increment. Fix with `Interlocked.Increment(ref counter)`, a `lock`, or by giving each thread its own local counter and summing at the end (`Parallel.For` with thread-local state) — the last is also fastest.

# Cheatsheet

## Speed ladder (approx.)

Register < 1 ns · L1 ~1 ns · L3 ~10–20 ns · RAM ~100 ns · SSD ~50 µs · HDD ~5 ms · same-DC network ~0.5 ms · cross-continent ~150 ms.

## Stack vs heap

Stack: per thread, frames, locals, fast, auto-freed, ~1 MB, overflow on deep recursion. Heap: shared, objects, GC-managed in .NET, leaks = still referenced.

## Process vs thread

Process = own address space, isolated. Thread = path inside a process, shares heap, own stack. Context switch = save/restore thread state.

## Concurrency problems

Race → lock / Interlocked / immutability. Deadlock → same lock order, short locks, timeouts, no `.Result`. Starvation → fair scheduling, async.

## Code to execution

C# → Roslyn → IL → JIT (tiered) → machine code; OS loads process, CLR manages memory with GC; I/O via system calls.
