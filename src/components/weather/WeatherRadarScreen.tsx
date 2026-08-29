import React from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { WeatherRadarCard } from './WeatherRadarCard';
import { WeatherLocationControl } from './WeatherLocationControl';
import { WeatherAlertsSection } from './WeatherAlertsSection';
import { ChevronLeft } from 'lucide-react';

export interface WeatherRadarScreenProps {
  onBack?: () => void;
  className?: string;
}

export const WeatherRadarScreen: React.FC<WeatherRadarScreenProps> = ({
  onBack,
  className = '',
}) => {
  const resolvedLocation = useWeatherStore((s) => s.resolvedLocation);
  const radarZoom = useWeatherStore((s) => s.radarZoom);
  const radarRefreshInterval = useWeatherStore((s) => s.radarRefreshInterval);
  const radarLabel = useWeatherStore((s) => s.radarLabel);

  const handleBack = () => {
    if (onBack) onBack();
  };

  return (
    <div
      id="weather-radar-screen"
      className={`w-full h-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none p-5 md:p-6 ${className}`}
    >
      {/* Top Header Row with Back Control and Shared Location Control */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-3.5 shrink-0 relative z-50">
        <div className="flex items-center gap-4">
          {/* Back Control (min 44x44px tap target, top-left) */}
          <button
            id="weather-radar-back-btn"
            onClick={handleBack}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 group"
            title="Return to Weather"
            aria-label="Back to Weather"
          >
            <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-slate-100 transition-colors" />
          </button>

          {/* Shared Editable Location Heading */}
          <WeatherLocationControl headingClassName="text-xl md:text-2xl" />
        </div>
      </div>

      {/* Main Content Area - 2 Columns: Bounded Radar Left + Weather Alerts Dynamic Section Right */}
      <div className="flex-1 min-h-0 w-full flex items-start gap-6">
        {/* Left: bounded radar */}
        <div className="shrink-0 h-full">
          <WeatherRadarCard
            lat={resolvedLocation?.lat ?? 37.56299}
            lon={resolvedLocation?.lon ?? -122.32553}
            zoom={radarZoom}
            label={radarLabel}
            refreshIntervalMinutes={radarRefreshInterval}
            variant="full"
          />
        </div>

        {/* Right: dynamic weather alerts and condition advisories */}
        <WeatherAlertsSection className="flex-1 w-full h-full" />
      </div>
    </div>
  );
};
