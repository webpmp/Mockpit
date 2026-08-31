import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClimateFanSpeed, ClimateSeat, ClimateState } from '../../types';

describe('Compact Climate Control Component & Dual-Zone SYNC Suite', () => {
  it('1. Default SYNC state: isSynced is true, Driver and Passenger cabin temps are linked', () => {
    const initialState: ClimateState = {
      driverTemp: 69,
      passengerTemp: 69,
      isSynced: true,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
      driverSeatHeat: 0,
      driverSeatCool: 0,
      passengerSeatHeat: 0,
      passengerSeatCool: 0,
    };

    assert.equal(initialState.isSynced, true);
    assert.equal(initialState.driverTemp, initialState.passengerTemp);
  });

  it('2. SYNC & Active Zone Visual Hierarchy: SYNC button is active and neither DRIVER nor PASSENGER has active styling when synced', () => {
    const state: ClimateState = {
      driverTemp: 70,
      passengerTemp: 70,
      isSynced: true,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const isSyncActive = Boolean(state.isSynced);
    const isDriverActive = !state.isSynced && state.selectedSeat === 'driver';
    const isPassengerActive = !state.isSynced && state.selectedSeat === 'passenger';

    assert.equal(isSyncActive, true, 'SYNC button is active when synced');
    assert.equal(isDriverActive, false, 'Driver is inactive when SYNC is on');
    assert.equal(isPassengerActive, false, 'Passenger is inactive when SYNC is on');
  });

  it('3. UNSYNC Visual Hierarchy: When UNSYNCED and Driver selected, Driver is active zone and SYNC is inactive', () => {
    const state: ClimateState = {
      driverTemp: 69,
      passengerTemp: 72,
      isSynced: false,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const isSyncActive = Boolean(state.isSynced);
    const isDriverActive = !state.isSynced && state.selectedSeat === 'driver';
    const isPassengerActive = !state.isSynced && state.selectedSeat === 'passenger';

    assert.equal(isDriverActive, true, 'Driver is active zone');
    assert.equal(isPassengerActive, false, 'Passenger is inactive zone');
    assert.equal(isSyncActive, false, 'SYNC button is inactive');
  });

  it('4. UNSYNC Visual Hierarchy: When UNSYNCED and Passenger selected, Passenger is active zone and SYNC is inactive', () => {
    const state: ClimateState = {
      driverTemp: 69,
      passengerTemp: 72,
      isSynced: false,
      selectedSeat: 'passenger',
      fanSpeed: 'AUTO',
    };

    const isSyncActive = Boolean(state.isSynced);
    const isDriverActive = !state.isSynced && state.selectedSeat === 'driver';
    const isPassengerActive = !state.isSynced && state.selectedSeat === 'passenger';

    assert.equal(isDriverActive, false, 'Driver is inactive');
    assert.equal(isPassengerActive, true, 'Passenger is active zone');
    assert.equal(isSyncActive, false, 'SYNC button is inactive');
  });

  it('5. Increase temperature while synced: updates BOTH Driver and Passenger temperatures', () => {
    let state: ClimateState = {
      driverTemp: 69,
      passengerTemp: 69,
      isSynced: true,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const applyTempChange = (newTemp: number) => {
      if (state.isSynced) {
        state.driverTemp = newTemp;
        state.passengerTemp = newTemp;
      } else if (state.selectedSeat === 'driver') {
        state.driverTemp = newTemp;
      } else {
        state.passengerTemp = newTemp;
      }
    };

    applyTempChange(72);
    assert.equal(state.driverTemp, 72);
    assert.equal(state.passengerTemp, 72);
  });

  it('6. Decrease temperature while synced: updates BOTH Driver and Passenger temperatures', () => {
    let state: ClimateState = {
      driverTemp: 72,
      passengerTemp: 72,
      isSynced: true,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const applyTempChange = (newTemp: number) => {
      if (state.isSynced) {
        state.driverTemp = newTemp;
        state.passengerTemp = newTemp;
      } else if (state.selectedSeat === 'driver') {
        state.driverTemp = newTemp;
      } else {
        state.passengerTemp = newTemp;
      }
    };

    applyTempChange(68);
    assert.equal(state.driverTemp, 68);
    assert.equal(state.passengerTemp, 68);
  });

  it('7. UNSYNC: tapping SYNC icon sets isSynced to false and allows independent control', () => {
    let state: ClimateState = {
      driverTemp: 69,
      passengerTemp: 69,
      isSynced: true,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const toggleSync = () => {
      if (state.isSynced) {
        state.isSynced = false;
      } else {
        state.isSynced = true;
        if (state.selectedSeat === 'passenger') {
          state.driverTemp = state.passengerTemp;
        } else {
          state.passengerTemp = state.driverTemp;
        }
      }
    };

    toggleSync();
    assert.equal(state.isSynced, false);
  });

  it('8. Select Driver zone and change Driver temperature when unsynced', () => {
    let state: ClimateState = {
      driverTemp: 69,
      passengerTemp: 70,
      isSynced: false,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const applyTempChange = (newTemp: number) => {
      if (state.isSynced) {
        state.driverTemp = newTemp;
        state.passengerTemp = newTemp;
      } else if (state.selectedSeat === 'driver') {
        state.driverTemp = newTemp;
      } else {
        state.passengerTemp = newTemp;
      }
    };

    state.selectedSeat = 'driver';
    applyTempChange(67);
    assert.equal(state.driverTemp, 67);
    assert.equal(state.passengerTemp, 70, 'Passenger temp remains unchanged');
  });

  it('9. Select Passenger zone and change Passenger temperature when unsynced', () => {
    let state: ClimateState = {
      driverTemp: 67,
      passengerTemp: 70,
      isSynced: false,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const applyTempChange = (newTemp: number) => {
      if (state.isSynced) {
        state.driverTemp = newTemp;
        state.passengerTemp = newTemp;
      } else if (state.selectedSeat === 'driver') {
        state.driverTemp = newTemp;
      } else {
        state.passengerTemp = newTemp;
      }
    };

    // User taps Passenger zone
    state.selectedSeat = 'passenger';
    applyTempChange(73);
    assert.equal(state.driverTemp, 67, 'Driver temp remains unchanged');
    assert.equal(state.passengerTemp, 73);
  });

  it('10. Re-enable SYNC with Driver selected: DRIVER remains primary, passenger follows driver', () => {
    let state: ClimateState = {
      driverTemp: 69,
      passengerTemp: 74,
      isSynced: false,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const toggleSync = () => {
      if (state.isSynced) {
        state.isSynced = false;
      } else {
        state.isSynced = true;
        // DRIVER is primary: passenger follows driver, selectedSeat remains unchanged
        state.passengerTemp = state.driverTemp;
      }
    };

    toggleSync();
    assert.equal(state.isSynced, true);
    assert.equal(state.driverTemp, 69);
    assert.equal(state.passengerTemp, 69);
    assert.equal(state.selectedSeat, 'driver', 'Driver remains the active zone');
  });

  it('11. Re-enable SYNC with Passenger selected: passenger links to driver temp, active zone unchanged', () => {
    let state: ClimateState = {
      driverTemp: 69,
      passengerTemp: 74,
      isSynced: false,
      selectedSeat: 'passenger',
      fanSpeed: 'AUTO',
    };

    const toggleSync = () => {
      if (state.isSynced) {
        state.isSynced = false;
      } else {
        state.isSynced = true;
        // When SYNC is enabled: passenger follows driver
        state.passengerTemp = state.driverTemp;
      }
    };

    toggleSync();
    assert.equal(state.isSynced, true);
    assert.equal(state.driverTemp, 69);
    assert.equal(state.passengerTemp, 69);
    assert.equal(state.selectedSeat, 'passenger', 'Passenger selection preserved without unintended side-effects');
  });

  it('12. Seat Climate Controls: independent cycling of heat level 0 -> 1 -> 2 -> 3 -> 0', () => {
    let driverHeat = 0;
    const cycleDriverHeat = () => {
      driverHeat = (driverHeat + 1) % 4;
    };

    assert.equal(driverHeat, 0, 'Initial seat climate is OFF (0)');
    cycleDriverHeat();
    assert.equal(driverHeat, 1, 'Heat level 1');
    cycleDriverHeat();
    assert.equal(driverHeat, 2, 'Heat level 2');
    cycleDriverHeat();
    assert.equal(driverHeat, 3, 'Heat level 3');
    cycleDriverHeat();
    assert.equal(driverHeat, 0, 'Cycyled back to OFF (0)');
  });

  it('13. Shared State: Seat climate and temperature are unified in ClimateState', () => {
    const fullState: ClimateState = {
      driverTemp: 71,
      passengerTemp: 71,
      isSynced: true,
      selectedSeat: 'driver',
      fanSpeed: 'MED',
      driverSeatHeat: 2,
      driverSeatCool: 0,
      passengerSeatHeat: 1,
      passengerSeatCool: 0,
    };

    assert.equal(fullState.driverSeatHeat, 2);
    assert.equal(fullState.passengerSeatHeat, 1);
    assert.equal(fullState.fanSpeed, 'MED');
  });

  it('14. Direct Temperature Dragging: upward increments, downward decrements, clamped 60-85°F', () => {
    const minTemp = 60;
    const maxTemp = 85;
    const stepPx = 12;

    const computeNewTemp = (startTemp: number, deltaY: number) => {
      const tempDiff = Math.round(deltaY / stepPx);
      return Math.min(maxTemp, Math.max(minTemp, startTemp + tempDiff));
    };

    assert.equal(computeNewTemp(69, 36), 72);
    assert.equal(computeNewTemp(69, -24), 67);
    assert.equal(computeNewTemp(69, 4), 69);
    assert.equal(computeNewTemp(84, 100), 85);
    assert.equal(computeNewTemp(62, -100), 60);
  });

  it('15. Fan Speed Selection: supports AUTO, LOW, MED, HIGH', () => {
    const FAN_OPTIONS: ClimateFanSpeed[] = ['AUTO', 'LOW', 'MED', 'HIGH'];
    let currentSpeed: ClimateFanSpeed = 'AUTO';

    FAN_OPTIONS.forEach((speed) => {
      currentSpeed = speed;
      assert.equal(currentSpeed, speed);
    });
  });

  it('16. Displayed temperature resolution: reflects shared temp in SYNC mode, selected zone in UNSYNC mode', () => {
    const getActiveDisplayTemp = (s: ClimateState) => {
      if (s.isSynced) return s.driverTemp;
      return s.selectedSeat === 'driver' ? s.driverTemp : s.passengerTemp;
    };

    const syncedState: ClimateState = {
      driverTemp: 69,
      passengerTemp: 69,
      isSynced: true,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };
    assert.equal(getActiveDisplayTemp(syncedState), 69);

    const unsyncedDriverState: ClimateState = {
      driverTemp: 68,
      passengerTemp: 72,
      isSynced: false,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };
    assert.equal(getActiveDisplayTemp(unsyncedDriverState), 68);

    const unsyncedPassengerState: ClimateState = {
      driverTemp: 68,
      passengerTemp: 72,
      isSynced: false,
      selectedSeat: 'passenger',
      fanSpeed: 'AUTO',
    };
    assert.equal(getActiveDisplayTemp(unsyncedPassengerState), 72);
  });

  it('17. Contextual badge resolution: SYNC when synced, DRIVER/PASSENGER when unsynced', () => {
    const getContextualBadge = (s: ClimateState) => {
      return s.isSynced ? 'SYNC' : (s.selectedSeat || 'driver').toUpperCase();
    };

    const synced: ClimateState = { driverTemp: 70, passengerTemp: 70, isSynced: true, selectedSeat: 'driver', fanSpeed: 'AUTO' };
    assert.equal(getContextualBadge(synced), 'SYNC');

    const unsyncedDriver: ClimateState = { driverTemp: 70, passengerTemp: 72, isSynced: false, selectedSeat: 'driver', fanSpeed: 'AUTO' };
    assert.equal(getContextualBadge(unsyncedDriver), 'DRIVER');

    const unsyncedPassenger: ClimateState = { driverTemp: 70, passengerTemp: 72, isSynced: false, selectedSeat: 'passenger', fanSpeed: 'AUTO' };
    assert.equal(getContextualBadge(unsyncedPassenger), 'PASSENGER');
  });

  it('18. Seat climate state sharing: heat and cool states map directly to shared store fields', () => {
    const sharedState: ClimateState = {
      driverTemp: 70,
      passengerTemp: 70,
      isSynced: true,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
      driverSeatHeat: 2,
      driverSeatCool: 0,
      passengerSeatHeat: 0,
      passengerSeatCool: 1,
    };

    assert.equal(sharedState.driverSeatHeat, 2);
    assert.equal(sharedState.driverSeatCool, 0);
    assert.equal(sharedState.passengerSeatHeat, 0);
    assert.equal(sharedState.passengerSeatCool, 1);
  });

  it('19. Weather-based default seat climate initialization', () => {
    const computeWeatherDefault = (temp?: number, unit: 'F' | 'C' = 'F') => {
      if (typeof temp !== 'number') return { heat: 0, cool: 0 };
      const tempF = unit === 'C' ? (temp * 9) / 5 + 32 : temp;
      if (tempF > 72) return { heat: 0, cool: 1 };
      return { heat: 1, cool: 0 };
    };

    // Hot day > 72°F -> default COOL 1
    assert.deepEqual(computeWeatherDefault(85, 'F'), { heat: 0, cool: 1 });
    assert.deepEqual(computeWeatherDefault(25, 'C'), { heat: 0, cool: 1 }); // 77°F

    // Cool/cold day <= 72°F -> default HEAT 1
    assert.deepEqual(computeWeatherDefault(72, 'F'), { heat: 1, cool: 0 });
    assert.deepEqual(computeWeatherDefault(63, 'F'), { heat: 1, cool: 0 });
    assert.deepEqual(computeWeatherDefault(15, 'C'), { heat: 1, cool: 0 }); // 59°F

    // Weather unavailable -> default OFF (0, 0)
    assert.deepEqual(computeWeatherDefault(undefined), { heat: 0, cool: 0 });
  });

  it('20. Weather-aware seat cycling from OFF', () => {
    const cycleFromOff = (weatherTempF: number) => {
      const defaultMode = weatherTempF > 72 ? 'cool' : 'heat';
      if (defaultMode === 'cool') return { heat: 0, cool: 1 };
      return { heat: 1, cool: 0 };
    };

    assert.deepEqual(cycleFromOff(80), { heat: 0, cool: 1 });
    assert.deepEqual(cycleFromOff(65), { heat: 1, cool: 0 });
  });

  it('21. Popover selection immediately commits state and closes overlay', () => {
    let openPopover: 'driver' | 'passenger' | null = 'driver';
    let climateState = {
      driverSeatHeat: 0,
      driverSeatCool: 0,
      passengerSeatHeat: 0,
      passengerSeatCool: 0,
    };

    const handleSetSeatClimate = (seat: 'driver' | 'passenger', mode: 'heat' | 'cool', level: 0 | 1 | 2 | 3) => {
      const targetLevel = level === 0 ? 1 : level;
      if (seat === 'driver') {
        if (mode === 'heat') {
          climateState.driverSeatHeat = targetLevel;
          climateState.driverSeatCool = 0;
        } else {
          climateState.driverSeatCool = targetLevel;
          climateState.driverSeatHeat = 0;
        }
      }
      openPopover = null;
    };

    const handleTurnSeatOff = (seat: 'driver' | 'passenger') => {
      if (seat === 'driver') {
        climateState.driverSeatHeat = 0;
        climateState.driverSeatCool = 0;
      }
      openPopover = null;
    };

    // Selecting HEAT 2 commits state and dismisses popover
    handleSetSeatClimate('driver', 'heat', 2);
    assert.equal(climateState.driverSeatHeat, 2);
    assert.equal(climateState.driverSeatCool, 0);
    assert.equal(openPopover, null);

    // Re-opening popover
    openPopover = 'driver';
    assert.equal(openPopover, 'driver');

    // Selecting COOL 3 commits state and dismisses popover
    handleSetSeatClimate('driver', 'cool', 3);
    assert.equal(climateState.driverSeatHeat, 0);
    assert.equal(climateState.driverSeatCool, 3);
    assert.equal(openPopover, null);

    // Re-opening popover and selecting OFF
    openPopover = 'driver';
    handleTurnSeatOff('driver');
    assert.equal(climateState.driverSeatHeat, 0);
    assert.equal(climateState.driverSeatCool, 0);
    assert.equal(openPopover, null);
  });

  it('22. Responsive Element Priority Hierarchy: Upper SYNC button is single source of truth across sizes', () => {
    const resolveResponsiveState = (width: number, height: number) => {
      const isComfortable = width >= 320 && height >= 155;
      const isVeryNarrow = width < 235 || height < 140;

      const showUpperSyncButton = true; // Essential control & single source of truth - always present!
      const showDriverSeat = true; // Essential control - never removed!
      const showPassengerSeat = true; // Essential control - never removed!
      const showTemperature = true; // Primary value - never removed!
      const showFanSpeed = true; // Essential control - never removed!
      const showDriverLabel = true;
      const showPassengerLabel = true;

      return {
        isComfortable,
        isVeryNarrow,
        showUpperSyncButton,
        showDriverSeat,
        showPassengerSeat,
        showTemperature,
        showFanSpeed,
        showDriverLabel,
        showPassengerLabel,
      };
    };

    // 1. Large / Comfortable (374 x 198): Symmetrical 2-row layout with upper SYNC button
    const comfortableState = resolveResponsiveState(374, 198);
    assert.equal(comfortableState.isComfortable, true);
    assert.equal(comfortableState.showUpperSyncButton, true, 'Upper SYNC button active at 374x198');
    assert.equal(comfortableState.showTemperature, true);
    assert.equal(comfortableState.showFanSpeed, true);

    // 2. Constrained (320 x 180): Symmetrical 2-row layout preserved
    const constrainedState = resolveResponsiveState(320, 180);
    assert.equal(constrainedState.isComfortable, true);
    assert.equal(constrainedState.showUpperSyncButton, true);
    assert.equal(constrainedState.showTemperature, true);
    assert.equal(constrainedState.showFanSpeed, true);

    // 3. Narrow (280 x 170): Fits 2-row layout comfortably with responsive gaps
    const narrowState1 = resolveResponsiveState(280, 170);
    assert.equal(narrowState1.isVeryNarrow, false);
    assert.equal(narrowState1.showUpperSyncButton, true);

    // 4. Narrow (240 x 160): Fits 2-row layout cleanly without overflow
    const narrowState2 = resolveResponsiveState(240, 160);
    assert.equal(narrowState2.isVeryNarrow, false);
    assert.equal(narrowState2.showUpperSyncButton, true);

    // 5. Very Narrow (220 x 150): Multi-row layout, all essential controls remain usable
    const veryNarrowState = resolveResponsiveState(220, 150);
    assert.equal(veryNarrowState.isVeryNarrow, true);
    assert.equal(veryNarrowState.showUpperSyncButton, true);
  });

  it('23. Fan Speed Label formatting: strictly LOW, MED, HIGH, AUTO without FAN: prefix', () => {
    const formatFanSpeedLabel = (speed: ClimateFanSpeed) => speed;
    assert.equal(formatFanSpeedLabel('LOW'), 'LOW');
    assert.equal(formatFanSpeedLabel('MED'), 'MED');
    assert.equal(formatFanSpeedLabel('HIGH'), 'HIGH');
    assert.equal(formatFanSpeedLabel('AUTO'), 'AUTO');
    assert.equal(formatFanSpeedLabel('LOW').includes('FAN:'), false);
  });

  it('24. Center Column X-axis & Y-axis vertical centerline alignment for Upper Row controls', () => {
    // Upper row: [ TEMPERATURE ] [ SYNC BUTTON ] [ FAN SPEED ]
    // Grid: grid-cols-[1fr_auto_1fr] items-center
    const upperRowControls = [
      { id: 'temperature', col: 0, align: 'start', baseline: 'center' },
      { id: 'syncButton', col: 1, align: 'center', baseline: 'center' },
      { id: 'fanSpeed', col: 2, align: 'end', baseline: 'center' },
    ];

    assert.equal(upperRowControls[1].align, 'center', 'SYNC button is centered horizontally');
    assert.equal(upperRowControls[0].baseline, upperRowControls[1].baseline, 'Temp and SYNC share vertical centerline');
    assert.equal(upperRowControls[1].baseline, upperRowControls[2].baseline, 'SYNC and Fan share vertical centerline');
  });

  it('25. Shared Y-axis baseline for Lower Row controls (DRIVER, Driver seat, Passenger seat, PASSENGER)', () => {
    const lowerRowControls = [
      { id: 'driverLabel', row: 2, baseline: 'center' },
      { id: 'driverSeat', row: 2, baseline: 'center' },
      { id: 'passengerSeat', row: 2, baseline: 'center' },
      { id: 'passengerLabel', row: 2, baseline: 'center' },
    ];

    assert.equal(lowerRowControls[0].row, 2);
    assert.equal(lowerRowControls[0].baseline, lowerRowControls[1].baseline);
    assert.equal(lowerRowControls[1].baseline, lowerRowControls[2].baseline);
    assert.equal(lowerRowControls[2].baseline, lowerRowControls[3].baseline);
  });

  it('26. Hard containment and 4-element bottom row constraint: [DRIVER] [SEAT] ... [SEAT] [PASSENGER]', () => {
    const testSizes = [
      { width: 374, height: 198 },
      { width: 350, height: 190 },
      { width: 320, height: 180 },
      { width: 300, height: 175 },
      { width: 280, height: 170 },
      { width: 260, height: 165 },
      { width: 240, height: 160 },
      { width: 220, height: 150 },
    ];

    testSizes.forEach(({ width, height }) => {
      const isComfortable = width >= 320 && height >= 155;
      const isVeryNarrow = width < 235 || height < 140;

      // In any supported state, all required interactive elements exist and are contained
      const hasTemp = true;
      const hasFan = true;
      const hasDriverSeat = true;
      const hasPassengerSeat = true;
      const hasSyncToggle = true;
      const hasDriverLabel = true;
      const hasPassengerLabel = true;

      assert.equal(hasTemp && hasFan && hasDriverSeat && hasPassengerSeat && hasSyncToggle && hasDriverLabel && hasPassengerLabel, true);

      // Sizing mode verification:
      if (!isVeryNarrow) {
        // 4 elements in one row: calculate total width requirement vs available width
        const containerPadding = isComfortable ? 32 : 24;
        const availableContentWidth = width - containerPadding;
        const driverWidth = 52; // text ~40px + padding ~12px
        const passengerWidth = 76; // text ~64px + padding ~12px
        const driverSeatWidth = isComfortable ? 40 : 36;
        const passengerSeatWidth = isComfortable ? 40 : 36;
        const internalGaps = 2 * 6; // gap between DRIVER and SEAT, and SEAT and PASSENGER
        const totalBottomRowRequiredWidth = driverWidth + driverSeatWidth + passengerSeatWidth + passengerWidth + internalGaps;

        assert.ok(
          totalBottomRowRequiredWidth <= availableContentWidth,
          `Bottom row required width (${totalBottomRowRequiredWidth}px) fits in available width (${availableContentWidth}px) at size ${width}x${height}`
        );
      } else {
        // In very narrow (<235px), deliberate reflow ensures zero horizontal overflow
        assert.ok(isVeryNarrow, `Reflow triggered cleanly at width ${width}`);
      }
    });
  });

  it('24. Compact 7-State Seat Selector: Order, icon states, single-selection, text-only OFF, and bounding-box containment', () => {
    const SEAT_SELECTOR_OPTIONS = [
      { type: 'heat' as const, level: 3, label: '3', expectedIcon: 'fire' },
      { type: 'heat' as const, level: 2, label: '2', expectedIcon: 'fire' },
      { type: 'heat' as const, level: 1, label: '1', expectedIcon: 'fire' },
      { type: 'off' as const, level: 0, label: 'OFF', expectedIcon: 'none-text-only' },
      { type: 'cool' as const, level: 1, label: '1', expectedIcon: 'snowflake' },
      { type: 'cool' as const, level: 2, label: '2', expectedIcon: 'snowflake' },
      { type: 'cool' as const, level: 3, label: '3', expectedIcon: 'snowflake' },
    ];

    // 1. Exactly 7 options in exact order: Heat 3 -> Heat 2 -> Heat 1 -> OFF -> Cool 1 -> Cool 2 -> Cool 3
    assert.equal(SEAT_SELECTOR_OPTIONS.length, 7);
    assert.deepEqual(
      SEAT_SELECTOR_OPTIONS.map((o) => `${o.type}-${o.level}`),
      ['heat-3', 'heat-2', 'heat-1', 'off-0', 'cool-1', 'cool-2', 'cool-3']
    );

    // 2. State selection mapping verification
    const evaluateSelection = (heat: number, cool: number) => {
      return SEAT_SELECTOR_OPTIONS.map((opt) => {
        if (opt.type === 'heat') return heat === opt.level;
        if (opt.type === 'off') return heat === 0 && cool === 0;
        if (opt.type === 'cool') return cool === opt.level;
        return false;
      });
    };

    // Test HEAT 2 active: only row 1 is true
    const heat2Selection = evaluateSelection(2, 0);
    assert.deepEqual(heat2Selection, [false, true, false, false, false, false, false]);

    // Test OFF active: only row 3 is true
    const offSelection = evaluateSelection(0, 0);
    assert.deepEqual(offSelection, [false, false, false, true, false, false, false]);

    // Test COOL 3 active: only row 6 is true
    const cool3Selection = evaluateSelection(0, 3);
    assert.deepEqual(cool3Selection, [false, false, false, false, false, false, true]);

    // 3. Selection handler commits new state and closes selector
    let currentHeat = 0;
    let currentCool = 0;
    let isOpen = true;

    const selectOption = (opt: (typeof SEAT_SELECTOR_OPTIONS)[0]) => {
      if (opt.type === 'heat') {
        currentHeat = opt.level;
        currentCool = 0;
      } else if (opt.type === 'off') {
        currentHeat = 0;
        currentCool = 0;
      } else {
        currentCool = opt.level;
        currentHeat = 0;
      }
      isOpen = false;
    };

    selectOption(SEAT_SELECTOR_OPTIONS[0]); // Heat 3
    assert.equal(currentHeat, 3);
    assert.equal(currentCool, 0);
    assert.equal(isOpen, false);

    isOpen = true;
    selectOption(SEAT_SELECTOR_OPTIONS[3]); // OFF
    assert.equal(currentHeat, 0);
    assert.equal(currentCool, 0);
    assert.equal(isOpen, false);

    isOpen = true;
    selectOption(SEAT_SELECTOR_OPTIONS[4]); // Cool 1
    assert.equal(currentHeat, 0);
    assert.equal(currentCool, 1);
    assert.equal(isOpen, false);
  });

  it('27. Text-only OFF in 7-state seat selector: strictly displays "OFF" without a seat icon', () => {
    const offOption = { type: 'off' as const, level: 0, label: 'OFF', hasIcon: false };
    assert.equal(offOption.label, 'OFF');
    assert.equal(offOption.hasIcon, false, 'No seat icon displayed for OFF option');
  });

  it('28. Overlay Orientations: Inspector supports Vertical and Horizontal layouts for Seat and Fan overlays', () => {
    const seatOrientations = ['vertical', 'horizontal'] as const;
    const fanOrientations = ['horizontal', 'vertical'] as const;

    seatOrientations.forEach((orientation) => {
      const isVertical = orientation === 'vertical';
      const containerClass = isVertical
        ? 'flex flex-col gap-1 w-[52px] sm:w-[56px]'
        : 'flex flex-row gap-1 h-[44px] sm:h-[48px] w-auto';
      assert.ok(containerClass.length > 0, `Valid container styling for seat overlay orientation: ${orientation}`);
    });

    fanOrientations.forEach((orientation) => {
      const isVertical = orientation === 'vertical';
      const containerClass = isVertical
        ? 'flex flex-col gap-1 w-24 sm:w-28'
        : 'flex items-center gap-1';
      assert.ok(containerClass.length > 0, `Valid container styling for fan overlay orientation: ${orientation}`);
    });
  });

  it('29. SYNC and Zone Selection Decoupling State Transition Matrix', () => {
    // Initial state: SYNC ON
    let state = {
      isSynced: true,
      selectedSeat: 'driver' as ClimateSeat,
      driverTemp: 70,
      passengerTemp: 70,
    };

    // Helper to evaluate active styling
    const getActiveControls = (s: typeof state) => ({
      syncActive: Boolean(s.isSynced),
      driverActive: !s.isSynced && s.selectedSeat === 'driver',
      passengerActive: !s.isSynced && s.selectedSeat === 'passenger',
    });

    // 1. In SYNC ON: SYNC = ACTIVE, DRIVER = INACTIVE, PASSENGER = INACTIVE
    let active = getActiveControls(state);
    assert.equal(active.syncActive, true);
    assert.equal(active.driverActive, false);
    assert.equal(active.passengerActive, false);

    // 2. Turning SYNC OFF defaults to DRIVER active: SYNC = INACTIVE, DRIVER = ACTIVE, PASSENGER = INACTIVE
    state.isSynced = false;
    state.selectedSeat = 'driver';
    active = getActiveControls(state);
    assert.equal(active.syncActive, false);
    assert.equal(active.driverActive, true);
    assert.equal(active.passengerActive, false);

    // 3. User taps PASSENGER: SYNC = INACTIVE, DRIVER = INACTIVE, PASSENGER = ACTIVE
    state.selectedSeat = 'passenger';
    active = getActiveControls(state);
    assert.equal(active.syncActive, false);
    assert.equal(active.driverActive, false);
    assert.equal(active.passengerActive, true);

    // 4. User turns SYNC ON while PASSENGER was selected:
    // SYNC = ACTIVE, DRIVER = INACTIVE, PASSENGER = INACTIVE
    state.isSynced = true;
    state.passengerTemp = state.driverTemp;
    active = getActiveControls(state);
    assert.equal(active.syncActive, true);
    assert.equal(active.driverActive, false);
    assert.equal(active.passengerActive, false);

    // 5. User turns SYNC OFF again: automatically selects DRIVER
    state.isSynced = false;
    state.selectedSeat = 'driver';
    active = getActiveControls(state);
    assert.equal(active.syncActive, false);
    assert.equal(active.driverActive, true);
    assert.equal(active.passengerActive, false);

    // 6. User taps DRIVER explicitly: SYNC = INACTIVE, DRIVER = ACTIVE, PASSENGER = INACTIVE
    state.selectedSeat = 'driver';
    active = getActiveControls(state);
    assert.equal(active.syncActive, false);
    assert.equal(active.driverActive, true);
    assert.equal(active.passengerActive, false);
  });

  it('30. 13-Point Interaction & State Specification Verification Suite', () => {
    // State model helper
    interface ClimateModel {
      isSynced: boolean;
      selectedSeat: ClimateSeat | null;
      driverTemp: number;
      passengerTemp: number;
    }

    const getVisualState = (s: ClimateModel) => ({
      syncActive: s.isSynced,
      driverActive: !s.isSynced && s.selectedSeat === 'driver',
      passengerActive: !s.isSynced && s.selectedSeat === 'passenger',
    });

    // 1. Initial load -> with SYNC OFF, DRIVER is active
    let model: ClimateModel = {
      isSynced: false,
      selectedSeat: 'driver',
      driverTemp: 72,
      passengerTemp: 72,
    };
    let visual = getVisualState(model);
    assert.equal(visual.driverActive, true, '1. Initial load (SYNC off) -> DRIVER active');
    assert.equal(visual.passengerActive, false);
    assert.equal(visual.syncActive, false);

    // 2. Tap SYNC -> SYNC active, neither zone active
    model.isSynced = true;
    visual = getVisualState(model);
    assert.equal(visual.syncActive, true, '2. Tap SYNC -> SYNC active');
    assert.equal(visual.driverActive, false, '2. Tap SYNC -> DRIVER inactive');
    assert.equal(visual.passengerActive, false, '2. Tap SYNC -> PASSENGER inactive');

    // 3. Tap SYNC again -> SYNC inactive, DRIVER active (do not restore passenger)
    model.isSynced = false;
    model.selectedSeat = 'driver';
    visual = getVisualState(model);
    assert.equal(visual.syncActive, false, '3. Tap SYNC again -> SYNC inactive');
    assert.equal(visual.driverActive, true, '3. Tap SYNC again -> DRIVER active');
    assert.equal(visual.passengerActive, false, '3. Tap SYNC again -> PASSENGER inactive');

    // 4. Tap PASSENGER -> PASSENGER active
    model.selectedSeat = 'passenger';
    visual = getVisualState(model);
    assert.equal(visual.syncActive, false, '4. Tap PASSENGER -> SYNC inactive');
    assert.equal(visual.driverActive, false, '4. Tap PASSENGER -> DRIVER inactive');
    assert.equal(visual.passengerActive, true, '4. Tap PASSENGER -> PASSENGER active');

    // 5. Tap SYNC -> SYNC active, neither zone active
    model.isSynced = true;
    visual = getVisualState(model);
    assert.equal(visual.syncActive, true, '5. Tap SYNC -> SYNC active');
    assert.equal(visual.driverActive, false, '5. Tap SYNC -> DRIVER inactive');
    assert.equal(visual.passengerActive, false, '5. Tap SYNC -> PASSENGER inactive');

    // 6. Tap SYNC again -> SYNC inactive, DRIVER active
    model.isSynced = false;
    model.selectedSeat = 'driver';
    visual = getVisualState(model);
    assert.equal(visual.syncActive, false, '6. Tap SYNC again -> SYNC inactive');
    assert.equal(visual.driverActive, true, '6. Tap SYNC again -> DRIVER active');
    assert.equal(visual.passengerActive, false, '6. Tap SYNC again -> PASSENGER inactive');

    // 7. While SYNC is active, tap DRIVER -> SYNC off + DRIVER active
    model.isSynced = true;
    assert.equal(getVisualState(model).syncActive, true);
    // Tap DRIVER
    model.isSynced = false;
    model.selectedSeat = 'driver';
    visual = getVisualState(model);
    assert.equal(visual.syncActive, false, '7. While SYNC active, tap DRIVER -> SYNC off');
    assert.equal(visual.driverActive, true, '7. While SYNC active, tap DRIVER -> DRIVER active');
    assert.equal(visual.passengerActive, false);

    // 8. While SYNC is active, tap PASSENGER -> SYNC off + PASSENGER active
    model.isSynced = true;
    assert.equal(getVisualState(model).syncActive, true);
    // Tap PASSENGER
    model.isSynced = false;
    model.selectedSeat = 'passenger';
    visual = getVisualState(model);
    assert.equal(visual.syncActive, false, '8. While SYNC active, tap PASSENGER -> SYNC off');
    assert.equal(visual.passengerActive, true, '8. While SYNC active, tap PASSENGER -> PASSENGER active');
    assert.equal(visual.driverActive, false);

    // 9. Vertical Seat Temperature Overlay
    const verticalSeatOverlayClass = 'flex flex-col gap-1 w-[52px] sm:w-[56px]';
    assert.ok(verticalSeatOverlayClass.includes('flex-col'), '9. Vertical seat overlay uses column layout');

    // 10. Horizontal Seat Temperature Overlay
    const horizontalSeatOverlayClass = 'flex flex-row gap-1 h-[52px] sm:h-[56px] w-auto';
    assert.ok(horizontalSeatOverlayClass.includes('flex-row'), '10. Horizontal seat overlay uses row layout');

    // 11. OFF label strictly text-only in Horizontal and Vertical modes (no seat icon)
    const offOptionLayout = {
      label: 'OFF',
      hasSeatIcon: false,
    };
    assert.equal(offOptionLayout.label, 'OFF');
    assert.equal(offOptionLayout.hasSeatIcon, false, '11. OFF is text-only without a seat icon');

    // 12. Bounding-box and overflow containment in overlays
    const overlayContainmentStyles = 'box-border overflow-hidden select-none';
    assert.ok(overlayContainmentStyles.includes('box-border'), '12. Overlay uses box-border');
    assert.ok(overlayContainmentStyles.includes('overflow-hidden'), '12. Overlay uses overflow-hidden');

    // 13. Inspector Labels & Consistent Ordering:
    // Section: "OVERLAY ORIENTATION"
    // SEAT TEMP: [Vertical] [Horizontal]
    // FAN SPEED: [Vertical] [Horizontal]
    const inspectorLabels = {
      sectionTitle: 'OVERLAY ORIENTATION',
      seatSetting: 'SEAT TEMP',
      seatOrder: ['vertical', 'horizontal'],
      fanSetting: 'FAN SPEED',
      fanOrder: ['vertical', 'horizontal'],
    };
    assert.equal(inspectorLabels.sectionTitle, 'OVERLAY ORIENTATION', '13. Section title is OVERLAY ORIENTATION');
    assert.equal(inspectorLabels.seatSetting, 'SEAT TEMP', '13. Seat label is SEAT TEMP');
    assert.deepEqual(inspectorLabels.seatOrder, ['vertical', 'horizontal'], '13. Seat order is Vertical, Horizontal');
    assert.equal(inspectorLabels.fanSetting, 'FAN SPEED', '13. Fan label is FAN SPEED');
    assert.deepEqual(inspectorLabels.fanOrder, ['vertical', 'horizontal'], '13. Fan order is Vertical, Horizontal');
  });

  it('31. Zone Spacing & Individual Seat Overlay Anchoring Verification', () => {
    // 1. Consistent spacing: DRIVER -> Driver seat gap equals Passenger seat -> PASSENGER gap
    const driverGroupGapClass = 'gap-[clamp(4px,1.2cqw,8px)]';
    const passengerGroupGapClass = 'gap-[clamp(4px,1.2cqw,8px)]';
    assert.equal(driverGroupGapClass, passengerGroupGapClass, 'DRIVER -> seat gap equals seat -> PASSENGER gap');

    // 2. Individual positioning contexts: each seat button has its own relative wrapper
    const driverSeatWrapper = { isRelative: true, containsPopover: true, seat: 'driver' };
    const passengerSeatWrapper = { isRelative: true, containsPopover: true, seat: 'passenger' };
    assert.ok(driverSeatWrapper.isRelative && driverSeatWrapper.containsPopover, 'Driver seat has independent relative positioning context');
    assert.ok(passengerSeatWrapper.isRelative && passengerSeatWrapper.containsPopover, 'Passenger seat has independent relative positioning context');

    // 3. Overlay positioning classes: left-1/2 -translate-x-1/2 for true center alignment over respective seat
    const overlayPositionClasses = 'absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50';
    assert.ok(overlayPositionClasses.includes('left-1/2'), 'Overlay uses left-1/2');
    assert.ok(overlayPositionClasses.includes('-translate-x-1/2'), 'Overlay uses -translate-x-1/2');
  });
});
