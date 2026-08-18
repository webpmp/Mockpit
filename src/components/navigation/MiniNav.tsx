import React, { useMemo } from 'react';
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
  width?: number;
  height?: number;
}

/**
 * Mini Nav Component
 * A compact, portrait-oriented SVG component (base 320x510px) that renders
 * a stylized first-person road perspective with a prominent directional maneuver arrow.
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
  width,
  height,
}) => {
  const journey = useMockpitStore((s) => s.journey);
  const activePalette = useMockpitStore((s) => s.activePalette);

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

  // Maneuver instruction subtitle (e.g. "Stay in right 2 lanes")
  const maneuverInstruction = useMemo(() => {
    switch (maneuverType) {
      case 'slight-right':
        return 'Take exit on right';
      case 'slight-left':
        return 'Keep left at fork';
      case 'right':
        return 'Turn right onto ramp';
      case 'left':
        return 'Turn left onto ramp';
      case 'arrive':
        return 'Arriving at destination';
      case 'straight':
      default:
        return 'Continue straight';
    }
  }, [maneuverType]);

  const numLanes = Number(propLaneCount) || 3;
  const activeLane = Number(propActiveLaneIndex) || (maneuverType === 'slight-right' || maneuverType === 'right' ? numLanes - 1 : 1);

  // SVG dimensions
  const viewBoxW = 320;
  const viewBoxH = 510;

  // Vanishing perspective geometry
  // Road extends from bottom (y=380, x=30 to 290) to vanishing point (y=110, x=135 to 185)
  const roadBottomLeft = { x: 24, y: 380 };
  const roadBottomRight = { x: 296, y: 380 };
  const roadTopLeft = { x: 138, y: 120 };
  const roadTopRight = { x: 182, y: 120 };

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
      <div id="mini-nav-viewport" className="relative flex-1 w-full flex items-center justify-center p-2">
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH - 120}`}
          className="w-full h-full max-h-[360px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Perspective Road Surface Gradient */}
            <linearGradient id="roadGrad" x1="160" y1="120" x2="160" y2="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#1e293b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.95" />
            </linearGradient>

            {/* Horizon Glow Gradient */}
            <linearGradient id="horizonGlow" x1="160" y1="100" x2="160" y2="150" gradientUnits="userSpaceOnUse">
              <stop
                offset="0%"
                stopColor={activePalette?.primary || '#38bdf8'}
                stopOpacity="0.25"
              />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </linearGradient>

            {/* Maneuver Arrow Primary Gradient */}
            <linearGradient id="arrowGrad" x1="160" y1="130" x2="160" y2="300" gradientUnits="userSpaceOnUse">
              <stop
                offset="0%"
                stopColor={activePalette?.primary || '#38bdf8'}
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor={activePalette?.secondary || '#0284c7'}
                stopOpacity="0.85"
              />
            </linearGradient>

            {/* Road Shoulder Border Shadows */}
            <filter id="roadGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Horizon Background Mesh */}
          <rect x="0" y="80" width={viewBoxW} height="70" fill="url(#horizonGlow)" />

          {/* Perspective Horizon Ground Lines */}
          <line x1="0" y1="120" x2={viewBoxW} y2="120" stroke="#334155" strokeWidth="1" strokeOpacity="0.5" />

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
                strokeOpacity="0.6"
              />
            );
          })}

          {/* Recommended Path Ribbon (Underlay behind arrow) */}
          <polygon
            points={`150,${roadTopLeft.y} 170,${roadTopLeft.y} ${
              roadBottomLeft.x + (roadBottomRight.x - roadBottomLeft.x) * ((activeLane + 0.8) / numLanes)
            },${roadBottomLeft.y} ${
              roadBottomLeft.x + (roadBottomRight.x - roadBottomLeft.x) * ((activeLane + 0.2) / numLanes)
            },${roadBottomLeft.y}`}
            fill={activePalette?.primary || '#38bdf8'}
            fillOpacity="0.12"
          />

          {/* Perspective Maneuver Arrow Glyph (Bold, High Contrast, Automotive Realism) */}
          <g id="maneuver-arrow-projection" transform="translate(0, 10)">
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
                color={activePalette?.primary || '#38bdf8'}
              />
            </g>
          </g>

          {/* Road Bottom Hood Gradient Cutoff */}
          <rect x="0" y="360" width={viewBoxW} height="30" fill="url(#roadGrad)" opacity="0.5" />
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
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/60'
                    : 'bg-slate-800/80 text-slate-500 border border-slate-700/40'
                }`}
                style={
                  isGuideLane
                    ? {
                        borderColor: `var(--color-primary, #38bdf8)`,
                        color: `var(--color-primary, #38bdf8)`,
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
