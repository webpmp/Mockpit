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
    badgeBg: 'bg-ds-error/20 text-ds-error border-ds-error/50',
    border: 'border-ds-error/40',
    glow: '0 0 15px color-mix(in srgb, var(--color-ds-error) 15%, transparent)',
    iconBg: 'bg-ds-error/20 text-ds-error border-ds-error/40',
    iconColor: 'text-ds-error',
    textColor: 'text-ds-error',
  },
  high: {
    label: 'HIGH ALERT',
    badgeBg: 'bg-ds-warning/20 text-ds-warning border-ds-warning/50',
    border: 'border-ds-warning/40',
    glow: '0 0 15px color-mix(in srgb, var(--color-ds-warning) 15%, transparent)',
    iconBg: 'bg-ds-warning/20 text-ds-warning border-ds-warning/40',
    iconColor: 'text-ds-warning',
    textColor: 'text-ds-warning',
  },
  // ds-raw-start: ADVISORY (moderate) severity yellow is fixed
  moderate: {
    label: 'ADVISORY',
    badgeBg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
    border: 'border-yellow-500/30',
    glow: '0 0 10px rgba(234,179,8,0.1)',
    iconBg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    iconColor: 'text-yellow-400',
    textColor: 'text-yellow-200',
  },
  // ds-raw-end
  info: {
    label: 'INFO',
    badgeBg: 'bg-ds-primary/15 text-ds-primary border-ds-primary/30',
    border: 'border-ds-primary/30',
    glow: 'none',
    iconBg: 'bg-ds-primary/15 text-ds-primary border-ds-primary/30',
    iconColor: 'text-ds-primary',
    textColor: 'text-ds-primary',
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
      style={{ boxShadow: config.glow !== 'none' ? config.glow : undefined }}
      className={`relative w-full rounded-xl bg-ds-surface/90 backdrop-blur-md border ${config.border} p-3.5 flex flex-col gap-2 transition-all select-none ${className}`}
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
            <h4 className="text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider text-ds-content truncate">
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
          <span className="text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ds-surface-raised border border-ds-line text-ds-content-secondary flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-ds-content-muted" />
            {alert.timing}
          </span>
        </div>
      </div>

      {/* Description & Dynamic Detail Metrics */}
      <div className="pl-[3.75rem] text-xs text-ds-content-secondary font-sans space-y-1">
        <p className="leading-snug">{alert.description}</p>
        {alert.detail && (
          <p className="text-[11px] font-mono text-ds-content-muted leading-snug">
            {alert.detail}
          </p>
        )}
      </div>
    </div>
  );
};
