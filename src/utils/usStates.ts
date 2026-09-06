import { TripStop } from '../types';

// Full state/territory name (lowercase) -> USPS abbreviation.
// Note: useWeatherStore.ts has a similar map running the opposite direction
// (abbreviation -> full name), scoped locally to that file. Not consolidating
// here to avoid touching weather code as part of this fix — flagging the
// duplication in case you want a single shared source of truth later.
export const US_STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC', 'puerto rico': 'PR',
};

export function abbreviateState(stateName?: string): string | undefined {
  if (!stateName) return undefined;
  return US_STATE_ABBREVIATIONS[stateName.trim().toLowerCase()] || stateName;
}

/**
 * Formats a waypoint name based on whether it shares the same state as the previous waypoint.
 * If same state, drops the state suffix (e.g., "Mariposa").
 * If different state or first item, keeps abbreviated state (e.g., "Mariposa, CA").
 */
export function formatWaypointName(
  cityName: string,
  state: string | undefined,
  previousState?: string
): string {
  if (!state) return cityName;
  if (previousState && state.trim().toLowerCase() === previousState.trim().toLowerCase()) {
    return cityName; // same state as previous waypoint in the chain — omit it
  }
  const abbr = abbreviateState(state) || state;
  return `${cityName}, ${abbr}`;
}

/**
 * Recomputes the display names for the entire waypoint chain:
 * Stop 1 -> Stop 2 -> ... -> Destination
 */
export function recomputeChainNames(
  stops: TripStop[],
  destCityName: string,
  destState?: string
): { updatedStops: TripStop[]; destName: string } {
  let previousState: string | undefined;
  const updatedStops = stops.map((s) => {
    if (!s.state) {
      return s;
    }
    const cityName = s.name.split(',')[0].trim();
    const name = formatWaypointName(cityName, s.state, previousState);
    previousState = s.state;
    return { ...s, name };
  });

  if (!destState) {
    return { updatedStops, destName: destCityName };
  }

  const cleanDestCity = destCityName.split(',')[0].trim();
  const destName = formatWaypointName(cleanDestCity, destState, previousState);
  return { updatedStops, destName };
}

