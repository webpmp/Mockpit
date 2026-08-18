import React, { useState, useEffect } from 'react';
import { ComponentInstance } from '../../types';
import { DEFAULT_EXPLODED_VEHICLE_IMAGE } from '../../data/defaultExplodedVehicle';
import { processImageBackgroundRemoval } from '../../utils/imageBackgroundRemover';
import { setCachedNaturalDimensions } from '../../utils/imageContentRect';

interface VehicleExplodedViewWidgetProps {
  component: ComponentInstance;
  resolved: Record<string, string>;
  isSelected?: boolean;
  isPresentation?: boolean;
  customColor?: string;
  baseOpacity?: string;
  styleOpacity?: number;
}

export const VehicleExplodedViewWidget: React.FC<VehicleExplodedViewWidgetProps> = ({
  component,
  resolved,
  isSelected,
  isPresentation,
  customColor = '#38bdf8',
  baseOpacity = 'opacity-100',
  styleOpacity = 1,
}) => {
  const rawImageUrl = resolved.imageUrl || component.staticProps.imageUrl || DEFAULT_EXPLODED_VEHICLE_IMAGE;
  const label = resolved.label || component.staticProps.label || 'Vehicle Exploded View';
  const removeBg = component.staticProps.removeBg !== 'false';
  const tolerance = parseInt(component.staticProps.bgTolerance || '25', 10);

  const [displayUrl, setDisplayUrl] = useState<string>(rawImageUrl);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    // Reset natural size when source image URL changes to prevent stale calculations
    setNaturalSize(null);

    if (!removeBg) {
      setDisplayUrl(rawImageUrl);
      return;
    }

    let isMounted = true;
    processImageBackgroundRemoval(rawImageUrl, tolerance).then((keyedUrl) => {
      if (isMounted) {
        setDisplayUrl(keyedUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rawImageUrl, removeBg, tolerance]);

  return (
    <div
      className={`w-full h-full rounded-2xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-md overflow-hidden relative flex flex-col select-none transition-shadow ${baseOpacity} ${
        isSelected ? 'ring-1 ring-sky-400/40 shadow-[0_0_25px_rgba(56,189,248,0.15)]' : 'shadow-lg'
      }`}
      style={{ opacity: styleOpacity }}
    >
      {/* Header Tag / Minimal Watermark */}
      <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: customColor }}
        />
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400/90 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800/80 shadow-xs">
          {label}
        </span>
      </div>

      {/* Exploded View Image Canvas Container */}
      <div className="relative w-full h-full flex items-center justify-center p-1 bg-gradient-to-b from-slate-950/40 via-slate-900/20 to-slate-950/60 overflow-hidden">
        <img
          src={displayUrl}
          alt={label}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain pointer-events-none transition-transform duration-200"
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              const dimensions = { w: img.naturalWidth, h: img.naturalHeight };
              setNaturalSize(dimensions);
              setCachedNaturalDimensions(rawImageUrl, dimensions);
              if (displayUrl !== rawImageUrl) {
                setCachedNaturalDimensions(displayUrl, dimensions);
              }
            }
          }}
        />
      </div>
    </div>
  );
};


