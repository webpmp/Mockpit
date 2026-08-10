import { Binding, ComponentInstance, VehicleState } from '../types';

/**
 * Evaluates a single binding rule against the current vehicle state.
 * Returns true if the condition is satisfied.
 */
export function evaluateBinding(binding: Binding, state: VehicleState): boolean {
  const rawValue = state[binding.stateField];
  if (rawValue === undefined) return false;

  const targetValue = binding.value;

  switch (binding.condition) {
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
  state: VehicleState
): Record<string, string> {
  const resolved: Record<string, string> = { ...component.staticProps };

  if (!component.bindings || component.bindings.length === 0) {
    return resolved;
  }

  for (const binding of component.bindings) {
    if (evaluateBinding(binding, state)) {
      const formattedValue = formatTargetValue(binding.targetValue, state);
      resolved[binding.targetProp] = formattedValue;
    }
  }

  return resolved;
}
