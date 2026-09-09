import React, { useEffect } from 'react';
import { useMockpitStore } from './store/useMockpitStore';
import { HeaderNav } from './components/HeaderNav';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { DebugStatePanel } from './components/DebugStatePanel';
import { SettingsModal } from './components/SettingsModal';
import { AuditPanel } from './components/hmi/AuditPanel';
import { AboutModal } from './components/AboutModal';

export default function App() {
  const screenMode = useMockpitStore((s) => s.screenMode);
  const isPresentation = screenMode === 'presentation';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard shortcuts if focused in an editable element
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable) {
          return;
        }
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const keyLower = e.key ? e.key.toLowerCase() : '';
      const isCopy = isCmdOrCtrl && (keyLower === 'c' || e.code === 'KeyC');
      const isPaste = isCmdOrCtrl && (keyLower === 'v' || e.code === 'KeyV');

      if (isCopy) {
        const selectedId = useMockpitStore.getState().selectedComponentId;
        if (selectedId) {
          e.preventDefault();
          useMockpitStore.getState().copyComponent(selectedId);
        }
      } else if (isPaste) {
        const copied = useMockpitStore.getState().copiedComponent;
        if (copied) {
          e.preventDefault();
          useMockpitStore.getState().pasteComponent();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen globally for inbound message simulation events
  useEffect(() => {
    const handleInboundEvent = (e: CustomEvent<any>) => {
      const { threadId, text } = e.detail || {};
      if (threadId && text) {
        useMockpitStore.getState().sendInboundMessage(threadId, text);
      }
    };
    window.addEventListener('mockpit-inbound-message' as any, handleInboundEvent as any);
    return () => {
      window.removeEventListener('mockpit-inbound-message' as any, handleInboundEvent as any);
    };
  }, []);

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Header Bar */}
      <HeaderNav />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative pb-[42px]">
        {/* Left Component Library Sidebar (Editor Mode) */}
        {!isPresentation && <Sidebar />}

        {/* Center Infotainment Display Canvas */}
        <div className="flex-1 h-full overflow-hidden relative">
          <Canvas />
        </div>

        {/* Right Inspector Panel (Editor Mode) */}
        {!isPresentation && <Inspector />}
      </div>

      {/* Toggle-able Vehicle State Debug Panel */}
      <DebugStatePanel />

      {/* System Settings & Palette Modal */}
      <SettingsModal />

      {/* Automotive HMI Compliance & Safety Audit Panel */}
      <AuditPanel />

      {/* About Mockpit Modal */}
      <AboutModal />
    </div>
  );
}
