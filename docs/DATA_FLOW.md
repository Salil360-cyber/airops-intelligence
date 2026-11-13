# AirOps Intelligence — Data Flow & Ingestion Pipeline

This document explains the data lifecycle, data transformation pipelines, and event propagation flows across AirOps Intelligence.

---

## 1. Operational Analytics & CSV Ingestion Pipeline

```mermaid
flowchart TD
    A[Raw CSV File Upload] --> B{CSV Parser & Validator<br/>csvParser.ts}
    B -- Empty File --> C[Return Empty Report & Guard Alert]
    B -- Invalid / Missing Headers --> D[Flag Missing Required Headers<br/>e.g. flight_id, origin, destination]
    B -- Valid Headers --> E[Normalize Column Aliases<br/>e.g. sched_dep -> scheduled_departure]
    
    E --> F[Line-by-Line Type Coercion & Cleansing]
    F --> G{Record Validation}
    G -- Invalid Format --> H[Log Invalid Row Detail with Line Number]
    G -- Duplicate Flight ID --> I[Track Duplicate Flight IDs]
    G -- Valid Record --> J[Construct FlightRecord Entity]

    J --> K[Calculate Dataset Completeness Score]
    K --> L[Generate CSVValidationReport]
    L --> M[Pass Valid FlightRecords to Application State]

    M --> N[Deterministic KPI Calculator<br/>calculator.ts]
    N --> O1[On-Time Performance OTP-15 / OTP-0]
    N --> O2[Average & Median Delay Durations]
    N --> O3[Cancellation & Delay Percentages]
    N --> O4[Corridor / Route Performance Rankings]
    N --> O5[Operating Carrier Breakdown]
    N --> O6[Delay Reason Category Groupings]

    O1 & O2 & O3 & O4 & O5 & O6 --> P[Render Reactive Visualizations & Copilot Context]
```

### Ingestion Validation Rules
1. **Header Alias Resolution:** Supports varying naming conventions from disparate legacy feeds (e.g. `carrier`, `airline_name`, `operator` normalize to `airline`; `sched_dep`, `std`, `sched_departure_time` normalize to `scheduled_departure`).
2. **Duplicate Detection:** Scans for multiple flights sharing identical `flight_id` on the same date and flags them in the validation drawer.
3. **Data Completeness Index:** Calculates the ratio of populated non-null fields across distance, equipment type, passenger load, and delay causes to provide a transparency score (0–100%).
4. **Resilient Row Skipping:** Corrupted rows are isolated with their line numbers and error reasons; valid rows are parsed and presented without terminating ingestion.

---

## 2. Requirements Engineering Traceability Flow

```mermaid
graph LR
    subgraph ProblemSpace ["Phase 4: Problem Identification"]
        PRB[Business Problem<br/>PRB-001 to PRB-006]
        BTN[Operational Bottleneck<br/>BTN-001 to BTN-007]
        PRB --> BTN
    end

    subgraph ReqEngineering ["Phase 4: Requirements Engineering"]
        BR[Business Requirement<br/>BR-001 to BR-006]
        FR[Functional Requirement<br/>FR-001 to FR-010]
        US[User Story<br/>US-001 to US-008]
        AC[Acceptance Criteria<br/>Given/When/Then]
        
        BTN --> BR
        BR --> FR
        FR --> US
        US --> AC
    end

    subgraph SolutionSpace ["Phase 3 & Phase 5: Solution Lifecycle"]
        OPP[Automation Opportunity<br/>OPP-101 to OPP-106]
        WF[Workflow Architecture<br/>WF-101 to WF-106]
        SOL[Solution Portfolio Item<br/>SOL-101 to SOL-106]
        BEN[Benefits Realization<br/>BEN-101 to BEN-106]
        IMP[Operational Impact<br/>IMP-101 to IMP-106]
        
        PRB -.-> OPP
        OPP --> WF
        WF --> SOL
        SOL --> BEN
        SOL --> IMP
    end
```

---

## 3. Workflow Simulation Data Flow

The workflow simulation engine (`src/utils/workflowSimulator.ts`) executes in-browser:

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as Solutions Analyst
    participant UI as Workflow Studio Canvas
    participant Sim as Simulation Engine (workflowSimulator.ts)
    participant Store as Simulation Run Cache (localStorage)

    Analyst->>UI: Selects workflow (e.g., WF-101) & scenario (Severe Disruption / Nominal)
    UI->>Sim: simulateWorkflowExecution(workflow, scenario)
    loop Each Step in Sequence
        Sim->>Sim: Evaluates step type (Trigger, Data Input, Validation, Condition, Approval, Action)
        Sim->>Sim: Injects mock latency (e.g. 50ms - 450ms)
        alt Step Condition Passes
            Sim->>Sim: Emits StepStatus: SUCCESS with output payload
        else Step Condition Fails or Step Failure Forced
            Sim->>Sim: Emits StepStatus: FAILED with error detail
            Sim->>Sim: Skips remaining dependent steps
        end
    end
    Sim->>Sim: Computes total simulated duration (ms) & automated savings (mins)
    Sim->>Store: Persists WorkflowSimulationRun trace log
    Sim-->>UI: Returns step logs & visual execution timeline
```

---

## 4. Audit Trail Event Propagation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Auditor
    participant Component as Module UI Component
    participant Logger as Client Audit Logger (auditLogger.ts)
    participant Storage as Browser LocalStorage
    participant Backend as Express Server (/api/audit-events)

    User->>Component: Performs mutating action (Create PRB, Edit WF, Reclassify SOL)
    Component->>Logger: recordAuditEvent({ entityType, entityId, action, previousValue, newValue, notes })
    Logger->>Logger: Generates unique Audit ID (e.g. AUD-009) & UTC Timestamp
    Logger->>Storage: Writes updated event array to 'airops_audit_trail_events'
    Note over Logger,Storage: Intercepts QuotaExceededError and trims older entries if storage is full
    Logger->)Backend: POST /api/audit-events (asynchronous HTTP background notification)
    Backend->>Backend: Appends event to in-memory server audit ledger
    Logger-->>Component: Returns recorded AuditEvent entity
```
