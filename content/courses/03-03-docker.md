---
slug: docker
title: Docker & Containers
track: devops-cloud
order: 3
group: Containers
icon: Dk
color: #1c7ed6
summary: Containers vs VMs, images and layers, Dockerfile for .NET, multi-stage builds, volumes, networks, Docker Compose, registries, security, debugging and production best practices.
---

# Overview

**Docker** packages an application with everything it needs (runtime, libraries, config) into a **container image** that runs the same on a laptop, CI server or cloud. A **container** is a running instance of an image — an isolated process that shares the host's OS kernel.

| | Virtual machine | Container |
|---|---|---|
| Isolation | Full guest OS on a hypervisor | Process isolation via kernel namespaces + cgroups |
| Size | GBs | MBs |
| Start time | Minutes | Seconds or less |
| Density | Few per host | Many per host |
| OS | Any guest OS | Shares host kernel (Linux containers on Linux; Windows containers on Windows) |

Key pieces: **Docker Engine** (daemon `dockerd` + CLI), **images**, **containers**, **Dockerfile**, **registries** (Docker Hub, Azure Container Registry, GitHub Container Registry), **volumes**, **networks**, **Docker Compose**. Standards: the **OCI** (Open Container Initiative) image and runtime specs; low-level runtimes **containerd** and **runc**.

# Versions

| Year | Milestone |
|---|---|
| 2008 | Linux Containers (LXC) |
| 2013 | Docker open-sourced by dotCloud (PyCon demo) |
| 2014 | Docker 1.0; Docker Compose (from Fig) |
| 2015 | Open Container Initiative (OCI) founded; Docker Swarm |
| 2016 | Docker for Mac/Windows; Windows Server containers |
| 2017 | **Multi-stage builds** (17.05); Moby project; containerd donated to CNCF; version scheme YY.MM |
| 2019 | Docker Enterprise sold to Mirantis |
| 2020 | **BuildKit** default path; Compose Specification |
| 2021 | Docker Desktop requires a paid subscription for larger companies (>250 employees or >$10M revenue) |
| 2022 | Kubernetes removes dockershim (v1.24) — Docker-built images still run fine |
| 2023 | **Docker Compose v2** (`docker compose`) replaces `docker-compose`; Docker Scout; Docker Init |
| 2024–2025 | Docker Engine 27/28: Docker Build Cloud, Docker Desktop AI features, hardened images |

.NET images: `mcr.microsoft.com/dotnet/sdk` (build), `aspnet` (ASP.NET Core runtime), `runtime` (console apps), `runtime-deps` (self-contained/AOT). Since .NET 8 they run as a **non-root** `app` user and default to port **8080**.

# Lifecycle

**Container lifecycle:**

`docker create` → **Created** → `docker start` → **Running** → `docker pause` → **Paused** → `docker unpause` → Running → `docker stop` (SIGTERM, then SIGKILL after 10 s) → **Exited** → `docker start` again or `docker rm` → **Removed**. `docker run` = create + start. `docker kill` sends SIGKILL immediately. Restart policies: `no`, `on-failure`, `always`, `unless-stopped`.

**Image lifecycle:** write **Dockerfile** → `docker build` (each instruction creates a cached **layer**) → `docker tag` → `docker push` to a registry → `docker pull` on the target → `docker run` → update → rebuild/retag → prune old images.

**Dev-to-prod flow:** code → Dockerfile → CI builds and tests the image → scan for vulnerabilities → push with an immutable tag (git SHA) → deploy to Kubernetes/Azure Container Apps/App Service → monitor.

# Tools

| Tool | Use |
|---|---|
| Docker Desktop (Windows/Mac), Docker Engine (Linux) | Run containers locally |
| Podman, Rancher Desktop, colima | Docker alternatives |
| Docker Compose | Multi-container apps for dev/test |
| BuildKit / `docker buildx` | Fast, multi-platform builds |
| Visual Studio container tools, VS Code Dev Containers / Container Tools | Build, debug in containers |
| .NET SDK container publishing (`dotnet publish -t:PublishContainer`) | Build images without a Dockerfile |
| Azure Container Registry, Docker Hub, GHCR | Registries |
| Docker Scout, Trivy, Grype, Microsoft Defender for Containers | Vulnerability scanning |
| Hadolint | Dockerfile linting |
| Dive | Inspect image layers |
| Testcontainers | Real dependencies in integration tests |

# Module: Core Concepts

## Lesson: [Basic|High] Images, containers, layers and registries

- **Image** — read-only template made of stacked **layers** (each Dockerfile instruction adds one). Identified by `repository:tag` (e.g. `myacr.azurecr.io/shop-api:1.4.2`) and an immutable **digest** (`@sha256:...`).
- **Container** — image + a thin writable layer + runtime config (env vars, ports, mounts). Changes in the writable layer are lost when the container is removed.
- **Layer caching** — unchanged layers are reused between builds and shared between images on disk (copy-on-write via the overlay2 storage driver).
- **Registry** — stores images; **repository** — one image name with many tags.

```bash
docker pull mcr.microsoft.com/dotnet/aspnet:10.0
docker images
docker run -d --name web -p 8080:8080 -e ASPNETCORE_ENVIRONMENT=Development shop-api:dev
docker ps -a
docker logs -f web
docker exec -it web /bin/sh          # shell inside (if the image has one)
docker stop web && docker rm web
docker image prune -a                 # remove unused images
docker system df                      # disk usage
```

> **Interview tip:** never use the `latest` tag in production — use immutable version tags or digests so deployments are reproducible.

## Lesson: [Basic|High] Dockerfile instructions

| Instruction | Purpose |
|---|---|
| `FROM` | Base image (can appear multiple times for multi-stage) |
| `WORKDIR` | Set working directory |
| `COPY` / `ADD` | Copy files (ADD also extracts tar and fetches URLs — prefer COPY) |
| `RUN` | Execute a command at **build** time (creates a layer) |
| `ENV` | Environment variable (build + runtime) |
| `ARG` | Build-time variable only |
| `EXPOSE` | Document the listening port (doesn't publish it) |
| `USER` | Run as a non-root user |
| `ENTRYPOINT` | The executable that always runs |
| `CMD` | Default arguments (or command) — overridable at `docker run` |
| `HEALTHCHECK` | Command to test container health |
| `LABEL`, `VOLUME`, `STOPSIGNAL`, `SHELL` | Metadata, mount points, signals |

**CMD vs ENTRYPOINT:** `ENTRYPOINT ["dotnet", "Api.dll"]` fixes the program; `CMD ["--urls", "http://+:8080"]` supplies default args that `docker run image <args>` replaces. Use the **exec form** (JSON array) so the app is PID 1 and receives SIGTERM for graceful shutdown.

## Lesson: [Intermediate|High] Multi-stage Dockerfile for ASP.NET Core

```dockerfile
# syntax=docker/dockerfile:1
# ---- build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/Shop.Api/Shop.Api.csproj", "src/Shop.Api/"]
COPY ["src/Shop.Core/Shop.Core.csproj", "src/Shop.Core/"]
RUN dotnet restore "src/Shop.Api/Shop.Api.csproj"          # cached until a .csproj changes
COPY . .
RUN dotnet publish "src/Shop.Api/Shop.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ---- runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
USER app                                                     # non-root user built into .NET 8+ images
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENTRYPOINT ["dotnet", "Shop.Api.dll"]
```

Health checks: the `aspnet` images don't include `curl`/`wget`. In Kubernetes or Container Apps, use HTTP probes against `app.MapHealthChecks("/health")`. For a plain Docker `HEALTHCHECK`, install a small tool in the final stage, or ship a tiny health-check executable.

Why multi-stage: the final image contains only the runtime + published output (~100–200 MB) instead of the full SDK (~800 MB+), so it is smaller, faster to pull, and has a smaller attack surface. Copy `.csproj` files and restore **before** copying the source to maximise layer caching.

**.dockerignore** (like .gitignore for the build context): `bin/`, `obj/`, `.git`, `.vs`, `node_modules`, `*.user`, secrets.

Alternative without a Dockerfile:

```bash
dotnet publish -t:PublishContainer -p:ContainerRepository=shop-api -p:ContainerImageTag=1.0.0
```

Even smaller images: `-chiseled` Ubuntu variants (distroless-style, no shell or package manager), Alpine variants, or Native AOT on `runtime-deps`.

## Lesson: [Basic|High] Volumes, bind mounts and networking

| Storage | What | Use |
|---|---|---|
| **Named volume** | Managed by Docker (`docker volume create`) | Database data, persistent app data |
| **Bind mount** | Host folder mapped into the container | Source code during development, config files |
| **tmpfs** | In memory only | Secrets/temp data that must not touch disk |

```bash
docker run -d --name sql -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='<strong-password>' \
  -p 1433:1433 -v sqldata:/var/opt/mssql mcr.microsoft.com/mssql/server:2022-latest

docker network create shopnet
docker run -d --name api --network shopnet shop-api:1.0     # reachable as http://api:8080 by other containers on shopnet
```

Network drivers: **bridge** (default; user-defined bridges give DNS by container name), **host** (share host network stack), **none**, **overlay** (multi-host, Swarm), **macvlan**. `-p 8080:80` publishes host port 8080 → container port 80.

# Module: Docker Compose

## Lesson: [Intermediate|High] Compose for a .NET API + SQL Server + Redis

```yaml
# compose.yaml
services:
  api:
    build:
      context: .
      dockerfile: src/Shop.Api/Dockerfile
    ports:
      - "8080:8080"
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__Db: "Server=sql;Database=Shop;User Id=sa;Password=${SA_PASSWORD};TrustServerCertificate=True"
      ConnectionStrings__Redis: "redis:6379"
    depends_on:
      sql:
        condition: service_healthy
      redis:
        condition: service_started
  sql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: ${SA_PASSWORD}
    volumes:
      - sqldata:/var/opt/mssql
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"$$MSSQL_SA_PASSWORD\" -C -Q 'SELECT 1' || exit 1"]
      interval: 10s
      retries: 10
  redis:
    image: redis:7-alpine
volumes:
  sqldata:
```

```bash
docker compose up -d --build      # build + start everything
docker compose ps
docker compose logs -f api
docker compose exec api sh
docker compose down               # stop and remove containers + network (add -v to delete volumes)
```

Compose creates a default network so services reach each other by **service name** (`sql`, `redis`). `${SA_PASSWORD}` comes from a `.env` file (keep it out of Git). `depends_on` controls start order; with `condition: service_healthy` it waits for the health check.

# Module: Production Practices

## Lesson: [Intermediate|High] Image size, security and best practices

1. Multi-stage builds; minimal base images (`aspnet`, chiseled, Alpine); pin versions (`aspnet:10.0` or a digest).
2. Run as **non-root** (`USER app`); read-only root filesystem where possible; drop Linux capabilities.
3. **No secrets in images** (not in `ENV`, `ARG` or copied files — they stay in layer history). Inject at runtime via environment/secret stores (Key Vault, Kubernetes Secrets, Docker secrets); use BuildKit `--mount=type=secret` for build-time secrets.
4. Order instructions from least to most frequently changing for cache hits; combine `RUN` steps and clean package caches in the same layer.
5. `.dockerignore` to keep the build context small and avoid leaking files.
6. Scan images in CI (Trivy, Docker Scout, Defender) and rebuild regularly to pick up base image patches.
7. One process (concern) per container; log to **stdout/stderr**.
8. Add `HEALTHCHECK` (Docker/Compose) or liveness/readiness probes (Kubernetes).
9. Handle SIGTERM for graceful shutdown (ASP.NET Core does by default; keep the exec form).
10. Sign images (Notation/cosign) and use immutable tags.

## Lesson: [Intermediate|Medium] Debugging containers

```bash
docker logs --tail 100 api
docker inspect api                       # config, env, mounts, IP, health status
docker exec -it api sh                   # look around (not available in chiseled images)
docker stats                             # live CPU/memory
docker top api                           # processes
docker events                            # daemon events (OOM kills, restarts)
docker run --rm -it --entrypoint sh shop-api:1.0      # override entrypoint to inspect an image
docker cp api:/app/appsettings.json .                 # copy files out
docker history shop-api:1.0                           # layers and sizes
```

Common issues: app listening on `localhost` instead of `0.0.0.0` inside the container (ASP.NET Core images listen on all interfaces on 8080); wrong port mapping (80 vs 8080 after .NET 8); exit code **137** = killed (OOM or SIGKILL); **139** = segfault; container exits immediately because the main process ended; file permission errors when running as non-root; DNS between containers needs a user-defined network.

## Lesson: [Intermediate|Medium] Where containers run in Azure

| Service | When |
|---|---|
| **Azure Container Apps** | Serverless containers/microservices, scale to zero, KEDA autoscaling, Dapr — easiest |
| **Azure Kubernetes Service (AKS)** | Full Kubernetes control, complex platforms |
| **Azure App Service (Web App for Containers)** | Simple web apps/APIs from an image |
| **Azure Container Instances (ACI)** | Single containers, batch jobs, quick runs |
| **Azure Functions on Container Apps** | Event-driven functions in containers |
| **Azure Container Registry (ACR)** | Private registry, geo-replication, ACR Tasks builds |

# Interview

## [Beginner|High] What is Docker and why use it?

Docker is a platform to build, ship and run applications in containers. A container packages the app with its runtime and dependencies, so it runs identically everywhere ("works on my machine" disappears). Benefits: consistent environments across dev/test/prod, fast startup, high density, isolation between apps, easy scaling, and a standard artifact for CI/CD and orchestrators like Kubernetes.

## [Beginner|High] What is the difference between a container and a virtual machine?

A VM virtualises hardware and runs a full guest OS with its own kernel on a hypervisor — strong isolation, GBs in size, minutes to boot. A container virtualises at the OS level: isolated processes sharing the host kernel using namespaces (isolation) and cgroups (resource limits) — MBs in size, starts in seconds, much higher density. Containers can run inside VMs (as in most clouds).

## [Beginner|High] What is the difference between an image and a container?

An image is a read-only, layered template (filesystem + metadata) built from a Dockerfile. A container is a running (or stopped) instance of an image with its own writable layer, network and process. One image can start many containers, just like a class and its objects.

## [Beginner|High] Explain the common Dockerfile instructions. CMD vs ENTRYPOINT? COPY vs ADD?

FROM (base image), WORKDIR, COPY/ADD, RUN (build-time command), ENV/ARG, EXPOSE, USER, HEALTHCHECK, ENTRYPOINT and CMD. ENTRYPOINT defines the executable that always runs; CMD supplies default arguments (or a default command) that `docker run` arguments override. COPY copies local files; ADD also auto-extracts local tar archives and can download URLs — prefer COPY for clarity and security.

## [Beginner|High] What is a multi-stage build and why use it?

A Dockerfile with several FROM stages: an early stage (e.g. .NET SDK) compiles and publishes the app; the final stage starts from a small runtime image and copies only the build output with `COPY --from=build`. Result: much smaller images without compilers or source code, faster deployments, smaller attack surface — all in one Dockerfile.

## [Beginner|Medium] What is the difference between a volume and a bind mount?

Volumes are managed by Docker (stored under Docker's data directory), portable, easy to back up and the preferred way to persist container data like databases. Bind mounts map a specific host path into the container — great for live-editing source code in development but tied to the host's folder structure and permissions. Data in the container's writable layer disappears when the container is removed.

## [Intermediate|High] What is Docker Compose and when would you use it?

A tool for defining and running multi-container applications with a YAML file (`compose.yaml`): services, images/builds, ports, environment, volumes, networks, dependencies and health checks. `docker compose up` starts everything. Used for local development environments (API + SQL Server + Redis + RabbitMQ), integration tests and simple single-host deployments. For production clusters, use Kubernetes or Azure Container Apps.

## [Intermediate|High] How do containers in Docker communicate with each other?

Through Docker networks. On a user-defined bridge network (or Compose's default network), containers resolve each other by container/service name via Docker's embedded DNS (`http://api:8080`, `Server=sql`). The default `bridge` network doesn't provide name resolution. Published ports (`-p`) are only needed for access from the host or outside, not between containers.

## [Intermediate|High] How do you reduce Docker image size?

Use multi-stage builds; small base images (aspnet runtime instead of SDK, chiseled/Alpine variants, runtime-deps with self-contained/AOT); a `.dockerignore`; combine RUN commands and remove caches in the same layer; don't install unnecessary tools; publish trimmed/AOT apps where suitable. Check layers with `docker history` or Dive.

## [Intermediate|High] How do you handle secrets with Docker?

Never bake secrets into images (ENV, ARG, or copied files persist in layers and history). Supply them at runtime: environment variables from a secure source, mounted secret files (Docker/Compose secrets, Kubernetes Secrets), or fetch from Azure Key Vault using managed identity. For build-time secrets (private NuGet feed tokens), use BuildKit `RUN --mount=type=secret`. Keep `.env` files out of Git.

## [Intermediate|Medium] What is layer caching? How do you write a cache-friendly Dockerfile?

Each instruction produces a layer; Docker reuses a cached layer if the instruction and its inputs haven't changed, and invalidates all layers after the first change. Put rarely changing steps first: copy only `.csproj` files and run `dotnet restore` before copying the rest of the source, so code changes don't re-download packages. Use BuildKit cache mounts for package caches.

## [Intermediate|Medium] What do container exit codes 0, 1, 137 and 143 mean?

0 = normal exit; 1 = application error; 137 = killed with SIGKILL (128+9) — often out-of-memory (OOMKilled) or forced stop after timeout; 143 = terminated by SIGTERM (128+15) — normal graceful stop; 139 = segmentation fault. Check `docker inspect` (State.OOMKilled) and logs.

## [Advanced|Medium] How does Docker isolate containers under the hood?

Linux **namespaces** isolate what a process can see — PID, network, mount, UTS (hostname), IPC, user and cgroup namespaces. **cgroups** limit and account resources (CPU, memory, I/O). **Union/overlay filesystems** provide layered images with copy-on-write. Security layers: capabilities, seccomp profiles, AppArmor/SELinux, user namespaces/rootless mode. containerd and runc (OCI runtime) actually create the containers.

## [Advanced|Medium] Why did Kubernetes "remove Docker" and does it matter?

Kubernetes 1.24 removed **dockershim**, the adapter that let the kubelet talk to Docker Engine. Kubernetes now talks to CRI-compatible runtimes (containerd, CRI-O) directly. Images built with Docker are OCI images and run unchanged. It only matters if something relied on the Docker socket inside nodes (e.g. Docker-in-Docker builds) — use BuildKit/Kaniko/ACR Tasks instead.

## [Scenario|High] Your ASP.NET Core container starts but you get "connection refused" on http://localhost:8080. What do you check?

Is the port published (`-p 8080:8080`)? Which port does the app listen on — .NET 8+ images default to 8080 (`ASPNETCORE_HTTP_PORTS`), older ones to 80. Is the app bound to `0.0.0.0`/`+` rather than `localhost` inside the container? Did the container crash (`docker ps -a`, `docker logs`)? Is HTTPS redirection forcing 443 without a certificate? On Windows, is another process using the port? Check `docker inspect` for port bindings and health status.

## [Scenario|High] The image is 2.1 GB and deploys slowly. How do you shrink it?

Inspect with `docker history`/Dive. Typical fixes: switch to a multi-stage build so the SDK and source aren't in the final image; use `mcr.microsoft.com/dotnet/aspnet` (or chiseled) as the final base; add `.dockerignore` (bin/obj/.git/node_modules); remove build tools and caches in the same RUN layer; don't copy test projects; consider trimming/AOT. Target size: ~100–250 MB for a typical ASP.NET Core API.

## [Scenario|Medium] A container keeps restarting with exit code 137. What's happening?

It's being killed — most often **out of memory**: the container exceeded its memory limit (`docker inspect` shows `OOMKilled: true`, or Kubernetes shows `OOMKilled`). Investigate memory usage (`docker stats`, dotnet-counters), raise the limit appropriately, fix leaks, and make sure .NET respects container limits (it does by default; tune `DOTNET_GCHeapHardLimit` or Server/Workstation GC if needed). It can also be a failing liveness probe or a forced stop after SIGTERM timeout.

## [Scenario|Medium] Developers need SQL Server, Redis and RabbitMQ locally to run the API. How do you make onboarding one command?

Write a `compose.yaml` with the API (built from its Dockerfile), SQL Server (named volume + health check), Redis and RabbitMQ (management image), a shared network, and environment variables pointing the API at service names; put passwords in a `.env` file excluded from Git with a `.env.example` template; add a seed/migration step (EF migration bundle container or init script). Onboarding = `git clone && docker compose up -d`. Alternatively use .NET Aspire's AppHost to orchestrate the same dependencies.

# Cheatsheet

## CLI

```bash
docker build -t app:1.0 .            docker run -d -p 8080:8080 --name a app:1.0
docker ps -a                          docker logs -f a
docker exec -it a sh                  docker stop a && docker rm a
docker images                         docker rmi app:1.0
docker tag app:1.0 myacr.azurecr.io/app:1.0
docker push myacr.azurecr.io/app:1.0  docker pull ...
docker volume ls / create / rm        docker network ls / create
docker inspect a                      docker stats
docker system prune -a                docker history app:1.0
```

## Compose

```bash
docker compose up -d --build | ps | logs -f svc | exec svc sh | down [-v]
```

## Dockerfile essentials

FROM · WORKDIR · COPY (prefer) / ADD · RUN · ENV / ARG · EXPOSE · USER · HEALTHCHECK · ENTRYPOINT (exec form) + CMD (default args) · multi-stage `COPY --from=build`.

## .NET specifics

Images: sdk / aspnet / runtime / runtime-deps · .NET 8+: port **8080**, non-root `app` user · `dotnet publish -t:PublishContainer` · chiseled images.

## Lifecycle

Created → Running → Paused → Exited → Removed · stop = SIGTERM then SIGKILL (10 s) · restart policies: no / on-failure / always / unless-stopped.

## Exit codes

0 ok · 1 app error · 137 SIGKILL/OOM · 139 segfault · 143 SIGTERM.

## Best practices

Multi-stage · small pinned base · non-root · no secrets in layers · .dockerignore · cache-friendly order · scan images · logs to stdout · health checks · immutable tags.
