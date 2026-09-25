import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Fan, ChevronDown, ArrowUpDown } from 'lucide-react';
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
  const driverLastHeat = climateState?.driverLastHeat;
  const driverLastCool = climateState?.driverLastCool;
  const passengerLastHeat = climateState?.passengerLastHeat;
  const passengerLastCool = climateState?.passengerLastCool;

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

  const [seatPopoverPos, setSeatPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const seatPopoverElRef = useRef<HTMLDivElement | null>(null);
  const seatPopoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleSeatPopoverDismiss = useCallback((delayMs: number) => {
    if (seatPopoverTimeoutRef.current) {
      clearTimeout(seatPopoverTimeoutRef.current);
    }
    seatPopoverTimeoutRef.current = setTimeout(() => {
      setOpenSeatPopover(null);
    }, delayMs);
  }, []);

  const computeSeatPopoverPosition = useCallback(() => {
    const seat = openSeatPopover;
    if (!seat) return;
    const anchorEl = seat === 'driver' ? driverSeatContainerRef.current : passengerSeatContainerRef.current;
    if (!anchorEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const popoverH = seatPopoverElRef.current?.offsetHeight ?? 0;
    const popoverW = seatPopoverElRef.current?.offsetWidth ?? 0;
    const gap = 8;
    const viewportPad = 8;

    // Default: open above the seat button.
    let top = anchorRect.top - popoverH - gap;
    // Not enough room above (or popover not measured yet on first pass) — flip to below.
    if (top < viewportPad) {
      top = anchorRect.bottom + gap;
    }

    let left = anchorRect.left + anchorRect.width / 2 - popoverW / 2;
    left = Math.max(viewportPad, Math.min(left, window.innerWidth - popoverW - viewportPad));

    setSeatPopoverPos({ top, left });
  }, [openSeatPopover]);

  // First pass: position as soon as the popover opens (before its real size is known).
  useLayoutEffect(() => {
    if (!openSeatPopover) {
      setSeatPopoverPos(null);
      return;
    }
    computeSeatPopoverPosition();
  }, [openSeatPopover, computeSeatPopoverPosition]);

  // Second pass: re-measure once the popover has actually rendered (real width/height known),
  // and again whenever its content size could change (level/mode switch alters button count/labels).
  useLayoutEffect(() => {
    if (!openSeatPopover) return;
    computeSeatPopoverPosition();
  }, [openSeatPopover, driverHeat, driverCool, passengerHeat, passengerCool, computeSeatPopoverPosition]);

  // Keep it anchored correctly if the window resizes while open.
  useEffect(() => {
    if (!openSeatPopover) return;
    const onResize = () => computeSeatPopoverPosition();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [openSeatPopover, computeSeatPopoverPosition]);

  // Scoped auto-dismiss for portaled seat popover:
  // Detects outside interaction only if outside BOTH the anchor button container AND the portaled popover.
  // Preserves 12s inactivity timeout and Escape-key dismissal.
  useEffect(() => {
    if (!openSeatPopover) return;

    scheduleSeatPopoverDismiss(12000);

    const resetTimer = () => scheduleSeatPopoverDismiss(12000);

    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const anchorEl =
        openSeatPopover === 'driver' ? driverSeatContainerRef.current : passengerSeatContainerRef.current;
      const popoverEl = seatPopoverElRef.current;

      const isInsideAnchor = anchorEl ? anchorEl.contains(target) : false;
      const targetEl = target instanceof Element ? target : (target as Node)?.parentElement;
      const isInsidePopover = popoverEl
        ? popoverEl.contains(target) || !!targetEl?.closest?.('[data-seat-popover], [data-mockpit-popover], .seat-popover-portal')
        : !!targetEl?.closest?.('[data-seat-popover], [data-mockpit-popover], .seat-popover-portal');

      if (!isInsideAnchor && !isInsidePopover) {
        setOpenSeatPopover(null);
      } else {
        resetTimer();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenSeatPopover(null);
        return;
      }
      resetTimer();
    };

    const activityEvents = ['pointerdown', 'pointermove', 'mousedown', 'mousemove', 'touchstart', 'touchmove'];
    const onActivity = () => resetTimer();

    activityEvents.forEach((evt) => {
      document.addEventListener(evt, onActivity, { passive: true });
    });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);

    return () => {
      if (seatPopoverTimeoutRef.current) {
        clearTimeout(seatPopoverTimeoutRef.current);
        seatPopoverTimeoutRef.current = null;
      }
      activityEvents.forEach((evt) => {
        document.removeEventListener(evt, onActivity);
      });
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [openSeatPopover, scheduleSeatPopoverDismiss]);

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
    scheduleSeatPopoverDismiss(2000);
  };

  const handleTurnSeatOff = (seat: 'driver' | 'passenger') => {
    if (seat === 'driver') {
      setClimateState({ driverSeatHeat: 0, driverSeatCool: 0 });
    } else {
      setClimateState({ passengerSeatHeat: 0, passengerSeatCool: 0 });
    }
    scheduleSeatPopoverDismiss(2000);
  };

  const handleModeToggle = (seat: 'driver' | 'passenger', mode: 'heat' | 'cool') => {
    const heat = seat === 'driver' ? driverHeat : passengerHeat;
    const cool = seat === 'driver' ? driverCool : passengerCool;
    const isHeatingNow = heat > 0;
    const isCoolingNow = cool > 0;

    const rawLastHeat = seat === 'driver' ? driverLastHeat : passengerLastHeat;
    const rawLastCool = seat === 'driver' ? driverLastCool : passengerLastCool;
    const effectiveLastHeat = (rawLastHeat && rawLastHeat >= 1 && rawLastHeat <= 3 ? rawLastHeat : 2) as Level;
    const effectiveLastCool = (rawLastCool && rawLastCool >= 1 && rawLastCool <= 3 ? rawLastCool : 2) as Level;

    if (mode === 'heat') {
      if (isHeatingNow) {
        handleTurnSeatOff(seat);
      } else {
        handleSetSeatClimate(seat, 'heat', effectiveLastHeat);
      }
    } else {
      if (isCoolingNow) {
        handleTurnSeatOff(seat);
      } else {
        handleSetSeatClimate(seat, 'cool', effectiveLastCool);
      }
    }
  };

  // Helper for seat button styling levels
  const getSeatButtonClasses = (heat: number, cool: number, isOpen: boolean): string => {
    if (heat === 1) {
      return 'bg-amber-400/15 border-amber-400/40 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.25)]';
    }
    if (heat === 2) {
      return 'bg-orange-500/25 border-orange-500/60 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.4)] ring-1 ring-orange-500/30';
    }
    if (heat === 3) {
      return 'bg-orange-600/35 border-orange-500 text-orange-200 shadow-[0_0_18px_rgba(234,88,12,0.55)] ring-1 ring-orange-500/50';
    }
    if (cool === 1) {
      return 'bg-sky-300/15 border-sky-300/40 text-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.25)]';
    }
    if (cool === 2) {
      return 'bg-blue-400/25 border-blue-400/60 text-blue-300 shadow-[0_0_12px_rgba(96,165,250,0.4)] ring-1 ring-blue-400/30';
    }
    if (cool === 3) {
      return 'bg-blue-500/35 border-blue-400 text-blue-200 shadow-[0_0_18px_rgba(59,130,246,0.55)] ring-1 ring-blue-400/50';
    }
    if (isOpen) {
      return 'bg-slate-950 border-sky-500 text-sky-300 ring-2 ring-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.3)]';
    }
    return 'bg-slate-950/50 border-slate-800/80 text-slate-500 hover:text-slate-300 hover:border-slate-700';
  };

  const renderSeatIcon = () => {
    const iconClass = isComfortable ? 'w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 transition-transform' : 'w-4.5 h-4.5 shrink-0 transition-transform';
    return <SeatIcon className={iconClass} />;
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

  const renderSeatPopover = () => {
    const seat = openSeatPopover;
    if (!seat) return null;

    const heat = seat === 'driver' ? driverHeat : passengerHeat;
    const cool = seat === 'driver' ? driverCool : passengerCool;
    const seatLabel = seat === 'driver' ? 'Driver' : 'Passenger';
    const isHeating = heat > 0;
    const isCooling = cool > 0;
    const isOff = heat === 0 && cool === 0;

    const intensityClass = (lvl: Level) => {
      const isActive = !isOff && ((isHeating && heat === lvl) || (isCooling && cool === lvl));
      if (isActive) {
        if (isHeating) {
          if (lvl === 1) return 'bg-amber-400 text-slate-950 font-black shadow-[0_0_14px_rgba(251,191,36,0.5)] border border-amber-300';
          if (lvl === 2) return 'bg-orange-500 text-slate-950 font-black shadow-[0_0_14px_rgba(249,115,22,0.5)] border border-orange-400';
          return 'bg-orange-600 text-slate-950 font-black shadow-[0_0_14px_rgba(234,88,12,0.5)] border border-orange-500';
        }
        if (lvl === 1) return 'bg-sky-300 text-slate-950 font-black shadow-[0_0_14px_rgba(125,211,252,0.5)] border border-sky-200';
        if (lvl === 2) return 'bg-blue-400 text-slate-950 font-black shadow-[0_0_14px_rgba(96,165,250,0.5)] border border-blue-300';
        return 'bg-blue-500 text-slate-950 font-black shadow-[0_0_14px_rgba(59,130,246,0.5)] border border-blue-400';
      }
      return isOff
        ? 'bg-slate-950/50 text-slate-500 border border-slate-800/60'
        : 'bg-slate-950/70 text-slate-400 border border-slate-800/90';
    };

    const levelWord = (lvl: Level) => (lvl === 1 ? 'low' : lvl === 2 ? 'medium' : 'high');
    const levelLabel = (lvl: Level) => (lvl === 1 ? 'LOW' : lvl === 2 ? 'MED' : 'HIGH');
    const modeWord = isHeating ? 'heat' : 'cool';

    return createPortal(
      <AnimatePresence>
        <motion.div
          ref={seatPopoverElRef}
          key={seat}
          data-seat-popover="true"
          data-mockpit-popover="true"
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: seatPopoverPos ? 1 : 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="seat-popover-portal fixed z-[10050] p-2 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl box-border overflow-hidden select-none flex flex-row items-stretch gap-2 w-max max-w-none whitespace-nowrap"
          style={{ top: seatPopoverPos?.top ?? -9999, left: seatPopoverPos?.left ?? -9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Segmented HEAT / COOL mode control */}
          <div
            role="group"
            aria-label={`${seatLabel} seat: Climate mode`}
            className="flex items-stretch gap-0.5 p-0.5 rounded-xl bg-slate-950/70 border border-slate-800/90"
          >
            <button
              type="button"
              onClick={() => handleModeToggle(seat, 'heat')}
              className={`flex-1 min-w-[64px] flex flex-col items-center justify-center gap-2 px-3 py-2 rounded-l-[10px] rounded-r-[4px] font-mono font-bold text-[10px] sm:text-xs tracking-wider select-none cursor-pointer active:brightness-75 ${
                isHeating
                  ? 'bg-slate-950 text-orange-300 shadow-[inset_0_3px_6px_rgba(0,0,0,0.8)]'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title={isHeating ? `${seatLabel} seat: Turn HEAT OFF` : `${seatLabel} seat: Select HEAT`}
              aria-label={isHeating ? `${seatLabel} seat: Turn HEAT OFF` : `${seatLabel} seat: Select HEAT`}
            >
              <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isHeating ? 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.7)]' : 'bg-slate-700'
                }`}
              />
              HEAT
            </button>
            <button
              type="button"
              onClick={() => handleModeToggle(seat, 'cool')}
              className={`flex-1 min-w-[64px] flex flex-col items-center justify-center gap-2 px-3 py-2 rounded-r-[10px] rounded-l-[4px] font-mono font-bold text-[10px] sm:text-xs tracking-wider select-none cursor-pointer active:brightness-75 ${
                isCooling
                  ? 'bg-slate-950 text-sky-300 shadow-[inset_0_3px_6px_rgba(0,0,0,0.8)]'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title={isCooling ? `${seatLabel} seat: Turn COOL OFF` : `${seatLabel} seat: Select COOL`}
              aria-label={isCooling ? `${seatLabel} seat: Turn COOL OFF` : `${seatLabel} seat: Select COOL`}
            >
              <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isCooling ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]' : 'bg-slate-700'
                }`}
              />
              COOL
            </button>
          </div>

          {/* Single shared LOW / MED / HIGH intensity row */}
          <div className={`flex items-stretch gap-1.5 ${isOff ? 'opacity-40 pointer-events-none' : ''}`}>
            {([1, 2, 3] as Level[]).map((lvl) => (
              <button
                key={`${seat}-lvl-${lvl}`}
                type="button"
                onClick={() => handleSetSeatClimate(seat, isHeating ? 'heat' : 'cool', lvl)}
                className={`w-12 h-full rounded-xl font-mono text-xs font-bold tracking-wide cursor-pointer select-none active:scale-95 ${intensityClass(lvl)}`}
                title={`${seatLabel} seat ${modeWord} ${levelWord(lvl)}`}
                aria-label={`${seatLabel} seat ${modeWord} ${levelWord(lvl)}`}
              >
                {levelLabel(lvl)}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
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
        hidden={component.staticProps?.showHeader === 'false'}
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
                {renderSeatIcon()}
              </button>
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
                {renderSeatIcon()}
              </button>
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
                  {renderSeatIcon()}
                </button>
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
                  {renderSeatIcon()}
                </button>
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
      {renderSeatPopover()}
    </div>
  );
};

