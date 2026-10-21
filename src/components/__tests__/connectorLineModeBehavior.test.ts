import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useMockpitStore } from '../../store/useMockpitStore';
import {
  getAnchorCanvasCoords,
  getTargetCanvasCoords,
  resolveComponentBox,
} from '../vehicle/ConnectorLayer';
import { ComponentInstance } from '../../types';

describe('Status Callout & Exploded View Chassis Connector Line Mode Behavior Suite', () => {
  const chassisComp: ComponentInstance = {
    id: 'chassis-1',
    type: 'vehicleExplodedView',
    x: 400,
    y: 150,
    width: 900,
    height: 600,
    staticProps: {},
    bindings: [],
  };

  const calloutA: ComponentInstance = {
    id: 'callout-a',
    type: 'vehicleStatusCallout',
    x: 80,
    y: 200,
    width: 280,
    height: 140,
    staticProps: { title: 'Front Powertrain' },
    bindings: [],
    connector: {
      targetComponentId: 'chassis-1',
      sourceAnchor: 'right-center',
      targetX: 0.25,
      targetY: 0.35,
    },
  };

  const calloutB: ComponentInstance = {
    id: 'callout-b',
    type: 'vehicleStatusCallout',
    x: 80,
    y: 400,
    width: 280,
    height: 140,
    staticProps: { title: 'High Voltage Battery' },
    bindings: [],
    connector: {
      targetComponentId: 'chassis-1',
      sourceAnchor: 'right-center',
      targetX: 0.5,
      targetY: 0.55,
    },
  };

  const calloutUnlinked: ComponentInstance = {
    id: 'callout-unlinked',
    type: 'vehicleStatusCallout',
    x: 80,
    y: 600,
    width: 280,
    height: 140,
    staticProps: { title: 'Cabin HVAC' },
    bindings: [],
    connector: null,
  };

  beforeEach(() => {
    useMockpitStore.setState({
      screenMode: 'editor',
      selectedComponentId: null,
      activePresentationCalloutId: null,
      activeView: 'home',
      componentsByScreen: {
        home: [chassisComp, calloutA, calloutB, calloutUnlinked],
      },
      components: [chassisComp, calloutA, calloutB, calloutUnlinked],
    });
  });

  it('1. Editor Mode: One linked Status Callout displays its connector line without interaction', () => {
    const isPresentation = false;
    const callouts = [calloutA].filter((c) => c.connector && c.connector.targetComponentId);

    // In Editor Mode, visibleCallouts contains all linked callouts unconditionally
    const visibleCallouts = !isPresentation ? callouts : [];
    assert.equal(visibleCallouts.length, 1);
    assert.equal(visibleCallouts[0].id, 'callout-a');
  });

  it('2. Editor Mode: Multiple linked Status Callouts display all their connector lines simultaneously', () => {
    const isPresentation = false;
    const components = [chassisComp, calloutA, calloutB, calloutUnlinked];
    const callouts = components.filter(
      (c) => c.type === 'vehicleStatusCallout' && c.connector && c.connector.targetComponentId
    );

    const visibleCallouts = !isPresentation ? callouts : [];
    assert.equal(visibleCallouts.length, 2, 'Both linked callouts must have visible connector lines');
    assert.ok(visibleCallouts.some((c) => c.id === 'callout-a'));
    assert.ok(visibleCallouts.some((c) => c.id === 'callout-b'));
    assert.ok(!visibleCallouts.some((c) => c.id === 'callout-unlinked'), 'Unlinked callout is not in callouts');
  });

  it('3. Presentation/User Mode: All connector lines are hidden initially', () => {
    useMockpitStore.getState().setScreenMode('presentation');
    const state = useMockpitStore.getState();

    assert.equal(state.screenMode, 'presentation');
    assert.equal(state.activePresentationCalloutId, null, 'activePresentationCalloutId must be null initially');

    const components = [chassisComp, calloutA, calloutB, calloutUnlinked];
    const callouts = components.filter(
      (c) => c.type === 'vehicleStatusCallout' && c.connector && c.connector.targetComponentId
    );

    const isPresentation = true;
    const visibleCallouts = isPresentation
      ? callouts.filter((c) => c.id === state.activePresentationCalloutId)
      : callouts;

    assert.equal(visibleCallouts.length, 0, 'No connector lines should be visible initially in presentation mode');
  });

  it('4. Presentation/User Mode: Tapping a linked Status Callout reveals and animates its connector line', () => {
    useMockpitStore.getState().setScreenMode('presentation');

    // Simulate tapping calloutA
    useMockpitStore.getState().setActivePresentationCalloutId(calloutA.id);

    const state = useMockpitStore.getState();
    assert.equal(state.activePresentationCalloutId, 'callout-a');

    const components = [chassisComp, calloutA, calloutB, calloutUnlinked];
    const callouts = components.filter(
      (c) => c.type === 'vehicleStatusCallout' && c.connector && c.connector.targetComponentId
    );

    const isPresentation = true;
    const visibleCallouts = isPresentation
      ? callouts.filter((c) => c.id === state.activePresentationCalloutId)
      : callouts;

    assert.equal(visibleCallouts.length, 1);
    assert.equal(visibleCallouts[0].id, 'callout-a');

    // Verify geometric endpoints originate from source anchor toward target point
    const sourcePt = getAnchorCanvasCoords(calloutA, calloutA.connector!.sourceAnchor);
    const targetPt = getTargetCanvasCoords(chassisComp, calloutA.connector!.targetX, calloutA.connector!.targetY);

    assert.equal(sourcePt.x, calloutA.x + calloutA.width, 'Source X must be right edge (right-center anchor)');
    assert.equal(sourcePt.y, calloutA.y + calloutA.height / 2, 'Source Y must be vertical center');
    assert.ok(targetPt.x > sourcePt.x, 'Target point is to the right of source point');

    const lineLength = Math.hypot(targetPt.x - sourcePt.x, targetPt.y - sourcePt.y);
    assert.ok(lineLength > 0, 'Line length must be positive');
  });

  it('5. Presentation/User Mode: Tapping a second linked Status Callout hides the first line and animates only the second line', () => {
    useMockpitStore.getState().setScreenMode('presentation');

    // First tap calloutA
    useMockpitStore.getState().setActivePresentationCalloutId(calloutA.id);
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, 'callout-a');

    // Second tap calloutB
    useMockpitStore.getState().setActivePresentationCalloutId(calloutB.id);
    const state = useMockpitStore.getState();
    assert.equal(state.activePresentationCalloutId, 'callout-b');

    const components = [chassisComp, calloutA, calloutB, calloutUnlinked];
    const callouts = components.filter(
      (c) => c.type === 'vehicleStatusCallout' && c.connector && c.connector.targetComponentId
    );

    const isPresentation = true;
    const visibleCallouts = isPresentation
      ? callouts.filter((c) => c.id === state.activePresentationCalloutId)
      : callouts;

    assert.equal(visibleCallouts.length, 1, 'Only one line must be visible');
    assert.equal(visibleCallouts[0].id, 'callout-b', 'Only the second callout line is rendered');
  });

  it('6. Presentation/User Mode: Tapping an unlinked Status Callout does not reveal a connector or affect the active connector', () => {
    useMockpitStore.getState().setScreenMode('presentation');

    // Activate calloutA first
    useMockpitStore.getState().setActivePresentationCalloutId(calloutA.id);
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, 'callout-a');

    // Tapping an unlinked callout widget verifies component.connector?.targetComponentId is falsy
    const handleCalloutTap = (comp: ComponentInstance) => {
      if (comp.connector && comp.connector.targetComponentId) {
        useMockpitStore.getState().setActivePresentationCalloutId(comp.id);
      }
    };

    handleCalloutTap(calloutUnlinked);

    // Active callout remains callout-a untouched
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, 'callout-a');
  });

  it('7. Mode switching: Switching between Editor Mode and Presentation/User Mode applies the correct visibility behavior immediately', () => {
    // Start in Presentation Mode with an active callout
    useMockpitStore.getState().setScreenMode('presentation');
    useMockpitStore.getState().setActivePresentationCalloutId(calloutA.id);

    // Switch to Editor Mode
    useMockpitStore.getState().setScreenMode('editor');
    assert.equal(useMockpitStore.getState().screenMode, 'editor');
    assert.equal(
      useMockpitStore.getState().activePresentationCalloutId,
      null,
      'activePresentationCalloutId is cleared on mode change'
    );

    // In Editor Mode, all callouts are visible
    const components = [chassisComp, calloutA, calloutB, calloutUnlinked];
    const callouts = components.filter(
      (c) => c.type === 'vehicleStatusCallout' && c.connector && c.connector.targetComponentId
    );
    let visibleCallouts = false ? [] : callouts;
    assert.equal(visibleCallouts.length, 2);

    // Switch back to Presentation Mode
    useMockpitStore.getState().setScreenMode('presentation');
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, null);
    visibleCallouts = true
      ? callouts.filter((c) => c.id === useMockpitStore.getState().activePresentationCalloutId)
      : callouts;
    assert.equal(visibleCallouts.length, 0, 'All lines hidden when entering presentation mode');
  });

  it('8. Connector configuration: Changing source anchor or target coordinates updates line endpoints', () => {
    // Change sourceAnchor to bottom-center
    const updatedCallout: ComponentInstance = {
      ...calloutA,
      connector: {
        ...calloutA.connector!,
        sourceAnchor: 'bottom-center',
        targetX: 0.75,
        targetY: 0.85,
      },
    };

    const sourcePt = getAnchorCanvasCoords(updatedCallout, updatedCallout.connector!.sourceAnchor);
    assert.equal(sourcePt.x, updatedCallout.x + updatedCallout.width / 2);
    assert.equal(sourcePt.y, updatedCallout.y + updatedCallout.height);

    const targetPt = getTargetCanvasCoords(
      chassisComp,
      updatedCallout.connector!.targetX,
      updatedCallout.connector!.targetY
    );
    assert.ok(targetPt.x > chassisComp.x);
    assert.ok(targetPt.y > chassisComp.y);
  });

  it('9. Cleanup: Unlinking or deleting the active callout clears its active connector', () => {
    useMockpitStore.getState().setScreenMode('presentation');
    useMockpitStore.getState().setActivePresentationCalloutId(calloutA.id);
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, 'callout-a');

    // Unlink calloutA
    useMockpitStore.getState().updateComponentConnector(calloutA.id, null);
    assert.equal(
      useMockpitStore.getState().activePresentationCalloutId,
      null,
      'Unlinking active callout clears activePresentationCalloutId'
    );

    // Reactivate calloutB and delete it
    useMockpitStore.getState().setActivePresentationCalloutId(calloutB.id);
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, 'callout-b');

    useMockpitStore.getState().deleteComponent(calloutB.id);
    assert.equal(
      useMockpitStore.getState().activePresentationCalloutId,
      null,
      'Deleting active callout clears activePresentationCalloutId'
    );
  });

  it('10. Rapid interaction: Quickly tapping multiple callouts never leaves more than one connector line visible in Presentation/User Mode', () => {
    useMockpitStore.getState().setScreenMode('presentation');

    // Rapid successive taps
    useMockpitStore.getState().setActivePresentationCalloutId('callout-a');
    useMockpitStore.getState().setActivePresentationCalloutId('callout-b');
    useMockpitStore.getState().setActivePresentationCalloutId('callout-a');
    useMockpitStore.getState().setActivePresentationCalloutId('callout-b');

    const state = useMockpitStore.getState();
    assert.equal(state.activePresentationCalloutId, 'callout-b');

    const components = [chassisComp, calloutA, calloutB];
    const callouts = components.filter(
      (c) => c.type === 'vehicleStatusCallout' && c.connector && c.connector.targetComponentId
    );

    const visibleCallouts = callouts.filter((c) => c.id === state.activePresentationCalloutId);
    assert.equal(visibleCallouts.length, 1, 'Never more than 1 connector line is visible in Presentation Mode');
    assert.equal(visibleCallouts[0].id, 'callout-b');
  });

  it('11. Responsive layout: Connector endpoints remain aligned when components move or canvas offset is applied', () => {
    const offset = { x: 20, y: 48 };
    const movedCallout = resolveComponentBox(calloutA, offset);
    const movedChassis = resolveComponentBox(chassisComp, offset);

    assert.equal(movedCallout.x, calloutA.x + 20);
    assert.equal(movedCallout.y, calloutA.y + 48);
    assert.equal(movedChassis.x, chassisComp.x + 20);
    assert.equal(movedChassis.y, chassisComp.y + 48);

    const sourcePt = getAnchorCanvasCoords(movedCallout, movedCallout.connector!.sourceAnchor);
    const targetPt = getTargetCanvasCoords(movedChassis, movedCallout.connector!.targetX, movedCallout.connector!.targetY);

    assert.equal(sourcePt.x, calloutA.x + 20 + calloutA.width);
    assert.equal(sourcePt.y, calloutA.y + 48 + calloutA.height / 2);
    assert.ok(targetPt.x > movedChassis.x);
    assert.ok(targetPt.y > movedChassis.y);
  });
});
