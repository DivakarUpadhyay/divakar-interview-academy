---
slug: csharp
title: C# Language — Basics to Advanced
track: dotnet
order: 1
group: Languages & Internals
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

## Lesson: [Basic|High] First program, namespaces and keywords

**Classic program structure** (what every C# file looked like before C# 9, and what top-level statements generate for you):

```csharp
using System;                       // import a namespace so you can write Console instead of System.Console

namespace Divakar.Shop              // logical grouping of types; usually matches the folder
{
    internal class Program          // every method lives inside a type
    {
        static void Main(string[] args)   // entry point: static, named Main, returns void or int (or Task/Task<int>)
        {
            Console.WriteLine("Hello, Divakar!");
            Console.Write("Your name: ");
            string? name = Console.ReadLine();
            Console.WriteLine($"Welcome {name}");   // string interpolation
        }
    }
}
```

**Modern equivalent (C# 10+):**

```csharp
// GlobalUsings.cs — applies to every file in the project
global using System.Text.Json;

// Customer.cs — file-scoped namespace saves one level of indentation
namespace Divakar.Shop.Models;
public class Customer { public string Name { get; set; } = ""; }

// Program.cs — top-level statements: the compiler creates Program and Main
using Divakar.Shop.Models;
var c = new Customer { Name = "Asha" };
Console.WriteLine(JsonSerializer.Serialize(c));
```

**Namespaces:**

- Prevent name clashes (`Divakar.Shop.Models.Order` vs `Divakar.Billing.Order`).
- `using` imports a namespace; `using Alias = Some.Long.Namespace.Type;` creates an alias; `using static System.Math;` lets you write `Sqrt(2)`.
- Implicit usings (`<ImplicitUsings>enable</ImplicitUsings>` in the .csproj) auto-import `System`, `System.Linq`, `System.Collections.Generic`, `System.IO`, `System.Threading.Tasks` and more.
- A namespace is not an assembly: one assembly (DLL) can contain many namespaces and one namespace can span many assemblies.

**Keywords** are reserved words with special meaning: `class`, `int`, `if`, `return`, `public`, `static`, `new`, `this`, `base`, `null`, `true`... You can't use them as identifiers unless prefixed with `@` (`int @class = 5;`). **Contextual keywords** are only special in certain places and can otherwise be used as names: `var`, `async`, `await`, `get`, `set`, `init`, `value`, `yield`, `record`, `required`, `where`, `select`, `field` (C# 14).

**Naming conventions:** `PascalCase` for types, methods, properties and namespaces; `camelCase` for locals and parameters; `_camelCase` for private fields; interfaces start with `I` (`IRepository`); async methods end with `Async`.

## Lesson: [Basic|High] Data types, numbers and type conversion

| C# keyword | .NET type | Size | Range / precision | Literal |
|---|---|---|---|---|
| `byte` / `sbyte` | `Byte` / `SByte` | 1 byte | 0–255 / −128–127 | `255` |
| `short` / `ushort` | `Int16` / `UInt16` | 2 bytes | ±32,767 / 0–65,535 | `100` |
| `int` / `uint` | `Int32` / `UInt32` | 4 bytes | ±2.1 billion | `42`, `42u` |
| `long` / `ulong` | `Int64` / `UInt64` | 8 bytes | ±9.2 × 10¹⁸ | `42L` |
| `float` | `Single` | 4 bytes | ~6–9 digits, binary floating point | `1.5f` |
| `double` | `Double` | 8 bytes | ~15–17 digits, binary floating point (default for decimals) | `1.5` |
| `decimal` | `Decimal` | 16 bytes | 28–29 digits, base-10 — **use for money** | `1.5m` |
| `char` | `Char` | 2 bytes | One UTF-16 code unit | `'A'` |
| `bool` | `Boolean` | 1 byte | `true` / `false` | `true` |
| `string` | `String` | reference | Immutable text | `"text"` |
| `object` | `Object` | reference | Base of every type | — |

```csharp
Console.WriteLine(0.1 + 0.2 == 0.3);       // False — binary floating point can't store 0.1 exactly
Console.WriteLine(0.1m + 0.2m == 0.3m);    // True  — decimal is exact for base-10 values
int big = 1_000_000;                        // digit separators
int hex = 0xFF, bin = 0b1010;

// Integer overflow wraps silently by default...
int max = int.MaxValue;
int wrapped = unchecked(max + 1);           // -2147483648
// ...unless you ask for checking
try { int boom = checked(max + 1); } catch (OverflowException) { Console.WriteLine("Overflow!"); }

Console.WriteLine(7 / 2);     // 3   — integer division truncates
Console.WriteLine(7 / 2.0);   // 3.5
Console.WriteLine(7 % 2);     // 1   — remainder
Console.WriteLine(Math.Round(2.5));                              // 2 — banker's rounding (to even) by default
Console.WriteLine(Math.Round(2.5, MidpointRounding.AwayFromZero)); // 3
```

**Type conversion:**

| Kind | Example | Notes |
|---|---|---|
| Implicit (widening) | `long l = intValue; double d = intValue;` | Safe, no data loss, no syntax needed |
| Explicit cast (narrowing) | `int i = (int)3.99;` → `3` | May lose data; truncates decimals |
| `Convert` class | `Convert.ToInt32("42")`, `Convert.ToInt32(3.5)` → `4` | Rounds to even; `null` → 0 |
| `Parse` | `int.Parse("42")` | Throws `FormatException` on bad input |
| `TryParse` | `int.TryParse(input, out var n)` | Returns `false` instead of throwing — **use for user input** |
| `as` / `is` | `obj as string`, `obj is int n` | Reference/pattern conversions without exceptions |

```csharp
if (int.TryParse(Console.ReadLine(), out int qty) && qty > 0)
    Console.WriteLine($"Ordering {qty}");
else
    Console.WriteLine("Please enter a positive number");

decimal price = decimal.Parse("1,234.50", NumberStyles.Number, CultureInfo.InvariantCulture); // culture decides what , and . mean
```

> **Interview tip:** "Why decimal for money?" — `double` is binary and can't represent 0.1 exactly, so sums drift (`0.1 + 0.2 != 0.3`). `decimal` stores base-10 digits exactly, at the cost of speed and memory.

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

## Lesson: [Basic|High] Variables, constants and operators

```csharp
int age = 30;                 // declare + initialise; a local must be assigned before use
var city = "Pune";            // type inferred at compile time — still strongly typed (city is string)
const double Pi = 3.14159;    // compile-time constant
// readonly DateTime created; // (field only) set once, in declaration or constructor
int a = 10, b = 3;            // several variables in one statement
```

**Scope:** a variable exists inside the `{ }` block where it is declared; locals are not visible outside their method, loop or `if` block.

| Category | Operators | Example |
|---|---|---|
| Arithmetic | `+ - * / %` `++ --` | `a % b` → 1; `i++` (use then add) vs `++i` (add then use) |
| Assignment | `= += -= *= /= %= ??=` | `total += price;` |
| Comparison | `== != > < >= <=` | `age >= 18` |
| Logical | `&& \|\| !` (short-circuit), `& \|` (always evaluate both) | `isAdmin \|\| isOwner` |
| Bitwise | `& \| ^ ~ << >>` | `flags & Perm.Write` |
| Null | `?.` `?[]` `??` `??=` `!` | `name?.Length ?? 0` |
| Type | `is`, `as`, `typeof`, `sizeof`, `nameof` | `obj is string s` |
| Conditional | `? :` | `age >= 18 ? "adult" : "minor"` |
| Range / index | `..` `^` | `arr[^1]` last item, `arr[1..3]` |
| Lambda | `=>` | `x => x * 2` |

```csharp
int i = 5;
Console.WriteLine(i++);   // 5 (then i = 6)
Console.WriteLine(++i);   // 7

string? s = null;
int len = s?.Length ?? 0;     // null-conditional + null-coalescing
s ??= "default";              // assign only if null

Console.WriteLine(2 + 3 * 4);       // 14 — * before + (precedence)
Console.WriteLine((2 + 3) * 4);     // 20 — use brackets to make intent clear
```

- `==` compares values for value types and **references** for reference types unless overloaded (`string` overloads it to compare text; records compare values).
- `&&` and `||` **short-circuit**: `if (user != null && user.IsActive)` never touches `user` when it is null.
- `is` checks type/pattern; `as` casts and returns `null` on failure instead of throwing.

## Lesson: [Basic|High] Conditions and loops: if, ternary, switch, for, while, do-while

**if / else if / else and the ternary operator:**

```csharp
if (marks >= 75) Console.WriteLine("Distinction");
else if (marks >= 35) Console.WriteLine("Pass");
else Console.WriteLine("Fail");

string result = marks >= 35 ? "Pass" : "Fail";           // ternary: condition ? whenTrue : whenFalse
string label = marks >= 75 ? "A" : marks >= 35 ? "B" : "F";  // nesting works but hurts readability
```

**switch statement and switch expression:**

```csharp
switch (day)
{
    case DayOfWeek.Saturday:
    case DayOfWeek.Sunday:            // stacked cases share one body
        Console.WriteLine("Weekend");
        break;                        // C# does not allow fall-through from a non-empty case
    case DayOfWeek.Friday when isHoliday:   // case guard
        Console.WriteLine("Long weekend");
        break;
    default:
        Console.WriteLine("Weekday");
        break;
}

string grade = score switch          // switch expression (C# 8+) returns a value
{
    >= 90 => "A",
    >= 75 and < 90 => "B",
    >= 50 => "C",
    _ => "F"                         // discard = default
};
```

**Loops:**

| Loop | Checks condition | Use when |
|---|---|---|
| `for` | Before each iteration | You know the count / need the index |
| `foreach` | — iterates a collection | Read every item (can't add/remove items of the collection while looping) |
| `while` | Before (may run 0 times) | Repeat until something changes |
| `do-while` | After (runs at least once) | Menus, retry prompts |

```csharp
for (int i = 0; i < 5; i++) Console.Write(i);           // 01234
for (int i = 10; i > 0; i -= 2) Console.Write(i);       // 108642

foreach (var name in new[] { "Asha", "Ravi" }) Console.WriteLine(name);

int attempts = 0;
while (!Connect() && attempts < 3) attempts++;

string? input;
do
{
    Console.Write("Enter yes or no: ");
    input = Console.ReadLine();
} while (input is not ("yes" or "no"));

for (int i = 1; i <= 10; i++)
{
    if (i % 2 == 0) continue;   // skip the rest of this iteration
    if (i > 7) break;           // leave the loop
    Console.Write(i);           // 1357
}
```

Nested loops: `break` only leaves the innermost loop — extract the loops into a method and `return`, or use a flag. `goto` exists but is almost never used.

> **Interview tip:** "for vs foreach" — `foreach` works on any `IEnumerable`, is cleaner and avoids index bugs; `for` gives the index and lets you modify elements of an array/list by position. Modifying a `List<T>` (Add/Remove) inside `foreach` throws `InvalidOperationException`.

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

## Lesson: [Basic|Medium] DateTime, DateOnly, TimeSpan and time zones

```csharp
DateTime now = DateTime.Now;          // local time of the machine
DateTime utc = DateTime.UtcNow;       // UTC — store and compare in UTC
DateTime d = new DateTime(2026, 10, 24, 9, 30, 0);
DateTime tomorrow = DateTime.Today.AddDays(1);

TimeSpan gap = new DateTime(2026, 12, 31) - DateTime.Today;   // difference = TimeSpan
Console.WriteLine($"{gap.TotalDays:N0} days left");
TimeSpan timeout = TimeSpan.FromSeconds(30);

Console.WriteLine(d.ToString("yyyy-MM-dd HH:mm"));   // 2026-10-24 09:30 (custom format)
Console.WriteLine(d.ToString("D"));                   // long date in current culture
Console.WriteLine(d.ToString("O"));                   // ISO 8601 round-trip: 2026-10-24T09:30:00.0000000

if (DateTime.TryParseExact("24/10/2026", "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
    Console.WriteLine(parsed.DayOfWeek);              // Saturday

DateOnly birthday = new(1991, 5, 14);                 // .NET 6+: date without time
TimeOnly opening = new(9, 0);                         // time without date
DateTimeOffset placed = DateTimeOffset.UtcNow;        // instant + offset — best for timestamps across time zones

var india = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");   // "Asia/Kolkata" on Linux (.NET 6+ accepts both)
DateTime indiaTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, india);
```

| Type | Holds | Use for |
|---|---|---|
| `DateTime` | Date + time, `Kind` = Local/Utc/Unspecified | General use; store as UTC |
| `DateTimeOffset` | Date + time + UTC offset | Timestamps in APIs and databases |
| `DateOnly` / `TimeOnly` | Just a date / just a time | Birthdays, opening hours |
| `TimeSpan` | A duration | Differences, timeouts |
| `TimeProvider` (.NET 8) | Abstraction of "now" | Unit-testable time |

> **Interview tip:** `DateTime` is a **struct** (value type) and is immutable — `d.AddDays(1)` returns a new value, it doesn't change `d`. Store UTC, convert to local only for display.

# Module: Arrays and Collections

## Lesson: [Basic|High] Arrays: single, multidimensional and jagged

An **array** is a fixed-size, zero-indexed block of elements of one type. Arrays are reference types (derived from `System.Array`), even when the elements are value types.

```csharp
int[] marks = new int[5];                 // five zeros
int[] primes = { 2, 3, 5, 7 };            // initializer
string[] cities = ["Pune", "Taipei"];     // collection expression (C# 12)

marks[0] = 90;
Console.WriteLine(primes.Length);         // 4
Console.WriteLine(primes[^1]);            // 7 — index from end
int[] middle = primes[1..3];              // { 3, 5 } — range creates a copy
// primes[10] = 1;                        // IndexOutOfRangeException

// Multidimensional (rectangular) array: one block, every row same length
int[,] grid = { { 1, 2, 3 }, { 4, 5, 6 } };
Console.WriteLine(grid[1, 2]);            // 6
Console.WriteLine(grid.GetLength(0));     // 2 rows
Console.WriteLine(grid.GetLength(1));     // 3 columns
for (int r = 0; r < grid.GetLength(0); r++)
    for (int c = 0; c < grid.GetLength(1); c++)
        Console.Write(grid[r, c] + " ");

// Jagged array: an array of arrays, rows can have different lengths
int[][] jagged = new int[3][];
jagged[0] = [1];
jagged[1] = [1, 2];
jagged[2] = [1, 2, 3];
Console.WriteLine(jagged[2][1]);          // 2
foreach (int[] row in jagged) Console.WriteLine(string.Join(",", row));
```

**Useful `Array` methods:** `Array.Sort(arr)`, `Array.Reverse(arr)`, `Array.IndexOf(arr, x)`, `Array.Find(arr, predicate)`, `Array.Resize(ref arr, newSize)` (creates a new array and copies), `Array.Copy`, `Array.Fill`, `arr.Clone()` (shallow copy).

| | Multidimensional `int[,]` | Jagged `int[][]` |
|---|---|---|
| Shape | Rectangular — all rows equal | Rows can differ |
| Memory | One contiguous object | Outer array + one array per row |
| Access | `a[r, c]` | `a[r][c]` |
| Speed | Slightly slower indexing in the CLR | Usually faster, more flexible |

## Lesson: [Basic|High] Collections overview: generic vs non-generic

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

**Generic vs non-generic collections:**

| Non-generic (`System.Collections`, .NET 1.x) | Generic replacement (`System.Collections.Generic`, .NET 2.0+) |
|---|---|
| `ArrayList` | `List<T>` |
| `Hashtable` | `Dictionary<TKey, TValue>` |
| `SortedList` | `SortedList<TKey, TValue>` |
| `Stack`, `Queue` | `Stack<T>`, `Queue<T>` |

Generic collections are **type-safe** (compile-time errors instead of runtime `InvalidCastException`) and **faster for value types** (no boxing). Use the non-generic ones only when maintaining old code.

## Lesson: [Basic|High] List<T> and Dictionary<TKey, TValue> in depth

```csharp
var names = new List<string> { "Ravi", "Asha" };
names.Add("Meera");
names.AddRange(["Kiran", "John"]);
names.Insert(0, "Zoya");                  // at index
names.Remove("John");                     // first match; returns bool
names.RemoveAt(0);
names.RemoveAll(n => n.StartsWith("K"));
bool hasAsha = names.Contains("Asha");
int idx = names.IndexOf("Meera");
string? first = names.Find(n => n.Length > 4);
names.Sort();                             // in place
names.ForEach(Console.WriteLine);
Console.WriteLine($"{names.Count} items, capacity {names.Capacity}");
```

- `List<T>` is a resizable array: `Count` = items, `Capacity` = allocated slots; when full it **doubles** and copies — pass an initial capacity if you know the size.
- Index access O(1); `Contains`/`IndexOf`/`Remove` are O(n); inserting at the start is O(n).

```csharp
var stock = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
{
    ["pen"] = 10,
    ["book"] = 4
};
stock.Add("bag", 2);                      // throws ArgumentException if the key exists
stock["pen"] = 12;                        // add or overwrite
if (stock.TryGetValue("book", out int qty)) Console.WriteLine(qty);
stock.TryAdd("pen", 99);                  // false — key already there, no exception
bool removed = stock.Remove("bag");
foreach (var (item, count) in stock) Console.WriteLine($"{item}: {count}");
// var x = stock["laptop"];               // KeyNotFoundException — use TryGetValue
```

- Average O(1) lookup using the key's `GetHashCode()` and `Equals()`; keys must be unique and not null.
- Iteration order is **not guaranteed** — use `SortedDictionary`/`SortedList` or sort with LINQ when order matters.
- Custom key types must override `Equals` and `GetHashCode` consistently (records do this for you).

## Lesson: [Basic|Medium] SortedList, HashSet, Stack and Queue

```csharp
// SortedList<TKey,TValue>: kept sorted by key; arrays inside → small memory, O(n) inserts
var ranks = new SortedList<int, string> { [3] = "Bronze", [1] = "Gold", [2] = "Silver" };
foreach (var kv in ranks) Console.WriteLine($"{kv.Key}: {kv.Value}");   // 1 Gold, 2 Silver, 3 Bronze
Console.WriteLine(ranks.Keys[0]);     // index access to keys/values

// HashSet<T>: unique items, O(1) Contains, set operations
var skills = new HashSet<string> { "C#", "SQL" };
skills.Add("C#");                     // ignored — returns false
skills.UnionWith(["Azure", "SQL"]);   // C#, SQL, Azure
skills.IntersectWith(["SQL", "Azure", "React"]);   // SQL, Azure

// Stack<T>: LIFO — last in, first out (undo, call stack, bracket matching)
var undo = new Stack<string>();
undo.Push("type A"); undo.Push("type B");
Console.WriteLine(undo.Peek());       // type B (look, don't remove)
Console.WriteLine(undo.Pop());        // type B (remove)
// undo.Pop() on an empty stack throws InvalidOperationException — use TryPop

// Queue<T>: FIFO — first in, first out (jobs, BFS, print queue)
var jobs = new Queue<string>();
jobs.Enqueue("email"); jobs.Enqueue("invoice");
Console.WriteLine(jobs.Dequeue());    // email
Console.WriteLine(jobs.TryPeek(out var next) ? next : "empty");   // invoice

// PriorityQueue<TElement,TPriority> (.NET 6): lowest priority value comes out first
var pq = new PriorityQueue<string, int>();
pq.Enqueue("low", 5); pq.Enqueue("urgent", 1);
Console.WriteLine(pq.Dequeue());      // urgent
```

| Collection | Ordered by | Duplicates | Typical use |
|---|---|---|---|
| `SortedList<K,V>` | Key (array-based) | Keys unique | Small, mostly-read sorted maps |
| `SortedDictionary<K,V>` | Key (tree-based) | Keys unique | Many inserts/removes, sorted |
| `HashSet<T>` / `SortedSet<T>` | None / sorted | No | Uniqueness, set maths |
| `Stack<T>` | LIFO | Yes | Undo, parsing |
| `Queue<T>` | FIFO | Yes | Work queues, BFS |

## Lesson: [Basic|Medium] ArrayList and Hashtable (legacy non-generic collections)

You will meet these in old .NET Framework code and in interviews.

```csharp
using System.Collections;

var list = new ArrayList();
list.Add(1);            // boxed to object
list.Add("two");        // anything goes — no type safety
list.Add(3.5);
foreach (object o in list) Console.WriteLine(o);
int first = (int)list[0]!;          // cast needed; wrong cast → InvalidCastException at runtime

var table = new Hashtable();
table["IN"] = "India";
table["TW"] = "Taiwan";
table["IN"] = "Bharat";             // overwrite
Console.WriteLine(table["XX"] == null);   // True — missing key returns null (Dictionary throws)
foreach (DictionaryEntry e in table) Console.WriteLine($"{e.Key} = {e.Value}");
```

| | `ArrayList` | `List<T>` | `Hashtable` | `Dictionary<K,V>` |
|---|---|---|---|---|
| Type safety | ❌ object | ✅ | ❌ object | ✅ |
| Boxing of value types | Yes | No | Yes | No |
| Missing key | — | — | Returns `null` | Throws (use `TryGetValue`) |
| Thread safety | `ArrayList.Synchronized` wrapper | No (use concurrent collections) | Safe for many readers + one writer | No |

> **Interview tip:** "Hashtable vs Dictionary" — Dictionary is generic (type-safe, no boxing, faster); a missing key throws in Dictionary but returns null in Hashtable; both are hash-based with O(1) average lookup. Use `ConcurrentDictionary` for multi-threaded writes.

## Lesson: [Intermediate|Medium] Tuple and ValueTuple

```csharp
// System.Tuple (.NET 4): class, read-only, members named Item1..Item7
Tuple<int, string> t1 = Tuple.Create(1, "Asha");
Console.WriteLine(t1.Item2);

// System.ValueTuple (C# 7): struct, mutable fields, can have names, nice syntax
(int Id, string Name) t2 = (1, "Asha");
Console.WriteLine(t2.Name);
t2.Name = "Ravi";

(int Min, int Max) MinMax(int[] xs) => (xs.Min(), xs.Max());   // return several values
var (min, max) = MinMax([4, 9, 1]);                             // deconstruction
Console.WriteLine($"{min}-{max}");

(a, b) = (b, a);                      // swap without a temp variable
var counts = new Dictionary<(string City, int Year), int> { [("Pune", 2026)] = 10 };   // tuple as a composite key
```

| | `Tuple<...>` | `ValueTuple` `( , )` |
|---|---|---|
| Kind | Class (heap) | Struct (no allocation) |
| Members | `Item1`, `Item2` … read-only properties | Named fields, mutable |
| Equality | Value equality via `Equals` | `==` and `Equals` compare values |
| Use | Legacy APIs | Modern code: multiple return values, quick grouping |

For public APIs with a meaning, prefer a **record** (`record MinMax(int Min, int Max)`) — tuple names are not part of the type at runtime.

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

## Lesson: [Basic|Medium] Structs and enums in depth

**Struct rules:**

```csharp
public readonly struct Temperature        // readonly struct: all fields immutable, compiler-enforced
{
    public double Celsius { get; }
    public Temperature(double celsius) => Celsius = celsius;
    public double Fahrenheit => Celsius * 9 / 5 + 32;
    public override string ToString() => $"{Celsius:0.#}°C";
}

var t = new Temperature(36.6);
Temperature empty = default;              // all fields zero — a struct is never null
Temperature? maybe = null;                // Nullable<Temperature> if you need "no value"
```

- Value type: copied on assignment and when passed to methods (unless `ref`/`in`).
- No inheritance (sealed, derive from `System.ValueType`), but **can implement interfaces**.
- Can have constructors, properties, methods, operators; parameterless constructors and field initialisers allowed since C# 10.
- Keep structs **small and immutable**; a mutable struct inside a collection or property leads to "I changed a copy" bugs.

**Enum in depth:**

```csharp
public enum OrderStatus : byte            // underlying type (default int)
{
    Pending = 1,
    Paid = 2,
    Shipped = 3,
    Cancelled = 9
}

OrderStatus s = OrderStatus.Paid;
int code = (int)s;                                   // 2
OrderStatus fromCode = (OrderStatus)3;               // Shipped
string name = s.ToString();                          // "Paid"
bool ok = Enum.TryParse("shipped", ignoreCase: true, out OrderStatus parsed);
bool defined = Enum.IsDefined(typeof(OrderStatus), 5);   // false — casts don't validate!
foreach (var v in Enum.GetValues<OrderStatus>()) Console.WriteLine(v);

[Flags]
public enum Permission { None = 0, Read = 1, Write = 2, Delete = 4, All = Read | Write | Delete }
var p = Permission.Read | Permission.Write;          // combine with OR
p |= Permission.Delete;                              // add
p &= ~Permission.Write;                              // remove
bool canRead = (p & Permission.Read) != 0;           // or p.HasFlag(Permission.Read)
Console.WriteLine(p);                                // "Read, Delete"
```

- Enum values are named constants of an integral type; `[Flags]` values must be powers of two so they can combine as bits.
- Any integer can be cast to an enum, even undefined ones — validate input with `Enum.IsDefined` or a `switch` with a default.
- Store enums in databases as int (stable) or string (readable); never reorder existing values.

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

## Lesson: [Basic|High] var, object initializers, anonymous types and dynamic

**`var` (implicitly typed local, C# 3):** the compiler infers the type from the right-hand side; the variable is still statically typed.

```csharp
var count = 10;                 // int
var customers = new List<Customer>();
// var x;                       // error — must be initialised
// var y = null;                // error — no type to infer
count = "ten";                  // error — count is int forever
```

Use `var` when the type is obvious from the right side or very long; write the type when it helps the reader (`decimal total = GetTotal();`).

**Object and collection initializers:** set properties right after construction without writing many constructors.

```csharp
var c = new Customer { Id = 1, Name = "Asha", Address = new Address { City = "Pune" } };
var cities = new List<string> { "Pune", "Taipei" };
var phoneBook = new Dictionary<string, string> { ["Asha"] = "98200", ["Ravi"] = "98300" };
Customer c2 = new() { Name = "Ravi" };       // target-typed new (C# 9)
```

The constructor runs first, then each property setter in order. Combine with `init` / `required` properties for immutable objects that must be fully initialised.

**Anonymous types:** read-only, compiler-generated classes without a name — mainly for LINQ projections inside one method.

```csharp
var person = new { Name = "Asha", Age = 28 };
Console.WriteLine(person.Name);
// person.Age = 30;             // error — properties are read-only
var summary = orders.Select(o => new { o.Id, Total = o.Lines.Sum(l => l.Price) });   // property names inferred
Console.WriteLine(new { A = 1 }.Equals(new { A = 1 }));   // True — value equality
```

Limits: only usable with `var` (no type name), can't be returned from a method in a typed way (use a record or tuple instead), properties only.

**`dynamic` (C# 4):** type checking moves from compile time to **runtime** (Dynamic Language Runtime).

```csharp
dynamic d = 10;
d = "now a string";               // allowed
Console.WriteLine(d.Length);      // resolved at runtime → 12
// d.NoSuchMethod();              // compiles, but throws RuntimeBinderException at runtime

dynamic bag = new ExpandoObject();   // add members at runtime
bag.Name = "Asha";
bag.Greet = (Func<string>)(() => $"Hi {bag.Name}");
Console.WriteLine(bag.Greet());      // used for COM interop (Office), dynamic languages, loose data
```

| | `var` | `object` | `dynamic` |
|---|---|---|---|
| Type decided | Compile time (inferred) | Compile time (`object`) | Runtime |
| IntelliSense / compile errors | ✅ | Only object members | ❌ |
| Needs casting | No | Yes | No |
| Performance | Normal | Boxing for value types | Slower (runtime binding) |

> **Interview tip:** "Is `var` the same as `dynamic`?" — No. `var` is just shorthand; the compiler fixes the type at compile time. `dynamic` skips compile-time checks and binds at runtime, so mistakes become runtime exceptions.

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

## Lesson: [Intermediate|Medium] Anonymous methods, Predicate and multicast delegates

**From named method → anonymous method → lambda** (the same delegate, three syntaxes through C# history):

```csharp
public delegate int Calc(int a, int b);         // custom delegate type: the method "signature"

static int Add(int a, int b) => a + b;
Calc c1 = Add;                                   // C# 1: named method
Calc c2 = delegate (int a, int b) { return a * b; };   // C# 2: anonymous method
Calc c3 = (a, b) => a - b;                       // C# 3: lambda expression
Console.WriteLine(c1(4, 2) + c2(4, 2) + c3(4, 2));     // 6 + 8 + 2 = 16
```

Anonymous methods can omit the parameter list (`delegate { ... }`) when you ignore the parameters; otherwise lambdas replaced them.

**Built-in generic delegates:**

| Delegate | Signature | Example |
|---|---|---|
| `Func<T1, ..., TResult>` | Up to 16 inputs, returns `TResult` | `Func<decimal, decimal> tax = p => p * 0.18m;` |
| `Action<T1, ...>` | Up to 16 inputs, returns `void` | `Action<string> log = Console.WriteLine;` |
| `Predicate<T>` | One input, returns `bool` | `Predicate<int> isAdult = age => age >= 18;` |

```csharp
var ages = new List<int> { 12, 25, 17, 40 };
Predicate<int> isAdult = a => a >= 18;
List<int> adults = ages.FindAll(isAdult);        // List<T>.FindAll/Find/RemoveAll take Predicate<T>
Func<int, bool> sameIdea = a => a >= 18;         // LINQ uses Func<T,bool>: ages.Where(sameIdea)
```

**Multicast delegates:** one delegate instance can hold an invocation list of several methods.

```csharp
static void Email(string msg) => Console.WriteLine($"Email: {msg}");
static void Sms(string msg) => Console.WriteLine($"SMS: {msg}");

Action<string> notify = Email;
notify += Sms;
notify += msg => Console.WriteLine($"Push: {msg}");
notify("Order shipped");        // all three run, in order
notify -= Sms;                  // remove works with the same method; a lambda can't be removed unless you kept a reference to it
notify("Delivered");            // Email + Push

Func<int> f = () => 1;
f += () => 2;
Console.WriteLine(f());         // 2 — only the LAST return value is kept
```

If one handler throws, the remaining handlers don't run — loop over `GetInvocationList()` and wrap each call in try/catch when you need isolation.

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

**Covariance / contravariance:** `IEnumerable<out T>` lets `IEnumerable<string>` be used as `IEnumerable<object>`; `Action<in T>` lets `Action<object>` be used as `Action<string>` — see the next lesson.

## Lesson: [Advanced|Medium] Covariance and contravariance

Variance answers: "if `Dog` is an `Animal`, can a `Something<Dog>` be used where a `Something<Animal>` is expected?"

| Term | Direction | Keyword | Works when T is… | Example |
|---|---|---|---|---|
| **Covariance** | `Dog` → `Animal` (more derived to less) | `out T` | only **returned** (output) | `IEnumerable<out T>`, `Func<out TResult>`, `IReadOnlyList<out T>` |
| **Contravariance** | `Animal` → `Dog` (less derived to more) | `in T` | only **accepted** (input) | `Action<in T>`, `IComparer<in T>`, `Predicate<in T>` |
| Invariance | Exact type only | — | both in and out | `List<T>`, `IList<T>`, `Dictionary<K,V>` |

```csharp
class Animal { public string Name = ""; }
class Dog : Animal { }

IEnumerable<Dog> dogs = new List<Dog> { new() { Name = "Rex" } };
IEnumerable<Animal> animals = dogs;          // ✅ covariance: you only read Animals out of it

Action<Animal> feed = a => Console.WriteLine($"Feeding {a.Name}");
Action<Dog> feedDog = feed;                  // ✅ contravariance: something that handles any Animal can handle a Dog

Func<Dog> makeDog = () => new Dog();
Func<Animal> makeAnimal = makeDog;           // ✅ covariant return

// List<Animal> list = new List<Dog>();      // ❌ invariant: otherwise you could Add(new Cat()) into a list of dogs

// Your own variant interface
public interface IProducer<out T> { T Produce(); }          // T only in output positions
public interface IConsumer<in T> { void Consume(T item); }   // T only in input positions
```

Arrays are covariant too (`object[] objs = new string[3];`), but it's **unsafe**: `objs[0] = 1;` compiles and throws `ArrayTypeMismatchException` at runtime — one reason to prefer generic collections.

> **Interview tip:** Remember "**out** = things come **out** (return values) → covariance; **in** = things go **in** (parameters) → contravariance". Variance works only for interfaces and delegates, and only with reference types (`IEnumerable<int>` is not an `IEnumerable<object>`).

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
- Custom exception: derive from `Exception`, provide the standard constructors (next lesson).

## Lesson: [Basic|High] Built-in exceptions, throw and custom exceptions

**Exception hierarchy:** everything derives from `System.Exception`. Common built-in exceptions:

| Exception | Thrown when |
|---|---|
| `NullReferenceException` | You use a member of a `null` reference |
| `ArgumentException` / `ArgumentNullException` / `ArgumentOutOfRangeException` | A method receives an invalid argument (throw these yourself to validate input) |
| `InvalidOperationException` | The object's state doesn't allow the call (e.g. modifying a list during `foreach`, `First()` on empty sequence) |
| `IndexOutOfRangeException` | Array index outside its bounds |
| `KeyNotFoundException` | Dictionary indexer with a missing key |
| `InvalidCastException` | Bad explicit cast / unboxing to the wrong type |
| `FormatException` | `int.Parse("abc")` |
| `OverflowException` | `checked` arithmetic overflows |
| `DivideByZeroException` | Integer division by zero (`double` gives Infinity instead) |
| `FileNotFoundException`, `DirectoryNotFoundException`, `IOException` | File system problems |
| `NotImplementedException` / `NotSupportedException` | Method not written yet / operation not supported by design |
| `TimeoutException`, `OperationCanceledException` / `TaskCanceledException` | Timeouts and cancellation |
| `HttpRequestException` | `HttpClient` call failed |
| `OutOfMemoryException`, `StackOverflowException` | Runtime failures — the latter can't be caught and kills the process |

**Throwing:**

```csharp
public void Withdraw(decimal amount)
{
    ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);            // .NET 8 throw helpers
    if (amount > Balance) throw new InsufficientFundsException(Balance, amount);
    Balance -= amount;
}

public Customer(string name) => Name = name ?? throw new ArgumentNullException(nameof(name));   // throw expression

try { Save(); }
catch (SqlException ex)
{
    log.LogError(ex, "Save failed");
    throw;                  // ✅ rethrow keeps the original stack trace
    // throw ex;            // ❌ resets the stack trace to this line
}
```

**Custom exception:**

```csharp
public class InsufficientFundsException : Exception
{
    public decimal Balance { get; }
    public decimal Requested { get; }

    public InsufficientFundsException() { }
    public InsufficientFundsException(string message) : base(message) { }
    public InsufficientFundsException(string message, Exception inner) : base(message, inner) { }
    public InsufficientFundsException(decimal balance, decimal requested)
        : base($"Balance {balance} is less than requested {requested}.")
        => (Balance, Requested) = (balance, requested);
}

try { account.Withdraw(5000); }
catch (InsufficientFundsException ex) when (ex.Requested > 1000)
{
    Console.WriteLine($"Large withdrawal refused: {ex.Message}");
}
```

Guidelines: name ends with `Exception`; derive from `Exception` (not `ApplicationException`); add properties with useful data; create custom exceptions only when callers will catch them specifically — otherwise use the built-in ones.

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

# Module: Files and Streams

## Lesson: [Basic|Medium] File, Directory and Path — quick file operations

The static classes in `System.IO` do one-line file work:

```csharp
string folder = Path.Combine(AppContext.BaseDirectory, "data");   // builds paths with the right separator (\ or /)
Directory.CreateDirectory(folder);                                  // no error if it already exists
string file = Path.Combine(folder, "notes.txt");

File.WriteAllText(file, "Line 1\n");               // create or overwrite
File.AppendAllText(file, "Line 2\n");              // add to the end
File.WriteAllLines(file, ["a", "b", "c"]);
string all = File.ReadAllText(file);
string[] lines = File.ReadAllLines(file);           // whole file in memory
foreach (var line in File.ReadLines(file))          // lazy — one line at a time, good for big files
    Console.WriteLine(line);

if (File.Exists(file)) File.Copy(file, Path.Combine(folder, "backup.txt"), overwrite: true);
File.Move(file, Path.Combine(folder, "renamed.txt"));
File.Delete(Path.Combine(folder, "backup.txt"));

foreach (var csv in Directory.EnumerateFiles(folder, "*.csv", SearchOption.AllDirectories))
    Console.WriteLine(Path.GetFileName(csv));

Console.WriteLine(Path.GetExtension("report.pdf"));            // .pdf
Console.WriteLine(Path.GetFileNameWithoutExtension("report.pdf")); // report
string temp = Path.GetTempFileName();

await File.WriteAllTextAsync(file, "async version");          // async versions for servers/UI apps
```

Watch out for: missing folders (`DirectoryNotFoundException`), files locked by another process (`IOException`), permissions (`UnauthorizedAccessException`), and building paths with string concatenation (use `Path.Combine`). Never build paths from user input without validating them (path traversal like `..\..\web.config`).

## Lesson: [Basic|Medium] FileInfo and DirectoryInfo

`FileInfo` / `DirectoryInfo` are **instance** classes: create one object for a path and use its properties and methods repeatedly (security checks happen once, and you get metadata).

```csharp
var info = new FileInfo(@"C:\data\orders.csv");
if (info.Exists)
{
    Console.WriteLine($"{info.Name} {info.Length / 1024} KB, modified {info.LastWriteTime:g}");
    Console.WriteLine(info.Extension);          // .csv
    Console.WriteLine(info.DirectoryName);      // C:\data
    info.CopyTo(@"C:\archive\orders.csv", overwrite: true);
    using StreamReader reader = info.OpenText();
    Console.WriteLine(reader.ReadLine());
}

var dir = new DirectoryInfo(@"C:\data");
foreach (FileInfo f in dir.GetFiles("*.log").Where(f => f.LastWriteTime < DateTime.Now.AddDays(-30)))
    f.Delete();                                 // clean up logs older than 30 days
DirectoryInfo sub = dir.CreateSubdirectory("2026");
```

| | `File` / `Directory` (static) | `FileInfo` / `DirectoryInfo` (instance) |
|---|---|---|
| Usage | One-off operations | Several operations on the same file/folder |
| Metadata | Separate calls (`File.GetLastWriteTime`) | Properties (`Length`, `CreationTime`, `Attributes`) |
| Refresh | Always current | Cached — call `Refresh()` for fresh values |

## Lesson: [Intermediate|Medium] Streams, StreamReader/StreamWriter and async file I/O

A **stream** is a sequence of bytes you read or write piece by piece, so huge files never need to fit in memory. `Stream` is the abstract base for `FileStream`, `MemoryStream`, `NetworkStream`, `BufferedStream`, `GZipStream`, `CryptoStream`…

```csharp
// Text: StreamWriter / StreamReader wrap a stream and handle encoding (UTF-8 by default)
using (var writer = new StreamWriter("log.txt", append: true))
{
    writer.WriteLine($"{DateTime.UtcNow:O} Started");
}   // Dispose flushes and closes the file

using var reader = new StreamReader("big.csv");
string? line;
long count = 0;
while ((line = await reader.ReadLineAsync()) != null)   // streams line by line
    if (line.Contains("ERROR")) count++;

// Bytes: FileStream with explicit options
await using var fs = new FileStream("photo.jpg", FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize: 81920, useAsync: true);
var buffer = new byte[81920];
int read;
while ((read = await fs.ReadAsync(buffer)) > 0) { /* process buffer[..read] */ }

// Copy one stream into another (e.g. upload → Blob storage, file → HTTP response)
await using var source = File.OpenRead("report.pdf");
await using var target = File.Create("copy.pdf");
await source.CopyToAsync(target);

// MemoryStream: a stream over a byte[] in memory — handy for tests and in-memory files
using var ms = new MemoryStream();
await JsonSerializer.SerializeAsync(ms, new { Id = 1 });
byte[] json = ms.ToArray();

// Compression by chaining streams
await using var zip = new GZipStream(File.Create("data.gz"), CompressionLevel.Optimal);
await using var zipWriter = new StreamWriter(zip);
await zipWriter.WriteAsync("compressed text");
```

| Class | Purpose |
|---|---|
| `FileStream` | Read/write bytes in a file (`FileMode`: Create, Open, Append, OpenOrCreate) |
| `StreamReader` / `StreamWriter` | Text on top of any stream, with encoding |
| `BinaryReader` / `BinaryWriter` | Primitive types as binary |
| `MemoryStream` | In-memory byte buffer |
| `BufferedStream`, `GZipStream`, `CryptoStream` | Decorators that add buffering, compression, encryption |

> **Interview tip:** Always dispose streams (`using` / `await using`) — otherwise file handles stay locked and buffered data may never be written. Use async I/O in web apps so threads aren't blocked while waiting for the disk.

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

## [Beginner|High] Why should you use `decimal` instead of `double` for money?

`double` is binary floating point and can't represent many base-10 fractions exactly (0.1 + 0.2 != 0.3), so totals drift by tiny amounts that show up in invoices and reports. `decimal` stores base-10 digits exactly with 28–29 significant digits. Trade-off: `decimal` is slower and uses 16 bytes, so use `double` for scientific/graphics maths and `decimal` for money and quantities that must add up exactly. In SQL Server map it to `DECIMAL(18,2)`, not `FLOAT`.

## [Beginner|High] What is the difference between `Parse`, `TryParse` and `Convert`?

`int.Parse("x")` throws `FormatException` for bad input (and `ArgumentNullException` for null). `int.TryParse(s, out var n)` returns `false` instead of throwing — use it for user input. `Convert.ToInt32(value)` accepts many types (object, double, string), returns 0 for `null`, and rounds doubles to the nearest even number (`Convert.ToInt32(2.5)` → 2) whereas a cast truncates (`(int)2.9` → 2). Pass a `CultureInfo` when parsing numbers and dates from files or APIs.

## [Beginner|High] What is the difference between `Dictionary` and `Hashtable`?

`Dictionary<TKey,TValue>` is generic: type-safe, no boxing, faster; a missing key with the indexer throws `KeyNotFoundException` (use `TryGetValue`). `Hashtable` is the old non-generic version storing `object` keys/values: needs casts, boxes value types, and returns `null` for a missing key. Both are hash tables with O(1) average lookup. For multiple threads use `ConcurrentDictionary`.

## [Beginner|High] What is the difference between a multidimensional and a jagged array?

A multidimensional (rectangular) array `int[,]` is one object where every row has the same length, accessed as `a[r, c]`. A jagged array `int[][]` is an array of arrays — each row is a separate array and can have a different length, accessed as `a[r][c]`. Jagged arrays are more flexible and often faster in .NET; rectangular arrays suit fixed grids such as matrices.

## [Beginner|Medium] When do you use for, foreach, while and do-while?

`for` when you need the index or a counted loop; `foreach` to read every item of any `IEnumerable` (cleanest, but you can't add/remove items of a `List` inside it); `while` to repeat while a condition is true (may run zero times); `do-while` when the body must run at least once (menus, retry prompts). `break` exits the loop, `continue` skips to the next iteration.

## [Beginner|Medium] What is a namespace? Explain the two meanings of `using`.

A namespace groups related types and prevents name clashes (`Shop.Models.Order` vs `Billing.Order`). The `using` **directive** (`using System.Text;`) imports a namespace — plus `using static`, aliases and `global using`. The `using` **statement/declaration** (`using var conn = new SqlConnection(...)`) calls `Dispose()` automatically at the end of the scope, even if an exception is thrown.

## [Beginner|Medium] What are anonymous types?

Compiler-generated, unnamed classes with read-only properties, created with `new { Name = "Asha", Age = 28 }` and used through `var`. They have value-based `Equals`/`GetHashCode`, and are mostly used for LINQ projections within one method. They can't be returned in a typed way or have methods — use a record or a tuple for that.

## [Beginner|Medium] What is the difference between Stack and Queue?

`Stack<T>` is LIFO — `Push` adds to the top, `Pop` removes the most recent, `Peek` reads it (undo, expression parsing, DFS). `Queue<T>` is FIFO — `Enqueue` adds at the back, `Dequeue` removes the oldest (job processing, BFS, buffering). Both are O(1) for add/remove; `TryPop`/`TryDequeue` avoid exceptions on empty collections; `PriorityQueue<T,P>` dequeues by priority.

## [Intermediate|High] How do you create a custom exception, and when should you?

Derive from `Exception`, end the name with `Exception`, provide the standard constructors (parameterless, message, message + inner exception) plus constructors/properties for useful data (e.g. `Balance`, `Requested`). Create one only when callers need to catch that specific situation (e.g. `InsufficientFundsException` → show a friendly message or return 409); otherwise throw the built-in ones (`ArgumentException`, `InvalidOperationException`). Always pass the inner exception when wrapping.

## [Intermediate|Medium] What is the difference between `Tuple` and `ValueTuple`?

`Tuple<T1,...>` (.NET 4) is a class on the heap with read-only `Item1`, `Item2` properties. `ValueTuple` (C# 7, syntax `(int Id, string Name)`) is a struct — no allocation — with named, mutable fields, deconstruction (`var (id, name) = ...`) and `==` support. Use ValueTuple for returning several values from private/internal methods; use a record for public APIs because tuple element names are not kept at runtime.

## [Intermediate|Medium] What is the difference between `Func`, `Action` and `Predicate`?

All are built-in generic delegate types. `Func<T1..., TResult>` takes up to 16 inputs and returns a value (`Func<int,int,int> add`). `Action<T1...>` takes inputs and returns `void` (`Action<string> log`). `Predicate<T>` takes one input and returns `bool`, used by `List<T>.Find/FindAll/RemoveAll`; LINQ uses `Func<T,bool>` for the same idea.

## [Intermediate|Medium] What is a multicast delegate?

A delegate whose invocation list contains several methods, built with `+=` and reduced with `-=`. Invoking it calls each method in order; for delegates with a return value only the last result is returned, and an exception in one handler stops the rest. Events are built on multicast delegates — that's how many subscribers receive one event.

## [Intermediate|Medium] How do you read a very large file efficiently in C#?

Stream it instead of loading it all: `File.ReadLines(path)` (lazy `IEnumerable<string>`) or a `StreamReader` with `ReadLineAsync` in a loop, a `FileStream` with a reasonable buffer for binary data, and `CopyToAsync` to move data between streams. Avoid `File.ReadAllText/ReadAllLines` for large files (whole file in memory), dispose streams with `using`, and use async I/O in server apps.

## [Intermediate|Medium] DateTime vs DateTimeOffset — which should you store?

`DateTime` holds a date/time with a `Kind` (Local, Utc, Unspecified) but no offset, so the same value can mean different instants on different servers. `DateTimeOffset` stores the instant plus the UTC offset, so it is unambiguous. Store UTC (`DateTime.UtcNow` or `DateTimeOffset`) in databases and APIs, convert to the user's time zone only for display, use `DateOnly` for pure dates like birthdays, and `TimeProvider` to make "now" testable.

## [Intermediate|Medium] What is a `[Flags]` enum?

An enum whose values are powers of two (`Read = 1, Write = 2, Delete = 4`) so several can be combined in one value with bitwise OR (`Read | Write`). Test with `(value & Flag) != 0` or `HasFlag`, remove with `value &= ~Flag`. `[Flags]` also makes `ToString()` print "Read, Write". Typical for permissions and options.

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

## [Scenario|Medium] You must count error lines in a 5 GB log file without running out of memory. How?

Stream it: `foreach (var line in File.ReadLines(path)) if (line.Contains("ERROR", StringComparison.Ordinal)) count++;` or a `StreamReader` with `ReadLineAsync` — memory stays constant because only one line is held at a time. Don't use `ReadAllText`/`ReadAllLines`. For more speed: a larger buffer (`new StreamReader(path, Encoding.UTF8, true, 1 << 16)`), `Span`-based searching, or splitting the file into ranges processed in parallel when the disk is fast.

## [Scenario|Medium] After deploying to the cloud, order times shown to users are 5.5 hours off. What went wrong?

The code used `DateTime.Now`, which is the server's local time — the cloud server runs in UTC while the developer's PC ran in IST (or the opposite conversion was applied twice). Fix: store and compare in UTC (`DateTime.UtcNow`/`DateTimeOffset`), mark `DateTimeKind.Utc` when reading from the database, convert to the user's time zone (`TimeZoneInfo.ConvertTimeFromUtc`) only for display, send ISO 8601 with offset (`"O"` format) in APIs, and inject `TimeProvider` so tests can control the time.

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

## Data types & conversion

| Need | Use |
|---|---|
| Money, quantities | `decimal` (`12.5m`) |
| Scientific / graphics | `double` |
| User input → number | `int.TryParse(s, out var n)` |
| Overflow check | `checked(a + b)` |
| Timestamps | UTC: `DateTime.UtcNow` / `DateTimeOffset` |
| Pure dates / times | `DateOnly` / `TimeOnly` |

## Arrays & collections in one look

`int[]` fixed · `int[,]` rectangular · `int[][]` jagged · `List<T>` growable · `Dictionary<K,V>` key lookup (`TryGetValue`) · `HashSet<T>` unique · `SortedList/SortedDictionary` ordered keys · `Stack<T>` LIFO · `Queue<T>` FIFO · `PriorityQueue<T,P>` · `ArrayList`/`Hashtable` = legacy (boxing, no type safety) · `(int, string)` ValueTuple for quick multi-returns.

## Delegates, exceptions & files

`Func` returns · `Action` void · `Predicate` bool · `+=` multicast · `out T` covariance, `in T` contravariance · `throw;` not `throw ex;` · custom exception = derive `Exception` + 3 constructors · `File.ReadLines` for big files · always `using`/`await using` streams · `Path.Combine` for paths.
