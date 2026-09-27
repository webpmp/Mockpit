import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Star,
  Activity,
  Layers,
} from 'lucide-react';
import { SessionRecord, TaskResult } from '../types';

interface SessionDetailModalProps {
  session: SessionRecord | null;
  onClose: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, onClose }) => {
  const [expandedTaskIndex, setExpandedTaskIndex] = useState<number | null>(null);

  if (!session) return null;

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${session.participantId}-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedDate = new Date(session.startedAt).toLocaleString();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl space-y-6 my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-sky-400 font-mono">
                {session.participantId}
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {session.testName}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="font-mono text-xs text-slate-500">ID: {session.id}</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>{formattedDate}</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span
                className={`font-semibold capitalize ${
                  session.status === 'completed'
                    ? 'text-emerald-400'
                    : session.status === 'abandoned'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {session.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Download Session Report JSON"
            >
              Export JSON
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block">SCORE</span>
              <div className="text-xl font-bold text-sky-400 font-mono tabular-nums mt-1">
                {session.totalPoints} / {session.maxPoints} pts
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block">TOTAL DURATION</span>
              <div className="text-xl font-bold text-slate-200 font-mono tabular-nums mt-1">
                {session.totalDurationSeconds}s
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block">COMPLETED TASKS</span>
              <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
                {session.taskResults.filter((t) => t.status === 'completed').length} / {session.taskResults.length}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block">PASS RATE</span>
              <div className="text-xl font-bold text-slate-200 font-mono tabular-nums mt-1">
                {session.taskResults.length > 0
                  ? Math.round(
                      (session.taskResults.filter((t) => t.status === 'completed').length /
                        session.taskResults.length) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>

          {/* Research Goal Reference */}
          {session.testSnapshot?.goal && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-300">
              <strong className="text-xs font-mono font-bold text-slate-400 block mb-1 uppercase tracking-wider">RESEARCH GOAL:</strong>
              {session.testSnapshot.goal}
            </div>
          )}

          {/* Task-by-Task Detailed Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Task Breakdown & Telemetry ({session.taskResults.length})
            </h3>

            <div className="space-y-2">
              {session.taskResults.map((result, idx) => {
                const isExpanded = expandedTaskIndex === idx;

                return (
                  <div
                    key={result.instanceId || idx}
                    className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden transition-all"
                  >
                    <div
                      onClick={() => setExpandedTaskIndex(isExpanded ? null : idx)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono font-semibold shrink-0">
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-200 truncate">
                              {result.taskName}
                            </span>
                            <span className="text-slate-600 text-xs" aria-hidden="true">·</span>
                            <span className="text-xs font-mono text-slate-400">
                              Screen: {result.targetScreen}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {result.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Status Icon */}
                        {result.status === 'completed' && (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Passed</span>
                          </div>
                        )}
                        {result.status === 'timeout' && (
                          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
                            <Clock className="w-4 h-4" />
                            <span>Timed Out</span>
                          </div>
                        )}
                        {result.status === 'skipped' && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            <span>Skipped</span>
                          </div>
                        )}

                        {/* Timing and Points */}
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-slate-200 tabular-nums">
                            {result.durationSeconds}s
                          </div>
                          <div className="text-xs font-mono text-amber-400 tabular-nums">
                            {result.pointsEarned} / {result.maxPoints} pts
                          </div>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Telemetry & Interaction Log */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-900/60 border-t border-slate-800 space-y-3 text-xs">
                        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                          <span>INTERACTIONS CAPTURED: {result.interactions?.length || 0}</span>
                          <span>TARGET COMPONENT: {result.targetComponent}</span>
                        </div>

                        {result.interactions && result.interactions.length > 0 ? (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {result.interactions.map((entry, logIdx) => (
                              <div
                                key={entry.id || logIdx}
                                className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between"
                              >
                                <span>{entry.details || `${entry.eventType} on ${entry.targetType || entry.targetId}`}</span>
                                <span className="text-slate-500 tabular-nums">
                                  +{entry.responseTimeMs}ms
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            No discrete taps logged during this task.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Questionnaire Responses */}
          {session.feedbackAnswers && session.feedbackAnswers.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                Post-Test Participant Feedback ({session.feedbackAnswers.length})
              </h3>

              <div className="space-y-2.5">
                {session.feedbackAnswers.map((ans, idx) => (
                  <div key={ans.questionId || idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-sm font-medium text-slate-300 block">{ans.prompt}</span>
                    {ans.type === 'rating' ? (
                      <div className="flex items-center gap-1.5 text-amber-400 pt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Number(ans.value) ? 'fill-amber-400' : 'text-slate-700'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-mono text-slate-300 ml-1.5 font-bold">
                          {ans.value} / 5
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-slate-200 pt-0.5">
                        {String(ans.value) || <span className="text-slate-600 italic">No response provided</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
