import React from 'react';
import { WeatherConditionKey } from '../../store/useWeatherStore';

export interface WeatherIconProps {
  condition: WeatherConditionKey;
  size?: 'sm' | 'lg' | number; // sm = forecast cards (~48px), lg = mini weather view (~96px)
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ condition, size = 'sm', className = '' }) => {
  let dimension = 48;
  if (size === 'sm') {
    dimension = 52;
  } else if (size === 'lg') {
    dimension = 104;
  } else if (typeof size === 'number') {
    dimension = size;
  }

  // Common SVG gradient / defs IDs to keep things scoped
  const sunGradId = 'weather-sun-gradient';
  const cloudGradId = 'weather-cloud-gradient';
  const rainGradId = 'weather-rain-gradient';
  const moonGradId = 'weather-moon-gradient';
  const thunderGradId = 'weather-thunder-gradient';

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm select-none ${className}`}
    >
      <defs>
        {/* Sun Golden Radiant Gradient */}
        <radialGradient id={sunGradId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="var(--weather-sun-light, #fef08a)" />
          <stop offset="45%" stopColor="var(--weather-sun-mid, #facc15)" />
          <stop offset="100%" stopColor="var(--weather-sun-dark, #eab308)" />
        </radialGradient>

        {/* Soft Cloud Volume Gradient */}
        <linearGradient id={cloudGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--weather-cloud-light, #f1f5f9)" />
          <stop offset="60%" stopColor="var(--weather-cloud-mid, #cbd5e1)" />
          <stop offset="100%" stopColor="var(--weather-cloud-dark, #94a3b8)" />
        </linearGradient>

        {/* Darker Storm Cloud Gradient */}
        <linearGradient id="weather-storm-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="60%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Rain Streak Cyan Gradient */}
        <linearGradient id={rainGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--weather-rain-light, #38bdf8)" />
          <stop offset="100%" stopColor="var(--weather-rain-dark, #0284c7)" />
        </linearGradient>

        {/* Moon Silver Pearl Gradient */}
        <linearGradient id={moonGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--weather-moon-light, #f8fafc)" />
          <stop offset="100%" stopColor="var(--weather-moon-dark, #94a3b8)" />
        </linearGradient>

        {/* Thunder Bolt Amber Shock Gradient */}
        <linearGradient id={thunderGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Render condition SVG geometry */}
      {condition === 'clear-day' && (
        <g>
          {/* Sun Rays 12-point starburst */}
          <g stroke="var(--weather-sun-ray, #f59e0b)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="32" y1="8" x2="32" y2="14" />
            <line x1="32" y1="50" x2="32" y2="56" />
            <line x1="8" y1="32" x2="14" y2="32" />
            <line x1="50" y1="32" x2="56" y2="32" />
            <line x1="15" y1="15" x2="19.5" y2="19.5" />
            <line x1="44.5" y1="44.5" x2="49" y2="49" />
            <line x1="15" y1="49" x2="19.5" y2="44.5" />
            <line x1="44.5" y1="19.5" x2="49" y2="15" />
            {/* Additional angled rays for rich sun effect */}
            <polygon
              points="32,6 35,16 43,11 40,21 50,21 44,28 53,32 44,36 50,43 40,43 43,53 35,48 32,58 29,48 21,53 24,43 14,43 20,36 11,32 20,28 14,21 24,21 21,11 29,16"
              fill="var(--weather-sun-ray-bg, #f59e0b)"
              opacity="0.9"
            />
          </g>
          {/* Sun Core Disc */}
          <circle cx="32" cy="32" r="14" fill={`url(#${sunGradId})`} stroke="#d97706" strokeWidth="1.5" />
          <circle cx="28" cy="28" r="4" fill="#ffffff" opacity="0.35" />
        </g>
      )}

      {condition === 'clear-night' && (
        <g>
          {/* Crescent Moon */}
          <path
            d="M38 12C36.5 12 35.1 12.2 33.7 12.6C41.2 15.6 46 23.3 46 32C46 40.7 41.2 48.4 33.7 51.4C35.1 51.8 36.5 52 38 52C49 52 58 43 58 32C58 21 49 12 38 12Z"
            fill={`url(#${moonGradId})`}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          {/* Subtle Stars */}
          <path d="M16 20L17.5 24L21.5 25.5L17.5 27L16 31L14.5 27L10.5 25.5L14.5 24L16 20Z" fill="#fef08a" opacity="0.9" />
          <path d="M26 40L27 42.5L29.5 43.5L27 44.5L26 47L25 44.5L22.5 43.5L25 42.5L26 40Z" fill="#fef08a" opacity="0.8" />
        </g>
      )}

      {condition === 'partly-cloudy-day' && (
        <g>
          {/* Sun Behind Cloud */}
          <g transform="translate(4, -4)">
            <g stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
              <line x1="28" y1="8" x2="28" y2="13" />
              <line x1="14" y1="14" x2="17.5" y2="17.5" />
              <line x1="8" y1="28" x2="13" y2="28" />
              <line x1="42" y1="14" x2="38.5" y2="17.5" />
              <line x1="48" y1="28" x2="43" y2="28" />
            </g>
            <circle cx="28" cy="28" r="12" fill={`url(#${sunGradId})`} stroke="#d97706" strokeWidth="1.2" />
          </g>
          {/* Front Cloud */}
          <path
            d="M20 48H46C51.5 48 56 43.5 56 38C56 32.8 52 28.5 47 28.1C45.8 21.2 39.8 16 32.5 16C26.5 16 21.2 19.8 19.2 25.2C14.6 26.2 11 30.2 11 35C11 42.2 15 48 20 48Z"
            fill={`url(#${cloudGradId})`}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
        </g>
      )}

      {condition === 'partly-cloudy-night' && (
        <g>
          {/* Crescent Moon Behind */}
          <path
            d="M32 10C30.8 10 29.6 10.2 28.5 10.5C34.5 13 38.5 19 38.5 26C38.5 33 34.5 39 28.5 41.5C29.6 41.8 30.8 42 32 42C40.8 42 48 34.8 48 26C48 17.2 40.8 10 32 10Z"
            fill={`url(#${moonGradId})`}
            stroke="#64748b"
            strokeWidth="1.2"
          />
          {/* Front Cloud */}
          <path
            d="M18 48H44C49.5 48 54 43.5 54 38C54 32.8 50 28.5 45 28.1C43.8 21.2 37.8 16 30.5 16C24.5 16 19.2 19.8 17.2 25.2C12.6 26.2 9 30.2 9 35C9 42.2 13 48 18 48Z"
            fill={`url(#${cloudGradId})`}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
        </g>
      )}

      {condition === 'cloudy' && (
        <g>
          {/* Back Soft Cloud */}
          <path
            d="M26 38H48C53 38 57 34 57 29C57 24.3 53.4 20.4 48.9 20.1C47.8 14 42.5 9.5 36 9.5C30.5 9.5 25.8 13 24 18C20 19 17 22.5 17 27C17 33 21 38 26 38Z"
            fill="#64748b"
            opacity="0.6"
          />
          {/* Front Full Cloud */}
          <path
            d="M18 50H46C51.5 50 56 45.5 56 40C56 34.8 52 30.5 47 30.1C45.8 23.2 39.8 18 32.5 18C26.5 18 21.2 21.8 19.2 27.2C14.6 28.2 11 32.2 11 37C11 44.2 15 50 18 50Z"
            fill={`url(#${cloudGradId})`}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
        </g>
      )}

      {condition === 'fog' && (
        <g>
          {/* Horizontal Fog Bars */}
          <line x1="14" y1="20" x2="50" y2="20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          <line x1="10" y1="28" x2="54" y2="28" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <line x1="16" y1="36" x2="48" y2="36" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          <line x1="12" y1="44" x2="52" y2="44" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <line x1="18" y1="52" x2="46" y2="52" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {condition === 'drizzle' && (
        <g>
          {/* Cloud */}
          <path
            d="M17 38H47C51.5 38 55 34.5 55 30C55 25.8 51.7 22.3 47.7 22C46.7 16.5 41.8 12.5 36 12.5C31.2 12.5 27 15.5 25.4 19.8C21.7 20.6 18.8 23.8 18.8 27.6C18.8 33.4 14.5 38 17 38Z"
            fill={`url(#${cloudGradId})`}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Light Drizzle Drops */}
          <g stroke={`url(#${rainGradId})`} strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="44" x2="20" y2="49" />
            <line x1="32" y1="44" x2="30" y2="49" />
            <line x1="42" y1="44" x2="40" y2="49" />
            <line x1="27" y1="52" x2="25" y2="57" />
            <line x1="37" y1="52" x2="35" y2="57" />
          </g>
        </g>
      )}

      {(condition === 'rain' || condition === 'rain-night') && (
        <g>
          {/* Rain Cloud */}
          <path
            d="M17 38H47C51.5 38 55 34.5 55 30C55 25.8 51.7 22.3 47.7 22C46.7 16.5 41.8 12.5 36 12.5C31.2 12.5 27 15.5 25.4 19.8C21.7 20.6 18.8 23.8 18.8 27.6C18.8 33.4 14.5 38 17 38Z"
            fill={`url(#${cloudGradId})`}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Steady Rain Streaks */}
          <g stroke={`url(#${rainGradId})`} strokeWidth="3" strokeLinecap="round">
            <line x1="22" y1="43" x2="19" y2="52" />
            <line x1="32" y1="43" x2="29" y2="52" />
            <line x1="42" y1="43" x2="39" y2="52" />
            <line x1="26" y1="51" x2="23" y2="60" />
            <line x1="36" y1="51" x2="33" y2="60" />
          </g>
          {condition === 'rain-night' && (
            <path
              d="M44 8C43.5 8 43 8.1 42.5 8.2C45 9.2 46.8 11.6 46.8 14.5C46.8 17.4 45 19.8 42.5 20.8C43 20.9 43.5 21 44 21C47.6 21 50.5 18.1 50.5 14.5C50.5 10.9 47.6 8 44 8Z"
              fill={`url(#${moonGradId})`}
            />
          )}
        </g>
      )}

      {condition === 'thunderstorm' && (
        <g>
          {/* Dark Storm Cloud */}
          <path
            d="M17 36H47C51.5 36 55 32.5 55 28C55 23.8 51.7 20.3 47.7 20C46.7 14.5 41.8 10.5 36 10.5C31.2 10.5 27 13.5 25.4 17.8C21.7 18.6 18.8 21.8 18.8 25.6C18.8 31.4 14.5 36 17 36Z"
            fill="url(#weather-storm-cloud)"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Lightning Bolt */}
          <polygon
            points="31,34 23,46 30,46 26,58 39,44 32,44 37,34"
            fill={`url(#${thunderGradId})`}
            stroke="#d97706"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Rain Streaks */}
          <g stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="44" x2="16" y2="52" />
            <line x1="44" y1="44" x2="42" y2="52" />
          </g>
        </g>
      )}

      {(condition === 'snow' || condition === 'snow-showers') && (
        <g>
          {/* Cloud */}
          <path
            d="M17 36H47C51.5 36 55 32.5 55 28C55 23.8 51.7 20.3 47.7 20C46.7 14.5 41.8 10.5 36 10.5C31.2 10.5 27 13.5 25.4 17.8C21.7 18.6 18.8 21.8 18.8 25.6C18.8 31.4 14.5 36 17 36Z"
            fill={`url(#${cloudGradId})`}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Snowflakes Geometry */}
          <g fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.2">
            {/* Left Snowflake */}
            <g transform="translate(22, 45)">
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#bae6fd" strokeWidth="1.5" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#bae6fd" strokeWidth="1.5" />
              <line x1="-3" y1="-3" x2="3" y2="3" stroke="#bae6fd" strokeWidth="1.2" />
              <line x1="-3" y1="3" x2="3" y2="-3" stroke="#bae6fd" strokeWidth="1.2" />
              <circle cx="0" cy="0" r="1.5" fill="#f8fafc" />
            </g>
            {/* Center Snowflake */}
            <g transform="translate(32, 53)">
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#bae6fd" strokeWidth="1.5" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#bae6fd" strokeWidth="1.5" />
              <line x1="-3" y1="-3" x2="3" y2="3" stroke="#bae6fd" strokeWidth="1.2" />
              <line x1="-3" y1="3" x2="3" y2="-3" stroke="#bae6fd" strokeWidth="1.2" />
              <circle cx="0" cy="0" r="1.5" fill="#f8fafc" />
            </g>
            {/* Right Snowflake */}
            <g transform="translate(42, 45)">
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#bae6fd" strokeWidth="1.5" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#bae6fd" strokeWidth="1.5" />
              <line x1="-3" y1="-3" x2="3" y2="3" stroke="#bae6fd" strokeWidth="1.2" />
              <line x1="-3" y1="3" x2="3" y2="-3" stroke="#bae6fd" strokeWidth="1.2" />
              <circle cx="0" cy="0" r="1.5" fill="#f8fafc" />
            </g>
          </g>
        </g>
      )}

      {condition === 'sleet' && (
        <g>
          {/* Cloud */}
          <path
            d="M17 36H47C51.5 36 55 32.5 55 28C55 23.8 51.7 20.3 47.7 20C46.7 14.5 41.8 10.5 36 10.5C31.2 10.5 27 13.5 25.4 17.8C21.7 18.6 18.8 21.8 18.8 25.6C18.8 31.4 14.5 36 17 36Z"
            fill={`url(#${cloudGradId})`}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Rain streak + Ice crystal */}
          <line x1="22" y1="44" x2="19" y2="52" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="48" r="3" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
          <line x1="42" y1="44" x2="39" y2="52" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="26" cy="56" r="2.5" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
        </g>
      )}

      {condition === 'windy' && (
        <g stroke="var(--weather-wind-color, #94a3b8)" strokeWidth="3" strokeLinecap="round" fill="none">
          {/* Wind Streamlines */}
          <path d="M12 24H38C42 24 45 21 45 18C45 15 42 12 38 12C34 12 32 15 32 17" />
          <path d="M8 32H44C48 32 52 29 52 25C52 21 48 18 44 18C40 18 38 21 38 23" />
          <path d="M14 40H32C36 40 39 43 39 46C39 49 36 52 32 52C28 52 26 49 26 47" />
        </g>
      )}
    </svg>
  );
};
