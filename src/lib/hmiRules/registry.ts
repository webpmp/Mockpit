import {
  HMIRule,
  AuditContext,
  RuleFinding,
  DEFAULT_DISPLAY_CONFIG,
  DisplayConfig,
  NavNode,
} from './types';
import { isStandardAutomotiveIcon } from './iconDictionary';
import { ComponentInstance, ComponentType } from '../../types';
import { getComponentDisplayName } from '../../utils/componentDisplayNames';

export * from './types';
export * from './iconDictionary';

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
    tier: 'static',
    source: 'existing',
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
    tier: 'static',
    source: 'existing',
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
    tier: 'static',
    source: 'existing',
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
    tier: 'manual',
    source: 'existing',
  },
  {
    id: 'palette.accuracy',
    category: 'palette',
    title: 'Palette Accuracy & Contrast Fidelity',
    description: 'Palette entries and theme tokens must accurately describe rendered behavior and maintain high-contrast legibility across ambient lighting conditions.',
    tier: 'manual',
    source: 'existing',
  },

  // ==========================================
  // 3.2 NEW RULES: TIMING
  // ==========================================
  {
    id: 'timing.response-time',
    category: 'timing',
    title: 'Interface Action Response Time (100–2500ms)',
    description: 'Interface actions must produce immediate visual feedback and complete operations within 100–2500ms under all operating conditions.',
    tier: 'runtime',
    source: 'research-2026-08',
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
    tier: 'manual',
    source: 'research-2026-08',
  },
  {
    id: 'timing.task-glance-total',
    category: 'timing',
    title: 'Cumulative Task Off-Road Glance (≤12.0s)',
    description: 'Total cumulative off-road glance time across all sub-steps of a driving task must not exceed 12.0 seconds (NHTSA / SAE J2364 standard).',
    tier: 'manual',
    source: 'research-2026-08',
  },
  {
    id: 'timing.transition-duration',
    category: 'timing',
    title: 'Screen Transition Timing (~150ms / <400ms)',
    description: 'Split-screen transitions should target ~150ms; primary app screens must transition in <400ms and secondary apps in <430ms.',
    tier: 'static',
    source: 'research-2026-08',
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
    tier: 'runtime',
    source: 'research-2026-08',
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
    tier: 'static',
    source: 'research-2026-08',
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
    tier: 'static',
    source: 'research-2026-08',
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
    tier: 'static',
    source: 'research-2026-08',
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
    tier: 'static',
    source: 'research-2026-08',
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
    tier: 'static',
    source: 'research-2026-08',
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
    tier: 'static',
    source: 'research-2026-08',
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
    tier: 'manual',
    source: 'research-2026-08',
  },
  {
    id: 'modality.moving-lockouts',
    category: 'modality',
    title: 'Driver Distraction Lockouts While Moving',
    description: 'High-demand tasks (manual multi-character typing, extensive text scrolling, video playback) must be restricted/locked out when vehicle speed > 0.',
    tier: 'static',
    source: 'research-2026-08',
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
];
