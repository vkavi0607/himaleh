import React, { useState, useEffect, useMemo } from 'react';
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

export const App: React.FC = () => {
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

  // Initialize data on mount
  const reloadData = () => {
    const initialized = StorageService.initializeIfEmpty();
    setGoals(initialized.goals);
    setRoutines(initialized.routines);
    setLogs(initialized.logs);
    setReflections(initialized.reflections);
    setSettings(initialized.settings);

    if (initialized.settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Sync settings theme
  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.isDarkMode]);

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
        checkDailyCelebrationTrigger(updatedLogs);
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
  };

  const handleTogglePauseRoutine = (routine: Routine) => {
    const updated = routines.map((r) =>
      r.id === routine.id ? { ...r, isPaused: !r.isPaused } : r
    );
    setRoutines(updated);
    StorageService.saveRoutines(updated);
  };

  const handleDeleteRoutine = (routineId: number) => {
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);
    StorageService.saveRoutines(updated);
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
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 selection:bg-emerald-500 selection:text-white">
      {/* Navigation Bars */}
      <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />

      {/* Main Screen Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
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
            logs={logs}
            reflections={reflections}
            onSelectDate={(d) => {
              setCurrentDate(d);
              setCurrentScreen('dashboard');
            }}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onDataReload={reloadData}
          />
        )}
      </main>

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
