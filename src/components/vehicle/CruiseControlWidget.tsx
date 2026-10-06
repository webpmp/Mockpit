import React from 'react';
import { ComponentInstance } from '../../types';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ComponentHeader, DEFAULT_COMPONENT_LABELS } from '../ComponentRenderer';
import { getBorderClasses } from '../../utils/borderOverrides';

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
  <svg
    viewBox="0 0 200 200"
    fill="currentColor"
    className={`shrink-0 ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <path d="m49.957 28.711c-6.0882 0.18548-11.54 3.8277-14.043 9.3809l-2.3164 5.1387c-0.65301 1.449-1.2268 2.934-1.7188 4.4453l-1.0918 3.3535-7.9551 0.41406c-2.987 0.15618-5.3262 2.6221-5.3262 5.6133v2.3496c0 0.92296 0.74701 1.6699 1.6699 1.6699h8.373c-0.41576 1.496-0.69534 3.0287-0.81836 4.5781l-0.42188 5.3418c-0.1512 1.9044-0.12646 3.8191 0.07617 5.7188l0.72656 6.8223c0.20216 1.8953 0.65782 3.756 1.3516 5.5312l1.4941 3.8223c0.18158 0.46464 0.62806 0.77148 1.127 0.77148h0.80274v15.439c0 0.79762 0.64379 1.4395 1.4414 1.4395h12.328c0.79762 0 1.4395-0.64186 1.4395-1.4395v-15.439h31.156c9.8605-4.923 20.956-7.7109 32.684-7.7109 1.2063 0 2.4052 0.03379 3.5976 0.0918 0.18911-0.82567 0.3377-1.6617 0.42774-2.5059l0.72656-6.8223c0.20261-1.8996 0.22732-3.8143 0.0762-5.7188l-0.42187-5.3418c-0.12302-1.5495-0.40456-3.0821-0.82032-4.5781h8.373c0.92296 0 1.6719-0.74701 1.6719-1.6699v-2.3496c0-2.9912-2.3411-5.4571-5.3281-5.6133l-7.9531-0.41406-1.0918-3.3535c-0.49197-1.5113-1.0658-2.9964-1.7188-4.4453l-2.3164-5.1387c-2.5027-5.5532-7.9546-9.1953-14.043-9.3809zm3.3711 6.6055h35.414c4.8423 0 9.2429 2.8178 11.268 7.2168l6.2266 15.707h-70.4l6.2266-15.707c2.024-4.3983 6.4237-7.216 11.266-7.2168z" />
    <circle cx="110.93" cy="159.55" r="11.214" />
    <g stroke="currentColor">
      <g strokeWidth="5">
        <path d="m155.98 168.26h17.052v-8.714a62.097 62.097 0 0 0-62.097-62.097 62.097 62.097 0 0 0-62.097 62.097v8.714h17.052" fill="none" />
        <path d="m54.508 133.63 14.286 6.3604" />
        <path d="m110.93 97.452-5e-5 15.638" />
      </g>
      <path d="m75.396 108.63 35.688 50.187" strokeWidth="6" />
      <path d="m167.51 133.42-14.286 6.3604" strokeWidth="5" />
      <path d="m146.47 108.63-9.062 12.744" strokeWidth="5" />
    </g>
    <path d="m167.28 55.312-12.863 22.279-11.641-6.7207 7.6758 28.65 28.65-7.6777-11.641-6.7207 12.863-22.279z" />
  </svg>
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
    if (isPresentation) {
      e.stopPropagation();
    } else {
      dragPosRef.current = { x: e.clientX, y: e.clientY };
      // Allow event to bubble to Canvas wrapper so drag/move and selection activate
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPresentation) {
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
