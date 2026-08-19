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
  showManeuverDirection?: boolean;
  showGuideLane?: boolean;
  arrowColor?: string;
  horizonColor?: string;
  guideLaneColor?: string;
  highwayBadgeColor?: string;
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
  const guideLaneColor = propGuideLaneColor || arrowColor;
  const highwayBadgeColor = propHighwayBadgeColor;

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

  // Programmatic calculation of Guide Lane Highlight Path Strip
  // Insets inward proportionally to lane width (default insetRatio = 0.28)
  const guideLanePolygonPoints = useMemo(() => {
    if (activeLane === null) return '';
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
        className="w-full px-5 pt-5 pb-4 z-10 flex flex-col items-start justify-start bg-gradient-to-b from-slate-900/90 to-transparent"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span
              id="mini-nav-highway-badge"
              className="px-2.5 py-1 rounded text-sm font-mono font-bold tracking-wider uppercase border border-sky-500/40 bg-sky-500/15 text-sky-400"
              style={{
                borderColor: `color-mix(in srgb, ${highwayBadgeColor || 'var(--color-primary, #38bdf8)'} 40%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${highwayBadgeColor || 'var(--color-primary, #38bdf8)'} 15%, transparent)`,
                color: highwayBadgeColor || 'var(--color-primary, #38bdf8)',
              }}
            >
              {currentHighway}
            </span>
          </div>

          {/* Wrap distance + icon together so both sit on the right */}
          <div className="flex items-center gap-2">
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
              className="text-xl font-bold font-mono tracking-tight text-slate-100"
            >
              {distanceFormatted}
            </span>
          </div>
        </div>

        <h3
          id="mini-nav-street-title"
          className="mt-2 w-full text-lg font-semibold text-slate-200 tracking-tight leading-snug"
        >
          {exitOrStreetName}
        </h3>

        {maneuverType !== 'straight' && (
          <span
            id="mini-nav-instruction-sub"
            className="mt-1 text-[11px] font-mono text-slate-400"
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

          {/* Recommended Path Ribbon - Accurately aligned to guide lane boundaries */}
          {activeLane !== null && showGuideLane && (
            <polygon
              points={guideLanePolygonPoints}
              fill={guideLaneColor}
              fillOpacity="0.16"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
