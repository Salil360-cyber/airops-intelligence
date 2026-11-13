// src/utils/auditLogger.ts
// Local Prototype Audit Log & Data Governance Logger for AirOps Intelligence

export type AuditEntityType =
  | 'Business Problem'
  | 'Automation Opportunity'
  | 'Workflow'
  | 'Requirement'
  | 'UAT Test'
  | 'KPI Policy'
  | 'Benefits Realization'
  | 'Operational Telemetry'
  | 'Evidence Classification'
  | 'System Backup';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXECUTE'
  | 'SIMULATE'
  | 'RECLASSIFY'
  | 'EXPORT'
  | 'RESTORE'
  | 'RESET';

export interface AuditEvent {
  id: string; // e.g. "AUD-001"
  timestamp: string; // ISO 8601
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actor: string;
  previousValue?: string | null;
  newValue?: string | null;
  notes?: string;
  environment: 'Local Prototype Record';
}

const STORAGE_KEY_AUDIT_LOGS = 'airops_audit_trail_events';

export const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
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
  {
    id: 'AUD-004',
    timestamp: '2026-11-12T04:15:00Z',
    entityType: 'Business Problem',
    entityId: 'PRB-006',
    action: 'CREATE',
    actor: 'Lead Solutions Analyst',
    previousValue: null,
    newValue: 'Multi-Carrier Ground Movement Discrepancy Auditing',
    notes: 'Created Phase 4 Problem entity mapped to OPP-106.',
    environment: 'Local Prototype Record',
  },
  {
    id: 'AUD-005',
    timestamp: '2026-11-12T04:20:00Z',
    entityType: 'Requirement',
    entityId: 'BR-005',
    action: 'CREATE',
    actor: 'Business Analyst',
    previousValue: null,
    newValue: 'Turnaround Baggage Hold Handheld Scanner Reconciliation',
    notes: 'Added business requirement for SOL-104 trace.',
    environment: 'Local Prototype Record',
  },
  {
    id: 'AUD-006',
    timestamp: '2026-11-12T04:25:00Z',
    entityType: 'Requirement',
    entityId: 'BR-006',
    action: 'CREATE',
    actor: 'Business Analyst',
    previousValue: null,
    newValue: 'Outstation AOG Maintenance Part OCR & Federated Sourcing',
    notes: 'Added business requirement for SOL-105 trace.',
    environment: 'Local Prototype Record',
  },
  {
    id: 'AUD-007',
    timestamp: '2026-11-12T05:00:00Z',
    entityType: 'KPI Policy',
    entityId: 'KPI-101',
    action: 'UPDATE',
    actor: 'OCC Systems Director',
    previousValue: 'Success Threshold: 95.0%',
    newValue: 'Success Threshold: 98.0%',
    notes: 'Enforced stricter reliability threshold on automated operational workflows.',
    environment: 'Local Prototype Record',
  },
  {
    id: 'AUD-008',
    timestamp: '2026-11-12T05:15:00Z',
    entityType: 'UAT Test',
    entityId: 'TS-001',
    action: 'EXECUTE',
    actor: 'QA Test Lead',
    previousValue: 'Pending',
    newValue: 'Passed (Disruption Webhook Ingestion)',
    notes: 'Automated test runner executed with nominal payload.',
    environment: 'Local Prototype Record',
  },
];

export function getStoredAuditEvents(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse audit events from localStorage, falling back to defaults:', err);
  }
  saveStoredAuditEvents(INITIAL_AUDIT_EVENTS);
  return INITIAL_AUDIT_EVENTS;
}

export function saveStoredAuditEvents(events: AuditEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(events));
  } catch (err: any) {
    console.error('Failed to save audit events to localStorage:', err);
    if (err?.name === 'QuotaExceededError') {
      // Trim to last 100 events to prevent blocking user actions
      try {
        const trimmed = events.slice(0, 100);
        localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(trimmed));
      } catch {
        // storage completely full
      }
    }
  }
}

/**
 * Record a new audit event both locally and optionally to backend.
 */
export function recordAuditEvent(params: {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  previousValue?: string | null;
  newValue?: string | null;
  notes?: string;
  actor?: string;
}): AuditEvent {
  const current = getStoredAuditEvents();
  const maxIdNum = current.reduce((max, ev) => {
    const match = /^AUD-(\d+)$/i.exec(ev.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  const nextIdNum = maxIdNum + 1;
  const newEvent: AuditEvent = {
    id: `AUD-${String(nextIdNum).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    actor: params.actor || 'Local Session (Prototype Auditor)',
    previousValue: params.previousValue ?? null,
    newValue: params.newValue ?? null,
    notes: params.notes || '',
    environment: 'Local Prototype Record',
  };

  const updated = [newEvent, ...current];
  saveStoredAuditEvents(updated);

  // Asynchronously notify server audit log (non-blocking)
  fetch('/api/audit-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newEvent),
  }).catch(() => {
    // Offline or server unavailable - local persistence preserved
  });

  return newEvent;
}

export function resetAuditEventsToDefault(): void {
  saveStoredAuditEvents(INITIAL_AUDIT_EVENTS);
  fetch('/api/audit-events', { method: 'DELETE' }).catch(() => {});
}

export function exportAuditLogsToCSV(events: AuditEvent[]): string {
  const headers = ['Event ID', 'Timestamp', 'Entity Type', 'Entity ID', 'Action', 'Actor', 'Previous Value', 'New Value', 'Notes', 'Environment'];
  const rows = events.map((e) => [
    `"${e.id}"`,
    `"${e.timestamp}"`,
    `"${e.entityType}"`,
    `"${e.entityId}"`,
    `"${e.action}"`,
    `"${e.actor}"`,
    `"${(e.previousValue || '').replace(/"/g, '""')}"`,
    `"${(e.newValue || '').replace(/"/g, '""')}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
    `"${e.environment}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function exportAuditLogsToJSON(events: AuditEvent[]): string {
  return JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      standard: 'AeroSolutions Prototype Data Governance',
      classification: 'Local Prototype Audit Trail',
      totalEvents: events.length,
      events,
    },
    null,
    2
  );
}
