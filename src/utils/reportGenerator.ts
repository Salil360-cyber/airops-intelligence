import {
  GeneratedReport,
  ReportType,
  OperationalMetrics,
  ProcessOpportunity,
  DelayInvestigationTarget,
} from '../types';

export function generateReportDraft(
  type: ReportType,
  metrics: OperationalMetrics,
  opportunities: ProcessOpportunity[],
  investigationTarget?: DelayInvestigationTarget | null,
  reviewerName: string = 'Operations Duty Manager'
): GeneratedReport {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5) + ' UTC';

  const baseMetrics = {
    totalFlights: metrics.totalFlights,
    otp: metrics.onTimePerformance,
    delayRate: metrics.delayPercentage,
    cancellationRate: metrics.cancellationRate,
    avgDelay: metrics.avgDelayMinutes,
    medianDelay: metrics.medianDelayMinutes,
    maxDelayStr: `${metrics.maxDelay?.minutes || 0}m (${metrics.maxDelay?.flight_id || 'N/A'}, ${metrics.maxDelay?.route || 'N/A'})`,
  };

  let title = '';
  let executiveSummary = '';
  const keyObservations: string[] = [];
  const recommendations: string[] = [];
  const assumptionsAndLimitations: string[] = [];

  switch (type) {
    case 'daily_operations':
      title = `Daily Operations Summary – ${dateStr}`;
      executiveSummary = `During this operational cycle, the network processed ${metrics.totalFlights} scheduled movements (${metrics.totalFlights - metrics.cancelledFlights} operative, ${metrics.cancelledFlights} cancelled) delivering an On-Time Performance (OTP-15) of ${metrics.onTimePerformance}%. Average delay among delayed flights was ${metrics.avgDelayMinutes} minutes with a median delay of ${metrics.medianDelayMinutes} minutes.`;
      keyObservations.push(
        `Fleet Punctuality: ${metrics.onTimeFlights} flights arrived within standard 15-minute buffer; ${metrics.delayedFlights} flights experienced significant delay (>15m).`,
        `Cancellation Rate: ${metrics.cancellationRate}% (${metrics.cancelledFlights} flight cancellations recorded).`,
        `Outlier Incident: Maximum recorded single flight delay was ${metrics.maxDelay.minutes} minutes on ${metrics.maxDelay.flight_id} (${metrics.maxDelay.route}).`,
        metrics.hasDelayCauses
          ? `Primary Delay Driver: ${metrics.topDelayCauses[0]?.cause || 'N/A'} accounting for ${metrics.topDelayCauses[0]?.percentage || 0}% of delay incidents.`
          : 'Delay Root Cause Telemetry: Categorized delay reason telemetry is missing in active dataset; cause attribution pending.'
      );
      recommendations.push(
        'Implement 15-minute advance gate pushback notifications for high-risk departure banks.',
        'Review turn-around buffer allowances for chronically delayed corridors.',
        'Ensure ground handling crews are pre-positioned 20 minutes prior to scheduled in-block time.'
      );
      assumptionsAndLimitations.push(
        'All calculations reflect active operational dataset snapshot.',
        'OTP-15 standard applies (departures within 15 minutes of scheduled time classified as on-time).',
        'Recommendations require OCC flight dispatch validation before implementation.'
      );
      break;

    case 'weekly_performance':
      title = `Weekly Operational Performance Review – Week of ${dateStr}`;
      executiveSummary = `Weekly review covering ${metrics.totalFlights} flight legs across ${metrics.airports.allAirports.length} network airports. Network OTP achieved ${metrics.onTimePerformance}% with ${metrics.cancelledFlights} cancellations (${metrics.cancellationRate}% rate). Cumulative delay accumulation reached ${metrics.totalDelayMinutes.toLocaleString()} minutes.`;
      keyObservations.push(
        `Carrier OTP Variance: Punctuality across operating carriers ranged from ${metrics.airlineBreakdown[metrics.airlineBreakdown.length - 1]?.otp || 0}% to ${metrics.airlineBreakdown[0]?.otp || 0}%.`,
        `Corridor Bottlenecks: Top 3 delay-accumulating routes generated ${metrics.topDelayedRoutes.slice(0, 3).reduce((acc, r) => acc + r.avgDelay * r.delayedCount, 0)} minutes of delay.`,
        `Operational Predictability: Median delay of ${metrics.medianDelayMinutes}m indicates central operational tendency is more favorable than outlier-skewed mean (${metrics.avgDelayMinutes}m).`
      );
      recommendations.push(
        'Convene weekly Joint Operations Committee with station managers of top 3 delayed corridors.',
        'Audit minimum connect time (MCT) adherence at central hub stations.',
        'Prioritize digital automation opportunities targeting passenger disruption notifications.'
      );
      assumptionsAndLimitations.push(
        'Weekly aggregation assumes uniform flight schedule distribution across monitoring days.',
        'External ATC slot restrictions treated as exogenous constraints unless slot swaps were available.'
      );
      break;

    case 'route_performance':
      title = `Route Corridor Performance & Reliability Audit – ${dateStr}`;
      executiveSummary = `Comprehensive corridor audit evaluating route-level reliability. Top corridor bottlenecks and high-performing benchmark routes analyzed across ${metrics.topDelayedRoutes.length} city pairs.`;
      keyObservations.push(
        `Most Disrupted Corridor: ${metrics.topDelayedRoutes[0]?.route || 'N/A'} experienced ${metrics.topDelayedRoutes[0]?.delayedCount || 0} delayed legs with average delay of ${metrics.topDelayedRoutes[0]?.avgDelay || 0}m and route OTP of ${metrics.topDelayedRoutes[0]?.otp || 0}%.`,
        `Benchmark Corridor: ${metrics.bestRoutes[0]?.route || 'N/A'} achieved ${metrics.bestRoutes[0]?.otp || 0}% OTP across ${metrics.bestRoutes[0]?.totalFlights || 0} flights.`,
        `Long-Haul Disruption Exposure: Transcontinental and international long-haul legs disproportionately accounted for max delay incidents.`
      );
      recommendations.push(
        `Perform block time buffer review for corridor ${metrics.topDelayedRoutes[0]?.route || 'N/A'}.`,
        'Benchmark turnaround ground service equipment (GSE) workflows against top performing routes.',
        'Establish automated OCC slot monitoring for congested arrival airports.'
      );
      assumptionsAndLimitations.push(
        'Route OTP calculated as (Total Legs - Delayed Legs) / Total Legs on that specific corridor.',
        'Airport advisories and enroute airspace congestion are excluded from local ground logs.'
      );
      break;

    case 'airline_comparison':
      title = `Operating Carrier Reliability & OTP Benchmark – ${dateStr}`;
      executiveSummary = `Comparative reliability assessment across ${metrics.airlineBreakdown.length} operating carriers. Identifies punctuality disparities, cancellation exposure, and fleet turnaround efficiency.`;
      metrics.airlineBreakdown.forEach((a) => {
        keyObservations.push(
          `${a.airline}: ${a.total} flights, OTP-15: ${a.otp}%, Delayed: ${a.delayed}, Cancelled: ${a.cancelled}, Avg Delay: ${a.avgDelay}m.`
        );
      });
      recommendations.push(
        'Align ground turnaround SLAs across partner and codeshare operating carriers.',
        'Standardize delay code telemetry logging to enable root-cause attribution across all fleets.',
        'Review code-share schedule coordination to minimize missed passenger baggage connections.'
      );
      assumptionsAndLimitations.push(
        'Operating carriers evaluated solely on departure performance in the active dataset.',
        'Differences in fleet age and aircraft type composition not normalized.'
      );
      break;

    case 'delay_investigation':
      title = `Delay Investigation Briefing: ${investigationTarget ? `${investigationTarget.type.toUpperCase()} ${investigationTarget.identifier}` : 'Network Disruption Incident'} – ${dateStr}`;
      executiveSummary = investigationTarget
        ? `Dedicated investigation for ${investigationTarget.type} ${investigationTarget.identifier}. Records indicate ${investigationTarget.totalFlights} movements with ${investigationTarget.delayedCount} delayed legs (${Math.round((investigationTarget.delayedCount / Math.max(1, investigationTarget.totalFlights)) * 100)}% delay rate), an average delay of ${investigationTarget.avgDelay}m and maximum recorded delay of ${investigationTarget.maxDelay}m.`
        : `Network delay investigation reviewing maximum recorded delay of ${metrics.maxDelay.minutes} minutes on ${metrics.maxDelay.flight_id} (${metrics.maxDelay.route}).`;
      keyObservations.push(
        investigationTarget?.hasActualCauses
          ? `Observed Delay Causes: ${investigationTarget.observedCauses.join(', ')}.`
          : 'Telemetry Limitation: Categorized delay cause telemetry is not available for this record in current dataset.',
        `Severity Analysis: Maximum delay reached ${investigationTarget ? investigationTarget.maxDelay : metrics.maxDelay.minutes} minutes.`,
        'Downstream Propagation: High delay duration poses immediate crew rest and tail routing risks.'
      );
      recommendations.push(
        'Request raw flight departure event logs and ground handler timestamp records.',
        'Verify crew duty hour limits for downstream flight segments.',
        'Evaluate whether pre-emptive aircraft swap was feasible during turnaround.'
      );
      assumptionsAndLimitations.push(
        'Investigation is preliminary and subject to full flight recorder and dispatcher interview review.',
        'Missing delay cause codes must not be guessed or assumed.'
      );
      break;

    case 'improvement_recommendations':
      title = `Operational Improvement & Digital Automation Proposals – ${dateStr}`;
      executiveSummary = `Actionable business solutions portfolio identifying digital and automated process initiatives to recover operational hours and improve fleet OTP. Analyzed against ${opportunities.length} pipeline automation opportunities.`;
      keyObservations.push(
        `Current Annual Automation Potential: ${opportunities.reduce((acc, o) => acc + (o.estimatedHoursSavedAnnual || 0), 0).toLocaleString()} hours estimated savings across pipeline.`,
        `High Feasibility Initiatives: ${opportunities.filter((o) => o.automationFeasibility === 'High').length} opportunities ready for rapid sprint deployment.`,
        `Disruption Impact: Mitigating top 2 delay bottlenecks could reclaim an estimated 20-30% of preventable delay minutes.`
      );
      opportunities.slice(0, 3).forEach((opp) => {
        recommendations.push(
          `[${opp.solutionType}] ${opp.title}: Estimated ${opp.estimatedHoursSavedAnnual.toLocaleString()} annual hours savings for ${opp.department}.`
        );
      });
      assumptionsAndLimitations.push(
        'Hours savings calculations based on airline standard task frequency and touch-time models.',
        'Full software implementation requires IT architecture signoff and cyber security validation.'
      );
      break;
  }

  const markdownContent = `# ${title}
**Date:** ${dateStr} ${timeStr}  
**Human Reviewer:** ${reviewerName}  
**Review Status:** Draft (Pending OCC Review)  
**Security Classification:** Airline Internal Operational Data  

---

## 1. Executive Summary
${executiveSummary}

---

## 2. Supporting Operational Metrics
| Metric | Value | Benchmark / Target |
| :--- | :--- | :--- |
| Total Flights Analyzed | **${baseMetrics.totalFlights}** | Operational Snapshot |
| On-Time Performance (OTP-15) | **${baseMetrics.otp}%** | 80.0% Target |
| Delayed Flights (>15 min) | **${metrics.delayedFlights}** (${baseMetrics.delayRate}%) | < 15.0% |
| Cancelled Flights | **${metrics.cancelledFlights}** (${baseMetrics.cancellationRate}%) | < 1.5% |
| Average Delay Duration | **${baseMetrics.avgDelay} min** | < 40 min |
| Median Delay Duration | **${baseMetrics.medianDelay} min** | Benchmark Indicator |
| Maximum Recorded Delay | **${baseMetrics.maxDelayStr}** | Exception Event |

---

## 3. Key Operational Observations
${keyObservations.map((obs) => `- ${obs}`).join('\n')}

---

## 4. Actionable Business Recommendations
${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

---

## 5. Assumptions, Constraints & Limitations
${assumptionsAndLimitations.map((lim) => `- ${lim}`).join('\n')}

---

## 6. Responsible Governance & OCC Sign-Off
- **Human Verification Required:** Yes
- **Reviewer Signature:** ____________________________
- **Operations Control Center (OCC) Approval:** [ ] Approved  [ ] Revision Required
- *Disclaimer: Generated by AirOps Intelligence AI Platform. Not an automated flight dispatch release.*
`;

  return {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    title,
    generatedAt: `${dateStr} ${timeStr}`,
    humanReviewer: reviewerName,
    reviewStatus: 'Draft',
    executiveSummary,
    supportingMetrics: baseMetrics,
    keyObservations,
    recommendations,
    assumptionsAndLimitations,
    markdownContent,
  };
}

export function downloadReportMarkdown(report: GeneratedReport): void {
  const blob = new Blob([report.markdownContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${report.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
