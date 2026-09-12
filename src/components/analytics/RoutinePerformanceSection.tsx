import React from 'react';
import { Activity, Flame, Trophy, ChevronRight, Clock, Plus } from 'lucide-react';
import { RoutinePerformanceData } from '../../domain/AnalyticsCalculationEngine';

interface RoutinePerformanceSectionProps {
  routinePerformances: RoutinePerformanceData[];
  onSelectRoutine: (routinePerf: RoutinePerformanceData) => void;
  onCreateRoutine?: () => void;
  reduceMotion?: boolean;
}

export const RoutinePerformanceSection: React.FC<RoutinePerformanceSectionProps> = ({
  routinePerformances,
  onSelectRoutine,
  onCreateRoutine,
  reduceMotion = false,
}) => {
  return (
    <div
      id="routine-performance-section"
      className="rounded-3xl bg-white dark:bg-neutral-900 p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Routine Performance
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Execution fidelity, streaks, and completed vs missed breakdown
            </p>
          </div>
        </div>

        {onCreateRoutine && (
          <button
            type="button"
            onClick={onCreateRoutine}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Routine</span>
          </button>
        )}
      </div>

      {/* Routine Cards List */}
      {routinePerformances.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center space-y-2">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            No routines created yet. Start building daily habits along your ascent.
          </p>
          {onCreateRoutine && (
            <button
              type="button"
              onClick={onCreateRoutine}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Routine</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {routinePerformances.map((rp) => {
            const h = String(rp.routine.timeHour).padStart(2, '0');
            const m = String(rp.routine.timeMinute).padStart(2, '0');
            const timeStr = `${h}:${m}`;

            return (
              <button
                key={rp.routine.id}
                type="button"
                onClick={() => onSelectRoutine(rp)}
                className={`w-full group text-left p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 transition-all cursor-pointer ${
                  reduceMotion ? '' : 'hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Routine Title & Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {rp.routine.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300">
                        {rp.routine.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeStr}
                      </span>
                      <span>•</span>
                      <span>
                        {rp.completedCount} done, {rp.missedCount} missed
                        {rp.skippedCount > 0 ? `, ${rp.skippedCount} skipped` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Percentage, Streaks, & Chevron */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-bold">
                        <Flame className="h-3.5 w-3.5 fill-orange-500" />
                        <span>{rp.currentStreak}d</span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        <Trophy className="h-3.5 w-3.5" />
                        <span>{rp.bestStreak}d</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-neutral-900 dark:text-neutral-50 font-display">
                        {rp.completionPct}%
                      </span>
                      <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-emerald-500 transition" />
                    </div>
                  </div>
                </div>

                {/* Progress track */}
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div
                    style={{ width: `${rp.completionPct}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
