import React, { useEffect } from 'react';
import {
  AlertTriangle,
  Battery,
  BatteryWarning,
  Bell,
  Check,
  CircleDot,
  Compass,
  DoorOpen,
  Fan,
  Flag,
  Gauge,
  Home,
  Info,
  Key,
  Layers,
  Lock,
  MapPin,
  Music,
  Navigation,
  Phone,
  Play,
  Plus,
  Route,
  Search,
  ShieldAlert,
  Thermometer,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getResolvedProps } from '../lib/bindingEvaluator';
import { ComponentInstance, DriveModeState, VehicleState } from '../types';
import { useMockpitStore } from '../store/useMockpitStore';

interface ComponentRendererProps {
  component: ComponentInstance;
  vehicleState: VehicleState;
  isSelected?: boolean;
  isPresentation?: boolean;
  onMinimize?: () => void;
}

export const DEFAULT_COMPONENT_LABELS: Record<string, string> = {
  battery: 'High Voltage Battery',
  gear: 'Drive Select',
  speed: 'Vehicle Velocity',
  warning: 'Vehicle Alert',
  charging: 'EV Power System',
  map: 'Navigation Map',
  media: 'Audio Player',
  climate: 'Climate Control',
  phone: 'Phone System',
  driveMode: 'Drive Mode',
  tirePressure: 'Tire Pressure (TPMS)',
  navHome: 'Home Location',
  navDestination: 'Trip Route & Waypoints',
  navSearch: 'POIs & Charger Search',
  navTripEstimate: 'Trip Estimate',
  subnav: 'Sub-Navigation Widget',
};

export const getAlphaColor = (color: string, hexAlpha: string, mixPercent: number = 25): string => {
  if (!color) return 'var(--color-primary)';
  if (color.startsWith('var(')) {
    return `color-mix(in srgb, ${color} ${mixPercent}%, transparent)`;
  }
  return `${color}${hexAlpha}`;
};

export const getComponentDefaultIcon = (type: string, customColor: string, iconKey?: string) => {
  const className = 'w-3.5 h-3.5 shrink-0';
  switch (type) {
    case 'battery':
      return <Battery className={className} style={{ color: customColor }} />;
    case 'gear':
      return <Gauge className={className} style={{ color: customColor }} />;
    case 'speed':
      return <Gauge className={className} style={{ color: customColor }} />;
    case 'warning':
      return renderNotificationIcon(iconKey || 'alert-triangle', className);
    case 'charging':
      return <Zap className={className} style={{ color: customColor }} />;
    case 'map':
      return <MapPin className={className} style={{ color: customColor }} />;
    case 'media':
      return <Music className={className} style={{ color: customColor }} />;
    case 'climate':
      return <Thermometer className={className} style={{ color: customColor }} />;
    case 'phone':
      return <Phone className={className} style={{ color: customColor }} />;
    case 'driveMode':
      return <Compass className={className} style={{ color: customColor }} />;
    case 'tirePressure':
      return <CircleDot className={className} style={{ color: customColor }} />;
    case 'navHome':
      return <Home className={className} style={{ color: customColor }} />;
    case 'navDestination':
      return <Route className={className} style={{ color: customColor }} />;
    case 'navSearch':
      return <Search className={className} style={{ color: customColor }} />;
    case 'navTripEstimate':
      return <Zap className={className} style={{ color: customColor }} />;
    case 'subnav':
      return <Layers className={className} style={{ color: customColor }} />;
    default:
      return <Gauge className={className} style={{ color: customColor }} />;
  }
};

interface ComponentHeaderProps {
  type: string;
  label: string;
  customColor: string;
  iconKey?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export const ComponentHeader: React.FC<ComponentHeaderProps> = ({
  type,
  label,
  customColor,
  iconKey,
  rightElement,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase z-10 shrink-0 select-none pb-1.5 border-b border-slate-800/60 ${className}`}>
      <span className="flex items-center gap-1.5 min-w-0 truncate">
        {getComponentDefaultIcon(type, customColor, iconKey)}
        <span className="truncate">{label}</span>
      </span>
      {rightElement && <div className="shrink-0 flex items-center gap-1 ml-2">{rightElement}</div>}
    </div>
  );
};

export const renderNotificationIcon = (
  iconName: string = 'alert-triangle',
  className: string = 'w-6 h-6'
) => {
  const norm = iconName.toLowerCase().trim();
  switch (norm) {
    case 'door-open':
    case 'door':
      return <DoorOpen className={className} />;
    case 'battery-warning':
    case 'battery':
      return <BatteryWarning className={className} />;
    case 'thermometer':
    case 'temp':
    case 'temperature':
      return <Thermometer className={className} />;
    case 'tire':
    case 'tpms':
    case 'circle-dot':
      return <CircleDot className={className} />;
    case 'zap':
    case 'charging':
      return <Zap className={className} />;
    case 'gauge':
    case 'speed':
      return <Gauge className={className} />;
    case 'bell':
      return <Bell className={className} />;
    case 'shield-alert':
    case 'shield':
      return <ShieldAlert className={className} />;
    case 'wrench':
    case 'service':
      return <Wrench className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'key':
      return <Key className={className} />;
    case 'info':
      return <Info className={className} />;
    case 'fan':
      return <Fan className={className} />;
    case 'alert-triangle':
    default:
      return <AlertTriangle className={className} />;
  }
};

const customPinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div style="background-color: #38bdf8; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #0f172a; box-shadow: 0 0 10px #38bdf8;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const MapResizer: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);

  return null;
};

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  vehicleState,
  isSelected,
  isPresentation,
  onMinimize,
}) => {
  const setVehicleState = useMockpitStore((s) => s.setVehicleState);
  const resolved = getResolvedProps(component, vehicleState);

  // Charging complete state tracking for 'charging' component type
  const [isChargingComplete, setIsChargingComplete] = React.useState(false);
  const [forceDismissCharging, setForceDismissCharging] = React.useState(false);
  const chargingCompleteTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (component.type !== 'charging') return;

    const isCharging = vehicleState.isCharging;
    const battery = vehicleState.batteryPercent;

    if (!isCharging || battery < 100) {
      if (isChargingComplete || forceDismissCharging) {
        setIsChargingComplete(false);
        setForceDismissCharging(false);
        if (chargingCompleteTimerRef.current) {
          clearTimeout(chargingCompleteTimerRef.current);
          chargingCompleteTimerRef.current = null;
        }
      }
      return;
    }

    if (isCharging && battery >= 100 && !isChargingComplete && !forceDismissCharging) {
      setIsChargingComplete(true);
      if (chargingCompleteTimerRef.current) {
        clearTimeout(chargingCompleteTimerRef.current);
      }
      chargingCompleteTimerRef.current = setTimeout(() => {
        setForceDismissCharging(true);
      }, 60000);
    }
  }, [component.type, vehicleState.isCharging, vehicleState.batteryPercent, isChargingComplete, forceDismissCharging]);

  // Visibility logic
  const isVisible = resolved.visible !== 'false' && resolved.visible !== '0';

  if (!isVisible && isPresentation && component.type !== 'charging') {
    return null;
  }

  const baseOpacity = !isVisible ? 'opacity-30 border-dashed' : 'opacity-100';
  const customColor = resolved.color || 'var(--color-primary)';

  switch (component.type) {
    case 'battery': {
      const percent = vehicleState.batteryPercent;
      const roundedPercent = Math.round(percent);
      const textVal = resolved.text
        ? resolved.text.replace(/(\d+\.\d+)%/g, (_, num) => `${Math.round(parseFloat(num))}%`)
        : `${roundedPercent}%`;
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.battery;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="battery"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              vehicleState.isCharging ? (
                vehicleState.batteryPercent >= 100 ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    <Check className="w-3 h-3 text-emerald-400" />
                    CHARGING COMPLETE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold animate-pulse text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Zap className="w-3 h-3 fill-emerald-400" />
                    CHARGING
                  </span>
                )
              ) : (
                <span className="text-[10px] font-mono text-slate-500">
                  {Math.round(percent * 4.2)} mi range
                </span>
              )
            }
          />

          <div className="flex items-baseline justify-between my-1">
            <div className="text-3xl font-black tracking-tight" style={{ color: customColor }}>
              {textVal}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {vehicleState.isCharging ? '350 kW DC Fast' : `${roundedPercent}% Capacity`}
            </div>
          </div>

          {/* Battery Level Progress Bar */}
          <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, percent))}%`,
                backgroundColor: customColor,
                boxShadow: `0 0 12px ${getAlphaColor(customColor, '80', 50)}`,
              }}
            />
          </div>
        </div>
      );
    }

    case 'gear': {
      const currentGear = (resolved.text || vehicleState.gear || 'P').toUpperCase();
      const gears = ['P', 'R', 'N', 'D'];
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.gear;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between items-stretch shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="gear"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {currentGear}
              </span>
            }
          />

          <div className="flex items-center justify-center my-auto">
            <div
              className="text-4xl font-black tracking-widest px-4 py-1 rounded-xl bg-slate-800/60 border border-slate-700/50 transition-all duration-300"
              style={{
                color: customColor,
                boxShadow: `0 0 20px ${getAlphaColor(customColor, '40', 25)}`,
              }}
            >
              {currentGear}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
            {gears.map((g) => {
              const isActive = g === currentGear;
              return (
                <span
                  key={g}
                  className={`text-xs font-bold transition-all px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-600'
                  }`}
                  style={isActive ? { color: customColor } : undefined}
                >
                  {g}
                </span>
              );
            })}
          </div>
        </div>
      );
    }

    case 'speed': {
      const speedVal = resolved.text || String(vehicleState.speed);
      const unitVal = resolved.unit || 'mph';
      const displayStyle = (resolved.displayStyle || component.staticProps?.displayStyle || 'numeric') as 'numeric' | 'radialGauge' | 'arcGauge';
      const maxSpd = Math.max(1, Number(resolved.maxSpeed || component.staticProps?.maxSpeed || 120));
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.speed;

      const parsedSpeed = parseFloat(speedVal);
      const currentSpeed = !isNaN(parsedSpeed) ? parsedSpeed : (vehicleState.speed || 0);
      const ratio = Math.min(1, Math.max(0, currentSpeed / maxSpd));

      if (displayStyle === 'radialGauge') {
        const startAngle = 220;
        const totalSweep = 280;
        const activeAngle = startAngle + ratio * totalSweep;

        const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
          const rad = ((angleInDegrees - 90) * Math.PI) / 180;
          return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad),
          };
        };

        const describeArcPath = (cx: number, cy: number, r: number, startA: number, endA: number) => {
          const start = polarToCartesian(cx, cy, r, endA);
          const end = polarToCartesian(cx, cy, r, startA);
          const largeArcFlag = endA - startA <= 180 ? '0' : '1';
          return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
        };

        const cx = 100;
        const cy = 100;
        const r = 72;

        const bgArcPath = describeArcPath(cx, cy, r, startAngle, startAngle + totalSweep);
        const activeArcPath = describeArcPath(cx, cy, r, startAngle, Math.max(startAngle + 0.5, activeAngle));

        const needleTip = polarToCartesian(cx, cy, 58, activeAngle);

        const ticksCount = 6;
        const majorTicks = Array.from({ length: ticksCount + 1 }).map((_, i) => {
          const tickAngle = startAngle + i * (totalSweep / ticksCount);
          const outerPt = polarToCartesian(cx, cy, 72, tickAngle);
          const innerPt = polarToCartesian(cx, cy, 64, tickAngle);
          const labelPt = polarToCartesian(cx, cy, 52, tickAngle);
          const val = Math.round((i / ticksCount) * maxSpd);
          return { i, tickAngle, outerPt, innerPt, labelPt, val };
        });

        return (
          <div
            className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between items-center text-center shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden [container-type:size] ${baseOpacity}`}
            style={{ containerType: 'size', borderColor: isSelected ? customColor : undefined }}
          >
            <ComponentHeader
              type="speed"
              label={headerLabel}
              customColor={customColor}
              className="w-full"
            />

            <div className="relative w-full flex-1 flex items-center justify-center my-1 z-10 min-h-0">
              <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                {/* Background Arc */}
                <path
                  d={bgArcPath}
                  fill="none"
                  stroke="rgba(51, 65, 85, 0.4)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* Active Arc */}
                <path
                  d={activeArcPath}
                  fill="none"
                  stroke={customColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 8px ${getAlphaColor(customColor, '80', 50)})` }}
                />

                {/* Major Ticks & Labels */}
                {majorTicks.map((t) => (
                  <g key={t.i}>
                    <line
                      x1={t.innerPt.x}
                      y1={t.innerPt.y}
                      x2={t.outerPt.x}
                      y2={t.outerPt.y}
                      stroke={t.tickAngle <= activeAngle ? customColor : 'rgba(100, 116, 139, 0.6)'}
                      strokeWidth="2"
                    />
                    <text
                      x={t.labelPt.x}
                      y={t.labelPt.y + 3}
                      textAnchor="middle"
                      fill="rgba(148, 163, 184, 0.8)"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {t.val}
                    </text>
                  </g>
                ))}

                {/* Pivot Center */}
                <circle cx={cx} cy={cy} r="8" fill="#0f172a" stroke={customColor} strokeWidth="2.5" />
                <circle cx={cx} cy={cy} r="3" fill={customColor} />

                {/* Rotating Needle */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={needleTip.x}
                  y2={needleTip.y}
                  stroke={customColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 8px ${customColor})` }}
                />

                {/* Center Numeric Value Overlay */}
                <text
                  x={cx}
                  y={cy + 36}
                  textAnchor="middle"
                  fill={customColor}
                  fontSize="24"
                  fontWeight="900"
                  fontFamily="system-ui, sans-serif"
                  style={{ filter: `drop-shadow(0 0 10px ${getAlphaColor(customColor, '60', 35)})` }}
                >
                  {speedVal}
                </text>
                <text
                  x={cx}
                  y={cy + 48}
                  textAnchor="middle"
                  fill="rgba(148, 163, 184, 0.8)"
                  fontSize="8"
                  fontWeight="bold"
                  letterSpacing="1"
                  fontFamily="monospace"
                >
                  {unitVal.toUpperCase()}
                </text>
              </svg>
            </div>

            <div className="w-full flex justify-between items-center text-slate-500 font-mono z-10 border-t border-slate-800/80 pt-1.5 shrink-0" style={{ fontSize: 'clamp(8px, 4.2cqmin, 16px)' }}>
              <span>MAX {maxSpd}</span>
              {vehicleState.cruiseControlActive && (
                <span className="text-emerald-400 font-bold">CRUISE SET</span>
              )}
            </div>

            <div
              className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl blur-xl"
              style={{ backgroundColor: customColor }}
            />
          </div>
        );
      }

      if (displayStyle === 'arcGauge') {
        const stop1 = resolved.arcStop1Color || component.staticProps?.arcStop1Color || '#10b981';
        const stop2 = resolved.arcStop2Color || component.staticProps?.arcStop2Color || '#06b6d4';
        const stop3 = resolved.arcStop3Color || component.staticProps?.arcStop3Color || '#38bdf8';
        const stop4 = resolved.arcStop4Color || component.staticProps?.arcStop4Color || '#f59e0b';
        const stop5 = resolved.arcStop5Color || component.staticProps?.arcStop5Color || '#ef4444';

        const startAngle = 220;
        const totalSweep = 280;
        const activeAngle = startAngle + ratio * totalSweep;

        const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
          const rad = ((angleInDegrees - 90) * Math.PI) / 180;
          return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad),
          };
        };

        const cx = 100;
        const cy = 100;
        const rMid = 70;
        const minWidth = 1.5;
        const maxWidth = 18;

        const computeTaperedWedge = (endDeg: number, steps = 30) => {
          const safeEndDeg = Math.max(startAngle + 0.2, endDeg);
          const sweep = safeEndDeg - startAngle;
          const outerPts: { x: number; y: number }[] = [];
          const innerPts: { x: number; y: number }[] = [];

          for (let i = 0; i <= steps; i++) {
            const stepFrac = i / steps;
            const angleDeg = startAngle + stepFrac * sweep;
            const fullFrac = (angleDeg - startAngle) / totalSweep;
            const w = minWidth + fullFrac * (maxWidth - minWidth);
            const rOut = rMid + w / 2;
            const rIn = rMid - w / 2;

            outerPts.push(polarToCartesian(cx, cy, rOut, angleDeg));
            innerPts.push(polarToCartesian(cx, cy, rIn, angleDeg));
          }

          let d = `M ${outerPts[0].x.toFixed(2)} ${outerPts[0].y.toFixed(2)}`;
          for (let i = 1; i <= steps; i++) {
            d += ` L ${outerPts[i].x.toFixed(2)} ${outerPts[i].y.toFixed(2)}`;
          }
          for (let i = steps; i >= 0; i--) {
            d += ` L ${innerPts[i].x.toFixed(2)} ${innerPts[i].y.toFixed(2)}`;
          }
          d += ' Z';
          return d;
        };

        const bgWedgePath = computeTaperedWedge(startAngle + totalSweep, 30);
        const activeWedgePath = computeTaperedWedge(activeAngle, 30);

        const gradientId = `arcGaugeGrad_${component.id}`;
        const glowBlur = (4 + ratio * 18).toFixed(1);
        const glowOpacity = (0.2 + ratio * 0.75).toFixed(2);

        const ticksCount = 4;
        const arcTicks = Array.from({ length: ticksCount + 1 }).map((_, i) => {
          const tickFrac = i / ticksCount;
          const tickAngle = startAngle + tickFrac * totalSweep;
          const tickW = minWidth + tickFrac * (maxWidth - minWidth);
          const outerPt = polarToCartesian(cx, cy, rMid + tickW / 2 + 5, tickAngle);
          const innerPt = polarToCartesian(cx, cy, rMid + tickW / 2 + 1, tickAngle);
          const labelPt = polarToCartesian(cx, cy, rMid + tickW / 2 + 12, tickAngle);
          const val = Math.round(tickFrac * maxSpd);
          return { i, tickAngle, outerPt, innerPt, labelPt, val };
        });

        return (
          <div
            className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between items-center text-center shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden [container-type:size] ${baseOpacity}`}
            style={{ containerType: 'size', borderColor: isSelected ? customColor : undefined }}
          >
            <ComponentHeader
              type="speed"
              label={headerLabel}
              customColor={customColor}
              className="w-full"
            />

            <div className="relative w-full flex-1 flex items-center justify-center my-1 z-10 min-h-0">
              <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                <defs>
                  {/* Full 0 -> Max Range Gradient */}
                  <linearGradient
                    id={gradientId}
                    x1="45"
                    y1="0"
                    x2="155"
                    y2="0"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={stop1} />
                    <stop offset="25%" stopColor={stop2} />
                    <stop offset="50%" stopColor={stop3} />
                    <stop offset="75%" stopColor={stop4} />
                    <stop offset="100%" stopColor={stop5} />
                  </linearGradient>
                </defs>

                {/* Background Tapered Wedge Track */}
                <path
                  d={bgWedgePath}
                  fill="rgba(30, 41, 59, 0.45)"
                  stroke="rgba(71, 85, 105, 0.35)"
                  strokeWidth="1"
                />

                {/* Dynamic Glowing Wedge Underlay */}
                <path
                  d={activeWedgePath}
                  fill={`url(#${gradientId})`}
                  style={{
                    filter: `blur(${glowBlur}px)`,
                    opacity: Number(glowOpacity),
                  }}
                />

                {/* Crisp Foreground Active Tapered Wedge */}
                <path
                  d={activeWedgePath}
                  fill={`url(#${gradientId})`}
                  style={{
                    filter: `drop-shadow(0 0 ${Math.max(2, ratio * 8)}px rgba(255, 255, 255, 0.25))`,
                  }}
                />

                {/* Arc Outer Ticks and Scale Labels */}
                {arcTicks.map((t) => (
                  <g key={t.i}>
                    <line
                      x1={t.innerPt.x}
                      y1={t.innerPt.y}
                      x2={t.outerPt.x}
                      y2={t.outerPt.y}
                      stroke={t.tickAngle <= activeAngle ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 116, 139, 0.5)'}
                      strokeWidth="1.5"
                    />
                    <text
                      x={t.labelPt.x}
                      y={t.labelPt.y + 3}
                      textAnchor="middle"
                      fill={t.tickAngle <= activeAngle ? 'rgba(226, 232, 240, 0.9)' : 'rgba(148, 163, 184, 0.6)'}
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {t.val}
                    </text>
                  </g>
                ))}

                {/* Center Numeric Speed Value */}
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  fill={customColor}
                  fontSize="38"
                  fontWeight="900"
                  fontFamily="system-ui, sans-serif"
                  style={{
                    filter: `drop-shadow(0 0 10px ${getAlphaColor(customColor, '60', 35)})`,
                  }}
                >
                  {speedVal}
                </text>
                <text
                  x={cx}
                  y={cy + 26}
                  textAnchor="middle"
                  fill="rgba(148, 163, 184, 0.8)"
                  fontSize="9"
                  fontWeight="bold"
                  letterSpacing="1"
                  fontFamily="monospace"
                >
                  {unitVal.toUpperCase()}
                </text>
              </svg>
            </div>

            <div className="w-full flex justify-between items-center text-slate-500 font-mono z-10 border-t border-slate-800/80 pt-1.5 shrink-0" style={{ fontSize: 'clamp(8px, 4.2cqmin, 16px)' }}>
              <span>LIMIT 65</span>
              {vehicleState.cruiseControlActive && (
                <span className="text-emerald-400 font-bold">CRUISE SET</span>
              )}
            </div>

            <div
              className="absolute inset-0 pointer-events-none rounded-2xl transition-all duration-150"
              style={{
                background: `radial-gradient(circle at center, rgba(56, 189, 248, ${0.05 + ratio * 0.15}) 0%, transparent 70%)`,
              }}
            />
          </div>
        );
      }

      // Default 'numeric' style
      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between items-center text-center shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden [container-type:size] ${baseOpacity}`}
          style={{ containerType: 'size', borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="speed"
            label={headerLabel}
            customColor={customColor}
            className="w-full"
          />

          <div className="my-auto z-10 flex flex-col items-center">
            <div
              className="font-black tracking-tighter leading-none"
              style={{
                color: customColor,
                textShadow: `0 0 25px ${getAlphaColor(customColor, '60', 35)}`,
                fontSize: 'clamp(28px, 32cqmin, 120px)',
              }}
            >
              {speedVal}
            </div>
            <div className="font-bold tracking-widest text-slate-400 uppercase mt-1" style={{ fontSize: 'clamp(9px, 5cqmin, 22px)' }}>
              {unitVal}
            </div>
          </div>

          <div className="w-full flex justify-between items-center text-slate-500 font-mono z-10 border-t border-slate-800/80 pt-2 shrink-0" style={{ fontSize: 'clamp(8px, 4.2cqmin, 16px)' }}>
            <span>LIMIT 65</span>
            {vehicleState.cruiseControlActive && (
              <span className="text-emerald-400 font-bold">CRUISE SET</span>
            )}
          </div>

          <div
            className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl blur-xl"
            style={{ backgroundColor: customColor }}
          />
        </div>
      );
    }

    case 'warning': {
      const message = resolved.message || resolved.text || component.staticProps?.message || 'WARNING';

      let iconKey = resolved.icon || component.staticProps?.icon;
      if (!iconKey || iconKey === 'alert-triangle') {
        const normMsg = message.toUpperCase();
        if (normMsg.includes('DOOR') || component.id.includes('door')) {
          iconKey = 'door-open';
        } else if (normMsg.includes('BATTERY') || component.id.includes('battery')) {
          iconKey = 'battery-warning';
        } else if (normMsg.includes('CRUISE') || component.id.includes('cruise')) {
          iconKey = 'gauge';
        } else {
          iconKey = iconKey || 'alert-triangle';
        }
      }

      let headerLabel = resolved.label || component.staticProps?.label;
      if (!headerLabel || headerLabel === DEFAULT_COMPONENT_LABELS.warning) {
        const normMsg = message.toUpperCase();
        if (iconKey === 'door-open' || normMsg.includes('DOOR') || component.id.includes('door')) {
          headerLabel = 'DOOR ALERT';
        } else if (iconKey === 'battery-warning' || normMsg.includes('BATTERY') || component.id.includes('battery')) {
          headerLabel = 'BATTERY ALERT';
        } else if (iconKey === 'gauge' || normMsg.includes('CRUISE') || component.id.includes('cruise')) {
          headerLabel = 'CRUISE CONTROL';
        } else {
          headerLabel = DEFAULT_COMPONENT_LABELS.warning;
        }
      }

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-950/95 border-2 p-3.5 flex flex-col justify-between shadow-2xl backdrop-blur-xl transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
          style={{
            borderColor: customColor,
            boxShadow: isVisible ? `0 0 25px ${getAlphaColor(customColor, '40', 25)}` : undefined,
          }}
        >
          <ComponentHeader
            type="warning"
            label={headerLabel}
            customColor={customColor}
            iconKey={iconKey}
            rightElement={
              onMinimize ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMinimize();
                  }}
                  className="p-1 rounded bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Minimize Alert (X)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />

          <div className="flex items-center gap-3.5 min-w-0 flex-1 pt-1.5 pb-2.5">
            <div
              className="p-2.5 rounded-xl shrink-0 flex items-center justify-center border"
              style={{
                backgroundColor: getAlphaColor(customColor, '25', 15),
                borderColor: getAlphaColor(customColor, '50', 30),
                color: customColor,
              }}
            >
              {renderNotificationIcon(iconKey, 'w-5 h-5')}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-extrabold tracking-tight truncate text-slate-100">
                {message}
              </span>
            </div>
          </div>
        </div>
      );
    }

    case 'charging': {
      if (forceDismissCharging) {
        return null;
      }

      const roundedPercent = Math.round(vehicleState.batteryPercent);
      const isComplete = isChargingComplete;

      const displayLabel = isComplete
        ? 'CHARGING COMPLETE'
        : (resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.charging);

      const displayText = isComplete
        ? 'CHARGING COMPLETE'
        : (resolved.text || 'DC FAST CHARGING');

      const statusSubtext = isComplete
        ? '100% Charged • Complete'
        : `350 kW • ${roundedPercent}% Charged`;

      const badgeColor = isComplete ? '#10b981' : customColor;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-blue-950/40 border p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{
            borderColor: badgeColor,
            boxShadow: isVisible || isComplete ? `0 0 20px ${getAlphaColor(badgeColor, '30', 20)}` : undefined,
          }}
        >
          <ComponentHeader
            type="charging"
            label={displayLabel}
            customColor={badgeColor}
            rightElement={
              <span className={`text-[10px] font-mono font-bold ${isComplete ? 'text-emerald-400' : 'text-blue-400'}`}>
                {roundedPercent}%
              </span>
            }
          />

          <div className="flex items-center gap-3 my-1">
            <div
              className="p-2.5 rounded-xl shrink-0 border"
              style={{
                backgroundColor: getAlphaColor(badgeColor, '20', 15),
                borderColor: getAlphaColor(badgeColor, '40', 25),
                color: badgeColor,
              }}
            >
              {isComplete ? (
                <Check className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Zap className="w-6 h-6 fill-current animate-pulse" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-wider truncate" style={{ color: badgeColor }}>
                {displayText}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {statusSubtext}
              </span>
            </div>
          </div>
        </div>
      );
    }

    case 'map': {
      const lat = Number(resolved.lat) || 37.7749;
      const lng = Number(resolved.lng) || -122.4194;
      const zoom = Number(resolved.zoom) || 13;
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.map;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="map"
            label={headerLabel}
            customColor={customColor}
            className="mb-1.5"
            rightElement={
              <span className="text-[9px] font-mono text-slate-500">
                {lat.toFixed(2)}°, {lng.toFixed(2)}°
              </span>
            }
          />

          <div className="flex-1 w-full rounded-xl overflow-hidden relative border border-slate-800/80 z-0">
            <MapContainer
              center={[lat, lng]}
              zoom={zoom}
              scrollWheelZoom={false}
              dragging={false}
              zoomControl={false}
              doubleClickZoom={false}
              touchZoom={false}
              attributionControl={false}
              className="w-full h-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[lat, lng]} icon={customPinIcon} />
              <MapResizer />
            </MapContainer>
          </div>
        </div>
      );
    }

    // Scaffolded disabled-by-default infotainment shells
    case 'media': {
      const title = resolved.title || 'Midnight City';
      const artist = resolved.artist || 'M83';
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.media;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="media"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[10px] font-mono text-slate-500">Bluetooth</span>
            }
          />

          <div className="flex items-center gap-3 my-1">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-pink-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-100 truncate">{title}</div>
              <div className="text-xs text-slate-400 truncate">{artist}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
            <div className="text-[10px] font-mono text-slate-500">1:42 / 4:03</div>
            <div className="flex items-center gap-2 text-slate-300">
              <Play className="w-4 h-4 fill-current text-pink-400" />
            </div>
          </div>
        </div>
      );
    }

    case 'climate': {
      const temp = resolved.temp || '72°F';
      const fanSpeed = resolved.fanSpeed || 'Auto 3';
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.climate;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="climate"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                DUAL AC
              </span>
            }
          />

          <div className="flex items-center justify-between my-1">
            <div className="text-3xl font-black text-orange-400 tracking-tight">{temp}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
              <Fan className="w-3.5 h-3.5 text-slate-400" />
              <span>{fanSpeed}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-1 border-t border-slate-800/60">
            <span>DRIVER: {temp}</span>
            <span>PASSENGER: 70°F</span>
          </div>
        </div>
      );
    }

    case 'phone': {
      const contact = resolved.contact || 'Alex Morgan';
      const number = resolved.number || '+1 (555) 019-2834';
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.phone;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="phone"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[9px] text-emerald-400 font-mono">CONNECTED</span>
            }
          />

          <div className="my-1 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs shrink-0">
              {contact.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-100 truncate">{contact}</div>
              <div className="text-xs text-slate-400 font-mono truncate">{number}</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
            Hands-free calling ready
          </div>
        </div>
      );
    }

    case 'driveMode': {
      const currentMode = vehicleState.driveMode || 'Normal';
      const modes: DriveModeState[] = ['Eco', 'Normal', 'Sport'];
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.driveMode;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="driveMode"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span
                className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all"
                style={{
                  color: customColor,
                  backgroundColor: getAlphaColor(customColor, '20', 15),
                  borderColor: getAlphaColor(customColor, '40', 25),
                }}
              >
                {currentMode.toUpperCase()}
              </span>
            }
          />

          <div className="grid grid-cols-3 gap-1.5 my-1">
            {modes.map((m) => {
              const isActive = m === currentMode;
              return (
                <button
                  key={m}
                  onClick={(e) => {
                    e.stopPropagation();
                    setVehicleState({ driveMode: m });
                  }}
                  className={`py-2 px-1 rounded-xl font-black text-xs tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'shadow-lg scale-105 border font-black text-slate-950'
                      : 'bg-slate-800/70 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: customColor,
                          borderColor: customColor,
                          boxShadow: `0 0 14px ${getAlphaColor(customColor, '80', 50)}`,
                        }
                      : undefined
                  }
                >
                  {m.toUpperCase()}
                </button>
              );
            })}
          </div>

          <div className="text-[9px] text-slate-500 font-mono text-center border-t border-slate-800/60 pt-1">
            CLICK TO SELECT DRIVE MODE
          </div>
        </div>
      );
    }

    case 'tirePressure': {
      const fl = resolved.frontLeft || '35 PSI';
      const fr = resolved.frontRight || '35 PSI';
      const rl = resolved.rearLeft || '36 PSI';
      const rr = resolved.rearRight || '36 PSI';
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.tirePressure;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="tirePressure"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[9px] text-slate-500 font-mono">4 TIRES</span>
            }
          />

          <div className="grid grid-cols-2 gap-2 my-1 text-center">
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-500 block font-mono">FL</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{fl}</span>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-500 block font-mono">FR</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{fr}</span>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-500 block font-mono">RL</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{rl}</span>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-500 block font-mono">RR</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{rr}</span>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono text-center">ALL TIRES NORMAL</div>
        </div>
      );
    }

    case 'navHome': {
      // Note: Real geocoding/routing integration deferred to live network API phase.
      const address = resolved.address || component.staticProps?.address || '1234 Silicon Way, San Jose, CA 95134';
      const coords = resolved.coords || component.staticProps?.coords || '37.3861° N, 122.0839° W';
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navHome;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="navHome"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                SAVED
              </span>
            }
          />

          <div className="my-2 space-y-1">
            <div className="text-xs font-bold text-slate-100 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{address}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono pl-5">
              Coordinates: <span className="text-slate-300">{coords}</span>
            </div>
          </div>

          <button
            onClick={() => alert(`Starting route to Home: ${address}`)}
            className="w-full py-1.5 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500 hover:text-slate-950 text-sky-300 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-sky-500/40"
          >
            <Navigation className="w-3.5 h-3.5" /> Navigate Home
          </button>
        </div>
      );
    }

    case 'navDestination': {
      // Note: Real geocoding/routing integration deferred to live network API phase.
      const primaryDest = resolved.destination || component.staticProps?.destination || 'Yosemite National Park Valley';
      const initialWaypoints = component.staticProps?.waypoints
        ? JSON.parse(component.staticProps.waypoints)
        : ['Stop 1: EV Supercharger Bay (12 mins)', 'Stop 2: Scenic Overlook Rest Area'];
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navDestination;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="navDestination"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[9px] font-mono text-slate-400">{initialWaypoints.length + 1} STOPS</span>
            }
          />

          <div className="my-1.5 space-y-1.5 overflow-y-auto max-h-[110px] pr-1">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100 min-w-0">
                <Flag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{primaryDest}</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50 shrink-0 ml-1">
                DEST
              </span>
            </div>

            {initialWaypoints.map((wp: string, i: number) => (
              <div key={i} className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-[9px] font-bold font-mono flex items-center justify-center text-slate-400 shrink-0">
                    {i + 1}
                  </span>
                  <span className="truncate">{wp}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
            <button
              onClick={() => alert(`Recalculating route to ${primaryDest}...`)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer border border-amber-500/40"
            >
              <Navigation className="w-3.5 h-3.5" /> Start Guidance
            </button>
          </div>
        </div>
      );
    }

    case 'navSearch': {
      // Note: Real geocoding/routing integration deferred to live network API phase.
      const samplePOIs = [
        { name: 'Tesla Supercharger - 250kW', status: '8/12 Open', dist: '1.2 mi' },
        { name: 'Electrify America - 350kW', status: '4/6 Open', dist: '2.4 mi' },
        { name: 'Starbucks Coffee Drive-thru', status: 'Open Now', dist: '0.8 mi' },
      ];
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navSearch;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="navSearch"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[9px] font-mono text-slate-400">NEARBY</span>
            }
          />

          <div className="my-1 relative">
            <input
              type="text"
              placeholder="Search EV chargers, food, parking..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 pl-7 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
              readOnly
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[90px] pr-1">
            {samplePOIs.map((poi, idx) => (
              <div
                key={idx}
                onClick={() => alert(`Selected POI: ${poi.name}`)}
                className="p-1.5 rounded-lg bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-1">
                  <div className="text-[11px] font-bold text-slate-200 truncate">{poi.name}</div>
                  <div className="text-[9px] text-emerald-400 font-mono">{poi.status}</div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {poi.dist}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[9px] text-slate-500 font-mono text-center pt-1 border-t border-slate-800/60">
            FILTERED SAMPLE POIS
          </div>
        </div>
      );
    }

    case 'navTripEstimate': {
      // Note: Real geocoding/routing integration deferred to live network API phase.
      const distance = resolved.distance || component.staticProps?.distance || '142.5 miles';
      const duration = resolved.duration || component.staticProps?.duration || '2 hrs 15 mins';
      const energyEstRaw = resolved.energy || component.staticProps?.energy || '38.2 kWh (27% Battery)';
      const arrBatteryRaw = resolved.arrivalBattery || component.staticProps?.arrivalBattery || `${Math.max(0, Math.round(vehicleState.batteryPercent - 27))}% at Arrival`;

      const energyEst = energyEstRaw.replace(/(\d+\.\d+)%/g, (_, num) => `${Math.round(parseFloat(num))}%`);
      const arrBattery = arrBatteryRaw.replace(/(\d+\.\d+)%/g, (_, num) => `${Math.round(parseFloat(num))}%`);
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navTripEstimate;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="navTripEstimate"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                ESTIMATE
              </span>
            }
          />

          <div className="grid grid-cols-2 gap-1.5 my-1">
            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-mono uppercase">Distance</span>
              <span className="text-xs font-bold text-slate-100 font-mono">{distance}</span>
            </div>

            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-mono uppercase">Est. Time</span>
              <span className="text-xs font-bold text-sky-400 font-mono">{duration}</span>
            </div>

            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-mono uppercase">Energy Req.</span>
              <span className="text-[11px] font-bold text-purple-300 font-mono">{energyEst}</span>
            </div>

            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-mono uppercase">Arrival Charge</span>
              <span className="text-[11px] font-bold text-emerald-400 font-mono">{arrBattery}</span>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono text-center border-t border-slate-800/60 pt-1">
            HAVERSINE STRAIGHT-LINE CALCULATION
          </div>
        </div>
      );
    }

    case 'subnav': {
      const activeView = useMockpitStore.getState().activeView;
      const screens = useMockpitStore.getState().screens;
      const setActiveView = useMockpitStore.getState().setActiveView;

      const currentScreen = screens.find((s) => s.id === activeView);
      const targetParentId = currentScreen?.parentId ? currentScreen.parentId : currentScreen?.id;
      const parentScreen = screens.find((s) => s.id === targetParentId);
      const childScreens = screens.filter((s) => s.parentId === targetParentId);

      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.subnav;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined }}
        >
          <ComponentHeader
            type="subnav"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              parentScreen ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-bold uppercase">
                  {parentScreen.name}
                </span>
              ) : null
            }
          />

          {childScreens.length === 0 ? (
            <div className="flex-1 my-1 flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-center">
              <span className="text-xs font-mono font-bold text-slate-400">No Child Screens</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 max-w-xs">
                Add child screens under "{parentScreen?.name || 'this screen'}" via the screen hierarchy menu to populate tabs dynamically.
              </span>
            </div>
          ) : (
            <div className="flex-1 my-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1">
              {childScreens.map((child) => {
                const isTabActive = activeView === child.id;
                return (
                  <button
                    key={child.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveView(child.id);
                    }}
                    className={`flex-1 min-w-[85px] py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isTabActive
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.3)] scale-102'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{child.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-[9px] text-slate-500 font-mono text-center pt-1 border-t border-slate-800/60 flex items-center justify-between">
            <span>DYNAMIC SUB-NAV BAR</span>
            <span className="text-sky-400/80 font-bold">{childScreens.length} TABS</span>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="w-full h-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white">
          {component.type}
        </div>
      );
  }
};
