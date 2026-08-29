import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateWeatherTrend,
  isSnowWmoCode,
  isRainWmoCode,
  isClearWmoCode,
  isOvercastWmoCode,
} from '../weatherTrendEvaluator';
import { HourlyForecastSnapshot, CurrentWeatherSnapshot } from '../../types/weatherTrend';

describe('Weather Trend Evaluator Test Suite', () => {
  it('1. Returns STABLE when hourly forecast has no significant change', () => {
    const hourly: HourlyForecastSnapshot = {
      time: ['2026-08-25T12:00', '2026-08-25T13:00', '2026-08-25T14:00', '2026-08-25T15:00', '2026-08-25T16:00', '2026-08-25T17:00'],
      temperature_2m: [72, 72, 73, 72, 71, 70],
      precipitation_probability: [0, 0, 5, 0, 5, 0],
      precipitation: [0, 0, 0, 0, 0, 0],
      rain: [0, 0, 0, 0, 0, 0],
      snowfall: [0, 0, 0, 0, 0, 0],
      weather_code: [1, 1, 1, 1, 1, 1],
      wind_speed_10m: [6, 7, 6, 8, 7, 6],
      cloud_cover: [20, 25, 20, 25, 30, 25],
    };
    const current: CurrentWeatherSnapshot = {
      temperature: 72,
      weather_code: 1,
      wind_speed: 6,
      precipitation_probability: 0,
      cloud_cover: 20,
    };

    const result = evaluateWeatherTrend(hourly, current, 'F');
    assert.equal(result.type, 'stable');
    assert.equal(result.headline, 'STABLE');
    assert.match(result.detail, /Little change/i);
  });

  it('2. Detects Rain Developing when rain WMO code or high probability appears in lookahead', () => {
    const hourly: HourlyForecastSnapshot = {
      time: ['2026-08-25T12:00', '2026-08-25T13:00', '2026-08-25T14:00', '2026-08-25T15:00', '2026-08-25T16:00'],
      temperature_2m: [68, 67, 65, 63, 62],
      precipitation_probability: [10, 20, 75, 85, 90],
      precipitation: [0, 0, 1.8, 3.2, 2.5],
      rain: [0, 0, 1.8, 3.2, 2.5],
      snowfall: [0, 0, 0, 0, 0],
      weather_code: [2, 3, 61, 63, 65],
      wind_speed_10m: [8, 10, 12, 14, 15],
      cloud_cover: [40, 65, 95, 100, 100],
    };
    const current: CurrentWeatherSnapshot = {
      temperature: 68,
      weather_code: 2,
      precipitation_probability: 10,
    };

    const result = evaluateWeatherTrend(hourly, current, 'F');
    assert.equal(result.type, 'rain-developing');
    assert.equal(result.headline, 'RAIN DEVELOPING');
    assert.ok(result.detail.includes('2 HR') || result.detail.includes('2 PM') || result.detail.includes('75%'));
  });

  it('3. Detects Rain Ending when current condition is rain and future hours clear up', () => {
    const hourly: HourlyForecastSnapshot = {
      time: ['2026-08-25T12:00', '2026-08-25T13:00', '2026-08-25T14:00', '2026-08-25T15:00'],
      temperature_2m: [60, 61, 63, 65],
      precipitation_probability: [80, 50, 10, 5],
      precipitation: [2.0, 0.4, 0, 0],
      rain: [2.0, 0.4, 0, 0],
      weather_code: [61, 51, 1, 0],
    };
    const current: CurrentWeatherSnapshot = {
      weather_code: 61, // Rain
      precipitation_probability: 80,
    };

    const result = evaluateWeatherTrend(hourly, current, 'F');
    assert.equal(result.type, 'rain-ending');
    assert.equal(result.headline, 'RAIN ENDING');
    assert.match(result.detail, /Clearing/i);
  });

  it('4. Detects Snow Developing with top priority', () => {
    const hourly: HourlyForecastSnapshot = {
      time: ['2026-08-25T12:00', '2026-08-25T13:00', '2026-08-25T14:00', '2026-08-25T15:00'],
      temperature_2m: [34, 32, 30, 28],
      precipitation_probability: [10, 30, 80, 90],
      snowfall: [0, 0, 1.5, 3.0],
      weather_code: [3, 3, 71, 73],
    };
    const current: CurrentWeatherSnapshot = {
      weather_code: 3,
      temperature: 34,
    };

    const result = evaluateWeatherTrend(hourly, current, 'F');
    assert.equal(result.type, 'snow-developing');
    assert.equal(result.headline, 'SNOW DEVELOPING');
  });

  it('5. Detects Significant Temperature Drop', () => {
    const hourly: HourlyForecastSnapshot = {
      time: ['2026-08-25T12:00', '2026-08-25T13:00', '2026-08-25T14:00', '2026-08-25T15:00', '2026-08-25T16:00'],
      temperature_2m: [75, 71, 65, 60, 56],
      precipitation_probability: [0, 0, 0, 0, 0],
      weather_code: [1, 1, 1, 1, 1],
    };
    const current: CurrentWeatherSnapshot = {
      temperature: 75,
      weather_code: 1,
    };

    const result = evaluateWeatherTrend(hourly, current, 'F');
    assert.equal(result.type, 'temp-dropping');
    assert.equal(result.headline, 'TEMP DROPPING');
    assert.match(result.detail, /75° → 56°/);
  });

  it('6. Detects Significant Temperature Rise', () => {
    const hourly: HourlyForecastSnapshot = {
      time: ['2026-08-25T06:00', '2026-08-25T07:00', '2026-08-25T08:00', '2026-08-25T09:00', '2026-08-25T10:00', '2026-08-25T11:00'],
      temperature_2m: [54, 57, 62, 68, 73, 77],
      precipitation_probability: [0, 0, 0, 0, 0, 0],
      weather_code: [0, 0, 0, 0, 0, 0],
    };
    const current: CurrentWeatherSnapshot = {
      temperature: 54,
      weather_code: 0,
    };

    const result = evaluateWeatherTrend(hourly, current, 'F');
    assert.equal(result.type, 'temp-rising');
    assert.equal(result.headline, 'TEMP RISING');
    assert.match(result.detail, /54° → 77°/);
  });

  it('7. Detects Wind Increasing', () => {
    const hourly: HourlyForecastSnapshot = {
      time: ['2026-08-25T12:00', '2026-08-25T13:00', '2026-08-25T14:00', '2026-08-25T15:00'],
      temperature_2m: [70, 70, 69, 68],
      precipitation_probability: [0, 0, 0, 0],
      weather_code: [1, 1, 1, 1],
      wind_speed_10m: [8, 12, 22, 28],
    };
    const current: CurrentWeatherSnapshot = {
      temperature: 70,
      weather_code: 1,
      wind_speed: 8,
    };

    const result = evaluateWeatherTrend(hourly, current, 'F');
    assert.equal(result.type, 'wind-increasing');
    assert.equal(result.headline, 'WIND INCREASING');
    assert.match(result.detail, /8 → 28 MPH/);
  });

  it('8. Detects Clearing Skies when cloud cover and overcast clear away', () => {
    const hourly: HourlyForecastSnapshot = {
      time: ['2026-08-25T12:00', '2026-08-25T13:00', '2026-08-25T14:00', '2026-08-25T15:00'],
      temperature_2m: [65, 66, 68, 70],
      weather_code: [3, 2, 1, 0],
      cloud_cover: [90, 60, 20, 5],
    };
    const current: CurrentWeatherSnapshot = {
      weather_code: 3,
      cloud_cover: 90,
    };

    const result = evaluateWeatherTrend(hourly, current, 'F');
    assert.equal(result.type, 'clearing');
    assert.equal(result.headline, 'CLEARING SKIES');
  });

  it('9. Gracefully handles null / undefined input without throwing', () => {
    const result = evaluateWeatherTrend(null, null);
    assert.equal(result.type, 'stable');
    assert.equal(result.headline, 'STABLE');
  });
});
