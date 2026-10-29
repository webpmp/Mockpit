import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ScreenDefinition } from '../../types';

describe('Layers Panel Screen Title Resolution Suite', () => {
  it('1. Verifies LayersPanel source file reads screens and derives user-provided screen title', () => {
    const layersPanelPath = path.resolve(process.cwd(), 'src/components/LayersPanel.tsx');
    const content = fs.readFileSync(layersPanelPath, 'utf8');

    assert.ok(
      content.includes('const screens = useMockpitStore((s) => s.screens);'),
      'LayersPanel must subscribe to screens from store'
    );
    assert.ok(
      content.includes('screens.find((s) => s.id === activeView)'),
      'LayersPanel must look up activeView in screens array'
    );
    assert.ok(
      !content.includes('{activeView} Screen'),
      'LayersPanel must not output raw activeView ID directly in screen title'
    );
  });

  it('2. Correctly formats screen display names for user-provided screen definitions', () => {
    const formatScreenTitle = (activeView: string, screens: ScreenDefinition[]) => {
      const activeScreen = screens.find((s) => s.id === activeView);
      const rawScreenName = activeScreen?.name?.trim() || activeView;
      return rawScreenName.toLowerCase().endsWith('screen')
        ? rawScreenName
        : `${rawScreenName} Screen`;
    };

    const screens: ScreenDefinition[] = [
      { id: 'screen_1787681189695', name: 'Climate', order: 0, transitionStyle: 'fade', parentId: null },
      { id: 'screen_1786948329661', name: 'Vehicle', order: 1, transitionStyle: 'fade', parentId: null },
      { id: 'screen_custom_1', name: 'Diagnostics', order: 2, transitionStyle: 'fade', parentId: null },
      { id: 'screen_custom_2', name: 'Diagnostics Screen', order: 3, transitionStyle: 'fade', parentId: null },
      { id: 'home', name: 'Home', order: 4, transitionStyle: 'fade', parentId: null },
    ];

    // Climate screen
    assert.equal(
      formatScreenTitle('screen_1787681189695', screens),
      'Climate Screen',
      'screen_1787681189695 should resolve to "Climate Screen"'
    );

    // Vehicle screen
    assert.equal(
      formatScreenTitle('screen_1786948329661', screens),
      'Vehicle Screen',
      'screen_1786948329661 should resolve to "Vehicle Screen"'
    );

    // New custom screen
    assert.equal(
      formatScreenTitle('screen_custom_1', screens),
      'Diagnostics Screen',
      'Custom screen named "Diagnostics" should resolve to "Diagnostics Screen"'
    );

    // Custom screen already ending with "Screen"
    assert.equal(
      formatScreenTitle('screen_custom_2', screens),
      'Diagnostics Screen',
      'Screen named "Diagnostics Screen" should not duplicate "Screen"'
    );

    // Home screen
    assert.equal(
      formatScreenTitle('home', screens),
      'Home Screen',
      'Home screen should resolve to "Home Screen"'
    );
  });
});
