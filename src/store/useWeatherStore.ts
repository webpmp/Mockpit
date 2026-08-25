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
  amCondition?: string; // e.g. "OVERCAST"
  pmCondition?: string; // e.g. "SUNNY"
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
        label: isDay ? 'SUNNY' : 'CLEAR',
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
        label: 'FOG',
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
        label: 'RAIN',
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

// Parse NWS text forecasts into standard clean condition summaries
export function parseNwsCondition(text: string): string {
  if (!text) return 'FAIR';
  const t = text.toUpperCase();
  if (t.includes('THUNDER') || t.includes('STORM')) return 'THUNDERSTORMS';
  if (t.includes('HEAVY RAIN')) return 'HEAVY RAIN';
  if (t.includes('SHOWERS') || t.includes('RAIN')) return 'RAIN SHOWERS';
  if (t.includes('DRIZZLE')) return 'DRIZZLE';
  if (t.includes('SNOW')) return 'SNOW';
  if (t.includes('FOG') || t.includes('HAZE')) return 'FOG';
  if (t.includes('OVERCAST') || (t.includes('CLOUDY') && !t.includes('PARTLY') && !t.includes('MOSTLY'))) return 'OVERCAST';
  if (t.includes('PARTLY CLOUDY') || t.includes('PARTLY SUNNY') || t.includes('MOSTLY CLOUDY')) return 'PARTLY CLOUDY';
  if (t.includes('MOSTLY SUNNY') || t.includes('MOSTLY CLEAR')) return 'MOSTLY SUNNY';
  if (t.includes('SUNNY') || t.includes('CLEAR')) return 'SUNNY';
  return 'PARTLY CLOUDY';
}

export function nwsToIcon(text: string, isDay: boolean = true): WeatherConditionKey {
  const cond = parseNwsCondition(text);
  if (cond === 'SUNNY') return isDay ? 'clear-day' : 'clear-night';
  if (cond === 'MOSTLY SUNNY') return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  if (cond === 'PARTLY CLOUDY') return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  if (cond === 'OVERCAST') return 'cloudy';
  if (cond === 'FOG') return 'fog';
  if (cond === 'DRIZZLE') return 'drizzle';
  if (cond === 'RAIN SHOWERS' || cond === 'RAIN' || cond === 'HEAVY RAIN') return 'rain';
  if (cond === 'SNOW') return 'snow';
  if (cond === 'THUNDERSTORMS') return 'thunderstorm';
  return isDay ? 'clear-day' : 'clear-night';
}

// Derive a unified day forecast icon from AM and PM conditions
export function deriveDayForecastIcon(amCondStr: string, pmCondStr: string): WeatherConditionKey {
  const am = (amCondStr || '').toUpperCase();
  const pm = (pmCondStr || '').toUpperCase();
  const combined = `${am} ${pm}`;

  // Precipitation & severe weather have top priority
  if (combined.includes('THUNDER') || combined.includes('STORM')) return 'thunderstorm';
  if (combined.includes('SNOW')) return 'snow';
  if (combined.includes('HEAVY RAIN') || combined.includes('RAIN') || combined.includes('SHOWERS')) return 'rain';
  if (combined.includes('DRIZZLE')) return 'drizzle';
  if (combined.includes('FOG') || combined.includes('HAZE')) return 'fog';

  // If both periods are completely overcast / cloudy with no sun
  if (am.includes('OVERCAST') && pm.includes('OVERCAST')) {
    return 'cloudy';
  }

  // If there's any cloudiness (PARTLY CLOUDY, MOSTLY SUNNY, OVERCAST + SUNNY combination)
  if (
    combined.includes('PARTLY') ||
    combined.includes('MOSTLY SUNNY') ||
    combined.includes('MOSTLY CLEAR') ||
    combined.includes('OVERCAST') ||
    combined.includes('CLOUDY')
  ) {
    return 'partly-cloudy-day';
  }

  // Pure sunny or clear across both periods
  if (combined.includes('SUNNY') || combined.includes('CLEAR')) {
    return 'clear-day';
  }

  return 'partly-cloudy-day';
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

// Helper to derive AM and PM condition labels & icons with hourly support
export function getConditionForDay(
  dateStr: string,
  dailyCode: number,
  hourlyTimes: string[],
  hourlyCodes: number[]
): {
  label: string;
  amCondition: string;
  pmCondition: string;
  icon: WeatherConditionKey;
  amIcon?: WeatherConditionKey;
  pmIcon?: WeatherConditionKey;
} {
  const dailyCond = mapWmoCodeToCondition(dailyCode, true);
  const amIdx = hourlyTimes.findIndex((t) => t.startsWith(`${dateStr}T08:`) || t.startsWith(`${dateStr}T09:`));
  const pmIdx = hourlyTimes.findIndex((t) => t.startsWith(`${dateStr}T14:`) || t.startsWith(`${dateStr}T15:`));

  if (amIdx === -1 || pmIdx === -1) {
    return {
      label: `AM ${dailyCond.label}\nPM ${dailyCond.label}`,
      amCondition: dailyCond.label,
      pmCondition: dailyCond.label,
      icon: dailyCond.icon,
    };
  }

  const amCode = hourlyCodes[amIdx];
  const pmCode = hourlyCodes[pmIdx];
  const amCond = mapWmoCodeToCondition(amCode, true);
  const pmCond = mapWmoCodeToCondition(pmCode, true);

  return {
    label: `AM ${amCond.label}\nPM ${pmCond.label}`,
    amCondition: amCond.label,
    pmCondition: pmCond.label,
    icon: dailyCond.icon,
    amIcon: amCond.icon,
    pmIcon: pmCond.icon,
  };
}

// Complete US State & Territory lookup dictionary for precise geocoding resolution
const US_STATES_LOOKUP: Record<string, string> = {
  al: 'alabama', ak: 'alaska', az: 'arizona', ar: 'arkansas', ca: 'california',
  co: 'colorado', ct: 'connecticut', de: 'delaware', fl: 'florida', ga: 'georgia',
  hi: 'hawaii', id: 'idaho', il: 'illinois', in: 'indiana', ia: 'iowa',
  ks: 'kansas', ky: 'kentucky', la: 'louisiana', me: 'maine', md: 'maryland',
  ma: 'massachusetts', mi: 'michigan', mn: 'minnesota', ms: 'mississippi', mo: 'missouri',
  mt: 'montana', ne: 'nebraska', nv: 'nevada', nh: 'new hampshire', nj: 'new jersey',
  nm: 'new mexico', ny: 'new york', nc: 'north carolina', nd: 'north dakota', oh: 'ohio',
  ok: 'oklahoma', or: 'oregon', pa: 'pennsylvania', ri: 'rhode island', sc: 'south carolina',
  sd: 'south dakota', tn: 'tennessee', tx: 'texas', ut: 'utah', vt: 'vermont',
  va: 'virginia', wa: 'washington', wv: 'west virginia', wi: 'wisconsin', wy: 'wyoming',
  dc: 'district of columbia', pr: 'puerto rico',
};

// Initial seed data for San Mateo, California with exact NWS high/low and AM/PM conditions
const INITIAL_CURRENT: WeatherDayData = {
  dayLabel: '',
  icon: 'cloudy',
  conditionLabel: 'OVERCAST, SAN MATEO',
  amCondition: 'OVERCAST',
  pmCondition: 'MOSTLY SUNNY',
  temperature: 63,
  high: 76,
  low: 58,
  humidity: 79,
  precipitationChance: 1,
  wind: {
    speed: 5,
    direction: 'NNW',
    unit: 'mph',
  },
};

const INITIAL_FORECAST: WeatherDayData[] = [
  { dayLabel: 'WED', icon: 'partly-cloudy-day', conditionLabel: 'AM MOSTLY SUNNY\nPM SUNNY', amCondition: 'MOSTLY SUNNY', pmCondition: 'SUNNY', high: 82, low: 60, precipitationChance: 1 },
  { dayLabel: 'THU', icon: 'partly-cloudy-day', conditionLabel: 'AM PARTLY CLOUDY\nPM MOSTLY SUNNY', amCondition: 'PARTLY CLOUDY', pmCondition: 'MOSTLY SUNNY', high: 79, low: 59, precipitationChance: 2 },
  { dayLabel: 'FRI', icon: 'partly-cloudy-day', conditionLabel: 'AM OVERCAST\nPM SUNNY', amCondition: 'OVERCAST', pmCondition: 'SUNNY', high: 73, low: 56, precipitationChance: 7 },
  { dayLabel: 'SAT', icon: 'partly-cloudy-day', conditionLabel: 'AM MOSTLY SUNNY\nPM SUNNY', amCondition: 'MOSTLY SUNNY', pmCondition: 'SUNNY', high: 72, low: 56, precipitationChance: 0 },
  { dayLabel: 'SUN', icon: 'partly-cloudy-day', conditionLabel: 'AM MOSTLY SUNNY\nPM MOSTLY SUNNY', amCondition: 'MOSTLY SUNNY', pmCondition: 'MOSTLY SUNNY', high: 71, low: 56, precipitationChance: 0 },
];

export const useWeatherStore = create<WeatherState>((set, get) => ({
  locationInput: 'San Mateo, California',
  resolvedLocation: {
    name: 'San Mateo, California',
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
    get().fetchWeather();
  },

  setUnit: (unit: 'F' | 'C') => {
    set({ unit });
    get().fetchWeather();
  },

  setDisplayScale: (displayScale: 'sm' | 'md' | 'lg') => {
    set({ displayScale });
  },

  setRadarZoom: (zoom: number) => {
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
    const { locationInput, unit, lastFetchedAt } = get();
    const query = locationInput.trim();
    if (!query) return;

    set({ status: 'loading' });

    try {
      // Step 1 — Geocoding lookup with intelligent disambiguation
      let lat = 37.56299;
      let lon = -122.32553;
      let resolvedName = query;

      const isZip = /^\d{5}$/.test(query);
      let searchName = query;
      let targetState = '';
      let targetCountry = '';

      if (!isZip) {
        if (query.includes(',')) {
          const parts = query.split(',').map((p) => p.trim());
          searchName = parts[0];
          const secondPart = (parts[1] || '').toLowerCase();
          if (US_STATES_LOOKUP[secondPart]) {
            targetState = US_STATES_LOOKUP[secondPart];
            targetCountry = 'united states';
          } else if (secondPart === 'usa' || secondPart === 'us' || secondPart === 'united states') {
            targetCountry = 'united states';
          } else if (secondPart === 'uk' || secondPart === 'gb' || secondPart === 'united kingdom') {
            targetCountry = 'united kingdom';
          } else {
            const stateEntry = Object.entries(US_STATES_LOOKUP).find(([_, name]) => name === secondPart);
            if (stateEntry) {
              targetState = stateEntry[1];
              targetCountry = 'united states';
            } else {
              targetState = secondPart;
            }
          }
        } else {
          const tokens = query.split(/\s+/);
          if (tokens.length >= 2) {
            const lastToken = tokens[tokens.length - 1].toLowerCase();
            if (US_STATES_LOOKUP[lastToken]) {
              targetState = US_STATES_LOOKUP[lastToken];
              targetCountry = 'united states';
              searchName = tokens.slice(0, -1).join(' ');
            }
          }
        }
      }

      // Fetch candidates from Open-Meteo Geocoding API
      const geocodeRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=10`
      );

      if (!geocodeRes.ok) {
        throw new Error(`Geocoding HTTP ${geocodeRes.status}`);
      }

      const geocodeData = await geocodeRes.json();
      let results: any[] = geocodeData.results || [];

      // Fallback search with raw query if primary search produced no results
      if (results.length === 0 && searchName !== query) {
        const rawRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10`
        );
        if (rawRes.ok) {
          const rawData = await rawRes.json();
          if (rawData.results && rawData.results.length > 0) {
            results = rawData.results;
          }
        }
      }

      if (results.length > 0) {
        let best = results[0];
        let bestScore = -9999;

        for (const r of results) {
          let score = 0;
          const admin1 = (r.admin1 || '').toLowerCase();
          const country = (r.country || '').toLowerCase();
          const countryCode = (r.country_code || '').toLowerCase();
          const name = (r.name || '').toLowerCase();

          // Exact or prefix name matching
          if (name === searchName.toLowerCase()) {
            score += 15;
          } else if (name.startsWith(searchName.toLowerCase())) {
            score += 8;
          }

          // Target state match
          if (targetState) {
            if (admin1 === targetState || admin1.includes(targetState)) {
              score += 50;
            } else {
              score -= 20;
            }
          }

          // Target country match
          if (targetCountry) {
            if (country === targetCountry || country.includes(targetCountry) || countryCode === targetCountry) {
              score += 30;
            } else if (targetCountry === 'united states' && countryCode === 'us') {
              score += 30;
            } else {
              score -= 15;
            }
          }

          // US disambiguation preference when no country or state is specified
          if (!targetCountry && !targetState && countryCode === 'us') {
            score += 5;
          }

          // Population weighting
          if (r.population && r.population > 0) {
            score += Math.min(20, Math.log10(r.population) * 3);
          }

          if (score > bestScore) {
            bestScore = score;
            best = r;
          }
        }

        lat = best.latitude;
        lon = best.longitude;
        const stateOrCountry = best.admin1 || best.country || '';
        resolvedName = stateOrCountry ? `${best.name}, ${stateOrCountry}` : best.name;

        set({
          resolvedLocation: {
            name: resolvedName,
            lat,
            lon,
          },
        });
      } else {
        throw new Error(`Location not found for "${query}"`);
      }

      // Step 2 — Forecast request (NWS for US locations, Open-Meteo for international / fallback)
      let currentDayData: WeatherDayData | null = null;
      let forecastDays: WeatherDayData[] = [];
      let nwsSucceeded = false;

      const isUSLocation = targetCountry === 'united states' || (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66);

      if (isUSLocation) {
        try {
          const pointRes = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, {
            headers: { 'User-Agent': 'WeatherStudioApp/1.0 (contact@example.com)' },
          });

          if (pointRes.ok) {
            const pointData = await pointRes.json();
            const forecastUrl = pointData.properties?.forecast;
            const hourlyUrl = pointData.properties?.forecastHourly;

            if (forecastUrl) {
              const [fRes, hRes] = await Promise.all([
                fetch(forecastUrl, { headers: { 'User-Agent': 'WeatherStudioApp/1.0 (contact@example.com)' } }),
                hourlyUrl
                  ? fetch(hourlyUrl, { headers: { 'User-Agent': 'WeatherStudioApp/1.0 (contact@example.com)' } })
                  : Promise.resolve(null),
              ]);

              if (fRes.ok) {
                const fData = await fRes.json();
                const periods: any[] = fData.properties?.periods || [];
                const hPeriods: any[] = hRes && hRes.ok ? (await hRes.json()).properties?.periods || [] : [];

                if (periods.length > 0) {
                  // Group periods by date string (YYYY-MM-DD)
                  const daysMap = new Map<string, { dateStr: string; dayPeriod: any; nightPeriod: any }>();
                  for (const p of periods) {
                    const dateStr = (p.startTime || '').split('T')[0];
                    if (dateStr) {
                      if (!daysMap.has(dateStr)) {
                        daysMap.set(dateStr, { dateStr, dayPeriod: null, nightPeriod: null });
                      }
                      const entry = daysMap.get(dateStr)!;
                      if (p.isDaytime && !entry.dayPeriod) entry.dayPeriod = p;
                      else if (!p.isDaytime && !entry.nightPeriod) entry.nightPeriod = p;
                    }
                  }

                  const sortedDates = Array.from(daysMap.keys()).sort();

                  if (sortedDates.length >= 2) {
                    // Today processing
                    const todayKey = sortedDates[0];
                    const todayEntry = daysMap.get(todayKey)!;
                    const firstPeriod = periods[0];
                    const firstHourly = hPeriods[0];

                    let rawTodayHighF = todayEntry.dayPeriod?.temperature ?? firstPeriod.temperature;
                    let rawTodayLowF = todayEntry.nightPeriod?.temperature ?? (rawTodayHighF - 15);
                    let rawCurrentTempF = firstHourly?.temperature ?? firstPeriod.temperature;

                    const todayHigh = unit === 'C' ? Math.round(((rawTodayHighF - 32) * 5) / 9) : rawTodayHighF;
                    const todayLow = unit === 'C' ? Math.round(((rawTodayLowF - 32) * 5) / 9) : rawTodayLowF;
                    const currentTemp = unit === 'C' ? Math.round(((rawCurrentTempF - 32) * 5) / 9) : rawCurrentTempF;

                    const todayWindSpeedMatch = (firstPeriod.windSpeed || '').match(/\d+/g);
                    const todayWindSpeed = todayWindSpeedMatch
                      ? Math.round(Number(todayWindSpeedMatch[todayWindSpeedMatch.length - 1]))
                      : 5;

                    const todayCondText = firstPeriod.shortForecast || 'OVERCAST';
                    const parsedTodayCond = parseNwsCondition(todayCondText);

                    currentDayData = {
                      dayLabel: '',
                      icon: nwsToIcon(todayCondText, firstPeriod.isDaytime),
                      conditionLabel: `${parsedTodayCond}, ${resolvedName.split(',')[0].trim().toUpperCase()}`,
                      amCondition: parsedTodayCond,
                      pmCondition: parsedTodayCond,
                      temperature: currentTemp,
                      high: todayHigh,
                      low: todayLow,
                      humidity: firstHourly?.relativeHumidity?.value ? Math.round(firstHourly.relativeHumidity.value) : 75,
                      precipitationChance: firstPeriod.probabilityOfPrecipitation?.value ?? undefined,
                      wind: {
                        speed: unit === 'C' ? Math.round(todayWindSpeed * 1.60934) : todayWindSpeed,
                        direction: firstPeriod.windDirection || 'NW',
                        unit: unit === 'C' ? 'kph' : 'mph',
                      },
                    };

                    // 5-Day Forecast Days processing
                    const forecastDates = sortedDates.slice(1, 6);
                    for (const d of forecastDates) {
                      const entry = daysMap.get(d)!;
                      const [yr, mo, da] = d.split('-').map(Number);
                      const dateObj = new Date(yr, mo - 1, da, 12, 0, 0);
                      const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

                      const rawHighF = entry.dayPeriod
                        ? entry.dayPeriod.temperature
                        : entry.nightPeriod
                        ? entry.nightPeriod.temperature + 12
                        : 75;
                      const rawLowF = entry.nightPeriod
                        ? entry.nightPeriod.temperature
                        : entry.dayPeriod
                        ? entry.dayPeriod.temperature - 15
                        : 55;

                      const high = unit === 'C' ? Math.round(((rawHighF - 32) * 5) / 9) : rawHighF;
                      const low = unit === 'C' ? Math.round(((rawLowF - 32) * 5) / 9) : rawLowF;

                      let amCond = 'MOSTLY SUNNY';
                      let pmCond = 'SUNNY';

                      const amH = hPeriods.find(
                        (hp) =>
                          hp.startTime.startsWith(`${d}T08:`) ||
                          hp.startTime.startsWith(`${d}T09:`) ||
                          hp.startTime.startsWith(`${d}T10:`)
                      );
                      const pmH = hPeriods.find(
                        (hp) =>
                          hp.startTime.startsWith(`${d}T13:`) ||
                          hp.startTime.startsWith(`${d}T14:`) ||
                          hp.startTime.startsWith(`${d}T15:`)
                      );

                      if (amH) {
                        amCond = parseNwsCondition(amH.shortForecast);
                      } else if (entry.dayPeriod) {
                        const text = entry.dayPeriod.shortForecast || '';
                        if (text.toLowerCase().includes('then')) {
                          const parts = text.split(/then/i);
                          amCond = parseNwsCondition(parts[0]);
                          pmCond = parseNwsCondition(parts[1]);
                        } else {
                          amCond = parseNwsCondition(text);
                          pmCond = parseNwsCondition(text);
                        }
                      }

                      if (pmH) {
                        pmCond = parseNwsCondition(pmH.shortForecast);
                      } else if (entry.dayPeriod && !amH) {
                        pmCond = parseNwsCondition(entry.dayPeriod.shortForecast);
                      }

                      const icon = deriveDayForecastIcon(amCond, pmCond);
                      const conditionLabel = `AM ${amCond}\nPM ${pmCond}`;

                      forecastDays.push({
                        dayLabel,
                        icon,
                        conditionLabel,
                        amCondition: amCond,
                        pmCondition: pmCond,
                        high,
                        low,
                        precipitationChance:
                          entry.dayPeriod?.probabilityOfPrecipitation?.value ??
                          entry.nightPeriod?.probabilityOfPrecipitation?.value ??
                          undefined,
                      });
                    }

                    nwsSucceeded = forecastDays.length >= 5 && currentDayData !== null;
                  }
                }
              }
            }
          }
        } catch (nwsErr) {
          console.warn('NWS API fallback to Open-Meteo:', nwsErr);
          nwsSucceeded = false;
        }
      }

      // Step 3 — Open-Meteo (for international locations or if NWS was unavailable)
      if (!nwsSucceeded) {
        const tempUnitParam = unit === 'C' ? 'celsius' : 'fahrenheit';
        const windUnitParam = unit === 'C' ? 'kmh' : 'mph';

        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=weather_code&temperature_unit=${tempUnitParam}&wind_speed_unit=${windUnitParam}&timezone=auto&forecast_days=7`;

        const forecastRes = await fetch(forecastUrl);
        if (!forecastRes.ok) {
          throw new Error(`Forecast HTTP ${forecastRes.status}`);
        }

        const data = await forecastRes.json();

        if (!data.current || !data.daily) {
          throw new Error('Invalid weather payload');
        }

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
        const currentHumidity =
          data.current.relative_humidity_2m !== undefined
            ? Math.round(data.current.relative_humidity_2m)
            : undefined;
        const currentPrecip =
          data.daily.precipitation_probability_max?.[0] !== undefined
            ? Math.round(data.daily.precipitation_probability_max[0])
            : undefined;

        currentDayData = {
          dayLabel: '',
          icon: currentCondition.icon,
          amIcon: todayCondition.amIcon,
          pmIcon: todayCondition.pmIcon,
          conditionLabel: `${todayCondition.amCondition}, ${resolvedName.split(',')[0].trim().toUpperCase()}`,
          amCondition: todayCondition.amCondition,
          pmCondition: todayCondition.pmCondition,
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

        // Process 5-day Forecast (indices 1..5)
        forecastDays = [];

        for (let i = 1; i <= 5; i++) {
          if (i < dailyTimes.length) {
            const dateStr = dailyTimes[i];
            const [yr, mo, da] = dateStr.split('-').map(Number);
            const dateObj = new Date(yr, mo - 1, da, 12, 0, 0);
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
              icon: deriveDayForecastIcon(dayCondition.amCondition, dayCondition.pmCondition),
              amIcon: dayCondition.amIcon,
              pmIcon: dayCondition.pmIcon,
              conditionLabel: dayCondition.label,
              amCondition: dayCondition.amCondition,
              pmCondition: dayCondition.pmCondition,
              high: Math.round(dailyMaxes[i] ?? 0),
              low: Math.round(dailyMins[i] ?? 0),
              precipitationChance:
                data.daily.precipitation_probability_max?.[i] !== undefined
                  ? Math.round(data.daily.precipitation_probability_max[i])
                  : undefined,
            });
          }
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

// Automatically trigger live weather fetch on boot
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useWeatherStore.getState().fetchWeather();
  }, 0);
}
