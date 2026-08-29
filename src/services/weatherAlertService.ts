import {
  OpenMeteoForecastResponse,
  WeatherAlert,
  AlertsEvaluationResult,
} from '../types/weatherAlerts';
import { evaluateWeatherAlerts } from './weatherAlertEvaluator';

export interface WeatherAlertFetchOptions {
  lat: number;
  lon: number;
  unit?: 'F' | 'C';
  forceRefresh?: boolean;
}

interface CacheEntry {
  data: OpenMeteoForecastResponse;
  alerts: WeatherAlert[];
  fetchedAt: number;
}

// In-memory cache with 5-minute TTL
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Sequence counter to prevent stale out-of-order responses from overwriting newer requests
let latestRequestId = 0;

/**
 * Builds standard Open-Meteo URL with all required alert detection variables
 */
export function buildOpenMeteoAlertsUrl(lat: number, lon: number, unit: 'F' | 'C' = 'F'): string {
  const tempUnit = unit === 'C' ? 'celsius' : 'fahrenheit';
  const windUnit = unit === 'C' ? 'kmh' : 'mph';

  const currentParams = [
    'temperature_2m',
    'apparent_temperature',
    'precipitation',
    'rain',
    'showers',
    'snowfall',
    'weather_code',
    'wind_speed_10m',
    'wind_gusts_10m',
    'visibility',
    'relative_humidity_2m',
    'surface_pressure',
  ].join(',');

  const hourlyParams = [
    'temperature_2m',
    'apparent_temperature',
    'precipitation_probability',
    'precipitation',
    'rain',
    'showers',
    'snowfall',
    'weather_code',
    'wind_speed_10m',
    'wind_gusts_10m',
    'visibility',
    'relative_humidity_2m',
    'cape',
    'freezing_level_height',
  ].join(',');

  const dailyParams = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'apparent_temperature_max',
    'apparent_temperature_min',
    'precipitation_sum',
    'rain_sum',
    'showers_sum',
    'snowfall_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'wind_gusts_10m_max',
    'uv_index_max',
    'sunrise',
    'sunset',
  ].join(',');

  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&current=${currentParams}` +
    `&hourly=${hourlyParams}` +
    `&daily=${dailyParams}` +
    `&temperature_unit=${tempUnit}` +
    `&wind_speed_unit=${windUnit}` +
    `&precipitation_unit=inch` +
    `&timezone=auto` +
    `&forecast_days=3`
  );
}

/**
 * Fetches Open-Meteo forecast data and runs alert evaluation
 */
export async function fetchWeatherAlerts({
  lat,
  lon,
  unit = 'F',
  forceRefresh = false,
}: WeatherAlertFetchOptions): Promise<{
  alerts: WeatherAlert[];
  rawResponse: OpenMeteoForecastResponse;
  fromCache: boolean;
  requestId: number;
}> {
  const currentRequestId = ++latestRequestId;
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)},${unit}`;

  if (!forceRefresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return {
        alerts: cached.alerts,
        rawResponse: cached.data,
        fromCache: true,
        requestId: currentRequestId,
      };
    }
  }

  const url = buildOpenMeteoAlertsUrl(lat, lon, unit);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open-Meteo HTTP ${response.status}: ${response.statusText}`);
  }

  const data: OpenMeteoForecastResponse = await response.json();

  if (!data || typeof data.latitude !== 'number') {
    throw new Error('Invalid Open-Meteo weather payload received');
  }

  const alerts = evaluateWeatherAlerts(data, unit);

  // Save to cache
  cache.set(cacheKey, {
    data,
    alerts,
    fetchedAt: Date.now(),
  });

  return {
    alerts,
    rawResponse: data,
    fromCache: false,
    requestId: currentRequestId,
  };
}

/**
 * Helper to inspect whether a request is stale compared to latest active sequence
 */
export function isRequestStale(requestId: number): boolean {
  return requestId < latestRequestId;
}

/**
 * Clears the alerts cache
 */
export function clearWeatherAlertsCache(): void {
  cache.clear();
}
