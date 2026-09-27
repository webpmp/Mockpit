import React from 'react';
import { useUserTestingStore } from '../useUserTestingStore';
import { UserTestingSidebar } from './UserTestingSidebar';
import { TestsView } from './TestsView';
import { TaskLibraryView } from './TaskLibraryView';
import { ResultsDashboard } from './ResultsDashboard';
import { TestingSettingsView } from './TestingSettingsView';

export const UserTestingSuite: React.FC = () => {
  const activeTab = useUserTestingStore((s) => s.activeTab);

  return (
    <div className="w-full h-full flex flex-row bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left Navigation Sidebar */}
      <UserTestingSidebar />

      {/* Main Workspace Body */}
      <main className="flex-1 h-full overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full">
          {activeTab === 'tests' && <TestsView />}
          {activeTab === 'library' && <TaskLibraryView />}
          {activeTab === 'results' && <ResultsDashboard />}
          {activeTab === 'settings' && <TestingSettingsView />}
        </div>
      </main>
    </div>
  );
};
