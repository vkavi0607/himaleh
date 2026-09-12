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
  routineReminders: true,
  goalReminders: true,
  reflectionReminders: true,
  incompleteReminders: true,
  soundEnabled: true,
  reminderSounds: true,
  celebrationSounds: true,
  accountabilitySounds: true,
  soundVolume: 'medium',
  selectedSound: 'himaleh_chime',
  customSoundName: null,
  customSoundData: null,
  vibrationEnabled: true,
  reduceMotion: false,
  strictAccountability: false,
  restDayFrequency: 1,
  theme: 'system',
  isDarkMode: false,
  weeklyGoalTargetDays: 5,
  timeFormat: '12h',
  weekStartsOn: 'monday',
  appLockEnabled: false,
  appLockPin: null,
};

const memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Storage access blocked or restricted
  }
  return memoryStore[key] ?? null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Storage access blocked or quota exceeded
  }
  memoryStore[key] = value;
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage access blocked
  }
  delete memoryStore[key];
}

export class StorageService {
  static getSettings(): UserSettings {
    try {
      const raw = safeGetItem(STORAGE_KEYS.SETTINGS);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: UserSettings): void {
    try {
      safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // fallback
    }
  }

  static getGoals(): Goal[] {
    try {
      const raw = safeGetItem(STORAGE_KEYS.GOALS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static saveGoals(goals: Goal[]): void {
    try {
      safeSetItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch {
      // fallback
    }
  }

  static getRoutines(): Routine[] {
    try {
      const raw = safeGetItem(STORAGE_KEYS.ROUTINES);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static saveRoutines(routines: Routine[]): void {
    try {
      safeSetItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
    } catch {
      // fallback
    }
  }

  static getLogs(): RoutineLog[] {
    try {
      const raw = safeGetItem(STORAGE_KEYS.LOGS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static saveLogs(logs: RoutineLog[]): void {
    try {
      safeSetItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch {
      // fallback
    }
  }

  static getReflections(): DailyReflection[] {
    try {
      const raw = safeGetItem(STORAGE_KEYS.REFLECTIONS);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static saveReflections(reflections: DailyReflection[]): void {
    try {
      safeSetItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(reflections));
    } catch {
      // fallback
    }
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
    safeRemoveItem(STORAGE_KEYS.GOALS);
    safeRemoveItem(STORAGE_KEYS.ROUTINES);
    safeRemoveItem(STORAGE_KEYS.LOGS);
    safeRemoveItem(STORAGE_KEYS.REFLECTIONS);
    safeRemoveItem(STORAGE_KEYS.SETTINGS);
    this.initializeIfEmpty();
  }

  /**
   * Generates realistic multi-day sample data for testing:
   * - Diverse goals across categories (Fitness, Mindset, Work, Health)
   * - Diverse routines (checkbox, duration, count, quantity) with morning, afternoon, evening times
   * - Multi-day history with completions, intentional skip, and streaks
   * - Detailed multi-day reflections with ratings and multi-line notes
   */
  static loadRichSampleData(): void {
    const today = ProgressCalculationEngine.getTodayStr();
    const threeMonthsLater = ProgressCalculationEngine.addDays(today, 90);

    const goals: Goal[] = [
      {
        id: 101,
        title: '30 Day Fitness Challenge',
        description: 'Complete 30 consecutive days of focused physical conditioning, core stability, and cardiovascular endurance.',
        category: 'Fitness',
        startDate: today,
        endDate: ProgressCalculationEngine.addDays(today, 30),
        targetValue: 30,
        currentValue: 12,
        unit: 'days',
        priority: GoalPriority.HIGH,
        status: GoalStatus.ACTIVE,
        motivation: 'Consistent physical discipline creates the mental clarity and energy foundation for everything else.',
        createdAt: Date.now() - 12 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 102,
        title: 'Read 6 Non-Fiction Mastery Books',
        description: 'Read 20 pages each night before bed across leadership, psychology, and systems thinking.',
        category: 'Mindset',
        startDate: ProgressCalculationEngine.addDays(today, -14),
        endDate: threeMonthsLater,
        targetValue: 6,
        currentValue: 2,
        unit: 'books',
        priority: GoalPriority.MEDIUM,
        status: GoalStatus.ACTIVE,
        motivation: 'Consistent intellectual feeding expands perspective and long-term decision making.',
        createdAt: Date.now() - 14 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 103,
        title: 'Launch Web Platform MVP',
        description: 'Design, develop, and test responsive web application architecture with clean modular code.',
        category: 'Career',
        startDate: ProgressCalculationEngine.addDays(today, -10),
        endDate: ProgressCalculationEngine.addDays(today, 30),
        targetValue: 100,
        currentValue: 65,
        unit: '%',
        priority: GoalPriority.HIGH,
        status: GoalStatus.ACTIVE,
        motivation: 'Shipping great software on time proves technical execution mastery.',
        createdAt: Date.now() - 10 * 86400000,
        updatedAt: Date.now(),
      },
      {
        id: 104,
        title: 'Optimal Hydration & Nutrition (90-Day Reset)',
        description: 'Drink 2.5L clean water daily and maintain clean unprocessed eating habits.',
        category: 'Health',
        startDate: ProgressCalculationEngine.addDays(today, -20),
        endDate: ProgressCalculationEngine.addDays(today, 70),
        targetValue: 90,
        currentValue: 20,
        unit: 'days',
        priority: GoalPriority.MEDIUM,
        status: GoalStatus.ACTIVE,
        motivation: 'Cellular energy and hydration are the foundation of high cognitive output.',
        createdAt: Date.now() - 20 * 86400000,
        updatedAt: Date.now(),
      },
    ];

    const routines: Routine[] = [
      {
        id: 201,
        name: 'Wake Up',
        description: 'Consistent circadian wake up at sunrise with natural light exposure.',
        category: 'Personal',
        linkedGoalId: null,
        startDate: ProgressCalculationEngine.addDays(today, -14),
        endDate: null,
        timeHour: 6,
        timeMinute: 0,
        durationMinutes: 5,
        frequency: RoutineFrequency.DAILY,
        frequencyDays: '1,2,3,4,5,6,7',
        weeklyTargetTimes: 7,
        taskType: TaskType.CHECKBOX,
        targetValue: 1,
        unit: '',
        priority: RoutinePriority.HIGH,
        reminderEnabled: true,
        isPaused: false,
        createdAt: Date.now() - 14 * 86400000,
      },
      {
        id: 202,
        name: 'Workout',
        description: 'Dynamic warm-up and 45-minute steady-state cardiovascular or strength training session.',
        category: 'Fitness',
        linkedGoalId: 101,
        startDate: ProgressCalculationEngine.addDays(today, -14),
        endDate: null,
        timeHour: 7,
        timeMinute: 0,
        durationMinutes: 45,
        frequency: RoutineFrequency.DAILY,
        frequencyDays: '1,2,3,4,5,6,7',
        weeklyTargetTimes: 7,
        taskType: TaskType.DURATION,
        targetValue: 45,
        unit: 'min',
        priority: RoutinePriority.HIGH,
        reminderEnabled: true,
        isPaused: false,
        createdAt: Date.now() - 14 * 86400000,
      },
      {
        id: 203,
        name: 'Coding',
        description: 'Focused software engineering, algorithms, and full-stack system architecture sprint.',
        category: 'Career',
        linkedGoalId: 103,
        startDate: ProgressCalculationEngine.addDays(today, -14),
        endDate: null,
        timeHour: 19,
        timeMinute: 30,
        durationMinutes: 120,
        frequency: RoutineFrequency.CUSTOM_DAYS,
        frequencyDays: '1,3,5',
        weeklyTargetTimes: 3,
        taskType: TaskType.DURATION,
        targetValue: 120,
        unit: 'min',
        priority: RoutinePriority.HIGH,
        reminderEnabled: true,
        isPaused: false,
        createdAt: Date.now() - 14 * 86400000,
      },
      {
        id: 204,
        name: 'Reading',
        description: 'Read 20 pages of selected philosophy, science, or leadership literature.',
        category: 'Mindset',
        linkedGoalId: 102,
        startDate: ProgressCalculationEngine.addDays(today, -14),
        endDate: null,
        timeHour: 21,
        timeMinute: 0,
        durationMinutes: 30,
        frequency: RoutineFrequency.DAILY,
        frequencyDays: '1,2,3,4,5,6,7',
        weeklyTargetTimes: 7,
        taskType: TaskType.COUNT,
        targetValue: 20,
        unit: 'pages',
        priority: RoutinePriority.MEDIUM,
        reminderEnabled: true,
        isPaused: false,
        createdAt: Date.now() - 14 * 86400000,
      },
      {
        id: 205,
        name: 'Morning Hydration (500ml)',
        description: 'Drink 500ml pure water with electrolytes upon waking up.',
        category: 'Health',
        linkedGoalId: 104,
        startDate: ProgressCalculationEngine.addDays(today, -14),
        endDate: null,
        timeHour: 6,
        timeMinute: 15,
        durationMinutes: 5,
        frequency: RoutineFrequency.DAILY,
        frequencyDays: '1,2,3,4,5,6,7',
        weeklyTargetTimes: 7,
        taskType: TaskType.QUANTITY,
        targetValue: 500,
        unit: 'ml',
        priority: RoutinePriority.MEDIUM,
        reminderEnabled: true,
        isPaused: false,
        createdAt: Date.now() - 14 * 86400000,
      },
      {
        id: 206,
        name: 'Evening Journaling & Reflection',
        description: 'Record day wins, improvement targets, and rating in daily reflection ledger.',
        category: 'Personal',
        linkedGoalId: null,
        startDate: ProgressCalculationEngine.addDays(today, -14),
        endDate: null,
        timeHour: 21,
        timeMinute: 30,
        durationMinutes: 15,
        frequency: RoutineFrequency.DAILY,
        frequencyDays: '1,2,3,4,5,6,7',
        weeklyTargetTimes: 7,
        taskType: TaskType.CHECKBOX,
        targetValue: 1,
        unit: '',
        priority: RoutinePriority.MEDIUM,
        reminderEnabled: true,
        isPaused: false,
        createdAt: Date.now() - 14 * 86400000,
      },
    ];

    // Generate 7-day realistic routine logs
    const logs: RoutineLog[] = [];
    let logId = 1000;

    for (let dayOffset = 7; dayOffset >= 1; dayOffset--) {
      const d = ProgressCalculationEngine.addDays(today, -dayOffset);
      const isDay3 = dayOffset === 3; // On day -3, simulate one intentional rest-day skip

      routines.forEach((r) => {
        if (isDay3 && r.id === 202) {
          // Intentional rest skip
          logs.push({
            id: logId++,
            routineId: r.id,
            date: d,
            isCompleted: false,
            isSkipped: true,
            skipReason: 'Deliberate muscle recovery & rest protocol',
            loggedValue: 0,
            durationMinutesLogged: 0,
            notes: 'Planned rest',
            rescheduledToDate: null,
            completedAt: null,
          });
        } else {
          logs.push({
            id: logId++,
            routineId: r.id,
            date: d,
            isCompleted: true,
            isSkipped: false,
            skipReason: null,
            loggedValue: r.targetValue,
            durationMinutesLogged: r.durationMinutes,
            notes: 'Completed on schedule',
            rescheduledToDate: null,
            completedAt: Date.now() - dayOffset * 86400000,
          });
        }
      });
    }

    // Generate rich multi-day reflections with long multi-paragraph content
    const reflections: DailyReflection[] = [
      {
        id: 301,
        date: ProgressCalculationEngine.addDays(today, -1),
        rating: 5,
        wentWell: 'Today I completed my coding session and made remarkable progress on the core domain algorithms. Having uninterrupted blocks of deep work in the evening made all the difference—I was able to solve the state synchronization bottlenecks without jumping between context switches.\n\nThe morning workout also set a strong foundation for physical and mental clarity. Hydration was on point, reaching 2.5 liters well before dusk. What stood out today was the deliberate patience practiced during challenging code reviews: rather than rushing through pull requests, I took the time to annotate architectural decisions clearly.',
        couldImprove: 'Spent 15 minutes checking email right before bedtime. Keeping devices outside the bedroom tonight to protect circadian melatonin cycles. Also need to ensure dinner finishes by 7:30 PM to optimize restorative deep sleep phases.',
        notes: 'Energy was exceptionally stable all afternoon after the whole-foods lunch. Compounding habits are starting to feel effortless and automatic.\n\nLooking forward to tomorrow, the primary objective is maintaining this exact momentum. When routine execution becomes non-negotiable, the cognitive overhead of decision fatigue vanishes completely. Tomorrow morning movement session will focus on mobility and recovery to keep the neuromuscular system feeling fresh.',
        createdAt: Date.now() - 86400000,
      },
      {
        id: 302,
        date: ProgressCalculationEngine.addDays(today, -2),
        rating: 4,
        wentWell: 'Completed all planned habits before 10 PM. Finished Chapter 4 of the non-fiction book.',
        couldImprove: 'Felt slight afternoon fatigue around 3 PM. Remember to drink 500ml water before reaching for coffee.',
        notes: 'Good discipline holding off distractions during the morning deep work sprint.',
        createdAt: Date.now() - 2 * 86400000,
      },
      {
        id: 303,
        date: ProgressCalculationEngine.addDays(today, -3),
        rating: 5,
        wentWell: 'Listened to my body and took a deliberate recovery skip on cardio while crushing deep work and reading targets.',
        couldImprove: 'Prepare lunch ingredients the evening before to save 20 minutes mid-day.',
        notes: 'Deliberate recovery left me completely refreshed for the remainder of the week.',
        createdAt: Date.now() - 3 * 86400000,
      },
    ];

    const settings: UserSettings = {
      userName: 'Alex',
      morningReminderTime: '06:00',
      eveningReflectionTime: '21:30',
      notificationsEnabled: true,
      routineReminders: true,
      goalReminders: true,
      reflectionReminders: true,
      incompleteReminders: true,
      soundEnabled: true,
      reminderSounds: true,
      celebrationSounds: true,
      accountabilitySounds: true,
      soundVolume: 'medium',
      selectedSound: 'himaleh_chime',
      customSoundName: null,
      customSoundData: null,
      vibrationEnabled: true,
      reduceMotion: false,
      strictAccountability: false,
      restDayFrequency: 1,
      theme: 'system',
      isDarkMode: false,
      weeklyGoalTargetDays: 5,
      timeFormat: '12h',
      weekStartsOn: 'monday',
      appLockEnabled: false,
      appLockPin: null,
    };

    this.saveGoals(goals);
    this.saveRoutines(routines);
    this.saveLogs(logs);
    this.saveReflections(reflections);
    this.saveSettings(settings);
  }
}
