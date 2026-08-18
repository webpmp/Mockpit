/**
 * Vehicle Exploded View - Background Color-Key Removal Processor (v1.1)
 *
 * Client-side canvas-based background keying:
 * 1. Auto-detects the background color by sampling corner pixel regions.
 * 2. Handles corner variations by computing consensus / median RGB values.
 * 3. Calculates Euclidean color distance per pixel.
 * 4. Applies tolerance threshold with smooth edge anti-aliasing to key out the background.
 */

interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// In-memory cache for processed images to ensure 60fps slider adjustments and instant re-renders
const processedImageCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 120;

/**
 * Samples a corner region of size NxN and calculates the average RGBA
 */
function sampleCorner(
  data: Uint8ClampedArray,
  width: number,
  startX: number,
  startY: number,
  sizeX: number,
  sizeY: number
): ColorRGBA {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumA = 0;
  let count = 0;

  for (let y = startY; y < startY + sizeY; y++) {
    for (let x = startX; x < startX + sizeX; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a > 10) {
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        sumA += a;
        count++;
      }
    }
  }

  if (count === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r: Math.round(sumR / count),
    g: Math.round(sumG / count),
    b: Math.round(sumB / count),
    a: Math.round(sumA / count),
  };
}

/**
 * Detects the dominant background color by analyzing all 4 corners
 */
export function detectBackgroundColor(data: Uint8ClampedArray, width: number, height: number): ColorRGBA {
  const size = Math.max(3, Math.min(12, Math.floor(Math.min(width, height) / 16)));

  const corners: ColorRGBA[] = [
    // Top-Left
    sampleCorner(data, width, 0, 0, size, size),
    // Top-Right
    sampleCorner(data, width, Math.max(0, width - size), 0, size, size),
    // Bottom-Left
    sampleCorner(data, width, 0, Math.max(0, height - size), size, size),
    // Bottom-Right
    sampleCorner(data, width, Math.max(0, width - size), Math.max(0, height - size), size, size),
  ];

  // Filter out fully transparent corners
  const nonTransparent = corners.filter((c) => c.a > 20);

  if (nonTransparent.length === 0) {
    return { r: 255, g: 255, b: 255, a: 255 };
  }

  if (nonTransparent.length === 1) {
    return nonTransparent[0];
  }

  // Check agreement between corners (Euclidean RGB distance < 45)
  const agreementScores = nonTransparent.map((c1, i) => {
    let score = 0;
    nonTransparent.forEach((c2, j) => {
      if (i !== j) {
        const dist = Math.sqrt(
          (c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2
        );
        if (dist < 45) score++;
      }
    });
    return { corner: c1, score };
  });

  // Sort by highest agreement
  agreementScores.sort((a, b) => b.score - a.score);

  // If there is agreement, average the corners that agree with the leader
  const bestCorner = agreementScores[0].corner;
  const agreeingCorners = nonTransparent.filter((c) => {
    const dist = Math.sqrt(
      (c.r - bestCorner.r) ** 2 + (c.g - bestCorner.g) ** 2 + (c.b - bestCorner.b) ** 2
    );
    return dist < 45;
  });

  let avgR = 0;
  let avgG = 0;
  let avgB = 0;
  agreeingCorners.forEach((c) => {
    avgR += c.r;
    avgG += c.g;
    avgB += c.b;
  });

  return {
    r: Math.round(avgR / agreeingCorners.length),
    g: Math.round(avgG / agreeingCorners.length),
    b: Math.round(avgB / agreeingCorners.length),
    a: 255,
  };
}

/**
 * Processes an image using an offscreen canvas and applies color-key background removal
 */
export async function processImageBackgroundRemoval(
  imageUrl: string,
  tolerance: number // 0 - 100
): Promise<string> {
  // Generate cache key
  const cacheKey = `${imageUrl.length}_${imageUrl.slice(0, 80)}_${tolerance}`;
  if (processedImageCache.has(cacheKey)) {
    return processedImageCache.get(cacheKey)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Cap max processing dimension for ultra-fast, smooth execution
        let targetW = img.naturalWidth || img.width || 800;
        let targetH = img.naturalHeight || img.height || 600;

        const maxDim = 1200;
        if (targetW > maxDim || targetH > maxDim) {
          const ratio = Math.min(maxDim / targetW, maxDim / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        // Detect background color
        const bgColor = detectBackgroundColor(data, targetW, targetH);

        // Calculate distance threshold based on tolerance (0 - 100)
        // Max RGB Euclidean distance = sqrt(255^2 + 255^2 + 255^2) ≈ 441.67
        // At 0%: threshold = 3 (exact matches)
        // At 25%: threshold = ~58 (clean cutout of solid / slight gradients)
        // At 50%: threshold = ~113 (standard)
        // At 100%: threshold = ~223 (aggressive, starts keying into light tones)
        const threshold = (tolerance / 100) * 220 + 3;
        const feather = Math.max(2, Math.min(14, threshold * 0.22));

        const bgR = bgColor.r;
        const bgG = bgColor.g;
        const bgB = bgColor.b;

        const len = data.length;
        for (let i = 0; i < len; i += 4) {
          const a = data[i + 3];
          if (a === 0) continue;

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Euclidean color distance in 3D RGB space
          const dist = Math.sqrt(
            (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
          );

          if (dist <= threshold - feather) {
            // Full transparent
            data[i + 3] = 0;
          } else if (dist < threshold) {
            // Smooth anti-aliased edge
            const alphaFactor = (dist - (threshold - feather)) / feather;
            data[i + 3] = Math.round(a * alphaFactor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const resultDataUrl = canvas.toDataURL('image/png');

        // Manage cache size
        if (processedImageCache.size >= MAX_CACHE_ENTRIES) {
          const firstKey = processedImageCache.keys().next().value;
          if (firstKey) processedImageCache.delete(firstKey);
        }
        processedImageCache.set(cacheKey, resultDataUrl);

        resolve(resultDataUrl);
      } catch (err) {
        console.error('Failed to process image background removal', err);
        resolve(imageUrl); // Fallback safely to original
      }
    };

    img.onerror = (err) => {
      console.warn('Failed to load image for background keying', err);
      resolve(imageUrl); // Fallback safely to original
    };

    img.src = imageUrl;
  });
}
