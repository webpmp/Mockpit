import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Pre-load useWeatherStore before window is set so it doesn't trigger boot network requests
await import('../../store/useWeatherStore');

// Provide minimal window shim required for Leaflet evaluation in Node
const styleMock = {
  setProperty: () => {},
  removeProperty: () => {},
  getPropertyValue: () => '',
};

const win: any = {
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  navigator: { userAgent: 'node' },
  screen: { deviceXDPI: 1, logicalXDPI: 1 },
  devicePixelRatio: 1,
  document: {
    documentElement: { style: styleMock },
    getElementById: () => null,
    createElement: () => ({ style: styleMock, setAttribute: () => {} }),
    head: { appendChild: () => {} },
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
};

(globalThis as any).window = win;
(globalThis as any).document = win.document;
(globalThis as any).localStorage = win.localStorage;

const { getAlphaColor } = await import('../ComponentRenderer');
const { useMockpitStore } = await import('../../store/useMockpitStore');

describe('getAlphaColor Helper Suite', () => {
  before(() => {
    // Ensure playback timer is stopped so node process exits cleanly
    useMockpitStore.getState().setIsPlaying(false);
  });

  after(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).localStorage;
  });

  it('returns color-mix for CSS variable input', () => {
    assert.equal(
      getAlphaColor('var(--color-ds-warning)', '40', 25),
      'color-mix(in srgb, var(--color-ds-warning) 25%, transparent)'
    );
  });

  it('returns hex concatenation for hex color input', () => {
    assert.equal(getAlphaColor('#38bdf8', '40'), '#38bdf840');
  });

  it('returns var(--color-ds-primary) fallback for empty color input', () => {
    assert.equal(getAlphaColor('', '40'), 'var(--color-ds-primary)');
  });
});
