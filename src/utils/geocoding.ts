export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.results?.[0];
    if (!first) return null;
    return {
      lat: first.latitude,
      lng: first.longitude,
      displayName: [first.name, first.admin1, first.country]
        .filter(Boolean)
        .slice(0, 2)
        .join(', '),
    };
  } catch {
    return null;
  }
}
