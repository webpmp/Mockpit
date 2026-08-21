import { create } from 'zustand';

export type WeatherConditionKey =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'rain-night'
  | 'thunderstorm'
  | 'snow'
  | 'snow-showers'
  | 'sleet'
  | 'windy';

export interface WeatherDayData {
  dayLabel: string; // "" for current, "TUE" etc for forecast
  icon: WeatherConditionKey;
  amIcon?: WeatherConditionKey;
  pmIcon?: WeatherConditionKey;
  conditionLabel: string;
  temperature?: number; // only present on `current`
  high: number;
  low: number;
  wind?: { speed: number; direction: string; unit: 'mph' | 'kph' };
  humidity?: number;
  precipitationChance?: number;
}

export interface WeatherState {
  locationInput: string; // raw city name or zip, from inspector
  resolvedLocation: {
    name: string;
    lat: number;
    lon: number;
  } | null;
  unit: 'F' | 'C'; // user-toggleable, inspector-controlled
  displayScale: 'sm' | 'md' | 'lg'; // default 'md'
  current: WeatherDayData | null;
  forecast: WeatherDayData[]; // 5 entries
  status: 'idle' | 'loading' | 'success' | 'error';
  lastFetchedAt: number | null; // epoch ms, for the "last known" fallback
  // Weather Radar Config (Inspector-controllable)
  radarZoom: number; // clamped 0..7 (default 7)
  radarRefreshInterval: number; // in minutes (default 5)
  radarLabel: string; // editable text (default "LOCAL RADAR")
  setLocationInput: (v: string) => void;
  setUnit: (u: 'F' | 'C') => void;
  setDisplayScale: (scale: 'sm' | 'md' | 'lg') => void;
  setRadarZoom: (z: number) => void;
  setRadarRefreshInterval: (m: number) => void;
  setRadarLabel: (lbl: string) => void;
  fetchWeather: () => Promise<void>;
}

// Convert wind direction degrees to compass heading
export function degreesToCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index] || 'N';
}

// Map WMO Weather Interpretation Codes to WeatherConditionKey and human labels
export function mapWmoCodeToCondition(
  code: number,
  isDay: boolean = true,
  windSpeed: number = 0
): { icon: WeatherConditionKey; label: string } {
  // If high winds (> 25 mph), consider windy condition
  if (windSpeed > 25 && code <= 3) {
    return { icon: 'windy', label: 'WINDY' };
  }

  switch (code) {
    case 0:
      return {
        icon: isDay ? 'clear-day' : 'clear-night',
        label: isDay ? 'CLEAR SKIES' : 'CLEAR',
      };
    case 1:
      return {
        icon: isDay ? 'clear-day' : 'clear-night',
        label: isDay ? 'MOSTLY SUNNY' : 'MOSTLY CLEAR',
      };
    case 2:
      return {
        icon: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night',
        label: 'PARTLY CLOUDY',
      };
    case 3:
      return {
        icon: 'cloudy',
        label: 'OVERCAST',
      };
    case 45:
    case 48:
      return {
        icon: 'fog',
        label: 'FOGGY',
      };
    case 51:
    case 53:
    case 55:
      return {
        icon: 'drizzle',
        label: 'DRIZZLE',
      };
    case 56:
    case 57:
      return {
        icon: 'sleet',
        label: 'FREEZING DRIZZLE',
      };
    case 61:
    case 63:
    case 65:
      return {
        icon: isDay ? 'rain' : 'rain-night',
        label: 'RAIN SHOWERS',
      };
    case 66:
    case 67:
      return {
        icon: 'sleet',
        label: 'FREEZING RAIN',
      };
    case 71:
    case 73:
    case 75:
      return {
        icon: 'snow',
        label: 'SNOW',
      };
    case 77:
      return {
        icon: 'snow',
        label: 'SNOW GRAINS',
      };
    case 80:
    case 81:
    case 82:
      return {
        icon: isDay ? 'rain' : 'rain-night',
        label: 'RAIN SHOWERS',
      };
    case 85:
    case 86:
      return {
        icon: 'snow-showers',
        label: 'SNOW SHOWERS',
      };
    case 95:
      return {
        icon: 'thunderstorm',
        label: 'THUNDERSTORMS',
      };
    case 96:
    case 99:
      return {
        icon: 'thunderstorm',
        label: 'SEVERE STORMS',
      };
    default:
      return {
        icon: isDay ? 'clear-day' : 'clear-night',
        label: 'FAIR',
      };
  }
}

// Short-word lookup for compound AM/PM labels
export function shortConditionWord(code: number): string {
  if (code === 0 || code === 1) return 'SUN';
  if (code === 2) return 'CLOUDS';
  if (code === 3) return 'OVERCAST';
  if (code === 45 || code === 48) return 'FOG';
  if (code >= 51 && code <= 67) return 'RAIN';
  if (code >= 80 && code <= 82) return 'RAIN';
  if (code >= 71 && code <= 77) return 'SNOW';
  if (code === 85 || code === 86) return 'SNOW';
  if (code === 95 || code === 96 || code === 99) return 'STORMS';
  return 'CLEAR';
}

// Helper to derive condition labels & icons from hourly samples in all cases (Fix D)
export function getConditionForDay(
  dateStr: string,
  dailyCode: number,
  hourlyTimes: string[],
  hourlyCodes: number[]
): { label: string; icon: WeatherConditionKey; amIcon?: WeatherConditionKey; pmIcon?: WeatherConditionKey } {
  const amIdx = hourlyTimes.indexOf(`${dateStr}T08:00`);
  const pmIdx = hourlyTimes.indexOf(`${dateStr}T14:00`);

  if (amIdx === -1 || pmIdx === -1) {
    // No hourly coverage for this date — only now fall back to the daily aggregate
    const fallback = mapWmoCodeToCondition(dailyCode, true);
    return { label: fallback.label, icon: fallback.icon };
  }

  const amCode = hourlyCodes[amIdx];
  const pmCode = hourlyCodes[pmIdx];
  const amCond = mapWmoCodeToCondition(amCode, true);
  const pmCond = mapWmoCodeToCondition(pmCode, true);

  if (shortConditionWord(amCode) === shortConditionWord(pmCode)) {
    // Same condition group both sample points — use the PM one as the representative label,
    // since afternoon is generally more relevant to a day's overall character
    return { label: pmCond.label, icon: pmCond.icon };
  }

  return {
    label: `AM ${shortConditionWord(amCode)} / PM ${shortConditionWord(pmCode)}`,
    icon: pmCond.icon,
    amIcon: amCond.icon,
    pmIcon: pmCond.icon,
  };
}

// Initial seed data for San Mateo, CA so preview is immediately beautiful
const INITIAL_CURRENT: WeatherDayData = {
  dayLabel: '',
  icon: 'clear-day',
  conditionLabel: 'CLEAR SKIES, SAN MATEO',
  temperature: 72,
  high: 75,
  low: 68,
  humidity: 68,
  precipitationChance: 10,
  wind: {
    speed: 12,
    direction: 'NW',
    unit: 'mph',
  },
};

const INITIAL_FORECAST: WeatherDayData[] = [
  { dayLabel: 'TUE', icon: 'partly-cloudy-day', conditionLabel: 'MOSTLY SUNNY', high: 74, low: 67 },
  { dayLabel: 'WED', icon: 'clear-day', conditionLabel: 'CLEAR', high: 76, low: 69 },
  { dayLabel: 'THU', icon: 'rain', conditionLabel: 'RAIN SHOWERS', high: 65, low: 60 },
  { dayLabel: 'FRI', icon: 'thunderstorm', conditionLabel: 'THUNDERSTORMS', high: 62, low: 58 },
  { dayLabel: 'SAT', icon: 'clear-day', conditionLabel: 'CLEAR', high: 77, low: 70 },
];

export const useWeatherStore = create<WeatherState>((set, get) => ({
  locationInput: 'San Mateo, CA',
  resolvedLocation: {
    name: 'San Mateo, CA',
    lat: 37.56299,
    lon: -122.32553,
  },
  unit: 'F',
  displayScale: 'md',
  current: INITIAL_CURRENT,
  forecast: INITIAL_FORECAST,
  status: 'idle',
  lastFetchedAt: Date.now(),
  radarZoom: 7,
  radarRefreshInterval: 5,
  radarLabel: 'LOCAL RADAR',

  setLocationInput: (locationInput: string) => {
    set({ locationInput });
  },

  setUnit: (unit: 'F' | 'C') => {
    set({ unit });
    // Trigger refetch with new unit from Open-Meteo
    get().fetchWeather();
  },

  setDisplayScale: (displayScale: 'sm' | 'md' | 'lg') => {
    set({ displayScale });
  },

  setRadarZoom: (zoom: number) => {
    // Strictly clamp radar zoom between 0 and 7 for RainViewer API limit
    const clamped = Math.max(0, Math.min(7, Math.round(zoom)));
    set({ radarZoom: clamped });
  },

  setRadarRefreshInterval: (radarRefreshInterval: number) => {
    const clamped = Math.max(1, Math.min(60, Math.round(radarRefreshInterval)));
    set({ radarRefreshInterval: clamped });
  },

  setRadarLabel: (radarLabel: string) => {
    set({ radarLabel });
  },

  fetchWeather: async () => {
    const { locationInput, unit, resolvedLocation, lastFetchedAt } = get();
    const query = locationInput.trim();
    if (!query) return;

    set({ status: 'loading' });

    try {
      // Step 1 — Geocoding lookup via Open-Meteo
      let lat = resolvedLocation?.lat ?? 37.56299;
      let lon = resolvedLocation?.lon ?? -122.32553;
      let resolvedName = resolvedLocation?.name ?? query;

      // Only re-geocode if location input changed or no resolved location
      const geocodeRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`
      );

      if (!geocodeRes.ok) {
        throw new Error(`Geocoding HTTP ${geocodeRes.status}`);
      }

      const geocodeData = await geocodeRes.json();
      if (geocodeData.results && geocodeData.results.length > 0) {
        const topResult = geocodeData.results[0];
        lat = topResult.latitude;
        lon = topResult.longitude;

        const stateOrCountry = topResult.admin1 || topResult.country || '';
        resolvedName = stateOrCountry
          ? `${topResult.name}, ${stateOrCountry}`
          : topResult.name;

        set({
          resolvedLocation: {
            name: resolvedName,
            lat,
            lon,
          },
        });
      } else if (!resolvedLocation) {
        throw new Error('Location not found');
      }

      // Step 2 — Forecast request
      const tempUnitParam = unit === 'C' ? 'celsius' : 'fahrenheit';
      const windUnitParam = unit === 'C' ? 'kmh' : 'mph';

      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=weather_code&temperature_unit=${tempUnitParam}&wind_speed_unit=${windUnitParam}&timezone=auto&forecast_days=6`;

      const forecastRes = await fetch(forecastUrl);
      if (!forecastRes.ok) {
        throw new Error(`Forecast HTTP ${forecastRes.status}`);
      }

      const data = await forecastRes.json();

      if (!data.current || !data.daily) {
        throw new Error('Invalid weather payload');
      }

      // Diagnostic logging per spec
      console.log('[weather-debug] resolvedLocation used:', lat, lon, resolvedName);
      console.log('[weather-debug] raw daily payload:', JSON.stringify(data.daily));

      const dailyTimes: string[] = data.daily.time || [];
      const dailyCodes: number[] = data.daily.weather_code || [];
      const dailyMaxes: number[] = data.daily.temperature_2m_max || [];
      const dailyMins: number[] = data.daily.temperature_2m_min || [];
      const hourlyTimes: string[] = data.hourly?.time || [];
      const hourlyCodes: number[] = data.hourly?.weather_code || [];

      // Process Current Weather
      const isDay = data.current.is_day === 1;
      const currentCode = data.current.weather_code ?? 0;
      const currentWindSpeed = Math.round(data.current.wind_speed_10m ?? 0);
      const currentWindDirDeg = data.current.wind_direction_10m ?? 0;
      const currentCondition = mapWmoCodeToCondition(currentCode, isDay, currentWindSpeed);

      const todayDateStr = dailyTimes[0] || new Date().toISOString().split('T')[0];
      const todayCondition = getConditionForDay(
        todayDateStr,
        currentCode,
        hourlyTimes,
        hourlyCodes
      );

      const todayMax = Math.round(data.daily.temperature_2m_max?.[0] ?? data.current.temperature_2m);
      const todayMin = Math.round(data.daily.temperature_2m_min?.[0] ?? data.current.temperature_2m);
      const currentHumidity = data.current.relative_humidity_2m !== undefined
        ? Math.round(data.current.relative_humidity_2m)
        : undefined;
      const currentPrecip = data.daily.precipitation_probability_max?.[0] !== undefined
        ? Math.round(data.daily.precipitation_probability_max[0])
        : undefined;

      const currentDayData: WeatherDayData = {
        dayLabel: '',
        icon: currentCondition.icon,
        amIcon: todayCondition.amIcon,
        pmIcon: todayCondition.pmIcon,
        conditionLabel: `${todayCondition.label}, ${resolvedName.split(',')[0].trim().toUpperCase()}`,
        temperature: Math.round(data.current.temperature_2m),
        high: todayMax,
        low: todayMin,
        humidity: currentHumidity,
        precipitationChance: currentPrecip,
        wind: {
          speed: currentWindSpeed,
          direction: degreesToCompass(currentWindDirDeg),
          unit: unit === 'C' ? 'kph' : 'mph',
        },
      };

      // Process 5-day Forecast (indices 1..5) - wind removed per Fix 7
      const forecastDays: WeatherDayData[] = [];

      for (let i = 1; i <= 5; i++) {
        if (i < dailyTimes.length) {
          const dateStr = dailyTimes[i];
          const dateObj = new Date(dateStr + 'T12:00:00Z');
          const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
          const dayCode = dailyCodes[i] ?? 0;
          const dayCondition = getConditionForDay(
            dateStr,
            dayCode,
            hourlyTimes,
            hourlyCodes
          );

          forecastDays.push({
            dayLabel,
            icon: dayCondition.icon,
            amIcon: dayCondition.amIcon,
            pmIcon: dayCondition.pmIcon,
            conditionLabel: dayCondition.label,
            high: Math.round(dailyMaxes[i] ?? 0),
            low: Math.round(dailyMins[i] ?? 0),
            precipitationChance: data.daily.precipitation_probability_max?.[i] !== undefined
              ? Math.round(data.daily.precipitation_probability_max[i])
              : undefined,
          });
        }
      }

      set({
        current: currentDayData,
        forecast: forecastDays,
        status: 'success',
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Weather fetch error:', err);
      // If we already have prior data, preserve it and mark status as error so "Showing last update" badge shows
      if (lastFetchedAt !== null) {
        set({ status: 'error' });
      } else {
        set({
          status: 'error',
          current: null,
          forecast: [],
        });
      }
    }
  },
}));
