import React from 'react';
import { ComponentInstance } from '../../types';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ComponentHeader, DEFAULT_COMPONENT_LABELS } from '../ComponentRenderer';
import { getBorderClasses } from '../../utils/borderOverrides';
import { CruiseControlIcon } from '../../config/componentMeta';

interface CruiseControlWidgetProps {
  component: ComponentInstance;
  resolved?: Record<string, any>;
  isSelected?: boolean;
  isPresentation?: boolean;
  customColor?: string;
  baseOpacity?: string;
  styleOpacity?: number;
}

const CruiseIcon: React.FC<{ size: number; className?: string }> = ({ size, className = '' }) => (
  <CruiseControlIcon
    className={className}
    style={{ width: size, height: size }}
  />
);

export const CruiseControlWidget: React.FC<CruiseControlWidgetProps> = ({
  component,
  resolved = {} as Record<string, any>,
  isSelected,
  isPresentation,
  customColor = 'var(--color-ds-primary)',
  baseOpacity = 'opacity-100',
  styleOpacity = 1,
}) => {
  const primaryAccent = customColor || 'var(--color-ds-primary)';
  const screenMode = useMockpitStore((s) => s.screenMode);
  const isPresenting = isPresentation || screenMode === 'presentation';
  const vehicleState = useMockpitStore((s) => s.vehicleState);
  const setVehicleState = useMockpitStore((s) => s.setVehicleState);
  const selectComponent = useMockpitStore((s) => s.selectComponent);
  const isActive = vehicleState.cruiseControlActive === true;

  const dragPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const headerLabel = resolved?.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.cruiseControl;

  const componentWidth = component.width ?? 320;
  const componentHeight = component.height ?? 160;

  const isUltraCompact = componentHeight < 85 || componentWidth < 180;
  const isCompact = componentHeight < 120 || componentWidth < 220;

  const showLabel = componentWidth >= 150;
  const iconOnly = !showLabel;
  const padPx = iconOnly ? 0 : isUltraCompact ? 8 : isCompact ? 10 : 14;
  const innerH = Math.max(0, componentHeight - padPx * 2 - 2);
  const baseIconPx = isCompact || isUltraCompact ? 32 : 44;
  const iconPx = iconOnly
    ? Math.max(12, Math.min(baseIconPx, Math.min(componentWidth, componentHeight) - 10))
    : Math.max(12, Math.min(baseIconPx, innerH - 6));
  const btnMinH = Math.min(isCompact || isUltraCompact ? 44 : 56, innerH);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPresenting) {
      e.stopPropagation();
    } else {
      dragPosRef.current = { x: e.clientX, y: e.clientY };
      // Allow event to bubble to Canvas wrapper so drag/move and selection activate
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPresenting) {
      selectComponent(component.id);
      if (dragPosRef.current) {
        const dist = Math.hypot(e.clientX - dragPosRef.current.x, e.clientY - dragPosRef.current.y);
        dragPosRef.current = null;
        if (dist > 5) {
          // Dragged to move component; do not toggle
          return;
        }
      }
    }
    if (vehicleState.gear !== 'D') return;
    setVehicleState({ cruiseControlActive: !isActive });
  };

  const rootBorderColor = isSelected
    ? customColor
    : iconOnly && isActive
    ? primaryAccent
    : undefined;

  return (
    <div
      data-component-type="cruiseControl"
      onClick={(e) => {
        if (!isPresenting) {
          e.stopPropagation();
          selectComponent(component.id);
        }
      }}
      className={`w-full h-full rounded-2xl bg-ds-surface/90 ${getBorderClasses(component.borderOverrides)} flex flex-col justify-between shadow-lg backdrop-blur-md relative select-none overflow-visible ${
        iconOnly ? 'p-0' : isUltraCompact ? 'p-2' : isCompact ? 'p-2.5' : 'p-3.5'
      } ${baseOpacity}`}
      style={{
        borderColor: rootBorderColor,
        opacity: styleOpacity,
      }}
    >
      {iconOnly ? (
        <button
          type="button"
          aria-pressed={isActive}
          aria-label="Cruise control"
          title="Toggle cruise control"
          onMouseDown={handleMouseDown}
          onClick={handleToggle}
          className="w-full h-full flex items-center justify-center rounded-2xl cursor-pointer"
        >
          <CruiseIcon
            size={iconPx}
            className={`${
              isCompact || isUltraCompact ? 'w-8 h-8' : 'w-11 h-11'
            } ${isActive ? 'text-ds-primary' : 'text-ds-content-subtle'}`}
          />
        </button>
      ) : (
        <>
          {/* Component Header (shown when space allows) */}
          {!isUltraCompact && (
            <ComponentHeader
              type="cruiseControl"
              label={headerLabel}
              customColor={customColor}
              hidden={component.staticProps?.showHeader === 'false'}
            />
          )}

          {/* Main Cruise Control Toggle */}
          <div className="relative my-auto w-full flex flex-col items-center">
            <button
              type="button"
              aria-pressed={isActive}
              aria-label="Cruise control"
              title="Toggle cruise control"
              onMouseDown={handleMouseDown}
              onClick={handleToggle}
              style={{ minHeight: btnMinH }}
              className={`w-full flex items-center justify-center gap-3 rounded-xl border cursor-pointer overflow-hidden min-w-0 ${
                isActive
                  ? 'bg-ds-surface-raised/80 border-ds-primary'
                  : 'bg-ds-surface-raised/80 border-ds-line/60'
              }`}
            >
              <CruiseIcon
                size={iconPx}
                className={`${
                  isCompact || isUltraCompact ? 'w-8 h-8' : 'w-11 h-11'
                } ${isActive ? 'text-ds-primary' : 'text-ds-content-subtle'}`}
              />
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-ds-primary' : 'bg-ds-content-subtle'
                  }`}
                />
                <span
                  className={`text-sm font-bold tracking-wider ${
                    isActive ? 'text-ds-content' : 'text-ds-content-muted'
                  }`}
                >
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
