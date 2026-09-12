import React, { useState, useMemo } from 'react';
import {
  StreakStats,
  Routine,
  RoutineLog,
  DailyReflection,
  Goal,
  UserSettings,
  CelebrationEvent,
} from '../types';
import {
  AnalyticsCalculationEngine,
  TimeRangeKey,
  DayPerformancePoint,
  GoalPerformanceData,
  RoutinePerformanceData,
} from '../domain/AnalyticsCalculationEngine';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';
import { AnalyticsHeroCard } from '../components/analytics/AnalyticsHeroCard';
import { PerformanceChart } from '../components/analytics/PerformanceChart';
import { ConsistencyHeatmap } from '../components/analytics/ConsistencyHeatmap';
import { GoalPerformanceSection } from '../components/analytics/GoalPerformanceSection';
import { RoutinePerformanceSection } from '../components/analytics/RoutinePerformanceSection';
import { SmartInsightsSection } from '../components/analytics/SmartInsightsSection';
import { AccountabilityCard } from '../components/analytics/AccountabilityCard';
import { MilestonesSection } from '../components/analytics/MilestonesSection';
import { AnalyticsDateDetailModal } from '../components/analytics/AnalyticsDateDetailModal';
import { AnalyticsGoalDetailModal } from '../components/analytics/AnalyticsGoalDetailModal';
import { AnalyticsRoutineDetailModal } from '../components/analytics/AnalyticsRoutineDetailModal';
import { AnalyticsIncompleteModal } from '../components/analytics/AnalyticsIncompleteModal';
import { HimalehLogo } from '../components/HimalehLogo';
import { Star, Plus, Calendar, Compass } from 'lucide-react';

interface AnalyticsScreenProps {
  streakStats: StreakStats;
  routines: Routine[];
  goals?: Goal[];
  logs: RoutineLog[];
  reflections: DailyReflection[];
  settings?: UserSettings;
  onSelectDate: (date: string) => void;
  onNavigateToDashboard?: () => void;
  onNavigateToGoals?: () => void;
  onNavigateToRoutines?: () => void;
  onSelectGoal?: (goal: Goal) => void;
  onSelectRoutine?: (routine: Routine) => void;
  onTriggerCelebration?: (event: CelebrationEvent) => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  streakStats,
  routines,
  goals = [],
  logs,
  reflections,
  settings,
  onSelectDate,
  onNavigateToDashboard,
  onNavigateToGoals,
  onNavigateToRoutines,
  onSelectGoal,
  onSelectRoutine,
  onTriggerCelebration,
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>('7D');
  const [selectedDatePoint, setSelectedDatePoint] = useState<DayPerformancePoint | null>(null);
  const [selectedGoalPerf, setSelectedGoalPerf] = useState<GoalPerformanceData | null>(null);
  const [selectedRoutinePerf, setSelectedRoutinePerf] = useState<RoutinePerformanceData | null>(null);
  const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);

  const todayStr = ProgressCalculationEngine.getTodayStr();
  const reduceMotion = settings?.reduceMotion ?? false;

  // Determine previous period label for trend display
  const previousPeriodLabel = useMemo(() => {
    switch (selectedRange) {
      case '7D':
        return 'previous 7 days';
      case '30D':
        return 'previous 30 days';
      case '90D':
        return 'previous 3 months';
      case 'ALL':
        return 'all-time prior';
    }
  }, [selectedRange]);

  // Compute full period analytics strictly from authentic user data
  const analyticsData = useMemo(() => {
    return AnalyticsCalculationEngine.calculatePeriodAnalytics(
      selectedRange,
      routines,
      goals,
      logs,
      reflections,
      streakStats,
      todayStr
    );
  }, [selectedRange, routines, goals, logs, reflections, streakStats, todayStr]);

  const hasHistory = routines.length > 0 && (logs.length > 0 || analyticsData.activeDays > 0);

  // Empty state handling: If user has zero routines or zero logs in history
  if (routines.length === 0 && logs.length === 0) {
    return (
      <div
        id="analytics-empty-state"
        className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-8 sm:p-12 text-center space-y-6 shadow-xs"
      >
        <div className="flex justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-b from-amber-50 to-white dark:from-neutral-800 dark:to-neutral-900 border border-amber-200/80 dark:border-amber-800/60 shadow-lg">
            <HimalehLogo variant="crest" size={68} animated={!reduceMotion} />
          </div>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
            Your Analytics Will Appear Here
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Complete your first routine to start building your performance history.
            Himaleh tracks mathematical consistency, streaks, and personal milestones with zero simulated data.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>View Today's Routines</span>
            </button>
          )}

          {onNavigateToRoutines && (
            <button
              type="button"
              onClick={onNavigateToRoutines}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Routine</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Command Center Title & Segmented Range Selector */}
      <div
        id="analytics-control-header"
        className="bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-amber-500" />
              Command Center
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
            Personal Performance
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-time consistency engine analyzing habits, trajectory, and execution velocity
          </p>
        </div>

        {/* Segmented Time Range Selector */}
        <div
          id="time-range-segmented-control"
          className="inline-flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 self-start md:self-auto shrink-0"
        >
          {(['7D', '30D', '90D', 'ALL'] as TimeRangeKey[]).map((rangeKey) => {
            const isSelected = selectedRange === rangeKey;
            const label =
              rangeKey === '7D'
                ? '7 Days'
                : rangeKey === '30D'
                ? '30 Days'
                : rangeKey === '90D'
                ? '3 Months'
                : 'All Time';

            return (
              <button
                key={rangeKey}
                type="button"
                onClick={() => setSelectedRange(rangeKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Hero Performance Card */}
      <AnalyticsHeroCard
        consistencyPct={analyticsData.periodConsistencyPct}
        trendVsPrevious={analyticsData.trendVsPrevious}
        previousPeriodLabel={previousPeriodLabel}
        currentStreak={streakStats.currentStreak}
        longestStreak={streakStats.longestStreak}
        successfulDays={analyticsData.successfulDays}
        activeDays={analyticsData.activeDays}
        activeGoalsCount={analyticsData.activeGoalsCount}
        avgGoalProgressPct={analyticsData.avgGoalProgressPct}
        reduceMotion={reduceMotion}
      />

      {/* 2. Accountability Signal Card (Shown only when genuine missed routines exist) */}
      <AccountabilityCard
        incompleteRoutines={analyticsData.incompleteRoutines}
        onOpenMissedModal={() => setIsMissedModalOpen(true)}
      />

      {/* 3. Daily Completion Performance Chart */}
      <PerformanceChart
        days={analyticsData.days}
        range={selectedRange}
        onSelectDatePoint={(pt) => setSelectedDatePoint(pt)}
        reduceMotion={reduceMotion}
      />

      {/* 4. Consistency Heatmap */}
      <ConsistencyHeatmap
        days={analyticsData.days}
        onSelectDatePoint={(pt) => setSelectedDatePoint(pt)}
        reduceMotion={reduceMotion}
      />

      {/* 5. Smart Insights Section */}
      <SmartInsightsSection
        insights={analyticsData.smartInsights}
        hasHistory={hasHistory}
      />

      {/* 6. Goal Performance Section */}
      <GoalPerformanceSection
        goalPerformances={analyticsData.goalPerformances}
        onSelectGoal={(gp) => {
          setSelectedGoalPerf(gp);
          if (onSelectGoal) onSelectGoal(gp.goal);
        }}
        onCreateGoal={onNavigateToGoals}
        reduceMotion={reduceMotion}
      />

      {/* 7. Routine Performance Section */}
      <RoutinePerformanceSection
        routinePerformances={analyticsData.routinePerformances}
        onSelectRoutine={(rp) => {
          setSelectedRoutinePerf(rp);
          if (onSelectRoutine) onSelectRoutine(rp.routine);
        }}
        onCreateRoutine={onNavigateToRoutines}
        reduceMotion={reduceMotion}
      />

      {/* 8. Alpinist Milestones Section */}
      <MilestonesSection
        milestones={analyticsData.milestones}
        settings={settings}
        onTriggerCelebration={onTriggerCelebration}
        reduceMotion={reduceMotion}
      />

      {/* 9. Recent Reflections Log */}
      <div
        id="recent-reflections-section"
        className="bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Reflections Ledger
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Evening self-assessments, gratitude wins, and areas for improvement
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-neutral-400">
            {reflections.length} logged
          </span>
        </div>

        {reflections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center space-y-1">
            <p className="text-xs font-semibold text-neutral-500">
              No daily reflections recorded yet.
            </p>
            <p className="text-xs text-neutral-400">
              Use the Evening Reflection card on your dashboard to log daily notes and 5-star ratings.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reflections.slice(0, 5).map((ref) => (
              <div
                key={ref.id}
                className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 p-4 border border-neutral-200 dark:border-neutral-700/60 space-y-2"
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
                          s <= ref.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-700'
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

      {/* Interactive Detail Modals */}
      <AnalyticsDateDetailModal
        point={selectedDatePoint}
        onClose={() => setSelectedDatePoint(null)}
        onNavigateToDate={(d) => {
          setSelectedDatePoint(null);
          onSelectDate(d);
        }}
      />

      <AnalyticsGoalDetailModal
        goalPerf={selectedGoalPerf}
        onClose={() => setSelectedGoalPerf(null)}
        onNavigateToGoals={() => {
          setSelectedGoalPerf(null);
          if (onNavigateToGoals) onNavigateToGoals();
        }}
      />

      <AnalyticsRoutineDetailModal
        routinePerf={selectedRoutinePerf}
        onClose={() => setSelectedRoutinePerf(null)}
        onNavigateToRoutines={() => {
          setSelectedRoutinePerf(null);
          if (onNavigateToRoutines) onNavigateToRoutines();
        }}
      />

      {isMissedModalOpen && (
        <AnalyticsIncompleteModal
          incompleteRoutines={analyticsData.incompleteRoutines}
          onClose={() => setIsMissedModalOpen(false)}
          onNavigateToDate={(d) => {
            setIsMissedModalOpen(false);
            onSelectDate(d);
          }}
        />
      )}
    </div>
  );
};
