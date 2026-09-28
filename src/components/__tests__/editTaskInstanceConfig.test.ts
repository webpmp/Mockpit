import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CRITERIA_REGISTRY,
  getCriteriaFieldsForComponent,
  findRegistryEntry,
} from '../../testing/criteriaRegistry';
import {
  evaluateSingleCriteria,
  EvaluationState,
} from '../../testing/evaluationEngine';
import { useMockpitStore, DEFAULT_SCREENS } from '../../store/useMockpitStore';

describe('Edit Task Instance: Real Screens, Components, and Field/Action Dropdowns — Spec v1 Suite', () => {
  const modalFilePath = path.resolve(
    process.cwd(),
    'src/testing/components/TaskConfigModal.tsx'
  );
  const modalSource = fs.readFileSync(modalFilePath, 'utf-8');

  it('1. Criteria Registry: every action_event field matches an action name dispatched in src/', () => {
    // Scan all action_event entries in CRITERIA_REGISTRY
    const actionFields = new Set<string>();
    Object.values(CRITERIA_REGISTRY).forEach((entries) => {
      entries.forEach((entry) => {
        if (entry.kind === 'action_event') {
          actionFields.add(entry.id);
        }
      });
    });

    assert.ok(actionFields.size > 0, 'Must have registered action_events');

    // Read all source files in src/ to find dispatched action names
    const searchDir = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory() && ent.name !== 'node_modules' && ent.name !== '.git') {
          files.push(...searchDir(full));
        } else if (ent.isFile() && (ent.name.endsWith('.tsx') || ent.name.endsWith('.ts'))) {
          files.push(full);
        }
      }
      return files;
    };

    const allSourceFiles = searchDir(path.resolve(process.cwd(), 'src'));
    const combinedSource = allSourceFiles
      .map((f) => fs.readFileSync(f, 'utf-8'))
      .join('\n');

    // For every action_event in registry, verify it is dispatched in source code
    for (const actionName of actionFields) {
      const dispatchPattern = new RegExp(
        `(?:action|type):\\s*['"\`]${actionName}['"\`]|detail:\\s*\\{\\s*action:\\s*['"\`]${actionName}['"\`]`
      );
      assert.ok(
        dispatchPattern.test(combinedSource),
        `Action event "${actionName}" must be dispatched via mockpit-action or CustomEvent in src/`
      );
    }
  });

  it('2. Criteria Registry: every state field resolves properly in evaluationEngine', () => {
    // Mock EvaluationState populated with test values
    const mockState: EvaluationState = {
      vehicleState: {
        speed: 70,
        gear: 'D',
        batteryPercent: 85,
        isCharging: false,
        doorOpen: false,
        driveMode: 'Sport',
        tirePressureWarning: false,
      },
      climateState: {
        driverTemp: 72,
        passengerTemp: 70,
        selectedSeat: 'driver',
        fanSpeed: 'MED',
        driverSeatHeat: 2,
        driverSeatCool: 0,
        passengerSeatHeat: 1,
        passengerSeatCool: 0,
      },
      activeView: 'navigation',
      activeTrip: {
        destinationName: 'San Francisco',
        stops: [],
      } as any,
      selectedMusicService: 'Spotify',
      recentActionEvents: {},
    };

    const stateFields = new Map<string, { criteriaType: string; expectedValue: any }>();
    Object.values(CRITERIA_REGISTRY).forEach((entries) => {
      entries.forEach((entry) => {
        if (entry.kind === 'state') {
          let testVal: any = true;
          if (entry.id === 'speed') testVal = 70;
          else if (entry.id === 'gear') testVal = 'D';
          else if (entry.id === 'driveMode') testVal = 'Sport';
          else if (entry.id === 'batteryPercent') testVal = 85;
          else if (entry.id === 'tirePressureWarning') testVal = false;
          else if (entry.id === 'driverTemp') testVal = 72;
          else if (entry.id === 'passengerTemp') testVal = 70;
          else if (entry.id === 'driverSeatHeat') testVal = 2;
          else if (entry.id === 'driverSeatCool') testVal = 0;
          else if (entry.id === 'passengerSeatHeat') testVal = 1;
          else if (entry.id === 'passengerSeatCool') testVal = 0;
          else if (entry.id === 'fanSpeed') testVal = 'MED';
          else if (entry.id === 'selectedMusicService') testVal = 'Spotify';
          else if (entry.id === 'activeTrip') testVal = true;
          else if (entry.id === 'activeView') testVal = 'navigation';

          stateFields.set(entry.id, {
            criteriaType: entry.criteriaType,
            expectedValue: testVal,
          });
        }
      });
    });

    assert.ok(stateFields.size > 0, 'Must have registered state fields');

    // Confirm every single state field evaluates in the engine
    for (const [fieldId, info] of stateFields) {
      const evaluated = evaluateSingleCriteria(
        {
          type: info.criteriaType as any,
          field: fieldId,
          operator: '=',
          expectedValue: info.expectedValue,
        },
        mockState
      );
      assert.equal(
        evaluated,
        true,
        `Field "${fieldId}" of type "${info.criteriaType}" must evaluate and resolve in evaluationEngine`
      );
    }
  });

  it('3. Target Screen: TaskConfigModal builds screen options from live useMockpitStore screens, omitting hardcoded non-existent screens', () => {
    // Confirm hardcoded SCREENS array with "climate" is deleted from TaskConfigModal
    assert.doesNotMatch(
      modalSource,
      /const SCREENS\s*=/,
      'TaskConfigModal must not hardcode SCREENS array'
    );
    assert.doesNotMatch(
      modalSource,
      /\{ id: 'climate', label: 'Climate Control' \}/,
      'Hardcoded non-existent climate screen must be dropped'
    );

    // Confirm it accesses screens from store
    assert.match(
      modalSource,
      /useMockpitStore\(\(s\)\s*=>\s*s\.screens\)/,
      'Must read live screens from useMockpitStore'
    );

    // Verify parent/child labeling logic is present
    assert.match(
      modalSource,
      /parent\s*\?\s*`\$\{parent\.name\}\s*\/\s*\$\{s\.name\}`/,
      'Must display parent screen name for child screens (e.g. Weather / Radar)'
    );

    // Verify missing screen warning is handled
    assert.match(
      modalSource,
      /Missing screen \(/,
      'Must render "Missing screen (id)" when saved screen does not exist'
    );
    assert.match(
      modalSource,
      /id="missing-screen-warning"/,
      'Must render warning element for missing screen'
    );
  });

  it('4. Target Component: TaskConfigModal populates components from componentsByScreen and supports "None (screen-level task)"', () => {
    // Confirm hardcoded COMPONENTS list is dropped
    assert.doesNotMatch(
      modalSource,
      /const COMPONENTS\s*=/,
      'TaskConfigModal must not hardcode COMPONENTS array'
    );

    // Confirm it reads componentsByScreen from store
    assert.match(
      modalSource,
      /useMockpitStore\(\(s\)\s*=>\s*s\.componentsByScreen\)/,
      'Must read live componentsByScreen from useMockpitStore'
    );

    // Confirm "None (screen-level task)" option is present
    assert.match(
      modalSource,
      /None \(screen-level task\)/,
      'Must include "None (screen-level task)" option'
    );

    // Confirm warning when saved component is not on selected screen
    assert.match(
      modalSource,
      /\(Not on this screen\)/,
      'Must display "(Not on this screen)" for missing component'
    );
    assert.match(
      modalSource,
      /id="missing-component-warning"/,
      'Must render warning badge for component not placed on screen'
    );
  });

  it('5. Field / Action: TaskConfigModal renders registry options, custom field warning, and constrained operators', () => {
    // Confirm criteriaRegistry helpers are imported
    assert.match(
      modalSource,
      /getCriteriaFieldsForComponent/,
      'Must import getCriteriaFieldsForComponent'
    );
    assert.match(
      modalSource,
      /findRegistryEntry/,
      'Must import findRegistryEntry'
    );

    // Confirm custom field handling with "Custom: <field>" and warning
    assert.match(
      modalSource,
      /Custom:\s*\{criteriaField\}/,
      'Must show "Custom: <field>" in dropdown for legacy/custom fields'
    );
    assert.match(
      modalSource,
      /id="custom-field-warning"/,
      'Must render custom-field-warning alert badge'
    );

    // Confirm operator constraints are present
    assert.match(
      modalSource,
      /availableOperators/,
      'Must constrain operators to field registry'
    );

    // Confirm expected value renders input by valueType (boolean, enum, number, string)
    assert.match(
      modalSource,
      /activeRegistryEntry\?\.valueType === 'boolean'/,
      'Must handle boolean valueType'
    );
    assert.match(
      modalSource,
      /activeRegistryEntry\?\.valueType === 'enum'/,
      'Must handle enum valueType'
    );
    assert.match(
      modalSource,
      /activeRegistryEntry\?\.valueType === 'number'/,
      'Must handle number valueType with range'
    );
  });

  it('6. Criteria Registry: Specific required components offer their required fields', () => {
    // Battery: changeBatteryUnit (enum) and batteryPercent (number)
    const batteryFields = getCriteriaFieldsForComponent('battery');
    assert.ok(batteryFields.some((f) => f.id === 'changeBatteryUnit' && f.kind === 'action_event'));
    assert.ok(batteryFields.some((f) => f.id === 'batteryPercent' && f.kind === 'state'));

    // Send Diagnostics: sendDiagnosticReport (boolean action_event)
    const diagFields = getCriteriaFieldsForComponent('sendToServiceCenter');
    assert.ok(diagFields.some((f) => f.id === 'sendDiagnosticReport' && f.kind === 'action_event' && f.valueType === 'boolean'));

    // Media: playTrack (boolean action_event) and selectedMusicService (enum state)
    const mediaFields = getCriteriaFieldsForComponent('media');
    assert.ok(mediaFields.some((f) => f.id === 'playTrack' && f.kind === 'action_event'));
    assert.ok(mediaFields.some((f) => f.id === 'selectedMusicService' && f.kind === 'state'));

    // Speed: speed (number state)
    const speedFields = getCriteriaFieldsForComponent('speed');
    assert.ok(speedFields.some((f) => f.id === 'speed' && f.kind === 'state' && f.valueType === 'number'));

    // Phone Dial Pad: dialPhone (string action_event with 'includes')
    const phoneFields = getCriteriaFieldsForComponent('phoneDialPad');
    assert.ok(phoneFields.some((f) => f.id === 'dialPhone' && f.operators.includes('includes')));

    // Navigation / Trip Planner: searchDestination and addStop
    const navFields = getCriteriaFieldsForComponent('navDestination');
    assert.ok(navFields.some((f) => f.id === 'addStop' && f.kind === 'action_event'));
    assert.ok(navFields.some((f) => f.id === 'searchDestination' && f.kind === 'action_event'));

    // Screen-level: activeView
    const screenLevelFields = getCriteriaFieldsForComponent('none', [
      { id: 'home', label: 'Home' },
      { id: 'navigation', label: 'Navigation' },
      { id: 'vehicle', label: 'Vehicle' },
    ]);
    const activeViewField = screenLevelFields.find((f) => f.id === 'activeView');
    assert.ok(activeViewField);
    assert.ok(activeViewField.options?.includes('vehicle'));
  });
});
