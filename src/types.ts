// Core Data Types for Himaleh Personal Consistency Tracker

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export interface Milestone {
  id: number;
  goalId: number;
  title: string;
  targetValue: number;
  isCompleted: boolean;
  dueDate: string; // YYYY-MM-DD
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  category: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  targetValue: number;
  currentValue: number;
  unit: string;
  priority: GoalPriority;
  status: GoalStatus;
  motivation: string;
  createdAt: number;
  updatedAt: number;
}

export enum RoutineFrequency {
  DAILY = 'DAILY',
  WEEKDAYS = 'WEEKDAYS',
  WEEKENDS = 'WEEKENDS',
  WEEKLY = 'WEEKLY',
  CUSTOM_DAYS = 'CUSTOM_DAYS',
}

export enum TaskType {
  CHECKBOX = 'CHECKBOX',
  DURATION = 'DURATION',
  QUANTITY = 'QUANTITY',
  COUNT = 'COUNT',
  TIME_BASED = 'TIME_BASED',
}

export enum RoutinePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Routine {
  id: number;
  name: string;
  description: string;
  category: string;
  linkedGoalId: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  timeHour: number; // 0-23
  timeMinute: number; // 0-59
  durationMinutes: number;
  frequency: RoutineFrequency;
  frequencyDays: string; // e.g. "1,2,3,4,5,6,7" (1=Monday ... 7=Sunday)
  weeklyTargetTimes: number;
  taskType: TaskType;
  targetValue: number;
  unit: string;
  priority: RoutinePriority;
  reminderEnabled: boolean;
  isPaused: boolean;
  createdAt: number;
}

export interface RoutineLog {
  id: number;
  routineId: number;
  date: string; // YYYY-MM-DD
  isCompleted: boolean;
  isSkipped: boolean;
  skipReason: string | null;
  loggedValue: number;
  durationMinutesLogged: number;
  notes: string;
  rescheduledToDate: string | null;
  completedAt: number;
}

export interface DailyReflection {
  id: number;
  date: string; // YYYY-MM-DD
  rating: number; // 1-5
  wentWell: string;
  couldImprove: string;
  notes: string;
  createdAt: number;
}

export interface UserSettings {
  userName: string;
  morningReminderTime: string; // HH:mm
  eveningReflectionTime: string; // HH:mm
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  strictAccountability: boolean;
  restDayFrequency: number; // e.g., 1 day/week
  isDarkMode: boolean;
  weeklyGoalTargetDays: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  scheduledTime: number; // timestamp
  type: string; // "ROUTINE_REMINDER" | "DAILY_REFLECTION" | "ACCOUNTABILITY_ALERT"
  isSent: boolean;
  routineId: number | null;
}

export interface DailyProgressResult {
  date: string;
  totalPlanned: number;
  completedCount: number;
  skippedCount: number;
  completionPercentage: number;
  plannedRoutines: Routine[];
  completedRoutineIds: Set<number>;
  skippedRoutineIds: Set<number>;
  routineLogMap: Record<number, RoutineLog>;
}

export interface GoalProgressResult {
  goalId: number;
  currentValue: number;
  targetValue: number;
  percentage: number;
  completedRoutinesCount: number;
  totalLinkedRoutines: number;
  linkedRoutineIds: number[];
  isCompleted: boolean;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  weeklyConsistencyPercentage: number;
  monthlyConsistencyPercentage: number;
  totalDaysLogged: number;
  totalCompletions: number;
  streakHistory: Array<{ date: string; completed: boolean }>;
}

export type DashboardState =
  | { type: 'REST_DAY'; title: string; message: string; emoji: string }
  | { type: 'COMPLETED'; title: string; message: string; emoji: string; streak: number }
  | { type: 'IN_PROGRESS'; title: string; message: string; emoji: string; remainingCount: number }
  | { type: 'ACCOUNTABILITY'; title: string; message: string; emoji: string; missedRoutines: Routine[]; severity: 'MILD' | 'FIRM' | 'STRICT' };

export type CelebrationEvent =
  | { type: 'DAILY_COMPLETE'; date: string; totalRoutines: number; currentStreak: number }
  | { type: 'WEEKLY_COMPLETE'; completedDays: number; targetDays: number; consistencyPct: number }
  | { type: 'GOAL_COMPLETE'; goalId: number; goalTitle: string; targetValue: number; unit: string };

export type ScreenNav = 'dashboard' | 'goals' | 'routines' | 'analytics' | 'settings';
