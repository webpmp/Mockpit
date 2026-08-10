import { create } from 'zustand';
import { SEED_COMPONENTS } from '../data/seedProject';
import {
  ActiveView,
  Binding,
  BUILTIN_PALETTES,
  ComponentInstance,
  ComponentType,
  CopiedComponentState,
  getComponentCategory,
  GridConfig,
  NotificationStackPosition,
  PaletteConfig,
  PalettePresetId,
  ScreenDefinition,
  ScreenMode,
  TransitionStyle,
  VehicleState,
} from '../types';

const LOCAL_STORAGE_KEY = 'mockpit_components_v1';
const LOCAL_STORAGE_KEY_V2 = 'mockpit_components_by_screen_v2';
const LOCAL_STORAGE_NOTIFICATIONS_KEY = 'mockpit_notification_components_v1';
const LOCAL_STORAGE_STACK_POS_KEY = 'mockpit_notification_stack_pos_v1';
const LOCAL_STORAGE_STATE_KEY = 'mockpit_vehicle_state_v1';
const LOCAL_STORAGE_DOCK_ORDER_KEY = 'mockpit_dock_order_v1';
const LOCAL_STORAGE_SCREENS_KEY = 'mockpit_screens_v1';
const LOCAL_STORAGE_PALETTE_KEY = 'mockpit_palette_v1';
const LOCAL_STORAGE_GRID_KEY = 'mockpit_grid_config_v1';

export const DEFAULT_SCREENS: ScreenDefinition[] = [
  { id: 'home', name: 'Home', order: 0, transitionStyle: 'fade', parentId: null },
  { id: 'navigation', name: 'Navigation', order: 1, transitionStyle: 'fade', parentId: null },
  { id: 'media', name: 'Media', order: 2, transitionStyle: 'fade', parentId: null },
  { id: 'phone', name: 'Phone', order: 3, transitionStyle: 'fade', parentId: null },
  { id: 'playlists', name: 'Playlists', order: 4, transitionStyle: 'fade', parentId: 'media' },
  { id: 'favorites', name: 'Favorites', order: 5, transitionStyle: 'fade', parentId: 'navigation' },
];

const DEFAULT_DOCK_ORDER: string[] = ['home', 'navigation', 'media', 'phone'];

const INITIAL_VEHICLE_STATE: VehicleState = {
  gear: 'P',
  speed: 0,
  batteryPercent: 82,
  isCharging: false,
  doorOpen: false,
  driveMode: 'Normal',
  signalBars: 4,
  mapLat: 37.3318,
  mapLng: -122.0311,
  cruiseControlActive: false,
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
      triggerMode: 'event',
      triggerEvent: 'cruise_on',
    },
    bindings: [],
  },
  {
    id: 'comp-warning-cruise-off',
    type: 'warning',
    x: 0,
    y: 0,
    width: 380,
    height: 120,
    staticProps: {
      label: 'CRUISE CONTROL',
      icon: 'gauge',
      message: 'CRUISE CONTROL DISENGAGED',
      visible: 'false',
      color: '#06b6d4',
      severity: 'info',
      triggerMode: 'event',
      triggerEvent: 'cruise_off',
    },
    bindings: [],
  },
];

const NAVIGATION_SEED_COMPONENTS: ComponentInstance[] = [
  {
    id: 'comp-nav-map-1',
    type: 'map',
    x: 40,
    y: 40,
    width: 980,
    height: 520,
    staticProps: { lat: '37.3318', lng: '-122.0311', zoom: '12' },
    bindings: [],
  },
  {
    id: 'comp-nav-home-1',
    type: 'navHome',
    x: 1040,
    y: 40,
    width: 380,
    height: 140,
    staticProps: { address: '100 Infinite Loop, Cupertino, CA', lat: '37.3318', lng: '-122.0311', label: 'Home' },
    bindings: [],
  },
  {
    id: 'comp-nav-dest-1',
    type: 'navDestination',
    x: 1040,
    y: 200,
    width: 380,
    height: 200,
    staticProps: { destination: 'Yosemite Valley, CA', lat: '37.7456', lng: '-119.5936', stops: 'In-N-Out Merced|Tunnel View Overlook' },
    bindings: [],
  },
  {
    id: 'comp-nav-trip-1',
    type: 'navTripEstimate',
    x: 1040,
    y: 420,
    width: 380,
    height: 160,
    staticProps: { startLat: '37.3318', startLng: '-122.0311', destLat: '37.7456', destLng: '-119.5936', consumptionRate: '0.32' },
    bindings: [],
  },
];

const INITIAL_COMPONENTS_BY_SCREEN: Record<ActiveView, ComponentInstance[]> = {
  home: HOME_SEED_COMPONENTS,
  navigation: NAVIGATION_SEED_COMPONENTS,
  media: [],
  phone: [],
};

export const DEFAULT_COMPONENT_DIMENSIONS: Record<ComponentType, { width: number; height: number; maxHeight: number }> = {
  battery: { width: 340, height: 130, maxHeight: 250 },
  gear: { width: 200, height: 140, maxHeight: 250 },
  speed: { width: 220, height: 150, maxHeight: 280 },
  warning: { width: 380, height: 100, maxHeight: 250 },
  charging: { width: 340, height: 120, maxHeight: 250 },
  map: { width: 440, height: 280, maxHeight: 950 },
  media: { width: 340, height: 150, maxHeight: 350 },
  climate: { width: 280, height: 140, maxHeight: 250 },
  phone: { width: 320, height: 130, maxHeight: 250 },
  driveMode: { width: 280, height: 140, maxHeight: 250 },
  tirePressure: { width: 320, height: 160, maxHeight: 300 },
  navHome: { width: 380, height: 140, maxHeight: 250 },
  navDestination: { width: 380, height: 200, maxHeight: 350 },
  navSearch: { width: 380, height: 220, maxHeight: 350 },
  navTripEstimate: { width: 380, height: 160, maxHeight: 300 },
  subnav: { width: 480, height: 60, maxHeight: 120 },
};

function sanitizeComponentList(list: ComponentInstance[]): ComponentInstance[] {
  return list.map((c) => {
    let updated = { ...c };
    const dim = DEFAULT_COMPONENT_DIMENSIONS[c.type];
    if (dim && typeof updated.height === 'number') {
      if (updated.height > dim.maxHeight) {
        updated.height = dim.height;
      }
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
          return [{ ...homeItem, name: 'Home', order: 0, parentId: null }, ...rest].map((s, idx) => ({
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
                label: c.staticProps?.label || defaultComp.staticProps.label,
                icon: c.staticProps?.icon || defaultComp.staticProps.icon,
                triggerMode: c.staticProps?.triggerMode || defaultComp.staticProps.triggerMode,
                triggerEvent: c.staticProps?.triggerEvent || defaultComp.staticProps.triggerEvent,
              },
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
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load dock order from localStorage', e);
  }
  return screens.map((s) => s.id);
}

export function applyCssVariables(palette: PaletteConfig) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-secondary', palette.secondary);
    root.style.setProperty('--color-tertiary', palette.tertiary);
  }
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

  // Settings, Palette & Canvas Grid
  isSettingsOpen: boolean;
  toggleSettingsModal: () => void;
  setSettingsModalOpen: (open: boolean) => void;
  activePalette: PaletteConfig;
  setPalette: (palette: PaletteConfig) => void;
  gridConfig: GridConfig;
  setGridConfig: (config: Partial<GridConfig>) => void;
  toggleGridVisibility: () => void;
  toggleSnapToGrid: () => void;
  resnapAllComponentsToGrid: (newSize: number) => void;

  // Dynamic Screen Management
  addScreen: (name: string, transitionStyle?: TransitionStyle, parentId?: string | null) => string;
  updateScreen: (id: string, updates: Partial<Omit<ScreenDefinition, 'id'>>) => void;
  deleteScreen: (id: string) => void;
  reorderScreens: (newScreens: ScreenDefinition[]) => void;
  moveScreen: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;

  // Ambient Simulation
  ambientTick: () => void;

  // Vehicle State Actions
  setVehicleState: (partial: Partial<VehicleState>) => void;
  resetVehicleState: () => void;
  applyPresetScenario: (scenario: 'low_battery' | 'highway_cruise' | 'charging_station' | 'door_alert' | 'parked') => void;

  // Notifications
  triggerEventNotification: (eventName: string) => void;
  clearEventNotification: (id: string) => void;
  triggerNotification: (notif: { message: string; icon?: string; color?: string; severity?: string }) => void;
  clearTransientNotification: (id: string) => void;

  // Screen / UI Actions
  setScreenMode: (mode: ScreenMode) => void;
  setActiveView: (view: ActiveView) => void;
  setNotificationStackPosition: (position: NotificationStackPosition) => void;
  reorderNotificationComponent: (id: string, direction: 'up' | 'down') => void;
  toggleDebugPanel: () => void;
  setDebugPanelOpen: (open: boolean) => void;
  setDebugPanelHeight: (height: number) => void;
  selectComponent: (id: string | null) => void;
  setDockOrder: (newOrder: string[]) => void;
  moveDockItem: (id: string, direction: 'left' | 'right') => void;

  // Component Actions
  addComponent: (type: ComponentType, x?: number, y?: number) => string;
  updateComponentPosition: (id: string, x: number, y: number) => void;
  updateComponentSize: (id: string, width: number, height: number) => void;
  updateComponentStaticProps: (id: string, staticProps: Record<string, string>) => void;
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

export const useMockpitStore = create<MockpitStore>((set, get) => ({
  vehicleState: loadSavedVehicleState(),
  screens: initialScreensList,
  componentsByScreen: initialScreens,
  notificationComponents: initialNotifs,
  transientNotifications: [],
  activeEventNotifIds: [],
  notificationStackPosition: loadSavedStackPosition(),
  components: initialScreens.home || [],
  selectedComponentId: 'comp-speed-1',
  screenMode: 'editor',
  activeView: 'home',
  isDebugOpen: false,
  debugPanelHeight: 45,
  dockOrder: loadSavedDockOrder(initialScreensList),
  copiedComponent: null,

  isSettingsOpen: false,
  toggleSettingsModal: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setSettingsModalOpen: (open) => set({ isSettingsOpen: open }),

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
  toggleSnapToGrid: () =>
    set((state) => {
      const updated = { ...state.gridConfig, snapToGrid: !state.gridConfig.snapToGrid };
      try {
        localStorage.setItem(LOCAL_STORAGE_GRID_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save grid config to localStorage', e);
      }
      return { gridConfig: updated };
    }),
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
    const updatedDockOrder = state.dockOrder.includes(newId) ? state.dockOrder : [...state.dockOrder, newId];

    try {
      localStorage.setItem(LOCAL_STORAGE_SCREENS_KEY, JSON.stringify(updatedScreens));
      localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(updatedComponentsByScreen));
      localStorage.setItem(LOCAL_STORAGE_DOCK_ORDER_KEY, JSON.stringify(updatedDockOrder));
    } catch (e) {
      console.error('Failed to save added screen', e);
    }

    set({
      screens: updatedScreens,
      componentsByScreen: updatedComponentsByScreen,
      dockOrder: updatedDockOrder,
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

    // Speed drift: ±1–2 mph around set speed when cruise active, otherwise ±1–speedDriftCeiling mph while gear === 'D' or 'R'
    if (currentVs.cruiseControlActive) {
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
      newVs.speed = Math.max(0, Math.min(120, currentVs.speed + delta));
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
    }

    const chargingComp = allComps.find((c) => c.type === 'charging');
    if (chargingComp?.staticProps) {
      const cp = parseFloat(chargingComp.staticProps.chargePercentPerInterval);
      const ci = parseFloat(chargingComp.staticProps.chargeIntervalSeconds);
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

      // Manage cruise control set speed
      if (rawUpdated.cruiseControlActive) {
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
    if (
      partial.cruiseControlActive !== undefined &&
      partial.cruiseControlActive !== prevVs.cruiseControlActive
    ) {
      if (vs.cruiseControlActive) {
        get().triggerEventNotification('cruise_on');
      } else {
        get().triggerEventNotification('cruise_off');
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
    } else if (notif.message.includes('DISENGAGED') || notif.message.includes('OFF')) {
      get().triggerEventNotification('cruise_off');
    }
  },

  clearTransientNotification: (id) => {
    set((state) => ({
      transientNotifications: state.transientNotifications.filter((c) => c.id !== id),
    }));
  },

  setScreenMode: (mode) => set({ screenMode: mode }),

  setActiveView: (view) =>
    set((state) => ({
      activeView: view,
      components: state.componentsByScreen[view] || [],
    })),

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
        staticProps = { label: '80%', color: '#22c55e', icon: 'battery', drainPercentPerInterval: '1', drainIntervalSeconds: '60' };
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
        staticProps = { label: 'P', color: '#f8fafc' };
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
          label: '0',
          unit: 'mph',
          color: '#38bdf8',
          displayStyle: 'numeric',
          maxSpeed: '120',
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
      case 'charging':
        width = 340;
        height = 120;
        staticProps = { icon: 'zap', label: 'CHARGING', visible: 'false', color: '#3b82f6', chargePercentPerInterval: '5', chargeIntervalSeconds: '60' };
        bindings = [
          {
            id: `bind-${Date.now()}-1`,
            stateField: 'isCharging',
            condition: '=',
            value: true,
            targetProp: 'visible',
            targetValue: 'true',
          },
          {
            id: `bind-${Date.now()}-2`,
            stateField: 'isCharging',
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
        width = 340;
        height = 150;
        staticProps = { title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming" };
        bindings = [];
        break;
      case 'climate':
        width = 280;
        height = 140;
        staticProps = { temp: '72°F', fanSpeed: 'Auto 3', mode: 'AC Dual' };
        bindings = [];
        break;
      case 'phone':
        width = 320;
        height = 130;
        staticProps = { contact: 'Alex Morgan', number: '+1 (555) 019-2834', status: 'Connected' };
        bindings = [];
        break;
      case 'driveMode':
        width = 280;
        height = 130;
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
        width = 320;
        height = 160;
        staticProps = { frontLeft: '35 PSI', frontRight: '35 PSI', rearLeft: '36 PSI', rearRight: '36 PSI' };
        bindings = [];
        break;
      case 'navHome':
        width = 380;
        height = 140;
        staticProps = { address: '100 Infinite Loop, Cupertino, CA', lat: '37.3318', lng: '-122.0311', label: 'Home' };
        bindings = [];
        break;
      case 'navDestination':
        width = 380;
        height = 200;
        staticProps = { destination: 'Yosemite Valley, CA', lat: '37.7456', lng: '-119.5936', stops: 'In-N-Out Merced|Tunnel View Overlook' };
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
        height = 160;
        staticProps = { startLat: '37.3318', startLng: '-122.0311', destLat: '37.7456', destLng: '-119.5936', consumptionRate: '0.32' };
        bindings = [];
        break;
      case 'subnav':
        width = 480;
        height = 60;
        staticProps = { variant: 'pills', color: '#38bdf8' };
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
      const inNotifs = state.notificationComponents.some((c) => c.id === id);
      if (inNotifs) {
        const updatedNotifs = state.notificationComponents.map((c) => (c.id === id ? { ...c, x, y } : c));
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
      const updatedList = currentList.map((c) => (c.id === id ? { ...c, x, y } : c));
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
      const inNotifs = state.notificationComponents.some((c) => c.id === id);
      if (inNotifs) {
        const updatedNotifs = state.notificationComponents.map((c) =>
          c.id === id ? { ...c, width: Math.max(80, width), height: Math.max(50, height) } : c
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
          const dim = DEFAULT_COMPONENT_DIMENSIONS[c.type];
          const maxH = dim ? dim.maxHeight : 950;
          return {
            ...c,
            width: Math.max(80, width),
            height: Math.min(maxH, Math.max(50, height)),
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
      const updatedList = currentList.filter((c) => c.id !== id);
      const updatedScreens = {
        ...state.componentsByScreen,
        [activeScreen]: updatedList,
      };

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
    const { copiedComponent, activeView } = get();
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

    // Same-screen paste offsets +20px x/y. Different-screen paste uses original x/y.
    const isSameScreen = isNotif || sourceScreen === activeView;
    const newX = isSameScreen ? component.x + 20 : component.x;
    const newY = isSameScreen ? component.y + 20 : component.y;

    const newComponent: ComponentInstance = {
      id: newId,
      type: component.type,
      x: newX,
      y: newY,
      width: component.width,
      height: component.height,
      staticProps: JSON.parse(JSON.stringify(component.staticProps || {})),
      bindings: freshBindings,
    };

    const updatedCopiedState: CopiedComponentState = {
      component: {
        ...component,
        x: newX,
        y: newY,
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
        media: [],
        phone: [],
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_SCREENS_KEY, JSON.stringify(DEFAULT_SCREENS));
        localStorage.setItem(LOCAL_STORAGE_KEY_V2, JSON.stringify(resetState));
        localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(DEFAULT_NOTIFICATION_COMPONENTS));
        localStorage.setItem(LOCAL_STORAGE_STACK_POS_KEY, 'top-center');
        localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(INITIAL_VEHICLE_STATE));
        localStorage.setItem(LOCAL_STORAGE_DOCK_ORDER_KEY, JSON.stringify(DEFAULT_DOCK_ORDER));
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
        dockOrder: DEFAULT_DOCK_ORDER,
        selectedComponentId: 'comp-speed-1',
        activeView: 'home',
      };
    });
  },
}));
