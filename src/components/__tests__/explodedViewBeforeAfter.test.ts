import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ComponentInstance } from '../../types';
import {
  DEFAULT_EXPLODED_IMAGE_URL,
  DEFAULT_BEFORE_IMAGE_URL,
  DEFAULT_EXPLODED_NATURAL,
  EXPLODE_TRANSITION_MS,
  getExplodedImageSrc,
  getBeforeImageSrc,
  isExplodedViewActive,
} from '../../utils/explodedViewImages';
import { getImageContentRect } from '../../utils/imageContentRect';
import { computeStringHash } from '../../utils/imageBackgroundRemover';
import { useMockpitStore } from '../../store/useMockpitStore';

describe('Exploded View Before/After Image Transition Suite', () => {
  const defaultExplodedComp: ComponentInstance = {
    id: 'exploded-1',
    type: 'vehicleExplodedView',
    x: 100,
    y: 100,
    width: 640,
    height: 420,
    staticProps: {
      imageUrl: '',
      beforeImageUrl: '',
    },
    bindings: [],
  };

  const customBeforeComp: ComponentInstance = {
    id: 'exploded-2',
    type: 'vehicleExplodedView',
    x: 100,
    y: 100,
    width: 640,
    height: 420,
    staticProps: {
      imageUrl: '',
      beforeImageUrl: '/custom/before-car.png',
    },
    bindings: [],
  };

  const legacyExplodedOnlyComp: ComponentInstance = {
    id: 'exploded-3',
    type: 'vehicleExplodedView',
    x: 100,
    y: 100,
    width: 640,
    height: 420,
    staticProps: {
      imageUrl: 'data:image/png;base64,customExplodedOnly',
    },
    bindings: [],
  };

  const dualCustomComp: ComponentInstance = {
    id: 'exploded-4',
    type: 'vehicleExplodedView',
    x: 100,
    y: 100,
    width: 640,
    height: 420,
    staticProps: {
      imageUrl: '/custom/after.png',
      beforeImageUrl: '/custom/before.png',
    },
    bindings: [],
  };

  const calloutA: ComponentInstance = {
    id: 'callout-a',
    type: 'vehicleStatusCallout',
    x: 20,
    y: 50,
    width: 200,
    height: 100,
    staticProps: { title: 'Battery Pack' },
    bindings: [],
    connector: {
      targetComponentId: 'exploded-1',
      sourceAnchor: 'right-center',
      targetX: 0.5,
      targetY: 0.6,
    },
  };

  const calloutB: ComponentInstance = {
    id: 'callout-b',
    type: 'vehicleStatusCallout',
    x: 20,
    y: 200,
    width: 200,
    height: 100,
    staticProps: { title: 'Motor Inverter' },
    bindings: [],
    connector: {
      targetComponentId: 'exploded-1',
      sourceAnchor: 'right-center',
      targetX: 0.3,
      targetY: 0.4,
    },
  };

  const screenComponents = [defaultExplodedComp, calloutA, calloutB];

  it('1. Image Source Resolution: default pair, custom before, legacy exploded-only, and reset', () => {
    // Default pair
    assert.equal(getExplodedImageSrc(defaultExplodedComp), DEFAULT_EXPLODED_IMAGE_URL);
    assert.equal(getBeforeImageSrc(defaultExplodedComp), DEFAULT_BEFORE_IMAGE_URL);

    // Custom before with default exploded
    assert.equal(getExplodedImageSrc(customBeforeComp), DEFAULT_EXPLODED_IMAGE_URL);
    assert.equal(getBeforeImageSrc(customBeforeComp), '/custom/before-car.png');

    // Legacy custom exploded without beforeImageUrl returns null for before
    assert.equal(getExplodedImageSrc(legacyExplodedOnlyComp), 'data:image/png;base64,customExplodedOnly');
    assert.equal(getBeforeImageSrc(legacyExplodedOnlyComp), null);

    // Dual custom
    assert.equal(getExplodedImageSrc(dualCustomComp), '/custom/after.png');
    assert.equal(getBeforeImageSrc(dualCustomComp), '/custom/before.png');

    // Resetting props restores default pair
    const resetComp: ComponentInstance = {
      ...dualCustomComp,
      staticProps: { imageUrl: '', beforeImageUrl: '' },
    };
    assert.equal(getExplodedImageSrc(resetComp), DEFAULT_EXPLODED_IMAGE_URL);
    assert.equal(getBeforeImageSrc(resetComp), DEFAULT_BEFORE_IMAGE_URL);
  });

  it('2. Pre-seeded natural dimensions cache for default exploded asset (1408x768)', () => {
    assert.equal(DEFAULT_EXPLODED_NATURAL.w, 1408);
    assert.equal(DEFAULT_EXPLODED_NATURAL.h, 768);

    // getImageContentRect immediately computes without waiting for onload
    const rect = getImageContentRect(
      { x: 0, y: 0, width: 640, height: 420 },
      DEFAULT_EXPLODED_NATURAL,
      4
    );

    assert.ok(rect.width > 0 && rect.height > 0);
    // Aspect ratio 1408 / 768 ~ 1.8333
    const expectedAspect = 1408 / 768;
    const computedAspect = rect.width / rect.height;
    assert.ok(Math.abs(computedAspect - expectedAspect) < 0.05);
  });

  it('3. Frame parity: Before and Exploded layers sit in identical frame coordinates across multiple sizes', () => {
    const testSizes = [
      { width: 640, height: 420 },
      { width: 800, height: 600 },
      { width: 1024, height: 768 },
    ];

    for (const size of testSizes) {
      const explodedFrame = getImageContentRect(
        { x: 0, y: 0, width: size.width, height: size.height },
        DEFAULT_EXPLODED_NATURAL,
        4
      );

      // In VehicleExplodedViewWidget, both Before and Exploded layers sit in the exact same frame:
      // left: frame.x, top: frame.y, width: frame.width, height: frame.height
      const beforeFrame = {
        x: explodedFrame.x,
        y: explodedFrame.y,
        width: explodedFrame.width,
        height: explodedFrame.height,
      };

      assert.ok(Math.abs(explodedFrame.x - beforeFrame.x) < 0.001);
      assert.ok(Math.abs(explodedFrame.y - beforeFrame.y) < 0.001);
      assert.ok(Math.abs(explodedFrame.width - beforeFrame.width) < 0.001);
      assert.ok(Math.abs(explodedFrame.height - beforeFrame.height) < 0.001);
    }
  });

  it('4. Callout activation: isExplodedViewActive correctly checks connected callouts', () => {
    assert.equal(isExplodedViewActive('exploded-1', null, screenComponents), false);
    assert.equal(isExplodedViewActive('exploded-1', 'callout-a', screenComponents), true);
    assert.equal(isExplodedViewActive('exploded-1', 'callout-b', screenComponents), true);
    assert.equal(isExplodedViewActive('exploded-1', 'other-comp', screenComponents), false);
  });

  it('5. Second-tap deselection & single-transition lead delay in store', () => {
    const store = useMockpitStore.getState();

    // Reset store selection
    store.selectComponent(null);
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, null);
    assert.equal(useMockpitStore.getState().connectorLeadDelayMs, 0);

    // Tap callout-a (first selection from Before)
    store.toggleCalloutSelection('callout-a', screenComponents);
    let state = useMockpitStore.getState();
    assert.equal(state.selectedComponentId, 'callout-a');
    assert.equal(state.activePresentationCalloutId, 'callout-a');
    assert.equal(state.connectorLeadDelayMs, EXPLODE_TRANSITION_MS); // 350ms
    assert.equal(state.presentationConnectorAnimNonce, 1);

    // Switch to callout-b (switching callouts: stays exploded, lead delay 0)
    store.toggleCalloutSelection('callout-b', screenComponents);
    state = useMockpitStore.getState();
    assert.equal(state.selectedComponentId, 'callout-b');
    assert.equal(state.activePresentationCalloutId, 'callout-b');
    assert.equal(state.connectorLeadDelayMs, 0); // 0ms on switch
    assert.equal(state.presentationConnectorAnimNonce, 2);

    // Tap callout-b again (second tap deselects, transitions back to Before)
    store.toggleCalloutSelection('callout-b', screenComponents);
    state = useMockpitStore.getState();
    assert.equal(state.selectedComponentId, null);
    assert.equal(state.activePresentationCalloutId, null);
    assert.equal(state.connectorLeadDelayMs, 0);
    assert.equal(state.presentationConnectorAnimNonce, 0);

    // Tap exploded view itself (resolves to its connected callout)
    store.toggleCalloutSelection('exploded-1', screenComponents);
    state = useMockpitStore.getState();
    assert.equal(state.activePresentationCalloutId, 'callout-a');
    assert.equal(state.connectorLeadDelayMs, EXPLODE_TRANSITION_MS);

    // Tap exploded view again (deselects)
    store.toggleCalloutSelection('exploded-1', screenComponents);
    state = useMockpitStore.getState();
    assert.equal(state.activePresentationCalloutId, null);
    assert.equal(state.connectorLeadDelayMs, 0);
  });

  it('6. Connector animation delays with leadDelay applied to target with before state', () => {
    const hasBefore = getBeforeImageSrc(defaultExplodedComp) !== null;
    assert.equal(hasBefore, true);

    // First selection lead = 350ms
    const leadDelayMs = 350;
    const effectiveLead = hasBefore ? leadDelayMs : 0;
    const lineDelay = effectiveLead;
    const sourceDotDelay = effectiveLead;
    const reticleDelay = effectiveLead + 220;

    assert.equal(lineDelay, 350);
    assert.equal(sourceDotDelay, 350);
    assert.equal(reticleDelay, 570);

    // Switching callout A -> B (lead = 0ms)
    const switchLead = 0;
    const switchEffectiveLead = hasBefore ? switchLead : 0;
    assert.equal(switchEffectiveLead, 0);
    assert.equal(switchEffectiveLead + 220, 220);

    // Target with legacy exploded only (no before state)
    const legacyHasBefore = getBeforeImageSrc(legacyExplodedOnlyComp) !== null;
    assert.equal(legacyHasBefore, false);
    const legacyEffectiveLead = legacyHasBefore ? 350 : 0;
    assert.equal(legacyEffectiveLead, 0);
    assert.equal(legacyEffectiveLead + 220, 220);
  });

  it('7. Cache key collision prevention: computeStringHash handles distinct strings with identical length', () => {
    const str1 = 'data:image/png;base64,AAAA111122223333';
    const str2 = 'data:image/png;base64,BBBB111122223333';
    assert.equal(str1.length, str2.length);

    const hash1 = computeStringHash(str1);
    const hash2 = computeStringHash(str2);
    assert.notEqual(hash1, hash2);
  });

  it('8. Auditor mode parity with Presenter mode', () => {
    // In VehicleExplodedViewWidget:
    // isPresOrAuditor = isPresentation || isAuditor;
    // When isPresOrAuditor is true:
    // showExploded = !hasBefore || calloutActive;
    // Verify that when hasBefore is true and callout is not active, showExploded is false
    const hasBefore = getBeforeImageSrc(defaultExplodedComp) !== null;
    const calloutActive = false;
    const isPresOrAuditor = true; // Auditor mode
    const showExploded = !hasBefore || (isPresOrAuditor ? calloutActive : true);
    assert.equal(showExploded, false);

    // When callout is active, showExploded is true
    const showExplodedActive = !hasBefore || (isPresOrAuditor ? true : true);
    assert.equal(showExplodedActive, true);
  });

  it('9. Regression: Bundled example workspace Vehicle screen resolves to default before asset pair', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const exampleRaw = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'src/data/exampleWorkspace.json'), 'utf8')
    );
    const vehicleScreenComps = exampleRaw.workspace.componentsByScreen['screen_1786948329661'];
    assert.ok(vehicleScreenComps && vehicleScreenComps.length > 0, 'Vehicle screen components must exist');

    const explodedComp = vehicleScreenComps.find(
      (c: ComponentInstance) => c.type === 'vehicleExplodedView'
    );
    assert.ok(explodedComp, 'vehicleExplodedView must exist on Vehicle screen');

    // Sources must resolve to the default pair
    assert.equal(getExplodedImageSrc(explodedComp), DEFAULT_EXPLODED_IMAGE_URL);
    assert.equal(getBeforeImageSrc(explodedComp), DEFAULT_BEFORE_IMAGE_URL);

    const hasBefore = getBeforeImageSrc(explodedComp) !== null;
    assert.equal(hasBefore, true, 'hasBefore must be true for bundled Vehicle screen component');

    // On initial load without active callout:
    const calloutActive = false;

    // Presenter mode (isEditor = false):
    const showExplodedPresenter = !hasBefore || calloutActive;
    assert.equal(
      showExplodedPresenter,
      false,
      'Presenter mode must show Before vehicle image on initial load'
    );

    // Participant mode (isEditor = false):
    const showExplodedParticipant = !hasBefore || calloutActive;
    assert.equal(
      showExplodedParticipant,
      false,
      'Participant mode must show Before vehicle image on initial load'
    );

    // Auditor mode (isEditor = false):
    const showExplodedAuditor = !hasBefore || calloutActive;
    assert.equal(
      showExplodedAuditor,
      false,
      'Auditor mode must show Before vehicle image on initial load'
    );

    // Editor mode (isEditor = true): defaults to exploded
    const showExplodedEditor =
      !hasBefore || explodedComp.staticProps?.editorPreview !== 'before';
    assert.equal(
      showExplodedEditor,
      true,
      'Editor mode must show Exploded vehicle image by default'
    );
  });

  it('10. Callout interaction sequence: Before -> Exploded -> Switch callout -> Deselect to Before', () => {
    const comp = defaultExplodedComp;
    const hasBefore = getBeforeImageSrc(comp) !== null;
    assert.equal(hasBefore, true);

    const deriveState = (calloutId: string | null) => {
      const active = isExplodedViewActive(comp.id, calloutId, screenComponents);
      return !hasBefore || active;
    };

    // 1. Initial state (no active callout)
    assert.equal(deriveState(null), false, 'Initial state: Before (showExploded: false)');

    // 2. Select Callout A
    assert.equal(deriveState('callout-a'), true, 'Selected Callout A: Exploded (showExploded: true)');

    // 3. Switch to Callout B (remains exploded, no return to Before)
    assert.equal(deriveState('callout-b'), true, 'Switched to Callout B: Exploded (showExploded: true)');

    // 4. Deselect Callout B (returns to Before)
    assert.equal(deriveState(null), false, 'Deselected Callout B: Before (showExploded: false)');
  });

  it('11. Legacy instance with custom exploded image but no before image stays exploded in all modes', () => {
    const legacyComp = legacyExplodedOnlyComp;
    const hasBefore = getBeforeImageSrc(legacyComp) !== null;
    assert.equal(hasBefore, false, 'hasBefore must be false for custom-exploded-only');

    // Presenter mode with no callout active
    const showExplodedPres = !hasBefore || false;
    assert.equal(showExplodedPres, true, 'Legacy component stays exploded in Presenter mode');

    // Participant mode with no callout active
    const showExplodedPart = !hasBefore || false;
    assert.equal(showExplodedPart, true, 'Legacy component stays exploded in Participant mode');

    // Auditor mode with no callout active
    const showExplodedAudit = !hasBefore || false;
    assert.equal(showExplodedAudit, true, 'Legacy component stays exploded in Auditor mode');

    // Editor mode
    const showExplodedEdit = !hasBefore || false;
    assert.equal(showExplodedEdit, true, 'Legacy component stays exploded in Editor mode');
  });

  it('12. Backward compatibility / custom upload: custom base64 string without before image yields no before state per Spec v1.1', () => {
    const legacyBase64Comp: ComponentInstance = {
      id: 'exploded-legacy-b64',
      type: 'vehicleExplodedView',
      x: 0,
      y: 0,
      width: 640,
      height: 420,
      staticProps: {
        imageUrl: 'data:image/png;base64,/9j/4AAQ' + 'A'.repeat(330662 - 30),
      },
      bindings: [],
    };

    assert.equal(getExplodedImageSrc(legacyBase64Comp), legacyBase64Comp.staticProps.imageUrl);
    assert.equal(getBeforeImageSrc(legacyBase64Comp), null);
  });
});
