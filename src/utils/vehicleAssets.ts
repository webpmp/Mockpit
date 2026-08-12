import { EgoVehicleType } from '../types';

export interface VehicleAsset {
  id: string;
  name: string;
  url: string;
}

export const VEHICLE_NAME_MAP: Record<string, string> = {
  'vehicle-01': 'CPE-GT01',
  'vehicle-02': 'SED-LRG01',
  'vehicle-03': 'SED-LEG02',
  'vehicle-04': 'SED-LUX01',
  'vehicle-05': 'CPE-GT02',
  'vehicle-06': 'SED-MED01',
  'vehicle-07': 'SED-MED02',
  'vehicle-08': 'SED-COM01',
  'vehicle-09': 'SED-LUX02',
  'vehicle-10': 'SED-SPORT01',
  'vehicle-11': 'SED-COM02',
  'vehicle-12': 'SED-SPORT02',
  'vehicle-13': 'TRK-FULL01',
  'vehicle-14': 'TRK-HD01',
  'vehicle-15': 'TRK-HD02',
  'vehicle-16': 'TRK-MID01',
};

/**
 * Maps a vehicle asset ID/URL (e.g. vehicle-01 or CPE-GT01) to an Ego vehicle silhouette shape bucket
 */
export function getEgoVehicleTypeFromAsset(vehiclePathOrUrl?: string | null): EgoVehicleType {
  if (!vehiclePathOrUrl) return 'midsizeSedan';
  const match = vehiclePathOrUrl.match(/vehicle-\d+/i);
  const id = match ? match[0].toLowerCase() : '';
  const name = VEHICLE_NAME_MAP[id] || '';

  if (name.startsWith('CPE-') || vehiclePathOrUrl.toLowerCase().includes('coupe') || vehiclePathOrUrl.toLowerCase().includes('cpe')) {
    return 'coupe';
  }
  if (name.startsWith('TRK-') || vehiclePathOrUrl.toLowerCase().includes('truck') || vehiclePathOrUrl.toLowerCase().includes('trk')) {
    return 'truck';
  }
  if (name.startsWith('SED-COM')) {
    return 'compactSedan';
  }
  if (name.startsWith('SED-LUX')) {
    return 'luxurySedan';
  }
  return 'midsizeSedan';
}

/**
 * Automatically discovers vehicle images in /public/vehicles/ using Vite's import.meta.glob
 * Falls back to standard list if glob is empty.
 */
export function getAvailableVehicles(): VehicleAsset[] {
  const assetsMap = new Map<string, VehicleAsset>();

  try {
    // Eagerly match all processed png assets in /public/vehicles/processed/
    const importMetaAny = import.meta as any;
    const globFn = importMetaAny.glob || importMetaAny.env?.glob;
    const globModules = typeof globFn === 'function' ? globFn('/public/vehicles/processed/*.png', { eager: true, query: '?url' }) as Record<string, any> : {};

    Object.keys(globModules).forEach((pathKey) => {
      const filename = pathKey.split('/').pop() || '';
      if (!filename) return;

      const id = filename.replace(/\.[^/.]+$/, '');
      const name = VEHICLE_NAME_MAP[id] || id
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      // Vite serves files from /public at root URL
      const url = `/vehicles/processed/${filename}`;

      assetsMap.set(id, { id, name, url });
    });
  } catch (err) {
    console.warn('Failed to dynamically glob vehicle images, using fallback list', err);
  }

  // Fallback if no images found via glob
  if (assetsMap.size === 0) {
    for (let i = 1; i <= 16; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      const id = `vehicle-${numStr}`;
      assetsMap.set(id, {
        id,
        name: VEHICLE_NAME_MAP[id] || `Vehicle ${numStr}`,
        url: `/vehicles/processed/vehicle-${numStr}.png`,
      });
    }
  }

  const result = Array.from(assetsMap.values());

  // Sort numerically by vehicle ID (e.g., vehicle-01, vehicle-02... vehicle-16)
  result.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

  return result;
}
