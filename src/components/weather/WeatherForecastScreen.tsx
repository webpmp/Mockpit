import React, { useState, useEffect } from 'react';
import { useWeatherStore, WeatherDayData, WeatherConditionKey } from '../../store/useWeatherStore';
import { useMockpitStore } from '../../store/useMockpitStore';
import { MiniWeatherView } from './MiniWeatherView';
import { ForecastDayCard } from './ForecastDayCard';
import { WeatherRadarCard } from './WeatherRadarCard';
import { WeatherLocationControl } from './WeatherLocationControl';
import { WeatherIcon } from './WeatherIcon';
import { isCurrentlyAM } from '../../utils/timeOfDay';
import { ChevronLeft, AlertCircle } from 'lucide-react';

export interface WeatherForecastScreenProps {
  onBack?: () => void;
  className?: string;
}

const SCALE_MULTIPLIERS = { sm: 0.85, md: 1, lg: 1.2 };

function resolveDisplayIcon(day: WeatherDayData): WeatherConditionKey {
  if (day.amIcon && day.pmIcon) {
    return isCurrentlyAM() ? day.amIcon : day.pmIcon;
  }
  return day.icon;
}

export const WeatherForecastScreen: React.FC<WeatherForecastScreenProps> = ({
  onBack,
  className = '',
}) => {
  const current = useWeatherStore((s) => s.current);
  const forecast = useWeatherStore((s) => s.forecast);
  const resolvedLocation = useWeatherStore((s) => s.resolvedLocation);
  const unit = useWeatherStore((s) => s.unit);
  const displayScale = useWeatherStore((s) => s.displayScale);
  const status = useWeatherStore((s) => s.status);
  const lastFetchedAt = useWeatherStore((s) => s.lastFetchedAt);
  const locationInput = useWeatherStore((s) => s.locationInput);
  const fetchWeather = useWeatherStore((s) => s.fetchWeather);
  const radarZoom = useWeatherStore((s) => s.radarZoom);
  const radarRefreshInterval = useWeatherStore((s) => s.radarRefreshInterval);
  const radarLabel = useWeatherStore((s) => s.radarLabel);

  const closeKeyboard = useMockpitStore((s) => s.closeKeyboard);
  const setActiveView = useMockpitStore((s) => s.setActiveView);

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 5 * 60 * 1000); // every 5 min
    return () => clearInterval(id);
  }, []);

  // Fetch on mount and periodically on the same cadence as radarRefreshInterval
  useEffect(() => {
    fetchWeather();
    const intervalMs = Math.max(1, radarRefreshInterval) * 60 * 1000;
    const interval = setInterval(fetchWeather, intervalMs);
    return () => clearInterval(interval);
  }, [fetchWeather, radarRefreshInterval]);

  const hasCachedData = current !== null && forecast.length > 0;
  const isErrorWithCache = status === 'error' && lastFetchedAt !== null;
  const isHardError = status === 'error' && !hasCachedData;

  const handleBack = () => {
    closeKeyboard();
    if (onBack) onBack();
  };

  return (
    <div
      id="weather-forecast-screen"
      style={{ '--weather-font-scale': SCALE_MULTIPLIERS[displayScale] } as React.CSSProperties}
      className={`w-full h-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none p-5 md:p-6 ${className}`}
    >
      {/* Top Header Row with >=44x44px Back Control and Location Readout */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-3.5 shrink-0 relative z-50">
        <div className="flex items-center gap-4">
          {/* Back Control (min 44x44px tap target, top-left) */}
          <button
            id="weather-back-btn"
            onClick={handleBack}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 group"
            title="Return to previous screen"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-slate-100 transition-colors" />
          </button>

          {/* Location: Tappable inline edit and on-screen keyboard trigger */}
          <WeatherLocationControl headingClassName="text-xl md:text-2xl" />
        </div>

        {/* Right Header Status & Controls */}
        <div className="flex items-center gap-3">
          {/* Stale / Error Notice (static, non-blinking, no animate-pulse per spec) */}
          {isErrorWithCache && (
            <div
              id="weather-stale-notice"
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 text-xs font-mono font-bold"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Showing last update</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isHardError ? (
        /* Static Error State (No decorative icons beyond WeatherIcon set) */
        <div
          id="weather-error-container"
          className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-slate-800/60 rounded-3xl text-center"
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
      ) : (
        /* Standard Weather Forecast Dashboard Layout - Equal-Height Two-Row Layout */
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Row 1: Today + Radar (equal share of vertical space) */}
          <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
            <div className="col-span-5 h-full flex flex-col min-h-0">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-mono mb-1.5 shrink-0">
                Today
              </div>
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
                  className="flex-1 min-h-0"
                />
              )}
            </div>

            <div className="col-span-7 h-full flex flex-col min-h-0">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-mono mb-1.5 shrink-0">
                Radar Imagery
              </div>
              <WeatherRadarCard
                lat={resolvedLocation?.lat ?? 37.56299}
                lon={resolvedLocation?.lon ?? -122.32553}
                zoom={radarZoom}
                label={radarLabel}
                refreshIntervalMinutes={radarRefreshInterval}
                className="flex-1 min-h-0"
                onExpand={() => setActiveView('weather-radar')}
                variant="compact"
                sizeMode="height"
              />
            </div>
          </div>

          {/* Row 2: 5-Day Forecast (equal share of vertical space) */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-mono mb-1.5 shrink-0">
              5-Day Forecast
            </div>
            <div className="grid grid-cols-5 gap-[10px] flex-1 min-h-0" style={{ gap: '10px' }}>
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
        </div>
      )}
    </div>
  );
};
