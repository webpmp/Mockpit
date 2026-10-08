import { COLOR_ROLES, RoleId } from './roles';
import { FACTORY_PRESETS, ThemeColors } from './presets';
import { Theme } from './theme';

export function buildThemeCss(themeOrColors: Theme | { colors: ThemeColors }): string {
  const colors = themeOrColors.colors;

  const lines: string[] = [];

  // 1. All 20 role variables
  for (const role of COLOR_ROLES) {
    const val = colors[role.id] || role.defaultValue;
    lines.push(`  ${role.cssVar}: ${val};`);
  }

  // 2. Palette bridge (Canvas widgets using var(--color-primary|secondary|tertiary))
  lines.push(`  --color-primary: ${colors.primary};`);
  lines.push(`  --color-secondary: ${colors.secondary};`);
  lines.push(`  --color-tertiary: ${colors.tertiary};`);

  return `.vehicle-hmi-canvas, .ds-scope {\n${lines.join('\n')}\n}`;
}

export const THEME_STYLE_TAG_ID = 'mockpit-design-system-theme';

export function applyThemeCss(themeOrColors: Theme | { colors: ThemeColors }): void {
  if (typeof document === 'undefined') return;

  let styleTag = document.getElementById(THEME_STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = THEME_STYLE_TAG_ID;
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = buildThemeCss(themeOrColors);
}
