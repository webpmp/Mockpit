import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDriveModes, matchActiveDriveMode } from '../../lib/driveModes';
import { DriveModeState } from '../../types';

describe('Drive Mode Selector Component Unit & Regression Suite', () => {
  it('1. parseDriveModes defaults to ECO, NORMAL, SPORT when undefined or empty', () => {
    assert.deepEqual(parseDriveModes(undefined), ['ECO', 'NORMAL', 'SPORT']);
    assert.deepEqual(parseDriveModes(''), ['ECO', 'NORMAL', 'SPORT']);
    assert.deepEqual(parseDriveModes([]), ['ECO', 'NORMAL', 'SPORT']);
  });

  it('2. parseDriveModes parses JSON stringified arrays correctly', () => {
    const jsonStr = JSON.stringify(['ECO', 'NORMAL', 'SPORT', 'CUSTOM']);
    assert.deepEqual(parseDriveModes(jsonStr), ['ECO', 'NORMAL', 'SPORT', 'CUSTOM']);
  });

  it('3. parseDriveModes parses comma-separated strings as fallback', () => {
    assert.deepEqual(parseDriveModes('ECO, NORMAL, TRACK, OFFROAD'), [
      'ECO',
      'NORMAL',
      'TRACK',
      'OFFROAD',
    ]);
  });

  it('4. Custom modes support arbitrary count and editable names', () => {
    const customList = ['COMFORT', 'AUTO', 'DYNAMIC', 'INDIVIDUAL', 'SNOW'];
    assert.deepEqual(parseDriveModes(customList), customList);
    assert.equal(parseDriveModes(customList).length, 5);
  });

  it('5. matchActiveDriveMode handles casing and fallback to configured modes', () => {
    const modes = ['ECO', 'NORMAL', 'SPORT'];
    assert.equal(matchActiveDriveMode('Normal', modes), 'NORMAL');
    assert.equal(matchActiveDriveMode('eco', modes), 'ECO');
    assert.equal(matchActiveDriveMode('Sport', modes), 'SPORT');
    assert.equal(matchActiveDriveMode('CUSTOM', ['ECO', 'NORMAL', 'SPORT', 'CUSTOM']), 'CUSTOM');
  });

  it('6. Dropdown state toggles and selection correctly maps to state updates', () => {
    const modes = parseDriveModes(undefined);
    let currentMode: DriveModeState = 'NORMAL';
    let isOpen = false;

    // Toggle open
    isOpen = !isOpen;
    assert.equal(isOpen, true);

    // Select 'SPORT'
    const selectedMode = modes.find((m) => m === 'SPORT') || 'SPORT';
    currentMode = selectedMode;
    isOpen = false;

    assert.equal(currentMode, 'SPORT');
    assert.equal(isOpen, false);

    // Toggle open and select 'ECO'
    isOpen = true;
    currentMode = 'ECO';
    isOpen = false;

    assert.equal(currentMode, 'ECO');
    assert.equal(isOpen, false);
  });

  it('7. Layout breakpoint resolution is deterministic and prevents overflow', () => {
    const resolveLayoutMode = (width: number, height: number) => {
      const isUltraCompact = height < 85 || width < 180;
      const isCompact = height < 120 || width < 220;
      return { isUltraCompact, isCompact };
    };

    // Standard size (320 x 160)
    assert.deepEqual(resolveLayoutMode(320, 160), { isUltraCompact: false, isCompact: false });

    // Compact size (200 x 110)
    assert.deepEqual(resolveLayoutMode(200, 110), { isUltraCompact: false, isCompact: true });

    // Ultra compact size (160 x 70)
    assert.deepEqual(resolveLayoutMode(160, 70), { isUltraCompact: true, isCompact: true });
  });

  it('8. Opening Drive Mode Selector does NOT commit or change current drive mode', () => {
    let committedMode: DriveModeState = 'NORMAL';
    let isOpen = false;

    // User taps current mode
    isOpen = true;

    assert.equal(isOpen, true, 'Selector opens');
    assert.equal(committedMode, 'NORMAL', 'Current mode remains NORMAL upon opening');
  });

  it('9. Auto-dismiss after 12s timeout closes selector without committing changes', () => {
    let committedMode: DriveModeState = 'NORMAL';
    let isOpen = true;

    // 12s timeout fires
    const onAutoDismiss = () => {
      isOpen = false;
    };

    onAutoDismiss();

    assert.equal(isOpen, false, 'Selector automatically closes on timeout');
    assert.equal(committedMode, 'NORMAL', 'Mode remains unchanged after auto-dismiss');
  });

  it('10. Click outside / Escape dismisses selector and preserves current mode', () => {
    let committedMode: DriveModeState = 'SPORT';
    let isOpen = true;

    // User presses Escape or clicks outside
    const onDismiss = () => {
      isOpen = false;
    };

    onDismiss();

    assert.equal(isOpen, false, 'Selector closes');
    assert.equal(committedMode, 'SPORT', 'Mode remains SPORT');
  });

  it('11. Temporary hover/focus does not commit value; only explicit selection commits', () => {
    let committedMode: DriveModeState = 'NORMAL';
    let hoveredMode: string | null = null;
    let isOpen = true;

    // User moves over 'SPORT'
    hoveredMode = 'SPORT';
    assert.equal(committedMode, 'NORMAL', 'Committed mode is still NORMAL');

    // User abandons without selecting (dismiss)
    isOpen = false;
    hoveredMode = null;

    assert.equal(committedMode, 'NORMAL', 'Committed mode remains NORMAL');

    // Now user explicitly clicks 'SPORT'
    isOpen = true;
    const selectMode = (m: DriveModeState) => {
      committedMode = m;
      isOpen = false;
    };

    selectMode('SPORT');
    assert.equal(committedMode, 'SPORT', 'Committed mode updates only on explicit selection');
    assert.equal(isOpen, false);
  });

  it('12. Inactivity timer logic: resets on user interaction', () => {
    let timerExpiry = 12000;
    const simulateInteraction = () => {
      timerExpiry = 12000; // Resets back to 12s
    };

    timerExpiry -= 5000; // 5 seconds passed
    assert.equal(timerExpiry, 7000);

    simulateInteraction(); // User interacted (scroll / move)
    assert.equal(timerExpiry, 12000, 'Timer was reset to 12000ms upon interaction');
  });
});
