import React, { useState, useRef, useEffect, useCallback } from 'react';

interface StartupVideoProps {
  /** Called when the video sequence finishes (ended, skipped, or failed) */
  onComplete: () => void;
}

/**
 * StartupVideo
 * Plays `/mockpit-intro-v4.mp4` once on initial application load / refresh.
 *
 * Audio Strategy:
 * 1. Default to unmuted playback (muted={false} / muted property = false).
 * 2. On mount / readiness, explicitly call video.play().
 * 3. If unmuted video.play() succeeds: video plays with audio enabled.
 * 4. If unmuted video.play() is rejected (e.g. browser autoplay policy NotAllowedError):
 *    - Fallback: set video.muted = true, and retry video.play().
 *    - If muted retry succeeds: video continues muted without blocking the app.
 *    - If muted retry also fails or errors: dismiss overlay gracefully and reveal Editor.
 * 5. On video ended (or user click/keydown/skip), overlay fades out smoothly over 600ms.
 */
export const StartupVideo: React.FC<StartupVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const completedRef = useRef<boolean>(false);

  const finishSequence = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);

    // Wait for the CSS fade-out transition (600ms) to complete before unmounting
    setTimeout(() => {
      setIsCompleted(true);
      onComplete();
    }, 600);
  }, [onComplete]);

  // Handle video element events and unmuted-first autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let fallbackTimeout: NodeJS.Timeout | null = null;
    let isCancelled = false;

    // Safety timeout: video is ~9.9s, if neither ended nor error fires in 14s, dismiss gracefully
    fallbackTimeout = setTimeout(() => {
      if (!completedRef.current) {
        console.warn('[StartupVideo] Safety fallback timeout reached; dismissing intro overlay.');
        finishSequence();
      }
    }, 14000);

    const handleEnded = () => {
      finishSequence();
    };

    const handleError = (e: Event) => {
      console.warn('[StartupVideo] Playback error encountered, dismissing overlay:', e);
      finishSequence();
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Initial playback attempt: unmuted
    video.muted = false;

    const attemptPlay = async () => {
      try {
        await video.play();
        console.info('[StartupVideo] Unmuted autoplay succeeded with original audio.');
      } catch (err: unknown) {
        if (isCancelled || completedRef.current) return;
        console.warn('[StartupVideo] Unmuted autoplay rejected by browser policy:', err);

        // Fallback: Attempt muted playback to allow visual sequence without blocking app
        try {
          video.muted = true;
          setIsMuted(true);
          await video.play();
          console.info('[StartupVideo] Fallback muted autoplay succeeded.');
        } catch (mutedErr: unknown) {
          if (isCancelled || completedRef.current) return;
          console.warn('[StartupVideo] Muted autoplay also failed; dismissing overlay:', mutedErr);
          finishSequence();
        }
      }
    };

    attemptPlay();

    return () => {
      isCancelled = true;
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [finishSequence]);

  // Keyboard shortcut to skip intro (Escape, Space, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        finishSequence();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishSequence]);

  if (isCompleted) {
    return null;
  }

  return (
    <div
      data-testid="startup-video-overlay"
      aria-label="Startup Video"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden select-none transition-opacity duration-600 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={finishSequence}
    >
      <div className="relative w-full h-full flex items-center justify-center p-0 m-0">
        <video
          ref={videoRef}
          src="/mockpit-intro-v4.mp4"
          autoPlay
          muted={isMuted}
          playsInline
          preload="auto"
          className="w-full h-full object-contain max-w-full max-h-full pointer-events-auto cursor-pointer"
          data-testid="startup-video-element"
        />

        {/* Skip button indicator in top right for convenient accessibility */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            finishSequence();
          }}
          className="absolute top-6 right-6 z-10 px-3.5 py-1.5 rounded-full text-xs font-medium text-white/70 bg-black/40 hover:bg-black/70 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer opacity-75 hover:opacity-100"
          title="Press Esc or click to skip intro"
        >
          Skip Intro
        </button>
      </div>
    </div>
  );
};
