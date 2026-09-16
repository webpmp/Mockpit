export type WeatherDetailCardKey =
  | 'feelsLike'
  | 'uvIndex'
  | 'dewPoint'
  | 'pressure'
  | 'visibility';

export const DEFAULT_DETAIL_CARD_ORDER: WeatherDetailCardKey[] = [
  'feelsLike',
  'uvIndex',
  'dewPoint',
  'pressure',
  'visibility',
];

export const DETAIL_CARD_LABELS: Record<WeatherDetailCardKey, string> = {
  feelsLike: 'Feels Like',
  uvIndex: 'UV Index',
  dewPoint: 'Dew Point',
  pressure: 'Pressure',
  visibility: 'Visibility',
};

export const DETAIL_CARD_DOM_IDS: Record<WeatherDetailCardKey, string> = {
  feelsLike: 'weather-detail-feels-like',
  uvIndex: 'weather-detail-uv-index',
  dewPoint: 'weather-detail-dew-point',
  pressure: 'weather-detail-pressure',
  visibility: 'weather-detail-visibility',
};

/**
 * Returns the card keys in user-specified order, falling back to default order.
 * Handles missing keys, malformed strings, and unknown keys gracefully.
 */
export function parseDetailCardOrder(rawOrder?: string): WeatherDetailCardKey[] {
  if (!rawOrder || typeof rawOrder !== 'string') {
    return [...DEFAULT_DETAIL_CARD_ORDER];
  }

  const parts = rawOrder.split(',').map((s) => s.trim()).filter(Boolean) as WeatherDetailCardKey[];
  const validParts = parts.filter((k) => DEFAULT_DETAIL_CARD_ORDER.includes(k));
  const seen = new Set<WeatherDetailCardKey>(validParts);

  // Append any missing default cards in their default order
  for (const defaultKey of DEFAULT_DETAIL_CARD_ORDER) {
    if (!seen.has(defaultKey)) {
      validParts.push(defaultKey);
      seen.add(defaultKey);
    }
  }

  return validParts;
}

/**
 * Checks whether a specific card is visible based on store state.
 * Default is true (visible).
 */
export function isDetailCardVisible(
  cardKey: WeatherDetailCardKey,
  visibilityState?: Record<string, boolean>
): boolean {
  if (!visibilityState) return true;
  if (visibilityState[cardKey] !== undefined) {
    return visibilityState[cardKey];
  }
  return true;
}
