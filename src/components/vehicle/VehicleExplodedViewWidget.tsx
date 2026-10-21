import React, { useState, useEffect } from 'react';
import { ComponentInstance } from '../../types';
import { DEFAULT_EXPLODED_VEHICLE_IMAGE } from '../../data/defaultExplodedVehicle';
import { processImageBackgroundRemoval } from '../../utils/imageBackgroundRemover';
import { setCachedNaturalDimensions } from '../../utils/imageContentRect';
import { getBorderClasses } from '../../utils/borderOverrides';
import { DEFAULT_SHELL_BACKGROUND } from '../../store/useMockpitStore';

export const DEFAULT_EXPLODED_VIEW_BG_COLOR = DEFAULT_SHELL_BACKGROUND.backgroundColor;

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
  const customBgColor = resolved.backgroundColor || component.staticProps.backgroundColor;
  const hasCustomBg = Boolean(customBgColor);

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
      {/* Exploded View Image Canvas Container */}
      <div
        className={`relative w-full h-full flex items-center justify-center p-1 overflow-hidden ${
          hasCustomBg ? '' : 'bg-gradient-to-b from-ds-background/40 via-ds-surface/20 to-ds-background/60'
        }`}
        style={hasCustomBg ? { backgroundColor: customBgColor } : undefined}
      >
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


