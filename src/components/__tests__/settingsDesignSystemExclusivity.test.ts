import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { useMockpitStore } from '../../store/useMockpitStore';

describe('Settings & Design System Sidebar Mutual Exclusivity Suite', () => {
  beforeEach(() => {
    // Reset store to known baseline: editor mode, both sidebars closed
    useMockpitStore.setState({
      screenMode: 'editor',
      isSettingsOpen: false,
      isDesignSystemOpen: false,
    });
  });

  it('1. Settings and Design System are initially closed', () => {
    const store = useMockpitStore.getState();
    assert.equal(store.isSettingsOpen, false, 'Settings must be initially closed');
    assert.equal(store.isDesignSystemOpen, false, 'Design System must be initially closed');
    assert.equal(store.getActiveExclusivePanel(), null, 'No exclusive panel should be active initially');
  });

  it('2. Clicking Settings opens Settings and ensures Design System is closed', () => {
    const store = useMockpitStore.getState();
    store.toggleSettingsModal();

    const state = useMockpitStore.getState();
    assert.equal(state.isSettingsOpen, true, 'Settings must open');
    assert.equal(state.isDesignSystemOpen, false, 'Design System must remain closed');
    assert.equal(state.getActiveExclusivePanel(), 'settings');
  });

  it('3. With Settings open, clicking Design System closes Settings and opens Design System', () => {
    // Open Settings first
    useMockpitStore.getState().toggleSettingsModal();
    assert.equal(useMockpitStore.getState().isSettingsOpen, true);

    // Now click Design System
    useMockpitStore.getState().toggleDesignSystem();

    const state = useMockpitStore.getState();
    assert.equal(state.isSettingsOpen, false, 'Settings must close when Design System is opened');
    assert.equal(state.isDesignSystemOpen, true, 'Design System must open');
    assert.equal(state.getActiveExclusivePanel(), 'design-system');
  });

  it('4. With Design System open, clicking Settings closes Design System and opens Settings', () => {
    // Open Design System first
    useMockpitStore.getState().toggleDesignSystem();
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, true);

    // Now click Settings
    useMockpitStore.getState().toggleSettingsModal();

    const state = useMockpitStore.getState();
    assert.equal(state.isDesignSystemOpen, false, 'Design System must close when Settings is opened');
    assert.equal(state.isSettingsOpen, true, 'Settings must open');
    assert.equal(state.getActiveExclusivePanel(), 'settings');
  });

  it('5. Clicking the currently active button dismisses/closes its own panel', () => {
    // Toggle Settings open then close
    useMockpitStore.getState().toggleSettingsModal();
    assert.equal(useMockpitStore.getState().isSettingsOpen, true);
    useMockpitStore.getState().toggleSettingsModal();
    assert.equal(useMockpitStore.getState().isSettingsOpen, false);
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, false);

    // Toggle Design System open then close
    useMockpitStore.getState().toggleDesignSystem();
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, true);
    useMockpitStore.getState().toggleDesignSystem();
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, false);
    assert.equal(useMockpitStore.getState().isSettingsOpen, false);
    assert.equal(useMockpitStore.getState().getActiveExclusivePanel(), null);
  });

  it('6. Explicit setters (setSettingsModalOpen & setIsDesignSystemOpen) enforce mutual exclusivity', () => {
    // setSettingsModalOpen(true) closes Design System if open
    useMockpitStore.getState().setIsDesignSystemOpen(true);
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, true);
    useMockpitStore.getState().setSettingsModalOpen(true);
    assert.equal(useMockpitStore.getState().isSettingsOpen, true);
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, false);

    // setIsDesignSystemOpen(true) closes Settings if open
    useMockpitStore.getState().setIsDesignSystemOpen(true);
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, true);
    assert.equal(useMockpitStore.getState().isSettingsOpen, false);

    // Closing one does not open the other
    useMockpitStore.getState().setIsDesignSystemOpen(false);
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, false);
    assert.equal(useMockpitStore.getState().isSettingsOpen, false);

    useMockpitStore.getState().setSettingsModalOpen(true);
    useMockpitStore.getState().setSettingsModalOpen(false);
    assert.equal(useMockpitStore.getState().isSettingsOpen, false);
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, false);
  });

  it('7. Mode changes maintain mutual exclusivity and enforce mode restrictions', () => {
    // Design System open in editor, switch to presentation mode
    useMockpitStore.getState().toggleDesignSystem();
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, true);

    useMockpitStore.getState().setScreenMode('presentation');
    assert.equal(useMockpitStore.getState().isDesignSystemOpen, false, 'Design system must close in presentation mode');
    assert.equal(useMockpitStore.getState().isSettingsOpen, false, 'Settings must close in presentation mode');

    // Return to editor mode, open Settings, switch to user-testing
    useMockpitStore.getState().setScreenMode('editor');
    useMockpitStore.getState().toggleSettingsModal();
    assert.equal(useMockpitStore.getState().isSettingsOpen, true);

    useMockpitStore.getState().setScreenMode('user-testing');
    const state = useMockpitStore.getState();
    assert.equal(state.isDesignSystemOpen, false, 'Design System cannot be open in user-testing mode');
    assert.ok(!(state.isSettingsOpen && state.isDesignSystemOpen), 'Both panels can never be open simultaneously');
  });

  it('8. HeaderNav.tsx button active styling and triggers derive from single source of truth', () => {
    const headerNavPath = path.resolve(process.cwd(), 'src/components/HeaderNav.tsx');
    const content = fs.readFileSync(headerNavPath, 'utf-8');

    // Verify Design system button wire-up and active state conditioning
    assert.match(content, /onClick=\{toggleDesignSystem\}/, 'Design system button must call toggleDesignSystem');
    assert.match(
      content,
      /title="Design system"/,
      'Design system button must have title="Design system"'
    );
    assert.match(
      content,
      /isDesignSystemOpen\s*\?\s*['"]bg-slate-900 border['"]/,
      'Design system button must apply active bg-slate-900 border when isDesignSystemOpen is true'
    );

    // Verify Settings button wire-up and active state conditioning
    assert.match(content, /onClick=\{toggleSettingsModal\}/, 'Settings button must call toggleSettingsModal');
    assert.match(
      content,
      /title="Settings"/,
      'Settings button must have title="Settings"'
    );
    assert.match(
      content,
      /isSettingsOpen\s*\?\s*['"]bg-slate-900 border['"]/,
      'Settings button must apply active bg-slate-900 border when isSettingsOpen is true'
    );
  });

  it('9. Invariant: across repeated toggle sequences, both panels are never open simultaneously', () => {
    const store = useMockpitStore.getState();
    const actions = [
      () => store.toggleSettingsModal(),
      () => store.toggleDesignSystem(),
      () => store.toggleSettingsModal(),
      () => store.toggleSettingsModal(),
      () => store.toggleDesignSystem(),
      () => store.toggleDesignSystem(),
      () => store.setIsDesignSystemOpen(true),
      () => store.setSettingsModalOpen(true),
      () => store.setIsDesignSystemOpen(false),
      () => store.setSettingsModalOpen(false),
    ];

    for (const action of actions) {
      action();
      const state = useMockpitStore.getState();
      assert.ok(
        !(state.isSettingsOpen && state.isDesignSystemOpen),
        'Invariant violated: isSettingsOpen and isDesignSystemOpen cannot both be true simultaneously'
      );
    }
  });
});
