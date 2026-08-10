import React from 'react';
import { useMockpitStore } from '../store/useMockpitStore';
import { VehicleBackgroundPosition } from '../types';

const POSITION_CLASSES: Record<VehicleBackgroundPosition, string> = {
  'top-left': 'items-start justify-start',
  'top-center': 'items-start justify-center',
  'top-right': 'items-start justify-end',
  'center-left': 'items-center justify-start',
  'center': 'items-center justify-center',
  'center-right': 'items-center justify-end',
  'bottom-left': 'items-end justify-start',
  'bottom-center': 'items-end justify-center',
  'bottom-right': 'items-end justify-end',
};

const TRANSFORM_ORIGIN: Record<VehicleBackgroundPosition, string> = {
  'top-left': 'top left',
  'top-center': 'top center',
  'top-right': 'top right',
  'center-left': 'center left',
  'center': 'center center',
  'center-right': 'center right',
  'bottom-left': 'bottom left',
  'bottom-center': 'bottom center',
  'bottom-right': 'bottom right',
};

export const VehicleBackground: React.FC = () => {
  const vehicleBackground = useMockpitStore((s) => s.vehicleBackground);
  const activePalette = useMockpitStore((s) => s.activePalette);
  const gridConfig = useMockpitStore((s) => s.gridConfig);

  if (!vehicleBackground || !vehicleBackground.enabled || !vehicleBackground.vehicle) {
    return null;
  }

  const { vehicle, opacity, blur, position, scale, blendMode } = vehicleBackground;

  // Always resolve to processed vehicle asset in /vehicles/processed/
  const displayVehicle = vehicle.includes('/vehicles/processed/')
    ? vehicle
    : vehicle.replace('/vehicles/', '/vehicles/processed/');

  // Capped opacity: default 8%, allowed range 0% to 15%
  const opacityVal = Math.max(0, Math.min(0.15, (opacity ?? 8) / 100));

  // Blur radius in px (default 0px, allowed range 0px - 12px)
  const blurVal = Math.max(0, Math.min(20, blur ?? 0));

  // User scale modifier: 100% setting = 1.0
  const userScaleRatio = (scale ?? 100) / 100;
  // Base scale ~1.35 to fit comfortably within the canvas with ~10-15% edge margins
  const baseScaleVal = 1.35 * userScaleRatio;

  // Dynamically resolve active canvas theme color for vehicle tinting
  const tintColor = activePalette?.primary || gridConfig?.color || '#38bdf8';

  const positionClass = POSITION_CLASSES[position] || POSITION_CLASSES['center'];
  const transformOrigin = TRANSFORM_ORIGIN[position] || TRANSFORM_ORIGIN['center'];

  // Resolved blend mode
  const resolvedBlendMode =
    blendMode === 'multiply'
      ? 'multiply'
      : blendMode === 'normal'
      ? 'normal'
      : 'multiply';

  // SVG filter ID for crisp GPU theme tinting
  const filterId = 'mockpit-vehicle-tint-filter';

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-[1] overflow-hidden flex ${positionClass} p-8 sm:p-12`}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* SVG filter definition to map image grayscale values to theme color */}
      <svg className="absolute w-0 h-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0      0      0      1 0"
              result="gray"
            />
            <feFlood floodColor={tintColor} floodOpacity="1" result="themeColor" />
            <feBlend in="themeColor" in2="gray" mode="multiply" result="tinted" />
            <feComposite in="tinted" in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* Bounded vehicle container (~72% max canvas size) ensuring comfortable edge margins */}
      <div
        className="relative w-[72%] h-[72%] max-w-full max-h-full flex items-center justify-center pointer-events-none transition-all duration-300"
        style={{
          opacity: opacityVal,
          transform: `scale(${baseScaleVal})`,
          transformOrigin,
          pointerEvents: 'none',
        }}
      >
        {/* Crisp original source vehicle PNG with GPU theme tinting and object-fit: contain */}
        <img
          src={displayVehicle}
          alt="Vehicle Background Silhouette"
          className="w-full h-full object-contain pointer-events-none select-none transition-all duration-300"
          style={{
            filter: blurVal > 0 ? `url(#${filterId}) blur(${blurVal}px)` : `url(#${filterId})`,
            mixBlendMode: resolvedBlendMode,
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};




