import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateConditionRule,
  evaluateBinding,
  evaluateConditionGroup,
  evaluateNotificationVisibility,
  collectNotificationInteractionEvents,
  isInteractionEventField,
  isGroupTreeValid,
  formatConditionGroupText,
  formatConditionSummary,
} from '../../lib/bindingEvaluator';
import {
  Binding,
  BindingConditionRule,
  BindingGroup,
  ComponentInstance,
  ConditionGroup,
  VehicleState,
} from '../../types';
import { useMockpitStore, DEFAULT_NOTIFICATION_DURATION_SEC, EVENT_NOTIFICATION_COOLDOWN_MS } from '../../store/useMockpitStore';

describe('Spec v3.2 — Multi-Condition Bindings & Cooldown Lifecycle Architecture', () => {
  const baseVehicleState: VehicleState = {
    gear: 'P',
    speed: 0,
    batteryPercent: 80,
    isCharging: false,
    doorOpen: false,
    driveMode: 'Normal',
    cruiseControlActive: false,
    tirePressureWarning: false,
  };

  describe('1. Behavior: Park Scenario Binding (event + gear P; gear D/R false)', () => {
    const parkAttemptBinding: Binding = {
      id: 'bind-park-attempt',
      targetProp: 'visible',
      targetValue: 'true',
      conditionGroup: {
        id: 'group-root',
        logic: 'AND',
        children: [
          {
            stateField: 'speedIncreaseAttempted',
            condition: '=',
            value: true,
          },
          {
            stateField: 'gear',
            condition: '=',
            value: 'P',
          },
        ],
      },
    };

    it('evaluates true when speedIncreaseAttempted is active AND gear is P', () => {
      const state: VehicleState = { ...baseVehicleState, gear: 'P' };
      const events = { speedIncreaseAttempted: true };
      assert.equal(evaluateBinding(parkAttemptBinding, state, events), true);
    });

    it('evaluates false when gear is D or R even if speedIncreaseAttempted is active', () => {
      const stateD: VehicleState = { ...baseVehicleState, gear: 'D' };
      const stateR: VehicleState = { ...baseVehicleState, gear: 'R' };
      const events = { speedIncreaseAttempted: true };

      assert.equal(evaluateBinding(parkAttemptBinding, stateD, events), false);
      assert.equal(evaluateBinding(parkAttemptBinding, stateR, events), false);
    });

    it('evaluates false when speedIncreaseAttempted is false even if gear is P', () => {
      const state: VehicleState = { ...baseVehicleState, gear: 'P' };
      const events = { speedIncreaseAttempted: false };

      assert.equal(evaluateBinding(parkAttemptBinding, state, events), false);
      assert.equal(evaluateBinding(parkAttemptBinding, state, {}), false);
    });
  });

  describe('2. Behavior: A OR B', () => {
    const orBinding: Binding = {
      id: 'bind-or',
      targetProp: 'visible',
      targetValue: 'true',
      conditionGroup: {
        id: 'group-or',
        logic: 'OR',
        children: [
          { stateField: 'gear', condition: '=', value: 'P' },
          { stateField: 'gear', condition: '=', value: 'N' },
        ],
      },
    };

    it('evaluates true when A is true or B is true', () => {
      assert.equal(evaluateBinding(orBinding, { ...baseVehicleState, gear: 'P' }), true);
      assert.equal(evaluateBinding(orBinding, { ...baseVehicleState, gear: 'N' }), true);
    });

    it('evaluates false when neither A nor B is true', () => {
      assert.equal(evaluateBinding(orBinding, { ...baseVehicleState, gear: 'D' }), false);
      assert.equal(evaluateBinding(orBinding, { ...baseVehicleState, gear: 'R' }), false);
    });
  });

  describe('3. Behavior: A AND (B OR C)', () => {
    // Speed Increase Attempted = true AND (Gear = P OR Gear = N)
    const nestedBinding: Binding = {
      id: 'bind-nested',
      targetProp: 'visible',
      targetValue: 'true',
      conditionGroup: {
        id: 'group-root',
        logic: 'AND',
        children: [
          {
            stateField: 'speedIncreaseAttempted',
            condition: '=',
            value: true,
          },
          {
            id: 'group-child',
            logic: 'OR',
            children: [
              { stateField: 'gear', condition: '=', value: 'P' },
              { stateField: 'gear', condition: '=', value: 'N' },
            ],
          },
        ],
      },
    };

    it('evaluates true in P and N when event is active', () => {
      const events = { speedIncreaseAttempted: true };
      assert.equal(evaluateBinding(nestedBinding, { ...baseVehicleState, gear: 'P' }, events), true);
      assert.equal(evaluateBinding(nestedBinding, { ...baseVehicleState, gear: 'N' }, events), true);
    });

    it('evaluates false in D even when event is active', () => {
      const events = { speedIncreaseAttempted: true };
      assert.equal(evaluateBinding(nestedBinding, { ...baseVehicleState, gear: 'D' }, events), false);
    });

    it('evaluates false when event is not active regardless of gear', () => {
      assert.equal(evaluateBinding(nestedBinding, { ...baseVehicleState, gear: 'P' }, {}), false);
      assert.equal(evaluateBinding(nestedBinding, { ...baseVehicleState, gear: 'N' }, {}), false);
    });

    it('formats plain-language summary with parentheses for child group', () => {
      const summary = formatConditionSummary(nestedBinding);
      assert.equal(
        summary,
        'Show when Speed Increase Attempted is true AND (Gear is P OR Gear is N)'
      );
    });
  });

  describe('4. Behavior: Three-level nest', () => {
    // Level 1 (AND): speedIncreaseAttempted = true AND Level 2
    // Level 2 (OR): doorOpen = true OR Level 3
    // Level 3 (AND): gear = P AND speed = 0
    const threeLevelGroup: ConditionGroup = {
      id: 'level-1',
      logic: 'AND',
      children: [
        { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
        {
          id: 'level-2',
          logic: 'OR',
          children: [
            { stateField: 'doorOpen', condition: '=', value: true },
            {
              id: 'level-3',
              logic: 'AND',
              children: [
                { stateField: 'gear', condition: '=', value: 'P' },
                { stateField: 'speed', condition: '=', value: 0 },
              ],
            },
          ],
        },
      ],
    };

    it('correctly evaluates all branches across 3 levels', () => {
      const events = { speedIncreaseAttempted: true };

      // 1. Event true, doorOpen true -> true (branch 1 of OR)
      assert.equal(
        evaluateConditionGroup(threeLevelGroup, { ...baseVehicleState, doorOpen: true }, events),
        true
      );

      // 2. Event true, doorOpen false, gear P, speed 0 -> true (branch 2 of OR via Level 3)
      assert.equal(
        evaluateConditionGroup(threeLevelGroup, { ...baseVehicleState, doorOpen: false, gear: 'P', speed: 0 }, events),
        true
      );

      // 3. Event true, doorOpen false, gear P, speed 10 -> false (Level 3 fails)
      assert.equal(
        evaluateConditionGroup(threeLevelGroup, { ...baseVehicleState, doorOpen: false, gear: 'P', speed: 10 }, events),
        false
      );

      // 4. Event false -> false regardless of nested branches
      assert.equal(
        evaluateConditionGroup(threeLevelGroup, { ...baseVehicleState, doorOpen: true }, {}),
        false
      );
    });

    it('formats plain-language summary with nested parentheses', () => {
      const text = formatConditionGroupText(threeLevelGroup);
      assert.equal(
        text,
        'Speed Increase Attempted is true AND (Door Open is true OR (Gear is P AND Speed is 0))'
      );
    });
  });

  describe('5. Behavior: Empty group = false and Validation', () => {
    it('evaluates to false when condition group children is empty', () => {
      const emptyGroup: ConditionGroup = { id: 'empty', logic: 'AND', children: [] };
      assert.equal(evaluateConditionGroup(emptyGroup, baseVehicleState), false);

      const emptyOrGroup: ConditionGroup = { id: 'empty-or', logic: 'OR', children: [] };
      assert.equal(evaluateConditionGroup(emptyOrGroup, baseVehicleState), false);
    });

    it('isGroupTreeValid blocks empty groups from saving', () => {
      const emptyGroup: ConditionGroup = { id: 'empty', logic: 'AND', children: [] };
      assert.equal(isGroupTreeValid(emptyGroup), false);

      const nestedWithEmptyChild: ConditionGroup = {
        id: 'root',
        logic: 'AND',
        children: [
          { stateField: 'gear', condition: '=', value: 'P' },
          { id: 'child-empty', logic: 'OR', children: [] },
        ],
      };
      assert.equal(isGroupTreeValid(nestedWithEmptyChild), false);

      const validGroup: ConditionGroup = {
        id: 'valid',
        logic: 'AND',
        children: [
          { stateField: 'gear', condition: '=', value: 'P' },
        ],
      };
      assert.equal(isGroupTreeValid(validGroup), true);
    });
  });

  describe('6. Behavior: Legacy conditions[] binding unchanged', () => {
    const legacyBinding: BindingGroup = {
      id: 'legacy-group',
      targetProp: 'color',
      targetValue: '#10b981',
      conditions: [
        { stateField: 'gear', condition: '=', value: 'D' },
        { stateField: 'speed', condition: '>', value: 25 },
      ],
    };

    it('evaluates legacy conditions[] using strict AND logic', () => {
      assert.equal(
        evaluateBinding(legacyBinding as any, { ...baseVehicleState, gear: 'D', speed: 30 }),
        true
      );
      assert.equal(
        evaluateBinding(legacyBinding as any, { ...baseVehicleState, gear: 'D', speed: 10 }),
        false
      );
      assert.equal(
        evaluateBinding(legacyBinding as any, { ...baseVehicleState, gear: 'P', speed: 30 }),
        false
      );
    });

    it('legacy single-condition binding unchanged', () => {
      const singleBinding: Binding = {
        id: 'single',
        targetProp: 'color',
        targetValue: '#ef4444',
        stateField: 'batteryPercent',
        condition: '<',
        value: 20,
      };

      assert.equal(
        evaluateBinding(singleBinding, { ...baseVehicleState, batteryPercent: 15 }),
        true
      );
      assert.equal(
        evaluateBinding(singleBinding, { ...baseVehicleState, batteryPercent: 50 }),
        false
      );
    });
  });

  describe('7. Behavior: Cooldown Timeline & Pure Evaluator', () => {
    const testNotification: ComponentInstance = {
      id: 'test-event-notif-1',
      type: 'warning',
      x: 100,
      y: 100,
      width: 320,
      height: 100,
      bindings: [
        {
          id: 'b1',
          targetProp: 'visible',
          targetValue: 'true',
          conditionGroup: {
            id: 'g1',
            logic: 'AND',
            children: [
              { stateField: 'speedIncreaseAttempted', condition: '=', value: true },
              { stateField: 'gear', condition: '=', value: 'P' },
            ],
          },
        },
      ],
      staticProps: {
        enabled: 'true',
        message: 'Shift out of Park to drive',
      },
    };

    it('t=0: attempt starts window, sets shouldStartWindow: true, visible: true', () => {
      const t0 = 100000;
      const durationSec = 3;
      const res = evaluateNotificationVisibility(
        testNotification,
        { ...baseVehicleState, gear: 'P' },
        { speedIncreaseAttempted: true },
        {},
        t0,
        durationSec
      );

      assert.equal(res.visible, true);
      assert.equal(res.isEventDriven, true);
      assert.equal(res.shouldStartWindow, true);
    });

    it('during shownUntil (t = 1s): latches event to true even if transient event has cleared', () => {
      const t0 = 100000;
      const durationSec = 3;
      const cooldowns = {
        [testNotification.id]: {
          shownUntil: t0 + 3000,
          cooldownUntil: t0 + 15000,
        },
      };

      // Notice interactionEvents is EMPTY here, but because we are within shownUntil,
      // it latches the referenced event speedIncreaseAttempted to true!
      const res = evaluateNotificationVisibility(
        testNotification,
        { ...baseVehicleState, gear: 'P' },
        {},
        cooldowns,
        t0 + 1000,
        durationSec
      );

      assert.equal(res.visible, true);
      assert.equal(res.shouldStartWindow, false, 'Do not start new window while already active');
    });

    it('at t = duration (t = 4s): window expires and notification is not visible, with no badge', () => {
      const t0 = 100000;
      const durationSec = 3;
      const cooldowns = {
        [testNotification.id]: {
          shownUntil: t0 + 3000,
          cooldownUntil: t0 + 15000,
        },
      };

      const res = evaluateNotificationVisibility(
        testNotification,
        { ...baseVehicleState, gear: 'P' },
        {},
        cooldowns,
        t0 + 4000,
        durationSec
      );

      assert.equal(res.visible, false);
      assert.equal(res.shouldStartWindow, false);
    });

    it('t = 8s: ignored attempt before 15s cooldown expires', () => {
      const t0 = 100000;
      const durationSec = 3;
      const cooldowns = {
        [testNotification.id]: {
          shownUntil: t0 + 3000,
          cooldownUntil: t0 + 15000,
        },
      };

      // Even if another attempt happens at t=8s:
      const res = evaluateNotificationVisibility(
        testNotification,
        { ...baseVehicleState, gear: 'P' },
        { speedIncreaseAttempted: true },
        cooldowns,
        t0 + 8000,
        durationSec
      );

      assert.equal(res.visible, false, 'Suppressed during cooldown');
      assert.equal(res.shouldStartWindow, false);
    });

    it('t = 16s: attempt at or after 15s cooldown triggers it again and starts new window', () => {
      const t0 = 100000;
      const durationSec = 3;
      const cooldowns = {
        [testNotification.id]: {
          shownUntil: t0 + 3000,
          cooldownUntil: t0 + 15000,
        },
      };

      const res = evaluateNotificationVisibility(
        testNotification,
        { ...baseVehicleState, gear: 'P' },
        { speedIncreaseAttempted: true },
        cooldowns,
        t0 + 16000,
        durationSec
      );

      assert.equal(res.visible, true);
      assert.equal(res.shouldStartWindow, true);
    });

    it('repeated rapid attempts inside visible window do not extend shownUntil', () => {
      const t0 = 100000;
      const durationSec = 3;
      const initialCooldown = {
        shownUntil: t0 + 3000,
        cooldownUntil: t0 + 15000,
      };

      // At t = 1s, second attempt occurs
      const res1 = evaluateNotificationVisibility(
        testNotification,
        { ...baseVehicleState, gear: 'P' },
        { speedIncreaseAttempted: true },
        { [testNotification.id]: initialCooldown },
        t0 + 1000,
        durationSec
      );
      assert.equal(res1.shouldStartWindow, false);

      // At t = 2s, third attempt occurs
      const res2 = evaluateNotificationVisibility(
        testNotification,
        { ...baseVehicleState, gear: 'P' },
        { speedIncreaseAttempted: true },
        { [testNotification.id]: initialCooldown },
        t0 + 2000,
        durationSec
      );
      assert.equal(res2.shouldStartWindow, false);
      // Cooldown timestamps remain exactly the original t0 + 3000
      assert.equal(initialCooldown.shownUntil, t0 + 3000);
    });

    it('inactive notification (enabled: "false") never starts a window and is never visible', () => {
      const inactiveComp: ComponentInstance = {
        ...testNotification,
        id: 'inactive-comp-1',
        staticProps: {
          enabled: 'false',
        },
      };

      const res = evaluateNotificationVisibility(
        inactiveComp,
        { ...baseVehicleState, gear: 'P' },
        { speedIncreaseAttempted: true },
        {},
        100000,
        3
      );

      assert.equal(res.visible, false);
      assert.equal(res.shouldStartWindow, false);
    });
  });

  describe('8. Behavior: Second / Stub Interaction Event Latching', () => {
    const stubEventNotification: ComponentInstance = {
      id: 'stub-event-notif-1',
      type: 'warning',
      x: 100,
      y: 100,
      width: 320,
      height: 100,
      bindings: [
        {
          id: 'b-stub',
          targetProp: 'visible',
          targetValue: 'true',
          conditionGroup: {
            id: 'g-stub',
            logic: 'AND',
            children: [
              { stateField: 'chargeDoorBlockedAttempted', condition: '=', value: true },
              { stateField: 'isCharging', condition: '=', value: true },
            ],
          },
        },
      ],
      staticProps: {
        enabled: 'true',
      },
    };

    it('collectNotificationInteractionEvents collects custom stub event fields', () => {
      const collected = collectNotificationInteractionEvents(stubEventNotification);
      assert.ok(collected.includes('chargeDoorBlockedAttempted'));
    });

    it('latches second interaction event during shownUntil window', () => {
      const t0 = 200000;
      const cooldowns = {
        [stubEventNotification.id]: {
          shownUntil: t0 + 5000,
          cooldownUntil: t0 + 15000,
        },
      };

      // interactionEvents is empty at t=2s, but chargeDoorBlockedAttempted latches
      const res = evaluateNotificationVisibility(
        stubEventNotification,
        { ...baseVehicleState, isCharging: true },
        {},
        cooldowns,
        t0 + 2000,
        5
      );

      assert.equal(res.visible, true);
      assert.equal(res.isEventDriven, true);
    });
  });

  describe('9. Behavior: Spec v3.3 Inspector Helper Text & Section Note Suite', () => {
    const helperText =
      'Event-Triggered notifications ignore Show When rules. Use Condition-Bound for gear, speed, and interaction conditions.';
    const sectionNote =
      'Any rule that matches shows the notification. Inside a rule, each group matches ALL or ANY of its conditions.';

    const baseNotif: ComponentInstance = {
      id: 'notif-spec-33',
      type: 'warning',
      x: 0,
      y: 0,
      width: 380,
      height: 120,
      staticProps: {
        enabled: 'true',
        triggerMode: 'event',
        severity: 'warning',
      },
      bindings: [],
    };

    it('renders Event-Triggered helper text when triggerMode is event and section note in Show When', async () => {
      // Mock minimal browser environment for React SSR render
      const styleMock = {
        setProperty: () => {},
        removeProperty: () => {},
        getPropertyValue: () => '',
      };
      const win: any = {
        requestAnimationFrame: (cb: any) => setTimeout(cb, 0),
        cancelAnimationFrame: (id: any) => clearTimeout(id),
        navigator: { userAgent: 'node' },
        screen: { deviceXDPI: 1, logicalXDPI: 1 },
        devicePixelRatio: 1,
        document: {
          documentElement: { style: styleMock },
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
      if (!(globalThis as any).window) (globalThis as any).window = win;
      if (!(globalThis as any).document) (globalThis as any).document = win.document;
      if (!(globalThis as any).localStorage) (globalThis as any).localStorage = win.localStorage;

      const React = (await import('react')).default;
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { Inspector } = await import('../Inspector');

      const eventNotif: ComponentInstance = {
        ...baseNotif,
        staticProps: { ...baseNotif.staticProps, triggerMode: 'event' },
      };

      const htmlEvent = renderToStaticMarkup(
        React.createElement(Inspector, {
          selectedComponentId: eventNotif.id,
          initialTab: 'component',
          notificationComponents: [eventNotif],
        })
      );

      assert.equal(
        htmlEvent.includes(helperText),
        true,
        'Event-Triggered helper text must be rendered when triggerMode is event'
      );
      assert.equal(
        htmlEvent.includes(sectionNote),
        true,
        'Show When section note must be rendered at top of Show When section'
      );
    });

    it('hides Event-Triggered helper text when triggerMode is condition-bound, while preserving Show When section note', async () => {
      const React = (await import('react')).default;
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { Inspector } = await import('../Inspector');

      const conditionNotif: ComponentInstance = {
        ...baseNotif,
        staticProps: { ...baseNotif.staticProps, triggerMode: 'condition' },
      };

      const htmlCondition = renderToStaticMarkup(
        React.createElement(Inspector, {
          selectedComponentId: conditionNotif.id,
          initialTab: 'component',
          notificationComponents: [conditionNotif],
        })
      );

      assert.equal(
        htmlCondition.includes(helperText),
        false,
        'Event-Triggered helper text must NOT be rendered when triggerMode is condition'
      );
      assert.equal(
        htmlCondition.includes(sectionNote),
        true,
        'Show When section note must remain visible when triggerMode is condition'
      );
    });
  });
});
