import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EXPLODED_IMAGE_URL,
  DEFAULT_BEFORE_IMAGE_URL,
  DEFAULT_EXPLODED_NATURAL,
} from '../../utils/explodedViewImages';
import {
  DEFAULT_BEFORE_NATURAL,
  DEFAULT_EXPLODED_ARTWORK,
  DEFAULT_BEFORE_ARTWORK,
  getBeforeImageLayout,
  getImageContentRect,
  getCachedArtworkBounds,
  getCachedNaturalDimensions,
  setCachedArtworkBounds,
  setCachedNaturalDimensions,
} from '../../utils/imageContentRect';
import { getTargetCanvasCoords } from '../vehicle/ConnectorLayer';
import { ComponentInstance } from '../../types';

describe('Exploded View Before Image Scale and Alignment Suite', () => {
  it('1. Pre-seeded default natural dimensions and artwork bounding boxes', () => {
    const expNat = getCachedNaturalDimensions(DEFAULT_EXPLODED_IMAGE_URL);
    const befNat = getCachedNaturalDimensions(DEFAULT_BEFORE_IMAGE_URL);
    assert.deepEqual(expNat, { w: 1408, h: 768 });
    assert.deepEqual(befNat, { w: 1024, h: 1024 });

    const expArt = getCachedArtworkBounds(DEFAULT_EXPLODED_IMAGE_URL);
    const befArt = getCachedArtworkBounds(DEFAULT_BEFORE_IMAGE_URL);
    assert.deepEqual(expArt, DEFAULT_EXPLODED_ARTWORK);
    assert.deepEqual(befArt, DEFAULT_BEFORE_ARTWORK);
    assert.equal(expArt?.width, 936);
    assert.equal(expArt?.height, 529);
    assert.equal(befArt?.width, 936);
    assert.equal(befArt?.height, 529);
  });

  it('2. getBeforeImageLayout derives exact width match and center alignment for default pair at example workspace size (1122x748)', () => {
    const comp: ComponentInstance = {
      id: 'comp-vehicleExplodedView-msxk3mbe',
      type: 'vehicleExplodedView',
      x: 399,
      y: 166,
      width: 1122,
      height: 748,
      staticProps: {},
      bindings: [],
    };

    const natural = DEFAULT_EXPLODED_NATURAL;
    const frame = getImageContentRect(comp, natural, 4);

    // Exploded View artwork on screen (authoritative reference)
    const afterArtWOnScreen = (DEFAULT_EXPLODED_ARTWORK.width / natural.w) * frame.width;
    const afterArtCXOnScreen = ((DEFAULT_EXPLODED_ARTWORK.x + DEFAULT_EXPLODED_ARTWORK.width / 2) / natural.w) * frame.width;
    const afterArtCYOnScreen = ((DEFAULT_EXPLODED_ARTWORK.y + DEFAULT_EXPLODED_ARTWORK.height / 2) / natural.h) * frame.height;

    // Derived Before layout
    const layout = getBeforeImageLayout(frame);

    // Calculate Before artwork rendered on screen
    const scale = layout.width / DEFAULT_BEFORE_NATURAL.w;
    const beforeArtWOnScreen = DEFAULT_BEFORE_ARTWORK.width * scale;
    const beforeArtHOnScreen = DEFAULT_BEFORE_ARTWORK.height * scale;
    const beforeArtCXOnScreen = layout.left + (DEFAULT_BEFORE_ARTWORK.x + DEFAULT_BEFORE_ARTWORK.width / 2) * scale;
    const beforeArtCYOnScreen = layout.top + (DEFAULT_BEFORE_ARTWORK.y + DEFAULT_BEFORE_ARTWORK.height / 2) * scale;

    // Verification Criteria:
    // 1. Width match <= 2% difference (actually 0.00% exact match)
    const widthDiffPercent = (Math.abs(afterArtWOnScreen - beforeArtWOnScreen) / afterArtWOnScreen) * 100;
    assert.ok(
      widthDiffPercent <= 2.0,
      `Width difference must be <= 2%, got ${widthDiffPercent.toFixed(4)}%`
    );
    assert.ok(widthDiffPercent < 0.01, 'Width should match to within 0.01% floating precision');

    // 2. Center X alignment <= 1% of frame (actually 0.00% exact match)
    const cxDiffPercent = (Math.abs(afterArtCXOnScreen - beforeArtCXOnScreen) / frame.width) * 100;
    assert.ok(
      cxDiffPercent <= 1.0,
      `Center X offset must be <= 1% of frame, got ${cxDiffPercent.toFixed(4)}%`
    );

    // 3. Center Y alignment <= 1% of frame (actually 0.00% exact match)
    const cyDiffPercent = (Math.abs(afterArtCYOnScreen - beforeArtCYOnScreen) / frame.height) * 100;
    assert.ok(
      cyDiffPercent <= 1.0,
      `Center Y offset must be <= 1% of frame, got ${cyDiffPercent.toFixed(4)}%`
    );

    // 4. Aspect ratio preserved: width / height must equal natural aspect ratio (1.0 for 1024x1024)
    const renderedRatio = layout.width / layout.height;
    const naturalRatio = DEFAULT_BEFORE_NATURAL.w / DEFAULT_BEFORE_NATURAL.h;
    assert.ok(
      Math.abs(renderedRatio - naturalRatio) < 1e-6,
      `Aspect ratio must be preserved: expected ${naturalRatio}, got ${renderedRatio}`
    );

    // 5. Height close match (within natural artwork proportion difference ~2.5%)
    const afterArtHOnScreen = (DEFAULT_EXPLODED_ARTWORK.height / natural.h) * frame.height;
    const heightDiffPercent = (Math.abs(afterArtHOnScreen - beforeArtHOnScreen) / afterArtHOnScreen) * 100;
    assert.ok(
      heightDiffPercent < 5.0,
      `Height difference must be < 5%, got ${heightDiffPercent.toFixed(2)}%`
    );
  });

  it('3. Invariance across diverse container dimensions and aspect ratios', () => {
    const testSizes = [
      { width: 640, height: 480 },
      { width: 1408, height: 768 },
      { width: 1920, height: 1080 },
      { width: 500, height: 300 },
      { width: 1600, height: 400 }, // ultra-wide
      { width: 400, height: 800 },  // portrait
    ];

    for (const size of testSizes) {
      const frame = getImageContentRect({ x: 0, y: 0, width: size.width, height: size.height }, DEFAULT_EXPLODED_NATURAL, 4);
      const layout = getBeforeImageLayout(frame);

      const afterArtWOnScreen = (DEFAULT_EXPLODED_ARTWORK.width / DEFAULT_EXPLODED_NATURAL.w) * frame.width;
      const afterArtCXOnScreen = ((DEFAULT_EXPLODED_ARTWORK.x + DEFAULT_EXPLODED_ARTWORK.width / 2) / DEFAULT_EXPLODED_NATURAL.w) * frame.width;
      const afterArtCYOnScreen = ((DEFAULT_EXPLODED_ARTWORK.y + DEFAULT_EXPLODED_ARTWORK.height / 2) / DEFAULT_EXPLODED_NATURAL.h) * frame.height;

      const scale = layout.width / DEFAULT_BEFORE_NATURAL.w;
      const beforeArtWOnScreen = DEFAULT_BEFORE_ARTWORK.width * scale;
      const beforeArtCXOnScreen = layout.left + (DEFAULT_BEFORE_ARTWORK.x + DEFAULT_BEFORE_ARTWORK.width / 2) * scale;
      const beforeArtCYOnScreen = layout.top + (DEFAULT_BEFORE_ARTWORK.y + DEFAULT_BEFORE_ARTWORK.height / 2) * scale;

      const widthDiff = (Math.abs(afterArtWOnScreen - beforeArtWOnScreen) / afterArtWOnScreen) * 100;
      const cxDiff = (Math.abs(afterArtCXOnScreen - beforeArtCXOnScreen) / frame.width) * 100;
      const cyDiff = (Math.abs(afterArtCYOnScreen - beforeArtCYOnScreen) / frame.height) * 100;

      assert.ok(widthDiff <= 0.05, `Width diff at ${size.width}x${size.height} expected <= 0.05%, got ${widthDiff}%`);
      assert.ok(cxDiff <= 0.05, `Center X diff at ${size.width}x${size.height} expected <= 0.05%, got ${cxDiff}%`);
      assert.ok(cyDiff <= 0.05, `Center Y diff at ${size.width}x${size.height} expected <= 0.05%, got ${cyDiff}%`);
    }
  });

  it('4. Connector coordinates reference Exploded View frame and are 100% unaffected', () => {
    const comp: ComponentInstance = {
      id: 'comp-vehicleExplodedView-msxk3mbe',
      type: 'vehicleExplodedView',
      x: 399,
      y: 166,
      width: 1122,
      height: 748,
      staticProps: {},
      bindings: [],
    };

    // Calculate connector target coordinates
    const target1 = getTargetCanvasCoords(comp, 0.3435, 0.6999);
    const target2 = getTargetCanvasCoords(comp, 0.8541, 0.6794);

    const frame = getImageContentRect(comp, DEFAULT_EXPLODED_NATURAL, 4);

    // Ensure targets land inside the exploded image content rect exactly as intended
    assert.equal(target1.x, frame.x + 0.3435 * frame.width);
    assert.equal(target1.y, frame.y + 0.6999 * frame.height);
    assert.equal(target2.x, frame.x + 0.8541 * frame.width);
    assert.equal(target2.y, frame.y + 0.6794 * frame.height);
  });

  it('5. Custom image pairs with custom artwork bounds support', () => {
    const customExplodedSrc = '/custom/truck-after.png';
    const customBeforeSrc = '/custom/truck-before.png';

    setCachedArtworkBounds(customExplodedSrc, { x: 50, y: 50, width: 900, height: 400 });
    setCachedArtworkBounds(customBeforeSrc, { x: 100, y: 150, width: 800, height: 350 });

    const frame = { width: 1000, height: 500 };
    const expNat = { w: 1000, h: 500 };
    const befNat = { w: 1000, h: 600 };

    const layout = getBeforeImageLayout(
      frame,
      expNat,
      befNat,
      getCachedArtworkBounds(customExplodedSrc),
      getCachedArtworkBounds(customBeforeSrc)
    );

    // Exploded artwork width on screen = (900 / 1000) * 1000 = 900
    // Before artwork width in img = 800
    // Scale = 900 / 800 = 1.125
    assert.equal(layout.width, 1000 * 1.125);
    assert.equal(layout.height, 600 * 1.125);

    // Before artwork rendered width = 800 * 1.125 = 900 (exact match!)
    const beforeArtW = 800 * 1.125;
    assert.equal(beforeArtW, 900);
  });

  it('6. setCachedNaturalDimensions protects higher-resolution natural dimensions from being downgraded', () => {
    const testUrl = '/test/hi-res-vehicle.png';
    setCachedNaturalDimensions(testUrl, { w: 1408, h: 768 });
    assert.deepEqual(getCachedNaturalDimensions(testUrl), { w: 1408, h: 768 });

    // Attempting to set lower dimensions (e.g. from downscaled canvas 1200x655) must NOT overwrite
    setCachedNaturalDimensions(testUrl, { w: 1200, h: 655 });
    assert.deepEqual(getCachedNaturalDimensions(testUrl), { w: 1408, h: 768 });

    // Setting higher dimensions is allowed
    setCachedNaturalDimensions(testUrl, { w: 2048, h: 1024 });
    assert.deepEqual(getCachedNaturalDimensions(testUrl), { w: 2048, h: 1024 });
  });

  it('7. Exploded View (After) image is strictly read-only and unaffected by Before image calculations', () => {
    const comp: ComponentInstance = {
      id: 'comp-vehicleExplodedView-msxk3mbe',
      type: 'vehicleExplodedView',
      x: 399,
      y: 166,
      width: 1122,
      height: 748,
      staticProps: {},
      bindings: [],
    };

    const initialFrame = getImageContentRect(comp, DEFAULT_EXPLODED_NATURAL, 4);

    // Call getBeforeImageLayout multiple times with and without before image
    const layout = getBeforeImageLayout(initialFrame);
    assert.ok(layout.width > 0);
    assert.ok(layout.height > 0);

    // Exploded image content rect remains identical
    const afterFrame = getImageContentRect(comp, DEFAULT_EXPLODED_NATURAL, 4);
    assert.deepEqual(afterFrame, initialFrame);

    // Exploded View natural dimensions remain untouched
    const expNat = getCachedNaturalDimensions(DEFAULT_EXPLODED_IMAGE_URL);
    assert.deepEqual(expNat, { w: 1408, h: 768 });
  });

  it('8. Zero horizontal and vertical center offset for default pair', () => {
    const frame = { width: 1114, height: 608 };
    const layout = getBeforeImageLayout(frame);

    // Expected on-screen center of Exploded View artwork:
    // (704 / 1408) * 1114 = 557.00 px (exact 50.00% center)
    const expectedCenterX = 0.5 * frame.width;
    const actualCenterX = layout.left + (DEFAULT_BEFORE_ARTWORK.x + DEFAULT_BEFORE_ARTWORK.width / 2) * (layout.width / DEFAULT_BEFORE_NATURAL.w);
    assert.ok(
      Math.abs(expectedCenterX - actualCenterX) < 0.001,
      `Horizontal center must match to within 0.001 px, got expected ${expectedCenterX}, actual ${actualCenterX}`
    );

    // Width difference must be 0.00%
    const expectedWidth = (DEFAULT_EXPLODED_ARTWORK.width / DEFAULT_EXPLODED_NATURAL.w) * frame.width;
    const actualWidth = DEFAULT_BEFORE_ARTWORK.width * (layout.width / DEFAULT_BEFORE_NATURAL.w);
    assert.ok(
      Math.abs(expectedWidth - actualWidth) < 0.001,
      `Width must match to within 0.001 px, got expected ${expectedWidth}, actual ${actualWidth}`
    );
  });
});

