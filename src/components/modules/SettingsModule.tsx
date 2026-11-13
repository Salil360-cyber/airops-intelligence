import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Settings,
  RotateCcw,
  Shield,
  Server,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  FileText,
  Download,
  Upload,
  Search,
  Lock,
  UserCheck,
  Activity,
  HardDrive,
  Sliders,
} from 'lucide-react';
import {
  exportFullApplicationState,
  importFullApplicationState,
  resetAllApplicationModules,
} from '../../utils/storage';
import {
  getStoredAuditEvents,
  resetAuditEventsToDefault,
  exportAuditLogsToCSV,
  exportAuditLogsToJSON,
  recordAuditEvent,
  AuditEvent,
  AuditEntityType,
  AuditAction,
} from '../../utils/auditLogger';

interface SettingsModuleProps {
  onResetAllData: () => void;
  hourlyRate: number;
  onUpdateHourlyRate: (rate: number) => void;
  otpThreshold: number;
  onUpdateOtpThreshold: (threshold: number) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  onResetAllData,
  hourlyRate,
  onUpdateHourlyRate,
  otpThreshold,
  onUpdateOtpThreshold,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'audit' | 'security' | 'backup'>('config');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Server health
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    geminiConfigured: boolean;
    timestamp: string;
    service?: string;
    environment?: string;
    auditEventsCount?: number;
  } | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => getStoredAuditEvents());
  const [auditSearch, setAuditSearch] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');

  const checkHealth = async () => {
    setHealthChecking(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
      }
    } catch (e) {
      console.error('Health check failed', e);
    } finally {
      setHealthChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleConfirmReset = () => {
    resetAllApplicationModules();
    onResetAllData();
    resetAuditEventsToDefault();
    setAuditLogs(getStoredAuditEvents());
    setConfirmingReset(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.entityId.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.notes?.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.id.toLowerCase().includes(auditSearch.toLowerCase());
      const matchEntity = auditEntityFilter === 'ALL' || log.entityType === auditEntityFilter;
      const matchAction = auditActionFilter === 'ALL' || log.action === auditActionFilter;
      return matchSearch && matchEntity && matchAction;
    });
  }, [auditLogs, auditSearch, auditEntityFilter, auditActionFilter]);

  // Export full backup
  const handleExportBackup = () => {
    const json = exportFullApplicationState();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AirOps_Enterprise_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    recordAuditEvent({
      entityType: 'System Backup',
      entityId: 'BACKUP-ARCHIVE',
      action: 'EXPORT',
      notes: 'Exported full application JSON state archive across all 22 storage stores.',
    });
    setAuditLogs(getStoredAuditEvents());
    setBackupMessage({ type: 'success', text: 'Full application backup JSON generated and downloaded successfully.' });
    setTimeout(() => setBackupMessage(null), 5000);
  };

  // Restore backup
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = importFullApplicationState(content);
        if (res.success) {
          recordAuditEvent({
            entityType: 'System Backup',
            entityId: 'BACKUP-ARCHIVE',
            action: 'RESTORE',
            notes: `Imported and restored ${res.restoredKeysCount} application data stores.`,
          });
          setAuditLogs(getStoredAuditEvents());
          setBackupMessage({ type: 'success', text: `${res.message} Please refresh browser to reload views.` });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setBackupMessage({ type: 'error', text: res.message });
        }
      } catch (err: any) {
        setBackupMessage({ type: 'error', text: `Failed to process backup file: ${err.message}` });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Audit export CSV
  const handleExportAuditCSV = () => {
    const csv = exportAuditLogsToCSV(auditLogs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AirOps_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Audit export JSON
  const handleExportAuditJSON = () => {
    const json = exportAuditLogsToJSON(auditLogs);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AirOps_Audit_Trail_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Enterprise Hardening, Governance &amp; System Configuration</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300">
              Phase 6 Active
            </span>
          </div>
          <p className="text-xs text-slate-400">
            System parameter modeling, security hardening audit, prototype authentication review, and complete data lifecycle governance.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'config' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 inline mr-1" />
            Config
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'audit' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 inline mr-1" />
            Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'security' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 inline mr-1" />
            Security &amp; Auth
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'backup' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 inline mr-1" />
            Backup &amp; Recovery
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Successfully reset all application data to standard prototype defaults!</span>
        </div>
      )}

      {backupMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            backupMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}
        >
          {backupMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{backupMessage.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. PARAMETERS & CONFIGURATION TAB                        */}
      {/* ======================================================== */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: OTP Threshold Buffer */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>On-Time Performance (OTP) Threshold</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Standard commercial aviation guidelines define a flight as On-Time if actual departure is within 15 minutes of scheduled time (OTP-15).
              </p>
              <div className="space-y-2">
                <label className="block text-slate-300 text-xs font-medium">Threshold Buffer (Minutes):</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={otpThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) onUpdateOtpThreshold(Math.max(0, Math.min(60, val)));
                    }}
                    className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400">
                    {otpThreshold === 15
                      ? '(Standard Industry OTP-15)'
                      : otpThreshold === 0
                      ? '(Strict Zero-Tolerance OTP-0)'
                      : `(Custom OTP-${otpThreshold})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Financial Model Hourly Rate */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Operational Blended Hourly Rate</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Applied to calculate theoretical operational capacity value from recovered manual hours across OCC, flight dispatch, ramp, and maintenance crews.
              </p>
              <div className="space-y-2">
                <label className="block text-slate-300 text-xs font-medium">Blended Staff Rate ($ / Hour):</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    value={hourlyRate}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) onUpdateHourlyRate(Math.max(20, Math.min(500, val)));
                    }}
                    className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400">USD / Staff Hour</span>
                </div>
              </div>
            </div>
          </div>

          {/* Backend & Persistence Status */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Server className="w-4 h-4 text-purple-400" />
                <span>Backend Architecture &amp; Service Health</span>
              </div>
              <button
                onClick={checkHealth}
                disabled={healthChecking}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${healthChecking ? 'animate-spin' : ''}`} />
                <span>Check Live Health</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">API Server Status</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-slate-200">
                    {serverHealth ? 'Online (Active)' : 'Connecting...'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Server-Side Gemini AI</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      serverHealth?.geminiConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-semibold text-slate-200">
                    {serverHealth?.geminiConfigured ? 'Secured Proxy Active' : 'Key Missing'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Rate Limiting</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-slate-200">30 req/min (Active)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Persistence Model</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold text-slate-200">Local Browser Cache</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              All Gemini API requests are proxied securely through the Node.js backend (`/api/gemini/copilot`). The API key is kept server-side in environment variables and never shipped to frontend bundles.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. AUDIT TRAIL & DATA GOVERNANCE TAB                     */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Enterprise Audit Trail &amp; Governance Ledger</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Local prototype audit log (browser storage, resettable) tracking changes across Problems, Opportunities, Workflows, Requirements, and Evidence Classifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAuditCSV}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 cursor-pointer"
              >
                <Download className="w-3 h-3 text-blue-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleExportAuditJSON}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 cursor-pointer"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit events by ID, entity, notes..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditEntityFilter}
                onChange={(e) => setAuditEntityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Entity Types</option>
                <option value="Evidence Classification">Evidence Classification</option>
                <option value="Benefits Realization">Benefits Realization</option>
                <option value="Business Problem">Business Problem</option>
                <option value="Automation Opportunity">Automation Opportunity</option>
                <option value="Workflow">Workflow</option>
                <option value="Requirement">Requirement</option>
                <option value="UAT Test">UAT Test</option>
                <option value="KPI Policy">KPI Policy</option>
                <option value="System Backup">System Backup</option>
              </select>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="EXECUTE">EXECUTE</option>
                <option value="RECLASSIFY">RECLASSIFY</option>
                <option value="EXPORT">EXPORT</option>
                <option value="RESTORE">RESTORE</option>
              </select>
            </div>
          </div>

          {/* Audit Events Table */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-3.5 py-2.5">Event ID</th>
                    <th className="px-3.5 py-2.5">Timestamp (UTC)</th>
                    <th className="px-3.5 py-2.5">Entity Type</th>
                    <th className="px-3.5 py-2.5">Entity ID</th>
                    <th className="px-3.5 py-2.5">Action</th>
                    <th className="px-3.5 py-2.5">Actor</th>
                    <th className="px-3.5 py-2.5">Previous Value &rarr; New Value</th>
                    <th className="px-3.5 py-2.5">Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAuditLogs.length > 0 ? (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3.5 py-2 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {log.id}
                        </td>
                        <td className="px-3.5 py-2 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {log.timestamp.replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="px-3.5 py-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-200">
                            {log.entityType}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 font-mono text-purple-400 whitespace-nowrap">
                          {log.entityId}
                        </td>
                        <td className="px-3.5 py-2 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              log.action === 'RECLASSIFY'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                : log.action === 'CREATE'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                : log.action === 'UPDATE'
                                ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                                : log.action === 'EXECUTE'
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-slate-300 whitespace-nowrap">
                          {log.actor}
                        </td>
                        <td className="px-3.5 py-2 text-[11px]">
                          {log.previousValue || log.newValue ? (
                            <span className="space-x-1">
                              {log.previousValue && (
                                <span className="line-through text-slate-500">{log.previousValue}</span>
                              )}
                              {log.previousValue && log.newValue && <span>&rarr;</span>}
                              {log.newValue && (
                                <span className="text-emerald-400 font-medium">{log.newValue}</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-slate-400 text-[11px] max-w-xs truncate" title={log.notes}>
                          {log.notes || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        No audit events match the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 text-right">
            Total recorded audit events: {auditLogs.length} | Local prototype governance store
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SECURITY & AUTHENTICATION REVIEW TAB                  */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Architecture Disclosure */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Prototype Architecture &amp; Authentication Disclosure</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              AirOps Intelligence is built and validated as an <strong>advanced independent portfolio prototype</strong> for an airline operational solutions team.
              In accordance with enterprise honesty standards:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-slate-300">Single-User Local Execution:</strong> Authentication is intentionally not implemented in this prototype. User identities are not fabricated, and fictitious login credentials are not simulated.
              </li>
              <li>
                <strong className="text-slate-300">Zero Client-Side Secret Leakage:</strong> Gemini API keys are never exposed in browser bundles, JavaScript bundles, or client localStorage. All AI calls flow through the backend proxy.
              </li>
              <li>
                <strong className="text-slate-300">Security Headers:</strong> Node.js Express applies `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, and `Referrer-Policy`.
              </li>
              <li>
                <strong className="text-slate-300">Rate Limiting:</strong> Enforces 30 requests/minute per client IP to safeguard AI quota and prevent denial-of-service.
              </li>
            </ul>
          </div>

          {/* Enterprise Deployment Roadmap */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Target Multi-User Enterprise Production Architecture</span>
            </div>
            <p className="text-xs text-slate-400">
              To transition this platform into a production airline environment, the following infrastructure components must be provisioned:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-blue-400 block">1. Enterprise Identity &amp; SSO</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  OIDC / OAuth 2.0 integration with corporate Microsoft Entra ID (Azure AD) or Okta, enforcing Multi-Factor Authentication (MFA) and conditional device compliance for OCC dispatchers and station leads.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-purple-400 block">2. Role-Based Access Control (RBAC)</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Strict authorization tiers: `OCC_DIRECTOR` (full approvals), `BI_ANALYST` (analytics &amp; queries), `SOLUTIONS_ARCHITECT` (workflow authoring), `STATION_MANAGER` (local adoption &amp; incident review).
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-400 block">3. Cloud Persistence &amp; Monitoring</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Migration from browser localStorage to Google Cloud Firestore or Cloud SQL (PostgreSQL), with TLS 1.3 in-transit encryption, customer-managed encryption keys (CMEK) at rest, and audit streaming to Google Cloud Operations.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-amber-400 block">4. Aviation Telemetry Connectors</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Messaging gateways for real-time flight status feeds, reservation movement parsers, and air traffic control slot feeds.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. BACKUP & RECOVERY TAB                                 */}
      {/* ======================================================== */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Full Application State Backup &amp; Recovery</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export and archive the complete application state—including the flight analytics cache, automation opportunities, business requirements, UAT test runs, portfolio tracking records, and governance audit logs—into a portable JSON archive.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download State Backup (.json)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore Backup File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleRestoreBackup}
              />
            </div>
          </div>

          {/* Danger Zone: Factory Reset */}
          <div className="p-5 rounded-xl bg-slate-950 border border-rose-950/60 space-y-3">
            <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>Factory Reset &amp; Storage Cleansing</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Clears all local browser cache records across all 5 operational phases and reinstates baseline prototype defaults. This action cannot be reversed without a prior backup archive.
            </p>
            {!confirmingReset ? (
              <button
                onClick={() => setConfirmingReset(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Factory Reset All Application Data</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="text-xs text-rose-300 font-medium">
                  Confirm full reset across all 22 prototype stores?
                </span>
                <button
                  onClick={handleConfirmReset}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Confirm Factory Reset
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
