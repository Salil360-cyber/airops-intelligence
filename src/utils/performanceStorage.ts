import {
  SolutionPortfolioItem,
  AutomationExecutionMetric,
  BenefitsRealizationRecord,
  AdoptionMetric,
  OperationalImpactRecord,
  ConfiguredKPI,
} from '../types';

const STORAGE_KEYS = {
  PORTFOLIO: 'airops_solutions_portfolio',
  EXECUTIONS: 'airops_automation_executions',
  BENEFITS: 'airops_benefits_realization',
  ADOPTION: 'airops_adoption_analytics',
  IMPACT: 'airops_operational_impact',
  KPIS: 'airops_configured_kpis',
};

// ==========================================
// BASELINE SAMPLE DATASET
// ==========================================

export const INITIAL_PORTFOLIO: SolutionPortfolioItem[] = [
  {
    id: 'SOL-101',
    opportunityId: 'OPP-101',
    problemId: 'PRB-001',
    bottleneckId: 'BTN-001',
    requirementIds: ['BR-001', 'FR-001', 'FR-002', 'FR-003'],
    userStoryIds: ['US-001', 'US-002', 'US-003'],
    solutionTitle: 'Automated Flight Disruption Passenger Notification Engine',
    department: 'Customer Experience',
    solutionOwner: 'Salil Gokhale (Business Analyst (Portfolio Demo))',
    priority: 'High',
    status: 'Approved',
    stage: 'Architecture',
    plannedCompletionDate: '2026-12-15',
    targetBenefitHours: 1289,
    measuredBenefitHours: 0,
    targetMetric: 'Notification latency < 90 seconds',
    latestResult: 'Architecture and API integration validated in sandbox',
    benefitTier: 'Estimated',
  },
  {
    id: 'SOL-102',
    opportunityId: 'OPP-102',
    problemId: 'PRB-002',
    bottleneckId: 'BTN-003',
    requirementIds: ['BR-003', 'FR-005', 'FR-006'],
    userStoryIds: ['US-004', 'US-005'],
    solutionTitle: 'Daily Operations Executive Telemetry ETL Pipeline',
    department: 'OCC & Dispatch',
    solutionOwner: 'Demo Reviewer',
    priority: 'Critical',
    status: 'In Progress',
    stage: 'Build',
    plannedCompletionDate: '2026-11-30',
    targetBenefitHours: 692,
    measuredBenefitHours: 0,
    targetMetric: 'Automated delivery at 05:00 UTC with 0 manual VLOOKUPs',
    latestResult: 'Flight status and dispatch ingestion worker running in staging',
    benefitTier: 'Simulated',
  },
  {
    id: 'SOL-103',
    opportunityId: 'OPP-103',
    problemId: 'PRB-003',
    bottleneckId: 'BTN-005',
    requirementIds: ['BR-004', 'FR-007', 'FR-008'],
    userStoryIds: ['US-006'],
    solutionTitle: 'Predictive ATC Slot Compliance & Crew Duty Buffer Monitor',
    department: 'Flight Operations',
    solutionOwner: 'Sarah Jenkins (Flight Operations Dispatcher)',
    priority: 'High',
    status: 'Under Review',
    stage: 'Discovery',
    plannedCompletionDate: '2027-01-20',
    targetBenefitHours: 1235,
    measuredBenefitHours: 0,
    targetMetric: '90-minute advance countdown warning for crew timeouts',
    latestResult: 'Business case submitted to Flight Ops Steering Committee',
    benefitTier: 'Estimated',
  },
  {
    id: 'SOL-104',
    opportunityId: 'OPP-104',
    problemId: 'PRB-004',
    bottleneckId: 'BTN-006',
    requirementIds: ['BR-005', 'FR-009'],
    userStoryIds: ['US-007'],
    solutionTitle: 'Turnaround Baggage Hold Handheld Scanner Reconciliation',
    department: 'Ground Handling',
    solutionOwner: 'Marcus Vance (Lead Solutions QA)',
    priority: 'High',
    status: 'Implemented',
    stage: 'Production',
    plannedCompletionDate: '2026-10-15',
    actualCompletionDate: '2026-10-12',
    targetBenefitHours: 1373,
    measuredBenefitHours: 1120, // Demonstration benchmark target
    targetMetric: 'Zero departure gate holds from paper reconciliation',
    latestResult: '1,120 hours calculated in staging trial benchmark (Demonstration Data)',
    benefitTier: 'Demonstration Benchmark',
  },
  {
    id: 'SOL-105',
    opportunityId: 'OPP-105',
    problemId: 'PRB-005',
    bottleneckId: 'BTN-007',
    requirementIds: ['BR-006', 'FR-010'],
    userStoryIds: ['US-008'],
    solutionTitle: 'AOG Maintenance Defect Document Optical Parser',
    department: 'Flight Operations',
    solutionOwner: 'Tech Ops Logistics Lead',
    priority: 'Critical',
    status: 'Identified',
    stage: 'Discovery',
    plannedCompletionDate: '2027-02-28',
    targetBenefitHours: 607,
    measuredBenefitHours: 0,
    targetMetric: '3.5-hour reduction in AOG aircraft downtime',
    latestResult: 'Initial feasibility assessment approved',
    benefitTier: 'Estimated',
  },
  {
    id: 'SOL-106',
    opportunityId: 'OPP-106',
    problemId: 'PRB-002',
    bottleneckId: 'BTN-004',
    requirementIds: ['FR-005'],
    userStoryIds: ['US-005'],
    solutionTitle: 'Multi-Carrier Flight Telemetry Discrepancy Reconciliation ETL',
    department: 'OCC & Dispatch',
    solutionOwner: 'Enterprise Data Architecture Lead',
    priority: 'Medium',
    status: 'Identified',
    stage: 'Discovery',
    plannedCompletionDate: '2027-03-15',
    targetBenefitHours: 1119,
    measuredBenefitHours: 0,
    targetMetric: 'Continuous 10-minute automated micro-batch sync',
    latestResult: 'Vendor API evaluation in progress',
    benefitTier: 'Estimated',
  },
];

export const INITIAL_EXECUTIONS: AutomationExecutionMetric[] = [
  {
    workflowId: 'WF-104',
    workflowName: 'Turnaround Baggage Hold Handheld Scanner Sync',
    environment: 'Demonstration Benchmark',
    totalRuns: 3420,
    successfulRuns: 3398,
    failedRuns: 14,
    blockedRuns: 8,
    avgDurationMs: 420,
    manualTimeMinutes: 18,
    automatedTimeSeconds: 4,
    timeSavedPerRunMinutes: 17.93,
    totalTimeSavedHours: 1022.2,
    successRate: 99.36,
    lastExecution: '2026-11-12T04:05:00Z',
  },
  {
    workflowId: 'WF-101',
    workflowName: 'Flight Disruption Passenger Re-accommodation Webhook',
    environment: 'Local Simulation',
    totalRuns: 142,
    successfulRuns: 138,
    failedRuns: 3,
    blockedRuns: 1,
    avgDurationMs: 1850,
    manualTimeMinutes: 25,
    automatedTimeSeconds: 8,
    timeSavedPerRunMinutes: 24.8,
    totalTimeSavedHours: 58.7,
    successRate: 97.18,
    lastExecution: '2026-11-11T16:30:00Z',
  },
  {
    workflowId: 'WF-102',
    workflowName: 'Daily Operations 05:00 UTC KPI Generation Pipeline',
    environment: 'Local Simulation',
    totalRuns: 84,
    successfulRuns: 82,
    failedRuns: 2,
    blockedRuns: 0,
    avgDurationMs: 3100,
    manualTimeMinutes: 60,
    automatedTimeSeconds: 15,
    timeSavedPerRunMinutes: 59.75,
    totalTimeSavedHours: 83.6,
    successRate: 97.62,
    lastExecution: '2026-11-12T05:00:00Z',
  },
  {
    workflowId: 'WF-103',
    workflowName: 'ATC Departure Slot Crew Duty Buffer Alert Monitor',
    environment: 'Local Simulation',
    totalRuns: 45,
    successfulRuns: 43,
    failedRuns: 1,
    blockedRuns: 1,
    avgDurationMs: 1200,
    manualTimeMinutes: 20,
    automatedTimeSeconds: 5,
    timeSavedPerRunMinutes: 19.9,
    totalTimeSavedHours: 14.9,
    successRate: 95.56,
    lastExecution: '2026-11-10T19:40:00Z',
  },
];

export const INITIAL_BENEFITS: BenefitsRealizationRecord[] = [
  {
    id: 'BEN-104',
    solutionId: 'SOL-104',
    solutionTitle: 'Turnaround Baggage Hold Handheld Scanner Sync',
    department: 'Ground Handling',
    approvedBusinessCase: 'Eliminate widebody departure ramp gate holds caused by paper manifest double-checking.',
    baselineManualMinutes: 18,
    actualObservedMinutes: 1,
    annualExecutionVolume: 5720,
    implementationCostUSD: 45000,
    annualRecurringMaintenanceUSD: 8500,
    laborHourlyRateUSD: 85,
    estimatedAnnualLaborValueUSD: 116705,
    actualMeasuredLaborValueUSD: 95200, // 1,120 hrs * $85/hr (Demonstration Benchmark)
    firstYearNetBenefitUSD: 41700, // $95,200 - $45,000 - $8,500
    roiPercentage: 92.7,
    paybackPeriodMonths: 6.2,
    valueType: 'Demonstration Benchmark',
    evidenceDescription: 'Simulated 3-station staging trial scenario (1,120 calculated hours across 3,420 simulated baggage events). Seeded prototype benchmark — pending live airline production audit.',
    verifiedBy: 'Demonstration Benchmark Model (Prototype Staging Baseline)',
    verifiedDate: '2026-11-02',
  },
  {
    id: 'BEN-101',
    solutionId: 'SOL-101',
    solutionTitle: 'Flight Disruption Passenger Notification Engine',
    department: 'Customer Experience',
    approvedBusinessCase: 'Automate PNR query and SMS dispatch upon departure delay > 20 minutes.',
    baselineManualMinutes: 25,
    actualObservedMinutes: 2,
    annualExecutionVolume: 3640,
    implementationCostUSD: 60000,
    annualRecurringMaintenanceUSD: 12000,
    laborHourlyRateUSD: 85,
    estimatedAnnualLaborValueUSD: 109565,
    actualMeasuredLaborValueUSD: 0, // Not yet measured in production
    firstYearNetBenefitUSD: 37565,
    roiPercentage: 62.6,
    paybackPeriodMonths: 8.5,
    valueType: 'Estimated',
    evidenceDescription: 'Approved business case projection based on 70 weekly disruption events and reservation API SLA.',
    verifiedBy: 'Director of Customer Experience & Station Operations',
    verifiedDate: '2026-10-25',
  },
  {
    id: 'BEN-102',
    solutionId: 'SOL-102',
    solutionTitle: 'Daily Operations Executive Telemetry ETL Pipeline',
    department: 'OCC & Dispatch',
    approvedBusinessCase: 'Automate morning shift flight status and dispatch aggregation into executive portal at 05:00 UTC.',
    baselineManualMinutes: 60,
    actualObservedMinutes: 5,
    annualExecutionVolume: 728,
    implementationCostUSD: 35000,
    annualRecurringMaintenanceUSD: 6000,
    laborHourlyRateUSD: 85,
    estimatedAnnualLaborValueUSD: 58820,
    actualMeasuredLaborValueUSD: 0,
    firstYearNetBenefitUSD: 17820,
    roiPercentage: 50.9,
    paybackPeriodMonths: 9.2,
    valueType: 'Simulated',
    evidenceDescription: 'Simulated test runs in staging demonstrated 97.6% automated ingestion success.',
    verifiedBy: 'Demo Reviewer',
    verifiedDate: '2026-11-08',
  },
];

export const INITIAL_ADOPTION: AdoptionMetric[] = [
  {
    department: 'Ground Handling',
    roleName: 'Ramp Turnaround Coordinators',
    eligibleUsers: 65,
    activeUsers: 58,
    weeklyWorkflowsTriggered: 110,
    repeatUsageRate: 94.8,
    adoptionRate: 89.2, // 58/65
    monthlyTrend: [
      { month: 'Aug 2026', activeUsers: 22, adoptionRate: 33.8 },
      { month: 'Sep 2026', activeUsers: 44, adoptionRate: 67.7 },
      { month: 'Oct 2026', activeUsers: 54, adoptionRate: 83.1 },
      { month: 'Nov 2026', activeUsers: 58, adoptionRate: 89.2 },
    ],
  },
  {
    department: 'OCC & Dispatch',
    roleName: 'Flight Duty Managers',
    eligibleUsers: 28,
    activeUsers: 21,
    weeklyWorkflowsTriggered: 35,
    repeatUsageRate: 91.3,
    adoptionRate: 75.0, // 21/28
    monthlyTrend: [
      { month: 'Aug 2026', activeUsers: 8, adoptionRate: 28.6 },
      { month: 'Sep 2026', activeUsers: 14, adoptionRate: 50.0 },
      { month: 'Oct 2026', activeUsers: 19, adoptionRate: 67.9 },
      { month: 'Nov 2026', activeUsers: 21, adoptionRate: 75.0 },
    ],
  },
  {
    department: 'Customer Experience',
    roleName: 'Airport Station Supervisors',
    eligibleUsers: 45,
    activeUsers: 32,
    weeklyWorkflowsTriggered: 70,
    repeatUsageRate: 82.5,
    adoptionRate: 71.1, // 32/45
    monthlyTrend: [
      { month: 'Aug 2026', activeUsers: 10, adoptionRate: 22.2 },
      { month: 'Sep 2026', activeUsers: 20, adoptionRate: 44.4 },
      { month: 'Oct 2026', activeUsers: 28, adoptionRate: 62.2 },
      { month: 'Nov 2026', activeUsers: 32, adoptionRate: 71.1 },
    ],
  },
  {
    department: 'Flight Operations',
    roleName: 'Chief Pilots & Crew Schedulers',
    eligibleUsers: 35,
    activeUsers: 18,
    weeklyWorkflowsTriggered: 25,
    repeatUsageRate: 72.0,
    adoptionRate: 51.4, // 18/35
    monthlyTrend: [
      { month: 'Aug 2026', activeUsers: 4, adoptionRate: 11.4 },
      { month: 'Sep 2026', activeUsers: 9, adoptionRate: 25.7 },
      { month: 'Oct 2026', activeUsers: 14, adoptionRate: 40.0 },
      { month: 'Nov 2026', activeUsers: 18, adoptionRate: 51.4 },
    ],
  },
];

export const INITIAL_IMPACT: OperationalImpactRecord[] = [
  {
    id: 'IMP-104',
    bottleneckId: 'BTN-006',
    bottleneckTitle: 'Ramp Coordinator Paper Loadsheet Verification',
    problemId: 'PRB-004',
    solutionId: 'SOL-104',
    baselineDelayMinutes: 18,
    currentObservedDelayMinutes: 2,
    delayReductionMinutes: 16,
    delayReductionPercentage: 88.9,
    resolutionStatus: 'Resolved',
    evidenceSource: 'Simulated 3-station staging trial logs across 1,240 simulated widebody departures (Demonstration Benchmark).',
    reviewStatus: 'Verified in Staging Simulation',
    reviewedAt: '2026-11-04',
  },
  {
    id: 'IMP-101',
    bottleneckId: 'BTN-001',
    bottleneckTitle: 'Manual Passenger Booking CSV Export from Reservation System',
    problemId: 'PRB-001',
    solutionId: 'SOL-101',
    baselineDelayMinutes: 25,
    currentObservedDelayMinutes: 12,
    delayReductionMinutes: 13,
    delayReductionPercentage: 52.0,
    resolutionStatus: 'Partially Mitigated',
    evidenceSource: 'Pre-production test batches using reservation sandbox REST API.',
    reviewStatus: 'Pending Audit',
    reviewedAt: '2026-11-09',
  },
  {
    id: 'IMP-102',
    bottleneckId: 'BTN-003',
    bottleneckTitle: 'Legacy Mainframe Timezone Synchronization Discrepancies',
    problemId: 'PRB-002',
    solutionId: 'SOL-102',
    baselineDelayMinutes: 45,
    currentObservedDelayMinutes: 15,
    delayReductionMinutes: 30,
    delayReductionPercentage: 66.7,
    resolutionStatus: 'Partially Mitigated',
    evidenceSource: 'Staging nightly ETL execution records.',
    reviewStatus: 'Verified by OCC',
    reviewedAt: '2026-11-10',
  },
  {
    id: 'IMP-103',
    bottleneckId: 'BTN-005',
    bottleneckTitle: 'Mental Duty Hours Math on ATC Ground Stop Slot Revisions',
    problemId: 'PRB-003',
    solutionId: 'SOL-103',
    baselineDelayMinutes: 30,
    currentObservedDelayMinutes: 28,
    delayReductionMinutes: 2,
    delayReductionPercentage: 6.7,
    resolutionStatus: 'Active Bottleneck',
    evidenceSource: 'Current dispatch paper calculations; solution currently in Discovery.',
    reviewStatus: 'Pending Audit',
    reviewedAt: '2026-11-08',
  },
  {
    id: 'IMP-105',
    bottleneckId: 'BTN-007',
    bottleneckTitle: 'Outstation Mechanic Discrepancy Phone Tag with Maintenance Control',
    problemId: 'PRB-005',
    solutionId: 'SOL-105',
    baselineDelayMinutes: 40,
    currentObservedDelayMinutes: 38,
    delayReductionMinutes: 2,
    delayReductionPercentage: 5.0,
    resolutionStatus: 'Active Bottleneck',
    evidenceSource: 'Pre-implementation mechanic task study; solution in Discovery.',
    reviewStatus: 'Pending Audit',
    reviewedAt: '2026-11-09',
  },
];

export const INITIAL_CONFIGURED_KPIS: ConfiguredKPI[] = [
  {
    id: 'KPI-001',
    name: 'Workflow Success Rate',
    description: 'Percentage of automated workflow executions that complete without fatal error or exception.',
    formula: '(Successful Executions / Total Executions) * 100',
    target: 98.0,
    threshold: 95.0,
    unit: '%',
    department: 'OCC & Systems Architecture',
    frequency: 'Daily',
    dataSource: 'Workflow Execution Telemetry',
    owner: 'Marcus Vance (Lead Solutions QA)',
    currentValue: 99.1,
    status: 'On Target',
    reviewStatus: 'Active',
  },
  {
    id: 'KPI-002',
    name: 'Benefits Realization Ratio',
    description: 'Proportion of approved business case target hours validated in production environments.',
    formula: '(Actual Measured Savings / Approved Target Savings) * 100',
    target: 80.0,
    threshold: 60.0,
    unit: '%',
    department: 'Enterprise Operations Steering',
    frequency: 'Monthly',
    dataSource: 'Station Operations Audit Records',
    owner: 'Salil Gokhale (Business Analyst (Portfolio Demo))',
    currentValue: 81.6, // 1120 / 1373 for SOL-104
    status: 'On Target',
    reviewStatus: 'Active',
  },
  {
    id: 'KPI-003',
    name: 'Operational User Adoption Rate',
    description: 'Percentage of eligible frontline operations staff actively triggering digital solutions weekly.',
    formula: '(Active Users / Eligible Users) * 100',
    target: 75.0,
    threshold: 65.0,
    unit: '%',
    department: 'Customer Experience & Airport Services',
    frequency: 'Weekly',
    dataSource: 'Identity Gateway Session Logs',
    owner: 'Station Training & Change Management Lead',
    currentValue: 74.3,
    status: 'At Risk',
    reviewStatus: 'Active',
  },
  {
    id: 'KPI-004',
    name: 'Bottleneck Resolution Ratio',
    description: 'Proportion of identified operational bottlenecks fully resolved or mitigated by automation.',
    formula: '(Resolved Bottlenecks / Total Identified Bottlenecks) * 100',
    target: 50.0,
    threshold: 30.0,
    unit: '%',
    department: 'OCC & Station Operations',
    frequency: 'Quarterly',
    dataSource: 'Phase 4 Bottleneck Registry',
    owner: 'Chief Operations Architect',
    currentValue: 33.3, // 2 of 6 resolved or partially mitigated
    status: 'At Risk',
    reviewStatus: 'Active',
  },
];

// ==========================================
// DETERMINISTIC CALCULATION HELPERS
// ==========================================

export function safeDiv(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0 || !isFinite(denominator) || isNaN(denominator) || isNaN(numerator)) {
    return fallback;
  }
  return numerator / denominator;
}

export interface ExecutiveSummaryMetrics {
  totalProblems: number;
  totalOpportunities: number;
  approvedSolutions: number;
  solutionsInProgress: number;
  implementedSolutions: number;
  totalExecutions: number;
  productionExecutions: number;
  demonstrationExecutions: number;
  simulatedExecutions: number;
  workflowSuccessRate: number;
  totalEstimatedHours: number;
  totalMeasuredHours: number;
  totalDemonstrationHours: number;
  benefitsRealizationRate: number;
  overallAdoptionRate: number;
  totalEligibleUsers: number;
  totalActiveUsers: number;
  totalBottlenecks: number;
  resolvedBottlenecks: number;
  bottleneckResolutionRate: number;
  totalLaborValueEstimatedUSD: number;
  totalLaborValueMeasuredUSD: number;
  totalLaborValueDemonstratedUSD: number;
  portfolioROI: number;
}

export function computeExecutiveSummaryMetrics(
  portfolio: SolutionPortfolioItem[],
  executions: AutomationExecutionMetric[],
  benefits: BenefitsRealizationRecord[],
  adoption: AdoptionMetric[],
  impact: OperationalImpactRecord[],
  totalProblemsCount = 4
): ExecutiveSummaryMetrics {
  const totalOpportunities = portfolio.length;
  const approvedSolutions = portfolio.filter((p) => ['Approved', 'In Progress', 'Implemented'].includes(p.status)).length;
  const solutionsInProgress = portfolio.filter((p) => p.status === 'In Progress').length;
  const implementedSolutions = portfolio.filter((p) => p.status === 'Implemented').length;

  const totalRuns = executions.reduce((acc, e) => acc + (e.totalRuns || 0), 0);
  const totalSuccess = executions.reduce((acc, e) => acc + (e.successfulRuns || 0), 0);
  const productionExecutions = executions
    .filter((e) => e.environment === 'Production Measured')
    .reduce((acc, e) => acc + (e.totalRuns || 0), 0);
  const demonstrationExecutions = executions
    .filter((e) => e.environment === 'Demonstration Benchmark')
    .reduce((acc, e) => acc + (e.totalRuns || 0), 0);
  const simulatedExecutions = executions
    .filter((e) => e.environment === 'Local Simulation')
    .reduce((acc, e) => acc + (e.totalRuns || 0), 0);

  const workflowSuccessRate = safeDiv(totalSuccess * 100, totalRuns, 0);

  const totalEstimatedHours = portfolio.reduce((acc, p) => acc + (p.targetBenefitHours || 0), 0);
  const totalMeasuredHours = portfolio
    .filter((p) => p.benefitTier === 'Measured')
    .reduce((acc, p) => acc + (p.measuredBenefitHours || 0), 0);
  const totalDemonstrationHours = portfolio
    .filter((p) => p.benefitTier === 'Demonstration Benchmark')
    .reduce((acc, p) => acc + (p.measuredBenefitHours || 0), 0);

  // Benefits Realization Rate: measured + demonstrated benefit hours / target benefit hours for implemented solutions
  const implementedTargets = portfolio
    .filter((p) => p.status === 'Implemented')
    .reduce((acc, p) => acc + (p.targetBenefitHours || 0), 0);
  const effectiveHours = totalMeasuredHours + totalDemonstrationHours;
  const benefitsRealizationRate = safeDiv(effectiveHours * 100, implementedTargets, 0);

  // Adoption totals
  const totalEligibleUsers = adoption.reduce((acc, a) => acc + (a.eligibleUsers || 0), 0);
  const totalActiveUsers = adoption.reduce((acc, a) => acc + (a.activeUsers || 0), 0);
  const overallAdoptionRate = safeDiv(totalActiveUsers * 100, totalEligibleUsers, 0);

  // Bottleneck totals
  const totalBottlenecks = impact.length;
  const resolvedBottlenecks = impact.filter((i) => i.resolutionStatus === 'Resolved').length;
  const bottleneckResolutionRate = safeDiv(resolvedBottlenecks * 100, totalBottlenecks, 0);

  // Financial values
  const totalLaborValueEstimatedUSD = benefits.reduce((acc, b) => acc + (b.estimatedAnnualLaborValueUSD || 0), 0);
  const totalLaborValueMeasuredUSD = benefits
    .filter((b) => b.valueType === 'Measured')
    .reduce((acc, b) => acc + (b.actualMeasuredLaborValueUSD || 0), 0);
  const totalLaborValueDemonstratedUSD = benefits
    .filter((b) => b.valueType === 'Demonstration Benchmark')
    .reduce((acc, b) => acc + (b.actualMeasuredLaborValueUSD || 0), 0);

  const totalImplCost = benefits.reduce((acc, b) => acc + (b.implementationCostUSD || 0), 0);
  const totalNetBenefit = benefits.reduce((acc, b) => acc + (b.firstYearNetBenefitUSD || 0), 0);
  const portfolioROI = safeDiv(totalNetBenefit * 100, totalImplCost, 0);

  return {
    totalProblems: totalProblemsCount,
    totalOpportunities,
    approvedSolutions,
    solutionsInProgress,
    implementedSolutions,
    totalExecutions: totalRuns,
    productionExecutions,
    demonstrationExecutions,
    simulatedExecutions,
    workflowSuccessRate: Number(workflowSuccessRate.toFixed(1)),
    totalEstimatedHours,
    totalMeasuredHours,
    totalDemonstrationHours,
    benefitsRealizationRate: Number(benefitsRealizationRate.toFixed(1)),
    overallAdoptionRate: Number(overallAdoptionRate.toFixed(1)),
    totalEligibleUsers,
    totalActiveUsers,
    totalBottlenecks,
    resolvedBottlenecks,
    bottleneckResolutionRate: Number(bottleneckResolutionRate.toFixed(1)),
    totalLaborValueEstimatedUSD,
    totalLaborValueMeasuredUSD,
    totalLaborValueDemonstratedUSD,
    portfolioROI: Number(portfolioROI.toFixed(1)),
  };
}

// ==========================================
// PERSISTENCE HELPERS
// ==========================================

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
  }
  setToStorage(key, fallback);
  return fallback;
}

function setToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export function getStoredPortfolio(): SolutionPortfolioItem[] {
  return getFromStorage(STORAGE_KEYS.PORTFOLIO, INITIAL_PORTFOLIO);
}

export function saveStoredPortfolio(data: SolutionPortfolioItem[]): void {
  setToStorage(STORAGE_KEYS.PORTFOLIO, data);
}

export function getStoredExecutionMetrics(): AutomationExecutionMetric[] {
  return getFromStorage(STORAGE_KEYS.EXECUTIONS, INITIAL_EXECUTIONS);
}

export function saveStoredExecutionMetrics(data: AutomationExecutionMetric[]): void {
  setToStorage(STORAGE_KEYS.EXECUTIONS, data);
}

export function getStoredBenefitsRealization(): BenefitsRealizationRecord[] {
  return getFromStorage(STORAGE_KEYS.BENEFITS, INITIAL_BENEFITS);
}

export function saveStoredBenefitsRealization(data: BenefitsRealizationRecord[]): void {
  setToStorage(STORAGE_KEYS.BENEFITS, data);
}

export function getStoredAdoptionMetrics(): AdoptionMetric[] {
  return getFromStorage(STORAGE_KEYS.ADOPTION, INITIAL_ADOPTION);
}

export function saveStoredAdoptionMetrics(data: AdoptionMetric[]): void {
  setToStorage(STORAGE_KEYS.ADOPTION, data);
}

export function getStoredOperationalImpact(): OperationalImpactRecord[] {
  return getFromStorage(STORAGE_KEYS.IMPACT, INITIAL_IMPACT);
}

export function saveStoredOperationalImpact(data: OperationalImpactRecord[]): void {
  setToStorage(STORAGE_KEYS.IMPACT, data);
}

export function getStoredConfiguredKPIs(): ConfiguredKPI[] {
  return getFromStorage(STORAGE_KEYS.KPIS, INITIAL_CONFIGURED_KPIS);
}

export function saveStoredConfiguredKPIs(data: ConfiguredKPI[]): void {
  setToStorage(STORAGE_KEYS.KPIS, data);
}

export function resetPerformanceDefaults(): void {
  saveStoredPortfolio(INITIAL_PORTFOLIO);
  saveStoredExecutionMetrics(INITIAL_EXECUTIONS);
  saveStoredBenefitsRealization(INITIAL_BENEFITS);
  saveStoredAdoptionMetrics(INITIAL_ADOPTION);
  saveStoredOperationalImpact(INITIAL_IMPACT);
  saveStoredConfiguredKPIs(INITIAL_CONFIGURED_KPIS);
}
