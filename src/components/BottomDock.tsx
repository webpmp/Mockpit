import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { useMockpitStore } from '../store/useMockpitStore';
import { ScreenDefinition } from '../types';
import { getScreenIcon } from '../config/screenIcons';

export const BottomDock: React.FC = () => {
  const activeView = useMockpitStore((s) => s.activeView);
  const setActiveView = useMockpitStore((s) => s.setActiveView);
  const screenMode = useMockpitStore((s) => s.screenMode);
  const screens = useMockpitStore((s) => s.screens);
  const dockOrder = useMockpitStore((s) => s.dockOrder);
  const moveDockItem = useMockpitStore((s) => s.moveDockItem);
  const setDockOrder = useMockpitStore((s) => s.setDockOrder);

  const isEditor = screenMode === 'editor';
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Requirement: Presentation dock ONLY shows top-level screens in dockOrder
  const topLevelScreens = dockOrder
    .map((id) => screens.find((s) => s.id === id))
    .filter((s): s is ScreenDefinition => Boolean(s));
  const activeScreenDef = screens.find((s) => s.id === activeView);

  const handleSelectView = (id: string) => {
    if (isEditor) return;
    setActiveView(id);
  };

  const handleMove = (id: string, direction: 'left' | 'right') => {
    moveDockItem(id, direction);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isEditor || id === 'home') return;
    setDraggedId(id);
    e.dataTransfer.setData('text/mockpit-dock-item', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (!isEditor || targetId === 'home') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!isEditor || targetId === 'home') return;
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/mockpit-dock-item') || draggedId;
    if (!sourceId || sourceId === 'home' || sourceId === targetId) return;

    const sourceIdx = topLevelScreens.findIndex((s) => s.id === sourceId);
    const targetIdx = topLevelScreens.findIndex((s) => s.id === targetId);

    if (sourceIdx > 0 && targetIdx > 0) {
      const newTopLevelIds = topLevelScreens.map((s) => s.id);
      const [moved] = newTopLevelIds.splice(sourceIdx, 1);
      newTopLevelIds.splice(targetIdx, 0, moved);
      setDockOrder(newTopLevelIds);
    }
    setDraggedId(null);
  };

  return (
    <div
      className={`relative pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all ${
        isEditor
          ? 'border border-dashed border-sky-500/50 bg-slate-950/90 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
          : 'border border-slate-800/80'
      }`}
    >
      {topLevelScreens.map((item, index) => {
        const Icon = getScreenIcon(item);
        const isActive = activeView === item.id || activeScreenDef?.parentId === item.id;
        const isHome = item.id === 'home';
        const isDragging = draggedId === item.id;

        const canMoveLeft = isEditor && !isHome && index > 1; // index 0 is Home
        const canMoveRight = isEditor && !isHome && index < topLevelScreens.length - 1;

        return (
          <div
            key={item.id}
            draggable={isEditor && !isHome}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={() => setDraggedId(null)}
            onClick={() => handleSelectView(item.id)}
            style={{
              color: isActive && !isEditor ? 'var(--color-primary)' : undefined,
              borderColor: isActive && !isEditor ? 'var(--color-primary)' : undefined,
              boxShadow: isActive && !isEditor ? '0 0 12px color-mix(in srgb, var(--color-primary) 30%, transparent)' : undefined,
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-300 relative group ${
              isEditor ? 'cursor-default select-none' : 'cursor-pointer'
            } ${
              isActive && !isEditor
                ? 'bg-slate-800/90 border scale-102'
                : isActive && isEditor
                ? 'bg-slate-900/90 text-slate-300 border border-slate-800/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            } ${isDragging ? 'opacity-40 scale-95 border-dashed border-sky-400' : ''}`}
            title={
              isEditor
                ? isHome
                  ? 'Home screen (Pinned first)'
                  : `Drag or use arrows to reorder ${item.name}`
                : `Switch to ${item.name} screen`
            }
          >
            {/* Editor Reorder Controls for non-Home items */}
            {isEditor && !isHome && (
              <div className="absolute -top-2 inset-x-0 flex items-center justify-between px-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  type="button"
                  disabled={!canMoveLeft}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(item.id, 'left');
                  }}
                  className={`p-0.5 rounded bg-slate-900 border border-slate-700 text-sky-400 hover:bg-sky-500 hover:text-slate-950 transition-colors cursor-pointer ${
                    !canMoveLeft ? 'opacity-20 cursor-not-allowed hover:bg-slate-900 hover:text-sky-400' : ''
                  }`}
                  title="Move left"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={!canMoveRight}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(item.id, 'right');
                  }}
                  className={`p-0.5 rounded bg-slate-900 border border-slate-700 text-sky-400 hover:bg-sky-500 hover:text-slate-950 transition-colors cursor-pointer ${
                    !canMoveRight ? 'opacity-20 cursor-not-allowed hover:bg-slate-900 hover:text-sky-400' : ''
                  }`}
                  title="Move right"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Drag Handle hint for non-Home items in Editor */}
            {isEditor && !isHome && (
              <span className="absolute -top-1.5 left-1 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-2.5 h-2.5" />
              </span>
            )}

            <Icon className="w-4 h-4 transition-transform group-hover:scale-105" style={{ color: isActive && !isEditor ? 'var(--color-primary)' : undefined }} />
            <span className="text-[0.5625rem] font-bold tracking-wider uppercase font-mono max-w-[80px] truncate">{item.name}</span>

            {/* Active Pill Indicator (Presentation Mode) */}
            {isActive && !isEditor && (
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: '0 0 8px var(--color-primary)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
