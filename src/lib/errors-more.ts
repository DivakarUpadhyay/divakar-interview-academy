// Second batch of "Fix this error" pages (IIS hosting, EF Core, SQL Server, C#, front end). Same shape as errors.ts.
import type { ErrorFix } from "./errors";

const IIS = { href: "/courses/iis", title: "IIS course" };
const API = { href: "/courses/aspnet-core-webapi", title: "ASP.NET Core Web API course" };
const EF = { href: "/courses/efcore", title: "Entity Framework Core course" };
const SQL = { href: "/courses/sqlserver", title: "SQL Server and T-SQL course" };
const CS = { href: "/courses/csharp", title: "C# course" };

export const MORE_ERRORS: ErrorFix[] = [
  {
    slug: "iis-http-error-500-19-internal-server-error", area: "IIS",
    title: "HTTP Error 500.19 - Internal Server Error (IIS)",
    message: "HTTP Error 500.19 - Internal Server Error. The requested page cannot be accessed because the related configuration data for the page is invalid. Error Code 0x8007000d",
    meaning: "IIS could not read the site's web.config. For ASP.NET Core sites the usual reason is that IIS doesn't understand the `<aspNetCore>` section because the ASP.NET Core Module isn't installed.",
    causes: [
      "The .NET Hosting Bundle is not installed on the server (error code `0x8007000d`).",
      "The IIS URL Rewrite module is missing but web.config has a `<rewrite>` section.",
      "web.config contains invalid XML, or a section is locked at server level (error code `0x80070021`).",
      "The app pool identity cannot read the folder (error code `0x80070005`).",
    ],
    fixes: [
      "Install the ASP.NET Core Hosting Bundle that matches your app's .NET version, then run `iisreset`.",
      "Install URL Rewrite if web.config uses `<rewrite>` rules.",
      "Open web.config in an XML editor and fix any typo; the error page shows the exact line number.",
      "For locked sections, unlock them in IIS Manager → server → Configuration Editor, or `appcmd unlock config -section:system.webServer/handlers`.",
      "Give `IIS AppPool\\YourPoolName` Read permission on the site folder.",
    ],
    lesson: IIS,
  },
  {
    slug: "iis-http-error-502-5-process-failure", area: "IIS",
    title: "HTTP Error 502.5 - Process Failure (ASP.NET Core on IIS)",
    message: "HTTP Error 502.5 - Process Failure. Common causes of this issue: The application process failed to start. The application process started but then stopped.",
    meaning: "IIS started your ASP.NET Core app through the out-of-process module, but the dotnet process crashed or exited before it could answer. 502.5 comes from older hosting models; newer ones show 500.30 instead.",
    causes: [
      "The runtime version the app targets is not installed on the server.",
      "An exception during startup: bad connection string, missing config file, failed migration.",
      "The `processPath` or `arguments` in web.config point to the wrong file.",
    ],
    fixes: [
      "Run the app by hand on the server: `cd C:\\inetpub\\myapp` then `dotnet MyApp.dll`. The real exception prints in the console.",
      "Check Event Viewer → Windows Logs → Application for \"IIS AspNetCore Module\" entries.",
      "Turn on stdout logging in web.config (`stdoutLogEnabled=\"true\"`, create the `logs` folder) and read the log.",
      "Install the matching .NET runtime or publish self-contained.",
    ],
    snippet: { lang: "xml", code: `<aspNetCore processPath="dotnet" arguments=".\\MyApp.dll"
            stdoutLogEnabled="true" stdoutLogFile=".\\logs\\stdout"
            hostingModel="inprocess" />` },
    lesson: IIS,
  },
  {
    slug: "iis-http-error-500-31-failed-to-load-aspnet-core-runtime", area: "IIS",
    title: "HTTP Error 500.31 - Failed to load ASP.NET Core runtime",
    message: "HTTP Error 500.31 - Failed to load ASP.NET Core runtime. The specified version of Microsoft.NetCore.App or Microsoft.AspNetCore.App was not found.",
    meaning: "Your app was built for a .NET version that the server doesn't have. IIS found the module but not the runtime.",
    causes: [
      "You upgraded the project (for example to .NET 9) but the server only has .NET 8.",
      "Only the .NET runtime was installed, not the Hosting Bundle (which includes the ASP.NET Core runtime).",
      "A 32-bit app pool is running an app that needs the 64-bit runtime, or the other way round.",
    ],
    fixes: [
      "List installed runtimes on the server: `dotnet --list-runtimes`, and compare with `<TargetFramework>` in the .csproj.",
      "Install the Hosting Bundle for that version, then `iisreset`.",
      "Or publish self-contained so the runtime ships with the app: `dotnet publish -c Release -r win-x64 --self-contained`.",
      "Check the app pool's \"Enable 32-Bit Applications\" setting matches the runtime you installed.",
    ],
    lesson: IIS,
  },
  {
    slug: "iis-http-error-403-14-forbidden", area: "IIS",
    title: "HTTP Error 403.14 - Forbidden (web server is configured to not list the contents)",
    message: "HTTP Error 403.14 - Forbidden. The Web server is configured to not list the contents of this directory.",
    meaning: "IIS found the folder but no default page and no app to handle the request, so it refuses to show a file list.",
    causes: [
      "The site points at the source folder instead of the published output.",
      "For ASP.NET Core: web.config is missing from the published folder, so IIS treats it as a static folder.",
      "For classic ASP.NET MVC: ASP.NET isn't registered or the app pool uses the wrong .NET CLR version.",
      "There is no `index.html` or `default.aspx` for a static site.",
    ],
    fixes: [
      "Point the IIS site's physical path at the `dotnet publish` output, which contains web.config.",
      "Install the .NET Hosting Bundle so IIS can run ASP.NET Core apps.",
      "For static sites add a default document in IIS Manager → Default Document.",
      "Don't enable Directory Browsing to make the error go away; that exposes your files.",
    ],
    lesson: IIS,
  },
  {
    slug: "aspnet-core-cannot-consume-scoped-service-from-singleton", area: "ASP.NET Core",
    title: "Cannot consume scoped service from singleton",
    message: "System.InvalidOperationException: Cannot consume scoped service 'MyApp.Data.AppDbContext' from singleton 'MyApp.Services.CacheService'.",
    meaning: "A singleton (one instance for the whole app) asked for a scoped service (one per request). The scoped one would live forever inside the singleton, so ASP.NET Core stops you.",
    causes: [
      "A singleton service takes a DbContext or another scoped service in its constructor.",
      "A hosted service (`BackgroundService`) injects a DbContext directly; hosted services are singletons.",
    ],
    fixes: [
      "Make the outer service scoped too, if it doesn't need to live for the whole app.",
      "Or inject `IServiceScopeFactory` and create a scope each time you need the scoped service.",
      "In background services, create a new scope per unit of work, as below.",
    ],
    snippet: { lang: "csharp", code: `public class CleanupJob(IServiceScopeFactory scopes) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Sessions.Where(s => s.Expired).ExecuteDeleteAsync(ct);
    }
}` },
    lesson: API,
  },
  {
    slug: "aspnet-core-no-authenticationscheme-was-specified", area: "ASP.NET Core",
    title: "No authenticationScheme was specified, and there was no DefaultChallengeScheme found",
    message: "System.InvalidOperationException: No authenticationScheme was specified, and there was no DefaultChallengeScheme found. The default schemes can be set using either AddAuthentication(string defaultScheme) or AddAuthentication(Action<AuthenticationOptions> configureOptions).",
    meaning: "An endpoint has `[Authorize]`, so ASP.NET Core needs to challenge the user, but no authentication method was registered as the default.",
    causes: [
      "`AddAuthentication()` was called without a default scheme.",
      "`AddJwtBearer` or `AddCookie` was never added.",
      "Authentication is registered but `app.UseAuthentication()` is missing or placed after `UseAuthorization()`.",
    ],
    fixes: [
      "Pass the default scheme: `AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...)`.",
      "Call `app.UseAuthentication()` before `app.UseAuthorization()`.",
    ],
    snippet: { lang: "csharp", code: `builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => { o.Authority = "https://login.example.com"; o.Audience = "shop-api"; });

app.UseAuthentication();
app.UseAuthorization();` },
    lesson: API,
  },
  {
    slug: "aspnet-core-415-unsupported-media-type", area: "ASP.NET Core",
    title: "415 Unsupported Media Type in ASP.NET Core Web API",
    message: "{\"type\":\"https://tools.ietf.org/html/rfc9110#section-15.5.16\",\"title\":\"Unsupported Media Type\",\"status\":415}",
    meaning: "The request body came in a format the action doesn't accept. With `[ApiController]`, a `[FromBody]` parameter only accepts JSON by default.",
    causes: [
      "The client didn't send `Content-Type: application/json`.",
      "The client posts a form (`multipart/form-data` or `x-www-form-urlencoded`) to an action that expects `[FromBody]`.",
      "A GET request with a body bound to a complex parameter.",
    ],
    fixes: [
      "Set the header on the client: `fetch(url, { method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify(data) })`.",
      "For form posts or file uploads use `[FromForm]` instead of `[FromBody]`.",
      "In Postman pick Body → raw → JSON, not Text.",
    ],
    lesson: API,
  },
  {
    slug: "aspnet-core-synchronous-operations-are-disallowed", area: "ASP.NET Core",
    title: "Synchronous operations are disallowed. Call ReadAsync or set AllowSynchronousIO to true",
    message: "System.InvalidOperationException: Synchronous operations are disallowed. Call ReadAsync or set AllowSynchronousIO to true instead.",
    meaning: "Kestrel and IIS block synchronous reads and writes of the request and response body, because they tie up a thread while waiting for the network.",
    causes: [
      "Code reads `Request.Body` with `StreamReader.ReadToEnd()` instead of `ReadToEndAsync()`.",
      "An old library (XML serializer, some PDF or Excel writers) writes to `Response.Body` synchronously.",
    ],
    fixes: [
      "Use the async version: `await new StreamReader(Request.Body).ReadToEndAsync()`.",
      "For libraries that only write synchronously, write to a `MemoryStream` first and then `await ms.CopyToAsync(Response.Body)`.",
      "Only as a last resort: `builder.WebHost.ConfigureKestrel(o => o.AllowSynchronousIO = true)`.",
    ],
    lesson: API,
  },
  {
    slug: "jwt-idx10503-signature-validation-failed", area: "ASP.NET Core",
    title: "IDX10503: Signature validation failed (JWT bearer)",
    message: "Bearer error=\"invalid_token\", error_description=\"The signature key was not found\" / IDX10503: Signature validation failed. Token does not have a kid. Keys tried: ...",
    meaning: "The API received a JWT but couldn't prove it was signed by a key it trusts, so it answered 401.",
    causes: [
      "The API's signing key differs from the one that created the token (different secret per environment).",
      "The symmetric key is too short: HS256 needs at least 256 bits (32 bytes).",
      "Authority or metadata address is wrong, so the API downloads the wrong public keys.",
      "The token came from a different identity provider or tenant.",
    ],
    fixes: [
      "Paste the token into a JWT decoder and check `iss`, `aud`, `kid` and `alg`.",
      "Make sure issuer and API read the same signing key from configuration.",
      "Turn on detailed errors in development: `IdentityModelEventSource.ShowPII = true;` (never in production).",
    ],
    lesson: API,
  },
  {
    slug: "aspnet-core-mvc-the-view-was-not-found", area: "ASP.NET Core",
    title: "The view 'Index' was not found. The following locations were searched",
    message: "InvalidOperationException: The view 'Index' was not found. The following locations were searched: /Views/Home/Index.cshtml /Views/Shared/Index.cshtml",
    meaning: "The action returned `View()`, but MVC found no .cshtml file with that name in the folders it checks.",
    causes: [
      "The file name or folder doesn't match the controller and action name (`HomeController.Index` → `Views/Home/Index.cshtml`).",
      "The view's Build Action is not Content, so it wasn't published.",
      "The view lives in an Area but the controller lacks the `[Area(\"Admin\")]` attribute.",
      "Razor runtime compilation was expected but not enabled.",
    ],
    fixes: [
      "Rename or move the file so the path matches one of the searched locations listed in the error.",
      "Or name the view explicitly: `return View(\"~/Views/Shared/Dashboard.cshtml\", model);`.",
      "Check the published folder or the compiled Views assembly contains the view.",
    ],
    lesson: { href: "/courses/aspnet-core-mvc", title: "ASP.NET Core MVC course" },
  },
  {
    slug: "efcore-instance-cannot-be-tracked-same-key-already-tracked", area: "Entity Framework Core",
    title: "The instance of entity type cannot be tracked because another instance with the same key value is already being tracked",
    message: "System.InvalidOperationException: The instance of entity type 'Product' cannot be tracked because another instance with the key value '{Id: 5}' is already being tracked.",
    meaning: "The DbContext already holds one object for Product 5, and you asked it to track a second, different object with the same key. It can't know which one is right.",
    causes: [
      "You load an entity, then call `Update(dto mapped to new Product)` with the same ID on the same context.",
      "`Attach` or `Update` on an object while a query earlier in the request already loaded that row.",
      "A context registered as singleton, so tracked entities pile up across requests.",
    ],
    fixes: [
      "Load the tracked entity and copy values onto it instead of attaching a new object: `db.Entry(existing).CurrentValues.SetValues(dto)`.",
      "Use `AsNoTracking()` for read-only queries so they don't hold instances.",
      "Keep the DbContext scoped (the default with `AddDbContext`).",
    ],
    snippet: { lang: "csharp", code: `var product = await db.Products.FindAsync(dto.Id);
if (product is null) return NotFound();
db.Entry(product).CurrentValues.SetValues(dto);
await db.SaveChangesAsync();` },
    lesson: EF,
  },
  {
    slug: "efcore-the-linq-expression-could-not-be-translated", area: "Entity Framework Core",
    title: "The LINQ expression could not be translated",
    message: "System.InvalidOperationException: The LINQ expression 'DbSet<Order>().Where(o => o.Customer.FullName().StartsWith(\"A\"))' could not be translated. Either rewrite the query in a form that can be translated, or switch to client evaluation explicitly by inserting a call to 'AsEnumerable', 'AsAsyncEnumerable', 'ToList', or 'ToListAsync'.",
    meaning: "EF Core turns LINQ into SQL. Part of your query calls C# code that has no SQL equivalent, and since EF Core 3.0 it refuses to silently run that part in memory.",
    causes: [
      "Calling your own C# method or property (not mapped to a column) inside `Where`, `OrderBy` or `Select` before the end.",
      "String functions with options SQL can't express, like `string.Equals(a, b, StringComparison.OrdinalIgnoreCase)`.",
      "Complex `GroupBy` shapes that aren't supported.",
    ],
    fixes: [
      "Rewrite using mapped columns: `o.Customer.FirstName.StartsWith(\"A\")`.",
      "Filter in the database first, then call `.AsEnumerable()` and run the C# logic on the smaller result.",
      "For case-insensitive comparison rely on the database collation or use `EF.Functions.Like`.",
    ],
    lesson: EF,
  },
  {
    slug: "efcore-database-operation-expected-to-affect-1-row", area: "Entity Framework Core",
    title: "Database operation expected to affect 1 row(s) but actually affected 0 row(s)",
    message: "Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException: The database operation was expected to affect 1 row(s), but actually affected 0 row(s); data may have been modified or deleted since entities were loaded.",
    meaning: "EF Core sent an UPDATE or DELETE, but no row matched. Either the row is gone, the key is wrong, or a concurrency token changed.",
    causes: [
      "Someone else updated or deleted the row (with a `rowversion` or `[ConcurrencyCheck]` column this is the intended check).",
      "You called `Update(entity)` with an Id of 0 or an Id that doesn't exist.",
      "An identity key was set by hand on a new entity, so EF treated it as an update.",
      "A trigger with `SET NOCOUNT` missing changed the reported row count.",
    ],
    fixes: [
      "Check the Id you are saving really exists.",
      "For new rows use `Add`, not `Update`.",
      "Handle real conflicts: catch `DbUpdateConcurrencyException`, reload the entry with `entry.Reload()` or show the user the newer values.",
      "Add `SET NOCOUNT ON` at the top of triggers on that table.",
    ],
    lesson: EF,
  },
  {
    slug: "efcore-there-is-already-an-object-named-in-the-database", area: "Entity Framework Core",
    title: "There is already an object named in the database (error 2714 during migration)",
    message: "Microsoft.Data.SqlClient.SqlException: There is already an object named 'Customers' in the database.",
    meaning: "A migration tried to create a table that already exists. The database and the `__EFMigrationsHistory` table disagree about what has been applied.",
    causes: [
      "The tables were created by hand or by `EnsureCreated()`, so no migration history was recorded.",
      "The first migration was regenerated after the database already had the tables.",
      "Two developers created migrations that both create the same table.",
    ],
    fixes: [
      "Never mix `EnsureCreated()` with migrations; use `Database.Migrate()` only.",
      "For an existing database: create a baseline migration, empty its `Up()` body, apply it once, then restore the body (or insert its id into `__EFMigrationsHistory`).",
      "In development, the quick fix is `dotnet ef database drop` then `dotnet ef database update`.",
    ],
    lesson: EF,
  },
  {
    slug: "sql-server-foreign-key-may-cause-cycles-or-multiple-cascade-paths", area: "SQL Server",
    title: "Introducing FOREIGN KEY constraint may cause cycles or multiple cascade paths (error 1785)",
    message: "Introducing FOREIGN KEY constraint 'FK_Reviews_Users_UserId' on table 'Reviews' may cause cycles or multiple cascade paths. Specify ON DELETE NO ACTION or ON UPDATE NO ACTION, or modify other FOREIGN KEY constraints.",
    meaning: "Deleting one parent row could reach the same child table through two different cascade routes. SQL Server doesn't allow that, unlike PostgreSQL.",
    causes: [
      "Example: Users → Products (cascade) → Reviews (cascade), and also Users → Reviews (cascade).",
      "EF Core makes required relationships cascade by default, so this appears during `dotnet ef database update`.",
    ],
    fixes: [
      "Choose one path to stay cascading and set the other to `NO ACTION`.",
      "In EF Core: `.OnDelete(DeleteBehavior.Restrict)` or `NoAction` on one of the relationships, then add a new migration.",
      "Delete the children yourself in code (or a stored procedure) before deleting the parent.",
    ],
    snippet: { lang: "csharp", code: `modelBuilder.Entity<Review>()
    .HasOne(r => r.User).WithMany(u => u.Reviews)
    .OnDelete(DeleteBehavior.NoAction);` },
    lesson: EF,
  },
  {
    slug: "sql-server-invalid-column-name-207", area: "SQL Server",
    title: "Invalid column name (SQL Server error 207)",
    message: "Microsoft.Data.SqlClient.SqlException: Invalid column name 'CreatedOn'.",
    meaning: "The query uses a column that doesn't exist in the table SQL Server is looking at.",
    causes: [
      "A property was added to the EF Core model but no migration was created or applied.",
      "The app points at a different database (old copy, other environment) than you think.",
      "A typo, or a column alias used in `WHERE` (aliases only exist in `ORDER BY`).",
      "Double quotes around a string value with `QUOTED_IDENTIFIER ON` turn the value into a column name.",
    ],
    fixes: [
      "Run `dotnet ef migrations add AddCreatedOn` then `dotnet ef database update`.",
      "Print the connection string at startup in development, and check `SELECT DB_NAME()`.",
      "Use single quotes for strings: `WHERE Status = 'Open'`.",
      "Repeat the expression in `WHERE` or wrap the query in a CTE instead of referencing an alias.",
    ],
    lesson: SQL,
  },
  {
    slug: "sql-server-conversion-failed-when-converting-varchar-to-int-245", area: "SQL Server",
    title: "Conversion failed when converting the varchar value to data type int (error 245)",
    message: "Conversion failed when converting the varchar value 'N/A' to data type int.",
    meaning: "SQL Server had to compare or combine a text value with a number, so it tried to turn the text into an int, and one value wasn't a number.",
    causes: [
      "A varchar column holds mostly numbers but also values like `'N/A'` or `''`.",
      "Comparing a varchar column with an int literal: `WHERE Code = 5` converts every row's `Code` to int.",
      "String concatenation with `+` and a number: `'Order ' + 5`.",
    ],
    fixes: [
      "Use `TRY_CAST(Code AS int)` or `TRY_CONVERT`, which return NULL instead of failing.",
      "Compare text with text: `WHERE Code = '5'` (also lets SQL Server use the index).",
      "Use `CONCAT('Order ', 5)` instead of `+` for mixed types.",
      "Find the bad rows: `SELECT * FROM T WHERE TRY_CAST(Code AS int) IS NULL AND Code IS NOT NULL`.",
    ],
    lesson: SQL,
  },
  {
    slug: "sql-server-arithmetic-overflow-error-converting-expression-to-int-8115", area: "SQL Server",
    title: "Arithmetic overflow error converting expression to data type int (error 8115)",
    message: "Arithmetic overflow error converting expression to data type int.",
    meaning: "The result is bigger than an int can hold (about 2.1 billion), or a value doesn't fit the target decimal precision.",
    causes: [
      "`SUM` or `COUNT` over a large table: `SUM(int column)` returns int and can overflow.",
      "Multiplying two int values, for example quantity times price in cents.",
      "Inserting into a `decimal(5,2)` a value of 1000.00 or more.",
      "An identity column of type int reached 2,147,483,647.",
    ],
    fixes: [
      "Cast before aggregating: `SUM(CAST(Amount AS bigint))`, or use `COUNT_BIG(*)`.",
      "Change the column type to `bigint` or a wider `decimal`.",
      "Check identity headroom: `SELECT IDENT_CURRENT('dbo.Orders')`.",
    ],
    lesson: SQL,
  },
  {
    slug: "sql-server-cannot-open-database-requested-by-the-login-4060", area: "SQL Server",
    title: "Cannot open database requested by the login. The login failed (error 4060)",
    message: "Cannot open database \"Shop\" requested by the login. The login failed. Login failed for user 'DOMAIN\\app'.",
    meaning: "The login itself is valid, but it can't open the database named in the connection string.",
    causes: [
      "The database doesn't exist yet (migrations never ran) or has a different name.",
      "The login has no user in that database.",
      "The database is offline, restoring or in single-user mode.",
      "Running under IIS: the app pool identity (`IIS APPPOOL\\MyPool`) is the login, not your own account.",
    ],
    fixes: [
      "Check `SELECT name, state_desc FROM sys.databases` for the exact name and state.",
      "Create the database with `dotnet ef database update`.",
      "Create a user for the login: `CREATE USER [IIS APPPOOL\\MyPool] FOR LOGIN [IIS APPPOOL\\MyPool];` and add it to the roles it needs.",
    ],
    lesson: SQL,
  },
  {
    slug: "sql-server-column-is-invalid-in-the-select-list-group-by-8120", area: "SQL Server",
    title: "Column is invalid in the select list because it is not contained in either an aggregate function or the GROUP BY clause (8120)",
    message: "Column 'Orders.CustomerName' is invalid in the select list because it is not contained in either an aggregate function or the GROUP BY clause.",
    meaning: "With GROUP BY, each result row stands for a whole group. A column that isn't grouped or aggregated could have many values in that group, so SQL Server can't pick one.",
    causes: [
      "Selecting extra descriptive columns next to `COUNT` or `SUM`.",
      "Code ported from MySQL, which used to allow this and returned an arbitrary value.",
    ],
    fixes: [
      "Add the column to `GROUP BY` if it describes the group.",
      "Or aggregate it: `MAX(CustomerName)`.",
      "Or group in a subquery and join back for the details.",
      "If you need detail rows plus totals, use a window function: `SUM(Total) OVER (PARTITION BY CustomerId)`.",
    ],
    snippet: { lang: "sql", code: `SELECT CustomerId, CustomerName, COUNT(*) AS Orders, SUM(Total) AS Spent
FROM dbo.Orders
GROUP BY CustomerId, CustomerName;` },
    lesson: SQL,
  },
  {
    slug: "sql-server-subquery-returned-more-than-1-value-512", area: "SQL Server",
    title: "Subquery returned more than 1 value (SQL Server error 512)",
    message: "Subquery returned more than 1 value. This is not permitted when the subquery follows =, !=, <, <= , >, >= or when the subquery is used as an expression.",
    meaning: "You used a subquery as if it returns one value, but it returned several rows.",
    causes: [
      "`WHERE Id = (SELECT ...)` where the subquery matches more than one row.",
      "`SET @x = (SELECT ...)` or a scalar subquery in the SELECT list hitting duplicate data.",
      "A trigger written for single-row updates running on a multi-row update.",
    ],
    fixes: [
      "If many values are valid, use `IN (SELECT ...)` or `EXISTS`.",
      "If one value is expected, fix the filter or the duplicate data, or pick one deliberately with `TOP (1) ... ORDER BY`.",
      "Write triggers against the whole `inserted` table with a JOIN, never `SELECT @id = Id FROM inserted`.",
    ],
    lesson: SQL,
  },
  {
    slug: "sql-server-divide-by-zero-error-encountered-8134", area: "SQL Server",
    title: "Divide by zero error encountered (SQL Server error 8134)",
    message: "Divide by zero error encountered.",
    meaning: "A division in your query had zero as the divisor for at least one row.",
    causes: [
      "Ratios such as `Revenue / Visits` when some rows have zero visits.",
      "Percentages over an empty group.",
    ],
    fixes: [
      "Wrap the divisor with `NULLIF`: `Revenue / NULLIF(Visits, 0)` returns NULL instead of failing.",
      "Show 0 instead of NULL if that's the business rule: `ISNULL(Revenue / NULLIF(Visits, 0), 0)`.",
      "Watch integer division too: `1 / 3` is 0 in SQL Server; use `1.0 / 3`.",
    ],
    lesson: SQL,
  },
  {
    slug: "csharp-unable-to-cast-object-of-type", area: "C#",
    title: "Unable to cast object of type to type (InvalidCastException)",
    message: "System.InvalidCastException: Unable to cast object of type 'System.Int64' to type 'System.Int32'.",
    meaning: "The object really is of another type than the cast says. A cast in C# doesn't convert values, it only checks the type.",
    causes: [
      "Reading a database value with the wrong type: `(int)reader[\"Id\"]` when the column is `bigint`, or `(int)` on a `decimal`.",
      "`(int)` on a boxed `long` or `short`: unboxing must use the exact type.",
      "Casting an interface or base type to a class it isn't.",
      "Two copies of the same type loaded from different assemblies (plugins).",
    ],
    fixes: [
      "Match the CLR type to the SQL type (`bigint` → `long`, `decimal` → `decimal`, `bit` → `bool`).",
      "Use `Convert.ToInt32(value)` when you mean to convert.",
      "Check before casting: `if (obj is Order order) { ... }`.",
    ],
    lesson: CS,
  },
  {
    slug: "csharp-input-string-was-not-in-a-correct-format", area: "C#",
    title: "Input string was not in a correct format (FormatException)",
    message: "System.FormatException: Input string was not in a correct format. / The input string 'abc' was not in a correct format.",
    meaning: "`int.Parse`, `decimal.Parse`, `Convert.ToInt32` or `string.Format` got text it can't read as the requested type.",
    causes: [
      "Empty strings, spaces or letters in user input or CSV data.",
      "Culture differences: `1,5` vs `1.5`, or thousands separators.",
      "`string.Format` with a placeholder like `{2}` but only two arguments, or a stray `{` in the format string.",
    ],
    fixes: [
      "Use `int.TryParse(text, out var n)` and handle the false case.",
      "Pass the culture explicitly: `decimal.Parse(text, CultureInfo.InvariantCulture)`.",
      "Escape braces in format strings as `{{` and `}}`, or use string interpolation.",
    ],
    lesson: CS,
  },
  {
    slug: "httpclient-a-task-was-canceled-timeout", area: "C#",
    title: "A task was canceled (HttpClient TaskCanceledException)",
    message: "System.Threading.Tasks.TaskCanceledException: The request was canceled due to the configured HttpClient.Timeout of 100 seconds elapsing. / A task was canceled.",
    meaning: "The HTTP call was stopped before a response arrived, either by the 100-second default timeout or by a cancellation token.",
    causes: [
      "The remote server is slow or not answering.",
      "The caller's request was aborted (browser closed), and `HttpContext.RequestAborted` was passed through.",
      "Socket exhaustion from creating `new HttpClient()` per call.",
      "A deadlock from `.Result` or `.Wait()` on async code in old ASP.NET or UI apps.",
    ],
    fixes: [
      "Check `ex.InnerException is TimeoutException` to tell a timeout from a real cancellation.",
      "Set a sensible timeout per client and add retries with Polly or `AddStandardResilienceHandler()`.",
      "Use `IHttpClientFactory` (`builder.Services.AddHttpClient<MyApi>()`) instead of new clients per call.",
      "Use `await` all the way down; never `.Result`.",
    ],
    lesson: CS,
  },
  {
    slug: "csharp-cs0246-type-or-namespace-name-could-not-be-found", area: "C#",
    title: "CS0246: The type or namespace name could not be found",
    message: "error CS0246: The type or namespace name 'Newtonsoft' could not be found (are you missing a using directive or an assembly reference?)",
    meaning: "The compiler doesn't know the name you used. Either the `using` is missing, the package or project reference is missing, or the target frameworks don't match.",
    causes: [
      "Missing `using` line for the namespace.",
      "The NuGet package isn't installed in this project (only in another one).",
      "A project reference is missing, or it targets a newer framework than the referencing project.",
      "Restore failed, so packages aren't on disk.",
    ],
    fixes: [
      "Add the `using` (Ctrl+. in Visual Studio suggests it).",
      "`dotnet add package Newtonsoft.Json` in the right project folder.",
      "`dotnet add reference ../Shop.Core/Shop.Core.csproj` and align `<TargetFramework>` values.",
      "Run `dotnet restore`, then clean and rebuild; delete `bin` and `obj` if it still fails.",
    ],
    lesson: CS,
  },
  {
    slug: "csharp-cs0029-cannot-implicitly-convert-task-to", area: "C#",
    title: "CS0029: Cannot implicitly convert type 'Task<T>' to 'T'",
    message: "error CS0029: Cannot implicitly convert type 'System.Threading.Tasks.Task<int>' to 'int'",
    meaning: "You called an async method and tried to use its result directly. An async method returns a Task that finishes later; you have to `await` it.",
    causes: [
      "`int count = repo.CountAsync();` without `await`.",
      "The calling method isn't `async`, so `await` isn't available.",
    ],
    fixes: [
      "Add `await` and make the caller `async Task` (or `async Task<T>`).",
      "Keep async all the way up to the controller or `Main` (`static async Task Main`).",
      "Avoid `.Result` as a quick fix; it can deadlock and hides exceptions in an AggregateException.",
    ],
    snippet: { lang: "csharp", code: `public async Task<IActionResult> Index()
{
    int count = await _repo.CountAsync();
    return View(count);
}` },
    lesson: CS,
  },
  {
    slug: "docker-no-space-left-on-device", area: "Docker",
    title: "Docker: no space left on device",
    message: "failed to register layer: write /usr/share/...: no space left on device / Error response from daemon: no space left on device",
    meaning: "The disk (or the Docker Desktop virtual disk) that holds images, containers and volumes is full.",
    causes: [
      "Old images and build cache pile up after many builds.",
      "Stopped containers and unused volumes are never removed.",
      "Container logs grow without a limit.",
      "Docker Desktop's virtual disk size limit is reached even though the host has space.",
    ],
    fixes: [
      "See what uses space: `docker system df`.",
      "Remove unused data: `docker system prune -a` (add `--volumes` only if you don't need unused volumes).",
      "Clear build cache: `docker builder prune`.",
      "Limit logs in daemon.json: `\"log-opts\": { \"max-size\": \"10m\", \"max-file\": \"3\" }`.",
      "Docker Desktop: Settings → Resources → raise the disk image size.",
    ],
    lesson: { href: "/courses/docker/lessons/common-docker-errors-and-how-to-fix-them", title: "Common Docker errors and how to fix them" },
  },
  {
    slug: "git-your-local-changes-would-be-overwritten-by-merge", area: "Git",
    title: "Your local changes to the following files would be overwritten by merge",
    message: "error: Your local changes to the following files would be overwritten by merge: appsettings.json Please commit your changes or stash them before you merge. Aborting",
    meaning: "`git pull` or `git merge` wants to change files you edited but haven't committed. Git stops so it doesn't throw away your work.",
    causes: [
      "You edited a file that also changed on the remote branch.",
      "A local config file (appsettings, .env) is tracked by Git and you changed it for your machine.",
    ],
    fixes: [
      "Keep your changes: `git stash`, then `git pull`, then `git stash pop` and resolve any conflicts.",
      "Or commit first: `git commit -am \"WIP\"` then `git pull`.",
      "Throw them away (careful): `git restore appsettings.json`.",
      "For machine-specific settings, use `appsettings.Development.json` or user secrets and keep them out of Git.",
    ],
    lesson: { href: "/courses/git", title: "Git course" },
  },
  {
    slug: "javascript-cannot-read-properties-of-undefined", area: "JavaScript",
    title: "TypeError: Cannot read properties of undefined (reading 'x')",
    message: "Uncaught TypeError: Cannot read properties of undefined (reading 'map')",
    meaning: "You accessed a property on something that is `undefined`. The name in brackets is the property you tried to read; the thing before the dot is the one that's undefined.",
    causes: [
      "Data from an API hasn't arrived yet when the code runs (common in React on the first render).",
      "The API returned a different shape, for example `{ data: { items } }` instead of `{ items }`.",
      "A typo in a property name, or a function that forgot to `return`.",
    ],
    fixes: [
      "Use optional chaining and defaults: `(data?.items ?? []).map(...)`.",
      "Initialise state with the right empty shape: `useState([])` instead of `useState()`.",
      "Log the actual value (`console.log(JSON.stringify(data))`) and match your code to its real shape.",
    ],
    lesson: { href: "/courses/javascript", title: "JavaScript course" },
  },
  {
    slug: "react-too-many-re-renders", area: "React",
    title: "Too many re-renders. React limits the number of renders to prevent an infinite loop",
    message: "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.",
    meaning: "A component sets state while rendering. Each state change triggers another render, which sets state again, forever.",
    causes: [
      "Calling a handler instead of passing it: `onClick={setOpen(true)}`.",
      "Calling `setState` directly in the component body.",
      "Deriving state from props by setting state on every render.",
    ],
    fixes: [
      "Pass a function: `onClick={() => setOpen(true)}`.",
      "Move side effects into `useEffect` with the right dependency array.",
      "Don't store derived values in state; compute them during render (`const total = items.length`).",
    ],
    lesson: { href: "/courses/react", title: "React course" },
  },
];
