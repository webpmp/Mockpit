import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Music,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ComponentInstance, SongTransition } from '../types';
import { ComponentHeader, DEFAULT_COMPONENT_LABELS } from './ComponentRenderer';
import {
  SAMPLE_TRACKS,
  Track,
  renderCoverIcon,
  formatMediaTime,
} from '../data/mediaData';
import { resolveNowPlayingLayout } from '../utils/nowPlayingLayout';

export type DismissDirection = 'up' | 'down' | 'left' | 'right';

interface NowPlayingWidgetProps {
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity?: number;
  isPresentation?: boolean;
}

const getTransitionVariants = (
  transition: SongTransition,
  reducedMotion: boolean
) => {
  if (reducedMotion || transition === 'none') {
    return {
      initial: { opacity: 1, x: 0, scale: 1 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 1, x: 0, scale: 1 },
    };
  }

  switch (transition) {
    case 'fade':
      return {
        initial: { opacity: 0, x: 0, scale: 1 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 0, scale: 1 },
      };
    case 'crossfade':
      return {
        initial: { opacity: 0, x: 0, scale: 1 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 0, scale: 1 },
      };
    case 'slide':
      return {
        initial: (dir: 'next' | 'prev') => ({
          opacity: 0,
          x: dir === 'prev' ? -28 : 28,
          scale: 1,
        }),
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
        },
        exit: (dir: 'next' | 'prev') => ({
          opacity: 0,
          x: dir === 'prev' ? 28 : -28,
          scale: 1,
        }),
      };
    case 'zoom':
      return {
        initial: { opacity: 0, scale: 0.94, x: 0 },
        animate: { opacity: 1, scale: 1, x: 0 },
        exit: { opacity: 0, scale: 0.94, x: 0 },
      };
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
};

const getTransitionConfig = (
  transition: SongTransition,
  reducedMotion: boolean
) => {
  if (reducedMotion || transition === 'none') {
    return { duration: 0 };
  }

  switch (transition) {
    case 'fade':
      return { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] };
    case 'crossfade':
      return { duration: 0.38, ease: [0.4, 0, 0.2, 1] };
    case 'slide':
      return { duration: 0.35, ease: [0.25, 1, 0.5, 1] };
    case 'zoom':
      return { duration: 0.32, ease: [0.25, 1, 0.5, 1] };
    default:
      return { duration: 0.25, ease: 'easeInOut' };
  }
};

const getDismissTransform = (
  direction: DismissDirection = 'down',
  comp: { x?: number; y?: number; width?: number; height?: number } = {}
): string => {
  const x = comp.x ?? 0;
  const y = comp.y ?? 0;
  const w = comp.width ?? 400;
  const h = comp.height ?? 200;

  switch (direction) {
    case 'left': {
      const dist = Math.max(w + 50, x + w + 50);
      return `translate3d(-${dist}px, 0, 0)`;
    }
    case 'right': {
      const dist = Math.max(w + 50, 1280 - x + 50);
      return `translate3d(${dist}px, 0, 0)`;
    }
    case 'up': {
      const dist = Math.max(h + 50, y + h + 50);
      return `translate3d(0, -${dist}px, 0)`;
    }
    case 'down':
    default: {
      const dist = Math.max(h + 50, 800 - y + 50);
      return `translate3d(0, ${dist}px, 0)`;
    }
  }
};

/**
 * PlaybackScrubber component
 * Provides an interactive, accessible horizontal seek bar with continuous dragging,
 * keyboard accessibility, smooth animations, generous hit area, and elapsed/total time display.
 */
interface PlaybackScrubberProps {
  currentTime: number;
  duration: number;
  customColor: string;
  showTimestamps?: boolean;
  onSeek: (newTime: number) => void;
  onUserInteraction?: () => void;
}

const PlaybackScrubber: React.FC<PlaybackScrubberProps> = ({
  currentTime,
  duration,
  customColor,
  showTimestamps = true,
  onSeek,
  onUserInteraction,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragTime, setDragTime] = useState<number>(currentTime);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Safe duration and time calculation
  const safeDuration = isNaN(duration) || duration <= 0 || !isFinite(duration) ? 0 : duration;
  const displayTime = isDragging ? dragTime : currentTime;
  const safeCurrentTime = Math.min(
    Math.max(0, isNaN(displayTime) || !isFinite(displayTime) ? 0 : displayTime),
    safeDuration > 0 ? safeDuration : 0
  );

  const percentage = safeDuration > 0 ? (safeCurrentTime / safeDuration) * 100 : 0;

  const calculateTimeFromEvent = useCallback(
    (clientX: number): number => {
      if (!trackRef.current || safeDuration <= 0) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return 0;
      const offsetX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, offsetX / rect.width));
      return Math.round(ratio * safeDuration);
    },
    [safeDuration]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (safeDuration <= 0) return;

    onUserInteraction?.();
    const newTime = calculateTimeFromEvent(e.clientX);
    setIsDragging(true);
    setDragTime(newTime);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is not supported
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    onUserInteraction?.();
    const newTime = calculateTimeFromEvent(e.clientX);
    setDragTime(newTime);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    onUserInteraction?.();
    const finalTime = calculateTimeFromEvent(e.clientX);
    setIsDragging(false);
    onSeek(finalTime);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    onSeek(dragTime);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (safeDuration <= 0) return;
    let handled = false;
    let target = currentTime;
    const stepSmall = Math.max(1, Math.min(5, Math.round(safeDuration * 0.02)));
    const stepLarge = Math.max(5, Math.min(15, Math.round(safeDuration * 0.1)));

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        target = Math.min(safeDuration, currentTime + stepSmall);
        handled = true;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        target = Math.max(0, currentTime - stepSmall);
        handled = true;
        break;
      case 'PageUp':
        target = Math.min(safeDuration, currentTime + stepLarge);
        handled = true;
        break;
      case 'PageDown':
        target = Math.max(0, currentTime - stepLarge);
        handled = true;
        break;
      case 'Home':
        target = 0;
        handled = true;
        break;
      case 'End':
        target = safeDuration;
        handled = true;
        break;
      default:
        break;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      onUserInteraction?.();
      onSeek(target);
    }
  };

  return (
    <div className="w-full">
      {/* Interactive Hit Area for Scrubber (Deterministic Fixed Height) */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Seek through playback"
        aria-valuemin={0}
        aria-valuemax={safeDuration}
        aria-valuenow={safeCurrentTime}
        aria-valuetext={`${formatMediaTime(safeCurrentTime)} of ${formatMediaTime(safeDuration)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={handleKeyDown}
        className="w-full h-6 cursor-pointer touch-none select-none relative flex items-center group outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-full"
        style={{
          ['--tw-ring-color' as any]: customColor,
        }}
      >
        {/* Background Track (Fixed 8px height across all states) */}
        <div className="w-full bg-slate-800/90 h-[8px] rounded-full overflow-hidden relative border border-slate-700/50">
          {/* Played Portion */}
          <div
            className={`h-full rounded-full ${isDragging ? '' : 'transition-all duration-150 ease-out'}`}
            style={{
              width: `${percentage}%`,
              backgroundColor: customColor,
              boxShadow: `0 0 10px ${customColor}80`,
            }}
          />
        </div>

        {/* Scrubber Thumb (Fixed 18px size, vertically centered with zero layout shift) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[18px] h-[18px] rounded-full bg-white shadow-lg pointer-events-none transition-transform duration-100 ease-out ${
            isDragging || isHovered ? 'scale-110' : 'scale-100'
          }`}
          style={{
            left: `${percentage}%`,
            border: `2.5px solid ${customColor}`,
            boxShadow: `0 0 10px ${customColor}A0, 0 2px 6px rgba(0,0,0,0.6)`,
          }}
        />
      </div>

      {/* Time Indicators: Elapsed and Duration */}
      {showTimestamps && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 font-semibold select-none tabular-nums mt-0.5">
          <span>{formatMediaTime(safeCurrentTime)}</span>
          <span>{formatMediaTime(safeDuration)}</span>
        </div>
      )}
    </div>
  );
};

export const NowPlayingWidget: React.FC<NowPlayingWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity = 1,
  isPresentation = false,
}) => {
  const componentWidth = component.width ?? 400;
  const componentHeight = component.height ?? 200;
  const orientation = (component.staticProps?.orientation || 'horizontal') as 'horizontal' | 'vertical';

  const layout = useMemo(
    () => resolveNowPlayingLayout(componentWidth, componentHeight, orientation),
    [componentWidth, componentHeight, orientation]
  );

  const {
    isExtremelyConstrained,
    isTallLayout,
    isStandardHorizontal,
    useRightSideControls,
    showThumbnail,
    showTimestamps,
    showFavoriteButton,
    showShuffleRepeat,
    paddingClass,
    buttonWidthPx,
    buttonHeightPx,
    playButtonWidthPx,
    playButtonHeightPx,
    buttonSizePx,
    playButtonSizePx,
    iconSizePx,
    controlGapPx,
    secondaryControlSizePx,
    secondaryIconSizePx,
  } = layout;

  const headerLabel =
    resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.nowPlaying || 'Now Playing';

  const autoDismissEnabled = component.staticProps?.autoDismissEnabled === 'true';
  const autoDismissSeconds = Math.max(1, parseInt(component.staticProps?.autoDismissSeconds || '8', 10));
  const dismissDirection = (component.staticProps?.dismissDirection || 'down') as DismissDirection;
  const slideDurationMs = Math.max(50, Math.min(10000, parseInt(component.staticProps?.slideDurationMs || '800', 10)));
  const songTransition = (component.staticProps?.songTransition || 'fade') as SongTransition;
  const songInfoDisplayDurationSec = Math.max(
    0.1,
    Math.min(30, parseFloat(component.staticProps?.songInfoDisplayDuration || '2.5'))
  );

  // Active track and playback state
  const initialTrackId = component.staticProps?.trackId || SAMPLE_TRACKS[0].id;
  const initialTrack = SAMPLE_TRACKS.find((t) => t.id === initialTrackId) || SAMPLE_TRACKS[0];

  const [currentTrack, setCurrentTrack] = useState<Track>(initialTrack);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progressSec, setProgressSec] = useState<number>(102);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [favoritedTrackIds, setFavoritedTrackIds] = useState<Set<string>>(
    () => new Set(['t1', 't7'])
  );
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const prefersReducedMotion = useReducedMotion() ?? false;

  const isFavorited = favoritedTrackIds.has(currentTrack.id);

  const toggleFavorite = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavoritedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentTrack.id)) {
        next.delete(currentTrack.id);
      } else {
        next.add(currentTrack.id);
      }
      return next;
    });
    resetDismissTimer();
  };

  const transitionVariants = useMemo(
    () => getTransitionVariants(songTransition, prefersReducedMotion),
    [songTransition, prefersReducedMotion]
  );
  const transitionConfig = useMemo(
    () => getTransitionConfig(songTransition, prefersReducedMotion),
    [songTransition, prefersReducedMotion]
  );

  // Auto-dismiss state
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compact mode song transition metadata reveal
  const [isMetadataRevealing, setIsMetadataRevealing] = useState<boolean>(false);
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear reveal timer on unmount
  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  // When resizing out of extremely constrained mode, cancel the reveal timer and reset state
  useEffect(() => {
    if (!isExtremelyConstrained && isMetadataRevealing) {
      setIsMetadataRevealing(false);
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    }
  }, [isExtremelyConstrained, isMetadataRevealing]);

  // Function to show/reset the auto-dismiss timer whenever track starts or user interacts
  const resetDismissTimer = (customDuration?: number) => {
    setIsDismissed(false);
    if (!autoDismissEnabled) return;
    // In editor mode, do not set dismiss timer while the component is actively selected
    if (!isPresentation && isSelected) {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      return;
    }

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

    const duration = customDuration ?? autoDismissSeconds;

    dismissTimerRef.current = setTimeout(() => {
      setIsDismissed(true);
    }, duration * 1000);
  };

  // Reset timer on mount or when autoDismiss settings change
  useEffect(() => {
    if (autoDismissEnabled) {
      if (!isPresentation && isSelected) {
        setIsDismissed(false);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      } else {
        resetDismissTimer();
      }
    } else {
      setIsDismissed(false);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    }
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [autoDismissEnabled, autoDismissSeconds, dismissDirection, slideDurationMs, isPresentation, isSelected]);

  // In editor mode, selecting the component brings it into view immediately; deselecting resumes the dismiss timer
  useEffect(() => {
    if (!isPresentation) {
      if (isSelected) {
        setIsDismissed(false);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      } else if (autoDismissEnabled) {
        resetDismissTimer();
      }
    }
  }, [isSelected, isPresentation, autoDismissEnabled]);

  // When track prop changes in inspector/props, start track and slide back in
  useEffect(() => {
    if (component.staticProps?.trackId) {
      const trk = SAMPLE_TRACKS.find((t) => t.id === component.staticProps.trackId);
      if (trk && trk.id !== currentTrack.id) {
        const curIdx = SAMPLE_TRACKS.findIndex((t) => t.id === currentTrack.id);
        const newIdx = SAMPLE_TRACKS.findIndex((t) => t.id === trk.id);
        const dir: 'next' | 'prev' = newIdx < curIdx ? 'prev' : 'next';
        handleSelectTrack(trk, dir);
      }
    }
  }, [component.staticProps?.trackId]);

  // Handle new track selection / song start (reappears and resets auto-dismiss)
  const handleSelectTrack = (track: Track, dir: 'next' | 'prev' = 'next') => {
    setSlideDirection(dir);
    setCurrentTrack(track);
    setProgressSec(0);
    setIsPlaying(true);
    resetDismissTimer();

    if (isExtremelyConstrained) {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      setIsMetadataRevealing(true);
      revealTimerRef.current = setTimeout(() => {
        setIsMetadataRevealing(false);
        revealTimerRef.current = null;
      }, songInfoDisplayDurationSec * 1000);
    } else {
      setIsMetadataRevealing(false);
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    }
  };

  const handleNextTrack = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentIndex = SAMPLE_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % SAMPLE_TRACKS.length;
    handleSelectTrack(SAMPLE_TRACKS[nextIndex], 'next');
  };

  const handlePrevTrack = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentIndex = SAMPLE_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + SAMPLE_TRACKS.length) % SAMPLE_TRACKS.length;
    handleSelectTrack(SAMPLE_TRACKS[prevIndex], 'prev');
  };

  const handleTogglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) resetDismissTimer();
      return next;
    });
  };

  // Handle seeking: update progressSec and reset auto dismiss timer without altering play/pause state
  const handleSeek = (newSec: number) => {
    setProgressSec(newSec);
    resetDismissTimer();
  };

  // Progress timer: when song completes, automatically advances to next song & slides back in
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgressSec((prev) => {
          if (prev >= currentTrack.durationSec) {
            handleNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.durationSec, currentTrack.id]);

  const isActuallyDismissed = isDismissed && autoDismissEnabled && (!isSelected || isPresentation);

  return (
    <div
      id={`component-${component.type}`}
      data-component-type="nowPlaying"
      className="w-full h-full min-w-0 min-h-0 relative select-none"
    >
      {/* Editor Ghost Placeholder: Shown in Editor mode when dismissed & unselected */}
      {!isPresentation && isActuallyDismissed && !isSelected && (
        <div
          data-testid="nowplaying-editor-ghost"
          className="absolute inset-0 rounded-2xl border-2 border-dashed border-sky-500/50 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center transition-all hover:border-sky-400 hover:bg-slate-900/80 cursor-pointer pointer-events-auto shadow-md z-0"
          onClick={(e) => {
            e.stopPropagation();
            resetDismissTimer();
          }}
          title="Now Playing (Auto-dismissed · Click to select)"
        >
          <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[11px] font-bold uppercase tracking-wider truncate max-w-full px-1">
            <Music className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span className="truncate">{headerLabel}</span>
          </div>
          {componentHeight >= 80 && (
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-full px-1">
              Auto-dismissed · Click to select
            </span>
          )}
        </div>
      )}

      {/* Main Now Playing Widget Card */}
      <div
        onClick={() => {
          if (autoDismissEnabled && isDismissed) {
            resetDismissTimer();
          }
        }}
        className={`w-full h-full min-w-0 min-h-0 rounded-2xl bg-slate-900/90 border border-slate-800 ${paddingClass} flex flex-col justify-between shadow-lg backdrop-blur-md relative select-none @container overflow-hidden ${baseOpacity} ${
          isActuallyDismissed && isPresentation ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
        style={{
          borderColor: isSelected ? customColor : undefined,
          transform: isActuallyDismissed ? getDismissTransform(dismissDirection, component) : 'translate3d(0, 0, 0)',
          opacity: styleOpacity,
          transition: `transform ${slideDurationMs}ms cubic-bezier(0.2, 0.85, 0.3, 1)`,
          willChange: 'transform',
          containerType: 'inline-size',
        }}
      >
      {/* Component Header */}
      <ComponentHeader
        type="nowPlaying"
        label={headerLabel}
        customColor={customColor}
      />

      {/* 1. EXTREMELY CONSTRAINED LAYOUT (Height < 125px) */}
      {isExtremelyConstrained ? (
        <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden pt-0.5">
          <AnimatePresence mode="wait" initial={false}>
            {isMetadataRevealing ? (
              /* Song-change brief metadata reveal with selected song transition */
              <motion.div
                key={`reveal-${currentTrack.id}`}
                custom={slideDirection}
                variants={transitionVariants}
                initial={songTransition === 'none' || prefersReducedMotion ? false : 'initial'}
                animate="animate"
                exit="exit"
                transition={transitionConfig}
                className="flex items-center justify-between gap-2.5 w-full h-full min-w-0 px-1"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {showThumbnail && (
                    <div
                      className={`rounded-lg bg-gradient-to-br ${currentTrack.coverBg} flex items-center justify-center shrink-0 shadow-sm border border-white/20 overflow-hidden aspect-square`}
                      style={{
                        width: '28px',
                        height: '28px',
                        minWidth: '28px',
                        minHeight: '28px',
                      }}
                    >
                      {renderCoverIcon(
                        currentTrack.iconName,
                        'w-3.5 h-3.5 text-white/90'
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-100 truncate leading-tight">
                      {currentTrack.title}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400 truncate font-medium leading-tight">
                      {currentTrack.artist}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
                  Now Playing
                </div>
              </motion.div>
            ) : (
              /* Normal state: Scrubber + Dedicated 40px Playback Controls */
              <motion.div
                key="constrained-controls-row"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2.5 sm:gap-3 w-full h-full min-w-0"
              >
                {/* Scrubber (Surrenders width gracefully before controls shrink) */}
                <div className="flex-1 min-w-0 flex items-center">
                  <PlaybackScrubber
                    currentTime={progressSec}
                    duration={currentTrack.durationSec}
                    customColor={customColor}
                    showTimestamps={false}
                    onSeek={handleSeek}
                    onUserInteraction={() => resetDismissTimer()}
                  />
                </div>

                {/* Primary Playback Controls */}
                <div className="flex items-center shrink-0" style={{ gap: `${controlGapPx}px` }}>
                  <button
                    onClick={handlePrevTrack}
                    style={{
                      width: `${buttonWidthPx}px`,
                      height: `${buttonHeightPx}px`,
                      minWidth: `${buttonWidthPx}px`,
                      minHeight: `${buttonHeightPx}px`,
                      aspectRatio: '1 / 1',
                    }}
                    className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 aspect-square flex items-center justify-center active:scale-95"
                    title="Previous track"
                    aria-label="Previous track"
                  >
                    <SkipBack style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} />
                  </button>

                  <button
                    onClick={handleTogglePlay}
                    style={{
                      width: `${playButtonWidthPx}px`,
                      height: `${playButtonHeightPx}px`,
                      minWidth: `${playButtonWidthPx}px`,
                      minHeight: `${playButtonHeightPx}px`,
                      aspectRatio: '1 / 1',
                      backgroundColor: customColor,
                      boxShadow: `0 0 12px ${customColor}60`,
                    }}
                    className="rounded-full text-slate-950 flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95 hover:brightness-110 font-bold shrink-0 aspect-square"
                    title={isPlaying ? 'Pause' : 'Play'}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} className="fill-current text-slate-950" />
                    ) : (
                      <Play style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} className="fill-current ml-0.5 text-slate-950" />
                    )}
                  </button>

                  <button
                    onClick={handleNextTrack}
                    style={{
                      width: `${buttonWidthPx}px`,
                      height: `${buttonHeightPx}px`,
                      minWidth: `${buttonWidthPx}px`,
                      minHeight: `${buttonHeightPx}px`,
                      aspectRatio: '1 / 1',
                    }}
                    className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 aspect-square flex items-center justify-center active:scale-95"
                    title="Next track"
                    aria-label="Next track"
                  >
                    <SkipForward style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : useRightSideControls ? (
        /* 2. COMPACT / SHORT LAYOUT (Right-Side Playback Controls with 2 rows) */
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-1 pt-0.5">
          {/* Top Row: Track metadata row with smooth song-change transition + Favorite */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="grid grid-cols-1 grid-rows-1 relative flex-1 min-w-0 overflow-hidden items-center">
              <AnimatePresence
                mode={songTransition === 'fade' ? 'wait' : 'sync'}
                custom={slideDirection}
                initial={false}
              >
                <motion.div
                  key={currentTrack.id}
                  custom={slideDirection}
                  variants={transitionVariants}
                  initial={songTransition === 'none' || prefersReducedMotion ? false : 'initial'}
                  animate="animate"
                  exit="exit"
                  transition={transitionConfig}
                  className="col-start-1 row-start-1 flex items-center gap-2.5 min-w-0 w-full"
                >
                  {showThumbnail && (
                    <div
                      className={`rounded-lg bg-gradient-to-br ${currentTrack.coverBg} flex items-center justify-center shrink-0 shadow-sm border border-white/20 overflow-hidden aspect-square`}
                      style={{
                        width: 'clamp(24px, 7cqw, 32px)',
                        height: 'clamp(24px, 7cqw, 32px)',
                        minWidth: '24px',
                        minHeight: '24px',
                        maxWidth: '32px',
                        maxHeight: '32px',
                      }}
                    >
                      {renderCoverIcon(
                        currentTrack.iconName,
                        'w-[50%] h-[50%] max-w-[16px] max-h-[16px] min-w-[12px] min-h-[12px] text-white/90'
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-100 truncate leading-tight">
                      {currentTrack.title}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400 truncate font-medium leading-tight">
                      {currentTrack.artist}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Favorite button if horizontal space permits */}
            {showFavoriteButton && (
              <button
                onClick={toggleFavorite}
                style={{
                  width: `${secondaryControlSizePx}px`,
                  height: `${secondaryControlSizePx}px`,
                  minWidth: `${secondaryControlSizePx}px`,
                  minHeight: `${secondaryControlSizePx}px`,
                }}
                className={`p-1 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-90 ${
                  isFavorited
                    ? 'text-rose-500 bg-rose-500/15 border border-rose-500/30'
                    : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                }`}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart style={{ width: `${secondaryIconSizePx}px`, height: `${secondaryIconSizePx}px` }} className={isFavorited ? 'fill-current' : ''} />
              </button>
            )}
          </div>

          {/* Bottom Row: Scrubber (Flex-1) + Right-Side Playback Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full min-w-0">
            {/* Scrubber */}
            <div className="flex-1 min-w-0 flex items-center">
              <PlaybackScrubber
                currentTime={progressSec}
                duration={currentTrack.durationSec}
                customColor={customColor}
                showTimestamps={false}
                onSeek={handleSeek}
                onUserInteraction={() => resetDismissTimer()}
              />
            </div>

            {/* Dedicated Playback Controls */}
            <div className="flex items-center shrink-0" style={{ gap: `${controlGapPx}px` }}>
              <button
                onClick={handlePrevTrack}
                style={{
                  width: `${buttonWidthPx}px`,
                  height: `${buttonHeightPx}px`,
                  minWidth: `${buttonWidthPx}px`,
                  minHeight: `${buttonHeightPx}px`,
                  aspectRatio: '1 / 1',
                }}
                className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 aspect-square flex items-center justify-center active:scale-95"
                title="Previous track"
                aria-label="Previous track"
              >
                <SkipBack style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} />
              </button>

              <button
                onClick={handleTogglePlay}
                style={{
                  width: `${playButtonWidthPx}px`,
                  height: `${playButtonHeightPx}px`,
                  minWidth: `${playButtonWidthPx}px`,
                  minHeight: `${playButtonHeightPx}px`,
                  aspectRatio: '1 / 1',
                  backgroundColor: customColor,
                  boxShadow: `0 0 12px ${customColor}60`,
                }}
                className="rounded-full text-slate-950 flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95 hover:brightness-110 font-bold shrink-0 aspect-square"
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} className="fill-current text-slate-950" />
                ) : (
                  <Play style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} className="fill-current ml-0.5 text-slate-950" />
                )}
              </button>

              <button
                onClick={handleNextTrack}
                style={{
                  width: `${buttonWidthPx}px`,
                  height: `${buttonHeightPx}px`,
                  minWidth: `${buttonWidthPx}px`,
                  minHeight: `${buttonHeightPx}px`,
                  aspectRatio: '1 / 1',
                }}
                className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 aspect-square flex items-center justify-center active:scale-95"
                title="Next track"
                aria-label="Next track"
              >
                <SkipForward style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} />
              </button>
            </div>
          </div>
        </div>
      ) : isTallLayout ? (
        /* 3. TALL / SPACIOUS MEDIA PLAYER LAYOUT (Intentional vertical composition) */
        <div className="flex-1 min-h-0 flex flex-col justify-between py-1">
          {/* Song Information Block: Album Artwork aligned with Title + Artist */}
          <div className="grid grid-cols-1 grid-rows-1 relative w-full min-w-0 overflow-hidden items-center">
            <AnimatePresence
              mode={songTransition === 'fade' ? 'wait' : 'sync'}
              custom={slideDirection}
              initial={false}
            >
              <motion.div
                key={currentTrack.id}
                custom={slideDirection}
                variants={transitionVariants}
                initial={songTransition === 'none' || prefersReducedMotion ? false : 'initial'}
                animate="animate"
                exit="exit"
                transition={transitionConfig}
                className="col-start-1 row-start-1 flex items-center gap-3 min-w-0 w-full"
              >
                {showThumbnail && (
                  <div
                    className={`rounded-xl bg-gradient-to-br ${currentTrack.coverBg} flex items-center justify-center shrink-0 shadow-md border border-white/20 overflow-hidden aspect-square`}
                    style={{
                      width: 'clamp(36px, 14cqw, 48px)',
                      height: 'clamp(36px, 14cqw, 48px)',
                      minWidth: '36px',
                      minHeight: '36px',
                      maxWidth: '48px',
                      maxHeight: '48px',
                    }}
                  >
                    {renderCoverIcon(
                      currentTrack.iconName,
                      'w-[50%] h-[50%] max-w-[22px] max-h-[22px] min-w-[16px] min-h-[16px] text-white/90'
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="text-sm sm:text-base font-extrabold text-slate-100 truncate leading-snug">
                    {currentTrack.title}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 truncate font-medium leading-snug">
                    {currentTrack.artist}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Interactive Scrubber with Timestamps */}
          <div className="w-full">
            <PlaybackScrubber
              currentTime={progressSec}
              duration={currentTrack.durationSec}
              customColor={customColor}
              showTimestamps={showTimestamps}
              onSeek={handleSeek}
              onUserInteraction={() => resetDismissTimer()}
            />
          </div>

          {/* Centered Primary Playback Controls */}
          <div className="flex items-center justify-center shrink-0" style={{ gap: `${controlGapPx}px` }}>
            <button
              onClick={handlePrevTrack}
              style={{
                width: `${buttonWidthPx}px`,
                height: `${buttonHeightPx}px`,
                minWidth: `${buttonWidthPx}px`,
                minHeight: `${buttonHeightPx}px`,
                aspectRatio: '1 / 1',
              }}
              className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 aspect-square flex items-center justify-center active:scale-95"
              title="Previous track"
              aria-label="Previous track"
            >
              <SkipBack style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} />
            </button>

            <button
              onClick={handleTogglePlay}
              style={{
                width: `${playButtonWidthPx}px`,
                height: `${playButtonHeightPx}px`,
                minWidth: `${playButtonWidthPx}px`,
                minHeight: `${playButtonHeightPx}px`,
                aspectRatio: '1 / 1',
                backgroundColor: customColor,
                boxShadow: `0 0 14px ${customColor}60`,
              }}
              className="rounded-full text-slate-950 flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95 hover:brightness-110 font-bold shrink-0 aspect-square"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} className="fill-current text-slate-950" />
              ) : (
                <Play style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} className="fill-current ml-0.5 text-slate-950" />
              )}
            </button>

            <button
              onClick={handleNextTrack}
              style={{
                width: `${buttonWidthPx}px`,
                height: `${buttonHeightPx}px`,
                minWidth: `${buttonWidthPx}px`,
                minHeight: `${buttonHeightPx}px`,
                aspectRatio: '1 / 1',
              }}
              className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 aspect-square flex items-center justify-center active:scale-95"
              title="Next track"
              aria-label="Next track"
            >
              <SkipForward style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} />
            </button>
          </div>

          {/* Secondary Controls Row below primary controls: Favorite / Shuffle / Repeat */}
          {showShuffleRepeat && (
            <div className="flex items-center justify-center gap-2.5 shrink-0 pt-0.5 border-t border-slate-800/50">
              {/* Favorite */}
              <button
                onClick={toggleFavorite}
                style={{
                  width: `${secondaryControlSizePx}px`,
                  height: `${secondaryControlSizePx}px`,
                  minWidth: `${secondaryControlSizePx}px`,
                  minHeight: `${secondaryControlSizePx}px`,
                }}
                className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-90 ${
                  isFavorited
                    ? 'text-rose-500 bg-rose-500/15 border border-rose-500/30'
                    : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/60'
                }`}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart style={{ width: `${secondaryIconSizePx}px`, height: `${secondaryIconSizePx}px` }} className={isFavorited ? 'fill-current' : ''} />
              </button>

              {/* Shuffle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShuffle((p) => !p);
                  resetDismissTimer();
                }}
                style={{
                  width: `${secondaryControlSizePx}px`,
                  height: `${secondaryControlSizePx}px`,
                  minWidth: `${secondaryControlSizePx}px`,
                  minHeight: `${secondaryControlSizePx}px`,
                }}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                  isShuffle
                    ? 'text-slate-100 bg-slate-800 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title="Shuffle"
                aria-label="Shuffle"
              >
                <Shuffle style={{ width: `${secondaryIconSizePx}px`, height: `${secondaryIconSizePx}px` }} />
              </button>

              {/* Repeat */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRepeat((p) => !p);
                  resetDismissTimer();
                }}
                style={{
                  width: `${secondaryControlSizePx}px`,
                  height: `${secondaryControlSizePx}px`,
                  minWidth: `${secondaryControlSizePx}px`,
                  minHeight: `${secondaryControlSizePx}px`,
                }}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                  isRepeat
                    ? 'text-slate-100 bg-slate-800 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title="Repeat"
                aria-label="Repeat"
              >
                <Repeat style={{ width: `${secondaryIconSizePx}px`, height: `${secondaryIconSizePx}px` }} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 4. STANDARD HORIZONTAL LAYOUT (Bottom-Centered Playback Controls) */
        <div className="flex-1 min-h-0 flex flex-col justify-between pt-1">
          {/* Track Header Row: Cover Art + Info + Secondary Controls */}
          <div className="flex items-center justify-between gap-2 min-h-0">
            <div className="grid grid-cols-1 grid-rows-1 relative min-w-0 flex-1 overflow-hidden items-center">
              <AnimatePresence
                mode={songTransition === 'fade' ? 'wait' : 'sync'}
                custom={slideDirection}
                initial={false}
              >
                <motion.div
                  key={currentTrack.id}
                  custom={slideDirection}
                  variants={transitionVariants}
                  initial={songTransition === 'none' || prefersReducedMotion ? false : 'initial'}
                  animate="animate"
                  exit="exit"
                  transition={transitionConfig}
                  className="col-start-1 row-start-1 flex items-center gap-2.5 sm:gap-3 min-w-0 w-full"
                >
                  {showThumbnail && (
                    <div
                      className={`rounded-xl bg-gradient-to-br ${currentTrack.coverBg} flex items-center justify-center shrink-0 shadow-md border border-white/20 transition-transform overflow-hidden aspect-square`}
                      style={{
                        width: 'clamp(28px, 12cqw, 48px)',
                        height: 'clamp(28px, 12cqw, 48px)',
                        minWidth: '28px',
                        minHeight: '28px',
                        maxWidth: '48px',
                        maxHeight: '48px',
                      }}
                    >
                      {renderCoverIcon(
                        currentTrack.iconName,
                        'w-[50%] h-[50%] max-w-[20px] max-h-[20px] min-w-[14px] min-h-[14px] text-white/90'
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm sm:text-base font-extrabold text-slate-100 truncate">
                      {currentTrack.title}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-400 truncate font-medium">
                      {currentTrack.artist}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Secondary Controls Row (Favorite, Shuffle, Repeat) */}
            <div className="flex items-center gap-1 shrink-0">
              {showFavoriteButton && (
                <button
                  onClick={toggleFavorite}
                  style={{
                    width: `${secondaryControlSizePx}px`,
                    height: `${secondaryControlSizePx}px`,
                    minWidth: `${secondaryControlSizePx}px`,
                    minHeight: `${secondaryControlSizePx}px`,
                  }}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-90 ${
                    isFavorited
                      ? 'text-rose-500 bg-rose-500/15 border border-rose-500/30'
                      : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/40'
                  }`}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart style={{ width: `${secondaryIconSizePx}px`, height: `${secondaryIconSizePx}px` }} className={isFavorited ? 'fill-current' : ''} />
                </button>
              )}

              {showShuffleRepeat && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShuffle((p) => !p);
                      resetDismissTimer();
                    }}
                    style={{
                      width: `${secondaryControlSizePx}px`,
                      height: `${secondaryControlSizePx}px`,
                      minWidth: `${secondaryControlSizePx}px`,
                      minHeight: `${secondaryControlSizePx}px`,
                    }}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                      isShuffle
                        ? 'text-slate-100 bg-slate-800 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                    title="Shuffle"
                    aria-label="Shuffle"
                  >
                    <Shuffle style={{ width: `${secondaryIconSizePx}px`, height: `${secondaryIconSizePx}px` }} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRepeat((p) => !p);
                      resetDismissTimer();
                    }}
                    style={{
                      width: `${secondaryControlSizePx}px`,
                      height: `${secondaryControlSizePx}px`,
                      minWidth: `${secondaryControlSizePx}px`,
                      minHeight: `${secondaryControlSizePx}px`,
                    }}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                      isRepeat
                        ? 'text-slate-100 bg-slate-800 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                    title="Repeat"
                    aria-label="Repeat"
                  >
                    <Repeat style={{ width: `${secondaryIconSizePx}px`, height: `${secondaryIconSizePx}px` }} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Interactive Playback Scrubber & Time */}
          <div className="w-full">
            <PlaybackScrubber
              currentTime={progressSec}
              duration={currentTrack.durationSec}
              customColor={customColor}
              showTimestamps={showTimestamps}
              onSeek={handleSeek}
              onUserInteraction={() => resetDismissTimer()}
            />
          </div>

          {/* Centered Playback Controls */}
          <div className="flex items-center justify-center shrink-0 pt-0.5" style={{ gap: `${controlGapPx}px` }}>
            <button
              onClick={handlePrevTrack}
              style={{
                width: `${buttonWidthPx}px`,
                height: `${buttonHeightPx}px`,
                minWidth: `${buttonWidthPx}px`,
                minHeight: `${buttonHeightPx}px`,
                aspectRatio: '1 / 1',
              }}
              className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 aspect-square flex items-center justify-center active:scale-95"
              title="Previous track"
              aria-label="Previous track"
            >
              <SkipBack style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} />
            </button>

            <button
              onClick={handleTogglePlay}
              style={{
                width: `${playButtonWidthPx}px`,
                height: `${playButtonHeightPx}px`,
                minWidth: `${playButtonWidthPx}px`,
                minHeight: `${playButtonHeightPx}px`,
                aspectRatio: '1 / 1',
                backgroundColor: customColor,
                boxShadow: `0 0 14px ${customColor}60`,
              }}
              className="rounded-full text-slate-950 flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95 hover:brightness-110 font-bold shrink-0 aspect-square"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} className="fill-current text-slate-950" />
              ) : (
                <Play style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} className="fill-current ml-0.5 text-slate-950" />
              )}
            </button>

            <button
              onClick={handleNextTrack}
              style={{
                width: `${buttonWidthPx}px`,
                height: `${buttonHeightPx}px`,
                minWidth: `${buttonWidthPx}px`,
                minHeight: `${buttonHeightPx}px`,
                aspectRatio: '1 / 1',
              }}
              className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 aspect-square flex items-center justify-center active:scale-95"
              title="Next track"
              aria-label="Next track"
            >
              <SkipForward style={{ width: `${iconSizePx}px`, height: `${iconSizePx}px` }} />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

