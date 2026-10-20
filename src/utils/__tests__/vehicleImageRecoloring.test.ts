import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import {
  isValidHexColor,
  hexToRgb,
  applyLuminance,
  recolorImageData,
  DEFAULT_EGO_COLORS,
  isVehicleColorsCustomized,
} from '../vehicleImageRecoloring';
import { getVehicleOriginalColors } from '../odvVehicleAssets';

describe('Vehicle Image Recoloring Engine Suite', () => {
  it('1. Validates hex color strings accurately', () => {
    assert.equal(isValidHexColor('#1f2937'), true);
    assert.equal(isValidHexColor('#38bdf8'), true);
    assert.equal(isValidHexColor('#fff'), true);
    assert.equal(isValidHexColor('#000000'), true);
    assert.equal(isValidHexColor('1f2937'), false);
    assert.equal(isValidHexColor('#12'), false);
    assert.equal(isValidHexColor('#gggggg'), false);
    assert.equal(isValidHexColor(''), false);
    assert.equal(isValidHexColor(null), false);
    assert.equal(isValidHexColor(undefined), false);
  });

  it('2. Converts hex colors to RGB channels', () => {
    assert.deepEqual(hexToRgb('#000000'), [0, 0, 0]);
    assert.deepEqual(hexToRgb('#ffffff'), [255, 255, 255]);
    assert.deepEqual(hexToRgb('#1f2937'), [31, 41, 55]);
    assert.deepEqual(hexToRgb('#fef08a'), [254, 240, 138]);
  });

  it('3. Applies photometric luminance transfer while preserving shading and highlights', () => {
    // Target: vibrant cyan [56, 189, 248]
    const shadow = applyLuminance(40, 40, 40, 56, 189, 248);
    const midtone = applyLuminance(128, 128, 128, 56, 189, 248);
    const highlight = applyLuminance(220, 220, 220, 56, 189, 248);

    // Shadow must be darker than midtone
    assert.ok(shadow[0] < midtone[0], 'Shadow red must be darker than midtone');
    assert.ok(shadow[1] < midtone[1], 'Shadow green must be darker than midtone');
    assert.ok(shadow[2] < midtone[2], 'Shadow blue must be darker than midtone');

    // Highlight must be brighter than midtone
    assert.ok(highlight[0] > midtone[0], 'Highlight red must be brighter than midtone');
    assert.ok(highlight[1] > midtone[1], 'Highlight green must be brighter than midtone');
  });

  it('4. Preserves transparency and alpha channel when recoloring image data', () => {
    const dir = path.resolve(process.cwd(), 'public/vehicles');
    const png = PNG.sync.read(fs.readFileSync(path.join(dir, 'odv-spyder.png')));
    const w = png.width;
    const h = png.height;

    const dataCopy = new Uint8ClampedArray(png.data);

    // Initial corner transparency check
    assert.equal(dataCopy[3], 0, 'Top-left corner must be transparent before recolor');

    // Apply custom colors
    recolorImageData(dataCopy, w, h, {
      body: '#38bdf8',
      trim: '#10b981',
      windows: '#6366f1',
      lights: '#facc15',
    });

    // Verify corners remain 100% transparent
    assert.equal(dataCopy[3], 0, 'Top-left corner must remain transparent after recolor');
    assert.equal(dataCopy[(w - 1) * 4 + 3], 0, 'Top-right corner must remain transparent');
    assert.equal(dataCopy[((h - 1) * w) * 4 + 3], 0, 'Bottom-left corner must remain transparent');
    assert.equal(dataCopy[((h - 1) * w + w - 1) * 4 + 3], 0, 'Bottom-right corner must remain transparent');

    // Verify non-transparent pixels have been recolored
    const hoodIdx = (Math.floor(h * 0.18) * w + Math.floor(w * 0.5)) * 4;
    assert.equal(dataCopy[hoodIdx + 3], 255, 'Hood pixel must remain fully opaque');
    // Blue target should have dominant blue channel on hood
    assert.ok(dataCopy[hoodIdx + 2] > dataCopy[hoodIdx], 'Blue channel should be dominant on sky-blue recolored hood');
  });

  it('5. Independent control: changing Body Color does not recolor Windows or Lights', () => {
    const dir = path.resolve(process.cwd(), 'public/vehicles');
    const png = PNG.sync.read(fs.readFileSync(path.join(dir, 'odv-spyder.png')));
    const w = png.width;
    const h = png.height;

    // Buffer A: red body
    const dataA = new Uint8ClampedArray(png.data);
    recolorImageData(dataA, w, h, {
      body: '#ef4444', // Red
      trim: '#2d3748',
      windows: '#0d131a',
      lights: '#fef08a',
    });

    // Buffer B: blue body
    const dataB = new Uint8ClampedArray(png.data);
    recolorImageData(dataB, w, h, {
      body: '#3b82f6', // Blue
      trim: '#2d3748',
      windows: '#0d131a',
      lights: '#fef08a',
    });

    const hoodIdx = (Math.floor(h * 0.18) * w + Math.floor(w * 0.5)) * 4;
    // Hood must change significantly between A and B
    assert.notEqual(dataA[hoodIdx], dataB[hoodIdx], 'Hood red channel must change when Body Color changes');

    // Headlight pixel must NOT change when only Body Color changes
    const lightIdx = (50 * w + 84) * 4;
    assert.equal(dataA[lightIdx], dataB[lightIdx], 'Headlight red must remain identical when Body Color changes');
    assert.equal(dataA[lightIdx + 1], dataB[lightIdx + 1], 'Headlight green must remain identical');

    // Windshield pixel must NOT change when only Body Color changes
    const winIdx = (Math.floor(h * 0.35) * w + Math.floor(w * 0.5)) * 4;
    assert.equal(dataA[winIdx], dataB[winIdx], 'Window red must remain identical when Body Color changes');
  });

  it('6. Independent control: changing Window Color changes windshield without affecting body', () => {
    const dir = path.resolve(process.cwd(), 'public/vehicles');
    const png = PNG.sync.read(fs.readFileSync(path.join(dir, 'odv-spyder.png')));
    const w = png.width;
    const h = png.height;

    // Buffer A: dark window
    const dataA = new Uint8ClampedArray(png.data);
    recolorImageData(dataA, w, h, {
      body: '#1f2937',
      trim: '#2d3748',
      windows: '#0d131a',
      lights: '#fef08a',
    });

    // Buffer B: bright cyan window
    const dataB = new Uint8ClampedArray(png.data);
    recolorImageData(dataB, w, h, {
      body: '#1f2937',
      trim: '#2d3748',
      windows: '#06b6d4',
      lights: '#fef08a',
    });

    const winIdx = (Math.floor(h * 0.35) * w + Math.floor(w * 0.5)) * 4;
    assert.notEqual(dataA[winIdx + 2], dataB[winIdx + 2], 'Windshield blue channel must change when Window Color changes');

    const hoodIdx = (Math.floor(h * 0.18) * w + Math.floor(w * 0.5)) * 4;
    assert.equal(dataA[hoodIdx], dataB[hoodIdx], 'Hood must not change when Window Color changes');
  });

  it('7. Default color values match specifications exactly', () => {
    assert.equal(DEFAULT_EGO_COLORS.body, '#1f2937');
    assert.equal(DEFAULT_EGO_COLORS.trim, '#2d3748');
    assert.equal(DEFAULT_EGO_COLORS.windows, '#0d131a');
    assert.equal(DEFAULT_EGO_COLORS.lights, '#fef08a');
  });

  it('8. Verifies isVehicleColorsCustomized returns false when colors match original and true when altered', () => {
    const orig = { body: '#2563eb', trim: '#1e293b', windows: '#1e293b', lights: '#fef08a' };
    assert.equal(isVehicleColorsCustomized(undefined, orig), false);
    assert.equal(isVehicleColorsCustomized({}, orig), false);
    assert.equal(isVehicleColorsCustomized({ body: '#2563eb', trim: '#1e293b', windows: '#1e293b', lights: '#fef08a' }, orig), false);
    // Custom body color
    assert.equal(isVehicleColorsCustomized({ body: '#ef4444' }, orig), true);
    // Custom window color
    assert.equal(isVehicleColorsCustomized({ windows: '#06b6d4' }, orig), true);
  });

  it('9. Verifies getVehicleOriginalColors provides authentic, non-generic starting colors for all ODV vehicles', () => {
    const spyder = getVehicleOriginalColors('spyder');
    const corvette = getVehicleOriginalColors('corvette');
    const cybercab = getVehicleOriginalColors('cybercab');
    const roadster = getVehicleOriginalColors('roadster');
    const sportswagon = getVehicleOriginalColors('sportswagon');
    const semi = getVehicleOriginalColors('semi');

    // Spyder (Auto) must be red
    assert.equal(spyder.body, '#94393a');
    // Corvette must be blue
    assert.equal(corvette.body, '#2563eb');
    // Cybercab must be gold
    assert.equal(cybercab.body, '#c5a059');
    // Roadster must be white
    assert.equal(roadster.body, '#e2e8f0');
    // Sportswagon must be forest green
    assert.equal(sportswagon.body, '#3b5846');
    // Semi must be white
    assert.equal(semi.body, '#f1f5f9');
  });

  it('10. Verifies OverheadDrivingVisualization standardizes headlights at top-left and top-right corners', () => {
    const odvPath = path.resolve(process.cwd(), 'src/components/OverheadDrivingVisualization.tsx');
    const content = fs.readFileSync(odvPath, 'utf-8');

    assert.ok(content.includes('id="ego-standardized-headlights"'), 'Must contain standardized headlights group');
    assert.ok(content.includes('const leftHeadlightX = -halfW + 10;'), 'Left headlight placed at top-left corner');
    assert.ok(content.includes('const rightHeadlightX = halfW - 10;'), 'Right headlight placed at top-right corner');
    assert.ok(content.includes('const headlightY = -halfH + 8;'), 'Headlights positioned at top corner Y');
    assert.ok(content.includes('effectiveLightColor'), 'Rendered headlights must react to effectiveLightColor');
  });

  it('11. Verifies Inspector.tsx isolates customization per vehicle without cross-contamination', () => {
    const inspectorPath = path.resolve(process.cwd(), 'src/components/Inspector.tsx');
    const content = fs.readFileSync(inspectorPath, 'utf-8');

    assert.ok(content.includes('getVehicleOriginalColors(activeVehicleId)'), 'Must initialize defaults with vehicle original colors');
    assert.ok(content.includes('delete nextMap[\'_shared\']'), 'Must prevent shared key contamination between models');
  });
});
