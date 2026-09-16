import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';

export const PEEK_PX = 44;
export const DRAG_THRESHOLD_FRACTION = 0.18;

export interface WeatherCarouselProps {
  pages: React.ReactNode[];
  initialIndex?: number;
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function WeatherCarousel({
  pages,
  initialIndex = 0,
  activeIndex: controlledIndex,
  onIndexChange,
}: WeatherCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [internalIndex, setInternalIndex] = useState(initialIndex);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  const [pageWidth, setPageWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const hasDraggedRef = useRef(false);

  // Sync internal index if initialIndex changes
  useEffect(() => {
    if (controlledIndex === undefined) {
      setInternalIndex(initialIndex);
    }
  }, [initialIndex, controlledIndex]);

  useLayoutEffect(() => {
    const measure = () => {
      const vw = viewportRef.current?.clientWidth ?? 0;
      setPageWidth(vw > PEEK_PX ? vw - PEEK_PX : vw);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  // For 2-page carousel:
  // activeIndex = 0 (Weather): translate = 0. Shows [0, viewportWidth) = all of page 0 + PEEK_PX of page 1 on right.
  // activeIndex = 1 (Radar): translate = -(pageWidth - PEEK_PX). Shows PEEK_PX of page 0 on left + all of page 1.
  const baseTranslate = activeIndex === 0 ? 0 : -(pageWidth - PEEK_PX);
  const translate = isDragging ? baseTranslate + dragOffset : baseTranslate;

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(pages.length - 1, index));
      if (controlledIndex === undefined) {
        setInternalIndex(clamped);
      }
      onIndexChange?.(clamped);
    },
    [pages.length, controlledIndex, onIndexChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartX.current = e.clientX;
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    let dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 6) hasDraggedRef.current = true;
    // Boundary dampening
    if ((activeIndex === 0 && dx > 0) || (activeIndex === pages.length - 1 && dx < 0)) {
      dx = dx * 0.35;
    }
    setDragOffset(dx);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -pageWidth * DRAG_THRESHOLD_FRACTION) goTo(activeIndex + 1);
    else if (dragOffset > pageWidth * DRAG_THRESHOLD_FRACTION) goTo(activeIndex - 1);
    setDragOffset(0);
  };

  return (
    <div
      id="weather-carousel"
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        id="weather-carousel-track"
        className="flex h-full"
        style={{
          transform: `translateX(${translate}px)`,
          transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(.22,.61,.36,1)',
        }}
      >
        {pages.map((page, i) => (
          <div
            key={i}
            id={`weather-carousel-page-${i}`}
            className="relative h-full flex-none"
            style={{
              width: pageWidth > 0 ? pageWidth : 'calc(100% - 44px)',
              marginRight: 0,
            }}
            onClick={() => {
              if (hasDraggedRef.current) return;
              if (i !== activeIndex) goTo(i);
            }}
          >
            {page}
            {/* Peeking page tap overlay for immediate navigation */}
            {i !== activeIndex && (
              <div
                id={`weather-carousel-peek-hit-${i}`}
                className="absolute inset-0 z-30 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasDraggedRef.current) goTo(i);
                }}
                aria-label={`Switch to ${i === 0 ? 'Weather' : 'Radar'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
