const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputDir = path.join(__dirname, '../public/vehicles');
const outputDir = path.join(__dirname, '../public/vehicles/processed');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Clean Chroma-Key Alpha Matting & Solid Interior Color Propagation Pipeline
 * 1. Estimates continuous alpha matte from original cyan background key (#00FFFF / rgb(0, 253, 253)).
 * 2. Preserves crisp, natural anti-aliased edge silhouette (no erosion, no Gaussian blur on alpha channel).
 * 3. Decontaminates cyan key spill from edge RGB values.
 * 4. Propagates solid interior vehicle surface RGB colors to low-alpha edge transition pixels (a < 0.85).
 *    This completely eliminates bright edge highlights/fringes/halos, allowing the vehicle to blend seamlessly into the canvas.
 * 5. Preserves exact pixel dimensions, 3D shading details, vehicle geometry, and internal image sharpness.
 */
function processVehicleFile(filename) {
  const inputPath = path.join(inputDir, filename);
  if (!fs.existsSync(inputPath)) {
    console.error(`Source asset not found: ${inputPath}`);
    return;
  }

  const buffer = fs.readFileSync(inputPath);
  const png = PNG.sync.read(buffer);
  const width = png.width;
  const height = png.height;

  // Pure Cyan Key Color (#00FFFF)
  const kR = 0, kG = 253, kB = 253;

  const aMap = new Float32Array(width * height);
  const rMap = new Float32Array(width * height);
  const gMap = new Float32Array(width * height);
  const bMap = new Float32Array(width * height);

  // 1. Raw continuous alpha matte & initial RGB color decontamination
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pIdx = idx << 2;
      const r = png.data[pIdx];
      const g = png.data[pIdx + 1];
      const b = png.data[pIdx + 2];

      let cyanness = 0;
      if (g > r || b > r) {
        const diffG = Math.max(0, g - r);
        const diffB = Math.max(0, b - r);
        cyanness = (diffG + diffB) / 480;
      }
      cyanness = Math.min(1.0, Math.max(0.0, cyanness));

      let alpha = 1.0 - cyanness;
      if (alpha < 0.03) alpha = 0;

      aMap[idx] = alpha;

      if (alpha > 0) {
        const safeA = Math.max(0.15, alpha);
        let fgR = Math.max(0, Math.min(255, (r - (1 - safeA) * kR) / safeA));
        let fgG = Math.max(0, Math.min(255, (g - (1 - safeA) * kG) / safeA));
        let fgB = Math.max(0, Math.min(255, (b - (1 - safeA) * kB) / safeA));

        // Sanitize cyan spill: G and B should not exceed R by more than 10
        fgG = Math.min(fgR + 10, fgG);
        fgB = Math.min(fgR + 10, fgB);

        rMap[idx] = fgR;
        gMap[idx] = fgG;
        bMap[idx] = fgB;
      }
    }
  }

  // 2. Solid interior color propagation for edge transition pixels (a < 0.85)
  // Replaces edge RGB values with the nearest solid interior vehicle surface RGB (a >= 0.85),
  // ensuring zero bright highlight/halo artifact on outer boundary pixels while preserving exact alpha anti-aliasing.
  const finalR = new Float32Array(rMap);
  const finalG = new Float32Array(gMap);
  const finalB = new Float32Array(bMap);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const a = aMap[idx];
      if (a > 0 && a < 0.85) {
        let bestDist = 999;
        let solidR = rMap[idx], solidG = gMap[idx], solidB = bMap[idx];
        const radius = 6;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              if (aMap[nIdx] >= 0.85) {
                const dist = dx * dx + dy * dy;
                if (dist < bestDist) {
                  bestDist = dist;
                  solidR = rMap[nIdx];
                  solidG = gMap[nIdx];
                  solidB = bMap[nIdx];
                }
              }
            }
          }
        }
        if (bestDist < 999) {
          finalR[idx] = solidR;
          finalG[idx] = solidG;
          finalB[idx] = solidB;
        }
      }
    }
  }

  // 3. Assemble clean output PNG
  const outPng = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) {
    const pIdx = i << 2;
    const alphaVal = Math.round(aMap[i] * 255);

    if (alphaVal === 0) {
      outPng.data[pIdx] = 0;
      outPng.data[pIdx + 1] = 0;
      outPng.data[pIdx + 2] = 0;
      outPng.data[pIdx + 3] = 0;
    } else {
      outPng.data[pIdx] = Math.round(finalR[i]);
      outPng.data[pIdx + 1] = Math.round(finalG[i]);
      outPng.data[pIdx + 2] = Math.round(finalB[i]);
      outPng.data[pIdx + 3] = alphaVal;
    }
  }

  const outBuffer = PNG.sync.write(outPng);
  fs.writeFileSync(path.join(outputDir, filename), outBuffer);
  console.log(`Successfully processed ${filename} (${width}x${height}) -> public/vehicles/processed/${filename}`);
}

// Process all 16 vehicle files
for (let i = 1; i <= 16; i++) {
  const numStr = i < 10 ? `0${i}` : `${i}`;
  processVehicleFile(`vehicle-${numStr}.png`);
}
console.log('All 16 vehicle assets successfully processed.');

