import { ActiveTrip, TripStop } from '../types';

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius, miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDurationHours(hours: number): string {
  const totalMins = Math.round(hours * 60);
  const durHours = Math.floor(totalMins / 60);
  const durMins = totalMins % 60;
  if (durHours > 0) {
    return `${durHours} hr${durHours > 1 ? 's' : ''}${durMins > 0 ? ` ${durMins} min${durMins > 1 ? 's' : ''}` : ''}`;
  }
  return `${durMins} min${durMins !== 1 ? 's' : ''}` || '0 mins';
}

export interface TripLegEstimate {
  distanceMiles: number;
  durationHours: number;
  formattedDistance: string;
  formattedDuration: string;
  isUnresolved: boolean;
}

export function calculateStopLegs(
  originLat: number,
  originLng: number,
  stops: TripStop[],
  avgSpeedMph = 45,
  roadFactor = 1.3
): TripLegEstimate[] {
  let prevLat = originLat;
  let prevLng = originLng;

  return (stops || []).map((stop) => {
    const lat = Number(stop.lat);
    const lng = Number(stop.lng);

    if (stop.geocoded === false || isNaN(lat) || isNaN(lng)) {
      // Unresolved stop: don't advance the chain, so a later resolved stop's
      // leg still measures from the last known-good point.
      return {
        distanceMiles: 0,
        durationHours: 0,
        formattedDistance: '--',
        formattedDuration: '--',
        isUnresolved: true,
      };
    }

    const legMiles = haversineMiles(prevLat, prevLng, lat, lng) * roadFactor;
    const legHours = avgSpeedMph > 0 ? legMiles / avgSpeedMph : 0;
    prevLat = lat;
    prevLng = lng;

    return {
      distanceMiles: legMiles,
      durationHours: legHours,
      formattedDistance: `${legMiles.toFixed(0)} miles`,
      formattedDuration: formatDurationHours(legHours),
      isUnresolved: false,
    };
  });
}

export function calculateTripEstimate(
  originLat: number,
  originLng: number,
  trip: ActiveTrip,
  consumptionRate: number = 0.32,
  batteryPercent: number = 80,
  avgSpeedMph = 45,
  roadFactor = 1.3,
  packCapacityKwh = 75
) {
  // Check if trip or any stops have unresolved geocoding status
  const isDestUnresolved = trip.destGeocoded === false;
  const unresolvedStop = (trip.stops || []).find((s) => s.geocoded === false);

  if (isDestUnresolved || unresolvedStop) {
    const failedName = isDestUnresolved ? trip.destinationName : unresolvedStop?.name;
    return {
      distanceMiles: 0,
      durationHours: 0,
      energyKwh: 0,
      arrivalPercent: 0,
      formattedDistance: '--',
      formattedDuration: '--',
      formattedEnergy: '--',
      formattedArrivalBattery: '--',
      isUnresolved: true,
      unresolvedMessage: `Can't estimate — could not locate ${failedName || 'address'}`,
    };
  }

  const waypoints = [
    ...(trip.stops || []).map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) })),
    { lat: Number(trip.destLat), lng: Number(trip.destLng) },
  ];

  let totalMiles = 0;
  let prevLat = originLat;
  let prevLng = originLng;

  for (const wp of waypoints) {
    if (!isNaN(wp.lat) && !isNaN(wp.lng) && !isNaN(prevLat) && !isNaN(prevLng)) {
      totalMiles += haversineMiles(prevLat, prevLng, wp.lat, wp.lng) * roadFactor;
      prevLat = wp.lat;
      prevLng = wp.lng;
    }
  }

  const hours = avgSpeedMph > 0 ? totalMiles / avgSpeedMph : 0;
  const safeConsumption = typeof consumptionRate === 'number' && !isNaN(consumptionRate) && consumptionRate > 0 ? consumptionRate : 0.32;
  const energyKwh = totalMiles * safeConsumption;
  const arrivalPercent = Math.max(0, Math.round(batteryPercent - (energyKwh / packCapacityKwh) * 100));

  const durationStr = formatDurationHours(hours);

  return {
    distanceMiles: totalMiles,
    durationHours: hours,
    energyKwh,
    arrivalPercent,
    formattedDistance: `${totalMiles.toFixed(1)} miles`,
    formattedDuration: durationStr || '0 mins',
    formattedEnergy: `${energyKwh.toFixed(1)} kWh (${Math.round((energyKwh / packCapacityKwh) * 100)}%)`,
    formattedArrivalBattery: `${arrivalPercent}% at Arrival`,
  };
}
