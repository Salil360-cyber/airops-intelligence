import React, { useState } from 'react';
import {
  Files,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  FileText,
  BarChart2,
  Workflow,
  CheckCircle,
} from 'lucide-react';
import { OperationalMetrics, ProcessOpportunity, ProcessRequirement } from '../../types';

interface DocumentationReportsProps {
  metrics: OperationalMetrics;
  opportunities: ProcessOpportunity[];
  requirements: ProcessRequirement[];
  otpThreshold?: number;
}

export const DocumentationReports: React.FC<DocumentationReportsProps> = ({
  metrics,
  opportunities,
  requirements,
  otpThreshold = 15,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<
    'EXECUTIVE_AUDIT' | 'AUTOMATION_ROADMAP' | 'REQUIREMENTS_DIGEST'
  >('EXECUTIVE_AUDIT');
  const [copied, setCopied] = useState(false);

  // Generate Report Contents deterministically
  const totalHours = opportunities.reduce(
    (acc, o) => acc + (o.estimatedHoursSavedAnnual || 0),
    0
  );

  const executiveAuditContent = `# AIROPS EXECUTIVE OPERATIONAL AUDIT & ON-TIME PERFORMANCE (OTP) BRIEF
Generated: ${new Date().toISOString().split('T')[0]} | AirOps Intelligence Engine
Classification: Portfolio Demo - Synthetic Sample Data

--------------------------------------------------------------------------------

1. FLEET OPERATIONAL STATUS SUMMARY
- Total Flights Analyzed: ${metrics.totalFlights} legs
- On-Time Performance (OTP-${otpThreshold}): ${metrics.onTimePerformance}% (${otpThreshold}-Minute Departure Buffer)
- Delayed Flights (>${otpThreshold} min): ${metrics.delayedFlights} (${metrics.delayPercentage}% of operated flights)
- Cancelled Flights: ${metrics.cancelledFlights} (${metrics.totalFlights > 0 ? ((metrics.cancelledFlights / metrics.totalFlights) * 100).toFixed(1) : 0}% rate)
- Total Accumulated Delay: ${metrics.totalDelayMinutes.toLocaleString()} minutes
- Average Delay Duration: ${metrics.avgDelayMinutes} minutes per delayed flight

2. PRIMARY OPERATIONAL FRICTION DRIVERS
${metrics.hasDelayCauses && metrics.topDelayCauses.length > 0
  ? metrics.topDelayCauses
      .slice(0, 5)
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.cause}: ${c.count} flights affected (${c.percentage}%), accumulating ${c.totalMinutes} minutes.`
      )
      .join('\n')
  : 'Delay root-cause telemetry is not recorded in the active dataset.'}

3. TOP CONGESTED & DELAY-PRONE CORRIDORS
${metrics.topDelayedRoutes
  .slice(0, 5)
  .map(
    (r, idx) =>
      `${idx + 1}. Route ${r.route} (${r.origin} -> ${r.destination}): ${r.delayedCount} of ${r.totalFlights} delayed. Avg delay: ${r.avgDelay} min. OTP: ${r.otp}%.`
  )
  .join('\n')}

4. AIRLINE FLEET BENCHMARKS
${metrics.airlineBreakdown
  .map(
    (a) =>
      `- ${a.airline}: ${a.total} flights operated | OTP: ${a.otp}% | Delayed: ${a.delayed} | Cancelled: ${a.cancelled} | Avg Delay: ${a.avgDelay}m`
  )
  .join('\n')}

5. STRATEGIC DIGITAL REMEDIATION RECOMMENDATIONS
- Immediate OCC event integration to mitigate ATC Flow delays through automated buffer recalculation.
- Rollout of Turnaround Baggage Hold Reconciliation RPA to reduce widebody departure friction.
- Deploy Passenger Disruption Automated Re-accommodation engine to eliminate station gate queues.
`;

  const automationRoadmapContent = `# AIRLINE PROCESS AUTOMATION & DIGITAL WORKFLOW ROADMAP
Generated: ${new Date().toISOString().split('T')[0]} | Total Opportunities: ${opportunities.length}
Projected Annual Operational Savings: ${totalHours.toLocaleString()} Hours

--------------------------------------------------------------------------------

1. PIPELINE OVERVIEW
- Opportunities Identified: ${opportunities.filter((o) => o.status === 'Identified').length}
- Under Governance Review: ${opportunities.filter((o) => o.status === 'Under Review').length}
- Approved for Implementation: ${opportunities.filter((o) => o.status === 'Approved').length}
- In Active Engineering: ${opportunities.filter((o) => o.status === 'In Progress').length}
- Implemented (Stage 5 / Benchmark): ${opportunities.filter((o) => o.status === 'Implemented').length}

2. DETAILED OPPORTUNITY REGISTER
${opportunities
  .map(
    (o, idx) => `
### [${o.id}] ${o.title}
- Department: ${o.department}
- Solution Architecture: ${o.solutionType}
- Feasibility: ${o.automationFeasibility}
- Pipeline Status: ${o.status}
- Formula: (${o.frequencyPerWeek} tasks/wk * ${o.timeSpentPerTaskMinutes} min * 52 / 60) * Feasibility Factor
- Projected Impact: ${o.estimatedHoursSavedAnnual.toLocaleString()} Hours Saved / Year
- As-Is Pain Point: ${o.manualTaskDescription}
- Proposed Solution: ${o.proposedSolution}
`
  )
  .join('\n')}
`;

  const requirementsDigestContent = `# AIRLINE BUSINESS REQUIREMENTS COMPENDIUM
Generated: ${new Date().toISOString().split('T')[0]} | AirOps Enterprise Architecture

--------------------------------------------------------------------------------

${requirements
  .map(
    (r, idx) => `
## SPECIFICATION ${idx + 1}: ${r.title} (${r.id})
**Domain:** ${r.department} | **Last Modified:** ${r.lastModified}

### As-Is Operational Baseline:
${r.asIsDescription}

### To-Be Target State:
${r.toBeDescription}

### Key User Stories:
${r.userStories.map((s) => `- As a ${s.role}, I want ${s.want}, so that ${s.benefit}.`).join('\n')}

### Core Functional Requirements:
${r.functionalRequirements.map((fr) => `- ${fr}`).join('\n')}

### Dependencies & Acceptance Criteria:
${r.acceptanceCriteria.map((ac) => `- ${ac}`).join('\n')}
`
  )
  .join('\n')}
`;

  const getActiveContent = () => {
    switch (selectedReportType) {
      case 'EXECUTIVE_AUDIT':
        return executiveAuditContent;
      case 'AUTOMATION_ROADMAP':
        return automationRoadmapContent;
      case 'REQUIREMENTS_DIGEST':
        return requirementsDigestContent;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = getActiveContent();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReportType}_${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Files className="w-4 h-4 text-blue-400" />
            <span>Executive Documentation & Operational Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-synthesizes executive audits, automation pipeline roadmaps, and requirements packages from active telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setSelectedReportType('EXECUTIVE_AUDIT')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedReportType === 'EXECUTIVE_AUDIT'
              ? 'bg-blue-950/20 border-blue-500/50 shadow-md'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <span>Executive Operational Audit</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Network OTP-{otpThreshold}, root cause breakdown, and congested corridors.
          </p>
        </button>

        <button
          onClick={() => setSelectedReportType('AUTOMATION_ROADMAP')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedReportType === 'AUTOMATION_ROADMAP'
              ? 'bg-blue-950/20 border-blue-500/50 shadow-md'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Workflow className="w-4 h-4 text-purple-400" />
            <span>Process Automation Roadmap</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pipeline progress, transparent formula calculations, and {totalHours.toLocaleString()} hrs projected impact.
          </p>
        </button>

        <button
          onClick={() => setSelectedReportType('REQUIREMENTS_DIGEST')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedReportType === 'REQUIREMENTS_DIGEST'
              ? 'bg-blue-950/20 border-blue-500/50 shadow-md'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Requirements Compendium</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Structured User Stories, Functional Requirements, and Acceptance Criteria.
          </p>
        </button>
      </div>

      {/* Report Document Canvas */}
      <div className="p-8 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap overflow-x-auto shadow-2xl">
        {getActiveContent()}
      </div>
    </div>
  );
};
