import React from 'react';
import { Target, Flame, Trophy, TrendingUp, TrendingDown, ChevronRight, Plus } from 'lucide-react';
import { GoalPerformanceData } from '../../domain/AnalyticsCalculationEngine';

interface GoalPerformanceSectionProps {
  goalPerformances: GoalPerformanceData[];
  onSelectGoal: (goalPerf: GoalPerformanceData) => void;
  onCreateGoal?: () => void;
  reduceMotion?: boolean;
}

export const GoalPerformanceSection: React.FC<GoalPerformanceSectionProps> = ({
  goalPerformances,
  onSelectGoal,
  onCreateGoal,
  reduceMotion = false,
}) => {
  return (
    <div
      id="goal-performance-section"
      className="rounded-3xl bg-white dark:bg-neutral-900 p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Goal Performance
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Trajectory, target completion, and streak velocity across active objectives
            </p>
          </div>
        </div>

        {onCreateGoal && (
          <button
            type="button"
            onClick={onCreateGoal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Goal</span>
          </button>
        )}
      </div>

      {/* Goals List */}
      {goalPerformances.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center space-y-2">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            No active or completed goals found. Create goals to track multi-week objectives and habits.
          </p>
          {onCreateGoal && (
            <button
              type="button"
              onClick={onCreateGoal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Define Your First Goal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {goalPerformances.map((gp) => {
            const isCompleted = gp.isCompleted || gp.goal.status === 'COMPLETED';
            const progress = Math.min(100, Math.round(gp.progressPct));

            return (
              <button
                key={gp.goal.id}
                type="button"
                onClick={() => onSelectGoal(gp)}
                className={`group relative text-left p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 transition-all cursor-pointer ${
                  reduceMotion ? '' : 'hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-xs'
                }`}
              >
                {/* Top Row: Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-neutral-900 dark:text-neutral-50 font-display line-clamp-1">
                        {gp.goal.title}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Complete
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-500">
                      Target: {gp.targetValue} {gp.unit}
                    </span>
                  </div>

                  <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-amber-500 transition shrink-0" />
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">
                      {progress}% Scaled
                    </span>
                    <span className="font-semibold text-neutral-500">
                      {gp.currentValue} / {gp.targetValue} {gp.unit}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                    <div
                      style={{ width: `${progress}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Bottom Row: Streaks & Trend */}
                <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                      <Flame className="h-3.5 w-3.5 fill-orange-500" />
                      <span>{gp.currentStreak}d streak</span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                      <Trophy className="h-3 w-3" />
                      <span>Best: {gp.longestStreak}d</span>
                    </div>
                  </div>

                  {gp.trendPct !== null && (
                    <div className="flex items-center gap-1 font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                      {gp.trendPct >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-amber-500" />
                      )}
                      <span>{gp.trendPct >= 0 ? `+${gp.trendPct}%` : `${gp.trendPct}%`}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
