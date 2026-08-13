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

  // Joystick drag angle tracking
  const handlePointerMove = (e: React.PointerEvent, id: 'left' | 'center' | 'right') => {
    if (draggingVent !== id) return;
    const ref = ventRefs[id].current;
    if (!ref) return;

    const rect = ref.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    let rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    setVents((prev) => ({
      ...prev,
      [id]: { ...prev[id], angle: deg },
    }));
  };

  const handlePointerUp = (id: 'left' | 'center' | 'right') => {
    if (draggingVent === id) {
      setDraggingVent(null);
      // Ease into nearest preset on release (DECIDED)
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

          // Convert angle to flow direction vector
          const rad = (vent.angle * Math.PI) / 180;
          const flowX = Math.cos(rad) * 16;
          const flowY = Math.sin(rad) * 16;

          return (
            <div key={id} className="flex flex-col items-center justify-center gap-1.5 h-full w-full">
              {/* Vent Circle Control */}
              <div
                ref={ventRefs[id]}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (vent.isOpen) setDraggingVent(id);
                }}
                onPointerMove={(e) => handlePointerMove(e, id)}
                onPointerUp={() => handlePointerUp(id)}
                onPointerLeave={() => handlePointerUp(id)}
                className={`w-full max-w-[120px] aspect-square rounded-full border-2 flex items-center justify-center relative cursor-grab active:cursor-grabbing transition-colors shadow-inner select-none ${
                  vent.isOpen
                    ? 'bg-slate-950/90 border-slate-700 hover:border-slate-500'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-40'
                }`}
                style={{
                  boxShadow: vent.isOpen
                    ? `0 0 12px ${customColor}25, inset 0 2px 4px rgba(0,0,0,0.8)`
                    : undefined,
                }}
              >
                {/* Airflow Particles/Lines (when open) */}
                {vent.isOpen && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-full overflow-hidden flex items-center justify-center opacity-70"
                    style={{
                      transform: `rotate(${vent.angle}deg)`,
                    }}
                  >
                    <div className="w-[70%] h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse translate-x-3" />
                    <div className="w-[50%] h-0.5 bg-cyan-300 rounded-full animate-ping translate-x-4 opacity-50" />
                  </div>
                )}

                {/* Rotating Fins / Slats */}
                <div
                  className="w-[60%] h-[60%] flex flex-col justify-around items-center transition-transform duration-200 pointer-events-none"
                  style={{
                    transform: vent.isOpen ? `rotate(${vent.angle}deg)` : 'rotate(0deg) scaleY(0.15)',
                  }}
                >
                  <div
                    className={`w-full h-0.5 rounded ${vent.isOpen ? 'bg-slate-300' : 'bg-slate-600'}`}
                  />
                  <div
                    className={`w-full h-0.5 rounded ${vent.isOpen ? 'bg-slate-300' : 'bg-slate-600'}`}
                  />
                  <div
                    className={`w-full h-0.5 rounded ${vent.isOpen ? 'bg-slate-300' : 'bg-slate-600'}`}
                  />
                </div>

                {/* Center Toggle Dot (Toggles Open/Closed) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVentOpen(id);
                  }}
                  className={`w-[25%] h-[25%] max-w-5 max-h-5 rounded-full border shadow z-10 transition-transform active:scale-90 cursor-pointer ${
                    vent.isOpen
                      ? 'bg-slate-100 border-slate-400 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                      : 'bg-slate-700 border-slate-600'
                  }`}
                  style={{
                    backgroundColor: vent.isOpen ? customColor : undefined,
                  }}
                  title={vent.isOpen ? 'Click to close vent' : 'Click to open vent'}
                />
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
