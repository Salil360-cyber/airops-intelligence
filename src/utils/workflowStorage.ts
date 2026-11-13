import { WorkflowDefinition, WorkflowSimulationRun } from '../types';

const STORAGE_KEY_WORKFLOWS = 'airops_workflow_definitions_v3';
const STORAGE_KEY_SIMULATIONS = 'airops_workflow_simulations_v3';

export const INITIAL_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'WF-101',
    processId: 'OPP-101',
    name: 'Passenger Disruption Multi-Channel Notification Engine',
    description: 'Subscribes to OCC flight departure revisions, pulls impacted passenger PNRs, verifies connection risks, and dispatches automated SMS/Email with digital vouchers.',
    department: 'Customer Experience',
    status: 'Active',
    createdAt: '2026-10-16',
    updatedAt: '2026-11-06',
    steps: [
      {
        id: 's-101-1',
        name: 'Flight Delay Webhook Event',
        type: 'Trigger',
        description: 'Listens for flight status / OCC departure revision events where delay_minutes >= 20.',
        config: {
          triggerEvent: 'FLIGHT_DELAY_DETECTED',
        },
      },
      {
        id: 's-101-2',
        name: 'Extract Affected Bookings',
        type: 'Data Input',
        description: 'Queries reservation API to pull passenger manifest and connection itineraries.',
        config: {
          inputSchema: 'RESERVATION_MANIFEST_QUERY',
        },
      },
      {
        id: 's-101-3',
        name: 'Validate Passenger Contact & Rebooking Tokens',
        type: 'Validation',
        description: 'Verifies email and mobile phone validity, checks GDPR/TCPA opt-out flags, and generates one-click rebooking JWT tokens.',
        config: {
          validationRule: 'PHONE_NUMBER_VALID && OPT_IN_VERIFIED',
        },
      },
      {
        id: 's-101-4',
        name: 'Evaluate Connection Risk & Compensation Tier',
        type: 'Condition',
        description: 'Checks if minimum connect time (MCT) is breached at destination hub or if delay exceeds 3 hours.',
        config: {
          conditionField: 'delay_minutes',
          conditionOperator: '>',
          conditionValue: '45',
        },
      },
      {
        id: 's-101-5',
        name: 'Generate Dynamic Digital Meal Voucher',
        type: 'Data Transformation',
        description: 'Injects QR meal voucher barcode and passenger rebooking link into message payload.',
        config: {
          transformationType: 'INJECT_DIGITAL_VOUCHER_QR',
        },
      },
      {
        id: 's-101-6',
        name: 'Dispatch Multi-Channel Notification',
        type: 'Notification',
        description: 'Sends push notification via Airline App with fallback to SMS and email delivery.',
        config: {
          notificationChannel: 'SMS',
          notificationRecipient: 'ALL_IMPACTED_PASSENGERS',
        },
      },
      {
        id: 's-101-7',
        name: 'Disruption Log Finalized',
        type: 'End',
        description: 'Records timestamped delivery confirmation receipts into CRM audit log.',
        config: {},
      },
    ],
  },
  {
    id: 'WF-102',
    processId: 'OPP-102',
    name: 'Daily Executive Operations Report Automated Pipeline',
    description: 'Polls flight status feeds, extracts dispatch logs, reconciles flight metrics, computes network OTP-15, and emails executive briefing at 05:00 UTC.',
    department: 'OCC & Dispatch',
    status: 'Active',
    createdAt: '2026-10-21',
    updatedAt: '2026-11-09',
    steps: [
      {
        id: 's-102-1',
        name: 'Cron Scheduled Trigger: 05:00 UTC',
        type: 'Trigger',
        description: 'Executes nightly data pipeline every morning at 05:00 UTC.',
        config: {
          triggerEvent: 'CRON_NIGHTLY_0500_UTC',
        },
      },
      {
        id: 's-102-2',
        name: 'Ingest Multi-System Flight Telemetry',
        type: 'Data Input',
        description: 'Extracts automated flight departure/arrival timestamps, flight plans, and dispatcher remarks.',
        config: {
          inputSchema: 'MULTI_SYSTEM_FLIGHT_DISPATCH_CSV',
        },
      },
      {
        id: 's-102-3',
        name: 'Reconcile Timezones & Delay Categories',
        type: 'Data Transformation',
        description: 'Normalizes all timestamps to UTC and classifies delays by standard delay category (Weather, ATC, Turnaround).',
        config: {
          transformationType: 'STANDARDIZE_UTC_AND_DELAY_CATEGORIES',
        },
      },
      {
        id: 's-102-4',
        name: 'Audit Data Quality & Missing Actuals',
        type: 'Validation',
        description: 'Validates that 100% of non-cancelled flights have actual departure times and reasonable block durations.',
        config: {
          validationRule: 'COMPLETENESS_SCORE >= 90',
        },
      },
      {
        id: 's-102-5',
        name: 'Compile Executive Daily Operations Summary',
        type: 'Report Generation',
        description: 'Generates structured PDF and Markdown briefing with OTP-15, delay causes, and top corridors.',
        config: {
          reportTemplate: 'DAILY_OPERATIONS_EXECUTIVE_SUMMARY',
        },
      },
      {
        id: 's-102-6',
        name: 'Duty Manager Review & Sign-Off',
        type: 'Approval',
        description: 'Requests 1-click confirmation from Senior Duty Manager prior to external executive distribution.',
        config: {
          approvalRole: 'OCC_SENIOR_DUTY_MANAGER',
        },
      },
      {
        id: 's-102-7',
        name: 'Broadcast Executive PDF Briefing',
        type: 'Notification',
        description: 'Dispatches finalized briefing to Vice President of Flight Ops and Station Managers.',
        config: {
          notificationChannel: 'Email',
          notificationRecipient: 'EXECUTIVE_OPS_DISTRIBUTION_LIST',
        },
      },
      {
        id: 's-102-8',
        name: 'Pipeline Execution Completed',
        type: 'End',
        description: 'Stores archive copy in AirOps Analytical Lakehouse and closes batch.',
        config: {},
      },
    ],
  },
  {
    id: 'WF-103',
    processId: 'OPP-103',
    name: 'ATC Slot Compliance & Crew Duty Expiration Guard',
    description: 'Matches air traffic control departure slot modifications against pilot/cabin crew maximum duty periods and alerts dispatchers 90 minutes prior to pushback.',
    department: 'Flight Operations',
    status: 'Active',
    createdAt: '2026-10-29',
    updatedAt: '2026-11-09',
    steps: [
      {
        id: 's-103-1',
        name: 'ATC Slot Delay Notice Received',
        type: 'Trigger',
        description: 'Subscribes to air traffic control departure slot delay revisions.',
        config: {
          triggerEvent: 'ATC_SLOT_REVISION_RECEIVED',
        },
      },
      {
        id: 's-103-2',
        name: 'Fetch Active Crew Duty Rosters',
        type: 'Data Input',
        description: 'Queries crew scheduling system for operating pilot and cabin crew duty start times.',
        config: {
          inputSchema: 'CREW_ROSTER_DUTY_TIMES',
        },
      },
      {
        id: 's-103-3',
        name: 'Calculate Cumulative Flight Duty Period (FDP)',
        type: 'Data Transformation',
        description: 'Applies statutory crew rest limits to compute remaining duty margin before expiration.',
        config: {
          transformationType: 'CALCULATE_REMAINING_CREW_DUTY',
        },
      },
      {
        id: 's-103-4',
        name: 'Evaluate Duty Margin Expiration Risk',
        type: 'Condition',
        description: 'Checks if remaining crew duty buffer is less than 45 minutes.',
        config: {
          conditionField: 'remaining_duty_margin_mins',
          conditionOperator: '<',
          conditionValue: '45',
        },
      },
      {
        id: 's-103-5',
        name: 'Dispatch Urgent Pushback Warning',
        type: 'Notification',
        description: 'Pushes high-priority red alert to flight dispatcher console and airport gate supervisor.',
        config: {
          notificationChannel: 'Webhook',
          notificationRecipient: 'DISPATCH_OCC_CONSOLE',
        },
      },
      {
        id: 's-103-6',
        name: 'Standby Crew Callout Authorization',
        type: 'Approval',
        description: 'Requests dispatcher sign-off to activate airport reserve standby crew if slot pushback exceeds margin.',
        config: {
          approvalRole: 'FLIGHT_DISPATCHER',
        },
      },
      {
        id: 's-103-7',
        name: 'Slot Compliance Guard Completed',
        type: 'End',
        description: 'Logs slot adherence and crew clearance audit record.',
        config: {},
      },
    ],
  },
  {
    id: 'WF-104',
    processId: 'OPP-104',
    name: 'Turnaround Baggage Hold Exception Reconciliation',
    description: 'Syncs belt-loader optical scans with Load Control weight & balance manifest, triggering instant haptic clearance on ramp handhelds when all bags are secured.',
    department: 'Ground Handling',
    status: 'Active',
    createdAt: '2026-09-02',
    updatedAt: '2026-11-03',
    steps: [
      {
        id: 's-104-1',
        name: 'Belt Loader Optical Barcode Scan',
        type: 'Trigger',
        description: 'Receives real-time optical scan event as baggage container enters aircraft hold.',
        config: {
          triggerEvent: 'BAGGAGE_SCAN_EVENT',
        },
      },
      {
        id: 's-104-2',
        name: 'Match Manifest Loadsheet Weight & Balance',
        type: 'Data Input',
        description: 'Compares scanned bag tag against Load Control manifest and transfer transit records.',
        config: {
          inputSchema: 'LOAD_CONTROL_MANIFEST_SYNC',
        },
      },
      {
        id: 's-104-3',
        name: 'Verify Security Screening Status',
        type: 'Validation',
        description: 'Verifies positive passenger-to-baggage match for international legs.',
        config: {
          validationRule: 'BAGGAGE_RECONCILED == true',
        },
      },
      {
        id: 's-104-4',
        name: 'Check Hold Completeness Discrepancy',
        type: 'Condition',
        description: 'Evaluates whether any transfer bags are missing or misplaced in wrong hold bin.',
        config: {
          conditionField: 'unreconciled_bags_count',
          conditionOperator: '==',
          conditionValue: '0',
        },
      },
      {
        id: 's-104-5',
        name: 'Haptic Ramp Clearance Signal',
        type: 'Notification',
        description: 'Transmits green visual and haptic confirmation to ramp coordinator device and cockpit flight tablet.',
        config: {
          notificationChannel: 'Ops Alert',
          notificationRecipient: 'COCKPIT_TABLET_AND_RAMP_HANDHELD',
        },
      },
      {
        id: 's-104-6',
        name: 'Hold Doors Closed & Reconciled',
        type: 'End',
        description: 'Transmits final electronic loadsheet to captain for pushback release.',
        config: {},
      },
    ],
  },
  {
    id: 'WF-105',
    processId: 'OPP-105',
    name: 'AOG Spare-Parts Requisition & Expedited Courier Dispatch',
    description: 'AI vision extracts part serial numbers from mechanic defect reports, checks federated warehouse stock, and issues courier dispatch orders to the closest hub.',
    department: 'Flight Operations',
    status: 'Active',
    createdAt: '2026-11-02',
    updatedAt: '2026-11-08',
    steps: [
      {
        id: 's-105-1',
        name: 'Outstation AOG Defect Logged',
        type: 'Trigger',
        description: 'Mechanic uploads photo of defect entry in mobile maintenance app.',
        config: {
          triggerEvent: 'AOG_DEFECT_REPORTED',
        },
      },
      {
        id: 's-105-2',
        name: 'AI Document & Part Number OCR',
        type: 'Data Transformation',
        description: 'Extracts component part number, serial number, and maintenance system code from mechanic logbook image.',
        config: {
          transformationType: 'EXTRACT_SYSTEM_CODE_AND_PART_NO',
        },
      },
      {
        id: 's-105-3',
        name: 'Federated Inventory API Query',
        type: 'Data Input',
        description: 'Queries ERP and maintenance inventory systems to find nearest serviceable spare part across hubs.',
        config: {
          inputSchema: 'MRO_FEDERATED_PARTS_QUERY',
        },
      },
      {
        id: 's-105-4',
        name: 'Airworthiness Certificate Validation',
        type: 'Validation',
        description: 'Verifies that candidate part possesses an active airworthiness release certificate.',
        config: {
          validationRule: 'AIRWORTHINESS_TAG_ACTIVE == true',
        },
      },
      {
        id: 's-105-5',
        name: 'Aircraft Maintenance Chief Engineer Expedited Approval',
        type: 'Approval',
        description: 'Prompts Duty Maintenance Controller to authorize immediate parts requisition release.',
        config: {
          approvalRole: 'DUTY_MAINTENANCE_CONTROLLER',
        },
      },
      {
        id: 's-105-6',
        name: 'Expedited AOG Courier Dispatch',
        type: 'Notification',
        description: 'Dispatches emergency next-flight-out (NFO) air cargo booking and alerts station lead.',
        config: {
          notificationChannel: 'Email',
          notificationRecipient: 'AOG_LOGISTICS_HUB_LEAD',
        },
      },
      {
        id: 's-105-7',
        name: 'AOG Requisition Completed',
        type: 'End',
        description: 'Publishes real-time courier tracking number to station mechanic and MCC board.',
        config: {},
      },
    ],
  },
  {
    id: 'WF-106',
    processId: 'OPP-106',
    name: 'Operational Data Consolidation & Discrepancy Auditing',
    description: 'Ingests streaming operational data across 5 vendor platforms, standardizes flight keys, identifies time variances, and reconciles analytical datasets.',
    department: 'OCC & Dispatch',
    status: 'Active',
    createdAt: '2026-11-05',
    updatedAt: '2026-11-10',
    steps: [
      {
        id: 's-106-1',
        name: 'Micro-Batch Ingestion Poller',
        type: 'Trigger',
        description: 'Fires every 15 minutes to ingest new flight status, reservation, and radar messages.',
        config: {
          triggerEvent: 'SCHEDULED_15MIN_POLL',
        },
      },
      {
        id: 's-106-2',
        name: 'Ingest Raw Vendor Feeds',
        type: 'Data Input',
        description: 'Pulls JSON and CSV operational feeds from flight status, slot management, and reservation endpoints.',
        config: {
          inputSchema: 'VENDOR_FEED_TELEMETRY_STREAM',
        },
      },
      {
        id: 's-106-3',
        name: 'Normalize Timestamps & Flight Identifiers',
        type: 'Data Transformation',
        description: 'Resolves carrier codes, converts local station time to UTC, and trims flight leg IDs.',
        config: {
          transformationType: 'STANDARDIZE_FLIGHT_KEYS',
        },
      },
      {
        id: 's-106-4',
        name: 'Detect Time Variance Discrepancies',
        type: 'Condition',
        description: 'Evaluates if discrepancy between logged departure time and tower radar is greater than 5 minutes.',
        config: {
          conditionField: 'discrepancy_minutes',
          conditionOperator: '>',
          conditionValue: '5',
        },
      },
      {
        id: 's-106-5',
        name: 'Generate Discrepancy Audit Exception Log',
        type: 'Report Generation',
        description: 'Produces analytical exception log highlighting conflicting flight telemetry for human review.',
        config: {
          reportTemplate: 'DISCREPANCY_AUDIT_LOG',
        },
      },
      {
        id: 's-106-6',
        name: 'Broadcast Data Quality Alert',
        type: 'Notification',
        description: 'Notifies Data Operations on Slack/Webhook when anomaly threshold exceeds 3% of flights.',
        config: {
          notificationChannel: 'Webhook',
          notificationRecipient: 'DATA_OPS_ALERT_WEBHOOK',
        },
      },
      {
        id: 's-106-7',
        name: 'Lakehouse Sync Completed',
        type: 'End',
        description: 'Publishes verified operational state to analytics lakehouse.',
        config: {},
      },
    ],
  },
];

export function getStoredWorkflows(): WorkflowDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKFLOWS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load workflows from localStorage', e);
  }
  saveStoredWorkflows(INITIAL_WORKFLOWS);
  return INITIAL_WORKFLOWS;
}

export function saveStoredWorkflows(workflows: WorkflowDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_WORKFLOWS, JSON.stringify(workflows));
  } catch (e) {
    console.error('Failed to save workflows to localStorage', e);
  }
}

export function resetWorkflowsToDefault(): WorkflowDefinition[] {
  try {
    localStorage.removeItem(STORAGE_KEY_WORKFLOWS);
  } catch (e) {
    console.error(e);
  }
  saveStoredWorkflows(INITIAL_WORKFLOWS);
  return INITIAL_WORKFLOWS;
}

export function getStoredSimulationRuns(): WorkflowSimulationRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIMULATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load simulations from localStorage', e);
  }
  return [];
}

export function saveStoredSimulationRuns(runs: WorkflowSimulationRun[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SIMULATIONS, JSON.stringify(runs));
  } catch (e) {
    console.error('Failed to save simulations to localStorage', e);
  }
}

export function addSimulationRun(run: WorkflowSimulationRun): void {
  const existing = getStoredSimulationRuns();
  const updated = [run, ...existing.slice(0, 49)]; // Keep latest 50
  saveStoredSimulationRuns(updated);
}
