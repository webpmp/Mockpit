import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { findRawColors, findMarkerErrors } from './dsGuardHelpers';

describe('Canvas Shell Color Migration Suite (Spec 2)', () => {
  it('1. ContactAvatar uses role classes and no raw slate colors', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/ContactAvatar.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(content.includes('bg-ds-surface-raised'), 'Photo wrapper must use bg-ds-surface-raised');
    assert.ok(content.includes('text-ds-content'), 'Initials wrapper must use text-ds-content');
    assert.ok(!content.includes('bg-slate-800'), 'Must not contain bg-slate-800');
    assert.ok(!content.includes('text-slate-100'), 'Must not contain text-slate-100');
  });

  it('2. VirtualKeyboard uses role classes across all keys, panels, and controls', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/VirtualKeyboard.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // Panel
    assert.ok(content.includes('bg-ds-background/95'), 'Panel must use bg-ds-background/95');
    assert.ok(content.includes('border-ds-line-subtle'), 'Panel must use border-ds-line-subtle');
    assert.ok(content.includes('text-ds-content'), 'Panel must use text-ds-content');

    // Keys
    assert.ok(content.includes('bg-ds-surface-raised border-ds-primary'), 'Active key must use ds roles');
    assert.ok(content.includes('bg-ds-surface hover:bg-ds-surface-raised active:bg-ds-surface-hover'), 'Inactive key must use ds roles');
    assert.ok(content.includes('bg-ds-primary/30 border-ds-primary/60 text-ds-primary'), 'Caps/shift active must use ds-primary');
    assert.ok(content.includes('bg-ds-primary/40 border-ds-primary text-ds-content'), 'Backspace active must use ds-primary');

    // Mic
    assert.ok(content.includes('bg-ds-error/30 border-ds-error text-ds-error'), 'Listening mic must use ds-error');
    assert.ok(content.includes('text-ds-error'), 'MicOff icon must use text-ds-error');
    assert.ok(content.includes('text-ds-primary'), 'Mic icon must use text-ds-primary');

    // No raw palette classes
    const rawClassRegex = /\b(?:bg|text|border)-(?:slate|sky|rose)-\d+/;
    assert.equal(content.match(rawClassRegex), null, 'VirtualKeyboard must have zero raw palette classes');
  });

  it('3. QuickAccessOverlay outer shell uses role classes', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/QuickAccessOverlay.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(content.includes('bg-ds-background/95'), 'Overlay shell must use bg-ds-background/95');
    assert.ok(content.includes('border-ds-line/80'), 'Overlay shell must use border-ds-line/80');
    assert.ok(!content.includes('bg-slate-950/95'), 'Must not contain bg-slate-950/95');
    assert.ok(!content.includes('border-slate-700/80'), 'Must not contain border-slate-700/80');
  });

  it('4. BottomDock container and items use role classes', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/BottomDock.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(content.includes('bg-ds-background/85'), 'Dock must use bg-ds-background/85');
    assert.ok(content.includes('border-ds-line-subtle/80'), 'Dock non-editor border must use border-ds-line-subtle/80');
    assert.ok(content.includes('bg-ds-surface-raised/90 text-ds-content'), 'Active item must use ds roles');
    assert.ok(content.includes('border-transparent text-ds-content-muted hover:text-ds-content hover:bg-ds-surface/60'), 'Inactive item must use ds roles');
    assert.ok(!content.includes('bg-slate-950/85'), 'Must not contain bg-slate-950/85');
    assert.ok(!content.includes('border-slate-800/80'), 'Must not contain border-slate-800/80');
  });

  it('5. Canvas prototype content and status bar use role classes', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/Canvas.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // Canvas frame & background
    assert.ok(content.includes('bg-slate-950 border-8 border-black'), 'Canvas frame must use bg-slate-950');
    assert.ok(content.includes('bg-gradient-to-br from-ds-background via-ds-surface to-ds-background'), 'Canvas bg must use ds gradient');

    // Empty screen placeholder
    assert.ok(content.includes('bg-ds-surface/90 border border-ds-line-subtle/80 backdrop-blur-md p-8 flex flex-col items-center justify-center text-ds-content-muted'), 'Empty screen placeholder must use ds roles');
    assert.ok(content.includes('p-4 rounded-2xl bg-ds-background border border-ds-line text-ds-primary mb-3'), 'Empty screen icon container must use ds roles');

    // Status bar
    assert.ok(content.includes('bg-ds-background/90 backdrop-blur border-b border-ds-line-subtle/60 flex items-center justify-between text-sm font-mono text-ds-content-muted'), 'Status bar must use ds roles');
    assert.ok(content.includes('bg-ds-surface border hover:bg-ds-surface-raised text-ds-content'), 'Status bar pill must use ds roles');
    assert.ok(content.includes('bg-ds-error text-white text-[9px] font-mono font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center ring-2 ring-ds-background'), 'Messages unread badge must use ds-error and ring-ds-background');
    assert.ok(content.includes('text-ds-success fill-ds-success'), 'Charging Zap must use text-ds-success fill-ds-success');
    assert.ok(!content.includes('text-ds-success fill-ds-success animate-pulse'), 'Charging Zap must not use animate-pulse');
    assert.ok(content.includes("batteryPercent <= 15 ? 'text-ds-error' : 'text-ds-content-muted'"), 'Battery icon must use text-ds-error when low');
    assert.ok(content.includes('text-ds-success pr-4 shrink-0'), 'Signal container must use text-ds-success');
    assert.ok(content.includes('bg-ds-success shadow-[0_0_6px_var(--color-ds-success,#10b981)]\' : \'bg-ds-surface-raised\''), 'Signal bars must use bg-ds-success and bg-ds-surface-raised');

    // Editor empty dropzone
    assert.ok(content.includes('border-ds-line-subtle/80 rounded-3xl flex flex-col items-center justify-center text-ds-content-subtle bg-ds-surface/20'), 'Empty editor overlay must use ds roles');
    assert.ok(content.includes('bg-ds-surface border border-ds-line mb-3 text-ds-primary'), 'Empty editor icon box must use ds roles');
  });

  it('6. VehicleBackground preserves exempt fallback', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/VehicleBackground.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(
      content.includes("const tintColor = activePalette?.primary || gridConfig?.color || '#38bdf8';"),
      'VehicleBackground must preserve exempt fallback #38bdf8'
    );
  });

  it('7. findMarkerErrors on all 6 canvas shell files reports zero errors', () => {
    const files = [
      'src/components/Canvas.tsx',
      'src/components/BottomDock.tsx',
      'src/components/QuickAccessOverlay.tsx',
      'src/components/VirtualKeyboard.tsx',
      'src/components/ContactAvatar.tsx',
      'src/components/VehicleBackground.tsx',
    ];

    for (const file of files) {
      const filePath = path.resolve(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf8');
      const errors = findMarkerErrors(content);
      assert.equal(
        errors.length,
        0,
        `Marker syntax error in ${file}:\n${errors.join('\n')}`
      );
    }
  });

  it('8. findRawColors on all 6 canvas shell files reports zero raw palette or hex tokens', () => {
    const files = [
      'src/components/Canvas.tsx',
      'src/components/BottomDock.tsx',
      'src/components/QuickAccessOverlay.tsx',
      'src/components/VirtualKeyboard.tsx',
      'src/components/ContactAvatar.tsx',
      'src/components/VehicleBackground.tsx',
    ];

    for (const file of files) {
      const filePath = path.resolve(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf8');
      const findings = findRawColors(content);
      assert.equal(
        findings.length,
        0,
        `Raw color findings in ${file}:\n${findings.map((f) => `  line ${f.line}: ${f.text}`).join('\n')}`
      );
    }
  });
});
