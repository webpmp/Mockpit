import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  X,
  BarChart3,
  Layers,
  FileSpreadsheet,
  Star,
} from 'lucide-react';
import { useUserTestingStore } from '../useUserTestingStore';
import { SessionRecord, AggregateTaskStats } from '../types';
import { SessionDetailModal } from './SessionDetailModal';

export const ResultsDashboard: React.FC = () => {
  const sessions = useUserTestingStore((s) => s.sessions);
  const tests = useUserTestingStore((s) => s.tests);
  const deleteSession = useUserTestingStore((s) => s.deleteSession);
  const saveError = useUserTestingStore((s) => s.saveError);
  const setSaveError = useUserTestingStore((s) => s.setSaveError);

  const [filterTestId, setFilterTestId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'aggregate' | 'feedback'>('sessions');
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<SessionRecord | null>(null);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesTest = filterTestId === 'all' || s.testId === filterTestId;
      const matchesSearch =
        s.participantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTest && matchesSearch;
    });
  }, [sessions, filterTestId, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredSessions.length;
    if (total === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        completionRate: 0,
        avgDurationSeconds: 0,
        avgTotalScore: 0,
      };
    }

    const completed = filteredSessions.filter((s) => s.status === 'completed').length;
    const totalDur = filteredSessions.reduce((sum, s) => sum + s.totalDurationSeconds, 0);
    const totalScore = filteredSessions.reduce((sum, s) => sum + s.totalPoints, 0);

    return {
      totalSessions: total,
      completedSessions: completed,
      completionRate: Math.round((completed / total) * 100),
      avgDurationSeconds: Math.round(totalDur / total),
      avgTotalScore: Math.round(totalScore / total),
    };
  }, [filteredSessions]);

  // Per-Task Aggregate Stats across filtered sessions
  const taskAggregateStats: AggregateTaskStats[] = useMemo(() => {
    const taskMap = new Map<string, {
      name: string;
      attempts: number;
      completed: number;
      timeout: number;
      skipped: number;
      totalDuration: number;
      totalPoints: number;
    }>();

    filteredSessions.forEach((s) => {
      s.taskResults.forEach((t) => {
        const key = t.taskId || t.taskName;
        if (!taskMap.has(key)) {
          taskMap.set(key, {
            name: t.taskName,
            attempts: 0,
            completed: 0,
            timeout: 0,
            skipped: 0,
            totalDuration: 0,
            totalPoints: 0,
          });
        }
        const record = taskMap.get(key)!;
        record.attempts++;
        if (t.status === 'completed') record.completed++;
        else if (t.status === 'timeout') record.timeout++;
        else if (t.status === 'skipped') record.skipped++;
        record.totalDuration += t.durationSeconds;
        record.totalPoints += t.pointsEarned;
      });
    });

    return Array.from(taskMap.entries()).map(([key, data]) => ({
      taskId: key,
      taskName: data.name,
      totalAttempts: data.attempts,
      completedCount: data.completed,
      timeoutCount: data.timeout,
      skippedCount: data.skipped,
      completionRate: data.attempts > 0 ? Math.round((data.completed / data.attempts) * 100) : 0,
      avgDurationSeconds: data.attempts > 0 ? Math.round(data.totalDuration / data.attempts) : 0,
      avgPointsEarned: data.attempts > 0 ? Math.round(data.totalPoints / data.attempts) : 0,
    }));
  }, [filteredSessions]);

  // Export CSV Handler
  const handleExportCsv = () => {
    if (filteredSessions.length === 0) return;

    const headers = [
      'Session ID',
      'Participant ID',
      'Test ID',
      'Test Name',
      'Started At',
      'Ended At',
      'Status',
      'Total Points',
      'Max Points',
      'Total Duration (s)',
      'Completed Tasks',
      'Total Tasks',
    ];

    const rows = filteredSessions.map((s) => [
      `"${s.id}"`,
      `"${s.participantId}"`,
      `"${s.testId}"`,
      `"${s.testName}"`,
      `"${new Date(s.startedAt).toISOString()}"`,
      `"${s.endedAt ? new Date(s.endedAt).toISOString() : ''}"`,
      `"${s.status}"`,
      s.totalPoints,
      s.maxPoints,
      s.totalDurationSeconds,
      s.taskResults.filter((t) => t.status === 'completed').length,
      s.taskResults.length,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mockpit-user-testing-results-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON Handler
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredSessions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mockpit-user-testing-sessions-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {saveError && (
        <div
          id="save-error-banner"
          data-testid="save-error-banner"
          role="alert"
          className="bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl p-4 text-sm flex items-center justify-between gap-3 shadow-lg shadow-amber-500/5 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              The last session could not be saved to this browser. Use Export to keep a copy before reloading.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(false)}
            className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-400 hover:text-amber-200 transition-colors cursor-pointer shrink-0"
            title="Dismiss warning"
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Export Affordances */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Research Results & Reports ({filteredSessions.length})
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Analyze participant task completion metrics, response times, interaction telemetry, and qualitative feedback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredSessions.length === 0}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={filteredSessions.length === 0}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Aggregate Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL SESSIONS
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tabular-nums mt-1.5">
            {metrics.totalSessions}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {metrics.completedSessions} completed
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            COMPLETION RATE
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tabular-nums mt-1.5">
            {metrics.completionRate}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Across active filter
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            AVG SESSION TIME
          </span>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tabular-nums mt-1.5">
            {metrics.avgDurationSeconds}s
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Exact elapsed duration
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            AVG SCORE EARNED
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tabular-nums mt-1.5">
            {metrics.avgTotalScore} pts
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Per participant session
          </span>
        </div>
      </div>

      {/* Filter and Navigation Sub-tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('sessions')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'sessions'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Individual Sessions ({filteredSessions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('aggregate')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'aggregate'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Aggregate Task Performance ({taskAggregateStats.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Test Selector */}
          <select
            value={filterTestId}
            onChange={(e) => setFilterTestId(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Tests</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search participant ID..."
              className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 w-52 sm:w-60"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Sub-Tab 1: Sessions List Table */}
      {activeSubTab === 'sessions' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          {filteredSessions.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-200">No Recorded Sessions</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Launch a research test in Participant Mode to begin capturing session telemetry.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">PARTICIPANT</th>
                    <th className="py-3.5 px-4 font-semibold">TEST</th>
                    <th className="py-3.5 px-4 font-semibold">DATE & TIME</th>
                    <th className="py-3.5 px-4 font-semibold text-right">TASKS PASSED</th>
                    <th className="py-3.5 px-4 font-semibold text-right">DURATION</th>
                    <th className="py-3.5 px-4 font-semibold text-right">SCORE</th>
                    <th className="py-3.5 px-4 font-semibold text-center">STATUS</th>
                    <th className="py-3.5 px-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredSessions.map((session) => {
                    const passedTasks = session.taskResults.filter((t) => t.status === 'completed').length;
                    const totalTasks = session.taskResults.length;

                    return (
                      <tr
                        key={session.id}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedSessionForModal(session)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-400 text-sm">
                          {session.participantId}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200 text-sm">
                          {session.testName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono tabular-nums text-xs">
                          {new Date(session.startedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-sm">
                          <span className={passedTasks === totalTasks ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                            {passedTasks} / {totalTasks}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300 text-sm">
                          {session.totalDurationSeconds}s
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-400 font-bold text-sm">
                          {session.totalPoints} pts
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block text-xs font-mono px-2.5 py-0.5 rounded uppercase font-semibold ${
                              session.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : session.status === 'abandoned'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedSessionForModal(session)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors"
                              title="View Session Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSession(session.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Aggregate Task Performance Table */}
      {activeSubTab === 'aggregate' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          {taskAggregateStats.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-200">No Aggregate Task Data</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Data will populate once tests containing tasks are completed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">TASK</th>
                    <th className="py-3.5 px-4 font-semibold text-right">TOTAL ATTEMPTS</th>
                    <th className="py-3.5 px-4 font-semibold text-right">SUCCESSFUL</th>
                    <th className="py-3.5 px-4 font-semibold text-right">TIMED OUT</th>
                    <th className="py-3.5 px-4 font-semibold text-right">SKIPPED</th>
                    <th className="py-3.5 px-4 font-semibold text-right">COMPLETION RATE</th>
                    <th className="py-3.5 px-4 font-semibold text-right">AVG TIME</th>
                    <th className="py-3.5 px-4 font-semibold text-right">AVG POINTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {taskAggregateStats.map((stat) => (
                    <tr key={stat.taskId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-200 text-sm">
                        {stat.taskName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300 text-sm">
                        {stat.totalAttempts}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-400 text-sm font-semibold">
                        {stat.completedCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-rose-400 text-sm">
                        {stat.timeoutCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-400 text-sm">
                        {stat.skippedCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-200 text-sm font-bold">
                        <span
                          className={`font-bold ${
                            stat.completionRate >= 80
                              ? 'text-emerald-400'
                              : stat.completionRate >= 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {stat.completionRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-sky-400 text-sm">
                        {stat.avgDurationSeconds}s
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-400 text-sm font-bold">
                        {stat.avgPointsEarned} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Session Drilldown Modal */}
      <SessionDetailModal
        session={selectedSessionForModal}
        onClose={() => setSelectedSessionForModal(null)}
      />
    </div>
  );
};
