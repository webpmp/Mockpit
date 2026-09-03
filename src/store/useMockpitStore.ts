import { create } from 'zustand';
import { SEED_COMPONENTS } from '../data/seedProject';
import {
  ActiveInputState,
  ActiveView,
  Binding,
  BUILTIN_PALETTES,
  ComponentInstance,
  ComponentType,
  CopiedComponentState,
  getComponentCategory,
  GridConfig,
  KeyboardSlideDirection,
  NotificationStackPosition,
  PaletteConfig,
  PalettePresetId,
  ScreenDefinition,
  ScreenMode,
  TransitionStyle,
  VehicleState,
  VehicleBackgroundSettings,
  EgoVehicleType,
  TextScalePreset,
  TEXT_SCALE_FACTORS,
  VehicleStatusConnector,
  JourneyState,
  ManeuverStep,
  ManeuverType,
  TripStop,
  ActiveTrip,
  POISearchResult,
  FavoriteLocation,
  ClimateState,
  ClimateFanSpeed,
  ClimateSeat,
} from '../types';

import {
  TempGradientColors,
  DEFAULT_TEMP_GRADIENT_COLORS,
} from '../utils/tempGradient';
import { Conversation, INITIAL_CONVERSATIONS, CONTACT_PHOTO_MAP } from '../data/mockPhoneData';
import { MusicServiceType, MUSIC_SERVICES } from '../data/mediaData';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { useWeatherStore } from './useWeatherStore';
import {
  DisplayConfig,
  DEFAULT_DISPLAY_CONFIG,
  InteractionLogEntry,
} from '../lib/hmiRules/registry';
import {
  recordRuntimeInteraction as recordRuntimeLoggerEntry,
  clearRuntimeLog as clearRuntimeLogger,
} from '../lib/hmiRules/runtimeInstrumenter';
import {
  CoverArtCacheEntry,
  CoverArtStatus,
  loadSavedCoverArtCache,
  saveCoverArtCache,
  getCoverArtCacheKey,
  searchReleaseGroupQueued,
  coverArtUrl,
} from '../services/musicBrainzService';

const LOCAL_STORAGE_KEY = 'mockpit_components_v1';
const LOCAL_STORAGE_KEY_V2 = 'mockpit_components_by_screen_v2';
const LOCAL_STORAGE_NOTIFICATIONS_KEY = 'mockpit_notification_components_v1';
const LOCAL_STORAGE_STACK_POS_KEY = 'mockpit_notification_stack_pos_v1';
const LOCAL_STORAGE_STATE_KEY = 'mockpit_vehicle_state_v1';
const LOCAL_STORAGE_DOCK_ORDER_KEY = 'mockpit_dock_order_v1';
const LOCAL_STORAGE_SCREENS_KEY = 'mockpit_screens_v1';
const LOCAL_STORAGE_PALETTE_KEY = 'mockpit_palette_v1';
const LOCAL_STORAGE_TEXT_SCALE_KEY = 'mockpit_text_scale_v1';
const LOCAL_STORAGE_GRID_KEY = 'mockpit_grid_config_v1';
const LOCAL_STORAGE_VEHICLE_BG_KEY = 'mockpit_vehicle_bg_config_v1';
const LOCAL_STORAGE_KEYBOARD_DIRECTION_KEY = 'mockpit_keyboard_slide_direction_v1';
const LOCAL_STORAGE_EGO_VEHICLE_TYPE_KEY = 'mockpit_ego_vehicle_type_v1';
const LOCAL_STORAGE_TEMP_GRADIENT_KEY = 'mockpit_temp_gradient_v1';
const LOCAL_STORAGE_ACTIVE_TRIP_KEY = 'mockpit_active_trip_v1';
const LOCAL_STORAGE_FAVORITES_KEY = 'mockpit_favorites_v1';
const LOCAL_STORAGE_RECENTS_KEY = 'mockpit_recents_v1';
const LOCAL_STORAGE_CLIMATE_STATE_KEY = 'mockpit_climate_state_v1';
const LOCAL_STORAGE_DISPLAY_CONFIG_KEY = 'mockpit_display_config_v1';
const LOCAL_STORAGE_HMI_AUDIT_NOTES_KEY = 'mockpit_hmi_audit_notes_v1';
const LOCAL_STORAGE_SELECTED_MUSIC_SERVICE_KEY = 'mockpit_selected_music_service_v1';

const loadSavedSelectedMusicService = (): MusicServiceType => {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_SELECTED_MUSIC_SERVICE_KEY);
    if (val && (MUSIC_SERVICES as readonly string[]).includes(val)) {
      return val as MusicServiceType;
    }
  } catch (e) {
    console.error('Failed to load selected music service from localStorage', e);
  }
  return 'Spotify';
};

const DEFAULT_FAVORITES: FavoriteLocation[] = [
  {
    id: 'fav-home',
    label: 'Home',
    address: '1 Apple Park Way, Cupertino, CA',
    lat: 37.3346,
    lng: -122.0090,
    geocoded: true,
  },
  {
    id: 'fav-work',
    label: 'Work',
    address: 'San Jose, CA',
    lat: 37.3382,
    lng: -121.8863,
    geocoded: true,
  },
];

export const computeInitialClimateState = (): ClimateState => {
  let initialHeat = 0;
  let initialCool = 0;
  try {
    const weatherState = useWeatherStore.getState();
    const current = weatherState?.current;
    if (current && typeof current.temperature === 'number') {
      const tempF = weatherState.unit === 'C' ? (current.temperature * 9) / 5 + 32 : current.temperature;
      if (tempF > 72) {
        initialCool = 1;
        initialHeat = 0;
      } else {
        initialHeat = 1;
        initialCool = 0;
      }
    }
  } catch {
    initialHeat = 0;
    initialCool = 0;
  }

  return {
    driverTemp: 72,
    passengerTemp: 72,
    isSynced: true,
    selectedSeat: 'driver',
    fanSpeed: 'AUTO',
    driverSeatHeat: initialHeat,
    driverSeatCool: initialCool,
    passengerSeatHeat: initialHeat,
    passengerSeatCool: initialCool,
    driverLastHeat: initialHeat > 0 ? initialHeat : 2,
    driverLastCool: initialCool > 0 ? initialCool : 2,
    passengerLastHeat: initialHeat > 0 ? initialHeat : 2,
    passengerLastCool: initialCool > 0 ? initialCool : 2,
    driverTargetMode: initialCool > 0 ? 'cool' : 'heat',
    passengerTargetMode: initialCool > 0 ? 'cool' : 'heat',
  };
};

export const INITIAL_CLIMATE_STATE: ClimateState = computeInitialClimateState();

const loadSavedClimateState = (): ClimateState => {
  const initial = computeInitialClimateState();
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_CLIMATE_STATE_KEY);
    if (val) {
      const parsed = JSON.parse(val);
      if (typeof parsed.driverTemp === 'number') {
        return {
          ...initial,
          ...parsed,
          isSynced: parsed.isSynced !== undefined ? parsed.isSynced : true,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load climate state from localStorage', e);
  }
  return initial;
};

const loadSavedFavorites = (): FavoriteLocation[] => {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
    if (val) {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load favorites from localStorage', e);
  }
  return DEFAULT_FAVORITES;
};

const loadSavedRecents = (): FavoriteLocation[] => {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_RECENTS_KEY);
    if (val) {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load recents from localStorage', e);
  }
  return [];
};

const loadSavedActiveTrip = (): ActiveTrip | null => {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_ACTIVE_TRIP_KEY);
    if (val) {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed.destinationName === 'string') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load active trip from localStorage', e);
  }
  return null;
};

const loadSavedTempGradientColors = (): TempGradientColors => {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_TEMP_GRADIENT_KEY);
    if (val) {
      const parsed = JSON.parse(val);
      if (parsed && parsed.cold && parsed.neutral && parsed.hot) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load temp gradient colors from localStorage', e);
  }
  return DEFAULT_TEMP_GRADIENT_COLORS;
};

const loadSavedEgoVehicleType = (): EgoVehicleType => {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_EGO_VEHICLE_TYPE_KEY);
    if (val && ['compactSedan', 'midsizeSedan', 'luxurySedan', 'truck', 'coupe'].includes(val)) {
      return val as EgoVehicleType;
    }
  } catch (e) {
    console.error('Failed to load ego vehicle type from localStorage', e);
  }
  return 'midsizeSedan';
};

export const getSpeedReadoutMaxSpeed = (state: {
  components?: ComponentInstance[];
  componentsByScreen?: Record<string, ComponentInstance[]>;
  notificationComponents?: ComponentInstance[];
}): number => {
  const allComponents = [
    ...(state.components || []),
    ...Object.values(state.componentsByScreen || {}).flat(),
    ...(state.notificationComponents || []),
  ];
  const speedComponent = allComponents.find((c) => c.type === 'speed');
  if (speedComponent?.staticProps?.maxSpeed) {
    const parsed = Number(speedComponent.staticProps.maxSpeed);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 140;
};

const loadSavedKeyboardSlideDirection = (): KeyboardSlideDirection => {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEYBOARD_DIRECTION_KEY);
    if (val && ['bottom', 'top', 'left', 'right'].includes(val)) {
      return val as KeyboardSlideDirection;
    }
  } catch (e) {
    console.error('Failed to load keyboard slide direction from localStorage', e);
  }
  return 'bottom';
};

export const DEFAULT_SCREENS: ScreenDefinition[] = [
  { id: 'home', name: 'Home', order: 0, transitionStyle: 'fade', parentId: null },
  { id: 'navigation', name: 'Navigation', order: 1, transitionStyle: 'fade', parentId: null },
  { id: 'media', name: 'Media', order: 2, transitionStyle: 'fade', parentId: null },
  { id: 'phone', name: 'Phone', order: 3, transitionStyle: 'fade', parentId: null },
  { id: 'playlists', name: 'Playlists', order: 4, transitionStyle: 'fade', parentId: 'media' },
  { id: 'favorites', name: 'Favorites', order: 5, transitionStyle: 'fade', parentId: 'navigation' },
  { id: 'weather', name: 'Weather', order: 6, transitionStyle: 'fade', parentId: null },
  { id: 'weather-radar', name: 'Radar', order: 7, transitionStyle: 'fade', parentId: 'weather' },
];

export const REQUIRED_DOCK_SCREEN_IDS: string[] = ['home', 'navigation', 'media', 'phone'];
export const DEFAULT_DOCK_ORDER: string[] = ['home', 'navigation', 'media', 'phone'];

const INITIAL_VEHICLE_STATE: VehicleState = {
  gear: 'P',
  speed: 0,
  batteryPercent: 80,
  isCharging: false,
  doorOpen: false,
  driveMode: 'Normal',
  headlights: 'Off',
  signalBars: 4,
  mapLat: 37.3318,
  mapLng: -122.0311,
  cruiseControlActive: false,
  blindSpotWarning: true,
  proximityWarning: true,
  tirePressureWarning: false,
};

export const INITIAL_JOURNEY_STATE: JourneyState = {
  isActive: true,
  currentHighwayName: 'I-280 N',
  previousManeuver: null,
  currentManeuver: {
    id: 'maneuver-1',
    maneuverType: 'slight-right',
    instruction: 'Take exit 12 for Foothill Expressway',
    distanceToManeuver: 0.8,
    distanceUnit: 'mi',
    streetName: 'Foothill Expwy',
    highwayName: 'I-280 N',
    exitNumber: '12',
  },
  nextManeuver: {
    id: 'maneuver-2',
    maneuverType: 'right',
    instruction: 'Turn right onto Foothill Blvd',
    distanceToManeuver: 1.4,
    distanceUnit: 'mi',
    streetName: 'Foothill Blvd',
  },
  routeProgressPercent: 35,
  destinationName: 'Apple Park, Cupertino',
  roadOffset: 0,
};

// Remove warning components from home screen seed components since warning is in notificationComponents
const HOME_SEED_COMPONENTS = SEED_COMPONENTS.filter((c) => c.type !== 'warning');

const DEFAULT_NOTIFICATION_COMPONENTS: ComponentInstance[] = [
  {
    id: 'comp-warning-door-1',
    type: 'warning',
    x: 0,
    y: 0,
    width: 380,
    height: 120,
    staticProps: {
      label: 'DOOR ALERT',
      icon: 'door-open',
      message: 'DRIVER DOOR AJAR',
      details: 'Check and securely close all doors.',
      visible: 'false',
      color: '#f59e0b',
      severity: 'warning',
      triggerMode: 'condition',
    },
    bindings: [
      {
        id: 'bind-door-1',
        stateField: 'doorOpen',
        condition: '=',
        value: true,
        targetProp: 'visible',
        targetValue: 'true',
      },
      {
        id: 'bind-door-2',
        stateField: 'doorOpen',
        condition: '=',
        value: false,
        targetProp: 'visible',
        targetValue: 'false',
      },
    ],
  },
  {
    id: 'comp-warning-battery-1',
    type: 'warning',
    x: 0,
    y: 0,
    width: 380,
    height: 120,
    staticProps: {
      label: 'BATTERY ALERT',
      icon: 'battery-warning',
      message: 'LOW BATTERY',
      details: 'Recharge soon to maintain optimal vehicle systems and range.',
      visible: 'false',
      color: '#ef4444',
      severity: 'critical',
      triggerMode: 'condition',
    },
    bindings: [
      {
        id: 'bind-bat-1',
        stateField: 'batteryPercent',
        condition: '<=',
        value: 20,
        targetProp: 'visible',
        targetValue: 'true',
      },
      {
        id: 'bind-bat-2',
        stateField: 'batteryPercent',
        condition: '>',
        value: 20,
        targetProp: 'visible',
        targetValue: 'false',
      },
    ],
  },
  {
    id: 'comp-warning-tpms-1',
    type: 'warning',
    x: 0,
    y: 0,
    width: 380,
    height: 120,
    staticProps: {
      label: 'TIRE PRESSURE ALERT',
      icon: 'tire',
      message: 'LOW TIRE PRESSURE',
      details: 'Check tire pressures and inspect for punctures.',
      visible: 'false',
      color: '#f59e0b',
      severity: 'warning',
      triggerMode: 'condition',
      showBadgeOnMinimize: 'true',
    },
    bindings: [
      {
        id: 'bind-tpms-1',
        stateField: 'tirePressureWarning',
        condition: '=',
        value: true,
        targetProp: 'visible',
        targetValue: 'true',
      },
      {
        id: 'bind-tpms-2',
        stateField: 'tirePressureWarning',
        condition: '=',
        value: false,
        targetProp: 'visible',
        targetValue: 'false',
      },
    ],
  },
  {
    id: 'comp-warning-cruise-on',
    type: 'warning',
    x: 0,
    y: 0,
    width: 380,
    height: 120,
    staticProps: {
      label: 'CRUISE CONTROL',
      icon: 'gauge',
      message: 'CRUISE CONTROL ENGAGED',
      visible: 'false',
      color: '#10b981',
      severity: 'info',
      triggerMode: 'condition',
      showBadgeOnMinimize: 'true',
    },
    bindings: [
      {
        id: 'bind-cruise-1',
        stateField: 'cruiseControlActive',
        condition: '=',
        value: true,
        targetProp: 'visible',
        targetValue: 'true',
      },
      {
        id: 'bind-cruise-2',
        stateField: 'cruiseControlActive',
        condition: '=',
        value: false,
        targetProp: 'visible',
        targetValue: 'false',
      },
    ],
  },
];

const NAVIGATION_SEED_COMPONENTS: ComponentInstance[] = [];

const MEDIA_SEED_COMPONENTS: ComponentInstance[] = [];

const INITIAL_COMPONENTS_BY_SCREEN: Record<ActiveView, ComponentInstance[]> = {
  home: HOME_SEED_COMPONENTS,
  navigation: NAVIGATION_SEED_COMPONENTS,
  media: MEDIA_SEED_COMPONENTS,
  phone: [],
};

export const DEFAULT_COMPONENT_DIMENSIONS: Record<ComponentType, { width: number; height: number; maxHeight: number }> = {
  battery: { width: 340, height: 140, maxHeight: 1080 },
  gear: { width: 200, height: 140, maxHeight: 1080 },
  speed: { width: 220, height: 160, maxHeight: 1080 },
  warning: { width: 380, height: 140, maxHeight: 1080 },
  map: { width: 440, height: 280, maxHeight: 1080 },
  media: { width: 720, height: 480, maxHeight: 1080 },
  nowPlaying: { width: 420, height: 180, maxHeight: 1080 },
  mediaPlaylists: { width: 540, height: 420, maxHeight: 1080 },
  mediaDiscovery: { width: 620, height: 260, maxHeight: 1080 },
  mediaSearch: { width: 580, height: 220, maxHeight: 1080 },
  climate: { width: 320, height: 150, maxHeight: 1080 },
  phone: { width: 340, height: 150, maxHeight: 1080 },
  driveMode: { width: 320, height: 160, maxHeight: 1080 },
  tirePressure: { width: 380, height: 210, maxHeight: 1080 },
  navHome: { width: 380, height: 160, maxHeight: 1080 },
  navFavorites: { width: 380, height: 260, maxHeight: 1080 },
  navDestination: { width: 380, height: 240, maxHeight: 1080 },
  navSearch: { width: 380, height: 220, maxHeight: 1080 },
  navTripEstimate: { width: 380, height: 200, maxHeight: 1080 },
  overheadVisualization: { width: 780, height: 480, maxHeight: 1080 },
  miniNav: { width: 320, height: 510, maxHeight: 1080 },
  phoneContacts: { width: 420, height: 480, maxHeight: 1080 },
  phoneDialPad: { width: 380, height: 480, maxHeight: 1080 },
  phoneMessaging: { width: 440, height: 480, maxHeight: 1080 },
  climateVent: { width: 460, height: 280, maxHeight: 1080 },
  climateTemp: { width: 220, height: 380, maxHeight: 1080 },
  climateSeats: { width: 380, height: 220, maxHeight: 1080 },
  vehicleExplodedView: { width: 640, height: 420, maxHeight: 1080 },
  vehicleStatusCallout: { width: 320, height: 160, maxHeight: 1080 },
  sendToServiceCenter: { width: 280, height: 100, maxHeight: 1080 },
};

function sanitizeComponentList(list: ComponentInstance[]): ComponentInstance[] {
  return list.map((c) => {
    let updated = { ...c };
    if (typeof updated.height === 'number') {
      updated.height = Math.max(40, Math.min(1080, updated.height));
    }
    if (typeof c.zIndex === 'number') {
      updated.zIndex = Math.max(-10, Math.min(100, c.zIndex));
    }
    return updated;
  });
}

function loadSavedScreens(): ScreenDefinition[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SCREENS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasHome = parsed.some((s: ScreenDefinition) => s.id === 'home');
        if (hasHome) {
          const homeItem = parsed.find((s: ScreenDefinition) => s.id === 'home')!;
          const rest = parsed.filter((s: ScreenDefinition) => s.id !== 'home');
          const combined = [{ ...homeItem, name: 'Home', order: 0, parentId: null }, ...rest];
          const existingIds = new Set(combined.map((s) => s.id));
          const missingDefaults = DEFAULT_SCREENS.filter((def) => !existingIds.has(def.id));
          return [...combined, ...missingDefaults].map((s, idx) => ({
            ...s,
            order: idx,
            parentId: s.parentId ?? null,
          }));
        }
      }
    }
  } catch (e) {
    console.error('Failed to load screens from localStorage', e);
  }
  return DEFAULT_SCREENS;
}

function loadSavedComponentsByScreen(): Record<string, ComponentInstance[]> {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_V2);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.home) {
        const result: Record<string, ComponentInstance[]> = {};
        Object.keys(parsed).forEach((k) => {
          result[k] = sanitizeComponentList(parsed[k] || []);
        });
        if (!result.home || result.home.length === 0) {
          result.home = HOME_SEED_COMPONENTS;
        }
        if (!result.navigation || result.navigation.length === 0) {
          result.navigation = NAVIGATION_SEED_COMPONENTS;
        }
        return result;
      }
    }
    // Migration fallback from v1
    const v1Saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (v1Saved) {
      const parsedV1 = JSON.parse(v1Saved);
      if (Array.isArray(parsedV1) && parsedV1.length > 0) {
        return {
          home: sanitizeComponentList(parsedV1.filter((c: ComponentInstance) => c.type !== 'warning')),
          navigation: NAVIGATION_SEED_COMPONENTS,
          media: [],
          phone: [],
        };
      }
    }
  } catch (e) {
    console.error('Failed to load components by screen from localStorage', e);
  }
  return INITIAL_COMPONENTS_BY_SCREEN;
}

export function evaluateAllTirePressureWarnings(
  componentsByScreen: Record<string, ComponentInstance[]>,
  currentComponents: ComponentInstance[]
): { hasWarning: boolean; critical: boolean; message: string; lowTires: string[] } {
  const allScreensComps = [
    ...currentComponents,
    ...Object.values(componentsByScreen).flat(),
  ];

  const lowTires: string[] = [];
  let isCrit = false;

  for (const comp of allScreensComps) {
    if (comp.type === 'tirePressure') {
      const props = comp.staticProps || {};
      const fl = parseFloat(String(props.frontLeft || '35').replace(/[^0-9.]/g, '')) || 35;
      const fr = parseFloat(String(props.frontRight || '35').replace(/[^0-9.]/g, '')) || 35;
      const rl = parseFloat(String(props.rearLeft || '36').replace(/[^0-9.]/g, '')) || 36;
      const rr = parseFloat(String(props.rearRight || '36').replace(/[^0-9.]/g, '')) || 36;
      const warn = Number(props.warningThreshold) || 31;
      const crit = Number(props.criticalThreshold) || 27;

      if (fl <= warn) {
        lowTires.push(`FL (${fl} PSI)`);
        if (fl <= crit) isCrit = true;
      }
      if (fr <= warn) {
        lowTires.push(`FR (${fr} PSI)`);
        if (fr <= crit) isCrit = true;
      }
      if (rl <= warn) {
        lowTires.push(`RL (${rl} PSI)`);
        if (rl <= crit) isCrit = true;
      }
      if (rr <= warn) {
        lowTires.push(`RR (${rr} PSI)`);
        if (rr <= crit) isCrit = true;
      }
    }
  }

  const hasWarning = lowTires.length > 0;
  const message = hasWarning
    ? `${isCrit ? 'CRITICAL' : 'LOW'} TIRE PRESSURE: ${lowTires.join(', ')}`
    : 'TIRE PRESSURE NORMAL';

  return { hasWarning, critical: isCrit, message, lowTires };
}

function loadSavedNotificationComponents(): ComponentInstance[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_NOTIFICATIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const updated = parsed.map((c: ComponentInstance) => {
          const defaultComp = DEFAULT_NOTIFICATION_COMPONENTS.find((d) => d.id === c.id);
          if (defaultComp) {
            return {
              ...c,
              staticProps: {
                ...defaultComp.staticProps,
                ...c.staticProps,
                details: c.staticProps?.details !== undefined ? c.staticProps.details : defaultComp.staticProps.details,
                label: c.staticProps?.label || defaultComp.staticProps.label,
                icon: c.staticProps?.icon || defaultComp.staticProps.icon,
                triggerMode: c.id === 'comp-warning-cruise-on' ? defaultComp.staticProps?.triggerMode : (c.staticProps?.triggerMode || defaultComp.staticProps?.triggerMode),
                triggerEvent: c.staticProps?.triggerEvent || defaultComp.staticProps?.triggerEvent,
                showBadgeOnMinimize: 'true',
              },
              bindings: c.id === 'comp-warning-cruise-on' ? defaultComp.bindings : (c.bindings && c.bindings.length > 0 ? c.bindings : defaultComp.bindings),
            };
          }
          return c;
        });

        const ids = new Set(updated.map((c: ComponentInstance) => c.id));
        const missingDefaults = DEFAULT_NOTIFICATION_COMPONENTS.filter((def) => !ids.has(def.id));
        if (missingDefaults.length > 0) {
          return [...updated, ...missingDefaults];
        }
        return updated;
      }
    }
  } catch (e) {
    console.error('Failed to load notification components from localStorage', e);
  }
  return DEFAULT_NOTIFICATION_COMPONENTS;
}

function loadSavedStackPosition(): NotificationStackPosition {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_STACK_POS_KEY);
    if (saved && (saved === 'top-center' || saved === 'top-right' || saved === 'bottom-center')) {
      return saved as NotificationStackPosition;
    }
  } catch (e) {
    console.error('Failed to load notification stack position from localStorage', e);
  }
  return 'top-center';
}

function loadSavedVehicleState(): VehicleState {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
    if (saved) {
      return { ...INITIAL_VEHICLE_STATE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load vehicle state from localStorage', e);
  }
  return INITIAL_VEHICLE_STATE;
}

function loadSavedDockOrder(screens: ScreenDefinition[]): string[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DOCK_ORDER_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validTopLevelIds = new Set(screens.filter((s) => s.parentId === null).map((s) => s.id));
        // Drop any saved ids for screens that no longer exist
        const cleaned = parsed.filter((id: string) => validTopLevelIds.has(id));
        // Only force-include required screens if somehow missing; do NOT re-add other optional screens
        const missingRequired = REQUIRED_DOCK_SCREEN_IDS.filter((id) => validTopLevelIds.has(id) && !cleaned.includes(id));
        return [...cleaned, ...missingRequired];
      }
    }
  } catch (e) {
    console.error('Failed to load dock order from localStorage', e);
  }
  // First-ever load / no saved data: fall back to required screens only, not all top-level screens
  return REQUIRED_DOCK_SCREEN_IDS.filter((id) => screens.some((s) => s.id === id));
}

export function applyCssVariables(palette: PaletteConfig) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-secondary', palette.secondary);
    root.style.setProperty('--color-tertiary', palette.tertiary);
  }
}

export function applyTextScaleVariables(scalePreset: TextScalePreset) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const factor = TEXT_SCALE_FACTORS[scalePreset] ?? 1.0;
    root.style.setProperty('--text-scale', String(factor));
    root.style.removeProperty('font-size');
  }
}

function loadSavedTextScale(): TextScalePreset {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_TEXT_SCALE_KEY);
    if (saved && ['small', 'medium', 'large', 'xlarge'].includes(saved)) {
      const preset = saved as TextScalePreset;
      applyTextScaleVariables(preset);
      return preset;
    }
  } catch (e) {
    console.error('Failed to load saved text scale from localStorage', e);
  }
  const defaultScale: TextScalePreset = 'medium';
  applyTextScaleVariables(defaultScale);
  return defaultScale;
}

function loadSavedPalette(): PaletteConfig {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_PALETTE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.primary && parsed.secondary && parsed.tertiary) {
        applyCssVariables(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load saved palette from localStorage', e);
  }
  const defaultPalette = BUILTIN_PALETTES.cyberSky;
  applyCssVariables(defaultPalette);
  return defaultPalette;
}

function loadSavedGridConfig(): GridConfig {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_GRID_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          visible: typeof parsed.visible === 'boolean' ? parsed.visible : true,
          size: typeof parsed.size === 'number' && parsed.size > 0 ? parsed.size : 10,
          color: typeof parsed.color === 'string' ? parsed.color : '#38bdf8',
          opacity: typeof parsed.opacity === 'number' ? Math.max(0, Math.min(100, parsed.opacity)) : 20,
          snapToGrid: typeof parsed.snapToGrid === 'boolean' ? parsed.snapToGrid : false,
          bgImage: typeof parsed.bgImage === 'string' ? parsed.bgImage : '',
          bgOpacity: typeof parsed.bgOpacity === 'number' ? Math.max(0, Math.min(100, parsed.bgOpacity)) : 40,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load grid config from localStorage', e);
  }
  return {
    visible: true,
    size: 10,
    color: '#38bdf8',
    opacity: 20,
    snapToGrid: false,
    bgImage: '',
    bgOpacity: 40,
  };
}

export const DEFAULT_VEHICLE_BACKGROUND: VehicleBackgroundSettings = {
  enabled: true,
  vehicle: null,
  opacity: 8,
  blur: 0,
  position: 'center',
  scale: 100,
  blendMode: 'auto',
};

function loadSavedVehicleBackground(): VehicleBackgroundSettings {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_VEHICLE_BG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        let vehiclePath: string | null = null;
        if (typeof parsed.vehicle === 'string') {
          vehiclePath = parsed.vehicle;
          if (vehiclePath.startsWith('/vehicles/') && !vehiclePath.includes('/processed/')) {
            vehiclePath = vehiclePath.replace('/vehicles/', '/vehicles/processed/');
          }
        } else if (parsed.vehicle === null) {
          vehiclePath = null;
        }
        return {
          enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
          vehicle: vehiclePath,
          opacity: typeof parsed.opacity === 'number' ? Math.max(0, Math.min(15, parsed.opacity)) : 8,
          blur: typeof parsed.blur === 'number' ? Math.max(0, Math.min(20, parsed.blur)) : 0,
          position: parsed.position || 'center',
          scale: typeof parsed.scale === 'number' ? Math.max(20, Math.min(300, parsed.scale)) : 100,
          blendMode: ['auto', 'normal', 'multiply'].includes(parsed.blendMode) ? parsed.blendMode : 'auto',
        };
      }
    }
  } catch (e) {
    console.error('Failed to load vehicle background from localStorage', e);
  }
  return DEFAULT_VEHICLE_BACKGROUND;
}

function loadSavedDisplayConfig(): DisplayConfig {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DISPLAY_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          displayDiagonalInches: Number(parsed.displayDiagonalInches) || DEFAULT_DISPLAY_CONFIG.displayDiagonalInches,
          displayWidthMM: Number(parsed.displayWidthMM) || DEFAULT_DISPLAY_CONFIG.displayWidthMM,
          displayHeightMM: Number(parsed.displayHeightMM) || DEFAULT_DISPLAY_CONFIG.displayHeightMM,
          viewingDistanceMM: Number(parsed.viewingDistanceMM) || DEFAULT_DISPLAY_CONFIG.viewingDistanceMM,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load display config from localStorage', e);
  }
  return DEFAULT_DISPLAY_CONFIG;
}

function loadSavedHmiAuditNotes(): Record<string, Record<string, { status: 'needs-review' | 'reviewed'; note: string }>> {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_HMI_AUDIT_NOTES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load HMI audit notes from localStorage', e);
  }
  return {};
}

interface MockpitStore {
  vehicleState: VehicleState;
  screens: ScreenDefinition[];
  componentsByScreen: Record<string, ComponentInstance[]>;
  notificationComponents: ComponentInstance[];
  transientNotifications: ComponentInstance[];
  activeEventNotifIds: string[];
  notificationStackPosition: NotificationStackPosition;
  components: ComponentInstance[];
  selectedComponentId: string | null;
  screenMode: ScreenMode;
  activeView: ActiveView;
  isDebugOpen: boolean;
  debugPanelHeight: number;
  dockOrder: string[];
  copiedComponent: CopiedComponentState;

  // HMI Compliance Rules & Audit System
  displayConfig: DisplayConfig;
  hmiAuditNotes: Record<string, Record<string, { status: 'needs-review' | 'reviewed'; note: string }>>;
  isAuditPanelOpen: boolean;
  auditTargetScreenId: string;
  runtimeLog: InteractionLogEntry[];
  setAuditPanelOpen: (open: boolean) => void;
  toggleAuditPanel: () => void;
  setAuditTargetScreenId: (screenId: string) => void;
  setAuditNote: (screenId: string, ruleId: string, note: string) => void;
  toggleAuditReviewStatus: (screenId: string, ruleId: string) => void;
  updateDisplayConfig: (partial: Partial<DisplayConfig>) => void;
  addRuntimeLogEntry: (entry: Omit<InteractionLogEntry, 'id' | 'timestamp'>) => void;
  clearRuntimeLog: () => void;

  // Settings, Palette & Canvas Grid
  isSettingsOpen: boolean;
  toggleSettingsModal: () => void;
  setSettingsModalOpen: (open: boolean) => void;
  textScale: TextScalePreset;
  setTextScale: (scale: TextScalePreset) => void;
  activePalette: PaletteConfig;
  setPalette: (palette: PaletteConfig) => void;
  gridConfig: GridConfig;
  setGridConfig: (config: Partial<GridConfig>) => void;
  toggleGridVisibility: () => void;
  toggleSnapToGrid: () => void;
  resnapAllComponentsToGrid: (newSize: number) => void;
  vehicleBackground: VehicleBackgroundSettings;
  setVehicleBackground: (config: Partial<VehicleBackgroundSettings>) => void;
  egoVehicleType: EgoVehicleType;
  setEgoVehicleType: (type: EgoVehicleType) => void;
  tempGradientColors: TempGradientColors;
  setTempGradientColors: (colors: Partial<TempGradientColors>) => void;

  // Shared Climate State & Actions
  climateState: ClimateState;
  setClimateState: (partial: Partial<ClimateState>) => void;

  // On-screen Virtual Keyboard
  keyboardSlideDirection: KeyboardSlideDirection;
  setKeyboardSlideDirection: (dir: KeyboardSlideDirection) => void;
  activeInputState: ActiveInputState;
  isKeyboardVisible: boolean;
  openKeyboard: (inputState: NonNullable<ActiveInputState>) => void;
  closeKeyboard: (options?: { isCancelled?: boolean }) => void;
  updateActiveInputValue: (val: string) => void;
  typeKeyboardKey: (char: string) => void;
  backspaceKeyboardKey: () => void;
  clearKeyboardKey: () => void;

  // Global Messaging State & Actions
  conversations: Conversation[];
  selectedMessagingThreadId: string | null;
  queuedMessageToasts: Array<{
    threadId: string;
    text: string;
    title: string;
  }>;
  setSelectedMessagingThreadId: (id: string | null) => void;
  markThreadAsRead: (threadId: string) => void;
  sendInboundMessage: (threadId: string, text: string) => void;
  sendUserMessage: (threadId: string, text: string) => void;
  createMessagingThread: (contact: { id: string; name: string; number: string; avatarUrl?: string }) => void;

  // Dynamic Screen Management
  addScreen: (name: string, transitionStyle?: TransitionStyle, parentId?: string | null) => string;
  updateScreen: (id: string, updates: Partial<Omit<ScreenDefinition, 'id'>>) => void;
  deleteScreen: (id: string) => void;
  reorderScreens: (newScreens: ScreenDefinition[]) => void;
  moveScreen: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;

  // Shared Journey State & Actions
  journey: JourneyState;
  setJourneyState: (partial: Partial<JourneyState>) => void;
  updateCurrentManeuver: (partial: Partial<ManeuverStep>) => void;
  setManeuverType: (type: ManeuverType) => void;

  // Active Trip State & Guidance Actions
  activeTrip: ActiveTrip | null;
  startTripGuidance: (trip: Omit<ActiveTrip, 'startedAt'>) => void;
  cancelTripGuidance: () => void;

  // Search POI results
  searchResults: POISearchResult[];
  setSearchResults: (results: POISearchResult[]) => void;
  clearSearchResults: () => void;

  // Favorites & Recents (v4.0)
  favorites: FavoriteLocation[];
  recents: FavoriteLocation[];
  addFavorite: (fav: Omit<FavoriteLocation, 'id'>) => void;
  removeFavorite: (id: string) => void;
  updateFavorite: (id: string, partial: Partial<FavoriteLocation>) => void;
  promoteRecentToFavorite: (recentId: string, label: string) => void;

  // Ambient Simulation
  ambientTick: () => void;

  // Shared Music Provider State & Cover Art Resolution
  selectedMusicService: MusicServiceType;
  setSelectedMusicService: (service: MusicServiceType | string) => void;
  coverArtCache: Record<string, CoverArtCacheEntry>;
  resolveCoverArt: (artist: string, album: string) => Promise<void>;
  advanceCoverArtCandidate: (cacheKey: string) => void;
  markCoverArtStatus: (cacheKey: string, status: CoverArtStatus, coverUrl?: string | null) => void;

  // Vehicle State Actions
  setVehicleState: (partial: Partial<VehicleState>) => void;
  resetVehicleState: () => void;
  applyPresetScenario: (scenario: 'low_battery' | 'highway_cruise' | 'charging_station' | 'door_alert' | 'tire_warning' | 'parked') => void;

  // Notifications
  triggerEventNotification: (eventName: string) => void;
  clearEventNotification: (id: string) => void;
  triggerNotification: (notif: {
    message: string;
    icon?: string;
    color?: string;
    severity?: string;
    title?: string;
    body?: string;
    avatarName?: string;
    threadId?: string;
    showBadgeOnMinimize?: string;
  }) => void;
  clearTransientNotification: (id: string) => void;

  // Screen / UI Actions
  setScreenMode: (mode: ScreenMode) => void;
  previousView: string | null;
  setPreviousView: (view: string | null) => void;
  setActiveView: (view: ActiveView) => void;
  setNotificationStackPosition: (position: NotificationStackPosition) => void;
  reorderNotificationComponent: (id: string, direction: 'up' | 'down') => void;
  toggleDebugPanel: () => void;
  setDebugPanelOpen: (open: boolean) => void;
  setDebugPanelHeight: (height: number) => void;
  selectComponent: (id: string | null) => void;
  setDockOrder: (newOrder: string[]) => void;
  moveDockItem: (id: string, direction: 'left' | 'right') => void;
  toggleDockMembership: (id: string) => void;

  // Component Actions
  addComponent: (type: ComponentType, x?: number, y?: number) => string;
  updateComponentPosition: (id: string, x: number, y: number) => void;
  updateComponentSize: (id: string, width: number, height: number) => void;
  updateComponentStaticProps: (id: string, staticProps: Record<string, string>) => void;
  updateComponentConnector: (id: string, connector: VehicleStatusConnector | null) => void;
  updateComponentZIndex: (id: string, zIndex: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  deleteComponent: (id: string) => void;
  copyComponent: (id?: string) => void;
  pasteComponent: () => string | null;

  // Binding Actions
  addBinding: (componentId: string, binding: Omit<Binding, 'id'>) => void;
  updateBinding: (componentId: string, bindingId: string, partial: Partial<Binding>) => void;
  removeBinding: (componentId: string, bindingId: string) => void;

  // Reset & Persistence
  resetToSeedData: () => void;
}

export const isPresetActive = (scenario: string, vs: VehicleState): boolean => {
  switch (scenario) {
    case 'low_battery':
      return vs.batteryPercent <= 15;
    case 'highway_cruise':
      return vs.speed === 75 && vs.gear === 'D';
    case 'charging_station':
      return vs.isCharging === true;
    case 'door_alert':
      return vs.doorOpen === true;
    case 'tire_warning':
      return vs.tirePressureWarning === true;
    default:
      return false;
  }
};

const initialScreensList = loadSavedScreens();
const initialScreens = loadSavedComponentsByScreen();
const initialNotifs = loadSavedNotificationComponents();
const initialPalette = loadSavedPalette();

let neutralCoastingInterval: NodeJS.Timeout | null = null;
let lastDrainTime: number = Date.now();
let lastChargeTime: number = Date.now();

function startNeutralCoastingIfNeeded(storeGet: () => any) {
  if (neutralCoastingInterval) return;

  let stepSpeed = 0;
  neutralCoastingInterval = setInterval(() => {
    const currentVs = storeGet().vehicleState;
    if (currentVs.gear !== 'N' || currentVs.speed <= 0) {
      if (neutralCoastingInterval) {
        clearInterval(neutralCoastingInterval);
        neutralCoastingInterval = null;
      }
      return;
    }

    if (stepSpeed === 0) {
      stepSpeed = Math.max(1, Math.round(currentVs.speed / 50));
    }

    const nextSpeed = Math.max(0, currentVs.speed - stepSpeed);
    storeGet().setVehicleState({ speed: nextSpeed });

    if (nextSpeed === 0) {
      if (neutralCoastingInterval) {
        clearInterval(neutralCoastingInterval);
        neutralCoastingInterval = null;
      }
    }
  }, 50);
}

type Rect = { x: number; y: number; width: number; height: number };

function hasMinGap(a: Rect, b: Rect, gap: number): boolean {
  return (
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

function hasSufficientSpacing(candidate: Rect, existing: Rect[], gap: number): boolean {
  return existing.every((c) => hasMinGap(candidate, c, gap));
}

export const useMockpitStore = create<MockpitStore>((set, get) => ({
  vehicleState: loadSavedVehicleState(),
  screens: initialScreensList,
  componentsByScreen: initialScreens,
  notificationComponents: initialNotifs,
  transientNotifications: [],
  activeEventNotifIds: [],
  notificationStackPosition: loadSavedStackPosition(),
  components: initialScreens.home || [],
  selectedComponentId: null,
  screenMode: 'editor',
  previousView: 'home',
  activeView: 'home',
  isDebugOpen: false,
  debugPanelHeight: 45,
  dockOrder: loadSavedDockOrder(initialScreensList),
  copiedComponent: null,

  // HMI Compliance Rules & Audit System
  displayConfig: loadSavedDisplayConfig(),
  hmiAuditNotes: loadSavedHmiAuditNotes(),
  isAuditPanelOpen: false,
  auditTargetScreenId: 'current',
  runtimeLog: [],
  setAuditPanelOpen: (open: boolean) => set({ isAuditPanelOpen: open }),
  toggleAuditPanel: () => set((state) => ({ isAuditPanelOpen: !state.isAuditPanelOpen })),
  setAuditTargetScreenId: (screenId: string) => set({ auditTargetScreenId: screenId }),
  setAuditNote: (screenId: string, ruleId: string, note: string) => {
    set((state) => {
      const screenNotes = state.hmiAuditNotes[screenId] || {};
      const currentEntry = screenNotes[ruleId] || { status: 'needs-review' as const, note: '' };
      const updatedNotes: Record<string, Record<string, { status: 'needs-review' | 'reviewed'; note: string }>> = {
        ...state.hmiAuditNotes,
        [screenId]: {
          ...screenNotes,
          [ruleId]: { ...currentEntry, note },
        },
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_HMI_AUDIT_NOTES_KEY, JSON.stringify(updatedNotes));
      } catch (e) {
        console.error('Failed to save HMI audit notes', e);
      }
      return { hmiAuditNotes: updatedNotes };
    });
  },
  toggleAuditReviewStatus: (screenId: string, ruleId: string) => {
    set((state) => {
      const screenNotes = state.hmiAuditNotes[screenId] || {};
      const currentEntry = screenNotes[ruleId] || { status: 'needs-review' as const, note: '' };
      const nextStatus: 'needs-review' | 'reviewed' = currentEntry.status === 'reviewed' ? 'needs-review' : 'reviewed';
      const updatedNotes: Record<string, Record<string, { status: 'needs-review' | 'reviewed'; note: string }>> = {
        ...state.hmiAuditNotes,
        [screenId]: {
          ...screenNotes,
          [ruleId]: { ...currentEntry, status: nextStatus },
        },
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_HMI_AUDIT_NOTES_KEY, JSON.stringify(updatedNotes));
      } catch (e) {
        console.error('Failed to save HMI audit review status', e);
      }
      return { hmiAuditNotes: updatedNotes };
    });
  },
  updateDisplayConfig: (partial: Partial<DisplayConfig>) => {
    set((state) => {
      const updatedConfig = { ...state.displayConfig, ...partial };
      try {
        localStorage.setItem(LOCAL_STORAGE_DISPLAY_CONFIG_KEY, JSON.stringify(updatedConfig));
      } catch (e) {
        console.error('Failed to save display config', e);
      }
      return { displayConfig: updatedConfig };
    });
  },
  addRuntimeLogEntry: (entry) => {
    const full = recordRuntimeLoggerEntry(entry);
    set((state) => ({ runtimeLog: [full, ...state.runtimeLog].slice(0, 200) }));
  },
  clearRuntimeLog: () => {
    clearRuntimeLogger();
    set({ runtimeLog: [] });
  },

  journey: INITIAL_JOURNEY_STATE,
  setJourneyState: (partial) => {
    set((state) => ({
      journey: {
        ...state.journey,
        ...partial,
      },
    }));
  },
  updateCurrentManeuver: (partial) => {
    set((state) => ({
      journey: {
        ...state.journey,
        currentManeuver: {
          ...state.journey.currentManeuver,
          ...partial,
        },
      },
    }));
  },
  setManeuverType: (type) => {
    set((state) => ({
      journey: {
        ...state.journey,
        currentManeuver: {
          ...state.journey.currentManeuver,
          maneuverType: type,
        },
      },
    }));
  },

  activeTrip: loadSavedActiveTrip(),
  favorites: loadSavedFavorites(),
  recents: loadSavedRecents(),

  startTripGuidance: (trip) => {
    const fullTrip: ActiveTrip = {
      ...trip,
      startedAt: Date.now(),
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_TRIP_KEY, JSON.stringify(fullTrip));
    } catch (e) {
      console.error('Failed to save active trip to localStorage', e);
    }

    // Auto-populate / update recents (capped at 5, most-recent-first, deduplicated)
    const state = get();
    if (trip.destinationName && !isNaN(trip.destLat) && !isNaN(trip.destLng)) {
      const destName = trip.destinationName.trim();
      const existingRecents = state.recents || [];
      const filtered = existingRecents.filter(
        (r) =>
          r.label.toLowerCase() !== destName.toLowerCase() &&
          r.address.toLowerCase() !== destName.toLowerCase() &&
          (Math.abs(r.lat - trip.destLat) > 0.0001 || Math.abs(r.lng - trip.destLng) > 0.0001)
      );
      const newRecent: FavoriteLocation = {
        id: `recent-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        label: destName,
        address: destName,
        lat: trip.destLat,
        lng: trip.destLng,
        geocoded: trip.destGeocoded !== false,
      };
      const updatedRecents = [newRecent, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(LOCAL_STORAGE_RECENTS_KEY, JSON.stringify(updatedRecents));
      } catch (e) {
        console.error('Failed to save recents to localStorage', e);
      }
      set({ activeTrip: fullTrip, recents: updatedRecents });
      return;
    }

    set({ activeTrip: fullTrip });
  },
  cancelTripGuidance: () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_TRIP_KEY);
    } catch (e) {
      console.error('Failed to remove active trip from localStorage', e);
    }
    set({ activeTrip: null });
  },

  addFavorite: (fav) => {
    const newFav: FavoriteLocation = {
      ...fav,
      id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    const updated = [newFav, ...(get().favorites || [])];
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
    set({ favorites: updated });
  },

  removeFavorite: (id) => {
    const updated = (get().favorites || []).filter((f) => f.id !== id);
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
    set({ favorites: updated });
  },

  updateFavorite: (id, partial) => {
    const updated = (get().favorites || []).map((f) => (f.id === id ? { ...f, ...partial } : f));
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
    set({ favorites: updated });
  },

  promoteRecentToFavorite: (recentId, label) => {
    const state = get();
    const recent = (state.recents || []).find((r) => r.id === recentId);
    if (!recent) return;
    const newFav: FavoriteLocation = {
      id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label: label.trim() || recent.label || recent.address,
      address: recent.address,
      lat: recent.lat,
      lng: recent.lng,
      geocoded: recent.geocoded,
    };
    const updatedFavs = [newFav, ...(state.favorites || [])];
    const updatedRecents = (state.recents || []).filter((r) => r.id !== recentId);
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(updatedFavs));
      localStorage.setItem(LOCAL_STORAGE_RECENTS_KEY, JSON.stringify(updatedRecents));
    } catch (e) {
      console.error('Failed to update favorites/recents in localStorage', e);
    }
    set({ favorites: updatedFavs, recents: updatedRecents });
  },

  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  clearSearchResults: () => set({ searchResults: [] }),

  selectedMusicService: loadSavedSelectedMusicService(),
  setSelectedMusicService: (service) => {
    const validService = ((MUSIC_SERVICES as readonly string[]).includes(service)
      ? service
      : 'Spotify') as MusicServiceType;
    try {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_MUSIC_SERVICE_KEY, validService);
    } catch (e) {
      console.error('Failed to save selected music service to localStorage', e);
    }
    set({ selectedMusicService: validService });
  },

  coverArtCache: loadSavedCoverArtCache(),

  resolveCoverArt: async (artist: string, album: string) => {
    if (!artist || !album) return;
    const key = getCoverArtCacheKey(artist, album);
    const current = get().coverArtCache[key];

    // If already resolved or in flight, avoid duplicate network calls
    if (current && (current.status === 'found' || current.status === 'not-found' || current.status === 'loading')) {
      return;
    }

    const loadingEntry: CoverArtCacheEntry = {
      candidates: [],
      candidateIndex: 0,
      mbid: null,
      coverUrl: null,
      status: 'loading',
      resolvedAt: Date.now(),
    };

    set((state) => ({
      coverArtCache: { ...state.coverArtCache, [key]: loadingEntry },
    }));

    try {
      const candidates = await searchReleaseGroupQueued(artist, album);
      if (candidates && candidates.length > 0) {
        const mbid = candidates[0];
        const url = coverArtUrl(mbid, 250);
        const foundEntry: CoverArtCacheEntry = {
          candidates,
          candidateIndex: 0,
          mbid,
          coverUrl: url,
          status: 'found',
          resolvedAt: Date.now(),
        };
        set((state) => {
          const updated = { ...state.coverArtCache, [key]: foundEntry };
          saveCoverArtCache(updated);
          return { coverArtCache: updated };
        });
      } else {
        const notFoundEntry: CoverArtCacheEntry = {
          candidates: [],
          candidateIndex: 0,
          mbid: null,
          coverUrl: null,
          status: 'not-found',
          resolvedAt: Date.now(),
        };
        set((state) => {
          const updated = { ...state.coverArtCache, [key]: notFoundEntry };
          saveCoverArtCache(updated);
          return { coverArtCache: updated };
        });
      }
    } catch (err) {
      console.error(`Failed to resolve cover art for ${artist} - ${album}:`, err);
      const errorEntry: CoverArtCacheEntry = {
        candidates: [],
        candidateIndex: 0,
        mbid: null,
        coverUrl: null,
        status: 'not-found',
        resolvedAt: Date.now(),
      };
      set((state) => {
        const updated = { ...state.coverArtCache, [key]: errorEntry };
        saveCoverArtCache(updated);
        return { coverArtCache: updated };
      });
    }
  },

  advanceCoverArtCandidate: (cacheKey: string) => {
    set((state) => {
      const prev = state.coverArtCache[cacheKey];
      if (!prev || !prev.candidates) return state;

      const nextIndex = (prev.candidateIndex ?? 0) + 1;
      if (nextIndex < prev.candidates.length) {
        const nextMbid = prev.candidates[nextIndex];
        const updatedEntry: CoverArtCacheEntry = {
          ...prev,
          candidateIndex: nextIndex,
          mbid: nextMbid,
          coverUrl: coverArtUrl(nextMbid, 250),
          status: 'found',
          resolvedAt: Date.now(),
        };
        const updated = { ...state.coverArtCache, [cacheKey]: updatedEntry };
        saveCoverArtCache(updated);
        return { coverArtCache: updated };
      } else {
        const updatedEntry: CoverArtCacheEntry = {
          ...prev,
          candidateIndex: nextIndex,
          mbid: null,
          coverUrl: null,
          status: 'not-found',
          resolvedAt: Date.now(),
        };
        const updated = { ...state.coverArtCache, [cacheKey]: updatedEntry };
        saveCoverArtCache(updated);
        return { coverArtCache: updated };
      }
    });
  },

  markCoverArtStatus: (cacheKey: string, status: CoverArtStatus, coverUrl: string | null = null) => {
    const current = get().coverArtCache[cacheKey];
    if (
      status === 'not-found' &&
      current &&
      current.candidates &&
      (current.candidateIndex ?? 0) + 1 < current.candidates.length
    ) {
      get().advanceCoverArtCandidate(cacheKey);
      return;
    }

    set((state) => {
      const prev = state.coverArtCache[cacheKey];
      const updatedEntry: CoverArtCacheEntry = {
        candidates: prev?.candidates || [],
        candidateIndex: prev?.candidateIndex || 0,
        mbid: status === 'found' ? prev?.mbid || null : null,
        coverUrl: coverUrl !== undefined ? coverUrl : (status === 'found' ? prev?.coverUrl || null : null),
        status,
        resolvedAt: Date.now(),
      };
      const updated = { ...state.coverArtCache, [cacheKey]: updatedEntry };
      saveCoverArtCache(updated);
      return { coverArtCache: updated };
    });
  },

  isSettingsOpen: false,
  toggleSettingsModal: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setSettingsModalOpen: (open) => set({ isSettingsOpen: open }),

  textScale: loadSavedTextScale(),
  setTextScale: (scale) => {
    applyTextScaleVariables(scale);
    try {
      localStorage.setItem(LOCAL_STORAGE_TEXT_SCALE_KEY, scale);
    } catch (e) {
      console.error('Failed to save text scale to localStorage', e);
    }
    set({ textScale: scale });
  },

  activePalette: initialPalette,
  setPalette: (palette) => {
    applyCssVariables(palette);
    try {
      localStorage.setItem(LOCAL_STORAGE_PALETTE_KEY, JSON.stringify(palette));
    } catch (e) {
      console.error('Failed to save palette to localStorage', e);
    }
    set({ activePalette: palette });
  },

  gridConfig: loadSavedGridConfig(),
  setGridConfig: (partial) =>
    set((state) => {
      const updated = { ...state.gridConfig, ...partial };
      try {
        localStorage.setItem(LOCAL_STORAGE_GRID_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save grid config to localStorage', e);
      }
      return { gridConfig: updated };
    }),
  toggleGridVisibility: () =>
    set((state) => {
      const updated = { ...state.gridConfig, visible: !state.gridConfig.visible };
      try {
        localStorage.setItem(LOCAL_STORAGE_GRID_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save grid config to localStorage', e);
      }
      return { gridConfig: updated };
    }),
  toggleSnapToGrid: () => {
    set((state) => {
      const nextSnap = !state.gridConfig.snapToGrid;
      const updated = { ...state.gridConfig, snapToGrid: nextSnap };
      try {
        localStorage.setItem(LOCAL_STORAGE_GRID_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save grid config to localStorage', e);
      }
      return { gridConfig: updated };
    });
    const { gridConfig, resnapAllComponentsToGrid } = get();
    if (gridConfig.snapToGrid && gridConfig.size > 0) {
      resnapAllComponentsToGrid(gridConfig.size);
    }
  },
  resnapAllComponentsToGrid: (newSize: number) => {
    if (newSize <= 0) return;
    set((state) => {
      // 1. Recalculate componentsByScreen
      const updatedScreens: Record<string, ComponentInstance[]> = {};
      Object.keys(state.componentsByScreen).forEach((screenId) => {
        const list = state.componentsByScreen[screenId] || [];
        updatedScreens[screenId] = list.map((comp) => {
          const snappedX = Math.round(comp.x / newSize) * newSize;
          const snappedY = Math.round(comp.y / newSize) * newSize;
          const snappedW = Math.max(newSize, Math.round(comp.width / newSize) * newSize);
          const snappedH = Math.max(newSize, Math.round(comp.height / newSize) * newSize);
          return {
            ...comp,
            x: snappedX,
            y: snappedY,
            width: snappedW,
            height: snappedH,
          };
        });
      });

      // 2. Recalculate notificationComponents
      const updatedNotifs = state.notificationComponents.map((comp) => {
        const snappedX = Math.round(comp.x / newSize) * newSize;
        const snappedY = Math.round(comp.y / newSize) * newSize;
        const snappedW = Math.max(newSize, Math.round(comp.width / newSize) * newSize);
        const snappedH = Math.max(newSize, Math.round(comp.height / newSize) * newSize);
        return {
          ...comp,
          x: snappedX,
          y: snappedY,
          width: snappedW,
          height: snappedH,
        };
      });

      const activeScreenList = updatedScreens[state.activeView] || [];

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
        localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
      } catch (e) {
        console.error('Failed to save resnapped components to localStorage', e);
      }

      return {
        componentsByScreen: updatedScreens,
        components: activeScreenList,
        notificationComponents: updatedNotifs,
      };
    });
  },

  vehicleBackground: loadSavedVehicleBackground(),
  setVehicleBackground: (partial) =>
    set((state) => {
      const updated = { ...state.vehicleBackground, ...partial };
      try {
        localStorage.setItem(LOCAL_STORAGE_VEHICLE_BG_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save vehicle background config to localStorage', e);
      }
      return { vehicleBackground: updated };
    }),

  egoVehicleType: loadSavedEgoVehicleType(),
  setEgoVehicleType: (type) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_EGO_VEHICLE_TYPE_KEY, type);
    } catch (e) {
      console.error('Failed to save ego vehicle type to localStorage', e);
    }
    set({ egoVehicleType: type });
  },

  tempGradientColors: loadSavedTempGradientColors(),
  setTempGradientColors: (colors) => {
    set((state) => {
      const updated = { ...state.tempGradientColors, ...colors };
      try {
        localStorage.setItem(LOCAL_STORAGE_TEMP_GRADIENT_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save temp gradient colors', e);
      }
      return { tempGradientColors: updated };
    });
  },

  climateState: loadSavedClimateState(),
  setClimateState: (partial) => {
    set((state) => {
      const updated = { ...state.climateState, ...partial };
      try {
        localStorage.setItem(LOCAL_STORAGE_CLIMATE_STATE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save climate state to localStorage', e);
      }
      return { climateState: updated };
    });
  },

  keyboardSlideDirection: loadSavedKeyboardSlideDirection(),
  setKeyboardSlideDirection: (dir) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYBOARD_DIRECTION_KEY, dir);
    } catch (e) {
      console.error('Failed to save keyboard slide direction to localStorage', e);
    }
    set({ keyboardSlideDirection: dir });
  },

  activeInputState: null,
  isKeyboardVisible: false,

  // Global Messaging State & Actions
  conversations: INITIAL_CONVERSATIONS,
  selectedMessagingThreadId: null,
  queuedMessageToasts: [],

  setSelectedMessagingThreadId: (id) => {
    set((state) => ({
      selectedMessagingThreadId: id,
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  markThreadAsRead: (threadId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === threadId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  sendInboundMessage: (threadId, text) => {
    const state = get();

    // Find target conversation details
    const targetConv = state.conversations.find((c) => c.id === threadId);
    const targetName = targetConv ? targetConv.name : 'Incoming Message';

    // Check if thread is currently open AND user is on Phone view
    const isThreadOpen = state.activeView === 'phone' && state.selectedMessagingThreadId === threadId;

    // Update conversations model in store
    const updatedConversations = state.conversations.map((c) => {
      if (c.id === threadId) {
        return {
          ...c,
          lastMessage: text,
          lastTimestamp: 'Just now',
          unreadCount: isThreadOpen ? 0 : c.unreadCount + 1,
          messages: [
            ...c.messages,
            {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              sender: 'contact' as const,
              text,
              timestamp: 'Just now',
            },
          ],
        };
      }
      return c;
    });

    set({ conversations: updatedConversations });

    // Trigger or queue notification unconditionally (except keyboard suppression)
    if (state.isKeyboardVisible) {
      // Queue toast while keyboard is open
      set((s) => {
        const existingIdx = s.queuedMessageToasts.findIndex((q) => q.threadId === threadId);
        const newItem = {
          threadId,
          text,
          title: targetName,
        };
        if (existingIdx >= 0) {
          const nextQ = [...s.queuedMessageToasts];
          nextQ[existingIdx] = newItem;
          return { queuedMessageToasts: nextQ };
        } else {
          return { queuedMessageToasts: [...s.queuedMessageToasts, newItem] };
        }
      });
    } else {
      // Fire notification immediately
      get().triggerNotification({
        title: targetName,
        body: text,
        message: text,
        avatarName: targetName,
        threadId,
        severity: 'info',
        color: '#38bdf8',
      });
    }
  },

  sendUserMessage: (threadId, text) => {
    const msgText = text.trim();
    if (!msgText) return;

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'user' as const,
      text: msgText,
      timestamp: 'Just now',
    };

    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id === threadId) {
          return {
            ...c,
            lastMessage: msgText,
            lastTimestamp: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      }),
    }));

    // Auto-reply after 3 seconds
    setTimeout(() => {
      const autoReplies = [
        'Sounds good, see you soon!',
        'Got it, thanks for updating me!',
        'Driving now, talk to you shortly.',
        'Perfect, thanks!',
      ];
      const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      get().sendInboundMessage(threadId, randomReply);
    }, 3000);
  },

  createMessagingThread: (contact) => {
    const state = get();
    let existing = state.conversations.find((c) => c.contactId === contact.id || c.name === contact.name);
    if (existing) {
      set({ selectedMessagingThreadId: existing.id });
    } else {
      const newConv: Conversation = {
        id: `m-${Date.now()}`,
        contactId: contact.id,
        name: contact.name,
        number: contact.number,
        unreadCount: 0,
        lastMessage: 'Started a message thread',
        lastTimestamp: 'Just now',
        avatarUrl: contact.avatarUrl || CONTACT_PHOTO_MAP[contact.name],
        messages: [],
      };
      set((s) => ({
        conversations: [newConv, ...s.conversations],
        selectedMessagingThreadId: newConv.id,
      }));
    }
  },

  openKeyboard: (inputState) => {
    const current = get().activeInputState;

    // Capture the initial non-cleared previous value so we can restore it if cancelled
    const initialVal =
      inputState.initialValue !== undefined
        ? inputState.initialValue
        : current && current.inputId === inputState.inputId && current.initialValue !== undefined
        ? current.initialValue
        : inputState.value;

    // Clear the input text field so the user does not have to manually delete text before adding new text
    if (inputState.value !== '') {
      inputState.onChange('');
    }

    set({
      activeInputState: {
        ...inputState,
        value: '',
        initialValue: initialVal,
      },
      isKeyboardVisible: true,
    });
  },

  closeKeyboard: (options?: { isCancelled?: boolean }) => {
    const activeInput = get().activeInputState;
    const queued = get().queuedMessageToasts;
    const isCancelled = options?.isCancelled ?? true;

    set({
      isKeyboardVisible: false,
      activeInputState: null,
      queuedMessageToasts: [],
    });

    if (isCancelled && activeInput) {
      if (activeInput.onCancel) {
        activeInput.onCancel();
      } else if (activeInput.initialValue !== undefined) {
        activeInput.onChange(activeInput.initialValue);
      }
    }

    if (queued.length > 0) {
      queued.forEach((item) => {
        get().triggerNotification({
          title: item.title,
          body: item.text,
          message: item.text,
          avatarName: item.title,
          threadId: item.threadId,
          severity: 'info',
          color: '#38bdf8',
        });
      });
    }
  },

  updateActiveInputValue: (val) => {
    const current = get().activeInputState;
    if (current) {
      current.onChange(val);
      set({
        activeInputState: {
          ...current,
          value: val,
        },
      });
    }
  },

  typeKeyboardKey: (char) => {
    const current = get().activeInputState;
    if (current) {
      const nextVal = current.value + char;
      current.onChange(nextVal);
      set({
        activeInputState: {
          ...current,
          value: nextVal,
        },
      });
    }
  },

  backspaceKeyboardKey: () => {
    const current = get().activeInputState;
    if (current) {
      const nextVal = current.value.slice(0, -1);
      current.onChange(nextVal);
      set({
        activeInputState: {
          ...current,
          value: nextVal,
        },
      });
    }
  },

  clearKeyboardKey: () => {
    const current = get().activeInputState;
    if (current) {
      current.onChange('');
      set({
        activeInputState: {
          ...current,
          value: '',
        },
      });
    }
  },

  addScreen: (name, transitionStyle = 'fade', parentId = null) => {
    const state = get();
    const trimmedName = name.trim() || `Screen ${state.screens.length + 1}`;
    const newId = `screen_${Date.now()}`;
    const newScreen: ScreenDefinition = {
      id: newId,
      name: trimmedName,
      order: state.screens.length,
      transitionStyle,
      parentId: parentId ?? null,
    };
    const updatedScreens = [...state.screens, newScreen];
    const updatedComponentsByScreen = {
      ...state.componentsByScreen,
      [newId]: [],
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_SCREENS_KEY, JSON.stringify(updatedScreens));
      localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedComponentsByScreen));
    } catch (e) {
      console.error('Failed to save added screen', e);
    }

    set({
      screens: updatedScreens,
      componentsByScreen: updatedComponentsByScreen,
      activeView: newId,
      components: [],
      selectedComponentId: null,
    });
    return newId;
  },

  updateScreen: (id, updates) => {
    const state = get();
    const updatedScreens = state.screens.map((s) => {
      if (s.id === id) {
        const newName = id === 'home' ? 'Home' : (updates.name !== undefined ? updates.name : s.name);
        return {
          ...s,
          ...updates,
          name: newName,
        };
      }
      return s;
    });
    try {
      localStorage.setItem(LOCAL_STORAGE_SCREENS_KEY, JSON.stringify(updatedScreens));
    } catch (e) {
      console.error('Failed to update screen', e);
    }
    set({ screens: updatedScreens });
  },

  deleteScreen: (id) => {
    if (id === 'home') return;
    const state = get();
    // Cascade delete any child screens of this parent screen
    const childIds = state.screens.filter((s) => s.parentId === id).map((s) => s.id);
    const idsToDelete = [id, ...childIds];

    const updatedScreens = state.screens.filter((s) => !idsToDelete.includes(s.id));
    const updatedComponentsByScreen = { ...state.componentsByScreen };
    idsToDelete.forEach((delId) => {
      delete updatedComponentsByScreen[delId];
    });
    const updatedDockOrder = state.dockOrder.filter((d) => !idsToDelete.includes(d));

    const nextActiveView = idsToDelete.includes(state.activeView) ? 'home' : state.activeView;
    try {
      localStorage.setItem(LOCAL_STORAGE_SCREENS_KEY, JSON.stringify(updatedScreens));
      localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedComponentsByScreen));
      localStorage.setItem(LOCAL_STORAGE_DOCK_ORDER_KEY, JSON.stringify(updatedDockOrder));
    } catch (e) {
      console.error('Failed to save deleted screen', e);
    }
    set({
      screens: updatedScreens,
      componentsByScreen: updatedComponentsByScreen,
      dockOrder: updatedDockOrder,
      activeView: nextActiveView,
      components: updatedComponentsByScreen[nextActiveView] || [],
      selectedComponentId: null,
    });
  },

  reorderScreens: (newScreens) => {
    const home = newScreens.find((s) => s.id === 'home') || { id: 'home', name: 'Home', order: 0, transitionStyle: 'fade' as const, parentId: null };
    const rest = newScreens.filter((s) => s.id !== 'home');
    const ordered = [home, ...rest].map((s, idx) => ({ ...s, order: idx }));
    try {
      localStorage.setItem(LOCAL_STORAGE_SCREENS_KEY, JSON.stringify(ordered));
    } catch (e) {
      console.error('Failed to save reordered screens', e);
    }
    set({ screens: ordered });
  },

  moveScreen: (id, direction) => {
    if (id === 'home') return; // Home is pinned first
    set((state) => {
      const screen = state.screens.find((s) => s.id === id);
      if (!screen) return state;

      const parentId = screen.parentId ?? null;
      const siblings = state.screens.filter((s) => (s.parentId ?? null) === parentId);
      const index = siblings.findIndex((s) => s.id === id);
      if (index === -1) return state;

      const isTopLevel = parentId === null;
      const minIndex = isTopLevel ? 1 : 0; // Index 0 of top-level is Home

      const isPrev = direction === 'up' || direction === 'left';
      const targetIndex = isPrev ? index - 1 : index + 1;

      if (targetIndex < minIndex || targetIndex >= siblings.length) return state;

      const siblingAtTarget = siblings[targetIndex];
      const allScreens = [...state.screens];
      const idxA = allScreens.findIndex((s) => s.id === screen.id);
      const idxB = allScreens.findIndex((s) => s.id === siblingAtTarget.id);

      if (idxA !== -1 && idxB !== -1) {
        const temp = allScreens[idxA];
        allScreens[idxA] = allScreens[idxB];
        allScreens[idxB] = temp;

        const updatedScreens = allScreens.map((s, i) => ({ ...s, order: i }));
        try {
          localStorage.setItem(LOCAL_STORAGE_SCREENS_KEY, JSON.stringify(updatedScreens));
        } catch (e) {
          console.error('Failed to save reordered screens', e);
        }
        return { screens: updatedScreens };
      }
      return state;
    });
  },

  ambientTick: () => {
    const state = get();
    if (state.screenMode !== 'presentation') return;

    const currentVs = state.vehicleState;
    const newVs: Partial<VehicleState> = {};

    // Drive Mode multipliers & speed-drift settings
    const driveMode = currentVs.driveMode || 'Normal';
    let driveModeDrainMultiplier = 1.0;
    let speedDriftCeiling = 5;

    if (driveMode === 'Eco') {
      driveModeDrainMultiplier = 0.7;
      speedDriftCeiling = 2;
    } else if (driveMode === 'Sport') {
      driveModeDrainMultiplier = 1.5;
      speedDriftCeiling = 8;
    }

    // Speed drift: ±1–2 mph around set speed when cruise active AND gear === 'D', otherwise ±1–speedDriftCeiling mph while gear === 'D' or 'R'
    if (currentVs.cruiseControlActive && currentVs.gear === 'D') {
      const setSpeed = currentVs.cruiseSetSpeed ?? currentVs.speed;
      if (currentVs.cruiseSetSpeed === undefined) {
        newVs.cruiseSetSpeed = setSpeed;
      }
      const dir = Math.random() > 0.5 ? 1 : -1;
      const delta = dir * (1 + (Math.random() > 0.5 ? 1 : 0));
      const proposedSpeed = currentVs.speed + delta;
      newVs.speed = Math.max(0, Math.max(setSpeed - 2, Math.min(setSpeed + 2, proposedSpeed)));
    } else if (currentVs.gear === 'D' || currentVs.gear === 'R') {
      const dir = Math.random() > 0.48 ? 1 : -1;
      const delta = dir * (1 + Math.floor(Math.random() * speedDriftCeiling));
      const maxSpeedCap = getSpeedReadoutMaxSpeed(state);
      newVs.speed = Math.max(0, Math.min(maxSpeedCap, currentVs.speed + delta));
    }

    const effectiveSpeed = newVs.speed !== undefined ? newVs.speed : currentVs.speed;

    // Map pan center proportional to speed while speed > 0
    if (effectiveSpeed > 0) {
      const currentLat = currentVs.mapLat ?? 37.3318;
      const currentLng = currentVs.mapLng ?? -122.0311;
      newVs.mapLat = currentLat + (effectiveSpeed * 0.00003);
      newVs.mapLng = currentLng + (effectiveSpeed * 0.00002);
    }

    // Configurable Battery & Charging Rates
    let drainPercent = 1;
    let drainIntervalSec = 60;
    let chargePercent = 5;
    let chargeIntervalSec = 60;

    const allComps: ComponentInstance[] = [
      ...state.components,
      ...Object.values(state.componentsByScreen).flat(),
    ];

    const batteryComp = allComps.find((c) => c.type === 'battery');
    if (batteryComp?.staticProps) {
      const dp = parseFloat(batteryComp.staticProps.drainPercentPerInterval);
      const di = parseFloat(batteryComp.staticProps.drainIntervalSeconds);
      if (!isNaN(dp) && dp > 0) drainPercent = dp;
      if (!isNaN(di) && di > 0) drainIntervalSec = di;

      const cp = parseFloat(batteryComp.staticProps.chargePercentPerInterval);
      const ci = parseFloat(batteryComp.staticProps.chargeIntervalSeconds);
      if (!isNaN(cp) && cp > 0) chargePercent = cp;
      if (!isNaN(ci) && ci > 0) chargeIntervalSec = ci;
    }

    const effectiveDrainPercent = drainPercent * driveModeDrainMultiplier;
    const now = Date.now();

    if (currentVs.isCharging) {
      const elapsedChargeSec = (now - lastChargeTime) / 1000;
      if (elapsedChargeSec >= chargeIntervalSec) {
        const steps = Math.floor(elapsedChargeSec / chargeIntervalSec);
        newVs.batteryPercent = Math.min(100, currentVs.batteryPercent + (steps * chargePercent));
        lastChargeTime = now - ((elapsedChargeSec % chargeIntervalSec) * 1000);
      }
      lastDrainTime = now;
    } else if (effectiveSpeed > 0) {
      const elapsedDrainSec = (now - lastDrainTime) / 1000;
      if (elapsedDrainSec >= drainIntervalSec) {
        const steps = Math.floor(elapsedDrainSec / drainIntervalSec);
        newVs.batteryPercent = Math.max(0, currentVs.batteryPercent - (steps * effectiveDrainPercent));
        lastDrainTime = now - ((elapsedDrainSec % drainIntervalSec) * 1000);
      }
      lastChargeTime = now;
    } else {
      lastDrainTime = now;
      lastChargeTime = now;
    }

    // Signal bars fluctuation
    const currentSignal = currentVs.signalBars ?? 4;
    if (Math.random() > 0.5) {
      const signalDir = Math.random() > 0.5 ? 1 : -1;
      newVs.signalBars = Math.max(1, Math.min(5, currentSignal + signalDir));
    }

    if (Object.keys(newVs).length > 0) {
      state.setVehicleState(newVs);
    }
  },

  setVehicleState: (partial) => {
    const prevVs = get().vehicleState;

    set((state) => {
      const rawUpdated = { ...state.vehicleState, ...partial };

      // Cruise Control can ONLY be active in gear D
      if (rawUpdated.gear !== 'D') {
        rawUpdated.cruiseControlActive = false;
        rawUpdated.cruiseSetSpeed = undefined;
      } else if (rawUpdated.cruiseControlActive) {
        if (!prevVs.cruiseControlActive || rawUpdated.cruiseSetSpeed === undefined) {
          rawUpdated.cruiseSetSpeed = rawUpdated.speed;
        }
      } else {
        rawUpdated.cruiseSetSpeed = undefined;
      }

      // Park forces speed to zero immediately
      if (rawUpdated.gear === 'P') {
        rawUpdated.speed = 0;
      }

      let isCharging = rawUpdated.isCharging;

      // Realistic charge/drive interlock:
      // 1. Charging can only switch on when gear === 'P' AND speed === 0
      // 2. If gear leaves 'P' or speed > 0 while charging, auto-set isCharging = false
      if (rawUpdated.gear !== 'P' || rawUpdated.speed > 0) {
        isCharging = false;
      }

      // If charging is being toggled/turned on, ensure LOW BATTERY preset state is deactivated
      // (LOW BATTERY is active when batteryPercent <= 15; deactivating it sets batteryPercent to 70)
      if (isCharging && !prevVs.isCharging && rawUpdated.batteryPercent <= 15) {
        rawUpdated.batteryPercent = 70;
      }

      const updated = { ...rawUpdated, isCharging };

      // Stop neutral coasting if not in N or speed is 0
      if (updated.gear !== 'N' || updated.speed <= 0) {
        if (neutralCoastingInterval) {
          clearInterval(neutralCoastingInterval);
          neutralCoastingInterval = null;
        }
      }

      try {
        localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save vehicle state', e);
      }
      return { vehicleState: updated };
    });

    // Trigger Neutral coasting if gear is N and speed > 0
    const vs = get().vehicleState;
    if (vs.gear === 'N' && vs.speed > 0) {
      startNeutralCoastingIfNeeded(get);
    }

    // Trigger event-based notifications on state transitions
    if (prevVs.cruiseControlActive !== vs.cruiseControlActive) {
      if (vs.cruiseControlActive) {
        get().triggerEventNotification('cruise_on');
      } else {
        // When cruise control is disengaged, remove the active/minimized CRUISE CONTROL ENGAGED notifications
        set((state) => ({
          activeEventNotifIds: state.activeEventNotifIds.filter(
            (id) => id !== 'comp-warning-cruise-on' && id !== 'comp-warning-cruise-off'
          ),
          transientNotifications: state.transientNotifications.filter(
            (n) => !n.staticProps?.message?.toUpperCase().includes('CRUISE') && !n.id.includes('cruise')
          ),
        }));
      }
    }
  },

  resetVehicleState: () => {
    set(() => {
      localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(INITIAL_VEHICLE_STATE));
      return { vehicleState: INITIAL_VEHICLE_STATE };
    });
  },

  applyPresetScenario: (scenario) => {
    const vs = get().vehicleState;
    const currentlyActive = isPresetActive(scenario, vs);

    switch (scenario) {
      case 'low_battery':
        get().setVehicleState({
          batteryPercent: currentlyActive ? 70 : 12,
        });
        break;

      case 'highway_cruise':
        get().setVehicleState({
          gear: currentlyActive ? 'P' : 'D',
          speed: currentlyActive ? 0 : 75,
          cruiseControlActive: !currentlyActive,
        });
        break;

      case 'charging_station':
        if (currentlyActive) {
          get().setVehicleState({
            isCharging: false,
          });
        } else {
          if (vs.gear === 'P' && vs.speed === 0) {
            get().setVehicleState({
              isCharging: true,
            });
          }
        }
        break;

      case 'door_alert':
        get().setVehicleState({
          doorOpen: !currentlyActive,
        });
        break;

      case 'tire_warning':
        get().setVehicleState({
          tirePressureWarning: !currentlyActive,
        });
        break;

      default:
        break;
    }
  },

  triggerEventNotification: (eventName) => {
    set((state) => {
      const matching = state.notificationComponents.filter(
        (c) => c.staticProps?.triggerMode === 'event' && c.staticProps?.triggerEvent === eventName
      );
      if (matching.length === 0) return state;

      const matchingIds = matching.map((c) => c.id);
      const newActive = Array.from(new Set([...state.activeEventNotifIds, ...matchingIds]));
      return { activeEventNotifIds: newActive };
    });
  },

  clearEventNotification: (id) => {
    set((state) => ({
      activeEventNotifIds: state.activeEventNotifIds.filter((notifId) => notifId !== id),
    }));
  },

  triggerNotification: (notif) => {
    if (notif.message.includes('ENGAGED') || notif.message.includes('SET')) {
      get().triggerEventNotification('cruise_on');
    }

    const severity = notif.severity || 'warning';
    const color =
      notif.color ||
      (severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#f59e0b' : '#38bdf8');

    const threadId = notif.threadId || '';
    const newNotifId = threadId
      ? `transient-notif-thread-${threadId}-${Date.now()}`
      : `transient-notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const isMessageToast = !!threadId || !!notif.avatarName;
    const toastWidth = isMessageToast ? 450 : 380;
    const toastHeight = isMessageToast ? 125 : 110;

    const newNotif: ComponentInstance = {
      id: newNotifId,
      type: 'warning',
      x: 0,
      y: 0,
      width: toastWidth,
      height: toastHeight,
      isTransient: true,
      staticProps: {
        label: isMessageToast ? 'TEXT MESSAGE' : notif.title || '',
        title: notif.title || '',
        body: notif.body || notif.message,
        icon: isMessageToast ? 'message-square' : notif.icon || 'alert-triangle',
        message: notif.message,
        visible: 'true',
        color,
        severity,
        avatarName: notif.avatarName || '',
        threadId,
        showBadgeOnMinimize: 'true',
      },
      bindings: [],
    };

    set((state) => {
      let existingFiltered = state.transientNotifications;
      if (threadId) {
        existingFiltered = state.transientNotifications.filter(
          (c) => c.staticProps?.threadId !== threadId
        );
      }
      return {
        transientNotifications: [newNotif, ...existingFiltered.slice(0, 4)],
      };
    });
  },

  clearTransientNotification: (id) => {
    set((state) => ({
      transientNotifications: state.transientNotifications.filter((c) => c.id !== id),
    }));
  },

  setScreenMode: (mode) =>
    set((state) => ({
      screenMode: mode,
      isSettingsOpen: mode === 'presentation' ? false : state.isSettingsOpen,
    })),

  setActiveView: (view) =>
    set((state) => ({
      previousView: state.activeView !== view ? state.activeView : state.previousView,
      activeView: view,
      components: state.componentsByScreen[view] || [],
    })),

  setPreviousView: (view) => set({ previousView: view }),

  setNotificationStackPosition: (position) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_STACK_POS_KEY, position);
    } catch (e) {
      console.error('Failed to save stack position', e);
    }
    set({ notificationStackPosition: position });
  },

  reorderNotificationComponent: (id, direction) => {
    set((state) => {
      const list = [...state.notificationComponents];
      const index = list.findIndex((c) => c.id === id);
      if (index === -1) return state;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return state;

      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;

      try {
        localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('Failed to save reordered notification components', e);
      }
      return {
        notificationComponents: list,
      };
    });
  },

  toggleDebugPanel: () => set((state) => ({ isDebugOpen: !state.isDebugOpen })),
  setDebugPanelOpen: (open) => set({ isDebugOpen: open }),
  setDebugPanelHeight: (height) => set({ debugPanelHeight: height }),
  selectComponent: (id) => set({ selectedComponentId: id }),

  setDockOrder: (newOrder) => {
    // Ensure home stays pinned first
    const sanitizedNonHome = newOrder.filter((id) => id !== 'home') as ActiveView[];
    const normalized: ActiveView[] = ['home', ...sanitizedNonHome];
    try {
      localStorage.setItem(LOCAL_STORAGE_DOCK_ORDER_KEY, JSON.stringify(normalized));
    } catch (e) {
      console.error('Failed to save dock order', e);
    }
    set({ dockOrder: normalized });
  },

  moveDockItem: (id, direction) => {
    if (id === 'home') return; // Home stays pinned first
    set((state) => {
      const currentOrder = [...state.dockOrder];
      const index = currentOrder.indexOf(id);
      if (index === -1) return state;

      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      // Cannot move into or before index 0 (Home)
      if (targetIndex < 1 || targetIndex >= currentOrder.length) return state;

      // Swap elements
      const temp = currentOrder[index];
      currentOrder[index] = currentOrder[targetIndex];
      currentOrder[targetIndex] = temp;

      try {
        localStorage.setItem(LOCAL_STORAGE_DOCK_ORDER_KEY, JSON.stringify(currentOrder));
      } catch (e) {
        console.error('Failed to save moved dock item order', e);
      }
      return { dockOrder: currentOrder };
    });
  },

  toggleDockMembership: (id: string) => {
    if (REQUIRED_DOCK_SCREEN_IDS.includes(id)) return; // defensive guard, required screens can't be removed
    set((state) => {
      const isIn = state.dockOrder.includes(id);
      const newOrder = isIn
        ? state.dockOrder.filter((d) => d !== id)
        : [...state.dockOrder, id];
      try {
        localStorage.setItem(LOCAL_STORAGE_DOCK_ORDER_KEY, JSON.stringify(newOrder));
      } catch (e) {
        console.error('Failed to save toggled dock membership', e);
      }
      return { dockOrder: newOrder };
    });
  },

  addComponent: (type, x = 760, y = 280) => {
    const id = `comp-${type}-${Date.now().toString(36)}`;
    const grid = get().gridConfig;
    let initialX = x;
    let initialY = y;
    if (grid.snapToGrid && grid.size > 0) {
      initialX = Math.round(x / grid.size) * grid.size;
      initialY = Math.round(y / grid.size) * grid.size;
    }

    // Define defaults for each component type
    let width = 280;
    let height = 140;
    let staticProps: Record<string, string> = {};
    let bindings: Binding[] = [];

    switch (type) {
      case 'battery':
        width = 340;
        height = 130;
        staticProps = { label: 'Battery', color: '#22c55e', icon: 'battery', drainPercentPerInterval: '1', drainIntervalSeconds: '60' };
        bindings = [
          {
            id: `bind-${Date.now()}-1`,
            stateField: 'batteryPercent',
            condition: '<',
            value: 15,
            targetProp: 'color',
            targetValue: '#ef4444',
          },
          {
            id: `bind-${Date.now()}-2`,
            stateField: 'batteryPercent',
            condition: '>=',
            value: 0,
            targetProp: 'text',
            targetValue: '{batteryPercent}%',
          },
        ];
        break;
      case 'gear':
        width = 200;
        height = 140;
        staticProps = { label: 'Gear', color: '#f8fafc' };
        bindings = [
          {
            id: `bind-${Date.now()}-1`,
            stateField: 'speed',
            condition: '>=',
            value: 0,
            targetProp: 'text',
            targetValue: '{gear}',
          },
        ];
        break;
      case 'speed':
        width = 220;
        height = 150;
        staticProps = {
          label: 'Speedometer',
          unit: 'mph',
          color: '#38bdf8',
          displayStyle: 'numeric',
          maxSpeed: '140',
          arcStop1Color: '#10b981',
          arcStop2Color: '#06b6d4',
          arcStop3Color: '#38bdf8',
          arcStop4Color: '#f59e0b',
          arcStop5Color: '#ef4444',
        };
        bindings = [
          {
            id: `bind-${Date.now()}-1`,
            stateField: 'speed',
            condition: '>=',
            value: 0,
            targetProp: 'text',
            targetValue: '{speed}',
          },
        ];
        break;
      case 'warning':
        width = 380;
        height = 120;
        staticProps = {
          label: 'VEHICLE ALERT',
          icon: 'alert-triangle',
          message: 'VEHICLE ALERT',
          visible: 'false',
          color: '#f59e0b',
          severity: 'warning',
          triggerMode: 'condition',
        };
        bindings = [
          {
            id: `bind-${Date.now()}-1`,
            stateField: 'doorOpen',
            condition: '=',
            value: true,
            targetProp: 'visible',
            targetValue: 'true',
          },
          {
            id: `bind-${Date.now()}-2`,
            stateField: 'doorOpen',
            condition: '=',
            value: false,
            targetProp: 'visible',
            targetValue: 'false',
          },
        ];
        break;
      case 'map':
        width = 440;
        height = 280;
        staticProps = { lat: '37.7749', lng: '-122.4194', zoom: '13', label: 'Navigation Map' };
        bindings = [];
        break;
      case 'media':
        width = 720;
        height = 480;
        staticProps = {
          service: 'Spotify',
          title: 'Starboy',
          artist: 'The Weeknd ft. Daft Punk',
          album: 'Starboy',
          label: 'Music Media Player',
        };
        bindings = [];
        break;
      case 'nowPlaying':
        width = 420;
        height = 180;
        staticProps = {
          orientation: 'horizontal',
          autoDismissEnabled: 'false',
          autoDismissSeconds: '8',
          dismissDirection: 'down',
          slideDurationMs: '800',
          label: 'Now Playing',
          songTransition: 'fade',
          songInfoDisplayDuration: '2.5',
          titleFontSize: 'default',
          artistFontSize: 'default',
          titleColor: '#f8fafc',
          artistColor: '#94a3b8',
        };
        bindings = [];
        break;
      case 'mediaPlaylists':
        width = 540;
        height = 420;
        staticProps = {
          label: 'Playlists',
        };
        bindings = [];
        break;
      case 'mediaDiscovery':
        width = 620;
        height = 260;
        staticProps = {
          mode: 'trending',
          layout: 'horizontal',
          label: 'Discovery',
        };
        bindings = [];
        break;
      case 'mediaSearch':
        width = 580;
        height = 220;
        staticProps = {
          label: 'Music Search',
        };
        bindings = [];
        break;
      case 'climate':
        width = 320;
        height = 150;
        staticProps = { temp: '72°F', fanSpeed: 'Auto 3', mode: 'AC Dual' };
        bindings = [];
        break;
      case 'phone':
        width = 340;
        height = 150;
        staticProps = { contact: 'Alex Morgan', number: '+1 (555) 019-2834', status: 'Connected' };
        bindings = [];
        break;
      case 'driveMode':
        width = 320;
        height = 160;
        staticProps = { label: 'Drive Mode' };
        bindings = [
          {
            id: `b-${Date.now()}-1`,
            stateField: 'driveMode',
            condition: '=',
            value: 'Sport',
            targetProp: 'color',
            targetValue: '#f59e0b',
          },
          {
            id: `b-${Date.now()}-2`,
            stateField: 'driveMode',
            condition: '=',
            value: 'Eco',
            targetProp: 'color',
            targetValue: '#22c55e',
          },
        ];
        break;
      case 'tirePressure':
        width = 380;
        height = 210;
        staticProps = { frontLeft: '28 PSI', frontRight: '35 PSI', rearLeft: '36 PSI', rearRight: '36 PSI' };
        bindings = [];
        break;
      case 'navHome':
        width = 380;
        height = 160;
        staticProps = { address: '100 Infinite Loop, Cupertino, CA', lat: '37.3318', lng: '-122.0311', label: 'Home' };
        bindings = [];
        break;
      case 'navDestination':
        width = 380;
        height = 240;
        staticProps = {
          destination: 'Yosemite Valley, CA',
          destLat: '37.7456',
          destLng: '-119.5936',
          lat: '37.7456',
          lng: '-119.5936',
          tripStops: JSON.stringify([
            { id: 'stop-1', name: 'EV Supercharger Bay (Merced)', lat: '37.3022', lng: '-120.4830' },
            { id: 'stop-2', name: 'Scenic Overlook Rest Area', lat: '37.7158', lng: '-119.6775' },
          ]),
        };
        bindings = [];
        break;
      case 'navSearch':
        width = 380;
        height = 220;
        staticProps = { placeholder: 'Search chargers, food, POIs...' };
        bindings = [];
        break;
      case 'navTripEstimate':
        width = 380;
        height = 200;
        staticProps = {
          startLat: '37.3318',
          startLng: '-122.0311',
          destLat: '37.7456',
          destLng: '-119.5936',
          consumptionRate: '0.32',
          distanceLabel: 'Distance',
          estimatedTimeLabel: 'Estimated Time',
          energyRequiredLabel: 'Energy Required',
          arrivalChargeLabel: 'Arrival Charge',
        };
        bindings = [];
        break;
      case 'overheadVisualization':
        width = 780;
        height = 480;
        staticProps = {
          label: 'Overhead Driving Visualization',
          color: '#38bdf8',
          lanesCount: '2',
          opposingLanesCount: '2',
          trafficDensity: 'low',
          sameDirCount: '2',
          opposingDirCount: '1',
          intersectionEnabled: 'true',
          crossTrafficCount: '2',
          trafficLightState: 'green',
          crosswalkEnabled: 'true',
          stopLineEnabled: 'true',
          speedLimitValue: '65',
          speedLimitUnits: 'MPH',
          speedLimitVisible: 'true',
          speedLimitPosition: 'bottom-right',
          speedLimitStyle: 'us_standard',
          blindSpotWarning: 'auto',
          leftBlindSpot: 'false',
          rightBlindSpot: 'false',
          blindSpotColor: '#ef4444',
          blindSpotOpacity: '0.6',
          sensorWarning: 'auto',
          sensorColor: '#ef4444',
          sensorOpacity: '0.6',
        };
        bindings = [];
        break;
      case 'miniNav':
        width = 320;
        height = 510;
        staticProps = {
          label: 'Mini Nav',
          highwayName: 'I-280 N',
          nextExit: 'Exit 12: Foothill Expwy',
          distanceToManeuver: '0.8 mi',
          maneuverType: 'slight-right',
          laneCount: '3',
          activeLaneIndex: '2',
        };
        bindings = [];
        break;
      case 'phoneContacts':
        width = 420;
        height = 480;
        staticProps = { label: 'Contacts' };
        bindings = [];
        break;
      case 'phoneDialPad':
        width = 380;
        height = 480;
        staticProps = { label: 'Dial Pad' };
        bindings = [];
        break;
      case 'phoneMessaging':
        width = 440;
        height = 480;
        staticProps = { label: 'Messaging' };
        bindings = [];
        break;
      case 'climateVent':
        width = 460;
        height = 280;
        staticProps = { label: 'Vent Dashboard' };
        bindings = [];
        break;
      case 'climateTemp':
        width = 220;
        height = 380;
        staticProps = { label: 'Temperature', temp: '72°F', minTemp: '60', maxTemp: '85' };
        bindings = [];
        break;
      case 'climateSeats':
        width = 380;
        height = 220;
        staticProps = { label: 'Seat Climate' };
        bindings = [];
        break;
      case 'vehicleExplodedView':
        width = 640;
        height = 420;
        staticProps = {
          label: 'Vehicle Exploded View',
          imageUrl: '',
          removeBg: 'true',
          bgTolerance: '25',
        };
        bindings = [];
        break;
      case 'vehicleStatusCallout':
        width = 320;
        height = 160;
        staticProps = {
          label: 'Vehicle Status Callout',
          title: 'Front Powertrain',
          description: 'Primary electric drive unit & inverter',
          statusCode: '4101',
          statusMessage: 'Operating within normal thermal parameters',
          healthType: 'rgy',
          healthValue: 'green',
        };
        bindings = [];
        break;
      case 'sendToServiceCenter':
        width = 280;
        height = 100;
        staticProps = {
          label: 'Send Vehicle Diagnostics',
          buttonLabel: 'Send Vehicle Diagnostics',
          reportTitle: 'Vehicle Diagnostic Report',
          confirmLabel: 'Confirm Send',
          cancelLabel: 'Cancel',
          sendingLabel: 'Generating & Sending Report...',
          successLabel: 'Report Dispatched & Downloaded',
        };
        bindings = [];
        break;
    }

    const defaultZIndex = type === 'map' ? 0 : 10;

    const newComponent: ComponentInstance = {
      id,
      type,
      x: initialX,
      y: initialY,
      width,
      height,
      staticProps,
      bindings,
      zIndex: defaultZIndex,
    };

    set((state) => {
      const isNotif = getComponentCategory(type) === 'notification';

      if (isNotif) {
        const updatedNotifs = [...state.notificationComponents, newComponent];
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
        } catch (e) {
          console.error('Failed to save notification components', e);
        }
        return {
          notificationComponents: updatedNotifs,
          selectedComponentId: id,
        };
      }

      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const updatedList = [...currentList, newComponent];
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save components by screen', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
        selectedComponentId: id,
      };
    });

    return id;
  },

  updateComponentPosition: (id, x, y) => {
    set((state) => {
      let finalX = x;
      let finalY = y;
      if (state.gridConfig.snapToGrid && state.gridConfig.size > 0) {
        finalX = Math.round(x / state.gridConfig.size) * state.gridConfig.size;
        finalY = Math.round(y / state.gridConfig.size) * state.gridConfig.size;
      }

      const inNotifs = state.notificationComponents.some((c) => c.id === id);
      if (inNotifs) {
        const updatedNotifs = state.notificationComponents.map((c) => (c.id === id ? { ...c, x: finalX, y: finalY } : c));
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
        } catch (e) {
          console.error('Failed to save notification position', e);
        }
        return {
          notificationComponents: updatedNotifs,
        };
      }

      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const updatedList = currentList.map((c) => (c.id === id ? { ...c, x: finalX, y: finalY } : c));
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save position', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  updateComponentSize: (id, width, height) => {
    set((state) => {
      let finalW = width;
      let finalH = height;
      if (state.gridConfig.snapToGrid && state.gridConfig.size > 0) {
        finalW = Math.max(state.gridConfig.size, Math.round(width / state.gridConfig.size) * state.gridConfig.size);
        finalH = Math.max(state.gridConfig.size, Math.round(height / state.gridConfig.size) * state.gridConfig.size);
      }

      const inNotifs = state.notificationComponents.some((c) => c.id === id);
      if (inNotifs) {
        const updatedNotifs = state.notificationComponents.map((c) =>
          c.id === id ? { ...c, width: Math.max(80, finalW), height: Math.max(50, finalH) } : c
        );
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
        } catch (e) {
          console.error('Failed to save notification size', e);
        }
        return {
          notificationComponents: updatedNotifs,
        };
      }

      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const updatedList = currentList.map((c) => {
        if (c.id === id) {
          const minW = c.type === 'mediaSearch' ? 550 : 40;
          const maxW = Math.max(minW, 1920 - (c.x || 0));
          const maxH = Math.max(40, 1080 - (c.y || 0));
          return {
            ...c,
            width: Math.min(maxW, Math.max(minW, finalW)),
            height: Math.min(maxH, Math.max(40, finalH)),
          };
        }
        return c;
      });
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save size', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  updateComponentStaticProps: (id, staticProps) => {
    set((state) => {
      const inNotifs = state.notificationComponents.some((c) => c.id === id);
      if (inNotifs) {
        const updatedNotifs = state.notificationComponents.map((c) =>
          c.id === id ? { ...c, staticProps: { ...c.staticProps, ...staticProps } } : c
        );
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
        } catch (e) {
          console.error('Failed to save notification staticProps', e);
        }
        return {
          notificationComponents: updatedNotifs,
        };
      }

      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const updatedList = currentList.map((c) =>
        c.id === id ? { ...c, staticProps: { ...c.staticProps, ...staticProps } } : c
      );
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save staticProps', e);
      }

      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  updateComponentConnector: (id, connector) => {
    set((state) => {
      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const updatedList = currentList.map((c) =>
        c.id === id ? { ...c, connector } : c
      );
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save connector', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  updateComponentZIndex: (id, zIndex) => {
    const clampedZ = Math.max(-10, Math.min(100, Math.round(zIndex)));
    set((state) => {
      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const updatedList = currentList.map((c) => (c.id === id ? { ...c, zIndex: clampedZ } : c));
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save zIndex', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  bringToFront: (id) => {
    set((state) => {
      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const index = currentList.findIndex((c) => c.id === id);
      if (index === -1) return state;

      const item = currentList[index];
      const maxZ = currentList.reduce((max, c) => Math.max(max, c.zIndex ?? 0), 0);
      const newZ = Math.min(100, Math.max(maxZ + 1, 10));
      const updatedItem = { ...item, zIndex: newZ };
      const filtered = currentList.filter((c) => c.id !== id);
      const updatedList = [...filtered, updatedItem];

      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save bringToFront', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  sendToBack: (id) => {
    set((state) => {
      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const index = currentList.findIndex((c) => c.id === id);
      if (index === -1) return state;

      const item = currentList[index];
      const minZ = currentList.reduce((min, c) => Math.min(min, c.zIndex ?? 0), 0);
      const newZ = Math.max(-10, Math.min(minZ - 1, 0));
      const updatedItem = { ...item, zIndex: newZ };
      const filtered = currentList.filter((c) => c.id !== id);
      const updatedList = [updatedItem, ...filtered];

      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save sendToBack', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  deleteComponent: (id) => {
    set((state) => {
      const inNotifs = state.notificationComponents.some((c) => c.id === id);
      if (inNotifs) {
        const updatedNotifs = state.notificationComponents.filter((c) => c.id !== id);
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
        } catch (e) {
          console.error('Failed to delete notification component', e);
        }
        return {
          notificationComponents: updatedNotifs,
          selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
        };
      }

      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      // Filter out deleted component and clear connector on any callout that pointed to the deleted component
      const updatedList = currentList
        .filter((c) => c.id !== id)
        .map((c) => {
          if (c.connector && c.connector.targetComponentId === id) {
            return { ...c, connector: null };
          }
          return c;
        });

      // Also clean up references across all screens in componentsByScreen
      const updatedScreens: Record<string, ComponentInstance[]> = {};
      for (const [screenKey, screenComps] of Object.entries(state.componentsByScreen)) {
        if (screenKey === activeScreen) {
          updatedScreens[screenKey] = updatedList;
        } else {
          updatedScreens[screenKey] = (screenComps || [])
            .filter((c) => c.id !== id)
            .map((c) => {
              if (c.connector && c.connector.targetComponentId === id) {
                return { ...c, connector: null };
              }
              return c;
            });
        }
      }

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to delete component', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
        selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
      };
    });
  },

  copyComponent: (id) => {
    const targetId = id || get().selectedComponentId;
    if (!targetId) return;

    const state = get();
    let foundComp: ComponentInstance | undefined;
    let sourceScreen: ActiveView = state.activeView;

    // Search notification components
    foundComp = state.notificationComponents.find((c) => c.id === targetId);
    if (!foundComp) {
      // Search active screen components
      const currentList = state.componentsByScreen[state.activeView] || [];
      foundComp = currentList.find((c) => c.id === targetId);
    }
    if (!foundComp) {
      // Search all screens
      for (const sKey of ['home', 'navigation', 'media', 'phone'] as ActiveView[]) {
        const c = (state.componentsByScreen[sKey] || []).find((comp) => comp.id === targetId);
        if (c) {
          foundComp = c;
          sourceScreen = sKey;
          break;
        }
      }
    }

    if (foundComp) {
      const clonedComp: ComponentInstance = JSON.parse(JSON.stringify(foundComp));
      set({
        copiedComponent: {
          component: clonedComp,
          sourceScreen,
        },
      });
    }
  },

  pasteComponent: () => {
    const { copiedComponent, activeView, gridConfig } = get();
    if (!copiedComponent) return null;

    const { component, sourceScreen } = copiedComponent;
    const isNotif = getComponentCategory(component.type) === 'notification';

    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const newId = `comp-${component.type}-${timestamp}-${randomSuffix}`;

    const freshBindings = (component.bindings || []).map((b, idx) => ({
      ...b,
      id: `bind-${timestamp}-${idx}-${Math.floor(Math.random() * 1000)}`,
    }));

    const gridSize = gridConfig?.size || 22;
    const spacing = gridSize;

    // Base offset strategy:
    // If pasting onto the SAME screen: add offset from current location
    // If pasting to a DIFFERENT screen: start at original relative coordinates
    const isSameScreen = isNotif || sourceScreen === activeView;
    const baseOffset = isSameScreen ? gridSize : 0;

    let targetX = component.x + baseOffset;
    let targetY = component.y + baseOffset;

    // Safety bounds clamp
    if (targetX + component.width > CANVAS_WIDTH) {
      targetX = Math.max(0, CANVAS_WIDTH - component.width - 20);
    }
    if (targetY + component.height > CANVAS_HEIGHT) {
      targetY = Math.max(0, CANVAS_HEIGHT - component.height - 20);
    }

    const existingList: Rect[] = isNotif
      ? get().notificationComponents
      : (get().componentsByScreen[activeView] || []);

    const candidateRect = (x: number, y: number): Rect => ({
      x,
      y,
      width: component.width,
      height: component.height,
    });

    let attempts = 0;
    const maxAttempts = 50;
    while (!hasSufficientSpacing(candidateRect(targetX, targetY), existingList, spacing) && attempts < maxAttempts) {
      targetX += gridSize;
      targetY += gridSize;
      if (targetX + component.width > CANVAS_WIDTH) {
        targetX = Math.max(0, CANVAS_WIDTH - component.width - 20);
      }
      if (targetY + component.height > CANVAS_HEIGHT) {
        targetY = Math.max(0, CANVAS_HEIGHT - component.height - 20);
      }
      attempts++;
    }

    const newComponent: ComponentInstance = {
      id: newId,
      type: component.type,
      x: targetX,
      y: targetY,
      width: component.width,
      height: component.height,
      staticProps: JSON.parse(JSON.stringify(component.staticProps || {})),
      bindings: freshBindings,
    };

    const updatedCopiedState: CopiedComponentState = {
      component: {
        ...component,
        x: targetX,
        y: targetY,
      },
      sourceScreen: activeView,
    };

    set((state) => {
      if (isNotif) {
        const updatedNotifs = [...state.notificationComponents, newComponent];
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
        } catch (e) {
          console.error('Failed to save notification components', e);
        }
        return {
          notificationComponents: updatedNotifs,
          selectedComponentId: newId,
          copiedComponent: updatedCopiedState,
        };
      }

      const currentList = state.componentsByScreen[activeView] || [];
      const updatedList = [...currentList, newComponent];
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeView]: updatedList,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save components by screen', e);
      }

      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
        selectedComponentId: newId,
        copiedComponent: updatedCopiedState,
      };
    });

    return newId;
  },

  addBinding: (componentId, bindingData) => {
    const bindingId = `bind-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const newBinding: Binding = { ...bindingData, id: bindingId };

    set((state) => {
      const inNotifs = state.notificationComponents.some((c) => c.id === componentId);
      if (inNotifs) {
        const updatedNotifs = state.notificationComponents.map((c) =>
          c.id === componentId ? { ...c, bindings: [...c.bindings, newBinding] } : c
        );
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
        } catch (e) {
          console.error('Failed to save notification binding', e);
        }
        return {
          notificationComponents: updatedNotifs,
        };
      }

      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const updatedList = currentList.map((c) =>
        c.id === componentId ? { ...c, bindings: [...c.bindings, newBinding] } : c
      );
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to save binding', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  updateBinding: (componentId, bindingId, partial) => {
    set((state) => {
      const inNotifs = state.notificationComponents.some((c) => c.id === componentId);
      if (inNotifs) {
        const updatedNotifs = state.notificationComponents.map((c) => {
          if (c.id !== componentId) return c;
          const updatedBindings = c.bindings.map((b) => (b.id === bindingId ? { ...b, ...partial } : b));
          return { ...c, bindings: updatedBindings };
        });
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
        } catch (e) {
          console.error('Failed to update notification binding', e);
        }
        return {
          notificationComponents: updatedNotifs,
        };
      }

      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const updatedList = currentList.map((c) => {
        if (c.id !== componentId) return c;
        const updatedBindings = c.bindings.map((b) => (b.id === bindingId ? { ...b, ...partial } : b));
        return { ...c, bindings: updatedBindings };
      });
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to update binding', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  removeBinding: (componentId, bindingId) => {
    set((state) => {
      const inNotifs = state.notificationComponents.some((c) => c.id === componentId);
      if (inNotifs) {
        const updatedNotifs = state.notificationComponents.map((c) => {
          if (c.id !== componentId) return c;
          return { ...c, bindings: c.bindings.filter((b) => b.id !== bindingId) };
        });
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
        } catch (e) {
          console.error('Failed to remove notification binding', e);
        }
        return {
          notificationComponents: updatedNotifs,
        };
      }

      const activeScreen = state.activeView;
      const currentList = state.componentsByScreen[activeScreen] || [];
      const updatedList = currentList.map((c) => {
        if (c.id !== componentId) return c;
        return { ...c, bindings: c.bindings.filter((b) => b.id !== bindingId) };
      });
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedScreens));
      } catch (e) {
        console.error('Failed to remove binding', e);
      }
      return {
        componentsByScreen: updatedScreens,
        components: updatedList,
      };
    });
  },

  /**
   * Reset restores the original seed data and notification layer.
   */
  resetToSeedData: () => {
    set(() => {
      const resetState: Record<string, ComponentInstance[]> = {
        home: HOME_SEED_COMPONENTS,
        navigation: NAVIGATION_SEED_COMPONENTS,
        media: MEDIA_SEED_COMPONENTS,
        phone: [],
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_SCREENS_KEY, JSON.stringify(DEFAULT_SCREENS));
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(resetState));
        localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(DEFAULT_NOTIFICATION_COMPONENTS));
        localStorage.setItem(LOCAL_STORAGE_STACK_POS_KEY, 'top-center');
        localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(INITIAL_VEHICLE_STATE));
        localStorage.setItem(LOCAL_STORAGE_DOCK_ORDER_KEY, JSON.stringify(DEFAULT_DOCK_ORDER));
        localStorage.setItem(LOCAL_STORAGE_VEHICLE_BG_KEY, JSON.stringify(DEFAULT_VEHICLE_BACKGROUND));
        localStorage.setItem(LOCAL_STORAGE_CLIMATE_STATE_KEY, JSON.stringify(INITIAL_CLIMATE_STATE));
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_TRIP_KEY);
      } catch (e) {
        console.error('Failed to reset store data', e);
      }
      return {
        screens: DEFAULT_SCREENS,
        componentsByScreen: resetState,
        notificationComponents: DEFAULT_NOTIFICATION_COMPONENTS,
        notificationStackPosition: 'top-center',
        components: HOME_SEED_COMPONENTS,
        vehicleState: INITIAL_VEHICLE_STATE,
        climateState: INITIAL_CLIMATE_STATE,
        dockOrder: DEFAULT_DOCK_ORDER,
        selectedComponentId: null,
        activeView: 'home',
        vehicleBackground: DEFAULT_VEHICLE_BACKGROUND,
        conversations: INITIAL_CONVERSATIONS,
        selectedMessagingThreadId: null,
        queuedMessageToasts: [],
        activeTrip: null,
      };
    });
  },
}));
