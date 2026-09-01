import { InteractionLogEntry } from './types';

let inMemoryRuntimeLog: InteractionLogEntry[] = [];

/**
 * Records an interaction event with performance timings into the single-session in-memory runtime log.
 */
export function recordRuntimeInteraction(entry: Omit<InteractionLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): InteractionLogEntry {
  const fullEntry: InteractionLogEntry = {
    id: entry.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: entry.timestamp || Date.now(),
    eventType: entry.eventType,
    targetId: entry.targetId,
    targetType: entry.targetType,
    screenId: entry.screenId,
    latencyMs: Math.max(0, Math.round(entry.latencyMs)),
    responseTimeMs: Math.max(0, Math.round(entry.responseTimeMs)),
    transitionDurationMs: entry.transitionDurationMs ? Math.max(0, Math.round(entry.transitionDurationMs)) : undefined,
    details: entry.details,
  };

  inMemoryRuntimeLog.push(fullEntry);

  // Keep last 200 interaction events
  if (inMemoryRuntimeLog.length > 200) {
    inMemoryRuntimeLog.shift();
  }

  // Dispatch event for UI reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mockpit-runtime-log-updated', { detail: fullEntry }));
  }

  return fullEntry;
}

/**
 * Returns the current session's in-memory interaction log.
 */
export function getRuntimeLog(): InteractionLogEntry[] {
  return [...inMemoryRuntimeLog];
}

/**
 * Clears the current session runtime log.
 */
export function clearRuntimeLog(): void {
  inMemoryRuntimeLog = [];
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mockpit-runtime-log-cleared'));
  }
}

/**
 * Wraps an asynchronous or synchronous action to measure input latency and total response duration.
 */
export async function measureInteraction<T>(
  actionName: string,
  targetId: string | undefined,
  targetType: string | undefined,
  screenId: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const startTime = performance.now();
  let latencyMs = 16; // default first frame visual latency

  try {
    const result = await fn();
    const endTime = performance.now();
    const responseTimeMs = endTime - startTime;

    recordRuntimeInteraction({
      eventType: 'tap',
      targetId,
      targetType: targetType || actionName,
      screenId,
      latencyMs,
      responseTimeMs,
      details: `Action: ${actionName}`,
    });

    return result;
  } catch (err) {
    const endTime = performance.now();
    recordRuntimeInteraction({
      eventType: 'tap',
      targetId,
      targetType: targetType || actionName,
      screenId,
      latencyMs,
      responseTimeMs: endTime - startTime,
      details: `Action ${actionName} failed: ${String(err)}`,
    });
    throw err;
  }
}
