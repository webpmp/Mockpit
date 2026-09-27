import React, { useState, useEffect } from 'react';
import { X, Play, UserCheck, Shield } from 'lucide-react';
import { useUserTestingStore } from '../useUserTestingStore';

interface StartSessionModalProps {
  isOpen: boolean;
  initialTestId?: string;
  onClose: () => void;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  initialTestId,
  onClose,
}) => {
  const tests = useUserTestingStore((s) => s.tests);
  const sessions = useUserTestingStore((s) => s.sessions);
  const startSession = useUserTestingStore((s) => s.startSession);

  // Auto-generate next participant id
  const nextParticipantId = `P-${String(sessions.length + 1).padStart(3, '0')}`;
  const [participantId, setParticipantId] = useState(nextParticipantId);
  const [selectedTestId, setSelectedTestId] = useState(initialTestId || tests[0]?.id || '');
  const [researcherNotes, setResearcherNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setParticipantId(`P-${String(sessions.length + 1).padStart(3, '0')}`);
      setSelectedTestId(initialTestId || tests[0]?.id || '');
      setResearcherNotes('');
    }
  }, [isOpen, initialTestId, sessions.length, tests]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) return;

    startSession(selectedTestId, participantId, researcherNotes);
    onClose();
  };

  const selectedTest = tests.find((t) => t.id === selectedTestId);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 w-full max-w-lg space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5 text-slate-100">
            <Play className="w-5 h-5 text-emerald-400 fill-current" />
            <h3 className="text-lg font-bold tracking-tight">Launch Participant Mode</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Test */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 block">Select Research Test</label>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
            >
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.tasks.length} tasks)
                </option>
              ))}
            </select>
            {selectedTest && (
              <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                {selectedTest.goal}
              </p>
            )}
          </div>

          {/* Participant ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 block">Participant ID</label>
            <div className="relative">
              <input
                type="text"
                required
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="e.g. P-001"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono uppercase focus:outline-none focus:border-sky-500"
              />
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Optional Researcher Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 block">
              Session Notes / Condition (Optional)
            </label>
            <input
              type="text"
              value={researcherNotes}
              onChange={(e) => setResearcherNotes(e.target.value)}
              placeholder="e.g. Driver seat, day lighting condition"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5 leading-relaxed">
            <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              The participant will interact with the real Infotainment displays and controls. Researcher controls and navigation will remain hidden.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors flex items-center gap-2 cursor-pointer shadow-md whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>Begin Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
