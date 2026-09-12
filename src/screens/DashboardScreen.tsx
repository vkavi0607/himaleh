import React, { useState } from 'react';
import {
  Routine,
  UserSettings,
  DailyProgressResult,
  StreakStats,
  DashboardState,
  TaskType,
  DailyReflection,
  Goal,
} from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Zap,
  Calendar,
  MoreVertical,
  Clock,
  ArrowRight,
  Star,
  SkipForward,
  RotateCcw,
  Target,
} from 'lucide-react';

interface DashboardScreenProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  progress: DailyProgressResult;
  streakStats: StreakStats;
  dashboardState: DashboardState;
  settings: UserSettings;
  goals: Goal[];
  reflection: DailyReflection | null;
  onToggleRoutine: (routine: Routine) => void;
  onSkipRoutine: (routine: Routine, reason: string) => void;
  onRequestMeasurable: (routine: Routine) => void;
  onRequestReschedule: (routine: Routine) => void;
  onRequestEditRoutine: (routine: Routine) => void;
  onOpenQuickAdd: () => void;
  onOpenAddRoutine: () => void;
  onOpenReflection: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentDate,
  onDateChange,
  progress,
  streakStats,
  dashboardState,
  settings,
  goals,
  reflection,
  onToggleRoutine,
  onSkipRoutine,
  onRequestMeasurable,
  onRequestReschedule,
  onRequestEditRoutine,
  onOpenQuickAdd,
  onOpenAddRoutine,
  onOpenReflection,
}) => {
  const [activeMenuRoutineId, setActiveMenuRoutineId] = useState<number | null>(null);

  const todayStr = ProgressCalculationEngine.getTodayStr();
  const isToday = currentDate === todayStr;

  const handlePrevDay = () => {
    onDateChange(ProgressCalculationEngine.addDays(currentDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(ProgressCalculationEngine.addDays(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  const formatDisplayDate = (dStr: string) => {
    try {
      const parts = dStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Date Navigation & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
              {isToday ? `Welcome back, ${settings.userName}` : 'Historical View'}
            </h1>
          </div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
            {isToday ? "Here is your consistency ledger for today" : `Reviewing log for ${currentDate}`}
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200/80 dark:border-neutral-700/80">
            <button
              id="prev-day-button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 text-xs font-bold text-neutral-800 dark:text-neutral-200 min-w-[110px] text-center">
              {formatDisplayDate(currentDate)}
            </span>

            <button
              id="next-day-button"
              onClick={handleNextDay}
              className="p-1.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isToday && (
            <button
              id="today-button"
              onClick={handleToday}
              className="rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* 2. Streak & Consistency Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak Metric */}
        <div className="flex items-center gap-3.5 bg-gradient-to-br from-orange-500/10 to-amber-500/5 dark:from-orange-950/40 dark:to-neutral-900 p-4 rounded-3xl border border-orange-200/80 dark:border-orange-900/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xs">
            <Flame className="h-6 w-6 fill-white" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
                {streakStats.currentStreak}
              </span>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                {streakStats.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              Current Active Streak
            </p>
          </div>
        </div>

        {/* Longest Streak Metric */}
        <div className="flex items-center gap-3.5 bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <span className="text-xl">🏔️</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
                {streakStats.longestStreak}
              </span>
              <span className="text-xs font-bold text-neutral-500">days</span>
            </div>
            <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              Personal Best Streak
            </p>
          </div>
        </div>

        {/* Weekly Consistency Metric */}
        <div className="flex items-center gap-3.5 bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
                {streakStats.weeklyConsistencyPercentage}%
              </span>
            </div>
            <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              7-Day Consistency Rate
            </p>
          </div>
        </div>
      </div>

      {/* 3. High-Level Accountability Banner */}
      <div
        id="accountability-banner"
        className={`rounded-3xl p-5 border transition-all ${
          dashboardState.type === 'COMPLETED'
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-100'
            : dashboardState.type === 'ACCOUNTABILITY'
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-100'
            : dashboardState.type === 'REST_DAY'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
            : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-sm'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <span className="text-2xl select-none">{dashboardState.emoji}</span>
          <div className="space-y-1 flex-1">
            <h2 className="text-base font-bold tracking-tight">
              {dashboardState.title}
            </h2>
            <p className="text-xs opacity-90 leading-relaxed">
              {dashboardState.message}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Daily Completion Progress Bar */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-neutral-700 dark:text-neutral-300">
            Daily Execution Progress
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
            {progress.completedCount} / {progress.totalPlanned} routines ({progress.completionPercentage}%)
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* 5. Routines Ledger Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
              Planned Routines ({progress.plannedRoutines.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="quick-add-button"
              onClick={onOpenQuickAdd}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Quick Add</span>
            </button>
            <button
              id="add-routine-button"
              onClick={onOpenAddRoutine}
              className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-3 py-1.5 text-xs font-bold text-white dark:text-neutral-900 shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Routine</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {progress.plannedRoutines.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              No routines scheduled for this day
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Enjoy your rest day, or tap 'Quick Add' to queue up a productive action.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenQuickAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-bold text-white dark:text-neutral-900 cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" />
                Add Habit from Templates
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {progress.plannedRoutines.map((routine) => {
              const isCompleted = progress.completedRoutineIds.has(routine.id);
              const isSkipped = progress.skippedRoutineIds.has(routine.id);
              const log = progress.routineLogMap[routine.id];
              const linkedGoal = goals.find((g) => g.id === routine.linkedGoalId);

              const timeStr = `${String(routine.timeHour).padStart(2, '0')}:${String(routine.timeMinute).padStart(2, '0')}`;

              return (
                <div
                  key={routine.id}
                  id={`routine-card-${routine.id}`}
                  className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40'
                      : isSkipped
                      ? 'bg-neutral-50/80 dark:bg-neutral-900/60 border-dashed border-neutral-300 dark:border-neutral-700 opacity-60'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Checkbox / Action button */}
                    <button
                      type="button"
                      id={`toggle-routine-${routine.id}`}
                      onClick={() => {
                        if (routine.taskType === TaskType.CHECKBOX) {
                          onToggleRoutine(routine);
                        } else {
                          // Opens modal for measurable values
                          onRequestMeasurable(routine);
                        }
                      }}
                      className="mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer"
                      title={isCompleted ? 'Mark uncompleted' : 'Complete routine'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="h-6 w-6 text-neutral-300 dark:text-neutral-600 hover:text-emerald-500 transition-colors" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            isCompleted
                              ? 'line-through text-neutral-400 dark:text-neutral-500'
                              : isSkipped
                              ? 'line-through text-neutral-400'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {routine.name}
                        </span>

                        <span className="inline-block rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                          {routine.category}
                        </span>

                        {linkedGoal && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                            <Target className="h-3 w-3" />
                            {linkedGoal.title}
                          </span>
                        )}
                      </div>

                      {/* Subtitle with time & measurement */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Clock className="h-3 w-3 text-neutral-400" />
                          {timeStr} ({routine.durationMinutes}m)
                        </span>

                        {routine.taskType !== TaskType.CHECKBOX && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Target: {routine.targetValue} {routine.unit}
                            {log && log.isCompleted && (
                              <span className="ml-1 text-neutral-500">
                                (Logged: {log.loggedValue} {routine.unit})
                              </span>
                            )}
                          </span>
                        )}

                        {isSkipped && log?.skipReason && (
                          <span className="italic text-rose-500">
                            Skipped: {log.skipReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Menu */}
                  <div className="relative ml-2">
                    <button
                      type="button"
                      id={`routine-menu-${routine.id}`}
                      onClick={() =>
                        setActiveMenuRoutineId(
                          activeMenuRoutineId === routine.id ? null : routine.id
                        )
                      }
                      className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuRoutineId === routine.id && (
                      <div
                        className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800 p-1.5 space-y-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {routine.taskType !== TaskType.CHECKBOX && (
                          <button
                            onClick={() => {
                              setActiveMenuRoutineId(null);
                              onRequestMeasurable(routine);
                            }}
                            className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-emerald-500" />
                            Log Progress
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActiveMenuRoutineId(null);
                            onRequestReschedule(routine);
                          }}
                          className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-amber-500" />
                          Reschedule
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuRoutineId(null);
                            onSkipRoutine(routine, 'Postponed / Off-schedule');
                          }}
                          className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          <SkipForward className="h-3.5 w-3.5 text-neutral-400" />
                          Skip Today
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuRoutineId(null);
                            onRequestEditRoutine(routine);
                          }}
                          className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          Edit Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Daily Reflection Card */}
      <div
        id="reflection-section-card"
        onClick={onOpenReflection}
        className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {reflection ? 'Daily Reflection Logged' : 'Log Daily Reflection'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {reflection
                ? `${reflection.rating} / 5 Stars • "${reflection.wentWell || reflection.notes || 'Day recorded'}"`
                : 'Take 2 minutes to record your wins, improvements, and mindfulness score.'}
            </p>
          </div>
        </div>

        <button className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition">
          {reflection ? 'View / Edit' : 'Reflect'}
        </button>
      </div>
    </div>
  );
};
