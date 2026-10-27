import React, { useState, useRef } from 'react';
import { useMockpitStore } from '../store/useMockpitStore';
import {
  validateWorkspaceConfiguration,
  downloadConfigurationFile,
  generateConfigFilename,
  MockpitConfiguration,
} from '../utils/configManagement';
import {
  Download,
  Upload,
  RotateCcw,
  X,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Layers,
  FileText,
} from 'lucide-react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveConfigModal: React.FC<SaveModalProps> = ({ isOpen, onClose }) => {
  const screens = useMockpitStore((s) => s.screens);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);
  const notificationComponents = useMockpitStore((s) => s.notificationComponents);
  const exportConfig = useMockpitStore((s) => s.exportWorkspaceConfiguration);

  const [configName, setConfigName] = useState('Mockpit Workspace');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const totalComps = Object.values(componentsByScreen).reduce((acc, l) => acc + l.length, 0) + notificationComponents.length;
  const filenamePreview = generateConfigFilename(configName);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config = exportConfig(configName);
    downloadConfigurationFile(config, configName);
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div
      id="save-config-modal-overlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="save-config-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-5 animate-in zoom-in-95 duration-150 text-slate-100 font-mono"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sky-400">
            <Download className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Save Configuration</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Configuration Name</label>
            <input
              id="save-config-name-input"
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="e.g. My Custom Infotainment"
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Screens:
              </span>
              <span className="font-bold text-slate-200">{screens.length}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Components:
              </span>
              <span className="font-bold text-slate-200">{totalComps}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>File export:</span>
              <span className="text-sky-300 truncate max-w-[220px]" title={filenamePreview}>
                {filenamePreview}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-config-submit-button"
              type="submit"
              disabled={downloadSuccess}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoadConfigModal: React.FC<LoadModalProps> = ({ isOpen, onClose }) => {
  const screens = useMockpitStore((s) => s.screens);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);
  const notificationComponents = useMockpitStore((s) => s.notificationComponents);
  const loadWorkspaceConfig = useMockpitStore((s) => s.loadWorkspaceConfiguration);
  const loadExampleWorkspace = useMockpitStore((s) => s.loadBundledExampleConfiguration);

  const [parsedConfig, setParsedConfig] = useState<MockpitConfiguration | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [pendingLoadType, setPendingLoadType] = useState<'parsed' | 'example' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentWorkspaceTotalComps = Object.values(componentsByScreen).reduce((acc, l) => acc + l.length, 0) + notificationComponents.length;
  const isWorkspaceDirty = screens.length > 0 || currentWorkspaceTotalComps > 0;

  const handleFileProcess = (file: File) => {
    setErrorMessage(null);
    setParsedConfig(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          setErrorMessage('Unable to read configuration file.');
          return;
        }
        const json = JSON.parse(text);
        const result = validateWorkspaceConfiguration(json);
        if (!result.valid || !result.config) {
          setErrorMessage(result.error || 'Invalid configuration file structure.');
          return;
        }
        setParsedConfig(result.config);
      } catch (err: any) {
        setErrorMessage(`JSON parsing failed: ${err.message || 'Invalid JSON syntax'}`);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read configuration file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const executeLoad = (config: MockpitConfiguration) => {
    loadWorkspaceConfig(config);
    onClose();
  };

  const handleConfirmLoad = () => {
    if (!parsedConfig) return;
    if (isWorkspaceDirty && !showOverwriteWarning) {
      setShowOverwriteWarning(true);
      setPendingLoadType('parsed');
      return;
    }
    executeLoad(parsedConfig);
  };

  const handleLoadExample = () => {
    if (isWorkspaceDirty && !showOverwriteWarning) {
      setShowOverwriteWarning(true);
      setPendingLoadType('example');
      return;
    }
    loadExampleWorkspace();
    onClose();
  };

  const handleConfirmOverwrite = () => {
    if (pendingLoadType === 'parsed' && parsedConfig) {
      executeLoad(parsedConfig);
    } else if (pendingLoadType === 'example') {
      loadExampleWorkspace();
      onClose();
    }
  };

  return (
    <div
      id="load-config-modal-overlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="load-config-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-5 animate-in zoom-in-95 duration-150 text-slate-100 font-mono"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Upload className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Load Configuration</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showOverwriteWarning ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              <div className="space-y-1">
                <p className="font-bold">Replace Current Workspace?</p>
                <p className="text-slate-300">
                  Loading a configuration will completely replace all {screens.length} screen(s) and {currentWorkspaceTotalComps} component(s) in your current workspace. Unsaved work will be overwritten.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowOverwriteWarning(false);
                  setPendingLoadType(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                id="confirm-overwrite-load-button"
                type="button"
                onClick={handleConfirmOverwrite}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Replace Workspace</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Dropzone */}
            <div
              id="config-dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                isDragOver
                  ? 'border-sky-400 bg-sky-500/10'
                  : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 hover:bg-slate-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <FileJson className="w-8 h-8 text-sky-400" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-200">
                  Drop a Mockpit JSON configuration file here
                </p>
                <p className="text-[11px] text-slate-400">or click to browse from your computer</p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div id="load-config-error" className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-0.5">
                  <p className="font-bold">Validation Error</p>
                  <p className="text-[11px] text-rose-200">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Valid Parsed Config Preview */}
            {parsedConfig && (
              <div id="load-config-preview" className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valid Configuration Ready to Load</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400">Name: </span>
                    <span className="font-bold text-slate-100">{parsedConfig.metadata.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Screens: </span>
                    <span className="font-bold text-slate-100">{parsedConfig.workspace.screens.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Components: </span>
                    <span className="font-bold text-slate-100">{parsedConfig.metadata.componentCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Version: </span>
                    <span className="font-bold text-slate-100">v{parsedConfig.version}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bundled Example Quick Load Option */}
            <div className="pt-2 border-t border-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">Bundled Example Configuration</p>
                    <p className="text-[10px] text-slate-400">Explore complete vehicle dashboard with 8 screens & seed widgets</p>
                  </div>
                </div>
                <button
                  id="load-bundled-example-button"
                  type="button"
                  onClick={handleLoadExample}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  Load Example
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="load-config-submit-button"
                type="button"
                disabled={!parsedConfig}
                onClick={handleConfirmLoad}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Load Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetWorkspaceModal: React.FC<ResetModalProps> = ({ isOpen, onClose }) => {
  const resetToBlank = useMockpitStore((s) => s.resetToBlankWorkspace);
  const screens = useMockpitStore((s) => s.screens);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);
  const notificationComponents = useMockpitStore((s) => s.notificationComponents);

  if (!isOpen) return null;

  const totalComps = Object.values(componentsByScreen).reduce((acc, l) => acc + l.length, 0) + notificationComponents.length;

  const handleConfirmReset = () => {
    resetToBlank();
    onClose();
  };

  return (
    <div
      id="reset-workspace-modal-overlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="reset-workspace-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4 animate-in zoom-in-95 duration-150 text-slate-100 font-mono"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400">
            <RotateCcw className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Reset Workspace</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-slate-200">
            Are you sure you want to reset to a blank workspace?
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            This will clear all {screens.length} screen(s), {totalComps} component(s), and custom layouts. The canvas will return to an empty starting state.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-reset-workspace-button"
            type="button"
            onClick={handleConfirmReset}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirm Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
