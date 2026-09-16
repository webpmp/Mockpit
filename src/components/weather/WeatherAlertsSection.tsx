import React from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Thermometer,
  Sun,
  Droplets,
  Waves,
  CloudFog,
} from 'lucide-react';
import { useWeatherAlerts } from '../../hooks/useWeatherAlerts';
import { useWeatherStore } from '../../store/useWeatherStore';
import {
  WeatherDetailCardKey,
  parseDetailCardOrder,
  isDetailCardVisible,
} from '../../types/weatherDetails';
import { WeatherAlertCard } from './WeatherAlertCard';
import { WeatherDetailCard, getUvCategory } from './WeatherDetailCard';

interface WeatherAlertsSectionProps {
  className?: string;
}

export const WeatherAlertsSection: React.FC<WeatherAlertsSectionProps> = ({
  className = '',
}) => {
  const { alerts, status, errorMessage, refetch, current } = useWeatherAlerts();

  const apparentTemp =
    current?.apparent_temperature !== undefined
      ? Math.round(current.apparent_temperature)
      : undefined;

  const rawUv = current?.uv_index;
  const uvIndex = rawUv !== undefined ? Math.round(rawUv) : undefined;
  const uvCategory = rawUv !== undefined ? getUvCategory(rawUv) : undefined;

  const dewPoint =
    current?.dew_point_2m !== undefined
      ? Math.round(current.dew_point_2m)
      : undefined;

  const pressureInHg =
    current?.surface_pressure !== undefined
      ? current.surface_pressure * 0.02953
      : undefined;

  const visibilityMiles =
    current?.visibility !== undefined
      ? current.visibility / 1609.34
      : undefined;

  const detailCardOrder = useWeatherStore((s) => s.detailCardOrder);
  const detailCardVisibility = useWeatherStore((s) => s.detailCardVisibility);

  const orderedCardKeys = parseDetailCardOrder(detailCardOrder);
  const visibleCardKeys = orderedCardKeys.filter((key) =>
    isDetailCardVisible(key, detailCardVisibility)
  );

  const renderDetailCard = (key: WeatherDetailCardKey) => {
    switch (key) {
      case 'feelsLike':
        return (
          <WeatherDetailCard
            key="feelsLike"
            id="weather-detail-feels-like"
            icon={Thermometer}
            label="Feels Like"
            value={apparentTemp !== undefined ? `${apparentTemp}°` : '--'}
          />
        );
      case 'uvIndex':
        return (
          <WeatherDetailCard
            key="uvIndex"
            id="weather-detail-uv-index"
            icon={Sun}
            label="UV Index"
            value={uvIndex !== undefined ? uvIndex : '--'}
            sub={uvCategory}
          />
        );
      case 'dewPoint':
        return (
          <WeatherDetailCard
            key="dewPoint"
            id="weather-detail-dew-point"
            icon={Droplets}
            label="Dew Point"
            value={dewPoint !== undefined ? `${dewPoint}°` : '--'}
          />
        );
      case 'pressure':
        return (
          <WeatherDetailCard
            key="pressure"
            id="weather-detail-pressure"
            icon={Waves}
            label="Pressure"
            value={pressureInHg !== undefined ? pressureInHg.toFixed(2) : '--'}
            sub="IN"
          />
        );
      case 'visibility':
        return (
          <WeatherDetailCard
            key="visibility"
            id="weather-detail-visibility"
            icon={CloudFog}
            label="Visibility"
            value={visibilityMiles !== undefined ? Math.round(visibilityMiles) : '--'}
            sub="MI"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="weather-alerts-section"
      className={`flex-1 w-full h-full flex flex-col justify-between min-h-0 overflow-hidden ${className}`}
    >
      {/* Main Content: Two Peer Cards Stacked in Shared Scroll Container */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Loading Skeleton when no cached data exists */}
        {status === 'loading' && !current && alerts.length === 0 ? (
          <div className="space-y-3 animate-pulse" id="weather-alerts-skeleton">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 flex flex-col gap-2.5">
              <div className="h-4 w-36 bg-slate-800 rounded mb-2" />
              <div
                className="grid grid-cols-5 gap-3"
              >
                <div className="h-[235px] rounded-xl bg-slate-800/50" />
                <div className="h-[235px] rounded-xl bg-slate-800/40" />
                <div className="h-[235px] rounded-xl bg-slate-800/40" />
                <div className="h-[235px] rounded-xl bg-slate-800/40" />
                <div className="h-[235px] rounded-xl bg-slate-800/40" />
              </div>
            </div>
          </div>
        ) : status === 'error' && !current ? (
          /* Error State when fetch failed and no data is present */
          <div
            id="weather-alerts-error-state"
            className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800 gap-2.5 h-full min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Weather Data Unavailable
              </h4>
              <p className="text-[11px] text-slate-400 max-w-[260px]">
                {errorMessage || 'Unable to retrieve current weather conditions.'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="mt-1 px-3 py-1 text-[11px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* Peer Card 1: Active Weather Alerts (only rendered when alerts.length > 0) */}
            {alerts.length > 0 && (
              <div
                id="weather-alerts-card"
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 flex flex-col gap-2.5 shrink-0"
              >
                <h3
                  id="weather-alerts-heading"
                  className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-200 font-mono pb-2 border-b border-slate-800/80"
                >
                  Weather Alerts
                </h3>
                {alerts.map((alert) => (
                  <WeatherAlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}

            {/* Peer Card 2: Current Observations (only rendered when at least one detail card is visible) */}
            {visibleCardKeys.length > 0 && (
              <div
                id="observations-card"
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 flex flex-col gap-2.5 shrink-0"
              >
                <h3
                  id="observations-heading"
                  className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-200 font-mono pb-2 border-b border-slate-800/80"
                >
                  Current Observations
                </h3>
                <div
                  className="grid grid-cols-5 gap-3"
                >
                  {visibleCardKeys.map((key) => renderDetailCard(key))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Attribution Row */}
      <div className="shrink-0 pt-2 flex items-center justify-end text-[10px] font-mono text-slate-600">
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-slate-400 transition-colors text-slate-600"
          title="Open-Meteo Weather Forecast API"
        >
          <span>Weather data by Open-Meteo</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};

