import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Sliders, AlertTriangle } from 'lucide-react';
import { LibraryTask, TaskCriteria, TaskActionType, CriteriaOperator } from '../types';
import { useMockpitStore } from '../../store/useMockpitStore';
import { getComponentDisplayName } from '../../utils/componentDisplayNames';
import {
  getCriteriaFieldsForComponent,
  findRegistryEntry,
  CriteriaRegistryEntry,
} from '../criteriaRegistry';

interface TaskConfigModalProps {
  isOpen: boolean;
  initialTask?: Partial<LibraryTask>;
  onSave: (taskData: Omit<LibraryTask, 'id'>) => void;
  onClose: () => void;
  title?: string;
}

export const TaskConfigModal: React.FC<TaskConfigModalProps> = ({
  isOpen,
  initialTask,
  onSave,
  onClose,
  title = 'Configure Task',
}) => {
  const screens = useMockpitStore((s) => s.screens);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);

  const [name, setName] = useState(initialTask?.name || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [targetScreen, setTargetScreen] = useState(initialTask?.targetScreen || 'home');
  const [targetComponent, setTargetComponent] = useState(initialTask?.targetComponent || 'none');
  const [category, setCategory] = useState<any>(initialTask?.category || 'driving');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | undefined>(initialTask?.timeLimitSeconds);
  const [points, setPoints] = useState<number>(initialTask?.points || 100);

  // Criteria State
  const initCriteria = initialTask?.criteria || {
    type: 'state_field',
    field: 'speed',
    operator: '>=',
    expectedValue: 65,
  };

  const [criteriaType, setCriteriaType] = useState<TaskActionType>(initCriteria.type);
  const [criteriaField, setCriteriaField] = useState<string>(initCriteria.field || 'speed');
  const [criteriaOperator, setCriteriaOperator] = useState<CriteriaOperator>(initCriteria.operator || '=');
  const [criteriaValue, setCriteriaValue] = useState<string>(String(initCriteria.expectedValue ?? ''));

  // Target Screen options from live useMockpitStore
  const screenOptions = useMemo(() => {
    return screens.map((s) => {
      let label = s.name;
      if (s.parentId) {
        const parent = screens.find((p) => p.id === s.parentId);
        label = parent ? `${parent.name} / ${s.name}` : s.name;
      }
      return { id: s.id, label };
    });
  }, [screens]);

  // Check if targetScreen exists in live screens
  const isMissingScreen = useMemo(() => {
    return Boolean(targetScreen && !screens.some((s) => s.id === targetScreen));
  }, [screens, targetScreen]);

  // Distinct component types on selected screen
  const componentOptions = useMemo(() => {
    const list: { id: string; label: string; isMissing?: boolean }[] = [
      { id: 'none', label: 'None (screen-level task)' },
    ];

    const screenComps = componentsByScreen[targetScreen] || [];
    const seen = new Set<string>();
    screenComps.forEach((c) => {
      if (!seen.has(c.type)) {
        seen.add(c.type);
        list.push({ id: c.type, label: getComponentDisplayName(c.type) });
      }
    });

    // If targetComponent is not 'none' and not placed on this screen, preserve it with warning
    if (targetComponent && targetComponent !== 'none' && !seen.has(targetComponent)) {
      list.push({
        id: targetComponent,
        label: `${getComponentDisplayName(targetComponent)} (Not on this screen)`,
        isMissing: true,
      });
    }

    return list;
  }, [componentsByScreen, targetScreen, targetComponent]);

  const isComponentNotOnScreen = useMemo(() => {
    if (!targetComponent || targetComponent === 'none') return false;
    const screenComps = componentsByScreen[targetScreen] || [];
    return !screenComps.some((c) => c.type === targetComponent);
  }, [componentsByScreen, targetScreen, targetComponent]);

  // Available criteria fields for currently selected targetComponent
  const availableFields = useMemo(() => {
    return getCriteriaFieldsForComponent(targetComponent, screenOptions);
  }, [targetComponent, screenOptions]);

  // Check if current criteriaField is custom (not in registry)
  const isCustomField = useMemo(() => {
    if (!criteriaField) return false;
    return !availableFields.some((f) => f.id === criteriaField);
  }, [availableFields, criteriaField]);

  // Active registry entry
  const activeRegistryEntry = useMemo(() => {
    return findRegistryEntry(criteriaField, targetComponent);
  }, [criteriaField, targetComponent]);

  // Operators allowed for current field
  const availableOperators: CriteriaOperator[] = useMemo(() => {
    if (activeRegistryEntry && activeRegistryEntry.operators.length > 0) {
      return activeRegistryEntry.operators;
    }
    return ['=', '!=', '>=', '<=', '>', '<', 'includes'];
  }, [activeRegistryEntry]);

  useEffect(() => {
    if (isOpen) {
      setName(initialTask?.name || '');
      setDescription(initialTask?.description || '');
      const screenId = initialTask?.targetScreen || (screens[0]?.id || 'home');
      setTargetScreen(screenId);
      setTargetComponent(initialTask?.targetComponent || 'none');
      setCategory(initialTask?.category || 'driving');
      setTimeLimitSeconds(initialTask?.timeLimitSeconds);
      setPoints(initialTask?.points || 100);

      const criteria = initialTask?.criteria || {
        type: 'state_field',
        field: 'speed',
        operator: '>=',
        expectedValue: 65,
      };
      setCriteriaType(criteria.type);
      setCriteriaField(criteria.field || 'speed');
      setCriteriaOperator(criteria.operator || '=');
      setCriteriaValue(String(criteria.expectedValue ?? ''));
    }
  }, [isOpen, initialTask, screens]);

  if (!isOpen) return null;

  const handleScreenChange = (newScreen: string) => {
    setTargetScreen(newScreen);
    // targetComponent remains selected; if not on newScreen it will show with warning
  };

  const handleComponentChange = (newComp: string) => {
    setTargetComponent(newComp);
    const fields = getCriteriaFieldsForComponent(newComp, screenOptions);
    if (fields.length > 0) {
      const first = fields[0];
      setCriteriaField(first.id);
      setCriteriaType(first.criteriaType);
      setCriteriaOperator(first.operators[0]);
      if (first.valueType === 'boolean') {
        setCriteriaValue('true');
      } else if (first.valueType === 'enum') {
        setCriteriaValue(first.options?.[0] || '');
      } else if (first.valueType === 'number') {
        setCriteriaValue(String(first.min !== undefined ? first.min : 0));
      } else {
        setCriteriaValue('');
      }
    }
  };

  const handleFieldChange = (newField: string) => {
    setCriteriaField(newField);
    const entry = findRegistryEntry(newField, targetComponent);
    if (entry) {
      setCriteriaType(entry.criteriaType);
      if (!entry.operators.includes(criteriaOperator)) {
        setCriteriaOperator(entry.operators[0]);
      }
      if (entry.valueType === 'boolean') {
        if (criteriaValue !== 'true' && criteriaValue !== 'false') {
          setCriteriaValue('true');
        }
      } else if (entry.valueType === 'enum') {
        if (!entry.options?.includes(criteriaValue)) {
          setCriteriaValue(entry.options?.[0] || '');
        }
      } else if (entry.valueType === 'number') {
        if (isNaN(Number(criteriaValue)) || criteriaValue === '') {
          setCriteriaValue(String(entry.min !== undefined ? entry.min : 0));
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedExpectedValue: any = criteriaValue;
    if (
      activeRegistryEntry?.valueType === 'boolean' ||
      criteriaValue === 'true' ||
      criteriaValue === 'false'
    ) {
      parsedExpectedValue = criteriaValue === 'true' || criteriaValue === '1';
    } else if (activeRegistryEntry?.valueType === 'number') {
      parsedExpectedValue = !isNaN(Number(criteriaValue)) && criteriaValue.trim() !== ''
        ? Number(criteriaValue)
        : criteriaValue;
    } else if (activeRegistryEntry?.valueType === 'string') {
      parsedExpectedValue = String(criteriaValue);
    } else if (!isNaN(Number(criteriaValue)) && criteriaValue.trim() !== '') {
      parsedExpectedValue = Number(criteriaValue);
    }

    const criteria: TaskCriteria = {
      type: criteriaType,
      field: criteriaField,
      operator: criteriaOperator,
      expectedValue: parsedExpectedValue,
    };

    onSave({
      name: name.trim() || 'Untitled Task',
      description: description.trim() || 'No description provided.',
      targetScreen,
      targetComponent,
      category,
      timeLimitSeconds: timeLimitSeconds && timeLimitSeconds > 0 ? timeLimitSeconds : undefined,
      points: points > 0 ? points : 100,
      criteria,
      isBuiltin: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-5 my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 text-slate-100">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 block">Task Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Increase speed"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Natural Language Instruction */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 block">
              Natural-Language Participant Instruction
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Increase vehicle speed to at least 65 mph using the Speedometer on the display."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors resize-none"
            />
          </div>

          {/* Target Screen & Component */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 block">Target Screen</label>
              <select
                id="target-screen-select"
                data-testid="target-screen-select"
                value={targetScreen}
                onChange={(e) => handleScreenChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
              >
                {isMissingScreen && (
                  <option value={targetScreen}>
                    Missing screen ({targetScreen})
                  </option>
                )}
                {screenOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {isMissingScreen && (
                <div
                  id="missing-screen-warning"
                  data-testid="missing-screen-warning"
                  className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Missing screen ({targetScreen})</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 block">Target Component</label>
              <select
                id="target-component-select"
                data-testid="target-component-select"
                value={targetComponent}
                onChange={(e) => handleComponentChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
              >
                {componentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              {isComponentNotOnScreen && (
                <div
                  id="missing-component-warning"
                  data-testid="missing-component-warning"
                  className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Component not placed on this screen</span>
                </div>
              )}
            </div>
          </div>

          {/* Deterministic Completion Criteria Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 block tracking-wider uppercase font-mono">
                Deterministic Completion Criteria
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {criteriaType}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Field / Action Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block">Field / Action</label>
                <select
                  id="criteria-field-select"
                  data-testid="criteria-field-select"
                  value={criteriaField}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
                >
                  {isCustomField && (
                    <option value={criteriaField}>
                      Custom: {criteriaField}
                    </option>
                  )}
                  {availableFields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block">Operator</label>
                <select
                  id="criteria-operator-select"
                  data-testid="criteria-operator-select"
                  value={criteriaOperator}
                  onChange={(e) => setCriteriaOperator(e.target.value as CriteriaOperator)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
                >
                  {availableOperators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Value */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block">Expected Value</label>
                {activeRegistryEntry?.valueType === 'boolean' ? (
                  <select
                    id="criteria-value-select"
                    data-testid="criteria-value-select"
                    value={criteriaValue === 'false' ? 'false' : 'true'}
                    onChange={(e) => setCriteriaValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
                  >
                    <option value="true">Yes / True</option>
                    <option value="false">No / False</option>
                  </select>
                ) : activeRegistryEntry?.valueType === 'enum' ? (
                  <select
                    id="criteria-value-select"
                    data-testid="criteria-value-select"
                    value={criteriaValue}
                    onChange={(e) => setCriteriaValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
                  >
                    {activeRegistryEntry.options?.map((opt) => {
                      let label = opt;
                      if (activeRegistryEntry.id === 'activeView') {
                        const scr = screenOptions.find((s) => s.id === opt);
                        if (scr) label = scr.label;
                      }
                      return (
                        <option key={opt} value={opt}>
                          {label}
                        </option>
                      );
                    })}
                    {criteriaValue &&
                      !activeRegistryEntry.options?.includes(criteriaValue) && (
                        <option value={criteriaValue}>
                          {criteriaValue} (Custom)
                        </option>
                      )}
                  </select>
                ) : activeRegistryEntry?.valueType === 'number' ? (
                  <div className="space-y-1">
                    <input
                      id="criteria-value-input"
                      data-testid="criteria-value-input"
                      type="number"
                      min={activeRegistryEntry.min}
                      max={activeRegistryEntry.max}
                      value={criteriaValue}
                      onChange={(e) => setCriteriaValue(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
                    />
                    {(activeRegistryEntry.min !== undefined ||
                      activeRegistryEntry.max !== undefined) && (
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Range: {activeRegistryEntry.min ?? 0} – {activeRegistryEntry.max ?? 'max'}
                      </span>
                    )}
                  </div>
                ) : (
                  <input
                    id="criteria-value-input"
                    data-testid="criteria-value-input"
                    type="text"
                    value={criteriaValue}
                    onChange={(e) => setCriteriaValue(e.target.value)}
                    placeholder="value..."
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
                  />
                )}
              </div>
            </div>

            {/* Custom Field Warning */}
            {isCustomField && (
              <div
                id="custom-field-warning"
                data-testid="custom-field-warning"
                className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-lg"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Custom: {criteriaField} (not in registry)</span>
              </div>
            )}
          </div>

          {/* Time Limit & Points */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 block">
                Time Limit (Seconds, Optional)
              </label>
              <input
                type="number"
                min="0"
                value={timeLimitSeconds !== undefined ? timeLimitSeconds : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                  setTimeLimitSeconds(val);
                }}
                placeholder="No limit (untimed)"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 block">Points Value</label>
              <input
                type="number"
                min="10"
                step="5"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer shadow-md whitespace-nowrap shrink-0"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
