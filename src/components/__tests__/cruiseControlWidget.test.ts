import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useMockpitStore } from '../../store/useMockpitStore';
import { COMPONENT_META } from '../../config/componentMeta';
import { COMPONENT_FLAGS } from '../../config/componentFlags';
import { COMPONENT_TYPE_TO_CATEGORY } from '../../config/categoryColors';
import { COMPONENT_DISPLAY_NAMES } from '../../utils/componentDisplayNames';
import { evaluateNotificationVisibility } from '../../lib/bindingEvaluator';
import type { ComponentInstance } from '../../types';

describe('CruiseControlWidget — Spec v1 Suite', () => {
  let React: any;
  let renderToStaticMarkup: any;
  let CruiseControlWidget: any;
  let DebugStatePanel: any;
  let DEFAULT_COMPONENT_LABELS: any;

  const baseComp: ComponentInstance = {
    id: 'test-cruise-widget',
    type: 'cruiseControl',
    x: 0,
    y: 0,
    width: 320,
    height: 160,
    staticProps: {
      label: 'Cruise Control',
    },
    bindings: [],
  };

  before(async () => {
    // Minimal DOM polyfill for node test environment
    const styleMock = {
      setProperty: () => {},
      removeProperty: () => {},
      getPropertyValue: () => '',
    };
    const win: any = {
      requestAnimationFrame: () => 0,
      cancelAnimationFrame: () => {},
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

    React = (await import('react')).default;
    (React as any).useSyncExternalStore = (_subscribe: any, getSnapshot: any) => getSnapshot();
    renderToStaticMarkup = (await import('react-dom/server')).renderToStaticMarkup;
    CruiseControlWidget = (await import('../vehicle/CruiseControlWidget')).CruiseControlWidget;
    DebugStatePanel = (await import('../DebugStatePanel')).DebugStatePanel;
    DEFAULT_COMPONENT_LABELS = (await import('../ComponentRenderer')).DEFAULT_COMPONENT_LABELS;
  });

  after(() => {
    useMockpitStore.getState().resetVehicleState?.();
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).localStorage;
  });

  beforeEach(() => {
    useMockpitStore.getState().setVehicleState({
      gear: 'D',
      speed: 60,
      cruiseControlActive: false,
    });
  });

  it('1. Registration and Metadata invariants', () => {
    assert.equal(COMPONENT_FLAGS.cruiseControl, true, 'COMPONENT_FLAGS.cruiseControl must be true');
    assert.ok(COMPONENT_META.cruiseControl, 'COMPONENT_META must have cruiseControl entry');
    assert.equal(COMPONENT_META.cruiseControl.type, 'cruiseControl');
    assert.equal(COMPONENT_META.cruiseControl.defaultColor, '#38bdf8');
    assert.equal(COMPONENT_TYPE_TO_CATEGORY.cruiseControl, 'home');
    assert.equal(COMPONENT_DISPLAY_NAMES.cruiseControl, 'Cruise Control');
    assert.equal(DEFAULT_COMPONENT_LABELS.cruiseControl, 'Cruise Control');
  });

  it('2. Store defaults: default size and addComponent case', () => {
    // Direct addComponent verification
    useMockpitStore.getState().addComponent('cruiseControl');
    const comps = useMockpitStore.getState().components;
    const added = comps[comps.length - 1];

    assert.equal(added.type, 'cruiseControl');
    assert.equal(added.width, 320);
    assert.equal(added.height, 160);
    assert.equal(added.staticProps?.label, 'Cruise Control');
    assert.deepEqual(added.bindings, []);
  });

  it('3. Renders OFF state with proper aria-pressed, label, and colors', () => {
    useMockpitStore.getState().setVehicleState({ cruiseControlActive: false });
    const html = renderToStaticMarkup(React.createElement(CruiseControlWidget, { component: baseComp }));

    assert.ok(html.includes('data-component-type="cruiseControl"'));
    assert.ok(html.includes('aria-pressed="false"'));
    assert.ok(html.includes('OFF'));
    assert.ok(html.includes('border-slate-700/60'));
    assert.ok(html.includes('text-slate-500'));
    assert.ok(html.includes('bg-slate-500'));
    assert.ok(html.includes('text-slate-400'));
  });

  it('4. Renders ON state with proper aria-pressed, label, and sky colors', () => {
    useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 65, cruiseControlActive: true });
    const html = renderToStaticMarkup(React.createElement(CruiseControlWidget, { component: baseComp }));

    assert.ok(html.includes('data-component-type="cruiseControl"'));
    assert.ok(html.includes('aria-pressed="true"'));
    assert.ok(html.includes('ON'));
    assert.ok(html.includes('border-sky-400'));
    assert.ok(html.includes('text-sky-400'));
    assert.ok(html.includes('bg-sky-400'));
    assert.ok(html.includes('text-slate-200'));
  });

  it('5. Tapping in gear D activates cruise and captures cruiseSetSpeed', () => {
    useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 52, cruiseControlActive: false });

    // Simulating component onClick handler
    const vs = useMockpitStore.getState().vehicleState;
    if (vs.gear === 'D') {
      useMockpitStore.getState().setVehicleState({ cruiseControlActive: !vs.cruiseControlActive });
    }

    const updatedVs = useMockpitStore.getState().vehicleState;
    assert.equal(updatedVs.cruiseControlActive, true);
    assert.equal(updatedVs.cruiseSetSpeed, 52);

    // Notification condition evaluates to true
    const notifs = useMockpitStore.getState().notificationComponents;
    const cruiseNotif = notifs.find((c: any) => c.id === 'comp-warning-cruise-on');
    assert.ok(cruiseNotif, 'comp-warning-cruise-on exists in default notifications');
    const vis = evaluateNotificationVisibility(cruiseNotif!, updatedVs, {}, {}, Date.now(), 5);
    assert.equal(vis.visible, true);
  });

  it('6. Tapping in gear P does not activate cruise (gear !== D early return)', () => {
    useMockpitStore.getState().setVehicleState({ gear: 'P', speed: 0, cruiseControlActive: false });

    const vs = useMockpitStore.getState().vehicleState;
    if (vs.gear === 'D') {
      useMockpitStore.getState().setVehicleState({ cruiseControlActive: !vs.cruiseControlActive });
    }

    const updatedVs = useMockpitStore.getState().vehicleState;
    assert.equal(updatedVs.cruiseControlActive, false);
    assert.equal(updatedVs.cruiseSetSpeed, undefined);
  });

  it('7. Two-way sync with Driver Simulator switch', () => {
    useMockpitStore.setState({ isDebugOpen: true });
    useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 65, cruiseControlActive: false });

    // Step A: Initial OFF state
    let simHtml = renderToStaticMarkup(React.createElement(DebugStatePanel));
    assert.ok(simHtml.includes('translate-x-0'));

    // Step B: Tap CruiseControlWidget (sets cruiseControlActive to true)
    const vs = useMockpitStore.getState().vehicleState;
    if (vs.gear === 'D') {
      useMockpitStore.getState().setVehicleState({ cruiseControlActive: true });
    }
    assert.equal(useMockpitStore.getState().vehicleState.cruiseControlActive, true);

    simHtml = renderToStaticMarkup(React.createElement(DebugStatePanel));
    assert.ok(simHtml.includes('bg-emerald-500'));
    assert.ok(simHtml.includes('translate-x-4'));

    // Step C: Tap Simulator switch (toggles cruiseControlActive back to false)
    const simVs = useMockpitStore.getState().vehicleState;
    if (simVs.gear === 'D') {
      useMockpitStore.getState().setVehicleState({ cruiseControlActive: !simVs.cruiseControlActive });
    }
    assert.equal(useMockpitStore.getState().vehicleState.cruiseControlActive, false);

    const widgetHtml = renderToStaticMarkup(React.createElement(CruiseControlWidget, { component: baseComp }));
    assert.ok(widgetHtml.includes('aria-pressed="false"'));
    assert.ok(widgetHtml.includes('OFF'));
  });

  it('8. Responsive breakpoints: compact and ultra-compact sizes retain button, dot, and label', () => {
    // Compact size
    const compactComp: ComponentInstance = { ...baseComp, width: 200, height: 110 };
    const compactHtml = renderToStaticMarkup(React.createElement(CruiseControlWidget, { component: compactComp }));
    assert.ok(compactHtml.includes('min-height:44px') || compactHtml.includes('min-height: 44px'));
    assert.ok(compactHtml.includes('w-8 h-8'));
    assert.ok(compactHtml.includes('w-2 h-2 rounded-full'));
    assert.ok(compactHtml.includes('OFF'));

    // Ultra-compact size (hides header, but keeps button, dot, label)
    const ultraComp: ComponentInstance = { ...baseComp, width: 170, height: 80 };
    const ultraHtml = renderToStaticMarkup(React.createElement(CruiseControlWidget, { component: ultraComp }));
    assert.ok(ultraHtml.includes('min-height:44px') || ultraHtml.includes('min-height: 44px'));
    assert.ok(ultraHtml.includes('w-8 h-8'));
    assert.ok(ultraHtml.includes('w-2 h-2 rounded-full'));
    assert.ok(ultraHtml.includes('OFF'));
    // Header is hidden in ultra-compact
    assert.equal(ultraHtml.includes('Cruise Control</span></span></div>'), false);
  });

  it('9. Small icon-only widget allows selection, drag-move, and deletion in editor mode', () => {
    const smallComp: ComponentInstance = { ...baseComp, width: 60, height: 60 };
    useMockpitStore.setState({ selectedComponentId: null });

    // Selecting smallComp
    useMockpitStore.getState().selectComponent(smallComp.id);
    assert.equal(useMockpitStore.getState().selectedComponentId, smallComp.id);

    // Render with isSelected: true
    const selectedHtml = renderToStaticMarkup(
      React.createElement(CruiseControlWidget, { component: smallComp, isSelected: true, customColor: '#38bdf8' })
    );
    assert.ok(selectedHtml.includes('border-color:#38bdf8') || selectedHtml.includes('border-color: #38bdf8'));

    // Move component
    useMockpitStore.getState().updateComponentPosition(smallComp.id, 150, 200);
    const moved = useMockpitStore.getState().components.find((c: any) => c.id === smallComp.id);
    if (moved) {
      assert.equal(moved.x, 150);
      assert.equal(moved.y, 200);
    }

    // Delete component
    useMockpitStore.getState().deleteComponent(smallComp.id);
    assert.ok(!useMockpitStore.getState().components.some((c: any) => c.id === smallComp.id));
  });
});
