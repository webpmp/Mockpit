import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Participant HUD — Spec v1 Suite', () => {
  const hudPath = path.resolve(process.cwd(), 'src/testing/components/ParticipantHUD.tsx');
  const hudContent = fs.readFileSync(hudPath, 'utf-8');

  it('1. Clock countdown icon does not contain animate-pulse in critical or urgent state', () => {
    // Non-negotiable project rule: no animate-pulse or blinking on status indicators
    assert.doesNotMatch(
      hudContent,
      /animate-pulse/,
      'ParticipantHUD must not have animate-pulse anywhere'
    );

    // Verify Clock icon has text-rose-400 for critical and text-amber-400 for urgent
    assert.match(
      hudContent,
      /isCritical\s*\?\s*['"]text-rose-400['"]/,
      'Clock icon should use text-rose-400 for critical timer state without pulse'
    );
  });

  it('2. Task instruction avoids single-line truncate and allows 2-line wrap with line-clamp-2', () => {
    // Instruction container and span must not force single-line truncate
    assert.doesNotMatch(
      hudContent,
      /<span[^>]*class(?:Name)?="[^"]*truncate[^"]*"[^>]*>\s*\{currentTask\.description\}/,
      'Task instruction span must not use truncate'
    );

    // Must use line-clamp-2 for 2-line wrapping
    assert.match(
      hudContent,
      /line-clamp-2/,
      'Task instruction should use line-clamp-2 to allow 2-line wrapping'
    );

    // Center region has min-w-0 for flex wrapping
    assert.match(
      hudContent,
      /max-w-2xl px-2 text-center min-w-0/,
      'Center column retains flex-1 max-w-2xl px-2 text-center min-w-0'
    );
  });
});
