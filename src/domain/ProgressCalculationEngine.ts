import { Routine, RoutineFrequency, RoutineLog, DailyProgressResult, Goal, GoalProgressResult } from '../types';

export class ProgressCalculationEngine {
  /**
   * Parses comma-separated day numbers (1=Monday .. 7=Sunday).
   */
  static parseFrequencyDays(daysStr: string): Set<number> {
    if (!daysStr || daysStr.trim() === '') {
      return new Set([1, 2, 3, 4, 5, 6, 7]);
    }
    const days = new Set<number>();
    daysStr.split(',').forEach((part) => {
      const parsed = parseInt(part.trim(), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 7) {
        days.add(parsed);
      }
    });
    return days.size > 0 ? days : new Set([1, 2, 3, 4, 5, 6, 7]);
  }

  /**
   * Returns standard 1 (Monday) to 7 (Sunday) for a given YYYY-MM-DD string.
   */
  static getDayOfWeek(dateStr: string): number {
    const parts = dateStr.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const jsDay = date.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    return jsDay === 0 ? 7 : jsDay;
  }

  /**
   * Formats a Date object to YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Returns today's date in YYYY-MM-DD format
   */
  static getTodayStr(): string {
    return this.formatDate(new Date());
  }

  /**
   * Compares two YYYY-MM-DD date strings: -1 if a < b, 0 if a == b, 1 if a > b
   */
  static compareDates(a: string, b: string): number {
    return a.localeCompare(b);
  }

  /**
   * Adds or subtracts days to a YYYY-MM-DD string
   */
  static addDays(dateStr: string, days: number): string {
    const parts = dateStr.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  }

  /**
   * Checks if a routine is naturally scheduled to occur on the specified date.
   */
  static isRoutineActiveOnDate(routine: Routine, dateStr: string): boolean {
    if (routine.isPaused) return false;

    // Check routine start date
    if (routine.startDate && this.compareDates(dateStr, routine.startDate) < 0) {
      return false;
    }

    // Check routine end date if set
    if (routine.endDate && this.compareDates(dateStr, routine.endDate) > 0) {
      return false;
    }

    const dayOfWeek = this.getDayOfWeek(dateStr);

    switch (routine.frequency) {
      case RoutineFrequency.DAILY:
        return true;
      case RoutineFrequency.WEEKDAYS:
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case RoutineFrequency.WEEKENDS:
        return dayOfWeek === 6 || dayOfWeek === 7;
      case RoutineFrequency.CUSTOM_DAYS:
        return this.parseFrequencyDays(routine.frequencyDays).has(dayOfWeek);
      case RoutineFrequency.WEEKLY:
        // By default first day of parsed frequencyDays, or Monday
        const targetDays = this.parseFrequencyDays(routine.frequencyDays);
        return targetDays.has(dayOfWeek);
      default:
        return true;
    }
  }

  /**
   * Calculates comprehensive daily progress for a given date.
   */
  static calculateDailyProgress(
    date: string,
    routines: Routine[],
    logs: RoutineLog[]
  ): DailyProgressResult {
    // 1. Identify routines scheduled on this date
    // Note: also check logs to see if any routine was rescheduled AWAY from this date or TO this date
    const routineMap = new Map<number, Routine>();
    routines.forEach((r) => routineMap.set(r.id, r));

    // Logs specifically tied to this date
    const dateLogs = logs.filter((log) => log.date === date);
    const dateLogMap: Record<number, RoutineLog> = {};
    dateLogs.forEach((log) => {
      dateLogMap[log.routineId] = log;
    });

    // Also look for logs on other dates that rescheduled a routine TO this date
    const rescheduledToThisDateRoutineIds = new Set<number>();
    logs.forEach((log) => {
      if (log.rescheduledToDate === date) {
        rescheduledToThisDateRoutineIds.add(log.routineId);
      }
    });

    const plannedList: Routine[] = [];

    routines.forEach((routine) => {
      const logOnDate = dateLogMap[routine.id];
      // If rescheduled away from this date, don't include in today's active requirements
      if (logOnDate && logOnDate.rescheduledToDate && logOnDate.rescheduledToDate !== date) {
        return;
      }

      const naturallyActive = this.isRoutineActiveOnDate(routine, date);
      const rescheduledIn = rescheduledToThisDateRoutineIds.has(routine.id);

      if (naturallyActive || rescheduledIn) {
        plannedList.push(routine);
      }
    });

    // Sort planned routines by scheduled time
    plannedList.sort((a, b) => {
      if (a.timeHour !== b.timeHour) return a.timeHour - b.timeHour;
      return a.timeMinute - b.timeMinute;
    });

    const completedRoutineIds = new Set<number>();
    const skippedRoutineIds = new Set<number>();

    plannedList.forEach((r) => {
      const log = dateLogMap[r.id];
      if (log) {
        if (log.isCompleted) {
          completedRoutineIds.add(r.id);
        } else if (log.isSkipped) {
          skippedRoutineIds.add(r.id);
        }
      }
    });

    const totalPlanned = plannedList.length;
    const completedCount = completedRoutineIds.size;
    const skippedCount = skippedRoutineIds.size;
    const completionPercentage = totalPlanned > 0
      ? Math.min(100, Math.round((completedCount / totalPlanned) * 1000) / 10)
      : 0.0;

    return {
      date,
      totalPlanned,
      completedCount,
      skippedCount,
      completionPercentage,
      plannedRoutines: plannedList,
      completedRoutineIds,
      skippedRoutineIds,
      routineLogMap: dateLogMap,
    };
  }

  /**
   * Calculates progress for a specific goal based on linked routines and manual currentValue.
   */
  static calculateGoalProgress(
    goal: Goal,
    routines: Routine[],
    logs: RoutineLog[]
  ): GoalProgressResult {
    const linkedRoutines = routines.filter((r) => r.linkedGoalId === goal.id);
    const linkedRoutineIds = linkedRoutines.map((r) => r.id);

    let completedRoutinesCount = 0;
    if (linkedRoutineIds.length > 0) {
      const linkedIdSet = new Set(linkedRoutineIds);
      logs.forEach((l) => {
        if (linkedIdSet.has(l.routineId) && l.isCompleted) {
          completedRoutinesCount++;
        }
      });
    }

    // Determine current value: prioritize manual progress if greater than 0, otherwise completed count
    const effectiveCurrent = Math.max(goal.currentValue, completedRoutinesCount);
    const target = goal.targetValue > 0 ? goal.targetValue : 1;
    const percentage = Math.min(100, Math.round((effectiveCurrent / target) * 1000) / 10);
    const isCompleted = percentage >= 100;

    return {
      goalId: goal.id,
      currentValue: effectiveCurrent,
      targetValue: goal.targetValue,
      percentage,
      completedRoutinesCount,
      totalLinkedRoutines: linkedRoutines.length,
      linkedRoutineIds,
      isCompleted,
    };
  }
}
