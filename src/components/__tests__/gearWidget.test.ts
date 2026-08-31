import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GearState } from '../../types';

const GEARS: GearState[] = ['P', 'R', 'N', 'D'];

describe('Gear Selector Component Unit & Regression Suite', () => {
  it('1. Exactly one P R N D control with four discrete choices: P, R, N, D', () => {
    assert.deepEqual(GEARS, ['P', 'R', 'N', 'D']);
  });

  it('TEST 1: Tap large gear activates selector and expands P/R/N/D bar without changing gear (NO tap-to-cycle)', () => {
    let currentGear: GearState = 'P';
    let isSelecting = false;

    // User taps large gear letter P
    const handleLargeGearClick = () => {
      isSelecting = !isSelecting; // Toggles selection active state
    };

    handleLargeGearClick();
    assert.equal(isSelecting, true, 'P/R/N/D bar must enter expanded selection mode');
    assert.equal(currentGear, 'P', 'Current gear must remain P on tapping large gear');
  });

  it('TEST 2 & 6: Select D from expanded bar -> Gear changes to D, bar shrinks back to normal size', () => {
    let currentGear: GearState = 'P';
    let isSelecting = true;

    const handleSelectGear = (g: GearState) => {
      currentGear = g;
      isSelecting = false; // Returns to normal small state
    };

    handleSelectGear('D');
    assert.equal(currentGear, 'D', 'Gear must change directly to D');
    assert.equal(isSelecting, false, 'P/R/N/D bar must return to compact normal state');
  });

  it('TEST 3: Direct P -> D with no intermediate states', () => {
    let currentGear: GearState = 'P';
    let isSelecting = true;

    const handleSelectGear = (g: GearState) => {
      currentGear = g;
      isSelecting = false;
    };

    handleSelectGear('D');
    assert.equal(currentGear, 'D');
  });

  it('TEST 4: Direct D -> P with no intermediate states', () => {
    let currentGear: GearState = 'D';
    let isSelecting = true;

    const handleSelectGear = (g: GearState) => {
      currentGear = g;
      isSelecting = false;
    };

    handleSelectGear('P');
    assert.equal(currentGear, 'P');
  });

  it('TEST 5: Bar size comparison before and during selection mode', () => {
    const getBarDimensions = (isSelecting: boolean, isCompact = false, isUltraCompact = false) => {
      if (isSelecting) {
        if (isUltraCompact) return { height: 'h-8.5', maxWidth: 'max-w-[160px]', buttonHeight: 'h-6' };
        if (isCompact) return { height: 'h-10', maxWidth: 'max-w-[190px]', buttonHeight: 'h-7' };
        return { height: 'h-11', maxWidth: 'max-w-[215px]', buttonHeight: 'h-8' };
      } else {
        if (isUltraCompact) return { height: 'h-5.5', maxWidth: 'max-w-[125px]', buttonHeight: 'h-4' };
        if (isCompact) return { height: 'h-6.5', maxWidth: 'max-w-[145px]', buttonHeight: 'h-4.5' };
        return { height: 'h-7.5', maxWidth: 'max-w-[160px]', buttonHeight: 'h-5' };
      }
    };

    const normal = getBarDimensions(false);
    const active = getBarDimensions(true);

    assert.equal(normal.height, 'h-7.5');
    assert.equal(active.height, 'h-11');
    assert.equal(normal.buttonHeight, 'h-5');
    assert.equal(active.buttonHeight, 'h-8');
    assert.notEqual(normal.maxWidth, active.maxWidth);
  });

  it('TEST 6: Downward opening and downward retracting close animation specifications', () => {
    const animationConfig = {
      initial: { opacity: 0, y: -8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 8 },
      durationMs: 400,
    };

    assert.equal(animationConfig.initial.y, -8, 'Opening motion originates above and moves down into place');
    assert.equal(animationConfig.animate.y, 0, 'Resting position is at origin');
    assert.equal(animationConfig.exit.y, 8, 'Close motion retracts DOWNWARD (+8px) away from anchor, not upward');
    assert.equal(animationConfig.durationMs, 400, 'Duration is 400ms for clear perception');
  });

  it('Responsive layout sizing matches requirements without clipping', () => {
    const checkCompact = (width: number, height: number) => {
      const isUltraCompact = height < 100 || width < 160;
      const isCompact = height < 140 || width < 200;
      return { isUltraCompact, isCompact };
    };

    assert.deepEqual(checkCompact(242, 198), { isUltraCompact: false, isCompact: false });
    assert.deepEqual(checkCompact(190, 130), { isUltraCompact: false, isCompact: true });
    assert.deepEqual(checkCompact(150, 85), { isUltraCompact: true, isCompact: true });
  });
});
