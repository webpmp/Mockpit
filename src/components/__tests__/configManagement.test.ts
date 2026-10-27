import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWorkspaceConfiguration,
  generateConfigFilename,
  getBundledExampleConfiguration,
  MockpitConfiguration,
} from '../../utils/configManagement';
import { useMockpitStore, DEFAULT_SCREENS } from '../../store/useMockpitStore';

describe('Configuration Management — Save, Load, and Reset Suite', () => {
  beforeEach(() => {
    // Reset store to known baseline before each test
    useMockpitStore.getState().loadBundledExampleConfiguration();
  });

  describe('1. Schema Validation and Error Handling', () => {
    it('rejects null or non-object input', () => {
      const res1 = validateWorkspaceConfiguration(null);
      assert.equal(res1.valid, false);
      assert.ok(res1.error?.includes('valid JSON object'));

      const res2 = validateWorkspaceConfiguration('invalid string');
      assert.equal(res2.valid, false);
    });

    it('rejects mismatched configuration type', () => {
      const res = validateWorkspaceConfiguration({
        type: 'unsupported-tool-config',
        version: 1,
        workspace: { screens: [] },
      });
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes('Invalid configuration type'));
    });

    it('rejects unsupported schema versions', () => {
      const res = validateWorkspaceConfiguration({
        type: 'mockpit-configuration',
        version: 99,
        workspace: { screens: [] },
      });
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes('Unsupported configuration version'));
    });

    it('rejects configurations missing screens array', () => {
      const res = validateWorkspaceConfiguration({
        type: 'mockpit-configuration',
        version: 1,
        workspace: { screens: 'not-an-array' },
      });
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes('must be an array'));
    });

    it('rejects screens with missing or empty id/name', () => {
      const resNoId = validateWorkspaceConfiguration({
        type: 'mockpit-configuration',
        version: 1,
        workspace: {
          screens: [{ name: 'Screen 1' }],
        },
      });
      assert.equal(resNoId.valid, false);
      assert.ok(resNoId.error?.includes('missing a valid "id"'));

      const resNoName = validateWorkspaceConfiguration({
        type: 'mockpit-configuration',
        version: 1,
        workspace: {
          screens: [{ id: 'screen-1', name: '   ' }],
        },
      });
      assert.equal(resNoName.valid, false);
      assert.ok(resNoName.error?.includes('missing a valid "name"'));
    });

    it('rejects corrupted componentsByScreen map or component instances', () => {
      const resInvalidComp = validateWorkspaceConfiguration({
        type: 'mockpit-configuration',
        version: 1,
        workspace: {
          screens: [{ id: 's1', name: 'Screen 1' }],
          componentsByScreen: {
            s1: [{ id: 'c1' }], // missing type
          },
        },
      });
      assert.equal(resInvalidComp.valid, false);
      assert.ok(resInvalidComp.error?.includes('missing a valid "type"'));
    });

    it('accepts and sanitizes a valid configuration', () => {
      const valid = {
        type: 'mockpit-configuration',
        version: 1,
        metadata: {
          name: 'Telemetry Dashboard',
        },
        workspace: {
          screens: [
            { id: 'cluster', name: 'Instrument Cluster', order: 0, transitionStyle: 'fade', parentId: null },
          ],
          componentsByScreen: {
            cluster: [
              { id: 'speed-1', type: 'speed', x: 100, y: 100, width: 220, height: 160 },
            ],
          },
        },
      };
      const res = validateWorkspaceConfiguration(valid);
      assert.equal(res.valid, true);
      assert.ok(res.config);
      assert.equal(res.config.metadata.name, 'Telemetry Dashboard');
      assert.equal(res.config.workspace.screens.length, 1);
      assert.equal(res.config.workspace.componentsByScreen.cluster.length, 1);
    });
  });

  describe('2. Bundled Example Configuration', () => {
    it('produces a valid configuration passing schema validation', () => {
      const example = getBundledExampleConfiguration();
      assert.equal(example.version, 1);
      assert.equal(example.type, 'mockpit-configuration');
      assert.equal(example.metadata.name, 'Mockpit Workspace');
      assert.equal(example.workspace.screens.length, 10);
      assert.equal(example.metadata.screenCount, 10);
      assert.equal(example.metadata.componentCount, 35);

      const validation = validateWorkspaceConfiguration(example);
      assert.equal(validation.valid, true);
    });

    it('loads bundled example and restores all screens and components', () => {
      // First wipe the workspace
      useMockpitStore.getState().resetToBlankWorkspace();
      assert.equal(useMockpitStore.getState().screens.length, 0);

      // Now load the bundled example
      useMockpitStore.getState().loadBundledExampleConfiguration();
      const state = useMockpitStore.getState();
      assert.equal(state.screens.length, 10);
      assert.equal(state.activeView, 'home');
      assert.equal(state.components.length, 6, 'Home screen has 6 components arranged in layout');
      const totalOnScreens = Object.values(state.componentsByScreen).reduce((acc, l) => acc + l.length, 0);
      assert.equal(totalOnScreens, 30);
      assert.equal(state.notificationComponents.length, 5);

      // Verify all screen IDs match source of truth
      const expectedScreenIds = [
        'home',
        'media',
        'phone',
        'navigation',
        'playlists',
        'favorites',
        'screen_1786948329661',
        'weather',
        'weather-radar',
        'screen_1787681189695',
      ];
      assert.deepEqual(state.screens.map((s) => s.id), expectedScreenIds);

      // Verify component counts on each screen
      assert.equal(state.componentsByScreen['home'].length, 6);
      assert.equal(state.componentsByScreen['navigation'].length, 3);
      assert.equal(state.componentsByScreen['media'].length, 4);
      assert.equal(state.componentsByScreen['phone'].length, 3);
      assert.equal(state.componentsByScreen['screen_1786948329661'].length, 10);
      assert.equal(state.componentsByScreen['screen_1787681189695'].length, 4);

      // Verify home screen layouts have accurate coordinates from source of truth
      const homeOverhead = state.componentsByScreen['home'].find((c) => c.type === 'overheadVisualization');
      assert.ok(homeOverhead);
      assert.equal(homeOverhead.x, 770);
      assert.equal(homeOverhead.y, 66);
      assert.equal(homeOverhead.width, 1100);
      assert.equal(homeOverhead.height, 902);

      const homeMiniNav = state.componentsByScreen['home'].find((c) => c.type === 'miniNav');
      assert.ok(homeMiniNav);
      assert.equal(homeMiniNav.x, 264);
      assert.equal(homeMiniNav.y, 66);
      assert.equal(homeMiniNav.width, 462);
      assert.equal(homeMiniNav.height, 902);

      // Verify Vehicle screen layout
      const vehicleExploded = state.componentsByScreen['screen_1786948329661'].find((c) => c.type === 'vehicleExplodedView');
      assert.ok(vehicleExploded);
      assert.equal(vehicleExploded.x, 396);
      assert.equal(vehicleExploded.y, 66);
      assert.equal(vehicleExploded.width, 1122);
      assert.equal(vehicleExploded.height, 748);

      // Verify Climate screen layout
      const climateVent = state.componentsByScreen['screen_1787681189695'].find((c) => c.type === 'climateVent');
      assert.ok(climateVent);
      assert.equal(climateVent.x, 308);
      assert.equal(climateVent.y, 66);
      assert.equal(climateVent.width, 1320);
      assert.equal(climateVent.height, 440);
    });
  });

  describe('3. Workspace Reset to Blank State', () => {
    it('clears all screens, components, notifications, dockOrder, and selection', () => {
      // Ensure we have active screens first
      assert.ok(useMockpitStore.getState().screens.length > 0);

      // Reset to blank
      useMockpitStore.getState().resetToBlankWorkspace();
      const state = useMockpitStore.getState();

      assert.equal(state.screens.length, 0, 'Screens must be empty array');
      assert.equal(state.components.length, 0, 'Components must be empty array');
      assert.deepEqual(state.componentsByScreen, {}, 'componentsByScreen must be empty object');
      assert.equal(state.notificationComponents.length, 0, 'notificationComponents must be empty');
      assert.equal(state.dockOrder.length, 0, 'dockOrder must be empty');
      assert.equal(state.activeView, '', 'activeView must be empty string');
      assert.equal(state.selectedComponentId, null, 'selectedComponentId must be null');
    });
  });

  describe('4. Export Configuration', () => {
    it('exports complete current workspace matching schema version 1', () => {
      const config = useMockpitStore.getState().exportWorkspaceConfiguration('Custom Project');

      assert.equal(config.version, 1);
      assert.equal(config.type, 'mockpit-configuration');
      assert.equal(config.metadata.name, 'Custom Project');
      assert.equal(config.workspace.screens.length, useMockpitStore.getState().screens.length);

      const validation = validateWorkspaceConfiguration(config);
      assert.equal(validation.valid, true);
    });

    it('generates clean sanitized filenames with date', () => {
      const filename1 = generateConfigFilename('My Vehicle Dashboard!');
      assert.ok(filename1.startsWith('my-vehicle-dashboard-'));
      assert.ok(filename1.endsWith('.json'));

      const filename2 = generateConfigFilename('  ');
      assert.ok(filename2.startsWith('mockpit-workspace-'));
    });
  });

  describe('5. Load Configuration (Complete Replacement & Isolation)', () => {
    it('completely replaces current screens without merging leftovers', () => {
      const customConfig: MockpitConfiguration = {
        version: 1,
        schemaVersion: '1.0.0',
        type: 'mockpit-configuration',
        metadata: {
          name: 'Fleet Cockpit',
          createdAt: new Date().toISOString(),
        },
        workspace: {
          screens: [
            { id: 'fleet-overview', name: 'Fleet Overview', order: 0, transitionStyle: 'fade', parentId: null },
            { id: 'diagnostics', name: 'Diagnostics', order: 1, transitionStyle: 'fade', parentId: null },
          ],
          componentsByScreen: {
            'fleet-overview': [
              { id: 'comp-gear-1', type: 'gear', x: 200, y: 150, width: 200, height: 140, staticProps: {}, bindings: [] },
            ],
            'diagnostics': [],
          },
          dockOrder: ['fleet-overview', 'diagnostics'],
          activeView: 'fleet-overview',
        },
      };

      useMockpitStore.getState().loadWorkspaceConfiguration(customConfig);
      const state = useMockpitStore.getState();

      // Verify screens are strictly replaced (only 2 screens, no lingering home/navigation/etc.)
      assert.equal(state.screens.length, 2);
      assert.equal(state.screens[0].id, 'fleet-overview');
      assert.equal(state.screens[1].id, 'diagnostics');
      assert.equal(state.activeView, 'fleet-overview');
      assert.equal(state.components.length, 1);
      assert.equal(state.components[0].id, 'comp-gear-1');
      assert.deepEqual(state.dockOrder, ['fleet-overview', 'diagnostics']);
      assert.equal(state.selectedComponentId, null);
    });

    it('adding a screen to an empty workspace sets it as Home and assigns to dock', () => {
      useMockpitStore.getState().resetToBlankWorkspace();
      assert.equal(useMockpitStore.getState().screens.length, 0);

      const newId = useMockpitStore.getState().addScreen('Main Display');
      const state = useMockpitStore.getState();

      assert.equal(state.screens.length, 1);
      assert.equal(state.screens[0].name, 'Main Display');
      assert.equal(state.activeView, newId);
      assert.ok(state.dockOrder.includes(newId), 'First screen must be in dockOrder');
    });
  });
});
