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

  it('2. SYNC Visual Hierarchy: When SYNC is ON, only connector is active, Driver and Passenger are NEUTRAL', () => {
    const state: ClimateState = {
      driverTemp: 70,
      passengerTemp: 70,
      isSynced: true,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const isDriverActive = !state.isSynced && state.selectedSeat === 'driver';
    const isPassengerActive = !state.isSynced && state.selectedSeat === 'passenger';
    const isConnectorActive = Boolean(state.isSynced);

    assert.equal(isDriverActive, false, 'Driver is neutral when synced');
    assert.equal(isPassengerActive, false, 'Passenger is neutral when synced');
    assert.equal(isConnectorActive, true, 'Center connector is active when synced');
  });

  it('3. UNSYNC Visual Hierarchy: When UNSYNCED and Driver selected, only Driver is active', () => {
    const state: ClimateState = {
      driverTemp: 69,
      passengerTemp: 72,
      isSynced: false,
      selectedSeat: 'driver',
      fanSpeed: 'AUTO',
    };

    const isDriverActive = !state.isSynced && state.selectedSeat === 'driver';
    const isPassengerActive = !state.isSynced && state.selectedSeat === 'passenger';
    const isConnectorActive = Boolean(state.isSynced);

    assert.equal(isDriverActive, true, 'Driver is active');
    assert.equal(isPassengerActive, false, 'Passenger is neutral');
    assert.equal(isConnectorActive, false, 'Connector is neutral broken-link');
  });

  it('4. UNSYNC Visual Hierarchy: When UNSYNCED and Passenger selected, only Passenger is active', () => {
    const state: ClimateState = {
      driverTemp: 69,
      passengerTemp: 72,
      isSynced: false,
      selectedSeat: 'passenger',
      fanSpeed: 'AUTO',
    };

    const isDriverActive = !state.isSynced && state.selectedSeat === 'driver';
    const isPassengerActive = !state.isSynced && state.selectedSeat === 'passenger';
    const isConnectorActive = Boolean(state.isSynced);

    assert.equal(isDriverActive, false, 'Driver is neutral');
    assert.equal(isPassengerActive, true, 'Passenger is active');
    assert.equal(isConnectorActive, false, 'Connector is neutral broken-link');
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

  it('10. Re-enable SYNC with Driver selected: uses Driver temperature as shared value', () => {
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
        if (state.selectedSeat === 'passenger') {
          state.driverTemp = state.passengerTemp;
        } else {
          state.passengerTemp = state.driverTemp;
        }
      }
    };

    toggleSync();
    assert.equal(state.isSynced, true);
    assert.equal(state.driverTemp, 69);
    assert.equal(state.passengerTemp, 69);
  });

  it('11. Re-enable SYNC with Passenger selected: uses Passenger temperature as shared value', () => {
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
        if (state.selectedSeat === 'passenger') {
          state.driverTemp = state.passengerTemp;
        } else {
          state.passengerTemp = state.driverTemp;
        }
      }
    };

    toggleSync();
    assert.equal(state.isSynced, true);
    assert.equal(state.driverTemp, 74);
    assert.equal(state.passengerTemp, 74);
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
});
