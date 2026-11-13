import { ROICalculationInputs, ROICalculationResults } from '../types';

export const DEFAULT_ROI_INPUTS: ROICalculationInputs = {
  manualMinutesPerExecution: 30,
  automatedMinutesPerExecution: 3,
  executionsPerDay: 20,
  workingDaysPerYear: 365, // Airline operations run 365 days/year
  staffHourlyCost: 85, // Standard blended airline operations analyst/dispatcher rate ($/hr)
  oneTimeImplementationCost: 45000, // Software dev, configuration, testing ($)
  annualRecurringMaintenanceCost: 7500, // Cloud hosting, APIs, maintenance ($/yr)
};

/**
 * Deterministically calculates operational and financial ROI metrics for an airline automation initiative.
 *
 * Formulas:
 * 1. Annual Manual Hours = (Manual Minutes * Executions/Day * Working Days) / 60
 * 2. Annual Automated Hours = (Automated Minutes * Executions/Day * Working Days) / 60
 * 3. Annual Hours Saved = max(0, Annual Manual Hours - Annual Automated Hours)
 * 4. Annual Labour Value Saved = Annual Hours Saved * Staff Hourly Rate
 * 5. Estimated Net Annual Benefit (Year 2+) = Annual Labour Value Saved - Annual Recurring Maintenance Cost
 * 6. Estimated First-Year Net Benefit = Estimated Net Annual Benefit - One-Time Implementation Cost
 * 7. ROI % = (One-Time Cost > 0) ? ((Estimated Net Annual Benefit - One-Time Cost) / One-Time Cost) * 100 : 0
 * 8. Payback Period (Months) = (Estimated Net Annual Benefit > 0 && One-Time Cost > 0)
 *      ? (One-Time Cost / (Estimated Net Annual Benefit / 12)) : 0
 */
export function calculateAutomationROI(inputs: ROICalculationInputs): ROICalculationResults {
  const manualMins = Math.max(0, Number(inputs.manualMinutesPerExecution) || 0);
  const autoMins = Math.max(0, Number(inputs.automatedMinutesPerExecution) || 0);
  const execsPerDay = Math.max(0, Number(inputs.executionsPerDay) || 0);
  const daysPerYear = Math.max(0, Number(inputs.workingDaysPerYear) || 0);
  const hourlyCost = Math.max(0, Number(inputs.staffHourlyCost) || 0);
  const implCost = Math.max(0, Number(inputs.oneTimeImplementationCost) || 0);
  const recurringCost = Math.max(0, Number(inputs.annualRecurringMaintenanceCost) || 0);

  const annualManualHours = Math.round(((manualMins * execsPerDay * daysPerYear) / 60) * 10) / 10;
  const annualAutomatedHours = Math.round(((autoMins * execsPerDay * daysPerYear) / 60) * 10) / 10;
  const annualHoursSaved = Math.max(0, Math.round((annualManualHours - annualAutomatedHours) * 10) / 10);

  const annualLabourValueSaved = Math.round(annualHoursSaved * hourlyCost);
  const annualRecurringCost = Math.round(recurringCost);
  const estimatedNetAnnualBenefit = Math.round(annualLabourValueSaved - annualRecurringCost);
  const estimatedFirstYearNetBenefit = Math.round(estimatedNetAnnualBenefit - implCost);

  let roiPercentage = 0;
  if (implCost > 0) {
    roiPercentage = Math.round(((estimatedNetAnnualBenefit - implCost) / implCost) * 1000) / 10;
  } else if (estimatedNetAnnualBenefit > 0) {
    roiPercentage = 100; // Zero capital expenditure with positive operational benefit
  }

  let paybackPeriodMonths = 0;
  if (estimatedNetAnnualBenefit > 0 && implCost > 0) {
    const monthlyNetBenefit = estimatedNetAnnualBenefit / 12;
    paybackPeriodMonths = Math.round((implCost / monthlyNetBenefit) * 10) / 10;
  }

  return {
    annualManualHours,
    annualAutomatedHours,
    annualHoursSaved,
    annualLabourValueSaved,
    annualRecurringCost,
    estimatedNetAnnualBenefit,
    estimatedFirstYearNetBenefit,
    roiPercentage,
    paybackPeriodMonths,
  };
}
