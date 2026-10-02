export type RoleId =
  | 'background'
  | 'surface'
  | 'surface-raised'
  | 'surface-hover'
  | 'content'
  | 'content-secondary'
  | 'content-muted'
  | 'content-subtle'
  | 'content-disabled'
  | 'line-subtle'
  | 'line'
  | 'line-strong'
  | 'primary'
  | 'primary-hover'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'error';

export type RoleGroup = 'Backgrounds' | 'Text' | 'Borders' | 'Accent' | 'Status';

export interface RoleDefinition {
  id: RoleId;
  label: string;
  group: RoleGroup;
  description: string;
  defaultValue: string;
  cssVar: string;
}

export const ROLE_GROUPS: readonly RoleGroup[] = [
  'Backgrounds',
  'Text',
  'Borders',
  'Accent',
  'Status',
] as const;

export const COLOR_ROLES: readonly RoleDefinition[] = [
  {
    id: 'background',
    label: 'Background',
    group: 'Backgrounds',
    description: 'Canvas behind everything',
    defaultValue: '#020617',
    cssVar: '--color-ds-background',
  },
  {
    id: 'surface',
    label: 'Card',
    group: 'Backgrounds',
    description: 'Widget cards and panels',
    defaultValue: '#0f172a',
    cssVar: '--color-ds-surface',
  },
  {
    id: 'surface-raised',
    label: 'Raised card',
    group: 'Backgrounds',
    description: 'Buttons and inner tiles',
    defaultValue: '#1e293b',
    cssVar: '--color-ds-surface-raised',
  },
  {
    id: 'surface-hover',
    label: 'Hover surface',
    group: 'Backgrounds',
    description: 'Pressed and hovered fills',
    defaultValue: '#334155',
    cssVar: '--color-ds-surface-hover',
  },
  {
    id: 'content',
    label: 'Text',
    group: 'Text',
    description: 'Titles and values',
    defaultValue: '#f1f5f9',
    cssVar: '--color-ds-content',
  },
  {
    id: 'content-secondary',
    label: 'Secondary text',
    group: 'Text',
    description: 'Supporting labels',
    defaultValue: '#cbd5e1',
    cssVar: '--color-ds-content-secondary',
  },
  {
    id: 'content-muted',
    label: 'Muted text',
    group: 'Text',
    description: 'Hints and units',
    defaultValue: '#94a3b8',
    cssVar: '--color-ds-content-muted',
  },
  {
    id: 'content-subtle',
    label: 'Subtle text',
    group: 'Text',
    description: 'Placeholders and dimmed text',
    defaultValue: '#64748b',
    cssVar: '--color-ds-content-subtle',
  },
  {
    id: 'content-disabled',
    label: 'Disabled text',
    group: 'Text',
    description: 'Unavailable or unchecked items',
    defaultValue: '#475569',
    cssVar: '--color-ds-content-disabled',
  },
  {
    id: 'line-subtle',
    label: 'Subtle border',
    group: 'Borders',
    description: 'Quiet dividers',
    defaultValue: '#1e293b',
    cssVar: '--color-ds-line-subtle',
  },
  {
    id: 'line',
    label: 'Border',
    group: 'Borders',
    description: 'Card and control outlines',
    defaultValue: '#334155',
    cssVar: '--color-ds-line',
  },
  {
    id: 'line-strong',
    label: 'Strong border',
    group: 'Borders',
    description: 'Emphasized outlines',
    defaultValue: '#475569',
    cssVar: '--color-ds-line-strong',
  },
  {
    id: 'primary',
    label: 'Primary',
    group: 'Accent',
    description: 'Selected states and key controls',
    defaultValue: '#38bdf8',
    cssVar: '--color-ds-primary',
  },
  {
    id: 'primary-hover',
    label: 'Primary hover',
    group: 'Accent',
    description: 'Hovered or pressed primary',
    defaultValue: '#0ea5e9',
    cssVar: '--color-ds-primary-hover',
  },
  {
    id: 'secondary',
    label: 'Secondary',
    group: 'Accent',
    description: 'Secondary highlights',
    defaultValue: '#3b82f6',
    cssVar: '--color-ds-secondary',
  },
  {
    id: 'tertiary',
    label: 'Tertiary',
    group: 'Accent',
    description: 'Third highlight color',
    defaultValue: '#10b981',
    cssVar: '--color-ds-tertiary',
  },
  {
    id: 'success',
    label: 'Success',
    group: 'Status',
    description: 'On, connected, healthy',
    defaultValue: '#10b981',
    cssVar: '--color-ds-success',
  },
  {
    id: 'warning',
    label: 'Warning',
    group: 'Status',
    description: 'Caution messages',
    defaultValue: '#f59e0b',
    cssVar: '--color-ds-warning',
  },
  {
    id: 'error',
    label: 'Error',
    group: 'Status',
    description: 'Driver alerts and failures',
    defaultValue: '#ef4444',
    cssVar: '--color-ds-error',
  },
] as const;

export const ROLE_MAP: Readonly<Record<RoleId, RoleDefinition>> = Object.freeze(
  COLOR_ROLES.reduce(
    (acc, role) => {
      acc[role.id] = role;
      return acc;
    },
    {} as Record<RoleId, RoleDefinition>
  )
);
