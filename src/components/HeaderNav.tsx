import React, { useState, useRef, useEffect } from 'react';
import { useMockpitStore } from '../store/useMockpitStore';
import {
  Play,
  Edit3,
  RotateCcw,
  Settings,
  LayoutGrid,
  MapPin,
  Music,
  Phone,
  Layout,
  Plus,
  ChevronDown,
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CornerDownRight,
  FolderTree,
} from 'lucide-react';

const getScreenIcon = (id: string) => {
  if (id === 'home') return LayoutGrid;
  if (id === 'navigation' || id === 'favorites') return MapPin;
  if (id === 'media' || id === 'playlists') return Music;
  if (id === 'phone') return Phone;
  return Layout;
};

export const HeaderNav: React.FC = () => {
  const screenMode = useMockpitStore((s) => s.screenMode);
  const setScreenMode = useMockpitStore((s) => s.setScreenMode);
  const activeView = useMockpitStore((s) => s.activeView);
  const setActiveView = useMockpitStore((s) => s.setActiveView);
  const screens = useMockpitStore((s) => s.screens);
  const addScreen = useMockpitStore((s) => s.addScreen);
  const moveScreen = useMockpitStore((s) => s.moveScreen);
  const isSettingsOpen = useMockpitStore((s) => s.isSettingsOpen);
  const toggleSettingsModal = useMockpitStore((s) => s.toggleSettingsModal);
  const resetToSeedData = useMockpitStore((s) => s.resetToSeedData);

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPresentation = screenMode === 'presentation';

  // Find active screen definition and its parent screen if child
  const activeScreenDef = screens.find((s) => s.id === activeView) || screens[0];
  const activeParentDef = activeScreenDef?.parentId
    ? screens.find((s) => s.id === activeScreenDef.parentId)
    : null;

  // Top-level screens (parentId === null)
  const topLevelScreens = screens.filter((s) => !s.parentId);

  // Close mega-menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMegaMenuOpen(false);
      }
    };
    if (isMegaMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMegaMenuOpen]);

  const handleAddTopLevelScreen = () => {
    const name = window.prompt('Enter new top-level screen name:', `Screen ${topLevelScreens.length + 1}`);
    if (name && name.trim()) {
      addScreen(name.trim(), 'fade', null);
      setIsMegaMenuOpen(false);
    }
  };

  const handleAddChildScreen = (parentId: string, parentName: string) => {
    const name = window.prompt(`Enter child screen name under "${parentName}":`);
    if (name && name.trim()) {
      addScreen(name.trim(), 'fade', parentId);
      setIsMegaMenuOpen(false);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Reset canvas to default seed data? Custom screens and layouts will be restored.'
      )
    ) {
      resetToSeedData();
    }
  };

  const ActiveIcon = activeScreenDef ? getScreenIcon(activeScreenDef.id) : Layout;

  return (
    <header className="h-11 bg-slate-950 border-b border-slate-900 px-4 flex items-center justify-between shrink-0 select-none relative z-50">
      {/* App Branding */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-black tracking-widest font-mono uppercase"
          style={{ color: 'var(--color-primary)' }}
        >
          MOCKPIT
        </span>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
          v0.12
        </span>
      </div>

      {/* Center Controls: Mega-Menu Screen Selector & Mode Switcher */}
      <div className="flex items-center gap-2">
        {/* Current Screen Selector Button (Opens Mega-Menu) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm cursor-pointer ${
              isMegaMenuOpen
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
            }`}
          >
            <ActiveIcon className="w-3.5 h-3.5 text-sky-400" />
            <div className="flex items-center gap-1 font-mono text-slate-300">
              {activeParentDef && (
                <>
                  <span className="text-slate-400 font-normal">{activeParentDef.name}</span>
                  <span className="text-slate-600 font-mono">/</span>
                </>
              )}
              <span className="font-bold text-slate-100">{activeScreenDef?.name || 'Screen'}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isMegaMenuOpen ? 'rotate-180 text-sky-400' : ''
              }`}
            />
          </button>

          {/* Mega-Menu Dropdown / Popover Modal */}
          {isMegaMenuOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[720px] max-w-[92vw] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header Bar */}
              <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wide font-mono">
                    Screen Hierarchy Selector
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddTopLevelScreen}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500 hover:text-slate-950 transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Screen
                  </button>
                  <button
                    onClick={() => setIsMegaMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Columns Grid of Parent Screens */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-h-[65vh] overflow-y-auto">
                {topLevelScreens.map((parentScreen) => {
                  const ParentIcon = getScreenIcon(parentScreen.id);
                  const isParentActive = activeView === parentScreen.id;
                  const childScreens = screens.filter((s) => s.parentId === parentScreen.id);
                  const isHome = parentScreen.id === 'home';

                  return (
                    <div
                      key={parentScreen.id}
                      className={`flex flex-col rounded-xl border p-2.5 transition-all ${
                        isParentActive || childScreens.some((c) => c.id === activeView)
                          ? 'bg-slate-900/90 border-sky-500/40 shadow-sm'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      {/* Parent Column Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                        <button
                          onClick={() => {
                            setActiveView(parentScreen.id);
                            setIsMegaMenuOpen(false);
                          }}
                          className={`flex items-center gap-1.5 text-xs font-bold font-mono transition-colors text-left cursor-pointer ${
                            isParentActive ? 'text-sky-400' : 'text-slate-200 hover:text-sky-300'
                          }`}
                        >
                          <ParentIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{parentScreen.name}</span>
                          {isParentActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
                          )}
                        </button>

                        {/* Top-Level Reorder Left / Right */}
                        {!isHome && (
                          <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveScreen(parentScreen.id, 'left');
                              }}
                              className="p-0.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Move screen left"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveScreen(parentScreen.id, 'right');
                              }}
                              className="p-0.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Move screen right"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Child Screens Column List */}
                      <div className="flex-1 space-y-1 my-1 min-h-[48px]">
                        {childScreens.length === 0 ? (
                          <div className="text-[10px] text-slate-600 font-mono italic p-2 text-center">
                            No child screens
                          </div>
                        ) : (
                          childScreens.map((childScreen) => {
                            const ChildIcon = getScreenIcon(childScreen.id);
                            const isChildActive = activeView === childScreen.id;

                            return (
                              <div
                                key={childScreen.id}
                                className={`group/child flex items-center justify-between p-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isChildActive
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    setActiveView(childScreen.id);
                                    setIsMegaMenuOpen(false);
                                  }}
                                  className="flex items-center gap-1.5 flex-1 text-left cursor-pointer truncate"
                                >
                                  <CornerDownRight className="w-3 h-3 text-slate-500 shrink-0" />
                                  <ChildIcon className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{childScreen.name}</span>
                                </button>

                                {/* Child Screen Reorder Up / Down */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover/child:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveScreen(childScreen.id, 'up');
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-sky-300 rounded cursor-pointer"
                                    title="Move child up"
                                  >
                                    <ArrowUp className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveScreen(childScreen.id, 'down');
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-sky-300 rounded cursor-pointer"
                                    title="Move child down"
                                  >
                                    <ArrowDown className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Column Footer: + Add Child */}
                      <button
                        onClick={() => handleAddChildScreen(parentScreen.id, parentScreen.name)}
                        className="mt-2 w-full py-1 px-2 rounded-lg text-[10px] font-bold font-mono text-slate-400 hover:text-sky-300 bg-slate-950/60 border border-dashed border-slate-800 hover:border-sky-500/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Child
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-slate-800/90 mx-1" />

        {/* Editor / Presentation Mode Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800/90">
          <button
            onClick={() => setScreenMode('editor')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              !isPresentation
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Editor Mode"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <button
            onClick={() => setScreenMode('presentation')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isPresentation
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Presentation Mode"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Presentation</span>
          </button>
        </div>
      </div>

      {/* Utility Action Icons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleSettingsModal}
          className={`p-1.5 rounded-lg transition-all border cursor-pointer ${
            isSettingsOpen
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Settings (Palette System)"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
          title="Reset Canvas (Restore Seed State)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
