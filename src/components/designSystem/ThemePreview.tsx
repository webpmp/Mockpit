import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export const ThemePreview: React.FC = () => {
  return (
    <div
      data-testid="theme-preview-root"
      className="ds-scope p-3.5 rounded-xl border border-ds-line bg-ds-surface text-ds-content select-none overflow-hidden space-y-2.5"
    >
      {/* Vehicle speed header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-ds-content-muted tracking-wider">
          VEHICLE
        </span>
        <span className="text-xl font-bold font-mono text-ds-content">
          65 <span className="text-xs font-normal text-ds-content-muted">mph</span>
        </span>
      </div>

      {/* Buttons row: Climate normal, Media selected, Start solid primary */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          data-testid="theme-preview-climate-btn"
          className="flex-1 py-1 px-2 rounded-lg text-xs font-medium border border-ds-line bg-ds-surface-raised text-ds-content hover:bg-ds-surface-hover transition-colors text-center"
        >
          Climate
        </button>
        <button
          type="button"
          data-testid="theme-preview-media-btn"
          className="flex-1 py-1 px-2 rounded-lg text-xs font-medium border border-ds-primary bg-ds-primary/20 text-ds-primary transition-colors text-center"
        >
          Media
        </button>
        <button
          type="button"
          data-testid="theme-preview-start-btn"
          className="flex-1 py-1 px-2 rounded-lg text-xs font-medium bg-ds-primary text-ds-on-primary transition-colors text-center"
        >
          Start
        </button>
      </div>

      {/* Battery indicator */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono text-ds-content-secondary">
          <span>Battery</span>
          <span className="font-bold">82%</span>
        </div>
        <div className="h-1.5 w-full bg-ds-surface-raised rounded-full overflow-hidden border border-ds-line-subtle">
          <div className="h-full bg-ds-primary rounded-full w-[82%]" />
        </div>
      </div>

      {/* Status chips row */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="flex-1 flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border border-ds-warning/40 bg-ds-warning/15 text-ds-warning">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Warning</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border border-ds-error/40 bg-ds-error/15 text-ds-error">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Error</span>
        </div>
      </div>
    </div>
  );
};
