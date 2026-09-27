import React, { useState } from 'react';
import {
  Lock,
  Shield,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Check,
  AlertCircle,
  Key,
} from 'lucide-react';
import { useUserTestingStore } from '../useUserTestingStore';

export const TestingSettingsView: React.FC = () => {
  const settings = useUserTestingStore((s) => s.settings);
  const updateSettings = useUserTestingStore((s) => s.updateSettings);
  const verifyMasterPassword = useUserTestingStore((s) => s.verifyMasterPassword);
  const setMasterPassword = useUserTestingStore((s) => s.setMasterPassword);
  const clearAllSessions = useUserTestingStore((s) => s.clearAllSessions);
  const resetLibraryToDefaults = useUserTestingStore((s) => s.resetLibraryToDefaults);
  const exportAllTestingData = useUserTestingStore((s) => s.exportAllTestingData);
  const importTestingData = useUserTestingStore((s) => s.importTestingData);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data clear confirmation
  const [confirmClearSessionsOpen, setConfirmClearSessionsOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyMasterPassword(currentPassword)) {
      setPasswordStatus({ type: 'error', message: 'Current password does not match.' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 4 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setMasterPassword(newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStatus({ type: 'success', message: 'Master password updated successfully.' });
  };

  const handleExportData = () => {
    const jsonStr = exportAllTestingData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockpit-user-testing-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importTestingData(content);
        if (ok) {
          setImportStatus({ type: 'success', message: 'Research tests, library, and sessions restored!' });
        } else {
          setImportStatus({ type: 'error', message: 'Invalid JSON file format.' });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Page Header */}
      <div className="pb-5 border-b border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
          User Testing Configuration & Security
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure researcher access permissions, master password protection, and backup/restore data stores.
        </p>
      </div>

      {/* Security Policies */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5 text-slate-100">
          <Shield className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
            Security & Access Restrictions
          </h3>
        </div>

        <div className="space-y-4 pt-1">
          <label className="flex items-start gap-3.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={settings.requirePasswordToExit}
              onChange={(e) => updateSettings({ requirePasswordToExit: e.target.checked })}
              className="mt-1 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
            />
            <div>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-slate-100 block">
                Require Master Password to exit Participant Mode
              </span>
              <span className="text-sm text-slate-400 leading-relaxed block mt-1">
                Prevents test subjects from prematurely leaving the test environment or accessing researcher navigation without supervisor approval.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={settings.requirePasswordToEdit}
              onChange={(e) => updateSettings({ requirePasswordToEdit: e.target.checked })}
              className="mt-1 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
            />
            <div>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-slate-100 block">
                Require Master Password to edit or delete research tests
              </span>
              <span className="text-sm text-slate-400 leading-relaxed block mt-1">
                Locks test and task definitions against accidental modification or deletion.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Change Master Password */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5 text-slate-100">
          <Lock className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
            Master Password
          </h3>
        </div>

        <p className="text-sm text-slate-400">
          Default password is <code className="text-sky-400 font-mono font-semibold">admin</code>. Update this to a secure phrase known only to researchers.
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg pt-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 block">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block">Confirm New</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {passwordStatus && (
            <div
              className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                passwordStatus.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {passwordStatus.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordStatus.message}</span>
            </div>
          )}

          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Backup and Data Maintenance */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-100">
          Data Management & Backup
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Export Full Backup */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-200">Export All Testing Data</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download a JSON backup of all tests, task libraries, and historical session logs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="w-full py-2 px-3.5 rounded-lg text-sm font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap cursor-pointer mt-2 text-center"
            >
              Download JSON Backup
            </button>
          </div>

          {/* Import Backup */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-200">Restore from Backup</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a previously exported JSON backup file to restore tests and results.
              </p>
            </div>
            <label className="w-full py-2 px-3.5 rounded-lg text-sm font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap cursor-pointer mt-2 text-center block">
              <span>Upload Backup File</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {importStatus.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        {/* Danger Zone */}
        <div className="pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-rose-400">Clear Historical Sessions</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently delete all recorded participant results while preserving tests and task definitions.
            </p>
          </div>

          {confirmClearSessionsOpen ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmClearSessionsOpen(false)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllSessions();
                  setConfirmClearSessionsOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-500 text-white hover:bg-rose-400 cursor-pointer shadow-sm whitespace-nowrap shrink-0"
              >
                Yes, Clear All
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClearSessionsOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Clear Sessions
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
