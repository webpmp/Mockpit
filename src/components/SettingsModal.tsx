import React, { useState, useEffect } from 'react';
import { Settings, X, Palette, Check, Info, Sparkles, RefreshCw, Grid, Eye, EyeOff, Magnet, Image, Upload, Trash2 } from 'lucide-react';
import { useMockpitStore } from '../store/useMockpitStore';
import { BUILTIN_PALETTES, PaletteConfig, PalettePresetId } from '../types';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useMockpitStore((s) => s.isSettingsOpen);
  const toggleSettingsModal = useMockpitStore((s) => s.toggleSettingsModal);
  const activePalette = useMockpitStore((s) => s.activePalette);
  const setPalette = useMockpitStore((s) => s.setPalette);

  const gridConfig = useMockpitStore((s) => s.gridConfig);
  const setGridConfig = useMockpitStore((s) => s.setGridConfig);
  const toggleGridVisibility = useMockpitStore((s) => s.toggleGridVisibility);
  const toggleSnapToGrid = useMockpitStore((s) => s.toggleSnapToGrid);
  const resnapAllComponentsToGrid = useMockpitStore((s) => s.resnapAllComponentsToGrid);

  // Local state for custom color pickers
  const [customPrimary, setCustomPrimary] = useState(activePalette.primary || '#38bdf8');
  const [customSecondary, setCustomSecondary] = useState(activePalette.secondary || '#3b82f6');
  const [customTertiary, setCustomTertiary] = useState(activePalette.tertiary || '#10b981');

  // Local state for grid size input to avoid triggering confirmation mid-keystroke
  const [localGridSize, setLocalGridSize] = useState<number>(gridConfig.size || 10);

  useEffect(() => {
    setLocalGridSize(gridConfig.size);
  }, [gridConfig.size]);

  // Keep local state in sync when activePalette changes externally or preset selected
  useEffect(() => {
    setCustomPrimary(activePalette.primary);
    setCustomSecondary(activePalette.secondary);
    setCustomTertiary(activePalette.tertiary);
  }, [activePalette]);

  if (!isSettingsOpen) return null;

  const handleSelectPreset = (presetKey: Exclude<PalettePresetId, 'custom'>) => {
    const preset = BUILTIN_PALETTES[presetKey];
    setPalette(preset);
  };

  const handleCustomChange = (field: 'primary' | 'secondary' | 'tertiary', hex: string) => {
    let p = customPrimary;
    let s = customSecondary;
    let t = customTertiary;

    if (field === 'primary') {
      p = hex;
      setCustomPrimary(hex);
    } else if (field === 'secondary') {
      s = hex;
      setCustomSecondary(hex);
    } else if (field === 'tertiary') {
      t = hex;
      setCustomTertiary(hex);
    }

    const customConfig: PaletteConfig = {
      id: 'custom',
      name: 'Custom',
      primary: p,
      secondary: s,
      tertiary: t,
    };
    setPalette(customConfig);
  };

  const handleResetToDefault = () => {
    setPalette(BUILTIN_PALETTES.cyberSky);
  };

  return (
    <div className="fixed top-11 right-0 bottom-[42px] z-40 w-80 sm:w-96 bg-slate-950/95 border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg border bg-slate-900"
            style={{
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)',
            }}
          >
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 font-mono tracking-wide">
              SYSTEM SETTINGS
            </h2>
            <p className="text-[10px] text-slate-400">
              Palette &amp; Visual System
            </p>
          </div>
        </div>
        <button
          onClick={toggleSettingsModal}
          className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 space-y-5 overflow-y-auto custom-scrollbar flex-1">
        {/* Palette Section */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-mono">
              <Palette className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span>COLOR PALETTE SYSTEM</span>
            </div>
            <button
              onClick={handleResetToDefault}
              className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors cursor-pointer font-mono"
              title="Reset Palette to Cyber Sky Default"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {(Object.keys(BUILTIN_PALETTES) as Array<Exclude<PalettePresetId, 'custom'>>).map(
              (key) => {
                const preset = BUILTIN_PALETTES[key];
                const isSelected = activePalette.id === key;

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectPreset(key)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
                      isSelected
                        ? 'bg-slate-900 border-sky-500/60 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                    style={{
                      borderColor: isSelected ? 'var(--color-primary)' : undefined,
                    }}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold font-mono ${
                            isSelected ? 'text-slate-100' : 'text-slate-300 group-hover:text-slate-100'
                          }`}
                        >
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span
                            className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                          />
                        )}
                      </div>

                      {/* Swatches */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.primary }}
                          title={`Primary: ${preset.primary}`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.secondary }}
                          title={`Secondary: ${preset.secondary}`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.tertiary }}
                          title={`Tertiary: ${preset.tertiary}`}
                        />
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                    )}
                  </button>
                );
              }
            )}
          </div>

          {/* Custom Palette Option */}
          <div
            className={`p-3.5 rounded-xl border transition-all space-y-3 ${
              activePalette.id === 'custom'
                ? 'bg-slate-900 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-slate-950/60 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-100 font-mono uppercase">
                  Custom Color Palette
                </span>
              </div>
              {activePalette.id === 'custom' && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  ACTIVE
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-0.5">
              {/* Primary Color Picker */}
              <div className="space-y-1 bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-300 font-mono shrink-0">
                  Primary
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customPrimary}
                    onChange={(e) => handleCustomChange('primary', e.target.value)}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={customPrimary}
                    onChange={(e) => handleCustomChange('primary', e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Secondary Color Picker */}
              <div className="space-y-1 bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-300 font-mono shrink-0">
                  Secondary
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customSecondary}
                    onChange={(e) => handleCustomChange('secondary', e.target.value)}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={customSecondary}
                    onChange={(e) => handleCustomChange('secondary', e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Tertiary Color Picker */}
              <div className="space-y-1 bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-300 font-mono shrink-0">
                  Tertiary
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTertiary}
                    onChange={(e) => handleCustomChange('tertiary', e.target.value)}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={customTertiary}
                    onChange={(e) => handleCustomChange('tertiary', e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Uniform Grid Section (Figma Model) */}
        <div className="space-y-3.5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-mono">
              <Grid className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span>CANVAS UNIFORM GRID</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleGridVisibility}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
                  gridConfig.visible
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title={gridConfig.visible ? 'Hide Grid Overlay' : 'Show Grid Overlay'}
              >
                {gridConfig.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{gridConfig.visible ? 'VISIBLE' : 'HIDDEN'}</span>
              </button>

              <button
                onClick={toggleSnapToGrid}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
                  gridConfig.snapToGrid
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title={
                  gridConfig.snapToGrid
                    ? 'Snap to Grid is Active (Components align to grid steps)'
                    : 'Snap to Grid is Disabled (Freeform placement)'
                }
              >
                <Magnet className="w-3.5 h-3.5" />
                <span>SNAP {gridConfig.snapToGrid ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            {/* Grid Size Input (px) */}
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-200 font-mono block">
                  Grid Size (px)
                </label>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Uniform square ({gridConfig.size}px × {gridConfig.size}px)
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Preset quick buttons */}
                {[5, 10, 20, 40].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => {
                      if (sz === gridConfig.size) return;
                      if (gridConfig.snapToGrid) {
                        const confirmed = window.confirm(
                          `Re-snap all components on every screen to the new grid size (${sz}px)?\n\nThis will recalculate position (x, y) and size (width, height) for all components across all screens.`
                        );
                        if (confirmed) {
                          setGridConfig({ size: sz });
                          setLocalGridSize(sz);
                          resnapAllComponentsToGrid(sz);
                        }
                      } else {
                        setGridConfig({ size: sz });
                        setLocalGridSize(sz);
                      }
                    }}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                      gridConfig.size === sz
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sz}p
                  </button>
                ))}
                <input
                  type="number"
                  min={2}
                  max={200}
                  value={localGridSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setLocalGridSize(isNaN(val) ? 0 : val);
                  }}
                  onBlur={() => {
                    const clamped = Math.max(2, Math.min(200, localGridSize || gridConfig.size));
                    if (clamped === gridConfig.size) {
                      setLocalGridSize(gridConfig.size);
                      return;
                    }
                    if (gridConfig.snapToGrid) {
                      const confirmed = window.confirm(
                        `Re-snap all components on every screen to the new grid size (${clamped}px)?\n\nThis will recalculate position (x, y) and size (width, height) for all components across all screens.`
                      );
                      if (confirmed) {
                        setGridConfig({ size: clamped });
                        setLocalGridSize(clamped);
                        resnapAllComponentsToGrid(clamped);
                      } else {
                        setLocalGridSize(gridConfig.size);
                      }
                    } else {
                      setGridConfig({ size: clamped });
                      setLocalGridSize(clamped);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs font-mono font-bold text-slate-100 text-right focus:outline-none focus:border-sky-500"
                />
                <span className="text-xs font-mono text-slate-400">px</span>
              </div>
            </div>

            {/* Grid Color & Opacity */}
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-200 font-mono block">
                  Grid Color &amp; Opacity
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Canvas aid (non-theme)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gridConfig.color}
                  onChange={(e) => setGridConfig({ color: e.target.value })}
                  className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer shrink-0"
                  title="Pick Grid Color"
                />
                <input
                  type="text"
                  value={gridConfig.color}
                  onChange={(e) => setGridConfig({ color: e.target.value })}
                  className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 shrink-0"
                />

                <div className="flex-1 flex items-center gap-2 pl-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={gridConfig.opacity}
                    onChange={(e) => setGridConfig({ opacity: parseInt(e.target.value, 10) })}
                    className="w-full accent-sky-400 cursor-pointer"
                    title={`Opacity: ${gridConfig.opacity}%`}
                  />
                  <span className="text-xs font-mono text-slate-300 w-9 text-right shrink-0">
                    {gridConfig.opacity}%
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas Background Image */}
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-sky-400" />
                  <label className="text-[11px] font-bold text-slate-200 font-mono block">
                    Custom Canvas Background
                  </label>
                </div>
                {gridConfig.bgImage && (
                  <button
                    onClick={() => setGridConfig({ bgImage: '' })}
                    className="text-[10px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 cursor-pointer"
                    title="Clear Background Image"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500/25 text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            if (evt.target?.result) {
                              setGridConfig({ bgImage: evt.target.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <input
                    type="text"
                    placeholder="or relative path (e.g. /car-bg.jpg) or URL..."
                    value={gridConfig.bgImage || ''}
                    onChange={(e) => setGridConfig({ bgImage: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {gridConfig.bgImage && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">Opacity:</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={gridConfig.bgOpacity ?? 40}
                      onChange={(e) => setGridConfig({ bgOpacity: parseInt(e.target.value, 10) })}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300 w-9 text-right shrink-0">
                      {gridConfig.bgOpacity ?? 40}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Integration Info Callout */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold font-mono text-slate-200">
            <Info className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
            <span>LIVE CSS CUSTOM PROPERTIES</span>
          </div>
          <p className="leading-relaxed text-slate-400 text-[11px]">
            Changes apply live via <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded">--color-primary</code>, <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded">--color-secondary</code>, and <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded">--color-tertiary</code> across main shared accent surfaces.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex justify-end shrink-0">
        <button
          onClick={toggleSettingsModal}
          className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md"
          style={{
            backgroundColor: 'var(--color-primary)',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

