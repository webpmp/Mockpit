import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getBundledExampleConfiguration } from '../../utils/configManagement';
import {
  DEFAULT_BEFORE_IMAGE_URL,
  DEFAULT_EXPLODED_IMAGE_URL,
  getBeforeImageSrc,
  getExplodedImageSrc,
  isExplodedViewActive,
  EXPLODE_TRANSITION_MS,
} from '../../utils/explodedViewImages';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ComponentInstance } from '../../types';

// Ensure localStorage is available for store actions in Node test runner
if (typeof globalThis.localStorage === 'undefined') {
  const memStore = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => memStore.get(key) ?? null,
    setItem: (key: string, val: string) => { memStore.set(key, val); },
    removeItem: (key: string) => { memStore.delete(key); },
    clear: () => { memStore.clear(); },
    key: (i: number) => Array.from(memStore.keys())[i] ?? null,
    length: 0,
  } as any;
}

describe('Exploded View Chassis Spec v1.1 - Before / Exploded States Suite', () => {
  const config = getBundledExampleConfiguration();
  const screenComponents = config.workspace.componentsByScreen['screen_1786948329661'] || [];
  const explodedComp = screenComponents.find(c => c.id === 'comp-vehicleExplodedView-msxk3mbe');

  it('1. Example workspace exploded view component migration and image source resolution', () => {
    assert.ok(explodedComp, 'Vehicle exploded view component must exist on screen_1786948329661');
    assert.equal(explodedComp.staticProps?.imageUrl, '', 'imageUrl must be migrated to empty string');
    assert.equal(
      getBeforeImageSrc(explodedComp),
      DEFAULT_BEFORE_IMAGE_URL,
      'getBeforeImageSrc must resolve to DEFAULT_BEFORE_IMAGE_URL when imageUrl is empty'
    );
    assert.equal(
      getExplodedImageSrc(explodedComp),
      DEFAULT_EXPLODED_IMAGE_URL,
      'getExplodedImageSrc must resolve to DEFAULT_EXPLODED_IMAGE_URL'
    );
    assert.equal(explodedComp.staticProps?.bgTolerance, '14', 'bgTolerance must remain 14');
    assert.equal(explodedComp.staticProps?.bgEdgeSoftness, '43', 'bgEdgeSoftness must remain 43');
    assert.equal(explodedComp.staticProps?.removeBg, 'true', 'removeBg must remain true');
    assert.equal(explodedComp.staticProps?.backgroundColor, '#cccccc', 'backgroundColor must remain #cccccc');
  });

  it('2. Exactly 7 callouts target the exploded view with preserved targetX/targetY coordinates', () => {
    assert.ok(explodedComp);
    const targetingCallouts = screenComponents.filter(
      c => c.type === 'vehicleStatusCallout' && c.connector?.targetComponentId === explodedComp.id
    );
    assert.equal(targetingCallouts.length, 7, 'Must have exactly 7 callouts targeting the exploded view');

    const expectedTargets = [
      { id: 'comp-vehicleStatusCallout-msxk9745', x: 0.3435, y: 0.6999 },
      { id: 'comp-vehicleStatusCallout-msxl8bjq', x: 0.4502, y: 0.2016 },
      { id: 'comp-vehicleStatusCallout-msxlvmo0', x: 0.8541, y: 0.6794 },
      { id: 'comp-vehicleStatusCallout-msxlxb93', x: 0.4150, y: 0.8207 },
      { id: 'comp-vehicleStatusCallout-msxn46a3', x: 0.0823, y: 0.5250 },
      { id: 'comp-vehicleStatusCallout-msxn7h90', x: 0.5915, y: 0.6978 },
      { id: 'comp-vehicleStatusCallout-msxo6giy', x: 0.0999, y: 0.7374 },
    ];

    for (const expected of expectedTargets) {
      const callout = targetingCallouts.find(c => c.id === expected.id);
      assert.ok(callout, `Callout ${expected.id} must target the exploded view`);
      assert.ok(callout.connector, 'Callout must have connector config');
      assert.ok(
        Math.abs(callout.connector.targetX - expected.x) < 0.005,
        `targetX for ${expected.id} expected ${expected.x}, got ${callout.connector.targetX}`
      );
      assert.ok(
        Math.abs(callout.connector.targetY - expected.y) < 0.005,
        `targetY for ${expected.id} expected ${expected.y}, got ${callout.connector.targetY}`
      );
    }
  });

  it('3. showExploded derivation in Presenter/Participant vs Editor modes', () => {
    assert.ok(explodedComp);
    const beforeSrc = getBeforeImageSrc(explodedComp);
    assert.ok(beforeSrc !== null, 'Before source exists for default pair');

    // Case 1: Presenter/Participant mode with no active callout -> false
    const activeCalloutId = null;
    const isPresentation = true;
    const isExplodedActive = isExplodedViewActive(explodedComp.id, activeCalloutId, screenComponents);
    const showExplodedPresenterNoActive = !beforeSrc || (isPresentation ? isExplodedActive : explodedComp.staticProps?.editorPreview !== 'before');
    assert.equal(showExplodedPresenterNoActive, false, 'showExploded must be false when no callout is active in presentation');

    // Case 2: Presenter/Participant mode with active connected callout -> true
    const activeCalloutIdConnected = 'comp-vehicleStatusCallout-msxk9745';
    const isExplodedActiveConnected = isExplodedViewActive(explodedComp.id, activeCalloutIdConnected, screenComponents);
    assert.equal(isExplodedActiveConnected, true, 'isExplodedViewActive must return true for connected callout');
    const showExplodedPresenterActive = !beforeSrc || (isPresentation ? isExplodedActiveConnected : explodedComp.staticProps?.editorPreview !== 'before');
    assert.equal(showExplodedPresenterActive, true, 'showExploded must be true when connected callout is active in presentation');

    // Case 3: Editor mode with editorPreview === "exploded" (default) -> true
    const isPresentationEditor = false;
    const showExplodedEditorDefault = !beforeSrc || (isPresentationEditor ? false : explodedComp.staticProps?.editorPreview !== 'before');
    assert.equal(showExplodedEditorDefault, true, 'showExploded must be true in editor when editorPreview is not "before"');

    // Case 4: Editor mode with editorPreview === "before" -> false
    const compWithBeforePreview: ComponentInstance = {
      ...explodedComp,
      staticProps: {
        ...explodedComp.staticProps,
        editorPreview: 'before',
      },
    };
    const showExplodedEditorBefore = !beforeSrc || (isPresentationEditor ? false : compWithBeforePreview.staticProps?.editorPreview !== 'before');
    assert.equal(showExplodedEditorBefore, false, 'showExploded must be false in editor when editorPreview is "before"');
  });

  it('4. Custom upload without before image yields getBeforeImageSrc === null and always shows exploded view', () => {
    const customComp: ComponentInstance = {
      id: 'custom-exploded-1',
      type: 'vehicleExplodedView',
      x: 0,
      y: 0,
      width: 1000,
      height: 650,
      staticProps: {
        imageUrl: 'https://example.com/my-chassis.png',
        beforeImageUrl: '',
      },
      bindings: [],
    };

    assert.equal(getBeforeImageSrc(customComp), null, 'getBeforeImageSrc must return null when custom imageUrl exists but no beforeImageUrl');
    assert.equal(getExplodedImageSrc(customComp), 'https://example.com/my-chassis.png');

    // Rule 2: Without before image, showExploded is always true
    const beforeSrc = getBeforeImageSrc(customComp);
    const showExploded = !beforeSrc || false;
    assert.equal(showExploded, true, 'Without before image, showExploded is always true');
  });

  it('5. Custom upload with custom before image yields custom before source', () => {
    const customPairComp: ComponentInstance = {
      id: 'custom-exploded-pair',
      type: 'vehicleExplodedView',
      x: 0,
      y: 0,
      width: 1000,
      height: 650,
      staticProps: {
        imageUrl: 'https://example.com/custom-after.png',
        beforeImageUrl: 'https://example.com/custom-before.png',
      },
      bindings: [],
    };

    assert.equal(getBeforeImageSrc(customPairComp), 'https://example.com/custom-before.png');
    assert.equal(getExplodedImageSrc(customPairComp), 'https://example.com/custom-after.png');
  });

  it('6. Resetting project to a new canvas resets exploded view properties to store defaults', () => {
    // Test store component creation defaults for vehicleExplodedView
    const store = useMockpitStore.getState();
    const newCompId = store.addComponent('vehicleExplodedView', 100, 100);
    assert.ok(newCompId);
    const currentScreen = useMockpitStore.getState().activeView;
    const newComp = useMockpitStore.getState().componentsByScreen[currentScreen]?.find(c => c.id === newCompId);
    assert.ok(newComp);
    assert.equal(newComp.type, 'vehicleExplodedView');
    assert.equal(newComp.staticProps?.imageUrl, '');
    assert.equal(newComp.staticProps?.beforeImageUrl, '');
    assert.equal(newComp.staticProps?.beforeRemoveBg, 'true');
    assert.equal(newComp.staticProps?.beforeBgTolerance, '25');
    assert.equal(newComp.staticProps?.beforeBgEdgeSoftness, '0');
    assert.equal(newComp.staticProps?.editorPreview, 'exploded');
    assert.equal(getExplodedImageSrc(newComp), DEFAULT_EXPLODED_IMAGE_URL);
    assert.equal(getBeforeImageSrc(newComp), DEFAULT_BEFORE_IMAGE_URL);

    // Clean up component
    store.deleteComponent(newCompId);
  });

  it('7. toggleCalloutSelection deselects on second tap and computes connectorLeadDelayMs', () => {
    const store = useMockpitStore.getState();
    assert.ok(explodedComp);

    // Initial state: no active presentation callout
    store.setActivePresentationCalloutId(null);
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, null);

    const callout1Id = 'comp-vehicleStatusCallout-msxk9745';
    const callout2Id = 'comp-vehicleStatusCallout-msxl8bjq';

    // Tap Callout 1 (from deselected state)
    store.toggleCalloutSelection(callout1Id, screenComponents);
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, callout1Id);
    assert.equal(useMockpitStore.getState().connectorLeadDelayMs, EXPLODE_TRANSITION_MS);

    // Tap Callout 2 (from active Callout 1 -> switching active callouts)
    store.toggleCalloutSelection(callout2Id, screenComponents);
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, callout2Id);
    assert.equal(useMockpitStore.getState().connectorLeadDelayMs, 0, 'Switching between callouts has 0 lead delay');

    // Tap Callout 2 a second time -> deselects
    store.toggleCalloutSelection(callout2Id, screenComponents);
    assert.equal(useMockpitStore.getState().activePresentationCalloutId, null, 'Second tap deselects active callout');
    assert.equal(useMockpitStore.getState().connectorLeadDelayMs, 0);
  });
});
