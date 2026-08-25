import React, { useState } from 'react';
import { ComponentInstance } from '../../types';
import { useMockpitStore } from '../../store/useMockpitStore';
import { extractScreenReport } from '../../utils/reportExtractors';
import { Check, Loader2 } from 'lucide-react';

interface SendToServiceWidgetProps {
  component: ComponentInstance;
  resolved: Record<string, string>;
  isSelected?: boolean;
  isPresentation?: boolean;
  customColor?: string;
  baseOpacity?: string;
  styleOpacity?: number;
}

export const SendToServiceWidget: React.FC<SendToServiceWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor = '#38bdf8',
  baseOpacity = 'opacity-100',
  styleOpacity = 1,
}) => {
  // Editable text properties with strict respect for user-configured blank fields
  const buttonLabel =
    resolved.buttonLabel !== undefined
      ? resolved.buttonLabel
      : component.staticProps?.buttonLabel !== undefined
      ? component.staticProps.buttonLabel
      : 'Send Vehicle Diagnostics';

  const reportTitle =
    resolved.reportTitle !== undefined
      ? resolved.reportTitle
      : component.staticProps?.reportTitle !== undefined
      ? component.staticProps.reportTitle
      : 'Vehicle Diagnostic Report';

  const confirmLabel =
    resolved.confirmLabel !== undefined
      ? resolved.confirmLabel
      : component.staticProps?.confirmLabel !== undefined
      ? component.staticProps.confirmLabel
      : 'Confirm Send';

  const cancelLabel =
    resolved.cancelLabel !== undefined
      ? resolved.cancelLabel
      : component.staticProps?.cancelLabel !== undefined
      ? component.staticProps.cancelLabel
      : 'Cancel';

  const sendingLabel =
    resolved.sendingLabel !== undefined
      ? resolved.sendingLabel
      : component.staticProps?.sendingLabel !== undefined
      ? component.staticProps.sendingLabel
      : 'Generating & Sending Report...';

  const successLabel =
    resolved.successLabel !== undefined
      ? resolved.successLabel
      : component.staticProps?.successLabel !== undefined
      ? component.staticProps.successLabel
      : 'Report Dispatched & Downloaded';

  const [status, setStatus] = useState<'idle' | 'confirming' | 'sending' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  const handleInitialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'sending') return;
    setStatus('confirming');
  };

  const handleCancelConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatus('idle');
  };

  const handleExecuteSend = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'sending') return;

    setStatus('sending');
    setProgress(15);

    // Get components on the active screen from the store
    const store = useMockpitStore.getState();
    const activeScreenComps = store.components;
    const activeView = store.activeView;

    // Generate real diagnostic report payload
    const reportData = extractScreenReport(activeScreenComps, reportTitle, activeView);

    // Progress animation without pulsing - linear determinate sweep
    const step1 = setTimeout(() => setProgress(45), 250);
    const step2 = setTimeout(() => setProgress(75), 550);
    const step3 = setTimeout(() => {
      setProgress(100);
      setStatus('success');

      // Trigger file download
      try {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(reportData, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        const cleanSlug = reportTitle && reportTitle.trim()
          ? reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          : 'vehicle-diagnostic-report';
        const filename = `${cleanSlug}-${Date.now()}.json`;
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', filename);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } catch (err) {
        console.error('Failed to trigger report download', err);
      }

      // Auto-reset state back to idle after 3.5 seconds
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, 3500);
    }, 900);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  return (
    <div
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-md p-3.5 flex flex-col justify-center items-stretch select-none relative transition-all ${baseOpacity} ${
        isSelected ? 'ring-1 ring-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'shadow-lg'
      }`}
      style={{ opacity: styleOpacity }}
    >
      {status === 'confirming' ? (
        <div
          className="w-full min-h-[44px] flex items-center justify-between gap-2 p-1 bg-slate-800/95 border rounded-xl animate-in fade-in zoom-in-95 duration-150"
          style={{
            borderColor: customColor ? `color-mix(in srgb, ${customColor} 50%, transparent)` : 'var(--color-primary, #38bdf8)',
          }}
        >
          <button
            type="button"
            onClick={handleCancelConfirm}
            className="flex-1 min-h-[36px] px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleExecuteSend}
            className="flex-1 min-h-[36px] px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold text-slate-950 hover:brightness-110 shadow-md transition-all cursor-pointer"
            style={{
              backgroundColor: customColor || 'var(--color-primary, #38bdf8)',
              boxShadow: `0 0 12px color-mix(in srgb, ${customColor || '#38bdf8'} 40%, transparent)`,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInitialClick}
          disabled={status === 'sending'}
          className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-200 flex items-center justify-center relative overflow-hidden cursor-pointer ${
            status === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : status === 'sending'
              ? 'bg-slate-800 text-sky-300 border border-sky-500/40 cursor-wait'
              : 'text-slate-950 shadow-md hover:shadow-lg active:scale-[0.98] hover:brightness-105'
          }`}
          style={
            status === 'idle'
              ? {
                  backgroundColor: customColor || 'var(--color-primary, #38bdf8)',
                  borderColor: customColor || 'var(--color-primary, #38bdf8)',
                  boxShadow: `0 0 15px color-mix(in srgb, ${customColor || '#38bdf8'} 35%, transparent)`,
                }
              : undefined
          }
        >
          {/* Determinate progress fill indicator when sending (No pulse animation) */}
          {status === 'sending' && (
            <div
              className="absolute left-0 top-0 bottom-0 bg-sky-500/25 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          )}

          {/* Button Content */}
          <div className="relative z-10 flex items-center justify-center gap-2">
            {status === 'idle' && (
              <span className="truncate">{buttonLabel}</span>
            )}

            {status === 'sending' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-sky-400" />
                <span className="truncate font-semibold">{sendingLabel}</span>
              </>
            )}

            {status === 'success' && (
              <>
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="truncate font-extrabold text-emerald-300">{successLabel}</span>
              </>
            )}
          </div>
        </button>
      )}

      {/* Sub-label showing configured report title (if blank, leave blank without replacing) */}
      {reportTitle && reportTitle.trim() !== '' && (
        <div className="mt-2 flex items-center text-[10px] font-mono text-slate-400 px-1">
          <div className="flex items-center gap-1 truncate text-slate-400">
            <span className="truncate">{reportTitle}</span>
          </div>
        </div>
      )}
    </div>
  );
};
