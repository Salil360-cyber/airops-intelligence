import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Award,
  AlertCircle,
  ShieldCheck,
  BarChart2,
  Layers,
  Activity,
  DollarSign,
  ArrowRight,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit3,
  Download,
  Copy,
  Printer,
  Check,
  X,
  RefreshCw,
  Eye,
  Sliders,
  FileText,
  AlertTriangle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { fetchCopilot } from '../../utils/aiFetch';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

import {
  ProcessOpportunity,
  SolutionPortfolioItem,
  AutomationExecutionMetric,
  BenefitsRealizationRecord,
  AdoptionMetric,
  OperationalImpactRecord,
  ConfiguredKPI,
  PerformanceReportType,
} from '../../types';

import {
  getStoredPortfolio,
  saveStoredPortfolio,
  getStoredExecutionMetrics,
  saveStoredExecutionMetrics,
  getStoredBenefitsRealization,
  saveStoredBenefitsRealization,
  getStoredAdoptionMetrics,
  saveStoredAdoptionMetrics,
  getStoredOperationalImpact,
  saveStoredOperationalImpact,
  getStoredConfiguredKPIs,
  saveStoredConfiguredKPIs,
  computeExecutiveSummaryMetrics,
  safeDiv,
  resetPerformanceDefaults,
} from '../../utils/performanceStorage';

import { generatePerformanceReport } from '../../utils/performanceReports';
import { getStoredProblems, getStoredBottlenecks } from '../../utils/requirementsStorage';

interface SolutionsPerformanceTrackerProps {
  opportunities: ProcessOpportunity[];
}

type TrackerTab =
  | 'dashboard'
  | 'portfolio'
  | 'automation'
  | 'benefits'
  | 'adoption'
  | 'impact'
  | 'governance'
  | 'reports';

export const SolutionsPerformanceTracker: React.FC<SolutionsPerformanceTrackerProps> = ({
  opportunities,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Sub-Tab
  const [activeTab, setActiveTab] = useState<TrackerTab>('dashboard');

  // Core Phase 5 State
  const [portfolio, setPortfolio] = useState<SolutionPortfolioItem[]>(() => getStoredPortfolio());
  const [executions, setExecutions] = useState<AutomationExecutionMetric[]>(() => getStoredExecutionMetrics());
  const [benefits, setBenefits] = useState<BenefitsRealizationRecord[]>(() => getStoredBenefitsRealization());
  const [adoption, setAdoption] = useState<AdoptionMetric[]>(() => getStoredAdoptionMetrics());
  const [impact, setImpact] = useState<OperationalImpactRecord[]>(() => getStoredOperationalImpact());
  const [kpis, setKpis] = useState<ConfiguredKPI[]>(() => getStoredConfiguredKPIs());

  // Cross-module Phase 4 references
  const storedProblems = useMemo(() => getStoredProblems(), []);
  const storedBottlenecks = useMemo(() => getStoredBottlenecks(), []);

  // Filtering & Search
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [portfolioDeptFilter, setPortfolioDeptFilter] = useState('ALL');
  const [portfolioStatusFilter, setPortfolioStatusFilter] = useState('ALL');
  const [executionEnvFilter, setExecutionEnvFilter] = useState<
    'ALL' | 'Demonstration Benchmark' | 'Local Simulation' | 'Production Measured'
  >('ALL');

  // Drilldown Drawer
  const [selectedSolution, setSelectedSolution] = useState<SolutionPortfolioItem | null>(null);

  // Modals
  const [showAddKPIModal, setShowAddKPIModal] = useState(false);

  // Reporting & reset state
  const [selectedReportType, setSelectedReportType] = useState<PerformanceReportType>('EXECUTIVE_PERFORMANCE');
  const [copied, setCopied] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // AI Performance Analyst
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Compute deterministic metrics
  const summaryMetrics = useMemo(() => {
    return computeExecutiveSummaryMetrics(
      portfolio,
      executions,
      benefits,
      adoption,
      impact,
      storedProblems.length || 4
    );
  }, [portfolio, executions, benefits, adoption, impact, storedProblems]);

  // Filtered portfolio
  const filteredPortfolio = useMemo(() => {
    return portfolio.filter((p) => {
      const matchSearch =
        p.solutionTitle.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
        p.solutionOwner.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
        p.problemId.toLowerCase().includes(portfolioSearch.toLowerCase());
      const matchDept = portfolioDeptFilter === 'ALL' || p.department === portfolioDeptFilter;
      const matchStatus = portfolioStatusFilter === 'ALL' || p.status === portfolioStatusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [portfolio, portfolioSearch, portfolioDeptFilter, portfolioStatusFilter]);

  // Filtered executions
  const filteredExecutions = useMemo(() => {
    if (executionEnvFilter === 'ALL') return executions;
    return executions.filter((e) => e.environment === executionEnvFilter);
  }, [executions, executionEnvFilter]);

  // Chart data: Stage Funnel
  const funnelData = useMemo(() => {
    const stages = ['Discovery', 'Architecture', 'Build', 'Testing', 'Production'];
    return stages.map((st) => ({
      stage: st,
      count: portfolio.filter((p) => p.stage === st).length,
    }));
  }, [portfolio]);

  // Chart data: Department Target vs Measured Hours
  const deptHoursData = useMemo(() => {
    const depts: Record<string, { target: number; measured: number }> = {};
    portfolio.forEach((p) => {
      if (!depts[p.department]) depts[p.department] = { target: 0, measured: 0 };
      depts[p.department].target += p.targetBenefitHours || 0;
      depts[p.department].measured += p.measuredBenefitHours || 0;
    });
    return Object.entries(depts).map(([name, val]) => ({
      department: name,
      TargetHours: val.target,
      MeasuredHours: val.measured,
    }));
  }, [portfolio]);

  // Chart data: Value Tier breakdown
  const valueTierData = useMemo(() => {
    const counts: Record<string, number> = {
      Estimated: 0,
      Simulated: 0,
      'Demonstration Benchmark': 0,
      Measured: 0,
    };
    portfolio.forEach((p) => {
      counts[p.benefitTier] = (counts[p.benefitTier] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [portfolio]);

  const TIER_COLOR_MAP: Record<string, string> = {
    Estimated: '#3B82F6',
    Simulated: '#8B5CF6',
    'Demonstration Benchmark': '#F59E0B',
    Measured: '#10B981',
  };

  // Handlers
  const handleUpdatePortfolio = (updated: SolutionPortfolioItem[]) => {
    setPortfolio(updated);
    saveStoredPortfolio(updated);
  };

  const handleUpdateExecutions = (updated: AutomationExecutionMetric[]) => {
    setExecutions(updated);
    saveStoredExecutionMetrics(updated);
  };

  const handleUpdateBenefits = (updated: BenefitsRealizationRecord[]) => {
    setBenefits(updated);
    saveStoredBenefitsRealization(updated);
  };

  const handleUpdateAdoption = (updated: AdoptionMetric[]) => {
    setAdoption(updated);
    saveStoredAdoptionMetrics(updated);
  };

  const handleUpdateImpact = (updated: OperationalImpactRecord[]) => {
    setImpact(updated);
    saveStoredOperationalImpact(updated);
  };

  const handleUpdateKPIs = (updated: ConfiguredKPI[]) => {
    setKpis(updated);
    saveStoredConfiguredKPIs(updated);
  };

  const handleReset = () => {
    resetPerformanceDefaults();
    setPortfolio(getStoredPortfolio());
    setExecutions(getStoredExecutionMetrics());
    setBenefits(getStoredBenefitsRealization());
    setAdoption(getStoredAdoptionMetrics());
    setImpact(getStoredOperationalImpact());
    setKpis(getStoredConfiguredKPIs());
    setConfirmingReset(false);
  };

  // AI Performance Assistant Call
  const handleTriggerAI = async (initialPrompt?: string) => {
    const prompt =
      initialPrompt ||
      `Analyze our airline solutions portfolio performance:\n- Total Opportunities: ${summaryMetrics.totalOpportunities} (${summaryMetrics.implementedSolutions} Implemented, ${summaryMetrics.solutionsInProgress} In-Progress, ${summaryMetrics.approvedSolutions} Approved)\n- Hours Saved: ${summaryMetrics.totalEstimatedHours} Estimated vs ${summaryMetrics.totalDemonstrationHours} Demonstration Benchmark vs ${summaryMetrics.totalMeasuredHours} Verified Production\n- Workflow Executions: ${summaryMetrics.totalExecutions} (${summaryMetrics.productionExecutions} Production, ${summaryMetrics.demonstrationExecutions} Demonstration Benchmark, ${summaryMetrics.simulatedExecutions} Simulated, ${summaryMetrics.workflowSuccessRate}% success)\n- Overall Adoption Rate: ${summaryMetrics.overallAdoptionRate}%\n- Bottleneck Resolution: ${summaryMetrics.bottleneckResolutionRate}%\n\nPlease provide calculated facts, operational interpretation, corrective recommendations, and missing evidence to audit.`;

    setAiPrompt(prompt);
    setAiResponse('');
    setAiError(null);
    setShowAiModal(true);
  };

  const handleRunAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError(null);

    try {
      const data = await fetchCopilot({
        message: aiPrompt,
        mode: 'SOLUTIONS_PERFORMANCE_ANALYSIS',
        context: {
          summaryMetrics,
          portfolioCount: portfolio.length,
          bottlenecksCount: impact.length,
        },
      });

      setAiResponse(data.reply || 'No response returned from model.');
    } catch (err: any) {
      setAiError(err.message || 'An error occurred while communicating with Gemini.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Download & Copy Report
  const currentReportContent = useMemo(() => {
    return generatePerformanceReport(selectedReportType, {
      portfolio,
      executions,
      benefits,
      adoption,
      impact,
      kpis,
      totalProblemsCount: storedProblems.length || 4,
    });
  }, [selectedReportType, portfolio, executions, benefits, adoption, impact, kpis, storedProblems]);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(currentReportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const blob = new Blob([currentReportContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReportType}_${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Governance Notice */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">
                Solutions Performance Tracker
              </h2>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800/60 text-purple-300">
                Phase 5 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous monitoring of digital solutions, production vs. simulation analytics, benefits realization (Estimated vs. Measured), frontline adoption, and bottleneck relief.
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleTriggerAI()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-purple-950/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Performance Analyst</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Performance Reports</span>
          </button>

          {!confirmingReset ? (
            <button
              onClick={() => setConfirmingReset(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition-colors cursor-pointer"
              title="Reset to baseline sample dataset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReset}
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

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Executive Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'portfolio'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Solutions Portfolio ({portfolio.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'automation'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Automation Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('benefits')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'benefits'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Benefits &amp; ROI</span>
        </button>

        <button
          onClick={() => setActiveTab('adoption')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'adoption'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>Adoption &amp; Usage</span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'impact'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Operational Impact ({impact.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'governance'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>KPI Governance ({kpis.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Reports</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* 1. EXECUTIVE PERFORMANCE DASHBOARD */}
      {/* ========================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Integrity Standard Disclosure */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-slate-200">
                AeroSolutions Multi-Tier Value Realization Framework
              </span>
              <p className="text-slate-400 leading-relaxed">
                Numerical metrics strictly segregate <strong className="text-blue-300">Estimated Projections</strong> (formula-derived capacity), <strong className="text-purple-300">Simulated Results</strong> (sandbox staging tests), and <strong className="text-emerald-400">Measured Realized Benefits</strong> (production audit logs signed off by station leadership). Capacity value is operational bandwidth saved, not confirmed cash reductions.
              </p>
            </div>
          </div>

          {/* Primary Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Registered Problems */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Problems (PRB)
              </span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {summaryMetrics.totalProblems}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Catalogued in Phase 4</span>
            </div>

            {/* Opportunities */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Pipeline (OPP)
              </span>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                {summaryMetrics.totalOpportunities}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {summaryMetrics.approvedSolutions} Approved &bull; {summaryMetrics.implementedSolutions} Live
              </span>
            </div>

            {/* Workflow Executions */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold block">
                Total Executions
              </span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                {summaryMetrics.totalExecutions.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {summaryMetrics.demonstrationExecutions.toLocaleString()} Demo &bull; {summaryMetrics.simulatedExecutions} Sim
              </span>
            </div>

            {/* Success Rate */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold block">
                Workflow Success
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {summaryMetrics.workflowSuccessRate}%
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Target: &gt;= 98.0%</span>
            </div>

            {/* Estimated Hours */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold block">
                Estimated Hours
              </span>
              <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                {summaryMetrics.totalEstimatedHours.toLocaleString()}
                <span className="text-[10px] text-slate-400 font-sans ml-1">hr/yr</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Full pipeline potential</span>
            </div>

            {/* Demonstrated Hours */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-900/50 bg-amber-950/20">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold block">
                Demonstrated Hours
              </span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                {(summaryMetrics.totalDemonstrationHours || summaryMetrics.totalMeasuredHours).toLocaleString()}
                <span className="text-[10px] text-slate-400 font-sans ml-1">hr/yr</span>
              </div>
              <span className="text-[10px] text-amber-400/80 mt-0.5 block">Demonstration Benchmark</span>
            </div>
          </div>

          {/* Secondary KPI Bar: Adoption, Realization, Bottlenecks, ROI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Benefits Realization</span>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {summaryMetrics.benefitsRealizationRate}%
                </div>
                <span className="text-[10px] text-slate-500">Benchmark vs Target (SOL-104)</span>
              </div>
              <Award className="w-6 h-6 text-emerald-400 shrink-0" />
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Frontline Adoption</span>
                <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                  {summaryMetrics.overallAdoptionRate}%
                </div>
                <span className="text-[10px] text-slate-500">
                  {summaryMetrics.totalActiveUsers} of {summaryMetrics.totalEligibleUsers} users
                </span>
              </div>
              <Users className="w-6 h-6 text-blue-400 shrink-0" />
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Bottleneck Resolution</span>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {summaryMetrics.bottleneckResolutionRate}%
                </div>
                <span className="text-[10px] text-slate-500">
                  {summaryMetrics.resolvedBottlenecks} of {summaryMetrics.totalBottlenecks} resolved
                </span>
              </div>
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Demonstrated Labor Value</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  ${(summaryMetrics.totalLaborValueDemonstratedUSD || summaryMetrics.totalLaborValueMeasuredUSD).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">Benchmark ROI: {summaryMetrics.portfolioROI}%</span>
              </div>
              <DollarSign className="w-6 h-6 text-emerald-400 shrink-0" />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Department Hours Comparison (Target vs Measured) */}
            <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">
                    Annual Operational Capacity Savings by Department
                  </h3>
                  <p className="text-[11px] text-slate-400">Target Projected vs. Demonstrated / Measured Hours</p>
                </div>
              </div>

              <div className="w-full h-56 min-h-[224px] min-w-0">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={224}>
                    <BarChart data={deptHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="department" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-10} textAnchor="end" />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <Bar dataKey="TargetHours" name="Target (Estimated)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="MeasuredHours" name="Demonstrated / Measured" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading chart...</div>
                )}
              </div>
            </div>

            {/* Solution Stage Distribution & Value Tier */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">
                    Value Tier Classification Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-400">Estimated vs Simulated vs Measured Gating</p>
                </div>
              </div>

              <div className="w-full h-48 min-h-[192px] min-w-0 relative flex items-center justify-center">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height={192} minWidth={0} minHeight={192}>
                    <PieChart>
                      <Pie
                        data={valueTierData}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {valueTierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={TIER_COLOR_MAP[entry.name] || '#06B6D4'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-500">Loading chart...</div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-800 text-[11px]">
                {valueTierData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_COLOR_MAP[item.name] || '#06B6D4' }} />
                    <span className="text-slate-300">
                      {item.name}: <strong>{item.value} solutions</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. SOLUTIONS PORTFOLIO TRACKER */}
      {/* ========================================== */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search solutions, owners, problem IDs..."
                  value={portfolioSearch}
                  onChange={(e) => setPortfolioSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={portfolioDeptFilter}
                onChange={(e) => setPortfolioDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Customer Experience">Customer Experience</option>
                <option value="OCC & Dispatch">OCC & Dispatch</option>
                <option value="Flight Operations">Flight Operations</option>
                <option value="Ground Handling">Ground Handling</option>
              </select>

              <select
                value={portfolioStatusFilter}
                onChange={(e) => setPortfolioStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Identified">Identified</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Implemented">Implemented</option>
              </select>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Showing {filteredPortfolio.length} of {portfolio.length} Solutions
            </span>
          </div>

          {/* Portfolio Table */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Solution ID</th>
                    <th className="pb-3 font-semibold">Solution Title</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Linked PRB / OPP</th>
                    <th className="pb-3 font-semibold">Stage</th>
                    <th className="pb-3 font-semibold">Target vs Measured</th>
                    <th className="pb-3 font-semibold">Value Tier</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPortfolio.map((item) => {
                    const tierColor =
                      item.benefitTier === 'Measured'
                        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                        : item.benefitTier === 'Simulated'
                        ? 'text-purple-400 bg-purple-950/60 border-purple-800'
                        : 'text-blue-400 bg-blue-950/60 border-blue-800';

                    const stageColor =
                      item.stage === 'Production'
                        ? 'text-emerald-400'
                        : item.stage === 'Build' || item.stage === 'Testing'
                        ? 'text-blue-400'
                        : 'text-slate-400';

                    return (
                      <tr key={item.id} className="hover:bg-slate-950/40">
                        <td className="py-3 font-bold text-purple-400">{item.id}</td>
                        <td className="py-3 font-sans font-medium text-slate-200 max-w-xs truncate">
                          {item.solutionTitle}
                        </td>
                        <td className="py-3 text-slate-400 font-sans">{item.department}</td>
                        <td className="py-3">
                          <span className="text-blue-400 font-bold">{item.problemId}</span> /{' '}
                          <span className="text-slate-400">{item.opportunityId}</span>
                        </td>
                        <td className={`py-3 font-semibold ${stageColor}`}>{item.stage}</td>
                        <td className="py-3">
                          <span className="text-blue-400">{item.targetBenefitHours}h</span> /{' '}
                          <span className="text-emerald-400 font-bold">{item.measuredBenefitHours}h</span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${tierColor}`}>
                            {item.benefitTier}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setSelectedSolution(item)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drilldown Drawer */}
          {selectedSolution && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-400">{selectedSolution.id}</span>
                  <span className="text-slate-500">&bull;</span>
                  <h3 className="text-sm font-semibold text-slate-100">{selectedSolution.solutionTitle}</h3>
                </div>
                <button onClick={() => setSelectedSolution(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Governance &amp; Ownership</span>
                  <div>Owner: <strong className="text-slate-200">{selectedSolution.solutionOwner}</strong></div>
                  <div>Department: <span className="text-slate-300">{selectedSolution.department}</span></div>
                  <div>Priority: <span className="text-amber-400 font-semibold">{selectedSolution.priority}</span></div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Traceability Links</span>
                  <div>Problem: <span className="text-blue-400 font-mono font-bold">{selectedSolution.problemId}</span></div>
                  <div>Opportunity: <span className="text-purple-400 font-mono font-bold">{selectedSolution.opportunityId}</span></div>
                  <div>Bottleneck: <span className="text-amber-400 font-mono">{selectedSolution.bottleneckId || 'N/A'}</span></div>
                  <div>Requirements: <span className="text-emerald-400 font-mono">{selectedSolution.requirementIds.join(', ')}</span></div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Benefits &amp; Milestone</span>
                  <div>Target Hours: <strong className="text-blue-400">{selectedSolution.targetBenefitHours} hrs/yr</strong></div>
                  <div>Measured Hours: <strong className="text-emerald-400">{selectedSolution.measuredBenefitHours} hrs/yr</strong></div>
                  <div>Planned Go-Live: <span className="text-slate-300 font-mono">{selectedSolution.plannedCompletionDate}</span></div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Latest Verified Result:</span>
                <p className="text-slate-200 leading-relaxed">{selectedSolution.latestResult}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 3. AUTOMATION PERFORMANCE ANALYTICS */}
      {/* ========================================== */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Workflow Execution Telemetry &amp; Latency</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates workflow reliability, duration, error rates, and manual vs. automated execution deltas.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Environment:</span>
              <select
                value={executionEnvFilter}
                onChange={(e) => setExecutionEnvFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Environments</option>
                <option value="Demonstration Benchmark">Demonstration Benchmark</option>
                <option value="Local Simulation">Local Simulation</option>
                <option value="Production Measured">Production Measured (Live)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExecutions.map((e) => (
              <div
                key={e.workflowId}
                className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {e.workflowId}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        e.environment === 'Production Measured'
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                          : e.environment === 'Demonstration Benchmark'
                          ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                          : 'text-purple-400 bg-purple-950/60 border-purple-800'
                      }`}
                    >
                      {e.environment}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">{e.successRate}% Success</span>
                </div>

                <h4 className="text-xs font-semibold text-slate-100">{e.workflowName}</h4>

                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Runs</span>
                    <span className="font-mono font-bold text-slate-200 mt-0.5 block">
                      {e.totalRuns.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Avg Latency</span>
                    <span className="font-mono font-bold text-blue-400 mt-0.5 block">{e.avgDurationMs}ms</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Time Saved/Run</span>
                    <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                      {e.timeSavedPerRunMinutes.toFixed(1)}m
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    Baseline: {e.manualTimeMinutes}m manual &rarr; {e.automatedTimeSeconds}s automated
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {e.totalTimeSavedHours.toLocaleString()}h saved
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. BENEFITS REALIZATION & ROI */}
      {/* ========================================== */}
      {activeTab === 'benefits' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-slate-200">
                Audited Financial Returns &amp; Payback Horizon
              </span>
              <p className="text-slate-400 leading-relaxed">
                Evaluated against approved CapEx, annual maintenance contracts, and standard airline operational labor costs ($85/hr).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {benefits.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {b.id}
                    </span>
                    <span className="font-semibold text-slate-200 text-xs">{b.solutionTitle}</span>
                    <span className="text-[10px] font-mono text-slate-400">({b.department})</span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      b.valueType === 'Measured'
                        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                        : 'text-blue-400 bg-blue-950/60 border-blue-800'
                    }`}
                  >
                    Value Tier: {b.valueType}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <strong className="text-slate-400">Approved Business Case:</strong> {b.approvedBusinessCase}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CapEx Implementation</span>
                    <span className="font-mono font-bold text-slate-200 mt-0.5 block">
                      ${b.implementationCostUSD.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Annual Labor Value</span>
                    <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                      ${(b.valueType === 'Measured' || b.valueType === 'Demonstration Benchmark' ? b.actualMeasuredLaborValueUSD : b.estimatedAnnualLaborValueUSD).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">First-Year Net Benefit</span>
                    <span className="font-mono font-bold text-purple-400 mt-0.5 block">
                      ${b.firstYearNetBenefitUSD.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">ROI / Payback</span>
                    <span className="font-mono font-bold text-amber-400 mt-0.5 block">
                      {b.roiPercentage}% / {b.paybackPeriodMonths}m
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Evidence: {b.evidenceDescription}</span>
                  <span>Verified By: <strong className="text-slate-300">{b.verifiedBy}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. ADOPTION & USAGE ANALYTICS */}
      {/* ========================================== */}
      {activeTab === 'adoption' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-slate-200">
                Frontline Operational Role Adoption &amp; Repeat Usage
              </span>
              <p className="text-slate-400 leading-relaxed">
                Tracks active weekly users across airline ground handling, OCC dispatchers, station supervisors, and flight crew planners.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adoption.map((a) => (
              <div
                key={a.department}
                className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{a.department}</h4>
                    <span className="text-[10px] text-slate-400">{a.roleName}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-blue-400">{a.adoptionRate}% Adoption</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${a.adoptionRate}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-center pt-1">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Eligible Staff</span>
                    <span className="font-mono font-bold text-slate-200">{a.eligibleUsers}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Active Users</span>
                    <span className="font-mono font-bold text-blue-400">{a.activeUsers}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Repeat Usage</span>
                    <span className="font-mono font-bold text-emerald-400">{a.repeatUsageRate}%</span>
                  </div>
                </div>

                {/* Monthly trend line */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                    Monthly Adoption Progression
                  </span>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    {a.monthlyTrend.map((t) => (
                      <span key={t.month}>
                        {t.month.split(' ')[0]}: <strong className="text-slate-200">{t.adoptionRate}%</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 6. OPERATIONAL IMPACT & BOTTLENECKS */}
      {/* ========================================== */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-slate-200">
                Phase 4 Bottleneck Relief &amp; Observed Delay Reductions
              </span>
              <p className="text-slate-400 leading-relaxed">
                Connects identified operational bottlenecks with deployed solutions to measure empirical delay reductions against baseline friction.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {impact.map((imp) => {
              const statusColor =
                imp.resolutionStatus === 'Resolved'
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                  : imp.resolutionStatus === 'Partially Mitigated'
                  ? 'text-amber-400 bg-amber-950/60 border-amber-800'
                  : 'text-rose-400 bg-rose-950/60 border-rose-800';

              return (
                <div
                  key={imp.id}
                  className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {imp.bottleneckId}
                      </span>
                      <span className="font-semibold text-slate-200 text-xs">{imp.bottleneckTitle}</span>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor}`}>
                      {imp.resolutionStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Baseline Delay</span>
                      <span className="font-mono font-bold text-rose-400 mt-0.5 block">
                        {imp.baselineDelayMinutes}m
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Current Observed</span>
                      <span className="font-mono font-bold text-blue-400 mt-0.5 block">
                        {imp.currentObservedDelayMinutes}m
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Delay Reduced</span>
                      <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                        -{imp.delayReductionMinutes}m
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Reduction Rate</span>
                      <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                        {imp.delayReductionPercentage}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Evidence: {imp.evidenceSource}</span>
                    <span>Audit Status: <strong className="text-slate-300">{imp.reviewStatus}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 7. KPI GOVERNANCE & CONFIGURATION */}
      {/* ========================================== */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Configured KPI Governance Register</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define deterministic KPI formulas, operational targets, threshold alerts, and review owners.
              </p>
            </div>

            <button
              onClick={() => setShowAddKPIModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Configure KPI</span>
            </button>
          </div>

          <div className="space-y-3">
            {kpis.map((k) => (
              <div
                key={k.id}
                className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                      {k.id}
                    </span>
                    <span className="font-bold text-slate-200 text-xs">{k.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">({k.department})</span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      k.status === 'On Target'
                        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                        : 'text-amber-400 bg-amber-950/60 border-amber-800'
                    }`}
                  >
                    {k.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400">{k.description}</p>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-purple-300">
                  Formula: {k.formula}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-center pt-1">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Current Value</span>
                    <span className="font-mono font-bold text-slate-100">
                      {k.currentValue} {k.unit}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Target</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {k.target} {k.unit}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Warning Threshold</span>
                    <span className="font-mono font-bold text-amber-400">
                      {k.threshold} {k.unit}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Data Source: {k.dataSource}</span>
                  <span>Owner: <strong className="text-slate-300">{k.owner}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 8. PERFORMANCE REPORTING */}
      {/* ========================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Executive Performance Reporting &amp; Auditing</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate formal Markdown performance summaries with full disclosures of Estimated, Simulated, and Measured value tiers.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Print View</span>
              </button>
            </div>
          </div>

          {/* Report Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: 'EXECUTIVE_PERFORMANCE', label: 'Executive Performance' },
              { id: 'MONTHLY_SOLUTIONS_REVIEW', label: 'Monthly Review' },
              { id: 'AUTOMATION_PERFORMANCE', label: 'Automation Audit' },
              { id: 'BENEFITS_REALIZATION', label: 'Benefits & ROI' },
              { id: 'DEPARTMENT_PERFORMANCE', label: 'Department Audit' },
              { id: 'OPERATIONAL_IMPROVEMENT', label: 'Bottleneck Relief' },
            ].map((rep) => (
              <button
                key={rep.id}
                onClick={() => setSelectedReportType(rep.id as PerformanceReportType)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedReportType === rep.id
                    ? 'bg-purple-950/40 border-purple-500/80 text-white shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-semibold block">{rep.label}</span>
              </button>
            ))}
          </div>

          {/* Document Preview Canvas */}
          <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap overflow-x-auto">
            {currentReportContent}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD CONFIGURABLE KPI */}
      {/* ========================================== */}
      {showAddKPIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Configure New Strategic KPI</span>
              </h3>
              <button onClick={() => setShowAddKPIModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const maxKpiNum = kpis.reduce((max, item) => {
                  const match = /^KPI-(\d+)$/i.exec(item.id);
                  return match ? Math.max(max, Number(match[1])) : max;
                }, 0);

                const targetNum = Number(formData.get('target')) || 80;
                const thresholdNum = Number(formData.get('threshold')) || 60;
                const rawCurrent = formData.get('currentValue');
                const currentNum = rawCurrent !== null && rawCurrent !== '' ? Number(rawCurrent) : 75;
                const computedStatus: ConfiguredKPI['status'] =
                  currentNum >= targetNum ? 'On Target' : currentNum >= thresholdNum ? 'At Risk' : 'Breached';

                const newKPI: ConfiguredKPI = {
                  id: `KPI-${String(maxKpiNum + 1).padStart(3, '0')}`,
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  formula: formData.get('formula') as string,
                  target: targetNum,
                  threshold: thresholdNum,
                  unit: (formData.get('unit') as string) || '%',
                  department: formData.get('department') as string,
                  frequency: (formData.get('frequency') as ConfiguredKPI['frequency']) || 'Monthly',
                  dataSource: (formData.get('dataSource') as string) || 'Local Telemetry Store',
                  owner: formData.get('owner') as string,
                  currentValue: currentNum,
                  status: computedStatus,
                  reviewStatus: 'Active',
                };

                handleUpdateKPIs([...kpis, newKPI]);
                setShowAddKPIModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-400 mb-1">KPI Name:</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Turnaround Punctuality Index"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description:</label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  placeholder="Describe operational importance and measurement intent..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-400 mb-1">Deterministic Formula:</label>
                <input
                  name="formula"
                  required
                  placeholder="(On-Time Turns / Total Widebody Turns) * 100"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Value:</label>
                  <input
                    name="target"
                    type="number"
                    step="0.1"
                    defaultValue="85.0"
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Threshold Value:</label>
                  <input
                    name="threshold"
                    type="number"
                    step="0.1"
                    defaultValue="75.0"
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Unit:</label>
                  <input
                    name="unit"
                    defaultValue="%"
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Current Value:</label>
                  <input
                    name="currentValue"
                    type="number"
                    step="0.1"
                    defaultValue="78.0"
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Measurement Frequency:</label>
                  <select
                    name="frequency"
                    defaultValue="Monthly"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department:</label>
                  <input
                    name="department"
                    required
                    defaultValue="Ground Handling"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Data Source:</label>
                  <input
                    name="dataSource"
                    required
                    defaultValue="Local Workflow Telemetry"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Owner:</label>
                  <input
                    name="owner"
                    required
                    defaultValue="Station Operations Lead"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddKPIModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer"
                >
                  Save KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DRAWER / MODAL: AI PERFORMANCE ANALYST */}
      {/* ========================================== */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    AI Performance Analyst &amp; Benefits Auditor
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Mode: SOLUTIONS_PERFORMANCE_ANALYSIS &bull; Gemini Flash
                  </span>
                </div>
              </div>

              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Operational Audit Prompt:</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mandatory Governance: AI reports strictly distinguish Estimated vs. Measured values.
                </span>

                <button
                  onClick={handleRunAi}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold shadow cursor-pointer"
                >
                  {isAiLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Auditing Performance...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Audit with Gemini</span>
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
                  AI performance audit will appear here. The assistant analyzes calculated facts, operational significance, recommendations for adoption gaps, and next audit investigations.
                </span>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
              <span className="text-[11px] text-slate-500">
                Powered by Gemini API &bull; Server-Side Protected
              </span>

              {aiResponse && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiResponse);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 cursor-pointer"
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
