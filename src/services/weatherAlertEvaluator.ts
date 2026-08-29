import {
  OpenMeteoForecastResponse,
  WeatherAlert,
  AlertType,
  AlertSeverity,
} from '../types/weatherAlerts';
import {
  DEFAULT_WEATHER_ALERT_THRESHOLDS,
  WeatherAlertThresholdConfig,
} from './weatherAlertThresholds';
import { getWeatherCodeInfo } from './openMeteoWeatherCodeMap';

/**
 * Parses and computes human-friendly relative timing from Open-Meteo ISO timestamps
 * using the forecast location's local time perspective.
 */
export function deriveRelativeTiming(
  targetIsoTime: string | undefined,
  referenceNowIsoTime: string | undefined,
  currentHourIndex: number = 0,
  eventHourIndex: number = 0
): string {
  if (eventHourIndex === 0 || (currentHourIndex === 0 && eventHourIndex === 0)) {
    return 'NOW';
  }

  const hourDiff = eventHourIndex - currentHourIndex;

  if (hourDiff <= 1) return 'NEXT HOUR';
  if (hourDiff <= 3) return 'NEXT 3 HOURS';
  if (hourDiff <= 6) return 'NEXT 6 HOURS';

  if (targetIsoTime) {
    try {
      // Parse local hour from ISO string like "2026-08-25T15:00"
      const timePart = targetIsoTime.split('T')[1];
      const hour = timePart ? parseInt(timePart.split(':')[0], 10) : NaN;

      if (!isNaN(hour)) {
        if (hour >= 12 && hour < 17) return 'THIS AFTERNOON';
        if (hour >= 17 && hour < 21) return 'THIS EVENING';
        if (hour >= 21 || hour < 6) return 'TONIGHT';
        if (hour >= 6 && hour < 12) return 'TOMORROW MORNING';
      }
    } catch {
      // fallback to relative hours
    }
  }

  if (hourDiff <= 14) return 'TODAY';
  if (hourDiff <= 28) return 'TOMORROW';
  return 'NEXT 24 HOURS';
}

/**
 * Formats value with unit according to preferred system
 */
export function formatValue(val: number, unit?: string): string {
  const rounded = Number.isInteger(val) ? val : Number(val.toFixed(1));
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}

/**
 * Pure evaluator function that derives structured, normalized Weather Alerts
 * from Open-Meteo forecast data using configurable thresholds.
 */
export function evaluateWeatherAlerts(
  data: OpenMeteoForecastResponse | null | undefined,
  unit: 'F' | 'C' = 'F',
  customThresholds: WeatherAlertThresholdConfig = DEFAULT_WEATHER_ALERT_THRESHOLDS
): WeatherAlert[] {
  if (!data) return [];

  const alerts: WeatherAlert[] = [];
  const thresholds = customThresholds;

  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;

  const hourlyTimes = hourly?.time || [];
  const hourlyTemps = hourly?.temperature_2m || [];
  const hourlyApparentTemps = hourly?.apparent_temperature || [];
  const hourlyPrecipProb = hourly?.precipitation_probability || [];
  const hourlyPrecip = hourly?.precipitation || [];
  const hourlyRain = hourly?.rain || [];
  const hourlySnow = hourly?.snowfall || [];
  const hourlyCodes = hourly?.weather_code || [];
  const hourlyWindSpeed = hourly?.wind_speed_10m || [];
  const hourlyWindGusts = hourly?.wind_gusts_10m || [];
  const hourlyVisibility = hourly?.visibility || [];
  const hourlyCape = hourly?.cape || [];

  const dailyCodes = daily?.weather_code || [];
  const dailyMaxTemps = daily?.temperature_2m_max || [];
  const dailyMinTemps = daily?.temperature_2m_min || [];
  const dailyApparentMax = daily?.apparent_temperature_max || [];
  const dailyApparentMin = daily?.apparent_temperature_min || [];
  const dailyPrecipSum = daily?.precipitation_sum || [];
  const dailySnowSum = daily?.snowfall_sum || [];
  const dailyPrecipProbMax = daily?.precipitation_probability_max || [];
  const dailyWindSpeedMax = daily?.wind_speed_10m_max || [];
  const dailyWindGustsMax = daily?.wind_gusts_10m_max || [];
  const dailyUvIndexMax = daily?.uv_index_max || [];

  // Lookahead window: inspect the next 24 forecast hours (indices 0..23)
  const windowHours = Math.min(24, hourlyTimes.length);

  // Helper unit conversions if data is in metric vs imperial
  // Open-Meteo with precipitation_unit=inch, wind_speed_unit=mph/kmh, temperature_unit=fahrenheit/celsius
  const isCelsius = unit === 'C';
  const tempUnit = isCelsius ? '°C' : '°F';
  const windUnit = isCelsius ? 'km/h' : 'mph';
  const precipUnit = 'in';

  // Helper: Convert Fahrenheit threshold to Celsius if needed
  const toDisplayTemp = (fVal: number) => (isCelsius ? Math.round(((fVal - 32) * 5) / 9) : fVal);
  const toDisplayWind = (mphVal: number) => (isCelsius ? Math.round(mphVal * 1.60934) : mphVal);

  // Track conditions detected for composite "severe_weather_potential"
  const severeSignals: { name: string; severity: AlertSeverity; timing: string }[] = [];

  // ──────────────────────────────────────────────────────────────────────────
  // 1. HIGH WINDS & STRONG GUSTS (Evaluated Separately)
  // ──────────────────────────────────────────────────────────────────────────
  let maxSustainedWind = current?.wind_speed_10m ?? 0;
  let maxSustainedHourIdx = 0;
  let maxGusts = current?.wind_gusts_10m ?? (current?.wind_speed_10m ? current.wind_speed_10m * 1.3 : 0);
  let maxGustHourIdx = 0;

  for (let i = 0; i < windowHours; i++) {
    const ws = hourlyWindSpeed[i] ?? 0;
    const wg = hourlyWindGusts[i] ?? (ws * 1.3);
    if (ws > maxSustainedWind) {
      maxSustainedWind = ws;
      maxSustainedHourIdx = i;
    }
    if (wg > maxGusts) {
      maxGusts = wg;
      maxGustHourIdx = i;
    }
  }

  // Daily max check as well
  if (dailyWindSpeedMax[0] !== undefined && dailyWindSpeedMax[0] > maxSustainedWind) {
    maxSustainedWind = dailyWindSpeedMax[0];
  }
  if (dailyWindGustsMax[0] !== undefined && dailyWindGustsMax[0] > maxGusts) {
    maxGusts = dailyWindGustsMax[0];
  }

  const sustainedThreshold = toDisplayWind(thresholds.highWind.sustainedMphModerate);
  const sustainedHighThreshold = toDisplayWind(thresholds.highWind.sustainedMphHigh);
  const sustainedExtremeThreshold = toDisplayWind(thresholds.highWind.sustainedMphExtreme);

  if (maxSustainedWind >= sustainedThreshold) {
    const severity: AlertSeverity =
      maxSustainedWind >= sustainedExtremeThreshold
        ? 'extreme'
        : maxSustainedWind >= sustainedHighThreshold
        ? 'high'
        : 'moderate';

    const timing = deriveRelativeTiming(hourlyTimes[maxSustainedHourIdx], hourlyTimes[0], 0, maxSustainedHourIdx);
    const speedFormatted = `${Math.round(maxSustainedWind)} ${windUnit}`;

    alerts.push({
      id: `alert-high-wind-${Math.round(maxSustainedWind)}`,
      type: 'high_wind',
      severity,
      title: severity === 'extreme' ? 'EXTREME HIGH WINDS' : 'HIGH WINDS',
      description: `Sustained winds of ${speedFormatted} expected.`,
      detail: maxGusts > maxSustainedWind ? `Peak gusts up to ${Math.round(maxGusts)} ${windUnit}` : undefined,
      timing,
      value: Math.round(maxSustainedWind),
      unit: windUnit,
      iconKey: 'wind',
      source: 'open-meteo',
    });

    severeSignals.push({ name: 'high winds', severity, timing });
  }

  // Strong Gusts (if gusts significantly exceed moderate threshold or high wind wasn't triggered)
  const gustModerate = toDisplayWind(thresholds.strongGusts.gustsMphModerate);
  const gustHigh = toDisplayWind(thresholds.strongGusts.gustsMphHigh);
  const gustExtreme = toDisplayWind(thresholds.strongGusts.gustsMphExtreme);

  if (maxGusts >= gustModerate && (maxGusts >= maxSustainedWind + 8 || maxSustainedWind < sustainedThreshold)) {
    const severity: AlertSeverity =
      maxGusts >= gustExtreme ? 'extreme' : maxGusts >= gustHigh ? 'high' : 'moderate';

    const timing = deriveRelativeTiming(hourlyTimes[maxGustHourIdx], hourlyTimes[0], 0, maxGustHourIdx);
    const gustFormatted = `${Math.round(maxGusts)} ${windUnit}`;

    alerts.push({
      id: `alert-strong-gusts-${Math.round(maxGusts)}`,
      type: 'strong_gusts',
      severity,
      title: severity === 'extreme' ? 'DAMAGING WIND GUSTS' : 'STRONG GUSTS',
      description: `Wind gusts up to ${gustFormatted} expected.`,
      detail: `Sudden strong crosswinds possible.`,
      timing,
      value: Math.round(maxGusts),
      unit: windUnit,
      iconKey: 'wind',
      source: 'open-meteo',
    });

    if (severity === 'high' || severity === 'extreme') {
      severeSignals.push({ name: 'strong wind gusts', severity, timing });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. HEAVY RAIN
  // ──────────────────────────────────────────────────────────────────────────
  let maxHourlyRain = current?.precipitation ?? current?.rain ?? 0;
  let maxRainHourIdx = 0;
  let next3HrPrecipSum = 0;
  let maxPrecipProb = current ? 0 : 0;

  for (let i = 0; i < windowHours; i++) {
    const p = (hourlyPrecip[i] ?? hourlyRain[i]) ?? 0;
    const prob = hourlyPrecipProb[i] ?? 0;
    if (i < 3) next3HrPrecipSum += p;
    if (p > maxHourlyRain) {
      maxHourlyRain = p;
      maxRainHourIdx = i;
    }
    if (prob > maxPrecipProb) maxPrecipProb = prob;
  }

  const dailyRainTotal = dailyPrecipSum[0] ?? 0;
  const isHeavyRainWmo = [65, 82].includes(current?.weather_code ?? -1) ||
    hourlyCodes.slice(0, 6).some((c) => [65, 82].includes(c));

  const rainModThreshold = thresholds.heavyRain.hourlyInchesModerate;
  const rainHighThreshold = thresholds.heavyRain.hourlyInchesHigh;

  if (
    (maxHourlyRain >= rainModThreshold && maxPrecipProb >= thresholds.heavyRain.precipProbabilityMin) ||
    next3HrPrecipSum >= thresholds.heavyRain.sustained3HrInchesMin ||
    (dailyRainTotal >= thresholds.heavyRain.dailySumInchesMin && maxPrecipProb >= 60) ||
    isHeavyRainWmo
  ) {
    const severity: AlertSeverity =
      maxHourlyRain >= rainHighThreshold || next3HrPrecipSum >= 1.0 || dailyRainTotal >= 2.0
        ? 'high'
        : 'moderate';

    const timing = deriveRelativeTiming(hourlyTimes[maxRainHourIdx], hourlyTimes[0], 0, maxRainHourIdx);
    const rainAmtFormatted = next3HrPrecipSum >= 0.2
      ? `${next3HrPrecipSum.toFixed(2)} ${precipUnit} in next 3 hrs`
      : maxHourlyRain > 0
      ? `${maxHourlyRain.toFixed(2)} ${precipUnit}/hr rate`
      : `${dailyRainTotal.toFixed(2)} ${precipUnit} total`;

    alerts.push({
      id: `alert-heavy-rain-${Math.round(maxHourlyRain * 100)}`,
      type: 'heavy_rain',
      severity,
      title: 'HEAVY RAIN',
      description: `Heavy rain possible within the forecast window.`,
      detail: `${rainAmtFormatted} • Reduced road traction.`,
      timing,
      value: Number(maxHourlyRain.toFixed(2)),
      unit: precipUnit,
      iconKey: 'cloud-rain-wind',
      source: 'open-meteo',
    });

    severeSignals.push({ name: 'heavy rain', severity, timing });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. HEAVY SNOW / WINTER WEATHER
  // ──────────────────────────────────────────────────────────────────────────
  let maxHourlySnow = current?.snowfall ?? 0;
  let maxSnowHourIdx = 0;
  let hasSnowCode = false;

  for (let i = 0; i < windowHours; i++) {
    const s = hourlySnow[i] ?? 0;
    const code = hourlyCodes[i] ?? -1;
    if (s > maxHourlySnow) {
      maxHourlySnow = s;
      maxSnowHourIdx = i;
    }
    if (thresholds.heavySnow.snowCodes.includes(code)) {
      hasSnowCode = true;
    }
  }

  const dailySnowTotal = dailySnowSum[0] ?? 0;
  const currentCode = current?.weather_code ?? -1;
  const isCurrentSnow = thresholds.heavySnow.snowCodes.includes(currentCode);

  if (
    maxHourlySnow >= thresholds.heavySnow.hourlyInchesModerate ||
    dailySnowTotal >= thresholds.heavySnow.dailySumInchesMin ||
    hasSnowCode ||
    isCurrentSnow
  ) {
    const severity: AlertSeverity =
      maxHourlySnow >= thresholds.heavySnow.hourlyInchesHigh || dailySnowTotal >= 3.0 || currentCode === 75
        ? 'high'
        : 'moderate';

    const timing = deriveRelativeTiming(hourlyTimes[maxSnowHourIdx], hourlyTimes[0], 0, maxSnowHourIdx);
    const snowAmtFormatted = dailySnowTotal >= 0.5
      ? `${dailySnowTotal.toFixed(1)} ${precipUnit} accumulation`
      : `Active snowfall forecast`;

    alerts.push({
      id: `alert-heavy-snow-${Math.round(dailySnowTotal * 10)}`,
      type: 'heavy_snow',
      severity,
      title: severity === 'high' ? 'HEAVY SNOW' : 'SNOW EXPECTED',
      description: `Snowfall is forecast during the next several hours.`,
      detail: `${snowAmtFormatted} • Hazardous travel conditions.`,
      timing,
      value: Number(dailySnowTotal.toFixed(1)),
      unit: precipUnit,
      iconKey: 'snowflake',
      source: 'open-meteo',
    });

    severeSignals.push({ name: 'snowfall', severity, timing });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. THUNDERSTORM POTENTIAL
  // ──────────────────────────────────────────────────────────────────────────
  let maxCape = 0;
  let thunderstormHourIdx = -1;
  let hasSevereHailCode = false;
  let hasStandardThunderCode = false;

  for (let i = 0; i < windowHours; i++) {
    const code = hourlyCodes[i] ?? -1;
    const cape = hourlyCape[i] ?? 0;
    if (cape > maxCape) maxCape = cape;

    if (thresholds.thunderstorm.severeCodes.includes(code)) {
      hasSevereHailCode = true;
      if (thunderstormHourIdx === -1) thunderstormHourIdx = i;
    } else if (thresholds.thunderstorm.codes.includes(code)) {
      hasStandardThunderCode = true;
      if (thunderstormHourIdx === -1) thunderstormHourIdx = i;
    }
  }

  if (thresholds.thunderstorm.codes.includes(currentCode)) hasStandardThunderCode = true;
  if (thresholds.thunderstorm.severeCodes.includes(currentCode)) hasSevereHailCode = true;

  if (hasSevereHailCode || hasStandardThunderCode || maxCape >= thresholds.thunderstorm.capeJkgModerate) {
    const isSevere = hasSevereHailCode || (hasStandardThunderCode && maxCape >= thresholds.thunderstorm.capeJkgHigh);
    const severity: AlertSeverity = isSevere ? 'high' : 'moderate';
    const timingHourIdx = thunderstormHourIdx >= 0 ? thunderstormHourIdx : 0;
    const timing = deriveRelativeTiming(hourlyTimes[timingHourIdx], hourlyTimes[0], 0, timingHourIdx);

    alerts.push({
      id: `alert-thunderstorm-${hasSevereHailCode ? 'hail' : 'active'}`,
      type: 'thunderstorm',
      severity,
      title: hasSevereHailCode ? 'THUNDERSTORM WITH HAIL' : 'THUNDERSTORM POTENTIAL',
      description: `Thunderstorms are possible during the forecast period.`,
      detail: hasSevereHailCode
        ? `Hail and turbulent winds possible.`
        : maxCape >= 1500
        ? `Elevated atmospheric instability (CAPE: ${Math.round(maxCape)} J/kg).`
        : `Lightning and sudden downpours possible.`,
      timing,
      value: Math.round(maxCape),
      unit: 'J/kg',
      iconKey: 'cloud-lightning',
      source: 'open-meteo',
    });

    severeSignals.push({ name: 'thunderstorms', severity, timing });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. LOW VISIBILITY (Fog / Mist / Haze)
  // ──────────────────────────────────────────────────────────────────────────
  let minVisibilityMeters = current?.visibility ?? 50000;
  let minVisHourIdx = 0;
  let hasDenseFogCode = thresholds.lowVisibility.fogCodes.includes(currentCode);

  for (let i = 0; i < windowHours; i++) {
    const v = hourlyVisibility[i];
    const code = hourlyCodes[i] ?? -1;
    if (v !== undefined && v < minVisibilityMeters) {
      minVisibilityMeters = v;
      minVisHourIdx = i;
    }
    if (thresholds.lowVisibility.fogCodes.includes(code)) {
      hasDenseFogCode = true;
    }
  }

  // Convert meters to miles or km
  // 1 mile ≈ 1609.34 meters
  const minVisMiles = minVisibilityMeters / 1609.34;
  const minVisKm = minVisibilityMeters / 1000;

  if (minVisMiles <= thresholds.lowVisibility.visibilityMilesModerate || hasDenseFogCode) {
    const severity: AlertSeverity =
      minVisMiles <= thresholds.lowVisibility.visibilityMilesExtreme
        ? 'extreme'
        : minVisMiles <= thresholds.lowVisibility.visibilityMilesHigh
        ? 'high'
        : 'moderate';

    const timing = deriveRelativeTiming(hourlyTimes[minVisHourIdx], hourlyTimes[0], 0, minVisHourIdx);
    const visDisplay = isCelsius
      ? `${minVisKm < 1 ? (minVisKm * 1000).toFixed(0) + ' m' : minVisKm.toFixed(1) + ' km'}`
      : `${minVisMiles.toFixed(1)} miles`;

    alerts.push({
      id: `alert-low-visibility-${Math.round(minVisMiles * 10)}`,
      type: 'low_visibility',
      severity,
      title: hasDenseFogCode ? 'DENSE FOG ADVISORY' : 'LOW VISIBILITY',
      description: `Visibility may fall below ${isCelsius ? (thresholds.lowVisibility.visibilityMilesHigh * 1.6).toFixed(1) + ' km' : '1 mile'}.`,
      detail: `Minimum visibility around ${visDisplay}. Reduced atmospheric visibility.`,
      timing,
      value: Number(minVisMiles.toFixed(1)),
      unit: isCelsius ? 'km' : 'mi',
      iconKey: 'haze',
      source: 'open-meteo',
    });

    if (severity === 'high' || severity === 'extreme') {
      severeSignals.push({ name: 'low visibility', severity, timing });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. EXTREME HEAT
  // ──────────────────────────────────────────────────────────────────────────
  let maxTempF = current?.temperature_2m ?? 0;
  let maxApparentF = current?.apparent_temperature ?? maxTempF;
  let maxHeatHourIdx = 0;

  for (let i = 0; i < windowHours; i++) {
    const t = hourlyTemps[i] ?? 0;
    const at = hourlyApparentTemps[i] ?? t;
    if (t > maxTempF) {
      maxTempF = t;
      maxHeatHourIdx = i;
    }
    if (at > maxApparentF) {
      maxApparentF = at;
    }
  }

  if (dailyMaxTemps[0] !== undefined && dailyMaxTemps[0] > maxTempF) {
    maxTempF = dailyMaxTemps[0];
  }
  if (dailyApparentMax[0] !== undefined && dailyApparentMax[0] > maxApparentF) {
    maxApparentF = dailyApparentMax[0];
  }

  // Check heat threshold in Fahrenheit (convert if data was in C)
  const effectiveMaxTempF = isCelsius ? (maxTempF * 9) / 5 + 32 : maxTempF;
  const effectiveApparentF = isCelsius ? (maxApparentF * 9) / 5 + 32 : maxApparentF;

  if (
    effectiveMaxTempF >= thresholds.extremeHeat.tempFHigh ||
    effectiveApparentF >= thresholds.extremeHeat.apparentTempFHigh
  ) {
    const isExtreme =
      effectiveMaxTempF >= thresholds.extremeHeat.tempFExtreme ||
      effectiveApparentF >= thresholds.extremeHeat.apparentTempFExtreme;
    const severity: AlertSeverity = isExtreme ? 'extreme' : 'high';
    const timing = deriveRelativeTiming(hourlyTimes[maxHeatHourIdx], hourlyTimes[0], 0, maxHeatHourIdx);
    const displayVal = Math.round(maxTempF);
    const displayApparent = Math.round(maxApparentF);

    alerts.push({
      id: `alert-extreme-heat-${displayVal}`,
      type: 'extreme_heat',
      severity,
      title: isExtreme ? 'EXCESSIVE HEAT' : 'EXTREME HEAT',
      description: `High temperature of ${displayVal}${tempUnit} expected today.`,
      detail: `Heat index reaching ${displayApparent}${tempUnit}. Stay hydrated.`,
      timing,
      value: displayVal,
      unit: tempUnit,
      iconKey: 'thermometer-sun',
      source: 'open-meteo',
    });

    severeSignals.push({ name: 'extreme heat', severity, timing });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. EXTREME COLD
  // ──────────────────────────────────────────────────────────────────────────
  let minTempF = current?.temperature_2m ?? 50;
  let minApparentF = current?.apparent_temperature ?? minTempF;
  let minColdHourIdx = 0;

  for (let i = 0; i < windowHours; i++) {
    const t = hourlyTemps[i] ?? 50;
    const at = hourlyApparentTemps[i] ?? t;
    if (t < minTempF) {
      minTempF = t;
      minColdHourIdx = i;
    }
    if (at < minApparentF) {
      minApparentF = at;
    }
  }

  if (dailyMinTemps[0] !== undefined && dailyMinTemps[0] < minTempF) {
    minTempF = dailyMinTemps[0];
  }
  if (dailyApparentMin[0] !== undefined && dailyApparentMin[0] < minApparentF) {
    minApparentF = dailyApparentMin[0];
  }

  const effectiveMinTempF = isCelsius ? (minTempF * 9) / 5 + 32 : minTempF;
  const effectiveMinApparentF = isCelsius ? (minApparentF * 9) / 5 + 32 : minApparentF;

  if (
    effectiveMinTempF <= thresholds.extremeCold.tempFLow ||
    effectiveMinApparentF <= thresholds.extremeCold.apparentTempFLow
  ) {
    const isExtreme =
      effectiveMinTempF <= thresholds.extremeCold.tempFExtremeLow ||
      effectiveMinApparentF <= thresholds.extremeCold.apparentTempFExtremeLow;
    const severity: AlertSeverity = isExtreme ? 'extreme' : 'high';
    const timing = deriveRelativeTiming(hourlyTimes[minColdHourIdx], hourlyTimes[0], 0, minColdHourIdx);
    const displayVal = Math.round(minTempF);
    const displayWindChill = Math.round(minApparentF);

    alerts.push({
      id: `alert-extreme-cold-${displayVal}`,
      type: 'extreme_cold',
      severity,
      title: isExtreme ? 'DANGEROUS COLD' : 'EXTREME COLD',
      description: `Low temperature of ${displayVal}${tempUnit} expected.`,
      detail: `Wind chill as low as ${displayWindChill}${tempUnit}.`,
      timing,
      value: displayVal,
      unit: tempUnit,
      iconKey: 'thermometer-snowflake',
      source: 'open-meteo',
    });

    severeSignals.push({ name: 'extreme cold', severity, timing });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. FREEZING CONDITIONS (if not already covered under extreme cold)
  // ──────────────────────────────────────────────────────────────────────────
  const freezingThresholdF = thresholds.freezingConditions.freezingTempF;
  const isFreezing = effectiveMinTempF <= freezingThresholdF && effectiveMinTempF > thresholds.extremeCold.tempFLow;

  if (isFreezing) {
    const isHardFreeze = effectiveMinTempF <= thresholds.freezingConditions.hardFreezeTempF;
    const severity: AlertSeverity = isHardFreeze ? 'high' : 'moderate';
    const timing = deriveRelativeTiming(hourlyTimes[minColdHourIdx], hourlyTimes[0], 0, minColdHourIdx);
    const displayVal = Math.round(minTempF);

    alerts.push({
      id: `alert-freezing-${displayVal}`,
      type: 'freezing_conditions',
      severity,
      title: isHardFreeze ? 'HARD FREEZE ADVISORY' : 'FREEZING CONDITIONS',
      description: `Temperatures may fall to ${displayVal}${tempUnit} (${timing.toLowerCase()}).`,
      detail: `Potential for black ice and frosted windshields.`,
      timing,
      value: displayVal,
      unit: tempUnit,
      iconKey: 'snowflake',
      source: 'open-meteo',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. HIGH UV INDEX
  // ──────────────────────────────────────────────────────────────────────────
  const maxUv = dailyUvIndexMax[0] ?? 0;
  if (maxUv >= thresholds.highUV.uvIndexHigh) {
    const isExtreme = maxUv >= thresholds.highUV.uvIndexExtreme;
    const severity: AlertSeverity = isExtreme ? 'high' : 'moderate';

    alerts.push({
      id: `alert-high-uv-${Math.round(maxUv)}`,
      type: 'high_uv',
      severity,
      title: isExtreme ? 'EXTREME UV INDEX' : 'HIGH UV ADVISORY',
      description: `UV index expected to reach ${Math.round(maxUv)} today.`,
      detail: `Peak intensity between 11 AM - 4 PM. Sun protection recommended.`,
      timing: 'TODAY',
      value: Math.round(maxUv),
      unit: 'UV',
      iconKey: 'sun-medium',
      source: 'open-meteo',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10. COMPOSITE: SEVERE WEATHER POTENTIAL
  // If multiple significant conditions occur together (e.g. thunderstorm + strong gusts)
  // ──────────────────────────────────────────────────────────────────────────
  if (severeSignals.length >= thresholds.severeWeatherPotential.minSevereConditionsCount) {
    const uniqueConditions = Array.from(new Set(severeSignals.map((s) => s.name)));
    const summaryList =
      uniqueConditions.length === 2
        ? `${uniqueConditions[0]} and ${uniqueConditions[1]}`
        : `${uniqueConditions.slice(0, 2).join(', ')} and other hazards`;

    const maxSignalSeverity: AlertSeverity = severeSignals.some((s) => s.severity === 'extreme')
      ? 'extreme'
      : 'high';

    const timing = severeSignals[0]?.timing || 'THIS AFTERNOON';

    alerts.unshift({
      id: `alert-severe-composite-${Date.now()}`,
      type: 'severe_weather_potential',
      severity: maxSignalSeverity,
      title: 'SEVERE WEATHER POTENTIAL',
      description: `${capitalize(summaryList)} are possible during the forecast period.`,
      detail: `Exercise heightened caution when navigating in this area.`,
      timing,
      iconKey: 'alert-triangle',
      source: 'open-meteo',
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRIORITIZATION & DEDUPLICATION
  // Rank: Extreme (4) > High (3) > Moderate (2) > Info (1)
  // Tie-breaker: Chronological timing priority (NOW > NEXT HOUR > NEXT 3 HOURS > etc.)
  // Return top 1-3 most critical alerts.
  // ──────────────────────────────────────────────────────────────────────────
  const severityWeight: Record<AlertSeverity, number> = {
    extreme: 4,
    high: 3,
    moderate: 2,
    info: 1,
  };

  const timingWeight: Record<string, number> = {
    NOW: 6,
    'NEXT HOUR': 5,
    'NEXT 3 HOURS': 4,
    'NEXT 6 HOURS': 3,
    'THIS AFTERNOON': 2,
    'THIS EVENING': 2,
    TONIGHT: 2,
    TODAY: 1,
    TOMORROW: 0,
    'NEXT 24 HOURS': 0,
  };

  alerts.sort((a, b) => {
    const sDiff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    if (sDiff !== 0) return sDiff;

    const tDiff = (timingWeight[b.timing] || 0) - (timingWeight[a.timing] || 0);
    if (tDiff !== 0) return tDiff;

    return (b.value ?? 0) - (a.value ?? 0);
  });

  // Clamp to top 3 prioritized alerts to maintain clean, non-overwhelming cockpit density
  return alerts.slice(0, 3);
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
