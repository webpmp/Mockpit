/**
 * Shared utility for Vehicle Exploded View content rect computation (v1.2).
 * 
 * Computes the actual on-screen rect of the image content after `object-fit: contain`
 * is applied within the container box, accounting for container padding (p-1 = 4px).
 */

export interface BoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NaturalDimensions {
  w: number;
  h: number;
}

// Global in-memory cache of image natural dimensions by image source string / URL
// (Populated synchronously or upon image load so both Editor and Presentation have immediate access)
const naturalDimensionCache = new Map<string, NaturalDimensions>();

// Default SVG defaultExplodedVehicle intrinsic viewBox is 1000x650
const DEFAULT_SVG_RATIO = 1000 / 650;

export function setCachedNaturalDimensions(imageSrc: string, dimensions: NaturalDimensions) {
  if (dimensions.w > 0 && dimensions.h > 0) {
    naturalDimensionCache.set(imageSrc, dimensions);
  }
}

export function getCachedNaturalDimensions(imageSrc: string): NaturalDimensions | null {
  if (naturalDimensionCache.has(imageSrc)) {
    return naturalDimensionCache.get(imageSrc)!;
  }
  // If it's a data:image/svg+xml SVG or default blueprint
  if (imageSrc.includes('1000') && imageSrc.includes('650')) {
    return { w: 1000, h: 650 };
  }
  return null;
}

/**
 * Computes the actual on-screen rect of the image content after object-fit: contain
 * is applied within the container box, accounting for container padding.
 */
export function getImageContentRect(
  container: BoxRect,
  natural: NaturalDimensions | null,
  paddingPx: number = 4 // matches the p-1 Tailwind class (4px); keep in sync if that class changes
): BoxRect {
  if (!natural || natural.w <= 0 || natural.h <= 0) {
    // Fallback: return full container box without crash or NaN
    return container;
  }

  const availW = Math.max(1, container.width - paddingPx * 2);
  const availH = Math.max(1, container.height - paddingPx * 2);

  const containerRatio = availW / availH;
  const imageRatio = natural.w / natural.h;

  let contentW: number;
  let contentH: number;

  if (imageRatio > containerRatio) {
    // Image is relatively wider than container -> width-constrained, letterbox top/bottom
    contentW = availW;
    contentH = availW / imageRatio;
  } else {
    // Image is relatively taller than container -> height-constrained, letterbox left/right
    contentH = availH;
    contentW = availH * imageRatio;
  }

  const contentX = container.x + paddingPx + (availW - contentW) / 2;
  const contentY = container.y + paddingPx + (availH - contentH) / 2;

  return {
    x: contentX,
    y: contentY,
    width: contentW,
    height: contentH,
  };
}
