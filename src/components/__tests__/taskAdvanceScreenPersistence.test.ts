import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useUserTestingStore } from '../../testing/useUserTestingStore';
import { useMockpitStore } from '../../store/useMockpitStore';
import { TestDefinition } from '../../testing/types';

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

describe('Spec v1 — Task Advance Must Not Reset Current Screen Suite', () => {
  beforeEach(() => {
    mockStorage['mockpit_user_testing_sessions_v2'] = '[]';
    useMockpitStore.getState().setActiveView('home');
    useMockpitStore.setState({
      activeQuickAccess: null,
      quickAccessOriginRect: null,
    });

    useUserTestingStore.setState({
      sessions: [],
      activeSession: null,
      pendingCompletedSession: null,
      sessionLocked: false,
      sessionCompleteOpen: false,
      isParticipantMode: false,
      currentTaskIndex: 0,
    });
  });

  it('DOM verification: keeps open Quick Access popover when next task targets the same screen', () => {
    const testDef: TestDefinition = {
      id: 'test-same-screen',
      name: 'Same Screen Task Test',
      goal: 'Testing task advance with same targetScreen',
      feedbackQuestions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: [
        {
          id: 'task-1',
          instanceId: 'inst-1',
          order: 0,
          name: 'Task 1 (Home)',
          description: 'Adjust temperature in Quick Access',
          targetScreen: 'home',
          targetComponent: 'climateTemp',
          points: 100,
          criteria: {
            type: 'climate_field',
            field: 'driverTemp',
            operator: '>=',
            expectedValue: 72,
          },
        },
        {
          id: 'task-2',
          instanceId: 'inst-2',
          order: 1,
          name: 'Task 2 (Home)',
          description: 'Follow-up task on Home screen',
          targetScreen: 'home',
          targetComponent: 'climateSeats',
          points: 100,
          criteria: {
            type: 'climate_field',
            field: 'driverSeatHeat',
            operator: '>',
            expectedValue: 0,
          },
        },
      ],
    };

    useUserTestingStore.setState({ tests: [testDef] });

    // Start session
    const sessionId = useUserTestingStore.getState().startSession(testDef.id, 'P-TEST', 'Testing same screen advance');
    assert.ok(sessionId, 'Session should be created');

    // Participant opens quick access popover on Home screen
    useMockpitStore.setState({
      activeQuickAccess: {
        screenId: 'climate',
        componentType: 'climateWidget' as any,
        isOpen: true,
      },
      quickAccessOriginRect: { x: 100, y: 200, width: 300, height: 150 },
    });

    // Check state immediately before completion
    const beforeQuickAccess = useMockpitStore.getState().activeQuickAccess;
    assert.ok(beforeQuickAccess, 'Quick access should be open before task 1 completion');
    assert.equal(beforeQuickAccess?.isOpen, true);
    assert.equal(beforeQuickAccess?.screenId, 'climate');

    // Complete task 1
    useUserTestingStore.getState().completeCurrentTask('completed');

    // Check state immediately after completion
    const afterQuickAccess = useMockpitStore.getState().activeQuickAccess;
    const afterView = useMockpitStore.getState().activeView;

    assert.equal(afterView, 'home', 'View must still be home');
    assert.notEqual(afterQuickAccess, null, 'Quick access must NOT be reset to null');
    assert.deepEqual(
      afterQuickAccess,
      beforeQuickAccess,
      'useMockpitStore.getState().activeQuickAccess must be unchanged immediately before and after completion'
    );
    assert.deepEqual(
      useMockpitStore.getState().quickAccessOriginRect,
      { x: 100, y: 200, width: 300, height: 150 },
      'quickAccessOriginRect must remain intact'
    );
  });

  it('DOM verification: clears quick access and changes activeView when next task targets a different screen', () => {
    const testDef: TestDefinition = {
      id: 'test-diff-screen',
      name: 'Different Screen Task Test',
      goal: 'Testing task advance with different targetScreen',
      feedbackQuestions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: [
        {
          id: 'task-1',
          instanceId: 'inst-1',
          order: 0,
          name: 'Task 1 (Home)',
          description: 'Task on home',
          targetScreen: 'home',
          targetComponent: 'climateTemp',
          points: 100,
          criteria: {
            type: 'climate_field',
            field: 'driverTemp',
            operator: '>=',
            expectedValue: 72,
          },
        },
        {
          id: 'task-2',
          instanceId: 'inst-2',
          order: 1,
          name: 'Task 2 (Navigation)',
          description: 'Task on navigation screen',
          targetScreen: 'navigation',
          targetComponent: 'navigation',
          points: 100,
          criteria: {
            type: 'action_event',
            field: 'searchDestination',
            operator: '!=',
            expectedValue: '',
          },
        },
      ],
    };

    useUserTestingStore.setState({ tests: [testDef] });

    // Start session
    useUserTestingStore.getState().startSession(testDef.id, 'P-TEST', 'Testing diff screen advance');

    // Open quick access on Home screen
    useMockpitStore.setState({
      activeQuickAccess: {
        screenId: 'climate',
        componentType: 'climateWidget' as any,
        isOpen: true,
      },
    });

    const beforeView = useMockpitStore.getState().activeView;
    assert.equal(beforeView, 'home');
    assert.ok(useMockpitStore.getState().activeQuickAccess !== null);

    // Complete task 1
    useUserTestingStore.getState().completeCurrentTask('completed');

    const afterView = useMockpitStore.getState().activeView;
    const afterQuickAccess = useMockpitStore.getState().activeQuickAccess;

    assert.equal(afterView, 'navigation', 'activeView must change to the target screen');
    assert.equal(afterQuickAccess, null, 'activeQuickAccess must be cleared when navigating to a new screen');
  });
});
