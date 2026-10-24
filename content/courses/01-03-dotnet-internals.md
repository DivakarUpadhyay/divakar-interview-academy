---
slug: dotnet-internals
title: .NET Internals — CLR, CTS, CLS, IL, JIT, Memory Management & Garbage Collection
track: dotnet
order: 3
group: Languages & Internals
icon: CLR
color: #512bd4
summary: Every .NET version from .NET Framework 1.0 to .NET 10, the .NET architecture (CLR, BCL, CTS, CLS), compilation from C#/VB.NET to IL to machine code (Roslyn, JIT, tiered compilation, ReadyToRun, Native AOT), assemblies, manifests, metadata, GAC and strong names, AppDomains vs AssemblyLoadContext, type loading and method tables, stack and heap, value vs reference type layout, the garbage collector in depth (generations, LOH, POH, workstation/server, background GC), finalization, IDisposable, memory leaks and diagnostics, threading and the thread pool, async internals and exceptions inside the CLR.
---

# Overview

**.NET** is a developer platform: a **runtime** that executes code (the CLR), a huge **class library** (BCL), **languages** (C#, VB.NET, F#), **SDK tools** (`dotnet` CLI, compilers, NuGet) and **app models** (ASP.NET, WinForms, WPF, MAUI, Worker Services).

```text
┌──────────────────────────────────────────────────────────────┐
│ Your code: C# · VB.NET · F#                                    │
├──────────────────────────────────────────────────────────────┤
│ App models: ASP.NET Core · Web Forms/MVC (Framework) · WPF ·   │
│             WinForms · MAUI · Worker · Console                 │
├──────────────────────────────────────────────────────────────┤
│ Base Class Library (BCL): System, Collections, IO, Net, Linq,  │
│ Threading, Text.Json, Data, Security …                         │
├──────────────────────────────────────────────────────────────┤
│ CLR (Common Language Runtime): JIT · GC · type system (CTS) ·  │
│ type safety · exceptions · threading · security · interop      │
├──────────────────────────────────────────────────────────────┤
│ Operating system: Windows · Linux · macOS · (Android/iOS)      │
└──────────────────────────────────────────────────────────────┘
```

| Term | Full form | One line |
|---|---|---|
| **CLR** | Common Language Runtime | The virtual machine that loads, compiles (JIT), runs and manages .NET code |
| **CTS** | Common Type System | Rules for how types are defined and behave — shared by all .NET languages |
| **CLS** | Common Language Specification | Subset of CTS every language must support so libraries work across languages |
| **IL / MSIL / CIL** | (Microsoft/Common) Intermediate Language | CPU-independent instructions produced by the compiler |
| **JIT** | Just-In-Time compiler | Converts IL to native machine code at runtime (RyuJIT) |
| **BCL / FCL** | Base / Framework Class Library | Built-in libraries |
| **GC** | Garbage Collector | Automatic memory management |
| Managed code | — | Code executed under the CLR (memory, safety managed) |
| Unmanaged code | — | Native code outside the CLR (C/C++ DLLs, COM, Win32) — called via P/Invoke or COM interop |

# Versions

**Every .NET version** (release year, what shipped, support status as of 2026):

**.NET Framework (Windows only):**

| Version | Year | CLR | Visual Studio | Headline features |
|---|---|---|---|---|
| 1.0 | 2002 | 1.0 | VS .NET 2002 | First release: CLR, C# 1.0, VB.NET, ASP.NET Web Forms, ADO.NET, WinForms |
| 1.1 | 2003 | 1.1 | VS .NET 2003 | ASP.NET mobile controls, ODBC/Oracle providers, side-by-side execution |
| 2.0 | 2005 | **2.0** | VS 2005 | **Generics**, nullable types, anonymous methods, partial classes, ASP.NET 2.0 (master pages, membership), 64-bit |
| 3.0 | 2006 | 2.0 | (VS 2005 extensions) | WPF, WCF, WF (Workflow), CardSpace |
| 3.5 | 2007 | 2.0 | VS 2008 | **LINQ**, C# 3.0, ASP.NET AJAX; 3.5 SP1 (2008): Entity Framework 1, ASP.NET Dynamic Data |
| 4.0 | 2010 | **4** | VS 2010 | TPL (`Task`), PLINQ, `dynamic`, MEF, Code Contracts, ASP.NET MVC 2 era |
| 4.5 | 2012 | 4 | VS 2012 | **async/await**, ASP.NET Web API, SignalR, Web Forms model binding |
| 4.5.1 / 4.5.2 | 2013 / 2014 | 4 | VS 2013 | Debugging and performance improvements |
| 4.6 – 4.6.2 | 2015 – 2016 | 4 | VS 2015 | **RyuJIT** for x64, ASP.NET 4.6, long-path support (4.6.2) |
| 4.7 – 4.7.2 | 2017 – 2018 | 4 | VS 2017 | TLS 1.2 defaults, high-DPI WinForms |
| **4.8** | 2019 | 4 | VS 2019 | **Last major Framework version**; JIT and accessibility updates |
| 4.8.1 | 2022 | 4 | VS 2022 | Native ARM64 support |

.NET Framework 4.8/4.8.1 is supported as part of Windows (no new features). Web Forms, WCF server and Windows Workflow exist only here.

**.NET Core (cross-platform, open source):**

| Version | Year | Type | Headline features |
|---|---|---|---|
| 1.0 | 2016 | — | Cross-platform runtime, ASP.NET Core 1.0, EF Core 1.0, `project.json` |
| 1.1 | 2016 | — | More APIs |
| 2.0 | 2017 | — | .NET Standard 2.0 (~32k APIs), Razor Pages, back to `.csproj` |
| 2.1 | 2018 | LTS | `Span<T>`, SignalR, `HttpClientFactory`, global tools |
| 2.2 | 2018 | — | Health checks, IIS in-process hosting |
| 3.0 | 2019 | — | WinForms & WPF on Windows, C# 8, Blazor Server, gRPC, endpoint routing, `System.Text.Json` |
| 3.1 | 2019 | LTS | Long-term support version of 3.0; Blazor improvements |

**.NET 5 and later ("one .NET" — the successor of both Framework and Core):**

| Version | Release | Support | C# | Headline features |
|---|---|---|---|---|
| .NET 5 | Nov 2020 | STS | 9 | Unified platform name (skipped "4" to avoid confusion with Framework), records, single-file apps |
| .NET 6 | Nov 2021 | **LTS** | 10 | Minimal APIs, hot reload, MAUI (2022), `DateOnly`, `PriorityQueue`, unified `WebApplication` |
| .NET 7 | Nov 2022 | STS | 11 | Generic math, rate limiting, output caching, Native AOT for console |
| .NET 8 | Nov 2023 | **LTS** | 12 | Native AOT for ASP.NET Core APIs, Blazor United (static SSR + interactive), `TimeProvider`, `FrozenDictionary`, Aspire (preview), keyed DI |
| .NET 9 | Nov 2024 | STS (extended to 24 months) | 13 | `HybridCache`, built-in OpenAPI generation, `System.Threading.Lock`, LINQ `CountBy`/`AggregateBy`, GC dynamic adaptation (DATAS) on by default for Server GC |
| .NET 10 | Nov 2025 | **LTS** | 14 | Extension members, `field` keyword, file-based apps (`dotnet run app.cs`), JIT de-virtualisation and stack allocation improvements, EF Core 10, ASP.NET Core 10 |
| .NET 11 | Nov 2026 (expected) | STS | 15 | In preview during 2026 |

**Support policy:** a new version every November; **LTS** (even numbers) = 3 years of support, **STS** (odd numbers) = 2 years (extended from 18 months starting with .NET 9). **.NET Standard** (1.0–2.1) was a specification of APIs shared by Framework, Core, Xamarin and Unity — target `netstandard2.0` only for libraries that must still run on .NET Framework.

# Lifecycle

**From source code to running program:**

1. **Write** C#/VB.NET/F# source.
2. **Compile** — Roslyn (`csc`/`vbc`, run by `dotnet build`/MSBuild) produces an **assembly** (`.dll`/`.exe`) containing **IL** + **metadata** (types, members, references) + **manifest** (assembly name, version, culture, references, resources).
3. **Launch** — the host (`dotnet.exe`/apphost/IIS ANCM) reads `*.runtimeconfig.json`, locates the right runtime version and starts the CLR (`coreclr.dll` / `libcoreclr.so`).
4. **Load** — the assembly loader loads the assembly and its dependencies (`*.deps.json`) into an AssemblyLoadContext.
5. **Type loading** — the first use of a type builds its **MethodTable** (type info, method slots), runs its static constructor.
6. **JIT** — the first call to a method compiles its IL to native code (tier 0, quick), replaces the stub; hot methods are recompiled with full optimisations (tier 1, possibly using profile data — Dynamic PGO).
7. **Execute** — native code runs on the CPU; allocations go to the managed heap; the GC reclaims unreachable objects; exceptions unwind stack frames.
8. **Shutdown** — finalizers may run, the process exits and the OS frees everything.

# Tools

- **Inspect IL/assemblies:** ILSpy, dnSpy, dotPeek, `ildasm` (Framework SDK), SharpLab.io (C# → IL → JIT assembly in the browser).
- **Diagnostics CLI:** `dotnet-counters` (GC, CPU, thread pool live), `dotnet-trace` (event traces), `dotnet-dump` (memory dumps + `analyze`), `dotnet-gcdump` (heap snapshots), `dotnet-stack`.
- **Profilers:** Visual Studio Diagnostic Tools / Performance Profiler, PerfView, JetBrains dotMemory/dotTrace, WinDbg + SOS.
- **Benchmarking:** BenchmarkDotNet (`[MemoryDiagnoser]` shows allocations).
- **Info:** `dotnet --info`, `dotnet --list-runtimes`, `dotnet --list-sdks`.

# Module: Platform and Compilation

## Lesson: [Basic|High] .NET Framework vs .NET Core vs .NET 5+ — the history explained

| | .NET Framework | .NET Core 1–3.1 | .NET 5+ |
|---|---|---|---|
| Years | 2002–2019 (4.8.1 in 2022) | 2016–2019 | 2020 → |
| OS | Windows only | Windows, Linux, macOS | Windows, Linux, macOS, mobile (MAUI), WebAssembly |
| Source | Closed (reference source available) | Open source (MIT) | Open source |
| Deployment | Machine-wide install, part of Windows | Side-by-side, self-contained possible | Same + single-file, Native AOT |
| Web | ASP.NET Web Forms, MVC 5, Web API 2 | ASP.NET Core | ASP.NET Core |
| Performance | Good | Much faster | Fastest; improves every release |
| Status | Maintenance only | Out of support | Active |

**Mono** (2004, open source, by Ximian → Xamarin → Microsoft) ran .NET on Linux/macOS/mobile and powers Unity and Xamarin; today its runtime is used inside .NET for mobile and WebAssembly.

> **Interview tip:** "Why did they skip .NET 4?" — to avoid confusion with .NET Framework 4.x; .NET 5 dropped "Core" from the name because it became *the* .NET going forward.

## Lesson: [Basic|High] CLR, CTS, CLS — what each one does

**CLR responsibilities:**

| Component | Job |
|---|---|
| Class loader | Loads assemblies and types, builds MethodTables |
| JIT compiler | IL → native code |
| Garbage collector | Allocates and frees managed memory |
| Type checker / verifier | Type safety — no invalid casts or reading random memory |
| Exception manager | Structured exception handling across frames and languages |
| Thread support | Managed threads, thread pool, synchronisation |
| Security | Type safety, (Framework: Code Access Security — removed in Core) |
| Interop | P/Invoke, COM interop, marshalling |
| Debugging / profiling APIs | Debuggers, profilers, diagnostics |

**CTS — the type system all languages share:**

```text
System.Object
├── Value types (System.ValueType): int, double, bool, char, decimal, DateTime, struct, enum (System.Enum)
└── Reference types: class, string, array (System.Array), delegate (System.Delegate), interface, record
```

The CTS defines visibility (public, private, internal, protected), inheritance rules (single class inheritance, multiple interfaces), members (fields, methods, properties, events) and how values are boxed. Because C# `int` and VB.NET `Integer` are both **`System.Int32`**, the languages interoperate perfectly.

**CLS — the common subset for cross-language libraries.** Examples of non-CLS-compliant features: unsigned types in public APIs (`uint` — VB.NET historically lacked them), names differing only by case (`Name` and `name` — VB.NET is case-insensitive), pointers. Mark libraries with `[assembly: CLSCompliant(true)]` and the compiler warns about violations.

## Lesson: [Basic|High] Compilation: Roslyn, IL, JIT, tiered compilation, ReadyToRun and Native AOT

```csharp
public static int Add(int a, int b) => a + b;
```

compiles to IL (stack-based, CPU-independent):

```text
.method public hidebysig static int32 Add(int32 a, int32 b) cil managed
{
  ldarg.0      // push a
  ldarg.1      // push b
  add          // pop two, push sum
  ret          // return top of stack
}
```

and at runtime the JIT turns it into native code for the actual CPU:

```text
; x64
lea eax, [rcx+rdx]
ret
```

| Technique | When code becomes native | Pros | Cons |
|---|---|---|---|
| **JIT** (default) | At first call of each method | Optimises for the actual CPU and runtime profile | Startup cost ("warm-up") |
| **Tiered compilation** (.NET Core 3+) | Tier 0 quick JIT first, tier 1 optimised for hot methods (after ~30 calls), with **Dynamic PGO** (on by default since .NET 8) | Fast startup *and* fast steady state | More complex |
| **ReadyToRun (R2R)** | Precompiled native code inside the DLL; JIT can still re-optimise | Faster startup, still flexible | Larger files |
| **Native AOT** (.NET 7+) | Whole app compiled to a native executable at publish | Instant start, small memory, no JIT, no runtime install | No dynamic code loading, reflection limits (trimming), longer builds |
| NGen (.NET Framework) | Native images in a machine cache | Faster startup | Fragile, Framework-only |

```bash
dotnet publish -c Release -r linux-x64 -p:PublishReadyToRun=true
dotnet publish -c Release -r win-x64 -p:PublishAot=true
```

## Lesson: [Intermediate|High] Assemblies, metadata, manifest, GAC, strong names and versioning

An **assembly** is the unit of deployment, versioning and security: a `.dll` or `.exe` containing:

| Part | Contains |
|---|---|
| PE header | Windows/OS executable format |
| CLR header | Runtime version, entry point, flags |
| **Metadata** | Every type, method, field, parameter, attribute and referenced member — what reflection and IntelliSense read |
| **IL code** | Method bodies |
| **Manifest** | Assembly identity (name, **version**, culture, public key token), list of files, referenced assemblies |
| Resources | Embedded files, localised strings |

Kinds: **private** assemblies (in the app folder — the norm today), **shared** assemblies in the **GAC** (Global Assembly Cache, .NET Framework only — `C:\Windows\Microsoft.NET\assembly`), **satellite** assemblies (localised resources, `fr\MyApp.resources.dll`).

**Strong name** = name + version + culture + public key token, signed with a key pair; required for the GAC in .NET Framework. Version format: `major.minor.build.revision`. Binding redirects in `app.config`/`web.config` solved "DLL hell" version conflicts in Framework; modern .NET resolves versions via NuGet and `deps.json` (no GAC).

```xml
<!-- .NET Framework web.config binding redirect -->
<dependentAssembly>
  <assemblyIdentity name="Newtonsoft.Json" publicKeyToken="30ad4fe6b2a6aeed" culture="neutral" />
  <bindingRedirect oldVersion="0.0.0.0-13.0.0.0" newVersion="13.0.0.0" />
</dependentAssembly>
```

**AppDomain vs AssemblyLoadContext:** .NET Framework used **AppDomains** to isolate and unload code inside one process (IIS used one per web app). .NET Core removed multiple AppDomains; use **AssemblyLoadContext** (collectible contexts can be unloaded — plugins) or separate processes/containers for isolation.

# Module: Memory Management

## Lesson: [Basic|High] Stack, heap and how value and reference types are laid out

Each **thread** has a **stack** (1 MB default on Windows, 8 MB typical on Linux) holding frames: arguments, locals, return addresses, spilled registers. The **managed heap** is shared by the process and holds objects.

Every heap object has a header:

```text
Reference variable (8 bytes on 64-bit) ──▶ [ Object header / sync block index (8 bytes) | MethodTable pointer (8 bytes) | fields … ]
                                                                                        └▶ MethodTable: type info, base type, interface map, vtable slots for methods
```

So an empty object costs ~24 bytes on 64-bit. A `struct` has **no header** — its fields are stored inline wherever it lives (stack frame, inside an array, inside another object).

```csharp
class PointClass { public int X, Y; }      // heap object: header + MT pointer + 8 bytes of fields (+ padding) ≈ 24 bytes
struct PointStruct { public int X, Y; }    // 8 bytes, inline

var a = new PointStruct[1000];   // one array object, 8,000 bytes of data inline — cache friendly
var b = new PointClass[1000];    // one array of 1000 references + up to 1000 separate objects
```

Where things live:

| Thing | Location |
|---|---|
| Local `int` / struct variable | Stack (or a CPU register) |
| Reference variable (local) | Stack — the object it points to is on the heap |
| Object fields (including value-type fields) | Inside the object on the heap |
| Array elements | Inside the array object on the heap |
| Static fields | Special heap area associated with the type (live as long as the AssemblyLoadContext) |
| Locals captured by a lambda or used across `await` | Moved into a heap object (closure class / async state machine) |

## Lesson: [Intermediate|High] The garbage collector in depth — generations, LOH, POH and GC modes

**Allocation:** the GC hands each thread an allocation context; `new` just bumps a pointer — allocation is very cheap.

**Collection — mark, (sweep), compact:**

1. **Suspend** managed threads at safe points (for blocking GCs).
2. **Mark** — starting from **roots** (stack slots and registers, static fields, GC handles, finalization queue), follow references and mark reachable objects.
3. **Plan/compact** — slide surviving objects together, update all references; free space becomes one contiguous block (no fragmentation). Sometimes it only **sweeps** (builds a free list) when compaction isn't worth it.
4. **Resume** threads.

**Generations** (the "weak generational hypothesis": most objects die young):

| Generation | Holds | Collected |
|---|---|---|
| **Gen 0** | Newly allocated small objects | Very often, very fast (ms or less) |
| **Gen 1** | Survivors of one gen-0 GC — buffer between young and old | Often |
| **Gen 2** | Long-lived objects (caches, singletons, static data) | Rarely; a "full GC" — most expensive |
| **LOH** — Large Object Heap | Objects ≥ **85,000 bytes** (big arrays, big strings) | Only with gen 2; **not compacted by default** (can fragment) |
| **POH** — Pinned Object Heap (.NET 5+) | Objects allocated as pinned (`GC.AllocateArray(..., pinned: true)`) | With gen 2, never moved |

Objects that survive a collection are **promoted** to the next generation. Gen-2 objects referencing gen-0 objects are tracked with a **card table** so gen-0 GCs don't have to scan all of gen 2.

**GC modes:**

| Mode | Behaviour | Default for |
|---|---|---|
| **Workstation** | One heap; collections on the triggering thread; low pause, less throughput | Desktop/console apps |
| **Server** | One heap + GC thread **per core**; higher throughput, more memory | ASP.NET Core apps |
| **Concurrent / Background GC** | Gen-2 marking runs concurrently with the app; gen 0/1 still pause briefly | On by default |
| **DATAS** (dynamic adaptation, .NET 8 opt-in, on by default with Server GC in .NET 9) | Server GC that grows/shrinks heap count to the load — less memory for small containers | Containers |

```xml
<!-- .csproj -->
<PropertyGroup>
  <ServerGarbageCollector>true</ServerGarbageCollector>
  <ConcurrentGarbageCollection>true</ConcurrentGarbageCollection>
</PropertyGroup>
```

```csharp
Console.WriteLine(GC.CollectionCount(0) + " gen0, " + GC.CollectionCount(2) + " gen2");
Console.WriteLine(GC.GetTotalMemory(forceFullCollection: false) / 1_048_576 + " MB");
var info = GC.GetGCMemoryInfo();   // heap size, fragmentation, pause durations
// GC.Collect();                   // almost never call this in production code
```

**What triggers a GC:** gen-0 budget exhausted (most common), `GC.Collect()`, low memory notification from the OS, LOH allocation thresholds, container memory limits.

## Lesson: [Intermediate|High] Finalization, IDisposable and the Dispose pattern

The GC frees **managed memory** only. **Unmanaged resources** (file handles, sockets, database connections, OS handles, native memory) must be released explicitly — that's what `IDisposable` is for.

```csharp
public sealed class ReportWriter : IDisposable
{
    private readonly FileStream _file = new("report.txt", FileMode.Create);
    private bool _disposed;

    public void Write(string text) { ObjectDisposedException.ThrowIf(_disposed, this); /* ... */ }

    public void Dispose()
    {
        if (_disposed) return;
        _file.Dispose();          // release what we own
        _disposed = true;
    }
}

using var writer = new ReportWriter();     // Dispose() called at end of scope, even on exceptions
```

**Finalizers** (`~ClassName()`) run on a dedicated finalizer thread some time after the object becomes unreachable:

- Objects with a finalizer survive at least one extra GC (they go to the **f-reachable queue**), so they are more expensive.
- Order and timing are not guaranteed; finalizers may never run on process crash.
- Use them only as a safety net for **directly owned unmanaged handles** — and prefer `SafeHandle`, which already implements this correctly.

The full **Dispose pattern** (for non-sealed classes that own unmanaged resources):

```csharp
public class NativeBuffer : IDisposable
{
    private IntPtr _ptr = Marshal.AllocHGlobal(1024);
    private bool _disposed;

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) { /* dispose managed members (other IDisposables) */ }
        Marshal.FreeHGlobal(_ptr);    // free unmanaged memory in both paths
        _ptr = IntPtr.Zero;
        _disposed = true;
    }
    public void Dispose() { Dispose(true); GC.SuppressFinalize(this); }   // no need to finalize anymore
    ~NativeBuffer() => Dispose(false);                                   // safety net if Dispose was forgotten
}
```

`IAsyncDisposable` / `await using` for resources whose cleanup is asynchronous (streams flushing to network, `DbConnection` in async code).

| | Dispose | Finalize |
|---|---|---|
| Called by | Your code (`using`) | GC finalizer thread |
| Timing | Deterministic | Non-deterministic |
| Purpose | Release managed + unmanaged resources early | Last-chance release of unmanaged resources |
| Cost | Cheap | Extra GC survival, finalizer thread work |

## Lesson: [Advanced|High] Memory leaks in .NET and how to find them

Common causes of managed "leaks" (objects kept reachable):

| Cause | Example | Fix |
|---|---|---|
| Static/singleton collections that only grow | `static List<Order> _all` | Bounded caches (`MemoryCache` with size limits/expiry) |
| Event handlers not unsubscribed | Short-lived object subscribes to a long-lived publisher's event | `-=` in Dispose, weak events |
| Captured variables in long-lived lambdas/timers | `Timer` callback capturing a big object | Dispose timers, avoid capturing |
| Wrong DI lifetimes | Scoped `DbContext` captured inside a singleton ("captive dependency") | Respect lifetimes; `ValidateScopes` |
| `HttpClient` per request | Socket exhaustion (not memory, but similar symptom) | `IHttpClientFactory` |
| Not disposing unmanaged resources | Streams, `Bitmap`, connections | `using` |
| LOH fragmentation | Many large temporary arrays | `ArrayPool<T>`, `RecyclableMemoryStream`, reuse buffers |
| Pinned objects | Long-lived `GCHandle.Alloc(..., Pinned)` | POH or `Memory<T>`/`Span<T>` patterns |

**Investigation steps:**

```bash
dotnet-counters monitor -p <pid> --counters System.Runtime     # watch GC heap size, gen-2 count, LOH size over time
dotnet-gcdump collect -p <pid>                                  # heap snapshot → open in Visual Studio / PerfView
dotnet-dump collect -p <pid> && dotnet-dump analyze <file>      # > dumpheap -stat ; > gcroot <address>
```

Take two snapshots some minutes apart, compare object counts by type, then use **gcroot** (or "paths to root" in the profiler) to see who is holding the growing objects.

# Module: Execution Internals

## Lesson: [Intermediate|High] Type loading, method calls and virtual dispatch

- When a type is first used, the CLR loads its metadata and builds an **EEClass** (static type info) and a **MethodTable** (per-type runtime structure: size, base type, interfaces, **vtable** of method slots).
- **Static constructor** (`static Foo() { }`) runs once before first use of the type (thread-safe, guaranteed by the CLR).
- **Non-virtual call:** direct call to the method's code address (after JIT).
- **Virtual call:** load the object's MethodTable pointer → read the slot for that method → call it. Overrides replace the slot in the derived type's vtable — that's runtime polymorphism.
- **Interface call:** resolved through virtual stub dispatch (cached per call site).
- **Sealed classes** and the JIT's **devirtualisation** (helped by PGO) turn virtual calls into direct calls and allow inlining — a reason to mark classes `sealed` when not designed for inheritance.
- **Generics:** for reference-type arguments the JIT shares one native implementation (`List<string>` and `List<Customer>` share code); for value types it generates specialised code (`List<int>`, `List<double>`) — no boxing and full speed.

## Lesson: [Intermediate|High] Threads, the thread pool and how async/await works inside

**Managed threads** map 1:1 to OS threads. Creating them is expensive, so .NET uses the **ThreadPool**: worker threads that run queued work items (`Task.Run`, timers, continuations) plus I/O completion handling. It **injects threads gradually** (hill-climbing) when work is queued faster than it completes — blocking calls cause **thread-pool starvation** (slow responses, growing queues).

**async/await under the hood:**

```csharp
public async Task<int> GetCountAsync()
{
    var json = await http.GetStringAsync(url);   // 1. starts I/O, returns an incomplete Task
    return Parse(json);                           // 3. continuation after I/O completes
}
```

1. The compiler rewrites the method into a **state machine** struct (`IAsyncStateMachine`) with a `MoveNext()` method; locals become fields.
2. At `await`, if the task isn't complete, the state machine registers a continuation and **returns to the caller** — the thread goes back to the pool (no thread waits for the network).
3. When the I/O completes (signalled by the OS via IOCP/epoll), a pool thread runs `MoveNext()` again from the saved state.
4. **SynchronizationContext:** UI apps and classic ASP.NET resume on the original context (UI thread/request context); ASP.NET Core has **no** SynchronizationContext, so continuations run on any pool thread. `ConfigureAwait(false)` in libraries avoids capturing a context.
5. Blocking on async (`.Result`, `.Wait()`) holds a thread and, with a single-threaded context, can **deadlock**.

**ExecutionContext** flows ambient data (AsyncLocal, culture, activity/trace id) across awaits automatically.

## Lesson: [Advanced|Medium] Exceptions, boxing, strings and other runtime behaviours

**Exceptions inside the CLR:** `throw` creates the exception object and captures the stack trace; the runtime does a **two-pass** unwind — first finds a matching `catch` (running exception filters `when (...)` without unwinding), then unwinds frames running `finally` blocks. Throwing is expensive (stack walk) — don't use exceptions for normal control flow. Unhandled exceptions on any thread terminate the process (after `AppDomain.UnhandledException` fires).

**Boxing:** converting a value type to `object`/interface allocates a heap object with a header and copies the value; unboxing type-checks and copies back. Generics avoid it.

**Strings:** immutable UTF-16 reference types; literals are **interned** (one instance per value per process); concatenation in loops creates garbage — use `StringBuilder`, `string.Create`, interpolation handlers, or `Span<char>`.

**Type safety and verification:** the CLR prevents treating memory as the wrong type; `unsafe` code with pointers opts out (requires `AllowUnsafeBlocks`).

**Reflection and metadata:** `typeof(T).GetMethods()` reads the assembly metadata at runtime — flexible but slow and AOT-unfriendly; **source generators** (System.Text.Json, logging, regex) do the work at compile time instead.

**Interop:** P/Invoke (`[LibraryImport("user32.dll")]` source-generated in .NET 7+, `[DllImport]` before) calls native functions with marshalling of parameters; COM interop for Office automation and legacy components.

# Interview

## [Beginner|High] What is the CLR and what does it do?

The Common Language Runtime is .NET's execution engine. It loads assemblies, verifies type safety, JIT-compiles IL to native code, manages memory with the garbage collector, handles exceptions, threads and synchronisation, provides interop with native code and exposes debugging/profiling services. Code running under it is "managed code".

## [Beginner|High] What are CTS and CLS?

CTS (Common Type System) defines how types are declared and used in .NET — value vs reference types, inheritance, members, visibility — so all languages share one type system (C# `int` = VB.NET `Integer` = `System.Int32`). CLS (Common Language Specification) is a subset of CTS rules that every .NET language supports, so a CLS-compliant library can be used from any language (e.g. avoid public unsigned types or names differing only in case).

## [Beginner|High] What is IL (MSIL/CIL) and what does the JIT do?

IL is the CPU-independent, stack-based intermediate code the C#/VB.NET compilers produce, stored with metadata in assemblies. At runtime the JIT compiles each method's IL to native machine code on its first call, optimised for the actual CPU; tiered compilation starts with quick code and re-compiles hot methods with full optimisation. ReadyToRun and Native AOT precompile to reduce startup time.

## [Beginner|High] What is the difference between .NET Framework, .NET Core and .NET 5+?

.NET Framework (2002–2019) is Windows-only, installed machine-wide, and now only maintained (4.8.1 last); it has Web Forms, WCF and WWF. .NET Core (2016–2019) was the open-source, cross-platform, high-performance rewrite. .NET 5 (2020) onward unifies them as simply ".NET", released every November with LTS versions (6, 8, 10) supported for 3 years. New projects use .NET 8/10.

## [Beginner|High] What is managed vs unmanaged code?

Managed code runs under the CLR, which handles memory (GC), type safety and exceptions — C#, VB.NET, F#. Unmanaged code runs directly on the OS without the CLR — C/C++ DLLs, Win32 APIs, COM components — and manages its own memory. .NET calls unmanaged code via P/Invoke or COM interop; resources from it must be released with `IDisposable`/`SafeHandle`.

## [Beginner|High] What is an assembly? What does it contain?

The unit of deployment and versioning in .NET — a `.dll` or `.exe` containing IL code, metadata describing all types and members, a manifest (name, version, culture, public key token, references) and optional resources. Assemblies can be private (in the app folder), shared in the GAC (.NET Framework) or satellite (localised resources).

## [Intermediate|High] Explain how the garbage collector works. What are generations?

The GC allocates objects by bumping a pointer and, when the gen-0 budget is used up, suspends threads, marks all objects reachable from roots (stack, statics, handles), compacts survivors and updates references. Generations: gen 0 for new objects (collected often and cheaply), gen 1 as a buffer, gen 2 for long-lived objects (full, expensive collections). Large objects (≥ 85,000 bytes) go to the LOH, collected with gen 2 and not compacted by default.

## [Intermediate|High] Dispose vs Finalize — what's the difference? What is the Dispose pattern?

`Dispose` (from `IDisposable`) is called deterministically by your code (`using`) to release resources early; a finalizer (`~Class()`) is called non-deterministically by the GC's finalizer thread as a safety net for unmanaged resources and makes objects survive an extra GC. The Dispose pattern: `Dispose()` calls `Dispose(true)` and `GC.SuppressFinalize(this)`; the finalizer calls `Dispose(false)`; `Dispose(bool disposing)` frees managed resources only when `disposing` is true and unmanaged resources always. Prefer `SafeHandle` over writing finalizers.

## [Intermediate|High] Where are value types and reference types stored?

Reference-type objects are always on the managed heap; variables hold references to them. Value types are stored inline where they are declared: on the stack (or in registers) for locals, inside the containing object for fields, inside the array for array elements, and on the heap when boxed or captured by closures/async methods. So "value types live on the stack" is only partly true.

## [Intermediate|High] Workstation vs Server GC?

Workstation GC uses one heap and runs collections on the allocating thread — lower memory and shorter pauses, suited to desktop apps. Server GC creates one heap and one dedicated GC thread per logical core and collects in parallel — higher throughput and allocation rates, more memory, the default for ASP.NET Core. Both support background (concurrent) gen-2 collection; .NET 9 enables DATAS to adapt Server GC heap count to load.

## [Intermediate|Medium] What is the GAC and is it used in .NET Core?

The Global Assembly Cache is a machine-wide store for strong-named shared assemblies in .NET Framework, letting multiple apps share one version (with binding redirects for versioning). .NET Core/.NET 5+ doesn't use the GAC: dependencies come from NuGet and are deployed with the app (or the shared framework), resolved via `deps.json`.

## [Intermediate|Medium] AppDomain vs AssemblyLoadContext?

AppDomains (.NET Framework) isolated code within one process and could be unloaded — IIS ran each web app in its own AppDomain. .NET Core supports only one AppDomain; isolation and unloading of plugins use `AssemblyLoadContext` (collectible contexts can be unloaded), and strong isolation uses separate processes or containers.

## [Intermediate|Medium] What is tiered compilation, ReadyToRun and Native AOT?

Tiered compilation JITs methods quickly at tier 0 and recompiles frequently used methods with full optimisation (tier 1, with Dynamic PGO) — fast startup and fast steady state. ReadyToRun ships precompiled native code inside assemblies for faster startup while keeping the JIT. Native AOT compiles the entire app ahead of time into a self-contained native executable — fastest startup and lowest memory, but no runtime code generation and limited reflection.

## [Intermediate|Medium] How does async/await work internally?

The compiler turns an async method into a state-machine struct; each `await` checks whether the awaited task has completed — if not, it stores the current state, registers a continuation and returns an incomplete Task to the caller, releasing the thread. When the operation completes (the OS signals I/O completion), the continuation runs `MoveNext()` from the saved state on a thread-pool thread (or the captured SynchronizationContext). No thread is blocked while waiting for I/O.

## [Advanced|High] How do you find a memory leak in a production .NET application?

Confirm growth with `dotnet-counters` / Application Insights (GC heap size and gen-2 size rising, gen-2 collections not reclaiming). Capture heap snapshots (`dotnet-gcdump`) or full dumps (`dotnet-dump`) at two points in time, compare object counts by type, and find the roots keeping them alive (`gcroot`, "paths to root"). Typical culprits: unbounded static caches, event handlers not unsubscribed, timers, captive dependencies in DI, undisposed resources, LOH fragmentation from large buffers.

## [Advanced|Medium] What is the Large Object Heap and why can it cause problems?

Objects of 85,000 bytes or more are allocated on the LOH, which is collected only with gen 2 and not compacted by default, so frequent large temporary allocations (big arrays, `MemoryStream` buffers, large strings) cause expensive full GCs and fragmentation (memory grows though objects are freed). Fix with buffer reuse (`ArrayPool<T>`, `RecyclableMemoryStream`), streaming instead of loading everything, or occasional LOH compaction (`GCSettings.LargeObjectHeapCompactionMode`).

## [Advanced|Medium] How does virtual method dispatch work in the CLR?

Each type has a MethodTable with a vtable of slots for its virtual methods; derived types copy the base slots and replace those they override. A virtual call loads the object's MethodTable pointer, reads the slot for the method and calls that address — so the runtime type decides which implementation runs. Sealed types and JIT devirtualisation (with PGO) can turn these into direct calls and enable inlining.

## [Scenario|High] An ASP.NET Core API's memory grows steadily until the container is OOM-killed every few hours. What do you do?

Monitor GC counters to see if the managed heap (gen 2/LOH) grows or native memory grows. Take two `dotnet-gcdump` snapshots and compare the biggest growing types; check their roots. Common findings: an in-memory cache without limits, a singleton holding scoped objects or request data, event subscriptions, `HttpClient` created per request, large response buffering in the LOH. Also set container memory limits correctly (GC respects them), consider DATAS/workstation GC for small containers, and add alerts on memory growth.

## [Scenario|Medium] A console tool processes images and becomes slow with frequent gen-2 collections. Why?

Each image creates large byte arrays (> 85 KB) on the LOH; allocating many short-lived large objects forces gen-2 collections and fragments the LOH. Reuse buffers with `ArrayPool<byte>.Shared`, process images as streams, dispose `Bitmap`/image objects promptly (they hold native memory), and measure with BenchmarkDotNet's MemoryDiagnoser or `dotnet-counters`.

# Cheatsheet

## Architecture in one line

Source → Roslyn → assembly (IL + metadata + manifest) → host starts CLR → loader + type loader → JIT (tier 0 → tier 1 + PGO) → native code → GC manages heap.

## Version map

Framework 1.0 (2002) → 2.0 generics → 3.5 LINQ → 4.0 TPL → 4.5 async → 4.8 last (4.8.1 ARM64). Core 1.0 (2016) → 2.1 LTS → 3.1 LTS. .NET 5 (2020) → 6 LTS → 7 → 8 LTS → 9 → 10 LTS (2025). Even = LTS 3 yrs, odd = STS 2 yrs.

## GC essentials

Gen 0 → 1 → 2; LOH ≥ 85,000 bytes (not compacted); POH for pinned; Workstation vs Server (+ background, DATAS); roots = stacks, statics, handles; finalizers delay collection; never `GC.Collect()` in normal code.

## Dispose rules

`using`/`await using` everything disposable · `SafeHandle` instead of finalizers · `Dispose(bool)` + `GC.SuppressFinalize` for the full pattern · dispose what you own only.

## Diagnose

`dotnet-counters` (live) · `dotnet-gcdump` (heap) · `dotnet-dump analyze` (`dumpheap -stat`, `gcroot`) · `dotnet-trace` (CPU/events) · BenchmarkDotNet MemoryDiagnoser.
