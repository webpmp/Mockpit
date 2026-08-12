import React from 'react';
import { useMockpitStore, isPresetActive } from '../store/useMockpitStore';
import { DriveModeState, GearState } from '../types';
import { Zap, AlertTriangle, ChevronDown, ChevronUp, RotateCcw, Gauge, ShieldAlert, Eye, Sun, Car } from 'lucide-react';

const SteeringWheel: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="15" x2="12" y2="21" />
    <line x1="9.4" y1="10.5" x2="4.2" y2="7.5" />
    <line x1="14.6" y1="10.5" x2="19.8" y2="7.5" />
  </svg>
);

const GEARS: GearState[] = ['P', 'R', 'N', 'D'];
const DRIVE_MODES: DriveModeState[] = ['Eco', 'Normal', 'Sport'];

const PRESET_SCENARIOS = [
  { id: 'low_battery', label: 'Low Battery' },
  { id: 'highway_cruise', label: '75 MPH Highway' },
  { id: 'charging_station', label: 'Charging' },
  { id: 'door_alert', label: 'Door Ajar' },
] as const;

export const DebugStatePanel: React.FC = () => {
  const vehicleState = useMockpitStore((s) => s.vehicleState);
  const isDebugOpen = useMockpitStore((s) => s.isDebugOpen);
  const toggleDebugPanel = useMockpitStore((s) => s.toggleDebugPanel);
  const setVehicleState = useMockpitStore((s) => s.setVehicleState);
  const resetVehicleState = useMockpitStore((s) => s.resetVehicleState);
  const applyPresetScenario = useMockpitStore((s) => s.applyPresetScenario);
  const triggerNotification = useMockpitStore((s) => s.triggerNotification);

  const canCharge = vehicleState.gear === 'P' && vehicleState.speed === 0;

  const handleResetVehicleState = () => {
    if (window.confirm('Reset vehicle state (gear, speed, battery, etc.) to defaults?')) {
      resetVehicleState();
    }
  };

  const handleToggleCruise = () => {
    if (vehicleState.gear !== 'D') return;
    const newCruise = !vehicleState.cruiseControlActive;
    setVehicleState({ cruiseControlActive: newCruise });
    triggerNotification({
      message: newCruise ? 'CRUISE CONTROL ENGAGED' : 'CRUISE CONTROL DISENGAGED',
      icon: 'gauge',
      color: newCruise ? '#10b981' : '#06b6d4',
      severity: 'info',
    });
  };

  const isHeadlightsOn = vehicleState.headlights === 'On';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)] transition-all duration-300"
    >
      {/* Header Bar (Whole header clickable to expand/collapse) */}
      <div
        onClick={toggleDebugPanel}
        className={`px-6 py-2.5 bg-slate-900/80 flex items-center justify-between cursor-pointer hover:bg-slate-900/90 transition-colors select-none ${
          isDebugOpen ? 'border-b border-slate-800' : ''
        }`}
        title={isDebugOpen ? 'Click to collapse Drive Simulator' : 'Click to expand Drive Simulator'}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-200 uppercase">
            <SteeringWheel className="w-4 h-4 text-sky-400" />
            Drive Simulator
          </div>
        </div>

        {/* Quick Presets & Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Presets:</span>
            {PRESET_SCENARIOS.map((p) => {
              const active = isPresetActive(p.id, vehicleState);
              const isChargingPreset = p.id === 'charging_station';
              const isChargingDisabled = isChargingPreset && !canCharge && !active;

              return (
                <button
                  key={p.id}
                  disabled={isChargingDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    applyPresetScenario(p.id);
                  }}
                  title={isChargingDisabled ? 'Park the vehicle to enable charging' : undefined}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                    isChargingDisabled
                      ? 'bg-slate-800/40 text-slate-600 border-slate-800/80 opacity-50 cursor-not-allowed'
                      : active
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)] cursor-pointer'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-700 hover:text-slate-200 cursor-pointer'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetVehicleState();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-xs flex items-center gap-1 cursor-pointer border border-slate-700/80"
            title="Reset Vehicle State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleDebugPanel();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-xs cursor-pointer border border-slate-700/80"
            title={isDebugOpen ? 'Minimize Panel' : 'Expand Panel'}
          >
            {isDebugOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Body - Organized logically with comfortable height and spacing */}
      {isDebugOpen && (
        <div className="p-5 px-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* DRIVING GROUP */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              <span>Driving State</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
              {/* Gear Select */}
              <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Gear Selector
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {GEARS.map((g) => {
                    const isActive = vehicleState.gear === g;
                    return (
                      <button
                        key={g}
                        onClick={() => setVehicleState({ gear: g })}
                        className={`py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.5)] scale-105'
                            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speed Slider */}
              {(() => {
                const isParked = vehicleState.gear === 'P';
                const isNeutral = vehicleState.gear === 'N';
                return (
                  <div
                    className={`bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between transition-opacity ${
                      isParked ? 'opacity-60' : ''
                    }`}
                    title={isParked ? 'Speed is locked at 0 MPH while in Park (P)' : isNeutral ? 'Vehicle is coasting in Neutral (N)' : undefined}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        Speed
                      </span>
                      <span className="text-xs font-black font-mono text-sky-400">
                        {vehicleState.speed} <span className="text-[10px] text-slate-500">MPH</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 my-auto">
                      <input
                        type="range"
                        min={0}
                        max={120}
                        disabled={isParked}
                        value={vehicleState.speed}
                        onChange={(e) => setVehicleState({ speed: Number(e.target.value) })}
                        className={`w-full accent-sky-400 h-2 bg-slate-800 rounded-lg ${
                          isParked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}
                      />
                    </div>

                    {/* Cruise Control Toggle */}
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-2 shrink-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Gauge className={`w-3.5 h-3.5 shrink-0 ${vehicleState.cruiseControlActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider truncate">
                          Cruise Control
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-mono font-bold ${vehicleState.cruiseControlActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {vehicleState.cruiseControlActive ? 'SET' : 'OFF'}
                        </span>
                        {(() => {
                          const isCruiseDisabled = vehicleState.gear !== 'D';
                          return (
                            <button
                              disabled={isCruiseDisabled}
                              onClick={handleToggleCruise}
                              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                                isCruiseDisabled
                                  ? 'bg-slate-800/40 border border-slate-800/80 opacity-40 cursor-not-allowed'
                                  : vehicleState.cruiseControlActive
                                  ? 'bg-emerald-500 cursor-pointer'
                                  : 'bg-slate-800 border border-slate-700 cursor-pointer'
                              }`}
                              title={isCruiseDisabled ? 'Cruise Control is only available in Drive (D)' : 'Toggle Cruise Control'}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                                  vehicleState.cruiseControlActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Drive Mode Select */}
              <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Drive Mode
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {DRIVE_MODES.map((dm) => {
                    const isActive = (vehicleState.driveMode || 'Normal') === dm;
                    return (
                      <button
                        key={dm}
                        onClick={() => setVehicleState({ driveMode: dm })}
                        className={`py-2 px-1 rounded-xl font-bold text-[11px] font-mono transition-all cursor-pointer ${
                          isActive
                            ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-105'
                            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {dm}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* VEHICLE GROUP */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" />
              <span>Vehicle & ADAS State</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-stretch">
              {/* Battery Slider */}
              <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Battery
                  </span>
                  <span
                    className={`text-xs font-black font-mono ${
                      vehicleState.batteryPercent < 15 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {Math.round(vehicleState.batteryPercent)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(vehicleState.batteryPercent)}
                  onChange={(e) => setVehicleState({ batteryPercent: Number(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg my-auto"
                />
              </div>

              {/* Is Charging Toggle */}
              <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      vehicleState.isCharging
                        ? 'bg-blue-500/20 text-blue-400'
                        : !canCharge
                        ? 'bg-slate-800 text-slate-600'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
                      Charging
                    </div>
                    <div className="text-[11px] font-bold text-slate-200 truncate">
                      {vehicleState.isCharging
                        ? 'Plugged In'
                        : !canCharge
                        ? 'Park to Charge'
                        : 'Disconnected'}
                    </div>
                  </div>
                </div>

                <button
                  disabled={!canCharge && !vehicleState.isCharging}
                  onClick={() => (canCharge || vehicleState.isCharging) && setVehicleState({ isCharging: !vehicleState.isCharging })}
                  title={canCharge ? 'Toggle Charging' : 'Park the vehicle to enable charging'}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
                    !canCharge && !vehicleState.isCharging
                      ? 'bg-slate-800 opacity-40 cursor-not-allowed'
                      : vehicleState.isCharging
                      ? 'bg-blue-500 cursor-pointer'
                      : 'bg-slate-800 cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      vehicleState.isCharging ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Door Open Toggle */}
              <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      vehicleState.doorOpen ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
                      Door
                    </div>
                    <div className="text-[11px] font-bold text-slate-200 truncate">
                      {vehicleState.doorOpen ? 'Ajar / Open' : 'Closed'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setVehicleState({ doorOpen: !vehicleState.doorOpen })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 cursor-pointer ${
                    vehicleState.doorOpen ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      vehicleState.doorOpen ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Headlights Control */}
              <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isHeadlightsOn ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
                      Headlights
                    </div>
                    <div className="text-[11px] font-bold text-slate-200 truncate">
                      {isHeadlightsOn ? 'On' : 'Off'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setVehicleState({ headlights: isHeadlightsOn ? 'Off' : 'On' })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 cursor-pointer ${
                    isHeadlightsOn ? 'bg-sky-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      isHeadlightsOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Blind Spot Warning Toggle */}
              <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      vehicleState.blindSpotWarning ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
                      Blind Spot
                    </div>
                    <div className="text-[11px] font-bold text-slate-200 truncate">
                      {vehicleState.blindSpotWarning ? 'Active Alert' : 'Clear'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setVehicleState({ blindSpotWarning: !vehicleState.blindSpotWarning })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 cursor-pointer ${
                    vehicleState.blindSpotWarning ? 'bg-rose-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      vehicleState.blindSpotWarning ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Proximity Warning Toggle */}
              <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      vehicleState.proximityWarning ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
                      Proximity
                    </div>
                    <div className="text-[11px] font-bold text-slate-200 truncate">
                      {vehicleState.proximityWarning ? 'Sensor Alert' : 'Clear'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setVehicleState({ proximityWarning: !vehicleState.proximityWarning })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 cursor-pointer ${
                    vehicleState.proximityWarning ? 'bg-rose-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      vehicleState.proximityWarning ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


