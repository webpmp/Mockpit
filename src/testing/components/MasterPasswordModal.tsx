import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { useUserTestingStore } from '../useUserTestingStore';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  title = 'Master Password Required',
  description = 'Please enter the researcher master password to proceed.',
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const verifyMasterPassword = useUserTestingStore((s) => s.verifyMasterPassword);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyMasterPassword(password)) {
      setPassword('');
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 text-slate-100">
            <Lock className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold tracking-tight">{title}</h3>
          </div>
          <button
            onClick={() => {
              setPassword('');
              setError(false);
              onCancel();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 block">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              autoFocus
              placeholder="Enter password..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors font-mono"
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-400 mt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Incorrect master password. Please try again.</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setPassword('');
                setError(false);
                onCancel();
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer shadow-md whitespace-nowrap shrink-0"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
