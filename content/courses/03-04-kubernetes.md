---
slug: kubernetes
title: Kubernetes (K8s) & AKS
track: devops-cloud
order: 4
group: Containers
icon: K8s
color: #326ce5
summary: Cluster architecture, pods, deployments, services, ingress, ConfigMaps and Secrets, probes, resources and autoscaling, storage, StatefulSets, namespaces, RBAC, Helm, rolling updates, troubleshooting and Azure Kubernetes Service.
---

# Overview

**Kubernetes** is an open-source **container orchestration** platform: you declare the desired state (e.g. "run 3 replicas of shop-api:1.4, expose them on port 80"), and Kubernetes continuously makes the actual state match — scheduling containers onto machines, restarting failed ones, scaling, rolling out updates and load balancing.

Created at **Google** (inspired by its internal Borg system), open-sourced in 2014, donated to the **CNCF** (Cloud Native Computing Foundation) in 2015. "K8s" = K + 8 letters + s.

Managed offerings: **AKS** (Azure Kubernetes Service), EKS (AWS), GKE (Google). Local: kind, minikube, k3d, Docker Desktop's Kubernetes.

What Kubernetes gives you: self-healing, horizontal scaling, service discovery and load balancing, rolling updates and rollbacks, config and secret management, storage orchestration, batch jobs, and an extensible API (CRDs and operators).

# Versions

| Version | Year | Notable |
|---|---|---|
| 1.0 | Jul 2015 | First stable release; CNCF formed |
| 1.2–1.6 | 2016–2017 | Deployments, ConfigMaps, DaemonSets, StatefulSets (1.5 beta → 1.9 GA), RBAC (1.6 beta, GA 1.8) |
| 1.7–1.16 | 2017–2019 | CRDs, CSI storage, Ingress v1beta1, CoreDNS default (1.13) |
| 1.19 | 2020 | Ingress `networking.k8s.io/v1` GA; support window extended to 1 year |
| 1.20 | 2020 | Dockershim deprecated |
| **1.24** | May 2022 | **Dockershim removed** (containerd/CRI-O) |
| 1.25 | 2022 | PodSecurityPolicy removed → Pod Security Admission |
| 1.27–1.30 | 2023–2024 | In-place pod resize (alpha), sidecar containers (beta 1.29), Gateway API v1.0 (separate project) |
| 1.31–1.34 | 2024–2025 | Sidecars GA (1.33), in-place pod resize beta, Dynamic Resource Allocation for GPUs (GA 1.34) |

Kubernetes releases **three minor versions per year**, each supported upstream for about **14 months** (≈ the three latest minors). AKS supports roughly the latest three GA minor versions (plus Long-Term Support for selected versions on Premium tier) — clusters must be upgraded regularly.

# Lifecycle

**Pod lifecycle phases:** **Pending** (accepted, waiting for scheduling/image pull) → **Running** (bound to a node, at least one container running) → **Succeeded** (all containers exited 0 — Jobs) or **Failed** (a container exited non-zero and won't restart) — plus **Unknown** (node unreachable).

Container states: Waiting (e.g. `ContainerCreating`, `ImagePullBackOff`, `CrashLoopBackOff`), Running, Terminated.

**Pod startup sequence:** scheduler picks a node → kubelet pulls images → **init containers** run in order to completion → app containers (and sidecars) start → `postStart` hook → **startup probe** → **readiness probe** passes → pod added to Service endpoints → **liveness probe** keeps checking.

**Pod termination:** pod marked Terminating → removed from Service endpoints → `preStop` hook → **SIGTERM** sent → app shuts down gracefully → after `terminationGracePeriodSeconds` (default **30 s**) → SIGKILL.

**Deployment rollout lifecycle:** new ReplicaSet created → pods scaled up/old down according to `maxSurge`/`maxUnavailable` → readiness gates progress → rollout complete (or stuck → `kubectl rollout undo`). Revision history kept (`revisionHistoryLimit`, default 10).

**Cluster lifecycle (AKS):** create cluster/node pools → deploy workloads → monitor → upgrade control plane then node pools (node image and Kubernetes version) → scale → eventually decommission.

# Tools

| Tool | Use |
|---|---|
| `kubectl` | CLI for everything |
| **Helm** | Package manager (charts, releases, values) |
| Kustomize (`kubectl apply -k`) | Template-free overlays per environment |
| k9s, Lens/Headlamp, Kubernetes Dashboard | Cluster UIs |
| kind, minikube, k3d, Docker Desktop | Local clusters |
| **Azure CLI** (`az aks`), Azure portal | AKS management |
| Argo CD, Flux | GitOps continuous delivery |
| KEDA | Event-driven autoscaling (queues, Kafka, cron) |
| Prometheus + Grafana, Azure Monitor Container Insights | Metrics and dashboards |
| Istio, Linkerd | Service mesh |
| cert-manager, external-dns, ingress-nginx / Application Gateway for Containers | TLS, DNS, ingress |
| Trivy, Kubescape, kube-bench | Security scanning |

# Module: Architecture and Core Objects

## Lesson: [Basic|High] Cluster architecture

**Control plane** (managed by Azure in AKS):

| Component | Role |
|---|---|
| **kube-apiserver** | Front door — all reads/writes go through the REST API; authentication, authorisation, admission |
| **etcd** | Consistent key-value store holding all cluster state |
| **kube-scheduler** | Assigns new pods to nodes (resources, affinity, taints) |
| **kube-controller-manager** | Runs controllers (Deployment, ReplicaSet, Node, Job...) that reconcile desired vs actual state |
| cloud-controller-manager | Integrates with the cloud (load balancers, disks, routes) |

**Worker nodes:**

| Component | Role |
|---|---|
| **kubelet** | Agent ensuring the pods assigned to the node are running and healthy |
| **kube-proxy** | Programs networking rules (iptables/IPVS) for Services (or replaced by eBPF, e.g. Cilium) |
| **Container runtime** | containerd / CRI-O run the containers |

Everything is **declarative**: you `kubectl apply` YAML manifests describing desired state; controllers loop forever to converge.

## Lesson: [Basic|High] Pods, ReplicaSets and Deployments

- **Pod** — smallest deployable unit: one or more containers sharing network (same IP, localhost) and volumes. Pods are **ephemeral** — never manage them directly in production.
- **ReplicaSet** — keeps N identical pods running.
- **Deployment** — manages ReplicaSets for stateless apps; adds rolling updates, rollbacks and history.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-api
  labels: { app: shop-api }
spec:
  replicas: 3
  selector:
    matchLabels: { app: shop-api }
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    metadata:
      labels: { app: shop-api }
    spec:
      containers:
        - name: api
          image: myacr.azurecr.io/shop-api:1.4.2
          ports:
            - containerPort: 8080
          env:
            - name: ASPNETCORE_ENVIRONMENT
              value: Production
          resources:
            requests: { cpu: 250m, memory: 256Mi }
            limits:   { memory: 512Mi }
          readinessProbe:
            httpGet: { path: /health/ready, port: 8080 }
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet: { path: /health/live, port: 8080 }
            periodSeconds: 15
            failureThreshold: 3
```

**Labels** (key/value tags) + **selectors** connect objects: the Deployment selects its pods, a Service selects pods to route to.

## Lesson: [Basic|High] Services and service types

Pods come and go with changing IPs; a **Service** gives a stable virtual IP and DNS name (`shop-api.default.svc.cluster.local`, or just `shop-api` in the same namespace) and load-balances to ready pods matching its selector.

| Type | Exposes | Use |
|---|---|---|
| **ClusterIP** (default) | Internal virtual IP only | Service-to-service |
| **NodePort** | A port (30000–32767) on every node | Testing, legacy |
| **LoadBalancer** | Cloud load balancer with external IP | Expose a service directly (one LB per service) |
| **ExternalName** | DNS CNAME to an external host | Alias external services |
| Headless (`clusterIP: None`) | DNS returns pod IPs | StatefulSets, client-side discovery |

```yaml
apiVersion: v1
kind: Service
metadata: { name: shop-api }
spec:
  type: ClusterIP
  selector: { app: shop-api }
  ports:
    - port: 80          # service port
      targetPort: 8080  # container port
```

## Lesson: [Intermediate|High] Ingress and the Gateway API

An **Ingress** routes external HTTP(S) traffic to Services by host and path, with TLS termination — one load balancer for many services. It needs an **ingress controller** (ingress-nginx, Azure Application Gateway Ingress Controller / Application Gateway for Containers, Traefik, HAProxy).

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  ingressClassName: nginx
  tls:
    - hosts: [shop.example.com]
      secretName: shop-tls
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend: { service: { name: shop-api, port: { number: 80 } } }
          - path: /
            pathType: Prefix
            backend: { service: { name: shop-web, port: { number: 80 } } }
```

The **Gateway API** (GatewayClass, Gateway, HTTPRoute) is the more expressive successor to Ingress (traffic splitting, header matching, role separation). Note: the community ingress-nginx project announced retirement (maintenance ends March 2026) — new clusters should evaluate Gateway API implementations or other controllers.

## Lesson: [Basic|High] ConfigMaps and Secrets

```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: shop-config }
data:
  Logging__LogLevel__Default: "Information"
  FeatureFlags__NewCheckout: "true"
---
apiVersion: v1
kind: Secret
metadata: { name: shop-secrets }
type: Opaque
stringData:
  ConnectionStrings__Db: "Server=tcp:sql.example.net;Database=Shop;Authentication=Active Directory Workload Identity"
```

```yaml
# in the container spec
envFrom:
  - configMapRef: { name: shop-config }
  - secretRef: { name: shop-secrets }
volumeMounts:
  - { name: cfg, mountPath: /app/config, readOnly: true }
# volumes: - name: cfg  configMap: { name: shop-config }
```

Secrets are only **base64-encoded**, not encrypted, by default — enable etcd encryption at rest, restrict access with RBAC, and prefer external secret stores: **Azure Key Vault via the Secrets Store CSI Driver**, External Secrets Operator, plus **Workload Identity** so pods authenticate to Azure without stored credentials. Env vars from ConfigMaps don't update in running pods (restart needed); mounted files do update.

# Module: Running Workloads Well

## Lesson: [Intermediate|High] Probes: liveness, readiness and startup

| Probe | Question | On failure |
|---|---|---|
| **Liveness** | Is the process stuck/dead? | Container **restarted** |
| **Readiness** | Can it serve traffic now? | Removed from Service endpoints (not restarted) |
| **Startup** | Has it finished starting? | Liveness/readiness wait until it succeeds; failure → restart |

Probe types: `httpGet`, `tcpSocket`, `exec`, `grpc`. In ASP.NET Core map separate endpoints: `/health/live` (process OK — don't check dependencies, or a DB blip restarts every pod) and `/health/ready` (dependencies like DB reachable).

## Lesson: [Intermediate|High] Resources, QoS and autoscaling

- **requests** — what the scheduler reserves (placement decisions). **limits** — the maximum: CPU over limit is **throttled**; memory over limit → container **OOMKilled**.
- QoS classes: **Guaranteed** (requests = limits for all), **Burstable** (requests < limits), **BestEffort** (none — evicted first).
- **HPA** (Horizontal Pod Autoscaler) — scales replicas on CPU/memory or custom/external metrics.
- **VPA** — recommends/adjusts requests. **Cluster Autoscaler** / AKS **Node Auto Provisioning (Karpenter)** — adds/removes nodes when pods can't be scheduled.
- **KEDA** — scale on events (Service Bus queue length, Kafka lag, cron), including to zero.
- **PodDisruptionBudget** — keep minimum replicas available during voluntary disruptions (node upgrades/drains).
- **ResourceQuota / LimitRange** — per-namespace caps and defaults.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: shop-api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: shop-api }
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

## Lesson: [Intermediate|Medium] Workload types: StatefulSet, DaemonSet, Job, CronJob

| Object | Use |
|---|---|
| Deployment | Stateless apps (APIs, web) |
| **StatefulSet** | Stateful apps needing stable identity and storage: ordered pods `db-0`, `db-1`, each with its own PersistentVolumeClaim, stable DNS via a headless Service |
| **DaemonSet** | One pod per node: log collectors, monitoring agents, CNI |
| **Job** | Run to completion (migrations, batch) with retries |
| **CronJob** | Scheduled Jobs (`schedule: "0 2 * * *"`) |

## Lesson: [Intermediate|Medium] Storage: volumes, PV, PVC and StorageClass

- **Volume** types: `emptyDir` (scratch, lives with the pod), `configMap`, `secret`, `hostPath` (avoid), `persistentVolumeClaim`, CSI volumes.
- **PersistentVolume (PV)** — a piece of storage in the cluster. **PersistentVolumeClaim (PVC)** — a pod's request for storage (size, access mode). **StorageClass** — how to provision dynamically (AKS: `managed-csi` Azure Disk, `azurefile-csi` Azure Files).
- Access modes: ReadWriteOnce (one node), ReadOnlyMany, ReadWriteMany (Azure Files), ReadWriteOncePod.
- Reclaim policy: Delete or Retain.

For production databases, prefer managed services (Azure SQL, Cosmos DB, Azure Database for PostgreSQL) over running them in the cluster unless you have strong reasons.

## Lesson: [Intermediate|High] Namespaces, RBAC and security

- **Namespaces** — logical partitions (dev/test/team-a) for names, quotas, RBAC and network policies.
- **RBAC** — `Role`/`ClusterRole` (verbs on resources) bound to users/groups/ServiceAccounts with `RoleBinding`/`ClusterRoleBinding`. AKS integrates with **Microsoft Entra ID** and Azure RBAC.
- **ServiceAccounts** — identities for pods; with AKS **Workload Identity** they map to Entra managed identities to access Key Vault, Storage, SQL without secrets.
- **NetworkPolicies** — firewall rules between pods (default: all pods can talk to each other).
- **Pod Security Standards** (Privileged/Baseline/Restricted) via Pod Security Admission; run as non-root, read-only root FS, drop capabilities.
- Image hygiene: private registry (ACR attached to AKS), scanning, admission policies (Azure Policy/Gatekeeper/Kyverno).

# Module: Deploying and Operating

## Lesson: [Basic|High] kubectl essentials

```bash
kubectl get nodes
kubectl get pods -n shop -o wide
kubectl get deploy,svc,ingress -A
kubectl describe pod shop-api-7d9f8-abcde -n shop       # events: scheduling, image pulls, probe failures
kubectl logs shop-api-7d9f8-abcde -n shop [-c api] [--previous] [-f]
kubectl exec -it shop-api-7d9f8-abcde -n shop -- sh
kubectl apply -f k8s/                                   # declarative create/update
kubectl delete -f k8s/deployment.yaml
kubectl scale deploy shop-api --replicas=5 -n shop
kubectl set image deploy/shop-api api=myacr.azurecr.io/shop-api:1.4.3 -n shop
kubectl rollout status deploy/shop-api -n shop
kubectl rollout history deploy/shop-api -n shop
kubectl rollout undo deploy/shop-api -n shop [--to-revision=3]
kubectl port-forward svc/shop-api 8080:80 -n shop
kubectl top pods -n shop                                 # needs metrics-server
kubectl get events -n shop --sort-by=.lastTimestamp
kubectl config get-contexts / use-context aks-prod
kubectl explain deployment.spec.strategy
```

## Lesson: [Intermediate|High] Deployment strategies

| Strategy | How | Trade-off |
|---|---|---|
| **Rolling update** (default) | Replace pods gradually (`maxSurge`, `maxUnavailable`) | Zero downtime; old and new run side by side briefly — keep APIs/DB backward compatible |
| **Recreate** | Kill all old, then start new | Downtime; for apps that can't run two versions |
| **Blue-green** | Two full environments; switch the Service selector/ingress | Instant switch and rollback; double resources |
| **Canary** | Send a small % of traffic to the new version, then increase | Low-risk; needs ingress/mesh traffic splitting (Argo Rollouts, Flagger, Gateway API weights) |
| A/B | Route by header/user segment | Experiments |

## Lesson: [Intermediate|High] Helm and GitOps

```bash
helm create shop-api                       # chart skeleton: Chart.yaml, values.yaml, templates/
helm install shop ./shop-api -n shop -f values-prod.yaml --set image.tag=1.4.2
helm upgrade --install shop ./shop-api -n shop -f values-prod.yaml
helm list -n shop
helm history shop -n shop
helm rollback shop 3 -n shop
helm template ./shop-api -f values-prod.yaml      # render YAML locally
```

```yaml
# templates/deployment.yaml (excerpt)
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
replicas: {{ .Values.replicaCount }}
```

**GitOps** (Argo CD, Flux): the desired state lives in Git; an in-cluster agent pulls and applies changes and reverts drift. Deployments become pull requests; rollback = git revert.

## Lesson: [Advanced|High] Troubleshooting common pod problems

| Status/symptom | Likely cause | Check |
|---|---|---|
| `Pending` | Not enough CPU/memory, node selector/taints, PVC not bound | `kubectl describe pod` events, `kubectl get nodes`, quotas |
| `ImagePullBackOff` / `ErrImagePull` | Wrong image/tag, registry auth (ACR not attached), network | `describe pod`, `az aks check-acr` |
| `CrashLoopBackOff` | App exits on start: bad config, missing secret, exception, failing liveness probe | `kubectl logs --previous`, env/secret refs, probe settings |
| `OOMKilled` | Memory limit too low or a leak | `describe pod` (Last State), `kubectl top`, raise limit/fix leak |
| `CreateContainerConfigError` | Missing ConfigMap/Secret key | `describe pod` |
| Running but not receiving traffic | Readiness failing, Service selector/labels mismatch, wrong targetPort | `kubectl get endpoints svc`, labels, probes |
| 502/503 from ingress | No ready endpoints, wrong service port, TLS/host mismatch | ingress controller logs, endpoints |
| Service DNS fails | CoreDNS issues, wrong namespace in name | `nslookup svc.ns.svc.cluster.local` from a debug pod |

`kubectl debug -it pod/name --image=busybox --target=api` attaches an ephemeral debug container.

## Lesson: [Intermediate|High] AKS specifics

```bash
az group create -n rg-shop -l centralindia
az aks create -g rg-shop -n aks-shop --node-count 3 --enable-managed-identity \
  --attach-acr myacr --enable-oidc-issuer --enable-workload-identity --generate-ssh-keys
az aks get-credentials -g rg-shop -n aks-shop
az aks get-upgrades -g rg-shop -n aks-shop -o table
az aks upgrade -g rg-shop -n aks-shop --kubernetes-version <version>
az aks nodepool add -g rg-shop --cluster-name aks-shop -n gpupool --node-vm-size Standard_NC6s_v3 --node-taints sku=gpu:NoSchedule
```

- Control plane free tier vs **Standard** tier (financially backed SLA) vs Premium (LTS).
- **System** node pool (critical add-ons) + **user** node pools; spot node pools for cheap batch.
- Networking: kubenet (legacy), **Azure CNI** / Azure CNI Overlay, Cilium dataplane.
- Integrations: ACR, Key Vault CSI driver, Workload Identity, Azure Monitor/Container Insights + Managed Prometheus/Grafana, Application Gateway for Containers, Azure Policy, Defender for Containers, KEDA and Dapr add-ons, **AKS Automatic** (opinionated, managed configuration).
- Alternatives when you don't need full Kubernetes: **Azure Container Apps** (built on Kubernetes + KEDA + Envoy, fully managed).

# Interview

## [Beginner|High] What is Kubernetes and what problems does it solve?

Kubernetes is an open-source container orchestrator (from Google, now CNCF). It automates deploying, scaling and operating containers across a cluster: scheduling pods onto nodes, self-healing (restarting/rescheduling failed containers), service discovery and load balancing, rolling updates and rollbacks, horizontal autoscaling, configuration and secret management, and storage orchestration — all driven by declarative desired state.

## [Beginner|High] Explain the Kubernetes architecture.

Control plane: kube-apiserver (API front end), etcd (cluster state store), kube-scheduler (places pods on nodes), kube-controller-manager (reconciliation loops), cloud-controller-manager (cloud integration). Worker nodes: kubelet (runs and monitors pods), kube-proxy (service networking rules), and a container runtime (containerd/CRI-O). In AKS, Azure manages the control plane; you manage node pools and workloads.

## [Beginner|High] What is a Pod? Why not run containers directly?

A Pod is the smallest deployable unit: one or more tightly coupled containers sharing an IP address, port space and volumes, scheduled together on one node (e.g. app + sidecar). Pods are ephemeral and replaceable, so you manage them through higher-level controllers (Deployments, StatefulSets, Jobs) that recreate and scale them, instead of running bare containers or bare pods.

## [Beginner|High] What is the difference between a Deployment, a ReplicaSet and a StatefulSet?

A ReplicaSet keeps a set number of identical pod replicas running. A Deployment manages ReplicaSets to provide declarative updates, rolling updates, rollbacks and revision history for stateless apps — you normally use Deployments, not ReplicaSets directly. A StatefulSet is for stateful apps: pods get stable names (`app-0`, `app-1`), stable network identities via a headless Service, ordered start/stop, and their own persistent volumes.

## [Beginner|High] What are the Service types in Kubernetes?

ClusterIP (default; stable internal IP/DNS for pod-to-pod traffic), NodePort (exposes a port on each node), LoadBalancer (provisions a cloud load balancer with an external IP), ExternalName (DNS alias to an external name). A headless Service (`clusterIP: None`) returns pod IPs directly. Services select pods by labels and load-balance to ready endpoints.

## [Beginner|Medium] What is a namespace?

A virtual partition inside a cluster that scopes names and lets you apply RBAC, resource quotas, limit ranges and network policies per team or environment. Default namespaces: `default`, `kube-system`, `kube-public`, `kube-node-lease`. DNS for services includes the namespace (`svc.namespace.svc.cluster.local`). Nodes and PersistentVolumes are cluster-scoped.

## [Intermediate|High] What is the difference between ConfigMap and Secret?

Both inject configuration into pods as environment variables or mounted files. ConfigMaps hold non-sensitive data. Secrets hold sensitive data (passwords, keys, certificates); they're base64-encoded (not encrypted by default), can be encrypted at rest in etcd, have tighter RBAC, and are mounted on tmpfs. In production, source secrets from Azure Key Vault (Secrets Store CSI driver / External Secrets) with Workload Identity.

## [Intermediate|High] Explain liveness, readiness and startup probes.

Liveness checks whether the container is alive; failing it causes a restart (use for deadlocks/hangs; don't include dependency checks). Readiness checks whether it can serve traffic; failing removes the pod from Service endpoints without restarting (use for warm-up and dependency availability). Startup probes protect slow-starting apps — liveness and readiness don't run until the startup probe succeeds.

## [Intermediate|High] What is the difference between resource requests and limits? What happens when exceeded?

Requests are the guaranteed amount used by the scheduler to place pods. Limits are the maximum a container may use. Exceeding the CPU limit causes throttling (slower, not killed); exceeding the memory limit gets the container OOMKilled. Requests/limits determine QoS (Guaranteed, Burstable, BestEffort), which affects eviction order under node pressure. Set requests based on observed usage; many teams set memory limits but avoid CPU limits to prevent throttling.

## [Intermediate|High] How does a rolling update work? How do you roll back?

When the pod template changes (e.g. new image), the Deployment creates a new ReplicaSet and gradually scales it up while scaling the old one down, respecting `maxSurge` (extra pods allowed) and `maxUnavailable`, and waiting for readiness. If the new version is bad: `kubectl rollout undo deployment/name` (or `--to-revision`), or `helm rollback`. Check with `kubectl rollout status/history`.

## [Intermediate|High] What is an Ingress? How is it different from a LoadBalancer Service?

A LoadBalancer Service exposes one service with its own cloud load balancer at layer 4. An Ingress is a layer-7 (HTTP/HTTPS) routing rule set — host and path based routing, TLS termination — handled by an ingress controller behind a single load balancer for many services. The Gateway API is the newer, more powerful successor.

## [Intermediate|Medium] What is Helm?

The package manager for Kubernetes. A chart bundles templated manifests plus default `values.yaml`; you install it as a release with environment-specific values, upgrade, view history and roll back. It removes copy-paste YAML across environments and lets you share apps (e.g. installing ingress-nginx, cert-manager, Prometheus from public charts).

## [Intermediate|Medium] How does autoscaling work in Kubernetes?

HPA adjusts the number of pod replicas based on metrics (CPU/memory via metrics-server, or custom/external metrics). VPA adjusts pod resource requests. Cluster Autoscaler (or Node Auto Provisioning/Karpenter) adds or removes nodes when pods are unschedulable or nodes are underused. KEDA scales on event sources like queue length, including to zero. Requests must be set for CPU-based HPA to work.

## [Advanced|High] How do you secure a Kubernetes cluster?

Entra ID integration and least-privilege RBAC; separate namespaces; NetworkPolicies (default deny); Pod Security Standards (non-root, read-only FS, no privilege escalation); private registry with image scanning and admission policies (Azure Policy/Gatekeeper/Kyverno); secrets in Key Vault via CSI + Workload Identity; etcd encryption; private cluster/API server authorised IP ranges; keep Kubernetes and node images patched; Defender for Containers; audit logs; limit `cluster-admin`.

## [Advanced|Medium] What is a sidecar container? Give examples.

A helper container in the same pod as the main app, sharing its network and volumes, that adds functionality without changing the app: service mesh proxies (Envoy/Istio), log shippers, config reloaders, Dapr sidecar, auth proxies. Kubernetes 1.29+ supports native sidecars (init containers with `restartPolicy: Always`) that start before and stop after the main container.

## [Advanced|Medium] What happens when you run `kubectl apply -f deployment.yaml`?

kubectl sends the manifest to the API server → authentication, authorisation (RBAC) and admission controllers (validation/mutation) → object stored in etcd → the Deployment controller sees it and creates/updates a ReplicaSet → the ReplicaSet controller creates Pod objects → the scheduler assigns each pod to a node → the kubelet on that node pulls images via the container runtime and starts containers → probes report health → endpoints controller adds ready pods to Services.

## [Scenario|High] A pod is stuck in CrashLoopBackOff. How do you troubleshoot?

`kubectl describe pod` (events, last state, exit code, probe failures); `kubectl logs <pod> --previous` to see why the last run died. Common causes: unhandled exception at startup (bad connection string, missing env var/secret key), wrong command/entrypoint, liveness probe failing too early (add a startup probe/initialDelay), permission errors (non-root), OOMKilled (exit 137). Reproduce locally with the same image and env; fix config and redeploy.

## [Scenario|High] After deploying a new version, users get errors for a few seconds on every release. How do you get true zero-downtime deployments?

Ensure readiness probes reflect real readiness so traffic only reaches ready pods; set `maxUnavailable: 0` and `maxSurge: 1+`; handle SIGTERM gracefully (ASP.NET Core does — finish in-flight requests) and add a short `preStop` sleep so endpoints are removed from load balancers before shutdown; set an adequate `terminationGracePeriodSeconds`; run ≥ 2–3 replicas with a PodDisruptionBudget; keep API and DB changes backward compatible (expand-contract) because old and new versions overlap.

## [Scenario|High] Pods are Pending with "0/3 nodes are available: insufficient memory". What do you do?

Pod requests exceed free allocatable memory on all nodes. Options: check whether requests are oversized (right-size them using actual usage), scale the node pool or enable the cluster autoscaler/node auto-provisioning, add a node pool with larger VMs, remove unused workloads, check ResourceQuotas and taints/node selectors preventing placement. Verify with `kubectl describe nodes` (Allocated resources) and `kubectl top nodes`.

## [Scenario|Medium] The API in AKS must read secrets from Azure Key Vault without storing any credentials. How?

Enable the OIDC issuer and **Workload Identity** on AKS; create a user-assigned managed identity with Key Vault access (RBAC role "Key Vault Secrets User"); create a federated credential linking the identity to the Kubernetes ServiceAccount; annotate the ServiceAccount and label pods to use it. Then either use the **Secrets Store CSI Driver** (mount secrets as files/sync to K8s Secrets) or call Key Vault from code with `DefaultAzureCredential`. No passwords stored anywhere.

## [Scenario|Medium] Should you run SQL Server inside Kubernetes for production?

Usually no. Stateful databases need careful handling of storage, backups, HA, failover and upgrades; a managed service (Azure SQL Database/Managed Instance) gives backups, HA, patching and SLAs out of the box. Running databases in Kubernetes (StatefulSets, operators) is viable for teams with strong expertise or specific needs (portability, edge, dev/test). Keep the cluster for stateless services and connect to managed data stores.

# Cheatsheet

## Architecture

Control plane: API server · etcd · scheduler · controller manager · cloud controller. Nodes: kubelet · kube-proxy · container runtime.

## Objects

Pod · ReplicaSet · **Deployment** · StatefulSet · DaemonSet · Job · CronJob · Service (ClusterIP/NodePort/LoadBalancer/ExternalName/headless) · Ingress / Gateway API · ConfigMap · Secret · PV / PVC / StorageClass · Namespace · ServiceAccount · Role/RoleBinding · NetworkPolicy · HPA · PDB · ResourceQuota.

## kubectl

```bash
kubectl get pods -A -o wide          kubectl describe pod <p>
kubectl logs <p> --previous -f       kubectl exec -it <p> -- sh
kubectl apply -f file.yaml           kubectl delete -f file.yaml
kubectl rollout status|history|undo deploy/<d>
kubectl scale deploy/<d> --replicas=5
kubectl port-forward svc/<s> 8080:80
kubectl top pods                     kubectl get events --sort-by=.lastTimestamp
```

## Probes

Liveness → restart · Readiness → remove from endpoints · Startup → delay others.

## Resources

Requests (scheduling) · Limits (CPU throttle, memory OOMKill) · QoS: Guaranteed / Burstable / BestEffort.

## Pod phases & errors

Pending · Running · Succeeded · Failed · Unknown — `ImagePullBackOff` · `CrashLoopBackOff` · `OOMKilled` · `CreateContainerConfigError`.

## Deploy strategies

Rolling (default) · Recreate · Blue-green · Canary · A/B. Rollback: `kubectl rollout undo` / `helm rollback`.

## AKS

`az aks create/get-credentials/upgrade/nodepool add` · attach ACR · Workload Identity + Key Vault CSI · Azure CNI · Container Insights · KEDA · AKS Automatic · consider Azure Container Apps for simpler needs.
