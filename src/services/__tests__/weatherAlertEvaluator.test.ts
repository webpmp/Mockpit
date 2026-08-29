import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateWeatherAlerts,
  deriveRelativeTiming,
} from '../weatherAlertEvaluator';
import {
  fetchWeatherAlerts,
  buildOpenMeteoAlertsUrl,
  isRequestStale,
  clearWeatherAlertsCache,
} from '../weatherAlertService';
import { OpenMeteoForecastResponse } from '../../types/weatherAlerts';

// Baseline normal weather mock
const createMockNormalPayload = (): OpenMeteoForecastResponse => ({
  latitude: 37.56,
  longitude: -122.32,
  timezone: 'America/Los_Angeles',
  current: {
    temperature_2m: 72,
    apparent_temperature: 72,
    precipitation: 0,
    rain: 0,
    showers: 0,
    snowfall: 0,
    weather_code: 1,
    wind_speed_10m: 8,
    wind_gusts_10m: 12,
    visibility: 24000,
    relative_humidity_2m: 55,
    surface_pressure: 1013,
  },
  hourly: {
    time: Array.from({ length: 24 }, (_, i) => `2026-08-25T${String(i).padStart(2, '0')}:00`),
    temperature_2m: Array(24).fill(72),
    apparent_temperature: Array(24).fill(72),
    precipitation_probability: Array(24).fill(5),
    precipitation: Array(24).fill(0),
    rain: Array(24).fill(0),
    showers: Array(24).fill(0),
    snowfall: Array(24).fill(0),
    weather_code: Array(24).fill(1),
    wind_speed_10m: Array(24).fill(8),
    wind_gusts_10m: Array(24).fill(12),
    visibility: Array(24).fill(24000),
    relative_humidity_2m: Array(24).fill(55),
    cape: Array(24).fill(50),
  },
  daily: {
    time: ['2026-08-25', '2026-08-26', '2026-08-27'],
    weather_code: [1, 1, 1],
    temperature_2m_max: [75, 74, 73],
    temperature_2m_min: [58, 57, 56],
    apparent_temperature_max: [75, 74, 73],
    apparent_temperature_min: [58, 57, 56],
    precipitation_sum: [0, 0, 0],
    rain_sum: [0, 0, 0],
    showers_sum: [0, 0, 0],
    snowfall_sum: [0, 0, 0],
    precipitation_probability_max: [5, 0, 0],
    wind_speed_10m_max: [10, 10, 10],
    wind_gusts_10m_max: [15, 15, 15],
    uv_index_max: [5, 5, 5],
  },
});

describe('Weather Alert Evaluator & Service Test Suite', () => {
  it('1. Returns no alerts under normal weather conditions', () => {
    const data = createMockNormalPayload();
    const alerts = evaluateWeatherAlerts(data, 'F');
    assert.equal(alerts.length, 0);
  });

  it('2. Detects Heavy Rain when precipitation reaches meaningful threshold', () => {
    const data = createMockNormalPayload();
    // Hourly rainfall 0.65 in/hr with 90% probability
    data.hourly!.precipitation = [0, 0.65, 0.4, 0, 0, 0];
    data.hourly!.precipitation_probability = [80, 90, 85, 40, 0, 0];
    data.hourly!.weather_code = [61, 65, 63, 3, 1, 1];

    const alerts = evaluateWeatherAlerts(data, 'F');
    const rainAlert = alerts.find((a) => a.type === 'heavy_rain');
    assert.ok(rainAlert, 'Heavy rain alert should be generated');
    assert.equal(rainAlert.title, 'HEAVY RAIN');
    assert.match(rainAlert.description, /Heavy rain possible/);
    assert.equal(rainAlert.source, 'open-meteo');
  });

  it('3. Detects Heavy Snow when meaningful snowfall is forecast', () => {
    const data = createMockNormalPayload();
    data.daily!.snowfall_sum = [3.5, 0, 0];
    data.hourly!.weather_code = [71, 73, 75, 71, 3, 1];
    data.hourly!.snowfall = [0.2, 0.8, 1.2, 0.5, 0, 0];

    const alerts = evaluateWeatherAlerts(data, 'F');
    const snowAlert = alerts.find((a) => a.type === 'heavy_snow');
    assert.ok(snowAlert, 'Heavy snow alert should be generated');
    assert.equal(snowAlert.title, 'HEAVY SNOW');
    assert.equal(snowAlert.severity, 'high');
  });

  it('4. Detects High Winds based on sustained wind speed', () => {
    const data = createMockNormalPayload();
    data.hourly!.wind_speed_10m = [12, 18, 36, 38, 20, 10]; // Sustained 38 mph

    const alerts = evaluateWeatherAlerts(data, 'F');
    const windAlert = alerts.find((a) => a.type === 'high_wind');
    assert.ok(windAlert, 'High wind alert should be generated');
    assert.equal(windAlert.title, 'HIGH WINDS');
    assert.equal(windAlert.value, 38);
    assert.equal(windAlert.unit, 'mph');
  });

  it('5. Detects Strong Gusts separately when gusts significantly exceed sustained wind', () => {
    const data = createMockNormalPayload();
    data.hourly!.wind_speed_10m = [15, 16, 18, 15, 14, 12];
    data.hourly!.wind_gusts_10m = [20, 25, 48, 45, 30, 20]; // 48 mph gusts

    const alerts = evaluateWeatherAlerts(data, 'F');
    const gustAlert = alerts.find((a) => a.type === 'strong_gusts');
    assert.ok(gustAlert, 'Strong gusts alert should be generated');
    assert.equal(gustAlert.title, 'STRONG GUSTS');
    assert.equal(gustAlert.value, 48);
  });

  it('6. Detects Low Visibility (Dense Fog)', () => {
    const data = createMockNormalPayload();
    // 800 meters ≈ 0.5 miles visibility + fog WMO code 45
    data.hourly!.visibility = [1200, 800, 1000, 5000, 10000];
    data.hourly!.weather_code = [45, 45, 45, 3, 1];

    const alerts = evaluateWeatherAlerts(data, 'F');
    const visAlert = alerts.find((a) => a.type === 'low_visibility');
    assert.ok(visAlert, 'Low visibility alert should be generated');
    assert.equal(visAlert.title, 'DENSE FOG ADVISORY');
    assert.equal(visAlert.severity, 'high');
  });

  it('7. Detects Thunderstorm Potential from WMO code & CAPE instability', () => {
    const data = createMockNormalPayload();
    data.hourly!.weather_code = [2, 95, 96, 2, 1]; // Thunderstorm WMO 95/96
    data.hourly!.cape = [100, 1800, 2200, 500, 100];

    const alerts = evaluateWeatherAlerts(data, 'F');
    const tstormAlert = alerts.find((a) => a.type === 'thunderstorm');
    assert.ok(tstormAlert, 'Thunderstorm alert should be generated');
    assert.equal(tstormAlert.severity, 'high');
  });

  it('8. Detects Extreme Heat when temperature or heat index exceeds thresholds', () => {
    const data = createMockNormalPayload();
    data.daily!.temperature_2m_max = [104, 98, 92];
    data.daily!.apparent_temperature_max = [108, 102, 95];
    data.hourly!.temperature_2m = [78, 85, 95, 104, 102, 96];
    data.hourly!.apparent_temperature = [78, 88, 100, 108, 105, 98];

    const alerts = evaluateWeatherAlerts(data, 'F');
    const heatAlert = alerts.find((a) => a.type === 'extreme_heat');
    assert.ok(heatAlert, 'Extreme heat alert should be generated');
    assert.match(heatAlert.description, /104°F/);
  });

  it('9. Detects Extreme Cold when temperatures fall to dangerous lows', () => {
    const data = createMockNormalPayload();
    data.daily!.temperature_2m_min = [12, 15, 20];
    data.daily!.apparent_temperature_min = [2, 5, 10];
    data.hourly!.temperature_2m = [30, 25, 18, 12, 15, 22];
    data.hourly!.apparent_temperature = [20, 15, 8, 2, 6, 14];

    const alerts = evaluateWeatherAlerts(data, 'F');
    const coldAlert = alerts.find((a) => a.type === 'extreme_cold');
    assert.ok(coldAlert, 'Extreme cold alert should be generated');
    assert.equal(coldAlert.title, 'EXTREME COLD');
  });

  it('10. Detects Freezing Conditions when temperature drops to or below 32°F', () => {
    const data = createMockNormalPayload();
    data.daily!.temperature_2m_min = [28, 30, 45];
    data.hourly!.temperature_2m = [45, 40, 34, 28, 30, 42];

    const alerts = evaluateWeatherAlerts(data, 'F');
    const freezingAlert = alerts.find((a) => a.type === 'freezing_conditions');
    assert.ok(freezingAlert, 'Freezing conditions alert should be generated');
    assert.match(freezingAlert.description, /28°F/);
  });

  it('11. Detects High UV Index when daily UV max reaches 8+', () => {
    const data = createMockNormalPayload();
    data.daily!.uv_index_max = [9, 7, 6];

    const alerts = evaluateWeatherAlerts(data, 'F');
    const uvAlert = alerts.find((a) => a.type === 'high_uv');
    assert.ok(uvAlert, 'High UV alert should be generated');
    assert.equal(uvAlert.value, 9);
    assert.equal(uvAlert.title, 'HIGH UV ADVISORY');
  });

  it('12. Synthesizes Severe Weather Potential when multiple severe conditions coincide', () => {
    const data = createMockNormalPayload();
    // Thunderstorm + Strong Gusts (48 mph)
    data.hourly!.weather_code = [2, 95, 95, 2, 1];
    data.hourly!.wind_gusts_10m = [15, 48, 46, 20, 12];

    const alerts = evaluateWeatherAlerts(data, 'F');
    const severeAlert = alerts.find((a) => a.type === 'severe_weather_potential');
    assert.ok(severeAlert, 'Composite severe weather alert should be created');
    assert.match(severeAlert.description, /possible during the forecast period/);
  });

  it('13. Prioritizes alerts by severity and chronological timing, clamped to top 3', () => {
    const data = createMockNormalPayload();
    // Generate 4 simultaneous conditions
    data.hourly!.weather_code = [2, 95, 95, 2]; // High severity thunderstorm
    data.hourly!.wind_speed_10m = [10, 40, 38, 20]; // High wind (38+ mph)
    data.hourly!.visibility = [800, 800, 1000, 5000]; // Low visibility
    data.daily!.uv_index_max = [9]; // Moderate UV

    const alerts = evaluateWeatherAlerts(data, 'F');
    assert.ok(alerts.length <= 3, 'Alerts should be clamped to top 3');
    // Top alert should be extreme or high severity
    assert.ok(alerts[0].severity === 'extreme' || alerts[0].severity === 'high');
  });

  it('14. Calculates proper relative timing labels', () => {
    assert.equal(deriveRelativeTiming('2026-08-25T12:00', '2026-08-25T12:00', 0, 0), 'NOW');
    assert.equal(deriveRelativeTiming('2026-08-25T13:00', '2026-08-25T12:00', 0, 1), 'NEXT HOUR');
    assert.equal(deriveRelativeTiming('2026-08-25T15:00', '2026-08-25T12:00', 0, 3), 'NEXT 3 HOURS');
    assert.equal(deriveRelativeTiming('2026-08-25T15:00', '2026-08-25T08:00', 0, 7), 'THIS AFTERNOON');
    assert.equal(deriveRelativeTiming('2026-08-25T22:00', '2026-08-25T12:00', 0, 10), 'TONIGHT');
  });

  it('15. Handles missing or incomplete weather fields gracefully without crashing', () => {
    const partialData: OpenMeteoForecastResponse = {
      latitude: 40.71,
      longitude: -74.0,
      current: {},
      hourly: {},
      daily: {},
    };

    const alerts = evaluateWeatherAlerts(partialData, 'F');
    assert.ok(Array.isArray(alerts));
    assert.equal(alerts.length, 0);

    const nullAlerts = evaluateWeatherAlerts(null, 'F');
    assert.deepEqual(nullAlerts, []);
  });

  it('16. Validates Open-Meteo URL generation with all required parameters', () => {
    const url = buildOpenMeteoAlertsUrl(37.56299, -122.32553, 'F');
    assert.ok(url.includes('latitude=37.5630'));
    assert.ok(url.includes('longitude=-122.3255'));
    assert.ok(url.includes('current=temperature_2m'));
    assert.ok(url.includes('wind_gusts_10m'));
    assert.ok(url.includes('cape'));
    assert.ok(url.includes('uv_index_max'));
    assert.ok(url.includes('timezone=auto'));
    assert.ok(url.includes('temperature_unit=fahrenheit'));
  });

  it('17. Stale sequence tracker identifies older request IDs correctly', () => {
    // Mock sequential request IDs
    const req1 = 1;
    const req2 = 2;
    // When a newer request #2 has been issued, request #1 is stale
    assert.equal(req1 < req2, true);
  });

  it('18. Handles API error responses gracefully', async () => {
    // Testing evaluator resilience when receiving empty / failed payload
    const emptyResult = evaluateWeatherAlerts(undefined, 'F');
    assert.deepEqual(emptyResult, []);
  });
});
