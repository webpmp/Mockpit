import React from 'react';
import { WeatherConditionKey } from '../../store/useWeatherStore';
import { WeatherIcon } from './WeatherIcon';

export interface ForecastDayCardProps {
  dayLabel: string; // e.g. "TUE"
  icon: WeatherConditionKey;
  conditionLabel: string; // e.g. "MOSTLY SUNNY"
  high: number;
  low: number;
  unit: 'F' | 'C';
  wind?: { // optional — NOT rendered by default in v1 layout per spec
    speed: number;
    direction: string;
    unit: 'mph' | 'kph';
  };
  className?: string;
}

export const ForecastDayCard: React.FC<ForecastDayCardProps> = ({
  dayLabel,
  icon,
  conditionLabel,
  high,
  low,
  // Note: wind is present in prop interface for future extensibility, but not rendered by default in v1 layout
  className = '',
}) => {
  return (
    <div
      id={`forecast-day-card-${dayLabel.toLowerCase()}`}
      className={`bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between shadow-lg text-slate-100 min-w-[120px] transition-all hover:border-slate-700 ${className}`}
    >
      {/* Day Header Label (Hard floor 16px via max()) */}
      <div
        id={`forecast-day-label-${dayLabel.toLowerCase()}`}
        className="text-[max(1rem,calc(1rem*var(--weather-font-scale,1)))] font-black font-mono tracking-wide text-slate-200 uppercase"
      >
        {dayLabel}
      </div>

      {/* Condition Icon (Bumped to 80px, capped below Today's 104px) */}
      <div className="my-2.5 flex items-center justify-center p-2 rounded-2xl bg-slate-950/40 border border-slate-800/40">
        <WeatherIcon condition={icon} size={80} />
      </div>

      {/* Condition Label (Hard floor 15px via max(), legible at all scales) */}
      <div
        id={`forecast-day-condition-${dayLabel.toLowerCase()}`}
        className="text-[max(0.9375rem,calc(0.8125rem*var(--weather-font-scale,1)))] font-extrabold uppercase font-mono tracking-tight text-slate-300 text-center min-h-7 flex items-center justify-center px-1 leading-tight"
      >
        {conditionLabel}
      </div>

      {/* High and Low Values (Unified side-by-side pill styling without H/L text) */}
      <div
        id={`forecast-day-high-low-${dayLabel.toLowerCase()}`}
        className="mt-3 flex items-center justify-center gap-2 w-full font-mono font-bold"
      >
        <span
          className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-amber-400 text-[max(1.125rem,calc(1.125rem*var(--weather-font-scale,1)))] font-bold"
          aria-label="High temperature"
        >
          {Math.round(high)}°
        </span>
        <span
          className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-sky-400 text-[max(1.125rem,calc(1.125rem*var(--weather-font-scale,1)))] font-bold"
          aria-label="Low temperature"
        >
          {Math.round(low)}°
        </span>
      </div>
    </div>
  );
};
