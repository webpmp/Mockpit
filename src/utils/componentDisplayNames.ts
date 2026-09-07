/**
 * Centralized Component Display Name Mapping & Resolver
 *
 * Resolves internal camelCase component IDs to canonical, human-readable display names
 * throughout the audit report, inspector, and user-facing UI.
 */

export const COMPONENT_DISPLAY_NAMES: Record<string, string> = {
  // Dashboard & Instruments
  speed: 'Speedometer',
  battery: 'Battery Indicator',
  gear: 'Gear Indicator',
  climate: 'Climate Control',
  driveMode: 'Drive Mode Selector',
  tirePressure: 'Tire Pressure Monitor',

  // Navigation & Driving
  map: 'Navigation Map',
  navFavorites: 'Favorites & Recents',
  navDestination: 'Trip Planner',
  navSearch: 'Navigation Search',
  overheadVisualization: 'Overhead Driving Visualization',
  miniNav: 'Mini Nav',

  // Media & Entertainment
  media: 'Music Media Player',
  nowPlaying: 'Now Playing Card',
  mediaPlaylists: 'Playlists',
  mediaDiscovery: 'Discovery',
  mediaSearch: 'Music Search',

  // Phone & Communication
  phoneContacts: 'Contacts',
  phoneDialPad: 'Dial Pad',
  phoneMessaging: 'Messaging',

  // Climate & Comfort
  climateVent: 'Vent Dashboard',
  climateTemp: 'Temperature Slider',
  climateSeats: 'Seat Climate (Heat/Cool)',

  // Vehicle Diagnostics & Telematics
  vehicleExplodedView: 'Exploded View Chassis',
  vehicleStatusCallout: 'Status Callout',
  sendToServiceCenter: 'Send Vehicle Diagnostics',

  // Alerts & Overlays
  warning: 'Warning Alert Overlay',

  // Auxiliary / Legacy aliases
  phone: 'Phone & Contacts',
  navHome: 'Favorites & Recents',
  navTripEstimate: 'Trip Planner',
};

/**
 * Converts a camelCase or kebab-case identifier into Title Case text.
 * e.g. "myCustomWidget" -> "My Custom Widget"
 */
export function camelCaseToDisplayName(str: string): string {
  if (!str) return '';
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Resolves a component type or instance ID to its readable user-facing Display Name.
 *
 * Priority:
 * 1. Explicit COMPONENT_DISPLAY_NAMES dictionary entry
 * 2. Inspector custom name / label fallback if provided
 * 3. Formatted Title Case conversion of camelCase ID
 */
export function getComponentDisplayName(
  typeOrId?: string,
  fallbackInspectorName?: string
): string {
  if (!typeOrId) return 'Component';

  // 1. Direct match in canonical dictionary
  if (COMPONENT_DISPLAY_NAMES[typeOrId]) {
    return COMPONENT_DISPLAY_NAMES[typeOrId];
  }

  // 2. Custom name from Inspector if provided
  if (fallbackInspectorName && fallbackInspectorName.trim()) {
    return fallbackInspectorName.trim();
  }

  // 3. Fallback: Convert camelCase internal ID into readable text
  return camelCaseToDisplayName(typeOrId);
}
