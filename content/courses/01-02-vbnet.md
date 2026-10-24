---
slug: vbnet
title: VB.NET — Visual Basic .NET from Basics to Advanced (with C# Comparison)
track: dotnet
order: 2
group: Languages & Internals
icon: VB
color: #945db7
summary: VB.NET syntax and program structure, data types and Option Strict/Explicit/Infer, operators and control flow, procedures (Sub vs Function, ByVal/ByRef, Optional, ParamArray), arrays and collections, classes and OOP keywords (Inherits, Implements, Overridable, MustInherit, Shadows), properties, modules and Shared members, events and delegates (WithEvents/Handles/AddHandler), error handling (Try/Catch and legacy On Error), LINQ and XML literals, async, WinForms and Web Forms code-behind, and converting VB.NET to C#.
---

# Overview

**Visual Basic .NET** is a .NET language that compiles to the **same IL** as C# and uses the same CLR, base class library, ASP.NET, ADO.NET and Entity Framework. Many enterprise and government systems (especially .NET Framework Web Forms and WinForms apps from 2002–2015) are written in VB.NET, so developers are often hired to **maintain** or **migrate** them.

| | VB.NET | C# |
|---|---|---|
| Syntax style | English-like keywords, line-oriented, `End If`/`End Sub` | C-style braces and semicolons |
| Case sensitivity | **Case-insensitive** | Case-sensitive |
| Type | `Dim x As Integer = 5` | `int x = 5;` |
| Same runtime/IL | ✅ | ✅ |
| New language features | Stable since 2020 (no new major features) | Evolving every year |
| Typical use today | Maintaining legacy apps, Office/VBA developers moving to .NET | Most new development |

Microsoft's position (2020): Visual Basic is supported on .NET 5+ for WinForms, WPF, console and class libraries, but **will not get new language features** and ASP.NET Core does not offer VB templates (Web Forms/MVC 5 on .NET Framework do).

# Versions

| Version | Year | Shipped with | Highlights |
|---|---|---|---|
| VB 1.0–6.0 (classic) | 1991–1998 | Visual Studio 6 | COM-based, not .NET — VB6 apps are still migrated today |
| VB.NET 7.0 | 2002 | .NET Framework 1.0 | Full OOP, structured exception handling, .NET |
| VB 8.0 (2005) | 2005 | .NET 2.0 | Generics `(Of T)`, `My` namespace, `Using`, operator overloading, partial classes, `IsNot` |
| VB 9.0 (2008) | 2007 | .NET 3.5 | LINQ, XML literals, `Option Infer`, lambdas, anonymous types, extension methods |
| VB 10 (2010) | 2010 | .NET 4.0 | Auto-implemented properties, multi-line lambdas, implicit line continuation, collection initializers |
| VB 11 (2012) | 2012 | .NET 4.5 | `Async`/`Await`, iterators (`Iterator`/`Yield`) |
| VB 14 (2015) | 2015 | Roslyn | `NameOf`, string interpolation `$"..."`, `?.` null-conditional, multiline strings, read-only auto-properties |
| VB 15–15.5 | 2017 | VS 2017 | Tuples, `ByRef` returns consumption, binary literals, digit separators |
| VB 16–16.9 | 2019–2020 | .NET Core 3 / .NET 5 | Comments after line continuation, init-only property consumption; final feature updates |

# Lifecycle

**How a VB.NET project runs:**

1. Write `.vb` files (Visual Studio with VB project templates).
2. The VB compiler (`vbc`, part of Roslyn) compiles them with project-level settings (`Option Strict`, `Option Explicit`, root namespace, imports) into IL in an assembly.
3. The CLR loads and JIT-compiles it exactly like C# output; VB-specific helpers live in `Microsoft.VisualBasic.dll` (e.g. `Left`, `Mid`, `CInt`, `My` namespace).
4. C# and VB projects in one solution reference each other freely — they share the CTS types.

# Tools

- Visual Studio (VB.NET project templates: Console, Class Library, WinForms, WPF; Web Forms/MVC on .NET Framework).
- Converters: Telerik Code Converter (online), ICSharpCode CodeConverter (VB ↔ C#, Visual Studio extension), SharpDevelop's converter (legacy).
- ILSpy can decompile an assembly to either language — useful to see the C# equivalent of VB code.
- .NET Upgrade Assistant for migrating .NET Framework VB projects to modern .NET.

# Module: VB.NET Basics

## Lesson: [Basic|High] Program structure, modules and the Main method

```vb
Option Strict On          ' no implicit narrowing conversions or late binding — always turn on
Option Explicit On        ' every variable must be declared
Option Infer On           ' allow Dim x = 5 (type inferred)

Imports System.Text       ' = C# using

Namespace Divakar.Shop
    Module Program                       ' a Module = C# static class; members are Shared automatically
        Sub Main(args As String())
            Console.WriteLine("Hello, Divakar!")
            Dim name As String = If(args.Length > 0, args(0), "world")
            Console.WriteLine($"Welcome {name}")       ' string interpolation (VB 14)
        End Sub
    End Module
End Namespace
```

- Statements end at the **line break** (no semicolons); use `_` for explicit line continuation, though VB 10+ allows implicit continuation after operators, commas and opening brackets.
- Comments start with `'` (or `REM`).
- Blocks end with `End X` (`End If`, `End Sub`, `End Class`).
- Keywords and identifiers are **case-insensitive** (`dim` = `Dim`; the IDE fixes casing).

| C# | VB.NET |
|---|---|
| `using System;` | `Imports System` |
| `static class Helpers` | `Module Helpers` |
| `static void Main(string[] args)` | `Sub Main(args As String())` |
| `// comment` | `' comment` |
| `Console.WriteLine("x");` | `Console.WriteLine("x")` |

## Lesson: [Basic|High] Data types, variables, constants and conversions

| VB.NET | C# | .NET type | Literal |
|---|---|---|---|
| `Integer` | `int` | `Int32` | `42`, `42I` |
| `Long` | `long` | `Int64` | `42L` |
| `Short` / `Byte` | `short` / `byte` | `Int16` / `Byte` | `42S` |
| `Double` / `Single` | `double` / `float` | `Double` / `Single` | `1.5R` / `1.5F` |
| `Decimal` | `decimal` | `Decimal` | `1.5D` |
| `Boolean` | `bool` | `Boolean` | `True` / `False` |
| `Char` | `char` | `Char` | `"A"c` |
| `String` | `string` | `String` | `"text"` |
| `Date` | `DateTime` | `DateTime` | `#10/24/2026#` (M/d/yyyy) |
| `Object` | `object` | `Object` | |

```vb
Dim count As Integer = 10
Dim price = 99.5D                 ' Decimal, inferred with Option Infer On
Const TaxRate As Decimal = 0.18D
Dim total As Decimal = price * (1 + TaxRate)
Dim nothingYet As String = Nothing     ' Nothing = C# null (or default for value types)
Dim maybe As Integer? = Nothing        ' Nullable(Of Integer)

' Conversions
Dim n1 As Integer = CInt("42")          ' VB conversion keyword (rounds to even for decimals: CInt(2.5) = 2)
Dim n2 As Integer = Integer.Parse("42")
Dim ok As Boolean = Integer.TryParse(input, n1)
Dim d As Double = CDbl(n1)
Dim s As String = n1.ToString()
Dim o As Object = "hello"
Dim str As String = DirectCast(o, String)   ' cast, throws if wrong type (C# (string)o)
Dim str2 As String = TryCast(o, String)     ' returns Nothing if wrong type (C# o as string)
Dim v = CType(o, String)                    ' general conversion
```

**Option Strict On** — the most important setting: it forbids implicit narrowing conversions (`Dim i As Integer = 3.7` fails) and late binding on `Object`. With it **Off**, VB silently converts types and resolves members at runtime — a source of hidden bugs. Turn it on for every project (Project Properties → Compile).

## Lesson: [Basic|High] Operators, conditions and loops

| Purpose | VB.NET | C# |
|---|---|---|
| Equality | `=` | `==` |
| Not equal | `<>` | `!=` |
| Logical and/or (short-circuit) | `AndAlso`, `OrElse` | `&&`, `\|\|` |
| Logical and/or (always both) | `And`, `Or` | `&`, `\|` |
| Not | `Not` | `!` |
| String concatenation | `&` (preferred) or `+` | `+` |
| Integer division / modulus | `\`, `Mod` | `/` (on ints), `%` |
| Power | `^` | `Math.Pow` |
| Reference equality | `Is`, `IsNot` | `==` on references / `is null` |
| Ternary | `If(cond, a, b)` | `cond ? a : b` |
| Null-coalescing | `If(x, fallback)` | `x ?? fallback` |

```vb
If marks >= 75 Then
    Console.WriteLine("Distinction")
ElseIf marks >= 35 Then
    Console.WriteLine("Pass")
Else
    Console.WriteLine("Fail")
End If

Select Case day                          ' = C# switch
    Case DayOfWeek.Saturday, DayOfWeek.Sunday
        Console.WriteLine("Weekend")
    Case Else
        Console.WriteLine("Weekday")
End Select

Select Case score
    Case Is >= 90 : grade = "A"
    Case 75 To 89 : grade = "B"
    Case Else : grade = "C"
End Select

For i As Integer = 1 To 10 Step 2       ' 1,3,5,7,9 (bounds inclusive!)
    If i = 7 Then Exit For               ' = break
    If i = 3 Then Continue For           ' = continue
    Console.Write(i)
Next

For Each name As String In names
    Console.WriteLine(name)
Next

Do While attempts < 3                    ' also: Do Until, Loop While, Loop Until, While...End While
    attempts += 1
Loop
```

Pitfall: `If user IsNot Nothing And user.IsActive Then` evaluates both sides and throws when `user` is Nothing — use **`AndAlso`**.

# Module: Procedures and Collections

## Lesson: [Basic|High] Sub vs Function, ByVal/ByRef, Optional and ParamArray

```vb
' Sub = method returning nothing (C# void)
Public Sub Log(message As String)
    Console.WriteLine($"{Date.Now:HH:mm} {message}")
End Sub

' Function = method returning a value
Public Function Add(a As Integer, b As Integer) As Integer
    Return a + b
End Function

' ByVal (default) copies the value/reference; ByRef passes the variable itself (C# ref)
Public Sub Swap(ByRef a As Integer, ByRef b As Integer)
    Dim t = a : a = b : b = t
End Sub

' Optional parameters and named arguments
Public Sub SendMail(toAddr As String, Optional subject As String = "Hi", Optional urgent As Boolean = False)
End Sub
SendMail("a@b.com", urgent:=True)

' ParamArray = C# params
Public Function Sum(ParamArray values As Integer()) As Integer
    Return values.Sum()
End Function

' Lambdas
Dim square = Function(x As Integer) x * x
Dim show = Sub(msg As String) Console.WriteLine(msg)
Dim isAdult As Func(Of Integer, Boolean) = Function(age) age >= 18
```

Overloading uses the same name with different parameters (`Overloads` keyword is optional except when overloading inherited members).

## Lesson: [Basic|High] Arrays, generics and collections

```vb
Dim marks(4) As Integer                  ' 5 elements! VB declares the UPPER BOUND (0..4), C# declares the length
Dim primes() As Integer = {2, 3, 5, 7}
Dim grid(1, 2) As Integer                ' 2 x 3 multidimensional
ReDim Preserve marks(9)                  ' resize keeping values (creates a new array)
Console.WriteLine(primes.Length)

Dim names As New List(Of String) From {"Asha", "Ravi"}     ' generics use (Of T)
names.Add("Meera")
Dim stock As New Dictionary(Of String, Integer) From {{"pen", 10}, {"book", 4}}
Dim qty As Integer
If stock.TryGetValue("pen", qty) Then Console.WriteLine(qty)

Dim adults = people.Where(Function(p) p.Age >= 18).OrderBy(Function(p) p.Name).ToList()

' Generic class and method with constraint
Public Class Repository(Of T As {Class, New})
    Private ReadOnly _items As New List(Of T)
    Public Function Create() As T
        Dim item As New T()
        _items.Add(item)
        Return item
    End Function
End Class
```

Indexing uses **parentheses** `arr(0)`, not square brackets — the same syntax as method calls.

# Module: Object-Oriented VB.NET

## Lesson: [Intermediate|High] Classes, properties, constructors and Shared members

```vb
Public Class Customer
    Private _name As String
    Private Shared _count As Integer               ' Shared = C# static

    Public Property Id As Integer                   ' auto-implemented property
    Public ReadOnly Property CreatedOn As Date = Date.UtcNow

    Public Property Name As String                  ' full property with validation
        Get
            Return _name
        End Get
        Set(value As String)
            If String.IsNullOrWhiteSpace(value) Then Throw New ArgumentException("Name required")
            _name = value.Trim()
        End Set
    End Property

    Public Sub New(name As String)                  ' constructor
        Me.Name = name                              ' Me = C# this
        _count += 1
    End Sub

    Public Shared ReadOnly Property Count As Integer
        Get
            Return _count
        End Get
    End Property

    Public Overrides Function ToString() As String
        Return $"{Id}: {Name}"
    End Function
End Class

Dim c As New Customer("Asha") With {.Id = 1}       ' object initializer uses With { .Prop = value }
```

| C# | VB.NET |
|---|---|
| `this` / `base` | `Me` / `MyBase` (and `MyClass`) |
| `static` | `Shared` |
| `readonly` field | `ReadOnly` |
| `const` | `Const` |
| `internal` | `Friend` |
| `protected internal` | `Protected Friend` |
| `new Customer { Id = 1 }` | `New Customer With {.Id = 1}` |
| `null` | `Nothing` |

## Lesson: [Intermediate|High] Inheritance, interfaces and polymorphism keywords

```vb
Public MustInherit Class Shape                      ' MustInherit = C# abstract class
    Public MustOverride Function Area() As Double   ' MustOverride = abstract method
    Public Overridable Function Describe() As String ' Overridable = virtual
        Return $"{Me.GetType().Name} with area {Area():0.00}"
    End Function
End Class

Public Class Circle
    Inherits Shape                                   ' : Shape
    Public Property Radius As Double
    Public Overrides Function Area() As Double       ' override
        Return Math.PI * Radius ^ 2
    End Function
End Class

Public NotInheritable Class Square                  ' NotInheritable = C# sealed
    Inherits Shape
    Implements IComparable(Of Square)                ' implement an interface
    Public Property Side As Double
    Public Overrides Function Area() As Double
        Return Side * Side
    End Function
    Public Function CompareTo(other As Square) As Integer Implements IComparable(Of Square).CompareTo
        Return Side.CompareTo(other.Side)            ' explicit "Implements" clause on every member
    End Function
End Class

Public Interface IRepository(Of T)
    Function GetById(id As Integer) As T
    Sub Save(item As T)
End Interface
```

| C# | VB.NET |
|---|---|
| `abstract class` / `abstract` member | `MustInherit` / `MustOverride` |
| `virtual` / `override` | `Overridable` / `Overrides` |
| `sealed` class / `sealed override` | `NotInheritable` / `NotOverridable Overrides` |
| `new` (hide member) | `Shadows` |
| `class A : B, IX` | `Inherits B` + `Implements IX` |
| interface member implementation (implicit) | `Implements IX.Member` clause required |

## Lesson: [Intermediate|High] Events and delegates — WithEvents, Handles, AddHandler, RaiseEvent

```vb
Public Class Thermostat
    Public Event TooHot As EventHandler(Of Double)          ' declare an event
    Public Sub Read(temp As Double)
        If temp > 40 Then RaiseEvent TooHot(Me, temp)        ' raise it (no null check needed)
    End Sub
End Class

' Style 1: WithEvents + Handles (static wiring — typical in WinForms/Web Forms code-behind)
Public Class Monitor
    Private WithEvents _sensor As New Thermostat()
    Private Sub OnTooHot(sender As Object, t As Double) Handles _sensor.TooHot
        Console.WriteLine($"Alert {t}")
    End Sub
End Class

' Style 2: AddHandler / RemoveHandler (dynamic wiring = C# += / -=)
Dim th As New Thermostat()
AddHandler th.TooHot, AddressOf OnTooHot                     ' AddressOf = method group
AddHandler th.TooHot, Sub(s, t) Console.WriteLine($"Lambda {t}")
RemoveHandler th.TooHot, AddressOf OnTooHot

' Custom delegate type
Public Delegate Function Calc(a As Integer, b As Integer) As Integer
Dim add As Calc = Function(a, b) a + b
```

In Web Forms VB code-behind you'll see `Protected Sub btnSave_Click(sender As Object, e As EventArgs) Handles btnSave.Click` — the `Handles` clause connects the button's server event.

# Module: Errors, LINQ and Modern Features

## Lesson: [Intermediate|High] Error handling — Try/Catch/Finally and legacy On Error

```vb
Try
    Dim text = IO.File.ReadAllText(path)
    Dim n = Integer.Parse(text)
Catch ex As IO.FileNotFoundException
    Log($"Missing file {path}")
Catch ex As FormatException When path.EndsWith(".cfg")   ' exception filter
    Log("Bad config value")
Catch ex As Exception
    Log(ex.ToString())
    Throw                                                ' rethrow, keeps stack trace (never "Throw ex")
Finally
    CleanUp()
End Try

Using conn As New SqlConnection(cs)                      ' = C# using; Dispose at End Using
    conn.Open()
End Using

Public Class InsufficientFundsException
    Inherits Exception
    Public Sub New(message As String)
        MyBase.New(message)
    End Sub
End Class
```

**Legacy unstructured error handling** (from VB6, still compiles in VB.NET — you'll find it in old code):

```vb
Sub OldStyle()
    On Error GoTo ErrHandler          ' jump to label on any error
    Dim x As Integer = CInt("abc")
    Exit Sub
ErrHandler:
    Console.WriteLine("Error " & Err.Number & ": " & Err.Description)
    Resume Next                       ' continue with the next statement (dangerous — hides errors)
End Sub
```

Refactor `On Error` to `Try/Catch` when maintaining such code; `On Error Resume Next` silently ignores failures.

## Lesson: [Intermediate|Medium] LINQ, XML literals, async and iterators

```vb
' LINQ query syntax
Dim expensive = From p In products
                Where p.Price > 1000
                Order By p.Price Descending
                Select p.Name, p.Price

' Aggregate and Group By
Dim byCategory = From p In products
                 Group By p.Category Into Total = Sum(p.Price), Count()

' XML literals — unique to VB: XML directly in code, with embedded expressions
Dim doc = <orders>
              <%= From o In orders Select <order id=<%= o.Id %> total=<%= o.Total %>/> %>
          </orders>
Dim ids = From x In doc...<order> Select CInt(x.@id)    ' ... = descendants, .@ = attribute

' Async / Await
Public Async Function GetPageAsync(url As String) As Task(Of String)
    Using client As New HttpClient()
        Return Await client.GetStringAsync(url)
    End Using
End Function

' Iterator functions = C# yield return
Public Iterator Function Evens(max As Integer) As IEnumerable(Of Integer)
    For i = 0 To max Step 2
        Yield i
    Next
End Function
```

## Lesson: [Advanced|Medium] The My namespace, Microsoft.VisualBasic helpers and late binding

```vb
Dim userName = My.User.Name                       ' current Windows user
Dim content = My.Computer.FileSystem.ReadAllText("a.txt")
My.Settings.LastOpened = Date.Now : My.Settings.Save()    ' WinForms settings
Dim conn = My.Settings.ShopConnectionString

' Classic VB functions from Microsoft.VisualBasic
Dim first3 = Left("Divakar", 3)                  ' "Div"  (= "Divakar".Substring(0, 3))
Dim mid = Mid("Divakar", 2, 3)                   ' "iva"  (1-based!)
Dim len = Len("Divakar")
If IsNumeric(input) Then ...
Dim answer = MsgBox("Save changes?", MsgBoxStyle.YesNo)   ' WinForms only
```

**Late binding** (`Option Strict Off`): calling members on an `Object` resolved at runtime — used historically for COM/Office automation (`CreateObject("Excel.Application")`). With `Option Strict On` use proper types or `dynamic`-like patterns via interop assemblies.

**1-based vs 0-based:** classic functions (`Mid`, `InStr`) are 1-based; .NET methods (`Substring`, `IndexOf`) are 0-based — a common bug source when mixing them.

## Lesson: [Advanced|High] Converting VB.NET to C# and migration strategy

| VB.NET | C# |
|---|---|
| `Dim x As New List(Of Integer)` | `var x = new List<int>();` |
| `If x Is Nothing Then` | `if (x is null)` |
| `For i = 0 To n - 1` | `for (int i = 0; i < n; i++)` |
| `arr(0)` | `arr[0]` |
| `Dim a(9) As Integer` (10 items) | `var a = new int[10];` |
| `x \ y`, `x Mod y` | `x / y` (ints), `x % y` |
| `"a" & "b"` | `"a" + "b"` |
| `AndAlso` / `OrElse` | `&&` / `\|\|` |
| `DirectCast(o, T)` / `TryCast(o, T)` | `(T)o` / `o as T` |
| `AddHandler e, AddressOf M` | `e += M;` |
| `Handles btn.Click` | wire `btn.Click += ...` (or markup) |
| `Shared` / `Module` | `static` / `static class` |
| `MustInherit` / `Overridable` | `abstract` / `virtual` |
| `On Error Resume Next` | no equivalent — rewrite with try/catch |
| `My.Settings` | `IOptions<T>` / `appsettings.json` |

**Migration strategy for a legacy VB.NET app:**

1. Turn on `Option Strict` and fix warnings (finds hidden bugs first).
2. Add tests around critical behaviour.
3. Mixed-language solution: new code in C# class libraries referenced by the VB project (both compile to IL).
4. Convert class libraries one by one with a converter, review by hand (Mid/InStr 1-based, integer division, `Nothing` semantics for value types, `On Error`).
5. UI: Web Forms → ASP.NET Core MVC/Razor Pages or Blazor (rewrite page by page behind a reverse proxy — strangler pattern); WinForms VB can move to .NET 8/10 WinForms directly.
6. Use .NET Upgrade Assistant for project files and package updates.

# Interview

## [Beginner|High] What is the difference between VB.NET and C#?

Both compile to the same IL and run on the same CLR with the same libraries, so performance is the same. Differences are syntax and features: VB.NET uses English-like keywords, is case-insensitive, line-based with `End` blocks, has XML literals, `My` namespace, `WithEvents/Handles` and optional late binding; C# uses C-style syntax, is case-sensitive and gets new language features every year while VB.NET has been feature-stable since 2020. Most new projects use C#; VB.NET is mainly maintained in legacy systems.

## [Beginner|High] What do Option Strict, Option Explicit and Option Infer do?

Option Explicit On requires variables to be declared. Option Strict On disallows implicit narrowing conversions and late binding — catching type errors at compile time (strongly recommended). Option Infer On lets `Dim x = 5` infer the type from the initializer. Set them per project (Compile settings) or per file at the top.

## [Beginner|High] What is the difference between Sub and Function?

A `Sub` performs an action and returns no value (C# `void` method). A `Function` returns a value with `Return` (or by assigning to the function name in old code). Both can take ByVal/ByRef, Optional and ParamArray parameters.

## [Beginner|High] ByVal vs ByRef?

ByVal (the default) passes a copy of the value — for reference types, a copy of the reference, so the method can modify the object but not replace the caller's variable. ByRef passes the variable itself, so assigning a new value inside the method changes the caller's variable (C# `ref`).

## [Beginner|Medium] What are the VB.NET equivalents of static, this, null and abstract?

`static` → `Shared` (and a `Module` is like a static class), `this` → `Me`, `base` → `MyBase`, `null` → `Nothing`, `abstract class` → `MustInherit`, `abstract method` → `MustOverride`, `virtual` → `Overridable`, `override` → `Overrides`, `sealed` → `NotInheritable`, `internal` → `Friend`.

## [Beginner|Medium] Why does `Dim arr(5) As Integer` create 6 elements?

VB.NET array declarations specify the **upper bound**, not the length, and arrays are zero-based — so `arr(5)` has indexes 0 to 5 = 6 elements. In C#, `new int[5]` specifies the length (indexes 0–4). A classic off-by-one source when converting code.

## [Intermediate|High] And vs AndAlso, Or vs OrElse?

`And`/`Or` always evaluate both operands (and also act as bitwise operators on integers). `AndAlso`/`OrElse` short-circuit: the second operand is evaluated only if needed. Use `AndAlso` for conditions like `If obj IsNot Nothing AndAlso obj.IsActive Then` to avoid NullReferenceException.

## [Intermediate|High] How are events handled in VB.NET?

Declare with `Event`, raise with `RaiseEvent`. Subscribe statically by declaring the field `WithEvents` and adding a `Handles obj.EventName` clause to the handler (common in WinForms/Web Forms code-behind), or dynamically with `AddHandler obj.Event, AddressOf Handler` and `RemoveHandler` (like C# `+=`/`-=`).

## [Intermediate|High] DirectCast vs CType vs TryCast?

`DirectCast` performs a type cast requiring an inheritance/interface relationship and throws `InvalidCastException` on failure (fast, like C# `(T)x`). `CType` performs any defined conversion including VB conversions (string to integer) and user-defined conversions. `TryCast` returns `Nothing` instead of throwing (reference types only, like C# `as`).

## [Intermediate|Medium] What is the difference between On Error GoTo and Try/Catch?

`On Error GoTo label` / `Resume Next` is legacy unstructured error handling from VB6: errors jump to a label or are silently skipped, making flow hard to follow and hiding failures. `Try/Catch/Finally` is structured exception handling with typed exceptions, filters (`When`), `Finally` cleanup and proper rethrowing. Use Try/Catch; refactor On Error when touching old code.

## [Intermediate|Medium] What is a Module in VB.NET?

A container whose members are implicitly `Shared` and which can't be instantiated or inherited — compiled as a sealed class with static members (C# static class). Module members can be called without qualifying the module name, which is convenient for helper functions and `Sub Main`.

## [Intermediate|Medium] What are XML literals?

A VB-only feature that lets you write XML directly in code as `XElement`/`XDocument` objects, embed expressions with `<%= %>`, and query with axis properties (`.<child>`, `...<descendant>`, `.@attribute`). Handy for generating and reading XML configuration or reports with LINQ to XML.

## [Advanced|Medium] Can a C# project and a VB.NET project be in the same solution?

Yes. Each project compiles to IL in its own assembly, and projects reference each other normally (same CTS types). A single project can't mix languages. This makes gradual migration possible: put new code in C# libraries consumed by the VB application. Keep public APIs CLS-compliant (avoid names differing only by case, which VB can't distinguish).

## [Advanced|Medium] Does VB.NET run on .NET 8/10?

Yes for console, class libraries, WinForms and WPF (and Worker Services); the compiler is part of Roslyn. VB.NET won't get new language features, ASP.NET Core has no VB templates (you can still reference VB libraries from ASP.NET Core C# projects), and Web Forms stays on .NET Framework.

## [Scenario|High] You must maintain a large VB.NET Web Forms app and gradually move it to modern .NET. What is your plan?

Stabilise first: source control, Option Strict On, logging, tests on critical flows. Extract business logic from code-behind into class libraries (VB or new C#), target `netstandard2.0` where possible so both old and new apps can use them. Put a reverse proxy (YARP/IIS ARR) in front and rebuild pages/features in ASP.NET Core (C#) one area at a time, sharing authentication and the database (strangler fig). Retire Web Forms pages as their replacements go live.

## [Scenario|Medium] After converting a VB function to C#, string results are off by one character. Why?

VB's classic string functions (`Mid`, `InStr`, `Left`) are **1-based**, while .NET methods (`Substring`, `IndexOf`) are 0-based, and `InStr` returns 0 for "not found" while `IndexOf` returns −1. Converters sometimes translate them literally. Fix the indexes, add unit tests comparing old and new outputs for typical inputs.

# Cheatsheet

## Keyword map VB → C#

`Dim x As T` → `T x` · `Sub/Function` → void/method · `Me/MyBase` → this/base · `Shared/Module` → static · `Nothing` → null · `Inherits/Implements` → `:` · `MustInherit/MustOverride` → abstract · `Overridable/Overrides` → virtual/override · `NotInheritable` → sealed · `Friend` → internal · `Shadows` → new.

## Operators

`=` equality · `<>` not equal · `&` concat · `\` int division · `Mod` · `^` power · `AndAlso/OrElse` short-circuit · `Is/IsNot` reference · `If(c,a,b)` ternary · `If(x,y)` null-coalesce.

## Must-know settings

Option Strict On · Option Explicit On · Option Infer On · arrays declare upper bound · `(Of T)` generics · `arr(i)` indexing.

## Events

`Event` + `RaiseEvent` · `WithEvents` + `Handles` · `AddHandler/RemoveHandler` + `AddressOf`.

## Migration

Option Strict first → tests → extract logic to libraries → convert libraries → rebuild UI in ASP.NET Core (strangler) → watch 1-based string functions and integer division.
