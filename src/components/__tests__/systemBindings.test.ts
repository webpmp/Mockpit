import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateConditionRule,
  evaluateBinding,
  evaluateBindingGroup,
  formatTargetValue,
  getResolvedProps,
} from '../../lib/bindingEvaluator';
import {
  Binding,
  BindingCondition,
  BindingConditionRule,
  BindingGroup,
  BindingStateField,
  ComponentInstance,
  VehicleState,
} from '../../types';
import { useMockpitStore } from '../../store/useMockpitStore';

describe('System Bindings Architecture - Multi-Condition & Binding Groups', () => {
  const baseVehicleState: any = {
    gear: 'P',
    speed: 0,
    batteryPercent: 80,
    isCharging: false,
    doorOpen: false,
    driveMode: 'Normal',
    cruiseControlActive: false,
    tirePressureWarning: false,
    speedIncreaseAttempted: false,
  };

  describe('evaluateConditionRule', () => {
    it('evaluates numeric comparisons correctly (<, >, <=, >=, =, !=)', () => {
      const state: VehicleState = { ...baseVehicleState, speed: 65 };

      assert.equal(
        evaluateConditionRule({ stateField: 'speed', condition: '<', value: 70 }, state),
        true
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'speed', condition: '<', value: 60 }, state),
        false
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'speed', condition: '>', value: 60 }, state),
        true
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'speed', condition: '>=', value: 65 }, state),
        true
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'speed', condition: '<=', value: 65 }, state),
        true
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'speed', condition: '=', value: 65 }, state),
        true
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'speed', condition: '!=', value: 50 }, state),
        true
      );
    });

    it('evaluates boolean fields correctly with boolean and string target values', () => {
      const stateCharging: VehicleState = { ...baseVehicleState, isCharging: true };
      const stateNotCharging: VehicleState = { ...baseVehicleState, isCharging: false };

      assert.equal(
        evaluateConditionRule({ stateField: 'isCharging', condition: '=', value: true }, stateCharging),
        true
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'isCharging', condition: '=', value: 'true' }, stateCharging),
        true
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'isCharging', condition: '=', value: false }, stateCharging),
        false
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'isCharging', condition: '!=', value: true }, stateNotCharging),
        true
      );
    });

    it('evaluates enum/string fields like gear case-insensitively', () => {
      const statePark: VehicleState = { ...baseVehicleState, gear: 'P' };
      const stateDrive: VehicleState = { ...baseVehicleState, gear: 'D' };

      assert.equal(
        evaluateConditionRule({ stateField: 'gear', condition: '=', value: 'P' }, statePark),
        true
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'gear', condition: '=', value: 'p' }, statePark),
        true
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'gear', condition: '=', value: 'D' }, statePark),
        false
      );
      assert.equal(
        evaluateConditionRule({ stateField: 'gear', condition: '!=', value: 'P' }, stateDrive),
        true
      );
    });
  });

  describe('evaluateBinding & evaluateBindingGroup with AND Logic', () => {
    it('evaluates legacy single-condition binding correctly', () => {
      const singleBinding: Binding = {
        id: 'bind-legacy-1',
        stateField: 'batteryPercent',
        condition: '<',
        value: 20,
        targetProp: 'color',
        targetValue: '#ef4444',
      };

      assert.equal(
        evaluateBinding(singleBinding, { ...baseVehicleState, batteryPercent: 12 }),
        true
      );
      assert.equal(
        evaluateBinding(singleBinding, { ...baseVehicleState, batteryPercent: 80 }),
        false
      );
    });

    it('evaluates multi-condition binding group using strict AND logic', () => {
      // Prompt example: Gear = P AND Speed Increase Attempted = true
      const parkSpeedAttemptGroup: BindingGroup = {
        id: 'bind-group-park-speed-attempt',
        conditions: [
          {
            stateField: 'gear',
            condition: '=',
            value: 'P',
          },
          {
            stateField: 'speedIncreaseAttempted',
            condition: '=',
            value: true,
          },
        ],
        targetProp: 'visible',
        targetValue: 'true',
      };

      // Both conditions match -> TRUE
      const stateBothMatch: any = {
        ...baseVehicleState,
        gear: 'P',
        speedIncreaseAttempted: true,
      };
      assert.equal(evaluateBindingGroup(parkSpeedAttemptGroup, stateBothMatch), true);
      assert.equal(evaluateBinding(parkSpeedAttemptGroup, stateBothMatch), true);

      // Only gear = P, speedIncreaseAttempted = false -> FALSE
      const stateOnlyGear: any = {
        ...baseVehicleState,
        gear: 'P',
        speedIncreaseAttempted: false,
      };
      assert.equal(evaluateBindingGroup(parkSpeedAttemptGroup, stateOnlyGear), false);
      assert.equal(evaluateBinding(parkSpeedAttemptGroup, stateOnlyGear), false);

      // Gear = D, speedIncreaseAttempted = true -> FALSE
      const stateOnlyAttempt: any = {
        ...baseVehicleState,
        gear: 'D',
        speedIncreaseAttempted: true,
      };
      assert.equal(evaluateBindingGroup(parkSpeedAttemptGroup, stateOnlyAttempt), false);
      assert.equal(evaluateBinding(parkSpeedAttemptGroup, stateOnlyAttempt), false);

      // Neither condition matches -> FALSE
      const stateNeither: any = {
        ...baseVehicleState,
        gear: 'D',
        speedIncreaseAttempted: false,
      };
      assert.equal(evaluateBindingGroup(parkSpeedAttemptGroup, stateNeither), false);
      assert.equal(evaluateBinding(parkSpeedAttemptGroup, stateNeither), false);
    });

    it('evaluates binding groups with 3 or more conditions correctly', () => {
      const tripleGroup: Binding = {
        id: 'bind-triple-1',
        conditions: [
          { stateField: 'gear', condition: '=', value: 'D' },
          { stateField: 'speed', condition: '>', value: 55 },
          { stateField: 'doorOpen', condition: '=', value: true },
        ],
        targetProp: 'severity',
        targetValue: 'critical',
      };

      // All 3 match
      assert.equal(
        evaluateBinding(tripleGroup, {
          ...baseVehicleState,
          gear: 'D',
          speed: 60,
          doorOpen: true,
        }),
        true
      );

      // 2 match, 1 fails
      assert.equal(
        evaluateBinding(tripleGroup, {
          ...baseVehicleState,
          gear: 'D',
          speed: 60,
          doorOpen: false,
        }),
        false
      );
    });

    it('returns false for empty conditions array', () => {
      const emptyGroup: BindingGroup = {
        id: 'bind-empty',
        conditions: [],
        targetProp: 'visible',
        targetValue: 'true',
      };
      assert.equal(evaluateBindingGroup(emptyGroup, baseVehicleState), false);
      assert.equal(evaluateBinding(emptyGroup, baseVehicleState), false);
    });
  });

  describe('getResolvedProps with binding groups', () => {
    it('applies binding group results to component appearance props', () => {
      const component: ComponentInstance = {
        id: 'comp-warning-park',
        type: 'warning',
        x: 100,
        y: 100,
        width: 300,
        height: 120,
        staticProps: {
          visible: 'false',
          text: 'Default Warning',
          color: '#ffffff',
        },
        bindings: [
          {
            id: 'bind-group-park-speed-attempt',
            conditions: [
              { stateField: 'gear', condition: '=', value: 'P' },
              { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
            ],
            targetProp: 'visible',
            targetValue: 'true',
          },
          {
            id: 'bind-group-park-speed-text',
            conditions: [
              { stateField: 'gear', condition: '=', value: 'P' },
              { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
            ],
            targetProp: 'text',
            targetValue: 'Shift Out of Park to Accelerate',
          },
        ],
      };

      // Inactive state: visible remains false, text remains Default Warning
      const resolvedInactive = getResolvedProps(component, {
        ...baseVehicleState,
        gear: 'P',
        speedIncreaseAttempted: false,
      } as any);
      assert.equal(resolvedInactive.visible, 'false');
      assert.equal(resolvedInactive.text, 'Default Warning');

      // Active state: visible becomes true, text becomes formatted warning
      const resolvedActive = getResolvedProps(component, {
        ...baseVehicleState,
        gear: 'P',
        speedIncreaseAttempted: true,
      } as any);
      assert.equal(resolvedActive.visible, 'true');
      assert.equal(resolvedActive.text, 'Shift Out of Park to Accelerate');
    });

    it('resolves dynamic placeholders in binding group target values', () => {
      const component: ComponentInstance = {
        id: 'comp-speed-alert',
        type: 'warning',
        x: 0,
        y: 0,
        width: 200,
        height: 80,
        staticProps: {
          text: 'Normal',
        },
        bindings: [
          {
            id: 'bind-high-speed',
            conditions: [
              { stateField: 'gear', condition: '=', value: 'D' },
              { stateField: 'speed', condition: '>=', value: 80 },
            ],
            targetProp: 'text',
            targetValue: 'Speed Warning: {speed} MPH in {gear}',
          },
        ],
      };

      const resolved = getResolvedProps(component, {
        ...baseVehicleState,
        gear: 'D',
        speed: 85,
      });
      assert.equal(resolved.text, 'Speed Warning: 85 MPH in D');
    });
  });

  describe('useMockpitStore binding group store actions', () => {
    it('supports addBindingGroup and removeBindingGroup', () => {
      const store = useMockpitStore.getState();
      const testCompId = 'comp-test-binding-group';

      // Seed a test component
      useMockpitStore.setState({
        components: [
          {
            id: testCompId,
            type: 'warning',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            staticProps: { visible: 'false' },
            bindings: [],
          },
        ],
        componentsByScreen: {
          home: [
            {
              id: testCompId,
              type: 'warning',
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              staticProps: { visible: 'false' },
              bindings: [],
            },
          ],
        },
        activeView: 'home',
      });

      // Add a binding group via addBindingGroup
      const groupRule: Omit<BindingGroup, 'id'> = {
        conditions: [
          { stateField: 'gear', condition: '=', value: 'P' },
          { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
        ],
        targetProp: 'visible',
        targetValue: 'true',
      };

      useMockpitStore.getState().addBindingGroup(testCompId, groupRule);

      const updatedComp = useMockpitStore
        .getState()
        .components.find((c) => c.id === testCompId);
      assert.ok(updatedComp);
      assert.equal(updatedComp.bindings.length, 1);
      assert.equal(updatedComp.bindings[0].targetProp, 'visible');
      assert.equal(updatedComp.bindings[0].targetValue, 'true');
      assert.ok(updatedComp.bindings[0].conditions);
      assert.equal(updatedComp.bindings[0].conditions?.length, 2);

      const bindingId = updatedComp.bindings[0].id;

      // Remove the binding group via removeBindingGroup
      useMockpitStore.getState().removeBindingGroup(testCompId, bindingId);

      const afterRemoveComp = useMockpitStore
        .getState()
        .components.find((c) => c.id === testCompId);
      assert.ok(afterRemoveComp);
      assert.equal(afterRemoveComp.bindings.length, 0);
    });
  });

  describe('Editing Existing Binding Rules', () => {
    const testCompId = 'comp-test-edit-binding';

    const setupComponentWithBinding = (initialBinding: Binding) => {
      useMockpitStore.setState({
        components: [
          {
            id: testCompId,
            type: 'warning',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            staticProps: { visible: 'false', color: '#38bdf8' },
            bindings: [initialBinding],
          },
        ],
        componentsByScreen: {
          home: [
            {
              id: testCompId,
              type: 'warning',
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              staticProps: { visible: 'false', color: '#38bdf8' },
              bindings: [initialBinding],
            },
          ],
        },
        activeView: 'home',
      });
    };

    it('1. edits an existing single-condition binding (e.g. Battery < 20 to Battery < 10)', () => {
      const bindingId = 'bind-single-1';
      setupComponentWithBinding({
        id: bindingId,
        stateField: 'batteryPercent',
        condition: '<',
        value: 20,
        targetProp: 'visible',
        targetValue: 'true',
      });

      // Update condition threshold to 10
      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        value: 10,
      });

      const comp = useMockpitStore.getState().components.find((c) => c.id === testCompId);
      assert.ok(comp);
      assert.equal(comp.bindings.length, 1);
      assert.equal(comp.bindings[0].id, bindingId);
      assert.equal(comp.bindings[0].value, 10);

      // Evaluates false at 15 (was true before)
      assert.equal(evaluateBinding(comp.bindings[0], { ...baseVehicleState, batteryPercent: 15 }), false);
      // Evaluates true at 5
      assert.equal(evaluateBinding(comp.bindings[0], { ...baseVehicleState, batteryPercent: 5 }), true);
    });

    it('2. edits an existing multi-condition binding', () => {
      const bindingId = 'bind-multi-1';
      setupComponentWithBinding({
        id: bindingId,
        conditions: [
          { stateField: 'gear', condition: '=', value: 'P' },
          { stateField: 'speed', condition: '=', value: 0 },
        ],
        targetProp: 'visible',
        targetValue: 'true',
      });

      // Update to gear = D
      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        conditions: [
          { stateField: 'gear', condition: '=', value: 'D' },
          { stateField: 'speed', condition: '>', value: 0 },
        ],
      });

      const comp = useMockpitStore.getState().components.find((c) => c.id === testCompId);
      assert.ok(comp);
      assert.equal(comp.bindings[0].conditions?.[0].value, 'D');
      assert.equal(comp.bindings[0].conditions?.[1].condition, '>');
    });

    it('3. changes an individual condition without affecting other conditions in the group', () => {
      const bindingId = 'bind-multi-indiv';
      setupComponentWithBinding({
        id: bindingId,
        conditions: [
          { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
          { stateField: 'gear', condition: '=', value: 'P' },
        ],
        targetProp: 'visible',
        targetValue: 'true',
      });

      // Change Gear = P to Gear = R without touching speedIncreaseAttempted
      const compBefore = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      const updatedConditions = compBefore.bindings[0].conditions!.map((c) =>
        c.stateField === 'gear' ? { ...c, value: 'R' } : c
      );

      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        conditions: updatedConditions,
      });

      const compAfter = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      assert.equal(compAfter.bindings[0].conditions?.length, 2);
      assert.equal(compAfter.bindings[0].conditions?.[0].stateField, 'speedIncreaseAttempted');
      assert.equal(compAfter.bindings[0].conditions?.[0].value, true);
      assert.equal(compAfter.bindings[0].conditions?.[1].stateField, 'gear');
      assert.equal(compAfter.bindings[0].conditions?.[1].value, 'R');
    });

    it('4. edits an interaction-event condition (speedIncreaseAttempted = true)', () => {
      const bindingId = 'bind-event-1';
      setupComponentWithBinding({
        id: bindingId,
        conditions: [
          { stateField: 'speedIncreaseAttempted', condition: '=', value: false },
        ],
        targetProp: 'visible',
        targetValue: 'false',
      });

      // Edit condition to speedIncreaseAttempted = true, targetValue = 'true'
      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        conditions: [
          { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
        ],
        targetValue: 'true',
      });

      const comp = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      assert.equal(comp.bindings[0].conditions?.[0].value, true);
      assert.equal(comp.bindings[0].targetValue, 'true');

      // Evaluates true when speedIncreaseAttempted is true
      assert.equal(evaluateBinding(comp.bindings[0], { ...baseVehicleState, speedIncreaseAttempted: true } as any), true);
      assert.equal(evaluateBinding(comp.bindings[0], { ...baseVehicleState, speedIncreaseAttempted: false } as any), false);
    });

    it('5. edits the target property and target value', () => {
      const bindingId = 'bind-target-edit';
      setupComponentWithBinding({
        id: bindingId,
        stateField: 'batteryPercent',
        condition: '<',
        value: 15,
        targetProp: 'color',
        targetValue: '#ef4444',
      });

      // Change targetProp from 'color' to 'visible' and targetValue to 'false'
      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        targetProp: 'visible',
        targetValue: 'false',
      });

      const comp = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      assert.equal(comp.bindings[0].targetProp, 'visible');
      assert.equal(comp.bindings[0].targetValue, 'false');
    });

    it('6. adds a condition to an existing binding', () => {
      const bindingId = 'bind-add-cond';
      setupComponentWithBinding({
        id: bindingId,
        conditions: [
          { stateField: 'gear', condition: '=', value: 'P' },
        ],
        targetProp: 'visible',
        targetValue: 'true',
      });

      // Add second condition
      const current = useMockpitStore.getState().components.find((c) => c.id === testCompId)!.bindings[0];
      const newConditions = [
        ...(current.conditions || []),
        { stateField: 'speedIncreaseAttempted' as BindingStateField, condition: '=' as BindingCondition, value: true },
      ];

      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        conditions: newConditions,
      });

      const comp = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      assert.equal(comp.bindings[0].conditions?.length, 2);
      assert.equal(comp.bindings[0].conditions?.[1].stateField, 'speedIncreaseAttempted');
    });

    it('7. removes one condition from an existing multi-condition binding', () => {
      const bindingId = 'bind-remove-cond';
      setupComponentWithBinding({
        id: bindingId,
        conditions: [
          { stateField: 'gear', condition: '=', value: 'P' },
          { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
          { stateField: 'doorOpen', condition: '=', value: true },
        ],
        targetProp: 'visible',
        targetValue: 'true',
      });

      // Remove doorOpen condition
      const current = useMockpitStore.getState().components.find((c) => c.id === testCompId)!.bindings[0];
      const filtered = current.conditions!.filter((c) => c.stateField !== 'doorOpen');

      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        conditions: filtered,
      });

      const comp = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      assert.equal(comp.bindings[0].conditions?.length, 2);
      assert.ok(!comp.bindings[0].conditions?.some((c) => c.stateField === 'doorOpen'));
    });

    it('8. ensures editing does not create duplicate bindings and 9. preserves original binding ID', () => {
      const bindingId = 'unique-preserved-id-123';
      setupComponentWithBinding({
        id: bindingId,
        stateField: 'speed',
        condition: '>',
        value: 65,
        targetProp: 'color',
        targetValue: '#f59e0b',
      });

      assert.equal(useMockpitStore.getState().components.find((c) => c.id === testCompId)!.bindings.length, 1);

      // Perform edit
      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        value: 70,
        targetValue: '#ef4444',
      });

      const comp = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      // No duplicates!
      assert.equal(comp.bindings.length, 1);
      // ID preserved!
      assert.equal(comp.bindings[0].id, bindingId);
      assert.equal(comp.bindings[0].value, 70);
      assert.equal(comp.bindings[0].targetValue, '#ef4444');
    });

    it('10. updated rule is immediately used by getResolvedProps and binding evaluator', () => {
      const bindingId = 'bind-eval-immediate';
      setupComponentWithBinding({
        id: bindingId,
        stateField: 'speed',
        condition: '>',
        value: 65,
        targetProp: 'color',
        targetValue: '#f59e0b',
      });

      const state: VehicleState = { ...baseVehicleState, speed: 68 };

      // Initial evaluation: 68 > 65 -> color = #f59e0b
      let comp = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      let resolved = getResolvedProps(comp, state);
      assert.equal(resolved.color, '#f59e0b');

      // Edit condition to speed > 70
      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        value: 70,
      });

      // Immediate re-evaluation with updated binding: 68 is NOT > 70 -> falls back to staticProps color (#38bdf8)
      comp = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      resolved = getResolvedProps(comp, state);
      assert.equal(resolved.color, '#38bdf8');
    });

    it('11. existing bindings can still be deleted after editing', () => {
      const bindingId = 'bind-del-after-edit';
      setupComponentWithBinding({
        id: bindingId,
        stateField: 'speed',
        condition: '>',
        value: 50,
        targetProp: 'visible',
        targetValue: 'true',
      });

      // Edit it
      useMockpitStore.getState().updateBinding(testCompId, bindingId, {
        value: 55,
      });

      let comp = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      assert.equal(comp.bindings.length, 1);

      // Now delete it
      useMockpitStore.getState().removeBinding(testCompId, bindingId);

      comp = useMockpitStore.getState().components.find((c) => c.id === testCompId)!;
      assert.equal(comp.bindings.length, 0);
    });

    it('12. existing bindings remain functional after editing and reloading project from storage', () => {
      const bindingId = 'bind-persist-reload';
      const storageMock = new Map<string, string>();
      const origLocalStorage = globalThis.localStorage;

      // Mock localStorage
      globalThis.localStorage = {
        getItem: (k: string) => storageMock.get(k) ?? null,
        setItem: (k: string, v: string) => storageMock.set(k, String(v)),
        removeItem: (k: string) => storageMock.delete(k),
        clear: () => storageMock.clear(),
        key: (i: number) => Array.from(storageMock.keys())[i] ?? null,
        length: 0,
      } as any;

      try {
        setupComponentWithBinding({
          id: bindingId,
          conditions: [
            { stateField: 'gear', condition: '=', value: 'P' },
            { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
          ],
          targetProp: 'visible',
          targetValue: 'true',
        });

        // Edit binding
        useMockpitStore.getState().updateBinding(testCompId, bindingId, {
          conditions: [
            { stateField: 'gear', condition: '=', value: 'R' },
            { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
          ],
          targetValue: 'true',
        });

        // Verify storage received the updated screens
        const rawSaved = storageMock.get('mockpit_components_by_screen_v2');
        assert.ok(rawSaved, 'componentsByScreen must be saved to storage');

        const reloadedScreens = JSON.parse(rawSaved!);
        const reloadedComp = reloadedScreens.home.find((c: any) => c.id === testCompId);
        assert.ok(reloadedComp);
        assert.equal(reloadedComp.bindings.length, 1);
        assert.equal(reloadedComp.bindings[0].id, bindingId);
        assert.equal(reloadedComp.bindings[0].conditions[0].value, 'R');

        // Test evaluation on reloaded component
        const stateR: any = { ...baseVehicleState, gear: 'R', speedIncreaseAttempted: true };
        const resR = getResolvedProps(reloadedComp, stateR);
        assert.equal(resR.visible, 'true');

        const stateP: any = { ...baseVehicleState, gear: 'P', speedIncreaseAttempted: true };
        const resP = getResolvedProps(reloadedComp, stateP);
        assert.equal(resP.visible, 'false');
      } finally {
        globalThis.localStorage = origLocalStorage;
      }
    });
  });
});
