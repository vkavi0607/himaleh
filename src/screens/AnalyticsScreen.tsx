import React from 'react';
import { StreakStats, Routine, RoutineLog, DailyReflection } from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { Flame, Trophy, CheckCircle2, Award, Calendar, Star, BarChart3 } from 'lucide-react';

interface AnalyticsScreenProps {
  streakStats: StreakStats;
  routines: Routine[];
  logs: RoutineLog[];
  reflections: DailyReflection[];
  onSelectDate: (date: string) => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  streakStats,
  routines,
  logs,
  reflections,
  onSelectDate,
}) => {
  const today = ProgressCalculationEngine.getTodayStr();

  // Generate 14-day history for the interactive heatmap / calendar strip
  const last14Days: Array<{
    date: string;
    dayLabel: string;
    dateNum: string;
    completedCount: number;
    totalPlanned: number;
    percentage: number;
    isRestDay: boolean;
  }> = [];

  for (let i = 13; i >= 0; i--) {
    const d = ProgressCalculationEngine.addDays(today, -i);
    const prog = ProgressCalculationEngine.calculateDailyProgress(d, routines, logs);
    const parts = d.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'narrow' });
    const dateNum = String(dateObj.getDate());

    last14Days.push({
      date: d,
      dayLabel,
      dateNum,
      completedCount: prog.completedCount,
      totalPlanned: prog.totalPlanned,
      percentage: prog.completionPercentage,
      isRestDay: prog.totalPlanned === 0,
    });
  }

  // Category completion tally
  const categoryStats: Record<string, { total: number; completed: number }> = {};
  routines.forEach((r) => {
    if (!categoryStats[r.category]) {
      categoryStats[r.category] = { total: 0, completed: 0 };
    }
    categoryStats[r.category].total += 1;
  });

  logs.forEach((log) => {
    if (log.isCompleted) {
      const routine = routines.find((r) => r.id === log.routineId);
      if (routine && categoryStats[routine.category]) {
        categoryStats[routine.category].completed += 1;
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
            Consistency Analytics
          </h1>
        </div>
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
          Mathematical consistency engine tracking habits, streaks, and reflections
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 space-y-2 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            <Flame className="h-5 w-5 fill-orange-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
              {streakStats.currentStreak}
            </span>
            <p className="text-xs font-semibold text-neutral-500">Current Streak</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 space-y-2 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
              {streakStats.longestStreak}
            </span>
            <p className="text-xs font-semibold text-neutral-500">Longest Streak</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 space-y-2 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
              {streakStats.weeklyConsistencyPercentage}%
            </span>
            <p className="text-xs font-semibold text-neutral-500">Weekly Consistency</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 space-y-2 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-neutral-900 dark:text-neutral-50 font-display">
              {streakStats.totalCompletions}
            </span>
            <p className="text-xs font-semibold text-neutral-500">Total Completions</p>
          </div>
        </div>
      </div>

      {/* 14-Day Consistency Strip */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              14-Day Consistency Matrix
            </h2>
          </div>
          <span className="text-xs text-neutral-400">Tap day to view in dashboard</span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {last14Days.map((day) => {
            const isToday = day.date === today;
            let bgClass = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400';
            if (day.isRestDay) {
              bgClass = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-900/40';
            } else if (day.percentage >= 100) {
              bgClass = 'bg-emerald-600 text-white font-bold shadow-xs';
            } else if (day.percentage > 0) {
              bgClass = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300';
            } else if (!isToday) {
              bgClass = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500';
            }

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                title={`${day.date}: ${day.isRestDay ? 'Rest Day' : `${day.completedCount}/${day.totalPlanned} done`}`}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${bgClass} ${
                  isToday ? 'ring-2 ring-neutral-900 dark:ring-neutral-100' : ''
                }`}
              >
                <span className="text-[10px] font-bold opacity-75">{day.dayLabel}</span>
                <span className="text-xs font-black">{day.dateNum}</span>
                <span className="text-[9px] mt-0.5 font-semibold truncate">
                  {day.isRestDay ? 'Rest' : `${Math.round(day.percentage)}%`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Category Breakdown
          </h2>
        </div>

        <div className="space-y-3">
          {Object.entries(categoryStats).map(([cat, stats]) => {
            const maxVal = Math.max(...Object.values(categoryStats).map((s) => s.completed), 1);
            const fillPct = Math.min(100, Math.round((stats.completed / maxVal) * 100));

            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-neutral-800 dark:text-neutral-200">{cat}</span>
                  <span className="text-neutral-500">
                    {stats.completed} completions ({stats.total} habits)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reflections Log */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Recent Reflections
          </h2>
        </div>

        {reflections.length === 0 ? (
          <p className="text-xs text-neutral-500 italic py-2">
            No reflections recorded yet. Complete your first daily reflection from the dashboard.
          </p>
        ) : (
          <div className="space-y-3">
            {reflections.slice(0, 5).map((ref) => (
              <div
                key={ref.id}
                className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 p-3.5 border border-neutral-200 dark:border-neutral-700/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {ref.date}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= ref.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {ref.wentWell && (
                  <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Wins:</span> {ref.wentWell}
                  </p>
                )}

                {ref.couldImprove && (
                  <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                    <span className="font-bold text-amber-600 dark:text-amber-400">Improve:</span> {ref.couldImprove}
                  </p>
                )}

                {ref.notes && (
                  <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                    <span className="font-bold text-purple-600 dark:text-purple-400">Notes:</span> {ref.notes}
                  </p>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectDate(ref.date)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    View in Day Log →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
