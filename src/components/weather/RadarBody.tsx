import React from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { WeatherRadarCard } from './WeatherRadarCard';
import { WeatherAlertsSection } from './WeatherAlertsSection';

export interface RadarBodyProps {
  className?: string;
  key?: React.Key;
}

export const RadarBody: React.FC<RadarBodyProps> = ({ className = '' }) => {
  const resolvedLocation = useWeatherStore((s) => s.resolvedLocation);
  const radarZoom = useWeatherStore((s) => s.radarZoom);
  const radarRefreshInterval = useWeatherStore((s) => s.radarRefreshInterval);
  const radarLabel = useWeatherStore((s) => s.radarLabel);

  return (
    <div
      id="radar-body"
      className={`w-full h-full flex items-start gap-6 min-h-0 overflow-hidden select-none ${className}`}
    >
      {/* Left: bounded radar card */}
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
  );
}
