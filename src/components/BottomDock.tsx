import React, { useState, useRef } from 'react';
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

  // Quick Access store bindings
  const activeQuickAccess = useMockpitStore((s) => s.activeQuickAccess);
  const toggleQuickAccess = useMockpitStore((s) => s.toggleQuickAccess);
  const closeQuickAccess = useMockpitStore((s) => s.closeQuickAccess);

  const isEditor = screenMode === 'editor';
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Long press tracking refs
  const longPressTimerRef = useRef<Record<string, NodeJS.Timeout>>({});
  const longPressTriggeredRef = useRef<Record<string, boolean>>({});
  const pointerStartPosRef = useRef<Record<string, { x: number; y: number }>>({});

  // Requirement: Presentation dock ONLY shows top-level screens in dockOrder
  const topLevelScreens = dockOrder
    .map((id) => screens.find((s) => s.id === id))
    .filter((s): s is ScreenDefinition => Boolean(s));
  const activeScreenDef = screens.find((s) => s.id === activeView);

  const handleMove = (id: string, direction: 'left' | 'right') => {
    moveDockItem(id, direction);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    // Clear any active timers
    if (longPressTimerRef.current[id]) {
      clearTimeout(longPressTimerRef.current[id]);
      delete longPressTimerRef.current[id];
    }
    longPressTriggeredRef.current[id] = false;

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

  // Deterministic Press Interactions: Short Press (Quick Access) vs Long Press (Full Screen)
  const handlePointerDown = (e: React.PointerEvent, item: ScreenDefinition) => {
    // Only handle primary mouse click or touch
    if (e.button !== 0) return;

    pointerStartPosRef.current[item.id] = { x: e.clientX, y: e.clientY };
    longPressTriggeredRef.current[item.id] = false;

    // Clear any previous timer
    if (longPressTimerRef.current[item.id]) {
      clearTimeout(longPressTimerRef.current[item.id]);
    }

    // Set 500ms deterministic long-press timer
    longPressTimerRef.current[item.id] = setTimeout(() => {
      longPressTriggeredRef.current[item.id] = true;
      // Long press: navigate to full screen
      closeQuickAccess();
      setActiveView(item.id);
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent, itemId: string) => {
    const start = pointerStartPosRef.current[itemId];
    if (!start) return;

    // If pointer moves more than 8px, user is dragging/scrolling -> cancel long press
    const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (distance > 8 && longPressTimerRef.current[itemId]) {
      clearTimeout(longPressTimerRef.current[itemId]);
      delete longPressTimerRef.current[itemId];
    }
  };

  const handlePointerUp = (e: React.PointerEvent, item: ScreenDefinition, targetEl: HTMLElement) => {
    // Clear long press timer
    if (longPressTimerRef.current[item.id]) {
      clearTimeout(longPressTimerRef.current[item.id]);
      delete longPressTimerRef.current[item.id];
    }

    // If long press already fired, do not trigger short press
    if (longPressTriggeredRef.current[item.id]) {
      longPressTriggeredRef.current[item.id] = false;
      return;
    }

    // Check pointer distance to avoid triggering on drag cancel
    const start = pointerStartPosRef.current[item.id];
    if (start) {
      const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (distance > 8) return;
    }

    // Short Press Execution
    if (item.id === 'home') {
      closeQuickAccess();
      setActiveView('home');
      return;
    }

    const hasQuickAccess = item.quickAccessComponent && item.quickAccessComponent !== 'none';
    if (hasQuickAccess) {
      const rect = targetEl.getBoundingClientRect();
      toggleQuickAccess(item.id, {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    } else {
      closeQuickAccess();
      setActiveView(item.id);
    }
  };

  const handlePointerCancel = (itemId: string) => {
    if (longPressTimerRef.current[itemId]) {
      clearTimeout(longPressTimerRef.current[itemId]);
      delete longPressTimerRef.current[itemId];
    }
    longPressTriggeredRef.current[itemId] = false;
  };

  return (
    <div
      id="mockpit-bottom-dock"
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

        const hasQuickAccess = Boolean(item.quickAccessComponent && item.quickAccessComponent !== 'none');
        const isQuickAccessOwner = Boolean(activeQuickAccess?.isOpen && activeQuickAccess.screenId === item.id);
        const isItemActive = isQuickAccessOwner || (isActive && !activeQuickAccess?.isOpen);

        const canMoveLeft = isEditor && !isHome && index > 1; // index 0 is Home
        const canMoveRight = isEditor && !isHome && index < topLevelScreens.length - 1;

        return (
          <div
            id={`dock-item-${item.id}`}
            key={item.id}
            draggable={isEditor && !isHome}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={() => setDraggedId(null)}
            onPointerDown={(e) => handlePointerDown(e, item)}
            onPointerMove={(e) => handlePointerMove(e, item.id)}
            onPointerUp={(e) => handlePointerUp(e, item, e.currentTarget)}
            onPointerCancel={() => handlePointerCancel(item.id)}
            onPointerLeave={() => handlePointerCancel(item.id)}
            aria-haspopup={hasQuickAccess ? 'dialog' : undefined}
            aria-expanded={hasQuickAccess ? isQuickAccessOwner : undefined}
            style={{
              color: isItemActive ? 'var(--color-primary)' : undefined,
              borderColor: isItemActive ? 'var(--color-primary)' : 'transparent',
              boxShadow: isItemActive
                ? isQuickAccessOwner
                  ? '0 0 16px color-mix(in srgb, var(--color-primary) 50%, transparent)'
                  : '0 0 12px color-mix(in srgb, var(--color-primary) 30%, transparent)'
                : undefined,
            }}
            className={`mockpit-dock-item flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors duration-150 relative group cursor-pointer select-none border ${
              isItemActive
                ? 'bg-slate-800/90 text-slate-100'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            } ${isDragging ? 'opacity-40 border-dashed border-sky-400' : ''}`}
            title={
              isEditor && !isHome
                ? `${item.name} (Short press: Quick Access / Switch, Long press: Full screen, Drag to reorder)`
                : hasQuickAccess
                ? `${item.name} (Short press: Quick Access, Long press: Full screen)`
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
              <span className="absolute -top-1.5 left-1 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <GripVertical className="w-2.5 h-2.5" />
              </span>
            )}

            <Icon
              className="w-4 h-4 transition-colors"
              style={{ color: isItemActive ? 'var(--color-primary)' : undefined }}
            />
            <span className="text-[0.5625rem] font-bold tracking-wider uppercase font-mono max-w-[80px] truncate leading-none">
              {item.name}
            </span>

            {/* Active Pill Indicator (Dock Active State) - Placed inside item padding to avoid any layout protrusion */}
            {isItemActive && (
              <span
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full pointer-events-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  boxShadow: isQuickAccessOwner
                    ? '0 0 8px var(--color-primary)'
                    : '0 0 6px var(--color-primary)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
