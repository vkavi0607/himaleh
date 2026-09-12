import React from 'react';
import { X, Star, Sparkles, Edit3, Calendar } from 'lucide-react';
import { DailyReflection } from '../types';

interface FullReflectionModalProps {
  reflection: DailyReflection;
  onClose: () => void;
  onEdit: () => void;
}

export const FullReflectionModal: React.FC<FullReflectionModalProps> = ({
  reflection,
  onClose,
  onEdit,
}) => {
  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      id="full-reflection-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="full-reflection-modal-container"
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatFullDate(reflection.date)}</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
              Daily Reflection Ledger
            </h2>
          </div>
          <button
            id="close-full-reflection-button"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-left">
          {/* Star Rating Display */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                Day Execution Rating:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= reflection.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-300 dark:text-neutral-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100 font-mono">
              {reflection.rating} / 5 Stars
            </span>
          </div>

          {/* Section 1: What Went Well */}
          {reflection.wentWell && (
            <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider font-display">
                  What Went Well
                </span>
              </div>
              <div className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words space-y-2">
                {reflection.wentWell}
              </div>
            </div>
          )}

          {/* Section 2: What Could Be Improved */}
          {reflection.couldImprove && (
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <span className="text-sm">🎯</span>
                <span className="text-xs font-bold uppercase tracking-wider font-display">
                  What Could Be Improved
                </span>
              </div>
              <div className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words space-y-2">
                {reflection.couldImprove}
              </div>
            </div>
          )}

          {/* Section 3: Thoughts & Notes */}
          {reflection.notes && (
            <div className="rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
                <span className="text-sm">📝</span>
                <span className="text-xs font-bold uppercase tracking-wider font-display">
                  Thoughts, Mindset & Notes
                </span>
              </div>
              <div className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words space-y-2">
                {reflection.notes}
              </div>
            </div>
          )}

          {!reflection.wentWell && !reflection.couldImprove && !reflection.notes && (
            <p className="text-sm text-neutral-500 italic py-4 text-center">
              No written notes were recorded for this day.
            </p>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer min-h-[44px]"
          >
            Close
          </button>
          <button
            id="edit-from-full-reflection-button"
            type="button"
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer min-h-[44px]"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Reflection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
