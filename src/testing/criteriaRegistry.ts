import { CriteriaOperator, TaskActionType } from './types';

export interface CriteriaRegistryEntry {
  id: string;
  label: string;
  kind: 'state' | 'action_event';
  valueType: 'number' | 'enum' | 'boolean' | 'string';
  options?: string[];
  min?: number;
  max?: number;
  operators: CriteriaOperator[];
  criteriaType: TaskActionType;
}

export const CRITERIA_REGISTRY: Record<string, CriteriaRegistryEntry[]> = {
  // Speedometer
  speed: [
    {
      id: 'speed',
      label: 'Vehicle speed (mph)',
      kind: 'state',
      valueType: 'number',
      min: 0,
      max: 140,
      operators: ['>=', '<=', '=', '!=', '>', '<'],
      criteriaType: 'state_field',
    },
  ],

  // Gear Indicator
  gear: [
    {
      id: 'gear',
      label: 'Gear position',
      kind: 'state',
      valueType: 'enum',
      options: ['P', 'R', 'N', 'D'],
      operators: ['=', '!='],
      criteriaType: 'state_field',
    },
  ],

  // Drive Mode Selector
  driveMode: [
    {
      id: 'driveMode',
      label: 'Drive mode',
      kind: 'state',
      valueType: 'enum',
      options: ['Eco', 'Normal', 'Sport'],
      operators: ['=', '!='],
      criteriaType: 'state_field',
    },
  ],

  // Battery Indicator
  battery: [
    {
      id: 'changeBatteryUnit',
      label: 'Battery display unit',
      kind: 'action_event',
      valueType: 'enum',
      options: ['percent', 'miles'],
      operators: ['=', '!='],
      criteriaType: 'action_event',
    },
    {
      id: 'batteryPercent',
      label: 'Battery state of charge (%)',
      kind: 'state',
      valueType: 'number',
      min: 0,
      max: 100,
      operators: ['<=', '>=', '=', '!=', '<', '>'],
      criteriaType: 'state_field',
    },
  ],

  // Climate Temperature Slider
  climateTemp: [
    {
      id: 'driverTemp',
      label: 'Driver cabin temperature (°F)',
      kind: 'state',
      valueType: 'number',
      min: 60,
      max: 85,
      operators: ['=', '!=', '>=', '<=', '>', '<'],
      criteriaType: 'climate_field',
    },
  ],

  // Seat Climate (Heat/Cool)
  climateSeats: [
    {
      id: 'driverSeatHeat',
      label: 'Driver seat heat level',
      kind: 'state',
      valueType: 'number',
      min: 0,
      max: 3,
      operators: ['>', '>=', '=', '!=', '<', '<='],
      criteriaType: 'climate_field',
    },
    {
      id: 'driverSeatCool',
      label: 'Driver seat cool level',
      kind: 'state',
      valueType: 'number',
      min: 0,
      max: 3,
      operators: ['>', '>=', '=', '!=', '<', '<='],
      criteriaType: 'climate_field',
    },
  ],

  // Vent Dashboard
  climateVent: [
    {
      id: 'fanSpeed',
      label: 'HVAC fan speed',
      kind: 'state',
      valueType: 'enum',
      options: ['AUTO', 'LOW', 'MED', 'HIGH'],
      operators: ['=', '!='],
      criteriaType: 'climate_field',
    },
  ],

  // Full Climate Control
  climate: [
    {
      id: 'driverTemp',
      label: 'Cabin temperature (°F)',
      kind: 'state',
      valueType: 'number',
      min: 60,
      max: 85,
      operators: ['=', '!=', '>=', '<=', '>', '<'],
      criteriaType: 'climate_field',
    },
    {
      id: 'fanSpeed',
      label: 'HVAC fan speed',
      kind: 'state',
      valueType: 'enum',
      options: ['AUTO', 'LOW', 'MED', 'HIGH'],
      operators: ['=', '!='],
      criteriaType: 'climate_field',
    },
  ],

  // Send Vehicle Diagnostics Widget
  sendToServiceCenter: [
    {
      id: 'sendDiagnosticReport',
      label: 'Diagnostic report sent',
      kind: 'action_event',
      valueType: 'boolean',
      operators: ['='],
      criteriaType: 'action_event',
    },
  ],

  // Music Media Player
  media: [
    {
      id: 'playTrack',
      label: 'Track playback started',
      kind: 'action_event',
      valueType: 'boolean',
      operators: ['='],
      criteriaType: 'action_event',
    },
    {
      id: 'selectedMusicService',
      label: 'Selected music streaming service',
      kind: 'state',
      valueType: 'enum',
      options: ['Spotify', 'Apple Music', 'YouTube Music', 'Tidal', 'Radio'],
      operators: ['=', '!='],
      criteriaType: 'media_service',
    },
  ],

  // Now Playing
  nowPlaying: [
    {
      id: 'playTrack',
      label: 'Track playback started',
      kind: 'action_event',
      valueType: 'boolean',
      operators: ['='],
      criteriaType: 'action_event',
    },
  ],

  // Phone Dial Pad
  phoneDialPad: [
    {
      id: 'dialPhone',
      label: 'Phone number dialed',
      kind: 'action_event',
      valueType: 'string',
      operators: ['includes', '=', '!='],
      criteriaType: 'action_event',
    },
  ],

  // Navigation Search
  navSearch: [
    {
      id: 'searchDestination',
      label: 'Search destination',
      kind: 'action_event',
      valueType: 'string',
      operators: ['!=', '=', 'includes'],
      criteriaType: 'action_event',
    },
  ],

  // Trip Planner
  navDestination: [
    {
      id: 'addStop',
      label: 'Add stop to trip',
      kind: 'action_event',
      valueType: 'boolean',
      operators: ['='],
      criteriaType: 'action_event',
    },
    {
      id: 'searchDestination',
      label: 'Search destination',
      kind: 'action_event',
      valueType: 'string',
      operators: ['!=', '=', 'includes'],
      criteriaType: 'action_event',
    },
    {
      id: 'activeTrip',
      label: 'Active trip route guidance',
      kind: 'state',
      valueType: 'boolean',
      operators: ['=', '!='],
      criteriaType: 'trip_guidance',
    },
  ],

  // Navigation General
  navigation: [
    {
      id: 'searchDestination',
      label: 'Search destination',
      kind: 'action_event',
      valueType: 'string',
      operators: ['!=', '=', 'includes'],
      criteriaType: 'action_event',
    },
    {
      id: 'addStop',
      label: 'Add stop to trip',
      kind: 'action_event',
      valueType: 'boolean',
      operators: ['='],
      criteriaType: 'action_event',
    },
    {
      id: 'activeTrip',
      label: 'Active trip route guidance',
      kind: 'state',
      valueType: 'boolean',
      operators: ['=', '!='],
      criteriaType: 'trip_guidance',
    },
  ],

  // Navigation Favorites & Recents
  navFavorites: [
    {
      id: 'activeTrip',
      label: 'Active trip route guidance',
      kind: 'state',
      valueType: 'boolean',
      operators: ['=', '!='],
      criteriaType: 'trip_guidance',
    },
  ],

  // Tire Pressure Monitor
  tirePressure: [
    {
      id: 'tirePressureWarning',
      label: 'Tire pressure alert active',
      kind: 'state',
      valueType: 'boolean',
      operators: ['=', '!='],
      criteriaType: 'state_field',
    },
  ],

  // Screen-level group (for "None (screen-level task)")
  'screen-level': [
    {
      id: 'activeView',
      label: 'Active screen view',
      kind: 'state',
      valueType: 'enum',
      options: ['home', 'navigation', 'media', 'phone', 'weather', 'weather-radar', 'playlists', 'favorites'],
      operators: ['=', '!='],
      criteriaType: 'screen_navigate',
    },
  ],
};

// Aliases for screen-level options
CRITERIA_REGISTRY['none'] = CRITERIA_REGISTRY['screen-level'];

/**
 * Returns available criteria entries for a target component type.
 * If screenOptions are provided and activeView is among the entries, its options are populated dynamically.
 */
export function getCriteriaFieldsForComponent(
  componentType: string | undefined,
  screenOptions?: { id: string; label: string }[]
): CriteriaRegistryEntry[] {
  const compKey = componentType && componentType.trim() ? componentType.trim() : 'none';
  const entries = CRITERIA_REGISTRY[compKey] || CRITERIA_REGISTRY['screen-level'] || [];

  if (screenOptions && screenOptions.length > 0) {
    return entries.map((entry) => {
      if (entry.id === 'activeView') {
        return {
          ...entry,
          options: screenOptions.map((s) => s.id),
        };
      }
      return entry;
    });
  }

  return entries;
}

/**
 * Finds a criteria registry entry by field name, optionally scoped to a component type first.
 */
export function findRegistryEntry(
  fieldId: string,
  componentType?: string
): CriteriaRegistryEntry | undefined {
  if (componentType && CRITERIA_REGISTRY[componentType]) {
    const found = CRITERIA_REGISTRY[componentType].find((e) => e.id === fieldId);
    if (found) return found;
  }

  // Fallback: search all registry entries
  for (const entries of Object.values(CRITERIA_REGISTRY)) {
    const found = entries.find((e) => e.id === fieldId);
    if (found) return found;
  }

  return undefined;
}
