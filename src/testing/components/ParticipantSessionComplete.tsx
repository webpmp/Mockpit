import React, { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { useUserTestingStore } from '../useUserTestingStore';
import { FeedbackAnswer, FeedbackQuestion } from '../types';
import { MasterPasswordModal } from './MasterPasswordModal';

export const ParticipantSessionComplete: React.FC = () => {
  const sessionCompleteOpen = useUserTestingStore((s) => s.sessionCompleteOpen);
  const sessionLocked = useUserTestingStore((s) => s.sessionLocked);
  const activeSession = useUserTestingStore((s) => s.activeSession);
  const pendingCompletedSession = useUserTestingStore((s) => s.pendingCompletedSession);
  const submitSessionFeedback = useUserTestingStore((s) => s.submitSessionFeedback);
  const unlockAndViewResults = useUserTestingStore((s) => s.unlockAndViewResults);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  const session = pendingCompletedSession || activeSession;

  if (!sessionCompleteOpen || !session) return null;

  const questions: FeedbackQuestion[] = session.testSnapshot?.feedbackQuestions || [];

  if (sessionLocked) {
    return (
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 relative">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              You&apos;re all set. Thanks again.
            </h2>
          </div>

          {/* Muted researcher-only control in the bottom corner */}
          <div className="pt-6 border-t border-slate-800/60 flex justify-end">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors cursor-pointer py-1 px-2 rounded"
              title="Researcher: End session"
            >
              End session
            </button>
          </div>
        </div>

        <MasterPasswordModal
          isOpen={passwordModalOpen}
          title="End Testing Session"
          description="Enter the researcher master password to unlock and view session results."
          onCancel={() => setPasswordModalOpen(false)}
          onSuccess={() => {
            setPasswordModalOpen(false);
            unlockAndViewResults();
          }}
        />
      </div>
    );
  }

  const handleRatingChange = (qId: string, rating: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: rating }));
  };

  const handleTextChange = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleChoiceSelect = (qId: string, choice: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: choice }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedAnswers: FeedbackAnswer[] = questions.map((q) => ({
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      value: answers[q.id] !== undefined ? answers[q.id] : '',
    }));

    submitSessionFeedback(formattedAnswers);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-6 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Celebration Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Thank you for participating
          </h2>
          <p className="text-sm text-slate-400">
            {questions.length > 0
              ? 'Your session is complete. Please answer a few final questions.'
              : 'Your session is complete.'}
          </p>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2.5 pb-4 border-b border-slate-800 last:border-b-0">
              <label className="text-sm font-semibold text-slate-200 block leading-relaxed">
                <span className="text-slate-500 font-mono mr-1.5">{idx + 1}.</span>
                {q.prompt}
                {q.required && <span className="text-rose-400 ml-1">*</span>}
              </label>

              {/* Rating Scale (1 to 5 stars) */}
              {q.type === 'rating' && (
                <div className="flex items-center gap-2.5 pt-1">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const currentRating = Number(answers[q.id] || 0);
                    const isFilled = val <= currentRating;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleRatingChange(q.id, val)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          isFilled
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${isFilled ? 'fill-amber-400' : ''}`} />
                        <span className="text-xs font-mono">{val}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multiple Choice Options */}
              {q.type === 'choice' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleChoiceSelect(q.id, opt)}
                        className={`px-3.5 py-2.5 rounded-xl text-sm text-left transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500/50 text-sky-300 font-medium'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text Area */}
              {q.type === 'text' && (
                <textarea
                  value={String(answers[q.id] || '')}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  rows={3}
                  placeholder="Share any thoughts or observations..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors resize-none"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer shadow-lg shadow-sky-500/10 whitespace-nowrap"
          >
            {questions.length > 0 ? 'Submit Feedback & Finish Session' : 'Finish Session'}
          </button>
        </form>
      </div>
    </div>
  );
};
