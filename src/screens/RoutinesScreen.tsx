import React, { useState } from 'react';
import { Routine, Goal, RoutineLog, RoutineFrequency } from '../types';
import { ConsistencyEngine } from '../domain/ConsistencyEngine';
import {
  Repeat,
  Plus,
  Zap,
  Clock,
  Flame,
  Pause,
  Play,
  Edit,
  Trash2,
  Target,
} from 'lucide-react';

interface RoutinesScreenProps {
  routines: Routine[];
  goals: Goal[];
  logs: RoutineLog[];
  timeFormat?: '12h' | '24h';
  onOpenNewRoutine: () => void;
  onOpenQuickAdd: () => void;
  onEditRoutine: (routine: Routine) => void;
  onTogglePauseRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: number) => void;
}

export const RoutinesScreen: React.FC<RoutinesScreenProps> = ({
  routines,
  goals,
  logs,
  timeFormat = '12h',
  onOpenNewRoutine,
  onOpenQuickAdd,
  onEditRoutine,
  onTogglePauseRoutine,
  onDeleteRoutine,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const categories = ['ALL', 'Health', 'Fitness', 'Work', 'Study', 'Mindset', 'Personal'];

  const formatRoutineTime = (h: number, m: number) => {
    const mm = String(m).padStart(2, '0');
    if (timeFormat === '24h') {
      return `${String(h).padStart(2, '0')}:${mm}`;
    }
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h12}:${mm} ${ampm}`;
  };

  const filteredRoutines = routines.filter((r) => {
    if (selectedCategory === 'ALL') return true;
    return r.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const formatFrequency = (routine: Routine) => {
    switch (routine.frequency) {
      case RoutineFrequency.DAILY:
        return 'Every Day';
      case RoutineFrequency.WEEKDAYS:
        return 'Mon - Fri';
      case RoutineFrequency.WEEKENDS:
        return 'Sat - Sun';
      case RoutineFrequency.CUSTOM_DAYS:
        return `${routine.weeklyTargetTimes} days/week`;
      default:
        return 'Daily';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
              Routine Habits
            </h1>
          </div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
            Configure atomic daily habits, schedule times, and track individual habit streaks
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="routine-quick-add-btn"
            onClick={onOpenQuickAdd}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Templates</span>
          </button>
          <button
            id="new-routine-btn"
            onClick={onOpenNewRoutine}
            className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 dark:bg-neutral-100 px-4 py-2.5 text-xs font-bold text-white dark:text-neutral-900 shadow-xs hover:opacity-90 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Routine</span>
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition border cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {cat === 'ALL' ? 'All Routines' : cat}
            </button>
          );
        })}
      </div>

      {/* Routines List */}
      {filteredRoutines.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Repeat className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            No routines in this category
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Build your morning, workday, or evening rituals to lock in consistency.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenNewRoutine}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-bold text-white dark:text-neutral-900 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Routine
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRoutines.map((routine) => {
            const linkedGoal = goals.find((g) => g.id === routine.linkedGoalId);
            const routineStreak = ConsistencyEngine.calculateRoutineStreak(routine, logs);
            const timeStr = formatRoutineTime(routine.timeHour, routine.timeMinute);

            return (
              <div
                key={routine.id}
                id={`routine-manage-card-${routine.id}`}
                className={`bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 space-y-4 shadow-xs transition ${
                  routine.isPaused ? 'opacity-60 bg-neutral-50/70 dark:bg-neutral-900/50' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                        {routine.category}
                      </span>

                      {linkedGoal && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                          <Target className="h-3 w-3" />
                          {linkedGoal.title}
                        </span>
                      )}

                      {routine.isPaused && (
                        <span className="inline-block rounded-md bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                          Paused
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {routine.name}
                    </h3>

                    {routine.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {routine.description}
                      </p>
                    )}
                  </div>

                  {/* Habit Streak Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <div className="inline-flex items-center gap-1.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/40 px-3 py-1.5 text-orange-700 dark:text-orange-300">
                      <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span className="text-xs font-bold">
                        {routineStreak} {routineStreak === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub info grid */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    {timeStr} ({routine.durationMinutes} min)
                  </span>

                  <span>Frequency: {formatFrequency(routine)}</span>

                  {routine.taskType !== 'CHECKBOX' && (
                    <span>
                      Target: {routine.targetValue} {routine.unit}
                    </span>
                  )}
                </div>

                {/* Card footer controls */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onTogglePauseRoutine(routine)}
                      className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      {routine.isPaused ? (
                        <>
                          <Play className="h-3.5 w-3.5 text-emerald-500" /> Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-3.5 w-3.5 text-neutral-400" /> Pause
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditRoutine(routine)}
                      className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(routine.id)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="Delete Routine"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Delete Confirmation Box */}
                {deleteConfirmId === routine.id && (
                  <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 space-y-2.5">
                    <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                      Delete routine "{routine.name}"? Past logs for this routine will remain in your history.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg px-3 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmId(null);
                          onDeleteRoutine(routine.id);
                        }}
                        className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
