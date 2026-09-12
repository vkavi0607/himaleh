import { Routine, RoutineLog, StreakStats } from '../types';
import { ProgressCalculationEngine } from './ProgressCalculationEngine';

export class ConsistencyEngine {
  /**
   * Calculates current streak, longest streak, and consistency percentages.
   */
  static calculateStreaks(
    routines: Routine[],
    logs: RoutineLog[],
    anchorDate: string = ProgressCalculationEngine.getTodayStr()
  ): StreakStats {
    if (routines.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        weeklyConsistencyPercentage: 0,
        monthlyConsistencyPercentage: 0,
        totalDaysLogged: 0,
        totalCompletions: 0,
        streakHistory: [],
      };
    }

    // Check last 90 days of history
    const historyDays = 90;
    const history: Array<{ date: string; completed: boolean; isRestDay: boolean }> = [];
    let totalCompletions = 0;

    for (let i = historyDays - 1; i >= 0; i--) {
      const date = ProgressCalculationEngine.addDays(anchorDate, -i);
      const progress = ProgressCalculationEngine.calculateDailyProgress(date, routines, logs);
      const isRestDay = progress.totalPlanned === 0;
      const isCompleted = progress.totalPlanned > 0 && progress.completedCount >= progress.totalPlanned;

      if (isCompleted) {
        totalCompletions += progress.completedCount;
      }

      history.push({
        date,
        completed: isCompleted,
        isRestDay,
      });
    }

    // Calculate current streak backwards from anchorDate
    let currentStreak = 0;
    const todayProgress = ProgressCalculationEngine.calculateDailyProgress(anchorDate, routines, logs);
    const todayIsDone = todayProgress.totalPlanned > 0 && todayProgress.completedCount >= todayProgress.totalPlanned;

    let startIndex = history.length - 1;

    // If today is completed, count it!
    if (todayIsDone) {
      currentStreak++;
      startIndex--;
    } else if (todayProgress.totalPlanned === 0) {
      // Today is a rest day, look back from yesterday
      startIndex--;
    } else {
      // Today has unfinished routines - don't penalize yet, evaluate starting yesterday
      startIndex--;
    }

    for (let i = startIndex; i >= 0; i--) {
      const day = history[i];
      if (day.isRestDay) {
        // Rest days carry the streak forward without breaking it
        continue;
      }
      if (day.completed) {
        currentStreak++;
      } else {
        // Streak broken
        break;
      }
    }

    // Calculate longest streak across history
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < history.length; i++) {
      const day = history[i];
      if (day.isRestDay) {
        // Don't increment tempStreak, but don't reset it either
        continue;
      }
      if (day.completed) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    // Calculate Weekly Consistency (Last 7 days)
    const last7Days = history.slice(-7);
    let weeklyActiveDays = 0;
    let weeklyCompletedDays = 0;

    last7Days.forEach((d) => {
      if (!d.isRestDay) {
        weeklyActiveDays++;
        if (d.completed) weeklyCompletedDays++;
      }
    });

    const weeklyConsistencyPercentage = weeklyActiveDays > 0
      ? Math.round((weeklyCompletedDays / weeklyActiveDays) * 100)
      : 100;

    // Calculate Monthly Consistency (Last 30 days)
    const last30Days = history.slice(-30);
    let monthlyActiveDays = 0;
    let monthlyCompletedDays = 0;

    last30Days.forEach((d) => {
      if (!d.isRestDay) {
        monthlyActiveDays++;
        if (d.completed) monthlyCompletedDays++;
      }
    });

    const monthlyConsistencyPercentage = monthlyActiveDays > 0
      ? Math.round((monthlyCompletedDays / monthlyActiveDays) * 100)
      : 100;

    // Count distinct days with at least one log
    const loggedDates = new Set<string>();
    logs.forEach((l) => loggedDates.add(l.date));

    return {
      currentStreak,
      longestStreak,
      weeklyConsistencyPercentage,
      monthlyConsistencyPercentage,
      totalDaysLogged: loggedDates.size,
      totalCompletions,
      streakHistory: history.map((h) => ({ date: h.date, completed: h.completed })),
    };
  }

  /**
   * Calculates streak for a specific routine.
   */
  static calculateRoutineStreak(
    routine: Routine,
    logs: RoutineLog[],
    anchorDate: string = ProgressCalculationEngine.getTodayStr()
  ): number {
    const routineLogs = logs.filter((l) => l.routineId === routine.id && l.isCompleted);
    const completedDates = new Set(routineLogs.map((l) => l.date));

    let streak = 0;
    let checkDate = anchorDate;

    // If completed today
    if (completedDates.has(anchorDate)) {
      streak++;
      checkDate = ProgressCalculationEngine.addDays(anchorDate, -1);
    } else if (ProgressCalculationEngine.isRoutineActiveOnDate(routine, anchorDate)) {
      // Active today but not done yet: check from yesterday
      checkDate = ProgressCalculationEngine.addDays(anchorDate, -1);
    } else {
      // Not active today (e.g. rest day for this routine)
      checkDate = ProgressCalculationEngine.addDays(anchorDate, -1);
    }

    for (let i = 0; i < 60; i++) {
      const wasActive = ProgressCalculationEngine.isRoutineActiveOnDate(routine, checkDate);
      if (wasActive) {
        if (completedDates.has(checkDate)) {
          streak++;
        } else {
          break;
        }
      }
      checkDate = ProgressCalculationEngine.addDays(checkDate, -1);
    }

    return streak;
  }
}
