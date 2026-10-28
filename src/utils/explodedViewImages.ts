import { ComponentInstance } from '../types';

export const DEFAULT_EXPLODED_IMAGE_URL = '/vehicles/exploded-after.png';
export const DEFAULT_BEFORE_IMAGE_URL = '/vehicles/exploded-before.png';
export const DEFAULT_EXPLODED_NATURAL = { w: 1408, h: 768 };
export const EXPLODE_TRANSITION_MS = 350;

/**
 * Resolves the source URL for the exploded vehicle image.
 * `resolvedImageUrl` is an optional binding-resolved override used by the widget.
 */
export function getExplodedImageSrc(
  comp?: { staticProps?: Record<string, string> } | null,
  resolvedImageUrl?: string
): string {
  return resolvedImageUrl || comp?.staticProps?.imageUrl || DEFAULT_EXPLODED_IMAGE_URL;
}

/**
 * Resolves the source URL for the before (standard) vehicle image,
 * or returns null when there is no before state (per rule 2).
 */
export function getBeforeImageSrc(
  comp?: { staticProps?: Record<string, string> } | null
): string | null {
  if (comp?.staticProps?.beforeImageUrl) {
    return comp.staticProps.beforeImageUrl;
  }
  if (!comp?.staticProps?.imageUrl) {
    return DEFAULT_BEFORE_IMAGE_URL;
  }
  return null;
}

/**
 * Determines whether the exploded view chassis should display its exploded state
 * based on whether the currently active presentation callout connects to this exploded view.
 */
export function isExplodedViewActive(
  explodedId: string,
  activeCalloutId: string | null,
  screenComponents: ComponentInstance[]
): boolean {
  if (!activeCalloutId) return false;
  const callout = screenComponents.find((c) => c.id === activeCalloutId);
  return (
    callout?.type === 'vehicleStatusCallout' &&
    callout.connector?.targetComponentId === explodedId
  );
}
