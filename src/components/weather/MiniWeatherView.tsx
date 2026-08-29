import React from 'react';
import { WeatherConditionKey } from '../../store/useWeatherStore';
import { WeatherIcon } from './WeatherIcon';
import { WeatherRadarCard } from './WeatherRadarCard';
import { AirQualityData } from '../../types/airQuality';
import { SunTimeData } from '../../types/sunTime';
import { getAqiEpaColorInfo } from '../../services/airQualityService';

export interface MiniWeatherViewProps {
  icon: WeatherConditionKey;
  conditionLabel?: string; // Optional/legacy, not rendered in v1.6 Today card
  temperature: number;
  unit: 'F' | 'C';
  high: number;
  low: number;
  wind?: {
    speed: number;
    direction: string; // e.g. "NW"
    unit: 'mph' | 'kph';
  };
  humidity?: number;
  precipitationChance?: number;
  airQuality?: AirQualityData;
  sunTime?: SunTimeData;
  radarLat?: number;
  radarLon?: number;
  radarZoom?: number;
  radarRefreshInterval?: number;
  onOpenRadar?: () => void;
  className?: string;
}

export const MiniWeatherView: React.FC<MiniWeatherViewProps> = ({
  icon,
  temperature,
  unit,
  high,
  low,
  wind,
  humidity,
  precipitationChance,
  airQuality,
  sunTime,
  radarLat,
  radarLon,
  radarZoom = 7,
  radarRefreshInterval = 5,
  onOpenRadar,
  className = '',
}) => {
  const windDisplay = wind ? `${wind.direction || 'CALM'} ${Math.round(wind.speed)}` : '—';
  const humidityDisplay = humidity !== undefined ? `${Math.round(humidity)}%` : '—';
  const precipDisplay = precipitationChance !== undefined ? `${Math.round(precipitationChance)}%` : '—';

  const aqiInfo = airQuality ? getAqiEpaColorInfo(airQuality.category) : null;
  const aqiDisplay =
    airQuality && airQuality.aqi !== null && airQuality.aqi !== undefined
      ? `${airQuality.aqi} · ${aqiInfo?.colorWord || 'GREEN'}`
      : '—';
  const aqiAriaLabel =
    airQuality && airQuality.aqi !== null && airQuality.aqi !== undefined
      ? `Air quality index ${airQuality.aqi}, category ${aqiInfo?.categoryPhrase || 'Good'}`
      : 'Air quality data unavailable';
  const aqiTextColor = aqiInfo?.textColor || 'text-emerald-400';

  const sunriseDisplay = sunTime?.sunriseFormatted || '—';
  const sunsetDisplay = sunTime?.sunsetFormatted || '—';

  return (
    <div
      id="mini-weather-view"
      className={`relative bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl text-slate-100 flex justify-center items-center w-full h-full min-h-0 ${className}`}
      style={{ padding: '32px', gap: '48px' }}
    >
      {/* Absolute Radar Thumbnail (top-right corner) */}
      {radarLat !== undefined && radarLon !== undefined && (
        <WeatherRadarCard
          lat={radarLat}
          lon={radarLon}
          zoom={radarZoom}
          refreshIntervalMinutes={radarRefreshInterval}
          variant="thumbnail"
          onExpand={onOpenRadar}
        />
      )}

      {/* Left Stats Column */}
      <div
        id="mini-weather-left-stats"
        className="flex-none flex flex-col justify-center border-r border-slate-800"
        style={{ width: '260px', gap: '28px', paddingRight: '24px' }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-slate-400 font-bold uppercase whitespace-nowrap" style={{ fontSize: '14px' }}>
            Wind
          </span>
          <span
            id="mini-weather-wind-value"
            className="font-bold text-slate-100 whitespace-nowrap"
            style={{ fontSize: '26px' }}
          >
            {windDisplay}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-400 font-bold uppercase whitespace-nowrap" style={{ fontSize: '14px' }}>
            Humidity
          </span>
          <span
            id="mini-weather-humidity-value"
            className="font-bold text-slate-100 whitespace-nowrap"
            style={{ fontSize: '26px' }}
          >
            {humidityDisplay}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-400 font-bold uppercase whitespace-nowrap" style={{ fontSize: '14px' }}>
            Precipitation
          </span>
          <span
            id="mini-weather-precip-value"
            className="font-bold text-slate-100 whitespace-nowrap"
            style={{ fontSize: '26px' }}
          >
            {precipDisplay}
          </span>
        </div>
      </div>

      {/* Center Hero Column: Icon, Temperature, High/Low */}
      <div className="flex-none flex flex-col items-center justify-center" style={{ gap: '20px' }}>
        {/* Condition Icon */}
        <div
          className="flex items-center justify-center rounded-full bg-slate-950/40 border border-slate-800/60 shadow-inner"
          style={{ padding: '16px' }}
        >
          <WeatherIcon condition={icon} size={200} />
        </div>

        {/* Primary Temperature Readout */}
        <div className="flex flex-col items-center">
          <div
            id="mini-weather-temperature"
            className="font-black tracking-tighter text-slate-100 font-mono leading-none"
            style={{ fontSize: '120px' }}
          >
            {Math.round(temperature)}°{unit}
          </div>

          {/* High / Low Temperature Pills */}
          <div
            id="mini-weather-high-low"
            className="flex items-center font-mono font-bold"
            style={{ marginTop: '12px', gap: '12px' }}
          >
            <span
              className="rounded-lg bg-slate-950/80 border border-slate-800 text-amber-400 font-bold leading-none"
              style={{ padding: '12px 24px', fontSize: '34px' }}
              aria-label="High temperature"
            >
              {Math.round(high)}°
            </span>
            <span
              className="rounded-lg bg-slate-950/80 border border-slate-800 text-sky-400 font-bold leading-none"
              style={{ padding: '12px 24px', fontSize: '34px' }}
              aria-label="Low temperature"
            >
              {Math.round(low)}°
            </span>
          </div>
        </div>
      </div>

      {/* Right Stats Column */}
      <div
        id="mini-weather-right-stats"
        className="flex-none flex flex-col justify-center border-l border-slate-800"
        style={{ width: '260px', gap: '28px', paddingLeft: '24px' }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-slate-400 font-bold uppercase whitespace-nowrap" style={{ fontSize: '14px' }}>
            Air Quality
          </span>
          <span
            id="air-quality-stat-value"
            className={`font-bold ${aqiTextColor} whitespace-nowrap`}
            style={{ fontSize: '26px' }}
            aria-label={aqiAriaLabel}
          >
            {aqiDisplay}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-400 font-bold uppercase whitespace-nowrap" style={{ fontSize: '14px' }}>
            Sunrise
          </span>
          <span
            id="sunrise-stat-value"
            className="font-bold text-amber-400 whitespace-nowrap"
            style={{ fontSize: '26px' }}
          >
            {sunriseDisplay}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-slate-400 font-bold uppercase whitespace-nowrap" style={{ fontSize: '14px' }}>
            Sunset
          </span>
          <span
            id="sunset-stat-value"
            className="font-bold text-orange-400 whitespace-nowrap"
            style={{ fontSize: '26px' }}
          >
            {sunsetDisplay}
          </span>
        </div>
      </div>
    </div>
  );
};
