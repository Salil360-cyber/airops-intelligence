import { parseCSVAdvanced } from '../src/utils/csvParser';
import { calculateOperationalMetrics, generateBusinessInsights } from '../src/utils/calculator';
import { calculateAutomationROI, DEFAULT_ROI_INPUTS } from '../src/utils/roiCalculator';
import { simulateWorkflowExecution } from '../src/utils/workflowSimulator';
import { checkResponseFactualGroundedness } from '../src/utils/aiEvaluator';
import { recordAuditEvent } from '../src/utils/auditLogger';
import {
  INITIAL_BUSINESS_PROBLEMS,
  INITIAL_USER_STORIES,
  INITIAL_FUNCTIONAL_REQUIREMENTS,
  INITIAL_BUSINESS_REQUIREMENTS,
  INITIAL_UAT_TEST_CASES,
} from '../src/utils/requirementsStorage';
import { INITIAL_PORTFOLIO } from '../src/utils/performanceStorage';
import { SYNTHETIC_AIRLINE_DATASET } from '../src/data/syntheticData';
import { INITIAL_WORKFLOWS } from '../src/utils/workflowStorage';
import {
  ALL_STORAGE_KEYS,
  CURRENT_SEED_VERSION,
  INITIAL_OPPORTUNITIES,
  SEED_VERSION_KEY,
  ensureSeedVersion,
  getStoredHourlyRate,
  getStoredOtpThreshold,
  saveStoredHourlyRate,
  saveStoredOtpThreshold,
} from '../src/utils/storage';

// Provide lightweight localStorage shim in Node regression environment for auditLogger & storage tests
const memStorage: Record<string, string> = {};
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (k: string) => (k in memStorage ? memStorage[k] : null),
    setItem: (k: string, v: string) => { memStorage[k] = String(v); },
    removeItem: (k: string) => { delete memStorage[k]; },
    clear: () => { Object.keys(memStorage).forEach((k) => delete memStorage[k]); },
  };
}

console.log('--- AirOps Intelligence Automated Regression Suite ---');

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.error(`[FAIL] ${description}`);
    failed++;
  }
}

// 1. Boundary & zero division safety
const emptyMetrics = calculateOperationalMetrics([]);
assert(
  'calculateOperationalMetrics handles empty fleet without throwing',
  emptyMetrics.totalFlights === 0 && emptyMetrics.onTimePerformance === 0
);

// 2. CSV Parser (ISO times, apostrophes, 0 passenger_load)
const sampleCSV = [
  'flight_id,airline,origin,destination,scheduled_departure,actual_departure,delay_minutes,flight_status,distance,date,delay_reason,aircraft_type,passenger_load',
  'SK-999,SkyRoute Air,JFK,ORD,2026-11-12T08:00:00Z,2026-11-12T08:35:00Z,35,DELAYED,740,2026-11-12,"O\'Hare Ground Hold",B737-800,145',
  'SK-998,"Pilot\'s Charter",LAX,SFO,8:05 PM,8:05 PM,0,CANCELLED,337,2026-11-12,Aircraft Maintenance,A320neo,0',
].join('\n');
const parsed = parseCSVAdvanced(sampleCSV);
assert(
  'CSV Parser parses valid flight rows with apostrophes intact',
  parsed.data.length === 2 &&
    String(parsed.data[0].delay_reason) === "O'Hare Ground Hold" &&
    parsed.data[1].airline === "Pilot's Charter"
);
assert(
  'CSV Parser normalizes ISO and AM/PM departure timestamps',
  parsed.data[0].scheduled_departure === '08:00' && parsed.data[1].scheduled_departure === '20:05'
);
assert('CSV Parser preserves passenger_load of 0', parsed.data[1].passenger_load === 0);

// 3. Operational Metrics & Edge Cases (7-day 300-flight synthetic sample fleet)
const metrics = calculateOperationalMetrics(SYNTHETIC_AIRLINE_DATASET);
assert('KPI engine calculates 300 synthetic flights across 7 days', metrics.totalFlights === 300 && new Set(SYNTHETIC_AIRLINE_DATASET.map((f) => f.date)).size === 7);
assert('KPI OTP-15 is calculated deterministically (75.3%)', metrics.onTimePerformance === 75.3);
assert(
  'OTP % + delay % of operated flights sums to 100%',
  Math.abs(metrics.onTimePerformance + metrics.delayPercentage - 100) < 0.2
);

// Regression test for Item 1: Root-cause delay percentages exclude cancelled & on-time flights and sum to ~100%
const causeTestDataset = [
  {
    flight_id: 'RC-1',
    airline: 'TestAir',
    origin: 'JFK',
    destination: 'LAX',
    scheduled_departure: '08:00',
    actual_departure: '08:00',
    delay_minutes: 0,
    flight_status: 'ON_TIME' as const,
    distance: 2475,
    date: '2026-11-12',
    delay_reason: 'Weather' as const,
  },
  {
    flight_id: 'RC-2',
    airline: 'TestAir',
    origin: 'JFK',
    destination: 'LAX',
    scheduled_departure: '09:00',
    actual_departure: '09:00',
    delay_minutes: 0,
    flight_status: 'CANCELLED' as const,
    distance: 2475,
    date: '2026-11-12',
    delay_reason: 'Aircraft Maintenance' as const,
  },
  {
    flight_id: 'RC-3',
    airline: 'TestAir',
    origin: 'JFK',
    destination: 'LAX',
    scheduled_departure: '10:00',
    actual_departure: '10:40',
    delay_minutes: 40,
    flight_status: 'DELAYED' as const,
    distance: 2475,
    date: '2026-11-12',
    delay_reason: 'ATC Flow' as const,
  },
  {
    flight_id: 'RC-4',
    airline: 'TestAir',
    origin: 'JFK',
    destination: 'LAX',
    scheduled_departure: '11:00',
    actual_departure: '11:50',
    delay_minutes: 50,
    flight_status: 'DELAYED' as const,
    distance: 2475,
    date: '2026-11-12',
    delay_reason: 'Turnaround Baggage' as const,
  },
];
const causeMetrics = calculateOperationalMetrics(causeTestDataset);
const causePercentSum = causeMetrics.topDelayCauses.reduce((sum, c) => sum + c.percentage, 0);
assert(
  'Root-cause counts exclude cancelled and on-time flights and percentages sum to ~100%',
  causeMetrics.topDelayCauses.length === 2 &&
    causeMetrics.topDelayCauses.every((c) => c.cause === 'ATC Flow' || c.cause === 'Turnaround Baggage') &&
    causePercentSum === 100
);
const fullDatasetCauseSum = metrics.topDelayCauses.reduce((sum, c) => sum + c.percentage, 0);
assert(
  'Synthetic 300-flight root-cause percentages sum to ~100%',
  fullDatasetCauseSum >= 98 && fullDatasetCauseSum <= 102
);

// Regression test for Item 5: generateBusinessInsights uses observed dataset values without ungrounded external jargon
const insights = generateBusinessInsights(metrics, SYNTHETIC_AIRLINE_DATASET);
assert(
  'generateBusinessInsights grounds driver insight in actual top cause without FAA/Eurocontrol/IATA jargon',
  insights.length >= 2 &&
    insights.some((i) => i.fact.includes(metrics.topDelayCauses[0].cause) && i.interpretation.includes(metrics.topDelayCauses[0].cause)) &&
    insights.every((i) => !/FAA|Eurocontrol|IATA|airport airspace congestion/i.test(`${i.title} ${i.fact} ${i.interpretation} ${i.actionItem}`))
);

const zeroDelayMetrics = calculateOperationalMetrics([
  {
    flight_id: 'ZD-100',
    airline: 'ZeroAir',
    origin: 'DEN',
    destination: 'PHX',
    scheduled_departure: '2026-11-12T08:00:00Z',
    actual_departure: '2026-11-12T08:00:00Z',
    delay_minutes: 0,
    flight_status: 'ON_TIME',
    distance: 602,
    date: '2026-11-12',
  },
  {
    flight_id: 'ZD-101',
    airline: 'ZeroAir',
    origin: 'LAS',
    destination: 'SEA',
    scheduled_departure: '09:00',
    actual_departure: '09:00',
    delay_minutes: 0,
    flight_status: 'CANCELLED',
    distance: 867,
    date: '2026-11-12',
  },
]);
assert(
  'maxDelay defaults to N/A when no delays exist',
  zeroDelayMetrics.maxDelay.flight_id === 'N/A' && zeroDelayMetrics.maxDelay.route === 'N/A'
);
assert(
  'Hourly distribution parses ISO hour 08:00 cleanly',
  zeroDelayMetrics.hourlyDistribution.some((h) => h.hour === '08:00')
);
const cancelledRoute = zeroDelayMetrics.topDelayedRoutes.find((r) => r.route === 'LAS-SEA');
assert('Cancelled route reports 0% OTP instead of 100%', cancelledRoute?.otp === 0);

const thresholdFlight = [
  {
    flight_id: 'TH-18',
    airline: 'ThresholdAir',
    origin: 'ATL',
    destination: 'MIA',
    scheduled_departure: '10:00',
    actual_departure: '10:18',
    delay_minutes: 18,
    flight_status: 'DELAYED' as const,
    distance: 595,
    date: '2026-11-12',
  },
];
assert(
  'OTP threshold dynamically reclassifies 18m delay under OTP-20',
  calculateOperationalMetrics(thresholdFlight, 15).onTimePerformance === 0 &&
    calculateOperationalMetrics(thresholdFlight, 20).onTimePerformance === 100
);

// 4. Storage Key Registry, Seed Versioning & Settings Persistence
assert(
  'ALL_STORAGE_KEYS contains all 22 unique module keys',
  ALL_STORAGE_KEYS.length === 22 && new Set(ALL_STORAGE_KEYS).size === 22
);
assert(
  'ALL_STORAGE_KEYS includes Phase 3-5 aligned store names',
  [
    'airops_workflow_definitions_v3',
    'airops_workflow_simulations_v3',
    'airops_prompt_library_v2',
    'airops_ai_evaluations_v2',
    'airops_structured_user_stories',
    'airops_uat_test_cases',
    'airops_automation_executions',
    'airops_adoption_analytics',
  ].every((k) => ALL_STORAGE_KEYS.includes(k))
);

// Regression test for Item 4 & Item 6: Seed versioning & settings persistence
localStorage.setItem(SEED_VERSION_KEY, 'outdated-v0');
localStorage.setItem('airops_otp_threshold', '20');
const didReset = ensureSeedVersion();
assert(
  'ensureSeedVersion resets stale browser storage and writes current seed version',
  didReset === true &&
    localStorage.getItem(SEED_VERSION_KEY) === CURRENT_SEED_VERSION &&
    getStoredOtpThreshold() === 15
);
saveStoredOtpThreshold(20);
saveStoredHourlyRate(110);
assert(
  'Settings OTP threshold and hourly rate persist across reads',
  getStoredOtpThreshold() === 20 && getStoredHourlyRate() === 110
);

// 5. ROI Calculator & Estimated Hours Consistency (Item 3)
const totalEstimatedHoursSaved = INITIAL_OPPORTUNITIES.reduce(
  (sum, opp) => sum + (opp.estimatedHoursSavedAnnual || 0),
  0
);
assert('Seed automation opportunities sum to exactly 6,315 hours/year', totalEstimatedHoursSaved === 6315);

const roi = calculateAutomationROI(DEFAULT_ROI_INPUTS);
assert('ROI calculator produces positive annual hours', roi.annualHoursSaved > 0);
assert('ROI payback months is finite and positive', isFinite(roi.paybackPeriodMonths) && roi.paybackPeriodMonths > 0);
const negativeRoi = calculateAutomationROI({
  manualMinutesPerExecution: 5,
  automatedMinutesPerExecution: 4,
  executionsPerDay: 1,
  workingDaysPerYear: 200,
  staffHourlyCost: 50,
  oneTimeImplementationCost: 50000,
  annualRecurringMaintenanceCost: 10000,
});
assert(
  'Negative ongoing net benefit returns paybackPeriodMonths === 0',
  negativeRoi.estimatedNetAnnualBenefit < 0 && negativeRoi.paybackPeriodMonths === 0
);

// 6. Workflow Simulator (deterministic seeded + async + conditionValue '0' boundary)
const simRunA = await simulateWorkflowExecution(INITIAL_WORKFLOWS[0], undefined, 1);
const simRunB = await simulateWorkflowExecution(INITIAL_WORKFLOWS[0], undefined, 1);
assert(
  'Workflow simulator executes steps deterministically for identical workflow and runNumber',
  simRunA.status === 'COMPLETED_SUCCESS' &&
    simRunA.stepLogs.length > 0 &&
    simRunA.id === simRunB.id &&
    simRunA.totalDurationMs === simRunB.totalDurationMs &&
    JSON.stringify(simRunA.stepLogs.map((s) => s.durationMs)) ===
      JSON.stringify(simRunB.stepLogs.map((s) => s.durationMs))
);

const zeroConditionWf = {
  id: 'WF-TEST-ZERO',
  name: 'Zero Condition Boundary Test',
  description: 'Tests conditionValue === 0 without coercing to 15',
  department: 'Flight Operations',
  status: 'Draft' as const,
  createdAt: '2026-11-12',
  updatedAt: '2026-11-12',
  steps: [
    {
      id: 'c1',
      name: 'Delay > 0',
      type: 'Condition' as const,
      description: 'Check delay > 0',
      config: { conditionField: 'delay_minutes', conditionOperator: '>' as const, conditionValue: '0' },
    },
  ],
};
const zeroCondRun = await simulateWorkflowExecution(zeroConditionWf, {
  scenarioName: 'Minor Delay (5m)',
  mockData: { delay_minutes: 5, completeness_score: 100, flight_id: 'TST-5' },
  autoApprove: true,
});
assert(
  'Workflow Condition handles numeric threshold "0" without fallback coercion',
  zeroCondRun.stepLogs[0]?.status === 'SUCCESS'
);

// 7. Audit Logger monotonic IDs & AI Evaluator token boundary matching
const ev1 = recordAuditEvent({ entityType: 'Business Problem', entityId: 'PRB-001', action: 'UPDATE' });
const ev2 = recordAuditEvent({ entityType: 'Business Problem', entityId: 'PRB-002', action: 'UPDATE' });
assert(
  'Audit logger produces strictly unique increasing IDs',
  ev1.id !== ev2.id && Number(ev2.id.split('-')[1]) > Number(ev1.id.split('-')[1])
);

const boundaryCheck = checkResponseFactualGroundedness('Network OTP is 61.5% today.', {
  ...metrics,
  totalFlights: 6,
  onTimePerformance: 61.5,
});
assert(
  'AI groundedness check avoids substring false match on totalFlights=6 in 61.5%',
  boundaryCheck.unverifiedOrMissing.some((m) => m.includes('Total flights (6)'))
);

// 8. Problems & Requirements Relational Integrity
assert('6 business problems registered', INITIAL_BUSINESS_PROBLEMS.length === 6);
assert('6 business requirements registered', INITIAL_BUSINESS_REQUIREMENTS.length === 6);
assert('10 functional requirements registered', INITIAL_FUNCTIONAL_REQUIREMENTS.length === 10);
assert('8 user stories registered', INITIAL_USER_STORIES.length === 8);
assert('6 UAT test cases registered', INITIAL_UAT_TEST_CASES.length === 6);

// 9. Solutions Portfolio Integrity & Evidence Tiers
assert('6 digital solutions registered', INITIAL_PORTFOLIO.length === 6);
const benchmarkSolution = INITIAL_PORTFOLIO.find((s) => s.id === 'SOL-104');
assert('SOL-104 is classified as Demonstration Benchmark', benchmarkSolution?.benefitTier === 'Demonstration Benchmark');
assert(
  'SOL-104 demonstrates 1,120 hours capacity value across 3 stations',
  benchmarkSolution?.measuredBenefitHours === 1120
);

console.log(`\nRegression Suite Complete: ${passed} PASSED, ${failed} FAILED.`);
if (failed > 0) process.exit(1);
