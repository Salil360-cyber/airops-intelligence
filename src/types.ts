export interface FlightRecord {
  flight_id: string;
  airline: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  actual_departure: string;
  delay_minutes: number;
  flight_status: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DIVERTED';
  distance: number;
  date: string;
  delay_reason?: 'Weather' | 'ATC Flow' | 'Turnaround Baggage' | 'Aircraft Maintenance' | 'Crew Rest' | 'None';
  aircraft_type?: string;
  passenger_load?: number;
}

export interface OperationalMetrics {
  totalFlights: number;
  onTimeFlights: number;
  delayedFlights: number;
  cancelledFlights: number;
  divertedFlights: number;
  onTimePerformance: number; // percentage (0 - 100)
  delayPercentage: number;
  cancellationRate: number;
  avgDelayMinutes: number; // among delayed
  medianDelayMinutes: number;
  maxDelay: {
    minutes: number;
    flight_id: string;
    route: string;
    airline?: string;
  };
  avgDelayAllFlights: number;
  totalDelayMinutes: number;
  hasDelayCauses: boolean;
  topDelayCauses: {
    cause: string;
    count: number;
    totalMinutes: number;
    percentage: number;
  }[];
  topDelayedRoutes: {
    route: string;
    origin: string;
    destination: string;
    totalFlights: number;
    delayedCount: number;
    avgDelay: number;
    otp: number;
  }[];
  bestRoutes: {
    route: string;
    origin: string;
    destination: string;
    totalFlights: number;
    otp: number;
    avgDelay: number;
  }[];
  hourlyDistribution: {
    hour: string;
    total: number;
    delayed: number;
    avgDelay: number;
  }[];
  airlineBreakdown: {
    airline: string;
    total: number;
    delayed: number;
    cancelled: number;
    otp: number;
    avgDelay: number;
  }[];
  airports: {
    origins: string[];
    destinations: string[];
    allAirports: string[];
  };
  dateRange: {
    minDate: string;
    maxDate: string;
    uniqueDates: string[];
  };
  dataQuality: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    missingValues: Record<string, number>;
    completenessScore: number;
    detectedAirlines: string[];
    detectedAirports: string[];
    dateCoverage: string;
    qualityWarnings: string[];
  };
}

export interface CSVValidationReport {
  fileName: string;
  fileSizeBytes: number;
  totalRowsParsed: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateCount: number;
  completenessScore: number;
  detectedHeaders: string[];
  missingRequiredHeaders: string[];
  detectedAirlines: string[];
  detectedAirports: string[];
  dateRange: { min: string; max: string };
  invalidRowDetails: { line: number; raw: string; error: string }[];
  duplicateFlightIds: string[];
  warnings: string[];
  previewRows: FlightRecord[];
  validRecords: FlightRecord[];
}

export interface BusinessInsight {
  id: string;
  category: 'BOTTLENECK' | 'AIRLINE_PERFORMANCE' | 'TEMPORAL_PEAK' | 'DATA_QUALITY' | 'POSITIVE_TREND';
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  fact: string;
  interpretation: string;
  actionItem: string;
}

export type OpportunityStatus =
  | 'Identified'
  | 'Under Review'
  | 'Approved'
  | 'In Progress'
  | 'Implemented'
  | 'Rejected';

export type FeasibilityLevel = 'Low' | 'Medium' | 'High';
export type SolutionCategory =
  | 'RPA Bot'
  | 'Event Webhook & Alerting'
  | 'AI Text/Data Parser'
  | 'Direct API Integration'
  | 'Rule-based Automation'
  | 'Low-code Application'
  | 'Workflow Automation';

export interface ProcessOpportunity {
  id: string;
  title: string;
  department: 'Flight Operations' | 'Ground Handling' | 'OCC & Dispatch' | 'Crew Planning' | 'Customer Experience';
  manualTaskDescription: string;
  repetitiveActivities: string;
  frequencyPerWeek: number;
  timeSpentPerTaskMinutes: number;
  automationFeasibility: FeasibilityLevel;
  proposedSolution: string;
  solutionType: SolutionCategory;
  estimatedHoursSavedAnnual: number;
  measuredHoursSavedAnnual?: number;
  status: OpportunityStatus;
  manualWorkflowSteps: string[];
  proposedWorkflowSteps: string[];
  createdAt: string;
  updatedAt: string;
  peopleInvolved?: number;
  complexity?: 'Low' | 'Medium' | 'High';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  businessOwner?: string;
  dependencies?: string[];
  riskNotes?: string;
  bottlenecks?: string[];
  expectedBenefits?: string[];
  humanIntervention?: string;
}

export type WorkflowStepType =
  | 'Trigger'
  | 'Data Input'
  | 'Validation'
  | 'Condition'
  | 'Approval'
  | 'Notification'
  | 'Data Transformation'
  | 'Report Generation'
  | 'End';

export interface WorkflowStepConfig {
  triggerEvent?: string;
  inputSchema?: string;
  validationRule?: string;
  conditionField?: string;
  conditionOperator?: '==' | '!=' | '>' | '<' | 'contains';
  conditionValue?: string;
  approvalRole?: string;
  notificationChannel?: 'Email' | 'SMS' | 'Webhook' | 'Ops Alert';
  notificationRecipient?: string;
  transformationType?: string;
  reportTemplate?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  description: string;
  config: WorkflowStepConfig;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  processId?: string;
  department: string;
  status: 'Draft' | 'Active' | 'Simulated' | 'Archived';
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSimulationStepLog {
  stepId: string;
  stepName: string;
  stepType: WorkflowStepType;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'WAITING_APPROVAL';
  durationMs: number;
  inputData: any;
  outputData: any;
  message: string;
  timestamp: string;
}

export interface WorkflowSimulationRun {
  id: string;
  workflowId: string;
  workflowName: string;
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  status: 'COMPLETED_SUCCESS' | 'COMPLETED_WITH_WARNINGS' | 'FAILED';
  stepLogs: WorkflowSimulationStepLog[];
  simulatedScenario: string;
}

export interface ROICalculationInputs {
  manualMinutesPerExecution: number;
  automatedMinutesPerExecution: number;
  executionsPerDay: number;
  workingDaysPerYear: number;
  staffHourlyCost: number;
  oneTimeImplementationCost: number;
  annualRecurringMaintenanceCost: number;
}

export interface ROICalculationResults {
  annualManualHours: number;
  annualAutomatedHours: number;
  annualHoursSaved: number;
  annualLabourValueSaved: number;
  annualRecurringCost: number;
  estimatedNetAnnualBenefit: number;
  estimatedFirstYearNetBenefit: number;
  roiPercentage: number;
  paybackPeriodMonths: number;
}

export interface TechAssessment {
  id: string;
  technology: string;
  category: SolutionCategory;
  businessJustification: string;
  complexity: 'Low' | 'Medium' | 'High';
  estimatedEffortWeeks: number;
  dependencies: string[];
  securityConsiderations: string[];
  humanReviewRequirements: string[];
  recommendedUseCases: string[];
}

export interface UserStory {
  role: string;
  want: string;
  benefit: string;
}

export interface ProcessRequirement {
  id: string;
  processId?: string;
  title: string;
  department: string;
  asIsDescription: string;
  toBeDescription: string;
  bottlenecks: string[];
  userStories: UserStory[];
  functionalRequirements: string[];
  assumptions: string[];
  dependencies: string[];
  acceptanceCriteria: string[];
  lastModified: string;
}

// ==========================================
// PHASE 4: REQUIREMENTS ENGINEERING & PROCESS MAPPING
// ==========================================

export type ProblemPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ProblemStatus =
  | 'Open'
  | 'Under Analysis'
  | 'Requirements Drafted'
  | 'Solution In-Progress'
  | 'Resolved';

export interface BusinessProblem {
  id: string; // e.g. "PRB-001"
  title: string;
  department: 'Flight Operations' | 'Ground Handling' | 'OCC & Dispatch' | 'Crew Planning' | 'Customer Experience';
  description: string;
  businessImpact: string;
  stakeholders: string[];
  currentProcess: string;
  desiredOutcome: string;
  priority: ProblemPriority;
  businessOwner: string;
  dependencies: string[];
  risks: string[];
  status: ProblemStatus;
  linkedOpportunityId?: string; // links to Phase 3 ProcessOpportunity
  createdAt: string;
  updatedAt: string;
}

export type ProcessNodeType =
  | 'start'
  | 'activity'
  | 'decision'
  | 'approval'
  | 'input_output'
  | 'handoff'
  | 'exception'
  | 'end';

export interface ProcessNode {
  id: string;
  label: string;
  type: ProcessNodeType;
  description: string;
  owner?: string;
  system?: string;
  durationMinutes?: number;
  isBottleneck?: boolean;
}

export interface ProcessEdge {
  from: string;
  to: string;
  label?: string;
  isException?: boolean;
}

export interface ProcessDiagram {
  id: string;
  problemId?: string;
  title: string;
  mode: 'As-Is' | 'To-Be';
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  mermaidCode: string;
  lastModified: string;
}

export type BottleneckCategory =
  | 'Manual Handoff'
  | 'Repeated Data Entry'
  | 'Processing Delay'
  | 'Approval Bottleneck'
  | 'Data Quality Issue'
  | 'Duplicate Task'
  | 'Missing Integration';

export interface OperationalBottleneck {
  id: string; // e.g. "BTN-001"
  problemId: string;
  title: string;
  category: BottleneckCategory;
  impactDescription: string;
  estimatedDelayMinutes: number;
  linkedOpportunityId?: string; // e.g. "OPP-101"
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  mitigationStrategy: string;
}

export type RequirementPriority = 'Must Have' | 'Should Have' | 'Could Have' | "Won't Have";
export type RequirementStatus = 'Draft' | 'Approved' | 'In Development' | 'Verified';

export interface BusinessRequirement {
  id: string; // e.g. "BR-001"
  problemId: string;
  title: string;
  description: string;
  businessRationale: string;
  stakeholder: string;
  priority: RequirementPriority;
  dependencies: string[];
  status: RequirementStatus;
  createdAt: string;
}

export interface FunctionalRequirement {
  id: string; // e.g. "FR-001"
  businessReqId: string; // links to BR-001
  title: string;
  systemBehavior: string;
  trigger: string;
  inputs: string[];
  expectedOutputs: string[];
  validationRules: string[];
  errorHandling: string;
  dependencies: string[];
  priority: RequirementPriority;
  status: RequirementStatus;
}

export type NFRCategory =
  | 'Security'
  | 'Performance'
  | 'Availability'
  | 'Usability'
  | 'Auditability'
  | 'Data Privacy';

export interface NonFunctionalRequirement {
  id: string; // e.g. "NFR-001"
  category: NFRCategory;
  title: string;
  specification: string;
  metricTarget: string;
  priority: RequirementPriority;
}

export interface StructuredUserStory {
  id: string; // e.g. "US-001"
  problemId?: string;
  functionalReqId?: string; // e.g. "FR-001"
  role: string;
  want: string;
  benefit: string;
  priority: RequirementPriority;
  dependencies: string[];
  status: 'Draft' | 'Approved' | 'Ready for Dev';
}

export interface AcceptanceCriteriaItem {
  id: string; // e.g. "AC-001"
  userStoryId: string;
  title: string;
  given: string;
  when: string;
  then: string;
  type: 'Positive' | 'Negative' | 'Boundary' | 'Permission' | 'Validation';
  requiresHumanApproval: boolean;
}

export type TestCaseResult = 'Pass' | 'Fail' | 'Not Tested' | 'Blocked';

export interface UATTestCase {
  id: string; // e.g. "TC-001"
  linkedReqId: string; // e.g. "FR-001" or "US-001"
  problemId?: string;
  scenario: string;
  preconditions: string[];
  testSteps: string[];
  expectedResult: string;
  actualResult: string;
  status: TestCaseResult;
  reviewer: string;
  comments: string;
  executedAt?: string;
}

export interface TraceabilityItem {
  problemId: string;
  problemTitle: string;
  businessReqId: string;
  functionalReqId: string;
  userStoryId: string;
  testCaseId: string;
  testStatus: TestCaseResult;
  coverageStatus: 'Fully Covered' | 'Partially Covered' | 'Uncovered';
}

export type AnalysisDocType =
  | 'BRD'
  | 'FRD'
  | 'Process_Report'
  | 'Improvement_Proposal'
  | 'User_Story_Catalogue'
  | 'UAT_Plan'
  | 'RTM';

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isError?: boolean;
  mode?: string;
  model?: string;
  structuredSections?: {
    fact?: string;
    interpretation?: string;
    recommendation?: string;
    nextInvestigation?: string;
  };
}

export interface CopilotConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: CopilotMessage[];
}

export type PromptCategory =
  | 'Operations Analytics'
  | 'Delay Investigation'
  | 'Business Process Improvement'
  | 'Management Reporting'
  | 'Automation Opportunities'
  | 'Data Quality Analysis'
  | 'Custom';

export interface PromptTemplate {
  id: string;
  category: PromptCategory;
  title: string;
  prompt: string;
  description: string;
  mode?: string;
  isCustom?: boolean;
}

export type ReportType =
  | 'daily_operations'
  | 'weekly_performance'
  | 'route_performance'
  | 'airline_comparison'
  | 'delay_investigation'
  | 'improvement_recommendations';

export interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  humanReviewer: string;
  reviewStatus: 'Draft' | 'Reviewed' | 'Approved' | 'Requires OCC Revision';
  executiveSummary: string;
  supportingMetrics: {
    totalFlights: number;
    otp: number;
    delayRate: number;
    cancellationRate: number;
    avgDelay: number;
    medianDelay: number;
    maxDelayStr: string;
  };
  keyObservations: string[];
  recommendations: string[];
  assumptionsAndLimitations: string[];
  markdownContent: string;
}

export interface AIEvaluation {
  id: string;
  timestamp: string;
  question: string;
  response: string;
  rating: 'Helpful' | 'Needs Improvement' | 'Incorrect';
  reviewerComments: string;
  factualAccuracyConfirmed: boolean;
  groundedMetricsChecked: string[];
  reviewerName: string;
}

export interface DelayInvestigationTarget {
  type: 'flight' | 'route';
  identifier: string; // e.g. "PH-331" or "JFK-ORD"
  records: FlightRecord[];
  totalFlights: number;
  delayedCount: number;
  avgDelay: number;
  maxDelay: number;
  observedCauses: string[];
  hasActualCauses: boolean;
}

export type NavigationTab =
  | 'overview'
  | 'operations'
  | 'copilot'
  | 'automation'
  | 'requirements'
  | 'tracker'
  | 'reports'
  | 'settings';

// ==========================================
// PHASE 5: SOLUTIONS PERFORMANCE TRACKER
// ==========================================

export interface SolutionPortfolioItem {
  id: string; // e.g. "SOL-101"
  opportunityId: string; // e.g. "OPP-101"
  problemId: string; // e.g. "PRB-001"
  bottleneckId?: string; // e.g. "BTN-001"
  requirementIds: string[]; // e.g. ["BR-001", "FR-001"]
  userStoryIds: string[]; // e.g. ["US-001", "US-002"]
  solutionTitle: string;
  department: string;
  solutionOwner: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: OpportunityStatus;
  stage: 'Discovery' | 'Architecture' | 'Build' | 'Testing' | 'Production';
  plannedCompletionDate: string;
  actualCompletionDate?: string;
  targetBenefitHours: number;
  measuredBenefitHours: number;
  targetMetric: string;
  latestResult: string;
  benefitTier: 'Estimated' | 'Simulated' | 'Demonstration Benchmark' | 'Measured';
}

export interface AutomationExecutionMetric {
  workflowId: string;
  workflowName: string;
  environment: 'Local Simulation' | 'Demonstration Benchmark' | 'Production Measured';
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  blockedRuns: number;
  avgDurationMs: number;
  manualTimeMinutes: number;
  automatedTimeSeconds: number;
  timeSavedPerRunMinutes: number;
  totalTimeSavedHours: number;
  successRate: number;
  lastExecution: string;
}

export interface BenefitsRealizationRecord {
  id: string;
  solutionId: string;
  solutionTitle: string;
  department: string;
  approvedBusinessCase: string;
  baselineManualMinutes: number;
  actualObservedMinutes: number;
  annualExecutionVolume: number;
  implementationCostUSD: number;
  annualRecurringMaintenanceUSD: number;
  laborHourlyRateUSD: number;
  estimatedAnnualLaborValueUSD: number;
  actualMeasuredLaborValueUSD: number;
  firstYearNetBenefitUSD: number;
  roiPercentage: number;
  paybackPeriodMonths: number;
  valueType: 'Estimated' | 'Simulated' | 'Demonstration Benchmark' | 'Measured';
  evidenceDescription: string;
  verifiedBy: string;
  verifiedDate?: string;
}

export interface AdoptionMetric {
  department: string;
  roleName: string;
  eligibleUsers: number;
  activeUsers: number;
  weeklyWorkflowsTriggered: number;
  repeatUsageRate: number;
  adoptionRate: number;
  monthlyTrend: { month: string; activeUsers: number; adoptionRate: number }[];
}

export interface OperationalImpactRecord {
  id: string;
  bottleneckId: string;
  bottleneckTitle: string;
  problemId: string;
  solutionId: string;
  baselineDelayMinutes: number;
  currentObservedDelayMinutes: number;
  delayReductionMinutes: number;
  delayReductionPercentage: number;
  resolutionStatus: 'Resolved' | 'Partially Mitigated' | 'Active Bottleneck';
  evidenceSource: string;
  reviewStatus:
    | 'Pending Audit'
    | 'Verified by Station Manager'
    | 'Verified by OCC'
    | 'Demonstration Benchmark Trial'
    | 'Verified in Staging Simulation';
  reviewedAt: string;
}

export interface ConfiguredKPI {
  id: string;
  name: string;
  description: string;
  formula: string;
  target: number;
  threshold: number;
  unit: string;
  department: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  dataSource: string;
  owner: string;
  currentValue: number;
  status: 'On Target' | 'At Risk' | 'Breached';
  reviewStatus: 'Active' | 'Under Review' | 'Draft';
}

export type PerformanceReportType =
  | 'EXECUTIVE_PERFORMANCE'
  | 'MONTHLY_SOLUTIONS_REVIEW'
  | 'AUTOMATION_PERFORMANCE'
  | 'BENEFITS_REALIZATION'
  | 'DEPARTMENT_PERFORMANCE'
  | 'OPERATIONAL_IMPROVEMENT';

