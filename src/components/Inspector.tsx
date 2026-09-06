import React, { useState, useEffect } from 'react';
import { useMockpitStore, DEFAULT_COMPONENT_DIMENSIONS } from '../store/useMockpitStore';
import { useWeatherStore, WeatherConditionKey } from '../store/useWeatherStore';
import { BindingCondition, NotificationStackPosition, TargetProp, TransitionStyle, VehicleState, ConnectorAnchor, ManeuverType, TripStop } from '../types';
import { Plus, Trash2, Sliders, Layers, Sparkles, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Layout, Settings, Upload, RotateCcw, Link2, Unlink, Activity, ChevronDown, ChevronRight, Palette, CloudSun, MapPin, Check } from 'lucide-react';
import { DEFAULT_COMPONENT_LABELS } from './ComponentRenderer';
import { LayersPanel } from './LayersPanel';
import { NumericStepper } from './NumericStepper';
import { ManeuverGlyph } from './navigation/ManeuverGlyph';
import { WeatherIcon } from './weather/WeatherIcon';
import { SAMPLE_TRACKS } from '../data/mediaData';

const REFERENCE_ICONS: Array<{ key: WeatherConditionKey; label: string }> = [
  { key: 'clear-day', label: 'Clear' },
  { key: 'clear-night', label: 'Clear Night' },
  { key: 'partly-cloudy-day', label: 'Partly Cloudy' },
  { key: 'partly-cloudy-night', label: 'Partly Cloudy (Night)' },
  { key: 'cloudy', label: 'Overcast' },
  { key: 'fog', label: 'Fog' },
  { key: 'drizzle', label: 'Drizzle' },
  { key: 'rain', label: 'Rain' },
  { key: 'rain-night', label: 'Rain (Night)' },
  { key: 'thunderstorm', label: 'Thunderstorm' },
  { key: 'snow', label: 'Snow' },
  { key: 'snow-showers', label: 'Snow Showers' },
  { key: 'sleet', label: 'Sleet' },
  { key: 'windy', label: 'Windy' },
];

const WeatherPropertiesSection: React.FC = () => {
  const locationInput = useWeatherStore((s) => s.locationInput);
  const resolvedLocation = useWeatherStore((s) => s.resolvedLocation);
  const setLocationInput = useWeatherStore((s) => s.setLocationInput);
  const unit = useWeatherStore((s) => s.unit);
  const setUnit = useWeatherStore((s) => s.setUnit);
  const displayScale = useWeatherStore((s) => s.displayScale);
  const setDisplayScale = useWeatherStore((s) => s.setDisplayScale);
  const status = useWeatherStore((s) => s.status);
  const fetchWeather = useWeatherStore((s) => s.fetchWeather);
  const lastFetchedAt = useWeatherStore((s) => s.lastFetchedAt);

  const [localInput, setLocalInput] = useState(locationInput);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isIconCatalogOpen, setIsIconCatalogOpen] = useState(false);

  useEffect(() => {
    setLocalInput(locationInput);
    setHasUnsavedChanges(false);
  }, [locationInput]);

  const handleLocationSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = localInput.trim();
    if (!trimmed) return;
    setLocationInput(trimmed);
    fetchWeather();
    setHasUnsavedChanges(false);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-sky-400 font-bold font-mono">
          <CloudSun className="w-4 h-4" />
          <span>Weather System Configuration</span>
        </div>
        {status === 'loading' && (
          <span className="text-[10px] font-mono text-sky-400">Fetching...</span>
        )}
        {status === 'error' && (
          <span className="text-[10px] font-mono text-amber-400">Offline / Stale</span>
        )}
        {status === 'success' && (
          <span className="text-[10px] font-mono text-emerald-400">Live</span>
        )}
      </div>

      {/* City or Zip Input */}
      <div>
        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">
          City or Zip Code
        </label>
        <form onSubmit={handleLocationSubmit} className="flex gap-1.5">
          <input
            id="inspector-weather-location-input"
            type="text"
            value={localInput}
            onChange={(e) => {
              setLocalInput(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="e.g. San Mateo, CA or 94401"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              hasUnsavedChanges
                ? 'bg-sky-500 text-white shadow-md hover:bg-sky-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
            title="Submit location to fetch weather"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Set</span>
          </button>
        </form>
        {resolvedLocation && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate">Resolved: {resolvedLocation.name}</span>
          </div>
        )}
      </div>

      {/* Temperature Unit Toggle */}
      <div>
        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">
          Temperature Unit (Refetches API)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="inspector-weather-unit-f"
            type="button"
            onClick={() => setUnit('F')}
            className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              unit === 'F'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Fahrenheit (°F)</span>
          </button>
          <button
            id="inspector-weather-unit-c"
            type="button"
            onClick={() => setUnit('C')}
            className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              unit === 'C'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Celsius (°C)</span>
          </button>
        </div>
      </div>

      {/* Display Size / Font Scaling Control (Fix 6) */}
      <div>
        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">
          Display Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            id="inspector-weather-scale-sm"
            type="button"
            onClick={() => setDisplayScale('sm')}
            className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              displayScale === 'sm'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Small</span>
          </button>
          <button
            id="inspector-weather-scale-md"
            type="button"
            onClick={() => setDisplayScale('md')}
            className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              displayScale === 'md'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Medium</span>
          </button>
          <button
            id="inspector-weather-scale-lg"
            type="button"
            onClick={() => setDisplayScale('lg')}
            className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              displayScale === 'lg'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <span>Large</span>
          </button>
        </div>
      </div>

      {/* Refresh Action */}
      <button
        type="button"
        onClick={() => fetchWeather()}
        disabled={status === 'loading'}
        className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
      >
        <RotateCcw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
        <span>Refresh Weather Data</span>
      </button>

      {/* Collapsible Condition Icon Reference (Fix 5) */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          type="button"
          onClick={() => setIsIconCatalogOpen(!isIconCatalogOpen)}
          className="w-full flex items-center justify-between text-xs font-mono font-bold text-slate-300 hover:text-white cursor-pointer py-1"
        >
          <span className="flex items-center gap-2">
            <span>Condition Icon Reference</span>
            <span className="text-[10px] text-slate-500 font-normal">({REFERENCE_ICONS.length})</span>
          </span>
          {isIconCatalogOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isIconCatalogOpen && (
          <div className="mt-3 space-y-2">
            {/* TODO: icon swap not yet implemented */}
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {REFERENCE_ICONS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800/80"
                >
                  <div className="p-1 rounded-lg bg-slate-950/80 border border-slate-800/60 shrink-0">
                    <WeatherIcon condition={item.key} size={24} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 font-bold truncate">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {lastFetchedAt && (
        <div className="text-[9px] font-mono text-slate-500 text-center">
          Last synchronized: {new Date(lastFetchedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

const WeatherRadarPropertiesSection: React.FC = () => {
  const radarZoom = useWeatherStore((s) => s.radarZoom);
  const setRadarZoom = useWeatherStore((s) => s.setRadarZoom);
  const radarRefreshInterval = useWeatherStore((s) => s.radarRefreshInterval);
  const setRadarRefreshInterval = useWeatherStore((s) => s.setRadarRefreshInterval);
  const radarLabel = useWeatherStore((s) => s.radarLabel);
  const setRadarLabel = useWeatherStore((s) => s.setRadarLabel);

  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-sky-400 font-bold font-mono">
          <Layers className="w-4 h-4" />
          <span>Weather Radar Configuration</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">RainViewer API</span>
      </div>

      {/* Radar Card Label (Editable text) */}
      <div>
        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">
          Radar Card Label
        </label>
        <input
          id="inspector-weather-radar-label-input"
          type="text"
          value={radarLabel}
          onChange={(e) => setRadarLabel(e.target.value)}
          placeholder="e.g. LOCAL RADAR"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 transition-colors font-bold uppercase"
        />
      </div>

      {/* Zoom Level Control (Clamped 0..7) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">
            Radar Zoom Level (Clamped 0–7)
          </label>
          <span className="text-xs font-mono text-sky-400 font-bold">
            {radarZoom} / 7
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="inspector-weather-radar-zoom-slider"
            type="range"
            min={0}
            max={7}
            step={1}
            value={radarZoom}
            onChange={(e) => setRadarZoom(Number(e.target.value))}
            className="flex-1 accent-sky-500 cursor-pointer"
          />
          <div className="flex gap-1">
            {[3, 5, 6, 7].map((z) => (
              <button
                key={z}
                type="button"
                id={`inspector-weather-radar-zoom-preset-${z}`}
                onClick={() => setRadarZoom(z)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                  radarZoom === z
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {z}x
              </button>
            ))}
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-mono mt-1 block">
          RainViewer free public radar imagery is capped at zoom level 7.
        </span>
      </div>

      {/* Refresh Interval */}
      <div>
        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">
          Tile Frame Refresh Interval
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 5, 10].map((mins) => (
            <button
              key={mins}
              type="button"
              id={`inspector-weather-radar-refresh-${mins}m`}
              onClick={() => setRadarRefreshInterval(mins)}
              className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${
                radarRefreshInterval === mins
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{mins} min</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ScreenPropertiesPanel: React.FC = () => {
  const activeView = useMockpitStore((s) => s.activeView);
  const screens = useMockpitStore((s) => s.screens);
  const updateScreen = useMockpitStore((s) => s.updateScreen);
  const deleteScreen = useMockpitStore((s) => s.deleteScreen);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const activeScreen = screens.find((s) => s.id === activeView) || screens[0];
  const isHome = activeScreen?.id === 'home';
  const compCount = (componentsByScreen[activeScreen?.id] || []).length;
  const childScreens = screens.filter((s) => s.parentId === activeScreen?.id);

  const transitionOptions: Array<{ id: TransitionStyle; label: string; desc: string }> = [
    { id: 'fade', label: 'Fade', desc: 'Smooth cross-fade opacity transition' },
    { id: 'slideUp', label: 'Slide Up', desc: 'Enters from bottom edge' },
    { id: 'slideDown', label: 'Slide Down', desc: 'Enters from top edge' },
    { id: 'slideLeft', label: 'Slide Left', desc: 'Enters from right edge' },
    { id: 'slideRight', label: 'Slide Right', desc: 'Enters from left edge' },
  ];

  if (!activeScreen) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Current Screen</span>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5 font-mono">
            {activeScreen.name}
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
          {compCount} {compCount === 1 ? 'component' : 'components'}
        </span>
      </div>

      {/* Screen Name */}
      <div>
        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">
          Screen Name
        </label>
        <input
          type="text"
          disabled={isHome}
          value={activeScreen.name}
          onChange={(e) => updateScreen(activeScreen.id, { name: e.target.value })}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-sky-500 transition-colors ${
            isHome ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          placeholder="e.g. Navigation, Diagnostics..."
        />
        {isHome && (
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Home screen is pinned as 'Home' and cannot be renamed or deleted.
          </span>
        )}
      </div>

      {/* Parent Screen Selector */}
      {!isHome && (
        <div>
          <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">
            Parent Screen (Hierarchy)
          </label>
          <select
            value={activeScreen.parentId || ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : e.target.value;
              updateScreen(activeScreen.id, { parentId: val });
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-sky-500 font-mono cursor-pointer"
          >
            <option value="">None (Top-Level Screen)</option>
            {screens
              .filter((s) => !s.parentId && s.id !== activeScreen.id)
              .map((parent) => (
                <option key={parent.id} value={parent.id}>
                  Child of {parent.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Transition Style Selector */}
      <div>
        <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1.5 font-bold">
          Presentation Transition Style
        </label>
        <div className="space-y-1.5">
          {transitionOptions.map((opt) => {
            const isSelected = (activeScreen.transitionStyle || 'fade') === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => updateScreen(activeScreen.id, { transitionStyle: opt.id })}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-500/50 text-slate-100 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5 font-mono">
                    <span className={isSelected ? 'text-sky-400' : ''}>{opt.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weather Properties & Radar Configuration (Scoped exclusively to Weather screen) */}
      {activeScreen.id === 'weather' && (
        <>
          <WeatherPropertiesSection />
          <WeatherRadarPropertiesSection />
        </>
      )}

      {/* Reorder Dock Note */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 font-mono space-y-1">
        <div className="font-bold text-slate-300">Screen Ordering</div>
        <div>
          To reorder screens, drag or use the directional arrows in the bottom dock bar below the canvas.
        </div>
      </div>

      {/* Delete Screen Action */}
      {!isHome && (
        <div className="border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Screen
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && !isHome && activeScreen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wide font-mono">
                  Delete Screen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 font-mono">
              <p>
                Are you sure you want to delete <span className="font-bold text-sky-300">"{activeScreen.name}"</span> and all its components?
              </p>
              {childScreens.length > 0 && (
                <div className="text-amber-400 text-[11px] bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl font-mono">
                  <span className="font-bold block mb-0.5">⚠️ Child Screens Included</span>
                  Deleting "{activeScreen.name}" will also delete {childScreens.length} child screen{childScreens.length > 1 ? 's' : ''} ({childScreens.map((c) => c.name).join(', ')}).
                </div>
              )}
              <p className="text-slate-400 text-[11px]">This action cannot be undone.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  deleteScreen(activeScreen.id);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VEHICLE_STATE_FIELDS: Array<{ field: keyof VehicleState; label: string; type: 'number' | 'boolean' | 'select' }> = [
  { field: 'gear', label: 'Gear (P/R/N/D)', type: 'select' },
  { field: 'driveMode', label: 'Drive Mode (Eco/Normal/Sport)', type: 'select' },
  { field: 'speed', label: 'Speed', type: 'number' },
  { field: 'batteryPercent', label: 'Battery % (0-100)', type: 'number' },
  { field: 'isCharging', label: 'Is Charging', type: 'boolean' },
  { field: 'doorOpen', label: 'Door Open', type: 'boolean' },
  { field: 'cruiseControlActive', label: 'Cruise Control Active', type: 'boolean' },
  { field: 'tirePressureWarning', label: 'Tire Pressure Warning', type: 'boolean' },
];

const CONDITIONS: BindingCondition[] = ['<', '>', '=', '!=', '>='];
const TARGET_PROPS: TargetProp[] = ['color', 'visible', 'opacity', 'text', 'icon', 'severity'];

const GeometryInput: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}> = ({ label, value, onChange, min = 0, max }) => {
  const [localVal, setLocalVal] = useState<string>(String(value));

  React.useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  const handleCommit = () => {
    let num = parseInt(localVal, 10);
    if (isNaN(num)) num = value;
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    setLocalVal(String(num));
    onChange(num);
  };

  return (
    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 focus-within:border-sky-500/80 focus-within:ring-1 focus-within:ring-sky-500/40 transition-all">
      <label className="text-[10px] text-slate-400 uppercase font-mono block">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localVal}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleCommit();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-full bg-transparent text-slate-100 font-mono font-bold focus:outline-none"
      />
    </div>
  );
};

export const Inspector: React.FC = () => {
  const selectedComponentId = useMockpitStore((s) => s.selectedComponentId);
  const components = useMockpitStore((s) => s.components);
  const notificationComponents = useMockpitStore((s) => s.notificationComponents);
  const notificationStackPosition = useMockpitStore((s) => s.notificationStackPosition);
  const activePalette = useMockpitStore((s) => s.activePalette);
  const setNotificationStackPosition = useMockpitStore((s) => s.setNotificationStackPosition);
  const selectComponent = useMockpitStore((s) => s.selectComponent);
  const updateComponentStaticProps = useMockpitStore((s) => s.updateComponentStaticProps);
  const updateComponentConnector = useMockpitStore((s) => s.updateComponentConnector);
  const updateComponentPosition = useMockpitStore((s) => s.updateComponentPosition);
  const updateComponentSize = useMockpitStore((s) => s.updateComponentSize);
  const updateComponentZIndex = useMockpitStore((s) => s.updateComponentZIndex);
  const bringToFront = useMockpitStore((s) => s.bringToFront);
  const setEgoVehicleType = useMockpitStore((s) => s.setEgoVehicleType);
  const egoVehicleType = useMockpitStore((s) => s.egoVehicleType);
  const sendToBack = useMockpitStore((s) => s.sendToBack);
  const addBinding = useMockpitStore((s) => s.addBinding);
  const updateBinding = useMockpitStore((s) => s.updateBinding);
  const removeBinding = useMockpitStore((s) => s.removeBinding);
  const deleteComponent = useMockpitStore((s) => s.deleteComponent);
  const selectedMusicService = useMockpitStore((s) => s.selectedMusicService);
  const setSelectedMusicService = useMockpitStore((s) => s.setSelectedMusicService);

  const selectedComp =
    components.find((c) => c.id === selectedComponentId) ||
    notificationComponents.find((c) => c.id === selectedComponentId);

  const isNotifComp = selectedComp ? notificationComponents.some((c) => c.id === selectedComp.id) : false;

  // New binding draft state
  const [newBinding, setNewBinding] = useState<{
    stateField: keyof VehicleState;
    condition: BindingCondition;
    value: string;
    targetProp: TargetProp;
    targetValue: string;
  }>({
    stateField: 'batteryPercent',
    condition: '<',
    value: '15',
    targetProp: 'color',
    targetValue: '#ef4444',
  });

  const [isAddingBinding, setIsAddingBinding] = useState(false);
  const [activeTab, setActiveTab] = useState<'component' | 'screen' | 'layers'>('screen');

  // Track expanded state of collapsible sections.
  // Defaults: 'geometry', 'stacking', 'bindings' are collapsed (false).
  // 'appearance' and other sections default to expanded (true).
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    geometry: true,
    stacking: true,
    bindings: true,
  });

  useEffect(() => {
    if (selectedComponentId) {
      setActiveTab('component');
      // Reset collapse state on component selection/reselection
      setCollapsedSections({
        geometry: true,
        stacking: true,
        bindings: true,
      });
    }
  }, [selectedComponentId]);

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleStaticPropChange = (key: string, value: string) => {
    if (!selectedComp) return;
    updateComponentStaticProps(selectedComp.id, { [key]: value });
  };

  const handleAddBindingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComp) return;
    let typedValue: string | number | boolean = newBinding.value;
    if (
      newBinding.stateField === 'isCharging' ||
      newBinding.stateField === 'doorOpen' ||
      newBinding.stateField === 'cruiseControlActive' ||
      newBinding.stateField === 'tirePressureWarning'
    ) {
      typedValue = newBinding.value === 'true';
    } else if (newBinding.stateField === 'speed' || newBinding.stateField === 'batteryPercent') {
      typedValue = Number(newBinding.value) || 0;
    }

    addBinding(selectedComp.id, {
      stateField: newBinding.stateField,
      condition: newBinding.condition,
      value: typedValue,
      targetProp: newBinding.targetProp,
      targetValue: newBinding.targetValue,
    });

    setIsAddingBinding(false);
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 select-none">
      {/* Top Inspector Tab Bar */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/80 flex items-center gap-1">
        <button
          onClick={() => setActiveTab('component')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'component'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Component</span>
        </button>

        <button
          onClick={() => setActiveTab('screen')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'screen'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Screen</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'layers'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'screen' && <ScreenPropertiesPanel />}

      {activeTab === 'layers' && (
        <div className="flex-1 flex flex-col overflow-y-auto">
          <LayersPanel className="flex-1" />
        </div>
      )}

      {activeTab === 'component' && !selectedComp && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <Sliders className="w-10 h-10 mb-3 text-slate-700" />
          <div className="text-xs font-bold text-slate-400 mb-1">No Component Selected</div>
          <p className="text-[11px] font-mono">
            Click any element on canvas to inspect properties and rules, or switch to the Screen tab.
          </p>
        </div>
      )}

      {activeTab === 'component' && selectedComp && (
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
                Inspector Panel
              </span>
              <h2 className="text-sm font-bold text-slate-100">
                {DEFAULT_COMPONENT_LABELS[selectedComp.type] || selectedComp.type}
              </h2>
            </div>
            <button
              onClick={() => selectComponent(null)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title="Deselect"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-6">
        {/* Layout Geometry */}
        <div className="border-b border-slate-800/80 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('geometry')}
            className="w-full flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer text-left select-none group min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Geometry {isNotifComp ? '(Width & Height)' : '(X, Y, W, H)'}
              </span>
            </div>
            <div className="p-1 text-slate-400 group-hover:text-slate-200 transition-transform">
              {collapsedSections.geometry ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {!collapsedSections.geometry && (
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              {isNotifComp ? (
                <div className="col-span-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block">X, Y Position</label>
                  <span className="text-[11px] text-sky-400 font-mono font-semibold block py-0.5">Auto-Stacked</span>
                </div>
              ) : (
                <>
                  <GeometryInput
                    label="X Position"
                    value={selectedComp.x}
                    onChange={(val) => updateComponentPosition(selectedComp.id, val, selectedComp.y)}
                  />
                  <GeometryInput
                    label="Y Position"
                    value={selectedComp.y}
                    onChange={(val) => updateComponentPosition(selectedComp.id, selectedComp.x, val)}
                  />
                </>
              )}
              <GeometryInput
                label="Width"
                value={selectedComp.width}
                min={100}
                onChange={(val) => updateComponentSize(selectedComp.id, val, selectedComp.height)}
              />
              <GeometryInput
                label="Height"
                value={selectedComp.height}
                min={60}
                max={Math.max(60, 1080 - selectedComp.y)}
                onChange={(val) => updateComponentSize(selectedComp.id, selectedComp.width, val)}
              />
            </div>
          )}
        </div>

        {/* Stacking / Layering Section */}
        {!isNotifComp && (
          <div className="border-b border-slate-800/80 pb-4">
            <button
              type="button"
              onClick={() => toggleSection('stacking')}
              className="w-full flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer text-left select-none group min-h-[44px]"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Stacking Layer
                </span>
              </div>
              <div className="p-1 text-slate-400 group-hover:text-slate-200 transition-transform">
                {collapsedSections.stacking ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {!collapsedSections.stacking && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400">Current Depth</span>
                  <span className="text-[10px] font-mono text-slate-500">Z-Index: {selectedComp.zIndex ?? (selectedComp.type === 'map' ? 0 : 10)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => bringToFront(selectedComp.id)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Bring component to the front layer"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                    Bring to Front
                  </button>
                  <button
                    type="button"
                    onClick={() => sendToBack(selectedComp.id)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Send component to the back layer"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                    Send to Back
                  </button>
                </div>
                <GeometryInput
                  label="Explicit Z-Index (-10 to 100)"
                  value={selectedComp.zIndex ?? (selectedComp.type === 'map' ? 0 : 10)}
                  min={-10}
                  max={100}
                  onChange={(val) => updateComponentZIndex(selectedComp.id, val)}
                />
              </div>
            )}
          </div>
        )}

        {isNotifComp && (
          <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/50 text-[11px] text-sky-300 flex flex-col gap-1.5">
            <div className="font-semibold flex items-center justify-between">
              <span>Stack Position:</span>
              <select
                value={notificationStackPosition}
                onChange={(e) => setNotificationStackPosition(e.target.value as NotificationStackPosition)}
                className="bg-slate-900 text-sky-200 border border-sky-700/60 rounded px-1.5 py-0.5 text-xs font-mono font-bold focus:outline-none"
              >
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-center">Bottom Center</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Position is computed automatically by the global notification stack layout in Presentation mode.
            </p>
          </div>
        )}

        {/* Static Appearance Properties */}
        <div className="border-b border-slate-800/80 pb-4">
          <button
            type="button"
            onClick={() => toggleSection('appearance')}
            className="w-full flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer text-left select-none group min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Static Appearance
              </span>
            </div>
            <div className="p-1 text-slate-400 group-hover:text-slate-200 transition-transform">
              {collapsedSections.appearance ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {!collapsedSections.appearance && (
          <div className="space-y-2 text-xs mt-2">
            {/* Header Label Field for ALL Component Types */}
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">Header Label</span>
              <input
                type="text"
                value={selectedComp.staticProps.label ?? ''}
                placeholder={DEFAULT_COMPONENT_LABELS[selectedComp.type] || 'Header Label'}
                onChange={(e) => handleStaticPropChange('label', e.target.value)}
                className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right"
              />
            </div>

            {selectedComp.type === 'speed' && (
              <>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Display Style</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['numeric', 'radialGauge', 'arcGauge'] as const).map((styleOpt) => {
                      const currentStyle = selectedComp.staticProps.displayStyle || 'numeric';
                      const isActive = currentStyle === styleOpt;
                      const labels = { numeric: 'Numeric', radialGauge: 'Radial', arcGauge: 'Arc' };
                      return (
                        <button
                          key={styleOpt}
                          type="button"
                          onClick={() => {
                            handleStaticPropChange('displayStyle', styleOpt);
                            if (styleOpt === 'radialGauge' || styleOpt === 'arcGauge') {
                              updateComponentSize(selectedComp.id, 240, 240);
                            } else if (styleOpt === 'numeric') {
                              updateComponentSize(selectedComp.id, 220, 150);
                            }
                          }}
                          className={`py-1 px-1 rounded text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                            isActive
                              ? 'bg-sky-500 text-slate-950 shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                          }`}
                        >
                          {labels[styleOpt]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(selectedComp.staticProps.displayStyle === 'radialGauge' || selectedComp.staticProps.displayStyle === 'arcGauge') && (
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400 font-bold">Max Speed</span>
                    <NumericStepper
                      value={selectedComp.staticProps.maxSpeed || '140'}
                      onChange={(val) => handleStaticPropChange('maxSpeed', val)}
                      placeholder="140"
                      min={10}
                      max={300}
                      step={10}
                    />
                  </div>
                )}

                {selectedComp.staticProps.displayStyle === 'arcGauge' && (
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                      Arc Gradient Stops
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { key: 'arcStop1Color', label: '0%', default: '#10b981' },
                        { key: 'arcStop2Color', label: '25%', default: '#06b6d4' },
                        { key: 'arcStop3Color', label: '50%', default: '#38bdf8' },
                        { key: 'arcStop4Color', label: '75%', default: '#f59e0b' },
                        { key: 'arcStop5Color', label: '100%', default: '#ef4444' },
                      ].map((stop) => {
                        const currentColor = selectedComp.staticProps[stop.key] || stop.default;
                        return (
                          <div key={stop.key} className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-mono text-slate-400 font-bold">{stop.label}</span>
                            <input
                              type="color"
                              value={currentColor}
                              onChange={(e) => handleStaticPropChange(stop.key, e.target.value)}
                              className="w-7 h-7 rounded border border-slate-700 bg-slate-900 cursor-pointer p-0.5"
                              title={`Stop ${stop.label} color (${stop.key})`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedComp.type === 'battery' && (
              <>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">Drain % / Interval</span>
                  <NumericStepper
                    min={0.1}
                    step={0.5}
                    value={selectedComp.staticProps.drainPercentPerInterval ?? '1'}
                    onChange={(val) => handleStaticPropChange('drainPercentPerInterval', val)}
                    placeholder="1"
                  />
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">Drain Interval (sec)</span>
                  <NumericStepper
                    min={1}
                    step={1}
                    value={selectedComp.staticProps.drainIntervalSeconds ?? '60'}
                    onChange={(val) => handleStaticPropChange('drainIntervalSeconds', val)}
                    placeholder="60"
                  />
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">Target Charge %</span>
                  <NumericStepper
                    min={10}
                    max={100}
                    step={5}
                    value={selectedComp.staticProps.targetChargePercent ?? '80'}
                    onChange={(val) => handleStaticPropChange('targetChargePercent', val)}
                    placeholder="80"
                  />
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">Charge Rate (kW)</span>
                  <NumericStepper
                    min={1}
                    step={10}
                    value={selectedComp.staticProps.chargeRateKw ?? '350'}
                    onChange={(val) => handleStaticPropChange('chargeRateKw', val)}
                    placeholder="350"
                  />
                </div>
              </>
            )}

            {selectedComp.type === 'navDestination' && (
              <div className="space-y-2">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                  <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block">
                    Primary Destination
                  </span>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono">Location Name</span>
                    <input
                      type="text"
                      value={selectedComp.staticProps.destination || ''}
                      onChange={(e) => handleStaticPropChange('destination', e.target.value)}
                      placeholder="e.g. Yosemite Valley, CA"
                      className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">Latitude</span>
                      <input
                        type="text"
                        value={selectedComp.staticProps.destLat || selectedComp.staticProps.lat || ''}
                        onChange={(e) => {
                          handleStaticPropChange('destLat', e.target.value);
                          handleStaticPropChange('lat', e.target.value);
                        }}
                        placeholder="37.7456"
                        className="w-full bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">Longitude</span>
                      <input
                        type="text"
                        value={selectedComp.staticProps.destLng || selectedComp.staticProps.lng || ''}
                        onChange={(e) => {
                          handleStaticPropChange('destLng', e.target.value);
                          handleStaticPropChange('lng', e.target.value);
                        }}
                        placeholder="-119.5936"
                        className="w-full bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block">
                      Waypoints / Stops (Lat/Long)
                    </span>
                    <button
                      onClick={() => {
                        let currentStops: Array<{ id: string; name: string; lat: string; lng: string }> = [];
                        try {
                          if (selectedComp.staticProps.tripStops) {
                            currentStops = JSON.parse(selectedComp.staticProps.tripStops);
                          } else if (selectedComp.staticProps.waypoints) {
                            const wp = JSON.parse(selectedComp.staticProps.waypoints);
                            currentStops = wp.map((w: any, idx: number) => ({
                              id: `stop-${idx + 1}`,
                              name: typeof w === 'string' ? w : w.name || `Stop ${idx + 1}`,
                              lat: w.lat || '37.3022',
                              lng: w.lng || '-120.4830',
                            }));
                          }
                        } catch (e) {
                          currentStops = [];
                        }
                        const newStops = [
                          ...currentStops,
                          {
                            id: `stop-${Date.now()}`,
                            name: `Stop ${currentStops.length + 1}`,
                            lat: '37.5000',
                            lng: '-120.0000',
                          },
                        ];
                        handleStaticPropChange('tripStops', JSON.stringify(newStops));
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 cursor-pointer font-bold"
                    >
                      + Add Stop
                    </button>
                  </div>

                  {(() => {
                    let stops: Array<{ id: string; name: string; lat: string; lng: string }> = [];
                    try {
                      if (selectedComp.staticProps.tripStops) {
                        stops = JSON.parse(selectedComp.staticProps.tripStops);
                      } else if (selectedComp.staticProps.waypoints) {
                        const wp = JSON.parse(selectedComp.staticProps.waypoints);
                        stops = wp.map((w: any, idx: number) => ({
                          id: `stop-${idx + 1}`,
                          name: typeof w === 'string' ? w : w.name || `Stop ${idx + 1}`,
                          lat: w.lat || (idx === 0 ? '37.3022' : '37.7158'),
                          lng: w.lng || (idx === 0 ? '-120.4830' : '-119.6775'),
                        }));
                      } else {
                        stops = [
                          { id: 'stop-1', name: 'Merced, CA', lat: '37.3022', lng: '-120.4830' },
                          { id: 'stop-2', name: 'Mariposa, CA', lat: '37.4849', lng: '-119.9663' },
                        ];
                      }
                    } catch (e) {
                      stops = [];
                    }

                    return (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {stops.map((stop, idx) => (
                          <div key={stop.id || idx} className="p-2 rounded bg-slate-900/80 border border-slate-700/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-slate-300">Stop {idx + 1}</span>
                              <button
                                onClick={() => {
                                  const updated = stops.filter((_, i) => i !== idx);
                                  handleStaticPropChange('tripStops', JSON.stringify(updated));
                                }}
                                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                            <input
                              type="text"
                              value={stop.name}
                              onChange={(e) => {
                                const updated = [...stops];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                handleStaticPropChange('tripStops', JSON.stringify(updated));
                              }}
                              placeholder="Stop name"
                              className="w-full bg-slate-950 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-800"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                value={stop.lat}
                                onChange={(e) => {
                                  const updated = [...stops];
                                  updated[idx] = { ...updated[idx], lat: e.target.value };
                                  handleStaticPropChange('tripStops', JSON.stringify(updated));
                                }}
                                placeholder="Lat"
                                className="w-full bg-slate-950 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-800"
                              />
                              <input
                                type="text"
                                value={stop.lng}
                                onChange={(e) => {
                                  const updated = [...stops];
                                  updated[idx] = { ...updated[idx], lng: e.target.value };
                                  handleStaticPropChange('tripStops', JSON.stringify(updated));
                                }}
                                placeholder="Lng"
                                className="w-full bg-slate-950 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-800"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {selectedComp.type === 'navTripEstimate' && (
              <div className="space-y-2">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                  <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block">
                    Route Simulation Parameters
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">Start Lat</span>
                      <input
                        type="text"
                        value={selectedComp.staticProps.startLat || ''}
                        onChange={(e) => handleStaticPropChange('startLat', e.target.value)}
                        placeholder="37.3318"
                        className="w-full bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">Start Lng</span>
                      <input
                        type="text"
                        value={selectedComp.staticProps.startLng || ''}
                        onChange={(e) => handleStaticPropChange('startLng', e.target.value)}
                        placeholder="-122.0311"
                        className="w-full bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400 capitalize">Consumption Rate</span>
                    <input
                      type="text"
                      value={selectedComp.staticProps.consumptionRate || ''}
                      onChange={(e) => handleStaticPropChange('consumptionRate', e.target.value)}
                      placeholder="0.32"
                      className="w-32 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right"
                    />
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">Distance Label</span>
                    <input
                      type="text"
                      value={selectedComp.staticProps.distanceLabel ?? 'Distance'}
                      onChange={(e) => handleStaticPropChange('distanceLabel', e.target.value)}
                      placeholder="Distance"
                      className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right"
                    />
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">Estimated Time Label</span>
                    <input
                      type="text"
                      value={selectedComp.staticProps.estimatedTimeLabel ?? 'Estimated Time'}
                      onChange={(e) => handleStaticPropChange('estimatedTimeLabel', e.target.value)}
                      placeholder="Estimated Time"
                      className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right"
                    />
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">Energy Required Label</span>
                    <input
                      type="text"
                      value={selectedComp.staticProps.energyRequiredLabel ?? 'Energy Required'}
                      onChange={(e) => handleStaticPropChange('energyRequiredLabel', e.target.value)}
                      placeholder="Energy Required"
                      className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right"
                    />
                  </div>
                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">Arrival Charge Label</span>
                    <input
                      type="text"
                      value={selectedComp.staticProps.arrivalChargeLabel ?? 'Arrival Charge'}
                      onChange={(e) => handleStaticPropChange('arrivalChargeLabel', e.target.value)}
                      placeholder="Arrival Charge"
                      className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedComp.type === 'media' && (
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold">
                  Music Service
                </label>
                <select
                  value={selectedMusicService || selectedComp.staticProps.service || 'Spotify'}
                  onChange={(e) => {
                    handleStaticPropChange('service', e.target.value);
                    setSelectedMusicService(e.target.value);
                  }}
                  className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                >
                  <option value="Spotify">Spotify</option>
                  <option value="Apple Music">Apple Music</option>
                  <option value="YouTube Music">YouTube Music</option>
                  <option value="Amazon Music">Amazon Music</option>
                </select>
              </div>
            )}

            {selectedComp.type === 'mediaPlaylists' && (
              <div className="space-y-3">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold">
                    Layout
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleStaticPropChange('cardLayoutMode', 'grid')}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        (selectedComp.staticProps?.cardLayoutMode || 'grid') === 'grid'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStaticPropChange('cardLayoutMode', 'carousel')}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedComp.staticProps?.cardLayoutMode === 'carousel'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      Carousel
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold">
                    Synchronized Music Service
                  </label>
                  <select
                    value={selectedMusicService || 'Spotify'}
                    onChange={(e) => {
                      setSelectedMusicService(e.target.value);
                    }}
                    className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                  >
                    <option value="Spotify">Spotify</option>
                    <option value="Apple Music">Apple Music</option>
                    <option value="YouTube Music">YouTube Music</option>
                    <option value="Amazon Music">Amazon Music</option>
                  </select>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Synchronized across Media components
                  </span>
                </div>
              </div>
            )}

            {selectedComp.type === 'mediaSearch' && (
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold">
                  Media Search Mode
                </label>
                <div className="text-xs text-slate-300 font-mono">
                  Federated cross-source search across Spotify, Apple Music & Radio with Mocked NLU + Voice query.
                </div>
              </div>
            )}

            {selectedComp.type === 'mediaDiscovery' && (
              <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                  Discovery Settings
                </span>

                {/* Content Mode */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold">
                    Content Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleStaticPropChange('mode', 'trending')}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        (selectedComp.staticProps?.mode || 'trending') === 'trending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      Trending
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStaticPropChange('mode', 'foryou')}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedComp.staticProps?.mode === 'foryou'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      For You
                    </button>
                  </div>
                </div>

                {/* Layout Orientation */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold">
                    Layout
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleStaticPropChange('layout', 'horizontal')}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        (selectedComp.staticProps?.layout || 'horizontal') === 'horizontal'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      Horizontal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStaticPropChange('layout', 'vertical')}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedComp.staticProps?.layout === 'vertical'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      Vertical
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStaticPropChange('layout', 'grid')}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedComp.staticProps?.layout === 'grid'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      Grid
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedComp.type === 'nowPlaying' && (
              <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                  Now Playing Settings
                </span>

                {/* Layout Orientation */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold flex items-center justify-between">
                    <span>Layout Orientation</span>
                    <span className="text-[9px] text-sky-400 font-normal">Card Layout</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['horizontal', 'vertical'] as const).map((orient) => {
                      const isActive = (selectedComp.staticProps.orientation || 'horizontal') === orient;
                      return (
                        <button
                          key={orient}
                          type="button"
                          onClick={() => {
                            const prevOrient = selectedComp.staticProps.orientation || 'horizontal';
                            handleStaticPropChange('orientation', orient);
                            if (orient !== prevOrient) {
                              if (orient === 'horizontal' && selectedComp.width < selectedComp.height) {
                                updateComponentSize(selectedComp.id, Math.max(400, selectedComp.height), 180);
                              } else if (orient === 'vertical' && selectedComp.width > selectedComp.height) {
                                updateComponentSize(selectedComp.id, 280, Math.max(320, selectedComp.height));
                              }
                            }
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all border capitalize ${
                            isActive
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {orient}
                        </button>
                      );
                    })}
                  </div>
                </div>

                  {/* Auto-Dismiss Controls */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-slate-300 font-bold block">Auto-Dismiss</span>
                      <span className="text-[10px] text-slate-400">Slide off screen after song start</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = selectedComp.staticProps.autoDismissEnabled === 'true';
                        handleStaticPropChange('autoDismissEnabled', current ? 'false' : 'true');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all border ${
                        selectedComp.staticProps.autoDismissEnabled === 'true'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {selectedComp.staticProps.autoDismissEnabled === 'true' ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Auto-Dismiss Options: Slide Direction and Delay */}
                  {selectedComp.staticProps.autoDismissEnabled === 'true' && (
                    <div className="pt-2 border-t border-slate-700/60 space-y-2.5">
                      {/* Slide Direction */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold flex items-center justify-between">
                          <span>Dismiss Direction</span>
                          <span className="text-[9px] text-sky-400 font-normal">Slide Off Canvas</span>
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                          {(
                            [
                              { dir: 'up', label: 'Up', Icon: ArrowUp },
                              { dir: 'down', label: 'Down', Icon: ArrowDown },
                              { dir: 'left', label: 'Left', Icon: ArrowLeft },
                              { dir: 'right', label: 'Right', Icon: ArrowRight },
                            ] as const
                          ).map(({ dir, label, Icon }) => {
                            const currentDir = selectedComp.staticProps.dismissDirection || 'down';
                            const isActive = currentDir === dir;
                            return (
                              <button
                                key={dir}
                                type="button"
                                onClick={() => handleStaticPropChange('dismissDirection', dir)}
                                className={`py-1 px-1 rounded-md text-[10px] font-mono font-bold transition-all border flex flex-col items-center gap-0.5 ${
                                  isActive
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                                }`}
                                title={`Slide ${label} when dismissed`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dismiss Duration */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/40">
                        <span className="text-[11px] font-mono text-slate-400">Dismiss After</span>
                        <div className="flex items-center gap-1.5">
                          <NumericStepper
                            min={1}
                            max={60}
                            step={1}
                            value={parseInt(selectedComp.staticProps.autoDismissSeconds || '8', 10)}
                            onChange={(val) => handleStaticPropChange('autoDismissSeconds', String(val))}
                          />
                          <span className="text-[11px] font-mono text-slate-400">sec</span>
                        </div>
                      </div>

                      {/* Slide Effect Duration in Milliseconds */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/40">
                        <div>
                          <span className="text-[11px] font-mono text-slate-300 font-bold block">Slide Duration</span>
                          <span className="text-[10px] text-slate-400">Effect speed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <NumericStepper
                            min={100}
                            max={5000}
                            step={50}
                            value={parseInt(selectedComp.staticProps.slideDurationMs || '800', 10)}
                            onChange={(val) => handleStaticPropChange('slideDurationMs', String(val))}
                          />
                          <span className="text-[11px] font-mono text-slate-400">ms</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Default Track Selection */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold">
                    Initial Track
                  </label>
                  <select
                    value={selectedComp.staticProps.trackId || SAMPLE_TRACKS[0].id}
                    onChange={(e) => handleStaticPropChange('trackId', e.target.value)}
                    className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                  >
                    {SAMPLE_TRACKS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} — {t.artist} ({t.duration})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Song Transition Selection */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold flex items-center justify-between">
                    <span>Song Transition</span>
                    <span className="text-[9px] text-sky-400 font-normal">Visual Transition</span>
                  </label>
                  <select
                    value={selectedComp.staticProps.songTransition || 'fade'}
                    onChange={(e) => handleStaticPropChange('songTransition', e.target.value)}
                    className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold capitalize"
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade</option>
                    <option value="crossfade">Crossfade</option>
                    <option value="slide">Slide</option>
                    <option value="zoom">Zoom</option>
                  </select>
                </div>

                {/* Song Info Display Duration (Compact / Constrained Layouts) */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold flex items-center justify-between">
                    <span>Song Info Display Duration</span>
                    <span className="text-[9px] text-sky-400 font-normal">Compact Mode</span>
                  </label>
                  <select
                    value={selectedComp.staticProps.songInfoDisplayDuration || '2.5'}
                    onChange={(e) => handleStaticPropChange('songInfoDisplayDuration', e.target.value)}
                    className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                  >
                    <option value="0.5">0.5 sec</option>
                    <option value="1">1 sec</option>
                    <option value="1.5">1.5 sec</option>
                    <option value="2">2 sec</option>
                    <option value="2.5">2.5 sec (Default)</option>
                    <option value="3">3 sec</option>
                    <option value="4">4 sec</option>
                    <option value="5">5 sec</option>
                  </select>
                  <p className="text-[10px] text-slate-400 font-sans leading-tight pt-0.5">
                    Controls how long song info stays visible when height is &lt; 125px before returning to scrubber.
                  </p>
                </div>

                {/* Track Typography & Colors */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2.5">
                  <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block">
                    Track Typography & Colors
                  </span>

                  {/* Song Title Controls */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-300 font-mono block font-semibold flex items-center justify-between">
                      <span>Song Title</span>
                      <span className="text-[9px] text-slate-400 font-normal">Font & Color</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 font-mono block mb-1">Font Size</label>
                        <select
                          value={selectedComp.staticProps.titleFontSize || 'default'}
                          onChange={(e) => handleStaticPropChange('titleFontSize', e.target.value)}
                          className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                        >
                          <option value="default">Default (Scale)</option>
                          <option value="xs">XS (Extra Small)</option>
                          <option value="sm">SM (Small)</option>
                          <option value="md">MD (Medium)</option>
                          <option value="lg">LG (Large)</option>
                          <option value="xl">XL (Extra Large)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-mono block mb-1">Color</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={selectedComp.staticProps.titleColor || '#f8fafc'}
                            onChange={(e) => handleStaticPropChange('titleColor', e.target.value)}
                            className="w-7 h-7 rounded bg-transparent border-none cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={selectedComp.staticProps.titleColor || '#f8fafc'}
                            onChange={(e) => handleStaticPropChange('titleColor', e.target.value)}
                            placeholder="#f8fafc"
                            className="w-full bg-slate-900 px-1.5 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Artist Controls */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-700/50">
                    <label className="text-[10px] text-slate-300 font-mono block font-semibold flex items-center justify-between">
                      <span>Artist</span>
                      <span className="text-[9px] text-slate-400 font-normal">Font & Color</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 font-mono block mb-1">Font Size</label>
                        <select
                          value={selectedComp.staticProps.artistFontSize || 'default'}
                          onChange={(e) => handleStaticPropChange('artistFontSize', e.target.value)}
                          className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                        >
                          <option value="default">Default (Scale)</option>
                          <option value="xs">XS (Extra Small)</option>
                          <option value="sm">SM (Small)</option>
                          <option value="md">MD (Medium)</option>
                          <option value="lg">LG (Large)</option>
                          <option value="xl">XL (Extra Large)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 font-mono block mb-1">Color</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={selectedComp.staticProps.artistColor || '#94a3b8'}
                            onChange={(e) => handleStaticPropChange('artistColor', e.target.value)}
                            className="w-7 h-7 rounded bg-transparent border-none cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={selectedComp.staticProps.artistColor || '#94a3b8'}
                            onChange={(e) => handleStaticPropChange('artistColor', e.target.value)}
                            placeholder="#94a3b8"
                            className="w-full bg-slate-900 px-1.5 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {['navSearch', 'media', 'navHome', 'navDestination', 'phoneContacts', 'phoneMessaging'].includes(selectedComp.type) && (
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold flex items-center justify-between">
                  <span>Keyboard Slide Override</span>
                  <span className="text-[9px] text-sky-400 font-normal">Touch Keyboard</span>
                </label>
                <select
                  value={selectedComp.staticProps.keyboardSlideDirection || 'default'}
                  onChange={(e) => handleStaticPropChange('keyboardSlideDirection', e.target.value)}
                  className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                >
                  <option value="default">Default (System Settings)</option>
                  <option value="bottom">Bottom Slide</option>
                  <option value="top">Top Slide</option>
                  <option value="left">Left Slide</option>
                  <option value="right">Right Slide</option>
                </select>
              </div>
            )}

            {selectedComp.type === 'climateTemp' && (
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-mono block font-bold flex items-center justify-between">
                  <span>Slider Orientation</span>
                  <span className="text-[9px] text-sky-400 font-normal">Layout</span>
                </label>
                <select
                  value={selectedComp.staticProps.orientation || 'vertical'}
                  onChange={(e) => {
                    const newOrient = e.target.value;
                    const prevOrient = selectedComp.staticProps.orientation || 'vertical';
                    handleStaticPropChange('orientation', newOrient);
                    if (newOrient !== prevOrient) {
                      const curW = selectedComp.width;
                      const curH = selectedComp.height;
                      if (
                        (newOrient === 'horizontal' && curW < curH) ||
                        (newOrient === 'vertical' && curW > curH)
                      ) {
                        updateComponentSize(selectedComp.id, curH, curW);
                      }
                    }
                  }}
                  className="w-full bg-slate-900 px-2 py-1.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                >
                  <option value="vertical">Vertical Stalk</option>
                  <option value="horizontal">Horizontal Scrubber</option>
                </select>
              </div>
            )}

            {selectedComp.type === 'overheadVisualization' && (
              <div className="space-y-3">
                {/* Ego Vehicle Model */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                  <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block">
                    Ego Vehicle Model
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-mono font-semibold">Silhouette</span>
                    <select
                      value={selectedComp.staticProps.egoVehicleType || 'auto'}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleStaticPropChange('egoVehicleType', val);
                        if (val !== 'auto') {
                          setEgoVehicleType(val as any);
                        }
                      }}
                      className="bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 font-semibold"
                    >
                      <option value="auto">Auto</option>
                      <option value="compactSedan">Compact Sedan</option>
                      <option value="midsizeSedan">Mid-size Sedan</option>
                      <option value="luxurySedan">Luxury Sedan</option>
                      <option value="truck">Truck</option>
                      <option value="coupe">Coupe</option>
                    </select>
                  </div>
                </div>

                {/* Traffic System */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                  <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block">
                    Traffic Density Control
                  </span>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] text-slate-300 font-mono">Preset</span>
                    <select
                      value={(() => {
                        const s = selectedComp.staticProps.sameDirCount;
                        const o = selectedComp.staticProps.opposingDirCount;
                        const td = selectedComp.staticProps.trafficDensity;
                        if (s === '2' && o === '1') return 'low';
                        if (s === '3' && o === '3') return 'medium';
                        if (s === '5' && o === '4') return 'high';
                        if (td === 'custom') return 'custom';
                        if (s !== undefined || o !== undefined) return 'custom';
                        return td || 'low';
                      })()}
                      onChange={(e) => {
                        const preset = e.target.value;
                        if (!selectedComp) return;
                        if (preset === 'low') {
                          updateComponentStaticProps(selectedComp.id, {
                            trafficDensity: 'low',
                            sameDirCount: '2',
                            opposingDirCount: '1',
                          });
                        } else if (preset === 'medium') {
                          updateComponentStaticProps(selectedComp.id, {
                            trafficDensity: 'medium',
                            sameDirCount: '3',
                            opposingDirCount: '3',
                          });
                        } else if (preset === 'high') {
                          updateComponentStaticProps(selectedComp.id, {
                            trafficDensity: 'high',
                            sameDirCount: '5',
                            opposingDirCount: '4',
                          });
                        } else if (preset === 'custom') {
                          updateComponentStaticProps(selectedComp.id, {
                            trafficDensity: 'custom',
                          });
                        }
                      }}
                      className="bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 font-semibold"
                    >
                      <option value="low">Low (3 Cars)</option>
                      <option value="medium">Medium (6 Cars)</option>
                      <option value="high">High (9 Cars)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-400 block font-mono mb-1">Same-Dir Vehicles</label>
                      <NumericStepper
                        min={0}
                        max={8}
                        step={1}
                        value={
                          selectedComp.staticProps.sameDirCount !== undefined
                            ? selectedComp.staticProps.sameDirCount
                            : selectedComp.staticProps.trafficDensity === 'high'
                            ? '5'
                            : selectedComp.staticProps.trafficDensity === 'medium'
                            ? '3'
                            : '2'
                        }
                        onChange={(val) => {
                          const currentOpp =
                            selectedComp.staticProps.opposingDirCount !== undefined
                              ? selectedComp.staticProps.opposingDirCount
                              : selectedComp.staticProps.trafficDensity === 'high'
                              ? '4'
                              : selectedComp.staticProps.trafficDensity === 'medium'
                              ? '3'
                              : '1';
                          let density = 'custom';
                          if (val === '2' && currentOpp === '1') density = 'low';
                          else if (val === '3' && currentOpp === '3') density = 'medium';
                          else if (val === '5' && currentOpp === '4') density = 'high';

                          updateComponentStaticProps(selectedComp.id, {
                            sameDirCount: val,
                            trafficDensity: density,
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block font-mono mb-1">Opposing Vehicles</label>
                      <NumericStepper
                        min={0}
                        max={8}
                        step={1}
                        value={
                          selectedComp.staticProps.opposingDirCount !== undefined
                            ? selectedComp.staticProps.opposingDirCount
                            : selectedComp.staticProps.trafficDensity === 'high'
                            ? '4'
                            : selectedComp.staticProps.trafficDensity === 'medium'
                            ? '3'
                            : '1'
                        }
                        onChange={(val) => {
                          const currentSame =
                            selectedComp.staticProps.sameDirCount !== undefined
                              ? selectedComp.staticProps.sameDirCount
                              : selectedComp.staticProps.trafficDensity === 'high'
                              ? '5'
                              : selectedComp.staticProps.trafficDensity === 'medium'
                              ? '3'
                              : '2';
                          let density = 'custom';
                          if (currentSame === '2' && val === '1') density = 'low';
                          else if (currentSame === '3' && val === '3') density = 'medium';
                          else if (currentSame === '5' && val === '4') density = 'high';

                          updateComponentStaticProps(selectedComp.id, {
                            opposingDirCount: val,
                            trafficDensity: density,
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                    <span className="text-[11px] text-slate-300 font-mono">Grayscale Traffic Vehicles</span>
                    <input
                      type="checkbox"
                      checked={selectedComp.staticProps.grayscaleTraffic !== 'false'}
                      onChange={(e) => handleStaticPropChange('grayscaleTraffic', e.target.checked ? 'true' : 'false')}
                      className="w-4 h-4 rounded bg-slate-900 border border-slate-700 text-sky-500 focus:ring-0 cursor-pointer accent-sky-500"
                    />
                  </div>
                </div>

                {/* Speed Limit Settings */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block">
                      Speed Limit Sign
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleStaticPropChange(
                          'speedLimitVisible',
                          selectedComp.staticProps.speedLimitVisible === 'false' ? 'true' : 'false'
                        )
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                        selectedComp.staticProps.speedLimitVisible !== 'false'
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {selectedComp.staticProps.speedLimitVisible !== 'false' ? 'SHOW' : 'HIDE'}
                    </button>
                  </div>

                  {selectedComp.staticProps.speedLimitVisible !== 'false' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[9px] text-slate-400 block font-mono">Value</label>
                        <input
                          type="text"
                          value={selectedComp.staticProps.speedLimitValue || '65'}
                          onChange={(e) => handleStaticPropChange('speedLimitValue', e.target.value)}
                          className="w-full bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 block font-mono">Position</label>
                        <select
                          value={
                            selectedComp.staticProps.speedLimitPosition === 'bottom-left'
                              ? 'bottom-left'
                              : 'bottom-right'
                          }
                          onChange={(e) => handleStaticPropChange('speedLimitPosition', e.target.value)}
                          className="w-full bg-slate-900 px-1.5 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* ADAS Spatial Warnings */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
                  <span className="text-[10px] text-sky-400 font-mono font-bold uppercase block">
                    ADAS Warnings
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-mono">Blind Spot Warning</span>
                    <select
                      value={selectedComp.staticProps.blindSpotWarning || 'auto'}
                      onChange={(e) => handleStaticPropChange('blindSpotWarning', e.target.value)}
                      className="bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                    >
                      <option value="auto">Auto (Proximity)</option>
                      <option value="true">Force ON</option>
                      <option value="false">Force OFF</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-mono">Blind Spot Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          selectedComp.staticProps.blindSpotColor?.startsWith('#')
                            ? selectedComp.staticProps.blindSpotColor
                            : '#ef4444'
                        }
                        onChange={(e) => handleStaticPropChange('blindSpotColor', e.target.value)}
                        className="w-6 h-6 rounded bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedComp.staticProps.blindSpotColor || '#ef4444'}
                        onChange={(e) => handleStaticPropChange('blindSpotColor', e.target.value)}
                        className="w-20 bg-slate-900 px-2 py-0.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
                    <span className="text-[11px] text-slate-300 font-mono">Proximity Sensor Arc</span>
                    <select
                      value={selectedComp.staticProps.sensorWarning || 'auto'}
                      onChange={(e) => handleStaticPropChange('sensorWarning', e.target.value)}
                      className="bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                    >
                      <option value="auto">Auto (Proximity)</option>
                      <option value="true">Force ON</option>
                      <option value="false">Force OFF</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-mono">Proximity Sensor Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          selectedComp.staticProps.sensorColor?.startsWith('#')
                            ? selectedComp.staticProps.sensorColor
                            : '#ef4444'
                        }
                        onChange={(e) => handleStaticPropChange('sensorColor', e.target.value)}
                        className="w-6 h-6 rounded bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedComp.staticProps.sensorColor || '#ef4444'}
                        onChange={(e) => handleStaticPropChange('sensorColor', e.target.value)}
                        className="w-20 bg-slate-900 px-2 py-0.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Exploded View Controls */}
            {selectedComp.type === 'vehicleExplodedView' && (() => {
              const removeBg = selectedComp.staticProps.removeBg !== 'false';
              const tolerance = parseInt(selectedComp.staticProps.bgTolerance || '25', 10);

              return (
                <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                      Exploded View Asset
                    </span>
                    {selectedComp.staticProps.imageUrl && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Custom Image
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 block font-bold">
                      Upload / Replace Image
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-mono font-bold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{selectedComp.staticProps.imageUrl ? 'Replace Image' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*,.svg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                if (result) {
                                  handleStaticPropChange('imageUrl', result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {selectedComp.staticProps.imageUrl && (
                        <button
                          type="button"
                          onClick={() => handleStaticPropChange('imageUrl', '')}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 text-xs font-mono flex items-center gap-1 transition-colors"
                          title="Reset to default blueprint vehicle SVG"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-slate-500">
                      Supports SVG, PNG, JPG, WebP. When replaced, all attached status callout connectors stay pinned to relative positions.
                    </p>
                  </div>

                  {/* Background Removal Section */}
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-slate-200 block">
                          Background Removal
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 block">
                          Auto-detects corner color &amp; keys to transparent
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStaticPropChange('removeBg', removeBg ? 'false' : 'true')}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          removeBg ? 'bg-sky-500' : 'bg-slate-700'
                        }`}
                        title={removeBg ? 'Disable Background Removal' : 'Enable Background Removal'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            removeBg ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Tolerance Slider (visible only when Background Removal is on) */}
                    {removeBg && (
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-800/60">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-300 font-bold">
                            Tolerance
                          </span>
                          <span className="text-[10px] font-mono text-sky-400 font-bold">
                            {tolerance}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={tolerance}
                          onChange={(e) => handleStaticPropChange('bgTolerance', e.target.value)}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-slate-500">
                          <span>0% (Exact)</span>
                          <span>25% (Default)</span>
                          <span>100% (Aggressive)</span>
                        </div>
                        <p className="text-[9px] font-mono text-slate-500">
                          Live adjustments key out background variations and subtle gradients.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Vehicle Status Callout Controls */}
            {selectedComp.type === 'vehicleStatusCallout' && (() => {
              const activeScreenComps = components;
              const explodedViews = activeScreenComps.filter((c) => c.type === 'vehicleExplodedView');
              const connector = selectedComp.connector;
              const healthType = selectedComp.staticProps.healthType || 'rgy';
              const healthValue = selectedComp.staticProps.healthValue || 'green';

              const anchors: Array<{ id: ConnectorAnchor; label: string }> = [
                { id: 'top-left', label: 'TL' },
                { id: 'top-center', label: 'TC' },
                { id: 'top-right', label: 'TR' },
                { id: 'left-center', label: 'LC' },
                { id: 'right-center', label: 'RC' },
                { id: 'bottom-left', label: 'BL' },
                { id: 'bottom-center', label: 'BC' },
                { id: 'bottom-right', label: 'BR' },
              ];

              return (
                <div className="space-y-3">
                  {/* Card Content Settings */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                      Callout Content
                    </span>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Title</label>
                      <input
                        type="text"
                        value={selectedComp.staticProps.title || ''}
                        onChange={(e) => handleStaticPropChange('title', e.target.value)}
                        placeholder="e.g. Front Powertrain"
                        className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Description</label>
                      <input
                        type="text"
                        value={selectedComp.staticProps.description || ''}
                        onChange={(e) => handleStaticPropChange('description', e.target.value)}
                        placeholder="e.g. Primary electric drive unit"
                        className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Status Code</label>
                        <input
                          type="text"
                          value={selectedComp.staticProps.statusCode || ''}
                          onChange={(e) => handleStaticPropChange('statusCode', e.target.value)}
                          placeholder="e.g. 4101"
                          className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Status Message</label>
                        <input
                          type="text"
                          value={selectedComp.staticProps.statusMessage || ''}
                          onChange={(e) => handleStaticPropChange('statusMessage', e.target.value)}
                          placeholder="e.g. Normal thermal parameters"
                          className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* Health Indicator Mode */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <label className="text-[10px] font-mono text-slate-400 block mb-1.5 font-bold">
                        Health Indicator
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 mb-2">
                        {(['none', 'percent', 'rgy'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              handleStaticPropChange('healthType', mode);
                              if (mode === 'percent' && !selectedComp.staticProps.healthValue) {
                                handleStaticPropChange('healthValue', '98');
                              } else if (mode === 'rgy' && !['green', 'yellow', 'red'].includes(selectedComp.staticProps.healthValue)) {
                                handleStaticPropChange('healthValue', 'green');
                              }
                            }}
                            className={`py-1 text-[10px] font-mono font-bold rounded capitalize transition-colors ${
                              healthType === mode
                                ? 'bg-sky-500 text-slate-950 shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {mode === 'rgy' ? 'R/Y/G' : mode}
                          </button>
                        ))}
                      </div>

                      {healthType === 'percent' && (
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <span className="text-[11px] font-mono text-slate-300">Health %</span>
                          <NumericStepper
                            value={parseInt(healthValue, 10) || 100}
                            min={0}
                            max={100}
                            step={1}
                            unit="%"
                            onChange={(val) => handleStaticPropChange('healthValue', String(val))}
                          />
                        </div>
                      )}

                      {healthType === 'rgy' && (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { val: 'green', label: 'Green', color: 'bg-emerald-500', text: 'text-emerald-300', border: 'border-emerald-500/40' },
                              { val: 'yellow', label: 'Yellow', color: 'bg-amber-500', text: 'text-amber-300', border: 'border-amber-500/40' },
                              { val: 'red', label: 'Red', color: 'bg-rose-500', text: 'text-rose-300', border: 'border-rose-500/40' },
                            ].map((item) => {
                              const isSelected = healthValue === item.val;
                              return (
                                <button
                                  key={item.val}
                                  type="button"
                                  onClick={() => handleStaticPropChange('healthValue', item.val)}
                                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                                    isSelected
                                      ? `${item.border} bg-slate-800 ${item.text} ring-1 ring-offset-1 ring-offset-slate-950 ring-sky-400`
                                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                                  <span>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[9px] font-mono text-slate-500">
                            Automotive rule: Static indicator with no blinking/pulsing animation.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Exploded View Connector Settings */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5" />
                        Exploded View Connector
                      </span>
                      {connector && (
                        <button
                          type="button"
                          onClick={() => updateComponentConnector(selectedComp.id, null)}
                          className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded border border-rose-500/30 transition-colors"
                          title="Unlink Connector"
                        >
                          <Unlink className="w-2.5 h-2.5" />
                          <span>Unlink</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">
                        Target Exploded View
                      </label>
                      <select
                        value={connector?.targetComponentId || ''}
                        onChange={(e) => {
                          const targetId = e.target.value;
                          if (!targetId) {
                            updateComponentConnector(selectedComp.id, null);
                          } else {
                            updateComponentConnector(selectedComp.id, {
                              sourceAnchor: connector?.sourceAnchor || 'left-center',
                              targetComponentId: targetId,
                              targetX: connector?.targetX ?? 0.5,
                              targetY: connector?.targetY ?? 0.5,
                            });
                          }
                        }}
                        className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 font-bold cursor-pointer"
                      >
                        <option value="">-- None (Unlinked) --</option>
                        {explodedViews.map((ev, idx) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.staticProps.label || `Exploded View #${idx + 1}`} ({ev.id.slice(0, 10)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {connector && (
                      <>
                        {/* 8-Anchor Source Selector */}
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-1.5 font-bold">
                            Source Anchor (Callout Edge)
                          </label>
                          <div className="grid grid-cols-4 gap-1">
                            {anchors.map((anc) => {
                              const isSelected = connector.sourceAnchor === anc.id;
                              return (
                                <button
                                  key={anc.id}
                                  type="button"
                                  onClick={() =>
                                    updateComponentConnector(selectedComp.id, {
                                      ...connector,
                                      sourceAnchor: anc.id,
                                    })
                                  }
                                  className={`py-1 text-[9px] font-mono font-bold rounded border transition-colors ${
                                    isSelected
                                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold shadow'
                                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                  }`}
                                  title={`Anchor: ${anc.id}`}
                                >
                                  {anc.id.replace('-', ' ').toUpperCase()}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Relative Target Coords */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-slate-400 block font-bold">
                            Target Endpoint On Diagram (0% - 100%)
                          </label>
                          <div className="flex flex-col gap-2">
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                              <span className="text-[11px] font-mono text-slate-300">Target X</span>
                              <NumericStepper
                                value={Math.round(connector.targetX * 100)}
                                min={0}
                                max={100}
                                step={1}
                                unit="%"
                                onChange={(val) =>
                                  updateComponentConnector(selectedComp.id, {
                                    ...connector,
                                    targetX: Math.max(0, Math.min(1, val / 100)),
                                  })
                                }
                              />
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                              <span className="text-[11px] font-mono text-slate-300">Target Y</span>
                              <NumericStepper
                                value={Math.round(connector.targetY * 100)}
                                min={0}
                                max={100}
                                step={1}
                                unit="%"
                                onChange={(val) =>
                                  updateComponentConnector(selectedComp.id, {
                                    ...connector,
                                    targetY: Math.max(0, Math.min(1, val / 100)),
                                  })
                                }
                              />
                            </div>
                          </div>
                          <p className="text-[9px] font-mono text-slate-500">
                            Tip: You can also drag the glowing blue target dot directly on the canvas!
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Mini Nav Controls */}
            {selectedComp.type === 'miniNav' && (() => {
              const currentManeuverType = selectedComp.staticProps.maneuverType || 'straight';
              const numLanes = parseInt(selectedComp.staticProps.laneCount || '3', 10);

              const maneuverOptions: Array<{ id: ManeuverType; label: string }> = [
                { id: 'straight', label: 'Straight' },
                { id: 'slight-left', label: 'Slight Left' },
                { id: 'slight-right', label: 'Slight Right' },
                { id: 'left', label: 'Left Turn' },
                { id: 'right', label: 'Right Turn' },
              ];

              return (
                <div className="space-y-3">
                  {/* Maneuver & Route Settings */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                      Maneuver Direction
                    </span>

                    {/* Maneuver Type Selector */}
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      {maneuverOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            handleStaticPropChange('maneuverType', opt.id);
                            // Also synchronize with the active journey store slice
                            useMockpitStore.getState().setManeuverType(opt.id);
                          }}
                          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2 text-[10px] font-mono font-bold rounded capitalize transition-colors ${
                            currentManeuverType === opt.id
                              ? 'bg-sky-500 text-slate-950 shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <svg
                            width="16"
                            height="19"
                            viewBox="80 120 160 190"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <ManeuverGlyph type={opt.id} />
                          </svg>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Highway Name / Route</label>
                      <input
                        type="text"
                        value={selectedComp.staticProps.highwayName || ''}
                        onChange={(e) => {
                          handleStaticPropChange('highwayName', e.target.value);
                          useMockpitStore.getState().setJourneyState({ currentHighwayName: e.target.value });
                        }}
                        placeholder="e.g. I-280 N"
                        className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Upcoming Exit / Turn</label>
                        <input
                          type="text"
                          value={selectedComp.staticProps.nextExit || ''}
                          onChange={(e) => handleStaticPropChange('nextExit', e.target.value)}
                          placeholder="e.g. Exit 12: Foothill Expwy"
                          className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Distance to Maneuver</label>
                        <input
                          type="text"
                          value={selectedComp.staticProps.distanceToManeuver || ''}
                          onChange={(e) => handleStaticPropChange('distanceToManeuver', e.target.value)}
                          placeholder="e.g. 0.8 mi"
                          className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lane Guidance Configuration */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                      Lane Guidance
                    </span>

                    <div className="flex flex-col gap-2">
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-300 font-medium">Total Lanes</span>
                        <NumericStepper
                          value={numLanes}
                          min={1}
                          max={6}
                          step={1}
                          onChange={(val) => {
                            handleStaticPropChange('laneCount', String(val));
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Appearance Configuration (Arrow, Horizon & Guide Lane Colors) */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                      Appearance
                    </span>

                    <div className="flex flex-col gap-2">
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-300 font-medium">Arrow Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedComp.staticProps.arrowColor || '#f59e0b'}
                            onChange={(e) => handleStaticPropChange('arrowColor', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                          />
                          <span className="text-[10px] font-mono text-slate-400">
                            {selectedComp.staticProps.arrowColor || '#f59e0b'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-300 font-medium">Horizon Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedComp.staticProps.horizonColor || '#f59e0b'}
                            onChange={(e) => handleStaticPropChange('horizonColor', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                          />
                          <span className="text-[10px] font-mono text-slate-400">
                            {selectedComp.staticProps.horizonColor || '#f59e0b'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-300 font-medium">Guide Lane Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedComp.staticProps.guideLaneColor || selectedComp.staticProps.arrowColor || '#f59e0b'}
                            onChange={(e) => handleStaticPropChange('guideLaneColor', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                          />
                          <span className="text-[10px] font-mono text-slate-400">
                            {selectedComp.staticProps.guideLaneColor || selectedComp.staticProps.arrowColor || '#f59e0b'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-300 font-medium">Highway Badge Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedComp.staticProps.highwayBadgeColor || activePalette?.primary || '#38bdf8'}
                            onChange={(e) => handleStaticPropChange('highwayBadgeColor', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                          />
                          <span className="text-[10px] font-mono text-slate-400">
                            {selectedComp.staticProps.highwayBadgeColor || activePalette?.primary || '#38bdf8'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Send Vehicle Diagnostics Content Controls */}
            {selectedComp.type === 'sendToServiceCenter' && (
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                  Send Vehicle Diagnostics Content
                </span>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Button Label</label>
                  <input
                    type="text"
                    value={selectedComp.staticProps.buttonLabel ?? ''}
                    onChange={(e) => handleStaticPropChange('buttonLabel', e.target.value)}
                    placeholder="e.g. Send Vehicle Diagnostics"
                    className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    Report Title <span className="text-slate-500 font-normal">(Leave blank for none)</span>
                  </label>
                  <input
                    type="text"
                    value={selectedComp.staticProps.reportTitle ?? ''}
                    onChange={(e) => handleStaticPropChange('reportTitle', e.target.value)}
                    placeholder="e.g. Vehicle Diagnostic Report"
                    className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Confirm Button</label>
                    <input
                      type="text"
                      value={selectedComp.staticProps.confirmLabel ?? ''}
                      onChange={(e) => handleStaticPropChange('confirmLabel', e.target.value)}
                      placeholder="e.g. Confirm Send"
                      className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Cancel Button</label>
                    <input
                      type="text"
                      value={selectedComp.staticProps.cancelLabel ?? ''}
                      onChange={(e) => handleStaticPropChange('cancelLabel', e.target.value)}
                      placeholder="e.g. Cancel"
                      className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Sending Status Message</label>
                  <input
                    type="text"
                    value={selectedComp.staticProps.sendingLabel ?? ''}
                    onChange={(e) => handleStaticPropChange('sendingLabel', e.target.value)}
                    placeholder="e.g. Generating & Sending Report..."
                    className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Success Status Message</label>
                  <input
                    type="text"
                    value={selectedComp.staticProps.successLabel ?? ''}
                    onChange={(e) => handleStaticPropChange('successLabel', e.target.value)}
                    placeholder="e.g. Report Dispatched & Downloaded"
                    className="w-full bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Drive Mode Selector Configuration */}
            {selectedComp.type === 'driveMode' && (() => {
              const modesProp = selectedComp.staticProps.modes;
              let modes: string[] = ['ECO', 'NORMAL', 'SPORT'];
              if (Array.isArray(modesProp) && modesProp.length > 0) {
                modes = modesProp;
              } else if (typeof modesProp === 'string' && modesProp.trim()) {
                try {
                  const parsed = JSON.parse(modesProp);
                  if (Array.isArray(parsed) && parsed.length > 0) modes = parsed;
                } catch {
                  const split = modesProp.split(',').map((s) => s.trim()).filter(Boolean);
                  if (split.length > 0) modes = split;
                }
              }

              const updateModes = (newModes: string[]) => {
                handleStaticPropChange('modes', JSON.stringify(newModes));
              };

              const moveMode = (index: number, direction: 'up' | 'down') => {
                const targetIdx = direction === 'up' ? index - 1 : index + 1;
                if (targetIdx < 0 || targetIdx >= modes.length) return;
                const next = [...modes];
                const temp = next[index];
                next[index] = next[targetIdx];
                next[targetIdx] = temp;
                updateModes(next);
              };

              return (
                <div className="space-y-2.5 bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase">
                      Drive Modes
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {modes.length} {modes.length === 1 ? 'mode' : 'modes'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {modes.map((mode, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={mode}
                          onChange={(e) => {
                            const next = [...modes];
                            next[idx] = e.target.value;
                            updateModes(next);
                          }}
                          placeholder={`Mode ${idx + 1}`}
                          className="flex-1 bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 focus:border-sky-500 uppercase"
                        />

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveMode(idx, 'up')}
                            className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === modes.length - 1}
                            onClick={() => moveMode(idx, 'down')}
                            className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Delete Button */}
                        {modes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = modes.filter((_, i) => i !== idx);
                              updateModes(next);
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 transition-colors cursor-pointer shrink-0"
                            title="Remove mode"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      updateModes([...modes, `CUSTOM ${modes.length + 1}`]);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-600 hover:border-sky-500/80 text-sky-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Mode</span>
                  </button>
                </div>
              );
            })()}

            {/* Climate Controls */}
            {selectedComp.type === 'climate' && (
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">
                  OVERLAY ORIENTATION
                </span>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-300">SEAT TEMP</span>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleStaticPropChange('seatOrientation', 'vertical')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                          (selectedComp.staticProps.seatOrientation || 'vertical') === 'vertical'
                            ? 'bg-sky-500 text-slate-950 font-extrabold shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Vertical
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStaticPropChange('seatOrientation', 'horizontal')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                          selectedComp.staticProps.seatOrientation === 'horizontal'
                            ? 'bg-sky-500 text-slate-950 font-extrabold shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Horizontal
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-300">FAN SPEED</span>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleStaticPropChange('fanOrientation', 'vertical')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                          selectedComp.staticProps.fanOrientation === 'vertical'
                            ? 'bg-sky-500 text-slate-950 font-extrabold shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Vertical
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStaticPropChange('fanOrientation', 'horizontal')}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                          (selectedComp.staticProps.fanOrientation || 'horizontal') === 'horizontal'
                            ? 'bg-sky-500 text-slate-950 font-extrabold shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Horizontal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {Object.entries(selectedComp.staticProps)
              .filter(
                ([key]) =>
                  key !== 'displayStyle' &&
                  key !== 'maxSpeed' &&
                  key !== 'label' &&
                  key !== 'modes' &&
                  key !== 'service' &&
                  key !== 'seatOrientation' &&
                  key !== 'fanOrientation' &&
                  key !== 'keyboardSlideDirection' &&
                  key !== 'drainPercentPerInterval' &&
                  key !== 'drainIntervalSeconds' &&
                  key !== 'chargePercentPerInterval' &&
                  key !== 'chargeIntervalSeconds' &&
                  key !== 'lanesCount' &&
                  key !== 'opposingLanesCount' &&
                  key !== 'sameDirCount' &&
                  key !== 'opposingDirCount' &&
                  key !== 'intersectionEnabled' &&
                  key !== 'crossTrafficCount' &&
                  key !== 'trafficLightState' &&
                  key !== 'crosswalkEnabled' &&
                  key !== 'stopLineEnabled' &&
                  key !== 'speedLimitValue' &&
                  key !== 'speedLimitUnits' &&
                  key !== 'speedLimitVisible' &&
                  key !== 'speedLimitPosition' &&
                  key !== 'speedLimitStyle' &&
                  key !== 'blindSpotWarning' &&
                  key !== 'leftBlindSpot' &&
                  key !== 'rightBlindSpot' &&
                  key !== 'blindSpotColor' &&
                  key !== 'blindSpotOpacity' &&
                  key !== 'sensorWarning' &&
                  key !== 'sensorColor' &&
                  key !== 'sensorOpacity' &&
                  key !== 'showPedestrians' &&
                  key !== 'showCones' &&
                  key !== 'showConstruction' &&
                  key !== 'trafficData' &&
                  key !== 'sceneObjectsData' &&
                  key !== 'tripStops' &&
                  key !== 'destination' &&
                  key !== 'destLat' &&
                  key !== 'destLng' &&
                  key !== 'waypoints' &&
                  key !== 'startLat' &&
                  key !== 'startLng' &&
                  key !== 'consumptionRate' &&
                  key !== 'distanceLabel' &&
                  key !== 'estimatedTimeLabel' &&
                  key !== 'energyRequiredLabel' &&
                  key !== 'arrivalChargeLabel' &&
                  key !== 'imageUrl' &&
                  key !== 'title' &&
                  key !== 'description' &&
                  key !== 'statusCode' &&
                  key !== 'statusMessage' &&
                  key !== 'healthType' &&
                  key !== 'healthValue' &&
                  key !== 'removeBg' &&
                  key !== 'bgTolerance' &&
                  key !== 'highwayName' &&
                  key !== 'nextExit' &&
                  key !== 'distanceToManeuver' &&
                  key !== 'maneuverType' &&
                  key !== 'laneCount' &&
                  key !== 'activeLaneIndex' &&
                  key !== 'arrowColor' &&
                  key !== 'horizonColor' &&
                  key !== 'guideLaneColor' &&
                  key !== 'highwayBadgeColor' &&
                  key !== 'trafficDensity' &&
                  key !== 'grayscaleTraffic' &&
                  key !== 'buttonLabel' &&
                  key !== 'reportTitle' &&
                  key !== 'confirmLabel' &&
                  key !== 'cancelLabel' &&
                  key !== 'sendingLabel' &&
                  key !== 'successLabel' &&
                  !(selectedComp.type === 'nowPlaying' && (key === 'orientation' || key === 'autoDismissEnabled' || key === 'autoDismissSeconds' || key === 'dismissDirection' || key === 'slideDurationMs' || key === 'trackId' || key === 'songTransition' || key === 'songInfoDisplayDuration' || key === 'titleFontSize' || key === 'artistFontSize' || key === 'titleColor' || key === 'artistColor')) &&
                  !(selectedComp.type === 'mediaDiscovery' && (key === 'mode' || key === 'layout')) &&
                  !(selectedComp.type === 'mediaPlaylists' && key === 'cardLayoutMode') &&
                  !(selectedComp.type === 'overheadVisualization' && key === 'color')
              )
              .map(([key, val]) => {
                const getFieldLabel = (propKey: string) => {
                  if (propKey === 'frontLeft') return 'Front Left';
                  if (propKey === 'frontRight') return 'Front Right';
                  if (propKey === 'rearLeft') return 'Rear Left';
                  if (propKey === 'rearRight') return 'Rear Right';
                  if (propKey === 'buttonLabel') return 'Button Label';
                  if (propKey === 'reportTitle') return 'Report Title';
                  if (propKey === 'details') return 'Resolution Details';
                  return propKey;
                };

                const isCustomLabel = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight', 'buttonLabel', 'reportTitle', 'details'].includes(key);

                return (
                <div key={key} className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-mono text-slate-400 ${isCustomLabel ? '' : 'capitalize'}`}>{getFieldLabel(key)}</span>
                  {key === 'color' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={val.startsWith('#') ? val : '#38bdf8'}
                        onChange={(e) => handleStaticPropChange(key, e.target.value)}
                        className="w-6 h-6 rounded bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleStaticPropChange(key, e.target.value)}
                        className="w-20 bg-slate-900 px-2 py-0.5 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700"
                      />
                    </div>
                  ) : key === 'details' ? (
                    <textarea
                      value={val}
                      onChange={(e) => handleStaticPropChange(key, e.target.value)}
                      placeholder="Optional resolution instructions"
                      rows={2}
                      className="w-44 bg-slate-900 px-2 py-1 rounded text-slate-200 font-sans text-xs focus:outline-none border border-slate-700 resize-none"
                    />
                  ) : key === 'severity' ? (
                    <select
                      value={val}
                      onChange={(e) => handleStaticPropChange(key, e.target.value)}
                      className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                    >
                      <option value="critical">Critical (Red)</option>
                      <option value="warning">Warning (Amber)</option>
                      <option value="info">Info (Blue)</option>
                    </select>
                  ) : key === 'triggerMode' ? (
                    <select
                      value={val}
                      onChange={(e) => handleStaticPropChange(key, e.target.value)}
                      className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                    >
                      <option value="condition">Condition-Bound</option>
                      <option value="event">Event-Triggered</option>
                    </select>
                  ) : key === 'triggerEvent' ? (
                    <select
                      value={val}
                      onChange={(e) => handleStaticPropChange(key, e.target.value)}
                      className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                    >
                      <option value="cruise_on">Cruise Engaged (cruise_on)</option>
                      <option value="cruise_off">Cruise Disengaged (cruise_off)</option>
                      <option value="manual">Manual Trigger</option>
                    </select>
                  ) : key === 'icon' ? (
                    <select
                      value={val}
                      onChange={(e) => handleStaticPropChange(key, e.target.value)}
                      className="w-36 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 cursor-pointer font-bold"
                    >
                      <option value="alert-triangle">Alert Triangle</option>
                      <option value="door-open">Door Open</option>
                      <option value="battery-warning">Battery Warning</option>
                      <option value="thermometer">Thermometer</option>
                      <option value="tire">Tire (TPMS)</option>
                      <option value="zap">Zap / Charging</option>
                      <option value="gauge">Gauge / Speed</option>
                      <option value="bell">Bell</option>
                      <option value="shield-alert">Shield Alert</option>
                      <option value="wrench">Wrench / Service</option>
                      <option value="lock">Lock</option>
                      <option value="key">Key Fob</option>
                      <option value="info">Info</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleStaticPropChange(key, e.target.value)}
                      className="w-32 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right"
                    />
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Behavior Bindings */}
        <div className="border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between min-h-[44px]">
            <button
              type="button"
              onClick={() => toggleSection('bindings')}
              className="flex-1 flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer text-left select-none group min-h-[44px]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  State Bindings ({selectedComp.bindings?.length || 0})
                </span>
              </div>
              <div className="p-1 text-slate-400 group-hover:text-slate-200 transition-transform">
                {collapsedSections.bindings ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>
            <button
              onClick={() => {
                if (collapsedSections.bindings) {
                  setCollapsedSections((prev) => ({ ...prev, bindings: false }));
                }
                setIsAddingBinding(!isAddingBinding);
              }}
              className="p-1.5 ml-2 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-slate-950 transition-colors text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Rule
            </button>
          </div>

          {!collapsedSections.bindings && (
            <div className="mt-2 space-y-3">
              <p className="text-[10px] text-slate-400">
                Dynamic HMI logic rules that update styling when state changes.
              </p>

              {/* List existing bindings */}
              <div className="space-y-2.5">
                {selectedComp.bindings?.length === 0 ? (
                  <div className="p-3 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs font-mono">
                    No bindings configured yet. Click "+ Rule" to add one.
                  </div>
                ) : (
                  selectedComp.bindings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2 relative group hover:border-slate-700 transition-colors"
                    >
                      <button
                        onClick={() => removeBinding(selectedComp.id, b.id)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                        title="Delete Binding Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="text-[11px] text-slate-300 font-semibold pr-6 flex items-center gap-1">
                        <span className="text-sky-400">IF</span>
                        <span className="text-emerald-400">{b.stateField}</span>
                        <span className="text-amber-400">{b.condition}</span>
                        <span className="text-slate-100">{String(b.value)}</span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-900">
                        <span className="text-purple-400">THEN</span>
                        <span className="text-slate-300">{b.targetProp}</span>
                        <span>=</span>
                        <span
                          className="font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-100 border border-slate-800 truncate"
                          style={b.targetProp === 'color' ? { color: b.targetValue } : undefined}
                        >
                          {b.targetValue}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Binding Form Drawer (v0.6.7 scroll bug fix) */}
              {isAddingBinding && (
                <form
                  onSubmit={handleAddBindingSubmit}
                  className="mt-4 rounded-xl bg-slate-800/95 border border-sky-500/40 text-xs shadow-2xl flex flex-col max-h-[70vh] overflow-hidden"
                >
                  <div className="p-3 border-b border-slate-700/80 bg-slate-800 sticky top-0 z-10 flex items-center justify-between shrink-0">
                    <h4 className="font-bold text-sky-400 text-xs">New Binding Rule</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Dynamic Rule Editor</span>
                  </div>

                  <div className="p-3 space-y-3 overflow-y-auto max-h-[70vh] flex-1">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">State Field</label>
                      <select
                        value={newBinding.stateField}
                        onChange={(e) => setNewBinding({ ...newBinding, stateField: e.target.value as keyof VehicleState })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-1.5 rounded focus:outline-none"
                      >
                        {VEHICLE_STATE_FIELDS.map((f) => (
                          <option key={f.field} value={f.field}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Condition</label>
                        <select
                          value={newBinding.condition}
                          onChange={(e) => setNewBinding({ ...newBinding, condition: e.target.value as BindingCondition })}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-1.5 rounded focus:outline-none"
                        >
                          {CONDITIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Value</label>
                        {newBinding.stateField === 'isCharging' ||
                        newBinding.stateField === 'doorOpen' ||
                        newBinding.stateField === 'cruiseControlActive' ||
                        newBinding.stateField === 'tirePressureWarning' ? (
                          <select
                            value={newBinding.value}
                            onChange={(e) => setNewBinding({ ...newBinding, value: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-1.5 rounded focus:outline-none"
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : newBinding.stateField === 'gear' ? (
                          <select
                            value={newBinding.value}
                            onChange={(e) => setNewBinding({ ...newBinding, value: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-1.5 rounded focus:outline-none"
                          >
                            <option value="P">P</option>
                            <option value="R">R</option>
                            <option value="N">N</option>
                            <option value="D">D</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={newBinding.value}
                            onChange={(e) => setNewBinding({ ...newBinding, value: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-1.5 rounded focus:outline-none"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Target Property</label>
                        <select
                          value={newBinding.targetProp}
                          onChange={(e) => setNewBinding({ ...newBinding, targetProp: e.target.value as TargetProp })}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-1.5 rounded focus:outline-none"
                        >
                          {TARGET_PROPS.map((tp) => (
                            <option key={tp} value={tp}>{tp}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">New Value</label>
                        {newBinding.targetProp === 'severity' ? (
                          <select
                            value={newBinding.targetValue}
                            onChange={(e) => setNewBinding({ ...newBinding, targetValue: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-1.5 rounded focus:outline-none font-mono text-[11px]"
                          >
                            <option value="critical">critical</option>
                            <option value="warning">warning</option>
                            <option value="info">info</option>
                          </select>
                        ) : newBinding.targetProp === 'icon' ? (
                          <select
                            value={newBinding.targetValue}
                            onChange={(e) => setNewBinding({ ...newBinding, targetValue: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-1.5 rounded focus:outline-none font-mono text-[11px]"
                          >
                            <option value="alert-triangle">alert-triangle</option>
                            <option value="door-open">door-open</option>
                            <option value="battery-warning">battery-warning</option>
                            <option value="thermometer">thermometer</option>
                            <option value="tire">tire</option>
                            <option value="zap">zap</option>
                            <option value="gauge">gauge</option>
                            <option value="bell">bell</option>
                            <option value="shield-alert">shield-alert</option>
                            <option value="wrench">wrench</option>
                            <option value="lock">lock</option>
                            <option value="key">key</option>
                            <option value="info">info</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={newBinding.targetValue}
                            onChange={(e) => setNewBinding({ ...newBinding, targetValue: e.target.value })}
                            placeholder="e.g. #ef4444, true, {speed}"
                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-1.5 rounded focus:outline-none font-mono text-[11px]"
                          />
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 italic">
                      Tip: Use <span className="text-sky-300">{'{speed}'}</span> or <span className="text-sky-300">{'{batteryPercent}'}</span> in new value for dynamic state text.
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800 sticky bottom-0 z-10 border-t border-slate-700/80 flex gap-2 shrink-0">
                    <button
                      type="submit"
                      className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold p-1.5 rounded transition-colors cursor-pointer"
                    >
                      Save Rule
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingBinding(false)}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-200 p-1.5 rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Delete Component Button */}
        <div className="border-t border-slate-800 pt-4">
          <button
            onClick={() => deleteComponent(selectedComp.id)}
            className="w-full p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Component
          </button>
        </div>
      </div>
      </div>
      )}
    </div>
  );
};
