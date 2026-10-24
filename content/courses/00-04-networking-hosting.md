---
slug: networking-hosting
title: Networking & Hosting — How a Website Works, End to End
track: foundations
order: 4
group: How the Web Works
icon: NET
color: #1c7ed6
summary: The complete life cycle of a web request — OSI and TCP/IP models, IP addresses, subnets and ports, DNS, TCP vs UDP, TLS/HTTPS, HTTP/1.1, HTTP/2 and HTTP/3, browser rendering, cookies and sessions, proxies, load balancers and CDNs, web servers (IIS, Kestrel, Nginx), hosting options from shared hosting to cloud and containers, domains and SSL certificates, deploying an ASP.NET site to IIS and Azure, and troubleshooting network problems.
---

# Overview

When you type `https://www.shop.com/orders` and press Enter, a dozen systems cooperate in under a second: your browser, the operating system, Wi-Fi/router, your ISP, DNS servers, the internet backbone, a CDN, a load balancer, a web server, your application and a database. This course follows that journey step by step, then shows how to **host** your own site.

| Concept | One-line meaning |
|---|---|
| IP address | The address of a machine on a network (`142.250.183.68`, `2404:6800::200e`) |
| Port | Which program on that machine (`443` HTTPS, `80` HTTP, `1433` SQL Server) |
| DNS | The internet's phone book: name → IP address |
| TCP | Reliable, ordered delivery of bytes between two machines |
| TLS | Encryption + server identity → the "S" in HTTPS |
| HTTP | The request/response language of the web |
| Web server | Program that accepts HTTP requests (IIS, Kestrel, Nginx, Apache) |
| Hosting | Where your site physically runs (shared host, VPS, cloud PaaS, containers, serverless) |

# Versions

| Year | Milestone |
|---|---|
| 1969 | ARPANET — the first packet-switched network |
| 1974–1983 | TCP/IP designed (Cerf & Kahn); ARPANET switches to TCP/IP on 1 Jan 1983 |
| 1983–1987 | DNS (RFC 882/883, then 1034/1035) |
| 1989–1991 | Tim Berners-Lee invents the World Wide Web: HTML, HTTP, URLs, first browser and server |
| 1995–1996 | SSL 2.0/3.0 (Netscape); HTTP/1.0; IIS 1.0 ships with Windows NT; Apache becomes the top web server |
| 1997–1999 | HTTP/1.1 (RFC 2068 → 2616); TLS 1.0 |
| 1998 | IPv6 specified (RFC 2460, later 8200) |
| 2004 | Nginx released |
| 2008 | TLS 1.2 |
| 2015 | HTTP/2; Let's Encrypt free certificates (public launch 2016) |
| 2018 | TLS 1.3 (RFC 8446) |
| 2022 | HTTP/3 over QUIC (RFC 9114) |
| 2024–2025 | Browsers and clouds widely use HTTP/3; IPv6 carries a large share of traffic (≈45 % of Google users) |

# Lifecycle

**What happens when you open `https://www.shop.com/orders` — the complete request life cycle:**

1. **URL parsing** — the browser splits scheme (`https`), host (`www.shop.com`), port (default 443), path (`/orders`). If it's not a URL, it becomes a search.
2. **Caches first** — HSTS list (forces HTTPS), browser cache, service worker; maybe no network is needed at all.
3. **DNS lookup** — browser cache → OS cache/hosts file → configured resolver (ISP, 8.8.8.8, 1.1.1.1) → root servers → `.com` TLD servers → `shop.com` authoritative servers → returns an IP (often a CDN's).
4. **TCP connection** — three-way handshake (SYN, SYN-ACK, ACK) to IP:443. (HTTP/3 uses QUIC over UDP instead.)
5. **TLS handshake** — agree cipher, server sends its certificate, browser validates the chain and hostname, keys are exchanged; from now on everything is encrypted.
6. **HTTP request** — `GET /orders HTTP/2` with headers (Host, cookies, Accept, User-Agent…).
7. **Edge** — CDN serves cached static files; otherwise forwards to the origin. A WAF filters attacks.
8. **Load balancer / reverse proxy** — picks a healthy server instance, may terminate TLS.
9. **Web server + application** — IIS/Kestrel passes the request through the pipeline: authentication, routing, controller, business logic, database queries.
10. **Database** — SQL Server runs the query (buffer pool, indexes) and returns rows.
11. **HTTP response** — status (200), headers (Content-Type, Cache-Control, Set-Cookie), body (HTML/JSON), compressed (gzip/Brotli).
12. **Browser rendering** — parse HTML → DOM, CSS → CSSOM, run JavaScript, layout, paint; fetch images/scripts in parallel (more requests, reusing the connection).
13. **After load** — JavaScript calls APIs (fetch/XHR), WebSockets for live data; the connection is kept alive for reuse or closed after idle time.

# Tools

- **Browser DevTools** — Network tab (timing waterfall: DNS, connect, TLS, TTFB, download), Security tab (certificate), Application tab (cookies, storage, service workers).
- **Command line** — `ping`, `tracert`/`traceroute`, `nslookup`/`dig`, `ipconfig /all`/`ip a`, `netstat -ano`/`ss -tlnp`, `curl -v`, `Test-NetConnection host -Port 443` (PowerShell), `telnet`.
- **Packet analysis** — Wireshark, Fiddler, Charles Proxy.
- **Online** — SSL Labs (TLS grading), DNS checker (propagation), WebPageTest, PageSpeed Insights, downforeveryoneorjustme.
- **Hosting** — IIS Manager, Azure Portal (App Service, Front Door), Cloudflare dashboard, Nginx, Certbot / win-acme (Let's Encrypt).

# Module: Network Foundations

## Lesson: [Basic|High] OSI and TCP/IP models — layers of a network

| OSI layer | TCP/IP layer | What it does | Examples |
|---|---|---|---|
| 7 Application | Application | Data your app understands | HTTP, HTTPS, DNS, SMTP, FTP, SSH |
| 6 Presentation | Application | Encoding, encryption, compression | TLS, UTF-8, gzip |
| 5 Session | Application | Sessions between apps | (handled by TLS/HTTP today) |
| 4 Transport | Transport | End-to-end delivery between ports | **TCP**, **UDP**, QUIC |
| 3 Network | Internet | Addressing and routing between networks | **IP** (v4/v6), ICMP (ping), routers |
| 2 Data link | Link | Delivery on the local network (frames, MAC addresses) | Ethernet, Wi-Fi, switches, ARP |
| 1 Physical | Link | Bits on the wire/air | Cables, fibre, radio |

**Encapsulation:** your HTTP request is wrapped in a TCP segment (adds ports), then an IP packet (adds IP addresses), then an Ethernet/Wi-Fi frame (adds MAC addresses). Each router unwraps to layer 3, decides the next hop, and wraps again. The receiver unwraps in reverse order.

```text
[ Ethernet header | IP header (src/dst IP) | TCP header (src/dst port) | HTTP: GET /orders ... | trailer ]
```

> **Interview tip:** Asked "which layer?": a switch works at layer 2 (MAC), a router at layer 3 (IP), a load balancer at layer 4 (TCP/UDP) or layer 7 (HTTP — can route by URL/header), a firewall at 3–4 (WAF at 7).

## Lesson: [Basic|High] IP addresses, subnets, ports, NAT and IPv6

**IPv4** — 32 bits written as four numbers `192.168.1.25` (≈4.3 billion addresses — exhausted). **IPv6** — 128 bits `2001:db8::1` (practically unlimited).

| Range | Meaning |
|---|---|
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | **Private** addresses (home/office/cloud VNets) — not routable on the internet |
| `127.0.0.1` / `::1` | Loopback — "this machine" (`localhost`) |
| `0.0.0.0` | "All interfaces" when a server listens |
| `169.254.x.x` | No DHCP answer — self-assigned |

**Subnet / CIDR:** `192.168.1.0/24` = the first 24 bits are the network part → 256 addresses (254 usable hosts). `/16` = 65,536 addresses. Cloud virtual networks (Azure VNet, AWS VPC) are designed with CIDR blocks and subnets for web, app and database tiers.

**DHCP** gives devices an IP, gateway and DNS automatically. **Default gateway** = the router to other networks.

**NAT (network address translation):** your home router has one public IP; it rewrites many private addresses to it and tracks connections — that's why your laptop isn't directly reachable from the internet. Port forwarding opens a hole for a specific port.

**Ports** (0–65535) identify the program:

| Port | Service |
|---|---|
| 80 / 443 | HTTP / HTTPS |
| 22 | SSH |
| 3389 | Remote Desktop (RDP) |
| 1433 | SQL Server |
| 5432 / 3306 | PostgreSQL / MySQL |
| 6379 | Redis |
| 25 / 587 | SMTP (mail) |
| 53 | DNS |
| 5000–5001, 7000+ | Typical ASP.NET Core dev ports |

A **socket** = IP + port + protocol; a TCP connection is identified by (client IP, client port, server IP, server port).

## Lesson: [Basic|High] DNS — how names become IP addresses

```text
Browser → OS resolver → Recursive resolver (ISP / 8.8.8.8 / 1.1.1.1)
              → Root server ("ask .com")
              → .com TLD server ("ask ns1.shop.com")
              → Authoritative server for shop.com → "www.shop.com = 20.43.10.5, TTL 300"
Answer cached at each level for TTL seconds
```

| Record | Purpose | Example |
|---|---|---|
| **A** / **AAAA** | Name → IPv4 / IPv6 | `www → 20.43.10.5` |
| **CNAME** | Alias to another name | `www → shop.azurewebsites.net` |
| **MX** | Mail servers | `shop.com → mail.protection.outlook.com` |
| **TXT** | Text — domain verification, SPF/DKIM/DMARC for email | `v=spf1 include:...` |
| **NS** | Which servers are authoritative | `ns1.cloudflare.com` |
| ALIAS/ANAME | CNAME-like at the root domain (provider feature) | `shop.com → CDN` |

**TTL** (time to live) — how long resolvers cache the answer. Lower it (e.g. 300 s) before migrating a site so the change propagates quickly. "DNS propagation" = waiting for old cached answers to expire.

```bash
nslookup www.shop.com
dig +trace www.shop.com        # see each step from the root
ipconfig /flushdns             # clear Windows DNS cache
```

## Lesson: [Intermediate|High] TCP vs UDP and the TLS handshake (HTTPS)

| | TCP | UDP |
|---|---|---|
| Connection | Yes — three-way handshake | No — just send datagrams |
| Reliability | Acknowledgements, retransmission, ordering | None — packets may be lost/reordered |
| Flow/congestion control | Yes | No (app decides) |
| Overhead / latency | Higher | Lower |
| Used by | HTTP/1.1, HTTP/2, SQL Server (TDS), SMTP, SSH | DNS, video calls, gaming, streaming, **QUIC (HTTP/3)** |

**TCP three-way handshake:** client `SYN` → server `SYN-ACK` → client `ACK` (one round trip before any data). Closing: `FIN`/`ACK` exchange; the closing side keeps `TIME_WAIT` for a while — why creating a new `HttpClient` per request can exhaust ports.

**TLS 1.3 handshake (simplified, one round trip):**

1. Client Hello — supported ciphers, key share, SNI (which hostname it wants).
2. Server Hello — chosen cipher, its key share, **certificate**, signature.
3. Client verifies the certificate: issued by a trusted CA (chain to a root in the OS/browser store), not expired, hostname matches, not revoked.
4. Both derive the same session keys (Diffie-Hellman) → encrypted HTTP flows.

HTTPS gives **confidentiality** (encryption), **integrity** (no tampering) and **authentication** (you're talking to the real `shop.com`). It does **not** make the application itself secure.

Certificates: **DV** (domain validated — Let's Encrypt, free, 90 days), OV/EV (organisation checks). Wildcard `*.shop.com`; SAN certificates list several names. Private key must stay secret on the server/Key Vault.

# Module: HTTP and the Browser

## Lesson: [Basic|High] HTTP in depth — methods, status codes, headers, versions

```http
GET /api/orders?page=1 HTTP/1.1
Host: www.shop.com
Accept: application/json
Authorization: Bearer eyJhbGciOi...
Cookie: session=abc123

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: private, max-age=60
Content-Encoding: br
Set-Cookie: theme=dark; Path=/; Secure; HttpOnly; SameSite=Lax

{"items":[...],"total":42}
```

| Method | Purpose | Safe | Idempotent |
|---|---|---|---|
| GET | Read | ✅ | ✅ |
| POST | Create / action | ❌ | ❌ |
| PUT | Replace | ❌ | ✅ |
| PATCH | Partial update | ❌ | ❌ (usually) |
| DELETE | Remove | ❌ | ✅ |
| HEAD / OPTIONS | Headers only / capabilities (CORS preflight) | ✅ | ✅ |

Status classes: **1xx** info, **2xx** success (200, 201, 204), **3xx** redirect (301 permanent, 302/307 temporary, 304 not modified), **4xx** client error (400, 401, 403, 404, 409, 429), **5xx** server error (500, 502 bad gateway, 503 unavailable, 504 gateway timeout).

**HTTP versions:**

| Version | Transport | Key point |
|---|---|---|
| HTTP/1.1 | TCP | Text; one request at a time per connection (browsers open ~6 per host); keep-alive |
| HTTP/2 | TCP + TLS | Binary, **multiplexing** many requests on one connection, header compression (HPACK) — but a lost TCP packet blocks all streams |
| HTTP/3 | **QUIC over UDP** | No TCP head-of-line blocking, faster handshake (0-RTT/1-RTT), survives network changes (Wi-Fi → 4G) |

HTTP is **stateless** — each request stands alone; state is carried by cookies, tokens or server-side sessions.

## Lesson: [Intermediate|High] Cookies, sessions, caching and CORS

**Cookies** — small key/value data the server asks the browser to store and send back:

| Attribute | Meaning |
|---|---|
| `HttpOnly` | JavaScript can't read it (protects against XSS stealing it) |
| `Secure` | Only sent over HTTPS |
| `SameSite=Lax/Strict/None` | Controls sending on cross-site requests (CSRF protection) |
| `Domain`, `Path`, `Expires/Max-Age` | Scope and lifetime |

**Session** — the server keeps data (in memory, Redis, SQL) keyed by a session id stored in a cookie. In a web farm, sessions must be shared (distributed cache) or the load balancer must use sticky sessions.

**HTTP caching:**

| Header | Effect |
|---|---|
| `Cache-Control: public, max-age=31536000, immutable` | Cache for a year (fingerprinted static files like `app.3f9a.js`) |
| `Cache-Control: no-store` | Never cache (sensitive pages) |
| `ETag` + `If-None-Match` | Revalidate: server answers `304 Not Modified` without a body |
| `Last-Modified` + `If-Modified-Since` | Same with dates |

**CORS** — a browser rule: JavaScript on origin A may read responses from origin B only if B allows A via `Access-Control-Allow-Origin`. Non-simple requests send an `OPTIONS` preflight first.

## Lesson: [Intermediate|High] How the browser renders a page

1. Receive HTML bytes → decode → tokenize → build the **DOM**.
2. Find `<link rel=stylesheet>` → download → build the **CSSOM** (CSS blocks rendering).
3. Find `<script>` → download and execute (blocks parsing unless `defer`/`async`/`type=module`).
4. DOM + CSSOM → **render tree** → **layout** (positions/sizes) → **paint** → **composite** layers on the GPU.
5. Images, fonts, more scripts are requested in parallel; the page becomes interactive when JavaScript has run.
6. JavaScript changes (DOM updates) may trigger re-layout and re-paint.

Speed-ups: fewer/smaller requests, compression (Brotli/gzip), HTTP/2/3, CDN, caching headers, lazy-loading images, `defer` scripts, critical CSS, preconnect/preload hints. Measure with Lighthouse and Core Web Vitals (LCP, INP, CLS).

# Module: Infrastructure Between the User and the App

## Lesson: [Intermediate|High] Proxies, reverse proxies, load balancers, CDNs and firewalls

| Component | Sits | Does |
|---|---|---|
| Forward proxy | Near the client | Clients go out through it (corporate filtering, caching) |
| **Reverse proxy** | In front of servers | Receives client requests and forwards to backend servers: TLS termination, compression, caching, routing (Nginx, IIS ARR, YARP, Azure Application Gateway) |
| **Load balancer** | In front of a server pool | Distributes traffic: round robin, least connections, IP hash; health probes remove dead servers. L4 (TCP) or L7 (HTTP) |
| **CDN** | Edge locations worldwide | Caches static (and some dynamic) content close to users: Cloudflare, Azure Front Door, Akamai, CloudFront |
| Firewall / NSG | Network boundary | Allows/blocks by IP/port |
| **WAF** | Layer 7 | Blocks SQL injection, XSS, bots (Azure WAF, Cloudflare WAF) |
| API gateway | In front of APIs | Auth, rate limiting, routing, versioning (Azure API Management) |

```text
User ─▶ DNS ─▶ CDN/WAF (edge) ─▶ Load balancer ─▶ [Web server 1 | Web server 2 | Web server 3] ─▶ SQL Server
```

Behind a proxy the app sees the proxy's IP — read the original client IP and scheme from `X-Forwarded-For` / `X-Forwarded-Proto` (ASP.NET Core: `UseForwardedHeaders`).

## Lesson: [Intermediate|High] Web servers — IIS, Kestrel, Nginx and how ASP.NET is hosted

| Server | Platform | Notes |
|---|---|---|
| **IIS** | Windows | Hosts ASP.NET (Framework) in the `w3wp.exe` worker process; app pools, bindings, Windows auth, URL Rewrite |
| **Kestrel** | Cross-platform | ASP.NET Core's built-in, fast server; can face the internet directly or sit behind a reverse proxy |
| **HTTP.sys** | Windows | Kernel-mode HTTP driver; ASP.NET Core can use it directly |
| **Nginx / Apache** | Linux mostly | Reverse proxy and static file server in front of Kestrel, Node, PHP |

**IIS key concepts:**

- **Site** — bindings (protocol + IP + port + host name, e.g. `https *:443 www.shop.com` with a certificate).
- **Application pool** — the worker process (`w3wp.exe`) running your app; isolation, identity (ApplicationPoolIdentity), recycling, .NET CLR version ("No Managed Code" for ASP.NET Core).
- **HTTP.sys** receives requests in the kernel and queues them per app pool.
- **ASP.NET Core Module (ANCM)** — runs ASP.NET Core **in-process** (inside w3wp, fastest) or **out-of-process** (IIS proxies to Kestrel).
- **web.config** — module and handler settings; for Core it points IIS at `dotnet YourApp.dll` or the app's exe.

```xml
<!-- web.config generated by dotnet publish for ASP.NET Core on IIS -->
<configuration>
  <system.webServer>
    <handlers><add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" /></handlers>
    <aspNetCore processPath="dotnet" arguments=".\Shop.Web.dll" stdoutLogEnabled="false" hostingModel="inprocess" />
  </system.webServer>
</configuration>
```

## Lesson: [Intermediate|High] Hosting options — shared, VPS, dedicated, cloud PaaS, containers, serverless

| Option | You manage | Good for | Examples |
|---|---|---|---|
| Shared hosting | Only your files | Small sites, low budget | GoDaddy/Hostinger Windows plans with Plesk |
| VPS / virtual machine (IaaS) | OS, IIS/Nginx, patches, runtime, app | Full control, legacy apps | Azure VM, AWS EC2, DigitalOcean |
| Dedicated / on-premises server | Everything incl. hardware | Compliance, factories, intranets | Company data centre |
| **PaaS (platform)** | Only the app + config | Most web apps and APIs | **Azure App Service**, Elastic Beanstalk, Heroku |
| Static hosting + CDN | Just static files | SPAs, documentation, marketing sites | Azure Static Web Apps, Vercel, Netlify, GitHub Pages |
| **Containers** | Image + orchestration config | Microservices, portability | Azure Container Apps, AKS, ECS, Cloud Run |
| **Serverless functions** | Function code | Event-driven, spiky workloads | Azure Functions, AWS Lambda, Vercel Functions |

Trade-off: the less you manage, the less control you have — but also less patching, scaling and security work. A typical .NET stack today: React/Angular on Static Web Apps or a CDN, API on App Service/Container Apps, Azure SQL Database, Key Vault for secrets, Application Insights for monitoring.

**Scaling:** vertical (bigger machine) vs horizontal (more instances behind a load balancer — app must be stateless). **High availability:** multiple instances across availability zones, health checks, database replicas, backups and a tested restore.

# Module: Putting a Site Live

## Lesson: [Intermediate|High] Domains, DNS setup and SSL certificates in practice

1. **Buy a domain** from a registrar (GoDaddy, Namecheap, Cloudflare Registrar, Google Domains successor Squarespace). You rent it yearly.
2. **Choose DNS hosting** — the registrar's DNS, Cloudflare, or Azure DNS; set NS records accordingly.
3. **Point the domain** — `A` record for the root to the server IP (or ALIAS), `CNAME www` to the platform hostname (`shop.azurewebsites.net`); add TXT records the platform asks for to prove ownership.
4. **Certificate** — free managed certificates (App Service managed certificate, Cloudflare, Let's Encrypt with Certbot/win-acme for IIS) or buy one; bind it to the site on 443.
5. **Redirect HTTP → HTTPS** and add HSTS (`UseHttpsRedirection`, `UseHsts`, or an IIS URL Rewrite rule).
6. **Email records** — MX, SPF, DKIM, DMARC so your mail isn't marked as spam.
7. **Verify** — `nslookup`, SSL Labs test, browser padlock, check `www` and root both work.

Common mistakes: certificate for `www` only but users type the root domain; forgetting renewals (automate them); CNAME at the root (not allowed — use ALIAS/A); long TTLs during migration.

## Lesson: [Intermediate|High] Deploying an ASP.NET Core site to IIS and to Azure App Service

**IIS on a Windows server (VM or on-premises):**

```powershell
# 1. Server: enable IIS and install the .NET Hosting Bundle (runtime + ASP.NET Core Module)
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
# download & run dotnet-hosting-<version>-win.exe, then: net stop was /y; net start w3svc

# 2. Build: publish the app
dotnet publish .\Shop.Web\Shop.Web.csproj -c Release -o C:\publish\shop

# 3. IIS: app pool with "No Managed Code", site pointing to C:\publish\shop, bindings 80/443 + certificate
Import-Module WebAdministration
New-WebAppPool -Name "ShopPool"
Set-ItemProperty IIS:\AppPools\ShopPool -Name managedRuntimeVersion -Value ""
New-Website -Name "Shop" -PhysicalPath "C:\publish\shop" -ApplicationPool "ShopPool" -Port 80 -HostHeader "www.shop.com"
```

Then: give the app pool identity read access to the folder (and write access to log folders), set environment (`ASPNETCORE_ENVIRONMENT`) and connection strings (environment variables or secured config), open firewall ports 80/443, test locally on the server, then from outside.

**Azure App Service:**

```bash
az group create -n rg-shop -l centralindia
az appservice plan create -n plan-shop -g rg-shop --sku B1 --is-linux
az webapp create -n shop-web-divakar -g rg-shop -p plan-shop --runtime "DOTNETCORE:10.0"
dotnet publish -c Release -o ./publish && cd publish && zip -r ../app.zip . && cd ..
az webapp deploy -n shop-web-divakar -g rg-shop --src-path app.zip --type zip
az webapp config appsettings set -n shop-web-divakar -g rg-shop --settings ASPNETCORE_ENVIRONMENT=Production
```

Then: custom domain + managed certificate, connection string to Azure SQL (prefer Managed Identity), Application Insights, deployment slots (staging → swap) and a CI/CD pipeline instead of manual deploys.

**Troubleshooting a "site not working":**

| Symptom | Likely cause |
|---|---|
| `DNS_PROBE_FINISHED_NXDOMAIN` | DNS record missing/wrong or not propagated |
| Connection timed out | Firewall/NSG blocks the port, server down, wrong IP |
| Certificate warning | Wrong hostname, expired, missing intermediate certificate |
| 502.5 / 500.30 on IIS | ASP.NET Core app failed to start — Hosting Bundle missing, wrong runtime, startup exception (enable stdout log, check Event Viewer) |
| 503 Service Unavailable | App pool stopped/crashing, overloaded |
| 404 for deep links on an SPA | Server not rewriting unknown paths to `index.html` |
| Works locally, slow live | Database latency (different region), no caching, small plan |

# Interview

## [Beginner|High] What happens when you type a URL in the browser and press Enter?

URL parsed → browser/OS caches checked → DNS resolves the host to an IP (resolver → root → TLD → authoritative) → TCP three-way handshake to port 443 (or QUIC for HTTP/3) → TLS handshake validates the certificate and sets up encryption → HTTP request sent with headers/cookies → CDN/load balancer/reverse proxy route it → web server and application handle it (auth, routing, controller, database) → HTTP response with status, headers, body → browser parses HTML into the DOM, loads CSS/JS/images, builds the render tree, lays out and paints the page; further requests reuse the connection.

## [Beginner|High] What is DNS and what are A, CNAME and MX records?

DNS translates domain names to IP addresses through a hierarchy of servers with caching (TTL). An A record maps a name to an IPv4 address (AAAA for IPv6); a CNAME makes a name an alias of another name (e.g. `www` → `shop.azurewebsites.net`); an MX record lists the mail servers for the domain. TXT records are used for verification and email security (SPF, DKIM, DMARC).

## [Beginner|High] What is the difference between HTTP and HTTPS?

HTTPS is HTTP over TLS: the connection is encrypted (confidentiality), protected from tampering (integrity), and the server proves its identity with a certificate signed by a trusted certificate authority (authentication). Default ports 80 vs 443. HTTPS is required for modern browser features, SEO and any login or personal data.

## [Beginner|High] TCP vs UDP?

TCP is connection-oriented and reliable: handshake, acknowledgements, retransmission, ordering, flow and congestion control — used for the web, databases, email. UDP is connectionless with no delivery guarantees but lower latency and overhead — used for DNS, voice/video, games and QUIC (HTTP/3), where the application handles reliability.

## [Beginner|High] What are the main HTTP methods and status codes?

GET (read), POST (create/action), PUT (replace, idempotent), PATCH (partial update), DELETE (remove, idempotent), OPTIONS/HEAD. Status: 200 OK, 201 Created, 204 No Content, 301/302 redirects, 304 Not Modified, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests, 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.

## [Beginner|Medium] What is an IP address, a port and a socket? Public vs private IP?

An IP address identifies a machine on a network; a port identifies a program/service on that machine (443 HTTPS, 1433 SQL Server); a socket is the endpoint IP + port + protocol, and a connection is the pair of endpoints. Private IPs (10.x, 172.16–31.x, 192.168.x) are used inside networks and translated by NAT; public IPs are reachable on the internet.

## [Intermediate|High] What is a load balancer? What algorithms does it use?

A component that distributes incoming traffic across several servers for scalability and availability, using health probes to skip unhealthy instances. Algorithms: round robin, weighted round robin, least connections, IP hash/sticky sessions, least response time. Layer 4 balancers route by IP/port (fast); layer 7 balancers understand HTTP and can route by path, host or header and terminate TLS.

## [Intermediate|High] What is a CDN and how does it improve performance?

A Content Delivery Network caches content at edge servers around the world, so users download from a nearby location: lower latency, less load on the origin, protection against traffic spikes and DDoS, often a WAF and free TLS. Best for static assets with long cache headers and fingerprinted file names; dynamic content can also be accelerated.

## [Intermediate|High] Forward proxy vs reverse proxy?

A forward proxy acts for clients (they connect out through it — corporate filtering, anonymity). A reverse proxy acts for servers (clients connect to it and it forwards to backend servers — TLS termination, load balancing, caching, compression, hiding internal servers). Nginx, IIS ARR, YARP and Azure Application Gateway are reverse proxies.

## [Intermediate|High] How is an ASP.NET Core app hosted on IIS?

Install the .NET Hosting Bundle (runtime + ASP.NET Core Module). IIS receives requests via HTTP.sys and the app pool's `w3wp.exe`; the ASP.NET Core Module runs the app in-process (inside w3wp, fastest) or out-of-process (proxying to Kestrel). The app pool uses "No Managed Code"; `web.config` (generated on publish) configures the module; bindings and certificates are set in IIS.

## [Intermediate|Medium] What is the difference between HTTP/1.1, HTTP/2 and HTTP/3?

HTTP/1.1: text protocol, one outstanding request per connection (browsers open ~6 connections per host), keep-alive. HTTP/2: binary framing, multiplexes many requests over one TCP connection, header compression; still suffers TCP head-of-line blocking on packet loss. HTTP/3: runs over QUIC (UDP), independent streams without head-of-line blocking, faster connection setup, connection migration across networks.

## [Intermediate|Medium] Cookies vs session vs local storage?

Cookies are small values sent automatically with every request to the domain (can be HttpOnly/Secure/SameSite) — used for session ids and auth. A session is server-side data keyed by a session id cookie. localStorage/sessionStorage are browser-only key-value stores readable by JavaScript and never sent automatically — fine for preferences, not for tokens (XSS risk).

## [Intermediate|Medium] IaaS vs PaaS vs SaaS vs serverless?

IaaS: you get VMs/networks and manage the OS and everything above (Azure VM). PaaS: the platform runs your app; you manage code and configuration (Azure App Service, Azure SQL). SaaS: complete software you just use (Microsoft 365, Salesforce). Serverless: run functions or containers on demand with automatic scaling and pay-per-use (Azure Functions, Container Apps), no server management at all.

## [Advanced|Medium] How does TLS work and what does a certificate prove?

The client and server negotiate a cipher suite, exchange keys with (elliptic-curve) Diffie-Hellman, and derive symmetric session keys; the server presents a certificate binding its public key to the domain, signed by a certificate authority the client trusts. The client checks the chain, validity dates, hostname (SAN) and revocation. The certificate proves the server controls the domain (DV) and, for OV/EV, who the organisation is.

## [Scenario|High] Users report your site is down, but it works on your machine. How do you troubleshoot?

Check from outside (another network, downforeveryoneorjustme, mobile data). DNS: `nslookup` from different resolvers — wrong/expired record or propagation. Connectivity: `Test-NetConnection host -Port 443`, firewall/NSG, load balancer health probes. TLS: expired certificate or missing intermediate (SSL Labs). Server: app pool/process running, logs (Event Viewer, stdout, Application Insights), 5xx errors, resource limits. Recent changes: deployment, certificate renewal, DNS edits. Your machine may use a cached DNS entry or hosts-file entry.

## [Scenario|High] After moving the site to a new server, some users still reach the old server for hours. Why?

DNS caching: resolvers and clients cache the old A record until its TTL expires (and some ignore TTLs). Next time lower the TTL (e.g. to 300 s) a day before the move, then change the record, keep the old server running (or redirecting) until traffic drains, and raise the TTL afterwards.

## [Scenario|Medium] An ASP.NET Core app on IIS shows "HTTP Error 500.30 — ASP.NET Core app failed to start". What do you check?

The app crashed during startup. Enable `stdoutLogEnabled="true"` in web.config (create the logs folder with write permission) or check Event Viewer → Application; run the app from the command line on the server (`dotnet Shop.Web.dll`) to see the exception. Common causes: wrong/missing .NET runtime or Hosting Bundle, missing config/connection string for the environment, file permissions for the app pool identity, database unreachable at startup, wrong `ASPNETCORE_ENVIRONMENT`.

## [Scenario|Medium] Behind the load balancer, users are randomly logged out. Why?

The app keeps session or authentication state per server (in-memory session, per-machine Data Protection keys), and the load balancer sends requests to different instances. Fix: store session in a distributed cache (Redis/SQL), share the ASP.NET Core Data Protection key ring (Blob Storage/Redis + Key Vault), or use stateless tokens; sticky sessions only as a stop-gap.

# Cheatsheet

## Request life cycle

URL → cache/HSTS → DNS → TCP (or QUIC) → TLS → HTTP request → CDN/WAF → load balancer → web server → app → DB → response → DOM/CSSOM → layout → paint.

## Layers

L7 HTTP/DNS · L4 TCP/UDP (ports) · L3 IP (routers) · L2 Ethernet/Wi-Fi (switches, MAC) · L1 physical. L4 vs L7 load balancing.

## Numbers to know

Ports 80/443/22/3389/1433/6379/53 · private ranges 10/8, 172.16/12, 192.168/16 · `/24` = 256 addresses · TLS 1.3 = 1 RTT · TTL 300 s before migrations.

## Hosting choices

Shared → VPS/VM (IaaS) → PaaS (App Service) → containers (Container Apps/AKS) → serverless (Functions); static SPA → Static Web Apps/CDN.

## Troubleshooting toolkit

`nslookup`/`dig` · `ping`/`tracert` · `Test-NetConnection -Port` · `curl -v` · DevTools Network timing · SSL Labs · IIS stdout log + Event Viewer · App Insights.
