# AirOps Intelligence — System Architecture

This document describes the technical architecture, component boundaries, security enforcement, and design patterns implemented in the AirOps Intelligence platform.

---

## 1. High-Level Architectural Diagram

```mermaid
graph TB
    subgraph Client ["Client Layer (Browser Runtime)"]
        UI[React 19 SPA + Tailwind CSS 4]
        Router[Module Navigation Controller]
        State[Local Cache Stores - 22 Partitions]
        CalcEngine[Deterministic KPI & ROI Engine]
        WorkflowSim[Deterministic Step Simulator]
        AuditClient[Audit Trail Logger Client]
    end

    subgraph Server ["Server Layer (Node.js & Express)"]
        SecHeaders[Defensive Security Headers Middleware]
        RateLimiter[In-Memory Token Rate Limiter 30 req/min]
        JsonHandler[Payload Validation & JSON Error Handler]
        ApiRoutes[Express REST API Endpoints]
        AuditServer[In-Memory Audit Ledger Store]
        ViteMid[Vite Development Middleware / Static Assets]
    end

    subgraph External ["External Services & Models"]
        Gemini[Google Gemini API Models: gemini-3.1-flash-lite / 3.8-flash]
    end

    UI --> Router
    Router --> CalcEngine
    Router --> WorkflowSim
    Router --> State
    Router --> AuditClient

    UI -- "HTTP POST /api/gemini/copilot (Secured Proxy)" --> SecHeaders
    UI -- "HTTP GET/POST /api/audit-events" --> SecHeaders
    UI -- "HTTP GET /api/health" --> SecHeaders

    SecHeaders --> RateLimiter
    RateLimiter --> JsonHandler
    JsonHandler --> ApiRoutes

    ApiRoutes -- "POST /api/audit-events" --> AuditServer
    ApiRoutes -- "Server-to-Server HTTPS (API Key Injected Server-Side)" --> Gemini

    ViteMid -. "Serves SPA Bundles & Assets" .-> UI
```

---

## 2. Layer Responsibilities

### Client Layer (React 19 SPA)
- **Framework & Styling:** Built with React 19, TypeScript 7, and Tailwind CSS 4 (`@import "tailwindcss";`).
- **Data Visualization:** Responsive chart rendering via Recharts with explicit zero-width min-width containers (`ResponsiveContainer`, `BarChart`, `PieChart`, `CartesianGrid`, `Tooltip`).
- **Deterministic Math:** Client-side computation of all operational metrics (`calculateOperationalMetrics`), ROI projections (`calculateAutomationROI`), and step-by-step workflow executions (`simulateWorkflowExecution`) to guarantee instantaneous feedback (< 50ms) without cloud network latency.
- **Client Persistence:** Local storage abstraction (`src/utils/storage.ts`, `src/utils/performanceStorage.ts`, `src/utils/requirementsStorage.ts`, `src/utils/workflowStorage.ts`, `src/utils/auditLogger.ts`) with quota management and full-archive backup/restore.

### Server Layer (Node.js & Express)
- **Single Process Full-Stack Model:** Express backend configured in `server.ts`. In development, Vite is mounted via `vite.middlewares` (`"dev": "tsx server.ts"`). In production, Express serves compiled static files from `dist/` with SPA fallback routing.
- **Defensive Security Headers:**
  - `X-Content-Type-Options: nosniff` (mitigates MIME-type sniffing).
  - `X-Frame-Options: SAMEORIGIN` (prevents cross-origin clickjacking).
  - `X-XSS-Protection: 1; mode=block`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **In-Memory Rate Limiting:** Enforces a sliding window limit of 30 requests per minute per IP on `/api/gemini/*` endpoints to protect against quota exhaustion and denial-of-service.
- **Payload Validation & Error Sanitization:** Restricts AI inquiry length to 8,000 characters and catches malformed JSON syntax errors, returning clean HTTP 400 responses without exposing internal server stack traces.

### External AI Model Integration
- **Google GenAI SDK (`@google/genai`):** Used on the server side to invoke models via modern APIs.
- **Model Fallback Cascade:** Automatically attempts `gemini-3.1-flash-lite`, with structured fallback to `gemini-3.8-flash`.
- **Zero Client-Side Secret Leakage:** The `GEMINI_API_KEY` is accessed exclusively in Node.js runtime memory (`process.env.GEMINI_API_KEY`), never bundled or passed to the browser.

---

## 3. Technology Stack Reference

| Layer | Component | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | `^19.0.1` | Declarative UI and hook-driven state management |
| **Frontend** | TypeScript | `^7.0.2` | Static type safety and data model enforcement |
| **Frontend** | Tailwind CSS | `^4.3.3` | Modern, responsive dark enterprise utility styling |
| **Frontend** | Recharts | `^3.10.1` | Interactive operational and financial charts |
| **Frontend** | Lucide React | `^0.546.0` | Comprehensive enterprise iconography |
| **Frontend** | Motion | `^12.23.24` | Smooth transitions and state animations |
| **Backend** | Node.js | `>= 22.0.0` | Backend JavaScript runtime |
| **Backend** | Express | `^4.21.2` | Web API routing and middleware management |
| **Backend** | TSX | `^4.21.0` | Fast TypeScript execution for `server.ts` |
| **Backend** | Dotenv | `^17.2.3` | Environment variable parsing |
| **AI SDK** | @google/genai | `^3.1.0` | Server-side Google Gemini TypeScript integration |
| **Build Tool** | Vite | `^8.3.0` | Next-generation frontend bundler and dev middleware |

---

## 4. Architectural Boundaries & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Airline Operations Analyst
    participant Client as React Client (Browser)
    participant Server as Express Backend (server.ts)
    participant Gemini as Google Gemini AI API

    User->>Client: Enters delay inquiry or operational problem
    Client->>Client: Gathers verified dataset metrics (OTP, delays, routes)
    Client->>Server: POST /api/gemini/copilot (message, sanitized metrics context, mode)
    Server->>Server: Checks Rate Limiter (30 req/min limit)
    Server->>Server: Validates request payload & length (< 8,000 chars)
    Server->>Gemini: POST generateContent (systemInstruction, operationalContextStr, inquiry)
    Gemini-->>Server: Returns structured 4-section response
    Server-->>Client: HTTP 200 { success: true, reply, model, timestamp }
    Client->>Client: Parses [CALCULATED FACT], [INTERPRETATION], [RECOMMENDATION], [INVESTIGATION]
    Client->>User: Renders structured operational recommendation & OCC sign-off reminder
    Client->>Server: POST /api/audit-events (asynchronous audit record)
```
