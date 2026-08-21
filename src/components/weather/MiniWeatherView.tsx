import React from 'react';
import { WeatherConditionKey } from '../../store/useWeatherStore';
import { WeatherIcon } from './WeatherIcon';

export interface MiniWeatherViewProps {
  icon: WeatherConditionKey;
  conditionLabel?: string; // Optional/legacy, not rendered in v1.6 Today card
  temperature: number;
  unit: 'F' | 'C';
  high: number;
  low: number;
  wind?: {
    speed: number;
    direction: string; // e.g. "NW"
    unit: 'mph' | 'kph';
  };
  humidity?: number;
  precipitationChance?: number;
  className?: string;
}

export const MiniWeatherView: React.FC<MiniWeatherViewProps> = ({
  icon,
  temperature,
  unit,
  high,
  low,
  wind,
  humidity,
  precipitationChance,
  className = '',
}) => {
  return (
    <div
      id="mini-weather-view"
      className={`bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between shadow-2xl transition-all duration-300 text-slate-100 ${className}`}
    >
      {/* Main Condition Icon Display */}
      <div className="my-3 flex items-center justify-center p-3 rounded-full bg-slate-950/40 border border-slate-800/60 shadow-inner">
        <WeatherIcon condition={icon} size="lg" />
      </div>

      {/* Primary Temperature Readout */}
      <div className="flex flex-col items-center">
        <div
          id="mini-weather-temperature"
          className="text-[max(3.5rem,calc(3.75rem*var(--weather-font-scale,1)))] font-black tracking-tighter text-slate-100 font-mono leading-none"
        >
          {Math.round(temperature)}°{unit}
        </div>

        {/* High / Low Temperature Pills */}
        <div
          id="mini-weather-high-low"
          className="mt-3 flex items-center gap-3 font-mono font-bold"
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

      {/* Details 3-Column Grid: Wind, Humidity, Precip */}
      <div
        id="mini-weather-details"
        className="mt-4 pt-3 border-t border-slate-800/80 w-full grid grid-cols-3 gap-3 font-mono"
      >
        <div id="mini-weather-wind" className="flex flex-col items-center gap-1">
          <span className="text-[max(0.6875rem,calc(0.6875rem*var(--weather-font-scale,1)))] text-slate-500 uppercase tracking-wide">
            Wind
          </span>
          <span className="text-[max(0.9375rem,calc(1rem*var(--weather-font-scale,1)))] text-slate-200 font-bold">
            {wind ? `${wind.direction} ${Math.round(wind.speed)} ${wind.unit.toUpperCase()}` : '—'}
          </span>
        </div>
        <div id="mini-weather-humidity" className="flex flex-col items-center gap-1">
          <span className="text-[max(0.6875rem,calc(0.6875rem*var(--weather-font-scale,1)))] text-slate-500 uppercase tracking-wide">
            Humidity
          </span>
          <span className="text-[max(0.9375rem,calc(1rem*var(--weather-font-scale,1)))] text-slate-200 font-bold">
            {humidity !== undefined ? `${Math.round(humidity)}%` : '—'}
          </span>
        </div>
        <div id="mini-weather-precip" className="flex flex-col items-center gap-1">
          <span className="text-[max(0.6875rem,calc(0.6875rem*var(--weather-font-scale,1)))] text-slate-500 uppercase tracking-wide">
            Precip
          </span>
          <span className="text-[max(0.9375rem,calc(1rem*var(--weather-font-scale,1)))] text-slate-200 font-bold">
            {precipitationChance !== undefined ? `${Math.round(precipitationChance)}%` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
