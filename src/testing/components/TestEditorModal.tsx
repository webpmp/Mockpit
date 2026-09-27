import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Sliders,
  Check,
  BookOpen,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { TestDefinition, TestTask, FeedbackQuestion, FeedbackQuestionType, LibraryTask } from '../types';
import { useUserTestingStore } from '../useUserTestingStore';
import { TaskConfigModal } from './TaskConfigModal';

interface TestEditorModalProps {
  isOpen: boolean;
  initialTest?: TestDefinition | null;
  onSave: (testData: Omit<TestDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export const TestEditorModal: React.FC<TestEditorModalProps> = ({
  isOpen,
  initialTest,
  onSave,
  onClose,
}) => {
  const taskLibrary = useUserTestingStore((s) => s.taskLibrary);

  const [name, setName] = useState(initialTest?.name || '');
  const [goal, setGoal] = useState(initialTest?.goal || '');
  const [notes, setNotes] = useState(initialTest?.notes || '');
  const [tasks, setTasks] = useState<TestTask[]>(
    initialTest?.tasks ? initialTest.tasks.map((t, idx) => ({ ...t, order: idx })) : []
  );
  const [feedbackQuestions, setFeedbackQuestions] = useState<FeedbackQuestion[]>(
    initialTest?.feedbackQuestions
      ? initialTest.feedbackQuestions.map((q) => ({
          ...q,
          options: q.options ? [...q.options] : undefined,
        }))
      : []
  );

  // Sub-modal states
  const [customTaskModalOpen, setCustomTaskModalOpen] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  // Hydrate local state whenever modal opens or initialTest changes
  useEffect(() => {
    if (isOpen) {
      if (initialTest) {
        setName(initialTest.name || '');
        setGoal(initialTest.goal || '');
        setNotes(initialTest.notes || '');
        setTasks(
          initialTest.tasks
            ? initialTest.tasks.map((t, idx) => ({
                ...JSON.parse(JSON.stringify(t)),
                instanceId: t.instanceId || `inst-${Date.now()}-${idx}`,
                order: typeof t.order === 'number' ? t.order : idx,
              }))
            : []
        );
        setFeedbackQuestions(
          initialTest.feedbackQuestions
            ? initialTest.feedbackQuestions.map((q) => ({
                ...JSON.parse(JSON.stringify(q)),
                options: q.options ? [...q.options] : undefined,
              }))
            : []
        );
      } else {
        setName('');
        setGoal('');
        setNotes('');
        setTasks([]);
        setFeedbackQuestions([]);
      }
      setCustomTaskModalOpen(false);
      setEditingTaskIndex(null);
      setShowLibraryPicker(false);
    }
  }, [isOpen, initialTest]);

  if (!isOpen) return null;

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tasks.length - 1) return;

    const newTasks = [...tasks];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const [moved] = newTasks.splice(index, 1);
    newTasks.splice(targetIdx, 0, moved);
    setTasks(newTasks.map((t, idx) => ({ ...t, order: idx })));
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = tasks.filter((_, idx) => idx !== index);
    setTasks(newTasks.map((t, idx) => ({ ...t, order: idx })));
  };

  const handleDuplicateTask = (index: number) => {
    const source = tasks[index];
    const duplicated: TestTask = {
      ...JSON.parse(JSON.stringify(source)),
      instanceId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${source.name} (Copy)`,
      order: tasks.length,
    };
    setTasks([...tasks, duplicated].map((t, idx) => ({ ...t, order: idx })));
  };

  const handleAddFromLibrary = (libTask: LibraryTask) => {
    const instance: TestTask = {
      ...JSON.parse(JSON.stringify(libTask)),
      instanceId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      libraryTaskId: libTask.id,
      order: tasks.length,
    };
    setTasks([...tasks, instance]);
    setShowLibraryPicker(false);
  };

  const handleSaveCustomTask = (taskData: Omit<LibraryTask, 'id'>) => {
    if (editingTaskIndex !== null) {
      // Editing existing task
      const updated = [...tasks];
      updated[editingTaskIndex] = {
        ...updated[editingTaskIndex],
        ...taskData,
      };
      setTasks(updated);
      setEditingTaskIndex(null);
    } else {
      // Adding new custom task
      const instance: TestTask = {
        ...taskData,
        id: `custom-task-${Date.now()}`,
        instanceId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order: tasks.length,
      };
      setTasks([...tasks, instance]);
    }
    setCustomTaskModalOpen(false);
  };

  // Feedback Questions Helpers
  const handleAddQuestion = (type: FeedbackQuestionType = 'rating') => {
    const newQ: FeedbackQuestion = {
      id: `fq-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      prompt: type === 'rating' ? 'How intuitive was the interface?' : 'Additional feedback:',
      type,
      options: type === 'choice' ? ['Strongly Agree', 'Agree', 'Neutral', 'Disagree'] : undefined,
      required: false,
    };
    setFeedbackQuestions([...feedbackQuestions, newQ]);
  };

  const handleUpdateQuestion = (index: number, partial: Partial<FeedbackQuestion>) => {
    const updated = feedbackQuestions.map((q, idx) => (idx === index ? { ...q, ...partial } : q));
    setFeedbackQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setFeedbackQuestions(feedbackQuestions.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || 'Untitled Test',
      goal: goal.trim() || 'General Usability Assessment',
      notes: notes.trim() || undefined,
      tasks: tasks.map((t, idx) => ({ ...t, order: idx })),
      feedbackQuestions,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl space-y-6 my-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                {initialTest ? 'Edit Research Test' : 'Create New Research Test'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Define the research goal, sequence of deterministic tasks, and final participant feedback questions.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Test Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-slate-300 block">Test Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Infotainment Media & Controls Usability"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-slate-300 block">Research Goal</label>
                <textarea
                  rows={2}
                  required
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Evaluate driver task completion time and mental workload when adjusting media and driving mode."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-slate-300 block">Researcher Notes / Protocol (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Conducted under daytime lighting conditions; participant is seated in driver position."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {/* Ordered Tasks Section */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Ordered Tasks ({tasks.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tasks will be executed by the participant in this exact sequence.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLibraryPicker(true)}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Add from Library
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTaskIndex(null);
                      setCustomTaskModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Create Custom Task
                  </button>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center space-y-3">
                  <p className="text-sm text-slate-400">No tasks added to this test yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowLibraryPicker(true)}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0"
                  >
                    Add First Task from Library
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {tasks.map((task, idx) => (
                    <div
                      key={task.instanceId || `${task.id}-${idx}`}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center text-xs font-mono font-semibold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-200 truncate">{task.name}</span>
                            <span className="text-slate-600 text-xs" aria-hidden="true">·</span>
                            <span className="text-xs font-mono text-slate-400 truncate">
                              Screen: {task.targetScreen}
                            </span>
                            <span className="text-slate-600 text-xs" aria-hidden="true">·</span>
                            <span className="text-xs font-mono text-amber-400">
                              {task.points} pts
                            </span>
                            {task.timeLimitSeconds && (
                              <span className="text-xs font-mono text-slate-400">
                                ({task.timeLimitSeconds}s)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveTask(idx, 'up')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === tasks.length - 1}
                          onClick={() => handleMoveTask(idx, 'down')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateTask(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                          title="Duplicate task"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTaskIndex(idx);
                            setCustomTaskModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 cursor-pointer"
                          title="Edit task criteria"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          title="Remove task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Configurable Final Feedback Questions Section */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Post-Test Feedback Questions ({feedbackQuestions.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Shown to participants immediately upon concluding all tasks.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('rating')}
                    className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    + Rating Scale
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('choice')}
                    className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    + Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('text')}
                    className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    + Open Text
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {feedbackQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5"
                  >
                    <span className="text-xs font-mono text-slate-500 w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      value={q.prompt}
                      onChange={(e) => handleUpdateQuestion(idx, { prompt: e.target.value })}
                      placeholder="Question prompt..."
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                    <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase">
                      {q.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 cursor-pointer"
                      title="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer shadow-md whitespace-nowrap shrink-0"
              >
                Save Test
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Task Config Modal for Creating or Editing Task instance */}
      {customTaskModalOpen && (
        <TaskConfigModal
          key={editingTaskIndex !== null ? `edit-${editingTaskIndex}-${tasks[editingTaskIndex]?.instanceId || editingTaskIndex}` : 'new-custom-task'}
          isOpen={customTaskModalOpen}
          initialTask={editingTaskIndex !== null ? tasks[editingTaskIndex] : undefined}
          title={editingTaskIndex !== null ? 'Edit Task Instance' : 'Create Custom Task'}
          onSave={handleSaveCustomTask}
          onClose={() => {
            setCustomTaskModalOpen(false);
            setEditingTaskIndex(null);
          }}
        />
      )}

      {/* Add from Task Library Picker Drawer / Modal */}
      {showLibraryPicker && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10010] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-100">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold tracking-tight">Select Task from Library</h3>
              </div>
              <button
                onClick={() => setShowLibraryPicker(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {taskLibrary.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleAddFromLibrary(task)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-200 group-hover:text-sky-300">
                        {task.name}
                      </span>
                      <span className="text-slate-600 text-xs" aria-hidden="true">·</span>
                      <span className="text-xs font-mono text-slate-400">
                        {task.targetScreen}
                      </span>
                      <span className="text-slate-600 text-xs" aria-hidden="true">·</span>
                      <span className="text-xs font-mono text-amber-400">
                        {task.points} pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
