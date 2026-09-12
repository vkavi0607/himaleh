import {
  Goal,
  GoalPriority,
  GoalStatus,
  Routine,
  RoutineFrequency,
  RoutinePriority,
  TaskType,
  RoutineLog,
  DailyReflection,
  UserSettings,
} from '../types';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';

const STORAGE_KEYS = {
  GOALS: 'himaleh_goals_v1',
  ROUTINES: 'himaleh_routines_v1',
  LOGS: 'himaleh_logs_v1',
  REFLECTIONS: 'himaleh_reflections_v1',
  SETTINGS: 'himaleh_settings_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Explorer',
  morningReminderTime: '07:30',
  eveningReflectionTime: '21:30',
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  strictAccountability: false,
  restDayFrequency: 1,
  isDarkMode: false,
  weeklyGoalTargetDays: 5,
};

export class StorageService {
  static getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getGoals(): Goal[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static saveGoals(goals: Goal[]): void {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }

  static getRoutines(): Routine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static saveRoutines(routines: Routine[]): void {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  }

  static getLogs(): RoutineLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static saveLogs(logs: RoutineLog[]): void {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  static getReflections(): DailyReflection[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static saveReflections(reflections: DailyReflection[]): void {
    localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(reflections));
  }

  /**
   * Initializes starter seed data if no records exist
   */
  static initializeIfEmpty(): {
    goals: Goal[];
    routines: Routine[];
    logs: RoutineLog[];
    reflections: DailyReflection[];
    settings: UserSettings;
  } {
    let goals = this.getGoals();
    let routines = this.getRoutines();
    let logs = this.getLogs();
    let reflections = this.getReflections();
    let settings = this.getSettings();

    if (goals.length === 0 && routines.length === 0) {
      const today = ProgressCalculationEngine.getTodayStr();
      const threeMonthsLater = ProgressCalculationEngine.addDays(today, 90);

      goals = [
        {
          id: 1,
          title: 'Peak Cardiovascular Fitness (50km Run)',
          description: 'Improve aerobic endurance and heart rate recovery with regular weekly running.',
          category: 'Fitness',
          startDate: today,
          endDate: threeMonthsLater,
          targetValue: 50,
          currentValue: 14,
          unit: 'km',
          priority: GoalPriority.HIGH,
          status: GoalStatus.ACTIVE,
          motivation: 'Physical endurance builds mental clarity and discipline under pressure.',
          createdAt: Date.now() - 4 * 86400000,
          updatedAt: Date.now(),
        },
        {
          id: 2,
          title: 'Read 6 Non-Fiction Mastery Books',
          description: 'Read 20 pages each night before bed across leadership, psychology, and science.',
          category: 'Mindset',
          startDate: today,
          endDate: threeMonthsLater,
          targetValue: 6,
          currentValue: 2,
          unit: 'books',
          priority: GoalPriority.MEDIUM,
          status: GoalStatus.ACTIVE,
          motivation: 'Consistent intellectual feeding expands perspective and wisdom.',
          createdAt: Date.now() - 4 * 86400000,
          updatedAt: Date.now(),
        },
      ];

      routines = [
        {
          id: 1,
          name: 'Morning Hydration (750ml)',
          description: 'Drink fresh water with a pinch of mineral salt upon waking.',
          category: 'Health',
          linkedGoalId: null,
          startDate: ProgressCalculationEngine.addDays(today, -7),
          endDate: null,
          timeHour: 7,
          timeMinute: 0,
          durationMinutes: 5,
          frequency: RoutineFrequency.DAILY,
          frequencyDays: '1,2,3,4,5,6,7',
          weeklyTargetTimes: 7,
          taskType: TaskType.QUANTITY,
          targetValue: 750,
          unit: 'ml',
          priority: RoutinePriority.HIGH,
          reminderEnabled: true,
          isPaused: false,
          createdAt: Date.now() - 7 * 86400000,
        },
        {
          id: 2,
          name: 'Mindful Meditation',
          description: '15 minutes box breathing and quiet stillness to center attention.',
          category: 'Mindset',
          linkedGoalId: null,
          startDate: ProgressCalculationEngine.addDays(today, -7),
          endDate: null,
          timeHour: 7,
          timeMinute: 30,
          durationMinutes: 15,
          frequency: RoutineFrequency.DAILY,
          frequencyDays: '1,2,3,4,5,6,7',
          weeklyTargetTimes: 7,
          taskType: TaskType.DURATION,
          targetValue: 15,
          unit: 'min',
          priority: RoutinePriority.MEDIUM,
          reminderEnabled: true,
          isPaused: false,
          createdAt: Date.now() - 7 * 86400000,
        },
        {
          id: 3,
          name: 'Zone-2 Morning Run',
          description: 'Steady aerobic jog keeping conversational pace.',
          category: 'Fitness',
          linkedGoalId: 1,
          startDate: ProgressCalculationEngine.addDays(today, -7),
          endDate: null,
          timeHour: 8,
          timeMinute: 0,
          durationMinutes: 30,
          frequency: RoutineFrequency.WEEKDAYS,
          frequencyDays: '1,2,3,4,5',
          weeklyTargetTimes: 5,
          taskType: TaskType.DURATION,
          targetValue: 30,
          unit: 'min',
          priority: RoutinePriority.HIGH,
          reminderEnabled: true,
          isPaused: false,
          createdAt: Date.now() - 7 * 86400000,
        },
        {
          id: 4,
          name: 'Deep Focus Block (45m)',
          description: 'No email, no phone, uninterrupted work on high-value priority.',
          category: 'Work',
          linkedGoalId: null,
          startDate: ProgressCalculationEngine.addDays(today, -7),
          endDate: null,
          timeHour: 10,
          timeMinute: 0,
          durationMinutes: 45,
          frequency: RoutineFrequency.WEEKDAYS,
          frequencyDays: '1,2,3,4,5',
          weeklyTargetTimes: 5,
          taskType: TaskType.DURATION,
          targetValue: 45,
          unit: 'min',
          priority: RoutinePriority.HIGH,
          reminderEnabled: true,
          isPaused: false,
          createdAt: Date.now() - 7 * 86400000,
        },
        {
          id: 5,
          name: 'Read 20 Pages',
          description: 'Evening chapter before sleep.',
          category: 'Study',
          linkedGoalId: 2,
          startDate: ProgressCalculationEngine.addDays(today, -7),
          endDate: null,
          timeHour: 21,
          timeMinute: 0,
          durationMinutes: 25,
          frequency: RoutineFrequency.DAILY,
          frequencyDays: '1,2,3,4,5,6,7',
          weeklyTargetTimes: 7,
          taskType: TaskType.COUNT,
          targetValue: 20,
          unit: 'pages',
          priority: RoutinePriority.MEDIUM,
          reminderEnabled: true,
          isPaused: false,
          createdAt: Date.now() - 7 * 86400000,
        },
        {
          id: 6,
          name: 'Daily Reflection & Gratitude',
          description: 'Log wins, improvements, and close out the day mindfully.',
          category: 'Personal',
          linkedGoalId: null,
          startDate: ProgressCalculationEngine.addDays(today, -7),
          endDate: null,
          timeHour: 21,
          timeMinute: 30,
          durationMinutes: 5,
          frequency: RoutineFrequency.DAILY,
          frequencyDays: '1,2,3,4,5,6,7',
          weeklyTargetTimes: 7,
          taskType: TaskType.CHECKBOX,
          targetValue: 1,
          unit: '',
          priority: RoutinePriority.LOW,
          reminderEnabled: true,
          isPaused: false,
          createdAt: Date.now() - 7 * 86400000,
        },
      ];

      // Seed 3 days of previous completions to give a 3-day streak
      logs = [];
      let logIdCounter = 1;
      for (let i = 3; i >= 1; i--) {
        const pastDate = ProgressCalculationEngine.addDays(today, -i);
        const dayProgress = ProgressCalculationEngine.calculateDailyProgress(pastDate, routines, []);
        dayProgress.plannedRoutines.forEach((r) => {
          logs.push({
            id: logIdCounter++,
            routineId: r.id,
            date: pastDate,
            isCompleted: true,
            isSkipped: false,
            skipReason: null,
            loggedValue: r.targetValue,
            durationMinutesLogged: r.durationMinutes,
            notes: 'Completed on schedule',
            rescheduledToDate: null,
            completedAt: Date.now() - i * 86400000,
          });
        });
      }

      reflections = [
        {
          id: 1,
          date: ProgressCalculationEngine.addDays(today, -1),
          rating: 5,
          wentWell: 'Completed cardio run early, high focus deep work session.',
          couldImprove: 'Need to disconnect from screen 30 minutes before sleep.',
          notes: 'Great energy all day!',
          createdAt: Date.now() - 86400000,
        },
      ];

      this.saveGoals(goals);
      this.saveRoutines(routines);
      this.saveLogs(logs);
      this.saveReflections(reflections);
      this.saveSettings(settings);
    }

    return { goals, routines, logs, reflections, settings };
  }

  /**
   * Exports all app state as JSON for backup
   */
  static exportDataAsJson(): string {
    const data = {
      version: 1,
      appName: 'Himaleh',
      exportedAt: new Date().toISOString(),
      goals: this.getGoals(),
      routines: this.getRoutines(),
      routineLogs: this.getLogs(),
      reflections: this.getReflections(),
      userSettings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Imports JSON backup
   */
  static importDataFromJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.goals && Array.isArray(data.goals)) {
        this.saveGoals(data.goals);
      }
      if (data.routines && Array.isArray(data.routines)) {
        this.saveRoutines(data.routines);
      }
      if (data.routineLogs && Array.isArray(data.routineLogs)) {
        this.saveLogs(data.routineLogs);
      }
      if (data.reflections && Array.isArray(data.reflections)) {
        this.saveReflections(data.reflections);
      }
      if (data.userSettings) {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...data.userSettings });
      }
      return true;
    } catch (err) {
      console.error('Failed to import JSON data:', err);
      return false;
    }
  }

  /**
   * Clears all data and re-seeds defaults
   */
  static resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.ROUTINES);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.initializeIfEmpty();
  }
}
