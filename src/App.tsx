import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScreenNav,
  Routine,
  Goal,
  RoutineLog,
  DailyReflection,
  UserSettings,
  CelebrationEvent,
  GoalStatus,
} from './types';
import { StorageService } from './data/storage';
import { ProgressCalculationEngine } from './domain/ProgressCalculationEngine';
import { ConsistencyEngine } from './domain/ConsistencyEngine';
import { AccountabilityEngine } from './domain/AccountabilityEngine';

import { Navigation } from './components/Navigation';
import { DashboardScreen } from './screens/DashboardScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { RoutinesScreen } from './screens/RoutinesScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

import { CelebrationModal } from './components/CelebrationModal';
import { CompleteMeasurableModal } from './components/CompleteMeasurableModal';
import { RescheduleModal } from './components/RescheduleModal';
import { DailyReflectionModal } from './components/DailyReflectionModal';
import { AddEditRoutineModal } from './components/AddEditRoutineModal';
import { AddEditGoalModal } from './components/AddEditGoalModal';
import { GoalDetailsModal } from './components/GoalDetailsModal';
import { QuickAddRoutineModal } from './components/QuickAddRoutineModal';
import { Preloader } from './components/Preloader';
import { SystemStatusBar } from './components/SystemStatusBar';
import { AppLockModal } from './components/AppLockModal';
import { SoundService } from './services/SoundService';
import { NotificationService } from './services/NotificationService';
import { useTheme } from './theme/ThemeContext';
import { Bell } from 'lucide-react';

export const App: React.FC = () => {
  const { isDark, themePreference, setThemePreference } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenNav>('dashboard');
  const [currentDate, setCurrentDate] = useState<string>(() =>
    ProgressCalculationEngine.getTodayStr()
  );

  // App Data State
  const [goals, setGoals] = useState<Goal[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() => StorageService.getSettings());
  const [routineFeedbackNotice, setRoutineFeedbackNotice] = useState<string | null>(null);

  // Modals & Sheets
  const [celebrationEvent, setCelebrationEvent] = useState<CelebrationEvent | null>(null);
  const [measurableModalRoutine, setMeasurableModalRoutine] = useState<Routine | null>(null);
  const [rescheduleModalRoutine, setRescheduleModalRoutine] = useState<Routine | null>(null);
  const [reflectionModalOpen, setReflectionModalOpen] = useState(false);
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);

  const [routineModalState, setRoutineModalState] = useState<{
    isOpen: boolean;
    initialRoutine: Routine | null;
  }>({ isOpen: false, initialRoutine: null });

  const [goalModalState, setGoalModalState] = useState<{
    isOpen: boolean;
    initialGoal: Goal | null;
  }>({ isOpen: false, initialGoal: null });

  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);

  // App Startup Preloader and Security Lock
  const [isPreloading, setIsPreloading] = useState(true);
  const [isLocked, setIsLocked] = useState(() => Boolean(settings.appLockEnabled && settings.appLockPin));

  // Comprehensive real application initialization
  const initializeApplication = useCallback(async () => {
    // 1. Initialize authentic data from local vault
    const initialized = StorageService.initializeIfEmpty();
    setGoals(initialized.goals);
    setRoutines(initialized.routines);
    setLogs(initialized.logs);
    setReflections(initialized.reflections);
    setSettings(initialized.settings);

    // 2. Restore saved theme if changed
    if (initialized.settings.theme && initialized.settings.theme !== themePreference) {
      setThemePreference(initialized.settings.theme);
    }

    // 3. Initialize background service worker & notification schedules
    try {
      NotificationService.initServiceWorker();
      if (initialized.routines.length > 0) {
        NotificationService.rescheduleAll(initialized.routines, initialized.settings);
      }
    } catch (notifErr) {
      console.warn('Non-blocking notification initialization note:', notifErr);
    }

    // 4. Pre-warm analytics and streak calculation engines
    try {
      ConsistencyEngine.calculateStreaks(
        initialized.routines,
        initialized.logs,
        ProgressCalculationEngine.getTodayStr()
      );
    } catch {
      // safe fallback
    }
  }, [themePreference, setThemePreference]);

  const handlePreloaderComplete = useCallback(() => {
    setIsPreloading(false);
  }, []);

  // Synchronize data on manual reloads (e.g. backup restore)
  const reloadData = useCallback(() => {
    initializeApplication();
  }, [initializeApplication]);

  // Synchronize OS notifications with routines & settings
  useEffect(() => {
    if (routines.length > 0) {
      NotificationService.rescheduleAll(routines, settings);
    }
  }, [routines, settings]);

  // Listen for OS notification action buttons (Complete, Open)
  useEffect(() => {
    const unsubAction = NotificationService.addActionListener((routineId: number) => {
      if (routineId) {
        const target = routines.find((r) => r.id === routineId);
        if (target) {
          handleToggleRoutine(target);
          setRoutineFeedbackNotice(`Routine "${target.name}" completed from notification!`);
          setTimeout(() => setRoutineFeedbackNotice(null), 3000);
        }
      }
    });

    const unsubFocus = NotificationService.addFocusListener((_routineId) => {
      setCurrentScreen('routines');
    });

    return () => {
      unsubAction();
      unsubFocus();
    };
  }, [routines, logs, currentDate, settings]);

  // Derived Calculations
  const dailyProgress = useMemo(() => {
    return ProgressCalculationEngine.calculateDailyProgress(currentDate, routines, logs);
  }, [currentDate, routines, logs]);

  const streakStats = useMemo(() => {
    return ConsistencyEngine.calculateStreaks(routines, logs, currentDate);
  }, [routines, logs, currentDate]);

  const dashboardState = useMemo(() => {
    return AccountabilityEngine.resolveDashboardState(
      dailyProgress,
      streakStats,
      currentDate,
      settings
    );
  }, [dailyProgress, streakStats, currentDate, settings]);

  const goalProgressMap = useMemo(() => {
    const map: Record<number, ReturnType<typeof ProgressCalculationEngine.calculateGoalProgress>> = {};
    goals.forEach((g) => {
      map[g.id] = ProgressCalculationEngine.calculateGoalProgress(g, routines, logs);
    });
    return map;
  }, [goals, routines, logs]);

  const currentReflection = useMemo(() => {
    return reflections.find((r) => r.date === currentDate) || null;
  }, [reflections, currentDate]);

  // Check if day complete triggers celebration
  const checkDailyCelebrationTrigger = (updatedLogs: RoutineLog[]) => {
    const nextProg = ProgressCalculationEngine.calculateDailyProgress(currentDate, routines, updatedLogs);
    if (nextProg.totalPlanned > 0 && nextProg.completedCount >= nextProg.totalPlanned) {
      const nextStreaks = ConsistencyEngine.calculateStreaks(routines, updatedLogs, currentDate);
      SoundService.play('celebration', settings);
      setCelebrationEvent({
        type: 'DAILY_COMPLETE',
        date: currentDate,
        totalRoutines: nextProg.totalPlanned,
        currentStreak: nextStreaks.currentStreak,
      });
    }
  };

  // Routine Completion Handlers
  const handleToggleRoutine = (routine: Routine) => {
    const existingLogIndex = logs.findIndex(
      (l) => l.routineId === routine.id && l.date === currentDate
    );

    let updatedLogs: RoutineLog[];

    if (existingLogIndex >= 0) {
      const currentLog = logs[existingLogIndex];
      const nextCompleted = !currentLog.isCompleted;

      const updatedLog: RoutineLog = {
        ...currentLog,
        isCompleted: nextCompleted,
        isSkipped: false,
        skipReason: null,
        loggedValue: nextCompleted ? routine.targetValue : 0,
        completedAt: nextCompleted ? Date.now() : 0,
      };

      updatedLogs = [...logs];
      updatedLogs[existingLogIndex] = updatedLog;

      if (nextCompleted) {
        SoundService.play('milestone', settings);
        checkDailyCelebrationTrigger(updatedLogs);
      } else {
        SoundService.play('tap', settings);
      }
    } else {
      const newLog: RoutineLog = {
        id: Date.now(),
        routineId: routine.id,
        date: currentDate,
        isCompleted: true,
        isSkipped: false,
        skipReason: null,
        loggedValue: routine.targetValue,
        durationMinutesLogged: routine.durationMinutes,
        notes: '',
        rescheduledToDate: null,
        completedAt: Date.now(),
      };
      updatedLogs = [...logs, newLog];
      SoundService.play('milestone', settings);
      checkDailyCelebrationTrigger(updatedLogs);
    }

    setLogs(updatedLogs);
    StorageService.saveLogs(updatedLogs);
  };

  const handleMeasurableConfirm = (value: number, notes: string) => {
    if (!measurableModalRoutine) return;
    const routine = measurableModalRoutine;

    const existingLogIndex = logs.findIndex(
      (l) => l.routineId === routine.id && l.date === currentDate
    );

    let updatedLogs: RoutineLog[];

    if (existingLogIndex >= 0) {
      const currentLog = logs[existingLogIndex];
      const updatedLog: RoutineLog = {
        ...currentLog,
        isCompleted: true,
        isSkipped: false,
        skipReason: null,
        loggedValue: value,
        notes,
        completedAt: Date.now(),
      };
      updatedLogs = [...logs];
      updatedLogs[existingLogIndex] = updatedLog;
    } else {
      const newLog: RoutineLog = {
        id: Date.now(),
        routineId: routine.id,
        date: currentDate,
        isCompleted: true,
        isSkipped: false,
        skipReason: null,
        loggedValue: value,
        durationMinutesLogged: routine.durationMinutes,
        notes,
        rescheduledToDate: null,
        completedAt: Date.now(),
      };
      updatedLogs = [...logs, newLog];
    }

    setLogs(updatedLogs);
    StorageService.saveLogs(updatedLogs);
    setMeasurableModalRoutine(null);
    SoundService.play('milestone', settings);
    checkDailyCelebrationTrigger(updatedLogs);
  };

  const handleSkipRoutine = (routine: Routine, reason: string) => {
    const existingLogIndex = logs.findIndex(
      (l) => l.routineId === routine.id && l.date === currentDate
    );

    let updatedLogs: RoutineLog[];

    if (existingLogIndex >= 0) {
      const currentLog = logs[existingLogIndex];
      const updatedLog: RoutineLog = {
        ...currentLog,
        isCompleted: false,
        isSkipped: true,
        skipReason: reason,
      };
      updatedLogs = [...logs];
      updatedLogs[existingLogIndex] = updatedLog;
    } else {
      const newLog: RoutineLog = {
        id: Date.now(),
        routineId: routine.id,
        date: currentDate,
        isCompleted: false,
        isSkipped: true,
        skipReason: reason,
        loggedValue: 0,
        durationMinutesLogged: 0,
        notes: '',
        rescheduledToDate: null,
        completedAt: 0,
      };
      updatedLogs = [...logs, newLog];
    }

    setLogs(updatedLogs);
    StorageService.saveLogs(updatedLogs);
    SoundService.play('tap', settings);
  };

  const handleRescheduleConfirm = (targetDate: string) => {
    if (!rescheduleModalRoutine) return;
    const routine = rescheduleModalRoutine;

    const existingLogIndex = logs.findIndex(
      (l) => l.routineId === routine.id && l.date === currentDate
    );

    let updatedLogs: RoutineLog[];

    if (existingLogIndex >= 0) {
      const currentLog = logs[existingLogIndex];
      const updatedLog: RoutineLog = {
        ...currentLog,
        isCompleted: false,
        isSkipped: true,
        skipReason: `Rescheduled to ${targetDate}`,
        rescheduledToDate: targetDate,
      };
      updatedLogs = [...logs];
      updatedLogs[existingLogIndex] = updatedLog;
    } else {
      const newLog: RoutineLog = {
        id: Date.now(),
        routineId: routine.id,
        date: currentDate,
        isCompleted: false,
        isSkipped: true,
        skipReason: `Rescheduled to ${targetDate}`,
        loggedValue: 0,
        durationMinutesLogged: 0,
        notes: '',
        rescheduledToDate: targetDate,
        completedAt: 0,
      };
      updatedLogs = [...logs, newLog];
    }

    setLogs(updatedLogs);
    StorageService.saveLogs(updatedLogs);
    setRescheduleModalRoutine(null);
    SoundService.play('tap', settings);
  };

  // Helper to format reminder display time
  const formatReminderTimeStr = (hour: number, minute: number) => {
    if (settings.timeFormat === '24h') {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    const val = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${val}:${String(minute).padStart(2, '0')} ${ampm}`;
  };

  // Routine CRUD
  const handleSaveRoutine = (routine: Routine) => {
    const exists = routines.some((r) => r.id === routine.id);
    let updated: Routine[];
    if (exists) {
      updated = routines.map((r) => (r.id === routine.id ? routine : r));
    } else {
      updated = [...routines, routine];
    }
    setRoutines(updated);
    StorageService.saveRoutines(updated);
    setRoutineModalState({ isOpen: false, initialRoutine: null });
    setQuickAddModalOpen(false);

    // Synchronize real OS notification schedule
    if (routine.reminderEnabled && !routine.isPaused && settings.notificationsEnabled) {
      NotificationService.scheduleRoutine(routine, settings);
      setRoutineFeedbackNotice(
        `Routine saved • Reminder scheduled for ${formatReminderTimeStr(routine.timeHour, routine.timeMinute)}`
      );
    } else {
      NotificationService.cancelRoutine(routine.id);
      setRoutineFeedbackNotice('Routine saved • Reminder disabled');
    }
    setTimeout(() => setRoutineFeedbackNotice(null), 3500);
  };

  const handleTogglePauseRoutine = (routine: Routine) => {
    const nextPaused = !routine.isPaused;
    const updated = routines.map((r) =>
      r.id === routine.id ? { ...r, isPaused: nextPaused } : r
    );
    setRoutines(updated);
    StorageService.saveRoutines(updated);

    if (nextPaused) {
      NotificationService.cancelRoutine(routine.id);
      setRoutineFeedbackNotice(`Routine "${routine.name}" paused • Reminder canceled`);
    } else if (routine.reminderEnabled && settings.notificationsEnabled) {
      NotificationService.scheduleRoutine({ ...routine, isPaused: false }, settings);
      setRoutineFeedbackNotice(
        `Routine "${routine.name}" resumed • Reminder active at ${formatReminderTimeStr(
          routine.timeHour,
          routine.timeMinute
        )}`
      );
    }
    setTimeout(() => setRoutineFeedbackNotice(null), 3000);
  };

  const handleDeleteRoutine = (routineId: number) => {
    const target = routines.find((r) => r.id === routineId);
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);
    StorageService.saveRoutines(updated);
    NotificationService.cancelRoutine(routineId);
    setRoutineFeedbackNotice(
      target ? `Routine "${target.name}" deleted • Reminder removed` : 'Routine deleted • Reminder removed'
    );
    setTimeout(() => setRoutineFeedbackNotice(null), 3000);
  };

  // Goal CRUD
  const handleSaveGoal = (goal: Goal) => {
    const exists = goals.some((g) => g.id === goal.id);
    let updated: Goal[];
    if (exists) {
      updated = goals.map((g) => (g.id === goal.id ? goal : g));
    } else {
      updated = [...goals, goal];
    }
    setGoals(updated);
    StorageService.saveGoals(updated);
    setGoalModalState({ isOpen: false, initialGoal: null });
    if (selectedGoalDetails?.id === goal.id) {
      setSelectedGoalDetails(goal);
    }
  };

  const handleGoalStatusChange = (status: GoalStatus) => {
    if (!selectedGoalDetails) return;
    const updatedGoal = { ...selectedGoalDetails, status, updatedAt: Date.now() };
    handleSaveGoal(updatedGoal);

    if (status === GoalStatus.COMPLETED) {
      setCelebrationEvent({
        type: 'GOAL_COMPLETE',
        goalId: updatedGoal.id,
        goalTitle: updatedGoal.title,
        targetValue: updatedGoal.targetValue,
        unit: updatedGoal.unit,
      });
    }
  };

  const handleUpdateGoalManualProgress = (val: number) => {
    if (!selectedGoalDetails) return;
    const updatedGoal = {
      ...selectedGoalDetails,
      currentValue: val,
      updatedAt: Date.now(),
      status: val >= selectedGoalDetails.targetValue ? GoalStatus.COMPLETED : selectedGoalDetails.status,
    };
    handleSaveGoal(updatedGoal);

    if (val >= selectedGoalDetails.targetValue) {
      setCelebrationEvent({
        type: 'GOAL_COMPLETE',
        goalId: updatedGoal.id,
        goalTitle: updatedGoal.title,
        targetValue: updatedGoal.targetValue,
        unit: updatedGoal.unit,
      });
    }
  };

  const handleDeleteGoal = (goalId: number) => {
    const updated = goals.filter((g) => g.id !== goalId);
    setGoals(updated);
    StorageService.saveGoals(updated);
    setSelectedGoalDetails(null);
  };

  // Reflection Save
  const handleSaveReflection = (
    rating: number,
    wentWell: string,
    couldImprove: string,
    notes: string
  ) => {
    const existingIndex = reflections.findIndex((r) => r.date === currentDate);
    let updatedReflections: DailyReflection[];

    if (existingIndex >= 0) {
      const current = reflections[existingIndex];
      const updated: DailyReflection = {
        ...current,
        rating,
        wentWell,
        couldImprove,
        notes,
      };
      updatedReflections = [...reflections];
      updatedReflections[existingIndex] = updated;
    } else {
      const newRef: DailyReflection = {
        id: Date.now(),
        date: currentDate,
        rating,
        wentWell,
        couldImprove,
        notes,
        createdAt: Date.now(),
      };
      updatedReflections = [...reflections, newRef];
    }

    setReflections(updatedReflections);
    StorageService.saveReflections(updatedReflections);
    setReflectionModalOpen(false);
  };

  // Settings Save
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    if (newSettings.theme && newSettings.theme !== themePreference) {
      setThemePreference(newSettings.theme);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-text-primary)] selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Preloader on startup */}
      {isPreloading && (
        <Preloader
          onInitialize={initializeApplication}
          onComplete={handlePreloaderComplete}
          reduceMotion={settings.reduceMotion}
          isDarkMode={isDark}
        />
      )}

      {/* App PIN Lock Screen */}
      {!isPreloading && settings.appLockEnabled && Boolean(settings.appLockPin) && isLocked && (
        <AppLockModal
          correctPin={settings.appLockPin || ''}
          settings={settings}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* System Status Bar for mobile views */}
      <SystemStatusBar isDarkMode={isDark} timeFormat={settings.timeFormat} />

      {/* Navigation Bars */}
      <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />

      {/* Main Screen Content */}
      <main className={`max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 ${!isPreloading ? 'himaleh-dashboard-enter' : ''}`}>
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            progress={dailyProgress}
            streakStats={streakStats}
            dashboardState={dashboardState}
            settings={settings}
            goals={goals}
            reflection={currentReflection}
            onToggleRoutine={handleToggleRoutine}
            onSkipRoutine={handleSkipRoutine}
            onRequestMeasurable={(routine) => setMeasurableModalRoutine(routine)}
            onRequestReschedule={(routine) => setRescheduleModalRoutine(routine)}
            onRequestEditRoutine={(routine) =>
              setRoutineModalState({ isOpen: true, initialRoutine: routine })
            }
            onOpenQuickAdd={() => setQuickAddModalOpen(true)}
            onOpenAddRoutine={() =>
              setRoutineModalState({ isOpen: true, initialRoutine: null })
            }
            onOpenReflection={() => setReflectionModalOpen(true)}
          />
        )}

        {currentScreen === 'goals' && (
          <GoalsScreen
            goals={goals}
            routines={routines}
            goalProgressMap={goalProgressMap}
            onSelectGoal={(goal) => setSelectedGoalDetails(goal)}
            onOpenNewGoal={() => setGoalModalState({ isOpen: true, initialGoal: null })}
          />
        )}

        {currentScreen === 'routines' && (
          <RoutinesScreen
            routines={routines}
            goals={goals}
            logs={logs}
            timeFormat={settings.timeFormat}
            onOpenNewRoutine={() =>
              setRoutineModalState({ isOpen: true, initialRoutine: null })
            }
            onOpenQuickAdd={() => setQuickAddModalOpen(true)}
            onEditRoutine={(routine) =>
              setRoutineModalState({ isOpen: true, initialRoutine: routine })
            }
            onTogglePauseRoutine={handleTogglePauseRoutine}
            onDeleteRoutine={handleDeleteRoutine}
          />
        )}

        {currentScreen === 'analytics' && (
          <AnalyticsScreen
            streakStats={streakStats}
            routines={routines}
            goals={goals}
            logs={logs}
            reflections={reflections}
            settings={settings}
            onSelectDate={(d) => {
              setCurrentDate(d);
              setCurrentScreen('dashboard');
            }}
            onNavigateToDashboard={() => setCurrentScreen('dashboard')}
            onNavigateToGoals={() => setCurrentScreen('goals')}
            onNavigateToRoutines={() => setCurrentScreen('routines')}
            onSelectGoal={(goal) => setSelectedGoalDetails(goal)}
            onSelectRoutine={(routine) =>
              setRoutineModalState({ isOpen: true, initialRoutine: routine })
            }
            onTriggerCelebration={(event) => setCelebrationEvent(event)}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onDataReload={reloadData}
            onReplayPreloader={() => setIsPreloading(true)}
          />
        )}
      </main>

      {/* Floating System Confirmation Toast */}
      {routineFeedbackNotice && (
        <div
          id="system-feedback-toast"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-2xl border border-neutral-700/60 dark:border-neutral-300/60 animate-fade-in pointer-events-none"
        >
          <Bell className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{routineFeedbackNotice}</span>
        </div>
      )}

      {/* Global Modals & Dialogs */}
      <CelebrationModal
        event={celebrationEvent}
        onDismiss={() => setCelebrationEvent(null)}
      />

      <CompleteMeasurableModal
        routine={measurableModalRoutine}
        onDismiss={() => setMeasurableModalRoutine(null)}
        onConfirm={handleMeasurableConfirm}
      />

      <RescheduleModal
        routine={rescheduleModalRoutine}
        currentDate={currentDate}
        onDismiss={() => setRescheduleModalRoutine(null)}
        onConfirm={handleRescheduleConfirm}
      />

      {reflectionModalOpen && (
        <DailyReflectionModal
          date={currentDate}
          existingReflection={currentReflection}
          onDismiss={() => setReflectionModalOpen(false)}
          onSave={handleSaveReflection}
        />
      )}

      {routineModalState.isOpen && (
        <AddEditRoutineModal
          initialRoutine={routineModalState.initialRoutine}
          goals={goals}
          is24HourFormat={settings.timeFormat === '24h'}
          onDismiss={() => setRoutineModalState({ isOpen: false, initialRoutine: null })}
          onSave={handleSaveRoutine}
        />
      )}

      {goalModalState.isOpen && (
        <AddEditGoalModal
          initialGoal={goalModalState.initialGoal}
          onDismiss={() => setGoalModalState({ isOpen: false, initialGoal: null })}
          onSave={handleSaveGoal}
        />
      )}

      {selectedGoalDetails && (
        <GoalDetailsModal
          goal={selectedGoalDetails}
          progress={goalProgressMap[selectedGoalDetails.id] || null}
          linkedRoutines={routines.filter((r) => r.linkedGoalId === selectedGoalDetails.id)}
          timeFormat={settings.timeFormat}
          onDismiss={() => setSelectedGoalDetails(null)}
          onEdit={() => {
            const g = selectedGoalDetails;
            setSelectedGoalDetails(null);
            setGoalModalState({ isOpen: true, initialGoal: g });
          }}
          onDelete={() => handleDeleteGoal(selectedGoalDetails.id)}
          onStatusChange={handleGoalStatusChange}
          onUpdateManualProgress={handleUpdateGoalManualProgress}
        />
      )}

      {quickAddModalOpen && (
        <QuickAddRoutineModal
          onDismiss={() => setQuickAddModalOpen(false)}
          onSave={handleSaveRoutine}
        />
      )}
    </div>
  );
};
export default App;
