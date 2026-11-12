// "Fix this error" pages: one page per exact error message developers paste into Google.
// Text uses `backticks` for code; ErrorPage renders them as <code>. `snippet` is an optional code block.
export type ErrorFix = {
  slug: string; area: "SQL Server" | "ASP.NET Core" | "Entity Framework Core" | "C#" | "Docker" | "Node.js";
  title: string; message: string; meaning: string; causes: string[]; fixes: string[];
  snippet?: { lang: string; code: string }; lesson?: { href: string; title: string };
};

export const ERRORS: ErrorFix[] = [
  {
    slug: "sql-server-network-related-or-instance-specific-error", area: "SQL Server",
    title: "A network-related or instance-specific error occurred while establishing a connection to SQL Server",
    message: "A network-related or instance-specific error occurred while establishing a connection to SQL Server. The server was not found or was not accessible. (provider: Named Pipes Provider, error: 40) / (provider: SQL Network Interfaces, error: 26)",
    meaning: "Your app never reached SQL Server at all. This is a connection problem (wrong address, service not running, port blocked), not a login problem.",
    causes: [
      "The server name in the connection string is wrong, for example `localhost` when SQL Server is a named instance like `localhost\\SQLEXPRESS`.",
      "The SQL Server service (or SQL Server Browser, needed for named instances) is not running.",
      "TCP/IP is disabled in SQL Server Configuration Manager.",
      "A firewall blocks port 1433, or the server only accepts local connections.",
      "Inside Docker, `localhost` points at the container itself, not the database container.",
    ],
    fixes: [
      "Check the exact server name with `SELECT @@SERVERNAME` in SSMS and copy it into the connection string.",
      "Start the services: `services.msc` → SQL Server (MSSQLSERVER or SQLEXPRESS) and SQL Server Browser.",
      "Enable TCP/IP in SQL Server Configuration Manager → Network Configuration, then restart the service.",
      "Allow inbound TCP 1433 in Windows Firewall, or connect with an explicit port: `Server=myhost,1433`.",
      "In Docker Compose use the service name: `Server=sql,1433`.",
    ],
    snippet: { lang: "json", code: `"ConnectionStrings": {
  "Default": "Server=localhost\\\\SQLEXPRESS;Database=Shop;Trusted_Connection=True;TrustServerCertificate=True"
}` },
    lesson: { href: "/courses/sqlserver", title: "SQL Server and T-SQL course" },
  },
  {
    slug: "sql-server-login-failed-for-user-18456", area: "SQL Server",
    title: "Login failed for user (SQL Server error 18456)",
    message: "Login failed for user 'sa'. (Microsoft SQL Server, Error: 18456)",
    meaning: "The app reached SQL Server, but the server rejected the login. The real reason is hidden from the client on purpose; it is written to the SQL Server error log as a \"State\" number.",
    causes: [
      "Wrong user name or password (State 8).",
      "SQL Server authentication is turned off, so only Windows logins work (State 58).",
      "The login has no access to the database in the connection string (State 38 or 40).",
      "The login is disabled or the password has expired.",
    ],
    fixes: [
      "Open SSMS → Management → SQL Server Logs and find the 18456 entry; its State number tells you the exact cause.",
      "To allow SQL logins: server Properties → Security → \"SQL Server and Windows Authentication mode\", then restart the service.",
      "Map the login to the database: `CREATE USER [shop_app] FOR LOGIN [shop_app]; ALTER ROLE db_datareader ADD MEMBER [shop_app];`",
      "Avoid using `sa` in applications. Create a dedicated login with only the permissions the app needs.",
    ],
    lesson: { href: "/courses/sqlserver", title: "SQL Server and T-SQL course" },
  },
  {
    slug: "sql-server-transaction-was-deadlocked-1205", area: "SQL Server",
    title: "Transaction was deadlocked on lock resources (SQL Server error 1205)",
    message: "Transaction (Process ID 64) was deadlocked on lock resources with another process and has been chosen as the deadlock victim. Rerun the transaction.",
    meaning: "Two transactions each held a lock the other needed, so SQL Server cancelled one of them (the \"victim\") to break the cycle. Your query was the one cancelled.",
    causes: [
      "Two code paths update the same tables in a different order.",
      "Long transactions that hold locks while doing slow work (HTTP calls, user input).",
      "Missing indexes, so updates scan and lock far more rows than they need.",
    ],
    fixes: [
      "Retry the transaction: deadlocks are expected occasionally, and error 1205 is safe to retry.",
      "Access tables in the same order everywhere (for example, always Orders before OrderLines).",
      "Keep transactions short and add indexes on the columns used in `WHERE` and `JOIN` of the updates.",
      "Find the cause with the built-in `system_health` Extended Events session, which records every deadlock graph.",
      "Consider `READ_COMMITTED_SNAPSHOT ON` so readers no longer block writers.",
    ],
    snippet: { lang: "csharp", code: `// EF Core: retry transient failures, including deadlocks
options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(
    maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(2), errorNumbersToAdd: null));` },
    lesson: { href: "/courses/sqlserver/lessons/transactions-isolation-levels-and-locking", title: "Transactions, isolation levels and locking" },
  },
  {
    slug: "sql-server-insert-statement-conflicted-with-foreign-key-547", area: "SQL Server",
    title: "The INSERT statement conflicted with the FOREIGN KEY constraint (error 547)",
    message: "The INSERT statement conflicted with the FOREIGN KEY constraint \"FK_Orders_Customers\". The conflict occurred in database \"Shop\", table \"dbo.Customers\", column 'Id'.",
    meaning: "You tried to save a row that points to a parent row that doesn't exist, for example an order for a customer ID that isn't in the Customers table.",
    causes: [
      "The parent ID is wrong, 0 or a default value because it was never set.",
      "Rows are inserted in the wrong order: child before parent.",
      "The parent was deleted, or lives in a different database or environment.",
    ],
    fixes: [
      "Check the value being inserted: `SELECT * FROM dbo.Customers WHERE Id = @CustomerId`.",
      "Insert the parent first, then the child, inside one transaction.",
      "In EF Core, set the navigation property (`order.Customer = customer`) or make sure the foreign key property holds the real ID before `SaveChanges`.",
      "For DELETE or UPDATE versions of this error, remove or update the child rows first, or use `ON DELETE CASCADE` if that is truly the business rule.",
    ],
    lesson: { href: "/courses/sqlserver", title: "SQL Server and T-SQL course" },
  },
  {
    slug: "sqlclient-execution-timeout-expired", area: "SQL Server",
    title: "Execution Timeout Expired (SqlException, error -2)",
    message: "Execution Timeout Expired. The timeout period elapsed prior to completion of the operation or the server is not responding.",
    meaning: "The query ran longer than the command timeout (30 seconds by default) and the client gave up. The query itself is usually slow or blocked.",
    causes: [
      "A slow query: missing index, scanning a big table, or a bad execution plan (parameter sniffing).",
      "The query is blocked, waiting for locks held by another transaction.",
      "A report or batch job that genuinely needs more than 30 seconds.",
    ],
    fixes: [
      "Run the query in SSMS with \"Include Actual Execution Plan\" and look for scans and missing-index hints.",
      "Check blocking while it runs: `SELECT session_id, blocking_session_id, wait_type FROM sys.dm_exec_requests WHERE blocking_session_id <> 0`.",
      "Fix the query or index first. Only then raise the timeout, and only for the jobs that need it.",
    ],
    snippet: { lang: "csharp", code: `// Raise the timeout for one long-running command only
cmd.CommandTimeout = 120;                                        // ADO.NET
await connection.QueryAsync<Report>(sql, commandTimeout: 120);  // Dapper
context.Database.SetCommandTimeout(TimeSpan.FromMinutes(2));     // EF Core` },
    lesson: { href: "/courses/sqlserver", title: "SQL Server and T-SQL course" },
  },
  {
    slug: "sqlclient-certificate-chain-not-trusted", area: "SQL Server",
    title: "The certificate chain was issued by an authority that is not trusted",
    message: "A connection was successfully established with the server, but then an error occurred during the login process. (provider: SSL Provider, error: 0 - The certificate chain was issued by an authority that is not trusted.)",
    meaning: "Since Microsoft.Data.SqlClient 4.0 (used by EF Core 7 and later), connections are encrypted by default, so the client now checks the server's certificate. Local and development SQL Servers usually use a self-signed certificate the client doesn't trust.",
    causes: [
      "Upgrading to Microsoft.Data.SqlClient 4+ or EF Core 7+ against a server with a self-signed certificate.",
      "The server certificate's name doesn't match the server name in the connection string.",
    ],
    fixes: [
      "Development: add `TrustServerCertificate=True` to the connection string.",
      "Production: install a certificate from a trusted authority on SQL Server and keep certificate validation on.",
      "If the network is already secured another way, `Encrypt=False` restores the old behaviour, but only do this deliberately.",
    ],
    lesson: { href: "/courses/efcore", title: "Entity Framework Core course" },
  },
  {
    slug: "efcore-second-operation-started-on-this-context", area: "Entity Framework Core",
    title: "A second operation was started on this context instance before a previous operation completed",
    message: "System.InvalidOperationException: A second operation was started on this context instance before a previous operation completed. This is usually caused by different threads concurrently using the same instance of DbContext.",
    meaning: "A DbContext is not thread-safe, and two queries ran on the same instance at the same time.",
    causes: [
      "A missing `await`, so the next query starts before the first one finished.",
      "Running queries in parallel with `Task.WhenAll` on one context.",
      "Registering DbContext as a singleton, or capturing it in a background service.",
    ],
    fixes: [
      "Await every async EF Core call before starting the next one.",
      "For parallel work, give each task its own context with `IDbContextFactory<T>`.",
      "Keep the default scoped lifetime (`AddDbContext`), and in hosted services create a scope with `IServiceScopeFactory`.",
    ],
    snippet: { lang: "csharp", code: `builder.Services.AddDbContextFactory<ShopDbContext>(o => o.UseSqlServer(cs));

// later, one context per parallel task
await Task.WhenAll(ids.Select(async id =>
{
    await using var db = await factory.CreateDbContextAsync();
    return await db.Orders.FindAsync(id);
}));` },
    lesson: { href: "/courses/efcore", title: "Entity Framework Core course" },
  },
  {
    slug: "aspnet-core-unable-to-resolve-service-for-type", area: "ASP.NET Core",
    title: "Unable to resolve service for type while attempting to activate",
    message: "System.InvalidOperationException: Unable to resolve service for type 'Shop.Services.IOrderService' while attempting to activate 'Shop.Controllers.OrdersController'.",
    meaning: "A class asked for a dependency in its constructor, but that type was never registered with the dependency injection container.",
    causes: [
      "The service was never added in `Program.cs`.",
      "The interface was registered but the constructor asks for the concrete class (or the other way round).",
      "The registration lives in a library extension method that `Program.cs` never calls.",
    ],
    fixes: [
      "Register it: `builder.Services.AddScoped<IOrderService, OrderService>();`",
      "Make the constructor ask for exactly the type you registered.",
      "Call the library's extension method, for example `builder.Services.AddShopServices();`",
    ],
    lesson: { href: "/courses/dotnet-platform", title: "Modern .NET: hosting, config and DI course" },
  },
  {
    slug: "aspnet-core-http-error-500-30-app-failed-to-start", area: "ASP.NET Core",
    title: "HTTP Error 500.30: ASP.NET Core app failed to start",
    message: "HTTP Error 500.30 - ASP.NET Core app failed to start. Common solutions to this issue: The app failed to start. The app started but then stopped.",
    meaning: "IIS (or Azure App Service on Windows) launched your app, but it crashed during startup. The real exception is in the app's logs, not on this page.",
    causes: [
      "An exception in `Program.cs` at startup: a bad connection string, a missing configuration value, a failed migration.",
      "The matching .NET runtime or ASP.NET Core Hosting Bundle is not installed on the server.",
      "File permissions: the app pool identity can't read the folder or write logs.",
    ],
    fixes: [
      "Run the app from the publish folder in a terminal (`dotnet Shop.Api.dll`): the exception appears immediately.",
      "Turn on stdout logging in `web.config` (`stdoutLogEnabled=\"true\"`) and read the file in `logs/`; switch it off afterwards.",
      "Check Windows Event Viewer → Application for \"IIS AspNetCore Module V2\" entries.",
      "Install the Hosting Bundle for the exact runtime version, then run `iisreset`.",
    ],
    lesson: { href: "/courses/iis", title: "IIS and hosting .NET apps course" },
  },
  {
    slug: "cors-no-access-control-allow-origin-header", area: "ASP.NET Core",
    title: "No 'Access-Control-Allow-Origin' header is present on the requested resource (CORS)",
    message: "Access to fetch at 'https://api.example.com/orders' from origin 'http://localhost:4200' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
    meaning: "The browser blocked your front end from reading the API response because the API didn't say that this origin is allowed. Postman works because only browsers enforce CORS.",
    causes: [
      "No CORS policy is configured in the API.",
      "`UseCors` is in the wrong place in the middleware order.",
      "The allowed origin doesn't match exactly: scheme, host and port must all match, with no trailing slash.",
      "The request failed with a 500 before the CORS headers were added, which shows up as a CORS error.",
    ],
    fixes: [
      "Add a named policy with the exact front-end origin and apply it.",
      "Call `app.UseCors()` after `UseRouting` and before `UseAuthorization` and the endpoint mappings.",
      "Check the Network tab: if the real status is 500, fix that error first.",
    ],
    snippet: { lang: "csharp", code: `builder.Services.AddCors(o => o.AddPolicy("web", p => p
    .WithOrigins("http://localhost:4200", "https://app.example.com")
    .AllowAnyHeader()
    .AllowAnyMethod()));

app.UseRouting();
app.UseCors("web");
app.UseAuthorization();
app.MapControllers();` },
    lesson: { href: "/courses/aspnet-core-webapi", title: "ASP.NET Core Web API course" },
  },
  {
    slug: "csharp-object-reference-not-set-to-an-instance-of-an-object", area: "C#",
    title: "Object reference not set to an instance of an object (NullReferenceException)",
    message: "System.NullReferenceException: Object reference not set to an instance of an object.",
    meaning: "Code used a member (property, method, index) of a variable that was `null` at that moment.",
    causes: [
      "A query or lookup returned nothing (`FirstOrDefault`, `Find`, a dictionary miss) and the result was used directly.",
      "An object or collection property was never initialised.",
      "A dependency or configuration value was not set.",
    ],
    fixes: [
      "Read the stack trace: the top line in your own code shows the exact method and line.",
      "Check the result before using it, or return a clear error: `var order = await db.Orders.FindAsync(id) ?? throw new NotFoundException(id);`",
      "Initialise collections where they are declared: `public List<OrderLine> Lines { get; } = [];`",
      "Turn on nullable reference types (`<Nullable>enable</Nullable>`) so the compiler warns you before it happens.",
    ],
    lesson: { href: "/courses/csharp", title: "C# course" },
  },
  {
    slug: "csharp-collection-was-modified-enumeration-operation-may-not-execute", area: "C#",
    title: "Collection was modified; enumeration operation may not execute",
    message: "System.InvalidOperationException: Collection was modified; enumeration operation may not execute.",
    meaning: "You added or removed items from a list (or dictionary) while a `foreach` loop was going through it.",
    causes: [
      "Calling `list.Remove(item)` or `list.Add(...)` inside `foreach (var item in list)`.",
      "Another thread changing the collection while it is being enumerated.",
    ],
    fixes: [
      "Remove items without a loop: `list.RemoveAll(x => x.IsExpired);`",
      "Or loop over a copy: `foreach (var item in list.ToList()) { ... }`",
      "Or loop backwards with an index when removing.",
      "For collections shared between threads, use `ConcurrentDictionary` or a lock.",
    ],
    lesson: { href: "/courses/csharp", title: "C# course" },
  },
  {
    slug: "docker-container-exited-with-code-137", area: "Docker",
    title: "Docker container exited with code 137",
    message: "api exited with code 137",
    meaning: "137 means the process was killed with SIGKILL (128 + 9). Nothing in your code caught it because SIGKILL can't be caught.",
    causes: [
      "The container ran out of memory and was killed (`docker inspect` shows `\"OOMKilled\": true`).",
      "`docker stop` timed out waiting for the app to shut down and then killed it.",
      "The host itself ran out of memory.",
    ],
    fixes: [
      "Confirm with `docker inspect api --format '{{.State.OOMKilled}}'`.",
      "Give it more memory (`--memory 1g` or `deploy.resources.limits.memory` in Compose) or find the leak with `dotnet-counters`.",
      "If it happens on stop, lengthen the grace period: `docker stop -t 40` or `stop_grace_period: 40s`.",
    ],
    lesson: { href: "/courses/docker/lessons/common-docker-errors-and-how-to-fix-them", title: "Common Docker errors and how to fix them" },
  },
  {
    slug: "docker-port-is-already-allocated", area: "Docker",
    title: "Bind for 0.0.0.0:8080 failed: port is already allocated",
    message: "Error response from daemon: driver failed programming external connectivity on endpoint api: Bind for 0.0.0.0:8080 failed: port is already allocated",
    meaning: "Something on your machine is already using that host port, so Docker can't publish the container on it.",
    causes: [
      "Another container (often an old copy of the same one) publishes the same port.",
      "A local app, such as IIS, a dev server or SQL Server, listens on that port.",
    ],
    fixes: [
      "Find containers using it: `docker ps --filter publish=8080`, then `docker stop` the old one.",
      "Find local processes: `netstat -ano | findstr :8080` on Windows or `lsof -i :8080` on macOS/Linux.",
      "Or publish on a different host port: `-p 8081:8080`.",
    ],
    lesson: { href: "/courses/docker/lessons/common-docker-errors-and-how-to-fix-them", title: "Common Docker errors and how to fix them" },
  },
  {
    slug: "sql-server-violation-of-primary-key-constraint-2627", area: "SQL Server",
    title: "Violation of PRIMARY KEY constraint: cannot insert duplicate key (error 2627)",
    message: "Violation of PRIMARY KEY constraint 'PK_Customers'. Cannot insert duplicate key in object 'dbo.Customers'. The duplicate key value is (42).",
    meaning: "You tried to insert a row whose primary key (or unique key, error 2601) already exists. SQL Server even tells you the duplicate value at the end of the message.",
    causes: [
      "The app generates its own IDs and produced one that already exists.",
      "The same record is saved twice, for example a double-clicked Save button or a retried request.",
      "Data imports or seed scripts that run more than once.",
    ],
    fixes: [
      "Let the database create keys: an `IDENTITY` column, a sequence, or `NEWSEQUENTIALID()`.",
      "Make inserts safe to repeat: check first, or use `MERGE` / `INSERT ... WHERE NOT EXISTS`.",
      "Disable the Save button while a request is running, and handle error 2627 as \"already exists\" in the API.",
    ],
    snippet: { lang: "sql", code: `INSERT INTO dbo.Customers (Id, Name)
SELECT @Id, @Name
WHERE NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE Id = @Id);` },
    lesson: { href: "/courses/sqlserver", title: "SQL Server and T-SQL course" },
  },
  {
    slug: "sql-server-cannot-insert-explicit-value-for-identity-column", area: "SQL Server",
    title: "Cannot insert explicit value for identity column when IDENTITY_INSERT is set to OFF",
    message: "Cannot insert explicit value for identity column in table 'Orders' when IDENTITY_INSERT is set to OFF.",
    meaning: "The column is an `IDENTITY` column, so SQL Server creates its values. Your insert also tried to set that column yourself.",
    causes: [
      "An `INSERT` that lists the identity column, often copied from a `SELECT *` script.",
      "EF Core sending a non-zero key value for a new entity.",
      "Copying rows between databases and keeping the original IDs.",
    ],
    fixes: [
      "Leave the identity column out of the column list and let SQL Server number the row.",
      "In EF Core, leave the key at 0 (default) for new entities.",
      "If you really need to keep the original IDs (a one-off migration), wrap the insert in `SET IDENTITY_INSERT dbo.Orders ON` / `OFF` and list the columns explicitly.",
    ],
    snippet: { lang: "sql", code: `SET IDENTITY_INSERT dbo.Orders ON;
INSERT INTO dbo.Orders (Id, CustomerId, Total) SELECT Id, CustomerId, Total FROM Staging.Orders;
SET IDENTITY_INSERT dbo.Orders OFF;` },
    lesson: { href: "/courses/sqlserver", title: "SQL Server and T-SQL course" },
  },
  {
    slug: "sql-server-string-or-binary-data-would-be-truncated", area: "SQL Server",
    title: "String or binary data would be truncated (error 8152 / 2628)",
    message: "String or binary data would be truncated in table 'Shop.dbo.Customers', column 'Phone'. Truncated value: '+886-912-345'.",
    meaning: "A value is longer than the column allows, for example 20 characters going into `VARCHAR(15)`. Newer SQL Server versions (error 2628) name the table, column and value; older ones (8152) don't.",
    causes: [
      "The column is too small for real data (names, addresses, phone numbers with country codes).",
      "Unicode text going into a column sized for fewer characters than expected.",
      "An import file with extra spaces or a different format than planned.",
    ],
    fixes: [
      "Read the column name in the 2628 message and check the longest value you need to store.",
      "Widen the column: `ALTER TABLE dbo.Customers ALTER COLUMN Phone NVARCHAR(30) NULL;`",
      "Validate the length in the app (`[MaxLength(30)]` / `HasMaxLength(30)` in EF Core) so users get a clear message.",
      "On SQL Server 2017 or 2016 SP2, turn on trace flag 460 to get the detailed 2628 message.",
    ],
    lesson: { href: "/courses/sqlserver", title: "SQL Server and T-SQL course" },
  },
  {
    slug: "efcore-no-database-provider-has-been-configured", area: "Entity Framework Core",
    title: "No database provider has been configured for this DbContext",
    message: "System.InvalidOperationException: No database provider has been configured for this DbContext. A provider can be configured by overriding the 'DbContext.OnConfiguring' method or by using 'AddDbContext' on the application service provider.",
    meaning: "EF Core doesn't know which database to use (SQL Server, PostgreSQL…) for this context instance.",
    causes: [
      "The context was created with `new ShopDbContext()` instead of being injected.",
      "`AddDbContext` was called without `UseSqlServer(...)`.",
      "The DbContext has no constructor taking `DbContextOptions<ShopDbContext>`, so the configured options never reach it.",
    ],
    fixes: [
      "Register it with a provider: `builder.Services.AddDbContext<ShopDbContext>(o => o.UseSqlServer(cs));`",
      "Add the constructor: `public ShopDbContext(DbContextOptions<ShopDbContext> options) : base(options) { }`",
      "Inject the context through the constructor instead of creating it with `new`.",
    ],
    lesson: { href: "/courses/efcore", title: "Entity Framework Core course" },
  },
  {
    slug: "efcore-unable-to-create-an-object-of-type-dbcontext", area: "Entity Framework Core",
    title: "Unable to create an object of type 'DbContext' (dotnet ef migrations)",
    message: "Unable to create an object of type 'ShopDbContext'. For the different patterns supported at design time, see https://go.microsoft.com/fwlink/?linkid=851728",
    meaning: "`dotnet ef` couldn't build your DbContext at design time (when adding a migration), usually because it couldn't start the app or find the connection string.",
    causes: [
      "The command runs against the wrong project: the context is in a class library and the startup project isn't set.",
      "The app throws during startup (missing configuration, a service that needs a real connection).",
      "There's no way to construct the context outside the running app.",
    ],
    fixes: [
      "Point the tool at both projects: `dotnet ef migrations add Init --project src/Shop.Data --startup-project src/Shop.Api`",
      "Add `--verbose` to see the real startup exception.",
      "Add a design-time factory so the tools can create the context without starting the app.",
    ],
    snippet: { lang: "csharp", code: `public class ShopDbContextFactory : IDesignTimeDbContextFactory<ShopDbContext>
{
    public ShopDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<ShopDbContext>()
            .UseSqlServer("Server=localhost;Database=Shop;Trusted_Connection=True;TrustServerCertificate=True")
            .Options);
}` },
    lesson: { href: "/courses/efcore", title: "Entity Framework Core course" },
  },
  {
    slug: "system-text-json-value-could-not-be-converted", area: "ASP.NET Core",
    title: "The JSON value could not be converted to System.Int32 (or DateTime, Guid…)",
    message: "System.Text.Json.JsonException: The JSON value could not be converted to System.Int32. Path: $.quantity | LineNumber: 0 | BytePositionInLine: 18.",
    meaning: "The JSON sent to your API has a value of the wrong type for that property, for example `\"2\"` (a string) where the C# property is an `int`. The `Path` tells you which property.",
    causes: [
      "Numbers sent as strings (`\"quantity\": \"2\"`), common from JavaScript forms.",
      "Dates in a format System.Text.Json doesn't parse, or `null` for a non-nullable property.",
      "Enums sent as names when the API expects numbers (or the other way round).",
    ],
    fixes: [
      "Fix the client to send the right type, guided by the `Path` in the message.",
      "Allow numbers in strings: `JsonNumberHandling.AllowReadingFromString`.",
      "Accept enum names with `JsonStringEnumConverter`, and make properties nullable (`int?`) where `null` is valid.",
    ],
    snippet: { lang: "csharp", code: `builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});` },
    lesson: { href: "/courses/aspnet-core-webapi", title: "ASP.NET Core Web API course" },
  },
  {
    slug: "docker-cannot-connect-to-the-docker-daemon", area: "Docker",
    title: "Cannot connect to the Docker daemon. Is the docker daemon running?",
    message: "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?",
    meaning: "The `docker` command works, but the Docker engine it talks to isn't running, or your user isn't allowed to reach it.",
    causes: [
      "Docker Desktop isn't started (Windows and macOS).",
      "On Linux, the docker service is stopped.",
      "On Linux, your user isn't in the `docker` group.",
      "WSL 2 integration isn't enabled for your distro in Docker Desktop.",
    ],
    fixes: [
      "Start Docker Desktop and wait until it says it's running.",
      "Linux: `sudo systemctl start docker` (and `sudo systemctl enable docker` to start it on boot).",
      "Linux: `sudo usermod -aG docker $USER`, then log out and back in.",
      "Docker Desktop → Settings → Resources → WSL integration → enable your distro.",
    ],
    lesson: { href: "/courses/docker", title: "Docker course" },
  },
  {
    slug: "npm-err-eresolve-unable-to-resolve-dependency-tree", area: "Node.js",
    title: "npm ERR! ERESOLVE unable to resolve dependency tree",
    message: "npm ERR! code ERESOLVE\nnpm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! Could not resolve dependency: peer react@\"^17.0.0\" from some-library@2.1.0",
    meaning: "A package says it only works with a different version of another package (a \"peer dependency\") than the one in your project, and npm 7+ refuses to guess.",
    causes: [
      "Upgrading React or Angular before a library supports the new version.",
      "An old library that was never updated for current framework versions.",
    ],
    fixes: [
      "Read which package and version it wants, then upgrade that library to a version that supports yours.",
      "If you've checked it works anyway: `npm install --legacy-peer-deps` (the npm 6 behaviour).",
      "Avoid `--force`, which can install versions that really are incompatible.",
      "Commit `package-lock.json` so everyone on the team gets the same versions.",
    ],
    lesson: { href: "/courses/nodejs", title: "Node.js course" },
  },
];

export const errorBySlug = (slug: string) => ERRORS.find((e) => e.slug === slug);
