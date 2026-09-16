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
 * with optional alpha-edge softness / feathering.
 */
export async function processImageBackgroundRemoval(
  imageUrl: string,
  tolerance: number, // 0 - 100
  edgeSoftness: number = 0 // 0 - 100
): Promise<string> {
  // Generate cache key including edgeSoftness
  const cacheKey = `${imageUrl.length}_${imageUrl.slice(0, 80)}_${tolerance}_${edgeSoftness}`;
  if (processedImageCache.has(cacheKey)) {
    return processedImageCache.get(cacheKey)!;
  }

  // Guard for server-side or non-DOM test environments
  if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') {
    return imageUrl;
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

        // Apply Edge Softness if > 0: operates exclusively on the alpha mask
        if (edgeSoftness > 0) {
          const radius = Math.max(1, Math.min(12, Math.round((edgeSoftness / 100) * 11 + 1)));
          const totalPixels = targetW * targetH;
          const alphaIn = new Uint8Array(totalPixels);
          const alphaOut = new Uint8Array(totalPixels);

          for (let p = 0; p < totalPixels; p++) {
            alphaIn[p] = data[p * 4 + 3];
          }

          // Horizontal 1D box blur pass on alpha
          for (let y = 0; y < targetH; y++) {
            const rowOffset = y * targetW;
            let windowSum = 0;
            let windowCount = 0;

            // Pre-seed window from x = -radius to +radius
            for (let k = -radius; k <= radius; k++) {
              if (k >= 0 && k < targetW) {
                windowSum += alphaIn[rowOffset + k];
                windowCount++;
              }
            }

            for (let x = 0; x < targetW; x++) {
              alphaOut[rowOffset + x] = Math.round(windowSum / windowCount);

              // Slide window to x + 1
              const removeX = x - radius;
              if (removeX >= 0) {
                windowSum -= alphaIn[rowOffset + removeX];
                windowCount--;
              }
              const addX = x + radius + 1;
              if (addX < targetW) {
                windowSum += alphaIn[rowOffset + addX];
                windowCount++;
              }
            }
          }

          // Vertical 1D box blur pass on alpha
          for (let x = 0; x < targetW; x++) {
            let windowSum = 0;
            let windowCount = 0;

            for (let k = -radius; k <= radius; k++) {
              if (k >= 0 && k < targetH) {
                windowSum += alphaOut[k * targetW + x];
                windowCount++;
              }
            }

            for (let y = 0; y < targetH; y++) {
              const pixelIdx = y * targetW + x;
              const blurredAlpha = Math.round(windowSum / windowCount);
              const origAlpha = alphaIn[pixelIdx];

              // Composite original RGB with softened alpha channel:
              // For fully interior subject pixels (origAlpha === 255), retain solid subject opacity
              // For pixels along the transparency edge, apply feathered alpha.
              if (origAlpha === 0) {
                // Background pixel: slight soft halo feathering capped to avoid background spill
                data[pixelIdx * 4 + 3] = Math.min(blurredAlpha, Math.round((edgeSoftness / 100) * 120));
              } else if (origAlpha === 255) {
                // Interior pixel: preserve crisp subject opacity
                data[pixelIdx * 4 + 3] = 255;
              } else {
                // Edge / transition pixel: blend original keyed alpha with blurred alpha
                const blend = edgeSoftness / 100;
                data[pixelIdx * 4 + 3] = Math.round(origAlpha * (1 - blend) + blurredAlpha * blend);
              }

              // Slide window to y + 1
              const removeY = y - radius;
              if (removeY >= 0) {
                windowSum -= alphaOut[removeY * targetW + x];
                windowCount--;
              }
              const addY = y + radius + 1;
              if (addY < targetH) {
                windowSum += alphaOut[addY * targetW + x];
                windowCount++;
              }
            }
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
