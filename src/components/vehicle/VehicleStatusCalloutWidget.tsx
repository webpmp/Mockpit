import React from 'react';
import { ComponentInstance, ConnectorAnchor } from '../../types';
import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { useMockpitStore } from '../../store/useMockpitStore';

interface VehicleStatusCalloutWidgetProps {
  component: ComponentInstance;
  resolved: Record<string, string>;
  isSelected?: boolean;
  isPresentation?: boolean;
  customColor?: string;
  baseOpacity?: string;
  styleOpacity?: number;
  onSelectAnchor?: (anchor: ConnectorAnchor) => void;
  onStartConnectDrag?: (e: React.MouseEvent, anchor: ConnectorAnchor) => void;
}

export const ANCHOR_POSITIONS: Record<
  ConnectorAnchor,
  { label: string; left: string; top: string; transform: string }
> = {
  'top-left': { label: 'Top Left', left: '0%', top: '0%', transform: 'translate(-50%, -50%)' },
  'top-center': { label: 'Top Center', left: '50%', top: '0%', transform: 'translate(-50%, -50%)' },
  'top-right': { label: 'Top Right', left: '100%', top: '0%', transform: 'translate(-50%, -50%)' },
  'left-center': { label: 'Left Center', left: '0%', top: '50%', transform: 'translate(-50%, -50%)' },
  'right-center': { label: 'Right Center', left: '100%', top: '50%', transform: 'translate(-50%, -50%)' },
  'bottom-left': { label: 'Bottom Left', left: '0%', top: '100%', transform: 'translate(-50%, -50%)' },
  'bottom-center': { label: 'Bottom Center', left: '50%', top: '100%', transform: 'translate(-50%, -50%)' },
  'bottom-right': { label: 'Bottom Right', left: '100%', top: '100%', transform: 'translate(-50%, -50%)' },
};

export const ANCHOR_LIST: ConnectorAnchor[] = [
  'top-left',
  'top-center',
  'top-right',
  'right-center',
  'bottom-right',
  'bottom-center',
  'bottom-left',
  'left-center',
];

export const VehicleStatusCalloutWidget: React.FC<VehicleStatusCalloutWidgetProps> = ({
  component,
  resolved,
  isSelected,
  isPresentation,
  customColor = '#10b981',
  baseOpacity = 'opacity-100',
  styleOpacity = 1,
  onSelectAnchor,
  onStartConnectDrag,
}) => {
  const tirePressureWarning = useMockpitStore((s) => s.vehicleState.tirePressureWarning ?? false);

  const rawTitle = resolved.title ?? component.staticProps.title ?? 'Front Powertrain';
  const rawDescription = resolved.description ?? component.staticProps.description ?? 'Primary electric drive unit & inverter';
  const rawStatusCode = resolved.statusCode ?? component.staticProps.statusCode ?? '4101';
  const rawStatusMessage = resolved.statusMessage ?? component.staticProps.statusMessage ?? 'Operating within normal thermal parameters';
  const rawHealthType = (resolved.healthType ?? component.staticProps.healthType ?? 'rgy') as 'none' | 'percent' | 'rgy';
  const rawHealthValue = resolved.healthValue ?? component.staticProps.healthValue ?? 'green';

  const isTireCallout =
    rawTitle.toLowerCase().includes('tire') ||
    rawTitle.toLowerCase().includes('tpms') ||
    rawTitle.toLowerCase().includes('wheel') ||
    rawDescription.toLowerCase().includes('tire') ||
    rawDescription.toLowerCase().includes('tpms') ||
    rawDescription.toLowerCase().includes('pressure') ||
    component.id.toLowerCase().includes('tire') ||
    component.id.toLowerCase().includes('tpms');

  let title = rawTitle;
  let description = rawDescription;
  let statusCode = rawStatusCode;
  let statusMessage = rawStatusMessage;
  let healthType = rawHealthType;
  let healthValue = rawHealthValue;

  if (isTireCallout) {
    if (tirePressureWarning) {
      healthType = 'rgy';
      healthValue = rawHealthValue && rawHealthValue !== 'green' ? rawHealthValue : 'yellow';
      statusCode = rawStatusCode || 'TPMS-01';
      statusMessage = rawStatusMessage || 'Low tire pressure detected';
    } else {
      healthType = 'rgy';
      healthValue = 'green';
      statusCode = ''; // Suppress code when normal
      if (
        rawStatusMessage.toLowerCase().includes('low') ||
        rawStatusMessage.toLowerCase().includes('warning') ||
        rawStatusMessage.toLowerCase().includes('puncture') ||
        rawStatusMessage.toLowerCase().includes('critical') ||
        rawStatusMessage.toLowerCase().includes('check') ||
        rawStatusMessage.toLowerCase().includes('fail')
      ) {
        statusMessage = 'Operating within normal pressure parameters';
      } else {
        statusMessage = rawStatusMessage || 'Operating within normal pressure parameters';
      }
    }
  }

  const currentAnchor = component.connector?.sourceAnchor || null;

  // Determine RGY visuals — STATIC ONLY (strictly NO animations/pulsing per automotive safety mandate)
  const rgyConfig = (() => {
    switch (healthValue.toLowerCase()) {
      case 'red':
        return {
          bg: 'bg-rose-500/20',
          border: 'border-rose-500/60',
          dot: 'bg-rose-500',
          text: 'text-rose-400',
          label: 'CRITICAL',
          icon: AlertCircle,
        };
      case 'yellow':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/60',
          dot: 'bg-amber-500',
          text: 'text-amber-400',
          label: 'WARNING',
          icon: AlertTriangle,
        };
      case 'green':
      default:
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/60',
          dot: 'bg-emerald-500',
          text: 'text-emerald-400',
          label: 'NORMAL',
          icon: ShieldCheck,
        };
    }
  })();

  const percentVal = Math.max(0, Math.min(100, parseInt(healthValue, 10) || 0));

  return (
    <div
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-md p-3.5 flex flex-col justify-between select-none relative transition-shadow ${baseOpacity} ${
        isSelected ? 'ring-1 ring-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'shadow-lg'
      }`}
      style={{ opacity: styleOpacity }}
    >
      {/* Top Header Row */}
      <div className="flex items-center h-9 min-h-[36px] max-h-[36px] text-xs font-bold tracking-wider text-slate-400 uppercase z-10 shrink-0 select-none pb-1 border-b border-slate-800/60">
        <span className="flex items-center gap-2 min-w-0 truncate">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: customColor }}
          />
          <span className="truncate">{title}</span>
        </span>
      </div>

      {/* Status Detail & Message Block */}
      <div className="my-1.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1.5">
        {/* Variant 1: RGY Badge + CODE chip */}
        {healthType === 'rgy' && (
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold shrink-0 ${rgyConfig.bg} ${rgyConfig.border} ${rgyConfig.text}`}
            >
              {rgyConfig.label}
            </span>
            {Boolean(statusCode) && (
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-[10px] font-bold border border-slate-700">
                {statusCode}
              </span>
            )}
          </div>
        )}

        {/* Variant 2: Bare Percentage Value (Fixed sky blue) */}
        {healthType === 'percent' && (
          <div className="flex items-center">
            <span className="text-xs font-black font-mono text-sky-400">
              {percentVal}%
            </span>
          </div>
        )}

        {/* Code chip fallback if healthType is 'none' but code exists */}
        {healthType === 'none' && Boolean(statusCode) && (
          <div className="flex items-center">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-[10px] font-bold border border-slate-700">
              {statusCode}
            </span>
          </div>
        )}

        {Boolean(statusMessage) && (
          <p className="text-[10px] text-slate-300/90 font-mono leading-relaxed line-clamp-2">
            {statusMessage}
          </p>
        )}
      </div>

      {/* 8 Source Anchor Interactive Handles (Visible when selected in Editor mode) */}
      {!isPresentation && isSelected && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {ANCHOR_LIST.map((anchor) => {
            const pos = ANCHOR_POSITIONS[anchor];
            const isCurrent = currentAnchor === anchor;

            return (
              <div
                key={anchor}
                className="absolute w-[44px] h-[44px] flex items-center justify-center pointer-events-auto cursor-crosshair group/anchor"
                style={{
                  left: pos.left,
                  top: pos.top,
                  transform: pos.transform,
                }}
                title={`Anchor: ${pos.label} (Click to set or drag to connect)`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAnchor?.(anchor);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartConnectDrag?.(e, anchor);
                }}
              >
                {/* 44x44px Hit Target Container containing a clear visual 8-10px center pip */}
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                    isCurrent
                      ? 'bg-sky-400 border-white shadow-[0_0_8px_#38bdf8] scale-125'
                      : 'bg-slate-900 border-sky-400/80 group-hover/anchor:bg-sky-500 group-hover/anchor:border-white group-hover/anchor:scale-125 shadow-xs'
                  }`}
                >
                  <div className="w-1 h-1 rounded-full bg-white opacity-80" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
