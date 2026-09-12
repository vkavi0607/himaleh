import React, { useState } from 'react';
import { Goal, GoalPriority, GoalStatus } from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { Flag, X, Check, AlertCircle, Calendar } from 'lucide-react';
import { GoalCalendarPicker } from './GoalCalendarPicker';

interface AddEditGoalModalProps {
  initialGoal: Goal | null;
  onDismiss: () => void;
  onSave: (goal: Goal) => void;
}

export const AddEditGoalModal: React.FC<AddEditGoalModalProps> = ({
  initialGoal,
  onDismiss,
  onSave,
}) => {
  const isEdit = initialGoal !== null;
  const today = ProgressCalculationEngine.getTodayStr();

  const [title, setTitle] = useState(initialGoal?.title || '');
  const [description, setDescription] = useState(initialGoal?.description || '');
  const [category, setCategory] = useState(initialGoal?.category || 'Personal');
  const [targetValueText, setTargetValueText] = useState(
    initialGoal ? String(initialGoal.targetValue) : '100'
  );
  const [unit, setUnit] = useState(initialGoal?.unit || '%');
  const [priority, setPriority] = useState<GoalPriority>(initialGoal?.priority || GoalPriority.MEDIUM);
  const [motivation, setMotivation] = useState(initialGoal?.motivation || '');

  const [startDate, setStartDate] = useState(initialGoal?.startDate || today);
  const [endDate, setEndDate] = useState(
    initialGoal?.endDate || ProgressCalculationEngine.addDays(today, 90)
  );

  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [targetValueError, setTargetValueError] = useState<string | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const categories = ['Personal', 'Fitness', 'Career', 'Financial', 'Education', 'Mindset'];

  const timelinePresets = [
    { label: '+30 Days', days: 30 },
    { label: '+90 Days', days: 90 },
    { label: '+180 Days', days: 180 },
    { label: '+1 Year', days: 365 },
  ];

  const handleApplyPreset = (days: number) => {
    const baseDate = startDate || today;
    setEndDate(ProgressCalculationEngine.addDays(baseDate, days));
    setTimelineError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!title.trim()) {
      setTitleError('Goal title is required');
      hasError = true;
    }

    const targetVal = parseFloat(targetValueText);
    if (isNaN(targetVal) || targetVal <= 0) {
      setTargetValueError('Target value must be a positive number');
      hasError = true;
    }

    if (!startDate) {
      setTimelineError('Start date is required');
      hasError = true;
    } else if (!endDate) {
      setTimelineError('End date is required');
      hasError = true;
    } else if (ProgressCalculationEngine.compareDates(endDate, startDate) < 0) {
      setTimelineError('Target end date cannot be earlier than start date');
      hasError = true;
    }

    if (hasError) return;

    const goal: Goal = {
      id: initialGoal?.id || Date.now(),
      title: title.trim(),
      description: description.trim(),
      category,
      startDate,
      endDate,
      targetValue: targetVal,
      currentValue: initialGoal?.currentValue || 0,
      unit: unit.trim() || '%',
      priority,
      status: initialGoal?.status || GoalStatus.ACTIVE,
      motivation: motivation.trim(),
      createdAt: initialGoal?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(goal);
  };

  return (
    <div
      id="goal-dialog"
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEdit ? 'Edit Goal' : 'New Goal'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isEdit ? 'Update target, timeline & priority' : 'Set a clear milestone for consistency'}
              </p>
            </div>
          </div>
          <button
            id="close-goal-dialog-button"
            onClick={onDismiss}
            className="rounded-lg p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="goal-title-input"
                className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"
              >
                Basic Information
              </label>
              <span className="text-[11px] text-neutral-400">* Required</span>
            </div>

            <div>
              <label htmlFor="goal-title-input" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Goal Title *
              </label>
              <input
                id="goal-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError(null);
                }}
                placeholder="e.g. Run 50km, Read 6 Books, Save $5,000"
                className={`w-full min-w-0 rounded-xl border ${
                  titleError
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-neutral-300 dark:border-neutral-700 focus:border-amber-500'
                } bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none`}
              />
              {titleError && <p className="mt-1 text-xs text-rose-500">{titleError}</p>}
            </div>

            <div>
              <label htmlFor="goal-desc-input" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="goal-desc-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specific scope, milestones, or definition of done..."
                className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 2: Goal Setup (Category & Priority) */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Category
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

            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[GoalPriority.LOW, GoalPriority.MEDIUM, GoalPriority.HIGH].map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`rounded-xl py-2 px-2 text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                          : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 3: Target Value & Unit */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Target Value & Unit
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="goal-target-val" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Target Value *
                </label>
                <input
                  id="goal-target-val"
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
                      : 'border-neutral-300 dark:border-neutral-700 focus:border-amber-500'
                  } bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none`}
                />
                {targetValueError && <p className="mt-1 text-xs text-rose-500">{targetValueError}</p>}
              </div>

              <div>
                <label htmlFor="goal-unit-input" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Unit
                </label>
                <input
                  id="goal-unit-input"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. km, books, %, days, $"
                  className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 4: Timeline with Start & End Date Pickers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Timeline (Start & End Date)
              </label>
              <button
                id="open-goal-calendar-button"
                type="button"
                onClick={() => setShowCalendarPicker(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Open Calendar</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                Quick Duration Presets (from Start Date):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {timelinePresets.map((tp) => (
                  <button
                    key={tp.label}
                    type="button"
                    onClick={() => handleApplyPreset(tp.days)}
                    className="rounded-lg py-1.5 px-2 text-xs font-bold border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer whitespace-nowrap text-center"
                  >
                    {tp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="goal-start-date" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Start Date *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCalendarPicker(true)}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Pick</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="goal-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setTimelineError(null);
                    }}
                    className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="goal-end-date" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Target End Date *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCalendarPicker(true)}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Pick</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="goal-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setTimelineError(null);
                    }}
                    className={`w-full min-w-0 rounded-xl border ${
                      timelineError
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-neutral-300 dark:border-neutral-700 focus:border-amber-500'
                    } bg-white dark:bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none`}
                  />
                </div>
              </div>
            </div>

            {timelineError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 pt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{timelineError}</span>
              </div>
            )}

            {showCalendarPicker && (
              <GoalCalendarPicker
                startDate={startDate}
                endDate={endDate}
                onSelectDates={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                  setTimelineError(null);
                }}
                onClose={() => setShowCalendarPicker(false)}
              />
            )}
          </div>

          <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

          {/* Section 5: Motivation ("Why") */}
          <div className="space-y-2">
            <label htmlFor="goal-motivation-input" className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              💡 Motivation (Your "Why")
            </label>
            <textarea
              id="goal-motivation-input"
              rows={2}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Why does this goal matter to your life right now? Anchor your commitment..."
              className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-800">
          <button
            id="cancel-goal-button"
            type="button"
            onClick={onDismiss}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer min-h-[44px]"
          >
            Cancel
          </button>
          <button
            id="save-goal-button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-6 py-2.5 text-sm font-bold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition active:scale-[0.98] cursor-pointer min-h-[44px]"
          >
            <Check className="h-4 w-4" />
            {isEdit ? 'Save Changes' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};
