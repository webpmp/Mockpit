import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { findRawColors, findMarkerErrors } from './dsGuardHelpers';
import {
  COLOR_ROLES,
  ROLE_GROUPS,
  RoleId,
  RoleGroup,
  FACTORY_PRESETS,
  FACTORY_THEME_LIST,
  FactoryId,
  isFactoryPreset,
  validateAndNormalizeHex,
  isValidHex,
  getNextUserThemeName,
  createUserThemeFromPreset,
  updateUserThemeColor,
  validateThemeName,
  duplicateTheme,
  resetThemeColors,
  getDeleteFallbackThemeId,
  resolveTheme,
  buildThemeCss,
  parseAndValidateStorage,
  serializeStorageState,
  checkAndMigrateLegacyPalette,
  DESIGN_SYSTEM_STORAGE_KEY,
  LEGACY_PALETTE_STORAGE_KEY,
  DesignSystemStorageState,
  applyThemeCss,
  immediateSaveDesignSystem,
} from '../../designSystem';
import {
  useMockpitStore,
  derivePaletteFromTheme,
  loadDesignSystemState,
} from '../../store/useMockpitStore';

// In-memory shims for Node.js test environment
let mockStorageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => mockStorageMap.get(key) ?? null,
  setItem: (key: string, val: string) => { mockStorageMap.set(key, String(val)); },
  removeItem: (key: string) => { mockStorageMap.delete(key); },
  clear: () => { mockStorageMap.clear(); },
};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = localStorageMock;
}

const mockStyleElement = {
  id: 'mockpit-design-system-theme',
  textContent: '',
};
if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    getElementById: (id: string) => (id === 'mockpit-design-system-theme' ? mockStyleElement : null),
    createElement: (tag: string) => (tag === 'style' ? mockStyleElement : {}),
    head: {
      appendChild: () => {},
    },
  };
}

function resetThemeTestState() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(DESIGN_SYSTEM_STORAGE_KEY);
      localStorage.removeItem(LEGACY_PALETTE_STORAGE_KEY);
    } catch {}
  }
  applyThemeCss(FACTORY_PRESETS.midnight);
  useMockpitStore.setState({
    activeThemeId: 'midnight',
    userThemes: [],
    isDesignSystemOpen: false,
    activePalette: derivePaletteFromTheme(FACTORY_PRESETS.midnight),
  });
}

// Completeness guard scaffold: list of canvas files that have been migrated
// to the design system. Follow-up specs append to this list.
export const MIGRATED_CANVAS_FILES: readonly string[] = [
  'src/components/designSystem/ThemePreview.tsx',
  'src/components/ContactAvatar.tsx',
  'src/components/VirtualKeyboard.tsx',
  'src/components/Canvas.tsx',
  'src/components/BottomDock.tsx',
  'src/components/QuickAccessOverlay.tsx',
  'src/components/VehicleBackground.tsx',
];

describe('Design System Foundation Suite (Spec v1)', () => {
  beforeEach(() => {
    resetThemeTestState();
  });

  describe('1. Role Registry', () => {
    it('defines exactly 20 unique color roles', () => {
      assert.equal(COLOR_ROLES.length, 20);
      const ids = new Set(COLOR_ROLES.map((r) => r.id));
      assert.equal(ids.size, 20);

      const onPrimaryRole = COLOR_ROLES.find((r) => r.id === 'on-primary')!;
      assert.ok(onPrimaryRole, 'on-primary role must exist in registry');
      assert.equal(onPrimaryRole.label, 'Text on primary');
      assert.equal(onPrimaryRole.group, 'Accent');
      assert.equal(onPrimaryRole.description, 'Text and icons on solid primary fills');
      assert.equal(onPrimaryRole.cssVar, '--color-ds-on-primary');
      assert.ok(isValidHex(onPrimaryRole.defaultValue));
    });

    it('every role has label, group, description, valid default hex, and cssVar matching --color-ds-<id>', () => {
      const validGroups = new Set<RoleGroup>(ROLE_GROUPS);
      for (const role of COLOR_ROLES) {
        assert.ok(role.label && role.label.trim().length > 0, `Role ${role.id} missing label`);
        assert.ok(validGroups.has(role.group), `Role ${role.id} invalid group ${role.group}`);
        assert.ok(
          role.description && role.description.trim().length > 0,
          `Role ${role.id} missing description`
        );
        assert.ok(
          isValidHex(role.defaultValue),
          `Role ${role.id} default value ${role.defaultValue} is not a valid hex`
        );
        assert.equal(
          role.cssVar,
          `--color-ds-${role.id}`,
          `Role ${role.id} cssVar must match --color-ds-${role.id}`
        );
      }
    });
  });

  describe('2. Factory Presets', () => {
    it('defines all 5 factory presets with all 20 roles', () => {
      const expectedIds: FactoryId[] = ['midnight', 'arctic', 'warm', 'high-contrast', 'monochrome'];
      assert.equal(FACTORY_THEME_LIST.length, 5);

      for (const id of expectedIds) {
        const preset = FACTORY_PRESETS[id];
        assert.ok(preset, `Preset ${id} should exist`);
        assert.equal(preset.id, id);
        assert.ok(preset.name, `Preset ${id} should have name`);

        for (const role of COLOR_ROLES) {
          const color = preset.colors[role.id];
          assert.ok(color, `Preset ${id} missing role ${role.id}`);
          assert.ok(isValidHex(color), `Preset ${id} color for ${role.id} is invalid hex: ${color}`);
        }
      }

      // on-primary specific preset values
      assert.equal(FACTORY_PRESETS.midnight.colors['on-primary'], '#020617');
      assert.equal(FACTORY_PRESETS.arctic.colors['on-primary'], '#ffffff');
      assert.equal(FACTORY_PRESETS.warm.colors['on-primary'], '#1c1917');
      assert.equal(FACTORY_PRESETS['high-contrast'].colors['on-primary'], '#000000');
      assert.equal(FACTORY_PRESETS.monochrome.colors['on-primary'], '#0a0a0a');
    });

    it('Midnight preset matches registry default values exactly', () => {
      const midnight = FACTORY_PRESETS.midnight;
      for (const role of COLOR_ROLES) {
        assert.equal(
          midnight.colors[role.id].toLowerCase(),
          role.defaultValue.toLowerCase(),
          `Midnight role ${role.id} does not match registry default`
        );
      }
    });

    it('Factory presets are deeply frozen and cannot be mutated', () => {
      const midnight = FACTORY_PRESETS.midnight;
      assert.ok(Object.isFrozen(midnight), 'Midnight preset object must be frozen');
      assert.ok(Object.isFrozen(midnight.colors), 'Midnight colors object must be frozen');

      // Attempting mutation throws in strict mode or is silently ignored
      assert.throws(() => {
        (midnight.colors as any).background = '#ffffff';
      });
      assert.equal(midnight.colors.background, '#020617');
    });
  });

  describe('3. Hex Validation & Normalization', () => {
    it('expands 3-digit hex to 6 digits and normalizes to lowercase', () => {
      assert.equal(validateAndNormalizeHex('#abc'), '#aabbcc');
      assert.equal(validateAndNormalizeHex('#ABC'), '#aabbcc');
      assert.equal(validateAndNormalizeHex('#1e293b'), '#1e293b');
      assert.equal(validateAndNormalizeHex('#1E293B'), '#1e293b');
      assert.equal(validateAndNormalizeHex('  #38bdf8  '), '#38bdf8');
    });

    it('rejects invalid or garbage inputs', () => {
      assert.equal(validateAndNormalizeHex(''), null);
      assert.equal(validateAndNormalizeHex('red'), null);
      assert.equal(validateAndNormalizeHex('#12345'), null);
      assert.equal(validateAndNormalizeHex('#1234567'), null);
      assert.equal(validateAndNormalizeHex('#xyz'), null);
      assert.equal(validateAndNormalizeHex(null as any), null);
    });
  });

  describe('4. Theme Operations & Store Lifecycle', () => {
    it('editing a factory preset creates a user copy (e.g. Midnight V1) and makes it active', () => {
      useMockpitStore.getState().setActiveTheme('midnight');
      assert.equal(useMockpitStore.getState().activeThemeId, 'midnight');
      assert.equal(useMockpitStore.getState().userThemes.length, 0);

      // Edit primary color
      useMockpitStore.getState().setRoleColor('primary', '#ff0055');

      const state = useMockpitStore.getState();
      assert.equal(state.userThemes.length, 1);
      const userTheme = state.userThemes[0];
      assert.equal(userTheme.name, 'Midnight V1');
      assert.equal(userTheme.baseId, 'midnight');
      assert.equal(userTheme.colors.primary, '#ff0055');
      assert.equal(state.activeThemeId, userTheme.id);

      // Factory preset remains untouched
      assert.equal(FACTORY_PRESETS.midnight.colors.primary, '#38bdf8');
    });

    it('second edit on the active user copy updates it in place (no V2 created)', () => {
      useMockpitStore.getState().setActiveTheme('midnight');
      useMockpitStore.getState().setRoleColor('primary', '#ff0055');

      const firstState = useMockpitStore.getState();
      const firstId = firstState.activeThemeId;
      assert.equal(firstState.userThemes.length, 1);

      // Second edit
      useMockpitStore.getState().setRoleColor('secondary', '#00ff99');

      const secondState = useMockpitStore.getState();
      assert.equal(secondState.userThemes.length, 1);
      assert.equal(secondState.activeThemeId, firstId);
      assert.equal(secondState.userThemes[0].colors.secondary, '#00ff99');
    });

    it('editing factory preset again after switching away creates V2; deleting V1 while V2 exists then editing creates V3', () => {
      // 1. Edit midnight -> creates Midnight V1
      useMockpitStore.getState().setActiveTheme('midnight');
      useMockpitStore.getState().setRoleColor('primary', '#111111');
      const state1 = useMockpitStore.getState();
      const v1Id = state1.userThemes[0].id;
      assert.equal(state1.userThemes[0].name, 'Midnight V1');

      // 2. Switch back to factory midnight and edit -> creates Midnight V2
      useMockpitStore.getState().setActiveTheme('midnight');
      useMockpitStore.getState().setRoleColor('primary', '#222222');
      const state2 = useMockpitStore.getState();
      assert.equal(state2.userThemes.length, 2);
      const v2 = state2.userThemes.find((t) => t.name === 'Midnight V2');
      assert.ok(v2, 'Midnight V2 should be created');

      // 3. Delete V1
      useMockpitStore.getState().deleteTheme(v1Id);
      const state3 = useMockpitStore.getState();
      assert.equal(state3.userThemes.length, 1);
      assert.equal(state3.userThemes[0].name, 'Midnight V2');

      // 4. Switch to factory midnight and edit -> creates Midnight V3 (because V2 exists)
      useMockpitStore.getState().setActiveTheme('midnight');
      useMockpitStore.getState().setRoleColor('primary', '#333333');
      const state4 = useMockpitStore.getState();
      const v3 = state4.userThemes.find((t) => t.name === 'Midnight V3');
      assert.ok(v3, 'Midnight V3 should be created');
    });

    it('switching themes never mutates or creates themes', () => {
      useMockpitStore.getState().setActiveTheme('midnight');
      const initialCount = useMockpitStore.getState().userThemes.length;

      useMockpitStore.getState().setActiveTheme('arctic');
      assert.equal(useMockpitStore.getState().activeThemeId, 'arctic');
      assert.equal(useMockpitStore.getState().userThemes.length, initialCount);

      useMockpitStore.getState().setActiveTheme('midnight');
      assert.equal(useMockpitStore.getState().activeThemeId, 'midnight');
      assert.equal(useMockpitStore.getState().userThemes.length, initialCount);
    });

    it('resetActiveTheme restores base values on user copies and is a no-op on factory presets', () => {
      // Test on factory preset (no-op)
      useMockpitStore.getState().setActiveTheme('arctic');
      useMockpitStore.getState().resetActiveTheme();
      assert.equal(useMockpitStore.getState().activeThemeId, 'arctic');

      // Test on user copy
      useMockpitStore.getState().setRoleColor('primary', '#ff0000');
      const userThemeId = useMockpitStore.getState().activeThemeId;
      assert.equal(useMockpitStore.getState().userThemes[0].colors.primary, '#ff0000');

      useMockpitStore.getState().resetActiveTheme();
      const resetTheme = useMockpitStore.getState().userThemes.find((t) => t.id === userThemeId)!;
      assert.equal(resetTheme.colors.primary, FACTORY_PRESETS.arctic.colors.primary);
    });

    it('renameTheme trims, enforces 1-40 chars, and rejects duplicate names case-insensitively', () => {
      useMockpitStore.getState().setActiveTheme('midnight');
      useMockpitStore.getState().setRoleColor('primary', '#123456');
      const userThemeId = useMockpitStore.getState().activeThemeId;

      // Empty name
      const resEmpty = useMockpitStore.getState().renameTheme(userThemeId, '   ');
      assert.equal(resEmpty.success, false);

      // Name too long (> 40 chars)
      const resLong = useMockpitStore
        .getState()
        .renameTheme(userThemeId, 'A'.repeat(45));
      assert.equal(resLong.success, false);

      // Duplicate of factory preset name (case-insensitive)
      const resDupFactory = useMockpitStore.getState().renameTheme(userThemeId, 'arctic');
      assert.equal(resDupFactory.success, false);

      // Valid rename
      const resValid = useMockpitStore.getState().renameTheme(userThemeId, '  Cyber Neon  ');
      assert.equal(resValid.success, true);
      assert.equal(useMockpitStore.getState().userThemes[0].name, 'Cyber Neon');

      // Cannot rename a factory preset
      const resRenameFactory = useMockpitStore.getState().renameTheme('midnight', 'New Midnight');
      assert.equal(resRenameFactory.success, false);
    });

    it('duplicateTheme retains baseId and appends copy, copy 2...', () => {
      useMockpitStore.getState().setActiveTheme('midnight');
      useMockpitStore.getState().setRoleColor('primary', '#123456');
      const v1Id = useMockpitStore.getState().activeThemeId;

      // Duplicate V1
      const dup1Id = useMockpitStore.getState().duplicateTheme(v1Id)!;
      assert.ok(dup1Id);
      const dup1 = useMockpitStore.getState().userThemes.find((t) => t.id === dup1Id)!;
      assert.equal(dup1.name, 'Midnight V1 copy');
      assert.equal(dup1.baseId, 'midnight');
      assert.equal(dup1.colors.primary, '#123456');
      assert.equal(useMockpitStore.getState().activeThemeId, dup1Id);

      // Duplicate again
      const dup2Id = useMockpitStore.getState().duplicateTheme(v1Id)!;
      const dup2 = useMockpitStore.getState().userThemes.find((t) => t.id === dup2Id)!;
      assert.equal(dup2.name, 'Midnight V1 copy 2');

      // Cannot duplicate factory preset
      const noDup = useMockpitStore.getState().duplicateTheme('midnight');
      assert.equal(noDup, null);
    });

    it('deleteTheme removes user theme and falls back to base preset if active', () => {
      useMockpitStore.getState().setActiveTheme('warm');
      useMockpitStore.getState().setRoleColor('primary', '#112233');
      const warmV1Id = useMockpitStore.getState().activeThemeId;

      // Active theme is warmV1 (baseId: warm). Delete it.
      useMockpitStore.getState().deleteTheme(warmV1Id);
      assert.equal(useMockpitStore.getState().userThemes.length, 0);
      assert.equal(useMockpitStore.getState().activeThemeId, 'warm');

      // Delete on factory preset is a no-op
      useMockpitStore.getState().deleteTheme('warm');
      assert.equal(useMockpitStore.getState().activeThemeId, 'warm');
    });

    it('derived activePalette reflects active theme primary, secondary, tertiary', () => {
      useMockpitStore.getState().setActiveTheme('arctic');
      const state = useMockpitStore.getState();
      assert.equal(state.activePalette.primary, FACTORY_PRESETS.arctic.colors.primary);
      assert.equal(state.activePalette.secondary, FACTORY_PRESETS.arctic.colors.secondary);
      assert.equal(state.activePalette.tertiary, FACTORY_PRESETS.arctic.colors.tertiary);

      // After editing
      useMockpitStore.getState().setRoleColor('primary', '#aa00bb');
      const updatedState = useMockpitStore.getState();
      assert.equal(updatedState.activePalette.primary, '#aa00bb');
    });
  });

  describe('5. CSS Generation (buildThemeCss)', () => {
    it('contains all 20 role variables and 3 palette-bridge variables', () => {
      const css = buildThemeCss(FACTORY_PRESETS.midnight);
      for (const role of COLOR_ROLES) {
        assert.ok(
          css.includes(`${role.cssVar}: ${role.defaultValue};`),
          `CSS must include ${role.cssVar}`
        );
      }
      assert.ok(css.includes('--color-primary: #38bdf8;'));
      assert.ok(css.includes('--color-secondary: #3b82f6;'));
      assert.ok(css.includes('--color-tertiary: #10b981;'));
    });

    it('buildThemeCss output contains --color-ds-on-primary and emits no fallback lines because of on-primary alone', () => {
      const modifiedColors = {
        ...FACTORY_PRESETS.midnight.colors,
        'on-primary': '#ffffff',
      };
      const css = buildThemeCss({ colors: modifiedColors });
      assert.ok(css.includes('--color-ds-on-primary: #ffffff;'));
      // Style tag differs from Midnight only in that variable line; no fallback lines added
      assert.equal(css.includes('--color-slate-'), false);
      assert.equal(css.includes('--color-sky-'), false);
      assert.equal(css.includes('--color-rose-'), false);
      assert.equal(css.includes('--color-red-'), false);
    });

    it('emits NO fallback lines under Midnight', () => {
      const css = buildThemeCss(FACTORY_PRESETS.midnight);
      assert.equal(css.includes('--color-slate-'), false, 'Midnight should emit no slate fallback');
      assert.equal(css.includes('--color-sky-'), false, 'Midnight should emit no sky fallback');
      assert.equal(css.includes('--color-rose-'), false, 'Midnight should emit no rose fallback');
      assert.equal(css.includes('--color-red-'), false, 'Midnight should emit no red fallback');
    });

    it('emits fallback lines exactly for the roles that differ from Midnight', () => {
      // Only change background from Midnight
      const modifiedColors = {
        ...FACTORY_PRESETS.midnight.colors,
        background: '#ffffff',
      };
      const css = buildThemeCss({ colors: modifiedColors });

      // Should emit background fallback (--color-slate-950)
      assert.ok(css.includes('--color-slate-950: var(--color-ds-background);'));

      // Should NOT emit surface, primary, or error fallbacks
      assert.equal(css.includes('--color-slate-900:'), false);
      assert.equal(css.includes('--color-sky-400:'), false);
      assert.equal(css.includes('--color-rose-'), false);
    });

    it('emits fallbacks for Arctic theme', () => {
      const css = buildThemeCss(FACTORY_PRESETS.arctic);
      assert.ok(css.includes('--color-slate-950: var(--color-ds-background);'));
      assert.ok(css.includes('--color-slate-900: var(--color-ds-surface);'));
      assert.ok(css.includes('--color-sky-400: var(--color-ds-primary);'));
      assert.ok(css.includes('--color-rose-400: var(--color-ds-error);'));
    });
  });

  describe('6. Storage & Serialization', () => {
    it('stored state containing a user theme with 19 colors (no on-primary) loads and fills on-primary from base preset', () => {
      const colors19: Record<string, string> = {};
      for (const role of COLOR_ROLES) {
        if (role.id !== 'on-primary') {
          colors19[role.id] = FACTORY_PRESETS.arctic.colors[role.id];
        }
      }
      assert.equal(Object.keys(colors19).length, 19);

      const storedJson = JSON.stringify({
        version: 1,
        activeThemeId: 'u19',
        userThemes: [
          {
            id: 'u19',
            name: 'Legacy Arctic V1',
            baseId: 'arctic',
            colors: colors19,
          },
        ],
      });

      const parsed = parseAndValidateStorage(storedJson);
      assert.equal(parsed.userThemes.length, 1);
      assert.equal(
        parsed.userThemes[0].colors['on-primary'],
        FACTORY_PRESETS.arctic.colors['on-primary']
      );
      assert.equal(parsed.userThemes[0].colors['on-primary'], '#ffffff');
    });

    it('round-trips serialize and parse storage state', () => {
      const testState: DesignSystemStorageState = {
        version: 1,
        activeThemeId: 'user-1',
        userThemes: [
          {
            id: 'user-1',
            name: 'Custom Midnight',
            baseId: 'midnight',
            colors: {
              ...FACTORY_PRESETS.midnight.colors,
              primary: '#ff1122',
            },
          },
        ],
        migratedLegacyPalette: true,
      };

      const serialized = serializeStorageState(testState);
      const parsed = parseAndValidateStorage(serialized);

      assert.equal(parsed.version, 1);
      assert.equal(parsed.activeThemeId, 'user-1');
      assert.equal(parsed.userThemes.length, 1);
      assert.equal(parsed.userThemes[0].name, 'Custom Midnight');
      assert.equal(parsed.userThemes[0].colors.primary, '#ff1122');
      assert.equal(parsed.migratedLegacyPalette, true);
    });

    it('handles corrupt JSON, wrong version, and unknown activeThemeId gracefully', () => {
      assert.equal(parseAndValidateStorage('invalid json{').activeThemeId, 'midnight');
      assert.equal(parseAndValidateStorage('{"version": 99}').activeThemeId, 'midnight');

      const unknownActive = JSON.stringify({
        version: 1,
        activeThemeId: 'non-existent-theme-id',
        userThemes: [],
      });
      assert.equal(parseAndValidateStorage(unknownActive).activeThemeId, 'midnight');
    });

    it('repairs missing roles and invalid hex values using baseId preset', () => {
      const rawIncomplete = JSON.stringify({
        version: 1,
        activeThemeId: 'u1',
        userThemes: [
          {
            id: 'u1',
            name: 'Incomplete',
            baseId: 'arctic',
            colors: {
              primary: 'not-a-hex',
              // all other roles omitted
            },
          },
        ],
      });

      const parsed = parseAndValidateStorage(rawIncomplete);
      assert.equal(parsed.userThemes.length, 1);
      const theme = parsed.userThemes[0];
      // Invalid hex replaced by arctic default
      assert.equal(theme.colors.primary, FACTORY_PRESETS.arctic.colors.primary);
      // Missing role filled from arctic default
      assert.equal(theme.colors.background, FACTORY_PRESETS.arctic.colors.background);
    });

    it('legacy migration creates Midnight V1 for non-Cyber Sky palettes', () => {
      const mockStorage: Record<string, string> = {
        [LEGACY_PALETTE_STORAGE_KEY]: JSON.stringify({
          id: 'neonAmber',
          name: 'Neon Amber',
          primary: '#f59e0b',
          secondary: '#f97316',
          tertiary: '#ef4444',
        }),
      };

      const migrated = checkAndMigrateLegacyPalette((k) => mockStorage[k] || null);
      assert.ok(migrated, 'Should migrate non-Cyber Sky palette');
      assert.equal(migrated.activeThemeId, migrated.userThemes[0].id);
      assert.equal(migrated.userThemes[0].name, 'Midnight V1');
      assert.equal(migrated.userThemes[0].colors.primary, '#f59e0b');
      assert.equal(migrated.userThemes[0].colors.secondary, '#f97316');
      assert.equal(migrated.userThemes[0].colors.tertiary, '#ef4444');
      assert.equal(migrated.migratedLegacyPalette, true);
    });

    it('legacy migration then key removal: running load path creates Midnight V1, saves new key, and leaves no legacy key', () => {
      localStorage.clear();
      localStorage.setItem(
        LEGACY_PALETTE_STORAGE_KEY,
        JSON.stringify({
          id: 'neonAmber',
          name: 'Neon Amber',
          primary: '#f59e0b',
          secondary: '#f97316',
          tertiary: '#ef4444',
        })
      );

      const loaded = loadDesignSystemState();
      assert.equal(loaded.activeTheme.name, 'Midnight V1');
      assert.ok(localStorage.getItem(DESIGN_SYSTEM_STORAGE_KEY), 'New key must be saved');
      assert.equal(localStorage.getItem(LEGACY_PALETTE_STORAGE_KEY), null, 'Legacy key must be removed');

      // A second load with the new key removed afterwards (simulating a lost new key) does not recreate the migrated theme
      localStorage.removeItem(DESIGN_SYSTEM_STORAGE_KEY);
      const reloaded = loadDesignSystemState();
      assert.equal(reloaded.activeThemeId, 'midnight', 'Must fallback to default midnight');
      assert.equal(reloaded.userThemes.length, 0);
    });

    it('Cyber Sky legacy palette: no theme is created and legacy key is left untouched', () => {
      localStorage.clear();
      const cyberSkyData = JSON.stringify({
        id: 'cyberSky',
        name: 'Cyber Sky',
        primary: '#38bdf8',
        secondary: '#3b82f6',
        tertiary: '#10b981',
      });
      localStorage.setItem(LEGACY_PALETTE_STORAGE_KEY, cyberSkyData);

      const loaded = loadDesignSystemState();
      assert.equal(loaded.activeThemeId, 'midnight');
      assert.equal(loaded.userThemes.length, 0);
      assert.equal(
        localStorage.getItem(LEGACY_PALETTE_STORAGE_KEY),
        cyberSkyData,
        'Cyber Sky legacy key must be untouched'
      );
    });

    it('save failure: if saving the new key throws, the legacy key is not removed', () => {
      localStorage.clear();
      const legacyData = JSON.stringify({
        id: 'custom',
        name: 'Custom',
        primary: '#ff00aa',
        secondary: '#00aaff',
        tertiary: '#aaff00',
      });
      localStorage.setItem(LEGACY_PALETTE_STORAGE_KEY, legacyData);

      const origSetItem = localStorage.setItem;
      localStorage.setItem = (key: string, val: string) => {
        if (key === DESIGN_SYSTEM_STORAGE_KEY) {
          throw new Error('QuotaExceededError');
        }
        origSetItem.call(localStorage, key, val);
      };

      try {
        loadDesignSystemState();
      } finally {
        localStorage.setItem = origSetItem;
      }

      assert.equal(
        localStorage.getItem(LEGACY_PALETTE_STORAGE_KEY),
        legacyData,
        'Legacy key must be preserved when save throws'
      );
    });

    it('seed reset leaves the theme alone: activeThemeId, userThemes, activePalette, storage key, and style tag are unchanged', () => {
      useMockpitStore.getState().setActiveTheme('midnight');
      useMockpitStore.getState().setRoleColor('primary', '#ff00aa');

      const stateBefore = useMockpitStore.getState();
      const activeThemeIdBefore = stateBefore.activeThemeId;
      const userThemesBefore = stateBefore.userThemes;
      const activePaletteBefore = stateBefore.activePalette;

      immediateSaveDesignSystem({
        version: 1,
        activeThemeId: activeThemeIdBefore,
        userThemes: userThemesBefore,
      });

      const dsKeyBefore = localStorage.getItem(DESIGN_SYSTEM_STORAGE_KEY);
      const styleTagBefore = mockStyleElement.textContent;

      assert.equal(isFactoryPreset(activeThemeIdBefore), false, 'A user theme should be active');
      assert.equal(userThemesBefore.length, 1);

      useMockpitStore.getState().resetToSeedData();

      const stateAfter = useMockpitStore.getState();
      assert.equal(stateAfter.activeThemeId, activeThemeIdBefore);
      assert.deepEqual(stateAfter.userThemes, userThemesBefore);
      assert.deepEqual(stateAfter.activePalette, activePaletteBefore);
      assert.equal(localStorage.getItem(DESIGN_SYSTEM_STORAGE_KEY), dsKeyBefore);
      assert.equal(mockStyleElement.textContent, styleTagBefore);
    });

    it('legacy migration is skipped if legacy palette is Cyber Sky or new key already exists', () => {
      // 1. Cyber Sky
      const cyberSkyStorage: Record<string, string> = {
        [LEGACY_PALETTE_STORAGE_KEY]: JSON.stringify({
          id: 'cyberSky',
          name: 'Cyber Sky',
          primary: '#38bdf8',
          secondary: '#3b82f6',
          tertiary: '#10b981',
        }),
      };
      assert.equal(
        checkAndMigrateLegacyPalette((k) => cyberSkyStorage[k] || null),
        null
      );

      // 2. Already has new key
      const existingNewStorage: Record<string, string> = {
        [DESIGN_SYSTEM_STORAGE_KEY]: '{"version":1,"activeThemeId":"arctic","userThemes":[]}',
        [LEGACY_PALETTE_STORAGE_KEY]: '{"primary":"#f59e0b","secondary":"#f97316","tertiary":"#ef4444"}',
      };
      assert.equal(
        checkAndMigrateLegacyPalette((k) => existingNewStorage[k] || null),
        null
      );
    });
  });

  describe('7. Completeness Guard Scaffold', () => {
    it('asserts none of the listed migrated files contain raw palette classes or hex literals', () => {
      for (const filePath of MIGRATED_CANVAS_FILES) {
        const fullPath = path.resolve(process.cwd(), filePath);
        assert.ok(fs.existsSync(fullPath), `Migrated canvas file must exist: ${filePath}`);

        const content = fs.readFileSync(fullPath, 'utf8');

        const markerErrors = findMarkerErrors(content);
        assert.equal(
          markerErrors.length,
          0,
          `File ${filePath} contains marker errors:\n${markerErrors.join('\n')}`
        );

        const rawColors = findRawColors(content);
        assert.equal(
          rawColors.length,
          0,
          `File ${filePath} contains raw color findings:\n${rawColors.map((f) => `  line ${f.line}: ${f.text}`).join('\n')}`
        );
      }
    });
  });
});
