import React, { useState } from 'react';
import { Routine, TaskType } from '../types';
import { X, Check } from 'lucide-react';

interface CompleteMeasurableModalProps {
  routine: Routine | null;
  onDismiss: () => void;
  onConfirm: (value: number, notes: string) => void;
}

export const CompleteMeasurableModal: React.FC<CompleteMeasurableModalProps> = ({
  routine,
  onDismiss,
  onConfirm,
}) => {
  if (!routine) return null;

  const [valueText, setValueText] = useState(String(routine.targetValue || 1));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getPromptLabel = () => {
    switch (routine.taskType) {
      case TaskType.DURATION:
        return `Duration (${routine.unit.trim() || 'minutes'})`;
      case TaskType.QUANTITY:
        return `Quantity (${routine.unit.trim() || 'units'})`;
      case TaskType.COUNT:
        return `Count (${routine.unit.trim() || 'reps'})`;
      case TaskType.TIME_BASED:
        return 'Check-in Value';
      default:
        return 'Value';
    }
  };

  const handleIncrement = (inc: number) => {
    const current = parseFloat(valueText) || 0;
    const updated = Math.max(0, current + inc);
    setValueText(String(Math.round(updated * 10) / 10));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(valueText);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid positive number');
      return;
    }
    onConfirm(parsed, notes.trim());
  };

  return (
    <div
      id="measurable-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Record Progress
            </h2>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {routine.name}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              {getPromptLabel()}
            </label>
            <input
              id="measurable-input-field"
              type="number"
              step="any"
              value={valueText}
              onChange={(e) => {
                setValueText(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 30"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
          </div>

          {/* Quick Increment Chips */}
          <div>
            <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              Quick Adjust
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[1, 5, 10, 20].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleIncrement(inc)}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Optional Reflection Notes
            </label>
            <textarea
              id="measurable-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Felt energized, completed with ease..."
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="cancel-measurable-button"
              type="button"
              onClick={onDismiss}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              id="confirm-measurable-button"
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98]"
            >
              <Check className="h-4 w-4" />
              Save Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
