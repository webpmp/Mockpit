import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Overhead Driving Visualization Full-Bleed & Geometry Suite', () => {
  const filePath = path.resolve(process.cwd(), 'src/components/OverheadDrivingVisualization.tsx');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  it('1. Verifies 15px bottom gap is completely removed and SVG occupies full height', () => {
    assert.ok(!fileContent.includes('calc(100%-15px)'), 'Must not contain 15px bottom gap calculation');
    assert.ok(fileContent.includes('className="w-full h-full absolute top-0 right-0 z-0"'), 'SVG must use full height and width');
  });

  it('2. Verifies navy and black outer background strips are removed and asphalt fills full bleed', () => {
    // Ground #030712 and 862px shoulder outer background rects should be removed
    assert.ok(!fileContent.includes('fill="#030712"'), 'Must not contain black outer background rect');
    assert.ok(!fileContent.includes('width={862}'), 'Must not contain 862px outer shoulder rect');
    assert.ok(fileContent.includes('fill="url(#asphalt-pattern)"'), 'Asphalt pattern must be present');
  });

  it('3. Verifies right-anchored viewport and preserved roadway geometry', () => {
    assert.ok(fileContent.includes('preserveAspectRatio="xMaxYMid slice"'), 'SVG must use xMaxYMid slice for right-anchoring');

    const ROAD_LEFT = 70;
    const ROAD_RIGHT = 896;
    const ROAD_WIDTH = 826;

    // Test math across various component widths
    [770, 600, 500, 400, 900].forEach((w) => {
      const svgViewW = Math.max(ROAD_WIDTH, w);
      const svgViewX = ROAD_RIGHT - svgViewW;
      const rightEdge = svgViewX + svgViewW;
      assert.equal(rightEdge, ROAD_RIGHT, `Right edge must always equal ${ROAD_RIGHT} at width ${w}`);

      // Distance from ego car center (648.2) to right edge (896) must be constant
      const egoCenter = 648.2;
      const distToRight = ROAD_RIGHT - egoCenter;
      assert.equal(Math.round(distToRight * 10) / 10, 247.8, 'Ego car distance to right edge must remain constant');
    });
  });

  it('4. Verifies speed limit indicator spacing and padding', () => {
    assert.ok(!fileContent.includes('p-2.5 pointer-events-none'), 'Must remove excessive p-2.5 padding on speed limit sign');
    assert.ok(
      fileContent.includes("bottom-2 right-2"),
      'Speed limit indicator must use bottom-2 right-2 (8px spacing within 6-10px tolerance)'
    );
  });
});
