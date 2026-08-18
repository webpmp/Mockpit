import React from 'react';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useMockpitStore } from '../store/useMockpitStore';
import { ComponentInstance, ComponentType } from '../types';
import { DEFAULT_COMPONENT_LABELS } from './ComponentRenderer';
import { getComponentIcon, getComponentColor } from '../config/componentMeta';

interface LayersPanelProps {
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  className = '',
  showHeader = true,
  compact = false,
}) => {
  const activeView = useMockpitStore((s) => s.activeView);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);
  const selectedComponentId = useMockpitStore((s) => s.selectedComponentId);
  const selectComponent = useMockpitStore((s) => s.selectComponent);
  const bringToFront = useMockpitStore((s) => s.bringToFront);
  const sendToBack = useMockpitStore((s) => s.sendToBack);
  const deleteComponent = useMockpitStore((s) => s.deleteComponent);
  const updateComponentZIndex = useMockpitStore((s) => s.updateComponentZIndex);

  const activeComponents: ComponentInstance[] = componentsByScreen[activeView] || [];

  // Sort components by z-index descending (top layer first)
  const sortedComponents = [...activeComponents].sort((a, b) => {
    const zA = a.zIndex ?? (a.type === 'map' ? 0 : 10);
    const zB = b.zIndex ?? (b.type === 'map' ? 0 : 10);
    return zB - zA;
  });

  return (
    <div className={`flex flex-col ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Layers ({activeComponents.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 capitalize">
            {activeView} Screen
          </span>
        </div>
      )}

      {sortedComponents.length === 0 ? (
        <div className="p-6 text-center text-slate-500 flex flex-col items-center">
          <Layers className="w-8 h-8 text-slate-700 mb-2 stroke-1" />
          <p className="text-xs font-semibold text-slate-400">No components on screen</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Drag widgets from the library to build this screen layout.
          </p>
        </div>
      ) : (
        <div className="p-2 space-y-1.5 overflow-y-auto custom-scrollbar">
          {sortedComponents.map((comp) => {
            const isSelected = selectedComponentId === comp.id;
            const Icon = getComponentIcon(comp.type);
            const color = getComponentColor(comp.type, comp.staticProps?.color);
            const label =
              comp.staticProps?.label ||
              DEFAULT_COMPONENT_LABELS[comp.type] ||
              comp.type.toUpperCase();
            const zIndexVal = comp.zIndex ?? (comp.type === 'map' ? 0 : 10);

            return (
              <div
                key={comp.id}
                onClick={() => selectComponent(comp.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-400 ring-1 ring-sky-400/30 shadow-md'
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/70'
                }`}
              >
                {/* Left side: Icon, title, metadata */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 shrink-0"
                    style={{ color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-200 truncate">
                        {label}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700/60 shrink-0">
                        z: {zIndexVal}
                      </span>
                    </div>

                    {!compact && (
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {comp.width}×{comp.height} at ({comp.x}, {comp.y})
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: Actions */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => bringToFront(comp.id)}
                    className="p-1 rounded bg-slate-900/90 text-slate-400 hover:text-sky-400 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                    title="Bring to Front (top layer)"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => sendToBack(comp.id)}
                    className="p-1 rounded bg-slate-900/90 text-slate-400 hover:text-sky-400 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                    title="Send to Back (bottom layer)"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => deleteComponent(comp.id)}
                    className="p-1 rounded bg-slate-900/90 text-rose-400 hover:bg-rose-500 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
                    title="Delete Component"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
