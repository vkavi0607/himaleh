import React, { useState } from 'react';
import { Routine, Goal, RoutineFrequency, TaskType, RoutinePriority } from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { X, Check, Repeat, Clock } from 'lucide-react';

interface AddEditRoutineModalProps {
  initialRoutine: Routine | null;
  goals: Goal[];
  onDismiss: () => void;
  onSave: (routine: Routine) => void;
}

export const AddEditRoutineModal: React.FC<AddEditRoutineModalProps> = ({
  initialRoutine,
  goals,
  onDismiss,
  onSave,
}) => {
  const isEdit = initialRoutine !== null;

  const [name, setName] = useState(initialRoutine?.name || '');
  const [description, setDescription] = useState(initialRoutine?.description || '');
  const [category, setCategory] = useState(initialRoutine?.category || 'Personal');
  const [linkedGoalId, setLinkedGoalId] = useState<number | null>(initialRoutine?.linkedGoalId ?? null);

  const [timeHour, setTimeHour] = useState(initialRoutine?.timeHour ?? 8);
  const [timeMinute, setTimeMinute] = useState(initialRoutine?.timeMinute ?? 0);
  const [durationMinutes, setDurationMinutes] = useState(initialRoutine?.durationMinutes ?? 30);

  const [frequency, setFrequency] = useState<RoutineFrequency>(initialRoutine?.frequency || RoutineFrequency.DAILY);
  const [frequencyDays, setFrequencyDays] = useState<Set<number>>(
    initialRoutine ? ProgressCalculationEngine.parseFrequencyDays(initialRoutine.frequencyDays) : new Set([1, 2, 3, 4, 5, 6, 7])
  );

  const [taskType, setTaskType] = useState<TaskType>(initialRoutine?.taskType || TaskType.CHECKBOX);
  const [targetValueText, setTargetValueText] = useState(
    initialRoutine ? String(initialRoutine.targetValue) : '1'
  );
  const [unit, setUnit] = useState(initialRoutine?.unit || '');
  const [priority, setPriority] = useState<RoutinePriority>(initialRoutine?.priority || RoutinePriority.MEDIUM);
  const [reminderEnabled, setReminderEnabled] = useState(initialRoutine?.reminderEnabled ?? true);

  const [nameError, setNameError] = useState<string | null>(null);
  const [targetValueError, setTargetValueError] = useState<string | null>(null);

  const categories = ['Personal', 'Health', 'Fitness', 'Work', 'Study', 'Mindset'];

  const toggleDay = (day: number) => {
    const updated = new Set(frequencyDays);
    if (updated.has(day)) {
      if (updated.size > 1) updated.delete(day);
    } else {
      updated.add(day);
    }
    setFrequencyDays(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Routine name is required');
      return;
    }

    const targetVal = parseFloat(targetValueText);
    if (taskType !== TaskType.CHECKBOX && (isNaN(targetVal) || targetVal <= 0)) {
      setTargetValueError('Valid positive target required');
      return;
    }

    const daysStr = Array.from(frequencyDays).sort().join(',');

    const routine: Routine = {
      id: initialRoutine?.id || Date.now(),
      name: name.trim(),
      description: description.trim(),
      category,
      linkedGoalId,
      startDate: initialRoutine?.startDate || ProgressCalculationEngine.getTodayStr(),
      endDate: initialRoutine?.endDate || null,
      timeHour,
      timeMinute,
      durationMinutes,
      frequency,
      frequencyDays: daysStr || '1,2,3,4,5,6,7',
      weeklyTargetTimes: frequencyDays.size,
      taskType,
      targetValue: isNaN(targetVal) ? 1.0 : targetVal,
      unit: unit.trim(),
      priority,
      reminderEnabled,
      isPaused: initialRoutine?.isPaused || false,
      createdAt: initialRoutine?.createdAt || Date.now(),
    };

    onSave(routine);
  };

  return (
    <div
      id="routine-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEdit ? 'Edit Routine' : 'New Routine'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isEdit ? 'Update habit schedule' : 'Build consistency with daily action'}
              </p>
            </div>
          </div>
          <button
            id="close-routine-dialog-button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Routine Details */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Routine Details
            </label>
            <div>
              <input
                id="routine-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                placeholder="e.g. 20 min Cardio, Read 10 Pages"
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {nameError && <p className="mt-1 text-xs text-rose-500">{nameError}</p>}
            </div>

            <div>
              <textarea
                id="routine-desc-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description or habit cue: 'After I pour coffee, I will...'"
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 2: Category & Linked Goal */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Category & Linked Goal
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-xl py-2 px-2 text-xs font-bold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {goals.length > 0 && (
              <div className="pt-2">
                <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Link to Goal (Optional)
                </span>
                <select
                  value={linkedGoalId === null ? '' : linkedGoalId}
                  onChange={(e) => setLinkedGoalId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">No linked goal</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 3: Time & Duration */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Time & Duration
            </label>
            <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3 border border-neutral-200 dark:border-neutral-700/60">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Scheduled Time
                </span>
              </div>
              <input
                type="time"
                value={`${String(timeHour).padStart(2, '0')}:${String(timeMinute).padStart(2, '0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  if (!isNaN(h) && !isNaN(m)) {
                    setTimeHour(h);
                    setTimeMinute(m);
                  }
                }}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs font-bold text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Duration: {durationMinutes} min
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`rounded-lg py-1.5 text-xs font-bold border transition cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 4: Frequency & Schedule */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Frequency & Schedule
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: RoutineFrequency.DAILY, label: 'Daily' },
                { type: RoutineFrequency.WEEKDAYS, label: 'Weekdays' },
                { type: RoutineFrequency.CUSTOM_DAYS, label: 'Custom' },
              ].map((f) => {
                const isSelected = frequency === f.type;
                return (
                  <button
                    key={f.type}
                    type="button"
                    onClick={() => setFrequency(f.type)}
                    className={`rounded-xl py-2 text-xs font-bold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {frequency === RoutineFrequency.CUSTOM_DAYS && (
              <div className="pt-2">
                <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Active Days
                </span>
                <div className="flex items-center justify-between gap-1">
                  {[
                    { day: 1, label: 'M' },
                    { day: 2, label: 'T' },
                    { day: 3, label: 'W' },
                    { day: 4, label: 'T' },
                    { day: 5, label: 'F' },
                    { day: 6, label: 'S' },
                    { day: 7, label: 'S' },
                  ].map(({ day, label }) => {
                    const isSelected = frequencyDays.has(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`h-9 w-9 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 5: Task Type & Targets */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Task Measurement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: TaskType.CHECKBOX, label: 'Checkbox', sub: 'Done / Not Done' },
                { type: TaskType.DURATION, label: 'Duration', sub: 'Minutes logged' },
                { type: TaskType.QUANTITY, label: 'Quantity', sub: 'e.g. 2L Water' },
                { type: TaskType.COUNT, label: 'Count', sub: 'e.g. 20 Pages' },
              ].map((t) => {
                const isSelected = taskType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => {
                      setTaskType(t.type);
                      if (t.type === TaskType.DURATION) {
                        setUnit('min');
                        setTargetValueText('30');
                      } else if (t.type === TaskType.QUANTITY) {
                        setUnit('L');
                        setTargetValueText('2');
                      } else if (t.type === TaskType.COUNT) {
                        setUnit('reps');
                        setTargetValueText('25');
                      }
                    }}
                    className={`rounded-xl p-2.5 text-left border transition cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className="text-[10px] opacity-75">{t.sub}</div>
                  </button>
                );
              })}
            </div>

            {taskType !== TaskType.CHECKBOX && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Target Value *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={targetValueText}
                    onChange={(e) => {
                      setTargetValueText(e.target.value);
                      setTargetValueError(null);
                    }}
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                  {targetValueError && <p className="mt-1 text-xs text-rose-500">{targetValueError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="min, pages, L"
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 6: Priority & Reminder */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Priority & Reminder
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { p: RoutinePriority.LOW, label: 'Low' },
                { p: RoutinePriority.MEDIUM, label: 'Medium' },
                { p: RoutinePriority.HIGH, label: 'High' },
              ].map(({ p, label }) => {
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-xl py-2 text-xs font-bold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3 border border-neutral-200 dark:border-neutral-700/60">
              <div>
                <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Daily Reminder Notification
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Receive prompt at scheduled routine time
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="h-5 w-5 rounded-md accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
          <button
            id="cancel-routine-button"
            type="button"
            onClick={onDismiss}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="save-routine-button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-6 py-2.5 text-sm font-bold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition active:scale-[0.98] cursor-pointer"
          >
            <Check className="h-4 w-4" />
            {isEdit ? 'Save Changes' : 'Create Routine'}
          </button>
        </div>
      </div>
    </div>
  );
};
