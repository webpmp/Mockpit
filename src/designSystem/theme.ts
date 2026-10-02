import { RoleId } from './roles';
import { FactoryId, FactoryTheme, ThemeColors, FACTORY_PRESETS, isFactoryPreset } from './presets';

export interface UserTheme {
  readonly id: string;
  name: string;
  readonly baseId: FactoryId;
  colors: ThemeColors;
}

export type Theme = FactoryTheme | UserTheme;

export function validateAndNormalizeHex(hex: string): string | null {
  if (typeof hex !== 'string') return null;
  const trimmed = hex.trim();
  const match = trimmed.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return null;

  const raw = match[1];
  if (raw.length === 3) {
    const expanded = raw
      .split('')
      .map((c) => c + c)
      .join('');
    return `#${expanded.toLowerCase()}`;
  }
  return `#${raw.toLowerCase()}`;
}

export function isValidHex(hex: string): boolean {
  return validateAndNormalizeHex(hex) !== null;
}

export function generateThemeId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getNextUserThemeName(
  baseName: string,
  existingThemes: readonly { name: string }[]
): string {
  const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escaped}\\s+V(\\d+)$`, 'i');

  let maxN = 0;
  for (const t of existingThemes) {
    const match = t.name.trim().match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxN) {
        maxN = num;
      }
    }
  }

  return `${baseName} V${maxN + 1}`;
}

export function createUserThemeFromPreset(
  preset: FactoryTheme,
  existingThemes: readonly { name: string }[],
  overrides?: Partial<ThemeColors>
): UserTheme {
  const name = getNextUserThemeName(preset.name, existingThemes);
  const colors: ThemeColors = {
    ...preset.colors,
    ...(overrides || {}),
  };

  return {
    id: generateThemeId(),
    name,
    baseId: preset.id,
    colors,
  };
}

export function updateUserThemeColor(
  theme: UserTheme,
  roleId: RoleId,
  hex: string
): UserTheme {
  const normalized = validateAndNormalizeHex(hex);
  if (!normalized) return theme;

  return {
    ...theme,
    colors: {
      ...theme.colors,
      [roleId]: normalized,
    },
  };
}

export interface NameValidationResult {
  valid: boolean;
  error?: string;
  trimmed: string;
}

export function validateThemeName(
  name: string,
  currentThemeId: string,
  allThemes: readonly { id: string; name: string }[]
): NameValidationResult {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (trimmed.length < 1) {
    return { valid: false, error: 'Theme name cannot be empty', trimmed };
  }
  if (trimmed.length > 40) {
    return { valid: false, error: 'Theme name must be 40 characters or fewer', trimmed };
  }

  const lower = trimmed.toLowerCase();
  const hasDuplicate = allThemes.some(
    (t) => t.id !== currentThemeId && t.name.trim().toLowerCase() === lower
  );

  if (hasDuplicate) {
    return { valid: false, error: `A theme named "${trimmed}" already exists`, trimmed };
  }

  return { valid: true, trimmed };
}

export function duplicateTheme(
  sourceTheme: UserTheme,
  allThemes: readonly { id: string; name: string }[]
): UserTheme {
  const baseCopyName = `${sourceTheme.name.trim()} copy`;
  let candidate = baseCopyName;
  let counter = 2;

  while (
    allThemes.some((t) => t.name.trim().toLowerCase() === candidate.toLowerCase())
  ) {
    candidate = `${baseCopyName} ${counter}`;
    counter++;
  }

  return {
    id: generateThemeId(),
    name: candidate,
    baseId: sourceTheme.baseId,
    colors: { ...sourceTheme.colors },
  };
}

export function resetThemeColors(theme: UserTheme): UserTheme {
  const basePreset = FACTORY_PRESETS[theme.baseId] || FACTORY_PRESETS.midnight;
  return {
    ...theme,
    colors: { ...basePreset.colors },
  };
}

export function getDeleteFallbackThemeId(
  deletedTheme: UserTheme,
  activeThemeId: string
): string {
  if (deletedTheme.id === activeThemeId) {
    return deletedTheme.baseId;
  }
  return activeThemeId;
}

export function resolveTheme(
  themeId: string,
  userThemes: readonly UserTheme[]
): Theme {
  if (isFactoryPreset(themeId)) {
    return FACTORY_PRESETS[themeId];
  }
  const user = userThemes.find((t) => t.id === themeId);
  if (user) {
    return user;
  }
  return FACTORY_PRESETS.midnight;
}
