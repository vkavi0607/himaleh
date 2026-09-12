import {
  Goal,
  Routine,
  RoutineLog,
  DailyReflection,
  StreakStats,
  GoalStatus,
} from '../types';
import { ProgressCalculationEngine } from './ProgressCalculationEngine';

export type TimeRangeKey = '7D' | '30D' | '90D' | 'ALL';

export interface DayPerformancePoint {
  date: string;
  dayLabel: string;
  dateNum: string;
  totalPlanned: number;
  completedCount: number;
  skippedCount: number;
  missedCount: number;
  percentage: number;
  status: 'COMPLETED' | 'PARTIAL' | 'MISSED' | 'SKIPPED' | 'REST_DAY';
  plannedRoutines: Routine[];
  routineLogMap: Record<number, RoutineLog>;
  reflection: DailyReflection | null;
}

export interface GoalPerformanceData {
  goal: Goal;
  progressPct: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  successfulDays: number;
  currentStreak: number;
  longestStreak: number;
  trendPct: number | null;
  isCompleted: boolean;
  linkedRoutines: Routine[];
}

export interface RoutinePerformanceData {
  routine: Routine;
  totalPlannedCount: number;
  completedCount: number;
  skippedCount: number;
  missedCount: number;
  completionPct: number;
  currentStreak: number;
  bestStreak: number;
  logs: RoutineLog[];
}

export interface IncompleteRoutineEntry {
  date: string;
  routine: Routine;
  scheduledTime: string;
}

export interface SmartInsightItem {
  id: string;
  category: 'STATUS' | 'TREND' | 'WEAKNESS' | 'RECOMMENDATION';
  title: string;
  description: string;
  accent: 'emerald' | 'amber' | 'rose' | 'indigo' | 'gold';
  iconType: 'trend_up' | 'trend_down' | 'day_star' | 'caution' | 'target' | 'time';
}

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  current: number;
  target: number;
  progressPct: number;
  isUnlocked: boolean;
  category: 'streak' | 'volume' | 'mastery';
}

export interface PeriodAnalyticsResult {
  range: TimeRangeKey;
  startDate: string;
  endDate: string;
  days: DayPerformancePoint[];
  activeDays: number;
  successfulDays: number;
  periodConsistencyPct: number;
  totalCompletedRoutines: number;
  totalPlannedRoutines: number;
  routineCompletionRate: number;
  trendVsPrevious: number | null; // e.g. +8% or -5%, null if no prior data
  previousConsistencyPct: number | null;
  avgGoalProgressPct: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  goalPerformances: GoalPerformanceData[];
  routinePerformances: RoutinePerformanceData[];
  smartInsights: SmartInsightItem[];
  incompleteRoutines: IncompleteRoutineEntry[];
  milestones: MilestoneItem[];
}

export class AnalyticsCalculationEngine {
  /**
   * Calculates comprehensive personal performance command center data.
   */
  static calculatePeriodAnalytics(
    range: TimeRangeKey,
    routines: Routine[],
    goals: Goal[],
    logs: RoutineLog[],
    reflections: DailyReflection[],
    streakStats: StreakStats,
    todayStr: string = ProgressCalculationEngine.getTodayStr()
  ): PeriodAnalyticsResult {
    // 1. Determine date boundaries
    const numDays = this.getRangeDaysCount(range, routines, logs, todayStr);
    const startDate = ProgressCalculationEngine.addDays(todayStr, -(numDays - 1));
    const endDate = todayStr;

    // Reflection map by date
    const reflectionMap = new Map<string, DailyReflection>();
    reflections.forEach((ref) => reflectionMap.set(ref.date, ref));

    // 2. Generate daily performance points for the period
    const days: DayPerformancePoint[] = [];
    let activeDays = 0;
    let successfulDays = 0;
    let totalCompletedRoutines = 0;
    let totalPlannedRoutines = 0;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = ProgressCalculationEngine.addDays(todayStr, -i);
      const prog = ProgressCalculationEngine.calculateDailyProgress(d, routines, logs);
      const parts = d.split('-').map(Number);
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
      const dateNum = String(dateObj.getDate());

      const isFuture = ProgressCalculationEngine.compareDates(d, todayStr) > 0;
      const missedCount = Math.max(0, prog.totalPlanned - prog.completedCount - prog.skippedCount);

      let status: DayPerformancePoint['status'] = 'REST_DAY';
      if (prog.totalPlanned === 0) {
        status = 'REST_DAY';
      } else if (prog.completedCount >= prog.totalPlanned) {
        status = 'COMPLETED';
      } else if (prog.completedCount > 0) {
        status = 'PARTIAL';
      } else if (prog.skippedCount === prog.totalPlanned) {
        status = 'SKIPPED';
      } else {
        // Missed (unless future date)
        status = isFuture ? 'PARTIAL' : 'MISSED';
      }

      if (prog.totalPlanned > 0) {
        activeDays++;
        totalPlannedRoutines += prog.totalPlanned;
        totalCompletedRoutines += prog.completedCount;
        if (prog.completedCount >= prog.totalPlanned) {
          successfulDays++;
        }
      }

      days.push({
        date: d,
        dayLabel,
        dateNum,
        totalPlanned: prog.totalPlanned,
        completedCount: prog.completedCount,
        skippedCount: prog.skippedCount,
        missedCount,
        percentage: prog.completionPercentage,
        status,
        plannedRoutines: prog.plannedRoutines,
        routineLogMap: prog.routineLogMap,
        reflection: reflectionMap.get(d) || null,
      });
    }

    const periodConsistencyPct = activeDays > 0
      ? Math.round((successfulDays / activeDays) * 100)
      : 0;

    const routineCompletionRate = totalPlannedRoutines > 0
      ? Math.round((totalCompletedRoutines / totalPlannedRoutines) * 100)
      : 0;

    // 3. Compute Prior Comparison Period (equal duration immediately preceding)
    let trendVsPrevious: number | null = null;
    let previousConsistencyPct: number | null = null;

    if (range !== 'ALL') {
      let priorActiveDays = 0;
      let priorSuccessfulDays = 0;

      for (let i = numDays * 2 - 1; i >= numDays; i--) {
        const d = ProgressCalculationEngine.addDays(todayStr, -i);
        const prog = ProgressCalculationEngine.calculateDailyProgress(d, routines, logs);
        if (prog.totalPlanned > 0) {
          priorActiveDays++;
          if (prog.completedCount >= prog.totalPlanned) {
            priorSuccessfulDays++;
          }
        }
      }

      if (priorActiveDays > 0) {
        previousConsistencyPct = Math.round((priorSuccessfulDays / priorActiveDays) * 100);
        trendVsPrevious = periodConsistencyPct - previousConsistencyPct;
      }
    }

    // 4. Incomplete Routines (genuine missed routines in past dates)
    const incompleteRoutines: IncompleteRoutineEntry[] = [];
    days.forEach((dp) => {
      // Only check past days, exclude today or future
      if (ProgressCalculationEngine.compareDates(dp.date, todayStr) < 0) {
        dp.plannedRoutines.forEach((r) => {
          const isDone = dp.routineLogMap[r.id]?.isCompleted;
          const isSkipped = dp.routineLogMap[r.id]?.isSkipped;
          const isRescheduled = dp.routineLogMap[r.id]?.rescheduledToDate;
          if (!isDone && !isSkipped && !isRescheduled && !r.isPaused) {
            const h = String(r.timeHour).padStart(2, '0');
            const m = String(r.timeMinute).padStart(2, '0');
            incompleteRoutines.push({
              date: dp.date,
              routine: r,
              scheduledTime: `${h}:${m}`,
            });
          }
        });
      }
    });

    // 5. Goal Performance Calculations
    const goalPerformances: GoalPerformanceData[] = goals.map((goal) => {
      const linkedRoutines = routines.filter((r) => r.linkedGoalId === goal.id);
      const linkedRoutineIds = new Set(linkedRoutines.map((r) => r.id));

      let completedCountInPeriod = 0;
      let priorCompletedCount = 0;
      const priorStartDate = ProgressCalculationEngine.addDays(startDate, -numDays);

      logs.forEach((log) => {
        if (linkedRoutineIds.has(log.routineId) && log.isCompleted) {
          if (log.date >= startDate && log.date <= endDate) {
            completedCountInPeriod++;
          } else if (log.date >= priorStartDate && log.date < startDate) {
            priorCompletedCount++;
          }
        }
      });

      // Goal progress result
      const prog = ProgressCalculationEngine.calculateGoalProgress(goal, routines, logs);

      // Current & longest streak for this goal
      const { currentStreak, longestStreak } = this.calculateGoalStreaks(
        linkedRoutines,
        logs,
        todayStr
      );

      // Trend calculation
      let trendPct: number | null = null;
      if (priorCompletedCount > 0) {
        trendPct = Math.round(
          ((completedCountInPeriod - priorCompletedCount) / priorCompletedCount) * 100
        );
      } else if (completedCountInPeriod > 0) {
        trendPct = 100;
      }

      return {
        goal,
        progressPct: prog.percentage,
        currentValue: prog.currentValue,
        targetValue: prog.targetValue,
        unit: goal.unit || 'units',
        successfulDays: completedCountInPeriod,
        currentStreak,
        longestStreak,
        trendPct,
        isCompleted: prog.isCompleted,
        linkedRoutines,
      };
    });

    const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE);
    const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED);
    const avgGoalProgressPct = goals.length > 0
      ? Math.round(goalPerformances.reduce((acc, g) => acc + g.progressPct, 0) / goals.length)
      : 0;

    // 6. Routine Performance Calculations
    const routinePerformances: RoutinePerformanceData[] = routines.map((r) => {
      let plannedCount = 0;
      let completedCount = 0;
      let skippedCount = 0;
      const routineLogs: RoutineLog[] = [];

      days.forEach((dp) => {
        const isPlanned = dp.plannedRoutines.some((pr) => pr.id === r.id);
        if (isPlanned) {
          plannedCount++;
          const log = dp.routineLogMap[r.id];
          if (log) {
            routineLogs.push(log);
            if (log.isCompleted) completedCount++;
            else if (log.isSkipped) skippedCount++;
          }
        }
      });

      const missedCount = Math.max(0, plannedCount - completedCount - skippedCount);
      const completionPct = plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0;

      // Routine streaks
      const { currentStreak, bestStreak } = this.calculateSingleRoutineStreaks(
        r,
        logs,
        todayStr
      );

      return {
        routine: r,
        totalPlannedCount: plannedCount,
        completedCount,
        skippedCount,
        missedCount,
        completionPct,
        currentStreak,
        bestStreak,
        logs: routineLogs,
      };
    });

    // 7. Milestones Calculation
    const milestones = this.calculateMilestones(
      routines,
      goals,
      logs,
      reflections,
      streakStats
    );

    // 8. Smart Insights Engine
    const smartInsights = this.generateSmartInsights(
      range,
      days,
      periodConsistencyPct,
      trendVsPrevious,
      routinePerformances,
      goals,
      milestones,
      activeDays,
      incompleteRoutines
    );

    return {
      range,
      startDate,
      endDate,
      days,
      activeDays,
      successfulDays,
      periodConsistencyPct,
      totalCompletedRoutines,
      totalPlannedRoutines,
      routineCompletionRate,
      trendVsPrevious,
      previousConsistencyPct,
      avgGoalProgressPct,
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
      goalPerformances,
      routinePerformances,
      smartInsights,
      incompleteRoutines,
      milestones,
    };
  }

  /**
   * Helper to get total days for a selected range.
   */
  private static getRangeDaysCount(
    range: TimeRangeKey,
    routines: Routine[],
    logs: RoutineLog[],
    todayStr: string
  ): number {
    switch (range) {
      case '7D':
        return 7;
      case '30D':
        return 30;
      case '90D':
        return 90;
      case 'ALL': {
        // Find earliest log date or routine start date
        let earliestDate = todayStr;
        logs.forEach((l) => {
          if (l.date && l.date < earliestDate) {
            earliestDate = l.date;
          }
        });
        routines.forEach((r) => {
          if (r.startDate && r.startDate < earliestDate) {
            earliestDate = r.startDate;
          }
        });

        // Compute difference in days
        const partsToday = todayStr.split('-').map(Number);
        const partsEarly = earliestDate.split('-').map(Number);
        const t = new Date(partsToday[0], partsToday[1] - 1, partsToday[2]).getTime();
        const e = new Date(partsEarly[0], partsEarly[1] - 1, partsEarly[2]).getTime();
        const diffDays = Math.max(7, Math.min(180, Math.ceil((t - e) / (1000 * 60 * 60 * 24)) + 1));
        return diffDays;
      }
    }
  }

  /**
   * Calculates streak stats for routines linked to a specific goal.
   */
  private static calculateGoalStreaks(
    linkedRoutines: Routine[],
    logs: RoutineLog[],
    todayStr: string
  ): { currentStreak: number; longestStreak: number } {
    if (linkedRoutines.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const linkedIds = new Set(linkedRoutines.map((r) => r.id));
    const datesWithCompletion = new Set<string>();

    logs.forEach((l) => {
      if (linkedIds.has(l.routineId) && l.isCompleted && l.date) {
        datesWithCompletion.add(l.date);
      }
    });

    let currentStreak = 0;
    let checkDate = todayStr;

    // Check today
    if (datesWithCompletion.has(checkDate)) {
      currentStreak++;
      checkDate = ProgressCalculationEngine.addDays(checkDate, -1);
    } else {
      // Check yesterday to give time for today
      checkDate = ProgressCalculationEngine.addDays(checkDate, -1);
    }

    for (let i = 0; i < 90; i++) {
      if (datesWithCompletion.has(checkDate)) {
        currentStreak++;
        checkDate = ProgressCalculationEngine.addDays(checkDate, -1);
      } else {
        break;
      }
    }

    // Longest streak
    const sortedDates = Array.from(datesWithCompletion).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = '';

    sortedDates.forEach((d) => {
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const expectedNext = ProgressCalculationEngine.addDays(lastDate, 1);
        if (d === expectedNext) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      lastDate = d;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    });

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
    };
  }

  /**
   * Calculates streaks for a single routine across history.
   */
  private static calculateSingleRoutineStreaks(
    routine: Routine,
    logs: RoutineLog[],
    todayStr: string
  ): { currentStreak: number; bestStreak: number } {
    const routineLogs = logs.filter((l) => l.routineId === routine.id && l.isCompleted);
    const completedDates = new Set(routineLogs.map((l) => l.date));

    let currentStreak = 0;
    let checkDate = todayStr;

    if (completedDates.has(checkDate)) {
      currentStreak++;
      checkDate = ProgressCalculationEngine.addDays(checkDate, -1);
    } else {
      // If not yet completed today, check if yesterday was completed
      checkDate = ProgressCalculationEngine.addDays(checkDate, -1);
    }

    // Evaluate backward
    for (let i = 0; i < 90; i++) {
      const isScheduled = ProgressCalculationEngine.isRoutineActiveOnDate(routine, checkDate);
      if (!isScheduled) {
        // Rest day for this routine carries streak forward
        checkDate = ProgressCalculationEngine.addDays(checkDate, -1);
        continue;
      }

      if (completedDates.has(checkDate)) {
        currentStreak++;
        checkDate = ProgressCalculationEngine.addDays(checkDate, -1);
      } else {
        break;
      }
    }

    // Best streak
    let bestStreak = currentStreak;
    let tempStreak = 0;
    for (let i = 120; i >= 0; i--) {
      const d = ProgressCalculationEngine.addDays(todayStr, -i);
      const isScheduled = ProgressCalculationEngine.isRoutineActiveOnDate(routine, d);
      if (!isScheduled) continue;

      if (completedDates.has(d)) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak) };
  }

  /**
   * Evaluates authentic milestones against actual user records.
   */
  static calculateMilestones(
    _routines: Routine[],
    goals: Goal[],
    logs: RoutineLog[],
    reflections: DailyReflection[],
    streakStats: StreakStats
  ): MilestoneItem[] {
    const completedLogsCount = logs.filter((l) => l.isCompleted).length;
    const completedGoalsCount = goals.filter((g) => g.status === 'COMPLETED').length;
    const reflectionsCount = reflections.length;

    const streak = Math.max(streakStats.currentStreak, streakStats.longestStreak);

    return [
      {
        id: 'streak_3',
        title: '3-Day Summit Ascent',
        description: 'Complete all planned routines for 3 consecutive days',
        badge: '⛰️',
        current: streak,
        target: 3,
        progressPct: Math.min(100, Math.round((streak / 3) * 100)),
        isUnlocked: streak >= 3,
        category: 'streak',
      },
      {
        id: 'streak_7',
        title: '7-Day Ridge Walker',
        description: 'Scale a full 7-day unbroken consistency trail',
        badge: '🔥',
        current: streak,
        target: 7,
        progressPct: Math.min(100, Math.round((streak / 7) * 100)),
        isUnlocked: streak >= 7,
        category: 'streak',
      },
      {
        id: 'streak_14',
        title: '14-Day High Altitude',
        description: 'Maintain consistency across two full weeks without drop-off',
        badge: '🦅',
        current: streak,
        target: 14,
        progressPct: Math.min(100, Math.round((streak / 14) * 100)),
        isUnlocked: streak >= 14,
        category: 'streak',
      },
      {
        id: 'streak_30',
        title: '30-Day Summit Pioneer',
        description: 'Reach high mountain mastery with a 30-day streak',
        badge: '👑',
        current: streak,
        target: 30,
        progressPct: Math.min(100, Math.round((streak / 30) * 100)),
        isUnlocked: streak >= 30,
        category: 'streak',
      },
      {
        id: 'vol_10',
        title: 'Camp One Established',
        description: 'Log 10 total successful routine completions',
        badge: '⛺',
        current: completedLogsCount,
        target: 10,
        progressPct: Math.min(100, Math.round((completedLogsCount / 10) * 100)),
        isUnlocked: completedLogsCount >= 10,
        category: 'volume',
      },
      {
        id: 'vol_50',
        title: 'Glacier Crossing',
        description: 'Log 50 total successful routine completions',
        badge: '🧭',
        current: completedLogsCount,
        target: 50,
        progressPct: Math.min(100, Math.round((completedLogsCount / 50) * 100)),
        isUnlocked: completedLogsCount >= 50,
        category: 'volume',
      },
      {
        id: 'vol_100',
        title: 'Century Climber',
        description: 'Complete 100 routines along the Himaleh mountain range',
        badge: '🏆',
        current: completedLogsCount,
        target: 100,
        progressPct: Math.min(100, Math.round((completedLogsCount / 100) * 100)),
        isUnlocked: completedLogsCount >= 100,
        category: 'volume',
      },
      {
        id: 'goal_1',
        title: 'Summit Flag Planted',
        description: 'Successfully complete at least 1 personal goal',
        badge: '🚩',
        current: completedGoalsCount,
        target: 1,
        progressPct: Math.min(100, Math.round((completedGoalsCount / 1) * 100)),
        isUnlocked: completedGoalsCount >= 1,
        category: 'mastery',
      },
      {
        id: 'ref_5',
        title: 'Mindful Alpinist',
        description: 'Record 5 daily evening reflections and self-evaluations',
        badge: '📜',
        current: reflectionsCount,
        target: 5,
        progressPct: Math.min(100, Math.round((reflectionsCount / 5) * 100)),
        isUnlocked: reflectionsCount >= 5,
        category: 'mastery',
      },
    ];
  }

  /**
   * Generates intelligent, real data-backed insights answering the 4 core questions:
   * 1. How am I doing?
   * 2. Am I improving?
   * 3. Where am I weak?
   * 4. What should I improve next?
   */
  private static generateSmartInsights(
    range: TimeRangeKey,
    days: DayPerformancePoint[],
    periodConsistencyPct: number,
    trendVsPrevious: number | null,
    routinePerformances: RoutinePerformanceData[],
    _goals: Goal[],
    milestones: MilestoneItem[],
    activeDays: number,
    incompleteRoutines: IncompleteRoutineEntry[]
  ): SmartInsightItem[] {
    const insights: SmartInsightItem[] = [];

    if (activeDays === 0) {
      return insights;
    }

    // 1. HOW AM I DOING? (Status insight)
    if (periodConsistencyPct >= 80) {
      insights.push({
        id: 'status_high',
        category: 'STATUS',
        title: 'High Summit Discipline',
        description: `Your consistency is holding strong at ${periodConsistencyPct}%. You are reliably completing routines on active days.`,
        accent: 'emerald',
        iconType: 'trend_up',
      });
    } else if (periodConsistencyPct >= 50) {
      insights.push({
        id: 'status_moderate',
        category: 'STATUS',
        title: 'Moderate Trail Momentum',
        description: `You are maintaining ${periodConsistencyPct}% consistency across ${activeDays} active days. Completing partial routines will rapidly lift your rating.`,
        accent: 'gold',
        iconType: 'day_star',
      });
    } else {
      insights.push({
        id: 'status_rebuild',
        category: 'STATUS',
        title: 'Trail Focus Required',
        description: `Consistency currently sits at ${periodConsistencyPct}%. Focus on completing your highest priority morning routine to establish daily momentum.`,
        accent: 'amber',
        iconType: 'caution',
      });
    }

    // 2. AM I IMPROVING? (Trend insight)
    if (trendVsPrevious !== null) {
      const rangeLabel = range === '7D' ? 'previous 7 days' : range === '30D' ? 'previous 30 days' : 'prior period';
      if (trendVsPrevious > 0) {
        insights.push({
          id: 'trend_positive',
          category: 'TREND',
          title: `Ascent Pace Rising (+${trendVsPrevious}%)`,
          description: `Your consistency improved ${trendVsPrevious}% compared to the ${rangeLabel}. Your execution rate is accelerating.`,
          accent: 'emerald',
          iconType: 'trend_up',
        });
      } else if (trendVsPrevious < 0) {
        insights.push({
          id: 'trend_negative',
          category: 'TREND',
          title: `Pace Dip (${trendVsPrevious}%)`,
          description: `Your consistency softened ${Math.abs(trendVsPrevious)}% compared to the ${rangeLabel}. Check if your daily schedule needs recalibration.`,
          accent: 'amber',
          iconType: 'trend_down',
        });
      } else {
        insights.push({
          id: 'trend_steady',
          category: 'TREND',
          title: 'Steady Consistency Baseline',
          description: `Your consistency matched the ${rangeLabel} with zero drop-off (${periodConsistencyPct}%). A stable foundation is built.`,
          accent: 'indigo',
          iconType: 'day_star',
        });
      }
    }

    // 3. WHERE AM I WEAK? (Day-of-week or Routine analysis)
    // Calculate Day-of-Week consistency
    const weekdayMap: Record<number, { name: string; planned: number; completed: number }> = {
      1: { name: 'Monday', planned: 0, completed: 0 },
      2: { name: 'Tuesday', planned: 0, completed: 0 },
      3: { name: 'Wednesday', planned: 0, completed: 0 },
      4: { name: 'Thursday', planned: 0, completed: 0 },
      5: { name: 'Friday', planned: 0, completed: 0 },
      6: { name: 'Saturday', planned: 0, completed: 0 },
      7: { name: 'Sunday', planned: 0, completed: 0 },
    };

    days.forEach((dp) => {
      const dayNum = ProgressCalculationEngine.getDayOfWeek(dp.date);
      if (weekdayMap[dayNum]) {
        weekdayMap[dayNum].planned += dp.totalPlanned;
        weekdayMap[dayNum].completed += dp.completedCount;
      }
    });

    const activeWeekdays = Object.values(weekdayMap).filter((w) => w.planned >= 2);
    if (activeWeekdays.length >= 2) {
      const sorted = [...activeWeekdays].sort((a, b) => {
        const rateA = a.completed / a.planned;
        const rateB = b.completed / b.planned;
        return rateA - rateB;
      });

      const weakest = sorted[0];
      const strongest = sorted[sorted.length - 1];
      const weakestRate = Math.round((weakest.completed / weakest.planned) * 100);
      const strongestRate = Math.round((strongest.completed / strongest.planned) * 100);

      if (strongestRate > weakestRate && strongestRate >= 60) {
        insights.push({
          id: 'weekday_strong',
          category: 'WEAKNESS',
          title: `Strongest Day: ${strongest.name}`,
          description: `${strongest.name} is your peak execution day with a ${strongestRate}% completion rate across all scheduled habits.`,
          accent: 'emerald',
          iconType: 'day_star',
        });
      }

      if (weakestRate < 60 && weakestRate < strongestRate) {
        insights.push({
          id: 'weekday_weak',
          category: 'WEAKNESS',
          title: `Focus Day: ${weakest.name}`,
          description: `${weakest.name} is currently your lowest completion day (${weakestRate}%). Consider setting a reminder or simplifying planned routines.`,
          accent: 'rose',
          iconType: 'caution',
        });
      }
    }

    // Check lowest performing routine
    const routinesWithPlan = routinePerformances.filter((rp) => rp.totalPlannedCount >= 2);
    if (routinesWithPlan.length > 1) {
      const sortedRoutines = [...routinesWithPlan].sort((a, b) => a.completionPct - b.completionPct);
      const lowestRoutine = sortedRoutines[0];
      if (lowestRoutine.completionPct < 50) {
        insights.push({
          id: 'routine_weakness',
          category: 'WEAKNESS',
          title: `Friction in '${lowestRoutine.routine.name}'`,
          description: `'${lowestRoutine.routine.name}' has a ${lowestRoutine.completionPct}% completion rate (${lowestRoutine.missedCount} missed). Try lowering the target or adjusting its time.`,
          accent: 'rose',
          iconType: 'caution',
        });
      }
    }

    // 4. WHAT SHOULD I IMPROVE NEXT? (Actionable forward recommendation)
    // Find closest locked milestone
    const lockedMilestones = milestones.filter((m) => !m.isUnlocked);
    if (lockedMilestones.length > 0) {
      const closest = [...lockedMilestones].sort((a, b) => b.progressPct - a.progressPct)[0];
      const remaining = closest.target - closest.current;
      if (remaining > 0) {
        insights.push({
          id: 'milestone_next',
          category: 'RECOMMENDATION',
          title: `Next Milestone: ${closest.title}`,
          description: `You are ${remaining} ${closest.category === 'streak' ? 'consecutive days' : 'completions'} away from unlocking ${closest.title} (${closest.progressPct}% complete).`,
          accent: 'gold',
          iconType: 'target',
        });
      }
    }

    // Incomplete routines recommendation
    if (incompleteRoutines.length > 0) {
      insights.push({
        id: 'accountability_recom',
        category: 'RECOMMENDATION',
        title: 'Accountability Focus',
        description: `${incompleteRoutines.length} routine${incompleteRoutines.length > 1 ? 's were' : ' was'} left incomplete recently. Clear your schedule today to protect your streak.`,
        accent: 'amber',
        iconType: 'time',
      });
    }

    return insights;
  }
}
