import { ComponentType, GearState, DriveModeState, InteractionLogEntry } from '../types';

export type TaskActionType =
  | 'state_field'       // VehicleState field (speed, gear, driveMode, batteryPercent, etc.)
  | 'climate_field'     // ClimateState field (driverTemp, fanSpeed, driverSeatHeat, etc.)
  | 'screen_navigate'   // Navigated to a specific screen (activeView === targetScreen)
  | 'trip_guidance'     // Active trip planned or started
  | 'action_event'      // Custom Mockpit user action (sendDiagnosticReport, dialPhone, changeBatteryUnit, playTrack)
  | 'media_service'     // Selected media service changed (e.g. Spotify)
  | 'composite';        // Multiple conditions must all be satisfied

export type CriteriaOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'includes';

export interface SingleCriteria {
  type: TaskActionType;
  field?: string;
  operator?: CriteriaOperator;
  expectedValue: any;
  label?: string;
}

export interface TaskCriteria {
  type: TaskActionType;
  field?: string;
  operator?: CriteriaOperator;
  expectedValue?: any;
  subCriteria?: SingleCriteria[];
}

export interface LibraryTask {
  id: string;
  name: string;
  description: string; // Natural-language instructions for participant/researcher
  targetScreen: string; // e.g. 'home', 'media', 'phone', 'navigation', 'climate', 'weather-radar'
  targetComponent: ComponentType | string; // e.g. 'speed', 'gear', 'climateTemp', etc.
  criteria: TaskCriteria;
  timeLimitSeconds?: number; // Optional countdown limit
  points: number; // e.g. 100
  category?: 'driving' | 'climate' | 'media' | 'phone' | 'navigation' | 'diagnostics' | 'custom';
  isBuiltin?: boolean;
}

export interface TestTask extends LibraryTask {
  instanceId: string; // Unique instance id in the test
  libraryTaskId?: string; // Reference to original library task
  order: number;
}

export type FeedbackQuestionType = 'rating' | 'text' | 'choice';

export interface FeedbackQuestion {
  id: string;
  prompt: string;
  type: FeedbackQuestionType;
  options?: string[]; // For 'choice' questions
  required?: boolean;
}

export interface FeedbackAnswer {
  questionId: string;
  prompt: string;
  type: FeedbackQuestionType;
  value: string | number;
}

export interface TestDefinition {
  id: string;
  name: string;
  goal: string;
  notes?: string;
  tasks: TestTask[];
  feedbackQuestions: FeedbackQuestion[];
  createdAt: number;
  updatedAt: number;
}

export interface TaskResult {
  instanceId: string;
  taskId: string;
  taskName: string;
  description: string;
  targetScreen: string;
  targetComponent: string;
  status: 'completed' | 'timeout' | 'skipped';
  durationSeconds: number;
  pointsEarned: number;
  maxPoints: number;
  completedAt?: number;
  interactionsCount: number;
  interactions: InteractionLogEntry[];
}

export interface SessionRecord {
  id: string;
  testId: string;
  testName: string;
  participantId: string;
  startedAt: number;
  endedAt?: number;
  status: 'in-progress' | 'completed' | 'abandoned';
  testSnapshot: TestDefinition; // Immutable snapshot of test and tasks
  taskResults: TaskResult[];
  feedbackAnswers: FeedbackAnswer[];
  totalPoints: number;
  maxPoints: number;
  totalDurationSeconds: number;
  researcherNotes?: string;
}

export interface UserTestingSettings {
  masterPasswordHash: string; // Stored securely in settings
  requirePasswordToExit: boolean;
  requirePasswordToEdit: boolean;
}

export interface AggregateTaskStats {
  taskId: string;
  taskName: string;
  totalAttempts: number;
  completedCount: number;
  timeoutCount: number;
  skippedCount: number;
  completionRate: number; // 0 - 100%
  avgDurationSeconds: number;
  avgPointsEarned: number;
}

export interface AggregateTestMetrics {
  testId: string;
  testName: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  avgSessionDurationSeconds: number;
  avgTotalScore: number;
  maxScore: number;
  taskStats: AggregateTaskStats[];
}
