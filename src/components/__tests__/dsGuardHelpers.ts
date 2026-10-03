export interface RawColorFinding {
  line: number;
  text: string;
}

/**
 * Validates marker pairs in a source string:
 * - Flags ds-raw-start without matching ds-raw-end.
 * - Flags ds-raw-end without matching ds-raw-start.
 * - Flags nested ds-raw-start without closing previous block.
 */
export function findMarkerErrors(source: string): string[] {
  const lines = source.split('\n');
  const errors: string[] = [];
  let inRaw = false;
  let startLine = 0;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const hasStart = line.includes('ds-raw-start');
    const hasEnd = line.includes('ds-raw-end');

    if (hasStart && hasEnd) {
      // Single-line exemption: valid self-closing block
      return;
    }

    if (hasStart) {
      if (inRaw) {
        errors.push(
          `Line ${lineNum}: nested or duplicate ds-raw-start without closing previous block started at line ${startLine}`
        );
      }
      inRaw = true;
      startLine = lineNum;
    } else if (hasEnd) {
      if (!inRaw) {
        errors.push(`Line ${lineNum}: ds-raw-end without matching ds-raw-start`);
      }
      inRaw = false;
    }
  });

  if (inRaw) {
    errors.push(`Unmatched ds-raw-start at line ${startLine}: block never closed with ds-raw-end`);
  }

  return errors;
}

/**
 * Scans a file source for raw palette utilities, hex literals, and non-black rgb/rgba/hsl.
 * Honors ds-raw-start / ds-raw-end marker exemptions, CSS var fallbacks, black/white, and black rgba.
 */
export function findRawColors(source: string): RawColorFinding[] {
  const lines = source.split('\n');
  const findings: RawColorFinding[] = [];
  let inRaw = false;

  const rawPaletteRegex =
    /\b(?:[a-zA-Z0-9_-]+:)*(?:bg|text|border|ring|from|via|to|fill|stroke|divide|outline|shadow|decoration|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|sky|blue|emerald|green|amber|yellow|orange|rose|red|violet|purple|indigo|pink|teal|cyan|lime)-\d{2,3}(?:\/\d+)?\b/g;
  const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
  const rgbRegex = /\b(?:rgba?|hsla?)\([^)]+\)/g;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    const hasStart = line.includes('ds-raw-start');
    const hasEnd = line.includes('ds-raw-end');

    if (hasStart && hasEnd) {
      // Single-line marker exemption
      return;
    }

    if (hasStart) {
      inRaw = true;
      return;
    }

    if (inRaw) {
      if (hasEnd) {
        inRaw = false;
      }
      return;
    }

    // Strip exempt patterns before scanning:
    // 1. var(--..., #hex)
    let sanitized = line.replace(/var\(\s*--[a-zA-Z0-9_-]+\s*,\s*#[0-9a-fA-F]{3,8}\s*\)/g, 'var(--exempt)');

    // 2. Black/white rgba: rgba(0,0,0,x) or rgb(0,0,0)
    sanitized = sanitized.replace(/rgba?\(\s*0\s*,\s*0\s*,\s*0(?:\s*,\s*[\d.]+%?\s*)?\)/g, 'rgba(0,0,0,exempt)');

    // Check for raw palette utility classes
    const paletteMatches = sanitized.match(rawPaletteRegex);
    if (paletteMatches) {
      findings.push({ line: lineNum, text: paletteMatches.join(', ') });
      return;
    }

    // Check for raw hex literals
    const hexMatches = sanitized.match(hexRegex);
    if (hexMatches) {
      findings.push({ line: lineNum, text: hexMatches.join(', ') });
      return;
    }

    // Check for non-black rgb/rgba/hsl literals
    const rgbMatches = sanitized.match(rgbRegex);
    if (rgbMatches) {
      findings.push({ line: lineNum, text: rgbMatches.join(', ') });
      return;
    }
  });

  return findings;
}
