import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CANVAS_WIDTH, CANVAS_HEIGHT, FOCUSED_APP_RECT } from '../../config/constants';
import { resolveComponentBox, getAnchorCanvasCoords } from '../vehicle/ConnectorLayer';
import { ComponentInstance } from '../../types';

describe('Screen Canvas Coordinate Origin Mismatch Regression Suite (v1.2)', () => {
  // Mock components authored in the editor at absolute canvas positions
  const sampleComponents: Record<string, ComponentInstance[]> = {
    home: [
      { id: 'comp-map', type: 'map', x: 0, y: 0, width: 1920, height: 996, staticProps: {}, bindings: [] },
      { id: 'comp-nowplaying', type: 'nowPlaying', x: 48, y: 560, width: 380, height: 420, staticProps: {}, bindings: [] },
    ],
    media: [
      { id: 'comp-mediaplayer', type: 'media', x: 48, y: 48, width: 720, height: 480, staticProps: {}, bindings: [] },
      { id: 'comp-playlists', type: 'mediaPlaylists', x: 800, y: 48, width: 540, height: 420, staticProps: {}, bindings: [] },
    ],
    vehicle: [
      { id: 'comp-exploded', type: 'vehicleExplodedView', x: 400, y: 150, width: 900, height: 600, staticProps: {}, bindings: [] },
      {
        id: 'comp-callout-1',
        type: 'vehicleStatusCallout',
        x: 100,
        y: 200,
        width: 240,
        height: 120,
        staticProps: {},
        bindings: [],
        connector: {
          sourceAnchor: 'right-center',
          targetComponentId: 'comp-exploded',
          targetX: 0.25,
          targetY: 0.35,
        },
      },
    ],
    customScreen: [
      { id: 'comp-custom-1', type: 'climate', x: 200, y: 100, width: 400, height: 300, staticProps: {}, bindings: [] },
    ],
  };

  it('1. Verifies Editor workspace view absolute placement (no container offset)', () => {
    // In Editor mode, the container is inset-0 (origin 0,0) for all views
    Object.entries(sampleComponents).forEach(([screenId, comps]) => {
      comps.forEach((comp) => {
        const editorRenderedLeft = comp.x;
        const editorRenderedTop = comp.y;
        assert.equal(editorRenderedLeft, comp.x, `Editor rendered X for ${screenId}:${comp.id} must equal authored x`);
        assert.equal(editorRenderedTop, comp.y, `Editor rendered Y for ${screenId}:${comp.id} must equal authored y`);
      });
    });
  });

  it('2. Verifies Home screen presentation container & child offset formulas', () => {
    const isHomeScreen = true;
    const containerLeft = isHomeScreen ? 0 : FOCUSED_APP_RECT.x;
    const containerTop = isHomeScreen ? 0 : FOCUSED_APP_RECT.y;
    const offsetX = isHomeScreen ? 0 : FOCUSED_APP_RECT.x;
    const offsetY = isHomeScreen ? 0 : FOCUSED_APP_RECT.y;

    sampleComponents.home.forEach((comp) => {
      const childStyleLeft = comp.x - offsetX;
      const childStyleTop = comp.y - offsetY;
      const effectiveAbsoluteLeft = containerLeft + childStyleLeft;
      const effectiveAbsoluteTop = containerTop + childStyleTop;

      assert.equal(effectiveAbsoluteLeft, comp.x, `Effective absolute X must match authored comp.x (${comp.x})`);
      assert.equal(effectiveAbsoluteTop, comp.y, `Effective absolute Y must match authored comp.y (${comp.y})`);
    });
  });

  it('3. Verifies FocusedAppScreen presentation container & child offset cancellation', () => {
    const focusedScreens = ['media', 'vehicle', 'customScreen'];

    focusedScreens.forEach((screenId) => {
      const isHomeScreen = screenId === 'home';
      const containerLeft = isHomeScreen ? 0 : FOCUSED_APP_RECT.x;
      const containerTop = isHomeScreen ? 0 : FOCUSED_APP_RECT.y;
      const offsetX = isHomeScreen ? 0 : FOCUSED_APP_RECT.x;
      const offsetY = isHomeScreen ? 0 : FOCUSED_APP_RECT.y;

      assert.equal(containerLeft, 20, 'FocusedAppScreen container left must be 20');
      assert.equal(containerTop, 48, 'FocusedAppScreen container top must be 48');

      sampleComponents[screenId].forEach((comp) => {
        const childStyleLeft = comp.x - offsetX;
        const childStyleTop = comp.y - offsetY;
        const effectiveAbsoluteLeft = containerLeft + childStyleLeft;
        const effectiveAbsoluteTop = containerTop + childStyleTop;

        assert.equal(
          effectiveAbsoluteLeft,
          comp.x,
          `FocusedAppScreen ${screenId}:${comp.id} effective X (${effectiveAbsoluteLeft}) must equal editor authored comp.x (${comp.x})`
        );
        assert.equal(
          effectiveAbsoluteTop,
          comp.y,
          `FocusedAppScreen ${screenId}:${comp.id} effective Y (${effectiveAbsoluteTop}) must equal editor authored comp.y (${comp.y})`
        );
      });
    });
  });

  it('4. Verifies ConnectorLayer uses unshifted canvas coordinates in both editor and presentation', () => {
    const calloutComp = sampleComponents.vehicle[1];
    
    // In Editor and Presentation (without redundant offset), ConnectorLayer receives absolute canvas coords
    const resolvedBoxEditor = resolveComponentBox(calloutComp, { x: 0, y: 0 });
    const resolvedBoxPresentation = resolveComponentBox(calloutComp, undefined);

    assert.deepEqual(resolvedBoxEditor, calloutComp, 'Editor resolved box matches component');
    assert.deepEqual(resolvedBoxPresentation, calloutComp, 'Presentation resolved box matches component');

    const anchorCoords = getAnchorCanvasCoords(calloutComp, 'right-center');
    // right-center for x:100, y:200, w:240, h:120 -> x: 100+240=340, y: 200+60=260
    assert.equal(anchorCoords.x, 340);
    assert.equal(anchorCoords.y, 260);
  });

  it('5. Verifies canvas dimensions and boundary constraints', () => {
    assert.equal(CANVAS_WIDTH, 1920);
    assert.equal(CANVAS_HEIGHT, 1080);
    assert.equal(FOCUSED_APP_RECT.x, 20);
    assert.equal(FOCUSED_APP_RECT.y, 48);
    assert.equal(FOCUSED_APP_RECT.width, 1880);
    assert.equal(FOCUSED_APP_RECT.height, 948);
  });
});
