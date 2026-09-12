import React from 'react';
import { X, Calendar, CheckCircle2, Clock, SkipForward, AlertCircle, Star, ArrowRight } from 'lucide-react';
import { DayPerformancePoint } from '../../domain/AnalyticsCalculationEngine';

interface AnalyticsDateDetailModalProps {
  point: DayPerformancePoint | null;
  onClose: () => void;
  onNavigateToDate: (dateStr: string) => void;
}

export const AnalyticsDateDetailModal: React.FC<AnalyticsDateDetailModalProps> = ({
  point,
  onClose,
  onNavigateToDate,
}) => {
  if (!point) return null;

  const parts = point.date.split('-').map(Number);
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isRestDay = point.totalPlanned === 0;

  return (
    <div
      id="analytics-date-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="analytics-date-modal-card"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Daily Ledger
              </span>
              <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 font-display">
                {formattedDate}
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

        {/* Status & Metrics Strip */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-center">
            <span className="text-xs text-neutral-500 font-semibold block">Planned</span>
            <span className="text-lg font-black text-neutral-900 dark:text-neutral-50 font-display">
              {point.totalPlanned}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold block">Completed</span>
            <span className="text-lg font-black text-emerald-800 dark:text-emerald-200 font-display">
              {point.completedCount}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-center">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold block">Scaled Rate</span>
            <span className="text-lg font-black text-amber-800 dark:text-amber-200 font-display">
              {isRestDay ? 'Rest' : `${Math.round(point.percentage)}%`}
            </span>
          </div>
        </div>

        {/* Routines Breakdown List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
            Planned Routines for this Day
          </h4>

          {isRestDay ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4 text-center">
              <p className="text-xs font-medium text-neutral-500">
                Official Rest Day. Zero planned routines were active on this date.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {point.plannedRoutines.map((routine) => {
                const log = point.routineLogMap[routine.id];
                const isCompleted = log?.isCompleted;
                const isSkipped = log?.isSkipped;
                const h = String(routine.timeHour).padStart(2, '0');
                const m = String(routine.timeMinute).padStart(2, '0');

                return (
                  <div
                    key={routine.id}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {routine.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300">
                          {routine.category}
                        </span>
                      </div>

                      {/* Status pill */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Done
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <SkipForward className="h-3 w-3" />
                          Skipped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                          <AlertCircle className="h-3 w-3" />
                          Incomplete
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {h}:{m}
                      </span>
                      {log?.loggedValue !== null && log?.loggedValue !== undefined && log.loggedValue > 0 && (
                        <span>
                          Logged: {log.loggedValue} {routine.unit || ''}
                        </span>
                      )}
                      {log?.skipReason && (
                        <span className="italic">Reason: {log.skipReason}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Reflection if present */}
        {point.reflection && (
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Daily Reflection
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${
                      s <= (point.reflection?.rating || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-300 dark:text-neutral-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {point.reflection.wentWell && (
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Wins:</span>{' '}
                {point.reflection.wentWell}
              </p>
            )}
            {point.reflection.couldImprove && (
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                <span className="font-bold text-amber-600 dark:text-amber-400">Improve:</span>{' '}
                {point.reflection.couldImprove}
              </p>
            )}
            {point.reflection.notes && (
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Notes:</span>{' '}
                {point.reflection.notes}
              </p>
            )}
          </div>
        )}

        {/* Bottom CTA: Open in Dashboard */}
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
              onNavigateToDate(point.date);
            }}
            className="w-2/3 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <span>Open in Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
