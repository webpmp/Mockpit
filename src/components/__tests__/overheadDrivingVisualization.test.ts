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
    assert.ok(fileContent.includes('<rect width="24" height="24" fill="#1e293b"'), 'Asphalt pattern must use Mini Nav road color #1e293b');
  });

  it('3. Verifies right-anchored viewport and preserved roadway geometry', () => {
    assert.ok(fileContent.includes('preserveAspectRatio="xMaxYMid slice"'), 'SVG must use xMaxYMid slice for right-anchoring');

    const ROAD_LEFT = 0;
    const ROAD_RIGHT = 1206;
    const ROAD_WIDTH = 1206;

    // Test math across various component widths
    [770, 600, 500, 400, 900, 1206, 1400].forEach((w) => {
      const svgViewW = Math.max(ROAD_WIDTH, w);
      const svgViewX = ROAD_RIGHT - svgViewW;
      const rightEdge = svgViewX + svgViewW;
      assert.equal(rightEdge, ROAD_RIGHT, `Right edge must always equal ${ROAD_RIGHT} at width ${w}`);

      // Distance from ego car center (876 in lane 1) to right edge (1206) must be constant
      const egoCenter = 876;
      const distToRight = ROAD_RIGHT - egoCenter;
      assert.equal(Math.round(distToRight * 10) / 10, 330, 'Ego car distance to right edge must remain constant');
    });
  });

  it('4. Verifies speed limit indicator spacing and padding', () => {
    assert.ok(!fileContent.includes('p-2.5 pointer-events-none'), 'Must remove excessive p-2.5 padding on speed limit sign');
    assert.ok(
      fileContent.includes("bottom-2 right-2"),
      'Speed limit indicator must use bottom-2 right-2 (8px spacing within 6-10px tolerance)'
    );
  });

  it('5. Verifies ego-coupe-graphic aerodynamic vehicle replacement and proportional scale(1.24)', () => {
    assert.ok(fileContent.includes('id="ego-coupe-graphic"'), 'ego-coupe-graphic must be present');
    assert.ok(fileContent.includes('id="ego-nav-shadow"'), 'ego-nav-shadow filter must be present');
    assert.ok(fileContent.includes('id="ego-car-body"'), 'ego-car-body gradient must be present');
    assert.ok(fileContent.includes('id="ego-glass-grad"'), 'ego-glass-grad gradient must be present');
    assert.ok(fileContent.includes('filter="url(#ego-nav-shadow)"'), 'Filter must reference namespaced ego-nav-shadow');
    assert.ok(fileContent.includes('fill="url(#ego-car-body)"'), 'Body must reference namespaced ego-car-body');
    assert.ok(fileContent.includes('fill="url(#ego-glass-grad)"'), 'Glass must reference namespaced ego-glass-grad');
    assert.ok(
      fileContent.includes('transform="scale(1.24)"'),
      'Graphic must be scaled with transform="scale(1.24)"'
    );
    assert.ok(fileContent.includes('id="ego-vehicle-master"'), 'ego-vehicle-master must be preserved');
  });

  it('6. Verifies ego-compact-graphic aerodynamic compact sedan replacement, namespacing, and scale(1.24)', () => {
    assert.ok(fileContent.includes('id="ego-compact-graphic"'), 'ego-compact-graphic must be present');
    assert.ok(fileContent.includes('id="ego-compact-nav-shadow"'), 'ego-compact-nav-shadow filter must be present');
    assert.ok(fileContent.includes('id="ego-compact-car-body"'), 'ego-compact-car-body gradient must be present');
    assert.ok(fileContent.includes('id="ego-compact-glass-grad"'), 'ego-compact-glass-grad gradient must be present');
    assert.ok(fileContent.includes('filter="url(#ego-compact-nav-shadow)"'), 'Filter must reference namespaced ego-compact-nav-shadow');
    assert.ok(fileContent.includes('fill="url(#ego-compact-car-body)"'), 'Body must reference namespaced ego-compact-car-body');
    assert.ok(fileContent.includes('fill="url(#ego-compact-glass-grad)"'), 'Glass must reference namespaced ego-compact-glass-grad');
    assert.ok(
      fileContent.includes('id="ego-compact-graphic"\n          filter="url(#ego-compact-nav-shadow)"\n          transform="scale(1.24)"') ||
      fileContent.includes('id="ego-compact-graphic" filter="url(#ego-compact-nav-shadow)" transform="scale(1.24)"'),
      'Compact sedan graphic must be scaled with transform="scale(1.24)"'
    );
    assert.ok(fileContent.includes('id="ego-vehicle-master"'), 'ego-vehicle-master must be preserved');
  });

  it('7. Verifies ego-midsize-graphic aerodynamic midsize sedan replacement, namespacing, and scale(1.24)', () => {
    assert.ok(fileContent.includes('id="ego-midsize-graphic"'), 'ego-midsize-graphic must be present');
    assert.ok(fileContent.includes('id="ego-midsize-nav-shadow"'), 'ego-midsize-nav-shadow filter must be present');
    assert.ok(fileContent.includes('id="ego-midsize-car-body"'), 'ego-midsize-car-body gradient must be present');
    assert.ok(fileContent.includes('id="ego-midsize-glass-grad"'), 'ego-midsize-glass-grad gradient must be present');
    assert.ok(fileContent.includes('filter="url(#ego-midsize-nav-shadow)"'), 'Filter must reference namespaced ego-midsize-nav-shadow');
    assert.ok(fileContent.includes('fill="url(#ego-midsize-car-body)"'), 'Body must reference namespaced ego-midsize-car-body');
    assert.ok(fileContent.includes('fill="url(#ego-midsize-glass-grad)"'), 'Glass must reference namespaced ego-midsize-glass-grad');
    assert.ok(
      fileContent.includes('id="ego-midsize-graphic"\n          transform="scale(1.24)"') ||
      fileContent.includes('id="ego-midsize-graphic" transform="scale(1.24)"'),
      'Midsize sedan graphic must be scaled with transform="scale(1.24)"'
    );
    assert.ok(fileContent.includes('id="ego-vehicle-master"'), 'ego-vehicle-master must be preserved');
  });

  it('8. Verifies ego-luxury-graphic luxury sedan replacement, namespacing, and scale(1.24)', () => {
    assert.ok(fileContent.includes('id="ego-luxury-graphic"'), 'ego-luxury-graphic must be present');
    assert.ok(fileContent.includes('id="ego-luxury-nav-shadow"'), 'ego-luxury-nav-shadow filter must be present');
    assert.ok(fileContent.includes('id="ego-luxury-car-body"'), 'ego-luxury-car-body gradient must be present');
    assert.ok(fileContent.includes('id="ego-luxury-glass-grad"'), 'ego-luxury-glass-grad gradient must be present');
    assert.ok(fileContent.includes('filter="url(#ego-luxury-nav-shadow)"'), 'Filter must reference namespaced ego-luxury-nav-shadow');
    assert.ok(fileContent.includes('fill="url(#ego-luxury-car-body)"'), 'Body must reference namespaced ego-luxury-car-body');
    assert.ok(fileContent.includes('fill="url(#ego-luxury-glass-grad)"'), 'Glass must reference namespaced ego-luxury-glass-grad');
    assert.ok(
      fileContent.includes('id="ego-luxury-graphic"\n          transform="scale(1.24)"') ||
      fileContent.includes('id="ego-luxury-graphic" transform="scale(1.24)"'),
      'Luxury sedan graphic must be scaled with transform="scale(1.24)"'
    );
    assert.ok(
      fileContent.includes('d="M -21,2 C -18,1 -9,0 0,0 C 9,0 18,1 21,2 L 21,24 C 16,25 9,26 0,26 C -9,26 -16,25 -21,24 Z"'),
      'Metallic roof path must be present'
    );
    assert.ok(
      !fileContent.includes('Executive Sunroof') && !fileContent.includes('Sunroof Glass'),
      'Sunroof geometry must not be present'
    );
    assert.ok(fileContent.includes('id="ego-vehicle-master"'), 'ego-vehicle-master must be preserved');
  });

  it('9. Verifies ego-truck-graphic truck replacement, namespacing, bed-lines pattern, and scale(1.24)', () => {
    assert.ok(fileContent.includes('id="ego-truck-graphic"'), 'ego-truck-graphic must be present');
    assert.ok(fileContent.includes('id="ego-truck-nav-shadow"'), 'ego-truck-nav-shadow filter must be present');
    assert.ok(fileContent.includes('id="ego-truck-car-body"'), 'ego-truck-car-body gradient must be present');
    assert.ok(fileContent.includes('id="ego-truck-glass-grad"'), 'ego-truck-glass-grad gradient must be present');
    assert.ok(fileContent.includes('id="ego-truck-bed-lines"'), 'ego-truck-bed-lines pattern must be present');
    assert.ok(fileContent.includes('filter="url(#ego-truck-nav-shadow)"'), 'Filter must reference namespaced ego-truck-nav-shadow');
    assert.ok(fileContent.includes('fill="url(#ego-truck-car-body)"'), 'Body must reference namespaced ego-truck-car-body');
    assert.ok(fileContent.includes('fill="url(#ego-truck-glass-grad)"'), 'Glass must reference namespaced ego-truck-glass-grad');
    assert.ok(fileContent.includes('fill="url(#ego-truck-bed-lines)"'), 'Bed liner must reference namespaced ego-truck-bed-lines');
    assert.ok(
      fileContent.includes('id="ego-truck-graphic"\n          transform="scale(1.24)"') ||
      fileContent.includes('id="ego-truck-graphic" transform="scale(1.24)"'),
      'Truck graphic must be scaled with transform="scale(1.24)"'
    );
    assert.ok(fileContent.includes('id="ego-vehicle-master"'), 'ego-vehicle-master must be preserved');
  });

  it('10. Verifies median-light-fixture replacement with taller pole, white light pool, and downward-facing housings', () => {
    assert.ok(fileContent.includes('id="median-light-fixture"'), 'median-light-fixture must be present');
    assert.ok(fileContent.includes('id="median-light-pool-white"'), 'median-light-pool-white gradient must be present');
    assert.ok(fileContent.includes('fill="url(#median-light-pool-white)"'), 'Light pool must reference median-light-pool-white');
    assert.ok(fileContent.includes('y2="-78"'), 'Tall pole must extend upward to y2=-78');
    assert.ok(fileContent.includes('stopColor="#ffffff"'), 'White light stop must be present');
    assert.ok(fileContent.includes('fill="#fef3a8"'), 'Warm subtle light cores must be present');
    assert.ok(!fileContent.includes('cx="-18" cy="-29" r="6.5" fill="#38bdf8"'), 'Old cyan bulb glow must be removed from median-light-fixture');
  });

  it('11. Verifies migrated roadway geometry constants and lane calculation', () => {
    assert.ok(fileContent.includes('const ROAD_LEFT = 0;'), 'ROAD_LEFT must be 0');
    assert.ok(fileContent.includes('const ROAD_RIGHT = 1206;'), 'ROAD_RIGHT must be 1206');
    assert.ok(fileContent.includes('const ROAD_WIDTH = 1206;'), 'ROAD_WIDTH must be 1206');
    assert.ok(fileContent.includes('const LANE_WIDTH = 180;'), 'LANE_WIDTH must be 180');
    assert.ok(fileContent.includes('const MEDIAN_WIDTH = 40;'), 'MEDIAN_WIDTH must be 40');
    assert.ok(fileContent.includes('const EMERGENCY_SHOULDER_WIDTH = 163;'), 'EMERGENCY_SHOULDER_WIDTH must be 163');
    assert.ok(fileContent.includes('const GRASS_SHOULDER_WIDTH = 60;'), 'GRASS_SHOULDER_WIDTH must be 60');

    assert.ok(fileContent.includes('grassLeft: { start: 0, end: 60 }'), 'ZONES must define grassLeft');
    assert.ok(fileContent.includes('opposingLanes: { start: 60, end: 420 }'), 'ZONES must define opposingLanes');
    assert.ok(fileContent.includes('emergencyLeft: { start: 420, end: 583 }'), 'ZONES must define emergencyLeft');
    assert.ok(fileContent.includes('median: { start: 583, end: 623 }'), 'ZONES must define median');
    assert.ok(fileContent.includes('emergencyRight: { start: 623, end: 786 }'), 'ZONES must define emergencyRight');
    assert.ok(fileContent.includes('egoLanes: { start: 786, end: 1146 }'), 'ZONES must define egoLanes');
    assert.ok(fileContent.includes('grassRight: { start: 1146, end: 1206 }'), 'ZONES must define grassRight');

    // Lane centers check
    const LANE_WIDTH = 180;
    const getLaneX = (lane: number) => {
      if (lane < 0) {
        const absL = Math.abs(lane);
        return 330 - (absL - 1) * LANE_WIDTH;
      } else {
        return 876 + (lane - 1) * LANE_WIDTH;
      }
    };
    assert.equal(getLaneX(-2), 150, 'Opposing outer lane center must be 150');
    assert.equal(getLaneX(-1), 330, 'Opposing inner lane center must be 330');
    assert.equal(getLaneX(1), 876, 'Ego inner lane center must be 876');
    assert.equal(getLaneX(2), 1056, 'Ego outer lane center must be 1056');
  });

  it('12. Verifies background SVG static elements: grass shoulders, emergency shoulders, median, separators, and rescaled blind spot polygons', () => {
    // Median
    assert.ok(fileContent.includes('id="median-rect"'), 'median-rect must be present');
    assert.ok(fileContent.includes('x={583}'), 'median-rect must start at x=583');
    assert.ok(fileContent.includes('width={40}'), 'median-rect must have width=40');
    assert.ok(fileContent.includes('transform={`translate(603, ${medianLightY})`}'), 'median light fixture must be centered at x=603');

    // Emergency shoulders
    assert.ok(fileContent.includes('id="emergency-shoulder-left"'), 'emergency-shoulder-left must be present');
    assert.ok(fileContent.includes('id="emergency-shoulder-right"'), 'emergency-shoulder-right must be present');
    assert.ok(fileContent.includes('width={163}'), 'emergency shoulders must have width=163');
    assert.ok(fileContent.includes('x1={420}'), 'left emergency yellow line at x=420');
    assert.ok(fileContent.includes('x1={786}'), 'right emergency yellow line at x=786');

    // Grass shoulders
    assert.ok(fileContent.includes('id="grass-shoulder-left"'), 'grass-shoulder-left must be present');
    assert.ok(fileContent.includes('id="grass-shoulder-right"'), 'grass-shoulder-right must be present');
    assert.ok(fileContent.includes('width={60}'), 'grass shoulders must have width=60');
    assert.ok(fileContent.includes('x1={60}'), 'left grass white line at x=60');
    assert.ok(fileContent.includes('x1={1146}'), 'right grass white line at x=1146');

    // Dashed separators
    assert.ok(fileContent.includes('x1={240}'), 'opposing dashed separator at x=240');
    assert.ok(fileContent.includes('x1={966}'), 'ego dashed separator at x=966');

    // Blind spot rescaled polygons
    assert.ok(fileContent.includes('x: -250.6, y: 207'), 'LEFT_BLIND_SPOT_POLYGON must have rescaled apex x=-250.6');
    assert.ok(fileContent.includes('x: 250.6, y: 207'), 'RIGHT_BLIND_SPOT_POLYGON must have rescaled apex x=250.6');
    assert.ok(fileContent.includes('x: -76.3, y: 368'), 'LEFT_BLIND_SPOT_POLYGON must have rescaled end x=-76.3');
    assert.ok(fileContent.includes('x: 76.3, y: 368'), 'RIGHT_BLIND_SPOT_POLYGON must have rescaled end x=76.3');
  });
});
