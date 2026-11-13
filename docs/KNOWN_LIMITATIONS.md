# AirOps Intelligence — Known Limitations & Architectural Boundaries

In accordance with strict technical integrity and portfolio transparency, this document lists all known operational, architectural, and data boundaries of the AirOps Intelligence prototype.

---

## 1. Data Persistence & Storage Scale

| Aspect | Current Prototype Implementation | Production Enterprise Requirement |
| :--- | :--- | :--- |
| **Storage Medium** | Browser `localStorage` (22 key partitions). | Relational Cloud SQL (PostgreSQL) or Google Cloud Firestore. |
| **Storage Capacity** | Restricted to ~5MB per browser origin. | Multi-terabyte transactional database with cold archival in cloud data warehouse. |
| **Multi-Device Sync** | Local to single browser instance; manual JSON backup export/import required to transfer state. | Real-time database synchronization via WebSockets or managed cloud database. |
| **Durability** | Subject to browser cache clearing or Incognito mode termination. | ACID transactions, automated point-in-time recovery (PITR), multi-region replication. |

---

## 2. Telemetry & Hardware Connectivity

| Component | Current Prototype Implementation | Production Enterprise Requirement |
| :--- | :--- | :--- |
| **Flight Status Feed** | Seeded 300-flight (7-day) synthetic fleet + user CSV ingestion. | Live airline messaging gateway and flight-telemetry stream ingestion. |
| **Ramp Scanners (`WF-104`)** | Modeled in staging simulation (1,120 demonstrated benchmark capacity hours). | Physical handheld barcode/RFID scanners on ramp apron Wi-Fi / private 5G. |
| **Maintenance Parts (`SOL-105`)** | Mapped to simulated maintenance parts catalogue and OCR prompt parser. | Live maintenance inventory REST API integration with real-time warehouse locking. |
| **Passenger Rebooking (`WF-101`)** | Booking-record schema simulation with one-click token generator. | Approved passenger reservation and booking-queue integration credentials. |

---

## 3. Identity, Access & Multi-Tenancy

| Area | Current Status | Production Roadmap |
| :--- | :--- | :--- |
| **Authentication** | Intentionally not implemented; single-user local prototype mode. | SAML 2.0 / OIDC integration with Microsoft Entra ID (Azure AD) or Okta. |
| **Authorization / RBAC** | Single open role (`Local Session`). | Fine-grained roles: `OCC_DIRECTOR`, `BI_ANALYST`, `SOLUTIONS_ARCHITECT`, `STATION_MANAGER`. |
| **Multi-Tenancy** | Single airline fleet modeling (`SkyStream Airlines`). | Multi-tenant tenant ID isolation per airline operating certificate (AOC). |

---

## 4. Compute & Ingestion Performance

- **Client-Side CSV Parsing:** Runs on the browser JavaScript main thread. Optimized and tested up to 2,500 flight records. Files exceeding 25,000 rows should be processed via Web Workers or server-side chunked streaming.
- **AI Latency:** Server-side Gemini API calls typically complete within 2.5–6.0 seconds depending on network latency and prompt size. Network timeouts are guarded at 18 seconds.
- **Offline Operation:** Core deterministic operational metrics (OTP, average delay, route ranking, workflow simulation) operate 100% offline; AI Copilot requires an active internet connection to reach Google AI Studio APIs.
