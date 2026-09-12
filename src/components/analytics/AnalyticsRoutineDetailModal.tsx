import React from 'react';
import { X, Activity, Flame, Trophy, Clock, Calendar, ArrowRight } from 'lucide-react';
import { RoutinePerformanceData } from '../../domain/AnalyticsCalculationEngine';

interface AnalyticsRoutineDetailModalProps {
  routinePerf: RoutinePerformanceData | null;
  onClose: () => void;
  onNavigateToRoutines: () => void;
}

export const AnalyticsRoutineDetailModal: React.FC<AnalyticsRoutineDetailModalProps> = ({
  routinePerf,
  onClose,
  onNavigateToRoutines,
}) => {
  if (!routinePerf) return null;

  const { routine, completionPct, completedCount, missedCount, skippedCount, currentStreak, bestStreak } = routinePerf;
  const h = String(routine.timeHour).padStart(2, '0');
  const m = String(routine.timeMinute).padStart(2, '0');

  return (
    <div
      id="analytics-routine-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="analytics-routine-modal-card"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Routine Analytics
              </span>
              <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 font-display">
                {routine.name}
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

        {/* Core Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-700 dark:text-neutral-300">
            {routine.category}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5" />
            {h}:{m}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="h-3.5 w-3.5" />
            {routine.frequency}
          </span>
        </div>

        {/* Execution Fidelity KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-center">
            <span className="text-[11px] text-neutral-500 block">Rate</span>
            <span className="text-lg font-black text-neutral-900 dark:text-neutral-50 font-display">
              {completionPct}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block">Completed</span>
            <span className="text-lg font-black text-emerald-800 dark:text-emerald-200 font-display">
              {completedCount}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 text-center">
            <span className="text-[11px] text-rose-700 dark:text-rose-300 block">Missed</span>
            <span className="text-lg font-black text-rose-800 dark:text-rose-200 font-display">
              {missedCount}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-700 dark:text-slate-300 block">Skipped</span>
            <span className="text-lg font-black text-slate-800 dark:text-slate-200 font-display">
              {skippedCount}
            </span>
          </div>
        </div>

        {/* Streaks Strip */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-around">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Flame className="h-4 w-4 fill-orange-500" />
            <span className="text-xs font-bold">Current: {currentStreak} days</span>
          </div>
          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700" />
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Trophy className="h-4 w-4" />
            <span className="text-xs font-bold">Record: {bestStreak} days</span>
          </div>
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
              onNavigateToRoutines();
            }}
            className="w-2/3 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <span>Manage in Routines</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
