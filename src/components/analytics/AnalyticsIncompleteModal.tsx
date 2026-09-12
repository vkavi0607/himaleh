import React from 'react';
import { X, AlertCircle, Clock, Calendar, ArrowRight } from 'lucide-react';
import { IncompleteRoutineEntry } from '../../domain/AnalyticsCalculationEngine';

interface AnalyticsIncompleteModalProps {
  incompleteRoutines: IncompleteRoutineEntry[];
  onClose: () => void;
  onNavigateToDate: (dateStr: string) => void;
}

export const AnalyticsIncompleteModal: React.FC<AnalyticsIncompleteModalProps> = ({
  incompleteRoutines,
  onClose,
  onNavigateToDate,
}) => {
  return (
    <div
      id="analytics-incomplete-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="analytics-incomplete-modal-card"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Accountability Review
              </span>
              <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 font-display">
                Missed Routines Log ({incompleteRoutines.length})
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

        <p className="text-xs text-neutral-500 leading-relaxed">
          These routines were naturally scheduled in past days and left uncompleted without an intentional skip or reschedule. Review them to identify friction points and strengthen daily momentum.
        </p>

        {/* List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {incompleteRoutines.map((entry, idx) => (
            <div
              key={`${entry.date}-${entry.routine.id}-${idx}`}
              className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {entry.routine.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300">
                    {entry.routine.category}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-[10px] text-neutral-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {entry.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {entry.scheduledTime}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDate(entry.date);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-200/70 hover:bg-amber-400 hover:text-slate-950 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
              >
                <span>View Date</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 font-bold text-xs transition cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
