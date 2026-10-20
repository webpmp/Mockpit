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

/**
 * Extracts a normalized vehicle ID from an image URL or file path.
 */
export function extractVehicleIdFromUrl(imageUrl?: string | null): string {
  if (!imageUrl) return 'spyder';
  const filename = imageUrl.split('/').pop() || '';
  return filename
    .replace(/\.png$/i, '')
    .replace(/^odv-/i, '')
    .toLowerCase();
}

/**
 * Known mapping from original body color hex to vehicle ID for fallback resolution.
 */
const ORIGINAL_HEX_TO_ID: Record<string, string> = {
  '#94393a': 'spyder',
  '#2563eb': 'corvette',
  '#973d3d': 'coupe',
  '#a2a4a9': 'crossover',
  '#a3a5aa': 'crossover-glass',
  '#c5a059': 'cybercab',
  '#8d9094': 'modely',
  '#e2e8f0': 'roadster',
  '#2e5076': 'sedan',
  '#f1f5f9': 'semi',
  '#3b5846': 'sportswagon',
  '#3a5846': 'suv',
  '#2c4f76': 'suv-blue',
  '#616162': 'truck',
};

function inferVehicleId(originalColors?: EgoVehicleColors): string {
  if (originalColors?.body && ORIGINAL_HEX_TO_ID[originalColors.body.toLowerCase()]) {
    return ORIGINAL_HEX_TO_ID[originalColors.body.toLowerCase()];
  }
  return 'spyder';
}

/**
 * Determines whether a specific pixel in an ODV vehicle image belongs to a painted body panel.
 * Excludes:
 * - Transparent background
 * - Windows (windshield, rear glass, side windows, panoramic glass roofs)
 * - Tires, wheels, and wheel wells
 * - Black/dark trim, side mirror stems, radiator grilles, diffusers, shutlines, deep shadows
 * - Headlights, taillights, and reflector lenses
 */
export function isVehicleBodyPixel(
  vehicleId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
  a: number,
  lum: number
): boolean {
  // 1. Transparent or semi-transparent background
  if (a < 50) return false;

  const relX = x / width;
  const relY = y / height;
  const id = (vehicleId || 'spyder').toLowerCase();

  // 2. Deep shadows, black trim, weatherstrips, window seals, shutlines
  if (lum < 28) return false;

  // 3. Extreme specular reflections (chrome or sun glare on glass / tips)
  if (lum > 250 && Math.abs(r - g) < 5 && Math.abs(g - b) < 5) return false;

  // 4. Special tractor-trailer geometry for Tesla Semi
  if (id === 'semi') {
    // Windshield glass
    if (relY >= 0.12 && relY <= 0.29 && relX >= 0.18 && relX <= 0.82) {
      if (lum < 140 || b > r + 5) return false;
    }
    // Rear chassis frame, fifth wheel, and rear tandem dual wheels
    if (relY >= 0.69) {
      if (lum < 85 || relX <= 0.25 || relX >= 0.75) return false;
    }
    // Steer axle front wheels
    if (relY >= 0.18 && relY <= 0.28 && (relX <= 0.16 || relX >= 0.84)) return false;
    // Front bumper
    if (relY < 0.04) return false;
    return lum >= 45;
  }

  // 5. Wheels, tires, and wheel wells for standard vehicles
  const isFrontWheel = relY >= 0.15 && relY <= 0.28 && (relX <= 0.17 || relX >= 0.83);
  const isRearWheel = relY >= 0.67 && relY <= 0.83 && (relX <= 0.17 || relX >= 0.83);
  if (isFrontWheel || isRearWheel) {
    if (lum < 75 || (Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && lum < 95)) return false;
  }

  // 6. Side mirrors (black stems & glass)
  if (relY >= 0.32 && relY <= 0.44 && (relX <= 0.14 || relX >= 0.86)) {
    if (lum < 55) return false;
  }

  // 7. Lower front grille / bumper splitter
  if (relY <= 0.04 && lum < 60) return false;

  // 8. Rear diffuser / lower bumper
  if (relY >= 0.94 && lum < 55) return false;

  // 9. Windshield
  const isWindshieldArea = relY >= 0.25 && relY <= 0.41 && relX >= 0.18 && relX <= 0.82;
  if (isWindshieldArea) {
    if (lum < 110 || (b > r + 4 && b > g) || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && lum < 125)) {
      return false;
    }
  }

  // 10. Rear window / hatch glass
  const isRearWindowArea = relY >= 0.57 && relY <= 0.72 && relX >= 0.20 && relX <= 0.80;
  if (isRearWindowArea && id !== 'truck') {
    if (lum < 95 || b > r + 3 || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && lum < 115)) {
      return false;
    }
  }

  // 11. Side window glass
  const isSideWindowArea = relY >= 0.33 && relY <= 0.66 && ((relX >= 0.16 && relX <= 0.27) || (relX >= 0.73 && relX <= 0.84));
  if (isSideWindowArea) {
    if (lum < 75 || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && lum < 90)) {
      return false;
    }
  }

  // 12. Full panoramic glass roof vehicles
  if (id === 'crossover-glass' || id === 'modely' || id === 'cybercab' || id === 'roadster' || id === 'suv-blue') {
    const isRoofGlass = relY >= 0.38 && relY <= 0.60 && relX >= 0.22 && relX <= 0.78;
    if (isRoofGlass) {
      if (lum < 85 || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && lum < 95)) {
        return false;
      }
    }
  }

  // 13. Truck open bedliner
  if (id === 'truck') {
    const isTruckBed = relY >= 0.53 && relY <= 0.86 && relX >= 0.22 && relX <= 0.78;
    if (isTruckBed) return false;
  }

  // 14. Spyder open cockpit / soft top
  if (id === 'spyder') {
    const isCockpit = relY >= 0.40 && relY <= 0.67 && relX >= 0.22 && relX <= 0.78;
    if (isCockpit) {
      if (lum < 85) return false;
    }
  }

  // 15. Front corner headlights
  if (relY >= 0.05 && relY <= 0.16 && ((relX >= 0.12 && relX <= 0.26) || (relX >= 0.74 && relX <= 0.88))) {
    if (lum > 185 && Math.abs(r - b) < 20) return false;
  }

  // 16. Rear red taillights
  if (relY >= 0.90 && relY <= 0.98 && r > g * 1.5 && r > 100) {
    return false;
  }

  // 17. Vehicles with colored paint: must be part of the painted body hue
  if (
    id === 'corvette' ||
    id === 'coupe' ||
    id === 'spyder' ||
    id === 'sedan' ||
    id === 'suv-blue' ||
    id === 'suv' ||
    id === 'sportswagon' ||
    id === 'cybercab'
  ) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max > 0 ? (max - min) / max : 0;
    if (sat < 0.10 && lum < 100) return false;
  }

  return true;
}

/**
 * Determines whether a specific pixel belongs to the vehicle's glass / window areas.
 */
export function isVehicleWindowPixel(
  vehicleId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
  a: number,
  lum: number
): boolean {
  if (a < 50) return false;
  const relX = x / width;
  const relY = y / height;
  const id = (vehicleId || 'spyder').toLowerCase();

  // Special Semi windshield
  if (id === 'semi') {
    if (relY >= 0.12 && relY <= 0.29 && relX >= 0.18 && relX <= 0.82) {
      if (lum < 140 || b > r + 5) return true;
    }
    return false;
  }

  // Windshield
  if (relY >= 0.25 && relY <= 0.41 && relX >= 0.18 && relX <= 0.82) {
    if (lum < 110 || (b > r + 4 && b > g) || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && lum < 125)) {
      return true;
    }
  }

  // Rear window / hatch glass
  if (relY >= 0.57 && relY <= 0.72 && relX >= 0.20 && relX <= 0.80 && id !== 'truck') {
    if (lum < 95 || b > r + 3 || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && lum < 115)) {
      return true;
    }
  }

  // Side window glass
  if (relY >= 0.33 && relY <= 0.66 && ((relX >= 0.16 && relX <= 0.27) || (relX >= 0.73 && relX <= 0.84))) {
    if (lum < 75 || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && lum < 90)) {
      return true;
    }
  }

  // Panoramic roof glass
  if (id === 'crossover-glass' || id === 'modely' || id === 'cybercab' || id === 'roadster' || id === 'suv-blue') {
    if (relY >= 0.38 && relY <= 0.60 && relX >= 0.22 && relX <= 0.78) {
      if (lum < 85 || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && lum < 95)) {
        return true;
      }
    }
  }

  return false;
}

// In-memory cache for processed images to prevent recomputation during animation/movement
const MAX_CACHE_ENTRIES = 60;
const recoloredCache = new Map<string, string>();
const imageElementCache = new Map<string, Promise<HTMLImageElement>>();

/**
 * Checks whether custom colors have been applied that differ from the vehicle's original body color.
 */
export function isVehicleColorsCustomized(
  colors?: EgoVehicleColors,
  original?: EgoVehicleColors
): boolean {
  if (!colors) return false;
  if (isValidHexColor(colors.body) && (!original?.body || colors.body.toLowerCase() !== original.body.toLowerCase())) return true;
  if (isValidHexColor(colors.windows) && (!original?.windows || colors.windows.toLowerCase() !== original.windows.toLowerCase())) return true;
  if (isValidHexColor(colors.trim) && (!original?.trim || colors.trim.toLowerCase() !== original.trim.toLowerCase())) return true;
  if (isValidHexColor(colors.lights) && (!original?.lights || colors.lights.toLowerCase() !== original.lights.toLowerCase())) return true;
  return false;
}

/**
 * Checks specifically whether the underlying PNG image requires canvas recoloring (body or windows).
 * Headlights are rendered as vector overlays and do not require image recoloring.
 */
export function isVehicleImageCustomized(
  colors?: EgoVehicleColors,
  original?: EgoVehicleColors
): boolean {
  if (!colors) return false;
  if (isValidHexColor(colors.body) && (!original?.body || colors.body.toLowerCase() !== original.body.toLowerCase())) return true;
  if (isValidHexColor(colors.windows) && (!original?.windows || colors.windows.toLowerCase() !== original.windows.toLowerCase())) return true;
  return false;
}

function getCacheKey(
  imageUrl: string,
  colors?: EgoVehicleColors,
  original?: EgoVehicleColors
): string {
  const b = isValidHexColor(colors?.body) ? colors!.body! : (original?.body || DEFAULT_EGO_COLORS.body);
  const w = isValidHexColor(colors?.windows) ? colors!.windows! : (original?.windows || DEFAULT_EGO_COLORS.windows);
  return `${imageUrl}|${b.toLowerCase()}|${w.toLowerCase()}`;
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
 * Performs high-precision body-panel recoloring on an ImageData buffer.
 * Recolors ONLY the painted body panels to the specified Body Color,
 * preserving original shading, highlights, reflections, and 3D contours.
 * Windows, tires, wheels, trim, lights, and transparent backgrounds remain completely untouched.
 */
export function recolorImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colors?: EgoVehicleColors,
  originalColors?: EgoVehicleColors,
  vehicleId?: string
): void {
  const hasCustomBody = isValidHexColor(colors?.body) &&
    (!originalColors?.body || colors.body.toLowerCase() !== originalColors.body.toLowerCase());

  const hasCustomWindow = isValidHexColor(colors?.windows) &&
    (!originalColors?.windows || colors.windows.toLowerCase() !== originalColors.windows.toLowerCase());

  // If neither body nor window is customized, preserve original pixels untouched
  if (!hasCustomBody && !hasCustomWindow) {
    return;
  }

  const targetBodyHex = hasCustomBody
    ? colors!.body!
    : (originalColors?.body || DEFAULT_EGO_COLORS.body);
  const targetBodyRgb = hexToRgb(targetBodyHex, [31, 41, 55]);

  const targetWindowHex = hasCustomWindow
    ? colors!.windows!
    : (originalColors?.windows || DEFAULT_EGO_COLORS.windows);
  const targetWindowRgb = hexToRgb(targetWindowHex, [13, 19, 26]);

  const vId = vehicleId || inferVehicleId(originalColors);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a === 0) continue; // Skip transparent background

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Handle window color if customized
      if (hasCustomWindow && isVehicleWindowPixel(vId, x, y, width, height, r, g, b, a, lum)) {
        const [nR, nG, nB] = applyLuminance(r, g, b, targetWindowRgb[0], targetWindowRgb[1], targetWindowRgb[2]);
        data[idx] = nR;
        data[idx + 1] = nG;
        data[idx + 2] = nB;
        continue;
      }

      // Only recolor pixels that belong to painted body panels if custom body requested
      if (hasCustomBody && isVehicleBodyPixel(vId, x, y, width, height, r, g, b, a, lum)) {
        const [nR, nG, nB] = applyLuminance(r, g, b, targetBodyRgb[0], targetBodyRgb[1], targetBodyRgb[2]);
        data[idx] = nR;
        data[idx + 1] = nG;
        data[idx + 2] = nB;
      }
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
  if (!isVehicleImageCustomized(colors, originalColors)) {
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

    const vId = extractVehicleIdFromUrl(imageUrl);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    recolorImageData(imgData.data, canvas.width, canvas.height, colors, originalColors, vId);
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
  const isCustomized = isVehicleImageCustomized(colors, originalColors);
  const cacheKey = isCustomized ? getCacheKey(imageUrl, colors, originalColors) : imageUrl;
  const cached = isCustomized ? recoloredCache.get(cacheKey) : imageUrl;

  const [activeUrl, setActiveUrl] = useState<string>(cached || imageUrl);
  const [currentKey, setCurrentKey] = useState<string>(cacheKey);

  // Synchronously reset when key changes to prevent stale image flash from previous vehicle
  if (cacheKey !== currentKey) {
    setCurrentKey(cacheKey);
    setActiveUrl(cached || imageUrl);
  }

  useEffect(() => {
    if (!isCustomized || !imageUrl) {
      return;
    }

    let isCancelled = false;
    const hit = recoloredCache.get(cacheKey);
    if (hit) {
      setActiveUrl(hit);
      return;
    }

    getRecoloredVehicleUrl(imageUrl, colors, originalColors).then((url) => {
      if (!isCancelled) {
        setActiveUrl(url);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [cacheKey, isCustomized, imageUrl, colors?.body, colors?.windows, originalColors?.body, originalColors?.windows]);

  if (!isCustomized || !imageUrl) {
    return imageUrl;
  }

  return activeUrl && currentKey === cacheKey ? activeUrl : (cached || imageUrl);
}
