import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ManeuverType } from '../../types';
import { ManeuverGlyph } from './ManeuverGlyph';

interface MiniNavProps {
  highwayName?: string;
  nextExit?: string;
  distanceToManeuver?: string;
  maneuverType?: ManeuverType;
  laneCount?: number | string;
  activeLaneIndex?: number | string;
  arrowColor?: string;
  horizonColor?: string;
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
  activeLaneIndex: propActiveLaneIndex,
  arrowColor: propArrowColor,
  horizonColor: propHorizonColor,
  width,
  height,
}) => {
  const journey = useMockpitStore((s) => s.journey);
  const activePalette = useMockpitStore((s) => s.activePalette);

  // Viewport container measurement for 1:1 responsive scene rendering
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 320,
    height: 390,
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

  // Derived colors
  const arrowColor = propArrowColor || '#f59e0b';
  const horizonColor = propHorizonColor || '#f59e0b';

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
  const activeLane = Number(propActiveLaneIndex) !== undefined && !isNaN(Number(propActiveLaneIndex))
    ? Math.min(Math.max(0, Number(propActiveLaneIndex)), numLanes - 1)
    : (maneuverType === 'slight-right' || maneuverType === 'right' ? numLanes - 1 : 1);

  // Dynamic SVG dimensions from measured viewport container
  const W = viewportSize.width || 320;
  const H = viewportSize.height || 390;

  // Vanishing perspective geometry derived proportionally from base 320x390 design
  // Ratios:
  // roadTopLeftX_r    = 138/320, roadTopRightX_r   = 182/320
  // roadBottomLeftX_r = 24/320,  roadBottomRightX_r= 296/320
  // horizonLineY_r    = 120/390, roadBottomY_r     = 380/390
  // skyTopY_r         = 20/390
  const roadTopLeft = { x: W * (138 / 320), y: H * (120 / 390) };
  const roadTopRight = { x: W * (182 / 320), y: H * (120 / 390) };
  const roadBottomLeft = { x: W * (24 / 320), y: H * (380 / 390) };
  const roadBottomRight = { x: W * (296 / 320), y: H * (380 / 390) };

  const horizonLineY = H * (120 / 390);
  const skyTopY = H * (20 / 390);
  const glowBottomY = H * (160 / 390);
  const horizonGlowHeight = glowBottomY - skyTopY;

  // Arrow uniform scale factor preserving 1:1 aspect ratio proportions
  const arrowScale = Math.min(W / 320, H / 390);
  // Centered over dynamic road center (W * 0.5) and proportional vertical horizon offset
  const arrowTranslateX = (W - 320 * arrowScale) / 2;
  const arrowTranslateY = (horizonLineY - 120 * arrowScale) + (10 * arrowScale);

  // Programmatic calculation of Guide Lane Highlight Path Strip
  // Insets inward proportionally to lane width (default insetRatio = 0.28)
  const guideLanePolygonPoints = useMemo(() => {
    const L = activeLane + 1; // 1-indexed lane (1 to numLanes)
    const N = numLanes;
    const topLeftX = roadTopLeft.x + (roadTopRight.x - roadTopLeft.x) * ((L - 1) / N);
    const topRightX = roadTopLeft.x + (roadTopRight.x - roadTopLeft.x) * (L / N);
    const bottomLeftX = roadBottomLeft.x + (roadBottomRight.x - roadBottomLeft.x) * ((L - 1) / N);
    const bottomRightX = roadBottomLeft.x + (roadBottomRight.x - roadBottomLeft.x) * (L / N);

    const laneTopWidth = topRightX - topLeftX;
    const laneBottomWidth = bottomRightX - bottomLeftX;
    const insetRatio = 0.28;

    const insetTopLeftX = topLeftX + laneTopWidth * insetRatio;
    const insetTopRightX = topRightX - laneTopWidth * insetRatio;
    const insetBottomLeftX = bottomLeftX + laneBottomWidth * insetRatio;
    const insetBottomRightX = bottomRightX - laneBottomWidth * insetRatio;

    return `${insetTopLeftX.toFixed(2)},${roadTopLeft.y.toFixed(2)} ${insetTopRightX.toFixed(2)},${roadTopLeft.y.toFixed(2)} ${insetBottomRightX.toFixed(2)},${roadBottomLeft.y.toFixed(2)} ${insetBottomLeftX.toFixed(2)},${roadBottomLeft.y.toFixed(2)}`;
  }, [activeLane, numLanes, roadTopLeft.x, roadTopLeft.y, roadTopRight.x, roadBottomLeft.x, roadBottomLeft.y, roadBottomRight.x]);

  return (
    <div
      id="mini-nav-container"
      className="relative w-full h-full flex flex-col items-center justify-between select-none overflow-hidden rounded-2xl bg-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-md"
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
    >
      {/* Top Header: Current Highway & Maneuver Distance */}
      <div
        id="mini-nav-header"
        className="w-full px-5 pt-4 pb-2 z-10 flex flex-col items-start justify-start border-b border-slate-800/50 bg-gradient-to-b from-slate-900/90 to-transparent"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span
              id="mini-nav-highway-badge"
              className="px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase border border-sky-500/40 bg-sky-500/15 text-sky-400"
              style={{
                borderColor: `color-mix(in srgb, var(--color-primary, #38bdf8) 40%, transparent)`,
                backgroundColor: `color-mix(in srgb, var(--color-primary, #38bdf8) 15%, transparent)`,
                color: `var(--color-primary, #38bdf8)`,
              }}
            >
              {currentHighway}
            </span>
          </div>

          <span
            id="mini-nav-distance-text"
            className="text-xl font-bold font-mono tracking-tight text-slate-100"
          >
            {distanceFormatted}
          </span>
        </div>

        <div className="mt-1 w-full flex items-baseline justify-between gap-2">
          <h3
            id="mini-nav-street-title"
            className="text-sm font-semibold text-slate-200 tracking-tight truncate max-w-[200px]"
            title={exitOrStreetName}
          >
            {exitOrStreetName}
          </h3>
          <span
            id="mini-nav-instruction-sub"
            className="text-[11px] font-mono text-slate-400 whitespace-nowrap"
          >
            {maneuverInstruction}
          </span>
        </div>
      </div>

      {/* Center 3D Perspective Road & Directional Maneuver SVG */}
      <div
        id="mini-nav-viewport"
        ref={viewportRef}
        className="relative flex-1 w-full flex items-center justify-center p-0 overflow-hidden"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Perspective Road Surface Gradient */}
            <linearGradient id="roadGrad" x1={W * 0.5} y1={horizonLineY} x2={W * 0.5} y2={roadBottomLeft.y} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#1e293b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.95" />
            </linearGradient>

            {/* Horizon Glow Gradient: Dual fade spanning from skyTopY (sky), peaking at horizonLineY (horizon line), dissolving into glowBottomY (road) */}
            <linearGradient id="horizonGlow" x1={W * 0.5} y1={skyTopY} x2={W * 0.5} y2={glowBottomY} gradientUnits="userSpaceOnUse">
              <stop
                offset="0%"
                stopColor={horizonColor}
                stopOpacity="0"
              />
              <stop
                offset={`${(((horizonLineY - skyTopY) / (glowBottomY - skyTopY)) * 100).toFixed(1)}%`}
                stopColor={horizonColor}
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor={horizonColor}
                stopOpacity="0"
              />
            </linearGradient>

            {/* Maneuver Arrow Primary Gradient */}
            <linearGradient id="arrowGrad" x1="160" y1="130" x2="160" y2="300" gradientUnits="userSpaceOnUse">
              <stop
                offset="0%"
                stopColor={arrowColor}
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor={`color-mix(in srgb, ${arrowColor} 65%, #000)`}
                stopOpacity="0.85"
              />
            </linearGradient>

            {/* Road Shoulder Border Shadows */}
            <filter id="roadGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Horizon Background Mesh: Fills full width, spans from skyTopY to glowBottomY */}
          <rect x="0" y={skyTopY} width={W} height={horizonGlowHeight} fill="url(#horizonGlow)" />

          {/* Perspective Horizon Ground Lines */}
          <line x1="0" y1={horizonLineY} x2={W} y2={horizonLineY} stroke="#334155" strokeWidth="1" strokeOpacity="0.5" />

          {/* 3D Road Bed Polygon */}
          <polygon
            points={`${roadTopLeft.x},${roadTopLeft.y} ${roadTopRight.x},${roadTopRight.y} ${roadBottomRight.x},${roadBottomRight.y} ${roadBottomLeft.x},${roadBottomLeft.y}`}
            fill="url(#roadGrad)"
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Outer Road Edge Curbs / Perspective Markings */}
          <line
            x1={roadTopLeft.x}
            y1={roadTopLeft.y}
            x2={roadBottomLeft.x}
            y2={roadBottomLeft.y}
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeOpacity="0.7"
          />
          <line
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
                strokeWidth="1.5"
                strokeDasharray="14 12"
                strokeDashoffset={scaledOffset}
                strokeOpacity="0.6"
              />
            );
          })}

          {/* Recommended Path Ribbon (Underlay behind arrow) - Accurately aligned to guide lane boundaries */}
          <polygon
            points={guideLanePolygonPoints}
            fill={arrowColor}
            fillOpacity="0.16"
          />

          {/* Perspective Maneuver Arrow Glyph (Uniformly scaled and centered over the road) */}
          <g
            id="maneuver-arrow-projection"
            transform={`translate(${arrowTranslateX.toFixed(2)}, ${arrowTranslateY.toFixed(2)}) scale(${arrowScale.toFixed(4)})`}
          >
            {/* Arrow Base Drop Shadow */}
            <g opacity="0.4" transform="translate(0, 4)">
              <ManeuverGlyph type={maneuverType} color="#020617" />
            </g>
            
            {/* Main Arrow */}
            <ManeuverGlyph
              type={maneuverType}
              color="url(#arrowGrad)"
            />

            {/* Crisp Inner Highlighting */}
            <g opacity="0.6">
              <ManeuverGlyph
                type={maneuverType}
                color={arrowColor}
              />
            </g>
          </g>

          {/* Road Bottom Hood Gradient Cutoff */}
          <rect x="0" y={roadBottomLeft.y - 20 * arrowScale} width={W} height={30 * arrowScale} fill="url(#roadGrad)" opacity="0.5" />
        </svg>
      </div>

      {/* Bottom Lane Guidance Indicators */}
      <div
        id="mini-nav-lane-guidance"
        className="w-full px-5 py-2.5 z-10 flex items-center justify-between border-t border-slate-800/60 bg-slate-900/60"
      >
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Lanes
        </span>

        <div className="flex items-center gap-1.5" id="mini-nav-lanes-strip">
          {Array.from({ length: numLanes }).map((_, idx) => {
            const isGuideLane = idx === activeLane;
            return (
              <div
                key={`lane-pill-${idx}`}
                className={`flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-mono font-bold transition-all ${
                  isGuideLane
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                    : 'bg-slate-800/80 text-slate-500 border border-slate-700/40'
                }`}
                style={
                  isGuideLane
                    ? {
                        borderColor: arrowColor,
                        color: arrowColor,
                        backgroundColor: `color-mix(in srgb, ${arrowColor} 20%, transparent)`,
                      }
                    : undefined
                }
              >
                {isGuideLane ? '▲' : '·'}
              </div>
            );
          })}
        </div>

        <span className="text-[10px] font-mono text-slate-400">
          Lane {activeLane + 1} of {numLanes}
        </span>
      </div>
    </div>
  );
};
