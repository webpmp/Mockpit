import React, { useState, useRef, useCallback } from 'react';
import { Fan, ChevronDown, ArrowUpDown, Link2, Unlink2, Flame, Snowflake } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ComponentHeader } from '../ComponentRenderer';
import { useMockpitStore } from '../../store/useMockpitStore';
import { useWeatherStore } from '../../store/useWeatherStore';
import { ClimateFanSpeed, ClimateSeat } from '../../types';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';

interface CompactClimateWidgetProps {
  component: any;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
}

const FAN_OPTIONS: ClimateFanSpeed[] = ['AUTO', 'LOW', 'MED', 'HIGH'];

const SeatIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={`${className} shrink-0`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 3h10a2 2 0 0 1 2 2v7H5V5a2 2 0 0 1 2-2z" />
    <path d="M4 12h16a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-2a2 2 0 0 1 2-2z" />
    <path d="M7 19v2" />
    <path d="M17 19v2" />
  </svg>
);

const getDefaultWeatherSeatMode = (): 'cool' | 'heat' => {
  try {
    const current = useWeatherStore.getState().current;
    const unit = useWeatherStore.getState().unit;
    if (current && typeof current.temperature === 'number') {
      const tempF = unit === 'C' ? (current.temperature * 9) / 5 + 32 : current.temperature;
      return tempF > 72 ? 'cool' : 'heat';
    }
  } catch {
    // fallback
  }
  return 'heat';
};

export const CompactClimateWidget: React.FC<CompactClimateWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor = '#38bdf8',
  baseOpacity,
  styleOpacity,
}) => {
  const headerLabel = resolved.label || component.staticProps?.label || 'Climate Control';

  const climateState = useMockpitStore((s) => s.climateState);
  const setClimateState = useMockpitStore((s) => s.setClimateState);

  const isSynced = climateState?.isSynced ?? true;
  const selectedSeat: ClimateSeat = climateState?.selectedSeat || 'driver';
  const driverTemp = climateState?.driverTemp ?? 72;
  const passengerTemp = climateState?.passengerTemp ?? (isSynced ? driverTemp : 72);
  const fanSpeed: ClimateFanSpeed = climateState?.fanSpeed || 'AUTO';

  // Seat Climate levels from shared store (0 - 3)
  const driverHeat = climateState?.driverSeatHeat ?? 0;
  const driverCool = climateState?.driverSeatCool ?? 0;
  const passengerHeat = climateState?.passengerSeatHeat ?? 0;
  const passengerCool = climateState?.passengerSeatCool ?? 0;

  // In SYNC mode, active display temp is the shared driverTemp.
  // In UNSYNC mode, active display temp is the currently selected zone.
  const activeTemp = isSynced ? driverTemp : selectedSeat === 'driver' ? driverTemp : passengerTemp;

  // Fan Dropdown state & auto-dismiss
  const [isFanOpen, setIsFanOpen] = useState(false);
  const fanContainerRef = useRef<HTMLDivElement>(null);

  useAutoDismiss({
    isOpen: isFanOpen,
    onDismiss: () => setIsFanOpen(false),
    timeoutMs: 12000,
    containerRef: fanContainerRef,
    dismissOnEscape: true,
    dismissOnClickOutside: true,
    resetOnActivity: true,
  });

  // Direct vertical temperature drag state
  const [isDraggingTemp, setIsDraggingTemp] = useState(false);
  const dragStartY = useRef<number>(0);
  const dragStartTemp = useRef<number>(activeTemp);

  const handlePointerDownTemp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch (_) {
        // Fallback for environments where setPointerCapture isn't supported
      }
      dragStartY.current = e.clientY;
      dragStartTemp.current = activeTemp;
      setIsDraggingTemp(true);
    },
    [activeTemp]
  );

  const handlePointerMoveTemp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingTemp) return;
      e.stopPropagation();
      e.preventDefault();

      const deltaY = dragStartY.current - e.clientY; // Upward drag increases temp
      const stepPx = 12; // 12px movement per 1°F change
      const tempDiff = Math.round(deltaY / stepPx);
      const newTemp = Math.min(85, Math.max(60, dragStartTemp.current + tempDiff));

      if (isSynced) {
        setClimateState({ driverTemp: newTemp, passengerTemp: newTemp });
      } else if (selectedSeat === 'driver') {
        setClimateState({ driverTemp: newTemp });
      } else {
        setClimateState({ passengerTemp: newTemp });
      }
    },
    [isDraggingTemp, isSynced, selectedSeat, setClimateState]
  );

  const handlePointerUpTemp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingTemp) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
      setIsDraggingTemp(false);
    }
  }, [isDraggingTemp]);

  // SYNC toggle handler
  const handleToggleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSynced) {
      // Unsync: zones become independent, preserving current temperatures
      setClimateState({ isSynced: false });
    } else {
      // Re-enable sync: use currently selected zone's temperature as shared value
      if (selectedSeat === 'passenger') {
        setClimateState({ isSynced: true, driverTemp: passengerTemp });
      } else {
        setClimateState({ isSynced: true, passengerTemp: driverTemp });
      }
    }
  };

  const handleSelectDriver = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClimateState({ selectedSeat: 'driver' });
  };

  const handleSelectPassenger = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClimateState({ selectedSeat: 'passenger' });
  };

  // Seat Climate cycle handlers (OFF -> 1 -> 2 -> 3 -> OFF, respecting weather default)
  const handleCycleDriverSeatClimate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (driverCool > 0) {
      const nextCool = (driverCool + 1) % 4;
      setClimateState({ driverSeatCool: nextCool, driverSeatHeat: 0 });
    } else if (driverHeat > 0) {
      const nextHeat = (driverHeat + 1) % 4;
      setClimateState({ driverSeatHeat: nextHeat, driverSeatCool: 0 });
    } else {
      const defaultMode = getDefaultWeatherSeatMode();
      if (defaultMode === 'cool') {
        setClimateState({ driverSeatCool: 1, driverSeatHeat: 0 });
      } else {
        setClimateState({ driverSeatHeat: 1, driverSeatCool: 0 });
      }
    }
  };

  const handleCyclePassengerSeatClimate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (passengerCool > 0) {
      const nextCool = (passengerCool + 1) % 4;
      setClimateState({ passengerSeatCool: nextCool, passengerSeatHeat: 0 });
    } else if (passengerHeat > 0) {
      const nextHeat = (passengerHeat + 1) % 4;
      setClimateState({ passengerSeatHeat: nextHeat, passengerSeatCool: 0 });
    } else {
      const defaultMode = getDefaultWeatherSeatMode();
      if (defaultMode === 'cool') {
        setClimateState({ passengerSeatCool: 1, passengerSeatHeat: 0 });
      } else {
        setClimateState({ passengerSeatHeat: 1, passengerSeatCool: 0 });
      }
    }
  };

  // Helper for seat button styling levels
  const getSeatButtonClasses = (heat: number, cool: number): string => {
    if (heat === 1) {
      return 'bg-orange-500/15 border-orange-500/40 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.25)]';
    }
    if (heat === 2) {
      return 'bg-orange-500/25 border-orange-500/60 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.4)] ring-1 ring-orange-500/30';
    }
    if (heat === 3) {
      return 'bg-orange-500/35 border-orange-400 text-orange-200 shadow-[0_0_18px_rgba(249,115,22,0.55)] ring-1 ring-orange-400/50';
    }
    if (cool === 1) {
      return 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.25)]';
    }
    if (cool === 2) {
      return 'bg-cyan-500/25 border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-500/30';
    }
    if (cool === 3) {
      return 'bg-cyan-500/35 border-cyan-400 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.55)] ring-1 ring-cyan-400/50';
    }
    return 'bg-slate-950/50 border-slate-800/80 text-slate-500 hover:text-slate-300 hover:border-slate-700';
  };

  const renderSeatIcon = (heat: number, cool: number) => {
    const iconClass = 'w-[clamp(18px,4.8cqw,22px)] h-[clamp(18px,4.8cqw,22px)] shrink-0 transition-transform';
    if (heat > 0) {
      return <Flame className={`${iconClass} fill-current`} />;
    }
    if (cool > 0) {
      return <Snowflake className={`${iconClass} ${cool >= 2 ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />;
    }
    return <SeatIcon className={`${iconClass} text-slate-500`} />;
  };

  const getSeatButtonTitle = (seatLabel: string, heat: number, cool: number) => {
    if (heat > 0) return `${seatLabel} seat: HEAT ${heat}/3 (Click to cycle)`;
    if (cool > 0) return `${seatLabel} seat: COOL ${cool}/3 (Click to cycle)`;
    return `${seatLabel} seat: OFF (Click to turn on)`;
  };

  return (
    <div
      className={`@container w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative select-none ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      {/* 1. Header (Thermometer icon + title only) */}
      <ComponentHeader
        type="climate"
        label={headerLabel}
        customColor={customColor}
      />

      {/* 2. Middle Row: Dominant Draggable Temperature + Fan Selector Dropdown */}
      <div className="flex-1 min-h-0 flex items-center justify-between gap-2 px-1 my-auto">
        {/* Dominant Draggable Temperature Target */}
        <div
          onPointerDown={handlePointerDownTemp}
          onPointerMove={handlePointerMoveTemp}
          onPointerUp={handlePointerUpTemp}
          onPointerCancel={handlePointerUpTemp}
          className={`group flex items-center gap-2 cursor-ns-resize touch-none select-none py-1 px-2 -ml-2 rounded-xl transition-all duration-150 relative ${
            isDraggingTemp
              ? 'scale-[1.02] bg-cyan-500/10 ring-1 ring-cyan-400/40'
              : 'hover:bg-slate-800/40'
          }`}
          title="Drag vertically to adjust temperature"
        >
          {/* Vertical Adjustment Icon */}
          <ArrowUpDown
            className={`w-[clamp(18px,5.5cqw,24px)] h-[clamp(18px,5.5cqw,24px)] shrink-0 transition-all duration-150 ${
              isDraggingTemp
                ? 'text-cyan-400 scale-110'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />

          {/* Primary Temperature Readout matching Speedometer / Gear typography */}
          <div className="flex items-baseline gap-1">
            <span className="text-[clamp(32px,12cqw,46px)] font-black tracking-tight text-slate-100 font-mono leading-none">
              {activeTemp}°
            </span>
            <span className="text-[clamp(13px,3.8cqw,18px)] font-bold text-slate-400 font-mono self-start mt-0.5">
              F
            </span>
          </div>

          {/* Contextual zone / sync badge */}
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 rounded ml-1">
            {isSynced ? 'SYNC' : selectedSeat.toUpperCase()}
          </span>
        </div>

        {/* Compact Fan Speed Dropdown / Selector */}
        <div ref={fanContainerRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFanOpen((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 text-[clamp(10px,3cqw,12px)] font-mono px-2.5 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer select-none active:scale-95 ${
              isFanOpen
                ? 'bg-slate-950 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100'
            }`}
            title="Fan speed selection"
          >
            <Fan className={`w-3.5 h-3.5 transition-transform duration-300 ${isFanOpen ? 'rotate-90 text-cyan-400' : 'text-slate-400'}`} />
            <span className="font-bold tracking-wider">{fanSpeed}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isFanOpen ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`} />
          </button>

          {/* Animated Fan Speed Options Dropdown (Opens Upward) */}
          <AnimatePresence>
            {isFanOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 bottom-[calc(100%+6px)] z-50 flex items-center gap-1 p-1 rounded-xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl"
              >
                {FAN_OPTIONS.map((option) => {
                  const isCurrent = fanSpeed === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClimateState({ fanSpeed: option });
                        setIsFanOpen(false);
                      }}
                      className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold tracking-wider transition-all select-none cursor-pointer whitespace-nowrap ${
                        isCurrent
                          ? 'bg-cyan-500/25 border border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
                      }`}
                      style={{
                        color: isCurrent ? customColor : undefined,
                        borderColor: isCurrent ? `${customColor}80` : undefined,
                        backgroundColor: isCurrent ? `${customColor}25` : undefined,
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Bottom Row: DRIVER [SEAT] [LINK] [SEAT] PASSENGER */}
      <div className="w-full flex items-center justify-between gap-2.5 sm:gap-4 px-1 shrink-0 select-none pt-1">
        {/* Left Side: DRIVER [SEAT] */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* DRIVER Zone Selector */}
          <button
            type="button"
            onClick={handleSelectDriver}
            className={`font-mono text-[clamp(11px,3.4cqw,13px)] font-bold tracking-wider uppercase transition-all py-1.5 px-2 rounded-lg cursor-pointer select-none ${
              !isSynced && selectedSeat === 'driver'
                ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/35 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/40'
            }`}
            title={isSynced ? 'Driver cabin zone (Linked in SYNC mode)' : 'Select Driver cabin zone'}
          >
            DRIVER
          </button>

          {/* Driver [SEAT] Interactive Seat Climate Control */}
          <button
            type="button"
            onClick={handleCycleDriverSeatClimate}
            className={`w-[clamp(32px,9cqw,38px)] h-[clamp(32px,9cqw,38px)] rounded-xl border transition-all cursor-pointer select-none active:scale-95 shrink-0 flex items-center justify-center ${getSeatButtonClasses(
              driverHeat,
              driverCool
            )}`}
            title={getSeatButtonTitle('Driver', driverHeat, driverCool)}
            aria-label="Driver seat climate"
          >
            {renderSeatIcon(driverHeat, driverCool)}
          </button>
        </div>

        {/* Center: [LINK] Synchronization Control */}
        <button
          type="button"
          onClick={handleToggleSync}
          className={`w-[clamp(32px,9cqw,38px)] h-[clamp(32px,9cqw,38px)] rounded-xl border transition-all cursor-pointer select-none active:scale-95 shrink-0 flex items-center justify-center mx-auto ${
            isSynced
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:bg-cyan-500/30'
              : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
          }`}
          title={isSynced ? 'Unsync cabin temperatures' : 'Sync cabin temperatures'}
          aria-label={isSynced ? 'Unsync dual-zone cabin temperature' : 'Sync dual-zone cabin temperature'}
        >
          {isSynced ? (
            <Link2 className="w-[clamp(18px,4.5cqw,20px)] h-[clamp(18px,4.5cqw,20px)] stroke-[2.2]" />
          ) : (
            <Unlink2 className="w-[clamp(18px,4.5cqw,20px)] h-[clamp(18px,4.5cqw,20px)] stroke-[2.2]" />
          )}
        </button>

        {/* Right Side: [SEAT] PASSENGER */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Passenger [SEAT] Interactive Seat Climate Control */}
          <button
            type="button"
            onClick={handleCyclePassengerSeatClimate}
            className={`w-[clamp(32px,9cqw,38px)] h-[clamp(32px,9cqw,38px)] rounded-xl border transition-all cursor-pointer select-none active:scale-95 shrink-0 flex items-center justify-center ${getSeatButtonClasses(
              passengerHeat,
              passengerCool
            )}`}
            title={getSeatButtonTitle('Passenger', passengerHeat, passengerCool)}
            aria-label="Passenger seat climate"
          >
            {renderSeatIcon(passengerHeat, passengerCool)}
          </button>

          {/* PASSENGER Zone Selector */}
          <button
            type="button"
            onClick={handleSelectPassenger}
            className={`font-mono text-[clamp(11px,3.4cqw,13px)] font-bold tracking-wider uppercase transition-all py-1.5 px-2 rounded-lg cursor-pointer select-none ${
              !isSynced && selectedSeat === 'passenger'
                ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/35 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/40'
            }`}
            title={isSynced ? 'Passenger cabin zone (Linked in SYNC mode)' : 'Select Passenger cabin zone'}
          >
            PASSENGER
          </button>
        </div>
      </div>
    </div>
  );
};

