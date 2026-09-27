import React, { useEffect } from 'react';
import { useMockpitStore } from './store/useMockpitStore';
import { useUserTestingStore } from './testing/useUserTestingStore';
import { HeaderNav } from './components/HeaderNav';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { DebugStatePanel } from './components/DebugStatePanel';
import { SettingsModal } from './components/SettingsModal';
import { AuditPanel } from './components/hmi/AuditPanel';
import { AboutModal } from './components/AboutModal';
import { UserTestingSuite } from './testing/components/UserTestingSuite';
import { ParticipantHUD } from './testing/components/ParticipantHUD';
import { ParticipantFeedbackModal } from './testing/components/ParticipantFeedbackModal';

export default function App() {
  const screenMode = useMockpitStore((s) => s.screenMode);
  const isParticipantMode = useUserTestingStore((s) => s.isParticipantMode);

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

  // Listen globally for mockpit user action events (User Testing instrumentation)
  useEffect(() => {
    const handleMockpitAction = (e: CustomEvent<any>) => {
      const { action, value } = e.detail || {};
      if (action) {
        useUserTestingStore.getState().recordActionEvent(action, value);
      }
    };
    window.addEventListener('mockpit-action' as any, handleMockpitAction as any);
    return () => {
      window.removeEventListener('mockpit-action' as any, handleMockpitAction as any);
    };
  }, []);

  // Subscribe to mockpit state changes in participant mode to evaluate active task criteria
  useEffect(() => {
    const unsub = useMockpitStore.subscribe(() => {
      if (useUserTestingStore.getState().isParticipantMode) {
        useUserTestingStore.getState().evaluateCurrentTask();
      }
    });
    return unsub;
  }, []);

  // Participant Mode: dedicated unobtrusive HUD, clean Canvas with no editor chrome, no Drive Simulator controls at bottom
  if (isParticipantMode) {
    return (
      <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
        {/* Participant HUD (Sticky Top Banner with Task Instruction, Timer, Progress, Exit) */}
        <ParticipantHUD />

        {/* Full-bleed Canvas Interactive Display */}
        <main className="flex-1 flex overflow-hidden relative pt-12">
          <div className="flex-1 h-full overflow-hidden relative">
            <Canvas />
          </div>
        </main>

        {/* Participant Post-Test Feedback Questionnaire Modal */}
        <ParticipantFeedbackModal />
      </div>
    );
  }

  // Researcher Workspace Modes (Editor, Presenter, Auditor, User Testing)
  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Header Bar */}
      <HeaderNav />

      {/* Main Workspace */}
      <div className={`flex-1 flex overflow-hidden relative ${screenMode === 'user-testing' ? '' : 'pb-[42px]'}`}>
        {screenMode === 'user-testing' ? (
          <UserTestingSuite />
        ) : screenMode === 'audit' ? (
          <AuditPanel />
        ) : (
          <>
            {/* Left Component Library Sidebar (Editor Mode) */}
            {screenMode === 'editor' && <Sidebar />}

            {/* Center Infotainment Display Canvas */}
            <div className="flex-1 h-full overflow-hidden relative">
              <Canvas />
            </div>

            {/* Right Inspector Panel (Editor Mode) */}
            {screenMode === 'editor' && <Inspector />}
          </>
        )}
      </div>

      {/* Toggle-able Vehicle State Debug Panel (Only in Editor & Presenter) */}
      {screenMode !== 'audit' && screenMode !== 'user-testing' && <DebugStatePanel />}

      {/* System Settings & Palette Modal */}
      <SettingsModal />

      {/* About Mockpit Modal */}
      <AboutModal />
    </div>
  );
}
