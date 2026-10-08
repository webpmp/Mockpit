import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Excluded chrome files: editor chrome outside the themed canvas (.vehicle-hmi-canvas)
export const EXCLUDED_CHROME_FILES: readonly string[] = [
  'src/components/AboutModal.tsx',
  'src/components/AppShellBackground.tsx',
  'src/components/DebugStatePanel.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/HeaderNav.tsx',
  'src/components/Inspector.tsx',
  'src/components/LayersPanel.tsx',
  'src/components/MockpitLogo.tsx',
  'src/components/NumericStepper.tsx',
  'src/components/SettingsModal.tsx',
  'src/components/Sidebar.tsx',
  'src/components/designSystem/DesignSystemPanel.tsx',
  'src/components/hmi/AuditPanel.tsx',
  'src/components/hmi/RuleInfoAffordance.tsx',
  'src/components/hmi/RuleRegistryBrowser.tsx',
];

export function scanCanvasTsxFiles(dir: string = 'src/components'): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__') {
        results.push(...scanCanvasTsxFiles(full));
      }
    } else if (entry.name.endsWith('.tsx')) {
      results.push(full.replace(/\\/g, '/'));
    }
  }
  return results.sort();
}

/**
 * Strips single-line comments (// ...), multi-line comments (/* ... *\/),
 * and JSX comments ({/* ... *\/}) from source code.
 */
export function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');
}

export const FORBIDDEN_MOTION_REGEX = /\b(?:animate-pulse|animate-ping|animate-bounce)\b/g;

describe('Motion Guard Suite (Spec 12 / 12.1)', () => {
  it('1. Scans every guarded canvas TSX component and asserts zero looping motion classes', () => {
    const allFiles = scanCanvasTsxFiles('src/components');
    const guardedFiles = allFiles.filter((f) => !EXCLUDED_CHROME_FILES.includes(f));

    assert.ok(guardedFiles.length >= 40, `Expected at least 40 guarded canvas files, found ${guardedFiles.length}`);

    const violations: { file: string; matches: string[] }[] = [];

    for (const filePath of guardedFiles) {
      const source = fs.readFileSync(filePath, 'utf8');
      const stripped = stripComments(source);
      const matches = stripped.match(FORBIDDEN_MOTION_REGEX);
      if (matches && matches.length > 0) {
        violations.push({ file: filePath, matches });
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Found forbidden motion classes in guarded canvas components:\n${violations
        .map((v) => `  - ${v.file}: ${v.matches.join(', ')}`)
        .join('\n')}`
    );
  });

  it('2. stripComments correctly strips line, block, and JSX comments while leaving code intact', () => {
    const codeWithComments = `
      // Single line comment: animate-pulse should be ignored
      /* Multi line comment: animate-ping should be ignored */
      <div>
        {/* JSX comment: strictly no animate-pulse */}
        <span className="text-ds-content" />
      </div>
    `;
    const stripped = stripComments(codeWithComments);
    assert.doesNotMatch(stripped, FORBIDDEN_MOTION_REGEX);
    assert.ok(stripped.includes('className="text-ds-content"'));
  });

  it('3. FORBIDDEN_MOTION_REGEX flags animate-pulse, animate-ping, and animate-bounce in active JSX', () => {
    const samplePulse = '<div className="w-2 h-2 rounded-full animate-pulse" />';
    const samplePing = '<div className="w-2 h-2 rounded-full animate-ping" />';
    const sampleBounce = '<div className="w-2 h-2 rounded-full animate-bounce" />';
    const sampleClean = '<div className="w-2 h-2 rounded-full animate-spin" />';

    assert.equal(stripComments(samplePulse).match(FORBIDDEN_MOTION_REGEX)?.length, 1);
    assert.equal(stripComments(samplePing).match(FORBIDDEN_MOTION_REGEX)?.length, 1);
    assert.equal(stripComments(sampleBounce).match(FORBIDDEN_MOTION_REGEX)?.length, 1);
    assert.equal(stripComments(sampleClean).match(FORBIDDEN_MOTION_REGEX), null);
  });
});
