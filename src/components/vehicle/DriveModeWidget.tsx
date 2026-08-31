import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { ComponentInstance, DriveModeState } from '../../types';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ComponentHeader, DEFAULT_COMPONENT_LABELS } from '../ComponentRenderer';
import { parseDriveModes, matchActiveDriveMode } from '../../lib/driveModes';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';

export { parseDriveModes, matchActiveDriveMode };

interface DriveModeWidgetProps {
  component: ComponentInstance;
  resolved?: Record<string, any>;
  isSelected?: boolean;
  isPresentation?: boolean;
  customColor?: string;
  baseOpacity?: string;
  styleOpacity?: number;
}

export const DriveModeWidget: React.FC<DriveModeWidgetProps> = ({
  component,
  resolved = {} as Record<string, any>,
  isSelected,
  customColor = '#38bdf8',
  baseOpacity = 'opacity-100',
  styleOpacity = 1,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const vehicleState = useMockpitStore((s) => s.vehicleState);
  const setVehicleState = useMockpitStore((s) => s.setVehicleState);

  const configuredModes = parseDriveModes(component.staticProps?.modes);
  const currentModeRaw = (vehicleState.driveMode as string) || 'NORMAL';
  const activeMode = matchActiveDriveMode(currentModeRaw, configuredModes);

  const headerLabel = resolved?.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.driveMode;

  const componentWidth = component.width ?? 320;
  const componentHeight = component.height ?? 160;

  const isUltraCompact = componentHeight < 85 || componentWidth < 180;
  const isCompact = componentHeight < 120 || componentWidth < 220;

  // Auto-dismiss after 12 seconds of inactivity, outside click, or Escape key
  useAutoDismiss({
    isOpen,
    onDismiss: () => setIsOpen(false),
    timeoutMs: 12000,
    containerRef,
    dismissOnEscape: true,
    dismissOnClickOutside: true,
    resetOnActivity: true,
  });

  return (
    <div
      ref={containerRef}
      data-component-type="driveMode"
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between shadow-lg backdrop-blur-md relative select-none overflow-visible ${
        isUltraCompact ? 'p-2' : isCompact ? 'p-2.5' : 'p-3.5'
      } ${isOpen ? 'z-40' : ''} ${baseOpacity}`}
      style={{
        borderColor: isSelected ? customColor : undefined,
        opacity: styleOpacity,
      }}
    >
      {/* Component Header (shown when space allows) */}
      {!isUltraCompact && (
        <ComponentHeader
          type="driveMode"
          label={headerLabel}
          customColor={customColor}
        />
      )}

      {/* Main Drive Mode Selector Trigger with anchored independent-height dropdown */}
      <div className="relative my-auto w-full flex flex-col items-center">
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className={`group relative flex items-center justify-between w-full rounded-xl border transition-colors cursor-pointer ${
            isUltraCompact
              ? 'py-1 px-2 text-xs'
              : isCompact
              ? 'py-1.5 px-2.5 text-xs'
              : 'py-2 px-3 text-sm'
          } ${
            isOpen
              ? 'bg-slate-800 border-sky-500/70 ring-2 ring-sky-500/20 text-slate-100 shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-800 hover:border-slate-600 border-slate-700/60 text-slate-200 shadow-sm'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          title="Select drive mode"
        >
          <span className="font-bold tracking-wider uppercase whitespace-nowrap">
            {activeMode}
          </span>

          <ChevronDown
            className={`transition-transform duration-200 text-slate-400 group-hover:text-slate-200 shrink-0 ml-1.5 ${
              isUltraCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'
            } ${isOpen ? 'rotate-180 text-sky-400' : ''}`}
          />
        </button>

        {/* Dropdown Popover: smoothly slides out from trigger and retracts on close */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-slate-950/95 border border-slate-700/90 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl flex flex-col gap-1 min-w-[120px] max-h-56 overflow-y-auto"
            >
              {configuredModes.map((mode) => {
                const isItemActive = mode.toUpperCase() === activeMode.toUpperCase();
                return (
                  <button
                    key={mode}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setVehicleState({ driveMode: mode as DriveModeState });
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer text-xs font-semibold ${
                      isItemActive
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 border border-transparent'
                    }`}
                  >
                    <span className="uppercase tracking-wider whitespace-nowrap">{mode}</span>
                    {isItemActive && (
                      <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
