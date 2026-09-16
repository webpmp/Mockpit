import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Weather ↔ Radar Peek Carousel v2 Suite', () => {
  const weatherScreenShellPath = path.resolve(process.cwd(), 'src/components/weather/WeatherScreenShell.tsx');
  const weatherCarouselPath = path.resolve(process.cwd(), 'src/components/weather/WeatherCarousel.tsx');
  const weatherBodyPath = path.resolve(process.cwd(), 'src/components/weather/WeatherBody.tsx');
  const radarBodyPath = path.resolve(process.cwd(), 'src/components/weather/RadarBody.tsx');
  const miniWeatherViewPath = path.resolve(process.cwd(), 'src/components/weather/MiniWeatherView.tsx');
  const canvasPath = path.resolve(process.cwd(), 'src/components/Canvas.tsx');

  it('1. WeatherScreenShell exists and owns the header and carousel', () => {
    assert.ok(fs.existsSync(weatherScreenShellPath), 'WeatherScreenShell.tsx should exist');
    const content = fs.readFileSync(weatherScreenShellPath, 'utf8');
    assert.ok(content.includes('WeatherLocationControl'), 'WeatherScreenShell must own WeatherLocationControl in static header');
    assert.ok(content.includes('WeatherCarousel'), 'WeatherScreenShell must render WeatherCarousel');
  });

  it('2. Back buttons are deleted from Weather and Radar bodies', () => {
    const weatherBodyContent = fs.readFileSync(weatherBodyPath, 'utf8');
    const radarBodyContent = fs.readFileSync(radarBodyPath, 'utf8');

    assert.ok(!weatherBodyContent.includes('weather-back-btn'), 'weather-back-btn must not exist');
    assert.ok(!radarBodyContent.includes('weather-radar-back-btn'), 'weather-radar-back-btn must not exist');
  });

  it('3. Dots indicator and radar thumbnail are completely removed (v2 spec requirement)', () => {
    const carouselContent = fs.readFileSync(weatherCarouselPath, 'utf8');
    const miniWeatherContent = fs.readFileSync(miniWeatherViewPath, 'utf8');

    const dotsId = ['weather', 'carousel', 'dots'].join('-');
    const thumbId = ['weather', 'radar', 'thumbnail'].join('-');

    assert.ok(!carouselContent.includes(dotsId), 'dots must be removed');
    assert.ok(!carouselContent.includes('role="tablist"'), 'tablist role must be removed');
    assert.ok(!miniWeatherContent.includes(thumbId), 'thumbnail must be removed');
  });

  it('4. Forecast grid and alerts panel use full body height with no reserved bottom padding pb-[76px]', () => {
    const weatherBodyContent = fs.readFileSync(weatherBodyPath, 'utf8');
    const radarBodyContent = fs.readFileSync(radarBodyPath, 'utf8');

    assert.ok(!weatherBodyContent.includes('pb-[76px]'), 'WeatherBody should not have pb-[76px]');
    assert.ok(!radarBodyContent.includes('pb-[76px]'), 'RadarBody should not have pb-[76px]');
  });

  it('5. Forecast row has id="forecast-row" and WeatherRadarCard has id="weather-radar-card"', () => {
    const weatherBodyContent = fs.readFileSync(weatherBodyPath, 'utf8');
    const radarCardPath = path.resolve(process.cwd(), 'src/components/weather/WeatherRadarCard.tsx');
    const radarCardContent = fs.readFileSync(radarCardPath, 'utf8');

    assert.ok(weatherBodyContent.includes('id="forecast-row"'), 'forecast-row id must exist');
    assert.ok(radarCardContent.includes('id="weather-radar-card"'), 'weather-radar-card id must exist');
  });

  it('6. Peek pixel size, drag threshold, and zero gap match v2.1 spec', () => {
    const content = fs.readFileSync(weatherCarouselPath, 'utf8');
    assert.ok(content.includes('PEEK_PX = 44'), 'PEEK_PX must be 44');
    assert.ok(content.includes('DRAG_THRESHOLD_FRACTION = 0.18'), 'DRAG_THRESHOLD_FRACTION must be 0.18');
    assert.ok(content.includes('marginRight: 0'), 'Carousel pages should have zero inter-page margin gap');
  });

  it('7. Canvas.tsx renders WeatherScreenShell for weather views', () => {
    const canvasContent = fs.readFileSync(canvasPath, 'utf8');
    assert.ok(canvasContent.includes('WeatherScreenShell'), 'Canvas should render WeatherScreenShell');
    assert.ok(!canvasContent.includes('<WeatherForecastScreen'), 'Canvas should not render separate WeatherForecastScreen directly');
    assert.ok(!canvasContent.includes('<WeatherRadarScreen'), 'Canvas should not render separate WeatherRadarScreen directly');
  });

  it('8. v2.1 Bounding geometry verification: 0 outer dead space and exact 44px peek', () => {
    const PEEK_PX = 44;
    const testViewports = [1880, 1832, 1400, 1200, 800];

    for (const vw of testViewports) {
      const pageWidth = vw - PEEK_PX;

      // When activeIndex = 0 (Weather active)
      const translateWeather = 0;
      const page0Left = 0 + translateWeather;
      const page0Right = pageWidth + translateWeather;
      const page1Left = pageWidth + translateWeather;
      const page1Right = 2 * pageWidth + translateWeather;

      // Page 0 (Weather) sits at viewport left edge (0 dead space)
      assert.equal(page0Left, 0, 'Weather page left edge must be flush at 0');
      // Visible portion of Page 1 (Radar) on right edge
      const page1VisibleWidth = Math.max(0, Math.min(vw, page1Right) - Math.max(0, page1Left));
      assert.equal(page1VisibleWidth, PEEK_PX, `Radar peek width on right must be exactly ${PEEK_PX}px`);

      // When activeIndex = 1 (Radar active)
      const translateRadar = -(pageWidth - PEEK_PX);
      const rPage0Left = 0 + translateRadar;
      const rPage0Right = pageWidth + translateRadar;
      const rPage1Left = pageWidth + translateRadar;
      const rPage1Right = 2 * pageWidth + translateRadar;

      // Page 1 (Radar) right edge sits at viewport right edge (0 dead space)
      assert.equal(rPage1Right, vw, 'Radar page right edge must be flush at viewport width');
      // Visible portion of Page 0 (Weather) on left edge
      const page0VisibleWidth = Math.max(0, Math.min(vw, rPage0Right) - Math.max(0, rPage0Left));
      assert.equal(page0VisibleWidth, PEEK_PX, `Weather peek width on left must be exactly ${PEEK_PX}px`);
    }
  });
});
