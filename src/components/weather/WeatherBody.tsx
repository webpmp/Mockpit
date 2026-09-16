import React from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { MiniWeatherView } from './MiniWeatherView';
import { ForecastDayCard } from './ForecastDayCard';
import { WeatherIcon } from './WeatherIcon';

export interface WeatherBodyProps {
  className?: string;
  key?: React.Key;
}

export const WeatherBody: React.FC<WeatherBodyProps> = ({ className = '' }) => {
  const current = useWeatherStore((s) => s.current);
  const forecast = useWeatherStore((s) => s.forecast);
  const airQuality = useWeatherStore((s) => s.airQuality);
  const sunTime = useWeatherStore((s) => s.sunTime);
  const unit = useWeatherStore((s) => s.unit);
  const status = useWeatherStore((s) => s.status);
  const locationInput = useWeatherStore((s) => s.locationInput);
  const fetchWeather = useWeatherStore((s) => s.fetchWeather);

  const hasCachedData = current !== null && forecast.length > 0;
  const isHardError = status === 'error' && !hasCachedData;

  if (isHardError) {
    return (
      <div
        id="weather-error-container"
        className={`w-full h-full flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-slate-800/60 rounded-3xl text-center select-none ${className}`}
      >
        <WeatherIcon condition="cloudy" size="lg" className="opacity-60 mb-4" />
        <h2 className="text-lg font-bold font-mono text-slate-200 uppercase tracking-wide mb-1">
          Unable to Load Weather Forecast
        </h2>
        <p className="text-xs font-mono text-slate-400 max-w-md mb-6">
          Could not retrieve data for &quot;{locationInput}&quot;. Please verify the city or zip code in the Inspector panel or retry.
        </p>
        <button
          id="weather-error-retry-btn"
          onClick={() => fetchWeather()}
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-lg"
        >
          RETRY CONNECTION
        </button>
      </div>
    );
  }

  return (
    <div
      id="weather-body"
      className={`w-full h-full flex flex-col gap-4 min-h-0 overflow-hidden select-none ${className}`}
    >
      {/* Row 1: Today as full-width element */}
      <div className="flex-[3] min-h-0 w-full">
        {current && (
          <MiniWeatherView
            icon={current.icon}
            temperature={current.temperature ?? current.high}
            unit={unit}
            high={current.high}
            low={current.low}
            wind={current.wind}
            humidity={current.humidity}
            precipitationChance={current.precipitationChance}
            airQuality={airQuality}
            sunTime={sunTime}
            className="w-full h-full min-h-0"
          />
        )}
      </div>

      {/* Row 2: 5-Day Forecast in independent 5-column grid */}
      <div
        id="forecast-row"
        className="grid grid-cols-5 gap-3 flex-1 min-h-0 items-stretch"
      >
        {forecast.map((day, idx) => (
          <ForecastDayCard
            key={`${day.dayLabel}-${idx}`}
            dayLabel={day.dayLabel}
            icon={day.icon}
            conditionLabel={day.conditionLabel}
            amCondition={day.amCondition}
            pmCondition={day.pmCondition}
            high={day.high}
            low={day.low}
            unit={unit}
            className="h-full min-h-0"
          />
        ))}
      </div>
    </div>
  );
}
