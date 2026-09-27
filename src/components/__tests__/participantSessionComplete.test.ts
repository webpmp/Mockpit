import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { useUserTestingStore } from '../../testing/useUserTestingStore';
import { useMockpitStore } from '../../store/useMockpitStore';

// Simple in-memory localStorage shim for Node.js test environment
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    },
  };
}

describe('Participant Session-Complete Screen — Spec v1 Suite', () => {
  const componentPath = path.resolve(
    process.cwd(),
    'src/testing/components/ParticipantSessionComplete.tsx'
  );
  const componentContent = fs.readFileSync(componentPath, 'utf-8');

  beforeEach(() => {
    mockStorage['mockpit_user_testing_sessions_v2'] = '[]';
    useUserTestingStore.setState({
      sessions: [],
      activeSession: null,
      pendingCompletedSession: null,
      sessionLocked: false,
      sessionCompleteOpen: false,
      isParticipantMode: false,
      activeTab: 'tests',
    });
    useMockpitStore.getState().setScreenMode('user-testing');
  });

  it('1. Component file structure: no score or points rendered ("pts" string removed)', () => {
    // Confirm no "pts" string anywhere in ParticipantSessionComplete
    assert.doesNotMatch(
      componentContent,
      /\bpts\b/,
      'ParticipantSessionComplete must not render or contain "pts"'
    );
    assert.doesNotMatch(
      componentContent,
      /totalPoints/,
      'ParticipantSessionComplete must not reference totalPoints'
    );
    assert.doesNotMatch(
      componentContent,
      /maxPoints/,
      'ParticipantSessionComplete must not reference maxPoints'
    );

    // Duration is preserved
    assert.match(
      componentContent,
      /Duration:/,
      'ParticipantSessionComplete retains Duration'
    );
  });

  it('2. Header copy matches specification for tests with and without questions', () => {
    // Header title: "Thank you for participating"
    assert.match(
      componentContent,
      /Thank you for participating/,
      'Must contain "Thank you for participating"'
    );

    // Subtitle conditionally renders second sentence
    assert.match(
      componentContent,
      /Your session is complete\. Please answer a few final questions\./,
      'Contains questionnaire copy when questions exist'
    );
    assert.match(
      componentContent,
      /Your session is complete\./,
      'Contains simple complete copy when questions do not exist'
    );
  });

  it('3. Locked screen copy and subtle researcher-only control', () => {
    // Locked message
    assert.match(
      componentContent,
      /You(?:&apos;|')re all set\. Thanks again\./,
      'Contains "You\'re all set. Thanks again."'
    );

    // Researcher-only control
    assert.match(
      componentContent,
      /End session/,
      'Contains subtle "End session" control'
    );

    // MasterPasswordModal usage with correct title and unlockAndViewResults
    assert.match(
      componentContent,
      /title="End Testing Session"/,
      'MasterPasswordModal configured with title "End Testing Session"'
    );
    assert.match(
      componentContent,
      /unlockAndViewResults/,
      'Calls unlockAndViewResults on success'
    );
  });

  it('4. Test with feedback questions: completeCurrentTask opens sessionCompleteOpen without exiting participant mode', () => {
    const tests = useUserTestingStore.getState().tests;
    const testWithQuestions = tests.find((t) => (t.feedbackQuestions?.length || 0) > 0) || tests[0];
    assert.ok(testWithQuestions, 'Test exists');

    // Start session
    const sessionId = useUserTestingStore.getState().startSession(testWithQuestions.id, 'P-001');
    assert.ok(sessionId, 'Session started');
    assert.equal(useUserTestingStore.getState().isParticipantMode, true);
    assert.equal(useUserTestingStore.getState().sessionCompleteOpen, false);
    assert.equal(useUserTestingStore.getState().sessionLocked, false);

    // Switch screenMode to test-drive simulation like in real participant mode
    useMockpitStore.getState().setScreenMode('editor');

    // Complete all tasks
    const taskCount = testWithQuestions.tasks.length;
    for (let i = 0; i < taskCount; i++) {
      useUserTestingStore.getState().completeCurrentTask('completed');
    }

    const stateAfterTasks = useUserTestingStore.getState();
    assert.equal(stateAfterTasks.sessionCompleteOpen, true, 'sessionCompleteOpen is true after last task');
    assert.equal(stateAfterTasks.sessionLocked, false, 'sessionLocked is initially false');
    assert.equal(stateAfterTasks.isParticipantMode, true, 'isParticipantMode remains true');
    assert.notEqual(useMockpitStore.getState().screenMode, 'user-testing', 'screenMode has NOT changed to user-testing');
    assert.notEqual(stateAfterTasks.activeTab, 'results', 'activeTab is NOT yet results');

    // Submit feedback
    useUserTestingStore.getState().submitSessionFeedback([
      { questionId: 'q1', prompt: 'Feedback', type: 'text', value: 'Great experience' },
    ]);

    const stateAfterFeedback = useUserTestingStore.getState();
    assert.equal(stateAfterFeedback.sessionLocked, true, 'sessionLocked is now true');
    assert.equal(stateAfterFeedback.isParticipantMode, true, 'isParticipantMode is still true');
    assert.ok(stateAfterFeedback.pendingCompletedSession, 'pendingCompletedSession is set');
    assert.equal(stateAfterFeedback.pendingCompletedSession?.status, 'completed');
    assert.equal(stateAfterFeedback.sessions.length, 0, 'sessions not persisted yet before master password');

    // Unlock and view results
    useUserTestingStore.getState().unlockAndViewResults();

    const stateAfterUnlock = useUserTestingStore.getState();
    assert.equal(stateAfterUnlock.sessionCompleteOpen, false, 'sessionCompleteOpen closed');
    assert.equal(stateAfterUnlock.sessionLocked, false, 'sessionLocked reset');
    assert.equal(stateAfterUnlock.isParticipantMode, false, 'isParticipantMode is false');
    assert.equal(stateAfterUnlock.activeSession, null, 'activeSession is null');
    assert.equal(stateAfterUnlock.pendingCompletedSession, null, 'pendingCompletedSession is null');
    assert.equal(stateAfterUnlock.activeTab, 'results', 'activeTab is now results');
    assert.equal(useMockpitStore.getState().screenMode, 'user-testing', 'screenMode returned to user-testing');
    assert.equal(stateAfterUnlock.sessions.length, 1, 'session successfully persisted to sessions array');

    const persistedStorage = JSON.parse(mockStorage['mockpit_user_testing_sessions_v2'] || '[]');
    assert.equal(persistedStorage.length, 1, 'session persisted in localStorage');
    assert.equal(persistedStorage[0].status, 'completed');
  });

  it('5. Test with zero feedback questions: follows identical lock/unlock flow', () => {
    // Create a temporary test with 0 feedback questions
    const zeroQTest = useUserTestingStore.getState().addTest({
      name: 'Zero Feedback Questions Test',
      goal: 'Test with no post-test questionnaire',
      tasks: [
        {
          id: 'task-1',
          instanceId: 'inst-1',
          order: 0,
          name: 'Task 1',
          description: 'Do something',
          targetScreen: 'home',
          targetComponent: 'mini-nav',
          criteria: { type: 'screen_navigate', targetScreen: 'home' } as any,
          points: 10,
        },
      ],
      feedbackQuestions: [],
    });

    const sessionId = useUserTestingStore.getState().startSession(zeroQTest.id, 'P-002');
    assert.ok(sessionId);
    useMockpitStore.getState().setScreenMode('editor');

    // Complete the only task
    useUserTestingStore.getState().completeCurrentTask('completed');

    const state = useUserTestingStore.getState();
    assert.equal(state.sessionCompleteOpen, true, 'sessionCompleteOpen is true even with 0 questions');
    assert.equal(state.sessionLocked, false, 'sessionLocked is false');
    assert.equal(state.isParticipantMode, true, 'Participant mode still active');
    assert.notEqual(useMockpitStore.getState().screenMode, 'user-testing', 'Not yet routed to user-testing');

    // Participant taps Finish Session
    useUserTestingStore.getState().submitSessionFeedback([]);
    assert.equal(useUserTestingStore.getState().sessionLocked, true, 'sessionLocked is true');
    assert.equal(useUserTestingStore.getState().isParticipantMode, true, 'Still in participant mode');

    // Researcher enters password and unlocks
    useUserTestingStore.getState().unlockAndViewResults();
    assert.equal(useUserTestingStore.getState().isParticipantMode, false);
    assert.equal(useUserTestingStore.getState().activeTab, 'results');
    assert.equal(useMockpitStore.getState().screenMode, 'user-testing');
  });
});
