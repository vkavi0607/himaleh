import React from 'react';
import { X, Target, Flame, Trophy, ArrowRight } from 'lucide-react';
import { GoalPerformanceData } from '../../domain/AnalyticsCalculationEngine';

interface AnalyticsGoalDetailModalProps {
  goalPerf: GoalPerformanceData | null;
  onClose: () => void;
  onNavigateToGoals: () => void;
}

export const AnalyticsGoalDetailModal: React.FC<AnalyticsGoalDetailModalProps> = ({
  goalPerf,
  onClose,
  onNavigateToGoals,
}) => {
  if (!goalPerf) return null;

  const { goal, progressPct, currentValue, targetValue, unit, linkedRoutines, currentStreak, longestStreak } = goalPerf;
  const progress = Math.min(100, Math.round(progressPct));

  return (
    <div
      id="analytics-goal-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="analytics-goal-modal-card"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Goal Analytics
              </span>
              <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 font-display">
                {goal.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {goal.description && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {goal.description}
          </p>
        )}

        {/* Progress Display */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {progress}% Scaled
            </span>
            <span className="text-neutral-500 font-semibold">
              {currentValue} / {targetValue} {unit}
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1 text-neutral-500">
            <div className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
              <Flame className="h-3.5 w-3.5 fill-orange-500" />
              <span>{currentStreak} day streak</span>
            </div>

            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <Trophy className="h-3.5 w-3.5" />
              <span>Best: {longestStreak} days</span>
            </div>
          </div>
        </div>

        {/* Linked Routines Section */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
            Linked Consistency Habits ({linkedRoutines.length})
          </h4>

          {linkedRoutines.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">
              No daily habits currently linked to this goal. Link routines in the Routines screen to accelerate progress.
            </p>
          ) : (
            <div className="space-y-2">
              {linkedRoutines.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60"
                >
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                      {r.name}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {r.category} • Scheduled at {String(r.timeHour).padStart(2, '0')}:{String(r.timeMinute).padStart(2, '0')}
                    </span>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Active Habit
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToGoals();
            }}
            className="w-2/3 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <span>Open Goals Screen</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
