import { COLOR_ROLES, RoleId } from './roles';
import { FactoryId, FACTORY_PRESETS, isFactoryPreset, ThemeColors } from './presets';
import { UserTheme, validateAndNormalizeHex, generateThemeId } from './theme';

export const DESIGN_SYSTEM_STORAGE_KEY = 'mockpit_design_system_v1';
export const LEGACY_PALETTE_STORAGE_KEY = 'mockpit_palette_v1';

export interface DesignSystemStorageState {
  version: 1;
  activeThemeId: string;
  userThemes: UserTheme[];
  migratedLegacyPalette?: boolean;
}

export const DEFAULT_STORAGE_STATE: DesignSystemStorageState = Object.freeze({
  version: 1,
  activeThemeId: 'midnight',
  userThemes: [],
  migratedLegacyPalette: false,
});

export function serializeStorageState(state: DesignSystemStorageState): string {
  return JSON.stringify({
    version: 1,
    activeThemeId: state.activeThemeId,
    userThemes: state.userThemes.map((t) => ({
      id: t.id,
      name: t.name,
      baseId: t.baseId,
      colors: t.colors,
    })),
    migratedLegacyPalette: Boolean(state.migratedLegacyPalette),
  });
}

export function parseAndValidateStorage(raw: string | null): DesignSystemStorageState {
  if (!raw || typeof raw !== 'string') {
    return { ...DEFAULT_STORAGE_STATE, userThemes: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
      return { ...DEFAULT_STORAGE_STATE, userThemes: [] };
    }

    const rawUserThemes = Array.isArray(parsed.userThemes) ? parsed.userThemes : [];
    const validUserThemes: UserTheme[] = [];
    const seenNames = new Set<string>();

    for (let i = 0; i < rawUserThemes.length; i++) {
      const ut = rawUserThemes[i];
      if (!ut || typeof ut !== 'object') continue;

      const baseId: FactoryId = isFactoryPreset(ut.baseId) ? ut.baseId : 'midnight';
      const basePreset = FACTORY_PRESETS[baseId];

      const id = typeof ut.id === 'string' && ut.id.trim() ? ut.id.trim() : generateThemeId();

      let name = typeof ut.name === 'string' ? ut.name.trim() : '';
      if (!name) {
        name = `${basePreset.name} V${i + 1}`;
      }
      let candidateName = name;
      let counter = 2;
      while (seenNames.has(candidateName.toLowerCase())) {
        candidateName = `${name} ${counter++}`;
      }
      seenNames.add(candidateName.toLowerCase());

      const rawColors = typeof ut.colors === 'object' && ut.colors !== null ? ut.colors : {};
      const sanitizedColors: ThemeColors = {} as ThemeColors;

      for (const role of COLOR_ROLES) {
        const val = rawColors[role.id];
        const normalized = typeof val === 'string' ? validateAndNormalizeHex(val) : null;
        sanitizedColors[role.id] = normalized || basePreset.colors[role.id];
      }

      validUserThemes.push({
        id,
        name: candidateName,
        baseId,
        colors: sanitizedColors,
      });
    }

    let activeThemeId = typeof parsed.activeThemeId === 'string' ? parsed.activeThemeId : 'midnight';
    const exists = isFactoryPreset(activeThemeId) || validUserThemes.some((t) => t.id === activeThemeId);
    if (!exists) {
      activeThemeId = 'midnight';
    }

    return {
      version: 1,
      activeThemeId,
      userThemes: validUserThemes,
      migratedLegacyPalette: Boolean(parsed.migratedLegacyPalette),
    };
  } catch {
    return { ...DEFAULT_STORAGE_STATE, userThemes: [] };
  }
}

const CYBER_SKY_ACCENTS = {
  primary: '#38bdf8',
  secondary: '#3b82f6',
  tertiary: '#10b981',
};

export function checkAndMigrateLegacyPalette(
  getStorageItem: (key: string) => string | null
): DesignSystemStorageState | null {
  const currentDs = getStorageItem(DESIGN_SYSTEM_STORAGE_KEY);
  if (currentDs) {
    return null;
  }

  const legacyRaw = getStorageItem(LEGACY_PALETTE_STORAGE_KEY);
  if (!legacyRaw) {
    return null;
  }

  try {
    const parsed = JSON.parse(legacyRaw);
    if (!parsed || typeof parsed !== 'object') return null;

    const legacyPrimary = validateAndNormalizeHex(parsed.primary);
    const legacySecondary = validateAndNormalizeHex(parsed.secondary);
    const legacyTertiary = validateAndNormalizeHex(parsed.tertiary);

    const isCyberSky =
      legacyPrimary === CYBER_SKY_ACCENTS.primary &&
      legacySecondary === CYBER_SKY_ACCENTS.secondary &&
      legacyTertiary === CYBER_SKY_ACCENTS.tertiary;

    if (isCyberSky) {
      return null;
    }

    const midnightColors = { ...FACTORY_PRESETS.midnight.colors };
    if (legacyPrimary) midnightColors.primary = legacyPrimary;
    if (legacySecondary) midnightColors.secondary = legacySecondary;
    if (legacyTertiary) midnightColors.tertiary = legacyTertiary;

    const userThemeId = generateThemeId();
    const migratedTheme: UserTheme = {
      id: userThemeId,
      name: 'Midnight V1',
      baseId: 'midnight',
      colors: midnightColors,
    };

    return {
      version: 1,
      activeThemeId: userThemeId,
      userThemes: [migratedTheme],
      migratedLegacyPalette: true,
    };
  } catch {
    return null;
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSaveDesignSystem(
  state: DesignSystemStorageState,
  delayMs = 150
): void {
  if (typeof localStorage === 'undefined') return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      localStorage.setItem(DESIGN_SYSTEM_STORAGE_KEY, serializeStorageState(state));
    } catch (e) {
      console.error('Failed to save design system to localStorage', e);
    }
  }, delayMs);
}

export function immediateSaveDesignSystem(state: DesignSystemStorageState): void {
  if (typeof localStorage === 'undefined') return;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  try {
    localStorage.setItem(DESIGN_SYSTEM_STORAGE_KEY, serializeStorageState(state));
  } catch (e) {
    console.error('Failed to save design system to localStorage', e);
  }
}
