import { ProcessDiagram, ProcessNode, ProcessEdge } from '../types';

/**
 * Sanitizes labels for Mermaid syntax
 */
function sanitizeMermaidText(text: string): string {
  if (!text) return '';
  return text.replace(/"/g, "'").replace(/[\[\]{}()]/g, '');
}

/**
 * Generates Mermaid node shape based on node type
 */
function formatMermaidNode(node: ProcessNode): string {
  const safeLabel = sanitizeMermaidText(node.label);
  const duration = node.durationMinutes ? ` (${node.durationMinutes}m)` : '';
  const display = `${safeLabel}${duration}`;

  switch (node.type) {
    case 'start':
    case 'end':
      return `${node.id}(["${display}"])`;
    case 'decision':
      return `${node.id}{"${display}?"}`;
    case 'approval':
      return `${node.id}{{"${display}"}}`;
    case 'input_output':
      return `${node.id}[/"${display}"/]`;
    case 'handoff':
      return `${node.id}>"${display}"]`;
    case 'exception':
      return `${node.id}(("${display}"))`;
    case 'activity':
    default:
      return `${node.id}["${display}"]`;
  }
}

/**
 * Generates complete Mermaid flowchart definition from a ProcessDiagram
 */
export function generateMermaidCode(diagram: ProcessDiagram): string {
  const lines: string[] = ['graph TD'];

  // Add subgraphs or style classes
  lines.push('  %% Styling classes');
  lines.push('  classDef startEnd fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;');
  lines.push('  classDef activity fill:#0f172a,stroke:#334155,stroke-width:1.5px,color:#f8fafc;');
  lines.push('  classDef decision fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;');
  lines.push('  classDef approval fill:#312e81,stroke:#a855f7,stroke-width:2px,color:#f8fafc;');
  lines.push('  classDef bottleneck fill:#450a0a,stroke:#ef4444,stroke-width:2.5px,color:#fecaca;');
  lines.push('  classDef exception fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fef2f2;');

  // Nodes
  lines.push('  %% Node definitions');
  diagram.nodes.forEach((node) => {
    lines.push(`  ${formatMermaidNode(node)}`);
  });

  // Edges
  lines.push('  %% Edge definitions');
  diagram.edges.forEach((edge) => {
    const labelPart = edge.label ? `|${sanitizeMermaidText(edge.label)}|` : '';
    if (edge.isException) {
      lines.push(`  ${edge.from} -.->${labelPart} ${edge.to}`);
    } else {
      lines.push(`  ${edge.from} -->${labelPart} ${edge.to}`);
    }
  });

  // Apply classes
  lines.push('  %% Class assignments');
  diagram.nodes.forEach((node) => {
    if (node.isBottleneck) {
      lines.push(`  class ${node.id} bottleneck;`);
    } else if (node.type === 'start' || node.type === 'end') {
      lines.push(`  class ${node.id} startEnd;`);
    } else if (node.type === 'decision') {
      lines.push(`  class ${node.id} decision;`);
    } else if (node.type === 'approval') {
      lines.push(`  class ${node.id} approval;`);
    } else if (node.type === 'exception') {
      lines.push(`  class ${node.id} exception;`);
    } else {
      lines.push(`  class ${node.id} activity;`);
    }
  });

  return lines.join('\n');
}
