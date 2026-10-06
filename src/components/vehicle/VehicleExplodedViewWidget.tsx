import React, { useState, useEffect } from 'react';
import { ComponentInstance } from '../../types';
import { DEFAULT_EXPLODED_VEHICLE_IMAGE } from '../../data/defaultExplodedVehicle';
import { processImageBackgroundRemoval } from '../../utils/imageBackgroundRemover';
import { setCachedNaturalDimensions } from '../../utils/imageContentRect';
import { getBorderClasses } from '../../utils/borderOverrides';

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
  customColor = 'var(--color-ds-primary)',
  baseOpacity = 'opacity-100',
  styleOpacity = 1,
}) => {
  const rawImageUrl = resolved.imageUrl || component.staticProps.imageUrl || DEFAULT_EXPLODED_VEHICLE_IMAGE;
  const label = resolved.label || component.staticProps.label || 'Vehicle Exploded View';
  const removeBg = component.staticProps.removeBg !== 'false';
  const tolerance = parseInt(component.staticProps.bgTolerance || '25', 10);
  const edgeSoftness = parseInt(component.staticProps.bgEdgeSoftness || '0', 10);

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
    processImageBackgroundRemoval(rawImageUrl, tolerance, edgeSoftness).then((keyedUrl) => {
      if (isMounted) {
        setDisplayUrl(keyedUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rawImageUrl, removeBg, tolerance, edgeSoftness]);

  return (
    <div
      className={`w-full h-full rounded-2xl bg-ds-background/80 ${getBorderClasses(component.borderOverrides, 'border-ds-line-subtle/90')} backdrop-blur-md overflow-hidden relative flex flex-col select-none transition-shadow ${baseOpacity} ${
        isSelected ? 'ring-1 ring-ds-primary/40 shadow-[0_0_25px_color-mix(in_srgb,var(--color-ds-primary)_15%,transparent)]' : 'shadow-lg'
      }`}
      style={{ opacity: styleOpacity }}
    >
      {/* Header Tag / Minimal Watermark */}
      <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: customColor }}
        />
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-ds-content-muted/90 bg-ds-surface/90 px-2 py-0.5 rounded border border-ds-line-subtle/80 shadow-xs">
          {label}
        </span>
      </div>

      {/* Exploded View Image Canvas Container */}
      <div className="relative w-full h-full flex items-center justify-center p-1 bg-gradient-to-b from-ds-background/40 via-ds-surface/20 to-ds-background/60 overflow-hidden">
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


