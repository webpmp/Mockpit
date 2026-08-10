import React, { useState, useEffect } from 'react';
import { useMockpitStore, DEFAULT_COMPONENT_DIMENSIONS } from '../store/useMockpitStore';
import { BindingCondition, NotificationStackPosition, TargetProp, TransitionStyle, VehicleState } from '../types';
import { Plus, Trash2, Sliders, Layers, Sparkles, X, Copy, Clipboard, ArrowUp, ArrowDown, Layout, Settings } from 'lucide-react';
import { DEFAULT_COMPONENT_LABELS } from './ComponentRenderer';
import { LayersPanel } from './LayersPanel';

const ScreenPropertiesPanel: React.FC = () => {
  const activeView = useMockpitStore((s) => s.activeView);
  const screens = useMockpitStore((s) => s.screens);
  const updateScreen = useMockpitStore((s) => s.updateScreen);
  const deleteScreen = useMockpitStore((s) => s.deleteScreen);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);

  const activeScreen = screens.find((s) => s.id === activeView) || screens[0];
  const isHome = activeScreen?.id === 'home';
  const compCount = (componentsByScreen[activeScreen?.id] || []).length;

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
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete screen "${activeScreen.name}" and all its components?`)) {
                deleteScreen(activeScreen.id);
              }
            }}
            className="w-full p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Screen
          </button>
        </div>
      )}
    </div>
  );
};

const VEHICLE_STATE_FIELDS: Array<{ field: keyof VehicleState; label: string; type: 'number' | 'boolean' | 'select' }> = [
  { field: 'gear', label: 'Gear (P/R/N/D)', type: 'select' },
  { field: 'driveMode', label: 'Drive Mode (Eco/Normal/Sport)', type: 'select' },
  { field: 'speed', label: 'Speed (0-120)', type: 'number' },
  { field: 'batteryPercent', label: 'Battery % (0-100)', type: 'number' },
  { field: 'isCharging', label: 'Is Charging', type: 'boolean' },
  { field: 'doorOpen', label: 'Door Open', type: 'boolean' },
  { field: 'cruiseControlActive', label: 'Cruise Control Active', type: 'boolean' },
];

const CONDITIONS: BindingCondition[] = ['<', '>', '=', '!=', '>='];
const TARGET_PROPS: TargetProp[] = ['color', 'visible', 'text', 'icon', 'severity'];

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
  const setNotificationStackPosition = useMockpitStore((s) => s.setNotificationStackPosition);
  const selectComponent = useMockpitStore((s) => s.selectComponent);
  const updateComponentStaticProps = useMockpitStore((s) => s.updateComponentStaticProps);
  const updateComponentPosition = useMockpitStore((s) => s.updateComponentPosition);
  const updateComponentSize = useMockpitStore((s) => s.updateComponentSize);
  const updateComponentZIndex = useMockpitStore((s) => s.updateComponentZIndex);
  const bringToFront = useMockpitStore((s) => s.bringToFront);
  const sendToBack = useMockpitStore((s) => s.sendToBack);
  const addBinding = useMockpitStore((s) => s.addBinding);
  const updateBinding = useMockpitStore((s) => s.updateBinding);
  const removeBinding = useMockpitStore((s) => s.removeBinding);
  const deleteComponent = useMockpitStore((s) => s.deleteComponent);
  const copiedComponent = useMockpitStore((s) => s.copiedComponent);
  const copyComponent = useMockpitStore((s) => s.copyComponent);
  const pasteComponent = useMockpitStore((s) => s.pasteComponent);

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
  const [justCopied, setJustCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'component' | 'screen' | 'layers'>('screen');

  useEffect(() => {
    if (selectedComponentId) {
      setActiveTab('component');
    }
  }, [selectedComponentId]);

  const handleCopy = () => {
    copyComponent();
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1200);
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
      newBinding.stateField === 'cruiseControlActive'
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
        <div className="flex-1 flex flex-col p-4">
          <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/60 mb-4">
            <button
              onClick={() => pasteComponent()}
              disabled={!copiedComponent}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border ${
                copiedComponent
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 border-sky-400 cursor-pointer shadow-md'
                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title={copiedComponent ? `Paste copied component (${copiedComponent.component.type})` : 'Nothing copied'}
            >
              <Clipboard className="w-4 h-4" />
              {copiedComponent ? `Paste Copied ${copiedComponent.component.type}` : 'Paste Component'}
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Sliders className="w-10 h-10 mb-3 text-slate-700" />
            <div className="text-xs font-bold text-slate-400 mb-1">No Component Selected</div>
            <p className="text-[11px] font-mono">
              Click any element on canvas to inspect properties and rules, or switch to the Screen tab.
            </p>
          </div>
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
          <h2 className="text-sm font-bold text-slate-100 capitalize">
            {selectedComp.type} Component
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

      {/* Clipboard Actions Bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/60 flex flex-col gap-2">
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={handleCopy}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
              justCopied
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80 shadow-sm'
            }`}
            title="Copy selected component (Ctrl/Cmd+C)"
          >
            <Copy className="w-3.5 h-3.5 text-sky-400" />
            {justCopied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={() => pasteComponent()}
            disabled={!copiedComponent}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border ${
              copiedComponent
                ? 'bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 border-sky-500/40 cursor-pointer shadow-sm'
                : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title={
              copiedComponent
                ? `Paste copied ${copiedComponent.component.type} component (Ctrl/Cmd+V)`
                : 'Nothing in clipboard to paste'
            }
          >
            <Clipboard className="w-3.5 h-3.5" />
            Paste
          </button>
        </div>

        {copiedComponent && (
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-0.5">
            <span>In Clipboard:</span>
            <span className="text-sky-300 font-bold capitalize">{copiedComponent.component.type}</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Layout Geometry */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            Geometry {isNotifComp ? '(Width & Height)' : '(X, Y, W, H)'}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
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
              max={DEFAULT_COMPONENT_DIMENSIONS[selectedComp.type]?.maxHeight || 950}
              onChange={(val) => updateComponentSize(selectedComp.id, selectedComp.width, val)}
            />
          </div>

          {/* Stacking / Layering Section */}
          {!isNotifComp && (
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase font-mono">Stacking Layer</span>
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

          {isNotifComp && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/50 text-[11px] text-sky-300 flex flex-col gap-1.5">
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
        </div>

        {/* Static Appearance Properties */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Static Appearance
          </h3>
          <div className="space-y-2 text-xs">
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
                    <input
                      type="number"
                      value={selectedComp.staticProps.maxSpeed || '120'}
                      onChange={(e) => handleStaticPropChange('maxSpeed', e.target.value)}
                      className="w-24 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right"
                      placeholder="120"
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
                  <input
                    type="number"
                    min={0.1}
                    step={0.5}
                    value={selectedComp.staticProps.drainPercentPerInterval ?? '1'}
                    onChange={(e) => handleStaticPropChange('drainPercentPerInterval', e.target.value)}
                    className="w-24 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right font-bold"
                    placeholder="1"
                  />
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">Drain Interval (sec)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={selectedComp.staticProps.drainIntervalSeconds ?? '60'}
                    onChange={(e) => handleStaticPropChange('drainIntervalSeconds', e.target.value)}
                    className="w-24 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right font-bold"
                    placeholder="60"
                  />
                </div>
              </>
            )}

            {selectedComp.type === 'charging' && (
              <>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">Charge % / Interval</span>
                  <input
                    type="number"
                    min={0.1}
                    step={0.5}
                    value={selectedComp.staticProps.chargePercentPerInterval ?? '5'}
                    onChange={(e) => handleStaticPropChange('chargePercentPerInterval', e.target.value)}
                    className="w-24 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right font-bold"
                    placeholder="5"
                  />
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">Charge Interval (sec)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={selectedComp.staticProps.chargeIntervalSeconds ?? '60'}
                    onChange={(e) => handleStaticPropChange('chargeIntervalSeconds', e.target.value)}
                    className="w-24 bg-slate-900 px-2 py-1 rounded text-slate-200 font-mono text-xs focus:outline-none border border-slate-700 text-right font-bold"
                    placeholder="60"
                  />
                </div>
              </>
            )}

            {Object.entries(selectedComp.staticProps)
              .filter(
                ([key]) =>
                  key !== 'displayStyle' &&
                  key !== 'maxSpeed' &&
                  key !== 'label' &&
                  key !== 'drainPercentPerInterval' &&
                  key !== 'drainIntervalSeconds' &&
                  key !== 'chargePercentPerInterval' &&
                  key !== 'chargeIntervalSeconds'
              )
              .map(([key, val]) => (
                <div key={key} className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 capitalize">{key}</span>
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
              ))}
          </div>
        </div>

        {/* Behavior Bindings */}
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                State Bindings ({selectedComp.bindings?.length || 0})
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Dynamic HMI logic rules that update styling when state changes.
              </p>
            </div>
            <button
              onClick={() => setIsAddingBinding(!isAddingBinding)}
              className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-slate-950 transition-colors text-xs font-bold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Rule
            </button>
          </div>

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
                    className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
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
                    newBinding.stateField === 'cruiseControlActive' ? (
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
