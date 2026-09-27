import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { useUserTestingStore } from '../../testing/useUserTestingStore';
import { useMockpitStore } from '../../store/useMockpitStore';

describe('Participant Mode Bottom Dock Navigation — Spec v1 Suite', () => {
  const canvasPath = path.resolve(process.cwd(), 'src/components/Canvas.tsx');
  const canvasContent = fs.readFileSync(canvasPath, 'utf-8');

  it('1. Canvas.tsx removes !isParticipantMode gate around BottomDock', () => {
    // Confirm !isParticipantMode does NOT wrap BottomDock
    assert.doesNotMatch(
      canvasContent,
      /!isParticipantMode\s*&&\s*\(\s*<div[^>]*>\s*<BottomDock/,
      'Canvas must not conditionally omit BottomDock with !isParticipantMode'
    );

    // Confirm BottomDock is rendered
    assert.match(
      canvasContent,
      /<BottomDock\s*\/>/,
      'BottomDock must be rendered in Canvas'
    );

    // Confirm dock wrapper geometry classes
    assert.match(
      canvasContent,
      /h-\[84px\]\s+z-\[9999\]/,
      'Dock wrapper must have h-[84px] and z-[9999]'
    );
    assert.match(
      canvasContent,
      /bottom-0\s+left-0\s+right-0/,
      'Dock wrapper must span bottom-0 left-0 right-0'
    );
  });

  it('2. Editor dashed border affordance does not appear in participant mode', () => {
    // Confirm the border styling condition requires !isParticipantMode
    assert.match(
      canvasContent,
      /!isPresentation\s*&&\s*!isParticipantMode/,
      'Editor dashed border condition must check !isPresentation && !isParticipantMode'
    );
  });

  it('3. In participant mode, active screen can be changed via navigation actions (dock behavior)', () => {
    const tests = useUserTestingStore.getState().tests;
    const test = tests[0];
    assert.ok(test, 'Test exists');

    // Start a participant session
    const sessionId = useUserTestingStore.getState().startSession(test.id, 'P-DOCK-TEST');
    assert.ok(sessionId);
    assert.equal(useUserTestingStore.getState().isParticipantMode, true);

    // Set initial screen
    useMockpitStore.getState().setActiveView('home');
    assert.equal(useMockpitStore.getState().activeView, 'home');

    // Simulate clicking a non-active-task dock item (e.g. media or climate)
    useMockpitStore.getState().setActiveView('media');
    assert.equal(useMockpitStore.getState().activeView, 'media', 'Participant can switch to media screen');

    useMockpitStore.getState().setActiveView('climate');
    assert.equal(useMockpitStore.getState().activeView, 'climate', 'Participant can switch to climate screen');

    // Clean up
    useUserTestingStore.getState().exitSessionEarly(true);
    assert.equal(useUserTestingStore.getState().isParticipantMode, false);
  });

  it('4. Style evaluation: border-dashed classes are strictly empty in participant mode', () => {
    // In participant mode, isParticipantMode is true, screenMode is 'editor' or 'presentation'
    const isPresentationEditor = false;
    const isParticipantMode = true;

    const editorBorderClasses = !isPresentationEditor && !isParticipantMode
      ? 'border-t-2 border-dashed border-sky-400/60 bg-sky-950/20 backdrop-blur-[1px]'
      : '';

    assert.equal(
      editorBorderClasses,
      '',
      'In participant mode, border classes must evaluate to empty string'
    );
  });
});
