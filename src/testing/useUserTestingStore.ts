import { create } from 'zustand';
import {
  TestDefinition,
  LibraryTask,
  TestTask,
  SessionRecord,
  TaskResult,
  FeedbackAnswer,
  UserTestingSettings,
  AggregateTestMetrics,
  AggregateTaskStats,
} from './types';
import { BUILTIN_TASK_LIBRARY, INITIAL_TESTS, DEFAULT_FEEDBACK_QUESTIONS } from './defaultData';
import { evaluateTaskCriteria, EvaluationState } from './evaluationEngine';
import { useMockpitStore } from '../store/useMockpitStore';
import { getRuntimeLog, clearRuntimeLog } from '../lib/hmiRules/runtimeInstrumenter';

const STORAGE_TESTS_KEY = 'mockpit_user_testing_tests_v2';
const STORAGE_LIBRARY_KEY = 'mockpit_user_testing_library_v2';
const STORAGE_SESSIONS_KEY = 'mockpit_user_testing_sessions_v2';
const STORAGE_SETTINGS_KEY = 'mockpit_user_testing_settings_v2';

export const DEFAULT_MASTER_PASSWORD = 'admin';

export function sanitizeCockpitToInfotainment(text: string): string {
  return text
    .replace(/\bCockpit\b/g, 'Infotainment')
    .replace(/\bcockpit\b/g, 'infotainment');
}

// Simple deterministic hash for password checking
export function hashPassword(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash-${Math.abs(hash).toString(16)}`;
}

const DEFAULT_SETTINGS: UserTestingSettings = {
  masterPasswordHash: hashPassword(DEFAULT_MASTER_PASSWORD),
  requirePasswordToExit: false,
  requirePasswordToEdit: false,
};

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // ignore
  }
  return null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

function loadSavedTests(): TestDefinition[] {
  try {
    const raw = safeGetItem(STORAGE_TESTS_KEY);
    if (raw) {
      const sanitized = sanitizeCockpitToInfotainment(raw);
      if (sanitized !== raw) {
        safeSetItem(STORAGE_TESTS_KEY, sanitized);
      }
      const parsed = JSON.parse(sanitized);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load tests from localStorage', e);
  }
  return INITIAL_TESTS;
}

function loadSavedLibrary(): LibraryTask[] {
  try {
    const raw = safeGetItem(STORAGE_LIBRARY_KEY);
    if (raw) {
      const sanitized = sanitizeCockpitToInfotainment(raw);
      if (sanitized !== raw) {
        safeSetItem(STORAGE_LIBRARY_KEY, sanitized);
      }
      const parsed = JSON.parse(sanitized);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load task library from localStorage', e);
  }
  return BUILTIN_TASK_LIBRARY;
}

function loadSavedSessions(): SessionRecord[] {
  try {
    const raw = safeGetItem(STORAGE_SESSIONS_KEY);
    if (raw) {
      const sanitized = sanitizeCockpitToInfotainment(raw);
      if (sanitized !== raw) {
        safeSetItem(STORAGE_SESSIONS_KEY, sanitized);
      }
      const parsed = JSON.parse(sanitized);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load sessions from localStorage', e);
  }
  return [];
}

function loadSavedSettings(): UserTestingSettings {
  try {
    const raw = safeGetItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.masterPasswordHash) {
        return {
          masterPasswordHash: parsed.masterPasswordHash,
          requirePasswordToExit: Boolean(parsed.requirePasswordToExit),
          requirePasswordToEdit: Boolean(parsed.requirePasswordToEdit),
        };
      }
    }
  } catch (e) {
    console.error('Failed to load user testing settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

interface UserTestingState {
  tests: TestDefinition[];
  taskLibrary: LibraryTask[];
  sessions: SessionRecord[];
  settings: UserTestingSettings;

  // Active Session Runtime State
  activeSession: SessionRecord | null;
  currentTaskIndex: number;
  isParticipantMode: boolean;
  taskStartTime: number | null;
  recentActionEvents: Record<string, any>;
  taskCompletedFlash: boolean;
  showFeedbackModal: boolean;
  exitPromptOpen: boolean;

  // Active sub-tab in User Testing Mode
  activeTab: 'tests' | 'library' | 'results' | 'settings';
  setActiveTab: (tab: 'tests' | 'library' | 'results' | 'settings') => void;

  // Tests CRUD
  addTest: (test: Omit<TestDefinition, 'id' | 'createdAt' | 'updatedAt'>) => TestDefinition;
  updateTest: (id: string, partial: Partial<TestDefinition>) => void;
  deleteTest: (id: string) => void;
  duplicateTest: (id: string) => TestDefinition | null;
  reorderTestTasks: (testId: string, fromIndex: number, toIndex: number) => void;
  addTaskToTest: (testId: string, task: LibraryTask | Omit<TestTask, 'instanceId' | 'order'>) => void;
  removeTaskFromTest: (testId: string, instanceId: string) => void;
  updateTestTask: (testId: string, instanceId: string, partial: Partial<TestTask>) => void;

  // Task Library CRUD
  addLibraryTask: (task: Omit<LibraryTask, 'id'>) => LibraryTask;
  updateLibraryTask: (id: string, partial: Partial<LibraryTask>) => void;
  deleteLibraryTask: (id: string) => void;
  resetLibraryToDefaults: () => void;

  // Session Management
  startSession: (testId: string, participantId: string, researcherNotes?: string) => string | null;
  recordActionEvent: (actionName: string, detail?: any) => void;
  evaluateCurrentTask: () => boolean;
  completeCurrentTask: (status?: 'completed' | 'timeout' | 'skipped') => void;
  submitSessionFeedback: (answers: FeedbackAnswer[]) => void;
  exitSessionEarly: (abandon?: boolean) => void;
  setExitPromptOpen: (open: boolean) => void;

  // Settings & Security
  verifyMasterPassword: (input: string) => boolean;
  setMasterPassword: (newPass: string) => void;
  updateSettings: (partial: Partial<UserTestingSettings>) => void;
  clearAllSessions: () => void;
  deleteSession: (sessionId: string) => void;
  exportAllTestingData: () => string;
  importTestingData: (jsonStr: string) => boolean;
}

export const useUserTestingStore = create<UserTestingState>((set, get) => ({
  tests: loadSavedTests(),
  taskLibrary: loadSavedLibrary(),
  sessions: loadSavedSessions(),
  settings: loadSavedSettings(),

  activeSession: null,
  currentTaskIndex: 0,
  isParticipantMode: false,
  taskStartTime: null,
  recentActionEvents: {},
  taskCompletedFlash: false,
  showFeedbackModal: false,
  exitPromptOpen: false,

  activeTab: 'tests',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Tests CRUD
  addTest: (testData) => {
    const newTest: TestDefinition = {
      ...testData,
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: testData.tasks.map((t, idx) => ({
        ...t,
        instanceId: t.instanceId || `inst-${Date.now()}-${idx}`,
        order: idx,
      })),
    };
    const updated = [newTest, ...get().tests];
    safeSetItem(STORAGE_TESTS_KEY, JSON.stringify(updated));
    set({ tests: updated });
    return newTest;
  },

  updateTest: (id, partial) => {
    const updated = get().tests.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          ...partial,
          updatedAt: Date.now(),
        };
      }
      return t;
    });
    safeSetItem(STORAGE_TESTS_KEY, JSON.stringify(updated));
    set({ tests: updated });
  },

  deleteTest: (id) => {
    const updated = get().tests.filter((t) => t.id !== id);
    safeSetItem(STORAGE_TESTS_KEY, JSON.stringify(updated));
    set({ tests: updated });
  },

  duplicateTest: (id) => {
    const test = get().tests.find((t) => t.id === id);
    if (!test) return null;
    const duplicated: TestDefinition = {
      ...JSON.parse(JSON.stringify(test)),
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${test.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [duplicated, ...get().tests];
    safeSetItem(STORAGE_TESTS_KEY, JSON.stringify(updated));
    set({ tests: updated });
    return duplicated;
  },

  reorderTestTasks: (testId, fromIndex, toIndex) => {
    const test = get().tests.find((t) => t.id === testId);
    if (!test) return;
    const newTasks = [...test.tasks];
    const [moved] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, moved);
    const reordered = newTasks.map((t, idx) => ({ ...t, order: idx }));
    get().updateTest(testId, { tasks: reordered });
  },

  addTaskToTest: (testId, task) => {
    const test = get().tests.find((t) => t.id === testId);
    if (!test) return;

    // Create a test-specific task instance (editing will not mutate original library task)
    const instance: TestTask = {
      ...JSON.parse(JSON.stringify(task)),
      instanceId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      libraryTaskId: (task as any).id,
      order: test.tasks.length,
    };

    get().updateTest(testId, {
      tasks: [...test.tasks, instance],
    });
  },

  removeTaskFromTest: (testId, instanceId) => {
    const test = get().tests.find((t) => t.id === testId);
    if (!test) return;
    const filtered = test.tasks
      .filter((t) => t.instanceId !== instanceId)
      .map((t, idx) => ({ ...t, order: idx }));
    get().updateTest(testId, { tasks: filtered });
  },

  updateTestTask: (testId, instanceId, partial) => {
    const test = get().tests.find((t) => t.id === testId);
    if (!test) return;
    const updatedTasks = test.tasks.map((t) => {
      if (t.instanceId === instanceId) {
        return { ...t, ...partial };
      }
      return t;
    });
    get().updateTest(testId, { tasks: updatedTasks });
  },

  // Task Library CRUD
  addLibraryTask: (taskData) => {
    const newTask: LibraryTask = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isBuiltin: false,
    };
    const updated = [newTask, ...get().taskLibrary];
    safeSetItem(STORAGE_LIBRARY_KEY, JSON.stringify(updated));
    set({ taskLibrary: updated });
    return newTask;
  },

  updateLibraryTask: (id, partial) => {
    const updated = get().taskLibrary.map((t) => (t.id === id ? { ...t, ...partial } : t));
    safeSetItem(STORAGE_LIBRARY_KEY, JSON.stringify(updated));
    set({ taskLibrary: updated });
  },

  deleteLibraryTask: (id) => {
    const updated = get().taskLibrary.filter((t) => t.id !== id);
    safeSetItem(STORAGE_LIBRARY_KEY, JSON.stringify(updated));
    set({ taskLibrary: updated });
  },

  resetLibraryToDefaults: () => {
    safeSetItem(STORAGE_LIBRARY_KEY, JSON.stringify(BUILTIN_TASK_LIBRARY));
    set({ taskLibrary: BUILTIN_TASK_LIBRARY });
  },

  // Session Lifecycle
  startSession: (testId, participantId, researcherNotes) => {
    const test = get().tests.find((t) => t.id === testId);
    if (!test || test.tasks.length === 0) return null;

    const sessionId = `SES-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create immutable snapshot of the test configuration
    const testSnapshot: TestDefinition = JSON.parse(JSON.stringify(test));

    const newSession: SessionRecord = {
      id: sessionId,
      testId: test.id,
      testName: test.name,
      participantId: participantId.trim() || 'P-001',
      startedAt: Date.now(),
      status: 'in-progress',
      testSnapshot,
      taskResults: [],
      feedbackAnswers: [],
      totalPoints: 0,
      maxPoints: testSnapshot.tasks.reduce((sum, t) => sum + (t.points || 100), 0),
      totalDurationSeconds: 0,
      researcherNotes,
    };

    // Clear runtime logger for fresh session telemetry
    clearRuntimeLog();

    set({
      activeSession: newSession,
      currentTaskIndex: 0,
      isParticipantMode: true,
      taskStartTime: Date.now(),
      recentActionEvents: {},
      taskCompletedFlash: false,
      showFeedbackModal: false,
      exitPromptOpen: false,
    });

    // Auto-navigate to first task target screen if defined
    const firstTask = testSnapshot.tasks[0];
    if (firstTask && firstTask.targetScreen) {
      useMockpitStore.getState().setActiveView(firstTask.targetScreen);
    }

    return sessionId;
  },

  recordActionEvent: (actionName, detail) => {
    const state = get();
    if (!state.isParticipantMode || !state.activeSession) return;

    const updatedEvents = {
      ...state.recentActionEvents,
      [actionName]: detail !== undefined ? detail : true,
    };

    set({ recentActionEvents: updatedEvents });

    // Instantly check task criteria
    get().evaluateCurrentTask();
  },

  evaluateCurrentTask: () => {
    const state = get();
    if (!state.isParticipantMode || !state.activeSession) return false;

    const currentTask = state.activeSession.testSnapshot.tasks[state.currentTaskIndex];
    if (!currentTask || !currentTask.criteria) return false;

    const mockpit = useMockpitStore.getState();
    const evalState: EvaluationState = {
      vehicleState: mockpit.vehicleState,
      climateState: mockpit.climateState,
      activeView: mockpit.activeView,
      activeTrip: mockpit.activeTrip,
      selectedMusicService: mockpit.selectedMusicService,
      recentActionEvents: state.recentActionEvents,
    };

    const isSatisfied = evaluateTaskCriteria(currentTask.criteria, evalState);
    if (isSatisfied) {
      get().completeCurrentTask('completed');
      return true;
    }

    return false;
  },

  completeCurrentTask: (status = 'completed') => {
    const state = get();
    if (!state.isParticipantMode || !state.activeSession) return;

    const currentTask = state.activeSession.testSnapshot.tasks[state.currentTaskIndex];
    if (!currentTask) return;

    const now = Date.now();
    const elapsedSeconds = state.taskStartTime
      ? Math.max(1, Math.round((now - state.taskStartTime) / 1000))
      : 0;

    const pointsEarned = status === 'completed' ? (currentTask.points || 100) : 0;
    const taskInteractions = getRuntimeLog();

    const taskResult: TaskResult = {
      instanceId: currentTask.instanceId,
      taskId: currentTask.id,
      taskName: currentTask.name,
      description: currentTask.description,
      targetScreen: currentTask.targetScreen,
      targetComponent: String(currentTask.targetComponent),
      status,
      durationSeconds: elapsedSeconds,
      pointsEarned,
      maxPoints: currentTask.points || 100,
      completedAt: now,
      interactionsCount: taskInteractions.length,
      interactions: [...taskInteractions],
    };

    const updatedTaskResults = [...state.activeSession.taskResults, taskResult];
    const newTotalPoints = state.activeSession.totalPoints + pointsEarned;
    const newTotalDuration = state.activeSession.totalDurationSeconds + elapsedSeconds;

    const updatedSession: SessionRecord = {
      ...state.activeSession,
      taskResults: updatedTaskResults,
      totalPoints: newTotalPoints,
      totalDurationSeconds: newTotalDuration,
    };

    // Flash task completed indicator
    set({
      activeSession: updatedSession,
      taskCompletedFlash: true,
    });

    setTimeout(() => {
      set({ taskCompletedFlash: false });
    }, 1200);

    const nextIndex = state.currentTaskIndex + 1;
    const totalTasks = state.activeSession.testSnapshot.tasks.length;

    if (nextIndex < totalTasks) {
      // Advance to next task
      const nextTask = state.activeSession.testSnapshot.tasks[nextIndex];
      set({
        currentTaskIndex: nextIndex,
        taskStartTime: Date.now(),
        recentActionEvents: {},
      });

      // Clear logger for the next task
      clearRuntimeLog();

      // Navigate to target screen if specified and valid
      if (nextTask && nextTask.targetScreen) {
        useMockpitStore.getState().setActiveView(nextTask.targetScreen);
      }
    } else {
      // All tasks finished! Open final feedback modal or complete session
      const questions = state.activeSession.testSnapshot.feedbackQuestions || [];
      if (questions.length > 0) {
        set({ showFeedbackModal: true });
      } else {
        // Complete session immediately if no feedback questions
        get().submitSessionFeedback([]);
      }
    }
  },

  submitSessionFeedback: (answers) => {
    const state = get();
    if (!state.activeSession) return;

    const completedSession: SessionRecord = {
      ...state.activeSession,
      status: 'completed',
      endedAt: Date.now(),
      feedbackAnswers: answers,
    };

    const updatedSessions = [completedSession, ...state.sessions];
    safeSetItem(STORAGE_SESSIONS_KEY, JSON.stringify(updatedSessions));

    set({
      sessions: updatedSessions,
      activeSession: null,
      isParticipantMode: false,
      showFeedbackModal: false,
      currentTaskIndex: 0,
      recentActionEvents: {},
      exitPromptOpen: false,
      activeTab: 'results',
    });

    // Return application mode to user-testing researcher suite
    useMockpitStore.getState().setScreenMode('user-testing');
  },

  exitSessionEarly: (abandon = true) => {
    const state = get();
    if (state.activeSession) {
      const endedSession: SessionRecord = {
        ...state.activeSession,
        status: abandon ? 'abandoned' : 'completed',
        endedAt: Date.now(),
      };
      const updatedSessions = [endedSession, ...state.sessions];
      safeSetItem(STORAGE_SESSIONS_KEY, JSON.stringify(updatedSessions));
      set({ sessions: updatedSessions });
    }

    set({
      activeSession: null,
      isParticipantMode: false,
      showFeedbackModal: false,
      currentTaskIndex: 0,
      recentActionEvents: {},
      exitPromptOpen: false,
      activeTab: 'results',
    });

    useMockpitStore.getState().setScreenMode('user-testing');
  },

  setExitPromptOpen: (open) => set({ exitPromptOpen: open }),

  // Settings & Security
  verifyMasterPassword: (input) => {
    const state = get();
    return hashPassword(input.trim()) === state.settings.masterPasswordHash;
  },

  setMasterPassword: (newPass) => {
    const updated: UserTestingSettings = {
      ...get().settings,
      masterPasswordHash: hashPassword(newPass.trim()),
    };
    safeSetItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
    set({ settings: updated });
  },

  updateSettings: (partial) => {
    const updated: UserTestingSettings = {
      ...get().settings,
      ...partial,
    };
    safeSetItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
    set({ settings: updated });
  },

  clearAllSessions: () => {
    safeRemoveItem(STORAGE_SESSIONS_KEY);
    set({ sessions: [] });
  },

  deleteSession: (sessionId) => {
    const updated = get().sessions.filter((s) => s.id !== sessionId);
    safeSetItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    set({ sessions: updated });
  },

  exportAllTestingData: () => {
    const state = get();
    const bundle = {
      version: '1.0',
      exportedAt: Date.now(),
      tests: state.tests,
      taskLibrary: state.taskLibrary,
      sessions: state.sessions,
      settings: state.settings,
    };
    return JSON.stringify(bundle, null, 2);
  },

  importTestingData: (jsonStr) => {
    try {
      const sanitizedStr = sanitizeCockpitToInfotainment(jsonStr);
      const parsed = JSON.parse(sanitizedStr);
      if (parsed && Array.isArray(parsed.tests)) {
        if (Array.isArray(parsed.tests)) {
          safeSetItem(STORAGE_TESTS_KEY, JSON.stringify(parsed.tests));
          set({ tests: parsed.tests });
        }
        if (Array.isArray(parsed.taskLibrary)) {
          safeSetItem(STORAGE_LIBRARY_KEY, JSON.stringify(parsed.taskLibrary));
          set({ taskLibrary: parsed.taskLibrary });
        }
        if (Array.isArray(parsed.sessions)) {
          safeSetItem(STORAGE_SESSIONS_KEY, JSON.stringify(parsed.sessions));
          set({ sessions: parsed.sessions });
        }
        return true;
      }
    } catch (e) {
      console.error('Failed to import user testing data', e);
    }
    return false;
  },
}));

// Automatic reactivity: subscribe to useMockpitStore state changes and evaluate active task criteria!
if (typeof window !== 'undefined' && typeof useMockpitStore?.subscribe === 'function') {
  useMockpitStore.subscribe(() => {
    const testingStore = useUserTestingStore.getState();
    if (testingStore.isParticipantMode && testingStore.activeSession) {
      testingStore.evaluateCurrentTask();
    }
  });

  // Listen globally for mockpit-action events
  window.addEventListener('mockpit-action' as any, ((e: CustomEvent<any>) => {
    const detail = e.detail;
    if (detail && detail.action) {
      useUserTestingStore.getState().recordActionEvent(detail.action, detail.value ?? detail);
    }
  }) as any);
}
