import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { IncompleteRoutineEntry } from '../../domain/AnalyticsCalculationEngine';

interface AccountabilityCardProps {
  incompleteRoutines: IncompleteRoutineEntry[];
  onOpenMissedModal: () => void;
}

export const AccountabilityCard: React.FC<AccountabilityCardProps> = ({
  incompleteRoutines,
  onOpenMissedModal,
}) => {
  if (incompleteRoutines.length === 0) {
    return null;
  }

  return (
    <div
      id="accountability-warning-card"
      className="rounded-3xl bg-gradient-to-r from-rose-50 via-rose-50/60 to-amber-50/40 dark:from-rose-950/40 dark:via-neutral-900 dark:to-neutral-900 p-5 sm:p-6 border border-rose-200 dark:border-rose-900/60 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
                Accountability Signal
              </span>
            </div>
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 font-display">
              Get Back on Track
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed">
              {incompleteRoutines.length} routine{incompleteRoutines.length > 1 ? 's were' : ' was'}{' '}
              left incomplete across past days. Intentionally skipped or paused routines were
              excluded.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenMissedModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer shrink-0"
        >
          <span>View Missed Routines</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
