import {
  AirQualityData,
  AqiCategory,
  AirQualityCategoryDetails,
} from '../types/airQuality';

export const AQI_CATEGORIES: Record<AqiCategory, AirQualityCategoryDetails> = {
  GOOD: {
    category: 'GOOD',
    label: 'GOOD',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30 text-emerald-300',
    description: 'Air quality is satisfactory and poses little to no risk.',
  },
  MODERATE: {
    category: 'MODERATE',
    label: 'MODERATE',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30 text-amber-300',
    description: 'Air quality is acceptable for most people.',
  },
  'UNHEALTHY FOR SENSITIVE GROUPS': {
    category: 'UNHEALTHY FOR SENSITIVE GROUPS',
    label: 'SENSITIVE GROUPS',
    textColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/30 text-orange-300',
    description: 'Members of sensitive groups may experience health effects.',
  },
  UNHEALTHY: {
    category: 'UNHEALTHY',
    label: 'UNHEALTHY',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30 text-rose-300',
    description: 'Everyone may begin to experience health effects.',
  },
  'VERY UNHEALTHY': {
    category: 'VERY UNHEALTHY',
    label: 'VERY UNHEALTHY',
    textColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/30 text-purple-300',
    description: 'Health alert: increased risk of health effects for all.',
  },
  HAZARDOUS: {
    category: 'HAZARDOUS',
    label: 'HAZARDOUS',
    textColor: 'text-red-500',
    badgeBg: 'bg-red-600/20',
    badgeBorder: 'border-red-500/40 text-red-300',
    description: 'Health warning of emergency conditions.',
  },
};

/**
 * Determine the standard US AQI Category and descriptive details.
 */
export function getUsAqiCategory(aqi: number | null | undefined): AqiCategory {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return 'GOOD';
  }
  if (aqi <= 50) return 'GOOD';
  if (aqi <= 100) return 'MODERATE';
  if (aqi <= 150) return 'UNHEALTHY FOR SENSITIVE GROUPS';
  if (aqi <= 200) return 'UNHEALTHY';
  if (aqi <= 300) return 'VERY UNHEALTHY';
  return 'HAZARDOUS';
}

export interface AqiEpaColorInfo {
  colorWord: string;
  categoryPhrase: string;
  textColor: string;
}

export function getAqiEpaColorInfo(category: AqiCategory): AqiEpaColorInfo {
  switch (category) {
    case 'GOOD':
      return {
        colorWord: 'GREEN',
        categoryPhrase: 'Good',
        textColor: 'text-emerald-400',
      };
    case 'MODERATE':
      return {
        colorWord: 'YELLOW',
        categoryPhrase: 'Moderate',
        textColor: 'text-yellow-400',
      };
    case 'UNHEALTHY FOR SENSITIVE GROUPS':
      return {
        colorWord: 'ORANGE',
        categoryPhrase: 'Unhealthy for Sensitive Groups',
        textColor: 'text-orange-400',
      };
    case 'UNHEALTHY':
      return {
        colorWord: 'RED',
        categoryPhrase: 'Unhealthy',
        textColor: 'text-red-400',
      };
    case 'VERY UNHEALTHY':
      return {
        colorWord: 'PURPLE',
        categoryPhrase: 'Very Unhealthy',
        textColor: 'text-purple-400',
      };
    case 'HAZARDOUS':
      return {
        colorWord: 'MAROON',
        categoryPhrase: 'Hazardous',
        textColor: 'text-[#a8323e]',
      };
    default:
      return {
        colorWord: 'GREEN',
        categoryPhrase: 'Good',
        textColor: 'text-emerald-400',
      };
  }
}

export function getAqiDetails(category: AqiCategory): AirQualityCategoryDetails {
  return AQI_CATEGORIES[category] || AQI_CATEGORIES.GOOD;
}

export interface FetchAirQualityOptions {
  lat: number;
  lon: number;
  signal?: AbortSignal;
}

/**
 * Fetches normalized Air Quality data from Open-Meteo Air Quality API.
 */
export async function fetchAirQuality({
  lat,
  lon,
  signal,
}: FetchAirQualityOptions): Promise<AirQualityData> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&timezone=auto`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Air Quality HTTP ${res.status}`);
  }

  const data = await res.json();
  const current = data.current;

  if (!current) {
    throw new Error('Invalid Air Quality response payload');
  }

  const rawAqi = current.us_aqi;
  const aqi = typeof rawAqi === 'number' && !isNaN(rawAqi) ? Math.round(rawAqi) : null;
  const pm25 = typeof current.pm2_5 === 'number' && !isNaN(current.pm2_5) ? current.pm2_5 : null;
  const pm10 = typeof current.pm10 === 'number' && !isNaN(current.pm10) ? current.pm10 : null;

  const category = getUsAqiCategory(aqi);
  const details = getAqiDetails(category);

  return {
    aqi,
    category,
    categoryLabel: details.label,
    pm25,
    pm10,
    status: 'success',
    lastFetchedAt: Date.now(),
  };
}
