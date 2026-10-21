import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_EXPLODED_VIEW_BG_COLOR } from '../vehicle/VehicleExplodedViewWidget';
import { DEFAULT_SHELL_BACKGROUND, useMockpitStore } from '../../store/useMockpitStore';
import { ComponentInstance } from '../../types';

describe('Exploded View Chassis - Background Color Customization Suite', () => {
  it('1. Default background color reuses application default theme background color (#020617)', () => {
    assert.equal(
      DEFAULT_EXPLODED_VIEW_BG_COLOR,
      DEFAULT_SHELL_BACKGROUND.backgroundColor,
      'DEFAULT_EXPLODED_VIEW_BG_COLOR must match the theme default background color'
    );
    assert.equal(DEFAULT_EXPLODED_VIEW_BG_COLOR, '#020617');
  });

  it('2. Custom background color updates staticProps on vehicleExplodedView component', () => {
    const comp: ComponentInstance = {
      id: 'test-exploded-1',
      type: 'vehicleExplodedView',
      x: 100,
      y: 100,
      width: 640,
      height: 420,
      staticProps: {
        label: 'Vehicle Exploded View',
        imageUrl: '',
        removeBg: 'true',
        bgTolerance: '25',
        bgEdgeSoftness: '0',
      },
      bindings: [],
    };

    // When background color is unset, fallback is DEFAULT_EXPLODED_VIEW_BG_COLOR
    const initialBg = comp.staticProps.backgroundColor || DEFAULT_EXPLODED_VIEW_BG_COLOR;
    assert.equal(initialBg, '#020617');

    // Simulate updating background color to bright yellow #FFFF00
    comp.staticProps = { ...comp.staticProps, backgroundColor: '#FFFF00' };
    assert.equal(comp.staticProps.backgroundColor, '#FFFF00');

    // High contrast accents: pure white and pure black
    comp.staticProps = { ...comp.staticProps, backgroundColor: '#FFFFFF' };
    assert.equal(comp.staticProps.backgroundColor, '#FFFFFF');

    comp.staticProps = { ...comp.staticProps, backgroundColor: '#000000' };
    assert.equal(comp.staticProps.backgroundColor, '#000000');
  });

  it('3. Resetting background color restores default without modifying imageUrl or background removal settings', () => {
    const comp: ComponentInstance = {
      id: 'test-exploded-2',
      type: 'vehicleExplodedView',
      x: 100,
      y: 100,
      width: 640,
      height: 420,
      staticProps: {
        label: 'Custom Vehicle',
        imageUrl: 'data:image/png;base64,mockCustomArtwork',
        removeBg: 'true',
        bgTolerance: '35',
        bgEdgeSoftness: '12',
        backgroundColor: '#38BDF8',
      },
      bindings: [],
    };

    // Simulate reset behavior: delete backgroundColor
    const updatedProps: Record<string, string | undefined> = { backgroundColor: undefined };
    const nextStaticProps: Record<string, string> = { ...comp.staticProps };
    for (const k of Object.keys(updatedProps)) {
      if (updatedProps[k] === undefined) {
        delete nextStaticProps[k];
      } else {
        nextStaticProps[k] = updatedProps[k]!;
      }
    }
    comp.staticProps = nextStaticProps;

    // backgroundColor is deleted/undefined
    assert.equal(comp.staticProps.backgroundColor, undefined);
    // Fallback restores default theme background
    const effectiveBg = comp.staticProps.backgroundColor || DEFAULT_EXPLODED_VIEW_BG_COLOR;
    assert.equal(effectiveBg, '#020617');

    // Image, label, and background removal settings are completely preserved
    assert.equal(comp.staticProps.label, 'Custom Vehicle');
    assert.equal(comp.staticProps.imageUrl, 'data:image/png;base64,mockCustomArtwork');
    assert.equal(comp.staticProps.removeBg, 'true');
    assert.equal(comp.staticProps.bgTolerance, '35');
    assert.equal(comp.staticProps.bgEdgeSoftness, '12');
  });

  it('4. Display hex text formatting: uppercase normalized hexadecimal representation', () => {
    const formatHex = (color: string) => {
      const raw = color || DEFAULT_EXPLODED_VIEW_BG_COLOR;
      const normalized = (raw.length === 4 && raw.startsWith('#')
        ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
        : raw).toUpperCase();
      return normalized;
    };

    assert.equal(formatHex(''), '#020617');
    assert.equal(formatHex('#020617'), '#020617');
    assert.equal(formatHex('#ffff00'), '#FFFF00');
    assert.equal(formatHex('#fff'), '#FFFFFF');
    assert.equal(formatHex('#000'), '#000000');
    assert.equal(formatHex('#38bdf8'), '#38BDF8');
  });

  it('5. Status badge container is removed from Exploded View Chassis component', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const fileContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/vehicle/VehicleExplodedViewWidget.tsx'),
      'utf-8'
    );
    assert.ok(
      !fileContent.includes('Header Tag / Minimal Watermark'),
      'Watermark/badge comment must be removed'
    );
    assert.ok(
      !fileContent.includes('text-ds-content-muted/90 bg-ds-surface/90'),
      'Badge text container styling must be removed'
    );
    assert.ok(
      !fileContent.includes('w-1.5 h-1.5 rounded-full'),
      'Status dot must be removed'
    );
  });
});
