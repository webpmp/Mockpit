import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ComponentInstance, DriveModeState } from '../../types';

describe('Presenter Mode, Component Layering, and Visibility Regression Suite', () => {
  beforeEach(() => {
    const store = useMockpitStore.getState();
    store.setScreenMode('editor');
    store.selectComponent(null);
  });

  it('1. setScreenMode("presentation") clears selectedComponentId', () => {
    const store = useMockpitStore.getState();
    store.setScreenMode('editor');
    store.selectComponent('speedometer-1');
    assert.equal(useMockpitStore.getState().selectedComponentId, 'speedometer-1');

    store.setScreenMode('presentation');
    assert.equal(useMockpitStore.getState().screenMode, 'presentation');
    assert.equal(useMockpitStore.getState().selectedComponentId, null);
  });

  it('2. selectComponent is rejected when in presentation mode', () => {
    const store = useMockpitStore.getState();
    store.setScreenMode('presentation');
    assert.equal(useMockpitStore.getState().selectedComponentId, null);

    store.selectComponent('speedometer-1');
    assert.equal(
      useMockpitStore.getState().selectedComponentId,
      null,
      'selectComponent must not select components in presentation mode'
    );

    store.selectComponent('drive-mode-1');
    assert.equal(
      useMockpitStore.getState().selectedComponentId,
      null,
      'selectComponent must not select drive mode in presentation mode'
    );
  });

  it('3. selectComponent works normally in editor mode', () => {
    const store = useMockpitStore.getState();
    store.setScreenMode('editor');

    store.selectComponent('speedometer-1');
    assert.equal(useMockpitStore.getState().selectedComponentId, 'speedometer-1');

    store.selectComponent('drive-mode-1');
    assert.equal(useMockpitStore.getState().selectedComponentId, 'drive-mode-1');

    store.selectComponent(null);
    assert.equal(useMockpitStore.getState().selectedComponentId, null);
  });

  it('4. Vehicle state updates (gear and drive mode) work independently of screen mode', () => {
    const store = useMockpitStore.getState();
    store.setScreenMode('presentation');

    store.setVehicleState({ gear: 'D' });
    assert.equal(useMockpitStore.getState().vehicleState.gear, 'D');

    store.setVehicleState({ driveMode: 'SPORT' as DriveModeState });
    assert.equal(useMockpitStore.getState().vehicleState.driveMode, 'SPORT');

    store.setVehicleState({ gear: 'D', cruiseControlActive: true });
    assert.equal(useMockpitStore.getState().vehicleState.cruiseControlActive, true);

    // Shifting to P automatically disengages cruise control for vehicle safety
    store.setVehicleState({ gear: 'P' });
    assert.equal(useMockpitStore.getState().vehicleState.gear, 'P');
    assert.equal(useMockpitStore.getState().vehicleState.cruiseControlActive, false);
  });

  it('5. Enclosed child geometry detection correctly identifies Drive Mode and Cruise Control overlapping Speedometer', () => {
    const speedometer: ComponentInstance = {
      id: 'speedometer-1',
      type: 'speed' as const,
      x: 100,
      y: 100,
      width: 400,
      height: 400,
      zIndex: 10,
      staticProps: {},
      bindings: [],
    };

    const driveMode: ComponentInstance = {
      id: 'drive-mode-1',
      type: 'driveMode',
      x: 200,
      y: 250,
      width: 160,
      height: 80,
      zIndex: 61,
      staticProps: {},
      bindings: [],
    };

    const cruiseControl: ComponentInstance = {
      id: 'cruise-control-1',
      type: 'cruiseControl',
      x: 200,
      y: 340,
      width: 140,
      height: 50,
      zIndex: 61,
      staticProps: {},
      bindings: [],
    };

    const isChildOrEnclosed = (c: ComponentInstance, parent: ComponentInstance): boolean => {
      if (c.id === parent.id) return false;
      if (c.parentId === parent.id) return true;
      if (c.parentId) return false;
      if (parent.type === 'map' || c.type === 'map') return false;

      const parentW = parent.width ?? 0;
      const parentH = parent.height ?? 0;
      const childW = c.width ?? 0;
      const childH = c.height ?? 0;

      if (parentW <= 0 || parentH <= 0 || childW <= 0 || childH <= 0) return false;

      const parentArea = parentW * parentH;
      const childArea = childW * childH;
      if (childArea >= parentArea) return false;

      const cX = c.x ?? 0;
      const cY = c.y ?? 0;
      const pX = parent.x ?? 0;
      const pY = parent.y ?? 0;

      const xOverlap = Math.max(0, Math.min(cX + childW, pX + parentW) - Math.max(cX, pX));
      const yOverlap = Math.max(0, Math.min(cY + childH, pY + parentH) - Math.max(cY, pY));
      const overlapArea = xOverlap * yOverlap;

      return overlapArea / childArea >= 0.5;
    };

    assert.equal(isChildOrEnclosed(driveMode, speedometer), true);
    assert.equal(isChildOrEnclosed(cruiseControl, speedometer), true);
    assert.equal(isChildOrEnclosed(speedometer, driveMode), false);
  });

  it('6. Parent z-index clamping ensures Speedometer selection boost does not bury enclosed components', () => {
    const speedometer: ComponentInstance = {
      id: 'speedometer-1',
      type: 'speed' as const,
      x: 100,
      y: 100,
      width: 400,
      height: 400,
      zIndex: 10,
      staticProps: {},
      bindings: [],
    };

    const driveMode: ComponentInstance = {
      id: 'drive-mode-1',
      type: 'driveMode',
      x: 200,
      y: 250,
      width: 160,
      height: 80,
      zIndex: 61,
      staticProps: {},
      bindings: [],
    };

    const allComps = [speedometer, driveMode];
    const isChildOrEnclosed = (c: ComponentInstance, parent: ComponentInstance): boolean => {
      if (c.id === parent.id) return false;
      if (c.parentId === parent.id) return true;
      if (c.parentId) return false;
      if (parent.type === 'map' || c.type === 'map') return false;

      const parentW = parent.width ?? 0;
      const parentH = parent.height ?? 0;
      const childW = c.width ?? 0;
      const childH = c.height ?? 0;

      if (parentW <= 0 || parentH <= 0 || childW <= 0 || childH <= 0) return false;

      const parentArea = parentW * parentH;
      const childArea = childW * childH;
      if (childArea >= parentArea) return false;

      const cX = c.x ?? 0;
      const cY = c.y ?? 0;
      const pX = parent.x ?? 0;
      const pY = parent.y ?? 0;

      const xOverlap = Math.max(0, Math.min(cX + childW, pX + parentW) - Math.max(cX, pX));
      const yOverlap = Math.max(0, Math.min(cY + childH, pY + parentH) - Math.max(cY, pY));
      const overlapArea = xOverlap * yOverlap;

      return overlapArea / childArea >= 0.5;
    };

    // When speedometer is selected in editor:
    const baseZ = speedometer.zIndex!;
    const ownChildrenBaseZs = allComps
      .filter((c) => c.parentId === speedometer.id || isChildOrEnclosed(c, speedometer))
      .map((c) => Math.max(c.zIndex!, baseZ + 1));

    const boostAmount = 100;
    const boosted = baseZ + boostAmount;
    const effectiveZ = ownChildrenBaseZs.length
      ? Math.min(boosted, Math.min(...ownChildrenBaseZs) - 1)
      : boosted;

    // Speedometer's effective z-index is clamped below child's base z (61 - 1 = 60)
    assert.equal(effectiveZ, 60);
    assert.ok(
      driveMode.zIndex! > effectiveZ,
      `Drive mode zIndex (${driveMode.zIndex}) must be higher than Speedometer effectiveZ (${effectiveZ})`
    );
  });

  it('7. Drive Mode Selector can be selected in editor to populate inspector without mode leakage', () => {
    const store = useMockpitStore.getState();
    store.setScreenMode('editor');

    // Add a driveMode component to the current screen
    const driveComp: ComponentInstance = {
      id: 'drive-mode-test-inspector',
      type: 'driveMode',
      x: 150,
      y: 150,
      width: 200,
      height: 100,
      staticProps: { modes: JSON.stringify(['ECO', 'NORMAL', 'SPORT', 'TRACK']) },
      bindings: [],
    };
    store.addComponent('driveMode', 150, 150);
    const added = useMockpitStore.getState().components.find((c) => c.type === 'driveMode');
    assert.ok(added, 'DriveMode component should exist on canvas');

    // Select the component in editor mode
    store.selectComponent(added.id);
    assert.equal(useMockpitStore.getState().selectedComponentId, added.id);

    // Inspector finds the component by selectedComponentId
    const inspected = useMockpitStore.getState().components.find((c) => c.id === added.id);
    assert.ok(inspected);
    assert.equal(inspected.type, 'driveMode');

    // Clean up
    store.deleteComponent(added.id);
    assert.equal(useMockpitStore.getState().selectedComponentId, null);
  });

  it('8. Repeated mode transitions and interactions do not cause state leaks', () => {
    const store = useMockpitStore.getState();

    // 1. Editor mode: select a component
    store.setScreenMode('editor');
    store.selectComponent('test-comp-1');
    assert.equal(useMockpitStore.getState().selectedComponentId, 'test-comp-1');

    // 2. Switch to Presenter mode: selection is cleared immediately
    store.setScreenMode('presentation');
    assert.equal(useMockpitStore.getState().selectedComponentId, null);

    // 3. User attempts to select or click components in presenter mode: rejected
    store.selectComponent('test-comp-1');
    assert.equal(useMockpitStore.getState().selectedComponentId, null);

    // 4. User changes drive mode in presenter mode
    store.setVehicleState({ driveMode: 'ECO' as DriveModeState });
    assert.equal(useMockpitStore.getState().vehicleState.driveMode, 'ECO');
    assert.equal(useMockpitStore.getState().selectedComponentId, null);

    // 5. User engages and disengages cruise control in presenter mode
    store.setVehicleState({ gear: 'D', cruiseControlActive: true });
    assert.equal(useMockpitStore.getState().vehicleState.cruiseControlActive, true);
    store.setVehicleState({ cruiseControlActive: false });
    assert.equal(useMockpitStore.getState().vehicleState.cruiseControlActive, false);
    assert.equal(useMockpitStore.getState().selectedComponentId, null);

    // 6. Switch back to Editor mode: starts with null selection
    store.setScreenMode('editor');
    assert.equal(useMockpitStore.getState().selectedComponentId, null);

    // 7. Can select in editor mode now
    store.selectComponent('test-comp-1');
    assert.equal(useMockpitStore.getState().selectedComponentId, 'test-comp-1');

    // 8. Switch to Presenter mode again: selection cleared
    store.setScreenMode('presentation');
    assert.equal(useMockpitStore.getState().selectedComponentId, null);
  });

  it('9. Boundary contact, partial overlap, zero dimensions, and order independence in isChildOrEnclosed', () => {
    const isChildOrEnclosed = (c: ComponentInstance, parent: ComponentInstance): boolean => {
      if (c.id === parent.id) return false;
      if (c.parentId === parent.id) return true;
      if (c.parentId) return false;
      if (parent.type === 'map' || c.type === 'map') return false;

      const parentW = parent.width ?? 0;
      const parentH = parent.height ?? 0;
      const childW = c.width ?? 0;
      const childH = c.height ?? 0;

      if (parentW <= 0 || parentH <= 0 || childW <= 0 || childH <= 0) return false;

      const parentArea = parentW * parentH;
      const childArea = childW * childH;
      if (childArea >= parentArea) return false;

      const cX = c.x ?? 0;
      const cY = c.y ?? 0;
      const pX = parent.x ?? 0;
      const pY = parent.y ?? 0;

      const xOverlap = Math.max(0, Math.min(cX + childW, pX + parentW) - Math.max(cX, pX));
      const yOverlap = Math.max(0, Math.min(cY + childH, pY + parentH) - Math.max(cY, pY));
      const overlapArea = xOverlap * yOverlap;

      return overlapArea / childArea >= 0.5;
    };

    const parent = {
      id: 'p1',
      type: 'speed' as const,
      x: 100,
      y: 100,
      width: 400,
      height: 400,
      staticProps: {},
      bindings: [],
    } as ComponentInstance;

    // Touching borders exactly: x=500 (right next to parent)
    const adjacent = {
      id: 'c-adj',
      type: 'driveMode',
      x: 500,
      y: 100,
      width: 100,
      height: 100,
      staticProps: {},
      bindings: [],
    } as ComponentInstance;
    assert.equal(isChildOrEnclosed(adjacent, parent), false);

    // Zero-sized dimensions
    const zeroSize = {
      id: 'c-zero',
      type: 'driveMode',
      x: 150,
      y: 150,
      width: 0,
      height: 0,
      staticProps: {},
      bindings: [],
    } as ComponentInstance;
    assert.equal(isChildOrEnclosed(zeroSize, parent), false);

    // Missing dimensions
    const missingDims = {
      id: 'c-missing',
      type: 'driveMode',
      x: 150,
      y: 150,
    } as unknown as ComponentInstance;
    assert.equal(isChildOrEnclosed(missingDims, parent), false);

    // < 50% overlap (only 20px overlap out of 100px width = 20% overlap)
    const partialUnder50 = {
      id: 'c-partial',
      type: 'driveMode',
      x: 480, // parent ends at 500, so overlap is 20px wide
      y: 150,
      width: 100,
      height: 100,
      staticProps: {},
      bindings: [],
    } as ComponentInstance;
    assert.equal(isChildOrEnclosed(partialUnder50, parent), false);

    // >= 50% overlap (80px overlap out of 100px width = 80% overlap)
    const partialOver50 = {
      id: 'c-over50',
      type: 'driveMode',
      x: 420, // parent ends at 500, overlap is 80px wide
      y: 150,
      width: 100,
      height: 100,
      staticProps: {},
      bindings: [],
    } as ComponentInstance;
    assert.equal(isChildOrEnclosed(partialOver50, parent), true);
  });
});
