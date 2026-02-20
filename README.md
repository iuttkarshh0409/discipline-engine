# ⚡ Project Discipline Engine (PDE)
> **Deterministic Resource Allocation & Probabilistic Risk Analytics**

[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20(Vite)-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![SQLModel](https://img.shields.io/badge/Database-SQLModel-4E9A06?style=for-the-badge&logo=python&logoColor=white)](https://sqlmodel.tiangolo.com/)
[![Logs](https://img.shields.io/badge/Logging-Loguru-EB7B59?style=for-the-badge&logo=python&logoColor=white)](https://github.com/Delgan/loguru)
[![Tests](https://img.shields.io/badge/Tests-Pytest-white?style=for-the-badge&logo=pytest&logoColor=blue)](https://pytest.org/)
[![License](https://img.shields.io/badge/License-MIT-F7DF1E?style=for-the-badge)](LICENSE)

Project Discipline Engine is a high-performance project execution dashboard. Unlike traditional "to-do" lists, PDE treats projects as **Directed Acyclic Graphs (DAGs)**, applying deterministic algorithms (CPM) and probabilistic risk modeling to suggest the single most impactful task you should be working on *right now*.

---

## 🧠 The Core Engine

PDE is powered by four specialized modules that work in concert to eliminate decision fatigue and optimize project velocity.

### 1. Deterministic Graph Engine (CPM)
The engine models your tasks and their dependencies as a graph. It performs forward and backward passes to identify the **Critical Path**.
- **Critical Path Detection:** Automatically highlights tasks that, if delayed, will delay the entire project.
- **Slack Calculation:** Measures exactly how much "float" or delay each non-critical task can absorb.
- **Verified Math:** Unit tests validate linear chains, parallel branches, and slack correctness.

### 2. Heuristic Scoring V3 (The "Next Best Action")
The "Strategy Advisor" uses a multi-factor heuristic to rank tasks based on real-world constraints:
```math
Score = (Impact \times 10) - (Effort \times 5) + MilestoneBonus + Urgency + TimeFit - DelayPenalty
```
*   **Time Fit Bonus:** Dynamically rewards tasks that fit into your *current* available window.
*   **Delay Penalty:** Scaled based on the project's overall **Risk Score**.
*   **Proven Logic:** Deterministic ranking tests ensure that impact, effort, and urgency translate to the correct prioritize order.

### 3. Probabilistic Risk Model
PDE calculates your **Projected Completion Date** using your real-time velocity.
- **Velocity Tracking:** Measures tasks completed per day over the project lifecycle.
- **Risk Assessment:** Analyzes the gap between *Current Velocity* and *Required Velocity* to flag potential slippage.

### 4. Structured Observability
The backend integrates **Loguru** for high-fidelity execution tracking and diagnostics.
- **Unified Logging:** Captures critical transitions, CPM calculations, and heuristic scoring decisions in `logs/pde.log`.
- **Real-time Metrics:** Internal `MetricsTracker` monitors engine performance (`cpm_runs`, `tasks_scored`, `risk_evaluations`) accessible via the `/metrics` endpoint.
- **Diagnostic Tracing:** Enables rapid troubleshooting of complex graph transformations and performance bottlenecks.

---

## 🏗 Quality Assurance

The engine is backed by a robust testing suite ensuring mathematical and logical integrity.

- **Unit Tests**: Full coverage for `graph_engine` (CPM logic) and `logic.py` (Heuristic scoring).
- **Integration Tests**: API endpoint validation and database isolation using an in-memory SQLite test database.
- **Test Command**:
  ```bash
  cd backend
  pytest
  ```

---

## 🛠 Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Backend** | **Python 3.10+ / FastAPI** | High-performance asynchronous API layer. |
| **Logic** | **SQLModel (SQLAlchemy + Pydantic)** | Unified data modeling and ORM. |
| **Testing** | **Pytest / HTTpx** | Automated test infrastructure and API mocking. |
| **Observability** | **Loguru** | Structured logging and diagnostic tracing. |
| **Intelligence** | **Gemini AI Integration** | AI-augmented roadmapping and strategic coaching. |
| **Frontend** | **React 18 / Vite** | Reactive state management and real-time updates. |
| **Styling** | **Vanilla CSS + Glassmorphism** | Premium, high-fidelity UI aesthetics. |
| **Graphing** | **Mermaid.js** | Architectural and dependency visualization. |

---

## 📐 System Architecture

```mermaid
graph TD
    User([User]) -->|Natural Language Plan| AI[AI Integration Layer]
    AI -->|Structured JSON| DB[(PostgreSQL/SQLite)]
    User -->|Manual Task Entry| API[FastAPI Backend]
    API -->|Query| DB
    
    subgraph Logic Engine
        API --> Graph[Graph Engine: CPM]
        API --> Risk[Risk & Velocity Model]
        API --> Strategy[Strategy Advisor: Heuristic Scoring]
        API --> Logs[Loguru Observability]
        API --> Test[Pytest Infrastructure]
    end
    
    Graph --> UI[React Frontend: Glassmorphism]
    Risk --> UI
    Strategy --> UI
```

---

## 🌐 Deployment

The engine is engineered for cloud scalability:
- **Frontend:** Hosted on **Netlify** with CI/CD integration.
- **Backend:** Deployed on **Render** (or Railway) with persistent storage.
- **Documentation:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for environment variables and setup details.

---

## 🚀 Getting Started

### Backend Infrastructure
1. **Initialize Environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/Scripts/activate # Windows: venv\\Scripts\\activate
   pip install -r requirements.txt
   ```
2. **Database Configuration**:
   The engine defaults to `discipline.db` (SQLite). For high-performance environments, update the `DATABASE_URL` in `backend/database.py` to point to a PostgreSQL instance.
3. **Launch Engine**:
   ```bash
   python main.py
   ```
4. **Run Tests**:
   ```bash
   pytest
   ```

### Frontend Interface
1. **Bootstrap Client**:
   ```bash
   cd frontend
   npm install
   ```
2. **Start Dev Server**:
   ```bash
   npm run dev
   ```

---

## 🛣 Roadmap

- [x] **Phase 1: Basic MVP** - Task tracking, impact scoring.
- [x] **Phase 2: Analytics** - Velocity tracking, consistency scoring, glassmorphism UI.
- [x] **Phase 3: Deep Logic** - Graph engine, Critical path, AI advisor, dependencies.
- [x] **Phase 4: Optimization & Observability** - Structured logging, test automation, performance metrics.
- [ ] **Phase 5: Multi-Project Synthesis** - Portfolio-level resource allocation and cross-project dependency mapping.

---

*Made with ❤️ for peak performance.*
