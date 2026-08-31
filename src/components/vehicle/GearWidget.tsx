import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ComponentInstance, GearState } from '../../types';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ComponentHeader, DEFAULT_COMPONENT_LABELS, getAlphaColor } from '../ComponentRenderer';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';

const GEARS: GearState[] = ['P', 'R', 'N', 'D'];

interface GearWidgetProps {
  component: ComponentInstance;
  resolved?: Record<string, any>;
  isSelected?: boolean;
  isPresentation?: boolean;
  customColor?: string;
  baseOpacity?: string;
  styleOpacity?: number;
}

export const GearWidget: React.FC<GearWidgetProps> = ({
  component,
  resolved = {} as Record<string, any>,
  isSelected,
  customColor = '#38bdf8',
  baseOpacity = 'opacity-100',
  styleOpacity = 1,
}) => {
  const vehicleState = useMockpitStore((s) => s.vehicleState);
  const setVehicleState = useMockpitStore((s) => s.setVehicleState);

  const rawGear = (resolved?.text || vehicleState.gear || 'P').toUpperCase() as GearState;
  const currentGear: GearState = GEARS.includes(rawGear) ? rawGear : 'P';

  // Selection mode: activated by tapping large gear or indicator
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragHoverGear, setDragHoverGear] = useState<GearState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const selectorBarRef = useRef<HTMLDivElement>(null);

  const headerLabel = resolved?.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.gear;

  const componentWidth = component.width ?? 242;
  const componentHeight = component.height ?? 198;

  const isUltraCompact = componentHeight < 100 || componentWidth < 160;
  const isCompact = componentHeight < 140 || componentWidth < 200;

  // Auto-dismiss expanded selection state after 12 seconds of inactivity, outside click, or Escape
  useAutoDismiss({
    isOpen: isSelecting,
    onDismiss: () => {
      setIsSelecting(false);
      setDragHoverGear(null);
    },
    timeoutMs: 12000,
    containerRef,
    dismissOnEscape: true,
    dismissOnClickOutside: true,
    resetOnActivity: true,
  });

  const handleSelectGear依然 = (g: GearState, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setVehicleState({ gear: g });
    setIsSelecting(false);
    setDragHoverGear(null);
  };

  const handleSelectGear = handleSelectGear依然;

  // Direct drag/touch selection across the expanded P R N D bar
  const handleBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const barEl = selectorBarRef.current;
    if (!barEl) return;

    const getGearFromCoords地理 = (clientX: number, clientY: number) => {
      const el = document.elementFromPoint(clientX, clientY);
      const gearBtn = el?.closest('[data-gear-target]') as HTMLElement | null;
      if (gearBtn) {
        const targetGear = gearBtn.getAttribute('data-gear-target') as GearState;
        if (GEARS.includes(targetGear)) {
          setDragHoverGear(targetGear);
          return targetGear;
        }
      }
      return null;
    };

    getGearFromCoords地理(e.clientX, e.clientY);

    const onPointerMove = (moveEvent: PointerEvent) => {
      getGearFromCoords地理(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      upEvent.stopPropagation();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const finalGear = getGearFromCoords地理(upEvent.clientX, upEvent.clientY);
      if (finalGear) {
        handleSelectGear(finalGear);
      } else {
        setDragHoverGear(null);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const displayedHighlightedGear = dragHoverGear || currentGear;

  return (
    <div
      ref={containerRef}
      data-component-type="gear"
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between items-stretch shadow-lg backdrop-blur-md transition-all select-none overflow-visible ${
        isUltraCompact ? 'p-2' : isCompact ? 'p-2.5' : 'p-3.5'
      } ${baseOpacity}`}
      style={{
        borderColor: isSelected ? customColor : undefined,
        opacity: styleOpacity,
      }}
    >
      {/* 1. Header: [P icon] GEAR */}
      {!isUltraCompact && (
        <ComponentHeader
          type="gear"
          label={headerLabel}
          customColor={customColor}
        />
      )}

      {/* 2. Top Area: Stationary Compact P R N D Anchor + Downward-Extending Selector */}
      <div className="relative flex flex-col items-center justify-center my-auto shrink-0 w-full px-1 z-20">
        {/* Stationary Compact P R N D Anchor Bar (Does NOT move or jump) */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsSelecting((prev) => !prev);
          }}
          className={`flex items-center justify-between rounded-xl transition-colors duration-150 border shadow-inner select-none cursor-pointer ${
            isUltraCompact
              ? 'w-auto max-w-[125px] h-5.5 p-0.5 px-1 gap-1 bg-slate-950/70 border-slate-800/80'
              : isCompact
              ? 'w-auto max-w-[145px] h-6.5 p-1 gap-1 bg-slate-950/75 border-slate-800/85'
              : 'w-auto max-w-[160px] h-7.5 p-1 gap-1.5 bg-slate-950/80 border-slate-800/90'
          }`}
          title="Click to open gear selector"
        >
          {GEARS.map((g) => {
            const isActive = g === currentGear;
            return (
              <span
                key={g}
                className={`rounded-lg flex items-center justify-center font-black transition-all select-none ${
                  isUltraCompact
                    ? 'h-4 min-w-[16px] px-1 text-[10px]'
                    : isCompact
                    ? 'h-4.5 min-w-[18px] px-1.5 text-[11px]'
                    : 'h-5 min-w-[22px] px-1.5 text-xs'
                } ${
                  isActive
                    ? 'bg-sky-500/25 font-extrabold shadow-sm border border-sky-500/50'
                    : 'text-slate-500 border border-transparent'
                }`}
                style={isActive ? { color: customColor } : undefined}
              >
                {g}
              </span>
            );
          })}
        </div>

        {/* Temporary Expanded Selector: Animates DOWN from beneath the stationary anchor, and closes DOWNWARD +8px */}
        <AnimatePresence>
          {isSelecting && (
            <motion.div
              ref={selectorBarRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onPointerDown={handleBarPointerDown}
              onMouseDown={(e) => e.stopPropagation()}
              className={`absolute top-full mt-1.5 z-30 flex items-center justify-between rounded-xl border shadow-2xl backdrop-blur-xl select-none ${
                isUltraCompact
                  ? 'w-full max-w-[160px] h-8.5 p-1 gap-1 bg-slate-950/95 border-sky-500/80 ring-2 ring-sky-500/30'
                  : isCompact
                  ? 'w-full max-w-[190px] h-10 p-1.5 gap-1.5 bg-slate-950/95 border-sky-500/80 ring-2 ring-sky-500/30'
                  : 'w-full max-w-[215px] h-11 p-1.5 gap-2 bg-slate-950/95 border-sky-500/80 ring-2 ring-sky-500/30'
              }`}
              style={{
                borderColor: customColor,
                boxShadow: `0 0 16px ${getAlphaColor(customColor, '40', 25)}`,
              }}
            >
              {GEARS.map((g) => {
                const isActive = g === displayedHighlightedGear;
                return (
                  <button
                    key={g}
                    type="button"
                    data-gear-target={g}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handleSelectGear(g, e)}
                    className={`rounded-lg flex items-center justify-center font-black transition-all duration-150 cursor-pointer select-none flex-1 ${
                      isUltraCompact
                        ? 'h-6 text-xs'
                        : isCompact
                        ? 'h-7 text-sm'
                        : 'h-8 text-base'
                    } ${
                      isActive
                        ? 'bg-sky-500/25 font-extrabold shadow-sm border border-sky-500/50'
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                    }`}
                    style={isActive ? { color: customColor } : undefined}
                    aria-label={`Select gear ${g}`}
                  >
                    {g}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Large Center Gear Letter (Primary Visual Representation & Selector Activator) */}
      <div className="flex items-center justify-center my-auto shrink-0 z-10">
        <button
          type="button"
          aria-label={`Current gear ${currentGear}. Click to activate gear selector`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsSelecting((prev) => !prev);
          }}
          className={`flex items-center justify-center rounded-xl transition-all duration-150 select-none cursor-pointer ${
            isUltraCompact
              ? 'px-4 py-1 text-2xl'
              : isCompact
              ? 'px-5 py-1.5 text-3xl'
              : 'px-6 py-2 text-4xl'
          } ${
            isSelecting
              ? 'bg-slate-800 border-sky-500/80 ring-2 ring-sky-500/30'
              : 'bg-slate-800/70 hover:bg-slate-800 hover:border-slate-600 border-slate-700/60'
          } border shadow-md`}
          style={{
            color: customColor,
            boxShadow: `0 0 ${isSelecting ? '24px' : '16px'} ${getAlphaColor(customColor, '50', 30)}`,
          }}
          title="Click to activate gear selector"
        >
          <span className="font-black tracking-widest uppercase whitespace-nowrap">
            {currentGear}
          </span>
        </button>
      </div>
    </div>
  );
};

