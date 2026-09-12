import { Routine, RoutineFrequency, SoundPreset, UserSettings } from '../types';
import { SoundService } from './SoundService';
import { ProgressCalculationEngine } from '../domain/ProgressCalculationEngine';

export interface ScheduledReminderInfo {
  routineId: number;
  routineName: string;
  triggerTime: number; // epoch ms
  targetDateStr: string; // ISO string
  delayMs: number;
  timerId: number;
}

type RoutineCompletionListener = (routineId: number) => void;
type RoutineFocusListener = (routineId: number) => void;

class NotificationManager {
  private activeTimers: Map<number, number> = new Map();
  private scheduledReminders: Map<number, ScheduledReminderInfo> = new Map();
  private swRegistration: ServiceWorkerRegistration | null = null;
  private completionListeners: Set<RoutineCompletionListener> = new Set();
  private focusListeners: Set<RoutineFocusListener> = new Set();
  private currentSettings: UserSettings | null = null;
  private currentRoutines: Routine[] = [];

  constructor() {
    this.initServiceWorker();
    this.setupVisibilityWakeListener();
  }

  /**
   * Initializes the Service Worker for background and native action notifications
   */
  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;

      // Listen for messages dispatched by the Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data) return;
        if (event.data.type === 'NOTIFICATION_ACTION_COMPLETE' && event.data.routineId) {
          this.notifyActionComplete(Number(event.data.routineId));
        } else if (event.data.type === 'FOCUS_ROUTINE' && event.data.routineId) {
          this.notifyRoutineFocus(Number(event.data.routineId));
        }
      });

      return reg;
    } catch (e) {
      console.warn('ServiceWorker registration error:', e);
      return null;
    }
  }

  /**
   * Listens for tab visibility changes to verify schedule accuracy on wake
   */
  private setupVisibilityWakeListener(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.currentSettings) {
        // Re-validate and sync timers on tab focus
        this.recheckTimers();
      }
    });
  }

  /**
   * Checks if any scheduled timer is overdue or needs re-arming
   */
  private recheckTimers(): void {
    const now = Date.now();
    for (const [routineId, info] of this.scheduledReminders.entries()) {
      if (info.triggerTime <= now) {
        // Routine reminder time arrived while page was dormant
        const routine = this.currentRoutines.find((r) => r.id === routineId);
        if (routine && this.currentSettings && routine.reminderEnabled && !routine.isPaused) {
          this.deliverRoutineNotification(routine, this.currentSettings);
        }
        // Reschedule for next recurrence
        if (routine && this.currentSettings) {
          this.scheduleRoutine(routine, this.currentSettings);
        }
      }
    }
  }

  /**
   * Returns current W3C Notification permission status
   */
  public getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Requests OS notification permission with standard browser prompt
   */
  public async requestPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'unsupported';
    }
  }

  /**
   * Calculates the exact next target Date when a routine is scheduled to trigger
   */
  public getNextTriggerDate(routine: Routine): Date | null {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    const hour = Math.max(0, Math.min(23, routine.timeHour));
    const minute = Math.max(0, Math.min(59, routine.timeMinute));

    // Parse allowed days of week (1=Monday ... 7=Sunday)
    let allowedDays = new Set<number>([1, 2, 3, 4, 5, 6, 7]);

    if (routine.frequency === RoutineFrequency.WEEKDAYS) {
      allowedDays = new Set([1, 2, 3, 4, 5]);
    } else if (routine.frequency === RoutineFrequency.WEEKENDS) {
      allowedDays = new Set([6, 7]);
    } else if (
      routine.frequency === RoutineFrequency.CUSTOM_DAYS ||
      routine.frequency === RoutineFrequency.WEEKLY
    ) {
      if (routine.frequencyDays) {
        allowedDays = ProgressCalculationEngine.parseFrequencyDays(routine.frequencyDays);
      }
    }

    // Search up to 14 days into the future for the next matching day
    for (let offset = 0; offset <= 14; offset++) {
      const candidate = new Date(currentYear, currentMonth, currentDate + offset, hour, minute, 0, 0);

      // JavaScript Date: getDay() returns 0 for Sunday, 1 for Monday... 6 for Saturday
      // Convert to ISO 1=Monday ... 7=Sunday
      const jsDay = candidate.getDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;

      if (allowedDays.has(isoDay)) {
        // If it's today (offset === 0), it must be in the future
        if (offset === 0) {
          if (candidate.getTime() > now.getTime() + 1000) {
            return candidate;
          }
        } else {
          return candidate;
        }
      }
    }

    return null;
  }

  /**
   * Registers a routine's real OS notification timer
   */
  public scheduleRoutine(
    routine: Routine,
    settings: UserSettings
  ): ScheduledReminderInfo | null {
    this.currentSettings = settings;

    // Always clear old scheduled timer first
    this.cancelRoutine(routine.id);

    // If disabled globally or on the routine, don't schedule
    if (
      !settings.notificationsEnabled ||
      !settings.routineReminders ||
      !routine.reminderEnabled ||
      routine.isPaused
    ) {
      return null;
    }

    const nextDate = this.getNextTriggerDate(routine);
    if (!nextDate) return null;

    const now = Date.now();
    const delayMs = nextDate.getTime() - now;

    // Set real exact timeout
    // Max safe setTimeout delay is 2^31 - 1 (~24.8 days)
    const safeDelay = Math.min(delayMs, 2147483647);

    const timerId = window.setTimeout(() => {
      this.deliverRoutineNotification(routine, settings);
      // Re-schedule for next recurrence
      this.scheduleRoutine(routine, settings);
    }, safeDelay);

    const info: ScheduledReminderInfo = {
      routineId: routine.id,
      routineName: routine.name,
      triggerTime: nextDate.getTime(),
      targetDateStr: nextDate.toISOString(),
      delayMs,
      timerId,
    };

    this.activeTimers.set(routine.id, timerId);
    this.scheduledReminders.set(routine.id, info);

    return info;
  }

  /**
   * Cancels any scheduled reminder timer for a routine
   */
  public cancelRoutine(routineId: number): void {
    const timerId = this.activeTimers.get(routineId);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.activeTimers.delete(routineId);
    }
    this.scheduledReminders.delete(routineId);
  }

  /**
   * Synchronizes and reschedules all active routines
   */
  public rescheduleAll(routines: Routine[], settings: UserSettings): void {
    this.currentRoutines = routines;
    this.currentSettings = settings;

    // Clear all existing
    for (const timerId of this.activeTimers.values()) {
      window.clearTimeout(timerId);
    }
    this.activeTimers.clear();
    this.scheduledReminders.clear();

    if (!settings.notificationsEnabled || !settings.routineReminders) {
      return;
    }

    routines.forEach((routine) => {
      if (routine.reminderEnabled && !routine.isPaused) {
        this.scheduleRoutine(routine, settings);
      }
    });
  }

  /**
   * Dispatches the real OS notification and plays the sound
   */
  public async deliverRoutineNotification(
    routine: Routine,
    settings: UserSettings
  ): Promise<void> {
    const routineSound = routine.reminderSound || settings.selectedSound || 'himaleh_chime';

    // 1. Play sound
    if (settings.soundEnabled && settings.reminderSounds) {
      if (routineSound === 'custom' && settings.customSoundData) {
        SoundService.playCustomSound(settings.customSoundData, settings.soundVolume, () => {
          SoundService.playPreset('himaleh_chime', settings.soundVolume);
        });
      } else {
        SoundService.playPreset(
          routineSound === 'custom' ? 'himaleh_chime' : routineSound,
          settings.soundVolume
        );
      }
    }

    // 2. Trigger haptic vibration
    SoundService.triggerHaptic(settings, [100, 50, 100]);

    // 3. Dispatch real platform OS notification
    const title = `Himaleh • ⏰ ${routine.name}`;
    const body = `Your routine is scheduled for now (${routine.category} • ${routine.durationMinutes}m)`;

    await this.dispatchNativeNotification(title, {
      body,
      tag: `himaleh-routine-${routine.id}`,
      data: { routineId: routine.id },
      actions: [
        { action: 'complete', title: '✓ Complete' },
        { action: 'open', title: 'Open Routine' },
      ],
    });
  }

  /**
   * Low-level method to show a native OS notification via Service Worker or W3C Notification API
   */
  public async dispatchNativeNotification(
    title: string,
    options: {
      body?: string;
      tag?: string;
      data?: Record<string, unknown>;
      actions?: Array<{ action: string; title: string }>;
      requireInteraction?: boolean;
    } = {}
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const notificationPayload = {
      body: options.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: options.tag || 'himaleh-notification',
      data: options.data || {},
      requireInteraction: options.requireInteraction ?? false,
      vibrate: [200, 100, 200],
      ...(options.actions ? { actions: options.actions } : {}),
    };

    // Try Service Worker showNotification first (supports rich actions and better background delivery)
    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      try {
        await this.swRegistration.showNotification(title, notificationPayload);
        return true;
      } catch (err) {
        console.warn('SW showNotification failed, falling back to window.Notification:', err);
      }
    }

    // Fallback to standard W3C Notification
    try {
      const notif = new Notification(title, {
        body: notificationPayload.body,
        icon: notificationPayload.icon,
        tag: notificationPayload.tag,
        data: notificationPayload.data,
      });

      notif.onclick = () => {
        window.focus();
        if (options.data && options.data.routineId) {
          this.notifyRoutineFocus(Number(options.data.routineId));
        }
        notif.close();
      };

      return true;
    } catch (err) {
      console.warn('Native notification dispatch error:', err);
      return false;
    }
  }

  /**
   * Schedules a real test notification at exact offset (e.g. +1 min, +2 min, +5 min, or instant)
   */
  public scheduleTestReminder(
    delaySeconds: number,
    settings: UserSettings,
    presetSound?: SoundPreset,
    testRoutineName: string = 'Reading'
  ): { targetTime: number; timerId: number } {
    const targetTime = Date.now() + delaySeconds * 1000;
    const soundToPlay = presetSound || settings.selectedSound || 'himaleh_chime';

    if (delaySeconds <= 0) {
      // Instant execution
      this.deliverTestNotification(testRoutineName, settings, soundToPlay);
      return { targetTime, timerId: 0 };
    }

    const timerId = window.setTimeout(() => {
      this.deliverTestNotification(testRoutineName, settings, soundToPlay);
    }, delaySeconds * 1000);

    return { targetTime, timerId };
  }

  private deliverTestNotification(
    routineName: string,
    settings: UserSettings,
    sound: SoundPreset
  ): void {
    if (settings.soundEnabled && settings.reminderSounds) {
      if (sound === 'custom' && settings.customSoundData) {
        SoundService.playCustomSound(settings.customSoundData, settings.soundVolume, () => {
          SoundService.playPreset('himaleh_chime', settings.soundVolume);
        });
      } else {
        SoundService.playPreset(
          sound === 'custom' ? 'himaleh_chime' : sound,
          settings.soundVolume
        );
      }
    }

    SoundService.triggerHaptic(settings, [80, 40, 80]);

    this.dispatchNativeNotification(`Himaleh • ⏰ ${routineName}`, {
      body: 'Your routine is scheduled for now.',
      tag: 'himaleh-test-reminder',
      actions: [
        { action: 'complete', title: '✓ Complete' },
        { action: 'open', title: 'Open' },
      ],
    });
  }

  /**
   * Listeners for notification action callbacks
   */
  public addActionListener(listener: RoutineCompletionListener): () => void {
    this.completionListeners.add(listener);
    return () => this.completionListeners.delete(listener);
  }

  public addFocusListener(listener: RoutineFocusListener): () => void {
    this.focusListeners.add(listener);
    return () => this.focusListeners.delete(listener);
  }

  private notifyActionComplete(routineId: number): void {
    this.completionListeners.forEach((fn) => {
      try {
        fn(routineId);
      } catch (err) {
        console.error('Error in completion listener:', err);
      }
    });
  }

  private notifyRoutineFocus(routineId: number): void {
    this.focusListeners.forEach((fn) => {
      try {
        fn(routineId);
      } catch (err) {
        console.error('Error in focus listener:', err);
      }
    });
  }

  public getScheduledReminders(): ScheduledReminderInfo[] {
    return Array.from(this.scheduledReminders.values()).sort(
      (a, b) => a.triggerTime - b.triggerTime
    );
  }
}

export const NotificationService = new NotificationManager();
