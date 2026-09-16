import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { getUvCategory } from '../weather/WeatherDetailRow';
import { buildOpenMeteoAlertsUrl } from '../../services/weatherAlertService';
import {
  DEFAULT_DETAIL_CARD_ORDER,
  DETAIL_CARD_LABELS,
  parseDetailCardOrder,
  isDetailCardVisible,
} from '../../types/weatherDetails';

describe('Weather Alerts & Details Panel — v1 Suite', () => {
  it('1. weather-alerts-empty-state is completely removed from codebase', () => {
    const alertsSectionFile = path.resolve('src/components/weather/WeatherAlertsSection.tsx');
    const content = fs.readFileSync(alertsSectionFile, 'utf-8');
    assert.ok(
      !content.includes('weather-alerts-empty-state'),
      'weather-alerts-empty-state must not exist in WeatherAlertsSection'
    );
    assert.ok(
      !content.includes('No Significant Weather Alerts'),
      '"No Significant Weather Alerts" text should be completely deleted'
    );
  });

  it('2. EPA/WHO UV Index Category Scale validation', () => {
    // 0–2 Low
    assert.equal(getUvCategory(0), 'Low');
    assert.equal(getUvCategory(1.4), 'Low');
    assert.equal(getUvCategory(2.0), 'Low');
    assert.equal(getUvCategory(2.4), 'Low');

    // 3–5 Moderate
    assert.equal(getUvCategory(2.6), 'Moderate');
    assert.equal(getUvCategory(3.0), 'Moderate');
    assert.equal(getUvCategory(4.5), 'Moderate');
    assert.equal(getUvCategory(5.0), 'Moderate');
    assert.equal(getUvCategory(5.4), 'Moderate');

    // 6–7 High
    assert.equal(getUvCategory(5.6), 'High');
    assert.equal(getUvCategory(6.0), 'High');
    assert.equal(getUvCategory(7.0), 'High');
    assert.equal(getUvCategory(7.4), 'High');

    // 8–10 Very High
    assert.equal(getUvCategory(7.8), 'Very High');
    assert.equal(getUvCategory(8.0), 'Very High');
    assert.equal(getUvCategory(9.2), 'Very High');
    assert.equal(getUvCategory(10.0), 'Very High');
    assert.equal(getUvCategory(10.4), 'Very High');

    // 11+ Extreme
    assert.equal(getUvCategory(10.6), 'Extreme');
    assert.equal(getUvCategory(11.0), 'Extreme');
    assert.equal(getUvCategory(14.5), 'Extreme');
  });

  it('3. Required unit conversions calculation check', () => {
    // Pressure: hPa -> inHg using hPa * 0.02953
    const standardPressureHpa = 1013.25;
    const standardPressureInHg = (standardPressureHpa * 0.02953).toFixed(2);
    assert.equal(standardPressureInHg, '29.92');

    const lowPressureHpa = 990.0;
    const lowPressureInHg = (lowPressureHpa * 0.02953).toFixed(2);
    assert.equal(lowPressureInHg, '29.23');

    // Visibility: meters -> miles using meters / 1609.34
    const meters10Miles = 16093.4;
    const visMiles = Math.round(meters10Miles / 1609.34);
    assert.equal(visMiles, 10);

    const metersHalfMile = 804.67;
    const visHalfMile = Math.round(metersHalfMile / 1609.34);
    assert.equal(visHalfMile, 1);

    const metersQuarterMile = 300;
    const visQuarterMile = Math.round(metersQuarterMile / 1609.34);
    assert.equal(visQuarterMile, 0);

    const meters5Miles = 8046.7;
    const vis5Miles = Math.round(meters5Miles / 1609.34);
    assert.equal(vis5Miles, 5);
  });

  it('4. Open-Meteo URL generation includes all 5 required parameters in current=', () => {
    const url = buildOpenMeteoAlertsUrl(37.56299, -122.32553, 'F');
    assert.ok(url.includes('apparent_temperature'), 'Must include apparent_temperature in URL');
    assert.ok(url.includes('uv_index'), 'Must include uv_index in URL');
    assert.ok(url.includes('dew_point_2m'), 'Must include dew_point_2m in URL');
    assert.ok(url.includes('surface_pressure'), 'Must include surface_pressure in URL');
    assert.ok(url.includes('visibility'), 'Must include visibility in URL');
  });

  it('5. WeatherAlertsSection renders two peer cards in shared scroll container (v1.1 patch)', () => {
    const alertsSectionFile = path.resolve('src/components/weather/WeatherAlertsSection.tsx');
    const content = fs.readFileSync(alertsSectionFile, 'utf-8');

    // Unified scroll container
    assert.ok(
      content.includes('flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1'),
      'Must use shared scroll container flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-1'
    );

    // Conditional Weather Alerts peer card
    assert.ok(content.includes('alerts.length > 0 && ('), 'Weather Alerts card must be conditional on alerts.length > 0');
    assert.ok(content.includes('id="weather-alerts-card"'), 'Contains weather-alerts-card peer card');
    assert.ok(content.includes('Weather Alerts'), 'Contains Weather Alerts heading');

    // Peer Card 2: Current Observations card (always rendered when visible cards > 0)
    assert.ok(content.includes('id="observations-card"'), 'Contains observations-card peer card');
    assert.ok(content.includes('Current Observations'), 'Contains Current Observations heading');
    assert.ok(content.includes('id="observations-heading"'), 'Contains observations-heading id');

    // Both peer cards share identical styling and header treatment
    assert.ok(
      content.includes('rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 flex flex-col gap-2.5 shrink-0'),
      'Peer cards have identical border and background styling'
    );
    assert.ok(
      content.includes(
        'text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-200 font-mono pb-2 border-b border-slate-800/80'
      ),
      'Both cards share identical heading styling with bottom border'
    );

    // All 5 metric rows present in Current Observations
    assert.ok(content.includes('label="Feels Like"'), 'Feels Like row present');
    assert.ok(content.includes('label="UV Index"'), 'UV Index row present');
    assert.ok(content.includes('label="Dew Point"'), 'Dew Point row present');
    assert.ok(content.includes('label="Pressure"'), 'Pressure row present');
    assert.ok(content.includes('label="Visibility"'), 'Visibility row present');

    // Unit labels and conversions
    assert.ok(content.includes('0.02953'), 'Uses 0.02953 factor for inHg pressure conversion');
    assert.ok(content.includes('1609.34'), 'Uses 1609.34 divisor for visibility in miles');
    assert.ok(content.includes('sub="IN"'), 'Pressure sub is IN');
    assert.ok(content.includes('sub="MI"'), 'Visibility sub is MI');

    // No trend arrows or rising/falling on pressure
    assert.ok(!content.includes('rising'), 'No pressure rising trend indicator');
    assert.ok(!content.includes('falling'), 'No pressure falling trend indicator');
    assert.ok(!content.includes('steady'), 'No pressure steady trend indicator');

    // Lucide Icons (v2.9 updated Waves and CloudFog)
    assert.ok(content.includes('Thermometer'), 'Uses Thermometer icon');
    assert.ok(content.includes('Sun'), 'Uses Sun icon');
    assert.ok(content.includes('Droplets'), 'Uses Droplets icon');
    assert.ok(content.includes('Waves'), 'Uses Waves icon');
    assert.ok(content.includes('CloudFog'), 'Uses CloudFog icon');
  });

  it('6. WeatherDetailRow component exports and v1.1 sizing structure', () => {
    const detailRowFile = path.resolve('src/components/weather/WeatherDetailRow.tsx');
    assert.ok(fs.existsSync(detailRowFile), 'WeatherDetailRow.tsx exists');
    const content = fs.readFileSync(detailRowFile, 'utf-8');
    assert.ok(content.includes('bg-slate-950/55'), 'Has card styling bg-slate-950/55');
    assert.ok(content.includes('border border-slate-800'), 'Has border-slate-800');
    assert.ok(content.includes('w-7 h-7 rounded-lg'), 'Icon box enlarged to w-7 h-7');
    assert.ok(content.includes('w-4 h-4'), 'Icon size enlarged to w-4 h-4');
    assert.ok(content.includes('text-xs font-bold uppercase tracking-wide text-slate-300 font-mono'), 'Label upgraded to text-xs');
    assert.ok(content.includes('text-lg font-black font-mono text-slate-100'), 'Value upgraded to text-lg');
    assert.ok(content.includes('text-[10px] font-bold font-mono text-slate-500'), 'Sub badge is text-[10px]');
  });

  it('7. Weather Alerts & Details Panel — v1.3 auto-fit CSS grid and WeatherDetailCard', () => {
    const alertsSectionFile = path.resolve('src/components/weather/WeatherAlertsSection.tsx');
    const alertsContent = fs.readFileSync(alertsSectionFile, 'utf-8');

    // Fixed 5-column grid container with grid-cols-5 and gap-3 (v2.6)
    assert.ok(
      alertsContent.includes('className="grid grid-cols-5 gap-3"'),
      'Must use grid-cols-5 gap-3 for exact 5 columns across full width'
    );
    assert.ok(
      !alertsContent.includes('auto-fit') && !alertsContent.includes('minmax'),
      'auto-fit and minmax must be completely removed'
    );

    // WeatherDetailCard file and styling (v2.8 fixed h-[235px] and w-14 h-14 icon)
    const detailCardFile = path.resolve('src/components/weather/WeatherDetailCard.tsx');
    assert.ok(fs.existsSync(detailCardFile), 'WeatherDetailCard.tsx exists');
    const cardContent = fs.readFileSync(detailCardFile, 'utf-8');

    // Sizing and typography invariants for v2.8
    assert.ok(cardContent.includes('h-[235px]'), 'Card has fixed h-[235px] (v2.8)');
    assert.ok(cardContent.includes('w-14 h-14 text-sky-300 shrink-0'), 'Icon is w-14 h-14 shrink-0 (v2.8)');
    assert.ok(cardContent.includes('strokeWidth={1.5}'), 'Icon uses strokeWidth 1.5');
    assert.ok(
      cardContent.includes('flex flex-col items-center justify-center gap-3 text-center min-w-0 p-4'),
      'Card has vertical centered stack layout with p-4 and gap-3 (v2.8)'
    );
    assert.ok(
      cardContent.includes('break-words'),
      'Label uses break-words and no truncate'
    );
    assert.ok(!cardContent.includes('truncate'), 'No truncate class on label');
    assert.ok(cardContent.includes('text-lg font-black font-mono text-slate-100'), 'Value uses text-lg font-black');
    assert.ok(cardContent.includes('text-[10px] font-bold font-mono text-slate-500'), 'Sub uses text-[10px] font-bold');
  });

  it('8. Weather Alerts & Details Panel — v2 Inspector controls, order, and visibility', () => {
    // Check weatherDetails.ts exports and helper logic
    assert.deepStrictEqual(
      DEFAULT_DETAIL_CARD_ORDER,
      ['feelsLike', 'uvIndex', 'dewPoint', 'pressure', 'visibility'],
      'Default order must be feelsLike,uvIndex,dewPoint,pressure,visibility'
    );

    // Parsing handles undefined / empty
    assert.deepStrictEqual(
      parseDetailCardOrder(undefined),
      ['feelsLike', 'uvIndex', 'dewPoint', 'pressure', 'visibility']
    );

    // Parsing handles custom order
    assert.deepStrictEqual(
      parseDetailCardOrder('visibility,pressure,feelsLike,uvIndex,dewPoint'),
      ['visibility', 'pressure', 'feelsLike', 'uvIndex', 'dewPoint']
    );

    // Parsing recovers missing items in default order
    assert.deepStrictEqual(
      parseDetailCardOrder('pressure,feelsLike'),
      ['pressure', 'feelsLike', 'uvIndex', 'dewPoint', 'visibility']
    );

    // Visibility helper
    assert.strictEqual(isDetailCardVisible('feelsLike', {}), true);
    assert.strictEqual(isDetailCardVisible('feelsLike', { feelsLike: false }), false);
    assert.strictEqual(isDetailCardVisible('feelsLike', { feelsLike: true }), true);

    // Verify Inspector has DetailCardsOrderSection with correct DOM IDs
    const inspectorFile = path.resolve('src/components/Inspector.tsx');
    const inspectorContent = fs.readFileSync(inspectorFile, 'utf-8');

    assert.ok(
      inspectorContent.includes('id="inspector-weather-detail-cards-list"'),
      'Inspector contains detail cards list'
    );
    assert.ok(
      inspectorContent.includes('inspector-weather-detail-toggle-'),
      'Inspector contains visibility toggle buttons'
    );
    assert.ok(
      inspectorContent.includes('inspector-weather-detail-up-'),
      'Inspector contains reorder up arrow buttons'
    );
    assert.ok(
      inspectorContent.includes('inspector-weather-detail-down-'),
      'Inspector contains reorder down arrow buttons'
    );

    // Verify WeatherAlertsSection hides Additional Conditions if no visible cards
    const alertsSectionFile = path.resolve('src/components/weather/WeatherAlertsSection.tsx');
    const alertsContent = fs.readFileSync(alertsSectionFile, 'utf-8');
    assert.ok(
      alertsContent.includes('visibleCardKeys.length > 0 && ('),
      'Additional Conditions card hides if all detail cards are hidden'
    );
  });

  it('9. Weather Alerts & Details Panel — v2.8 fixed height 235px and w-14 h-14 icon', () => {
    const detailCardFile = path.resolve('src/components/weather/WeatherDetailCard.tsx');
    const cardContent = fs.readFileSync(detailCardFile, 'utf-8');

    // Matches exact v2.8 fix snippet:
    // - bg-slate-950/55 border border-slate-800 rounded-xl h-[235px] flex flex-col items-center justify-center gap-3 text-center min-w-0 p-4
    // - <Icon className="w-14 h-14 text-sky-300 shrink-0" strokeWidth={1.5} />
    // - label text-[10px] font-bold uppercase tracking-wide text-slate-300 font-mono leading-tight break-words
    // - value text-lg font-black font-mono text-slate-100 leading-none
    assert.ok(
      cardContent.includes('h-[235px] flex flex-col items-center justify-center gap-3 text-center min-w-0 p-4'),
      'WeatherDetailCard uses fixed h-[235px], justify-center, p-4 and gap-3'
    );
    assert.ok(
      !cardContent.includes('h-full'),
      'WeatherDetailCard does not force h-full'
    );
    assert.ok(
      !cardContent.includes('bg-sky-500/10'),
      'Icon has no background box or button styling'
    );
    assert.ok(
      cardContent.includes('<Icon className="w-14 h-14 text-sky-300 shrink-0" strokeWidth={1.5} />'),
      'WeatherDetailCard renders fixed w-14 h-14 icon with shrink-0 and strokeWidth 1.5'
    );
    assert.ok(
      cardContent.includes('text-[10px] font-bold uppercase tracking-wide text-slate-300 font-mono leading-tight break-words'),
      'WeatherDetailCard label styling preserves break-words without truncate'
    );
  });
});

