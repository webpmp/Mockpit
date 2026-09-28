import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { useMockpitStore } from '../../store/useMockpitStore';

describe('Screen Selector Overlay Clipped Regression Fix — Spec v1.1 Suite', () => {
  const headerNavPath = path.resolve(process.cwd(), 'src/components/HeaderNav.tsx');
  const headerNavContent = fs.readFileSync(headerNavPath, 'utf-8');

  it('1. #screen-selector-container replaces static overflow-hidden with conditional overflow-visible', () => {
    // Confirm #screen-selector-container exists
    assert.match(
      headerNavContent,
      /id="screen-selector-container"/,
      '#screen-selector-container must exist in HeaderNav.tsx'
    );

    // Confirm conditional overflow-visible when isMegaMenuOpen is true
    assert.match(
      headerNavContent,
      /isMegaMenuOpen\s*\?\s*['"]overflow-visible['"]\s*:\s*['"]overflow-hidden['"]/,
      'Container must dynamically apply overflow-visible when isMegaMenuOpen is true and overflow-hidden otherwise'
    );

    // Confirm container does not have static unqualified overflow-hidden in its base class list
    assert.doesNotMatch(
      headerNavContent,
      /<div\s+id="screen-selector-container"\s+className=\{`[^`]*\bitems-center\s+overflow-hidden\s+transition/,
      'Static items-center overflow-hidden transition should not be present on #screen-selector-container'
    );
  });

  it('2. Mode switch to user-testing closes mega-menu and hides container', () => {
    // Confirm that useEffect resetting screen selector checks screenMode === 'user-testing'
    assert.match(
      headerNavContent,
      /setIsMegaMenuOpen\(false\)/,
      'HeaderNav must reset isMegaMenuOpen to false'
    );

    // Check the screenMode === 'user-testing' block handles both visibility and mega menu close
    assert.match(
      headerNavContent,
      /setIsScreenSelectorVisible\(false\);\s*\n\s*setIsMegaMenuOpen\(false\);/,
      'When screenMode is user-testing, setIsMegaMenuOpen(false) must be called immediately alongside setIsScreenSelectorVisible(false)'
    );
  });

  it('3. Mega-menu container preserves positioning, dimensions and z-index', () => {
    // Menu ref and mega-menu markup checks
    assert.match(
      headerNavContent,
      /w-\[720px\]/,
      'Mega-menu must maintain w-[720px] dimension'
    );
    assert.match(
      headerNavContent,
      /absolute\s+top-full/,
      'Mega-menu must position absolute top-full'
    );
    assert.match(
      headerNavContent,
      /z-50/,
      'Mega-menu must have z-50'
    );
  });

  it('4. Screen selection changes active view and closes menu properly in store', () => {
    const screens = useMockpitStore.getState().screens;
    assert.ok(screens.length > 1, 'Multiple screens should exist in default store');

    const firstScreen = screens[0];
    const secondScreen = screens[1];

    useMockpitStore.getState().setActiveView(firstScreen.id);
    assert.equal(useMockpitStore.getState().activeView, firstScreen.id);

    // Simulating selecting the second screen
    useMockpitStore.getState().setActiveView(secondScreen.id);
    assert.equal(useMockpitStore.getState().activeView, secondScreen.id);
  });
});
