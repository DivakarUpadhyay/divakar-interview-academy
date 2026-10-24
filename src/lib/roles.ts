// Role-based interview question banks: each role pulls the questions of its courses, in this order (basics → advanced).
export type Role = { slug: string; title: string; icon: string; color: string; summary: string; courses: string[] };

export const ROLES: Role[] = [
  {
    slug: "dotnet-full-stack", title: ".NET Full Stack Developer", icon: "FS", color: "#512bd4",
    summary: "The most common .NET job title: C# + ASP.NET Core Web API + EF Core + SQL Server + Angular/React + Azure, plus end-to-end and system-design rounds.",
    courses: ["dotnet-fullstack-interview", "csharp", "dotnet-internals", "oop", "solid", "design-patterns", "adonet", "linq", "efcore", "dapper",
      "dotnet-platform", "aspnet-core-mvc", "aspnet-core-webapi", "exception-handling", "logging", "project-architecture", "microservices",
      "sqlserver", "sqlserver-internals", "html-css", "javascript", "typescript", "nodejs", "angular", "react", "nextjs", "networking-hosting",
      "iis", "git", "docker", "azure-devops", "azure", "azure-databases", "clean-code", "system-design", "dsa", "coding-practice"],
  },
  {
    slug: "dotnet-backend", title: "Backend .NET / Web API Developer", icon: "BE", color: "#1971c2",
    summary: "Server-side only: C#, the runtime, data access, Web API, microservices, SQL Server and testing.",
    courses: ["csharp", "dotnet-internals", "oop", "solid", "design-patterns", "adonet", "linq", "efcore", "dapper", "dotnet-platform",
      "aspnet-core-webapi", "exception-handling", "logging", "project-architecture", "microservices", "sqlserver", "sqlserver-internals",
      "system-design", "clean-code", "dsa", "coding-practice"],
  },
  {
    slug: "dotnet-legacy", title: ".NET Framework / Legacy App Developer", icon: "4.8", color: "#6c757d",
    summary: "Maintaining and migrating .NET Framework apps: VB.NET, Web Forms, MVC 5, ADO.NET, EF6, error handling, logging and custom controls.",
    courses: ["vbnet", "csharp", "dotnet-internals", "aspnet-webforms", "aspnet-mvc5", "adonet", "efcore", "exception-handling", "logging",
      "custom-controls", "iis", "sqlserver", "project-architecture"],
  },
  {
    slug: "fundamentals", title: "Fundamentals: DSA, System Design & LLD", icon: "CS", color: "#495057",
    summary: "The rounds every product company runs: computer fundamentals, data structures and algorithms, coding round, system design (HLD) and low-level design.",
    courses: ["computer-fundamentals", "dsa", "coding-practice", "networking-hosting", "system-design", "lld"],
  },
  {
    slug: "frontend", title: "Frontend Developer", icon: "FE", color: "#f59f00",
    summary: "HTML, CSS, JavaScript and TypeScript fundamentals, then Angular, React, Vue and legacy jQuery/AngularJS.",
    courses: ["html-css", "javascript", "typescript", "nodejs", "angular", "react", "nextjs", "vue", "jquery", "angularjs", "git"],
  },
  {
    slug: "nodejs-full-stack", title: "Node.js / MERN-MEAN Full Stack Developer", icon: "JS", color: "#3c873a",
    summary: "JavaScript/TypeScript end to end: Node.js and Express APIs, Next.js, React or Angular, SQL Server or NoSQL, and cloud deployment.",
    courses: ["javascript", "typescript", "nodejs", "nextjs", "react", "angular", "html-css", "sqlserver", "networking-hosting", "git", "docker", "aws", "system-design", "dsa"],
  },
  {
    slug: "sql-bi", title: "SQL Server / BI / ETL Developer", icon: "BI", color: "#c92a2a",
    summary: "T-SQL, indexing and tuning, then ETL design, SSIS packages and SSRS reports.",
    courses: ["sqlserver", "sqlserver-internals", "azure-databases", "etl", "ssis", "ssrs"],
  },
  {
    slug: "devops-cloud", title: "DevOps / Cloud Engineer", icon: "Ops", color: "#0078d4",
    summary: "Git, containers, Kubernetes, CI/CD pipelines and Azure.",
    courses: ["networking-hosting", "iis", "git", "docker", "kubernetes", "azure-devops", "azure", "azure-databases", "aws", "gcp", "logging"],
  },
  {
    slug: "test-automation", title: "Test Automation (SDET) Engineer", icon: "QA", color: "#2b8a3e",
    summary: "Selenium, Playwright, NUnit/xUnit, API testing, BDD and CI — plus the C# and Git questions SDET rounds include.",
    courses: ["test-automation", "csharp", "oop", "clean-code", "git", "azure-devops"],
  },
  {
    slug: "industrial-automation", title: "Industrial Automation Engineer", icon: "PLC", color: "#e8590c",
    summary: "PLCs, ladder logic, SCADA/HMI, Modbus, OPC UA and how plant systems connect to IT.",
    courses: ["industrial-automation", "industry-40"],
  },
  {
    slug: "industry-40", title: "Industry 4.0 / IIoT Software Engineer", icon: "4.0", color: "#0b7285",
    summary: "IIoT, MQTT, MES/ISA-95, OEE and digital twins, plus the .NET, SQL and Azure skills used to build factory software.",
    courses: ["industry-40", "industrial-automation", "aspnet-core-webapi", "microservices", "sqlserver", "azure", "docker"],
  },
  {
    slug: "web3", title: "Web3 / Blockchain Developer", icon: "W3", color: "#6f42c1",
    summary: "Blockchain fundamentals, Ethereum, wallets and Solidity smart contracts.",
    courses: ["blockchain-web3", "solidity", "javascript"],
  },
  {
    slug: "team-lead", title: "Team Lead / Technical Lead", icon: "TL", color: "#5c7cfa",
    summary: "Leadership, Agile, design and architecture decisions, delivery and DevOps.",
    courses: ["leadership", "system-design", "lld", "project-architecture", "microservices", "design-patterns", "clean-code", "azure-devops", "hr-behavioral"],
  },
  {
    slug: "hr-career", title: "HR, Behavioural & Salary Round", icon: "HR", color: "#e64980",
    summary: "Tell-me-about-yourself, behavioural STAR answers, gaps, job changes, notice period and salary negotiation.",
    courses: ["hr-behavioral", "career-gaps-salary", "company-wise"],
  },
];

export const getRole = (slug: string) => ROLES.find((r) => r.slug === slug);
