import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  AlertCircle,
  FileText,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  BarChart3,
  ListFilter,
  Eye,
  MessageSquare,
  Compass,
} from 'lucide-react';
import {
  OperationalMetrics,
  ProcessOpportunity,
  CopilotMessage,
  CopilotConversation,
  FlightRecord,
  PromptTemplate,
  GeneratedReport,
  ReportType,
  AIEvaluation,
  NavigationTab,
} from '../../types';
import { parseStructuredSections } from '../../utils/structuredResponseParser';
import { fetchCopilot } from '../../utils/aiFetch';
import {
  DEFAULT_PROMPTS,
  getStoredPrompts,
  saveStoredPrompts,
  resetPromptsToDefault,
} from '../../utils/promptLibrary';
import {
  generateReportDraft,
  downloadReportMarkdown,
} from '../../utils/reportGenerator';
import {
  getStoredEvaluations,
  saveStoredEvaluations,
  calculateEvaluationStats,
  checkResponseFactualGroundedness,
  BENCHMARK_TEST_CASES,
} from '../../utils/aiEvaluator';
import { calculateOperationalMetrics } from '../../utils/calculator';

interface AICopilotProps {
  metrics: OperationalMetrics;
  opportunities: ProcessOpportunity[];
  flights: FlightRecord[];
  isCustomData: boolean;
  otpThreshold?: number;
  onSelectTab?: (tab: NavigationTab) => void;
}

type CopilotSubTab = 'chat' | 'investigation' | 'reports' | 'prompts' | 'evaluation';

export const AICopilot: React.FC<AICopilotProps> = ({
  metrics,
  opportunities,
  flights,
  isCustomData,
  otpThreshold = 15,
  onSelectTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CopilotSubTab>('chat');

  // Multi-conversation management
  const [conversations, setConversations] = useState<CopilotConversation[]>(() => {
    const initialMsg: CopilotMessage = {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello, I am your **AirOps Intelligence Copilot**.

I have ingested your active airline operational dataset comprising **${metrics.totalFlights} flights** with an On-Time Performance (OTP-${otpThreshold}) of **${metrics.onTimePerformance}%**.

How can I assist your business solutions and operations teams today?
- Ask a strategic or diagnostic question (e.g. *"Why is network OTP low?"*, *"Which routes need investigation?"*)
- Explore **Delay Investigation** to audit single flights or congested corridors
- Generate formal **Executive Reports** ready for OCC review
- Select pre-configured inquiries from the **Prompt Library**

> **Operational Notice:** All recommendations generated require review and validation by Operations Control Center (OCC) leadership before execution. Quantitative assertions are strictly anchored to the active dataset.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    return [
      {
        id: 'conv-initial',
        title: 'Network Operations Initial Briefing',
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [initialMsg],
      },
    ];
  });

  const [activeConvId, setActiveConvId] = useState<string>('conv-initial');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'GENERAL' | 'EXECUTIVE_SUMMARY' | 'PROCESS_IMPROVEMENT' | 'REQUIREMENTS_GENERATION' | 'DELAY_INVESTIGATION'>('GENERAL');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Active filters for Copilot context
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Prompt Library state
  const [prompts, setPrompts] = useState<PromptTemplate[]>(() => getStoredPrompts());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddPromptModal, setShowAddPromptModal] = useState<boolean>(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptDesc, setNewPromptDesc] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState<PromptTemplate['category']>('Custom');

  // Delay Investigation state
  const delayedFlightsList = useMemo(() => {
    return flights.filter((f) => f.flight_status === 'DELAYED' || (f.delay_minutes && f.delay_minutes > otpThreshold));
  }, [flights, otpThreshold]);

  const [selectedInvestigateTarget, setSelectedInvestigateTarget] = useState<string>(() => {
    return metrics.maxDelay?.flight_id || (delayedFlightsList[0]?.flight_id ?? '');
  });
  const [investigationType, setInvestigationType] = useState<'flight' | 'route'>('flight');

  // Report Generator state
  const [reportType, setReportType] = useState<ReportType>('daily_operations');
  const [reviewerName, setReviewerName] = useState('Operations Duty Manager');
  const [activeReport, setActiveReport] = useState<GeneratedReport>(() => {
    return generateReportDraft('daily_operations', metrics, opportunities, null, 'Operations Duty Manager');
  });

  // AI Quality Evaluation state
  const [evaluations, setEvaluations] = useState<AIEvaluation[]>(() => getStoredEvaluations());
  const [evalQuestion, setEvalQuestion] = useState('');
  const [evalResponse, setEvalResponse] = useState('');
  const [evalRating, setEvalRating] = useState<'Helpful' | 'Needs Improvement' | 'Incorrect'>('Helpful');
  const [evalComments, setEvalComments] = useState('');
  const [evalFactualConfirmed, setEvalFactualConfirmed] = useState(true);
  const [evalReviewer, setEvalReviewer] = useState('Senior Business Analyst');
  const [evalLoading, setEvalLoading] = useState(false);

  const evalStats = useMemo(() => calculateEvaluationStats(evaluations), [evaluations]);

  // Current active conversation
  const currentConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0];
  }, [conversations, activeConvId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, loading]);

  // Auto-sync investigation target when flights or investigation type changes
  useEffect(() => {
    if (investigationType === 'flight') {
      const exists = flights.some((f) => f.flight_id === selectedInvestigateTarget);
      if (!selectedInvestigateTarget || !exists) {
        const nextTarget =
          (metrics.maxDelay?.flight_id && metrics.maxDelay.flight_id !== 'N/A'
            ? metrics.maxDelay.flight_id
            : delayedFlightsList[0]?.flight_id || flights[0]?.flight_id) || '';
        setSelectedInvestigateTarget(nextTarget);
      }
    } else {
      const exists = metrics.topDelayedRoutes.some((r) => r.route === selectedInvestigateTarget);
      if (!selectedInvestigateTarget || !exists) {
        setSelectedInvestigateTarget(metrics.topDelayedRoutes[0]?.route || '');
      }
    }
  }, [flights, metrics, delayedFlightsList, investigationType, selectedInvestigateTarget]);

  // Keep report draft synced when underlying metrics, opportunities, reportType, or reviewer change
  useEffect(() => {
    setActiveReport(generateReportDraft(reportType, metrics, opportunities, null, reviewerName));
  }, [metrics, opportunities, reportType, reviewerName]);

  // Filtered flights and recalculated metrics for Copilot context
  const contextFilteredMetrics = useMemo(() => {
    if (carrierFilter === 'ALL' && severityFilter === 'ALL') {
      return {
        ...metrics,
        activeFilters: { carrier: carrierFilter, severity: severityFilter },
      };
    }

    const filtered = flights.filter((f) => {
      if (carrierFilter !== 'ALL' && f.airline !== carrierFilter) return false;
      if (severityFilter === 'MINOR' && (f.delay_minutes < 1 || f.delay_minutes > 15)) return false;
      if (severityFilter === 'MODERATE' && (f.delay_minutes <= 15 || f.delay_minutes > 60)) return false;
      if (severityFilter === 'SEVERE' && f.delay_minutes <= 60) return false;
      return true;
    });

    const filteredCalc = calculateOperationalMetrics(filtered, otpThreshold);
    return {
      ...filteredCalc,
      activeFilters: { carrier: carrierFilter, severity: severityFilter },
    };
  }, [metrics, carrierFilter, severityFilter, flights, otpThreshold]);

  // Handle New Conversation
  const handleNewConversation = () => {
    const newConv: CopilotConversation = {
      id: `conv-${Date.now()}`,
      title: `Analysis Session ${conversations.length + 1}`,
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `welcome-${Date.now()}`,
          sender: 'assistant',
          text: `Started new analysis session. Active context: **${metrics.totalFlights} flights** (${metrics.onTimePerformance}% OTP-${otpThreshold}). How can I assist?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  };

  // Handle Clear Active Conversation
  const handleClearCurrentConversation = () => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            messages: [
              {
                id: `reset-${Date.now()}`,
                sender: 'assistant',
                text: `Conversation cleared. Ready for your next inquiry.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ],
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return c;
      })
    );
  };

  // Send message to server-side Gemini Copilot
  const handleSendMessage = async (textToSend?: string, modeOverride?: any) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const mode = modeOverride || selectedMode;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
    };

    // Update conversation with user message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          const title = c.messages.length <= 1 ? text.substring(0, 36) + (text.length > 36 ? '...' : '') : c.title;
          return {
            ...c,
            title,
            messages: [...c.messages, userMsg],
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return c;
      })
    );

    setInputMessage('');
    setLoading(true);
    setLoadingStep('Ingesting active operational telemetry...');

    const stepTimer1 = window.setTimeout(() => {
      setLoadingStep(`Evaluating OTP-${otpThreshold} & corridor variance...`);
    }, 400);

    const stepTimer2 = window.setTimeout(() => {
      setLoadingStep('Validating delay cause telemetry & formulating response...');
    }, 900);

    try {
      // Build safe, PII-free context payload reflecting active dataset and filters
      const context = {
        isCustomData,
        otpThreshold,
        totalFlights: contextFilteredMetrics.totalFlights,
        operativeFlights: contextFilteredMetrics.totalFlights - contextFilteredMetrics.cancelledFlights,
        cancelledFlights: contextFilteredMetrics.cancelledFlights,
        cancellationRate: contextFilteredMetrics.cancellationRate,
        onTimePerformance: contextFilteredMetrics.onTimePerformance,
        delayedFlights: contextFilteredMetrics.delayedFlights,
        delayPercentage: contextFilteredMetrics.delayPercentage,
        avgDelayMinutes: contextFilteredMetrics.avgDelayMinutes,
        medianDelayMinutes: contextFilteredMetrics.medianDelayMinutes,
        maxDelay: contextFilteredMetrics.maxDelay,
        hasDelayCauses: contextFilteredMetrics.hasDelayCauses,
        topDelayCauses: contextFilteredMetrics.hasDelayCauses ? contextFilteredMetrics.topDelayCauses.slice(0, 5) : [],
        topDelayedRoutes: contextFilteredMetrics.topDelayedRoutes.slice(0, 5).map((r) => ({
          route: r.route,
          delayedCount: r.delayedCount,
          total: r.totalFlights,
          avgDelay: r.avgDelay,
          otp: r.otp,
        })),
        bestRoutes: contextFilteredMetrics.bestRoutes.slice(0, 3).map((r) => ({
          route: r.route,
          otp: r.otp,
          avgDelay: r.avgDelay,
          total: r.totalFlights,
        })),
        airlineBreakdown: contextFilteredMetrics.airlineBreakdown.map((a) => ({
          airline: a.airline,
          total: a.total,
          delayed: a.delayed,
          cancelled: a.cancelled,
          otp: a.otp,
          avgDelay: a.avgDelay,
        })),
        completenessScore: contextFilteredMetrics.dataQuality?.completenessScore ?? 100,
        qualityWarnings: contextFilteredMetrics.dataQuality?.qualityWarnings ?? [],
        dateCoverage: contextFilteredMetrics.dataQuality?.dateCoverage || 'Active Dataset',
        activeFilters: { carrier: carrierFilter, severity: severityFilter },
        automationOpportunitiesCount: opportunities.length,
        estimatedAnnualHoursSaved: opportunities.reduce((acc, o) => acc + (o.estimatedHoursSavedAnnual || 0), 0),
      };

      const history = currentConversation.messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const data = await fetchCopilot({
        message: text,
        context,
        mode,
        history,
      });

      const botMsg: CopilotMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No response received from Copilot.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
        model: data.model,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: [...c.messages, botMsg],
              updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      console.error('Copilot request failed:', err);
      const errorMsg: CopilotMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `**Operational Alert:** Unable to generate response.

*Details:* ${err.message || 'Network or API failure.'}

Please check the server logs or verify your Gemini configuration. You can retry your request anytime.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: [...c.messages, errorMsg],
            };
          }
          return c;
        })
      );
    } finally {
      window.clearTimeout(stepTimer1);
      window.clearTimeout(stepTimer2);
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Copy to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Prompt Library actions
  const handleExecutePrompt = (promptText: string, mode?: string) => {
    setActiveSubTab('chat');
    handleSendMessage(promptText, mode);
  };

  const handleSaveCustomPrompt = () => {
    if (!newPromptTitle.trim() || !newPromptText.trim()) return;
    const newP: PromptTemplate = {
      id: `custom-${Date.now()}`,
      category: newPromptCategory,
      title: newPromptTitle.trim(),
      prompt: newPromptText.trim(),
      description: newPromptDesc.trim() || 'Custom operational inquiry saved by analyst.',
      isCustom: true,
    };
    const updated = [newP, ...prompts];
    setPrompts(updated);
    saveStoredPrompts(updated);
    setShowAddPromptModal(false);
    setNewPromptTitle('');
    setNewPromptText('');
    setNewPromptDesc('');
  };

  const handleDeleteCustomPrompt = (id: string) => {
    const updated = prompts.filter((p) => p.id !== id);
    setPrompts(updated);
    saveStoredPrompts(updated);
  };

  // Delay Investigation handler
  const handleLaunchDelayInvestigation = () => {
    let targetTargetRecords: FlightRecord[] = [];
    let identifier = selectedInvestigateTarget;

    if (investigationType === 'flight') {
      targetTargetRecords = flights.filter((f) => f.flight_id === selectedInvestigateTarget);
    } else {
      targetTargetRecords = flights.filter((f) => `${f.origin}-${f.destination}` === selectedInvestigateTarget);
    }

    const delayedRecs = targetTargetRecords.filter((f) => f.flight_status === 'DELAYED' || (f.delay_minutes && f.delay_minutes > otpThreshold));
    const maxD = targetTargetRecords.reduce((max, f) => Math.max(max, f.delay_minutes || 0), 0);
    const avgD = delayedRecs.length > 0 ? Math.round(delayedRecs.reduce((sum, f) => sum + (f.delay_minutes || 0), 0) / delayedRecs.length) : 0;
    const observedCauses = Array.from(new Set(targetTargetRecords.map((f) => f.delay_reason).filter(Boolean))) as string[];

    const hasActualCauses = observedCauses.length > 0 && observedCauses.some((c) => c !== 'None');

    const promptText = `Conduct a comprehensive operational delay investigation for ${investigationType.toUpperCase()} ${identifier}.
Target Records Summary:
- Total Scheduled Legs: ${targetTargetRecords.length}
- Delayed Legs (>${otpThreshold}m): ${delayedRecs.length} (${Math.round((delayedRecs.length / Math.max(1, targetTargetRecords.length)) * 100)}% delay rate)
- Average Delay among delayed: ${avgD} minutes
- Maximum Recorded Delay: ${maxD} minutes
- Observed Delay Reason Telemetry: ${hasActualCauses ? observedCauses.join(', ') : 'NONE RECORDED IN DATASET (DO NOT INVENT CAUSES)'}

Provide:
1. [CALCULATED FACT]
2. [OPERATIONAL INTERPRETATION]
3. [RECOMMENDATION]
4. [NEXT INVESTIGATION] (Specify exact departure timestamps, turnaround logs, airport advisories, and crew duty logs required to close this investigation).`;

    setActiveSubTab('chat');
    handleSendMessage(promptText, 'DELAY_INVESTIGATION');
  };

  // Report Generator action
  const handleGenerateReport = () => {
    const report = generateReportDraft(reportType, metrics, opportunities, null, reviewerName);
    setActiveReport(report);
  };

  // AI Evaluation actions
  const handleRunEvaluationTest = async () => {
    if (!evalQuestion.trim()) return;
    setEvalLoading(true);
    try {
      const context = {
        totalFlights: metrics.totalFlights,
        onTimePerformance: metrics.onTimePerformance,
        delayedFlights: metrics.delayedFlights,
        cancelledFlights: metrics.cancelledFlights,
        avgDelayMinutes: metrics.avgDelayMinutes,
        maxDelay: metrics.maxDelay,
        hasDelayCauses: metrics.hasDelayCauses,
      };

      const data = await fetchCopilot({
        message: evalQuestion,
        context,
        mode: 'GENERAL',
      });
      if (data.reply) {
        setEvalResponse(data.reply);
      } else {
        setEvalResponse('Error: Evaluation call failed');
      }
    } catch (err: any) {
      setEvalResponse(`Error: ${err.message}`);
    } finally {
      setEvalLoading(false);
    }
  };

  const handleSaveEvaluation = () => {
    if (!evalQuestion.trim() || !evalResponse.trim()) return;
    const { confirmedFacts } = checkResponseFactualGroundedness(evalResponse, metrics);

    const newEval: AIEvaluation = {
      id: `eval-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      question: evalQuestion.trim(),
      response: evalResponse.trim(),
      rating: evalRating,
      reviewerComments: evalComments.trim(),
      factualAccuracyConfirmed: evalFactualConfirmed,
      groundedMetricsChecked: confirmedFacts,
      reviewerName: evalReviewer.trim() || 'Senior Business Analyst',
    };

    const updated = [newEval, ...evaluations];
    setEvaluations(updated);
    saveStoredEvaluations(updated);
    setEvalComments('');
    setEvalQuestion('');
    setEvalResponse('');
  };

  // Suggested business questions
  const suggestedQuestions = [
    { label: 'Why is Network OTP Low?', text: 'Why is network OTP currently below target? Compare on-time flights versus delayed and cancelled operations.' },
    { label: 'Which Routes Need Investigation?', text: 'Which routes in the active dataset need immediate investigation? Rank the top delay-prone corridors.' },
    { label: 'Carrier OTP Disparity', text: 'Which airline has the highest delay percentage and how does their OTP compare across the network?' },
    { label: 'Data Quality Audit', text: 'What data quality problems were identified in our active operational dataset?' },
    { label: 'Improvement Opportunities', text: 'What process improvement opportunities can be considered to mitigate our primary operational friction points?' },
    { label: 'Executive Management Summary', text: 'Summarize the network operational performance for airline executive management.' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] min-w-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header & Sub-Tab Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">AI Business Solutions Copilot</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Phase 2 Studio
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Zero PII & Server Secure
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Context: <strong className="text-slate-200">{metrics.totalFlights} Flights</strong></span>
              <span>•</span>
              <span>OTP-{otpThreshold}: <strong className="text-blue-400">{metrics.onTimePerformance}%</strong></span>
              <span>•</span>
              <span>Dataset: <span className="text-slate-300 font-medium">{isCustomData ? 'Custom CSV Upload' : `Synthetic Sample Fleet (${flights.length} flights)`}</span></span>
              {carrierFilter !== 'ALL' && (
                <>
                  <span>•</span>
                  <span className="text-amber-400">Filtered: {carrierFilter}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Sub-Workspace Navigation */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'chat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Copilot Chat
          </button>
          <button
            onClick={() => setActiveSubTab('investigation')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'investigation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Delay Investigation
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'reports'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Report Generator
          </button>
          <button
            onClick={() => setActiveSubTab('prompts')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'prompts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Prompt Library
          </button>
          <button
            onClick={() => setActiveSubTab('evaluation')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'evaluation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Quality Evaluation
          </button>
        </div>
      </div>

      {/* SUB-WORKSPACE 1: COPILOT CHAT */}
      {activeSubTab === 'chat' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Session Drawer */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/70 p-3 hidden md:flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sessions</span>
                <button
                  onClick={handleNewConversation}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded flex items-center gap-1 transition"
                  title="Start New Conversation"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>

              <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-22rem)]">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition border ${
                      c.id === activeConvId
                        ? 'bg-slate-800/90 text-white border-blue-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
                    }`}
                  >
                    <div className="font-medium truncate text-slate-200">{c.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{c.messages.length} messages</span>
                      <span>{c.updatedAt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Context Filters */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Context Filter
              </span>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Carrier Focus</label>
                  <select
                    value={carrierFilter}
                    onChange={(e) => setCarrierFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Network Airlines</option>
                    {metrics.airlineBreakdown.map((a) => (
                      <option key={a.airline} value={a.airline}>
                        {a.airline} ({a.otp}% OTP)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Feed */}
          <div className="flex-1 flex flex-col justify-between min-w-0 bg-slate-900">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
              {currentConversation.messages.map((msg) => {
                const isAssistant = msg.sender === 'assistant';
                const structured = isAssistant ? parseStructuredSections(msg.text) : null;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm ${
                        isAssistant
                          ? msg.isError
                            ? 'bg-rose-600'
                            : 'bg-blue-600'
                          : 'bg-indigo-600'
                      }`}
                    >
                      {isAssistant ? (
                        msg.isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-xl p-4 text-sm leading-relaxed border ${
                        isAssistant
                          ? msg.isError
                            ? 'bg-rose-950/20 border-rose-800 text-rose-200'
                            : 'bg-slate-950/90 border-slate-800 text-slate-200 shadow-md'
                          : 'bg-blue-600 text-white border-blue-500'
                      }`}
                    >
                      {/* Message Meta Header */}
                      <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-800/60 text-xs">
                        <span className="font-semibold text-slate-300">
                          {isAssistant ? 'AirOps Copilot Engine' : 'Operations Analyst'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{msg.timestamp}</span>
                          {isAssistant && !msg.isError && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="text-slate-400 hover:text-white p-0.5 rounded transition"
                              title="Copy response markdown"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Structured 4-Part Sections Visualizer */}
                      {structured && structured.hasStructuredSections ? (
                        <div className="space-y-3 my-2">
                          {structured.fact && (
                            <div className="p-3 bg-blue-950/40 border border-blue-800/70 rounded-lg">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">
                                <BarChart3 className="w-3.5 h-3.5" />
                                [Calculated Fact]
                              </div>
                              <p className="text-slate-200 text-xs leading-relaxed">{structured.fact}</p>
                            </div>
                          )}

                          {structured.interpretation && (
                            <div className="p-3 bg-amber-950/30 border border-amber-800/70 rounded-lg">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide mb-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                [Operational Interpretation]
                              </div>
                              <p className="text-slate-200 text-xs leading-relaxed">{structured.interpretation}</p>
                            </div>
                          )}

                          {structured.recommendation && (
                            <div className="p-3 bg-emerald-950/30 border border-emerald-800/70 rounded-lg">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                [Recommendation]
                              </div>
                              <p className="text-slate-200 text-xs leading-relaxed">{structured.recommendation}</p>
                            </div>
                          )}

                          {structured.nextInvestigation && (
                            <div className="p-3 bg-purple-950/30 border border-purple-800/70 rounded-lg">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wide mb-1">
                                <Compass className="w-3.5 h-3.5" />
                                [Next Investigation & Telemetry Required]
                              </div>
                              <p className="text-slate-200 text-xs leading-relaxed">{structured.nextInvestigation}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      )}

                      {/* Governance Disclaimer */}
                      {isAssistant && !msg.isError && (
                        <div className="mt-3 pt-2 border-t border-slate-800/50 text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Human OCC review required prior to flight operational release.</span>
                          <span>Model: {msg.model || 'gemini-3.1-flash-lite'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Dynamic Loading State */}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 shadow-md flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <div>
                      <p className="font-semibold text-white">AirOps Copilot is reasoning...</p>
                      <p className="text-[11px] text-slate-400">{loadingStep || 'Analyzing active operational metrics...'}</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggested Prompts Pill Carousel */}
            <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/50 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> Suggested:
              </span>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q.text)}
                  disabled={loading}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-full text-xs text-slate-200 whitespace-nowrap transition"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask AirOps Copilot about network delays, OTP drivers, or automation workflows..."
                  disabled={loading}
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />

                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-2.5 focus:outline-none"
                >
                  <option value="GENERAL">General Q&A</option>
                  <option value="EXECUTIVE_SUMMARY">Executive Briefing</option>
                  <option value="PROCESS_IMPROVEMENT">Process Improvement</option>
                  <option value="REQUIREMENTS_GENERATION">Requirements Spec</option>
                </select>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !inputMessage.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm flex items-center gap-1.5 transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>

                <button
                  onClick={handleClearCurrentConversation}
                  className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800 rounded-lg transition shrink-0"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-WORKSPACE 2: DELAY INVESTIGATION WORKSPACE */}
      {activeSubTab === 'investigation' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                Dedicated Delay Investigation Workflow
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select a specific delayed flight or congested corridor to audit turnaround logs, departure timing, and telemetry.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 px-2 font-medium">Investigate by:</span>
              <button
                onClick={() => {
                  setInvestigationType('flight');
                  setSelectedInvestigateTarget(
                    (metrics.maxDelay?.flight_id && metrics.maxDelay.flight_id !== 'N/A'
                      ? metrics.maxDelay.flight_id
                      : delayedFlightsList[0]?.flight_id || flights[0]?.flight_id) || ''
                  );
                }}
                className={`px-3 py-1 rounded font-medium ${
                  investigationType === 'flight' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Single Flight
              </button>
              <button
                onClick={() => {
                  setInvestigationType('route');
                  setSelectedInvestigateTarget(metrics.topDelayedRoutes[0]?.route || '');
                }}
                className={`px-3 py-1 rounded font-medium ${
                  investigationType === 'route' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Route Corridor
              </button>
            </div>
          </div>

          {/* Target Selector Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <label className="text-xs font-semibold text-slate-300 block">
                {investigationType === 'flight' ? 'Select Target Flight ID' : 'Select Target Route Corridor'}
              </label>

              {investigationType === 'flight' ? (
                <select
                  value={selectedInvestigateTarget}
                  onChange={(e) => setSelectedInvestigateTarget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {delayedFlightsList.map((f, idx) => (
                    <option key={`${f.flight_id}-${idx}`} value={f.flight_id}>
                      {f.flight_id} – {f.origin}→{f.destination} (+{f.delay_minutes}m, {f.delay_reason || 'No Cause'})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedInvestigateTarget}
                  onChange={(e) => setSelectedInvestigateTarget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {metrics.topDelayedRoutes.map((r) => (
                    <option key={r.route} value={r.route}>
                      {r.route} – {r.delayedCount} delayed ({r.avgDelay}m avg delay)
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleLaunchDelayInvestigation}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Investigate with AirOps Copilot
              </button>
            </div>

            {/* Target Telemetry Breakdown */}
            <div className="md:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Telemetry Audit for: <span className="text-blue-400 font-bold">{selectedInvestigateTarget}</span>
              </h4>

              {(() => {
                const targetRecords = investigationType === 'flight'
                  ? flights.filter((f) => f.flight_id === selectedInvestigateTarget)
                  : flights.filter((f) => `${f.origin}-${f.destination}` === selectedInvestigateTarget);

                if (targetRecords.length === 0) {
                  return <p className="text-xs text-slate-500">No records found for target.</p>;
                }

                const rec = targetRecords[0];

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Airline</span>
                        <strong className="text-white">{rec.airline}</strong>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Corridor</span>
                        <strong className="text-white">{rec.origin} &rarr; {rec.destination}</strong>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Delay Duration</span>
                        <strong className="text-rose-400">+{rec.delay_minutes} minutes</strong>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Scheduled vs Actual</span>
                        <strong className="text-slate-200">{rec.scheduled_departure} / {rec.actual_departure || 'N/A'}</strong>
                      </div>
                    </div>

                    {/* Delay Cause Telemetry Verification */}
                    <div className="p-3.5 rounded-lg border text-xs flex items-start gap-3 bg-slate-900 border-slate-800">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200 block mb-0.5">Recorded Cause Telemetry:</strong>
                        {rec.delay_reason && rec.delay_reason !== 'None' ? (
                          <span className="text-blue-300 font-semibold">{rec.delay_reason}</span>
                        ) : (
                          <span className="text-amber-400">
                            Delay root-cause telemetry is NOT recorded for this flight. The Copilot will analyze time stamps without fabricating an unrecorded cause.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Next Steps for OCC */}
                    <div className="p-3.5 bg-blue-950/20 border border-blue-900/40 rounded-lg text-xs space-y-1">
                      <strong className="text-blue-300 block">Required Telemetry to Complete OCC Investigation:</strong>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        <li>Gate departure timestamps (Doors Closed, Pushback, Takeoff).</li>
                        <li>Turnaround ground support equipment hold sheet.</li>
                        <li>Air traffic control departure slot clearance logs.</li>
                        <li>Crew duty hour margin and rest compliance logs.</li>
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SUB-WORKSPACE 3: BUSINESS REPORT GENERATOR */}
      {activeSubTab === 'reports' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Operational Business Report Generator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generate, review, and export formal operational briefing reports anchored to calculated dataset metrics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadReportMarkdown(activeReport)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export Markdown (.md)
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Report Config Controls */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="daily_operations">Daily Operations Summary</option>
                  <option value="weekly_performance">Weekly Operational Review</option>
                  <option value="route_performance">Route Performance & Reliability Audit</option>
                  <option value="airline_comparison">Operating Carrier Reliability Benchmark</option>
                  <option value="delay_investigation">Delay Investigation Briefing</option>
                  <option value="improvement_recommendations">Operational Improvement Proposals</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Designated Human Reviewer</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  placeholder="e.g. John Doe, OCC Duty Manager"
                />
              </div>

              <button
                onClick={handleGenerateReport}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate Draft Report
              </button>
            </div>

            {/* Editable Markdown Report Preview */}
            <div className="md:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-semibold text-white">{activeReport.title}</span>
                <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  Status: {activeReport.reviewStatus}
                </span>
              </div>

              <textarea
                value={activeReport.markdownContent}
                onChange={(e) => setActiveReport({ ...activeReport, markdownContent: e.target.value })}
                rows={16}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-WORKSPACE 4: PROMPT LIBRARY */}
      {activeSubTab === 'prompts' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Enterprise Prompt Library
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Curated operational prompts across analytics, delay forensics, process improvement, and reporting.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddPromptModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Prompt
              </button>
              <button
                onClick={() => setPrompts(resetPromptsToDefault())}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
              >
                Reset Defaults
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'Operations Analytics', 'Delay Investigation', 'Business Process Improvement', 'Management Reporting', 'Automation Opportunities', 'Data Quality Analysis', 'Custom'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts
              .filter((p) => selectedCategory === 'ALL' || p.category === selectedCategory)
              .map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950/60 border border-blue-900/50">
                        {p.category}
                      </span>
                      {p.isCustom && (
                        <button
                          onClick={() => handleDeleteCustomPrompt(p.id)}
                          className="text-slate-500 hover:text-rose-400 text-xs"
                          title="Delete custom prompt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-white">{p.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                    <div className="mt-3 p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 font-mono line-clamp-3">
                      "{p.prompt}"
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecutePrompt(p.prompt, p.mode)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3 h-3" />
                    Execute in Copilot
                  </button>
                </div>
              ))}
          </div>

          {/* Add Prompt Modal */}
          {showAddPromptModal && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
                <h3 className="text-base font-bold text-white">Save Custom Prompt Template</h3>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Title</label>
                  <input
                    type="text"
                    value={newPromptTitle}
                    onChange={(e) => setNewPromptTitle(e.target.value)}
                    placeholder="e.g. Hub Turnaround Buffer Audit"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={newPromptCategory}
                    onChange={(e) => setNewPromptCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Operations Analytics">Operations Analytics</option>
                    <option value="Delay Investigation">Delay Investigation</option>
                    <option value="Business Process Improvement">Business Process Improvement</option>
                    <option value="Management Reporting">Management Reporting</option>
                    <option value="Automation Opportunities">Automation Opportunities</option>
                    <option value="Data Quality Analysis">Data Quality Analysis</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Prompt Text</label>
                  <textarea
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="Enter the full prompt string..."
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Short Description</label>
                  <input
                    type="text"
                    value={newPromptDesc}
                    onChange={(e) => setNewPromptDesc(e.target.value)}
                    placeholder="Brief description for team..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAddPromptModal(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCustomPrompt}
                    disabled={!newPromptTitle.trim() || !newPromptText.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    Save Prompt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-WORKSPACE 5: AI QUALITY EVALUATION */}
      {activeSubTab === 'evaluation' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Prompt Testing & AI Quality Evaluation Workspace
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Empirically test Copilot responses against calculated dataset metrics and record human review feedback.
              </p>
            </div>
          </div>

          {/* Actual Empirical Accuracy Cards (Strictly calculated, never hardcoded!) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium block">Total Evaluated</span>
              <strong className="text-xl font-bold text-white mt-1 block">{evalStats.totalEvaluated}</strong>
              <span className="text-[10px] text-slate-500">Human reviewed tests</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-emerald-400 font-medium block">Helpful Rate</span>
              <strong className="text-xl font-bold text-emerald-400 mt-1 block">
                {evalStats.totalEvaluated > 0 ? `${evalStats.helpfulRate}%` : 'N/A'}
              </strong>
              <span className="text-[10px] text-slate-500">{evalStats.helpfulCount} helpful</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-amber-400 font-medium block">Needs Improvement</span>
              <strong className="text-xl font-bold text-amber-400 mt-1 block">
                {evalStats.needsImprovementCount}
              </strong>
              <span className="text-[10px] text-slate-500">Requires refining</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-rose-400 font-medium block">Incorrect / Hallucination</span>
              <strong className="text-xl font-bold text-rose-400 mt-1 block">{evalStats.incorrectCount}</strong>
              <span className="text-[10px] text-slate-500">Flagged errors</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[11px] text-blue-400 font-medium block">Factual Groundedness</span>
              <strong className="text-xl font-bold text-blue-400 mt-1 block">
                {evalStats.totalEvaluated > 0 ? `${evalStats.factualAccuracyRate}%` : 'N/A'}
              </strong>
              <span className="text-[10px] text-slate-500">Confirmed against data</span>
            </div>
          </div>

          {/* Test Execution & Review Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1. Test Question & Benchmarks
              </h4>

              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="text-[10px] text-slate-400 block w-full mb-1">Quick Benchmark Cases:</span>
                {BENCHMARK_TEST_CASES.map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => setEvalQuestion(tc.question)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300 text-left transition"
                  >
                    {tc.question.substring(0, 42)}...
                  </button>
                ))}
              </div>

              <textarea
                value={evalQuestion}
                onChange={(e) => setEvalQuestion(e.target.value)}
                placeholder="Enter evaluation test inquiry..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
              />

              <button
                onClick={handleRunEvaluationTest}
                disabled={evalLoading || !evalQuestion.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                {evalLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Run Live Copilot Test
              </button>

              {evalResponse && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Live AI Response Output:</span>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {evalResponse}
                  </div>
                </div>
              )}
            </div>

            {/* Human Review Assessment */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Record Human Accuracy Audit
              </h4>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Reviewer Name</label>
                <input
                  type="text"
                  value={evalReviewer}
                  onChange={(e) => setEvalReviewer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Rating</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Helpful', 'Needs Improvement', 'Incorrect'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEvalRating(r)}
                      className={`py-2 rounded-lg text-xs font-semibold transition border ${
                        evalRating === r
                          ? r === 'Helpful'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : r === 'Needs Improvement'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="factualCheck"
                  checked={evalFactualConfirmed}
                  onChange={(e) => setEvalFactualConfirmed(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <label htmlFor="factualCheck" className="text-xs text-slate-300">
                  Confirmed factually grounded (no fabricated numbers or unverified causes)
                </label>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Reviewer Diagnostic Comments</label>
                <textarea
                  value={evalComments}
                  onChange={(e) => setEvalComments(e.target.value)}
                  placeholder="Notes on factual accuracy, missing context, or recommended prompt adjustments..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveEvaluation}
                disabled={!evalQuestion || !evalResponse}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition"
              >
                Save Evaluation Outcome
              </button>
            </div>
          </div>

          {/* Historical Log of Reviewed Evaluations */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Reviewed Test Case History ({evaluations.length})
            </h4>

            {evaluations.length === 0 ? (
              <p className="text-xs text-slate-500">No reviewed test cases recorded yet.</p>
            ) : (
              <div className="space-y-2 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Question</th>
                      <th className="py-2 px-3">Rating</th>
                      <th className="py-2 px-3">Factual Integrity</th>
                      <th className="py-2 px-3">Reviewer</th>
                      <th className="py-2 px-3">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.map((ev) => (
                      <tr key={ev.id} className="border-b border-slate-900 hover:bg-slate-900/60">
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{ev.timestamp}</td>
                        <td className="py-2 px-3 text-slate-200 font-medium max-w-xs truncate">{ev.question}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.rating === 'Helpful'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : ev.rating === 'Needs Improvement'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {ev.rating}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {ev.factualAccuracyConfirmed ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Grounded
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                              <AlertCircle className="w-3 h-3" /> Discrepancy
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-400">{ev.reviewerName}</td>
                        <td className="py-2 px-3 text-slate-300 max-w-sm truncate">{ev.reviewerComments || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
