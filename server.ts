import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

// Configure Express proxy trust for container/cloud ingress (e.g. Cloud Run, Nginx, or Docker behind 1 proxy hop)
// Avoids blind trust in arbitrary forwarded IP headers
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? true : parseInt(process.env.TRUST_PROXY, 10));
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Enterprise Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// In-Memory Rate Limiter for AI endpoints (30 requests/min per IP)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const aiRateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function aiRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Safely obtain IP: Express req.ip leverages trust proxy configuration; fallback to socket remoteAddress
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  // Periodically prune expired entries to prevent unbounded map growth
  if (aiRateLimitMap.size > 1000) {
    for (const [ip, entry] of aiRateLimitMap.entries()) {
      if (now > entry.resetTime) {
        aiRateLimitMap.delete(ip);
      }
    }
  }

  const record = aiRateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    aiRateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', RATE_LIMIT_MAX_REQUESTS - 1);
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfterSeconds);
    return res.status(429).json({
      error: 'AI query rate limit exceeded (30 requests/minute). Please wait before submitting another inquiry.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds,
    });
  }

  record.count += 1;
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count));
  next();
}

// Mount AI rate limiter before body parser
app.use('/api/gemini', aiRateLimiter);

// JSON body parser with limit
app.use(express.json({ limit: '15mb' }));

// Safe JSON Parse Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload in request body.',
      code: 'INVALID_JSON',
    });
  }
  next(err);
});

// In-Memory Prototype Audit Trail Store
interface ServerAuditEvent {
  id: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  previousValue?: string | null;
  newValue?: string | null;
  notes?: string;
  environment: string;
}

let serverAuditLogs: ServerAuditEvent[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-11-12T04:00:00Z',
    entityType: 'Evidence Classification',
    entityId: 'WF-104',
    action: 'RECLASSIFY',
    actor: 'Lead Solutions QA Auditor',
    previousValue: 'Production Measured',
    newValue: 'Demonstration Benchmark',
    notes: 'Reclassified from live production claim to synthetic demonstration benchmark per Phase 5.1 technical audit.',
    environment: 'Local Prototype Record',
  },
  {
    id: 'AUD-002',
    timestamp: '2026-11-12T04:05:00Z',
    entityType: 'Benefits Realization',
    entityId: 'SOL-104',
    action: 'RECLASSIFY',
    actor: 'Lead Solutions QA Auditor',
    previousValue: 'Measured ($95,200 Cash)',
    newValue: 'Demonstration Benchmark ($95,200 Capacity)',
    notes: 'Audited value as operational capacity bandwidth saved across 3-station staging model; not realized cash savings.',
    environment: 'Local Prototype Record',
  },
  {
    id: 'AUD-003',
    timestamp: '2026-11-12T04:10:00Z',
    entityType: 'Business Problem',
    entityId: 'PRB-005',
    action: 'CREATE',
    actor: 'Lead Solutions Analyst',
    previousValue: null,
    newValue: 'AOG Outstation Defect Sourcing & Logistics Bottleneck',
    notes: 'Created Phase 4 Problem entity mapped to OPP-105.',
    environment: 'Local Prototype Record',
  },
];

// Audit Trail API Routes
app.get('/api/audit-events', (req, res) => {
  res.json({
    events: serverAuditLogs,
    totalCount: serverAuditLogs.length,
    environment: 'Local Prototype Record',
    disclaimer: 'Locally generated prototype audit events. Stored in local runtime memory without connection to external monitoring or production systems.',
  });
});

app.post('/api/audit-events', (req, res) => {
  const { entityType, entityId, action, previousValue, newValue, notes, actor } = req.body || {};
  if (
    typeof entityType !== 'string' || !entityType.trim() ||
    typeof entityId !== 'string' || !entityId.trim() ||
    typeof action !== 'string' || !action.trim()
  ) {
    return res.status(400).json({ error: 'Missing or invalid required audit event fields: entityType, entityId, action' });
  }
  const sanitizeOpt = (val: unknown, maxLen: number): string | null =>
    typeof val === 'string' && val.trim().length > 0 ? val.trim().slice(0, maxLen) : null;

  const newEvent: ServerAuditEvent = {
    id: `AUD-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    entityType: entityType.trim().slice(0, 80),
    entityId: entityId.trim().slice(0, 80),
    action: action.trim().slice(0, 40),
    actor: sanitizeOpt(actor, 100) || 'Local Prototype User',
    previousValue: sanitizeOpt(previousValue, 300),
    newValue: sanitizeOpt(newValue, 300),
    notes: sanitizeOpt(notes, 1000) || '',
    environment: 'Local Prototype Record',
  };
  serverAuditLogs.unshift(newEvent);
  if (serverAuditLogs.length > 500) serverAuditLogs = serverAuditLogs.slice(0, 500);
  res.status(201).json({ success: true, event: newEvent });
});

app.delete('/api/audit-events', (req, res) => {
  serverAuditLogs = serverAuditLogs.slice(0, 3);
  res.json({ success: true, message: 'Audit events reset to baseline defaults' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: hasGeminiKey,
    service: 'AirOps Intelligence Server',
    environment: 'Local Prototype',
    auditEventsCount: serverAuditLogs.length,
  });
});

// Server-side Gemini AI Copilot endpoint (rate-limited via /api/gemini middleware)
app.post('/api/gemini/copilot', async (req, res) => {
  try {
    const { message, context, mode, history } = req.body || {};

    // Strict Request Payload Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing or empty "message" parameter. A non-empty text inquiry is required.',
        code: 'INVALID_REQUEST',
      });
    }

    if (message.length > 8000) {
      return res.status(413).json({
        error: 'Inquiry message exceeds maximum allowed limit (8,000 characters). Please provide a more concise inquiry.',
        code: 'PAYLOAD_TOO_LARGE',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is configured in Settings > Secrets.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are the AirOps Intelligence AI Business Solutions Copilot for an enterprise airline operations and business solutions team.
Your mission is to help airline business analysts, operations managers, and digital transformation consultants analyze operational flight data, identify root causes of delays and inefficiencies, propose actionable digital/automation solutions, and prepare structured executive reports.

STRICT OPERATIONAL, FACTUAL & ETHICAL CONSTITUTION:
1. QUANTITATIVE INTEGRITY: Base all numerical assertions strictly on the provided operational context metrics. NEVER invent flight counts, delay durations, percentages, or synthetic statistics.
2. MISSING DATA TRANSPARENCY: If categorized delay cause data (delay reason codes) is absent from the dataset (context.hasDelayCauses === false), you MUST explicitly state: "Delay root-cause data is not available in the active dataset." DO NOT guess or synthesize causes like weather or air traffic control unless explicitly confirmed in the data context.
3. STRUCTURED BUSINESS RESPONSE: When answering operational, diagnostic, or strategic inquiries, structure your response using the following four mandatory sections:
   [CALCULATED FACT]
   Present exact numerical metrics, counts, and percentages directly from the analytics engine.
   [OPERATIONAL INTERPRETATION]
   Explain the operational and business implications (e.g. turnaround pressure, schedule buffer consumption, departure slot risk) without asserting unverified external causes.
   [RECOMMENDATION]
   Suggest practical, high-impact process, digital workflow, or operational improvement actions.
   [NEXT INVESTIGATION]
   Specify exactly what additional operational records (e.g., gate departure timestamps, inbound aircraft routing, airport advisories, crew duty logs) are required to validate the recommendation.

4. RESPONSIBLE AI & HUMAN GOVERNANCE:
   - Recommendations must clearly state that human review and operational validation by Operations Control Center (OCC) leadership is mandatory prior to operational execution.
   - You must NOT make automatic dispatch decisions.
   - Never output passenger personal information (PII).

5. TERMINOLOGY & FORMATTING:
   - Use clear business analyst and airline operations terminology (OTP-15, scheduled vs actual block time, ground turnaround, departure slot compliance, passenger load factor).
   - Format responses cleanly with readable markdown headers, bullet lists, and tables where suitable.`;

    // Construct sanitized, PII-free operational context payload
    let operationalContextStr = 'No dataset context provided.';
    if (context && typeof context === 'object') {
      if (context.problem && typeof context.problem === 'object') {
        operationalContextStr = `
ACTIVE BUSINESS PROBLEM CONTEXT (PHASE 4 REQUIREMENTS ENGINEERING):
- Selected Problem ID: ${context.selectedProblemId || context.problem.id || 'N/A'}
- Problem Title: ${context.problem.title || 'N/A'}
- Department: ${context.problem.department || 'N/A'}
- Priority: ${context.problem.priority || 'N/A'}
- Business Owner: ${context.problem.businessOwner || 'N/A'}
- Description: ${context.problem.description || 'N/A'}
- Current Operational Process: ${context.problem.currentProcess || 'N/A'}
- Current Business Impact: ${context.problem.businessImpact || 'N/A'}
- Desired Outcome: ${context.problem.desiredOutcome || 'N/A'}
- Stakeholders: ${Array.isArray(context.problem.stakeholders) ? context.problem.stakeholders.join(', ') : 'N/A'}
`;
      } else if (context.summaryMetrics && typeof context.summaryMetrics === 'object') {
        operationalContextStr = `
ACTIVE SOLUTIONS PERFORMANCE PORTFOLIO CONTEXT (PHASE 5 TRACKER):
- Portfolio Solutions Count: ${context.portfolioCount ?? 'N/A'}
- Tracked Operational Bottlenecks: ${context.bottlenecksCount ?? 'N/A'}
- Summary Metrics: ${JSON.stringify(context.summaryMetrics)}
`;
      } else {
        const causesStr = context.hasDelayCauses && context.topDelayCauses && context.topDelayCauses.length > 0
          ? JSON.stringify(context.topDelayCauses)
          : 'DELAY CAUSE TELEMETRY NOT RECORDED IN CURRENT DATASET (DO NOT INVENT CAUSES)';
        const otpLabel = context.otpThreshold != null ? `OTP-${context.otpThreshold}` : 'OTP-15';

        operationalContextStr = `
CURRENT AIRLINE OPERATIONAL DATASET METRICS & FILTERS:
- Active Dataset Mode: ${context.isCustomData ? 'Custom Uploaded CSV Dataset' : 'Default Synthetic Sample Fleet'}
- Active Filters: ${context.activeFilters ? JSON.stringify(context.activeFilters) : 'None (Full Fleet View)'}
- Date Range Coverage: ${context.dateCoverage || 'All Available Dates'}
- Total Flights Analyzed: ${context.totalFlights ?? 'N/A'}
- Operative Flights (excluding cancellations): ${context.operativeFlights ?? (context.totalFlights != null && context.cancelledFlights != null ? context.totalFlights - context.cancelledFlights : 'N/A')}
- Cancelled Flights: ${context.cancelledFlights ?? 0} (${context.cancellationRate != null ? `${context.cancellationRate}%` : 'N/A'})
- On-Time Performance (${otpLabel}): ${context.onTimePerformance != null ? `${context.onTimePerformance}%` : 'N/A'}
- Delay Rate: ${context.delayPercentage != null ? `${context.delayPercentage}%` : 'N/A'} (${context.delayedFlights ?? 'N/A'} flights)
- Average Delay Duration (among delayed flights): ${context.avgDelayMinutes != null ? `${context.avgDelayMinutes} mins` : 'N/A'}
- Median Delay Duration: ${context.medianDelayMinutes != null ? `${context.medianDelayMinutes} mins` : 'N/A'}
- Maximum Recorded Delay: ${context.maxDelay ? `${context.maxDelay.minutes} mins (Flight ${context.maxDelay.flight_id}, Corridor ${context.maxDelay.route}, Carrier ${context.maxDelay.airline || 'N/A'})` : 'N/A'}
- Delay Root Cause Telemetry Present: ${context.hasDelayCauses ? 'YES' : 'NO - CAUSES ABSENT'}
- Recorded Delay Causes Breakdown: ${causesStr}
- Top Delayed Corridors: ${context.topDelayedRoutes ? JSON.stringify(context.topDelayedRoutes.slice(0, 5)) : 'N/A'}
- Best-Performing Corridors: ${context.bestRoutes ? JSON.stringify(context.bestRoutes.slice(0, 3)) : 'N/A'}
- Operating Carrier Reliability: ${context.airlineBreakdown ? JSON.stringify(context.airlineBreakdown) : 'N/A'}
- Data Completeness Score: ${context.completenessScore != null ? `${context.completenessScore}%` : 'N/A'}
- Data Quality Warnings: ${context.qualityWarnings && context.qualityWarnings.length > 0 ? JSON.stringify(context.qualityWarnings) : 'None'}
- Identified Automation Pipeline: ${context.automationOpportunitiesCount ?? 'N/A'} opportunities, ~${context.estimatedAnnualHoursSaved ?? 'N/A'} annual hours potential
`;
      }
    }

    let prompt = `${operationalContextStr}\n\n`;

    // Multi-turn conversational context if available
    if (Array.isArray(history) && history.length > 0) {
      const validHistory = history
        .slice(-4)
        .filter((h: any) => h && typeof h.text === 'string' && h.text.trim().length > 0);
      if (validHistory.length > 0) {
        prompt += `RECENT CONVERSATION HISTORY:\n`;
        validHistory.forEach((h: any) => {
          const sender = h.sender === 'user' ? 'USER' : 'AIRLINE COPILOT';
          prompt += `${sender}: ${h.text.substring(0, 400)}\n\n`;
        });
        prompt += `----\n\n`;
      }
    }

    prompt += `CURRENT USER INQUIRY (${mode || 'GENERAL_ANALYSIS'}):\n${message}`;

    if (mode === 'DELAY_INVESTIGATION') {
      prompt += `\n\n[SPECIALIZED DELAY INVESTIGATION MODE]:
The user is investigating a specific flight, corridor, or delay incident.
1. Inspect the provided records for this target.
2. Detail scheduled vs actual timing, delay duration, and observed cause (or explicitly cite if cause telemetry is absent).
3. Frame your diagnosis using [CALCULATED FACT], [OPERATIONAL INTERPRETATION], [RECOMMENDATION], and [NEXT INVESTIGATION].
4. State what specific operational records (gate departure timestamps, turnaround ground logs, airport advisories, ATC slot messages) OCC must request.`;
    } else if (mode === 'EXECUTIVE_SUMMARY') {
      prompt += `\n\n[EXECUTIVE REPORT MODE]:
Draft an executive operational summary for airline leadership.
Structure using:
1. Fleet Status & Key Metrics
2. [CALCULATED FACT]
3. [OPERATIONAL INTERPRETATION]
4. [RECOMMENDATION]
5. [NEXT INVESTIGATION]
Include human reviewer signoff notice.`;
    } else if (mode === 'PROCESS_IMPROVEMENT') {
      prompt += `\n\n[PROCESS IMPROVEMENT MODE]:
Analyze operational friction points and recommend concrete digital workflows, automation, or RPA opportunities.
Structure using [CALCULATED FACT], [OPERATIONAL INTERPRETATION], [RECOMMENDATION], and [NEXT INVESTIGATION].`;
    } else if (mode === 'REQUIREMENTS_GENERATION') {
      prompt += `\n\n[REQUIREMENTS ENGINEERING MODE]:
Generate formal Business and Functional Requirements for an airline digital solution. Include:
1. Business Objective & Target Operational Problem
2. User Stories (As a [role], I want [capability], so that [business benefit])
3. Functional Requirements (FR-1, FR-2, etc.)
4. Non-Functional & Data Telemetry Dependencies
5. Acceptance Criteria (Given/When/Then format).`;
    } else if (mode === 'WORKFLOW_GENERATION') {
      prompt += `\n\n[WORKFLOW ARCHITECTURE GENERATION MODE]:
The user is designing an automated workflow for an airline business process.
Generate a structured workflow specification including:
1. Proposed Workflow Name & Target Department
2. Trigger Mechanism (e.g. Webhook, Scheduled Job, Flight Status Event)
3. Step-by-Step Automated Sequence (Step Types: Trigger, Data Input, Validation, Condition, Approval, Notification, Data Transformation, Report Generation, End)
4. Recommended Low-Code / Automation Technology (RPA, Webhook, REST API, Rule Engine, etc.)
5. Risk & Governance Requirements (Mandatory human-in-the-loop sign-off points)
6. Suggested Test Scenarios (Nominal case, Disruption case, Edge case)
Format cleanly with markdown.`;
    } else if (mode === 'BUSINESS_ANALYSIS') {
      prompt += `\n\n[BUSINESS ANALYSIS & REQUIREMENTS ENGINEERING MODE]:
You are acting as a Senior Airline Business Analyst and Solutions Consultant.
Analyze the user's business problem and provide a structured decomposition:
1. PROBLEM DECOMPOSITION & ROOT CAUSE: Analyze the operational friction, manual steps, and impact on airline OTP and costs.
2. 3 CLARIFYING QUESTIONS: Ask 3 precise business/operational questions that need stakeholder alignment.
3. PROPOSED TO-BE DIGITAL ARCHITECTURE: Outline the digital solution, event triggers, and automated logic.
4. KEY FUNCTIONAL REQUIREMENTS: Draft 3-4 numbered functional requirements (e.g., FR-1, FR-2) with triggers, inputs, and validation rules.
5. USER STORIES & ACCEPTANCE CRITERIA: Provide 2 structured user stories ("As a [role], I want [capability], so that [benefit]") with Given/When/Then acceptance criteria.
6. MANDATORY HUMAN-IN-THE-LOOP SAFEGUARDS: Highlight where human sign-off (e.g., OCC Duty Manager, Chief Pilot, Station Lead) is strictly required before execution.
Format with clean, professional markdown.`;
    } else if (mode === 'USER_STORY_GENERATION') {
      prompt += `\n\n[STRUCTURED USER STORY & ACCEPTANCE CRITERIA MODE]:
You are acting as an Agile Airline Solutions Analyst.
From the user's requirements description, generate structured user stories and acceptance criteria:
1. USER STORIES: Formulate 3-4 distinct user stories using the strict format:
   - "As a [specific airline operational role], I want [system capability], so that [measurable operational benefit]."
2. ACCEPTANCE CRITERIA MATRIX: For each story, provide Given / When / Then criteria across:
   - Positive Scenario (Nominal happy path)
   - Negative / Boundary Scenario (Invalid input, edge condition, threshold check)
   - Permission / Safety Scenario (Regulatory compliance or human sign-off requirement)
3. TRACEABILITY NOTES: Specify required telemetry feeds and data dependencies.
Format cleanly with markdown.`;
    } else if (mode === 'SOLUTIONS_PERFORMANCE_ANALYSIS') {
      prompt += `\n\n[SOLUTIONS PERFORMANCE ANALYST MODE]:
You are acting as the Chief Airline Business Solutions Analyst and Enterprise Performance Auditor.
Analyze the provided Solutions Performance metrics, adoption rates, workflow success telemetry, and bottleneck resolution audits.

MANDATORY RULES:
1. Base all quantitative assertions STRICTLY on the supplied performance data. NEVER invent financial returns, hours saved, adoption numbers, or production deployment statuses.
2. Differentiate between:
   - Estimated Benefits (formula projections)
   - Simulated Benefits (staging test run observations)
   - Measured Benefits (production-audited with human sign-off)
3. Do NOT claim an automation caused a delay reduction unless verified evidence is present.
4. Structure your response using the four mandatory constitutional sections:
   [CALCULATED FACT]
   Report exact numbers from the solutions portfolio, execution rates, adoption percentages, and bottleneck metrics.
   [OPERATIONAL INTERPRETATION]
   Explain the operational significance (e.g., bottleneck relief, user adoption friction, stage gate bottlenecks, simulation vs production divergence).
   [RECOMMENDATION]
   Provide practical, actionable corrective actions for underperforming solutions or adoption gaps.
   [NEXT INVESTIGATION]
   Specify exactly what audit logs, evidence artifacts, or station telemetry must be gathered to confirm benefit realization.`;
    }

    let response;
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
          },
        });
        if (response && response.text) {
          return res.json({
            success: true,
            reply: response.text,
            model: modelName,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} call failed, trying fallback if available:`, err?.message || err);
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    throw lastError || new Error('All AI model attempts exhausted.');
  } catch (error: any) {
    console.error('Gemini Copilot Final Error:', error);
    let userMessage = error?.message || 'Failed to generate Copilot response';
    try {
      const parsed = JSON.parse(userMessage);
      if (parsed?.error?.message) {
        userMessage = parsed.error.message;
      }
    } catch {
      // not json, keep original string
    }

    return res.status(500).json({
      error: userMessage,
      details: error?.status || 500,
    });
  }
});

// Vite middleware for dev / static serve for prod
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Determine static assets directory whether running from root (server.ts) or dist/ (dist/server.js)
    const staticDir = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))
      ? path.resolve(__dirname, 'dist')
      : path.resolve(__dirname);

    app.use(express.static(staticDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(staticDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AirOps Intelligence backend listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
