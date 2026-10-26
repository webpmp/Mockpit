import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { computePerspectiveCenterDashes, BASE_PERSPECTIVE_DASHES } from '../navigation/MiniNav';

describe('MiniNav Perspective Center Lane Dashes Suite', () => {
  const miniNavFilePath = path.resolve(process.cwd(), 'src/components/navigation/MiniNav.tsx');
  const miniNavContent = fs.readFileSync(miniNavFilePath, 'utf8');

  it('1. center-lane-dashes group element exists with correct stroke and round linecap', () => {
    assert.match(
      miniNavContent,
      /<g\s+id="center-lane-dashes"\s+stroke="var\(--color-ds-line-light,\s*#ffffff\)"\s+strokeLinecap="round">/,
      'center-lane-dashes group must exist with correct stroke token and rounded caps'
    );
  });

  it('2. All five perspective dashes exist with exact coordinates and stroke widths', () => {
    // Dash 0 (Closest / Bottom)
    assert.match(
      miniNavContent,
      /<line\s+x1="230"\s+y1="549\.0"\s+x2="230"\s+y2="375\.1"\s+strokeWidth="8\.0"\s*\/>/,
      'Dash 0 must match x1="230" y1="549.0" x2="230" y2="375.1" strokeWidth="8.0"'
    );

    // Dash 1
    assert.match(
      miniNavContent,
      /<line\s+x1="230"\s+y1="307\.5"\s+x2="230"\s+y2="259\.8"\s+strokeWidth="3\.9"\s*\/>/,
      'Dash 1 must match x1="230" y1="307.5" x2="230" y2="259.8" strokeWidth="3.9"'
    );

    // Dash 2
    assert.match(
      miniNavContent,
      /<line\s+x1="230"\s+y1="233\.8"\s+x2="230"\s+y2="211\.8"\s+strokeWidth="2\.6"\s*\/>/,
      'Dash 2 must match x1="230" y1="233.8" x2="230" y2="211.8" strokeWidth="2.6"'
    );

    // Dash 3
    assert.match(
      miniNavContent,
      /<line\s+x1="230"\s+y1="198\.2"\s+x2="230"\s+y2="185\.5"\s+strokeWidth="2\.0"\s*\/>/,
      'Dash 3 must match x1="230" y1="198.2" x2="230" y2="185.5" strokeWidth="2.0"'
    );

    // Dash 4 (Farthest / Top)
    assert.match(
      miniNavContent,
      /<line\s+x1="230"\s+y1="177\.1"\s+x2="230"\s+y2="168\.9"\s+strokeWidth="1\.5"\s*\/>/,
      'Dash 4 must match x1="230" y1="177.1" x2="230" y2="168.9" strokeWidth="1.5"'
    );
  });

  it('3. All dashes are aligned to the road center at x="230"', () => {
    const dashMatches = miniNavContent.match(/<line\s+x1="230"\s+y1="[^"]+"\s+x2="230"[^>]+>/g);
    assert.ok(dashMatches);
    assert.equal(dashMatches.length, 5, 'Must find exactly 5 center dashes aligned at x=230');
  });

  it('4. Perspective progression: closest dash is longest/thickest and farthest is shortest/thinnest', () => {
    const dashes = [
      { y1: 549.0, y2: 375.1, width: 8.0, length: 549.0 - 375.1 },
      { y1: 307.5, y2: 259.8, width: 3.9, length: 307.5 - 259.8 },
      { y1: 233.8, y2: 211.8, width: 2.6, length: 233.8 - 211.8 },
      { y1: 198.2, y2: 185.5, width: 2.0, length: 198.2 - 185.5 },
      { y1: 177.1, y2: 168.9, width: 1.5, length: 177.1 - 168.9 },
    ];

    for (let i = 0; i < dashes.length - 1; i++) {
      assert.ok(
        dashes[i].width > dashes[i + 1].width,
        `Dash ${i} width (${dashes[i].width}) must be thicker than Dash ${i + 1} (${dashes[i + 1].width})`
      );
      assert.ok(
        dashes[i].length > dashes[i + 1].length,
        `Dash ${i} length (${dashes[i].length}) must be longer than Dash ${i + 1} (${dashes[i + 1].length})`
      );
      assert.ok(
        dashes[i].y2 > dashes[i + 1].y1,
        `Gap exists between Dash ${i} and Dash ${i + 1}`
      );
    }
  });

  it('5. Road shading polygon remains unchanged', () => {
    assert.match(
      miniNavContent,
      /<polygon\s+id="mini-nav-road-shading"/,
      'mini-nav-road-shading polygon must remain intact'
    );
    assert.match(
      miniNavContent,
      /fill="url\(#roadGrad\)"/,
      'road shading must continue using roadGrad gradient'
    );
    assert.match(
      miniNavContent,
      /stroke="var\(--color-ds-line-strong\)"/,
      'road shading stroke must remain intact'
    );
  });

  it('6. computePerspectiveCenterDashes matches exact baseline geometry at roadOffset = 0', () => {
    const res = computePerspectiveCenterDashes(0);
    assert.equal(res.dashes.length, 5, 'Must return 5 dashes');
    assert.equal(res.enteringDash, null, 'No entering dash needed at phase 0');

    for (let i = 0; i < 5; i++) {
      assert.equal(res.dashes[i].y1, BASE_PERSPECTIVE_DASHES[i].y1);
      assert.equal(res.dashes[i].y2, BASE_PERSPECTIVE_DASHES[i].y2);
      assert.equal(res.dashes[i].strokeWidth, BASE_PERSPECTIVE_DASHES[i].strokeWidth);
      assert.equal(res.dashes[i].opacity, 1);
    }
  });

  it('7. Dashes move downward continuously during forward simulation progression', () => {
    // When roadOffset advances in forward motion (decreasing offset):
    const state0 = computePerspectiveCenterDashes(0);
    const state1 = computePerspectiveCenterDashes(-10); // 25% phase
    const state2 = computePerspectiveCenterDashes(-20); // 50% phase
    const state3 = computePerspectiveCenterDashes(-30); // 75% phase

    // Check downward progression of Dash 1, 2, 3, 4
    for (let i = 1; i < 5; i++) {
      assert.ok(
        state1.dashes[i].y1 > state0.dashes[i].y1,
        `Dash ${i} y1 at phase 0.25 must be lower (greater y) than at phase 0`
      );
      assert.ok(
        state2.dashes[i].y1 > state1.dashes[i].y1,
        `Dash ${i} y1 at phase 0.50 must be lower than at phase 0.25`
      );
      assert.ok(
        state3.dashes[i].y1 > state2.dashes[i].y1,
        `Dash ${i} y1 at phase 0.75 must be lower than at phase 0.50`
      );
    }

    // Entering dash appears at horizon once Dash 4 has cleared the horizon gap
    assert.ok(state3.enteringDash !== null, 'Entering dash is present at phase 0.75');
    assert.equal(state3.enteringDash!.y2, 168.9, 'Entering dash top is anchored at horizon');
    assert.ok(state3.enteringDash!.y1 > 168.9, 'Entering dash extends downward from horizon');
  });

  it('8. Dash cycle is synchronized with OverheadDrivingVisualization 40-unit period', () => {
    // 40 units of roadOffset corresponds to 1 full dash cycle in ODV
    const initial = computePerspectiveCenterDashes(0);
    const completedCycle = computePerspectiveCenterDashes(-39.999);

    // At the end of 1 full cycle, Dash 1 has transitioned into Dash 0's initial position
    assert.ok(
      Math.abs(completedCycle.dashes[1].y1 - initial.dashes[0].y1) < 0.2,
      'Dash 1 should arrive at Dash 0 initial y1'
    );
    assert.ok(
      Math.abs(completedCycle.dashes[1].y2 - initial.dashes[0].y2) < 0.2,
      'Dash 1 should arrive at Dash 0 initial y2'
    );
    assert.ok(
      Math.abs(completedCycle.dashes[1].strokeWidth - initial.dashes[0].strokeWidth) < 0.1,
      'Dash 1 strokeWidth should arrive at Dash 0 initial strokeWidth'
    );

    // And the entering dash at the horizon has grown into Dash 4's initial position
    assert.ok(
      Math.abs(completedCycle.enteringDash!.y1 - initial.dashes[4].y1) < 0.2,
      'Entering dash should arrive at Dash 4 initial y1'
    );
    assert.equal(completedCycle.enteringDash!.y2, initial.dashes[4].y2);
  });

  it('9. Perspective hierarchy, stroke widths, and gaps remain intact at all animation phases', () => {
    const testOffsets = [-5, -13, -20, -28, -35];

    for (const offset of testOffsets) {
      const { dashes, enteringDash } = computePerspectiveCenterDashes(offset);

      // Closest dash is longer & thicker than dash above it
      for (let i = 1; i < dashes.length - 1; i++) {
        assert.ok(
          dashes[i].strokeWidth >= dashes[i + 1].strokeWidth,
          `Dash ${i} width (${dashes[i].strokeWidth}) must be >= Dash ${i + 1} (${dashes[i + 1].strokeWidth}) at offset ${offset}`
        );
        const lenI = dashes[i].y1 - dashes[i].y2;
        const lenNext = dashes[i + 1].y1 - dashes[i + 1].y2;
        assert.ok(
          lenI > lenNext,
          `Dash ${i} length (${lenI}) must be > Dash ${i + 1} length (${lenNext}) at offset ${offset}`
        );
        assert.ok(
          dashes[i].y2 > dashes[i + 1].y1,
          `Gap must exist between Dash ${i} and Dash ${i + 1} at offset ${offset}`
        );
      }

      // Gap between Dash 4 and enteringDash
      if (enteringDash) {
        assert.ok(
          dashes[4].y2 > enteringDash.y1,
          `Gap must exist between Dash 4 and entering dash at offset ${offset}`
        );
      }
    }
  });

  it('10. Every pair of consecutive dashes maintains a visible gap (including rounded line caps) across the complete cycle', () => {
    for (let offset = 0; offset > -40; offset -= 0.5) {
      const res = computePerspectiveCenterDashes(offset);
      const active: { y1: number; y2: number; strokeWidth: number; name: string }[] = [];

      res.dashes.forEach((d, i) => {
        if (d.opacity > 0 && d.y1 > d.y2) {
          active.push({ y1: d.y1, y2: d.y2, strokeWidth: d.strokeWidth, name: `Dash ${i}` });
        }
      });
      if (res.enteringDash && res.enteringDash.opacity > 0 && res.enteringDash.y1 > res.enteringDash.y2) {
        active.push({
          y1: res.enteringDash.y1,
          y2: res.enteringDash.y2,
          strokeWidth: res.enteringDash.strokeWidth,
          name: 'Entering',
        });
      }

      // Sort bottom to top (descending y)
      active.sort((a, b) => b.y1 - a.y1);

      for (let i = 0; i < active.length - 1; i++) {
        const lower = active[i];
        const upper = active[i + 1];
        const rawGap = lower.y2 - upper.y1;
        const capLower = lower.strokeWidth / 2;
        const capUpper = upper.strokeWidth / 2;
        const visibleGap = rawGap - capLower - capUpper;

        assert.ok(
          visibleGap > 5.0,
          `Visible gap between ${lower.name} and ${upper.name} at offset ${offset} must exceed 5px (was ${visibleGap.toFixed(2)}px)`
        );
      }
    }
  });
});

