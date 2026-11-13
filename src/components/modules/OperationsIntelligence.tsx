import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  FileText,
  Clock,
  Compass,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpDown,
  Filter,
  Check,
  TrendingUp,
  AlertCircle,
  Eye,
  Sliders,
  Plane,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { FlightRecord, OperationalMetrics, CSVValidationReport, BusinessInsight } from '../../types';
import { parseCSVAdvanced, exportToCSV, SAMPLE_CSV_TEMPLATE } from '../../utils/csvParser';
import { calculateOperationalMetrics, generateBusinessInsights } from '../../utils/calculator';

interface OperationsIntelligenceProps {
  flights: FlightRecord[];
  metrics: OperationalMetrics;
  onUpdateFlights: (newFlights: FlightRecord[], isCustom: boolean) => void;
  onResetToSample: () => void;
  isCustomData: boolean;
  otpThreshold?: number;
  onUpdateOtpThreshold?: (threshold: number) => void;
  csvPersistenceWarning?: string | null;
  onDismissPersistenceWarning?: () => void;
}

type OperationsSubTab = 'analytics' | 'explorer' | 'profiling' | 'routes' | 'insights';

export const OperationsIntelligence: React.FC<OperationsIntelligenceProps> = ({
  flights,
  metrics,
  onUpdateFlights,
  onResetToSample,
  isCustomData,
  otpThreshold: propOtpThreshold = 15,
  onUpdateOtpThreshold,
  csvPersistenceWarning,
  onDismissPersistenceWarning,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<OperationsSubTab>('analytics');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Configurable OTP threshold buffer synced with App Settings
  const [localOtpThreshold, setLocalOtpThreshold] = useState<number>(propOtpThreshold);
  const otpThreshold = onUpdateOtpThreshold ? propOtpThreshold : localOtpThreshold;
  const setOtpThreshold = (val: number) => {
    if (onUpdateOtpThreshold) {
      onUpdateOtpThreshold(val);
    } else {
      setLocalOtpThreshold(val);
    }
  };

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [airlineFilter, setAirlineFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [delaySeverityFilter, setDelaySeverityFilter] = useState<'ALL' | 'MINOR' | 'MODERATE' | 'SEVERE'>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<'flight_id' | 'airline' | 'route' | 'scheduled' | 'actual' | 'delay_minutes' | 'status'>('delay_minutes');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Flight inspection drawer state
  const [selectedFlight, setSelectedFlight] = useState<FlightRecord | null>(null);

  // Ingestion & Validation Preview Modal state
  const [validationReport, setValidationReport] = useState<CSVValidationReport | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unique lists from current dataset
  const uniqueAirlines = useMemo(() => {
    const set = new Set<string>();
    flights.forEach((f) => {
      if (f.airline) set.add(f.airline);
    });
    return Array.from(set).sort();
  }, [flights]);

  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    flights.forEach((f) => {
      if (f.date) set.add(f.date);
    });
    return Array.from(set).sort();
  }, [flights]);

  // Filtered Flights computation
  const filteredFlights = useMemo(() => {
    return flights
      .filter((f) => {
        // Status Filter
        if (statusFilter !== 'ALL' && f.flight_status !== statusFilter) {
          return false;
        }
        // Airline Filter
        if (airlineFilter !== 'ALL' && f.airline !== airlineFilter) {
          return false;
        }
        // Date Filter
        if (dateFilter !== 'ALL' && f.date !== dateFilter) {
          return false;
        }
        // Delay Severity Filter
        if (delaySeverityFilter === 'MINOR' && (f.delay_minutes < 1 || f.delay_minutes > 15)) {
          return false;
        }
        if (delaySeverityFilter === 'MODERATE' && (f.delay_minutes <= 15 || f.delay_minutes > 60)) {
          return false;
        }
        if (delaySeverityFilter === 'SEVERE' && f.delay_minutes <= 60) {
          return false;
        }

        // Search Query
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          const matchId = f.flight_id.toLowerCase().includes(q);
          const matchCarrier = f.airline?.toLowerCase().includes(q);
          const matchRoute = `${f.origin}-${f.destination}`.toLowerCase().includes(q);
          const matchCause = f.delay_reason?.toLowerCase().includes(q);
          return matchId || matchCarrier || matchRoute || matchCause;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'delay_minutes') {
          diff = (b.delay_minutes || 0) - (a.delay_minutes || 0);
        } else if (sortField === 'flight_id') {
          diff = a.flight_id.localeCompare(b.flight_id);
        } else if (sortField === 'airline') {
          diff = a.airline.localeCompare(b.airline);
        } else if (sortField === 'route') {
          diff = `${a.origin}-${a.destination}`.localeCompare(`${b.origin}-${b.destination}`);
        } else if (sortField === 'scheduled') {
          diff = a.scheduled_departure.localeCompare(b.scheduled_departure);
        } else if (sortField === 'actual') {
          diff = (a.actual_departure || '').localeCompare(b.actual_departure || '');
        } else if (sortField === 'status') {
          diff = a.flight_status.localeCompare(b.flight_status);
        }
        return sortOrder === 'desc' ? diff : -diff;
      });
  }, [flights, searchTerm, statusFilter, airlineFilter, dateFilter, delaySeverityFilter, sortField, sortOrder]);

  // Deterministic Metrics recalculation based on active filtered dataset & configurable OTP threshold
  const activeMetrics = useMemo(() => {
    return calculateOperationalMetrics(filteredFlights, otpThreshold);
  }, [filteredFlights, otpThreshold]);

  // Deterministic Business Insights based on active metrics
  const activeInsights = useMemo(() => {
    return generateBusinessInsights(activeMetrics, filteredFlights);
  }, [activeMetrics, filteredFlights]);

  // Handle CSV file selection and trigger Validation Preview Modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccessMessage(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setUploadError('Invalid file type. Please upload a standard CSV (.csv) file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_CSV_BYTES = 10 * 1024 * 1024; // 10 MB safety limit
    if (file.size > MAX_CSV_BYTES) {
      setUploadError('CSV file exceeds the 10 MB upload limit. Please upload a smaller operational dataset.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setUploadError('Unable to read content from the selected CSV file.');
        return;
      }

      const result = parseCSVAdvanced(content, file.name, file.size);

      if (result.errors.length > 0) {
        setUploadError(result.errors.join(' | '));
        return;
      }

      if (result.data.length === 0) {
        setUploadError('No valid flight records could be extracted from this CSV file.');
        return;
      }

      // Store validation report and open preview modal
      setValidationReport(result.report);
      setShowPreviewModal(true);
    };

    reader.onerror = () => {
      setUploadError('An unexpected error occurred while reading the file.');
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm and commit validated records
  const handleConfirmImport = () => {
    if (!validationReport || validationReport.validRecords.length === 0) return;

    onUpdateFlights(validationReport.validRecords, true);
    setUploadSuccessMessage(
      `Successfully imported ${validationReport.validRecords.length} valid flights from "${validationReport.fileName}".`
    );
    setShowPreviewModal(false);
    setValidationReport(null);
    // Switch to analytics view upon import
    setActiveSubTab('analytics');
  };

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'airops_sample_flight_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Export current filtered flights
  const handleExportFiltered = () => {
    const csvContent = exportToCSV(filteredFlights);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `airops_filtered_flights_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Chart data preparation
  const statusPieData = useMemo(() => {
    return [
      { name: 'On-Time', value: activeMetrics.onTimeFlights, color: '#10B981' },
      { name: 'Delayed', value: activeMetrics.delayedFlights, color: '#F59E0B' },
      { name: 'Cancelled', value: activeMetrics.cancelledFlights, color: '#EF4444' },
    ].filter((d) => d.value > 0);
  }, [activeMetrics]);

  const delayCauseData = useMemo(() => {
    return activeMetrics.topDelayCauses.slice(0, 5).map((c) => ({
      name: c.cause,
      count: c.count,
      minutes: c.totalMinutes,
      percentage: c.percentage,
    }));
  }, [activeMetrics]);

  const hourlyData = useMemo(() => {
    return activeMetrics.hourlyDistribution.map((h) => ({
      hour: h.hour,
      flights: h.total,
      delayed: h.delayed,
      avgDelay: h.avgDelay,
    }));
  }, [activeMetrics]);

  const airlineComparisonData = useMemo(() => {
    return activeMetrics.airlineBreakdown.map((a) => ({
      airline: a.airline.length > 16 ? a.airline.slice(0, 14) + '...' : a.airline,
      fullName: a.airline,
      total: a.total,
      otp: a.otp,
      avgDelay: a.avgDelay,
    }));
  }, [activeMetrics]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Ingestion Header */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Operations Intelligence &amp; Analytics Workspace</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {isCustomData ? 'Custom User Dataset' : 'Synthetic Demonstration Fleet'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic operational flight analytics, multi-column data profiling, route optimization, and preview-gated CSV ingestion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all hover:scale-[1.02]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Flight CSV</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Download standard CSV template"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Sample CSV</span>
            </button>
            <button
              onClick={handleExportFiltered}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Export currently filtered flight records"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Filtered ({filteredFlights.length})</span>
            </button>
            {isCustomData && (
              <button
                onClick={onResetToSample}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-slate-700 transition-colors"
                title="Reset to default synthetic sample fleet"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Sample</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {uploadError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <div className="flex-1 font-mono text-[11px]">{uploadError}</div>
            <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uploadSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <div className="flex-1">{uploadSuccessMessage}</div>
            <button
              onClick={() => setUploadSuccessMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {csvPersistenceWarning && (
          <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <div className="flex-1">{csvPersistenceWarning}</div>
            {onDismissPersistenceWarning && (
              <button
                onClick={onDismissPersistenceWarning}
                className="text-amber-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Workspace Subtabs & Configurable OTP Buffer Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSubTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Operations Analytics</span>
            </button>

            <button
              onClick={() => setActiveSubTab('explorer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSubTab === 'explorer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Flight Explorer ({filteredFlights.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('profiling')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSubTab === 'profiling'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dataset Profiling</span>
            </button>

            <button
              onClick={() => setActiveSubTab('routes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSubTab === 'routes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Route Intelligence ({activeMetrics.topDelayedRoutes.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('insights')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeSubTab === 'insights'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Business Insights ({activeInsights.length})</span>
            </button>
          </div>

          {/* Configurable OTP Buffer Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">OTP Threshold Buffer:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-[11px]">
              {[0, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setOtpThreshold(mins)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    otpThreshold === mins
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={mins === 15 ? 'Standard 15-minute OTP buffer' : mins === 0 ? 'Strict Zero-Tolerance OTP-0' : `OTP-${mins} buffer`}
                >
                  +{mins}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: OPERATIONS ANALYTICS DASHBOARD */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Operations KPIs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Flights */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px] font-medium uppercase tracking-wider">
                <span>Total Flights</span>
                <Plane className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-slate-100">{activeMetrics.totalFlights}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Operated Legs</div>
              </div>
            </div>

            {/* On-Time Performance */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px] font-medium uppercase tracking-wider">
                <span>OTP-{otpThreshold}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {activeMetrics.onTimePerformance}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {activeMetrics.onTimeFlights} on-time (&le;{otpThreshold}m)
                </div>
              </div>
            </div>

            {/* Delayed Flights */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px] font-medium uppercase tracking-wider">
                <span>Delayed Flights</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-amber-400">
                  {activeMetrics.delayedFlights}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {activeMetrics.delayPercentage}% delay rate
                </div>
              </div>
            </div>

            {/* Cancelled Flights */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px] font-medium uppercase tracking-wider">
                <span>Cancellations</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-rose-400">
                  {activeMetrics.cancelledFlights}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {activeMetrics.cancellationRate}% cancellation rate
                </div>
              </div>
            </div>

            {/* Average & Median Delay */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px] font-medium uppercase tracking-wider">
                <span>Avg / Median Delay</span>
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-orange-400">
                  {activeMetrics.avgDelayMinutes}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ {activeMetrics.medianDelayMinutes}m</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Total: {activeMetrics.totalDelayMinutes.toLocaleString()}m
                </div>
              </div>
            </div>

            {/* Maximum Delay Recorded */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px] font-medium uppercase tracking-wider">
                <span>Max Peak Delay</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-rose-400">
                  +{activeMetrics.maxDelay.minutes}m
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {activeMetrics.maxDelay.flight_id} ({activeMetrics.maxDelay.route})
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Status Distribution & Delay Causes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Donut Chart */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Flight Status Breakdown</h3>
                  <p className="text-[11px] text-slate-400">On-time, delayed (&gt;{otpThreshold}m), and cancelled</p>
                </div>
                <span className="text-xs font-mono text-slate-400">{activeMetrics.totalFlights} Legs</span>
              </div>

              <div className="w-full h-56 min-h-[224px] min-w-0 relative flex items-center justify-center">
                {isMounted && statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={224}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-slate-900 border border-slate-800 p-2 rounded shadow-lg text-xs">
                                <span className="font-semibold text-slate-200">{data.name}: </span>
                                <span className="font-mono text-blue-400">{data.value} flights</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-500 font-medium">No flight data available.</div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">On-Time ({activeMetrics.onTimeFlights})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Delayed ({activeMetrics.delayedFlights})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Cancelled ({activeMetrics.cancelledFlights})</span>
                </div>
              </div>
            </div>

            {/* Delay Causes Bar Chart */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col lg:col-span-2 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Root-Cause Delay Drivers</h3>
                  <p className="text-[11px] text-slate-400">Categorized operational impact (ATC, Weather, Maintenance, Baggage, Crew)</p>
                </div>
                <span className="text-xs font-mono text-amber-400">{activeMetrics.totalDelayMinutes} Total Delay Mins</span>
              </div>

              <div className="w-full h-56 min-h-[224px] min-w-0 relative">
                {!activeMetrics.hasDelayCauses ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 rounded-xl bg-slate-950/60 border border-slate-800/60">
                    <AlertCircle className="w-8 h-8 text-amber-400/80 mb-2" />
                    <div className="text-xs font-semibold text-slate-200">Delay Root Cause Analysis Unavailable</div>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-md">
                      No categorized delay reason column was detected in this dataset. AirOps policy strictly prohibits synthesizing or fabricating unverified delay codes.
                    </p>
                  </div>
                ) : isMounted ? (
                  <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={224}>
                    <BarChart data={delayCauseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                                <div className="font-semibold text-slate-100">{d.name}</div>
                                <div className="text-slate-400">
                                  Flights Affected: <span className="text-amber-400 font-mono">{d.count}</span> ({d.percentage}%)
                                </div>
                                <div className="text-slate-400">
                                  Total Minutes: <span className="text-rose-400 font-mono">{d.minutes}m</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium">Measuring chart dimensions...</div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>{activeMetrics.hasDelayCauses ? 'Aggregated by delay reason category' : 'Awaiting delay reason telemetry'}</span>
                <span className="font-mono text-[11px] text-blue-400">Deterministic Calculations</span>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Hourly Volume Area & Airline Comparison Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Volume & Delay Trend */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Hourly Flight Volume &amp; Delay Trend</h3>
                  <p className="text-[11px] text-slate-400">Scheduled departure bank volume versus delayed legs</p>
                </div>
                <span className="text-xs text-slate-400 font-mono">24h Schedule</span>
              </div>

              <div className="w-full h-56 min-h-[224px] min-w-0 relative">
                {isMounted && hourlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={224}>
                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFlightsOps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorDelayedOps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                                <div className="font-semibold text-slate-100">Hour: {d.hour}</div>
                                <div className="text-blue-400">Scheduled: {d.flights}</div>
                                <div className="text-amber-400">Delayed: {d.delayed}</div>
                                <div className="text-orange-400">Avg Delay: {d.avgDelay} min</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="flights" stroke="#3B82F6" fillOpacity={1} fill="url(#colorFlightsOps)" />
                      <Area type="monotone" dataKey="delayed" stroke="#F59E0B" fillOpacity={1} fill="url(#colorDelayedOps)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium">Measuring chart dimensions...</div>
                )}
              </div>

              <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-300">Scheduled Volume</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Delayed Legs</span>
                </div>
              </div>
            </div>

            {/* Carrier OTP Comparison Bar */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Airline Carrier OTP Comparison</h3>
                  <p className="text-[11px] text-slate-400">On-time departure rate (%) by carrier</p>
                </div>
                <span className="text-xs font-mono text-slate-400">{activeMetrics.airlineBreakdown.length} Carriers</span>
              </div>

              <div className="w-full h-56 min-h-[224px] min-w-0 relative">
                {isMounted && airlineComparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={224} minWidth={0} minHeight={224}>
                    <BarChart data={airlineComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="airline" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                                <div className="font-semibold text-slate-100">{d.fullName}</div>
                                <div className="text-emerald-400 font-mono">OTP: {d.otp}%</div>
                                <div className="text-slate-400">Operated Legs: {d.total}</div>
                                <div className="text-orange-400">Avg Delay: {d.avgDelay} min</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="otp" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium">Measuring chart dimensions...</div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Green bar represents On-Time Performance (0-100%)</span>
                <span className="font-mono text-[11px] text-emerald-400">Target &ge; 80%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: FLIGHT EXPLORER TABLE WITH DEEP SEARCH & MULTI-FILTER */}
      {activeSubTab === 'explorer' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search flight ID, route, carrier, or delay reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {/* Status */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ON_TIME">On-Time</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Carrier */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Carrier:</span>
                <select
                  value={airlineFilter}
                  onChange={(e) => setAirlineFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 max-w-[140px]"
                >
                  <option value="ALL">All Carriers</option>
                  {uniqueAirlines.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              {uniqueDates.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Date:</span>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="ALL">All Dates</option>
                    {uniqueDates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Delay Severity */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Severity:</span>
                <select
                  value={delaySeverityFilter}
                  onChange={(e) => setDelaySeverityFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Delays</option>
                  <option value="MINOR">Minor (&le; 15m)</option>
                  <option value="MODERATE">Moderate (16-60m)</option>
                  <option value="SEVERE">Severe (&gt; 60m)</option>
                </select>
              </div>

              {(statusFilter !== 'ALL' || airlineFilter !== 'ALL' || dateFilter !== 'ALL' || delaySeverityFilter !== 'ALL' || searchTerm !== '') && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setAirlineFilter('ALL');
                    setDateFilter('ALL');
                    setDelaySeverityFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium underline px-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Interactive Table */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="text-slate-200 font-semibold">
                Flight Telemetry Records{' '}
                <span className="text-slate-400 font-normal">
                  ({filteredFlights.length} of {flights.length} flights)
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">Click row for flight root-cause diagnosis</div>
            </div>

            {filteredFlights.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Info className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-sm font-medium text-slate-300">No flight records match your query.</p>
                <p className="text-xs text-slate-400">Try adjusting your search terms or clearing active filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] text-slate-400 font-medium uppercase tracking-wider select-none">
                    <tr>
                      <th
                        onClick={() => {
                          setSortField('flight_id');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="py-3 px-4 cursor-pointer hover:text-blue-300"
                      >
                        <div className="flex items-center gap-1">
                          <span>Flight ID</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          setSortField('airline');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="py-3 px-4 cursor-pointer hover:text-blue-300"
                      >
                        <div className="flex items-center gap-1">
                          <span>Carrier</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          setSortField('route');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="py-3 px-4 cursor-pointer hover:text-blue-300"
                      >
                        <div className="flex items-center gap-1">
                          <span>Route</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          setSortField('scheduled');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="py-3 px-4 cursor-pointer hover:text-blue-300"
                      >
                        <div className="flex items-center gap-1">
                          <span>Sched. / Actual</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          setSortField('delay_minutes');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="py-3 px-4 cursor-pointer hover:text-blue-300"
                      >
                        <div className="flex items-center gap-1">
                          <span>Delay</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          setSortField('status');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="py-3 px-4 cursor-pointer hover:text-blue-300"
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Delay Reason</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredFlights.map((flight, idx) => {
                      const isCancelled = flight.flight_status === 'CANCELLED';
                      const hasNumDelay = flight.delay_minutes !== undefined && flight.delay_minutes !== null && !isNaN(Number(flight.delay_minutes));
                      const isDelayed = !isCancelled && flight.flight_status !== 'DIVERTED' && (hasNumDelay ? (flight.delay_minutes > otpThreshold || (flight.delay_minutes === 0 && flight.flight_status === 'DELAYED')) : flight.flight_status === 'DELAYED');

                      return (
                        <tr
                          key={`${flight.flight_id}-${idx}`}
                          onClick={() => setSelectedFlight(flight)}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-2">
                            <span>{flight.flight_id}</span>
                            {flight.aircraft_type && (
                              <span className="text-[10px] text-slate-400 font-sans bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
                                {flight.aircraft_type}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-300 text-[11px]">
                            {flight.airline}
                          </td>
                          <td className="py-3 px-4 font-semibold text-blue-400">
                            {flight.origin} &rarr; {flight.destination}
                            <span className="text-[10px] text-slate-400 font-sans ml-1">
                              ({flight.distance} mi)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-[11px]">
                            <span className="text-slate-400">{flight.scheduled_departure}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span
                              className={
                                isCancelled
                                  ? 'text-rose-400 line-through'
                                  : isDelayed
                                  ? 'text-amber-400 font-bold'
                                  : 'text-emerald-400'
                              }
                            >
                              {isCancelled ? 'CANX' : flight.actual_departure}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isCancelled ? (
                              <span className="text-rose-400 font-semibold">N/A</span>
                            ) : flight.delay_minutes === 0 ? (
                              <span className="text-emerald-400">0 min</span>
                            ) : (
                              <span
                                className={
                                  flight.delay_minutes > otpThreshold
                                    ? 'text-amber-400 font-bold'
                                    : 'text-slate-300'
                                }
                              >
                                +{flight.delay_minutes} min
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            {flight.flight_status === 'ON_TIME' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                On-Time
                              </span>
                            )}
                            {flight.flight_status === 'DELAYED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Delayed
                              </span>
                            )}
                            {flight.flight_status === 'CANCELLED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                Cancelled
                              </span>
                            )}
                            {flight.flight_status === 'DIVERTED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                Diverted
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-300 text-[11px]">
                            {flight.delay_reason && flight.delay_reason !== 'None' ? (
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                {flight.delay_reason}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFlight(flight);
                              }}
                              className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: DATA PROFILING & HYGIENE MATRIX */}
      {activeSubTab === 'profiling' && (
        <div className="space-y-6">
          {/* Profiling Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Dataset Completeness</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {activeMetrics.dataQuality.completenessScore}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {activeMetrics.dataQuality.validRows} valid rows out of {activeMetrics.dataQuality.totalRows}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Duplicate Flight IDs</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {activeMetrics.dataQuality.duplicateRows}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {activeMetrics.dataQuality.duplicateRows === 0 ? 'Unique ID integrity intact' : 'Duplicate flight instances detected'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Airport Hubs Network</div>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                {activeMetrics.airports.allAirports.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {activeMetrics.airports.origins.length} origins, {activeMetrics.airports.destinations.length} destinations
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Date Span Coverage</div>
              <div className="text-lg font-bold font-mono text-purple-400 mt-1 truncate">
                {activeMetrics.dataQuality.dateCoverage}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {activeMetrics.dateRange.uniqueDates.length} distinct operational day(s)
              </div>
            </div>
          </div>

          {/* Missing Values Breakdown Table */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Column-by-Column Missing Value Profiling</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {activeMetrics.totalFlights} Total Records
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(activeMetrics.dataQuality.missingValues).map(([column, missingCount]) => {
                const total = activeMetrics.totalFlights || 1;
                const populatedCount = total - missingCount;
                const pct = Math.round((populatedCount / total) * 100);
                const isCore = ['flight_id', 'origin', 'destination', 'scheduled_departure', 'flight_status'].includes(column);

                return (
                  <div key={column} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-200 font-semibold">
                        {column}
                        {isCore && <span className="text-rose-400 text-[10px] ml-1">*required</span>}
                      </span>
                      <span className={missingCount === 0 ? 'text-emerald-400 font-mono font-bold' : 'text-amber-400 font-mono font-bold'}>
                        {pct}% ({populatedCount}/{total})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detected Network Entities: Airlines & Hubs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Detected Operating Carriers</h3>
              <div className="flex flex-wrap gap-2">
                {activeMetrics.dataQuality.detectedAirlines.map((airline) => (
                  <span
                    key={airline}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium"
                  >
                    {airline}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Detected Airport Hubs &amp; Outstations</h3>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {activeMetrics.dataQuality.detectedAirports.map((airport) => (
                  <span
                    key={airport}
                    className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-900/50 text-blue-300 font-semibold"
                  >
                    {airport}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Data Quality Warnings */}
          {activeMetrics.dataQuality.qualityWarnings.length > 0 && (
            <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Data Hygiene Observations ({activeMetrics.dataQuality.qualityWarnings.length})</span>
              </div>
              <ul className="space-y-1 list-disc list-inside text-slate-300 text-[11px]">
                {activeMetrics.dataQuality.qualityWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: ROUTE PERFORMANCE INTELLIGENCE */}
      {activeSubTab === 'routes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Delay-Prone Routes */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Most Delay-Prone Corridors</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Ranked by frequency of delay and average duration</p>
              </div>

              <div className="space-y-3">
                {activeMetrics.topDelayedRoutes.slice(0, 7).map((r) => {
                  const delayPct = Math.round((r.delayedCount / r.totalFlights) * 100);
                  return (
                    <div key={r.route} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-100">{r.route}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-amber-400 font-mono font-semibold">{r.avgDelay}m avg</span>
                          <span className="text-slate-400 font-mono">{r.delayedCount}/{r.totalFlights} delayed</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                          style={{ width: `${Math.min(100, delayPct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>OTP: {r.otp}%</span>
                        <span>Delay Frequency: {delayPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Performing Routes */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Best-Performing Route Benchmarks</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Highest On-Time Performance (&ge; 80% OTP)</p>
              </div>

              <div className="space-y-3">
                {activeMetrics.bestRoutes.slice(0, 7).map((r) => (
                  <div key={r.route} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-100">{r.route}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-mono font-bold">{r.otp}% OTP</span>
                        <span className="text-slate-400 font-mono">{r.totalFlights} legs</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${r.otp}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Average delay: {r.avgDelay}m</span>
                      <span className="text-emerald-400">SLA Compliant</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: DETERMINISTIC BUSINESS INSIGHTS */}
      {activeSubTab === 'insights' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-slate-200">
                Deterministic Analytical Observations
              </div>
              <p className="text-slate-400 leading-relaxed">
                Observations strictly separate calculated dataset facts from operational interpretations and recommended action items.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeInsights.map((ins) => (
              <div
                key={ins.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                        ins.severity === 'HIGH'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : ins.severity === 'MEDIUM'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {ins.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100">{ins.title}</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">AirOps Analytics Engine</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Fact */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                      [Calculated Fact]
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{ins.fact}</p>
                  </div>

                  {/* Interpretation */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                      [Operational Interpretation]
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{ins.interpretation}</p>
                  </div>

                  {/* Action Item */}
                  <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      [Recommended Action]
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{ins.actionItem}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV INGESTION PREVIEW & VALIDATION MODAL */}
      {showPreviewModal && validationReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    CSV Ingestion Validation &amp; Preview
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    File: {validationReport.fileName} ({(validationReport.fileSizeBytes / 1024).toFixed(1)} KB)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setValidationReport(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion Validation Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Total Parsed Rows</span>
                <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">
                  {validationReport.totalRowsParsed}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Valid Flights</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {validationReport.validRowsCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Invalid / Dropped</span>
                <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                  {validationReport.invalidRowsCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Duplicate IDs</span>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                  {validationReport.duplicateCount}
                </div>
              </div>
            </div>

            {/* Validation Warnings / Malformed Rows Notice */}
            {validationReport.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/50 space-y-1 text-xs">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Validation Warnings ({validationReport.warnings.length})</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                  {validationReport.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Preview Table (First 5 records) */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-200">
                Parsed Sample Preview (First {validationReport.previewRows.length} valid rows)
              </div>
              <div className="rounded-xl border border-slate-800 overflow-x-auto max-h-48">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-[10px] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3">Flight</th>
                      <th className="py-2 px-3">Carrier</th>
                      <th className="py-2 px-3">Route</th>
                      <th className="py-2 px-3">Sched</th>
                      <th className="py-2 px-3">Delay</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {validationReport.previewRows.map((r, idx) => (
                      <tr key={`${r.flight_id}-${idx}`} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-100 font-bold">{r.flight_id}</td>
                        <td className="py-2 px-3 text-slate-300">{r.airline}</td>
                        <td className="py-2 px-3 text-blue-400">{r.origin}&rarr;{r.destination}</td>
                        <td className="py-2 px-3 text-slate-400">{r.scheduled_departure}</td>
                        <td className="py-2 px-3 text-amber-400">+{r.delay_minutes}m</td>
                        <td className="py-2 px-3 text-slate-300">{r.flight_status}</td>
                        <td className="py-2 px-3 text-slate-400">{r.delay_reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setValidationReport(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all"
              >
                Apply &amp; Ingest {validationReport.validRowsCount} Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLIGHT DETAIL INSPECTION MODAL DRAWER */}
      {selectedFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-mono">
                    {selectedFlight.flight_id} Operational Diagnosis
                  </h3>
                  <p className="text-xs text-slate-400">{selectedFlight.airline}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFlight(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Route City Pair</span>
                <div className="text-sm font-bold text-blue-400 font-mono mt-0.5">
                  {selectedFlight.origin} &rarr; {selectedFlight.destination}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Distance: {selectedFlight.distance} statute miles
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Status & Timing</span>
                <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                  {selectedFlight.flight_status} (+{selectedFlight.delay_minutes}m)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Sched: {selectedFlight.scheduled_departure} | Act: {selectedFlight.actual_departure}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Aircraft & Load</span>
                <div className="text-sm font-bold text-slate-200 mt-0.5 font-mono">
                  {selectedFlight.aircraft_type || 'A320neo'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Load: {selectedFlight.passenger_load ?? 0} passengers
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Root-Cause Delay Code</span>
                <div className="text-sm font-bold text-amber-400 mt-0.5">
                  {selectedFlight.delay_reason || 'None'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Operational Delay Category</div>
              </div>
            </div>

            {/* Assessment Box */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Operational Solutions Diagnosis</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {selectedFlight.flight_status === 'ON_TIME'
                  ? `Flight departed within the ${otpThreshold}-minute buffer. Turnaround metrics and dispatch clearances satisfied operational SLA criteria.`
                  : selectedFlight.flight_status === 'CANCELLED'
                  ? 'Flight cancelled prior to departure. Impacted passengers require automated disruption notifications and re-accommodation workflows.'
                  : `Flight delayed by ${selectedFlight.delay_minutes} minutes attributed to ${
                      selectedFlight.delay_reason && selectedFlight.delay_reason !== 'None'
                        ? selectedFlight.delay_reason
                        : 'an unrecorded cause (delay telemetry absent)'
                    }. This triggers downstream rotation propagation risk on subsequent scheduled legs.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedFlight(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close Diagnosis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
