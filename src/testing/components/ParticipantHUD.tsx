import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, FastForward, LogOut, Award, AlertTriangle } from 'lucide-react';
import { useUserTestingStore } from '../useUserTestingStore';
import { MasterPasswordModal } from './MasterPasswordModal';

export const ParticipantHUD: React.FC = () => {
  const activeSession = useUserTestingStore((s) => s.activeSession);
  const currentTaskIndex = useUserTestingStore((s) => s.currentTaskIndex);
  const taskStartTime = useUserTestingStore((s) => s.taskStartTime);
  const taskCompletedFlash = useUserTestingStore((s) => s.taskCompletedFlash);
  const completeCurrentTask = useUserTestingStore((s) => s.completeCurrentTask);
  const exitSessionEarly = useUserTestingStore((s) => s.exitSessionEarly);
  const settings = useUserTestingStore((s) => s.settings);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentTask = activeSession?.testSnapshot?.tasks?.[currentTaskIndex];
  const totalTasks = activeSession?.testSnapshot?.tasks?.length || 0;
  const timeLimit = currentTask?.timeLimitSeconds;

  // Real-time ticking timer for participant HUD
  useEffect(() => {
    if (!taskStartTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - taskStartTime) / 1000));
      setElapsedSeconds(elapsed);

      // Check for timeout if task is timed
      if (timeLimit && elapsed >= timeLimit) {
        completeCurrentTask('timeout');
      }
    }, 250);

    return () => clearInterval(interval);
  }, [taskStartTime, timeLimit, completeCurrentTask]);

  if (!activeSession || !currentTask) return null;

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const remainingSeconds = timeLimit ? Math.max(0, timeLimit - elapsedSeconds) : 0;
  const isUrgent = timeLimit && remainingSeconds <= 10;
  const isCritical = timeLimit && remainingSeconds <= 5;

  const handleExitClick = () => {
    if (settings.requirePasswordToExit) {
      setPasswordModalOpen(true);
    } else {
      setConfirmExitOpen(true);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[9999] bg-slate-950/95 border-b border-slate-800 shadow-xl backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-4 select-none">
        {/* Left: Participant & Progress */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-sky-400 font-mono">
              {activeSession.participantId}
            </span>
            <span className="text-slate-600 text-xs" aria-hidden="true">·</span>
            <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
              Task {currentTaskIndex + 1} of {totalTasks}
            </span>
          </div>

          <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentTaskIndex) / totalTasks) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Center: Current Task Natural-Language Instruction */}
        <div className="flex-1 max-w-2xl px-2 text-center min-w-0">
          {taskCompletedFlash ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400 animate-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold tracking-tight uppercase">
                Task Completed! +{currentTask.points || 100} pts
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="text-xs sm:text-sm font-medium text-slate-100 line-clamp-2 leading-snug">
                {currentTask.description}
              </span>
            </div>
          )}
        </div>

        {/* Right: Timer, Points & Action Affordances */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Timer Display */}
          <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Clock
              className={`w-3.5 h-3.5 shrink-0 ${
                isCritical
                  ? 'text-rose-400'
                  : isUrgent
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            />
            {timeLimit ? (
              <span
                className={`font-semibold ${
                  isCritical
                    ? 'text-rose-400'
                    : isUrgent
                    ? 'text-amber-400'
                    : 'text-slate-200'
                }`}
              >
                {formatTime(remainingSeconds)}
              </span>
            ) : (
              <span className="text-slate-300 font-medium">
                {formatTime(elapsedSeconds)}
              </span>
            )}
          </div>

          {/* Points */}
          <div className="hidden md:flex items-center gap-1 text-xs text-amber-400 font-mono font-medium">
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>{currentTask.points || 100} pts</span>
          </div>

          {/* Skip Task */}
          <button
            type="button"
            onClick={() => completeCurrentTask('skipped')}
            className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            title="Skip this task and proceed to next"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Skip</span>
          </button>

          {/* Exit Session */}
          <button
            type="button"
            onClick={handleExitClick}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors cursor-pointer"
            title="Exit Participant Session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Confirmation Modal when no password required */}
      {confirmExitOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold tracking-tight text-slate-100">
                Exit Testing Session?
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to end this participant session early? Any completed tasks will be saved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmExitOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmExitOpen(false);
                  exitSessionEarly(true);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-medium bg-rose-500 text-white hover:bg-rose-400 transition-colors cursor-pointer shadow-md"
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Password Prompt for Exit */}
      <MasterPasswordModal
        isOpen={passwordModalOpen}
        title="Exit Protected Session"
        description="A master password is required by the researcher to conclude or exit this participant session."
        onSuccess={() => {
          setPasswordModalOpen(false);
          exitSessionEarly(true);
        }}
        onCancel={() => setPasswordModalOpen(false)}
      />
    </>
  );
};
