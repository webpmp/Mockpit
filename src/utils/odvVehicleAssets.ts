export interface EgoVehicleColorsConfig {
  body: string;
  trim: string;
  windows: string;
  lights: string;
}

export interface OdvVehicleAsset {
  id: string;
  filename: string;
  url: string;
  label: string;
  rawWidth: number;
  rawHeight: number;
  defaultColors?: EgoVehicleColorsConfig;
}

/**
 * Explicit per-vehicle default color metadata reflecting each vehicle's
 * authentic visible original colors from source PNG assets.
 */
export const ODV_VEHICLE_ORIGINAL_COLORS: Record<string, EgoVehicleColorsConfig> = {
  spyder: {
    body: '#94393a', // Ruby Red
    trim: '#2d3748',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  corvette: {
    body: '#2563eb', // Electric Blue
    trim: '#1e293b',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  coupe: {
    body: '#973d3d', // Crimson Red
    trim: '#2d3748',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  crossover: {
    body: '#a2a4a9', // Silver Metallic
    trim: '#334155',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  'crossover-glass': {
    body: '#a3a5aa', // Silver Metallic with Glass Roof
    trim: '#334155',
    windows: '#38bdf8',
    lights: '#fef08a',
  },
  cybercab: {
    body: '#c5a059', // Champagne Gold Robotaxi
    trim: '#1e293b',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  modely: {
    body: '#8d9094', // Stealth Grey Metallic
    trim: '#1e293b',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  roadster: {
    body: '#e2e8f0', // Pearl White
    trim: '#334155',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  sedan: {
    body: '#2e5076', // Deep Royal Blue
    trim: '#1e293b',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  semi: {
    body: '#f1f5f9', // Clean White
    trim: '#334155',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  sportswagon: {
    body: '#3b5846', // Deep Forest Green
    trim: '#1e293b',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  suv: {
    body: '#3a5846', // Olive Forest Green
    trim: '#1e293b',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  'suv-blue': {
    body: '#2c4f76', // Royal Blue
    trim: '#1e293b',
    windows: '#1e293b',
    lights: '#fef08a',
  },
  truck: {
    body: '#616162', // Dark Graphite
    trim: '#1e293b',
    windows: '#1e293b',
    lights: '#fef08a',
  },
};

/**
 * Resolves the original, authentic color configuration for any vehicle model.
 * Defaults gracefully to the Spyder (Auto) red configuration.
 */
export function getVehicleOriginalColors(typeOrId?: string | null): EgoVehicleColorsConfig {
  if (!typeOrId || typeOrId === 'auto') {
    return ODV_VEHICLE_ORIGINAL_COLORS.spyder;
  }
  const clean = typeOrId
    .split('/')
    .pop()!
    .replace(/\.png$/i, '')
    .replace(/^odv-/i, '')
    .toLowerCase();

  if (ODV_VEHICLE_ORIGINAL_COLORS[clean]) {
    return ODV_VEHICLE_ORIGINAL_COLORS[clean];
  }
  if (clean === 'compactsedan' || clean === 'midsizesedan') {
    return {
      body: '#1f2937',
      trim: '#2d3748',
      windows: '#0d131a',
      lights: '#fef08a',
    };
  }
  if (clean === 'luxurysedan') {
    return {
      body: '#000008',
      trim: '#64748b',
      windows: '#020617',
      lights: '#fef08a',
    };
  }
  if (clean === 'truck') {
    return ODV_VEHICLE_ORIGINAL_COLORS.truck;
  }
  if (clean === 'coupe') {
    return ODV_VEHICLE_ORIGINAL_COLORS.coupe;
  }
  return ODV_VEHICLE_ORIGINAL_COLORS.spyder;
}

const SPECIAL_DISPLAY_LABELS: Record<string, string> = {
  spyder: 'Auto',
  suv: 'SUV',
  'suv-blue': 'SUV Blue',
  modely: 'Model Y',
  cybercab: 'Cybercab',
  sportswagon: 'Sportswagon',
  'crossover-glass': 'Crossover Glass',
  crossover: 'Crossover',
  corvette: 'Corvette',
  coupe: 'Coupe',
  roadster: 'Roadster',
  sedan: 'Sedan',
  'compact-sedan': 'Compact Sedan',
  'compactsedan': 'Compact Sedan',
  'midsizesedan': 'Mid-size Sedan',
  'luxurysedan': 'Luxury Sedan',
  semi: 'Semi',
  truck: 'Truck',
};

/** Known ODV vehicle assets in public/vehicles/ */
export const KNOWN_ODV_VEHICLES: OdvVehicleAsset[] = [
  { id: 'spyder', filename: 'odv-spyder.png', url: '/vehicles/odv-spyder.png', label: 'Auto', rawWidth: 340, rawHeight: 667, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.spyder },
  { id: 'corvette', filename: 'odv-corvette.png', url: '/vehicles/odv-corvette.png', label: 'Corvette', rawWidth: 349, rawHeight: 672, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.corvette },
  { id: 'coupe', filename: 'odv-coupe.png', url: '/vehicles/odv-coupe.png', label: 'Coupe', rawWidth: 339, rawHeight: 667, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.coupe },
  { id: 'crossover', filename: 'odv-crossover.png', url: '/vehicles/odv-crossover.png', label: 'Crossover', rawWidth: 341, rawHeight: 671, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.crossover },
  { id: 'crossover-glass', filename: 'odv-crossover-glass.png', url: '/vehicles/odv-crossover-glass.png', label: 'Crossover Glass', rawWidth: 343, rawHeight: 669, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS['crossover-glass'] },
  { id: 'cybercab', filename: 'odv-cybercab.png', url: '/vehicles/odv-cybercab.png', label: 'Cybercab', rawWidth: 319, rawHeight: 664, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.cybercab },
  { id: 'modely', filename: 'odv-modely.png', url: '/vehicles/odv-modely.png', label: 'Model Y', rawWidth: 339, rawHeight: 671, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.modely },
  { id: 'roadster', filename: 'odv-roadster.png', url: '/vehicles/odv-roadster.png', label: 'Roadster', rawWidth: 340, rawHeight: 667, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.roadster },
  { id: 'sedan', filename: 'odv-sedan.png', url: '/vehicles/odv-sedan.png', label: 'Sedan', rawWidth: 344, rawHeight: 669, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.sedan },
  { id: 'semi', filename: 'odv-semi.png', url: '/vehicles/odv-semi.png', label: 'Semi', rawWidth: 366, rawHeight: 672, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.semi },
  { id: 'sportswagon', filename: 'odv-sportswagon.png', url: '/vehicles/odv-sportswagon.png', label: 'Sportswagon', rawWidth: 342, rawHeight: 673, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.sportswagon },
  { id: 'suv', filename: 'odv-suv.png', url: '/vehicles/odv-suv.png', label: 'SUV', rawWidth: 343, rawHeight: 669, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.suv },
  { id: 'suv-blue', filename: 'odv-suv-blue.png', url: '/vehicles/odv-suv-blue.png', label: 'SUV Blue', rawWidth: 345, rawHeight: 668, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS['suv-blue'] },
  { id: 'truck', filename: 'odv-truck.png', url: '/vehicles/odv-truck.png', label: 'Truck', rawWidth: 336, rawHeight: 674, defaultColors: ODV_VEHICLE_ORIGINAL_COLORS.truck },
];

/**
 * Derives a human-readable display label from an ODV vehicle ID or filename.
 */
export function getOdvVehicleLabel(idOrFilename: string): string {
  const cleanId = idOrFilename
    .split('/')
    .pop()!
    .replace(/\.png$/i, '')
    .replace(/^odv-/i, '')
    .toLowerCase();

  if (SPECIAL_DISPLAY_LABELS[cleanId]) {
    return SPECIAL_DISPLAY_LABELS[cleanId];
  }

  return cleanId
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Discovers available ODV vehicle images matching `odv-[car-type].png` in public/vehicles/
 * Uses Vite's build-time glob when available, merged with the known asset registry.
 */
export function getAvailableOdvVehicles(): OdvVehicleAsset[] {
  const map = new Map<string, OdvVehicleAsset>();

  // Seed with known assets
  for (const item of KNOWN_ODV_VEHICLES) {
    map.set(item.id, item);
  }

  // Attempt dynamic glob in Vite environment
  try {
    const importMetaAny = import.meta as any;
    const globFn = importMetaAny?.glob || importMetaAny?.env?.glob;
    if (typeof globFn === 'function') {
      const modules = globFn('/public/vehicles/odv-*.png', { eager: true, query: '?url' }) as Record<string, any>;
      for (const pathKey of Object.keys(modules)) {
        const filename = pathKey.split('/').pop() || '';
        if (!filename) continue;
        const id = filename.replace(/\.png$/i, '').replace(/^odv-/i, '');
        if (!map.has(id)) {
          map.set(id, {
            id,
            filename,
            url: `/vehicles/${filename}`,
            label: getOdvVehicleLabel(id),
            rawWidth: 340,
            rawHeight: 670,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to dynamically glob ODV vehicle images', err);
  }

  const list = Array.from(map.values());

  // Ensure 'spyder' (Auto) is always the first default item
  const spyderIndex = list.findIndex((v) => v.id === 'spyder');
  if (spyderIndex > 0) {
    const [spyder] = list.splice(spyderIndex, 1);
    list.unshift(spyder);
  }

  return list;
}

/**
 * Resolves an ODV vehicle asset based on an ID, filename, or legacy vehicle type.
 * Always defaults to odv-spyder.png (Auto) when undefined or unrecognized.
 */
export function resolveOdvVehicle(typeOrId?: string | null): OdvVehicleAsset {
  const vehicles = getAvailableOdvVehicles();
  const defaultVehicle = vehicles[0] || KNOWN_ODV_VEHICLES[0];

  if (!typeOrId || typeOrId === 'auto') {
    return defaultVehicle;
  }

  const clean = typeOrId
    .split('/')
    .pop()!
    .replace(/\.png$/i, '')
    .replace(/^odv-/i, '')
    .toLowerCase();

  // Exact ID match
  const match = vehicles.find((v) => v.id.toLowerCase() === clean);
  if (match) return match;

  // Legacy silhouette compatibility mappings
  if (clean === 'compactsedan' || clean === 'midsizesedan' || clean === 'luxurysedan') {
    return vehicles.find((v) => v.id === 'sedan') || defaultVehicle;
  }
  if (clean === 'truck') {
    return vehicles.find((v) => v.id === 'truck') || defaultVehicle;
  }
  if (clean === 'coupe') {
    return vehicles.find((v) => v.id === 'coupe') || defaultVehicle;
  }

  return defaultVehicle;
}

export {
  getVehicleHeadlightContour,
  ODV_HEADLIGHT_PRESETS,
  type HeadlightGeometry,
  type VehicleHeadlightContour,
} from './vehicleHeadlightContours';
