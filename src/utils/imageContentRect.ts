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

export interface ArtworkRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BeforeImageLayout {
  left: number;
  top: number;
  width: number;
  height: number;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
}

import {
  DEFAULT_EXPLODED_IMAGE_URL,
  DEFAULT_BEFORE_IMAGE_URL,
  DEFAULT_EXPLODED_NATURAL,
} from './explodedViewImages';

export const DEFAULT_BEFORE_NATURAL: NaturalDimensions = { w: 1024, h: 1024 };

/**
 * Measured visible vehicle artwork bounding boxes:
 * - Exploded view (1408x768): vehicle body reference spans [236, 120, 1172, 649] -> 936 x 529
 *   (The central assembled vehicle body/chassis reference, before components explode outward)
 * - Before standard view (1024x1024): vehicle artwork spans [44, 248, 980, 777] -> 936 x 529
 *   (Centered at 512, 512.5 within 1024x1024; vehicle width 936, height 529)
 */
export const DEFAULT_EXPLODED_ARTWORK: ArtworkRect = {
  x: 236,
  y: 120,
  width: 936,
  height: 529,
};

export const DEFAULT_BEFORE_ARTWORK: ArtworkRect = {
  x: 44,
  y: 248,
  width: 936,
  height: 529,
};

// Global in-memory cache of image natural dimensions by image source string / URL
const naturalDimensionCache = new Map<string, NaturalDimensions>();

// Pre-seed natural-dimensions cache for default images
naturalDimensionCache.set(DEFAULT_EXPLODED_IMAGE_URL, DEFAULT_EXPLODED_NATURAL);
naturalDimensionCache.set(DEFAULT_BEFORE_IMAGE_URL, DEFAULT_BEFORE_NATURAL);

export function setCachedNaturalDimensions(imageSrc: string, dimensions: NaturalDimensions) {
  if (dimensions.w > 0 && dimensions.h > 0) {
    const existing = naturalDimensionCache.get(imageSrc);
    // Never allow a lower-resolution / downsampled preview or canvas to overwrite true natural dimensions
    if (!existing || (dimensions.w >= existing.w && dimensions.h >= existing.h)) {
      naturalDimensionCache.set(imageSrc, dimensions);
    }
  }
}

export function getCachedNaturalDimensions(imageSrc: string): NaturalDimensions | null {
  if (naturalDimensionCache.has(imageSrc)) {
    return naturalDimensionCache.get(imageSrc)!;
  }
  return null;
}

// Global in-memory cache of artwork bounding boxes by image source string / URL
const artworkBoundsCache = new Map<string, ArtworkRect>();
artworkBoundsCache.set(DEFAULT_EXPLODED_IMAGE_URL, DEFAULT_EXPLODED_ARTWORK);
artworkBoundsCache.set(DEFAULT_BEFORE_IMAGE_URL, DEFAULT_BEFORE_ARTWORK);

export function setCachedArtworkBounds(imageSrc: string, bounds: ArtworkRect) {
  if (bounds.width > 0 && bounds.height > 0) {
    artworkBoundsCache.set(imageSrc, bounds);
  }
}

export function getCachedArtworkBounds(imageSrc: string): ArtworkRect | null {
  if (artworkBoundsCache.has(imageSrc)) {
    return artworkBoundsCache.get(imageSrc)!;
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

/**
 * Derives the exact layout (scale, position, and dimensions) for the Before vehicle image
 * within the authoritative Exploded View frame.
 * 
 * Sizing & Alignment Guarantees:
 * 1. The visible Before vehicle artwork matches the Exploded View vehicle artwork width.
 * 2. Original aspect ratio of the Before image is 100% preserved (uniform scaling).
 * 3. The Before vehicle artwork center aligns precisely with the Exploded View vehicle center.
 * 4. The Exploded View geometry and connector target coordinate system remain completely untouched.
 */
export function getBeforeImageLayout(
  frame: { width: number; height: number },
  explodedNatural?: NaturalDimensions | null,
  beforeNatural?: NaturalDimensions | null,
  explodedArtwork?: ArtworkRect | null,
  beforeArtwork?: ArtworkRect | null
): BeforeImageLayout {
  const expNat = explodedNatural && explodedNatural.w > 0 && explodedNatural.h > 0
    ? explodedNatural
    : DEFAULT_EXPLODED_NATURAL;

  const befNat = beforeNatural && beforeNatural.w > 0 && beforeNatural.h > 0
    ? beforeNatural
    : DEFAULT_BEFORE_NATURAL;

  const expArt = explodedArtwork && explodedArtwork.width > 0 && explodedArtwork.height > 0
    ? explodedArtwork
    : DEFAULT_EXPLODED_ARTWORK;

  const befArt = beforeArtwork && beforeArtwork.width > 0 && beforeArtwork.height > 0
    ? beforeArtwork
    : DEFAULT_BEFORE_ARTWORK;

  // On-screen visible artwork dimensions for the Exploded (After) vehicle
  const afterArtWOnScreen = (expArt.width / expNat.w) * frame.width;
  const afterArtCXOnScreen = ((expArt.x + expArt.width / 2) / expNat.w) * frame.width;
  const afterArtCYOnScreen = ((expArt.y + expArt.height / 2) / expNat.h) * frame.height;

  // Scale the Before image uniformly so visible artwork width matches the Exploded view vehicle artwork width
  const scale = afterArtWOnScreen / befArt.width;

  // Total rendered dimensions of the Before image element (preserving aspect ratio)
  const renderedW = befNat.w * scale;
  const renderedH = befNat.h * scale;

  // Center of the Before artwork in before-image pixel space
  const befArtCXInImg = befArt.x + befArt.width / 2;
  const befArtCYInImg = befArt.y + befArt.height / 2;

  // Position the Before image within the exploded frame so its artwork center aligns with Exploded artwork center
  const renderedX = afterArtCXOnScreen - befArtCXInImg * scale;
  const renderedY = afterArtCYOnScreen - befArtCYInImg * scale;

  return {
    left: renderedX,
    top: renderedY,
    width: renderedW,
    height: renderedH,
    leftPercent: (renderedX / frame.width) * 100,
    topPercent: (renderedY / frame.height) * 100,
    widthPercent: (renderedW / frame.width) * 100,
    heightPercent: (renderedH / frame.height) * 100,
  };
}
