export interface BorderOverrides {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export const DEFAULT_BORDER_OVERRIDES: BorderOverrides = {
  top: true,
  right: true,
  bottom: true,
  left: true,
};

/**
 * Returns Tailwind border width classes based on borderOverrides.
 * If borderOverrides is undefined or null, returns the default monolithic border class.
 * If borderOverrides is provided, builds directional classes (e.g. border-t border-r ...).
 */
export function getBorderClasses(
  borderOverrides?: BorderOverrides | null,
  colorClass = 'border-slate-800',
  widthClass = 'border'
): string {
  if (!borderOverrides) {
    return `${widthClass} ${colorClass}`;
  }

  const is2 = widthClass === 'border-2';
  const classes: string[] = [];

  if (borderOverrides.top !== false) classes.push(is2 ? 'border-t-2' : 'border-t');
  if (borderOverrides.right !== false) classes.push(is2 ? 'border-r-2' : 'border-r');
  if (borderOverrides.bottom !== false) classes.push(is2 ? 'border-b-2' : 'border-b');
  if (borderOverrides.left !== false) classes.push(is2 ? 'border-l-2' : 'border-l');

  if (classes.length === 0) return '';
  return `${classes.join(' ')} ${colorClass}`;
}
