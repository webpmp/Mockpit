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

  const cycleHeat = (seat: 'driver' | 'passenger') => {
    if (seat === 'driver') {
      const nextHeat = ((driverHeat + 1) % 4) as Level;
      setClimateState({ driverSeatHeat: nextHeat, driverSeatCool: 0, selectedSeat: 'driver' });
    } else {
      const nextHeat = ((passengerHeat + 1) % 4) as Level;
      setClimateState({ passengerSeatHeat: nextHeat, passengerSeatCool: 0, selectedSeat: 'passenger' });
    }
  };

  const cycleCool = (seat: 'driver' | 'passenger') => {
    if (seat === 'driver') {
      const nextCool = ((driverCool + 1) % 4) as Level;
      setClimateState({ driverSeatCool: nextCool, driverSeatHeat: 0, selectedSeat: 'driver' });
    } else {
      const nextCool = ((passengerCool + 1) % 4) as Level;
      setClimateState({ passengerSeatCool: nextCool, passengerSeatHeat: 0, selectedSeat: 'passenger' });
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
    const isCurrentActive = selectedSeat === seat;

    return (
      <div
        onClick={() => setClimateState({ selectedSeat: seat })}
        className={`flex-1 min-w-0 h-full bg-slate-950/60 border rounded-xl p-[3%] flex flex-col items-center justify-between gap-[2%] overflow-hidden cursor-pointer transition-all ${
          isCurrentActive
            ? 'border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
            : 'border-slate-800/80 hover:border-slate-700'
        }`}
      >
        {/* Seat Header Label */}
        <span className={`text-[clamp(12px,3.5cqw,18px)] font-mono font-bold uppercase tracking-wider shrink-0 ${
          isCurrentActive ? 'text-sky-300' : 'text-slate-300'
        }`}>
          {label}
        </span>

        {/* Seat Outline Graphic with Animated Layer Overlays */}
        <div className="relative flex-1 min-h-0 w-full max-w-[120px] max-h-[160px] aspect-[7/8] flex items-center justify-center my-auto p-1">
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

        {/* Two Separate Controls per Seat: Heat Button & Cool Button */}
        <div
          className="grid grid-cols-2 gap-2 w-full shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Heat Control Button */}
          <button
            onClick={() => cycleHeat(seat)}
            className={`h-[clamp(32px,12cqh,48px)] px-[clamp(8px,2cqw,16px)] rounded-xl border font-mono text-[clamp(12px,3.5cqw,18px)] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
              heat > 0
                ? 'bg-orange-500/20 border-orange-500/80 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Flame className={`w-[clamp(16px,4.5cqw,24px)] h-[clamp(16px,4.5cqw,24px)] shrink-0 ${heat > 0 ? 'fill-current text-orange-400' : 'text-slate-500'}`} />
            {heat > 0 && <span>{heat}</span>}
          </button>

          {/* Cool Control Button */}
          <button
            onClick={() => cycleCool(seat)}
            className={`h-[clamp(32px,12cqh,48px)] px-[clamp(8px,2cqw,16px)] rounded-xl border font-mono text-[clamp(12px,3.5cqw,18px)] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
              cool > 0
                ? 'bg-sky-500/20 border-sky-500/80 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Snowflake className={`w-[clamp(16px,4.5cqw,24px)] h-[clamp(16px,4.5cqw,24px)] shrink-0 ${cool > 0 ? 'text-sky-300' : 'text-slate-500'}`} />
            {cool > 0 && <span>{cool}</span>}
          </button>
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
