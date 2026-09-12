import {
  Goal,
  Routine,
  RoutineLog,
  DailyReflection,
  UserSettings,
} from '../types';
import { DataExportService } from '../services/DataExportService';

export const STORAGE_KEYS = {
  GOALS: 'himaleh_goals_v1',
  ROUTINES: 'himaleh_routines_v1',
  LOGS: 'himaleh_logs_v1',
  REFLECTIONS: 'himaleh_reflections_v1',
  SETTINGS: 'himaleh_settings_v1',
  UNLOCKED_MILESTONES: 'himaleh_unlocked_milestones_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Explorer',
  morningReminderTime: '07:30',
  eveningReflectionTime: '21:30',
  notificationsEnabled: true,
  routineReminders: true,
  goalReminders: true,
  achievementNotifications: true,
  accountabilityNotifications: true,
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
  automaticLightTime: '06:00',
  automaticDarkTime: '18:00',
  accentStyle: 'emerald',
  layoutMode: 'comfortable',
  autoEnableRoutineReminder: true,
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

  static getUnlockedMilestones(): string[] {
    try {
      const raw = safeGetItem(STORAGE_KEYS.UNLOCKED_MILESTONES);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [];
  }

  static saveUnlockedMilestones(ids: string[]): void {
    try {
      safeSetItem(STORAGE_KEYS.UNLOCKED_MILESTONES, JSON.stringify(ids));
    } catch {
      // fallback
    }
  }

  static markMilestoneUnlocked(id: string): boolean {
    const existing = new Set(this.getUnlockedMilestones());
    if (existing.has(id)) return false;
    existing.add(id);
    this.saveUnlockedMilestones(Array.from(existing));
    return true;
  }

  /**
   * Initializes starter records from local storage.
   * Himaleh production contains ONLY authentic user-created data — zero mock seeds.
   */
  static initializeIfEmpty(): {
    goals: Goal[];
    routines: Routine[];
    logs: RoutineLog[];
    reflections: DailyReflection[];
    settings: UserSettings;
  } {
    const goals = this.getGoals();
    const routines = this.getRoutines();
    const logs = this.getLogs();
    const reflections = this.getReflections();
    const settings = this.getSettings();

    return { goals, routines, logs, reflections, settings };
  }

  /**
   * Exports all authentic app state as JSON
   */
  static exportDataAsJson(): string {
    const goals = this.getGoals();
    const routines = this.getRoutines();
    const logs = this.getLogs();
    const reflections = this.getReflections();
    const settings = this.getSettings();

    return JSON.stringify(
      {
        app: 'Himaleh',
        formatVersion: 2,
        exportedAt: new Date().toISOString(),
        vaultMetadata: {
          totalGoals: goals.length,
          totalRoutines: routines.length,
          totalLogs: logs.length,
          totalReflections: reflections.length,
          appName: 'Himaleh',
          appVersion: '1.4.2',
        },
        goals,
        routines,
        logs,
        reflections,
        settings,
      },
      null,
      2
    );
  }

  /**
   * Imports JSON backup into storage after validation
   */
  static importDataFromJson(jsonStr: string): boolean {
    const validation = DataExportService.validateBackupJson(jsonStr);
    if (!validation.isValid || !validation.data) {
      console.error('Failed to import JSON data:', validation.error);
      return false;
    }

    try {
      this.saveGoals(validation.data.goals);
      this.saveRoutines(validation.data.routines);
      this.saveLogs(validation.data.logs);
      this.saveReflections(validation.data.reflections);
      if (validation.data.settings) {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...validation.data.settings });
      }
      return true;
    } catch (err) {
      console.error('Failed to save imported backup data:', err);
      return false;
    }
  }

  /**
   * Resets all app data completely to a clean, empty state with default preferences.
   * Absolutely NO mock or sample data injected.
   */
  public static resetAllData(): void {
    try {
      safeRemoveItem(STORAGE_KEYS.GOALS);
      safeRemoveItem(STORAGE_KEYS.ROUTINES);
      safeRemoveItem(STORAGE_KEYS.LOGS);
      safeRemoveItem(STORAGE_KEYS.REFLECTIONS);
      safeRemoveItem(STORAGE_KEYS.SETTINGS);

      // Save pristine empty arrays
      this.saveGoals([]);
      this.saveRoutines([]);
      this.saveLogs([]);
      this.saveReflections([]);
      this.saveSettings(DEFAULT_SETTINGS);
    } catch (e) {
      console.error('Failed to reset all data:', e);
    }
  }
}
