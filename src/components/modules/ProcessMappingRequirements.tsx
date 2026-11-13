import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Layers,
  GitBranch,
  AlertTriangle,
  FileText,
  ListChecks,
  CheckCircle2,
  Check,
  Copy,
  Download,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Shield,
  Activity,
  UserCheck,
  Sparkles,
  HelpCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Eye,
  Code,
  Tag,
  AlertCircle,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';

import {
  ProcessRequirement,
  BusinessProblem,
  ProblemPriority,
  ProblemStatus,
  ProcessDiagram,
  ProcessNode,
  ProcessEdge,
  ProcessNodeType,
  OperationalBottleneck,
  BottleneckCategory,
  BusinessRequirement,
  FunctionalRequirement,
  NonFunctionalRequirement,
  StructuredUserStory,
  AcceptanceCriteriaItem,
  UATTestCase,
  TestCaseResult,
  RequirementPriority,
  RequirementStatus,
  AnalysisDocType,
} from '../../types';

import {
  getStoredProblems,
  saveStoredProblems,
  getStoredDiagrams,
  saveStoredDiagrams,
  getStoredBottlenecks,
  saveStoredBottlenecks,
  getStoredBusinessRequirements,
  saveStoredBusinessRequirements,
  getStoredFunctionalRequirements,
  saveStoredFunctionalRequirements,
  getStoredNFRs,
  saveStoredNFRs,
  getStoredUserStories,
  saveStoredUserStories,
  getStoredAcceptanceCriteria,
  saveStoredAcceptanceCriteria,
  getStoredTestCases,
  saveStoredTestCases,
  buildTraceabilityMatrix,
  resetPhase4Defaults,
} from '../../utils/requirementsStorage';

import { generateMermaidCode } from '../../utils/mermaidGenerator';
import { generateSpecificationDocument, DocumentMetadata } from '../../utils/brdGenerator';
import { fetchCopilot } from '../../utils/aiFetch';

interface ProcessMappingRequirementsProps {
  requirements: ProcessRequirement[];
  onSaveRequirements: (updated: ProcessRequirement[]) => void;
}

type MainTab =
  | 'problems'
  | 'mapping'
  | 'bottlenecks'
  | 'requirements'
  | 'stories'
  | 'criteria'
  | 'uat'
  | 'documents';

export const ProcessMappingRequirements: React.FC<ProcessMappingRequirementsProps> = ({
  requirements,
  onSaveRequirements,
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<MainTab>('problems');

  // Core Phase 4 State
  const [problems, setProblems] = useState<BusinessProblem[]>(() => getStoredProblems());
  const [selectedProblemId, setSelectedProblemId] = useState<string>(() => problems[0]?.id || 'PRB-001');
  const [diagrams, setDiagrams] = useState<ProcessDiagram[]>(() => getStoredDiagrams());
  const [bottlenecks, setBottlenecks] = useState<OperationalBottleneck[]>(() => getStoredBottlenecks());
  const [businessReqs, setBusinessReqs] = useState<BusinessRequirement[]>(() => getStoredBusinessRequirements());
  const [functionalReqs, setFunctionalReqs] = useState<FunctionalRequirement[]>(() => getStoredFunctionalRequirements());
  const [nfrs, setNfrs] = useState<NonFunctionalRequirement[]>(() => getStoredNFRs());
  const [userStories, setUserStories] = useState<StructuredUserStory[]>(() => getStoredUserStories());
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriteriaItem[]>(() => getStoredAcceptanceCriteria());
  const [testCases, setTestCases] = useState<UATTestCase[]>(() => getStoredTestCases());

  // Filter & Search states
  const [problemSearch, setProblemSearch] = useState('');
  const [problemDeptFilter, setProblemDeptFilter] = useState<string>('ALL');
  const [problemStatusFilter, setProblemStatusFilter] = useState<string>('ALL');

  // Process Mapping Studio states
  const [diagramMode, setDiagramMode] = useState<'As-Is' | 'To-Be'>('As-Is');
  const [showMermaidCode, setShowMermaidCode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);

  // Requirements Subtab
  const [reqSubTab, setReqSubTab] = useState<'BR' | 'FR' | 'NFR'>('BR');

  // Documents Generator state
  const [selectedDocType, setSelectedDocType] = useState<AnalysisDocType>('BRD');
  const [docMetadata, setDocMetadata] = useState<DocumentMetadata>({
    title: 'Flight Disruption Modernization Specification',
    version: '1.2.0',
    author: 'Salil Gokhale (Business Analyst (Portfolio Demo))',
    department: 'Customer Experience & Flight Operations',
    status: 'Approved',
    date: new Date().toISOString().split('T')[0],
    scope: 'Real-time telemetry ingestion, event-driven alerting, and multi-channel notification dispatch with one-tap digital voucher issuance.',
    assumptions: [
      'Passenger Booking API provides real-time passenger manifest with < 800ms latency.',
      'Customer phone numbers comply with TCPA / GDPR opt-in consent.',
      'Flight Status Feed broadcasts reliable takeoff and landing UTC timestamps.',
    ],
    risks: [
      'High-volume weather disruptions could temporarily saturate third-party SMS gateways.',
      'Inaccurate delay estimates could trigger meal vouchers prematurely.',
    ],
  });

  // Modal / Drawer states
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemToEdit, setProblemToEdit] = useState<BusinessProblem | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showAddEdgeModal, setShowAddEdgeModal] = useState(false);
  const [showAddBottleneckModal, setShowAddBottleneckModal] = useState(false);
  const [showAddBRModal, setShowAddBRModal] = useState(false);
  const [showAddFRModal, setShowAddFRModal] = useState(false);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [showAddCriteriaModal, setShowAddCriteriaModal] = useState(false);
  const [activeTestCaseForRun, setActiveTestCaseForRun] = useState<UATTestCase | null>(null);

  // AI Assistant Drawer state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMode, setAiMode] = useState<'BUSINESS_ANALYSIS' | 'USER_STORY_GENERATION'>('BUSINESS_ANALYSIS');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Clipboard & reset confirmation state
  const [copied, setCopied] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Active selected problem object
  const currentProblem = useMemo(() => {
    return problems.find((p) => p.id === selectedProblemId) || problems[0] || null;
  }, [problems, selectedProblemId]);

  // Active diagram for current problem and mode (never fall back to another problem's diagram)
  const currentDiagram = useMemo(() => {
    return diagrams.find((d) => d.problemId === selectedProblemId && d.mode === diagramMode) || null;
  }, [diagrams, selectedProblemId, diagramMode]);

  // Traceability Matrix calculation
  const traceabilityMatrix = useMemo(() => {
    return buildTraceabilityMatrix(problems, businessReqs, functionalReqs, userStories, testCases);
  }, [problems, businessReqs, functionalReqs, userStories, testCases]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(problemSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(problemSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(problemSearch.toLowerCase()) ||
        p.businessOwner.toLowerCase().includes(problemSearch.toLowerCase());
      const matchDept = problemDeptFilter === 'ALL' || p.department === problemDeptFilter;
      const matchStatus = problemStatusFilter === 'ALL' || p.status === problemStatusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [problems, problemSearch, problemDeptFilter, problemStatusFilter]);

  // ==========================================
  // HANDLERS & MUTATIONS
  // ==========================================

  const handleUpdateProblems = (updated: BusinessProblem[]) => {
    setProblems(updated);
    saveStoredProblems(updated);
  };

  const getNextPrefixedId = (items: { id: string }[], prefix: string, pad = 3) => {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}(\\d+)$`, 'i');
    const maxNum = items.reduce((max, item) => {
      const m = regex.exec(item.id);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0);
    return `${prefix}${pad > 0 ? String(maxNum + 1).padStart(pad, '0') : String(maxNum + 1)}`;
  };

  const handleUpdateDiagrams = (updated: ProcessDiagram[]) => {
    // Regenerate mermaid code for updated diagrams
    const withMermaid = updated.map((d) => ({
      ...d,
      mermaidCode: generateMermaidCode(d),
      lastModified: new Date().toISOString().split('T')[0],
    }));
    setDiagrams(withMermaid);
    saveStoredDiagrams(withMermaid);
  };

  const handleEnsureProblemDiagram = () => {
    if (currentDiagram) return currentDiagram;
    const prefix = diagramMode === 'As-Is' ? 'N' : 'TB';
    const starterDiagram: ProcessDiagram = {
      id: getNextPrefixedId(diagrams, 'DIAG-'),
      problemId: selectedProblemId,
      title: `${currentProblem ? currentProblem.title : selectedProblemId} (${diagramMode})`,
      mode: diagramMode,
      nodes: [
        {
          id: `${prefix}1`,
          label: 'Trigger Event',
          type: 'start',
          description: `Initial ${diagramMode} operational trigger for ${selectedProblemId}.`,
          durationMinutes: 0,
        },
      ],
      edges: [],
      mermaidCode: '',
      lastModified: new Date().toISOString().split('T')[0],
    };
    handleUpdateDiagrams([...diagrams, starterDiagram]);
    return starterDiagram;
  };

  const handleUpdateBottlenecks = (updated: OperationalBottleneck[]) => {
    setBottlenecks(updated);
    saveStoredBottlenecks(updated);
  };

  const handleUpdateBRs = (updated: BusinessRequirement[]) => {
    setBusinessReqs(updated);
    saveStoredBusinessRequirements(updated);
  };

  const handleUpdateFRs = (updated: FunctionalRequirement[]) => {
    setFunctionalReqs(updated);
    saveStoredFunctionalRequirements(updated);
  };

  const handleUpdateNFRs = (updated: NonFunctionalRequirement[]) => {
    setNfrs(updated);
    saveStoredNFRs(updated);
  };

  const handleUpdateUserStories = (updated: StructuredUserStory[]) => {
    setUserStories(updated);
    saveStoredUserStories(updated);
  };

  const handleUpdateCriteria = (updated: AcceptanceCriteriaItem[]) => {
    setAcceptanceCriteria(updated);
    saveStoredAcceptanceCriteria(updated);
  };

  const handleUpdateTestCases = (updated: UATTestCase[]) => {
    setTestCases(updated);
    saveStoredTestCases(updated);
  };

  // Reset to Certified Defaults
  const handleResetDefaults = () => {
    resetPhase4Defaults();
    setProblems(getStoredProblems());
    setDiagrams(getStoredDiagrams());
    setBottlenecks(getStoredBottlenecks());
    setBusinessReqs(getStoredBusinessRequirements());
    setFunctionalReqs(getStoredFunctionalRequirements());
    setNfrs(getStoredNFRs());
    setUserStories(getStoredUserStories());
    setAcceptanceCriteria(getStoredAcceptanceCriteria());
    setTestCases(getStoredTestCases());
    setConfirmingReset(false);
  };

  // AI Assistant Call
  const handleTriggerAI = async (mode: 'BUSINESS_ANALYSIS' | 'USER_STORY_GENERATION', initialText?: string) => {
    setAiMode(mode);
    setAiPrompt(initialText || (currentProblem ? `${currentProblem.title}\n\nCurrent Operational Process: ${currentProblem.currentProcess}\n\nFriction / Business Impact: ${currentProblem.businessImpact}\n\nDesired Outcome: ${currentProblem.desiredOutcome}` : 'Analyze airline gate disruption process.'));
    setAiResponse('');
    setAiError(null);
    setShowAiModal(true);
  };

  const handleRunAiPrompt = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError(null);

    try {
      const data = await fetchCopilot({
        message: aiPrompt,
        mode: aiMode,
        context: {
          problem: currentProblem,
          selectedProblemId,
        },
      });

      setAiResponse(data.reply || 'No response returned from model.');
    } catch (err: any) {
      setAiError(err.message || 'An error occurred while contacting AI services.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Export Markdown Document
  const handleDownloadDoc = () => {
    const content = generateSpecificationDocument(selectedDocType, docMetadata, {
      problem: currentProblem || undefined,
      allProblems: problems,
      diagrams,
      bottlenecks,
      businessReqs,
      functionalReqs,
      nfrs,
      userStories,
      acceptanceCriteria,
      testCases,
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedDocType}_${selectedProblemId}_${docMetadata.date}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Copy Document Markdown
  const handleCopyDoc = () => {
    const content = generateSpecificationDocument(selectedDocType, docMetadata, {
      problem: currentProblem || undefined,
      allProblems: problems,
      diagrams,
      bottlenecks,
      businessReqs,
      functionalReqs,
      nfrs,
      userStories,
      acceptanceCriteria,
      testCases,
    });
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Module Navigation Header */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Process Mapping & Requirements Engineering</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800/60 text-blue-300">
                  Phase 4 Enterprise
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Convert operational airline friction into structured problem registers, As-Is/To-Be process flowcharts, functional specifications, user stories, and verifiable UAT test matrices.
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleTriggerAI('BUSINESS_ANALYSIS')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-950/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Business Analyst</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>BRD & Exports</span>
          </button>

          {!confirmingReset ? (
            <button
              onClick={() => setConfirmingReset(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800 transition-colors cursor-pointer"
              title="Reset to baseline sample dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetDefaults}
                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Sub-Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80 text-xs">
        <button
          onClick={() => setActiveTab('problems')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'problems'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Problem Registry ({problems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mapping')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'mapping'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Process Mapping Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('bottlenecks')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'bottlenecks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Bottleneck Analysis ({bottlenecks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'requirements'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Requirements ({businessReqs.length + functionalReqs.length + nfrs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'stories'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>User Stories ({userStories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('criteria')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'criteria'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>Acceptance Criteria ({acceptanceCriteria.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('uat')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'uat'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>UAT & Traceability Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>BRD Generator</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* 1. BUSINESS PROBLEM REGISTRY */}
      {/* ========================================== */}
      {activeTab === 'problems' && (
        <div className="space-y-6">
          {/* KPI Summary Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Problems</span>
              <div className="text-xl font-bold text-slate-100 mt-1">{problems.length}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Registered Operational Friction</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold">Under Analysis</span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {problems.filter((p) => p.status === 'Under Analysis' || p.status === 'Open').length}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Root cause discovery</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-blue-400 uppercase tracking-wider font-semibold">Requirements Drafted</span>
              <div className="text-xl font-bold text-blue-400 mt-1">
                {problems.filter((p) => p.status === 'Requirements Drafted' || p.status === 'Solution In-Progress').length}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">BRD/FRD in progress</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold">Resolved</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {problems.filter((p) => p.status === 'Resolved').length}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Automated solutions live</span>
            </div>
          </div>

          {/* Search, Filter & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search problems, owners, departments..."
                  value={problemSearch}
                  onChange={(e) => setProblemSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={problemDeptFilter}
                onChange={(e) => setProblemDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Customer Experience">Customer Experience</option>
                <option value="OCC & Dispatch">OCC & Dispatch</option>
                <option value="Flight Operations">Flight Operations</option>
                <option value="Ground Handling">Ground Handling</option>
                <option value="Crew Planning">Crew Planning</option>
              </select>
            </div>

            <button
              onClick={() => {
                setProblemToEdit(null);
                setShowProblemModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Problem</span>
            </button>
          </div>

          {/* Problems List & Detailed Preview Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Problem List Pane */}
            <div className="lg:col-span-5 space-y-3">
              {filteredProblems.map((p) => {
                const isSelected = p.id === selectedProblemId;
                const priorityColor =
                  p.priority === 'Critical'
                    ? 'text-rose-400 bg-rose-950/60 border-rose-800'
                    : p.priority === 'High'
                    ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                    : 'text-blue-400 bg-blue-950/60 border-blue-800';

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProblemId(p.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-950/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {p.id}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityColor}`}>
                          {p.priority}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{p.status}</span>
                    </div>

                    <h3 className="text-xs font-semibold text-slate-100 mt-2 line-clamp-1">{p.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>

                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <span>{p.department}</span>
                      {p.linkedOpportunityId && (
                        <span className="text-purple-400 font-mono flex items-center gap-1">
                          <span>Linked: {p.linkedOpportunityId}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredProblems.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl bg-slate-900/50 border border-slate-800">
                  No business problems match the selected filters.
                </div>
              )}
            </div>

            {/* Problem Detailed Inspector */}
            <div className="lg:col-span-7">
              {currentProblem ? (
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
                  {/* Problem Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-400">{currentProblem.id}</span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-xs text-slate-300 font-medium">{currentProblem.department}</span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-xs text-slate-400">Owner: {currentProblem.businessOwner}</span>
                      </div>
                      <h2 className="text-base font-bold text-slate-100 mt-1">{currentProblem.title}</h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTriggerAI('BUSINESS_ANALYSIS')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-xs font-medium border border-blue-500/30 transition-colors cursor-pointer"
                        title="Decompose problem using Gemini AI"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>AI Decompose</span>
                      </button>

                      <button
                        onClick={() => {
                          setProblemToEdit(currentProblem);
                          setShowProblemModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
                        title="Edit problem details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Core Description & Financial Impact */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Operational Problem Description:</span>
                      <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                        {currentProblem.description}
                      </p>
                    </div>

                    <div>
                      <span className="text-rose-400 font-semibold block mb-1">Business Impact & Friction Cost:</span>
                      <p className="text-slate-300 leading-relaxed bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
                        {currentProblem.businessImpact}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-1">Current Manual Process:</span>
                        <p className="text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                          {currentProblem.currentProcess}
                        </p>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-semibold block mb-1">Target Desired Outcome:</span>
                        <p className="text-slate-300 leading-relaxed bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30">
                          {currentProblem.desiredOutcome}
                        </p>
                      </div>
                    </div>

                    {/* Stakeholders & Dependencies */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-300">Key Business Stakeholders:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentProblem.stakeholders.map((s, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <span className="text-[11px] font-semibold text-purple-400">System Dependencies:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentProblem.dependencies.map((d, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 font-mono"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Shortcuts to Other Workspaces */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Status:</span>
                        <select
                          value={currentProblem.status}
                          onChange={(e) => {
                            const updated = problems.map((p) =>
                              p.id === currentProblem.id
                                ? { ...p, status: e.target.value as ProblemStatus, updatedAt: new Date().toISOString().split('T')[0] }
                                : p
                            );
                            handleUpdateProblems(updated);
                          }}
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-blue-400 font-semibold focus:outline-none"
                        >
                          <option value="Open">Open</option>
                          <option value="Under Analysis">Under Analysis</option>
                          <option value="Requirements Drafted">Requirements Drafted</option>
                          <option value="Solution In-Progress">Solution In-Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('mapping')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                        >
                          <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                          <span>View Process Map</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('requirements')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
                        >
                          <span>View Requirements</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs rounded-2xl bg-slate-900/50 border border-slate-800">
                  Select a business problem from the left to view details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. PROCESS MAPPING STUDIO */}
      {/* ========================================== */}
      {activeTab === 'mapping' && (
        <div className="space-y-6">
          {/* Top Controls: As-Is / To-Be Toggle & Mermaid View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Target Problem:</span>
              <select
                value={selectedProblemId}
                onChange={(e) => setSelectedProblemId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-blue-400 font-semibold focus:outline-none"
              >
                {problems.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.id}] {p.title}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setDiagramMode('As-Is')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    diagramMode === 'As-Is' ? 'bg-rose-950 text-rose-300 border border-rose-800/80' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  As-Is Baseline
                </button>
                <button
                  onClick={() => setDiagramMode('To-Be')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    diagramMode === 'To-Be' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  To-Be Target State
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMermaidCode(!showMermaidCode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  showMermaidCode
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showMermaidCode ? 'Visual Flow' : 'Mermaid Code'}</span>
              </button>

              <button
                onClick={() => {
                  if (!currentDiagram) handleEnsureProblemDiagram();
                  setShowAddNodeModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Node</span>
              </button>

              <button
                onClick={() => setShowAddEdgeModal(true)}
                disabled={!currentDiagram || currentDiagram.nodes.length < 2}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Connect Nodes</span>
              </button>
            </div>
          </div>

          {/* Diagram Canvas */}
          {currentDiagram ? (
            showMermaidCode ? (
              /* Mermaid Flowchart Code View */
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    Generated Mermaid Flowchart Definition ({currentDiagram.mode})
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentDiagram.mermaidCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Mermaid Code'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                  {currentDiagram.mermaidCode}
                </pre>
                <p className="text-[11px] text-slate-500">
                  Tip: Paste this code into Mermaid Live Editor or documentation engines for high-resolution SVG exports.
                </p>
              </div>
            ) : (
              /* Visual Interactive Flowchart Canvas */
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        <span>{currentDiagram.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-blue-400 border border-slate-800">
                          {currentDiagram.nodes.length} Nodes &bull; {currentDiagram.edges.length} Transitions
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click on any node to inspect execution time, system dependencies, or toggle bottleneck status.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30" /> Bottleneck
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Decision / Approval
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Activity
                      </span>
                    </div>
                  </div>

                  {/* Flow Sequence Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentDiagram.nodes.map((node, idx) => {
                      const isSelected = selectedNode?.id === node.id;
                      const isBottleneck = node.isBottleneck;

                      let badgeColor = 'bg-slate-800 text-slate-300';
                      if (node.type === 'start' || node.type === 'end') badgeColor = 'bg-blue-950 text-blue-300 border border-blue-800';
                      else if (node.type === 'decision' || node.type === 'approval') badgeColor = 'bg-indigo-950 text-indigo-300 border border-indigo-800';
                      else if (node.type === 'input_output') badgeColor = 'bg-teal-950 text-teal-300 border border-teal-800';
                      else if (node.type === 'exception') badgeColor = 'bg-rose-950 text-rose-300 border border-rose-800';

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-4 rounded-xl border relative cursor-pointer transition-all ${
                            isBottleneck
                              ? 'bg-rose-950/20 border-rose-500/60 shadow-md shadow-rose-950/30'
                              : isSelected
                              ? 'bg-blue-950/30 border-blue-500/80 shadow-md shadow-blue-950/40'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[10px] font-bold text-slate-400">
                              #{idx + 1} &bull; {node.id}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${badgeColor}`}>
                              {node.type}
                            </span>
                          </div>

                          <h4 className="text-xs font-semibold text-slate-100 flex items-center justify-between">
                            <span>{node.label}</span>
                            {isBottleneck && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white shrink-0">
                                BOTTLENECK
                              </span>
                            )}
                          </h4>

                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {node.description}
                          </p>

                          <div className="flex items-center justify-between pt-2 mt-2.5 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                            {node.durationMinutes ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {node.durationMinutes} min
                              </span>
                            ) : (
                              <span className="text-slate-500">&lt; 1 sec</span>
                            )}
                            <span className="text-slate-500">{node.owner || 'Automated'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Connected Transitions Table */}
                  <div className="pt-4 border-t border-slate-800">
                    <span className="text-xs font-semibold text-slate-300 block mb-2">
                      Configured Sequence Transitions ({currentDiagram.edges.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {currentDiagram.edges.map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-400 font-bold">{e.from}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="text-emerald-400 font-bold">{e.to}</span>
                          </div>
                          {e.label && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">[{e.label}]</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Node Inspector Drawer */}
                {selectedNode && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400">{selectedNode.id}</span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="font-semibold text-slate-200">{selectedNode.label}</span>
                        <span className="text-slate-500">({selectedNode.type})</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{selectedNode.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const updatedNodes = currentDiagram.nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, isBottleneck: !n.isBottleneck } : n
                          );
                          const updatedDiagrams = diagrams.map((d) =>
                            d.id === currentDiagram.id ? { ...d, nodes: updatedNodes } : d
                          );
                          handleUpdateDiagrams(updatedDiagrams);
                          setSelectedNode({ ...selectedNode, isBottleneck: !selectedNode.isBottleneck });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          selectedNode.isBottleneck
                            ? 'bg-rose-900/50 text-rose-300 border border-rose-700'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {selectedNode.isBottleneck ? 'Remove Bottleneck Flag' : 'Mark as Bottleneck'}
                      </button>

                      <button
                        onClick={() => {
                          const updatedNodes = currentDiagram.nodes.filter((n) => n.id !== selectedNode.id);
                          const updatedEdges = currentDiagram.edges.filter(
                            (e) => e.from !== selectedNode.id && e.to !== selectedNode.id
                          );
                          const updatedDiagrams = diagrams.map((d) =>
                            d.id === currentDiagram.id ? { ...d, nodes: updatedNodes, edges: updatedEdges } : d
                          );
                          handleUpdateDiagrams(updatedDiagrams);
                          setSelectedNode(null);
                        }}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-800/40 cursor-pointer"
                        title="Delete this node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setSelectedNode(null)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <p>
                No {diagramMode} process map exists yet for <strong className="text-blue-400">{selectedProblemId}</strong>.
              </p>
              <button
                onClick={handleEnsureProblemDiagram}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Initialize {diagramMode} Process Map for {selectedProblemId}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 3. BOTTLENECK ANALYSIS */}
      {/* ========================================== */}
      {activeTab === 'bottlenecks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Operational Bottleneck & Friction Inventory</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quantify processing delays, manual handoffs, repeated data entries, and link directly to Phase 3 Automation Opportunities.
              </p>
            </div>

            <button
              onClick={() => setShowAddBottleneckModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Bottleneck</span>
            </button>
          </div>

          {/* Bottleneck Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bottlenecks.map((btn) => {
              const severityColor =
                btn.severity === 'Critical'
                  ? 'text-rose-400 bg-rose-950/60 border-rose-800'
                  : btn.severity === 'High'
                  ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                  : 'text-blue-400 bg-blue-950/60 border-blue-800';

              return (
                <div
                  key={btn.id}
                  className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {btn.id}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${severityColor}`}>
                        {btn.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {btn.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> +{btn.estimatedDelayMinutes}m delay
                      </span>
                      <button
                        onClick={() => {
                          const updated = bottlenecks.filter((b) => b.id !== btn.id);
                          handleUpdateBottlenecks(updated);
                        }}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        title="Delete bottleneck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-100">{btn.title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                    {btn.impactDescription}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-emerald-400 font-semibold block">Proposed Mitigation Strategy:</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{btn.mitigationStrategy}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <span>Problem Link: <strong className="text-slate-300">{btn.problemId}</strong></span>
                    {btn.linkedOpportunityId ? (
                      <span className="text-purple-400 font-mono font-medium">
                        Linked Automation: {btn.linkedOpportunityId}
                      </span>
                    ) : (
                      <span>No Phase 3 link</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. REQUIREMENTS ENGINEERING (BR, FR, NFR) */}
      {/* ========================================== */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          {/* Sub-selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReqSubTab('BR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  reqSubTab === 'BR'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Business Requirements ({businessReqs.length})
              </button>
              <button
                onClick={() => setReqSubTab('FR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  reqSubTab === 'FR'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Functional Requirements ({functionalReqs.length})
              </button>
              <button
                onClick={() => setReqSubTab('NFR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  reqSubTab === 'NFR'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Non-Functional Requirements ({nfrs.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {reqSubTab === 'BR' && (
                <button
                  onClick={() => setShowAddBRModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Business Requirement</span>
                </button>
              )}
              {reqSubTab === 'FR' && (
                <button
                  onClick={() => setShowAddFRModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Functional Requirement</span>
                </button>
              )}
            </div>
          </div>

          {/* Subtab Content: Business Requirements */}
          {reqSubTab === 'BR' && (
            <div className="space-y-3">
              {businessReqs.map((br) => (
                <div
                  key={br.id}
                  className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                        {br.id}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        {br.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Status: {br.status}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Parent: {br.problemId}</span>
                      <button
                        onClick={() => {
                          const updated = businessReqs.filter((b) => b.id !== br.id);
                          handleUpdateBRs(updated);
                        }}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        title="Delete requirement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">{br.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {br.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Business Rationale:</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{br.businessRationale}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-400 font-semibold block mb-0.5">Dependencies:</span>
                      <p className="text-[11px] text-purple-300/80 font-mono">{br.dependencies.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <span>Key Stakeholder: <strong className="text-slate-300">{br.stakeholder}</strong></span>
                    <span>Created: {br.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subtab Content: Functional Requirements */}
          {reqSubTab === 'FR' && (
            <div className="space-y-4">
              {functionalReqs.map((fr) => (
                <div
                  key={fr.id}
                  className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                        {fr.id}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        {fr.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Linked BR: {fr.businessReqId}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Status: {fr.status}</span>
                      <button
                        onClick={() => {
                          const updated = functionalReqs.filter((f) => f.id !== fr.id);
                          handleUpdateFRs(updated);
                        }}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        title="Delete requirement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">{fr.title}</h4>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] text-slate-400 font-semibold block">System Behavior:</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                      {fr.systemBehavior}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-blue-400 font-semibold uppercase block">Inputs:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 font-mono">
                        {fr.inputs.map((inp, idx) => (
                          <li key={idx}>{inp}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase block">Expected Outputs:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300 font-mono">
                        {fr.expectedOutputs.map((out, idx) => (
                          <li key={idx}>{out}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-amber-400 font-semibold uppercase block">Validation Rules:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                        {fr.validationRules.map((v, idx) => (
                          <li key={idx}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>
                      <strong className="text-rose-400">Error Handling:</strong> {fr.errorHandling}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subtab Content: Non-Functional Requirements */}
          {reqSubTab === 'NFR' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nfrs.map((nfr) => (
                <div
                  key={nfr.id}
                  className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {nfr.id}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        {nfr.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-400">{nfr.priority}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">{nfr.title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    {nfr.specification}
                  </p>

                  <div className="pt-1">
                    <span className="text-[10px] text-emerald-400 font-semibold block">Target Metric & Benchmark:</span>
                    <p className="text-[11px] text-slate-200 font-mono mt-0.5">{nfr.metricTarget}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 5. STRUCTURED USER STORIES */}
      {/* ========================================== */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>Agile User Story Catalogue</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard format: <code>As a [role], I want [capability], so that [benefit]</code> linked to functional requirements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTriggerAI('USER_STORY_GENERATION')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Generate Stories</span>
              </button>

              <button
                onClick={() => setShowAddStoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Story</span>
              </button>
            </div>
          </div>

          {/* User Stories Cards */}
          <div className="space-y-3">
            {userStories.map((story) => (
              <div
                key={story.id}
                className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                      {story.id}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      Priority: {story.priority}
                    </span>
                    {story.functionalReqId && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                        {story.functionalReqId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={story.status}
                      onChange={(e) => {
                        const updated = userStories.map((s) =>
                          s.id === story.id ? { ...s, status: e.target.value as any } : s
                        );
                        handleUpdateUserStories(updated);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-blue-400 font-semibold focus:outline-none"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Approved">Approved</option>
                      <option value="Ready for Dev">Ready for Dev</option>
                    </select>

                    <button
                      onClick={() => {
                        const updated = userStories.filter((s) => s.id !== story.id);
                        handleUpdateUserStories(updated);
                      }}
                      className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                      title="Delete story"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs leading-relaxed text-slate-200">
                  <span className="text-slate-400 font-bold">As a</span>{' '}
                  <span className="text-blue-300 font-semibold">{story.role}</span>,{' '}
                  <span className="text-slate-400 font-bold">I want</span>{' '}
                  <span className="text-slate-100 font-medium">{story.want}</span>,{' '}
                  <span className="text-slate-400 font-bold">so that</span>{' '}
                  <span className="text-emerald-300 font-medium">{story.benefit}</span>.
                </div>

                {/* Linked Criteria Summary */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    Linked Acceptance Criteria:{' '}
                    <strong className="text-blue-400">
                      {acceptanceCriteria.filter((ac) => ac.userStoryId === story.id).length}
                    </strong>
                  </span>
                  <button
                    onClick={() => setActiveTab('criteria')}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View in Criteria Builder</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 6. ACCEPTANCE CRITERIA BUILDER */}
      {/* ========================================== */}
      {activeTab === 'criteria' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <span>Given / When / Then Acceptance Criteria</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured verification rules across Positive, Negative, Boundary, Permission, and Validation types.
              </p>
            </div>

            <button
              onClick={() => setShowAddCriteriaModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Acceptance Criteria</span>
            </button>
          </div>

          {/* Criteria Cards */}
          <div className="space-y-3">
            {acceptanceCriteria.map((ac) => (
              <div
                key={ac.id}
                className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {ac.id}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      Type: {ac.type}
                    </span>
                    <span className="text-[10px] font-mono text-blue-400">Parent: {ac.userStoryId}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ac.requiresHumanApproval && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        Human Sign-off Required
                      </span>
                    )}

                    <button
                      onClick={() => {
                        const updated = acceptanceCriteria.filter((a) => a.id !== ac.id);
                        handleUpdateCriteria(updated);
                      }}
                      className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                      title="Delete criteria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-100">{ac.title}</h4>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-amber-400 font-bold font-mono uppercase text-[10px] mr-2">Given</span>
                    <span className="text-slate-300">{ac.given}</span>
                  </div>
                  <div>
                    <span className="text-blue-400 font-bold font-mono uppercase text-[10px] mr-2">When</span>
                    <span className="text-slate-200">{ac.when}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold font-mono uppercase text-[10px] mr-2">Then</span>
                    <span className="text-slate-200">{ac.then}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 7. UAT & TRACEABILITY MATRIX */}
      {/* ========================================== */}
      {activeTab === 'uat' && (
        <div className="space-y-6">
          {/* UAT Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Test Cases</span>
              <div className="text-xl font-bold text-slate-100 mt-1">{testCases.length}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Empirical test scenarios</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold">Passed</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {testCases.filter((t) => t.status === 'Pass').length}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Verified in test environment</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold">Not Tested</span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {testCases.filter((t) => t.status === 'Not Tested').length}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Awaiting test execution</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-rose-400 uppercase tracking-wider font-semibold">Failed / Blocked</span>
              <div className="text-xl font-bold text-rose-400 mt-1">
                {testCases.filter((t) => t.status === 'Fail' || t.status === 'Blocked').length}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Requires remediation</span>
            </div>
          </div>

          {/* Traceability Matrix Table */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>End-to-End Requirements Traceability Matrix (RTM)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete chain of custody: Problem &rarr; Business Req &rarr; Functional Req &rarr; User Story &rarr; Test Case.
                </p>
              </div>

              <span className="text-xs font-mono font-semibold text-blue-400">
                {traceabilityMatrix.filter((m) => m.coverageStatus === 'Fully Covered').length} of {traceabilityMatrix.length} Fully Covered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">Problem ID</th>
                    <th className="pb-2 font-semibold">Business Req</th>
                    <th className="pb-2 font-semibold">Functional Req</th>
                    <th className="pb-2 font-semibold">User Story</th>
                    <th className="pb-2 font-semibold">Test Case</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {traceabilityMatrix.map((item, idx) => {
                    const statusColor =
                      item.testStatus === 'Pass'
                        ? 'text-emerald-400'
                        : item.testStatus === 'Fail'
                        ? 'text-rose-400'
                        : item.testStatus === 'Blocked'
                        ? 'text-amber-400'
                        : 'text-slate-500';

                    const coverageColor =
                      item.coverageStatus === 'Fully Covered'
                        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                        : 'text-amber-400 bg-amber-950/60 border-amber-800';

                    return (
                      <tr key={idx} className="hover:bg-slate-950/40">
                        <td className="py-2.5 font-bold text-blue-400">{item.problemId}</td>
                        <td className="py-2.5 text-slate-300">{item.businessReqId}</td>
                        <td className="py-2.5 text-emerald-300">{item.functionalReqId}</td>
                        <td className="py-2.5 text-slate-400">{item.userStoryId}</td>
                        <td className="py-2.5 text-blue-300">{item.testCaseId}</td>
                        <td className={`py-2.5 font-bold ${statusColor}`}>{item.testStatus}</td>
                        <td className="py-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${coverageColor}`}>
                            {item.coverageStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test Case Execution Registry */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>UAT Test Cases & Verification Results</span>
            </h3>

            <div className="space-y-3">
              {testCases.map((tc) => (
                <div
                  key={tc.id}
                  className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {tc.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Linked: {tc.linkedReqId}</span>
                      <span className="text-[10px] text-slate-500">Reviewer: {tc.reviewer}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={tc.status}
                        onChange={(e) => {
                          const updated = testCases.map((t) =>
                            t.id === tc.id
                              ? {
                                  ...t,
                                  status: e.target.value as TestCaseResult,
                                  executedAt: new Date().toISOString(),
                                }
                              : t
                          );
                          handleUpdateTestCases(updated);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="Not Tested">Not Tested</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Blocked">Blocked</option>
                      </select>

                      <button
                        onClick={() => setActiveTestCaseForRun(tc)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Log Execution</span>
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">{tc.scenario}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Preconditions:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                        {tc.preconditions.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-blue-400 font-semibold block uppercase">Test Steps:</span>
                      <div className="space-y-0.5 text-[11px] text-slate-300 font-mono">
                        {tc.testSteps.map((s, i) => (
                          <div key={i}>{s}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                      <span className="text-emerald-400 font-semibold block mb-0.5">Expected Result:</span>
                      <p className="text-slate-300">{tc.expectedResult}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                      <span className="text-blue-400 font-semibold block mb-0.5">Actual Recorded Result:</span>
                      <p className="text-slate-200">{tc.actualResult}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Notes: {tc.comments}</span>
                    <span>Executed: {tc.executedAt || 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 8. DOCUMENTATION & BRD GENERATOR */}
      {/* ========================================== */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Enterprise Specification & BRD Generator</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate formal Business Requirements Documents (BRD), Functional Specifications (FRD), Process Reports, and Traceability Matrices.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCopyDoc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
              <button
                onClick={handleDownloadDoc}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>

          {/* Document Type Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { id: 'BRD', label: 'Business Req. (BRD)' },
              { id: 'FRD', label: 'Functional (FRD)' },
              { id: 'Process_Report', label: 'Process Report' },
              { id: 'Improvement_Proposal', label: 'Proposal' },
              { id: 'User_Story_Catalogue', label: 'Story Catalogue' },
              { id: 'UAT_Plan', label: 'UAT Test Plan' },
              { id: 'RTM', label: 'Traceability (RTM)' },
            ].map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocType(doc.id as AnalysisDocType)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedDocType === doc.id
                    ? 'bg-blue-950/40 border-blue-500/80 text-white shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-semibold block">{doc.label}</span>
              </button>
            ))}
          </div>

          {/* Document Preview Canvas */}
          <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap overflow-x-auto">
            {generateSpecificationDocument(selectedDocType, docMetadata, {
              problem: currentProblem || undefined,
              allProblems: problems,
              diagrams,
              bottlenecks,
              businessReqs,
              functionalReqs,
              nfrs,
              userStories,
              acceptanceCriteria,
              testCases,
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: REGISTER / EDIT BUSINESS PROBLEM */}
      {/* ========================================== */}
      {showProblemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <span>{problemToEdit ? 'Edit Business Problem' : 'Register New Business Problem'}</span>
              </h3>
              <button onClick={() => setShowProblemModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              key={problemToEdit?.id || 'new'}
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const parseCommaList = (field: string) =>
                  ((formData.get(field) as string) || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);

                const newProblem: BusinessProblem = {
                  id: problemToEdit ? problemToEdit.id : getNextPrefixedId(problems, 'PRB-'),
                  title: formData.get('title') as string,
                  department: formData.get('department') as any,
                  description: formData.get('description') as string,
                  businessImpact: formData.get('businessImpact') as string,
                  currentProcess: formData.get('currentProcess') as string,
                  desiredOutcome: formData.get('desiredOutcome') as string,
                  priority: formData.get('priority') as ProblemPriority,
                  businessOwner: formData.get('businessOwner') as string,
                  stakeholders: parseCommaList('stakeholders'),
                  dependencies: parseCommaList('dependencies'),
                  risks: parseCommaList('risks'),
                  status: (formData.get('status') as ProblemStatus) || problemToEdit?.status || 'Open',
                  linkedOpportunityId: ((formData.get('linkedOpportunityId') as string) || '').trim() || undefined,
                  createdAt: problemToEdit ? problemToEdit.createdAt : new Date().toISOString().split('T')[0],
                  updatedAt: new Date().toISOString().split('T')[0],
                };

                if (problemToEdit) {
                  const updated = problems.map((p) => (p.id === problemToEdit.id ? newProblem : p));
                  handleUpdateProblems(updated);
                } else {
                  handleUpdateProblems([...problems, newProblem]);
                  setSelectedProblemId(newProblem.id);
                }

                setShowProblemModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Problem Title:</label>
                  <input
                    name="title"
                    required
                    defaultValue={problemToEdit?.title || ''}
                    placeholder="e.g. Turnaround Baggage Hold Exception Delays"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department:</label>
                  <select
                    name="department"
                    defaultValue={problemToEdit?.department || 'Flight Operations'}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Flight Operations">Flight Operations</option>
                    <option value="OCC & Dispatch">OCC & Dispatch</option>
                    <option value="Customer Experience">Customer Experience</option>
                    <option value="Ground Handling">Ground Handling</option>
                    <option value="Crew Planning">Crew Planning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Problem Description:</label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  defaultValue={problemToEdit?.description || ''}
                  placeholder="Detail the operational friction, manual steps, and frequency..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-rose-400 mb-1">Business Impact & Friction Cost:</label>
                <textarea
                  name="businessImpact"
                  required
                  rows={2}
                  defaultValue={problemToEdit?.businessImpact || ''}
                  placeholder="Estimated delay minutes, financial compensation, gate holds..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Current Process (As-Is):</label>
                  <input
                    name="currentProcess"
                    required
                    defaultValue={problemToEdit?.currentProcess || ''}
                    placeholder="e.g. Radio calls and paper loadsheet verification"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 mb-1">Desired Outcome (To-Be):</label>
                  <input
                    name="desiredOutcome"
                    required
                    defaultValue={problemToEdit?.desiredOutcome || ''}
                    placeholder="e.g. Real-time scanner sync with zero gate holds"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority:</label>
                  <select
                    name="priority"
                    defaultValue={problemToEdit?.priority || 'High'}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Business Owner:</label>
                  <input
                    name="businessOwner"
                    required
                    defaultValue={problemToEdit?.businessOwner || ''}
                    placeholder="e.g. VP of Flight Operations"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-400 mb-1">Linked Opportunity ID:</label>
                  <input
                    name="linkedOpportunityId"
                    defaultValue={problemToEdit?.linkedOpportunityId || ''}
                    placeholder="e.g. OPP-101"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Stakeholders (comma separated):</label>
                  <input
                    name="stakeholders"
                    defaultValue={problemToEdit?.stakeholders.join(', ') || ''}
                    placeholder="OCC Manager, Chief Pilot, Gate Supervisor"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">System Dependencies (comma separated):</label>
                  <input
                    name="dependencies"
                    defaultValue={problemToEdit?.dependencies.join(', ') || ''}
                    placeholder="Flight Status Feed, Booking API, SMS Gateway"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-rose-400 mb-1">Operational Risks (comma separated):</label>
                  <input
                    name="risks"
                    defaultValue={problemToEdit?.risks?.join(', ') || ''}
                    placeholder="Manual override errors, Missed SLA alerts"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Workflow Status:</label>
                  <select
                    name="status"
                    defaultValue={problemToEdit?.status || 'Open'}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Under Analysis">Under Analysis</option>
                    <option value="Requirements Drafted">Requirements Drafted</option>
                    <option value="Solution In-Progress">Solution In-Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProblemModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  {problemToEdit ? 'Save Changes' : 'Register Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD NODE TO PROCESS MAP */}
      {/* ========================================== */}
      {showAddNodeModal && currentDiagram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Add Node to {currentDiagram.mode} Workflow</span>
              </h3>
              <button onClick={() => setShowAddNodeModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const prefix = currentDiagram.mode === 'As-Is' ? 'N' : 'TB';
                const newNode: ProcessNode = {
                  id: getNextPrefixedId(currentDiagram.nodes, prefix, 0),
                  label: formData.get('label') as string,
                  type: formData.get('type') as ProcessNodeType,
                  description: formData.get('description') as string,
                  owner: (formData.get('owner') as string) || undefined,
                  durationMinutes: formData.get('durationMinutes') ? Number(formData.get('durationMinutes')) : 0,
                  isBottleneck: formData.get('isBottleneck') === 'true',
                };

                const updated = diagrams.map((d) =>
                  d.id === currentDiagram.id
                    ? { ...d, nodes: [...d.nodes, newNode] }
                    : d
                );
                handleUpdateDiagrams(updated);
                setShowAddNodeModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-400 mb-1">Step Label / Action:</label>
                <input
                  name="label"
                  required
                  placeholder="e.g. Validate Passenger Connection Time"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Node Type:</label>
                  <select
                    name="type"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="activity">Activity / Task</option>
                    <option value="decision">Decision</option>
                    <option value="approval">Approval</option>
                    <option value="input_output">Data Input/Output</option>
                    <option value="handoff">Handoff</option>
                    <option value="exception">Exception Path</option>
                    <option value="start">Start</option>
                    <option value="end">End</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Duration (minutes):</label>
                  <input
                    name="durationMinutes"
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description:</label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  placeholder="Describe step activities and systems used..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="isBottleneck" name="isBottleneck" value="true" className="rounded" />
                <label htmlFor="isBottleneck" className="text-rose-400 font-semibold cursor-pointer">
                  Mark as Operational Bottleneck Node
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddNodeModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Insert Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CONNECT NODES (ADD EDGE) */}
      {/* ========================================== */}
      {showAddEdgeModal && currentDiagram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <span>Connect Sequence Transition</span>
              </h3>
              <button onClick={() => setShowAddEdgeModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const fromId = formData.get('from') as string;
                const toId = formData.get('to') as string;
                if (!fromId || !toId || fromId === toId) return;

                const newEdge: ProcessEdge = {
                  from: fromId,
                  to: toId,
                  label: (formData.get('label') as string) || undefined,
                  isException: formData.get('isException') === 'true',
                };

                const updated = diagrams.map((d) =>
                  d.id === currentDiagram.id
                    ? { ...d, edges: [...d.edges, newEdge] }
                    : d
                );
                handleUpdateDiagrams(updated);
                setShowAddEdgeModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">From Node:</label>
                  <select
                    name="from"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {currentDiagram.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.id}: {n.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">To Node (must differ from From):</label>
                  <select
                    name="to"
                    defaultValue={currentDiagram.nodes[1]?.id || currentDiagram.nodes[0]?.id}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {currentDiagram.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.id}: {n.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Transition Label (optional):</label>
                <input
                  name="label"
                  placeholder="e.g. Yes / Approved / Delay > 20m"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="isException" name="isException" value="true" className="rounded" />
                <label htmlFor="isException" className="text-amber-400 font-semibold cursor-pointer">
                  Exception Transition (dashed arrow)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEdgeModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Create Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD OPERATIONAL BOTTLENECK */}
      {/* ========================================== */}
      {showAddBottleneckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Record Operational Bottleneck</span>
              </h3>
              <button onClick={() => setShowAddBottleneckModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const newBottleneck: OperationalBottleneck = {
                  id: getNextPrefixedId(bottlenecks, 'BTN-'),
                  problemId: selectedProblemId,
                  title: formData.get('title') as string,
                  category: formData.get('category') as BottleneckCategory,
                  impactDescription: formData.get('impactDescription') as string,
                  estimatedDelayMinutes: Number(formData.get('estimatedDelayMinutes')) || 15,
                  linkedOpportunityId: (formData.get('linkedOpportunityId') as string) || undefined,
                  severity: formData.get('severity') as any,
                  mitigationStrategy: formData.get('mitigationStrategy') as string,
                };

                handleUpdateBottlenecks([...bottlenecks, newBottleneck]);
                setShowAddBottleneckModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-400 mb-1">Bottleneck Title:</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Manual Manifest Copy-Paste Latency"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category:</label>
                  <select
                    name="category"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Manual Handoff">Manual Handoff</option>
                    <option value="Repeated Data Entry">Repeated Data Entry</option>
                    <option value="Processing Delay">Processing Delay</option>
                    <option value="Approval Bottleneck">Approval Bottleneck</option>
                    <option value="Data Quality Issue">Data Quality Issue</option>
                    <option value="Duplicate Task">Duplicate Task</option>
                    <option value="Missing Integration">Missing Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Estimated Delay Added (min):</label>
                  <input
                    name="estimatedDelayMinutes"
                    type="number"
                    min="1"
                    defaultValue="20"
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Impact Description:</label>
                <textarea
                  name="impactDescription"
                  required
                  rows={2}
                  placeholder="Detail how this bottleneck degrades airline operations..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-emerald-400 mb-1">Mitigation Strategy:</label>
                <textarea
                  name="mitigationStrategy"
                  required
                  rows={2}
                  placeholder="Describe digital workflow, API, or automated solution..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Severity:</label>
                  <select
                    name="severity"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-purple-400 mb-1">Phase 3 Opportunity Link:</label>
                  <input
                    name="linkedOpportunityId"
                    placeholder="e.g. OPP-101"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBottleneckModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Save Bottleneck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD BUSINESS REQUIREMENT (BR) */}
      {/* ========================================== */}
      {showAddBRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Add Business Requirement (BR)</span>
              </h3>
              <button onClick={() => setShowAddBRModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const newBR: BusinessRequirement = {
                  id: getNextPrefixedId(businessReqs, 'BR-'),
                  problemId: selectedProblemId,
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  businessRationale: formData.get('businessRationale') as string,
                  stakeholder: formData.get('stakeholder') as string,
                  priority: formData.get('priority') as RequirementPriority,
                  dependencies: (formData.get('dependencies') as string).split(',').map((s) => s.trim()).filter(Boolean),
                  status: 'Draft',
                  createdAt: new Date().toISOString().split('T')[0],
                };

                handleUpdateBRs([...businessReqs, newBR]);
                setShowAddBRModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-400 mb-1">Requirement Title:</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Automated Disruption SMS Broadcast"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Requirement Description:</label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  placeholder="State the high-level business requirement clearly..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Business Rationale:</label>
                <textarea
                  name="businessRationale"
                  required
                  rows={2}
                  placeholder="Explain why this requirement is critical to airline operations..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority:</label>
                  <select
                    name="priority"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Must Have">Must Have</option>
                    <option value="Should Have">Should Have</option>
                    <option value="Could Have">Could Have</option>
                    <option value="Won't Have">Won't Have</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Lead Stakeholder:</label>
                  <input
                    name="stakeholder"
                    required
                    placeholder="e.g. Station Operations Director"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-purple-400 mb-1">Dependencies (comma separated):</label>
                <input
                  name="dependencies"
                  placeholder="Booking API, Flight Status Stream, SMS Gateway"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBRModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Create BR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD FUNCTIONAL REQUIREMENT (FR) */}
      {/* ========================================== */}
      {showAddFRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Functional Requirement (FR)</span>
              </h3>
              <button onClick={() => setShowAddFRModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const parentBrId = formData.get('businessReqId') as string;
                if (!parentBrId) return;

                const newFR: FunctionalRequirement = {
                  id: getNextPrefixedId(functionalReqs, 'FR-'),
                  businessReqId: parentBrId,
                  title: formData.get('title') as string,
                  systemBehavior: formData.get('systemBehavior') as string,
                  trigger: formData.get('trigger') as string,
                  inputs: ((formData.get('inputs') as string) || '').split(',').map((s) => s.trim()).filter(Boolean),
                  expectedOutputs: ((formData.get('expectedOutputs') as string) || '').split(',').map((s) => s.trim()).filter(Boolean),
                  validationRules: ((formData.get('validationRules') as string) || '').split(';').map((s) => s.trim()).filter(Boolean),
                  errorHandling: formData.get('errorHandling') as string,
                  dependencies: [],
                  priority: formData.get('priority') as RequirementPriority,
                  status: 'Draft',
                };

                handleUpdateFRs([...functionalReqs, newFR]);
                setShowAddFRModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Parent Business Req (BR):</label>
                  <select
                    name="businessReqId"
                    required
                    disabled={businessReqs.length === 0}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {businessReqs.length === 0 ? (
                      <option value="">Create a Business Requirement first</option>
                    ) : (
                      businessReqs.map((br) => (
                        <option key={br.id} value={br.id}>
                          {br.id}: {br.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Priority:</label>
                  <select
                    name="priority"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Must Have">Must Have</option>
                    <option value="Should Have">Should Have</option>
                    <option value="Could Have">Could Have</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Functional Requirement Title:</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Automated Delay Event Ingestion"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">System Behavior (Exact Logic):</label>
                <textarea
                  name="systemBehavior"
                  required
                  rows={2}
                  placeholder="System shall ingest event payload, parse fields, and evaluate rule..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-blue-400 mb-1">Trigger Event:</label>
                <input
                  name="trigger"
                  required
                  placeholder="e.g. Flight status delay > 20 minutes published to webhook"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Inputs (comma separated):</label>
                  <input
                    name="inputs"
                    placeholder="flight_id, sched_dep, delay_minutes"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Expected Outputs (comma separated):</label>
                  <input
                    name="expectedOutputs"
                    placeholder="Trigger Payload, Segmented Manifest"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Validation Rules (semicolon separated):</label>
                <input
                  name="validationRules"
                  placeholder="flight_id pattern valid; delay_minutes >= 0"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-rose-400 mb-1">Error Handling / Exception Behavior:</label>
                <input
                  name="errorHandling"
                  required
                  placeholder="e.g. Retry 3x then route to dead-letter queue"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddFRModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Create FR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD USER STORY */}
      {/* ========================================== */}
      {showAddStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Add User Story</span>
              </h3>
              <button onClick={() => setShowAddStoryModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const newStory: StructuredUserStory = {
                  id: getNextPrefixedId(userStories, 'US-'),
                  problemId: selectedProblemId,
                  functionalReqId: (formData.get('functionalReqId') as string) || undefined,
                  role: formData.get('role') as string,
                  want: formData.get('want') as string,
                  benefit: formData.get('benefit') as string,
                  priority: formData.get('priority') as RequirementPriority,
                  dependencies: [],
                  status: 'Draft',
                };

                handleUpdateUserStories([...userStories, newStory]);
                setShowAddStoryModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Linked Functional Req:</label>
                  <select
                    name="functionalReqId"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="">None</option>
                    {functionalReqs.map((fr) => (
                      <option key={fr.id} value={fr.id}>
                        {fr.id}: {fr.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Priority:</label>
                  <select
                    name="priority"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Must Have">Must Have</option>
                    <option value="Should Have">Should Have</option>
                    <option value="Could Have">Could Have</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">As a [Role]:</label>
                <input
                  name="role"
                  required
                  placeholder="e.g. Flight Operations Dispatcher"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-blue-400 mb-1">I want [Capability]:</label>
                <textarea
                  name="want"
                  required
                  rows={2}
                  placeholder="e.g. real-time countdown alerts 90 minutes before pilot duty timeouts"
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-emerald-400 mb-1">So that [Business Benefit]:</label>
                <textarea
                  name="benefit"
                  required
                  rows={2}
                  placeholder="e.g. I can coordinate standby crew swaps before boarding and avoid tarmac returns"
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStoryModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Insert Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD ACCEPTANCE CRITERIA */}
      {/* ========================================== */}
      {showAddCriteriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Acceptance Criteria (Given/When/Then)</span>
              </h3>
              <button onClick={() => setShowAddCriteriaModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const storyId = formData.get('userStoryId') as string;
                if (!storyId) return;

                const newAC: AcceptanceCriteriaItem = {
                  id: getNextPrefixedId(acceptanceCriteria, 'AC-'),
                  userStoryId: storyId,
                  title: formData.get('title') as string,
                  given: formData.get('given') as string,
                  when: formData.get('when') as string,
                  then: formData.get('then') as string,
                  type: formData.get('type') as any,
                  requiresHumanApproval: formData.get('requiresHumanApproval') === 'true',
                };

                handleUpdateCriteria([...acceptanceCriteria, newAC]);
                setShowAddCriteriaModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Parent User Story:</label>
                  <select
                    name="userStoryId"
                    required
                    disabled={userStories.length === 0}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    {userStories.length === 0 ? (
                      <option value="">Create a User Story first</option>
                    ) : (
                      userStories.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}: {s.role}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Scenario Type:</label>
                  <select
                    name="type"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Positive">Positive (Happy Path)</option>
                    <option value="Negative">Negative / Error</option>
                    <option value="Boundary">Boundary / Threshold</option>
                    <option value="Permission">Permission / Security</option>
                    <option value="Validation">Data Validation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Criteria Scenario Title:</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Valid Delay Notification Trigger"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-amber-400 mb-1 font-semibold">Given [Precondition / Context]:</label>
                <input
                  name="given"
                  required
                  placeholder="e.g. a flight incurs an estimated departure delay of 25 minutes"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-blue-400 mb-1 font-semibold">When [Trigger / User Action]:</label>
                <input
                  name="when"
                  required
                  placeholder="e.g. the OCC controller commits the schedule change in OCC system"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-emerald-400 mb-1 font-semibold">Then [Expected System Behavior]:</label>
                <input
                  name="then"
                  required
                  placeholder="e.g. all ticketed passengers receive multi-channel SMS notifications in < 90 seconds"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="requiresHumanApproval" name="requiresHumanApproval" value="true" className="rounded" />
                <label htmlFor="requiresHumanApproval" className="text-amber-400 font-semibold cursor-pointer">
                  Requires Human Supervisor Approval Check
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCriteriaModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                >
                  Save Criteria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: RUN / LOG TEST CASE EXECUTION */}
      {/* ========================================== */}
      {activeTestCaseForRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Log Test Execution: [{activeTestCaseForRun.id}]</span>
              </h3>
              <button onClick={() => setActiveTestCaseForRun(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const updated = testCases.map((tc) =>
                  tc.id === activeTestCaseForRun.id
                    ? {
                        ...tc,
                        status: formData.get('status') as TestCaseResult,
                        actualResult: formData.get('actualResult') as string,
                        reviewer: formData.get('reviewer') as string,
                        comments: formData.get('comments') as string,
                        executedAt: new Date().toISOString(),
                      }
                    : tc
                );

                handleUpdateTestCases(updated);
                setActiveTestCaseForRun(null);
              }}
              className="space-y-3"
            >
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Test Scenario:</span>
                <p className="text-slate-200 font-medium">{activeTestCaseForRun.scenario}</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Execution Status:</label>
                <select
                  name="status"
                  defaultValue={activeTestCaseForRun.status}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="Pass">Pass - Test verified successfully</option>
                  <option value="Fail">Fail - Actual result did not match expected</option>
                  <option value="Blocked">Blocked - Dependency or environment error</option>
                  <option value="Not Tested">Not Tested</option>
                </select>
              </div>

              <div>
                <label className="block text-blue-400 mb-1">Actual Observed Result:</label>
                <textarea
                  name="actualResult"
                  required
                  rows={2}
                  defaultValue={activeTestCaseForRun.actualResult}
                  placeholder="Record exact test findings, latency observed, logs..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Reviewer / QA Engineer:</label>
                  <input
                    name="reviewer"
                    required
                    defaultValue={activeTestCaseForRun.reviewer || 'Demo Reviewer'}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Execution Notes / Comments:</label>
                  <input
                    name="comments"
                    defaultValue={activeTestCaseForRun.comments}
                    placeholder="Environment, build hash, conditions..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTestCaseForRun(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  Save Test Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DRAWER / MODAL: AI BUSINESS ANALYST COPILOT */}
      {/* ========================================== */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    AI Business Analysis & Requirements Assistant
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Mode: {aiMode === 'BUSINESS_ANALYSIS' ? 'Problem Decomposition & Questions' : 'User Story & Acceptance Criteria'}
                  </span>
                </div>
              </div>

              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAiMode('BUSINESS_ANALYSIS')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    aiMode === 'BUSINESS_ANALYSIS'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Decompose Problem & Clarify
                </button>
                <button
                  onClick={() => setAiMode('USER_STORY_GENERATION')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    aiMode === 'USER_STORY_GENERATION'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Generate User Stories & Criteria
                </button>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Operational Context & Problem Statement:</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the airline problem, manual steps, systems, or requirements..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Mandatory: All AI suggestions require human business analyst & OCC validation before adoption.
                </span>

                <button
                  onClick={handleRunAiPrompt}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow cursor-pointer"
                >
                  {isAiLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze with Gemini</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Output Canvas */}
            <div className="flex-1 overflow-y-auto min-h-[220px] p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
              {aiError ? (
                <div className="text-rose-400 p-3 bg-rose-950/20 rounded-lg border border-rose-900/40">
                  {aiError}
                </div>
              ) : aiResponse ? (
                aiResponse
              ) : (
                <span className="text-slate-500">
                  AI analysis will appear here. The assistant will break down the problem, formulate 3 clarifying questions, propose digital architecture, and formulate user stories with human-in-the-loop safeguards.
                </span>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
              <span className="text-[11px] text-slate-500">
                Powered by Gemini API &bull; Server-Side Proxy Protected
              </span>

              {aiResponse && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiResponse);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Output'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
