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
 * Returns Tailwind corner radius override classes based on borderOverrides.
 * When an edge's border is disabled (false), the corners adjacent to that edge
 * are flattened (e.g. rounded-t-none, rounded-b-none, rounded-none) so that
 * integrated (bordered-off) components sit completely flush with no curved
 * corners leaking through at shared seams.
 */
export function getCornerRadiusClasses(
  borderOverrides?: BorderOverrides | null
): string {
  if (!borderOverrides) {
    return '';
  }

  const { top, right, bottom, left } = borderOverrides;

  // If all borders are disabled, completely square off all corners
  if (top === false && right === false && bottom === false && left === false) {
    return 'rounded-none';
  }

  const classes: string[] = [];

  if (top === false) classes.push('rounded-t-none');
  if (bottom === false) classes.push('rounded-b-none');
  if (left === false) classes.push('rounded-l-none');
  if (right === false) classes.push('rounded-r-none');

  return classes.join(' ');
}

// Aliases for flexibility and explicit naming
export const getCornerClasses = getCornerRadiusClasses;
export const getBorderRadiusClasses = getCornerRadiusClasses;

/**
 * Returns Tailwind border width classes based on borderOverrides, along with
 * corner radius override classes (e.g. rounded-t-none) to prevent rounded
 * corners from leaking through at integrated, borderless edges.
 * If borderOverrides is undefined or null, returns the default monolithic border class.
 * If borderOverrides is provided, builds directional classes (e.g. border-t border-r ...)
 * and attaches corresponding corner radius overrides.
 */
export function getBorderClasses(
  borderOverrides?: BorderOverrides | null,
  colorClass = 'border-slate-800',
  widthClass = 'border',
  includeCorners = true
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

  const borderString = colorClass ? `${classes.join(' ')} ${colorClass}` : classes.join(' ');

  if (includeCorners) {
    const cornerClasses = getCornerRadiusClasses(borderOverrides);
    if (cornerClasses) {
      return `${borderString} ${cornerClasses}`;
    }
  }

  return borderString;
}
