import { TechAssessment } from '../types';

export const TECH_ASSESSMENTS: TechAssessment[] = [
  {
    id: 'tech-1',
    technology: 'Event Webhooks & Message Streaming',
    category: 'Event Webhook & Alerting',
    businessJustification:
      'Eliminates human polling of delay boards and legacy dispatch terminals. Delivers sub-second event notification when departure times shift >= 15 minutes, drastically lowering disruption latency.',
    complexity: 'Medium',
    estimatedEffortWeeks: 3,
    dependencies: [
      'Flight Operations Event Bus (Kafka, RabbitMQ, or AWS EventBridge)',
      'Secure HTTPS Webhook endpoints with HMAC SHA-256 signature verification',
    ],
    securityConsiderations: [
      'Webhook payload encryption (TLS 1.3)',
      'Idempotency keys to prevent duplicate SMS/email dispatches during reconnects',
      'Rate-limiting on consumer microservices to withstand thunderstorm bank disruptions',
    ],
    humanReviewRequirements: [
      'Automated triggers for notifications < 60m delay; mandatory dispatcher sign-off for flight cancellations or diversions.',
    ],
    recommendedUseCases: [
      'Passenger disruption notification triggers',
      'Ramp coordinator baggage hold alerts',
      'ATC departure slot revision warnings',
    ],
  },
  {
    id: 'tech-2',
    technology: 'Direct REST API & Lakehouse Ingestion',
    category: 'Direct API Integration',
    businessJustification:
      'Replaces manual morning CSV downloads, VLOOKUP spreadsheet merges, and email-based operational reporting. Provides a single source of truth for network OTP-15 metrics.',
    complexity: 'Medium',
    estimatedEffortWeeks: 4,
    dependencies: [
      'Reservation & Dispatch Movement APIs',
      'Flight Status Telemetry Feed',
      'Analytical Data Warehouse / Cloud SQL Storage',
    ],
    securityConsiderations: [
      'OAuth 2.0 Bearer tokens with strict least-privilege API scopes',
      'Masking or dropping passenger PII (PNR names, credit cards) before warehouse ingestion',
      'VPC Service Controls and IP whitelisting between airline datacenter and cloud lakehouse',
    ],
    humanReviewRequirements: [
      'Daily Operations Report reviewed and endorsed by OCC Senior Duty Manager before publishing to airline executive distribution list.',
    ],
    recommendedUseCases: [
      '05:00 UTC Executive Operations Briefing generation',
      'Hourly network OTP-15 telemetry consolidation',
      'Carrier codeshare punctuality auditing',
    ],
  },
  {
    id: 'tech-3',
    technology: 'Robotic Process Automation (RPA Bots)',
    category: 'RPA Bot',
    businessJustification:
      'Bridges gaps between legacy 3270 green-screen mainframes and modern web applications where official REST APIs are either unavailable, deprecated, or cost-prohibitive.',
    complexity: 'Medium',
    estimatedEffortWeeks: 5,
    dependencies: [
      'Headless terminal emulator / Citrix virtual desktop infrastructure',
      'Dedicated RPA runner virtual machines with credential vaults (CyberArk / HashiCorp)',
    ],
    securityConsiderations: [
      'Strict separation of bot service accounts from human employee credentials',
      'Audit logging of all screen interactions and keystrokes',
      'Automated session timeout and lock after task completion',
    ],
    humanReviewRequirements: [
      'RPA operations monitor must flag any screen layout shifts or unhandled terminal popups for human operator takeover.',
    ],
    recommendedUseCases: [
      'Legacy baggage hold reconciliation updates',
      'Reservation terminal manifest extractions',
      'Outstation fuel receipt data entry into ERP',
    ],
  },
  {
    id: 'tech-4',
    technology: 'Rule-Based Algorithmic Automation',
    category: 'Rule-based Automation',
    businessJustification:
      'Executes deterministic aviation safety and compliance rules at scale. Continuously compares flight schedules and ATC slot shifts against statutory crew duty limits.',
    complexity: 'Low',
    estimatedEffortWeeks: 2,
    dependencies: [
      'ATC Departure Slot Updates API',
      'Crew pairing and roster duty schedule feed',
    ],
    securityConsiderations: [
      'Deterministic rule engine audits to verify zero drift in legal flight time limitation computations',
      'Read-only access to crew rosters to prevent accidental duty changes without crew desk dispatch authorization',
    ],
    humanReviewRequirements: [
      'System flags high-risk flights 90 minutes in advance; standby crew callouts require human chief pilot or dispatcher approval.',
    ],
    recommendedUseCases: [
      'Crew maximum duty period expiration monitoring',
      'Airport gate turnaround buffer adherence tracking',
      'Over-water diversion alternate weather rule checks',
    ],
  },
  {
    id: 'tech-5',
    technology: 'AI Document & Multimodal OCR Processing',
    category: 'AI Text/Data Parser',
    businessJustification:
      'Extracts critical part numbers, system codes, and defect descriptions from handwritten mechanic logbooks and outstation maintenance sheets in seconds, reducing unscheduled maintenance downtime.',
    complexity: 'High',
    estimatedEffortWeeks: 6,
    dependencies: [
      'Server-side Gemini Vision / Multimodal OCR integration',
      'Maintenance & Engineering (M&E) inventory catalog',
    ],
    securityConsiderations: [
      'Zero transmission of proprietary aircraft engineering blueprints outside enterprise boundary',
      'Cryptographic hash verification of scanned airworthiness release certificates',
    ],
    humanReviewRequirements: [
      'Mandatory review and digital signature by licensed Aircraft Maintenance Engineer before dispatching spare parts to aircraft.',
    ],
    recommendedUseCases: [
      'Outstation spare parts rapid requisition',
      'Paper loadsheet optical verification',
      'Dangerous goods declaration compliance parsing',
    ],
  },
  {
    id: 'tech-6',
    technology: 'Low-Code Operations Applications',
    category: 'Low-code Application',
    businessJustification:
      'Empowers station managers and ramp supervisors to manage gate exceptions, baggage counts, and turnaround checklists from handheld tablets without waiting for 12-month IT core roadmap releases.',
    complexity: 'Low',
    estimatedEffortWeeks: 3,
    dependencies: [
      'Modern web application runtime (React / PWA)',
      'Backend REST proxy routes connected to AirOps database',
    ],
    securityConsiderations: [
      'Role-based access control (RBAC) with single sign-on (SSO) integration',
      'Offline local data cache with optimistic UI and encrypted browser storage',
    ],
    humanReviewRequirements: [
      'All exception submissions require electronic ramp supervisor acknowledgment.',
    ],
    recommendedUseCases: [
      'Ramp turnaround coordinator digital checklist',
      'Gate exception logging and wheelchair passenger tracking',
      'De-icing truck fluid log recording and holdover time calculator',
    ],
  },
];
