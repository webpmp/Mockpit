import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_TESTS, BUILTIN_TASK_LIBRARY } from '../../testing/defaultData';
import { useUserTestingStore } from '../../testing/useUserTestingStore';

describe('Test Definition Editor Hydration & Persistence Suite', () => {
  beforeEach(() => {
    // Reset test store to default test definitions
    useUserTestingStore.setState({
      tests: JSON.parse(JSON.stringify(INITIAL_TESTS)),
      taskLibrary: JSON.parse(JSON.stringify(BUILTIN_TASK_LIBRARY)),
    });
  });

  it('1. Verifies all three default test definitions have complete metadata, tasks, and questions', () => {
    const tests = useUserTestingStore.getState().tests;
    assert.equal(tests.length, 3, 'Should have exactly 3 initial test definitions');

    // Test 1: Infotainment Usability Baseline Alpha
    const test1 = tests.find((t) => t.id === 'test-baseline-infotainment-usability');
    assert.ok(test1, 'Test 1 exists');
    assert.equal(test1.name, 'Infotainment Usability Baseline Alpha');
    assert.equal(test1.tasks.length, 5, 'Test 1 has 5 tasks');
    assert.equal(test1.feedbackQuestions.length, 4, 'Test 1 has 4 feedback questions');
    assert.equal(test1.tasks[0].name, 'Increase speed');
    assert.equal(test1.tasks[1].name, 'Change drive mode');
    assert.equal(test1.tasks[2].name, 'Change temperature');
    assert.equal(test1.tasks[3].name, 'Change battery % to miles');
    assert.equal(test1.tasks[4].name, 'Send Diagnostic Report');

    // Test 2: Infotainment & Media Experience
    const test2 = tests.find((t) => t.id === 'test-media-navigation-suite');
    assert.ok(test2, 'Test 2 exists');
    assert.equal(test2.name, 'Infotainment & Media Experience');
    assert.equal(test2.tasks.length, 4, 'Test 2 has 4 tasks');
    assert.equal(test2.feedbackQuestions.length, 4, 'Test 2 has 4 feedback questions');

    // Test 3: Navigation & Trip Planning Usability
    const test3 = tests.find((t) => t.id === 'test-navigation-trip-planning');
    assert.ok(test3, 'Test 3 exists');
    assert.equal(test3.name, 'Navigation & Trip Planning Usability');
    assert.equal(test3.tasks.length, 3, 'Test 3 has 3 tasks');
    assert.equal(test3.feedbackQuestions.length, 4, 'Test 3 has 4 feedback questions');
  });

  it('2. Updating an existing test definition persists updated metadata, tasks, and questions', () => {
    const store = useUserTestingStore.getState();
    const testId = 'test-baseline-infotainment-usability';
    const originalTest = store.tests.find((t) => t.id === testId)!;

    // Simulate saving edited data
    const updatedTasks = [
      ...originalTest.tasks.slice(0, 2),
      {
        ...BUILTIN_TASK_LIBRARY[12],
        instanceId: 'inst-custom-media',
        order: 2,
      },
    ].map((t, idx) => ({ ...t, order: idx }));

    store.updateTest(testId, {
      name: 'Updated Infotainment Usability Benchmark',
      goal: 'Updated benchmark goal for testing.',
      notes: 'Updated researcher protocol.',
      tasks: updatedTasks,
      feedbackQuestions: [
        ...originalTest.feedbackQuestions,
        {
          id: 'fq-new-custom',
          prompt: 'How satisfied were you with the system?',
          type: 'rating',
          required: true,
        },
      ],
    });

    const refreshedTest = useUserTestingStore.getState().tests.find((t) => t.id === testId)!;
    assert.equal(refreshedTest.name, 'Updated Infotainment Usability Benchmark');
    assert.equal(refreshedTest.goal, 'Updated benchmark goal for testing.');
    assert.equal(refreshedTest.notes, 'Updated researcher protocol.');
    assert.equal(refreshedTest.tasks.length, 3);
    assert.equal(refreshedTest.tasks[0].name, 'Increase speed');
    assert.equal(refreshedTest.tasks[1].name, 'Change drive mode');
    assert.equal(refreshedTest.tasks[2].name, 'Select media source');
    assert.equal(refreshedTest.feedbackQuestions.length, 5);
  });

  it('3. Modifying one test does not mutate or leak state to other test definitions', () => {
    const store = useUserTestingStore.getState();
    const test2Id = 'test-media-navigation-suite';
    const test3Id = 'test-navigation-trip-planning';

    const test2Before = store.tests.find((t) => t.id === test2Id)!;
    const test3Before = store.tests.find((t) => t.id === test3Id)!;

    assert.equal(test2Before.tasks.length, 4);
    assert.equal(test3Before.tasks.length, 3);

    // Modify test 2
    store.updateTest(test2Id, {
      name: 'Modified Media Experience Only',
      tasks: test2Before.tasks.slice(0, 2),
    });

    const test2After = useUserTestingStore.getState().tests.find((t) => t.id === test2Id)!;
    const test3After = useUserTestingStore.getState().tests.find((t) => t.id === test3Id)!;

    assert.equal(test2After.tasks.length, 2);
    assert.equal(test3After.tasks.length, 3, 'Test 3 tasks should remain untouched');
    assert.equal(test3After.name, 'Navigation & Trip Planning Usability');
  });
});
