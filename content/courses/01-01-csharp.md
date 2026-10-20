---
slug: csharp
title: C# Language — Basics to Advanced
track: foundations
order: 1
icon: C#
color: #68217a
summary: Types, control flow, collections, generics, delegates, async/await, memory and modern C# features up to C# 14.
---

# Overview

**C#** (pronounced "C sharp") is a modern, object-oriented, type-safe language created by Microsoft (lead designer Anders Hejlsberg) and standardised as ECMA-334. It compiles to **IL (Intermediate Language)** which the **.NET runtime (CLR)** turns into machine code with a JIT (or ahead of time with Native AOT).

Where C# is used:

- Web APIs and web apps — ASP.NET Core (MVC, Razor Pages, Web API, Blazor)
- Desktop — WPF, WinForms, .NET MAUI, WinUI
- Cloud and microservices — Azure Functions, containers, gRPC
- Games — Unity
- Data, ETL and background workers — Worker Services, console apps

Why interviewers care: almost every .NET round starts with C# fundamentals (value vs reference types, OOP, collections, LINQ, async) before moving to frameworks.

# Versions

| C# | Year | .NET / Visual Studio | Headline features |
|---|---|---|---|
| 1.0 | 2002 | .NET Framework 1.0, VS.NET 2002 | Classes, structs, interfaces, events, properties, delegates |
| 2.0 | 2005 | .NET Framework 2.0, VS 2005 | Generics, nullable value types, iterators (`yield`), anonymous methods, partial types |
| 3.0 | 2007 | .NET Framework 3.5, VS 2008 | LINQ, lambda expressions, `var`, extension methods, anonymous types, auto-properties, object/collection initialisers |
| 4.0 | 2010 | .NET Framework 4.0, VS 2010 | `dynamic`, named and optional parameters, generic co/contravariance |
| 5.0 | 2012 | .NET Framework 4.5, VS 2012 | `async` / `await`, caller-info attributes |
| 6.0 | 2015 | VS 2015 (Roslyn compiler) | String interpolation, `nameof`, `?.` null-conditional, expression-bodied members, exception filters |
| 7.0–7.3 | 2017–2018 | VS 2017 | Tuples, pattern matching, `out var`, local functions, `ref` returns, `in` parameters, `Span<T>` support |
| 8.0 | 2019 | .NET Core 3.0 | Nullable reference types, switch expressions, async streams, ranges `^1`/`..`, default interface methods, `using` declarations |
| 9.0 | 2020 | .NET 5 | Records, `init` setters, top-level statements, target-typed `new()`, relational/logical patterns |
| 10 | 2021 | .NET 6 (LTS) | Global usings, file-scoped namespaces, record structs |
| 11 | 2022 | .NET 7 | Raw string literals, `required` members, list patterns, generic math (static abstract interface members) |
| 12 | 2023 | .NET 8 (LTS) | Primary constructors for classes, collection expressions `[1, 2]`, alias any type |
| 13 | 2024 | .NET 9 | `params` collections, `System.Threading.Lock`, partial properties |
| 14 | 2025 | .NET 10 (LTS) | Extension members (extension blocks), the `field` keyword, null-conditional assignment `a?.B = x` |

> **Interview tip:** you don't need every row. Know the big ones: generics (2.0), LINQ (3.0), async/await (5.0), nullable reference types (8.0), records (9.0), and the version you use at work.

# Lifecycle

**How a C# program runs**

1. **Write** `.cs` files inside a project (`.csproj`).
2. **Build** — the Roslyn compiler turns C# into **IL** plus metadata, packaged in an **assembly** (`.dll`/`.exe`).
3. **Load** — the CLR loads the assembly, verifies the IL and resolves dependencies.
4. **JIT compile** — each method is compiled to native code the first time it is called (tiered compilation re-optimises hot methods). Native AOT compiles everything ahead of time instead.
5. **Execute** — managed code runs with type safety, exception handling and the garbage collector managing the heap.
6. **Unload / exit** — finalisers and `IDisposable` cleanup run; the process ends.

**Object lifecycle:** `new` → constructor runs → object lives on the managed heap while referenced → becomes unreachable → collected by the GC (Gen 0 → 1 → 2) → finaliser (if any) runs. Deterministic cleanup of unmanaged resources is done with `Dispose()` / `using`.

# Tools

| Tool | Use |
|---|---|
| Visual Studio 2022/2026 (Windows) | Full IDE: debugger, profiler, designers, test explorer |
| Visual Studio Code + C# Dev Kit | Lightweight cross-platform editor |
| JetBrains Rider | Cross-platform IDE with strong refactoring |
| .NET SDK / `dotnet` CLI | `dotnet new`, `build`, `run`, `test`, `publish` |
| NuGet | Package manager (`dotnet add package`) |
| LINQPad | Quick C#/LINQ scratchpad, great for interview practice |
| xUnit / NUnit / MSTest | Unit testing frameworks |
| BenchmarkDotNet | Micro-benchmarks |
| dotnet-trace, dotnet-counters, dotnet-dump | Diagnostics in production |
| ILSpy / SharpLab | See the IL and lowered C# the compiler produces |

# Module: Getting Started

## Lesson: [Basic|High] What C# and .NET are

C# is the **language**; .NET is the **platform** (runtime + base class library + SDK). You write C#, the compiler produces IL, and the .NET runtime executes it.

- **CLR** (Common Language Runtime): JIT, GC, type safety, exception handling, threading.
- **BCL** (Base Class Library): `System`, `System.Collections.Generic`, `System.IO`, `System.Net.Http`, ...
- **CTS / CLS**: the common type system that lets C#, F# and VB.NET interoperate.

```csharp
// Program.cs — a complete program using top-level statements (C# 9+)
Console.WriteLine("Hello, Divakar!");
var name = args.Length > 0 ? args[0] : "world";
Console.WriteLine($"Hello, {name}");
```

```bash
dotnet new console -n HelloApp
cd HelloApp
dotnet run -- Divakar
```

> **Interview tip:** "Managed code" = code whose execution is managed by the CLR (memory, security, exceptions). "Unmanaged code" = native code outside the CLR, e.g. Win32 DLLs called via P/Invoke.

## Lesson: [Basic|High] Value types vs reference types

| | Value types | Reference types |
|---|---|---|
| Examples | `int`, `double`, `bool`, `char`, `decimal`, `struct`, `enum`, `DateTime` | `class`, `string`, arrays, `delegate`, `interface`, `record` (class) |
| Variable holds | The data itself | A reference (address) to an object on the heap |
| Assignment | Copies the value | Copies the reference — both point to the same object |
| Default | `0`, `false`, ... | `null` |
| Stored | Inline: on the stack for locals, inside the containing object for fields | Object on the managed heap |

```csharp
struct Point { public int X; }
class Box { public int X; }

var p1 = new Point { X = 1 };
var p2 = p1;      // copy
p2.X = 99;
Console.WriteLine(p1.X); // 1

var b1 = new Box { X = 1 };
var b2 = b1;      // same object
b2.X = 99;
Console.WriteLine(b1.X); // 99
```

> **Interview tip:** "Value types live on the stack" is only partly true. A value-type *field* inside a class lives on the heap with that object. Say: value types are stored *inline* where they are declared.

## Lesson: [Basic|Medium] Variables, operators and control flow

```csharp
int age = 30;
var city = "Pune";            // type inferred at compile time — still strongly typed
const double Pi = 3.14159;    // compile-time constant
readonly DateTime created;    // (field) set once, in declaration or constructor

if (age >= 18 && city is "Pune" or "Mumbai") { /* ... */ }

for (int i = 0; i < 3; i++) { }
foreach (var c in "abc") { }
while (age-- > 25) { }
do { } while (false);

// switch expression (C# 8+)
string grade = score switch
{
    >= 90 => "A",
    >= 75 => "B",
    >= 50 => "C",
    _ => "F"
};

// null operators
string? s = null;
int len = s?.Length ?? 0;     // null-conditional + null-coalescing
s ??= "default";              // assign if null
```

- `==` compares values for value types and **references** for reference types unless overloaded (`string` overloads it to compare text).
- `is` checks type/pattern; `as` casts and returns `null` on failure instead of throwing.

## Lesson: [Basic|High] Strings, StringBuilder and immutability

`string` is a **reference type that behaves like a value**: it is immutable — every "change" creates a new string.

```csharp
string s = "a";
s += "b";            // allocates a new string "ab"; "a" becomes garbage

var sb = new StringBuilder();
for (int i = 0; i < 1000; i++) sb.Append(i).Append(',');
string csv = sb.ToString();   // one final allocation
```

- Use `StringBuilder` when concatenating in loops; for a few concatenations `+` or interpolation is fine.
- **String interning:** identical literals share one instance (`string.Intern`).
- Compare with `string.Equals(a, b, StringComparison.OrdinalIgnoreCase)` rather than `ToLower()`.
- `string.IsNullOrWhiteSpace(x)` covers `null`, `""` and `"   "`.

## Lesson: [Basic|High] Arrays and collections

| Type | When to use | Lookup |
|---|---|---|
| `T[]` | Fixed size | O(1) by index |
| `List<T>` | Growable list | O(1) index, O(n) search |
| `Dictionary<TKey,TValue>` | Key → value | O(1) average |
| `HashSet<T>` | Unique items, fast `Contains` | O(1) average |
| `Queue<T>` / `Stack<T>` | FIFO / LIFO | O(1) enqueue/push |
| `LinkedList<T>` | Many inserts/removes in the middle | O(1) insert with a node |
| `SortedDictionary` / `SortedList` | Ordered keys | O(log n) |
| `ConcurrentDictionary`, `ConcurrentQueue` | Multi-threaded access | thread-safe |
| `ImmutableList`, `FrozenDictionary` (.NET 8) | Read-only shared data | — |

```csharp
var prices = new Dictionary<string, decimal> { ["pen"] = 10m, ["book"] = 250m };
if (prices.TryGetValue("pen", out var p)) Console.WriteLine(p);

int[] nums = [5, 3, 8];          // collection expression (C# 12)
List<int> list = [.. nums, 10];   // spread
```

- `IEnumerable<T>` = can be iterated; `ICollection<T>` adds Count/Add/Remove; `IList<T>` adds index access.
- Prefer returning `IReadOnlyList<T>`/`IEnumerable<T>` from public APIs.

# Module: Types in Depth

## Lesson: [Basic|High] Classes, structs, records and enums

```csharp
public class Customer                       // reference type, identity semantics
{
    public int Id { get; init; }
    public required string Name { get; set; }  // required (C# 11)
}

public struct Money(decimal amount, string currency)   // value type; primary constructor (C# 12)
{
    public decimal Amount { get; } = amount;
    public string Currency { get; } = currency;
}

public record Order(int Id, decimal Total);  // reference type with VALUE equality
public record struct Coord(double Lat, double Lng);

public enum Status { Pending = 1, Shipped = 2, Delivered = 3 }

[Flags] public enum Perm { None = 0, Read = 1, Write = 2, Delete = 4 }
var p = Perm.Read | Perm.Write;
bool canWrite = p.HasFlag(Perm.Write);

var o1 = new Order(1, 100);
var o2 = o1 with { Total = 120 };   // non-destructive copy
Console.WriteLine(o1 == new Order(1, 100)); // True — value equality
```

**Choose:** class for entities with identity/behaviour; struct for small immutable values (< ~16 bytes, no inheritance); record for DTOs and immutable data compared by value.

## Lesson: [Basic|High] Boxing and unboxing

**Boxing** wraps a value type in an object on the heap; **unboxing** extracts it back with an explicit cast.

```csharp
int n = 42;
object o = n;        // boxing: heap allocation + copy
int m = (int)o;      // unboxing: type check + copy
// long l = (long)o; // InvalidCastException — must unbox to the exact type

var old = new System.Collections.ArrayList();
old.Add(1);          // boxes — avoid non-generic collections
var modern = new List<int>();
modern.Add(1);       // no boxing — generics
```

Cost: an allocation and later GC work. Generics (C# 2.0) removed most boxing.

## Lesson: [Intermediate|High] Nullable types and null safety

```csharp
int? maybe = null;                 // Nullable<int>
if (maybe.HasValue) Console.WriteLine(maybe.Value);
int value = maybe ?? -1;

#nullable enable                   // nullable reference types (C# 8) — on by default in new projects
string name = "x";                 // must not be null
string? middle = null;             // may be null
Console.WriteLine(middle?.Length); // compiler warns if you dereference without a check
string sure = middle!;             // null-forgiving operator — you promise it isn't null
```

Nullable reference types are **compile-time warnings only**; at runtime a `string` can still be null if a warning was ignored.

## Lesson: [Intermediate|Medium] Properties, indexers, static and const vs readonly

```csharp
public class Account
{
    private decimal _balance;
    public decimal Balance { get => _balance; private set => _balance = value >= 0 ? value : throw new ArgumentException(); }
    public string Owner { get; init; } = "";          // settable only during initialisation
    public static int Count { get; private set; }      // shared by all instances
    public string Tier { get; set { field = value.Trim(); } } = ""; // C# 14 'field' keyword
    public decimal this[int month] => _history[month]; // indexer
    private readonly decimal[] _history = new decimal[12];
}
```

| `const` | `readonly` | `static readonly` |
|---|---|---|
| Compile-time constant, implicitly static | Per instance, set in declaration or constructor | One per type, set at runtime once |
| Only primitives/strings | Any type | Any type |
| Value is **copied into calling assemblies** — changing it requires recompiling callers | Read at runtime | Read at runtime |

# Module: Methods and Functional C#

## Lesson: [Basic|High] Method parameters: ref, out, in, params, optional, named

```csharp
void Swap(ref int a, ref int b) { (a, b) = (b, a); }   // caller's variables change
bool TryParseAge(string s, out int age) => int.TryParse(s, out age); // must assign
double Length(in Vector3 v) => Math.Sqrt(v.X * v.X);  // read-only by reference (avoids copy of big struct)
int Sum(params int[] xs) => xs.Sum();                  // Sum(1,2,3)
void Send(string to, string subject = "Hi", bool urgent = false) { }

int x = 1, y = 2;
Swap(ref x, ref y);
Send("a@b.com", urgent: true);   // named argument skips optional ones
```

- **Pass by value** (default): for reference types the *reference* is copied, so the method can mutate the object but cannot make the caller point to a different one — unless you use `ref`.

## Lesson: [Intermediate|High] Delegates, Func, Action, events and lambdas

A **delegate** is a type-safe reference to a method. `Func<..., TResult>` returns a value, `Action<...>` returns void, `Predicate<T>` returns bool.

```csharp
Func<int, int, int> add = (a, b) => a + b;
Action<string> log = msg => Console.WriteLine(msg);
Predicate<int> isEven = n => n % 2 == 0;

public class Thermostat
{
    public event EventHandler<double>? TooHot;          // event = delegate with restricted access
    public void Read(double t) { if (t > 40) TooHot?.Invoke(this, t); }
}
var th = new Thermostat();
th.TooHot += (s, t) => Console.WriteLine($"Alert {t}");
th.Read(45);
```

- **Event vs delegate:** outside the class, an event can only be subscribed (`+=`) or unsubscribed (`-=`); it cannot be invoked or reassigned.
- **Multicast:** a delegate can hold several methods; all are invoked in order.
- **Closure:** a lambda captures variables from the outer scope (by reference, not by value).

## Lesson: [Intermediate|High] Extension methods, generics and constraints

```csharp
public static class StringExtensions
{
    public static bool IsEmail(this string s) => s.Contains('@');   // call as "x@y.com".IsEmail()
}

public class Repository<T> where T : class, IEntity, new()
{
    private readonly List<T> _items = [];
    public T Create() { var t = new T(); _items.Add(t); return t; }
}

T Max<T>(T a, T b) where T : IComparable<T> => a.CompareTo(b) >= 0 ? a : b;
```

Constraints: `where T : class`, `struct`, `new()`, `notnull`, `unmanaged`, a base class, an interface, or `T : U`.

**Covariance / contravariance:** `IEnumerable<out T>` lets `IEnumerable<string>` be used as `IEnumerable<object>`; `Action<in T>` lets `Action<object>` be used as `Action<string>`.

## Lesson: [Intermediate|Medium] Pattern matching, tuples and deconstruction

```csharp
object shape = new Circle(2);
double area = shape switch
{
    Circle { Radius: var r } => Math.PI * r * r,          // property pattern
    Rectangle(var w, var h) => w * h,                      // positional pattern
    null => throw new ArgumentNullException(nameof(shape)),
    _ => 0
};

if (order is { Status: Status.Shipped, Total: > 1000 }) { /* ... */ }
int[] arr = [1, 2, 3];
if (arr is [1, .., var last]) Console.WriteLine(last);    // list pattern (C# 11)

(string Name, int Age) GetUser() => ("Asha", 28);           // tuple
var (name, age) = GetUser();                                // deconstruction
```

# Module: Errors, Resources and Memory

## Lesson: [Basic|High] Exception handling

```csharp
try
{
    var text = File.ReadAllText(path);
}
catch (FileNotFoundException ex) when (path.EndsWith(".cfg"))   // exception filter
{
    logger.LogWarning(ex, "Config missing");
}
catch (IOException ex)
{
    throw new ConfigException("Could not read config", ex);      // wrap, keep inner exception
}
finally
{
    // always runs (cleanup)
}
```

- `throw;` rethrows and **keeps the original stack trace**; `throw ex;` resets it — avoid.
- Catch specific exceptions first, general ones last.
- Don't use exceptions for normal control flow; use `TryParse`-style APIs.
- Custom exception: derive from `Exception`, provide the standard constructors.

## Lesson: [Intermediate|High] IDisposable, using and the garbage collector

The **GC** frees managed memory automatically. It is **generational**: Gen 0 (new, collected often), Gen 1 (buffer), Gen 2 (long-lived). Objects ≥ 85,000 bytes go to the **Large Object Heap**.

Unmanaged resources (file handles, sockets, DB connections) must be released deterministically with `IDisposable`:

```csharp
using (var conn = new SqlConnection(cs))      // classic using block
{
    conn.Open();
}
using var file = File.OpenRead("data.csv");   // using declaration (C# 8): disposed at end of scope
await using var stream = new FileStream(...);  // IAsyncDisposable

public sealed class Wrapper : IDisposable
{
    private readonly SafeHandle _handle;
    private bool _disposed;
    public void Dispose()
    {
        if (_disposed) return;
        _handle.Dispose();
        _disposed = true;
    }
}
```

- **Finalizer** (`~ClassName()`) runs on the finaliser thread at an unknown time; only needed when you own a raw unmanaged handle. Call `GC.SuppressFinalize(this)` in `Dispose` when a finaliser exists.
- Calling `GC.Collect()` manually is almost always wrong.

## Lesson: [Advanced|Medium] Span<T>, Memory<T> and performance basics

`Span<T>` is a `ref struct` view over contiguous memory (array, stack, native) with **no allocation**.

```csharp
ReadOnlySpan<char> line = "2026-10-20,Pune,42";
int comma = line.IndexOf(',');
ReadOnlySpan<char> date = line[..comma];       // slice — no new string
int value = int.Parse(line[(line.LastIndexOf(',') + 1)..]);

Span<byte> buffer = stackalloc byte[256];      // stack memory, no GC
```

- `Span<T>` cannot be stored on the heap (no fields in classes, no boxing). Use `Memory<T>` when you need to keep it or use it across `await`.
- Other tools: `ArrayPool<T>.Shared`, `StringBuilder` pooling, avoiding LINQ in hot loops, `struct` enumerators.

# Module: Asynchronous and Parallel Programming

## Lesson: [Intermediate|High] async and await

`async`/`await` lets a method **wait for I/O without blocking a thread**. The compiler rewrites the method into a state machine.

```csharp
public async Task<string> GetPageAsync(HttpClient http, string url, CancellationToken ct)
{
    var response = await http.GetAsync(url, ct);   // thread returns to pool while waiting
    response.EnsureSuccessStatusCode();
    return await response.Content.ReadAsStringAsync(ct);
}

// run independent calls concurrently
var t1 = GetPageAsync(http, "https://a.example", ct);
var t2 = GetPageAsync(http, "https://b.example", ct);
string[] pages = await Task.WhenAll(t1, t2);
```

Rules:

- Return `Task`/`Task<T>` (or `ValueTask<T>` for hot paths that often complete synchronously). `async void` only for event handlers.
- **Don't block** on async code with `.Result` or `.Wait()` — it can deadlock in UI/old ASP.NET contexts and wastes threads.
- Pass `CancellationToken` through.
- In library code, `ConfigureAwait(false)` avoids capturing the synchronisation context (ASP.NET Core has none).

> **Interview tip:** async is about **scalability**, not speed. One request doesn't get faster; the server handles more concurrent requests because threads aren't blocked waiting on I/O.

## Lesson: [Intermediate|High] Threads, Tasks, Parallel and thread safety

| Tool | Use for |
|---|---|
| `Thread` | Rarely directly; dedicated long-running thread |
| `Task.Run` | Push CPU-bound work to the thread pool |
| `Parallel.For/ForEach/ForEachAsync` | Data parallelism over collections |
| PLINQ `.AsParallel()` | Parallel LINQ queries |
| `Channel<T>` | Producer/consumer pipelines |

```csharp
private readonly Lock _gate = new();      // C# 13 / .NET 9 (use 'object' on older versions)
private int _count;
public void Increment() { lock (_gate) { _count++; } }

Interlocked.Increment(ref _hits);         // lock-free atomic counter
var cache = new ConcurrentDictionary<string, User>();
var user = cache.GetOrAdd(id, LoadUser);

using var sem = new SemaphoreSlim(3);     // at most 3 concurrent operations
await sem.WaitAsync();
try { await CallApiAsync(); } finally { sem.Release(); }
```

**Race condition:** two threads read-modify-write shared state without synchronisation. **Deadlock:** two threads each hold a lock the other needs — avoid by always taking locks in the same order and keeping lock scopes small. You cannot `await` inside a `lock` block — use `SemaphoreSlim`.

## Lesson: [Advanced|Medium] IEnumerable, yield and async streams

```csharp
IEnumerable<int> Evens(int max)
{
    for (int i = 0; i <= max; i += 2)
        yield return i;          // lazy: produced one at a time when iterated
}

async IAsyncEnumerable<Order> ReadOrdersAsync([EnumeratorCancellation] CancellationToken ct = default)
{
    await foreach (var row in db.StreamAsync(ct))
        yield return Map(row);
}

await foreach (var o in ReadOrdersAsync()) Console.WriteLine(o.Id);
```

Deferred execution: nothing runs until you enumerate (`foreach`, `ToList()`, `Count()`). Enumerating twice runs the work twice.

# Module: Modern C# and Reflection

## Lesson: [Advanced|Medium] Reflection, attributes and dynamic

```csharp
[AttributeUsage(AttributeTargets.Property)]
public sealed class MaskAttribute : Attribute { }

public class User { public string Name { get; set; } = ""; [Mask] public string Pan { get; set; } = ""; }

foreach (var prop in typeof(User).GetProperties())
{
    bool masked = prop.GetCustomAttribute<MaskAttribute>() is not null;
    Console.WriteLine($"{prop.Name}: {(masked ? "****" : prop.GetValue(user))}");
}

dynamic d = JsonSerializer.Deserialize<ExpandoObject>(json)!;  // resolved at runtime (DLR)
```

Reflection is slow-ish and not trim/AOT-friendly; modern .NET prefers **source generators** (e.g. `System.Text.Json` source-gen, `[LoggerMessage]`, `[GeneratedRegex]`).

## Lesson: [Advanced|Low] What's new in C# 12, 13 and 14

```csharp
// C# 12 — primary constructors and collection expressions
public class OrderService(IOrderRepo repo, ILogger<OrderService> log)
{
    public Task<Order?> Get(int id) => repo.FindAsync(id);
}
int[] a = [1, 2, 3];

// C# 13 — params collections and the Lock type
void Log(params ReadOnlySpan<string> parts) { }
Lock gate = new();

// C# 14 — extension members, field keyword, null-conditional assignment
public static class EnumerableExtensions
{
    extension<T>(IEnumerable<T> source)
    {
        public bool IsEmpty => !source.Any();          // extension PROPERTY
    }
}
customer?.Address = newAddress;                         // assigns only if customer is not null
```

# Interview

## [Beginner|High] What is the difference between a value type and a reference type?

A **value type** variable holds the data itself (`int`, `bool`, `decimal`, `DateTime`, any `struct`/`enum`). Assigning it copies the value. A **reference type** variable holds a reference to an object on the managed heap (`class`, `string`, arrays, delegates, `record`). Assigning it copies the reference, so two variables can point to the same object.

```csharp
var a = new List<int>(); var b = a; b.Add(1);   // a.Count == 1 — same object
int x = 1; int y = x; y++;                       // x is still 1
```

Value types are stored inline (stack for locals, inside the parent object for fields); reference-type objects always live on the heap and are cleaned up by the GC.

## [Beginner|High] What is the difference between `string` and `StringBuilder`?

`string` is **immutable**: every concatenation creates a new string object, so building a string in a loop causes many allocations (O(n²) copying). `StringBuilder` keeps a **mutable buffer** and appends in place; call `ToString()` once at the end. Use `StringBuilder` for loops or many appends, plain strings/interpolation for a handful of pieces.

## [Beginner|High] Explain `const` vs `readonly` vs `static readonly`.

- `const`: compile-time constant, implicitly static, only primitives/strings; the value is **baked into callers** at compile time.
- `readonly`: instance field assigned at declaration or in a constructor; can differ per object.
- `static readonly`: one value per type, computed at runtime (e.g. `static readonly HttpClient Client = new()`).

Gotcha: if library A has `public const int Max = 10` and app B uses it, changing it to 20 in A does nothing in B until B is recompiled. Use `static readonly` for values that may change.

## [Beginner|High] What are boxing and unboxing? Why avoid them?

Boxing converts a value type to `object` (or an interface) by allocating a heap object and copying the value; unboxing casts it back to the **exact** value type. It costs an allocation, a copy and GC pressure. Typical sources: non-generic collections (`ArrayList`), `string.Format` with value-type arguments on old APIs, calling interface methods on structs via the interface. Generics remove most boxing.

## [Beginner|High] What is the difference between `==` and `.Equals()`?

For **reference types**, `==` compares references unless the operator is overloaded; `Equals()` is virtual and can be overridden to compare content. `string` overloads both to compare text. **Records** generate value-based `Equals` and `==`. For value types, `Equals` compares content. When you override `Equals`, also override `GetHashCode` (objects that are equal must have the same hash code, or dictionaries break).

## [Beginner|High] What are `ref`, `out` and `in` parameters?

All three pass an argument **by reference**:

- `ref` — must be initialised before the call; the method can read and change it.
- `out` — need not be initialised; the method **must** assign it (used by `TryParse`).
- `in` — read-only reference; avoids copying large structs.

## [Beginner|Medium] What is the difference between `var`, `dynamic` and `object`?

`var` is **compile-time** type inference — the variable is strongly typed (`var x = 5` is an `int`). `object` is the base type; you need casts to use members. `dynamic` skips compile-time checks and resolves members **at runtime** through the DLR; errors appear as `RuntimeBinderException`. Use `dynamic` only for COM interop, dynamic JSON or scripting scenarios.

## [Beginner|Medium] What is the difference between an array, `ArrayList` and `List<T>`?

An array has a fixed size and a single element type. `ArrayList` (non-generic, legacy) stores `object`, so value types get boxed and you need casts. `List<T>` is generic, type-safe, resizable (it doubles its internal array when full) and has no boxing. Always prefer `List<T>`.

## [Intermediate|High] Explain `IEnumerable`, `ICollection`, `IList` and `IQueryable`.

- `IEnumerable<T>`: forward-only iteration (`foreach`), deferred execution with LINQ to Objects, runs **in memory**.
- `ICollection<T>`: adds `Count`, `Add`, `Remove`, `Contains`.
- `IList<T>`: adds index access and `Insert`.
- `IQueryable<T>`: builds an **expression tree** that a provider (EF Core) translates to SQL and runs **in the database**.

```csharp
db.Orders.Where(o => o.Total > 100).ToList();                 // IQueryable: WHERE in SQL
db.Orders.AsEnumerable().Where(o => o.Total > 100).ToList();  // loads ALL rows then filters in memory
```

## [Intermediate|High] What are delegates and events? How do they differ?

A delegate is a type-safe function pointer (`Func`, `Action`, custom `delegate`). It can be multicast. An **event** wraps a delegate so outside code can only `+=`/`-=` handlers; only the declaring class can raise it. This prevents subscribers from wiping out other handlers (`= null`) or raising the event themselves. Pattern: `public event EventHandler<TArgs>? Changed;` and raise with `Changed?.Invoke(this, args)`.

## [Intermediate|High] How does async/await work internally? Does it create a new thread?

No new thread is created by `await`. The compiler turns the method into a **state machine**. When it hits `await` on an incomplete task, the method returns to its caller and the thread goes back to the pool. When the I/O completes, a continuation resumes the state machine — on the captured synchronisation context if there is one (UI thread), otherwise on a thread-pool thread. CPU-bound work still needs `Task.Run` or parallelism to move off the current thread.

## [Intermediate|High] What is the difference between `Task.WhenAll` and awaiting tasks one by one?

Awaiting sequentially makes total time the **sum** of the calls; starting all tasks and then `await Task.WhenAll(...)` makes it roughly the **longest** single call. `WhenAll` throws the first exception when awaited, but the returned task's `Exception` holds all of them. Use `WhenAny` for "first to finish" or timeouts.

## [Intermediate|High] Why is `async void` dangerous?

Callers can't await it, so they can't know when it finishes, and an exception thrown inside crashes the process (it is raised on the synchronisation context instead of being stored in a Task). Use `async Task` everywhere except event handlers.

## [Intermediate|High] What is `IDisposable` and the `using` statement? Dispose vs Finalize?

`IDisposable.Dispose()` releases unmanaged resources (connections, file handles) **deterministically**. `using` guarantees `Dispose` is called even if an exception is thrown (compiles to `try/finally`). A **finaliser** is called by the GC at an unpredictable time and costs an extra GC cycle; it is only a safety net for raw unmanaged handles. In `Dispose` call `GC.SuppressFinalize(this)` if a finaliser exists. Most code just wraps `SafeHandle` and never writes a finaliser.

## [Intermediate|High] Explain garbage collection generations.

The heap is split into **Gen 0** (new objects, collected very often and cheaply), **Gen 1** (survivors of Gen 0, a buffer), and **Gen 2** (long-lived objects, collected rarely and expensively). Most objects die young, so collecting Gen 0 frequently is efficient. Objects of 85,000 bytes or more go to the **Large Object Heap**, collected with Gen 2. .NET has workstation and server GC modes, plus background (concurrent) GC for Gen 2.

## [Intermediate|Medium] What are extension methods? Any limitations?

Static methods in a static class whose first parameter has `this`, called as if they were instance methods. LINQ is built on them. Limitations: they can't access private members, an instance method with the same signature always wins, and they're resolved at compile time (no polymorphism). C# 14 adds extension *members* (properties, static members) via `extension` blocks.

## [Intermediate|Medium] What is the difference between `struct` and `class`?

Struct: value type, copied on assignment, no inheritance (can implement interfaces), can't have a parameterless constructor before C# 10, ideal for small immutable data. Class: reference type, supports inheritance and polymorphism, lives on the heap, compared by reference by default. Large mutable structs are a common bug source (you modify a copy).

## [Intermediate|Medium] What are records and when do you use them?

`record` (C# 9) is a class with **value-based equality**, a generated `ToString`, deconstruction and `with` expressions for non-destructive copies. `record struct` (C# 10) is the value-type version. Use them for DTOs, messages, events and value objects. Avoid them for EF Core entities that are tracked by identity and mutated.

## [Intermediate|Medium] What are generics and what problem do they solve?

Generics let you write type-safe code once for many types (`List<T>`, `Repository<T>`). They remove casts and boxing, and errors show up at compile time. Constraints (`where T : class, new()`) restrict which types can be used. For value types the JIT generates specialised code; for reference types the code is shared.

## [Intermediate|Medium] What is the difference between `throw` and `throw ex`?

`throw;` rethrows the current exception and **preserves the original stack trace**. `throw ex;` throws it again from the current line, losing where it really failed. To add context, throw a new exception and pass the original as `innerException`.

## [Advanced|High] How do you make code thread-safe? Compare lock, Monitor, SemaphoreSlim, Interlocked and concurrent collections.

- `lock` (sugar for `Monitor.Enter/Exit`): mutual exclusion inside one process, synchronous only.
- `SemaphoreSlim`: limits concurrency to N and supports `WaitAsync`, so use it when you must `await` inside the critical section.
- `Interlocked`: atomic operations on single variables (increment, compare-exchange), lock-free.
- `ConcurrentDictionary`/`ConcurrentQueue`/`Channel<T>`: built-in thread-safe structures.
- Immutability: data that never changes needs no locks.
- Across processes/servers: database locks, distributed locks (Redis, blob leases), `Mutex` for the same machine.

## [Advanced|High] What causes a deadlock with async code and how do you avoid it?

Classic case: in a UI app or old ASP.NET (with a synchronisation context), code calls `task.Result`. The blocked thread holds the context; the awaited method's continuation needs the same context to resume, so both wait forever. Fixes: go **async all the way** (`await` instead of `.Result`), use `ConfigureAwait(false)` in library code, and never mix blocking and async calls. ASP.NET Core has no synchronisation context, but blocking still causes **thread-pool starvation** under load.

## [Advanced|Medium] What are `Span<T>` and `Memory<T>`?

`Span<T>` is a stack-only (`ref struct`) view over contiguous memory: arrays, `stackalloc` or native memory. You can slice and parse without allocating new arrays or strings. It can't be a class field, boxed or used across `await`. `Memory<T>` is the heap-storable counterpart, usable in async methods. Both are used heavily inside ASP.NET Core and System.Text.Json for performance.

## [Advanced|Medium] What is the difference between `Task` and `ValueTask`?

`Task` is a class, so every async call that returns one allocates (except cached completed tasks). `ValueTask<T>` is a struct that avoids the allocation when the result is often available **synchronously** (e.g. from a cache). Rules: await a `ValueTask` only **once**, don't await it concurrently, and convert with `.AsTask()` if you need to. The default is still `Task`.

## [Advanced|Low] What are covariance and contravariance?

They allow implicit conversion of generic type arguments. **Covariance** (`out T`) works for outputs: `IEnumerable<string>` → `IEnumerable<object>`. **Contravariance** (`in T`) works for inputs: `Action<object>` → `Action<string>`, `IComparer<Animal>` used as `IComparer<Dog>`. Only interfaces and delegates support this, and only for reference types.

## [Advanced|Low] What are source generators and why are they replacing reflection?

Source generators run during compilation and add C# code to the project. They remove runtime reflection costs, work with trimming and Native AOT, and catch errors at build time. Examples: `System.Text.Json` `JsonSerializerContext`, `[LoggerMessage]`, `[GeneratedRegex]`, `[LibraryImport]`.

## [Scenario|High] A method builds a CSV of 200,000 rows using `+=` on a string and takes minutes. What do you do?

String concatenation in a loop copies the whole string every time, so the work is O(n²). Replace it with a `StringBuilder`, or better, **stream** the rows straight to the output (`StreamWriter`, or `PipeWriter` in ASP.NET Core) so the full file is never held in memory. Measure before and after with a stopwatch or BenchmarkDotNet. For huge exports, page the database query and write as you read.

## [Scenario|High] Your API's memory keeps growing until the pod restarts. How would you investigate?

1. Confirm the trend with `dotnet-counters` (GC heap size, Gen 2 count, LOH size).
2. Take memory dumps a few minutes apart with `dotnet-dump collect` (or `dotnet-gcdump`) and compare which types grow, using Visual Studio, PerfView or `dotnet-dump analyze` (`dumpheap -stat`, `gcroot`).
3. Usual culprits: static collections or caches with no eviction, event handlers never unsubscribed, `HttpClient` created per request, undisposed streams/DbContexts, large byte arrays on the LOH, unbounded `MemoryCache`.
4. Fix (size-limited cache, `IHttpClientFactory`, `using`, weak events), then load-test to confirm.

## [Scenario|High] Two users update the same in-memory counter and some increments are lost. Why, and how do you fix it?

`count++` is read, add, write — three steps. Two threads can read the same value and both write value+1, so one increment is lost (a race condition). Fix with `Interlocked.Increment(ref count)`, a `lock`, or a concurrent type. If the counter must survive restarts or work across several servers, keep it in the database (`UPDATE ... SET Count = Count + 1`) or in Redis `INCR` instead.

## [Scenario|Medium] A synchronous method calls `GetDataAsync().Result` and the app hangs under load. Explain and fix.

Blocking on async code ties up a thread while it waits. In a context with a synchronisation context it can deadlock. In ASP.NET Core it causes thread-pool starvation: every request blocks a thread, the pool grows slowly, and requests queue up. Fix: make the call chain async (`await`) from the controller down to the I/O call. If a sync API is truly unavoidable, use a properly synchronous library call rather than sync-over-async.

## [Scenario|Medium] You need to call 500 external URLs as fast as possible without getting rate-limited. How?

Use async I/O with **bounded concurrency**: `Parallel.ForEachAsync(urls, new ParallelOptions { MaxDegreeOfParallelism = 10 }, ...)` or a `SemaphoreSlim` with `Task.WhenAll`. Reuse one `HttpClient` from `IHttpClientFactory`. Add retries with exponential backoff (Polly / `Microsoft.Extensions.Http.Resilience`), respect `429 Retry-After`, and pass cancellation tokens and timeouts.

# Cheatsheet

## Types at a glance

| Category | Types |
|---|---|
| Integral | `byte` `short` `int` (32-bit) `long` (64-bit), unsigned variants |
| Floating | `float` (~7 digits), `double` (~15–16 digits), `decimal` (28–29 digits, use for **money**) |
| Others | `bool`, `char` (UTF-16), `string`, `object`, `DateTime`, `DateOnly`, `TimeOnly`, `Guid` |
| User-defined | `class`, `struct`, `record`, `record struct`, `interface`, `enum`, `delegate` |

Value types are copied on assignment; reference types share one object.

## Keywords people mix up

- `const` vs `readonly`: compile-time and copied into callers vs set once at runtime.
- `is` vs `as`: `is` tests a type/pattern (bool); `as` casts or gives `null`.
- `ref` vs `out` vs `in`: read/write vs must assign vs read-only.
- `abstract` vs `virtual`: no body, must override vs has a body, may override.
- `sealed`: can't inherit (class) or override further (method).
- `new` modifier: hides a base member (no polymorphism).
- `static` class: can't be instantiated; only static members.
- `throw;` keeps the stack trace; `throw ex;` loses it.

## Null handling

```csharp
x?.Prop          // null if x is null
x ?? fallback    // fallback if null
x ??= value      // assign if null
x!               // "trust me, not null"
x is null / x is not null
ArgumentNullException.ThrowIfNull(x);
```

## Collections — pick fast

| Need | Use |
|---|---|
| Ordered list | `List<T>` |
| Key lookup | `Dictionary<K,V>` |
| Unique items | `HashSet<T>` |
| FIFO / LIFO | `Queue<T>` / `Stack<T>` |
| Thread-safe map | `ConcurrentDictionary<K,V>` |
| Producer/consumer | `Channel<T>` |
| Read-only, read-heavy | `FrozenDictionary` / `ImmutableArray` |

## async rules

- `async Task` / `Task<T>`; `async void` only for event handlers.
- Never `.Result` / `.Wait()` — async all the way.
- Independent calls: `await Task.WhenAll(...)`.
- Pass `CancellationToken`.
- CPU-bound: `Task.Run` / `Parallel`; I/O-bound: just `await`.
- Use `SemaphoreSlim` (not `lock`) around `await`.

## Memory & disposal

- GC generations 0/1/2; LOH ≥ 85,000 bytes.
- `using` / `await using` for `IDisposable` / `IAsyncDisposable`.
- Finaliser = last-resort safety net; `GC.SuppressFinalize`.
- Leaks: static collections, events not unsubscribed, `HttpClient` per call, unbounded caches.
- Low-allocation code: `Span<T>`, `ArrayPool`, `StringBuilder`, `stackalloc`.

## Modern syntax quick list

```csharp
record Person(string Name, int Age);              // C# 9
var p2 = p1 with { Age = 31 };
global using System.Text.Json;                     // C# 10
namespace Shop.Api;                                // file-scoped
var json = """{"name": "Divakar"}""";              // raw string (C# 11)
public required string Name { get; init; }         // required (C# 11)
class Svc(IRepo repo) { }                          // primary ctor (C# 12)
int[] xs = [1, 2, ..others];                       // collection expressions (C# 12)
order?.Status = Status.Shipped;                    // C# 14
```

## The 6 answers to have ready

1. Value vs reference types (with the stack/heap nuance).
2. `string` immutability + `StringBuilder`.
3. `IEnumerable` vs `IQueryable`.
4. async/await doesn't create threads; no `.Result`.
5. `IDisposable` + `using` + GC generations.
6. Delegates vs events.
