import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkIntegrationEligibility,
  computeInsideAttachmentPosition,
  getEligibleParentCandidates,
  formatAttachmentPosition,
  getComponentBorderWidthPx,
  snapChildInsideParent,
} from '../../utils/componentIntegration';
import {
  getBorderClasses,
  getCornerRadiusClasses,
  DEFAULT_BORDER_OVERRIDES,
} from '../../utils/borderOverrides';
import { COMPONENT_DISPLAY_NAMES } from '../../utils/componentDisplayNames';
import { ComponentInstance } from '../../types';
import { useMockpitStore } from '../../store/useMockpitStore';

describe('Component Integration (Parent/Child Visual Relationships) Suite', () => {
  const createMockComponent = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    extra: Partial<ComponentInstance> = {}
  ): ComponentInstance => ({
    id,
    type: 'speed',
    x,
    y,
    width,
    height,
    staticProps: {},
    bindings: [],
    ...extra,
  });

  describe('1. Geometric Eligibility Check', () => {
    it('Identifies inside integration when overlap >= 90% of smaller component area', () => {
      // Parent: 400x400 at (100, 100). Child: 100x100 at (150, 150) (100% inside)
      const parent = createMockComponent('parent', 100, 100, 400, 400);
      const child = createMockComponent('child', 150, 150, 100, 100);

      const result = checkIntegrationEligibility(child, parent);
      assert.equal(result.isEligible, true);
      assert.equal(result.style, 'inside');
    });

    it('Computes inside attachment positions correctly', () => {
      const parent = createMockComponent('parent', 0, 0, 400, 400);

      // Dead center
      const centerChild = createMockComponent('child-center', 150, 150, 100, 100);
      assert.equal(computeInsideAttachmentPosition(centerChild, parent), 'center');

      // Top
      const topChild = createMockComponent('child-top', 150, 10, 100, 50);
      assert.equal(computeInsideAttachmentPosition(topChild, parent), 'top');

      // Bottom
      const bottomChild = createMockComponent('child-bottom', 150, 340, 100, 50);
      assert.equal(computeInsideAttachmentPosition(bottomChild, parent), 'bottom');

      // Left
      const leftChild = createMockComponent('child-left', 10, 150, 50, 100);
      assert.equal(computeInsideAttachmentPosition(leftChild, parent), 'left');

      // Right
      const rightChild = createMockComponent('child-right', 340, 150, 50, 100);
      assert.equal(computeInsideAttachmentPosition(rightChild, parent), 'right');
    });

    it('Identifies outside integration when adjacent (gap <= 20px) and shared edge overlap >= 50%', () => {
      // Parent: 200x200 at (100, 200). Child placed directly above at (100, 50, width=200, height=150)
      // Gap between child bottom (200) and parent top (200) is 0px. Shared edge width overlap = 100%
      const parent = createMockComponent('parent', 100, 200, 200, 200);
      const childAbove = createMockComponent('child-above', 100, 50, 200, 150);

      const result = checkIntegrationEligibility(childAbove, parent);
      assert.equal(result.isEligible, true);
      assert.equal(result.style, 'outside');
      assert.equal(result.attachmentPosition, 'top');
    });

    it('Rejects outside candidate if gap exceeds 20px', () => {
      const parent = createMockComponent('parent', 100, 200, 200, 200);
      // Gap is 25px
      const childTooFar = createMockComponent('child', 100, 25, 200, 150);

      const result = checkIntegrationEligibility(childTooFar, parent);
      assert.equal(result.isEligible, false);
    });

    it('Rejects outside candidate if perpendicular overlap is less than 50%', () => {
      const parent = createMockComponent('parent', 100, 200, 200, 200);
      // Only 40px overlap on X axis (shorter is 200, 40/200 = 20% < 50%)
      const childMisaligned = createMockComponent('child', 260, 50, 200, 150);

      const result = checkIntegrationEligibility(childMisaligned, parent);
      assert.equal(result.isEligible, false);
    });

    it('Prevents self-connection and cycles in candidate discovery', () => {
      const parent = createMockComponent('parent', 100, 100, 400, 400);
      const child = createMockComponent('child', 150, 150, 100, 100, { parentId: 'parent' });

      // Parent should not see child as eligible parent (no cycle)
      const parentCandidates = getEligibleParentCandidates(parent, [parent, child]);
      assert.equal(parentCandidates.length, 0);

      // Child cannot connect to itself
      const selfResult = checkIntegrationEligibility(child, child);
      assert.equal(selfResult.isEligible, false);
    });
  });

  describe('2. Border Classes Generation', () => {
    it('Returns monolithic default border when borderOverrides is null/undefined', () => {
      assert.equal(getBorderClasses(undefined), 'border border-ds-line-subtle');
      assert.equal(getBorderClasses(null), 'border border-ds-line-subtle');
    });

    it('Returns empty string when all borders are disabled', () => {
      const allOff = { top: false, right: false, bottom: false, left: false };
      assert.equal(getBorderClasses(allOff), '');
    });

    it('Generates directional classes when one or more borders are disabled', () => {
      // Child above parent has bottom border disabled
      const childAboveBorders = { top: true, right: true, bottom: false, left: true };
      const classes = getBorderClasses(childAboveBorders);
      assert.match(classes, /border-t/);
      assert.match(classes, /border-r/);
      assert.match(classes, /border-l/);
      assert.equal(classes.includes('border-b'), false);
      assert.match(classes, /border-ds-line-subtle/);
    });

    it('Supports custom colorClass and widthClass', () => {
      const overrides = { top: true, right: false, bottom: true, left: false };
      const classes = getBorderClasses(overrides, 'border-sky-500', 'border-2');
      assert.match(classes, /border-t-2/);
      assert.match(classes, /border-b-2/);
      assert.equal(classes.includes('border-r'), false);
      assert.equal(classes.includes('border-l'), false);
      assert.match(classes, /border-sky-500/);
    });

    it('Appends corner radius override classes to getBorderClasses when edges are disabled', () => {
      // Child above parent has bottom border disabled -> bottom corners squared off
      const childAbove = { top: true, right: true, bottom: false, left: true };
      const childClasses = getBorderClasses(childAbove);
      assert.match(childClasses, /rounded-b-none/);

      // Parent below child has top border disabled -> top corners squared off
      const parentBelow = { top: false, right: true, bottom: true, left: true };
      const parentClasses = getBorderClasses(parentBelow);
      assert.match(parentClasses, /rounded-t-none/);

      // Child left of parent has right border disabled -> right corners squared off
      const childLeft = { top: true, right: false, bottom: true, left: true };
      const leftClasses = getBorderClasses(childLeft);
      assert.match(leftClasses, /rounded-r-none/);

      // Parent right of child has left border disabled -> left corners squared off
      const parentRight = { top: true, right: true, bottom: true, left: false };
      const rightClasses = getBorderClasses(parentRight);
      assert.match(rightClasses, /rounded-l-none/);
    });
  });

  describe('2b. Corner Radius Classes Generation (Spec v1)', () => {
    it('Returns empty string when borderOverrides is null/undefined or all borders enabled', () => {
      assert.equal(getCornerRadiusClasses(undefined), '');
      assert.equal(getCornerRadiusClasses(null), '');
      assert.equal(getCornerRadiusClasses(DEFAULT_BORDER_OVERRIDES), '');
      assert.equal(
        getCornerRadiusClasses({ top: true, right: true, bottom: true, left: true }),
        ''
      );
    });

    it('Returns rounded-none when all 4 borders are disabled', () => {
      assert.equal(
        getCornerRadiusClasses({ top: false, right: false, bottom: false, left: false }),
        'rounded-none'
      );
    });

    it('Returns rounded-t-none when top border is disabled', () => {
      const overrides = { top: false, right: true, bottom: true, left: true };
      assert.equal(getCornerRadiusClasses(overrides), 'rounded-t-none');
    });

    it('Returns rounded-b-none when bottom border is disabled', () => {
      const overrides = { top: true, right: true, bottom: false, left: true };
      assert.equal(getCornerRadiusClasses(overrides), 'rounded-b-none');
    });

    it('Returns rounded-l-none when left border is disabled', () => {
      const overrides = { top: true, right: true, bottom: true, left: false };
      assert.equal(getCornerRadiusClasses(overrides), 'rounded-l-none');
    });

    it('Returns rounded-r-none when right border is disabled', () => {
      const overrides = { top: true, right: false, bottom: true, left: true };
      assert.equal(getCornerRadiusClasses(overrides), 'rounded-r-none');
    });

    it('Flattens multiple edges when multiple borders are disabled', () => {
      const topAndLeft = { top: false, right: true, bottom: true, left: false };
      const classes = getCornerRadiusClasses(topAndLeft);
      assert.match(classes, /rounded-t-none/);
      assert.match(classes, /rounded-l-none/);
    });
  });

  describe('3. Store Integration: Connect & Disconnect Actions', () => {
    it('connectComponent updates child and parent borders, hides child header, and sets parentId', () => {
      const state = useMockpitStore.getState();
      const screenId = state.activeView;

      const parent = createMockComponent('test-parent', 100, 200, 200, 200);
      const child = createMockComponent('test-child', 100, 50, 200, 150, {
        staticProps: { showHeader: 'true' },
      });

      // Populate test components on active screen
      useMockpitStore.setState({
        componentsByScreen: {
          ...state.componentsByScreen,
          [screenId]: [parent, child],
        },
        components: [parent, child],
      });

      // Connect child to parent
      useMockpitStore.getState().connectComponent('test-child', 'test-parent');

      const updatedComps = useMockpitStore.getState().componentsByScreen[screenId];
      const updatedChild = updatedComps.find((c) => c.id === 'test-child')!;
      const updatedParent = updatedComps.find((c) => c.id === 'test-parent')!;

      // Verify connection metadata
      assert.equal(updatedChild.parentId, 'test-parent');
      assert.equal(updatedChild.integrationStyle, 'outside');
      assert.equal(updatedChild.attachmentPosition, 'top');

      // Verify header is hidden and preConnectionShowHeader preserved
      assert.equal(updatedChild.staticProps?.showHeader, 'false');
      assert.equal(updatedChild.preConnectionShowHeader, 'true');

      // Verify touching borders are disabled (child bottom faces parent top)
      assert.equal(updatedChild.borderOverrides?.bottom, false);
      assert.equal(updatedChild.borderOverrides?.top, true);
      assert.equal(updatedParent.borderOverrides?.top, false);
      assert.equal(updatedParent.borderOverrides?.bottom, true);
    });

    it('disconnectComponent restores original headers and borders', () => {
      const state = useMockpitStore.getState();
      const screenId = state.activeView;

      // Disconnect
      useMockpitStore.getState().disconnectComponent('test-child');

      const updatedComps = useMockpitStore.getState().componentsByScreen[screenId];
      const restoredChild = updatedComps.find((c) => c.id === 'test-child')!;
      const restoredParent = updatedComps.find((c) => c.id === 'test-parent')!;

      assert.equal(restoredChild.parentId, undefined);
      assert.equal(restoredChild.integrationStyle, undefined);
      assert.equal(restoredChild.attachmentPosition, undefined);

      // Header restored
      assert.equal(restoredChild.staticProps?.showHeader, 'true');

      // Borders restored
      assert.equal(restoredChild.borderOverrides?.bottom, true);
      assert.equal(restoredParent.borderOverrides?.top, true);
    });
  });

  describe('4. Store Integration: Move & Resize Propagation', () => {
    it('Moving parent moves connected child by the exact same delta', () => {
      const state = useMockpitStore.getState();
      const screenId = state.activeView;

      const parent = createMockComponent('move-parent', 100, 200, 200, 200);
      const child = createMockComponent('move-child', 100, 50, 200, 150);

      useMockpitStore.setState({
        componentsByScreen: {
          ...state.componentsByScreen,
          [screenId]: [parent, child],
        },
        components: [parent, child],
      });

      useMockpitStore.getState().connectComponent('move-child', 'move-parent');

      // Move parent by deltaX = 50, deltaY = 30
      useMockpitStore.getState().updateComponentPosition('move-parent', 150, 230);

      const comps = useMockpitStore.getState().componentsByScreen[screenId];
      const movedParent = comps.find((c) => c.id === 'move-parent')!;
      const movedChild = comps.find((c) => c.id === 'move-child')!;

      assert.equal(movedParent.x, 150);
      assert.equal(movedParent.y, 230);
      // Child originally (100, 50) + (50, 30) = (150, 80)
      assert.equal(movedChild.x, 150);
      assert.equal(movedChild.y, 80);
    });

    it('Deleting parent converts child to standalone with restored headers and borders', () => {
      const state = useMockpitStore.getState();
      const screenId = state.activeView;

      const parent = createMockComponent('del-parent', 100, 200, 200, 200);
      const child = createMockComponent('del-child', 100, 50, 200, 150, {
        staticProps: { showHeader: 'true' },
      });

      useMockpitStore.setState({
        componentsByScreen: {
          ...state.componentsByScreen,
          [screenId]: [parent, child],
        },
        components: [parent, child],
      });

      useMockpitStore.getState().connectComponent('del-child', 'del-parent');

      // Delete the parent
      useMockpitStore.getState().deleteComponent('del-parent');

      const comps = useMockpitStore.getState().componentsByScreen[screenId];
      assert.equal(comps.some((c) => c.id === 'del-parent'), false);

      const remainingChild = comps.find((c) => c.id === 'del-child')!;
      assert.equal(remainingChild.parentId, undefined);
      assert.equal(remainingChild.staticProps?.showHeader, 'true');
      assert.equal(remainingChild.borderOverrides?.bottom, true);
    });
  });

  describe('5. Format Attachment Position Labels', () => {
    it('Formats directional positions for UI display', () => {
      assert.equal(formatAttachmentPosition('top-left'), 'Top Left');
      assert.equal(formatAttachmentPosition('top'), 'Top');
      assert.equal(formatAttachmentPosition('center'), 'Center');
      assert.equal(formatAttachmentPosition('bottom-right'), 'Bottom Right');
    });
  });

  describe('6. Candidate Option Label Fallback Chain (Spec v1)', () => {
    const getCandidateLabel = (comp: ComponentInstance) => {
      return (
        comp.staticProps?.label?.trim() ||
        comp.staticProps?.title?.trim() ||
        COMPONENT_DISPLAY_NAMES[comp.type] ||
        comp.type
      );
    };

    it('Prefers staticProps.label over staticProps.title and default label', () => {
      const comp = createMockComponent('callout-1', 0, 0, 320, 160, {
        type: 'vehicleStatusCallout',
        staticProps: {
          label: 'Front Diagnostics Header',
          title: 'Powertrain Inverter',
        },
      });
      assert.equal(getCandidateLabel(comp), 'Front Diagnostics Header');
    });

    it('Falls back to staticProps.title when staticProps.label is absent, empty, or whitespace', () => {
      const comp1 = createMockComponent('callout-2', 0, 0, 320, 160, {
        type: 'vehicleStatusCallout',
        staticProps: {
          label: '',
          title: 'Powertrain Inverter',
        },
      });
      assert.equal(getCandidateLabel(comp1), 'Powertrain Inverter');

      const comp2 = createMockComponent('callout-3', 0, 0, 320, 160, {
        type: 'vehicleStatusCallout',
        staticProps: {
          label: '   ',
          title: 'Rear Battery Module',
        },
      });
      assert.equal(getCandidateLabel(comp2), 'Rear Battery Module');
    });

    it('Falls back to DEFAULT_COMPONENT_LABELS when both label and title are empty or missing', () => {
      const comp = createMockComponent('callout-4', 0, 0, 320, 160, {
        type: 'vehicleStatusCallout',
        staticProps: {
          label: '',
          title: '',
        },
      });
      assert.equal(getCandidateLabel(comp), 'Status Callout');
    });

    it('Distinguishes multiple instances of the same component type in candidate list', () => {
      const cand1 = createMockComponent('callout-a', 0, 0, 320, 160, {
        type: 'vehicleStatusCallout',
        staticProps: { label: 'Front Powertrain', title: 'Drive Unit' },
      });
      const cand2 = createMockComponent('callout-b', 0, 180, 320, 160, {
        type: 'vehicleStatusCallout',
        staticProps: { title: 'Rear Inverter' },
      });
      const cand3 = createMockComponent('callout-c', 0, 360, 320, 160, {
        type: 'vehicleStatusCallout',
        staticProps: {},
      });

      assert.equal(getCandidateLabel(cand1), 'Front Powertrain');
      assert.equal(getCandidateLabel(cand2), 'Rear Inverter');
      assert.equal(getCandidateLabel(cand3), 'Status Callout');
    });
  });

  describe('7. Selection Z-Index Capping, Counterpart Dimming, & Drag Transition (Spec v1)', () => {
    const computeEffectiveZ = (
      comp: ComponentInstance,
      allComps: ComponentInstance[],
      selectedId: string | null
    ) => {
      const rawZ = comp.zIndex !== undefined ? comp.zIndex : (comp.type === 'map' ? 0 : comp.type === 'nowPlaying' ? 20 : 10);
      const parentComp = comp.parentId ? allComps.find((c) => c.id === comp.parentId) : null;
      const parentZ = parentComp ? (parentComp.zIndex !== undefined ? parentComp.zIndex : (parentComp.type === 'map' ? 0 : parentComp.type === 'nowPlaying' ? 20 : 10)) : -999;
      const baseZ = parentComp ? Math.max(rawZ, parentZ + 1) : rawZ;

      let effectiveZ = baseZ;
      const isSelected = comp.id === selectedId;
      if (isSelected) {
        const ownChildrenBaseZs = allComps
          .filter((c) => c.parentId === comp.id)
          .map((c) => {
            const childRawZ = c.zIndex !== undefined ? c.zIndex : (c.type === 'map' ? 0 : c.type === 'nowPlaying' ? 20 : 10);
            return Math.max(childRawZ, baseZ + 1);
          });

        const boosted = baseZ + 100;
        effectiveZ = ownChildrenBaseZs.length
          ? Math.min(boosted, Math.min(...ownChildrenBaseZs) - 1)
          : boosted;
      }
      return effectiveZ;
    };

    const computeOpacity = (
      compId: string,
      allComps: ComponentInstance[],
      selectedId: string | null
    ) => {
      const selectedComp = selectedId ? allComps.find((c) => c.id === selectedId) : null;
      const connectedCounterpartIds = new Set<string>();
      if (selectedComp?.parentId) connectedCounterpartIds.add(selectedComp.parentId);
      allComps.forEach((c) => {
        if (c.parentId === selectedId) connectedCounterpartIds.add(c.id);
      });
      return connectedCounterpartIds.has(compId) ? 0.4 : 1;
    };

    const isTransitionNone = (
      compId: string,
      allComps: ComponentInstance[],
      dragInfoId: string | null
    ) => {
      const draggedComp = dragInfoId ? allComps.find((c) => c.id === dragInfoId) : null;
      const isCounterpartOfActiveDrag = Boolean(
        draggedComp &&
        (compId === draggedComp.parentId || allComps.find((c) => c.id === compId)?.parentId === dragInfoId)
      );
      return dragInfoId === compId || isCounterpartOfActiveDrag;
    };

    it('When parent is selected, effectiveZ never inverts child-above-parent invariant', () => {
      const parent = createMockComponent('map-parent', 0, 0, 600, 400, { type: 'map' });
      const child = createMockComponent('search-child', 20, 20, 200, 60, {
        type: 'navSearch',
        parentId: 'map-parent',
      });
      const comps = [parent, child];

      const parentZ = computeEffectiveZ(parent, comps, 'map-parent');
      const childZ = computeEffectiveZ(child, comps, 'map-parent');

      // Parent boost is capped so child remains strictly on top
      assert.ok(childZ > parentZ, `Child z (${childZ}) must be greater than parent z (${parentZ})`);
    });

    it('When child is selected, child gets full boost and stays above parent', () => {
      const parent = createMockComponent('map-parent', 0, 0, 600, 400, { type: 'map' });
      const child = createMockComponent('search-child', 20, 20, 200, 60, {
        type: 'navSearch',
        parentId: 'map-parent',
      });
      const comps = [parent, child];

      const parentZ = computeEffectiveZ(parent, comps, 'search-child');
      const childZ = computeEffectiveZ(child, comps, 'search-child');

      assert.ok(childZ > parentZ, `Child z (${childZ}) must be greater than parent z (${parentZ})`);
      assert.equal(childZ, 110, 'Child gets baseZ (10) + 100 = 110');
      assert.equal(parentZ, 0, 'Parent stays at baseZ = 0');
    });

    it('Dims connected counterpart to 0.4 while selected component remains 1.0', () => {
      const parent = createMockComponent('map-parent', 0, 0, 600, 400, { type: 'map' });
      const child = createMockComponent('search-child', 20, 20, 200, 60, {
        type: 'navSearch',
        parentId: 'map-parent',
      });
      const unrelated = createMockComponent('speed-other', 700, 0, 200, 200, { type: 'speed' });
      const comps = [parent, child, unrelated];

      // State 1: Parent selected
      assert.equal(computeOpacity('map-parent', comps, 'map-parent'), 1.0);
      assert.equal(computeOpacity('search-child', comps, 'map-parent'), 0.4);
      assert.equal(computeOpacity('speed-other', comps, 'map-parent'), 1.0);

      // State 2: Child selected
      assert.equal(computeOpacity('map-parent', comps, 'search-child'), 0.4);
      assert.equal(computeOpacity('search-child', comps, 'search-child'), 1.0);
      assert.equal(computeOpacity('speed-other', comps, 'search-child'), 1.0);

      // State 3: Deselected
      assert.equal(computeOpacity('map-parent', comps, null), 1.0);
      assert.equal(computeOpacity('search-child', comps, null), 1.0);
      assert.equal(computeOpacity('speed-other', comps, null), 1.0);
    });

    it('Disables transitions (transition-none) for both dragged component and its counterpart', () => {
      const parent = createMockComponent('map-parent', 0, 0, 600, 400, { type: 'map' });
      const child = createMockComponent('search-child', 20, 20, 200, 60, {
        type: 'navSearch',
        parentId: 'map-parent',
      });
      const unrelated = createMockComponent('speed-other', 700, 0, 200, 200, { type: 'speed' });
      const comps = [parent, child, unrelated];

      // Dragging parent: both parent and child get transition-none; unrelated does not
      assert.equal(isTransitionNone('map-parent', comps, 'map-parent'), true);
      assert.equal(isTransitionNone('search-child', comps, 'map-parent'), true);
      assert.equal(isTransitionNone('speed-other', comps, 'map-parent'), false);

      // Dragging child: both child and parent get transition-none
      assert.equal(isTransitionNone('search-child', comps, 'search-child'), true);
      assert.equal(isTransitionNone('map-parent', comps, 'search-child'), true);
    });
  });

  describe('8. Connected Components: Parent Border 100% Visible & Inside Snap (Spec v1)', () => {
    it('getComponentBorderWidthPx returns 2 for warning toast and 1 for others', () => {
      const warningComp = createMockComponent('warn-1', 0, 0, 300, 100, { type: 'warning' });
      const speedComp = createMockComponent('speed-1', 0, 0, 400, 400, { type: 'speed' });
      const cruiseComp = createMockComponent('cruise-1', 0, 0, 200, 150, { type: 'cruiseControl' });

      assert.equal(getComponentBorderWidthPx(warningComp), 2);
      assert.equal(getComponentBorderWidthPx(speedComp), 1);
      assert.equal(getComponentBorderWidthPx(cruiseComp), 1);
    });

    it('snapChildInsideParent clamps child bounds inside parent inner border box', () => {
      // Parent: 400x300 at (100, 100), bw = 1. Inner box: x=101, y=101, w=398, h=298.
      const parent = createMockComponent('speed-parent', 100, 100, 400, 300, { type: 'speed' });

      // Child positioned partially overshooting left/top edges
      const childOvershootTopLeft = createMockComponent('child-tl', 90, 95, 150, 100);
      const snappedTL = snapChildInsideParent(childOvershootTopLeft, parent);
      assert.equal(snappedTL.x, 101, 'Child left clamped to innerX (101)');
      assert.equal(snappedTL.y, 101, 'Child top clamped to innerY (101)');
      assert.equal(snappedTL.width, 150);
      assert.equal(snappedTL.height, 100);

      // Child positioned overshooting right/bottom edges
      const childOvershootBottomRight = createMockComponent('child-br', 400, 350, 150, 100);
      const snappedBR = snapChildInsideParent(childOvershootBottomRight, parent);
      // Max X = innerX + innerWidth - width = 101 + 398 - 150 = 349
      // Max Y = innerY + innerHeight - height = 101 + 298 - 100 = 299
      assert.equal(snappedBR.x, 349, 'Child right clamped to inner border edge');
      assert.equal(snappedBR.y, 299, 'Child bottom clamped to inner border edge');
      assert.equal(snappedBR.x + snappedBR.width, parent.x + parent.width - 1);
      assert.equal(snappedBR.y + snappedBR.height, parent.y + parent.height - 1);
    });

    it('snapChildInsideParent shrinks child if child exceeds parent inner box dimensions', () => {
      // Parent: 300x200 at (50, 50), warning comp (bw = 2).
      // Inner box: x=52, y=52, w=296, h=196.
      const parent = createMockComponent('warn-parent', 50, 50, 300, 200, { type: 'warning' });
      const childOversized = createMockComponent('oversized-child', 40, 40, 350, 250);

      const snapped = snapChildInsideParent(childOversized, parent);
      assert.equal(snapped.width, 296, 'Child width shrunk to fit innerWidth');
      assert.equal(snapped.height, 196, 'Child height shrunk to fit innerHeight');
      assert.equal(snapped.x, 52, 'Child x clamped to innerX');
      assert.equal(snapped.y, 52, 'Child y clamped to innerY');
    });

    it('connectComponent with inside style snaps child bounds, turns off child borders, and leaves parent border untouched', () => {
      const state = useMockpitStore.getState();
      const screenId = state.activeView;

      // Speedometer parent: 400x400 at (100, 100)
      const parent = createMockComponent('speedo-parent', 100, 100, 400, 400, {
        type: 'speed',
        borderOverrides: { top: true, right: true, bottom: true, left: true },
      });
      // Cruise child: 180x180 at (100, 100) (inside overlap area = 100% >= 90%, overshoots parent border by 1px on left and top)
      const child = createMockComponent('cruise-child', 100, 100, 180, 180, {
        type: 'cruiseControl',
        staticProps: { showHeader: 'true' },
        borderOverrides: { top: true, right: true, bottom: true, left: true },
      });

      useMockpitStore.setState({
        componentsByScreen: {
          ...state.componentsByScreen,
          [screenId]: [parent, child],
        },
        components: [parent, child],
      });

      // Connect
      useMockpitStore.getState().connectComponent('cruise-child', 'speedo-parent');

      const comps = useMockpitStore.getState().componentsByScreen[screenId];
      const updatedChild = comps.find((c) => c.id === 'cruise-child')!;
      const updatedParent = comps.find((c) => c.id === 'speedo-parent')!;

      // 1. Child integration metadata
      assert.equal(updatedChild.parentId, 'speedo-parent');
      assert.equal(updatedChild.integrationStyle, 'inside');

      // 2. Child bounds snapped to inner box (x: 101, y: 101)
      assert.equal(updatedChild.x, 101);
      assert.equal(updatedChild.y, 101);
      assert.equal(updatedChild.width, 180);
      assert.equal(updatedChild.height, 180);

      // 3. Child borders all turned off
      assert.deepEqual(updatedChild.borderOverrides, {
        top: false,
        right: false,
        bottom: false,
        left: false,
      });

      // 4. Parent borders are NOT altered (all borders remain true, 100% visible)
      assert.deepEqual(updatedParent.borderOverrides, {
        top: true,
        right: true,
        bottom: true,
        left: true,
      });
    });

    it('Canvas wrapper sets data-integrated-child="inside" for inside children, and CSS overrides child surface', async () => {
      const fs = await import('fs');
      const canvasCode = fs.readFileSync('src/components/Canvas.tsx', 'utf8');
      const indexCss = fs.readFileSync('src/index.css', 'utf8');

      // Canvas.tsx has data-integrated-child on both presenter and editor wrappers
      assert.match(
        canvasCode,
        /data-integrated-child=\{comp\.parentId && comp\.integrationStyle === 'inside' \? 'inside' : undefined\}/,
        'Canvas must apply data-integrated-child="inside" attribute'
      );

      // index.css has single rule targeting [data-integrated-child="inside"] > :first-child
      assert.match(
        indexCss,
        /\[data-integrated-child="inside"\]\s*>\s*:first-child/,
        'index.css must define rule for [data-integrated-child="inside"] > :first-child'
      );
      assert.match(
        indexCss,
        /background:\s*transparent\s*!important/,
        'CSS rule must set background: transparent !important'
      );
      assert.match(
        indexCss,
        /backdrop-filter:\s*none\s*!important/,
        'CSS rule must set backdrop-filter: none !important'
      );
      assert.match(
        indexCss,
        /-webkit-backdrop-filter:\s*none\s*!important/,
        'CSS rule must set -webkit-backdrop-filter: none !important'
      );
      assert.match(
        indexCss,
        /box-shadow:\s*none\s*!important/,
        'CSS rule must set box-shadow: none !important'
      );

      // Must NOT contain broad selector > * or > .pointer-events-none
      assert.equal(
        /\[data-integrated-child="inside"\]\s*>\s*\*/.test(indexCss),
        false,
        'index.css must not have broad [data-integrated-child="inside"] > * selector'
      );
      assert.equal(
        /\[data-integrated-child="inside"\]\s*>\s*\.pointer-events-none/.test(indexCss),
        false,
        'index.css must not have [data-integrated-child="inside"] > .pointer-events-none selector'
      );
    });
  });
});
