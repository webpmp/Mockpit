import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveEgoVehicleType } from '../../utils/vehicleAssets';

describe('Independent Vehicle Background Watermark & Overhead Ego Silhouette Suite', () => {
  it('1. Verifies Dual-Bound Vehicle Model notice is completely removed from SettingsModal', () => {
    const settingsPath = path.resolve(process.cwd(), 'src/components/SettingsModal.tsx');
    const content = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(
      !content.includes('Dual-Bound Vehicle Model'),
      'Dual-Bound Vehicle Model text must be completely removed'
    );
    assert.ok(
      !content.includes('Selecting a Vehicle Model above drives both'),
      'Dual binding explanation copy must be removed'
    );
  });

  it('2. Verifies SettingsModal includes separate, dedicated Navigation Overhead Ego Silhouette controls', () => {
    const settingsPath = path.resolve(process.cwd(), 'src/components/SettingsModal.tsx');
    const content = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(
      content.includes('NAVIGATION OVERHEAD EGO SILHOUETTE'),
      'SettingsModal must include a separate section for Navigation Overhead Ego Silhouette'
    );
    assert.ok(
      content.includes('EgoVehicleCarousel'),
      'SettingsModal must render EgoVehicleCarousel for configuring Ego vehicle silhouette'
    );
    assert.ok(
      content.includes('setEgoVehicleType(v.id as any)'),
      'Selecting a vehicle in the ego section must update egoVehicleType independently'
    );
  });

  it('3. Verifies OverheadDrivingVisualization decouples ego silhouette from vehicleBackground watermark', () => {
    const odvPath = path.resolve(process.cwd(), 'src/components/OverheadDrivingVisualization.tsx');
    const content = fs.readFileSync(odvPath, 'utf-8');

    assert.ok(
      !content.includes('storeVehicleBg?.vehicle'),
      'OverheadDrivingVisualization must not drive activeEgoType from vehicleBackground'
    );
    assert.ok(
      !content.includes('getEgoVehicleTypeFromAsset(storeVehicleBg.vehicle)'),
      'OverheadDrivingVisualization must not fall back to vehicleBackground asset'
    );
    assert.ok(
      content.includes('id="ego-vehicle-graphic"'),
      'Overhead driving ego vehicle graphic remains intact'
    );
  });

  it('4. Verifies resolveEgoVehicleType resolves egoVehicleType independently of vehicleBgAsset', () => {
    // If configured type is present, uses configured type
    assert.equal(resolveEgoVehicleType('truck', '/vehicles/processed/vehicle-01.png', 'spyder'), 'truck');

    // If configured type is auto or empty, uses storeEgoVehicleType regardless of vehicleBgAsset
    assert.equal(resolveEgoVehicleType('auto', '/vehicles/processed/vehicle-01.png', 'suv'), 'suv');
    assert.equal(resolveEgoVehicleType(undefined, '/vehicles/processed/vehicle-01.png', 'crossover'), 'crossover');

    // Default fallback to spyder if no store ego vehicle type
    assert.equal(resolveEgoVehicleType(undefined, '/vehicles/processed/vehicle-01.png', undefined), 'spyder');
  });
});
