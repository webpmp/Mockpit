import React, { useEffect, useRef, useCallback, RefObject } from 'react';

export interface UseAutoDismissOptions {
  /** Whether the overlay/dropdown/popover is currently open */
  isOpen: boolean;
  /** Callback fired when the overlay should be dismissed without committing unconfirmed changes */
  onDismiss: () => void;
  /** Inactivity timeout in milliseconds. Defaults to 12000 ms (12 seconds) */
  timeoutMs?: number;
  /** Optional container ref to detect clicks/touches outside */
  containerRef?: RefObject<HTMLElement | null>;
  /** Whether to dismiss on Escape key press (default: true) */
  dismissOnEscape?: boolean;
  /** Whether to dismiss on click/touch outside container (default: true) */
  dismissOnClickOutside?: boolean;
  /** Whether user activity (pointermove, keydown, touch, scroll) resets the inactivity timer (default: true) */
  resetOnActivity?: boolean;
}

/**
 * General hook for temporary dropdowns, selectors, popovers, and option overlays.
 * - Auto-dismisses after ~12s (configurable) of inactivity.
 * - Any user interaction with the overlay resets the inactivity timer.
 * - Does NOT commit unconfirmed changes upon timeout or dismissal.
 * - Supports Escape key and outside click/touch dismissal.
 */
export function useAutoDismiss({
  isOpen,
  onDismiss,
  timeoutMs = 12000,
  containerRef,
  dismissOnEscape = true,
  dismissOnClickOutside = true,
  resetOnActivity = true,
}: UseAutoDismissOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isOpen && timeoutMs > 0) {
      timerRef.current = setTimeout(() => {
        onDismissRef.current();
      }, timeoutMs);
    }
  }, [isOpen, timeoutMs]);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start initial timer
    resetTimer();

    // Event handlers for user activity resetting timer
    const handleActivity = () => {
      if (resetOnActivity) {
        resetTimer();
      }
    };

    // Outside click / touch listener
    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      if (
        dismissOnClickOutside &&
        containerRef?.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onDismissRef.current();
      }
    };

    // Escape key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (dismissOnEscape && e.key === 'Escape') {
        onDismissRef.current();
        return;
      }
      handleActivity();
    };

    const containerEl = containerRef?.current;

    // Attach activity listeners to container element if available, and globally for pointer/key events
    const activityEvents = ['pointerdown', 'pointermove', 'mousedown', 'mousemove', 'touchstart', 'touchmove', 'wheel', 'scroll'];
    
    if (containerEl) {
      activityEvents.forEach((evt) => {
        containerEl.addEventListener(evt, handleActivity, { passive: true });
      });
    }

    document.addEventListener('keydown', handleKeyDown);
    if (dismissOnClickOutside) {
      document.addEventListener('mousedown', handleOutsideInteraction);
      document.addEventListener('touchstart', handleOutsideInteraction);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (containerEl) {
        activityEvents.forEach((evt) => {
          containerEl.removeEventListener(evt, handleActivity);
        });
      }
      document.removeEventListener('keydown', handleKeyDown);
      if (dismissOnClickOutside) {
        document.removeEventListener('mousedown', handleOutsideInteraction);
        document.removeEventListener('touchstart', handleOutsideInteraction);
      }
    };
  }, [
    isOpen,
    timeoutMs,
    containerRef,
    dismissOnEscape,
    dismissOnClickOutside,
    resetOnActivity,
    resetTimer,
  ]);

  return { resetTimer };
}
