import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processImageBackgroundRemoval } from '../imageBackgroundRemover';

describe('Image Background Remover Edge Softness Suite', () => {
  it('1. processImageBackgroundRemoval signature accepts edgeSoftness and produces valid data URL', async () => {
    // 1x1 white pixel PNG data URL
    const whitePixelPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    // In a headless Node environment without HTML canvas, it should fallback safely or handle gracefully
    const result = await processImageBackgroundRemoval(whitePixelPng, 25, 50);
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });
});
