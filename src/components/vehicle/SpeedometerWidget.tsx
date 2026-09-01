import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ComponentInstance, VehicleState } from '../../types';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ComponentHeader, DEFAULT_COMPONENT_LABELS, getAlphaColor } from '../ComponentRenderer';

interface SpeedometerWidgetProps {
  component: ComponentInstance;
  resolved?: Record<string, any>;
  isSelected?: boolean;
  isPresentation?: boolean;
  customColor?: string;
  baseOpacity?: string;
  styleOpacity?: number;
}

export const SpeedometerWidget: React.FC<SpeedometerWidgetProps> = ({
  component,
  resolved = {} as Record<string, any>,
  isSelected,
  isPresentation,
  customColor = '#38bdf8',
  baseOpacity = 'opacity-100',
  styleOpacity = 1,
}) => {
  const vehicleState = useMockpitStore((s) => s.vehicleState);
  const setVehicleState = useMockpitStore((s) => s.setVehicleState);
  const selectComponent = useMockpitStore((s) => s.selectComponent);

  const speedVal = resolved.text || String(vehicleState.speed ?? 0);
  const unitVal = resolved.unit || component.staticProps?.unit || 'mph';
  const displayStyle = (resolved.displayStyle || component.staticProps?.displayStyle || 'numeric') as
    | 'numeric'
    | 'radialGauge'
    | 'arcGauge';
  const maxSpd = Math.max(1, Number(resolved.maxSpeed || component.staticProps?.maxSpeed || 140));
  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.speed;

  const parsedSpeed = parseFloat(speedVal);
  const currentSpeed = !isNaN(parsedSpeed) ? parsedSpeed : (vehicleState.speed || 0);
  const ratio = Math.min(1, Math.max(0, currentSpeed / maxSpd));

  // Dedicated drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startSpeed: number;
    pointerId: number;
    targetElement: HTMLElement | null;
  } | null>(null);

  // Centralized cleanup function
  const endDrag = useCallback((element?: HTMLElement | null, pointerId?: number) => {
    const currentDrag = dragStartRef.current;
    const target = element || currentDrag?.targetElement;
    const pId = pointerId !== undefined ? pointerId : currentDrag?.pointerId;

    if (target && pId !== undefined && typeof target.hasPointerCapture === 'function') {
      try {
        if (target.hasPointerCapture(pId)) {
          target.releasePointerCapture(pId);
        }
      } catch {
        // Safe fallback if capture was already released or lost
      }
    }

    dragStartRef.current = null;
    setIsDragging(false);
  }, []);

  // Global safety net listeners while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalRelease = () => {
      endDrag();
    };

    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    window.addEventListener('mouseup', handleGlobalRelease);

    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('mouseup', handleGlobalRelease);
    };
  }, [isDragging, endDrag]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      endDrag();
    };
  }, [endDrag]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary pointer button
    if (e.button !== 0 && e.button !== undefined) return;

    e.stopPropagation();
    e.preventDefault();

    if (!isPresentation && component.id) {
      selectComponent(component.id);
    }

    const target = e.currentTarget;
    if (typeof target.setPointerCapture === 'function') {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture fallback
      }
    }

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startSpeed: currentSpeed,
      pointerId: e.pointerId,
      targetElement: target,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Safeguard: if mouse pointermove occurs with no buttons pressed, terminate drag immediately
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      endDrag(e.currentTarget, e.pointerId);
      return;
    }

    // Critical safeguard: immediately return unless drag is actually active
    if (!isDragging || !dragStartRef.current) return;

    e.stopPropagation();
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    // Upward (-deltaY) and Rightward (+deltaX) produce positive delta (increase speed)
    // Downward (+deltaY) and Leftward (-deltaX) produce negative delta (decrease speed)
    const combinedDeltaPixels = -deltaY + deltaX;

    // Sensitivity: approximately 14 pixels per 1 unit of speed change
    const SENSITIVITY = 14;
    const speedDelta = combinedDeltaPixels / SENSITIVITY;

    // Round to nearest integer (normal increment) and clamp to [0, maxSpd]
    const targetSpeed = Math.round(dragStartRef.current.startSpeed + speedDelta);
    const clampedSpeed = Math.max(0, Math.min(maxSpd, targetSpeed));

    setVehicleState({ speed: clampedSpeed });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    endDrag(e.currentTarget, e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    endDrag(e.currentTarget, e.pointerId);
  };

  const handleLostPointerCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    endDrag(e.currentTarget, e.pointerId);
  };

  // Helper geometry for radial and arc gauges
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const rad = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArcPath = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(cx, cy, r, endA);
    const end = polarToCartesian(cx, cy, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  // 1. Radial Gauge View
  if (displayStyle === 'radialGauge') {
    const startAngle = 220;
    const totalSweep = 280;
    const activeAngle = startAngle + ratio * totalSweep;

    const cx = 100;
    const cy = 100;
    const r = 85;

    const bgArcPath = describeArcPath(cx, cy, r, startAngle, startAngle + totalSweep);
    const activeArcPath = describeArcPath(cx, cy, r, startAngle, Math.max(startAngle + 0.5, activeAngle));
    const needleTip = polarToCartesian(cx, cy, 68, activeAngle);

    // Major Labels for RADIAL: 0, 35, 70, 105 (omits max 140 label & end tick)
    const ticksCount = 4;
    const majorTicks = Array.from({ length: ticksCount }).map((_, i) => {
      const tickAngle = startAngle + i * (totalSweep / ticksCount);
      const outerPt = polarToCartesian(cx, cy, 85, tickAngle);
      const innerPt = polarToCartesian(cx, cy, 75, tickAngle);
      const labelPt = polarToCartesian(cx, cy, 61, tickAngle);
      const val = Math.round((i / ticksCount) * maxSpd);
      return { i, tickAngle, outerPt, innerPt, labelPt, val };
    });

    return (
      <div
        className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-2.5 flex flex-col justify-between items-center text-center shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden [container-type:size] ${baseOpacity}`}
        style={{ containerType: 'size', borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
      >
        <ComponentHeader
          type="speed"
          label={headerLabel}
          customColor={customColor}
          className="w-full"
        />

        {/* Central Interactive Gauge Area with Drag-to-Adjust Speed */}
        <div
          className={`relative w-full flex-1 flex items-center justify-center my-auto z-10 min-h-0 touch-none select-none ${
            isDragging ? 'cursor-grabbing scale-[1.02] brightness-110' : 'cursor-grab hover:brightness-105'
          } transition-transform duration-100`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handleLostPointerCapture}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          title="Drag up/right to increase speed, down/left to decrease"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full max-h-full max-w-full overflow-visible pointer-events-none">
            {/* Background Arc */}
            <path
              d={bgArcPath}
              fill="none"
              stroke="rgba(51, 65, 85, 0.4)"
              strokeWidth="11"
              strokeLinecap="round"
            />

            {/* Active Arc */}
            <path
              d={activeArcPath}
              fill="none"
              stroke={customColor}
              strokeWidth="11"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${getAlphaColor(customColor, '80', 50)})` }}
            />

            {/* Major Ticks & Labels (0, 35, 70, 105) */}
            {majorTicks.map((t) => (
              <g key={t.i}>
                <line
                  x1={t.innerPt.x}
                  y1={t.innerPt.y}
                  x2={t.outerPt.x}
                  y2={t.outerPt.y}
                  stroke={t.tickAngle <= activeAngle ? customColor : 'rgba(100, 116, 139, 0.6)'}
                  strokeWidth="2.5"
                />
                <text
                  x={t.labelPt.x}
                  y={t.labelPt.y + 4}
                  textAnchor="middle"
                  fill="rgba(148, 163, 184, 0.85)"
                  fontSize="11.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {t.val}
                </text>
              </g>
            ))}

            {/* Pivot Center */}
            <circle cx={cx} cy={cy} r="9" fill="#0f172a" stroke={customColor} strokeWidth="2.5" />
            <circle cx={cx} cy={cy} r="3.5" fill={customColor} />

            {/* Rotating Needle */}
            <line
              x1={cx}
              y1={cy}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke={customColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${customColor})` }}
            />

            {/* Center Numeric Value Overlay */}
            <text
              x={cx}
              y={cy + 36}
              textAnchor="middle"
              fill={customColor}
              fontSize="28"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              style={{ filter: `drop-shadow(0 0 10px ${getAlphaColor(customColor, '60', 35)})` }}
            >
              {speedVal}
            </text>
            <text
              x={cx}
              y={cy + 50}
              textAnchor="middle"
              fill="rgba(148, 163, 184, 0.8)"
              fontSize="9"
              fontWeight="bold"
              letterSpacing="1"
              fontFamily="monospace"
            >
              {unitVal.toUpperCase()}
            </text>
          </svg>
        </div>

        <div
          className={`absolute inset-0 pointer-events-none rounded-2xl blur-xl transition-opacity duration-200 ${
            isDragging ? 'opacity-25' : 'opacity-10'
          }`}
          style={{ backgroundColor: customColor }}
        />
      </div>
    );
  }

  // 2. Arc Gauge View (Tapered Wedge)
  if (displayStyle === 'arcGauge') {
    const stop1 = resolved.arcStop1Color || component.staticProps?.arcStop1Color || '#10b981';
    const stop2 = resolved.arcStop2Color || component.staticProps?.arcStop2Color || '#06b6d4';
    const stop3 = resolved.arcStop3Color || component.staticProps?.arcStop3Color || customColor;
    const stop4 = resolved.arcStop4Color || component.staticProps?.arcStop4Color || '#f59e0b';
    const stop5 = resolved.arcStop5Color || component.staticProps?.arcStop5Color || '#ef4444';

    const startAngle = 220;
    const totalSweep = 280;
    const activeAngle = startAngle + ratio * totalSweep;

    const cx = 100;
    const cy = 100;
    const rMid = 78;
    const minWidth = 2.5;
    const maxWidth = 20;

    const computeTaperedWedge = (endDeg: number, steps = 30) => {
      const safeEndDeg = Math.max(startAngle + 0.2, endDeg);
      const sweep = safeEndDeg - startAngle;
      const outerPts: { x: number; y: number }[] = [];
      const innerPts: { x: number; y: number }[] = [];

      for (let i = 0; i <= steps; i++) {
        const stepFrac = i / steps;
        const angleDeg = startAngle + stepFrac * sweep;
        const fullFrac = (angleDeg - startAngle) / totalSweep;
        const w = minWidth + fullFrac * (maxWidth - minWidth);
        const rOut = rMid + w / 2;
        const rIn = rMid - w / 2;

        outerPts.push(polarToCartesian(cx, cy, rOut, angleDeg));
        innerPts.push(polarToCartesian(cx, cy, rIn, angleDeg));
      }

      let d = `M ${outerPts[0].x.toFixed(2)} ${outerPts[0].y.toFixed(2)}`;
      for (let i = 1; i <= steps; i++) {
        d += ` L ${outerPts[i].x.toFixed(2)} ${outerPts[i].y.toFixed(2)}`;
      }
      for (let i = steps; i >= 0; i--) {
        d += ` L ${innerPts[i].x.toFixed(2)} ${innerPts[i].y.toFixed(2)}`;
      }
      d += ' Z';
      return d;
    };

    const bgWedgePath = computeTaperedWedge(startAngle + totalSweep, 30);
    const activeWedgePath = computeTaperedWedge(activeAngle, 30);

    const gradientId = `arcGaugeGrad_${component.id}`;
    const glowBlur = (4 + ratio * 18).toFixed(1);
    const glowOpacity = (0.2 + ratio * 0.75).toFixed(2);

    const ticksCount = 4;
    const arcTicks = Array.from({ length: ticksCount + 1 }).map((_, i) => {
      const tickFrac = i / ticksCount;
      const tickAngle = startAngle + tickFrac * totalSweep;
      const tickW = minWidth + tickFrac * (maxWidth - minWidth);
      const outerPt = polarToCartesian(cx, cy, rMid + tickW / 2 + 5, tickAngle);
      const innerPt = polarToCartesian(cx, cy, rMid + tickW / 2 + 1, tickAngle);
      const labelPt = polarToCartesian(cx, cy, rMid - tickW / 2 - 9, tickAngle);
      const val = Math.round(tickFrac * maxSpd);
      return { i, tickAngle, outerPt, innerPt, labelPt, val };
    });

    return (
      <div
        className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-2.5 flex flex-col justify-between items-center text-center shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden [container-type:size] ${baseOpacity}`}
        style={{ containerType: 'size', borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
      >
        <ComponentHeader
          type="speed"
          label={headerLabel}
          customColor={customColor}
          className="w-full"
        />

        {/* Central Interactive Gauge Area with Drag-to-Adjust Speed */}
        <div
          className={`relative w-full flex-1 flex items-center justify-center my-auto z-10 min-h-0 touch-none select-none ${
            isDragging ? 'cursor-grabbing scale-[1.02] brightness-110' : 'cursor-grab hover:brightness-105'
          } transition-transform duration-100`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handleLostPointerCapture}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          title="Drag up/right to increase speed, down/left to decrease"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full max-h-full max-w-full overflow-visible pointer-events-none">
            <defs>
              <linearGradient
                id={gradientId}
                x1="45"
                y1="0"
                x2="155"
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={stop1} />
                <stop offset="25%" stopColor={stop2} />
                <stop offset="50%" stopColor={stop3} />
                <stop offset="75%" stopColor={stop4} />
                <stop offset="100%" stopColor={stop5} />
              </linearGradient>
            </defs>

            {/* Background Tapered Wedge Track */}
            <path
              d={bgWedgePath}
              fill="rgba(30, 41, 59, 0.45)"
              stroke="rgba(71, 85, 105, 0.35)"
              strokeWidth="1"
            />

            {/* Dynamic Glowing Wedge Underlay */}
            <path
              d={activeWedgePath}
              fill={`url(#${gradientId})`}
              style={{
                filter: `blur(${glowBlur}px)`,
                opacity: Number(glowOpacity),
              }}
            />

            {/* Crisp Foreground Active Tapered Wedge */}
            <path
              d={activeWedgePath}
              fill={`url(#${gradientId})`}
              style={{
                filter: `drop-shadow(0 0 ${Math.max(2, ratio * 8)}px rgba(255, 255, 255, 0.25))`,
              }}
            />

            {/* Arc Ticks and Scale Labels */}
            {arcTicks.map((t) => (
              <g key={t.i}>
                <line
                  x1={t.innerPt.x}
                  y1={t.innerPt.y}
                  x2={t.outerPt.x}
                  y2={t.outerPt.y}
                  stroke={t.tickAngle <= activeAngle ? 'rgba(255, 255, 255, 0.85)' : 'rgba(100, 116, 139, 0.5)'}
                  strokeWidth="2"
                />
                <text
                  x={t.labelPt.x}
                  y={t.labelPt.y + 4}
                  textAnchor="middle"
                  fill={t.tickAngle <= activeAngle ? 'rgba(241, 245, 249, 0.95)' : 'rgba(148, 163, 184, 0.85)'}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {t.val}
                </text>
              </g>
            ))}

            {/* Center Numeric Speed Value */}
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              fill={customColor}
              fontSize="40"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              style={{
                filter: `drop-shadow(0 0 10px ${getAlphaColor(customColor, '60', 35)})`,
              }}
            >
              {speedVal}
            </text>
            <text
              x={cx}
              y={cy + 28}
              textAnchor="middle"
              fill="rgba(148, 163, 184, 0.8)"
              fontSize="10"
              fontWeight="bold"
              letterSpacing="1"
              fontFamily="monospace"
            >
              {unitVal.toUpperCase()}
            </text>
          </svg>
        </div>

        <div
          className="absolute inset-0 pointer-events-none rounded-2xl transition-all duration-150"
          style={{
            background: `radial-gradient(circle at center, rgba(56, 189, 248, ${
              (isDragging ? 0.15 : 0.05) + ratio * 0.15
            }) 0%, transparent 70%)`,
          }}
        />
      </div>
    );
  }

  // 3. Default 'numeric' style
  return (
    <div
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col justify-between items-center text-center shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden [container-type:size] ${baseOpacity}`}
      style={{ containerType: 'size', borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="speed"
        label={headerLabel}
        customColor={customColor}
        className="w-full"
      />

      {/* Central Interactive Numeric Speed Area with Drag-to-Adjust Speed */}
      <div
        className={`my-auto z-10 flex flex-col items-center justify-center touch-none select-none ${
          isDragging ? 'cursor-grabbing scale-[1.04] brightness-110' : 'cursor-grab hover:brightness-105'
        } transition-transform duration-100 px-4 py-2 rounded-xl`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        title="Drag up/right to increase speed, down/left to decrease"
      >
        <div
          className="font-black tracking-tighter leading-none"
          style={{
            color: customColor,
            textShadow: `0 0 25px ${getAlphaColor(customColor, '60', 35)}`,
            fontSize: 'clamp(28px, 32cqmin, 120px)',
          }}
        >
          {speedVal}
        </div>
        <div
          className="font-bold tracking-widest text-slate-400 uppercase mt-1"
          style={{ fontSize: 'clamp(9px, 5cqmin, 22px)' }}
        >
          {unitVal}
        </div>
      </div>

      <div
        className={`absolute inset-0 pointer-events-none rounded-2xl blur-xl transition-opacity duration-200 ${
          isDragging ? 'opacity-25' : 'opacity-10'
        }`}
        style={{ backgroundColor: customColor }}
      />
    </div>
  );
};
