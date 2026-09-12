import React, { useState } from 'react';
import { DailyReflection } from '../types';
import { Star, X, Check, BookOpen } from 'lucide-react';

interface DailyReflectionModalProps {
  date: string;
  existingReflection: DailyReflection | null;
  onDismiss: () => void;
  onSave: (rating: number, wentWell: string, couldImprove: string, notes: string) => void;
}

export const DailyReflectionModal: React.FC<DailyReflectionModalProps> = ({
  date,
  existingReflection,
  onDismiss,
  onSave,
}) => {
  const [rating, setRating] = useState(existingReflection?.rating || 5);
  const [wentWell, setWentWell] = useState(existingReflection?.wentWell || '');
  const [couldImprove, setCouldImprove] = useState(existingReflection?.couldImprove || '');
  const [notes, setNotes] = useState(existingReflection?.notes || '');

  const formatDisplayDate = (dStr: string) => {
    try {
      const parts = dStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(rating, wentWell.trim(), couldImprove.trim(), notes.trim());
  };

  return (
    <div
      id="daily-reflection-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Daily Reflection
              </h2>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {formatDisplayDate(date)}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-lg p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Star Rating */}
          <div className="text-center py-3 px-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700/60">
            <span className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Overall Day Rating ({rating} of 5 Stars)
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  id={`reflection-star-${star}`}
                  onClick={() => setRating(star)}
                  className="p-2 rounded-xl hover:scale-110 active:scale-95 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`${star} star`}
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                        : 'text-neutral-300 dark:text-neutral-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="reflection-went-well-input" className="block text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
              What went well today?
            </label>
            <textarea
              id="reflection-went-well-input"
              rows={3}
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="Key achievements, completed routines, focus blocks, healthy choices, energy wins..."
              className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3.5 text-sm text-neutral-900 dark:text-neutral-100 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div>
            <label htmlFor="reflection-could-improve-input" className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
              What could be improved?
            </label>
            <textarea
              id="reflection-could-improve-input"
              rows={3}
              value={couldImprove}
              onChange={(e) => setCouldImprove(e.target.value)}
              placeholder="Distractions encountered, procrastination triggers, bedtime slippage, things to adjust..."
              className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3.5 text-sm text-neutral-900 dark:text-neutral-100 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div>
            <label htmlFor="reflection-notes-input" className="block text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1.5">
              General Thoughts / Free Notes
            </label>
            <textarea
              id="reflection-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal reflections, gratitude notes, thoughts to carry into tomorrow..."
              className="w-full min-w-0 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3.5 text-sm text-neutral-900 dark:text-neutral-100 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              id="cancel-reflection-button"
              type="button"
              onClick={onDismiss}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              id="save-reflection-button"
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-6 py-2.5 text-sm font-bold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition active:scale-[0.98] cursor-pointer min-h-[44px]"
            >
              <Check className="h-4 w-4" />
              Save Reflection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
