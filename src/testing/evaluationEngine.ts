import { TaskCriteria, SingleCriteria, CriteriaOperator } from './types';
import { VehicleState, ClimateState, ActiveTrip } from '../types';

export interface EvaluationState {
  vehicleState: VehicleState;
  climateState: ClimateState;
  activeView: string;
  activeTrip: ActiveTrip | null;
  selectedMusicService: string;
  recentActionEvents: Record<string, any>; // Action key -> event details
}

export function compareValues(actual: any, expected: any, operator: CriteriaOperator = '='): boolean {
  if (actual === undefined || actual === null) {
    return expected === undefined || expected === null;
  }

  // String case-insensitive normalization if both are strings
  if (typeof actual === 'string' && typeof expected === 'string') {
    const actStr = actual.trim().toLowerCase();
    const expStr = expected.trim().toLowerCase();
    switch (operator) {
      case '=':
        return actStr === expStr;
      case '!=':
        return actStr !== expStr;
      case 'includes':
        return actStr.includes(expStr);
      default:
        return actStr === expStr;
    }
  }

  // Number comparison
  const numActual = typeof actual === 'number' ? actual : parseFloat(String(actual));
  const numExpected = typeof expected === 'number' ? expected : parseFloat(String(expected));

  if (!isNaN(numActual) && !isNaN(numExpected)) {
    switch (operator) {
      case '=':
        return numActual === numExpected;
      case '!=':
        return numActual !== numExpected;
      case '>':
        return numActual > numExpected;
      case '>=':
        return numActual >= numExpected;
      case '<':
        return numActual < numExpected;
      case '<=':
        return numActual <= numExpected;
      default:
        return numActual === numExpected;
    }
  }

  // Boolean or general equality
  switch (operator) {
    case '=':
      return actual === expected;
    case '!=':
      return actual !== expected;
    case 'includes':
      return String(actual).includes(String(expected));
    default:
      return actual === expected;
  }
}

export function evaluateSingleCriteria(crit: SingleCriteria, state: EvaluationState): boolean {
  switch (crit.type) {
    case 'state_field': {
      if (!crit.field) return false;
      const actualVal = (state.vehicleState as any)?.[crit.field];
      return compareValues(actualVal, crit.expectedValue, crit.operator);
    }

    case 'climate_field': {
      if (!crit.field) return false;
      const actualVal = (state.climateState as any)?.[crit.field];
      return compareValues(actualVal, crit.expectedValue, crit.operator);
    }

    case 'screen_navigate': {
      return compareValues(state.activeView, crit.expectedValue, crit.operator || '=');
    }

    case 'trip_guidance': {
      const isTripActive = Boolean(state.activeTrip && state.activeTrip.destinationName);
      return compareValues(isTripActive, Boolean(crit.expectedValue), crit.operator || '=');
    }

    case 'media_service': {
      return compareValues(state.selectedMusicService, crit.expectedValue, crit.operator || '=');
    }

    case 'action_event': {
      if (!crit.field) return false;
      const eventRecord = state.recentActionEvents[crit.field];
      if (!eventRecord) return false;

      // If expecting boolean true / completion
      if (crit.expectedValue === true || crit.expectedValue === undefined) {
        return Boolean(eventRecord);
      }

      // Check specific value in event detail
      const valueToCheck = eventRecord.value !== undefined ? eventRecord.value : eventRecord;
      return compareValues(valueToCheck, crit.expectedValue, crit.operator || '=');
    }

    default:
      return false;
  }
}

export function evaluateTaskCriteria(criteria: TaskCriteria, state: EvaluationState): boolean {
  if (!criteria) return false;

  if (criteria.type === 'composite') {
    if (!criteria.subCriteria || criteria.subCriteria.length === 0) return true;
    return criteria.subCriteria.every((sub) => evaluateSingleCriteria(sub, state));
  }

  return evaluateSingleCriteria(criteria as SingleCriteria, state);
}
