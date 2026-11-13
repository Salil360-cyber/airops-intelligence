import { AIEvaluation, OperationalMetrics } from '../types';

const STORAGE_KEY_EVALUATIONS = 'airops_ai_evaluations_v2';

export interface EvaluationStats {
  totalEvaluated: number;
  helpfulCount: number;
  needsImprovementCount: number;
  incorrectCount: number;
  helpfulRate: number; // calculated from actual reviews
  factualAccuracyRate: number; // percentage confirmed factual
  reviewedCount: number;
}

export const BENCHMARK_TEST_CASES = [
  {
    id: 'tc-1',
    question: 'What is the current network On-Time Performance (OTP-15) and total flights analyzed?',
    metricKey: 'onTimePerformance',
    expectedFactPattern: 'Check exact OTP-15 percentage and total flights against active metrics.',
  },
  {
    id: 'tc-2',
    question: 'Which airline has the lowest On-Time Performance?',
    metricKey: 'airlineBreakdown',
    expectedFactPattern: 'Check lowest OTP airline from carrier breakdown.',
  },
  {
    id: 'tc-3',
    question: 'What was the maximum delay observed in the fleet?',
    metricKey: 'maxDelay',
    expectedFactPattern: 'Check flight ID, corridor, and maximum delay minutes.',
  },
  {
    id: 'tc-4',
    question: 'Are delay root-cause reasons recorded in this dataset?',
    metricKey: 'hasDelayCauses',
    expectedFactPattern: 'If hasDelayCauses is true, report top causes. If false, explicitly state cause telemetry is absent.',
  },
  {
    id: 'tc-5',
    question: 'What is the cancellation rate across the active flight schedule?',
    metricKey: 'cancellationRate',
    expectedFactPattern: 'Check cancellation rate percentage and count of cancelled flights.',
  },
];

export function getStoredEvaluations(): AIEvaluation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVALUATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load AI evaluations from localStorage', e);
  }
  return [];
}

export function saveStoredEvaluations(evals: AIEvaluation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EVALUATIONS, JSON.stringify(evals));
  } catch (e) {
    console.error('Failed to save AI evaluations to localStorage', e);
  }
}

export function calculateEvaluationStats(evaluations: AIEvaluation[]): EvaluationStats {
  const totalEvaluated = evaluations.length;
  if (totalEvaluated === 0) {
    return {
      totalEvaluated: 0,
      helpfulCount: 0,
      needsImprovementCount: 0,
      incorrectCount: 0,
      helpfulRate: 0,
      factualAccuracyRate: 0,
      reviewedCount: 0,
    };
  }

  const helpfulCount = evaluations.filter((e) => e.rating === 'Helpful').length;
  const needsImprovementCount = evaluations.filter((e) => e.rating === 'Needs Improvement').length;
  const incorrectCount = evaluations.filter((e) => e.rating === 'Incorrect').length;
  const factualConfirmedCount = evaluations.filter((e) => e.factualAccuracyConfirmed).length;

  const helpfulRate = Math.round((helpfulCount / totalEvaluated) * 1000) / 10;
  const factualAccuracyRate = Math.round((factualConfirmedCount / totalEvaluated) * 1000) / 10;

  return {
    totalEvaluated,
    helpfulCount,
    needsImprovementCount,
    incorrectCount,
    helpfulRate,
    factualAccuracyRate,
    reviewedCount: totalEvaluated,
  };
}

/**
 * Verify whether an AI response string contains the actual mathematical facts from metrics
 */
export function checkResponseFactualGroundedness(
  response: string,
  metrics: OperationalMetrics
): { confirmedFacts: string[]; unverifiedOrMissing: string[] } {
  const confirmedFacts: string[] = [];
  const unverifiedOrMissing: string[] = [];

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const containsToken = (val: string | number) => {
    const pattern = new RegExp(`(^|[^0-9.])${escapeRegex(String(val))}(?![0-9.])`);
    return pattern.test(response);
  };

  // Check total flights
  if (containsToken(metrics.totalFlights)) {
    confirmedFacts.push(`Total flights match: ${metrics.totalFlights}`);
  } else {
    unverifiedOrMissing.push(`Total flights (${metrics.totalFlights}) not explicitly cited`);
  }

  // Check OTP
  if (response.includes(`${metrics.onTimePerformance}%`) || containsToken(metrics.onTimePerformance)) {
    confirmedFacts.push(`Network OTP-15 match: ${metrics.onTimePerformance}%`);
  } else {
    unverifiedOrMissing.push(`Network OTP-15 (${metrics.onTimePerformance}%) not explicitly cited`);
  }

  // Check max delay
  if (metrics.maxDelay && metrics.maxDelay.minutes > 0) {
    if (containsToken(metrics.maxDelay.minutes) || (metrics.maxDelay.flight_id && response.includes(metrics.maxDelay.flight_id))) {
      confirmedFacts.push(`Max delay cited: ${metrics.maxDelay.minutes}m (${metrics.maxDelay.flight_id})`);
    }
  }

  // Check delay cause telemetry status
  if (!metrics.hasDelayCauses) {
    if (
      response.toLowerCase().includes('not available') ||
      response.toLowerCase().includes('missing') ||
      response.toLowerCase().includes('insufficient') ||
      response.toLowerCase().includes('no cause') ||
      response.toLowerCase().includes('not recorded')
    ) {
      confirmedFacts.push('Correctly acknowledged absence of delay cause telemetry');
    } else {
      unverifiedOrMissing.push('Failed to explicitly state that delay cause telemetry is missing');
    }
  }

  return { confirmedFacts, unverifiedOrMissing };
}
