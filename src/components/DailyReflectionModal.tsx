import React, { useState } from 'react';
import { DailyReflection } from '../types';
import { Star, X, Check } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Daily Reflection
            </h2>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {formatDisplayDate(date)}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div className="text-center py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700/60">
            <span className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-2">
              How was your day? ({rating} / 5)
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  id={`reflection-star-${star}`}
                  onClick={() => setRating(star)}
                  className="p-1 rounded-lg hover:scale-110 active:scale-95 transition cursor-pointer"
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
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              What went well today?
            </label>
            <textarea
              id="reflection-went-well-input"
              rows={2}
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="Wins, completed routines, focus blocks, energy..."
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              What could be improved?
            </label>
            <textarea
              id="reflection-could-improve-input"
              rows={2}
              value={couldImprove}
              onChange={(e) => setCouldImprove(e.target.value)}
              placeholder="Distractions, obstacles, bedtime consistency..."
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              General Thoughts / Free Notes
            </label>
            <textarea
              id="reflection-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any realizations or thoughts for tomorrow..."
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="cancel-reflection-button"
              type="button"
              onClick={onDismiss}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-reflection-button"
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-5 py-2.5 text-sm font-bold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition active:scale-[0.98] cursor-pointer"
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
