import React, { useRef, useCallback, useEffect } from 'react';

interface UseHoldRepeatOptions {
  onTrigger: () => void;
  initialDelay?: number; // default 400ms
  repeatInterval?: number; // default 120ms
  minInterval?: number; // default 50ms
  accelerationFactor?: number; // default 0.85
}

/**
 * Custom hook for press-and-hold repeat behavior on buttons.
 * Single tap fires once immediately.
 * Holding down fires repeatedly after `initialDelay` at `repeatInterval`,
 * gradually accelerating down to `minInterval`.
 * Stops automatically on pointer up, leave, or cancel.
 */
export function useHoldRepeat({
  onTrigger,
  initialDelay = 400,
  repeatInterval = 120,
  minInterval = 50,
  accelerationFactor = 0.85,
}: UseHoldRepeatOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(onTrigger);

  useEffect(() => {
    callbackRef.current = onTrigger;
  });

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const start = useCallback(() => {
    stop();
    // Immediate action for single tap / initial press
    callbackRef.current();

    let currentInterval = repeatInterval;

    timeoutRef.current = setTimeout(() => {
      const step = () => {
        callbackRef.current();
        currentInterval = Math.max(minInterval, currentInterval * accelerationFactor);
        intervalRef.current = setTimeout(step, currentInterval);
      };
      step();
    }, initialDelay);
  }, [stop, initialDelay, repeatInterval, minInterval, accelerationFactor]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      start();
    },
    [start]
  );

  return {
    bind: {
      onPointerDown: handlePointerDown,
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
    },
    start,
    stop,
  };
}
