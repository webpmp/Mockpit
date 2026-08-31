import { DriveModeState } from '../types';

export const DEFAULT_DRIVE_MODES: string[] = ['ECO', 'NORMAL', 'SPORT'];

export function parseDriveModes(modesProp?: any): string[] {
  if (Array.isArray(modesProp) && modesProp.length > 0) {
    return modesProp.map((m) => String(m).trim()).filter(Boolean);
  }
  if (typeof modesProp === 'string' && modesProp.trim()) {
    try {
      const parsed = JSON.parse(modesProp);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((m) => String(m).trim()).filter(Boolean);
      }
    } catch {
      const split = modesProp.split(',').map((s) => s.trim()).filter(Boolean);
      if (split.length > 0) return split;
    }
  }
  return DEFAULT_DRIVE_MODES;
}

export function matchActiveDriveMode(
  currentModeRaw: string | undefined,
  configuredModes: string[]
): string {
  if (!currentModeRaw) return configuredModes[0] || 'NORMAL';
  const found = configuredModes.find(
    (m) => m.toUpperCase() === currentModeRaw.toUpperCase()
  );
  return found || configuredModes[0] || currentModeRaw.toUpperCase();
}
