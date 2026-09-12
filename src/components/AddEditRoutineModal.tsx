import React, { useState, useEffect } from 'react';
import { Routine, Goal, RoutineFrequency, TaskType, RoutinePriority, SoundPreset } from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { SoundService } from '../services/SoundService';
import { NotificationService } from '../services/NotificationService';
import { X, Check, Repeat, Bell, Volume2, Play, Square, Info } from 'lucide-react';

interface AddEditRoutineModalProps {
  initialRoutine: Routine | null;
  goals: Goal[];
  onDismiss: () => void;
  onSave: (routine: Routine) => void;
  is24HourFormat?: boolean;
}

export const AddEditRoutineModal: React.FC<AddEditRoutineModalProps> = ({
  initialRoutine,
  goals,
  onDismiss,
  onSave,
  is24HourFormat = false,
}) => {
  const isEdit = initialRoutine !== null;

  const [name, setName] = useState(initialRoutine?.name || '');
  const [description, setDescription] = useState(initialRoutine?.description || '');
  const [category, setCategory] = useState(initialRoutine?.category || 'Personal');
  const [linkedGoalId, setLinkedGoalId] = useState<number | null>(initialRoutine?.linkedGoalId ?? null);

  // Time state (24h internal: hour 0-23, minute 0-59)
  const [timeHour, setTimeHour] = useState(initialRoutine?.timeHour ?? 8);
  const [timeMinute, setTimeMinute] = useState(initialRoutine?.timeMinute ?? 0);
  const [durationMinutes, setDurationMinutes] = useState(initialRoutine?.durationMinutes ?? 30);
  const [customDuration, setCustomDuration] = useState(false);

  const [frequency, setFrequency] = useState<RoutineFrequency>(initialRoutine?.frequency || RoutineFrequency.DAILY);
  const [frequencyDays, setFrequencyDays] = useState<Set<number>>(() => {
    if (initialRoutine) {
      return ProgressCalculationEngine.parseFrequencyDays(initialRoutine.frequencyDays);
    }
    return new Set([1, 2, 3, 4, 5, 6, 7]);
  });

  const [taskType, setTaskType] = useState<TaskType>(initialRoutine?.taskType || TaskType.CHECKBOX);
  const [targetValueText, setTargetValueText] = useState(
    initialRoutine ? String(initialRoutine.targetValue) : '1'
  );
  const [unit, setUnit] = useState(initialRoutine?.unit || '');
  const [priority, setPriority] = useState<RoutinePriority>(initialRoutine?.priority || RoutinePriority.MEDIUM);
  const [reminderEnabled, setReminderEnabled] = useState(initialRoutine?.reminderEnabled ?? true);
  const [reminderSound, setReminderSound] = useState<SoundPreset>(initialRoutine?.reminderSound || 'himaleh_chime');
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  useEffect(() => {
    setPermissionStatus(NotificationService.getPermissionStatus());
  }, []);

  const handleTogglePlaySound = () => {
    if (isPlayingSound) {
      SoundService.stop();
      setIsPlayingSound(false);
    } else {
      setIsPlayingSound(true);
      SoundService.playPreset(reminderSound === 'custom' ? 'himaleh_chime' : reminderSound, 'medium', () => {
        setIsPlayingSound(false);
      });
    }
  };

  const handleRequestPermission = async () => {
    const res = await NotificationService.requestPermission();
    setPermissionStatus(res);
  };

  const [nameError, setNameError] = useState<string | null>(null);
  const [targetValueError, setTargetValueError] = useState<string | null>(null);

  const categories = ['Personal', 'Health', 'Fitness', 'Work', 'Study', 'Mindset'];

  // Helper for 12-hour conversion
  const display12Hour = (h: number) => {
    const val = h % 12;
    return val === 0 ? 12 : val;
  };
  const isPM = timeHour >= 12;

  const setHour12 = (h12: number, pm: boolean) => {
    let normalized = h12 % 12;
    if (pm) normalized += 12;
    setTimeHour(normalized);
  };

  const toggleDay = (day: number) => {
    const updated = new Set(frequencyDays);
    if (updated.has(day)) {
      if (updated.size > 1) updated.delete(day);
    } else {
      updated.add(day);
    }
    setFrequencyDays(updated);
  };

  // Quick Time Presets
  const quickTimes = [
    { label: '06:00 AM', h: 6, m: 0 },
    { label: '07:30 AM', h: 7, m: 30 },
    { label: '09:00 AM', h: 9, m: 0 },
    { label: '12:00 PM', h: 12, m: 0 },
    { label: '02:30 PM', h: 14, m: 30 },
    { label: '06:45 PM', h: 18, m: 45 },
    { label: '08:00 PM', h: 20, m: 0 },
    { label: '11:30 PM', h: 23, m: 30 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Routine name is required');
      return;
    }

    const targetVal = parseFloat(targetValueText);
    if (taskType !== TaskType.CHECKBOX && (isNaN(targetVal) || targetVal <= 0)) {
      setTargetValueError('Target value must be a positive number');
      return;
    }

    let daysStr = Array.from(frequencyDays).sort().join(',');
    if (frequency === RoutineFrequency.DAILY) {
      daysStr = '1,2,3,4,5,6,7';
    } else if (frequency === RoutineFrequency.WEEKDAYS) {
      daysStr = '1,2,3,4,5';
    } else if (frequency === RoutineFrequency.WEEKENDS) {
      daysStr = '6,7';
    }

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
      durationMinutes: Math.max(1, durationMinutes),
      frequency,
      frequencyDays: daysStr,
      weeklyTargetTimes: frequency === RoutineFrequency.CUSTOM_DAYS ? frequencyDays.size : (frequency === RoutineFrequency.WEEKDAYS ? 5 : (frequency === RoutineFrequency.WEEKENDS ? 2 : 7)),
      taskType,
      targetValue: isNaN(targetVal) ? 1.0 : targetVal,
      unit: unit.trim(),
      priority,
      reminderEnabled,
      reminderSound,
      isPaused: initialRoutine?.isPaused || false,
      createdAt: initialRoutine?.createdAt || Date.now(),
    };

    onSave(routine);
  };

  return (
    <div
      id="routine-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEdit ? 'Edit Routine' : 'New Routine'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isEdit ? 'Update scheduled habit and time' : 'Build consistency with scheduled daily rituals'}
              </p>
            </div>
          </div>
          <button
            id="close-routine-dialog-button"
            onClick={onDismiss}
            className="rounded-lg p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section 1: Routine Identity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="routine-name-input" className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Routine Details
              </label>
              <span className="text-[11px] text-neutral-400">* Required</span>
            </div>

            <div>
              <label htmlFor="routine-name-input" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Routine Name *
              </label>
              <input
                id="routine-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                placeholder="e.g. 20 min Cardio, Read 10 Pages, Morning Stretch"
                className={`w-full min-w-0 rounded-xl border ${
                  nameError
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-neutral-300 dark:border-neutral-700 focus:border-emerald-500'
                } bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none`}
              />
              {nameError && <p className="mt-1 text-xs text-rose-500">{nameError}</p>}
            </div>

            <div>
              <label htmlFor="routine-desc-input" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Habit Cue & Description (Optional)
              </label>
              <textarea
                id="routine-desc-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Anchor habit cue: 'After I pour morning coffee, I will...'"
                className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 2: Category & Linked Goal */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Category & Linked Goal
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition border cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs'
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
                <label htmlFor="routine-linked-goal" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Link to Long-Term Goal (Optional)
                </label>
                <select
                  id="routine-linked-goal"
                  value={linkedGoalId === null ? '' : linkedGoalId}
                  onChange={(e) => setLinkedGoalId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
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

          {/* Section 3: Time & Duration — CUSTOM TIME SELECTOR */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Scheduled Time & Duration
              </label>
              <span className="text-[11px] font-semibold text-neutral-500">
                {String(timeHour).padStart(2, '0')}:{String(timeMinute).padStart(2, '0')}{' '}
                {!is24HourFormat && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ({display12Hour(timeHour)}:{String(timeMinute).padStart(2, '0')} {isPM ? 'PM' : 'AM'})
                  </span>
                )}
              </span>
            </div>

            {/* Time Control Card */}
            <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-200 dark:border-neutral-700/60 space-y-3.5">
              {/* Native & Dual Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Direct Time Input */}
                <div>
                  <label htmlFor="routine-time-input" className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Select Time:
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="routine-time-input"
                      type="time"
                      value={`${String(timeHour).padStart(2, '0')}:${String(timeMinute).padStart(2, '0')}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(':').map(Number);
                        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
                          setTimeHour(parts[0]);
                          setTimeMinute(parts[1]);
                        }
                      }}
                      className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 12-Hour AM/PM Switcher & Stepper */}
                <div>
                  <span className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    AM / PM Format:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Hour selector */}
                    <select
                      value={display12Hour(timeHour)}
                      onChange={(e) => setHour12(Number(e.target.value), isPM)}
                      className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
                    >
                      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm font-bold text-neutral-400">:</span>
                    {/* Minute selector */}
                    <select
                      value={timeMinute}
                      onChange={(e) => setTimeMinute(Number(e.target.value))}
                      className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
                    >
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59].map((m) => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    {/* AM / PM Toggle buttons */}
                    <div className="flex rounded-xl border border-neutral-300 dark:border-neutral-700 overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPM) setTimeHour((timeHour - 12) % 24);
                        }}
                        className={`px-2.5 py-2 text-xs font-bold transition cursor-pointer ${
                          !isPM
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPM) setTimeHour(timeHour + 12);
                        }}
                        className={`px-2.5 py-2 text-xs font-bold transition cursor-pointer ${
                          isPM
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Time Preset Chips */}
              <div>
                <span className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Popular Time Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {quickTimes.map((qt) => {
                    const isSelected = timeHour === qt.h && timeMinute === qt.m;
                    return (
                      <button
                        key={qt.label}
                        type="button"
                        onClick={() => {
                          setTimeHour(qt.h);
                          setTimeMinute(qt.m);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer text-center whitespace-nowrap ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {qt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Duration: <span className="font-bold text-emerald-600 dark:text-emerald-400">{durationMinutes} min</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCustomDuration(!customDuration)}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {customDuration ? 'Use Presets' : 'Custom Minutes'}
                </button>
              </div>

              {customDuration ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
                    placeholder="Duration in minutes"
                  />
                  <span className="text-xs text-neutral-500 shrink-0">minutes</span>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`rounded-xl py-2 text-xs font-bold border transition cursor-pointer ${
                        durationMinutes === mins
                          ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                          : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 4: Frequency & Schedule */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Frequency & Schedule
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: RoutineFrequency.DAILY, label: 'Daily' },
                { type: RoutineFrequency.WEEKDAYS, label: 'Weekdays (M-F)' },
                { type: RoutineFrequency.WEEKENDS, label: 'Weekends (S-S)' },
                { type: RoutineFrequency.CUSTOM_DAYS, label: 'Custom Days' },
              ].map((f) => {
                const isSelected = frequency === f.type;
                return (
                  <button
                    key={f.type}
                    type="button"
                    onClick={() => setFrequency(f.type)}
                    className={`rounded-xl py-2 px-2 text-xs font-bold transition border cursor-pointer whitespace-nowrap text-center ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs'
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
                  Select Active Days ({frequencyDays.size} days/week):
                </span>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {[
                    { day: 1, label: 'Mon' },
                    { day: 2, label: 'Tue' },
                    { day: 3, label: 'Wed' },
                    { day: 4, label: 'Thu' },
                    { day: 5, label: 'Fri' },
                    { day: 6, label: 'Sat' },
                    { day: 7, label: 'Sun' },
                  ].map(({ day, label }) => {
                    const isSelected = frequencyDays.has(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`h-10 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
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

          {/* Section 5: Task Type & Measurement */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Task Measurement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: TaskType.CHECKBOX, label: 'Checkbox', sub: 'Done / Not Done' },
                { type: TaskType.DURATION, label: 'Duration', sub: 'Minutes logged' },
                { type: TaskType.QUANTITY, label: 'Quantity', sub: 'e.g. 2L Water, 750ml' },
                { type: TaskType.COUNT, label: 'Count', sub: 'e.g. 20 Pages, 50 Reps' },
                { type: TaskType.TIME_BASED, label: 'Time-Based', sub: 'Check-in at scheduled time' },
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
                    <div className="text-[10px] opacity-75 truncate">{t.sub}</div>
                  </button>
                );
              })}
            </div>

            {taskType !== TaskType.CHECKBOX && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label htmlFor="routine-target-val" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Target Value *
                  </label>
                  <input
                    id="routine-target-val"
                    type="number"
                    step="any"
                    value={targetValueText}
                    onChange={(e) => {
                      setTargetValueText(e.target.value);
                      setTargetValueError(null);
                    }}
                    className={`w-full min-w-0 rounded-xl border ${
                      targetValueError
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-neutral-300 dark:border-neutral-700 focus:border-emerald-500'
                    } bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none`}
                  />
                  {targetValueError && <p className="mt-1 text-xs text-rose-500">{targetValueError}</p>}
                </div>
                <div>
                  <label htmlFor="routine-unit-val" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Unit
                  </label>
                  <input
                    id="routine-unit-val"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="min, pages, L, ml, reps"
                    className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 6: Priority & Reminder */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Priority & Notification
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
                    className={`rounded-xl py-2 text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
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

            <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-200 dark:border-neutral-700/60 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Scheduled OS Reminder
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Receive actual device notification at {display12Hour(timeHour)}:{String(timeMinute).padStart(2, '0')} {isPM ? 'PM' : 'AM'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    reminderEnabled ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {reminderEnabled && (
                <div className="space-y-3 pt-2 border-t border-neutral-200/80 dark:border-neutral-700/80 animate-fade-in">
                  {/* Sound Selector and Test Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="routine-sound-selector" className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-neutral-500" />
                        <span>Notification Sound</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleTogglePlaySound}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition cursor-pointer"
                      >
                        {isPlayingSound ? (
                          <>
                            <Square className="h-3 w-3 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" />
                            <span>Test Sound</span>
                          </>
                        )}
                      </button>
                    </div>

                    <select
                      id="routine-sound-selector"
                      value={reminderSound}
                      onChange={(e) => {
                        const val = e.target.value as SoundPreset;
                        setReminderSound(val);
                        SoundService.playPreset(val === 'custom' ? 'himaleh_chime' : val, 'medium');
                      }}
                      className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="himaleh_chime">Himaleh Chime (Alpine Crystalline)</option>
                      <option value="soft_reminder">Soft Reminder (Warm Bell)</option>
                      <option value="focus_bell">Focus (Tibetan Bowl)</option>
                      <option value="achievement">Achievement (Ascending Chord)</option>
                      <option value="gentle_alert">Gentle Alert (Subtle Chime)</option>
                      <option value="system_default">System Default</option>
                      <option value="custom">Custom Sound</option>
                    </select>
                  </div>

                  {/* Permission Prompt Banner if needed */}
                  {permissionStatus !== 'granted' && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                          Notifications help Himaleh remind you when your routines are due.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestPermission}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shrink-0 transition cursor-pointer"
                      >
                        Enable Notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-800">
          <button
            id="cancel-routine-button"
            type="button"
            onClick={onDismiss}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer min-h-[44px]"
          >
            Cancel
          </button>
          <button
            id="save-routine-button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-6 py-2.5 text-sm font-bold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <Check className="h-4 w-4" />
            {isEdit ? 'Save Changes' : 'Create Routine'}
          </button>
        </div>
      </div>
    </div>
  );
};
