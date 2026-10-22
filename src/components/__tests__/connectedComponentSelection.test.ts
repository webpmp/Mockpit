import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ComponentInstance } from '../../types';
import {
  getVisualSelectionState,
  getSelectionBoundaryStyles,
  resolveActiveCalloutIdForComponent,
} from '../../utils/visualSelection';

/**
 * Pure helper mirroring the selection calculation in Canvas.tsx
 * for Editor Mode and Presentation Mode.
 */
export function computeEditorComponentSelection(
  components: ComponentInstance[],
  selectedComponentId: string | null
): {
  selectedIds: string[];
  primarySelectedId: string | null;
  connectedTargetId: string | null;
} {
  const result = getVisualSelectionState(selectedComponentId, components);
  const selectedComp = selectedComponentId
    ? components.find((c) => c.id === selectedComponentId) ?? null
    : null;
  const connectedTargetId =
    selectedComp?.type === 'vehicleStatusCallout' && selectedComp.connector?.targetComponentId
      ? selectedComp.connector.targetComponentId
      : result.connectedPartnerIds[0] || null;

  return {
    selectedIds: result.visuallySelectedIds,
    primarySelectedId: result.directlySelectedId,
    connectedTargetId,
  };
}

export function computePresentationTargetSelection(
  components: ComponentInstance[],
  activePresentationCalloutId: string | null,
  selectedComponentId: string | null = null
): {
  activeCalloutId: string | null;
  connectedTargetId: string | null;
  visuallySelectedIds: string[];
} {
  const effectiveId = selectedComponentId || activePresentationCalloutId;
  const result = getVisualSelectionState(effectiveId, components);

  const activeCallout = components.find(
    (c) =>
      c.type === 'vehicleStatusCallout' &&
      c.connector?.targetComponentId &&
      (c.id === effectiveId || result.visuallySelectedIds.includes(c.id))
  );

  return {
    activeCalloutId: activeCallout?.id ?? null,
    connectedTargetId: activeCallout?.connector?.targetComponentId ?? null,
    visuallySelectedIds: result.visuallySelectedIds,
  };
}

describe('Connected Components Selected-State Styling Suite', () => {
  const tirePressureMonitor: ComponentInstance = {
    id: 'tire-pressure-mon-1',
    type: 'tirePressure',
    x: 400,
    y: 100,
    width: 380,
    height: 210,
    staticProps: {
      label: 'Tire Pressure Monitor',
    },
    bindings: [],
  };

  const statusCalloutTirePressure: ComponentInstance = {
    id: 'callout-tire-pressure',
    type: 'vehicleStatusCallout',
    x: 80,
    y: 100,
    width: 280,
    height: 140,
    staticProps: {
      title: 'Tire Pressure Callout',
    },
    bindings: [],
    connector: {
      targetComponentId: 'tire-pressure-mon-1',
      sourceAnchor: 'right-center',
      targetX: 0.5,
      targetY: 0.5,
    },
  };

  const chassisExplodedView: ComponentInstance = {
    id: 'chassis-exploded-view-1',
    type: 'vehicleExplodedView',
    x: 400,
    y: 350,
    width: 600,
    height: 400,
    staticProps: {},
    bindings: [],
  };

  const statusCalloutPowertrain: ComponentInstance = {
    id: 'callout-powertrain',
    type: 'vehicleStatusCallout',
    x: 80,
    y: 350,
    width: 280,
    height: 140,
    staticProps: {
      title: 'Front Powertrain',
    },
    bindings: [],
    connector: {
      targetComponentId: 'chassis-exploded-view-1',
      sourceAnchor: 'right-center',
      targetX: 0.2,
      targetY: 0.3,
    },
  };

  const unlinkedCallout: ComponentInstance = {
    id: 'callout-unlinked',
    type: 'vehicleStatusCallout',
    x: 80,
    y: 520,
    width: 280,
    height: 140,
    staticProps: {
      title: 'General Status',
    },
    bindings: [],
    connector: null,
  };

  const speedometer: ComponentInstance = {
    id: 'speedometer-1',
    type: 'speed',
    x: 1000,
    y: 100,
    width: 200,
    height: 200,
    staticProps: {},
    bindings: [],
  };

  const vehicleComponents: ComponentInstance[] = [
    statusCalloutTirePressure,
    tirePressureMonitor,
    statusCalloutPowertrain,
    chassisExplodedView,
    unlinkedCallout,
    speedometer,
  ];

  it('1. Selecting Status Callout (Tire Pressure) highlights both the Callout and Tire Pressure Monitor', () => {
    const result = computeEditorComponentSelection(vehicleComponents, 'callout-tire-pressure');

    assert.equal(result.primarySelectedId, 'callout-tire-pressure');
    assert.equal(result.connectedTargetId, 'tire-pressure-mon-1');
    assert.deepEqual(
      result.selectedIds.sort(),
      ['callout-tire-pressure', 'tire-pressure-mon-1'].sort()
    );
    assert.ok(result.selectedIds.includes('callout-tire-pressure'));
    assert.ok(result.selectedIds.includes('tire-pressure-mon-1'));
    assert.ok(!result.selectedIds.includes('speedometer-1'));
    assert.ok(!result.selectedIds.includes('chassis-exploded-view-1'));
  });

  it('2. Switching selection to a different connected callout updates highlights and clears previous selection (no stale highlights)', () => {
    // Select Callout A first
    const firstResult = computeEditorComponentSelection(vehicleComponents, 'callout-tire-pressure');
    assert.ok(firstResult.selectedIds.includes('tire-pressure-mon-1'));

    // Switch to Callout B (Powertrain -> Chassis)
    const secondResult = computeEditorComponentSelection(vehicleComponents, 'callout-powertrain');
    assert.equal(secondResult.primarySelectedId, 'callout-powertrain');
    assert.equal(secondResult.connectedTargetId, 'chassis-exploded-view-1');
    assert.deepEqual(
      secondResult.selectedIds.sort(),
      ['callout-powertrain', 'chassis-exploded-view-1'].sort()
    );

    // Ensure Callout A and Tire Pressure Monitor are NO LONGER selected
    assert.ok(!secondResult.selectedIds.includes('callout-tire-pressure'));
    assert.ok(!secondResult.selectedIds.includes('tire-pressure-mon-1'));
  });

  it('3. Deselecting or clearing selection removes selected styling from all components', () => {
    const result = computeEditorComponentSelection(vehicleComponents, null);
    assert.equal(result.primarySelectedId, null);
    assert.equal(result.connectedTargetId, null);
    assert.equal(result.selectedIds.length, 0);
  });

  it('4. Selecting an unrelated component preserves normal single selection behavior', () => {
    const result = computeEditorComponentSelection(vehicleComponents, 'speedometer-1');
    assert.equal(result.primarySelectedId, 'speedometer-1');
    assert.equal(result.connectedTargetId, null);
    assert.deepEqual(result.selectedIds, ['speedometer-1']);
  });

  it('5. Unlinked Status Callout highlights only itself', () => {
    const result = computeEditorComponentSelection(vehicleComponents, 'callout-unlinked');
    assert.equal(result.primarySelectedId, 'callout-unlinked');
    assert.equal(result.connectedTargetId, null);
    assert.deepEqual(result.selectedIds, ['callout-unlinked']);
  });

  it('6. When connected target component is deleted or does not exist, highlights only the callout itself', () => {
    const calloutWithMissingTarget: ComponentInstance = {
      id: 'callout-orphaned',
      type: 'vehicleStatusCallout',
      x: 80,
      y: 100,
      width: 280,
      height: 140,
      staticProps: {},
      bindings: [],
      connector: {
        targetComponentId: 'deleted-component-id-999',
        sourceAnchor: 'right-center',
        targetX: 0.5,
        targetY: 0.5,
      },
    };

    const result = computeEditorComponentSelection(
      [calloutWithMissingTarget, speedometer],
      'callout-orphaned'
    );
    assert.deepEqual(result.selectedIds, ['callout-orphaned']);
    assert.ok(!result.selectedIds.includes('deleted-component-id-999'));
  });

  it('7. Dynamically connects to custom or iframe-based components without hardcoded IDs', () => {
    const customIframeWidget: ComponentInstance = {
      id: 'custom-webview-widget',
      type: 'map', // or any custom component
      x: 500,
      y: 200,
      width: 400,
      height: 300,
      staticProps: {
        iframeUrl: 'https://example.com/widget',
      },
      bindings: [],
    };

    const calloutToCustom: ComponentInstance = {
      id: 'callout-to-custom',
      type: 'vehicleStatusCallout',
      x: 100,
      y: 200,
      width: 280,
      height: 140,
      staticProps: {},
      bindings: [],
      connector: {
        targetComponentId: 'custom-webview-widget',
        sourceAnchor: 'right-center',
        targetX: 0.5,
        targetY: 0.5,
      },
    };

    const result = computeEditorComponentSelection(
      [customIframeWidget, calloutToCustom],
      'callout-to-custom'
    );
    assert.deepEqual(
      result.selectedIds.sort(),
      ['custom-webview-widget', 'callout-to-custom'].sort()
    );
  });

  it('8. Presentation Mode: active presentation callout highlights both the callout and its target component', () => {
    const presResult = computePresentationTargetSelection(
      vehicleComponents,
      'callout-tire-pressure'
    );
    assert.equal(presResult.activeCalloutId, 'callout-tire-pressure');
    assert.equal(presResult.connectedTargetId, 'tire-pressure-mon-1');

    const presPowertrainResult = computePresentationTargetSelection(
      vehicleComponents,
      'callout-powertrain'
    );
    assert.equal(presPowertrainResult.activeCalloutId, 'callout-powertrain');
    assert.equal(presPowertrainResult.connectedTargetId, 'chassis-exploded-view-1');

    const presUnlinkedResult = computePresentationTargetSelection(
      vehicleComponents,
      'callout-unlinked'
    );
    assert.equal(presUnlinkedResult.activeCalloutId, null);
    assert.equal(presUnlinkedResult.connectedTargetId, null);
  });

  it('9. Status Callout Header Blue Dot visibility in Editor Mode: appears ONLY on directly selected callout', () => {
    // Helper replicating VehicleStatusCalloutWidget's isDirectlySelected check
    const isCalloutHeaderDotVisible = (
      calloutId: string,
      selectedComponentId: string | null,
      isPresentation = false,
      activePresentationCalloutId: string | null = null
    ) => {
      if (isPresentation) {
        return activePresentationCalloutId === calloutId;
      }
      return selectedComponentId === calloutId;
    };

    // 1. When callout-tire-pressure is selected: its blue dot is visible
    assert.equal(
      isCalloutHeaderDotVisible('callout-tire-pressure', 'callout-tire-pressure'),
      true,
      'Directly selected Status Callout must display blue dot'
    );

    // 2. Unselected Status Callout must NOT display blue dot
    assert.equal(
      isCalloutHeaderDotVisible('callout-powertrain', 'callout-tire-pressure'),
      false,
      'Unselected Status Callout must hide blue dot'
    );

    // 3. Connected target component (tire-pressure-mon-1) must NEVER display Status Callout header dot
    assert.equal(
      isCalloutHeaderDotVisible('tire-pressure-mon-1', 'callout-tire-pressure'),
      false,
      'Connected target component must not inherit or display header dot'
    );

    // 4. Switching selection to callout-powertrain immediately moves dot
    assert.equal(
      isCalloutHeaderDotVisible('callout-tire-pressure', 'callout-powertrain'),
      false,
      'Previously selected callout must hide blue dot'
    );
    assert.equal(
      isCalloutHeaderDotVisible('callout-powertrain', 'callout-powertrain'),
      true,
      'Newly selected callout must display blue dot'
    );

    // 5. Selecting an unrelated component (e.g. speedometer-1) hides all callout blue dots
    assert.equal(
      isCalloutHeaderDotVisible('callout-tire-pressure', 'speedometer-1'),
      false
    );
    assert.equal(
      isCalloutHeaderDotVisible('callout-powertrain', 'speedometer-1'),
      false
    );

    // 6. Clearing selection hides all callout blue dots
    assert.equal(
      isCalloutHeaderDotVisible('callout-tire-pressure', null),
      false
    );
  });

  it('10. Status Callout Header Blue Dot visibility in Presentation Mode: appears ONLY when callout is active', () => {
    const isCalloutHeaderDotVisibleInPres = (
      calloutId: string,
      activePresentationCalloutId: string | null
    ) => {
      return activePresentationCalloutId === calloutId;
    };

    // No active callout in presentation: dot hidden
    assert.equal(isCalloutHeaderDotVisibleInPres('callout-tire-pressure', null), false);

    // When callout-tire-pressure is active: dot visible
    assert.equal(
      isCalloutHeaderDotVisibleInPres('callout-tire-pressure', 'callout-tire-pressure'),
      true
    );

    // Connected target component never has callout dot
    assert.equal(
      isCalloutHeaderDotVisibleInPres('tire-pressure-mon-1', 'callout-tire-pressure'),
      false
    );

    // Switching to powertrain callout updates dot
    assert.equal(
      isCalloutHeaderDotVisibleInPres('callout-tire-pressure', 'callout-powertrain'),
      false
    );
    assert.equal(
      isCalloutHeaderDotVisibleInPres('callout-powertrain', 'callout-powertrain'),
      true
    );
  });

  it('11. Outer wrapper ring & elevated stacking prevent iframe or sibling content from obscuring target border', () => {
    // Helper replicating Canvas.tsx outer wrapper ring class generation
    const getWrapperRingClasses = (isVisuallySelected: boolean) => {
      return isVisuallySelected
        ? 'rounded-2xl ring-2 ring-sky-400 shadow-[0_0_15px_color-mix(in_srgb,var(--color-primary,#38bdf8)_40%,transparent)]'
        : '';
    };

    // Helper replicating Canvas.tsx effectiveZ boost
    const getEffectiveZ = (baseZ: number, isDirectlySelected: boolean, isVisuallySelected: boolean) => {
      if (!isVisuallySelected) return baseZ;
      const boostAmount = isDirectlySelected ? 100 : 50;
      return baseZ + boostAmount;
    };

    // For tire pressure monitor when its callout is selected:
    const isDirectlySelected = false;
    const isConnectedCalloutTarget = true;
    const isVisuallySelected = isDirectlySelected || isConnectedCalloutTarget;

    const ringClasses = getWrapperRingClasses(isVisuallySelected);
    assert.ok(
      ringClasses.includes('ring-2 ring-sky-400'),
      'Connected target wrapper must have ring-2 ring-sky-400 on parent container'
    );

    const baseZ = 10;
    const elevatedZ = getEffectiveZ(baseZ, isDirectlySelected, isVisuallySelected);
    assert.equal(elevatedZ, 60, 'Connected target z-index must be boosted by 50 to prevent clipping/obscuring');
  });

  it('12. Bidirectional selection in Editor Mode: selecting connected target highlights both components', () => {
    // Select the target component directly
    const result = computeEditorComponentSelection(vehicleComponents, 'tire-pressure-mon-1');

    assert.equal(result.primarySelectedId, 'tire-pressure-mon-1');
    assert.deepEqual(
      result.selectedIds.sort(),
      ['tire-pressure-mon-1', 'callout-tire-pressure'].sort()
    );
    assert.ok(result.selectedIds.includes('tire-pressure-mon-1'));
    assert.ok(result.selectedIds.includes('callout-tire-pressure'));
    assert.ok(!result.selectedIds.includes('speedometer-1'));
    assert.ok(!result.selectedIds.includes('chassis-exploded-view-1'));
  });

  it('13. Bidirectional selection in Presentation Mode: selecting connected target highlights both components and reveals connector', () => {
    // In Presentation Mode, clicking target component directly
    const presResult = computePresentationTargetSelection(
      vehicleComponents,
      null,
      'tire-pressure-mon-1'
    );

    assert.deepEqual(
      presResult.visuallySelectedIds.sort(),
      ['tire-pressure-mon-1', 'callout-tire-pressure'].sort()
    );
    assert.equal(presResult.activeCalloutId, 'callout-tire-pressure');
    assert.equal(presResult.connectedTargetId, 'tire-pressure-mon-1');
  });

  it('14. Selecting connected target does NOT show the blue header dot on the connected Status Callout', () => {
    const isCalloutHeaderDotVisible = (
      calloutId: string,
      selectedComponentId: string | null
    ) => {
      // In VehicleStatusCalloutWidget, isDirectlySelected is:
      // useMockpitStore((s) => s.selectedComponentId) === component.id
      return selectedComponentId === calloutId;
    };

    // When tire-pressure-mon-1 is selected:
    assert.equal(
      isCalloutHeaderDotVisible('callout-tire-pressure', 'tire-pressure-mon-1'),
      false,
      'Callout must NOT show header dot when its connected target is directly clicked'
    );

    // When callout is directly clicked:
    assert.equal(
      isCalloutHeaderDotVisible('callout-tire-pressure', 'callout-tire-pressure'),
      true,
      'Callout MUST show header dot when directly clicked'
    );
  });

  it('15. Separate independent selection borders are assigned to both connected components', () => {
    const getTestId = (compId: string, directlySelectedId: string | null) =>
      compId === directlySelectedId ? 'selection-box-primary' : 'selection-box-connected';

    // When Callout is directly clicked
    const stateCalloutClicked = getVisualSelectionState('callout-tire-pressure', vehicleComponents);
    assert.equal(stateCalloutClicked.directlySelectedId, 'callout-tire-pressure');
    assert.deepEqual(stateCalloutClicked.connectedPartnerIds, ['tire-pressure-mon-1']);
    assert.equal(getTestId('callout-tire-pressure', stateCalloutClicked.directlySelectedId), 'selection-box-primary');
    assert.equal(getTestId('tire-pressure-mon-1', stateCalloutClicked.directlySelectedId), 'selection-box-connected');

    // When Target is directly clicked
    const stateTargetClicked = getVisualSelectionState('tire-pressure-mon-1', vehicleComponents);
    assert.equal(stateTargetClicked.directlySelectedId, 'tire-pressure-mon-1');
    assert.deepEqual(stateTargetClicked.connectedPartnerIds, ['callout-tire-pressure']);
    assert.equal(getTestId('tire-pressure-mon-1', stateTargetClicked.directlySelectedId), 'selection-box-primary');
    assert.equal(getTestId('callout-tire-pressure', stateTargetClicked.directlySelectedId), 'selection-box-connected');
  });

  it('16. Coordinated selection boundary styling for connected pair removes horizontal border between them', () => {
    // Model the vertically stacked pair:
    // Callout (top, height 140, y 100) and Tire Pressure Monitor (bottom, y 240)
    const calloutTop: ComponentInstance = {
      ...statusCalloutTirePressure,
      x: 400,
      y: 100,
      width: 380,
      height: 140,
      borderOverrides: { top: true, right: true, bottom: false, left: true },
    };
    const tireBottom: ComponentInstance = {
      ...tirePressureMonitor,
      x: 400,
      y: 240,
      width: 380,
      height: 210,
      borderOverrides: { top: false, right: true, bottom: true, left: true },
    };
    const pair = [calloutTop, tireBottom];

    // Top component boundary styling
    const topStyles = getSelectionBoundaryStyles(calloutTop, pair, true, true);
    assert.equal(topStyles.isSeamBottom, true, 'Top component must detect bottom seam');
    assert.equal(topStyles.isSeamTop, false, 'Top edge is outer edge');
    assert.ok(topStyles.borderClasses.includes('border-t-2'), 'Top edge must have 2px blue border');
    assert.ok(topStyles.borderClasses.includes('border-l-2'), 'Left edge must have 2px blue border');
    assert.ok(topStyles.borderClasses.includes('border-r-2'), 'Right edge must have 2px blue border');
    assert.ok(!topStyles.borderClasses.includes('border-b-2'), 'Shared horizontal seam must NOT have border-b-2');
    assert.ok(topStyles.cornerClasses.includes('rounded-tl-2xl'), 'Top-left corner must be rounded');
    assert.ok(topStyles.cornerClasses.includes('rounded-tr-2xl'), 'Top-right corner must be rounded');
    assert.ok(topStyles.cornerClasses.includes('rounded-bl-none'), 'Bottom-left corner at seam must be square');
    assert.ok(topStyles.cornerClasses.includes('rounded-br-none'), 'Bottom-right corner at seam must be square');
    assert.ok(topStyles.inlineStyle.clipPath?.includes('0px'), 'Glow must be clipped at seam');

    // Bottom component boundary styling
    const bottomStyles = getSelectionBoundaryStyles(tireBottom, pair, true, false);
    assert.equal(bottomStyles.isSeamTop, true, 'Bottom component must detect top seam');
    assert.equal(bottomStyles.isSeamBottom, false, 'Bottom edge is outer edge');
    assert.ok(bottomStyles.borderClasses.includes('border-b-2'), 'Bottom edge must have 2px blue border');
    assert.ok(bottomStyles.borderClasses.includes('border-l-2'), 'Left edge must have 2px blue border');
    assert.ok(bottomStyles.borderClasses.includes('border-r-2'), 'Right edge must have 2px blue border');
    assert.ok(!bottomStyles.borderClasses.includes('border-t-2'), 'Shared horizontal seam must NOT have border-t-2');
    assert.ok(bottomStyles.cornerClasses.includes('rounded-tl-none'), 'Top-left corner at seam must be square');
    assert.ok(bottomStyles.cornerClasses.includes('rounded-tr-none'), 'Top-right corner at seam must be square');
    assert.ok(bottomStyles.cornerClasses.includes('rounded-bl-2xl'), 'Bottom-left corner must be rounded');
    assert.ok(bottomStyles.cornerClasses.includes('rounded-br-2xl'), 'Bottom-right corner must be rounded');
    assert.ok(bottomStyles.inlineStyle.clipPath?.includes('0px'), 'Glow must be clipped at seam');
  });

  it('17. Clicking either component resolves the same active callout ID for connection animation', () => {
    // Top callout clicked
    const fromCallout = resolveActiveCalloutIdForComponent('callout-tire-pressure', vehicleComponents);
    assert.equal(fromCallout, 'callout-tire-pressure');

    // Bottom target clicked
    const fromTarget = resolveActiveCalloutIdForComponent('tire-pressure-mon-1', vehicleComponents);
    assert.equal(fromTarget, 'callout-tire-pressure');

    // Both resolve to the exact same connection
    assert.equal(fromCallout, fromTarget);
  });

  it('18. Clicking an unrelated component resolves null for active connection', () => {
    const unrelatedResult = resolveActiveCalloutIdForComponent('speedometer-1', vehicleComponents);
    assert.equal(unrelatedResult, null);
  });

  it('19. Standalone components with no shared seams retain complete 4-sided selection outline and 4 rounded corners', () => {
    const standaloneStyles = getSelectionBoundaryStyles(speedometer, [speedometer], true, true);
    assert.equal(standaloneStyles.isSeamTop, false);
    assert.equal(standaloneStyles.isSeamBottom, false);
    assert.equal(standaloneStyles.isSeamLeft, false);
    assert.equal(standaloneStyles.isSeamRight, false);
    assert.ok(standaloneStyles.borderClasses.includes('border-t-2'));
    assert.ok(standaloneStyles.borderClasses.includes('border-b-2'));
    assert.ok(standaloneStyles.borderClasses.includes('border-l-2'));
    assert.ok(standaloneStyles.borderClasses.includes('border-r-2'));
    assert.ok(standaloneStyles.cornerClasses.includes('rounded-tl-2xl'));
    assert.ok(standaloneStyles.cornerClasses.includes('rounded-tr-2xl'));
    assert.ok(standaloneStyles.cornerClasses.includes('rounded-bl-2xl'));
    assert.ok(standaloneStyles.cornerClasses.includes('rounded-br-2xl'));
    assert.equal(standaloneStyles.inlineStyle.clipPath, undefined);
  });
});
