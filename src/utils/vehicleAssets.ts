export interface VehicleAsset {
  id: string;
  name: string;
  url: string;
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
      const name = id
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
        name: `Vehicle ${numStr}`,
        url: `/vehicles/processed/vehicle-${numStr}.png`,
      });
    }
  }

  const result = Array.from(assetsMap.values());

  // Sort numerically by vehicle ID (e.g., vehicle-01, vehicle-02... vehicle-16)
  result.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

  return result;
}
