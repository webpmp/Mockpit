export type AqiCategory =
  | 'GOOD'
  | 'MODERATE'
  | 'UNHEALTHY FOR SENSITIVE GROUPS'
  | 'UNHEALTHY'
  | 'VERY UNHEALTHY'
  | 'HAZARDOUS';

export interface AirQualityData {
  aqi: number | null;
  category: AqiCategory;
  categoryLabel: string;
  pm25: number | null;
  pm10: number | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  lastFetchedAt: number | null;
  errorMessage?: string;
}

export interface AirQualityCategoryDetails {
  category: AqiCategory;
  label: string;
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
}
