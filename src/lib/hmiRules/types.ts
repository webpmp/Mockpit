import { ComponentInstance, ScreenDefinition } from '../../types';

export type RuleTier = 'static' | 'runtime' | 'manual';
export type RuleStatus = 'pass' | 'fail' | 'warning' | 'not-measured' | 'needs-review' | 'reviewed';
export type RuleCategory =
  | 'timing'
  | 'ia'
  | 'visual'
  | 'modality'
  | 'interaction'
  | 'overlay'
  | 'feedback'
  | 'content'
  | 'palette';

export interface DisplayConfig {
  displayDiagonalInches: number; // e.g. 12.3"
  displayWidthMM: number;         // e.g. 272.3 mm for 12.3" 16:9
  displayHeightMM: number;        // e.g. 153.2 mm
  viewingDistanceMM: number;      // e.g. 700 mm typical driver eye-to-display
}

export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  displayDiagonalInches: 12.3,
  displayWidthMM: 272.3,
  displayHeightMM: 153.2,
  viewingDistanceMM: 700,
};

export interface InteractionLogEntry {
  id: string;
  timestamp: number;
  eventType: 'click' | 'tap' | 'input' | 'transition' | 'voice' | 'drag';
  targetId?: string;
  targetType?: string;
  screenId: string;
  latencyMs: number;        // visual feedback latency
  responseTimeMs: number;   // total action response time
  transitionDurationMs?: number;
  details?: string;
}

export interface NavNode {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  children?: NavNode[];
}

export interface AuditContext {
  screenId: string;
  allScreens?: boolean;
  instances: ComponentInstance[];
  componentsByScreen: Record<string, ComponentInstance[]>;
  screens: ScreenDefinition[];
  navTree: NavNode[];
  runtimeLog?: InteractionLogEntry[];
  displayConfig: DisplayConfig;
  canvasScale?: number;
  activeTrip?: any;
}

export interface RuleFinding {
  ruleId: string;
  status: RuleStatus;
  instanceId?: string;
  screenId?: string;
  message: string;
  measured?: number | string;
  threshold?: string;
  heuristicGlanceCount?: number;
  details?: string;
  standardRef?: string;
}

export interface HMIRule {
  id: string;
  category: RuleCategory;
  title: string;
  description: string;
  standardRef: string;
  tier: RuleTier;
  source: string;
  addedDate: string;
  addedBy?: 'anthropic-research' | 'user-proposed' | string;
  check?: (ctx: AuditContext) => RuleFinding[];
}

export interface RuleProposal {
  id: string;
  title: string;
  description: string;
  category: RuleCategory;
  tier: 'static' | 'runtime' | 'manual';
  standardRef: string;
  thresholdIntent: string;
  createdAt: string;
  status: 'draft' | 'exported';
}
