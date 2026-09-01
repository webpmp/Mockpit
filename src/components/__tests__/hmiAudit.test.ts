import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HMI_RULES,
  fontSizeToArcmin,
  isStandardAutomotiveIcon,
  DEFAULT_DISPLAY_CONFIG,
  AuditContext,
  RuleFinding,
} from '../../lib/hmiRules/registry';
import {
  runAudit,
  buildNavTree,
  generateAuditReportJson,
  generateAuditReportHtml,
} from '../../lib/hmiRules/auditEngine';
import { ScreenDefinition, ComponentInstance } from '../../types';

describe('HMI Compliance Rules & Audit System', () => {
  it('should register exactly 18 canonical HMI rules across expected categories and tiers', () => {
    assert.equal(HMI_RULES.length, 18);

    const ruleIds = HMI_RULES.map((r) => r.id);
    const uniqueIds = new Set(ruleIds);
    assert.equal(uniqueIds.size, 18);

    // Verify presence of all expected rule IDs
    const expectedIds = [
      'interaction.tap-target-min',
      'feedback.no-pulse',
      'overlay.no-fullscreen-driver-confirm',
      'content.no-hedging-glanceable',
      'palette.accuracy',
      'timing.response-time',
      'timing.glance-duration',
      'timing.task-glance-total',
      'timing.transition-duration',
      'feedback.input-latency',
      'ia.menu-depth',
      'ia.single-layer-priority',
      'ia.task-segmentation',
      'visual.color-not-monochrome',
      'visual.icon-standardization',
      'visual.typography-legibility',
      'modality.cascaded-input',
      'modality.moving-lockouts',
    ];

    for (const id of expectedIds) {
      assert.ok(ruleIds.includes(id), `Missing rule ID: ${id}`);
    }
  });

  it('should properly tier rules into static, runtime, and manual', () => {
    const staticRules = HMI_RULES.filter((r) => r.tier === 'static');
    const runtimeRules = HMI_RULES.filter((r) => r.tier === 'runtime');
    const manualRules = HMI_RULES.filter((r) => r.tier === 'manual');

    assert.ok(staticRules.length > 0);
    assert.ok(runtimeRules.length > 0);
    assert.ok(manualRules.length > 0);

    // All rules should have titles, descriptions, and valid tiers
    for (const rule of HMI_RULES) {
      assert.ok(rule.title.length > 0);
      assert.ok(rule.description.length > 0);
      assert.ok(rule.category.length > 0);
      assert.ok(['static', 'runtime', 'manual'].includes(rule.tier));
    }
  });

  it('should accurately calculate visual angle in arcminutes using DisplayConfig', () => {
    // Formula: arcmin ≈ 3438 * (fontSizePx * canvasScale * (displayWidthMM / 1920) * 0.7) / viewingDistanceMM
    // With 12.3" display (272.3mm width), 700mm distance, 36px font:
    // mmPerPx = 272.3 / 1920 ≈ 0.14182 mm/px
    // glyphHeight = 36 * 1.0 * 0.14182 * 0.7 ≈ 3.574 mm
    // arcmin = 3438 * (3.574 / 700) ≈ 17.5 arcmin
    const arcmin = fontSizeToArcmin(36, 1.0, DEFAULT_DISPLAY_CONFIG);
    assert.ok(arcmin > 16 && arcmin < 19);

    const smallArcmin = fontSizeToArcmin(14, 1.0, DEFAULT_DISPLAY_CONFIG);
    assert.ok(smallArcmin > 6 && smallArcmin < 9);
  });

  it('should validate ISO 2575 and SAE J2364 icon tokens and Lucide automotive mappings', () => {
    assert.equal(isStandardAutomotiveIcon('defrost-front'), true);
    assert.equal(isStandardAutomotiveIcon('hazard-warning'), true);
    assert.equal(isStandardAutomotiveIcon('tire-pressure'), true);
    assert.equal(isStandardAutomotiveIcon('battery'), true);
    assert.equal(isStandardAutomotiveIcon('wind'), true);
    assert.equal(isStandardAutomotiveIcon('thermometer'), true);
    assert.equal(isStandardAutomotiveIcon('gauge'), true);
    assert.equal(isStandardAutomotiveIcon('unknown-fancy-custom-glyph-xyz'), false);
  });

  it('should compute navigation hierarchy depth correctly and enforce <=2 levels', () => {
    const screens: ScreenDefinition[] = [
      { id: 'home', name: 'Home', transitionStyle: 'fade', parentId: null, order: 0 },
      { id: 'climate', name: 'Climate', transitionStyle: 'slideRight', parentId: null, order: 1 },
      { id: 'climate-seats', name: 'Seats', transitionStyle: 'fade', parentId: 'climate', order: 2 },
      { id: 'deep-sub', name: 'Deep Sub', transitionStyle: 'fade', parentId: 'climate-seats', order: 3 },
    ];

    const tree = buildNavTree(screens);
    assert.equal(tree.length, 2); // home and climate root nodes

    const climateNode = tree.find((n) => n.id === 'climate');
    assert.ok(climateNode);
    assert.equal(climateNode?.children?.length, 1);
    assert.equal(climateNode?.children?.[0].id, 'climate-seats');
    assert.equal(climateNode?.children?.[0].depth, 1);
    assert.equal(climateNode?.children?.[0].children?.[0].depth, 2);
  });

  it('should run static audit checks and detect tap-target size violations', () => {
    const smallComponent: ComponentInstance = {
      id: 'comp-small-btn',
      type: 'phone',
      x: 100,
      y: 100,
      width: 32, // < 44px (violation)
      height: 32, // < 44px (violation)
      staticProps: {},
      bindings: [],
    };

    const ctx: AuditContext = {
      screenId: 'test-screen',
      instances: [smallComponent],
      componentsByScreen: { 'test-screen': [smallComponent] },
      screens: [{ id: 'test-screen', name: 'Test', transitionStyle: 'fade', parentId: null, order: 0 }],
      navTree: [],
      displayConfig: DEFAULT_DISPLAY_CONFIG,
    };

    const findings = runAudit(ctx);
    const tapTargetFinding = findings.find((f) => f.ruleId === 'interaction.tap-target-min');
    assert.ok(tapTargetFinding);
    assert.equal(tapTargetFinding?.status, 'fail');
  });

  it('should return not-measured for runtime rules when no preview log is available', () => {
    const ctx: AuditContext = {
      screenId: 'test-screen',
      instances: [],
      componentsByScreen: {},
      screens: [{ id: 'test-screen', name: 'Test', transitionStyle: 'fade', parentId: null, order: 0 }],
      navTree: [],
      displayConfig: DEFAULT_DISPLAY_CONFIG,
      runtimeLog: [],
    };

    const findings = runAudit(ctx);
    const responseTimeFinding = findings.find((f) => f.ruleId === 'timing.response-time');
    assert.equal(responseTimeFinding?.status, 'not-measured');

    const latencyFinding = findings.find((f) => f.ruleId === 'feedback.input-latency');
    assert.equal(latencyFinding?.status, 'not-measured');
  });

  it('should return needs-review and heuristic glance count for manual rules', () => {
    const testComponent: ComponentInstance = {
      id: 'comp-climate-1',
      type: 'climate',
      x: 100,
      y: 100,
      width: 320,
      height: 150,
      staticProps: { label: 'CLIMATE CONTROL', details: 'Dual zone HVAC' },
      bindings: [],
    };

    const ctx: AuditContext = {
      screenId: 'test-screen',
      instances: [testComponent],
      componentsByScreen: { 'test-screen': [testComponent] },
      screens: [{ id: 'test-screen', name: 'Test', transitionStyle: 'fade', parentId: null, order: 0 }],
      navTree: [],
      displayConfig: DEFAULT_DISPLAY_CONFIG,
    };

    const findings = runAudit(ctx);
    const glanceFinding = findings.find((f) => f.ruleId === 'timing.glance-duration');
    assert.equal(glanceFinding?.status, 'needs-review');
    assert.ok((glanceFinding?.heuristicGlanceCount || 0) > 0);
  });

  it('should generate valid JSON and HTML audit reports', () => {
    const ctx: AuditContext = {
      screenId: 'home',
      instances: [],
      componentsByScreen: { home: [] },
      screens: [{ id: 'home', name: 'Home', transitionStyle: 'fade', parentId: null, order: 0 }],
      navTree: [],
      displayConfig: DEFAULT_DISPLAY_CONFIG,
    };

    const findings = runAudit(ctx);
    const jsonReport = generateAuditReportJson(findings, ctx, 'Home Screen');
    assert.equal(jsonReport.totalRules, 18);
    assert.equal(jsonReport.screenId, 'home');
    assert.ok(jsonReport.timestamp.length > 0);

    const htmlReport = generateAuditReportHtml(jsonReport);
    assert.ok(htmlReport.includes('<!DOCTYPE html>'));
    assert.ok(htmlReport.includes('HMI Compliance Audit Report'));
    assert.ok(htmlReport.includes('Home Screen'));
  });

  it('should extract and deduplicate affected components for the pinned summary row', () => {
    const comp1: ComponentInstance = {
      id: 'comp-small-1',
      type: 'phone',
      x: 100,
      y: 100,
      width: 32, // fail: < 44px
      height: 32,
      staticProps: {},
      bindings: [],
    };

    const comp2: ComponentInstance = {
      id: 'comp-small-2',
      type: 'climate',
      x: 200,
      y: 200,
      width: 30, // fail: < 44px
      height: 30,
      staticProps: {},
      bindings: [],
    };

    const comp3: ComponentInstance = {
      id: 'comp-pass-3',
      type: 'speed',
      x: 300,
      y: 300,
      width: 120, // pass
      height: 80,
      staticProps: { color: '#0ea5e9', label: 'MPH', icon: 'gauge' },
      bindings: [],
    };

    const instances = [comp1, comp2, comp3];
    const ctx: AuditContext = {
      screenId: 'home',
      instances,
      componentsByScreen: { home: instances },
      screens: [{ id: 'home', name: 'Home', transitionStyle: 'fade', parentId: null, order: 0 }],
      navTree: [],
      displayConfig: DEFAULT_DISPLAY_CONFIG,
    };

    const findings = runAudit(ctx);

    // Filter affected components having fail or warning
    const map = new Map<string, { instanceId: string; type: string; failCount: number; warnCount: number }>();
    findings.forEach((f) => {
      if ((f.status === 'fail' || f.status === 'warning') && f.instanceId) {
        const existing = map.get(f.instanceId) || {
          instanceId: f.instanceId,
          type: instances.find((i) => i.id === f.instanceId)?.type || f.instanceId,
          failCount: 0,
          warnCount: 0,
        };
        if (f.status === 'fail') existing.failCount++;
        if (f.status === 'warning') existing.warnCount++;
        map.set(f.instanceId, existing);
      }
    });

    const affected = Array.from(map.values());
    assert.equal(affected.length, 2);
    assert.ok(affected.some((a) => a.instanceId === 'comp-small-1'));
    assert.ok(affected.some((a) => a.instanceId === 'comp-small-2'));
    assert.ok(!affected.some((a) => a.instanceId === 'comp-pass-3'));
  });

  it('should rank rules by triage severity: fails first, then warnings, then passes', () => {
    const findingsList: RuleFinding[] = [
      { ruleId: 'rule-pass-1', status: 'pass', message: 'All good' },
      { ruleId: 'rule-warn-1', status: 'warning', message: 'Spacing tight' },
      { ruleId: 'rule-fail-1', status: 'fail', message: 'Too small' },
      { ruleId: 'rule-pass-2', status: 'pass', message: 'Clean' },
    ];

    const ruleIds = ['rule-pass-1', 'rule-warn-1', 'rule-fail-1', 'rule-pass-2'];
    const ranked = ruleIds.map((id) => {
      const f = findingsList.filter((x) => x.ruleId === id);
      const fails = f.filter((x) => x.status === 'fail');
      const warns = f.filter((x) => x.status === 'warning');
      let rank = 2; // pass
      if (fails.length > 0) rank = 0;
      else if (warns.length > 0) rank = 1;
      return { id, rank };
    });

    ranked.sort((a, b) => a.rank - b.rank);

    assert.equal(ranked[0].id, 'rule-fail-1');
    assert.equal(ranked[1].id, 'rule-warn-1');
    assert.equal(ranked[2].rank, 2);
    assert.equal(ranked[3].rank, 2);
  });
});
