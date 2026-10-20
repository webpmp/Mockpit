import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import {
  getAvailableOdvVehicles,
  resolveOdvVehicle,
  getOdvVehicleLabel,
} from '../../utils/odvVehicleAssets';

describe('Ego Vehicle Carousel & ODV Image Assets Suite', () => {
  it('1. Verifies all 14 ODV vehicles exist and are registered in known assets', () => {
    const list = getAvailableOdvVehicles();
    assert.ok(list.length >= 14, 'Expected at least 14 ODV vehicles, found ' + list.length);
    assert.equal(list[0].id, 'spyder', 'First default vehicle must be spyder');
    assert.equal(list[0].label, 'Auto', 'Spyder label must be Auto');
    assert.equal(list[0].filename, 'odv-spyder.png', 'Spyder filename must be odv-spyder.png');
  });

  it('2. Verifies label derivation for special cases and generic vehicle filenames', () => {
    assert.equal(getOdvVehicleLabel('odv-spyder.png'), 'Auto');
    assert.equal(getOdvVehicleLabel('odv-suv.png'), 'SUV');
    assert.equal(getOdvVehicleLabel('odv-crossover.png'), 'Crossover');
    assert.equal(getOdvVehicleLabel('odv-compact-sedan.png'), 'Compact Sedan');
    assert.equal(getOdvVehicleLabel('odv-modely.png'), 'Model Y');
    assert.equal(getOdvVehicleLabel('odv-suv-blue.png'), 'SUV Blue');
  });

  it('3. Verifies resolveOdvVehicle defaults gracefully to spyder for auto/null/undefined', () => {
    assert.equal(resolveOdvVehicle('auto').id, 'spyder');
    assert.equal(resolveOdvVehicle(null).id, 'spyder');
    assert.equal(resolveOdvVehicle(undefined).id, 'spyder');
    assert.equal(resolveOdvVehicle('unknown-vehicle-type').id, 'spyder');
  });

  it('4. Verifies resolveOdvVehicle handles legacy silhouettes', () => {
    assert.equal(resolveOdvVehicle('compactSedan').id, 'sedan');
    assert.equal(resolveOdvVehicle('truck').id, 'truck');
    assert.equal(resolveOdvVehicle('coupe').id, 'coupe');
  });

  it('5. Verifies Inspector.tsx includes EgoVehicleCarousel and removes Silhouette select', () => {
    const inspectorPath = path.resolve(process.cwd(), 'src/components/Inspector.tsx');
    const content = fs.readFileSync(inspectorPath, 'utf-8');
    assert.ok(content.includes('<EgoVehicleCarousel'), 'Inspector must render EgoVehicleCarousel');
    assert.ok(!content.includes('Silhouette</span>'), 'Old Silhouette label must be removed');
  });

  it('6. Verifies OverheadDrivingVisualization renders image-based graphic with 72px alignment to headlights', () => {
    const odvPath = path.resolve(process.cwd(), 'src/components/OverheadDrivingVisualization.tsx');
    const content = fs.readFileSync(odvPath, 'utf-8');
    assert.ok(content.includes('id="ego-vehicle-graphic"'), 'Must contain ego-vehicle-graphic group');
    assert.ok(content.includes('const targetW = 72;'), 'Must scale vehicle width to 72 to match headlight beam');
    assert.ok(content.includes('preserveAspectRatio="xMidYMid meet"'), 'Must preserve aspect ratio');
    assert.ok(content.includes('resolveOdvVehicle(egoType)'), 'Must resolve ODV vehicle dynamically from egoType');
  });

  it('7. Verifies all 14 ODV vehicle PNG files have transparent backgrounds and alpha channel intact', () => {
    // PNG imported at top level
    const dir = path.resolve(process.cwd(), 'public/vehicles');
    const files = fs.readdirSync(dir).filter(f => f.startsWith('odv-') && f.endsWith('.png'));
    assert.equal(files.length, 14, 'Must have exactly 14 ODV PNG files');
    for (const f of files) {
      const png = PNG.sync.read(fs.readFileSync(path.join(dir, f)));
      const w = png.width, h = png.height;
      // All 4 corners must be completely transparent
      const cTL = png.data[3];
      const cTR = png.data[(w - 1) * 4 + 3];
      const cBL = png.data[((h - 1) * w) * 4 + 3];
      const cBR = png.data[((h - 1) * w + w - 1) * 4 + 3];
      assert.equal(cTL, 0, f + ' top-left corner must be transparent');
      assert.equal(cTR, 0, f + ' top-right corner must be transparent');
      assert.equal(cBL, 0, f + ' bottom-left corner must be transparent');
      assert.equal(cBR, 0, f + ' bottom-right corner must be transparent');
    }
  });
});
