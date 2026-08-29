export type DaylightPhase = 'DAYLIGHT' | 'BEFORE SUNRISE' | 'AFTER SUNSET';

export interface SunTimeData {
  sunrise: string; // ISO string
  sunset: string; // ISO string
  sunriseFormatted: string; // e.g. "6:21 AM"
  sunsetFormatted: string; // e.g. "8:03 PM"
  daylightDurationFormatted: string; // e.g. "13H 42M"
  daylightSeconds: number;
  phase: DaylightPhase;
  phaseLabel: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  lastFetchedAt: number | null;
  errorMessage?: string;
}
