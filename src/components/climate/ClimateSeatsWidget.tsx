import React from 'react';
import { Flame, Snowflake } from 'lucide-react';
import { ComponentHeader } from '../ComponentRenderer';
import { useMockpitStore } from '../../store/useMockpitStore';

type Level = 0 | 1 | 2 | 3;

interface ClimateSeatsWidgetProps {
  component: any;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
}

export const ClimateSeatsWidget: React.FC<ClimateSeatsWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
}) => {
  const headerLabel = resolved.label || component.staticProps?.label || 'Seat Climate';

  const climateState = useMockpitStore((s) => s.climateState);
  const setClimateState = useMockpitStore((s) => s.setClimateState);

  const driverHeat = (climateState?.driverSeatHeat ?? 0) as Level;
  const driverCool = (climateState?.driverSeatCool ?? 0) as Level;
  const passengerHeat = (climateState?.passengerSeatHeat ?? 0) as Level;
  const passengerCool = (climateState?.passengerSeatCool ?? 0) as Level;
  const selectedSeat = climateState?.selectedSeat || 'driver';

  const driverLastHeat = (climateState?.driverLastHeat ?? (driverHeat > 0 ? driverHeat : 2)) as Level;
  const driverLastCool = (climateState?.driverLastCool ?? (driverCool > 0 ? driverCool : 2)) as Level;
  const passengerLastHeat = (climateState?.passengerLastHeat ?? (passengerHeat > 0 ? passengerHeat : 2)) as Level;
  const passengerLastCool = (climateState?.passengerLastCool ?? (passengerCool > 0 ? passengerCool : 2)) as Level;

  const driverTargetMode = climateState?.driverTargetMode || (driverCool > 0 ? 'cool' : 'heat');
  const passengerTargetMode = climateState?.passengerTargetMode || (passengerCool > 0 ? 'cool' : 'heat');

  const handleModeToggle = (seat: 'driver' | 'passenger', mode: 'heat' | 'cool') => {
    const heat = seat === 'driver' ? driverHeat : passengerHeat;
    const cool = seat === 'driver' ? driverCool : passengerCool;
    const isHeating = heat > 0;
    const isCooling = cool > 0;

    const rawLastHeat = seat === 'driver' ? driverLastHeat : passengerLastHeat;
    const rawLastCool = seat === 'driver' ? driverLastCool : passengerLastCool;
    const effectiveLastHeat = (rawLastHeat >= 1 && rawLastHeat <= 3 ? rawLastHeat : 2) as Level;
    const effectiveLastCool = (rawLastCool >= 1 && rawLastCool <= 3 ? rawLastCool : 2) as Level;

    if (mode === 'heat') {
      if (isHeating) {
        // Tap HEAT while HEAT active -> turn OFF (preserve heat setting & mode)
        if (seat === 'driver') {
          setClimateState({ driverSeatHeat: 0, driverSeatCool: 0, driverTargetMode: 'heat', selectedSeat: 'driver' });
        } else {
          setClimateState({ passengerSeatHeat: 0, passengerSeatCool: 0, passengerTargetMode: 'heat', selectedSeat: 'passenger' });
        }
      } else {
        // Was OFF or was COOL -> turn HEAT ON using preserved heat intensity
        if (seat === 'driver') {
          setClimateState({
            driverSeatHeat: effectiveLastHeat,
            driverSeatCool: 0,
            driverLastHeat: effectiveLastHeat,
            driverTargetMode: 'heat',
            selectedSeat: 'driver',
          });
        } else {
          setClimateState({
            passengerSeatHeat: effectiveLastHeat,
            passengerSeatCool: 0,
            passengerLastHeat: effectiveLastHeat,
            passengerTargetMode: 'heat',
            selectedSeat: 'passenger',
          });
        }
      }
    } else {
      // mode === 'cool'
      if (isCooling) {
        // Tap COOL while COOL active -> turn OFF (preserve cool setting & mode)
        if (seat === 'driver') {
          setClimateState({ driverSeatHeat: 0, driverSeatCool: 0, driverTargetMode: 'cool', selectedSeat: 'driver' });
        } else {
          setClimateState({ passengerSeatHeat: 0, passengerSeatCool: 0, passengerTargetMode: 'cool', selectedSeat: 'passenger' });
        }
      } else {
        // Was OFF or was HEAT -> turn COOL ON using preserved cool intensity
        if (seat === 'driver') {
          setClimateState({
            driverSeatCool: effectiveLastCool,
            driverSeatHeat: 0,
            driverLastCool: effectiveLastCool,
            driverTargetMode: 'cool',
            selectedSeat: 'driver',
          });
        } else {
          setClimateState({
            passengerSeatCool: effectiveLastCool,
            passengerSeatHeat: 0,
            passengerLastCool: effectiveLastCool,
            passengerTargetMode: 'cool',
            selectedSeat: 'passenger',
          });
        }
      }
    }
  };

  const handleIntensityClick = (seat: 'driver' | 'passenger', lvl: Level) => {
    const heat = seat === 'driver' ? driverHeat : passengerHeat;
    const cool = seat === 'driver' ? driverCool : passengerCool;
    const isHeating = heat > 0;
    const isCooling = cool > 0;
    const targetMode = seat === 'driver' ? driverTargetMode : passengerTargetMode;

    if (isHeating) {
      if (seat === 'driver') {
        setClimateState({ driverSeatHeat: lvl, driverLastHeat: lvl, selectedSeat: 'driver' });
      } else {
        setClimateState({ passengerSeatHeat: lvl, passengerLastHeat: lvl, selectedSeat: 'passenger' });
      }
    } else if (isCooling) {
      if (seat === 'driver') {
        setClimateState({ driverSeatCool: lvl, driverLastCool: lvl, selectedSeat: 'driver' });
      } else {
        setClimateState({ passengerSeatCool: lvl, passengerLastCool: lvl, selectedSeat: 'passenger' });
      }
    } else {
      // When OFF: update stored intensity for the target mode without turning on
      if (targetMode === 'heat') {
        if (seat === 'driver') {
          setClimateState({ driverLastHeat: lvl, selectedSeat: 'driver' });
        } else {
          setClimateState({ passengerLastHeat: lvl, selectedSeat: 'passenger' });
        }
      } else {
        if (seat === 'driver') {
          setClimateState({ driverLastCool: lvl, selectedSeat: 'driver' });
        } else {
          setClimateState({ passengerLastCool: lvl, selectedSeat: 'passenger' });
        }
      }
    }
  };

  const renderSeatControl = (
    seat: 'driver' | 'passenger',
    label: string,
    heat: Level,
    cool: Level
  ) => {
    const isHeating = heat > 0;
    const isCooling = cool > 0;
    const isOff = heat === 0 && cool === 0;
    const isCurrentActive = selectedSeat === seat;

    const targetMode = isHeating
      ? 'heat'
      : isCooling
      ? 'cool'
      : seat === 'driver'
      ? driverTargetMode
      : passengerTargetMode;

    const rawLastHeat = seat === 'driver' ? driverLastHeat : passengerLastHeat;
    const rawLastCool = seat === 'driver' ? driverLastCool : passengerLastCool;
    const currentStoredLvl = targetMode === 'heat' ? (isHeating ? heat : rawLastHeat) : (isCooling ? cool : rawLastCool);

    return (
      <div
        onClick={() => setClimateState({ selectedSeat: seat })}
        className={`flex-1 min-w-0 h-full bg-slate-950/60 border rounded-xl p-[3%] flex flex-col items-center justify-between gap-2 overflow-hidden cursor-pointer transition-all ${
          isCurrentActive
            ? 'border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
            : 'border-slate-800/80 hover:border-slate-700'
        }`}
      >
        {/* Seat Header Label */}
        <div className="w-full flex items-center px-1 shrink-0">
          <span
            className={`text-[clamp(12px,3.5cqw,18px)] font-mono font-bold uppercase tracking-wider truncate ${
              isCurrentActive ? 'text-sky-300' : 'text-slate-300'
            }`}
          >
            {label}
          </span>
        </div>

        {/* Seat Outline Graphic with Animated Layer Overlays */}
        <div className="relative flex-1 min-h-0 w-full max-w-[130px] max-h-[140px] aspect-[7/8] flex items-center justify-center my-auto p-1 shrink">
          {/* SVG Outline Seat Glyph */}
          <svg
            className={`w-full h-full transition-colors ${
              isHeating
                ? 'text-orange-500/40'
                : isCooling
                ? 'text-cyan-500/40'
                : isCurrentActive
                ? 'text-sky-500/30'
                : 'text-slate-700'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Seat Backrest & Cushion */}
            <path d="M7 3h10a2 2 0 0 1 2 2v7H5V5a2 2 0 0 1 2-2z" />
            <path d="M4 12h16a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-2a2 2 0 0 1 2-2z" />
            <path d="M7 19v2" />
            <path d="M17 19v2" />
          </svg>

          {/* Heating Flame Overlay Layer */}
          {isHeating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 animate-pulse pointer-events-none">
              {Array.from({ length: heat }).map((_, i) => (
                <Flame
                  key={`h-${i}`}
                  className={`w-[25%] h-[25%] max-w-6 max-h-6 fill-current ${
                    heat === 1
                      ? 'text-amber-400'
                      : heat === 2
                      ? 'text-orange-500'
                      : 'text-red-500 animate-bounce'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Cooling Snowflake Overlay Layer */}
          {isCooling && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
              {Array.from({ length: cool }).map((_, i) => (
                <Snowflake
                  key={`c-${i}`}
                  className={`w-[25%] h-[25%] max-w-6 max-h-6 ${
                    cool === 1
                      ? 'text-sky-300'
                      : cool === 2
                      ? 'text-cyan-400'
                      : 'text-blue-500 animate-spin'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Combined Single Control Row: [ 🔥 HEAT ] [ ❄ COOL ]  [ LOW ] [ MED ] [ HIGH ] */}
        <div
          className="w-full flex items-stretch gap-2 min-h-[52px] sm:min-h-[64px] max-h-[96px] flex-1 max-h-[35%]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Distinct HEAT Button */}
          <button
            type="button"
            onClick={() => handleModeToggle(seat, 'heat')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer select-none shrink-0 ${
              isHeating
                ? 'bg-orange-500/25 border border-orange-500/70 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.35)]'
                : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/90'
            }`}
            title={isHeating ? `${label}: Turn HEAT OFF` : `${label}: Select HEAT`}
            aria-label={isHeating ? `${label}: Turn HEAT OFF` : `${label}: Select HEAT`}
          >
            <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isHeating ? 'fill-current text-orange-400' : 'text-slate-400'}`} />
            <span className="text-[10px] sm:text-xs tracking-wider">HEAT</span>
          </button>

          {/* Distinct COOL Button */}
          <button
            type="button"
            onClick={() => handleModeToggle(seat, 'cool')}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer select-none shrink-0 ${
              isCooling
                ? 'bg-cyan-500/25 border border-cyan-500/70 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/90'
            }`}
            title={isCooling ? `${label}: Turn COOL OFF` : `${label}: Select COOL`}
            aria-label={isCooling ? `${label}: Turn COOL OFF` : `${label}: Select COOL`}
          >
            <Snowflake className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isCooling ? 'text-cyan-400 stroke-[2.2]' : 'text-slate-400'}`} />
            <span className="text-[10px] sm:text-xs tracking-wider">COOL</span>
          </button>

          {/* LOW / MED / HIGH Contextual Intensity Controls - Taller, Prominent & Near Square */}
          <div className="flex items-stretch gap-1.5 sm:gap-2 flex-1 min-w-0">
            {(
              [
                { lvl: 1 as Level, text: 'LOW', word: 'Low' },
                { lvl: 2 as Level, text: 'MED', word: 'Medium' },
                { lvl: 3 as Level, word: 'High', text: 'HIGH' },
              ] as const
            ).map(({ lvl, text, word }) => {
              const isIntensityActive = !isOff && ((isHeating && heat === lvl) || (isCooling && cool === lvl));
              const modeWord = isHeating ? 'Heat' : isCooling ? 'Cool' : targetMode === 'heat' ? 'Heat' : 'Cool';

              let buttonStyle = 'bg-slate-950/50 text-slate-500 hover:text-slate-300 hover:bg-slate-900/80 border border-slate-800/60';
              if (isIntensityActive) {
                if (isHeating) {
                  buttonStyle = 'bg-orange-500 text-slate-950 font-black shadow-[0_0_14px_rgba(249,115,22,0.5)] border border-orange-400';
                } else if (isCooling) {
                  buttonStyle = 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_14px_rgba(6,182,212,0.5)] border border-cyan-300';
                }
              } else if (!isOff) {
                buttonStyle = 'bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-slate-800/90';
              }

              return (
                <button
                  key={`seat-${seat}-lvl-${lvl}`}
                  type="button"
                  onClick={() => handleIntensityClick(seat, lvl)}
                  className={`flex-1 h-full min-w-0 flex items-center justify-center rounded-xl font-mono text-xs sm:text-sm md:text-base font-bold tracking-wide transition-all cursor-pointer select-none active:scale-95 shadow-sm ${buttonStyle}`}
                  title={`${label} ${modeWord} ${word}`}
                  aria-label={`${label} ${modeWord} ${word}`}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`@container w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      {/* Component Title Header */}
      <ComponentHeader
        type="climateSeats"
        label={headerLabel}
        customColor={customColor}
      />

      {/* Main Dual-Seat Climate Area */}
      <div className="flex-1 w-full flex items-stretch gap-3 mt-2 min-h-0">
        {renderSeatControl('driver', 'Driver Seat', driverHeat, driverCool)}
        {renderSeatControl('passenger', 'Passenger Seat', passengerHeat, passengerCool)}
      </div>
    </div>
  );
};
