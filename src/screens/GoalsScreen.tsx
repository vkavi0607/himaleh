import React, { useState } from 'react';
import { Goal, GoalProgressResult, Routine, GoalStatus } from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { Target, Plus, CheckCircle2, PauseCircle, Sparkles } from 'lucide-react';

interface GoalsScreenProps {
  goals: Goal[];
  routines: Routine[];
  goalProgressMap: Record<number, GoalProgressResult>;
  onSelectGoal: (goal: Goal) => void;
  onOpenNewGoal: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  routines,
  goalProgressMap,
  onSelectGoal,
  onOpenNewGoal,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'>('ALL');
  const today = ProgressCalculationEngine.getTodayStr();

  const filteredGoals = goals.filter((g) => {
    if (filter === 'ACTIVE') return g.status === GoalStatus.ACTIVE;
    if (filter === 'COMPLETED') return g.status === GoalStatus.COMPLETED;
    if (filter === 'PAUSED') return g.status === GoalStatus.PAUSED;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
              Long-term Goals
            </h1>
          </div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
            Turn ambitious milestones into concrete daily habits
          </p>
        </div>

        <button
          id="new-goal-button"
          onClick={onOpenNewGoal}
          className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 dark:bg-neutral-100 px-4 py-2.5 text-xs font-bold text-white dark:text-neutral-900 shadow-xs hover:opacity-90 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'ACTIVE', 'COMPLETED', 'PAUSED'] as const).map((f) => {
          const isSelected = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition border cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {f === 'ALL' ? 'All Goals' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            No goals found in this view
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Set clear targets with measurable metrics and link them to your daily routines.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenNewGoal}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-xs font-bold text-white dark:text-neutral-900 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Your First Goal
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const prog = goalProgressMap[goal.id];
            const pct = prog?.percentage ?? 0;
            const currentVal = prog?.currentValue ?? goal.currentValue;
            const linked = routines.filter((r) => r.linkedGoalId === goal.id);

            const diffDays = Math.round(
              (new Date(goal.endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={goal.id}
                id={`goal-card-${goal.id}`}
                onClick={() => onSelectGoal(goal)}
                className="group relative bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-5 space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer shadow-xs"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                        {goal.category}
                      </span>
                      {goal.status === GoalStatus.COMPLETED && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                      )}
                      {goal.status === GoalStatus.PAUSED && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400">
                          <PauseCircle className="h-3 w-3" /> Paused
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {goal.title}
                    </h3>
                  </div>

                  <span className="text-lg font-black text-neutral-900 dark:text-neutral-100 font-display">
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                    <span>
                      {currentVal} / {goal.targetValue} {goal.unit}
                    </span>
                    <span>
                      {diffDays >= 0 ? `${diffDays} days left` : 'Deadline passed'}
                    </span>
                  </div>
                </div>

                {/* Motivation snippet */}
                {goal.motivation && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <p className="truncate italic">"{goal.motivation}"</p>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400">
                  <span>{linked.length} linked routines</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
