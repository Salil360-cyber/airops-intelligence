# AirOps Intelligence — Testing & Quality Assurance

This document details the automated regression testing suite, verification methodologies, and empirical quality assurance results for AirOps Intelligence.

---

## 1. Testing Philosophy

AirOps Intelligence emphasizes **empirical verification over speculative assertion**:
- Core mathematical calculations (OTP, delays, ROI, payback) are unit-tested with boundary conditions (zero denominators, NaN, empty datasets).
- API security, payload sanitization, and rate limiting are verified with live HTTP requests against the backend server.
- All cross-phase IDs (`PRB-001..006`, `OPP-101..106`, `WF-101..106`, `BR-001..006`, `FR-001..010`, `US-001..008`, `SOL-101..106`) are verified for zero broken references or orphaned records.

---

## 2. Automated Regression Test Suite (34 Assertions)

All test categories and 34 deterministic assertions in `scripts/verify-regression.ts` pass:

| Test ID | Sector | Description | Verification Method | Result |
| :---: | :--- | :--- | :--- | :---: |
| **01** | **CSV Ingestion** | Validates headers, alias resolution, empty files, duplicate flight IDs, and completeness scoring. | `src/utils/csvParser.ts` edge-case matrix | **PASS** |
| **02** | **KPI Calculations** | Computes OTP-15, OTP-0, average delay, median delay, cancellation rate with zero-division guards. | Deterministic unit tests with zero denominators | **PASS** |
| **03** | **Copilot Response** | Verifies server-side Gemini integration returning all 4 constitutional sections. | Live HTTP POST to `/api/gemini/copilot` | **PASS** |
| **04** | **Workflow Simulation** | Validates deterministic step execution, condition branches, and latency simulation across `WF-101` to `WF-106`. | `workflowSimulator.ts: simulateWorkflowExecution()` | **PASS** |
| **05** | **ROI Calculator** | Verifies net annual benefit, first-year net benefit, ROI percentage, and payback horizon in months. | `roiCalculator.ts: calculateAutomationROI()` | **PASS** |
| **06** | **Problem Registry** | Validates registration of all 6 operational problems (`PRB-001` through `PRB-006`). | Relational key validation in `requirementsStorage.ts` | **PASS** |
| **07** | **Process Mapping** | Generates syntactically validated As-Is and To-Be Mermaid flowcharts. | `mermaidGenerator.ts` syntax verification | **PASS** |
| **08** | **Requirements Trace**| Verifies bidirectional traceability across `BR-001..006`, `FR-001..010`, and `US-001..008`. | Key linkage audit in `requirementsStorage.ts` | **PASS** |
| **09** | **UAT Test Runner** | Validates test scenarios (`TC-001` to `TC-005`) with steps, preconditions, and execution tracking. | `INITIAL_UAT_TEST_CASES` inspection | **PASS** |
| **10** | **Solutions Portfolio**| Verifies all 6 digital solutions (`SOL-101` to `SOL-106`) across 5 lifecycle stages. | `performanceStorage.ts: INITIAL_PORTFOLIO` | **PASS** |
| **11** | **Benefits Realization**| Enforces strict separation of Estimated (computed from opportunity data), Demonstrated Benchmark (1,120h), and Live Production (0h). | Data model value tier audit | **PASS** |
| **12** | **Governance Reports** | Verifies all 6 executive markdown report templates with value tier disclosures. | `performanceReports.ts: generatePerformanceReport()` | **PASS** |
| **13** | **AI Performance Analyst**| Confirms specialized portfolio audit mode returns verified numbers and recommendations. | Live HTTP POST in `SOLUTIONS_PERFORMANCE_ANALYSIS` | **PASS** |
| **14** | **Persistence & Backup**| Validates full-state JSON export, schema-validated import, factory reset, and storage quota catch. | `src/utils/storage.ts` backup suite | **PASS** |
| **15** | **Audit Trail Logging** | Verifies local prototype audit log (browser storage, resettable), CSV export, JSON export, and async server notification. | `src/utils/auditLogger.ts` event tracking | **PASS** |
| **16** | **API Security** | Confirms malformed JSON returns HTTP 400, security headers (`nosniff`, `SAMEORIGIN`), and rate limiting active. | Live curl / HTTP request inspection | **PASS** |

---

## 3. Mathematical Formula Edge-Case Verification

To ensure zero `NaN`, `Infinity`, or negative calculation crashes:

```typescript
function safeDiv(num: number, den: number, fallback = 0): number {
  if (!den || isNaN(den) || !isFinite(den) || den === 0) return fallback;
  const res = num / den;
  return isNaN(res) || !isFinite(res) ? fallback : res;
}
```

### Edge Cases Audited:
- `safeDiv(100, 0, 0)` $\to$ `0` (Zero denominator returns fallback, never `Infinity`).
- `safeDiv(NaN, 100, 0)` $\to$ `0` (`NaN` numerator handled gracefully).
- `safeDiv(0, 0, 0)` $\to$ `0` (Zero divided by zero returns fallback, never `NaN`).
- Manual 18m - (4s / 60) $\to$ `17.933m` saved per run (Seconds-to-minutes unit conversion preserved).

---

## 4. How to Run Verification Commands

```bash
# 1. Type safety check
npm run lint

# 2. Automated regression test suite
npm test

# 3. Production build verification
npm run build

# 4. Server health verification
curl -s http://localhost:3000/api/health | jq .

# 5. Live AI Copilot verification
curl -s -X POST http://localhost:3000/api/gemini/copilot \
  -H "Content-Type: application/json" \
  -d '{"message":"Summarize fleet OTP.","mode":"GENERAL_ANALYSIS","context":{"totalFlights":300,"delayedFlights":72,"onTimePerformance":75.3}}' | jq .
```
