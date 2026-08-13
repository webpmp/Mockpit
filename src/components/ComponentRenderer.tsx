import React, { useEffect, useRef } from 'react';
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
import { MusicMediaPlayer } from './MusicMediaPlayer';
import { MockpitInput } from './MockpitInput';
import { OverheadDrivingVisualization } from './OverheadDrivingVisualization';
import { PhoneContactsWidget } from './phone/PhoneContactsWidget';
import { PhoneDialPadWidget } from './phone/PhoneDialPadWidget';
import { PhoneMessagingWidget } from './phone/PhoneMessagingWidget';
import { ClimateVentWidget } from './climate/ClimateVentWidget';
import { ClimateTempWidget } from './climate/ClimateTempWidget';
import { ClimateSeatsWidget } from './climate/ClimateSeatsWidget';
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
  battery: 'Battery Indicator',
  gear: 'Gear Select',
  speed: 'Speed Readout',
  warning: 'Warning Alert Overlay',
  charging: 'Charging Status',
  map: 'Navigation Map',
  media: 'Music Media Player',
  climate: 'Climate Control',
  phone: 'Phone & Contacts',
  driveMode: 'Drive Mode Selector',
  tirePressure: 'Tire Pressure Monitor',
  navHome: 'Home Location',
  navDestination: 'Trip Planner Component',
  navSearch: 'Navigation Search Component',
  navTripEstimate: 'Trip Estimate',
  overheadVisualization: 'Overhead Driving Visualization',
  phoneContacts: 'Contacts',
  phoneDialPad: 'Dial Pad',
  phoneMessaging: 'Messaging',
  climateVent: 'Vent Dashboard',
  climateTemp: 'Temperature',
  climateSeats: 'Seat Climate',
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
    <div className={`flex items-center justify-between text-[0.625rem] font-bold tracking-wider text-slate-400 uppercase z-10 shrink-0 select-none pb-1.5 border-b border-slate-800/60 ${className}`}>
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

const NavHomeWidget: React.FC<{
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity?: number;
}> = ({ component, resolved, isSelected, customColor, baseOpacity, styleOpacity }) => {
  const initialAddress = resolved.address || component.staticProps?.address || '1234 Silicon Way, San Jose, CA 95134';
  const [address, setAddress] = React.useState(initialAddress);
  const coords = resolved.coords || component.staticProps?.coords || '37.3861° N, 122.0839° W';
  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navHome;

  return (
    <div
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="navHome"
        label={headerLabel}
        customColor={customColor}
        rightElement={
          <span className="text-[0.5625rem] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-semibold">
            SAVED
          </span>
        }
      />

      <div className="flex-1 min-h-0 my-1.5 space-y-1.5 flex flex-col justify-center">
        <MockpitInput
          value={address}
          onChange={setAddress}
          placeholder="Enter Home address..."
          componentId={component.id}
          keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
          icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
        />
        <div className="text-[0.625rem] text-slate-400 font-mono pl-1">
          Coordinates: <span className="text-slate-300">{coords}</span>
        </div>
      </div>

      <button
        onClick={() => alert(`Starting route to Home: ${address}`)}
        className="w-full py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
      >
        <Navigation className="w-3.5 h-3.5 text-slate-400" /> Navigate Home
      </button>
    </div>
  );
};

const NavDestinationWidget: React.FC<{
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity?: number;
}> = ({ component, resolved, isSelected, customColor, baseOpacity, styleOpacity }) => {
  const initialPrimaryDest = resolved.destination || component.staticProps?.destination || 'Yosemite National Park Valley';
  const [primaryDest, setPrimaryDest] = React.useState(initialPrimaryDest);
  const initialWaypoints = component.staticProps?.waypoints
    ? JSON.parse(component.staticProps.waypoints)
    : ['Stop 1: EV Supercharger Bay (12 mins)', 'Stop 2: Scenic Overlook Rest Area'];
  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navDestination;

  return (
    <div
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="navDestination"
        label={headerLabel}
        customColor={customColor}
        rightElement={
          <span className="text-[0.5625rem] font-mono text-slate-400">{initialWaypoints.length + 1} STOPS</span>
        }
      />

      <div className="flex-1 min-h-0 my-1.5 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
        <MockpitInput
          value={primaryDest}
          onChange={setPrimaryDest}
          placeholder="Primary Destination..."
          componentId={component.id}
          keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
          icon={<Flag className="w-3.5 h-3.5 text-slate-400" />}
        />

        {initialWaypoints.map((wp: string, i: number) => (
          <div key={i} className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-[0.6875rem] text-slate-300">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[0.5625rem] font-bold font-mono flex items-center justify-center text-slate-400 shrink-0">
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
          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-700"
        >
          <Navigation className="w-3.5 h-3.5 text-slate-400" /> Start Guidance
        </button>
      </div>
    </div>
  );
};

const NavSearchWidget: React.FC<{
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity?: number;
}> = ({ component, resolved, isSelected, customColor, baseOpacity, styleOpacity }) => {
  const [query, setQuery] = React.useState('');
  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navSearch;

  const samplePOIs = [
    { name: 'Tesla Supercharger - 250kW', status: '8/12 Open', dist: '1.2 mi' },
    { name: 'Electrify America - 350kW', status: '4/6 Open', dist: '2.4 mi' },
    { name: 'Starbucks Coffee Drive-thru', status: 'Open Now', dist: '0.8 mi' },
  ];

  const filteredPOIs = query.trim()
    ? samplePOIs.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : samplePOIs;

  return (
    <div
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="navSearch"
        label={headerLabel}
        customColor={customColor}
        rightElement={
          <span className="text-[0.5625rem] font-mono text-slate-400">NEARBY</span>
        }
      />

      <div className="my-1">
        <MockpitInput
          value={query}
          onChange={setQuery}
          placeholder="Search EV chargers, food, parking..."
          componentId={component.id}
          keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
          icon={<Search className="w-3.5 h-3.5 text-slate-500" />}
        />
      </div>

      <div className="flex-1 min-h-0 my-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
        {filteredPOIs.length === 0 ? (
          <div className="text-[0.6875rem] text-slate-500 italic p-1">No matching results</div>
        ) : (
          filteredPOIs.map((poi, idx) => (
            <div
              key={idx}
              onClick={() => alert(`Selected POI: ${poi.name}`)}
              className="p-1.5 rounded-lg bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="min-w-0 pr-1">
                <div className="text-[0.6875rem] font-bold text-slate-200 truncate">{poi.name}</div>
                <div className="text-[0.5625rem] text-emerald-400 font-mono">{poi.status}</div>
              </div>
              <span className="text-[0.625rem] font-mono text-slate-400 shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {poi.dist}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="text-[0.5625rem] text-slate-500 font-mono text-center pt-1 border-t border-slate-800/60">
        FILTERED SAMPLE POIS
      </div>
    </div>
  );
};

interface TirePressureWidgetProps {
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
}

const TirePressureWidget: React.FC<TirePressureWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
}) => {
  const flStr = resolved.frontLeft || '35 PSI';
  const frStr = resolved.frontRight || '35 PSI';
  const rlStr = resolved.rearLeft || '36 PSI';
  const rrStr = resolved.rearRight || '36 PSI';
  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.tirePressure;

  const warningThresh = Number(component.staticProps?.warningThreshold) || 31;
  const criticalThresh = Number(component.staticProps?.criticalThreshold) || 27;

  const parsePsi = (val: string) => {
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 35 : num;
  };

  const tires = [
    { code: 'FL', label: 'Front Left', str: flStr, psi: parsePsi(flStr) },
    { code: 'FR', label: 'Front Right', str: frStr, psi: parsePsi(frStr) },
    { code: 'RL', label: 'Rear Left', str: rlStr, psi: parsePsi(rlStr) },
    { code: 'RR', label: 'Rear Right', str: rrStr, psi: parsePsi(rrStr) },
  ];

  const getStatus = (psi: number) => {
    if (psi <= criticalThresh) return 'critical';
    if (psi <= warningThresh) return 'warning';
    return 'normal';
  };

  const triggeredRef = useRef<Record<string, string>>({});

  useEffect(() => {
    tires.forEach((tire) => {
      const status = getStatus(tire.psi);
      const prevStatus = triggeredRef.current[tire.code];

      if (status !== 'normal' && status !== prevStatus) {
        triggeredRef.current[tire.code] = status;
        useMockpitStore.getState().triggerNotification({
          message: `${status === 'critical' ? 'CRITICAL' : 'LOW'} TIRE PRESSURE: ${tire.code} (${tire.psi} PSI)`,
          icon: 'alert-triangle',
          color: status === 'critical' ? '#ef4444' : '#f59e0b',
          severity: status,
        });
      } else if (status === 'normal' && prevStatus) {
        delete triggeredRef.current[tire.code];
      }
    });
  }, [flStr, frStr, rlStr, rrStr, warningThresh, criticalThresh]);

  return (
    <div
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="tirePressure"
        label={headerLabel}
        customColor={customColor}
      />

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2 my-1 text-center items-center">
        {tires.map((tire) => {
          const status = getStatus(tire.psi);
          let containerClasses = 'p-2 rounded-xl border transition-all duration-300 flex flex-col justify-center items-center';
          let labelClasses = 'text-[0.625rem] block font-mono font-bold';
          let valClasses = 'text-xs font-black font-mono';

          if (status === 'critical') {
            containerClasses += ' bg-red-950/60 border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse';
            labelClasses += ' text-red-400';
            valClasses += ' text-red-300';
          } else if (status === 'warning') {
            containerClasses += ' bg-amber-950/50 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
            labelClasses += ' text-amber-400';
            valClasses += ' text-amber-300';
          } else {
            containerClasses += ' bg-slate-950/60 border-slate-800/80';
            labelClasses += ' text-slate-500';
            valClasses += ' text-slate-100';
          }

          return (
            <div key={tire.code} className={containerClasses}>
              <div className="flex items-center gap-1 justify-center">
                <span className={labelClasses}>{tire.code}</span>
                {status !== 'normal' && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === 'critical' ? 'bg-red-500 animate-ping' : 'bg-amber-400'
                    }`}
                  />
                )}
              </div>
              <span className={valClasses}>{tire.str}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
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

  if (!isVisible && isPresentation) {
    return null;
  }

  // Parse configured opacity (if present in staticProps or resolved props)
  let configuredOpacity: number | undefined = undefined;
  if (resolved.opacity !== undefined) {
    const parsed = parseFloat(String(resolved.opacity).replace('%', ''));
    if (!isNaN(parsed)) {
      configuredOpacity = parsed > 1 ? parsed / 100 : parsed;
    }
  } else if (component.staticProps?.opacity !== undefined) {
    const parsed = parseFloat(String(component.staticProps.opacity).replace('%', ''));
    if (!isNaN(parsed)) {
      configuredOpacity = parsed > 1 ? parsed / 100 : parsed;
    }
  }

  // Editor mode: force 100% opacity (opacity: 1) regardless of state, bindings, or configured opacity.
  // Presentation mode: use configured opacity if present, otherwise 1.
  const styleOpacity = isPresentation
    ? (configuredOpacity !== undefined ? configuredOpacity : 1)
    : 1;

  const baseOpacity = 'opacity-100';
  const customColor = resolved.color || 'var(--color-primary)';

  switch (component.type) {
    case 'battery': {
      const percent = vehicleState.batteryPercent;
      const roundedPercent = Math.round(percent);
      const textVal = resolved.text
        ? resolved.text.replace(/(\d+\.\d+)%/g, (_, num) => `${Math.round(parseFloat(num))}%`)
        : `${roundedPercent}%`;
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.battery;

      const maxRangeMiles = Number(component.staticProps?.maxRange) || 350;
      const liveRange = Math.round((percent / 100) * maxRangeMiles);

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="battery"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              vehicleState.isCharging ? (
                vehicleState.batteryPercent >= 100 ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-[0.625rem] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    <Check className="w-3 h-3 text-emerald-400" />
                    CHARGING COMPLETE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold animate-pulse text-[0.625rem] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Zap className="w-3 h-3 fill-emerald-400" />
                    CHARGING
                  </span>
                )
              ) : (
                <span className="text-[0.625rem] font-mono font-bold text-slate-400 uppercase">
                  {liveRange} MILE RANGE
                </span>
              )
            }
          />

          <div className="flex items-baseline justify-between my-1">
            <div className="text-3xl font-black tracking-tight" style={{ color: customColor }}>
              {textVal}
            </div>
            {vehicleState.isCharging && (
              <div className="text-xs text-slate-400 font-mono">
                350 kW DC Fast
              </div>
            )}
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
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="gear"
            label={headerLabel}
            customColor={customColor}
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
            style={{ containerType: 'size', borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
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
            style={{ containerType: 'size', borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
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

            <div className="w-full flex justify-end items-center text-slate-500 font-mono z-10 border-t border-slate-800/80 pt-1.5 shrink-0" style={{ fontSize: 'clamp(8px, 4.2cqmin, 16px)' }}>
              {vehicleState.cruiseControlActive && (
                <span className="text-emerald-400 font-bold ml-auto">CRUISE SET</span>
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
          style={{ containerType: 'size', borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
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

          <div className="w-full flex justify-end items-center text-slate-500 font-mono z-10 border-t border-slate-800/80 pt-2 shrink-0" style={{ fontSize: 'clamp(8px, 4.2cqmin, 16px)' }}>
            {vehicleState.cruiseControlActive && (
              <span className="text-emerald-400 font-bold ml-auto">CRUISE SET</span>
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
            opacity: styleOpacity,
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
      if (forceDismissCharging && isPresentation) {
        return null;
      }

      const roundedPercent = Math.round(vehicleState.batteryPercent);
      const targetPercent = Math.min(100, Math.max(1, Number(component.staticProps?.targetChargePercent) || 80));
      const chargeRateKw = Number(component.staticProps?.chargeRateKw) || 350;
      const isComplete = isChargingComplete || roundedPercent >= 100;

      const displayLabel = isComplete
        ? 'CHARGING COMPLETE'
        : (resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.charging);

      const badgeColor = isComplete ? '#10b981' : customColor;

      let timeString = '';
      if (!vehicleState.isCharging) {
        timeString = 'Not Charging';
      } else if (roundedPercent >= targetPercent) {
        timeString = targetPercent === 100 ? 'Fully Charged' : `Target ${targetPercent}% Reached`;
      } else {
        const remainingPercent = targetPercent - roundedPercent;
        const remainingKwh = (remainingPercent / 100) * 75;
        const remainingHours = remainingKwh / chargeRateKw;
        const remainingMins = Math.max(1, Math.round(remainingHours * 60));
        timeString = `~${remainingMins} min${remainingMins === 1 ? '' : 's'} to ${targetPercent}%`;
      }

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{
            borderColor: badgeColor,
            boxShadow: isVisible || isComplete ? `0 0 20px ${getAlphaColor(badgeColor, '30', 20)}` : undefined,
            opacity: styleOpacity,
          }}
        >
          <ComponentHeader
            type="charging"
            label={displayLabel}
            customColor={badgeColor}
          />

          <div className="flex items-center gap-3.5 my-1">
            <div
              className="p-2.5 rounded-xl shrink-0 border flex items-center justify-center"
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

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight" style={{ color: badgeColor }}>
                  {roundedPercent}%
                </span>
                <span className="text-xs font-mono font-semibold text-slate-300 truncate">
                  {timeString}
                </span>
              </div>

              <div className="text-[0.625rem] text-slate-400 font-mono mt-0.5">
                {vehicleState.isCharging ? `${chargeRateKw} kW Charge Rate` : 'Plug in to start charging'}
              </div>
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
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="map"
            label={headerLabel}
            customColor={customColor}
            className="px-3 pt-3"
            rightElement={
              <span className="text-[0.5625rem] font-mono text-slate-500">
                {lat.toFixed(2)}°, {lng.toFixed(2)}°
              </span>
            }
          />

          <div className="flex-1 w-full overflow-hidden relative z-0">
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
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.media;

      return (
        <MusicMediaPlayer
          component={component}
          isSelected={isSelected}
          customColor={customColor}
          styleOpacity={styleOpacity}
          headerLabel={headerLabel}
        />
      );
    }

    case 'climate': {
      const temp = resolved.temp || '72°F';
      const fanSpeed = resolved.fanSpeed || 'Auto 3';
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.climate;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="climate"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[0.5625rem] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-semibold">
                DUAL AC
              </span>
            }
          />

          <div className="flex-1 min-h-0 flex items-center justify-between my-1">
            <div className="text-3xl font-black text-slate-100 tracking-tight">{temp}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
              <Fan className="w-3.5 h-3.5 text-slate-400" />
              <span>{fanSpeed}</span>
            </div>
          </div>

          <div className="text-[0.625rem] text-slate-500 font-mono flex justify-between pt-1 border-t border-slate-800/60">
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
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="phone"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[0.5625rem] text-emerald-400 font-mono">CONNECTED</span>
            }
          />

          <div className="flex-1 min-h-0 my-1 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
              {contact.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-100 truncate">{contact}</div>
              <div className="text-xs text-slate-400 font-mono truncate">{number}</div>
            </div>
          </div>

          <div className="text-[0.625rem] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
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
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="driveMode"
            label={headerLabel}
            customColor={customColor}
          />

          <div className="grid grid-cols-3 gap-1.5 my-auto">
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
        </div>
      );
    }

    case 'tirePressure': {
      return (
        <TirePressureWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'navHome': {
      return (
        <NavHomeWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'navDestination': {
      return (
        <NavDestinationWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'navSearch': {
      return (
        <NavSearchWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
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
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="navTripEstimate"
            label={headerLabel}
            customColor={customColor}
          />

          <div className="grid grid-cols-2 gap-1.5 my-auto">
            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase">Distance</span>
              <span className="text-xs font-bold text-slate-100 font-mono">{distance}</span>
            </div>

            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase">Est. Time</span>
              <span className="text-xs font-bold text-slate-100 font-mono">{duration}</span>
            </div>

            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase">Energy Req.</span>
              <span className="text-[0.6875rem] font-bold text-slate-100 font-mono">{energyEst}</span>
            </div>

            <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase">Arrival Charge</span>
              <span className="text-[0.6875rem] font-bold text-emerald-400 font-mono">{arrBattery}</span>
            </div>
          </div>
        </div>
      );
    }

    case 'overheadVisualization': {
      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-950 border border-slate-800 flex flex-col overflow-hidden shadow-xl ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <OverheadDrivingVisualization
            component={component}
            vehicleState={vehicleState}
            isSelected={isSelected}
            isPresentation={isPresentation}
          />
        </div>
      );
    }

    case 'phoneContacts': {
      return (
        <PhoneContactsWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'phoneDialPad': {
      return (
        <PhoneDialPadWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'phoneMessaging': {
      return (
        <PhoneMessagingWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'climateVent': {
      return (
        <ClimateVentWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'climateTemp': {
      return (
        <ClimateTempWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'climateSeats': {
      return (
        <ClimateSeatsWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    default:
      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white ${baseOpacity}`}
          style={{ opacity: styleOpacity }}
        >
          {component.type}
        </div>
      );
  }
};
