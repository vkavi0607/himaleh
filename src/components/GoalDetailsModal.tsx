import React, { useState } from 'react';
import { Goal, GoalProgressResult, Routine, GoalStatus } from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { X, Edit, Trash2, CheckCircle2, PauseCircle, PlayCircle, Target, Sparkles } from 'lucide-react';

interface GoalDetailsModalProps {
  goal: Goal | null;
  progress: GoalProgressResult | null;
  linkedRoutines: Routine[];
  onDismiss: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: GoalStatus) => void;
  onUpdateManualProgress?: (value: number) => void;
}

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
  goal,
  progress,
  linkedRoutines,
  onDismiss,
  onEdit,
  onDelete,
  onStatusChange,
  onUpdateManualProgress,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  if (!goal) return null;

  const pct = progress?.percentage ?? 0;
  const currentVal = progress?.currentValue ?? goal.currentValue;

  const today = ProgressCalculationEngine.getTodayStr();
  const diffDays = Math.round(
    (new Date(goal.endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      id="goal-details-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="inline-block rounded-lg bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
              {goal.category}
            </span>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {goal.title}
            </h2>
            {goal.description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {goal.description}
              </p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Card */}
        <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              Progress: {Math.round(pct)}%
            </span>
            <span className="font-semibold text-neutral-600 dark:text-neutral-300">
              {currentVal} / {goal.targetValue} {goal.unit}
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              {diffDays >= 0
                ? `${diffDays} days left until ${goal.endDate}`
                : `Target deadline passed (${goal.endDate})`}
            </span>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
            >
              Update Value
            </button>
          </div>

          {showManualInput && onUpdateManualProgress && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="number"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={`Current ${goal.unit}`}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
              <button
                onClick={() => {
                  const val = parseFloat(manualInput);
                  if (!isNaN(val) && val >= 0) {
                    onUpdateManualProgress(val);
                    setShowManualInput(false);
                    setManualInput('');
                  }
                }}
                className="rounded-lg bg-neutral-900 dark:bg-neutral-100 px-3 py-1.5 text-xs font-bold text-white dark:text-neutral-900 cursor-pointer"
              >
                Set
              </button>
            </div>
          )}
        </div>

        {/* Motivation Section */}
        {goal.motivation && (
          <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Motivation (Your "Why")</span>
            </div>
            <p className="text-xs italic text-neutral-700 dark:text-neutral-300">
              "{goal.motivation}"
            </p>
          </div>
        )}

        {/* Linked Routines */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Linked Routines ({linkedRoutines.length})
          </span>
          {linkedRoutines.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">
              No daily routines linked yet. You can link a routine when adding or editing one.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {linkedRoutines.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-800/40 px-3 py-2 border border-neutral-200 dark:border-neutral-700/40"
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {r.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-500">
                    {String(r.timeHour).padStart(2, '0')}:{String(r.timeMinute).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status toggles & Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            {goal.status === GoalStatus.ACTIVE ? (
              <button
                type="button"
                onClick={() => onStatusChange(GoalStatus.PAUSED)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <PauseCircle className="h-4 w-4" />
                Pause Goal
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusChange(GoalStatus.ACTIVE)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
              >
                <PlayCircle className="h-4 w-4" />
                Resume Goal
              </button>
            )}

            {goal.status !== GoalStatus.COMPLETED && (
              <button
                type="button"
                onClick={() => onStatusChange(GoalStatus.COMPLETED)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Complete
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 dark:border-neutral-700 p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Edit Goal"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-300 dark:border-rose-900 p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
              title="Delete Goal"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 space-y-3">
            <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
              Are you sure you want to delete '{goal.title}'? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
              >
                Delete Goal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
