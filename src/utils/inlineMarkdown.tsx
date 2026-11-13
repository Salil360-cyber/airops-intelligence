import React from 'react';

/**
 * Minimal, safe renderer for the small subset of markdown that appears in
 * Copilot messages: **bold**, *italic*, `code`, "# headings" and "> notes".
 * It builds React elements only (no innerHTML), so message text is never
 * interpreted as HTML.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-slate-50">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={key} className="font-mono text-[0.9em] text-blue-300">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export function renderMessageText(text: string): React.ReactNode {
  const lines = (text || '').split('\n');
  return lines.map((line, idx) => {
    const key = `l-${idx}`;
    const newline = idx < lines.length - 1 ? '\n' : '';

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      return (
        <React.Fragment key={key}>
          <strong className="font-semibold text-slate-50">{renderInline(heading[1], key)}</strong>
          {newline}
        </React.Fragment>
      );
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      return (
        <React.Fragment key={key}>
          <span className="text-slate-400">{renderInline(quote[1], key)}</span>
          {newline}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key={key}>
        {renderInline(line, key)}
        {newline}
      </React.Fragment>
    );
  });
}
