import React, { useState } from 'react';
import { Routine } from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { Calendar, X, Check } from 'lucide-react';

interface RescheduleModalProps {
  routine: Routine | null;
  currentDate: string;
  onDismiss: () => void;
  onConfirm: (targetDate: string) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  routine,
  currentDate,
  onDismiss,
  onConfirm,
}) => {
  if (!routine) return null;

  const defaultNextDate = ProgressCalculationEngine.addDays(currentDate, 1);
  const [selectedDate, setSelectedDate] = useState(defaultNextDate);

  const presets = [
    { label: 'Tomorrow', date: ProgressCalculationEngine.addDays(currentDate, 1) },
    { label: '+2 Days', date: ProgressCalculationEngine.addDays(currentDate, 2) },
    { label: '+3 Days', date: ProgressCalculationEngine.addDays(currentDate, 3) },
    { label: 'Next Week', date: ProgressCalculationEngine.addDays(currentDate, 7) },
  ];

  const formatDisplayDate = (dStr: string) => {
    try {
      const parts = dStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div
      id="reschedule-dialog"
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
              Reschedule Routine
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

        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Move this specific occurrence to another date without altering your recurring routine schedule.
        </p>

        {/* Selected Date Indicator */}
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5">
          <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="block text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              New Target Date
            </span>
            <span className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Quick Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const isSelected = selectedDate === preset.date;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSelectedDate(preset.date)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition border cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Input */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Or Choose Custom Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="cancel-reschedule-button"
            type="button"
            onClick={onDismiss}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Cancel
          </button>
          <button
            id="confirm-reschedule-button"
            type="button"
            onClick={() => onConfirm(selectedDate)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98]"
          >
            <Check className="h-4 w-4" />
            Confirm Reschedule
          </button>
        </div>
      </div>
    </div>
  );
};
