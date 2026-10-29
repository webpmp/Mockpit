import React, { useState, useEffect } from 'react';
import { ComponentInstance } from '../../types';
import { processImageBackgroundRemoval } from '../../utils/imageBackgroundRemover';
import {
  getImageContentRect,
  getCachedNaturalDimensions,
  setCachedNaturalDimensions,
  getCachedArtworkBounds,
  getBeforeImageLayout,
  DEFAULT_BEFORE_NATURAL,
  DEFAULT_EXPLODED_ARTWORK,
  DEFAULT_BEFORE_ARTWORK,
} from '../../utils/imageContentRect';
import {
  getExplodedImageSrc,
  getBeforeImageSrc,
  isExplodedViewActive,
  DEFAULT_EXPLODED_NATURAL,
  EXPLODE_TRANSITION_MS,
} from '../../utils/explodedViewImages';
import { getBorderClasses } from '../../utils/borderOverrides';
import { DEFAULT_SHELL_BACKGROUND, useMockpitStore } from '../../store/useMockpitStore';

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

/**
 * Keyed image hook: manages background color keying per image source.
 * When removal is enabled, returns null until processing completes (avoiding white flash).
 * When removal is disabled, returns raw URL immediately.
 */
function useKeyedImage(
  src: string | null,
  removeBg: boolean,
  tolerance: number,
  edgeSoftness: number
): string | null {
  const [displayUrl, setDisplayUrl] = useState<string | null>(() => (removeBg ? null : src));

  useEffect(() => {
    if (!src) {
      setDisplayUrl(null);
      return;
    }
    if (!removeBg) {
      setDisplayUrl(src);
      return;
    }

    setDisplayUrl(null);
    let isMounted = true;
    processImageBackgroundRemoval(src, tolerance, edgeSoftness).then((keyedUrl) => {
      if (isMounted) {
        setDisplayUrl(keyedUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [src, removeBg, tolerance, edgeSoftness]);

  return displayUrl;
}

export const VehicleExplodedViewWidget: React.FC<VehicleExplodedViewWidgetProps> = ({
  component,
  resolved,
  isSelected,
  isPresentation,
  baseOpacity = 'opacity-100',
  styleOpacity = 1,
}) => {
  const explodedSrc = getExplodedImageSrc(component, resolved.imageUrl);
  const beforeSrc = getBeforeImageSrc(component);
  const hasBefore = beforeSrc !== null;

  const label = resolved.label || component.staticProps.label || 'Vehicle Exploded View';
  const customBgColor = resolved.backgroundColor || component.staticProps.backgroundColor;
  const hasCustomBg = Boolean(customBgColor);

  // Exploded image background removal settings
  const removeBg = component.staticProps.removeBg !== 'false';
  const tolerance = parseInt(component.staticProps.bgTolerance || '25', 10);
  const edgeSoftness = parseInt(component.staticProps.bgEdgeSoftness || '0', 10);

  // Before image background removal settings
  const beforeRemoveBg = component.staticProps.beforeRemoveBg !== 'false';
  const beforeTolerance = parseInt(component.staticProps.beforeBgTolerance || '25', 10);
  const beforeEdgeSoftness = parseInt(component.staticProps.beforeBgEdgeSoftness || '0', 10);

  const explodedDisplayUrl = useKeyedImage(explodedSrc, removeBg, tolerance, edgeSoftness);
  const beforeDisplayUrl = useKeyedImage(beforeSrc, beforeRemoveBg, beforeTolerance, beforeEdgeSoftness);

  // Natural dimensions and authoritative frame box (derived from exploded image geometry)
  const natural = getCachedNaturalDimensions(explodedSrc) ?? DEFAULT_EXPLODED_NATURAL;
  const frame = getImageContentRect(
    { x: 0, y: 0, width: component.width, height: component.height },
    natural,
    4
  );

  // Before image natural dimensions, artwork bounds, and scaled alignment layout
  const beforeNatural = (beforeSrc ? getCachedNaturalDimensions(beforeSrc) : null) ?? DEFAULT_BEFORE_NATURAL;
  const explodedArtwork = getCachedArtworkBounds(explodedSrc) ?? DEFAULT_EXPLODED_ARTWORK;
  const beforeArtwork = (beforeSrc ? getCachedArtworkBounds(beforeSrc) : null) ?? DEFAULT_BEFORE_ARTWORK;

  const beforeLayout = getBeforeImageLayout(
    frame,
    natural,
    beforeNatural,
    explodedArtwork,
    beforeArtwork
  );

  // Callout selection derivation in Presentation mode vs Editor preview state
  const calloutActive = useMockpitStore((s) =>
    isExplodedViewActive(
      component.id,
      s.activePresentationCalloutId,
      s.componentsByScreen[s.activeView] ?? s.components
    )
  );

  const showExploded =
    !hasBefore ||
    (isPresentation ? calloutActive : component.staticProps.editorPreview !== 'before');

  return (
    <div
      className={`w-full h-full rounded-2xl bg-ds-background/80 ${getBorderClasses(
        component.borderOverrides,
        'border-ds-line-subtle/90'
      )} backdrop-blur-md overflow-hidden relative flex flex-col select-none transition-shadow ${baseOpacity} ${
        isSelected
          ? 'ring-1 ring-ds-primary/40 shadow-[0_0_25px_color-mix(in_srgb,var(--color-ds-primary)_15%,transparent)]'
          : 'shadow-lg'
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
        {/* Absolutely positioned frame whose box equals the exploded image content rect */}
        <div
          data-testid="exploded-frame"
          className="absolute"
          style={{
            left: frame.x,
            top: frame.y,
            width: frame.width,
            height: frame.height,
          }}
        >
          {/* Exploded Layer - Authoritative baseline, untouched scale/position/containment */}
          {explodedDisplayUrl && (
            <img
              data-testid="exploded-layer"
              src={explodedDisplayUrl}
              alt={showExploded ? label : undefined}
              aria-hidden={!showExploded}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity motion-reduce:transition-none"
              style={{
                opacity: showExploded ? 1 : 0,
                transitionDuration: `${EXPLODE_TRANSITION_MS}ms`,
                transitionTimingFunction: 'ease-in-out',
              }}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  const dimensions = { w: img.naturalWidth, h: img.naturalHeight };
                  if (explodedDisplayUrl === explodedSrc) {
                    setCachedNaturalDimensions(explodedSrc, dimensions);
                  }
                  setCachedNaturalDimensions(explodedDisplayUrl, dimensions);
                }
              }}
            />
          )}

          {/* Before Layer (mounted only if before state exists) - Scaled & centered to match exploded vehicle */}
          {hasBefore && beforeDisplayUrl && (
            <img
              data-testid="before-layer"
              src={beforeDisplayUrl}
              alt={!showExploded ? `${label} (Standard)` : undefined}
              aria-hidden={showExploded}
              referrerPolicy="no-referrer"
              className="absolute pointer-events-none transition-opacity motion-reduce:transition-none"
              style={{
                left: beforeLayout.left,
                top: beforeLayout.top,
                width: beforeLayout.width,
                height: beforeLayout.height,
                objectFit: 'contain',
                opacity: showExploded ? 0 : 1,
                transitionDuration: `${EXPLODE_TRANSITION_MS}ms`,
                transitionTimingFunction: 'ease-in-out',
              }}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  const dimensions = { w: img.naturalWidth, h: img.naturalHeight };
                  if (beforeSrc && beforeDisplayUrl === beforeSrc) {
                    setCachedNaturalDimensions(beforeSrc, dimensions);
                  }
                  setCachedNaturalDimensions(beforeDisplayUrl, dimensions);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
