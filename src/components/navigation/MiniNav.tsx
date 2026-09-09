import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ManeuverType } from '../../types';
import { ManeuverGlyph } from './ManeuverGlyph';

export interface MiniNavColors {
  groundColor?: string;
  skyColor?: string;
  horizonGlowColor?: string;
  horizonGlowIntensity?: number;
  horizonGlowSpread?: number;
  horizonGlowBalance?: number;
  horizonBoundaryColor?: string;
  horizonBoundaryOpacity?: number;
  roadColor?: string;
  arrowColor?: string;
  guideLaneColor?: string;
  highwayBadgeColor?: string;
  highwayBadgeTextColor?: string;
  streetTitleColor?: string;
  instructionTextColor?: string;
  distanceTextColor?: string;
  // Deprecated legacy field for backward compatibility
  horizonColor?: string;
  backgroundColor?: string;
}

export const DEFAULT_MINI_NAV_COLORS = {
  groundColor: '#020617', // slate-950
  skyColor: '#020617',    // slate-950
  horizonGlowColor: '#ffffff', // default white horizon glow
  horizonGlowIntensity: 30, // 0 - 100 (%)
  horizonGlowSpread: 100, // 0 - 100 (%)
  horizonGlowBalance: 0, // -100 to +100
  horizonBoundaryColor: '#334155', // slate-700 boundary line
  horizonBoundaryOpacity: 50, // 0 - 100 (%)
  roadColor: '#1e293b',   // slate-800
  arrowColor: '#38bdf8',  // primary maneuver arrow color
  guideLaneColor: '#38bdf8', // guide lane ribbon color
  highwayBadgeColor: '#38bdf8', // badge background/border tint
  highwayBadgeTextColor: '#38bdf8', // badge text color
  streetTitleColor: '#e2e8f0', // slate-200
  instructionTextColor: '#94a3b8', // slate-400
  distanceTextColor: '#f8fafc', // slate-100
};

export const DEFAULT_MINI_NAV_APPEARANCE = DEFAULT_MINI_NAV_COLORS;

interface MiniNavProps {
  highwayName?: string;
  nextExit?: string;
  distanceToManeuver?: string;
  maneuverType?: ManeuverType;
  laneCount?: number | string;
  showManeuverDirection?: boolean;
  showGuideLane?: boolean;
  arrowColor?: string;
  horizonColor?: string;
  guideLaneColor?: string;
  highwayBadgeColor?: string;
  // Comprehensive color overrides
  groundColor?: string;
  skyColor?: string;
  horizonGlowColor?: string;
  horizonGlowIntensity?: number | string;
  horizonGlowSpread?: number | string;
  horizonGlowBalance?: number | string;
  horizonBoundaryColor?: string;
  horizonBoundaryOpacity?: number | string;
  roadColor?: string;
  highwayBadgeTextColor?: string;
  streetTitleColor?: string;
  instructionTextColor?: string;
  distanceTextColor?: string;
  // Deprecated backward compatibility
  backgroundColor?: string;
  width?: number;
  height?: number;
}

/**
 * Mini Nav Component
 * A compact, portrait-oriented SVG component that dynamically measures
 * its container and renders a stylized first-person road perspective with
 * a prominent directional maneuver arrow.
 *
 * Design Constraints:
 * - Read-only, glanceable (no tap targets or button links).
 * - No UI chrome (speed limit badges, ETA bars, mute icons, hazard rails).
 * - No animations with pulsing or blinking (strictly prohibited for driver safety).
 * - Consumes shared journey state (with fallback to staticProps).
 * - Styled with active palette CSS variables and Tailwind color tokens.
 */
export const MiniNav: React.FC<MiniNavProps> = ({
  highwayName: propHighwayName,
  nextExit: propNextExit,
  distanceToManeuver: propDistance,
  maneuverType: propManeuverType,
  laneCount: propLaneCount,
  showManeuverDirection = true,
  showGuideLane = true,
  arrowColor: propArrowColor,
  horizonColor: propHorizonColor,
  guideLaneColor: propGuideLaneColor,
  highwayBadgeColor: propHighwayBadgeColor,
  groundColor: propGroundColor,
  skyColor: propSkyColor,
  horizonGlowColor: propHorizonGlowColor,
  horizonGlowIntensity: propHorizonGlowIntensity,
  horizonGlowSpread: propHorizonGlowSpread,
  horizonGlowBalance: propHorizonGlowBalance,
  horizonBoundaryColor: propHorizonBoundaryColor,
  horizonBoundaryOpacity: propHorizonBoundaryOpacity,
  roadColor: propRoadColor,
  highwayBadgeTextColor: propHighwayBadgeTextColor,
  streetTitleColor: propStreetTitleColor,
  instructionTextColor: propInstructionTextColor,
  distanceTextColor: propDistanceTextColor,
  backgroundColor: propBackgroundColor,
  width,
  height,
}) => {
  const journey = useMockpitStore((s) => s.journey);
  const activePalette = useMockpitStore((s) => s.activePalette);

  // Viewport container measurement for 1:1 responsive scene rendering
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 372,
    height: 429,
  });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          setViewportSize({ width: Math.round(w), height: Math.round(h) });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Derived colors with backwards compatibility
  const primaryPaletteColor = activePalette?.primary || '#38bdf8';

  // Backward compatibility: if no groundColor or skyColor provided, fall back to legacy backgroundColor
  const resolvedGroundColor = propGroundColor || (!propGroundColor && propBackgroundColor ? propBackgroundColor : undefined);
  const resolvedSkyColor = propSkyColor || (!propSkyColor && propBackgroundColor ? propBackgroundColor : undefined);

  // 1. Ground Color (region below horizon line)
  const groundColor = resolvedGroundColor || DEFAULT_MINI_NAV_COLORS.groundColor;

  // 2. Sky Color (region above horizon line)
  const skyColor = resolvedSkyColor || DEFAULT_MINI_NAV_COLORS.skyColor;

  // 3. Road Color (base tone for the road surface)
  const roadColor = propRoadColor || DEFAULT_MINI_NAV_COLORS.roadColor;

  // 4. Arrow Color
  const arrowColor = propArrowColor && propArrowColor !== '#f59e0b' && propArrowColor !== '#38bdf8' && propArrowColor !== 'var(--color-primary)'
    ? propArrowColor
    : primaryPaletteColor;

  // 5. Guide Lane Color
  const guideLaneColor = propGuideLaneColor && propGuideLaneColor !== '#f59e0b' && propGuideLaneColor !== '#38bdf8' && propGuideLaneColor !== 'var(--color-primary)'
    ? propGuideLaneColor
    : arrowColor;

  // 6. Highway Badge Color (border & background tint)
  const highwayBadgeColor = propHighwayBadgeColor || primaryPaletteColor;

  // 7. Highway Badge Text Color
  const highwayBadgeTextColor = propHighwayBadgeTextColor || highwayBadgeColor || primaryPaletteColor;

  // 8. Street Title Color
  const streetTitleColor = propStreetTitleColor || DEFAULT_MINI_NAV_COLORS.streetTitleColor;

  // 9. Instruction Text Color
  const instructionTextColor = propInstructionTextColor || DEFAULT_MINI_NAV_COLORS.instructionTextColor;

  // 10. Distance Text Color
  const distanceTextColor = propDistanceTextColor || DEFAULT_MINI_NAV_COLORS.distanceTextColor;

  // Atmospheric horizon glow accent & boundary controls
  // Independent from Sky Color and Ground Color
  const horizonGlowColor =
    propHorizonGlowColor ||
    DEFAULT_MINI_NAV_COLORS.horizonGlowColor;

  const horizonGlowIntensity =
    propHorizonGlowIntensity !== undefined && propHorizonGlowIntensity !== ''
      ? Math.max(0, Math.min(100, Number(propHorizonGlowIntensity)))
      : DEFAULT_MINI_NAV_COLORS.horizonGlowIntensity;

  const horizonGlowSpread =
    propHorizonGlowSpread !== undefined && propHorizonGlowSpread !== ''
      ? Math.max(0, Math.min(100, Number(propHorizonGlowSpread)))
      : DEFAULT_MINI_NAV_COLORS.horizonGlowSpread;

  const horizonGlowBalance =
    propHorizonGlowBalance !== undefined && propHorizonGlowBalance !== ''
      ? Math.max(-100, Math.min(100, Number(propHorizonGlowBalance)))
      : DEFAULT_MINI_NAV_COLORS.horizonGlowBalance;

  const horizonBoundaryColor =
    propHorizonBoundaryColor ||
    DEFAULT_MINI_NAV_COLORS.horizonBoundaryColor;

  const horizonBoundaryOpacity =
    propHorizonBoundaryOpacity !== undefined && propHorizonBoundaryOpacity !== ''
      ? Math.max(0, Math.min(100, Number(propHorizonBoundaryOpacity)))
      : DEFAULT_MINI_NAV_COLORS.horizonBoundaryOpacity;

  // Derived values favoring prop override or store journey state
  const currentManeuver = journey?.currentManeuver;
  const currentHighway = propHighwayName || journey?.currentHighwayName || currentManeuver?.highwayName || 'I-280 N';
  const maneuverType: ManeuverType =
    propManeuverType || currentManeuver?.maneuverType || 'straight';
  
  const distanceFormatted = useMemo(() => {
    if (propDistance) return propDistance;
    if (currentManeuver?.distanceToManeuver !== undefined) {
      const d = currentManeuver.distanceToManeuver;
      const unit = currentManeuver.distanceUnit || 'mi';
      return d < 1 && unit === 'mi' ? `${Math.round(d * 5280)} ft` : `${d.toFixed(1)} ${unit}`;
    }
    return '0.8 mi';
  }, [propDistance, currentManeuver]);

  const exitOrStreetName = useMemo(() => {
    if (propNextExit) return propNextExit;
    if (currentManeuver?.exitNumber) {
      return `Exit ${currentManeuver.exitNumber}: ${currentManeuver.streetName || currentManeuver.instruction}`;
    }
    if (currentManeuver?.streetName) {
      return currentManeuver.streetName;
    }
    if (currentManeuver?.instruction) {
      return currentManeuver.instruction;
    }
    return 'Exit 12: Foothill Expwy';
  }, [propNextExit, currentManeuver]);

  // Maneuver instruction short action-only phrases lookup structure
  const maneuverInstruction = useMemo(() => {
    const actionPhrases: Record<ManeuverType, string> = {
      'straight': 'Continue Straight',
      'slight-left': 'Bear Left',
      'slight-right': 'Keep Right',
      'left': 'Turn Left',
      'right': 'Turn Right',
      'arrive': 'Arrive',
      'sharp-left': 'Sharp Left',
      'sharp-right': 'Sharp Right',
      'u-turn-left': 'U-Turn',
      'u-turn-right': 'U-Turn',
      'merge-left': 'Merge Left',
      'merge-right': 'Merge Right',
      'roundabout': 'Enter Roundabout',
    };

    return actionPhrases[maneuverType] || actionPhrases['straight'];
  }, [maneuverType]);

  const numLanes = Number(propLaneCount) || 3;

  function getRecommendedLaneIndex(type: ManeuverType, lanes: number): number | null {
    if (type === 'slight-left' || type === 'left') return 0;
    if (type === 'slight-right' || type === 'right') return lanes - 1;
    // 'straight' and any unmapped type: no single-lane emphasis (per v1 B1)
    return null;
  }

  const activeLane = getRecommendedLaneIndex(maneuverType, numLanes);

  // Dynamic SVG dimensions from measured viewport container
  const W = viewportSize.width || 372;
  const H = viewportSize.height || 429;

  // Vanishing perspective geometry derived proportionally from base 320x390 design
  // Ratios:
  // roadTopLeftX_r    = 138/320, roadTopRightX_r   = 182/320
  // roadBottomLeftX_r = 24/320,  roadBottomRightX_r= 296/320
  // horizonLineY_r    = 120/390, roadBottomY       = H (extends completely to bottom coordinate 429)
  // skyTopY_r         = 20/390
  const roadTopLeft = { x: W * (138 / 320), y: H * (120 / 390) };
  const roadTopRight = { x: W * (182 / 320), y: H * (120 / 390) };
  const roadBottomLeft = { x: W * (24 / 320), y: H };
  const roadBottomRight = { x: W * (296 / 320), y: H };

  const horizonLineY = H * (120 / 390);

  // Spread: 0% - 100% (default 100%).
  // Controls how far the gradient extends above and below the horizon while preserving horizon at y=132.
  // At 100% spread on base 372x429 viewport:
  // extentAbove = 110 (top at y = 132 - 110 = 22)
  // extentBelow = 44 (bottom at y = 132 + 44 = 176)
  // glowHeight = 154
  const spreadFactor = Math.max(0, Math.min(100, horizonGlowSpread)) / 100;
  const scaleY = H / 429;
  const extentAbove = 110 * scaleY * spreadFactor;
  const extentBelow = 44 * scaleY * spreadFactor;
  const glowTopY = horizonLineY - extentAbove;
  const glowBottomY = horizonLineY + extentBelow;
  const horizonGlowHeight = Math.max(0, glowBottomY - glowTopY);

  // Horizon Glow Position / Balance: -100 to +100 (default 0).
  // -100 = glow biased upward
  // 0 = centered on horizon
  // +100 = glow biased downward
  // Modifies center stop distribution without moving the horizon line.
  // Base offset where horizon line sits inside the glow rect: 110 / 154 = 71.42857%
  const baseCenterOffset = 71.42857;
  let centerStopOffset = baseCenterOffset;
  if (horizonGlowBalance > 0) {
    centerStopOffset = baseCenterOffset + (95 - baseCenterOffset) * (horizonGlowBalance / 100);
  } else if (horizonGlowBalance < 0) {
    centerStopOffset = baseCenterOffset + (baseCenterOffset - 5) * (horizonGlowBalance / 100);
  }
  centerStopOffset = Math.max(1, Math.min(99, centerStopOffset));

  const centerStopOpacity = (Math.max(0, Math.min(100, horizonGlowIntensity)) / 100);
  const boundaryStrokeOpacity = (Math.max(0, Math.min(100, horizonBoundaryOpacity)) / 100);

  // Guide-lane chevrons: a sequence of forward-pointing chevrons following
  // the road's perspective trapezoid, replacing the flat tinted polygon.
  // Chevrons narrow and fade toward the horizon (t=0) and grow/brighten
  // toward the viewer (t=1), using the same inset-lane math the previous
  // flat polygon used. Static — no animation, per HMI no-pulsing rule.
  const CHEVRON_T_STEPS = [0, 0.03, 0.09, 0.17, 0.27, 0.39, 0.52, 0.67, 0.83, 1.00];
  const CHEVRON_OPACITY_STEPS = [0.06, 0.12, 0.17, 0.23, 0.28, 0.34, 0.39, 0.45, 0.51, 0.56];
  // Each chevron's height is capped at this fraction of the vertical gap to
  // the chevron above it (toward the horizon), guaranteeing visible space
  // between them regardless of chevron count or card size.
  const CHEVRON_GAP_DUTY_CYCLE = 0.55;

  const guideLaneChevrons = useMemo(() => {
    if (activeLane === null) return [];
    const L = activeLane + 1; // 1-indexed lane (1 to numLanes)
    const N = numLanes;
    const topLeftX = roadTopLeft.x + (roadTopRight.x - roadTopLeft.x) * ((L - 1) / N);
    const topRightX = roadTopLeft.x + (roadTopRight.x - roadTopLeft.x) * (L / N);
    const bottomLeftX = roadBottomLeft.x + (roadBottomRight.x - roadBottomLeft.x) * ((L - 1) / N);
    const bottomRightX = roadBottomLeft.x + (roadBottomRight.x - roadBottomLeft.x) * (L / N);

    const insetRatio = 0.28;
    const laneTopWidth = topRightX - topLeftX;
    const laneBottomWidth = bottomRightX - bottomLeftX;

    const insetTopLeftX = topLeftX + laneTopWidth * insetRatio;
    const insetTopRightX = topRightX - laneTopWidth * insetRatio;
    const insetBottomLeftX = bottomLeftX + laneBottomWidth * insetRatio;
    const insetBottomRightX = bottomRightX - laneBottomWidth * insetRatio;

    const topCenterX = (insetTopLeftX + insetTopRightX) / 2;
    const topHalfWidth = (insetTopRightX - insetTopLeftX) / 2;
    const bottomCenterX = (insetBottomLeftX + insetBottomRightX) / 2;
    const bottomHalfWidth = (insetBottomRightX - insetBottomLeftX) / 2;

    // Keeps the nearest chevron from touching the component's bottom edge.
    // Local to chevron placement only — does not affect the road polygon,
    // which still extends flush to the bottom as before.
    const CHEVRON_BOTTOM_MARGIN = 14;
    const topY = roadTopLeft.y;
    const bottomY = roadBottomLeft.y - CHEVRON_BOTTOM_MARGIN;

    return CHEVRON_T_STEPS.map((t, i) => {
      const y = topY + (bottomY - topY) * t;
      const centerX = topCenterX + (bottomCenterX - topCenterX) * t;
      // 0.9 = small inward margin so chevrons don't touch the ribbon edges
      const halfWidth = (topHalfWidth + (bottomHalfWidth - topHalfWidth) * t) * 0.9;
      // Ratios below match the reference chevron: outer half-width 180 ->
      // apex height 100, inner half-width 75, inner cut height 45% of apex.
      const widthBasedApex = halfWidth * (100 / 180);
      let apexHeight = widthBasedApex;
      if (i > 0) {
        const prevT = CHEVRON_T_STEPS[i - 1];
        const prevY = topY + (bottomY - topY) * prevT;
        const gapToPrev = y - prevY;
        apexHeight = Math.min(widthBasedApex, gapToPrev * CHEVRON_GAP_DUTY_CYCLE);
      }
      const innerHalfWidth = halfWidth * (75 / 180);
      const innerCutHeight = apexHeight * 0.45;

      const d =
        `M ${(centerX - halfWidth).toFixed(2)},${y.toFixed(2)} ` +
        `L ${centerX.toFixed(2)},${(y - apexHeight).toFixed(2)} ` +
        `L ${(centerX + halfWidth).toFixed(2)},${y.toFixed(2)} ` +
        `L ${(centerX + innerHalfWidth).toFixed(2)},${y.toFixed(2)} ` +
        `L ${centerX.toFixed(2)},${(y - innerCutHeight).toFixed(2)} ` +
        `L ${(centerX - innerHalfWidth).toFixed(2)},${y.toFixed(2)} Z`;

      return { d, opacity: CHEVRON_OPACITY_STEPS[i] ?? 0.3, key: `chevron-${i}` };
    });
  }, [activeLane, numLanes, roadTopLeft.x, roadTopLeft.y, roadTopRight.x, roadBottomLeft.x, roadBottomLeft.y, roadBottomRight.x]);

  return (
    <div
      id="mini-nav-container"
      className="relative w-full h-full flex flex-col items-center justify-between select-none overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-md"
      style={{
        backgroundColor: skyColor,
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
    >
      {/* Top Header: Current Highway & Maneuver Distance */}
      <div
        id="mini-nav-header"
        className="w-full px-5 pt-5 pb-4 z-10 flex flex-col items-start justify-start bg-gradient-to-b from-black/40 via-black/15 to-transparent transition-colors"
        style={{
          backgroundColor: skyColor,
          borderBottom: 'none',
          borderBottomWidth: 0,
          boxShadow: 'none',
        }}
      >
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              id="mini-nav-highway-badge"
              className="px-2.5 py-1 rounded text-sm font-mono font-bold tracking-wider uppercase border border-sky-500/40 bg-sky-500/15 text-sky-400"
              style={{
                borderColor: `color-mix(in srgb, ${highwayBadgeColor} 40%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${highwayBadgeColor} 15%, transparent)`,
                color: highwayBadgeTextColor,
              }}
            >
              {currentHighway}
            </span>
          </div>

          {/* Wrap distance + icon together so both sit on the right */}
          <div className="flex items-center gap-2 shrink-0">
            {showManeuverDirection && (
              <svg
                width="44"
                height="52"
                viewBox="80 120 160 190"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ManeuverGlyph type={maneuverType} color={arrowColor} />
              </svg>
            )}
            <span
              id="mini-nav-distance-text"
              className="text-xl font-bold font-mono tracking-tight"
              style={{ color: distanceTextColor }}
            >
              {distanceFormatted}
            </span>
          </div>
        </div>

        <h3
          id="mini-nav-street-title"
          className="mt-2 w-full text-lg font-semibold tracking-tight leading-snug"
          style={{ color: streetTitleColor }}
        >
          {exitOrStreetName}
        </h3>

        {maneuverType !== 'straight' && (
          <span
            id="mini-nav-instruction-sub"
            className="mt-1 text-[11px] font-mono"
            style={{ color: instructionTextColor }}
          >
            {maneuverInstruction}
          </span>
        )}
      </div>

      {/* Center 3D Perspective Road & Directional Maneuver SVG */}
      <div
        id="mini-nav-viewport"
        ref={viewportRef}
        className="relative flex-1 w-full flex items-center justify-center p-0 overflow-hidden"
        style={{
          borderTop: 'none',
          borderTopWidth: 0,
          boxShadow: 'none',
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Perspective Road Surface Gradient */}
            <linearGradient id="roadGrad" x1={W * 0.5} y1={horizonLineY} x2={W * 0.5} y2={roadBottomLeft.y} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={roadColor} stopOpacity="0.4" />
              <stop offset="60%" stopColor={roadColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={roadColor} stopOpacity="0.95" />
            </linearGradient>

            {/* Horizon Glow Gradient: 3-stop model (top opacity 0% -> center opacity -> bottom opacity 0%) */}
            <linearGradient id="horizonGlow" x1={W * 0.5} y1={glowTopY} x2={W * 0.5} y2={glowBottomY} gradientUnits="userSpaceOnUse">
              <stop
                offset="0%"
                stopColor={horizonGlowColor}
                stopOpacity="0"
              />
              <stop
                offset={`${centerStopOffset.toFixed(1)}%`}
                stopColor={horizonGlowColor}
                stopOpacity={centerStopOpacity}
              />
              <stop
                offset="100%"
                stopColor={horizonGlowColor}
                stopOpacity="0"
              />
            </linearGradient>

            {/* Road Shoulder Border Shadows */}
            <filter id="roadGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={activePalette?.primary || '#38bdf8'} floodOpacity="0.2" />
            </filter>
          </defs>

          {/* 1. Sky Background (y=0 through y=horizonLineY) */}
          <rect
            id="mini-nav-sky-bg"
            x="0"
            y="0"
            width={W}
            height={horizonLineY}
            fill={skyColor}
          />

          {/* 2. Ground Background (y=horizonLineY through y=H) */}
          <rect
            id="mini-nav-ground-bg"
            x="0"
            y={horizonLineY}
            width={W}
            height={H - horizonLineY}
            fill={groundColor}
          />

          {/* 3. Horizon Glow Overlay Mesh: Fills full width, spans from glowTopY to glowBottomY */}
          <rect
            id="mini-nav-horizon-glow"
            x="0"
            y={glowTopY}
            width={W}
            height={horizonGlowHeight}
            fill="url(#horizonGlow)"
          />

          {/* 4. Perspective Horizon Boundary Line (Configurable boundary color & opacity, position fixed at y=132) */}
          <line
            id="mini-nav-horizon-boundary"
            x1="0"
            y1={horizonLineY}
            x2={W}
            y2={horizonLineY}
            stroke={horizonBoundaryColor}
            strokeWidth="1"
            strokeOpacity={boundaryStrokeOpacity}
          />

          {/* 5. Opaque Road Base: establishes fully opaque road surface to mask Ground Color and Horizon Glow */}
          <polygon
            id="mini-nav-road-base"
            points={`${roadTopLeft.x},${roadTopLeft.y} ${roadTopRight.x},${roadTopRight.y} ${roadBottomRight.x},${roadBottomRight.y} ${roadBottomLeft.x},${roadBottomLeft.y}`}
            fill={roadColor}
            fillOpacity="1"
          />

          {/* 6. Road Shading: perspective gradient overlay composited above opaque Road Base */}
          <polygon
            id="mini-nav-road-shading"
            points={`${roadTopLeft.x},${roadTopLeft.y} ${roadTopRight.x},${roadTopRight.y} ${roadBottomRight.x},${roadBottomRight.y} ${roadBottomLeft.x},${roadBottomLeft.y}`}
            fill="url(#roadGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Outer Road Edge Curbs / Perspective Markings */}
          <line
            id="mini-nav-left-lane-edge"
            x1={roadTopLeft.x}
            y1={roadTopLeft.y}
            x2={roadBottomLeft.x}
            y2={roadBottomLeft.y}
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeOpacity="0.7"
          />
          <line
            id="mini-nav-right-lane-edge"
            x1={roadTopRight.x}
            y1={roadTopRight.y}
            x2={roadBottomRight.x}
            y2={roadBottomRight.y}
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeOpacity="0.7"
          />

          {/* Perspective Lane Dividers */}
          {Array.from({ length: numLanes - 1 }).map((_, i) => {
            const ratio = (i + 1) / numLanes;
            const topX = roadTopLeft.x + (roadTopRight.x - roadTopLeft.x) * ratio;
            const botX = roadBottomLeft.x + (roadBottomRight.x - roadBottomLeft.x) * ratio;
            const dx = botX - topX;
            const dy = roadBottomLeft.y - roadTopLeft.y;
            const lineLength = Math.sqrt(dx * dx + dy * dy);
            // Scale offset proportionally to lane length in MiniNav vs ODV viewport (approx 260px / 400px = 0.65)
            const scaledOffset = (journey?.roadOffset ?? 0) * (lineLength / 400);

            return (
              <line
                key={`lane-div-${i}`}
                x1={topX}
                y1={roadTopLeft.y}
                x2={botX}
                y2={roadBottomLeft.y}
                stroke="#64748b"
                strokeWidth="2.5"
                strokeDasharray="28 28"
                strokeDashoffset={scaledOffset}
                strokeOpacity="0.6"
              />
            );
          })}

          {/* Recommended Path Chevrons - follow the road's perspective trapezoid */}
          {activeLane !== null && showGuideLane && (
            <g id="mini-nav-guide-lane">
              {guideLaneChevrons.map((c) => (
                <path key={c.key} d={c.d} fill={guideLaneColor} fillOpacity={c.opacity} />
              ))}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
