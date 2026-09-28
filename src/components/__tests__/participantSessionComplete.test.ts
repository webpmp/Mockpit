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

  const resultsDashboardPath = path.resolve(
    process.cwd(),
    'src/testing/components/ResultsDashboard.tsx'
  );
  const resultsDashboardContent = fs.readFileSync(resultsDashboardPath, 'utf-8');

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

    // Duration is removed from participant-facing modal
    assert.doesNotMatch(
      componentContent,
      /Duration:/,
      'ParticipantSessionComplete must not display "Duration:"'
    );
    assert.doesNotMatch(
      componentContent,
      /totalDurationSeconds/,
      'ParticipantSessionComplete must not reference totalDurationSeconds'
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
    // Spec v1.2: Provisional session persisted immediately upon completing the final task
    assert.equal(stateAfterTasks.sessions.length, 1, 'provisional session persisted before password gate');
    assert.deepEqual(stateAfterTasks.sessions[0].feedbackAnswers, [], 'feedbackAnswers initially empty');

    // Submit feedback
    useUserTestingStore.getState().submitSessionFeedback([
      { questionId: 'q1', prompt: 'Feedback', type: 'text', value: 'Great experience' },
    ]);

    const stateAfterFeedback = useUserTestingStore.getState();
    assert.equal(stateAfterFeedback.sessionLocked, true, 'sessionLocked is now true');
    assert.equal(stateAfterFeedback.isParticipantMode, true, 'isParticipantMode is still true');
    assert.ok(stateAfterFeedback.pendingCompletedSession, 'pendingCompletedSession is set');
    assert.equal(stateAfterFeedback.pendingCompletedSession?.status, 'completed');
    // Spec v1.2: Persisted session updated with submitted feedback answers
    assert.equal(stateAfterFeedback.sessions.length, 1, 'session record count remains 1');
    assert.equal(stateAfterFeedback.sessions[0].feedbackAnswers[0]?.value, 'Great experience');

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
    assert.equal(stateAfterUnlock.sessions.length, 1, 'session successfully persisted to sessions array and not duplicated');

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
    assert.equal(state.sessions.length, 1, 'provisional session persisted before password gate for 0-question test');
    assert.deepEqual(state.sessions[0].feedbackAnswers, [], 'feedbackAnswers initially empty array');

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

  it('6. Spec v1.1 Guard: evaluateCurrentTask and completeCurrentTask return early when sessionCompleteOpen or sessionLocked is true', () => {
    const singleTaskTest = useUserTestingStore.getState().addTest({
      name: 'Single Task Test',
      goal: 'Guard check test',
      tasks: [
        {
          id: 'task-guard-1',
          instanceId: 'inst-guard-1',
          order: 0,
          name: 'Reach 65 MPH',
          description: 'Drive at 65 MPH or faster',
          targetScreen: 'cluster',
          targetComponent: 'speedometer',
          criteria: {
            type: 'state_field',
            field: 'speed',
            operator: '>=',
            expectedValue: 65,
          } as any,
          points: 150,
        },
      ],
      feedbackQuestions: [
        { id: 'q1', prompt: 'Feedback prompt', type: 'text' },
      ],
    });

    useUserTestingStore.getState().startSession(singleTaskTest.id, 'P-GUARD-01');
    useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 70 });
    const completed = useUserTestingStore.getState().evaluateCurrentTask();
    assert.equal(completed, true);

    // Initial state: task completed once
    const state1 = useUserTestingStore.getState();
    assert.equal(state1.activeSession?.taskResults.length, 1);
    assert.equal(state1.activeSession?.totalPoints, 150);
    assert.equal(state1.sessionCompleteOpen, true);
    assert.equal(state1.sessionLocked, false);

    // Calling evaluateCurrentTask directly while sessionCompleteOpen must return false and not re-complete
    const evalResult1 = useUserTestingStore.getState().evaluateCurrentTask();
    assert.equal(evalResult1, false, 'evaluateCurrentTask returns false when sessionCompleteOpen is true');
    assert.equal(useUserTestingStore.getState().activeSession?.taskResults.length, 1);
    assert.equal(useUserTestingStore.getState().activeSession?.totalPoints, 150);

    // Calling completeCurrentTask directly while sessionCompleteOpen must return early
    useUserTestingStore.getState().completeCurrentTask('completed');
    assert.equal(useUserTestingStore.getState().activeSession?.taskResults.length, 1);
    assert.equal(useUserTestingStore.getState().activeSession?.totalPoints, 150);

    // Lock session
    useUserTestingStore.getState().submitSessionFeedback([]);
    assert.equal(useUserTestingStore.getState().sessionLocked, true);

    // While sessionLocked is true, evaluateCurrentTask and completeCurrentTask must also return early
    const evalResult2 = useUserTestingStore.getState().evaluateCurrentTask();
    assert.equal(evalResult2, false, 'evaluateCurrentTask returns false when sessionLocked is true');
    useUserTestingStore.getState().completeCurrentTask('completed');
    assert.equal(useUserTestingStore.getState().activeSession?.taskResults.length, 1);
    assert.equal(useUserTestingStore.getState().activeSession?.totalPoints, 150);
  });

  it('7. Spec v1.1 Guard: persistent criteria and Mockpit state changes during session-complete do not duplicate task results', () => {
    // Reset vehicle to Park at 0 speed before starting test
    useMockpitStore.getState().setVehicleState({ gear: 'P', speed: 0 });

    // Wire subscription manually as done in browser environment
    const unsub = useMockpitStore.subscribe(() => {
      const testingStore = useUserTestingStore.getState();
      if (
        testingStore.isParticipantMode &&
        testingStore.activeSession &&
        !testingStore.sessionCompleteOpen &&
        !testingStore.sessionLocked
      ) {
        testingStore.evaluateCurrentTask();
      }
    });

    try {
      const singleTaskTest = useUserTestingStore.getState().addTest({
        name: 'Persistent Criteria Speed Test',
        goal: 'Verify persistent speed criterion does not trigger duplicate completion',
        tasks: [
          {
            id: 'task-speed-persist',
            instanceId: 'inst-speed-persist',
            order: 0,
            name: 'Maintain High Speed',
            description: 'Drive fast',
            targetScreen: 'cluster',
            targetComponent: 'speedometer',
            criteria: {
              type: 'state_field',
              field: 'speed',
              operator: '>=',
              expectedValue: 65,
            } as any,
            points: 100,
          },
        ],
        feedbackQuestions: [
          { id: 'q1', prompt: 'Comments', type: 'text' },
        ],
      });

      useUserTestingStore.getState().startSession(singleTaskTest.id, 'P-GUARD-02');
      
      // Satisfy criterion via store mutation (triggers subscription)
      useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 75 });

      const afterFirstComplete = useUserTestingStore.getState();
      assert.equal(afterFirstComplete.sessionCompleteOpen, true);
      assert.equal(afterFirstComplete.activeSession?.taskResults.length, 1);
      assert.equal(afterFirstComplete.activeSession?.totalPoints, 100);

      // Simulate multiple Mockpit state changes while on questionnaire
      useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 80 });
      useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 85 });
      useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 90 });

      const afterSpeedChanges = useUserTestingStore.getState();
      assert.equal(afterSpeedChanges.activeSession?.taskResults.length, 1, 'Still exactly 1 TaskResult');
      assert.equal(afterSpeedChanges.activeSession?.totalPoints, 100, 'Points remained 100');

      // Submit feedback
      useUserTestingStore.getState().submitSessionFeedback([{ questionId: 'q1', prompt: 'Comments', type: 'text', value: 'Smooth' }]);
      assert.equal(useUserTestingStore.getState().sessionLocked, true);

      // Simulate more Mockpit changes while locked
      useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 95 });
      useMockpitStore.getState().setVehicleState({ gear: 'D', speed: 100 });

      const afterLockedChanges = useUserTestingStore.getState();
      assert.equal(afterLockedChanges.activeSession?.taskResults.length, 1, 'Still exactly 1 TaskResult');
      assert.equal(afterLockedChanges.activeSession?.totalPoints, 100, 'Points remained 100');
      assert.equal(afterLockedChanges.pendingCompletedSession?.taskResults.length, 1);
      assert.equal(afterLockedChanges.pendingCompletedSession?.totalPoints, 100);
    } finally {
      unsub();
    }
  });

  it('8. Spec v1.1 Guard: double-tap submitSessionFeedback returns early if sessionLocked is already true', () => {
    const test = useUserTestingStore.getState().tests[0];
    useUserTestingStore.getState().startSession(test.id, 'P-DOUBLE-TAP');
    
    // Complete tasks
    for (let i = 0; i < test.tasks.length; i++) {
      useUserTestingStore.getState().completeCurrentTask('completed');
    }

    assert.equal(useUserTestingStore.getState().sessionCompleteOpen, true);
    assert.equal(useUserTestingStore.getState().sessionLocked, false);

    // First submit
    useUserTestingStore.getState().submitSessionFeedback([{ questionId: 'q1', prompt: 'P', type: 'text', value: 'First' }]);
    assert.equal(useUserTestingStore.getState().sessionLocked, true);
    const stagedSession = useUserTestingStore.getState().pendingCompletedSession;
    assert.ok(stagedSession);
    assert.equal(stagedSession?.feedbackAnswers[0]?.value, 'First');

    // Second submit (double tap simulation) with different answers
    useUserTestingStore.getState().submitSessionFeedback([{ questionId: 'q1', prompt: 'P', type: 'text', value: 'Second' }]);
    
    // Confirm it was ignored: sessionLocked remains true and pendingCompletedSession is unchanged
    assert.equal(useUserTestingStore.getState().sessionLocked, true);
    assert.equal(
      useUserTestingStore.getState().pendingCompletedSession?.feedbackAnswers[0]?.value,
      'First',
      'Double tap did not overwrite or re-stage pendingCompletedSession'
    );
  });

  it('9. Spec v1.2: upsertSession helper updates matching id in place and prepends when new', () => {
    const session1: any = {
      id: 'SES-001',
      participantId: 'P-1',
      status: 'completed',
      totalPoints: 100,
      feedbackAnswers: [],
    };
    const session2: any = {
      id: 'SES-002',
      participantId: 'P-2',
      status: 'completed',
      totalPoints: 200,
      feedbackAnswers: [],
    };

    // First insert
    const res1 = useUserTestingStore.getState().upsertSession(session1);
    assert.equal(res1, true);
    assert.equal(useUserTestingStore.getState().sessions.length, 1);
    assert.equal(useUserTestingStore.getState().sessions[0].id, 'SES-001');

    // Prepend second
    const res2 = useUserTestingStore.getState().upsertSession(session2);
    assert.equal(res2, true);
    assert.equal(useUserTestingStore.getState().sessions.length, 2);
    assert.equal(useUserTestingStore.getState().sessions[0].id, 'SES-002');

    // Update existing session1 with feedback
    const session1Updated: any = {
      ...session1,
      totalPoints: 150,
      feedbackAnswers: [{ questionId: 'q1', value: 'Answer' }],
    };
    const res3 = useUserTestingStore.getState().upsertSession(session1Updated);
    assert.equal(res3, true);
    assert.equal(useUserTestingStore.getState().sessions.length, 2, 'Does not duplicate entry');
    const found = useUserTestingStore.getState().sessions.find((s) => s.id === 'SES-001');
    assert.equal(found?.totalPoints, 150);
    assert.equal(found?.feedbackAnswers.length, 1);
  });

  it('10. Spec v1.3: ParticipantSessionComplete does NOT contain save-error-banner or saveError; warning belongs on Researcher Results', () => {
    // Confirm no save-error-banner in ParticipantSessionComplete
    assert.doesNotMatch(
      componentContent,
      /id="save-error-banner"/,
      'ParticipantSessionComplete must not render #save-error-banner'
    );
    assert.doesNotMatch(
      componentContent,
      /\bsaveError\b/,
      'ParticipantSessionComplete must not subscribe to saveError'
    );
    assert.doesNotMatch(
      componentContent,
      /Session Save Error/,
      'ParticipantSessionComplete must not contain "Session Save Error" copy'
    );
  });

  it('11. Spec v1.3: ResultsDashboard renders #save-error-banner with amber styling and Export text when saveError is true', () => {
    assert.match(
      resultsDashboardContent,
      /id="save-error-banner"/,
      'ResultsDashboard must render #save-error-banner'
    );
    assert.match(
      resultsDashboardContent,
      /role="alert"/,
      'save-error banner has role="alert"'
    );
    assert.match(
      resultsDashboardContent,
      /The last session could not be saved to this browser\. Use Export to keep a copy before reloading\./,
      'save-error banner has exact requested warning copy'
    );
    assert.match(
      resultsDashboardContent,
      /amber/,
      'save-error banner is styled with amber researcher theme'
    );
    assert.match(
      resultsDashboardContent,
      /setSaveError\(false\)/,
      'save-error banner has dismiss button that calls setSaveError(false)'
    );
  });

  it('12. Spec v1.3: Stub localStorage.setItem to throw; verify saveError persists across unlockAndViewResults and exitSessionEarly until dismissed', () => {
    const originalSetItem = globalThis.localStorage.setItem;
    const originalConsoleError = console.error;
    let consoleErrorFired = false;
    let loggedErrorArgs: any[] = [];

    console.error = (...args: any[]) => {
      consoleErrorFired = true;
      loggedErrorArgs = args;
    };

    try {
      // Stub localStorage.setItem to throw an error
      (globalThis.localStorage as any).setItem = () => {
        throw new Error('QuotaExceededError: DOM Exception 22');
      };

      const testSession: any = {
        id: 'SES-FAIL-01',
        participantId: 'P-FAIL',
        status: 'completed',
        totalPoints: 50,
        feedbackAnswers: [],
      };

      // Call upsertSession which attempts localStorage write
      const writeSuccess = useUserTestingStore.getState().upsertSession(testSession);
      assert.equal(writeSuccess, false, 'upsertSession returns false on failure');
      assert.equal(consoleErrorFired, true, 'console.error fired when setItem threw');
      assert.match(
        String(loggedErrorArgs[0] || ''),
        /localStorage/i,
        'Console error message mentions localStorage'
      );
      assert.equal(useUserTestingStore.getState().saveError, true, 'saveError store state is true');

      // Spec v1.3: unlockAndViewResults MUST NOT clear saveError
      useUserTestingStore.getState().unlockAndViewResults();
      assert.equal(
        useUserTestingStore.getState().saveError,
        true,
        'saveError is retained when researcher unlocks and navigates to Results'
      );
      assert.equal(useUserTestingStore.getState().activeTab, 'results');

      // Dismiss button clears saveError
      useUserTestingStore.getState().setSaveError(false);
      assert.equal(
        useUserTestingStore.getState().saveError,
        false,
        'setSaveError(false) dismisses the warning'
      );

      // Re-trigger saveError and test exitSessionEarly
      useUserTestingStore.getState().upsertSession(testSession);
      assert.equal(useUserTestingStore.getState().saveError, true);
      useUserTestingStore.getState().exitSessionEarly();
      assert.equal(
        useUserTestingStore.getState().saveError,
        true,
        'saveError is retained when researcher exits session early to Results'
      );
    } finally {
      (globalThis.localStorage as any).setItem = originalSetItem;
      console.error = originalConsoleError;
      useUserTestingStore.setState({ saveError: false });
    }
  });

  it('13. Spec v1.3: Successful session write and startSession clear saveError', () => {
    // Manually set saveError to true
    useUserTestingStore.setState({ saveError: true });
    assert.equal(useUserTestingStore.getState().saveError, true);

    // Successful upsert clears saveError
    const validSession: any = {
      id: 'SES-OK-01',
      participantId: 'P-OK',
      status: 'completed',
      totalPoints: 100,
      feedbackAnswers: [],
    };
    const ok = useUserTestingStore.getState().upsertSession(validSession);
    assert.equal(ok, true);
    assert.equal(useUserTestingStore.getState().saveError, false, 'Cleared on successful save');

    // Manually set saveError to true again
    useUserTestingStore.setState({ saveError: true });

    // startSession resets saveError to false
    const test = useUserTestingStore.getState().tests[0];
    if (test) {
      useUserTestingStore.getState().startSession(test.id, 'P-NEW');
      assert.equal(useUserTestingStore.getState().saveError, false, 'startSession resets saveError');
    }
  });
});
