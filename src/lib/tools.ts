// Free in-browser developer tools. Everything runs locally in the visitor's browser; nothing is uploaded.
export type Tool = { slug: string; name: string; short: string; description: string };

export const TOOLS: Tool[] = [
  { slug: "json-formatter", name: "JSON Formatter & Validator", short: "Format, minify and validate JSON",
    description: "Free online JSON formatter and validator: pretty-print or minify JSON, find the exact line of a syntax error and sort keys. It runs in your browser." },
  { slug: "sql-formatter", name: "SQL Formatter", short: "Beautify T-SQL / SQL queries",
    description: "Free online SQL formatter for SQL Server (T-SQL), MySQL and PostgreSQL: put clauses on new lines, indent joins and uppercase keywords. It runs in your browser." },
  { slug: "regex-tester", name: "Regex Tester", short: "Test regular expressions live",
    description: "Free online regex tester: see every match, capture group and replacement live as you type, with flags and C#/.NET notes. It runs in your browser." },
  { slug: "guid-generator", name: "GUID / UUID Generator", short: "Generate random GUIDs in bulk",
    description: "Free online GUID / UUID v4 generator: create 1 to 1000 random GUIDs in upper or lower case, with or without braces and hyphens, ready for C# and SQL." },
  { slug: "base64", name: "Base64 Encoder / Decoder", short: "Encode and decode Base64 text",
    description: "Free online Base64 encoder and decoder with full UTF-8 support and a URL-safe option. It runs in your browser and nothing is uploaded." },
  { slug: "jwt-decoder", name: "JWT Decoder", short: "Read a JSON Web Token's claims",
    description: "Free online JWT decoder: see a JSON Web Token's header and payload, readable issued/expiry times and whether it has expired. Decoded in your browser." },
  { slug: "json-to-csharp", name: "JSON to C# Class Converter", short: "Generate C# classes or records from JSON",
    description: "Free online JSON to C# converter: paste JSON and get C# classes or records with the right types, nullable fields, lists and JsonPropertyName attributes. It runs in your browser." },
  { slug: "unix-timestamp-converter", name: "Unix Timestamp Converter", short: "Epoch seconds ↔ readable date",
    description: "Free online Unix timestamp converter: turn epoch seconds or milliseconds into UTC and local dates and back, with C#, SQL Server and JavaScript code. It runs in your browser." },
  { slug: "cron-expression-explainer", name: "Cron Expression Explainer", short: "Read a cron schedule in plain English",
    description: "Free online cron expression explainer: see what a 5- or 6-field cron schedule means in plain English and its next run times. Works for Linux cron, Hangfire, Quartz-style seconds and GitHub Actions." },
  { slug: "sql-connection-string-builder", name: "SQL Server Connection String Builder", short: "Build a SQL Server connection string",
    description: "Free SQL Server connection string builder for .NET: pick server, database, Windows or SQL login, encryption and timeouts and copy a ready string for appsettings.json, EF Core or Dapper." },
  { slug: "hash-generator", name: "SHA-256 Hash Generator", short: "SHA-1, SHA-256, SHA-384, SHA-512 hashes",
    description: "Free online hash generator: create SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text in hex or Base64, with matching C# code. Hashing happens in your browser." },
];

export const tool = (slug: string) => TOOLS.find((t) => t.slug === slug)!;
