import React from 'react';
import { useUserTestingStore } from '../useUserTestingStore';

export const UserTestingSidebar: React.FC = () => {
  const activeTab = useUserTestingStore((s) => s.activeTab);
  const setActiveTab = useUserTestingStore((s) => s.setActiveTab);
  const tests = useUserTestingStore((s) => s.tests);
  const taskLibrary = useUserTestingStore((s) => s.taskLibrary);
  const sessions = useUserTestingStore((s) => s.sessions);

  return (
    <aside
      className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto custom-scrollbar"
      aria-label="User Testing Navigation Sidebar"
    >
      <div className="p-3 space-y-1.5 flex-1">
        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer border whitespace-nowrap ${
            activeTab === 'tests'
              ? 'bg-slate-800 text-sky-300 border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent'
          }`}
        >
          <span>Tests</span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-full border shrink-0 ${
              activeTab === 'tests'
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
            }`}
          >
            {tests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer border whitespace-nowrap ${
            activeTab === 'library'
              ? 'bg-slate-800 text-sky-300 border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent'
          }`}
        >
          <span>Task Library</span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-full border shrink-0 ${
              activeTab === 'library'
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
            }`}
          >
            {taskLibrary.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer border whitespace-nowrap ${
            activeTab === 'results'
              ? 'bg-slate-800 text-sky-300 border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent'
          }`}
        >
          <span>Results</span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-full border shrink-0 ${
              activeTab === 'results'
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
            }`}
          >
            {sessions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer border whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-sky-300 border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent'
          }`}
        >
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

