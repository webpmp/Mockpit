import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkIntegrationEligibility,
  computeInsideAttachmentPosition,
  getEligibleParentCandidates,
  formatAttachmentPosition,
} from '../../utils/componentIntegration';
import { getBorderClasses, DEFAULT_BORDER_OVERRIDES } from '../../utils/borderOverrides';
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
      assert.equal(getBorderClasses(undefined), 'border border-slate-800');
      assert.equal(getBorderClasses(null), 'border border-slate-800');
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
      assert.match(classes, /border-slate-800/);
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
});
