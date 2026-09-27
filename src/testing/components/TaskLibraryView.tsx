import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Sliders,
  Trash2,
  Edit,
  RotateCcw,
  Check,
  FolderPlus,
  BookOpen,
} from 'lucide-react';
import { useUserTestingStore } from '../useUserTestingStore';
import { LibraryTask } from '../types';
import { TaskConfigModal } from './TaskConfigModal';

const CATEGORIES = [
  { id: 'all', label: 'All Tasks' },
  { id: 'driving', label: 'Driving Controls' },
  { id: 'climate', label: 'Climate' },
  { id: 'media', label: 'Media & Audio' },
  { id: 'phone', label: 'Phone & Contacts' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'diagnostics', label: 'Diagnostics' },
];

export const TaskLibraryView: React.FC = () => {
  const taskLibrary = useUserTestingStore((s) => s.taskLibrary);
  const tests = useUserTestingStore((s) => s.tests);
  const addLibraryTask = useUserTestingStore((s) => s.addLibraryTask);
  const updateLibraryTask = useUserTestingStore((s) => s.updateLibraryTask);
  const deleteLibraryTask = useUserTestingStore((s) => s.deleteLibraryTask);
  const resetLibraryToDefaults = useUserTestingStore((s) => s.resetLibraryToDefaults);
  const addTaskToTest = useUserTestingStore((s) => s.addTaskToTest);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LibraryTask | null>(null);

  // Add to Test Quick Menu
  const [targetTestIdForAdd, setTargetTestIdForAdd] = useState<string | null>(null);
  const [activeTaskToAdd, setActiveTaskToAdd] = useState<LibraryTask | null>(null);

  const filteredTasks = taskLibrary.filter((task) => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.targetScreen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(task.targetComponent).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || task.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateNew = () => {
    setEditingTask(null);
    setConfigModalOpen(true);
  };

  const handleEdit = (task: LibraryTask) => {
    setEditingTask(task);
    setConfigModalOpen(true);
  };

  const handleConfirmAddToTest = (testId: string) => {
    if (activeTaskToAdd) {
      addTaskToTest(testId, activeTaskToAdd);
      setActiveTaskToAdd(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search/Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Reusable Task Library ({taskLibrary.length})
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Pre-configured deterministic tasks that evaluate user interaction against live Infotainment components.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetLibraryToDefaults}
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Reset to 13 built-in standard tasks"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
          >
            Create Task
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or screens..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Tasks Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-slate-100 tracking-tight leading-snug">
                  {task.name}
                </h3>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                  {task.points} pts
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                {task.description}
              </p>

              {/* Target Component & Criteria Summary */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-300">
                  <span className="text-slate-400 font-mono font-medium">Screen:</span>
                  <span className="font-semibold text-slate-200">{task.targetScreen}</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-slate-400 font-mono font-medium">Comp:</span>
                  <span className="font-semibold text-slate-200 truncate">{String(task.targetComponent)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono text-sky-400/90 truncate">
                  <span className="text-slate-400 font-medium">Criteria:</span>
                  <span className="truncate text-slate-300">
                    {task.criteria.field || task.criteria.type} {task.criteria.operator || '='} {String(task.criteria.expectedValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                {task.timeLimitSeconds ? (
                  <span className="text-sm font-mono text-slate-400">
                    ⏱ {task.timeLimitSeconds}s limit
                  </span>
                ) : (
                  <span className="text-sm font-mono text-slate-500">
                    Untimed
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTaskToAdd(task)}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  title="Add to a research test"
                >
                  Add to Test
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(task)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Edit task criteria"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {!task.isBuiltin && (
                  <button
                    type="button"
                    onClick={() => deleteLibraryTask(task.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Config Modal */}
      {configModalOpen && (
        <TaskConfigModal
          key={editingTask ? editingTask.id : 'new-library-task'}
          isOpen={configModalOpen}
          initialTask={editingTask || undefined}
          title={editingTask ? 'Edit Library Task' : 'Create Library Task'}
          onSave={(data) => {
            if (editingTask) {
              updateLibraryTask(editingTask.id, data);
            } else {
              addLibraryTask(data);
            }
            setConfigModalOpen(false);
            setEditingTask(null);
          }}
          onClose={() => {
            setConfigModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Quick Add To Test Modal */}
      {activeTaskToAdd && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10010] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 w-full max-w-md space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              Add "{activeTaskToAdd.name}" to Test
            </h3>
            <p className="text-sm text-slate-400">
              Select which research test you would like to append this task to:
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {tests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => handleConfirmAddToTest(test.id)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/40 transition-all flex items-center justify-between text-sm text-slate-200 cursor-pointer group"
                >
                  <span className="font-semibold text-slate-100 group-hover:text-sky-300 truncate text-sm">{test.name}</span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 shrink-0 ml-3">
                    {test.tasks.length} tasks
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTaskToAdd(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
