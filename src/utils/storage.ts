import { FlightRecord, ProcessOpportunity, ProcessRequirement } from '../types';

const STORAGE_KEY_OPPORTUNITIES = 'airops_process_opportunities';
const STORAGE_KEY_REQUIREMENTS = 'airops_process_requirements';
const STORAGE_KEY_OTP_THRESHOLD = 'airops_otp_threshold';
const STORAGE_KEY_HOURLY_RATE = 'airops_hourly_rate';
const STORAGE_KEY_CUSTOM_FLIGHTS = 'airops_custom_flights';

export const SEED_VERSION_KEY = 'airops_seed_version';
export const CURRENT_SEED_VERSION = '2026-11-16-v2';
export const MAX_PERSISTED_FLIGHTS_BYTES = 3_500_000;

export const INITIAL_OPPORTUNITIES: ProcessOpportunity[] = [
  {
    id: 'OPP-101',
    title: 'Manual Flight Disruption Passenger Notification',
    department: 'Customer Experience',
    manualTaskDescription:
      'Customer service and gate dispatch agents manually check delay boards every 15 minutes, cross-reference passenger booking records in the reservation system, and send outbound SMS/email re-accommodation notices.',
    repetitiveActivities:
      'Extracting passenger manifest CSVs, copy-pasting updated flight departure times, drafting manual compensation vouchers, and resolving gate queues.',
    frequencyPerWeek: 70,
    timeSpentPerTaskMinutes: 25,
    peopleInvolved: 4,
    complexity: 'Medium',
    priority: 'High',
    businessOwner: 'Director of Customer Experience & Airport Services',
    dependencies: ['Reservation Booking API', 'Flight Status Webhook Stream', 'Omni-channel SMS/Email Gateway'],
    riskNotes: 'Incorrect gate or meal voucher rules could violate consumer protection regulations.',
    bottlenecks: ['Manual booking CSV export introduces 25m delay', 'Crowded gate podiums during weather events'],
    expectedBenefits: ['92% faster disruption outreach (< 2 min)', '45% reduction in gate queue density'],
    humanIntervention: 'Agent exception override for VIPs or unaccompanied minors',
    automationFeasibility: 'High',
    proposedSolution:
      'Event-driven webhook engine subscribing to OCC flight status feed. Automatically filters impacted bookings and triggers personalized omni-channel notifications with instant digital meal/rebooking vouchers.',
    solutionType: 'Event Webhook & Alerting',
    estimatedHoursSavedAnnual: Math.round((70 * 25 * 52) / 60 * 0.85), // ~1,289 hrs
    measuredHoursSavedAnnual: 0,
    status: 'Approved',
    manualWorkflowSteps: [
      'OCC registers flight delay > 45 minutes.',
      'Gate team manually accesses dispatch terminal.',
      'Agent downloads manifest of 180+ passengers.',
      'Agent drafts text message template.',
      'Manual sending and tracking in ticket log.',
    ],
    proposedWorkflowSteps: [
      'OCC event webhook fires immediately upon ETA shift > 20 min.',
      'AirOps messaging microservice pulls booking records in 1.2s.',
      'Dynamic SMS/WhatsApp notifications sent with one-click rebook link.',
      'Audit log automatically updated in CRM.',
    ],
    createdAt: '2026-10-15',
    updatedAt: '2026-11-05',
  },
  {
    id: 'OPP-102',
    title: 'Daily Operations Flight Delay & Cancellation Consolidation',
    department: 'OCC & Dispatch',
    manualTaskDescription:
      'Senior duty managers spend the first 90 minutes of morning shift extracting CSV files from 4 legacy operational systems (flight status feed, dispatch plan, ground radar, maintenance log) into Excel to compile the Daily Executive Ops Report.',
    repetitiveActivities:
      'VLOOKUP merging, resolving UTC vs Local timezone discrepancies, calculating OTP-15 manually, formatting charts, emailing PDF to Vice President of Flight Ops.',
    frequencyPerWeek: 14,
    timeSpentPerTaskMinutes: 60,
    peopleInvolved: 2,
    complexity: 'Medium',
    priority: 'Critical',
    businessOwner: 'Head of OCC & System Operations Control',
    dependencies: ['Flight Status Database', 'Dispatch Movement History', 'AirOps Analytical Warehouse'],
    riskNotes: 'Discrepancies in UTC timestamps could distort published network OTP-15 statistics.',
    bottlenecks: ['90-minute morning compilation delay', 'Manual spreadsheet VLOOKUP formula breaks'],
    expectedBenefits: ['Real-time 05:00 UTC delivery without manual compilation', 'Eliminates human calculation errors'],
    humanIntervention: 'Duty Manager operational remarks and executive sign-off',
    automationFeasibility: 'High',
    proposedSolution:
      'Automated nightly data pipeline connecting flight status feeds and dispatcher logs to the AirOps warehouse, generating interactive executive dashboards and scheduled PDF summaries at 05:00 UTC.',
    solutionType: 'Direct API Integration',
    estimatedHoursSavedAnnual: Math.round((14 * 60 * 52) / 60 * 0.95), // ~692 hrs
    measuredHoursSavedAnnual: 0,
    status: 'In Progress',
    manualWorkflowSteps: [
      'Download flight status feed at shift start.',
      'Open legacy system and export dispatch log.',
      'Merge datasets in Excel spreadsheet.',
      'Calculate delay minutes and categorize by standard delay reason.',
      'Format presentation deck and email distribution list.',
    ],
    proposedWorkflowSteps: [
      'Real-time streaming ingestion into operational data pipeline.',
      'Automated delay reason classification and OTP-15 calculation.',
      'Self-service web dashboard updated live for VP of Flight Ops.',
      'Automated email digest dispatched at 05:00 UTC with exception alerts.',
    ],
    createdAt: '2026-10-20',
    updatedAt: '2026-11-08',
  },
  {
    id: 'OPP-103',
    title: 'ATC Slot Flow Re-clearance & Crew Duty Leg Monitor',
    department: 'Flight Operations',
    manualTaskDescription:
      'When air traffic control imposes Ground Delay Programs (GDP), dispatchers manually monitor slot times and calculate whether pilots or cabin crew will exceed maximum flight duty periods under statutory crew duty rules.',
    repetitiveActivities:
      'Calculating remaining crew duty hours, phoning crew scheduling desk, adjusting pushback sequence, refiling flight plans with air traffic control.',
    frequencyPerWeek: 95,
    timeSpentPerTaskMinutes: 20,
    peopleInvolved: 3,
    complexity: 'High',
    priority: 'High',
    businessOwner: 'Chief Pilot & Dispatch Duty Manager',
    dependencies: ['ATC Departure Slot Feed', 'Crew Scheduling Roster API'],
    riskNotes: 'Failing to detect crew duty expiration before pushback leads to non-compliant flights or tarmac returns.',
    bottlenecks: ['Manual calculator math while juggling radio calls', 'Crew desk phone queues'],
    expectedBenefits: ['90-minute advance risk alert for crew duty expiration', 'Avoids expensive gate returns'],
    humanIntervention: 'Dispatcher confirms pushback sequencing and authorizes standby crew callout',
    automationFeasibility: 'Medium',
    proposedSolution:
      'Predictive slot compliance module that matches revised departure slot updates against crew duty limits and proactively flags high-risk flights 90 minutes prior to pushback.',
    solutionType: 'Rule-based Automation',
    estimatedHoursSavedAnnual: Math.round((95 * 20 * 52) / 60 * 0.75), // ~1,235 hrs
    measuredHoursSavedAnnual: 0,
    status: 'Under Review',
    manualWorkflowSteps: [
      'ATC sends revised departure clearance or ground stop notice.',
      'Dispatcher pulls active crew roster to check duty start times.',
      'Manual math calculation of cumulative duty hours.',
      'Phone call to crew desk if duty margin < 30 minutes.',
    ],
    proposedWorkflowSteps: [
      'ATC slot feed consumed via API stream.',
      'Algorithmic rule engine calculates duty limit buffer for every active crew member.',
      'High-risk flights highlighted in red on Dispatch Kanban.',
      'One-click automated standby crew dispatch request.',
    ],
    createdAt: '2026-10-28',
    updatedAt: '2026-11-09',
  },
  {
    id: 'OPP-104',
    title: 'Turnaround Baggage Hold Exception Reconciliation',
    department: 'Ground Handling',
    manualTaskDescription:
      'Ramp coordinators match physical cargo and passenger baggage barcodes against the weight & balance manifest. Misloaded or late bags cause 15-25 minute gate holds on 12% of widebody departures.',
    repetitiveActivities:
      'Radioing baggage hold teams, comparing paper loadsheets, re-verifying security screening status for unaccompanied transfer bags.',
    frequencyPerWeek: 110,
    timeSpentPerTaskMinutes: 18,
    peopleInvolved: 5,
    complexity: 'Medium',
    priority: 'High',
    businessOwner: 'Ramp Operations & Baggage Logistics Director',
    dependencies: ['BagDrop Optical Scanners', 'Load Control & Balance System', 'Ramp Mobile Handhelds'],
    riskNotes: 'Unreconciled bags on international legs trigger mandatory security offloads and severe delay.',
    bottlenecks: ['Paper manifest double-checking on ramp', 'Radio interference between gate and cargo pit'],
    expectedBenefits: ['Zero departure delay from paper reconciliation', '1,120 hours calculated in staging benchmark'],
    humanIntervention: 'Ramp coordinator visually inspects cargo hold door closure before signoff',
    automationFeasibility: 'High',
    proposedSolution:
      'Handheld scanner sync with real-time Load Control system. Automated reconciliation triggers haptic alert on ramp coordinator device when all transfer bags are verified in hold.',
    solutionType: 'RPA Bot',
    estimatedHoursSavedAnnual: Math.round((110 * 18 * 52) / 60 * 0.8), // ~1,373 hrs
    measuredHoursSavedAnnual: 1120,
    status: 'Implemented',
    manualWorkflowSteps: [
      'Ramp agent checks printed loadsheet list.',
      'Baggage handlers load containers into aircraft belly.',
      'Agent conducts manual count and radios gate agent.',
      'Discrepancies require physical inspection of cargo containers.',
    ],
    proposedWorkflowSteps: [
      'Automated optical barcode scanning on belt loader.',
      'Cloud loadsheet updates instantly per bag scanned.',
      'Automated green clearance signal to captain and dispatcher.',
      'Instant hold closure verification on mobile ramp app.',
    ],
    createdAt: '2026-09-01',
    updatedAt: '2026-11-02',
  },
  {
    id: 'OPP-105',
    title: 'Unscheduled Aircraft Maintenance Part Requisition',
    department: 'Flight Operations',
    manualTaskDescription:
      'When an aircraft experiences a maintenance defect at an outstation, mechanics write paper discrepancy logs and email maintenance operations control for parts clearance.',
    repetitiveActivities:
      'Searching inventory in 3 warehouse systems, retyping tail numbers, verifying airworthiness certificates, routing approvals via email.',
    frequencyPerWeek: 25,
    timeSpentPerTaskMinutes: 40,
    peopleInvolved: 2,
    complexity: 'Medium',
    priority: 'Critical',
    businessOwner: 'VP of Technical Operations & Aircraft Maintenance Logistics',
    dependencies: ['Maintenance Inventory Database', 'Airworthiness Cert Verification API', 'Priority Courier Logistics'],
    riskNotes: 'Dispatching non-airworthy part serial numbers violates aviation safety directives.',
    bottlenecks: ['Outstation mechanic phone tag with main base', 'Cross-referencing part numbers manually'],
    expectedBenefits: ['3.5-hour reduction in maintenance downtime', 'Automated airworthiness compliance check'],
    humanIntervention: 'Licensed avionics engineer physical inspection and sign-off on airworthiness release certificate',
    automationFeasibility: 'Medium',
    proposedSolution:
      'AI Document Parser that scans mechanic defect reports, extracts part serial numbers, queries federated inventory API, and issues purchase/dispatch orders to closest hub.',
    solutionType: 'AI Text/Data Parser',
    estimatedHoursSavedAnnual: Math.round((25 * 40 * 52) / 60 * 0.7), // ~607 hrs
    measuredHoursSavedAnnual: 0,
    status: 'Identified',
    manualWorkflowSteps: [
      'Mechanic writes logbook entry.',
      'Outstation clerk scans paper logbook and emails maintenance control.',
      'Maintenance coordinator logs into ERP inventory to locate spare part.',
      'Manual purchase order creation and courier coordination.',
    ],
    proposedWorkflowSteps: [
      'Mechanic captures photo of defect or logs in mobile app.',
      'AI vision & OCR extracts part numbers and error codes.',
      'System auto-locates nearest serviceable part in network.',
      'Automated priority transport dispatch with real-time courier tracking.',
    ],
    createdAt: '2026-11-01',
    updatedAt: '2026-11-07',
  },
  {
    id: 'OPP-106',
    title: 'Operational Data Consolidation & Discrepancy Auditing',
    department: 'OCC & Dispatch',
    manualTaskDescription:
      'Business intelligence analysts extract flight telemetry daily across 5 disparate vendor systems (flight status, reservation, radar tracking, slot feed, ERP) to reconcile discrepancies in block time, fuel burns, and taxi-out duration.',
    repetitiveActivities:
      'Cleansing CSV dumps, matching flight leg IDs, converting UTC timestamps, and correcting corrupted delay minutes.',
    frequencyPerWeek: 35,
    timeSpentPerTaskMinutes: 45,
    peopleInvolved: 3,
    complexity: 'High',
    priority: 'Medium',
    businessOwner: 'Data Architecture & BI Lead',
    dependencies: ['Flight Status Feed', 'Dispatch Movement API', 'AirOps Warehouse Ingestion Engine'],
    riskNotes: 'Inaccurate block time telemetry impacts fuel burn predictions and crew duty pay computations.',
    bottlenecks: ['Incompatible date formats across legacy vendor APIs', 'Manual deduplication in Excel'],
    expectedBenefits: ['Continuous 10-minute micro-batch synchronization', 'Reclaims 1,119 analyst hours annually'],
    humanIntervention: 'BI Lead exception validation on unmapped tail movements',
    automationFeasibility: 'High',
    proposedSolution:
      'Automated ETL data ingestion and reconciliation pipeline running micro-batch validations, normalizing flight IDs, and flagging operational discrepancies automatically.',
    solutionType: 'Direct API Integration',
    estimatedHoursSavedAnnual: Math.round((35 * 45 * 52) / 60 * 0.82), // ~1,119 hrs
    measuredHoursSavedAnnual: 0,
    status: 'Identified',
    manualWorkflowSteps: [
      'Download nightly CSV dumps from 5 vendor FTP servers.',
      'Normalize flight numbers and airport codes in Excel.',
      'Execute manual VLOOKUP to match departure times.',
      'Upload reconciled CSV into database.',
    ],
    proposedWorkflowSteps: [
      'Scheduled cloud ingestion workers poll vendor APIs every 15 minutes.',
      'AirOps normalization engine auto-cleans timestamps and standardizes airport codes.',
      'Automated discrepancy rule highlights telemetry variances > 5 minutes.',
      'Clean data streaming directly into executive dashboards.',
    ],
    createdAt: '2026-11-04',
    updatedAt: '2026-11-10',
  },
];

export const INITIAL_REQUIREMENTS: ProcessRequirement[] = [
  {
    id: 'REQ-101',
    processId: 'OPP-101',
    title: 'Automated Disruption Passenger Communication System (ADPCS)',
    department: 'Customer Experience & Flight Ops',
    asIsDescription:
      'Currently, station managers and gate agents receive flight delay notifications via static radar displays. Agents manually query the reservation database, download passenger booking lists, and send bulk text messages. This process introduces 20-40 minutes of latency, leading to passenger frustration and overcrowded boarding areas.',
    toBeDescription:
      'An event-driven cloud notification engine listens to flight status and dispatch delay events. When a scheduled departure is delayed by more than 20 minutes, the engine automatically extracts affected bookings, determines passenger connection risks, and sends personalized multi-channel updates with self-service rebooking tokens.',
    bottlenecks: [
      'Manual CSV extraction between disparate systems introduces 25-minute delay latency.',
      'High gate agent stress and cognitive overload during multi-flight weather disruptions.',
      'No personalized connection risk assessment sent to passengers before they board initial leg.',
      'Overreliance on physical printed vouchers at airport service desks.',
    ],
    userStories: [
      {
        role: 'Operations Control Center (OCC) Controller',
        want: 'real-time event streaming to automatically trigger disruption workflows when an aircraft departure is revised by >= 20 minutes',
        benefit: 'gate agents and passengers are notified immediately without manual intervention',
      },
      {
        role: 'Connecting Passenger',
        want: 'an immediate digital notification on my mobile device highlighting my protected onward connection and meal voucher',
        benefit: 'I do not have to wait in 45-minute lines at the customer service desk',
      },
      {
        role: 'Airport Station Manager',
        want: 'an automated audit log of all messages sent to passengers on delayed flights',
        benefit: 'our station maintains clear consumer protection and transparency records',
      },
    ],
    functionalRequirements: [
      'FR-1: System must ingest flight status updates via REST API or WebSocket within 5 seconds of OCC publication.',
      'FR-2: When delay_minutes >= 20, system shall query passenger manifest and segment passengers by connecting vs destination.',
      'FR-3: Support dynamic message templating with passenger name, updated gate, revised boarding time, and barcode meal voucher.',
      'FR-4: Provide fallback SMS delivery if mobile app push notification fails within 60 seconds.',
      'FR-5: Record timestamped delivery receipts for 100% of outbound communications for compliance tracking.',
    ],
    assumptions: [
      'Reservation system provides real-time booking retrieval API with < 500ms response time.',
      'Customer phone numbers and email addresses are maintained with valid opt-in privacy consent.',
      'OCC flight delay codes adhere to standard operational delay categories.',
    ],
    dependencies: [
      'Integration with Core Flight Operations Event Bus (Kafka/RabbitMQ).',
      'Integration with Customer CRM / Loyalty Profile API.',
      'SMS Messaging Gateway SLA of 99.99% uptime.',
    ],
    acceptanceCriteria: [
      'Given a flight delay of 25 minutes entered by OCC, when the system processes the event, then all eligible passengers receive an SMS within 90 seconds.',
      'Given an international connecting passenger with a tight connection (< 45 min), the message must include alternate flight options with one-tap confirmation.',
      'Given a system failure in the SMS provider, the system must retry once and log an alert in the OCC exception console.',
    ],
    lastModified: '2026-11-09',
  },
  {
    id: 'REQ-102',
    processId: 'OPP-102',
    title: 'Automated Daily Operations Executive Performance Dashboard (DOEPD)',
    department: 'Operations Control & Analytics',
    asIsDescription:
      'Duty managers manually aggregate telemetry, crew times, maintenance delays, and ground handling logs into a multi-tab Microsoft Excel workbook every morning between 04:00 and 06:00. This workbook is prone to formula breakage and takes over 60 minutes of senior staff time daily.',
    toBeDescription:
      'A web-based executive portal that computes On-Time Performance (OTP-15, OTP-0), cancellation metrics, delay root cause distributions, and route reliability impact in real-time, delivering automated briefs to executive leadership at 05:00 UTC.',
    bottlenecks: [
      'Manual compilation takes 60+ minutes daily with risk of copy-paste formula errors.',
      'Delayed executive visibility into previous night outstation disruptions.',
      'Inconsistent delay categorization between dispatchers and station managers.',
    ],
    userStories: [
      {
        role: 'Vice President of Flight Operations',
        want: 'a unified, interactive morning dashboard showing network OTP-15, cancellations, and top delay drivers by 05:00 UTC',
        benefit: 'I can lead the daily 07:00 executive standup with validated data and actionable insights',
      },
      {
        role: 'Operations Business Analyst',
        want: 'one-click CSV data export and automated data profiling for missing values',
        benefit: 'I can spend time on root-cause analysis rather than manual data cleansing',
      },
    ],
    functionalRequirements: [
      'FR-1: Compute network OTP-15, OTP-0, average delay per delayed flight, and cancellation rate deterministically.',
      'FR-2: Group delay reasons into standardized categories (Air Traffic Control, Weather, Maintenance, Baggage/Turnaround, Crew).',
      'FR-3: Provide visual route breakdown sorted by highest delay volume and lowest OTP.',
      'FR-4: Allow CSV upload with validation for custom flight datasets.',
      'FR-5: Export formal executive reports in Markdown, CSV, and printable format.',
    ],
    assumptions: [
      'Standard industry 15-minute buffer is applied for On-Time Performance calculations.',
      'All times are normalized to UTC with local airport time display available.',
    ],
    dependencies: [
      'AirOps Intelligence Core Analytics Engine.',
      'Operational Flight Data Feed.',
    ],
    acceptanceCriteria: [
      'Given a dataset of 500 flights, metrics calculation must complete in under 100 milliseconds in the browser.',
      'When an invalid CSV header is uploaded, the application must display a descriptive error without crashing.',
    ],
    lastModified: '2026-11-10',
  },
];

export function getStoredOpportunities(): ProcessOpportunity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPPORTUNITIES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load opportunities from localStorage', e);
  }
  saveStoredOpportunities(INITIAL_OPPORTUNITIES);
  return INITIAL_OPPORTUNITIES;
}

export function saveStoredOpportunities(data: ProcessOpportunity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_OPPORTUNITIES, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save opportunities to localStorage', e);
  }
}

export function getStoredRequirements(): ProcessRequirement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUIREMENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load requirements from localStorage', e);
  }
  saveStoredRequirements(INITIAL_REQUIREMENTS);
  return INITIAL_REQUIREMENTS;
}

export function saveStoredRequirements(data: ProcessRequirement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REQUIREMENTS, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save requirements to localStorage', e);
  }
}

export function resetToDefaults(): void {
  try {
    localStorage.setItem(STORAGE_KEY_OPPORTUNITIES, JSON.stringify(INITIAL_OPPORTUNITIES));
    localStorage.setItem(STORAGE_KEY_REQUIREMENTS, JSON.stringify(INITIAL_REQUIREMENTS));
  } catch (err) {
    console.warn('Error resetting opportunities/requirements defaults:', err);
  }
}

// ==========================================
// SETTINGS, SEED VERSIONING & CSV PERSISTENCE
// ==========================================

export function getStoredOtpThreshold(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OTP_THRESHOLD);
    if (raw !== null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 60) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read OTP threshold from localStorage', e);
  }
  return 15;
}

export function saveStoredOtpThreshold(threshold: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_OTP_THRESHOLD, String(threshold));
  } catch (e) {
    console.error('Failed to save OTP threshold to localStorage', e);
  }
}

export function getStoredHourlyRate(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HOURLY_RATE);
    if (raw !== null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 20 && parsed <= 500) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read hourly rate from localStorage', e);
  }
  return 85;
}

export function saveStoredHourlyRate(rate: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_HOURLY_RATE, String(rate));
  } catch (e) {
    console.error('Failed to save hourly rate to localStorage', e);
  }
}

export function getStoredCustomFlights(): { flights: FlightRecord[] | null; isCustom: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_FLIGHTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { flights: parsed, isCustom: true };
      }
    }
  } catch (e) {
    console.error('Failed to read custom flights from localStorage', e);
  }
  return { flights: null, isCustom: false };
}

export function saveStoredCustomFlights(flights: FlightRecord[]): {
  persisted: boolean;
  warning?: string;
} {
  try {
    const serialized = JSON.stringify(flights);
    const byteLength =
      typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(serialized).length : serialized.length * 2;
    if (byteLength > MAX_PERSISTED_FLIGHTS_BYTES) {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_FLIGHTS);
      return {
        persisted: false,
        warning:
          'Uploaded CSV exceeds the 3.5 MB browser storage limit. It is loaded for this session only and will not survive page refresh.',
      };
    }
    localStorage.setItem(STORAGE_KEY_CUSTOM_FLIGHTS, serialized);
    return { persisted: true };
  } catch (e: any) {
    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_FLIGHTS);
    } catch {
      // ignore cleanup error
    }
    const reason =
      e?.name === 'QuotaExceededError'
        ? 'Browser storage quota exceeded for this CSV. Loaded in-session only and will not survive page refresh.'
        : 'Unable to save uploaded CSV to browser storage. Loaded in-session only and will not survive page refresh.';
    return { persisted: false, warning: reason };
  }
}

export function clearStoredCustomFlights(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_FLIGHTS);
  } catch (e) {
    console.error('Failed to clear custom flights from localStorage', e);
  }
}

export function ensureSeedVersion(): boolean {
  try {
    const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
    if (storedVersion !== CURRENT_SEED_VERSION) {
      resetAllApplicationModules();
      resetToDefaults();
      localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
      return true;
    }
  } catch (e) {
    console.warn('Failed to verify seed version in localStorage', e);
  }
  return false;
}

// ==========================================
// APPLICATION BACKUP & RECOVERY SUITE
// ==========================================

export const ALL_STORAGE_KEYS = [
  'airops_process_opportunities',
  'airops_process_requirements',
  'airops_workflow_definitions_v3',
  'airops_workflow_simulations_v3',
  'airops_prompt_library_v2',
  'airops_ai_evaluations_v2',
  'airops_business_problems',
  'airops_process_diagrams',
  'airops_operational_bottlenecks',
  'airops_business_requirements',
  'airops_functional_requirements',
  'airops_non_functional_requirements',
  'airops_structured_user_stories',
  'airops_acceptance_criteria',
  'airops_uat_test_cases',
  'airops_solutions_portfolio',
  'airops_automation_executions',
  'airops_benefits_realization',
  'airops_adoption_analytics',
  'airops_operational_impact',
  'airops_configured_kpis',
  'airops_audit_trail_events',
];

export function exportFullApplicationState(): string {
  const backup: Record<string, any> = {
    _meta: {
      exportedAt: new Date().toISOString(),
      platform: 'AirOps Intelligence',
      version: '6.0.0-enterprise-hardening',
      classification: 'Local Prototype State Archive',
      disclaimer: 'Locally persisted prototype records. Does not represent production airline durability.',
    },
    stores: {},
  };

  for (const key of ALL_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        backup.stores[key] = JSON.parse(raw);
      }
    } catch {
      // ignore parse issues on export
    }
  }

  return JSON.stringify(backup, null, 2);
}

export function importFullApplicationState(jsonString: string): {
  success: boolean;
  message: string;
  restoredKeysCount: number;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object' || !parsed.stores) {
      return {
        success: false,
        message: 'Invalid backup file structure: missing "stores" object.',
        restoredKeysCount: 0,
      };
    }

    let restored = 0;
    for (const [key, value] of Object.entries(parsed.stores)) {
      if (ALL_STORAGE_KEYS.includes(key)) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          restored++;
        } catch (err: any) {
          if (err?.name === 'QuotaExceededError') {
            return {
              success: false,
              message: `Storage quota exceeded while importing ${key}. Please reduce backup file size.`,
              restoredKeysCount: restored,
            };
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully restored ${restored} application data stores.`,
      restoredKeysCount: restored,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to parse backup JSON: ${err.message || 'Syntax error'}`,
      restoredKeysCount: 0,
    };
  }
}

export function resetAllApplicationModules(): void {
  for (const key of ALL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY_OTP_THRESHOLD);
    localStorage.removeItem(STORAGE_KEY_HOURLY_RATE);
    localStorage.removeItem(STORAGE_KEY_CUSTOM_FLIGHTS);
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
  } catch {
    // ignore
  }
}
