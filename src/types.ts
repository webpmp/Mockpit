export type GearState = 'P' | 'R' | 'N' | 'D';
export type DriveModeState = 'Eco' | 'Normal' | 'Sport';

export type VehicleBackgroundPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type VehicleBackgroundBlendMode = 'auto' | 'normal' | 'multiply';

export interface VehicleBackgroundSettings {
  enabled: boolean;
  vehicle: string | null;
  opacity: number;
  blur: number;
  position: VehicleBackgroundPosition;
  scale: number;
  blendMode: VehicleBackgroundBlendMode;
}

export type GridConfig = {
  visible: boolean;
  size: number;
  color: string;
  opacity: number;
  snapToGrid: boolean;
  bgImage?: string;
  bgOpacity?: number;
};

export type PalettePresetId = 'cyberSky' | 'neonAmber' | 'electricViolet' | 'emeraldMint' | 'custom';

export type PaletteConfig = {
  id: PalettePresetId;
  name: string;
  primary: string;   // Hex e.g. "#38bdf8"
  secondary: string; // Hex e.g. "#3b82f6"
  tertiary: string;  // Hex e.g. "#10b981"
};

export const BUILTIN_PALETTES: Record<Exclude<PalettePresetId, 'custom'>, PaletteConfig> = {
  cyberSky: {
    id: 'cyberSky',
    name: 'Cyber Sky',
    primary: '#38bdf8',
    secondary: '#3b82f6',
    tertiary: '#10b981',
  },
  neonAmber: {
    id: 'neonAmber',
    name: 'Neon Amber',
    primary: '#f59e0b',
    secondary: '#f97316',
    tertiary: '#ef4444',
  },
  electricViolet: {
    id: 'electricViolet',
    name: 'Electric Violet',
    primary: '#a855f7',
    secondary: '#ec4899',
    tertiary: '#06b6d4',
  },
  emeraldMint: {
    id: 'emeraldMint',
    name: 'Emerald Mint',
    primary: '#10b981',
    secondary: '#14b8a6',
    tertiary: '#38bdf8',
  },
};

export type VehicleState = {
  gear: GearState;
  speed: number;          // 0 - 120 mph/kmh
  batteryPercent: number; // 0 - 100 %
  isCharging: boolean;
  doorOpen: boolean;
  driveMode: DriveModeState;
  signalBars?: number;    // 1 - 5 bars
  mapLat?: number;        // dynamic map center latitude
  mapLng?: number;        // dynamic map center longitude
  cruiseControlActive?: boolean;
  cruiseSetSpeed?: number;
};

export type BindingCondition = '<' | '>' | '=' | '!=' | '>=' | '<=';

export type TargetProp = 'color' | 'visible' | 'text' | 'icon' | 'severity';

export type Binding = {
  id: string;
  stateField: keyof VehicleState;
  condition: BindingCondition;
  value: string | number | boolean;
  targetProp: TargetProp;
  targetValue: string; // What to set targetProp to when condition is met
};

export type ComponentType =
  | 'battery'
  | 'gear'
  | 'speed'
  | 'warning'
  | 'charging'
  | 'map'
  | 'media'
  | 'climate'
  | 'phone'
  | 'driveMode'
  | 'tirePressure'
  | 'navHome'
  | 'navDestination'
  | 'navSearch'
  | 'navTripEstimate'
  | 'subnav';

export type ComponentInstance = {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  staticProps: Record<string, string>;
  bindings: Binding[];
  zIndex?: number;
  isTransient?: boolean;
};

export type Project = {
  components: ComponentInstance[];
};

export type ScreenMode = 'editor' | 'presentation';

export type TransitionStyle = 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'fade';

export type ScreenDefinition = {
  id: string;
  name: string;
  order: number;
  transitionStyle: TransitionStyle;
  icon?: string;
  parentId: string | null;
};

export type ActiveView = string;
export type ScreenId = string;

export type CopiedComponentState = {
  component: ComponentInstance;
  sourceScreen: string;
} | null;

export type ComponentCategory = 'standard' | 'notification';

export const getComponentCategory = (type: ComponentType): ComponentCategory => {
  if (type === 'warning') return 'notification';
  return 'standard';
};

export type NotificationStackPosition = 'top-center' | 'top-right' | 'bottom-center';

export type ComponentsByScreen = Record<string, ComponentInstance[]>;

/**
 * App Screen vs Instrument Widget classification:
 * App Screens: Navigation Map, Media Player, Phone/Contacts (isAppScreen = true)
 * Instrument Widgets: Battery, Gear, Speed, Warning, Charging, Drive Mode, Tire Pressure
 */
export const APP_SCREEN_VIEWS: Record<string, string> = {
  map: 'navigation',
  media: 'media',
  phone: 'phone',
};

export const isAppScreen = (type: ComponentType): boolean => {
  return type in APP_SCREEN_VIEWS;
};
