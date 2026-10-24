---
slug: test-automation
title: Test Automation — Selenium, Playwright, API and BDD with C#
track: automation
order: 1
group: Test Automation
icon: QA
color: #2b8a3e
summary: Testing fundamentals and the test pyramid, NUnit/xUnit, Selenium WebDriver and locators, waits, Page Object Model, Playwright for .NET, API testing with HttpClient/RestSharp/Postman, BDD with Reqnroll (SpecFlow), data-driven tests, CI pipelines, flaky tests and the SDET interview questions.
---

# Overview

**Test automation** means writing code that tests software automatically and repeatably — UI tests that drive a browser, API tests that call endpoints, and unit/integration tests that check code directly. An **SDET** (Software Development Engineer in Test) or automation engineer builds and maintains these frameworks and runs them in CI/CD.

**The test pyramid** (Mike Cohn):

```text
          /  UI / E2E  \        few — slow, brittle, test real user flows
         /  API / service \     more — fast, stable, test business rules through the API
        /    Unit tests     \   most — milliseconds, test classes/functions in isolation
```

| Level | Tools (.NET) | Speed |
|---|---|---|
| Unit | xUnit, NUnit, MSTest + Moq/NSubstitute + FluentAssertions | ms |
| Integration | `WebApplicationFactory`, Testcontainers, EF Core with real SQL | seconds |
| API | HttpClient, RestSharp, Postman/Newman, Playwright API | seconds |
| UI / E2E | Selenium WebDriver, Playwright, Cypress (JS) | seconds–minutes |
| BDD | Reqnroll (successor of SpecFlow), Cucumber | wraps any level |
| Performance | k6, JMeter, NBomber, Azure Load Testing | minutes |

# Versions

| Year | Milestone |
|---|---|
| 2004 | Selenium created at ThoughtWorks (Jason Huggins) |
| 2011 | Selenium 2 merges WebDriver |
| 2016 | Selenium 3 (Selenium RC removed) |
| 2018 | WebDriver becomes a W3C Recommendation |
| 2020 | Playwright released by Microsoft (Node), .NET/Python/Java bindings in 2021 |
| 2021 | Selenium 4 — W3C protocol, relative locators, CDP access, new Grid |
| 2023 | Selenium Manager (automatic driver download) built in from 4.6+ |
| 2024 | SpecFlow end-of-life announced; community fork **Reqnroll** becomes the .NET BDD standard; WebDriver BiDi rolling out |
| 2025 | Playwright 1.5x — test agents, MCP integration; Selenium 4.3x with BiDi APIs |

# Lifecycle

**Automation in the software testing life cycle (STLC):**

1. **Requirement analysis** — which acceptance criteria can be automated; risk-based selection.
2. **Test planning** — scope, tools, framework design, environments, data strategy.
3. **Test design** — test cases, data sets, page objects, API contracts.
4. **Framework & scripts** — build reusable framework, write tests, code review them like product code.
5. **Execution** — locally and in CI (on every PR: unit + API smoke; nightly: full regression; parallel/grid).
6. **Reporting** — results, screenshots, videos, traces (Allure, ExtentReports, Azure Test Plans, Playwright HTML report).
7. **Maintenance** — fix flaky tests, update locators, refactor; delete tests that no longer give value.

# Tools

- **Test runners:** NUnit, xUnit, MSTest; `dotnet test`.
- **UI:** Selenium WebDriver (C#), Playwright for .NET (`Microsoft.Playwright`), Appium (mobile), WinAppDriver/FlaUI (Windows desktop).
- **API:** HttpClient, RestSharp, Flurl, Postman + Newman, Playwright `APIRequestContext`.
- **BDD:** Reqnroll (Gherkin `.feature` files with C# step definitions).
- **Assertions & mocks:** FluentAssertions / Shouldly, Moq, NSubstitute, WireMock.Net (fake HTTP services).
- **Data & environments:** Bogus (fake data), Testcontainers (Docker DBs), Selenium Grid / Selenoid, BrowserStack, Sauce Labs.
- **CI & reporting:** Azure DevOps, GitHub Actions, Jenkins, Allure, ExtentReports.

# Module: Testing Fundamentals

## Lesson: [Basic|High] Testing types, terms and what to automate

| Term | Meaning |
|---|---|
| Functional vs non-functional | What it does vs how well (performance, security, usability) |
| Smoke | Few critical checks — is the build alive? |
| Sanity | Quick check of one changed area |
| Regression | Re-run existing tests to catch side effects of changes — the main candidate for automation |
| Black box / white box | Without / with knowledge of the code |
| Verification vs validation | Built right (spec) vs built the right thing (user need) |
| Severity vs priority | Impact on the system vs urgency to fix |

**Automate:** repetitive regression, smoke, data-driven cases, API contracts, cross-browser checks, stable features.
**Keep manual:** exploratory testing, usability/look-and-feel, one-off checks, features still changing daily.

**Test case design techniques:** equivalence partitioning, boundary value analysis (age 17/18/99/100), decision tables, state transition, pairwise.

## Lesson: [Basic|High] Unit test frameworks — NUnit and xUnit

```csharp
// NUnit
[TestFixture]
public class DiscountTests
{
    private DiscountService _sut = null!;
    [SetUp] public void Setup() => _sut = new DiscountService();

    [TestCase(500, 0)]
    [TestCase(1000, 50)]
    [TestCase(5000, 500)]
    public void Discount_depends_on_order_total(decimal total, decimal expected)
        => Assert.That(_sut.For(total), Is.EqualTo(expected));
}

// xUnit — a new class instance per test; constructor = setup, IDisposable = teardown
public class CartTests
{
    [Theory]
    [InlineData(0, false)]
    [InlineData(3, true)]
    public void HasItems(int count, bool expected) => new Cart(count).HasItems.Should().Be(expected);

    [Fact]
    public async Task Checkout_calls_payment_once()
    {
        var payment = Substitute.For<IPaymentGateway>();
        await new CheckoutService(payment).PayAsync(new Order(100));
        await payment.Received(1).ChargeAsync(100);
    }
}
```

| | NUnit | xUnit | MSTest |
|---|---|---|---|
| Test | `[Test]` | `[Fact]` | `[TestMethod]` |
| Parameterised | `[TestCase]`, `[TestCaseSource]` | `[Theory]` + `[InlineData]`/`[MemberData]` | `[DataRow]` |
| Setup | `[SetUp]`, `[OneTimeSetUp]` | constructor, `IClassFixture<T>` | `[TestInitialize]` |
| Popular for | Selenium frameworks | .NET Core apps | Microsoft shops |

Structure every test as **Arrange – Act – Assert**; one behaviour per test; name tests by behaviour.

# Module: UI Automation

## Lesson: [Intermediate|High] Selenium WebDriver with C# — locators and actions

```csharp
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;

var options = new ChromeOptions();
options.AddArgument("--headless=new");
using IWebDriver driver = new ChromeDriver(options);     // Selenium Manager downloads the driver automatically (4.6+)
driver.Navigate().GoToUrl("https://shop.example.com/login");

driver.FindElement(By.Id("email")).SendKeys("qa@example.com");
driver.FindElement(By.CssSelector("input[name='password']")).SendKeys("Secret#123");
driver.FindElement(By.XPath("//button[normalize-space()='Sign in']")).Click();

var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
var heading = wait.Until(d => d.FindElement(By.CssSelector("[data-testid='dashboard-title']")));
Assert.That(heading.Text, Is.EqualTo("Dashboard"));
```

**Locator priority (most to least stable):** dedicated test ids (`data-testid`) → `id` → `name` → CSS selectors → XPath → link text. Avoid absolute XPath (`/html/body/div[3]/...`) and auto-generated classes.

| XPath tricks | Example |
|---|---|
| Text | `//button[text()='Save']`, `contains(text(),'Save')` |
| Attribute contains | `//input[contains(@id,'email')]` |
| Axes | `//label[.='Email']/following-sibling::input`, `//td[.='1001']/parent::tr//button` |

Other APIs: `Actions` (hover, drag-drop, keyboard), `SelectElement` (dropdowns), `SwitchTo().Frame()/Window()/Alert()`, `IJavaScriptExecutor` (scroll, read values), `GetScreenshot()`.

## Lesson: [Intermediate|High] Waits and synchronisation — killing flaky tests

| Wait | Behaviour | Verdict |
|---|---|---|
| `Thread.Sleep(5000)` | Always waits the full time | ❌ Slow and still flaky |
| Implicit wait (`driver.Manage().Timeouts().ImplicitWait`) | Polls for every `FindElement` | ⚠️ Global, hides problems; don't mix with explicit |
| Explicit wait (`WebDriverWait` + condition) | Waits until a specific condition or timeout | ✅ Use this |
| Fluent wait | Explicit wait with polling interval and ignored exceptions | ✅ For special cases |

```csharp
var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(15)) { PollingInterval = TimeSpan.FromMilliseconds(250) };
wait.IgnoreExceptionTypes(typeof(NoSuchElementException), typeof(StaleElementReferenceException));
var button = wait.Until(d => { var e = d.FindElement(By.Id("save")); return e.Displayed && e.Enabled ? e : null; });
```

Common exceptions: `NoSuchElementException` (wrong locator or not loaded), `StaleElementReferenceException` (DOM re-rendered — find the element again), `ElementClickInterceptedException` (overlay/spinner covering it — wait for it to disappear), `TimeoutException`.

## Lesson: [Intermediate|High] Page Object Model and framework design

**Page Object Model (POM):** one class per page/component holding its locators and actions; tests call meaningful methods instead of raw locators — locator changes are fixed in one place.

```csharp
public class LoginPage(IWebDriver driver)
{
    private IWebElement Email => driver.FindElement(By.Id("email"));
    private IWebElement Password => driver.FindElement(By.Id("password"));
    private IWebElement SignIn => driver.FindElement(By.CssSelector("[data-testid='sign-in']"));

    public DashboardPage LoginAs(string email, string password)
    {
        Email.SendKeys(email); Password.SendKeys(password); SignIn.Click();
        return new DashboardPage(driver);   // fluent navigation
    }
}

[Test]
public void Valid_user_reaches_dashboard()
{
    var dashboard = new LoginPage(Driver).LoginAs(TestUsers.Standard.Email, TestUsers.Standard.Password);
    Assert.That(dashboard.Title, Is.EqualTo("Dashboard"));
}
```

**Typical framework layout:**

```text
Tests/            test classes (NUnit/xUnit or Reqnroll features)
Pages/            page objects / components
Core/             DriverFactory (browser, headless, grid), config (appsettings.json), waits, logging
Data/             test data builders (Bogus), JSON/Excel data
Api/              API clients for setup/teardown (create data via API, not UI)
Reports/          Allure/Extent configuration, screenshots on failure
```

Principles: tests independent and order-free, data created per test (via API/DB), no hard-coded waits or environments, parallel-safe (one driver per test/thread), screenshot + logs on failure.

## Lesson: [Intermediate|High] Playwright for .NET

```csharp
// dotnet add package Microsoft.Playwright.NUnit ; then: pwsh bin/Debug/net10.0/playwright.ps1 install
public class CheckoutTests : PageTest
{
    [Test]
    public async Task User_can_place_order()
    {
        await Page.GotoAsync("https://shop.example.com");
        await Page.GetByRole(AriaRole.Link, new() { Name = "Laptops" }).ClickAsync();
        await Page.GetByTestId("product-101").GetByRole(AriaRole.Button, new() { Name = "Add to cart" }).ClickAsync();
        await Page.GetByRole(AriaRole.Button, new() { Name = "Checkout" }).ClickAsync();
        await Expect(Page.GetByText("Order placed")).ToBeVisibleAsync();   // auto-retrying assertion
    }
}
```

| | Selenium | Playwright |
|---|---|---|
| Protocol | W3C WebDriver (BiDi coming) | Direct browser protocols (CDP / patched engines) |
| Waiting | Manual explicit waits | **Auto-wait** before actions + retrying assertions |
| Browsers | Chrome, Edge, Firefox, Safari, IE (legacy) | Chromium, Firefox, WebKit |
| Isolation | New driver per test (slow) | Browser contexts (fast, isolated) |
| Extras | Huge ecosystem, Grid, Appium for mobile | Tracing viewer, codegen, network mocking, API testing, video |
| Languages | Java, C#, Python, JS, Ruby | TS/JS, C#, Python, Java |

Useful features: `playwright codegen` (record locators), `Page.RouteAsync` (mock APIs), trace viewer (step-by-step DOM snapshots), `StorageState` (reuse login), parallel workers.

# Module: API, BDD and CI

## Lesson: [Intermediate|High] API test automation

```csharp
public class OrdersApiTests
{
    private readonly HttpClient _client = new() { BaseAddress = new Uri("https://api.example.com") };

    [Test]
    public async Task Create_order_returns_201_and_location()
    {
        _client.DefaultRequestHeaders.Authorization = new("Bearer", await TokenHelper.GetAsync());
        var response = await _client.PostAsJsonAsync("/api/orders", new { customerId = 42, lines = new[] { new { productId = 1, qty = 2 } } });

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        Assert.That(response.Headers.Location, Is.Not.Null);
        var order = await response.Content.ReadFromJsonAsync<OrderDto>();
        Assert.That(order!.Lines, Has.Count.EqualTo(1));
    }

    [Test]
    public async Task Missing_token_returns_401()
        => Assert.That((await new HttpClient().GetAsync("https://api.example.com/api/orders")).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
}
```

What to check: status codes, response body and schema, headers, error messages (ProblemDetails), auth (401/403), validation (400), idempotency, pagination, performance thresholds. For ASP.NET Core apps, `WebApplicationFactory<Program>` runs the API in-memory for fast integration tests; WireMock.Net fakes third-party APIs.

Postman: collections, environments, pre-request scripts, `pm.test(...)` assertions, run in CI with **Newman**.

## Lesson: [Intermediate|Medium] BDD with Reqnroll (SpecFlow successor)

```gherkin
Feature: Login
  Scenario Outline: Login with different users
    Given I am on the login page
    When I log in as "<email>" with password "<password>"
    Then I should see "<result>"
    Examples:
      | email            | password  | result            |
      | qa@example.com   | Secret#1  | Dashboard         |
      | qa@example.com   | wrong     | Invalid password  |
```

```csharp
[Binding]
public class LoginSteps(ScenarioContext ctx, IWebDriver driver)
{
    private readonly LoginPage _login = new(driver);
    [Given("I am on the login page")] public void Open() => _login.Open();
    [When("I log in as {string} with password {string}")] public void Login(string e, string p) => _login.Submit(e, p);
    [Then("I should see {string}")] public void Check(string text) => Assert.That(driver.PageSource, Does.Contain(text));
}
```

BDD value: shared language with business (Three Amigos), living documentation. Cost: an extra layer — use it when business people actually read the feature files. Hooks: `[BeforeScenario]`, `[AfterScenario]` (screenshot on failure), tags (`@smoke`) to filter runs.

## Lesson: [Advanced|High] Running tests in CI/CD, parallel execution and reporting

```yaml
# Azure DevOps pipeline (excerpt)
- task: DotNetCoreCLI@2
  inputs: { command: test, projects: 'tests/**/*.csproj', arguments: '--filter TestCategory=Smoke --logger trx' }
- task: PublishTestResults@2
  inputs: { testResultsFormat: VSTest, testResultsFiles: '**/*.trx' }
```

- **When to run:** unit + API smoke on every PR; full UI regression nightly or before release; smoke after each deployment.
- **Parallel:** NUnit `[Parallelizable(ParallelScope.All)]` + `[FixtureLifeCycle(LifeCycle.InstancePerTestCase)]`; xUnit runs test classes in parallel; Playwright workers; Selenium Grid / cloud grids for many browsers.
- **Headless** browsers in CI; record video/trace only on failure.
- **Reports:** TRX in Azure DevOps, Allure/Extent HTML, Playwright HTML report with traces.
- **Environment & data:** config per environment (appsettings + pipeline variables), secrets from Key Vault/variable groups, fresh data created through APIs, Testcontainers for DBs.

## Lesson: [Advanced|High] Flaky tests — causes and cures

A **flaky test** passes and fails on the same code. It destroys trust in the suite.

| Cause | Cure |
|---|---|
| Timing (element not ready, animations, async loads) | Explicit waits on conditions / Playwright auto-wait; wait for network idle or a specific response |
| Shared/test-order-dependent data | Each test creates and cleans its own data; unique names (GUIDs) |
| Brittle locators | `data-testid`, role-based locators, POM |
| Environment instability | Health check before run, mock external services (WireMock), stable test env |
| Parallel collisions | Separate users/data per worker; thread-safe driver handling |
| Hidden bugs (race conditions in the app) | Investigate — the flakiness may be real |

Process: quarantine (tag and exclude from blocking runs), track flake rate, fix or delete — never just add retries everywhere (retries hide real problems; use them as a temporary, visible measure).

# Interview

## [Beginner|High] What is the test pyramid and why does it matter?

Many fast unit tests at the bottom, fewer API/integration tests in the middle, and a small number of slow UI/E2E tests at the top. It gives fast feedback and stable suites: most logic is tested cheaply below the UI, while a few E2E tests confirm critical user journeys. The anti-pattern is the "ice-cream cone" (mostly UI tests) — slow and flaky.

## [Beginner|High] What should and shouldn't be automated?

Automate stable, repetitive, high-value checks: regression, smoke, data-driven cases, API contracts, cross-browser critical paths. Don't automate exploratory and usability testing, one-off checks, features that change daily, or anything where the maintenance costs more than running it manually.

## [Beginner|High] Which Selenium locators do you use and in what order?

Prefer stable, unique attributes: `data-testid`/`data-qa` → `id` → `name` → CSS selectors → relative XPath (text, attributes, axes) → link text. Avoid absolute XPath and generated class names. If the app lacks good attributes, ask developers to add test ids — it's the most effective fix for brittle tests.

## [Beginner|High] Implicit vs explicit vs fluent wait?

Implicit: a global timeout applied to every element lookup. Explicit: `WebDriverWait` waiting for a specific condition (visible, clickable, text present) up to a timeout — recommended. Fluent: an explicit wait with configurable polling and ignored exceptions. Never use `Thread.Sleep`, and don't mix implicit and explicit waits (timeouts combine unpredictably).

## [Beginner|High] What is the Page Object Model?

A design pattern where each page or component is a class that owns its locators and exposes user actions (`LoginAs`, `AddToCart`). Tests read like user steps, locators live in one place (one fix when the UI changes), and code is reused. Variants: Page Factory (Java), component objects, Screenplay pattern.

## [Intermediate|High] Selenium vs Playwright — which would you choose?

Playwright for new web projects: auto-waiting and retrying assertions (less flakiness), fast isolated browser contexts, built-in tracing, network mocking, API testing, parallel runs and codegen. Selenium when you need the W3C standard, the widest language/browser support (including real Safari and legacy browsers), Appium for mobile, an existing large Selenium framework, or vendor grids. Both work well with C#.

## [Intermediate|High] How do you handle StaleElementReferenceException?

It means the element you hold was removed or re-rendered in the DOM. Re-locate the element right before using it (page-object properties that find each time, not cached fields), wait for the page update to finish (explicit wait on a condition), and include it in ignored exceptions of a fluent wait for dynamic grids.

## [Intermediate|High] How do you design an automation framework from scratch?

Language and runner matching the team (C# + NUnit/xUnit), Selenium or Playwright for UI and HttpClient/RestSharp for API, layered structure (tests → pages/components → core: driver factory, config, waits, logging → data builders → API helpers), configuration per environment, test data created via API, parallel execution, screenshots/traces and reports on failure, CI integration with categories (smoke/regression), and coding standards with code review. Optionally Reqnroll for BDD.

## [Intermediate|High] How do you test REST APIs? What do you validate?

Using HttpClient/RestSharp/Postman: send requests with correct and incorrect data, check status codes (200/201/204/400/401/403/404/409), response body and JSON schema, headers, error format, authentication and authorisation per role, boundary values, pagination and sorting, idempotency of PUT/DELETE, and response time. Chain requests (create → get → update → delete) and clean up data.

## [Intermediate|Medium] What is data-driven testing?

Running the same test logic with multiple data sets: NUnit `[TestCase]`/`[TestCaseSource]`, xUnit `[Theory]` + `[InlineData]`/`[MemberData]`, Reqnroll `Scenario Outline` + `Examples`, or data from JSON/CSV/Excel/DB. It increases coverage (boundaries, partitions) without duplicating code.

## [Intermediate|Medium] How do you handle iframes, multiple windows, alerts and dropdowns in Selenium?

Frames: `driver.SwitchTo().Frame(idOrElement)` then `SwitchTo().DefaultContent()`. Windows/tabs: store `CurrentWindowHandle`, loop `WindowHandles`, `SwitchTo().Window(handle)`. Alerts: `SwitchTo().Alert().Accept()/Dismiss()/Text`. Dropdowns: `new SelectElement(element).SelectByText("India")` for `<select>`; custom dropdowns are clicked like normal elements.

## [Intermediate|Medium] What is BDD and when is it worth it?

Behaviour-Driven Development describes behaviour in Gherkin (Given/When/Then) agreed with business and QA, then automates those scenarios with step definitions (Reqnroll in .NET). Worth it when business stakeholders read and help write scenarios — it becomes living documentation. If only engineers read them, the Gherkin layer is overhead; plain readable tests are enough.

## [Advanced|High] How do you run UI tests in parallel safely?

One driver/browser context per test (thread-local or per-test instance), no static shared state, unique test data per test (GUIDs, separate users), tests independent of order, config for worker count, and infrastructure that can handle the load (Selenium Grid, cloud grid, Playwright workers). NUnit: `[Parallelizable]` with instance-per-test-case; xUnit: collections control parallelism.

## [Advanced|High] How do you integrate automated tests into CI/CD?

Tests live in the same repo or a sibling repo, run via `dotnet test` in Azure DevOps/GitHub Actions/Jenkins: unit and API smoke on every PR (quality gate), deployment smoke tests after each environment deploy, full regression nightly. Headless browsers or a grid, results published (TRX/JUnit), artefacts on failure (screenshots, videos, traces), notifications, and failing tests block the pipeline.

## [Advanced|Medium] What metrics do you track for test automation?

Pass rate and flaky rate, execution time, coverage of critical flows/requirements (not just code coverage), defects found by automation vs escaped defects, time to fix broken tests, and automation ROI (manual hours saved). Use them to decide what to fix, speed up or delete.

## [Scenario|High] Your regression suite of 800 UI tests takes 6 hours and 10% fail randomly. What do you do?

Measure first: list slowest and flakiest tests. Move logic checks down the pyramid (API/unit tests); keep UI tests for critical journeys. Replace sleeps with condition waits or Playwright auto-wait; use stable locators; create test data via API instead of UI steps; reuse login state. Run in parallel on a grid with independent data. Quarantine flaky tests and fix root causes. Target: smoke < 10 min per PR, full regression < 1 hour, flake rate < 1–2%.

## [Scenario|High] A test passes locally but fails in the CI pipeline. How do you investigate?

Compare environments: headless vs headed (viewport/screen size differs), browser/driver versions, timing on slower agents, environment URLs and config, test data present/missing, parallel runs colliding, time zone/culture, network/proxy. Collect evidence: screenshots, video, Playwright trace, browser console and network logs, CI logs. Reproduce with the same settings locally (headless, same browser version, same data).

## [Scenario|Medium] The developers change the UI often and your locators break every sprint. How do you fix this?

Agree with developers to add stable `data-testid` attributes (part of the definition of done), use role/text-based locators (Playwright `GetByRole`, `GetByLabel`) that follow user-visible behaviour, centralise locators in page/component objects, review UI changes with QA early, and add a quick smoke run on every PR so breaks are found immediately — not at the end of the sprint.

## [Scenario|Medium] How would you test a login page? List the cases.

Valid login; invalid password; unknown user; empty fields; field validation (email format, length); password masked; case sensitivity; account lockout after N attempts; "remember me"; forgot password flow; SQL injection/XSS strings; session timeout and logout; back button after logout; HTTPS; multiple browsers/devices; accessibility (labels, keyboard); performance under load; error messages don't reveal whether the user exists.

# Cheatsheet

## Pyramid & what to automate

Many unit → some API/integration → few UI. Automate regression, smoke, data-driven, API contracts; keep exploratory and usability manual.

## Selenium essentials

```csharp
driver.FindElement(By.CssSelector("[data-testid='save']")).Click();
new WebDriverWait(driver, TimeSpan.FromSeconds(10)).Until(d => d.FindElement(By.Id("ok")).Displayed);
new SelectElement(el).SelectByText("India");  driver.SwitchTo().Frame("pay");
```

## Playwright essentials

```csharp
await Page.GetByRole(AriaRole.Button, new() { Name = "Save" }).ClickAsync();
await Expect(Page.GetByText("Saved")).ToBeVisibleAsync();
await Page.RouteAsync("**/api/orders", r => r.FulfillAsync(new() { Json = new[] { new { id = 1 } } }));
```

## Framework checklist

POM/components · driver factory · config per env · explicit waits only · data via API · independent tests · parallel-safe · screenshots/traces on failure · reports · CI categories (smoke/regression).

## Flaky test fixes

Condition waits · stable locators · own data per test · mock unstable dependencies · quarantine + fix · retries only as a visible, temporary measure.
