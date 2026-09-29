import { Binding, BindingConditionRule, BindingGroup, ComponentInstance, VehicleState } from '../types';
import { useMockpitStore } from '../store/useMockpitStore';

/**
 * Evaluates a single binding condition rule against the current vehicle state.
 * Returns true if the condition is satisfied.
 */
export function evaluateConditionRule(
  rule: BindingConditionRule,
  state: VehicleState,
  events?: Record<string, boolean>
): boolean {
  const activeEvents =
    events !== undefined
      ? events
      : typeof useMockpitStore !== 'undefined' && typeof useMockpitStore.getState === 'function'
      ? useMockpitStore.getState().interactionEvents
      : undefined;

  let rawValue: any = undefined;
  const rawFieldName = String(rule.stateField || '').trim();
  const normalizedField = rawFieldName.toLowerCase().replace(/[\s_-]/g, '');

  if (normalizedField === 'speedincreaseattempted') {
    if (activeEvents && ('speedIncreaseAttempted' in activeEvents || normalizedField in activeEvents)) {
      rawValue = Boolean(activeEvents['speedIncreaseAttempted'] ?? activeEvents[normalizedField]);
    } else if (state && ('speedIncreaseAttempted' in state || (state as any)[normalizedField] !== undefined)) {
      rawValue = Boolean((state as any)['speedIncreaseAttempted'] ?? (state as any)[normalizedField]);
    } else {
      rawValue = false;
    }
  } else if (activeEvents && rawFieldName in activeEvents) {
    rawValue = activeEvents[rawFieldName];
  } else {
    // Match against vehicle state case-insensitively
    const matchedStateKey = Object.keys(state).find(
      (k) => k.toLowerCase() === rawFieldName.toLowerCase() || k.toLowerCase().replace(/[\s_-]/g, '') === normalizedField
    );
    if (matchedStateKey && (state as any)[matchedStateKey] !== undefined) {
      rawValue = (state as any)[matchedStateKey];
    }
  }

  if (rawValue === undefined) return false;

  const targetValue = rule.value;

  switch (rule.condition) {
    case '<': {
      return Number(rawValue) < Number(targetValue);
    }
    case '>': {
      return Number(rawValue) > Number(targetValue);
    }
    case '>=': {
      return Number(rawValue) >= Number(targetValue);
    }
    case '<=': {
      return Number(rawValue) <= Number(targetValue);
    }
    case '=': {
      if (typeof rawValue === 'boolean') {
        const boolTarget = targetValue === true || targetValue === 'true' || targetValue === 1 || targetValue === '1';
        return rawValue === boolTarget;
      }
      return String(rawValue).toLowerCase() === String(targetValue).toLowerCase();
    }
    case '!=': {
      if (typeof rawValue === 'boolean') {
        const boolTarget = targetValue === true || targetValue === 'true' || targetValue === 1 || targetValue === '1';
        return rawValue !== boolTarget;
      }
      return String(rawValue).toLowerCase() !== String(targetValue).toLowerCase();
    }
    default:
      return false;
  }
}

/**
 * Evaluates a binding group containing multiple conditions against the current vehicle state and active interaction events.
 * All conditions are evaluated together using AND logic.
 * Returns true if all conditions are satisfied.
 */
export function evaluateBindingGroup(
  group: BindingGroup,
  state: VehicleState,
  events?: Record<string, boolean>
): boolean {
  if (!group.conditions || group.conditions.length === 0) return false;
  const activeEvents =
    events !== undefined
      ? events
      : typeof useMockpitStore !== 'undefined' && typeof useMockpitStore.getState === 'function'
      ? useMockpitStore.getState().interactionEvents
      : undefined;
  return group.conditions.every((rule) => evaluateConditionRule(rule, state, activeEvents));
}

/**
 * Evaluates a binding rule (single condition or multi-condition binding group) against vehicle state and active interaction events.
 * Returns true if the condition(s) are satisfied.
 */
export function evaluateBinding(
  binding: Binding | BindingGroup,
  state: VehicleState,
  events?: Record<string, boolean>
): boolean {
  const activeEvents =
    events !== undefined
      ? events
      : typeof useMockpitStore !== 'undefined' && typeof useMockpitStore.getState === 'function'
      ? useMockpitStore.getState().interactionEvents
      : undefined;

  if ('conditions' in binding && Array.isArray(binding.conditions)) {
    if (binding.conditions.length === 0) return false;
    return binding.conditions.every((rule) => evaluateConditionRule(rule, state, activeEvents));
  }

  const singleBinding = binding as Binding;
  if (singleBinding.stateField !== undefined && singleBinding.condition !== undefined) {
    return evaluateConditionRule(
      {
        stateField: singleBinding.stateField,
        condition: singleBinding.condition,
        value: singleBinding.value ?? '',
      },
      state,
      activeEvents
    );
  }

  return false;
}

/**
 * Resolves template placeholders like {speed}, {gear}, {batteryPercent} inside target values
 */
export function formatTargetValue(template: string, state: VehicleState): string {
  if (!template) return '';
  const replaced = template.replace(/\{(\w+)\}/g, (match, fieldName) => {
    if (fieldName in state) {
      const val = state[fieldName as keyof VehicleState];
      if (typeof val === 'number') {
        return String(Math.round(val));
      }
      return String(val);
    }
    return match;
  });
  return replaced.replace(/(\d+\.\d+)%/g, (_, num) => `${Math.round(parseFloat(num))}%`);
}

/**
 * Calculates the final computed appearance properties for a component instance
 * by applying all matching binding rules on top of its staticProps.
 */
export function getResolvedProps(
  component: ComponentInstance,
  state: VehicleState,
  events?: Record<string, boolean>
): Record<string, string> {
  const activeEvents =
    events !== undefined
      ? events
      : typeof useMockpitStore !== 'undefined' && typeof useMockpitStore.getState === 'function'
      ? useMockpitStore.getState().interactionEvents
      : undefined;

  const resolved: Record<string, string> = { ...component.staticProps };

  if (!component.bindings || component.bindings.length === 0) {
    return resolved;
  }

  for (const binding of component.bindings) {
    if (evaluateBinding(binding, state, activeEvents)) {
      const formattedValue = formatTargetValue(binding.targetValue, state);
      resolved[binding.targetProp] = formattedValue;
    }
  }

  return resolved;
}
