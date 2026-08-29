import { useState, useEffect, useRef, useCallback } from 'react';
import { useWeatherStore } from '../store/useWeatherStore';
import { WeatherAlert, WeatherAlertsState } from '../types/weatherAlerts';
import { fetchWeatherAlerts } from '../services/weatherAlertService';

export function useWeatherAlerts() {
  const resolvedLocation = useWeatherStore((s) => s.resolvedLocation);
  const unit = useWeatherStore((s) => s.unit);
  const radarRefreshInterval = useWeatherStore((s) => s.radarRefreshInterval);

  const lat = resolvedLocation?.lat ?? 37.56299;
  const lon = resolvedLocation?.lon ?? -122.32553;
  const locationName = resolvedLocation?.name ?? 'San Mateo, CA';

  const [state, setState] = useState<WeatherAlertsState>({
    alerts: [],
    status: 'idle',
    lastUpdated: null,
    locationName,
    coordinates: { lat, lon },
  });

  const activeRequestSeq = useRef<number>(0);
  const isMounted = useRef<boolean>(true);

  const loadAlerts = useCallback(
    async (force = false) => {
      const thisSeq = ++activeRequestSeq.current;

      setState((prev) => ({
        ...prev,
        status: prev.lastUpdated ? prev.status : 'loading',
        locationName,
        coordinates: { lat, lon },
      }));

      try {
        const result = await fetchWeatherAlerts({
          lat,
          lon,
          unit,
          forceRefresh: force,
        });

        // Guard against stale responses from rapid location or unit changes
        if (!isMounted.current || thisSeq !== activeRequestSeq.current) {
          return;
        }

        setState({
          alerts: result.alerts,
          status: 'success',
          lastUpdated: Date.now(),
          locationName,
          coordinates: { lat, lon },
          timezone: result.rawResponse.timezone,
        });
      } catch (err: any) {
        if (!isMounted.current || thisSeq !== activeRequestSeq.current) {
          return;
        }

        console.warn('[useWeatherAlerts] Fetch failed:', err);
        setState((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: err?.message || 'Unable to retrieve current weather alerts',
        }));
      }
    },
    [lat, lon, unit, locationName]
  );

  useEffect(() => {
    isMounted.current = true;
    loadAlerts(false);

    const intervalMs = Math.max(1, radarRefreshInterval) * 60 * 1000;
    const interval = setInterval(() => {
      loadAlerts(true);
    }, intervalMs);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [loadAlerts, radarRefreshInterval]);

  return {
    alerts: state.alerts,
    status: state.status,
    lastUpdated: state.lastUpdated,
    errorMessage: state.errorMessage,
    locationName: state.locationName,
    timezone: state.timezone,
    refetch: () => loadAlerts(true),
  };
}
