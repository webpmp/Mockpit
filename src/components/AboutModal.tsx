import React, { useEffect } from 'react';
import { X, ExternalLink, Mail, User, Github } from 'lucide-react';
import { useMockpitStore } from '../store/useMockpitStore';
import { MockpitLogo } from './MockpitLogo';

export const AboutModal: React.FC = () => {
  const isAboutModalOpen = useMockpitStore((s) => s.isAboutModalOpen);
  const setAboutModalOpen = useMockpitStore((s) => s.setAboutModalOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAboutModalOpen) {
        setAboutModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAboutModalOpen, setAboutModalOpen]);

  if (!isAboutModalOpen) return null;

  return (
    <div
      id="mockpit-about-overlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => setAboutModalOpen(false)}
    >
      <div
        id="mockpit-about-card"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-5 animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <MockpitLogo
              width={36}
              height={36}
              className="w-9 h-9 min-w-9 min-h-9 object-contain"
            />
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono tracking-wider uppercase">
                Mockpit
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Automotive HMI Prototyping Tool
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAboutModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close About Modal"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Details */}
        <div className="space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center gap-2.5 text-slate-400">
              <User className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-semibold text-slate-300">Author</span>
            </div>
            <span className="font-bold text-slate-100">Chris Adkins</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center gap-2.5 text-slate-400">
              <Mail className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-semibold text-slate-300">Contact</span>
            </div>
            <a
              href="mailto:webpmp@gmail.com"
              className="font-medium text-sky-400 hover:text-sky-300 hover:underline transition-colors"
            >
              webpmp@gmail.com
            </a>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <div className="flex items-center gap-2.5 text-slate-400">
              <Github className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-semibold text-slate-300">Repository</span>
            </div>
            <a
              href="https://github.com/webpmp/Mockpit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium text-sky-400 hover:text-sky-300 hover:underline transition-colors"
            >
              <span>webpmp/Mockpit</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 font-mono tracking-tight">
            © 2026 Chris Adkins. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
