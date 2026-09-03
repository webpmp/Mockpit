import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ComponentHeader } from '../ComponentRenderer';

interface VentState {
  id: 'left' | 'center' | 'right';
  label: string;
  isOpen: boolean;
  angle: number; // 0 to 360 degrees
}

interface ClimateVentWidgetProps {
  component: any;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
}

// 8 Presets in degrees
const PRESET_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const getNearestPreset = (angle: number): number => {
  let normalized = ((angle % 360) + 360) % 360;
  let closest = PRESET_ANGLES[0];
  let minDiff = 360;

  for (const preset of PRESET_ANGLES) {
    let diff = Math.abs(normalized - preset);
    if (diff > 180) diff = 360 - diff;
    if (diff < minDiff) {
      minDiff = diff;
      closest = preset;
    }
  }
  return closest;
};

export const ClimateVentWidget: React.FC<ClimateVentWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
}) => {
  const headerLabel = resolved.label || component.staticProps?.label || 'Vent Dashboard';

  const [vents, setVents] = useState<Record<'left' | 'center' | 'right', VentState>>({
    left: { id: 'left', label: 'LEFT', isOpen: true, angle: 315 },
    center: { id: 'center', label: 'CENTER', isOpen: true, angle: 270 },
    right: { id: 'right', label: 'RIGHT', isOpen: true, angle: 225 },
  });

  const [draggingVent, setDraggingVent] = useState<'left' | 'center' | 'right' | null>(null);
  const ventRefs = {
    left: useRef<HTMLDivElement>(null),
    center: useRef<HTMLDivElement>(null),
    right: useRef<HTMLDivElement>(null),
  };

  const toggleVentOpen = (id: 'left' | 'center' | 'right') => {
    setVents((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: !prev[id].isOpen },
    }));
  };

  // Calculate vent angle based on pointer position relative to vent center
  const updateAngleFromPointer = (
    clientX: number,
    clientY: number,
    id: 'left' | 'center' | 'right',
    targetElement?: HTMLElement | null
  ) => {
    const el = targetElement || ventRefs[id].current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    setVents((prev) => ({
      ...prev,
      [id]: { ...prev[id], angle: deg },
    }));
  };

  // Pointer Down: Start directional adjustment immediately & set pointer capture
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    id: 'left' | 'center' | 'right'
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const vent = vents[id];
    if (!vent.isOpen) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback for environments with strict pointer capture handling
    }

    setDraggingVent(id);
    updateAngleFromPointer(e.clientX, e.clientY, id, e.currentTarget);
  };

  // Pointer Move: Continues tracking even if pointer leaves the circular vent
  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    id: 'left' | 'center' | 'right'
  ) => {
    if (draggingVent !== id) return;
    updateAngleFromPointer(e.clientX, e.clientY, id, ventRefs[id].current);
  };

  // Pointer Up / Cancel / LostCapture: Stop dragging & release capture
  const handlePointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    id: 'left' | 'center' | 'right'
  ) => {
    if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
    }

    if (draggingVent === id) {
      setDraggingVent(null);
      // Ease into nearest preset on release
      setVents((prev) => {
        const currentAngle = prev[id].angle;
        const preset = getNearestPreset(currentAngle);
        return {
          ...prev,
          [id]: { ...prev[id], angle: preset },
        };
      });
    }
  };

  return (
    <div
      className={`@container w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="climateVent"
        label={headerLabel}
        customColor={customColor}
      />

      {/* 3 Dashboard Vents spatially: Left, Center, Right */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-3 items-center justify-center my-auto py-1 w-full h-full">
        {(['left', 'center', 'right'] as const).map((id) => {
          const vent = vents[id];
          const isDragging = draggingVent === id;

          return (
            <div
              key={id}
              className="flex flex-col items-center justify-between gap-1.5 h-full w-full py-0.5"
            >
              {/* Dedicated On/Off Control above the circular vent */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVentOpen(id);
                }}
                className={`h-7 px-2.5 rounded-full text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer select-none inline-flex items-center justify-center gap-1.5 border shrink-0 ${
                  vent.isOpen
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-950/70 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                }`}
                style={{
                  borderColor: vent.isOpen && customColor ? `${customColor}80` : undefined,
                  color: vent.isOpen && customColor ? customColor : undefined,
                  boxShadow: vent.isOpen && customColor ? `0 0 8px ${customColor}35` : undefined,
                }}
                title={vent.isOpen ? `Turn ${vent.label} vent OFF` : `Turn ${vent.label} vent ON`}
                aria-label={vent.isOpen ? `Turn ${vent.label} vent OFF` : `Turn ${vent.label} vent ON`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                    vent.isOpen
                      ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)]'
                      : 'bg-slate-600'
                  }`}
                  style={{
                    backgroundColor: vent.isOpen && customColor ? customColor : undefined,
                    boxShadow: vent.isOpen && customColor ? `0 0 6px ${customColor}` : undefined,
                  }}
                />
                <span className="block leading-[1] relative top-px">{vent.isOpen ? 'ON' : 'OFF'}</span>
              </button>

              {/* Vent Circle Control - dedicated entirely to directional adjustment */}
              <div
                ref={ventRefs[id]}
                onPointerDown={(e) => handlePointerDown(e, id)}
                onPointerMove={(e) => handlePointerMove(e, id)}
                onPointerUp={(e) => handlePointerUp(e, id)}
                onPointerCancel={(e) => handlePointerUp(e, id)}
                onLostPointerCapture={(e) => handlePointerUp(e, id)}
                className={`w-full max-w-[105px] sm:max-w-[120px] aspect-square rounded-full border-2 flex items-center justify-center relative touch-none select-none transition-all shadow-inner ${
                  !vent.isOpen
                    ? 'bg-slate-950/90 border-slate-700 shadow-inner cursor-not-allowed'
                    : isDragging
                    ? 'bg-slate-950/95 border-slate-500 cursor-grabbing shadow-lg'
                    : 'bg-slate-950/95 border-slate-700 hover:border-slate-500 cursor-grab'
                }`}
                style={{
                  boxShadow: vent.isOpen
                    ? `0 0 12px ${customColor}25, inset 0 2px 4px rgba(0,0,0,0.8)`
                    : 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {/* Airflow Direction Arrow - Extends all the way across the diameter of the vent */}
                {vent.isOpen && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                      transform: `rotate(${vent.angle}deg)`,
                    }}
                  >
                    {/* Full-diameter background air beam */}
                    <div
                      className="w-full h-3.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-cyan-300/80 blur-[0.5px]"
                      style={{
                        background: `linear-gradient(to right, transparent 0%, ${customColor || '#22d3ee'}20 20%, ${customColor || '#22d3ee'}60 75%, ${customColor || '#22d3ee'}99 100%)`,
                      }}
                    />

                    {/* Arrow shaft spanning 100% across the full diameter */}
                    <div
                      className="absolute inset-x-0 h-1.5 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                      style={{
                        background: `linear-gradient(to right, transparent 2%, ${customColor || '#38bdf8'}40 25%, ${customColor || '#38bdf8'} 75%, #ffffff 100%)`,
                      }}
                    />

                    {/* Static glow layer across the diameter */}
                    <div
                      className="absolute inset-x-2 h-2.5 rounded-full opacity-85 shadow-[0_0_14px_rgba(34,211,238,0.9)]"
                      style={{
                        background: `linear-gradient(to right, transparent 0%, ${customColor || '#67e8f9'}50 50%, #ffffff 96%)`,
                      }}
                    />

                    {/* Full-diameter Arrowhead extending to the outer perimeter */}
                    <div
                      className="absolute right-1 w-3.5 h-3.5 border-t-[2.5px] border-r-[2.5px] border-white rotate-45 shrink-0"
                      style={{
                        filter: `drop-shadow(0 0 6px ${customColor || '#22d3ee'})`,
                      }}
                    />

                    {/* Leading directional tip glow at perimeter */}
                    <div
                      className="absolute right-1.5 w-3 h-3 rounded-full opacity-85"
                      style={{
                        backgroundColor: customColor || '#67e8f9',
                        boxShadow: `0 0 12px ${customColor || '#22d3ee'}`,
                      }}
                    />
                  </div>
                )}

                {/* Rotating Fins / Slats - Darker metallic tone with strong contrast */}
                <div
                  className="w-[60%] h-[60%] flex flex-col justify-around items-center transition-transform duration-200 pointer-events-none"
                  style={{
                    transform: vent.isOpen ? `rotate(${vent.angle}deg)` : 'rotate(0deg) scaleY(0.28)',
                  }}
                >
                  <div
                    className={`w-full h-1 rounded transition-colors shadow-sm ${vent.isOpen ? 'bg-slate-400' : 'bg-slate-500'}`}
                  />
                  <div
                    className={`w-full h-1 rounded transition-colors shadow-sm ${vent.isOpen ? 'bg-slate-400' : 'bg-slate-500'}`}
                  />
                  <div
                    className={`w-full h-1 rounded transition-colors shadow-sm ${vent.isOpen ? 'bg-slate-400' : 'bg-slate-500'}`}
                  />
                </div>
              </div>

              {/* Spatial Label */}
              <span className="text-[clamp(12px,3.5cqw,18px)] font-mono font-bold text-slate-300 uppercase tracking-wider shrink-0">
                {vent.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
