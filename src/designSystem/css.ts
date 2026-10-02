import { COLOR_ROLES, RoleId } from './roles';
import { FACTORY_PRESETS, ThemeColors } from './presets';
import { Theme } from './theme';

interface FallbackRule {
  targetRole: RoleId;
  cssVars: string[];
}

const FALLBACK_RULES: readonly FallbackRule[] = [
  { targetRole: 'background', cssVars: ['--color-slate-950'] },
  { targetRole: 'surface', cssVars: ['--color-slate-900'] },
  { targetRole: 'surface-raised', cssVars: ['--color-slate-800'] },
  { targetRole: 'line', cssVars: ['--color-slate-700'] },
  { targetRole: 'line-strong', cssVars: ['--color-slate-600'] },
  { targetRole: 'content-subtle', cssVars: ['--color-slate-500'] },
  { targetRole: 'content-muted', cssVars: ['--color-slate-400'] },
  { targetRole: 'content-secondary', cssVars: ['--color-slate-300'] },
  {
    targetRole: 'content',
    cssVars: ['--color-slate-200', '--color-slate-100', '--color-slate-50'],
  },
  { targetRole: 'primary', cssVars: ['--color-sky-400'] },
  { targetRole: 'primary-hover', cssVars: ['--color-sky-500'] },
  { targetRole: 'success', cssVars: ['--color-emerald-400', '--color-emerald-500'] },
  { targetRole: 'warning', cssVars: ['--color-amber-400', '--color-amber-500'] },
  {
    targetRole: 'error',
    cssVars: [
      '--color-rose-200',
      '--color-rose-300',
      '--color-rose-400',
      '--color-rose-500',
      '--color-rose-600',
      '--color-red-300',
      '--color-red-400',
      '--color-red-500',
      '--color-red-600',
      '--color-red-950',
    ],
  },
];

export function buildThemeCss(themeOrColors: Theme | { colors: ThemeColors }): string {
  const colors = themeOrColors.colors;
  const midnightColors = FACTORY_PRESETS.midnight.colors;

  const lines: string[] = [];

  // 1. All 19 role variables
  for (const role of COLOR_ROLES) {
    const val = colors[role.id] || role.defaultValue;
    lines.push(`  ${role.cssVar}: ${val};`);
  }

  // 2. Palette bridge (Canvas widgets using var(--color-primary|secondary|tertiary))
  lines.push(`  --color-primary: ${colors.primary};`);
  lines.push(`  --color-secondary: ${colors.secondary};`);
  lines.push(`  --color-tertiary: ${colors.tertiary};`);

  // 3. Fallback bridge: emitted ONLY if the target role differs from Midnight
  for (const rule of FALLBACK_RULES) {
    const activeVal = colors[rule.targetRole]?.toLowerCase();
    const midnightVal = midnightColors[rule.targetRole]?.toLowerCase();

    if (activeVal && activeVal !== midnightVal) {
      for (const cssVar of rule.cssVars) {
        lines.push(`  ${cssVar}: var(--color-ds-${rule.targetRole});`);
      }
    }
  }

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
