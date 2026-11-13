import {
  PerformanceReportType,
  SolutionPortfolioItem,
  AutomationExecutionMetric,
  BenefitsRealizationRecord,
  AdoptionMetric,
  OperationalImpactRecord,
  ConfiguredKPI,
} from '../types';
import { computeExecutiveSummaryMetrics, INITIAL_PORTFOLIO } from './performanceStorage';
import { INITIAL_OPPORTUNITIES } from './storage';

export interface PerformanceReportMetadata {
  title: string;
  reportType: PerformanceReportType;
  generatedDate: string;
  reviewer: string;
  classification: string;
}

export function generatePerformanceReport(
  type: PerformanceReportType,
  data: {
    portfolio: SolutionPortfolioItem[];
    executions: AutomationExecutionMetric[];
    benefits: BenefitsRealizationRecord[];
    adoption: AdoptionMetric[];
    impact: OperationalImpactRecord[];
    kpis: ConfiguredKPI[];
    totalProblemsCount?: number;
  },
  metadata?: Partial<PerformanceReportMetadata>
): string {
  const { portfolio, executions, benefits, adoption, impact, kpis } = data;
  const metrics = computeExecutiveSummaryMetrics(
    portfolio,
    executions,
    benefits,
    adoption,
    impact,
    data.totalProblemsCount || 4
  );

  const baselineEstimatedHours = INITIAL_OPPORTUNITIES.reduce(
    (acc, o) => acc + (o.estimatedHoursSavedAnnual || 0),
    0
  );
  const sol104TargetHours =
    INITIAL_PORTFOLIO.find((s) => s.id === 'SOL-104')?.targetBenefitHours ?? 1373;

  const reportDate = metadata?.generatedDate || new Date().toISOString().split('T')[0];
  const reviewer = metadata?.reviewer || 'Salil Gokhale (Business Analyst (Portfolio Demo)) & Demo Reviewer';
  const classification = metadata?.classification || 'Executive Steering Committee - Portfolio Demonstration';

  switch (type) {
    case 'EXECUTIVE_PERFORMANCE': {
      return `# EXECUTIVE SOLUTIONS PERFORMANCE AUDIT & GOVERNANCE REPORT
**Date:** ${reportDate} | **Classification:** ${classification}  
**Lead Auditor / Reviewer:** ${reviewer}  
**Standard:** AeroSolutions Performance & Benefit Realization Standard  

---

## 1. STRATEGIC KPI SUMMARY DASHBOARD
| Strategic Metric | Current Value | Benchmark Target | Status | Value Tier Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Total Registered Problems** | ${metrics.totalProblems} | 6 active problems | Complete | Catalogued in PRB Registry |
| **Automation Pipeline** | ${metrics.totalOpportunities} opportunities | 6 high-impact areas | Complete | 100% Gated |
| **Approved / Active Solutions** | ${metrics.approvedSolutions} of ${metrics.totalOpportunities} | 4 solutions | In Progress | Ops Steering Sanctioned |
| **Implemented Solutions** | ${metrics.implementedSolutions} | 1 solution | Staged Trial | Implemented (Demonstration Benchmark) |
| **Workflow Success Rate** | **${metrics.workflowSuccessRate}%** | >= 98.0% | ${metrics.workflowSuccessRate >= 98 ? 'On Target' : 'At Risk'} | Benchmark & Staging Telemetry |
| **Total Estimated Hours Saved** | ${metrics.totalEstimatedHours.toLocaleString()} hrs/yr | ${baselineEstimatedHours.toLocaleString()} hrs/yr | Baseline | **Estimated (Feasibility Formula)** |
| **Demonstration Benchmark Hours** | **${metrics.totalDemonstrationHours.toLocaleString()} hrs/yr** | ${sol104TargetHours.toLocaleString()} hrs/yr (SOL-104) | **Benchmark** | **Demonstration Benchmark (Staged Trial)** |
| **Live Production Measured Hours** | **${metrics.totalMeasuredHours.toLocaleString()} hrs/yr** | TBD Post-Live Gate | Pending Live | **0 hrs (Live Production Telemetry Pending)** |
| **Benefits Realization Rate** | **${metrics.benefitsRealizationRate}%** | >= 80.0% | **On Target** | Benchmark vs Approved Business Case |
| **Operational Staff Adoption** | **${metrics.overallAdoptionRate}%** | >= 75.0% | At Risk (74.3%) | Active / Eligible Roster Logs |
| **Bottleneck Resolution Rate** | **${metrics.bottleneckResolutionRate}%** | >= 50.0% | Active (33.3%) | Resolved / Total Bottlenecks |

> **IMPORTANT VALUE TIER DISCLOSURE & DATA INTEGRITY NOTICE:**
> - **Estimated Savings:** Formula-derived potential based on task frequency and baseline time.
> - **Simulated Savings:** Measured during workflow sandbox execution in staging.
> - **Demonstration Benchmark:** Simulated 3-station staging trial scenario benchmark initialized for prototype demonstration (WF-104, SOL-104).
> - **Live Production Measured:** Requires direct integration with airport ramp hardware and production telematics (currently 0 live production connections).
> *Note: Capacity hours saved represents operational capacity reclaimed, not confirmed cash reductions.*

---

## 2. SOLUTION PORTFOLIO STATUS
${portfolio
  .map(
    (s, idx) => `### [${s.id}] ${s.solutionTitle}
- **Department:** ${s.department} | **Owner:** ${s.solutionOwner}
- **Pipeline Status:** **${s.status}** | **Stage:** ${s.stage}
- **Linked Problem:** \`${s.problemId}\` | **Opportunity:** \`${s.opportunityId}\` | **Bottleneck:** \`${s.bottleneckId || 'N/A'}\`
- **Target Hours:** ${s.targetBenefitHours.toLocaleString()} hrs/yr | **Measured Hours:** ${s.measuredBenefitHours.toLocaleString()} hrs/yr
- **Value Tier:** **${s.benefitTier}**
- **Performance Target:** ${s.targetMetric}
- **Latest Performance Result:** ${s.latestResult}`
  )
  .join('\n\n')}

---

## 3. AUDIT SIGN-OFF & EXECUTIVE ATTESTATION
- **Lead Solutions QA Engineer:** ________________________________ Date: ___________
- **Head of Operations Control (OCC):** __________________________ Date: ___________
- **Vice President of Flight Operations:** ______________________ Date: ___________
`;
    }

    case 'MONTHLY_SOLUTIONS_REVIEW': {
      return `# MONTHLY SOLUTIONS PERFORMANCE REVIEW
**Audit Period:** Current Calendar Month | **Generated:** ${reportDate}  
**Review Body:** Airline Digital Solutions Steering Committee  

---

## 1. MONTHLY OPERATIONAL SUMMARY
- **Total Workflow Executions Recorded:** ${metrics.totalExecutions.toLocaleString()} runs
- **Demonstration Benchmark Executions (WF-104):** ${metrics.demonstrationExecutions.toLocaleString()} runs (Simulated Staged Benchmark)
- **Simulated Test Executions:** ${metrics.simulatedExecutions.toLocaleString()} runs
- **Live Production Executions:** ${metrics.productionExecutions.toLocaleString()} runs (0 in current prototype)
- **Aggregated Workflow Success Rate:** ${metrics.workflowSuccessRate}%
- **Active Operational Users:** ${metrics.totalActiveUsers} of ${metrics.totalEligibleUsers} eligible staff (${metrics.overallAdoptionRate}%)

---

## 2. DEPARTMENTAL ADOPTION BREAKDOWN
| Department | Primary Operational Role | Eligible Users | Active Users | Weekly Trigger Volume | Repeat Usage Rate | Adoption Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${adoption
  .map(
    (a) =>
      `| **${a.department}** | ${a.roleName} | ${a.eligibleUsers} | ${a.activeUsers} | ${a.weeklyWorkflowsTriggered}/wk | ${a.repeatUsageRate}% | **${a.adoptionRate}%** |`
  )
  .join('\n')}

---

## 3. NEXT-STAGE GATES & ACTION ITEMS
1. Move **SOL-102 (OCC Telemetry ETL)** from Staging to Production after 14 consecutive days of 05:00 UTC automated delivery.
2. Complete reservation booking sandbox validation for **SOL-101 (Disruption SMS)** to transition from Architecture to Build stage.
3. Conduct station manager user adoption training for Ground Handling outstations.
`;
    }

    case 'AUTOMATION_PERFORMANCE': {
      return `# AUTOMATION WORKFLOW PERFORMANCE & EXECUTION AUDIT
**Environment Audit:** Demonstration Benchmark vs Local Staging Simulation  
**Audit Date:** ${reportDate}  

---

## 1. WORKFLOW TELEMETRY BREAKDOWN
${executions
  .map(
    (e) => `### [${e.workflowId}] ${e.workflowName}
- **Environment:** **${e.environment}**
- **Execution Volume:** ${e.totalRuns.toLocaleString()} runs (${e.successfulRuns.toLocaleString()} success, ${e.failedRuns} failed, ${e.blockedRuns} blocked)
- **Success Rate:** **${e.successRate}%**
- **Average Automated Latency:** ${e.avgDurationMs} ms
- **Baseline Manual Execution Time:** ${e.manualTimeMinutes} minutes
- **Net Time Saved per Run:** ${e.timeSavedPerRunMinutes.toFixed(1)} minutes
- **Accumulated Time Saved:** **${e.totalTimeSavedHours.toLocaleString()} hours**
- **Last Observed Execution:** ${e.lastExecution}
`
  )
  .join('\n')}

---

## 2. SIMULATION VS BENCHMARK DISCLOSURE
- Workflows marked **Demonstration Benchmark** reflect simulated 3-station trial scenario data seeded for prototype demonstration; they are not live airline production feeds.
- Workflows marked **Local Simulation** represent staging sandbox runs evaluated using deterministic rule sets.
- Workflows marked **Production Measured** require connection to verified airline operational data feeds (currently 0 live production connections).
`;
    }

    case 'BENEFITS_REALIZATION': {
      return `# BENEFITS REALIZATION & FINANCIAL ROI ANALYSIS
**Standard:** Enterprise Investment Evaluation Framework  
**Date:** ${reportDate} | **Hourly Labor Cost Baseline:** $85.00 / Hour  

---

## 1. FINANCIAL SUMMARY & PORTFOLIO ROI
- **Total Projected Annual Labor Value (Estimated):** $${metrics.totalLaborValueEstimatedUSD.toLocaleString()}
- **Total Demonstration Benchmark Labor Value:** $${metrics.totalLaborValueDemonstratedUSD.toLocaleString()} (Simulated Staged Benchmark)
- **Total Live Production Labor Value:** $${metrics.totalLaborValueMeasuredUSD.toLocaleString()} (Pending Live Gate)
- **Portfolio First-Year Net ROI:** **${metrics.portfolioROI}%**

---

## 2. SOLUTION-LEVEL BENEFIT AUDIT
${benefits
  .map(
    (b) => `### [${b.solutionId}] ${b.solutionTitle}
- **Department:** ${b.department} | **Value Tier:** **${b.valueType}**
- **Approved Business Case:** ${b.approvedBusinessCase}
- **Execution Baseline:** ${b.baselineManualMinutes}m manual &rarr; ${b.actualObservedMinutes}m observed
- **Annual Volume:** ${b.annualExecutionVolume.toLocaleString()} executions/yr
- **CapEx Implementation:** $${b.implementationCostUSD.toLocaleString()} | **Annual Maintenance:** $${b.annualRecurringMaintenanceUSD.toLocaleString()}
- **Annual Labor Value (Capacity):** $${(b.valueType === 'Measured' || b.valueType === 'Demonstration Benchmark' ? b.actualMeasuredLaborValueUSD : b.estimatedAnnualLaborValueUSD).toLocaleString()}
- **First-Year Net Benefit:** $${b.firstYearNetBenefitUSD.toLocaleString()}
- **Calculated ROI:** **${b.roiPercentage}%** | **Payback Period:** ${b.paybackPeriodMonths} months
- **Supporting Evidence:** ${b.evidenceDescription}
- **Audit Verification:** ${b.verifiedBy} (${b.verifiedDate || 'Pending'})
`
  )
  .join('\n')}
`;
    }

    case 'DEPARTMENT_PERFORMANCE': {
      return `# DEPARTMENTAL SOLUTIONS PERFORMANCE REPORT
**Date:** ${reportDate}  

---

## 1. PERFORMANCE BY OPERATIONAL DOMAIN
${adoption
  .map((a) => {
    const deptSolutions = portfolio.filter((p) => p.department === a.department);
    return `### Department: ${a.department}
- **Primary Operational User Group:** ${a.roleName}
- **Adoption Rate:** ${a.adoptionRate}% (${a.activeUsers} active / ${a.eligibleUsers} eligible)
- **Weekly Trigger Volume:** ${a.weeklyWorkflowsTriggered} workflows/week
- **Active Digital Solutions:** ${deptSolutions.map((s) => `\`${s.id}\` (${s.status})`).join(', ') || 'None'}
`;
  })
  .join('\n')}
`;
    }

    case 'OPERATIONAL_IMPROVEMENT': {
      return `# OPERATIONAL IMPACT & BOTTLENECK REMEDIATION REPORT
**Date:** ${reportDate} | **Source:** Phase 4 Bottleneck Registry & Phase 5 Impact Audit  

---

## 1. BOTTLENECK RESOLUTION AUDIT TABLE
| Bottleneck ID | Title | Problem ID | Linked Solution | Baseline Delay | Observed Delay | Delay Reduction | Resolution Status | Review Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${impact
  .map(
    (i) =>
      `| **${i.bottleneckId}** | ${i.bottleneckTitle} | ${i.problemId} | ${i.solutionId} | ${i.baselineDelayMinutes}m | ${i.currentObservedDelayMinutes}m | -${i.delayReductionMinutes}m (${i.delayReductionPercentage}%) | **${i.resolutionStatus}** | ${i.reviewStatus} |`
  )
  .join('\n')}

---

## 2. CAUSALITY DISCLOSURE
Delay reductions recorded for resolved bottlenecks are based on empirical timestamp logs compared against historical pre-automation baselines.
No causal claim is asserted for bottlenecks with status *Pending Audit*.
`;
    }

    default:
      return '# PERFORMANCE REPORT';
  }
}
