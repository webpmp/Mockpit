import React, { useState, useEffect } from 'react';
import { X, Check, Sliders } from 'lucide-react';
import { LibraryTask, TaskCriteria, TaskActionType, CriteriaOperator } from '../types';

interface TaskConfigModalProps {
  isOpen: boolean;
  initialTask?: Partial<LibraryTask>;
  onSave: (taskData: Omit<LibraryTask, 'id'>) => void;
  onClose: () => void;
  title?: string;
}

const SCREENS = [
  { id: 'home', label: 'Home Screen' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'media', label: 'Media Player' },
  { id: 'phone', label: 'Phone' },
  { id: 'weather', label: 'Weather' },
  { id: 'weather-radar', label: 'Weather Radar' },
  { id: 'climate', label: 'Climate Control' },
];

const COMPONENTS = [
  { id: 'speed', label: 'Speedometer' },
  { id: 'gear', label: 'Gear Indicator' },
  { id: 'driveMode', label: 'Drive Mode Selector' },
  { id: 'battery', label: 'Battery Indicator' },
  { id: 'climateTemp', label: 'Temperature Slider' },
  { id: 'climateSeats', label: 'Seat Climate (Heat/Cool)' },
  { id: 'climateVent', label: 'Vent Dashboard' },
  { id: 'phoneDialPad', label: 'Phone Dial Pad' },
  { id: 'phoneContacts', label: 'Contacts' },
  { id: 'media', label: 'Music Media Player' },
  { id: 'sendToServiceCenter', label: 'Send Diagnostics' },
  { id: 'map', label: 'Navigation Map' },
  { id: 'navFavorites', label: 'Saved Favorites & Recents' },
  { id: 'navSearch', label: 'Navigation Search' },
  { id: 'navDestination', label: 'Trip Planner' },
];

const CRITERIA_TYPES: { id: TaskActionType; label: string }[] = [
  { id: 'state_field', label: 'Vehicle State Field (Speed, Gear, Drive Mode, etc.)' },
  { id: 'climate_field', label: 'Climate State Field (Temp, Fan, Seat Heat)' },
  { id: 'action_event', label: 'Action Event (Diagnostics Sent, Phone Dialed, etc.)' },
  { id: 'screen_navigate', label: 'Screen Navigation (User views specific screen)' },
  { id: 'trip_guidance', label: 'Trip Route Guidance Active' },
  { id: 'media_service', label: 'Media Service Selected (Spotify, etc.)' },
];

export const TaskConfigModal: React.FC<TaskConfigModalProps> = ({
  isOpen,
  initialTask,
  onSave,
  onClose,
  title = 'Configure Task',
}) => {
  const [name, setName] = useState(initialTask?.name || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [targetScreen, setTargetScreen] = useState(initialTask?.targetScreen || 'home');
  const [targetComponent, setTargetComponent] = useState(initialTask?.targetComponent || 'speed');
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

  useEffect(() => {
    if (isOpen) {
      setName(initialTask?.name || '');
      setDescription(initialTask?.description || '');
      setTargetScreen(initialTask?.targetScreen || 'home');
      setTargetComponent(initialTask?.targetComponent || 'speed');
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
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedExpectedValue: any = criteriaValue;
    if (criteriaValue === 'true') parsedExpectedValue = true;
    else if (criteriaValue === 'false') parsedExpectedValue = false;
    else if (!isNaN(Number(criteriaValue)) && criteriaValue.trim() !== '') {
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
                value={targetScreen}
                onChange={(e) => setTargetScreen(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
              >
                {SCREENS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 block">Target Component</label>
              <select
                value={targetComponent}
                onChange={(e) => setTargetComponent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500"
              >
                {COMPONENTS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deterministic Completion Criteria Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-sky-400 block tracking-wider uppercase font-mono">
              Deterministic Completion Criteria
            </span>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block">Condition Type</label>
              <select
                value={criteriaType}
                onChange={(e) => {
                  const newType = e.target.value as TaskActionType;
                  setCriteriaType(newType);
                  if (newType === 'state_field') {
                    setCriteriaField('speed');
                    setCriteriaOperator('>=');
                    setCriteriaValue('65');
                  } else if (newType === 'climate_field') {
                    setCriteriaField('driverTemp');
                    setCriteriaOperator('=');
                    setCriteriaValue('72');
                  } else if (newType === 'action_event') {
                    setCriteriaField('sendDiagnosticReport');
                    setCriteriaOperator('=');
                    setCriteriaValue('true');
                  } else if (newType === 'screen_navigate') {
                    setCriteriaField('activeView');
                    setCriteriaOperator('=');
                    setCriteriaValue('navigation');
                  } else if (newType === 'media_service') {
                    setCriteriaField('selectedMusicService');
                    setCriteriaOperator('=');
                    setCriteriaValue('Spotify');
                  } else if (newType === 'trip_guidance') {
                    setCriteriaField('activeTrip');
                    setCriteriaOperator('=');
                    setCriteriaValue('true');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-sky-500"
              >
                {CRITERIA_TYPES.map((ct) => (
                  <option key={ct.id} value={ct.id}>{ct.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block">Field / Action</label>
                <input
                  type="text"
                  value={criteriaField}
                  onChange={(e) => setCriteriaField(e.target.value)}
                  placeholder="field name..."
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block">Operator</label>
                <select
                  value={criteriaOperator}
                  onChange={(e) => setCriteriaOperator(e.target.value as CriteriaOperator)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value="includes">includes</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 block">Expected Value</label>
                <input
                  type="text"
                  value={criteriaValue}
                  onChange={(e) => setCriteriaValue(e.target.value)}
                  placeholder="value..."
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
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
