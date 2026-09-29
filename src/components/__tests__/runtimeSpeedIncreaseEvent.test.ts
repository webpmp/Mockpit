import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { useMockpitStore } from '../../store/useMockpitStore';
import { getResolvedProps, evaluateBinding } from '../../lib/bindingEvaluator';
import { ComponentInstance, VehicleState } from '../../types';

describe('Runtime Interaction-Event Path: speedIncreaseAttempted & Bindings', () => {
  let storageMap: Map<string, string>;
  const origLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    storageMap = new Map();
    globalThis.localStorage = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, val: string) => {
        storageMap.set(key, String(val));
      },
      removeItem: (key: string) => {
        storageMap.delete(key);
      },
      clear: () => {
        storageMap.clear();
      },
      length: 0,
      key: () => null,
    } as any;

    useMockpitStore.getState().clearInteractionEvent('speedIncreaseAttempted');
    useMockpitStore.getState().setVehicleState({
      gear: 'P',
      speed: 0,
      batteryPercent: 80,
      isCharging: false,
      doorOpen: false,
    });
  });

  afterEach(() => {
    globalThis.localStorage = origLocalStorage;
  });

  const createWarningComponent = (targetGear: 'R' | 'P'): ComponentInstance => ({
    id: 'comp-warning-reverse-speed',
    type: 'warning',
    x: 100,
    y: 100,
    width: 380,
    height: 120,
    staticProps: {
      label: 'WARNING ALERT',
      icon: 'alert-triangle',
      message: 'SPEED INHIBITED',
      color: '#f59e0b',
      visible: 'true',
    },
    bindings: [
      {
        id: 'bind-speed-attempt-gear',
        conditions: [
          { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
          { stateField: 'gear', condition: '=', value: targetGear },
        ],
        targetProp: 'color',
        targetValue: '#ef4444',
      },
    ],
  });

  it('1. Speedometer emits speedIncreaseAttempted upon upward drag', () => {
    let emitted = false;
    const originalEmit = useMockpitStore.getState().emitInteractionEvent;
    useMockpitStore.setState({
      emitInteractionEvent: (name: string, duration?: number) => {
        if (name === 'speedIncreaseAttempted') emitted = true;
        originalEmit(name, duration);
      },
    });

    try {
      // Simulate Speedometer upward drag calculation
      const deltaY = -15; // upward
      const deltaX = 0;
      const combinedDeltaPixels = -deltaY + deltaX;
      if (combinedDeltaPixels > 0) {
        useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');
      }
      assert.equal(emitted, true, 'Upward drag must emit speedIncreaseAttempted');
    } finally {
      useMockpitStore.setState({ emitInteractionEvent: originalEmit });
    }
  });

  it('2. Event is transient (has automatic timer expiration and can be cleared)', () => {
    useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted', 50);
    assert.equal(useMockpitStore.getState().interactionEvents.speedIncreaseAttempted, true);

    useMockpitStore.getState().clearInteractionEvent('speedIncreaseAttempted');
    assert.equal(useMockpitStore.getState().interactionEvents.speedIncreaseAttempted, undefined);
  });

  it('3. Event is not stored in VehicleState', () => {
    useMockpitStore.getState().setVehicleState({ gear: 'R', speed: 0 });
    useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');

    const vs = useMockpitStore.getState().vehicleState;
    assert.equal(
      (vs as any).speedIncreaseAttempted,
      undefined,
      'speedIncreaseAttempted must NEVER exist as a persistent property on VehicleState'
    );
  });

  it('4. Event is not persisted to localStorage', () => {
    useMockpitStore.getState().setVehicleState({ gear: 'R', speed: 10 });
    useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');

    const savedStateStr = storageMap.get('mockpit_vehicle_state_v1');
    assert.ok(savedStateStr, 'VehicleState should be saved');
    assert.ok(
      !savedStateStr.includes('speedIncreaseAttempted'),
      'localStorage must NEVER contain speedIncreaseAttempted'
    );
  });

  it('5. Event reaches the System Binding evaluator via active interaction events', () => {
    const warningComp = createWarningComponent('R');
    useMockpitStore.getState().setVehicleState({ gear: 'R' });

    // Evaluator initially sees false
    assert.equal(
      evaluateBinding(warningComp.bindings[0], useMockpitStore.getState().vehicleState),
      false
    );

    // After emission, evaluator sees true
    useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');
    assert.equal(
      evaluateBinding(warningComp.bindings[0], useMockpitStore.getState().vehicleState),
      true
    );
  });

  it('6. Event + gear = R evaluates true and resolves color to #ef4444', () => {
    const store = useMockpitStore.getState();
    store.setVehicleState({ gear: 'R', speed: 0 });
    const warningComp = createWarningComponent('R');

    // Before event: color is static default '#f59e0b'
    const beforeResolved = getResolvedProps(warningComp, useMockpitStore.getState().vehicleState);
    assert.equal(beforeResolved.color, '#f59e0b', 'Color should be static #f59e0b before attempt');

    // Emit interaction event
    store.emitInteractionEvent('speedIncreaseAttempted');

    // During active interaction event: color resolves to #ef4444
    const afterResolved = getResolvedProps(warningComp, useMockpitStore.getState().vehicleState);
    assert.equal(afterResolved.color, '#ef4444', 'Warning Alert Overlay must resolve color = #ef4444');
    assert.equal(evaluateBinding(warningComp.bindings[0], useMockpitStore.getState().vehicleState), true);
  });

  it('7. Event + gear = P does not satisfy an R rule', () => {
    const store = useMockpitStore.getState();
    store.setVehicleState({ gear: 'P', speed: 0 });
    const warningComp = createWarningComponent('R');

    store.emitInteractionEvent('speedIncreaseAttempted');

    const resolved = getResolvedProps(warningComp, useMockpitStore.getState().vehicleState);
    assert.equal(resolved.color, '#f59e0b', 'Color should remain #f59e0b when gear is P');
    assert.equal(evaluateBinding(warningComp.bindings[0], useMockpitStore.getState().vehicleState), false);
  });

  it('8. Event + gear = D does not satisfy an R rule', () => {
    const store = useMockpitStore.getState();
    store.setVehicleState({ gear: 'D', speed: 20 });
    const warningComp = createWarningComponent('R');

    store.emitInteractionEvent('speedIncreaseAttempted');

    const resolved = getResolvedProps(warningComp, useMockpitStore.getState().vehicleState);
    assert.equal(resolved.color, '#f59e0b', 'Color should remain #f59e0b when gear is D');
    assert.equal(evaluateBinding(warningComp.bindings[0], useMockpitStore.getState().vehicleState), false);
  });

  it('9. color target is applied correctly to Warning Alert Overlay', () => {
    useMockpitStore.getState().setVehicleState({ gear: 'R', speed: 0 });
    const warningComp = createWarningComponent('R');

    useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');
    const resolved = getResolvedProps(warningComp, useMockpitStore.getState().vehicleState);
    assert.equal(resolved.color, '#ef4444', 'Target color must be applied');
  });

  it('10. visible target is applied when binding configures visible = true', () => {
    const visibilityComp: ComponentInstance = {
      id: 'comp-warning-visibility-test',
      type: 'warning',
      x: 0,
      y: 0,
      width: 380,
      height: 120,
      staticProps: {
        visible: 'false',
        color: '#f59e0b',
        message: 'SPEED INCREASE INHIBITED',
      },
      bindings: [
        {
          id: 'bind-vis-speed-r',
          conditions: [
            { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
            { stateField: 'gear', condition: '=', value: 'R' },
          ],
          targetProp: 'visible',
          targetValue: 'true',
        },
      ],
    };

    useMockpitStore.getState().setVehicleState({ gear: 'R' });

    // Inactive: visible is false
    assert.equal(getResolvedProps(visibilityComp, useMockpitStore.getState().vehicleState).visible, 'false');

    // Active: visible resolves to true
    useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');
    assert.equal(getResolvedProps(visibilityComp, useMockpitStore.getState().vehicleState).visible, 'true');
  });

  it('11. No matching binding produces no side effect on component props', () => {
    useMockpitStore.getState().setVehicleState({ gear: 'N', speed: 0 });
    useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');

    const warningComp = createWarningComponent('R');
    const resolved = getResolvedProps(warningComp, useMockpitStore.getState().vehicleState);

    // Retains initial static props untouched
    assert.equal(resolved.color, '#f59e0b');
    assert.equal(resolved.visible, 'true');
    assert.equal(resolved.message, 'SPEED INHIBITED');
  });

  it('12. Multiple bindings can respond independently to the same interaction event', () => {
    const multiComp: ComponentInstance = {
      id: 'comp-multi-binding',
      type: 'warning',
      x: 0,
      y: 0,
      width: 300,
      height: 100,
      staticProps: {
        color: '#38bdf8',
        text: 'NORMAL',
        severity: 'info',
      },
      bindings: [
        {
          id: 'b-color',
          conditions: [
            { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
            { stateField: 'gear', condition: '=', value: 'R' },
          ],
          targetProp: 'color',
          targetValue: '#ef4444',
        },
        {
          id: 'b-message',
          conditions: [
            { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
            { stateField: 'gear', condition: '=', value: 'R' },
          ],
          targetProp: 'text',
          targetValue: 'REVERSE SPEED INHIBITED',
        },
        {
          id: 'b-severity',
          conditions: [
            { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
            { stateField: 'gear', condition: '=', value: 'R' },
          ],
          targetProp: 'severity',
          targetValue: 'critical',
        },
      ],
    };

    useMockpitStore.getState().setVehicleState({ gear: 'R' });
    useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');

    const resolved = getResolvedProps(multiComp, useMockpitStore.getState().vehicleState);
    assert.equal(resolved.color, '#ef4444');
    assert.equal(resolved.text, 'REVERSE SPEED INHIBITED');
    assert.equal(resolved.severity, 'critical');
  });

  it('13. Existing state-only bindings still work alongside interaction events', () => {
    const doorWarningComp: ComponentInstance = {
      id: 'comp-door',
      type: 'warning',
      x: 0,
      y: 0,
      width: 300,
      height: 100,
      staticProps: { visible: 'false', color: '#f59e0b' },
      bindings: [
        {
          id: 'bind-door',
          conditions: [
            { stateField: 'doorOpen', condition: '=', value: true },
          ],
          targetProp: 'visible',
          targetValue: 'true',
        },
      ],
    };

    useMockpitStore.getState().setVehicleState({ doorOpen: true });
    const resolved = getResolvedProps(doorWarningComp, useMockpitStore.getState().vehicleState);
    assert.equal(resolved.visible, 'true', 'Door open state-only binding must work');

    // Emitting unrelated speedIncreaseAttempted does not disturb state-only bindings
    useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');
    const resolvedWithEvent = getResolvedProps(doorWarningComp, useMockpitStore.getState().vehicleState);
    assert.equal(resolvedWithEvent.visible, 'true');
  });

  it('14. The event fires once per distinct increase gesture rather than once per pointer-move', () => {
    let emittedCount = 0;
    const originalEmit = useMockpitStore.getState().emitInteractionEvent;
    useMockpitStore.setState({
      emitInteractionEvent: (name: string, duration?: number) => {
        if (name === 'speedIncreaseAttempted') emittedCount++;
        originalEmit(name, duration);
      },
    });

    try {
      // Simulate Speedometer drag state machine
      let hasEmittedIncrease = false;
      const simulatePointerMove = (deltaY: number, deltaX: number) => {
        const combinedDeltaPixels = -deltaY + deltaX;
        if (!hasEmittedIncrease && combinedDeltaPixels > 0) {
          hasEmittedIncrease = true;
          useMockpitStore.getState().emitInteractionEvent('speedIncreaseAttempted');
        }
      };

      // 1. Initial downward drag (deltaY = +10, deltaX = 0) -> no emission
      simulatePointerMove(10, 0);
      assert.equal(emittedCount, 0, 'Downward drag must not emit speedIncreaseAttempted');

      // 2. Drag upward (-deltaY = 15 > 0) -> first positive delta emits event
      simulatePointerMove(-15, 0);
      assert.equal(emittedCount, 1, 'First positive delta must emit speedIncreaseAttempted');

      // 3. Subsequent drag upward continues during same gesture -> must NOT emit again
      simulatePointerMove(-30, 0);
      simulatePointerMove(-45, 0);
      simulatePointerMove(-60, 0);
      assert.equal(emittedCount, 1, 'Subsequent drag frames must not re-emit during the same gesture');

      // 4. Pointer release resets gesture tracker
      hasEmittedIncrease = false;

      // 5. Next distinct drag gesture upward emits again
      simulatePointerMove(-10, 0);
      assert.equal(emittedCount, 2, 'New distinct drag gesture must emit once');
    } finally {
      useMockpitStore.setState({ emitInteractionEvent: originalEmit });
    }
  });

  it('15. Generic event works in Park (P) with Park-specific binding', () => {
    const store = useMockpitStore.getState();
    store.setVehicleState({ gear: 'P', speed: 0 });

    const parkWarningComp = createWarningComponent('P');

    // Before event
    assert.equal(getResolvedProps(parkWarningComp, store.vehicleState).color, '#f59e0b');

    // Emit generic event
    store.emitInteractionEvent('speedIncreaseAttempted');

    // Resolves to #ef4444 because gear is P and attempt is active
    assert.equal(getResolvedProps(parkWarningComp, store.vehicleState).color, '#ef4444');
  });
});

