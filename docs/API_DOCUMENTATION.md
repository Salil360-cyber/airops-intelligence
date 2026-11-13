# AirOps Intelligence — API Documentation

This document describes all REST API endpoints provided by the AirOps Intelligence backend server (`server.ts`).

---

## Base URL
```
http://localhost:3000
```

---

## 1. Health Check
Retrieves the runtime status of the server, configured AI capabilities, and active audit log volume.

- **Method:** `GET`
- **Path:** `/api/health`
- **Authentication:** None (Prototype)
- **Rate Limit:** Unrestricted

### Response (HTTP 200 OK)
```json
{
  "status": "ok",
  "timestamp": "2026-11-12T13:35:46.203Z",
  "geminiConfigured": true,
  "service": "AirOps Intelligence Server",
  "environment": "Local Prototype",
  "auditEventsCount": 8
}
```

---

## 2. Gemini AI Copilot
Processes natural language operational queries, delay diagnostics, requirements generation, and solutions performance audits using Google Gemini models via server-side execution.

- **Method:** `POST`
- **Path:** `/api/gemini/copilot`
- **Headers:** `Content-Type: application/json`
- **Rate Limit:** **30 requests per minute per IP** (Returns HTTP 429 when exceeded)

### Request Payload Schema
```json
{
  "message": "Audit our solutions portfolio. Give me calculated facts, interpretation, and recommendations.",
  "mode": "SOLUTIONS_PERFORMANCE_ANALYSIS",
  "context": {
    "totalFlights": 300,
    "delayedFlights": 72,
    "onTimePerformance": 75.3,
    "hasDelayCauses": true,
    "topDelayCauses": [
      { "cause": "ATC Flow", "count": 24 }
    ],
    "summaryMetrics": {
      "totalOpportunities": 6,
      "implementedSolutions": 1,
      "totalExecutions": 3691,
      "workflowSuccessRate": 99.3,
      "totalEstimatedHours": 6315,
      "totalDemonstrationHours": 1120,
      "totalMeasuredHours": 0
    }
  },
  "history": [
    {
      "sender": "user",
      "text": "What is our primary turnaround bottleneck?"
    },
    {
      "sender": "assistant",
      "text": "The primary turnaround bottleneck is paper loadsheet verification at the ramp."
    }
  ]
}
```

### Supported Specialization Modes
| Mode | Description | Constitutional Output Enforced |
| :--- | :--- | :---: |
| `GENERAL_ANALYSIS` | Fleet-wide analytics, OTP summary, and carrier comparison. | Yes |
| `DELAY_INVESTIGATION` | Deep-dive root-cause analysis on a specific flight ID or corridor. | Yes |
| `EXECUTIVE_SUMMARY` | High-level synthesis for VP of Flight Ops with human sign-off notices. | Yes |
| `PROCESS_IMPROVEMENT` | Identifies automation candidates from repetitive manual friction. | Yes |
| `REQUIREMENTS_GENERATION` | Formulates structured business requirements and user stories. | Yes |
| `SOLUTIONS_PERFORMANCE_ANALYSIS`| Audits solutions portfolio, adoption gaps, and benefit realization tiers. | Yes |

### Success Response (HTTP 200 OK)
```json
{
  "success": true,
  "reply": "### [CALCULATED FACT]\n- Total analyzed flights: 300\n- On-Time Performance (OTP-15): 75.3%\n\n### [OPERATIONAL INTERPRETATION]\nATC Flow delays account for 33% of delayed departures in the sample dataset...\n\n### [RECOMMENDATION]\nDeploy automated slot monitor with crew duty alerts (WF-103)...\n\n### [NEXT INVESTIGATION]\nAcquire air traffic control departure slot clearance timestamps...",
  "model": "gemini-3.1-flash-lite",
  "timestamp": "2026-11-12T13:35:46.203Z"
}
```

### Error Responses
- **HTTP 400 Bad Request:** Missing or empty `message` string, or malformed JSON syntax.
  ```json
  {
    "error": "Missing or empty \"message\" parameter. A non-empty text inquiry is required.",
    "code": "INVALID_REQUEST"
  }
  ```
- **HTTP 413 Payload Too Large:** Inquiry message exceeds 8,000 characters.
  ```json
  {
    "error": "Inquiry message exceeds maximum allowed limit (8,000 characters). Please provide a more concise inquiry.",
    "code": "PAYLOAD_TOO_LARGE"
  }
  ```
- **HTTP 429 Too Many Requests:** Client IP exceeded the 30 req/min rate limit.
  ```json
  {
    "error": "AI query rate limit exceeded (30 requests/minute). Please wait before submitting another inquiry.",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfterSeconds": 42
  }
  ```
- **HTTP 503 Service Unavailable:** `GEMINI_API_KEY` is not configured in server environment.
  ```json
  {
    "error": "Gemini API key is not configured. Please ensure GEMINI_API_KEY is configured in Settings > Secrets."
  }
  ```

---

## 3. Audit Events Ledger
Retrieves, records, or resets the in-memory server audit trail events.

### 3.1 Get All Audit Events
- **Method:** `GET`
- **Path:** `/api/audit-events`

#### Response (HTTP 200 OK)
```json
{
  "events": [
    {
      "id": "AUD-001",
      "timestamp": "2026-11-12T04:00:00Z",
      "entityType": "Evidence Classification",
      "entityId": "WF-104",
      "action": "RECLASSIFY",
      "actor": "Lead Solutions QA Auditor",
      "previousValue": "Production Measured",
      "newValue": "Demonstration Benchmark",
      "notes": "Reclassified from live production claim to synthetic demonstration benchmark per Phase 5.1 technical audit.",
      "environment": "Local Prototype Record"
    }
  ],
  "totalCount": 8,
  "environment": "Local Prototype Record",
  "disclaimer": "Locally generated prototype audit events. Stored in local runtime memory without connection to external monitoring or production ledger."
}
```

### 3.2 Record Audit Event
- **Method:** `POST`
- **Path:** `/api/audit-events`
- **Payload:**
  ```json
  {
    "entityType": "Workflow",
    "entityId": "WF-102",
    "action": "UPDATE",
    "previousValue": "Status: Draft",
    "newValue": "Status: Active",
    "notes": "Enabled scheduled execution for 05:00 UTC Daily Ops Pipeline.",
    "actor": "Solutions Architect"
  }
  ```
#### Response (HTTP 201 Created)
```json
{
  "success": true,
  "event": {
    "id": "AUD-482019",
    "timestamp": "2026-11-12T13:38:00.000Z",
    "entityType": "Workflow",
    "entityId": "WF-102",
    "action": "UPDATE",
    "actor": "Solutions Architect",
    "previousValue": "Status: Draft",
    "newValue": "Status: Active",
    "notes": "Enabled scheduled execution for 05:00 UTC Daily Ops Pipeline.",
    "environment": "Local Prototype Record"
  }
}
```

### 3.3 Reset Audit Events
- **Method:** `DELETE`
- **Path:** `/api/audit-events`
#### Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Audit events reset to baseline defaults"
}
```
