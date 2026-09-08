import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Quick Actions Caret Tooltip Attachment Suite', () => {
  const filePath = path.resolve(process.cwd(), 'src/components/QuickAccessOverlay.tsx');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  it('1. Verifies parent border mask layer is present to interrupt component bottom border', () => {
    assert.ok(fileContent.includes("height: '3px'"), 'Must contain 3px height mask layer');
    assert.ok(
      fileContent.includes("background: 'var(--quick-access-surface)'"),
      'Mask must use var(--quick-access-surface)'
    );
  });

  it('2. Verifies caret implements separate SVG paths for 36x18 fill and diagonal border only', () => {
    // Fill path exists with no stroke scaled 36x18 (2:1 aspect ratio)
    assert.ok(
      fileContent.includes('d="M 0,0 L 36,0 L 18,18 Z"'),
      'Must contain fill triangle path from M 0,0 L 36,0 L 18,18 Z'
    );
    // Diagonal border path exists with only left and right diagonal edges
    assert.ok(
      fileContent.includes('d="M 0,0 L 18,18 L 36,0"'),
      'Must contain left and right diagonal border path without top line'
    );
  });

  it('3. Verifies surface and border variables match component interior and border', () => {
    assert.ok(fileContent.includes('id="quick-access-caret"'), 'Caret element must be retained');
    assert.ok(
      fileContent.includes('rgba(15, 23, 42, 0.9)'),
      'Must use rgba(15, 23, 42, 0.9) for --quick-access-surface'
    );
    assert.ok(
      fileContent.includes('#1e293b'),
      'Must use #1e293b for --quick-access-border'
    );
    assert.ok(
      !fileContent.includes('drop-shadow-md'),
      'Must NOT use drop-shadow-md to avoid attachment artifacts'
    );
  });

  it('4. Verifies diagonal border uses rounded caps and joins', () => {
    assert.ok(
      fileContent.includes('strokeLinecap="round"') && fileContent.includes('strokeLinejoin="round"'),
      'Must have round linecap and join'
    );
  });

  it('5. Preserves proportional 36px × 18px geometry with upward overlap', () => {
    assert.ok(fileContent.includes("bottom: '-17px'"), 'Caret container must sit at bottom: -17px');
    assert.ok(fileContent.includes("width: '36px'"), 'Caret must have width: 36px');
    assert.ok(fileContent.includes("height: '20px'"), 'Caret container must have height: 20px for 2-3px upward overlap');
    assert.ok(fileContent.includes('viewBox="0 0 36 18"'), 'SVG must use viewBox="0 0 36 18" for 2:1 aspect ratio');
    assert.ok(fileContent.includes("left: `${caretOffset}px`"), 'Caret must retain left offset docking alignment');
  });
});
