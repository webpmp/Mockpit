import { ComponentType } from '../types';

export type SidebarCategoryKey = 'home' | 'navigation' | 'vehicle' | 'media' | 'phone' | 'climate';

// Hex values match the Tailwind *-400 classes used for each category's
// sidebar header in Sidebar.tsx's CATEGORIES array. Keep these two in sync —
// if a category's color changes in Sidebar.tsx, update the matching hex here.
export const CATEGORY_ICON_HEX: Record<SidebarCategoryKey, string> = {
  home: '#38bdf8',       // sky-400 (Dashboard)
  navigation: '#34d399', // emerald-400
  vehicle: '#818cf8',    // indigo-400
  media: '#f472b6',      // pink-400
  phone: '#2dd4bf',      // teal-400
  climate: '#fb923c',    // orange-400
};

// Maps each canvas component TYPE to the sidebar CATEGORY it's grouped
// under. NOTE: the 'climate' component type (Dashboard's "Climate Control"
// widget, in HOME_WIDGET_ITEMS) belongs to the 'home' category — do not
// confuse it with the 'climate' category key used by climateVent/
// climateTemp/climateSeats. 'warning' is intentionally omitted: alert icons
// stay red and never take a category color.
export const COMPONENT_TYPE_TO_CATEGORY: Partial<Record<ComponentType, SidebarCategoryKey>> = {
  battery: 'home',
  gear: 'home',
  speed: 'home',
  climate: 'home',
  driveMode: 'home',
  tirePressure: 'home',

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
};
