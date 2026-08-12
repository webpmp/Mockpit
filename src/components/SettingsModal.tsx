import React, { useState, useEffect } from 'react';
import { Settings, X, Palette, Check, Info, Sparkles, RefreshCw, Grid, Eye, EyeOff, Magnet, Image, Upload, Trash2, Car, Keyboard, Type } from 'lucide-react';
import { useMockpitStore } from '../store/useMockpitStore';
import { BUILTIN_PALETTES, PaletteConfig, PalettePresetId, VehicleBackgroundPosition, KeyboardSlideDirection, TextScalePreset, TEXT_SCALE_FACTORS } from '../types';
import { getAvailableVehicles } from '../utils/vehicleAssets';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useMockpitStore((s) => s.isSettingsOpen);
  const toggleSettingsModal = useMockpitStore((s) => s.toggleSettingsModal);
  const setSettingsModalOpen = useMockpitStore((s) => s.setSettingsModalOpen);
  const screenMode = useMockpitStore((s) => s.screenMode);
  const activePalette = useMockpitStore((s) => s.activePalette);
  const setPalette = useMockpitStore((s) => s.setPalette);

  const textScale = useMockpitStore((s) => s.textScale);
  const setTextScale = useMockpitStore((s) => s.setTextScale);

  const gridConfig = useMockpitStore((s) => s.gridConfig);
  const setGridConfig = useMockpitStore((s) => s.setGridConfig);
  const toggleGridVisibility = useMockpitStore((s) => s.toggleGridVisibility);
  const toggleSnapToGrid = useMockpitStore((s) => s.toggleSnapToGrid);
  const resnapAllComponentsToGrid = useMockpitStore((s) => s.resnapAllComponentsToGrid);

  const vehicleBackground = useMockpitStore((s) => s.vehicleBackground);
  const setVehicleBackground = useMockpitStore((s) => s.setVehicleBackground);

  const keyboardSlideDirection = useMockpitStore((s) => s.keyboardSlideDirection);
  const setKeyboardSlideDirection = useMockpitStore((s) => s.setKeyboardSlideDirection);

  const egoVehicleType = useMockpitStore((s) => s.egoVehicleType);
  const setEgoVehicleType = useMockpitStore((s) => s.setEgoVehicleType);

  const availableVehicles = getAvailableVehicles();

  // Automatically close settings panel if switching to Presentation mode
  useEffect(() => {
    if (screenMode === 'presentation' && isSettingsOpen) {
      setSettingsModalOpen(false);
    }
  }, [screenMode, isSettingsOpen, setSettingsModalOpen]);

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

  if (!isSettingsOpen || screenMode === 'presentation') return null;

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

        {/* Global Text Size Section */}
        <div className="space-y-3.5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-mono">
              <Type className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span>GLOBAL TEXT SIZE</span>
            </div>
            <span className="text-[10px] font-mono text-sky-400 font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
              {textScale.toUpperCase()} ({Math.round((TEXT_SCALE_FACTORS[textScale] || 1) * 100)}%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Scales typography proportionally across high-traffic surfaces (Music Player, Drive Simulator, Notifications, Controls) using root <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded font-mono">--text-scale</code>.
            </p>

            {/* Scale Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'small', label: 'Small', percentage: '87.5%' },
                  { id: 'medium', label: 'Medium', percentage: '100%' },
                  { id: 'large', label: 'Large', percentage: '115%' },
                  { id: 'xlarge', label: 'X-Large', percentage: '130%' },
                ] as const
              ).map((opt) => {
                const isSelected = textScale === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTextScale(opt.id as TextScalePreset)}
                    className={`py-2 px-2 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 group ${
                      isSelected
                        ? 'bg-slate-900 border-sky-500/80 text-slate-100 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                        : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    style={{
                      borderColor: isSelected ? 'var(--color-primary)' : undefined,
                    }}
                  >
                    <span
                      className={`font-bold font-mono transition-transform ${
                        isSelected ? 'scale-105' : 'group-hover:scale-105'
                      }`}
                      style={{
                        fontSize: opt.id === 'small' ? '11px' : opt.id === 'medium' ? '12px' : opt.id === 'large' ? '14px' : '15px',
                        color: isSelected ? 'var(--color-primary)' : undefined,
                      }}
                    >
                      Aa
                    </span>
                    <span className="text-[10px] font-bold font-mono">
                      {opt.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {opt.percentage}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Interactive Text Preview Card */}
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                Live Text Preview
              </div>
              <div
                className="font-mono text-slate-200 font-semibold truncate transition-all"
                style={{
                  fontSize: `calc(0.75rem * var(--text-scale, ${TEXT_SCALE_FACTORS[textScale]}))`,
                }}
              >
                Mockpit Automotive UI — Speed: 75 MPH | Media: Cyber Pulse
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
                      setGridConfig({ size: sz });
                      setLocalGridSize(sz);
                      if (gridConfig.snapToGrid) {
                        resnapAllComponentsToGrid(sz);
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

        {/* Global Vehicle Background Silhouette Section */}
        <div className="space-y-3.5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-mono">
              <Car className="w-4 h-4 text-sky-400" />
              <span>VEHICLE BACKGROUND SILHOUETTE</span>
            </div>
            <button
              onClick={() => setVehicleBackground({ enabled: !vehicleBackground.enabled })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
                vehicleBackground.enabled
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>VEHICLE BG {vehicleBackground.enabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {vehicleBackground.enabled && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3.5">
              {/* Vehicle Asset Selection with Thumbnails */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 font-mono">
                    Vehicle Model
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {availableVehicles.length} assets available
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 bg-slate-900/80 rounded-lg border border-slate-800 custom-scrollbar">
                  {/* "None" option */}
                  <button
                    onClick={() => setVehicleBackground({ vehicle: null })}
                    className={`p-2 rounded-lg border text-left flex flex-col items-center justify-center gap-1 transition-all cursor-pointer min-h-[72px] ${
                      !vehicleBackground.vehicle
                        ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="w-8 h-8 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-500">
                      Ø
                    </div>
                    <span className="text-[10px] font-mono truncate max-w-full text-center font-bold">
                      None
                    </span>
                  </button>

                  {availableVehicles.map((v) => {
                    const isSelected =
                      vehicleBackground.vehicle === v.url || vehicleBackground.vehicle === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVehicleBackground({ vehicle: v.url })}
                        className={`p-1.5 rounded-lg border text-left flex flex-col items-center justify-between gap-1 transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-sm ring-1 ring-sky-500/40'
                            : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className="w-full h-10 rounded bg-slate-900/90 border border-slate-800/60 p-1 flex items-center justify-center overflow-hidden">
                          <img
                            src={v.url}
                            alt={v.name}
                            className="w-full h-full object-contain filter contrast-125 brightness-110"
                            loading="lazy"
                          />
                        </div>
                        <span className="text-[10px] font-mono truncate max-w-full text-center font-bold text-slate-300 group-hover:text-slate-100">
                          {v.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opacity Slider (0% to 15%) */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-200 font-mono">
                    Opacity (Subtle Silhouette)
                  </label>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {vehicleBackground.opacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={vehicleBackground.opacity}
                  onChange={(e) =>
                    setVehicleBackground({ opacity: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>0% (Invisible)</span>
                  <span>8% (Default)</span>
                  <span>15% (Max)</span>
                </div>
              </div>

              {/* Blur Slider (0px to 12px) */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-200 font-mono">
                    Blur (Soft Atmosphere)
                  </label>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {vehicleBackground.blur ?? 4}px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={vehicleBackground.blur ?? 4}
                  onChange={(e) =>
                    setVehicleBackground({ blur: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>0px (Sharp)</span>
                  <span>4px (Default)</span>
                  <span>12px (Max Soft)</span>
                </div>
              </div>

              {/* Position 3x3 Grid Selector */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-slate-200 font-mono block">
                  Canvas Anchor Position
                </label>
                <div className="grid grid-cols-3 gap-1.5 w-52 mx-auto p-1 bg-slate-950 rounded-lg border border-slate-800">
                  {[
                    { id: 'top-left', label: 'Top Left' },
                    { id: 'top-center', label: 'Top Ctr' },
                    { id: 'top-right', label: 'Top Right' },
                    { id: 'center-left', label: 'Ctr Left' },
                    { id: 'center', label: 'Center' },
                    { id: 'center-right', label: 'Ctr Right' },
                    { id: 'bottom-left', label: 'Btm Left' },
                    { id: 'bottom-center', label: 'Btm Ctr' },
                    { id: 'bottom-right', label: 'Btm Right' },
                  ].map((pos) => {
                    const isPosSelected = vehicleBackground.position === pos.id;
                    return (
                      <button
                        key={pos.id}
                        onClick={() =>
                          setVehicleBackground({ position: pos.id as VehicleBackgroundPosition })
                        }
                        className={`py-1.5 px-1 text-[9px] font-mono font-bold rounded border transition-all cursor-pointer text-center leading-none ${
                          isPosSelected
                            ? 'bg-sky-500/25 border-sky-500 text-sky-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800/80 text-slate-500 hover:text-slate-300'
                        }`}
                        title={`Anchor: ${pos.id}`}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scale & Blend Mode Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Scale */}
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-200 font-mono">Scale</label>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {vehicleBackground.scale}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={5}
                    value={vehicleBackground.scale}
                    onChange={(e) =>
                      setVehicleBackground({ scale: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                {/* Blend Mode */}
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-200 font-mono block">
                    Blend Mode
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['auto', 'normal', 'multiply'] as const).map((bm) => {
                      const isBmSelected = vehicleBackground.blendMode === bm;
                      return (
                        <button
                          key={bm}
                          onClick={() => setVehicleBackground({ blendMode: bm })}
                          className={`py-1 text-[10px] font-mono font-bold capitalize rounded border transition-all cursor-pointer text-center ${
                            isBmSelected
                              ? 'bg-sky-500/25 border-sky-500 text-sky-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {bm}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Model Binding Info */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 flex items-start gap-2.5">
          <Car className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block mb-0.5">Dual-Bound Vehicle Model</span>
            <span>Selecting a Vehicle Model above drives both the subtle canvas background watermark and the Navigation Overhead Ego silhouette in real time.</span>
          </div>
        </div>

        {/* Global Virtual Keyboard Section */}
        <div className="space-y-3.5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-mono">
            <Keyboard className="w-4 h-4 text-sky-400" />
            <span>GLOBAL VIRTUAL KEYBOARD</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-200 font-mono block">
                  Default Slide Direction
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  System Default
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(['bottom', 'top', 'left', 'right'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setKeyboardSlideDirection(dir)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold capitalize transition-all cursor-pointer border text-center ${
                      keyboardSlideDirection === dir
                        ? 'bg-sky-500/20 border-sky-500/60 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                Automatically slides on-screen QWERTY keyboard into view when typing in canvas input fields.
              </p>
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
    </div>
  );
};

