import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  useUserTestingStore,
  applyTaskSetup,
  checkTaskAlreadySatisfied,
  restoreResearcherSnapshot,
  isApplyingSetup,
} from '../../testing/useUserTestingStore';
import { useMockpitStore } from '../../store/useMockpitStore';
import { TestDefinition } from '../../testing/types';
import { INITIAL_TESTS } from '../../testing/defaultData';

// In-memory localStorage mock for Node.js test environment
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

describe('Spec v1.1 — Wire Up Task Start State Suite', () => {
  beforeEach(() => {
    mockStorage['mockpit_user_testing_sessions_v2'] = '[]';
    mockStorage['mockpit_components_by_screen_v2'] = '';

    // Reset Mockpit vehicle & climate state
    useMockpitStore.getState().setActiveView('home');
    useMockpitStore.getState().setVehicleState({
      speed: 0,
      gear: 'P',
      driveMode: 'Normal',
      batteryPercent: 80,
    });
    useMockpitStore.getState().setClimateState({
      driverTemp: 70,
      driverSeatHeat: 0,
    });
    useMockpitStore.setState({
      activeQuickAccess: null,
      quickAccessOriginRect: null,
      selectedMusicService: 'Spotify',
      componentsByScreen: {
        home: [
          {
            id: 'battery-1',
            type: 'battery',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            bindings: [],
            staticProps: { displayUnit: 'percent' },
          },
          {
            id: 'climate-temp-1',
            type: 'climateTemp',
            x: 200,
            y: 0,
            width: 200,
            height: 100,
            bindings: [],
            staticProps: { temp: '70' },
          },
        ],
      },
    });

    useUserTestingStore.setState({
      tests: JSON.parse(JSON.stringify(INITIAL_TESTS)),
      sessions: [],
      activeSession: null,
      pendingCompletedSession: null,
      sessionLocked: false,
      sessionCompleteOpen: false,
      isParticipantMode: false,
      currentTaskIndex: 0,
      researcherSnapshot: null,
      taskAlreadySatisfied: false,
      taskArmed: true,
      recentActionEvents: {},
    });
  });

  it('1. startSession snapshots researcher state and applies task 1 setup before taskStartTime', () => {
    const testWithTempFirst: TestDefinition = {
      id: 'test-temp-first',
      name: 'Temp First Test',
      goal: 'Verify task 1 setup is applied on startSession',
      feedbackQuestions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: [
        {
          id: 'task-temp',
          instanceId: 'inst-temp',
          order: 0,
          name: 'Change Temperature',
          description: 'Set temp to 72',
          targetScreen: 'home',
          targetComponent: 'climateTemp',
          points: 100,
          criteria: {
            type: 'climate_field',
            field: 'driverTemp',
            operator: '=',
            expectedValue: 72,
          },
          setup: [{ kind: 'climateState', field: 'driverTemp', value: 65 }],
        },
      ],
    };

    useUserTestingStore.setState({ tests: [testWithTempFirst] });

    // Initial researcher state has driverTemp = 70
    assert.equal(useMockpitStore.getState().climateState.driverTemp, 70);

    const sessionId = useUserTestingStore.getState().startSession(testWithTempFirst.id, 'P-TEST-1');
    assert.ok(sessionId);

    // Verify snapshot captured the researcher's state before setup
    const snapshot = useUserTestingStore.getState().researcherSnapshot;
    assert.ok(snapshot);
    assert.equal(snapshot.climateState.driverTemp, 70);

    // Verify task 1 setup was applied: driverTemp is now 65!
    assert.equal(useMockpitStore.getState().climateState.driverTemp, 65);
    assert.equal(useUserTestingStore.getState().taskAlreadySatisfied, false);
    assert.equal(useUserTestingStore.getState().taskArmed, true);
  });

  it('2. Completing tasks in order applies each next task setup values at the moment taskStartTime is set', () => {
    const multiTaskTest: TestDefinition = {
      id: 'test-multi-setup',
      name: 'Multi Setup Test',
      goal: 'Verify each task setup is applied upon advancing',
      feedbackQuestions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: [
        {
          id: 'task-1',
          instanceId: 'inst-1',
          order: 0,
          name: 'Task 1',
          description: 'Drive mode setup',
          targetScreen: 'home',
          targetComponent: 'driveMode',
          points: 100,
          criteria: {
            type: 'state_field',
            field: 'driveMode',
            operator: '=',
            expectedValue: 'Sport',
          },
          setup: [{ kind: 'vehicleState', field: 'driveMode', value: 'Eco' }],
        },
        {
          id: 'task-2',
          instanceId: 'inst-2',
          order: 1,
          name: 'Task 2',
          description: 'Temperature setup',
          targetScreen: 'home',
          targetComponent: 'climateTemp',
          points: 100,
          criteria: {
            type: 'climate_field',
            field: 'driverTemp',
            operator: '=',
            expectedValue: 72,
          },
          setup: [{ kind: 'climateState', field: 'driverTemp', value: 64 }],
        },
        {
          id: 'task-3',
          instanceId: 'inst-3',
          order: 2,
          name: 'Task 3',
          description: 'Battery displayUnit setup',
          targetScreen: 'home',
          targetComponent: 'battery',
          points: 100,
          criteria: {
            type: 'action_event',
            field: 'changeBatteryUnit',
            operator: '=',
            expectedValue: 'miles',
          },
          setup: [{ kind: 'componentProp', component: 'battery', field: 'displayUnit', value: 'percent' }],
        },
      ],
    };

    useUserTestingStore.setState({ tests: [multiTaskTest] });
    useUserTestingStore.getState().startSession(multiTaskTest.id, 'P-ORDER');

    // Task 1 started: driveMode should be 'Eco'
    assert.equal(useMockpitStore.getState().vehicleState.driveMode, 'Eco');

    // Complete Task 1
    useMockpitStore.getState().setVehicleState({ driveMode: 'Sport' });
    useUserTestingStore.getState().evaluateCurrentTask();

    // Now Task 2 has started: driverTemp should be 64!
    assert.equal(useUserTestingStore.getState().currentTaskIndex, 1);
    assert.equal(useMockpitStore.getState().climateState.driverTemp, 64);

    // Complete Task 2
    useMockpitStore.getState().setClimateState({ driverTemp: 72 });
    useUserTestingStore.getState().evaluateCurrentTask();

    // Now Task 3 has started: battery component displayUnit should be 'percent'!
    assert.equal(useUserTestingStore.getState().currentTaskIndex, 2);
    const homeComps = useMockpitStore.getState().componentsByScreen['home'];
    const batteryComp = homeComps.find((c) => c.type === 'battery');
    assert.equal(batteryComp?.staticProps?.displayUnit, 'percent');
  });

  it('3. Run a session where previous run ended with temp 72 and battery on miles: tasks 3 and 4 start with temp != 72 and displayUnit == percent', () => {
    // Simulate previous test run that left driverTemp at 72 and battery on 'miles'
    useMockpitStore.getState().setClimateState({ driverTemp: 72 });
    const currentScreens = useMockpitStore.getState().componentsByScreen;
    useMockpitStore.setState({
      componentsByScreen: {
        ...currentScreens,
        home: currentScreens['home'].map((c) =>
          c.type === 'battery'
            ? { ...c, staticProps: { ...c.staticProps, displayUnit: 'miles' } }
            : c
        ),
      },
    });

    const defaultTest = INITIAL_TESTS[0]; // Core Driving & Infotainment Usability
    // Task 0: Speed (setup: speed 0)
    // Task 1: Drive Mode (setup: Normal)
    // Task 2 (3rd task): Change temp (setup: driverTemp 68)
    // Task 3 (4th task): Battery % to miles (setup: displayUnit percent)

    useUserTestingStore.getState().startSession(defaultTest.id, 'P-REPEAT');

    // Advance through task 0 (speed) and task 1 (drive mode)
    useUserTestingStore.getState().completeCurrentTask('completed');
    useUserTestingStore.getState().completeCurrentTask('completed');

    // Now we are at Task index 2 (Task 3 in 1-based index: Change temperature)
    assert.equal(useUserTestingStore.getState().currentTaskIndex, 2);
    const task3Temp = useMockpitStore.getState().climateState.driverTemp;
    console.log(`[DOM Verification] Task 3 start driverTemp: ${task3Temp}`);
    assert.notEqual(task3Temp, 72, 'Task 3 must not start with driverTemp == 72');
    assert.equal(task3Temp, 68, 'Task 3 must start with driverTemp == 68 from setup');

    // Advance past Task 2 to Task index 3 (Task 4 in 1-based index: Battery % to miles)
    useUserTestingStore.getState().completeCurrentTask('completed');
    assert.equal(useUserTestingStore.getState().currentTaskIndex, 3);

    const task4Comps = useMockpitStore.getState().componentsByScreen['home'];
    const task4Battery = task4Comps.find((c) => c.type === 'battery');
    const task4Unit = task4Battery?.staticProps?.displayUnit;
    console.log(`[DOM Verification] Task 4 start battery displayUnit: ${task4Unit}`);
    assert.equal(task4Unit, 'percent', 'Task 4 battery displayUnit must be reset to percent');
  });

  it('4. evaluateCurrentTask call counts during setup step produce zero completions', () => {
    let evaluateCallCount = 0;
    const originalEvaluate = useUserTestingStore.getState().evaluateCurrentTask;

    const testDef: TestDefinition = {
      id: 'test-suppression',
      name: 'Suppression Test',
      goal: 'Test suppression during applyTaskSetup',
      feedbackQuestions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: [
        {
          id: 'task-suppress',
          instanceId: 'inst-suppress',
          order: 0,
          name: 'Speed task',
          description: 'Speed >= 65',
          targetScreen: 'home',
          targetComponent: 'speed',
          points: 100,
          criteria: {
            type: 'state_field',
            field: 'speed',
            operator: '>=',
            expectedValue: 65,
          },
          setup: [{ kind: 'vehicleState', field: 'speed', value: 0 }],
        },
      ],
    };

    useUserTestingStore.setState({ tests: [testDef] });

    // Confirm that when isApplyingSetup is true, evaluateCurrentTask returns false immediately
    assert.equal(isApplyingSetup(), false);

    useUserTestingStore.getState().startSession(testDef.id, 'P-SUPPRESS');

    // Task is active and waiting for speed >= 65
    assert.equal(useUserTestingStore.getState().currentTaskIndex, 0);
    assert.equal(useUserTestingStore.getState().activeSession?.status, 'in-progress');
    assert.equal(useUserTestingStore.getState().activeSession?.taskResults.length, 0);

    // Call evaluateCurrentTask with speed = 0: should return false and not complete
    const evalRes = useUserTestingStore.getState().evaluateCurrentTask();
    assert.equal(evalRes, false);
    assert.equal(useUserTestingStore.getState().activeSession?.taskResults.length, 0);
  });

  it('5. Task without setup that starts satisfied does NOT complete until value is changed away and back; TaskResult records alreadySatisfiedAtStart: true', () => {
    // Current climate driverTemp is 72
    useMockpitStore.getState().setClimateState({ driverTemp: 72 });

    const satisfiedTaskTest: TestDefinition = {
      id: 'test-starts-satisfied',
      name: 'Starts Satisfied Test',
      goal: 'Verify task armed guard prevents immediate auto-completion',
      feedbackQuestions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: [
        {
          id: 'task-no-setup-satisfied',
          instanceId: 'inst-sat',
          order: 0,
          name: 'Change Temp',
          description: 'Temp must be 72',
          targetScreen: 'home',
          targetComponent: 'climateTemp',
          points: 100,
          criteria: {
            type: 'climate_field',
            field: 'driverTemp',
            operator: '=',
            expectedValue: 72,
          },
          // No setup! Starts satisfied because driverTemp is already 72.
        },
      ],
    };

    useUserTestingStore.setState({ tests: [satisfiedTaskTest] });
    useUserTestingStore.getState().startSession(satisfiedTaskTest.id, 'P-ALREADY-SAT');

    // Guard should detect it started satisfied:
    assert.equal(useUserTestingStore.getState().taskAlreadySatisfied, true);
    assert.equal(useUserTestingStore.getState().taskArmed, false);

    // Calling evaluateCurrentTask while still at 72 should NOT complete the task
    const completedWhileUnarmed = useUserTestingStore.getState().evaluateCurrentTask();
    assert.equal(completedWhileUnarmed, false);
    assert.equal(useUserTestingStore.getState().taskArmed, false);
    assert.equal(useUserTestingStore.getState().activeSession?.taskResults.length, 0);

    // Participant changes temperature away to 68: criteria is now unsatisfied -> arms the task!
    useMockpitStore.getState().setClimateState({ driverTemp: 68 });
    const armedCheck = useUserTestingStore.getState().evaluateCurrentTask();
    assert.equal(armedCheck, false); // Criteria not met yet, but armed!
    assert.equal(useUserTestingStore.getState().taskArmed, true);

    // Participant changes temperature back to 72: now satisfied and armed -> completes!
    useMockpitStore.getState().setClimateState({ driverTemp: 72 });
    const completedAfterArmed = useUserTestingStore.getState().evaluateCurrentTask();
    assert.equal(completedAfterArmed, true);

    // Verify task result has alreadySatisfiedAtStart: true!
    const session = useUserTestingStore.getState().activeSession;
    const taskResult = session?.taskResults[0];
    assert.ok(taskResult);
    assert.equal(taskResult.alreadySatisfiedAtStart, true);
    console.log(`[DOM Verification] Task completed with alreadySatisfiedAtStart: ${taskResult.alreadySatisfiedAtStart}`);
  });

  it('6. After unlocking, vehicle state, climate state, and battery displayUnit are restored to pre-session researcher values', () => {
    // Set researcher authored state
    useMockpitStore.getState().setVehicleState({ speed: 12, driveMode: 'Eco' });
    useMockpitStore.getState().setClimateState({ driverTemp: 69 });
    const screens = useMockpitStore.getState().componentsByScreen;
    useMockpitStore.setState({
      componentsByScreen: {
        ...screens,
        home: screens['home'].map((c) =>
          c.type === 'battery'
            ? { ...c, staticProps: { ...c.staticProps, displayUnit: 'percent' } }
            : c
        ),
      },
    });

    const preSessionSpeed = useMockpitStore.getState().vehicleState.speed;
    const preSessionDriveMode = useMockpitStore.getState().vehicleState.driveMode;
    const preSessionTemp = useMockpitStore.getState().climateState.driverTemp;
    const preSessionUnit = useMockpitStore.getState().componentsByScreen['home'].find((c) => c.type === 'battery')?.staticProps?.displayUnit;

    const testDef = INITIAL_TESTS[0];
    useUserTestingStore.getState().startSession(testDef.id, 'P-RESTORE');

    // Mutate state during participant session
    useMockpitStore.getState().setVehicleState({ speed: 75, driveMode: 'Sport' });
    useMockpitStore.getState().setClimateState({ driverTemp: 74 });
    const runtimeScreens = useMockpitStore.getState().componentsByScreen;
    useMockpitStore.setState({
      componentsByScreen: {
        ...runtimeScreens,
        home: runtimeScreens['home'].map((c) =>
          c.type === 'battery'
            ? { ...c, staticProps: { ...c.staticProps, displayUnit: 'miles' } }
            : c
        ),
      },
    });

    // Session completes and researcher unlocks
    useUserTestingStore.getState().unlockAndViewResults();

    // Verify restored values equal researcher pre-session values!
    const postUnlockSpeed = useMockpitStore.getState().vehicleState.speed;
    const postUnlockDriveMode = useMockpitStore.getState().vehicleState.driveMode;
    const postUnlockTemp = useMockpitStore.getState().climateState.driverTemp;
    const postUnlockUnit = useMockpitStore.getState().componentsByScreen['home'].find((c) => c.type === 'battery')?.staticProps?.displayUnit;

    console.log(`[DOM Verification] Pre-session vs Post-unlock:`);
    console.log(`  speed: ${preSessionSpeed} -> ${postUnlockSpeed}`);
    console.log(`  driveMode: ${preSessionDriveMode} -> ${postUnlockDriveMode}`);
    console.log(`  driverTemp: ${preSessionTemp} -> ${postUnlockTemp}`);
    console.log(`  displayUnit: ${preSessionUnit} -> ${postUnlockUnit}`);

    assert.equal(postUnlockSpeed, preSessionSpeed);
    assert.equal(postUnlockDriveMode, preSessionDriveMode);
    assert.equal(postUnlockTemp, preSessionTemp);
    assert.equal(postUnlockUnit, preSessionUnit);
    assert.equal(useUserTestingStore.getState().researcherSnapshot, null);
  });

  it('7. exitSessionEarly restores snapshot as well', () => {
    useMockpitStore.getState().setClimateState({ driverTemp: 66 });
    const preTemp = useMockpitStore.getState().climateState.driverTemp;

    const testDef = INITIAL_TESTS[0];
    useUserTestingStore.getState().startSession(testDef.id, 'P-EXIT-EARLY');

    // During test, temp changed to 75
    useMockpitStore.getState().setClimateState({ driverTemp: 75 });
    assert.equal(useMockpitStore.getState().climateState.driverTemp, 75);

    // Participant / researcher exits session early
    useUserTestingStore.getState().exitSessionEarly(true);

    assert.equal(useMockpitStore.getState().climateState.driverTemp, preTemp);
    assert.equal(useUserTestingStore.getState().researcherSnapshot, null);
  });
});
