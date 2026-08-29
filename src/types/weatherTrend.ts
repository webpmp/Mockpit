export type WeatherTrendType =
  | 'rain-developing'
  | 'rain-ending'
  | 'snow-developing'
  | 'snow-ending'
  | 'temp-rising'
  | 'temp-dropping'
  | 'wind-increasing'
  | 'wind-easing'
  | 'precip-increasing'
  | 'precip-decreasing'
  | 'clearing'
  | 'clouds-building'
  | 'stable';

export interface WeatherTrendThresholds {
  tempChangeThresholdF: number; // default 6°F
  tempChangeThresholdC: number; // default 3.5°C
  precipProbIncreaseThreshold: number; // default 30%
  precipProbDecreaseThreshold: number; // default 35%
  windSpeedIncreaseThresholdMph: number; // default 10 mph
  windSpeedIncreaseThresholdKmh: number; // default 16 km/h
  windSpeedDecreaseThresholdMph: number; // default 10 mph
  windSpeedDecreaseThresholdKmh: number; // default 16 km/h
  cloudCoverChangeThreshold: number; // default 40%
  lookaheadHours: number; // default 6 hours
}

export const DEFAULT_WEATHER_TREND_THRESHOLDS: WeatherTrendThresholds = {
  tempChangeThresholdF: 6,
  tempChangeThresholdC: 3.5,
  precipProbIncreaseThreshold: 30,
  precipProbDecreaseThreshold: 35,
  windSpeedIncreaseThresholdMph: 10,
  windSpeedIncreaseThresholdKmh: 16,
  windSpeedDecreaseThresholdMph: 10,
  windSpeedDecreaseThresholdKmh: 16,
  cloudCoverChangeThreshold: 40,
  lookaheadHours: 6,
};

export interface HourlyForecastSnapshot {
  time: string[];
  temperature_2m?: number[];
  precipitation_probability?: number[];
  precipitation?: number[];
  rain?: number[];
  showers?: number[];
  snowfall?: number[];
  weather_code?: number[];
  wind_speed_10m?: number[];
  cloud_cover?: number[];
}

export interface CurrentWeatherSnapshot {
  time?: string;
  temperature?: number;
  weather_code?: number;
  wind_speed?: number;
  precipitation_probability?: number;
  cloud_cover?: number;
  is_day?: boolean;
}

export interface WeatherTrendResult {
  type: WeatherTrendType;
  headline: string;
  detail: string;
  iconName:
    | 'rain'
    | 'snow'
    | 'temp-down'
    | 'temp-up'
    | 'wind-up'
    | 'wind-down'
    | 'sun'
    | 'cloud'
    | 'stable';
  colorTheme: 'amber' | 'sky' | 'blue' | 'emerald' | 'indigo' | 'slate' | 'violet';
  confidence?: 'high' | 'medium';
}
