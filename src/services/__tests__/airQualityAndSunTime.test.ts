import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getUsAqiCategory, getAqiDetails, getAqiEpaColorInfo } from '../airQualityService';
import { formatTimeInTz, formatDaylightDuration, determineDaylightPhase, parseSunTimes } from '../sunTimeService';

describe('Air Quality & Sun Time Services Test Suite', () => {
  it('1. Maps AQI values accurately to US EPA categories', () => {
    assert.equal(getUsAqiCategory(25), 'GOOD');
    assert.equal(getUsAqiCategory(50), 'GOOD');
    assert.equal(getUsAqiCategory(51), 'MODERATE');
    assert.equal(getUsAqiCategory(100), 'MODERATE');
    assert.equal(getUsAqiCategory(101), 'UNHEALTHY FOR SENSITIVE GROUPS');
    assert.equal(getUsAqiCategory(150), 'UNHEALTHY FOR SENSITIVE GROUPS');
    assert.equal(getUsAqiCategory(151), 'UNHEALTHY');
    assert.equal(getUsAqiCategory(200), 'UNHEALTHY');
    assert.equal(getUsAqiCategory(201), 'VERY UNHEALTHY');
    assert.equal(getUsAqiCategory(300), 'VERY UNHEALTHY');
    assert.equal(getUsAqiCategory(350), 'HAZARDOUS');
  });

  it('2. Retrieves AQI Category UI styling and description details', () => {
    const good = getAqiDetails('GOOD');
    assert.equal(good.label, 'GOOD');
    assert.match(good.textColor, /emerald/);

    const sensitive = getAqiDetails('UNHEALTHY FOR SENSITIVE GROUPS');
    assert.equal(sensitive.label, 'SENSITIVE GROUPS');
    assert.match(sensitive.textColor, /orange/);

    const hazardous = getAqiDetails('HAZARDOUS');
    assert.equal(hazardous.label, 'HAZARDOUS');
    assert.match(hazardous.textColor, /red/);
  });

  it('3. Retrieves single-word EPA color name and aria phrase for all 6 AQI tiers', () => {
    const goodInfo = getAqiEpaColorInfo('GOOD');
    assert.equal(goodInfo.colorWord, 'GREEN');
    assert.equal(goodInfo.categoryPhrase, 'Good');

    const modInfo = getAqiEpaColorInfo('MODERATE');
    assert.equal(modInfo.colorWord, 'YELLOW');
    assert.equal(modInfo.categoryPhrase, 'Moderate');

    const usgInfo = getAqiEpaColorInfo('UNHEALTHY FOR SENSITIVE GROUPS');
    assert.equal(usgInfo.colorWord, 'ORANGE');
    assert.equal(usgInfo.categoryPhrase, 'Unhealthy for Sensitive Groups');

    const unhInfo = getAqiEpaColorInfo('UNHEALTHY');
    assert.equal(unhInfo.colorWord, 'RED');
    assert.equal(unhInfo.categoryPhrase, 'Unhealthy');

    const vUnhInfo = getAqiEpaColorInfo('VERY UNHEALTHY');
    assert.equal(vUnhInfo.colorWord, 'PURPLE');
    assert.equal(vUnhInfo.categoryPhrase, 'Very Unhealthy');

    const hazInfo = getAqiEpaColorInfo('HAZARDOUS');
    assert.equal(hazInfo.colorWord, 'MAROON');
    assert.equal(hazInfo.categoryPhrase, 'Hazardous');
    // Ensure Maroon color is distinct from Red
    assert.notEqual(hazInfo.textColor, unhInfo.textColor);
  });

  it('4. Formats ISO time to 12-hour AM/PM string', () => {
    assert.equal(formatTimeInTz('2026-08-25T06:34'), '6:34 AM');
    assert.equal(formatTimeInTz('2026-08-25T19:48'), '7:48 PM');
    assert.equal(formatTimeInTz('2026-08-25T00:15'), '12:15 AM');
    assert.equal(formatTimeInTz('2026-08-25T12:00'), '12:00 PM');
    assert.equal(formatTimeInTz(undefined), '—');
  });

  it('5. Formats daylight duration seconds to H M string', () => {
    assert.equal(formatDaylightDuration(47666), '13H 14M');
    assert.equal(formatDaylightDuration(3600), '1H 0M');
    assert.equal(formatDaylightDuration(1800), '30M');
    assert.equal(formatDaylightDuration(undefined), '—');
    assert.equal(formatDaylightDuration(0), '—');
  });

  it('6. Determines daylight phase accurately', () => {
    // 04:00 AM local time -> BEFORE SUNRISE
    const nightDate = new Date('2026-08-25T04:00:00');
    const phase1 = determineDaylightPhase('2026-08-25T06:30', '2026-08-25T19:45', nightDate);
    assert.equal(phase1.phase, 'BEFORE SUNRISE');

    // 12:00 PM midday -> DAYLIGHT
    const midDate = new Date('2026-08-25T12:00:00');
    const phase2 = determineDaylightPhase('2026-08-25T06:30', '2026-08-25T19:45', midDate);
    assert.equal(phase2.phase, 'DAYLIGHT');

    // 21:00 PM evening -> AFTER SUNSET
    const eveningDate = new Date('2026-08-25T21:00:00');
    const phase3 = determineDaylightPhase('2026-08-25T06:30', '2026-08-25T19:45', eveningDate);
    assert.equal(phase3.phase, 'AFTER SUNSET');
  });

  it('7. Parses Open-Meteo daily solar arrays to complete SunTimeData', () => {
    const sunData = parseSunTimes(
      ['2026-08-25T06:34'],
      ['2026-08-25T19:48'],
      [47666]
    );
    assert.equal(sunData.status, 'success');
    assert.equal(sunData.sunriseFormatted, '6:34 AM');
    assert.equal(sunData.sunsetFormatted, '7:48 PM');
    assert.equal(sunData.daylightDurationFormatted, '13H 14M');
  });
});
