import { PromptTemplate, PromptCategory } from '../types';

const STORAGE_KEY_PROMPTS = 'airops_prompt_library_v2';

export const DEFAULT_PROMPTS: PromptTemplate[] = [
  // 1. Operations Analytics
  {
    id: 'p-oa-1',
    category: 'Operations Analytics',
    title: 'Why is Network OTP Low?',
    description: 'Diagnose the mathematical drivers lowering the current network On-Time Performance (OTP-15).',
    prompt: 'Why is network OTP currently below target? Compare on-time flights versus delayed and cancelled operations, examine average delay severity, and isolate the primary network bottleneck.',
    mode: 'GENERAL',
  },
  {
    id: 'p-oa-2',
    category: 'Operations Analytics',
    title: 'Which Routes Need Immediate Investigation?',
    description: 'Identify the worst-performing flight corridors based on delay percentage and average minutes.',
    prompt: 'Which routes in the active dataset need immediate investigation? Rank the top delay-prone corridors by delay frequency and minutes, and contrast them with our best-performing routes.',
    mode: 'GENERAL',
  },
  {
    id: 'p-oa-3',
    category: 'Operations Analytics',
    title: 'Carrier OTP & Delay Percentage Comparison',
    description: 'Compare punctuality and cancellation rates across operating carriers in the fleet.',
    prompt: 'Which airline has the highest delay percentage and how does their OTP compare across the network? Identify any operational discrepancies between carriers.',
    mode: 'GENERAL',
  },

  // 2. Delay Investigation
  {
    id: 'p-di-1',
    category: 'Delay Investigation',
    title: 'Analyze Root Cause Delay Drivers',
    description: 'Break down delays by operational driver (ATC, Weather, Baggage, Maintenance, Crew).',
    prompt: 'What are the main operational performance issues causing delays in our dataset? If actual delay cause codes exist, quantify their impact. If cause telemetry is missing, clearly state that limitation without guessing.',
    mode: 'GENERAL',
  },
  {
    id: 'p-di-2',
    category: 'Delay Investigation',
    title: 'Maximum Outlier Delay Investigation',
    description: 'Examine the worst single-flight delay incident and identify required telemetry.',
    prompt: 'Examine our maximum recorded delay in the fleet. What flight was affected, what was the duration and route, and what additional data (inbound aircraft turn, airport advisories, crew duty logs) must OCC gather to close the inquiry?',
    mode: 'GENERAL',
  },

  // 3. Business Process Improvement
  {
    id: 'p-bpi-1',
    category: 'Business Process Improvement',
    title: 'What Improvement Opportunities Can Be Considered?',
    description: 'Formulate practical digital workflows to mitigate our most severe delay corridors.',
    prompt: 'What process improvement opportunities can be considered to mitigate our primary operational friction points? Suggest targeted digital workflows, dispatch adjustments, and ground handling SLA controls.',
    mode: 'PROCESS_IMPROVEMENT',
  },
  {
    id: 'p-bpi-2',
    category: 'Business Process Improvement',
    title: 'Hub Ground Turnaround SLA Optimization',
    description: 'Propose automated alerting for gate and baggage hold turnaround buffers.',
    prompt: 'How can our digital solutions team improve ground turnaround predictability for hub departures? Outline a real-time event webhook notification model for gate dispatchers.',
    mode: 'PROCESS_IMPROVEMENT',
  },

  // 4. Management Reporting
  {
    id: 'p-mr-1',
    category: 'Management Reporting',
    title: 'Summarize Network Performance for Management',
    description: 'Executive briefing with high-level KPI facts, interpretations, and managerial actions.',
    prompt: 'Summarize the network operational performance for airline executive management. Highlight total volume, OTP-15 rate, cancellation impact, and the financial exposure from chronic delay minutes.',
    mode: 'EXECUTIVE_SUMMARY',
  },
  {
    id: 'p-mr-2',
    category: 'Management Reporting',
    title: 'Joint Ops Committee Weekly Review',
    description: 'Briefing deck structure for weekly inter-departmental operations review.',
    prompt: 'Draft an executive briefing for the weekly Joint Operations Committee (Flight Ops, Ground Handling, Dispatch). Include calculated metrics, carrier performance variance, and station accountability items.',
    mode: 'EXECUTIVE_SUMMARY',
  },

  // 5. Automation Opportunities
  {
    id: 'p-ao-1',
    category: 'Automation Opportunities',
    title: 'Identify Disruption Automation ROI',
    description: 'Prioritize automated passenger rebooking and crew duty calculation RPA bots.',
    prompt: 'Evaluate our top automation opportunities in relation to current flight delays. Which automated solutions (e.g. RPA bots, event webhooks, automated passenger re-accommodation) offer the highest annual hours savings?',
    mode: 'PROCESS_IMPROVEMENT',
  },
  {
    id: 'p-ao-2',
    category: 'Automation Opportunities',
    title: 'Generate OCC Workflow Requirements',
    description: 'Produce user stories and functional requirements for automated slot recovery.',
    prompt: 'Generate formal user stories and functional requirements for an Automated ATC Slot Recovery & Delay Warning system in the OCC.',
    mode: 'REQUIREMENTS_GENERATION',
  },

  // 6. Data Quality Analysis
  {
    id: 'p-dqa-1',
    category: 'Data Quality Analysis',
    title: 'What Data Quality Problems Were Identified?',
    description: 'Audit dataset completeness, missing timestamps, duplicate records, and telemetry gaps.',
    prompt: 'What data quality problems were identified in our active operational dataset? Report completeness score, missing actual departure times, duplicate records, and note whether delay root-cause telemetry is recorded or missing.',
    mode: 'GENERAL',
  },
];

export function getStoredPrompts(): PromptTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROMPTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read prompts from localStorage', e);
  }
  return DEFAULT_PROMPTS;
}

export function saveStoredPrompts(prompts: PromptTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROMPTS, JSON.stringify(prompts));
  } catch (e) {
    console.error('Failed to write prompts to localStorage', e);
  }
}

export function resetPromptsToDefault(): PromptTemplate[] {
  try {
    localStorage.removeItem(STORAGE_KEY_PROMPTS);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_PROMPTS;
}
