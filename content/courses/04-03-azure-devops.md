---
slug: azure-devops
title: Azure DevOps & CI/CD
track: devops-cloud
order: 3
icon: ADO
color: #0078d4
summary: Boards, Repos, Pipelines, Test Plans and Artifacts; YAML pipelines (stages, jobs, steps, templates, variables, environments, approvals), agents, service connections, branching and release strategies, and DevOps practices.
---

# Overview

**DevOps** is a culture and set of practices that unite development and operations to deliver software **faster, more reliably and continuously** — automation (CI/CD, infrastructure as code), collaboration, monitoring and feedback.

**Azure DevOps** (cloud: **Azure DevOps Services**; on-prem: **Azure DevOps Server**) is Microsoft's suite of DevOps tools:

| Service | Purpose |
|---|---|
| **Azure Boards** | Work tracking: Epics, Features, User Stories/PBIs, Tasks, Bugs; Kanban boards, sprints, backlogs, queries, dashboards |
| **Azure Repos** | Git repositories (and legacy TFVC), pull requests, branch policies |
| **Azure Pipelines** | CI/CD for any language/platform/cloud (YAML or classic) |
| **Azure Test Plans** | Manual and exploratory testing, test cases and suites |
| **Azure Artifacts** | Package feeds: NuGet, npm, Maven, Python, Universal packages |

Key DevOps terms: **CI** (continuous integration — every commit is built and tested), **CD** (continuous delivery — always releasable, deploy with approval; continuous deployment — automatically to production), **IaC** (infrastructure as code — Bicep, ARM, Terraform), **shift-left** (test and secure early), **DORA metrics** (deployment frequency, lead time for changes, change failure rate, time to restore service).

# Versions

| Year | Milestone |
|---|---|
| 2005 | **Team Foundation Server (TFS)** 2005 — on-prem ALM with TFVC |
| 2012 | Team Foundation Service (cloud preview) |
| 2013 | Git support in TFS; **Visual Studio Online** |
| 2015 | Renamed **Visual Studio Team Services (VSTS)**; new build system |
| 2017 | YAML builds preview |
| **2018** | VSTS renamed **Azure DevOps Services**; TFS → Azure DevOps Server (2019); multi-stage YAML pipelines introduced (GA 2020) |
| 2019–2022 | Azure DevOps Server 2019, 2020, 2022; environments, approvals and checks; deprecated classic release features in new orgs gradually |
| 2023–2025 | Workload identity federation for service connections (GA 2024), GitHub Advanced Security for Azure DevOps, Managed DevOps Pools (2024), Azure DevOps Server (2025, version-less "modern lifecycle" release) |

Microsoft also owns **GitHub**; GitHub Actions is the other major CI/CD option — many organisations use GitHub repos with Azure Boards/Pipelines, or migrate to GitHub entirely.

# Lifecycle

**DevOps lifecycle (infinite loop):** Plan → Code → Build → Test → Release → Deploy → Operate → Monitor → (feedback) Plan...

**Work item lifecycle (Agile process):** User Story: New → Active → Resolved → Closed (Removed). Bug: New → Active → Resolved → Closed. Scrum process: PBI: New → Approved → Committed → Done.

**Pull request lifecycle:** create branch → commits → open PR → **branch policies** run (build validation pipeline, minimum reviewers, linked work items, comment resolution, status checks) → review/approve → complete (merge/squash/rebase) → branch deleted → CI on main.

**YAML pipeline run lifecycle:**

1. **Trigger** — CI (push to branch/path), PR trigger, schedule (cron), pipeline completion, manual.
2. **Template expansion** — compile-time expressions `${{ }}` and templates are expanded.
3. **Stages** run (sequentially by default, or by `dependsOn`).
4. Each **job** is queued to an **agent pool**; the agent downloads the repo (`checkout`), runs **steps** (tasks/scripts), with runtime expressions `$[ ]` and macro variables `$( )`.
5. **Artifacts** published between stages.
6. Deployment jobs target **environments**; **approvals and checks** (manual approval, business hours, Azure Monitor alerts, required template) gate them.
7. Results, logs, tests and coverage published; notifications sent; retention policy applies.

# Tools

| Tool | Use |
|---|---|
| Azure DevOps portal (dev.azure.com/{org}) | Everything |
| `az devops` / `az pipelines` / `az repos` / `az boards` CLI | Scripting |
| Microsoft-hosted agents (`ubuntu-latest`, `windows-latest`, `macos-latest`) | Zero-maintenance build machines |
| Self-hosted agents / Managed DevOps Pools / VM scale set agents | Private network access, custom tools |
| Visual Studio / VS Code / Git | Repos, PRs, work item linking (AB#123) |
| Bicep / ARM / Terraform / Pulumi | Infrastructure as code |
| SonarQube/SonarCloud, Microsoft Defender for DevOps, GitHub Advanced Security for Azure DevOps | Quality and security scanning |
| Azure Key Vault (variable groups linked) | Secrets |
| Azure Monitor / Application Insights | Monitor deployments |
| GitHub Actions | Alternative CI/CD |

# Module: Boards and Repos

## Lesson: [Basic|High] Azure Boards and Agile planning

- Process templates: **Basic** (Epic → Issue → Task), **Agile** (Epic → Feature → User Story → Task, Bug), **Scrum** (Epic → Feature → Product Backlog Item → Task, Bug, Impediment), **CMMI** (Requirement, Change Request, Risk). Inherited processes allow custom fields/states.
- **Backlogs** (prioritised list), **Boards** (Kanban columns, WIP limits, swimlanes), **Sprints** (iteration paths, capacity, burndown), **Area paths** (teams/components), **Queries** (WIQL), **Dashboards**, **Delivery plans**.
- Link commits/PRs to work items with `AB#1234` (GitHub) or the work item ID in Azure Repos; PR completion can auto-resolve linked items.

## Lesson: [Basic|High] Azure Repos, branching strategies and branch policies

Branching strategies:

| Strategy | Description | Fits |
|---|---|---|
| **Trunk-based** | Short-lived feature branches merged to `main` daily; feature flags | CI/CD, high deploy frequency |
| **GitHub flow** | `main` always deployable; feature branch → PR → merge → deploy | Web apps, SaaS |
| **GitFlow** | `main`, `develop`, `feature/*`, `release/*`, `hotfix/*` | Scheduled releases, multiple versions |
| Release branches | `release/2026.10` cut for stabilisation, fixes cherry-picked | Enterprise products |

**Branch policies** on `main`: require PR (no direct pushes), minimum number of reviewers (and reset votes on new pushes), linked work items, comment resolution, **build validation** (PR pipeline must pass), automatically included reviewers (CODEOWNERS-like by path), limit merge types (squash), status checks (SonarQube, security).

# Module: Azure Pipelines

## Lesson: [Basic|High] YAML pipeline structure

```yaml
# azure-pipelines.yml
trigger:
  branches: { include: [main] }
  paths: { exclude: [docs/*, README.md] }
pr:
  branches: { include: [main] }

pool:
  vmImage: ubuntu-latest

variables:
  buildConfiguration: Release
  dotnetVersion: 10.0.x

stages:
- stage: Build
  jobs:
  - job: BuildTest
    steps:
    - task: UseDotNet@2
      inputs: { packageType: sdk, version: $(dotnetVersion) }
    - script: dotnet restore
      displayName: Restore
    - script: dotnet build --no-restore -c $(buildConfiguration)
      displayName: Build
    - script: dotnet test --no-build -c $(buildConfiguration) --logger trx --collect:"XPlat Code Coverage"
      displayName: Test
    - task: PublishTestResults@2
      condition: succeededOrFailed()
      inputs: { testResultsFormat: VSTest, testResultsFiles: '**/*.trx' }
    - script: dotnet publish src/Shop.Api -c $(buildConfiguration) -o $(Build.ArtifactStagingDirectory)/api
      displayName: Publish
    - publish: $(Build.ArtifactStagingDirectory)/api
      artifact: api
```

Hierarchy: **Pipeline → Stages → Jobs → Steps** (tasks or scripts). A **job** runs on one agent; jobs in a stage can run in parallel; stages run in order unless `dependsOn` says otherwise.

## Lesson: [Intermediate|High] Multi-stage CD with environments and approvals

```yaml
- stage: DeployDev
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: DeployApi
    environment: shop-dev                 # environment = deployment target + history + checks
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: api
          - task: AzureWebApp@1
            inputs:
              azureSubscription: sc-shop-dev            # service connection (workload identity federation)
              appName: app-shop-dev
              package: $(Pipeline.Workspace)/api

- stage: DeployProd
  dependsOn: DeployDev
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployApi
    environment: shop-prod                # approvals & checks configured on this environment in the UI
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: api
          - task: AzureWebApp@1
            inputs:
              azureSubscription: sc-shop-prod
              appName: app-shop-prod
              package: $(Pipeline.Workspace)/api
              deployToSlotOrASE: true
              resourceGroupName: rg-shop-prod
              slotName: staging
          - task: AzureAppServiceManage@0
            inputs: { azureSubscription: sc-shop-prod, Action: Swap Slots, WebAppName: app-shop-prod, ResourceGroupName: rg-shop-prod, SourceSlot: staging }
```

Deployment job strategies: `runOnce`, `rolling` (VMs), `canary` (with increments). **Approvals and checks** on environments: manual approvals, branch control, business hours, Azure Monitor alerts query, invoke REST/Azure Function, exclusive lock, required template.

## Lesson: [Intermediate|High] Variables, variable groups, secrets and expressions

```yaml
variables:
- group: shop-prod-secrets            # variable group, optionally linked to Azure Key Vault
- name: imageTag
  value: $(Build.BuildId)
- ${{ if eq(variables['Build.SourceBranchName'], 'main') }}:
  - name: env
    value: prod
```

| Syntax | Evaluated | Example |
|---|---|---|
| `${{ variables.x }}` | **Compile time** (template expansion) | conditions in templates, parameters |
| `$[ variables.x ]` | **Runtime**, before a job/stage | `condition`, variables based on dependencies |
| `$(x)` | **Macro**, just before a task runs | task inputs, scripts |

- **Secret variables** are masked in logs and not passed to scripts automatically — map them via `env:`.
- **Predefined variables**: `Build.BuildId`, `Build.SourceBranch`, `Build.Reason`, `System.DefaultWorkingDirectory`, `Pipeline.Workspace`, `Agent.OS`.
- Set variables from scripts: `echo "##vso[task.setvariable variable=ver;isOutput=true]1.2.3"`; output variables are used across jobs via `dependencies.Job.outputs['step.ver']`.
- **Runtime parameters** (`parameters:` at top) let users pick values when running manually (typed: string, boolean, number, object).

## Lesson: [Intermediate|High] Templates and reuse

```yaml
# templates/dotnet-build.yml
parameters:
- name: project
  type: string
- name: configuration
  type: string
  default: Release
steps:
- script: dotnet build ${{ parameters.project }} -c ${{ parameters.configuration }}
- script: dotnet test ${{ parameters.project }} -c ${{ parameters.configuration }}

# azure-pipelines.yml
steps:
- template: templates/dotnet-build.yml
  parameters: { project: src/Shop.sln }
```

Template types: **step**, **job**, **stage**, **variable** templates, and **extends** templates (a pipeline must extend an approved template — enforce security/compliance via the "required template" check). Share templates across repos with `resources: repositories:`.

## Lesson: [Intermediate|Medium] Agents, pools and service connections

- **Microsoft-hosted agents** — fresh VM per job, preinstalled tools, no maintenance; limited free minutes/parallel jobs; no access to private networks.
- **Self-hosted agents** — your VM/container; persistent caches; reach on-prem/private resources; you patch them. Scale with **VM scale set agents** or **Managed DevOps Pools**.
- **Parallel jobs** — licensed concurrency.
- **Service connections** — secure, reusable credentials to external systems: Azure Resource Manager (prefer **workload identity federation** — no secrets to rotate), Docker registry, Kubernetes, GitHub, generic. Restrict per pipeline and add approvals.
- **Agent capabilities/demands** — route jobs to agents with required tools.

## Lesson: [Intermediate|High] Container and Kubernetes pipelines

```yaml
- task: Docker@2
  inputs:
    containerRegistry: sc-acr
    repository: shop-api
    command: buildAndPush
    Dockerfile: src/Shop.Api/Dockerfile
    tags: |
      $(Build.BuildId)
      latest
- task: KubernetesManifest@1
  inputs:
    action: deploy
    connectionType: azureResourceManager
    azureSubscriptionConnection: sc-shop-prod
    azureResourceGroup: rg-shop
    kubernetesCluster: aks-shop
    namespace: shop
    manifests: k8s/*.yaml
    containers: myacr.azurecr.io/shop-api:$(Build.BuildId)
```

Also: `HelmDeploy@1` task, Kubernetes environments (resource view of pods per deployment), or GitOps (pipeline updates a manifest repo; Argo CD/Flux deploys).

## Lesson: [Intermediate|Medium] Infrastructure as Code in pipelines

```yaml
- task: AzureCLI@2
  inputs:
    azureSubscription: sc-shop-prod
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: |
      az deployment group what-if -g rg-shop-prod -f infra/main.bicep -p env=prod
      az deployment group create  -g rg-shop-prod -f infra/main.bicep -p env=prod
```

- **Bicep** (Azure-native, compiles to ARM JSON), **ARM templates**, **Terraform** (multi-cloud, state file in Azure Storage with locking), Pulumi.
- Practices: plan/what-if on PR, apply after approval, store state securely, use modules, separate environments by parameters, detect drift.

## Lesson: [Basic|Medium] Azure Artifacts and Test Plans

- **Artifacts** feeds host NuGet/npm/Maven/Python/Universal packages, with **upstream sources** (cache nuget.org/npmjs), views (`@local`, `@prerelease`, `@release`), retention policies. Authenticate in pipelines with `NuGetAuthenticate@1`.
- **Test Plans**: test plans → suites (static, requirement-based, query-based) → test cases with steps; manual test runner, exploratory testing (Test & Feedback extension), traceability to requirements; automated tests can be associated with test cases.

# Interview

## [Beginner|High] What is DevOps? What are CI and CD?

DevOps combines development and operations culture, practices and tools to deliver value faster and more reliably: automation, collaboration, small batches, fast feedback and monitoring. CI (Continuous Integration): developers merge frequently, and every change is automatically built and tested. CD: Continuous Delivery keeps every build releasable and deploys to production with a manual approval; Continuous Deployment deploys every passing change to production automatically.

## [Beginner|High] What services does Azure DevOps provide?

Azure Boards (work tracking, Kanban, sprints), Azure Repos (Git repos, PRs, branch policies), Azure Pipelines (CI/CD for any platform/cloud), Azure Test Plans (manual/exploratory testing), Azure Artifacts (package feeds). Available as Azure DevOps Services (cloud) and Azure DevOps Server (on-prem, formerly TFS).

## [Beginner|High] Explain the structure of a YAML pipeline.

A pipeline has triggers, optional variables/parameters/resources, and **stages** (e.g. Build, DeployDev, DeployProd); each stage contains **jobs** that run on an agent; each job has **steps** — tasks (prebuilt, like `DotNetCoreCLI@2`, `AzureWebApp@1`) or scripts. Deployment jobs target environments with approvals. Artifacts pass outputs between stages.

## [Beginner|High] YAML pipelines vs classic pipelines?

Classic build and release pipelines are configured in the web UI (release pipelines with stages, artifacts and gates). YAML pipelines are pipelines-as-code stored in the repo: versioned, reviewed in PRs, branchable, reusable via templates, and support multi-stage CI/CD with environments and checks. Microsoft recommends YAML; some classic features are being retired or disabled for new organisations.

## [Beginner|Medium] What is an agent? Microsoft-hosted vs self-hosted?

An agent is software on a machine that runs pipeline jobs. Microsoft-hosted agents are fresh VMs provided per job, preconfigured with common tools, no maintenance, but no private network access and cache isn't kept. Self-hosted agents run on your machines/containers: custom tools, persistent caches, access to on-prem/private resources, but you maintain and secure them. Managed DevOps Pools offer Microsoft-managed agents with private networking.

## [Intermediate|High] What are branch policies and why use them?

Rules on protected branches (e.g. `main`) enforced on pull requests: require PRs, minimum reviewers, linked work items, resolved comments, successful build validation pipeline, required reviewers by path, allowed merge types, external status checks. They keep `main` always buildable and reviewed, enforce quality gates, and create traceability.

## [Intermediate|High] How do you manage secrets in Azure Pipelines?

Store them as secret variables or in variable groups linked to **Azure Key Vault** (or fetch with the `AzureKeyVault@2` task). Secrets are masked in logs and must be mapped explicitly into scripts via `env`. Use service connections with **workload identity federation** (no stored client secrets), restrict pipeline permissions on variable groups/service connections, add approvals, and never commit secrets to the repo (enable secret scanning).

## [Intermediate|High] What are environments, approvals and checks?

An environment represents a deployment target (dev, test, prod — or Kubernetes namespaces/VMs) with deployment history and traceability. Approvals and checks configured on the environment gate deployment jobs: manual approvers, branch control (only from main), business hours, Azure Monitor alert queries, REST/Function checks, exclusive lock (one deployment at a time), required templates. They replace classic release gates.

## [Intermediate|High] What is the difference between `${{ }}`, `$[ ]` and `$( )`?

`${{ }}` are template (compile-time) expressions, evaluated when the YAML is parsed — used for parameters, conditional insertion and template logic. `$[ ]` are runtime expressions evaluated before a job/stage runs — used in conditions and variables depending on other jobs' outputs. `$( )` is macro syntax replaced just before a task executes — used in task inputs and scripts.

## [Intermediate|Medium] How do you reuse pipeline logic across projects?

YAML templates (step, job, stage, variable templates) with typed parameters, stored in a shared repository referenced via `resources.repositories`; `extends` templates to enforce a standard pipeline skeleton (with the required-template check on environments); variable groups for shared settings; task groups in classic pipelines.

## [Intermediate|Medium] What branching strategy would you recommend and why?

For most web/cloud teams: trunk-based development or GitHub flow — short-lived branches, PRs with build validation, frequent merges to main, feature flags for incomplete work, automated deployment through environments with approvals. It reduces merge conflicts and supports CI/CD. GitFlow suits products with scheduled releases and multiple supported versions but adds overhead.

## [Intermediate|Medium] How do you deploy database changes in a pipeline?

Generate idempotent migration scripts in CI (`dotnet ef migrations script --idempotent`, SSDT DACPAC, or DbUp/Flyway scripts), publish them as artifacts, review them, apply in each environment's deployment stage before the app (`SqlAzureDacpacDeployment@1`, `sqlcmd`, EF migration bundle), using backward-compatible (expand/contract) changes so old and new app versions work during rollout. Back up / use point-in-time restore for rollback.

## [Advanced|High] How would you design a CI/CD pipeline for a .NET microservice deployed to AKS?

PR pipeline: restore, build, unit tests, coverage, SonarQube, dependency and secret scanning, Docker build (no push), Bicep/Helm lint. Main pipeline: build and test → build image tagged with commit SHA → scan with Trivy/Defender → push to ACR → deploy to dev via Helm (or update a GitOps repo) → integration/smoke tests → staging with approval → canary or blue-green to production with automated health checks (App Insights/Prometheus) and automatic rollback. Use templates, workload-identity service connections, Key Vault secrets, environments with approvals, and track DORA metrics.

## [Advanced|Medium] What are DORA metrics?

Four key metrics from the DevOps Research and Assessment program: **Deployment frequency**, **Lead time for changes** (commit to production), **Change failure rate** (% of deployments causing failures), and **Time to restore service** (now often "failed deployment recovery time"). They measure delivery performance; elite teams deploy on demand with low failure rates and fast recovery.

## [Scenario|High] The build is green but production broke after deployment. How do you prevent this next time?

Find the gap: missing tests (add integration/contract tests for the failure), environment differences (config, data, secrets — use the same artifact and IaC everywhere), no smoke tests (add post-deploy health checks that fail the stage), big-bang releases (use canary/blue-green or slot swaps with warm-up, feature flags), and no automatic rollback (monitor key metrics and roll back on alerts). Run a blameless post-mortem and add the fix to the pipeline.

## [Scenario|High] Pipelines take 40 minutes and developers are frustrated. How do you speed them up?

Measure each step. Then: cache NuGet/npm packages (`Cache@2`), run independent jobs in parallel (split test projects), use incremental builds and only build changed services (path filters), use faster/self-hosted or Managed DevOps Pool agents with warm caches, avoid rebuilding — build once and promote the same artifact, move slow end-to-end tests to a nightly or post-merge stage, use Docker layer caching, and remove redundant steps.

## [Scenario|Medium] A teammate committed a production connection string to the repo. What do you do?

Treat it as compromised: rotate the credential immediately (change password/key, or switch to managed identity), check access logs, remove it from the code and move it to Key Vault/variable groups, rewrite history only if required by policy (history may already be cloned), enable secret scanning/push protection (GitHub Advanced Security for Azure DevOps) and pre-commit hooks, and run a short blameless review on the process.

## [Scenario|Medium] How do you achieve zero-downtime deployments to Azure App Service from a pipeline?

Deploy to a **staging slot**, warm it up (application initialization / health check path), run smoke tests against the slot URL, then **swap** slots (the swap is instantaneous and warmed); keep slot-specific settings sticky; if issues appear, swap back. Combine with backward-compatible DB migrations and feature flags.

# Cheatsheet

## Azure DevOps services

Boards · Repos · Pipelines · Test Plans · Artifacts.

## YAML hierarchy

trigger/pr/schedules → variables/parameters/resources → stages → jobs (job / deployment) → steps (task / script / template).

## Common tasks

`UseDotNet@2` · `DotNetCoreCLI@2` · `PublishTestResults@2` · `PublishPipelineArtifact@1` · `Docker@2` · `AzureWebApp@1` · `AzureCLI@2` · `AzureKeyVault@2` · `KubernetesManifest@1` · `HelmDeploy@1` · `SqlAzureDacpacDeployment@1` · `Cache@2` · `NuGetAuthenticate@1`.

## Expressions

`${{ }}` compile-time · `$[ ]` runtime · `$( )` macro. Conditions: `succeeded()`, `failed()`, `always()`, `eq()`, `and()`, `or()`, `contains()`.

## Triggers

CI (`trigger`) · PR (`pr`) · `schedules` (cron) · pipeline resources (on another pipeline completing) · manual.

## Security

Workload identity federation service connections · Key Vault variable groups · secret masking · branch policies · environment approvals & checks · required templates · least-privilege pipeline permissions.

## Strategies

Trunk-based / GitHub flow / GitFlow · rolling / blue-green (slots) / canary · build once, deploy many · IaC (Bicep/Terraform) · DORA metrics.
