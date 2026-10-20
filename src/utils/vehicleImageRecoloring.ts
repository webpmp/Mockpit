import { useState, useEffect, useRef } from 'react';
import { EgoVehicleColors } from '../types';

export const DEFAULT_EGO_COLORS = {
  body: '#1f2937',
  trim: '#2d3748',
  windows: '#0d131a',
  lights: '#fef08a',
};

/**
 * Validates a 3-character or 6-character hexadecimal color string.
 */
export function isValidHexColor(hex?: string | null): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/**
 * Converts a valid hex color string to RGB tuple [0..255].
 */
export function hexToRgb(hex: string, fallback: [number, number, number] = [31, 41, 55]): [number, number, number] {
  if (!isValidHexColor(hex)) return fallback;
  let clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

/**
 * Photometric luminance-preserving tone transfer.
 * Preserves the exact surface shading, contours, reflections, and specular highlights
 * of the original photographic render instead of applying a flat overlay.
 */
export function applyLuminance(
  r0: number,
  g0: number,
  b0: number,
  targetR: number,
  targetG: number,
  targetB: number
): [number, number, number] {
  const L0 = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
  let r: number, g: number, b: number;
  if (L0 < 128) {
    const factor = L0 / 128;
    r = Math.round(targetR * factor);
    g = Math.round(targetG * factor);
    b = Math.round(targetB * factor);
  } else {
    const factor = (L0 - 128) / 127;
    r = Math.round(targetR + (255 - targetR) * factor);
    g = Math.round(targetG + (255 - targetG) * factor);
    b = Math.round(targetB + (255 - targetB) * factor);
  }
  return [
    Math.min(255, Math.max(0, r)),
    Math.min(255, Math.max(0, g)),
    Math.min(255, Math.max(0, b)),
  ];
}

// In-memory cache for processed images to prevent recomputation during animation/movement
const MAX_CACHE_ENTRIES = 60;
const recoloredCache = new Map<string, string>();
const imageElementCache = new Map<string, Promise<HTMLImageElement>>();

export function isVehicleColorsCustomized(
  colors?: EgoVehicleColors,
  original?: EgoVehicleColors
): boolean {
  if (!colors) return false;
  const hasAnyValid = Boolean(
    isValidHexColor(colors.body) ||
    isValidHexColor(colors.trim) ||
    isValidHexColor(colors.windows) ||
    isValidHexColor(colors.lights)
  );
  if (!hasAnyValid) return false;
  if (!original) return true;
  if (isValidHexColor(colors.body) && colors.body!.toLowerCase() !== original.body?.toLowerCase()) return true;
  if (isValidHexColor(colors.trim) && colors.trim!.toLowerCase() !== original.trim?.toLowerCase()) return true;
  if (isValidHexColor(colors.windows) && colors.windows!.toLowerCase() !== original.windows?.toLowerCase()) return true;
  if (isValidHexColor(colors.lights) && colors.lights!.toLowerCase() !== original.lights?.toLowerCase()) return true;
  return false;
}

function getCacheKey(
  imageUrl: string,
  colors?: EgoVehicleColors,
  original?: EgoVehicleColors
): string {
  const b = isValidHexColor(colors?.body) ? colors!.body! : (original?.body || DEFAULT_EGO_COLORS.body);
  const t = isValidHexColor(colors?.trim) ? colors!.trim! : (original?.trim || DEFAULT_EGO_COLORS.trim);
  const w = isValidHexColor(colors?.windows) ? colors!.windows! : (original?.windows || DEFAULT_EGO_COLORS.windows);
  const l = isValidHexColor(colors?.lights) ? colors!.lights! : (original?.lights || DEFAULT_EGO_COLORS.lights);
  return `${imageUrl}|${b.toLowerCase()}|${t.toLowerCase()}|${w.toLowerCase()}|${l.toLowerCase()}`;
}

function loadSourceImage(url: string): Promise<HTMLImageElement> {
  let p = imageElementCache.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
    imageElementCache.set(url, p);
  }
  return p;
}

/**
 * Performs region-based pixel recoloring on an ImageData buffer.
 * Maps:
 * - Body -> user Body Color
 * - Windows -> user Window Color
 * - Trim & Accents -> user Trim Color
 * - Headlights & Taillights -> user Light Color
 */
export function recolorImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colors?: EgoVehicleColors,
  originalColors?: EgoVehicleColors
): void {
  const fallbackBody = originalColors?.body || DEFAULT_EGO_COLORS.body;
  const fallbackTrim = originalColors?.trim || DEFAULT_EGO_COLORS.trim;
  const fallbackWindows = originalColors?.windows || DEFAULT_EGO_COLORS.windows;
  const fallbackLights = originalColors?.lights || DEFAULT_EGO_COLORS.lights;

  const bRgb = hexToRgb(isValidHexColor(colors?.body) ? colors!.body! : fallbackBody, [31, 41, 55]);
  const tRgb = hexToRgb(isValidHexColor(colors?.trim) ? colors!.trim! : fallbackTrim, [45, 55, 72]);
  const wRgb = hexToRgb(isValidHexColor(colors?.windows) ? colors!.windows! : fallbackWindows, [13, 19, 26]);
  const lRgb = hexToRgb(isValidHexColor(colors?.lights) ? colors!.lights! : fallbackLights, [254, 240, 138]);

  for (let y = 0; y < height; y++) {
    const relY = y / height;
    for (let x = 0; x < width; x++) {
      const relX = x / width;
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a === 0) continue; // Skip transparent background

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      let target = bRgb;

      // 1. Headlights (front nose corners, bright highlights/reflections)
      if (
        relY >= 0.04 &&
        relY <= 0.20 &&
        ((relX >= 0.12 && relX <= 0.35) || (relX >= 0.65 && relX <= 0.88)) &&
        (lum > 170 || (r > 200 && g > 200))
      ) {
        target = lRgb;
      }
      // 2. Taillights (rear corners and rear light strip)
      else if (
        relY >= 0.88 &&
        relY <= 0.98 &&
        (relX >= 0.14 && relX <= 0.86) &&
        ((r > 120 && r > g * 1.4) || (lum > 185 && relY >= 0.92))
      ) {
        target = lRgb;
      }
      // 3. Windows (cabin glass, windshield, rear glass)
      else if (
        relY >= 0.22 &&
        relY <= 0.70 &&
        relX >= 0.18 &&
        relX <= 0.82 &&
        (
          (b > r + 6 && b > g) ||
          (relY >= 0.26 && relY <= 0.45 && lum < 115 && relX >= 0.23 && relX <= 0.77) ||
          (relY >= 0.55 && relY <= 0.68 && lum < 115 && relX >= 0.23 && relX <= 0.77)
        )
      ) {
        target = wRgb;
      }
      // 4. Trim (side mirrors, tire arches, dark outlines)
      else if (
        (relY >= 0.30 && relY <= 0.46 && (relX <= 0.20 || relX >= 0.80)) ||
        (((relY >= 0.16 && relY <= 0.28) || (relY >= 0.68 && relY <= 0.82)) &&
          (relX <= 0.18 || relX >= 0.82) &&
          lum < 65) ||
        (lum < 32 && a > 150)
      ) {
        target = tRgb;
      }
      // 5. Body (primary panels)
      else {
        target = bRgb;
      }

      const [nR, nG, nB] = applyLuminance(r, g, b, target[0], target[1], target[2]);
      data[idx] = nR;
      data[idx + 1] = nG;
      data[idx + 2] = nB;
      // Alpha is strictly preserved intact
    }
  }
}

/**
 * Asynchronously generates a recolored vehicle PNG data URL.
 * Automatically checks and populates the in-memory cache.
 * Returns the original imageUrl directly if no custom colors differ from default.
 */
export async function getRecoloredVehicleUrl(
  imageUrl: string,
  colors?: EgoVehicleColors,
  originalColors?: EgoVehicleColors
): Promise<string> {
  if (typeof document === 'undefined' || !imageUrl) {
    return imageUrl;
  }

  // Preserve pristine original source asset when not customized
  if (!isVehicleColorsCustomized(colors, originalColors)) {
    return imageUrl;
  }

  const cacheKey = getCacheKey(imageUrl, colors, originalColors);
  const cached = recoloredCache.get(cacheKey);
  if (cached) return cached;

  try {
    const img = await loadSourceImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 340;
    canvas.height = img.naturalHeight || img.height || 670;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageUrl;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    recolorImageData(imgData.data, canvas.width, canvas.height, colors, originalColors);
    ctx.putImageData(imgData, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');

    // Manage cache size
    if (recoloredCache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = recoloredCache.keys().next().value;
      if (firstKey) recoloredCache.delete(firstKey);
    }
    recoloredCache.set(cacheKey, dataUrl);

    // Release canvas
    canvas.width = 0;
    canvas.height = 0;

    return dataUrl;
  } catch (err) {
    console.warn('Failed to recolor vehicle image, falling back to original:', err);
    return imageUrl;
  }
}

/**
 * React hook to retrieve a recolored vehicle image URL.
 * Immediately returns original source image if uncustomized;
 * otherwise uses cached or asynchronously recolored canvas version.
 */
export function useRecoloredVehicleImage(
  imageUrl: string,
  colors?: EgoVehicleColors,
  originalColors?: EgoVehicleColors
): string {
  const isCustomized = isVehicleColorsCustomized(colors, originalColors);
  const cacheKey = isCustomized ? getCacheKey(imageUrl, colors, originalColors) : imageUrl;
  const cached = isCustomized ? recoloredCache.get(cacheKey) : imageUrl;

  const [activeUrl, setActiveUrl] = useState<string>(cached || imageUrl);
  const lastKeyRef = useRef<string>(cacheKey);

  useEffect(() => {
    if (!isCustomized || !imageUrl) {
      setActiveUrl(imageUrl);
      return;
    }

    let isCancelled = false;
    const currentKey = getCacheKey(imageUrl, colors, originalColors);
    lastKeyRef.current = currentKey;

    const hit = recoloredCache.get(currentKey);
    if (hit) {
      setActiveUrl(hit);
      return;
    }

    getRecoloredVehicleUrl(imageUrl, colors, originalColors).then((url) => {
      if (!isCancelled && lastKeyRef.current === currentKey) {
        setActiveUrl(url);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    imageUrl,
    isCustomized,
    colors?.body,
    colors?.trim,
    colors?.windows,
    colors?.lights,
    originalColors?.body,
    originalColors?.trim,
    originalColors?.windows,
    originalColors?.lights,
  ]);

  return isCustomized ? activeUrl : imageUrl;
}
