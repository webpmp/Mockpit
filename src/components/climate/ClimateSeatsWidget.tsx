import React from 'react';
import { Flame, Snowflake, Power } from 'lucide-react';
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

  const setSeatClimate = (seat: 'driver' | 'passenger', mode: 'heat' | 'cool', level: Level) => {
    if (seat === 'driver') {
      if (mode === 'heat') {
        const nextHeat = driverHeat === level ? 0 : level;
        setClimateState({ driverSeatHeat: nextHeat, driverSeatCool: 0, selectedSeat: 'driver' });
      } else {
        const nextCool = driverCool === level ? 0 : level;
        setClimateState({ driverSeatCool: nextCool, driverSeatHeat: 0, selectedSeat: 'driver' });
      }
    } else {
      if (mode === 'heat') {
        const nextHeat = passengerHeat === level ? 0 : level;
        setClimateState({ passengerSeatHeat: nextHeat, passengerSeatCool: 0, selectedSeat: 'passenger' });
      } else {
        const nextCool = passengerCool === level ? 0 : level;
        setClimateState({ passengerSeatCool: nextCool, passengerSeatHeat: 0, selectedSeat: 'passenger' });
      }
    }
  };

  const turnSeatOff = (seat: 'driver' | 'passenger') => {
    if (seat === 'driver') {
      setClimateState({ driverSeatHeat: 0, driverSeatCool: 0, selectedSeat: 'driver' });
    } else {
      setClimateState({ passengerSeatHeat: 0, passengerSeatCool: 0, selectedSeat: 'passenger' });
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

    return (
      <div
        onClick={() => setClimateState({ selectedSeat: seat })}
        className={`flex-1 min-w-0 h-full bg-slate-950/60 border rounded-xl p-[3%] flex flex-col items-center justify-between gap-2 overflow-hidden cursor-pointer transition-all ${
          isCurrentActive
            ? 'border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
            : 'border-slate-800/80 hover:border-slate-700'
        }`}
      >
        {/* Seat Header Label & Status */}
        <div className="w-full flex items-center justify-between px-1 shrink-0">
          <span
            className={`text-[clamp(12px,3.5cqw,18px)] font-mono font-bold uppercase tracking-wider shrink-0 ${
              isCurrentActive ? 'text-sky-300' : 'text-slate-300'
            }`}
          >
            {label}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              turnSeatOff(seat);
            }}
            disabled={isOff}
            className={`p-1 rounded-md transition-all ${
              !isOff
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer'
                : 'text-slate-700 opacity-40 cursor-not-allowed'
            }`}
            title={`${label}: Turn OFF`}
            aria-label={`${label}: Turn OFF`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Seat Outline Graphic with Animated Layer Overlays */}
        <div className="relative flex-1 min-h-0 w-full max-w-[120px] max-h-[140px] aspect-[7/8] flex items-center justify-center my-auto p-1">
          {/* SVG Outline Seat Glyph */}
          <svg
            className={`w-full h-full transition-colors ${
              isCurrentActive ? 'text-sky-500/40' : 'text-slate-700'
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

        {/* Expose BOTH Modes: HEAT (1 2 3) & COOL (1 2 3) */}
        <div
          className="w-full flex flex-col gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEAT Row: 🔥 HEAT 1 2 3 */}
          <div className="flex items-center gap-1.5 w-full bg-slate-900/80 border border-slate-800/80 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setSeatClimate(seat, 'heat', heat > 0 ? heat : 1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none ${
                isHeating
                  ? 'bg-orange-500/25 border border-orange-500/60 text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={`${label}: Toggle HEAT`}
              aria-label={`${label}: Toggle HEAT`}
            >
              <Flame className={`w-3.5 h-3.5 shrink-0 ${isHeating ? 'fill-current text-orange-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">HEAT</span>
            </button>
            <div className="flex items-center gap-1 flex-1 justify-end">
              {([1, 2, 3] as Level[]).map((lvl) => {
                const isActive = heat === lvl;
                return (
                  <button
                    key={`heat-lvl-${lvl}`}
                    type="button"
                    onClick={() => setSeatClimate(seat, 'heat', lvl)}
                    className={`flex-1 py-1 px-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer select-none text-center ${
                      isActive
                        ? 'bg-orange-500 text-slate-950 font-black shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
                    }`}
                    title={`${label} HEAT Level ${lvl}`}
                    aria-label={`${label} HEAT Level ${lvl}`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COOL Row: ❄ COOL 1 2 3 */}
          <div className="flex items-center gap-1.5 w-full bg-slate-900/80 border border-slate-800/80 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setSeatClimate(seat, 'cool', cool > 0 ? cool : 1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none ${
                isCooling
                  ? 'bg-cyan-500/25 border border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={`${label}: Toggle COOL`}
              aria-label={`${label}: Toggle COOL`}
            >
              <Snowflake className={`w-3.5 h-3.5 shrink-0 ${isCooling ? 'text-cyan-400 stroke-[2.2]' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">COOL</span>
            </button>
            <div className="flex items-center gap-1 flex-1 justify-end">
              {([1, 2, 3] as Level[]).map((lvl) => {
                const isActive = cool === lvl;
                return (
                  <button
                    key={`cool-lvl-${lvl}`}
                    type="button"
                    onClick={() => setSeatClimate(seat, 'cool', lvl)}
                    className={`flex-1 py-1 px-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer select-none text-center ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
                    }`}
                    title={`${label} COOL Level ${lvl}`}
                    aria-label={`${label} COOL Level ${lvl}`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
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
      <ComponentHeader
        type="climateSeats"
        label={headerLabel}
        customColor={customColor}
      />

      {/* Driver & Passenger Seat Cards */}
      <div className="flex-1 min-h-0 flex items-center gap-3 my-auto py-1 w-full h-full">
        {renderSeatControl('driver', 'Driver Seat', driverHeat, driverCool)}
        {renderSeatControl('passenger', 'Passenger Seat', passengerHeat, passengerCool)}
      </div>
    </div>
  );
};
