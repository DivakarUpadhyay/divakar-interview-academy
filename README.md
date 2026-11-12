# DevLadder

**Free step-by-step tutorials and interview questions for developers: https://devladder.pages.dev**

DevLadder is a free learning site I built after nine years of working as a .NET developer. Every course starts simple and
climbs one step at a time, with short lessons, real examples, the interview questions that actually come up, and a
one-page cheat sheet.

- **61 courses**: computer fundamentals, DSA and system design, C# and .NET, ASP.NET Core, Entity Framework, SQL Server,
  Azure, Docker and Kubernetes, React, Angular and Vue, automation and Web3
- **1,176 interview questions** with short answers, the important ones marked
- **Free developer tools**: [JSON formatter](https://devladder.pages.dev/tools/json-formatter),
  [SQL formatter](https://devladder.pages.dev/tools/sql-formatter), [regex tester](https://devladder.pages.dev/tools/regex-tester),
  [GUID generator](https://devladder.pages.dev/tools/guid-generator), [Base64](https://devladder.pages.dev/tools/base64),
  [JWT decoder](https://devladder.pages.dev/tools/jwt-decoder)
- **[Error fixes](https://devladder.pages.dev/errors)** for common SQL Server, EF Core, ASP.NET Core and Docker errors

## Popular courses

[C#](https://devladder.pages.dev/courses/csharp) ·
[ASP.NET Core Web API](https://devladder.pages.dev/courses/aspnet-core-webapi) ·
[Entity Framework Core](https://devladder.pages.dev/courses/efcore) ·
[SQL Server](https://devladder.pages.dev/courses/sqlserver) ·
[System design](https://devladder.pages.dev/courses/system-design) ·
[Docker](https://devladder.pages.dev/courses/docker) ·
[.NET interview questions](https://devladder.pages.dev/interview-questions)

## How the site is built

Next.js (static export) with content written in Markdown (`content/courses/*.md`) and compiled into SQLite at build time
(`scripts/build-db.mjs`), hosted on Cloudflare Pages. `npm run dev` runs it locally.

Built by Divakar Upadhyay. Feedback and corrections are welcome through the [contact page](https://devladder.pages.dev/contact).
