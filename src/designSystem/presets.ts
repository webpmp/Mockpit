import { RoleId } from './roles';

export type FactoryId = 'midnight' | 'arctic' | 'warm' | 'high-contrast' | 'monochrome';

export type ThemeColors = Record<RoleId, string>;

export interface FactoryTheme {
  readonly id: FactoryId;
  readonly name: string;
  readonly colors: Readonly<ThemeColors>;
}

export const FACTORY_PRESETS: Readonly<Record<FactoryId, FactoryTheme>> = Object.freeze({
  midnight: Object.freeze({
    id: 'midnight',
    name: 'Midnight',
    colors: Object.freeze({
      background: '#020617',
      surface: '#0f172a',
      'surface-raised': '#1e293b',
      'surface-hover': '#334155',
      content: '#f1f5f9',
      'content-secondary': '#cbd5e1',
      'content-muted': '#94a3b8',
      'content-subtle': '#64748b',
      'content-disabled': '#475569',
      'line-subtle': '#1e293b',
      line: '#334155',
      'line-strong': '#475569',
      primary: '#38bdf8',
      'primary-hover': '#0ea5e9',
      'on-primary': '#020617',
      secondary: '#3b82f6',
      tertiary: '#10b981',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    }),
  }),
  arctic: Object.freeze({
    id: 'arctic',
    name: 'Arctic',
    colors: Object.freeze({
      background: '#f1f5f9',
      surface: '#ffffff',
      'surface-raised': '#e2e8f0',
      'surface-hover': '#cbd5e1',
      content: '#0f172a',
      'content-secondary': '#334155',
      'content-muted': '#475569',
      'content-subtle': '#64748b',
      'content-disabled': '#94a3b8',
      'line-subtle': '#e2e8f0',
      line: '#cbd5e1',
      'line-strong': '#94a3b8',
      primary: '#0284c7',
      'primary-hover': '#0369a1',
      'on-primary': '#ffffff',
      secondary: '#2563eb',
      tertiary: '#059669',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    }),
  }),
  warm: Object.freeze({
    id: 'warm',
    name: 'Warm',
    colors: Object.freeze({
      background: '#1c1917',
      surface: '#292524',
      'surface-raised': '#44403c',
      'surface-hover': '#57534e',
      content: '#fafaf9',
      'content-secondary': '#e7e5e4',
      'content-muted': '#a8a29e',
      'content-subtle': '#78716c',
      'content-disabled': '#57534e',
      'line-subtle': '#44403c',
      line: '#57534e',
      'line-strong': '#78716c',
      primary: '#f59e0b',
      'primary-hover': '#d97706',
      'on-primary': '#1c1917',
      secondary: '#f97316',
      tertiary: '#84cc16',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
    }),
  }),
  'high-contrast': Object.freeze({
    id: 'high-contrast',
    name: 'High contrast',
    colors: Object.freeze({
      background: '#000000',
      surface: '#0a0a0a',
      'surface-raised': '#171717',
      'surface-hover': '#262626',
      content: '#ffffff',
      'content-secondary': '#f5f5f5',
      'content-muted': '#d4d4d4',
      'content-subtle': '#a3a3a3',
      'content-disabled': '#737373',
      'line-subtle': '#525252',
      line: '#a3a3a3',
      'line-strong': '#ffffff',
      primary: '#00e5ff',
      'primary-hover': '#5df0ff',
      'on-primary': '#000000',
      secondary: '#ffd400',
      tertiary: '#00ff66',
      success: '#00ff66',
      warning: '#ffb000',
      error: '#ff4d4d',
    }),
  }),
  monochrome: Object.freeze({
    id: 'monochrome',
    name: 'Monochrome',
    colors: Object.freeze({
      background: '#0a0a0a',
      surface: '#171717',
      'surface-raised': '#262626',
      'surface-hover': '#404040',
      content: '#fafafa',
      'content-secondary': '#d4d4d4',
      'content-muted': '#a3a3a3',
      'content-subtle': '#737373',
      'content-disabled': '#525252',
      'line-subtle': '#262626',
      line: '#404040',
      'line-strong': '#737373',
      primary: '#e5e5e5',
      'primary-hover': '#ffffff',
      'on-primary': '#0a0a0a',
      secondary: '#a3a3a3',
      tertiary: '#737373',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    }),
  }),
});

export const FACTORY_THEME_LIST: readonly FactoryTheme[] = Object.freeze([
  FACTORY_PRESETS.midnight,
  FACTORY_PRESETS.arctic,
  FACTORY_PRESETS.warm,
  FACTORY_PRESETS['high-contrast'],
  FACTORY_PRESETS.monochrome,
]);

export function isFactoryPreset(id: string): id is FactoryId {
  return id in FACTORY_PRESETS;
}
