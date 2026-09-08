import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useMockpitStore } from '../store/useMockpitStore';
import { ComponentInstance } from '../types';
import { ComponentRenderer } from './ComponentRenderer';
import {
  getDefaultQuickAccessDimensions,
  getDefaultQuickAccessStaticProps,
  getDefaultQuickAccessBindings,
} from '../config/quickAccessConfig';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { Maximize2 } from 'lucide-react';

export const QuickAccessOverlay: React.FC = () => {
  const activeQuickAccess = useMockpitStore((s) => s.activeQuickAccess);
  const closeQuickAccess = useMockpitStore((s) => s.closeQuickAccess);
  const screens = useMockpitStore((s) => s.screens);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);
  const vehicleState = useMockpitStore((s) => s.vehicleState);
  const updateScreenQuickAccessSize = useMockpitStore((s) => s.updateScreenQuickAccessSize);
  const screenMode = useMockpitStore((s) => s.screenMode);
  const selectedComponentId = useMockpitStore((s) => s.selectedComponentId);
  const selectComponent = useMockpitStore((s) => s.selectComponent);

  const isEditor = screenMode === 'editor';

  const overlayRef = useRef<HTMLDivElement>(null);
  const [dockCenterCanvasX, setDockCenterCanvasX] = useState<number>(CANVAS_WIDTH / 2);

  // Visual resizing state
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeDimensions, setResizeDimensions] = useState<{ width: number; height: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const currentScreen = useMemo(() => {
    if (!activeQuickAccess?.screenId) return null;
    return screens.find((s) => s.id === activeQuickAccess.screenId) || null;
  }, [screens, activeQuickAccess?.screenId]);

  const defaultDim = useMemo(() => {
    if (!activeQuickAccess?.componentType) return { width: 500, height: 280 };
    return getDefaultQuickAccessDimensions(activeQuickAccess.componentType);
  }, [activeQuickAccess?.componentType]);

  const configuredWidth = currentScreen?.quickAccessWidth || defaultDim.width;
  const configuredHeight = currentScreen?.quickAccessHeight || defaultDim.height;

  const currentWidth = resizeDimensions?.width ?? configuredWidth;
  const currentHeight = resizeDimensions?.height ?? configuredHeight;

  // Calculate and update dock item horizontal position in canvas coordinate space
  useEffect(() => {
    if (!activeQuickAccess?.isOpen || !activeQuickAccess.screenId) return;

    const updateAnchor = () => {
      const dockItemEl = document.getElementById(`dock-item-${activeQuickAccess.screenId}`);
      const canvasEl = document.querySelector('.vehicle-hmi-canvas') as HTMLElement | null;

      if (dockItemEl && canvasEl) {
        const canvasRect = canvasEl.getBoundingClientRect();
        const itemRect = dockItemEl.getBoundingClientRect();
        const scale = canvasRect.width / CANVAS_WIDTH;
        if (scale > 0) {
          const itemCenterX = (itemRect.left + itemRect.width / 2 - canvasRect.left) / scale;
          setDockCenterCanvasX(itemCenterX);
          return;
        }
      }
      setDockCenterCanvasX(CANVAS_WIDTH / 2);
    };

    updateAnchor();
    const timer = setTimeout(updateAnchor, 50);
    window.addEventListener('resize', updateAnchor);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateAnchor);
    };
  }, [activeQuickAccess?.isOpen, activeQuickAccess?.screenId]);

  // Outside click dismissal handler (preserves dock button clicks)
  useEffect(() => {
    if (!activeQuickAccess?.isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      // If currently dragging to resize, do not dismiss
      if (resizeStartRef.current) return;

      const overlayEl = overlayRef.current;
      if (!overlayEl) return;

      const target = e.target as HTMLElement | null;

      // Inside overlay click: do not dismiss
      if (overlayEl.contains(target as Node)) {
        return;
      }

      // Dock button click: let dock handle it immediately
      if (target && target.closest('.mockpit-dock-item')) {
        return;
      }

      // Outside click: dismiss
      closeQuickAccess();
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [activeQuickAccess?.isOpen, closeQuickAccess]);

  // Handle visual resizing (Interaction-layer guard: strictly EDITOR mode only)
  const handleResizeStart = (e: React.PointerEvent) => {
    // Guard at interaction layer: editing/resizing is disallowed in PRESENTATION mode
    if (!isEditor) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const canvasEl = document.querySelector('.vehicle-hmi-canvas') as HTMLElement | null;
    let scale = 1;
    if (canvasEl) {
      const canvasRect = canvasEl.getBoundingClientRect();
      scale = canvasRect.width / CANVAS_WIDTH;
    }

    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: currentWidth,
      startH: currentHeight,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = (moveEvent.clientX - resizeStartRef.current.startX) / scale;
      const deltaY = (moveEvent.clientY - resizeStartRef.current.startY) / scale;

      const minOverlayW = activeQuickAccess.componentType === 'overheadVisualization' ? 400 : 260;
      const newWidth = Math.round(Math.max(minOverlayW, Math.min(CANVAS_WIDTH - 48, resizeStartRef.current.startW + deltaX)));
      const newHeight = Math.round(Math.max(120, Math.min(CANVAS_HEIGHT - 180, resizeStartRef.current.startH + deltaY)));

      setResizeDimensions({ width: newWidth, height: newHeight });
    };

    const handlePointerUp = () => {
      if (resizeStartRef.current && currentScreen) {
        setResizeDimensions((prev) => {
          if (prev) {
            updateScreenQuickAccessSize(currentScreen.id, prev.width, prev.height);
          }
          return null;
        });
      }
      setIsResizing(false);
      resizeStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  if (!activeQuickAccess?.isOpen || !currentScreen) {
    return null;
  }

  // Positioning math
  const margin = 24;
  const targetLeft = dockCenterCanvasX - currentWidth / 2;
  const minLeft = margin;
  const maxLeft = CANVAS_WIDTH - currentWidth - margin;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft));

  // Caret offset relative to overlay left edge
  const rawCaretOffset = dockCenterCanvasX - clampedLeft;
  const caretOffset = Math.max(24, Math.min(currentWidth - 24, rawCaretOffset));

  // Build component instance to render
  const screenComponents = componentsByScreen[currentScreen.id] || [];
  const existingInstance = screenComponents.find((c) => c.type === activeQuickAccess.componentType);

  const componentInstance: ComponentInstance = {
    id: existingInstance ? existingInstance.id : `qa-${currentScreen.id}-${activeQuickAccess.componentType}`,
    type: activeQuickAccess.componentType,
    x: 0,
    y: 0,
    width: currentWidth,
    height: currentHeight,
    staticProps: existingInstance?.staticProps || getDefaultQuickAccessStaticProps(activeQuickAccess.componentType),
    bindings: existingInstance?.bindings || getDefaultQuickAccessBindings(activeQuickAccess.componentType),
  };

  const isComponentSelectedInEditor = isEditor && selectedComponentId === componentInstance.id;

  return (
    <div
      id="quick-access-overlay"
      ref={overlayRef}
      className="absolute z-[9990] select-none pointer-events-auto transition-shadow animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: `${clampedLeft}px`,
        bottom: '92px',
        width: `${currentWidth}px`,
        height: `${currentHeight}px`,
      }}
      onClick={() => {
        if (isEditor) {
          selectComponent(componentInstance.id);
        }
      }}
    >
      {/* Overlay Outer Shell */}
      <div
        className="w-full h-full relative rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
      >
        {/* Rendered Component Content */}
        <div className="w-full h-full relative overflow-hidden flex-1">
          <ComponentRenderer
            component={componentInstance}
            vehicleState={vehicleState}
            isSelected={isComponentSelectedInEditor}
            isPresentation={!isEditor}
          />
        </div>
      </div>

      {/* Editor-Only Selection Box & Resize Handle (Strictly active in EDITOR mode) */}
      {isEditor && (
        <>
          {isComponentSelectedInEditor && (
            <div
              className="absolute inset-0 border-2 rounded-2xl pointer-events-none z-[9992]"
              style={{
                borderColor: 'var(--color-primary, #38bdf8)',
                boxShadow: '0 0 15px color-mix(in srgb, var(--color-primary, #38bdf8) 40%, transparent)',
              }}
            />
          )}

          {/* Resize Handle - visible and interactive ONLY in editor mode */}
          <div
            id="quick-access-resize-handle"
            onPointerDown={handleResizeStart}
            className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-slate-900 cursor-nwse-resize pointer-events-auto flex items-center justify-center text-slate-950 hover:scale-125 transition-transform z-[9996] select-none shadow-md"
            style={{ backgroundColor: 'var(--color-primary, #38bdf8)' }}
            title="Drag to resize Quick Access component"
          >
            <Maximize2 className="w-3 h-3" />
          </div>

          {/* Live Dimensions Tooltip during editor resize */}
          {isResizing && (
            <div className="absolute top-2 right-2 bg-sky-950/90 border border-sky-500/40 text-sky-200 text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none z-[9996]">
              {currentWidth} × {currentHeight}
            </div>
          )}
        </>
      )}

      {/* Downward Anchor Caret: Layered tooltip attachment with parent border mask and 2:1 proportional caret */}
      <div
        id="quick-access-caret"
        className="absolute -translate-x-1/2 pointer-events-none z-[9994]"
        style={{
          left: `${caretOffset}px`,
          bottom: '-17px',
          width: '36px',
          height: '20px',
          ['--quick-access-surface' as string]: 'rgba(15, 23, 42, 0.9)',
          ['--quick-access-border' as string]: isComponentSelectedInEditor ? 'var(--color-primary, #38bdf8)' : '#1e293b',
        }}
      >
        {/* Mask that covers the parent's bottom border */}
        <div
          className="absolute top-0 left-0 w-full"
          style={{
            height: '3px',
            background: 'var(--quick-access-surface)',
          }}
        />
        {/* Visible caret */}
        <svg
          viewBox="0 0 36 18"
          className="absolute top-0 left-0 w-full h-[18px] block"
          overflow="visible"
        >
          {/* Interior */}
          <path
            d="M 0,0 L 36,0 L 18,18 Z"
            fill="var(--quick-access-surface)"
          />
          {/* ONLY diagonal borders */}
          <path
            d="M 0,0 L 18,18 L 36,0"
            fill="none"
            stroke="var(--quick-access-border)"
            strokeWidth={isComponentSelectedInEditor ? 2 : 1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
