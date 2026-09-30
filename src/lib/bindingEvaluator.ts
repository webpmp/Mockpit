import {
  Binding,
  BindingCondition,
  BindingConditionRule,
  BindingGroup,
  ComponentInstance,
  ConditionGroup,
  VehicleState,
  isNotificationEnabled,
} from '../types';
import {
  useMockpitStore,
  DEFAULT_NOTIFICATION_DURATION_SEC,
  EVENT_NOTIFICATION_COOLDOWN_MS,
} from '../store/useMockpitStore';

/**
 * Type guard to check if an item in ConditionGroup children is a nested ConditionGroup.
 */
export function isConditionGroup(item: any): item is ConditionGroup {
  return typeof item === 'object' && item !== null && 'logic' in item && 'children' in item;
}

/**
 * Evaluates a ConditionGroup tree recursively (AND / OR).
 * An empty group evaluates to false.
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  state: VehicleState,
  events?: Record<string, boolean>
): boolean {
  if (!group || !group.children || group.children.length === 0) {
    return false; // An empty group is false per Spec v3
  }

  const activeEvents =
    events !== undefined
      ? events
      : typeof useMockpitStore !== 'undefined' && typeof useMockpitStore.getState === 'function'
      ? useMockpitStore.getState().interactionEvents
      : undefined;

  if (group.logic === 'OR') {
    return group.children.some((child) =>
      isConditionGroup(child)
        ? evaluateConditionGroup(child, state, activeEvents)
        : evaluateConditionRule(child, state, activeEvents)
    );
  }

  // Default 'AND': every child must match
  return group.children.every((child) =>
    isConditionGroup(child)
      ? evaluateConditionGroup(child, state, activeEvents)
      : evaluateConditionRule(child, state, activeEvents)
  );
}

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
  } else if (
    activeEvents &&
    (rawFieldName in activeEvents ||
      normalizedField in activeEvents ||
      Object.keys(activeEvents).some((k) => k.toLowerCase().replace(/[\s_-]/g, '') === normalizedField))
  ) {
    const matchedEventKey = Object.keys(activeEvents).find(
      (k) => k === rawFieldName || k.toLowerCase().replace(/[\s_-]/g, '') === normalizedField
    );
    rawValue = matchedEventKey ? activeEvents[matchedEventKey] : false;
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
    case '=':
    case '==': {
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

  if (binding.conditionGroup) {
    return evaluateConditionGroup(binding.conditionGroup, state, activeEvents);
  }

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

/**
 * Maps a state field name to user-friendly label (using words per Spec v3)
 */
export function getFieldDisplayLabel(field: any): string {
  const normalized = String(field || '').toLowerCase().replace(/[\s_-]/g, '');
  switch (normalized) {
    case 'speedincreaseattempted':
      return 'Speed Increase Attempted';
    case 'gear':
      return 'Gear';
    case 'speed':
      return 'Speed';
    case 'batterypercent':
    case 'battery':
      return 'Battery';
    case 'drivemode':
      return 'Drive Mode';
    case 'ischarging':
      return 'Is Charging';
    case 'dooropen':
      return 'Door Open';
    case 'cruisecontrolactive':
      return 'Cruise Control Active';
    case 'tirepressurewarning':
      return 'Tire Pressure Warning';
    default:
      return String(field || '');
  }
}

/**
 * Maps a condition operator to conversational words per Spec v3:
 * '=' -> 'is', '!=' -> 'is not', '>' -> 'is above', '<' -> 'is below',
 * '>=' -> 'is at least', '<=' -> 'is at most'
 */
export function getOperatorWord(cond: BindingCondition | string): string {
  switch (cond) {
    case '=':
      return 'is';
    case '!=':
      return 'is not';
    case '>':
      return 'is above';
    case '<':
      return 'is below';
    case '>=':
      return 'is at least';
    case '<=':
      return 'is at most';
    default:
      return String(cond);
  }
}

/**
 * Formats a single BindingConditionRule into conversational words:
 * e.g. "Speed Increase Attempted is true" or "Battery is below 10"
 */
export function formatRuleText(rule: BindingConditionRule): string {
  const label = getFieldDisplayLabel(rule.stateField);
  const op = getOperatorWord(rule.condition);
  const val = String(rule.value);
  return `${label} ${op} ${val}`;
}

/**
 * Formats a ConditionGroup tree into a plain-language summary with parentheses for child groups:
 * e.g. "(Speed Increase Attempted is true AND Gear is P) OR Battery is below 10"
 */
export function formatConditionGroupText(group: ConditionGroup): string {
  if (!group || !group.children || group.children.length === 0) return '';
  const parts = group.children
    .map((child) => {
      if (isConditionGroup(child)) {
        const inner = formatConditionGroupText(child);
        return inner ? `(${inner})` : '';
      }
      return formatRuleText(child);
    })
    .filter(Boolean);

  const joiner = group.logic === 'OR' ? ' OR ' : ' AND ';
  return parts.join(joiner);
}

/**
 * Formats a binding into a complete "Show when ..." statement.
 */
export function formatConditionSummary(binding: Binding | BindingGroup): string {
  if (binding.conditionGroup) {
    const groupText = formatConditionGroupText(binding.conditionGroup);
    return groupText ? `Show when ${groupText}` : 'Always visible';
  }
  if ('conditions' in binding && Array.isArray(binding.conditions) && binding.conditions.length > 0) {
    const parts = binding.conditions.map(formatRuleText);
    return `Show when ${parts.join(' AND ')}`;
  }
  const single = binding as Binding;
  if (single.stateField !== undefined && single.condition !== undefined) {
    return `Show when ${formatRuleText({
      stateField: single.stateField,
      condition: single.condition,
      value: single.value ?? '',
    })}`;
  }
  return 'Always visible';
}

export const KNOWN_VEHICLE_STATE_FIELDS = new Set([
  'gear',
  'speed',
  'batterypercent',
  'battery',
  'ischarging',
  'dooropen',
  'drivemode',
  'headlights',
  'signalbars',
  'maplat',
  'maplng',
  'originlat',
  'originlng',
  'originlocationname',
  'originunresolved',
  'cruisecontrolactive',
  'cruisesetspeed',
  'blindspotwarning',
  'proximitywarning',
  'tirepressurewarning',
]);

/**
 * Checks if a stateField represents a transient interaction event (e.g. speedIncreaseAttempted or custom/stub event)
 */
export function isInteractionEventField(field: any): boolean {
  if (!field) return false;
  const str = String(field).trim().toLowerCase().replace(/[\s_-]/g, '');
  if (str === 'speedincreaseattempted') return true;
  return !KNOWN_VEHICLE_STATE_FIELDS.has(str);
}

/**
 * Recursively collects all interaction event field names from a ConditionGroup
 */
export function collectInteractionEventsFromConditionGroup(group: ConditionGroup, acc: Set<string>): void {
  if (!group || !group.children) return;
  for (const child of group.children) {
    if (isConditionGroup(child)) {
      collectInteractionEventsFromConditionGroup(child, acc);
    } else if (child && isInteractionEventField(child.stateField)) {
      acc.add(String(child.stateField));
    }
  }
}

/**
 * Collects every interaction-event field referenced by a notification component's rules (including nested groups)
 */
export function collectNotificationInteractionEvents(comp: ComponentInstance): string[] {
  const events = new Set<string>();
  if (!comp.bindings || comp.bindings.length === 0) return [];
  for (const binding of comp.bindings) {
    if (binding.conditionGroup) {
      collectInteractionEventsFromConditionGroup(binding.conditionGroup, events);
    }
    if ('conditions' in binding && Array.isArray(binding.conditions)) {
      for (const c of binding.conditions) {
        if (c && isInteractionEventField(c.stateField)) {
          events.add(String(c.stateField));
        }
      }
    }
    const single = binding as Binding;
    if (single.stateField && isInteractionEventField(single.stateField)) {
      events.add(String(single.stateField));
    }
  }
  return Array.from(events);
}

/**
 * Checks recursively if a ConditionGroup contains any interaction-event condition
 */
export function groupHasInteractionEvent(group: ConditionGroup): boolean {
  if (!group || !group.children) return false;
  return group.children.some((child) =>
    isConditionGroup(child)
      ? groupHasInteractionEvent(child)
      : isInteractionEventField(child.stateField)
  );
}

/**
 * Validates that every group in a ConditionGroup tree is non-empty and has valid children
 */
export function isGroupTreeValid(group: ConditionGroup): boolean {
  if (!group || !group.children || group.children.length === 0) return false;
  return group.children.every((child) => {
    if (isConditionGroup(child)) {
      return isGroupTreeValid(child);
    }
    return Boolean(child && child.stateField && child.condition);
  });
}

/**
 * Checks if a binding contains any interaction-event condition
 */
export function bindingHasInteractionEvent(binding: Binding | BindingGroup): boolean {
  if (binding.conditionGroup) {
    return groupHasInteractionEvent(binding.conditionGroup);
  }
  if ('conditions' in binding && Array.isArray(binding.conditions)) {
    return binding.conditions.some((c) => isInteractionEventField(c.stateField));
  }
  const single = binding as Binding;
  if (single.stateField) {
    return isInteractionEventField(single.stateField);
  }
  return false;
}

/**
 * Checks if a notification component has ANY interaction-event condition across all its rules
 */
export function notificationHasInteractionEvent(comp: ComponentInstance): boolean {
  if (!comp.bindings || comp.bindings.length === 0) return false;
  return comp.bindings.some(bindingHasInteractionEvent);
}

export interface NotificationVisibilityResult {
  visible: boolean;
  isEventDriven: boolean;
  resolvedProps: Record<string, string>;
  shouldStartWindow?: boolean;
  shownUntil?: number;
  cooldownUntil?: number;
}

/**
 * Unified shared evaluator for notification visibility and cooldown gating (Section F)
 * Pure function: no render side effects or store callbacks.
 */
export function evaluateNotificationVisibility(
  component: ComponentInstance,
  vehicleState: VehicleState,
  interactionEvents: Record<string, boolean> = {},
  cooldowns: Record<string, { shownUntil: number; cooldownUntil: number }> = {},
  now: number = Date.now(),
  durationSec: number = DEFAULT_NOTIFICATION_DURATION_SEC,
  _deprecatedCallback?: (id: string, entry: { shownUntil: number; cooldownUntil: number }) => void
): NotificationVisibilityResult {
  if (!isNotificationEnabled(component)) {
    return {
      visible: false,
      isEventDriven: false,
      resolvedProps: {},
      shouldStartWindow: false,
    };
  }

  const isEventDriven = notificationHasInteractionEvent(component);
  const resolved = getResolvedProps(component, vehicleState, interactionEvents);

  if (component.staticProps?.triggerMode === 'event') {
    return {
      visible: true,
      isEventDriven: true,
      resolvedProps: resolved,
      shouldStartWindow: false,
    };
  }

  if (isEventDriven) {
    const cooldown = cooldowns[component.id];

    // 1. Within active shownUntil window: verify state condition is satisfied with referenced events latched to true
    if (cooldown && now < cooldown.shownUntil) {
      const referencedEvents = collectNotificationInteractionEvents(component);
      const simulatedEvents: Record<string, boolean> = { ...interactionEvents };
      if (referencedEvents.length > 0) {
        for (const evt of referencedEvents) {
          simulatedEvents[evt] = true;
          simulatedEvents[evt.toLowerCase().replace(/[\s_-]/g, '')] = true;
        }
      } else {
        simulatedEvents.speedIncreaseAttempted = true;
      }
      const simulatedResolved = getResolvedProps(component, vehicleState, simulatedEvents);
      const isVisible = simulatedResolved.visible !== 'false' && simulatedResolved.visible !== '0';
      return {
        visible: isVisible,
        isEventDriven: true,
        resolvedProps: simulatedResolved,
        shouldStartWindow: false,
      };
    }

    // 2. Quiet cooldown window (shownUntil <= now < cooldownUntil): suppressed
    if (cooldown && now < cooldown.cooldownUntil) {
      return {
        visible: false,
        isEventDriven: true,
        resolvedProps: resolved,
        shouldStartWindow: false,
      };
    }

    // 3. Cooldown expired or not started yet: evaluate current condition
    const isVisible = resolved.visible !== 'false' && resolved.visible !== '0';
    if (isVisible) {
      const shownUntil = now + (durationSec || DEFAULT_NOTIFICATION_DURATION_SEC) * 1000;
      const cooldownUntil = now + EVENT_NOTIFICATION_COOLDOWN_MS;
      return {
        visible: true,
        isEventDriven: true,
        resolvedProps: resolved,
        shouldStartWindow: true,
        shownUntil,
        cooldownUntil,
      };
    }

    return {
      visible: false,
      isEventDriven: true,
      resolvedProps: resolved,
      shouldStartWindow: false,
    };
  }

  // Pure state-driven notification
  const isVisible = resolved.visible !== 'false' && resolved.visible !== '0';
  return {
    visible: isVisible,
    isEventDriven: false,
    resolvedProps: resolved,
    shouldStartWindow: false,
  };
}
