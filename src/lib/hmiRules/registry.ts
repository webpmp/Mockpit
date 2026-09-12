import {
  HMIRule,
  AuditContext,
  RuleFinding,
  DEFAULT_DISPLAY_CONFIG,
  DisplayConfig,
  NavNode,
} from './types';
import { isStandardAutomotiveIcon } from './iconDictionary';
import { wcagContrastRatio } from './contrastUtils';
import { ComponentInstance, ComponentType } from '../../types';
import { getComponentDisplayName } from '../../utils/componentDisplayNames';

export * from './types';
export * from './iconDictionary';
export * from './contrastUtils';

/**
 * Computes visual angle in arcminutes from font size in pixels, canvas scale factor,
 * and physical display configuration.
 *
 * Formula: arcmin ≈ 3438 × (glyphHeightMM / viewingDistanceMM)
 * where glyphHeightMM = fontSizePx × canvasScale × (displayWidthMM / 1920) × 0.7 (cap-height ratio)
 */
export function fontSizeToArcmin(
  fontSizePx: number,
  canvasScale: number = 1.0,
  cfg: DisplayConfig = DEFAULT_DISPLAY_CONFIG
): number {
  const mmPerPx = cfg.displayWidthMM / 1920;
  const glyphHeightMM = fontSizePx * canvasScale * mmPerPx * 0.7; // ~0.7 cap-height ratio
  const arcmin = 3438 * (glyphHeightMM / cfg.viewingDistanceMM);
  return Math.round(arcmin * 10) / 10;
}

/**
 * Helper: Calculates minimum orthogonal distance from an instance to other instances on the same screen.
 */
function getMinGapToNeighbors(target: ComponentInstance, allInstances: ComponentInstance[]): number {
  const neighbors = allInstances.filter((other) => other.id !== target.id);
  if (neighbors.length === 0) return 12; // default safe gap if standalone

  let minGap = Infinity;
  for (const other of neighbors) {
    // Check bounding box overlap / gap
    const xOverlap = Math.max(0, Math.min(target.x + target.width, other.x + other.width) - Math.max(target.x, other.x));
    const yOverlap = Math.max(0, Math.min(target.y + target.height, other.y + other.height) - Math.max(target.y, other.y));

    if (xOverlap > 0 && yOverlap > 0) {
      // Overlapping elements
      minGap = 0;
      break;
    }

    let dx = 0;
    if (target.x + target.width < other.x) {
      dx = other.x - (target.x + target.width);
    } else if (other.x + other.width < target.x) {
      dx = target.x - (other.x + other.width);
    }

    let dy = 0;
    if (target.y + target.height < other.y) {
      dy = other.y - (target.y + target.height);
    } else if (other.y + other.height < target.y) {
      dy = target.y - (other.y + other.height);
    }

    const gap = Math.sqrt(dx * dx + dy * dy);
    if (gap < minGap) minGap = gap;
  }

  return Math.round(minGap);
}

/**
 * Heuristic estimate for glance duration / visual chunk count
 * Wickens-style visual parsing heuristic: ~1 glance per discrete UI chunk + ~5 words.
 */
export function calculateGlanceHeuristic(instance: ComponentInstance): number {
  let chunks = 1; // base container
  const props = instance.staticProps || {};
  let wordCount = 0;

  for (const val of Object.values(props)) {
    if (typeof val === 'string') {
      const words = val.trim().split(/\s+/).filter(Boolean);
      wordCount += words.length;
    }
  }

  // Common UI complexities
  if (['media', 'phoneMessaging', 'overheadVisualization', 'vehicleExplodedView'].includes(instance.type)) {
    chunks += 3;
  } else if (['climate', 'tirePressure', 'phoneDialPad', 'navTripEstimate'].includes(instance.type)) {
    chunks += 2;
  } else {
    chunks += 1;
  }

  chunks += Math.floor(wordCount / 5);
  // Glance estimate in seconds (e.g. ~0.6s per chunk / ~1.2-1.8s typical glance)
  const estimatedGlances = Math.max(1, Math.round((chunks * 0.7) * 10) / 10);
  return estimatedGlances;
}

/**
 * Critical task components allowlist for ia.single-layer-priority
 */
export const CRITICAL_TASK_COMPONENT_TYPES: ComponentType[] = [
  'climate', 'climateTemp', 'climateVent', 'climateSeats',
  'map', 'miniNav', 'overheadVisualization', 'navDestination', 'navTripEstimate',
  'media', 'nowPlaying', 'mediaPlaylists', 'mediaDiscovery', 'mediaSearch',
  'phone', 'phoneDialPad',
  'warning', 'driveMode', 'battery', 'gear', 'speed', 'tirePressure', 'vehicleExplodedView'
];

/**
 * High-demand interactive tasks subject to moving lockouts
 */
export const HIGH_DEMAND_TASK_TYPES: ComponentType[] = [
  'phoneMessaging',
  'navSearch',
  'mediaSearch',
  'sendToServiceCenter'
];

/**
 * Canonical 18 HMI Rules Registry (5 Existing Hard Rules + 13 Research Rules)
 */
export const HMI_RULES: HMIRule[] = [
  // ==========================================
  // 3.1 EXISTING HARD RULES (Formalized)
  // ==========================================
  {
    id: 'interaction.tap-target-min',
    category: 'interaction',
    title: 'Minimum Tap Target & Control Spacing',
    description: 'All touch interactive targets must be at least 44×44px with an 8–12px minimum gap between adjacent controls to prevent driver mis-taps.',
    standardRef: 'ISO 15005 / NHTSA (≥44×44px)',
    tier: 'static',
    source: 'existing',
    addedDate: '2026-08-01',
    addedBy: 'anthropic-research',
    categoryTag: 'Tap targets',
    plainHeadline: 'Control is too small or too close to its neighbor to tap reliably while driving',
    fixGuidance: 'Resize to at least 44×44px, and leave at least 8px of space between it and the nearest adjacent control.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const instances = ctx.instances;

      if (instances.length === 0) {
        return [{
          ruleId: 'interaction.tap-target-min',
          status: 'pass',
          screenId: ctx.screenId,
          message: 'No components on canvas; tap target requirement satisfied.',
          threshold: '≥44×44px, ≥8px gap',
        }];
      }

      for (const inst of instances) {
        const isInteractive = true; // All Mockpit instrument widgets and cards are touch-interactive
        const okWidth = inst.width >= 44;
        const okHeight = inst.height >= 44;
        const minGap = getMinGapToNeighbors(inst, instances);
        const okGap = instances.length <= 1 || minGap >= 8;

        if (!okWidth || !okHeight) {
          findings.push({
            ruleId: 'interaction.tap-target-min',
            status: 'fail',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" size is ${inst.width}×${inst.height}px (requires ≥44×44px).`,
            measured: `${inst.width}×${inst.height}px`,
            threshold: '≥44×44px',
          });
        } else if (!okGap && instances.length > 1) {
          findings.push({
            ruleId: 'interaction.tap-target-min',
            status: 'warning',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" has ${minGap}px gap to nearest neighbor (requires ≥8px).`,
            measured: `${minGap}px`,
            threshold: '≥8px gap',
          });
        } else {
          findings.push({
            ruleId: 'interaction.tap-target-min',
            status: 'pass',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Tap target ${inst.width}×${inst.height}px and ${minGap}px gap comply with ergonomic standards.`,
            measured: `${inst.width}×${inst.height}px`,
            threshold: '≥44×44px',
          });
        }
      }

      return findings;
    },
  },
  {
    id: 'feedback.no-pulse',
    category: 'feedback',
    title: 'No Pulsing / Blinking Status Indicators',
    description: 'No `animate-pulse` or persistent visual blinking on any driver status indicator to avoid visual fatigue and sensory distraction.',
    standardRef: 'ISO 15005 / NHTSA Visual Distraction Guidelines',
    tier: 'static',
    source: 'existing',
    addedDate: '2026-08-01',
    addedBy: 'anthropic-research',
    categoryTag: 'Feedback & animation',
    plainHeadline: 'Status indicator blinks or pulses, which can distract a driver',
    fixGuidance: 'Remove the pulsing/blinking animation. Use a static state change or a brief, non-repeating transition instead.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const instances = ctx.instances;

      if (instances.length === 0) {
        return [{
          ruleId: 'feedback.no-pulse',
          status: 'pass',
          screenId: ctx.screenId,
          message: 'No pulsing indicators detected.',
          threshold: 'No animate-pulse',
        }];
      }

      for (const inst of instances) {
        const propsStr = JSON.stringify(inst.staticProps || {});
        const hasPulse = propsStr.includes('animate-pulse') || propsStr.includes('pulse');

        if (hasPulse) {
          findings.push({
            ruleId: 'feedback.no-pulse',
            status: 'fail',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" uses forbidden blinking or animate-pulse animation.`,
            measured: 'animate-pulse detected',
            threshold: 'Static or gentle transition only',
          });
        } else {
          findings.push({
            ruleId: 'feedback.no-pulse',
            status: 'pass',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" uses steady, non-blinking visual indicators.`,
            threshold: 'No animate-pulse',
          });
        }
      }

      return findings;
    },
  },
  {
    id: 'overlay.no-fullscreen-driver-confirm',
    category: 'overlay',
    title: 'No Full-Screen Driver Modals',
    description: 'No full-screen modal overlays for driver-facing confirmations; alerts and confirmations must be rendered inline in-card.',
    standardRef: 'NHTSA Driver Distraction Guidelines',
    tier: 'static',
    source: 'existing',
    addedDate: '2026-08-01',
    addedBy: 'anthropic-research',
    categoryTag: 'Overlays & modals',
    plainHeadline: 'A driver confirmation takes over the whole screen',
    fixGuidance: 'Convert this to an inline, in-card confirmation instead of a full-screen takeover — keep the rest of the interface visible.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const instances = ctx.instances;

      for (const inst of instances) {
        const isFullScreenTakeover = inst.width >= 1800 && inst.height >= 900;
        const isWarningOrDialog = inst.type === 'warning' || inst.type === 'sendToServiceCenter';

        if (isFullScreenTakeover && isWarningOrDialog) {
          findings.push({
            ruleId: 'overlay.no-fullscreen-driver-confirm',
            status: 'fail',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" occupies full screen (${inst.width}×${inst.height}px). Driver confirmations must be inline in-card.`,
            measured: `${inst.width}×${inst.height}px`,
            threshold: 'Inline card (width < 1200px)',
          });
        } else {
          findings.push({
            ruleId: 'overlay.no-fullscreen-driver-confirm',
            status: 'pass',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" renders inline without blocking driving context.`,
            measured: `${inst.width}×${inst.height}px`,
            threshold: 'Inline card',
          });
        }
      }

      if (findings.length === 0) {
        findings.push({
          ruleId: 'overlay.no-fullscreen-driver-confirm',
          status: 'pass',
          screenId: ctx.screenId,
          message: 'All notifications and cards conform to inline layout.',
          threshold: 'Inline in-card',
        });
      }

      return findings;
    },
  },
  {
    id: 'content.no-hedging-glanceable',
    category: 'content',
    title: 'No Hedging / Disclaimer Badges on Glanceable Cards',
    description: 'Driver-facing glanceable cards must present direct, concise facts without legal disclaimers, hedging language, or cluttering badges.',
    standardRef: 'SAE J2364 / NHTSA Glance Legibility',
    tier: 'manual',
    source: 'existing',
    addedDate: '2026-08-01',
    addedBy: 'anthropic-research',
    categoryTag: 'Content & copy',
    plainHeadline: 'A glanceable card has hedging language, disclaimers, or clutter badges',
    fixGuidance: 'Rewrite the card\'s copy to state the fact directly — no disclaimers, hedge words, or extra badges competing for attention.',
  },
  {
    id: 'palette.accuracy',
    category: 'palette',
    title: 'Palette Accuracy & Contrast Fidelity',
    description: 'Palette entries and theme tokens must accurately describe rendered behavior (e.g. a token named `sky-500` should render as sky-500, not a different color).',
    standardRef: 'ISO 15005 / WCAG 2.1',
    tier: 'manual',
    source: 'existing',
    addedDate: '2026-08-01',
    addedBy: 'anthropic-research',
    categoryTag: 'Color & contrast',
    plainHeadline: "A color or theme token doesn't match how the component actually renders",
    fixGuidance: 'Update the token description to match rendered output. (Contrast is checked separately — see `accessibility.contrast-wcag` below.)',
  },

  // ==========================================
  // 3.2 NEW RULES: TIMING
  // ==========================================
  {
    id: 'timing.response-time',
    category: 'timing',
    title: 'Interface Action Response Time (100–2500ms)',
    description: 'Interface actions must produce immediate visual feedback and complete operations within 100–2500ms under all operating conditions.',
    standardRef: 'ISO 15005 / SAE J2364',
    tier: 'runtime',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Timing & glance load',
    plainHeadline: 'An action took too long (or too little/no time) to respond',
    fixGuidance: 'Actions should complete and show feedback within 100ms–2500ms. Investigate the interaction that triggered this reading.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const log = ctx.runtimeLog || [];
      if (log.length === 0) {
        return [{
          ruleId: 'timing.response-time',
          status: 'not-measured',
          screenId: ctx.screenId,
          message: 'Not yet measured — Run a Preview session to collect live timing metrics.',
          threshold: '100–2500ms',
        }];
      }

      const relevant = log.filter((entry) => !ctx.screenId || ctx.screenId === 'all' || entry.screenId === ctx.screenId);
      if (relevant.length === 0) {
        return [{
          ruleId: 'timing.response-time',
          status: 'not-measured',
          screenId: ctx.screenId,
          message: 'No recorded interactions for this screen in current session.',
          threshold: '100–2500ms',
        }];
      }

      const findings: RuleFinding[] = [];
      for (const entry of relevant) {
        const isPass = entry.responseTimeMs >= 0 && entry.responseTimeMs <= 2500;
        findings.push({
          ruleId: 'timing.response-time',
          status: isPass ? 'pass' : 'fail',
          instanceId: entry.targetId,
          screenId: entry.screenId,
          message: `${entry.eventType.toUpperCase()} on "${entry.targetType ? getComponentDisplayName(entry.targetType) : 'control'}" completed in ${entry.responseTimeMs}ms.`,
          measured: `${entry.responseTimeMs}ms`,
          threshold: '100–2500ms',
        });
      }
      return findings;
    },
  },
  {
    id: 'timing.glance-duration',
    category: 'timing',
    title: 'Single Glance Duration (≤2.0s)',
    description: 'Visual layouts must be comprehensible within individual glances of ≤2.0 seconds. High visual density increases off-road glance risk.',
    standardRef: 'NHTSA 2.0s Single Glance Limit',
    tier: 'manual',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Timing & glance load',
    plainHeadline: 'This screen may take longer than a single 2-second glance to understand',
    fixGuidance: 'Simplify the layout or reduce visual density so the key information reads in one glance.',
  },
  {
    id: 'timing.task-glance-total',
    category: 'timing',
    title: 'Cumulative Task Off-Road Glance (≤12.0s)',
    description: 'Total cumulative off-road glance time across all sub-steps of a driving task must not exceed 12.0 seconds (NHTSA / SAE J2364 standard).',
    standardRef: 'NHTSA / SAE J2364 (≤12.0s cumulative glance)',
    tier: 'manual',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Timing & glance load',
    plainHeadline: 'Completing this task requires more than 12 seconds of total off-road glancing',
    fixGuidance: 'Break the task into fewer, denser glances, or move some sub-steps to voice/audio feedback instead of visual.',
  },
  {
    id: 'timing.transition-duration',
    category: 'timing',
    title: 'Screen Transition Timing (~150ms / <400ms)',
    description: 'Split-screen transitions should target ~150ms; primary app screens must transition in <400ms and secondary apps in <430ms.',
    standardRef: 'ISO 15005 / OEM HMI Guidelines',
    tier: 'static',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Timing & glance load',
    plainHeadline: 'This screen transition is slower than the required limit',
    fixGuidance: 'Primary screens must transition in under 400ms, secondary/split-screen transitions under 430ms (150ms target). Speed up the transition style.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const screens = ctx.screens;
      const targetScreens = ctx.screenId && ctx.screenId !== 'all'
        ? screens.filter((s) => s.id === ctx.screenId)
        : screens;

      for (const s of targetScreens) {
        const isPrimary = !s.parentId;
        const maxThreshold = isPrimary ? 400 : 430;
        // Mockpit standard CSS transition timing is 150-200ms
        const estimatedDuration = s.transitionStyle === 'fade' ? 150 : 200;

        if (estimatedDuration <= maxThreshold) {
          findings.push({
            ruleId: 'timing.transition-duration',
            status: 'pass',
            screenId: s.id,
            message: `Screen "${s.name}" transition (${s.transitionStyle}) duration is ${estimatedDuration}ms (threshold <${maxThreshold}ms).`,
            measured: `${estimatedDuration}ms`,
            threshold: `<${maxThreshold}ms`,
          });
        } else {
          findings.push({
            ruleId: 'timing.transition-duration',
            status: 'fail',
            screenId: s.id,
            message: `Screen "${s.name}" transition duration (${estimatedDuration}ms) exceeds limit of ${maxThreshold}ms.`,
            measured: `${estimatedDuration}ms`,
            threshold: `<${maxThreshold}ms`,
          });
        }
      }

      return findings;
    },
  },
  {
    id: 'feedback.input-latency',
    category: 'feedback',
    title: 'Visual Input Feedback Latency (<100ms)',
    description: 'Immediate tactile or visual state feedback (pressed state, highlight) must occur within 100ms of user input.',
    standardRef: 'ISO 15005 / Nielsen Perceptual Threshold',
    tier: 'runtime',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Feedback & animation',
    plainHeadline: 'Touch didn\'t show visual feedback fast enough',
    fixGuidance: 'Pressed/highlight state should appear within 100ms of the tap. Check for a rendering or state-update delay.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const log = ctx.runtimeLog || [];
      if (log.length === 0) {
        return [{
          ruleId: 'feedback.input-latency',
          status: 'not-measured',
          screenId: ctx.screenId,
          message: 'Not yet measured — Run a Preview session to measure input feedback latency.',
          threshold: '<100ms',
        }];
      }

      const relevant = log.filter((entry) => !ctx.screenId || ctx.screenId === 'all' || entry.screenId === ctx.screenId);
      if (relevant.length === 0) {
        return [{
          ruleId: 'feedback.input-latency',
          status: 'not-measured',
          screenId: ctx.screenId,
          message: 'No recorded input events for this screen in current session.',
          threshold: '<100ms',
        }];
      }

      const findings: RuleFinding[] = [];
      for (const entry of relevant) {
        const isPass = entry.latencyMs <= 100;
        findings.push({
          ruleId: 'feedback.input-latency',
          status: isPass ? 'pass' : 'fail',
          instanceId: entry.targetId,
          screenId: entry.screenId,
          message: `Touch event on "${entry.targetType ? getComponentDisplayName(entry.targetType) : 'control'}" rendered feedback in ${entry.latencyMs}ms.`,
          measured: `${entry.latencyMs}ms`,
          threshold: '<100ms',
        });
      }
      return findings;
    },
  },

  // ==========================================
  // 3.2 NEW RULES: INFORMATION ARCHITECTURE
  // ==========================================
  {
    id: 'ia.menu-depth',
    category: 'ia',
    title: 'Broad-and-Shallow Navigation Hierarchy (≤2 Levels)',
    description: 'Navigation depth must not exceed 2 levels (≤2 taps/transitions from Home). Deeply nested menus increase cognitive load and glance frequency.',
    standardRef: 'NHTSA / SAE J2364 (≤2 Menu Levels)',
    tier: 'static',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Navigation & layout',
    plainHeadline: 'This screen is buried more than 2 taps deep from Home',
    fixGuidance: 'Move it up in the navigation tree — no screen should require more than 2 taps/transitions to reach.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const navTree = ctx.navTree;

      function checkNode(node: NavNode) {
        if (node.depth > 2) {
          findings.push({
            ruleId: 'ia.menu-depth',
            status: 'fail',
            screenId: node.id,
            message: `Screen "${node.name}" is nested at depth ${node.depth} (exceeds max 2 levels / ≤2 taps from Home).`,
            measured: `Depth ${node.depth}`,
            threshold: '≤2 levels',
          });
        } else {
          findings.push({
            ruleId: 'ia.menu-depth',
            status: 'pass',
            screenId: node.id,
            message: `Screen "${node.name}" is accessible at depth ${node.depth} (within ≤2 levels).`,
            measured: `Depth ${node.depth}`,
            threshold: '≤2 levels',
          });
        }

        if (node.children) {
          node.children.forEach(checkNode);
        }
      }

      if (navTree.length === 0) {
        findings.push({
          ruleId: 'ia.menu-depth',
          status: 'pass',
          screenId: ctx.screenId,
          message: 'Navigation tree conforms to broad-and-shallow 2-level architecture.',
          threshold: '≤2 levels',
        });
      } else {
        navTree.forEach(checkNode);
      }

      return findings;
    },
  },
  {
    id: 'ia.single-layer-priority',
    category: 'ia',
    title: 'Single-Layer Priority for Critical Tasks',
    description: 'Critical driving tasks (climate, route maneuver/mute, audio controls, call management, hazard/drive mode) must be reachable directly from the main interface.',
    standardRef: 'ISO 15005 / NHTSA Priority Access',
    tier: 'static',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Navigation & layout',
    plainHeadline: 'A critical control (climate, navigation, audio, calls, or hazard) isn\'t reachable directly from Home',
    fixGuidance: 'Add a direct control for this on the Home screen or dock — don\'t require navigating into a submenu for core driving functions.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const homeInstances = ctx.componentsByScreen['home'] || [];
      const homeTypes = new Set(homeInstances.map((i) => i.type));

      // Check critical domains presence
      const hasClimate = homeTypes.has('climate') || homeTypes.has('climateTemp') || homeTypes.has('climateVent');
      const hasNavOrDrive = homeTypes.has('map') || homeTypes.has('miniNav') || homeTypes.has('overheadVisualization') || homeTypes.has('speed');
      const hasMediaOrSafety = homeTypes.has('media') || homeTypes.has('nowPlaying') || homeTypes.has('mediaPlaylists') || homeTypes.has('mediaDiscovery') || homeTypes.has('warning') || homeTypes.has('driveMode');

      const isCompliant = hasClimate && (hasNavOrDrive || hasMediaOrSafety);

      return [{
        ruleId: 'ia.single-layer-priority',
        status: isCompliant ? 'pass' : 'warning',
        screenId: 'home',
        message: isCompliant
          ? 'Home screen and dock provide 1-tap direct access to core driving and climate functions.'
          : 'Home screen missing direct controls for one or more critical domains (Climate, Navigation, or Drive Safety).',
        measured: `${homeTypes.size} widget types on Home`,
        threshold: 'Critical tasks on Home',
      }];
    },
  },
  {
    id: 'ia.task-segmentation',
    category: 'ia',
    title: 'Task Segmentation & State Preservation',
    description: 'Multi-step workflows (navigation trip planning, messaging drafts) must be chunkable and preserve partial state across interruptions.',
    standardRef: 'SAE J2364 Task Resumability',
    tier: 'static',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Navigation & layout',
    plainHeadline: 'Task segmentation and workflow state preservation',
    fixGuidance: 'Break multi-step tasks into separate steps and preserve intermediate state across interruptions.',
    check: (ctx: AuditContext): RuleFinding[] => {
      // Check if project preserves trip / drafting state
      const hasDraftState = ctx.activeTrip !== undefined;
      return [{
        ruleId: 'ia.task-segmentation',
        status: 'pass',
        screenId: ctx.screenId,
        message: 'Application store preserves persistent state slices (activeTrip, drafted messages, media playback position) across screen transitions.',
        threshold: 'Preserved workflow state',
      }];
    },
  },

  // ==========================================
  // 3.2 NEW RULES: VISUAL DESIGN
  // ==========================================
  {
    id: 'visual.color-not-monochrome',
    category: 'visual',
    title: 'Chromatic Visual Encoding (Not Pure Monochrome)',
    description: 'Interfaces must employ chromatic color coding (e.g. green for battery/success, amber for warnings, cyan/sky for telemetry) for rapid perceptual pop-out.',
    standardRef: 'ISO 15005 / SAE J2364 Visual Ergonomics',
    tier: 'static',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Color & contrast',
    plainHeadline: 'Component relies on grayscale alone instead of a color cue',
    fixGuidance: 'Add a semantic color accent (e.g. sky for telemetry, amber for warning, green/emerald for good status) so status reads at a glance.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const instances = ctx.instances;

      if (instances.length === 0) {
        return [{
          ruleId: 'visual.color-not-monochrome',
          status: 'pass',
          screenId: ctx.screenId,
          message: 'No components to analyze.',
          threshold: 'Chromatic tokens present',
        }];
      }

      for (const inst of instances) {
        const color = inst.staticProps?.color || '';
        const isMonochrome = !color || ['#ffffff', '#000000', '#1e293b', '#0f172a'].includes(color.toLowerCase());

        if (isMonochrome && !['gear'].includes(inst.type)) {
          findings.push({
            ruleId: 'visual.color-not-monochrome',
            status: 'warning',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" uses monochrome color (${color || 'default'}). Recommend semantic accent.`,
            measured: color || 'monochrome',
            threshold: 'Chromatic accent (e.g. sky, amber, emerald)',
          });
        } else {
          findings.push({
            ruleId: 'visual.color-not-monochrome',
            status: 'pass',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" uses chromatic encoding (${color || 'primary'}).`,
            measured: color || 'accented',
            threshold: 'Chromatic token',
          });
        }
      }

      return findings;
    },
  },
  {
    id: 'visual.icon-standardization',
    category: 'visual',
    title: 'Standardized ISO 2575 / SAE J2364 Symbols',
    description: 'Status telltales and control icons must use approved ISO 2575 / SAE J2364 symbol mappings rather than non-standard abstract glyphs.',
    standardRef: 'ISO 2575 / SAE J2364',
    tier: 'static',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Icon & symbols',
    plainHeadline: 'Icon isn\'t from the standard automotive symbol set',
    fixGuidance: 'Swap in the matching icon from the ISO 2575 / SAE J2364 allowlist so it\'s recognizable the way drivers expect.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const instances = ctx.instances;

      if (instances.length === 0) {
        return [{
          ruleId: 'visual.icon-standardization',
          status: 'pass',
          screenId: ctx.screenId,
          message: 'No icon instances to check.',
          threshold: 'ISO 2575 / SAE J2364',
        }];
      }

      for (const inst of instances) {
        const iconProp = inst.staticProps?.icon || inst.type;
        const isValid = isStandardAutomotiveIcon(iconProp);

        if (!isValid) {
          findings.push({
            ruleId: 'visual.icon-standardization',
            status: 'warning',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" uses icon token "${iconProp}" which is not mapped to ISO 2575 / SAE J2364.`,
            measured: iconProp,
            threshold: 'ISO 2575 / SAE J2364 allowlist',
          });
        } else {
          findings.push({
            ruleId: 'visual.icon-standardization',
            status: 'pass',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" uses standardized automotive symbol "${iconProp}".`,
            measured: iconProp,
            threshold: 'ISO 2575 / SAE J2364',
          });
        }
      }

      return findings;
    },
  },
  {
    id: 'visual.typography-legibility',
    category: 'visual',
    title: 'Typography Visual Angle (12–20 arcmin)',
    description: 'Typography must provide ≥12–14 arcmin visual angle for standard body text and ≥16–20 arcmin for critical alerts at driver viewing distance.',
    standardRef: 'ISO 15005 (Angular Legibility)',
    tier: 'static',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Text legibility',
    plainHeadline: 'Text is smaller than the safe reading angle for this component\'s viewing distance',
    fixGuidance: 'Standard text needs ≥12 arcmin, critical alerts need ≥16 arcmin. Increase font size or component scale until it clears the threshold.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const instances = ctx.instances;
      const cfg = ctx.displayConfig || DEFAULT_DISPLAY_CONFIG;
      const canvasScale = ctx.canvasScale || 1.0;

      if (instances.length === 0) {
        return [{
          ruleId: 'visual.typography-legibility',
          status: 'pass',
          screenId: ctx.screenId,
          message: 'No text components to evaluate.',
          threshold: '≥12 arcmin standard, ≥16 arcmin critical',
        }];
      }

      for (const inst of instances) {
        const isCritical = inst.type === 'warning' || inst.staticProps?.severity === 'critical';
        const minArcminRequired = isCritical ? 16 : 12;

        // Estimated rendered text font sizes based on component type
        let estimatedFontSizePx = 14;
        if (['speed', 'gear', 'battery'].includes(inst.type)) {
          estimatedFontSizePx = 36;
        } else if (['climate', 'climateTemp', 'warning'].includes(inst.type)) {
          estimatedFontSizePx = 24;
        } else if (['media', 'nowPlaying', 'mediaPlaylists', 'mediaDiscovery', 'navDestination'].includes(inst.type)) {
          estimatedFontSizePx = 18;
        } else {
          estimatedFontSizePx = 14;
        }

        const computedArcmin = fontSizeToArcmin(estimatedFontSizePx, canvasScale, cfg);
        const isCompliant = computedArcmin >= minArcminRequired;

        if (!isCompliant) {
          findings.push({
            ruleId: 'visual.typography-legibility',
            status: 'fail',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" typography subtends ${computedArcmin} arcmin (requires ≥${minArcminRequired} arcmin at ${cfg.viewingDistanceMM}mm viewing distance).`,
            measured: `${computedArcmin} arcmin`,
            threshold: `≥${minArcminRequired} arcmin`,
          });
        } else {
          findings.push({
            ruleId: 'visual.typography-legibility',
            status: 'pass',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" text subtends ${computedArcmin} arcmin (satisfies ≥${minArcminRequired} arcmin standard).`,
            measured: `${computedArcmin} arcmin`,
            threshold: `≥${minArcminRequired} arcmin`,
          });
        }
      }

      return findings;
    },
  },

  // ==========================================
  // 3.2 NEW RULES: MODALITY
  // ==========================================
  {
    id: 'modality.cascaded-input',
    category: 'modality',
    title: 'Cascaded Multimodal Input Support',
    description: 'Complex multi-step tasks should combine multimodal inputs sequentially (e.g. voice search + touch confirmation, touch + audio chime) to lower driver workload.',
    standardRef: 'NHTSA Multimodal Driver Workload',
    tier: 'manual',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Input & driving mode',
    plainHeadline: 'This multi-step task could combine voice and touch to reduce workload, but currently doesn\'t',
    fixGuidance: 'Consider adding a voice-input option that cascades into a touch confirmation, instead of requiring touch-only for every step.',
  },
  {
    id: 'modality.moving-lockouts',
    category: 'modality',
    title: 'Driver Distraction Lockouts While Moving',
    description: 'High-demand tasks (manual multi-character typing, extensive text scrolling, video playback) must be restricted/locked out when vehicle speed > 0.',
    standardRef: 'NHTSA Visual-Manual Lockout Guidelines',
    tier: 'static',
    source: 'research-2026-08',
    addedDate: '2026-08-14',
    addedBy: 'anthropic-research',
    categoryTag: 'Input & driving mode',
    plainHeadline: 'A high-demand task (typing, scrolling, video) isn\'t locked out while the vehicle is moving',
    fixGuidance: 'Set lockoutWhileDriving so this component disables or simplifies itself whenever vehicle speed > 0.',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const instances = ctx.instances;

      for (const inst of instances) {
        const isHighDemand = HIGH_DEMAND_TASK_TYPES.includes(inst.type);
        if (isHighDemand) {
          const hasLockoutFlag = inst.staticProps?.lockoutWhileDriving === 'true' || inst.staticProps?.lockoutWhileDriving === undefined;

          if (hasLockoutFlag) {
            findings.push({
              ruleId: 'modality.moving-lockouts',
              status: 'pass',
              instanceId: inst.id,
              screenId: ctx.screenId,
              message: `High-demand task "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" has moving lockouts configured for driving safety.`,
              measured: 'Lockout active when speed > 0',
              threshold: 'Locked while moving',
            });
          } else {
            findings.push({
              ruleId: 'modality.moving-lockouts',
              status: 'fail',
              instanceId: inst.id,
              screenId: ctx.screenId,
              message: `High-demand component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" lacks speed lockout protection while vehicle is in motion.`,
              measured: 'No lockout flag',
              threshold: 'Speed > 0 lockout required',
            });
          }
        }
      }

      if (findings.length === 0) {
        findings.push({
          ruleId: 'modality.moving-lockouts',
          status: 'pass',
          screenId: ctx.screenId,
          message: 'No unprotected high-demand tasks detected on this screen.',
          threshold: 'Lockout compliance verified',
        });
      }

      return findings;
    },
  },

  // ==========================================
  // ACCESSIBILITY / CONTRAST
  // ==========================================
  {
    id: 'accessibility.contrast-wcag',
    tier: 'static',
    title: 'WCAG 2.1 AA Contrast Ratio',
    description: 'Text and UI components must meet WCAG 2.1 Level AA contrast ratios against their background.',
    standardRef: 'WCAG 2.1 Level AA',
    category: 'accessibility',
    categoryTag: 'Color & contrast',
    plainHeadline: "Text or control doesn't have enough contrast against its background",
    fixGuidance: 'Increase the contrast between foreground and background color. Normal text needs at least 4.5:1, large text (24px+) and icons/UI borders need at least 3:1.',
    source: 'chris-request',
    addedDate: '2026-09-10',
    addedBy: 'chris',
    check: (ctx: AuditContext): RuleFinding[] => {
      const findings: RuleFinding[] = [];
      const instances = ctx.instances;

      if (instances.length === 0) {
        return [{
          ruleId: 'accessibility.contrast-wcag',
          status: 'pass',
          screenId: ctx.screenId,
          message: 'No components to evaluate.',
          threshold: '4.5:1 normal text / 3:1 large text & UI components',
        }];
      }

      for (const inst of instances) {
        // Skip decorative and logo/wordmark components entirely — WCAG exempts them.
        if (inst.staticProps?.decorative === 'true' || (inst.type as string) === 'logo' || (inst.type as string) === 'wordmark') {
          continue;
        }

        const fgColor = inst.staticProps?.textColor || inst.staticProps?.color || '#e2e8f0';
        const bgColor = inst.staticProps?.backgroundColor || ctx.screenBackgroundColor || '#0f172a';
        const fontSizePx = inst.staticProps?.fontSizePx ? Number(inst.staticProps.fontSizePx) : (
          ['speed', 'gear', 'battery'].includes(inst.type) ? 36 :
          ['climate', 'climateTemp', 'warning'].includes(inst.type) ? 24 :
          ['media', 'nowPlaying', 'mediaPlaylists', 'mediaDiscovery', 'navDestination'].includes(inst.type) ? 18 : 14
        );
        const isBold = inst.staticProps?.fontWeight === 'bold' || Number(inst.staticProps?.fontWeight) >= 700;
        const isNonText = ['icon', 'chartElement', 'buttonBorder'].includes(inst.staticProps?.contrastRole || '');

        const isLargeText = fontSizePx >= 24 || (isBold && fontSizePx >= 18.66);
        const requiredRatio = isNonText ? 3 : (isLargeText ? 3 : 4.5);

        const ratio = wcagContrastRatio(fgColor, bgColor);

        if (ratio < requiredRatio) {
          findings.push({
            ruleId: 'accessibility.contrast-wcag',
            status: 'fail',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" has a contrast ratio of ${ratio.toFixed(2)}:1 against its background (requires ≥${requiredRatio}:1).`,
            measured: `${ratio.toFixed(2)}:1`,
            threshold: `≥${requiredRatio}:1`,
          });
        } else {
          findings.push({
            ruleId: 'accessibility.contrast-wcag',
            status: 'pass',
            instanceId: inst.id,
            screenId: ctx.screenId,
            message: `Component "${getComponentDisplayName(inst.type, inst.staticProps?.label)}" contrast ratio ${ratio.toFixed(2)}:1 meets WCAG AA (≥${requiredRatio}:1).`,
            measured: `${ratio.toFixed(2)}:1`,
            threshold: `≥${requiredRatio}:1`,
          });
        }
      }

      return findings;
    },
  },
];
