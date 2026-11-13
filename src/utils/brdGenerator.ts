import {
  BusinessProblem,
  ProcessDiagram,
  OperationalBottleneck,
  BusinessRequirement,
  FunctionalRequirement,
  NonFunctionalRequirement,
  StructuredUserStory,
  AcceptanceCriteriaItem,
  UATTestCase,
  AnalysisDocType,
} from '../types';
import { buildTraceabilityMatrix } from './requirementsStorage';

export interface DocumentMetadata {
  title: string;
  version: string;
  author: string;
  department: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Final';
  date: string;
  scope: string;
  assumptions: string[];
  risks: string[];
}

/**
 * Generates formatted Markdown for any analysis document type
 */
export function generateSpecificationDocument(
  docType: AnalysisDocType,
  metadata: DocumentMetadata,
  data: {
    problem?: BusinessProblem;
    allProblems: BusinessProblem[];
    diagrams: ProcessDiagram[];
    bottlenecks: OperationalBottleneck[];
    businessReqs: BusinessRequirement[];
    functionalReqs: FunctionalRequirement[];
    nfrs: NonFunctionalRequirement[];
    userStories: StructuredUserStory[];
    acceptanceCriteria: AcceptanceCriteriaItem[];
    testCases: UATTestCase[];
  }
): string {
  const {
    problem,
    allProblems,
    diagrams,
    bottlenecks,
    businessReqs,
    functionalReqs,
    nfrs,
    userStories,
    acceptanceCriteria,
    testCases,
  } = data;

  const activeProblem = problem || allProblems[0];
  const problemBRs = activeProblem ? businessReqs.filter((b) => b.problemId === activeProblem.id) : businessReqs;
  const problemFRs = functionalReqs.filter((f) => problemBRs.some((b) => b.id === f.businessReqId));
  const problemDiagrams = activeProblem ? diagrams.filter((d) => d.problemId === activeProblem.id) : diagrams;
  const problemBottlenecks = activeProblem ? bottlenecks.filter((b) => b.problemId === activeProblem.id) : bottlenecks;

  switch (docType) {
    case 'BRD': {
      return `# BUSINESS REQUIREMENTS DOCUMENT (BRD)
**Project Title:** ${metadata.title}
**Document Version:** ${metadata.version}  
**Classification:** Internal Operational Specification  
**Author / Lead Business Analyst:** ${metadata.author}  
**Primary Department:** ${metadata.department}  
**Status:** ${metadata.status}  
**Publication Date:** ${metadata.date}  

---

## 1. EXECUTIVE SUMMARY & BUSINESS BACKGROUND
${activeProblem ? activeProblem.description : 'This document establishes formal business and technical requirements for digital flight operations modernization.'}

### 1.1 Business Impact & Friction Cost
${activeProblem ? activeProblem.businessImpact : 'Operational delays and communication latency currently impacting On-Time Performance (OTP-15).'}

### 1.2 Target Business Outcome
${activeProblem ? activeProblem.desiredOutcome : 'Streamline operational workflows and deliver automated real-time intelligence.'}

---

## 2. PROJECT SCOPE & BOUNDARIES
### 2.1 In-Scope Capabilities
- ${metadata.scope || 'Real-time telemetry ingestion, event-driven alerting, and multi-channel notification dispatch.'}
- Algorithmic evaluation of schedule delays exceeding operational buffers.
- Integration with core airline reservation and crew planning services.

### 2.2 Out-of-Scope Capabilities
- Direct cockpit flight management control (remains under pilot-in-command authority).
- Automated ticket cancellation without human customer agreement.

---

## 3. BUSINESS STAKEHOLDER MATRIX
| Role / Title | Department | Responsibilities | Sign-off Status |
| :--- | :--- | :--- | :--- |
${activeProblem ? activeProblem.stakeholders.map((s) => `| ${s} | ${activeProblem.department} | Requirements validation & UAT review | Pending Sign-off |`).join('\n') : '| Operations Leadership | OCC | System verification | Pending |'}

---

## 4. CURRENT AS-IS PROCESS & OPERATIONAL BOTTLENECKS
### 4.1 As-Is Baseline
${activeProblem ? activeProblem.currentProcess : 'Manual spreadsheet compilation and two-way radio phone tag.'}

### 4.2 Identified Bottlenecks
${problemBottlenecks
  .map(
    (b, idx) =>
      `**${idx + 1}. [${b.id}] ${b.title}** (${b.category})\n- Impact: ${b.impactDescription}\n- Estimated Operational Delay: ${b.estimatedDelayMinutes} minutes\n- Mitigation Strategy: ${b.mitigationStrategy}`
  )
  .join('\n\n')}

---

## 5. BUSINESS REQUIREMENTS REPOSITORY
${problemBRs
  .map(
    (br) => `### [${br.id}] ${br.title}
- **Priority:** ${br.priority} | **Status:** ${br.status}
- **Description:** ${br.description}
- **Business Rationale:** ${br.businessRationale}
- **Key Stakeholder:** ${br.stakeholder}
- **System Dependencies:** ${br.dependencies.join(', ')}`
  )
  .join('\n\n')}

---

## 6. NON-FUNCTIONAL REQUIREMENTS & GOVERNANCE
| ID | Category | Specification | Metric Target | Priority |
| :--- | :--- | :--- | :--- | :--- |
${nfrs.map((n) => `| ${n.id} | ${n.category} | ${n.specification} | ${n.metricTarget} | ${n.priority} |`).join('\n')}

---

## 7. ASSUMPTIONS, RISKS & DEPENDENCIES
### 7.1 Key Assumptions
${metadata.assumptions.map((a) => `- ${a}`).join('\n')}

### 7.2 Operational Risks & Mitigation
${metadata.risks.map((r) => `- ${r}`).join('\n')}

---

## 8. FORMAL STAKEHOLDER APPROVAL SIGN-OFF
The undersigned have reviewed and approved this Business Requirements Document:

- **Business Owner:** ___________________________________ Date: ___________
- **Lead Solutions Architect:** _________________________ Date: ___________
- **Head of Operations Control:** _______________________ Date: ___________
`;
    }

    case 'FRD': {
      return `# FUNCTIONAL REQUIREMENTS SPECIFICATION (FRD)
**System Name:** AirOps Intelligence - Engineering Specification  
**Version:** ${metadata.version} | Date: ${metadata.date}  
**Status:** ${metadata.status}  

---

## 1. FUNCTIONAL ARCHITECTURE OVERVIEW
This specification provides engineering and development teams with detailed functional requirements, trigger events, input/output data contracts, validation rules, and exception handling paths.

---

## 2. DETAILED FUNCTIONAL SPECIFICATIONS
${problemFRs
  .map(
    (fr) => `### [${fr.id}] ${fr.title} (Parent: ${fr.businessReqId})
- **Priority:** ${fr.priority} | **Status:** ${fr.status}
- **System Behavior:** ${fr.systemBehavior}
- **Trigger Event:** ${fr.trigger}
- **Input Parameters:**
${fr.inputs.map((i) => `  - \`${i}\``).join('\n')}
- **Expected Outputs:**
${fr.expectedOutputs.map((o) => `  - \`${o}\``).join('\n')}
- **Validation & Business Rules:**
${fr.validationRules.map((v) => `  - ${v}`).join('\n')}
- **Error Handling & Exception Logic:**
  - ${fr.errorHandling}
- **Dependencies:** ${fr.dependencies.join(', ')}`
  )
  .join('\n\n')}

---

## 3. USER STORIES & ACCEPTANCE CRITERIA
${userStories
  .filter((s) => problemFRs.some((f) => f.id === s.functionalReqId))
  .map((s) => {
    const acs = acceptanceCriteria.filter((a) => a.userStoryId === s.id);
    return `### [${s.id}] User Story: ${s.role}
**As a** ${s.role},  
**I want** ${s.want},  
**So that** ${s.benefit}.

#### Acceptance Criteria:
${acs
  .map(
    (ac) =>
      `- **[${ac.id}] ${ac.title}** (${ac.type}${ac.requiresHumanApproval ? ' | Requires Human Approval' : ''})\n  - *Given* ${ac.given}\n  - *When* ${ac.when}\n  - *Then* ${ac.then}`
  )
  .join('\n')}`;
  })
  .join('\n\n')}
`;
    }

    case 'Process_Report': {
      const asIs = problemDiagrams.find((d) => d.mode === 'As-Is');
      const toBe = problemDiagrams.find((d) => d.mode === 'To-Be');
      return `# PROCESS MAPPING & BOTTLENECK ANALYSIS REPORT
**Target Process:** ${activeProblem ? activeProblem.title : 'Airline Operations Workflow'}  
**Department:** ${activeProblem ? activeProblem.department : 'Operations'}  
**Generated Date:** ${metadata.date}  

---

## 1. AS-IS PROCESS WORKFLOW & CURRENT LATENCY
${asIs ? asIs.title : 'Baseline Manual Workflow'}

\`\`\`mermaid
${asIs ? asIs.mermaidCode : 'graph TD\n  Start(["Start"]) --> End(["End"])'}
\`\`\`

### As-Is Step Inventory:
${asIs ? asIs.nodes.map((n) => `- **${n.label}** [${n.type}]: ${n.description} ${n.durationMinutes ? `(~${n.durationMinutes} min)` : ''} ${n.isBottleneck ? '*(BOTTLENECK)*' : ''}`).join('\n') : 'No steps recorded.'}

---

## 2. IDENTIFIED BOTTLENECKS & ROOT CAUSE ANALYSIS
${problemBottlenecks
  .map(
    (b) => `### [${b.id}] ${b.title}
- **Category:** ${b.category} | **Severity:** ${b.severity}
- **Estimated Delay Added:** ${b.estimatedDelayMinutes} minutes per execution
- **Impact Description:** ${b.impactDescription}
- **Target Mitigation:** ${b.mitigationStrategy}
- **Linked Phase 3 Opportunity:** ${b.linkedOpportunityId || 'N/A'}`
  )
  .join('\n\n')}

---

## 3. PROPOSED TO-BE AUTOMATED ARCHITECTURE
${toBe ? toBe.title : 'Target Automated Architecture'}

\`\`\`mermaid
${toBe ? toBe.mermaidCode : 'graph TD\n  Start(["Start"]) --> End(["End"])'}
\`\`\`

### To-Be Step Inventory:
${toBe ? toBe.nodes.map((n) => `- **${n.label}** [${n.type}]: ${n.description} ${n.durationMinutes ? `(~${n.durationMinutes} min)` : ''}`).join('\n') : 'No steps recorded.'}
`;
    }

    case 'Improvement_Proposal': {
      return `# AIRLINE BUSINESS SOLUTIONS IMPROVEMENT PROPOSAL
**Target Area:** ${activeProblem ? activeProblem.title : 'Operational Excellence'}  
**Department:** ${activeProblem ? activeProblem.department : 'OCC & Station Services'}  
**Lead Sponsor:** ${activeProblem ? activeProblem.businessOwner : 'Operations Committee'}  

---

## 1. PROBLEM STATEMENT & BUSINESS JUSTIFICATION
${activeProblem ? activeProblem.description : 'Operational latency introduces unnecessary flight delays and cost.'}

### Current Cost of Inaction:
${activeProblem ? activeProblem.businessImpact : 'Avoidable delays and customer frustration.'}

---

## 2. PROPOSED SOLUTION ARCHITECTURE
${activeProblem ? activeProblem.desiredOutcome : 'Deploy event-driven digital workflows with automated rule evaluation.'}

### Core Business Levers:
- Automated event streaming eliminates human polling delay.
- Algorithmic segmentation ensures high-risk connections receive priority care.
- Digital vouchers eliminate gate counter queues.

---

## 3. PROJECTED OPERATIONAL ROI
- **Estimated Annual Hours Saved:** 1,289 Hours
- **Projected Financial Value:** $109,565 / Year (based on $85/hr airline labor cost)
- **Customer Impact:** 45% reduction in gate counter queues during irregular operations.
`;
    }

    case 'User_Story_Catalogue': {
      return `# STRUCTURED USER STORY CATALOGUE & ACCEPTANCE CRITERIA
**Airline System:** AirOps Intelligence Platform  
**Total User Stories:** ${userStories.length}  
**Total Acceptance Criteria:** ${acceptanceCriteria.length}  

---

${userStories
  .map((s, idx) => {
    const acs = acceptanceCriteria.filter((a) => a.userStoryId === s.id);
    return `## STORY ${idx + 1}: [${s.id}] ${s.role}
- **Priority:** ${s.priority} | **Status:** ${s.status}
- **Linked Requirement:** ${s.functionalReqId || 'N/A'}

> **As a** ${s.role},  
> **I want** ${s.want},  
> **So that** ${s.benefit}.

### Acceptance Criteria (${acs.length}):
${acs
  .map(
    (ac) => `#### [${ac.id}] ${ac.title}
- **Type:** ${ac.type} | **Requires Human Sign-off:** ${ac.requiresHumanApproval ? 'YES' : 'NO'}
- **Given** ${ac.given}
- **When** ${ac.when}
- **Then** ${ac.then}`
  )
  .join('\n\n')}
---`;
  })
  .join('\n\n')}
`;
    }

    case 'UAT_Plan': {
      return `# USER ACCEPTANCE TESTING (UAT) PLAN & TEST EXECUTION LOG
**Test Suite:** AirOps Operational Release Verification  
**Reviewed By:** Lead Solutions QA  
**Date:** ${metadata.date}  

---

## 1. TEST EXECUTION SUMMARY
- Total Test Cases: ${testCases.length}
- Passed: ${testCases.filter((t) => t.status === 'Pass').length}
- Failed: ${testCases.filter((t) => t.status === 'Fail').length}
- Blocked: ${testCases.filter((t) => t.status === 'Blocked').length}
- Not Tested: ${testCases.filter((t) => t.status === 'Not Tested').length}

---

## 2. DETAILED TEST CASE LOG
${testCases
  .map(
    (tc) => `### [${tc.id}] ${tc.scenario}
- **Status:** **${tc.status}**
- **Linked Requirement:** ${tc.linkedReqId} | **Parent Problem:** ${tc.problemId || 'N/A'}
- **Reviewer:** ${tc.reviewer} | **Execution Timestamp:** ${tc.executedAt || 'Pending Execution'}
- **Preconditions:**
${tc.preconditions.map((p) => `  - ${p}`).join('\n')}
- **Test Steps:**
${tc.testSteps.map((s) => `  - ${s}`).join('\n')}
- **Expected Result:** ${tc.expectedResult}
- **Actual Recorded Result:** ${tc.actualResult}
- **Reviewer Notes:** ${tc.comments}
`
  )
  .join('\n\n')}
`;
    }

    case 'RTM': {
      const matrix = buildTraceabilityMatrix(
        allProblems,
        businessReqs,
        functionalReqs,
        userStories,
        testCases
      );
      return `# REQUIREMENTS TRACEABILITY MATRIX (RTM)
**Project:** AirOps Intelligence  
**Coverage Standard:** End-to-End Problem -> BR -> FR -> US -> TC  
**Date:** ${metadata.date}  

---

## 1. END-TO-END TRACEABILITY AUDIT TABLE
| Problem ID | Business Req | Functional Req | User Story | Test Case | Test Status | Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${matrix
  .map(
    (m) =>
      `| **${m.problemId}** | ${m.businessReqId} | ${m.functionalReqId} | ${m.userStoryId} | ${m.testCaseId} | **${m.testStatus}** | ${m.coverageStatus} |`
  )
  .join('\n')}

---

## 2. TRACEABILITY COVERAGE STATISTICS
- **Total Traceability Chains:** ${matrix.length}
- **Fully Covered Chains:** ${matrix.filter((m) => m.coverageStatus === 'Fully Covered').length}
- **Partially Covered Chains:** ${matrix.filter((m) => m.coverageStatus === 'Partially Covered').length}
- **Uncovered Chains:** ${matrix.filter((m) => m.coverageStatus === 'Uncovered').length}
`;
    }

    default:
      return '# SPECIFICATION DOCUMENT';
  }
}
