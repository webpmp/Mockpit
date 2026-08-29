import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useWeatherAlerts } from '../../hooks/useWeatherAlerts';
import { WeatherAlertCard } from './WeatherAlertCard';

interface WeatherAlertsSectionProps {
  className?: string;
}

export const WeatherAlertsSection: React.FC<WeatherAlertsSectionProps> = ({
  className = '',
}) => {
  const { alerts, status, errorMessage, refetch } = useWeatherAlerts();

  return (
    <div
      id="weather-alerts-section"
      className={`flex-1 w-full h-full rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-xl ${className}`}
    >
      {/* Top Header Row */}
      <div className="shrink-0 mb-3.5">
        <div className="pb-2.5 border-b border-slate-800/80">
          <h3
            id="weather-alerts-heading"
            className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-200 font-mono"
          >
            Weather Alerts
          </h3>
        </div>
      </div>

      {/* Main Alert Content List / States */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
        {/* Loading Skeleton */}
        {status === 'loading' && alerts.length === 0 && (
          <div className="space-y-3 animate-pulse" id="weather-alerts-skeleton">
            <div className="h-20 rounded-xl bg-slate-800/60 border border-slate-800" />
            <div className="h-20 rounded-xl bg-slate-800/40 border border-slate-800" />
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div
            id="weather-alerts-error-state"
            className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800 gap-2.5 h-full min-h-[140px]"
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
        )}

        {/* Empty State: Normal Conditions */}
        {status === 'success' && alerts.length === 0 && (
          <div
            id="weather-alerts-empty-state"
            className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/80 gap-3 h-full min-h-[160px]"
          >
            <div className="w-11 h-11 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.15)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-200">
                No Significant Weather Alerts
              </h4>
            </div>
          </div>
        )}

        {/* Active Alerts List */}
        {alerts.length > 0 && (
          <div className="space-y-2.5" id="weather-alerts-list">
            {alerts.map((alert) => (
              <WeatherAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Attribution Row */}
      <div className="shrink-0 pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-end text-[10px] font-mono text-slate-600">
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
