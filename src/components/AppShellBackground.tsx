import React, { useRef, useEffect } from 'react';
import { useMockpitStore } from '../store/useMockpitStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { Sliders, Check, Move, ZoomIn, X } from 'lucide-react';

interface AppShellBackgroundProps {
  canvasScale: number;
}

export const AppShellBackground: React.FC<AppShellBackgroundProps> = ({ canvasScale }) => {
  const backgroundMode = useMockpitStore((s) => s.backgroundMode);
  const backgroundColor = useMockpitStore((s) => s.backgroundColor);
  const backgroundImage = useMockpitStore((s) => s.backgroundImage);
  const backgroundImageScale = useMockpitStore((s) => s.backgroundImageScale);
  const backgroundImagePositionX = useMockpitStore((s) => s.backgroundImagePositionX);
  const backgroundImagePositionY = useMockpitStore((s) => s.backgroundImagePositionY);
  const isAdjustingBackground = useMockpitStore((s) => s.isAdjustingBackground);
  const setIsAdjustingBackground = useMockpitStore((s) => s.setIsAdjustingBackground);
  const setAppShellBackground = useMockpitStore((s) => s.setAppShellBackground);
  const cancelBackgroundAdjustment = useMockpitStore((s) => s.cancelBackgroundAdjustment);

  // Drag state for Direct Manipulation mode
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
  } | null>(null);

  // Escape key to exit adjustment mode
  useEffect(() => {
    if (!isAdjustingBackground) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAdjustingBackground(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdjustingBackground, setIsAdjustingBackground]);

  // Pointer drag events for direct manipulation
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isAdjustingBackground) return;
    e.preventDefault();
    e.stopPropagation();

    // Capture pointer to track smoothly even if cursor leaves window bounds
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: backgroundImagePositionX,
      initialPosY: backgroundImagePositionY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isAdjustingBackground || !dragStartRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const deltaPixelX = e.clientX - dragStartRef.current.startX;
    const deltaPixelY = e.clientY - dragStartRef.current.startY;

    // Convert screen pixel movement back to canvas-space units using canvasScale
    const deltaCanvasX = deltaPixelX / (canvasScale || 1);
    const deltaCanvasY = deltaPixelY / (canvasScale || 1);

    const newPosX = Math.round(dragStartRef.current.initialPosX + deltaCanvasX);
    const newPosY = Math.round(dragStartRef.current.initialPosY + deltaCanvasY);

    setAppShellBackground({
      backgroundImagePositionX: newPosX,
      backgroundImagePositionY: newPosY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isAdjustingBackground) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already released
    }
    dragStartRef.current = null;
  };

  // Wheel event for Direct Manipulation scale gesture
  const handleWheel = (e: React.WheelEvent) => {
    if (!isAdjustingBackground) return;
    e.preventDefault();
    e.stopPropagation();

    // Zoom delta: scroll up zooms in, scroll down zooms out
    const zoomFactor = e.deltaY < 0 ? 0.05 : -0.05;
    const newScale = Math.max(0.2, Math.min(5.0, Number((backgroundImageScale + zoomFactor).toFixed(2))));

    setAppShellBackground({
      backgroundImageScale: newScale,
    });
  };

  // Solid Color Mode
  if (backgroundMode === 'color') {
    return (
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-colors duration-200"
        style={{ backgroundColor: backgroundColor || '#020617' }}
      />
    );
  }

  // Vehicle Dashboard Photo Mode
  // Exact formula from requirement:
  // renderedImageScale = canvasScale * backgroundImageScale
  // renderedOffsetX     = backgroundImagePositionX * canvasScale
  // renderedOffsetY     = backgroundImagePositionY * canvasScale
  const safeScale = canvasScale || 1;
  const renderedImageScale = safeScale * backgroundImageScale;
  const renderedOffsetX = backgroundImagePositionX * safeScale;
  const renderedOffsetY = backgroundImagePositionY * safeScale;

  return (
    <div
      className={`absolute inset-0 overflow-hidden z-0 select-none ${
        isAdjustingBackground ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{
        backgroundColor: '#020617', // Fallback behind image
      }}
    >
      {/* Centered Image Container - Anchored identically to canvas center */}
      <div
        className="absolute left-1/2 top-1/2 will-change-transform transition-transform duration-75 ease-out"
        style={{
          transform: `translate(calc(-50% + ${renderedOffsetX}px), calc(-50% + ${renderedOffsetY}px)) scale(${renderedImageScale})`,
          transformOrigin: 'center center',
          width: '2560px',
          height: '1080px',
        }}
      >
        <img
          src={backgroundImage}
          alt="Vehicle Dashboard Environment"
          className="w-full h-full object-cover pointer-events-none select-none block"
          draggable={false}
        />

        {/* Subtle direct manipulation outline when adjustment mode is active */}
        {isAdjustingBackground && (
          <div className="absolute inset-0 border-2 border-dashed border-sky-400/80 rounded-xl pointer-events-none shadow-[0_0_30px_rgba(56,189,248,0.3)]">
            {/* Screen Cutout Target Aid Marker */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-sky-400/60 rounded-[32px] pointer-events-none"
              style={{
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
              }}
            >
              <div className="absolute top-3 left-4 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-400/50 text-[11px] font-mono font-bold text-sky-300">
                1920×1080 DISPLAY CUTOUT ALIGNMENT
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Direct Manipulation Status Badge & Done Button */}
      {isAdjustingBackground && (
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-3 px-4 py-2 bg-slate-900/95 border border-sky-500/60 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.8)] backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-bold font-mono text-sky-200 tracking-wider">
              ADJUSTING VEHICLE DASHBOARD
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
            <span className="flex items-center gap-1" title="Drag with mouse or trackpad to shift X/Y position">
              <Move className="w-3.5 h-3.5 text-sky-400" /> Drag to move ({backgroundImagePositionX}px, {backgroundImagePositionY}px)
            </span>
            <span className="flex items-center gap-1" title="Scroll wheel or trackpad pinch to scale">
              <ZoomIn className="w-3.5 h-3.5 text-sky-400" /> Scroll to scale ({Math.round(backgroundImageScale * 100)}%)
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* CANCEL BUTTON (formerly "Reset") */}
          <button
            onClick={() => cancelBackgroundAdjustment()}
            className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            title="Cancel: revert to position/scale from before this session and exit"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>

          <button
            onClick={() => setIsAdjustingBackground(false)}
            className="px-3 py-1 text-xs font-mono font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg shadow-md flex items-center gap-1 transition-colors cursor-pointer"
            title="Done (or press Escape)"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Done</span>
          </button>
        </div>
      )}
    </div>
  );
};
