import {
  ScreenDefinition,
  ComponentInstance,
  VehicleState,
  ClimateState,
  VehicleBackgroundSettings,
  NotificationStackPosition,
} from '../types';
import {
  DEFAULT_VEHICLE_BACKGROUND,
} from '../store/useMockpitStore';
import exampleWorkspaceData from '../data/exampleWorkspace.json';

export interface MockpitWorkspaceData {
  screens: ScreenDefinition[];
  componentsByScreen: Record<string, ComponentInstance[]>;
  notificationComponents?: ComponentInstance[];
  notificationStackPosition?: NotificationStackPosition;
  activeView?: string;
  dockOrder?: string[];
  vehicleBackground?: VehicleBackgroundSettings;
  vehicleState?: Partial<VehicleState>;
  climateState?: Partial<ClimateState>;
}

export interface MockpitConfiguration {
  version: 1;
  schemaVersion: string;
  type: 'mockpit-configuration';
  metadata: {
    name: string;
    createdAt: string;
    description?: string;
    screenCount?: number;
    componentCount?: number;
  };
  workspace: MockpitWorkspaceData;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  config?: MockpitConfiguration;
}

/**
 * Validates a configuration object against the Mockpit workspace schema.
 */
export function validateWorkspaceConfiguration(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Configuration must be a valid JSON object.' };
  }

  const obj = data as Record<string, any>;

  // Check version and type
  if (obj.type && obj.type !== 'mockpit-configuration') {
    return { valid: false, error: `Invalid configuration type: "${obj.type}". Expected "mockpit-configuration".` };
  }

  if (obj.version !== undefined && obj.version !== 1) {
    return { valid: false, error: `Unsupported configuration version: ${obj.version}. Only version 1 is supported.` };
  }

  // Support both wrapped { workspace: { screens, ... } } and direct workspace objects
  const ws: any = obj.workspace || obj;

  if (!ws || typeof ws !== 'object') {
    return { valid: false, error: 'Configuration does not contain valid workspace data.' };
  }

  if (!Array.isArray(ws.screens)) {
    return { valid: false, error: 'Configuration "screens" property must be an array.' };
  }

  // Validate each screen
  for (let i = 0; i < ws.screens.length; i++) {
    const s = ws.screens[i];
    if (!s || typeof s !== 'object') {
      return { valid: false, error: `Screen at index ${i} is not a valid object.` };
    }
    if (typeof s.id !== 'string' || !s.id.trim()) {
      return { valid: false, error: `Screen at index ${i} is missing a valid "id" string.` };
    }
    if (typeof s.name !== 'string' || !s.name.trim()) {
      return { valid: false, error: `Screen "${s.id}" is missing a valid "name" string.` };
    }
  }

  // Validate componentsByScreen if present
  const componentsByScreen: Record<string, ComponentInstance[]> = {};
  if (ws.componentsByScreen) {
    if (typeof ws.componentsByScreen !== 'object' || Array.isArray(ws.componentsByScreen)) {
      return { valid: false, error: '"componentsByScreen" must be an object map of screen IDs to components.' };
    }
    for (const [screenId, list] of Object.entries(ws.componentsByScreen)) {
      if (!Array.isArray(list)) {
        return { valid: false, error: `Component list for screen "${screenId}" must be an array.` };
      }
      for (let j = 0; j < list.length; j++) {
        const c = list[j];
        if (!c || typeof c !== 'object') {
          return { valid: false, error: `Component at index ${j} in screen "${screenId}" is not a valid object.` };
        }
        if (typeof c.id !== 'string' || !c.id.trim()) {
          return { valid: false, error: `Component at index ${j} in screen "${screenId}" is missing an "id".` };
        }
        if (typeof c.type !== 'string' || !c.type.trim()) {
          return { valid: false, error: `Component "${c.id}" is missing a valid "type".` };
        }
      }
      componentsByScreen[screenId] = list as ComponentInstance[];
    }
  }

  // Validate notificationComponents if present
  let notificationComponents: ComponentInstance[] = [];
  if (ws.notificationComponents) {
    if (!Array.isArray(ws.notificationComponents)) {
      return { valid: false, error: '"notificationComponents" must be an array.' };
    }
    for (let j = 0; j < ws.notificationComponents.length; j++) {
      const c = ws.notificationComponents[j];
      if (!c || typeof c !== 'object' || typeof c.id !== 'string' || typeof c.type !== 'string') {
        return { valid: false, error: `Notification component at index ${j} is invalid.` };
      }
    }
    notificationComponents = ws.notificationComponents as ComponentInstance[];
  }

  // Compute stats
  const totalComponents = Object.values(componentsByScreen).reduce((acc, l) => acc + l.length, 0) + notificationComponents.length;

  const sanitizedConfig: MockpitConfiguration = {
    version: 1,
    schemaVersion: obj.schemaVersion || '1.0.0',
    type: 'mockpit-configuration',
    metadata: {
      name: typeof obj.metadata?.name === 'string' && obj.metadata.name.trim()
        ? obj.metadata.name.trim()
        : 'Imported Workspace',
      createdAt: typeof obj.metadata?.createdAt === 'string'
        ? obj.metadata.createdAt
        : new Date().toISOString(),
      description: typeof obj.metadata?.description === 'string' ? obj.metadata.description : undefined,
      screenCount: ws.screens.length,
      componentCount: totalComponents,
    },
    workspace: {
      screens: ws.screens,
      componentsByScreen,
      notificationComponents,
      notificationStackPosition: ws.notificationStackPosition || 'top-center',
      activeView: typeof ws.activeView === 'string' ? ws.activeView : ws.screens[0]?.id || '',
      dockOrder: Array.isArray(ws.dockOrder) ? ws.dockOrder : ws.screens.filter((s: any) => !s.parentId).map((s: any) => s.id),
      vehicleBackground: ws.vehicleBackground || DEFAULT_VEHICLE_BACKGROUND,
      vehicleState: ws.vehicleState,
      climateState: ws.climateState,
    },
  };

  return {
    valid: true,
    config: sanitizedConfig,
  };
}

export const EXAMPLE_COMPONENTS_BY_SCREEN: Record<string, ComponentInstance[]> = (
  exampleWorkspaceData as any
).workspace.componentsByScreen;

/**
 * Returns the completed example configuration from the bundled JSON source of truth.
 * Validates the data through validateWorkspaceConfiguration to guarantee full schema compliance.
 */
export function getBundledExampleConfiguration(): MockpitConfiguration {
  const result = validateWorkspaceConfiguration(exampleWorkspaceData);
  if (!result.valid || !result.config) {
    throw new Error(`Bundled example configuration is invalid: ${result.error}`);
  }
  return result.config;
}


/**
 * Formats a clean filename for exporting configuration.
 */
export function generateConfigFilename(name: string): string {
  const sanitized = (name || 'mockpit-workspace')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'mockpit-workspace';
  const dateStr = new Date().toISOString().split('T')[0];
  return `${sanitized}-${dateStr}.json`;
}

/**
 * Triggers a browser download of the configuration JSON file.
 */
export function downloadConfigurationFile(config: MockpitConfiguration, customName?: string): void {
  const jsonString = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const filename = generateConfigFilename(customName || config.metadata.name);

  if (typeof window === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
