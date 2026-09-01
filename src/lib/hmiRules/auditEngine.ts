import {
  HMI_RULES,
  HMIRule,
  AuditContext,
  RuleFinding,
  NavNode,
  calculateGlanceHeuristic,
} from './registry';
import { ScreenDefinition, ComponentInstance } from '../../types';

/**
 * Builds a hierarchical navigation tree with calculated depth levels from a flat list of screens.
 */
export function buildNavTree(screens: ScreenDefinition[]): NavNode[] {
  const nodeMap = new Map<string, NavNode>();

  // Create base nodes
  for (const s of screens) {
    nodeMap.set(s.id, {
      id: s.id,
      name: s.name,
      parentId: s.parentId,
      depth: 0,
      children: [],
    });
  }

  // Calculate depths and build tree hierarchy
  const rootNodes: NavNode[] = [];

  for (const s of screens) {
    const node = nodeMap.get(s.id)!;
    if (!s.parentId || s.id === 'home') {
      node.depth = 0;
      rootNodes.push(node);
    } else {
      // Trace depth back to root
      let currentParentId: string | null = s.parentId;
      let depth = 1;
      const visited = new Set<string>([s.id]);

      while (currentParentId && !visited.has(currentParentId)) {
        visited.add(currentParentId);
        const parentDef = screens.find((p) => p.id === currentParentId);
        if (!parentDef || !parentDef.parentId || parentDef.id === 'home') {
          break;
        }
        depth++;
        currentParentId = parentDef.parentId;
      }

      node.depth = depth;
      const parentNode = nodeMap.get(s.parentId);
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }
  }

  return rootNodes;
}

/**
 * Creates finding for manual tier rules
 */
function createManualFinding(rule: HMIRule, ctx: AuditContext): RuleFinding {
  let heuristicGlanceCount: number | undefined;
  let message = rule.description;

  if (rule.id === 'timing.glance-duration' || rule.id === 'timing.task-glance-total') {
    // Calculate aggregate heuristic glance count for components on screen
    const instances = ctx.instances;
    if (instances.length > 0) {
      const totalGlances = instances.reduce((acc, inst) => acc + calculateGlanceHeuristic(inst), 0);
      heuristicGlanceCount = Math.round(totalGlances * 10) / 10;
      message = `Human factors evaluation required. Estimated ~${heuristicGlanceCount} glances to parse current screen components (heuristic).`;
    } else {
      heuristicGlanceCount = 1;
      message = 'Human factors evaluation required. Estimated ~1 glance (empty canvas).';
    }
  }

  return {
    ruleId: rule.id,
    status: 'needs-review',
    screenId: ctx.screenId,
    message,
    heuristicGlanceCount,
  };
}

/**
 * Creates finding for runtime tier rules when no session log is present
 */
function createNotMeasuredFinding(rule: HMIRule, ctx: AuditContext): RuleFinding {
  return {
    ruleId: rule.id,
    status: 'not-measured',
    screenId: ctx.screenId,
    message: 'Not yet measured — Run a Preview session to collect real-time interaction metrics.',
    threshold: rule.id === 'timing.response-time' ? '100–2500ms' : '<100ms',
  };
}

/**
 * Executes a full compliance audit against the HMI Rules Registry.
 *
 * @param ctx AuditContext containing component instances, screens, nav tree, and runtime metrics
 * @returns Array of RuleFinding results
 */
export function runAudit(ctx: AuditContext): RuleFinding[] {
  const allFindings: RuleFinding[] = [];

  for (const rule of HMI_RULES) {
    if (rule.tier === 'manual') {
      allFindings.push(createManualFinding(rule, ctx));
    } else if (rule.tier === 'runtime' && (!ctx.runtimeLog || ctx.runtimeLog.length === 0)) {
      allFindings.push(createNotMeasuredFinding(rule, ctx));
    } else if (rule.check) {
      try {
        const results = rule.check(ctx);
        if (results && results.length > 0) {
          allFindings.push(...results);
        } else {
          allFindings.push({
            ruleId: rule.id,
            status: 'pass',
            screenId: ctx.screenId,
            message: `Satisfies ${rule.title} standards.`,
          });
        }
      } catch (err: any) {
        allFindings.push({
          ruleId: rule.id,
          status: 'fail',
          screenId: ctx.screenId,
          message: `Audit check error: ${err?.message || String(err)}`,
        });
      }
    }
  }

  return allFindings;
}

export interface AuditReportData {
  timestamp: string;
  screenId: string;
  screenName: string;
  totalRules: number;
  staticSummary: { pass: number; fail: number; warning: number };
  runtimeSummary: { pass: number; fail: number; notMeasured: number };
  manualSummary: { reviewed: number; needsReview: number };
  findings: RuleFinding[];
  manualNotes: Record<string, { status: string; note: string }>;
  displayConfig: any;
}

/**
 * Generates structured JSON report object
 */
export function generateAuditReportJson(
  findings: RuleFinding[],
  ctx: AuditContext,
  screenName: string,
  manualNotes: Record<string, { status: string; note: string }> = {}
): AuditReportData {
  const staticFindings = findings.filter((f) => {
    const rule = HMI_RULES.find((r) => r.id === f.ruleId);
    return rule?.tier === 'static';
  });

  const runtimeFindings = findings.filter((f) => {
    const rule = HMI_RULES.find((r) => r.id === f.ruleId);
    return rule?.tier === 'runtime';
  });

  const manualFindings = findings.filter((f) => {
    const rule = HMI_RULES.find((r) => r.id === f.ruleId);
    return rule?.tier === 'manual';
  });

  return {
    timestamp: new Date().toISOString(),
    screenId: ctx.screenId,
    screenName,
    totalRules: HMI_RULES.length,
    staticSummary: {
      pass: staticFindings.filter((f) => f.status === 'pass').length,
      fail: staticFindings.filter((f) => f.status === 'fail').length,
      warning: staticFindings.filter((f) => f.status === 'warning').length,
    },
    runtimeSummary: {
      pass: runtimeFindings.filter((f) => f.status === 'pass').length,
      fail: runtimeFindings.filter((f) => f.status === 'fail').length,
      notMeasured: runtimeFindings.filter((f) => f.status === 'not-measured').length,
    },
    manualSummary: {
      reviewed: manualFindings.filter((f) => manualNotes[f.ruleId]?.status === 'reviewed').length,
      needsReview: manualFindings.filter((f) => manualNotes[f.ruleId]?.status !== 'reviewed').length,
    },
    findings,
    manualNotes,
    displayConfig: ctx.displayConfig,
  };
}

/**
 * Generates an HTML formatted audit report
 */
export function generateAuditReportHtml(report: AuditReportData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mockpit HMI Compliance Audit Report - ${report.screenName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 32px; line-height: 1.5; }
    h1, h2, h3 { color: #f8fafc; font-weight: 700; }
    .header { border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
    .meta { color: #94a3b8; font-size: 14px; margin-top: 4px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .badge-pass { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
    .badge-fail { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }
    .badge-warn { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #f59e0b; }
    .badge-info { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #0284c7; }
    .badge-review { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border: 1px solid #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #1e293b; font-size: 13px; }
    th { background: #0f172a; color: #94a3b8; font-size: 12px; text-transform: uppercase; }
    .note-box { background: #0f172a; border-left: 3px solid #38bdf8; padding: 8px 12px; margin-top: 6px; font-size: 12px; color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="header">
    <h1>HMI Compliance Audit Report</h1>
    <div class="meta">Screen: <strong>${report.screenName}</strong> (${report.screenId}) | Generated: ${report.timestamp} | Display: ${report.displayConfig?.displayDiagonalInches || 12.3}" (${report.displayConfig?.viewingDistanceMM || 700}mm viewing distance)</div>
  </div>

  <div class="summary-grid">
    <div class="card">
      <h3>Static Automated Analysis</h3>
      <p style="color: #4ade80;">Pass: <strong>${report.staticSummary.pass}</strong></p>
      <p style="color: #f87171;">Fail: <strong>${report.staticSummary.fail}</strong></p>
      <p style="color: #fbbf24;">Warning: <strong>${report.staticSummary.warning}</strong></p>
    </div>
    <div class="card">
      <h3>Runtime Instrumentation</h3>
      <p style="color: #4ade80;">Pass: <strong>${report.runtimeSummary.pass}</strong></p>
      <p style="color: #f87171;">Fail: <strong>${report.runtimeSummary.fail}</strong></p>
      <p style="color: #94a3b8;">Not Measured: <strong>${report.runtimeSummary.notMeasured}</strong></p>
    </div>
    <div class="card">
      <h3>Manual Human-Factors Review</h3>
      <p style="color: #38bdf8;">Reviewed: <strong>${report.manualSummary.reviewed}</strong></p>
      <p style="color: #fbbf24;">Needs Review: <strong>${report.manualSummary.needsReview}</strong></p>
    </div>
  </div>

  <h2>Findings Detail</h2>
  <table>
    <thead>
      <tr>
        <th>Rule</th>
        <th>Tier</th>
        <th>Status</th>
        <th>Message</th>
        <th>Measured / Threshold</th>
      </tr>
    </thead>
    <tbody>
      ${report.findings.map((f) => {
        const rule = HMI_RULES.find((r) => r.id === f.ruleId);
        const tier = rule?.tier || 'static';
        let badgeClass = 'badge-info';
        if (f.status === 'pass') badgeClass = 'badge-pass';
        if (f.status === 'fail') badgeClass = 'badge-fail';
        if (f.status === 'warning') badgeClass = 'badge-warn';
        if (f.status === 'needs-review' || f.status === 'reviewed') badgeClass = 'badge-review';

        const manualNote = report.manualNotes[f.ruleId]?.note;

        return `
        <tr>
          <td><strong>${rule?.title || f.ruleId}</strong><br><small style="color: #64748b;">${f.ruleId}</small></td>
          <td><span style="font-family: monospace; font-size: 11px;">${tier.toUpperCase()}</span></td>
          <td><span class="badge ${badgeClass}">${f.status}</span></td>
          <td>
            ${f.message}
            ${manualNote ? `<div class="note-box"><strong>Auditor Note:</strong> ${manualNote}</div>` : ''}
          </td>
          <td style="font-family: monospace; font-size: 12px;">${f.measured || '-'} <span style="color: #64748b;">/ ${f.threshold || '-'}</span></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</body>
</html>`;
}
