import React, { useState, useEffect } from 'react';
import { useWeatherStore, WeatherDayData, WeatherConditionKey } from '../../store/useWeatherStore';
import { useMockpitStore } from '../../store/useMockpitStore';
import { MockpitInput } from '../MockpitInput';
import { MiniWeatherView } from './MiniWeatherView';
import { ForecastDayCard } from './ForecastDayCard';
import { WeatherRadarCard } from './WeatherRadarCard';
import { WeatherIcon } from './WeatherIcon';
import { isCurrentlyAM } from '../../utils/timeOfDay';
import { ChevronLeft, RotateCcw, AlertCircle } from 'lucide-react';

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
  const setUnit = useWeatherStore((s) => s.setUnit);
  const displayScale = useWeatherStore((s) => s.displayScale);
  const status = useWeatherStore((s) => s.status);
  const lastFetchedAt = useWeatherStore((s) => s.lastFetchedAt);
  const locationInput = useWeatherStore((s) => s.locationInput);
  const setLocationInput = useWeatherStore((s) => s.setLocationInput);
  const fetchWeather = useWeatherStore((s) => s.fetchWeather);
  const radarZoom = useWeatherStore((s) => s.radarZoom);
  const radarRefreshInterval = useWeatherStore((s) => s.radarRefreshInterval);
  const radarLabel = useWeatherStore((s) => s.radarLabel);

  const openKeyboard = useMockpitStore((s) => s.openKeyboard);
  const closeKeyboard = useMockpitStore((s) => s.closeKeyboard);

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editInput, setEditInput] = useState(locationInput);

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 5 * 60 * 1000); // every 5 min
    return () => clearInterval(id);
  }, []);

  // Fetch runs every time WeatherForecastScreen mounts per spec
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    setEditInput(locationInput);
  }, [locationInput]);

  useEffect(() => {
    return () => {
      if (useMockpitStore.getState().activeInputState?.inputId === 'weather-inline-location-input') {
        useMockpitStore.getState().closeKeyboard();
      }
    };
  }, []);

  const locationDisplayName = (resolvedLocation?.name || locationInput || 'San Mateo, CA').toUpperCase();
  const hasCachedData = current !== null && forecast.length > 0;
  const isErrorWithCache = status === 'error' && lastFetchedAt !== null;
  const isHardError = status === 'error' && !hasCachedData;

  const commitLocation = (valueToCommit: string) => {
    const trimmed = valueToCommit.trim();
    if (trimmed) {
      setLocationInput(trimmed);
      fetchWeather();
    }
    setIsEditingLocation(false);
    closeKeyboard();
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commitLocation(editInput);
  };

  const handleOpenLocationKeyboard = () => {
    const currentVal = locationInput || resolvedLocation?.name || 'San Mateo, CA';
    setEditInput(currentVal);
    setIsEditingLocation(true);

    openKeyboard({
      inputId: 'weather-inline-location-input',
      value: currentVal,
      placeholder: 'City, State, or Zip Code...',
      keyboardSlideDirectionOverride: 'bottom',
      onChange: (val: string) => {
        setEditInput(val);
      },
      onSubmit: (val: string) => {
        commitLocation(val);
      },
      onCancel: () => {
        setEditInput(locationInput);
        setIsEditingLocation(false);
        closeKeyboard();
      },
      onEnter: () => {
        const activeVal = useMockpitStore.getState().activeInputState?.value ?? editInput;
        commitLocation(activeVal);
      },
    });
  };

  const handleBack = () => {
    closeKeyboard();
    if (onBack) onBack();
  };

  return (
    <div
      id="weather-forecast-screen"
      style={{ '--weather-font-scale': SCALE_MULTIPLIERS[displayScale] } as React.CSSProperties}
      className={`w-full h-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none p-6 md:p-8 ${className}`}
    >
      {/* Top Header Row with >=44x44px Back Control and Location Readout */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-5 mb-6 shrink-0 relative z-50">
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
          <div className="relative z-50">
            {isEditingLocation ? (
              <form onSubmit={handleLocationSubmit} className="flex items-center gap-2 min-h-[44px] relative z-50">
                <MockpitInput
                  id="weather-inline-location-input"
                  autoFocus
                  value={editInput}
                  onChange={(val) => setEditInput(val)}
                  onSubmit={(val) => commitLocation(val)}
                  placeholder="City, State, or Zip..."
                  wrapperClassName="z-50 relative"
                  className="bg-slate-900 border border-sky-500 rounded-xl px-3 py-2 text-base font-mono text-slate-100 uppercase font-bold focus:outline-none focus:ring-1 focus:ring-sky-400 min-w-[240px]"
                />
                <button
                  id="weather-inline-save-btn"
                  type="submit"
                  className="px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-md flex items-center justify-center"
                >
                  Save
                </button>
                <button
                  id="weather-inline-cancel-btn"
                  type="button"
                  onClick={() => {
                    setEditInput(locationInput);
                    setIsEditingLocation(false);
                    closeKeyboard();
                  }}
                  className="px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                id="weather-location-heading-btn"
                type="button"
                onClick={handleOpenLocationKeyboard}
                className="min-h-[44px] min-w-[44px] flex items-center gap-2.5 text-left group cursor-pointer rounded-xl px-2 py-1 -ml-2 hover:bg-slate-900/80 transition-colors"
                title="Click to edit location"
              >
                <h1
                  id="weather-location-heading"
                  className="text-xl md:text-2xl font-black font-mono tracking-tight text-slate-100 uppercase group-hover:text-sky-400 transition-colors"
                >
                  {locationDisplayName}
                </h1>
              </button>
            )}
          </div>
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

          {/* Unit Toggle F/C */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 font-mono text-xs font-bold">
            <button
              id="weather-unit-f"
              onClick={() => setUnit('F')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                unit === 'F'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              °F
            </button>
            <button
              id="weather-unit-c"
              onClick={() => setUnit('C')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                unit === 'C'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              °C
            </button>
          </div>

          {/* Refresh Button */}
          <button
            id="weather-refresh-btn"
            onClick={() => fetchWeather()}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
            title="Refresh forecast"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
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
        /* Standard Weather Forecast Dashboard Layout */
        <div className="flex-1 flex flex-col justify-between gap-6 overflow-y-auto pr-1">
          {/* Top Section: Today Card (MiniWeatherView) + 5-Day Forecast Row + Mini Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Mini Weather View (Today Card) */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-mono mb-2">
                <span>Today</span>
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
                  className="flex-1"
                />
              )}
            </div>

            {/* Right: 5-Day Forecast Row */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-mono mb-2">
                <span>5-Day Forecast</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 flex-1">
                {forecast.map((day, idx) => (
                  <ForecastDayCard
                    key={`${day.dayLabel}-${idx}`}
                    dayLabel={day.dayLabel}
                    icon={resolveDisplayIcon(day)}
                    conditionLabel={day.conditionLabel}
                    high={day.high}
                    low={day.low}
                    unit={unit}
                    className="h-full"
                  />
                ))}
              </div>
            </div>

            {/* Radar Card (Aligned strictly to 5-day forecast column range, nothing under Today card) */}
            <div className="lg:col-start-5 lg:col-span-8 flex flex-col">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-mono mb-2">
                <span>Radar Imagery</span>
              </div>
              <WeatherRadarCard
                lat={resolvedLocation?.lat ?? 37.56299}
                lon={resolvedLocation?.lon ?? -122.32553}
                zoom={radarZoom}
                label={radarLabel}
                refreshIntervalMinutes={radarRefreshInterval}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
