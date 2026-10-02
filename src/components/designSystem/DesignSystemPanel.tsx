import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Search,
  Check,
  Trash2,
  Copy,
  Edit2,
  AlertCircle,
  Palette,
} from 'lucide-react';
import { useMockpitStore } from '../../store/useMockpitStore';
import {
  COLOR_ROLES,
  ROLE_GROUPS,
  RoleDefinition,
  RoleId,
  RoleGroup,
  FACTORY_PRESETS,
  FACTORY_THEME_LIST,
  isFactoryPreset,
  validateAndNormalizeHex,
  validateThemeName,
  resolveTheme,
} from '../../designSystem';
import { ThemePreview } from './ThemePreview';

export const DesignSystemPanel: React.FC = () => {
  const isDesignSystemOpen = useMockpitStore((s) => s.isDesignSystemOpen);
  const setIsDesignSystemOpen = useMockpitStore((s) => s.setIsDesignSystemOpen);
  const activeThemeId = useMockpitStore((s) => s.activeThemeId);
  const userThemes = useMockpitStore((s) => s.userThemes);
  const setActiveTheme = useMockpitStore((s) => s.setActiveTheme);
  const setRoleColor = useMockpitStore((s) => s.setRoleColor);
  const resetActiveTheme = useMockpitStore((s) => s.resetActiveTheme);
  const renameTheme = useMockpitStore((s) => s.renameTheme);
  const duplicateTheme = useMockpitStore((s) => s.duplicateTheme);
  const deleteTheme = useMockpitStore((s) => s.deleteTheme);

  const activeTheme = useMemo(
    () => resolveTheme(activeThemeId, userThemes),
    [activeThemeId, userThemes]
  );
  const isUserTheme = !isFactoryPreset(activeThemeId);

  // Filter input state
  const [filterQuery, setFilterQuery] = useState('');

  // Live preview collapsible state
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);

  // Theme actions menu state
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Inline rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Inline confirmation state ('reset' | 'delete' | null)
  const [confirmAction, setConfirmAction] = useState<'reset' | 'delete' | null>(null);

  // Hex input local state and errors (keyed by roleId)
  const [localHexValues, setLocalHexValues] = useState<Record<string, string>>({});
  const [hexErrors, setHexErrors] = useState<Record<string, string | null>>({});

  // Synchronize local hex values when active theme colors change
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const role of COLOR_ROLES) {
      next[role.id] = (activeTheme.colors[role.id] || role.defaultValue).toUpperCase();
    }
    setLocalHexValues(next);
    setHexErrors({});
  }, [activeTheme]);

  // Close actions menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    if (isActionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActionsMenuOpen]);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (isRenaming) {
      setRenameInput(activeTheme.name);
      setRenameError(null);
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 50);
    }
  }, [isRenaming, activeTheme.name]);

  // Filter roles
  const filteredRolesByGroup = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const result: Record<RoleGroup, RoleDefinition[]> = {
      Backgrounds: [],
      Text: [],
      Borders: [],
      Accent: [],
      Status: [],
    };

    for (const role of COLOR_ROLES) {
      if (
        !q ||
        role.label.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q) ||
        role.id.toLowerCase().includes(q)
      ) {
        result[role.group].push(role);
      }
    }

    return result;
  }, [filterQuery]);

  const totalFilteredCount = useMemo(() => {
    return (Object.values(filteredRolesByGroup) as RoleDefinition[][]).reduce(
      (acc, list) => acc + list.length,
      0
    );
  }, [filteredRolesByGroup]);

  if (!isDesignSystemOpen) return null;

  // Handlers
  const handleHexBlurOrEnter = (roleId: RoleId) => {
    const raw = localHexValues[roleId] || '';
    const normalized = validateAndNormalizeHex(raw);
    if (!normalized) {
      // Revert to theme color and show inline error
      setLocalHexValues((prev) => ({
        ...prev,
        [roleId]: (activeTheme.colors[roleId] || '#000000').toUpperCase(),
      }));
      setHexErrors((prev) => ({
        ...prev,
        [roleId]: 'Use a hex color like #1E293B',
      }));
      return;
    }

    // Valid hex: commit to store
    setHexErrors((prev) => ({ ...prev, [roleId]: null }));
    setLocalHexValues((prev) => ({
      ...prev,
      [roleId]: normalized.toUpperCase(),
    }));
    setRoleColor(roleId, normalized);
  };

  const handleColorPickerChange = (roleId: RoleId, hex: string) => {
    const normalized = validateAndNormalizeHex(hex);
    if (!normalized) return;
    setLocalHexValues((prev) => ({
      ...prev,
      [roleId]: normalized.toUpperCase(),
    }));
    setHexErrors((prev) => ({ ...prev, [roleId]: null }));
    setRoleColor(roleId, normalized);
  };

  const handleRenameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isUserTheme) return;

    const res = renameTheme(activeThemeId, renameInput);
    if (res.success) {
      setIsRenaming(false);
      setRenameError(null);
    } else {
      setRenameError(res.error || 'Failed to rename');
    }
  };

  const handleDuplicate = () => {
    if (!isUserTheme) return;
    setIsActionsMenuOpen(false);
    duplicateTheme(activeThemeId);
  };

  const handleConfirmReset = () => {
    resetActiveTheme();
    setConfirmAction(null);
  };

  const handleConfirmDelete = () => {
    deleteTheme(activeThemeId);
    setConfirmAction(null);
  };

  return (
    <div
      data-testid="design-system-panel"
      className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col h-full overflow-hidden text-slate-100 select-none z-30"
    >
      {/* 1. Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold font-mono tracking-wider text-slate-100 uppercase">
            Design system
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="design-system-reset-header-btn"
            disabled={!isUserTheme}
            onClick={() => setConfirmAction('reset')}
            className={`px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1 transition-colors ${
              isUserTheme
                ? 'text-slate-400 hover:text-sky-300 hover:bg-slate-800 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title={isUserTheme ? 'Reset theme to base preset' : 'Reset is disabled for factory presets'}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            data-testid="design-system-close-btn"
            onClick={() => setIsDesignSystemOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Design System"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
        {/* Inline confirmation block */}
        {confirmAction && (
          <div
            data-testid="inline-confirm-block"
            className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 shadow-lg space-y-2.5 animate-in fade-in duration-150"
          >
            <p className="text-xs font-mono text-slate-200">
              {confirmAction === 'reset'
                ? `Reset "${activeTheme.name}" to the original ${FACTORY_PRESETS[activeTheme.baseId]?.name || 'preset'} colors?`
                : `Delete theme "${activeTheme.name}"?`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:text-slate-100 text-xs font-mono cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="inline-confirm-action-btn"
                onClick={confirmAction === 'reset' ? handleConfirmReset : handleConfirmDelete}
                className={`px-3 py-1 rounded-lg text-white text-xs font-mono font-bold cursor-pointer transition-colors ${
                  confirmAction === 'reset'
                    ? 'bg-sky-500 hover:bg-sky-400'
                    : 'bg-rose-500 hover:bg-rose-400'
                }`}
              >
                {confirmAction === 'reset' ? 'Reset' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {/* 2. Theme Dropdown & Menu */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Theme
          </label>

          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameInput}
                  maxLength={40}
                  onChange={(e) => {
                    setRenameInput(e.target.value);
                    setRenameError(null);
                  }}
                  className="flex-1 bg-slate-900 border border-sky-500 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 outline-none"
                  placeholder="Theme name"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer"
                  title="Save name"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRenaming(false);
                    setRenameError(null);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Cancel rename"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {renameError && (
                <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{renameError}</span>
                </div>
              )}
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Dropdown select */}
              <div className="relative flex-1">
                <select
                  data-testid="theme-select-dropdown"
                  value={activeThemeId}
                  onChange={(e) => setActiveTheme(e.target.value)}
                  className="w-full appearance-none bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 outline-none focus:border-sky-500 cursor-pointer pr-8"
                >
                  <optgroup label="Presets">
                    {FACTORY_THEME_LIST.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </optgroup>
                  {userThemes.length > 0 && (
                    <optgroup label="Your themes">
                      {userThemes.map((userTheme) => (
                        <option key={userTheme.id} value={userTheme.id}>
                          {userTheme.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* ⋯ Menu for user themes */}
              {isUserTheme && (
                <div className="relative" ref={actionsMenuRef}>
                  <button
                    type="button"
                    data-testid="theme-actions-menu-btn"
                    onClick={() => setIsActionsMenuOpen((prev) => !prev)}
                    className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors cursor-pointer"
                    title="Theme options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isActionsMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 text-xs font-mono space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          setIsRenaming(true);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDuplicate}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Duplicate</span>
                      </button>
                      <div className="h-px bg-slate-800 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          setConfirmAction('delete');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Filter input & Category Header */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-slate-200 tracking-wide uppercase">
              Colors
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {totalFilteredCount} {totalFilteredCount === 1 ? 'role' : 'roles'}
            </span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter colors"
              className="w-full bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* 4. Live Preview (Collapsible) */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setIsPreviewExpanded((prev) => !prev)}
            className="flex items-center justify-between w-full text-left group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-slate-300 group-hover:text-slate-100">
              {isPreviewExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Live preview</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {isPreviewExpanded ? 'Hide' : 'Show'}
            </span>
          </button>

          {isPreviewExpanded && (
            <div className="pt-0.5">
              <ThemePreview />
            </div>
          )}
        </div>

        {/* 5. Role List grouped by Category */}
        <div className="space-y-4 pt-1 border-t border-slate-800/80">
          {totalFilteredCount === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-slate-500">
              No colors match "{filterQuery}"
            </div>
          ) : (
            ROLE_GROUPS.map((group) => {
              const roles = filteredRolesByGroup[group];
              if (!roles || roles.length === 0) return null;

              return (
                <div key={group} className="space-y-2">
                  <h3 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    {group}
                  </h3>

                  <div className="space-y-2">
                    {roles.map((role) => {
                      const currentColor =
                        activeTheme.colors[role.id] || role.defaultValue;
                      const displayHex = (
                        localHexValues[role.id] ?? currentColor
                      ).toUpperCase();
                      const error = hexErrors[role.id];

                      return (
                        <div
                          key={role.id}
                          data-testid={`role-row-${role.id}`}
                          className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all min-h-[48px] flex flex-col justify-center space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            {/* Swatch & Label */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Swatch with native color picker */}
                              <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-700 shrink-0 shadow-sm">
                                <input
                                  type="color"
                                  value={currentColor}
                                  onChange={(e) =>
                                    handleColorPickerChange(role.id, e.target.value)
                                  }
                                  className="absolute -inset-2 w-12 h-12 cursor-pointer border-0 p-0 m-0 bg-transparent"
                                  title={`Change ${role.label} color`}
                                />
                              </div>

                              {/* Label & Description */}
                              <div className="min-w-0 flex flex-col">
                                <span className="text-[13px] font-bold text-slate-200 font-mono leading-tight whitespace-nowrap">
                                  {role.label}
                                </span>
                                <span className="text-[12px] text-slate-400 font-sans leading-tight truncate">
                                  {role.description}
                                </span>
                              </div>
                            </div>

                            {/* Hex Input */}
                            <div className="shrink-0 flex items-center">
                              <input
                                type="text"
                                maxLength={7}
                                value={displayHex}
                                onChange={(e) =>
                                  setLocalHexValues((prev) => ({
                                    ...prev,
                                    [role.id]: e.target.value,
                                  }))
                                }
                                onBlur={() => handleHexBlurOrEnter(role.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleHexBlurOrEnter(role.id);
                                  }
                                }}
                                className={`w-20 bg-slate-950 border rounded-lg px-2 py-1 text-[12px] font-mono text-right outline-none transition-colors ${
                                  error
                                    ? 'border-rose-500 text-rose-300'
                                    : 'border-slate-800 text-slate-200 focus:border-sky-500'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Inline Hex Validation Error */}
                          {error && (
                            <div className="text-[11px] font-mono text-rose-400 pl-9">
                              {error}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
