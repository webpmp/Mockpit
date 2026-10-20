export interface OdvVehicleAsset {
  id: string;
  filename: string;
  url: string;
  label: string;
  rawWidth: number;
  rawHeight: number;
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
  { id: 'spyder', filename: 'odv-spyder.png', url: '/vehicles/odv-spyder.png', label: 'Auto', rawWidth: 340, rawHeight: 667 },
  { id: 'corvette', filename: 'odv-corvette.png', url: '/vehicles/odv-corvette.png', label: 'Corvette', rawWidth: 349, rawHeight: 672 },
  { id: 'coupe', filename: 'odv-coupe.png', url: '/vehicles/odv-coupe.png', label: 'Coupe', rawWidth: 339, rawHeight: 667 },
  { id: 'crossover', filename: 'odv-crossover.png', url: '/vehicles/odv-crossover.png', label: 'Crossover', rawWidth: 341, rawHeight: 671 },
  { id: 'crossover-glass', filename: 'odv-crossover-glass.png', url: '/vehicles/odv-crossover-glass.png', label: 'Crossover Glass', rawWidth: 343, rawHeight: 669 },
  { id: 'cybercab', filename: 'odv-cybercab.png', url: '/vehicles/odv-cybercab.png', label: 'Cybercab', rawWidth: 319, rawHeight: 664 },
  { id: 'modely', filename: 'odv-modely.png', url: '/vehicles/odv-modely.png', label: 'Model Y', rawWidth: 339, rawHeight: 671 },
  { id: 'roadster', filename: 'odv-roadster.png', url: '/vehicles/odv-roadster.png', label: 'Roadster', rawWidth: 340, rawHeight: 667 },
  { id: 'sedan', filename: 'odv-sedan.png', url: '/vehicles/odv-sedan.png', label: 'Sedan', rawWidth: 344, rawHeight: 669 },
  { id: 'semi', filename: 'odv-semi.png', url: '/vehicles/odv-semi.png', label: 'Semi', rawWidth: 366, rawHeight: 672 },
  { id: 'sportswagon', filename: 'odv-sportswagon.png', url: '/vehicles/odv-sportswagon.png', label: 'Sportswagon', rawWidth: 342, rawHeight: 673 },
  { id: 'suv', filename: 'odv-suv.png', url: '/vehicles/odv-suv.png', label: 'SUV', rawWidth: 343, rawHeight: 669 },
  { id: 'suv-blue', filename: 'odv-suv-blue.png', url: '/vehicles/odv-suv-blue.png', label: 'SUV Blue', rawWidth: 345, rawHeight: 668 },
  { id: 'truck', filename: 'odv-truck.png', url: '/vehicles/odv-truck.png', label: 'Truck', rawWidth: 336, rawHeight: 674 },
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
