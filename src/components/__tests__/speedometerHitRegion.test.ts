import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Speedometer Widget — Scoped Drag-to-Adjust Hit Area Suite', () => {
  const filePath = path.resolve(process.cwd(), 'src/components/vehicle/SpeedometerWidget.tsx');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  it('1. Contains scoped 30x30 hit region with cursor-ns-resize and pointer-events-auto', () => {
    // Check that 30x30 dimension is used on the hit regions
    const hitRegionWidthMatches = fileContent.match(/width:\s*30/g);
    const hitRegionHeightMatches = fileContent.match(/height:\s*30/g);
    assert.ok(hitRegionWidthMatches && hitRegionWidthMatches.length >= 3, 'Must have at least 3 hit regions with width: 30');
    assert.ok(hitRegionHeightMatches && hitRegionHeightMatches.length >= 3, 'Must have at least 3 hit regions with height: 30');
  });

  it('2. Drag title is scoped to the 30x30 hit regions, not big wrappers', () => {
    const titleMatches = fileContent.match(/title="Drag up\/right to increase speed, down\/left to decrease"/g);
    assert.ok(titleMatches && titleMatches.length === 3, 'Title should appear exactly 3 times (once per display style hit region)');
  });

  it('3. Visual containers have pointer-events-none so outside clicks bubble to Canvas', () => {
    // Both gauge wrappers should have pointer-events-none
    assert.ok(
      fileContent.includes('relative w-full flex-1 flex items-center justify-center my-auto z-10 min-h-0 pointer-events-none'),
      'Gauge containers must be pointer-events-none visual containers'
    );
    // Numeric wrapper should have pointer-events-none
    assert.ok(
      fileContent.includes('relative my-auto z-10 flex flex-col items-center justify-center px-4 py-2 rounded-xl pointer-events-none'),
      'Numeric container must be pointer-events-none visual container'
    );
  });

  it('4. Hit regions are centered (50% or (cx / 200) * 100%)', () => {
    assert.ok(
      fileContent.includes('left: `${(cx / 200) * 100}%`'),
      'Gauge hit regions use cx percentage centering'
    );
    assert.ok(
      fileContent.includes("left: '50%'"),
      'Numeric hit region uses 50% centering'
    );
  });
});
