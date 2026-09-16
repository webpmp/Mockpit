import React, { useState, useEffect } from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { useMockpitStore } from '../../store/useMockpitStore';
import { WeatherLocationControl } from './WeatherLocationControl';
import { WeatherCarousel } from './WeatherCarousel';
import { WeatherBody } from './WeatherBody';
import { RadarBody } from './RadarBody';
import { AlertCircle } from 'lucide-react';

export interface WeatherScreenShellProps {
  className?: string;
  initialIndex?: number;
}

export function WeatherScreenShell({
  className = '',
  initialIndex = 0,
}: WeatherScreenShellProps) {
  const status = useWeatherStore((s) => s.status);
  const lastFetchedAt = useWeatherStore((s) => s.lastFetchedAt);
  const radarRefreshInterval = useWeatherStore((s) => s.radarRefreshInterval);
  const fetchWeather = useWeatherStore((s) => s.fetchWeather);
  const activeView = useMockpitStore((s) => s.activeView);

  const [activeIndex, setActiveIndex] = useState(
    activeView === 'weather-radar' ? 1 : initialIndex
  );

  // Sync activeIndex when activeView switches (e.g. from inspector or dock)
  useEffect(() => {
    if (activeView === 'weather') {
      setActiveIndex(0);
    } else if (activeView === 'weather-radar') {
      setActiveIndex(1);
    }
  }, [activeView]);

  // Periodic weather fetching
  useEffect(() => {
    fetchWeather();
    const intervalMs = Math.max(1, radarRefreshInterval) * 60 * 1000;
    const interval = setInterval(fetchWeather, intervalMs);
    return () => clearInterval(interval);
  }, [fetchWeather, radarRefreshInterval]);

  const isErrorWithCache = status === 'error' && lastFetchedAt !== null;

  return (
    <div
      id="weather-screen-shell"
      className={`w-full h-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none p-5 md:p-6 rounded-3xl border border-slate-800/80 shadow-2xl ${className}`}
    >
      {/* Static Header: rendered ONCE outside the carousel, fixed throughout swipes */}
      <header
        id="weather-screen-header"
        className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-3.5 shrink-0 relative z-50"
      >
        <div className="flex items-center gap-4">
          <WeatherLocationControl headingClassName="text-xl md:text-2xl" />
        </div>

        {/* Right Header: Stale data notice if fetch error with cache */}
        {isErrorWithCache && (
          <div
            id="weather-stale-notice"
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 text-xs font-mono font-bold"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Showing last update</span>
          </div>
        )}
      </header>

      {/* Swipeable Track Area: only body content lives inside */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <WeatherCarousel
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          pages={[<WeatherBody key="weather" />, <RadarBody key="radar" />]}
        />
      </div>
    </div>
  );
}
