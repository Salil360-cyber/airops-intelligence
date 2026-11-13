import {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowSimulationRun,
  WorkflowSimulationStepLog,
} from '../types';

export interface SimulationScenarioConfig {
  scenarioName: string;
  mockData: Record<string, any>;
  forceStepFailureId?: string; // For testing error recovery
  autoApprove: boolean;
}

export const PRESET_SIMULATION_SCENARIOS: SimulationScenarioConfig[] = [
  {
    scenarioName: 'Severe Disruption Event (Delay = 65m)',
    mockData: {
      flight_id: 'SK-102',
      airline: 'SkyStream Airlines',
      origin: 'LHR',
      destination: 'CDG',
      delay_minutes: 65,
      flight_status: 'DELAYED',
      delay_reason: 'ATC Flow',
      impacted_passengers: 142,
      remaining_duty_margin_mins: 28,
      unreconciled_bags_count: 0,
      discrepancy_minutes: 8,
      completeness_score: 95,
      ppbm_cleared: true,
      airworthiness_tag_active: true,
    },
    autoApprove: true,
  },
  {
    scenarioName: 'Nominal Operations (On-Time Flight)',
    mockData: {
      flight_id: 'SK-101',
      airline: 'SkyStream Airlines',
      origin: 'JFK',
      destination: 'LHR',
      delay_minutes: 5,
      flight_status: 'ON_TIME',
      delay_reason: 'None',
      impacted_passengers: 0,
      remaining_duty_margin_mins: 180,
      unreconciled_bags_count: 0,
      discrepancy_minutes: 1,
      completeness_score: 100,
      ppbm_cleared: true,
      airworthiness_tag_active: true,
    },
    autoApprove: true,
  },
  {
    scenarioName: 'Data Validation Failure (Missing Telemetry)',
    mockData: {
      flight_id: '',
      airline: 'SkyStream Airlines',
      origin: '',
      destination: 'FRA',
      delay_minutes: -1,
      completeness_score: 42,
      ppbm_cleared: false,
      airworthiness_tag_active: false,
    },
    forceStepFailureId: 'validation_fail',
    autoApprove: false,
  },
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createSeededRng(seedStr: string): () => number {
  let state = hashSeed(seedStr) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Executes a workflow in safe, local simulation mode.
 * Evaluates conditions, mocks integrations, and produces deterministic execution traces.
 */
export async function simulateWorkflowExecution(
  workflow: WorkflowDefinition,
  scenario: SimulationScenarioConfig = PRESET_SIMULATION_SCENARIOS[0],
  runNumber = 1
): Promise<WorkflowSimulationRun> {
  const rng = createSeededRng(`${workflow.id}:${runNumber}`);
  const runSuffix = Math.floor(rng() * 1679616).toString(36).padStart(4, '0');
  const runId = `sim-${workflow.id}-r${runNumber}-${runSuffix}`;
  const startedAt = new Date().toISOString();
  const stepLogs: WorkflowSimulationStepLog[] = [];

  let workflowFailed = false;
  let hasWarnings = false;
  const contextData = { ...scenario.mockData };

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const timestampStr = new Date().toISOString().split('T')[1].substring(0, 8);

    // If a prior step failed, subsequent steps are SKIPPED
    if (workflowFailed) {
      stepLogs.push({
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: 'SKIPPED',
        durationMs: 0,
        inputData: null,
        outputData: null,
        message: 'Step skipped due to upstream workflow failure.',
        timestamp: timestampStr,
      });
      continue;
    }

    // Deterministic simulated step latency seeded by workflow.id + runNumber
    const stepDuration = Math.round(15 + rng() * 35);

    try {
      // Evaluate by step type
      switch (step.type) {
        case 'Trigger': {
          stepLogs.push({
            stepId: step.id,
            stepName: step.name,
            stepType: step.type,
            status: 'SUCCESS',
            durationMs: stepDuration,
            inputData: { triggerEvent: step.config.triggerEvent || 'MANUAL_TRIGGER' },
            outputData: { receivedAt: new Date().toISOString(), payloadSize: '2.4 KB' },
            message: `[SIMULATED TRIGGER] Received event: ${step.config.triggerEvent || 'MANUAL_TRIGGER'} successfully.`,
            timestamp: timestampStr,
          });
          break;
        }

        case 'Data Input': {
          if (!contextData.flight_id && scenario.forceStepFailureId === 'validation_fail') {
            throw new Error(`Data input validation failed: Mandatory schema ${step.config.inputSchema || 'DEFAULT'} requires valid flight_id.`);
          }
          stepLogs.push({
            stepId: step.id,
            stepName: step.name,
            stepType: step.type,
            status: 'SUCCESS',
            durationMs: stepDuration,
            inputData: { query: step.config.inputSchema },
            outputData: { recordsExtracted: 1, flight_id: contextData.flight_id || 'SK-102' },
            message: `[SIMULATED INGESTION] Retrieved mock telemetry for schema ${step.config.inputSchema || 'STANDARD'}.`,
            timestamp: timestampStr,
          });
          break;
        }

        case 'Validation': {
          const completenessScore = contextData.completeness_score ?? 100;
          if (scenario.forceStepFailureId === 'validation_fail' || completenessScore < 50) {
            throw new Error(`Validation rule assertion failed: Completeness score (${completenessScore}%) is below mandatory threshold.`);
          }
          stepLogs.push({
            stepId: step.id,
            stepName: step.name,
            stepType: step.type,
            status: 'SUCCESS',
            durationMs: stepDuration,
            inputData: { rule: step.config.validationRule },
            outputData: { validationPassed: true, errors: [] },
            message: `[SIMULATED VALIDATION] Rule passed: "${step.config.validationRule || 'ALL_CHECKS_VALID'}".`,
            timestamp: timestampStr,
          });
          break;
        }

        case 'Condition': {
          const field = step.config.conditionField || 'delay_minutes';
          const op = step.config.conditionOperator || '>';
          const rawTarget = step.config.conditionValue;
          const parsedTarget = rawTarget !== undefined && rawTarget !== '' ? Number(rawTarget) : NaN;
          const targetVal = Number.isFinite(parsedTarget) ? parsedTarget : 15;
          const currentVal = Number(contextData[field] ?? 0);

          let conditionMet = false;
          if (op === '>') conditionMet = currentVal > targetVal;
          else if (op === '<') conditionMet = currentVal < targetVal;
          else if (op === '==') conditionMet = String(contextData[field]) === String(step.config.conditionValue);
          else if (op === '!=') conditionMet = String(contextData[field]) !== String(step.config.conditionValue);
          else if (op === 'contains') conditionMet = String(contextData[field] || '').includes(step.config.conditionValue || '');

          if (!conditionMet) {
            hasWarnings = true;
            stepLogs.push({
              stepId: step.id,
              stepName: step.name,
              stepType: step.type,
              status: 'SKIPPED',
              durationMs: stepDuration,
              inputData: { field, operator: op, targetVal, currentVal },
              outputData: { branchTaken: 'FALSE_BRANCH' },
              message: `[SIMULATED CONDITION] Condition (${field} ${op} ${targetVal}) evaluated to FALSE (Current: ${currentVal}). Branch exited.`,
              timestamp: timestampStr,
            });
          } else {
            stepLogs.push({
              stepId: step.id,
              stepName: step.name,
              stepType: step.type,
              status: 'SUCCESS',
              durationMs: stepDuration,
              inputData: { field, operator: op, targetVal, currentVal },
              outputData: { branchTaken: 'TRUE_BRANCH' },
              message: `[SIMULATED CONDITION] Condition (${field} ${op} ${targetVal}) evaluated to TRUE (Current: ${currentVal}). Continuing automated pipeline.`,
              timestamp: timestampStr,
            });
          }
          break;
        }

        case 'Approval': {
          const role = step.config.approvalRole || 'OCC Duty Dispatcher';
          if (!scenario.autoApprove) {
            stepLogs.push({
              stepId: step.id,
              stepName: step.name,
              stepType: step.type,
              status: 'WAITING_APPROVAL',
              durationMs: stepDuration,
              inputData: { requiredRole: role },
              outputData: { approvalStatus: 'PENDING_HUMAN_SIGN_OFF' },
              message: `[SIMULATED APPROVAL] Waiting for manual sign-off from designated role: ${role}.`,
              timestamp: timestampStr,
            });
          } else {
            stepLogs.push({
              stepId: step.id,
              stepName: step.name,
              stepType: step.type,
              status: 'SUCCESS',
              durationMs: stepDuration,
              inputData: { requiredRole: role },
              outputData: { approvedBy: `Simulated_${role}`, authorizedAt: new Date().toISOString() },
              message: `[SIMULATED APPROVAL] Auto-approved in simulation mode for role: ${role}.`,
              timestamp: timestampStr,
            });
          }
          break;
        }

        case 'Notification': {
          const channel = step.config.notificationChannel || 'Email';
          const recipient = step.config.notificationRecipient || 'OPERATIONS_CONTROL';
          stepLogs.push({
            stepId: step.id,
            stepName: step.name,
            stepType: step.type,
            status: 'SUCCESS',
            durationMs: stepDuration,
            inputData: { channel, recipient },
            outputData: {
              deliveryStatus: 'SIMULATED_DELIVERED',
              messageId: `msg-${Math.floor(rng() * 1679616).toString(36).padStart(4, '0')}`,
              deliveredTo: recipient,
            },
            message: `[SIMULATED NOTIFICATION] Mock dispatch sent via ${channel} to ${recipient}. (Zero external outbound traffic).`,
            timestamp: timestampStr,
          });
          break;
        }

        case 'Data Transformation': {
          const trans = step.config.transformationType || 'STANDARDIZE_TIMESTAMPS';
          stepLogs.push({
            stepId: step.id,
            stepName: step.name,
            stepType: step.type,
            status: 'SUCCESS',
            durationMs: stepDuration,
            inputData: { transformation: trans },
            outputData: { normalizedRecords: 1, deltaCalculated: true },
            message: `[SIMULATED TRANSFORMATION] Applied transformation rule: "${trans}".`,
            timestamp: timestampStr,
          });
          break;
        }

        case 'Report Generation': {
          const tmpl = step.config.reportTemplate || 'STANDARD_OPS_SUMMARY';
          stepLogs.push({
            stepId: step.id,
            stepName: step.name,
            stepType: step.type,
            status: 'SUCCESS',
            durationMs: stepDuration,
            inputData: { template: tmpl },
            outputData: {
              generatedDocumentId: `DOC-${Math.floor(1000 + rng() * 9000)}`,
              format: 'PDF_AND_MARKDOWN',
              byteSize: '48.2 KB',
            },
            message: `[SIMULATED REPORT] Generated draft executive document using template "${tmpl}".`,
            timestamp: timestampStr,
          });
          break;
        }

        case 'End': {
          stepLogs.push({
            stepId: step.id,
            stepName: step.name,
            stepType: step.type,
            status: 'SUCCESS',
            durationMs: stepDuration,
            inputData: { status: 'CLOSING_SESSION' },
            outputData: { workflowExecutionCompleted: true },
            message: '[SIMULATED COMPLETION] Workflow pipeline execution completed successfully.',
            timestamp: timestampStr,
          });
          break;
        }
      }
    } catch (err: any) {
      workflowFailed = true;
      stepLogs.push({
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
        status: 'FAILED',
        durationMs: stepDuration,
        inputData: contextData,
        outputData: { error: err.message },
        message: `[SIMULATED STEP FAILURE] ${err.message}`,
        timestamp: timestampStr,
      });
    }
  }

  const finishedAt = new Date().toISOString();
  const totalDurationMs = stepLogs.reduce((sum, log) => sum + log.durationMs, 0);

  let runStatus: WorkflowSimulationRun['status'] = 'COMPLETED_SUCCESS';
  if (workflowFailed) runStatus = 'FAILED';
  else if (hasWarnings) runStatus = 'COMPLETED_WITH_WARNINGS';

  return {
    id: runId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    startedAt,
    finishedAt,
    totalDurationMs,
    status: runStatus,
    stepLogs,
    simulatedScenario: scenario.scenarioName,
  };
}
