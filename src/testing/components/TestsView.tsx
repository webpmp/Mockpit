import React, { useState } from 'react';
import {
  Plus,
  Play,
  Edit,
  Copy,
  Trash2,
  Clock,
  Award,
  ListOrdered,
  FileQuestion,
  Layers,
} from 'lucide-react';
import { useUserTestingStore } from '../useUserTestingStore';
import { TestDefinition } from '../types';
import { TestEditorModal } from './TestEditorModal';
import { StartSessionModal } from './StartSessionModal';

export const TestsView: React.FC = () => {
  const tests = useUserTestingStore((s) => s.tests);
  const addTest = useUserTestingStore((s) => s.addTest);
  const updateTest = useUserTestingStore((s) => s.updateTest);
  const deleteTest = useUserTestingStore((s) => s.deleteTest);
  const duplicateTest = useUserTestingStore((s) => s.duplicateTest);

  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestDefinition | null>(null);
  const [startSessionModalOpen, setStartSessionModalOpen] = useState(false);
  const [selectedTestIdForSession, setSelectedTestIdForSession] = useState<string | undefined>(undefined);

  const handleCreateNew = () => {
    setEditingTest(null);
    setEditorModalOpen(true);
  };

  const handleEdit = (test: TestDefinition) => {
    setEditingTest(test);
    setEditorModalOpen(true);
  };

  const handleStartSession = (testId: string) => {
    setSelectedTestIdForSession(testId);
    setStartSessionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Research Test Definitions
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure reusable usability tests, structured deterministic tasks, and post-session questionnaires.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
          >
            Create Test
          </button>
        </div>
      </div>

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-4">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Tests Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Get started by creating your first reusable research test with structured task criteria.
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0 shadow-lg"
          >
            Create New Test
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tests.map((test) => {
            const totalPoints = test.tasks.reduce((sum, t) => sum + (t.points || 100), 0);
            const totalTimedSeconds = test.tasks.reduce(
              (sum, t) => sum + (t.timeLimitSeconds || 0),
              0
            );

            return (
              <div
                key={test.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all space-y-5"
              >
                <div className="space-y-4">
                  {/* Title & Top Metadata */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-100 tracking-tight leading-snug">
                        {test.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        <span className="font-medium text-slate-300">{test.tasks.length} Tasks</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono tabular-nums text-slate-300">{totalPoints} Total pts</span>
                        {totalTimedSeconds > 0 && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="font-mono tabular-nums text-slate-300">~{totalTimedSeconds}s max</span>
                          </>
                        )}
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>{test.feedbackQuestions?.length || 0} Questions</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartSession(test.id)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-sm whitespace-nowrap"
                    >
                      <Play className="w-4 h-4 fill-current shrink-0" />
                      <span>Start Session</span>
                    </button>
                  </div>

                  {/* Goal */}
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {test.goal}
                  </p>

                  {/* Ordered Tasks Preview */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Task Sequence
                    </span>
                    <div className="space-y-1.5">
                      {test.tasks.slice(0, 4).map((t, idx) => (
                        <div
                          key={t.instanceId || idx}
                          className="flex items-center gap-2.5 text-sm py-1"
                        >
                          <span className="text-slate-500 font-mono text-xs w-5 shrink-0">{idx + 1}.</span>
                          <span className="text-slate-200 font-medium truncate flex-1">{t.name}</span>
                          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 shrink-0">
                            {t.targetScreen}
                          </span>
                        </div>
                      ))}
                      {test.tasks.length > 4 && (
                        <div className="text-xs text-slate-400 font-mono pt-1 pl-7">
                          +{test.tasks.length - 4} more tasks...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Metadata & Management Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-sm">
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {test.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicateTest(test.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Duplicate Test"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(test)}
                      className="p-2 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Test Configuration"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTest(test.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Test Authoring Modal */}
      {editorModalOpen && (
        <TestEditorModal
          key={editingTest ? editingTest.id : 'new-test'}
          isOpen={editorModalOpen}
          initialTest={editingTest}
          onSave={(data) => {
            if (editingTest) {
              updateTest(editingTest.id, data);
            } else {
              addTest(data);
            }
            setEditorModalOpen(false);
            setEditingTest(null);
          }}
          onClose={() => {
            setEditorModalOpen(false);
            setEditingTest(null);
          }}
        />
      )}

      {/* Start Session Modal */}
      {startSessionModalOpen && (
        <StartSessionModal
          key={selectedTestIdForSession || 'start-session'}
          isOpen={startSessionModalOpen}
          initialTestId={selectedTestIdForSession}
          onClose={() => setStartSessionModalOpen(false)}
        />
      )}
    </div>
  );

  function handleDuplicateTest(id: string) {
    duplicateTest(id);
  }
};
