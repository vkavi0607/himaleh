import React, { useState } from 'react';
import { Routine, RoutineFrequency, RoutinePriority, TaskType } from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { Zap, X, Check, Clock } from 'lucide-react';

interface QuickRoutinePreset {
  name: string;
  category: string;
  hour: number;
  minute: number;
  taskType: TaskType;
  targetVal: number;
  unit: string;
}

interface QuickAddRoutineModalProps {
  onDismiss: () => void;
  onSave: (routine: Routine) => void;
}

export const QuickAddRoutineModal: React.FC<QuickAddRoutineModalProps> = ({
  onDismiss,
  onSave,
}) => {
  const presets: QuickRoutinePreset[] = [
    { name: 'Morning Meditation', category: 'Mindset', hour: 7, minute: 0, taskType: TaskType.DURATION, targetVal: 15, unit: 'min' },
    { name: 'Drink 2L Water', category: 'Health', hour: 8, minute: 0, taskType: TaskType.QUANTITY, targetVal: 2, unit: 'L' },
    { name: 'Deep Focus Block', category: 'Work', hour: 9, minute: 30, taskType: TaskType.DURATION, targetVal: 45, unit: 'min' },
    { name: '30 min Workout', category: 'Fitness', hour: 18, minute: 0, taskType: TaskType.DURATION, targetVal: 30, unit: 'min' },
    { name: 'Read 20 Pages', category: 'Study', hour: 21, minute: 0, taskType: TaskType.COUNT, targetVal: 20, unit: 'pages' },
    { name: 'Daily Journaling', category: 'Personal', hour: 21, minute: 30, taskType: TaskType.CHECKBOX, targetVal: 1, unit: '' },
  ];

  const [name, setName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<QuickRoutinePreset | null>(null);
  const [timeHour, setTimeHour] = useState(8);
  const [timeMinute, setTimeMinute] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (preset: QuickRoutinePreset) => {
    setSelectedPreset(preset);
    setName(preset.name);
    setTimeHour(preset.hour);
    setTimeMinute(preset.minute);
    setError(null);
  };

  const timePresets = [
    { label: '07:00 AM', hour: 7, minute: 0 },
    { label: '09:00 AM', hour: 9, minute: 0 },
    { label: '12:00 PM', hour: 12, minute: 0 },
    { label: '06:00 PM', hour: 18, minute: 0 },
    { label: '09:00 PM', hour: 21, minute: 0 },
    { label: '10:30 PM', hour: 22, minute: 30 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter or select a routine name');
      return;
    }

    const preset = selectedPreset;
    const routine: Routine = {
      id: Date.now(),
      name: name.trim(),
      description: '',
      category: preset?.category || 'Personal',
      linkedGoalId: null,
      startDate: ProgressCalculationEngine.getTodayStr(),
      endDate: null,
      timeHour,
      timeMinute,
      durationMinutes: 30,
      frequency: RoutineFrequency.DAILY,
      frequencyDays: '1,2,3,4,5,6,7',
      weeklyTargetTimes: 7,
      taskType: preset?.taskType || TaskType.CHECKBOX,
      targetValue: preset?.targetVal || 1.0,
      unit: preset?.unit || '',
      priority: RoutinePriority.MEDIUM,
      reminderEnabled: true,
      isPaused: false,
      createdAt: Date.now(),
    };

    onSave(routine);
  };

  return (
    <div
      id="quick-add-sheet"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Quick Add Routine
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Pick a popular ritual or type custom name
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-lg p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Preset chips grid */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
              Habit Templates
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => {
                const isSelected = selectedPreset?.name === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`rounded-xl p-2.5 text-left text-xs font-semibold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="truncate font-bold">{preset.name}</div>
                    <div className="text-[10px] opacity-75">{preset.category}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="quick-routine-name-input" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Routine Name *
            </label>
            <input
              id="quick-routine-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 10,000 steps"
              className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Scheduled Time
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Clock className="h-3.5 w-3.5" />
                {String(timeHour).padStart(2, '0')}:{String(timeMinute).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="time"
                value={`${String(timeHour).padStart(2, '0')}:${String(timeMinute).padStart(2, '0')}`}
                onChange={(e) => {
                  const parts = e.target.value.split(':').map(Number);
                  if (!isNaN(parts[0]) && !isNaN(parts[1])) {
                    setTimeHour(parts[0]);
                    setTimeMinute(parts[1]);
                  }
                }}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {timePresets.map((tp) => {
                const isSelected = timeHour === tp.hour && timeMinute === tp.minute;
                return (
                  <button
                    key={tp.label}
                    type="button"
                    onClick={() => {
                      setTimeHour(tp.hour);
                      setTimeMinute(tp.minute);
                    }}
                    className={`rounded-lg py-1.5 px-2 text-xs font-bold border transition cursor-pointer text-center whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {tp.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              id="submit-quick-add-button"
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-5 py-2.5 text-sm font-bold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition active:scale-[0.98] cursor-pointer min-h-[44px]"
            >
              <Check className="h-4 w-4" />
              Add Routine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
