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
    ↓
Frontend Service (NodePort)
    ↓
React Frontend Pod
    ↓
Backend Service
    ↓
FastAPI Backend Pod
    ↓
PostgreSQL Service
    ↓
PostgreSQL Pod
```

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
├── k8s/
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── postgres-pod.yaml
│   └── postgres-service.yaml
│
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
* Kubernetes Deployments, Services, NodePort
* DNS-based service discovery
* Cross-node networking troubleshooting
* Cluster debugging and operational troubleshooting
* CORS and frontend/backend integration debugging

---

## Next Planned Enhancements

* Persistent Volumes for PostgreSQL
* ConfigMaps
* Secrets
* Health probes
* Resource requests/limits
* Ingress Controller
* ArgoCD GitOps
* Prometheus monitoring
* Grafana dashboards
* Horizontal Pod Autoscaling
