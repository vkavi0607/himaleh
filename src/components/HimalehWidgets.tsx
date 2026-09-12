import React, { useState } from 'react';
import { Routine, Goal, DayLedger } from '../types';
import { HimalehLogo } from './HimalehLogo';
import { Flame, CheckCircle, Clock, ChevronRight, Sparkles, Target, Layers } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

interface HimalehWidgetsProps {
  routines: Routine[];
  goals: Goal[];
  todayLedger?: DayLedger;
  currentStreak: number;
  consistencyScore: number;
  onToggleRoutine?: (routineId: number) => void;
  onSelectGoal?: (goal: Goal) => void;
}

export const HimalehWidgets: React.FC<HimalehWidgetsProps> = ({
  routines,
  goals,
  todayLedger,
  currentStreak,
  consistencyScore,
  onToggleRoutine,
  onSelectGoal,
}) => {
  const { isDark } = useTheme();
  const [activeWidgetTab, setActiveWidgetTab] = useState<'compact' | 'goal' | 'glance'>('compact');

  const completedCount = todayLedger?.completedRoutineIds?.length || 0;
  const totalRoutines = routines.length;
  const progressPct = totalRoutines > 0 ? Math.round((completedCount / totalRoutines) * 100) : 0;

  // Next pending routine
  const nextRoutine = routines.find(
    (r) => !todayLedger?.completedRoutineIds?.includes(r.id) && !todayLedger?.skippedRoutineIds?.includes(r.id)
  );

  // Top focus goal
  const primaryGoal = goals[0];
  const goalProgressPct = primaryGoal && primaryGoal.targetValue > 0
    ? Math.min(100, Math.round((primaryGoal.currentValue / primaryGoal.targetValue) * 100))
    : 0;

  return (
    <div id="himaleh-widget-suite" className="space-y-4">
      {/* Widget Showcase Header & Tab Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Himaleh System Widgets
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
          {(['compact', 'goal', 'glance'] as const).map((tab) => (
            <button
              key={tab}
              id={`widget-tab-${tab}`}
              onClick={() => setActiveWidgetTab(tab)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                activeWidgetTab === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Widget Containers */}
      <div className="relative">
        {/* COMPACT TODAY WIDGET (Classic Medium iOS/Android Style) */}
        {activeWidgetTab === 'compact' && (
          <div
            id="himaleh-widget-compact"
            className="group relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white p-5 shadow-lg border border-slate-200/90 dark:border-slate-800/90 max-w-md mx-auto"
          >
            {/* Subtle Summit Ambient Light */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Widget Top Header with Official Crest */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <HimalehLogo variant="crest" theme={isDark ? 'dark' : 'light'} size={24} />
                <span className="font-serif font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                  Himaleh
                </span>
                <span className="text-[10px] font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase">
                  Daily Trail
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                <Flame className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                <span>{currentStreak}d Streak</span>
              </div>
            </div>

            {/* Main Metrics Layout */}
            <div className="grid grid-cols-2 gap-3 mb-3.5">
              {/* Progress Card */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Today's Ascent
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {progressPct}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({completedCount}/{totalRoutines})
                  </span>
                </div>
                {/* Trail Progress Bar */}
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700/60 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Consistency Score Card */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Consistency Rate
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {consistencyScore}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2">
                  <Sparkles className="h-2.5 w-2.5 text-amber-500 dark:text-amber-400" />
                  Calculated Trail Score
                </span>
              </div>
            </div>

            {/* Next Routine Quick View */}
            {nextRoutine ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/40">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {nextRoutine.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {`${String(nextRoutine.timeHour).padStart(2, '0')}:${String(nextRoutine.timeMinute).padStart(2, '0')}`}
                    </span>
                  </div>
                </div>
                {onToggleRoutine && (
                  <button
                    id={`widget-complete-${nextRoutine.id}`}
                    type="button"
                    onClick={() => onToggleRoutine(nextRoutine.id)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>Done</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-amber-600 dark:text-amber-300/80 font-medium">
                ✨ All routines for today completed! Peak reached.
              </div>
            )}
          </div>
        )}

        {/* GOAL SUMMIT WIDGET */}
        {activeWidgetTab === 'goal' && (
          <div
            id="himaleh-widget-goal"
            className="group relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white p-5 shadow-lg border border-slate-200/90 dark:border-slate-800/90 max-w-md mx-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <HimalehLogo variant="crest" theme={isDark ? 'dark' : 'light'} size={24} />
                <span className="font-serif font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                  Himaleh
                </span>
                <span className="text-[10px] font-bold tracking-widest text-rose-600 dark:text-rose-400 uppercase">
                  Summit Goal
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                Active Peak
              </span>
            </div>

            {primaryGoal ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                      {primaryGoal.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Target: {primaryGoal.targetValue} {primaryGoal.unit}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      {goalProgressPct}%
                    </span>
                  </div>
                </div>

                {/* Summit Path Progress with Flag */}
                <div className="relative pt-2 pb-1">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-rose-500 rounded-full transition-all"
                      style={{ width: `${goalProgressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Current: {primaryGoal.currentValue} {primaryGoal.unit}</span>
                  {onSelectGoal && (
                    <button
                      type="button"
                      onClick={() => onSelectGoal(primaryGoal)}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Inspect Peak</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                <Target className="h-8 w-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
                No active goals created yet. Set your first summit target.
              </div>
            )}
          </div>
        )}

        {/* GLANCE / LOCK SCREEN WIDGET */}
        {activeWidgetTab === 'glance' && (
          <div
            id="himaleh-widget-glance"
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-md max-w-md mx-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HimalehLogo variant="badge" size={42} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-black text-sm text-slate-900 dark:text-slate-100">
                      Himaleh
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                      Glance
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {completedCount} of {totalRoutines} routines climbed
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-sm">
                  <Flame className="h-4 w-4" />
                  <span>{currentStreak}d</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {consistencyScore}% score
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
