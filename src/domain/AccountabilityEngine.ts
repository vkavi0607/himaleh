import { DailyProgressResult, DashboardState, StreakStats, UserSettings, CelebrationEvent } from '../types';
import { ProgressCalculationEngine } from './ProgressCalculationEngine';

export class AccountabilityEngine {
  /**
   * Evaluates the current state of routines and determines the high-level dashboard accountability state.
   */
  static resolveDashboardState(
    progress: DailyProgressResult | null,
    streakStats: StreakStats,
    date: string,
    settings: UserSettings
  ): DashboardState {
    if (!progress || progress.totalPlanned === 0) {
      return {
        type: 'REST_DAY',
        title: 'Rest Day',
        message: 'No routines scheduled for this date. Rest, recover, and recharge.',
        emoji: '🌿',
      };
    }

    const isAllDone = progress.completedCount >= progress.totalPlanned;
    if (isAllDone) {
      return {
        type: 'COMPLETED',
        title: 'Day Complete!',
        message: `100% completed • Keep the streak alive! (${streakStats.currentStreak} day streak)`,
        emoji: '🏆',
        streak: streakStats.currentStreak,
      };
    }

    // Filter unfinished routines (routines that are neither completed nor intentionally skipped/rescheduled)
    const unfinished = progress.plannedRoutines.filter(
      (r) => !progress.completedRoutineIds.has(r.id) && !progress.skippedRoutineIds.has(r.id)
    );

    // If every planned routine is accounted for (completed or intentionally skipped/rescheduled)
    if (unfinished.length === 0) {
      if (progress.completedCount === 0 && progress.skippedCount > 0) {
        return {
          type: 'REST_DAY',
          title: 'Off-Schedule / Planned Rest',
          message: `${progress.skippedCount} routine${progress.skippedCount > 1 ? 's were' : ' was'} intentionally skipped or rescheduled. Rest, reset, and prepare for tomorrow.`,
          emoji: '🧘',
        };
      }

      return {
        type: 'COMPLETED',
        title: 'Routines Accounted For',
        message: `${progress.completedCount} completed, ${progress.skippedCount} skipped/rescheduled • No pending routines remain.`,
        emoji: '✨',
        streak: streakStats.currentStreak,
      };
    }

    const todayStr = ProgressCalculationEngine.getTodayStr();
    const dateComparison = ProgressCalculationEngine.compareDates(date, todayStr);

    if (dateComparison > 0) {
      // Future date
      return {
        type: 'IN_PROGRESS',
        title: 'Upcoming Day',
        message: `${progress.totalPlanned} routine${progress.totalPlanned > 1 ? 's' : ''} planned for this date.`,
        emoji: '📅',
        remainingCount: unfinished.length,
      };
    }

    if (dateComparison < 0) {
      // Past date with truly unfinished (unskipped) tasks
      return {
        type: 'ACCOUNTABILITY',
        title: 'Missed Routines',
        message: `${unfinished.length} routine${unfinished.length > 1 ? 's were' : ' was'} uncompleted without reschedule. Reclaim your rhythm!`,
        emoji: '⚠️',
        missedRoutines: unfinished,
        severity: 'STRICT',
      };
    }

    // It's today: check current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Routine is overdue if its scheduled time has passed by more than 30 minutes
    const overdueRoutines = unfinished.filter((r) => {
      const routineMinutes = r.timeHour * 60 + r.timeMinute;
      const currentMinutes = currentHour * 60 + currentMinute;
      return currentMinutes > routineMinutes + 30;
    });

    if (overdueRoutines.length > 0 || (currentHour >= 21 && unfinished.length > 0)) {
      const severity = settings.strictAccountability
        ? 'STRICT'
        : overdueRoutines.length >= 3
        ? 'FIRM'
        : 'MILD';

      const overdueCount = overdueRoutines.length > 0 ? overdueRoutines.length : unfinished.length;
      const feedback = this.getAccountabilityFeedback(severity, overdueCount);

      return {
        type: 'ACCOUNTABILITY',
        title: feedback.title,
        message: feedback.message,
        emoji: feedback.emoji,
        missedRoutines: overdueRoutines.length > 0 ? overdueRoutines : unfinished,
        severity,
      };
    }

    // Still early / in progress today
    return {
      type: 'IN_PROGRESS',
      title: 'In Progress',
      message: `${progress.completedCount} of ${progress.totalPlanned} completed • ${unfinished.length} remaining today`,
      emoji: '⚡',
      remainingCount: unfinished.length,
    };
  }

  /**
   * Generates accountability feedback messages based on strictness level.
   */
  static getAccountabilityFeedback(
    severity: 'MILD' | 'FIRM' | 'STRICT',
    overdueCount: number
  ): { title: string; message: string; emoji: string } {
    switch (severity) {
      case 'STRICT':
        return {
          title: 'Accountability Alert',
          message: `${overdueCount} routine${overdueCount > 1 ? 's are' : ' is'} overdue. Consistency defines character. Take action now.`,
          emoji: '🚨',
        };
      case 'FIRM':
        return {
          title: 'Falling Behind Schedule',
          message: `You have ${overdueCount} pending routine${overdueCount > 1 ? 's' : ''}. Regain momentum before the day ends!`,
          emoji: '⏳',
        };
      case 'MILD':
      default:
        return {
          title: 'Action Needed',
          message: `${overdueCount} routine${overdueCount > 1 ? 's are' : ' is'} past scheduled time. You can still complete them today.`,
          emoji: '🎯',
        };
    }
  }

  /**
   * Helper to check celebration events.
   */
  static checkDailyCelebration(
    progress: DailyProgressResult,
    currentStreak: number
  ): CelebrationEvent | null {
    if (progress.totalPlanned > 0 && progress.completedCount >= progress.totalPlanned) {
      return {
        type: 'DAILY_COMPLETE',
        date: progress.date,
        totalRoutines: progress.totalPlanned,
        currentStreak,
      };
    }
    return null;
  }
}
