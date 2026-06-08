# Todo Platform on Kubernetes (React + FastAPI + PostgreSQL)

## Project Overview

A production-style full-stack application deployed on a multi-node Kubernetes (k3s) cluster.

### Stack

* Frontend: React
* Backend: FastAPI (Python)
* Database: PostgreSQL
* Containerization: Docker
* Orchestration: Kubernetes (k3s)
* Infrastructure: Ubuntu VMs on VirtualBox

---

## Architecture
```text
Windows Browser
       │
       ▼
Frontend Service (NodePort)
       │
       ▼
Frontend Deployment (2 Replicas)
       │
       ▼
Backend Service (ClusterIP)
       │
       ▼
Backend Deployment (2 Replicas)
       │
       ▼
PostgreSQL Headless Service
       │
       ▼
PostgreSQL StatefulSet
       │
       ▼
Persistent Volume Claim


```  ↓


Multi-node cluster:

* Master node
* Worker node

---

## Repository Structure

```text
todo-platform/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes.py
│   │   ├── models.py
│   │   ├── database.py
│   │   └── __init__.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├──k8s/
├── base/
│   ├── namespace.yaml
│   └── kustomization.yaml
│
├── app/
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   └── kustomization.yaml
│   │
│   ├── backend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   └── kustomization.yaml
│   │
│   └── database/
│       ├── statefulset.yaml
│       ├── service.yaml
│       ├── secret.yaml
│       └── kustomization.yaml
└── docker-compose.yml
```

---

## Local Development Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### PostgreSQL (Docker)

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=tododb \
  -p 5432:5432 postgres
```

---

## Docker Setup

### Build Images

```bash
# Backend
docker build -t <dockerhub-user>/todo-backend:v1.0.0 ./backend

# Frontend
docker build -t <dockerhub-user>/todo-frontend:v1.0.0 ./frontend
```

### Push Images

```bash
docker login
docker push <dockerhub-user>/todo-backend:v1.0.0
docker push <dockerhub-user>/todo-frontend:v1.0.0
```

---

## Kubernetes Setup

### Install k3s on Master

```bash
curl -sfL https://get.k3s.io | sh -s - --node-ip=<MASTER-IP>
```

Get token:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

### Join Worker

```bash
curl -sfL https://get.k3s.io | \
K3S_URL=https://<MASTER-IP>:6443 \
K3S_TOKEN=<TOKEN> \
INSTALL_K3S_EXEC="--node-ip=<WORKER-IP>" \
sh -
```

### Verify Cluster

```bash
kubectl get nodes -o wide
```

---

## Deployment

```bash
kubectl apply -f k8s/
```

Verify:

```bash
kubectl get pods -o wide
kubectl get svc
```

---

## Access Application

Frontend:

```text
http://<NODE-IP>:30007
```

Backend Swagger:

```text
http://<NODE-IP>:30008/docs
```

---

## Key Challenges Faced and Resolutions

### 1. Python Import Errors

**Issue:**

```text
ModuleNotFoundError: No module named 'app.models'
```

**Root Cause:**
Python package structure/import resolution.

**Fix:**

* Added `__init__.py`
* Switched to absolute imports
* Used correct working directory

---

### 2. Virtual Environment Activation Issues

**Issue:**
Windows activation command mismatch.

**Fix:**
Used platform-specific activation commands.

---

### 3. Missing PostgreSQL Runtime

**Issue:**
Backend failed because database was not running.

**Fix:**
Installed Docker and ran PostgreSQL container.

---

### 4. Windows ↔ Ubuntu VM Connectivity

**Issue:**
Frontend could not reach backend.

**Fix:**

* Bound FastAPI to `0.0.0.0`
* Used VM IP instead of localhost
* Verified VM networking

---

### 5. Docker Image Pull Failures

**Issue:**

```text
ImagePullBackOff
```

**Root Cause:**
Wrong image tags in manifests.

**Fix:**
Matched Kubernetes image tag exactly with Docker Hub tags.

---

### 6. Backend CrashLoopBackOff

**Issue:**
Backend startup failures.

**Root Cause:**
Missing PostgreSQL Kubernetes Service.

**Fix:**
Created `postgres` service for stable discovery.

---

### 7. DNS Resolution Failure

**Issue:**

```text
could not translate host name 'postgres'
```

**Root Cause:**
Service discovery misconfiguration + networking validation.

**Fix:**

* Verified CoreDNS
* Verified service selectors
* Confirmed cluster DNS

---

### 8. Cross-Node Networking Failure

**Issue:**
Backend worked only when scheduled on same node as DB.

**Root Cause:**
Incorrect k3s node IP registration (NAT/host-only confusion).

**Fix:**
Reconfigured cluster using explicit node IPs.

---

### 9. kubectl API Server Connection Refused

**Issue:**

```text
localhost:8080 connection refused
```

**Root Cause:**
Running kubectl on worker without kubeconfig.

**Fix:**
Ran control-plane commands from master node.

---

### 10. Browser CORS Errors

**Issue:**
Axios network/CORS failures.

**Fix:**
Added FastAPI CORS middleware.

---

## Validation Commands

Cluster:

```bash
kubectl get nodes -o wide
```

Pods:

```bash
kubectl get pods -o wide
```

Services:

```bash
kubectl get svc
```

Logs:

```bash
kubectl logs deployment/backend
```

DNS:

```bash
kubectl exec -it deployment/backend -- nslookup postgres
```

DB Connectivity:

```bash
kubectl exec -it deployment/backend -- nc -vz postgres 5432
```

---

## Learning Outcomes
* Full-stack application deployment
* Docker image creation and registry workflows
* Multi-node Kubernetes cluster administration
* Kubernetes Deployments, Services, StatefulSets
* Persistent Volume Claims and storage management
* Kubernetes Secrets and ConfigMaps
* Readiness and Liveness Probes
* Resource Requests and Limits
* Kustomize-based manifest management
* DNS-based service discovery
* Cross-node networking troubleshooting
* Application startup orchestration using initContainers
* Production debugging across application, database, and Kubernetes layers
* Stateful workload management

---
## Production Hardening Implemented

### Namespace Isolation

Created a dedicated namespace:

```bash
todo-app
```

Benefits:

* Workload isolation
* Simplified resource management
* Easier RBAC and NetworkPolicy implementation
* GitOps-friendly structure

---

### Kustomize-Based Deployment Structure

Refactored manifests into application-specific folders and kustomization files.

Benefits:

* Cleaner repository organization
* Environment-specific overlays support
* ArgoCD-ready structure

---

### Kubernetes Secrets

Implemented Secrets for sensitive database credentials.

Examples:

* POSTGRES_USER
* POSTGRES_PASSWORD
* DB_USER
* DB_PASSWORD

Secret Type:

```yaml
type: Opaque
```

---

### ConfigMaps

Implemented ConfigMaps for non-sensitive application configuration.

Examples:

* DB_HOST
* DB_PORT
* DB_NAME

Benefits:

* Separation of configuration from application code
* Environment-specific customization

---

### PostgreSQL StatefulSet

Migrated PostgreSQL from a standalone pod to a StatefulSet.

Benefits:

* Stable pod identity
* Stable DNS records
* Persistent storage support
* Ordered startup and shutdown

---

### Persistent Storage

Implemented PersistentVolumeClaim-backed storage.

Benefits:

* Data survives pod restarts
* Stateful workloads supported
* Production-style database deployment

---

### Health Probes

Implemented:

* Readiness Probes
* Liveness Probes

Benefits:

* Automatic health validation
* Improved application availability
* Automated recovery from unhealthy states

---

### Resource Governance

Implemented Kubernetes resource requests and limits.

Benefits:

* Predictable scheduling
* Resource protection
* Prevention of noisy-neighbor issues

---

### Startup Dependency Management

Implemented initContainers for backend startup sequencing.

Benefits:

* Backend waits for PostgreSQL availability
* Eliminates startup race conditions
### 11. PostgreSQL Authentication Failure

**Issue:**

```text
password authentication failed for user "postgres"
```

**Root Cause:**

Backend application was not using the Kubernetes-injected database connection string.

**Fix:**

Updated FastAPI database configuration to consume:

```python
DATABASE_URL = os.getenv("DATABASE_URL")
```

instead of using a stale hardcoded connection string.

---

### 12. Frontend CrashLoopBackOff After Health Probe Introduction

**Issue:**

```text
Liveness probe failed
connection refused
```

**Root Cause:**

React frontend container was serving traffic on port 3000 while Kubernetes probes targeted port 80.

**Fix:**

Updated:

* containerPort
* readinessProbe
* livenessProbe
* service targetPort

to use the correct application port.

---

### 13. StatefulSet Secret vs Existing Database Credentials

**Issue:**

Changing Kubernetes Secrets did not change database credentials.

**Root Cause:**

PostgreSQL only consumes initialization credentials during first database creation.

**Learning:**

Kubernetes Secrets do not automatically rotate existing database passwords.

## Next Planned Enhancements

### Phase 5 - GitOps

* ArgoCD installation
* GitOps deployment workflow
* Automatic synchronization
* Rollback strategy

### Phase 6 - Observability

* Prometheus
* Grafana
* kube-state-metrics
* Node Exporter
* Application metrics

### Phase 7 - Production Traffic Management

* Ingress Controller
* TLS Certificates
* cert-manager
* Horizontal Pod Autoscaler (HPA)

### Phase 8 - Advanced Platform Engineering

* NetworkPolicies
* PodDisruptionBudgets
* RBAC
* Helm
* Kustomize overlays (Dev/Staging/Prod)
* CI/CD integration
* Container image scanning