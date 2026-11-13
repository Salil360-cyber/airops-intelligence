import React, { useState, useMemo, useEffect } from 'react';
import {
  Workflow,
  Plus,
  Clock,
  TrendingUp,
  CheckCircle,
  Filter,
  Search,
  ArrowRight,
  Sparkles,
  X,
  Layers,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  DollarSign,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  Cpu,
  Send,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Bot,
  HelpCircle,
  Download,
  Terminal,
  Activity,
} from 'lucide-react';
import {
  ProcessOpportunity,
  OpportunityStatus,
  FeasibilityLevel,
  SolutionCategory,
  WorkflowDefinition,
  WorkflowStep,
  WorkflowStepType,
  WorkflowSimulationRun,
  ROICalculationInputs,
  TechAssessment,
} from '../../types';
import {
  calculateAutomationROI,
  DEFAULT_ROI_INPUTS,
} from '../../utils/roiCalculator';
import {
  getStoredWorkflows,
  saveStoredWorkflows,
  resetWorkflowsToDefault,
  getStoredSimulationRuns,
  addSimulationRun,
} from '../../utils/workflowStorage';
import {
  simulateWorkflowExecution,
  PRESET_SIMULATION_SCENARIOS,
  SimulationScenarioConfig,
} from '../../utils/workflowSimulator';
import { TECH_ASSESSMENTS } from '../../utils/techAssessments';
import { INITIAL_OPPORTUNITIES } from '../../utils/storage';
import { fetchCopilot } from '../../utils/aiFetch';

interface ProcessAutomationStudioProps {
  opportunities: ProcessOpportunity[];
  onSaveOpportunities: (updated: ProcessOpportunity[]) => void;
  hourlyRate?: number;
}

type StudioSubTab =
  | 'finder'
  | 'designer'
  | 'comparison'
  | 'roi'
  | 'simulator'
  | 'monitor'
  | 'assessment'
  | 'ai_assistant';

export const ProcessAutomationStudio: React.FC<ProcessAutomationStudioProps> = ({
  opportunities,
  onSaveOpportunities,
  hourlyRate = 85,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<StudioSubTab>('finder');

  // Selected Opportunity
  const [selectedOpportunity, setSelectedOpportunity] = useState<ProcessOpportunity | null>(
    opportunities[0] || null
  );

  // Filters & Search for Opportunity Finder
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'hours' | 'priority' | 'status' | 'date'>('hours');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditingOpp, setIsEditingOpp] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New / Edit Opportunity Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDept, setFormDept] = useState<ProcessOpportunity['department']>('Flight Operations');
  const [formManualDesc, setFormManualDesc] = useState('');
  const [formRepetitive, setFormRepetitive] = useState('');
  const [formFreqPerWeek, setFormFreqPerWeek] = useState(50);
  const [formMinutesPerTask, setFormMinutesPerTask] = useState(30);
  const [formFeasibility, setFormFeasibility] = useState<FeasibilityLevel>('High');
  const [formSolution, setFormSolution] = useState('');
  const [formSolutionType, setFormSolutionType] = useState<SolutionCategory>('Rule-based Automation');
  const [formStatus, setFormStatus] = useState<OpportunityStatus>('Identified');
  const [formPriority, setFormPriority] = useState<ProcessOpportunity['priority']>('High');
  const [formComplexity, setFormComplexity] = useState<ProcessOpportunity['complexity']>('Medium');
  const [formPeopleInvolved, setFormPeopleInvolved] = useState(3);
  const [formBusinessOwner, setFormBusinessOwner] = useState('');
  const [formDependencies, setFormDependencies] = useState('');
  const [formRiskNotes, setFormRiskNotes] = useState('');
  const [formBottlenecks, setFormBottlenecks] = useState('');
  const [formExpectedBenefits, setFormExpectedBenefits] = useState('');
  const [formHumanIntervention, setFormHumanIntervention] = useState('');
  const [formManualSteps, setFormManualSteps] = useState('Step 1: Check telemetry report\nStep 2: Copy data to spreadsheet\nStep 3: Email distribution list');
  const [formProposedSteps, setFormProposedSteps] = useState('Step 1: Ingest event telemetry via webhook\nStep 2: Auto-reconcile discrepancies\nStep 3: Publish verified dashboard state');

  // Workflows State
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(() => getStoredWorkflows());
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || 'WF-101');
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [newStepType, setNewStepType] = useState<WorkflowStepType>('Validation');
  const [newStepDesc, setNewStepDesc] = useState('');

  // Selected Workflow
  const currentWorkflow = useMemo(() => {
    return workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];
  }, [workflows, selectedWorkflowId]);

  // Simulation State
  const [simulationRuns, setSimulationRuns] = useState<WorkflowSimulationRun[]>(() => getStoredSimulationRuns());
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenarioConfig>(PRESET_SIMULATION_SCENARIOS[0]);
  const [activeSimulation, setActiveSimulation] = useState<WorkflowSimulationRun | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // ROI Calculator State
  const [roiInputs, setRoiInputs] = useState<ROICalculationInputs>(() => {
    if (selectedOpportunity) {
      return {
        ...DEFAULT_ROI_INPUTS,
        staffHourlyCost: hourlyRate,
        manualMinutesPerExecution: selectedOpportunity.timeSpentPerTaskMinutes,
        executionsPerDay: Math.round(selectedOpportunity.frequencyPerWeek / 7) || 1,
      };
    }
    return { ...DEFAULT_ROI_INPUTS, staffHourlyCost: hourlyRate };
  });

  useEffect(() => {
    setRoiInputs((prev) => ({ ...prev, staffHourlyCost: hourlyRate }));
  }, [hourlyRate]);

  useEffect(() => {
    setSelectedOpportunity((prev) => {
      if (opportunities.length === 0) return null;
      if (!prev) return opportunities[0];
      return opportunities.find((o) => o.id === prev.id) || opportunities[0];
    });
  }, [opportunities]);

  const roiResults = useMemo(() => calculateAutomationROI(roiInputs), [roiInputs]);

  // AI Assistant State
  const [aiProcessPrompt, setAiProcessPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiModel, setAiModel] = useState('gemini-3.1-flash-lite');

  // Filtered & Sorted Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((o) => {
        if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
        if (departmentFilter !== 'ALL' && o.department !== departmentFilter) return false;
        if (priorityFilter !== 'ALL' && o.priority !== priorityFilter) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          return (
            o.id.toLowerCase().includes(q) ||
            o.title.toLowerCase().includes(q) ||
            o.proposedSolution.toLowerCase().includes(q) ||
            o.department.toLowerCase().includes(q) ||
            (o.businessOwner && o.businessOwner.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'hours') return (b.estimatedHoursSavedAnnual || 0) - (a.estimatedHoursSavedAnnual || 0);
        if (sortBy === 'priority') {
          const pRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (pRank[b.priority || 'Medium'] || 0) - (pRank[a.priority || 'Medium'] || 0);
        }
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [opportunities, statusFilter, departmentFilter, priorityFilter, searchQuery, sortBy]);

  // Overall Monitoring Metrics
  const totalHoursSaved = opportunities.reduce((acc, o) => acc + (o.estimatedHoursSavedAnnual || 0), 0);
  const measuredHoursSaved = opportunities.reduce((acc, o) => acc + (o.measuredHoursSavedAnnual || 0), 0);
  const implementedCount = opportunities.filter((o) => o.status === 'Implemented').length;
  const inProgressCount = opportunities.filter((o) => o.status === 'In Progress').length;
  const approvedCount = opportunities.filter((o) => o.status === 'Approved').length;

  const adoptionRate = opportunities.length > 0 ? Math.round((implementedCount / opportunities.length) * 100) : 0;

  // Status badge styling
  const getStatusBadge = (status: OpportunityStatus) => {
    switch (status) {
      case 'Implemented':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Approved':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'Under Review':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Identified':
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
      case 'Rejected':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case 'Critical':
        return 'bg-rose-950 text-rose-400 border-rose-800';
      case 'High':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'Medium':
        return 'bg-blue-950 text-blue-400 border-blue-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  // Opportunity CRUD Handlers
  const openNewOpportunityModal = () => {
    setFormTitle('');
    setFormDept('Flight Operations');
    setFormManualDesc('');
    setFormRepetitive('');
    setFormFreqPerWeek(50);
    setFormMinutesPerTask(30);
    setFormFeasibility('High');
    setFormSolution('');
    setFormSolutionType('Rule-based Automation');
    setFormStatus('Identified');
    setFormPriority('High');
    setFormComplexity('Medium');
    setFormPeopleInvolved(3);
    setFormBusinessOwner('Operations Dispatch Lead');
    setFormDependencies('Flight Status Stream, FlightOps API');
    setFormRiskNotes('Standard OCC sign-off required prior to production execution.');
    setFormBottlenecks('Manual communication latency and phone queues.');
    setFormExpectedBenefits('Sub-minute turnaround notification and automated audit logs.');
    setFormHumanIntervention('Dispatcher approval on flight cancellation actions.');
    setFormManualSteps('Step 1: Check telemetry report\nStep 2: Copy data to spreadsheet\nStep 3: Email distribution list');
    setFormProposedSteps('Step 1: Ingest event telemetry via webhook\nStep 2: Auto-reconcile discrepancies\nStep 3: Publish verified dashboard state');
    setIsEditingOpp(false);
    setIsCreatingNew(true);
  };

  const openEditOpportunityModal = (opp: ProcessOpportunity) => {
    setFormTitle(opp.title);
    setFormDept(opp.department);
    setFormManualDesc(opp.manualTaskDescription);
    setFormRepetitive(opp.repetitiveActivities);
    setFormFreqPerWeek(opp.frequencyPerWeek);
    setFormMinutesPerTask(opp.timeSpentPerTaskMinutes);
    setFormFeasibility(opp.automationFeasibility);
    setFormSolution(opp.proposedSolution);
    setFormSolutionType(opp.solutionType);
    setFormStatus(opp.status);
    setFormPriority(opp.priority || 'Medium');
    setFormComplexity(opp.complexity || 'Medium');
    setFormPeopleInvolved(opp.peopleInvolved || 2);
    setFormBusinessOwner(opp.businessOwner || '');
    setFormDependencies(opp.dependencies ? opp.dependencies.join(', ') : '');
    setFormRiskNotes(opp.riskNotes || '');
    setFormBottlenecks(opp.bottlenecks ? opp.bottlenecks.join('\n') : '');
    setFormExpectedBenefits(opp.expectedBenefits ? opp.expectedBenefits.join('\n') : '');
    setFormHumanIntervention(opp.humanIntervention || '');
    setFormManualSteps(opp.manualWorkflowSteps.join('\n'));
    setFormProposedSteps(opp.proposedWorkflowSteps.join('\n'));
    setIsEditingOpp(true);
    setIsCreatingNew(true);
  };

  const handleSaveOpportunityForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formManualDesc.trim() || !formSolution.trim()) return;

    const factor = formFeasibility === 'High' ? 0.85 : formFeasibility === 'Medium' ? 0.7 : 0.5;
    const estHours = Math.round(((formFreqPerWeek * formMinutesPerTask * 52) / 60) * factor);

    const maxOppNum = opportunities.reduce((max, item) => {
      const m = /^OPP-(\d+)$/i.exec(item.id);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 100);

    const record: ProcessOpportunity = {
      id: isEditingOpp && selectedOpportunity ? selectedOpportunity.id : `OPP-${maxOppNum + 1}`,
      title: formTitle.trim(),
      department: formDept,
      manualTaskDescription: formManualDesc.trim(),
      repetitiveActivities: formRepetitive.trim(),
      frequencyPerWeek: formFreqPerWeek,
      timeSpentPerTaskMinutes: formMinutesPerTask,
      peopleInvolved: formPeopleInvolved,
      complexity: formComplexity,
      priority: formPriority,
      businessOwner: formBusinessOwner.trim() || 'Operations Lead',
      dependencies: formDependencies.split(',').map((d) => d.trim()).filter(Boolean),
      riskNotes: formRiskNotes.trim(),
      bottlenecks: formBottlenecks.split('\n').map((b) => b.trim()).filter(Boolean),
      expectedBenefits: formExpectedBenefits.split('\n').map((b) => b.trim()).filter(Boolean),
      humanIntervention: formHumanIntervention.trim(),
      automationFeasibility: formFeasibility,
      proposedSolution: formSolution.trim(),
      solutionType: formSolutionType,
      estimatedHoursSavedAnnual: estHours,
      measuredHoursSavedAnnual:
        formStatus === 'Implemented'
          ? selectedOpportunity?.measuredHoursSavedAnnual || Math.round(estHours * 0.85)
          : 0,
      status: formStatus,
      manualWorkflowSteps: formManualSteps.split('\n').filter((s) => s.trim().length > 0),
      proposedWorkflowSteps: formProposedSteps.split('\n').filter((s) => s.trim().length > 0),
      createdAt: isEditingOpp && selectedOpportunity ? selectedOpportunity.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    let updated: ProcessOpportunity[];
    if (isEditingOpp && selectedOpportunity) {
      updated = opportunities.map((o) => (o.id === selectedOpportunity.id ? record : o));
    } else {
      updated = [record, ...opportunities];
    }

    onSaveOpportunities(updated);
    setSelectedOpportunity(record);
    setIsCreatingNew(false);
  };

  const handleDeleteOpportunity = (id: string) => {
    const updated = opportunities.filter((o) => o.id !== id);
    onSaveOpportunities(updated);
    setDeleteConfirmId(null);
    setSelectedOpportunity(updated[0] || null);
  };

  const handleResetOpportunities = () => {
    onSaveOpportunities(INITIAL_OPPORTUNITIES);
    setSelectedOpportunity(INITIAL_OPPORTUNITIES[0]);
  };

  // Workflow Designer Handlers
  const handleCreateNewWorkflow = () => {
    const maxWfNum = workflows.reduce((max, wf) => {
      const m = /^WF-(\d+)$/i.exec(wf.id);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 100);

    const newWf: WorkflowDefinition = {
      id: `WF-${maxWfNum + 1}`,
      name: `Custom Airline Workflow ${workflows.length + 1}`,
      description: 'Custom automated process workflow configured by operations engineering.',
      department: selectedOpportunity?.department || 'Flight Operations',
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      steps: [
        {
          id: `s-${Date.now()}-1`,
          name: 'Event Trigger',
          type: 'Trigger',
          description: 'Subscribes to flight operations status change event.',
          config: { triggerEvent: 'FLIGHT_STATUS_UPDATED' },
        },
        {
          id: `s-${Date.now()}-2`,
          name: 'Extract Movement Telemetry',
          type: 'Data Input',
          description: 'Pulls flight parameters from operational database.',
          config: { inputSchema: 'STANDARD_FLIGHT_MANIFEST' },
        },
        {
          id: `s-${Date.now()}-3`,
          name: 'Validate Schedule Discrepancy',
          type: 'Validation',
          description: 'Checks that timestamps are properly formatted and delay minutes calculated.',
          config: { validationRule: 'delay_minutes >= 0' },
        },
        {
          id: `s-${Date.now()}-4`,
          name: 'Operational Dispatch Completed',
          type: 'End',
          description: 'Completes execution and updates CRM logs.',
          config: {},
        },
      ],
    };

    const updated = [newWf, ...workflows];
    setWorkflows(updated);
    saveStoredWorkflows(updated);
    setSelectedWorkflowId(newWf.id);
  };

  const handleMoveStep = (stepIndex: number, direction: 'up' | 'down') => {
    if (!currentWorkflow) return;
    const newSteps = [...currentWorkflow.steps];
    const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    const temp = newSteps[stepIndex];
    newSteps[stepIndex] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    const updatedWf = { ...currentWorkflow, steps: newSteps, updatedAt: new Date().toISOString().split('T')[0] };
    const updatedAll = workflows.map((w) => (w.id === currentWorkflow.id ? updatedWf : w));
    setWorkflows(updatedAll);
    saveStoredWorkflows(updatedAll);
  };

  const handleDeleteStep = (stepId: string) => {
    if (!currentWorkflow) return;
    const newSteps = currentWorkflow.steps.filter((s) => s.id !== stepId);
    const updatedWf = { ...currentWorkflow, steps: newSteps, updatedAt: new Date().toISOString().split('T')[0] };
    const updatedAll = workflows.map((w) => (w.id === currentWorkflow.id ? updatedWf : w));
    setWorkflows(updatedAll);
    saveStoredWorkflows(updatedAll);
  };

  const handleAddStepToWorkflow = () => {
    if (!currentWorkflow || !newStepName.trim()) return;
    const newStep: WorkflowStep = {
      id: `s-${Date.now()}`,
      name: newStepName.trim(),
      type: newStepType,
      description: newStepDesc.trim() || 'Custom step configured in Visual Workflow Designer.',
      config: {
        triggerEvent: newStepType === 'Trigger' ? 'CUSTOM_OPERATIONAL_EVENT' : undefined,
        validationRule: newStepType === 'Validation' ? 'COMPLIANCE_CHECK == true' : undefined,
        conditionField: newStepType === 'Condition' ? 'delay_minutes' : undefined,
        conditionOperator: '>',
        conditionValue: '15',
        approvalRole: newStepType === 'Approval' ? 'OCC Duty Dispatcher' : undefined,
        notificationChannel: newStepType === 'Notification' ? 'Email' : undefined,
      },
    };

    const newSteps = [...currentWorkflow.steps, newStep];
    const updatedWf = { ...currentWorkflow, steps: newSteps, updatedAt: new Date().toISOString().split('T')[0] };
    const updatedAll = workflows.map((w) => (w.id === currentWorkflow.id ? updatedWf : w));
    setWorkflows(updatedAll);
    saveStoredWorkflows(updatedAll);
    setShowAddStepModal(false);
    setNewStepName('');
    setNewStepDesc('');
  };

  // Run Local Workflow Simulator
  const handleExecuteSimulation = async () => {
    if (!currentWorkflow) return;
    setIsSimulating(true);
    setActiveSimulation(null);

    try {
      const runNumber = simulationRuns.filter((r) => r.workflowId === currentWorkflow.id).length + 1;
      const runResult = await simulateWorkflowExecution(currentWorkflow, selectedScenario, runNumber);
      setActiveSimulation(runResult);
      addSimulationRun(runResult);
      setSimulationRuns(getStoredSimulationRuns());
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle AI Automation Assistant Generation
  const handleGenerateAIWorkflow = async () => {
    if (!aiProcessPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResponse('');

    try {
      const data = await fetchCopilot({
        message: aiProcessPrompt,
        mode: 'WORKFLOW_GENERATION',
      });

      if (data.reply) {
        setAiResponse(data.reply);
        if (data.model) setAiModel(data.model);
      } else {
        setAiResponse('Error: Failed to generate workflow architecture.');
      }
    } catch (err: any) {
      setAiResponse(`Connection Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] min-w-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header & Sub-Tab Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Process Automation Studio</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Phase 3 Engine
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Safe Simulation Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Opportunities: <strong className="text-slate-200">{opportunities.length}</strong></span>
              <span>•</span>
              <span>Workflows: <strong className="text-purple-400">{workflows.length}</strong></span>
              <span>•</span>
              <span>Est. Annual Hours Saved: <strong className="text-blue-400">{totalHoursSaved.toLocaleString()} hrs</strong></span>
              <span>•</span>
              <span>Adoption Rate: <strong className="text-emerald-400">{adoptionRate}%</strong></span>
            </p>
          </div>
        </div>

        {/* Sub-Workspace Navigation */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('finder')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'finder'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Opportunity Finder
          </button>
          <button
            onClick={() => setActiveSubTab('designer')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'designer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Workflow Designer
          </button>
          <button
            onClick={() => setActiveSubTab('comparison')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'comparison'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            As-Is vs To-Be
          </button>
          <button
            onClick={() => setActiveSubTab('roi')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'roi'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            ROI Calculator
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Simulator & Testing
          </button>
          <button
            onClick={() => setActiveSubTab('monitor')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'monitor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Performance Monitor
          </button>
          <button
            onClick={() => setActiveSubTab('assessment')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'assessment'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Tech Assessment
          </button>
          <button
            onClick={() => setActiveSubTab('ai_assistant')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'ai_assistant'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Suggestions
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: OPPORTUNITY FINDER */}
      {activeSubTab === 'finder' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search processes, owners, or solutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Identified">Identified</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Implemented">Implemented</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Dept:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Flight Operations">Flight Operations</option>
                  <option value="Ground Handling">Ground Handling</option>
                  <option value="OCC & Dispatch">OCC & Dispatch</option>
                  <option value="Crew Planning">Crew Planning</option>
                  <option value="Customer Experience">Customer Experience</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="hours">Hours Saved</option>
                  <option value="priority">Business Priority</option>
                  <option value="status">Status</option>
                  <option value="date">Date Created</option>
                </select>
              </div>

              <button
                onClick={openNewOpportunityModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Opportunity</span>
              </button>

              <button
                onClick={handleResetOpportunities}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition"
                title="Reset to 6 airline industry benchmarks"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grid Layout: Left Cards & Right Detail Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Opportunities List */}
            <div className="lg:col-span-5 space-y-3">
              {filteredOpportunities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  No automation opportunities found matching filters.
                </div>
              ) : (
                filteredOpportunities.map((opp) => {
                  const isSelected = selectedOpportunity?.id === opp.id;
                  return (
                    <div
                      key={opp.id}
                      onClick={() => setSelectedOpportunity(opp)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-950/20 border-blue-500/60 shadow-md shadow-blue-950/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {opp.id}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityBadge(opp.priority)}`}>
                            {opp.priority || 'Medium'} Priority
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(opp.status)}`}>
                          {opp.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 mt-2 line-clamp-1">{opp.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{opp.manualTaskDescription}</p>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px]">
                        <span className="text-slate-400 truncate max-w-[140px]">{opp.department}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-[10px]">
                            {opp.frequencyPerWeek}x/wk &bull; {opp.timeSpentPerTaskMinutes}m
                          </span>
                          <span className="text-emerald-400 font-mono font-bold">
                            +{opp.estimatedHoursSavedAnnual.toLocaleString()}h/yr
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Opportunity Full Spec Inspector */}
            <div className="lg:col-span-7">
              {selectedOpportunity ? (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
                  {/* Top Bar with Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-400">{selectedOpportunity.id}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-xs text-slate-400">{selectedOpportunity.department}</span>
                        {selectedOpportunity.businessOwner && (
                          <>
                            <span className="text-slate-400">&bull;</span>
                            <span className="text-xs text-slate-300">Owner: {selectedOpportunity.businessOwner}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{selectedOpportunity.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditOpportunityModal(selectedOpportunity)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition"
                        title="Edit Opportunity"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(selectedOpportunity.id)}
                        className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition"
                        title="Delete Opportunity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Navigation Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setRoiInputs({
                          ...DEFAULT_ROI_INPUTS,
                          manualMinutesPerExecution: selectedOpportunity.timeSpentPerTaskMinutes,
                          executionsPerDay: Math.max(1, Math.round(selectedOpportunity.frequencyPerWeek / 7)),
                        });
                        setActiveSubTab('roi');
                      }}
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Calculate ROI
                    </button>
                    <button
                      onClick={() => setActiveSubTab('comparison')}
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                      As-Is vs To-Be
                    </button>
                    <button
                      onClick={() => {
                        // Find or link workflow
                        const match = workflows.find((w) => w.processId === selectedOpportunity.id);
                        if (match) setSelectedWorkflowId(match.id);
                        setActiveSubTab('designer');
                      }}
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <Workflow className="w-3.5 h-3.5 text-purple-400" />
                      Open Designer
                    </button>
                  </div>

                  {/* Metrics & Baseline Card */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Task Frequency</span>
                      <strong className="text-white font-mono">{selectedOpportunity.frequencyPerWeek}x / week</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Manual Duration</span>
                      <strong className="text-white font-mono">{selectedOpportunity.timeSpentPerTaskMinutes} min / task</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">People Involved</span>
                      <strong className="text-white font-mono">{selectedOpportunity.peopleInvolved || 2} staff</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Annual Capacity Saved</span>
                      <strong className="text-emerald-400 font-mono font-bold">
                        +{selectedOpportunity.estimatedHoursSavedAnnual.toLocaleString()} hrs/yr
                      </strong>
                    </div>
                  </div>

                  {/* Specifications Breakdown */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Current Manual Process & Bottlenecks
                      </span>
                      <p className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 leading-relaxed">
                        {selectedOpportunity.manualTaskDescription}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block mb-1">
                        Proposed Automation Solution ({selectedOpportunity.solutionType})
                      </span>
                      <p className="p-3 bg-blue-950/20 rounded-lg border border-blue-900/40 text-slate-200 leading-relaxed">
                        {selectedOpportunity.proposedSolution}
                      </p>
                    </div>

                    {selectedOpportunity.riskNotes && (
                      <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-900/40 text-slate-300 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-400 block text-[11px]">Risk & Governance Notes:</strong>
                          <span className="text-[11px] text-slate-300">{selectedOpportunity.riskNotes}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800 flex items-center justify-between">
                    <span>Registered: {selectedOpportunity.createdAt}</span>
                    <span>Last Updated: {selectedOpportunity.updatedAt}</span>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  Select an opportunity from the list to view specifications.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: VISUAL WORKFLOW DESIGNER */}
      {activeSubTab === 'designer' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-purple-400" />
                Visual Workflow Architecture Designer
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure execution triggers, data inputs, automated validations, conditions, and human approval gates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
              >
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id} – {w.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleCreateNewWorkflow}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                New Workflow
              </button>

              <button
                onClick={() => setActiveSubTab('simulator')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                Test in Simulator
              </button>

              <button
                onClick={() => {
                  const defaults = resetWorkflowsToDefault();
                  setWorkflows(defaults);
                  setSelectedWorkflowId(defaults[0]?.id || 'WF-101');
                }}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                title="Restore default seeded workflows"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Workflow Header Card */}
          {currentWorkflow && (
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-900/60">
                    {currentWorkflow.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">{currentWorkflow.department}</span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-xs text-slate-400">Status: <strong className="text-emerald-400">{currentWorkflow.status}</strong></span>
                </div>
                <button
                  onClick={() => setShowAddStepModal(true)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  Add Step
                </button>
              </div>

              <h3 className="text-base font-bold text-white">{currentWorkflow.name}</h3>
              <p className="text-xs text-slate-400">{currentWorkflow.description}</p>
            </div>
          )}

          {/* Visual Step Sequence Flowchart */}
          {currentWorkflow && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Execution Flowchart ({currentWorkflow.steps.length} Sequenced Steps)
                </span>
                <span className="text-[11px] text-slate-500">
                  Steps execute top-to-bottom in simulation mode
                </span>
              </div>

              <div className="space-y-3">
                {currentWorkflow.steps.map((step, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === currentWorkflow.steps.length - 1;

                  return (
                    <div key={step.id} className="relative">
                      {/* Step Card */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-slate-400 font-mono text-xs font-bold">
                            {idx + 1}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  step.type === 'Trigger'
                                    ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                    : step.type === 'Condition'
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                    : step.type === 'Approval'
                                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                    : step.type === 'Notification'
                                    ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                    : step.type === 'End'
                                    ? 'bg-slate-900 text-slate-400 border border-slate-800'
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                }`}
                              >
                                {step.type}
                              </span>
                              <h4 className="text-xs font-bold text-white">{step.name}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug">{step.description}</p>

                            {/* Config Preview */}
                            <div className="text-[10px] font-mono text-slate-500 pt-1 flex flex-wrap gap-2">
                              {step.config.triggerEvent && <span>Trigger: {step.config.triggerEvent}</span>}
                              {step.config.inputSchema && <span>Schema: {step.config.inputSchema}</span>}
                              {step.config.validationRule && <span>Rule: {step.config.validationRule}</span>}
                              {step.config.conditionField && (
                                <span>
                                  Condition: {step.config.conditionField} {step.config.conditionOperator} {step.config.conditionValue}
                                </span>
                              )}
                              {step.config.approvalRole && <span>Gate: {step.config.approvalRole}</span>}
                              {step.config.notificationChannel && (
                                <span>
                                  Channel: {step.config.notificationChannel} &rarr; {step.config.notificationRecipient}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Step Ordering & Action Controls */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleMoveStep(idx, 'up')}
                            disabled={isFirst}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white rounded border border-slate-800"
                            title="Move step up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveStep(idx, 'down')}
                            disabled={isLast}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white rounded border border-slate-800"
                            title="Move step down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded border border-slate-800"
                            title="Delete step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Connection Line */}
                      {!isLast && (
                        <div className="flex justify-center my-1">
                          <div className="w-0.5 h-3 bg-slate-800" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Step Modal */}
          {showAddStepModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4">
                <h3 className="text-base font-bold text-white">Add Workflow Step</h3>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Step Name</label>
                  <input
                    type="text"
                    value={newStepName}
                    onChange={(e) => setNewStepName(e.target.value)}
                    placeholder="e.g. Verify Passenger Flight Connection"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Step Type</label>
                  <select
                    value={newStepType}
                    onChange={(e) => setNewStepType(e.target.value as WorkflowStepType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Trigger">Trigger (Event Listener / Cron)</option>
                    <option value="Data Input">Data Input (API / Database query)</option>
                    <option value="Validation">Validation (Schema / Rule compliance)</option>
                    <option value="Condition">Condition (If/Else Branching)</option>
                    <option value="Approval">Approval (Human-in-the-loop gate)</option>
                    <option value="Notification">Notification (SMS / Email / Webhook / Ops Alert)</option>
                    <option value="Data Transformation">Data Transformation (Calculate / Map)</option>
                    <option value="Report Generation">Report Generation (PDF / Briefing)</option>
                    <option value="End">End (Terminate pipeline)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Step Description</label>
                  <textarea
                    value={newStepDesc}
                    onChange={(e) => setNewStepDesc(e.target.value)}
                    placeholder="Describe what automated logic this step executes..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAddStepModal(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStepToWorkflow}
                    disabled={!newStepName.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    Insert Step
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: AS-IS VS TO-BE PROCESS COMPARISON */}
      {activeSubTab === 'comparison' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-400" />
                As-Is vs To-Be Process Comparison Workspace
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Evaluate operational friction, step count compression, human touch points, and expected benefits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Opportunity:</span>
              <select
                value={selectedOpportunity?.id || ''}
                onChange={(e) => {
                  const opp = opportunities.find((o) => o.id === e.target.value);
                  if (opp) setSelectedOpportunity(opp);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-semibold"
              >
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} – {o.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedOpportunity && (
            <div className="space-y-6">
              {/* High-Level Comparison KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Manual Process Time</span>
                  <strong className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                    {selectedOpportunity.timeSpentPerTaskMinutes} min
                  </strong>
                  <span className="text-[10px] text-slate-500">Per task execution</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Proposed Automated Time</span>
                  <strong className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    {Math.max(1, Math.round(selectedOpportunity.timeSpentPerTaskMinutes * 0.1))} min
                  </strong>
                  <span className="text-[10px] text-emerald-400">~90% touch-time reduction</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Step Compression</span>
                  <strong className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                    {selectedOpportunity.manualWorkflowSteps.length} &rarr; {selectedOpportunity.proposedWorkflowSteps.length} steps
                  </strong>
                  <span className="text-[10px] text-slate-500">Optimized process sequence</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Human Intervention</span>
                  <strong className="text-sm font-bold text-slate-200 mt-1 block truncate">
                    {selectedOpportunity.humanIntervention || 'Exception Sign-Off Only'}
                  </strong>
                  <span className="text-[10px] text-slate-500">Human-in-the-loop governance</span>
                </div>
              </div>

              {/* Side-by-Side As-Is vs To-Be Workflows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* As-Is Manual */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-rose-950/60 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-rose-900/40">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                      <Clock className="w-4 h-4" />
                      Current Manual Process (As-Is)
                    </div>
                    <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                      {selectedOpportunity.manualWorkflowSteps.length} Steps
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedOpportunity.manualTaskDescription}
                  </p>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Sequence of Manual Activities:
                    </span>
                    <ol className="space-y-2 list-decimal list-inside text-xs text-slate-300">
                      {selectedOpportunity.manualWorkflowSteps.map((step, idx) => (
                        <li key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 leading-snug">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {selectedOpportunity.bottlenecks && selectedOpportunity.bottlenecks.length > 0 && (
                    <div className="p-3 bg-rose-950/30 rounded-lg border border-rose-900/50 space-y-1">
                      <strong className="text-[11px] text-rose-400 block">Identified Operational Bottlenecks:</strong>
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                        {selectedOpportunity.bottlenecks.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* To-Be Automated */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-950/60 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      Proposed Automated Solution (To-Be)
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                      {selectedOpportunity.proposedWorkflowSteps.length} Steps
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedOpportunity.proposedSolution}
                  </p>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Sequence of Automated Activities:
                    </span>
                    <ol className="space-y-2 list-decimal list-inside text-xs text-slate-200">
                      {selectedOpportunity.proposedWorkflowSteps.map((step, idx) => (
                        <li key={idx} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 leading-snug">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {selectedOpportunity.expectedBenefits && selectedOpportunity.expectedBenefits.length > 0 && (
                    <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-900/50 space-y-1">
                      <strong className="text-[11px] text-emerald-400 block">Expected Business Benefits:</strong>
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                        {selectedOpportunity.expectedBenefits.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: AUTOMATION ROI CALCULATOR */}
      {activeSubTab === 'roi' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Deterministic Automation ROI Calculator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Transparent financial modeling: computes labour capacity saved, first-year net benefit, ROI percentage, and payback months.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRoiInputs({ ...DEFAULT_ROI_INPUTS, staffHourlyCost: hourlyRate })}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold transition"
              >
                Reset Default Assumptions
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Inputs Pane */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                1. Operational & Financial Model Inputs
              </h4>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Manual Touch-Time Per Execution:</span>
                  <strong className="font-mono text-white">{roiInputs.manualMinutesPerExecution} min</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={roiInputs.manualMinutesPerExecution}
                  onChange={(e) => setRoiInputs({ ...roiInputs, manualMinutesPerExecution: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Automated Touch-Time Per Execution:</span>
                  <strong className="font-mono text-emerald-400">{roiInputs.automatedMinutesPerExecution} min</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={roiInputs.automatedMinutesPerExecution}
                  onChange={(e) => setRoiInputs({ ...roiInputs, automatedMinutesPerExecution: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Daily Execution Frequency:</span>
                  <strong className="font-mono text-white">{roiInputs.executionsPerDay} runs / day</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  step="1"
                  value={roiInputs.executionsPerDay}
                  onChange={(e) => setRoiInputs({ ...roiInputs, executionsPerDay: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Operating Days / Year</label>
                  <select
                    value={roiInputs.workingDaysPerYear}
                    onChange={(e) => setRoiInputs({ ...roiInputs, workingDaysPerYear: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                  >
                    <option value={365}>365 Days (24/7 Airline Ops)</option>
                    <option value={260}>260 Days (Corporate / 5-day)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Blended Staff Rate ($/hr)</label>
                  <input
                    type="number"
                    min="20"
                    max="300"
                    value={roiInputs.staffHourlyCost}
                    onChange={(e) => setRoiInputs({ ...roiInputs, staffHourlyCost: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">One-Time Build Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={roiInputs.oneTimeImplementationCost}
                    onChange={(e) => setRoiInputs({ ...roiInputs, oneTimeImplementationCost: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Annual Maintenance ($/yr)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={roiInputs.annualRecurringMaintenanceCost}
                    onChange={(e) => setRoiInputs({ ...roiInputs, annualRecurringMaintenanceCost: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Right Output Dashboard */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Hours Saved</span>
                  <strong className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                    {roiResults.annualHoursSaved.toLocaleString()} hrs
                  </strong>
                  <span className="text-[10px] text-slate-500">
                    From {roiResults.annualManualHours}h to {roiResults.annualAutomatedHours}h
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Labour Value Saved</span>
                  <strong className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    ${roiResults.annualLabourValueSaved.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-slate-500">Reclaimed staff capacity</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">1st-Year Net Benefit</span>
                  <strong
                    className={`text-xl font-bold font-mono mt-1 block ${
                      roiResults.estimatedFirstYearNetBenefit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ${roiResults.estimatedFirstYearNetBenefit.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-slate-500">After build + 1yr maintenance</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payback Period</span>
                  <strong className="text-xl font-bold font-mono text-purple-400 mt-1 block">
                    {roiResults.paybackPeriodMonths > 0
                      ? `${roiResults.paybackPeriodMonths} mo`
                      : roiResults.estimatedNetAnnualBenefit > 0
                      ? 'Immediate'
                      : 'No Payback'}
                  </strong>
                  <span className="text-[10px] text-slate-500">ROI: {roiResults.roiPercentage}%</span>
                </div>
              </div>

              {/* Detailed Breakdown Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Financial Accounting Breakdown
                </h4>

                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-300">
                    <span>Gross Annual Labor Capacity Value Reclaimed:</span>
                    <strong className="font-mono text-white">${roiResults.annualLabourValueSaved.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-300">
                    <span>Less: Annual Recurring Cloud & Maintenance Cost:</span>
                    <strong className="font-mono text-rose-400">-${roiResults.annualRecurringCost.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-300">
                    <span>Estimated Net Annual Benefit (Ongoing Year 2+):</span>
                    <strong className="font-mono text-emerald-400">${roiResults.estimatedNetAnnualBenefit.toLocaleString()} / yr</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900 text-slate-300">
                    <span>Less: One-Time Implementation & Development Cost:</span>
                    <strong className="font-mono text-rose-400">-${roiInputs.oneTimeImplementationCost.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-bold bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-white">Net Year 1 Capital Impact:</span>
                    <span className={`font-mono ${roiResults.estimatedFirstYearNetBenefit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${roiResults.estimatedFirstYearNetBenefit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Governance Financial Disclaimer */}
                <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Responsible Airline Financial Disclosure
                  </div>
                  <p>
                    Labour value saved represents operational capacity reclaimed from manual touch tasks. It does not constitute guaranteed liquid cash savings unless employee headcount or contractor spend is explicitly reduced.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: WORKFLOW TESTING & SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Safe Local Workflow Execution Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Execute automated workflows step-by-step with mock flight parameters. Zero external network requests or production side-effects.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Target Workflow:</span>
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-semibold"
              >
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id} – {w.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleExecuteSimulation}
                disabled={isSimulating}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow-sm"
              >
                {isSimulating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Run Safe Simulation
              </button>
            </div>
          </div>

          {/* Simulation Scenario Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRESET_SIMULATION_SCENARIOS.map((sc, i) => {
              const isSelected = selectedScenario.scenarioName === sc.scenarioName;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-950/20 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{sc.scenarioName}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    {sc.mockData.flight_id && <div>Flight: {sc.mockData.flight_id} ({sc.mockData.origin} &rarr; {sc.mockData.destination})</div>}
                    {sc.mockData.delay_minutes !== undefined && <div>Delay: +{sc.mockData.delay_minutes} min ({sc.mockData.delay_reason})</div>}
                    <div>Auto-Approve: {sc.autoApprove ? 'Yes' : 'Requires Manual Click'}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prominent Sandbox Notice */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <strong>Sandbox Guarantee:</strong> Notifications, ops alerts, and ERP purchase orders are mock simulated locally.
            </span>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">MODE: LOCAL_TRACE_ACTIVE</span>
          </div>

          {/* Active Simulation Trace */}
          {activeSimulation ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Simulation Run ID</span>
                  <strong className="text-white font-mono">{activeSimulation.id}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Workflow</span>
                  <strong className="text-purple-400">{activeSimulation.workflowName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Execution Time</span>
                  <strong className="text-slate-200 font-mono">{activeSimulation.totalDurationMs} ms</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Outcome Status</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      activeSimulation.status === 'COMPLETED_SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : activeSimulation.status === 'COMPLETED_WITH_WARNINGS'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {activeSimulation.status}
                  </span>
                </div>
              </div>

              {/* Step Logs Sequence */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Step-by-Step Execution Trace ({activeSimulation.stepLogs.length} Steps)
                </span>

                <div className="space-y-2">
                  {activeSimulation.stepLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs transition ${
                        log.status === 'SUCCESS'
                          ? 'bg-slate-950 border-emerald-900/40'
                          : log.status === 'FAILED'
                          ? 'bg-rose-950/20 border-rose-800'
                          : log.status === 'SKIPPED'
                          ? 'bg-slate-950/60 border-slate-800 text-slate-500'
                          : 'bg-purple-950/20 border-purple-800'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[10px] font-bold">#{idx + 1}</span>
                          <strong className="text-white">{log.stepName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">[{log.stepType}]</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-mono">{log.durationMs}ms</span>
                          <span
                            className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-950 text-emerald-400'
                                : log.status === 'FAILED'
                                ? 'bg-rose-950 text-rose-400'
                                : log.status === 'SKIPPED'
                                ? 'bg-slate-900 text-slate-500'
                                : 'bg-purple-950 text-purple-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{log.message}</p>

                      {log.outputData && (
                        <div className="mt-2 p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-400 overflow-x-auto">
                          Output: {JSON.stringify(log.outputData)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
              Select a scenario above and click "Run Safe Simulation" to trace workflow execution.
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 6: AUTOMATION PERFORMANCE MONITOR */}
      {activeSubTab === 'monitor' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Enterprise Automation Performance Monitor
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time operational tracking of identified opportunities, live implementations, and measured annual hours saved.
              </p>
            </div>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Opportunities</span>
              <strong className="text-2xl font-bold font-mono text-white mt-1 block">{opportunities.length}</strong>
              <span className="text-[10px] text-slate-500">Across 5 airline departments</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Production Implemented</span>
              <strong className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">{implementedCount}</strong>
              <span className="text-[10px] text-slate-500">Adoption Rate: {adoptionRate}%</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Hours Saved</span>
              <strong className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
                {totalHoursSaved.toLocaleString()}h
              </strong>
              <span className="text-[10px] text-slate-500">Formula-derived potential</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Production Hours</span>
              <strong className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                {measuredHoursSaved.toLocaleString()}h
              </strong>
              <span className="text-[10px] text-slate-500">Empirically measured in ops</span>
            </div>
          </div>

          {/* Technology Distribution Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Technology Architecture Distribution across Opportunities
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                'Event Webhook & Alerting',
                'Direct API Integration',
                'Rule-based Automation',
                'RPA Bot',
                'AI Text/Data Parser',
                'Low-code Application',
              ].map((tech) => {
                const count = opportunities.filter((o) => o.solutionType === tech).length;
                const hours = opportunities
                  .filter((o) => o.solutionType === tech)
                  .reduce((acc, o) => acc + (o.estimatedHoursSavedAnnual || 0), 0);

                return (
                  <div key={tech} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-white block mb-1">{tech}</span>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>{count} Opportunities</span>
                      <span className="text-emerald-400 font-mono font-bold">+{hours.toLocaleString()}h/yr</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Simulation History */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Recent Simulated Workflow Runs ({simulationRuns.length})
            </h4>

            {simulationRuns.length === 0 ? (
              <p className="text-xs text-slate-500">No simulated executions recorded yet.</p>
            ) : (
              <div className="space-y-2 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2 px-3">Run ID</th>
                      <th className="py-2 px-3">Workflow</th>
                      <th className="py-2 px-3">Scenario</th>
                      <th className="py-2 px-3">Duration</th>
                      <th className="py-2 px-3">Steps</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationRuns.slice(0, 10).map((r) => (
                      <tr key={r.id} className="border-b border-slate-900 hover:bg-slate-900/60 font-mono text-[11px]">
                        <td className="py-2 px-3 text-slate-400">{r.id}</td>
                        <td className="py-2 px-3 text-white font-sans font-medium">{r.workflowName}</td>
                        <td className="py-2 px-3 text-slate-300 font-sans">{r.simulatedScenario}</td>
                        <td className="py-2 px-3 text-slate-400">{r.totalDurationMs}ms</td>
                        <td className="py-2 px-3 text-slate-400">{r.stepLogs.length} steps</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.status === 'COMPLETED_SUCCESS'
                                ? 'bg-emerald-950 text-emerald-400'
                                : r.status === 'COMPLETED_WITH_WARNINGS'
                                ? 'bg-amber-950 text-amber-400'
                                : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 7: LOW-CODE / NO-CODE TECH ASSESSMENT */}
      {activeSubTab === 'assessment' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Low-Code / No-Code Technology Architecture Assessment
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Comparative evaluation framework: assesses implementation complexity, dependencies, security controls, and human oversight.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TECH_ASSESSMENTS.map((tech) => (
              <div key={tech.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      {tech.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tech.estimatedEffortWeeks} weeks effort
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{tech.technology}</h4>
                  <p className="text-slate-300 leading-relaxed">{tech.businessJustification}</p>

                  <div>
                    <strong className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Key Technical Dependencies:
                    </strong>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                      {tech.dependencies.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1">
                      Security & Governance Controls:
                    </strong>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                      {tech.securityConsiderations.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80">
                    <strong className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-0.5">
                      Human Review Gate:
                    </strong>
                    <p className="text-[11px] text-slate-300">{tech.humanReviewRequirements[0]}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
                  Ideal for: {tech.recommendedUseCases.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 8: AI-ASSISTED AUTOMATION RECOMMENDATIONS */}
      {activeSubTab === 'ai_assistant' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI-Powered Automation Architecture Recommender
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Describe any manual operational friction point to receive automated workflow sequences, technology trade-offs, and test scenarios.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Describe Manual Operational Process
              </h4>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block">Sample Prompts:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Automate outstation de-icing fluid holdover time logging',
                    'Automate wheelchair passenger gate transfer dispatch',
                    'Automate standby crew airport taxi hotel voucher distribution',
                  ].map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setAiProcessPrompt(p)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300 text-left transition"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={aiProcessPrompt}
                onChange={(e) => setAiProcessPrompt(e.target.value)}
                placeholder="Describe current manual steps, who performs them, systems used, and pain points..."
                rows={5}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
              />

              <button
                onClick={handleGenerateAIWorkflow}
                disabled={aiLoading || !aiProcessPrompt.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition shadow-sm"
              >
                {aiLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Workflow Architecture & Test Scenarios
              </button>
            </div>

            {/* Generated Specification Preview */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Generated Architecture Specification
                </h4>
                {aiResponse && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Model: {aiModel}
                  </span>
                )}
              </div>

              {aiResponse ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed max-h-[calc(100vh-20rem)] overflow-y-auto whitespace-pre-wrap">
                  {aiResponse}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  Describe a process on the left to generate an automated sequence and tech assessment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER / EDIT OPPORTUNITY */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isEditingOpp ? 'Edit Process Opportunity' : 'Register New Airline Process Opportunity'}
                </h3>
              </div>
              <button onClick={() => setIsCreatingNew(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpportunityForm} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Opportunity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Baggage Reconciliation Exception Alerting"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                  >
                    <option value="Flight Operations">Flight Operations</option>
                    <option value="Ground Handling">Ground Handling</option>
                    <option value="OCC & Dispatch">OCC & Dispatch</option>
                    <option value="Crew Planning">Crew Planning</option>
                    <option value="Customer Experience">Customer Experience</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                  >
                    <option value="Identified">Identified</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Implemented">Implemented</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Frequency (Tasks / Wk)</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={formFreqPerWeek}
                    onChange={(e) => setFormFreqPerWeek(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Manual Time (Mins / Task)</label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={formMinutesPerTask}
                    onChange={(e) => setFormMinutesPerTask(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">People Involved</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formPeopleInvolved}
                    onChange={(e) => setFormPeopleInvolved(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Solution Category</label>
                  <select
                    value={formSolutionType}
                    onChange={(e) => setFormSolutionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                  >
                    <option value="Event Webhook & Alerting">Event Webhook & Alerting</option>
                    <option value="Direct API Integration">Direct API Integration</option>
                    <option value="Rule-based Automation">Rule-based Automation</option>
                    <option value="RPA Bot">RPA Bot</option>
                    <option value="AI Text/Data Parser">AI Text/Data Parser</option>
                    <option value="Low-code Application">Low-code Application</option>
                    <option value="Workflow Automation">Workflow Automation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Business Owner</label>
                  <input
                    type="text"
                    value={formBusinessOwner}
                    onChange={(e) => setFormBusinessOwner(e.target.value)}
                    placeholder="e.g. Ramp Services Manager"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Manual Task Description</label>
                <textarea
                  rows={2}
                  required
                  value={formManualDesc}
                  onChange={(e) => setFormManualDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Proposed Automation Solution</label>
                <textarea
                  rows={2}
                  required
                  value={formSolution}
                  onChange={(e) => setFormSolution(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
                >
                  {isEditingOpp ? 'Update Opportunity' : 'Save Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete opportunity <strong>{deleteConfirmId}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOpportunity(deleteConfirmId)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
