import {
  HourlyForecastSnapshot,
  CurrentWeatherSnapshot,
  WeatherTrendResult,
  WeatherTrendThresholds,
  DEFAULT_WEATHER_TREND_THRESHOLDS,
} from '../types/weatherTrend';

// Helper to determine if a WMO weather code indicates snow
export function isSnowWmoCode(code: number): boolean {
  return [71, 73, 75, 77, 85, 86].includes(code);
}

// Helper to determine if a WMO weather code indicates rain / drizzle / thunderstorm
export function isRainWmoCode(code: number): boolean {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
}

// Helper to determine if a WMO weather code is clear / mainly sunny
export function isClearWmoCode(code: number): boolean {
  return code === 0 || code === 1;
}

// Helper to determine if a WMO weather code is overcast / foggy
export function isOvercastWmoCode(code: number): boolean {
  return code === 3 || code === 45 || code === 48;
}

/**
 * Pure evaluation function for calculating the most meaningful weather trend
 * for the upcoming several hours.
 */
export function evaluateWeatherTrend(
  hourly: HourlyForecastSnapshot | null | undefined,
  current: CurrentWeatherSnapshot | null | undefined,
  unit: 'F' | 'C' = 'F',
  customThresholds?: Partial<WeatherTrendThresholds>
): WeatherTrendResult {
  const thresholds: WeatherTrendThresholds = {
    ...DEFAULT_WEATHER_TREND_THRESHOLDS,
    ...customThresholds,
  };

  const tempThreshold =
    unit === 'C' ? thresholds.tempChangeThresholdC : thresholds.tempChangeThresholdF;
  const windIncreaseThreshold =
    unit === 'C'
      ? thresholds.windSpeedIncreaseThresholdKmh
      : thresholds.windSpeedIncreaseThresholdMph;
  const windDecreaseThreshold =
    unit === 'C'
      ? thresholds.windSpeedDecreaseThresholdKmh
      : thresholds.windSpeedDecreaseThresholdMph;
  const windUnit = unit === 'C' ? 'KM/H' : 'MPH';

  // Fallback stable result
  const stableFallback: WeatherTrendResult = {
    type: 'stable',
    headline: 'STABLE',
    detail: 'Little change expected over the next few hours.',
    iconName: 'stable',
    colorTheme: 'slate',
  };

  if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
    return stableFallback;
  }

  // Determine the starting index in hourly arrays
  let startIndex = 0;
  if (current?.time && hourly.time.length > 0) {
    const currentHourStr = current.time.slice(0, 13); // "YYYY-MM-DDTHH"
    const matchIdx = hourly.time.findIndex((t) => t.startsWith(currentHourStr));
    if (matchIdx !== -1) {
      startIndex = matchIdx;
    }
  }

  const lookahead = thresholds.lookaheadHours;
  const endIndex = Math.min(hourly.time.length - 1, startIndex + lookahead);
  const validLength = endIndex - startIndex;

  if (validLength < 1) {
    return stableFallback;
  }

  // Extract slices for lookahead
  const times = hourly.time.slice(startIndex, endIndex + 1);
  const temps = hourly.temperature_2m?.slice(startIndex, endIndex + 1) || [];
  const precipProbs = hourly.precipitation_probability?.slice(startIndex, endIndex + 1) || [];
  const precipSums = hourly.precipitation?.slice(startIndex, endIndex + 1) || [];
  const rainSums = hourly.rain?.slice(startIndex, endIndex + 1) || [];
  const snowSums = hourly.snowfall?.slice(startIndex, endIndex + 1) || [];
  const weatherCodes = hourly.weather_code?.slice(startIndex, endIndex + 1) || [];
  const windSpeeds = hourly.wind_speed_10m?.slice(startIndex, endIndex + 1) || [];
  const clouds = hourly.cloud_cover?.slice(startIndex, endIndex + 1) || [];

  const currentCode = current?.weather_code ?? (weatherCodes.length > 0 ? weatherCodes[0] : 0);
  const currentTemp = current?.temperature ?? (temps.length > 0 ? temps[0] : 70);
  const currentWind = current?.wind_speed ?? (windSpeeds.length > 0 ? windSpeeds[0] : 5);
  const currentPrecipProb =
    current?.precipitation_probability ?? (precipProbs.length > 0 ? precipProbs[0] : 0);
  const currentCloud = current?.cloud_cover ?? (clouds.length > 0 ? clouds[0] : 20);

  // Helper for finding the relative hour offset
  const getHourOffset = (relativeIdx: number): number => {
    return Math.max(1, relativeIdx);
  };

  // Helper for formatting time from ISO string
  const formatTimeLabel = (isoStr?: string): string => {
    if (!isoStr) return '';
    const parts = isoStr.split('T')[1]?.split(':');
    if (!parts) return '';
    let hour = parseInt(parts[0], 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour} ${ampm}`;
  };

  // -------------------------------------------------------------
  // 1. SNOW EVALUATION (High Priority)
  // -------------------------------------------------------------
  const isCurrentlySnowing = isSnowWmoCode(currentCode);
  if (!isCurrentlySnowing) {
    for (let i = 1; i < weatherCodes.length; i++) {
      const code = weatherCodes[i];
      const snowAmount = snowSums[i] ?? 0;
      if (isSnowWmoCode(code) || snowAmount > 0.1) {
        const offset = getHourOffset(i);
        const timeLabel = formatTimeLabel(times[i]);
        return {
          type: 'snow-developing',
          headline: 'SNOW DEVELOPING',
          detail: timeLabel ? `Expected around ${timeLabel} (${offset} HR)` : `Snow starting in ~${offset} HR`,
          iconName: 'snow',
          colorTheme: 'blue',
          confidence: 'high',
        };
      }
    }
  } else {
    // Check if snow ends in the window
    let clearingIdx = -1;
    for (let i = 1; i < weatherCodes.length; i++) {
      const code = weatherCodes[i];
      const snowAmount = snowSums[i] ?? 0;
      if (!isSnowWmoCode(code) && snowAmount === 0) {
        clearingIdx = i;
        break;
      }
    }
    if (clearingIdx !== -1) {
      const offset = getHourOffset(clearingIdx);
      return {
        type: 'snow-ending',
        headline: 'SNOW ENDING',
        detail: `Tapering off in ~${offset} HR`,
        iconName: 'snow',
        colorTheme: 'sky',
      };
    }
  }

  // -------------------------------------------------------------
  // 2. RAIN DEVELOPING / ENDING (High Priority)
  // -------------------------------------------------------------
  const isCurrentlyRaining = isRainWmoCode(currentCode);
  if (!isCurrentlyRaining) {
    for (let i = 1; i < weatherCodes.length; i++) {
      const code = weatherCodes[i];
      const prob = precipProbs[i] ?? 0;
      const rainAmt = (rainSums[i] ?? 0) + (precipSums[i] ?? 0);

      if (isRainWmoCode(code) || (prob >= 50 && rainAmt > 0.1) || prob >= 70) {
        const offset = getHourOffset(i);
        const timeLabel = formatTimeLabel(times[i]);
        const probText = prob > 0 ? `${Math.round(prob)}% chance` : 'Rain';
        return {
          type: 'rain-developing',
          headline: 'RAIN DEVELOPING',
          detail: timeLabel ? `${probText} near ${timeLabel} (in ${offset} HR)` : `${probText} in ~${offset} HR`,
          iconName: 'rain',
          colorTheme: 'blue',
          confidence: 'high',
        };
      }
    }
  } else {
    // Currently raining: check if it ends
    let rainEndsIdx = -1;
    for (let i = 1; i < weatherCodes.length; i++) {
      const code = weatherCodes[i];
      const prob = precipProbs[i] ?? 0;
      const rainAmt = (rainSums[i] ?? 0) + (precipSums[i] ?? 0);
      if (!isRainWmoCode(code) && rainAmt === 0 && prob < 30) {
        rainEndsIdx = i;
        break;
      }
    }
    if (rainEndsIdx !== -1) {
      const offset = getHourOffset(rainEndsIdx);
      return {
        type: 'rain-ending',
        headline: 'RAIN ENDING',
        detail: `Clearing in ~${offset} HR`,
        iconName: 'rain',
        colorTheme: 'sky',
      };
    }
  }

  // -------------------------------------------------------------
  // 3. PRECIPITATION PROBABILITY SURGE / DROP
  // -------------------------------------------------------------
  if (precipProbs.length >= 2) {
    const maxProb = Math.max(...precipProbs.slice(1));
    const maxProbIdx = precipProbs.findIndex((p, idx) => idx > 0 && p === maxProb);
    const probDelta = maxProb - currentPrecipProb;

    if (probDelta >= thresholds.precipProbIncreaseThreshold && maxProb >= 50) {
      const offset = getHourOffset(maxProbIdx);
      return {
        type: 'precip-increasing',
        headline: 'PRECIP CHANCE ↑',
        detail: `${Math.round(currentPrecipProb)}% → ${Math.round(maxProb)}% in ${offset} HR`,
        iconName: 'rain',
        colorTheme: 'sky',
      };
    }

    if (currentPrecipProb >= 60) {
      const minProb = Math.min(...precipProbs.slice(1));
      const minProbIdx = precipProbs.findIndex((p, idx) => idx > 0 && p === minProb);
      const dropDelta = currentPrecipProb - minProb;
      if (dropDelta >= thresholds.precipProbDecreaseThreshold && minProb <= 25) {
        const offset = getHourOffset(minProbIdx);
        return {
          type: 'precip-decreasing',
          headline: 'PRECIP CHANCE ↓',
          detail: `${Math.round(currentPrecipProb)}% → ${Math.round(minProb)}% in ${offset} HR`,
          iconName: 'sun',
          colorTheme: 'amber',
        };
      }
    }
  }

  // -------------------------------------------------------------
  // 4. SIGNIFICANT TEMPERATURE DROP / RISE
  // -------------------------------------------------------------
  if (temps.length >= 2) {
    const endTemp = temps[temps.length - 1];
    const tempDelta = endTemp - currentTemp;

    // Check peak drop or rise within window
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const dropDelta = currentTemp - minTemp;
    const riseDelta = maxTemp - currentTemp;

    if (dropDelta >= tempThreshold) {
      const minIdx = temps.indexOf(minTemp);
      const offset = getHourOffset(minIdx);
      return {
        type: 'temp-dropping',
        headline: 'TEMP DROPPING',
        detail: `${Math.round(currentTemp)}° → ${Math.round(minTemp)}° NEXT ${offset} HR`,
        iconName: 'temp-down',
        colorTheme: 'blue',
      };
    }

    if (riseDelta >= tempThreshold) {
      const maxIdx = temps.indexOf(maxTemp);
      const offset = getHourOffset(maxIdx);
      return {
        type: 'temp-rising',
        headline: 'TEMP RISING',
        detail: `${Math.round(currentTemp)}° → ${Math.round(maxTemp)}° NEXT ${offset} HR`,
        iconName: 'temp-up',
        colorTheme: 'amber',
      };
    }
  }

  // -------------------------------------------------------------
  // 5. SIGNIFICANT WIND SPEED CHANGES
  // -------------------------------------------------------------
  if (windSpeeds.length >= 2) {
    const maxWind = Math.max(...windSpeeds.slice(1));
    const maxWindIdx = windSpeeds.findIndex((w, idx) => idx > 0 && w === maxWind);
    const windIncrease = maxWind - currentWind;

    if (windIncrease >= windIncreaseThreshold && maxWind >= 18) {
      const offset = getHourOffset(maxWindIdx);
      return {
        type: 'wind-increasing',
        headline: 'WIND INCREASING',
        detail: `${Math.round(currentWind)} → ${Math.round(maxWind)} ${windUnit} IN ${offset} HR`,
        iconName: 'wind-up',
        colorTheme: 'amber',
      };
    }

    if (currentWind >= 20) {
      const minWind = Math.min(...windSpeeds.slice(1));
      const minWindIdx = windSpeeds.findIndex((w, idx) => idx > 0 && w === minWind);
      const windDrop = currentWind - minWind;
      if (windDrop >= windDecreaseThreshold) {
        const offset = getHourOffset(minWindIdx);
        return {
          type: 'wind-easing',
          headline: 'WIND EASING',
          detail: `${Math.round(currentWind)} → ${Math.round(minWind)} ${windUnit} IN ${offset} HR`,
          iconName: 'wind-down',
          colorTheme: 'emerald',
        };
      }
    }
  }

  // -------------------------------------------------------------
  // 6. SKY / CLOUD COVER TRANSITIONS
  // -------------------------------------------------------------
  if (clouds.length >= 2 || weatherCodes.length >= 2) {
    const isCurrentlyCloudy = isOvercastWmoCode(currentCode) || currentCloud > 70;
    const isCurrentlyClear = isClearWmoCode(currentCode) || currentCloud < 30;

    // Check for Clearing Skies
    if (isCurrentlyCloudy) {
      let clearIdx = -1;
      for (let i = 1; i < weatherCodes.length; i++) {
        const code = weatherCodes[i];
        const cloud = clouds[i] ?? 50;
        if (isClearWmoCode(code) || cloud <= 25) {
          clearIdx = i;
          break;
        }
      }
      if (clearIdx !== -1) {
        const offset = getHourOffset(clearIdx);
        const timeLabel = formatTimeLabel(times[clearIdx]);
        return {
          type: 'clearing',
          headline: 'CLEARING SKIES',
          detail: timeLabel ? `Clear by ${timeLabel}` : `Clearing in ~${offset} HR`,
          iconName: 'sun',
          colorTheme: 'amber',
        };
      }
    }

    // Check for Clouds Building
    if (isCurrentlyClear) {
      let cloudyIdx = -1;
      for (let i = 1; i < weatherCodes.length; i++) {
        const code = weatherCodes[i];
        const cloud = clouds[i] ?? 20;
        if (isOvercastWmoCode(code) || cloud >= 80) {
          cloudyIdx = i;
          break;
        }
      }
      if (cloudyIdx !== -1) {
        const offset = getHourOffset(cloudyIdx);
        const timeLabel = formatTimeLabel(times[cloudyIdx]);
        return {
          type: 'clouds-building',
          headline: 'CLOUDS BUILDING',
          detail: timeLabel ? `Overcast by ${timeLabel}` : `Overcast in ~${offset} HR`,
          iconName: 'cloud',
          colorTheme: 'slate',
        };
      }
    }
  }

  // -------------------------------------------------------------
  // 7. STABLE (Default when no meaningful change occurs)
  // -------------------------------------------------------------
  return stableFallback;
}
