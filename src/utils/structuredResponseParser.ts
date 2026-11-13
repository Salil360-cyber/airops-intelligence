/**
 * Utility to parse structured tags out of Copilot responses:
 * [CALCULATED FACT] or [FACT]
 * [OPERATIONAL INTERPRETATION] or [INTERPRETATION] or [ASSUMPTION]
 * [RECOMMENDATION]
 * [NEXT INVESTIGATION]
 */

export interface ParsedStructuredSections {
  fact?: string;
  interpretation?: string;
  recommendation?: string;
  nextInvestigation?: string;
  remainingText: string;
  hasStructuredSections: boolean;
}

export function parseStructuredSections(rawText: string): ParsedStructuredSections {
  if (!rawText) {
    return { remainingText: '', hasStructuredSections: false };
  }

  // Regex patterns for the 4 core structured tags
  const factPattern = /(?:\[CALCULATED FACT\]|\[FACT\])([\s\S]*?)(?=(?:\[(?:OPERATIONAL INTERPRETATION|INTERPRETATION|ASSUMPTION|RECOMMENDATION|NEXT INVESTIGATION)\]|$))/i;
  const interpPattern = /(?:\[OPERATIONAL INTERPRETATION\]|\[INTERPRETATION\]|\[ASSUMPTION\])([\s\S]*?)(?=(?:\[(?:CALCULATED FACT|FACT|RECOMMENDATION|NEXT INVESTIGATION)\]|$))/i;
  const recPattern = /(?:\[RECOMMENDATION\])([\s\S]*?)(?=(?:\[(?:CALCULATED FACT|FACT|OPERATIONAL INTERPRETATION|INTERPRETATION|ASSUMPTION|NEXT INVESTIGATION)\]|$))/i;
  const nextPattern = /(?:\[NEXT INVESTIGATION\])([\s\S]*?)(?=(?:\[(?:CALCULATED FACT|FACT|OPERATIONAL INTERPRETATION|INTERPRETATION|ASSUMPTION|RECOMMENDATION)\]|$))/i;

  const factMatch = rawText.match(factPattern);
  const interpMatch = rawText.match(interpPattern);
  const recMatch = rawText.match(recPattern);
  const nextMatch = rawText.match(nextPattern);

  const fact = factMatch ? factMatch[1].trim() : undefined;
  const interpretation = interpMatch ? interpMatch[1].trim() : undefined;
  const recommendation = recMatch ? recMatch[1].trim() : undefined;
  const nextInvestigation = nextMatch ? nextMatch[1].trim() : undefined;

  const hasStructuredSections = Boolean(fact || interpretation || recommendation || nextInvestigation);

  return {
    fact,
    interpretation,
    recommendation,
    nextInvestigation,
    remainingText: rawText,
    hasStructuredSections,
  };
}
