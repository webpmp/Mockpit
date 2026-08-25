import React from 'react';
import { WeatherConditionKey, deriveDayForecastIcon } from '../../store/useWeatherStore';
import { WeatherIcon } from './WeatherIcon';

export interface ForecastDayCardProps {
  dayLabel: string; // e.g. "WED"
  icon: WeatherConditionKey;
  conditionLabel: string; // e.g. "AM OVERCAST\nPM SUNNY"
  amCondition?: string;
  pmCondition?: string;
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
  amCondition,
  pmCondition,
  high,
  low,
  // Note: wind is present in prop interface for future extensibility, but not rendered by default in v1 layout
  className = '',
}) => {
  // Derive AM and PM lines
  let lines: string[] = [];
  if (amCondition && pmCondition) {
    lines = [`AM ${amCondition}`, `PM ${pmCondition}`];
  } else if (conditionLabel.includes('\n')) {
    lines = conditionLabel.split('\n').filter(Boolean);
  } else if (conditionLabel.includes(' / ')) {
    lines = conditionLabel.split(' / ').filter(Boolean);
  } else {
    lines = [conditionLabel];
  }

  // Derive matching display icon based on AM and PM conditions or fallback to provided icon
  const resolvedAm = amCondition || (lines[0] ? lines[0].replace(/^AM\s+/i, '') : '');
  const resolvedPm = pmCondition || (lines[1] ? lines[1].replace(/^PM\s+/i, '') : resolvedAm);
  const displayIcon: WeatherConditionKey = (resolvedAm || resolvedPm)
    ? deriveDayForecastIcon(resolvedAm, resolvedPm)
    : icon;

  return (
    <div
      id={`forecast-day-card-${dayLabel.toLowerCase()}`}
      className={`bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-2 flex flex-col items-center justify-between shadow-lg text-slate-100 min-w-0 ${className}`}
    >
      {/* Day Header Label (3x size, moved down 16px) */}
      <div
        id={`forecast-day-label-${dayLabel.toLowerCase()}`}
        className="mt-4 text-[max(2.625rem,calc(2.625rem*var(--weather-font-scale,1)))] font-black font-mono tracking-tight text-slate-200 uppercase leading-none"
      >
        {dayLabel}
      </div>

      {/* Condition Icon */}
      <div className="my-1 flex items-center justify-center p-1 rounded-xl bg-slate-950/40 border border-slate-800/40">
        <WeatherIcon condition={displayIcon} size={88} />
      </div>

      {/* Condition Label - Displays AM and PM Conditions in larger font */}
      <div
        id={`forecast-day-condition-${dayLabel.toLowerCase()}`}
        className="text-[max(1.125rem,calc(1.125rem*var(--weather-font-scale,1)))] font-black uppercase font-mono tracking-tight text-slate-200 text-center min-h-12 flex flex-col items-center justify-center px-1 leading-snug"
      >
        {lines.map((line, idx) => (
          <span key={idx} className="block whitespace-nowrap">
            {line}
          </span>
        ))}
      </div>

      {/* High and Low Values */}
      <div
        id={`forecast-day-high-low-${dayLabel.toLowerCase()}`}
        className="mt-1.5 flex items-center justify-center gap-2 w-full font-mono font-bold"
      >
        <span
          className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-amber-400 text-[max(1.25rem,calc(1.25rem*var(--weather-font-scale,1)))] font-bold leading-none"
          aria-label="High temperature"
        >
          {Math.round(high)}°
        </span>
        <span
          className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-sky-400 text-[max(1.25rem,calc(1.25rem*var(--weather-font-scale,1)))] font-bold leading-none"
          aria-label="Low temperature"
        >
          {Math.round(low)}°
        </span>
      </div>
    </div>
  );
};
