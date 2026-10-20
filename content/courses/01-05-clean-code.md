---
slug: clean-code
title: Clean Code, Testing & Best Practices
track: foundations
order: 5
icon: CC
color: #2b8a3e
summary: Naming, functions, error handling, code smells and refactoring, unit testing with xUnit and Moq, TDD, code review, Git workflow, security and logging best practices for .NET teams.
---

# Overview

**Clean code** is code that other people can read, change and trust. Interviews for mid and senior roles check whether you write maintainable code, test it, review others' code and follow team practices (Git flow, CI, logging, security).

Core ideas, from Robert C. Martin's *Clean Code* (2008), Martin Fowler's *Refactoring* (1999, 2nd ed. 2018) and Kent Beck's *Test-Driven Development* (2002):

- Code is read far more often than it is written — optimise for the reader.
- Small, focused functions and classes with intention-revealing names.
- Tests are part of the code, not an afterthought.
- Leave the code cleaner than you found it (the "Boy Scout rule").

# Versions

| Year | Milestone |
|---|---|
| 1999 | Fowler, *Refactoring* (code smells catalogue); Beck, *Extreme Programming Explained* |
| 2002 | Beck, *Test-Driven Development: By Example* |
| 2004 | Feathers, *Working Effectively with Legacy Code* |
| 2007 | xUnit.net 1.0 released (by NUnit's original author) |
| 2008 | Martin, *Clean Code* |
| 2011 | Martin, *The Clean Coder* |
| 2018 | *Refactoring* 2nd edition |
| 2024 | xUnit v3 released; MSTest 3.x, NUnit 4 are current |

.NET analyzers: Roslyn analyzers ship in the SDK (`<AnalysisLevel>latest</AnalysisLevel>`), plus `.editorconfig` rules enforced at build.

# Lifecycle

**Code lifecycle in a team (typical Git + PR flow):**

1. Pick a ticket (Azure Boards/Jira) → create a branch `feature/1234-order-export`.
2. Write a failing test (TDD) or write the code, then the tests.
3. Run the analyzers, formatter (`dotnet format`) and tests locally.
4. Commit small, meaningful commits; push; open a **pull request**.
5. CI pipeline: build → unit tests → code coverage → static analysis (SonarQube) → security scan.
6. **Code review** by 1–2 peers; address comments.
7. Merge (squash) to `main`; CD deploys to dev → QA → staging → production.
8. Monitor logs and metrics; fix bugs with a regression test first.

**Test lifecycle (xUnit):** for each test, a new instance of the test class is created (constructor = setup), the test runs, then `Dispose()` = teardown. Shared expensive setup uses `IClassFixture<T>` (per class) or collection fixtures (across classes).

# Tools

| Area | Tools |
|---|---|
| Unit testing | xUnit, NUnit, MSTest |
| Mocking | Moq, NSubstitute, FakeItEasy |
| Assertions | Shouldly, FluentAssertions (v8+ needs a commercial licence) |
| Integration tests | `WebApplicationFactory` (Microsoft.AspNetCore.Mvc.Testing), Testcontainers, Respawn |
| Coverage | Coverlet, ReportGenerator, Visual Studio Enterprise |
| Static analysis | Roslyn analyzers, SonarQube/SonarCloud, ReSharper, StyleCop.Analyzers |
| Formatting | `dotnet format`, `.editorconfig`, CSharpier |
| Mutation testing | Stryker.NET |
| Architecture tests | NetArchTest, ArchUnitNET |
| Security | Dependabot, `dotnet list package --vulnerable`, GitHub Advanced Security, OWASP ZAP |

# Module: Readable Code

## Lesson: [Basic|High] Naming

- Names reveal intent: `daysSinceLastLogin`, not `d` or `data2`.
- Classes = nouns (`InvoiceCalculator`); methods = verbs (`CalculateTotal`, `SendReminder`).
- Booleans read as questions: `isActive`, `hasAccess`, `canRetry`.
- Avoid noise words: `Manager`, `Processor`, `Data`, `Info` (unless they really mean something).
- .NET conventions: `PascalCase` for types, methods, properties, constants; `camelCase` for locals and parameters; `_camelCase` for private fields; `I` prefix for interfaces; `Async` suffix for async methods.

```csharp
// ❌
public List<int> Get(List<int> l) { var r = new List<int>(); foreach (var x in l) if (x % 2 == 0) r.Add(x); return r; }
// ✅
public IReadOnlyList<int> GetEvenNumbers(IEnumerable<int> numbers) => numbers.Where(n => n % 2 == 0).ToList();
```

## Lesson: [Basic|High] Functions, parameters and guard clauses

- Small; do **one thing**; one level of abstraction.
- Few parameters (≤ 3); group many into a parameter object/record.
- No hidden side effects; avoid boolean "flag" parameters that switch behaviour.
- Return early with **guard clauses** instead of deep nesting.

```csharp
// ❌ Arrow code
public decimal Ship(Order o)
{
    if (o != null) { if (o.IsPaid) { if (o.Lines.Count > 0) { return Calculate(o); } else throw ...; } else throw ...; }
    else throw ...;
}
// ✅ Guard clauses
public decimal Ship(Order? o)
{
    ArgumentNullException.ThrowIfNull(o);
    if (!o.IsPaid) throw new InvalidOperationException("Order not paid");
    if (o.Lines.Count == 0) throw new InvalidOperationException("Order is empty");
    return Calculate(o);
}
```

## Lesson: [Basic|Medium] Comments, formatting and magic numbers

- Good code explains **what**; comments explain **why** (business reason, workaround, link to ticket).
- Delete commented-out code — Git remembers it.
- Replace magic numbers/strings with named constants or enums: `if (age >= LegalDrivingAge)`.
- XML doc comments (`///`) for public APIs.
- Enforce formatting with `.editorconfig` + `dotnet format` in CI so reviews don't argue about spaces.

## Lesson: [Intermediate|High] Error handling and logging best practices

- Throw exceptions for **exceptional** situations; use `TryX` or a Result type for expected failures (validation, not found).
- Catch only what you can handle; let the rest bubble to a **global exception handler** (ASP.NET Core `UseExceptionHandler` + `IExceptionHandler` / ProblemDetails).
- Never swallow exceptions (`catch { }`).
- **Structured logging** with message templates, not string interpolation:

```csharp
// ❌ logger.LogInformation($"Order {orderId} placed by {userId}");   // allocates always; loses structure
// ✅
logger.LogInformation("Order {OrderId} placed by {UserId}", orderId, userId);

// High-performance, source-generated:
public static partial class Log
{
    [LoggerMessage(Level = LogLevel.Warning, Message = "Payment {PaymentId} failed: {Reason}")]
    public static partial void PaymentFailed(ILogger logger, string paymentId, string reason);
}
```

- Never log secrets, passwords, tokens or full card numbers; mask PII.
- Use correlation IDs / OpenTelemetry trace IDs to follow a request across services.

# Module: Code Smells and Refactoring

## Lesson: [Intermediate|High] Common code smells

| Smell | Symptom | Refactoring |
|---|---|---|
| Long method | > ~30 lines, many comments explaining blocks | Extract Method |
| Large class / God class | Many responsibilities, 1000+ lines | Extract Class (SRP) |
| Long parameter list | 5+ params | Introduce Parameter Object |
| Duplicated code | Same logic in many places | Extract Method/Class, DRY |
| Switch on type | `switch (type)` repeated | Replace Conditional with Polymorphism (Strategy) |
| Feature envy | Method uses another class's data more than its own | Move Method |
| Primitive obsession | `string email`, `decimal amount` + `string currency` everywhere | Value objects (`Email`, `Money`) |
| Shotgun surgery | One change edits many files | Move related code together |
| Dead code | Unused methods/params | Delete |
| Magic numbers | `if (status == 3)` | Enum/constant |

## Lesson: [Intermediate|Medium] Safe refactoring and legacy code

1. **Cover with tests first** — characterisation tests that pin current behaviour (even if odd).
2. Make **small steps**, run tests after each.
3. Use IDE refactorings (Rename, Extract Method, Introduce Variable) — they're safe.
4. Separate refactoring commits from behaviour changes.
5. For untestable legacy code: find **seams** (Feathers) — extract an interface around a static/DB call, inject it, then test.
6. **Strangler Fig** for big rewrites: route new features to new code, migrate piece by piece.

# Module: Testing

## Lesson: [Basic|High] Unit testing with xUnit (AAA pattern)

```csharp
public class DiscountCalculatorTests
{
    private readonly DiscountCalculator _sut = new();          // system under test

    [Fact]
    public void Gold_customer_gets_10_percent()
    {
        // Arrange
        var order = new Order(total: 1000m, tier: Tier.Gold);
        // Act
        var discount = _sut.Calculate(order);
        // Assert
        Assert.Equal(100m, discount);
    }

    [Theory]
    [InlineData(Tier.Regular, 1000, 0)]
    [InlineData(Tier.Gold, 1000, 100)]
    [InlineData(Tier.Platinum, 1000, 150)]
    public void Discount_by_tier(Tier tier, decimal total, decimal expected) =>
        Assert.Equal(expected, _sut.Calculate(new Order(total, tier)));

    [Fact]
    public void Negative_total_throws() =>
        Assert.Throws<ArgumentOutOfRangeException>(() => _sut.Calculate(new Order(-1, Tier.Gold)));
}
```

Good unit tests are **FIRST**: Fast, Isolated, Repeatable, Self-validating, Timely. Name them by behaviour: `Method_State_ExpectedResult` or a readable sentence.

## Lesson: [Intermediate|High] Mocking with Moq / NSubstitute

```csharp
[Fact]
public async Task PlaceOrder_saves_and_sends_confirmation()
{
    var repo = new Mock<IOrderRepository>();
    var email = new Mock<IEmailSender>();
    var sut = new OrderService(repo.Object, email.Object);

    await sut.PlaceAsync(new Order(1, 500m));

    repo.Verify(r => r.AddAsync(It.Is<Order>(o => o.Id == 1)), Times.Once);
    email.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
}

// NSubstitute equivalent
var repo2 = Substitute.For<IOrderRepository>();
await repo2.Received(1).AddAsync(Arg.Is<Order>(o => o.Id == 1));
```

Test doubles: **Dummy** (unused), **Stub** (returns canned data), **Fake** (working lightweight version, e.g. in-memory repo), **Mock** (verifies interactions), **Spy** (records calls). Don't mock what you don't own (e.g. `HttpClient`) — wrap it or use a fake `HttpMessageHandler`.

## Lesson: [Intermediate|High] Test pyramid, integration tests and TDD

**Test pyramid:** many fast **unit** tests → fewer **integration** tests (API + real DB) → few **end-to-end/UI** tests (Playwright/Selenium).

```csharp
// Integration test with WebApplicationFactory
public class OrdersApiTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Get_unknown_order_returns_404()
    {
        var client = factory.CreateClient();
        var res = await client.GetAsync("/api/orders/999999");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }
}
```

**TDD cycle — Red, Green, Refactor:** write a failing test → write the minimum code to pass → clean up. Benefits: testable design, a safety net, living documentation.

**Code coverage:** a useful signal, not a goal. 80% coverage of meaningful branches beats 100% of trivial getters. Mutation testing (Stryker) checks whether tests actually catch bugs.

# Module: Team Practices

## Lesson: [Basic|High] Git workflow and pull requests

```bash
git switch -c feature/1234-export-csv
git add -p                       # stage hunks deliberately
git commit -m "Add CSV exporter for monthly report (#1234)"
git fetch origin && git rebase origin/main
git push -u origin feature/1234-export-csv
# open PR → CI runs → review → squash merge
```

- Branching models: **trunk-based** (short-lived branches, feature flags — common with CI/CD) vs **GitFlow** (develop/release/hotfix branches — heavier).
- `merge` keeps history with a merge commit; `rebase` rewrites your commits on top of the target for a linear history (never rebase shared branches).
- Good PRs: small (< ~400 lines), one purpose, description with why + how to test, screenshots for UI.
- Resolve conflicts locally, re-run tests.

## Lesson: [Intermediate|High] Code review checklist

1. **Correctness** — does it do what the ticket says? Edge cases (null, empty, large, concurrent)?
2. **Tests** — new behaviour covered? Bug fix has a regression test?
3. **Design** — SOLID, no duplication, right layer, no unnecessary abstraction.
4. **Readability** — names, function size, comments explain why.
5. **Performance** — N+1 queries, loading whole tables, blocking async, missing indexes.
6. **Security** — input validation, parameterised SQL, authorisation checks, no secrets in code, safe logging.
7. **Operability** — logging, metrics, config, migrations, backward compatibility.

Tone: comment on the code, not the person; ask questions ("What happens if X is null?"); mark nits as optional; approve when good enough.

## Lesson: [Intermediate|High] Secure coding basics (OWASP Top 10 for .NET devs)

| Risk | .NET practice |
|---|---|
| Injection (SQL, command) | Parameterised queries / EF Core / Dapper parameters; never concatenate input |
| Broken access control | `[Authorize]` + policies; check ownership (`order.UserId == currentUser`) — prevent IDOR |
| Cryptographic failures | HTTPS everywhere, HSTS; hash passwords with ASP.NET Core Identity (PBKDF2); never roll your own crypto |
| Security misconfiguration | No detailed errors in production; remove default accounts; least privilege |
| Vulnerable components | Keep NuGet packages updated; Dependabot; `dotnet list package --vulnerable` |
| XSS | Razor encodes by default; avoid `Html.Raw` with user input; CSP header |
| CSRF | Antiforgery tokens for cookie-auth forms (`[ValidateAntiForgeryToken]`) |
| Secrets | User Secrets locally; Azure Key Vault / env vars in prod; never commit `appsettings.Production.json` secrets |
| Logging failures | Log security events; never log secrets |
| SSRF | Validate/allow-list outbound URLs |

# Interview

## [Beginner|High] What is clean code? What practices do you follow?

Code that is easy to read, change and test. My practices: meaningful names, small single-purpose methods, guard clauses instead of deep nesting, no magic numbers, consistent formatting enforced by `.editorconfig`/`dotnet format`, comments for *why*, unit tests for business logic, small PRs and code review, and the Boy Scout rule — leave code slightly better each time.

## [Beginner|High] What is unit testing? What makes a good unit test?

A unit test verifies a small piece of logic (a method/class) in isolation from external dependencies (DB, network, time), which are replaced with test doubles. Good tests are FIRST (Fast, Isolated, Repeatable, Self-validating, Timely), follow Arrange-Act-Assert, test **behaviour** not implementation details, have one logical assertion focus, and have descriptive names.

## [Beginner|High] What is the difference between `[Fact]` and `[Theory]` in xUnit?

`[Fact]` is a test with no parameters that always runs once. `[Theory]` is a parameterised test that runs once per data set, supplied by `[InlineData]`, `[MemberData]` or `[ClassData]`. Use theories to test the same rule with many inputs (boundary values).

## [Beginner|Medium] What are xUnit, NUnit and MSTest? Differences?

All three are .NET test frameworks. **xUnit** (most common in new .NET Core projects): new class instance per test, constructor/`IDisposable` for setup/teardown, `[Fact]/[Theory]`, fixtures for shared state. **NUnit**: `[Test]`, `[TestCase]`, `[SetUp]/[TearDown]`, rich constraint assertions. **MSTest**: Microsoft's, `[TestMethod]`, `[DataRow]`, `[TestInitialize]`, well integrated into Visual Studio. Functionally similar; teams pick by convention.

## [Intermediate|High] What is mocking? Mock vs stub vs fake?

Mocking replaces a real dependency with a controllable test double. A **stub** returns predefined data (state-based testing). A **mock** also verifies that expected interactions happened (`Verify(..., Times.Once)`). A **fake** is a working lightweight implementation (in-memory repository, fake clock). Use stubs/fakes by default; verify interactions only when the interaction *is* the behaviour (e.g. "an email was sent").

## [Intermediate|High] How do you unit-test code that uses `DateTime.Now`, `HttpClient` or a database?

- Time: inject `TimeProvider` (.NET 8 built-in abstraction; `FakeTimeProvider` in tests) or your own `IClock`.
- HttpClient: inject a typed client and in tests provide a fake `HttpMessageHandler` returning canned responses — or wrap the external API behind an interface and mock that.
- Database: hide it behind a repository interface for unit tests; for the data layer itself, write **integration tests** against a real engine (SQL Server in Testcontainers, or SQLite) rather than EF's InMemory provider, which doesn't behave like a relational DB.

## [Intermediate|High] What is TDD? Have you used it?

Test-Driven Development: Red (write a failing test for the next small behaviour), Green (write the minimum code to pass), Refactor (clean up with tests protecting you). It produces testable, decoupled designs and high meaningful coverage. Honest answer: "I use TDD for business rules and bug fixes — I first write a test that reproduces the bug — and test-after for thin glue code."

## [Intermediate|High] What is the test pyramid?

Many fast, cheap **unit tests** at the base; fewer **integration/API tests** (real DB, real HTTP pipeline via `WebApplicationFactory`) in the middle; very few slow, brittle **end-to-end UI tests** (Playwright) at the top. An inverted pyramid ("ice-cream cone") with mostly manual/UI tests is slow and flaky.

## [Intermediate|High] What do you check in a code review?

Correctness and edge cases, tests, design (SOLID, right layer), readability, performance (N+1 queries, sync-over-async, unbounded loads), security (injection, authorisation, secrets, logging PII), and operability (logging, config, migrations, backward compatibility). I keep comments respectful and specific, separate blocking issues from nits, and prefer small PRs.

## [Intermediate|Medium] What are code smells? Name five and their fixes.

Symptoms that suggest a deeper design problem: **Long Method** → Extract Method; **God Class** → Extract Class (SRP); **Duplicate Code** → extract shared method; **Switch on type** → polymorphism/Strategy; **Primitive Obsession** → value objects; **Long Parameter List** → parameter object; **Feature Envy** → Move Method.

## [Intermediate|Medium] Merge vs rebase? What is a squash merge?

`merge` combines branches and keeps both histories with a merge commit (non-destructive). `rebase` replays your commits on top of another branch, which rewrites them for a linear history — never on shared/public branches. **Squash merge** combines all PR commits into one commit on `main`, keeping history clean (one commit per feature).

## [Intermediate|Medium] Trunk-based development vs GitFlow?

**Trunk-based**: everyone integrates into `main` at least daily via short-lived branches; incomplete features hidden behind feature flags; enables CI/CD. **GitFlow**: long-lived `develop`, `release/*`, `hotfix/*` branches; fits scheduled releases and multiple supported versions but causes merge pain. Most modern teams use trunk-based or GitHub Flow.

## [Advanced|Medium] What is mutation testing?

A tool (Stryker.NET) makes small changes ("mutants") to your code — flipping `>` to `>=`, removing a call — and reruns the tests. If tests still pass, the mutant "survived", meaning your tests don't really check that behaviour. It measures test *quality*, unlike line coverage.

## [Advanced|Medium] How do you prevent SQL injection and IDOR in a .NET API?

SQL injection: never concatenate user input into SQL; use EF Core LINQ, `FromSql($"...")` (interpolation is parameterised), Dapper parameters or `SqlParameter`. IDOR (Insecure Direct Object Reference): don't trust IDs from the URL — always check the resource belongs to the current user or tenant (`WHERE Id = @id AND UserId = @currentUser`), using resource-based authorisation or global query filters for multi-tenant data.

## [Scenario|High] You join a team with a 10-year-old codebase, no tests and frequent production bugs. What's your plan?

1. Understand: talk to the team, read bug history, find the riskiest, most-changed areas (Git churn).
2. Add a CI pipeline with build + analyzers if missing.
3. Write characterisation/integration tests around the critical flows before touching them.
4. Fix bugs test-first (a regression test per bug).
5. Refactor incrementally in touched areas (Boy Scout rule), not a big-bang rewrite.
6. Add logging/monitoring to see failures early.
7. Agree on coding standards and PR reviews.
8. Measure: bug count, deployment frequency, time to fix.

## [Scenario|High] A reviewer rejects your PR saying the method is too long and untestable. How do you respond and fix it?

Accept feedback professionally — ask for specifics if unclear. Then extract cohesive parts into well-named private methods or separate classes, move external calls (DB, HTTP, time) behind injected interfaces so the logic is testable, add unit tests for the extracted logic, and keep the PR focused. Reply to each comment with what you changed.

## [Scenario|Medium] A test passes locally but fails randomly in CI. What could cause it?

Flaky test causes: dependence on time/date or time zone, test order or shared static state, parallel tests sharing a DB/file, race conditions with async code (missing `await`), relying on dictionary/hash ordering, network calls to real services, culture-specific formatting. Fix by isolating state (fresh DB per test or transactions/Respawn), injecting `TimeProvider`, awaiting properly, fixing culture, and removing external calls.

## [Scenario|Medium] Production logs show `Object reference not set to an instance of an object` with no context. How do you make this debuggable next time?

Enable nullable reference types and fix warnings; validate inputs with guard clauses (`ArgumentNullException.ThrowIfNull`); use structured logging with context (OrderId, UserId, CorrelationId); a global exception handler that logs the full exception with request path and trace ID; OpenTelemetry/Application Insights for distributed traces; publish symbols (portable PDBs) so stack traces have line numbers.

# Cheatsheet

## Clean code rules

- Intention-revealing names; verbs for methods, nouns for classes.
- Functions: small, one thing, ≤ 3 params, guard clauses.
- No magic numbers; no commented-out code; comments explain *why*.
- Exceptions for exceptional cases; global handler; structured logs.
- Boy Scout rule; small PRs; consistent formatting.

## Naming conventions (.NET)

| Element | Style | Example |
|---|---|---|
| Class, method, property | PascalCase | `OrderService.PlaceOrder` |
| Interface | `I` + PascalCase | `IOrderRepository` |
| Local, parameter | camelCase | `orderTotal` |
| Private field | `_camelCase` | `_repository` |
| Async method | `Async` suffix | `GetOrderAsync` |
| Constant | PascalCase | `MaxRetryCount` |

## Testing

- AAA: Arrange · Act · Assert. FIRST tests.
- xUnit: `[Fact]`, `[Theory]` + `[InlineData]`; ctor = setup, `Dispose` = teardown; `IClassFixture<T>`.
- Moq: `new Mock<T>()`, `.Setup(...).ReturnsAsync(...)`, `.Verify(..., Times.Once)`.
- Doubles: dummy, stub, fake, mock, spy.
- Pyramid: unit ≫ integration ≫ E2E.
- `WebApplicationFactory<Program>` for API tests; Testcontainers for real SQL Server.
- `TimeProvider` / `FakeTimeProvider` for time.

## Code smells → refactorings

Long method → Extract Method · God class → Extract Class · Switch on type → Polymorphism · Duplicates → Extract/DRY · Long params → Parameter Object · Primitive obsession → Value Object · Feature envy → Move Method.

## Git

```bash
git switch -c feature/x
git add -p && git commit -m "Why + what"
git fetch && git rebase origin/main
git push -u origin feature/x
git stash / git stash pop
git cherry-pick <sha>
git revert <sha>          # safe undo on shared branch
git reset --soft HEAD~1   # undo last local commit, keep changes
```

## Security quick list

Parameterised SQL · `[Authorize]` + ownership checks · HTTPS/HSTS · Identity password hashing · Antiforgery · Razor encoding · Key Vault for secrets · updated packages · no secrets/PII in logs.
