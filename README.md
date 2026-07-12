# StadiumMind AI – Intelligent Stadium Operations & Fan Experience Platform

StadiumMind AI is an enterprise-grade, multi-agent AI Operating System designed to optimize stadium operations and enhance the fan experience for the **FIFA World Cup 2026**.

This workspace contains both the **FastAPI + CrewAI Python backend** and the **Vite + React + TypeScript + Tailwind CSS frontend dashboard**.

---

## Technical Stack & Architecture

### Frontend
- **React 18** with **TypeScript**
- **Tailwind CSS** (curated glassmorphic styling, custom FIFA-quality palette, dark-mode animations)
- **Lucide React** (icons system)
- **Digital Twin Simulator** (Interactive vector SVG representing stadium sensor networks)

### Backend
- **FastAPI** (Python REST endpoints and real-time WebSockets connection manager)
- **SQLAlchemy** (ORM mapped to PostgreSQL schema)
- **Multi-Agent Orchestrator** (ReAct agent reasoning loops with RAG SOP contexts)
- **SOP Search Service** (Keyword-matching fallback mapping cosine-similarity vector search)

### Infrastructure (Configured via `docker-compose.yml`)
- **PostgreSQL** with **PGVector** extension (structured and vector database)
- **Redis** (websocket session registry)
- **Apache Kafka** & **Zookeeper** (high-throughput event bus streams)

---

## Quickstart Guide

### 1. Ingress Infrastructure Setup (Docker)
Start the PostgreSQL + PGVector database, Redis cache, and Kafka brokers using:
```bash
docker-compose up -d
```

### 2. Launch Backend Application
Initialize Python dependencies and boot the FastAPI gateway (routes on Port `3000` to link with the frontend client):
```bash
# Verify Python is installed and initialize environment
pip install -r requirements.txt

# Start the uvicorn development server
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload --app-dir backend
```

### 3. Launch Frontend Client
Initialize NPM dependencies and boot the Vite development server (Port `3000` on client-side proxy):
```bash
# Install dependencies
npm install

# Start Vite client on localhost:3000
npm run dev
```

---

## Running Tests & Validation

To guarantee robustness, reliability, and code excellence, StadiumMind AI features a comprehensive suite of unit and integration tests across both the frontend and backend architectures:

### 1. Frontend Test Suite (Vitest)
Unit tests for core calculations (walk-times, congestion index, and access-control RBAC permissions) are powered by **Vitest**:
```bash
# Run all frontend tests in single-run mode
npm run test
```

### 2. Backend Test Suite (Python Unittest)
API endpoints, DB schema seeding, RAG pipeline keywords scoring, and agent orchestrator workflows are validated using **isolated in-memory SQLite instances** (fully hermetic, no state leaks):
```bash
# Run all backend tests
python -m unittest discover backend/tests
```

### 3. Live Dashboard Diagnostics
Run the live unit-test assertions directly in the browser by navigating to the **System Specs & Blueprint** tab in the dashboard and clicking **"Run Diagnostics Suite"**.

---

## Offline Telemetry & Hackathon Mode

To ensure the system works seamlessly out-of-the-box for evaluation and local hackathon demonstrations without requiring a running Docker daemon:
1. **Fallback Event Bus**: The frontend will attempt to connect to the backend WebSockets port. If it fails, it will **automatically fall back to internal simulation mode**.
2. **Internal Telemetry Generator**: Gate queues, crowd congestion risks, and power metrics will update dynamically in the client state.
3. **Agent Sandbox**: The "Inject Alert" panel triggers simulated ReAct cycles on the front-end directly if the backend is offline. You can trigger crowd stampede warnings, security cordons, and medical dispatches immediately!
4. **Interactive Spec Hub**: Select the "System Specs & Blueprint" tab in the dashboard to review all 30 enterprise-grade deliverables, databases, schemas, prompt blueprints, and scalability projections!
