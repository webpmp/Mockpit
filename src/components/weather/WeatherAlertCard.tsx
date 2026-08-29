import React from 'react';
import {
  Wind,
  CloudRain,
  Snowflake,
  CloudLightning,
  CloudFog,
  Cloudy,
  Cloud,
  Haze,
  Sun,
  SunMedium,
  ThermometerSun,
  ThermometerSnowflake,
  Flame,
  AlertTriangle,
  ShieldAlert,
  Clock,
  LucideIcon,
} from 'lucide-react';
import { WeatherAlert, AlertSeverity } from '../../types/weatherAlerts';

interface WeatherAlertCardProps {
  alert: WeatherAlert;
  className?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  wind: Wind,
  'cloud-rain': CloudRain,
  'cloud-rain-wind': CloudRain,
  snowflake: Snowflake,
  'cloud-lightning': CloudLightning,
  'cloud-fog': Haze,
  haze: Haze,
  cloudy: Cloudy,
  cloud: Cloud,
  sun: Sun,
  'sun-medium': SunMedium,
  'thermometer-sun': ThermometerSun,
  flame: Flame,
  'thermometer-snowflake': ThermometerSnowflake,
  'alert-triangle': AlertTriangle,
  'shield-alert': ShieldAlert,
};

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    label: string;
    badgeBg: string;
    border: string;
    glow: string;
    iconBg: string;
    iconColor: string;
    textColor: string;
  }
> = {
  extreme: {
    label: 'EXTREME',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    border: 'border-rose-500/40',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    iconColor: 'text-rose-400',
    textColor: 'text-rose-200',
  },
  high: {
    label: 'HIGH ALERT',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    iconColor: 'text-amber-400',
    textColor: 'text-amber-200',
  },
  moderate: {
    label: 'ADVISORY',
    badgeBg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
    border: 'border-yellow-500/30',
    glow: 'shadow-[0_0_10px_rgba(234,179,8,0.1)]',
    iconBg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    iconColor: 'text-yellow-400',
    textColor: 'text-yellow-200',
  },
  info: {
    label: 'INFO',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    border: 'border-sky-500/30',
    glow: 'shadow-none',
    iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    iconColor: 'text-sky-400',
    textColor: 'text-sky-200',
  },
};

export const WeatherAlertCard: React.FC<WeatherAlertCardProps> = ({ alert, className = '' }) => {
  const IconComponent = ICON_MAP[alert.iconKey] || AlertTriangle;
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.moderate;

  return (
    <div
      id={`weather-alert-card-${alert.id}`}
      role="article"
      aria-label={`${config.label}: ${alert.title}. ${alert.description}`}
      className={`relative w-full rounded-xl bg-slate-900/90 backdrop-blur-md border ${config.border} ${config.glow} p-3.5 flex flex-col gap-2 transition-all select-none ${className}`}
    >
      {/* Top Row: Icon + Title + Severity Pill & Timing */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Weather Condition Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${config.iconBg}`}
            aria-hidden="true"
          >
            <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
          </div>

          {/* Alert Title */}
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider text-slate-100 truncate">
              {alert.title}
            </h4>
          </div>
        </div>

        {/* Severity Badge & Timing Chip */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg}`}
          >
            {config.label}
          </span>
          <span className="text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-slate-400" />
            {alert.timing}
          </span>
        </div>
      </div>

      {/* Description & Dynamic Detail Metrics */}
      <div className="pl-[3.75rem] text-xs text-slate-300 font-sans space-y-1">
        <p className="leading-snug">{alert.description}</p>
        {alert.detail && (
          <p className="text-[11px] font-mono text-slate-400 leading-snug">
            {alert.detail}
          </p>
        )}
      </div>
    </div>
  );
};
