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
];

export const tool = (slug: string) => TOOLS.find((t) => t.slug === slug)!;
