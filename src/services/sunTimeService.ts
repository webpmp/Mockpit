import { DaylightPhase, SunTimeData } from '../types/sunTime';

/**
 * Format hours and minutes from an ISO string (e.g. "2026-08-25T06:34" or "2026-08-25T06:34:00Z")
 * using the provided timezone or pure hour/minute parsing.
 */
export function formatTimeInTz(isoStr?: string, timezone?: string): string {
  if (!isoStr) return '—';

  try {
    // If it's a standard Open-Meteo ISO local string like "2026-08-25T06:34"
    if (isoStr.includes('T')) {
      const timePart = isoStr.split('T')[1];
      const [hStr, mStr] = timePart.split(':');
      let hour = parseInt(hStr, 10);
      const minute = parseInt(mStr, 10);
      if (!isNaN(hour) && !isNaN(minute)) {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        const paddedMin = String(minute).padStart(2, '0');
        return `${hour}:${paddedMin} ${ampm}`;
      }
    }

    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '—';

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || undefined,
    });
  } catch (e) {
    return '—';
  }
}

/**
 * Formats duration in seconds to "13H 42M" or "8H 15M"
 */
export function formatDaylightDuration(seconds?: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return '—';
  }

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours <= 0) {
    return `${mins}M`;
  }
  return `${hours}H ${mins}M`;
}

/**
 * Determines current daylight phase: BEFORE SUNRISE, DAYLIGHT, or AFTER SUNSET
 */
export function determineDaylightPhase(
  sunriseIso?: string,
  sunsetIso?: string,
  currentDate: Date = new Date(),
  timezone?: string
): { phase: DaylightPhase; label: string } {
  if (!sunriseIso || !sunsetIso) {
    return { phase: 'DAYLIGHT', label: 'DAYLIGHT' };
  }

  try {
    // Extract current HH:MM in target timezone
    let currentHour = currentDate.getHours();
    let currentMinute = currentDate.getMinutes();

    if (timezone) {
      try {
        const tzTimeStr = currentDate.toLocaleTimeString('en-US', {
          timeZone: timezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        });
        const [tzH, tzM] = tzTimeStr.split(':').map(Number);
        if (!isNaN(tzH) && !isNaN(tzM)) {
          currentHour = tzH;
          currentMinute = tzM;
        }
      } catch (err) {
        // Fallback to local
      }
    }

    const currentTotalMin = currentHour * 60 + currentMinute;

    const sunriseTime = sunriseIso.includes('T') ? sunriseIso.split('T')[1] : '';
    const sunsetTime = sunsetIso.includes('T') ? sunsetIso.split('T')[1] : '';

    const [srH, srM] = sunriseTime.split(':').map(Number);
    const [ssH, ssM] = sunsetTime.split(':').map(Number);

    const sunriseTotalMin = !isNaN(srH) && !isNaN(srM) ? srH * 60 + srM : 6 * 60;
    const sunsetTotalMin = !isNaN(ssH) && !isNaN(ssM) ? ssH * 60 + ssM : 19 * 60 + 30;

    if (currentTotalMin < sunriseTotalMin) {
      return { phase: 'BEFORE SUNRISE', label: 'BEFORE SUNRISE' };
    }
    if (currentTotalMin >= sunsetTotalMin) {
      return { phase: 'AFTER SUNSET', label: 'AFTER SUNSET' };
    }
    return { phase: 'DAYLIGHT', label: 'DAYLIGHT' };
  } catch (e) {
    return { phase: 'DAYLIGHT', label: 'DAYLIGHT' };
  }
}

/**
 * Pure parsing function to build SunTimeData from Open-Meteo daily response
 */
export function parseSunTimes(
  dailySunrise?: string[],
  dailySunset?: string[],
  dailyDaylightDuration?: number[],
  timezone?: string,
  now: Date = new Date()
): SunTimeData {
  const sunrise = dailySunrise?.[0] || '';
  const sunset = dailySunset?.[0] || '';
  let daylightSec = dailyDaylightDuration?.[0];

  // If daylight duration is not explicitly provided, calculate from sunrise/sunset
  if ((daylightSec === undefined || daylightSec <= 0) && sunrise && sunset) {
    try {
      const srTime = sunrise.includes('T') ? sunrise.split('T')[1] : '';
      const ssTime = sunset.includes('T') ? sunset.split('T')[1] : '';
      const [srH, srM] = srTime.split(':').map(Number);
      const [ssH, ssM] = ssTime.split(':').map(Number);
      if (!isNaN(srH) && !isNaN(srM) && !isNaN(ssH) && !isNaN(ssM)) {
        daylightSec = (ssH * 60 + ssM - (srH * 60 + srM)) * 60;
      }
    } catch (e) {
      // Ignored
    }
  }

  const sunriseFormatted = formatTimeInTz(sunrise, timezone);
  const sunsetFormatted = formatTimeInTz(sunset, timezone);
  const daylightDurationFormatted = formatDaylightDuration(daylightSec);
  const { phase, label: phaseLabel } = determineDaylightPhase(sunrise, sunset, now, timezone);

  const isValid = sunriseFormatted !== '—' && sunsetFormatted !== '—';

  return {
    sunrise,
    sunset,
    sunriseFormatted,
    sunsetFormatted,
    daylightDurationFormatted,
    daylightSeconds: daylightSec || 0,
    phase,
    phaseLabel,
    status: isValid ? 'success' : 'error',
    lastFetchedAt: Date.now(),
    errorMessage: isValid ? undefined : 'No solar ephemeris available',
  };
}
