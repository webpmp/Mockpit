export type AlertType =
  | 'extreme_heat'
  | 'extreme_cold'
  | 'heavy_rain'
  | 'heavy_snow'
  | 'high_wind'
  | 'strong_gusts'
  | 'low_visibility'
  | 'thunderstorm'
  | 'freezing_conditions'
  | 'high_uv'
  | 'severe_weather_potential';

export type AlertSeverity = 'info' | 'moderate' | 'high' | 'extreme';

export interface WeatherAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  detail?: string;
  timing: string; // e.g. "NOW", "NEXT HOUR", "NEXT 3 HOURS", "THIS AFTERNOON", "TONIGHT", "TOMORROW"
  startTime?: string;
  endTime?: string;
  value?: number;
  unit?: string;
  iconKey: string;
  source: 'open-meteo';
}

export interface OpenMeteoCurrent {
  time?: string;
  temperature_2m?: number;
  apparent_temperature?: number;
  precipitation?: number;
  rain?: number;
  showers?: number;
  snowfall?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  wind_gusts_10m?: number;
  visibility?: number;
  relative_humidity_2m?: number;
  surface_pressure?: number;
  is_day?: number;
}

export interface OpenMeteoHourly {
  time?: string[];
  temperature_2m?: number[];
  apparent_temperature?: number[];
  precipitation_probability?: number[];
  precipitation?: number[];
  rain?: number[];
  showers?: number[];
  snowfall?: number[];
  weather_code?: number[];
  wind_speed_10m?: number[];
  wind_gusts_10m?: number[];
  visibility?: number[];
  relative_humidity_2m?: number[];
  cape?: number[];
  freezing_level_height?: number[];
}

export interface OpenMeteoDaily {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  apparent_temperature_max?: number[];
  apparent_temperature_min?: number[];
  precipitation_sum?: number[];
  rain_sum?: number[];
  showers_sum?: number[];
  snowfall_sum?: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
  wind_gusts_10m_max?: number[];
  uv_index_max?: number[];
  sunrise?: string[];
  sunset?: string[];
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  timezone_abbreviation?: string;
  elevation?: number;
  current_units?: Record<string, string>;
  current?: OpenMeteoCurrent;
  hourly_units?: Record<string, string>;
  hourly?: OpenMeteoHourly;
  daily_units?: Record<string, string>;
  daily?: OpenMeteoDaily;
}

export interface AlertsEvaluationResult {
  alerts: WeatherAlert[];
  evaluatedAt: number;
  locationName?: string;
  coordinates: { lat: number; lon: number };
  timezone?: string;
  hasSignificantAlerts: boolean;
}

export interface WeatherAlertsState {
  alerts: WeatherAlert[];
  status: 'idle' | 'loading' | 'success' | 'error';
  lastUpdated: number | null;
  errorMessage?: string;
  locationName?: string;
  coordinates: { lat: number; lon: number } | null;
  timezone?: string;
}

