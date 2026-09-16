import { ComponentType } from '../types';
import { getComponentColor } from './componentMeta';

export type SidebarCategoryKey =
  | 'home'
  | 'navigation'
  | 'vehicle'
  | 'media'
  | 'phone'
  | 'climate'
  | 'weather';

// Hex values match the Tailwind *-400 classes used for each category's
// sidebar header in Sidebar.tsx's CATEGORIES array. Keep these in sync —
// if a category's color changes in Sidebar.tsx, update the matching hex here.
export const CATEGORY_ICON_HEX: Record<SidebarCategoryKey, string> = {
  home: '#38bdf8',       // sky-400 (Dashboard)
  navigation: '#34d399', // emerald-400
  vehicle: '#818cf8',    // indigo-400
  media: '#ec4899',      // pink-500 (#ec4899 / rgb(236, 72, 153))
  phone: '#2dd4bf',      // teal-400
  climate: '#fb923c',    // orange-400
  weather: '#38bdf8',    // sky-400 (Weather)
};

// Maps each canvas component TYPE to the sidebar CATEGORY it's grouped
// under. 'warning' is intentionally omitted: alert icons stay red/amber
// and never take a category color.
export const COMPONENT_TYPE_TO_CATEGORY: Partial<Record<ComponentType, SidebarCategoryKey>> = {
  battery: 'home',
  gear: 'home',
  speed: 'home',
  climate: 'home',
  driveMode: 'home',

  map: 'navigation',
  navHome: 'navigation',
  navFavorites: 'navigation',
  navDestination: 'navigation',
  navSearch: 'navigation',
  navTripEstimate: 'navigation',
  navTripSummary: 'navigation',
  overheadVisualization: 'navigation',
  miniNav: 'navigation',

  media: 'media',
  nowPlaying: 'media',
  mediaPlaylists: 'media',
  mediaDiscovery: 'media',
  mediaSearch: 'media',

  phone: 'phone',
  phoneContacts: 'phone',
  phoneDialPad: 'phone',
  phoneMessaging: 'phone',

  climateVent: 'climate',
  climateTemp: 'climate',
  climateSeats: 'climate',

  vehicleExplodedView: 'vehicle',
  vehicleStatusCallout: 'vehicle',
  sendToServiceCenter: 'vehicle',
  tirePressure: 'vehicle',
};

/**
 * Resolves the layer icon color for a component in the Layers panel.
 * Ensures the icon color matches the updated component library icon color
 * for Phone, Climate, Navigation, Vehicle, Weather, Media, and Home screens/categories.
 */
export function resolveLayerIconColor(
  comp: { type: ComponentType; staticProps?: Record<string, string> },
  activeView?: string
): string {
  const rawColor = getComponentColor(comp.type, comp.staticProps?.color);
  const typeCategory = COMPONENT_TYPE_TO_CATEGORY[comp.type];
  const screenCategory =
    activeView && activeView in CATEGORY_ICON_HEX
      ? (activeView as SidebarCategoryKey)
      : undefined;

  // When on climate screen, climate widget aligns with climate category
  const category =
    activeView === 'climate' && comp.type === 'climate'
      ? 'climate'
      : (typeCategory || screenCategory);

  // Preserve custom color override for gear if explicitly customized
  if (comp.type === 'gear') {
    return !comp.staticProps?.color || comp.staticProps?.color === '#f8fafc'
      ? CATEGORY_ICON_HEX.home
      : rawColor;
  }

  // Layer icons colors match the component library category color
  if (category && CATEGORY_ICON_HEX[category]) {
    return CATEGORY_ICON_HEX[category];
  }

  return rawColor;
}

