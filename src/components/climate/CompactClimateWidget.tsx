import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Fan, ChevronDown, ArrowUpDown, Flame, Snowflake } from 'lucide-react';
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

type Level = 0 | 1 | 2 | 3;

const FAN_OPTIONS: ClimateFanSpeed[] = ['AUTO', 'LOW', 'MED', 'HIGH'];

const SeatIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 sm:w-5.5 sm:h-5.5' }) => (
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

  const seatOrientation: 'vertical' | 'horizontal' =
    resolved.seatOrientation || component.staticProps?.seatOrientation || 'vertical';
  const fanOrientation: 'horizontal' | 'vertical' =
    resolved.fanOrientation || component.staticProps?.fanOrientation || 'horizontal';

  // Seat Climate levels from shared store (0 - 3)
  const driverHeat = (climateState?.driverSeatHeat ?? 0) as Level;
  const driverCool = (climateState?.driverSeatCool ?? 0) as Level;
  const passengerHeat = (climateState?.passengerSeatHeat ?? 0) as Level;
  const passengerCool = (climateState?.passengerSeatCool ?? 0) as Level;

  // Active display temp: shared driverTemp in SYNC mode, selected zone in UNSYNC mode
  const activeTemp = isSynced ? driverTemp : selectedSeat === 'driver' ? driverTemp : passengerTemp;

  // Visual active zone highlights:
  // When SYNC === true: SYNC is active; neither DRIVER nor PASSENGER displays active styling
  // When SYNC === false: SYNC is inactive; selected zone displays active styling
  const isSyncActive = isSynced;
  const isDriverActive = !isSynced && selectedSeat === 'driver';
  const isPassengerActive = !isSynced && selectedSeat === 'passenger';

  // Container sizing observation for intelligent reflow layout
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: component.width ?? 374,
    height: component.height ?? 198,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setContainerSize({
        width: el.clientWidth || component.width || 374,
        height: el.clientHeight || component.height || 198,
      });
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateSize();
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [component.width, component.height]);

  // Responsive state resolution adhering to element priority hierarchy:
  // Priority 1: Temperature | 2: SYNC Button (Single source of truth) | 3: Fan Speed | 4: Seat Controls | 5: Zone Labels
  // Tested down to: 374x198, 350x190, 320x180, 300x175, 280x170, 260x165, 240x160, 220x150
  const isComfortable = containerSize.width >= 320 && containerSize.height >= 155;
  const isVeryNarrow = containerSize.width < 235 || containerSize.height < 140;

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

  // Popover state for Driver & Passenger seat climate
  const [openSeatPopover, setOpenSeatPopover] = useState<'driver' | 'passenger' | null>(null);
  const driverSeatContainerRef = useRef<HTMLDivElement>(null);
  const passengerSeatContainerRef = useRef<HTMLDivElement>(null);

  useAutoDismiss({
    isOpen: openSeatPopover === 'driver',
    onDismiss: () => setOpenSeatPopover((prev) => (prev === 'driver' ? null : prev)),
    timeoutMs: 12000,
    containerRef: driverSeatContainerRef,
    dismissOnEscape: true,
    dismissOnClickOutside: true,
    resetOnActivity: true,
  });

  useAutoDismiss({
    isOpen: openSeatPopover === 'passenger',
    onDismiss: () => setOpenSeatPopover((prev) => (prev === 'passenger' ? null : prev)),
    timeoutMs: 12000,
    containerRef: passengerSeatContainerRef,
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

  // SYNC toggle handler (exclusively cabin temperature sync - keeps activeZone decoupled)
  const handleToggleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSynced) {
      // Turning SYNC OFF defaults the active zone to DRIVER
      setClimateState({ isSynced: false, selectedSeat: 'driver' });
    } else {
      // Turning SYNC ON links temps, SYNC is the only active control (DRIVER & PASSENGER inactive)
      setClimateState({ isSynced: true, passengerTemp: driverTemp });
    }
  };

  const handleSelectDriver = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Explicitly tapping DRIVER turns off SYNC and makes DRIVER active
    setClimateState({ isSynced: false, selectedSeat: 'driver' });
  };

  const handleSelectPassenger = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Explicitly tapping PASSENGER turns off SYNC and makes PASSENGER active
    setClimateState({ isSynced: false, selectedSeat: 'passenger' });
  };

  // Direct seat climate setter with immediate mode switching, level setting, and auto-dismiss
  const handleSetSeatClimate = (seat: 'driver' | 'passenger', mode: 'heat' | 'cool', level: Level) => {
    const targetLevel = level === 0 ? 1 : level;
    if (seat === 'driver') {
      if (mode === 'heat') {
        setClimateState({ driverSeatHeat: targetLevel, driverSeatCool: 0, driverLastHeat: targetLevel, driverTargetMode: 'heat' });
      } else {
        setClimateState({ driverSeatCool: targetLevel, driverSeatHeat: 0, driverLastCool: targetLevel, driverTargetMode: 'cool' });
      }
    } else {
      if (mode === 'heat') {
        setClimateState({ passengerSeatHeat: targetLevel, passengerSeatCool: 0, passengerLastHeat: targetLevel, passengerTargetMode: 'heat' });
      } else {
        setClimateState({ passengerSeatCool: targetLevel, passengerSeatHeat: 0, passengerLastCool: targetLevel, passengerTargetMode: 'cool' });
      }
    }
    // Explicitly dismiss the popover immediately after committing the selection
    setOpenSeatPopover(null);
  };

  const handleTurnSeatOff = (seat: 'driver' | 'passenger') => {
    if (seat === 'driver') {
      setClimateState({ driverSeatHeat: 0, driverSeatCool: 0 });
    } else {
      setClimateState({ passengerSeatHeat: 0, passengerSeatCool: 0 });
    }
    // Explicitly dismiss the popover immediately after turning off
    setOpenSeatPopover(null);
  };

  // Helper for seat button styling levels
  const getSeatButtonClasses = (heat: number, cool: number, isOpen: boolean): string => {
    if (isOpen) {
      return 'bg-slate-950 border-orange-500 text-orange-300 ring-2 ring-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.3)]';
    }
    if (heat === 1 || cool === 1) {
      return 'bg-orange-500/15 border-orange-500/40 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.25)]';
    }
    if (heat === 2 || cool === 2) {
      return 'bg-orange-500/25 border-orange-500/60 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.4)] ring-1 ring-orange-500/30';
    }
    if (heat === 3 || cool === 3) {
      return 'bg-orange-500/35 border-orange-400 text-orange-200 shadow-[0_0_18px_rgba(249,115,22,0.55)] ring-1 ring-orange-400/50';
    }
    return 'bg-slate-950/50 border-slate-800/80 text-slate-500 hover:text-slate-300 hover:border-slate-700';
  };

  const renderSeatIcon = (heat: number, cool: number) => {
    const iconClass = isComfortable ? 'w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-transform' : 'w-4.5 h-4.5 shrink-0 transition-transform';
    if (heat > 0) {
      return <Flame className={`${iconClass} fill-current text-orange-400`} />;
    }
    if (cool > 0) {
      return <Snowflake className={`${iconClass} ${cool >= 2 ? 'stroke-[2.2]' : 'stroke-[1.8]'} text-orange-300`} />;
    }
    return <SeatIcon className={`${iconClass} text-slate-500`} />;
  };

  const getSeatButtonTitle = (seatLabel: string, heat: number, cool: number) => {
    const levelLabel = (lvl: number) => (lvl === 1 ? 'Low' : lvl === 2 ? 'Medium' : 'High');
    if (heat > 0) return `${seatLabel} seat climate: HEAT ${levelLabel(heat)}`;
    if (cool > 0) return `${seatLabel} seat climate: COOL ${levelLabel(cool)}`;
    return `${seatLabel} seat climate: OFF`;
  };

  const getSeatButtonAriaLabel = (seatLabel: string, heat: number, cool: number) => {
    const levelLabel = (lvl: number) => (lvl === 1 ? 'low' : lvl === 2 ? 'medium' : 'high');
    if (heat > 0) return `${seatLabel} seat heat ${levelLabel(heat)}`;
    if (cool > 0) return `${seatLabel} seat cool ${levelLabel(cool)}`;
    return `${seatLabel} seat climate off`;
  };

  const SEAT_SELECTOR_OPTIONS = [
    { type: 'heat' as const, level: 1 as Level, label: 'LOW', titleSuffix: 'low', ariaSuffix: 'low' },
    { type: 'heat' as const, level: 2 as Level, label: 'MED', titleSuffix: 'medium', ariaSuffix: 'medium' },
    { type: 'heat' as const, level: 3 as Level, label: 'HIGH', titleSuffix: 'high', ariaSuffix: 'high' },
    { type: 'off' as const, level: 0 as Level, label: 'OFF', titleSuffix: 'off', ariaSuffix: 'off' },
    { type: 'cool' as const, level: 1 as Level, label: 'LOW', titleSuffix: 'low', ariaSuffix: 'low' },
    { type: 'cool' as const, level: 2 as Level, label: 'MED', titleSuffix: 'medium', ariaSuffix: 'medium' },
    { type: 'cool' as const, level: 3 as Level, label: 'HIGH', titleSuffix: 'high', ariaSuffix: 'high' },
  ];

  const renderSeatSelector = (seat: 'driver' | 'passenger', heat: Level, cool: Level) => {
    const seatLabel = seat === 'driver' ? 'Driver' : 'Passenger';

    return (
      <AnimatePresence>
        {openSeatPopover === seat && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 p-1.5 sm:p-2 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl box-border overflow-hidden select-none flex flex-row items-center gap-1.5 sm:gap-2 w-max max-w-none whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            {SEAT_SELECTOR_OPTIONS.map((opt) => {
              let isSelected = false;
              let itemClasses = '';
              let itemTitle = '';
              let itemAriaLabel = '';
              let iconElement: React.ReactNode = null;

              if (opt.type === 'heat') {
                isSelected = heat === opt.level;
                itemTitle = `${seatLabel} seat heat ${opt.titleSuffix}`;
                itemAriaLabel = `${seatLabel} seat heat ${opt.ariaSuffix}`;
                itemClasses = isSelected
                  ? 'bg-slate-950 border-orange-500 text-orange-300 ring-2 ring-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                  : 'text-slate-400 hover:text-orange-300 hover:bg-slate-800/60 border-slate-800/80 bg-slate-900/50';
                iconElement = (
                  <>
                    <span className="font-mono text-[10.5px] sm:text-xs font-bold leading-none tracking-wider">{opt.label}</span>
                    <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? 'fill-current text-orange-400' : 'text-slate-400'}`} />
                  </>
                );
              } else if (opt.type === 'off') {
                isSelected = heat === 0 && cool === 0;
                itemTitle = `${seatLabel} seat climate off`;
                itemAriaLabel = `${seatLabel} seat climate off`;
                itemClasses = isSelected
                  ? 'bg-slate-800/90 border-slate-600 text-slate-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 border-slate-800/80 bg-slate-900/50';
                iconElement = (
                  <span className="font-mono text-[11px] sm:text-xs font-bold leading-none tracking-wider">OFF</span>
                );
              } else {
                isSelected = cool === opt.level;
                itemTitle = `${seatLabel} seat cool ${opt.titleSuffix}`;
                itemAriaLabel = `${seatLabel} seat cool ${opt.ariaSuffix}`;
                itemClasses = isSelected
                  ? 'bg-slate-950 border-orange-500 text-orange-300 ring-2 ring-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                  : 'text-slate-400 hover:text-orange-300 hover:bg-slate-800/60 border-slate-800/80 bg-slate-900/50';
                iconElement = (
                  <>
                    <span className="font-mono text-[10.5px] sm:text-xs font-bold leading-none tracking-wider">{opt.label}</span>
                    <Snowflake className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? 'text-orange-300 stroke-[2.2]' : 'text-slate-400'}`} />
                  </>
                );
              }

              return (
                <button
                  key={`${seat}-${opt.type}-${opt.type === 'off' ? 'off' : opt.level}`}
                  type="button"
                  onClick={() => {
                    if (opt.type === 'heat') {
                      handleSetSeatClimate(seat, 'heat', opt.level);
                    } else if (opt.type === 'off') {
                      handleTurnSeatOff(seat);
                    } else {
                      handleSetSeatClimate(seat, 'cool', opt.level);
                    }
                    setOpenSeatPopover(null);
                  }}
                  className={`w-12 sm:w-14 h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer select-none active:scale-95 shrink-0 box-border overflow-hidden ${itemClasses}`}
                  title={itemTitle}
                  aria-label={itemAriaLabel}
                >
                  {iconElement}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const renderFanDropdown = () => (
    <AnimatePresence>
      {isFanOpen && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute right-0 bottom-[calc(100%+6px)] z-50 p-1 rounded-xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl box-border overflow-hidden ${
            fanOrientation === 'vertical'
              ? 'flex flex-col gap-1 w-24 sm:w-28'
              : 'flex items-center gap-1'
          }`}
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
                className={`${
                  fanOrientation === 'vertical' ? 'w-full py-1.5' : 'px-2.5 py-1'
                } rounded-lg font-mono text-xs sm:text-[12.5px] font-bold tracking-wider transition-all select-none cursor-pointer whitespace-nowrap text-center ${
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
  );

  return (
    <div
      ref={containerRef}
      className={`@container w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 ${
        isComfortable ? 'p-3.5 sm:p-4' : isVeryNarrow ? 'p-2.5' : 'p-3'
      } flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative select-none ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      {/* 1. Header (Thermometer icon + title only) */}
      <ComponentHeader
        type="climate"
        label={headerLabel}
        customColor={customColor}
      />

      {/* 2. Responsive Content Layout based on Element Priority Hierarchy */}
      {isVeryNarrow ? (
        /* State 2: Very Narrow (<235px) - Stacked multi-row with crystal-clear typography */
        <div className="w-full flex-1 flex flex-col justify-between py-1 gap-2 min-w-0 max-w-full">
          {/* Row 1: Temperature, SYNC Button & Fan Selector (shared vertical centerline) */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 w-full min-w-0">
            {/* Col 1: Temperature */}
            <div className="flex items-center justify-start min-w-0">
              <div
                onPointerDown={handlePointerDownTemp}
                onPointerMove={handlePointerMoveTemp}
                onPointerUp={handlePointerUpTemp}
                onPointerCancel={handlePointerUpTemp}
                className="group flex items-center gap-1 cursor-ns-resize touch-none select-none py-0.5 px-0.5 rounded-lg hover:bg-slate-800/40 min-w-0"
                title="Drag vertically to adjust temperature"
              >
                <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-slate-200" />
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-black text-slate-100 font-mono leading-none">
                    {activeTemp}°
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">F</span>
                </div>
              </div>
            </div>

            {/* Col 2: Interactive SYNC Button (single source of truth) */}
            <div className="flex items-center justify-center justify-self-center min-w-0 z-10 shrink-0">
              <button
                type="button"
                onClick={handleToggleSync}
                className={`font-mono text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg border transition-all select-none cursor-pointer active:scale-95 whitespace-nowrap ${
                  isSynced
                    ? 'text-cyan-300 bg-cyan-500/15 border-cyan-500/35 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 bg-slate-800/70 border-slate-700/60'
                }`}
                title={isSynced ? 'Unsync cabin temperatures' : 'Sync cabin temperatures'}
                aria-label={isSynced ? 'Unsync dual-zone cabin temperature' : 'Sync dual-zone cabin temperature'}
              >
                SYNC
              </button>
            </div>

            {/* Col 3: Fan Selector */}
            <div className="flex items-center justify-end min-w-0">
              <div ref={fanContainerRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFanOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg border border-slate-800 bg-slate-950/70 text-slate-300 active:scale-95"
                  title="Fan speed selection"
                >
                  <Fan className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="font-bold">{fanSpeed}</span>
                </button>
                {renderFanDropdown()}
              </div>
            </div>
          </div>

          {/* Row 2: Driver controls */}
          <div className="w-full flex items-center justify-between min-w-0">
            <button
              type="button"
              onClick={handleSelectDriver}
              className={`font-mono text-xs font-bold uppercase py-0.5 px-2 rounded-lg transition-all ${
                isDriverActive
                  ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/35'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              DRIVER
            </button>
            <div ref={driverSeatContainerRef} className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFanOpen(false);
                  setOpenSeatPopover((prev) => (prev === 'driver' ? null : 'driver'));
                }}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 ${getSeatButtonClasses(
                  driverHeat,
                  driverCool,
                  openSeatPopover === 'driver'
                )}`}
              >
                {renderSeatIcon(driverHeat, driverCool)}
              </button>
              {renderSeatSelector('driver', driverHeat, driverCool)}
            </div>
          </div>

          {/* Row 3: Passenger controls */}
          <div className="w-full flex items-center justify-between min-w-0">
            <button
              type="button"
              onClick={handleSelectPassenger}
              className={`font-mono text-xs font-bold uppercase py-0.5 px-2 rounded-lg transition-all ${
                isPassengerActive
                  ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/35'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              PASSENGER
            </button>
            <div ref={passengerSeatContainerRef} className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFanOpen(false);
                  setOpenSeatPopover((prev) => (prev === 'passenger' ? null : 'passenger'));
                }}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 ${getSeatButtonClasses(
                  passengerHeat,
                  passengerCool,
                  openSeatPopover === 'passenger'
                )}`}
              >
                {renderSeatIcon(passengerHeat, passengerCool)}
              </button>
              {renderSeatSelector('passenger', passengerHeat, passengerCool)}
            </div>
          </div>
        </div>
      ) : (
        /* State 1: Standard / Comfortable (>=235px) */
        /* Symmetrical 2-Row Layout:
           - Row 1: [ TEMPERATURE ]    [ SYNC BUTTON ]    [ FAN SPEED ] (All sharing common vertical centerline)
           - Row 2: [ DRIVER ] [ SEAT ]                  [ SEAT ] [ PASSENGER ] (All sharing common vertical centerline)
        */
        <div className="w-full flex-1 flex flex-col justify-around min-h-0 py-1 min-w-0 max-w-full">
          {/* Row 1: [ TEMPERATURE ] [ SYNC BUTTON ] [ FAN SPEED ] */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 w-full min-w-0">
            {/* Row 1, Col 1: Dominant Draggable Temperature */}
            <div className="flex items-center justify-start min-w-0">
              <div
                onPointerDown={handlePointerDownTemp}
                onPointerMove={handlePointerMoveTemp}
                onPointerUp={handlePointerUpTemp}
                onPointerCancel={handlePointerUpTemp}
                className={`group flex items-center gap-1.5 sm:gap-2 cursor-ns-resize touch-none select-none py-0.5 px-1 -ml-1 rounded-xl transition-all duration-150 relative min-w-0 ${
                  isDraggingTemp
                    ? 'scale-[1.02] bg-cyan-500/10 ring-1 ring-cyan-400/40'
                    : 'hover:bg-slate-800/40'
                }`}
                title="Drag vertically to adjust temperature"
              >
                <ArrowUpDown
                  className={`w-4.5 h-4.5 shrink-0 transition-all duration-150 ${
                    isDraggingTemp ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <div className="flex items-baseline gap-0.5">
                  <span
                    className={`${
                      isComfortable ? 'text-4xl' : 'text-3xl'
                    } font-black tracking-tight text-slate-100 font-mono leading-none`}
                  >
                    {activeTemp}°
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-400 font-mono self-start mt-0.5">
                    F
                  </span>
                </div>
              </div>
            </div>

            {/* Row 1, Col 2: Interactive SYNC Button (Single source of truth, shared vertical centerline with temp and fan controls) */}
            <div className="flex items-center justify-center justify-self-center min-w-0 z-10 shrink-0">
              <button
                type="button"
                onClick={handleToggleSync}
                className={`font-mono text-xs sm:text-[13px] font-bold uppercase tracking-wider ${
                  isComfortable ? 'px-3 py-1.5' : 'px-2.5 py-1'
                } rounded-xl border transition-all select-none cursor-pointer active:scale-95 whitespace-nowrap ${
                  isSynced
                    ? 'text-cyan-300 bg-cyan-500/15 border-cyan-500/35 shadow-[0_0_10px_rgba(6,182,212,0.25)] hover:bg-cyan-500/25'
                    : 'text-slate-400 bg-slate-800/70 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isSynced ? 'Unsync cabin temperatures' : 'Sync cabin temperatures'}
                aria-label={isSynced ? 'Unsync dual-zone cabin temperature' : 'Sync dual-zone cabin temperature'}
              >
                SYNC
              </button>
            </div>

            {/* Row 1, Col 3: Fan Speed Selector */}
            <div className="flex items-center justify-end min-w-0">
              <div ref={fanContainerRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFanOpen((prev) => !prev);
                  }}
                  className={`flex items-center gap-1.5 text-xs sm:text-[13px] font-mono ${
                    isComfortable ? 'px-3 py-1.5' : 'px-2.5 py-1'
                  } rounded-xl border transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                    isFanOpen
                      ? 'bg-slate-950 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100'
                  }`}
                  title="Fan speed selection"
                >
                  <Fan className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${isFanOpen ? 'rotate-90 text-cyan-400' : 'text-slate-400'}`} />
                  <span className="font-bold tracking-wider whitespace-nowrap">{fanSpeed}</span>
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isFanOpen ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`} />
                </button>
                {renderFanDropdown()}
              </div>
            </div>
          </div>

          {/* Row 2: [ DRIVER ] [ SEAT ]                  [ SEAT ] [ PASSENGER ] */}
          <div className="flex items-center justify-between w-full min-w-0 max-w-full">
            {/* Left: DRIVER Group (DRIVER label + [seat] button) */}
            <div className="flex items-center justify-start gap-[clamp(4px,1.2cqw,8px)] min-w-0 shrink">
              <button
                type="button"
                id="climate-driver-zone-btn"
                onClick={handleSelectDriver}
                className={`font-mono text-xs sm:text-[13px] font-bold tracking-wider uppercase transition-all py-1 px-1.5 sm:px-2 rounded-lg cursor-pointer select-none whitespace-nowrap ${
                  isDriverActive
                    ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/35 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/40'
                }`}
                title="Select Driver cabin zone"
              >
                DRIVER
              </button>

              <div ref={driverSeatContainerRef} className="relative shrink-0">
                <button
                  type="button"
                  id="climate-driver-seat-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFanOpen(false);
                    setOpenSeatPopover((prev) => (prev === 'driver' ? null : 'driver'));
                  }}
                  className={`${
                    isComfortable ? 'w-11 h-11' : 'w-10 h-10'
                  } rounded-xl border transition-all cursor-pointer select-none active:scale-95 shrink-0 flex items-center justify-center ${getSeatButtonClasses(
                    driverHeat,
                    driverCool,
                    openSeatPopover === 'driver'
                  )}`}
                  title={getSeatButtonTitle('Driver', driverHeat, driverCool)}
                  aria-label={getSeatButtonAriaLabel('Driver', driverHeat, driverCool)}
                >
                  {renderSeatIcon(driverHeat, driverCool)}
                </button>
                {renderSeatSelector('driver', driverHeat, driverCool)}
              </div>
            </div>

            {/* Right: PASSENGER Group ([seat] button + PASSENGER label) */}
            <div className="flex items-center justify-end gap-[clamp(4px,1.2cqw,8px)] min-w-0 shrink">
              <div ref={passengerSeatContainerRef} className="relative shrink-0">
                <button
                  type="button"
                  id="climate-passenger-seat-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFanOpen(false);
                    setOpenSeatPopover((prev) => (prev === 'passenger' ? null : 'passenger'));
                  }}
                  className={`${
                    isComfortable ? 'w-11 h-11' : 'w-10 h-10'
                  } rounded-xl border transition-all cursor-pointer select-none active:scale-95 shrink-0 flex items-center justify-center ${getSeatButtonClasses(
                    passengerHeat,
                    passengerCool,
                    openSeatPopover === 'passenger'
                  )}`}
                  title={getSeatButtonTitle('Passenger', passengerHeat, passengerCool)}
                  aria-label={getSeatButtonAriaLabel('Passenger', passengerHeat, passengerCool)}
                >
                  {renderSeatIcon(passengerHeat, passengerCool)}
                </button>
                {renderSeatSelector('passenger', passengerHeat, passengerCool)}
              </div>

              <button
                type="button"
                id="climate-passenger-zone-btn"
                onClick={handleSelectPassenger}
                className={`font-mono text-xs sm:text-[13px] font-bold tracking-wider uppercase transition-all py-1 px-1.5 sm:px-2 rounded-lg cursor-pointer select-none whitespace-nowrap ${
                  isPassengerActive
                    ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/35 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/40'
                }`}
                title="Select Passenger cabin zone"
              >
                PASSENGER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

